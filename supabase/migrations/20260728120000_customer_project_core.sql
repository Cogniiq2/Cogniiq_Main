-- =============================================================================
-- Customer-visible projects — curated, customer-safe projection
-- =============================================================================
-- This is the CUSTOMER-FACING project spine for the authenticated portal (/app).
-- It is deliberately and permanently SEPARATE from the internal CRM
-- (client_engagements) and from the Owner Dashboard's operational tooling
-- (owner_customers / owner_customer_tasks). Neither of those is modified here and
-- neither is ever joined into a customer-reachable result.
--
-- SECURITY MODEL
--   * Customers get NO direct table grant at all. Every customer read goes through
--     a SECURITY DEFINER RPC with an explicit `returns table (...)` allow-list, so
--     the returned column set is fixed at the function boundary and cannot be
--     widened by client-side query shaping (?select=, embedding, joins) the way a
--     view exposed through PostgREST can.
--   * Every SECURITY DEFINER function uses `set search_path = ''` and fully
--     qualifies every object it touches. `pg_temp` is always implicitly searched by
--     PostgreSQL and cannot be removed via search_path, so the only safe posture is
--     an empty path plus full qualification. pg_catalog builtins (now(), coalesce)
--     stay unqualified: pg_catalog is resolved first and cannot be shadowed.
--   * Every `authenticated`-callable RPC explicitly rejects a NULL auth.uid()
--     rather than relying on a membership EXISTS() incidentally returning false.
--   * Organization integrity is enforced by COMPOSITE foreign keys, not by simple
--     id FKs: a simple FK would happily permit a milestone in org A to point at a
--     project in org B. Composite FKs make cross-organization relationships
--     structurally impossible.
--
-- This migration is TRANSACTIONAL and DETERMINISTIC. Structural DDL is written
-- bare (no IF NOT EXISTS), so re-applying it against a drifted schema fails loudly
-- and rolls back rather than silently no-opping into an inconsistent state.
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- Composite unique anchor on the internal engagement table.
-- Required so customer_projects.engagement_id can use a COMPOSITE fk and can
-- therefore never reference an engagement belonging to a different organization.
-- Purely additive: id is already the primary key, so (organization_id, id) is
-- trivially unique. client_engagements is NOT otherwise modified.
-- ---------------------------------------------------------------------------
alter table public.client_engagements
  add constraint client_engagements_org_id_unique unique (organization_id, id);

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.customer_project_status as enum (
  'on_track', 'attention_needed', 'blocked', 'completed', 'paused'
);

create type public.customer_next_action_owner as enum ('customer', 'cogniiq');

create type public.customer_milestone_status as enum (
  'upcoming', 'in_progress', 'completed', 'delayed', 'cancelled'
);

-- ---------------------------------------------------------------------------
-- customer_projects
-- ---------------------------------------------------------------------------
create table public.customer_projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,

  -- Internal provenance only. NEVER returned by any customer-facing RPC.
  -- Composite FK: an engagement from another organization cannot be attached.
  engagement_id uuid,

  title text not null,
  business_objective text not null,
  status public.customer_project_status not null default 'on_track',
  phase text not null,
  progress_percent smallint not null default 0,
  start_date date,
  target_date date,

  next_action_summary text,
  next_action_owner public.customer_next_action_owner,
  next_action_due_date date,

  customer_safe_blocker_summary text,

  -- Verified internal contact. The role is re-checked at READ time (not only at
  -- assignment time) by the read RPCs, so a profile that loses its Cogniiq role
  -- stops being surfaced to customers immediately.
  contact_profile_id uuid references public.profiles(id) on delete set null,
  contact_role_label text,
  -- Curated business address for customer contact. Deliberately a separate field:
  -- profiles.email is a private internal address and is NEVER auto-exposed.
  contact_business_email text,

  is_archived boolean not null default false,

  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint customer_projects_title_not_blank check (length(trim(title)) > 0),
  constraint customer_projects_objective_not_blank check (length(trim(business_objective)) > 0),
  constraint customer_projects_phase_not_blank check (length(trim(phase)) > 0),
  constraint customer_projects_progress_range check (progress_percent between 0 and 100),
  constraint customer_projects_dates_order check (
    target_date is null or start_date is null or target_date >= start_date
  ),
  -- Next-action fields are strictly all-or-nothing with respect to the summary:
  -- no owner and no due date may exist without a summary to describe them.
  constraint customer_projects_next_action_consistency check (
    (next_action_summary is null and next_action_owner is null and next_action_due_date is null)
    or (next_action_summary is not null and next_action_owner is not null)
  ),
  constraint customer_projects_contact_email_format check (
    contact_business_email is null
    or contact_business_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  ),
  -- Composite anchor consumed by milestones, documents and the invoice link table.
  constraint customer_projects_org_id_unique unique (organization_id, id),
  constraint customer_projects_engagement_fk
    foreign key (organization_id, engagement_id)
    references public.client_engagements (organization_id, id)
    on delete set null (engagement_id)
);

create index customer_projects_org_active_idx
  on public.customer_projects (organization_id)
  where is_archived = false;

comment on table public.customer_projects is
  'Customer-visible project projection. Curated by Cogniiq; never a view over client_engagements. Contains no internal notes, budgets, estimates, margins or internal task state.';
comment on column public.customer_projects.engagement_id is
  'Internal provenance link. NEVER returned by a customer-facing RPC.';

-- ---------------------------------------------------------------------------
-- customer_project_milestones
-- ---------------------------------------------------------------------------
create table public.customer_project_milestones (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null,
  title text not null,
  description text,
  status public.customer_milestone_status not null default 'upcoming',
  target_date date,
  completed_at timestamptz,
  sort_order integer not null default 0,
  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint customer_project_milestones_title_not_blank check (length(trim(title)) > 0),
  constraint customer_project_milestones_completed_consistency check (
    (status = 'completed') = (completed_at is not null)
  ),
  constraint customer_project_milestones_project_fk
    foreign key (organization_id, project_id)
    references public.customer_projects (organization_id, id)
    on delete cascade
);

create index customer_project_milestones_project_idx
  on public.customer_project_milestones (project_id, sort_order, id);

comment on table public.customer_project_milestones is
  'Customer-visible milestones. Customers hold NO direct grant; created_by/updated_by are never exposed by the read RPC.';

-- ---------------------------------------------------------------------------
-- updated_at maintenance (reuses the existing, already-locked-down helper)
-- ---------------------------------------------------------------------------
create trigger customer_projects_set_updated_at
before update on public.customer_projects
for each row execute function public.set_updated_at();

create trigger customer_project_milestones_set_updated_at
before update on public.customer_project_milestones
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Contact integrity: contact_profile_id must reference an INTERNAL Cogniiq
-- profile. SECURITY DEFINER because profiles is RLS-gated to self/admin, so a
-- plain invoker-rights trigger would see no row for a colleague's profile and
-- would reject a perfectly valid assignment.
-- ---------------------------------------------------------------------------
create or replace function public.guard_customer_project_contact_is_internal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.contact_profile_id is not null and not exists (
    select 1
    from public.profiles p
    where p.id = new.contact_profile_id
      and p.platform_role in ('cogniiq_admin', 'cogniiq_owner')
  ) then
    raise exception 'contact_profile_id must reference an internal Cogniiq profile';
  end if;
  return new;
end;
$$;

revoke all on function public.guard_customer_project_contact_is_internal() from public, anon, authenticated;

create trigger customer_projects_contact_internal_guard
before insert or update of contact_profile_id on public.customer_projects
for each row execute function public.guard_customer_project_contact_is_internal();

-- ---------------------------------------------------------------------------
-- RLS: deny by default. Customers get NO policy here at all — their only path in
-- is a SECURITY DEFINER RPC. Internal staff manage rows directly.
-- ---------------------------------------------------------------------------
alter table public.customer_projects enable row level security;
alter table public.customer_project_milestones enable row level security;

revoke all on public.customer_projects from public, anon, authenticated;
revoke all on public.customer_project_milestones from public, anon, authenticated;

create policy customer_projects_internal_all on public.customer_projects
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy customer_project_milestones_internal_all on public.customer_project_milestones
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

grant select, insert, update, delete on public.customer_projects to authenticated;
grant select, insert, update, delete on public.customer_project_milestones to authenticated;

-- =============================================================================
-- CUSTOMER READ RPCs
-- =============================================================================
-- Column allow-lists are the `returns table (...)` signatures below. Note what is
-- absent by construction: engagement_id, created_by, updated_by, is_archived.
--
-- Contact data is joined through a role re-check (p.platform_role in (...)) so a
-- profile that has lost its internal role stops being surfaced immediately —
-- the role at assignment time is never trusted on its own.
-- =============================================================================

create or replace function public.list_customer_projects()
returns table (
  id uuid,
  organization_id uuid,
  title text,
  business_objective text,
  status public.customer_project_status,
  phase text,
  progress_percent smallint,
  start_date date,
  target_date date,
  next_action_summary text,
  next_action_owner public.customer_next_action_owner,
  next_action_due_date date,
  customer_safe_blocker_summary text,
  contact_display_name text,
  contact_role_label text,
  contact_business_email text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'authentication required';
  end if;

  return query
  select
    p.id,
    p.organization_id,
    p.title,
    p.business_objective,
    p.status,
    p.phase,
    p.progress_percent,
    p.start_date,
    p.target_date,
    p.next_action_summary,
    p.next_action_owner,
    p.next_action_due_date,
    p.customer_safe_blocker_summary,
    contact.full_name,
    case when contact.id is null then null else p.contact_role_label end,
    case when contact.id is null then null else p.contact_business_email end,
    p.created_at,
    p.updated_at
  from public.customer_projects p
  left join public.profiles contact
    on contact.id = p.contact_profile_id
   and contact.platform_role in ('cogniiq_admin', 'cogniiq_owner')
  where p.is_archived = false
    and public.is_organization_member(p.organization_id)
  order by p.next_action_due_date asc nulls last, p.created_at asc, p.id asc;
end;
$$;

comment on function public.list_customer_projects() is
  'Customer-facing project list. Excludes archived projects. Deterministic order: soonest next-action due date first, then creation time, then id. Contact fields are suppressed unless the referenced profile CURRENTLY holds an internal Cogniiq role.';

create or replace function public.get_customer_project(p_project_id uuid)
returns table (
  id uuid,
  organization_id uuid,
  title text,
  business_objective text,
  status public.customer_project_status,
  phase text,
  progress_percent smallint,
  start_date date,
  target_date date,
  next_action_summary text,
  next_action_owner public.customer_next_action_owner,
  next_action_due_date date,
  customer_safe_blocker_summary text,
  contact_display_name text,
  contact_role_label text,
  contact_business_email text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'authentication required';
  end if;

  return query
  select
    p.id, p.organization_id, p.title, p.business_objective, p.status, p.phase,
    p.progress_percent, p.start_date, p.target_date,
    p.next_action_summary, p.next_action_owner, p.next_action_due_date,
    p.customer_safe_blocker_summary,
    contact.full_name,
    case when contact.id is null then null else p.contact_role_label end,
    case when contact.id is null then null else p.contact_business_email end,
    p.created_at, p.updated_at
  from public.customer_projects p
  left join public.profiles contact
    on contact.id = p.contact_profile_id
   and contact.platform_role in ('cogniiq_admin', 'cogniiq_owner')
  where p.id = p_project_id
    and p.is_archived = false
    and public.is_organization_member(p.organization_id);

  -- A project in another organization, an archived project and a nonexistent id
  -- are deliberately indistinguishable: all three simply return zero rows.
end;
$$;

create or replace function public.list_customer_project_milestones(p_project_id uuid)
returns table (
  id uuid,
  project_id uuid,
  title text,
  description text,
  status public.customer_milestone_status,
  target_date date,
  completed_at timestamptz,
  sort_order integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'authentication required';
  end if;

  -- Single query joined through the parent project: there is no separate
  -- "does this project exist" probe, so an unauthorized project and an empty
  -- project are indistinguishable (both return zero rows).
  return query
  select m.id, m.project_id, m.title, m.description, m.status,
         m.target_date, m.completed_at, m.sort_order
  from public.customer_project_milestones m
  join public.customer_projects p
    on p.organization_id = m.organization_id
   and p.id = m.project_id
  where m.project_id = p_project_id
    and p.is_archived = false
    and public.is_organization_member(m.organization_id)
  order by m.sort_order asc, m.target_date asc nulls last, m.id asc;
end;
$$;

revoke all on function public.list_customer_projects() from public, anon;
revoke all on function public.get_customer_project(uuid) from public, anon;
revoke all on function public.list_customer_project_milestones(uuid) from public, anon;
grant execute on function public.list_customer_projects() to authenticated;
grant execute on function public.get_customer_project(uuid) to authenticated;
grant execute on function public.list_customer_project_milestones(uuid) to authenticated;

-- =============================================================================
-- OWNER / ADMIN WRITE RPCs
-- =============================================================================

-- A CRM customer only becomes a tenant once portal provisioning has linked it to
-- an organization. owner_customers.organization_id is nullable precisely because
-- leads and non-portal customers exist. Creating a customer-visible project
-- without that link is impossible, and fails with an actionable message rather
-- than silently producing an unreachable row.
create or replace function public.create_customer_project_for_owner_customer(
  p_owner_customer_id uuid,
  p_title text,
  p_business_objective text,
  p_phase text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
  v_project_id uuid;
begin
  if not public.is_platform_admin() then
    raise exception using errcode = '42501', message = 'not authorized';
  end if;

  select oc.organization_id into v_org
  from public.owner_customers oc
  where oc.id = p_owner_customer_id;

  if not found then
    raise exception 'owner customer % not found', p_owner_customer_id;
  end if;

  if v_org is null then
    raise exception 'This customer has no linked organization yet. Complete portal provisioning (invitation) before creating a customer-visible project.';
  end if;

  insert into public.customer_projects (
    organization_id, title, business_objective, phase, created_by, updated_by
  )
  values (v_org, p_title, p_business_objective, p_phase, auth.uid(), auth.uid())
  returning customer_projects.id into v_project_id;

  return v_project_id;
end;
$$;

create or replace function public.update_customer_project(
  p_project_id uuid,
  p_title text,
  p_business_objective text,
  p_phase text,
  p_status public.customer_project_status,
  p_progress_percent smallint,
  p_start_date date,
  p_target_date date,
  p_customer_safe_blocker_summary text,
  p_contact_profile_id uuid,
  p_contact_role_label text,
  p_contact_business_email text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception using errcode = '42501', message = 'not authorized';
  end if;

  update public.customer_projects
  set title = p_title,
      business_objective = p_business_objective,
      phase = p_phase,
      status = p_status,
      progress_percent = p_progress_percent,
      start_date = p_start_date,
      target_date = p_target_date,
      customer_safe_blocker_summary = p_customer_safe_blocker_summary,
      contact_profile_id = p_contact_profile_id,
      contact_role_label = p_contact_role_label,
      contact_business_email = p_contact_business_email,
      updated_by = auth.uid()
  where id = p_project_id;

  if not found then
    raise exception 'customer project % not found', p_project_id;
  end if;
end;
$$;

create or replace function public.set_customer_project_next_action(
  p_project_id uuid,
  p_summary text,
  p_owner public.customer_next_action_owner,
  p_due_date date
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_summary text := nullif(trim(coalesce(p_summary, '')), '');
begin
  if not public.is_platform_admin() then
    raise exception using errcode = '42501', message = 'not authorized';
  end if;

  -- Enforce the all-or-nothing rule proactively, with a clear message, before it
  -- can surface as a raw check-constraint violation.
  if v_summary is null and (p_owner is not null or p_due_date is not null) then
    raise exception 'next action owner and due date require a next action summary';
  end if;
  if v_summary is not null and p_owner is null then
    raise exception 'next action summary requires an owner (customer or cogniiq)';
  end if;

  update public.customer_projects
  set next_action_summary = v_summary,
      next_action_owner = case when v_summary is null then null else p_owner end,
      next_action_due_date = case when v_summary is null then null else p_due_date end,
      updated_by = auth.uid()
  where id = p_project_id;

  if not found then
    raise exception 'customer project % not found', p_project_id;
  end if;
end;
$$;

create or replace function public.archive_customer_project(p_project_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception using errcode = '42501', message = 'not authorized';
  end if;

  update public.customer_projects
  set is_archived = true, updated_by = auth.uid()
  where id = p_project_id;

  if not found then
    raise exception 'customer project % not found', p_project_id;
  end if;
end;
$$;

create or replace function public.create_customer_project_milestone(
  p_project_id uuid,
  p_title text,
  p_description text,
  p_target_date date,
  p_sort_order integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
  v_milestone_id uuid;
begin
  if not public.is_platform_admin() then
    raise exception using errcode = '42501', message = 'not authorized';
  end if;

  select p.organization_id into v_org
  from public.customer_projects p
  where p.id = p_project_id;

  if not found then
    raise exception 'customer project % not found', p_project_id;
  end if;

  insert into public.customer_project_milestones (
    organization_id, project_id, title, description, target_date, sort_order, created_by, updated_by
  )
  values (v_org, p_project_id, p_title, p_description, p_target_date, coalesce(p_sort_order, 0), auth.uid(), auth.uid())
  returning customer_project_milestones.id into v_milestone_id;

  return v_milestone_id;
end;
$$;

create or replace function public.update_customer_project_milestone(
  p_milestone_id uuid,
  p_title text,
  p_description text,
  p_status public.customer_milestone_status,
  p_target_date date,
  p_sort_order integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception using errcode = '42501', message = 'not authorized';
  end if;

  update public.customer_project_milestones
  set title = p_title,
      description = p_description,
      status = p_status,
      -- completed_at is derived from status, never supplied by the caller, so the
      -- (status = 'completed') = (completed_at is not null) invariant cannot be broken.
      completed_at = case
        when p_status = 'completed' then coalesce(completed_at, now())
        else null
      end,
      target_date = p_target_date,
      sort_order = coalesce(p_sort_order, sort_order),
      updated_by = auth.uid()
  where id = p_milestone_id;

  if not found then
    raise exception 'customer project milestone % not found', p_milestone_id;
  end if;
end;
$$;

create or replace function public.delete_customer_project_milestone(p_milestone_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception using errcode = '42501', message = 'not authorized';
  end if;

  delete from public.customer_project_milestones where id = p_milestone_id;

  if not found then
    raise exception 'customer project milestone % not found', p_milestone_id;
  end if;
end;
$$;

revoke all on function public.create_customer_project_for_owner_customer(uuid, text, text, text) from public, anon;
revoke all on function public.update_customer_project(uuid, text, text, text, public.customer_project_status, smallint, date, date, text, uuid, text, text) from public, anon;
revoke all on function public.set_customer_project_next_action(uuid, text, public.customer_next_action_owner, date) from public, anon;
revoke all on function public.archive_customer_project(uuid) from public, anon;
revoke all on function public.create_customer_project_milestone(uuid, text, text, date, integer) from public, anon;
revoke all on function public.update_customer_project_milestone(uuid, text, text, public.customer_milestone_status, date, integer) from public, anon;
revoke all on function public.delete_customer_project_milestone(uuid) from public, anon;

grant execute on function public.create_customer_project_for_owner_customer(uuid, text, text, text) to authenticated;
grant execute on function public.update_customer_project(uuid, text, text, text, public.customer_project_status, smallint, date, date, text, uuid, text, text) to authenticated;
grant execute on function public.set_customer_project_next_action(uuid, text, public.customer_next_action_owner, date) to authenticated;
grant execute on function public.archive_customer_project(uuid) to authenticated;
grant execute on function public.create_customer_project_milestone(uuid, text, text, date, integer) to authenticated;
grant execute on function public.update_customer_project_milestone(uuid, text, text, public.customer_milestone_status, date, integer) to authenticated;
grant execute on function public.delete_customer_project_milestone(uuid) to authenticated;

commit;
