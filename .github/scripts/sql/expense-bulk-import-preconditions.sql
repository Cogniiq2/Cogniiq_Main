-- PRECONDITIONS: the defect, demonstrated against the schema BEFORE 20260904120000.
--
-- Run before the expense-import migration is applied. Its whole job is to prove that the
-- problem this PR fixes was real, so the fix cannot later be mistaken for a change nobody
-- needed. If any assertion here starts failing, the "before" picture has changed and the
-- fix's justification must be re-read rather than the test relaxed.

\set ON_ERROR_STOP on
set client_min_messages = notice;

create or replace function pg_temp.pass(msg text) returns void language plpgsql as $$
begin raise notice 'PASS (precondition): %', msg; end $$;
create or replace function pg_temp.fail(msg text) returns void language plpgsql as $$
begin raise exception 'FAIL (precondition): %', msg; end $$;
create or replace function pg_temp.want(cond boolean, msg text) returns void language plpgsql as $$
begin if cond then perform pg_temp.pass(msg); else perform pg_temp.fail(msg); end if; end $$;

select set_config('t.owner','00000000-0000-0000-0000-000000000901',false);
insert into public.profiles (id, platform_role)
  values (current_setting('t.owner')::uuid, 'cogniiq_owner')
  on conflict (id) do update set platform_role = 'cogniiq_owner';
select set_config('request.jwt.claim.sub', current_setting('t.owner'), false);
select set_config('t.entity', (select id::text from public.owner_business_entities where slug='cogniiq'), false);

-- 1. There is no expense import path at all.
do $$
begin
  perform pg_temp.want(
    not exists (select 1 from pg_proc where proname = 'owner_bulk_import_expenses'),
    'before the fix: owner_bulk_import_expenses does not exist');
  perform pg_temp.want(
    not exists (select 1 from pg_proc where proname = 'owner_resolve_import_vendors'),
    'before the fix: there is no vendor resolver — only owner_resolve_import_customers');
  perform pg_temp.want(
    exists (select 1 from pg_proc where proname = 'owner_resolve_import_customers'),
    'before the fix: suppliers could only be looked up in the CUSTOMER table');
end $$;

-- 2. An expense payload sent to the revenue importer is silently DROPPED.
--    This is the failure mode the new guard closes.
do $$
declare r jsonb;
begin
  r := public.owner_bulk_import_finance(gen_random_uuid(),
    jsonb_build_object('schema_version', 1,
      'business_entity_id', current_setting('t.entity'),
      'invoices', jsonb_build_array(),
      'recurring_contracts', jsonb_build_array(jsonb_build_object(
        'client_import_id','PRE-CONTRACT-1','name','Platzhalter','start_date','2026-01-01',
        'customer', jsonb_build_object(),
        'lines', jsonb_build_array(jsonb_build_object('description','x','unit_price_cents',1000)))),
      'expenses', jsonb_build_array(jsonb_build_object(
        'client_import_id','PRE-EXP-1',
        'vendor', jsonb_build_object('name','OpenAI Ireland Limited'),
        'invoice_date','2026-04-14',
        'lines', jsonb_build_array(jsonb_build_object('description','API','net_cents',1933))))));

  perform pg_temp.want((r->>'contract_count')::int = 1,
    'before the fix: the revenue rows import');
  perform pg_temp.want(r->'expense_count' is null,
    'before the fix: the expense rows are DROPPED without a word and the result never mentions them');
  perform pg_temp.want((select count(*) from public.owner_expenses) = 0,
    'before the fix: not one expense was written');
end $$;

-- 3. The import record type cannot even name an expense.
do $$
declare ok boolean := false; v_batch uuid;
begin
  select id into v_batch from public.owner_finance_import_batches limit 1;
  begin
    insert into public.owner_finance_import_records (batch_id, business_entity_id, record_type, client_import_id)
    values (v_batch, current_setting('t.entity')::uuid, 'expense', 'PRE-CHECK-1');
  exception when others then ok := true;
  end;
  perform pg_temp.want(ok, 'before the fix: record_type has no ''expense'' value');
end $$;

-- Leave the database clean for the real suite.
set session_replication_role = replica;
delete from public.owner_finance_import_records;
delete from public.owner_finance_import_batches;
delete from public.owner_revenue_contract_lines;
delete from public.owner_revenue_contracts;
delete from public.owner_finance_requests;
set session_replication_role = origin;

select 'expense bulk import preconditions: the defect is reproduced' as result;
