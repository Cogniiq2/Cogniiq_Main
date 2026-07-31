-- =============================================================================
-- Case D convergence -- SCENARIO (a): complete fresh migration chain
-- =============================================================================
-- Runs against a throwaway database that has had the REAL phase-0 tenancy chain
-- applied and NOTHING else -- tasks/execution_*/oura_* have never existed. The
-- runner then applies 20260801120000_case_d_legacy_convergence.sql on top before
-- this file runs. This file only asserts the end state: everything the migration
-- is supposed to create exists, with the right shape, RLS and access boundary --
-- proving the "empty database" starting state converges correctly, matching
-- where hosted's own partial-state convergence (see the -partial- suite) ends up.
-- =============================================================================

\set ON_ERROR_STOP on

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
-- All twelve oura_* tables + tasks + execution_days + execution_tasks must exist,
-- with RLS enabled, on a database that started completely empty.
-- ---------------------------------------------------------------------------
do $$
declare
  v_missing text;
begin
  select string_agg(t, ', ')
    into v_missing
  from unnest(array[
    'tasks', 'execution_days', 'execution_tasks',
    'oura_connections', 'oura_daily_sleep', 'oura_daily_readiness', 'oura_daily_activity',
    'oura_heart_rate', 'oura_sleep_sessions', 'oura_workouts', 'oura_sessions', 'oura_tags',
    'oura_spo2', 'oura_daily_stress', 'oura_daily_resilience'
  ]) as t
  where to_regclass('public.' || t) is null;

  if v_missing is not null then
    raise exception 'TEST FAILED (fresh chain): tables missing after convergence: %', v_missing;
  end if;

  select string_agg(t, ', ')
    into v_missing
  from unnest(array[
    'tasks', 'execution_days', 'execution_tasks',
    'oura_connections', 'oura_daily_sleep', 'oura_daily_readiness', 'oura_daily_activity',
    'oura_heart_rate', 'oura_sleep_sessions', 'oura_workouts', 'oura_sessions', 'oura_tags',
    'oura_spo2', 'oura_daily_stress', 'oura_daily_resilience'
  ]) as t
  where not (select relrowsecurity from pg_class where oid = ('public.' || t)::regclass);

  if v_missing is not null then
    raise exception 'TEST FAILED (fresh chain): RLS not enabled on: %', v_missing;
  end if;
end;
$$;

-- execution_tasks -> execution_days FK must exist (matches hosted's real, verified state).
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.execution_tasks'::regclass
      and confrelid = 'public.execution_days'::regclass
      and contype = 'f'
  ) then
    raise exception 'TEST FAILED (fresh chain): execution_tasks -> execution_days foreign key missing';
  end if;
end;
$$;

-- recalc plumbing must exist and actually work end to end.
do $$
declare
  v_day uuid;
  v_pct numeric;
  v_status text;
begin
  perform public.test_become(test_id('admin'));
  set local role authenticated;
  perform set_config('request.jwt.claim.role', 'authenticated', true);

  insert into public.execution_days (date, weekday, plan_type, title)
  values (current_date, 3, 'standard', 'Fresh Chain Day')
  returning id into v_day;

  insert into public.execution_tasks (execution_day_id, title, category, points, is_completed)
  values (v_day, 'Task 1', 'focus', 2, true), (v_day, 'Task 2', 'focus', 3, false);

  select score_percent, status into v_pct, v_status from public.execution_days where id = v_day;
  if v_pct <> 40.00 then
    raise exception 'TEST FAILED (fresh chain): recalc trigger produced score_percent=%, expected 40.00', v_pct;
  end if;
  if v_status <> 'in_progress' then
    raise exception 'TEST FAILED (fresh chain): recalc trigger produced status=%, expected in_progress', v_status;
  end if;

  update public.execution_tasks set is_completed = true where execution_day_id = v_day and title = 'Task 2';
  select score_percent, status into v_pct, v_status from public.execution_days where id = v_day;
  if v_pct <> 100.00 or v_status <> 'completed' then
    raise exception 'TEST FAILED (fresh chain): recalc trigger did not reach 100%%/completed, got %/%', v_pct, v_status;
  end if;

  reset role;
end;
$$;

-- ---------------------------------------------------------------------------
-- Access boundary on a fresh database: anon gets nothing anywhere; a non-admin
-- authenticated user gets nothing; the admin gets everything; service_role
-- bypasses RLS entirely.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
  v_count bigint;
  v_threw boolean;
begin
  foreach t in array array[
    'tasks', 'execution_days', 'execution_tasks',
    'oura_connections', 'oura_daily_sleep', 'oura_daily_readiness', 'oura_daily_activity',
    'oura_heart_rate', 'oura_sleep_sessions', 'oura_workouts', 'oura_sessions', 'oura_tags',
    'oura_spo2', 'oura_daily_stress', 'oura_daily_resilience'
  ] loop
    -- anon: table-level grants are revoked entirely, so SELECT itself must be
    -- refused (permission denied) rather than merely filtered to zero rows by
    -- RLS. Either outcome proves no access; a SELECT that unexpectedly succeeds
    -- with rows visible is the only failure.
    perform public.test_become(null);
    set local role anon;
    v_count := -1;
    begin
      execute format('select count(*) from public.%I', t) into v_count;
    exception when others then v_count := 0;
    end;
    if v_count <> 0 then
      raise exception 'TEST FAILED (fresh chain): anon can see % row(s) of public.% on a fresh converged database', v_count, t;
    end if;
    v_threw := false;
    begin
      execute format($f$insert into public.%I default values$f$, t);
    exception when others then v_threw := true;
    end;
    if not v_threw then
      raise exception 'TEST FAILED (fresh chain): anon inserted into public.% on a fresh converged database', t;
    end if;
    reset role;

    -- non-admin authenticated: RLS denies (grants exist but policy USING fails).
    perform public.test_become(test_id('user'));
    set local role authenticated;
    execute format('select count(*) from public.%I', t) into v_count;
    if v_count <> 0 then
      raise exception 'TEST FAILED (fresh chain): non-admin authenticated can see % row(s) of public.%', v_count, t;
    end if;
    reset role;
  end loop;
end;
$$;

do $$
declare
  v_count bigint;
begin
  -- admin (authenticated + is_platform_admin()) sees the rows created above.
  perform public.test_become(test_id('admin'));
  set local role authenticated;
  select count(*) into v_count from public.execution_days;
  if v_count <> 1 then
    raise exception 'TEST FAILED (fresh chain): admin cannot see the execution_days row it created (count=%)', v_count;
  end if;
  reset role;

  -- service_role bypasses RLS regardless of policy contents.
  set local role service_role;
  select count(*) into v_count from public.execution_days;
  if v_count <> 1 then
    raise exception 'TEST FAILED (fresh chain): service_role cannot see execution_days (count=%)', v_count;
  end if;
  reset role;
end;
$$;

-- Idempotent replay: re-applying the migration on this now-populated database
-- must succeed without error and must not touch the row this suite just created.
\ir ../../../supabase/migrations/20260801120000_case_d_legacy_convergence.sql

do $$
declare
  v_count bigint;
begin
  select count(*) into v_count from public.execution_days;
  if v_count <> 1 then
    raise exception 'TEST FAILED (fresh chain): idempotent replay changed execution_days row count to %', v_count;
  end if;
end;
$$;

\echo 'case-d-legacy-convergence-fresh-tests: ALL PASSED'
