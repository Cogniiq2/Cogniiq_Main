-- =============================================================================
-- Retire the Oura integration.
-- =============================================================================
-- BUSINESS DECISION: the Oura feature is no longer needed. This migration removes
-- its database objects and the data they hold. It is deliberate retirement, not
-- incident remediation: production was verified before this file was written and
-- every oura_* table had RLS enabled with a single `<table>_admin_all` policy
-- scoped `to authenticated` and gated on public.is_platform_admin().
--
-- SCOPE: Oura-only. Nothing outside the objects enumerated below is touched.
--
-- DEPENDENCY PROOF (read-only against production, before writing this file):
--   * FKs OUT: all 11 child tables reference public.oura_connections and nothing
--     else.
--   * FKs IN:  ZERO. No non-Oura table references any oura_* table.
--   * Functions/RPCs: ZERO reference any oura_* object (checked by scanning
--     pg_get_functiondef over every function in `public`).
--   * Rewrite dependents: ZERO non-Oura view/rule depends on any oura_* relation.
--   * Triggers on oura_* tables: ZERO.
--   * cron.job entries mentioning oura: ZERO.
-- Therefore no CASCADE is required and none is used: every object below is
-- dropped by name, children before parent.
--
-- HISTORICAL MIGRATIONS ARE NOT TOUCHED. 20260709120000_create_richer_oura_tables
-- and 20260731122000_case_d_legacy_convergence remain in the repository and in
-- supabase_migrations.schema_migrations as the record of what existed and how it
-- was secured. This migration is forward-only.
--
-- EXACT OBJECT LIST (enumerated from production, not assumed):
--   views  (3): oura_sleep_dashboard, oura_readiness_dashboard,
--               oura_activity_dashboard
--   tables (12): oura_daily_resilience, oura_daily_stress, oura_spo2, oura_tags,
--               oura_sessions, oura_workouts, oura_sleep_sessions,
--               oura_heart_rate, oura_daily_activity, oura_daily_readiness,
--               oura_daily_sleep, oura_connections
-- Their policies, indexes, constraints and the identity sequence
-- oura_heart_rate_id_seq are owned by these tables and are removed with them.
-- =============================================================================

begin;

-- 1. Views first: they depend on the tables. All three are single-table
--    passthrough SELECTs over one oura_* table each and have no other consumer.
drop view if exists public.oura_sleep_dashboard;
drop view if exists public.oura_readiness_dashboard;
drop view if exists public.oura_activity_dashboard;

-- 2. Child tables before the parent, so no FK forces a CASCADE.
drop table if exists public.oura_daily_resilience;
drop table if exists public.oura_daily_stress;
drop table if exists public.oura_spo2;
drop table if exists public.oura_tags;
drop table if exists public.oura_sessions;
drop table if exists public.oura_workouts;
drop table if exists public.oura_sleep_sessions;
drop table if exists public.oura_heart_rate;
drop table if exists public.oura_daily_activity;
drop table if exists public.oura_daily_readiness;
drop table if exists public.oura_daily_sleep;

-- 3. The parent, which also held the OAuth access/refresh tokens.
drop table if exists public.oura_connections;

-- 4. Post-condition: nothing named oura* may remain in the public schema, in any
--    relation kind. Fails the transaction rather than reporting a partial result.
do $$
declare leftover text;
begin
  select string_agg(c.relname, ', ' order by c.relname) into leftover
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind in ('r', 'v', 'm', 'p', 'f', 'S')
    and c.relname like 'oura%';

  if leftover is not null then
    raise exception 'Oura retirement incomplete: % still present in public', leftover;
  end if;
end;
$$;

commit;
