-- =============================================================================
-- Case D convergence -- SCENARIO (b): hosted's exact partial state
-- =============================================================================
-- Runs against a throwaway database that has had the REAL phase-0 tenancy chain
-- applied and nothing else. This file itself builds hosted's exact verified
-- partial topology (see 20260731122000_case_d_legacy_convergence.sql's header
-- for the citations), proves the real exposure hosted currently has, applies the
-- convergence migration via \ir, then proves: every pre-existing row survived
-- exactly, the exposure is gone, admin access still works, and a second
-- (idempotent) application of the migration changes nothing further.
-- =============================================================================

\set ON_ERROR_STOP on

-- ---------------------------------------------------------------------------
-- Identities: an internal Cogniiq admin (is_platform_admin() = true) and an
-- ordinary authenticated user who is not an admin.
-- ---------------------------------------------------------------------------
do $$
declare
  v_admin uuid := gen_random_uuid();
  v_user uuid := gen_random_uuid();
begin
  insert into auth.users (id, email, email_confirmed_at) values
    (v_admin, 'admin@cogniiq.de', now()),
    (v_user, 'user@cogniiq.de', now());

  update public.profiles set platform_role = 'cogniiq_owner' where id = v_admin;

  create table test_ids (k text primary key, v uuid);
  insert into test_ids values ('admin', v_admin), ('user', v_user);
end;
$$;

create or replace function test_id(p_key text) returns uuid
language sql stable as $$ select v from test_ids where k = p_key $$;

-- ---------------------------------------------------------------------------
-- Hosted's REAL, verified partial topology:
--   * public.tasks: absent.
--   * execution_days / execution_tasks: present, real shape, RLS DISABLED,
--     anon/authenticated/service_role all hold full grants, real FK, no CHECK
--     on status. Seeded at hosted's real order of magnitude: 26 / 349 rows.
--   * execution_templates / execution_template_tasks: present, real shape, RLS
--     DISABLED, anon/authenticated/service_role all hold full grants, real FK.
--     No migration file anywhere in this repository. Seeded at hosted's real
--     order of magnitude: 7 / 94 rows.
--   * 5 oura_* tables: present, bare shape, RLS ENABLED. oura_daily_activity /
--     oura_daily_readiness / oura_daily_sleep each carry a PERMISSIVE
--     `roles={public}, qual=true` SELECT policy (verified live on hosted --
--     this is real, current anon-readable exposure, not a hypothetical).
--     oura_connections / oura_heart_rate: RLS enabled, zero policies (deny-all).
--     Seeded at hosted's real order of magnitude: connections=6, three daily
--     tables=18 each, heart_rate=0.
--   * 7 oura_* tables: absent.
-- ---------------------------------------------------------------------------
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

grant insert, select, update, delete, truncate, references, trigger on table public.execution_days to anon, authenticated, service_role;
grant insert, select, update, delete, truncate, references, trigger on table public.execution_tasks to anon, authenticated, service_role;

create table public.execution_templates (
  id uuid primary key default gen_random_uuid(),
  weekday integer not null,
  plan_type text not null,
  title text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.execution_template_tasks (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.execution_templates(id) on delete cascade,
  title text not null,
  description text,
  category text not null,
  priority text not null default 'medium',
  planned_start time,
  planned_end time,
  points integer not null default 1,
  is_non_negotiable boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

grant insert, select, update, delete, truncate, references, trigger on table public.execution_templates to anon, authenticated, service_role;
grant insert, select, update, delete, truncate, references, trigger on table public.execution_template_tasks to anon, authenticated, service_role;

create table public.oura_connections (
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

create table public.oura_daily_sleep (
  id text primary key,
  connection_id uuid references public.oura_connections(id) on delete cascade,
  day date,
  score integer,
  raw jsonb not null,
  synced_at timestamptz default now()
);

create table public.oura_daily_readiness (
  id text primary key,
  connection_id uuid references public.oura_connections(id) on delete cascade,
  day date,
  score integer,
  raw jsonb not null,
  synced_at timestamptz default now()
);

create table public.oura_daily_activity (
  id text primary key,
  connection_id uuid references public.oura_connections(id) on delete cascade,
  day date,
  score integer,
  steps integer,
  raw jsonb not null,
  synced_at timestamptz default now()
);

create table public.oura_heart_rate (
  id bigint generated by default as identity primary key,
  connection_id uuid references public.oura_connections(id) on delete cascade,
  timestamp timestamptz not null,
  bpm integer,
  source text,
  raw jsonb not null,
  synced_at timestamptz default now()
);
create unique index oura_heart_rate_connection_id_timestamp_source_key
  on public.oura_heart_rate (connection_id, timestamp, source);

alter table public.oura_connections enable row level security;
alter table public.oura_daily_sleep enable row level security;
alter table public.oura_daily_readiness enable row level security;
alter table public.oura_daily_activity enable row level security;
alter table public.oura_heart_rate enable row level security;

-- The exact live policy hosted carries on these three tables today.
create policy "Allow frontend read oura sleep" on public.oura_daily_sleep for select to public using (true);
create policy "Allow frontend read oura readiness" on public.oura_daily_readiness for select to public using (true);
create policy "Allow frontend read oura activity" on public.oura_daily_activity for select to public using (true);
-- oura_connections / oura_heart_rate deliberately get zero policies (deny-all), matching hosted.

grant insert, select, update, delete, truncate, references, trigger on table public.oura_connections to anon, authenticated, service_role;
grant insert, select, update, delete, truncate, references, trigger on table public.oura_daily_sleep to anon, authenticated, service_role;
grant insert, select, update, delete, truncate, references, trigger on table public.oura_daily_readiness to anon, authenticated, service_role;
grant insert, select, update, delete, truncate, references, trigger on table public.oura_daily_activity to anon, authenticated, service_role;
grant insert, select, update, delete, truncate, references, trigger on table public.oura_heart_rate to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Seed at hosted's real order of magnitude.
-- ---------------------------------------------------------------------------
do $$
declare
  v_day uuid;
  i int;
  j int;
  v_conn uuid;
begin
  for i in 1..26 loop
    insert into public.execution_days (date, weekday, plan_type, title, status)
    values (current_date - i, extract(dow from current_date - i)::int, 'standard',
            'Execution Day ' || i, case when i % 5 = 0 then 'completed' else 'in_progress' end)
    returning id into v_day;

    for j in 1..(349 / 26 + 1) loop
      exit when (select count(*) from public.execution_tasks) >= 349;
      insert into public.execution_tasks (execution_day_id, title, category, points, is_completed)
      values (v_day, 'Task ' || i || '-' || j, 'focus', 1, (j % 2 = 0));
    end loop;
  end loop;

  -- Trim/pad to exactly 349 so the fixture matches hosted's verified count precisely.
  if (select count(*) from public.execution_tasks) > 349 then
    delete from public.execution_tasks
    where id in (
      select id from public.execution_tasks
      order by id
      limit (select count(*) from public.execution_tasks) - 349
    );
  end if;

  for i in 1..7 loop
    declare
      v_template uuid;
    begin
      insert into public.execution_templates (weekday, plan_type, title)
      values (i % 7, 'standard', 'Template ' || i)
      returning id into v_template;

      for j in 1..(94 / 7 + 1) loop
        exit when (select count(*) from public.execution_template_tasks) >= 94;
        insert into public.execution_template_tasks (template_id, title, category, sort_order)
        values (v_template, 'Template Task ' || i || '-' || j, 'focus', j);
      end loop;
    end;
  end loop;

  if (select count(*) from public.execution_template_tasks) > 94 then
    delete from public.execution_template_tasks
    where id in (
      select id from public.execution_template_tasks
      order by id
      limit (select count(*) from public.execution_template_tasks) - 94
    );
  end if;

  for i in 1..6 loop
    insert into public.oura_connections (access_token, refresh_token)
    values ('token-' || i, 'refresh-' || i)
    returning id into v_conn;

    if i <= 3 then
      for j in 1..6 loop
        insert into public.oura_daily_sleep (id, connection_id, day, score, raw)
        values ('sleep-' || i || '-' || j, v_conn, current_date - j, 70 + j, '{}'::jsonb);
        insert into public.oura_daily_readiness (id, connection_id, day, score, raw)
        values ('readiness-' || i || '-' || j, v_conn, current_date - j, 60 + j, '{}'::jsonb);
        insert into public.oura_daily_activity (id, connection_id, day, score, steps, raw)
        values ('activity-' || i || '-' || j, v_conn, current_date - j, 80 + j, 8000 + j, '{}'::jsonb);
      end loop;
    end if;
  end loop;
end;
$$;

do $$
declare
  v_counts record;
begin
  select
    (select count(*) from public.execution_days) as execution_days,
    (select count(*) from public.execution_tasks) as execution_tasks,
    (select count(*) from public.execution_templates) as execution_templates,
    (select count(*) from public.execution_template_tasks) as execution_template_tasks,
    (select count(*) from public.oura_connections) as oura_connections,
    (select count(*) from public.oura_daily_sleep) as oura_daily_sleep,
    (select count(*) from public.oura_daily_readiness) as oura_daily_readiness,
    (select count(*) from public.oura_daily_activity) as oura_daily_activity,
    (select count(*) from public.oura_heart_rate) as oura_heart_rate
  into v_counts;

  if v_counts.execution_days <> 26 or v_counts.execution_tasks <> 349
     or v_counts.execution_templates <> 7 or v_counts.execution_template_tasks <> 94
     or v_counts.oura_connections <> 6 or v_counts.oura_daily_sleep <> 18
     or v_counts.oura_daily_readiness <> 18 or v_counts.oura_daily_activity <> 18
     or v_counts.oura_heart_rate <> 0 then
    raise exception 'TEST SETUP FAILED: fixture row counts do not match hosted''s real order of magnitude: %', v_counts;
  end if;
end;
$$;

-- Snapshot exact primary-key sets before convergence, to prove afterwards that not
-- a single pre-existing row was dropped, recreated, or had its id changed.
create table _case_d_pk_snapshot_before as
select 'execution_days'::text as table_name, id::text as pk from public.execution_days
union all select 'execution_tasks', id::text from public.execution_tasks
union all select 'execution_templates', id::text from public.execution_templates
union all select 'execution_template_tasks', id::text from public.execution_template_tasks
union all select 'oura_connections', id::text from public.oura_connections
union all select 'oura_daily_sleep', id::text from public.oura_daily_sleep
union all select 'oura_daily_readiness', id::text from public.oura_daily_readiness
union all select 'oura_daily_activity', id::text from public.oura_daily_activity;

-- ---------------------------------------------------------------------------
-- BEFORE assertions: prove the exposure is REAL, not hypothetical, prior to
-- convergence. anon can read AND write execution_days/execution_tasks, and can
-- read (but per the live policy shape, not write -- INSERT/UPDATE/DELETE still
-- require a WITH CHECK clause the policy never supplies, so those remain denied
-- even pre-convergence) the three oura tables carrying the public policy.
-- ---------------------------------------------------------------------------
do $$
declare
  v_count bigint;
  v_id uuid;
begin
  set local role anon;

  -- anon can already read every execution_days / execution_tasks row.
  select count(*) into v_count from public.execution_days;
  if v_count <> 26 then
    raise exception 'TEST SETUP FAILED: anon cannot see execution_days pre-convergence (count=%), fixture does not reproduce the real exposure', v_count;
  end if;

  select count(*) into v_count from public.execution_tasks;
  if v_count <> 349 then
    raise exception 'TEST SETUP FAILED: anon cannot see execution_tasks pre-convergence (count=%), fixture does not reproduce the real exposure', v_count;
  end if;

  -- anon can already WRITE execution_days -- this is the live production exposure.
  insert into public.execution_days (date, weekday, plan_type, title)
  values (current_date + 1000, 1, 'standard', 'anon-write-proof')
  returning id into v_id;
  if v_id is null then
    raise exception 'TEST SETUP FAILED: anon insert into execution_days pre-convergence did not succeed as expected';
  end if;
  delete from public.execution_days where id = v_id;

  -- anon can already read the three oura tables carrying the public policy.
  select count(*) into v_count from public.oura_daily_sleep;
  if v_count <> 18 then
    raise exception 'TEST SETUP FAILED: anon cannot see oura_daily_sleep pre-convergence (count=%)', v_count;
  end if;

  -- anon can already read AND write execution_templates/execution_template_tasks.
  select count(*) into v_count from public.execution_templates;
  if v_count <> 7 then
    raise exception 'TEST SETUP FAILED: anon cannot see execution_templates pre-convergence (count=%), fixture does not reproduce the real exposure', v_count;
  end if;

  select count(*) into v_count from public.execution_template_tasks;
  if v_count <> 94 then
    raise exception 'TEST SETUP FAILED: anon cannot see execution_template_tasks pre-convergence (count=%), fixture does not reproduce the real exposure', v_count;
  end if;

  insert into public.execution_templates (weekday, plan_type, title)
  values (9, 'standard', 'anon-write-proof')
  returning id into v_id;
  if v_id is null then
    raise exception 'TEST SETUP FAILED: anon insert into execution_templates pre-convergence did not succeed as expected';
  end if;
  delete from public.execution_templates where id = v_id;

  reset role;
end;
$$;

\echo 'BEFORE-convergence exposure proven: anon could read+write execution_days/execution_tasks/execution_templates/execution_template_tasks and read oura_daily_sleep/readiness/activity.'

-- ---------------------------------------------------------------------------
-- Apply the convergence migration.
-- ---------------------------------------------------------------------------
\ir ../../../supabase/migrations/20260731122000_case_d_legacy_convergence.sql

-- ---------------------------------------------------------------------------
-- AFTER assertions: data preservation (counts + exact PK sets), full lockout
-- for anon and non-admin authenticated, full access for the admin, and
-- service_role unaffected.
-- ---------------------------------------------------------------------------
do $$
declare
  v_before bigint;
  v_after bigint;
  v_diff bigint;
begin
  select count(*) into v_before from _case_d_pk_snapshot_before;

  select count(*) into v_diff
  from _case_d_pk_snapshot_before b
  where not exists (
    select 1 from (
      select 'execution_days'::text as table_name, id::text as pk from public.execution_days
      union all select 'execution_tasks', id::text from public.execution_tasks
      union all select 'execution_templates', id::text from public.execution_templates
      union all select 'execution_template_tasks', id::text from public.execution_template_tasks
      union all select 'oura_connections', id::text from public.oura_connections
      union all select 'oura_daily_sleep', id::text from public.oura_daily_sleep
      union all select 'oura_daily_readiness', id::text from public.oura_daily_readiness
      union all select 'oura_daily_activity', id::text from public.oura_daily_activity
    ) a
    where a.table_name = b.table_name and a.pk = b.pk
  );

  if v_diff <> 0 then
    raise exception 'TEST FAILED: % pre-existing row(s) vanished or changed primary key after convergence', v_diff;
  end if;

  select
    (select count(*) from public.execution_days) + (select count(*) from public.execution_tasks)
    + (select count(*) from public.execution_templates) + (select count(*) from public.execution_template_tasks)
    + (select count(*) from public.oura_connections) + (select count(*) from public.oura_daily_sleep)
    + (select count(*) from public.oura_daily_readiness) + (select count(*) from public.oura_daily_activity)
  into v_after;

  if v_after <> v_before then
    raise exception 'TEST FAILED: total row count across preserved tables changed from % to %', v_before, v_after;
  end if;
end;
$$;

\echo 'Data preservation proven: exact primary-key sets and row counts unchanged across execution_days/execution_tasks/execution_templates/execution_template_tasks/oura_connections/oura_daily_sleep/oura_daily_readiness/oura_daily_activity.'

do $$
declare
  t text;
  v_count bigint;
  v_threw boolean;
begin
  foreach t in array array[
    'tasks', 'execution_days', 'execution_tasks',
    'execution_templates', 'execution_template_tasks',
    'oura_connections', 'oura_daily_sleep', 'oura_daily_readiness', 'oura_daily_activity',
    'oura_heart_rate', 'oura_sleep_sessions', 'oura_workouts', 'oura_sessions', 'oura_tags',
    'oura_spo2', 'oura_daily_stress', 'oura_daily_resilience'
  ] loop
    -- anon: fully locked out now, including on the three tables that used to leak.
    -- Table-level grants are revoked entirely, so SELECT itself is refused
    -- (permission denied) rather than merely filtered to zero rows; either
    -- outcome proves no access.
    perform public.test_become(null);
    set local role anon;
    v_count := -1;
    begin
      execute format('select count(*) from public.%I', t) into v_count;
    exception when others then v_count := 0;
    end;
    if v_count <> 0 then
      raise exception 'TEST FAILED: anon can still see % row(s) of public.% AFTER convergence', v_count, t;
    end if;
    v_threw := false;
    begin
      execute format($f$insert into public.%I default values$f$, t);
    exception when others then v_threw := true;
    end;
    if not v_threw then
      raise exception 'TEST FAILED: anon can still insert into public.% AFTER convergence', t;
    end if;
    reset role;

    -- non-admin authenticated: also locked out.
    perform public.test_become(test_id('user'));
    set local role authenticated;
    execute format('select count(*) from public.%I', t) into v_count;
    if v_count <> 0 then
      raise exception 'TEST FAILED: non-admin authenticated can see % row(s) of public.% AFTER convergence', v_count, t;
    end if;
    reset role;
  end loop;
end;
$$;

\echo 'Anon + non-admin lockout proven on all 17 tables after convergence.'

do $$
declare
  v_count bigint;
begin
  -- admin: full access restored via is_platform_admin().
  perform public.test_become(test_id('admin'));
  set local role authenticated;

  select count(*) into v_count from public.execution_days;
  if v_count <> 26 then
    raise exception 'TEST FAILED: admin cannot see all 26 execution_days rows after convergence (count=%)', v_count;
  end if;

  select count(*) into v_count from public.oura_daily_sleep;
  if v_count <> 18 then
    raise exception 'TEST FAILED: admin cannot see all 18 oura_daily_sleep rows after convergence (count=%)', v_count;
  end if;

  select count(*) into v_count from public.execution_templates;
  if v_count <> 7 then
    raise exception 'TEST FAILED: admin cannot see all 7 execution_templates rows after convergence (count=%)', v_count;
  end if;

  select count(*) into v_count from public.execution_template_tasks;
  if v_count <> 94 then
    raise exception 'TEST FAILED: admin cannot see all 94 execution_template_tasks rows after convergence (count=%)', v_count;
  end if;

  insert into public.tasks (title) values ('Admin can create tasks post-convergence');
  select count(*) into v_count from public.tasks;
  if v_count <> 1 then
    raise exception 'TEST FAILED: admin could not create a task post-convergence';
  end if;

  reset role;

  -- service_role: unaffected by RLS regardless of policy contents.
  set local role service_role;
  select count(*) into v_count from public.execution_days;
  if v_count <> 26 then
    raise exception 'TEST FAILED: service_role cannot see execution_days after convergence (count=%)', v_count;
  end if;
  select count(*) into v_count from public.tasks;
  if v_count <> 1 then
    raise exception 'TEST FAILED: service_role cannot see tasks after convergence (count=%)', v_count;
  end if;
  select count(*) into v_count from public.execution_templates;
  if v_count <> 7 then
    raise exception 'TEST FAILED: service_role cannot see execution_templates after convergence (count=%)', v_count;
  end if;
  reset role;
end;
$$;

\echo 'Admin full access + service_role bypass proven after convergence.'

-- ---------------------------------------------------------------------------
-- Idempotent replay: this exact migration must apply a second time, on the
-- state it just produced, without error and without changing anything further.
-- ---------------------------------------------------------------------------
\ir ../../../supabase/migrations/20260731122000_case_d_legacy_convergence.sql

do $$
declare
  v_count bigint;
begin
  select count(*) into v_count from public.execution_days;
  if v_count <> 26 then
    raise exception 'TEST FAILED: idempotent replay changed execution_days row count to %', v_count;
  end if;
  select count(*) into v_count from public.tasks;
  if v_count <> 1 then
    raise exception 'TEST FAILED: idempotent replay changed tasks row count to %', v_count;
  end if;
  select count(*) into v_count from public.execution_templates;
  if v_count <> 7 then
    raise exception 'TEST FAILED: idempotent replay changed execution_templates row count to %', v_count;
  end if;
  select count(*) into v_count from public.execution_template_tasks;
  if v_count <> 94 then
    raise exception 'TEST FAILED: idempotent replay changed execution_template_tasks row count to %', v_count;
  end if;

  perform public.test_become(null);
  set local role anon;
  v_count := -1;
  begin
    select count(*) into v_count from public.execution_days;
  exception when others then v_count := 0;
  end;
  if v_count <> 0 then
    raise exception 'TEST FAILED: idempotent replay reopened anon access to execution_days (count=%)', v_count;
  end if;
  v_count := -1;
  begin
    select count(*) into v_count from public.execution_templates;
  exception when others then v_count := 0;
  end;
  if v_count <> 0 then
    raise exception 'TEST FAILED: idempotent replay reopened anon access to execution_templates (count=%)', v_count;
  end if;
  reset role;
end;
$$;

\echo 'Idempotent replay proven: second application succeeded with zero further change.'

\echo 'case-d-legacy-convergence-partial-tests: ALL PASSED'
