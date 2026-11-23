-- Emulates the hosted Supabase platform default privileges for schema `public`, exactly as
-- pg_default_acl shows them in production (read-only check, 2026-11-23):
--   functions: {postgres=X, anon=X, authenticated=X, service_role=X}
--   tables:    {postgres=arwdDxtm, anon=…, authenticated=…, service_role=…}
--   sequences: {postgres=rwU, anon=rwU, authenticated=rwU, service_role=rwU}
-- Without this a bare PostgreSQL cluster only has the implicit PUBLIC grant on functions, so a
-- migration that revokes "from public, anon" looks correct locally while leaving `authenticated`
-- with EXECUTE in production. That is precisely the defect the P0 hotfix closes.
-- FOR LOCAL TESTING ONLY — never run against production.
alter default privileges for role postgres in schema public
  grant execute on functions to anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  grant all on sequences to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;

-- Extension + storage shims, identical to supabase/tests/run_owner_purge_policy_smoke.sh.
create schema if not exists extensions;
do $$ begin
  if not exists (select 1 from pg_extension e join pg_namespace n on n.oid = e.extnamespace
                 where e.extname = 'pgcrypto' and n.nspname = 'extensions') then
    drop extension if exists pgcrypto cascade;
    create extension pgcrypto schema extensions;
  end if;
end $$;
grant usage on schema extensions to public;
create or replace function public.gen_random_uuid() returns uuid
  language sql as $f$ select extensions.gen_random_uuid() $f$;

create schema if not exists storage;
create table if not exists storage.buckets (
  id text primary key, name text, public boolean default false,
  file_size_limit bigint, allowed_mime_types text[]);
create table if not exists storage.objects (
  id uuid primary key default extensions.gen_random_uuid(),
  bucket_id text, name text, owner uuid, metadata jsonb,
  created_at timestamptz default now(), updated_at timestamptz default now());
grant usage on schema storage to service_role;
grant select, insert, update, delete on storage.objects to service_role;
