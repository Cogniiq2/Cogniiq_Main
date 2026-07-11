#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:5432/postgres}"

run_psql() {
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 "$@"
}

run_psql <<'SQL'
create extension if not exists pgcrypto;
create schema if not exists auth;

do $$
begin
  create role anon nologin;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create role authenticated nologin;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create role service_role nologin;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create role supabase_admin nologin;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create role supabase_auth_admin nologin;
exception
  when duplicate_object then null;
end $$;

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant usage on schema auth to anon, authenticated, service_role, supabase_auth_admin;
grant execute on function auth.uid() to public, anon, authenticated, service_role, supabase_auth_admin;

insert into auth.users (id, email, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000101', 'phase0-one@example.test', '{"full_name":"Phase Zero One"}'::jsonb),
  ('00000000-0000-0000-0000-000000000102', 'phase0-two@example.test', '{"name":"Phase Zero Two"}'::jsonb)
on conflict (id) do update
  set email = excluded.email,
      raw_user_meta_data = excluded.raw_user_meta_data;

do $$
begin
  if to_regclass('public.tasks') is not null
    or to_regclass('public.execution_days') is not null
    or to_regclass('public.execution_tasks') is not null then
    raise exception 'Smoke database should not contain optional legacy admin tables';
  end if;
end $$;
SQL

run_psql -f "$ROOT_DIR/supabase/migrations/20260710120000_phase0_auth_tenancy_rls.sql"
run_psql -f "$ROOT_DIR/supabase/migrations/20260710133000_phase0_security_hardening.sql"

# Rerun the pair to catch partial-install recovery and idempotency hazards.
run_psql -f "$ROOT_DIR/supabase/migrations/20260710120000_phase0_auth_tenancy_rls.sql"
run_psql -f "$ROOT_DIR/supabase/migrations/20260710133000_phase0_security_hardening.sql"

run_psql <<'SQL'
do $$
begin
  if to_regclass('public.profiles') is null then
    raise exception 'profiles table was not created';
  end if;

  if to_regclass('public.organizations') is null then
    raise exception 'organizations table was not created';
  end if;

  if to_regclass('public.organization_members') is null then
    raise exception 'organization_members table was not created';
  end if;

  if to_regtype('public.platform_role') is null
    or to_regtype('public.organization_status') is null
    or to_regtype('public.organization_role') is null
    or to_regtype('public.membership_status') is null then
    raise exception 'one or more Phase 0 enum types were not created';
  end if;

  if (select count(*) from public.profiles where id in (
    '00000000-0000-0000-0000-000000000101'::uuid,
    '00000000-0000-0000-0000-000000000102'::uuid
  )) <> 2 then
    raise exception 'profile backfill did not create the expected rows';
  end if;

  if not exists (
    select 1
    from pg_trigger tr
    join pg_class c on c.oid = tr.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'auth'
      and c.relname = 'users'
      and tr.tgname = 'on_auth_user_profile_sync'
      and not tr.tgisinternal
  ) then
    raise exception 'auth profile sync trigger was not installed';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_select_self_or_platform_admin'
  ) then
    raise exception 'profiles select RLS policy was not installed';
  end if;

  if to_regclass('public.tasks') is not null
    or to_regclass('public.execution_days') is not null
    or to_regclass('public.execution_tasks') is not null then
    raise exception 'Phase 0 migration created optional legacy admin tables';
  end if;

  if to_regprocedure('public.generate_daily_execution_plan(date)') is not null then
    raise exception 'Phase 0 migration created legacy generate_daily_execution_plan(date)';
  end if;
end $$;
SQL
