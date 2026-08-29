-- =============================================================================
-- Invoice immutable issuance snapshot (Phase 1A of the Rechnungen overhaul).
--
-- WHY THIS EXISTS
--
-- An issued invoice must always render exactly from the information that was
-- true at issuance. Before this migration, invoiceToDocument() resolved the
-- recipient via a LIVE join to the customer/CRM tables and the seller/bank/tax
-- data via a LIVE read of owner_document_settings, on every render — so a later
-- change to a customer's address, or to Cogniiq's own bank/tax details, would
-- silently change the content of an already-issued invoice PDF. This mirrors
-- exactly the immutable-snapshot design owner_offer_versions already proved for
-- offers (see 20260723121000_owner_offers.sql / 20260825064048_...sql), applied
-- to invoices for the first time.
--
-- WHAT THIS DOES
--
--   * Adds owner_invoice_versions: one immutable row per issued invoice, holding
--     a complete, versioned JSON snapshot (schema_version 1) + its SHA-256
--     source hash. Append-only, exactly like owner_offer_versions.
--   * Adds two small internal snapshot-builder helpers (recipient + settings),
--     mirroring the existing owner_seller_snapshot()/owner_settings_snapshot()
--     pattern used by finalize_owner_offer(). owner_seller_snapshot() itself is
--     REUSED as-is for the seller/bank/tax side — it already carries everything
--     an invoice needs (legal name, address, VAT ID, tax number, IBAN/BIC/bank
--     name) and is untouched by this migration.
--   * Redefines the FOUR functions that can move an invoice to status='issued'
--     (issue_owner_invoice, record_owner_historical_paid_invoice,
--     owner_build_issued_invoice, owner_issue_invoice_internal) so every one of
--     them captures the snapshot ATOMICALLY, in the same transaction as number
--     allocation and the status flip, after every existing preflight check
--     already in that function still passes unchanged. No issuance path can
--     produce an issued invoice without a snapshot after this migration.
--   * Fixes two narrow, pre-existing bugs while touching these functions:
--       1. All four hard-coded the invoice number prefix as the literal 'RE-'
--          instead of reading owner_document_settings.invoice_number_prefix.
--          Already-issued invoice numbers are NEVER touched by this fix — it
--          only changes what prefix a FUTURE issuance uses.
--       2. delete_owner_draft_invoice() only checked the older
--          owner_finance_documents table for linked documents, not the newer
--          owner_generated_documents registry. It now checks both.
--
-- WHAT THIS DELIBERATELY DOES NOT DO
--
--   * It does NOT touch the owner_invoices.status enum, add document_status /
--     delivery_status columns, or change any status transition logic beyond
--     what issuance already did (draft -> issued). The multidimensional status
--     redesign is a separate, later migration.
--   * It does NOT weaken owner_guard_invoice() or delete_owner_draft_invoice()
--     in any way that widens who may edit or delete an issued invoice. Issued
--     invoices remain permanently un-deletable and un-editable.
--   * It does NOT add refund/correction-document tables, recurring invoicing,
--     an invoice email button, or a public invoice portal. Those are later
--     phases.
--
-- Additive only. No existing table, policy, grant or row is altered beyond the
-- four function bodies and delete_owner_draft_invoice named above.
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. owner_invoice_versions — immutable per-issuance snapshot, mirrors
--    owner_offer_versions exactly (same shape, same RLS, same grants).
-- ---------------------------------------------------------------------------
create table if not exists public.owner_invoice_versions (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.owner_invoices(id) on delete cascade,
  version int not null check (version > 0),
  invoice_number text,
  snapshot jsonb not null,
  source_hash text not null,
  issued_by uuid references public.profiles(id) on delete set null,
  issued_at timestamptz not null default now(),
  constraint owner_invoice_versions_unique unique (invoice_id, version)
);
create index if not exists owner_invoice_versions_invoice_idx on public.owner_invoice_versions (invoice_id);

alter table public.owner_invoice_versions enable row level security;
drop policy if exists owner_invoice_versions_owner_select on public.owner_invoice_versions;
create policy owner_invoice_versions_owner_select on public.owner_invoice_versions for select to authenticated using (public.is_platform_owner());
drop policy if exists owner_invoice_versions_owner_insert on public.owner_invoice_versions;
create policy owner_invoice_versions_owner_insert on public.owner_invoice_versions for insert to authenticated with check (public.is_platform_owner());
revoke all on table public.owner_invoice_versions from public, anon, authenticated;
grant select, insert on table public.owner_invoice_versions to authenticated;
grant select, insert, update, delete on table public.owner_invoice_versions to service_role;

commit;

-- ---------------------------------------------------------------------------
-- 2. Internal snapshot-builder helpers. Revoked from public/anon/authenticated
--    (same pattern as owner_seller_snapshot/owner_settings_snapshot/
--    owner_verify_offer_token): callable only from within another SECURITY
--    DEFINER function in this same migration chain, never directly by a client.
-- ---------------------------------------------------------------------------
begin;

-- Curated recipient identity at the moment of issuance. Resolution order:
--   1. The canonical owner_customers row (owner_customer_id) — has a full
--      postal address and is never written back to by any live CRM edit.
--   2. If the invoice was converted from an offer, that offer's OWN
--      recipient_* columns (frozen by owner_guard_offer once the offer left
--      draft — see 20260723123000_owner_premium_offer_editor.sql), so a
--      converted invoice never depends on today's CRM state.
--   3. The CRM client_account / organization as a last-resort fallback for
--      invoices created without a canonical owner_customer_id.
-- Never returns a live join result computed lazily later — it is called once,
-- at issuance, and its RETURN VALUE (not a re-run of this function) is what
-- gets frozen into owner_invoice_versions.snapshot.
-- Implemented as a single flat query (LEFT JOINs, not branching SELECT INTO record blocks) so
-- there is never an "unassigned record" hazard when e.g. owner_customer_id is null but
-- client_account_id is set, or vice versa — every one of these FKs is nullable and independent.
create or replace function public.owner_invoice_recipient_snapshot(p_invoice_id uuid)
returns jsonb language sql security definer set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'company', coalesce(c.company, nullif(off.recipient_company, ''), ca.display_name, org.name),
    'contact_name', coalesce(c.contact_name, off.recipient_contact_name, ca.primary_contact_name),
    'department', off.recipient_department,
    'address_lines', to_jsonb(coalesce(
      case when c.id is not null then array_remove(array[c.street, nullif(trim(concat_ws(' ', c.postal_code, c.city)), '')], null) end,
      case when off.id is not null and coalesce(off.recipient_company, '') <> '' then
        array_remove(array[off.recipient_street, nullif(trim(concat_ws(' ', off.recipient_postal_code, off.recipient_city)), '')], null) end,
      case when ca.id is not null and coalesce(ca.address, '') <> '' then
        regexp_split_to_array(trim(both E'\n' from ca.address), E'\n+') end,
      array[]::text[])),
    'email', coalesce(c.email, off.recipient_email, ca.primary_email),
    'phone', coalesce(c.phone, off.recipient_phone, ca.phone),
    'vat_id', off.recipient_vat_id,
    'country_code', coalesce(c.country_code, off.recipient_country_code, 'DE'),
    'resolved_from', case when c.id is not null then 'owner_customer'
      when off.id is not null and coalesce(off.recipient_company, '') <> '' then 'source_offer'
      when ca.id is not null then 'client_account' else 'none' end)
  from public.owner_invoices inv
  left join public.owner_customers c on c.id = inv.owner_customer_id
  left join public.owner_offers off on off.id = inv.source_offer_id
  left join public.client_accounts ca on ca.id = inv.client_account_id
  left join public.organizations org on org.id = inv.organization_id
  where inv.id = p_invoice_id;
$$;
revoke execute on function public.owner_invoice_recipient_snapshot(uuid) from public, anon, authenticated;

-- Curated document-default settings at the moment of issuance (language, brand,
-- invoice footer, configured number prefix). Deliberately separate from
-- owner_settings_snapshot(), which is offer-shaped (offer_number_prefix,
-- default_offer_* fields) and is left completely untouched by this migration.
create or replace function public.owner_invoice_settings_snapshot(p_entity uuid)
returns jsonb language sql security definer set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'document_language', coalesce(s.document_language, 'de'),
    'brand_accent', s.brand_accent, 'logo_storage_path', s.logo_storage_path,
    'invoice_number_prefix', coalesce(s.invoice_number_prefix, 'RE'),
    'default_invoice_footer', s.default_invoice_footer,
    'default_payment_terms_days', coalesce(s.default_payment_terms_days, 14))
  from public.owner_document_settings s where s.business_entity_id = p_entity;
$$;
revoke execute on function public.owner_invoice_settings_snapshot(uuid) from public, anon, authenticated;

-- The complete, versioned, immutable snapshot for one invoice at the exact
-- moment of issuance. schema_version identifies the JSON shape so a future
-- reader can tell which fields to expect without guessing. p_number is the
-- FINAL invoice number (already allocated by the caller in the same
-- transaction) so the snapshot and the number are always consistent.
--
-- Deliberately excludes owner_invoices.notes (internal-only, never rendered
-- onto the customer document — see buildTransactionalDoc.ts::invoiceToDocument,
-- which never maps invoice.notes onto TransactionalDocument) and stores no
-- secrets: IBAN/BIC/bank name are already customer-facing payment information
-- on every invoice today, not credentials.
create or replace function public.owner_build_invoice_snapshot(p_invoice_id uuid, p_number text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare inv record; v_lines jsonb;
begin
  select * into inv from public.owner_invoices where id = p_invoice_id;
  if inv.id is null then raise exception 'invoice not found'; end if;

  select coalesce(jsonb_agg(to_jsonb(l) order by l.sort_order), '[]'::jsonb)
    into v_lines from public.owner_invoice_lines l where l.invoice_id = p_invoice_id;

  return jsonb_build_object(
    'schema_version', 1,
    'invoice', (to_jsonb(inv) - 'notes') || jsonb_build_object('invoice_number', p_number, 'status', 'issued'),
    'lines', v_lines,
    'seller', public.owner_seller_snapshot(inv.business_entity_id),
    'recipient', public.owner_invoice_recipient_snapshot(p_invoice_id),
    'document_settings', public.owner_invoice_settings_snapshot(inv.business_entity_id),
    'totals', jsonb_build_object(
      'net_cents', inv.net_total_cents, 'vat_cents', inv.vat_total_cents, 'gross_cents', inv.gross_total_cents),
    'invoice_number', p_number,
    'version', 1);
end;
$$;
revoke execute on function public.owner_build_invoice_snapshot(uuid, text) from public, anon, authenticated;

-- Shared final step for every issuance path: hash the snapshot and insert the
-- immutable version row. `on conflict do nothing` is a pure defensive no-op —
-- every caller already holds a `for update` row lock on the invoice and has
-- already checked `status = 'draft'` before calling this, so a second insert
-- for the same (invoice_id, 1) should never actually happen.
create or replace function public.owner_capture_invoice_snapshot(p_invoice_id uuid, p_number text)
returns text language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare v_snapshot jsonb; v_hash text;
begin
  v_snapshot := public.owner_build_invoice_snapshot(p_invoice_id, p_number);
  v_hash := encode(extensions.digest(convert_to(v_snapshot::text, 'UTF8'), 'sha256'::text), 'hex');
  insert into public.owner_invoice_versions (invoice_id, version, invoice_number, snapshot, source_hash, issued_by)
  values (p_invoice_id, 1, p_number, v_snapshot, v_hash, auth.uid())
  on conflict (invoice_id, version) do nothing;
  return v_hash;
end;
$$;
revoke execute on function public.owner_capture_invoice_snapshot(uuid, text) from public, anon, authenticated;

commit;

-- ---------------------------------------------------------------------------
-- 3. Redefine the four issuance paths: read the configured prefix, capture the
--    snapshot atomically right after the status flip to 'issued'. Every
--    preflight check that already existed is copied verbatim — nothing is
--    weakened or removed, only the prefix lookup and the snapshot capture are
--    added.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.issue_owner_invoice(p_idempotency_key uuid, p_invoice_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_existing jsonb; inv record; v_lines int; v_unknown int; v_number text; v_next bigint; v_prefix text; v_result jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  v_existing := public.owner_claim_idempotency(p_idempotency_key, 'issue_owner_invoice');
  if v_existing is not null then return v_existing; end if;

  select * into inv from public.owner_invoices where id = p_invoice_id for update;
  if inv.id is null then raise exception 'invoice not found'; end if;
  if inv.status <> 'draft' then raise exception 'invoice is not a draft'; end if;
  if inv.issue_date is null then raise exception 'issue_date is required'; end if;
  if inv.service_date is null and inv.service_period_start is null then raise exception 'service date or period is required'; end if;
  if inv.due_date is null then raise exception 'due_date is required'; end if;
  if inv.currency not in ('EUR', 'CHF', 'USD') then raise exception 'unsupported currency %', inv.currency; end if;

  select count(*), count(*) filter (where vat_treatment = 'unknown') into v_lines, v_unknown
  from public.owner_invoice_lines where invoice_id = p_invoice_id;
  if v_lines < 1 then raise exception 'invoice has no lines'; end if;
  if v_unknown > 0 then raise exception 'invoice has unresolved VAT treatments'; end if;
  if inv.net_total_cents <= 0 or inv.gross_total_cents <= 0 then raise exception 'invoice totals must be positive'; end if;

  v_number := inv.invoice_number;
  if v_number is null or trim(v_number) = '' then
    select coalesce(invoice_number_prefix, 'RE') into v_prefix from public.owner_document_settings where business_entity_id = inv.business_entity_id;
    v_prefix := coalesce(v_prefix, 'RE');
    insert into public.owner_invoice_counters (business_entity_id) values (inv.business_entity_id) on conflict (business_entity_id) do nothing;
    select next_number into v_next from public.owner_invoice_counters where business_entity_id = inv.business_entity_id for update;
    v_number := v_prefix || '-' || to_char(inv.issue_date, 'YYYY') || '-' || lpad(v_next::text, 4, '0');
    update public.owner_invoice_counters set next_number = v_next + 1, updated_at = now() where business_entity_id = inv.business_entity_id;
  end if;

  update public.owner_invoices set invoice_number = v_number, status = 'issued', issued_at = now() where id = p_invoice_id;
  perform public.owner_capture_invoice_snapshot(p_invoice_id, v_number);

  v_result := jsonb_build_object('invoice_id', p_invoice_id, 'invoice_number', v_number, 'status', 'issued');
  update public.owner_finance_requests set result = v_result where idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;

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
  v_prefix text;
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

  select coalesce(invoice_number_prefix, 'RE') into v_prefix from public.owner_document_settings where business_entity_id = inv.business_entity_id;
  v_prefix := coalesce(v_prefix, 'RE');
  insert into public.owner_invoice_counters (business_entity_id) values (inv.business_entity_id) on conflict (business_entity_id) do nothing;
  select next_number into v_next from public.owner_invoice_counters where business_entity_id = inv.business_entity_id for update;
  v_number := v_prefix || '-' || to_char(inv.issue_date, 'YYYY') || '-' || lpad(v_next::text, 4, '0');
  update public.owner_invoice_counters set next_number = v_next + 1, updated_at = now() where business_entity_id = inv.business_entity_id;

  update public.owner_invoices set invoice_number = v_number, status = 'issued', issued_at = now() where id = v_id;
  perform public.owner_capture_invoice_snapshot(v_id, v_number);

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

create or replace function public.owner_build_issued_invoice(p_entity uuid, p_header jsonb, p_lines jsonb)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid; v_line jsonb; inv record; v_lines int; v_unknown int; v_number text; v_next bigint; v_issue date; v_prefix text;
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

  select coalesce(invoice_number_prefix, 'RE') into v_prefix from public.owner_document_settings where business_entity_id = inv.business_entity_id;
  v_prefix := coalesce(v_prefix, 'RE');
  insert into public.owner_invoice_counters (business_entity_id) values (inv.business_entity_id) on conflict (business_entity_id) do nothing;
  select next_number into v_next from public.owner_invoice_counters where business_entity_id = inv.business_entity_id for update;
  v_number := v_prefix || '-' || to_char(inv.issue_date, 'YYYY') || '-' || lpad(v_next::text, 4, '0');
  update public.owner_invoice_counters set next_number = v_next + 1, updated_at = now() where business_entity_id = inv.business_entity_id;
  update public.owner_invoices set invoice_number = v_number, status = 'issued', issued_at = now() where id = v_id;
  perform public.owner_capture_invoice_snapshot(v_id, v_number);
  return v_id;
end;
$$;
revoke execute on function public.owner_build_issued_invoice(uuid, jsonb, jsonb) from public, anon, authenticated;

create or replace function public.owner_issue_invoice_internal(p_invoice_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare inv record; v_lines int; v_unknown int; v_number text; v_next bigint; v_prefix text;
begin
  if not public.request_is_service_role() then raise exception 'service role required'; end if;
  select * into inv from public.owner_invoices where id = p_invoice_id for update;
  if inv.id is null then raise exception 'invoice not found'; end if;
  -- Idempotent: an already-issued invoice keeps its number and status.
  if inv.status <> 'draft' then
    return jsonb_build_object('invoice_id', p_invoice_id, 'invoice_number', inv.invoice_number, 'status', inv.status, 'idempotent', true);
  end if;

  -- Complete invoice preflight before issuing.
  if inv.issue_date is null then raise exception 'issue_date is required'; end if;
  if inv.service_date is null and inv.service_period_start is null then raise exception 'service date or period is required'; end if;
  if inv.due_date is null then raise exception 'due_date is required'; end if;
  if inv.currency not in ('EUR','CHF','USD') then raise exception 'unsupported currency %', inv.currency; end if;
  select count(*), count(*) filter (where vat_treatment = 'unknown') into v_lines, v_unknown
    from public.owner_invoice_lines where invoice_id = p_invoice_id;
  if v_lines < 1 then raise exception 'invoice has no lines'; end if;
  if v_unknown > 0 then raise exception 'invoice has unresolved VAT treatments'; end if;
  if inv.net_total_cents <= 0 or inv.gross_total_cents <= 0 then raise exception 'invoice totals must be positive'; end if;

  v_number := inv.invoice_number;
  if v_number is null or trim(v_number) = '' then
    select coalesce(invoice_number_prefix, 'RE') into v_prefix from public.owner_document_settings where business_entity_id = inv.business_entity_id;
    v_prefix := coalesce(v_prefix, 'RE');
    insert into public.owner_invoice_counters (business_entity_id) values (inv.business_entity_id) on conflict (business_entity_id) do nothing;
    select next_number into v_next from public.owner_invoice_counters where business_entity_id = inv.business_entity_id for update;
    v_number := v_prefix || '-' || to_char(inv.issue_date, 'YYYY') || '-' || lpad(v_next::text, 4, '0');
    update public.owner_invoice_counters set next_number = v_next + 1, updated_at = now() where business_entity_id = inv.business_entity_id;
  end if;

  update public.owner_invoices set invoice_number = v_number, status = 'issued', issued_at = now() where id = p_invoice_id;
  perform public.owner_capture_invoice_snapshot(p_invoice_id, v_number);
  return jsonb_build_object('invoice_id', p_invoice_id, 'invoice_number', v_number, 'status', 'issued', 'idempotent', false);
end;
$$;
revoke execute on function public.owner_issue_invoice_internal(uuid) from public, anon, authenticated;
grant execute on function public.owner_issue_invoice_internal(uuid) to service_role;

commit;

-- ---------------------------------------------------------------------------
-- 4. delete_owner_draft_invoice bugfix: also refuse deletion when a row exists
--    in the newer owner_generated_documents registry, not only the older
--    owner_finance_documents table. Every other guard is byte-for-byte
--    unchanged — this does not widen deletion rights in any way, it only
--    closes a gap where a draft's generated PDF could be orphaned.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.delete_owner_draft_invoice(p_invoice_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare inv record;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  select * into inv from public.owner_invoices where id = p_invoice_id for update;
  if inv.id is null then raise exception 'invoice not found'; end if;
  if inv.status <> 'draft' or inv.issued_at is not null then raise exception 'only never-issued draft invoices may be deleted'; end if;
  if exists (select 1 from public.owner_payments where invoice_id = p_invoice_id) then raise exception 'invoice has payments'; end if;
  if exists (select 1 from public.owner_finance_documents where invoice_id = p_invoice_id) then raise exception 'invoice has linked documents'; end if;
  if exists (select 1 from public.owner_generated_documents where source_resource_type = 'owner_invoices' and source_resource_id = p_invoice_id) then
    raise exception 'invoice has linked documents';
  end if;
  delete from public.owner_invoices where id = p_invoice_id;
end;
$$;

commit;
