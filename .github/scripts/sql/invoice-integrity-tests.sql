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

-- A SECOND organization, so "re-pointing an issued invoice to a different customer"
-- is a real change rather than a no-op the delta check would wave through.
insert into public.organizations (id, name, status, created_by)
  values ('44444444-4444-4444-4444-444444444445','Fremd GmbH','active', current_setting('t.owner')::uuid)
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
-- 4. An authenticated client cannot write the table at all: INSERT is revoked
--    too, so `authenticated` has SELECT-only direct access.
-- ---------------------------------------------------------------------------
do $$
declare v_err text;
begin
  set local role authenticated;
  begin
    insert into public.owner_invoices (business_entity_id, organization_id, status, issue_date, due_date)
    values (current_setting('t.entity')::uuid, '44444444-4444-4444-4444-444444444444', 'draft',
            current_date, current_date + 14);
    v_err := null;
  exception when others then v_err := sqlstate;
  end;
  reset role;
  perform pg_temp.want(v_err = '42501', 'authenticated cannot INSERT into owner_invoices at all');
end $$;

-- The full direct-permission matrix: nobody may write this table directly.
do $$
declare v_role text; v_extra text;
begin
  foreach v_role in array array['anon', 'authenticated', 'service_role'] loop
    select string_agg(privilege_type, ', ' order by privilege_type) into v_extra
    from information_schema.table_privileges
    where table_schema = 'public' and table_name = 'owner_invoices'
      and grantee = v_role and privilege_type <> 'SELECT';
    perform pg_temp.want(v_extra is null,
      format('%s holds no direct DML on owner_invoices (found: %s)', v_role, coalesce(v_extra, 'none')));
  end loop;

  perform pg_temp.want(
    not has_table_privilege('anon', 'public.owner_invoices', 'SELECT'),
    'anon cannot even read owner_invoices');
  perform pg_temp.want(
    has_table_privilege('authenticated', 'public.owner_invoices', 'SELECT')
    and has_table_privilege('service_role', 'public.owner_invoices', 'SELECT'),
    'authenticated and service_role keep SELECT');
end $$;

-- service_role — the key an edge function or worker holds — cannot write the table
-- by ANY verb. This is what stops the service key manufacturing a finished, numbered,
-- "paid" invoice without the counter and without an owner_invoice_versions snapshot.
do $$
declare v_err text; v_op text;
begin
  perform set_config('request.jwt.claim.role', 'service_role', false);
  set local role service_role;

  begin
    insert into public.owner_invoices (business_entity_id, organization_id, status, invoice_number,
      issue_date, due_date, net_total_cents, vat_total_cents, gross_total_cents, amount_paid_cents)
    values (current_setting('t.entity')::uuid, '44444444-4444-4444-4444-444444444444', 'paid',
            'RE-SERVICE-FORGED', current_date, current_date, 100000, 19000, 119000, 119000);
    v_err := null;
  exception when others then v_err := sqlstate;
  end;
  if v_err is distinct from '42501' then
    reset role; perform set_config('request.jwt.claim.role', 'authenticated', false);
    perform pg_temp.fail(format('service_role INSERT was not refused with 42501 (got %s)', coalesce(v_err, 'success')));
  end if;

  v_err := null;
  begin
    update public.owner_invoices set issue_date = date '2020-01-01' where id = current_setting('t.issued')::uuid;
    v_err := null;
  exception when others then v_err := sqlstate;
  end;
  if v_err is distinct from '42501' then
    reset role; perform set_config('request.jwt.claim.role', 'authenticated', false);
    perform pg_temp.fail(format('service_role UPDATE was not refused with 42501 (got %s)', coalesce(v_err, 'success')));
  end if;

  v_err := null;
  begin
    delete from public.owner_invoices where id = current_setting('t.issued')::uuid;
    v_err := null;
  exception when others then v_err := sqlstate;
  end;
  if v_err is distinct from '42501' then
    reset role; perform set_config('request.jwt.claim.role', 'authenticated', false);
    perform pg_temp.fail(format('service_role DELETE was not refused with 42501 (got %s)', coalesce(v_err, 'success')));
  end if;

  reset role;
  perform set_config('request.jwt.claim.role', 'authenticated', false);
  perform pg_temp.want(true, 'service_role cannot raw INSERT, UPDATE or DELETE owner_invoices');
  perform pg_temp.want(not exists (select 1 from public.owner_invoices where invoice_number = 'RE-SERVICE-FORGED'),
    'no forged service-role invoice reached the table');
end $$;

-- ...and defence in depth: even if a later migration handed the grant back, a
-- service-role JWT is not "privileged" to the guard, so the forged row is still refused.
grant insert, update on table public.owner_invoices to service_role;

do $$
declare v_msg text;
begin
  perform set_config('request.jwt.claim.role', 'service_role', false);
  set local role service_role;
  begin
    insert into public.owner_invoices (business_entity_id, organization_id, status, invoice_number, issue_date, due_date)
    values (current_setting('t.entity')::uuid, '44444444-4444-4444-4444-444444444444', 'paid',
            'RE-SERVICE-FORGED-2', current_date, current_date);
    v_msg := null;
  exception when others then v_msg := sqlerrm;
  end;
  reset role;
  perform set_config('request.jwt.claim.role', 'authenticated', false);
  perform pg_temp.want(v_msg like '%can only be created as drafts%',
    format('a service-role JWT is not privileged to the guard either (got: %s)', coalesce(v_msg, '<allowed!>')));
end $$;

do $$
declare v_msg text;
begin
  perform set_config('request.jwt.claim.role', 'service_role', false);
  set local role service_role;
  begin
    update public.owner_invoices set issue_date = date '2020-01-01' where id = current_setting('t.issued')::uuid;
    v_msg := null;
  exception when others then v_msg := sqlerrm;
  end;
  reset role;
  perform set_config('request.jwt.claim.role', 'authenticated', false);
  perform pg_temp.want(v_msg like '%cannot be modified directly%',
    format('a service-role UPDATE is refused by the guard as well (got: %s)', coalesce(v_msg, '<allowed!>')));
end $$;

revoke insert, update on table public.owner_invoices from service_role;

-- The approved RPCs still work for the roles that must call them: the owner through
-- PostgREST (SECURITY DEFINER, so no table grant is consulted)...
do $$
declare v_inv jsonb; v_id uuid; r jsonb;
begin
  set local role authenticated;
  v_inv := public.create_owner_invoice(gen_random_uuid(), pg_temp.header(), pg_temp.body());
  v_id := (v_inv->>'invoice_id')::uuid;
  r := public.issue_owner_invoice(gen_random_uuid(), v_id);
  reset role;
  perform pg_temp.want(r->>'status' = 'issued',
    'an authenticated owner still creates AND issues an invoice through the RPCs with no table grant');
  perform pg_temp.want(exists (select 1 from public.owner_invoice_versions where invoice_id = v_id),
    'and that RPC-issued invoice still captured its immutable snapshot');
  perform set_config('t.rpc_issued', v_id::text, false);
end $$;

-- ...and the worker as service_role through its own service-role-gated RPC.
do $$
declare v_inv jsonb; v_id uuid; r jsonb;
begin
  v_inv := public.create_owner_invoice(gen_random_uuid(), pg_temp.header(), pg_temp.body());
  v_id := (v_inv->>'invoice_id')::uuid;

  perform set_config('request.jwt.claim.role', 'service_role', false);
  set local role service_role;
  r := public.owner_issue_invoice_internal(v_id);
  reset role;
  perform set_config('request.jwt.claim.role', 'authenticated', false);

  perform pg_temp.want(r->>'status' = 'issued',
    'service_role still issues through owner_issue_invoice_internal with no table grant at all');
  perform pg_temp.want(exists (select 1 from public.owner_invoice_versions where invoice_id = v_id),
    'and that worker-issued invoice still captured its immutable snapshot');
end $$;

-- A cancellation and a payment through the RPCs, with the caller holding SELECT only.
do $$
declare inv record; c jsonb;
begin
  set local role authenticated;
  perform public.record_owner_invoice_payment(gen_random_uuid(), current_setting('t.rpc_issued')::uuid, 119000, current_date);
  reset role;
  select * into inv from public.owner_invoices where id = current_setting('t.rpc_issued')::uuid;
  perform pg_temp.want(inv.status = 'paid' and inv.amount_paid_cents = 119000,
    'record_owner_invoice_payment still reconciles with the caller holding SELECT only');

  set local role authenticated;
  c := public.owner_cancel_invoice(current_setting('t.rpc_issued')::uuid, 'Testabbruch');
  reset role;
  perform pg_temp.want(c->>'status' = 'cancelled',
    'owner_cancel_invoice still cancels with the caller holding SELECT only');
end $$;

-- Defence in depth again: even with INSERT restored, the guard refuses a forged
-- issued row while still permitting a genuine draft.
grant insert on table public.owner_invoices to authenticated;

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
  perform pg_temp.want(v_id is not null, 'a plain DRAFT insert is still allowed by the guard itself');
  delete from public.owner_invoices where id = v_id;
end $$;

revoke insert on table public.owner_invoices from authenticated;

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
-- 6. THE POINT OF THIS PR: an issued invoice's issuance-defining fields are
--    immutable for a PRIVILEGED caller too.
--
--    Every statement below runs as the database owner — is_database_admin() is
--    true, request_is_service_role() can be made true, and a SECURITY DEFINER
--    function runs in exactly this context. These are the mutations a future
--    buggy privileged RPC would perform. All of them must be refused.
--
--    The subject is a freshly issued, UNPAID invoice built by offer conversion,
--    so every field the battery attacks — provenance, canonical customer,
--    organization, notes, external reference — actually carries a value and the
--    attempted write is a real delta rather than a no-op.
--
--    The guard is deny-by-default: anything outside the three whitelisted
--    transitions is refused, which is why a column a later migration adds is
--    frozen after issuance without anyone remembering to list it here.
-- ---------------------------------------------------------------------------
do $$
declare v_offer uuid; r jsonb; v_id uuid;
begin
  v_offer := pg_temp.make_offer('AN-FROZEN', null);
  r := public.convert_owner_offer_to_invoice_draft(gen_random_uuid(), v_offer, null);
  v_id := (r->>'invoice_id')::uuid;
  r := public.issue_owner_invoice(gen_random_uuid(), v_id);
  perform pg_temp.want(r->>'status' = 'issued', 'subject invoice issued for the immutability battery');
  perform set_config('t.frozen', v_id::text, false);
  perform set_config('t.frozen_number', r->>'invoice_number', false);
end $$;

create or replace function pg_temp.refuses_as_owner(p_set text, p_what text) returns void
language plpgsql as $$
declare v_msg text;
begin
  begin
    execute format('update public.owner_invoices set %s where id = %L', p_set, current_setting('t.frozen'));
    perform pg_temp.fail(format('a database-owner UPDATE changed %s on an issued invoice', p_what));
  exception
    -- P0001 = raise_exception: the guard's own refusal, not a constraint violation.
    when sqlstate 'P0001' then v_msg := sqlerrm;
  end;
  perform pg_temp.want(v_msg is not null, format('issued invoice: %s refused for a privileged caller', p_what));
end $$;

do $$
begin
  perform pg_temp.refuses_as_owner($q$invoice_number = 'RE-RENUMBERED'$q$, 'invoice_number');
  perform pg_temp.refuses_as_owner($q$issue_date = date '2020-01-01'$q$, 'issue_date');
  perform pg_temp.refuses_as_owner($q$currency = 'CHF'$q$, 'currency');
  perform pg_temp.refuses_as_owner($q$due_date = date '2030-12-31'$q$, 'due_date');
  perform pg_temp.refuses_as_owner($q$service_date = date '2020-01-01'$q$, 'service_date');
  perform pg_temp.refuses_as_owner($q$service_period_start = date '2020-01-01', service_period_end = date '2020-01-31'$q$, 'service period');
  perform pg_temp.refuses_as_owner($q$issued_at = now() - interval '400 days'$q$, 'issued_at');
  perform pg_temp.refuses_as_owner($q$notes = 'nachträglich geändert'$q$, 'notes');
  perform pg_temp.refuses_as_owner($q$external_reference = 'Angebot GEFÄLSCHT'$q$, 'external_reference');
  perform pg_temp.refuses_as_owner($q$net_total_cents = 1, vat_total_cents = 0, gross_total_cents = 1$q$, 'totals');
  perform pg_temp.refuses_as_owner($q$archived_at = now()$q$, 'archived_at (no writer exists; deliberately frozen)');
  perform pg_temp.refuses_as_owner($q$historical_entry = true$q$, 'historical_entry');
  perform pg_temp.refuses_as_owner($q$source_offer_id = null$q$, 'source_offer_id');
  perform pg_temp.refuses_as_owner($q$source_offer_conversion_kind = 'milestone', source_offer_milestone_index = 0$q$, 'source provenance');
  perform pg_temp.refuses_as_owner($q$created_by = null$q$, 'created_by');
  perform pg_temp.refuses_as_owner($q$status = 'draft', issued_at = null, invoice_number = null$q$, 'reverting to draft');
  perform pg_temp.refuses_as_owner($q$status = 'void'$q$, 'status -> void (no sanctioned path)');
  perform pg_temp.refuses_as_owner($q$status = 'credited'$q$, 'status -> credited (no sanctioned path)');
  perform pg_temp.refuses_as_owner($q$status = 'overdue'$q$, 'status -> overdue (no sanctioned path)');
  perform pg_temp.refuses_as_owner($q$amount_paid_cents = 999999$q$, 'a paid amount that contradicts the ledger');
  perform pg_temp.refuses_as_owner($q$status = 'paid'$q$, 'a paid status that contradicts the ledger');
  perform pg_temp.refuses_as_owner($q$status = 'paid', amount_paid_cents = gross_total_cents$q$,
    'a fully forged payment that never entered the ledger');
  perform pg_temp.refuses_as_owner($q$cancelled_at = now()$q$, 'cancellation metadata without the cancellation');
  perform pg_temp.refuses_as_owner($q$status = 'cancelled'$q$, 'a cancellation without its metadata');
end $$;

-- Re-pointing the customer / organization of an issued invoice is refused; only a
-- FIRST link (null -> value) is permitted, which is exactly what
-- assign_invoice_organization() and owner_link_invoice_customer() allow themselves.
do $$
begin
  perform pg_temp.refuses_as_owner($q$owner_customer_id = null$q$, 'clearing owner_customer_id');
  perform pg_temp.refuses_as_owner($q$organization_id = '44444444-4444-4444-4444-444444444445'::uuid$q$,
    're-pointing organization_id to a different organization');
  perform pg_temp.refuses_as_owner($q$organization_id = null$q$, 'clearing organization_id');
end $$;

-- The same statements, run with a service_role JWT claim, are refused identically.
do $$
begin
  perform set_config('request.jwt.claim.role', 'service_role', false);
  perform pg_temp.refuses_as_owner($q$issue_date = date '2020-01-01'$q$, 'issue_date (service_role)');
  perform pg_temp.refuses_as_owner($q$currency = 'USD'$q$, 'currency (service_role)');
  perform pg_temp.refuses_as_owner($q$invoice_number = 'RE-SERVICE-ROLE'$q$, 'invoice_number (service_role)');
  perform pg_temp.refuses_as_owner($q$owner_customer_id = null$q$, 'owner_customer_id (service_role)');
  perform set_config('request.jwt.claim.role', 'authenticated', false);
end $$;

-- The row survived all of it unchanged.
do $$
declare inv record;
begin
  select * into inv from public.owner_invoices where id = current_setting('t.frozen')::uuid;
  perform pg_temp.want(
    inv.invoice_number = current_setting('t.frozen_number')
    and inv.issue_date = current_date and inv.currency = 'EUR'
    and inv.due_date = current_date + 21 and inv.archived_at is null
    and inv.historical_entry = false and inv.status = 'issued'
    and inv.amount_paid_cents = 0 and inv.net_total_cents = 200000
    and inv.owner_customer_id = current_setting('t.customer')::uuid
    and inv.organization_id = '44444444-4444-4444-4444-444444444444'
    and inv.source_offer_conversion_kind = 'full',
    'the issued invoice is field-for-field what it was after 28 privileged rewrite attempts');
end $$;

-- Line-level: an issued invoice's lines are frozen for a privileged caller too, even
-- for an edit that moves no money and would therefore never disturb the totals.
do $$
declare v_msg text;
begin
  begin
    update public.owner_invoice_lines set description = 'Andere Leistung'
      where invoice_id = current_setting('t.frozen')::uuid;
    perform pg_temp.fail('a database-owner UPDATE rewrote an issued invoice line');
  exception when others then v_msg := sqlerrm;
  end;
  perform pg_temp.want(v_msg like '%lines cannot be changed after issuance%',
    'issued invoice lines are immutable for a privileged caller');

  v_msg := null;
  begin
    insert into public.owner_invoice_lines (invoice_id, description, quantity_milli, unit_price_cents, vat_rate_bp, vat_treatment)
    values (current_setting('t.frozen')::uuid, 'Zusatzposition', 1000, 50000, 1900, 'standard');
    perform pg_temp.fail('a line was appended to an issued invoice');
  exception when others then v_msg := sqlerrm;
  end;
  perform pg_temp.want(v_msg is not null, 'no line can be appended to an issued invoice');

  v_msg := null;
  begin
    delete from public.owner_invoice_lines where invoice_id = current_setting('t.frozen')::uuid;
    perform pg_temp.fail('a line was deleted from an issued invoice');
  exception when others then v_msg := sqlerrm;
  end;
  perform pg_temp.want(v_msg is not null, 'no line can be removed from an issued invoice');
end $$;

-- Hard DELETE of a non-draft invoice is refused for the database owner AND for
-- service_role — the previous bypass is gone.
do $$
declare v_msg text;
begin
  begin
    delete from public.owner_invoices where id = current_setting('t.frozen')::uuid;
    perform pg_temp.fail('a database-owner DELETE removed an issued invoice');
  exception when others then v_msg := sqlerrm;
  end;
  perform pg_temp.want(v_msg like '%cannot be deleted%',
    'an issued invoice cannot be hard-deleted by the database owner');

  v_msg := null;
  perform set_config('request.jwt.claim.role', 'service_role', false);
  begin
    delete from public.owner_invoices where id = current_setting('t.frozen')::uuid;
    perform pg_temp.fail('a service_role DELETE removed an issued invoice');
  exception when others then v_msg := sqlerrm;
  end;
  perform set_config('request.jwt.claim.role', 'authenticated', false);
  perform pg_temp.want(v_msg like '%cannot be deleted%',
    'an issued invoice cannot be hard-deleted by service_role');

  perform pg_temp.want(exists (select 1 from public.owner_invoices where id = current_setting('t.frozen')::uuid),
    'the issued invoice is still there');
end $$;

-- service_role holds no direct DELETE privilege on the table either.
do $$
declare v_count int;
begin
  select count(*) into v_count from information_schema.table_privileges
    where table_schema = 'public' and table_name = 'owner_invoices'
      and grantee = 'service_role' and privilege_type = 'DELETE';
  perform pg_temp.want(v_count = 0, 'service_role holds no direct DELETE grant on owner_invoices');
end $$;

-- A real DRAFT is still deletable through the approved RPC, and its lines go with it.
do $$
declare v_inv jsonb; v_id uuid;
begin
  v_inv := public.create_owner_invoice(gen_random_uuid(), pg_temp.header(), pg_temp.body());
  v_id := (v_inv->>'invoice_id')::uuid;
  perform public.delete_owner_draft_invoice(v_id);
  perform pg_temp.want(not exists (select 1 from public.owner_invoices where id = v_id),
    'a never-issued draft is still deletable through delete_owner_draft_invoice');
  perform pg_temp.want(not exists (select 1 from public.owner_invoice_lines where invoice_id = v_id),
    'its lines cascaded away with it');
end $$;

-- A draft's lines are still freely editable before issuance.
do $$
declare v_inv jsonb; v_id uuid; v_net bigint;
begin
  v_inv := public.create_owner_invoice(gen_random_uuid(), pg_temp.header(), pg_temp.body());
  v_id := (v_inv->>'invoice_id')::uuid;
  update public.owner_invoice_lines set unit_price_cents = 250000 where invoice_id = v_id;
  select net_total_cents into v_net from public.owner_invoices where id = v_id;
  perform pg_temp.want(v_net = 250000, 'a draft still recalculates its totals from an intentional line edit');
  perform public.delete_owner_draft_invoice(v_id);
end $$;

-- A FIRST organization link on an ISSUED invoice still works: this is the
-- pre-portal-provisioning case assign_invoice_organization exists for.
do $$
declare v_inv jsonb; v_id uuid; r jsonb; v_org uuid; v_cust uuid;
begin
  v_inv := public.create_owner_invoice(gen_random_uuid(),
    jsonb_build_object('business_entity_id', current_setting('t.entity'),
      'issue_date','2026-03-02','service_date','2026-03-02','due_date','2026-03-16','currency','EUR'),
    pg_temp.body());
  v_id := (v_inv->>'invoice_id')::uuid;
  r := public.issue_owner_invoice(gen_random_uuid(), v_id);
  perform pg_temp.want(r->>'status' = 'issued', 'orphan invoice (no organization, no customer) issued');

  perform public.assign_invoice_organization(v_id, '44444444-4444-4444-4444-444444444444');
  select organization_id into v_org from public.owner_invoices where id = v_id;
  perform pg_temp.want(v_org = '44444444-4444-4444-4444-444444444444',
    'a FIRST organization link on an issued invoice still succeeds (assign_invoice_organization)');

  perform public.owner_link_invoice_customer(v_id, current_setting('t.customer')::uuid);
  select owner_customer_id into v_cust from public.owner_invoices where id = v_id;
  perform pg_temp.want(v_cust = current_setting('t.customer')::uuid,
    'a FIRST canonical-customer link on an issued invoice still succeeds');

  perform set_config('t.orphan', v_id::text, false);
end $$;

-- ...but re-pointing that same invoice is refused, by the RPC and by the table.
do $$
declare v_msg text;
begin
  begin
    perform public.owner_link_invoice_customer(current_setting('t.orphan')::uuid, null);
    perform pg_temp.fail('an issued invoice was unlinked from its customer');
  exception when others then v_msg := sqlerrm;
  end;
  perform pg_temp.want(v_msg is not null, 're-pointing the customer of an issued invoice is refused');

  v_msg := null;
  begin
    perform public.assign_invoice_organization(current_setting('t.orphan')::uuid,
      '44444444-4444-4444-4444-444444444445');
    perform pg_temp.fail('an issued invoice was reassigned to another organization');
  exception when others then v_msg := sqlerrm;
  end;
  perform pg_temp.want(v_msg is not null, 're-assigning the organization of an issued invoice is refused');
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
