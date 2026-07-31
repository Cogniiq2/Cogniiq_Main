-- =============================================================================
-- Case D convergence: tasks / execution_* / oura_* legacy migrations
-- =============================================================================
-- WHY THIS MIGRATION EXISTS
-- --------------------------
-- Five repository migrations predate all tenancy/RLS work in this codebase and are
-- NOT recorded in the hosted migration ledger, because hosted genuinely never
-- finished applying them (see PR #18 §"Known: five legacy migrations remain
-- unreconciled" for the original classification):
--
--   20260607194622_create_tasks_table               -- public.tasks: MISSING entirely
--   20260607200426_fix_tasks_rls_policies            -- depends on public.tasks
--   20260706121415_..._create_execution_tables       -- execution_days/execution_tasks
--                                                        exist hosted, but with a REAL
--                                                        shape (date/weekday/user_id/
--                                                        status/total_points/...) that
--                                                        matches neither this file's
--                                                        plan_date/total_tasks schema
--                                                        NOR any "applied" state of it
--   20260706122833_fix_execution_rls_for_anon        -- would grant anon on tables
--                                                        whose real shape it never saw
--   20260709120000_create_richer_oura_tables         -- 5 of 12 oura_* tables exist,
--                                                        bare-shape, none of the
--                                                        "richer" columns this file adds
--
-- None of those five files can simply be "applied" now: two would either fail
-- outright (tasks already-absent is fine, but the execution/oura files assume a
-- schema hosted does not have) or would silently widen access hosted never asked
-- for (anon on execution_days/execution_tasks; the richer oura columns nothing
-- shipped requires). This migration is the deliberate, explicit reconciliation in
-- their place. The five legacy files are left exactly as they are and are NEVER
-- marked applied by this migration or by anything else in the repository.
--
-- REAL EXPOSURE THIS MIGRATION FIXES (verified against hosted `lqgtmoulqzmrhglabrms`,
-- read-only, before writing a single line of this file)
-- ------------------------------------------------------------------------------
--   * public.execution_days / public.execution_tasks: relrowsecurity = FALSE (RLS
--     was never turned on, not merely "no policies") AND anon/authenticated/
--     service_role all hold full INSERT/SELECT/UPDATE/DELETE grants. Any request
--     bearing only the public anon API key can currently read and write all 26
--     execution_days rows and all 349 execution_tasks rows, unauthenticated.
--   * public.oura_daily_sleep / oura_daily_readiness / oura_daily_activity: RLS is
--     enabled, but each carries a PERMISSIVE policy ("Allow frontend read oura ...")
--     with `roles = {public}` and `qual = true` -- i.e. every role, anon included,
--     can already SELECT every row of these three tables. (oura_connections and
--     oura_heart_rate have RLS enabled with zero policies, so those two are
--     currently deny-all and are not part of this specific exposure.)
--   Neither exposure is justified by any shipped code path: every frontend surface
--   that reads these tables (TaskDashboardContent, ExecutionPage, OuraAnalyticsPage)
--   is mounted behind PlatformAdminRoute (authenticated + is_platform_admin()) and
--   sync-oura writes via the service_role key, which always bypasses RLS regardless
--   of policy contents.
--
-- WHAT THIS MIGRATION DOES NOT DO
-- --------------------------------
--   * Does not touch auth.users.
--   * Does not force-upgrade execution_days/execution_tasks to the stale
--     plan_date/total_tasks/completed_tasks shape the legacy migration file
--     declares -- hosted's REAL shape (date/weekday/status/total_points/...) is
--     ground truth because the shipped frontend (ExecutionPage.tsx) and the RPC
--     generate_daily_execution_plan already read/write that real shape, not the
--     legacy file's.
--   * Does not touch generate_daily_execution_plan. Reading its live definition
--     (read-only, via pg_get_functiondef) during the audit for this migration
--     surfaced that it depends on public.execution_templates and
--     public.execution_template_tasks -- two tables that exist on hosted but have
--     NO migration file anywhere in this repository (confirmed by grep across
--     supabase/migrations). That is a genuine, separate piece of unmanaged drift,
--     outside the five migrations this convergence reconciles, and is called out
--     in PR #18 as a new finding for follow-up rather than guessed at here.
--   * Does not force-upgrade the 5 existing oura_* tables to the "richer" columns
--     the legacy oura migration adds -- nothing shipped reads them.
--   * Does not widen access anywhere. anon ends this migration with zero grants
--     and zero policies on every table this migration touches.
--
-- SAFE ON THREE STARTING STATES
-- -------------------------------
--   (a) a completely empty database (fresh full migration-chain replay)
--   (b) hosted's exact current partial state (tasks missing; execution_days/
--       execution_tasks present with the real shape, RLS disabled, no policies;
--       5 oura tables present bare-shape with RLS enabled and the policies
--       described above; 7 oura tables + tasks missing)
--   (c) a second run of this exact migration against the state it just produced
--       (idempotent: IF NOT EXISTS / DROP ... IF EXISTS + recreate throughout)
--
-- Every RAISE EXCEPTION below names the object and the actual vs. expected state.
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 0. Data-preservation snapshot. Captured BEFORE any DDL below. Only tables that
--    might already exist and already hold real production data are snapshotted;
--    tables this migration may create fresh are deliberately absent from this
--    list so their starting count of zero is never asserted against.
-- ---------------------------------------------------------------------------
create temporary table _case_d_pre_counts (
  table_name text primary key,
  row_count bigint not null
) on commit drop;

do $$
declare
  t text;
  c bigint;
begin
  foreach t in array array[
    'execution_days', 'execution_tasks',
    'oura_connections', 'oura_daily_sleep', 'oura_daily_readiness',
    'oura_daily_activity', 'oura_heart_rate'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('select count(*) from public.%I', t) into c;
      insert into _case_d_pre_counts (table_name, row_count) values (t, c);
    end if;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. public.tasks -- MISSING hosted entirely. Actively required by
--    src/pages/admin/tasks/TaskDashboardContent.tsx, routed under
--    PlatformAdminRoute (authenticated + is_platform_admin() only). No anon usage
--    anywhere in shipped code, so anon gets nothing here -- unlike the legacy
--    migration's `anon, authenticated USING (true)` policies, which are never
--    applied by this migration.
-- ---------------------------------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  priority text not null default 'medium',
  status text not null default 'open',
  due_date date,
  due_time time,
  money_impact numeric,
  related_lead_id text,
  related_client_id text,
  source text,
  reason text,
  task_key text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.tasks enable row level security;

-- Drop the legacy migration's anon-open policy names in case any prior manual
-- apply ever created them under those names, then install the real ones.
drop policy if exists select_tasks on public.tasks;
drop policy if exists insert_tasks on public.tasks;
drop policy if exists update_tasks on public.tasks;
drop policy if exists delete_tasks on public.tasks;
drop policy if exists tasks_admin_all on public.tasks;

create policy tasks_admin_all on public.tasks
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

revoke all on table public.tasks from public, anon, authenticated;
grant select, insert, update, delete on table public.tasks to authenticated;
grant select, insert, update, delete on table public.tasks to service_role;

-- ---------------------------------------------------------------------------
-- 2. execution_days / execution_tasks.
--
-- If absent (fresh database): create matching HOSTED's real, verified shape --
-- not the legacy migration file's plan_date/total_tasks/completed_tasks schema,
-- because the shipped frontend and generate_daily_execution_plan already use the
-- real shape, not the file's.
--
-- If present (hosted's partial state): the precondition check below fails loudly,
-- naming exactly which expected column is missing, rather than silently doing
-- nothing or attempting to rename/add plan_date-style columns onto a table that
-- does not have them.
-- ---------------------------------------------------------------------------
do $$
declare
  v_missing text;
begin
  if to_regclass('public.execution_days') is null then
    create table public.execution_days (
      id uuid primary key default gen_random_uuid(),
      user_id uuid,
      date date not null,
      weekday integer not null,
      plan_type text not null,
      title text not null,
      status text not null default 'in_progress',
      total_points integer not null default 0,
      completed_points integer not null default 0,
      score_percent numeric not null default 0,
      readiness_status text,
      notes text,
      evening_review text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      constraint execution_days_user_id_date_key unique (user_id, date)
    );
  else
    select string_agg(col, ', ')
      into v_missing
    from unnest(array[
      'user_id','date','weekday','plan_type','title','status',
      'total_points','completed_points','score_percent',
      'readiness_status','notes','evening_review','created_at','updated_at'
    ]) as col
    where not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'execution_days' and column_name = col
    );

    if v_missing is not null then
      raise exception 'public.execution_days exists but is missing expected hosted-shape column(s): %. Refusing to converge -- hosted schema has drifted further than this migration accounts for.', v_missing;
    end if;
  end if;
end;
$$;

do $$
declare
  v_missing text;
begin
  if to_regclass('public.execution_tasks') is null then
    create table public.execution_tasks (
      id uuid primary key default gen_random_uuid(),
      execution_day_id uuid not null references public.execution_days(id) on delete cascade,
      user_id uuid,
      title text not null,
      description text,
      category text not null,
      priority text not null default 'medium',
      planned_start time,
      planned_end time,
      points integer not null default 1,
      is_non_negotiable boolean not null default false,
      is_completed boolean not null default false,
      completed_at timestamptz,
      proof_required boolean not null default false,
      proof_text text,
      sort_order integer not null default 0,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  else
    select string_agg(col, ', ')
      into v_missing
    from unnest(array[
      'execution_day_id','user_id','title','description','category','priority',
      'planned_start','planned_end','points','is_non_negotiable','is_completed',
      'completed_at','proof_required','proof_text','sort_order','created_at','updated_at'
    ]) as col
    where not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'execution_tasks' and column_name = col
    );

    if v_missing is not null then
      raise exception 'public.execution_tasks exists but is missing expected hosted-shape column(s): %. Refusing to converge -- hosted schema has drifted further than this migration accounts for.', v_missing;
    end if;
  end if;
end;
$$;

-- Additive, harmless: execution_tasks.execution_day_id has no supporting index on
-- hosted today; 349 rows tolerate the scan, but this is safe and standard hygiene
-- for a foreign key, and does not change any observable behavior or data.
create index if not exists idx_execution_tasks_day on public.execution_tasks (execution_day_id);

-- Critical fix: enable RLS (was disabled hosted) and remove the anon/authenticated/
-- service_role wide-open grants (was anon-writable hosted).
alter table public.execution_days enable row level security;
alter table public.execution_tasks enable row level security;

drop policy if exists execution_days_all on public.execution_days;
drop policy if exists execution_tasks_all on public.execution_tasks;
drop policy if exists execution_days_admin_all on public.execution_days;
drop policy if exists execution_tasks_admin_all on public.execution_tasks;

create policy execution_days_admin_all on public.execution_days
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy execution_tasks_admin_all on public.execution_tasks
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

revoke all on table public.execution_days from public, anon, authenticated;
revoke all on table public.execution_tasks from public, anon, authenticated;
grant select, insert, update, delete on table public.execution_days to authenticated;
grant select, insert, update, delete on table public.execution_tasks to authenticated;
grant select, insert, update, delete on table public.execution_days to service_role;
grant select, insert, update, delete on table public.execution_tasks to service_role;

-- Idempotently (re)create the recalc plumbing against the REAL column names.
-- generate_daily_execution_plan is deliberately NOT touched here (see header).
create or replace function public.recalc_execution_day_stats(day_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
begin
  select
    coalesce(sum(points), 0) as total_points,
    coalesce(sum(points) filter (where is_completed), 0) as completed_points,
    count(*) as total_task_count,
    count(*) filter (where is_completed) as completed_task_count
  into rec
  from public.execution_tasks
  where execution_day_id = day_id;

  update public.execution_days
  set
    total_points = rec.total_points,
    completed_points = rec.completed_points,
    score_percent = case
      when rec.total_points > 0
        then round((rec.completed_points::numeric / rec.total_points) * 100, 2)
      else 0
    end,
    -- No CHECK constraint exists hosted on status (verified). There is no
    -- total_tasks/completed_tasks column hosted to persist, only points; the
    -- only status transition asserted here is "all tasks complete" -> 'completed'.
    -- Any other state is left at its current value (default 'in_progress'),
    -- matching hosted's evidenced vocabulary rather than reintroducing the
    -- legacy file's unused 'pending' value.
    status = case
      when rec.total_task_count > 0 and rec.completed_task_count = rec.total_task_count
        then 'completed'
      when status = 'completed' and rec.completed_task_count < rec.total_task_count
        then 'in_progress'
      else status
    end,
    updated_at = now()
  where id = day_id;
end;
$$;

create or replace function public.trigger_recalc_execution_day()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recalc_execution_day_stats(coalesce(new.execution_day_id, old.execution_day_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_execution_tasks_recalc on public.execution_tasks;
create trigger trg_execution_tasks_recalc
  after insert or update or delete on public.execution_tasks
  for each row execute function public.trigger_recalc_execution_day();

revoke all on function public.recalc_execution_day_stats(uuid) from public, anon;
grant execute on function public.recalc_execution_day_stats(uuid) to authenticated, service_role;
revoke all on function public.trigger_recalc_execution_day() from public, anon;
grant execute on function public.trigger_recalc_execution_day() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. oura_* tables.
--
-- 5 existing tables (oura_connections, oura_daily_sleep, oura_daily_readiness,
-- oura_daily_activity, oura_heart_rate): preserve their existing bare-shape
-- columns untouched. Precondition-check the columns sync-oura and
-- OuraAnalyticsPage actually depend on, then fix RLS/policies/grants.
--
-- 7 missing tables (oura_sleep_sessions, oura_workouts, oura_sessions, oura_tags,
-- oura_spo2, oura_daily_stress, oura_daily_resilience): create to match
-- supabase/functions/sync-oura/index.ts's actual EndpointConfig write contract
-- (columns + onConflict-implied unique index), read directly from that file.
-- ---------------------------------------------------------------------------
do $$
declare
  v_missing text;
begin
  if to_regclass('public.oura_connections') is not null then
    select string_agg(col, ', ')
      into v_missing
    from unnest(array['id','access_token','refresh_token']) as col
    where not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'oura_connections' and column_name = col
    );
    if v_missing is not null then
      raise exception 'public.oura_connections exists but is missing expected column(s): %. Refusing to converge.', v_missing;
    end if;
  end if;

  if to_regclass('public.oura_daily_sleep') is not null then
    select string_agg(col, ', ')
      into v_missing
    from unnest(array['id','connection_id','day','score','raw','synced_at']) as col
    where not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'oura_daily_sleep' and column_name = col
    );
    if v_missing is not null then
      raise exception 'public.oura_daily_sleep exists but is missing expected column(s): %. Refusing to converge.', v_missing;
    end if;
  end if;

  if to_regclass('public.oura_daily_readiness') is not null then
    select string_agg(col, ', ')
      into v_missing
    from unnest(array['id','connection_id','day','score','raw','synced_at']) as col
    where not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'oura_daily_readiness' and column_name = col
    );
    if v_missing is not null then
      raise exception 'public.oura_daily_readiness exists but is missing expected column(s): %. Refusing to converge.', v_missing;
    end if;
  end if;

  if to_regclass('public.oura_daily_activity') is not null then
    select string_agg(col, ', ')
      into v_missing
    from unnest(array['id','connection_id','day','score','steps','raw','synced_at']) as col
    where not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'oura_daily_activity' and column_name = col
    );
    if v_missing is not null then
      raise exception 'public.oura_daily_activity exists but is missing expected column(s): %. Refusing to converge.', v_missing;
    end if;
  end if;

  if to_regclass('public.oura_heart_rate') is not null then
    select string_agg(col, ', ')
      into v_missing
    from unnest(array['id','connection_id','timestamp','bpm','source','raw','synced_at']) as col
    where not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'oura_heart_rate' and column_name = col
    );
    if v_missing is not null then
      raise exception 'public.oura_heart_rate exists but is missing expected column(s): %. Refusing to converge.', v_missing;
    end if;
  end if;
end;
$$;

-- Create the 5 base tables if this is a fresh database (fresh-chain test). On
-- hosted's partial state these are all already present and IF NOT EXISTS no-ops.
create table if not exists public.oura_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  oura_email text,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz,
  scopes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.oura_daily_sleep (
  id text primary key,
  connection_id uuid references public.oura_connections(id) on delete cascade,
  day date,
  score integer,
  raw jsonb not null,
  synced_at timestamptz default now()
);

create table if not exists public.oura_daily_readiness (
  id text primary key,
  connection_id uuid references public.oura_connections(id) on delete cascade,
  day date,
  score integer,
  raw jsonb not null,
  synced_at timestamptz default now()
);

create table if not exists public.oura_daily_activity (
  id text primary key,
  connection_id uuid references public.oura_connections(id) on delete cascade,
  day date,
  score integer,
  steps integer,
  raw jsonb not null,
  synced_at timestamptz default now()
);

create table if not exists public.oura_heart_rate (
  id bigint generated by default as identity primary key,
  connection_id uuid references public.oura_connections(id) on delete cascade,
  timestamp timestamptz not null,
  bpm integer,
  source text,
  raw jsonb not null,
  synced_at timestamptz default now()
);
create unique index if not exists oura_heart_rate_connection_id_timestamp_source_key
  on public.oura_heart_rate (connection_id, timestamp, source);

-- The 7 tables sync-oura writes to but hosted never had. Columns + unique index
-- taken directly from supabase/functions/sync-oura/index.ts's endpointConfigs
-- (mapItem field list and onConflict string per endpoint).
create table if not exists public.oura_sleep_sessions (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid references public.oura_connections(id) on delete cascade,
  oura_id text,
  day date,
  type text,
  bedtime_start timestamptz,
  bedtime_end timestamptz,
  score numeric,
  raw jsonb not null,
  synced_at timestamptz not null default now()
);
create unique index if not exists oura_sleep_sessions_connection_oura_id_idx
  on public.oura_sleep_sessions (connection_id, oura_id);

create table if not exists public.oura_workouts (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid references public.oura_connections(id) on delete cascade,
  oura_id text,
  day date,
  activity text,
  start_datetime timestamptz,
  end_datetime timestamptz,
  calories numeric,
  distance numeric,
  raw jsonb not null,
  synced_at timestamptz not null default now()
);
create unique index if not exists oura_workouts_connection_oura_id_idx
  on public.oura_workouts (connection_id, oura_id);

create table if not exists public.oura_sessions (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid references public.oura_connections(id) on delete cascade,
  oura_id text,
  day date,
  type text,
  start_datetime timestamptz,
  end_datetime timestamptz,
  raw jsonb not null,
  synced_at timestamptz not null default now()
);
create unique index if not exists oura_sessions_connection_oura_id_idx
  on public.oura_sessions (connection_id, oura_id);

create table if not exists public.oura_tags (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid references public.oura_connections(id) on delete cascade,
  oura_id text,
  day date,
  tag text,
  start_datetime timestamptz,
  end_datetime timestamptz,
  raw jsonb not null,
  synced_at timestamptz not null default now()
);
create unique index if not exists oura_tags_connection_oura_id_idx
  on public.oura_tags (connection_id, oura_id);

create table if not exists public.oura_spo2 (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid references public.oura_connections(id) on delete cascade,
  day date,
  spo2_percentage numeric,
  raw jsonb not null,
  synced_at timestamptz not null default now()
);
create unique index if not exists oura_spo2_connection_day_idx
  on public.oura_spo2 (connection_id, day);

create table if not exists public.oura_daily_stress (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid references public.oura_connections(id) on delete cascade,
  day date,
  stress_high integer,
  recovery_high integer,
  day_summary text,
  raw jsonb not null,
  synced_at timestamptz not null default now()
);
create unique index if not exists oura_daily_stress_connection_day_idx
  on public.oura_daily_stress (connection_id, day);

create table if not exists public.oura_daily_resilience (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid references public.oura_connections(id) on delete cascade,
  day date,
  level text,
  score numeric,
  raw jsonb not null,
  synced_at timestamptz not null default now()
);
create unique index if not exists oura_daily_resilience_connection_day_idx
  on public.oura_daily_resilience (connection_id, day);

-- RLS + policies + grants, identical shape across all 12 oura_* tables:
-- authenticated + is_platform_admin() only, zero anon, service_role bypasses RLS
-- regardless (sync-oura writes via the service_role key). This also drops the
-- specific overly-permissive `roles={public}, qual=true` SELECT policies found
-- live on oura_daily_activity/oura_daily_readiness/oura_daily_sleep hosted
-- ("Allow frontend read oura activity/readiness/sleep") -- those currently let
-- ANY role, anon included, read all rows of those three tables.
do $$
declare
  t text;
begin
  foreach t in array array[
    'oura_connections', 'oura_daily_sleep', 'oura_daily_readiness', 'oura_daily_activity',
    'oura_heart_rate', 'oura_sleep_sessions', 'oura_workouts', 'oura_sessions', 'oura_tags',
    'oura_spo2', 'oura_daily_stress', 'oura_daily_resilience'
  ] loop
    execute format('alter table public.%I enable row level security', t);

    -- Known pre-existing wide-open policy names found live on hosted.
    execute format('drop policy if exists %I on public.%I', 'Allow frontend read oura activity', t);
    execute format('drop policy if exists %I on public.%I', 'Allow frontend read oura readiness', t);
    execute format('drop policy if exists %I on public.%I', 'Allow frontend read oura sleep', t);
    execute format('drop policy if exists %I on public.%I', t || '_admin_all', t);

    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin())',
      t || '_admin_all', t
    );

    execute format('revoke all on table public.%I from public, anon, authenticated', t);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', t);
    execute format('grant select, insert, update, delete on table public.%I to service_role', t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Data-preservation assertion. Only checked for tables that existed BEFORE
--    this migration ran (captured in step 0); newly-created tables are absent
--    from _case_d_pre_counts and are never asserted against here.
-- ---------------------------------------------------------------------------
do $$
declare
  r record;
  c bigint;
begin
  for r in select table_name, row_count from _case_d_pre_counts loop
    execute format('select count(*) from public.%I', r.table_name) into c;
    if c <> r.row_count then
      raise exception 'data-preservation check failed for public.%: had % rows before this migration, has % rows after. This migration must never change existing row counts.', r.table_name, r.row_count, c;
    end if;
  end loop;
end;
$$;

commit;
