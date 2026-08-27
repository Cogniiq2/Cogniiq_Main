-- ===========================================================================
-- Owner finance: multiple payments per invoice, recurring REVENUE contracts,
-- and structured bulk import. ADDITIVE — nothing existing is rewritten.
--
-- WHAT THIS DOES NOT DO
-- ---------------------
-- No bank connection, no bank API, no reconciliation, no customer email, no
-- outbound communication of any kind. Every function here is owner-gated
-- internal bookkeeping. None of them writes owner_automation_jobs, calls an
-- enqueue/email function, or touches an offer-communication table. That is
-- asserted structurally by src/lib/ownerFinance/financeWriteSafety.test.ts and
-- behaviourally by .github/scripts/sql/finance-multipay-tests.sql.
--
-- WHAT ALREADY WORKED, AND IS THEREFORE NOT TOUCHED
-- -------------------------------------------------
-- owner_apply_payment already SUMS every owner_payments row per invoice and
-- derives paid / partially_paid from that sum, so multiple payments against one
-- invoice were already supported by the canonical model. owner_tax_period_inputs
-- already allocates each payment's net and VAT PROPORTIONALLY by payment_date,
-- so payments spanning quarters already land in the right period. Neither is
-- reimplemented here; both are pinned by tests instead.
--
-- THE ONE BEHAVIOURAL TIGHTENING
-- ------------------------------
-- owner_validate_payment gains an overpayment guard. Previously the sum of
-- payments could exceed an invoice's gross and simply read as 'paid'. That is a
-- bookkeeping error, not a state worth representing, so it is now rejected. This
-- affects every payment path, which is deliberate: a single canonical rule beats
-- one rule per entry point.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Overpayment guard on the canonical payment validator.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_validate_payment()
returns trigger language plpgsql set search_path = public, pg_temp as $$
declare inv record; exp record; txp record; v_other bigint;
begin
  if new.kind in ('income', 'owner_contribution', 'tax_refund') and new.direction <> 'inflow' then
    raise exception 'payment kind % must be an inflow', new.kind;
  end if;
  if new.kind in ('expense', 'owner_withdrawal', 'tax_payment') and new.direction <> 'outflow' then
    raise exception 'payment kind % must be an outflow', new.kind;
  end if;
  if new.invoice_id is not null then
    select business_entity_id, status, gross_total_cents into inv from public.owner_invoices where id = new.invoice_id;
    if inv.business_entity_id <> new.business_entity_id then raise exception 'payment entity differs from linked invoice entity'; end if;
    if new.direction <> 'inflow' then raise exception 'invoice payments must be inflows'; end if;
    if inv.status in ('void', 'cancelled') then raise exception 'cannot record a payment against a % invoice', inv.status; end if;

    -- Overpayment guard. Sum the OTHER inflows against this invoice (excluding this
    -- row on UPDATE) and refuse anything that would push the total past the
    -- server-computed gross. An invoice can be settled by any number of payments;
    -- it can never be settled by MORE than its own total.
    if inv.gross_total_cents is not null and inv.gross_total_cents > 0 then
      select coalesce(sum(p.amount_cents), 0) into v_other
      from public.owner_payments p
      where p.invoice_id = new.invoice_id and p.direction = 'inflow'
        and (tg_op = 'INSERT' or p.id <> new.id);
      if v_other + new.amount_cents > inv.gross_total_cents then
        -- An invoice recorded BEFORE this guard existed may already overpay. Refusing every
        -- write on such a row would strand it: its metadata could not be corrected and its
        -- amount could not even be reduced back into range, because the running total stays
        -- above gross either way. So on UPDATE, a change that does not INCREASE the recorded
        -- total is let through — that is repair, not new overpayment.
        --
        -- New overpayment stays impossible: an INSERT is always refused, and so is an UPDATE
        -- that raises the total. This is repair-only relaxation, not a credit-balance
        -- feature; a genuine customer overpayment still cannot be attached to an invoice.
        if not (tg_op = 'UPDATE' and v_other + new.amount_cents <= v_other + old.amount_cents) then
          raise exception 'payments (% cents) would exceed the invoice gross (% cents)',
            v_other + new.amount_cents, inv.gross_total_cents;
        end if;
      end if;
    end if;
  end if;
  if new.expense_id is not null then
    select business_entity_id, payment_status into exp from public.owner_expenses where id = new.expense_id;
    if exp.business_entity_id <> new.business_entity_id then raise exception 'payment entity differs from linked expense entity'; end if;
    if new.direction <> 'outflow' then raise exception 'expense payments must be outflows'; end if;
    if exp.payment_status = 'void' then raise exception 'cannot record a payment against a void expense'; end if;
  end if;
  if new.tax_payment_id is not null then
    select business_entity_id into txp from public.owner_tax_payments where id = new.tax_payment_id;
    if txp.business_entity_id <> new.business_entity_id then raise exception 'payment entity differs from linked tax payment entity'; end if;
  end if;
  return new;
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 2. Internal helpers shared by the historical, recurring and bulk paths.
--    Kept private (no anon/authenticated grant) so the only entry points are the
--    owner-gated RPCs below.
-- ---------------------------------------------------------------------------
begin;

-- Build + issue an invoice from a header and lines. Totals, VAT and the canonical
-- invoice number are ALWAYS server-derived; a client-supplied total is ignored by
-- construction because it is never read here.
create or replace function public.owner_build_issued_invoice(p_entity uuid, p_header jsonb, p_lines jsonb)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid; v_line jsonb; inv record; v_lines int; v_unknown int; v_number text; v_next bigint; v_issue date;
begin
  if p_lines is null or jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) < 1 then
    raise exception 'at least one invoice line is required';
  end if;
  v_issue := nullif(p_header->>'issue_date','')::date;
  if v_issue is null then raise exception 'issue_date is required'; end if;

  insert into public.owner_invoices (business_entity_id, organization_id, client_account_id, owner_customer_id,
    engagement_id, invoice_number, status, issue_date, service_date, service_period_start, service_period_end,
    due_date, currency, notes, external_reference, historical_entry, created_by)
  values (p_entity, nullif(p_header->>'organization_id','')::uuid, nullif(p_header->>'client_account_id','')::uuid,
    nullif(p_header->>'owner_customer_id','')::uuid, nullif(p_header->>'engagement_id','')::uuid,
    null, 'draft', v_issue,
    coalesce(nullif(p_header->>'service_date','')::date, v_issue),
    nullif(p_header->>'service_period_start','')::date, nullif(p_header->>'service_period_end','')::date,
    coalesce(nullif(p_header->>'due_date','')::date, v_issue), coalesce(p_header->>'currency','EUR'),
    p_header->>'notes', p_header->>'external_reference', coalesce((p_header->>'historical_entry')::boolean, true), auth.uid())
  returning id into v_id;

  for v_line in select * from jsonb_array_elements(p_lines) loop
    insert into public.owner_invoice_lines (invoice_id, description, quantity_milli, unit_price_cents,
      vat_rate_bp, vat_treatment, sort_order)
    values (v_id, v_line->>'description', coalesce((v_line->>'quantity_milli')::bigint, 1000),
      (v_line->>'unit_price_cents')::bigint, coalesce((v_line->>'vat_rate_bp')::int, 1900),
      coalesce(v_line->>'vat_treatment','standard'), coalesce((v_line->>'sort_order')::int, 0));
  end loop;

  -- Same preflight as issue_owner_invoice.
  select * into inv from public.owner_invoices where id = v_id for update;
  if inv.service_date is null and inv.service_period_start is null then raise exception 'service date or period is required'; end if;
  if inv.currency not in ('EUR','CHF','USD') then raise exception 'unsupported currency %', inv.currency; end if;
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
  return v_id;
end;
$$;
revoke execute on function public.owner_build_issued_invoice(uuid, jsonb, jsonb) from public, anon, authenticated;

-- Apply an array of ACTUAL payments to an invoice.
--
-- The amounts and dates here ARE client-supplied, deliberately: they are real
-- accounting facts the owner is transcribing, and the system cannot derive them.
-- Everything derived stays derived — the running total is checked against the
-- server's own gross, and the invoice status comes from owner_apply_payment.
create or replace function public.owner_apply_invoice_payments(p_invoice_id uuid, p_payments jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare inv record; v_pay jsonb; v_date date; v_amount bigint; v_sum bigint := 0; v_ids jsonb := '[]'::jsonb; v_pid uuid;
begin
  if p_payments is null or jsonb_typeof(p_payments) <> 'array' then return jsonb_build_object('payment_ids','[]'::jsonb,'total_cents',0); end if;
  if jsonb_array_length(p_payments) > 60 then raise exception 'at most 60 payments per invoice'; end if;
  select * into inv from public.owner_invoices where id = p_invoice_id for update;
  if inv.id is null then raise exception 'invoice not found'; end if;

  for v_pay in select * from jsonb_array_elements(p_payments) loop
    v_date := nullif(v_pay->>'payment_date','')::date;
    v_amount := (v_pay->>'amount_cents')::bigint;
    if v_date is null then raise exception 'each payment requires a payment_date'; end if;
    if v_amount is null or v_amount <= 0 then raise exception 'each payment requires a positive amount_cents'; end if;
    -- Same rule the single-payment historical path already enforces: a payment
    -- settling an invoice cannot predate the invoice. Genuine ADVANCE payments
    -- (Anzahlung / Abschlagsrechnung) are a different accounting model and are
    -- deliberately NOT smuggled in here by relaxing this check.
    if v_date < inv.issue_date then raise exception 'payment_date % must not be before issue_date %', v_date, inv.issue_date; end if;
    v_sum := v_sum + v_amount;
    if v_sum > inv.gross_total_cents then
      raise exception 'payments (% cents) exceed the invoice gross (% cents)', v_sum, inv.gross_total_cents;
    end if;

    insert into public.owner_payments (business_entity_id, kind, direction, payment_date, amount_cents,
      invoice_id, organization_id, payment_method, reference, notes, created_by)
    values (inv.business_entity_id, 'income', 'inflow', v_date, v_amount, p_invoice_id, inv.organization_id,
      nullif(v_pay->>'method',''), nullif(v_pay->>'reference',''), nullif(v_pay->>'note',''), auth.uid())
    returning id into v_pid;
    v_ids := v_ids || to_jsonb(v_pid);
  end loop;

  return jsonb_build_object('payment_ids', v_ids, 'total_cents', v_sum);
end;
$$;
revoke execute on function public.owner_apply_invoice_payments(uuid, jsonb) from public, anon, authenticated;

commit;

-- ---------------------------------------------------------------------------
-- 3. Historical invoice with MANY payments (owner RPC).
--
--    record_owner_historical_paid_invoice (20260826120000) is UNCHANGED and still
--    handles the settle-in-full-with-one-payment case. This is a separate,
--    additive entry point for the instalment case, and it deliberately allows a
--    partially paid result.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.record_owner_historical_invoice_with_payments(
  p_idempotency_key uuid, p_header jsonb, p_lines jsonb, p_payments jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_existing jsonb; v_entity uuid; v_id uuid; inv record; v_applied jsonb; v_result jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  v_existing := public.owner_claim_idempotency(p_idempotency_key, 'record_owner_historical_invoice_with_payments');
  if v_existing is not null then return v_existing; end if;

  v_entity := (p_header->>'business_entity_id')::uuid;
  if v_entity is null then raise exception 'business_entity_id is required'; end if;

  v_id := public.owner_build_issued_invoice(v_entity, p_header, p_lines);
  v_applied := public.owner_apply_invoice_payments(v_id, p_payments);

  select * into inv from public.owner_invoices where id = v_id;
  v_result := jsonb_build_object(
    'invoice_id', v_id,
    'invoice_number', inv.invoice_number,
    'status', inv.status,
    'payment_ids', v_applied->'payment_ids',
    'payment_count', jsonb_array_length(coalesce(v_applied->'payment_ids','[]'::jsonb)),
    'amount_paid_cents', inv.amount_paid_cents,
    'net_total_cents', inv.net_total_cents,
    'vat_total_cents', inv.vat_total_cents,
    'gross_total_cents', inv.gross_total_cents,
    'open_cents', inv.gross_total_cents - coalesce(inv.amount_paid_cents, 0),
    'issue_date', inv.issue_date,
    'historical_entry', true);
  update public.owner_finance_requests set result = v_result where idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;
revoke execute on function public.record_owner_historical_invoice_with_payments(uuid, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.record_owner_historical_invoice_with_payments(uuid, jsonb, jsonb, jsonb) to authenticated, service_role;

-- Add ONE further payment to an existing invoice, with its metadata recorded in
-- the same statement rather than patched in afterwards from the browser.
create or replace function public.owner_add_invoice_payment(
  p_idempotency_key uuid, p_invoice_id uuid, p_payment jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_existing jsonb; inv record; v_applied jsonb; v_result jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  v_existing := public.owner_claim_idempotency(p_idempotency_key, 'owner_add_invoice_payment');
  if v_existing is not null then return v_existing; end if;

  v_applied := public.owner_apply_invoice_payments(p_invoice_id, jsonb_build_array(p_payment));
  select * into inv from public.owner_invoices where id = p_invoice_id;
  v_result := jsonb_build_object(
    'invoice_id', p_invoice_id, 'status', inv.status,
    'payment_ids', v_applied->'payment_ids',
    'amount_paid_cents', inv.amount_paid_cents,
    'gross_total_cents', inv.gross_total_cents,
    'open_cents', inv.gross_total_cents - coalesce(inv.amount_paid_cents, 0));
  update public.owner_finance_requests set result = v_result where idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;
revoke execute on function public.owner_add_invoice_payment(uuid, uuid, jsonb) from public, anon;
grant execute on function public.owner_add_invoice_payment(uuid, uuid, jsonb) to authenticated, service_role;

commit;

-- ---------------------------------------------------------------------------
-- 4. RECURRING REVENUE CONTRACTS.
--
--    Distinct from owner_subscriptions, which models MY OWN expense commitments.
--    This models money customers owe me on a recurring basis.
--
--    A contract is a FORECAST. It is never actual revenue: no row here is read
--    by owner_tax_period_inputs, which sees only owner_payments and
--    owner_invoices. Revenue becomes real when a month is deliberately posted
--    and produces a real invoice (+ real payments).
-- ---------------------------------------------------------------------------
begin;

create table if not exists public.owner_revenue_contracts (
  id uuid primary key default gen_random_uuid(),
  business_entity_id uuid not null references public.owner_business_entities(id) on delete restrict,
  organization_id uuid references public.organizations(id) on delete set null,
  client_account_id uuid references public.client_accounts(id) on delete set null,
  owner_customer_id uuid,
  -- Provenance only: which accepted offer this was transcribed from, if any.
  source_offer_id uuid,
  name text not null check (length(trim(name)) > 0),
  description text,
  status text not null default 'active' check (status in ('active','paused','ended')),
  start_date date not null,
  end_date date,
  billing_frequency text not null default 'monthly' check (billing_frequency in ('monthly','quarterly','yearly')),
  billing_day int check (billing_day between 1 and 28),
  currency text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  -- Server-derived from the contract lines by owner_recalc_revenue_contract_totals.
  expected_net_cents bigint not null default 0,
  expected_vat_cents bigint not null default 0,
  expected_gross_cents bigint not null default 0,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint owner_revenue_contracts_period_check check (end_date is null or end_date >= start_date)
);
create index if not exists owner_revenue_contracts_entity_idx on public.owner_revenue_contracts (business_entity_id, status);
create index if not exists owner_revenue_contracts_org_idx on public.owner_revenue_contracts (organization_id);

create table if not exists public.owner_revenue_contract_lines (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.owner_revenue_contracts(id) on delete cascade,
  description text not null,
  quantity_milli bigint not null default 1000 check (quantity_milli > 0),
  unit_price_cents bigint not null check (unit_price_cents >= 0),
  vat_rate_bp int not null default 1900 check (vat_rate_bp between 0 and 10000),
  vat_treatment text not null default 'standard',
  net_cents bigint not null default 0,
  vat_cents bigint not null default 0,
  gross_cents bigint not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists owner_revenue_contract_lines_contract_idx on public.owner_revenue_contract_lines (contract_id, sort_order);

-- One row per contract per billing period actually posted. The unique key is the
-- duplicate guard: posting March twice for the same contract is refused rather
-- than silently doubling the month's revenue.
create table if not exists public.owner_revenue_contract_postings (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.owner_revenue_contracts(id) on delete cascade,
  business_entity_id uuid not null references public.owner_business_entities(id) on delete restrict,
  period_start date not null,
  period_end date not null,
  invoice_id uuid references public.owner_invoices(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint owner_revenue_contract_postings_unique unique (contract_id, period_start)
);
create index if not exists owner_revenue_contract_postings_entity_idx on public.owner_revenue_contract_postings (business_entity_id, period_start);

commit;

-- Line + contract total recalculation, mirroring the invoice-line trigger style.
begin;

create or replace function public.owner_recalc_revenue_contract_line()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  new.net_cents := round(new.unit_price_cents::numeric * new.quantity_milli / 1000);
  new.vat_cents := case when new.vat_treatment = 'standard'
    then round(new.net_cents::numeric * new.vat_rate_bp / 10000) else 0 end;
  new.gross_cents := new.net_cents + new.vat_cents;
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.owner_recalc_revenue_contract_totals()
returns trigger language plpgsql set search_path = public, pg_temp as $$
declare v_contract uuid := coalesce(new.contract_id, old.contract_id);
begin
  update public.owner_revenue_contracts c set
    expected_net_cents   = coalesce((select sum(l.net_cents)   from public.owner_revenue_contract_lines l where l.contract_id = v_contract), 0),
    expected_vat_cents   = coalesce((select sum(l.vat_cents)   from public.owner_revenue_contract_lines l where l.contract_id = v_contract), 0),
    expected_gross_cents = coalesce((select sum(l.gross_cents) from public.owner_revenue_contract_lines l where l.contract_id = v_contract), 0),
    updated_at = now()
  where c.id = v_contract;
  return coalesce(new, old);
end;
$$;

drop trigger if exists owner_revenue_contract_lines_recalc_line on public.owner_revenue_contract_lines;
create trigger owner_revenue_contract_lines_recalc_line before insert or update on public.owner_revenue_contract_lines
  for each row execute function public.owner_recalc_revenue_contract_line();
drop trigger if exists owner_revenue_contract_lines_recalc_totals on public.owner_revenue_contract_lines;
create trigger owner_revenue_contract_lines_recalc_totals after insert or update or delete on public.owner_revenue_contract_lines
  for each row execute function public.owner_recalc_revenue_contract_totals();
drop trigger if exists owner_revenue_contracts_set_updated_at on public.owner_revenue_contracts;
create trigger owner_revenue_contracts_set_updated_at before update on public.owner_revenue_contracts
  for each row execute function public.set_updated_at();

commit;

-- ---------------------------------------------------------------------------
-- 5. Bulk import provenance. Gives every imported record a stable identity so a
--    retried batch cannot create a second copy.
-- ---------------------------------------------------------------------------
begin;

create table if not exists public.owner_finance_import_batches (
  id uuid primary key default gen_random_uuid(),
  business_entity_id uuid not null references public.owner_business_entities(id) on delete restrict,
  schema_version int not null,
  source text,
  invoice_count int not null default 0,
  payment_count int not null default 0,
  contract_count int not null default 0,
  summary jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists owner_finance_import_batches_entity_idx on public.owner_finance_import_batches (business_entity_id, created_at desc);

create table if not exists public.owner_finance_import_records (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.owner_finance_import_batches(id) on delete cascade,
  business_entity_id uuid not null references public.owner_business_entities(id) on delete restrict,
  record_type text not null check (record_type in ('invoice','revenue_contract')),
  client_import_id text not null check (length(trim(client_import_id)) > 0),
  invoice_id uuid references public.owner_invoices(id) on delete set null,
  contract_id uuid references public.owner_revenue_contracts(id) on delete set null,
  created_at timestamptz not null default now(),
  -- THE duplicate guard: the owner's own record id is unique per entity and type,
  -- across every batch. Re-importing the same JSON is refused, not duplicated.
  constraint owner_finance_import_records_unique unique (business_entity_id, record_type, client_import_id)
);
create index if not exists owner_finance_import_records_batch_idx on public.owner_finance_import_records (batch_id);

commit;

-- ---------------------------------------------------------------------------
-- 6. RLS + grants for the new tables. Owner-only, mirroring owner finance.
-- ---------------------------------------------------------------------------
begin;

do $$
declare t text;
begin
  foreach t in array array[
    'owner_revenue_contracts','owner_revenue_contract_lines','owner_revenue_contract_postings',
    'owner_finance_import_batches','owner_finance_import_records'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_owner_all', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.is_platform_owner()) with check (public.is_platform_owner())', t || '_owner_all', t);
    execute format('revoke all on table public.%I from public, anon, authenticated', t);
    execute format('grant select, insert, update on table public.%I to authenticated', t);
    execute format('grant select, insert, update, delete on table public.%I to service_role', t);
  end loop;
end;
$$;

-- Audit, using the same DB-authoritative factory as the rest of owner finance.
do $$
declare t text;
begin
  foreach t in array array['owner_revenue_contracts','owner_revenue_contract_postings','owner_finance_import_batches'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_audit', t);
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function public.owner_write_audit_row(%L)', t || '_audit', t, t);
  end loop;
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 7. Revenue-contract RPCs (owner only).
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_create_revenue_contract(
  p_idempotency_key uuid, p_header jsonb, p_lines jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_existing jsonb; v_entity uuid; v_id uuid; v_line jsonb; c record; v_result jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  v_existing := public.owner_claim_idempotency(p_idempotency_key, 'owner_create_revenue_contract');
  if v_existing is not null then return v_existing; end if;

  v_entity := (p_header->>'business_entity_id')::uuid;
  if v_entity is null then raise exception 'business_entity_id is required'; end if;
  if p_lines is null or jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) < 1 then
    raise exception 'a contract needs at least one line';
  end if;

  insert into public.owner_revenue_contracts (business_entity_id, organization_id, client_account_id,
    owner_customer_id, source_offer_id, name, description, status, start_date, end_date,
    billing_frequency, billing_day, currency, notes, created_by)
  values (v_entity, nullif(p_header->>'organization_id','')::uuid, nullif(p_header->>'client_account_id','')::uuid,
    nullif(p_header->>'owner_customer_id','')::uuid, nullif(p_header->>'source_offer_id','')::uuid,
    p_header->>'name', p_header->>'description', coalesce(p_header->>'status','active'),
    (p_header->>'start_date')::date, nullif(p_header->>'end_date','')::date,
    coalesce(p_header->>'billing_frequency','monthly'), nullif(p_header->>'billing_day','')::int,
    coalesce(p_header->>'currency','EUR'), p_header->>'notes', auth.uid())
  returning id into v_id;

  for v_line in select * from jsonb_array_elements(p_lines) loop
    insert into public.owner_revenue_contract_lines (contract_id, description, quantity_milli,
      unit_price_cents, vat_rate_bp, vat_treatment, sort_order)
    values (v_id, v_line->>'description', coalesce((v_line->>'quantity_milli')::bigint, 1000),
      (v_line->>'unit_price_cents')::bigint, coalesce((v_line->>'vat_rate_bp')::int, 1900),
      coalesce(v_line->>'vat_treatment','standard'), coalesce((v_line->>'sort_order')::int, 0));
  end loop;

  select * into c from public.owner_revenue_contracts where id = v_id;
  v_result := jsonb_build_object('contract_id', v_id, 'name', c.name, 'status', c.status,
    'expected_net_cents', c.expected_net_cents, 'expected_vat_cents', c.expected_vat_cents,
    'expected_gross_cents', c.expected_gross_cents);
  update public.owner_finance_requests set result = v_result where idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;
revoke execute on function public.owner_create_revenue_contract(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.owner_create_revenue_contract(uuid, jsonb, jsonb) to authenticated, service_role;

create or replace function public.owner_set_revenue_contract_status(p_contract_id uuid, p_status text, p_end_date date default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare c record;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  if p_status not in ('active','paused','ended') then raise exception 'invalid contract status %', p_status; end if;
  update public.owner_revenue_contracts set status = p_status,
    end_date = case when p_status = 'ended' then coalesce(p_end_date, end_date, current_date) else end_date end
  where id = p_contract_id returning * into c;
  if c.id is null then raise exception 'contract not found'; end if;
  return jsonb_build_object('contract_id', c.id, 'status', c.status, 'end_date', c.end_date);
end;
$$;
revoke execute on function public.owner_set_revenue_contract_status(uuid, text, date) from public, anon;
grant execute on function public.owner_set_revenue_contract_status(uuid, text, date) to authenticated, service_role;

-- FORECAST aggregate. Every number here is expected/contractual and is labelled as
-- such by the dashboard. Nothing in this function reads owner_payments, so it can
-- never be mistaken for, or accidentally summed with, actual revenue.
create or replace function public.owner_revenue_contract_overview(p_entity uuid)
returns jsonb language plpgsql security definer stable set search_path = public, pg_temp as $$
declare v_mrr_net bigint; v_mrr_gross bigint; v_active int; v_rows jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;

  -- Normalize every frequency to a monthly figure so MRR is comparable.
  select coalesce(sum(case c.billing_frequency
           when 'monthly' then c.expected_net_cents
           when 'quarterly' then round(c.expected_net_cents::numeric / 3)
           when 'yearly' then round(c.expected_net_cents::numeric / 12) end), 0),
         coalesce(sum(case c.billing_frequency
           when 'monthly' then c.expected_gross_cents
           when 'quarterly' then round(c.expected_gross_cents::numeric / 3)
           when 'yearly' then round(c.expected_gross_cents::numeric / 12) end), 0),
         count(*)
    into v_mrr_net, v_mrr_gross, v_active
  from public.owner_revenue_contracts c
  where c.business_entity_id = p_entity and c.status = 'active'
    and (c.end_date is null or c.end_date >= current_date);

  select coalesce(jsonb_agg(jsonb_build_object(
    'contract_id', c.id, 'name', c.name, 'status', c.status,
    'organization_id', c.organization_id,
    'start_date', c.start_date, 'end_date', c.end_date,
    'billing_frequency', c.billing_frequency, 'billing_day', c.billing_day,
    'currency', c.currency,
    'expected_net_cents', c.expected_net_cents,
    'expected_vat_cents', c.expected_vat_cents,
    'expected_gross_cents', c.expected_gross_cents,
    'last_posted_period_start', (select max(p.period_start) from public.owner_revenue_contract_postings p where p.contract_id = c.id),
    'posted_count', (select count(*) from public.owner_revenue_contract_postings p where p.contract_id = c.id)
  ) order by c.status, c.name), '[]'::jsonb) into v_rows
  from public.owner_revenue_contracts c where c.business_entity_id = p_entity;

  return jsonb_build_object(
    'active_contract_count', v_active,
    'mrr_net_cents', v_mrr_net,
    'mrr_gross_cents', v_mrr_gross,
    'arr_net_cents', v_mrr_net * 12,
    'arr_gross_cents', v_mrr_gross * 12,
    'basis', 'expected',          -- never 'actual'; the dashboard labels it ERWARTET
    'contracts', v_rows);
end;
$$;
revoke execute on function public.owner_revenue_contract_overview(uuid) from public, anon;
grant execute on function public.owner_revenue_contract_overview(uuid) to authenticated, service_role;

-- Deliberately post ONE billing period of a contract as a real invoice.
--
-- This is the boundary where forecast becomes actual. It only ever runs because
-- the owner asked for it, it sends nothing, and it refuses to post the same
-- period twice.
create or replace function public.owner_post_revenue_contract_month(
  p_idempotency_key uuid, p_contract_id uuid, p_period_start date, p_payments jsonb default '[]'::jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_existing jsonb; c record; v_period_end date; v_lines jsonb; v_id uuid; inv record; v_applied jsonb; v_result jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  v_existing := public.owner_claim_idempotency(p_idempotency_key, 'owner_post_revenue_contract_month');
  if v_existing is not null then return v_existing; end if;

  select * into c from public.owner_revenue_contracts where id = p_contract_id;
  if c.id is null then raise exception 'contract not found'; end if;
  if c.status <> 'active' then raise exception 'contract is % — only active contracts can be posted', c.status; end if;
  if p_period_start is null then raise exception 'period_start is required'; end if;
  if p_period_start < c.start_date then raise exception 'period starts before the contract start date'; end if;
  if c.end_date is not null and p_period_start > c.end_date then raise exception 'period starts after the contract end date'; end if;

  v_period_end := case c.billing_frequency
    when 'monthly'   then (p_period_start + interval '1 month')  - interval '1 day'
    when 'quarterly' then (p_period_start + interval '3 months') - interval '1 day'
    when 'yearly'    then (p_period_start + interval '1 year')   - interval '1 day' end::date;

  -- Duplicate guard: the unique (contract_id, period_start) surfaces as a clear refusal.
  if exists (select 1 from public.owner_revenue_contract_postings
             where contract_id = p_contract_id and period_start = p_period_start) then
    raise exception 'this contract period (%) has already been posted', p_period_start;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'description', l.description, 'quantity_milli', l.quantity_milli,
    'unit_price_cents', l.unit_price_cents, 'vat_rate_bp', l.vat_rate_bp,
    'vat_treatment', l.vat_treatment, 'sort_order', l.sort_order) order by l.sort_order), '[]'::jsonb)
    into v_lines from public.owner_revenue_contract_lines l where l.contract_id = p_contract_id;

  v_id := public.owner_build_issued_invoice(c.business_entity_id, jsonb_build_object(
    'issue_date', p_period_start, 'service_date', p_period_start,
    'service_period_start', p_period_start, 'service_period_end', v_period_end,
    'organization_id', c.organization_id, 'client_account_id', c.client_account_id,
    'owner_customer_id', c.owner_customer_id, 'currency', c.currency,
    'notes', c.name || ' — ' || to_char(p_period_start,'MM/YYYY'),
    'historical_entry', false), v_lines);

  v_applied := public.owner_apply_invoice_payments(v_id, p_payments);

  insert into public.owner_revenue_contract_postings (contract_id, business_entity_id, period_start, period_end, invoice_id, created_by)
  values (p_contract_id, c.business_entity_id, p_period_start, v_period_end, v_id, auth.uid());

  select * into inv from public.owner_invoices where id = v_id;
  v_result := jsonb_build_object('contract_id', p_contract_id, 'invoice_id', v_id,
    'invoice_number', inv.invoice_number, 'status', inv.status,
    'period_start', p_period_start, 'period_end', v_period_end,
    'gross_total_cents', inv.gross_total_cents, 'amount_paid_cents', inv.amount_paid_cents,
    'payment_ids', v_applied->'payment_ids');
  update public.owner_finance_requests set result = v_result where idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;
revoke execute on function public.owner_post_revenue_contract_month(uuid, uuid, date, jsonb) from public, anon;
grant execute on function public.owner_post_revenue_contract_month(uuid, uuid, date, jsonb) to authenticated, service_role;

commit;

-- ---------------------------------------------------------------------------
-- 8. BULK IMPORT (owner RPC).
--
--    One function call = one transaction = all-or-nothing. There is no partial
--    import: if the tenth invoice is bad, the first nine roll back too, so the
--    owner is never left guessing what landed.
--
--    The payload is a fixed, versioned SCHEMA. No SQL is accepted, parsed or
--    executed anywhere in this path.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_bulk_import_finance(p_idempotency_key uuid, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_existing jsonb; v_entity uuid; v_batch uuid; v_item jsonb; v_id uuid; v_applied jsonb;
  v_invoices jsonb; v_contracts jsonb; v_cid text; v_line jsonb; v_contract uuid;
  v_inv_count int := 0; v_pay_count int := 0; v_con_count int := 0;
  v_net bigint := 0; v_vat bigint := 0; v_gross bigint := 0; v_paid bigint := 0;
  inv record; v_result jsonb; v_created jsonb := '[]'::jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  v_existing := public.owner_claim_idempotency(p_idempotency_key, 'owner_bulk_import_finance');
  if v_existing is not null then return v_existing; end if;

  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then raise exception 'payload must be a JSON object'; end if;
  if coalesce((p_payload->>'schema_version')::int, 0) <> 1 then
    raise exception 'unsupported schema_version (expected 1)';
  end if;
  v_entity := (p_payload->>'business_entity_id')::uuid;
  if v_entity is null then raise exception 'business_entity_id is required'; end if;

  v_invoices  := coalesce(p_payload->'invoices', '[]'::jsonb);
  v_contracts := coalesce(p_payload->'recurring_contracts', '[]'::jsonb);
  if jsonb_typeof(v_invoices) <> 'array' or jsonb_typeof(v_contracts) <> 'array' then
    raise exception 'invoices and recurring_contracts must be arrays';
  end if;
  -- Payload bounds. Generous enough for a year of history, small enough that one
  -- transaction stays sane.
  if jsonb_array_length(v_invoices) > 100 then raise exception 'at most 100 invoices per import'; end if;
  if jsonb_array_length(v_contracts) > 100 then raise exception 'at most 100 contracts per import'; end if;
  if jsonb_array_length(v_invoices) = 0 and jsonb_array_length(v_contracts) = 0 then
    raise exception 'nothing to import';
  end if;

  insert into public.owner_finance_import_batches (business_entity_id, schema_version, source, created_by)
  values (v_entity, 1, nullif(p_payload->>'source',''), auth.uid())
  returning id into v_batch;

  -- ---- invoices -----------------------------------------------------------
  for v_item in select * from jsonb_array_elements(v_invoices) loop
    v_cid := nullif(trim(coalesce(v_item->>'client_import_id','')), '');
    if v_cid is null then raise exception 'every invoice needs a client_import_id'; end if;

    v_id := public.owner_build_issued_invoice(v_entity,
      (coalesce(v_item->'customer','{}'::jsonb) || jsonb_build_object(
        'issue_date', v_item->>'issue_date',
        'service_date', v_item->>'service_date',
        'service_period_start', v_item->>'service_period_start',
        'service_period_end', v_item->>'service_period_end',
        'due_date', v_item->>'due_date',
        'currency', coalesce(v_item->>'currency','EUR'),
        'notes', v_item->>'notes',
        'external_reference', v_item->>'external_reference',
        'historical_entry', true)),
      coalesce(v_item->'lines','[]'::jsonb));

    v_applied := public.owner_apply_invoice_payments(v_id, coalesce(v_item->'payments','[]'::jsonb));

    -- The unique constraint here is what makes a retried batch safe.
    insert into public.owner_finance_import_records (batch_id, business_entity_id, record_type, client_import_id, invoice_id)
    values (v_batch, v_entity, 'invoice', v_cid, v_id);

    select * into inv from public.owner_invoices where id = v_id;
    v_inv_count := v_inv_count + 1;
    v_pay_count := v_pay_count + jsonb_array_length(coalesce(v_applied->'payment_ids','[]'::jsonb));
    v_net := v_net + inv.net_total_cents; v_vat := v_vat + inv.vat_total_cents;
    v_gross := v_gross + inv.gross_total_cents; v_paid := v_paid + coalesce(inv.amount_paid_cents,0);
    v_created := v_created || jsonb_build_object('client_import_id', v_cid, 'invoice_id', v_id,
      'invoice_number', inv.invoice_number, 'status', inv.status);
  end loop;

  -- ---- recurring contracts ------------------------------------------------
  for v_item in select * from jsonb_array_elements(v_contracts) loop
    v_cid := nullif(trim(coalesce(v_item->>'client_import_id','')), '');
    if v_cid is null then raise exception 'every contract needs a client_import_id'; end if;

    insert into public.owner_revenue_contracts (business_entity_id, organization_id, client_account_id,
      name, description, status, start_date, end_date, billing_frequency, billing_day, currency, created_by)
    values (v_entity,
      nullif(coalesce(v_item->'customer','{}'::jsonb)->>'organization_id','')::uuid,
      nullif(coalesce(v_item->'customer','{}'::jsonb)->>'client_account_id','')::uuid,
      v_item->>'name', v_item->>'description', coalesce(v_item->>'status','active'),
      (v_item->>'start_date')::date, nullif(v_item->>'end_date','')::date,
      coalesce(v_item->>'billing_frequency','monthly'), nullif(v_item->>'billing_day','')::int,
      coalesce(v_item->>'currency','EUR'), auth.uid())
    returning id into v_contract;

    for v_line in select * from jsonb_array_elements(coalesce(v_item->'lines','[]'::jsonb)) loop
      insert into public.owner_revenue_contract_lines (contract_id, description, quantity_milli,
        unit_price_cents, vat_rate_bp, vat_treatment, sort_order)
      values (v_contract, v_line->>'description', coalesce((v_line->>'quantity_milli')::bigint, 1000),
        (v_line->>'unit_price_cents')::bigint, coalesce((v_line->>'vat_rate_bp')::int, 1900),
        coalesce(v_line->>'vat_treatment','standard'), coalesce((v_line->>'sort_order')::int, 0));
    end loop;

    insert into public.owner_finance_import_records (batch_id, business_entity_id, record_type, client_import_id, contract_id)
    values (v_batch, v_entity, 'revenue_contract', v_cid, v_contract);
    v_con_count := v_con_count + 1;
  end loop;

  update public.owner_finance_import_batches
     set invoice_count = v_inv_count, payment_count = v_pay_count, contract_count = v_con_count,
         summary = jsonb_build_object('net_cents', v_net, 'vat_cents', v_vat, 'gross_cents', v_gross, 'paid_cents', v_paid)
   where id = v_batch;

  v_result := jsonb_build_object('batch_id', v_batch,
    'invoice_count', v_inv_count, 'payment_count', v_pay_count, 'contract_count', v_con_count,
    'net_cents', v_net, 'vat_cents', v_vat, 'gross_cents', v_gross, 'paid_cents', v_paid,
    'invoices', v_created);
  update public.owner_finance_requests set result = v_result where idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;
revoke execute on function public.owner_bulk_import_finance(uuid, jsonb) from public, anon;
grant execute on function public.owner_bulk_import_finance(uuid, jsonb) to authenticated, service_role;

-- Preview-time customer resolution. Returns a match ONLY when it is unambiguous;
-- two customers with the same name yield ambiguous=true and the UI stops that row
-- rather than guessing between them.
create or replace function public.owner_resolve_import_customers(p_entity uuid, p_names jsonb)
returns jsonb language plpgsql security definer stable set search_path = public, pg_temp as $$
declare v_name text; v_rows jsonb := '[]'::jsonb; v_count int; v_id uuid;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  if p_names is null or jsonb_typeof(p_names) <> 'array' then raise exception 'names must be an array'; end if;
  if jsonb_array_length(p_names) > 200 then raise exception 'at most 200 names per resolution'; end if;

  for v_name in select jsonb_array_elements_text(p_names) loop
    -- (array_agg)[1] rather than min(): uuid has no min() aggregate, and the value is
    -- only ever used when exactly one row matched anyway.
    select count(*), (array_agg(o.id))[1] into v_count, v_id
    from public.organizations o
    where lower(trim(o.name)) = lower(trim(v_name));
    v_rows := v_rows || jsonb_build_object(
      'name', v_name,
      'organization_id', case when v_count = 1 then v_id else null end,
      'match_count', v_count,
      'ambiguous', v_count > 1);
  end loop;
  return v_rows;
end;
$$;
revoke execute on function public.owner_resolve_import_customers(uuid, jsonb) from public, anon;
grant execute on function public.owner_resolve_import_customers(uuid, jsonb) to authenticated, service_role;

commit;
