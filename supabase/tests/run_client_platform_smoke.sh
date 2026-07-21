#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:5432/postgres}"

run_psql() {
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 "$@"
}

# --- Bootstrap a Supabase-like environment (auth schema with email_confirmed_at) ---
run_psql <<'SQL'
create extension if not exists pgcrypto;
create schema if not exists auth;

do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
do $$ begin create role service_role nologin bypassrls; exception when duplicate_object then null; end $$;
alter role service_role bypassrls;
do $$ begin create role supabase_admin nologin; exception when duplicate_object then null; end $$;
do $$ begin create role supabase_auth_admin nologin; exception when duplicate_object then null; end $$;

create or replace function auth.uid()
returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  email_confirmed_at timestamptz,
  raw_user_meta_data jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Resilient when a prior smoke test already created a leaner auth.users on a shared database.
alter table auth.users add column if not exists email_confirmed_at timestamptz;

grant usage on schema auth to anon, authenticated, service_role, supabase_auth_admin;
grant execute on function auth.uid() to public, anon, authenticated, service_role, supabase_auth_admin;

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000301', 'admin@example.test',      now(), '{"full_name":"Platform Admin"}'::jsonb),
  ('00000000-0000-0000-0000-000000000302', 'owner-a@example.test',    now(), '{"full_name":"Owner A"}'::jsonb),
  ('00000000-0000-0000-0000-000000000303', 'owner-b@example.test',    now(), '{"full_name":"Owner B"}'::jsonb),
  ('00000000-0000-0000-0000-000000000304', 'invited@example.test',    now(), '{"full_name":"Invited"}'::jsonb),
  ('00000000-0000-0000-0000-000000000305', 'unconfirmed@example.test',null, '{"full_name":"Unconfirmed"}'::jsonb),
  ('00000000-0000-0000-0000-000000000306', 'different@example.test',  now(), '{"full_name":"Different"}'::jsonb),
  ('00000000-0000-0000-0000-000000000307', 'suspended@example.test',  now(), '{"full_name":"Suspended"}'::jsonb)
on conflict (id) do update set email = excluded.email, email_confirmed_at = excluded.email_confirmed_at;
SQL

# --- Apply migrations in order ---
run_psql -f "$ROOT_DIR/supabase/migrations/20260710120000_phase0_auth_tenancy_rls.sql"
run_psql -f "$ROOT_DIR/supabase/migrations/20260710133000_phase0_security_hardening.sql"
run_psql -f "$ROOT_DIR/supabase/migrations/20260711120000_receptionist_persistence.sql"
run_psql -f "$ROOT_DIR/supabase/migrations/20260721120000_product_aware_client_platform.sql"

# --- Scenarios ---
run_psql <<'SQL'
begin;

select set_config('cp.admin',       '00000000-0000-0000-0000-000000000301', true);
select set_config('cp.owner_a',     '00000000-0000-0000-0000-000000000302', true);
select set_config('cp.owner_b',     '00000000-0000-0000-0000-000000000303', true);
select set_config('cp.invited',     '00000000-0000-0000-0000-000000000304', true);
select set_config('cp.unconfirmed', '00000000-0000-0000-0000-000000000305', true);
select set_config('cp.different',   '00000000-0000-0000-0000-000000000306', true);
select set_config('cp.suspended',   '00000000-0000-0000-0000-000000000307', true);

update public.profiles set platform_role = 'cogniiq_admin' where id = current_setting('cp.admin')::uuid;

-- ============ Scenario 1: platform admin can create a client workspace ============
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', current_setting('cp.admin'), true);

do $$
declare
  result jsonb;
begin
  result := public.provision_client_workspace(
    '11111111-1111-1111-1111-111111111111',
    'Acme GmbH', 'Acme Legal GmbH', 'Owner A', 'invited@example.test', '+4915100000001',
    'https://acme.example.test', 'Healthcare', 'Acme Street 1', 'referral', 'active',
    'VIP client', 'Operator A', 'EUR', 500000, 50000,
    'ai_receptionist', 'Acme Receptionist Rollout', 'active', 500000, 100000, 20000,
    current_date + 30, 'Acme Rezeptionist', 'invited@example.test', 'owner'
  );
  perform set_config('cp.org_a', result->>'organization_id', true);
  perform set_config('cp.instance_a', result->>'instance_key', true);

  if (result->>'organization_id') is null or (result->>'invitation_id') is null then
    raise exception 'TEST FAILED: provision did not return created ids';
  end if;
  if (result->>'instance_key') is null then
    raise exception 'TEST FAILED: provision did not return a server-generated instance_key';
  end if;
  if not exists (select 1 from public.client_accounts where organization_id = (result->>'organization_id')::uuid) then
    raise exception 'TEST FAILED: client account not created';
  end if;
  -- implementation is derived from the catalog: ai_receptionist -> ai_receptionist.
  if not exists (
    select 1 from public.organization_solutions
    where instance_key = (result->>'instance_key') and status = 'active' and implementation_key = 'ai_receptionist'
  ) then
    raise exception 'TEST FAILED: solution instance not created with the catalog-derived implementation';
  end if;
end $$;

-- Second workspace for cross-tenant tests, owned by owner_b's invitation.
do $$
declare result jsonb;
begin
  result := public.provision_client_workspace(
    '22222222-2222-2222-2222-222222222222',
    'Beta AG', null, 'Owner B', 'owner-b@example.test', null, null, null, null, null, 'lead',
    null, null, 'EUR', null, null,
    'automation_workspace', 'Beta Automation', 'active', null, null, null, null,
    'Beta Automation', 'owner-b@example.test', 'owner'
  );
  perform set_config('cp.org_b', result->>'organization_id', true);
  -- automation_workspace -> automation_workspace (never the receptionist implementation).
  if not exists (
    select 1 from public.organization_solutions
    where organization_id = (result->>'organization_id')::uuid and implementation_key = 'automation_workspace'
  ) then
    raise exception 'TEST FAILED: automation catalog did not derive the automation implementation';
  end if;
end $$;

-- ============ Finding 4: provisioning is idempotent ============
do $$
declare
  first_result jsonb;
  second_result jsonb;
  org_count integer;
begin
  first_result := public.provision_client_workspace(
    '33333333-3333-3333-3333-333333333333',
    'Dup GmbH', null, 'Owner Dup', 'dup@example.test', null, null, null, null, null, 'active',
    null, null, 'EUR', null, null,
    'ai_receptionist', 'Dup Rollout', 'active', null, null, null, null,
    'Dup Rezeptionist', 'dup@example.test', 'owner'
  );
  -- Same idempotency key => replay, no new workspace.
  second_result := public.provision_client_workspace(
    '33333333-3333-3333-3333-333333333333',
    'Dup GmbH RETRY', null, 'Different', 'other@example.test', null, null, null, null, null, 'active',
    null, null, 'EUR', null, null,
    'ai_receptionist', 'Different Rollout', 'active', null, null, null, null,
    'Different Rezeptionist', 'other@example.test', 'owner'
  );
  if (first_result->>'organization_id') <> (second_result->>'organization_id')
    or (first_result->>'instance_key') <> (second_result->>'instance_key')
    or (first_result->>'invitation_id') <> (second_result->>'invitation_id') then
    raise exception 'TEST FAILED: idempotent retry returned different ids';
  end if;
  select count(*) into org_count from public.organizations where name = 'Dup GmbH';
  if org_count <> 1 then
    raise exception 'TEST FAILED: idempotent provisioning created % organizations', org_count;
  end if;
  if exists (select 1 from public.organizations where name = 'Dup GmbH RETRY') then
    raise exception 'TEST FAILED: idempotent retry created a second organization';
  end if;
end $$;

-- ============ Finding 1: idempotency is mandatory (null/blank/malformed keys rejected) ============
do $$
declare blocked boolean;
begin
  -- Null key rejected in the function body.
  blocked := false;
  begin
    perform public.provision_client_workspace(
      null::uuid,
      'NoKey GmbH', null, null, 'nokey@example.test', null, null, null, null, null, 'active',
      null, null, 'EUR', null, null,
      'ai_receptionist', 'NoKey Rollout', 'active', null, null, null, null,
      'NoKey Rezeptionist', 'nokey@example.test', 'owner'
    );
  exception when raise_exception then blocked := true;
  end;
  if not blocked then raise exception 'TEST FAILED: provisioning without an idempotency key was allowed'; end if;

  -- Blank / malformed keys rejected at the uuid type boundary.
  blocked := false;
  begin
    perform public.provision_client_workspace(
      'not-a-uuid',
      'Bad GmbH', null, null, 'bad@example.test', null, null, null, null, null, 'active',
      null, null, 'EUR', null, null,
      'ai_receptionist', 'Bad Rollout', 'active', null, null, null, null,
      'Bad Rezeptionist', 'bad@example.test', 'owner'
    );
  exception when invalid_text_representation or raise_exception then blocked := true;
  end;
  if not blocked then raise exception 'TEST FAILED: malformed idempotency key was accepted'; end if;
end $$;

-- ============ Finding 2: mismatched / inactive catalog provisioning cannot occur ============
do $$
declare r jsonb; blocked boolean;
begin
  -- custom_client_portal -> unavailable (browser cannot force a different implementation).
  r := public.provision_client_workspace(
    '66666666-6666-6666-6666-666666666666',
    'Portal GmbH', null, null, 'portal@example.test', null, null, null, null, null, 'active',
    null, null, 'EUR', null, null,
    'custom_client_portal', 'Portal Projekt', 'active', null, null, null, null,
    'Kundenportal', 'portal@example.test', 'owner'
  );
  if not exists (
    select 1 from public.organization_solutions
    where organization_id = (r->>'organization_id')::uuid and implementation_key = 'unavailable'
  ) then
    raise exception 'TEST FAILED: custom_client_portal did not derive the unavailable implementation';
  end if;

  -- Inactive catalog entries cannot be provisioned.
  insert into public.solution_catalog (key, label, description, default_implementation_key, is_active, sort_order)
  values ('retired_product', 'Retired', null, 'unavailable', false, 999);
  blocked := false;
  begin
    perform public.provision_client_workspace(
      '77777777-7777-7777-7777-777777777777',
      'Retired GmbH', null, null, 'retired@example.test', null, null, null, null, null, 'active',
      null, null, 'EUR', null, null,
      'retired_product', 'Retired Rollout', 'active', null, null, null, null,
      'Retired Solution', 'retired@example.test', 'owner'
    );
  exception when raise_exception then blocked := true;
  end;
  if not blocked then raise exception 'TEST FAILED: inactive catalog entry was provisioned'; end if;
end $$;

-- ============ Finding 5: repeated display names produce distinct high-entropy instance keys ============
do $$
declare
  r1 jsonb;
  r2 jsonb;
begin
  r1 := public.provision_client_workspace(
    '44444444-4444-4444-4444-444444444444',
    'Same Name Org 1', null, 'C1', 'same1@example.test', null, null, null, null, null, 'active',
    null, null, 'EUR', null, null,
    'ai_receptionist', 'KI-Rezeptionist', 'active', null, null, null, null,
    'KI-Rezeptionist', 'same1@example.test', 'owner'
  );
  r2 := public.provision_client_workspace(
    '55555555-5555-5555-5555-555555555555',
    'Same Name Org 2', null, 'C2', 'same2@example.test', null, null, null, null, null, 'active',
    null, null, 'EUR', null, null,
    'ai_receptionist', 'KI-Rezeptionist', 'active', null, null, null, null,
    'KI-Rezeptionist', 'same2@example.test', 'owner'
  );
  if (r1->>'instance_key') = (r2->>'instance_key') then
    raise exception 'TEST FAILED: identical display names produced identical instance keys';
  end if;
  if (r1->>'instance_key') !~ '^[a-z0-9][a-z0-9_-]{2,}$' or (r2->>'instance_key') !~ '^[a-z0-9][a-z0-9_-]{2,}$' then
    raise exception 'TEST FAILED: generated instance key has an invalid route-unsafe format';
  end if;
  -- At least 16 hex characters of entropy in the suffix.
  if (r1->>'instance_key') !~ '-[0-9a-f]{16,}$' or (r2->>'instance_key') !~ '-[0-9a-f]{16,}$' then
    raise exception 'TEST FAILED: instance key suffix does not carry at least 16 hex characters of entropy';
  end if;
end $$;

-- ============ Scenario 14: platform admin can view all organizations and solutions ============
do $$
declare c integer;
begin
  select count(*) into c from public.organization_solutions;
  if c < 2 then raise exception 'TEST FAILED: admin should see all solutions, got %', c; end if;
  select count(*) into c from public.client_accounts;
  if c < 2 then raise exception 'TEST FAILED: admin should see all client accounts, got %', c; end if;
end $$;

-- ============ Scenario 8: unverified email cannot claim ============
select set_config('request.jwt.claim.sub', current_setting('cp.unconfirmed'), true);
do $$
declare c integer;
begin
  select count(*) into c from public.claim_my_client_invitations();
  if c <> 0 then raise exception 'TEST FAILED: unconfirmed email claimed % invitations', c; end if;
end $$;

-- ============ Scenario 9: different email cannot claim ============
select set_config('request.jwt.claim.sub', current_setting('cp.different'), true);
do $$
declare c integer;
begin
  select count(*) into c from public.claim_my_client_invitations();
  if c <> 0 then raise exception 'TEST FAILED: different email claimed % invitations', c; end if;
end $$;

-- ============ Scenario 7: verified invited email can claim membership ============
select set_config('request.jwt.claim.sub', current_setting('cp.invited'), true);
do $$
declare c integer;
begin
  select count(*) into c from public.claim_my_client_invitations();
  if c <> 1 then raise exception 'TEST FAILED: invited user should claim exactly 1, got %', c; end if;
  if not exists (
    select 1 from public.organization_members
    where organization_id = current_setting('cp.org_a')::uuid
      and user_id = current_setting('cp.invited')::uuid and status = 'active'
  ) then raise exception 'TEST FAILED: membership not active after claim'; end if;
  if exists (
    select 1 from public.client_invitations
    where organization_id = current_setting('cp.org_a')::uuid and status = 'pending'
  ) then raise exception 'TEST FAILED: invitation still pending after claim'; end if;
  if not exists (
    select 1 from public.organizations where id = current_setting('cp.org_a')::uuid and status = 'active'
  ) then raise exception 'TEST FAILED: organization not activated after claim'; end if;
end $$;

-- ============ Scenario 13: claim function is idempotent ============
do $$
declare c integer;
begin
  select count(*) into c from public.claim_my_client_invitations();
  if c <> 0 then raise exception 'TEST FAILED: second claim should return 0, got %', c; end if;
  select count(*) into c from public.organization_members
    where organization_id = current_setting('cp.org_a')::uuid and user_id = current_setting('cp.invited')::uuid;
  if c <> 1 then raise exception 'TEST FAILED: idempotent claim produced % memberships', c; end if;
end $$;

-- ============ Scenario 2 & 3: ordinary customer cannot read client accounts or budgets ============
do $$
declare c integer;
begin
  select count(*) into c from public.client_accounts;
  if c <> 0 then raise exception 'TEST FAILED: ordinary customer read % client_accounts', c; end if;
  select count(*) into c from public.client_engagements;
  if c <> 0 then raise exception 'TEST FAILED: ordinary customer read % client_engagements (budgets)', c; end if;
end $$;

-- ============ Scenario 4: ordinary customer cannot assign solutions ============
do $$
declare blocked boolean := false;
begin
  begin
    insert into public.organization_solutions (organization_id, catalog_key, instance_key, display_name, implementation_key)
    values (current_setting('cp.org_a')::uuid, 'ai_receptionist', 'rogue_instance', 'Rogue', 'ai_receptionist');
  exception when insufficient_privilege or check_violation then blocked := true;
  end;
  if not blocked then raise exception 'TEST FAILED: ordinary customer assigned a solution'; end if;
end $$;

-- Customer CAN read their own org solution.
do $$
declare c integer;
begin
  select count(*) into c from public.organization_solutions where organization_id = current_setting('cp.org_a')::uuid;
  if c <> 1 then raise exception 'TEST FAILED: member should read own org solution, got %', c; end if;
end $$;

-- ============ Scenario 5: organization A cannot read organization B solutions ============
do $$
declare c integer;
begin
  select count(*) into c from public.organization_solutions where organization_id = current_setting('cp.org_b')::uuid;
  if c <> 0 then raise exception 'TEST FAILED: org A member read % org B solutions', c; end if;
end $$;

-- ============ Scenario 6: anonymous users cannot access any new table ============
reset role;
set local role anon;
select set_config('request.jwt.claim.role', 'anon', true);
select set_config('request.jwt.claim.sub', '', true);
do $$
declare t text;
begin
  foreach t in array array['solution_catalog','client_accounts','client_contacts','client_engagements',
                           'organization_solutions','organization_portal_settings','client_invitations']
  loop
    begin
      execute format('select count(*) from public.%I', t);
      raise exception 'TEST FAILED: anon read public.%', t;
    exception when insufficient_privilege then null;
    end;
  end loop;
end $$;
reset role;

-- ============ Scenario 10: expired invitation cannot be claimed ============
reset role;  -- superuser scaffolding write
insert into public.client_invitations (organization_id, email, organization_role, status, expires_at)
values (current_setting('cp.org_b')::uuid, 'owner-a@example.test', 'member', 'pending', now() - interval '1 day');
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', current_setting('cp.owner_a'), true);
do $$
declare c integer;
begin
  select count(*) into c from public.claim_my_client_invitations();
  if c <> 0 then raise exception 'TEST FAILED: expired invitation was claimed (%)', c; end if;
end $$;

-- ============ Scenario 11: revoked invitation cannot be claimed ============
reset role;  -- superuser scaffolding write
update public.client_invitations set status = 'revoked'
  where organization_id = current_setting('cp.org_b')::uuid and email = 'owner-a@example.test';
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', current_setting('cp.owner_a'), true);
do $$
declare c integer;
begin
  select count(*) into c from public.claim_my_client_invitations();
  if c <> 0 then raise exception 'TEST FAILED: revoked invitation was claimed (%)', c; end if;
end $$;

-- ============ Scenario 12: suspended membership is not reactivated ============
reset role;  -- superuser scaffolding write
-- Suspend the invited user's org A membership, then re-issue a pending invitation.
update public.organization_members set status = 'suspended'
  where organization_id = current_setting('cp.org_a')::uuid and user_id = current_setting('cp.invited')::uuid;
insert into public.client_invitations (organization_id, email, organization_role, status, expires_at)
values (current_setting('cp.org_a')::uuid, 'invited@example.test', 'owner', 'pending', now() + interval '7 days');
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', current_setting('cp.invited'), true);
do $$
declare st text;
begin
  perform public.claim_my_client_invitations();
  select status into st from public.organization_members
    where organization_id = current_setting('cp.org_a')::uuid and user_id = current_setting('cp.invited')::uuid;
  if st <> 'suspended' then raise exception 'TEST FAILED: suspended membership was reactivated (status=%)', st; end if;
end $$;

rollback;
SQL

echo "client platform smoke test: ALL SCENARIOS PASSED"
