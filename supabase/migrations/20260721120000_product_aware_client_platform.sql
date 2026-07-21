-- Product-aware, multi-tenant client platform foundation.
-- Additive only. Depends on Phase 0 auth/tenancy/RLS and the receptionist persistence layer.
-- Introduces internal CRM (client_accounts, client_contacts, client_engagements, client_invitations),
-- a controlled solution catalog, customer-visible solution instances and portal settings,
-- plus the claim_my_client_invitations() and provision_client_workspace() RPCs.
--
-- Security model summary:
--   * Internal CRM tables are readable/writable only by database-backed platform admins
--     (profiles.platform_role in cogniiq_admin/cogniiq_owner). Budgets and commercial metadata
--     live only on these internal tables and are never granted or exposed to ordinary customers.
--   * organization_solutions and organization_portal_settings are readable by active members of the
--     owning organization; only platform admins may assign, update, pause or remove them.
--   * All money is stored as integer cents (bigint). No floating point currency.

begin;

do $$
begin
  if to_regclass('public.organizations') is null
    or to_regclass('public.organization_members') is null
    or to_regtype('public.organization_role') is null
    or to_regprocedure('public.is_platform_admin()') is null
    or to_regprocedure('public.is_organization_member(uuid)') is null
    or to_regprocedure('public.has_organization_role(uuid, public.organization_role[])') is null
    or to_regprocedure('public.set_updated_at()') is null then
    raise exception 'Client platform migration requires Phase 0 auth/tenancy foundations';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Controlled solution catalog
-- ---------------------------------------------------------------------------
create table if not exists public.solution_catalog (
  key text primary key,
  label text not null,
  description text,
  default_implementation_key text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint solution_catalog_key_format check (key ~ '^[a-z][a-z0-9_]+$'),
  constraint solution_catalog_label_not_blank check (length(trim(label)) > 0)
);

comment on table public.solution_catalog is
  'Controlled list of solution product types. Customer-visible when is_active. Mutated by platform admins only.';

insert into public.solution_catalog (key, label, description, default_implementation_key, sort_order)
values
  ('ai_receptionist', 'KI-Rezeptionist', 'KI-gestuetzter Telefon- und Empfangsassistent.', 'ai_receptionist', 10),
  ('automation_workspace', 'Automatisierungs-Workspace', 'Prozess- und Workflow-Automatisierung.', 'automation_workspace', 20),
  ('custom_client_portal', 'Individuelles Kundenportal', 'Massgeschneidertes Kundenportal.', 'unavailable', 30),
  ('website_management', 'Website-Management', 'Laufende Pflege und Betreuung der Website.', 'unavailable', 40)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Internal CRM: client_accounts
-- ---------------------------------------------------------------------------
create table if not exists public.client_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  legal_name text,
  display_name text not null,
  primary_contact_name text,
  primary_email text,
  phone text,
  website text,
  industry text,
  address text,
  lifecycle_status text not null default 'lead',
  lead_source text,
  internal_notes text,
  estimated_total_budget_cents bigint,
  estimated_monthly_value_cents bigint,
  internal_owner text,
  currency text not null default 'EUR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint client_accounts_organization_id_key unique (organization_id),
  constraint client_accounts_display_name_not_blank check (length(trim(display_name)) > 0),
  constraint client_accounts_lifecycle_status_check check (
    lifecycle_status in ('lead', 'qualified', 'active', 'paused', 'churned', 'archived')
  ),
  constraint client_accounts_primary_email_check check (
    primary_email is null or primary_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  ),
  constraint client_accounts_website_check check (
    website is null or website ~* '^https?://[^[:space:]]+\.[^[:space:]]+$'
  ),
  constraint client_accounts_currency_check check (currency ~ '^[A-Z]{3}$'),
  constraint client_accounts_total_budget_nonneg check (
    estimated_total_budget_cents is null or estimated_total_budget_cents >= 0
  ),
  constraint client_accounts_monthly_value_nonneg check (
    estimated_monthly_value_cents is null or estimated_monthly_value_cents >= 0
  )
);

comment on table public.client_accounts is
  'One internal CRM record per organization. Internal-only: budgets and commercial metadata never leave platform admins.';

-- ---------------------------------------------------------------------------
-- Internal CRM: client_contacts
-- ---------------------------------------------------------------------------
create table if not exists public.client_contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  title text,
  email text,
  phone text,
  is_primary boolean not null default false,
  should_invite boolean not null default false,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint client_contacts_name_not_blank check (length(trim(name)) > 0),
  constraint client_contacts_email_check check (
    email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  )
);

comment on table public.client_contacts is
  'Multiple contacts per organization. Internal-only CRM data.';

-- ---------------------------------------------------------------------------
-- Internal CRM: client_engagements
-- ---------------------------------------------------------------------------
create table if not exists public.client_engagements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  catalog_key text not null references public.solution_catalog(key),
  project_name text not null,
  status text not null default 'draft',
  total_budget_cents bigint,
  setup_fee_cents bigint,
  recurring_fee_cents bigint,
  currency text not null default 'EUR',
  start_date date,
  target_go_live_date date,
  internal_owner text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint client_engagements_project_name_not_blank check (length(trim(project_name)) > 0),
  constraint client_engagements_status_check check (
    status in ('draft', 'active', 'paused', 'completed', 'cancelled')
  ),
  constraint client_engagements_currency_check check (currency ~ '^[A-Z]{3}$'),
  constraint client_engagements_total_budget_nonneg check (total_budget_cents is null or total_budget_cents >= 0),
  constraint client_engagements_setup_fee_nonneg check (setup_fee_cents is null or setup_fee_cents >= 0),
  constraint client_engagements_recurring_fee_nonneg check (recurring_fee_cents is null or recurring_fee_cents >= 0),
  constraint client_engagements_metadata_object check (jsonb_typeof(metadata) = 'object')
);

comment on table public.client_engagements is
  'Internal project/contract record per solution engagement. Internal-only commercial data.';

-- ---------------------------------------------------------------------------
-- Customer-visible: organization_solutions
-- ---------------------------------------------------------------------------
create table if not exists public.organization_solutions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  engagement_id uuid references public.client_engagements(id) on delete set null,
  catalog_key text not null references public.solution_catalog(key),
  instance_key text not null,
  display_name text not null,
  implementation_key text not null,
  status text not null default 'active',
  nav_order integer not null default 0,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_solutions_instance_key_unique unique (instance_key),
  constraint organization_solutions_instance_key_format check (instance_key ~ '^[a-z0-9][a-z0-9_-]{2,}$'),
  constraint organization_solutions_display_name_not_blank check (length(trim(display_name)) > 0),
  constraint organization_solutions_status_check check (
    status in ('provisioning', 'active', 'paused', 'disabled')
  ),
  constraint organization_solutions_implementation_key_check check (
    implementation_key in ('ai_receptionist', 'automation_workspace', 'pankofer_operations', 'unavailable')
  ),
  constraint organization_solutions_config_object check (jsonb_typeof(config) = 'object')
);

comment on table public.organization_solutions is
  'Customer-visible solution instances. config is non-secret only. implementation_key selects a controlled frontend module, never a dynamic import path.';
comment on column public.organization_solutions.config is
  'Non-secret configuration only. Never store provider credentials, API keys or phone-provider secrets here.';

-- ---------------------------------------------------------------------------
-- Customer-visible: organization_portal_settings
-- ---------------------------------------------------------------------------
create table if not exists public.organization_portal_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  portal_title text,
  logo_url text,
  accent_color text,
  default_solution_id uuid references public.organization_solutions(id) on delete set null,
  support_contact text,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_portal_settings_accent_color_check check (
    accent_color is null or accent_color ~* '^#([0-9a-f]{6}|[0-9a-f]{3})$'
  ),
  constraint organization_portal_settings_logo_url_check check (
    logo_url is null or logo_url ~* '^https?://[^[:space:]]+$'
  ),
  constraint organization_portal_settings_config_object check (jsonb_typeof(config) = 'object')
);

comment on table public.organization_portal_settings is
  'Customer-visible portal presentation settings. Non-secret configuration only.';

-- ---------------------------------------------------------------------------
-- Internal CRM: client_invitations
-- ---------------------------------------------------------------------------
create table if not exists public.client_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  organization_role public.organization_role not null default 'owner',
  status text not null default 'pending',
  invited_by uuid references public.profiles(id) on delete set null,
  accepted_user_id uuid references public.profiles(id) on delete set null,
  expires_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint client_invitations_email_normalized check (email = lower(email) and length(trim(email)) > 0),
  constraint client_invitations_email_format check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint client_invitations_status_check check (
    status in ('pending', 'accepted', 'revoked', 'expired')
  )
);

create unique index if not exists client_invitations_pending_unique
  on public.client_invitations (organization_id, email)
  where status = 'pending';

comment on table public.client_invitations is
  'Internal invitation records. Only platform admins manage them. Claimed by users via claim_my_client_invitations().';

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists client_accounts_lifecycle_status_idx on public.client_accounts(lifecycle_status);
create index if not exists client_contacts_organization_id_idx on public.client_contacts(organization_id);
create index if not exists client_engagements_organization_id_idx on public.client_engagements(organization_id);
create index if not exists client_engagements_catalog_key_idx on public.client_engagements(catalog_key);
create index if not exists organization_solutions_organization_id_idx on public.organization_solutions(organization_id);
create index if not exists organization_solutions_catalog_key_idx on public.organization_solutions(catalog_key);
create index if not exists client_invitations_email_idx on public.client_invitations(email);
create index if not exists client_invitations_organization_id_idx on public.client_invitations(organization_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'solution_catalog', 'client_accounts', 'client_contacts', 'client_engagements',
    'organization_solutions', 'organization_portal_settings', 'client_invitations'
  ]
  loop
    execute format('drop trigger if exists %I on public.%I', t || '_set_updated_at', t);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      t || '_set_updated_at', t
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.solution_catalog enable row level security;
alter table public.client_accounts enable row level security;
alter table public.client_contacts enable row level security;
alter table public.client_engagements enable row level security;
alter table public.organization_solutions enable row level security;
alter table public.organization_portal_settings enable row level security;
alter table public.client_invitations enable row level security;

-- solution_catalog: active rows visible to any authenticated user; admins see all and mutate.
drop policy if exists "solution_catalog_select_active_or_admin" on public.solution_catalog;
create policy "solution_catalog_select_active_or_admin"
  on public.solution_catalog for select to authenticated
  using (is_active or public.is_platform_admin());
drop policy if exists "solution_catalog_write_admin" on public.solution_catalog;
create policy "solution_catalog_write_admin"
  on public.solution_catalog for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- Internal-only tables: platform admins only.
do $$
declare
  t text;
begin
  foreach t in array array['client_accounts', 'client_contacts', 'client_engagements', 'client_invitations']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_admin_all', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin())',
      t || '_admin_all', t
    );
  end loop;
end;
$$;

-- Customer-visible tables: members read, admins write.
drop policy if exists "organization_solutions_select_member_or_admin" on public.organization_solutions;
create policy "organization_solutions_select_member_or_admin"
  on public.organization_solutions for select to authenticated
  using (public.is_platform_admin() or public.is_organization_member(organization_id));
drop policy if exists "organization_solutions_write_admin" on public.organization_solutions;
create policy "organization_solutions_write_admin"
  on public.organization_solutions for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists "organization_portal_settings_select_member_or_admin" on public.organization_portal_settings;
create policy "organization_portal_settings_select_member_or_admin"
  on public.organization_portal_settings for select to authenticated
  using (public.is_platform_admin() or public.is_organization_member(organization_id));
drop policy if exists "organization_portal_settings_write_admin" on public.organization_portal_settings;
create policy "organization_portal_settings_write_admin"
  on public.organization_portal_settings for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Grants (RLS enforces the actual row-level authorization)
-- ---------------------------------------------------------------------------
revoke all on table public.solution_catalog from public, anon, authenticated;
revoke all on table public.client_accounts from public, anon, authenticated;
revoke all on table public.client_contacts from public, anon, authenticated;
revoke all on table public.client_engagements from public, anon, authenticated;
revoke all on table public.organization_solutions from public, anon, authenticated;
revoke all on table public.organization_portal_settings from public, anon, authenticated;
revoke all on table public.client_invitations from public, anon, authenticated;

grant select on table public.solution_catalog to authenticated;
grant select, insert, update, delete on table public.solution_catalog to authenticated;
grant select on table public.organization_solutions to authenticated;
grant select, insert, update, delete on table public.organization_solutions to authenticated;
grant select on table public.organization_portal_settings to authenticated;
grant select, insert, update, delete on table public.organization_portal_settings to authenticated;

-- Internal-only tables: authenticated is granted table privileges but RLS restricts every row to platform admins.
grant select, insert, update, delete on table public.client_accounts to authenticated;
grant select, insert, update, delete on table public.client_contacts to authenticated;
grant select, insert, update, delete on table public.client_engagements to authenticated;
grant select, insert, update, delete on table public.client_invitations to authenticated;

grant select, insert, update, delete on table public.solution_catalog to service_role;
grant select, insert, update, delete on table public.client_accounts to service_role;
grant select, insert, update, delete on table public.client_contacts to service_role;
grant select, insert, update, delete on table public.client_engagements to service_role;
grant select, insert, update, delete on table public.organization_solutions to service_role;
grant select, insert, update, delete on table public.organization_portal_settings to service_role;
grant select, insert, update, delete on table public.client_invitations to service_role;

-- ---------------------------------------------------------------------------
-- Internal admin-only idempotency ledger for client provisioning.
-- ---------------------------------------------------------------------------
create table if not exists public.client_provisioning_requests (
  idempotency_key text primary key,
  organization_id uuid references public.organizations(id) on delete set null,
  result jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint client_provisioning_requests_key_not_blank check (length(trim(idempotency_key)) > 0)
);

comment on table public.client_provisioning_requests is
  'Internal admin-only idempotency ledger. One row per intended client provisioning submission; result holds the created workspace IDs so retries replay instead of duplicating.';

alter table public.client_provisioning_requests enable row level security;

drop policy if exists "client_provisioning_requests_admin_all" on public.client_provisioning_requests;
create policy "client_provisioning_requests_admin_all"
  on public.client_provisioning_requests for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

revoke all on table public.client_provisioning_requests from public, anon, authenticated;
grant select, insert, update, delete on table public.client_provisioning_requests to authenticated;
grant select, insert, update, delete on table public.client_provisioning_requests to service_role;

-- ---------------------------------------------------------------------------
-- Entitlement helper: does an organization own an accessible (non-disabled)
-- solution of a controlled catalog key? SECURITY DEFINER + fixed safe search_path.
-- The membership/admin floor prevents enumeration of other organizations.
-- ---------------------------------------------------------------------------
create or replace function public.organization_has_accessible_solution(
  target_organization_id uuid,
  target_catalog_key text
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    (public.is_platform_admin() or public.is_organization_member(target_organization_id))
    and exists (
      select 1
      from public.organization_solutions os
      where os.organization_id = target_organization_id
        and os.catalog_key = target_catalog_key
        and os.status <> 'disabled'
    );
$$;

comment on function public.organization_has_accessible_solution(uuid, text) is
  'RLS helper. True only when the caller is a platform admin or active member of the organization AND that organization owns a non-disabled solution of the given controlled catalog key. Not exploitable to enumerate other organizations.';

revoke execute on function public.organization_has_accessible_solution(uuid, text) from public, anon;
grant execute on function public.organization_has_accessible_solution(uuid, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- RPC: claim_my_client_invitations()  (no client arguments)
-- ---------------------------------------------------------------------------
create or replace function public.claim_my_client_invitations()
returns table (organization_id uuid, membership_id uuid)
language plpgsql
security definer
set search_path = public, auth
as $$
#variable_conflict use_column
declare
  acting uuid := auth.uid();
  user_email text;
  confirmed_at timestamptz;
  normalized text;
  inv record;
  mem_id uuid;
begin
  if acting is null then
    raise exception 'Authentication required to claim invitations';
  end if;

  select u.email, u.email_confirmed_at
    into user_email, confirmed_at
  from auth.users u
  where u.id = acting;

  -- Require a confirmed email. Never trust browser-supplied email.
  if user_email is null or confirmed_at is null then
    return;
  end if;

  normalized := lower(trim(user_email));
  if normalized = '' then
    return;
  end if;

  for inv in
    select ci.*
    from public.client_invitations ci
    where ci.email = normalized
      and ci.status = 'pending'
      and (ci.expires_at is null or ci.expires_at > now())
    for update
  loop
    -- Create or activate membership. Never reactivate a suspended membership.
    insert into public.organization_members (organization_id, user_id, role, status)
    values (inv.organization_id, acting, inv.organization_role, 'active')
    on conflict (organization_id, user_id) do update
      set status = case
                     when public.organization_members.status = 'suspended'
                       then public.organization_members.status
                     else 'active'
                   end
    returning id into mem_id;

    update public.client_invitations
      set status = 'accepted',
          accepted_user_id = acting,
          accepted_at = now()
    where id = inv.id;

    -- Activate a pending organization once its first member is confirmed.
    update public.organizations
      set status = 'active'
    where id = inv.organization_id
      and status = 'pending';

    organization_id := inv.organization_id;
    membership_id := mem_id;
    return next;
  end loop;

  return;
end;
$$;

comment on function public.claim_my_client_invitations() is
  'Idempotent invitation claim. Reads confirmed email from auth.users, claims non-expired pending invitations, creates/activates membership (never reactivates suspended), activates pending organization.';

-- ---------------------------------------------------------------------------
-- RPC: provision_client_workspace(...)  atomic admin provisioning
-- ---------------------------------------------------------------------------
create or replace function public.provision_client_workspace(
  p_idempotency_key text,
  p_display_name text,
  p_legal_name text,
  p_primary_contact_name text,
  p_primary_email text,
  p_phone text,
  p_website text,
  p_industry text,
  p_address text,
  p_lead_source text,
  p_lifecycle_status text,
  p_internal_notes text,
  p_internal_owner text,
  p_currency text,
  p_estimated_total_budget_cents bigint,
  p_estimated_monthly_value_cents bigint,
  p_catalog_key text,
  p_project_name text,
  p_engagement_status text,
  p_total_budget_cents bigint,
  p_setup_fee_cents bigint,
  p_recurring_fee_cents bigint,
  p_target_go_live_date date,
  p_solution_display_name text,
  p_implementation_key text,
  p_instance_key text,
  p_invitation_email text,
  p_organization_role public.organization_role
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_currency text := upper(coalesce(nullif(trim(p_currency), ''), 'EUR'));
  v_lifecycle text := coalesce(nullif(trim(p_lifecycle_status), ''), 'lead');
  v_engagement_status text := coalesce(nullif(trim(p_engagement_status), ''), 'active');
  v_invite_email text := lower(trim(coalesce(p_invitation_email, '')));
  v_idem text := nullif(trim(coalesce(p_idempotency_key, '')), '');
  v_slug text;
  v_instance_key text;
  v_existing_result jsonb;
  v_result jsonb;
  v_role public.organization_role := coalesce(p_organization_role, 'owner');
  v_org_id uuid;
  v_account_id uuid;
  v_contact_id uuid;
  v_engagement_id uuid;
  v_solution_id uuid;
  v_invitation_id uuid;
begin
  if not public.is_platform_admin() then
    raise exception 'Only Cogniiq platform admins may provision client workspaces';
  end if;

  -- Idempotency: claim the key first. If another (committed) call already produced a result for
  -- this key, replay it. Concurrent callers with the same key serialize on the row lock: the first
  -- holds it until commit, the second then reads the committed result. A retry after a committed
  -- transaction returns the original workspace IDs and creates nothing new.
  if v_idem is not null then
    insert into public.client_provisioning_requests (idempotency_key, created_by)
    values (v_idem, auth.uid())
    on conflict (idempotency_key) do nothing;

    select cpr.result
      into v_existing_result
    from public.client_provisioning_requests cpr
    where cpr.idempotency_key = v_idem
    for update;

    if v_existing_result is not null then
      return v_existing_result;
    end if;
  end if;

  -- Validation
  if length(trim(coalesce(p_display_name, ''))) = 0 then
    raise exception 'display_name is required';
  end if;
  if length(trim(coalesce(p_project_name, ''))) = 0 then
    raise exception 'project_name is required';
  end if;
  if length(trim(coalesce(p_solution_display_name, ''))) = 0 then
    raise exception 'solution_display_name is required';
  end if;
  if v_currency !~ '^[A-Z]{3}$' then
    raise exception 'currency must be a 3-letter ISO code';
  end if;
  if v_lifecycle not in ('lead', 'qualified', 'active', 'paused', 'churned', 'archived') then
    raise exception 'invalid lifecycle_status';
  end if;
  if v_engagement_status not in ('draft', 'active', 'paused', 'completed', 'cancelled') then
    raise exception 'invalid engagement status';
  end if;
  if p_implementation_key not in ('ai_receptionist', 'automation_workspace', 'pankofer_operations', 'unavailable') then
    raise exception 'invalid implementation_key';
  end if;
  if not exists (select 1 from public.solution_catalog c where c.key = p_catalog_key) then
    raise exception 'unknown catalog_key';
  end if;
  if v_invite_email = '' or v_invite_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'a valid invitation email is required';
  end if;
  if coalesce(p_estimated_total_budget_cents, 0) < 0
    or coalesce(p_estimated_monthly_value_cents, 0) < 0
    or coalesce(p_total_budget_cents, 0) < 0
    or coalesce(p_setup_fee_cents, 0) < 0
    or coalesce(p_recurring_fee_cents, 0) < 0 then
    raise exception 'monetary amounts must be non-negative';
  end if;

  -- Canonical instance key is generated server-side: a readable slug plus a random,
  -- collision-resistant suffix from gen_random_uuid(). Frontend-supplied keys are never trusted
  -- for database identity, so repeated display names ("KI-Rezeptionist", "Automatisierung", ...)
  -- never collide across clients.
  v_slug := lower(trim(coalesce(p_solution_display_name, '')));
  v_slug := regexp_replace(v_slug, '[^a-z0-9]+', '-', 'g');
  v_slug := trim(both '-' from v_slug);
  if length(v_slug) < 3 then
    v_slug := 'loesung';
  end if;
  v_slug := substr(v_slug, 1, 40);

  loop
    v_instance_key := v_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
    exit when not exists (
      select 1 from public.organization_solutions os where os.instance_key = v_instance_key
    );
  end loop;

  -- 1. Organization (pending until invitation claimed)
  insert into public.organizations (name, status, created_by)
  values (trim(p_display_name), 'pending', auth.uid())
  returning id into v_org_id;

  -- 2. Client account (CRM)
  insert into public.client_accounts (
    organization_id, legal_name, display_name, primary_contact_name, primary_email,
    phone, website, industry, address, lifecycle_status, lead_source, internal_notes,
    estimated_total_budget_cents, estimated_monthly_value_cents, internal_owner, currency
  )
  values (
    v_org_id, nullif(trim(coalesce(p_legal_name, '')), ''), trim(p_display_name),
    nullif(trim(coalesce(p_primary_contact_name, '')), ''), nullif(trim(coalesce(p_primary_email, '')), ''),
    nullif(trim(coalesce(p_phone, '')), ''), nullif(trim(coalesce(p_website, '')), ''),
    nullif(trim(coalesce(p_industry, '')), ''), nullif(trim(coalesce(p_address, '')), ''),
    v_lifecycle, nullif(trim(coalesce(p_lead_source, '')), ''), nullif(trim(coalesce(p_internal_notes, '')), ''),
    p_estimated_total_budget_cents, p_estimated_monthly_value_cents,
    nullif(trim(coalesce(p_internal_owner, '')), ''), v_currency
  )
  returning id into v_account_id;

  -- 3. Primary contact
  insert into public.client_contacts (organization_id, name, email, phone, is_primary, should_invite)
  values (
    v_org_id,
    coalesce(nullif(trim(coalesce(p_primary_contact_name, '')), ''), trim(p_display_name)),
    v_invite_email, nullif(trim(coalesce(p_phone, '')), ''), true, true
  )
  returning id into v_contact_id;

  -- 4. Engagement
  insert into public.client_engagements (
    organization_id, catalog_key, project_name, status, total_budget_cents,
    setup_fee_cents, recurring_fee_cents, currency, target_go_live_date, internal_owner
  )
  values (
    v_org_id, p_catalog_key, trim(p_project_name), v_engagement_status, p_total_budget_cents,
    p_setup_fee_cents, p_recurring_fee_cents, v_currency, p_target_go_live_date,
    nullif(trim(coalesce(p_internal_owner, '')), '')
  )
  returning id into v_engagement_id;

  -- 5. Customer-visible solution instance
  insert into public.organization_solutions (
    organization_id, engagement_id, catalog_key, instance_key, display_name, implementation_key, status
  )
  values (
    v_org_id, v_engagement_id, p_catalog_key, v_instance_key, trim(p_solution_display_name),
    p_implementation_key, 'active'
  )
  returning id into v_solution_id;

  -- 6. Portal settings (default to the new solution)
  insert into public.organization_portal_settings (organization_id, portal_title, default_solution_id, support_contact)
  values (v_org_id, trim(p_display_name), v_solution_id, nullif(trim(coalesce(p_primary_email, '')), ''))
  on conflict (organization_id) do nothing;

  -- 7. Pending invitation
  insert into public.client_invitations (organization_id, email, organization_role, status, invited_by, expires_at)
  values (v_org_id, v_invite_email, v_role, 'pending', auth.uid(), now() + interval '14 days')
  returning id into v_invitation_id;

  v_result := jsonb_build_object(
    'organization_id', v_org_id,
    'client_account_id', v_account_id,
    'client_contact_id', v_contact_id,
    'engagement_id', v_engagement_id,
    'organization_solution_id', v_solution_id,
    'instance_key', v_instance_key,
    'invitation_id', v_invitation_id,
    'invitation_email', v_invite_email
  );

  -- Persist the result against the idempotency key so retries replay it.
  if v_idem is not null then
    update public.client_provisioning_requests
      set result = v_result, organization_id = v_org_id
    where idempotency_key = v_idem;
  end if;

  return v_result;
end;
$$;

comment on function public.provision_client_workspace is
  'Atomic admin-only provisioning: creates organization, CRM account, primary contact, engagement, solution instance, portal settings and a pending invitation. Never sends email.';

-- ---------------------------------------------------------------------------
-- Function grants
-- ---------------------------------------------------------------------------
revoke execute on function public.claim_my_client_invitations() from public, anon;
grant execute on function public.claim_my_client_invitations() to authenticated, service_role;

revoke execute on function public.provision_client_workspace(
  text, text, text, text, text, text, text, text, text, text, text, text, text, text,
  bigint, bigint, text, text, text, bigint, bigint, bigint, date, text, text, text, text, public.organization_role
) from public, anon;
grant execute on function public.provision_client_workspace(
  text, text, text, text, text, text, text, text, text, text, text, text, text, text,
  bigint, bigint, text, text, text, bigint, bigint, bigint, date, text, text, text, text, public.organization_role
) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Receptionist entitlement reconciliation.
--
-- The receptionist persistence layer predates organization_solutions, so its policies authorized
-- organization owners/admins without checking that the organization owns the AI receptionist
-- solution. First backfill an ai_receptionist solution instance (and portal settings) for every
-- organization that already has receptionist data, then tighten the policies to require the
-- entitlement. This keeps existing receptionist clients working while blocking automation-only
-- organizations from receptionist product tables.
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.businesses') is null then
    return; -- receptionist persistence layer not present; nothing to reconcile.
  end if;

  -- Idempotent, collision-safe backfill. instance_key derives from the (unique) organization id,
  -- so re-running never creates duplicates and no client CRM account/engagement is required.
  insert into public.organization_solutions (
    organization_id, catalog_key, instance_key, display_name, implementation_key, status
  )
  select
    b.organization_id,
    'ai_receptionist',
    'ai-receptionist-' || replace(b.organization_id::text, '-', ''),
    coalesce(nullif(trim(b.name), ''), 'KI-Rezeptionist'),
    'ai_receptionist',
    'active'
  from public.businesses b
  where not exists (
    select 1 from public.organization_solutions os
    where os.organization_id = b.organization_id
      and os.catalog_key = 'ai_receptionist'
  )
  on conflict (instance_key) do nothing;

  -- Portal settings for those organizations, without overwriting existing settings.
  insert into public.organization_portal_settings (organization_id, portal_title)
  select b.organization_id, coalesce(nullif(trim(b.name), ''), 'Cogniiq')
  from public.businesses b
  on conflict (organization_id) do nothing;
end;
$$;

-- Reconcile the receptionist-table policies to require the ai_receptionist entitlement.
-- Platform admins retain access. service_role bypasses RLS and is unaffected.
do $$
declare
  t text;
begin
  if to_regclass('public.businesses') is null then
    return;
  end if;

  foreach t in array array['businesses', 'onboarding_sessions', 'receptionist_configs', 'phone_configs']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_select_org_or_platform_admin', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using ('
      || 'public.is_platform_admin() '
      || 'or public.organization_has_accessible_solution(organization_id, ''ai_receptionist''))',
      t || '_select_org_or_platform_admin', t
    );

    execute format('drop policy if exists %I on public.%I', t || '_insert_owner_admin_or_platform_admin', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ('
      || 'public.is_platform_admin() '
      || 'or (public.has_organization_role(organization_id, array[''owner''::public.organization_role, ''admin''::public.organization_role]) '
      || 'and public.organization_has_accessible_solution(organization_id, ''ai_receptionist'')))',
      t || '_insert_owner_admin_or_platform_admin', t
    );

    execute format('drop policy if exists %I on public.%I', t || '_update_owner_admin_or_platform_admin', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using ('
      || 'public.is_platform_admin() '
      || 'or (public.has_organization_role(organization_id, array[''owner''::public.organization_role, ''admin''::public.organization_role]) '
      || 'and public.organization_has_accessible_solution(organization_id, ''ai_receptionist''))) '
      || 'with check ('
      || 'public.is_platform_admin() '
      || 'or (public.has_organization_role(organization_id, array[''owner''::public.organization_role, ''admin''::public.organization_role]) '
      || 'and public.organization_has_accessible_solution(organization_id, ''ai_receptionist'')))',
      t || '_update_owner_admin_or_platform_admin', t
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Post-conditions: verify RLS is enabled on every new table.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'solution_catalog', 'client_accounts', 'client_contacts', 'client_engagements',
    'organization_solutions', 'organization_portal_settings', 'client_invitations',
    'client_provisioning_requests'
  ]
  loop
    if not exists (
      select 1 from pg_class where oid = format('public.%I', t)::regclass and relrowsecurity
    ) then
      raise exception 'RLS is not enabled on public.%', t;
    end if;
  end loop;
end;
$$;

commit;
