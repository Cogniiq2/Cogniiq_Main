-- =============================================================================
-- Customer platform authorization tests
-- =============================================================================
-- Runs against a throwaway cluster with the full real migration chain applied.
-- Every test raises an exception (aborting the run) on failure.
--
-- The central claim under test: a customer can reach EXACTLY their own
-- organization's non-archived projects, published documents and issued invoices —
-- and nothing else — with no internal column ever crossing the boundary.
-- =============================================================================

\set ON_ERROR_STOP on

-- ---------------------------------------------------------------------------
-- Fixtures: two isolated organizations plus an internal Cogniiq admin.
-- ---------------------------------------------------------------------------
do $$
declare
  v_admin uuid := gen_random_uuid();
  v_ext uuid := gen_random_uuid();
  v_org_a uuid := gen_random_uuid();
  v_org_b uuid := gen_random_uuid();
  v_user_a uuid := gen_random_uuid();
  v_user_b uuid := gen_random_uuid();
  v_user_suspended uuid := gen_random_uuid();
begin
  -- auth.users rows first (profiles FK targets them).
  insert into auth.users (id, email, email_confirmed_at) values
    (v_admin, 'admin@cogniiq.de', now()),
    (v_ext, 'external@example.com', now()),
    (v_user_a, 'a@kunde-a.de', now()),
    (v_user_b, 'b@kunde-b.de', now()),
    (v_user_suspended, 'suspended@kunde-a.de', now());

  -- The signup trigger already created 'customer' profiles; promote the internal one.
  update public.profiles set platform_role = 'cogniiq_owner', full_name = 'Milan Popovic' where id = v_admin;
  update public.profiles set full_name = 'Externe Person' where id = v_ext;
  update public.profiles set full_name = 'Kunde A' where id = v_user_a;
  update public.profiles set full_name = 'Kunde B' where id = v_user_b;
  update public.profiles set full_name = 'Gesperrt A' where id = v_user_suspended;

  insert into public.organizations (id, name, slug, status) values
    (v_org_a, 'Kunde A GmbH', 'kunde-a', 'active'),
    (v_org_b, 'Kunde B GmbH', 'kunde-b', 'active');

  insert into public.organization_members (organization_id, user_id, role, status) values
    (v_org_a, v_user_a, 'owner', 'active'),
    (v_org_b, v_user_b, 'owner', 'active'),
    (v_org_a, v_user_suspended, 'member', 'suspended');

  -- Persist ids for the rest of the script.
  create table test_ids (k text primary key, v uuid);
  insert into test_ids values
    ('admin', v_admin), ('ext', v_ext),
    ('org_a', v_org_a), ('org_b', v_org_b),
    ('user_a', v_user_a), ('user_b', v_user_b), ('user_suspended', v_user_suspended);
end;
$$;

create or replace function test_id(p_key text) returns uuid
language sql stable as $$ select v from test_ids where k = p_key $$;

-- ---------------------------------------------------------------------------
-- Owner creates projects. Also proves the owner-customer -> organization gate.
-- ---------------------------------------------------------------------------
do $$
declare
  v_entity uuid;
  v_oc_linked uuid;
  v_oc_unlinked uuid;
  v_project_a uuid;
  v_project_b uuid;
  v_archived uuid;
  v_threw boolean;
begin
  perform public.test_become(test_id('admin'));

  select id into v_entity from public.owner_business_entities limit 1;
  if v_entity is null then
    insert into public.owner_business_entities (slug, display_name) values ('test-entity', 'Test Entity')
    returning id into v_entity;
  end if;

  -- A CRM customer WITH portal provisioning (organization linked).
  insert into public.owner_customers (business_entity_id, organization_id, company, created_by)
  values (v_entity, test_id('org_a'), 'Kunde A GmbH', test_id('admin')) returning id into v_oc_linked;

  -- A CRM customer WITHOUT portal provisioning (lead stage, no organization).
  insert into public.owner_customers (business_entity_id, company, created_by)
  values (v_entity, 'Noch kein Portalzugang', test_id('admin')) returning id into v_oc_unlinked;

  -- Gate: creating a customer-visible project for an unlinked CRM customer must fail loudly.
  v_threw := false;
  begin
    perform public.create_customer_project_for_owner_customer(v_oc_unlinked, 'X', 'Y', 'Konzept');
  exception when others then v_threw := true;
  end;
  if not v_threw then
    raise exception 'TEST FAILED: project created for a CRM customer with no linked organization';
  end if;

  v_project_a := public.create_customer_project_for_owner_customer(
    v_oc_linked, 'Telefonassistent Rollout', 'Anrufe automatisch qualifizieren', 'Umsetzung');

  -- Org B project, created directly (org B has no owner_customers row).
  insert into public.customer_projects (organization_id, title, business_objective, phase, created_by)
  values (test_id('org_b'), 'Projekt B', 'Ziel B', 'Konzept', test_id('admin')) returning id into v_project_b;

  -- An archived project in org A: must never appear in customer results.
  insert into public.customer_projects (organization_id, title, business_objective, phase, created_by, is_archived)
  values (test_id('org_a'), 'Altes Projekt', 'Abgeschlossen', 'Betrieb', test_id('admin'), true)
  returning id into v_archived;

  insert into test_ids values
    ('project_a', v_project_a), ('project_b', v_project_b), ('archived', v_archived),
    ('entity', v_entity), ('oc_linked', v_oc_linked), ('oc_unlinked', v_oc_unlinked);
end;
$$;

-- ---------------------------------------------------------------------------
-- TEST: cross-organization project denial + archived exclusion
-- ---------------------------------------------------------------------------
do $$
declare v_count int;
begin
  perform public.test_become(test_id('user_a'));
  select count(*) into v_count from public.list_customer_projects();
  if v_count <> 1 then
    raise exception 'TEST FAILED: org A member sees % projects, expected exactly 1 (archived must be excluded)', v_count;
  end if;

  select count(*) into v_count from public.list_customer_projects() where id = test_id('project_b');
  if v_count <> 0 then
    raise exception 'TEST FAILED: org A member can see org B project';
  end if;

  -- Direct single-row lookup across organizations returns nothing (indistinguishable from missing).
  select count(*) into v_count from public.get_customer_project(test_id('project_b'));
  if v_count <> 0 then raise exception 'TEST FAILED: cross-org get_customer_project returned a row'; end if;

  select count(*) into v_count from public.get_customer_project(test_id('archived'));
  if v_count <> 0 then raise exception 'TEST FAILED: archived project returned by get_customer_project'; end if;

  select count(*) into v_count from public.get_customer_project(gen_random_uuid());
  if v_count <> 0 then raise exception 'TEST FAILED: nonexistent project returned a row'; end if;
end;
$$;
\echo 'ok: cross-organization project denial + archived exclusion'

-- ---------------------------------------------------------------------------
-- TEST: suspended member denial
-- ---------------------------------------------------------------------------
do $$
declare v_count int;
begin
  perform public.test_become(test_id('user_suspended'));
  select count(*) into v_count from public.list_customer_projects();
  if v_count <> 0 then
    raise exception 'TEST FAILED: suspended member sees % projects, expected 0', v_count;
  end if;
  select count(*) into v_count from public.get_customer_project(test_id('project_a'));
  if v_count <> 0 then raise exception 'TEST FAILED: suspended member can read a project directly'; end if;
end;
$$;
\echo 'ok: suspended member denial'

-- ---------------------------------------------------------------------------
-- TEST: unauthenticated caller is rejected explicitly (not silently empty)
-- ---------------------------------------------------------------------------
do $$
declare v_threw boolean := false;
begin
  perform public.test_become(null);
  begin
    perform public.list_customer_projects();
  exception when others then v_threw := true;
  end;
  if not v_threw then raise exception 'TEST FAILED: null auth.uid() was not rejected'; end if;
end;
$$;
\echo 'ok: null auth.uid() rejected explicitly'

-- ---------------------------------------------------------------------------
-- TEST: no direct table access for customers (RPC is the only path)
-- ---------------------------------------------------------------------------
do $$
declare v_count int;
begin
  -- The customer role holds no policy on these tables, so even a direct select
  -- returns nothing (RLS denies) rather than leaking rows.
  perform public.test_become(test_id('user_a'));
  set local role authenticated;
  begin
    select count(*) into v_count from public.customer_projects;
    if v_count <> 0 then
      raise exception 'TEST FAILED: direct table select returned % customer_projects rows', v_count;
    end if;
  exception when insufficient_privilege then
    null; -- an outright privilege error is an equally acceptable denial
  end;
  reset role;
end;
$$;
\echo 'ok: customers have no direct customer_projects access'

-- ---------------------------------------------------------------------------
-- TEST: internal fields are not exposed by the read RPCs
-- ---------------------------------------------------------------------------
do $$
declare v_cols text[];
begin
  select array_agg(lower(p.attname)) into v_cols
  from pg_proc pr
  join lateral unnest(pr.proallargtypes, pr.proargmodes, pr.proargnames)
       as p(atttypid, attmode, attname) on true
  where pr.proname = 'list_customer_projects'
    and pr.pronamespace = 'public'::regnamespace
    and p.attmode = 't';

  if v_cols && array['engagement_id','created_by','updated_by','is_archived','contact_profile_id'] then
    raise exception 'TEST FAILED: list_customer_projects exposes an internal column: %', v_cols;
  end if;

  select array_agg(lower(p.attname)) into v_cols
  from pg_proc pr
  join lateral unnest(pr.proallargtypes, pr.proargmodes, pr.proargnames)
       as p(atttypid, attmode, attname) on true
  where pr.proname = 'list_customer_project_milestones'
    and pr.pronamespace = 'public'::regnamespace
    and p.attmode = 't';

  if v_cols && array['created_by','updated_by','organization_id'] then
    raise exception 'TEST FAILED: list_customer_project_milestones exposes an internal column: %', v_cols;
  end if;
end;
$$;
\echo 'ok: internal fields absent from project/milestone RPC allow-lists'

-- ---------------------------------------------------------------------------
-- TEST: contact data requires a CURRENT internal role (not role-at-assignment)
-- ---------------------------------------------------------------------------
do $$
declare v_name text; v_email text; v_threw boolean;
begin
  perform public.test_become(test_id('admin'));
  perform public.update_customer_project(
    test_id('project_a'), 'Telefonassistent Rollout', 'Anrufe automatisch qualifizieren', 'Umsetzung',
    'on_track'::public.customer_project_status, 40::smallint, null, null, null,
    test_id('admin'), 'Ihr Ansprechpartner', 'kontakt@cogniiq.de');

  perform public.test_become(test_id('user_a'));
  select contact_display_name, contact_business_email into v_name, v_email
  from public.get_customer_project(test_id('project_a'));
  if v_name is null or v_email <> 'kontakt@cogniiq.de' then
    raise exception 'TEST FAILED: verified internal contact not exposed (name=%, email=%)', v_name, v_email;
  end if;

  -- Demote the contact: customer-facing contact data must disappear immediately.
  perform public.test_become(test_id('admin'));
  update public.profiles set platform_role = 'customer' where id = test_id('admin');

  perform public.test_become(test_id('user_a'));
  select contact_display_name, contact_business_email into v_name, v_email
  from public.get_customer_project(test_id('project_a'));
  if v_name is not null or v_email is not null then
    raise exception 'TEST FAILED: contact still exposed after the profile lost its internal role (name=%, email=%)', v_name, v_email;
  end if;

  -- Restore for later tests.
  update public.profiles set platform_role = 'cogniiq_owner' where id = test_id('admin');

  -- A non-internal profile may not be assigned as a contact at all.
  perform public.test_become(test_id('admin'));
  v_threw := false;
  begin
    update public.customer_projects set contact_profile_id = test_id('user_a') where id = test_id('project_a');
  exception when others then v_threw := true;
  end;
  if not v_threw then
    raise exception 'TEST FAILED: a customer profile was accepted as an internal contact';
  end if;
end;
$$;
\echo 'ok: contact exposure requires a current internal Cogniiq role'

-- ---------------------------------------------------------------------------
-- TEST: composite FK blocks cross-organization relationships
-- ---------------------------------------------------------------------------
do $$
declare v_threw boolean;
begin
  perform public.test_become(test_id('admin'));

  -- Milestone in org B pointing at a project in org A must be impossible.
  v_threw := false;
  begin
    insert into public.customer_project_milestones (organization_id, project_id, title, created_by)
    values (test_id('org_b'), test_id('project_a'), 'Cross-tenant milestone', test_id('admin'));
  exception when others then v_threw := true;
  end;
  if not v_threw then
    raise exception 'TEST FAILED: milestone linked across organizations';
  end if;

  -- Engagement from another organization must be impossible to attach.
  declare v_eng uuid;
  begin
    insert into public.client_engagements (organization_id, catalog_key, project_name)
    values (test_id('org_b'), (select key from public.solution_catalog limit 1), 'Interne Sache')
    returning id into v_eng;

    v_threw := false;
    begin
      update public.customer_projects set engagement_id = v_eng where id = test_id('project_a');
    exception when others then v_threw := true;
    end;
    if not v_threw then
      raise exception 'TEST FAILED: cross-organization engagement attached to a customer project';
    end if;
  end;
end;
$$;
\echo 'ok: composite FKs block cross-organization relationships'

-- ---------------------------------------------------------------------------
-- TEST: next-action fields are strictly all-or-nothing
-- ---------------------------------------------------------------------------
do $$
declare v_threw boolean;
begin
  perform public.test_become(test_id('admin'));

  v_threw := false;
  begin
    perform public.set_customer_project_next_action(test_id('project_a'), null, null, current_date);
  exception when others then v_threw := true;
  end;
  if not v_threw then raise exception 'TEST FAILED: due date accepted without a summary'; end if;

  v_threw := false;
  begin
    perform public.set_customer_project_next_action(test_id('project_a'), 'Logo liefern', null, null);
  exception when others then v_threw := true;
  end;
  if not v_threw then raise exception 'TEST FAILED: summary accepted without an owner'; end if;

  -- Valid combination succeeds and is readable by the customer.
  perform public.set_customer_project_next_action(
    test_id('project_a'), 'Bitte Logo bereitstellen', 'customer'::public.customer_next_action_owner, current_date + 3);

  -- Clearing the summary must null the owner and due date too.
  perform public.set_customer_project_next_action(test_id('project_a'), '   ', null, null);
  if exists (
    select 1 from public.customer_projects
    where id = test_id('project_a')
      and (next_action_owner is not null or next_action_due_date is not null)
  ) then
    raise exception 'TEST FAILED: clearing the summary left owner/due date behind';
  end if;

  -- Restore a real next action for downstream tests.
  perform public.set_customer_project_next_action(
    test_id('project_a'), 'Bitte Logo bereitstellen', 'customer'::public.customer_next_action_owner, current_date + 3);
end;
$$;
\echo 'ok: next-action fields are all-or-nothing'

-- ---------------------------------------------------------------------------
-- TEST: milestone RPC does not leak project existence + ordering is deterministic
-- ---------------------------------------------------------------------------
do $$
declare v_count int; v_first text;
begin
  perform public.test_become(test_id('admin'));
  perform public.create_customer_project_milestone(test_id('project_a'), 'Kickoff', null, current_date - 10, 1);
  perform public.create_customer_project_milestone(test_id('project_a'), 'Go-Live', null, current_date + 30, 2);
  perform public.create_customer_project_milestone(test_id('project_b'), 'Fremd', null, null, 1);

  perform public.test_become(test_id('user_a'));
  select count(*) into v_count from public.list_customer_project_milestones(test_id('project_a'));
  if v_count <> 2 then raise exception 'TEST FAILED: expected 2 milestones, got %', v_count; end if;

  -- Another organization's project: empty, identical to a project with no milestones.
  select count(*) into v_count from public.list_customer_project_milestones(test_id('project_b'));
  if v_count <> 0 then raise exception 'TEST FAILED: milestones leaked across organizations'; end if;

  select count(*) into v_count from public.list_customer_project_milestones(gen_random_uuid());
  if v_count <> 0 then raise exception 'TEST FAILED: nonexistent project returned milestones'; end if;

  select title into v_first from public.list_customer_project_milestones(test_id('project_a')) limit 1;
  if v_first <> 'Kickoff' then raise exception 'TEST FAILED: milestone order not deterministic (got %)', v_first; end if;
end;
$$;
\echo 'ok: milestone scoping, non-leaking lookup and deterministic order'

-- ---------------------------------------------------------------------------
-- TEST: milestone completed_at invariant is derived, never caller-supplied
-- ---------------------------------------------------------------------------
do $$
declare v_id uuid; v_completed timestamptz;
begin
  perform public.test_become(test_id('admin'));
  select id into v_id from public.customer_project_milestones where project_id = test_id('project_a') and title = 'Kickoff';

  perform public.update_customer_project_milestone(
    v_id, 'Kickoff', null, 'completed'::public.customer_milestone_status, current_date - 10, 1);
  select completed_at into v_completed from public.customer_project_milestones where id = v_id;
  if v_completed is null then raise exception 'TEST FAILED: completed status did not set completed_at'; end if;

  perform public.update_customer_project_milestone(
    v_id, 'Kickoff', null, 'in_progress'::public.customer_milestone_status, current_date - 10, 1);
  select completed_at into v_completed from public.customer_project_milestones where id = v_id;
  if v_completed is not null then raise exception 'TEST FAILED: leaving completed did not clear completed_at'; end if;
end;
$$;
\echo 'ok: milestone completed_at is derived from status'

-- ---------------------------------------------------------------------------
-- TEST: non-admin cannot invoke owner write RPCs
-- ---------------------------------------------------------------------------
do $$
declare v_threw boolean;
begin
  perform public.test_become(test_id('user_a'));

  v_threw := false;
  begin
    perform public.update_customer_project(
      test_id('project_a'), 'Hijacked', 'x', 'y', 'on_track'::public.customer_project_status,
      0::smallint, null, null, null, null, null, null);
  exception when others then v_threw := true;
  end;
  if not v_threw then raise exception 'TEST FAILED: customer could update a project'; end if;

  v_threw := false;
  begin
    perform public.archive_customer_project(test_id('project_a'));
  exception when others then v_threw := true;
  end;
  if not v_threw then raise exception 'TEST FAILED: customer could archive a project'; end if;

  v_threw := false;
  begin
    perform public.create_customer_project_milestone(test_id('project_a'), 'Hijack', null, null, 0);
  exception when others then v_threw := true;
  end;
  if not v_threw then raise exception 'TEST FAILED: customer could create a milestone'; end if;
end;
$$;
\echo 'ok: owner write RPCs reject non-admin callers'

-- ---------------------------------------------------------------------------
-- TEST: updated_at is maintained automatically
-- ---------------------------------------------------------------------------
do $$
declare v_before timestamptz; v_after timestamptz;
begin
  perform public.test_become(test_id('admin'));
  select updated_at into v_before from public.customer_projects where id = test_id('project_a');
  perform pg_sleep(0.01);
  update public.customer_projects set phase = 'Test' where id = test_id('project_a');
  select updated_at into v_after from public.customer_projects where id = test_id('project_a');
  if v_after <= v_before then raise exception 'TEST FAILED: updated_at not advanced by trigger'; end if;
end;
$$;
\echo 'ok: updated_at maintained by trigger'

-- ---------------------------------------------------------------------------
-- TEST: every SECURITY DEFINER function added here pins search_path = ''
-- ---------------------------------------------------------------------------
-- Scoped deliberately to the functions THIS release adds. Pre-existing owner_* functions
-- use `search_path = public` and are outside this change's scope.
create temporary table new_secdef_functions (proname text primary key);
insert into new_secdef_functions values
  ('list_customer_projects'),('get_customer_project'),('list_customer_project_milestones'),
  ('create_customer_project_for_owner_customer'),('update_customer_project'),
  ('set_customer_project_next_action'),('archive_customer_project'),
  ('create_customer_project_milestone'),('update_customer_project_milestone'),
  ('delete_customer_project_milestone'),('guard_customer_project_contact_is_internal'),
  ('list_customer_documents'),('list_customer_invoices'),
  ('authorize_customer_document_download'),('is_organization_member_as'),('is_platform_admin_as'),
  ('register_customer_document_from_owner_source'),('register_customer_document_from_upload'),
  ('set_customer_document_visibility'),('archive_customer_document'),
  ('delete_unpublished_customer_document'),('record_customer_document_access'),
  ('link_customer_project_invoice'),('unlink_customer_project_invoice'),
  ('guard_customer_document_source_consistency'),('guard_customer_document_no_hard_delete_if_published');

do $$
declare v_bad text;
begin
  select string_agg(p.proname, ', ') into v_bad
  from pg_proc p
  where p.pronamespace = 'public'::regnamespace
    and p.prosecdef
    and p.proname in (
      'list_customer_projects','get_customer_project','list_customer_project_milestones',
      'create_customer_project_for_owner_customer','update_customer_project',
      'set_customer_project_next_action','archive_customer_project',
      'create_customer_project_milestone','update_customer_project_milestone',
      'delete_customer_project_milestone','guard_customer_project_contact_is_internal',
      'list_customer_documents','list_customer_invoices',
      'authorize_customer_document_download','is_organization_member_as','is_platform_admin_as',
      'register_customer_document_from_owner_source','register_customer_document_from_upload',
      'set_customer_document_visibility','archive_customer_document',
      'delete_unpublished_customer_document','record_customer_document_access',
      'link_customer_project_invoice','unlink_customer_project_invoice',
      'guard_customer_document_source_consistency','guard_customer_document_no_hard_delete_if_published'
    )
    and not coalesce(array_to_string(p.proconfig, ',') like '%search_path=%', false);
  if v_bad is not null then
    raise exception 'TEST FAILED: SECURITY DEFINER function(s) without a pinned search_path: %', v_bad;
  end if;

  -- ...and every one of them must pin an EMPTY search_path specifically.
  select string_agg(p.proname, ', ') into v_bad
  from pg_proc p
  join new_secdef_functions n on n.proname = p.proname
  where p.pronamespace = 'public'::regnamespace
    and p.prosecdef
    and array_to_string(p.proconfig, ',') not like '%search_path=""%';
  if v_bad is not null then
    raise exception 'TEST FAILED: SECURITY DEFINER function(s) not using an empty search_path: %', v_bad;
  end if;
end;
$$;
\echo 'ok: all new SECURITY DEFINER functions pin an empty search_path'

-- ---------------------------------------------------------------------------
-- TEST: service_role-only helpers are not executable by customers
-- ---------------------------------------------------------------------------
do $$
declare v_fn text;
begin
  foreach v_fn in array array['is_organization_member_as','is_platform_admin_as','authorize_customer_document_download',
                             'register_customer_document_from_upload','delete_unpublished_customer_document',
                             'record_customer_document_access']
  loop
    if exists (
      select 1 from pg_proc p
      where p.pronamespace = 'public'::regnamespace and p.proname = v_fn
        and has_function_privilege('authenticated', p.oid, 'EXECUTE')
    ) then
      raise exception 'TEST FAILED: % is executable by authenticated (must be service_role only)', v_fn;
    end if;
    if exists (
      select 1 from pg_proc p
      where p.pronamespace = 'public'::regnamespace and p.proname = v_fn
        and has_function_privilege('anon', p.oid, 'EXECUTE')
    ) then
      raise exception 'TEST FAILED: % is executable by anon', v_fn;
    end if;
  end loop;
end;
$$;
\echo 'ok: service_role-only helpers are not customer-executable'
