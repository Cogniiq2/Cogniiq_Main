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

alter role service_role bypassrls;

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
  ('00000000-0000-0000-0000-000000000301', 'access-owner-a@example.test', '{"full_name":"Access Owner A"}'::jsonb),
  ('00000000-0000-0000-0000-000000000302', 'access-owner-b@example.test', '{"full_name":"Access Owner B"}'::jsonb),
  ('00000000-0000-0000-0000-000000000303', 'access-member-a@example.test', '{"full_name":"Access Member A"}'::jsonb),
  ('00000000-0000-0000-0000-000000000304', 'access-platform-admin@example.test', '{"full_name":"Access Platform Admin"}'::jsonb)
on conflict (id) do update
  set email = excluded.email,
      raw_user_meta_data = excluded.raw_user_meta_data;
SQL

BASE_READY="$(run_psql -Atc "select to_regclass('public.businesses') is not null")"
if [[ "$BASE_READY" != "t" ]]; then
  run_psql -f "$ROOT_DIR/supabase/migrations/20260710120000_phase0_auth_tenancy_rls.sql"
  run_psql -f "$ROOT_DIR/supabase/migrations/20260710133000_phase0_security_hardening.sql"
  run_psql -f "$ROOT_DIR/supabase/migrations/20260711120000_receptionist_persistence.sql"
fi

run_psql -f "$ROOT_DIR/supabase/migrations/20260720120000_client_hub_access_foundation.sql"

run_psql <<'SQL'
do $$
begin
  if to_regclass('public.service_entitlements') is null then
    raise exception 'Client hub access migration did not create service_entitlements';
  end if;

  if to_regclass('public.change_requests') is null then
    raise exception 'Client hub access migration did not create change_requests';
  end if;

  if to_regprocedure('public.request_has_aal2()') is null then
    raise exception 'MFA AAL helper missing';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'receptionist_configs'
      and policyname = 'receptionist_configs_update_platform_admins'
  ) then
    raise exception 'Read-only receptionist customer policy hardening missing';
  end if;
end $$;

begin;

select set_config('access.owner_a', '00000000-0000-0000-0000-000000000301', true);
select set_config('access.owner_b', '00000000-0000-0000-0000-000000000302', true);
select set_config('access.member_a', '00000000-0000-0000-0000-000000000303', true);
select set_config('access.platform_admin', '00000000-0000-0000-0000-000000000304', true);
select set_config('access.org_a', gen_random_uuid()::text, true);
select set_config('access.org_b', gen_random_uuid()::text, true);

update public.profiles
set platform_role = 'customer'
where id in (
  current_setting('access.owner_a')::uuid,
  current_setting('access.owner_b')::uuid,
  current_setting('access.member_a')::uuid
);

update public.profiles
set platform_role = 'cogniiq_admin'
where id = current_setting('access.platform_admin')::uuid;

insert into public.organizations (id, name, status, created_by)
values
  (current_setting('access.org_a')::uuid, 'Client Hub Org A', 'active', current_setting('access.owner_a')::uuid),
  (current_setting('access.org_b')::uuid, 'Client Hub Org B', 'active', current_setting('access.owner_b')::uuid);

insert into public.organization_members (organization_id, user_id, role, status)
values
  (current_setting('access.org_a')::uuid, current_setting('access.owner_a')::uuid, 'owner', 'active'),
  (current_setting('access.org_a')::uuid, current_setting('access.member_a')::uuid, 'viewer', 'active'),
  (current_setting('access.org_b')::uuid, current_setting('access.owner_b')::uuid, 'owner', 'active');

set local role service_role;
select set_config('request.jwt.claim.role', 'service_role', true);
select set_config('request.jwt.claim.sub', current_setting('access.platform_admin'), true);
select set_config('request.jwt.claim.aal', 'aal2', true);

insert into public.service_entitlements (
  organization_id,
  product_key,
  status,
  starts_at,
  activation_source,
  external_reference
)
values
  (current_setting('access.org_a')::uuid, 'client_hub', 'active', now() - interval '1 day', 'smoke', 'client-hub-a'),
  (current_setting('access.org_a')::uuid, 'ai_receptionist', 'active', now() - interval '1 day', 'smoke', 'ai-receptionist-a'),
  (current_setting('access.org_b')::uuid, 'client_hub', 'active', now() - interval '1 day', 'smoke', 'client-hub-b'),
  (current_setting('access.org_b')::uuid, 'ai_receptionist', 'active', now() - interval '1 day', 'smoke', 'ai-receptionist-b');

do $$
declare
  business_id uuid;
  onboarding_id uuid;
  receptionist_id uuid;
  phone_id uuid;
begin
  insert into public.businesses (
    organization_id,
    name,
    website,
    industry,
    contact_email,
    primary_contact_name,
    existing_business_phone
  )
  values (
    current_setting('access.org_a')::uuid,
    'Client Hub Business A',
    'https://client-hub-a.example.test',
    'Managed service',
    'team@client-hub-a.example.test',
    'Owner A',
    '+4915111111111'
  )
  returning id into business_id;

  perform set_config('access.business_a', business_id::text, true);

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
    current_setting('access.org_a')::uuid,
    business_id,
    'in_progress',
    'goals',
    array['company']::text[],
    array['answer_faqs', 'capture_leads']::text[],
    'Freundlich und verbindlich'
  )
  returning id into onboarding_id;

  perform set_config('access.onboarding_a', onboarding_id::text, true);

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
    current_setting('access.org_a')::uuid,
    business_id,
    'Mia',
    'de',
    array['en']::text[],
    'Guten Tag',
    'professional',
    '["answer_faqs", "capture_leads", "take_messages", "transfer_calls", "capture_appointments", "after_hours"]'::jsonb,
    '["use_confirmed_facts_only", "be_transparent_when_unsure", "transfer_when_needed", "take_messages", "collect_contact_details"]'::jsonb,
    '["no_invented_prices", "no_binding_appointments", "no_refund_promises", "no_regulated_advice", "no_unconfirmed_services"]'::jsonb,
    '{"instruction":"Nachricht aufnehmen"}'::jsonb,
    '{"instruction":"Bei Bedarf uebergeben"}'::jsonb
  )
  returning id into receptionist_id;

  perform set_config('access.receptionist_a', receptionist_id::text, true);

  insert into public.phone_configs (
    organization_id,
    business_id,
    setup_mode,
    existing_public_number,
    assigned_ai_number,
    human_transfer_number,
    urgent_escalation_number,
    after_hours_number,
    sms_notification_number,
    forwarding_confirmed,
    test_status
  )
  values (
    current_setting('access.org_a')::uuid,
    business_id,
    'forwarding',
    '+4915111111111',
    '+499912345678',
    '+4915111111112',
    '+4915111111113',
    '+4915111111114',
    '+4915111111115',
    true,
    'queued'
  )
  returning id into phone_id;

  perform set_config('access.phone_a', phone_id::text, true);
end $$;

reset role;
set local role anon;
select set_config('request.jwt.claim.role', 'anon', true);
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.aal', 'aal1', true);

do $$
begin
  perform count(*) from public.service_entitlements;
  raise exception 'TEST FAILED: anon service_entitlements select unexpectedly succeeded';
exception
  when insufficient_privilege then
    null;
end $$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', current_setting('access.owner_a'), true);
select set_config('request.jwt.claim.aal', 'aal1', true);

do $$
declare
  row_count integer;
begin
  if public.request_has_aal2() then
    raise exception 'TEST FAILED: aal1 request reported aal2';
  end if;

  select count(*) into row_count
  from public.service_entitlements
  where organization_id = current_setting('access.org_a')::uuid;

  if row_count <> 2 then
    raise exception 'TEST FAILED: active org member should read own entitlements before MFA, got % rows', row_count;
  end if;

  select count(*) into row_count
  from public.businesses
  where id = current_setting('access.business_a')::uuid;

  if row_count <> 0 then
    raise exception 'TEST FAILED: aal1 member read sensitive business data';
  end if;
end $$;

select set_config('request.jwt.claim.aal', 'aal2', true);

do $$
declare
  row_count integer;
  blocked boolean := false;
  request_id uuid;
begin
  if public.request_has_aal2() is not true then
    raise exception 'TEST FAILED: aal2 request did not report aal2';
  end if;

  select count(*) into row_count
  from public.businesses
  where id = current_setting('access.business_a')::uuid;

  if row_count <> 1 then
    raise exception 'TEST FAILED: active entitled aal2 owner should read sensitive business data';
  end if;

  update public.businesses
  set name = 'Client Hub Business A Updated'
  where id = current_setting('access.business_a')::uuid;

  get diagnostics row_count = ROW_COUNT;
  if row_count <> 1 then
    raise exception 'TEST FAILED: active entitled owner should edit onboarding business fields';
  end if;

  update public.onboarding_sessions
  set current_step = 'review',
      completed_steps = array['company', 'goals']::text[],
      selected_goals = array['answer_faqs', 'capture_leads', 'transfer_calls']::text[],
      preferred_behavior = 'Browser edit under active entitlement'
  where id = current_setting('access.onboarding_a')::uuid;

  get diagnostics row_count = ROW_COUNT;
  if row_count <> 1 then
    raise exception 'TEST FAILED: active entitled owner should edit customer onboarding fields';
  end if;

  select count(*) into row_count
  from public.onboarding_sessions
  where id = current_setting('access.onboarding_a')::uuid
    and status = 'in_progress';

  if row_count <> 1 then
    raise exception 'TEST FAILED: owner onboarding edit changed backend-controlled status';
  end if;

  begin
    update public.onboarding_sessions
    set status = 'research_running'
    where id = current_setting('access.onboarding_a')::uuid;
  exception
    when insufficient_privilege or raise_exception then
      blocked := true;
  end;

  if not blocked then
    raise exception 'TEST FAILED: browser owner changed onboarding status directly';
  end if;

  update public.receptionist_configs
  set tone = 'warm'
  where id = current_setting('access.receptionist_a')::uuid;

  get diagnostics row_count = ROW_COUNT;
  if row_count <> 0 then
    raise exception 'TEST FAILED: browser owner updated read-only receptionist config';
  end if;

  update public.phone_configs
  set setup_mode = 'ai-number'
  where id = current_setting('access.phone_a')::uuid;

  get diagnostics row_count = ROW_COUNT;
  if row_count <> 0 then
    raise exception 'TEST FAILED: browser owner updated read-only phone config';
  end if;

  blocked := false;
  begin
    insert into public.service_entitlements (organization_id, product_key, status)
    values (current_setting('access.org_a')::uuid, 'document_automation', 'active');
  exception
    when insufficient_privilege or with_check_option_violation then
      blocked := true;
  end;

  if not blocked then
    raise exception 'TEST FAILED: browser owner created service entitlement';
  end if;

  insert into public.change_requests (organization_id, category, subject, description)
  values (
    current_setting('access.org_a')::uuid,
    'Receptionist',
    'Begrueszung anpassen',
    'Bitte die Begrueszung fuer Stammkunden etwas persoenlicher formulieren.'
  )
  returning id into request_id;

  perform set_config('access.change_request_a', request_id::text, true);

  select count(*) into row_count
  from public.change_requests
  where id = request_id
    and requested_by = current_setting('access.owner_a')::uuid
    and status = 'open';

  if row_count <> 1 then
    raise exception 'TEST FAILED: owner-created change request did not keep server-controlled requester/status';
  end if;

  update public.change_requests
  set status = 'completed'
  where id = request_id;

  get diagnostics row_count = ROW_COUNT;
  if row_count <> 0 then
    raise exception 'TEST FAILED: customer updated change request status';
  end if;
end $$;

select set_config('request.jwt.claim.sub', current_setting('access.owner_b'), true);
select set_config('request.jwt.claim.aal', 'aal2', true);

do $$
declare
  row_count integer;
begin
  select count(*) into row_count
  from public.service_entitlements
  where organization_id = current_setting('access.org_a')::uuid;

  if row_count <> 0 then
    raise exception 'TEST FAILED: owner B read org A entitlements';
  end if;

  select count(*) into row_count
  from public.change_requests
  where id = current_setting('access.change_request_a')::uuid;

  if row_count <> 0 then
    raise exception 'TEST FAILED: owner B read org A change request';
  end if;
end $$;

select set_config('request.jwt.claim.sub', current_setting('access.platform_admin'), true);
select set_config('request.jwt.claim.aal', 'aal1', true);

do $$
declare
  row_count integer;
begin
  update public.change_requests
  set status = 'in_review'
  where id = current_setting('access.change_request_a')::uuid;

  get diagnostics row_count = ROW_COUNT;
  if row_count <> 0 then
    raise exception 'TEST FAILED: platform admin without aal2 updated sensitive change request';
  end if;
end $$;

select set_config('request.jwt.claim.aal', 'aal2', true);

do $$
declare
  row_count integer;
begin
  update public.change_requests
  set status = 'in_review'
  where id = current_setting('access.change_request_a')::uuid;

  get diagnostics row_count = ROW_COUNT;
  if row_count <> 1 then
    raise exception 'TEST FAILED: aal2 platform admin should update change request status';
  end if;

  update public.service_entitlements
  set status = 'past_due'
  where organization_id = current_setting('access.org_a')::uuid
    and product_key = 'client_hub';

  get diagnostics row_count = ROW_COUNT;
  if row_count <> 1 then
    raise exception 'TEST FAILED: aal2 platform admin should update entitlement status';
  end if;
end $$;

select set_config('request.jwt.claim.sub', current_setting('access.owner_a'), true);
select set_config('request.jwt.claim.aal', 'aal2', true);

do $$
declare
  row_count integer;
begin
  select count(*) into row_count
  from public.businesses
  where id = current_setting('access.business_a')::uuid;

  if row_count <> 0 then
    raise exception 'TEST FAILED: past_due client_hub entitlement still allowed sensitive business access';
  end if;
end $$;

rollback;
SQL
