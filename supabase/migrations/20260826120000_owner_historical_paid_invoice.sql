-- ===========================================================================
-- Historical already-paid invoice entry (owner bookkeeping / tax preparation)
-- ===========================================================================
--
-- WHY THIS EXISTS
--
-- Recording revenue that was already invoiced AND already paid before it was
-- entered into Cogniiq currently requires three separate client round trips:
--   create_owner_invoice -> issue_owner_invoice -> record_owner_invoice_payment
-- If the third call fails, the owner is left with an ISSUED, UNPAID invoice —
-- a historical, settled transaction silently becomes an open receivable in
-- "Offene Forderungen" and in every revenue/tax figure derived from it.
--
-- This migration adds ONE narrowly scoped, owner-gated, idempotent RPC that
-- performs all three steps inside a single transaction, so the entry either
-- lands complete (issued + numbered + paid in full) or not at all.
--
-- WHAT IT DELIBERATELY DOES *NOT* DO
--
--   * It sends nothing. It never touches public.owner_automation_jobs, which
--     is the sole enqueue point for every customer-facing e-mail. All three
--     enqueue functions (owner_enqueue_automation_job, owner_retry_automation_job,
--     owner_enqueue_offer_email) are keyed on an OFFER; an invoice created here
--     has no offer and no job, so no message can be produced from this path.
--   * It does not accept a client-supplied paid amount. The amount is read back
--     from owner_invoices.gross_total_cents, which is trigger-owned, so the
--     payment can only ever be exactly the full server-computed gross.
--   * It does not accept a client-supplied authoritative invoice number. The
--     canonical RE-YYYY-NNNN number comes from the same concurrency-safe
--     per-entity counter that issue_owner_invoice uses. The owner's ORIGINAL
--     document reference is recorded in the existing, non-authoritative
--     external_reference column.
--   * It does not weaken any existing guard: the same preflight checks as
--     issue_owner_invoice apply, the payment goes through owner_validate_payment
--     and owner_apply_payment, and every write is captured by the append-only
--     audit trigger.
--
-- Additive only. No existing function, table, policy, grant or row is altered.
-- ===========================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Provenance flag.
--
-- Marks an invoice that was entered retroactively as an already-settled
-- historical transaction rather than issued to a customer in the normal flow.
-- Metadata only: it changes no accounting behaviour, no totals and no status.
-- It is written exclusively by the SECURITY DEFINER function below — it is not
-- part of the column-level UPDATE grant on owner_invoices, so a browser client
-- cannot set or clear it.
-- ---------------------------------------------------------------------------
alter table public.owner_invoices
  add column if not exists historical_entry boolean not null default false;

comment on column public.owner_invoices.historical_entry is
  'True when the invoice was recorded retroactively as an already-paid historical transaction '
  '(record_owner_historical_paid_invoice). Metadata only; never affects totals, status or tax timing.';

commit;

begin;

-- ---------------------------------------------------------------------------
-- 2. record_owner_historical_paid_invoice
--
--     create draft -> issue (server number) -> record full payment,
--     atomically, owner-gated and UUID-idempotent like every other finance RPC.
--
--     p_header   same shape as create_owner_invoice's header. issue_date is the
--                RECHNUNGSDATUM.
--     p_lines    same shape as create_owner_invoice's lines.
--     p_payment  { payment_date, method, reference, note } — payment_date is the
--                ZAHLUNGSDATUM and is stored independently of issue_date. These
--                are two distinct accounting facts (§11 EStG cash basis vs. the
--                invoice document date) and neither is derived from the other.
-- ---------------------------------------------------------------------------
create or replace function public.record_owner_historical_paid_invoice(
  p_idempotency_key uuid,
  p_header jsonb,
  p_lines jsonb,
  p_payment jsonb
)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_existing jsonb;
  v_entity uuid;
  v_id uuid;
  v_line jsonb;
  v_pay_date date;
  v_issue_date date;
  inv record;
  v_lines int;
  v_unknown int;
  v_number text;
  v_next bigint;
  v_pid uuid;
  v_result jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  v_existing := public.owner_claim_idempotency(p_idempotency_key, 'record_owner_historical_paid_invoice');
  if v_existing is not null then return v_existing; end if;

  v_entity := (p_header->>'business_entity_id')::uuid;
  if v_entity is null then raise exception 'business_entity_id is required'; end if;
  if p_lines is null or jsonb_array_length(p_lines) < 1 then raise exception 'at least one invoice line is required'; end if;

  v_issue_date := nullif(p_header->>'issue_date','')::date;
  if v_issue_date is null then raise exception 'issue_date is required'; end if;

  v_pay_date := nullif(p_payment->>'payment_date','')::date;
  if v_pay_date is null then raise exception 'payment_date is required'; end if;
  -- A payment cannot predate the invoice it settles.
  if v_pay_date < v_issue_date then raise exception 'payment_date must not be before issue_date'; end if;

  -- --- create (identical column set to create_owner_invoice) ---------------
  insert into public.owner_invoices (business_entity_id, organization_id, client_account_id, owner_customer_id,
    engagement_id, invoice_number, status, issue_date, service_date, service_period_start, service_period_end,
    due_date, currency, notes, external_reference, historical_entry, created_by)
  values (v_entity, nullif(p_header->>'organization_id','')::uuid, nullif(p_header->>'client_account_id','')::uuid,
    nullif(p_header->>'owner_customer_id','')::uuid, nullif(p_header->>'engagement_id','')::uuid,
    null, 'draft',
    v_issue_date, nullif(p_header->>'service_date','')::date,
    nullif(p_header->>'service_period_start','')::date, nullif(p_header->>'service_period_end','')::date,
    coalesce(nullif(p_header->>'due_date','')::date, v_issue_date), coalesce(p_header->>'currency','EUR'),
    p_header->>'notes', p_header->>'external_reference', true, auth.uid())
  returning id into v_id;

  for v_line in select * from jsonb_array_elements(p_lines) loop
    insert into public.owner_invoice_lines (invoice_id, description, quantity_milli, unit_price_cents, vat_rate_bp, vat_treatment, sort_order)
    values (v_id, v_line->>'description', coalesce((v_line->>'quantity_milli')::bigint, 1000), (v_line->>'unit_price_cents')::bigint,
      coalesce((v_line->>'vat_rate_bp')::int, 1900), coalesce(v_line->>'vat_treatment','standard'), coalesce((v_line->>'sort_order')::int, 0));
  end loop;

  -- --- issue (same preflight + counter as issue_owner_invoice) -------------
  select * into inv from public.owner_invoices where id = v_id for update;
  if inv.service_date is null and inv.service_period_start is null then raise exception 'service date or period is required'; end if;
  if inv.currency not in ('EUR', 'CHF', 'USD') then raise exception 'unsupported currency %', inv.currency; end if;

  select count(*), count(*) filter (where vat_treatment = 'unknown') into v_lines, v_unknown
  from public.owner_invoice_lines where invoice_id = v_id;
  if v_lines < 1 then raise exception 'invoice has no lines'; end if;
  if v_unknown > 0 then raise exception 'invoice has unresolved VAT treatments'; end if;
  if inv.net_total_cents <= 0 or inv.gross_total_cents <= 0 then raise exception 'invoice totals must be positive'; end if;

  insert into public.owner_invoice_counters (business_entity_id) values (inv.business_entity_id) on conflict (business_entity_id) do nothing;
  select next_number into v_next from public.owner_invoice_counters where business_entity_id = inv.business_entity_id for update;
  v_number := 'RE-' || to_char(inv.issue_date, 'YYYY') || '-' || lpad(v_next::text, 4, '0');
  update public.owner_invoice_counters set next_number = v_next + 1, updated_at = now() where business_entity_id = inv.business_entity_id;

  update public.owner_invoices set invoice_number = v_number, status = 'issued', issued_at = now() where id = v_id;

  -- --- pay in full ---------------------------------------------------------
  -- The amount is the trigger-computed server gross, never a client value, so
  -- amount_paid_cents lands exactly on gross_total_cents and the open balance
  -- is zero. owner_apply_payment then derives status = 'paid'.
  insert into public.owner_payments (business_entity_id, kind, direction, payment_date, amount_cents,
    invoice_id, payment_method, reference, notes, created_by)
  values (v_entity, 'income', 'inflow', v_pay_date, inv.gross_total_cents, v_id,
    nullif(p_payment->>'method',''), nullif(p_payment->>'reference',''), nullif(p_payment->>'note',''), auth.uid())
  returning id into v_pid;

  -- Fail loudly rather than leaving a half-recorded historical transaction.
  select * into inv from public.owner_invoices where id = v_id;
  if inv.status <> 'paid' or inv.amount_paid_cents <> inv.gross_total_cents then
    raise exception 'historical invoice did not settle in full (status %, paid %, gross %)',
      inv.status, inv.amount_paid_cents, inv.gross_total_cents;
  end if;

  v_result := jsonb_build_object(
    'invoice_id', v_id,
    'invoice_number', v_number,
    'status', inv.status,
    'payment_id', v_pid,
    'amount_paid_cents', inv.amount_paid_cents,
    'gross_total_cents', inv.gross_total_cents,
    'issue_date', inv.issue_date,
    'payment_date', v_pay_date,
    'historical_entry', true
  );
  update public.owner_finance_requests set result = v_result where idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;

revoke execute on function public.record_owner_historical_paid_invoice(uuid, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.record_owner_historical_paid_invoice(uuid, jsonb, jsonb, jsonb) to authenticated, service_role;

commit;
