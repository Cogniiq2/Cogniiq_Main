-- =============================================================================
-- P0: close anonymous / client-role exposure on four public objects
-- =============================================================================
-- Applied to production on 2026-09-24 as version 20260924202220 (this file is the
-- repository record of exactly that statement). Grants and one view option only:
-- no data, no table definition and no policy is changed.
--
-- LIVE STATE BEFORE THIS MIGRATION (read-only inspection, 2026-09-24)
--   public.owner_automation_jobs  anon=ALL, authenticated=ALL (arwdDxtm). RLS on, one
--                                 policy: authenticated + is_platform_owner().
--   public.v_review_queue         anon=ALL, authenticated=ALL. View WITHOUT
--                                 security_invoker, owned by postgres, so every caller
--                                 read invoices/suppliers/properties/categories with the
--                                 owner's rights, bypassing their RLS.
--   public.mv_property_pnl,       anon=ALL, authenticated=ALL. Materialized views cannot
--   public.mv_monthly_expenses    carry RLS; ALL includes MAINTAIN (REFRESH).
-- These were the only relations in public granting anything to anon.
--
-- ROOT CAUSE
--   Supabase default privileges grant ALL on new public objects to anon and
--   authenticated. 20260723125000 granted owner_automation_jobs only
--   select/insert/update to authenticated/service_role ("Never anon / customer") but
--   never revoked the defaults. The view and materialized views were created outside
--   this repository with the same defaults and the pre-PG15 view semantics.
--
-- WHY EACH REVOKE IS SAFE
--   * owner_automation_jobs: the only client caller is the owner dashboard
--     (src/lib/ownerFinance/offersApi.ts: select/update as the authenticated owner).
--     Workers and RPCs run as service_role or SECURITY DEFINER. TRUNCATE, REFERENCES,
--     TRIGGER and MAINTAIN are not governed by RLS, so they are removed from
--     authenticated; SELECT/INSERT/UPDATE/DELETE remain and stay RLS-gated.
--   * v_review_queue / materialized views: no caller in this repository, no REST
--     request in the 24h log window, base tables and views hold zero rows. The base
--     tables have RLS with no client policies, so service_role is the only intended
--     reader; service_role and postgres privileges are untouched.
--
-- Guarded with to_regclass so the file is a no-op on databases that do not contain
-- these objects (CI and local harnesses). MAINTAIN exists only on PostgreSQL 17+.
--
-- ROLLBACK (restores the exact previous privileges):
--   grant all on table public.owner_automation_jobs to anon;
--   grant truncate, references, trigger, maintain on table public.owner_automation_jobs to authenticated;
--   grant all on table public.v_review_queue to anon;
--   alter view public.v_review_queue reset (security_invoker);
--   grant all on table public.mv_property_pnl to anon, authenticated;
--   grant all on table public.mv_monthly_expenses to anon, authenticated;
-- =============================================================================

do $$
begin
  if to_regclass('public.owner_automation_jobs') is not null then
    revoke all on table public.owner_automation_jobs from anon;
    revoke truncate, references, trigger on table public.owner_automation_jobs from authenticated;
    if current_setting('server_version_num')::int >= 170000 then
      execute 'revoke maintain on table public.owner_automation_jobs from authenticated';
    end if;
  end if;

  if to_regclass('public.v_review_queue') is not null then
    revoke all on table public.v_review_queue from anon;
    alter view public.v_review_queue set (security_invoker = true);
  end if;

  if to_regclass('public.mv_property_pnl') is not null then
    revoke all on table public.mv_property_pnl from anon, authenticated;
  end if;
  if to_regclass('public.mv_monthly_expenses') is not null then
    revoke all on table public.mv_monthly_expenses from anon, authenticated;
  end if;
end;
$$;
