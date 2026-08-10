-- Reusable multi-tenant capability authorization + organization functional roles.
--
-- Additive and forward-only. Nothing here modifies, backfills or narrows any existing table,
-- column, policy, grant or function signature. In particular:
--   * public.organization_role (owner/admin/member/viewer) stays a COARSE governance role and
--     gains no new values. Functional, organization-specific roles live in a separate table.
--   * public.organization_members.role is untouched.
--   * public.claim_my_client_invitations() keeps its exact signature and return type; only its
--     body gains an additive step (copying the invitation's functional roles).
--
-- Model
--   capabilities                      global, namespaced capability catalog (reusable, tenant-free)
--   organization_roles                functional roles, scoped to exactly one organization
--   organization_role_capabilities    role -> capability grants
--   organization_member_roles         membership -> functional role (many-to-many)
--   client_invitation_roles           invitation -> functional role (copied on claim)
--
-- Cross-tenant safety is STRUCTURAL, not merely policy-based: assignment tables carry a redundant
-- organization_id and reference (id, organization_id) composite keys, so a row whose member and role
-- belong to different organizations cannot be inserted at all — even by service_role or the database
-- owner, both of which bypass RLS.
--
-- Effective capabilities of an active membership:
--   * with >= 1 functional role: the deduplicated UNION of those roles' capabilities;
--   * with 0 functional roles: the portal baseline (exactly what every member can already reach
--     today), which is what keeps existing customers — Pankofer included — working unchanged;
--   * plus the baseline for coarse owner/admin, so an owner can never lock themselves out;
--   * minus every capability bound to a solution the organization has not ACTIVATED.
--
-- Security: all SECURITY DEFINER functions pin search_path, anon receives nothing, authenticated
-- receives execute on the read/administration RPCs only (each of which re-authorizes internally),
-- and every new table has RLS enabled with no direct write path from the browser.

begin;

do $$
begin
  if to_regclass('public.organizations') is null
    or to_regclass('public.organization_members') is null
    or to_regclass('public.organization_solutions') is null
    or to_regclass('public.client_invitations') is null
    or to_regclass('public.solution_catalog') is null
    or to_regtype('public.organization_role') is null
    or to_regprocedure('public.is_platform_admin()') is null
    or to_regprocedure('public.is_organization_member(uuid)') is null
    or to_regprocedure('public.set_updated_at()') is null
    or to_regprocedure('public.claim_my_client_invitations()') is null then
    raise exception 'Capability authorization migration requires the Phase 0 and client-platform foundations';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Composite keys that make cross-organization references impossible
-- ---------------------------------------------------------------------------
-- Additive unique constraints only. They do not change existing primary keys and cannot fail on
-- existing data (id is already unique on both tables).
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.organization_members'::regclass
      and conname = 'organization_members_id_organization_id_key'
  ) then
    alter table public.organization_members
      add constraint organization_members_id_organization_id_key unique (id, organization_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.client_invitations'::regclass
      and conname = 'client_invitations_id_organization_id_key'
  ) then
    alter table public.client_invitations
      add constraint client_invitations_id_organization_id_key unique (id, organization_id);
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Global capability catalog
-- ---------------------------------------------------------------------------
create table if not exists public.capabilities (
  key text primary key,
  label text not null,
  description text,
  -- Null  => general portal capability, always available to any organization.
  -- Set   => the capability is SUPPRESSED unless the organization has an activated solution
  --          instance of this catalog key. This is what stops a role from granting access to a
  --          product the organization never purchased or activated.
  solution_catalog_key text references public.solution_catalog(key) on delete restrict,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Globally unique AND namespaced: at least one dot, lowercase, no free-form text.
  constraint capabilities_key_format check (key ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'),
  constraint capabilities_label_not_blank check (length(trim(label)) > 0)
);

comment on table public.capabilities is
  'Global, tenant-free catalog of namespaced capability keys. Reusable across every customer. solution_catalog_key binds a capability to a purchasable product; such capabilities are suppressed unless that solution is activated for the organization.';

-- ---------------------------------------------------------------------------
-- Organization-specific functional roles
-- ---------------------------------------------------------------------------
create table if not exists public.organization_roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  role_key text not null,
  label text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_roles_role_key_format check (role_key ~ '^[a-z][a-z0-9_]*$'),
  constraint organization_roles_label_not_blank check (length(trim(label)) > 0),
  -- Role keys are unique INSIDE an organization, never globally.
  constraint organization_roles_org_key_unique unique (organization_id, role_key),
  -- Referenced by the assignment tables so a role can only ever be used inside its own organization.
  constraint organization_roles_id_organization_id_key unique (id, organization_id)
);

comment on table public.organization_roles is
  'Functional roles scoped to exactly one organization (e.g. Kassenwart). Deliberately separate from the coarse public.organization_role enum, which stays owner/admin/member/viewer.';

-- ---------------------------------------------------------------------------
-- Functional role -> capability grants
-- ---------------------------------------------------------------------------
create table if not exists public.organization_role_capabilities (
  organization_role_id uuid not null references public.organization_roles(id) on delete cascade,
  -- restrict: a capability that roles still reference cannot silently disappear from the catalog.
  capability_key text not null references public.capabilities(key) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (organization_role_id, capability_key)
);

comment on table public.organization_role_capabilities is
  'Which capabilities a functional role grants. Deleting a grant removes access only; it never touches profiles, memberships or business data.';

-- ---------------------------------------------------------------------------
-- Membership -> functional role assignments (a member may hold several)
-- ---------------------------------------------------------------------------
create table if not exists public.organization_member_roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  organization_member_id uuid not null,
  organization_role_id uuid not null,
  assigned_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint organization_member_roles_member_fk
    foreign key (organization_member_id, organization_id)
    references public.organization_members(id, organization_id) on delete cascade,
  constraint organization_member_roles_role_fk
    foreign key (organization_role_id, organization_id)
    references public.organization_roles(id, organization_id) on delete cascade,
  constraint organization_member_roles_unique unique (organization_member_id, organization_role_id)
);

comment on table public.organization_member_roles is
  'Assigns functional roles to an organization membership. The composite foreign keys make a cross-organization assignment structurally impossible — the member and the role must share the same organization_id row-for-row.';

-- ---------------------------------------------------------------------------
-- Invitation -> functional role assignments (copied to the membership on claim)
-- ---------------------------------------------------------------------------
create table if not exists public.client_invitation_roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  client_invitation_id uuid not null,
  organization_role_id uuid not null,
  created_at timestamptz not null default now(),
  constraint client_invitation_roles_invitation_fk
    foreign key (client_invitation_id, organization_id)
    references public.client_invitations(id, organization_id) on delete cascade,
  constraint client_invitation_roles_role_fk
    foreign key (organization_role_id, organization_id)
    references public.organization_roles(id, organization_id) on delete cascade,
  constraint client_invitation_roles_unique unique (client_invitation_id, organization_role_id)
);

comment on table public.client_invitation_roles is
  'Functional roles pre-configured on an invitation. Copied onto the membership when the invitation is claimed; the copy is idempotent and cross-organization-safe.';

create index if not exists organization_roles_organization_id_idx
  on public.organization_roles(organization_id);
create index if not exists organization_role_capabilities_capability_key_idx
  on public.organization_role_capabilities(capability_key);
create index if not exists organization_member_roles_member_idx
  on public.organization_member_roles(organization_member_id);
create index if not exists organization_member_roles_role_idx
  on public.organization_member_roles(organization_role_id);
create index if not exists client_invitation_roles_invitation_idx
  on public.client_invitation_roles(client_invitation_id);
create index if not exists capabilities_solution_catalog_key_idx
  on public.capabilities(solution_catalog_key);

drop trigger if exists capabilities_set_updated_at on public.capabilities;
create trigger capabilities_set_updated_at
before update on public.capabilities
for each row execute function public.set_updated_at();

drop trigger if exists organization_roles_set_updated_at on public.organization_roles;
create trigger organization_roles_set_updated_at
before update on public.organization_roles
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Phase 5: reusable capability catalog
-- ---------------------------------------------------------------------------
-- The SVH catalog entry exists so svh.* capabilities have a real product to be suppressed by. It
-- deliberately resolves to the 'unavailable' frontend implementation: no operational pages are
-- being invented here, and no customer data is seeded anywhere.
insert into public.solution_catalog (key, label, description, default_implementation_key, is_active, sort_order)
values (
  'sports_club_operations',
  'Vereinsverwaltung',
  'Mitglieder-, Buchungs-, Anlagen- und Finanzverwaltung fuer Vereine.',
  'unavailable',
  true,
  50
)
on conflict (key) do nothing;

insert into public.capabilities (key, label, description, solution_catalog_key, sort_order)
values
  -- General portal (no solution binding: every organization has a portal).
  ('portal.overview.view',      'Portal-Uebersicht ansehen',   'Startseite des Kundenportals.',                 null, 10),
  ('portal.projects.view',      'Projekte ansehen',            'Projekte und Meilensteine der Organisation.',   null, 20),
  ('portal.documents.view',     'Dokumente ansehen',           'Freigegebene Dokumente der Organisation.',      null, 30),
  ('portal.billing.view',       'Abrechnung ansehen',          'Rechnungen und Abrechnungsdaten.',              null, 40),
  ('portal.support.create',     'Supportanfrage erstellen',    'Neue Supportanfrage stellen.',                  null, 50),
  ('portal.support.view_own',   'Eigene Supportanfragen',      'Eigene Supportanfragen einsehen.',              null, 60),
  -- Vereinsverwaltung / SV Heinersreuth. Suppressed unless the solution is activated.
  ('svh.dashboard.view',              'Vereins-Dashboard',            'Uebersicht der Vereinsverwaltung.',        'sports_club_operations', 110),
  ('svh.bookings.view',               'Buchungen ansehen',            'Belegungen und Buchungen einsehen.',       'sports_club_operations', 120),
  ('svh.bookings.manage',             'Buchungen verwalten',          'Buchungen anlegen, aendern, stornieren.',  'sports_club_operations', 130),
  ('svh.members.view',                'Mitglieder ansehen',           'Mitgliederdaten einsehen.',                'sports_club_operations', 140),
  ('svh.members.manage',              'Mitglieder verwalten',         'Mitgliederdaten pflegen.',                 'sports_club_operations', 150),
  ('svh.members.applications_review',  'Aufnahmeantraege pruefen',     'Eingegangene Aufnahmeantraege pruefen.',   'sports_club_operations', 160),
  ('svh.members.numbers_assign',      'Mitgliedsnummern vergeben',    'Mitgliedsnummern zuweisen.',               'sports_club_operations', 170),
  ('svh.finance.view',                'Finanzen ansehen',             'Beitraege und Finanzdaten einsehen.',      'sports_club_operations', 180),
  ('svh.finance.manage',              'Finanzen verwalten',           'Beitraege und Finanzdaten pflegen.',       'sports_club_operations', 190),
  ('svh.facilities.view',             'Anlagen ansehen',              'Sportanlagen und Raeume einsehen.',        'sports_club_operations', 200),
  ('svh.facilities.manage',           'Anlagen verwalten',            'Sportanlagen und Raeume pflegen.',         'sports_club_operations', 210),
  ('svh.devices.view',                'Geraete ansehen',              'Technische Geraete einsehen.',             'sports_club_operations', 220),
  ('svh.devices.manage',              'Geraete verwalten',            'Technische Geraete steuern und pflegen.',  'sports_club_operations', 230)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Baseline capabilities (backward compatibility contract)
-- ---------------------------------------------------------------------------
create or replace function public.portal_baseline_capability_keys()
returns text[]
language sql
immutable
set search_path = public
as $$
  select array[
    'portal.overview.view',
    'portal.projects.view',
    'portal.documents.view',
    'portal.billing.view',
    'portal.support.create',
    'portal.support.view_own'
  ]::text[];
$$;

comment on function public.portal_baseline_capability_keys() is
  'The general-portal capabilities every existing customer already has today. Granted to active memberships that hold NO functional role, and always to coarse owner/admin, so introducing functional roles cannot lock anyone out and cannot change behaviour for existing customers.';

-- A solution entitles its capabilities only while it is ACTIVATED. Provisioning, paused and
-- disabled instances all suppress the capabilities bound to that catalog key.
create or replace function public.solution_status_entitles_capabilities(p_status text)
returns boolean
language sql
immutable
set search_path = public
as $$
  select p_status = 'active';
$$;

comment on function public.solution_status_entitles_capabilities(text) is
  'Single definition of "activated" for capability entitlement. Deliberately stricter than the legacy receptionist route guard, which also accepts provisioning/paused; that guard is untouched.';

-- ---------------------------------------------------------------------------
-- Effective capabilities for one membership
-- ---------------------------------------------------------------------------
create or replace function public.membership_effective_capability_keys(p_membership_id uuid)
returns text[]
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with membership as (
    select om.id, om.organization_id, om.role, om.status
    from public.organization_members om
    where om.id = p_membership_id
      and om.status = 'active'
  ),
  granted as (
    select orc.capability_key
    from membership m
    join public.organization_member_roles omr on omr.organization_member_id = m.id
    join public.organization_role_capabilities orc on orc.organization_role_id = omr.organization_role_id
  ),
  baseline as (
    select unnest(public.portal_baseline_capability_keys()) as capability_key
    from membership m
    where m.role in ('owner', 'admin')
       or not exists (
            select 1 from public.organization_member_roles omr
            where omr.organization_member_id = m.id
          )
  ),
  candidate as (
    select capability_key from granted
    union
    select capability_key from baseline
  )
  select coalesce(array_agg(distinct c.key order by c.key), array[]::text[])
  from candidate cand
  join public.capabilities c on c.key = cand.capability_key
  cross join membership m
  where c.is_active
    and (
      c.solution_catalog_key is null
      or exists (
        select 1
        from public.organization_solutions os
        where os.organization_id = m.organization_id
          and os.catalog_key = c.solution_catalog_key
          and public.solution_status_entitles_capabilities(os.status)
      )
    );
$$;

comment on function public.membership_effective_capability_keys(uuid) is
  'Deduplicated union of the capabilities a single ACTIVE membership effectively holds: role grants plus the baseline (no functional role, or coarse owner/admin), minus inactive catalog entries and minus capabilities bound to a solution the organization has not activated. A suspended membership yields an empty array.';

-- ---------------------------------------------------------------------------
-- Phase 3.1: the one portal-context RPC
-- ---------------------------------------------------------------------------
create or replace function public.current_user_portal_context()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'user_id', auth.uid(),
    'platform_role', coalesce((select p.platform_role::text from public.profiles p where p.id = auth.uid()), 'customer'),
    'is_platform_admin', public.is_platform_admin(),
    'organizations', coalesce(
      (
        select jsonb_agg(entry order by entry->>'organization_name')
        from (
          select jsonb_build_object(
            'membership_id', om.id,
            'organization_id', o.id,
            'organization_name', o.name,
            'organization_slug', o.slug,
            'organization_status', o.status,
            'organization_role', om.role,
            'membership_status', om.status,
            'roles', coalesce(
              (
                select jsonb_agg(jsonb_build_object(
                         'id', orole.id,
                         'role_key', orole.role_key,
                         'label', orole.label,
                         'description', orole.description
                       ) order by orole.sort_order, orole.label)
                from public.organization_member_roles omr
                join public.organization_roles orole on orole.id = omr.organization_role_id
                where omr.organization_member_id = om.id
              ), '[]'::jsonb),
            'capabilities', to_jsonb(public.membership_effective_capability_keys(om.id)),
            'solutions', coalesce(
              (
                select jsonb_agg(jsonb_build_object(
                         'id', os.id,
                         'catalog_key', os.catalog_key,
                         'instance_key', os.instance_key,
                         'implementation_key', os.implementation_key,
                         'display_name', os.display_name,
                         'status', os.status,
                         'nav_order', os.nav_order
                       ) order by os.nav_order, os.created_at)
                from public.organization_solutions os
                where os.organization_id = o.id
                  and os.status <> 'disabled'
              ), '[]'::jsonb),
            'portal_settings', (
              select to_jsonb(ops) - 'config'
              from public.organization_portal_settings ops
              where ops.organization_id = o.id
            )
          ) as entry
          from public.organization_members om
          join public.organizations o on o.id = om.organization_id
          -- Only ACTIVE memberships. A suspended membership yields no portal entry at all.
          where om.user_id = auth.uid()
            and om.status = 'active'
        ) rows
      ), '[]'::jsonb)
  )
  where auth.uid() is not null;
$$;

comment on function public.current_user_portal_context() is
  'The single authenticated portal-access context. Returns only organizations the caller is an ACTIVE member of, each with organization identity, coarse organization role, membership status, assigned functional roles, deduplicated effective capability keys, non-disabled solutions and portal settings. Never accepts a user id argument — the identity is always auth.uid().';

-- ---------------------------------------------------------------------------
-- Phase 3.2: platform-admin access overview for one organization
-- ---------------------------------------------------------------------------
create or replace function public.admin_organization_access_overview(p_organization_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  result jsonb;
begin
  if not public.is_platform_admin() then
    raise exception 'Only Cogniiq platform administrators may read organization access assignments'
      using errcode = '42501';
  end if;

  select jsonb_build_object(
    'organization_id', p_organization_id,
    'roles', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', orole.id,
               'role_key', orole.role_key,
               'label', orole.label,
               'description', orole.description,
               'sort_order', orole.sort_order,
               'capabilities', coalesce((
                 select jsonb_agg(orc.capability_key order by orc.capability_key)
                 from public.organization_role_capabilities orc
                 where orc.organization_role_id = orole.id
               ), '[]'::jsonb)
             ) order by orole.sort_order, orole.label)
      from public.organization_roles orole
      where orole.organization_id = p_organization_id
    ), '[]'::jsonb),
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
               'membership_id', om.id,
               'user_id', om.user_id,
               'email', p.email,
               'full_name', p.full_name,
               'organization_role', om.role,
               'membership_status', om.status,
               'role_ids', coalesce((
                 select jsonb_agg(omr.organization_role_id)
                 from public.organization_member_roles omr
                 where omr.organization_member_id = om.id
               ), '[]'::jsonb),
               'effective_capabilities', to_jsonb(public.membership_effective_capability_keys(om.id))
             ) order by coalesce(p.email, om.user_id::text))
      from public.organization_members om
      left join public.profiles p on p.id = om.user_id
      where om.organization_id = p_organization_id
    ), '[]'::jsonb),
    'invitations', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', ci.id,
               'email', ci.email,
               'organization_role', ci.organization_role,
               'status', ci.status,
               'expires_at', ci.expires_at,
               'role_ids', coalesce((
                 select jsonb_agg(cir.organization_role_id)
                 from public.client_invitation_roles cir
                 where cir.client_invitation_id = ci.id
               ), '[]'::jsonb)
             ) order by ci.created_at desc)
      from public.client_invitations ci
      where ci.organization_id = p_organization_id
    ), '[]'::jsonb),
    'capability_catalog', coalesce((
      select jsonb_agg(jsonb_build_object(
               'key', c.key,
               'label', c.label,
               'description', c.description,
               'solution_catalog_key', c.solution_catalog_key,
               'is_active', c.is_active
             ) order by c.sort_order, c.key)
      from public.capabilities c
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

comment on function public.admin_organization_access_overview(uuid) is
  'Platform-admin view of one organization: functional roles with their capabilities, members with coarse role and assigned functional roles, pending invitations with configured roles, and the capability catalog. Refuses non-admins.';

-- ---------------------------------------------------------------------------
-- Phase 3.3: assignment management
-- ---------------------------------------------------------------------------
create or replace function public.assign_organization_member_role(
  p_organization_member_id uuid,
  p_organization_role_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  member_org uuid;
  role_org uuid;
  assignment_id uuid;
begin
  if not public.is_platform_admin() then
    raise exception 'Only Cogniiq platform administrators may assign functional roles'
      using errcode = '42501';
  end if;

  select om.organization_id into member_org
  from public.organization_members om where om.id = p_organization_member_id;
  if member_org is null then
    raise exception 'Unknown organization membership' using errcode = '22023';
  end if;

  select orole.organization_id into role_org
  from public.organization_roles orole where orole.id = p_organization_role_id;
  if role_org is null then
    raise exception 'Unknown organization role' using errcode = '22023';
  end if;

  -- Explicit authorization check on top of the composite foreign keys below.
  if member_org <> role_org then
    raise exception 'A functional role cannot be assigned across organizations' using errcode = '42501';
  end if;

  insert into public.organization_member_roles (
    organization_id, organization_member_id, organization_role_id, assigned_by
  )
  values (member_org, p_organization_member_id, p_organization_role_id, auth.uid())
  on conflict (organization_member_id, organization_role_id) do update
    set organization_id = excluded.organization_id
  returning id into assignment_id;

  return assignment_id;
end;
$$;

comment on function public.assign_organization_member_role(uuid, uuid) is
  'Platform-admin assignment of one functional role to one membership. Idempotent. Refuses cross-organization assignment explicitly, on top of the structural composite foreign keys.';

create or replace function public.remove_organization_member_role(
  p_organization_member_id uuid,
  p_organization_role_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  removed integer;
begin
  if not public.is_platform_admin() then
    raise exception 'Only Cogniiq platform administrators may remove functional roles'
      using errcode = '42501';
  end if;

  -- Deletes the assignment row only. Profiles, memberships, invitations, projects, documents and
  -- invoices are never touched by this path.
  delete from public.organization_member_roles omr
  where omr.organization_member_id = p_organization_member_id
    and omr.organization_role_id = p_organization_role_id;

  get diagnostics removed = row_count;
  return removed > 0;
end;
$$;

comment on function public.remove_organization_member_role(uuid, uuid) is
  'Platform-admin removal of one functional-role assignment. Removes the assignment row only; no profile, membership or business data is deleted. The revoked capability disappears from the next portal context immediately.';

-- ---------------------------------------------------------------------------
-- Phase 3.4: configure functional roles on an UNACCEPTED invitation
-- ---------------------------------------------------------------------------
create or replace function public.set_client_invitation_roles(
  p_invitation_id uuid,
  p_organization_role_ids uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  inv record;
  requested uuid[] := coalesce(p_organization_role_ids, array[]::uuid[]);
  foreign_count integer;
begin
  if not public.is_platform_admin() then
    raise exception 'Only Cogniiq platform administrators may configure invitation roles'
      using errcode = '42501';
  end if;

  select ci.id, ci.organization_id, ci.status into inv
  from public.client_invitations ci
  where ci.id = p_invitation_id
  for update;

  if inv.id is null then
    raise exception 'Unknown invitation' using errcode = '22023';
  end if;

  -- Only an invitation that has not been accepted may still be configured; an accepted one has
  -- already produced a membership, which is managed through assign/remove instead.
  if inv.status <> 'pending' then
    raise exception 'Only a pending invitation can have its functional roles configured'
      using errcode = '42501';
  end if;

  select count(*) into foreign_count
  from unnest(requested) as requested_id
  where not exists (
    select 1 from public.organization_roles orole
    where orole.id = requested_id
      and orole.organization_id = inv.organization_id
  );
  if foreign_count > 0 then
    raise exception 'Every configured role must belong to the invitation''s organization'
      using errcode = '42501';
  end if;

  delete from public.client_invitation_roles cir
  where cir.client_invitation_id = inv.id
    and not (cir.organization_role_id = any(requested));

  insert into public.client_invitation_roles (organization_id, client_invitation_id, organization_role_id)
  select inv.organization_id, inv.id, requested_id
  from unnest(requested) as requested_id
  on conflict (client_invitation_id, organization_role_id) do nothing;

  return jsonb_build_object(
    'invitation_id', inv.id,
    'organization_id', inv.organization_id,
    'role_ids', coalesce((
      select jsonb_agg(cir.organization_role_id)
      from public.client_invitation_roles cir
      where cir.client_invitation_id = inv.id
    ), '[]'::jsonb)
  );
end;
$$;

comment on function public.set_client_invitation_roles(uuid, uuid[]) is
  'Replaces the functional roles configured on a PENDING invitation. Refuses roles from another organization and refuses non-pending invitations. Passing an empty array clears the configuration.';

-- ---------------------------------------------------------------------------
-- Role authoring (used by the SVH preset fixture and by platform admins)
-- ---------------------------------------------------------------------------
create or replace function public.upsert_organization_role(
  p_organization_id uuid,
  p_role_key text,
  p_label text,
  p_description text,
  p_capability_keys text[],
  p_sort_order integer default 0
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  role_id uuid;
  requested text[] := coalesce(p_capability_keys, array[]::text[]);
  unknown_count integer;
begin
  if not public.is_platform_admin() then
    raise exception 'Only Cogniiq platform administrators may author functional roles'
      using errcode = '42501';
  end if;

  select count(*) into unknown_count
  from unnest(requested) as requested_key
  where not exists (select 1 from public.capabilities c where c.key = requested_key);
  if unknown_count > 0 then
    raise exception 'Unknown capability key' using errcode = '22023';
  end if;

  insert into public.organization_roles (organization_id, role_key, label, description, sort_order)
  values (p_organization_id, p_role_key, p_label, p_description, coalesce(p_sort_order, 0))
  on conflict (organization_id, role_key) do update
    set label = excluded.label,
        description = excluded.description,
        sort_order = excluded.sort_order
  returning id into role_id;

  delete from public.organization_role_capabilities orc
  where orc.organization_role_id = role_id
    and not (orc.capability_key = any(requested));

  insert into public.organization_role_capabilities (organization_role_id, capability_key)
  select role_id, requested_key from unnest(requested) as requested_key
  on conflict (organization_role_id, capability_key) do nothing;

  return role_id;
end;
$$;

comment on function public.upsert_organization_role(uuid, text, text, text, text[], integer) is
  'Creates or updates one functional role and its capability grants inside a single organization. Platform admins only. Rejects unknown capability keys.';

-- ---------------------------------------------------------------------------
-- Phase 5: reusable SVH role presets (fixture — creates roles, assigns nobody)
-- ---------------------------------------------------------------------------
create or replace function public.apply_sports_club_role_presets(p_organization_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  baseline text[] := public.portal_baseline_capability_keys();
  created jsonb := '[]'::jsonb;
  role_id uuid;
begin
  if not public.is_platform_admin() then
    raise exception 'Only Cogniiq platform administrators may apply role presets'
      using errcode = '42501';
  end if;
  if not exists (select 1 from public.organizations o where o.id = p_organization_id) then
    raise exception 'Unknown organization' using errcode = '22023';
  end if;

  role_id := public.upsert_organization_role(
    p_organization_id, 'vorstand', 'Vorstand',
    'Vollzugriff auf alle Bereiche der Vereinsverwaltung.',
    baseline || array[
      'svh.dashboard.view',
      'svh.bookings.view', 'svh.bookings.manage',
      'svh.members.view', 'svh.members.manage',
      'svh.members.applications_review', 'svh.members.numbers_assign',
      'svh.finance.view', 'svh.finance.manage',
      'svh.facilities.view', 'svh.facilities.manage',
      'svh.devices.view', 'svh.devices.manage'
    ], 10);
  created := created || jsonb_build_array(jsonb_build_object('role_key', 'vorstand', 'id', role_id));

  role_id := public.upsert_organization_role(
    p_organization_id, 'mitgliederverwaltung', 'Mitgliederverwaltung',
    'Mitglieder pflegen, Aufnahmeantraege pruefen und Mitgliedsnummern vergeben.',
    baseline || array[
      'svh.dashboard.view',
      'svh.members.view', 'svh.members.manage',
      'svh.members.applications_review', 'svh.members.numbers_assign'
    ], 20);
  created := created || jsonb_build_array(jsonb_build_object('role_key', 'mitgliederverwaltung', 'id', role_id));

  role_id := public.upsert_organization_role(
    p_organization_id, 'kassenwart', 'Kassenwart',
    'Beitraege und Finanzen verwalten, Mitglieder lesend einsehen.',
    baseline || array[
      'svh.dashboard.view',
      'svh.finance.view', 'svh.finance.manage',
      'svh.members.view'
    ], 30);
  created := created || jsonb_build_array(jsonb_build_object('role_key', 'kassenwart', 'id', role_id));

  role_id := public.upsert_organization_role(
    p_organization_id, 'buchungsverwaltung', 'Buchungsverwaltung',
    'Belegungen und Buchungen verwalten, Anlagen lesend einsehen.',
    baseline || array[
      'svh.dashboard.view',
      'svh.bookings.view', 'svh.bookings.manage',
      'svh.facilities.view'
    ], 40);
  created := created || jsonb_build_array(jsonb_build_object('role_key', 'buchungsverwaltung', 'id', role_id));

  role_id := public.upsert_organization_role(
    p_organization_id, 'anlagenverwaltung', 'Anlagenverwaltung',
    'Sportanlagen, Raeume und technische Geraete verwalten.',
    baseline || array[
      'svh.dashboard.view',
      'svh.facilities.view', 'svh.facilities.manage',
      'svh.devices.view', 'svh.devices.manage'
    ], 50);
  created := created || jsonb_build_array(jsonb_build_object('role_key', 'anlagenverwaltung', 'id', role_id));

  role_id := public.upsert_organization_role(
    p_organization_id, 'lesender_administrator', 'Lesender Administrator',
    'Vollstaendiger Lesezugriff ohne jede Aenderungsberechtigung.',
    baseline || array[
      'svh.dashboard.view',
      'svh.bookings.view', 'svh.members.view', 'svh.finance.view',
      'svh.facilities.view', 'svh.devices.view'
    ], 60);
  created := created || jsonb_build_array(jsonb_build_object('role_key', 'lesender_administrator', 'id', role_id));

  return jsonb_build_object('organization_id', p_organization_id, 'roles', created);
end;
$$;

comment on function public.apply_sports_club_role_presets(uuid) is
  'Reusable fixture that creates the six sports-club functional roles (Vorstand, Mitgliederverwaltung, Kassenwart, Buchungsverwaltung, Anlagenverwaltung, Lesender Administrator) inside one organization. It creates ROLES ONLY and assigns them to nobody.';

-- ---------------------------------------------------------------------------
-- Phase 4: invitation claim now also transfers the configured functional roles
-- ---------------------------------------------------------------------------
-- Same name, same arguments, same return type, same email/expiry/status rules, same
-- suspended-membership rule. The only change is the additive role-copy step.
create or replace function public.claim_my_client_invitations()
returns table (organization_id uuid, membership_id uuid)
language plpgsql
security definer
set search_path = public, auth, pg_temp
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

    -- Copy every functional role configured on this invitation onto the membership.
    -- The join on organization_id verifies each role belongs to the invitation's organization;
    -- the composite foreign key on organization_member_roles enforces the same thing structurally.
    -- ON CONFLICT DO NOTHING makes a repeated claim a no-op rather than a duplicate.
    insert into public.organization_member_roles (
      organization_id, organization_member_id, organization_role_id, assigned_by
    )
    select inv.organization_id, mem_id, cir.organization_role_id, acting
    from public.client_invitation_roles cir
    join public.organization_roles orole
      on orole.id = cir.organization_role_id
     and orole.organization_id = inv.organization_id
    where cir.client_invitation_id = inv.id
      and cir.organization_id = inv.organization_id
    on conflict (organization_member_id, organization_role_id) do nothing;

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
  'Idempotent invitation claim. Reads confirmed email from auth.users, claims non-expired pending invitations, creates/activates membership (never reactivates suspended), copies the invitation''s configured functional roles onto the membership exactly once, and activates a pending organization.';

-- ---------------------------------------------------------------------------
-- RLS: every new table is protected and has no browser write path
-- ---------------------------------------------------------------------------
alter table public.capabilities enable row level security;
alter table public.organization_roles enable row level security;
alter table public.organization_role_capabilities enable row level security;
alter table public.organization_member_roles enable row level security;
alter table public.client_invitation_roles enable row level security;

-- Capability catalog: readable by any authenticated user (it is a tenant-free vocabulary and
-- reveals nothing about any customer); mutable by platform admins only.
drop policy if exists "capabilities_select_authenticated" on public.capabilities;
create policy "capabilities_select_authenticated"
  on public.capabilities for select to authenticated
  using (true);
drop policy if exists "capabilities_write_platform_admin" on public.capabilities;
create policy "capabilities_write_platform_admin"
  on public.capabilities for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- Functional roles: readable by active members of the owning organization and by platform admins;
-- writable by platform admins only.
drop policy if exists "organization_roles_select_member_or_admin" on public.organization_roles;
create policy "organization_roles_select_member_or_admin"
  on public.organization_roles for select to authenticated
  using (public.is_platform_admin() or public.is_organization_member(organization_id));
drop policy if exists "organization_roles_write_platform_admin" on public.organization_roles;
create policy "organization_roles_write_platform_admin"
  on public.organization_roles for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists "organization_role_capabilities_select_member_or_admin" on public.organization_role_capabilities;
create policy "organization_role_capabilities_select_member_or_admin"
  on public.organization_role_capabilities for select to authenticated
  using (
    public.is_platform_admin()
    or exists (
      select 1 from public.organization_roles orole
      where orole.id = organization_role_id
        and public.is_organization_member(orole.organization_id)
    )
  );
drop policy if exists "organization_role_capabilities_write_platform_admin" on public.organization_role_capabilities;
create policy "organization_role_capabilities_write_platform_admin"
  on public.organization_role_capabilities for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- Assignments: a user may read assignments inside an organization they are an active member of;
-- only platform admins may write. Ordinary members — including coarse owner/admin — have no write
-- path here at all, so role management cannot be self-served.
drop policy if exists "organization_member_roles_select_member_or_admin" on public.organization_member_roles;
create policy "organization_member_roles_select_member_or_admin"
  on public.organization_member_roles for select to authenticated
  using (public.is_platform_admin() or public.is_organization_member(organization_id));
drop policy if exists "organization_member_roles_write_platform_admin" on public.organization_member_roles;
create policy "organization_member_roles_write_platform_admin"
  on public.organization_member_roles for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- Invitation roles are internal CRM data: platform admins only, matching client_invitations.
drop policy if exists "client_invitation_roles_platform_admin_all" on public.client_invitation_roles;
create policy "client_invitation_roles_platform_admin_all"
  on public.client_invitation_roles for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
-- anon receives nothing at all on any new object.
revoke all on table public.capabilities from public, anon, authenticated;
revoke all on table public.organization_roles from public, anon, authenticated;
revoke all on table public.organization_role_capabilities from public, anon, authenticated;
revoke all on table public.organization_member_roles from public, anon, authenticated;
revoke all on table public.client_invitation_roles from public, anon, authenticated;

-- authenticated gets SELECT only, and RLS still narrows it to the caller's own organizations.
-- Every write goes through a SECURITY DEFINER RPC that re-authorizes; the browser has no direct
-- INSERT/UPDATE/DELETE path to any authorization table.
grant select on table public.capabilities to authenticated;
grant select on table public.organization_roles to authenticated;
grant select on table public.organization_role_capabilities to authenticated;
grant select on table public.organization_member_roles to authenticated;
-- client_invitation_roles: no grant to authenticated at all — internal CRM data, RPC-only.

-- service_role access is deliberate: trusted backend automation (the provisioning Edge Function)
-- may need to read and write invitation role configuration.
grant select, insert, update, delete on table public.capabilities to service_role;
grant select, insert, update, delete on table public.organization_roles to service_role;
grant select, insert, update, delete on table public.organization_role_capabilities to service_role;
grant select, insert, update, delete on table public.organization_member_roles to service_role;
grant select, insert, update, delete on table public.client_invitation_roles to service_role;

-- Revoke from authenticated as well, not only from public and anon. A hosted Supabase project
-- ships ALTER DEFAULT PRIVILEGES granting EXECUTE on new public functions to anon, authenticated
-- and service_role, so a function that is merely "never granted" to authenticated is still
-- reachable by every signed-in user there. Revoking first and granting back below makes the
-- intended audience explicit and independent of the target project's default privileges — which
-- is what actually keeps membership_effective_capability_keys(uuid) unreachable from the browser.
revoke execute on function public.portal_baseline_capability_keys() from public, anon, authenticated;
revoke execute on function public.solution_status_entitles_capabilities(text) from public, anon, authenticated;
revoke execute on function public.membership_effective_capability_keys(uuid) from public, anon, authenticated;
revoke execute on function public.current_user_portal_context() from public, anon, authenticated;
revoke execute on function public.admin_organization_access_overview(uuid) from public, anon, authenticated;
revoke execute on function public.assign_organization_member_role(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.remove_organization_member_role(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.set_client_invitation_roles(uuid, uuid[]) from public, anon, authenticated;
revoke execute on function public.upsert_organization_role(uuid, text, text, text, text[], integer) from public, anon, authenticated;
revoke execute on function public.apply_sports_club_role_presets(uuid) from public, anon, authenticated;

-- Minimal authenticated surface. membership_effective_capability_keys is intentionally NOT granted
-- to authenticated: it takes a membership id and would otherwise let any signed-in user probe
-- another organization's membership. It is reachable only through the two RPCs above, which scope
-- it to auth.uid() or to a verified platform admin.
grant execute on function public.portal_baseline_capability_keys() to authenticated, service_role;
grant execute on function public.solution_status_entitles_capabilities(text) to authenticated, service_role;
grant execute on function public.current_user_portal_context() to authenticated, service_role;
grant execute on function public.admin_organization_access_overview(uuid) to authenticated, service_role;
grant execute on function public.assign_organization_member_role(uuid, uuid) to authenticated, service_role;
grant execute on function public.remove_organization_member_role(uuid, uuid) to authenticated, service_role;
grant execute on function public.set_client_invitation_roles(uuid, uuid[]) to authenticated, service_role;
grant execute on function public.upsert_organization_role(uuid, text, text, text, text[], integer) to authenticated, service_role;
grant execute on function public.apply_sports_club_role_presets(uuid) to authenticated, service_role;

grant execute on function public.membership_effective_capability_keys(uuid) to service_role;

commit;
