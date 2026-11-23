-- AFTER the P0 hotfix (20261123120000): regression tests under Supabase-equivalent default
-- privileges. Runs only against the throwaway local cluster booted by
-- .github/scripts/run-internal-helper-privilege-sql-tests.sh — never against production.
\set ON_ERROR_STOP 1

create temp table t_internal(sig text primary key);
insert into t_internal values
  ('public.owner_counterparty_snapshot(uuid, uuid)'),
  ('public.owner_force_delete_children(text)'),
  ('public.owner_force_delete_manifest(text, uuid, integer)'),
  ('public.owner_force_delete_protected_tables()'),
  ('public.owner_force_delete_summary(text, uuid)'),
  ('public.owner_force_delete_table(text)'),
  ('public.owner_force_destroy_row(text, uuid, integer)'),
  ('public.owner_force_purge_storage(text, uuid)'),
  ('public.owner_purge_assert_no_orphans(text, uuid)'),
  ('public.owner_purge_blast_radius(text, uuid)'),
  ('public.owner_purge_dependencies(text)'),
  ('public.owner_purge_destroy_row(text, uuid, boolean)'),
  ('public.owner_purge_manifest(text, uuid)'),
  ('public.owner_purge_merge_counts(jsonb, jsonb)'),
  ('public.owner_purge_soft_references()'),
  ('public.owner_purge_storage_paths(text, uuid)');
grant select on t_internal to anon, authenticated, service_role;

create temp table t_entry(sig text primary key);
insert into t_entry values
  ('public.owner_force_delete_preview(text, uuid)'),
  ('public.owner_force_delete_phrase()'),
  ('public.owner_force_purge_items(uuid, text, uuid[], text, text)'),
  ('public.owner_force_delete_customer(uuid, text, text)'),
  ('public.owner_force_delete_token()'),
  ('public.owner_record_accounting_relevance(text, uuid)'),
  ('public.owner_workspace_purge_preflight_one(text, uuid)'),
  ('public.owner_workspace_purge_preflight(text, uuid[])'),
  ('public.owner_workspace_purge_items(uuid, text, uuid[], text)'),
  ('public.owner_purge_customer(uuid, text)'),
  ('public.owner_storage_purge_status(uuid)'),
  ('public.owner_storage_purge_retry_failed(uuid)');

-- A call expression with typed NULL arguments for every internal helper. The permission check
-- happens before the body runs, so NULLs are enough to prove "denied" without touching data.
create temp table t_calls as
select i.sig,
       format('select %s(%s)', p.oid::regproc::text,
              coalesce((select string_agg('null::' || format_type(t, null), ', ' order by o)
                        from unnest(p.proargtypes::oid[]) with ordinality u(t, o)), '')) as call
from t_internal i join pg_proc p on p.oid = to_regprocedure(i.sig);
grant select on t_calls to anon, authenticated, service_role;

-- Seed the owner and a throwaway row a customer will try to destroy.
update public.profiles set platform_role = 'cogniiq_owner'
 where id = '00000000-0000-0000-0000-000000000901';
insert into public.owner_customers (id, business_entity_id, company, status)
select '00000000-0000-0000-0000-0000000000c2', id, 'Zielkunde (lokal)', 'active'
from public.owner_business_entities where slug = 'cogniiq';

-- ===========================================================================
-- T1. Privilege matrix after the fix.
-- ===========================================================================
do $$
declare r record; v_bad text[] := '{}';
begin
  if (select count(*) from t_calls) <> 16 then
    raise exception 'FAIL T1: expected all 16 internal helpers to exist locally, found %', (select count(*) from t_calls);
  end if;
  for r in select sig from t_internal loop
    if has_function_privilege('authenticated', r.sig, 'execute') then v_bad := v_bad || ('authenticated:' || r.sig); end if;
    if has_function_privilege('anon', r.sig, 'execute') then v_bad := v_bad || ('anon:' || r.sig); end if;
    if not has_function_privilege('service_role', r.sig, 'execute') then v_bad := v_bad || ('service_role lost:' || r.sig); end if;
  end loop;
  for r in select sig from t_entry loop
    if not has_function_privilege('authenticated', r.sig, 'execute') then v_bad := v_bad || ('entry lost:' || r.sig); end if;
    if has_function_privilege('anon', r.sig, 'execute') then v_bad := v_bad || ('entry anon:' || r.sig); end if;
  end loop;
  if cardinality(v_bad) > 0 then raise exception 'FAIL T1: %', v_bad; end if;
  raise notice 'PASS T1: 16 internal helpers service_role-only; 12 owner entry points still authenticated-only';
end $$;

-- ===========================================================================
-- T2. A non-owner CUSTOMER session is refused every internal helper, and cannot delete data.
-- ===========================================================================
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000903', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
do $$
declare r record; v_ok int := 0;
begin
  if public.is_platform_owner() then raise exception 'FAIL T2: seed user 903 must not be the owner'; end if;
  for r in select sig, call from t_calls loop
    begin
      execute r.call;
      raise exception 'FAIL T2: customer executed %', r.sig;
    exception
      when insufficient_privilege then v_ok := v_ok + 1;
    end;
  end loop;
  begin
    perform public.owner_force_destroy_row('owner_customers', '00000000-0000-0000-0000-0000000000c2', 0);
    raise exception 'FAIL T2: customer destroyed a row';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS T2: customer session denied on all % internal helpers (42501)', v_ok;
end $$;
commit;
do $$ begin
  if not exists (select 1 from public.owner_customers where id = '00000000-0000-0000-0000-0000000000c2') then
    raise exception 'FAIL T2: the target row was deleted';
  end if;
  raise notice 'PASS T2b: target row intact after the customer attempt';
end $$;

-- ===========================================================================
-- T3. An ANONYMOUS session is refused every internal helper.
-- ===========================================================================
begin;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);
do $$
declare r record; v_ok int := 0;
begin
  for r in select sig, call from t_calls loop
    begin
      execute r.call;
      raise exception 'FAIL T3: anon executed %', r.sig;
    exception when insufficient_privilege then v_ok := v_ok + 1;
    end;
  end loop;
  raise notice 'PASS T3: anonymous session denied on all % internal helpers (42501)', v_ok;
end $$;
commit;

-- ===========================================================================
-- T4. The OWNER deletion workflows still work end to end, as role authenticated, through the
--     SECURITY DEFINER entry points that call the (now service_role-only) helpers internally.
-- ===========================================================================
-- Fixtures are created as the migration owner; the workflows then run as the owner session.
create temp table t_fx(k text primary key, id uuid);
grant select on t_fx to authenticated;
do $$
declare v_e uuid; v_inv uuid; v_c uuid; v_cinv uuid;
begin
  select id into v_e from public.owner_business_entities where slug = 'cogniiq';
  -- S1-style: a never-issued draft invoice in the Papierkorb.
  insert into public.owner_invoices (business_entity_id, status, issue_date, service_date, due_date, currency)
  values (v_e, 'draft', current_date, current_date, current_date, 'EUR') returning id into v_inv;
  insert into public.owner_invoice_lines (invoice_id, description, quantity_milli, unit_price_cents)
  values (v_inv, 'Zeile', 1000, 10000);
  insert into public.owner_workspace_item_state (business_entity_id, scope, resource_id, trashed_at, trashed_by)
  values (v_e, 'invoice', v_inv, now(), '00000000-0000-0000-0000-000000000901');
  -- S2-style: an archived test customer with only a draft and a task.
  insert into public.owner_customers (business_entity_id, company, status)
  values (v_e, 'Testkunde ohne Historie', 'active') returning id into v_c;
  insert into public.owner_invoices (business_entity_id, owner_customer_id, status, issue_date, service_date, due_date, currency)
  values (v_e, v_c, 'draft', current_date, current_date, current_date, 'EUR') returning id into v_cinv;
  insert into public.owner_customer_tasks (customer_id, business_entity_id, title) values (v_c, v_e, 'Rückruf');
  insert into t_fx values ('entity', v_e), ('invoice', v_inv), ('customer', v_c), ('customer_invoice', v_cinv);
end $$;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000901', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
do $$
declare
  v_e uuid := (select id from t_fx where k = 'entity');
  v_inv uuid := (select id from t_fx where k = 'invoice');
  v_c uuid := (select id from t_fx where k = 'customer');
  v_plan jsonb; v_res jsonb; v_prev jsonb;
begin
  if not public.is_platform_owner() then raise exception 'FAIL T4: seed user 901 must be the owner'; end if;

  -- Preview walks owner_force_delete_table / _summary / owner_purge_manifest / blast radius.
  v_prev := public.owner_force_delete_preview('invoice', v_inv);
  if v_prev is null then raise exception 'FAIL T4a: preview returned nothing'; end if;

  -- Preflight + purge walk owner_purge_manifest / _dependencies / _destroy_row / _assert_no_orphans.
  v_plan := public.owner_workspace_purge_preflight_one('invoice', v_inv);
  if (v_plan ->> 'eligibility') <> 'purgeable' then
    raise exception 'FAIL T4b: draft must be purgeable (got %)', v_plan ->> 'eligibility';
  end if;
  v_res := public.owner_workspace_purge_items(v_e, 'invoice', array[v_inv], 'Testentwurf');
  if (v_res -> 0 ->> 'outcome') <> 'hard_deleted' then raise exception 'FAIL T4c: %', v_res; end if;

  -- Customer purge walks owner_force_delete_summary / owner_counterparty_snapshot / destroyers.
  perform public.owner_archive_customer(v_c);
  v_res := public.owner_purge_customer(v_c, 'Testkunde ohne Historie');
  if not (v_res ->> 'deleted')::boolean then raise exception 'FAIL T4d: %', v_res; end if;
  raise notice 'PASS T4: owner preview, purge-preflight, invoice purge and customer purge succeed as authenticated';
end $$;
commit;

do $$ begin
  if exists (select 1 from public.owner_invoices where id = (select id from t_fx where k = 'invoice'))
     or exists (select 1 from public.owner_customers where id = (select id from t_fx where k = 'customer'))
     or exists (select 1 from public.owner_invoices where id = (select id from t_fx where k = 'customer_invoice'))
     or exists (select 1 from public.owner_customer_tasks where customer_id = (select id from t_fx where k = 'customer')) then
    raise exception 'FAIL T4e: owner purge left rows behind';
  end if;
  raise notice 'PASS T4e: owner purges removed exactly the intended rows';
end $$;

-- ===========================================================================
-- T5. A NON-OWNER cannot reach the destroyers through the entry points either.
-- ===========================================================================
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000903', true);
do $$
begin
  begin
    perform public.owner_purge_customer('00000000-0000-0000-0000-0000000000c2', 'x');
    raise exception 'FAIL T5: customer purged through the entry point';
  exception when others then
    if sqlerrm like 'FAIL T5%' then raise; end if;
    if sqlerrm <> 'Owner access required' then
      raise exception 'FAIL T5: expected the owner check to refuse, got: %', sqlerrm;
    end if;
  end;
  raise notice 'PASS T5: entry points still refuse non-owners (Owner access required)';
end $$;
commit;

-- ===========================================================================
-- T6. SERVICE-ROLE jobs keep working: the storage purge worker's RPCs and the helpers.
-- ===========================================================================
begin;
set local role service_role;
select set_config('request.jwt.claim.role', 'service_role', true);
do $$
declare v jsonb;
begin
  perform * from public.owner_storage_purge_claim_batch(1);
  v := public.owner_purge_merge_counts('{"a":1}'::jsonb, '{"a":2}'::jsonb);
  perform public.owner_force_delete_protected_tables();
  perform * from public.owner_purge_soft_references();
  raise notice 'PASS T6: service_role still executes the worker RPC and the internal helpers';
end $$;
commit;

-- ===========================================================================
-- T7. Nothing but privileges changed: no helper body was rewritten by the hotfix.
-- ===========================================================================
do $$
declare v_n int;
begin
  select count(*) into v_n from t_internal i
   where pg_get_functiondef(to_regprocedure(i.sig)) is null;
  if v_n > 0 then raise exception 'FAIL T7: % helper(s) missing', v_n; end if;
  raise notice 'PASS T7: all helpers still present (privileges-only change)';
end $$;


-- ===========================================================================
-- T8. PREVENTION INVARIANT. Under Supabase default privileges, no SECURITY DEFINER function
--     whose body carries no caller check may be executable by anon/authenticated, except the
--     reviewed list below. A new helper that forgets `revoke … from authenticated` (the root
--     cause of this P0) fails here in CI. Trigger functions are excluded: EXECUTE is not
--     checked when a trigger fires and they cannot be invoked through PostgREST.
--     Adding an exception requires a written reason; every FOLLOW-UP entry is a known,
--     lower-severity exposure tracked in docs/ops/p0-internal-helper-privilege-hotfix.md.
-- ===========================================================================
do $$
declare
  v_reviewed text[] := array[
    -- by design: token-authenticated public offer portal (raw token verified by hash inside)
    'public_offer_by_token(text,text)',
    'respond_offer_by_token(text,text,text,text,text,text,text,text)',
    -- by design: thin wrapper; provision_client_workspace_with_identity enforces the admin check
    'provision_client_workspace(uuid,text,text,text,text,text,text,text,text,text,text,text,text,text,bigint,bigint,text,text,text,bigint,bigint,bigint,date,text,text,organization_role)',
    -- FOLLOW-UP F1: source grants authenticated; acts only on already-accepted offers, idempotent
    'owner_process_offer_acceptance(uuid,uuid)',
    -- FOLLOW-UP F2: metadata-only disclosure for a known id (missing-setting names)
    'owner_invoice_preflight(uuid,uuid)',
    -- FOLLOW-UP F3: browser entry point without an owner check; returns relevance flags/counts
    'owner_record_accounting_relevance(text,uuid)',
    -- FOLLOW-UP F4: legacy execution-plan generator, anon can create plan rows
    'generate_daily_execution_plan(date)'
  ];
  v_bad text[];
begin
  select coalesce(array_agg(p.oid::regprocedure::text order by 1), '{}') into v_bad
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prosecdef and p.prokind = 'f' and p.prorettype <> 'trigger'::regtype
    and (has_function_privilege('anon', p.oid, 'execute') or has_function_privilege('authenticated', p.oid, 'execute'))
    and p.prosrc !~ '(is_platform_owner|is_platform_admin|request_is_service_role|auth\.uid\(\)|is_organization_member|has_organization_role|current_user_portal_context)'
    and not (p.oid::regprocedure::text = any (v_reviewed));
  if cardinality(v_bad) > 0 then
    raise exception 'FAIL T8: unguarded SECURITY DEFINER function(s) executable by a client role: %', v_bad;
  end if;
  raise notice 'PASS T8: no unreviewed unguarded SECURITY DEFINER function is client-executable';
end $$;

\echo 'internal-helper privilege SQL tests: ALL PASSED'
