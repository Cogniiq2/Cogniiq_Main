#!/usr/bin/env bash
set -euo pipefail

# Verifies the ai_receptionist entitlement reconciliation added by
# 20260721120000_product_aware_client_platform.sql:
#   * legacy receptionist organizations are backfilled with an ai_receptionist solution;
#   * a backfilled organization can still load and save its receptionist product records;
#   * an automation-only organization owner cannot select/insert/update receptionist records;
#   * platform admins retain access.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:5432/postgres}"

run_psql() { psql "$DATABASE_URL" -v ON_ERROR_STOP=1 "$@"; }

# --- Bootstrap Supabase-like environment ---
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
  ('00000000-0000-0000-0000-000000000401', 'ent-admin@example.test',  now(), '{"full_name":"Admin"}'::jsonb),
  ('00000000-0000-0000-0000-000000000402', 'ent-legacy@example.test', now(), '{"full_name":"Legacy Owner"}'::jsonb),
  ('00000000-0000-0000-0000-000000000403', 'ent-auto@example.test',   now(), '{"full_name":"Automation Owner"}'::jsonb)
on conflict (id) do update set email = excluded.email;
SQL

# --- Apply Phase 0 + receptionist persistence (NOT the client platform migration yet) ---
run_psql -f "$ROOT_DIR/supabase/migrations/20260710120000_phase0_auth_tenancy_rls.sql"
run_psql -f "$ROOT_DIR/supabase/migrations/20260710133000_phase0_security_hardening.sql"
run_psql -f "$ROOT_DIR/supabase/migrations/20260711120000_receptionist_persistence.sql"

# --- Insert LEGACY receptionist data (predating organization_solutions), committed ---
run_psql <<'SQL'
select set_config('ent.admin',  '00000000-0000-0000-0000-000000000401', false);
select set_config('ent.legacy', '00000000-0000-0000-0000-000000000402', false);
select set_config('ent.auto',   '00000000-0000-0000-0000-000000000403', false);
select set_config('ent.org_l',  gen_random_uuid()::text, false);

update public.profiles set platform_role = 'cogniiq_admin' where id = current_setting('ent.admin')::uuid;

insert into public.organizations (id, name, status, created_by)
values (current_setting('ent.org_l')::uuid, 'Legacy Receptionist Org', 'active', current_setting('ent.legacy')::uuid);

insert into public.organization_members (organization_id, user_id, role, status)
values (current_setting('ent.org_l')::uuid, current_setting('ent.legacy')::uuid, 'owner', 'active');

insert into public.businesses (organization_id, name, contact_email)
values (current_setting('ent.org_l')::uuid, 'Legacy Business', 'legacy@example.test');

insert into public.onboarding_sessions (organization_id, business_id, status, current_step, completed_steps, selected_goals)
select current_setting('ent.org_l')::uuid, b.id, 'in_progress', 'goals', array['company']::text[], array['capture_leads']::text[]
from public.businesses b where b.organization_id = current_setting('ent.org_l')::uuid;

insert into public.receptionist_configs (organization_id, business_id, receptionist_name, tone)
select current_setting('ent.org_l')::uuid, b.id, 'Mia', 'professional'
from public.businesses b where b.organization_id = current_setting('ent.org_l')::uuid;

insert into public.phone_configs (organization_id, business_id, setup_mode, forwarding_confirmed)
select current_setting('ent.org_l')::uuid, b.id, 'forwarding', true
from public.businesses b where b.organization_id = current_setting('ent.org_l')::uuid;
SQL

# --- Apply the client platform migration (runs the backfill + tightens policies) ---
run_psql -f "$ROOT_DIR/supabase/migrations/20260721120000_product_aware_client_platform.sql"

# --- Scenarios ---
run_psql <<'SQL'
select set_config('ent.admin',  '00000000-0000-0000-0000-000000000401', false);
select set_config('ent.legacy', '00000000-0000-0000-0000-000000000402', false);
select set_config('ent.auto',   '00000000-0000-0000-0000-000000000403', false);

-- Backfill assertion (persisted).
do $$
begin
  if not exists (
    select 1 from public.organization_solutions os
    join public.businesses b on b.organization_id = os.organization_id
    where b.name = 'Legacy Business'
      and os.catalog_key = 'ai_receptionist' and os.status = 'active'
  ) then
    raise exception 'TEST FAILED: legacy receptionist organization was not backfilled';
  end if;
  if not exists (
    select 1 from public.organization_portal_settings ps
    join public.businesses b on b.organization_id = ps.organization_id
    where b.name = 'Legacy Business'
  ) then
    raise exception 'TEST FAILED: legacy organization portal settings were not backfilled';
  end if;
end $$;

begin;

select set_config('ent.org_l', (select organization_id::text from public.businesses where name = 'Legacy Business'), true);

-- Automation-only organization A (created after the migration), owner membership + automation solution only.
select set_config('ent.org_a', gen_random_uuid()::text, true);
insert into public.organizations (id, name, status, created_by)
values (current_setting('ent.org_a')::uuid, 'Automation Only Org', 'active', current_setting('ent.auto')::uuid);
insert into public.organization_members (organization_id, user_id, role, status)
values (current_setting('ent.org_a')::uuid, current_setting('ent.auto')::uuid, 'owner', 'active');
insert into public.organization_solutions (organization_id, catalog_key, instance_key, display_name, implementation_key, status)
values (current_setting('ent.org_a')::uuid, 'automation_workspace', 'auto-' || replace(current_setting('ent.org_a'), '-', ''), 'Automation', 'automation_workspace', 'active');
-- A receptionist business exists for org A (superuser-inserted) to prove the SELECT policy blocks it.
insert into public.businesses (organization_id, name) values (current_setting('ent.org_a')::uuid, 'Sneaky Business');
select set_config('ent.biz_a', (select id::text from public.businesses where organization_id = current_setting('ent.org_a')::uuid), true);

-- ===== Backfilled receptionist org can still LOAD and SAVE =====
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', current_setting('ent.legacy'), true);

do $$
declare c integer;
begin
  select count(*) into c from public.businesses where organization_id = current_setting('ent.org_l')::uuid;
  if c <> 1 then raise exception 'TEST FAILED: backfilled org owner cannot load its business (got %)', c; end if;

  update public.businesses set name = 'Legacy Business Saved' where organization_id = current_setting('ent.org_l')::uuid;
  get diagnostics c = ROW_COUNT;
  if c <> 1 then raise exception 'TEST FAILED: backfilled org owner cannot save its business'; end if;

  update public.onboarding_sessions set current_step = 'review'
    where organization_id = current_setting('ent.org_l')::uuid;
  get diagnostics c = ROW_COUNT;
  if c <> 1 then raise exception 'TEST FAILED: backfilled org owner cannot save onboarding'; end if;

  update public.receptionist_configs set tone = 'warm'
    where organization_id = current_setting('ent.org_l')::uuid;
  get diagnostics c = ROW_COUNT;
  if c <> 1 then raise exception 'TEST FAILED: backfilled org owner cannot save receptionist config'; end if;

  update public.phone_configs set setup_mode = 'ai-number'
    where organization_id = current_setting('ent.org_l')::uuid;
  get diagnostics c = ROW_COUNT;
  if c <> 1 then raise exception 'TEST FAILED: backfilled org owner cannot save phone config'; end if;
end $$;

-- ===== Automation-only owner cannot select / insert / update receptionist records =====
select set_config('request.jwt.claim.sub', current_setting('ent.auto'), true);

do $$
declare c integer; blocked boolean;
begin
  -- SELECT blocked (0 rows) despite a business existing for the org.
  select count(*) into c from public.businesses where organization_id = current_setting('ent.org_a')::uuid;
  if c <> 0 then raise exception 'TEST FAILED: automation-only owner selected % receptionist businesses', c; end if;

  -- UPDATE blocked (0 rows affected).
  update public.businesses set name = 'Hijacked' where organization_id = current_setting('ent.org_a')::uuid;
  get diagnostics c = ROW_COUNT;
  if c <> 0 then raise exception 'TEST FAILED: automation-only owner updated % receptionist businesses', c; end if;

  -- INSERT blocked (with_check requires ai_receptionist entitlement). Use a literal business id so
  -- the attempt is a real insert, not a policy-filtered empty subquery.
  blocked := false;
  begin
    insert into public.receptionist_configs (organization_id, business_id, receptionist_name)
    values (current_setting('ent.org_a')::uuid, current_setting('ent.biz_a')::uuid, 'Rogue');
  exception when insufficient_privilege or check_violation or raise_exception then blocked := true;
  end;
  if not blocked then raise exception 'TEST FAILED: automation-only owner inserted a receptionist config'; end if;

  -- Cross-tenant SELECT of the legacy org is also blocked.
  select count(*) into c from public.businesses where organization_id = current_setting('ent.org_l')::uuid;
  if c <> 0 then raise exception 'TEST FAILED: automation-only owner read another org receptionist data'; end if;
end $$;

-- ===== Platform admin retains access =====
select set_config('request.jwt.claim.sub', current_setting('ent.admin'), true);
do $$
declare c integer;
begin
  select count(*) into c from public.businesses;
  if c < 2 then raise exception 'TEST FAILED: platform admin should read all receptionist businesses, got %', c; end if;
  update public.businesses set name = 'Admin Touched' where organization_id = current_setting('ent.org_l')::uuid;
  get diagnostics c = ROW_COUNT;
  if c <> 1 then raise exception 'TEST FAILED: platform admin cannot update receptionist business'; end if;
end $$;

rollback;

-- --- Cleanup committed legacy data so a shared database is left clean for other suites ---
delete from public.organizations where name = 'Legacy Receptionist Org';
SQL

echo "receptionist entitlement smoke test: ALL SCENARIOS PASSED"
