-- Phase 0.1 RLS verification.
-- Run only in local/staging, never directly against production.
-- The script uses a transaction and rolls back all setup changes.
--
-- Replace the three UUID settings below with existing auth.users ids from the
-- target project. They must be three distinct users.
--
-- Supabase SQL impersonation limitation:
-- these checks rely on `set local role authenticated/anon` plus request JWT
-- claim settings. If your SQL runner cannot change roles, run equivalent tests
-- through Supabase clients signed in as the three users.

begin;

select set_config('phase0.customer_a', '00000000-0000-0000-0000-000000000001', true);
select set_config('phase0.customer_b', '00000000-0000-0000-0000-000000000002', true);
select set_config('phase0.platform_admin', '00000000-0000-0000-0000-000000000003', true);
select set_config('phase0.org_a', gen_random_uuid()::text, true);
select set_config('phase0.org_b', gen_random_uuid()::text, true);

do $$
declare
  customer_a uuid := current_setting('phase0.customer_a')::uuid;
  customer_b uuid := current_setting('phase0.customer_b')::uuid;
  platform_admin uuid := current_setting('phase0.platform_admin')::uuid;
begin
  if customer_a = '00000000-0000-0000-0000-000000000001'::uuid
    or customer_b = '00000000-0000-0000-0000-000000000002'::uuid
    or platform_admin = '00000000-0000-0000-0000-000000000003'::uuid then
    raise exception 'Replace phase0 test UUID placeholders with real auth.users ids';
  end if;

  if cardinality(array(select distinct unnest(array[customer_a, customer_b, platform_admin]))) <> 3 then
    raise exception 'phase0 test users must be three distinct auth.users rows';
  end if;

  if (select count(*) from auth.users where id in (customer_a, customer_b, platform_admin)) <> 3 then
    raise exception 'All phase0 test users must exist in auth.users before running this script';
  end if;

  if (select count(*) from public.profiles where id in (customer_a, customer_b, platform_admin)) <> 3 then
    raise exception 'Profile backfill/provisioning failed: expected one profile for each test user';
  end if;
end $$;

-- Owner/admin role setup is done as the database owner and rolled back.
update public.profiles
set platform_role = 'customer'
where id in (
  current_setting('phase0.customer_a')::uuid,
  current_setting('phase0.customer_b')::uuid
);

update public.profiles
set platform_role = 'cogniiq_owner'
where id = current_setting('phase0.platform_admin')::uuid;

insert into public.organizations (id, name, status, created_by)
values
  (current_setting('phase0.org_a')::uuid, 'Phase 0 RLS Test Org A', 'active', current_setting('phase0.platform_admin')::uuid),
  (current_setting('phase0.org_b')::uuid, 'Phase 0 RLS Test Org B', 'active', current_setting('phase0.customer_b')::uuid);

insert into public.organization_members (organization_id, user_id, role, status)
values
  (current_setting('phase0.org_a')::uuid, current_setting('phase0.platform_admin')::uuid, 'owner', 'active'),
  (current_setting('phase0.org_a')::uuid, current_setting('phase0.customer_a')::uuid, 'member', 'active'),
  (current_setting('phase0.org_b')::uuid, current_setting('phase0.customer_b')::uuid, 'owner', 'active');

-- Anonymous access must fail through grants before RLS leaks anything.
set local role anon;
select set_config('request.jwt.claim.role', 'anon', true);
select set_config('request.jwt.claim.sub', '', true);

do $$
begin
  perform count(*) from public.profiles;
  raise exception 'TEST FAILED: anon profile select unexpectedly succeeded';
exception
  when insufficient_privilege then
    null;
end $$;

do $$
begin
  perform count(*) from public.organizations;
  raise exception 'TEST FAILED: anon organization select unexpectedly succeeded';
exception
  when insufficient_privilege then
    null;
end $$;

reset role;

-- Customer A: own profile is visible; unrelated profile and org rows are not.
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', current_setting('phase0.customer_a'), true);

do $$
declare
  customer_a uuid := current_setting('phase0.customer_a')::uuid;
  customer_b uuid := current_setting('phase0.customer_b')::uuid;
  org_a uuid := current_setting('phase0.org_a')::uuid;
  org_b uuid := current_setting('phase0.org_b')::uuid;
  row_count integer;
  affected integer;
begin
  select count(*) into row_count from public.profiles where id = customer_a;
  if row_count <> 1 then
    raise exception 'TEST FAILED: customer A should read own profile, got % rows', row_count;
  end if;

  select count(*) into row_count from public.profiles where id = customer_b;
  if row_count <> 0 then
    raise exception 'TEST FAILED: customer A can read unrelated profile';
  end if;

  update public.profiles set full_name = 'Phase 0 Customer A' where id = auth.uid();
  get diagnostics affected = ROW_COUNT;
  if affected <> 1 then
    raise exception 'TEST FAILED: permitted own-profile update affected % rows', affected;
  end if;

  select count(*) into row_count from public.organizations where id = org_a;
  if row_count <> 1 then
    raise exception 'TEST FAILED: customer A should read own organization';
  end if;

  select count(*) into row_count from public.organizations where id = org_b;
  if row_count <> 0 then
    raise exception 'TEST FAILED: customer A can read unrelated organization';
  end if;

  select count(*) into row_count from public.organization_members where organization_id = org_b;
  if row_count <> 0 then
    raise exception 'TEST FAILED: customer A can read unrelated memberships';
  end if;
end $$;

do $$
declare
  blocked boolean := false;
begin
  begin
    update public.profiles
    set platform_role = 'cogniiq_owner'
    where id = auth.uid();
  exception
    when insufficient_privilege or raise_exception then
      blocked := true;
  end;

  if not blocked then
    raise exception 'TEST FAILED: platform_role update unexpectedly succeeded';
  end if;
end $$;

do $$
declare
  org_b uuid := current_setting('phase0.org_b')::uuid;
  customer_a uuid := current_setting('phase0.customer_a')::uuid;
  blocked boolean := false;
begin
  begin
    insert into public.organization_members (organization_id, user_id, role, status)
    values (org_b, customer_a, 'owner', 'active');
exception
    when insufficient_privilege or check_violation or with_check_option_violation or raise_exception then
      blocked := true;
  end;

  if not blocked then
    raise exception 'TEST FAILED: forged membership insert unexpectedly succeeded';
  end if;
end $$;

do $$
declare
  org_a uuid := current_setting('phase0.org_a')::uuid;
  customer_a uuid := current_setting('phase0.customer_a')::uuid;
  row_count integer;
begin
  update public.organization_members
  set role = 'owner'
  where organization_id = org_a and user_id = customer_a;
  get diagnostics row_count = ROW_COUNT;
  if row_count <> 0 then
    raise exception 'TEST FAILED: customer A self-promotion updated % rows', row_count;
  end if;
end $$;

do $$
declare
  org_b uuid := current_setting('phase0.org_b')::uuid;
  customer_b uuid := current_setting('phase0.customer_b')::uuid;
  row_count integer;
begin
  update public.organization_members
  set role = 'admin'
  where organization_id = org_b and user_id = customer_b;
  get diagnostics row_count = ROW_COUNT;
  if row_count <> 0 then
    raise exception 'TEST FAILED: cross-organization promotion updated % rows', row_count;
  end if;
end $$;

do $$
declare
  org_a uuid := current_setting('phase0.org_a')::uuid;
  row_count integer;
  blocked boolean := false;
begin
  begin
    update public.organizations
    set status = 'suspended'
    where id = org_a;
    get diagnostics row_count = ROW_COUNT;
  exception
    when insufficient_privilege or raise_exception then
      blocked := true;
      row_count := 0;
  end;

  if row_count <> 0 then
    raise exception 'TEST FAILED: protected organization status update affected % rows', row_count;
  end if;

  if not blocked and row_count = 0 then
    null;
  end if;
end $$;

do $$
declare
  blocked boolean := false;
begin
  begin
    insert into public.organizations (name)
    values ('Unauthorized Browser Org');
  exception
    when insufficient_privilege or check_violation or with_check_option_violation then
      blocked := true;
  end;

  if not blocked then
    raise exception 'TEST FAILED: authenticated organization insert unexpectedly succeeded';
  end if;
end $$;

do $$
declare
  blocked boolean := false;
begin
  begin
    perform public.create_organization_for_user(current_setting('phase0.customer_a')::uuid, 'Unauthorized RPC Org');
  exception
    when insufficient_privilege or raise_exception then
      blocked := true;
  end;

  if not blocked then
    raise exception 'TEST FAILED: customer callable create_organization_for_user unexpectedly succeeded';
  end if;
end $$;

-- Customer B sees only Org B.
select set_config('request.jwt.claim.sub', current_setting('phase0.customer_b'), true);

do $$
declare
  org_a uuid := current_setting('phase0.org_a')::uuid;
  org_b uuid := current_setting('phase0.org_b')::uuid;
  row_count integer;
begin
  select count(*) into row_count from public.organizations where id = org_a;
  if row_count <> 0 then
    raise exception 'TEST FAILED: customer B can read customer A org';
  end if;

  select count(*) into row_count from public.organizations where id = org_b;
  if row_count <> 1 then
    raise exception 'TEST FAILED: customer B should read own org, got % rows', row_count;
  end if;
end $$;

do $$
declare
  org_b uuid := current_setting('phase0.org_b')::uuid;
  customer_b uuid := current_setting('phase0.customer_b')::uuid;
  blocked boolean := false;
begin
  begin
    delete from public.organization_members
    where organization_id = org_b and user_id = customer_b;
  exception
    when insufficient_privilege or raise_exception then
      blocked := true;
  end;

  if not blocked then
    raise exception 'TEST FAILED: final active organization owner removal unexpectedly succeeded';
  end if;
end $$;

-- Platform admin can access platform admin helpers and admin-owned tables.
select set_config('request.jwt.claim.sub', current_setting('phase0.platform_admin'), true);

do $$
declare
  row_count integer;
begin
  if public.is_platform_admin() is not true then
    raise exception 'TEST FAILED: platform admin helper returned false';
  end if;

  select count(*) into row_count from public.profiles;
  if row_count < 3 then
    raise exception 'TEST FAILED: platform admin should read managed profiles';
  end if;

  if to_regclass('public.tasks') is not null then
    perform id from public.tasks limit 1;
  end if;

  if to_regclass('public.execution_days') is not null then
    perform id from public.execution_days limit 1;
  end if;
end $$;

do $$
declare
  blocked boolean := false;
begin
  begin
    perform public.create_organization_for_user(current_setting('phase0.customer_a')::uuid, 'Platform Admin RPC Org');
  exception
    when insufficient_privilege or raise_exception then
      blocked := true;
  end;

  if not blocked then
    raise exception 'TEST FAILED: browser platform admin should not execute create_organization_for_user directly';
  end if;
end $$;

rollback;
