-- First persistent customer portal product configuration layer.
-- Additive only: depends on Phase 0 auth, organizations, memberships, roles and RLS helpers.

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

create table public.businesses (
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

create table public.onboarding_sessions (
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

create table public.receptionist_configs (
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

create table public.phone_configs (
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

comment on table public.phone_configs is
  'Customer-editable phone-routing setup plus system-controlled future phone state.';
comment on column public.phone_configs.assigned_ai_number is
  'System-controlled future AI number. Browser customers cannot insert or update it.';
comment on column public.phone_configs.test_status is
  'System-controlled future test state. Browser customers cannot claim success.';

create index businesses_organization_id_idx on public.businesses(organization_id);
create index onboarding_sessions_organization_id_idx on public.onboarding_sessions(organization_id);
create index onboarding_sessions_business_id_idx on public.onboarding_sessions(business_id);
create index receptionist_configs_organization_id_idx on public.receptionist_configs(organization_id);
create index receptionist_configs_business_id_idx on public.receptionist_configs(business_id);
create index phone_configs_organization_id_idx on public.phone_configs(organization_id);
create index phone_configs_business_id_idx on public.phone_configs(business_id);

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

create trigger businesses_set_customer_product_timestamps
before insert or update on public.businesses
for each row execute function public.set_customer_product_timestamps();

create trigger onboarding_sessions_set_customer_product_timestamps
before insert or update on public.onboarding_sessions
for each row execute function public.set_customer_product_timestamps();

create trigger onboarding_sessions_guard_system_fields
before insert or update on public.onboarding_sessions
for each row execute function public.guard_onboarding_session_system_fields();

create trigger onboarding_sessions_set_lifecycle_timestamps
before insert or update on public.onboarding_sessions
for each row execute function public.set_onboarding_session_lifecycle_timestamps();

create trigger receptionist_configs_set_customer_product_timestamps
before insert or update on public.receptionist_configs
for each row execute function public.set_customer_product_timestamps();

create trigger phone_configs_guard_system_fields
before insert or update on public.phone_configs
for each row execute function public.guard_phone_config_system_fields();

create trigger phone_configs_set_customer_product_timestamps
before insert or update on public.phone_configs
for each row execute function public.set_customer_product_timestamps();

alter table public.businesses enable row level security;
alter table public.onboarding_sessions enable row level security;
alter table public.receptionist_configs enable row level security;
alter table public.phone_configs enable row level security;

create policy "businesses_select_org_or_platform_admin"
  on public.businesses for select to authenticated
  using (public.is_platform_admin() or public.is_organization_member(organization_id));

create policy "businesses_insert_owner_admin_or_platform_admin"
  on public.businesses for insert to authenticated
  with check (
    public.is_platform_admin()
    or public.has_organization_role(organization_id, array['owner'::public.organization_role, 'admin'::public.organization_role])
  );

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

create policy "onboarding_sessions_select_org_or_platform_admin"
  on public.onboarding_sessions for select to authenticated
  using (public.is_platform_admin() or public.is_organization_member(organization_id));

create policy "onboarding_sessions_insert_owner_admin_or_platform_admin"
  on public.onboarding_sessions for insert to authenticated
  with check (
    public.is_platform_admin()
    or public.has_organization_role(organization_id, array['owner'::public.organization_role, 'admin'::public.organization_role])
  );

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

create policy "receptionist_configs_select_org_or_platform_admin"
  on public.receptionist_configs for select to authenticated
  using (public.is_platform_admin() or public.is_organization_member(organization_id));

create policy "receptionist_configs_insert_owner_admin_or_platform_admin"
  on public.receptionist_configs for insert to authenticated
  with check (
    public.is_platform_admin()
    or public.has_organization_role(organization_id, array['owner'::public.organization_role, 'admin'::public.organization_role])
  );

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

create policy "phone_configs_select_org_or_platform_admin"
  on public.phone_configs for select to authenticated
  using (public.is_platform_admin() or public.is_organization_member(organization_id));

create policy "phone_configs_insert_owner_admin_or_platform_admin"
  on public.phone_configs for insert to authenticated
  with check (
    public.is_platform_admin()
    or public.has_organization_role(organization_id, array['owner'::public.organization_role, 'admin'::public.organization_role])
  );

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
