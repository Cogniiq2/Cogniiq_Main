-- Client service onboarding — PRE-FIX defect reproduction.
--
-- Runs against a database that has ONLY 20260830120000 + 20260830121000 applied, i.e. the
-- exact state production was in when adding AI Receptionist to a customer returned:
--
--   code:    23503
--   message: insert or update on table "owner_audit_log" violates foreign key constraint
--            "owner_audit_log_business_entity_id_fkey"
--   details: Key (business_entity_id)=(64e1b3cf-...) is not present in
--            table "owner_business_entities".
--
-- This file asserts that the defect IS present here. It is the control for
-- client-service-onboarding-audit-fixed.sql, which asserts the same call succeeds once
-- 20260830122000 is applied. If this file ever stops failing, the reproduction has stopped
-- reproducing anything and the fix is no longer being tested against the real bug.
--
-- Synthetic data only.

\set ON_ERROR_STOP on

select set_config('app.role', 'owner', false);
select set_config('app.uid', '33333333-3333-3333-3333-333333333333', false);
insert into public.profiles (id) values ('33333333-3333-3333-3333-333333333333') on conflict do nothing;

-- ---------------------------------------------------------------------------
-- A. The precise mechanism: a task's OWN id is written as business_entity_id.
--
-- The service and engagement rows carry business_entity_id themselves, so they audit
-- correctly and can be inserted directly. Only the engagement-scoped child fails. Inserting
-- a task with a KNOWN id lets the FK's DETAIL be matched against that id, which proves the
-- generic factory used (row->>'id') rather than merely that something went wrong.
-- ---------------------------------------------------------------------------
do $$
declare
  v_entity uuid; v_cust uuid; v_svc uuid; v_eng uuid; v_task uuid := gen_random_uuid();
  r jsonb; v_state text; v_constraint text; v_detail text;
begin
  insert into public.owner_business_entities (display_name) values ('Defect Repro') returning id into v_entity;
  r := public.owner_create_customer(gen_random_uuid(), jsonb_build_object(
        'business_entity_id', v_entity, 'company', 'Repro Praxis GmbH'));
  v_cust := (r->>'customer_id')::uuid;

  insert into public.owner_customer_services (business_entity_id, customer_id, service_key)
  values (v_entity, v_cust, 'website') returning id into v_svc;
  insert into public.owner_service_engagements
    (business_entity_id, customer_id, customer_service_id, service_key)
  values (v_entity, v_cust, v_svc, 'website') returning id into v_eng;

  begin
    insert into public.owner_engagement_tasks
      (id, engagement_id, section_code, code, title, readiness_category)
    values (v_task, v_eng, 'discovery', 'REPRO-001', 'Repro', 'discovery');
    raise exception 'TEST defect: the pre-fix audit trigger unexpectedly accepted an engagement task';
  exception when foreign_key_violation then
    get stacked diagnostics
      v_state = returned_sqlstate,
      v_constraint = constraint_name,
      v_detail = pg_exception_detail;
  end;

  if v_state <> '23503' then
    raise exception 'TEST defect: expected SQLSTATE 23503, got %', v_state;
  end if;
  if v_constraint is distinct from 'owner_audit_log_business_entity_id_fkey' then
    raise exception 'TEST defect: expected the owner_audit_log FK, got %', v_constraint;
  end if;
  -- The offending key IS the task's primary key. This is the whole bug in one assertion.
  if position(v_task::text in coalesce(v_detail, '')) = 0 then
    raise exception 'TEST defect: the rejected key was not the task id (%): %', v_task, v_detail;
  end if;

  raise notice 'defect reproduced: owner_engagement_tasks.id % was written as business_entity_id', v_task;
end $$;

-- ---------------------------------------------------------------------------
-- B. The production symptom end to end: owner_add_customer_service('ai_receptionist')
--    fails, and rolls back completely — exactly what the read-only production diagnostics
--    found (no persisted onboarding rows carrying the failing entity id).
-- ---------------------------------------------------------------------------
do $$
declare
  v_entity uuid; v_cust uuid; r jsonb;
  v_state text; v_constraint text; v_services int; v_engagements int;
begin
  insert into public.owner_business_entities (display_name) values ('Defect Repro E2E') returning id into v_entity;
  r := public.owner_create_customer(gen_random_uuid(), jsonb_build_object(
        'business_entity_id', v_entity, 'company', 'Repro E2E Praxis GmbH'));
  v_cust := (r->>'customer_id')::uuid;

  begin
    r := public.owner_add_customer_service(gen_random_uuid(), v_cust, 'ai_receptionist');
    raise exception 'TEST defect: owner_add_customer_service unexpectedly succeeded before the fix';
  exception when foreign_key_violation then
    get stacked diagnostics v_state = returned_sqlstate, v_constraint = constraint_name;
  end;

  if v_state <> '23503' or v_constraint is distinct from 'owner_audit_log_business_entity_id_fkey' then
    raise exception 'TEST defect: expected 23503 on owner_audit_log_business_entity_id_fkey, got % / %', v_state, v_constraint;
  end if;

  -- Nothing survived. The failure is atomic, so no half-built onboarding is left behind.
  select count(*) into v_services from public.owner_customer_services where customer_id = v_cust;
  select count(*) into v_engagements from public.owner_service_engagements where customer_id = v_cust;
  if v_services <> 0 or v_engagements <> 0 then
    raise exception 'TEST defect: the failed call left % service(s) and % engagement(s) behind', v_services, v_engagements;
  end if;
end $$;

select 'client service onboarding audit DEFECT reproduced (pre-fix)' as result;
