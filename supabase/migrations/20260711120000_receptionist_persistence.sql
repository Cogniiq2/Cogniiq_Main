-- First persistent customer portal product configuration layer.
-- Additive only: depends on Phase 0 auth, organizations, memberships, roles and RLS helpers.

begin;

do $$
declare
  target_table regclass;
  target_table_name text;
  target_row_count bigint;
begin
  if to_regclass('public.organizations') is null then
    raise exception 'Receptionist persistence migration requires public.organizations';
  end if;

  if to_regclass('public.organization_members') is null then
    raise exception 'Receptionist persistence migration requires public.organization_members';
  end if;

  if to_regtype('public.organization_role') is null then
    raise exception 'Receptionist persistence migration requires public.organization_role';
  end if;

  if to_regprocedure('public.is_database_admin()') is null then
    raise exception 'Receptionist persistence migration requires public.is_database_admin()';
  end if;

  if to_regprocedure('public.request_is_service_role()') is null then
    raise exception 'Receptionist persistence migration requires public.request_is_service_role()';
  end if;

  if to_regprocedure('public.is_platform_admin()') is null then
    raise exception 'Receptionist persistence migration requires public.is_platform_admin()';
  end if;

  if to_regprocedure('public.is_organization_member(uuid)') is null then
    raise exception 'Receptionist persistence migration requires public.is_organization_member(uuid)';
  end if;

  if to_regprocedure('public.has_organization_role(uuid, public.organization_role[])') is null then
    raise exception 'Receptionist persistence migration requires public.has_organization_role(uuid, public.organization_role[])';
  end if;

  foreach target_table_name in array array[
    'public.businesses',
    'public.onboarding_sessions',
    'public.receptionist_configs',
    'public.phone_configs'
  ]
  loop
    target_table := to_regclass(target_table_name);

    if target_table is not null then
      execute format('select count(*) from %s', target_table) into target_row_count;

      if target_row_count <> 0 then
        raise exception 'Receptionist persistence migration requires % to contain zero rows before reconciliation; found %',
          target_table_name,
          target_row_count;
      end if;
    end if;
  end loop;
end;
$$;

create or replace function public.set_customer_product_timestamps()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at = now();
    new.updated_at = now();
  elsif tg_op = 'UPDATE' then
    new.created_at = old.created_at;
    new.updated_at = now();
  end if;

  return new;
end;
$$;

comment on function public.set_customer_product_timestamps() is
  'Server-controls created_at and updated_at for customer product configuration tables.';

create or replace function public.jsonb_text_array_is_subset(value jsonb, allowed_values text[])
returns boolean
language sql
immutable
set search_path = public
as $$
  select coalesce(jsonb_typeof(value) = 'array', false)
    and not exists (
      select 1
      from jsonb_array_elements(value) as element(item)
      where jsonb_typeof(element.item) <> 'string'
        or (element.item #>> '{}') <> all(allowed_values)
    );
$$;

comment on function public.jsonb_text_array_is_subset(jsonb, text[]) is
  'Checks that a jsonb array contains only string values from a stable internal key allow-list.';

create or replace function public.onboarding_status_transition_is_allowed(previous_status text, next_status text)
returns boolean
language sql
immutable
set search_path = public
as $$
  select previous_status = next_status
    or (
      previous_status = 'not_started'
      and next_status in ('in_progress')
    )
    or (
      previous_status = 'in_progress'
      and next_status in ('research_queued', 'error')
    )
    or (
      previous_status = 'research_queued'
      and next_status in ('research_running', 'error')
    )
    or (
      previous_status = 'research_running'
      and next_status in ('review_required', 'error')
    )
    or (
      previous_status = 'review_required'
      and next_status in ('research_queued', 'ready_for_test', 'error')
    )
    or (
      previous_status = 'ready_for_test'
      and next_status in ('review_required', 'ready_for_launch', 'error')
    )
    or (
      previous_status = 'ready_for_launch'
      and next_status in ('ready_for_test', 'live', 'error')
    )
    or (
      previous_status = 'live'
      and next_status in ('paused', 'error')
    )
    or (
      previous_status = 'paused'
      and next_status in ('ready_for_launch', 'live', 'error')
    )
    or (
      previous_status = 'error'
      and next_status in ('research_queued', 'review_required', 'paused')
    );
$$;

comment on function public.onboarding_status_transition_is_allowed(text, text) is
  'Explicit service-role lifecycle transition allow-list for onboarding_sessions.status.';

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  website text,
  industry text,
  address text,
  contact_email text,
  primary_contact_name text,
  existing_business_phone text,
  primary_language text not null default 'de',
  timezone text not null default 'Europe/Berlin',
  environment text not null default 'production',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint businesses_organization_id_key unique (organization_id),
  constraint businesses_organization_id_id_key unique (organization_id, id),
  constraint businesses_name_not_blank check (length(trim(name)) > 0),
  constraint businesses_website_url_check check (
    website is null
    or website ~* '^https?://[^[:space:]]+\.[^[:space:]]+$'
  ),
  constraint businesses_contact_email_check check (
    contact_email is null
    or contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  ),
  constraint businesses_existing_phone_check check (
    existing_business_phone is null
    or existing_business_phone ~ '^\+?[0-9][0-9 ()/.-]{5,}$'
  ),
  constraint businesses_primary_language_check check (primary_language in ('de', 'en')),
  constraint businesses_timezone_not_blank check (length(trim(timezone)) > 0),
  constraint businesses_environment_check check (environment in ('production', 'staging', 'development'))
);

comment on table public.businesses is
  'One v1 customer business profile per organization. Stores only customer-editable business setup information.';
comment on column public.businesses.organization_id is
  'Tenant owner. All product records are scoped through organization membership RLS.';
comment on column public.businesses.environment is
  'System-owned environment marker. Browser clients use the production default in this phase.';

create table if not exists public.onboarding_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  business_id uuid not null,
  status text not null default 'not_started',
  current_step text,
  completed_steps text[] not null default '{}'::text[],
  selected_goals text[] not null default '{}'::text[],
  preferred_behavior text,
  last_error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint onboarding_sessions_business_id_key unique (business_id),
  constraint onboarding_sessions_organization_business_fk foreign key (organization_id, business_id)
    references public.businesses(organization_id, id)
    on delete cascade,
  constraint onboarding_sessions_status_check check (
    status in (
      'not_started',
      'in_progress',
      'research_queued',
      'research_running',
      'review_required',
      'ready_for_test',
      'ready_for_launch',
      'live',
      'paused',
      'error'
    )
  ),
  constraint onboarding_sessions_current_step_check check (
    current_step is null
    or current_step in ('company', 'goals', 'research', 'review', 'continue')
  ),
  constraint onboarding_sessions_completed_steps_check check (
    completed_steps <@ array['company', 'goals', 'research', 'review', 'continue']::text[]
  ),
  constraint onboarding_sessions_selected_goals_check check (
    selected_goals <@ array[
      'answer_faqs',
      'capture_leads',
      'transfer_calls',
      'capture_appointments',
      'after_hours',
      'multilingual'
    ]::text[]
  )
);

comment on table public.onboarding_sessions is
  'Persistent onboarding progress for a business. Later lifecycle statuses are reserved but not simulated by the UI.';
comment on column public.onboarding_sessions.last_error is
  'Backend-controlled error detail for future recoverable onboarding jobs.';

create table if not exists public.receptionist_configs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  business_id uuid not null,
  receptionist_name text,
  primary_language text not null default 'de',
  additional_languages text[] not null default '{}'::text[],
  greeting text,
  tone text,
  responsibilities jsonb not null default '[]'::jsonb,
  allowed_actions jsonb not null default '[]'::jsonb,
  prohibited_actions jsonb not null default '[]'::jsonb,
  after_hours_behavior jsonb not null default '{}'::jsonb,
  transfer_behavior jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint receptionist_configs_business_id_key unique (business_id),
  constraint receptionist_configs_organization_business_fk foreign key (organization_id, business_id)
    references public.businesses(organization_id, id)
    on delete cascade,
  constraint receptionist_configs_primary_language_check check (primary_language in ('de', 'en')),
  constraint receptionist_configs_additional_languages_check check (
    additional_languages <@ array['de', 'en']::text[]
  ),
  constraint receptionist_configs_tone_check check (
    tone is null
    or tone in ('professional', 'warm', 'concise', 'formal')
  ),
  constraint receptionist_configs_responsibilities_array_check check (jsonb_typeof(responsibilities) = 'array'),
  constraint receptionist_configs_allowed_actions_array_check check (jsonb_typeof(allowed_actions) = 'array'),
  constraint receptionist_configs_prohibited_actions_array_check check (jsonb_typeof(prohibited_actions) = 'array'),
  constraint receptionist_configs_responsibilities_keys_check check (
    public.jsonb_text_array_is_subset(
      responsibilities,
      array[
        'answer_faqs',
        'capture_leads',
        'take_messages',
        'transfer_calls',
        'capture_appointments',
        'after_hours'
      ]::text[]
    )
  ),
  constraint receptionist_configs_allowed_actions_keys_check check (
    public.jsonb_text_array_is_subset(
      allowed_actions,
      array[
        'use_confirmed_facts_only',
        'be_transparent_when_unsure',
        'transfer_when_needed',
        'take_messages',
        'collect_contact_details'
      ]::text[]
    )
  ),
  constraint receptionist_configs_prohibited_actions_keys_check check (
    public.jsonb_text_array_is_subset(
      prohibited_actions,
      array[
        'no_invented_prices',
        'no_binding_appointments',
        'no_refund_promises',
        'no_regulated_advice',
        'no_unconfirmed_services'
      ]::text[]
    )
  ),
  constraint receptionist_configs_after_hours_object_check check (jsonb_typeof(after_hours_behavior) = 'object'),
  constraint receptionist_configs_transfer_object_check check (jsonb_typeof(transfer_behavior) = 'object')
);

comment on table public.receptionist_configs is
  'Customer-editable receptionist identity and behavior. Does not store generated Vapi prompts or assistants.';

create table if not exists public.phone_configs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  business_id uuid not null,
  setup_mode text,
  existing_public_number text,
  assigned_ai_number text,
  human_transfer_number text,
  urgent_escalation_number text,
  after_hours_number text,
  sms_notification_number text,
  forwarding_confirmed boolean not null default false,
  test_status text not null default 'not_started',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint phone_configs_business_id_key unique (business_id),
  constraint phone_configs_organization_business_fk foreign key (organization_id, business_id)
    references public.businesses(organization_id, id)
    on delete cascade,
  constraint phone_configs_setup_mode_check check (
    setup_mode is null
    or setup_mode in ('ai-number', 'forwarding')
  ),
  constraint phone_configs_existing_public_number_check check (
    existing_public_number is null
    or existing_public_number ~ '^\+?[0-9][0-9 ()/.-]{5,}$'
  ),
  constraint phone_configs_human_transfer_number_check check (
    human_transfer_number is null
    or human_transfer_number ~ '^\+?[0-9][0-9 ()/.-]{5,}$'
  ),
  constraint phone_configs_urgent_escalation_number_check check (
    urgent_escalation_number is null
    or urgent_escalation_number ~ '^\+?[0-9][0-9 ()/.-]{5,}$'
  ),
  constraint phone_configs_after_hours_number_check check (
    after_hours_number is null
    or after_hours_number ~ '^\+?[0-9][0-9 ()/.-]{5,}$'
  ),
  constraint phone_configs_sms_notification_number_check check (
    sms_notification_number is null
    or sms_notification_number ~ '^\+?[0-9][0-9 ()/.-]{5,}$'
  ),
  constraint phone_configs_test_status_check check (
    test_status in ('not_started', 'queued', 'running', 'failed', 'passed')
  )
);

do $$
declare
  mismatch text;
begin
  with expected(table_name, column_name, data_type, is_not_null, column_default) as (
    values
      ('businesses', 'id', 'uuid', true, 'gen_random_uuid()'),
      ('businesses', 'organization_id', 'uuid', true, null),
      ('businesses', 'name', 'text', true, null),
      ('businesses', 'website', 'text', false, null),
      ('businesses', 'industry', 'text', false, null),
      ('businesses', 'address', 'text', false, null),
      ('businesses', 'contact_email', 'text', false, null),
      ('businesses', 'primary_contact_name', 'text', false, null),
      ('businesses', 'existing_business_phone', 'text', false, null),
      ('businesses', 'primary_language', 'text', true, '''de''::text'),
      ('businesses', 'timezone', 'text', true, '''Europe/Berlin''::text'),
      ('businesses', 'environment', 'text', true, '''production''::text'),
      ('businesses', 'created_at', 'timestamp with time zone', true, 'now()'),
      ('businesses', 'updated_at', 'timestamp with time zone', true, 'now()'),
      ('onboarding_sessions', 'id', 'uuid', true, 'gen_random_uuid()'),
      ('onboarding_sessions', 'organization_id', 'uuid', true, null),
      ('onboarding_sessions', 'business_id', 'uuid', true, null),
      ('onboarding_sessions', 'status', 'text', true, '''not_started''::text'),
      ('onboarding_sessions', 'current_step', 'text', false, null),
      ('onboarding_sessions', 'completed_steps', 'text[]', true, '''{}''::text[]'),
      ('onboarding_sessions', 'selected_goals', 'text[]', true, '''{}''::text[]'),
      ('onboarding_sessions', 'preferred_behavior', 'text', false, null),
      ('onboarding_sessions', 'last_error', 'text', false, null),
      ('onboarding_sessions', 'started_at', 'timestamp with time zone', false, null),
      ('onboarding_sessions', 'completed_at', 'timestamp with time zone', false, null),
      ('onboarding_sessions', 'created_at', 'timestamp with time zone', true, 'now()'),
      ('onboarding_sessions', 'updated_at', 'timestamp with time zone', true, 'now()'),
      ('receptionist_configs', 'id', 'uuid', true, 'gen_random_uuid()'),
      ('receptionist_configs', 'organization_id', 'uuid', true, null),
      ('receptionist_configs', 'business_id', 'uuid', true, null),
      ('receptionist_configs', 'receptionist_name', 'text', false, null),
      ('receptionist_configs', 'primary_language', 'text', true, '''de''::text'),
      ('receptionist_configs', 'additional_languages', 'text[]', true, '''{}''::text[]'),
      ('receptionist_configs', 'greeting', 'text', false, null),
      ('receptionist_configs', 'tone', 'text', false, null),
      ('receptionist_configs', 'responsibilities', 'jsonb', true, '''[]''::jsonb'),
      ('receptionist_configs', 'allowed_actions', 'jsonb', true, '''[]''::jsonb'),
      ('receptionist_configs', 'prohibited_actions', 'jsonb', true, '''[]''::jsonb'),
      ('receptionist_configs', 'after_hours_behavior', 'jsonb', true, '''{}''::jsonb'),
      ('receptionist_configs', 'transfer_behavior', 'jsonb', true, '''{}''::jsonb'),
      ('receptionist_configs', 'created_at', 'timestamp with time zone', true, 'now()'),
      ('receptionist_configs', 'updated_at', 'timestamp with time zone', true, 'now()'),
      ('phone_configs', 'id', 'uuid', true, 'gen_random_uuid()'),
      ('phone_configs', 'organization_id', 'uuid', true, null),
      ('phone_configs', 'business_id', 'uuid', true, null),
      ('phone_configs', 'setup_mode', 'text', false, null),
      ('phone_configs', 'existing_public_number', 'text', false, null),
      ('phone_configs', 'assigned_ai_number', 'text', false, null),
      ('phone_configs', 'human_transfer_number', 'text', false, null),
      ('phone_configs', 'urgent_escalation_number', 'text', false, null),
      ('phone_configs', 'after_hours_number', 'text', false, null),
      ('phone_configs', 'sms_notification_number', 'text', false, null),
      ('phone_configs', 'forwarding_confirmed', 'boolean', true, 'false'),
      ('phone_configs', 'test_status', 'text', true, '''not_started''::text'),
      ('phone_configs', 'created_at', 'timestamp with time zone', true, 'now()'),
      ('phone_configs', 'updated_at', 'timestamp with time zone', true, 'now()')
  ),
  actual as (
    select
      c.relname as table_name,
      a.attname as column_name,
      format_type(a.atttypid, a.atttypmod) as data_type,
      a.attnotnull as is_not_null,
      pg_get_expr(d.adbin, d.adrelid) as column_default
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    join pg_attribute a on a.attrelid = c.oid
    left join pg_attrdef d on d.adrelid = c.oid and d.adnum = a.attnum
    where n.nspname = 'public'
      and c.relname in ('businesses', 'onboarding_sessions', 'receptionist_configs', 'phone_configs')
      and a.attnum > 0
      and not a.attisdropped
  ),
  problems as (
    select
      coalesce(e.table_name, a.table_name) || '.' || coalesce(e.column_name, a.column_name) || ' expected ' ||
      coalesce(e.data_type || '/' || e.is_not_null::text || '/' || coalesce(e.column_default, '<null>'), '<missing>') ||
      ' but found ' ||
      coalesce(a.data_type || '/' || a.is_not_null::text || '/' || coalesce(a.column_default, '<null>'), '<missing>') as problem
    from expected e
    full join actual a using (table_name, column_name)
    where e.table_name is null
      or a.table_name is null
      or e.data_type is distinct from a.data_type
      or e.is_not_null is distinct from a.is_not_null
      or e.column_default is distinct from a.column_default
  )
  select string_agg(problem, '; ' order by problem)
  into mismatch
  from problems;

  if mismatch is not null then
    raise exception 'Receptionist persistence table column structure mismatch: %', mismatch;
  end if;
end;
$$;

comment on table public.phone_configs is
  'Customer-editable phone-routing setup plus system-controlled future phone state.';
comment on column public.phone_configs.assigned_ai_number is
  'System-controlled future AI number. Browser customers cannot insert or update it.';
comment on column public.phone_configs.test_status is
  'System-controlled future test state. Browser customers cannot claim success.';

do $$
declare
  missing_constraint text;
  json_constraint record;
  normalized_definition text;
begin
  for json_constraint in
    select *
    from (
      values
        (
          'receptionist_configs_responsibilities_keys_check',
          $constraint$
            alter table public.receptionist_configs
            add constraint receptionist_configs_responsibilities_keys_check check (
              public.jsonb_text_array_is_subset(
                responsibilities,
                array[
                  'answer_faqs',
                  'capture_leads',
                  'take_messages',
                  'transfer_calls',
                  'capture_appointments',
                  'after_hours'
                ]::text[]
              )
            )
          $constraint$,
          $pattern$jsonb_text_array_is_subset\(responsibilities.*answer_faqs.*capture_leads.*take_messages.*transfer_calls.*capture_appointments.*after_hours$pattern$
        ),
        (
          'receptionist_configs_allowed_actions_keys_check',
          $constraint$
            alter table public.receptionist_configs
            add constraint receptionist_configs_allowed_actions_keys_check check (
              public.jsonb_text_array_is_subset(
                allowed_actions,
                array[
                  'use_confirmed_facts_only',
                  'be_transparent_when_unsure',
                  'transfer_when_needed',
                  'take_messages',
                  'collect_contact_details'
                ]::text[]
              )
            )
          $constraint$,
          $pattern$jsonb_text_array_is_subset\(allowed_actions.*use_confirmed_facts_only.*be_transparent_when_unsure.*transfer_when_needed.*take_messages.*collect_contact_details$pattern$
        ),
        (
          'receptionist_configs_prohibited_actions_keys_check',
          $constraint$
            alter table public.receptionist_configs
            add constraint receptionist_configs_prohibited_actions_keys_check check (
              public.jsonb_text_array_is_subset(
                prohibited_actions,
                array[
                  'no_invented_prices',
                  'no_binding_appointments',
                  'no_refund_promises',
                  'no_regulated_advice',
                  'no_unconfirmed_services'
                ]::text[]
              )
            )
          $constraint$,
          $pattern$jsonb_text_array_is_subset\(prohibited_actions.*no_invented_prices.*no_binding_appointments.*no_refund_promises.*no_regulated_advice.*no_unconfirmed_services$pattern$
        )
    ) as expected_constraint(constraint_name, add_sql, expected_pattern)
  loop
    if not exists (
      select 1
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace nsp on nsp.oid = rel.relnamespace
      where nsp.nspname = 'public'
        and rel.relname = 'receptionist_configs'
        and con.conname = json_constraint.constraint_name
    ) then
      execute json_constraint.add_sql;
    end if;

    select regexp_replace(lower(pg_get_constraintdef(con.oid)), '\s+', ' ', 'g')
    into normalized_definition
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'receptionist_configs'
      and con.conname = json_constraint.constraint_name;

    if normalized_definition !~ json_constraint.expected_pattern then
      raise exception 'Constraint % has unexpected definition: %',
        json_constraint.constraint_name,
        normalized_definition;
    end if;
  end loop;

  select string_agg(expected_constraint.constraint_name, ', ' order by expected_constraint.constraint_name)
  into missing_constraint
  from (
    values
      ('businesses_pkey'),
      ('businesses_organization_id_fkey'),
      ('businesses_organization_id_key'),
      ('businesses_organization_id_id_key'),
      ('businesses_name_not_blank'),
      ('businesses_website_url_check'),
      ('businesses_contact_email_check'),
      ('businesses_existing_phone_check'),
      ('businesses_primary_language_check'),
      ('businesses_timezone_not_blank'),
      ('businesses_environment_check'),
      ('onboarding_sessions_pkey'),
      ('onboarding_sessions_organization_id_fkey'),
      ('onboarding_sessions_business_id_key'),
      ('onboarding_sessions_organization_business_fk'),
      ('onboarding_sessions_status_check'),
      ('onboarding_sessions_current_step_check'),
      ('onboarding_sessions_completed_steps_check'),
      ('onboarding_sessions_selected_goals_check'),
      ('receptionist_configs_pkey'),
      ('receptionist_configs_organization_id_fkey'),
      ('receptionist_configs_business_id_key'),
      ('receptionist_configs_organization_business_fk'),
      ('receptionist_configs_primary_language_check'),
      ('receptionist_configs_additional_languages_check'),
      ('receptionist_configs_tone_check'),
      ('receptionist_configs_responsibilities_array_check'),
      ('receptionist_configs_allowed_actions_array_check'),
      ('receptionist_configs_prohibited_actions_array_check'),
      ('receptionist_configs_responsibilities_keys_check'),
      ('receptionist_configs_allowed_actions_keys_check'),
      ('receptionist_configs_prohibited_actions_keys_check'),
      ('receptionist_configs_after_hours_object_check'),
      ('receptionist_configs_transfer_object_check'),
      ('phone_configs_pkey'),
      ('phone_configs_organization_id_fkey'),
      ('phone_configs_business_id_key'),
      ('phone_configs_organization_business_fk'),
      ('phone_configs_setup_mode_check'),
      ('phone_configs_existing_public_number_check'),
      ('phone_configs_human_transfer_number_check'),
      ('phone_configs_urgent_escalation_number_check'),
      ('phone_configs_after_hours_number_check'),
      ('phone_configs_sms_notification_number_check'),
      ('phone_configs_test_status_check')
  ) as expected_constraint(constraint_name)
  where not exists (
    select 1
    from pg_constraint con
    where con.conname = expected_constraint.constraint_name
      and con.conrelid in (
        'public.businesses'::regclass,
        'public.onboarding_sessions'::regclass,
        'public.receptionist_configs'::regclass,
        'public.phone_configs'::regclass
      )
  );

  if missing_constraint is not null then
    raise exception 'Receptionist persistence constraints are missing: %', missing_constraint;
  end if;
end;
$$;

create index if not exists businesses_organization_id_idx on public.businesses(organization_id);
create index if not exists onboarding_sessions_organization_id_idx on public.onboarding_sessions(organization_id);
create index if not exists onboarding_sessions_business_id_idx on public.onboarding_sessions(business_id);
create index if not exists receptionist_configs_organization_id_idx on public.receptionist_configs(organization_id);
create index if not exists receptionist_configs_business_id_idx on public.receptionist_configs(business_id);
create index if not exists phone_configs_organization_id_idx on public.phone_configs(organization_id);
create index if not exists phone_configs_business_id_idx on public.phone_configs(business_id);

do $$
declare
  bad_index text;
begin
  with expected(index_name, table_name, column_name) as (
    values
      ('businesses_organization_id_idx', 'businesses', 'organization_id'),
      ('onboarding_sessions_organization_id_idx', 'onboarding_sessions', 'organization_id'),
      ('onboarding_sessions_business_id_idx', 'onboarding_sessions', 'business_id'),
      ('receptionist_configs_organization_id_idx', 'receptionist_configs', 'organization_id'),
      ('receptionist_configs_business_id_idx', 'receptionist_configs', 'business_id'),
      ('phone_configs_organization_id_idx', 'phone_configs', 'organization_id'),
      ('phone_configs_business_id_idx', 'phone_configs', 'business_id')
  ),
  actual as (
    select
      idx.relname as index_name,
      tbl.relname as table_name,
      att.attname as column_name
    from pg_class idx
    join pg_index ind on ind.indexrelid = idx.oid
    join pg_class tbl on tbl.oid = ind.indrelid
    join pg_namespace nsp on nsp.oid = tbl.relnamespace
    join pg_attribute att on att.attrelid = tbl.oid and att.attnum = ind.indkey[0]
    where nsp.nspname = 'public'
      and idx.relname in (
        'businesses_organization_id_idx',
        'onboarding_sessions_organization_id_idx',
        'onboarding_sessions_business_id_idx',
        'receptionist_configs_organization_id_idx',
        'receptionist_configs_business_id_idx',
        'phone_configs_organization_id_idx',
        'phone_configs_business_id_idx'
      )
      and ind.indnatts = 1
  )
  select string_agg(expected.index_name, ', ' order by expected.index_name)
  into bad_index
  from expected
  left join actual using (index_name, table_name, column_name)
  where actual.index_name is null;

  if bad_index is not null then
    raise exception 'Receptionist persistence indexes are missing or incompatible: %', bad_index;
  end if;
end;
$$;

create or replace function public.set_onboarding_session_lifecycle_timestamps()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status <> 'not_started' and new.started_at is null then
    new.started_at = now();
  end if;

  if new.status = 'live' and new.completed_at is null then
    new.completed_at = now();
  end if;

  return new;
end;
$$;

comment on function public.set_onboarding_session_lifecycle_timestamps() is
  'Maintains onboarding lifecycle timestamps without frontend-controlled timestamp writes.';

create or replace function public.guard_onboarding_session_system_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if public.is_database_admin() then
    return new;
  end if;

  if public.request_is_service_role() then
    if tg_op = 'INSERT' then
      if new.status not in ('not_started', 'in_progress', 'research_queued') then
        raise exception 'onboarding initial status is not an allowed backend start state';
      end if;

      return new;
    end if;

    if new.organization_id is distinct from old.organization_id
      or new.business_id is distinct from old.business_id
      or new.id is distinct from old.id then
      raise exception 'onboarding tenant and identity fields cannot be changed';
    end if;

    if not public.onboarding_status_transition_is_allowed(old.status, new.status) then
      raise exception 'onboarding status transition from % to % is not allowed', old.status, new.status;
    end if;

    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status not in ('not_started', 'in_progress') then
      raise exception 'onboarding status is system-controlled';
    end if;

    if new.last_error is not null then
      raise exception 'onboarding last_error is system-controlled';
    end if;

    if new.started_at is not null then
      raise exception 'onboarding started_at is system-controlled';
    end if;

    if new.completed_at is not null then
      raise exception 'onboarding completed_at is system-controlled';
    end if;

    return new;
  end if;

  if new.organization_id is distinct from old.organization_id
    or new.business_id is distinct from old.business_id
    or new.id is distinct from old.id then
    raise exception 'onboarding tenant and identity fields cannot be changed';
  end if;

  if new.status is distinct from old.status then
    raise exception 'onboarding status cannot be changed by browser clients';
  end if;

  if new.last_error is distinct from old.last_error then
    raise exception 'onboarding last_error is system-controlled';
  end if;

  if new.started_at is distinct from old.started_at then
    raise exception 'onboarding started_at is system-controlled';
  end if;

  if new.completed_at is distinct from old.completed_at then
    raise exception 'onboarding completed_at is system-controlled';
  end if;

  if new.created_at is distinct from old.created_at
    or new.updated_at is distinct from old.updated_at then
    raise exception 'onboarding timestamps are system-controlled';
  end if;

  return new;
end;
$$;

comment on function public.guard_onboarding_session_system_fields() is
  'Blocks browser customers from changing onboarding lifecycle state and restricts service-role transitions to an explicit allow-list.';

create or replace function public.guard_phone_config_system_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if public.is_database_admin() or public.request_is_service_role() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.assigned_ai_number is not null then
      raise exception 'assigned_ai_number is system-controlled';
    end if;

    if new.test_status <> 'not_started' then
      raise exception 'test_status is system-controlled';
    end if;

    return new;
  end if;

  if new.assigned_ai_number is distinct from old.assigned_ai_number then
    raise exception 'assigned_ai_number is system-controlled';
  end if;

  if new.test_status is distinct from old.test_status then
    raise exception 'test_status is system-controlled';
  end if;

  return new;
end;
$$;

comment on function public.guard_phone_config_system_fields() is
  'Blocks browser clients from setting future AI numbers or successful test states.';

drop trigger if exists businesses_set_customer_product_timestamps on public.businesses;
create trigger businesses_set_customer_product_timestamps
before insert or update on public.businesses
for each row execute function public.set_customer_product_timestamps();

drop trigger if exists onboarding_sessions_set_customer_product_timestamps on public.onboarding_sessions;
create trigger onboarding_sessions_set_customer_product_timestamps
before insert or update on public.onboarding_sessions
for each row execute function public.set_customer_product_timestamps();

drop trigger if exists onboarding_sessions_guard_system_fields on public.onboarding_sessions;
create trigger onboarding_sessions_guard_system_fields
before insert or update on public.onboarding_sessions
for each row execute function public.guard_onboarding_session_system_fields();

drop trigger if exists onboarding_sessions_set_lifecycle_timestamps on public.onboarding_sessions;
create trigger onboarding_sessions_set_lifecycle_timestamps
before insert or update on public.onboarding_sessions
for each row execute function public.set_onboarding_session_lifecycle_timestamps();

drop trigger if exists receptionist_configs_set_customer_product_timestamps on public.receptionist_configs;
create trigger receptionist_configs_set_customer_product_timestamps
before insert or update on public.receptionist_configs
for each row execute function public.set_customer_product_timestamps();

drop trigger if exists phone_configs_guard_system_fields on public.phone_configs;
create trigger phone_configs_guard_system_fields
before insert or update on public.phone_configs
for each row execute function public.guard_phone_config_system_fields();

drop trigger if exists phone_configs_set_customer_product_timestamps on public.phone_configs;
create trigger phone_configs_set_customer_product_timestamps
before insert or update on public.phone_configs
for each row execute function public.set_customer_product_timestamps();

alter table public.businesses enable row level security;
alter table public.onboarding_sessions enable row level security;
alter table public.receptionist_configs enable row level security;
alter table public.phone_configs enable row level security;

drop policy if exists "businesses_select_org_or_platform_admin" on public.businesses;
create policy "businesses_select_org_or_platform_admin"
  on public.businesses for select to authenticated
  using (public.is_platform_admin() or public.is_organization_member(organization_id));

drop policy if exists "businesses_insert_owner_admin_or_platform_admin" on public.businesses;
create policy "businesses_insert_owner_admin_or_platform_admin"
  on public.businesses for insert to authenticated
  with check (
    public.is_platform_admin()
    or public.has_organization_role(organization_id, array['owner'::public.organization_role, 'admin'::public.organization_role])
  );

drop policy if exists "businesses_update_owner_admin_or_platform_admin" on public.businesses;
create policy "businesses_update_owner_admin_or_platform_admin"
  on public.businesses for update to authenticated
  using (
    public.is_platform_admin()
    or public.has_organization_role(organization_id, array['owner'::public.organization_role, 'admin'::public.organization_role])
  )
  with check (
    public.is_platform_admin()
    or public.has_organization_role(organization_id, array['owner'::public.organization_role, 'admin'::public.organization_role])
  );

drop policy if exists "onboarding_sessions_select_org_or_platform_admin" on public.onboarding_sessions;
create policy "onboarding_sessions_select_org_or_platform_admin"
  on public.onboarding_sessions for select to authenticated
  using (public.is_platform_admin() or public.is_organization_member(organization_id));

drop policy if exists "onboarding_sessions_insert_owner_admin_or_platform_admin" on public.onboarding_sessions;
create policy "onboarding_sessions_insert_owner_admin_or_platform_admin"
  on public.onboarding_sessions for insert to authenticated
  with check (
    public.is_platform_admin()
    or public.has_organization_role(organization_id, array['owner'::public.organization_role, 'admin'::public.organization_role])
  );

drop policy if exists "onboarding_sessions_update_owner_admin_or_platform_admin" on public.onboarding_sessions;
create policy "onboarding_sessions_update_owner_admin_or_platform_admin"
  on public.onboarding_sessions for update to authenticated
  using (
    public.is_platform_admin()
    or public.has_organization_role(organization_id, array['owner'::public.organization_role, 'admin'::public.organization_role])
  )
  with check (
    public.is_platform_admin()
    or public.has_organization_role(organization_id, array['owner'::public.organization_role, 'admin'::public.organization_role])
  );

drop policy if exists "receptionist_configs_select_org_or_platform_admin" on public.receptionist_configs;
create policy "receptionist_configs_select_org_or_platform_admin"
  on public.receptionist_configs for select to authenticated
  using (public.is_platform_admin() or public.is_organization_member(organization_id));

drop policy if exists "receptionist_configs_insert_owner_admin_or_platform_admin" on public.receptionist_configs;
create policy "receptionist_configs_insert_owner_admin_or_platform_admin"
  on public.receptionist_configs for insert to authenticated
  with check (
    public.is_platform_admin()
    or public.has_organization_role(organization_id, array['owner'::public.organization_role, 'admin'::public.organization_role])
  );

drop policy if exists "receptionist_configs_update_owner_admin_or_platform_admin" on public.receptionist_configs;
create policy "receptionist_configs_update_owner_admin_or_platform_admin"
  on public.receptionist_configs for update to authenticated
  using (
    public.is_platform_admin()
    or public.has_organization_role(organization_id, array['owner'::public.organization_role, 'admin'::public.organization_role])
  )
  with check (
    public.is_platform_admin()
    or public.has_organization_role(organization_id, array['owner'::public.organization_role, 'admin'::public.organization_role])
  );

drop policy if exists "phone_configs_select_org_or_platform_admin" on public.phone_configs;
create policy "phone_configs_select_org_or_platform_admin"
  on public.phone_configs for select to authenticated
  using (public.is_platform_admin() or public.is_organization_member(organization_id));

drop policy if exists "phone_configs_insert_owner_admin_or_platform_admin" on public.phone_configs;
create policy "phone_configs_insert_owner_admin_or_platform_admin"
  on public.phone_configs for insert to authenticated
  with check (
    public.is_platform_admin()
    or public.has_organization_role(organization_id, array['owner'::public.organization_role, 'admin'::public.organization_role])
  );

drop policy if exists "phone_configs_update_owner_admin_or_platform_admin" on public.phone_configs;
create policy "phone_configs_update_owner_admin_or_platform_admin"
  on public.phone_configs for update to authenticated
  using (
    public.is_platform_admin()
    or public.has_organization_role(organization_id, array['owner'::public.organization_role, 'admin'::public.organization_role])
  )
  with check (
    public.is_platform_admin()
    or public.has_organization_role(organization_id, array['owner'::public.organization_role, 'admin'::public.organization_role])
  );

revoke all on table public.businesses from public, anon, authenticated;
revoke all on table public.onboarding_sessions from public, anon, authenticated;
revoke all on table public.receptionist_configs from public, anon, authenticated;
revoke all on table public.phone_configs from public, anon, authenticated;
revoke update (
  status,
  last_error,
  started_at,
  completed_at,
  created_at,
  updated_at
) on table public.onboarding_sessions from authenticated;
revoke update (
  assigned_ai_number,
  test_status,
  created_at,
  updated_at
) on table public.phone_configs from authenticated;

grant select on table public.businesses to authenticated;
grant insert (
  organization_id,
  name,
  website,
  industry,
  address,
  contact_email,
  primary_contact_name,
  existing_business_phone,
  primary_language,
  timezone
) on table public.businesses to authenticated;
grant update (
  name,
  website,
  industry,
  address,
  contact_email,
  primary_contact_name,
  existing_business_phone,
  primary_language,
  timezone
) on table public.businesses to authenticated;

grant select on table public.onboarding_sessions to authenticated;
grant insert (
  organization_id,
  business_id,
  status,
  current_step,
  completed_steps,
  selected_goals,
  preferred_behavior
) on table public.onboarding_sessions to authenticated;
grant update (
  current_step,
  completed_steps,
  selected_goals,
  preferred_behavior
) on table public.onboarding_sessions to authenticated;

grant select on table public.receptionist_configs to authenticated;
grant insert (
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
) on table public.receptionist_configs to authenticated;
grant update (
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
) on table public.receptionist_configs to authenticated;

grant select on table public.phone_configs to authenticated;
grant insert (
  organization_id,
  business_id,
  setup_mode,
  existing_public_number,
  human_transfer_number,
  urgent_escalation_number,
  after_hours_number,
  sms_notification_number,
  forwarding_confirmed
) on table public.phone_configs to authenticated;
grant update (
  setup_mode,
  existing_public_number,
  human_transfer_number,
  urgent_escalation_number,
  after_hours_number,
  sms_notification_number,
  forwarding_confirmed
) on table public.phone_configs to authenticated;

grant select, insert, update, delete on table public.businesses to service_role;
grant select, insert, update, delete on table public.onboarding_sessions to service_role;
grant select, insert, update, delete on table public.receptionist_configs to service_role;
grant select, insert, update, delete on table public.phone_configs to service_role;

revoke execute on function public.set_customer_product_timestamps() from public, anon, authenticated;
revoke execute on function public.jsonb_text_array_is_subset(jsonb, text[]) from public, anon;
revoke execute on function public.onboarding_status_transition_is_allowed(text, text) from public, anon, authenticated;
revoke execute on function public.set_onboarding_session_lifecycle_timestamps() from public, anon, authenticated;
revoke execute on function public.guard_onboarding_session_system_fields() from public, anon, authenticated;
revoke execute on function public.guard_phone_config_system_fields() from public, anon, authenticated;

grant execute on function public.set_customer_product_timestamps() to service_role;
grant execute on function public.jsonb_text_array_is_subset(jsonb, text[]) to authenticated, service_role;
grant execute on function public.onboarding_status_transition_is_allowed(text, text) to service_role;
grant execute on function public.set_onboarding_session_lifecycle_timestamps() to service_role;
grant execute on function public.guard_onboarding_session_system_fields() to service_role;
grant execute on function public.guard_phone_config_system_fields() to service_role;

do $$
declare
  target_table_name text;
  target_row_count bigint;
  expected_count integer;
begin
  foreach target_table_name in array array[
    'public.businesses',
    'public.onboarding_sessions',
    'public.receptionist_configs',
    'public.phone_configs'
  ]
  loop
    if to_regclass(target_table_name) is null then
      raise exception 'Final verification failed: % does not exist', target_table_name;
    end if;

    execute format('select count(*) from %s', target_table_name::regclass) into target_row_count;
    if target_row_count <> 0 then
      raise exception 'Final verification failed: % contains % rows', target_table_name, target_row_count;
    end if;
  end loop;

  select count(*)
  into expected_count
  from pg_attribute
  where attrelid in (
      'public.businesses'::regclass,
      'public.onboarding_sessions'::regclass,
      'public.receptionist_configs'::regclass,
      'public.phone_configs'::regclass
    )
    and attnum > 0
    and not attisdropped;

  if expected_count <> 56 then
    raise exception 'Final verification failed: expected 56 receptionist columns, found %', expected_count;
  end if;

  if exists (
    select 1
    from pg_class
    where oid in (
        'public.businesses'::regclass,
        'public.onboarding_sessions'::regclass,
        'public.receptionist_configs'::regclass,
        'public.phone_configs'::regclass
      )
      and not relrowsecurity
  ) then
    raise exception 'Final verification failed: RLS is not enabled on every receptionist table';
  end if;

  select count(*)
  into expected_count
  from pg_constraint
  where conrelid in (
      'public.businesses'::regclass,
      'public.onboarding_sessions'::regclass,
      'public.receptionist_configs'::regclass,
      'public.phone_configs'::regclass
    )
    and conname in (
      'businesses_pkey',
      'businesses_organization_id_fkey',
      'businesses_organization_id_key',
      'businesses_organization_id_id_key',
      'businesses_name_not_blank',
      'businesses_website_url_check',
      'businesses_contact_email_check',
      'businesses_existing_phone_check',
      'businesses_primary_language_check',
      'businesses_timezone_not_blank',
      'businesses_environment_check',
      'onboarding_sessions_pkey',
      'onboarding_sessions_organization_id_fkey',
      'onboarding_sessions_business_id_key',
      'onboarding_sessions_organization_business_fk',
      'onboarding_sessions_status_check',
      'onboarding_sessions_current_step_check',
      'onboarding_sessions_completed_steps_check',
      'onboarding_sessions_selected_goals_check',
      'receptionist_configs_pkey',
      'receptionist_configs_organization_id_fkey',
      'receptionist_configs_business_id_key',
      'receptionist_configs_organization_business_fk',
      'receptionist_configs_primary_language_check',
      'receptionist_configs_additional_languages_check',
      'receptionist_configs_tone_check',
      'receptionist_configs_responsibilities_array_check',
      'receptionist_configs_allowed_actions_array_check',
      'receptionist_configs_prohibited_actions_array_check',
      'receptionist_configs_responsibilities_keys_check',
      'receptionist_configs_allowed_actions_keys_check',
      'receptionist_configs_prohibited_actions_keys_check',
      'receptionist_configs_after_hours_object_check',
      'receptionist_configs_transfer_object_check',
      'phone_configs_pkey',
      'phone_configs_organization_id_fkey',
      'phone_configs_business_id_key',
      'phone_configs_organization_business_fk',
      'phone_configs_setup_mode_check',
      'phone_configs_existing_public_number_check',
      'phone_configs_human_transfer_number_check',
      'phone_configs_urgent_escalation_number_check',
      'phone_configs_after_hours_number_check',
      'phone_configs_sms_notification_number_check',
      'phone_configs_test_status_check'
    );

  if expected_count <> 45 then
    raise exception 'Final verification failed: expected 45 receptionist constraints, found %', expected_count;
  end if;

  select count(*)
  into expected_count
  from pg_indexes
  where schemaname = 'public'
    and indexname in (
      'businesses_organization_id_idx',
      'onboarding_sessions_organization_id_idx',
      'onboarding_sessions_business_id_idx',
      'receptionist_configs_organization_id_idx',
      'receptionist_configs_business_id_idx',
      'phone_configs_organization_id_idx',
      'phone_configs_business_id_idx'
    );

  if expected_count <> 7 then
    raise exception 'Final verification failed: expected 7 receptionist indexes, found %', expected_count;
  end if;

  select count(*)
  into expected_count
  from pg_trigger tr
  join pg_class rel on rel.oid = tr.tgrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public'
    and rel.relname in ('businesses', 'onboarding_sessions', 'receptionist_configs', 'phone_configs')
    and not tr.tgisinternal
    and tr.tgname in (
      'businesses_set_customer_product_timestamps',
      'onboarding_sessions_set_customer_product_timestamps',
      'onboarding_sessions_guard_system_fields',
      'onboarding_sessions_set_lifecycle_timestamps',
      'receptionist_configs_set_customer_product_timestamps',
      'phone_configs_guard_system_fields',
      'phone_configs_set_customer_product_timestamps'
    );

  if expected_count <> 7 then
    raise exception 'Final verification failed: expected 7 receptionist triggers, found %', expected_count;
  end if;

  select count(*)
  into expected_count
  from pg_policies
  where schemaname = 'public'
    and tablename in ('businesses', 'onboarding_sessions', 'receptionist_configs', 'phone_configs')
    and policyname in (
      'businesses_select_org_or_platform_admin',
      'businesses_insert_owner_admin_or_platform_admin',
      'businesses_update_owner_admin_or_platform_admin',
      'onboarding_sessions_select_org_or_platform_admin',
      'onboarding_sessions_insert_owner_admin_or_platform_admin',
      'onboarding_sessions_update_owner_admin_or_platform_admin',
      'receptionist_configs_select_org_or_platform_admin',
      'receptionist_configs_insert_owner_admin_or_platform_admin',
      'receptionist_configs_update_owner_admin_or_platform_admin',
      'phone_configs_select_org_or_platform_admin',
      'phone_configs_insert_owner_admin_or_platform_admin',
      'phone_configs_update_owner_admin_or_platform_admin'
    );

  if expected_count <> 12 then
    raise exception 'Final verification failed: expected 12 receptionist policies, found %', expected_count;
  end if;

  if to_regprocedure('public.jsonb_text_array_is_subset(jsonb, text[])') is null then
    raise exception 'Final verification failed: jsonb_text_array_is_subset(jsonb,text[]) is missing';
  end if;

  if to_regprocedure('public.onboarding_status_transition_is_allowed(text, text)') is null then
    raise exception 'Final verification failed: onboarding_status_transition_is_allowed(text,text) is missing';
  end if;

  if pg_get_functiondef('public.guard_onboarding_session_system_fields()'::regprocedure)
    not like '%onboarding_status_transition_is_allowed(old.status, new.status)%' then
    raise exception 'Final verification failed: onboarding guard does not call onboarding_status_transition_is_allowed(old.status, new.status)';
  end if;

  if has_column_privilege('authenticated', 'public.onboarding_sessions', 'status', 'UPDATE') then
    raise exception 'Final verification failed: authenticated can still update onboarding_sessions.status';
  end if;

  if not has_column_privilege('authenticated', 'public.onboarding_sessions', 'current_step', 'UPDATE')
    or not has_column_privilege('authenticated', 'public.onboarding_sessions', 'completed_steps', 'UPDATE')
    or not has_column_privilege('authenticated', 'public.onboarding_sessions', 'selected_goals', 'UPDATE')
    or not has_column_privilege('authenticated', 'public.onboarding_sessions', 'preferred_behavior', 'UPDATE') then
    raise exception 'Final verification failed: authenticated is missing intended onboarding_sessions customer column grants';
  end if;

  if has_column_privilege('authenticated', 'public.phone_configs', 'assigned_ai_number', 'UPDATE')
    or has_column_privilege('authenticated', 'public.phone_configs', 'test_status', 'UPDATE') then
    raise exception 'Final verification failed: authenticated can update phone_configs system fields';
  end if;
end;
$$;

commit;
