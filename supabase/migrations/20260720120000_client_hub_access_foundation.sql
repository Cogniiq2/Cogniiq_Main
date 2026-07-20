-- Managed client hub access foundation.
-- Additive only: depends on Phase 0 auth/tenancy and receptionist persistence.

alter type public.organization_role add value if not exists 'management';
alter type public.organization_role add value if not exists 'dispatcher';
alter type public.organization_role add value if not exists 'technician';
alter type public.organization_role add value if not exists 'warehouse';
alter type public.organization_role add value if not exists 'accounting';

create table if not exists public.service_entitlements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  product_key text not null,
  status text not null default 'pending_payment',
  starts_at timestamptz,
  ends_at timestamptz,
  activation_source text,
  external_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_entitlements_org_product_key unique (organization_id, product_key),
  constraint service_entitlements_product_key_check check (
    product_key in (
      'client_hub',
      'ai_receptionist',
      'pankofer_operations',
      'document_automation',
      'installation_management',
      'inventory_management'
    )
  ),
  constraint service_entitlements_status_check check (
    status in ('pending_payment', 'provisioning', 'active', 'past_due', 'suspended', 'cancelled')
  ),
  constraint service_entitlements_time_window_check check (
    ends_at is null
    or starts_at is null
    or ends_at >= starts_at
  )
);

create table if not exists public.organization_member_permissions (
  organization_id uuid not null,
  user_id uuid not null,
  permission_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, user_id, permission_key),
  constraint organization_member_permissions_member_fk foreign key (organization_id, user_id)
    references public.organization_members(organization_id, user_id)
    on delete cascade,
  constraint organization_member_permissions_key_check check (
    permission_key in (
      'client_hub.view',
      'systems.view',
      'activity.view',
      'documents.view',
      'change_requests.view',
      'change_requests.create',
      'support.view',
      'team_security.view',
      'billing.view',
      'onboarding.edit',
      'ai_receptionist.view',
      'operations.dispatch',
      'operations.technician',
      'operations.warehouse',
      'operations.accounting'
    )
  )
);

create table if not exists public.change_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  requested_by uuid not null references public.profiles(id) on delete restrict,
  category text not null,
  subject text not null,
  description text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint change_requests_category_not_blank check (length(trim(category)) > 0),
  constraint change_requests_subject_not_blank check (length(trim(subject)) > 0),
  constraint change_requests_description_not_blank check (length(trim(description)) > 0),
  constraint change_requests_status_check check (
    status in ('open', 'in_review', 'planned', 'completed', 'declined', 'cancelled')
  )
);

comment on table public.service_entitlements is
  'Provisioned product access per organization. Customers may read their own rows, but cannot create or update entitlements.';
comment on table public.organization_member_permissions is
  'Optional per-member permission grants layered on top of organization role defaults.';
comment on table public.change_requests is
  'Customer-created managed-service change requests. Status is controlled by platform admins or trusted backend code.';

create index if not exists service_entitlements_organization_id_idx
  on public.service_entitlements(organization_id);
create index if not exists service_entitlements_active_lookup_idx
  on public.service_entitlements(organization_id, product_key, status);
create index if not exists organization_member_permissions_user_idx
  on public.organization_member_permissions(user_id);
create index if not exists change_requests_organization_id_idx
  on public.change_requests(organization_id);
create index if not exists change_requests_requested_by_idx
  on public.change_requests(requested_by);
create index if not exists change_requests_status_idx
  on public.change_requests(status);

drop trigger if exists service_entitlements_set_customer_product_timestamps on public.service_entitlements;
create trigger service_entitlements_set_customer_product_timestamps
before insert or update on public.service_entitlements
for each row execute function public.set_customer_product_timestamps();

drop trigger if exists organization_member_permissions_set_customer_product_timestamps on public.organization_member_permissions;
create trigger organization_member_permissions_set_customer_product_timestamps
before insert or update on public.organization_member_permissions
for each row execute function public.set_customer_product_timestamps();

drop trigger if exists change_requests_set_customer_product_timestamps on public.change_requests;
create trigger change_requests_set_customer_product_timestamps
before insert or update on public.change_requests
for each row execute function public.set_customer_product_timestamps();

create or replace function public.current_authentication_assurance_level()
returns text
language sql
stable
set search_path = public
as $$
  select coalesce(nullif(current_setting('request.jwt.claim.aal', true), ''), 'aal1');
$$;

create or replace function public.request_has_aal2()
returns boolean
language sql
stable
set search_path = public
as $$
  select public.is_database_admin()
    or public.request_is_service_role()
    or public.current_authentication_assurance_level() = 'aal2';
$$;

create or replace function public.has_active_account()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_database_admin()
    or public.request_is_service_role()
    or coalesce(
      exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
      ),
      false
    );
$$;

create or replace function public.has_active_organization_membership(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_database_admin()
    or public.request_is_service_role()
    or coalesce(
      exists (
        select 1
        from public.organization_members om
        join public.organizations o on o.id = om.organization_id
        where om.organization_id = target_organization_id
          and om.user_id = auth.uid()
          and om.status = 'active'
          and o.status = 'active'
      ),
      false
    );
$$;

create or replace function public.has_active_service_entitlement(target_organization_id uuid, requested_product_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_database_admin()
    or public.request_is_service_role()
    or coalesce(
      exists (
        select 1
        from public.service_entitlements se
        where se.organization_id = target_organization_id
          and se.product_key = requested_product_key
          and se.status = 'active'
          and (se.starts_at is null or se.starts_at <= now())
          and (se.ends_at is null or se.ends_at > now())
      ),
      false
    );
$$;

create or replace function public.has_organization_permission(target_organization_id uuid, requested_permission text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_database_admin()
    or public.request_is_service_role()
    or public.is_platform_admin()
    or coalesce(
      exists (
        select 1
        from public.organization_members om
        where om.organization_id = target_organization_id
          and om.user_id = auth.uid()
          and om.status = 'active'
          and (
            om.role::text in ('owner', 'admin')
            or (
              requested_permission in (
                'client_hub.view',
                'systems.view',
                'activity.view',
                'documents.view',
                'change_requests.view',
                'support.view'
              )
              and om.role::text in ('management', 'dispatcher', 'technician', 'warehouse', 'accounting', 'viewer', 'member')
            )
            or (
              requested_permission in ('change_requests.create', 'onboarding.edit', 'ai_receptionist.view')
              and om.role::text in ('management', 'dispatcher', 'member')
            )
            or (
              requested_permission = 'team_security.view'
              and om.role::text in ('management')
            )
            or (
              requested_permission = 'billing.view'
              and om.role::text in ('management', 'accounting')
            )
            or (
              requested_permission = 'operations.dispatch'
              and om.role::text in ('management', 'dispatcher')
            )
            or (
              requested_permission = 'operations.technician'
              and om.role::text in ('management', 'technician')
            )
            or (
              requested_permission = 'operations.warehouse'
              and om.role::text in ('management', 'warehouse')
            )
            or (
              requested_permission = 'operations.accounting'
              and om.role::text in ('management', 'accounting')
            )
            or exists (
              select 1
              from public.organization_member_permissions omp
              where omp.organization_id = target_organization_id
                and omp.user_id = auth.uid()
                and omp.permission_key = requested_permission
            )
          )
      ),
      false
    );
$$;

create or replace function public.has_client_hub_access(target_organization_id uuid, requested_permission text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_database_admin()
    or public.request_is_service_role()
    or public.is_platform_admin()
    or (
      public.has_active_account()
      and public.has_active_organization_membership(target_organization_id)
      and public.has_active_service_entitlement(target_organization_id, 'client_hub')
      and public.has_organization_permission(target_organization_id, requested_permission)
    );
$$;

create or replace function public.has_sensitive_client_hub_access(target_organization_id uuid, requested_permission text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.request_has_aal2()
    and public.has_client_hub_access(target_organization_id, requested_permission);
$$;

create or replace function public.guard_change_request_write()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if public.is_database_admin() or public.request_is_service_role() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if auth.uid() is null then
      raise exception 'Authentication required for change requests';
    end if;

    if new.requested_by is null then
      new.requested_by := auth.uid();
    end if;

    if new.requested_by is distinct from auth.uid() then
      raise exception 'change request requester is server-controlled';
    end if;

    if new.status is distinct from 'open' then
      raise exception 'change request status is controlled by Cogniiq';
    end if;

    return new;
  end if;

  if public.is_platform_admin() and public.request_has_aal2() then
    if new.organization_id is distinct from old.organization_id
      or new.requested_by is distinct from old.requested_by
      or new.id is distinct from old.id
      or new.category is distinct from old.category
      or new.subject is distinct from old.subject
      or new.description is distinct from old.description
      or new.created_at is distinct from old.created_at then
      raise exception 'platform admins may update only change request status';
    end if;

    return new;
  end if;

  raise exception 'change requests cannot be updated by customer browsers';
end;
$$;

drop trigger if exists change_requests_guard_write on public.change_requests;
create trigger change_requests_guard_write
before insert or update on public.change_requests
for each row execute function public.guard_change_request_write();

alter table public.service_entitlements enable row level security;
alter table public.organization_member_permissions enable row level security;
alter table public.change_requests enable row level security;

drop policy if exists "service_entitlements_select_active_members" on public.service_entitlements;
drop policy if exists "service_entitlements_manage_platform_admins" on public.service_entitlements;
create policy "service_entitlements_select_active_members"
  on public.service_entitlements for select to authenticated
  using (
    (public.is_platform_admin() and public.request_has_aal2())
    or (
      public.has_active_account()
      and public.has_active_organization_membership(organization_id)
    )
  );
create policy "service_entitlements_manage_platform_admins"
  on public.service_entitlements for all to authenticated
  using (public.is_platform_admin() and public.request_has_aal2())
  with check (public.is_platform_admin() and public.request_has_aal2());

drop policy if exists "organization_member_permissions_select_role_allowed" on public.organization_member_permissions;
drop policy if exists "organization_member_permissions_manage_platform_admins" on public.organization_member_permissions;
create policy "organization_member_permissions_select_role_allowed"
  on public.organization_member_permissions for select to authenticated
  using (
    (public.is_platform_admin() and public.request_has_aal2())
    or public.has_sensitive_client_hub_access(organization_id, 'team_security.view')
  );
create policy "organization_member_permissions_manage_platform_admins"
  on public.organization_member_permissions for all to authenticated
  using (public.is_platform_admin() and public.request_has_aal2())
  with check (public.is_platform_admin() and public.request_has_aal2());

drop policy if exists "change_requests_select_role_allowed" on public.change_requests;
drop policy if exists "change_requests_insert_entitled_members" on public.change_requests;
drop policy if exists "change_requests_update_platform_admins" on public.change_requests;
create policy "change_requests_select_role_allowed"
  on public.change_requests for select to authenticated
  using (
    (public.is_platform_admin() and public.request_has_aal2())
    or public.has_sensitive_client_hub_access(organization_id, 'change_requests.view')
  );
create policy "change_requests_insert_entitled_members"
  on public.change_requests for insert to authenticated
  with check (public.has_sensitive_client_hub_access(organization_id, 'change_requests.create'));
create policy "change_requests_update_platform_admins"
  on public.change_requests for update to authenticated
  using (public.is_platform_admin() and public.request_has_aal2())
  with check (public.is_platform_admin() and public.request_has_aal2());

drop policy if exists "businesses_select_org_or_platform_admin" on public.businesses;
drop policy if exists "businesses_insert_owner_admin_or_platform_admin" on public.businesses;
drop policy if exists "businesses_update_owner_admin_or_platform_admin" on public.businesses;
create policy "businesses_select_client_hub_sensitive"
  on public.businesses for select to authenticated
  using (public.has_sensitive_client_hub_access(organization_id, 'systems.view'));
create policy "businesses_insert_onboarding_editors"
  on public.businesses for insert to authenticated
  with check (public.has_sensitive_client_hub_access(organization_id, 'onboarding.edit'));
create policy "businesses_update_onboarding_editors"
  on public.businesses for update to authenticated
  using (public.has_sensitive_client_hub_access(organization_id, 'onboarding.edit'))
  with check (public.has_sensitive_client_hub_access(organization_id, 'onboarding.edit'));

drop policy if exists "onboarding_sessions_select_org_or_platform_admin" on public.onboarding_sessions;
drop policy if exists "onboarding_sessions_insert_owner_admin_or_platform_admin" on public.onboarding_sessions;
drop policy if exists "onboarding_sessions_update_owner_admin_or_platform_admin" on public.onboarding_sessions;
create policy "onboarding_sessions_select_client_hub_sensitive"
  on public.onboarding_sessions for select to authenticated
  using (public.has_sensitive_client_hub_access(organization_id, 'systems.view'));
create policy "onboarding_sessions_insert_onboarding_editors"
  on public.onboarding_sessions for insert to authenticated
  with check (public.has_sensitive_client_hub_access(organization_id, 'onboarding.edit'));
create policy "onboarding_sessions_update_onboarding_editors"
  on public.onboarding_sessions for update to authenticated
  using (public.has_sensitive_client_hub_access(organization_id, 'onboarding.edit'))
  with check (public.has_sensitive_client_hub_access(organization_id, 'onboarding.edit'));

drop policy if exists "receptionist_configs_select_org_or_platform_admin" on public.receptionist_configs;
drop policy if exists "receptionist_configs_insert_owner_admin_or_platform_admin" on public.receptionist_configs;
drop policy if exists "receptionist_configs_update_owner_admin_or_platform_admin" on public.receptionist_configs;
create policy "receptionist_configs_select_client_hub_sensitive"
  on public.receptionist_configs for select to authenticated
  using (
    (public.is_platform_admin() and public.request_has_aal2())
    or (
      public.has_sensitive_client_hub_access(organization_id, 'ai_receptionist.view')
      and public.has_active_service_entitlement(organization_id, 'ai_receptionist')
    )
  );
create policy "receptionist_configs_insert_platform_admins"
  on public.receptionist_configs for insert to authenticated
  with check (public.is_platform_admin() and public.request_has_aal2());
create policy "receptionist_configs_update_platform_admins"
  on public.receptionist_configs for update to authenticated
  using (public.is_platform_admin() and public.request_has_aal2())
  with check (public.is_platform_admin() and public.request_has_aal2());

drop policy if exists "phone_configs_select_org_or_platform_admin" on public.phone_configs;
drop policy if exists "phone_configs_insert_owner_admin_or_platform_admin" on public.phone_configs;
drop policy if exists "phone_configs_update_owner_admin_or_platform_admin" on public.phone_configs;
create policy "phone_configs_select_client_hub_sensitive"
  on public.phone_configs for select to authenticated
  using (
    (public.is_platform_admin() and public.request_has_aal2())
    or (
      public.has_sensitive_client_hub_access(organization_id, 'ai_receptionist.view')
      and public.has_active_service_entitlement(organization_id, 'ai_receptionist')
    )
  );
create policy "phone_configs_insert_platform_admins"
  on public.phone_configs for insert to authenticated
  with check (public.is_platform_admin() and public.request_has_aal2());
create policy "phone_configs_update_platform_admins"
  on public.phone_configs for update to authenticated
  using (public.is_platform_admin() and public.request_has_aal2())
  with check (public.is_platform_admin() and public.request_has_aal2());

revoke all on table public.service_entitlements from public, anon, authenticated;
revoke all on table public.organization_member_permissions from public, anon, authenticated;
revoke all on table public.change_requests from public, anon, authenticated;

grant select, insert, update, delete on table public.service_entitlements to authenticated;
grant select, insert, update, delete on table public.organization_member_permissions to authenticated;
grant select on table public.change_requests to authenticated;
grant insert (organization_id, category, subject, description) on table public.change_requests to authenticated;
grant update (status) on table public.change_requests to authenticated;

grant select, insert, update, delete on table public.service_entitlements to service_role;
grant select, insert, update, delete on table public.organization_member_permissions to service_role;
grant select, insert, update, delete on table public.change_requests to service_role;

revoke execute on function public.current_authentication_assurance_level() from public, anon;
revoke execute on function public.request_has_aal2() from public, anon;
revoke execute on function public.has_active_account() from public, anon;
revoke execute on function public.has_active_organization_membership(uuid) from public, anon;
revoke execute on function public.has_active_service_entitlement(uuid, text) from public, anon;
revoke execute on function public.has_organization_permission(uuid, text) from public, anon;
revoke execute on function public.has_client_hub_access(uuid, text) from public, anon;
revoke execute on function public.has_sensitive_client_hub_access(uuid, text) from public, anon;
revoke execute on function public.guard_change_request_write() from public, anon, authenticated;

grant execute on function public.current_authentication_assurance_level() to authenticated, service_role;
grant execute on function public.request_has_aal2() to authenticated, service_role;
grant execute on function public.has_active_account() to authenticated, service_role;
grant execute on function public.has_active_organization_membership(uuid) to authenticated, service_role;
grant execute on function public.has_active_service_entitlement(uuid, text) to authenticated, service_role;
grant execute on function public.has_organization_permission(uuid, text) to authenticated, service_role;
grant execute on function public.has_client_hub_access(uuid, text) to authenticated, service_role;
grant execute on function public.has_sensitive_client_hub_access(uuid, text) to authenticated, service_role;
grant execute on function public.guard_change_request_write() to service_role;
