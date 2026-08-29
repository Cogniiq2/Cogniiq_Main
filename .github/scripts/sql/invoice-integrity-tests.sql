-- Owner finance: invoice integrity safeguards (PR-0A).
--
-- These tests EXECUTE against a real Postgres. They are deliberately the behavioural half of
-- the proof: a source-level assertion cannot tell a guard that COMPILES from one that actually
-- refuses a statement, and it cannot tell a REVOKE that was written from one that took effect.
--
-- The unprivileged half runs under `set local role authenticated`, which is what makes these
-- tests meaningful at all: the psql session is the database owner, and is_database_admin() is
-- true for it, so a test that forgot to switch roles would pass against a completely open table.
--
-- Covered:
--   1  draft invoices stay editable through the approved RPCs
--   2  an issued invoice's issuance-defining fields are unwritable by an authenticated client
--   3  arbitrary status mutation is refused even if the column grant is restored
--   4  an authenticated client cannot INSERT an already-issued invoice
--   5  Storno (owner_cancel_invoice) still works and is still idempotent
--   6  payment-derived updates (record_owner_invoice_payment) still work
--   7  invoice-number protection still holds, for privileged callers too
--   8  manual offer -> invoice conversion still works and still excludes recurring lines
--   9  automated conversion produces the IDENTICAL invoice the manual path would
--  10  a milestone conversion can no longer be over-invoiced by the automation
--  11  repeated conversion never creates a duplicate initial invoice
--  12  a recurring-only offer produces no invoice on either path
--  13  issuance still captures the immutable snapshot
--
-- ON_ERROR_STOP=1 -> any failed assertion aborts with a non-zero exit.

\set ON_ERROR_STOP on
set client_min_messages = notice;

create or replace function pg_temp.pass(msg text) returns void language plpgsql as $$
begin raise notice 'PASS: %', msg; end $$;
create or replace function pg_temp.fail(msg text) returns void language plpgsql as $$
begin raise exception 'FAIL: %', msg; end $$;
create or replace function pg_temp.want(cond boolean, msg text) returns void language plpgsql as $$
begin if cond then perform pg_temp.pass(msg); else perform pg_temp.fail(msg); end if; end $$;

-- Auth follows the REAL phase0 is_platform_owner(): profiles.platform_role + auth.uid().
select set_config('t.owner','00000000-0000-0000-0000-000000000901',false);
update public.profiles set platform_role = 'cogniiq_owner' where id = current_setting('t.owner')::uuid;
select set_config('request.jwt.claim.sub', current_setting('t.owner'), false);
select set_config('request.jwt.claim.role', 'authenticated', false);

set session_replication_role = replica;
delete from public.owner_invoice_versions;
delete from public.owner_generated_documents where source_resource_type in ('owner_invoices','owner_offers');
delete from public.owner_finance_documents where invoice_id is not null;
delete from public.owner_payments;
delete from public.owner_invoice_lines;
delete from public.owner_invoices;
delete from public.owner_invoice_counters;
delete from public.owner_offer_lines;
delete from public.owner_offers;
delete from public.owner_customers;
delete from public.owner_finance_requests;
delete from public.owner_finance_notifications;
delete from public.owner_document_settings;
set session_replication_role = origin;

select set_config('t.entity', (select id::text from public.owner_business_entities where slug='cogniiq'), false);

insert into public.organizations (id, name, status, created_by)
  values ('44444444-4444-4444-4444-444444444444','Integrity AG','active', current_setting('t.owner')::uuid)
  on conflict (id) do nothing;

insert into public.owner_document_settings (business_entity_id, legal_name, street, postal_code, city, tax_number, vat_id,
  bank_account_holder, iban, bic, bank_name, invoice_number_prefix, default_payment_terms_days, default_invoice_due_days,
  business_email)
values (current_setting('t.entity')::uuid, 'Cogniiq UG', 'Erststr. 1', '10115', 'Berlin', 'TAX-1', 'DE1',
  'Cogniiq UG', 'DE89370400440532013000', 'COBADEFFXXX', 'Commerzbank', 'RE', 21, 7,
  'rechnung@cogniiq.example');

insert into public.owner_customers (id, business_entity_id, organization_id, company, contact_name, email, street, postal_code, city, country_code)
values ('55555555-5555-5555-5555-555555555555', current_setting('t.entity')::uuid, '44444444-4444-4444-4444-444444444444',
  'Integrity AG', 'Ida Integer', 'ida@integrity.example', 'Kundenstr. 1', '20095', 'Hamburg', 'DE');
select set_config('t.customer', '55555555-5555-5555-5555-555555555555', false);

create or replace function pg_temp.body() returns jsonb language sql as $$
  select jsonb_build_array(jsonb_build_object('description','Beratung','quantity_milli',1000,
    'unit_price_cents',100000,'vat_rate_bp',1900,'vat_treatment','standard','sort_order',0)) $$;
create or replace function pg_temp.header() returns jsonb language sql as $$
  select jsonb_build_object('business_entity_id',current_setting('t.entity'),
    'organization_id','44444444-4444-4444-4444-444444444444',
    'issue_date','2026-03-01','service_date','2026-03-01','due_date','2026-03-15','currency','EUR') $$;

-- An accepted offer carrying BOTH a one-time and a recurring position, plus a two-rate payment
-- schedule. This is the exact shape the automation used to mis-handle.
create or replace function pg_temp.make_offer(p_number text, p_schedule jsonb) returns uuid language plpgsql as $$
declare v_offer uuid;
begin
  -- Built as a DRAFT and only then accepted: owner_guard_offer() freezes the commercial
  -- substance (totals included) the moment an offer leaves draft, and the line-totals
  -- recalculation trigger writes exactly those columns.
  insert into public.owner_offers (business_entity_id, organization_id, owner_customer_id, status, title,
    offer_number, currency, payment_terms, payment_schedule, created_by,
    recipient_company, recipient_street, recipient_postal_code, recipient_city, recipient_email)
  values (current_setting('t.entity')::uuid, '44444444-4444-4444-4444-444444444444',
    current_setting('t.customer')::uuid, 'draft', 'Projekt ' || p_number, p_number, 'EUR',
    'Zahlbar innerhalb 14 Tagen', coalesce(p_schedule, '[]'::jsonb), current_setting('t.owner')::uuid,
    'Integrity AG', 'Kundenstr. 1', '20095', 'Hamburg', 'ida@integrity.example')
  returning id into v_offer;

  insert into public.owner_offer_lines (offer_id, description, quantity_milli, unit_price_cents,
    vat_rate_bp, vat_treatment, is_optional, sort_order, pricing_type)
  values (v_offer, 'Einmalige Einrichtung', 1000, 200000, 1900, 'standard', false, 0, 'one_time');

  insert into public.owner_offer_lines (offer_id, description, quantity_milli, unit_price_cents,
    vat_rate_bp, vat_treatment, is_optional, sort_order, pricing_type, billing_interval, billing_start_type)
  values (v_offer, 'Monatliche Betreuung', 1000, 50000, 1900, 'standard', false, 1, 'recurring', 'monthly', 'go_live');

  update public.owner_offers set status = 'accepted', accepted_at = now() where id = v_offer;
  return v_offer;
end $$;

-- ---------------------------------------------------------------------------
-- 1. A DRAFT invoice is still fully serviceable through the approved RPCs.
-- ---------------------------------------------------------------------------
do $$
declare v_inv jsonb; v_id uuid; v_cust uuid; v_org uuid;
begin
  v_inv := public.create_owner_invoice(gen_random_uuid(), pg_temp.header(), pg_temp.body());
  v_id := (v_inv->>'invoice_id')::uuid;
  perform pg_temp.want(v_id is not null, 'draft invoice created through create_owner_invoice');

  perform public.owner_link_invoice_customer(v_id, current_setting('t.customer')::uuid);
  select owner_customer_id into v_cust from public.owner_invoices where id = v_id;
  perform pg_temp.want(v_cust = current_setting('t.customer')::uuid,
    'draft invoice still linkable to the canonical customer (owner_link_invoice_customer)');

  perform public.assign_invoice_organization(v_id, '44444444-4444-4444-4444-444444444444');
  select organization_id into v_org from public.owner_invoices where id = v_id;
  perform pg_temp.want(v_org = '44444444-4444-4444-4444-444444444444',
    'draft invoice still re-assignable to an organization (assign_invoice_organization)');

  perform set_config('t.draft', v_id::text, false);
end $$;

-- A second draft is issued and becomes the subject of the freeze tests.
do $$
declare v_inv jsonb; v_id uuid; r jsonb;
begin
  v_inv := public.create_owner_invoice(gen_random_uuid(), pg_temp.header(), pg_temp.body());
  v_id := (v_inv->>'invoice_id')::uuid;
  perform public.owner_link_invoice_customer(v_id, current_setting('t.customer')::uuid);
  r := public.issue_owner_invoice(gen_random_uuid(), v_id);
  perform pg_temp.want(r->>'status' = 'issued', 'invoice issued through issue_owner_invoice');
  perform set_config('t.issued', v_id::text, false);
  perform set_config('t.issued_number', r->>'invoice_number', false);
end $$;

-- ---------------------------------------------------------------------------
-- 2. Every issuance-defining field is unwritable by an authenticated client.
--
--    The revoked table grant is the first line: PostgREST is role `authenticated`,
--    so the statement never reaches RLS or the trigger.
-- ---------------------------------------------------------------------------
do $$
declare v_col text; v_err text; v_blocked int := 0; v_cols text[] := array[
  'status', 'invoice_number', 'issue_date', 'service_date', 'service_period_start',
  'service_period_end', 'due_date', 'currency', 'organization_id', 'client_account_id',
  'engagement_id', 'notes', 'external_reference', 'archived_at'];
begin
  set local role authenticated;
  foreach v_col in array v_cols loop
    begin
      execute format('update public.owner_invoices set %I = null where id = %L', v_col, current_setting('t.issued'));
      v_err := null;
    exception when others then v_err := sqlstate;
    end;
    if v_err is null then
      reset role;
      perform pg_temp.fail(format('authenticated client was able to UPDATE issued invoice column %s', v_col));
    end if;
    if v_err <> '42501' then
      reset role;
      perform pg_temp.fail(format('column %s was refused with %s, expected 42501 (insufficient privilege)', v_col, v_err));
    end if;
    v_blocked := v_blocked + 1;
  end loop;
  reset role;
  perform pg_temp.want(v_blocked = array_length(v_cols, 1),
    format('all %s client-writable invoice columns are now refused for an authenticated session', v_blocked));
end $$;

-- The row is genuinely untouched.
do $$
declare inv record;
begin
  select * into inv from public.owner_invoices where id = current_setting('t.issued')::uuid;
  perform pg_temp.want(inv.status = 'issued', 'issued invoice still has status issued');
  perform pg_temp.want(inv.invoice_number = current_setting('t.issued_number'), 'issued invoice kept its number');
  perform pg_temp.want(inv.currency = 'EUR' and inv.issue_date = date '2026-03-01',
    'issued invoice kept its currency and issue date');
end $$;

-- ---------------------------------------------------------------------------
-- 3. Defence in depth: even if a later migration re-granted the columns, the
--    guard trigger still refuses the UPDATE. This is the assertion that keeps
--    the invariant true rather than merely the grant list.
-- ---------------------------------------------------------------------------
grant update (status, invoice_number, issue_date, due_date, currency, notes) on table public.owner_invoices to authenticated;

do $$
declare v_err text; v_msg text;
begin
  set local role authenticated;
  begin
    update public.owner_invoices set status = 'paid' where id = current_setting('t.issued')::uuid;
    v_err := null;
  exception when others then v_err := sqlstate; v_msg := sqlerrm;
  end;
  reset role;
  perform pg_temp.want(v_err is not null, 'raw status mutation is refused even with the column grant restored');
  perform pg_temp.want(v_msg like '%invoices cannot be modified directly%',
    format('refusal came from owner_guard_invoice, not from the grant (got: %s)', coalesce(v_msg, '<none>')));
end $$;

do $$
declare v_err text; v_msg text;
begin
  set local role authenticated;
  begin
    update public.owner_invoices set issue_date = date '2020-01-01', due_date = date '2020-01-31'
      where id = current_setting('t.issued')::uuid;
    v_err := null;
  exception when others then v_err := sqlstate; v_msg := sqlerrm;
  end;
  reset role;
  perform pg_temp.want(v_err is not null, 'back-dating an issued invoice is refused by the trigger too');
end $$;

-- A DRAFT is not a special case: no column of any invoice is client-writable.
do $$
declare v_err text;
begin
  set local role authenticated;
  begin
    update public.owner_invoices set notes = 'geändert' where id = current_setting('t.draft')::uuid;
    v_err := null;
  exception when others then v_err := sqlstate;
  end;
  reset role;
  perform pg_temp.want(v_err is not null, 'a draft is not directly client-writable either (RPCs only)');
end $$;

revoke update on table public.owner_invoices from authenticated;

-- ---------------------------------------------------------------------------
-- 4. An authenticated client cannot INSERT an already-issued invoice. Forging a
--    finished document one statement earlier is the same forgery.
-- ---------------------------------------------------------------------------
do $$
declare v_err text; v_msg text;
begin
  set local role authenticated;
  begin
    insert into public.owner_invoices (business_entity_id, organization_id, status, invoice_number, issue_date, due_date)
    values (current_setting('t.entity')::uuid, '44444444-4444-4444-4444-444444444444', 'issued', 'RE-FAKE-001',
            current_date, current_date + 14);
    v_err := null;
  exception when others then v_err := sqlstate; v_msg := sqlerrm;
  end;
  reset role;
  perform pg_temp.want(v_err is not null, 'client INSERT of an issued invoice is refused');
  perform pg_temp.want(v_msg like '%can only be created as drafts%',
    format('INSERT refusal came from owner_guard_invoice (got: %s)', coalesce(v_msg, '<none>')));
end $$;

do $$
declare v_id uuid;
begin
  set local role authenticated;
  insert into public.owner_invoices (business_entity_id, organization_id, status, issue_date, due_date)
  values (current_setting('t.entity')::uuid, '44444444-4444-4444-4444-444444444444', 'draft',
          current_date, current_date + 14)
  returning id into v_id;
  reset role;
  perform pg_temp.want(v_id is not null, 'a plain DRAFT insert is still allowed (nothing legitimate was blocked)');
  delete from public.owner_invoices where id = v_id;
end $$;

-- ---------------------------------------------------------------------------
-- 5. Payment reconciliation still works end to end on an issued invoice.
-- ---------------------------------------------------------------------------
do $$
declare inv record;
begin
  perform public.record_owner_invoice_payment(gen_random_uuid(), current_setting('t.issued')::uuid, 50000, current_date);
  select * into inv from public.owner_invoices where id = current_setting('t.issued')::uuid;
  perform pg_temp.want(inv.amount_paid_cents = 50000, 'partial payment updated amount_paid_cents');
  perform pg_temp.want(inv.status = 'partially_paid', 'partial payment moved status to partially_paid');

  perform public.record_owner_invoice_payment(gen_random_uuid(), current_setting('t.issued')::uuid, 69000, current_date);
  select * into inv from public.owner_invoices where id = current_setting('t.issued')::uuid;
  perform pg_temp.want(inv.amount_paid_cents = 119000, 'full payment updated amount_paid_cents');
  perform pg_temp.want(inv.status = 'paid', 'full payment moved status to paid');
  perform pg_temp.want(inv.invoice_number = current_setting('t.issued_number'),
    'payment reconciliation did not disturb the invoice number');
end $$;

-- ---------------------------------------------------------------------------
-- 6. Invoice-number protection still holds for a PRIVILEGED caller as well.
-- ---------------------------------------------------------------------------
do $$
declare v_msg text;
begin
  begin
    update public.owner_invoices set invoice_number = 'RE-RENUMBERED' where id = current_setting('t.issued')::uuid;
    perform pg_temp.fail('an issued invoice was renumbered');
  exception when others then v_msg := sqlerrm;
  end;
  perform pg_temp.want(v_msg like '%invoice numbers cannot be changed%',
    'issued invoice numbers are still immutable, database owner included');
end $$;

-- ---------------------------------------------------------------------------
-- 7. Storno still works, still keeps the document, still idempotent.
-- ---------------------------------------------------------------------------
do $$
declare v_inv jsonb; v_id uuid; r jsonb; c jsonb; inv record; v_lines int;
begin
  v_inv := public.create_owner_invoice(gen_random_uuid(), pg_temp.header(), pg_temp.body());
  v_id := (v_inv->>'invoice_id')::uuid;
  perform public.owner_link_invoice_customer(v_id, current_setting('t.customer')::uuid);
  r := public.issue_owner_invoice(gen_random_uuid(), v_id);

  c := public.owner_cancel_invoice(v_id, 'Kunde hat storniert');
  perform pg_temp.want(c->>'status' = 'cancelled', 'owner_cancel_invoice still cancels an issued invoice');

  select * into inv from public.owner_invoices where id = v_id;
  select count(*) into v_lines from public.owner_invoice_lines where invoice_id = v_id;
  perform pg_temp.want(inv.status = 'cancelled', 'cancelled status persisted');
  perform pg_temp.want(inv.cancelled_at is not null and inv.cancellation_reason = 'Kunde hat storniert',
    'cancellation metadata was written through the sanctioned path');
  perform pg_temp.want(inv.invoice_number = r->>'invoice_number', 'Storno kept the invoice number');
  perform pg_temp.want(inv.gross_total_cents = 119000 and v_lines = 1, 'Storno kept the totals and lines');

  c := public.owner_cancel_invoice(v_id, 'nochmal');
  perform pg_temp.want((c->>'already_cancelled')::boolean, 'owner_cancel_invoice is still idempotent');

  perform set_config('t.cancelled', v_id::text, false);
end $$;

-- A cancelled invoice is frozen for the client exactly like an issued one.
do $$
declare v_err text;
begin
  set local role authenticated;
  begin
    update public.owner_invoices set status = 'issued' where id = current_setting('t.cancelled')::uuid;
    v_err := null;
  exception when others then v_err := sqlstate;
  end;
  reset role;
  perform pg_temp.want(v_err is not null, 'a cancelled invoice cannot be revived by a client UPDATE');
end $$;

-- ---------------------------------------------------------------------------
-- 8. MANUAL conversion: recurring lines excluded, provenance recorded, canonical
--    customer linked.
-- ---------------------------------------------------------------------------
do $$
declare v_offer uuid; r jsonb; v_id uuid; inv record; v_lines int; v_recurring int;
begin
  v_offer := pg_temp.make_offer('AN-MANUAL', null);
  r := public.convert_owner_offer_to_invoice_draft(gen_random_uuid(), v_offer, null);
  v_id := (r->>'invoice_id')::uuid;

  select * into inv from public.owner_invoices where id = v_id;
  select count(*) into v_lines from public.owner_invoice_lines where invoice_id = v_id;
  select count(*) into v_recurring from public.owner_invoice_lines
    where invoice_id = v_id and description = 'Monatliche Betreuung';

  perform pg_temp.want(v_lines = 1, 'manual conversion copied exactly the one-time position');
  perform pg_temp.want(v_recurring = 0, 'manual conversion did not bill the recurring position');
  perform pg_temp.want((r->>'recurring_lines_excluded')::int = 1, 'manual conversion reports the excluded recurring line');
  perform pg_temp.want(inv.net_total_cents = 200000, 'manual conversion totals are the one-time amount only');
  perform pg_temp.want(inv.source_offer_id = v_offer and inv.source_offer_conversion_kind = 'full',
    'manual conversion records its provenance');
  perform pg_temp.want(inv.owner_customer_id = current_setting('t.customer')::uuid,
    'manual conversion links the canonical owner_customer');
  perform pg_temp.want(inv.due_date = current_date + 21,
    'manual conversion uses the configured payment term (21 days)');

  perform set_config('t.manual_offer', v_offer::text, false);
  perform set_config('t.manual_invoice', v_id::text, false);
end $$;

-- ---------------------------------------------------------------------------
-- 9. AUTOMATED conversion produces the SAME invoice the manual path produces.
--    Compared field by field rather than asserted in prose.
-- ---------------------------------------------------------------------------
do $$
declare v_offer uuid; v_id uuid; a record; m record; v_lines int; v_recurring int;
begin
  v_offer := pg_temp.make_offer('AN-AUTO', null);
  v_id := public.owner_convert_offer_internal(v_offer);

  select * into a from public.owner_invoices where id = v_id;
  select * into m from public.owner_invoices where id = current_setting('t.manual_invoice')::uuid;
  select count(*) into v_lines from public.owner_invoice_lines where invoice_id = v_id;
  select count(*) into v_recurring from public.owner_invoice_lines
    where invoice_id = v_id and description = 'Monatliche Betreuung';

  perform pg_temp.want(v_recurring = 0, 'automated conversion no longer bills the recurring position');
  perform pg_temp.want(v_lines = 1, 'automated conversion copied exactly the one-time position');
  perform pg_temp.want(a.net_total_cents = m.net_total_cents and a.vat_total_cents = m.vat_total_cents
    and a.gross_total_cents = m.gross_total_cents, 'automated and manual conversion produce identical totals');
  perform pg_temp.want(a.due_date = m.due_date and a.issue_date = m.issue_date and a.currency = m.currency,
    'automated and manual conversion produce identical dates and currency');
  perform pg_temp.want(a.source_offer_id = v_offer and a.source_offer_conversion_kind = 'full',
    'automated conversion records its provenance (it did not before)');
  perform pg_temp.want(a.owner_customer_id = current_setting('t.customer')::uuid,
    'automated conversion links the canonical owner_customer');
  perform pg_temp.want(a.status = 'draft', 'automated conversion still produces a DRAFT, not an issued invoice');

  perform set_config('t.auto_offer', v_offer::text, false);
  perform set_config('t.auto_invoice', v_id::text, false);
end $$;

-- ---------------------------------------------------------------------------
-- 10. Repeated conversion cannot duplicate the initial invoice — on either path,
--     and across the two paths.
-- ---------------------------------------------------------------------------
do $$
declare v_again uuid; r jsonb; v_count int;
begin
  v_again := public.owner_convert_offer_internal(current_setting('t.auto_offer')::uuid);
  perform pg_temp.want(v_again = current_setting('t.auto_invoice')::uuid,
    'repeating the automated conversion returns the existing invoice');

  r := public.convert_owner_offer_to_invoice_draft(gen_random_uuid(), current_setting('t.auto_offer')::uuid, null);
  perform pg_temp.want((r->>'invoice_id')::uuid = current_setting('t.auto_invoice')::uuid,
    'the manual path on an already-automated offer returns the same invoice');

  select count(*) into v_count from public.owner_invoices where source_offer_id = current_setting('t.auto_offer')::uuid;
  perform pg_temp.want(v_count = 1, 'exactly one invoice exists for the automated offer');
end $$;

-- The headline over-invoicing case: a manual RATE invoice leaves the offer 'accepted' and
-- converted_invoice_id null on purpose. The old automation saw an unconverted offer and
-- created a SECOND invoice for the FULL one-time amount.
do $$
declare v_offer uuid; r jsonb; v_err text; v_msg text; v_count int; v_net bigint;
begin
  v_offer := pg_temp.make_offer('AN-RATE',
    '[{"label":"Rate 1","percentage_bp":5000},{"label":"Rate 2","percentage_bp":5000}]'::jsonb);

  r := public.convert_owner_offer_to_invoice_draft(gen_random_uuid(), v_offer, 0);
  select net_total_cents into v_net from public.owner_invoices where id = (r->>'invoice_id')::uuid;
  perform pg_temp.want(v_net = 100000, 'manual milestone conversion billed 50 % of the one-time amount');

  begin
    perform public.owner_convert_offer_internal(v_offer);
    v_err := null;
  exception when others then v_err := sqlstate; v_msg := sqlerrm;
  end;
  perform pg_temp.want(v_err is not null,
    'automation can no longer invoice the full amount of an offer that already has a rate invoice');
  perform pg_temp.want(v_msg like '%instalment invoice(s) already exist%',
    format('refusal is the canonical duplicate rule (got: %s)', coalesce(v_msg, '<none>')));

  select count(*) into v_count from public.owner_invoices where source_offer_id = v_offer;
  perform pg_temp.want(v_count = 1, 'the offer still has exactly its one rate invoice');

  -- The second rate remains a deliberate, possible action.
  r := public.convert_owner_offer_to_invoice_draft(gen_random_uuid(), v_offer, 1);
  perform pg_temp.want((r->>'invoice_id') is not null, 'the second rate can still be invoiced deliberately');

  select count(*) into v_count from public.owner_invoices where source_offer_id = v_offer;
  perform pg_temp.want(v_count = 2, 'two rate invoices, no full-amount invoice');
end $$;

-- ---------------------------------------------------------------------------
-- 11. A recurring-only offer produces no initial invoice on either path.
-- ---------------------------------------------------------------------------
do $$
declare v_offer uuid; v_err text; v_msg text; v_inv uuid; v_count int;
begin
  insert into public.owner_offers (business_entity_id, organization_id, owner_customer_id, status, title,
    offer_number, currency, created_by, accepted_at,
    recipient_company, recipient_street, recipient_postal_code, recipient_city, recipient_email)
  values (current_setting('t.entity')::uuid, '44444444-4444-4444-4444-444444444444',
    current_setting('t.customer')::uuid, 'draft', 'Nur Abo', 'AN-ABO', 'EUR',
    current_setting('t.owner')::uuid, now(),
    'Integrity AG', 'Kundenstr. 1', '20095', 'Hamburg', 'ida@integrity.example')
  returning id into v_offer;
  insert into public.owner_offer_lines (offer_id, description, quantity_milli, unit_price_cents,
    vat_rate_bp, vat_treatment, is_optional, sort_order, pricing_type, billing_interval)
  values (v_offer, 'Monatliche Betreuung', 1000, 50000, 1900, 'standard', false, 0, 'recurring', 'monthly');
  update public.owner_offers set status = 'accepted' where id = v_offer;

  begin
    perform public.convert_owner_offer_to_invoice_draft(gen_random_uuid(), v_offer, null);
    v_err := null;
  exception when others then v_err := sqlstate; v_msg := sqlerrm;
  end;
  perform pg_temp.want(v_err is not null, 'manual conversion of a recurring-only offer still raises');

  -- The automation must NOT raise: an unattended acceptance has a certificate and a
  -- confirmation e-mail to finish. It simply produces no invoice.
  v_inv := public.owner_convert_offer_internal(v_offer);
  perform pg_temp.want(v_inv is null, 'automated conversion of a recurring-only offer creates no invoice');

  select count(*) into v_count from public.owner_invoices where source_offer_id = v_offer;
  perform pg_temp.want(v_count = 0, 'no invoice row exists for the recurring-only offer');
end $$;

-- ---------------------------------------------------------------------------
-- 12. Issuance still captures the immutable snapshot — including for an invoice
--     the automation created.
-- ---------------------------------------------------------------------------
do $$
declare r jsonb; ver record; snap jsonb;
begin
  r := public.issue_owner_invoice(gen_random_uuid(), current_setting('t.auto_invoice')::uuid);
  perform pg_temp.want(r->>'status' = 'issued', 'an automation-created invoice still issues normally');

  select * into ver from public.owner_invoice_versions where invoice_id = current_setting('t.auto_invoice')::uuid;
  perform pg_temp.want(ver.id is not null, 'issuance still captured an immutable snapshot');
  perform pg_temp.want(ver.version = 1 and ver.source_hash ~ '^[0-9a-f]{64}$', 'snapshot is versioned and hashed');

  snap := ver.snapshot;
  perform pg_temp.want(snap->'recipient'->>'resolved_from' = 'owner_customer',
    'the canonical customer link makes the snapshot resolve the recipient from owner_customer');
  perform pg_temp.want(snap->'recipient'->>'company' = 'Integrity AG', 'snapshot recipient captured');
  perform pg_temp.want(jsonb_array_length(snap->'lines') = 1,
    'the snapshot carries only the one-time line — no recurring position was ever billed');
end $$;

-- ---------------------------------------------------------------------------
-- 13. The real acceptance pipeline, end to end. owner_process_offer_acceptance is
--     the function the public acceptance flow and the worker call; it is the only
--     caller of owner_convert_offer_internal that can be affected by the
--     conversion now being able to produce no invoice.
-- ---------------------------------------------------------------------------
do $$
declare v_offer uuid; r jsonb; v_lines int; v_recurring int; v_notes int;
begin
  v_offer := pg_temp.make_offer('AN-PIPELINE', null);
  r := public.owner_process_offer_acceptance(v_offer, null);

  perform pg_temp.want((r->>'processed')::boolean, 'acceptance pipeline still processes an accepted offer');
  perform pg_temp.want((r->>'invoice_created')::boolean, 'acceptance pipeline still creates the invoice draft');

  select count(*) into v_lines from public.owner_invoice_lines where invoice_id = (r->>'invoice_id')::uuid;
  select count(*) into v_recurring from public.owner_invoice_lines
    where invoice_id = (r->>'invoice_id')::uuid and description = 'Monatliche Betreuung';
  perform pg_temp.want(v_lines = 1 and v_recurring = 0,
    'the invoice the acceptance pipeline creates no longer bills the recurring position');

  select count(*) into v_notes from public.owner_finance_notifications
    where category = 'invoice_created' and resource_id = (r->>'invoice_id')::uuid;
  perform pg_temp.want(v_notes = 1, 'the pipeline still notifies that an invoice was created');
end $$;

-- A recurring-only offer: the pipeline must COMPLETE (certificate + confirmation are still
-- owed to the customer) while creating no invoice and announcing none.
do $$
declare v_offer uuid; r jsonb; v_count int; v_notes int;
begin
  insert into public.owner_offers (business_entity_id, organization_id, owner_customer_id, status, title,
    offer_number, currency, created_by,
    recipient_company, recipient_street, recipient_postal_code, recipient_city, recipient_email)
  values (current_setting('t.entity')::uuid, '44444444-4444-4444-4444-444444444444',
    current_setting('t.customer')::uuid, 'draft', 'Nur Abo 2', 'AN-ABO-2', 'EUR',
    current_setting('t.owner')::uuid,
    'Integrity AG', 'Kundenstr. 1', '20095', 'Hamburg', 'ida@integrity.example')
  returning id into v_offer;
  insert into public.owner_offer_lines (offer_id, description, quantity_milli, unit_price_cents,
    vat_rate_bp, vat_treatment, is_optional, sort_order, pricing_type, billing_interval)
  values (v_offer, 'Monatliche Betreuung', 1000, 50000, 1900, 'standard', false, 0, 'recurring', 'monthly');
  update public.owner_offers set status = 'accepted', accepted_at = now() where id = v_offer;

  r := public.owner_process_offer_acceptance(v_offer, null);
  perform pg_temp.want((r->>'processed')::boolean,
    'a recurring-only acceptance still completes instead of aborting the whole transaction');
  perform pg_temp.want(not (r->>'invoice_created')::boolean, 'no invoice was reported as created');
  perform pg_temp.want(r->>'invoice_id' is null, 'no invoice id was returned');

  select count(*) into v_count from public.owner_invoices where source_offer_id = v_offer;
  perform pg_temp.want(v_count = 0, 'no invoice row exists for the recurring-only acceptance');

  select count(*) into v_notes from public.owner_finance_notifications
    where category = 'invoice_created' and resource_id is null;
  perform pg_temp.want(v_notes = 0, 'no "Rechnung automatisch erstellt" notification points at nothing');
end $$;

-- ---------------------------------------------------------------------------
-- 14. Final state: the client UPDATE grant is gone and stays gone.
-- ---------------------------------------------------------------------------
do $$
declare v_count int;
begin
  select count(*) into v_count from information_schema.column_privileges
    where table_schema = 'public' and table_name = 'owner_invoices'
      and grantee = 'authenticated' and privilege_type = 'UPDATE';
  perform pg_temp.want(v_count = 0, 'authenticated holds no UPDATE privilege on owner_invoices, at any column');
end $$;

\echo 'ok: invoice integrity safeguards'
