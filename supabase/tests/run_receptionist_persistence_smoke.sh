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
  create role service_role nologin bypassrls;
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
  ('00000000-0000-0000-0000-000000000201', 'owner-a@example.test', '{"full_name":"Owner A"}'::jsonb),
  ('00000000-0000-0000-0000-000000000202', 'owner-b@example.test', '{"full_name":"Owner B"}'::jsonb),
  ('00000000-0000-0000-0000-000000000203', 'member-a@example.test', '{"full_name":"Member A"}'::jsonb),
  ('00000000-0000-0000-0000-000000000204', 'platform-admin@example.test', '{"full_name":"Platform Admin"}'::jsonb)
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

  if to_regclass('public.oura_daily_sleep') is not null
    or to_regclass('public.oura_daily_readiness') is not null
    or to_regclass('public.oura_daily_activity') is not null then
    raise exception 'Smoke database should not contain Oura tables';
  end if;
end $$;
SQL

run_psql -f "$ROOT_DIR/supabase/migrations/20260710120000_phase0_auth_tenancy_rls.sql"
run_psql -f "$ROOT_DIR/supabase/migrations/20260710133000_phase0_security_hardening.sql"
run_psql -f "$ROOT_DIR/supabase/migrations/20260711120000_receptionist_persistence.sql"

run_psql <<'SQL'
do $$
begin
  if to_regclass('public.businesses') is null
    or to_regclass('public.onboarding_sessions') is null
    or to_regclass('public.receptionist_configs') is null
    or to_regclass('public.phone_configs') is null then
    raise exception 'Receptionist persistence migration did not create all required tables';
  end if;

  if to_regclass('public.tasks') is not null
    or to_regclass('public.execution_days') is not null
    or to_regclass('public.execution_tasks') is not null then
    raise exception 'Receptionist persistence migration created or required optional legacy admin tables';
  end if;

  if to_regclass('public.oura_daily_sleep') is not null
    or to_regclass('public.oura_daily_readiness') is not null
    or to_regclass('public.oura_daily_activity') is not null then
    raise exception 'Receptionist persistence migration created or required Oura tables';
  end if;

  if not exists (select 1 from pg_class where oid = 'public.businesses'::regclass and relrowsecurity)
    or not exists (select 1 from pg_class where oid = 'public.onboarding_sessions'::regclass and relrowsecurity)
    or not exists (select 1 from pg_class where oid = 'public.receptionist_configs'::regclass and relrowsecurity)
    or not exists (select 1 from pg_class where oid = 'public.phone_configs'::regclass and relrowsecurity) then
    raise exception 'RLS is not enabled on every receptionist persistence table';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'phone_configs'
      and policyname = 'phone_configs_update_owner_admin_or_platform_admin'
  ) then
    raise exception 'Expected phone_configs update policy was not created';
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'onboarding_sessions_organization_business_fk'
  ) then
    raise exception 'Cross-tenant onboarding composite foreign key missing';
  end if;

  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'phone_configs_business_id_idx'
  ) then
    raise exception 'Expected phone_configs business index missing';
  end if;
end $$;

begin;

select set_config('rp.customer_a', '00000000-0000-0000-0000-000000000201', true);
select set_config('rp.customer_b', '00000000-0000-0000-0000-000000000202', true);
select set_config('rp.member_a', '00000000-0000-0000-0000-000000000203', true);
select set_config('rp.platform_admin', '00000000-0000-0000-0000-000000000204', true);
select set_config('rp.org_a', gen_random_uuid()::text, true);
select set_config('rp.org_b', gen_random_uuid()::text, true);

update public.profiles
set platform_role = 'customer'
where id in (
  current_setting('rp.customer_a')::uuid,
  current_setting('rp.customer_b')::uuid,
  current_setting('rp.member_a')::uuid
);

update public.profiles
set platform_role = 'cogniiq_admin'
where id = current_setting('rp.platform_admin')::uuid;

insert into public.organizations (id, name, status, created_by)
values
  (current_setting('rp.org_a')::uuid, 'Receptionist Persistence Org A', 'active', current_setting('rp.customer_a')::uuid),
  (current_setting('rp.org_b')::uuid, 'Receptionist Persistence Org B', 'active', current_setting('rp.customer_b')::uuid);

insert into public.organization_members (organization_id, user_id, role, status)
values
  (current_setting('rp.org_a')::uuid, current_setting('rp.customer_a')::uuid, 'owner', 'active'),
  (current_setting('rp.org_a')::uuid, current_setting('rp.member_a')::uuid, 'member', 'active'),
  (current_setting('rp.org_b')::uuid, current_setting('rp.customer_b')::uuid, 'owner', 'active');

set local role anon;
select set_config('request.jwt.claim.role', 'anon', true);
select set_config('request.jwt.claim.sub', '', true);

do $$
begin
  perform count(*) from public.businesses;
  raise exception 'TEST FAILED: anon business select unexpectedly succeeded';
exception
  when insufficient_privilege then
    null;
end $$;

reset role;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', current_setting('rp.customer_a'), true);

do $$
declare
  inserted_business_id uuid;
  inserted_session_id uuid;
  inserted_phone_id uuid;
  row_count integer;
begin
  insert into public.businesses (
    organization_id,
    name,
    website,
    industry,
    address,
    contact_email,
    primary_contact_name,
    existing_business_phone
  )
  values (
    current_setting('rp.org_a')::uuid,
    'Org A Business',
    'https://a.example.test',
    'Healthcare',
    'A Street 1',
    'team@a.example.test',
    'Owner A',
    '+4915112345678'
  )
  returning id into inserted_business_id;

  perform set_config('rp.business_a', inserted_business_id::text, true);

  insert into public.onboarding_sessions (
    organization_id,
    business_id,
    status,
    current_step,
    completed_steps,
    selected_goals,
    preferred_behavior
  )
  values (
    current_setting('rp.org_a')::uuid,
    inserted_business_id,
    'in_progress',
    'goals',
    array['company']::text[],
    array['Leads erfassen']::text[],
    'Freundlich und kurz'
  )
  returning id into inserted_session_id;

  perform set_config('rp.onboarding_a', inserted_session_id::text, true);

  insert into public.receptionist_configs (
    organization_id,
    business_id,
    receptionist_name,
    primary_language,
    additional_languages,
    greeting,
    tone,
    responsibilities,
    allowed_actions,
    prohibited_actions,
    after_hours_behavior,
    transfer_behavior
  )
  values (
    current_setting('rp.org_a')::uuid,
    inserted_business_id,
    'Mia',
    'de',
    array['en']::text[],
    'Guten Tag',
    'professional',
    '["FAQs beantworten"]'::jsonb,
    '["Nachrichten aufnehmen"]'::jsonb,
    '["Keine Preise erfinden"]'::jsonb,
    '{"instruction":"Nachricht aufnehmen"}'::jsonb,
    '{"instruction":"Bei Unsicherheit uebergeben"}'::jsonb
  );

  insert into public.phone_configs (
    organization_id,
    business_id,
    setup_mode,
    existing_public_number,
    human_transfer_number,
    urgent_escalation_number,
    after_hours_number,
    sms_notification_number,
    forwarding_confirmed
  )
  values (
    current_setting('rp.org_a')::uuid,
    inserted_business_id,
    'forwarding',
    '+4915112345678',
    '+4915112345679',
    '+4915112345680',
    '+4915112345681',
    '+4915112345682',
    true
  )
  returning id into inserted_phone_id;

  perform set_config('rp.phone_a', inserted_phone_id::text, true);

  select count(*) into row_count
  from public.businesses
  where organization_id = current_setting('rp.org_a')::uuid;

  if row_count <> 1 then
    raise exception 'TEST FAILED: owner should read own business, got % rows', row_count;
  end if;

  select count(*) into row_count
  from public.onboarding_sessions
  where id = inserted_session_id
    and started_at is not null;

  if row_count <> 1 then
    raise exception 'TEST FAILED: onboarding started_at should be maintained by trigger';
  end if;
end $$;

select set_config('request.jwt.claim.sub', current_setting('rp.customer_b'), true);

do $$
declare
  inserted_business_id uuid;
  row_count integer;
begin
  insert into public.businesses (organization_id, name)
  values (current_setting('rp.org_b')::uuid, 'Org B Business')
  returning id into inserted_business_id;

  perform set_config('rp.business_b', inserted_business_id::text, true);

  select count(*) into row_count
  from public.businesses
  where organization_id = current_setting('rp.org_a')::uuid;

  if row_count <> 0 then
    raise exception 'TEST FAILED: customer B can read customer A business';
  end if;

  update public.businesses
  set name = 'Cross Tenant Update'
  where id = current_setting('rp.business_a')::uuid;

  get diagnostics row_count = ROW_COUNT;
  if row_count <> 0 then
    raise exception 'TEST FAILED: cross-organization business update affected % rows', row_count;
  end if;
end $$;

select set_config('request.jwt.claim.sub', current_setting('rp.customer_a'), true);

do $$
declare
  row_count integer;
  blocked boolean := false;
begin
  update public.businesses
  set name = 'Org A Business Updated'
  where id = current_setting('rp.business_a')::uuid;

  get diagnostics row_count = ROW_COUNT;
  if row_count <> 1 then
    raise exception 'TEST FAILED: own-organization business update affected % rows', row_count;
  end if;

  begin
    insert into public.onboarding_sessions (
      organization_id,
      business_id,
      status,
      current_step,
      completed_steps,
      selected_goals,
      preferred_behavior
    )
    values (
      current_setting('rp.org_a')::uuid,
      current_setting('rp.business_b')::uuid,
      'in_progress',
      'company',
      array[]::text[],
      array[]::text[],
      null
    );
  exception
    when foreign_key_violation or unique_violation or insufficient_privilege or with_check_option_violation then
      blocked := true;
  end;

  if not blocked then
    raise exception 'TEST FAILED: cross-tenant child insertion unexpectedly succeeded';
  end if;
end $$;

do $$
declare
  blocked boolean := false;
begin
  begin
    update public.phone_configs
    set assigned_ai_number = '+499999999999'
    where id = current_setting('rp.phone_a')::uuid;
  exception
    when insufficient_privilege or raise_exception then
      blocked := true;
  end;

  if not blocked then
    raise exception 'TEST FAILED: customer changed assigned_ai_number';
  end if;
end $$;

do $$
declare
  blocked boolean := false;
begin
  begin
    update public.phone_configs
    set test_status = 'passed'
    where id = current_setting('rp.phone_a')::uuid;
  exception
    when insufficient_privilege or raise_exception then
      blocked := true;
  end;

  if not blocked then
    raise exception 'TEST FAILED: customer claimed successful test_status';
  end if;
end $$;

do $$
declare
  blocked boolean := false;
begin
  begin
    update public.businesses
    set created_at = '2000-01-01 00:00:00+00'::timestamptz
    where id = current_setting('rp.business_a')::uuid;
  exception
    when insufficient_privilege or raise_exception then
      blocked := true;
  end;

  if not blocked then
    raise exception 'TEST FAILED: customer manipulated business created_at';
  end if;
end $$;

select set_config('request.jwt.claim.sub', current_setting('rp.member_a'), true);

do $$
declare
  row_count integer;
begin
  select count(*) into row_count
  from public.businesses
  where id = current_setting('rp.business_a')::uuid;

  if row_count <> 1 then
    raise exception 'TEST FAILED: ordinary org member should read own org business';
  end if;

  update public.businesses
  set name = 'Member Should Not Edit'
  where id = current_setting('rp.business_a')::uuid;

  get diagnostics row_count = ROW_COUNT;
  if row_count <> 0 then
    raise exception 'TEST FAILED: ordinary org member update affected % rows', row_count;
  end if;
end $$;

select set_config('request.jwt.claim.sub', current_setting('rp.platform_admin'), true);

do $$
declare
  row_count integer;
begin
  if public.is_platform_admin() is not true then
    raise exception 'TEST FAILED: platform admin helper returned false';
  end if;

  select count(*) into row_count from public.businesses;
  if row_count < 2 then
    raise exception 'TEST FAILED: platform admin should read all businesses, got % rows', row_count;
  end if;

  update public.receptionist_configs
  set tone = 'warm'
  where business_id = current_setting('rp.business_a')::uuid;

  get diagnostics row_count = ROW_COUNT;
  if row_count <> 1 then
    raise exception 'TEST FAILED: platform admin customer-editable update affected % rows', row_count;
  end if;
end $$;

rollback;
SQL
