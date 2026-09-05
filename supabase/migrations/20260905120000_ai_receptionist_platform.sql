-- =============================================================================
-- AI Receptionist platform — tenant-scoped Golden Agent persistence
-- =============================================================================
-- WHY THIS MIGRATION EXISTS
-- --------------------------
-- The Golden Agent platform (src/lib/goldenAgent) turns one ClientConfig into one ElevenLabs
-- agent per customer. Until now nothing in the database could hold that configuration, the
-- provider ids it produced, the credentials the voice runtime presents to our tool endpoint, the
-- per-call observability or the evaluation history. This migration adds exactly those tables.
--
-- It is ADDITIVE ONLY. The customer-portal tables from 20260711120000 (businesses,
-- onboarding_sessions, receptionist_configs, phone_configs) are untouched: they describe what the
-- customer told us during self-service onboarding; the tables below describe the receptionist
-- Cogniiq operates for them. Linking the two is a later, explicit step.
--
-- TENANCY AND ACCESS MODEL
-- ------------------------
--   * Every table carries organization_id (the login tenant) and cascades on organization delete.
--   * Platform owner/admin (profiles.platform_role) manage everything: this is an internal
--     control-center product first.
--   * Customer members with the ai_receptionist entitlement get READ access to their own
--     receptionist rows and call records — never to tool bindings, config history, call events or
--     evaluation internals — so a customer can later see status and outcomes without seeing operations.
--   * Edge functions (receptionist-tools, receptionist-postcall) run as service_role, which
--     bypasses RLS; they resolve the tenant from a hashed bearer token stored here and never from
--     anything the voice runtime or the LLM sends in the request body.
--   * Nothing here grants anon anything.
--
-- SENSITIVE DATA
-- --------------
--   * ai_receptionist_tool_bindings stores only a SHA-256 hash of the bearer token.
--   * ai_receptionist_call_events stores tool names, outcomes, latencies and coarse intents; the
--     edge function strips caller arguments before writing (see receptionist-tools/index.ts).
--   * ai_receptionist_calls.summary may contain a post-call summary produced by the voice
--     provider; retention is bounded by retention_until and the cleanup function below.
-- =============================================================================

begin;

do $$
begin
  if to_regclass('public.organizations') is null then
    raise exception 'AI receptionist platform migration requires public.organizations';
  end if;
  if to_regprocedure('public.is_platform_admin()') is null then
    raise exception 'AI receptionist platform migration requires public.is_platform_admin()';
  end if;
  if to_regprocedure('public.is_platform_owner()') is null then
    raise exception 'AI receptionist platform migration requires public.is_platform_owner()';
  end if;
  if to_regprocedure('public.organization_has_accessible_solution(uuid, text)') is null then
    raise exception 'AI receptionist platform migration requires public.organization_has_accessible_solution(uuid, text)';
  end if;
  if to_regprocedure('public.set_updated_at()') is null then
    raise exception 'AI receptionist platform migration requires public.set_updated_at()';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. Receptionists
-- ---------------------------------------------------------------------------
create table if not exists public.ai_receptionists (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 120),
  stage text not null default 'dev' check (stage in ('dev', 'evaluation', 'staging', 'live', 'paused')),
  -- The full ClientConfig (src/lib/goldenAgent/clientConfig.ts). Validated in application code;
  -- the database only guarantees it is an object whose clientId matches the tenant.
  client_config jsonb not null default '{}'::jsonb check (jsonb_typeof(client_config) = 'object'),
  config_version integer not null default 0 check (config_version >= 0),
  -- ProvisionedState from the agent factory: provider agent id, tool ids, knowledge document ids.
  provider_state jsonb not null default '{}'::jsonb check (jsonb_typeof(provider_state) = 'object'),
  provider text not null default 'elevenlabs' check (provider in ('elevenlabs')),
  provider_agent_id text,
  prompt_version text,
  last_synced_at timestamptz,
  last_sync_error text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_receptionists_org_id_unique unique (organization_id, id)
);

comment on table public.ai_receptionists is
  'One AI receptionist (Golden Agent instance) per row, owned by a tenant organization. client_config holds the ClientConfig JSON.';

create index if not exists ai_receptionists_org_idx on public.ai_receptionists (organization_id);
create index if not exists ai_receptionists_stage_idx on public.ai_receptionists (stage);
create unique index if not exists ai_receptionists_provider_agent_idx on public.ai_receptionists (provider, provider_agent_id) where provider_agent_id is not null;

drop trigger if exists ai_receptionists_set_updated_at on public.ai_receptionists;
create trigger ai_receptionists_set_updated_at
  before update on public.ai_receptionists
  for each row execute function public.set_updated_at();

-- A config whose clientId disagrees with the tenant would let a stored config impersonate another
-- customer inside the tool runtime. Enforce the invariant at the boundary.
create or replace function public.guard_ai_receptionist_config()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.client_config ? 'clientId' and (new.client_config ->> 'clientId') <> new.organization_id::text then
    raise exception 'client_config.clientId must equal organization_id';
  end if;
  if tg_op = 'UPDATE' and new.organization_id <> old.organization_id then
    raise exception 'ai_receptionists.organization_id is immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists ai_receptionists_guard_config on public.ai_receptionists;
create trigger ai_receptionists_guard_config
  before insert or update on public.ai_receptionists
  for each row execute function public.guard_ai_receptionist_config();

-- ---------------------------------------------------------------------------
-- 2. Config history (every applied version, for diff and rollback)
-- ---------------------------------------------------------------------------
create table if not exists public.ai_receptionist_config_versions (
  id uuid primary key default gen_random_uuid(),
  receptionist_id uuid not null,
  organization_id uuid not null,
  version integer not null check (version >= 1),
  client_config jsonb not null check (jsonb_typeof(client_config) = 'object'),
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint ai_receptionist_config_versions_receptionist_fk
    foreign key (organization_id, receptionist_id) references public.ai_receptionists (organization_id, id) on delete cascade,
  constraint ai_receptionist_config_versions_unique unique (receptionist_id, version)
);

create index if not exists ai_receptionist_config_versions_org_idx on public.ai_receptionist_config_versions (organization_id, receptionist_id);

-- ---------------------------------------------------------------------------
-- 3. Tool bindings (the credential the voice runtime presents to receptionist-tools)
-- ---------------------------------------------------------------------------
create table if not exists public.ai_receptionist_tool_bindings (
  id uuid primary key default gen_random_uuid(),
  receptionist_id uuid not null,
  organization_id uuid not null,
  environment text not null check (environment in ('dev', 'staging', 'live')),
  -- sha256 hex of the bearer token. The token itself is shown once at creation and never stored.
  token_hash text not null check (token_hash ~ '^[0-9a-f]{64}$'),
  label text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  last_used_at timestamptz,
  constraint ai_receptionist_tool_bindings_receptionist_fk
    foreign key (organization_id, receptionist_id) references public.ai_receptionists (organization_id, id) on delete cascade,
  constraint ai_receptionist_tool_bindings_token_unique unique (token_hash)
);

create index if not exists ai_receptionist_tool_bindings_lookup_idx on public.ai_receptionist_tool_bindings (token_hash) where active;

-- ---------------------------------------------------------------------------
-- 4. Calls and call events (observability)
-- ---------------------------------------------------------------------------
create table if not exists public.ai_receptionist_calls (
  id uuid primary key default gen_random_uuid(),
  receptionist_id uuid not null,
  organization_id uuid not null,
  provider_conversation_id text not null,
  environment text not null default 'dev' check (environment in ('dev', 'staging', 'live')),
  started_at timestamptz,
  ended_at timestamptz,
  duration_secs integer check (duration_secs is null or duration_secs >= 0),
  status text not null default 'in_progress' check (status in ('in_progress', 'done', 'failed', 'unknown')),
  outcome text check (outcome is null or outcome in ('booked', 'rescheduled', 'cancelled', 'answered', 'escalated', 'callback', 'declined', 'emergency_routed', 'no_action', 'unknown')),
  detected_intents text[] not null default '{}',
  tool_call_count integer not null default 0 check (tool_call_count >= 0),
  tool_error_count integer not null default 0 check (tool_error_count >= 0),
  escalated boolean not null default false,
  -- Provider post-call analysis (summary, evaluation criteria results). May contain personal data:
  -- bounded by retention_until.
  analysis jsonb not null default '{}'::jsonb check (jsonb_typeof(analysis) = 'object'),
  summary text,
  retention_until timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_receptionist_calls_receptionist_fk
    foreign key (organization_id, receptionist_id) references public.ai_receptionists (organization_id, id) on delete cascade,
  constraint ai_receptionist_calls_conversation_unique unique (receptionist_id, provider_conversation_id)
);

create index if not exists ai_receptionist_calls_org_idx on public.ai_receptionist_calls (organization_id, receptionist_id, started_at desc);
create index if not exists ai_receptionist_calls_retention_idx on public.ai_receptionist_calls (retention_until);

drop trigger if exists ai_receptionist_calls_set_updated_at on public.ai_receptionist_calls;
create trigger ai_receptionist_calls_set_updated_at
  before update on public.ai_receptionist_calls
  for each row execute function public.set_updated_at();

create table if not exists public.ai_receptionist_call_events (
  id bigint generated always as identity primary key,
  receptionist_id uuid not null,
  organization_id uuid not null,
  provider_conversation_id text not null,
  event_type text not null check (event_type in ('tool_call', 'conversation_event', 'post_call', 'auth_failure', 'system')),
  tool_name text,
  ok boolean,
  failure_code text,
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  intent text,
  detail text check (detail is null or char_length(detail) <= 500),
  -- Structured, PII-stripped payload (e.g. which params were invalid). Never raw caller arguments.
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  occurred_at timestamptz not null default now(),
  constraint ai_receptionist_call_events_receptionist_fk
    foreign key (organization_id, receptionist_id) references public.ai_receptionists (organization_id, id) on delete cascade
);

create index if not exists ai_receptionist_call_events_conversation_idx on public.ai_receptionist_call_events (receptionist_id, provider_conversation_id, occurred_at);
create index if not exists ai_receptionist_call_events_org_idx on public.ai_receptionist_call_events (organization_id, occurred_at desc);

-- ---------------------------------------------------------------------------
-- 5. Evaluation runs and results
-- ---------------------------------------------------------------------------
create table if not exists public.ai_receptionist_evaluation_runs (
  id uuid primary key default gen_random_uuid(),
  receptionist_id uuid not null,
  organization_id uuid not null,
  mode text not null check (mode in ('offline_reference', 'elevenlabs_simulation', 'conversation_replay')),
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed')),
  config_version integer,
  prompt_version text,
  provider_invocation_id text,
  total integer not null default 0 check (total >= 0),
  passed integer not null default 0 check (passed >= 0),
  failed integer not null default 0 check (failed >= 0),
  summary jsonb not null default '{}'::jsonb check (jsonb_typeof(summary) = 'object'),
  error text,
  started_at timestamptz,
  finished_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint ai_receptionist_evaluation_runs_receptionist_fk
    foreign key (organization_id, receptionist_id) references public.ai_receptionists (organization_id, id) on delete cascade
);

create index if not exists ai_receptionist_evaluation_runs_idx on public.ai_receptionist_evaluation_runs (receptionist_id, created_at desc);

create table if not exists public.ai_receptionist_evaluation_results (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.ai_receptionist_evaluation_runs(id) on delete cascade,
  receptionist_id uuid not null,
  organization_id uuid not null,
  scenario_id text not null,
  category text not null,
  title text not null,
  passed boolean not null,
  outcome text,
  scores jsonb not null default '[]'::jsonb check (jsonb_typeof(scores) = 'array'),
  findings jsonb not null default '[]'::jsonb check (jsonb_typeof(findings) = 'array'),
  transcript jsonb not null default '{}'::jsonb check (jsonb_typeof(transcript) = 'object'),
  created_at timestamptz not null default now(),
  constraint ai_receptionist_evaluation_results_receptionist_fk
    foreign key (organization_id, receptionist_id) references public.ai_receptionists (organization_id, id) on delete cascade,
  constraint ai_receptionist_evaluation_results_unique unique (run_id, scenario_id)
);

create index if not exists ai_receptionist_evaluation_results_run_idx on public.ai_receptionist_evaluation_results (run_id, passed);

-- ---------------------------------------------------------------------------
-- 6. Retention cleanup (called by a scheduled job or an operator; never automatic here)
-- ---------------------------------------------------------------------------
create or replace function public.ai_receptionist_purge_expired_calls()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  purged integer;
begin
  if not (public.is_platform_owner() or public.request_is_service_role()) then
    raise exception 'ai_receptionist_purge_expired_calls requires platform owner or service role';
  end if;
  with deleted as (
    delete from public.ai_receptionist_calls where retention_until < now() returning receptionist_id, provider_conversation_id
  ),
  deleted_events as (
    delete from public.ai_receptionist_call_events e
    using deleted d
    where e.receptionist_id = d.receptionist_id and e.provider_conversation_id = d.provider_conversation_id
    returning 1
  )
  select count(*) into purged from deleted;
  return purged;
end;
$$;

revoke execute on function public.ai_receptionist_purge_expired_calls() from public, anon;
grant execute on function public.ai_receptionist_purge_expired_calls() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 7. Row level security and grants
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'ai_receptionists', 'ai_receptionist_config_versions', 'ai_receptionist_tool_bindings',
    'ai_receptionist_calls', 'ai_receptionist_call_events', 'ai_receptionist_evaluation_runs', 'ai_receptionist_evaluation_results'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('revoke all on table public.%I from public, anon, authenticated', t);
  end loop;
end;
$$;

-- Platform admins manage every table.
do $$
declare
  t text;
begin
  foreach t in array array[
    'ai_receptionists', 'ai_receptionist_config_versions', 'ai_receptionist_tool_bindings',
    'ai_receptionist_calls', 'ai_receptionist_call_events', 'ai_receptionist_evaluation_runs', 'ai_receptionist_evaluation_results'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t || '_platform_admin_all', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin())',
      t || '_platform_admin_all', t
    );
  end loop;
end;
$$;

-- Customers with the entitlement may read their own receptionist and call rows (status/outcomes).
drop policy if exists ai_receptionists_customer_select on public.ai_receptionists;
create policy ai_receptionists_customer_select
  on public.ai_receptionists for select to authenticated
  using (public.organization_has_accessible_solution(organization_id, 'ai_receptionist'));

drop policy if exists ai_receptionist_calls_customer_select on public.ai_receptionist_calls;
create policy ai_receptionist_calls_customer_select
  on public.ai_receptionist_calls for select to authenticated
  using (public.organization_has_accessible_solution(organization_id, 'ai_receptionist'));

-- Row-scoped grants. Both platform admins and customers connect as `authenticated`, so column
-- privileges cannot separate them; the row policies do. Nothing in ai_receptionists or
-- ai_receptionist_calls is a secret (provider ids, the tenant's own configuration and call
-- outcomes) — the secret-bearing table (tool bindings) and the operational tables have no
-- customer policy at all.
grant select, insert, update, delete on table public.ai_receptionists to authenticated;
grant select, insert, update, delete on table public.ai_receptionist_config_versions to authenticated;
grant select, insert, update, delete on table public.ai_receptionist_tool_bindings to authenticated;
grant select, insert, update, delete on table public.ai_receptionist_calls to authenticated;
grant select, insert, update, delete on table public.ai_receptionist_call_events to authenticated;
grant select, insert, update, delete on table public.ai_receptionist_evaluation_runs to authenticated;
grant select, insert, update, delete on table public.ai_receptionist_evaluation_results to authenticated;
grant usage, select on sequence public.ai_receptionist_call_events_id_seq to authenticated;

-- NOTE on the broad authenticated grants above: they are what lets platform admins (policy
-- *_platform_admin_all) operate the tables through PostgREST. Customer rows remain limited by the
-- two select-only policies; a customer holds no insert/update/delete policy on any table, so the
-- grants are inert for them. Everything else is service_role from the edge functions.

-- ---------------------------------------------------------------------------
-- Post-conditions
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
  enabled boolean;
begin
  foreach t in array array[
    'ai_receptionists', 'ai_receptionist_config_versions', 'ai_receptionist_tool_bindings',
    'ai_receptionist_calls', 'ai_receptionist_call_events', 'ai_receptionist_evaluation_runs', 'ai_receptionist_evaluation_results'
  ]
  loop
    select relrowsecurity into enabled from pg_class where oid = format('public.%I', t)::regclass;
    if not coalesce(enabled, false) then
      raise exception 'RLS is not enabled on public.%', t;
    end if;
  end loop;
end;
$$;

commit;
