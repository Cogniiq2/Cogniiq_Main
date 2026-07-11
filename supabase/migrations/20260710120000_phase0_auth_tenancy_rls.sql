create extension if not exists pgcrypto;

do $$
begin
  create type public.platform_role as enum ('customer', 'cogniiq_admin', 'cogniiq_owner');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.organization_status as enum ('pending', 'active', 'suspended', 'cancelled');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.organization_role as enum ('owner', 'admin', 'member', 'viewer');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.membership_status as enum ('invited', 'active', 'suspended');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  phone text,
  platform_role public.platform_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text,
  status public.organization_status not null default 'pending',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.organization_role not null default 'member',
  status public.membership_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_members_org_user_key unique (organization_id, user_id)
);

create index if not exists profiles_platform_role_idx on public.profiles(platform_role);
create index if not exists organizations_created_by_idx on public.organizations(created_by);
create index if not exists organizations_status_idx on public.organizations(status);
create unique index if not exists organizations_slug_idx on public.organizations(slug) where slug is not null;
create index if not exists organization_members_user_idx on public.organization_members(user_id);
create index if not exists organization_members_org_idx on public.organization_members(organization_id);
create index if not exists organization_members_role_status_idx on public.organization_members(organization_id, role, status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists organizations_set_updated_at on public.organizations;
create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

drop trigger if exists organization_members_set_updated_at on public.organization_members;
create trigger organization_members_set_updated_at
before update on public.organization_members
for each row execute function public.set_updated_at();

create or replace function public.is_database_admin()
returns boolean
language sql
stable
set search_path = public
as $$
  select current_user in ('postgres', 'supabase_admin');
$$;

comment on function public.is_database_admin() is
  'Allows direct Supabase SQL editor/database-owner maintenance without granting browser users any additional access.';

create or replace function public.request_is_service_role()
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), '') = 'service_role';
$$;

comment on function public.request_is_service_role() is
  'Detects Supabase service-role requests. Service role bypasses RLS, but triggers may still need to avoid blocking trusted backend automation.';

create or replace function public.is_platform_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.platform_role = 'cogniiq_owner'
    ),
    false
  );
$$;

comment on function public.is_platform_owner() is
  'RLS helper. Uses database-owned profiles.platform_role, never user-editable JWT metadata.';

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.platform_role in ('cogniiq_admin', 'cogniiq_owner')
    ),
    false
  );
$$;

comment on function public.is_platform_admin() is
  'RLS helper for Cogniiq internal access. Uses profiles.platform_role and does not trust frontend-provided role values.';

create or replace function public.is_organization_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    exists (
      select 1
      from public.organization_members om
      where om.organization_id = target_organization_id
        and om.user_id = auth.uid()
        and om.status = 'active'
    ),
    false
  );
$$;

comment on function public.is_organization_member(uuid) is
  'RLS helper. SECURITY DEFINER avoids recursive organization_members policies while still using auth.uid().';

create or replace function public.has_organization_role(
  target_organization_id uuid,
  allowed_roles public.organization_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    exists (
      select 1
      from public.organization_members om
      where om.organization_id = target_organization_id
        and om.user_id = auth.uid()
        and om.status = 'active'
        and om.role = any(allowed_roles)
    ),
    false
  );
$$;

comment on function public.has_organization_role(uuid, public.organization_role[]) is
  'RLS helper for tenant role checks. Uses stored membership rows, not client-side state.';

create or replace function public.current_user_organization_ids()
returns uuid[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    array_agg(om.organization_id order by om.created_at),
    array[]::uuid[]
  )
  from public.organization_members om
  where om.user_id = auth.uid()
    and om.status = 'active';
$$;

comment on function public.current_user_organization_ids() is
  'Returns active organization ids for auth.uid(); intended for RLS and app bootstrap queries.';

create or replace function public.handle_new_auth_user()
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
        avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
        updated_at = now();

  return new;
end;
$$;

comment on function public.handle_new_auth_user() is
  'Auth provisioning trigger. Creates exactly one customer profile and never trusts metadata for platform_role.';

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_auth_user();

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
begin
  if public.is_database_admin() or public.request_is_service_role() then
    return coalesce(new, old);
  end if;

  if acting_user is null then
    raise exception 'Authentication required for organization membership changes';
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

  if new.organization_id is distinct from target_org then
    raise exception 'Membership organization cannot be changed';
  end if;

  if tg_op = 'UPDATE' and old.user_id = acting_user and (new.role is distinct from old.role or new.status is distinct from old.status) then
    raise exception 'Users cannot change their own membership role or status';
  end if;

  if tg_op = 'UPDATE' and new.user_id is distinct from old.user_id then
    raise exception 'Membership user cannot be changed';
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

comment on function public.guard_organization_membership_change() is
  'Prevents organization membership forgery, self-promotion, and unauthorized owner changes beyond RLS checks.';

drop trigger if exists organization_members_guard_write on public.organization_members;
create trigger organization_members_guard_write
before insert or update or delete on public.organization_members
for each row execute function public.guard_organization_membership_change();

create or replace function public.create_organization_for_user(target_user_id uuid, organization_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
begin
  if not public.is_platform_admin() then
    raise exception 'Only Cogniiq platform admins may provision organizations';
  end if;

  if target_user_id is null or organization_name is null or length(trim(organization_name)) = 0 then
    raise exception 'target_user_id and organization_name are required';
  end if;

  insert into public.organizations (name, status, created_by)
  values (trim(organization_name), 'pending', auth.uid())
  returning id into new_org_id;

  insert into public.organization_members (organization_id, user_id, role, status)
  values (new_org_id, target_user_id, 'owner', 'active');

  return new_org_id;
end;
$$;

comment on function public.create_organization_for_user(uuid, text) is
  'Admin-only provisioning helper for development/operations until Stripe-backed organization creation exists.';

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

drop policy if exists "profiles_select_self_or_platform_admin" on public.profiles;
drop policy if exists "profiles_update_self_allowed_columns" on public.profiles;
create policy "profiles_select_self_or_platform_admin"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_platform_admin());
create policy "profiles_update_self_allowed_columns"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "organizations_select_member_or_platform_admin" on public.organizations;
drop policy if exists "organizations_update_owner_admin_or_platform_admin" on public.organizations;
create policy "organizations_select_member_or_platform_admin"
  on public.organizations for select to authenticated
  using (public.is_platform_admin() or public.is_organization_member(id));
create policy "organizations_update_owner_admin_or_platform_admin"
  on public.organizations for update to authenticated
  using (
    public.is_platform_admin()
    or public.has_organization_role(id, array['owner'::public.organization_role, 'admin'::public.organization_role])
  )
  with check (
    public.is_platform_admin()
    or public.has_organization_role(id, array['owner'::public.organization_role, 'admin'::public.organization_role])
  );

drop policy if exists "organization_members_select_same_org_or_platform_admin" on public.organization_members;
drop policy if exists "organization_members_insert_admins" on public.organization_members;
drop policy if exists "organization_members_update_admins" on public.organization_members;
drop policy if exists "organization_members_delete_admins" on public.organization_members;
create policy "organization_members_select_same_org_or_platform_admin"
  on public.organization_members for select to authenticated
  using (public.is_platform_admin() or public.is_organization_member(organization_id));
create policy "organization_members_insert_admins"
  on public.organization_members for insert to authenticated
  with check (
    public.is_platform_admin()
    or public.has_organization_role(organization_id, array['owner'::public.organization_role, 'admin'::public.organization_role])
  );
create policy "organization_members_update_admins"
  on public.organization_members for update to authenticated
  using (
    public.is_platform_admin()
    or public.has_organization_role(organization_id, array['owner'::public.organization_role, 'admin'::public.organization_role])
  )
  with check (
    public.is_platform_admin()
    or public.has_organization_role(organization_id, array['owner'::public.organization_role, 'admin'::public.organization_role])
  );
create policy "organization_members_delete_admins"
  on public.organization_members for delete to authenticated
  using (
    public.is_platform_admin()
    or public.has_organization_role(organization_id, array['owner'::public.organization_role, 'admin'::public.organization_role])
  );

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.organizations from anon, authenticated;
revoke all on table public.organization_members from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (full_name, avatar_url, phone, updated_at) on table public.profiles to authenticated;
grant select on table public.organizations to authenticated;
grant update (name, slug, updated_at) on table public.organizations to authenticated;
grant select, insert, update, delete on table public.organization_members to authenticated;
grant execute on function public.create_organization_for_user(uuid, text) to authenticated;

comment on table public.profiles is 'One profile per Supabase Auth user. platform_role is database-owned and never frontend-writable.';
comment on table public.organizations is 'Tenant root for future AI receptionist product data. Slug is display/routing metadata, not a security boundary.';
comment on table public.organization_members is 'Membership and tenant role assignments. Protected by RLS plus guard trigger against self-promotion.';
