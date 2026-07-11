-- Phase 0 partial-state inspection.
-- Safe to run in the Supabase SQL editor before rerunning Phase 0.
-- It only reads catalogs/core tables and writes temporary session-local rows.

with expected_classes(schema_name, object_name, object_kind) as (
  values
    ('public', 'profiles', 'table'),
    ('public', 'organizations', 'table'),
    ('public', 'organization_members', 'table'),
    ('auth', 'users', 'table')
),
expected_types(schema_name, object_name) as (
  values
    ('public', 'platform_role'),
    ('public', 'organization_status'),
    ('public', 'organization_role'),
    ('public', 'membership_status')
),
expected_functions(schema_name, object_name) as (
  values
    ('public', 'set_updated_at'),
    ('public', 'is_database_admin'),
    ('public', 'request_is_service_role'),
    ('public', 'is_platform_owner'),
    ('public', 'is_platform_admin'),
    ('public', 'is_organization_member'),
    ('public', 'has_organization_role'),
    ('public', 'current_user_organization_ids'),
    ('public', 'handle_new_auth_user'),
    ('public', 'sync_auth_user_profile'),
    ('public', 'guard_profile_protected_columns'),
    ('public', 'guard_profile_delete'),
    ('public', 'guard_organization_protected_columns'),
    ('public', 'guard_organization_membership_change'),
    ('public', 'create_organization_for_user')
),
expected_triggers(schema_name, table_name, trigger_name) as (
  values
    ('public', 'profiles', 'profiles_set_updated_at'),
    ('public', 'profiles', 'profiles_guard_protected_columns'),
    ('public', 'profiles', 'profiles_guard_delete'),
    ('public', 'organizations', 'organizations_set_updated_at'),
    ('public', 'organizations', 'organizations_guard_protected_columns'),
    ('public', 'organization_members', 'organization_members_set_updated_at'),
    ('public', 'organization_members', 'organization_members_guard_write'),
    ('auth', 'users', 'on_auth_user_profile_sync')
),
class_status as (
  select
    'class' as object_group,
    ec.schema_name,
    ec.object_name,
    ec.object_kind,
    (to_regclass(format('%I.%I', ec.schema_name, ec.object_name)) is not null) as exists
  from expected_classes ec
),
type_status as (
  select
    'type' as object_group,
    et.schema_name,
    et.object_name,
    'type' as object_kind,
    exists (
      select 1
      from pg_type t
      join pg_namespace n on n.oid = t.typnamespace
      where n.nspname = et.schema_name
        and t.typname = et.object_name
    ) as exists
  from expected_types et
),
function_status as (
  select
    'function' as object_group,
    ef.schema_name,
    ef.object_name,
    'function' as object_kind,
    exists (
      select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = ef.schema_name
        and p.proname = ef.object_name
    ) as exists
  from expected_functions ef
),
trigger_status as (
  select
    'trigger' as object_group,
    et.schema_name,
    et.table_name || '.' || et.trigger_name as object_name,
    'trigger' as object_kind,
    exists (
      select 1
      from pg_trigger tr
      join pg_class c on c.oid = tr.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = et.schema_name
        and c.relname = et.table_name
        and tr.tgname = et.trigger_name
        and not tr.tgisinternal
    ) as exists
  from expected_triggers et
)
select *
from class_status
union all
select *
from type_status
union all
select *
from function_status
union all
select *
from trigger_status
order by object_group, schema_name, object_name;

create temporary table if not exists phase0_relation_counts (
  relation_name text primary key,
  relation_exists boolean not null,
  row_count bigint
) on commit drop;

truncate table phase0_relation_counts;

do $$
declare
  relation_name text;
  qualified_relation text;
  relation_count bigint;
begin
  foreach relation_name in array array['profiles', 'organizations', 'organization_members']
  loop
    qualified_relation := format('public.%I', relation_name);
    relation_count := null;

    if to_regclass(qualified_relation) is not null then
      execute format('select count(*) from %s', qualified_relation) into relation_count;
    end if;

    insert into phase0_relation_counts (relation_name, relation_exists, row_count)
    values (qualified_relation, to_regclass(qualified_relation) is not null, relation_count);
  end loop;
end $$;

select *
from phase0_relation_counts
order by relation_name;
