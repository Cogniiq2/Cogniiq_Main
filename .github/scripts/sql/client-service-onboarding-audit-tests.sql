-- Client service onboarding — audit entity resolution regression suite.
--
-- Runs against a database with 20260830120000 + 20260830121000 + 20260830122000 applied, in
-- that order. It covers the confirmed production bug and the properties the fix must keep
-- true for good:
--
--   1-8   the exact production case: adding AI Receptionist to a customer succeeds, exactly
--         once, with the whole template instantiated;
--   9-11  every audit row names the customer's REAL business entity, no task/field id can
--         ever appear as a business entity, and the owner_audit_log foreign key is intact
--         and un-weakened;
--   12    an idempotent retry returns the same service and engagement;
--   13-14 a non-owner cannot execute the owner RPCs and no browser role can write the
--         tables (or forge an audit row) directly;
--   15-17 focused proofs that owner_engagement_tasks and owner_engagement_fields resolve
--         their entity THROUGH engagement_id, on insert, update and delete — and that a
--         cascading delete is never blocked by the audit trigger.
--
-- Synthetic data only. No real customer, no external call. Assertions raise on failure.

\set ON_ERROR_STOP on

select set_config('app.role', 'owner', false);
select set_config('app.uid', '22222222-2222-2222-2222-222222222222', false);
insert into public.profiles (id) values ('22222222-2222-2222-2222-222222222222') on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 1-8. The exact production case, end to end.
--
-- Production called owner_add_customer_service(<key>, <customer>, 'ai_receptionist') and got
-- 23503 on owner_audit_log_business_entity_id_fkey. Here the same call must simply work, and
-- must produce exactly one service, exactly one engagement, and the complete template.
-- ---------------------------------------------------------------------------
do $$
declare
  v_entity uuid; v_cust uuid; r jsonb;
  v_svc uuid; v_eng uuid; v_sections int; v_tasks int; v_fields int; v_count int;
begin
  insert into public.owner_business_entities (display_name) values ('Audit Fix Entity') returning id into v_entity;

  r := public.owner_create_customer(gen_random_uuid(), jsonb_build_object(
        'business_entity_id', v_entity, 'company', 'Audit Praxis GmbH', 'email', 'audit@example.de'));
  v_cust := (r->>'customer_id')::uuid;

  -- (4)(5) the call itself must succeed. No exception handler on purpose: the production
  -- failure was an exception, so letting it propagate is the assertion.
  r := public.owner_add_customer_service(gen_random_uuid(), v_cust, 'ai_receptionist');
  v_svc := (r->>'service_id')::uuid;
  v_eng := (r->>'engagement_id')::uuid;
  if v_svc is null or v_eng is null then
    raise exception 'TEST audit: the call returned no service/engagement: %', r;
  end if;
  if not (r->>'created')::boolean then raise exception 'TEST audit: the first add must report created'; end if;

  -- (6)(7) exactly one of each.
  select count(*) into v_count from public.owner_customer_services
   where customer_id = v_cust and service_key = 'ai_receptionist';
  if v_count <> 1 then raise exception 'TEST audit: % service rows exist', v_count; end if;
  select count(*) into v_count from public.owner_service_engagements where customer_id = v_cust;
  if v_count <> 1 then raise exception 'TEST audit: % engagements exist', v_count; end if;

  -- (8) the AI Receptionist template was instantiated in full.
  select count(*) into v_sections from public.owner_engagement_sections where engagement_id = v_eng;
  select count(*) into v_tasks    from public.owner_engagement_tasks    where engagement_id = v_eng;
  select count(*) into v_fields   from public.owner_engagement_fields   where engagement_id = v_eng;
  if v_sections <> 20 or v_tasks <> 171 or v_fields <> 132 then
    raise exception 'TEST audit: incomplete instantiation (% sections, % tasks, % fields)',
      v_sections, v_tasks, v_fields;
  end if;

  perform set_config('audit.entity', v_entity::text, false);
  perform set_config('audit.customer', v_cust::text, false);
  perform set_config('audit.service', v_svc::text, false);
  perform set_config('audit.engagement', v_eng::text, false);
end $$;

-- ---------------------------------------------------------------------------
-- 9-10. The audit log carries the REAL business entity — and nothing else.
-- ---------------------------------------------------------------------------
do $$
declare
  v_entity uuid := current_setting('audit.entity')::uuid;
  v_eng uuid := current_setting('audit.engagement')::uuid;
  v_task_rows int; v_field_rows int; v_wrong int; v_expected int;
begin
  -- (9) audit rows exist for the instantiated children, all naming the customer's entity.
  select count(*) into v_task_rows from public.owner_audit_log a
   where a.action = 'owner_engagement_tasks.insert'
     and a.resource_id in (select id from public.owner_engagement_tasks where engagement_id = v_eng)
     and a.business_entity_id = v_entity;
  select count(*) into v_field_rows from public.owner_audit_log a
   where a.action = 'owner_engagement_fields.insert'
     and a.resource_id in (select id from public.owner_engagement_fields where engagement_id = v_eng)
     and a.business_entity_id = v_entity;
  select count(*) into v_expected from public.owner_engagement_tasks where engagement_id = v_eng;
  if v_task_rows <> v_expected then
    raise exception 'TEST audit: % of % task audit rows carry the real entity', v_task_rows, v_expected;
  end if;
  select count(*) into v_expected from public.owner_engagement_fields where engagement_id = v_eng;
  if v_field_rows <> v_expected then
    raise exception 'TEST audit: % of % field audit rows carry the real entity', v_field_rows, v_expected;
  end if;

  -- The service and engagement rows keep resolving from their own column.
  if not exists (select 1 from public.owner_audit_log
                  where action = 'owner_service_engagements.insert'
                    and resource_id = v_eng and business_entity_id = v_entity) then
    raise exception 'TEST audit: the engagement insert was not audited against its own entity';
  end if;

  -- (10) THE REGRESSION ITSELF, asserted globally rather than for one engagement: no task id
  -- and no field id may EVER appear in owner_audit_log.business_entity_id. This is the bug in
  -- one query, and it holds for every row this database has ever written.
  select count(*) into v_wrong from public.owner_audit_log a
   where a.business_entity_id in (select id from public.owner_engagement_tasks)
      or a.business_entity_id in (select id from public.owner_engagement_fields);
  if v_wrong > 0 then
    raise exception 'TEST audit: % audit row(s) use a task/field id as business_entity_id', v_wrong;
  end if;

  -- Sanitisation is preserved: free-text columns never reach the audit log.
  if exists (select 1 from public.owner_audit_log
              where resource_type = 'owner_engagement_tasks'
                and (after_summary ? 'notes' or before_summary ? 'notes')) then
    raise exception 'TEST audit: the sanitised summary leaked a stripped column';
  end if;
  -- Actor semantics are preserved: the acting owner is recorded, as the finance audit does.
  if exists (select 1 from public.owner_audit_log
              where resource_type = 'owner_engagement_tasks' and actor_user_id is null) then
    raise exception 'TEST audit: the acting user was not recorded';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 11. Foreign key integrity — the constraint that caught the bug is still there,
--     still enforced, and still pointing at owner_business_entities.
-- ---------------------------------------------------------------------------
do $$
declare v_orphans int; c record;
begin
  select count(*) into v_orphans from public.owner_audit_log a
   where a.business_entity_id is not null
     and not exists (select 1 from public.owner_business_entities e where e.id = a.business_entity_id);
  if v_orphans > 0 then
    raise exception 'TEST audit: % audit row(s) point at a non-existent business entity', v_orphans;
  end if;

  select con.conname, con.convalidated, cf.relname as target
    into c
  from pg_constraint con
  join pg_class cl on cl.oid = con.conrelid
  join pg_class cf on cf.oid = con.confrelid
  where con.contype = 'f' and cl.relname = 'owner_audit_log'
    and con.conkey = array[(select attnum from pg_attribute
                             where attrelid = 'public.owner_audit_log'::regclass
                               and attname = 'business_entity_id')];
  if c.conname is null then
    raise exception 'TEST audit: the owner_audit_log business_entity_id foreign key is GONE';
  end if;
  if c.target <> 'owner_business_entities' then
    raise exception 'TEST audit: the foreign key now targets %', c.target;
  end if;
  if not c.convalidated then
    raise exception 'TEST audit: the foreign key was weakened to NOT VALID';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 12. Idempotent retry: the same service and engagement come back, and nothing
--     is instantiated a second time.
-- ---------------------------------------------------------------------------
do $$
declare
  v_cust uuid := current_setting('audit.customer')::uuid;
  v_svc uuid := current_setting('audit.service')::uuid;
  v_eng uuid := current_setting('audit.engagement')::uuid;
  v_key uuid := gen_random_uuid();
  r1 jsonb; r2 jsonb; r3 jsonb; v_tasks int;
begin
  -- Same idempotency key twice: the claim helper replays the stored result.
  r1 := public.owner_add_customer_service(v_key, v_cust, 'ai_receptionist');
  r2 := public.owner_add_customer_service(v_key, v_cust, 'ai_receptionist');
  -- A fresh key still converges on the same rows, because the service is unique per customer.
  r3 := public.owner_add_customer_service(gen_random_uuid(), v_cust, 'ai_receptionist');

  if (r1->>'service_id')::uuid <> v_svc or (r1->>'engagement_id')::uuid <> v_eng
     or (r2->>'service_id')::uuid <> v_svc or (r2->>'engagement_id')::uuid <> v_eng
     or (r3->>'service_id')::uuid <> v_svc or (r3->>'engagement_id')::uuid <> v_eng then
    raise exception 'TEST audit: a retry returned a different service/engagement (% / % / %)', r1, r2, r3;
  end if;
  if (r1->>'created')::boolean or (r2->>'created')::boolean or (r3->>'created')::boolean then
    raise exception 'TEST audit: a retry reported created';
  end if;

  select count(*) into v_tasks from public.owner_engagement_tasks where engagement_id = v_eng;
  if v_tasks <> 171 then raise exception 'TEST audit: a retry re-instantiated tasks (% now)', v_tasks; end if;
end $$;

-- ---------------------------------------------------------------------------
-- 13. A non-owner still cannot execute the owner RPCs. The fix added a
--     SECURITY DEFINER function; it must not have opened a door.
-- ---------------------------------------------------------------------------
do $$
declare
  v_cust uuid := current_setting('audit.customer')::uuid;
  v_role text; v_threw boolean;
begin
  foreach v_role in array array['anon', 'admin', 'service'] loop
    perform set_config('app.role', v_role, false);
    v_threw := false;
    begin perform public.owner_add_customer_service(gen_random_uuid(), v_cust, 'website');
    exception when others then v_threw := true; end;
    if not v_threw then raise exception 'TEST audit authz: % could add a service', v_role; end if;
  end loop;
  perform set_config('app.role', 'owner', false);
end $$;

-- ---------------------------------------------------------------------------
-- 14. Direct browser writes remain impossible, and the audit trigger function
--     itself cannot be reached from a browser session to forge a row.
-- ---------------------------------------------------------------------------
do $$
declare t text; v_secdef boolean; v_path boolean;
begin
  foreach t in array array['owner_customer_services', 'owner_service_engagements',
                           'owner_engagement_tasks', 'owner_engagement_fields'] loop
    if has_table_privilege('anon', 'public.' || t, 'SELECT')
       or has_table_privilege('anon', 'public.' || t, 'INSERT') then
      raise exception 'TEST audit grants: anon can reach %', t;
    end if;
    if has_table_privilege('authenticated', 'public.' || t, 'INSERT')
       or has_table_privilege('authenticated', 'public.' || t, 'UPDATE')
       or has_table_privilege('authenticated', 'public.' || t, 'DELETE') then
      raise exception 'TEST audit grants: authenticated can write directly to %', t;
    end if;
  end loop;

  -- owner_audit_log stays append-only for the browser: readable by the owner, never writable.
  if has_table_privilege('authenticated', 'public.owner_audit_log', 'UPDATE')
     or has_table_privilege('authenticated', 'public.owner_audit_log', 'DELETE') then
    raise exception 'TEST audit grants: authenticated can rewrite the audit log';
  end if;
  if has_table_privilege('anon', 'public.owner_audit_log', 'SELECT') then
    raise exception 'TEST audit grants: anon can read the audit log';
  end if;

  -- The new trigger function: no browser role holds EXECUTE, service_role does, and it is
  -- SECURITY DEFINER with a pinned search_path like every other owner-side definer here.
  if has_function_privilege('authenticated', 'public.owner_write_service_onboarding_audit_row()', 'EXECUTE')
     or has_function_privilege('anon', 'public.owner_write_service_onboarding_audit_row()', 'EXECUTE') then
    raise exception 'TEST audit grants: a browser role can execute the audit trigger function';
  end if;
  if not has_function_privilege('service_role', 'public.owner_write_service_onboarding_audit_row()', 'EXECUTE') then
    raise exception 'TEST audit grants: service_role lost EXECUTE on the audit trigger function';
  end if;

  select p.prosecdef,
         exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')
    into v_secdef, v_path
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'owner_write_service_onboarding_audit_row';
  if v_secdef is null then raise exception 'TEST audit: the audit trigger function does not exist'; end if;
  if not v_secdef then raise exception 'TEST audit: the audit trigger function is not SECURITY DEFINER'; end if;
  if not v_path then raise exception 'TEST audit: the audit trigger function has no pinned search_path'; end if;
end $$;

-- ---------------------------------------------------------------------------
-- 15. FOCUSED: owner_engagement_tasks resolves its entity through engagement_id.
--     Insert, update and delete — the three operations the trigger fires for.
-- ---------------------------------------------------------------------------
do $$
declare
  v_entity uuid := current_setting('audit.entity')::uuid;
  v_eng uuid := current_setting('audit.engagement')::uuid;
  v_task uuid; v_ins uuid; v_upd uuid; v_del uuid;
begin
  insert into public.owner_engagement_tasks
    (engagement_id, section_code, code, title, readiness_category)
  values (v_eng, 'discovery', 'AUDIT-TASK-001', 'Audit resolution probe', 'discovery')
  returning id into v_task;

  update public.owner_engagement_tasks set status = 'in_progress' where id = v_task;
  delete from public.owner_engagement_tasks where id = v_task;

  select business_entity_id into v_ins from public.owner_audit_log
   where resource_id = v_task and action = 'owner_engagement_tasks.insert';
  select business_entity_id into v_upd from public.owner_audit_log
   where resource_id = v_task and action = 'owner_engagement_tasks.update';
  select business_entity_id into v_del from public.owner_audit_log
   where resource_id = v_task and action = 'owner_engagement_tasks.delete';

  if v_ins is distinct from v_entity then
    raise exception 'TEST task audit: insert resolved % instead of the engagement entity %', v_ins, v_entity;
  end if;
  if v_upd is distinct from v_entity then
    raise exception 'TEST task audit: update resolved % instead of %', v_upd, v_entity;
  end if;
  if v_del is distinct from v_entity then
    raise exception 'TEST task audit: delete resolved % instead of %', v_del, v_entity;
  end if;
  -- And never the row's own id, which is what the generic factory did.
  if v_ins = v_task then raise exception 'TEST task audit: the task id was used as the entity'; end if;
end $$;

-- ---------------------------------------------------------------------------
-- 16. FOCUSED: owner_engagement_fields resolves its entity through engagement_id.
-- ---------------------------------------------------------------------------
do $$
declare
  v_entity uuid := current_setting('audit.entity')::uuid;
  v_eng uuid := current_setting('audit.engagement')::uuid;
  v_field uuid; v_ins uuid; v_upd uuid; v_del uuid;
begin
  insert into public.owner_engagement_fields
    (engagement_id, section_code, code, label, data_type)
  values (v_eng, 'discovery', 'AUDIT-FIELD-001', 'Audit resolution probe', 'text')
  returning id into v_field;

  update public.owner_engagement_fields set value_text = 'probe' where id = v_field;
  delete from public.owner_engagement_fields where id = v_field;

  select business_entity_id into v_ins from public.owner_audit_log
   where resource_id = v_field and action = 'owner_engagement_fields.insert';
  select business_entity_id into v_upd from public.owner_audit_log
   where resource_id = v_field and action = 'owner_engagement_fields.update';
  select business_entity_id into v_del from public.owner_audit_log
   where resource_id = v_field and action = 'owner_engagement_fields.delete';

  if v_ins is distinct from v_entity or v_upd is distinct from v_entity or v_del is distinct from v_entity then
    raise exception 'TEST field audit: expected % on all three operations, got % / % / %',
      v_entity, v_ins, v_upd, v_del;
  end if;
  if v_ins = v_field then raise exception 'TEST field audit: the field id was used as the entity'; end if;
end $$;

-- ---------------------------------------------------------------------------
-- 17. A cascading delete is never blocked by the audit trigger.
--
-- Deleting a customer cascades to services, engagements, tasks and fields. By the time the
-- children's AFTER DELETE trigger runs, their engagement row is already gone, so the entity
-- cannot be resolved. The trigger must log a null entity rather than raise — raising would
-- make customers undeletable, and inventing an entity is what caused the original bug.
-- ---------------------------------------------------------------------------
do $$
declare
  v_entity uuid := current_setting('audit.entity')::uuid;
  v_cust uuid; r jsonb; v_eng uuid; v_left int; v_forged int;
begin
  r := public.owner_create_customer(gen_random_uuid(), jsonb_build_object(
        'business_entity_id', v_entity, 'company', 'Cascade Probe GmbH'));
  v_cust := (r->>'customer_id')::uuid;
  r := public.owner_add_customer_service(gen_random_uuid(), v_cust, 'ai_receptionist');
  v_eng := (r->>'engagement_id')::uuid;

  delete from public.owner_customers where id = v_cust;

  select count(*) into v_left from public.owner_engagement_tasks where engagement_id = v_eng;
  if v_left <> 0 then raise exception 'TEST cascade: % task(s) survived the customer delete', v_left; end if;

  -- The engagement's own delete was audited WITH its entity, so the trail is not lost.
  if not exists (select 1 from public.owner_audit_log
                  where action = 'owner_service_engagements.delete'
                    and resource_id = v_eng and business_entity_id = v_entity) then
    raise exception 'TEST cascade: the engagement delete was not audited against its entity';
  end if;

  -- And no orphaned child delete invented an entity.
  select count(*) into v_forged from public.owner_audit_log
   where action in ('owner_engagement_tasks.delete', 'owner_engagement_fields.delete')
     and business_entity_id is not null
     and not exists (select 1 from public.owner_business_entities e where e.id = business_entity_id);
  if v_forged > 0 then
    raise exception 'TEST cascade: % cascaded delete(s) invented a business entity', v_forged;
  end if;
end $$;

select 'client service onboarding audit tests passed' as result;
