#!/usr/bin/env bash
# Executable security regression suite for the reusable capability authorization model.
# Applies the real migration chain to a throwaway database and asserts the security boundaries.
# FOR LOCAL TESTING ONLY — never point DATABASE_URL at production.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:5432/postgres}"

run_psql() {
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 "$@"
}

# --- Bootstrap a Supabase-like environment ---
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
alter table auth.users add column if not exists email_confirmed_at timestamptz;

grant usage on schema auth to anon, authenticated, service_role, supabase_auth_admin;
grant execute on function auth.uid() to public, anon, authenticated, service_role, supabase_auth_admin;

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000401', 'cap-admin@example.test',     now(), '{"full_name":"Platform Admin"}'::jsonb),
  ('00000000-0000-0000-0000-000000000402', 'cap-owner-a@example.test',   now(), '{"full_name":"Owner A"}'::jsonb),
  ('00000000-0000-0000-0000-000000000403', 'cap-owner-b@example.test',   now(), '{"full_name":"Owner B"}'::jsonb),
  ('00000000-0000-0000-0000-000000000404', 'cap-kasse@example.test',     now(), '{"full_name":"Kassenwart"}'::jsonb),
  ('00000000-0000-0000-0000-000000000405', 'cap-multi@example.test',     now(), '{"full_name":"Multi Role"}'::jsonb),
  ('00000000-0000-0000-0000-000000000406', 'cap-suspended@example.test', now(), '{"full_name":"Suspended"}'::jsonb),
  ('00000000-0000-0000-0000-000000000407', 'cap-legacy@example.test',    now(), '{"full_name":"Legacy Pankofer"}'::jsonb),
  ('00000000-0000-0000-0000-000000000408', 'cap-plain@example.test',     now(), '{"full_name":"Plain Member"}'::jsonb)
on conflict (id) do update set email = excluded.email, email_confirmed_at = excluded.email_confirmed_at;
SQL

# --- Apply the migration chain in order ---
run_psql -f "$ROOT_DIR/supabase/migrations/20260710120000_phase0_auth_tenancy_rls.sql"
run_psql -f "$ROOT_DIR/supabase/migrations/20260710133000_phase0_security_hardening.sql"
run_psql -f "$ROOT_DIR/supabase/migrations/20260711120000_receptionist_persistence.sql"
run_psql -f "$ROOT_DIR/supabase/migrations/20260721120000_product_aware_client_platform.sql"
run_psql -f "$ROOT_DIR/supabase/migrations/20260804120000_reusable_capability_authorization.sql"

# --- Scenarios ---
run_psql <<'SQL'
begin;

select set_config('cap.admin',     '00000000-0000-0000-0000-000000000401', true);
select set_config('cap.owner_a',   '00000000-0000-0000-0000-000000000402', true);
select set_config('cap.owner_b',   '00000000-0000-0000-0000-000000000403', true);
select set_config('cap.kasse',     '00000000-0000-0000-0000-000000000404', true);
select set_config('cap.multi',     '00000000-0000-0000-0000-000000000405', true);
select set_config('cap.suspended', '00000000-0000-0000-0000-000000000406', true);
select set_config('cap.legacy',    '00000000-0000-0000-0000-000000000407', true);
select set_config('cap.plain',     '00000000-0000-0000-0000-000000000408', true);

update public.profiles set platform_role = 'cogniiq_admin' where id = current_setting('cap.admin')::uuid;

-- =========================================================================
-- Scaffolding: two independent organizations, provisioned as a platform admin.
--   Org A = a sports club with the sports_club_operations solution ACTIVE.
--   Org B = an unrelated tenant, used for every cross-tenant assertion.
--   Org L = a "legacy" customer (receptionist only, no functional roles at all),
--           standing in for the existing Pankofer-style customers.
-- =========================================================================
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', current_setting('cap.admin'), true);

do $$
declare r jsonb;
begin
  r := public.provision_client_workspace(
    'aaaaaaaa-0000-0000-0000-000000000001',
    'SV Testverein', null, 'Owner A', 'cap-owner-a@example.test', null, null, null, null, null, 'active',
    null, null, 'EUR', null, null,
    'sports_club_operations', 'Vereinsportal', 'active', null, null, null, null,
    'Vereinsverwaltung', 'cap-owner-a@example.test', 'owner');
  perform set_config('cap.org_a', r->>'organization_id', true);

  r := public.provision_client_workspace(
    'bbbbbbbb-0000-0000-0000-000000000002',
    'Fremd GmbH', null, 'Owner B', 'cap-owner-b@example.test', null, null, null, null, null, 'active',
    null, null, 'EUR', null, null,
    'sports_club_operations', 'Fremdportal', 'active', null, null, null, null,
    'Vereinsverwaltung B', 'cap-owner-b@example.test', 'owner');
  perform set_config('cap.org_b', r->>'organization_id', true);

  r := public.provision_client_workspace(
    'cccccccc-0000-0000-0000-000000000003',
    'Legacy Kunde', null, 'Legacy', 'cap-legacy@example.test', null, null, null, null, null, 'active',
    null, null, 'EUR', null, null,
    'ai_receptionist', 'Rezeptionist', 'active', null, null, null, null,
    'KI-Rezeptionist', 'cap-legacy@example.test', 'owner');
  perform set_config('cap.org_l', r->>'organization_id', true);
end $$;

-- Presets are created as roles only; they assign nobody.
do $$
declare r jsonb; assigned integer;
begin
  r := public.apply_sports_club_role_presets(current_setting('cap.org_a')::uuid);
  if jsonb_array_length(r->'roles') <> 6 then
    raise exception 'TEST FAILED: expected 6 preset roles, got %', jsonb_array_length(r->'roles');
  end if;
  select count(*) into assigned from public.organization_member_roles
    where organization_id = current_setting('cap.org_a')::uuid;
  if assigned <> 0 then
    raise exception 'TEST FAILED: presets assigned % memberships; presets must assign nobody', assigned;
  end if;
  perform public.apply_sports_club_role_presets(current_setting('cap.org_b')::uuid);
end $$;

do $$
begin
  perform set_config('cap.role_kassenwart_a',
    (select id::text from public.organization_roles
     where organization_id = current_setting('cap.org_a')::uuid and role_key = 'kassenwart'), true);
  perform set_config('cap.role_buchung_a',
    (select id::text from public.organization_roles
     where organization_id = current_setting('cap.org_a')::uuid and role_key = 'buchungsverwaltung'), true);
  perform set_config('cap.role_lesend_a',
    (select id::text from public.organization_roles
     where organization_id = current_setting('cap.org_a')::uuid and role_key = 'lesender_administrator'), true);
  perform set_config('cap.role_kassenwart_b',
    (select id::text from public.organization_roles
     where organization_id = current_setting('cap.org_b')::uuid and role_key = 'kassenwart'), true);
end $$;

-- ============ Role keys are unique inside an organization, not globally ============
-- Asserted with RLS and grants bypassed, so it proves the CONSTRAINT rather than a policy.
reset role;
do $$
declare c integer; blocked boolean := false;
begin
  select count(*) into c from public.organization_roles where role_key = 'kassenwart';
  if c <> 2 then raise exception 'TEST FAILED: expected the same role_key in both orgs, got %', c; end if;

  begin
    insert into public.organization_roles (organization_id, role_key, label)
    values (current_setting('cap.org_a')::uuid, 'kassenwart', 'Duplikat');
  exception when unique_violation then blocked := true;
  end;
  if not blocked then raise exception 'TEST FAILED: duplicate role_key inside one organization was accepted'; end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', current_setting('cap.admin'), true);

-- ============ Invitations: configure functional roles before acceptance ============
reset role;  -- superuser scaffolding write
insert into public.client_invitations (organization_id, email, organization_role, status, expires_at)
values
  (current_setting('cap.org_a')::uuid, 'cap-kasse@example.test',  'member', 'pending', now() + interval '7 days'),
  (current_setting('cap.org_a')::uuid, 'cap-multi@example.test',  'member', 'pending', now() + interval '7 days'),
  (current_setting('cap.org_a')::uuid, 'cap-plain@example.test',  'member', 'pending', now() + interval '7 days');
select set_config('cap.inv_kasse',
  (select id::text from public.client_invitations where email = 'cap-kasse@example.test'), false);
select set_config('cap.inv_multi',
  (select id::text from public.client_invitations where email = 'cap-multi@example.test'), false);
select set_config('cap.inv_plain',
  (select id::text from public.client_invitations where email = 'cap-plain@example.test'), false);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', current_setting('cap.admin'), true);

do $$
begin
  perform public.set_client_invitation_roles(
    current_setting('cap.inv_kasse')::uuid,
    array[current_setting('cap.role_kassenwart_a')::uuid]);
  perform public.set_client_invitation_roles(
    current_setting('cap.inv_multi')::uuid,
    array[current_setting('cap.role_kassenwart_a')::uuid, current_setting('cap.role_buchung_a')::uuid]);
  -- cap.inv_plain deliberately keeps NO functional roles (the existing invitation flow).
end $$;

-- ============ FALSIFICATION 1: cross-tenant role on an invitation is refused ============
do $$
declare blocked boolean := false;
begin
  begin
    perform public.set_client_invitation_roles(
      current_setting('cap.inv_kasse')::uuid,
      array[current_setting('cap.role_kassenwart_b')::uuid]);
  exception when others then blocked := true;
  end;
  if not blocked then
    raise exception 'TEST FAILED: an organization B role was configured on an organization A invitation';
  end if;
end $$;
-- The legitimate configuration survived the refused call (read with grants bypassed, because
-- client_invitation_roles is internal CRM data with no grant to authenticated at all).
reset role;
do $$
begin
  if not exists (
    select 1 from public.client_invitation_roles
    where client_invitation_id = current_setting('cap.inv_kasse')::uuid
      and organization_role_id = current_setting('cap.role_kassenwart_a')::uuid
  ) then raise exception 'TEST FAILED: refused cross-tenant call damaged the existing configuration'; end if;
  if exists (
    select 1 from public.client_invitation_roles
    where client_invitation_id = current_setting('cap.inv_kasse')::uuid
      and organization_role_id = current_setting('cap.role_kassenwart_b')::uuid
  ) then raise exception 'TEST FAILED: a cross-tenant invitation role was persisted'; end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);

-- ============ Claim transfers the configured roles exactly once ============
select set_config('request.jwt.claim.sub', current_setting('cap.kasse'), true);
do $$
declare c integer;
begin
  select count(*) into c from public.claim_my_client_invitations();
  if c <> 1 then raise exception 'TEST FAILED: expected 1 claim, got %', c; end if;

  select count(*) into c
  from public.organization_member_roles omr
  join public.organization_members om on om.id = omr.organization_member_id
  where om.user_id = current_setting('cap.kasse')::uuid;
  if c <> 1 then raise exception 'TEST FAILED: invitation role transfer produced % assignments, expected 1', c; end if;
end $$;

-- ============ FALSIFICATION 2: repeated claim is idempotent ============
do $$
declare c integer; claimed integer;
begin
  -- Repeated login/session events: the RPC is called again and again.
  select count(*) into claimed from public.claim_my_client_invitations();
  if claimed <> 0 then raise exception 'TEST FAILED: second claim returned %, expected 0', claimed; end if;
  select count(*) into claimed from public.claim_my_client_invitations();
  if claimed <> 0 then raise exception 'TEST FAILED: third claim returned %, expected 0', claimed; end if;

  select count(*) into c
  from public.organization_member_roles omr
  join public.organization_members om on om.id = omr.organization_member_id
  where om.user_id = current_setting('cap.kasse')::uuid;
  if c <> 1 then raise exception 'TEST FAILED: repeated claim duplicated assignments (% rows)', c; end if;

  select count(*) into c from public.organization_members
    where user_id = current_setting('cap.kasse')::uuid;
  if c <> 1 then raise exception 'TEST FAILED: repeated claim produced % memberships', c; end if;
end $$;

-- A user can read only their OWN effective context.
do $$
declare ctx jsonb; caps jsonb;
begin
  ctx := public.current_user_portal_context();
  if jsonb_array_length(ctx->'organizations') <> 1 then
    raise exception 'TEST FAILED: context exposed % organizations, expected 1', jsonb_array_length(ctx->'organizations');
  end if;
  if (ctx->'organizations'->0->>'organization_id') <> current_setting('cap.org_a') then
    raise exception 'TEST FAILED: context returned the wrong organization';
  end if;
  if (ctx->>'user_id') <> current_setting('cap.kasse') then
    raise exception 'TEST FAILED: context reported another user id';
  end if;

  caps := ctx->'organizations'->0->'capabilities';
  if not (caps ? 'svh.finance.manage') then
    raise exception 'TEST FAILED: Kassenwart lacks svh.finance.manage (caps=%)', caps;
  end if;
  if caps ? 'svh.bookings.manage' then
    raise exception 'TEST FAILED: Kassenwart wrongly holds svh.bookings.manage';
  end if;
  if not (caps ? 'portal.documents.view') then
    raise exception 'TEST FAILED: Kassenwart lost the general portal baseline';
  end if;
end $$;

-- ============ Multiple roles produce the deduplicated capability union ============
select set_config('request.jwt.claim.sub', current_setting('cap.multi'), true);
do $$
declare ctx jsonb; caps jsonb; c integer;
begin
  perform public.claim_my_client_invitations();
  ctx := public.current_user_portal_context();
  caps := ctx->'organizations'->0->'capabilities';

  if jsonb_array_length(ctx->'organizations'->0->'roles') <> 2 then
    raise exception 'TEST FAILED: expected 2 functional roles, got %',
      jsonb_array_length(ctx->'organizations'->0->'roles');
  end if;
  -- Union across Kassenwart + Buchungsverwaltung.
  if not (caps ? 'svh.finance.manage' and caps ? 'svh.bookings.manage' and caps ? 'svh.facilities.view') then
    raise exception 'TEST FAILED: capability union incomplete (caps=%)', caps;
  end if;
  -- Neither role grants these.
  if caps ? 'svh.devices.manage' or caps ? 'svh.members.manage' then
    raise exception 'TEST FAILED: capability union leaked ungranted capabilities';
  end if;
  -- Deduplicated: svh.dashboard.view is granted by BOTH roles and must appear once.
  select count(*) into c from jsonb_array_elements_text(caps) k where k = 'svh.dashboard.view';
  if c <> 1 then raise exception 'TEST FAILED: capability union is not deduplicated (% copies)', c; end if;
end $$;

-- ============ The existing invitation flow WITHOUT functional roles still works ============
select set_config('request.jwt.claim.sub', current_setting('cap.plain'), true);
do $$
declare ctx jsonb; caps jsonb; c integer;
begin
  select count(*) into c from public.claim_my_client_invitations();
  if c <> 1 then raise exception 'TEST FAILED: role-free invitation was not claimed (got %)', c; end if;
  if not exists (
    select 1 from public.organization_members
    where user_id = current_setting('cap.plain')::uuid and status = 'active'
  ) then raise exception 'TEST FAILED: role-free claim did not create an active membership'; end if;

  ctx := public.current_user_portal_context();
  caps := ctx->'organizations'->0->'capabilities';
  if jsonb_array_length(ctx->'organizations'->0->'roles') <> 0 then
    raise exception 'TEST FAILED: role-free member somehow has functional roles';
  end if;
  -- Backward compatibility: no functional role => full general-portal baseline, unchanged.
  if not (caps ? 'portal.overview.view' and caps ? 'portal.documents.view'
          and caps ? 'portal.billing.view' and caps ? 'portal.projects.view'
          and caps ? 'portal.support.create' and caps ? 'portal.support.view_own') then
    raise exception 'TEST FAILED: baseline missing for a member without functional roles (caps=%)', caps;
  end if;
  -- ...but no product capability is invented for them.
  if caps ? 'svh.finance.view' then
    raise exception 'TEST FAILED: baseline leaked a solution capability';
  end if;
end $$;

-- ============ Existing Pankofer-style customer access is unchanged ============
select set_config('request.jwt.claim.sub', current_setting('cap.legacy'), true);
do $$
declare ctx jsonb; caps jsonb;
begin
  perform public.claim_my_client_invitations();
  ctx := public.current_user_portal_context();
  if jsonb_array_length(ctx->'organizations') <> 1 then
    raise exception 'TEST FAILED: legacy customer lost their organization';
  end if;
  if (ctx->'organizations'->0->>'organization_role') <> 'owner' then
    raise exception 'TEST FAILED: legacy customer lost their coarse organization role';
  end if;
  caps := ctx->'organizations'->0->'capabilities';
  if not (caps ? 'portal.overview.view' and caps ? 'portal.documents.view' and caps ? 'portal.billing.view') then
    raise exception 'TEST FAILED: legacy customer lost general portal access (caps=%)', caps;
  end if;
  -- Their receptionist solution is still reported by the context.
  if not exists (
    select 1 from jsonb_array_elements(ctx->'organizations'->0->'solutions') s
    where s->>'catalog_key' = 'ai_receptionist'
  ) then raise exception 'TEST FAILED: legacy customer lost their receptionist solution'; end if;
  -- The legacy entitlement helper still answers the same way.
  if not public.organization_has_accessible_solution(current_setting('cap.org_l')::uuid, 'ai_receptionist') then
    raise exception 'TEST FAILED: legacy receptionist entitlement regressed';
  end if;
end $$;

-- ============ Coarse organization owner keeps the baseline explicitly ============
select set_config('request.jwt.claim.sub', current_setting('cap.owner_a'), true);
do $$
declare ctx jsonb; caps jsonb;
begin
  perform public.claim_my_client_invitations();
  ctx := public.current_user_portal_context();
  caps := ctx->'organizations'->0->'capabilities';
  if not (caps ? 'portal.overview.view' and caps ? 'portal.billing.view') then
    raise exception 'TEST FAILED: coarse owner lost the baseline (caps=%)', caps;
  end if;
  -- An owner is NOT silently a superuser: a coarse owner role grants no product capability.
  if caps ? 'svh.finance.manage' or caps ? 'svh.members.manage' then
    raise exception 'TEST FAILED: coarse owner was implicitly granted product capabilities';
  end if;
end $$;

-- ============ Ordinary members cannot manage roles ============
select set_config('request.jwt.claim.sub', current_setting('cap.kasse'), true);
do $$
declare blocked boolean;
begin
  blocked := false;
  begin
    perform public.assign_organization_member_role(
      (select id from public.organization_members
       where user_id = current_setting('cap.plain')::uuid limit 1),
      current_setting('cap.role_lesend_a')::uuid);
  exception when others then blocked := true;
  end;
  if not blocked then raise exception 'TEST FAILED: an ordinary member assigned a functional role'; end if;

  blocked := false;
  begin
    perform public.remove_organization_member_role(
      (select id from public.organization_members
       where user_id = current_setting('cap.kasse')::uuid limit 1),
      current_setting('cap.role_kassenwart_a')::uuid);
  exception when others then blocked := true;
  end;
  if not blocked then raise exception 'TEST FAILED: an ordinary member removed a functional role'; end if;

  blocked := false;
  begin
    perform public.admin_organization_access_overview(current_setting('cap.org_a')::uuid);
  exception when others then blocked := true;
  end;
  if not blocked then raise exception 'TEST FAILED: an ordinary member read the admin access overview'; end if;
end $$;

-- ============ Direct-table access cannot bypass the RPC authorization ============
do $$
declare blocked boolean;
begin
  blocked := false;
  begin
    insert into public.organization_member_roles (organization_id, organization_member_id, organization_role_id)
    values (
      current_setting('cap.org_a')::uuid,
      (select id from public.organization_members where user_id = current_setting('cap.kasse')::uuid limit 1),
      current_setting('cap.role_lesend_a')::uuid);
  exception when insufficient_privilege or check_violation then blocked := true;
  end;
  if not blocked then raise exception 'TEST FAILED: direct INSERT into organization_member_roles succeeded'; end if;

  blocked := false;
  begin
    delete from public.organization_member_roles
    where organization_member_id = (select id from public.organization_members
                                    where user_id = current_setting('cap.kasse')::uuid limit 1);
    -- RLS makes this a silent no-op rather than an error when DELETE is not granted at all;
    -- assert the row survived either way.
    blocked := exists (
      select 1 from public.organization_member_roles omr
      join public.organization_members om on om.id = omr.organization_member_id
      where om.user_id = current_setting('cap.kasse')::uuid);
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'TEST FAILED: direct DELETE removed a role assignment'; end if;

  blocked := false;
  begin
    insert into public.capabilities (key, label) values ('rogue.capability.grant', 'Rogue');
  exception when insufficient_privilege or check_violation then blocked := true;
  end;
  if not blocked then raise exception 'TEST FAILED: an ordinary member inserted a capability'; end if;

  blocked := false;
  begin
    insert into public.organization_roles (organization_id, role_key, label)
    values (current_setting('cap.org_a')::uuid, 'rogue', 'Rogue');
  exception when insufficient_privilege or check_violation then blocked := true;
  end;
  if not blocked then raise exception 'TEST FAILED: an ordinary member created a functional role'; end if;
end $$;

-- ============ Users cannot reach another organization ============
select set_config('request.jwt.claim.sub', current_setting('cap.owner_b'), true);
do $$
declare ctx jsonb; c integer;
begin
  perform public.claim_my_client_invitations();
  ctx := public.current_user_portal_context();
  if exists (
    select 1 from jsonb_array_elements(ctx->'organizations') o
    where o->>'organization_id' = current_setting('cap.org_a')
  ) then raise exception 'TEST FAILED: organization B owner saw organization A in their context'; end if;

  select count(*) into c from public.organization_roles
    where organization_id = current_setting('cap.org_a')::uuid;
  if c <> 0 then raise exception 'TEST FAILED: org B user read % org A functional roles', c; end if;

  select count(*) into c from public.organization_member_roles
    where organization_id = current_setting('cap.org_a')::uuid;
  if c <> 0 then raise exception 'TEST FAILED: org B user read % org A role assignments', c; end if;

  -- client_invitation_roles has no grant to authenticated at all.
  begin
    execute 'select count(*) from public.client_invitation_roles';
    raise exception 'TEST FAILED: an ordinary member selected from client_invitation_roles';
  exception when insufficient_privilege then null;
  end;
end $$;

-- ============ FALSIFICATION 3: cross-organization assignment protection ============
select set_config('request.jwt.claim.sub', current_setting('cap.admin'), true);
do $$
declare blocked boolean; org_a_member uuid;
begin
  select id into org_a_member from public.organization_members
    where user_id = current_setting('cap.kasse')::uuid limit 1;

  -- (a) Through the RPC, as a fully authorized platform admin.
  blocked := false;
  begin
    perform public.assign_organization_member_role(org_a_member, current_setting('cap.role_kassenwart_b')::uuid);
  exception when others then blocked := true;
  end;
  if not blocked then
    raise exception 'TEST FAILED: a platform admin assigned an organization B role to an organization A member';
  end if;
end $$;

-- (b) Structurally, bypassing RLS entirely as the database owner. If this succeeds, the model
--     relies on policy alone and the constraint claim is false.
reset role;
do $$
declare blocked boolean := false; org_a_member uuid;
begin
  select id into org_a_member from public.organization_members
    where user_id = current_setting('cap.kasse')::uuid limit 1;
  begin
    insert into public.organization_member_roles (organization_id, organization_member_id, organization_role_id)
    values (current_setting('cap.org_a')::uuid, org_a_member, current_setting('cap.role_kassenwart_b')::uuid);
  exception when foreign_key_violation then blocked := true;
  end;
  if not blocked then
    raise exception 'TEST FAILED: a cross-organization assignment was insertable while bypassing RLS';
  end if;

  -- And the mirror attempt, forging organization_id to match the role instead of the member.
  blocked := false;
  begin
    insert into public.organization_member_roles (organization_id, organization_member_id, organization_role_id)
    values (current_setting('cap.org_b')::uuid, org_a_member, current_setting('cap.role_kassenwart_b')::uuid);
  exception when foreign_key_violation then blocked := true;
  end;
  if not blocked then
    raise exception 'TEST FAILED: forging organization_id defeated the cross-organization constraint';
  end if;
end $$;

-- ============ Platform admins CAN manage assignments ============
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', current_setting('cap.admin'), true);
do $$
declare assignment uuid; overview jsonb; removed boolean; plain_member uuid;
begin
  select id into plain_member from public.organization_members
    where user_id = current_setting('cap.plain')::uuid limit 1;

  assignment := public.assign_organization_member_role(plain_member, current_setting('cap.role_lesend_a')::uuid);
  if assignment is null then raise exception 'TEST FAILED: platform admin assignment returned null'; end if;

  -- Idempotent: assigning the same role twice does not duplicate.
  perform public.assign_organization_member_role(plain_member, current_setting('cap.role_lesend_a')::uuid);
  if (select count(*) from public.organization_member_roles where organization_member_id = plain_member) <> 1 then
    raise exception 'TEST FAILED: repeated assignment duplicated the row';
  end if;

  overview := public.admin_organization_access_overview(current_setting('cap.org_a')::uuid);
  if jsonb_array_length(overview->'roles') <> 6 then
    raise exception 'TEST FAILED: overview reported % roles', jsonb_array_length(overview->'roles');
  end if;
  if jsonb_array_length(overview->'members') < 4 then
    raise exception 'TEST FAILED: overview reported too few members';
  end if;
  if jsonb_array_length(overview->'capability_catalog') < 19 then
    raise exception 'TEST FAILED: overview capability catalog incomplete';
  end if;

  removed := public.remove_organization_member_role(plain_member, current_setting('cap.role_lesend_a')::uuid);
  if not removed then raise exception 'TEST FAILED: removal reported no change'; end if;
  -- Removing an assignment must not remove the membership or the profile.
  if not exists (select 1 from public.organization_members where id = plain_member) then
    raise exception 'TEST FAILED: removing a role assignment deleted the membership';
  end if;
  if not exists (select 1 from public.profiles where id = current_setting('cap.plain')::uuid) then
    raise exception 'TEST FAILED: removing a role assignment deleted the profile';
  end if;
end $$;

-- ============ Removal revokes the capability immediately ============
-- The mutations run as the platform admin through the RPCs; the capability inspection runs with
-- grants bypassed, because membership_effective_capability_keys(uuid) is deliberately NOT granted
-- to authenticated (it would otherwise let any signed-in user probe another membership id).
do $$
declare kasse_member uuid;
begin
  select id into kasse_member from public.organization_members
    where user_id = current_setting('cap.kasse')::uuid limit 1;
  -- Two roles first, so the member does not simply fall back to the baseline.
  perform public.assign_organization_member_role(kasse_member, current_setting('cap.role_buchung_a')::uuid);
end $$;
reset role;
do $$
declare kasse_member uuid;
begin
  select id into kasse_member from public.organization_members
    where user_id = current_setting('cap.kasse')::uuid limit 1;
  if not (public.membership_effective_capability_keys(kasse_member) @> array['svh.bookings.manage','svh.finance.manage']) then
    raise exception 'TEST FAILED: expected both role capability sets before removal';
  end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', current_setting('cap.admin'), true);
do $$
declare kasse_member uuid;
begin
  select id into kasse_member from public.organization_members
    where user_id = current_setting('cap.kasse')::uuid limit 1;
  perform public.remove_organization_member_role(kasse_member, current_setting('cap.role_buchung_a')::uuid);
end $$;
reset role;
do $$
declare kasse_member uuid;
begin
  select id into kasse_member from public.organization_members
    where user_id = current_setting('cap.kasse')::uuid limit 1;
  if public.membership_effective_capability_keys(kasse_member) @> array['svh.bookings.manage'] then
    raise exception 'TEST FAILED: revoked capability survived removal';
  end if;
  if not (public.membership_effective_capability_keys(kasse_member) @> array['svh.finance.manage']) then
    raise exception 'TEST FAILED: removal revoked an unrelated capability';
  end if;
end $$;

-- ============ FALSIFICATION 4: inactive solutions suppress their capabilities ============
do $$
declare kasse_member uuid; caps text[];
begin
  select id into kasse_member from public.organization_members
    where user_id = current_setting('cap.kasse')::uuid limit 1;

  if not (public.membership_effective_capability_keys(kasse_member) @> array['svh.finance.manage']) then
    raise exception 'TEST FAILED: precondition — finance capability missing while the solution is active';
  end if;

  update public.organization_solutions set status = 'paused'
    where organization_id = current_setting('cap.org_a')::uuid
      and catalog_key = 'sports_club_operations';

  caps := public.membership_effective_capability_keys(kasse_member);
  if caps && array['svh.finance.manage','svh.finance.view','svh.dashboard.view'] then
    raise exception 'TEST FAILED: a non-activated solution still granted its capabilities (caps=%)', caps;
  end if;
  -- General portal capabilities are NOT bound to a solution and must survive.
  if not (caps @> array['portal.documents.view']) then
    raise exception 'TEST FAILED: solution suppression wrongly removed general portal capabilities';
  end if;

  update public.organization_solutions set status = 'disabled'
    where organization_id = current_setting('cap.org_a')::uuid
      and catalog_key = 'sports_club_operations';
  caps := public.membership_effective_capability_keys(kasse_member);
  if caps && array['svh.finance.manage'] then
    raise exception 'TEST FAILED: a disabled solution still granted its capabilities';
  end if;

  -- Restore for the remaining scenarios.
  update public.organization_solutions set status = 'active'
    where organization_id = current_setting('cap.org_a')::uuid
      and catalog_key = 'sports_club_operations';
  if not (public.membership_effective_capability_keys(kasse_member) @> array['svh.finance.manage']) then
    raise exception 'TEST FAILED: reactivating the solution did not restore the capability';
  end if;
end $$;

-- ============ Suspended membership produces no portal access ============
reset role;  -- superuser scaffolding write
update public.organization_members set status = 'suspended'
  where user_id = current_setting('cap.kasse')::uuid;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', current_setting('cap.kasse'), true);
do $$
declare ctx jsonb;
begin
  ctx := public.current_user_portal_context();
  if jsonb_array_length(ctx->'organizations') <> 0 then
    raise exception 'TEST FAILED: a suspended membership still produced portal access';
  end if;
end $$;
reset role;
do $$
declare kasse_member uuid;
begin
  select id into kasse_member from public.organization_members
    where user_id = current_setting('cap.kasse')::uuid limit 1;
  if array_length(public.membership_effective_capability_keys(kasse_member), 1) is not null then
    raise exception 'TEST FAILED: a suspended membership still holds capabilities';
  end if;
end $$;
update public.organization_members set status = 'active'
  where user_id = current_setting('cap.kasse')::uuid;

-- ============ anon has zero access ============
set local role anon;
select set_config('request.jwt.claim.role', 'anon', true);
select set_config('request.jwt.claim.sub', '', true);
do $$
declare t text;
begin
  foreach t in array array['capabilities','organization_roles','organization_role_capabilities',
                           'organization_member_roles','client_invitation_roles']
  loop
    begin
      execute format('select count(*) from public.%I', t);
      raise exception 'TEST FAILED: anon read public.%', t;
    exception when insufficient_privilege then null;
    end;
  end loop;
end $$;
do $$
declare f text;
begin
  foreach f in array array[
    'select public.current_user_portal_context()',
    'select public.admin_organization_access_overview(''00000000-0000-0000-0000-000000000000''::uuid)',
    'select public.assign_organization_member_role(''00000000-0000-0000-0000-000000000000''::uuid, ''00000000-0000-0000-0000-000000000000''::uuid)',
    'select public.remove_organization_member_role(''00000000-0000-0000-0000-000000000000''::uuid, ''00000000-0000-0000-0000-000000000000''::uuid)',
    'select public.set_client_invitation_roles(''00000000-0000-0000-0000-000000000000''::uuid, array[]::uuid[])',
    'select public.upsert_organization_role(''00000000-0000-0000-0000-000000000000''::uuid, ''x'', ''X'', null, array[]::text[])',
    'select public.apply_sports_club_role_presets(''00000000-0000-0000-0000-000000000000''::uuid)',
    'select public.membership_effective_capability_keys(''00000000-0000-0000-0000-000000000000''::uuid)'
  ]
  loop
    begin
      execute f;
      raise exception 'TEST FAILED: anon executed %', f;
    exception when insufficient_privilege then null;
    end;
  end loop;
end $$;
reset role;

-- ============ Deleting an assignment never cascades into business data ============
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', current_setting('cap.admin'), true);
do $$
declare before_members integer; after_members integer; before_profiles integer; after_profiles integer;
begin
  select count(*) into before_members from public.organization_members;
  select count(*) into before_profiles from public.profiles;

  -- Deleting the ROLE itself cascades to its assignments and grants, and to nothing else.
  reset role;
  delete from public.organization_roles where id = current_setting('cap.role_lesend_a')::uuid;
  set local role authenticated;

  select count(*) into after_members from public.organization_members;
  select count(*) into after_profiles from public.profiles;
  if after_members <> before_members then
    raise exception 'TEST FAILED: deleting a role changed the membership count (% -> %)', before_members, after_members;
  end if;
  if after_profiles <> before_profiles then
    raise exception 'TEST FAILED: deleting a role changed the profile count (% -> %)', before_profiles, after_profiles;
  end if;
  if exists (select 1 from public.organization_role_capabilities
             where organization_role_id = current_setting('cap.role_lesend_a')::uuid) then
    raise exception 'TEST FAILED: role deletion left orphaned capability grants';
  end if;
end $$;

-- ============ Capability keys are globally unique and namespaced ============
do $$
declare blocked boolean;
begin
  reset role;
  blocked := false;
  begin
    insert into public.capabilities (key, label) values ('portal.overview.view', 'Duplikat');
  exception when unique_violation then blocked := true;
  end;
  if not blocked then raise exception 'TEST FAILED: a duplicate capability key was accepted'; end if;

  blocked := false;
  begin
    insert into public.capabilities (key, label) values ('notnamespaced', 'Bad');
  exception when check_violation then blocked := true;
  end;
  if not blocked then raise exception 'TEST FAILED: a non-namespaced capability key was accepted'; end if;
end $$;

-- ============ Every new SECURITY DEFINER function pins search_path ============
do $$
declare bad text;
begin
  select string_agg(p.proname, ', ') into bad
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.prosecdef
    and p.proname in (
      'membership_effective_capability_keys','current_user_portal_context',
      'admin_organization_access_overview','assign_organization_member_role',
      'remove_organization_member_role','set_client_invitation_roles',
      'upsert_organization_role','apply_sports_club_role_presets',
      'claim_my_client_invitations')
    and not exists (
      select 1 from unnest(coalesce(p.proconfig, array[]::text[])) cfg
      where cfg like 'search\_path=%'
    );
  if bad is not null then
    raise exception 'TEST FAILED: SECURITY DEFINER functions without a pinned search_path: %', bad;
  end if;
end $$;

-- ============ Every new table has RLS enabled ============
do $$
declare bad text;
begin
  select string_agg(c.relname, ', ') into bad
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in ('capabilities','organization_roles','organization_role_capabilities',
                      'organization_member_roles','client_invitation_roles')
    and not c.relrowsecurity;
  if bad is not null then raise exception 'TEST FAILED: tables without RLS: %', bad; end if;
end $$;

rollback;
SQL

echo "capability authorization smoke test: ALL SCENARIOS PASSED"
