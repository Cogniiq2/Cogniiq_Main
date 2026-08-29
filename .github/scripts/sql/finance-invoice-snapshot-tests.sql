-- Owner finance: invoice immutable issuance snapshot (Phase 1A).
--
-- These tests EXECUTE every new/changed RPC against a real Postgres, not just parse the SQL.
-- Covered: snapshot capture on every issuance path (issue_owner_invoice,
-- record_owner_historical_paid_invoice, owner_build_issued_invoice via
-- owner_post_revenue_contract_month, owner_issue_invoice_internal), snapshot immutability
-- against later CRM/settings changes, deterministic source hash, configured invoice-number
-- prefix used only for future invoices, concurrent-safe numbering, draft deletion guards
-- (including the owner_generated_documents bugfix), issued-invoice deletion always refused,
-- and idempotent cancellation.
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
delete from public.owner_generated_documents where source_resource_type = 'owner_invoices';
delete from public.owner_finance_documents where invoice_id is not null;
delete from public.owner_payments;
delete from public.owner_invoice_lines;
delete from public.owner_invoices;
delete from public.owner_invoice_counters;
delete from public.owner_customers;
delete from public.owner_finance_requests;
delete from public.owner_revenue_contract_postings;
delete from public.owner_revenue_contract_lines;
delete from public.owner_revenue_contracts;
delete from public.owner_document_settings;
set session_replication_role = origin;

select set_config('t.entity', (select id::text from public.owner_business_entities where slug='cogniiq'), false);

-- Deliberately a DIFFERENT name from the owner_customers row below, so a test asserting
-- "recipient came from the canonical owner_customer" cannot pass merely because it fell back
-- to the organization/client_account name instead (the exact fallback-order bug this caught).
insert into public.organizations (id, name, status, created_by)
  values ('44444444-4444-4444-4444-444444444444','Ursprung AG Holding (Org-Fallback, nicht erwartet)','active', current_setting('t.owner')::uuid)
  on conflict (id) do nothing;

insert into public.owner_document_settings (business_entity_id, legal_name, street, postal_code, city, tax_number, vat_id,
  bank_account_holder, iban, bic, bank_name, invoice_number_prefix, default_invoice_footer)
values (current_setting('t.entity')::uuid, 'Cogniiq UG (Original)', 'Erststr. 1', '10115', 'Berlin', 'ORIG-TAX', 'DEORIGVAT',
  'Cogniiq UG', 'DE89370400440532013000', 'COBADEFFXXX', 'Commerzbank', 'RE', 'Ursprüngliche Fußzeile');

insert into public.owner_customers (id, business_entity_id, organization_id, company, contact_name, email, street, postal_code, city, country_code)
values ('55555555-5555-5555-5555-555555555555', current_setting('t.entity')::uuid, '44444444-4444-4444-4444-444444444444',
  'Ursprung AG', 'Erika Ursprung', 'erika@ursprung.example', 'Kundenstr. 1', '20095', 'Hamburg', 'DE');
select set_config('t.customer', '55555555-5555-5555-5555-555555555555', false);

create or replace function pg_temp.body() returns jsonb language sql as $$
  select jsonb_build_array(jsonb_build_object('description','Beratung','quantity_milli',1000,
    'unit_price_cents',100000,'vat_rate_bp',1900,'vat_treatment','standard','sort_order',0)) $$;
create or replace function pg_temp.header(p_issue text) returns jsonb language sql as $$
  select jsonb_build_object('business_entity_id',current_setting('t.entity'),
    'organization_id','44444444-4444-4444-4444-444444444444','owner_customer_id',current_setting('t.customer'),
    'issue_date',p_issue,'service_date',p_issue,'due_date',p_issue,'currency','EUR') $$;

-- ---------------------------------------------------------------------------
-- 1. issue_owner_invoice captures a complete snapshot atomically.
-- ---------------------------------------------------------------------------
do $$
declare v_inv jsonb; v_id uuid; r jsonb; ver record; snap jsonb;
begin
  v_inv := public.create_owner_invoice(gen_random_uuid(), pg_temp.header('2026-02-01'), pg_temp.body());
  v_id := (v_inv->>'invoice_id')::uuid;
  -- create_owner_invoice has no owner_customer_id column in its INSERT list (a pre-existing,
  -- separate gap noted in the audit — out of scope for this migration); the real production
  -- path links the canonical customer via owner_link_invoice_customer(), so the test does the
  -- same rather than asserting against a header field the RPC silently ignores.
  perform public.owner_link_invoice_customer(v_id, current_setting('t.customer')::uuid);
  r := public.issue_owner_invoice(gen_random_uuid(), v_id);
  perform pg_temp.want(r->>'status' = 'issued', 'invoice issued');
  perform pg_temp.want((r->>'invoice_number') like 'RE-2026-%', 'invoice number uses configured prefix (RE)');

  select * into ver from public.owner_invoice_versions where invoice_id = v_id;
  perform pg_temp.want(ver.id is not null, 'snapshot row created on issuance');
  perform pg_temp.want(ver.version = 1, 'snapshot version is 1');
  perform pg_temp.want(ver.invoice_number = r->>'invoice_number', 'snapshot invoice_number matches issued number');
  perform pg_temp.want(ver.source_hash ~ '^[0-9a-f]{64}$', 'source_hash is sha256 hex');

  snap := ver.snapshot;
  perform pg_temp.want((snap->>'schema_version')::int = 1, 'snapshot carries explicit schema_version');
  perform pg_temp.want(snap->'seller'->>'legal_name' = 'Cogniiq UG (Original)', 'snapshot seller captured');
  perform pg_temp.want(snap->'seller'->>'iban' = 'DE89370400440532013000', 'snapshot seller bank details captured');
  perform pg_temp.want(snap->'recipient'->>'company' = 'Ursprung AG', 'snapshot recipient captured from canonical owner_customer');
  perform pg_temp.want(snap->'recipient'->>'resolved_from' = 'owner_customer', 'snapshot recipient resolution source recorded');
  perform pg_temp.want(jsonb_array_length(snap->'lines') = 1, 'snapshot line items captured');
  perform pg_temp.want((snap->'totals'->>'gross_cents')::bigint = 119000, 'snapshot totals are server-computed integer cents');
  perform pg_temp.want(not (snap->'invoice' ? 'notes'), 'snapshot excludes internal notes field');

  perform set_config('t.invoice1', v_id::text, false);
  perform set_config('t.hash1', ver.source_hash, false);
end $$;

-- ---------------------------------------------------------------------------
-- 2. Immutability: changing the customer and the document settings AFTER
--    issuance must not change the stored snapshot or a fresh capture of it.
-- ---------------------------------------------------------------------------
update public.owner_customers set company = 'Ursprung AG (umgezogen)', street = 'Neue Str. 99', city = 'München'
  where id = '55555555-5555-5555-5555-555555555555';
update public.owner_document_settings set legal_name = 'Cogniiq GmbH (neu)', iban = 'DE00000000000000000000', tax_number = 'NEW-TAX'
  where business_entity_id = current_setting('t.entity')::uuid;

do $$
declare snap jsonb;
begin
  select snapshot into snap from public.owner_invoice_versions where invoice_id = current_setting('t.invoice1')::uuid;
  perform pg_temp.want(snap->'recipient'->>'company' = 'Ursprung AG', 'stored snapshot recipient unchanged after later CRM edit');
  perform pg_temp.want(snap->'seller'->>'legal_name' = 'Cogniiq UG (Original)', 'stored snapshot seller unchanged after later settings edit');
  perform pg_temp.want(snap->'seller'->>'iban' = 'DE89370400440532013000', 'stored snapshot bank details unchanged after later settings edit');
end $$;

-- ---------------------------------------------------------------------------
-- 3. Deterministic hash for identical canonical input (white-box: called
--    directly as postgres, which bypasses the EXECUTE revoke exactly like a
--    superuser test harness always can — no RLS/grant is being weakened here).
-- ---------------------------------------------------------------------------
do $$
declare snap_a jsonb; snap_b jsonb; hash_a text; hash_b text; v_id uuid;
begin
  v_id := (public.create_owner_invoice(gen_random_uuid(), pg_temp.header('2026-02-05'), pg_temp.body())->>'invoice_id')::uuid;
  snap_a := public.owner_build_invoice_snapshot(v_id, 'RE-2026-TEST');
  snap_b := public.owner_build_invoice_snapshot(v_id, 'RE-2026-TEST');
  hash_a := encode(extensions.digest(convert_to(snap_a::text,'UTF8'),'sha256'::text),'hex');
  hash_b := encode(extensions.digest(convert_to(snap_b::text,'UTF8'),'sha256'::text),'hex');
  perform pg_temp.want(hash_a = hash_b, 'source hash deterministic for identical canonical input');
  delete from public.owner_invoice_lines where invoice_id = v_id;
  delete from public.owner_invoices where id = v_id;
end $$;

-- ---------------------------------------------------------------------------
-- 4. Missing/incomplete invoice blocks issuance (preflight unchanged).
-- ---------------------------------------------------------------------------
do $$
declare v_id uuid; threw boolean := false;
begin
  v_id := (public.create_owner_invoice(gen_random_uuid(),
    jsonb_build_object('business_entity_id',current_setting('t.entity'),'issue_date','2026-02-10','currency','EUR'),
    pg_temp.body())->>'invoice_id')::uuid;
  -- no due_date set -> issuance must be refused
  begin
    perform public.issue_owner_invoice(gen_random_uuid(), v_id);
  exception when others then threw := true;
  end;
  perform pg_temp.want(threw, 'issuance blocked when due_date is missing');
  perform pg_temp.want(not exists (select 1 from public.owner_invoice_versions where invoice_id = v_id), 'no snapshot captured for a blocked issuance');
end $$;

-- ---------------------------------------------------------------------------
-- 5. Drafts still reflect intentional edits before issuance (no snapshot yet).
-- ---------------------------------------------------------------------------
do $$
declare v_id uuid; inv record;
begin
  v_id := (public.create_owner_invoice(gen_random_uuid(), pg_temp.header('2026-02-11'), pg_temp.body())->>'invoice_id')::uuid;
  update public.owner_invoice_lines set unit_price_cents = 200000 where invoice_id = v_id;
  select * into inv from public.owner_invoices where id = v_id;
  perform pg_temp.want(inv.net_total_cents = 200000, 'draft totals reflect an intentional line edit');
  perform pg_temp.want(inv.status = 'draft', 'edited invoice is still a draft');
  perform pg_temp.want(not exists (select 1 from public.owner_invoice_versions where invoice_id = v_id), 'draft has no snapshot');
  delete from public.owner_invoice_lines where invoice_id = v_id;
  delete from public.owner_invoices where id = v_id;
end $$;

-- ---------------------------------------------------------------------------
-- 6. Concurrent issuance produces unique, sequential numbers (two invoices
--    issued back-to-back; the `for update` counter lock is what this proves
--    actually works, not merely compiles).
-- ---------------------------------------------------------------------------
do $$
declare id_a uuid; id_b uuid; num_a text; num_b text;
begin
  id_a := (public.create_owner_invoice(gen_random_uuid(), pg_temp.header('2026-03-01'), pg_temp.body())->>'invoice_id')::uuid;
  id_b := (public.create_owner_invoice(gen_random_uuid(), pg_temp.header('2026-03-01'), pg_temp.body())->>'invoice_id')::uuid;
  num_a := (public.issue_owner_invoice(gen_random_uuid(), id_a)->>'invoice_number');
  num_b := (public.issue_owner_invoice(gen_random_uuid(), id_b)->>'invoice_number');
  perform pg_temp.want(num_a is distinct from num_b, 'two issuances produce distinct numbers');
  perform pg_temp.want(exists (select 1 from public.owner_invoice_versions where invoice_number = num_a), 'first issuance has a snapshot');
  perform pg_temp.want(exists (select 1 from public.owner_invoice_versions where invoice_number = num_b), 'second issuance has a snapshot');
end $$;

-- ---------------------------------------------------------------------------
-- 7. Configured invoice_number_prefix is used for FUTURE invoices only —
--    already-issued numbers from before the change never change.
-- ---------------------------------------------------------------------------
update public.owner_document_settings set invoice_number_prefix = 'INV' where business_entity_id = current_setting('t.entity')::uuid;

do $$
declare v_id uuid; num text; old_num text;
begin
  select invoice_number into old_num from public.owner_invoices where id = current_setting('t.invoice1')::uuid;
  v_id := (public.create_owner_invoice(gen_random_uuid(), pg_temp.header('2026-03-02'), pg_temp.body())->>'invoice_id')::uuid;
  num := (public.issue_owner_invoice(gen_random_uuid(), v_id)->>'invoice_number');
  perform pg_temp.want(num like 'INV-2026-%', 'a NEW invoice picks up the changed prefix');
  perform pg_temp.want(old_num like 'RE-2026-%', 'a PREVIOUSLY issued invoice keeps its original prefix/number unchanged');
end $$;

update public.owner_document_settings set invoice_number_prefix = 'RE' where business_entity_id = current_setting('t.entity')::uuid;

-- ---------------------------------------------------------------------------
-- 8. record_owner_historical_paid_invoice also captures a snapshot.
-- ---------------------------------------------------------------------------
do $$
declare r jsonb; v_id uuid; ver record;
begin
  r := public.record_owner_historical_paid_invoice(gen_random_uuid(), pg_temp.header('2026-01-05'), pg_temp.body(),
    jsonb_build_object('payment_date','2026-01-06','method','bank_transfer'));
  v_id := (r->>'invoice_id')::uuid;
  select * into ver from public.owner_invoice_versions where invoice_id = v_id;
  perform pg_temp.want(ver.id is not null, 'historical paid invoice captures a snapshot too');
  perform pg_temp.want(r->>'status' = 'paid', 'historical invoice settles in full');
end $$;

-- ---------------------------------------------------------------------------
-- 9. owner_issue_invoice_internal (service-role/worker path) also captures a
--    snapshot, and is idempotent on an already-issued invoice.
-- ---------------------------------------------------------------------------
do $$
declare v_id uuid; r1 jsonb; r2 jsonb; ver record;
begin
  v_id := (public.create_owner_invoice(gen_random_uuid(), pg_temp.header('2026-03-10'), pg_temp.body())->>'invoice_id')::uuid;
  perform set_config('request.jwt.claim.role', 'service_role', false);
  r1 := public.owner_issue_invoice_internal(v_id);
  r2 := public.owner_issue_invoice_internal(v_id);
  perform set_config('request.jwt.claim.role', 'authenticated', false);
  perform pg_temp.want((r1->>'idempotent')::boolean = false, 'first internal issuance is not idempotent-shortcut');
  perform pg_temp.want((r2->>'idempotent')::boolean = true, 'second internal issuance call is idempotent');
  select * into ver from public.owner_invoice_versions where invoice_id = v_id;
  perform pg_temp.want(ver.id is not null, 'worker-path issuance captures a snapshot');
end $$;

-- ---------------------------------------------------------------------------
-- 10. Draft deletion: succeeds when safe, fails when linked to owner_payments,
--     owner_finance_documents, or owner_generated_documents (the bugfix).
-- ---------------------------------------------------------------------------
do $$
declare v_id uuid;
begin
  v_id := (public.create_owner_invoice(gen_random_uuid(), pg_temp.header('2026-04-01'), pg_temp.body())->>'invoice_id')::uuid;
  perform public.delete_owner_draft_invoice(v_id);
  perform pg_temp.want(not exists (select 1 from public.owner_invoices where id = v_id), 'safe draft deletion succeeds');
end $$;

do $$
declare v_id uuid; threw boolean := false;
begin
  v_id := (public.create_owner_invoice(gen_random_uuid(), pg_temp.header('2026-04-02'), pg_temp.body())->>'invoice_id')::uuid;
  insert into public.owner_generated_documents (business_entity_id, document_type, source_resource_type, source_resource_id,
    status, template_version, source_hash)
  values (current_setting('t.entity')::uuid, 'invoice', 'owner_invoices', v_id, 'draft', 'transactional-v1', repeat('a',64));
  begin
    perform public.delete_owner_draft_invoice(v_id);
  exception when others then threw := true;
  end;
  perform pg_temp.want(threw, 'draft deletion refused when linked to owner_generated_documents (bugfix)');
  delete from public.owner_generated_documents where source_resource_id = v_id;
  perform public.delete_owner_draft_invoice(v_id);
  perform pg_temp.want(not exists (select 1 from public.owner_invoices where id = v_id), 'draft deletable again once the linked document is gone');
end $$;

-- ---------------------------------------------------------------------------
-- 11. Issued invoice deletion ALWAYS fails — RPC, and a raw DELETE blocked by
--     the owner_guard_invoice trigger. Never weakened by this migration.
-- ---------------------------------------------------------------------------
do $$
declare threw1 boolean := false;
begin
  begin
    perform public.delete_owner_draft_invoice(current_setting('t.invoice1')::uuid);
  exception when others then threw1 := true;
  end;
  perform pg_temp.want(threw1, 'delete_owner_draft_invoice refuses an issued invoice');
end $$;

-- The real app role (`authenticated`, what every browser/PostgREST request actually runs as) has
-- no DELETE grant on owner_invoices at all — this test runs AS that role, not as the postgres
-- superuser, because owner_guard_invoice() deliberately bypasses its own check for
-- is_database_admin()/request_is_service_role() (pre-existing, unrelated to this migration, and
-- NOT weakened here) — a superuser connection would pass through that bypass and prove nothing.
do $$
declare threw2 boolean := false;
begin
  execute 'set role authenticated';
  begin
    delete from public.owner_invoices where id = current_setting('t.invoice1')::uuid;
  exception when others then threw2 := true;
  end;
  execute 'reset role';
  perform pg_temp.want(threw2, 'raw DELETE on an issued invoice as the authenticated app role is refused (no grant + guard trigger)');
  perform pg_temp.want(exists (select 1 from public.owner_invoices where id = current_setting('t.invoice1')::uuid), 'issued invoice still exists');
end $$;

-- ---------------------------------------------------------------------------
-- 12. Cancellation is unchanged and idempotent: number/lines/snapshot survive.
-- ---------------------------------------------------------------------------
do $$
declare r1 jsonb; r2 jsonb; inv record; snap_after jsonb;
begin
  r1 := public.owner_cancel_invoice(current_setting('t.invoice1')::uuid, 'Testkorrektur');
  r2 := public.owner_cancel_invoice(current_setting('t.invoice1')::uuid, 'Testkorrektur erneut');
  select * into inv from public.owner_invoices where id = current_setting('t.invoice1')::uuid;
  perform pg_temp.want(inv.status = 'cancelled', 'invoice cancelled');
  perform pg_temp.want(inv.invoice_number is not null, 'cancellation preserves the invoice number');
  perform pg_temp.want((r2->>'already_cancelled')::boolean = true, 'second cancellation call is idempotent');
  select snapshot into snap_after from public.owner_invoice_versions where invoice_id = current_setting('t.invoice1')::uuid;
  perform pg_temp.want(snap_after->'recipient'->>'company' = 'Ursprung AG', 'snapshot untouched by cancellation');
end $$;

do $$ begin raise notice 'invoice snapshot tests: ALL PASSED'; end $$;
