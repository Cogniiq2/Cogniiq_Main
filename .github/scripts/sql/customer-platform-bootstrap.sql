-- Throwaway-database bootstrap for the CUSTOMER PLATFORM test suite.
--
-- Unlike the owner-finance bootstrap (which stubs profiles/organizations as bare id
-- tables), these tests exercise real tenancy: organization membership, membership
-- status, platform roles and the is_organization_member()/is_platform_admin()
-- helpers. So this bootstrap creates a minimal `auth` schema and then lets the REAL
-- phase-0 tenancy migration run unmodified on top of it.
--
-- auth.uid() reads the `app.uid` GUC so a test can "become" any user with
-- `set_config('app.uid', <uuid>, false)`.

create extension if not exists pgcrypto;

create schema if not exists auth;
create schema if not exists extensions;
create schema if not exists storage;
create schema if not exists supabase_migrations;

-- Mirrors the migration-ledger table every real Supabase project (hosted or
-- `supabase start`) provisions automatically -- never created by preflight.sql
-- itself, which only ever reads it.
create table if not exists supabase_migrations.schema_migrations (
  version text primary key,
  statements text[],
  name text
);

-- Minimal auth.users: phase0 references it for the profiles FK and its signup trigger.
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  email_confirmed_at timestamptz,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('app.uid', true), '')::uuid;
$$;

create or replace function auth.role() returns text
language sql stable as $$
  select coalesce(nullif(current_setting('app.role', true), ''), 'authenticated');
$$;

-- Roles referenced by grant/revoke statements in the real migrations.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role; end if;
end;
$$;

-- Minimal Storage surface so the customer-documents migration can register its
-- bucket and its storage.objects policies exactly as it would in production.
-- Mirrors the columns real Supabase Storage's storage.buckets carries (public,
-- file_size_limit, allowed_mime_types) so a migration's bucket-hardening logic can
-- be exercised the same way it will run in production.
create table if not exists storage.buckets (
  id text primary key,
  name text not null,
  public boolean not null default false,
  file_size_limit bigint,
  allowed_mime_types text[],
  created_at timestamptz not null default now()
);

create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null references storage.buckets(id) on delete cascade,
  name text not null,
  owner uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table storage.objects enable row level security;

-- Test helper: "log in" as a given user id, or as nobody.
create or replace function public.test_become(p_uid uuid)
returns void language sql as $$
  select set_config('app.uid', coalesce(p_uid::text, ''), false);
$$;
