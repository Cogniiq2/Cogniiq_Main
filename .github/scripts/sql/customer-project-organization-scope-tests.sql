-- =============================================================================
-- Organization-scoped customer project creation — authorization tests
-- =============================================================================
-- Depends on the fixtures created by customer-projects-tests.sql (test_ids table,
-- test_id() helper, org A / org B, admin, active + suspended members). Org B
-- deliberately has NO owner_customers row anywhere in this fixture chain — that is
-- exactly the "canonical portal customer with no CRM row" case this RPC exists for.
-- =============================================================================

\set ON_ERROR_STOP on

-- ---------------------------------------------------------------------------
-- TEST: admin creates a project directly for an organization with no
-- owner_customers row at all — the real integration-point fix.
-- ---------------------------------------------------------------------------
do $$
declare
  v_project uuid;
  v_org uuid;
  v_owner_customer_count int;
  -- customer-documents-tests.sql permanently deletes the original org B member
  -- (test_id('user_b')) as part of its own audit-survival test, so this file
  -- provisions its OWN org B member rather than depending on that one staying alive.
  v_user_b2 uuid := gen_random_uuid();
begin
  perform public.test_become(test_id('admin'));

  select count(*) into v_owner_customer_count
  from public.owner_customers where organization_id = test_id('org_b');
  if v_owner_customer_count <> 0 then
    raise exception 'TEST FIXTURE INVALID: org B unexpectedly has an owner_customers row';
  end if;

  insert into auth.users (id, email, email_confirmed_at) values
    (v_user_b2, 'b2@kunde-b.de', now());
  update public.profiles set full_name = 'Kunde B2' where id = v_user_b2;
  insert into public.organization_members (organization_id, user_id, role, status) values
    (test_id('org_b'), v_user_b2, 'member', 'active');
  insert into test_ids values ('user_b2', v_user_b2);

  v_project := public.create_customer_project_for_organization(
    test_id('org_b'), 'Kundenportal Projekt', 'Direkt organisationsbezogen angelegt', 'Konzept');

  select organization_id into v_org from public.customer_projects where id = v_project;
  if v_org <> test_id('org_b') then
    raise exception 'TEST FAILED: project not scoped to the requested organization';
  end if;

  -- No owner_customers row was created, backfilled or merged as a side effect.
  select count(*) into v_owner_customer_count
  from public.owner_customers where organization_id = test_id('org_b');
  if v_owner_customer_count <> 0 then
    raise exception 'TEST FAILED: an owner_customers row was silently created as a side effect';
  end if;

  insert into test_ids values ('org_scoped_project', v_project);
end;
$$;
\echo 'ok: admin creates an organization-scoped project with no owner_customers row'

-- ---------------------------------------------------------------------------
-- TEST: the created project is reachable through the normal customer read path
-- for a member of that organization, and invisible to the other organization.
-- ---------------------------------------------------------------------------
do $$
declare v_count int;
begin
  perform public.test_become(test_id('user_b2'));
  select count(*) into v_count from public.get_customer_project(test_id('org_scoped_project'));
  if v_count <> 1 then
    raise exception 'TEST FAILED: org B member cannot read the organization-scoped project, got % rows', v_count;
  end if;

  perform public.test_become(test_id('user_a'));
  select count(*) into v_count from public.get_customer_project(test_id('org_scoped_project'));
  if v_count <> 0 then
    raise exception 'TEST FAILED: org A member can read org B''s organization-scoped project';
  end if;
end;
$$;
\echo 'ok: organization-scoped project respects tenant isolation on read'

-- ---------------------------------------------------------------------------
-- TEST: non-admin callers are rejected explicitly
-- ---------------------------------------------------------------------------
do $$
declare v_threw boolean;
begin
  perform public.test_become(test_id('user_a'));
  v_threw := false;
  begin
    perform public.create_customer_project_for_organization(test_id('org_a'), 'X', 'Y', 'Konzept');
  exception when others then v_threw := true;
  end;
  if not v_threw then
    raise exception 'TEST FAILED: non-admin org member was able to create a customer project';
  end if;

  perform public.test_become(test_id('ext'));
  v_threw := false;
  begin
    perform public.create_customer_project_for_organization(test_id('org_a'), 'X', 'Y', 'Konzept');
  exception when others then v_threw := true;
  end;
  if not v_threw then
    raise exception 'TEST FAILED: external (non-member) caller was able to create a customer project';
  end if;

  perform public.test_become(null);
  v_threw := false;
  begin
    perform public.create_customer_project_for_organization(test_id('org_a'), 'X', 'Y', 'Konzept');
  exception when others then v_threw := true;
  end;
  if not v_threw then
    raise exception 'TEST FAILED: unauthenticated caller was able to create a customer project';
  end if;
end;
$$;
\echo 'ok: create_customer_project_for_organization rejects non-admin callers'

-- ---------------------------------------------------------------------------
-- TEST: a nonexistent organization is rejected before any row is written
-- ---------------------------------------------------------------------------
do $$
declare
  v_threw boolean := false;
  v_bogus uuid := gen_random_uuid();
  v_before int;
  v_after int;
begin
  perform public.test_become(test_id('admin'));
  select count(*) into v_before from public.customer_projects;
  begin
    perform public.create_customer_project_for_organization(v_bogus, 'X', 'Y', 'Konzept');
  exception when others then v_threw := true;
  end;
  if not v_threw then
    raise exception 'TEST FAILED: nonexistent organization id was accepted';
  end if;
  select count(*) into v_after from public.customer_projects;
  if v_after <> v_before then
    raise exception 'TEST FAILED: a project row was written despite the organization check failing';
  end if;
end;
$$;
\echo 'ok: nonexistent organization id is rejected without writing a row'

-- ---------------------------------------------------------------------------
-- TEST: SECURITY DEFINER hygiene — pinned, empty search_path; not customer-executable
-- ---------------------------------------------------------------------------
do $$
declare v_bad text;
begin
  select string_agg(p.proname, ', ') into v_bad
  from pg_proc p
  where p.pronamespace = 'public'::regnamespace
    and p.proname = 'create_customer_project_for_organization'
    and p.prosecdef
    and not coalesce(array_to_string(p.proconfig, ',') like '%search_path=""%', false);
  if v_bad is not null then
    raise exception 'TEST FAILED: create_customer_project_for_organization does not pin an empty search_path';
  end if;
end;
$$;
\echo 'ok: create_customer_project_for_organization pins an empty search_path'

do $$
begin
  if exists (
    select 1 from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.proname = 'create_customer_project_for_organization'
      and has_function_privilege('anon', p.oid, 'EXECUTE')
  ) then
    raise exception 'TEST FAILED: create_customer_project_for_organization is executable by anon';
  end if;

  if not exists (
    select 1 from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.proname = 'create_customer_project_for_organization'
      and has_function_privilege('authenticated', p.oid, 'EXECUTE')
  ) then
    raise exception 'TEST FAILED: create_customer_project_for_organization is not executable by authenticated';
  end if;
end;
$$;
\echo 'ok: create_customer_project_for_organization grants match intended callers'
