-- =============================================================================
-- PRODUCTION RECONCILIATION RECORD — DO NOT EDIT BELOW THE MARKER
-- =============================================================================
-- This migration was applied to the hosted production database OUTSIDE the
-- repository (ledger version 20260924202220) and is imported here so the repository
-- describes production truthfully. It is ALREADY APPLIED; nothing in this file
-- may be pushed again (the production migration workflow refuses any version
-- that is present in the remote history).
--
-- Everything after the BEGIN marker is the EXACT statement text recorded in
-- supabase_migrations.schema_migrations.statements for this version, byte for
-- byte. Verified read-only on 2026-11-22:
--   md5(applied statement)  = 39cd8dda4f4f59dd594d61d8f0f6f143
--   .github/scripts/test-production-reconciliation.mjs re-checks this hash.
-- Source history: branch claude/p0-supabase-anon-exposure, commit 39b43ae (its fuller commented file holds the rationale).
-- See docs/ops/production-reconciliation-2026-11.md.
-- ==== BEGIN EXACT APPLIED STATEMENT ====
-- P0 security fix: close anonymous / client-role exposure on four objects.
-- See supabase/migrations/<version>_p0_revoke_client_role_exposure.sql for the full rationale.
do $$
begin
  -- 1. owner_automation_jobs: the owning migration (20260723125000) granted only
  --    select/insert/update to authenticated and service_role ("Never anon / customer").
  --    The live ALL grants to anon came from Supabase default privileges and were never revoked.
  --    TRUNCATE, REFERENCES, TRIGGER and MAINTAIN are not governed by RLS, so they are also
  --    removed from authenticated; SELECT/INSERT/UPDATE/DELETE stay RLS-gated (is_platform_owner()).
  if to_regclass('public.owner_automation_jobs') is not null then
    revoke all on table public.owner_automation_jobs from anon;
    revoke truncate, references, trigger on table public.owner_automation_jobs from authenticated;
    if current_setting('server_version_num')::int >= 170000 then
      execute 'revoke maintain on table public.owner_automation_jobs from authenticated';
    end if;
  end if;

  -- 2. v_review_queue: a view without security_invoker runs with its owner's rights and
  --    therefore bypassed RLS on invoices/suppliers/properties/categories for every caller.
  if to_regclass('public.v_review_queue') is not null then
    revoke all on table public.v_review_queue from anon;
    alter view public.v_review_queue set (security_invoker = true);
  end if;

  -- 3. Materialized views cannot carry RLS; anon and authenticated held ALL (incl. MAINTAIN,
  --    which permits REFRESH). Their base tables have RLS with no client policies, so the only
  --    intended readers are service_role/postgres.
  if to_regclass('public.mv_property_pnl') is not null then
    revoke all on table public.mv_property_pnl from anon, authenticated;
  end if;
  if to_regclass('public.mv_monthly_expenses') is not null then
    revoke all on table public.mv_monthly_expenses from anon, authenticated;
  end if;
end;
$$;