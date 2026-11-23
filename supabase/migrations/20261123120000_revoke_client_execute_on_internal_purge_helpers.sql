-- =============================================================================
-- P0 SECURITY HOTFIX — revoke client EXECUTE on internal purge/force-delete helpers
-- =============================================================================
--
-- WHAT WAS WRONG
-- --------------
-- 20260910120000_owner_force_delete.sql and 20260910130000_owner_purge_policy.sql create a
-- set of INTERNAL helpers (walkers, manifests, the row destroyers) and intend them to be
-- service_role-only: "The walker primitives stay service_role-only: they take a table name and
-- must never be callable with one the owner chose." To do so they run
--
--     revoke execute on function … from public, anon;
--
-- On hosted Supabase that is not enough. The platform's default privileges for schema `public`
-- (pg_default_acl, verified read-only in production on 2026-11-23) grant EXECUTE on every new
-- function DIRECTLY to anon, authenticated and service_role:
--
--     {postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}
--
-- Revoking from PUBLIC does not remove a direct grant to `authenticated`, so in production every
-- signed-in user — including portal `customer` accounts — can call, via PostgREST /rpc:
--   * owner_force_destroy_row(text, uuid, integer)   SECURITY DEFINER, deletes a row of a
--     caller-named table (+ children), no owner check in its body
--   * owner_purge_destroy_row(text, uuid, boolean)    SECURITY DEFINER, same class
--   * owner_force_purge_storage(text, uuid)          SECURITY DEFINER, enqueues/deletes Storage
--   * manifests / walkers / snapshots that reveal any row's dependants or counterparty data.
-- A local replay of every migration WITHOUT the platform defaults (the source-intended matrix)
-- compared against production found exactly the 16 functions below with unintended
-- `authenticated` EXECUTE and no other drift in the owner finance/purge surface.
--
-- WHAT THIS MIGRATION DOES
-- ------------------------
--   1. For each of the 16 internal helpers that exists: revoke EXECUTE from public, anon AND
--      authenticated (explicitly — see above), and keep the explicit service_role grant the
--      source always intended.
--   2. Verifies, fail-closed, that afterwards
--        - no helper is executable by anon or authenticated,
--        - service_role can still execute every helper,
--        - every owner-facing entry point the browser calls is still executable by
--          authenticated (and still not by anon).
--      Any violation raises and the whole migration rolls back.
--
-- WHY OWNER WORKFLOWS KEEP WORKING
-- --------------------------------
-- Every browser entry point that reaches these helpers (owner_force_delete_customer,
-- owner_force_delete_preview, owner_force_purge_items, owner_purge_customer,
-- owner_workspace_purge_items, owner_workspace_purge_preflight_one) is SECURITY DEFINER, owned
-- by `postgres`, and checks is_platform_owner() itself. Inside them the helpers run as the
-- function owner, which keeps EXECUTE as owner. No RLS policy, view, column default or trigger
-- references any of the 16 helpers. Nothing in src/ calls them directly.
--
-- SAFETY
-- ------
--   * Privileges only: no table, row, function body, trigger or policy is created, altered or
--     deleted. Forward-only, idempotent (re-running is a no-op), replay-safe on a fresh database.
--   * Strict prerequisite check instead of a ledger dependency: 20260910120000/130000/140000
--     were applied to production OUTSIDE the migration ledger
--     (docs/ops/production-reconciliation-2026-11.md §4.4), so they cannot be listed as ledger
--     prerequisites. Instead every one of the 16 exact signatures must exist; if any is missing
--     the migration RAISES and rolls back. It can never report success without having secured
--     all 16.
--   * Overload-safe: revocation and verification cover EVERY function in schema public that
--     carries one of the 16 names, not only the expected signatures, so an unexpected extra
--     overload cannot stay client-executable.
--   * Deliberately NOT changed: request_is_service_role() (anon EXECUTE in production; it only
--     reads the caller's own JWT role claim and is referenced by trigger guards), and any
--     function whose authenticated grant the source intends (e.g. owner_process_offer_acceptance,
--     owner_invoice_preflight) — those are tracked separately, not part of this minimal patch.
-- =============================================================================

begin;

do $$
declare
  -- The 16 internal helpers. Exact signatures; each must stay service_role-only.
  v_internal text[] := array[
    'public.owner_counterparty_snapshot(uuid, uuid)',
    'public.owner_force_delete_children(text)',
    'public.owner_force_delete_manifest(text, uuid, integer)',
    'public.owner_force_delete_protected_tables()',
    'public.owner_force_delete_summary(text, uuid)',
    'public.owner_force_delete_table(text)',
    'public.owner_force_destroy_row(text, uuid, integer)',
    'public.owner_force_purge_storage(text, uuid)',
    'public.owner_purge_assert_no_orphans(text, uuid)',
    'public.owner_purge_blast_radius(text, uuid)',
    'public.owner_purge_dependencies(text)',
    'public.owner_purge_destroy_row(text, uuid, boolean)',
    'public.owner_purge_manifest(text, uuid)',
    'public.owner_purge_merge_counts(jsonb, jsonb)',
    'public.owner_purge_soft_references()',
    'public.owner_purge_storage_paths(text, uuid)'
  ];
  -- Owner-facing entry points the browser calls. Each re-checks is_platform_owner() and must
  -- remain executable by authenticated. Asserted, never modified, here.
  v_entry text[] := array[
    'public.owner_force_delete_preview(text, uuid)',
    'public.owner_force_delete_phrase()',
    'public.owner_force_purge_items(uuid, text, uuid[], text, text)',
    'public.owner_force_delete_customer(uuid, text, text)',
    'public.owner_force_delete_token()',
    'public.owner_record_accounting_relevance(text, uuid)',
    'public.owner_workspace_purge_preflight_one(text, uuid)',
    'public.owner_workspace_purge_preflight(text, uuid[])',
    'public.owner_workspace_purge_items(uuid, text, uuid[], text)',
    'public.owner_purge_customer(uuid, text)',
    'public.owner_storage_purge_status(uuid)',
    'public.owner_storage_purge_retry_failed(uuid)'
  ];
  v_sig text;
  v_fn regprocedure;
  v_names name[];
  v_done int := 0;
begin
  -- ---- 1. Strict prerequisite: all 16 exact signatures must exist ---------------------------
  foreach v_sig in array v_internal loop
    if to_regprocedure(v_sig) is null then
      raise exception 'P0 hotfix aborted: expected internal helper % does not exist; refusing to report success without securing all 16', v_sig;
    end if;
  end loop;

  select array_agg(distinct p.proname) into v_names
  from unnest(v_internal) s(sig) join pg_proc p on p.oid = to_regprocedure(s.sig);

  -- ---- 2. Revoke client EXECUTE on EVERY overload carrying one of the 16 names --------------
  for v_fn in
    select p.oid::regprocedure
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = any (v_names)
    order by 1
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', v_fn);
    execute format('grant execute on function %s to service_role', v_fn);
    v_done := v_done + 1;
  end loop;

  if v_done < cardinality(v_internal) then
    raise exception 'P0 hotfix aborted: secured % function(s), expected at least %', v_done, cardinality(v_internal);
  end if;

  -- ---- 3. Fail-closed verification over the same complete set -------------------------------
  for v_fn in
    select p.oid::regprocedure
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = any (v_names)
  loop
    if has_function_privilege('anon', v_fn, 'execute')
       or has_function_privilege('authenticated', v_fn, 'execute') then
      raise exception 'P0 hotfix incomplete: % is still executable by a client role', v_fn;
    end if;
    if not has_function_privilege('service_role', v_fn, 'execute') then
      raise exception 'P0 hotfix regression: service_role lost EXECUTE on %', v_fn;
    end if;
  end loop;

  foreach v_sig in array v_entry loop
    v_fn := to_regprocedure(v_sig);
    continue when v_fn is null;
    if not has_function_privilege('authenticated', v_fn, 'execute') then
      raise exception 'P0 hotfix regression: owner entry point % is no longer executable by authenticated', v_sig;
    end if;
    if has_function_privilege('anon', v_fn, 'execute') then
      raise exception 'P0 hotfix: owner entry point % is executable by anon', v_sig;
    end if;
  end loop;

  raise notice 'P0 hotfix: client EXECUTE revoked on % internal helper function(s) (all 16 expected signatures present); entry points intact', v_done;
end;
$$;

commit;
