# P0 hotfix — client EXECUTE on internal purge/force-delete helpers

Migration: `supabase/migrations/20261123120000_revoke_client_execute_on_internal_purge_helpers.sql`
Status: **prepared, NOT applied.** Production was only read (catalog queries) to prepare this.
Severity: **P0** — any signed-in user, including portal `customer` accounts, can delete rows of
owner-only tables and enqueue Storage deletions.

## 1. Root cause

`20260910120000_owner_force_delete.sql` and `20260910130000_owner_purge_policy.sql` create
internal helpers meant to be service_role-only and lock them down with

```sql
revoke execute on function … from public, anon;
```

The hosted project's default privileges for schema `public` (read-only check of
`pg_default_acl`, 2026-11-23) are:

```
functions (owner postgres and supabase_admin): {postgres=X, anon=X, authenticated=X, service_role=X}
```

These are **direct** grants to `authenticated`. Revoking from `PUBLIC` does not touch them, so
`authenticated` kept EXECUTE. A bare PostgreSQL cluster has no such defaults, which is why every
local SQL test passed: the defect only exists under Supabase's platform grants.

How the scope was derived (not guessed): every migration was replayed on a throwaway cluster
**without** the platform defaults to produce the source-intended privilege matrix (246 repo
functions). Production was compared function-by-function. Result: exactly **16** functions have
`authenticated` EXECUTE in production that the source does not intend; all 16 come from
`20260910120000/130000`. No function has unintended `anon` EXECUTE except
`request_is_service_role()` (see §6).

## 2. Affected functions and before/after privilege matrix

All are owned by `postgres`. "Before" is production as read on 2026-11-23; "After" is the state
the migration enforces (and asserts).

| Function | SECURITY DEFINER | Effect when called directly | anon before → after | authenticated before → after | service_role before → after |
|---|---|---|---|---|---|
| `owner_force_destroy_row(text, uuid, integer)` | yes | **deletes a row (+children) of a caller-named table** | — → — | **X → —** | X → X |
| `owner_purge_destroy_row(text, uuid, boolean)` | yes | **deletes a row (+dependants), enqueues Storage purge** | — → — | **X → —** | X → X |
| `owner_force_purge_storage(text, uuid)` | yes | **deletes/enqueues Storage objects of a row** | — → — | **X → —** | X → X |
| `owner_purge_assert_no_orphans(text, uuid)` | yes | walks FKs of any row | — → — | **X → —** | X → X |
| `owner_force_delete_manifest(text, uuid, integer)` | yes | reveals dependants of any row | — → — | **X → —** | X → X |
| `owner_purge_manifest(text, uuid)` | yes | reveals dependants of any row | — → — | **X → —** | X → X |
| `owner_force_delete_summary(text, uuid)` | yes | reveals a row summary | — → — | **X → —** | X → X |
| `owner_counterparty_snapshot(uuid, uuid)` | yes | reveals counterparty (customer) data | — → — | **X → —** | X → X |
| `owner_purge_blast_radius(text, uuid)` | yes | reveals dependant counts | — → — | **X → —** | X → X |
| `owner_purge_storage_paths(text, uuid)` | yes | reveals private Storage paths | — → — | **X → —** | X → X |
| `owner_force_delete_children(text)` | no | catalog walk | — → — | **X → —** | X → X |
| `owner_force_delete_protected_tables()` | no | constant list | — → — | **X → —** | X → X |
| `owner_force_delete_table(text)` | no | name mapping | — → — | **X → —** | X → X |
| `owner_purge_dependencies(text)` | no | catalog walk | — → — | **X → —** | X → X |
| `owner_purge_merge_counts(jsonb, jsonb)` | no | pure jsonb helper | — → — | **X → —** | X → X |
| `owner_purge_soft_references()` | no | constant map | — → — | **X → —** | X → X |

Unchanged (asserted by the migration): the 12 owner entry points stay `authenticated` X / `anon` —:
`owner_force_delete_preview`, `owner_force_delete_phrase`, `owner_force_purge_items`,
`owner_force_delete_customer`, `owner_force_delete_token`, `owner_record_accounting_relevance`,
`owner_workspace_purge_preflight_one`, `owner_workspace_purge_preflight`,
`owner_workspace_purge_items`, `owner_purge_customer`, `owner_storage_purge_status`,
`owner_storage_purge_retry_failed`.

Exposure today: 3 `customer` profiles exist (+ any future signup). Not exploited or tested
against production in preparing this fix.

## 3. Why nothing legitimate breaks

- Every entry point that reaches a helper is `SECURITY DEFINER`, owned by `postgres`, and checks
  `is_platform_owner()`. Inside it the helpers run as `postgres`, which keeps EXECUTE as owner.
- Dependency scan (catalog): no RLS policy, view, column default or trigger references any of the
  16. The two SECURITY INVOKER callers (`owner_force_delete_children`, `owner_purge_dependencies`)
  are themselves only reached from definer functions.
- `src/` never calls any of the 16 via `rpc()` (they appear only in comments). Edge Functions do
  not call them.
- service_role keeps its explicit grant (the storage purge worker uses
  `owner_storage_purge_claim_batch`/`_complete`, unaffected; helpers re-granted explicitly).
- Privileges only: no table, row, function body, trigger or policy changes.

## 4. Migration details

- Version `20261123120000` (> latest production `20260924202220`; no collision).
- Strict prerequisite: all 16 exact signatures must exist, otherwise the migration raises and
  rolls back — it can never report success without securing all 16. This replaces a ledger
  dependency, which is impossible because `20260910*` were applied outside the ledger; the
  allowlist entry therefore has `requires: []` (justified inline in
  `.github/scripts/lib/supabase-migration-allowlist.mjs`).
- For EVERY function in `public` carrying one of the 16 names (all overloads, not only the
  expected signatures): `revoke execute … from public, anon, authenticated` and
  `grant execute … to service_role`.
- Fail-closed verification inside the same transaction: raises (→ full rollback) if any helper is
  still client-executable, if service_role lost a helper, or if any owner entry point lost
  `authenticated` EXECUTE or gained `anon`.
- Idempotent: a second run is a no-op (tested).
- Added to all three allowlist copies (workflow `choice`, bash `case`, allowlist module);
  `test-supabase-production-migration-workflow.mjs` confirms they agree.

## 5. Test evidence

`.github/scripts/run-internal-helper-privilege-sql-tests.sh` (new CI job
`internal-helper-privilege-sql-tests`) boots a throwaway cluster with production's default
privileges emulated (`.github/scripts/sql/internal-helper-privilege-defaults.sql`), applies all
migrations, then:

| Stage | Result |
|---|---|
| PRE-FIX: authenticated holds EXECUTE on the destroyers | reproduced |
| PRE-FIX: a customer session deletes an `owner_customers` row via `owner_force_destroy_row` | reproduced |
| PRE-FIX: the T8 prevention query flags all 10 definer helpers | reproduced |
| Hotfix applied twice | both succeed, 16 revoked |
| T1 privilege matrix (16 helpers service_role-only, 12 entry points authenticated-only) | PASS |
| T2 customer session denied on all 16 (SQLSTATE 42501); target row intact | PASS |
| T3 anonymous session denied on all 16 (42501) | PASS |
| T4 owner (as `authenticated`): force-delete preview, purge preflight, invoice purge, customer purge; exactly the intended rows removed | PASS |
| T5 entry points still refuse non-owners (`Owner access required`) | PASS |
| T6 service_role: storage-purge claim RPC + helpers execute | PASS |
| T7 privileges-only (all helpers still present) | PASS |
| T8 prevention invariant (below) | PASS |
| T9 one expected helper missing → hotfix aborts, nothing changed (rollback proven); restored → re-secured | PASS |
| T10 an unexpected extra overload of a helper name (created under the default grants) is revoked too | PASS |

**Database version.** CI runs every throwaway-cluster SQL harness on **PostgreSQL 17**, the
production major version, via `.github/actions/setup-postgresql-17` (sets `PGBIN`, prints and
asserts the version). Before this, the harnesses picked the highest version on the runner; when
the GitHub ubuntu image started shipping PostgreSQL 18, five SQL jobs failed in
`20260711120000_receptionist_persistence.sql` because PostgreSQL 18 records column NOT NULL
constraints in `pg_constraint` (`contype 'n'`, `<table>_<column>_not_null`). That was an
environment change, not a migration regression; the migration is unchanged.

Also passing: full-chain `supabase/tests/run_owner_purge_policy_smoke.sh` (now includes the
hotfix), `run-workspace-organization-sql-tests.sh`, `run-receptionist-leads-rls-sql-tests.sh`,
migration workflow/ledger/reconcile tests, typecheck, unit tests, lint, build.

## 6. Out of scope (documented, intentionally unchanged)

- `request_is_service_role()` — `anon` EXECUTE in production (source intends none). It only
  compares the caller's own JWT role claim with `'service_role'`, is not SECURITY DEFINER and is
  used by trigger guards; revoking it could break anon-triggered paths. No security impact.
- Reviewed exceptions in T8 (follow-ups, lower severity, need call-path design work):
  - **F1** `owner_process_offer_acceptance(uuid, uuid)` — source grants `authenticated`, no owner
    check; acts only on offers already `accepted`, idempotent side effects.
  - **F2** `owner_invoice_preflight(uuid, uuid)` — returns names of missing settings for a known id.
  - **F3** `owner_record_accounting_relevance(text, uuid)` — browser entry point without an owner
    check; returns relevance flags/counts for a known id.
  - **F4** `generate_daily_execution_plan(date)` — legacy execution app; anon can create plan rows.
  - By design: `public_offer_by_token`, `respond_offer_by_token` (token-authenticated portal),
    `provision_client_workspace` (wrapper; the delegate enforces the admin check).
- Functions present in production but not in this repository (e.g. `vienna_*`) were not assessed
  against source intent.

## 7. Preventing recurrence

1. **Standing CI invariant (T8):** under emulated Supabase default grants, no SECURITY DEFINER
   function whose body lacks a caller check (`is_platform_owner`, `is_platform_admin`,
   `request_is_service_role`, `auth.uid()`, organisation membership, portal context) may be
   executable by anon/authenticated unless listed with a written reason. A new helper that forgets
   `authenticated` fails the build.
2. **Rule for every new migration:** revoke internal functions with
   `revoke execute on function … from public, anon, authenticated;` and grant only what is needed.
   Never rely on revoking `PUBLIC`.
3. **Considered, not done here:** changing the platform default
   (`alter default privileges … revoke execute on functions from anon, authenticated`). It would
   fix the class at the source but changes the behaviour of every future migration that silently
   relies on the implicit grant; it needs its own reviewed change and a migration-wide audit.

## 8. Deployment (owner-approved only)

Use the existing manual workflow **Supabase Production Migration**:

1. `source_ref`: this branch (pre-merge) or `main` after merge.
   `target_migration`: `20261123120000_revoke_client_execute_on_internal_purge_helpers.sql`.
2. `mode: audit-history` → review.
3. `mode: dry-run` → confirm exactly one pending migration (the target) and the backup gates pass.
4. `mode: apply`, `confirmation: APPLY_MIGRATION_20261123120000`.
5. Post-apply read-only verification (expect 16 rows, all `f | f | t`):

```sql
select p.oid::regprocedure, has_function_privilege('anon', p.oid, 'execute') anon,
       has_function_privilege('authenticated', p.oid, 'execute') auth,
       has_function_privilege('service_role', p.oid, 'execute') svc
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in (
  'owner_counterparty_snapshot','owner_force_delete_children','owner_force_delete_manifest',
  'owner_force_delete_protected_tables','owner_force_delete_summary','owner_force_delete_table',
  'owner_force_destroy_row','owner_force_purge_storage','owner_purge_assert_no_orphans',
  'owner_purge_blast_radius','owner_purge_dependencies','owner_purge_destroy_row',
  'owner_purge_manifest','owner_purge_merge_counts','owner_purge_soft_references',
  'owner_purge_storage_paths');
```

6. Smoke in the Admin Center as the owner: open Papierkorb → "Endgültig löschen" preview on a
   draft (no need to confirm). No Edge Function redeploy is needed.

## 9. Recovery plan

- **If the migration fails:** its fail-closed block raises inside the transaction → nothing is
  changed; the ledger row is not written. Read the error, fix forward.
- **If an owner deletion workflow regresses after apply** (not expected; covered by T4): do not
  re-open the hole globally. Re-grant `authenticated` only on the specific helper proven
  necessary, via a new forward migration, and add a test for that path. Emergency-only manual
  rollback of a single helper:
  `grant execute on function public.<helper>(<args>) to authenticated;` — this re-exposes that
  helper to every customer and must be followed by a fix within the same day.
- No data is changed by this migration, so no data restore is ever required because of it.
