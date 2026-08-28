-- Client service onboarding — POST-FIX proof, on the SAME database that just reproduced the
-- defect. 20260830122000 has now been applied on top of the two already-applied onboarding
-- migrations, which is exactly the production upgrade path.
--
-- The point of this file is narrow and deliberate: the identical call that raised 23503 a
-- moment ago must now succeed, on a database that still carries the pre-fix rows. Broad
-- coverage lives in client-service-onboarding-audit-tests.sql.

\set ON_ERROR_STOP on

select set_config('app.role', 'owner', false);
select set_config('app.uid', '33333333-3333-3333-3333-333333333333', false);

do $$
declare
  v_entity uuid; v_cust uuid; r jsonb; v_eng uuid;
  v_tasks int; v_fields int; v_bad int; v_audit int;
begin
  insert into public.owner_business_entities (display_name) values ('Fixed Repro') returning id into v_entity;
  r := public.owner_create_customer(gen_random_uuid(), jsonb_build_object(
        'business_entity_id', v_entity, 'company', 'Fixed Praxis GmbH'));
  v_cust := (r->>'customer_id')::uuid;

  -- The exact production call. No exception handler: if it raises, this suite fails loudly.
  r := public.owner_add_customer_service(gen_random_uuid(), v_cust, 'ai_receptionist');
  v_eng := (r->>'engagement_id')::uuid;
  if v_eng is null then raise exception 'TEST fixed: no engagement was instantiated'; end if;

  select count(*) into v_tasks  from public.owner_engagement_tasks  where engagement_id = v_eng;
  select count(*) into v_fields from public.owner_engagement_fields where engagement_id = v_eng;
  if v_tasks <> 171 or v_fields <> 132 then
    raise exception 'TEST fixed: instantiation incomplete (% tasks, % fields)', v_tasks, v_fields;
  end if;

  -- Every audit row written by this call names the customer's REAL business entity.
  select count(*) into v_audit from public.owner_audit_log
   where resource_type in ('owner_engagement_tasks', 'owner_engagement_fields')
     and resource_id in (select id from public.owner_engagement_tasks where engagement_id = v_eng
                         union all
                         select id from public.owner_engagement_fields where engagement_id = v_eng);
  if v_audit <> v_tasks + v_fields then
    raise exception 'TEST fixed: expected % audit rows, found %', v_tasks + v_fields, v_audit;
  end if;

  select count(*) into v_bad from public.owner_audit_log
   where resource_type in ('owner_engagement_tasks', 'owner_engagement_fields')
     and business_entity_id is distinct from v_entity;
  if v_bad > 0 then
    raise exception 'TEST fixed: % audit row(s) carry the wrong business entity', v_bad;
  end if;
end $$;

select 'client service onboarding audit FIX verified on the pre-fix database' as result;
