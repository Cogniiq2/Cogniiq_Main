-- =============================================================================
-- Baseline: the duplicate-organization defect, reproduced on the PRE-FIX schema
-- =============================================================================
-- Runs BEFORE 20260731121000 is applied. Its only job is to prove the bug is real,
-- so the regression suite that follows is testing a fix rather than describing
-- behaviour that already worked. If this file ever stops failing to duplicate, the
-- regression suite below has become decorative and this file must be revisited.
--
-- The sequence is the real one: provision "Pankofer" twice, second time with a
-- fresh idempotency key and a different invitation address.
-- =============================================================================

\set ON_ERROR_STOP on

-- Shared fixtures for this database: one platform admin.
do $$
declare v_admin uuid := gen_random_uuid();
begin
  insert into auth.users (id, email, email_confirmed_at)
  values (v_admin, 'prov-admin@example.test', now());
  -- phase0's signup trigger may or may not have created the profile row.
  insert into public.profiles (id, email, full_name, platform_role)
  values (v_admin, 'prov-admin@example.test', 'Provisioning Admin', 'cogniiq_admin')
  on conflict (id) do update set platform_role = 'cogniiq_admin', email = excluded.email;

  perform public.test_become(v_admin);
end;
$$;

do $$
declare
  v_first jsonb;
  v_second jsonb;
begin
  perform public.test_become((select id from public.profiles where email = 'prov-admin@example.test'));

  v_first := public.provision_client_workspace(
    gen_random_uuid(), 'Pankofer', null, 'Vanessa Graus', null, null, null, null, null, null,
    'lead', null, null, 'EUR', null, null, 'ai_receptionist', 'Pankofer Zentrale', 'active',
    null, null, null, null, 'Pankofer Zentrale', 'v.graus@pankofer.de', 'owner');

  -- New random idempotency key + different invitation address: exactly what a
  -- reloaded wizard produced in production.
  v_second := public.provision_client_workspace(
    gen_random_uuid(), 'Pankofer', null, 'Vanessa Graus', null, null, null, null, null, null,
    'lead', null, null, 'EUR', null, null, 'ai_receptionist', 'Pankofer Zentrale', 'active',
    null, null, null, null, 'Pankofer Zentrale', 'cogniiq4@gmail.com', 'owner');

  if (v_first->>'organization_id') = (v_second->>'organization_id') then
    raise exception 'BASELINE INVALID: the pre-fix path already converged, so there is no defect to regress against';
  end if;
end;
$$;

-- The duplication itself, counted without any of the new helpers.
do $$
declare v_orgs int; v_accounts int; v_solutions int; v_invitations int;
begin
  select count(*) into v_orgs from public.organizations where name = 'Pankofer';
  select count(*) into v_accounts from public.client_accounts ca
    join public.organizations o on o.id = ca.organization_id where o.name = 'Pankofer';
  select count(*) into v_solutions from public.organization_solutions os
    join public.organizations o on o.id = os.organization_id where o.name = 'Pankofer';
  select count(*) into v_invitations from public.client_invitations ci
    join public.organizations o on o.id = ci.organization_id where o.name = 'Pankofer';

  if v_orgs < 2 then
    raise exception 'BASELINE INVALID: expected the pre-fix path to create >=2 "Pankofer" organizations, found %', v_orgs;
  end if;

  raise notice 'baseline defect reproduced: % organizations, % client_accounts, % solutions, % invitations for one customer',
    v_orgs, v_accounts, v_solutions, v_invitations;
end;
$$;
\echo 'ok: BASELINE — the pre-fix provisioning path really does duplicate the whole organization tree'

-- Remove the baseline damage so the regression suite starts from a clean slate and
-- is not merely observing the mess this file made.
do $$
declare v_org uuid;
begin
  for v_org in select id from public.organizations where name = 'Pankofer' loop
    delete from public.client_provisioning_requests where organization_id = v_org;
    delete from public.organizations where id = v_org;
  end loop;

  if exists (select 1 from public.organizations where name = 'Pankofer') then
    raise exception 'BASELINE CLEANUP FAILED: Pankofer organizations still present';
  end if;
end;
$$;
\echo 'ok: baseline damage removed; the regression suite starts from an empty slate'
