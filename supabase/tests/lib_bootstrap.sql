-- Shared bootstrap for local commercial-document smoke tests: minimal Supabase-like auth shim,
-- roles, and seed users. Mirrors the preamble used by run_owner_finance_smoke.sh so the same
-- migrations apply identically. FOR LOCAL TESTING ONLY — never run against production.
create extension if not exists pgcrypto;
create schema if not exists auth;
do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
do $$ begin create role service_role nologin bypassrls; exception when duplicate_object then null; end $$;
alter role service_role bypassrls;
do $$ begin create role supabase_admin nologin; exception when duplicate_object then null; end $$;
do $$ begin create role supabase_auth_admin nologin; exception when duplicate_object then null; end $$;
create or replace function auth.uid() returns uuid language sql stable as $f$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid; $f$;
create table if not exists auth.users (id uuid primary key default gen_random_uuid(), email text, email_confirmed_at timestamptz, raw_user_meta_data jsonb default '{}'::jsonb, created_at timestamptz default now(), updated_at timestamptz default now());
alter table auth.users add column if not exists email_confirmed_at timestamptz;
grant usage on schema auth to anon, authenticated, service_role, supabase_auth_admin;
grant execute on function auth.uid() to public, anon, authenticated, service_role, supabase_auth_admin;
insert into auth.users (id, email, email_confirmed_at) values
  ('00000000-0000-0000-0000-000000000901', 'owner@x.test', now()),
  ('00000000-0000-0000-0000-000000000902', 'admin@x.test', now()),
  ('00000000-0000-0000-0000-000000000903', 'customer@x.test', now()),
  ('00000000-0000-0000-0000-000000000904', 'orgowner@x.test', now())
on conflict (id) do update set email = excluded.email;
