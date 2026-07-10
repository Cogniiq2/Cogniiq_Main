-- Phase 0.1 additive hardening.
-- Do not rewrite 20260710120000_phase0_auth_tenancy_rls.sql; it may already exist in an environment.

insert into public.profiles (id, email, full_name, avatar_url, platform_role)
select
  u.id,
  u.email,
  nullif(trim(coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name')), ''),
  nullif(trim(coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture')), ''),
  'customer'::public.platform_role
from auth.users u
where not exists (
  select 1
  from public.profiles p
  where p.id = u.id
);

create or replace function public.sync_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  user_full_name text;
  user_avatar_url text;
begin
  user_full_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')), '');
  user_avatar_url := nullif(trim(coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')), '');

  insert into public.profiles (id, email, full_name, avatar_url, platform_role)
  values (new.id, new.email, user_full_name, user_avatar_url, 'customer')
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name),
        avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url);

  return new;
end;
$$;

comment on function public.sync_auth_user_profile() is
  'Auth insert/update trigger. Backstops profile provisioning and email sync; never trusts user metadata for platform_role.';

drop trigger if exists on_auth_user_created_profile on auth.users;
drop trigger if exists on_auth_user_profile_sync on auth.users;
create trigger on_auth_user_profile_sync
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function public.sync_auth_user_profile();

create or replace function public.guard_profile_protected_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if public.is_database_admin() or public.request_is_service_role() then
    return new;
  end if;

  if auth.uid() is null or auth.uid() <> old.id then
    raise exception 'Users may update only their own profile';
  end if;

  if new.id is distinct from old.id
    or new.email is distinct from old.email
    or new.platform_role is distinct from old.platform_role
    or new.created_at is distinct from old.created_at
    or new.updated_at is distinct from old.updated_at then
    raise exception 'Protected profile fields cannot be updated from the client';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_protected_columns on public.profiles;
create trigger profiles_guard_protected_columns
before update on public.profiles
for each row execute function public.guard_profile_protected_columns();

create or replace function public.guard_profile_delete()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.platform_role = 'cogniiq_owner'
    and not exists (
      select 1
      from public.profiles p
      where p.id <> old.id
        and p.platform_role = 'cogniiq_owner'
    ) then
    raise exception 'Cannot delete the final Cogniiq platform owner profile';
  end if;

  if exists (
    select 1
    from public.organization_members owned
    where owned.user_id = old.id
      and owned.role = 'owner'
      and owned.status = 'active'
      and not exists (
        select 1
        from public.organization_members other_owner
        where other_owner.organization_id = owned.organization_id
          and other_owner.user_id <> old.id
          and other_owner.role = 'owner'
          and other_owner.status = 'active'
      )
  ) then
    raise exception 'Cannot delete a profile that is the final active owner of an organization';
  end if;

  return old;
end;
$$;

drop trigger if exists profiles_guard_delete on public.profiles;
create trigger profiles_guard_delete
before delete on public.profiles
for each row execute function public.guard_profile_delete();

create or replace function public.guard_organization_protected_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if public.is_database_admin() or public.request_is_service_role() or public.is_platform_admin() then
    return new;
  end if;

  if new.id is distinct from old.id
    or new.status is distinct from old.status
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at
    or new.updated_at is distinct from old.updated_at then
    raise exception 'Protected organization fields cannot be updated from the client';
  end if;

  return new;
end;
$$;

drop trigger if exists organizations_guard_protected_columns on public.organizations;
create trigger organizations_guard_protected_columns
before update on public.organizations
for each row execute function public.guard_organization_protected_columns();

create or replace function public.guard_organization_membership_change()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  acting_user uuid := auth.uid();
  acting_is_admin boolean := public.is_platform_admin();
  acting_is_owner boolean;
  acting_is_org_admin boolean;
  target_org uuid := coalesce(new.organization_id, old.organization_id);
  active_owner_count integer;
begin
  if public.is_database_admin() or public.request_is_service_role() then
    return coalesce(new, old);
  end if;

  if acting_user is null then
    raise exception 'Authentication required for organization membership changes';
  end if;

  if tg_op = 'UPDATE' and (
    new.organization_id is distinct from old.organization_id
    or new.user_id is distinct from old.user_id
    or new.id is distinct from old.id
    or new.created_at is distinct from old.created_at
  ) then
    raise exception 'Membership identity fields cannot be changed';
  end if;

  if tg_op = 'DELETE' and old.role = 'owner' and old.status = 'active' then
    select count(*) into active_owner_count
    from public.organization_members om
    where om.organization_id = old.organization_id
      and om.role = 'owner'
      and om.status = 'active';

    if active_owner_count <= 1 then
      raise exception 'Cannot remove the final active organization owner';
    end if;
  end if;

  if tg_op = 'UPDATE'
    and old.role = 'owner'
    and old.status = 'active'
    and (new.role is distinct from old.role or new.status is distinct from old.status) then
    select count(*) into active_owner_count
    from public.organization_members om
    where om.organization_id = old.organization_id
      and om.role = 'owner'
      and om.status = 'active';

    if active_owner_count <= 1 then
      raise exception 'Cannot demote or suspend the final active organization owner';
    end if;
  end if;

  if acting_is_admin then
    return coalesce(new, old);
  end if;

  acting_is_owner := public.has_organization_role(target_org, array['owner'::public.organization_role]);
  acting_is_org_admin := public.has_organization_role(target_org, array['owner'::public.organization_role, 'admin'::public.organization_role]);

  if not acting_is_org_admin then
    raise exception 'Only organization admins may manage memberships';
  end if;

  if tg_op = 'DELETE' then
    if old.user_id = acting_user then
      raise exception 'Users cannot remove their own organization membership';
    end if;
    if old.role = 'owner' and not acting_is_owner then
      raise exception 'Only organization owners may remove owner memberships';
    end if;
    return old;
  end if;

  if tg_op = 'UPDATE' and old.user_id = acting_user and (new.role is distinct from old.role or new.status is distinct from old.status) then
    raise exception 'Users cannot change their own membership role or status';
  end if;

  if new.role = 'owner' and not acting_is_owner then
    raise exception 'Only organization owners may assign owner memberships';
  end if;

  if tg_op = 'UPDATE' and old.role = 'owner' and not acting_is_owner then
    raise exception 'Only organization owners may modify owner memberships';
  end if;

  return new;
end;
$$;

create or replace function public.create_organization_for_user(target_user_id uuid, organization_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
begin
  if not (public.is_database_admin() or public.request_is_service_role()) then
    raise exception 'Organization provisioning must run from a trusted backend or database maintenance session';
  end if;

  if target_user_id is null or organization_name is null or length(trim(organization_name)) = 0 then
    raise exception 'target_user_id and organization_name are required';
  end if;

  if not exists (select 1 from public.profiles p where p.id = target_user_id) then
    raise exception 'Target user profile does not exist';
  end if;

  insert into public.organizations (name, status, created_by)
  values (trim(organization_name), 'pending', target_user_id)
  returning id into new_org_id;

  insert into public.organization_members (organization_id, user_id, role, status)
  values (new_org_id, target_user_id, 'owner', 'active');

  return new_org_id;
end;
$$;

comment on function public.create_organization_for_user(uuid, text) is
  'Trusted provisioning helper for future backend flows only. Not exposed as a customer-callable RPC.';

revoke all on table public.profiles from public, anon, authenticated;
revoke all on table public.organizations from public, anon, authenticated;
revoke all on table public.organization_members from public, anon, authenticated;

grant select on table public.profiles to authenticated;
grant update (full_name, avatar_url, phone) on table public.profiles to authenticated;
grant select on table public.organizations to authenticated;
grant update (name, slug) on table public.organizations to authenticated;
grant select, insert, delete on table public.organization_members to authenticated;
grant update (role, status) on table public.organization_members to authenticated;

revoke execute on function public.create_organization_for_user(uuid, text) from public, anon, authenticated;
grant execute on function public.create_organization_for_user(uuid, text) to service_role;

revoke execute on function public.sync_auth_user_profile() from public, anon, authenticated;
revoke execute on function public.guard_profile_protected_columns() from public, anon, authenticated;
revoke execute on function public.guard_profile_delete() from public, anon, authenticated;
revoke execute on function public.guard_organization_protected_columns() from public, anon, authenticated;
revoke execute on function public.guard_organization_membership_change() from public, anon, authenticated;
revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

grant execute on function public.sync_auth_user_profile() to service_role;
grant execute on function public.guard_profile_protected_columns() to service_role;
grant execute on function public.guard_profile_delete() to service_role;
grant execute on function public.guard_organization_protected_columns() to service_role;
grant execute on function public.guard_organization_membership_change() to service_role;
grant execute on function public.set_updated_at() to service_role;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    execute 'grant execute on function public.sync_auth_user_profile() to supabase_auth_admin';
    execute 'grant execute on function public.guard_profile_protected_columns() to supabase_auth_admin';
    execute 'grant execute on function public.guard_profile_delete() to supabase_auth_admin';
    execute 'grant execute on function public.set_updated_at() to supabase_auth_admin';
  end if;
end $$;

revoke execute on function public.is_database_admin() from public, anon;
revoke execute on function public.request_is_service_role() from public, anon;
revoke execute on function public.is_platform_owner() from public, anon;
revoke execute on function public.is_platform_admin() from public, anon;
revoke execute on function public.is_organization_member(uuid) from public, anon;
revoke execute on function public.has_organization_role(uuid, public.organization_role[]) from public, anon;
revoke execute on function public.current_user_organization_ids() from public, anon;

grant execute on function public.is_database_admin() to authenticated;
grant execute on function public.request_is_service_role() to authenticated;
grant execute on function public.is_platform_owner() to authenticated;
grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.is_organization_member(uuid) to authenticated;
grant execute on function public.has_organization_role(uuid, public.organization_role[]) to authenticated;
grant execute on function public.current_user_organization_ids() to authenticated;

grant execute on function public.is_database_admin() to service_role;
grant execute on function public.request_is_service_role() to service_role;
grant execute on function public.is_platform_owner() to service_role;
grant execute on function public.is_platform_admin() to service_role;
grant execute on function public.is_organization_member(uuid) to service_role;
grant execute on function public.has_organization_role(uuid, public.organization_role[]) to service_role;
grant execute on function public.current_user_organization_ids() to service_role;

revoke execute on function public.generate_daily_execution_plan(date) from public, anon;
grant execute on function public.generate_daily_execution_plan(date) to authenticated;
