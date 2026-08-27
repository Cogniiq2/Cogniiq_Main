-- =============================================================================
-- Client service delivery + AI-Receptionist onboarding operating system.
--
-- Adds a service layer UNDERNEATH the existing canonical customer spine
-- (public.owner_customers, migrations 20260724120000 / 20260824171403). The
-- customer stays the single canonical entity: nothing here duplicates a name, an
-- address or an email. A customer receives one or more SERVICES, and each service
-- opens exactly one ENGAGEMENT -- the internal delivery workspace.
--
-- Template-driven: an engagement is INSTANTIATED from a versioned template and
-- SNAPSHOTS its sections, tasks and fields at that moment. A later template
-- version therefore never silently mutates a running engagement; it only affects
-- engagements created after it.
--
-- Structured data and actionable tasks are separate concepts and separate tables.
-- Appointment types are relational (one-to-many), not a JSON blob.
--
-- FULLY ADDITIVE + IDEMPOTENT: only CREATE ... IF NOT EXISTS, CREATE OR REPLACE,
-- and DROP/CREATE for triggers and policies. No previously applied migration is
-- modified; owner_customer_detail(uuid) is deliberately left untouched.
--
-- Owner-only throughout: RLS is deny-by-default and every mutation goes through a
-- SECURITY DEFINER, is_platform_owner()-gated RPC. anon gets nothing; the customer
-- portal has no path to any table in this file. No secret value is ever stored --
-- credential fields record STATUS only.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Service catalogue: which services a customer receives.
-- ---------------------------------------------------------------------------
begin;

create table if not exists public.owner_customer_services (
  id uuid primary key default gen_random_uuid(),
  business_entity_id uuid not null references public.owner_business_entities(id) on delete restrict,
  customer_id uuid not null references public.owner_customers(id) on delete cascade,
  service_key text not null
    check (service_key in ('ai_receptionist', 'automations', 'website', 'custom_project')),
  -- Services are never hard-deleted once work exists: they are paused or archived.
  state text not null default 'active'
    check (state in ('active', 'paused', 'archived')),
  label text,
  notes text,
  activated_at timestamptz not null default now(),
  paused_at timestamptz,
  archived_at timestamptz,
  archived_by uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- One row per service per customer. This is the duplicate guard: adding
  -- "AI Receptionist" twice is impossible, so an engagement cannot be
  -- instantiated twice either.
  constraint owner_customer_services_unique unique (customer_id, service_key)
);
create index if not exists owner_customer_services_customer_idx
  on public.owner_customer_services (customer_id, service_key);
create index if not exists owner_customer_services_entity_state_idx
  on public.owner_customer_services (business_entity_id, service_key, state);

commit;

-- ---------------------------------------------------------------------------
-- 2. Templates. Versioned blueprints; content tables are pure definition and are
--    only ever READ during instantiation.
-- ---------------------------------------------------------------------------
begin;

create table if not exists public.owner_service_templates (
  id uuid primary key default gen_random_uuid(),
  service_key text not null
    check (service_key in ('ai_receptionist', 'automations', 'website', 'custom_project')),
  code text not null,
  version int not null check (version > 0),
  title text not null,
  description text,
  -- The active template for a service_key is what new engagements instantiate.
  is_active boolean not null default true,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint owner_service_templates_code_version_unique unique (code, version)
);
create index if not exists owner_service_templates_active_idx
  on public.owner_service_templates (service_key, is_active, version desc);

create table if not exists public.owner_service_template_sections (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.owner_service_templates(id) on delete cascade,
  code text not null,
  title text not null,
  description text,
  -- The small set of primary navigation areas the operational sections fold into.
  nav_group text not null
    check (nav_group in ('overview', 'discovery', 'compliance', 'integration',
                         'agent', 'telephony', 'testing', 'golive', 'monitoring')),
  readiness_category text not null
    check (readiness_category in ('commercial', 'discovery', 'legal', 'integration',
                                  'knowledge', 'agent', 'backend', 'telephony',
                                  'testing', 'client_approval')),
  healthcare_only boolean not null default false,
  sort_order int not null default 0,
  constraint owner_service_template_sections_unique unique (template_id, code)
);

create table if not exists public.owner_service_template_tasks (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.owner_service_templates(id) on delete cascade,
  section_id uuid not null references public.owner_service_template_sections(id) on delete cascade,
  -- Stable machine-readable code (LEG-003). Metadata, never the UI hierarchy.
  code text not null,
  title text not null,
  description text,
  is_required boolean not null default true,
  is_go_live_blocker boolean not null default false,
  healthcare_only boolean not null default false,
  -- Optional override; null inherits the section's readiness category.
  readiness_category text
    check (readiness_category is null or readiness_category in
      ('commercial', 'discovery', 'legal', 'integration', 'knowledge', 'agent',
       'backend', 'telephony', 'testing', 'client_approval')),
  sort_order int not null default 0,
  constraint owner_service_template_tasks_unique unique (template_id, code)
);
create index if not exists owner_service_template_tasks_section_idx
  on public.owner_service_template_tasks (section_id, sort_order);

create table if not exists public.owner_service_template_fields (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.owner_service_templates(id) on delete cascade,
  section_id uuid not null references public.owner_service_template_sections(id) on delete cascade,
  code text not null,
  label text not null,
  description text,
  data_type text not null
    check (data_type in ('text', 'textarea', 'number', 'boolean', 'select', 'date', 'url', 'phone')),
  -- [{value,label}] for data_type='select'. A list of options, not a data dump.
  options jsonb not null default '[]'::jsonb,
  unit text,
  placeholder text,
  is_required boolean not null default false,
  is_go_live_blocker boolean not null default false,
  healthcare_only boolean not null default false,
  sort_order int not null default 0,
  constraint owner_service_template_fields_unique unique (template_id, code),
  constraint owner_service_template_fields_options_is_array check (jsonb_typeof(options) = 'array')
);
create index if not exists owner_service_template_fields_section_idx
  on public.owner_service_template_fields (section_id, sort_order);

commit;

-- ---------------------------------------------------------------------------
-- 3. Engagements: the instantiated delivery workspace.
-- ---------------------------------------------------------------------------
begin;

create table if not exists public.owner_service_engagements (
  id uuid primary key default gen_random_uuid(),
  business_entity_id uuid not null references public.owner_business_entities(id) on delete restrict,
  customer_id uuid not null references public.owner_customers(id) on delete cascade,
  -- 1:1 with the service row. UNIQUE is the second duplicate guard.
  customer_service_id uuid not null unique
    references public.owner_customer_services(id) on delete cascade,
  service_key text not null
    check (service_key in ('ai_receptionist', 'automations', 'website', 'custom_project')),
  -- Snapshot of the template this engagement was instantiated from. The template
  -- may be superseded; this engagement keeps the version it was born with.
  template_id uuid references public.owner_service_templates(id) on delete set null,
  template_code text,
  template_version int,
  lifecycle_status text not null default 'lead'
    check (lifecycle_status in ('lead', 'contracted', 'discovery', 'building', 'integrating',
                                'testing', 'client_approval', 'ready_for_go_live', 'live', 'monitoring')),
  -- Applicability switch: healthcare-only sections/tasks/fields fold away when false.
  healthcare boolean not null default false,
  -- FULL_AUTOMATION means the operation completes in the client's own system.
  -- PARTIAL_AUTOMATION requires the exact limitation to be written down.
  integration_mode text
    check (integration_mode is null or integration_mode in ('full_automation', 'partial_automation')),
  integration_limitations text,
  summary text,
  go_live_target_date date,
  went_live_at timestamptz,
  monitoring_until date,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A partial integration without a written limitation is exactly the failure mode
  -- this system exists to prevent, so the database refuses it.
  constraint owner_service_engagements_partial_needs_limitation check (
    integration_mode is distinct from 'partial_automation'
    or length(trim(coalesce(integration_limitations, ''))) > 0
  )
);
create index if not exists owner_service_engagements_customer_idx
  on public.owner_service_engagements (customer_id, service_key);
create index if not exists owner_service_engagements_entity_status_idx
  on public.owner_service_engagements (business_entity_id, lifecycle_status);
-- Referencing columns get their own index. Without one, every ON DELETE SET NULL / CASCADE
-- on the parent has to sequentially scan this table while holding a lock on it.
create index if not exists owner_service_engagements_template_idx
  on public.owner_service_engagements (template_id) where template_id is not null;

create table if not exists public.owner_engagement_sections (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references public.owner_service_engagements(id) on delete cascade,
  code text not null,
  title text not null,
  description text,
  nav_group text not null,
  readiness_category text not null,
  healthcare_only boolean not null default false,
  sort_order int not null default 0,
  constraint owner_engagement_sections_unique unique (engagement_id, code)
);
create index if not exists owner_engagement_sections_engagement_idx
  on public.owner_engagement_sections (engagement_id, sort_order);

create table if not exists public.owner_engagement_tasks (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references public.owner_service_engagements(id) on delete cascade,
  -- Provenance only; a template row may later be edited or removed without
  -- touching this instance, hence ON DELETE SET NULL and the copied columns.
  template_task_id uuid references public.owner_service_template_tasks(id) on delete set null,
  section_code text not null,
  code text not null,
  title text not null,
  description text,
  readiness_category text not null,
  is_required boolean not null default true,
  is_go_live_blocker boolean not null default false,
  healthcare_only boolean not null default false,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'waiting_for_client',
                      'blocked', 'complete', 'not_applicable')),
  -- BLOCKED must say why. WAITING_FOR_CLIENT must say what is needed.
  blocker_reason text,
  client_request text,
  evidence_url text,
  evidence_note text,
  notes text,
  reviewer text,
  completed_by uuid references public.profiles(id) on delete set null,
  completed_at timestamptz,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint owner_engagement_tasks_unique unique (engagement_id, code),
  constraint owner_engagement_tasks_blocked_needs_reason check (
    status <> 'blocked' or length(trim(coalesce(blocker_reason, ''))) > 0
  ),
  constraint owner_engagement_tasks_completion_consistent check (
    (status = 'complete') = (completed_at is not null)
  )
);
create index if not exists owner_engagement_tasks_engagement_idx
  on public.owner_engagement_tasks (engagement_id, section_code, sort_order);
create index if not exists owner_engagement_tasks_status_idx
  on public.owner_engagement_tasks (engagement_id, status);
-- The blocker query the command centre runs on every load.
create index if not exists owner_engagement_tasks_blocker_idx
  on public.owner_engagement_tasks (engagement_id) where is_go_live_blocker;
create index if not exists owner_engagement_tasks_template_task_idx
  on public.owner_engagement_tasks (template_task_id) where template_task_id is not null;

-- Structured client / implementation DATA. Deliberately not tasks, and
-- deliberately not one JSON blob: each value lives in a typed column and every
-- field is addressable by (engagement_id, code), so "which client runs which PVS"
-- and "which ElevenLabs agent id belongs to whom" are ordinary indexed queries.
create table if not exists public.owner_engagement_fields (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references public.owner_service_engagements(id) on delete cascade,
  template_field_id uuid references public.owner_service_template_fields(id) on delete set null,
  section_code text not null,
  code text not null,
  label text not null,
  description text,
  data_type text not null
    check (data_type in ('text', 'textarea', 'number', 'boolean', 'select', 'date', 'url', 'phone')),
  options jsonb not null default '[]'::jsonb,
  unit text,
  placeholder text,
  is_required boolean not null default false,
  is_go_live_blocker boolean not null default false,
  healthcare_only boolean not null default false,
  value_text text,
  value_number numeric,
  value_bool boolean,
  value_date date,
  -- Explicitly marked not-applicable for this client; excluded from readiness.
  not_applicable boolean not null default false,
  sort_order int not null default 0,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint owner_engagement_fields_unique unique (engagement_id, code)
);
create index if not exists owner_engagement_fields_engagement_idx
  on public.owner_engagement_fields (engagement_id, section_code, sort_order);
-- Cross-client identifier lookup ("who owns agent X").
create index if not exists owner_engagement_fields_code_value_idx
  on public.owner_engagement_fields (code, value_text) where value_text is not null;
create index if not exists owner_engagement_fields_template_field_idx
  on public.owner_engagement_fields (template_field_id) where template_field_id is not null;

-- One-to-many appointment / service definitions. Relational because they are
-- queried, counted and compared -- never a blob.
create table if not exists public.owner_engagement_appointment_types (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references public.owner_service_engagements(id) on delete cascade,
  internal_ref text,
  spoken_name text not null,
  duration_minutes int check (duration_minutes is null or duration_minutes > 0),
  location text,
  provider text,
  new_patients_allowed boolean not null default true,
  existing_patients_only boolean not null default false,
  prerequisites text,
  required_information text,
  booking_horizon_days int check (booking_horizon_days is null or booking_horizon_days >= 0),
  cancellation_rules text,
  rescheduling_rules text,
  restrictions text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint owner_engagement_appointment_types_name_not_blank check (length(trim(spoken_name)) > 0)
);
create index if not exists owner_engagement_appointment_types_engagement_idx
  on public.owner_engagement_appointment_types (engagement_id, sort_order);

-- Append-only, sanitized audit trail for meaningful state changes. Never a
-- keystroke log: only the events raised by the RPCs below write here.
create table if not exists public.owner_engagement_activity (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references public.owner_service_engagements(id) on delete cascade,
  customer_id uuid not null references public.owner_customers(id) on delete cascade,
  event_type text not null,
  summary text not null,
  task_id uuid references public.owner_engagement_tasks(id) on delete set null,
  field_code text,
  actor_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists owner_engagement_activity_engagement_idx
  on public.owner_engagement_activity (engagement_id, created_at desc);
-- Both referencing columns are indexed so deleting a customer, or a task, never degrades
-- into a sequential scan of the whole activity trail.
create index if not exists owner_engagement_activity_customer_idx
  on public.owner_engagement_activity (customer_id, created_at desc);
create index if not exists owner_engagement_activity_task_idx
  on public.owner_engagement_activity (task_id) where task_id is not null;

commit;

-- ---------------------------------------------------------------------------
-- 4. Triggers: updated_at + append-only audit rows, reusing the existing factory.
-- ---------------------------------------------------------------------------
begin;

do $$
declare t text;
begin
  foreach t in array array[
    'owner_customer_services', 'owner_service_templates', 'owner_service_engagements',
    'owner_engagement_tasks', 'owner_engagement_fields', 'owner_engagement_appointment_types'
  ] loop
    execute format('drop trigger if exists %I on public.%I', t || '_set_updated_at', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_set_updated_at', t);
  end loop;

  foreach t in array array[
    'owner_customer_services', 'owner_service_engagements', 'owner_engagement_tasks',
    'owner_engagement_fields'
  ] loop
    execute format('drop trigger if exists %I on public.%I', t || '_audit', t);
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function public.owner_write_audit_row(%L)', t || '_audit', t, t);
  end loop;
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 5. RLS + grants. Deny by default; owner-only; anon gets nothing. The activity
--    table is append-only for owners (no update, no delete).
-- ---------------------------------------------------------------------------
begin;

do $$
declare t text;
begin
  foreach t in array array[
    'owner_customer_services', 'owner_service_templates', 'owner_service_template_sections',
    'owner_service_template_tasks', 'owner_service_template_fields',
    'owner_service_engagements', 'owner_engagement_sections', 'owner_engagement_tasks',
    'owner_engagement_fields', 'owner_engagement_appointment_types'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_owner_all', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.is_platform_owner()) with check (public.is_platform_owner())', t || '_owner_all', t);
    execute format('revoke all on table public.%I from public, anon, authenticated', t);
    execute format('grant select on table public.%I to authenticated', t);
    execute format('grant select, insert, update, delete on table public.%I to service_role', t);
  end loop;
end;
$$;

alter table public.owner_engagement_activity enable row level security;
drop policy if exists owner_engagement_activity_owner_select on public.owner_engagement_activity;
create policy owner_engagement_activity_owner_select on public.owner_engagement_activity
  for select to authenticated using (public.is_platform_owner());
revoke all on table public.owner_engagement_activity from public, anon, authenticated;
grant select on table public.owner_engagement_activity to authenticated;
grant select, insert on table public.owner_engagement_activity to service_role;

commit;

-- ---------------------------------------------------------------------------
-- 6. Activity helper. SECURITY DEFINER, only reachable from the RPCs below.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_record_engagement_activity(
  p_engagement_id uuid, p_event_type text, p_summary text,
  p_task_id uuid default null, p_field_code text default null
) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_customer uuid;
begin
  select customer_id into v_customer from public.owner_service_engagements where id = p_engagement_id;
  if v_customer is null then return; end if;
  insert into public.owner_engagement_activity
    (engagement_id, customer_id, event_type, summary, task_id, field_code, actor_user_id)
  values (p_engagement_id, v_customer, p_event_type, left(p_summary, 500), p_task_id, p_field_code, auth.uid());
  update public.owner_customers set last_activity_at = now() where id = v_customer;
end;
$$;
revoke execute on function public.owner_record_engagement_activity(uuid, text, text, uuid, text) from public, anon, authenticated;
grant execute on function public.owner_record_engagement_activity(uuid, text, text, uuid, text) to service_role;

commit;

-- ---------------------------------------------------------------------------
-- 7. Applicability + go-live gate. Both are pure, deterministic SQL so the
--    server -- not the browser -- decides whether a client may go live.
--
--    Applicability rules (the SAME rules the TypeScript readiness engine uses;
--    the engine is covered by unit tests and this function is the authority):
--      * healthcare_only rows do not apply to a non-healthcare engagement
--      * a task explicitly set to NOT_APPLICABLE does not apply
--      * a field explicitly marked not_applicable does not apply
--    Non-applicable items are excluded from readiness entirely -- they never
--    reduce a percentage and they are never blockers.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_engagement_go_live_blockers(p_engagement_id uuid)
returns jsonb language sql security definer stable set search_path = public, pg_temp as $$
  with e as (
    select * from public.owner_service_engagements where id = p_engagement_id
  ),
  task_blockers as (
    select jsonb_build_object(
             'kind', 'task', 'id', t.id, 'code', t.code, 'title', t.title,
             'category', t.readiness_category, 'section_code', t.section_code,
             'status', t.status, 'reason', t.blocker_reason, 'client_request', t.client_request)
             as item
    from public.owner_engagement_tasks t, e
    where t.engagement_id = p_engagement_id
      and t.is_go_live_blocker
      and t.status <> 'complete'
      and t.status <> 'not_applicable'
      and (not t.healthcare_only or e.healthcare)
  ),
  field_blockers as (
    select jsonb_build_object(
             'kind', 'field', 'id', f.id, 'code', f.code, 'title', f.label,
             'category', null, 'section_code', f.section_code,
             'status', 'missing', 'reason', null, 'client_request', null)
             as item
    from public.owner_engagement_fields f, e
    where f.engagement_id = p_engagement_id
      and f.is_go_live_blocker
      and not f.not_applicable
      and (not f.healthcare_only or e.healthcare)
      and f.value_text is null and f.value_number is null
      and f.value_bool is null and f.value_date is null
  ),
  all_blockers as (
    select item from task_blockers union all select item from field_blockers
  )
  select jsonb_build_object(
    'ready', (select count(*) = 0 from all_blockers),
    'count', (select count(*) from all_blockers),
    'blockers', coalesce((select jsonb_agg(item) from all_blockers), '[]'::jsonb)
  );
$$;

-- INTERNAL ONLY. This function is SECURITY DEFINER and carries no owner check of its own,
-- so it must never be reachable from a browser role: it would otherwise let any signed-in
-- user read blocker titles, codes, blocker reasons and client requests for any engagement id
-- they cared to guess. Every caller is an owner-gated RPC in this file, and inside those the
-- effective user is the function owner, so revoking it here costs nothing.
revoke execute on function public.owner_engagement_go_live_blockers(uuid) from public, anon, authenticated;
grant execute on function public.owner_engagement_go_live_blockers(uuid) to service_role;

commit;

-- ---------------------------------------------------------------------------
-- 8. Instantiation. Copies the active template into a new engagement. Called
--    only from owner_add_customer_service, which holds the row lock, and
--    protected additionally by the UNIQUE constraints on (customer_id,
--    service_key) and customer_service_id.
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_instantiate_service_engagement(
  p_customer_service_id uuid
) returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare
  s record; v_template record; v_engagement uuid;
begin
  select * into s from public.owner_customer_services where id = p_customer_service_id;
  if s.id is null then raise exception 'customer service not found'; end if;

  -- Idempotent: an engagement already exists for this service row.
  select id into v_engagement from public.owner_service_engagements where customer_service_id = s.id;
  if v_engagement is not null then return v_engagement; end if;

  select * into v_template from public.owner_service_templates
   where service_key = s.service_key and is_active
   order by version desc limit 1;

  insert into public.owner_service_engagements
    (business_entity_id, customer_id, customer_service_id, service_key,
     template_id, template_code, template_version, created_by)
  values (s.business_entity_id, s.customer_id, s.id, s.service_key,
          v_template.id, v_template.code, v_template.version, auth.uid())
  returning id into v_engagement;

  -- No template for this service yet (Automations / Website / Custom project
  -- until their templates ship): the engagement exists and is usable, it simply
  -- starts empty. Nothing is faked.
  if v_template.id is null then return v_engagement; end if;

  insert into public.owner_engagement_sections
    (engagement_id, code, title, description, nav_group, readiness_category, healthcare_only, sort_order)
  select v_engagement, sec.code, sec.title, sec.description, sec.nav_group,
         sec.readiness_category, sec.healthcare_only, sec.sort_order
  from public.owner_service_template_sections sec
  where sec.template_id = v_template.id;

  insert into public.owner_engagement_tasks
    (engagement_id, template_task_id, section_code, code, title, description,
     readiness_category, is_required, is_go_live_blocker, healthcare_only, sort_order)
  select v_engagement, t.id, sec.code, t.code, t.title, t.description,
         coalesce(t.readiness_category, sec.readiness_category),
         t.is_required, t.is_go_live_blocker, t.healthcare_only, t.sort_order
  from public.owner_service_template_tasks t
  join public.owner_service_template_sections sec on sec.id = t.section_id
  where t.template_id = v_template.id;

  insert into public.owner_engagement_fields
    (engagement_id, template_field_id, section_code, code, label, description, data_type,
     options, unit, placeholder, is_required, is_go_live_blocker, healthcare_only, sort_order)
  select v_engagement, f.id, sec.code, f.code, f.label, f.description, f.data_type,
         f.options, f.unit, f.placeholder, f.is_required, f.is_go_live_blocker,
         f.healthcare_only, f.sort_order
  from public.owner_service_template_fields f
  join public.owner_service_template_sections sec on sec.id = f.section_id
  where f.template_id = v_template.id;

  return v_engagement;
end;
$$;
revoke execute on function public.owner_instantiate_service_engagement(uuid) from public, anon, authenticated;
grant execute on function public.owner_instantiate_service_engagement(uuid) to service_role;

commit;

-- ---------------------------------------------------------------------------
-- 9. Service RPCs (owner-only).
-- ---------------------------------------------------------------------------
begin;

create or replace function public.owner_add_customer_service(
  p_idempotency_key uuid, p_customer_id uuid, p_service_key text
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_existing jsonb; c record; v_service uuid; v_state text; v_engagement uuid; v_result jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  v_existing := public.owner_claim_idempotency(p_idempotency_key, 'owner_add_customer_service');
  if v_existing is not null then return v_existing; end if;

  if p_service_key not in ('ai_receptionist', 'automations', 'website', 'custom_project') then
    raise exception 'unknown service %', p_service_key;
  end if;

  -- Lock the customer so two concurrent additions of the same service cannot
  -- both pass the existence check. The UNIQUE constraint is the backstop.
  select * into c from public.owner_customers where id = p_customer_id for update;
  if c.id is null then raise exception 'customer not found'; end if;

  select id, state into v_service, v_state
    from public.owner_customer_services
   where customer_id = p_customer_id and service_key = p_service_key;

  if v_service is not null then
    -- Re-adding a paused or archived service REACTIVATES it. History is kept:
    -- the existing engagement, its tasks, evidence and activity are untouched.
    if v_state <> 'active' then
      update public.owner_customer_services
         set state = 'active', paused_at = null, archived_at = null, archived_by = null,
             activated_at = now()
       where id = v_service;
    end if;
    v_engagement := public.owner_instantiate_service_engagement(v_service);
    if v_state <> 'active' then
      perform public.owner_record_engagement_activity(v_engagement, 'service_reactivated', 'Leistung wieder aktiviert');
    end if;
    v_result := jsonb_build_object('service_id', v_service, 'engagement_id', v_engagement, 'created', false);
    update public.owner_finance_requests set result = v_result where idempotency_key = p_idempotency_key;
    return v_result;
  end if;

  insert into public.owner_customer_services (business_entity_id, customer_id, service_key, created_by)
  values (c.business_entity_id, p_customer_id, p_service_key, auth.uid())
  returning id into v_service;

  v_engagement := public.owner_instantiate_service_engagement(v_service);

  perform public.owner_record_customer_activity(
    p_customer_id, 'service_added',
    'Leistung hinzugefügt: ' || case p_service_key
      when 'ai_receptionist' then 'AI Receptionist'
      when 'automations' then 'Automationen'
      when 'website' then 'Website'
      else 'Individuelles Projekt' end);
  perform public.owner_record_engagement_activity(v_engagement, 'engagement_created', 'Onboarding-Workspace angelegt');

  v_result := jsonb_build_object('service_id', v_service, 'engagement_id', v_engagement, 'created', true);
  update public.owner_finance_requests set result = v_result where idempotency_key = p_idempotency_key;
  return v_result;
end;
$$;

-- Pause / archive / reactivate. Never destructive: the engagement, its tasks,
-- evidence and activity survive every state change.
create or replace function public.owner_set_customer_service_state(
  p_service_id uuid, p_state text
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare s record; v_engagement uuid; v_summary text;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  if p_state not in ('active', 'paused', 'archived') then raise exception 'invalid service state %', p_state; end if;
  select * into s from public.owner_customer_services where id = p_service_id for update;
  if s.id is null then raise exception 'customer service not found'; end if;

  update public.owner_customer_services set
    state = p_state,
    paused_at = case when p_state = 'paused' then coalesce(paused_at, now()) else null end,
    archived_at = case when p_state = 'archived' then coalesce(archived_at, now()) else null end,
    archived_by = case when p_state = 'archived' then coalesce(archived_by, auth.uid()) else null end,
    activated_at = case when p_state = 'active' then now() else activated_at end
  where id = p_service_id;

  v_summary := case p_state
    when 'paused' then 'Leistung pausiert'
    when 'archived' then 'Leistung archiviert (Historie bleibt erhalten)'
    else 'Leistung wieder aktiviert' end;
  select id into v_engagement from public.owner_service_engagements where customer_service_id = p_service_id;
  if v_engagement is not null then
    perform public.owner_record_engagement_activity(v_engagement, 'service_state_changed', v_summary);
  end if;
  perform public.owner_record_customer_activity(s.customer_id, 'service_state_changed', v_summary);
  return jsonb_build_object('service_id', p_service_id, 'state', p_state);
end;
$$;

-- Every service a customer receives, each with the readiness/blocker headline the
-- customer page needs. One round trip, no N+1.
create or replace function public.owner_list_customer_services(p_customer_id uuid)
returns jsonb language plpgsql security definer stable set search_path = public, pg_temp as $$
declare v jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  select coalesce(jsonb_agg(row order by row->>'service_key'), '[]'::jsonb) into v
  from (
    select jsonb_build_object(
      'id', s.id, 'customer_id', s.customer_id, 'service_key', s.service_key,
      'state', s.state, 'label', s.label, 'notes', s.notes,
      'activated_at', s.activated_at, 'archived_at', s.archived_at, 'created_at', s.created_at,
      'engagement', case when e.id is null then null else jsonb_build_object(
        'id', e.id, 'lifecycle_status', e.lifecycle_status, 'healthcare', e.healthcare,
        'integration_mode', e.integration_mode, 'template_code', e.template_code,
        'template_version', e.template_version, 'went_live_at', e.went_live_at,
        'go_live_target_date', e.go_live_target_date,
        'task_total', coalesce(k.task_total, 0),
        'task_done', coalesce(k.task_done, 0),
        'blocker_count', coalesce((public.owner_engagement_go_live_blockers(e.id)->>'count')::int, 0)
      ) end
    ) as row
    from public.owner_customer_services s
    left join public.owner_service_engagements e on e.customer_service_id = s.id
    left join lateral (
      select count(*) filter (
               where t.status <> 'not_applicable' and (not t.healthcare_only or e.healthcare)
             ) as task_total,
             count(*) filter (
               where t.status = 'complete' and (not t.healthcare_only or e.healthcare)
             ) as task_done
      from public.owner_engagement_tasks t where t.engagement_id = e.id
    ) k on true
    where s.customer_id = p_customer_id
  ) q;
  return v;
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 10. Engagement RPCs.
-- ---------------------------------------------------------------------------
begin;

-- The whole workspace in one call: engagement, sections, tasks, fields,
-- appointment types, activity and the server-computed go-live gate.
create or replace function public.owner_engagement_detail(p_engagement_id uuid)
returns jsonb language plpgsql security definer stable set search_path = public, pg_temp as $$
declare
  v_engagement jsonb; v_customer jsonb; v_sections jsonb; v_tasks jsonb;
  v_fields jsonb; v_appts jsonb; v_activity jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;

  select to_jsonb(e) into v_engagement from public.owner_service_engagements e where e.id = p_engagement_id;
  if v_engagement is null then raise exception 'engagement not found'; end if;

  select jsonb_build_object('id', c.id, 'company', c.company, 'contact_name', c.contact_name,
                            'email', c.email, 'phone', c.phone, 'city', c.city, 'status', c.status)
    into v_customer
  from public.owner_customers c
  where c.id = (v_engagement->>'customer_id')::uuid;

  select coalesce(jsonb_agg(to_jsonb(s) order by s.sort_order, s.code), '[]'::jsonb) into v_sections
  from public.owner_engagement_sections s where s.engagement_id = p_engagement_id;

  select coalesce(jsonb_agg(to_jsonb(t) order by t.sort_order, t.code), '[]'::jsonb) into v_tasks
  from public.owner_engagement_tasks t where t.engagement_id = p_engagement_id;

  select coalesce(jsonb_agg(to_jsonb(f) order by f.sort_order, f.code), '[]'::jsonb) into v_fields
  from public.owner_engagement_fields f where f.engagement_id = p_engagement_id;

  select coalesce(jsonb_agg(to_jsonb(a) order by a.sort_order, a.created_at), '[]'::jsonb) into v_appts
  from public.owner_engagement_appointment_types a where a.engagement_id = p_engagement_id;

  select coalesce(jsonb_agg(jsonb_build_object(
           'id', x.id, 'event_type', x.event_type, 'summary', x.summary,
           'task_id', x.task_id, 'field_code', x.field_code, 'created_at', x.created_at
         ) order by x.created_at desc), '[]'::jsonb) into v_activity
  from (select * from public.owner_engagement_activity
         where engagement_id = p_engagement_id order by created_at desc limit 100) x;

  return jsonb_build_object(
    'engagement', v_engagement, 'customer', v_customer, 'sections', v_sections,
    'tasks', v_tasks, 'fields', v_fields, 'appointment_types', v_appts,
    'activity', v_activity,
    'go_live', public.owner_engagement_go_live_blockers(p_engagement_id));
end;
$$;

-- Engagement-level settings. `healthcare` drives applicability; `integration_mode`
-- carries the honesty constraint (a partial integration must name its limitation).
create or replace function public.owner_update_engagement(p_engagement_id uuid, p_patch jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare e record; v_mode text; v_limits text;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  select * into e from public.owner_service_engagements where id = p_engagement_id for update;
  if e.id is null then raise exception 'engagement not found'; end if;

  v_mode := case when p_patch ? 'integration_mode' then nullif(p_patch->>'integration_mode', '') else e.integration_mode end;
  v_limits := case when p_patch ? 'integration_limitations' then nullif(btrim(p_patch->>'integration_limitations'), '') else e.integration_limitations end;
  if v_mode = 'partial_automation' and coalesce(btrim(v_limits), '') = '' then
    raise exception 'Eine Teilautomatisierung muss ihre genaue Einschränkung dokumentieren';
  end if;

  update public.owner_service_engagements set
    healthcare = case when p_patch ? 'healthcare' then (p_patch->>'healthcare')::boolean else healthcare end,
    integration_mode = v_mode,
    integration_limitations = v_limits,
    summary = case when p_patch ? 'summary' then nullif(btrim(p_patch->>'summary'), '') else summary end,
    go_live_target_date = case when p_patch ? 'go_live_target_date' then nullif(p_patch->>'go_live_target_date', '')::date else go_live_target_date end,
    monitoring_until = case when p_patch ? 'monitoring_until' then nullif(p_patch->>'monitoring_until', '')::date else monitoring_until end
  where id = p_engagement_id;

  if p_patch ? 'healthcare' and (p_patch->>'healthcare')::boolean is distinct from e.healthcare then
    perform public.owner_record_engagement_activity(p_engagement_id, 'healthcare_changed',
      case when (p_patch->>'healthcare')::boolean then 'Als Healthcare-Projekt markiert' else 'Healthcare-Kennzeichnung entfernt' end);
  end if;
  if v_mode is distinct from e.integration_mode then
    perform public.owner_record_engagement_activity(p_engagement_id, 'integration_mode_changed',
      'Integrationsart: ' || coalesce(case v_mode when 'full_automation' then 'Vollautomatisierung'
                                       when 'partial_automation' then 'Teilautomatisierung' end, 'nicht festgelegt'));
  end if;

  return jsonb_build_object('engagement_id', p_engagement_id);
end;
$$;

-- Lifecycle transition. LIVE is a real gate: the server refuses it while any
-- go-live blocker is unresolved, so no UI state can talk it into production.
create or replace function public.owner_set_engagement_status(p_engagement_id uuid, p_status text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare e record; v_gate jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  if p_status not in ('lead', 'contracted', 'discovery', 'building', 'integrating', 'testing',
                      'client_approval', 'ready_for_go_live', 'live', 'monitoring') then
    raise exception 'invalid engagement status %', p_status;
  end if;
  select * into e from public.owner_service_engagements where id = p_engagement_id for update;
  if e.id is null then raise exception 'engagement not found'; end if;
  if e.lifecycle_status = p_status then return jsonb_build_object('engagement_id', p_engagement_id, 'lifecycle_status', p_status); end if;

  if p_status in ('ready_for_go_live', 'live', 'monitoring') then
    v_gate := public.owner_engagement_go_live_blockers(p_engagement_id);
    if not (v_gate->>'ready')::boolean then
      raise exception 'Go-Live gesperrt: % offene Blocker', v_gate->>'count';
    end if;
  end if;

  update public.owner_service_engagements set
    lifecycle_status = p_status,
    went_live_at = case when p_status in ('live', 'monitoring') then coalesce(went_live_at, now()) else went_live_at end
  where id = p_engagement_id;

  perform public.owner_record_engagement_activity(p_engagement_id, 'status_changed', 'Status: ' || p_status);
  return jsonb_build_object('engagement_id', p_engagement_id, 'lifecycle_status', p_status);
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 11. Task + field + appointment-type RPCs.
-- ---------------------------------------------------------------------------
begin;

-- One entry point for every task edit. The status rules are enforced here rather
-- than in the browser: blocked needs a reason, waiting-for-client needs a
-- request, and completion stamps who and when.
create or replace function public.owner_set_engagement_task(p_task_id uuid, p_patch jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  t record; v_status text; v_reason text; v_request text; v_was_blocker_open boolean;
  v_gate_before jsonb; v_gate_after jsonb;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  select * into t from public.owner_engagement_tasks where id = p_task_id for update;
  if t.id is null then raise exception 'task not found'; end if;

  v_status  := case when p_patch ? 'status' then p_patch->>'status' else t.status end;
  v_reason  := case when p_patch ? 'blocker_reason' then nullif(btrim(p_patch->>'blocker_reason'), '') else t.blocker_reason end;
  v_request := case when p_patch ? 'client_request' then nullif(btrim(p_patch->>'client_request'), '') else t.client_request end;

  if v_status not in ('not_started', 'in_progress', 'waiting_for_client', 'blocked', 'complete', 'not_applicable') then
    raise exception 'invalid task status %', v_status;
  end if;
  if v_status = 'blocked' and coalesce(v_reason, '') = '' then
    raise exception 'Ein blockierter Schritt braucht eine Begründung';
  end if;
  if v_status = 'waiting_for_client' and coalesce(v_request, '') = '' then
    raise exception 'Bitte angeben, was genau vom Kunden benötigt wird';
  end if;
  -- Leaving BLOCKED clears the stale reason so it can never linger as evidence.
  if v_status <> 'blocked' and not (p_patch ? 'blocker_reason') then v_reason := null; end if;

  v_gate_before := public.owner_engagement_go_live_blockers(t.engagement_id);
  v_was_blocker_open := t.is_go_live_blocker and t.status not in ('complete', 'not_applicable');

  update public.owner_engagement_tasks set
    status = v_status,
    blocker_reason = v_reason,
    client_request = case when v_status = 'waiting_for_client' then v_request
                          when p_patch ? 'client_request' then v_request else client_request end,
    evidence_url  = case when p_patch ? 'evidence_url'  then nullif(btrim(p_patch->>'evidence_url'), '')  else evidence_url end,
    evidence_note = case when p_patch ? 'evidence_note' then nullif(btrim(p_patch->>'evidence_note'), '') else evidence_note end,
    notes         = case when p_patch ? 'notes'         then nullif(btrim(p_patch->>'notes'), '')         else notes end,
    reviewer      = case when p_patch ? 'reviewer'      then nullif(btrim(p_patch->>'reviewer'), '')      else reviewer end,
    completed_at  = case when v_status = 'complete' then coalesce(completed_at, now()) else null end,
    completed_by  = case when v_status = 'complete' then coalesce(completed_by, auth.uid()) else null end
  where id = p_task_id;

  if v_status is distinct from t.status then
    perform public.owner_record_engagement_activity(
      t.engagement_id, 'task_status_changed',
      t.title || ' -> ' || case v_status
        when 'not_started' then 'Offen' when 'in_progress' then 'In Arbeit'
        when 'waiting_for_client' then 'Wartet auf Kunde' when 'blocked' then 'Blockiert'
        when 'complete' then 'Erledigt' else 'Nicht zutreffend' end
        || case when v_status = 'blocked' then ' (' || coalesce(v_reason, '') || ')' else '' end,
      p_task_id);
    if v_was_blocker_open and v_status in ('complete', 'not_applicable') then
      perform public.owner_record_engagement_activity(t.engagement_id, 'blocker_resolved',
        'Go-Live-Blocker aufgelöst: ' || t.title, p_task_id);
    end if;
  end if;

  v_gate_after := public.owner_engagement_go_live_blockers(t.engagement_id);
  if (v_gate_before->>'ready') is distinct from (v_gate_after->>'ready') then
    perform public.owner_record_engagement_activity(t.engagement_id, 'go_live_readiness_changed',
      case when (v_gate_after->>'ready')::boolean then 'Go-Live-Freigabe erreicht: keine offenen Blocker'
           else 'Go-Live-Freigabe verloren: wieder offene Blocker' end);
  end if;

  return jsonb_build_object('task_id', p_task_id, 'status', v_status,
                            'go_live', v_gate_after);
end;
$$;

-- Structured data write. Exactly one typed column is populated per field, chosen
-- from the field's own data_type -- the client cannot pick the column.
create or replace function public.owner_set_engagement_field(p_field_id uuid, p_patch jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  f record; v_text text; v_num numeric; v_bool boolean; v_date date;
  v_na boolean; v_raw text; v_had boolean; v_has boolean;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  select * into f from public.owner_engagement_fields where id = p_field_id for update;
  if f.id is null then raise exception 'field not found'; end if;

  v_na := case when p_patch ? 'not_applicable' then (p_patch->>'not_applicable')::boolean else f.not_applicable end;
  v_had := f.value_text is not null or f.value_number is not null
        or f.value_bool is not null or f.value_date is not null;

  if p_patch ? 'value' then
    v_raw := nullif(btrim(coalesce(p_patch->>'value', '')), '');
    if v_raw is null then
      v_text := null; v_num := null; v_bool := null; v_date := null;
    else
      -- The cast is chosen from the FIELD's own data_type, never from the caller, so a
      -- value can only ever land in the one column that matches its declared type. A bad
      -- value is answered with a sentence the owner can act on rather than a raw
      -- "invalid input syntax for type numeric" from the driver.
      begin
        case f.data_type
          when 'number'  then v_num  := v_raw::numeric;
          when 'boolean' then v_bool := v_raw::boolean;
          when 'date'    then v_date := v_raw::date;
          else v_text := left(v_raw, 4000);
        end case;
      exception when invalid_text_representation or datetime_field_overflow or numeric_value_out_of_range then
        raise exception '% erwartet %.', f.label,
          case f.data_type when 'number' then 'eine Zahl'
                           when 'boolean' then 'Ja oder Nein'
                           else 'ein Datum im Format JJJJ-MM-TT' end;
      end;

      -- A select field may only hold one of its own option values. Nothing else can be
      -- rendered back as a label, and readiness would silently count an unrenderable
      -- value as an answer.
      if f.data_type = 'select' and jsonb_array_length(f.options) > 0
         and not exists (
           select 1 from jsonb_array_elements(f.options) o where o->>'value' = v_text
         ) then
        raise exception '% ist kein zulässiger Wert für %.', v_text, f.label;
      end if;
    end if;
  else
    v_text := f.value_text; v_num := f.value_number; v_bool := f.value_bool; v_date := f.value_date;
  end if;

  update public.owner_engagement_fields set
    value_text = v_text, value_number = v_num, value_bool = v_bool, value_date = v_date,
    not_applicable = v_na, updated_by = auth.uid()
  where id = p_field_id;

  v_has := v_text is not null or v_num is not null or v_bool is not null or v_date is not null;

  -- Activity records that a field was filled or cleared, not every keystroke:
  -- only a transition between "empty" and "filled", or an applicability change,
  -- is worth the owner's attention later.
  if v_had is distinct from v_has then
    perform public.owner_record_engagement_activity(
      f.engagement_id, case when v_has then 'field_set' else 'field_cleared' end,
      f.label || case when v_has then ' erfasst' else ' geleert' end, null, f.code);
  end if;
  if v_na is distinct from f.not_applicable then
    perform public.owner_record_engagement_activity(
      f.engagement_id, 'field_applicability_changed',
      f.label || case when v_na then ': nicht zutreffend' else ': wieder zutreffend' end, null, f.code);
  end if;

  return jsonb_build_object('field_id', p_field_id,
                            'go_live', public.owner_engagement_go_live_blockers(f.engagement_id));
end;
$$;

create or replace function public.owner_upsert_engagement_appointment_type(
  p_engagement_id uuid, p_appointment_type_id uuid, p_payload jsonb
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid; v_name text; v_sort int;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  if not exists (select 1 from public.owner_service_engagements where id = p_engagement_id) then
    raise exception 'engagement not found';
  end if;
  v_name := nullif(btrim(p_payload->>'spoken_name'), '');
  if v_name is null then raise exception 'Eine Terminart braucht einen gesprochenen Namen'; end if;

  -- Validate the two numeric fields before the update, so a mistyped duration produces a
  -- sentence instead of a driver-level cast error half-way through the statement.
  if nullif(p_payload->>'duration_minutes', '') is not null
     and p_payload->>'duration_minutes' !~ '^[0-9]+$' then
    raise exception 'Die Dauer muss eine ganze Zahl in Minuten sein.';
  end if;
  if nullif(p_payload->>'booking_horizon_days', '') is not null
     and p_payload->>'booking_horizon_days' !~ '^[0-9]+$' then
    raise exception 'Der Buchungshorizont muss eine ganze Zahl in Tagen sein.';
  end if;

  if p_appointment_type_id is null then
    select coalesce(max(sort_order), 0) + 1 into v_sort
      from public.owner_engagement_appointment_types where engagement_id = p_engagement_id;
    insert into public.owner_engagement_appointment_types (engagement_id, spoken_name, sort_order)
    values (p_engagement_id, v_name, v_sort) returning id into v_id;
    perform public.owner_record_engagement_activity(p_engagement_id, 'appointment_type_added', 'Terminart angelegt: ' || v_name);
  else
    v_id := p_appointment_type_id;
    if not exists (select 1 from public.owner_engagement_appointment_types where id = v_id and engagement_id = p_engagement_id) then
      raise exception 'appointment type not found';
    end if;
  end if;

  update public.owner_engagement_appointment_types set
    spoken_name = v_name,
    internal_ref          = case when p_payload ? 'internal_ref'          then nullif(btrim(p_payload->>'internal_ref'), '') else internal_ref end,
    duration_minutes      = case when p_payload ? 'duration_minutes'      then nullif(p_payload->>'duration_minutes', '')::int else duration_minutes end,
    location              = case when p_payload ? 'location'              then nullif(btrim(p_payload->>'location'), '') else location end,
    provider              = case when p_payload ? 'provider'              then nullif(btrim(p_payload->>'provider'), '') else provider end,
    new_patients_allowed  = case when p_payload ? 'new_patients_allowed'  then (p_payload->>'new_patients_allowed')::boolean else new_patients_allowed end,
    existing_patients_only= case when p_payload ? 'existing_patients_only' then (p_payload->>'existing_patients_only')::boolean else existing_patients_only end,
    prerequisites         = case when p_payload ? 'prerequisites'         then nullif(btrim(p_payload->>'prerequisites'), '') else prerequisites end,
    required_information  = case when p_payload ? 'required_information'  then nullif(btrim(p_payload->>'required_information'), '') else required_information end,
    booking_horizon_days  = case when p_payload ? 'booking_horizon_days'  then nullif(p_payload->>'booking_horizon_days', '')::int else booking_horizon_days end,
    cancellation_rules    = case when p_payload ? 'cancellation_rules'    then nullif(btrim(p_payload->>'cancellation_rules'), '') else cancellation_rules end,
    rescheduling_rules    = case when p_payload ? 'rescheduling_rules'    then nullif(btrim(p_payload->>'rescheduling_rules'), '') else rescheduling_rules end,
    restrictions          = case when p_payload ? 'restrictions'          then nullif(btrim(p_payload->>'restrictions'), '') else restrictions end
  where id = v_id;

  return jsonb_build_object('appointment_type_id', v_id);
end;
$$;

create or replace function public.owner_delete_engagement_appointment_type(p_appointment_type_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare a record;
begin
  if not public.is_platform_owner() then raise exception 'Owner access required'; end if;
  select * into a from public.owner_engagement_appointment_types where id = p_appointment_type_id;
  if a.id is null then raise exception 'appointment type not found'; end if;
  delete from public.owner_engagement_appointment_types where id = p_appointment_type_id;
  perform public.owner_record_engagement_activity(a.engagement_id, 'appointment_type_removed', 'Terminart entfernt: ' || a.spoken_name);
  return jsonb_build_object('deleted', true);
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 12. Grants. Owner-gated in the body AND revoked from anon/public here.
-- ---------------------------------------------------------------------------
begin;
do $$
declare sig text;
begin
  foreach sig in array array[
    'owner_add_customer_service(uuid, uuid, text)',
    'owner_set_customer_service_state(uuid, text)',
    'owner_list_customer_services(uuid)',
    'owner_engagement_detail(uuid)',
    'owner_update_engagement(uuid, jsonb)',
    'owner_set_engagement_status(uuid, text)',
    'owner_set_engagement_task(uuid, jsonb)',
    'owner_set_engagement_field(uuid, jsonb)',
    'owner_upsert_engagement_appointment_type(uuid, uuid, jsonb)',
    'owner_delete_engagement_appointment_type(uuid)'
  ] loop
    execute format('revoke execute on function public.%s from public, anon', sig);
    execute format('grant execute on function public.%s to authenticated, service_role', sig);
  end loop;
end;
$$;
commit;
