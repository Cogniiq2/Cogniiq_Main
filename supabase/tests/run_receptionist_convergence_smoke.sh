#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ADMIN_DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:5432/postgres}"
RUN_ID="${GITHUB_RUN_ID:-local}_$$"

case "$ADMIN_DATABASE_URL" in
  *supabase.co*|*pooler.supabase*|*amazonaws.com*|*neon.tech*|*render.com*)
    echo "Refusing to run receptionist convergence smoke against a hosted database URL." >&2
    exit 1
    ;;
esac

admin_psql() {
  psql "$ADMIN_DATABASE_URL" -v ON_ERROR_STOP=1 "$@"
}

database_url_for() {
  local db_name="$1"
  printf '%s/%s\n' "${ADMIN_DATABASE_URL%/*}" "$db_name"
}

db_psql() {
  local db_url="$1"
  shift
  psql "$db_url" -v ON_ERROR_STOP=1 "$@"
}

create_disposable_database() {
  local db_name="$1"
  admin_psql -c "drop database if exists \"$db_name\" with (force);"
  admin_psql -c "create database \"$db_name\";"
}

drop_disposable_database() {
  local db_name="$1"
  admin_psql -c "drop database if exists \"$db_name\" with (force);" >/dev/null
}

bootstrap_supabase_test_environment() {
  local db_url="$1"

  db_psql "$db_url" <<'SQL'
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
  ('00000000-0000-0000-0000-000000000301', 'convergence-owner@example.test', '{"full_name":"Convergence Owner"}'::jsonb),
  ('00000000-0000-0000-0000-000000000302', 'convergence-admin@example.test', '{"full_name":"Convergence Admin"}'::jsonb)
on conflict (id) do update
  set email = excluded.email,
      raw_user_meta_data = excluded.raw_user_meta_data;
SQL
}

install_phase0_and_receptionist() {
  local db_url="$1"

  db_psql "$db_url" -f "$ROOT_DIR/supabase/migrations/20260710120000_phase0_auth_tenancy_rls.sql"
  db_psql "$db_url" -f "$ROOT_DIR/supabase/migrations/20260710133000_phase0_security_hardening.sql"
  db_psql "$db_url" -f "$ROOT_DIR/supabase/migrations/20260711120000_receptionist_persistence.sql"
}

assert_partial_production_converges() {
  local db_name="rp_convergence_partial_${RUN_ID}"
  local db_url
  db_url="$(database_url_for "$db_name")"
  create_disposable_database "$db_name"

  bootstrap_supabase_test_environment "$db_url"
  install_phase0_and_receptionist "$db_url"

  db_psql "$db_url" <<'SQL'
alter table public.receptionist_configs drop constraint receptionist_configs_responsibilities_keys_check;
alter table public.receptionist_configs drop constraint receptionist_configs_allowed_actions_keys_check;
alter table public.receptionist_configs drop constraint receptionist_configs_prohibited_actions_keys_check;

create or replace function public.guard_onboarding_session_system_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if public.is_database_admin() or public.request_is_service_role() then
    return new;
  end if;

  if tg_op = 'INSERT' and new.status not in ('not_started', 'in_progress') then
    raise exception 'onboarding status is system-controlled';
  end if;

  if tg_op = 'UPDATE' and new.status not in ('not_started', 'in_progress') then
    raise exception 'onboarding status is system-controlled';
  end if;

  return new;
end;
$$;

drop function public.jsonb_text_array_is_subset(jsonb, text[]);
drop function public.onboarding_status_transition_is_allowed(text, text);
grant update (status) on table public.onboarding_sessions to authenticated;

do $$
declare
  target_table_name text;
  target_row_count bigint;
begin
  foreach target_table_name in array array[
    'public.businesses',
    'public.onboarding_sessions',
    'public.receptionist_configs',
    'public.phone_configs'
  ]
  loop
    execute format('select count(*) from %s', target_table_name::regclass) into target_row_count;
    if target_row_count <> 0 then
      raise exception 'partial-production fixture must stay empty: % has % rows', target_table_name, target_row_count;
    end if;
  end loop;
end;
$$;
SQL

  db_psql "$db_url" -f "$ROOT_DIR/supabase/migrations/20260711120000_receptionist_persistence.sql"

  db_psql "$db_url" <<'SQL'
do $$
begin
  if to_regprocedure('public.jsonb_text_array_is_subset(jsonb, text[])') is null then
    raise exception 'convergence did not restore jsonb_text_array_is_subset';
  end if;

  if to_regprocedure('public.onboarding_status_transition_is_allowed(text, text)') is null then
    raise exception 'convergence did not restore onboarding_status_transition_is_allowed';
  end if;

  if pg_get_functiondef('public.guard_onboarding_session_system_fields()'::regprocedure)
    not like '%onboarding_status_transition_is_allowed(old.status, new.status)%' then
    raise exception 'convergence did not restore explicit service-role lifecycle guard';
  end if;

  if has_column_privilege('authenticated', 'public.onboarding_sessions', 'status', 'UPDATE') then
    raise exception 'authenticated retained UPDATE(status) after convergence';
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.receptionist_configs'::regclass
      and conname in (
        'receptionist_configs_responsibilities_keys_check',
        'receptionist_configs_allowed_actions_keys_check',
        'receptionist_configs_prohibited_actions_keys_check'
      )
    group by conrelid
    having count(*) = 3
  ) then
    raise exception 'convergence did not restore all receptionist JSON key constraints';
  end if;
end;
$$;

select set_config('rp.owner', '00000000-0000-0000-0000-000000000301', false);
select set_config('rp.org', gen_random_uuid()::text, false);

insert into public.organizations (id, name, status, created_by)
values (current_setting('rp.org')::uuid, 'Receptionist Convergence Org', 'active', current_setting('rp.owner')::uuid);

insert into public.organization_members (organization_id, user_id, role, status)
values (current_setting('rp.org')::uuid, current_setting('rp.owner')::uuid, 'owner', 'active');

set role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', false);
select set_config('request.jwt.claim.sub', current_setting('rp.owner'), false);

insert into public.businesses (organization_id, name)
values (current_setting('rp.org')::uuid, 'Converged Business')
returning id \gset

select set_config('rp.business', :'id', false);

insert into public.onboarding_sessions (organization_id, business_id, status, current_step)
values (current_setting('rp.org')::uuid, current_setting('rp.business')::uuid, 'in_progress', 'company')
returning id \gset

select set_config('rp.session', :'id', false);

do $$
declare
  blocked boolean := false;
begin
  begin
    update public.onboarding_sessions
    set status = 'research_running'
    where id = current_setting('rp.session')::uuid;
  exception
    when insufficient_privilege or raise_exception then
      blocked := true;
  end;

  if not blocked then
    raise exception 'authenticated changed backend-controlled onboarding status after convergence';
  end if;
end;
$$;

reset role;
set role service_role;
select set_config('request.jwt.claim.role', 'service_role', false);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000302', false);

update public.onboarding_sessions
set status = 'research_queued'
where id = current_setting('rp.session')::uuid;

do $$
declare
  blocked boolean := false;
begin
  begin
    update public.onboarding_sessions
    set status = 'live'
    where id = current_setting('rp.session')::uuid;
  exception
    when raise_exception then
      blocked := true;
  end;

  if not blocked then
    raise exception 'service_role bypassed the explicit lifecycle transition allow-list';
  end if;
end;
$$;
SQL

  drop_disposable_database "$db_name"
}

assert_incompatible_constraint_fails_closed() {
  local db_name="rp_convergence_bad_constraint_${RUN_ID}"
  local db_url
  db_url="$(database_url_for "$db_name")"
  create_disposable_database "$db_name"

  bootstrap_supabase_test_environment "$db_url"
  install_phase0_and_receptionist "$db_url"

  db_psql "$db_url" <<'SQL'
alter table public.businesses drop constraint businesses_name_not_blank;
alter table public.businesses add constraint businesses_name_not_blank check (name is not null);
SQL

  if db_psql "$db_url" -f "$ROOT_DIR/supabase/migrations/20260711120000_receptionist_persistence.sql"; then
    echo "Expected incompatible constraint drift to fail closed, but migration succeeded." >&2
    exit 1
  fi

  db_psql "$db_url" <<'SQL'
do $$
declare
  normalized_definition text;
begin
  select regexp_replace(lower(pg_get_constraintdef(oid)), '\s+', ' ', 'g')
  into normalized_definition
  from pg_constraint
  where conrelid = 'public.businesses'::regclass
    and conname = 'businesses_name_not_blank';

  if normalized_definition !~ 'check .*name is not null' then
    raise exception 'failed migration did not roll back cleanly; found %', normalized_definition;
  end if;
end;
$$;
SQL

  drop_disposable_database "$db_name"
}

assert_non_empty_tables_fail_closed() {
  local db_name="rp_convergence_non_empty_${RUN_ID}"
  local db_url
  db_url="$(database_url_for "$db_name")"
  create_disposable_database "$db_name"

  bootstrap_supabase_test_environment "$db_url"
  install_phase0_and_receptionist "$db_url"

  db_psql "$db_url" <<'SQL'
insert into public.organizations (id, name, status, created_by)
values (
  '00000000-0000-0000-0000-000000000399',
  'Receptionist Non Empty Org',
  'active',
  '00000000-0000-0000-0000-000000000301'
);

insert into public.businesses (organization_id, name)
values ('00000000-0000-0000-0000-000000000399', 'Non Empty Business');
SQL

  if db_psql "$db_url" -f "$ROOT_DIR/supabase/migrations/20260711120000_receptionist_persistence.sql"; then
    echo "Expected non-empty receptionist table rerun to fail closed, but migration succeeded." >&2
    exit 1
  fi

  db_psql "$db_url" <<'SQL'
do $$
begin
  if (select count(*) from public.businesses) <> 1 then
    raise exception 'non-empty fail-closed case unexpectedly changed row count';
  end if;
end;
$$;
SQL

  drop_disposable_database "$db_name"
}

trap 'drop_disposable_database "rp_convergence_partial_${RUN_ID}"; drop_disposable_database "rp_convergence_bad_constraint_${RUN_ID}"; drop_disposable_database "rp_convergence_non_empty_${RUN_ID}"' EXIT

assert_partial_production_converges
assert_incompatible_constraint_fails_closed
assert_non_empty_tables_fail_closed

echo "receptionist convergence smoke tests passed"
