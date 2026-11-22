# Production ↔ repository reconciliation — 2026-11

Status: **PR-1 of the sales-scheduling plan.** Repository-only change. Nothing in this document
was applied, deployed, repaired or redeployed. Every production fact below was gathered
**read-only** on **2026-11-22** (UTC) from the hosted project `lqgtmoulqzmrhglabrms` through
catalog queries (`supabase_migrations.schema_migrations`, `pg_proc`, `pg_class`, `pg_policies`,
`information_schema`, `cron.job`, `net._http_response`), the Edge Function listing and the
deployed function bundles.

Evidence categories used throughout:

| Label | Meaning |
|---|---|
| **IDENTICAL** | byte-for-byte equal (hash-verified) |
| **EQUIVALENT** | same catalog definition, different source text (comments/whitespace) |
| **DIFFERENT** | definitions differ |
| **MISSING** | object or file absent on one side |
| **UNKNOWN PROVENANCE** | exists in production, no trustworthy recorded source |

---

## 1. Current production baseline

- PostgreSQL 17.6, extensions include `pg_cron`, `pg_net`, `supabase_vault`, `btree_gist`, `pgcrypto`.
- Supabase organisation plan: **Free**.
- Migration ledger: **50** recorded versions; latest `20260924202220_p0_revoke_client_role_exposure`.
- Edge Functions (11 active):

| Slug | Version | verify_jwt | In repo? | Repo == deployed? |
|---|---|---|---|---|
| send-offer-document-email | 27 | false | yes | **IDENTICAL after this PR** (was DIFFERENT) |
| process-accepted-offer | 19 | false | yes | **DIFFERENT** (error path only; see §8) |
| storage-purge-worker | 7 | false | yes | **DIFFERENT** (secret env name, inlined helpers) |
| admin-provision-client | 18 | true | yes | not compared in PR-1 |
| customer-document-download | 10 | true | yes | not compared in PR-1 |
| customer-document-upload | 10 | true | yes | not compared in PR-1 |
| receptionist-admin / -tools / -postcall | 9 | true / false / false | **no** (branch `claude/golden-agent-platform-vh7939`) | UNKNOWN on main |
| vienna-media | 1 | false | **no** (no git source anywhere) | UNKNOWN PROVENANCE |
| swift-function | 19 | false | **no** (template) | UNKNOWN PROVENANCE |

`public-document-portal` and `club-operations-read` exist in the repo and are **not** deployed —
their "not deployed" READMEs are accurate and were left unchanged.

- pg_cron: `cogniiq-automation-worker` (every minute) → **HTTP 200** on all calls in the 24 h
  window inspected; `cogniiq-storage-purge-worker` (every minute) → **HTTP 401** on all calls.

## 2. Current repository baseline (before this PR)

- `origin/main` @ `a6a54b5` (merge of #105). 52 migration files.
- `supabase/functions/send-offer-document-email/` was **older than production** (see §5).

## 3. Migration inventory

| Version | Name | Repo (main) | Production ledger | Statements recorded | Classification |
|---|---|---|---|---|---|
| 20260607194622 … 20260731121000 | (31 versions) | yes | yes | — | in sync (not re-hashed in PR-1) |
| 20260731122000 | case_d_legacy_convergence | yes | yes | — | in sync |
| **20260804120000** | reusable_capability_authorization | **no** | yes | **0** | UNKNOWN PROVENANCE of the ledger row; objects EQUIVALENT to branch file (§4.3) |
| 20260811120000 | club_operations_catalog_entry | yes | no | — | **intentionally unapplied** (`PROTECTED_VERSIONS`) |
| 20260818120000 | club_operations_activation | yes | no | — | **intentionally unapplied** (`PROTECTED_VERSIONS`) |
| **20260823102556** | offer_invoice_email_recipient_fix | **imported by this PR** | yes | 1 | IDENTICAL (§4.1) |
| 20260824171403 … 20260904120000 | (12 versions) | yes | yes | — | in sync |
| **20260905120000** | ai_receptionist_platform | **imported by this PR** | yes | 47 | IDENTICAL per statement (§4.2) |
| 20260910120000 | owner_force_delete | yes | **no** | — | objects present, applied **outside the ledger** (§4.4) |
| 20260910130000 | owner_purge_policy | yes | **no** | — | objects present, applied **outside the ledger** (§4.4) |
| 20260910140000 | owner_storage_purge_worker | yes | **no** | — | objects present, applied **outside the ledger** (§4.4) |
| 20260924092127 | retire_oura_integration | yes | yes | 1 | in sync (repo file is a commented superset of the applied text) |
| **20260924202220** | p0_revoke_client_role_exposure | **imported by this PR** | yes | 1 | IDENTICAL (§4.1) |

**Version collision (verified):** `20260903120000` is `owner_workspace_organization` on main and
in production. Open PR #70 (`20260903120000_owner_crm_sales_pipeline.sql`) and PR #71
(`20260903120000_owner_crm_lead_foundation.sql`) both reuse that version; neither may be merged
as-is. Any new migration must use a version **greater than `20260924202220`**.

## 4. Exact migration discrepancies

### 4.1 Recorded single-statement migrations — imported byte-for-byte

| Version | Recorded md5 | Branch file | Branch file == applied? | Imported as |
|---|---|---|---|---|
| 20260823102556 | `1f874f3b251aa9d8ea9839cb1a44e57b` (10 766 chars) | `20260823120000_*.sql` on `claude/command-palette-topbar-tables` (5e196e9 + 02997ba) | **no** — different version number and the file carries extra rationale; applied text was a condensed form | exact applied text, under the **recorded** version |
| 20260924202220 | `39cd8dda4f4f59dd594d61d8f0f6f143` (1 977 chars) | same name on `claude/p0-supabase-anon-exposure` (39b43ae) | **no** — branch file has fuller comments | exact applied text |

Each imported file is: a reconciliation header (SQL comments) + the line
`-- ==== BEGIN EXACT APPLIED STATEMENT ====` + the recorded statement verbatim. The body hash is
re-checked in CI by `.github/scripts/test-production-reconciliation.mjs`.

The branch file `20260823120000_offer_invoice_email_recipient_fix.sql` is deliberately **not**
imported: version `20260823120000` was never applied, so importing it would create a phantom
pending migration.

Contents of `20260823102556` (verified definitions): `owner_worker_offer_context(uuid, text)` and
`owner_worker_invoice_context(uuid, text)` (explicit recipient override, no seller fallback),
`owner_enqueue_offer_email` (recipient required), `owner_reap_stalled_automation_jobs(int)`
(service_role only), `owner_retry_automation_job_by_id(uuid)` (owner RPC, granted to authenticated).

### 4.2 `20260905120000_ai_receptionist_platform` — imported from git, proven identical

The ledger holds 47 statements. The file at commit `26ad85a` (branch
`claude/golden-agent-platform-vh7939`) split with the Supabase CLI rule (semicolon outside
comments/literals/dollar-bodies, trimmed, trailing `;` removed) yields **47 statements whose
length and md5 match the ledger one-for-one**. The file is imported verbatim (391 lines,
md5 `240f2463b5c5b2c325487070ca9d53d4`). Its header mentions `src/lib/goldenAgent`, which is not
on main; the migration itself depends only on objects already on main.

### 4.3 `20260804120000_reusable_capability_authorization` — ledger row with no SQL

The production ledger row exists with **zero recorded statements** (consistent with
`supabase migration repair --status applied` after an out-of-band apply). The candidate file
exists on `claude/multi-tenant-portal-access-fjicx2` and `claude/multi-tenant-staging-preflight-t69z8m`
(identical, md5 `c14bc72112f29d132fd97cc0941f5b3c`).

Object comparison (method in §9): all **11 functions** and **7 tables** it defines or alters have
**IDENTICAL catalog definitions** (`pg_get_functiondef`; columns, defaults, constraints, indexes,
policies, RLS flags, triggers) between production and a clean replay of main + this candidate.
Differences are **grants only** (§4.5).

Decision: **not imported**. The ledger provides no applied text to reproduce, so importing the
branch file would assert provenance that cannot be proven. Production does not need the file (the
migration workflow fetches remote history into an isolated workspace). Importing it later is an
owner decision (§10).

### 4.4 `20260910120000/130000/140000` — on main, applied outside the ledger

Production contains every object these three migrations create, but the ledger has **no rows**
for these versions and no other recorded migration's statements mention them (checked by text
search over all recorded statements).

Object comparison: **all 37 distinct functions (47 migration/function pairs, every overload) and both tables** (`owner_deletion_tombstones`,
`owner_storage_purge_queue`) are **IDENTICAL** to a clean replay of main. `owner_purge_delete_storage`
is absent on both sides (dropped by 20260910140000) — consistent. Differences are **grants only**
(§4.5), and one of them is a security defect (§8, SEC-0).

These files stay exactly as they are on main. No ledger repair is performed or authorised.

### 4.5 Grant differences (all migrations above)

Production ACLs include the Supabase platform default privileges that a bare PostgreSQL replay
does not have: `EXECUTE` on new functions for `anon`, `authenticated`, `service_role`, and full
table privileges (`arwdDxtm`, incl. PG17 `MAINTAIN`) for `service_role`. Migrations that
`revoke … from public, anon` without also revoking from `authenticated` therefore leave
`authenticated` with `EXECUTE` in production even where the source comments say "service_role
only". This is the root cause of SEC-0.

## 5. Deployed function provenance

### send-offer-document-email v27 — source restored (IDENTICAL)

The deployed bundle (4 files) was fetched read-only and compared character-for-character:

| File | sha256 (deployed v27 = repo after PR-1) | == `02997ba` | == old main |
|---|---|---|---|
| index.ts | `a9acf3e1…cd8735e` | yes | **no** |
| certificatePdf.ts | `21b28cfc…77630b7` | yes | **no** |
| email.ts | `d93214f1…989f717` | yes | yes |
| invoicePdf.ts | `2c3a82cd…5b81ce666` | yes | yes |

Behaviour present in v27 and absent from old main (all verified in the source):

- `owner_reap_stalled_automation_jobs({ p_stale_minutes: 15 })` before every claim;
- `BATCH = 3` with `DRAIN_BUDGET_MS = 15000` (fits the 20 s pg_cron HTTP timeout);
- Resend `fetch` wrapped in `AbortSignal.timeout(15 s)` + try/catch, bounded provider reason in
  `last_error`;
- `owner_worker_offer_context` / `owner_worker_invoice_context` called with `p_recipient_override`
  (= job recipient); no fallback to the seller address;
- `invoice_create` / `invoice_issue` terminate as `completed` (not `sent`);
- a failed `owner_worker_mark_offer_sent` fails the job; a failed token revocation is logged with
  the job id only;
- certificate signature-block layout rework (page-break protection, wrapped evidence values).

Unchanged: env var names (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `WORKER_SECRET`,
`EMAIL_PROVIDER`, `RESEND_API_KEY`, `EMAIL_FROM`, `PUBLIC_APP_URL`), job types, idempotency keys,
claim/complete RPC signatures (`owner_claim_automation_jobs(integer, text[])`,
`owner_complete_automation_job(uuid, text, text, text, integer, uuid)`).

**Compatibility:** v27 requires the RPC signatures from `20260823102556` (already applied in
production). Deploying the *old* main worker would have called `owner_worker_offer_context(uuid)`,
which production dropped — offer emails would have failed. After PR-1 the repository source is the
running source; **it was not redeployed.**

### process-accepted-offer v19 — DIFFERENT, not imported

Deployed differs only in the `record_offer_acceptance` failure branch: it `console.error`s the raw
Postgres `message/code/details/hint` and returns `debug: error.message, code: error.code` to the
**unauthenticated** caller. The repository version returns a generic error. The deployed handler is
**not** imported (SEC-1). No git source contains the deployed variant.

### storage-purge-worker v7 — DIFFERENT, not imported

Deployed reads `STORAGE_PURGE_WORKER_SECRET` (repo: `WORKER_SECRET`), inlines `_shared/env.ts`
and `interpretRemoveResult`, adds a 500 for missing Supabase env. Same RPCs, header, batch size and
constant-time comparison. No git source contains it. Every cron call returns 401 (OPS-1).

## 6. Imported / changed files in PR-1

| File | Change |
|---|---|
| `supabase/migrations/20260823102556_offer_invoice_email_recipient_fix.sql` | new — exact applied text + header |
| `supabase/migrations/20260905120000_ai_receptionist_platform.sql` | new — verbatim from `26ad85a`, statement-proven |
| `supabase/migrations/20260924202220_p0_revoke_client_role_exposure.sql` | new — exact applied text + header |
| `supabase/functions/send-offer-document-email/index.ts` | replaced with deployed v27 (= `02997ba`) |
| `supabase/functions/send-offer-document-email/certificatePdf.ts` | replaced with deployed v27 (= `02997ba`) |
| `supabase/functions/send-offer-document-email/README.md` | deployment status corrected |
| `supabase/functions/process-accepted-offer/README.md` | deployment status corrected; leak flagged |
| `supabase/functions/storage-purge-worker/README.md` | deployment status corrected; 401 flagged |
| `.github/scripts/test-production-reconciliation.mjs` | new — CI guard for §4.1, §4.2, §5, migration hygiene |
| `.github/workflows/build.yml` | runs the new guard |
| `.github/scripts/test-automation-worker.mjs`, `test-automated-offer-email.mjs`, `test-signed-certificate-workflow.mjs`, `test-offer-acceptance-automation.mjs` | static log/ordering checks narrowed to the deployed, sanitised behaviour (one exact `console.error` line with the job id is exempt; everything else still fails); four v27 behaviours pinned |
| `docs/ops/production-reconciliation-2026-11.md` | this document |

Not changed: any business logic, RPC, table, offer/invoice/payment/tax code, onboarding templates,
frontend, public site, SEO output, telephony.

## 7. Unresolved differences

1. `20260804120000` — ledger row without SQL (owner decision: keep documented-only, or import the
   equivalence-verified branch file with an explicit "reconstructed" header).
2. `20260910120000/130000/140000` — applied outside the ledger; a future ledger repair would be
   `supabase migration repair --status applied <version>` per version. **Not authorised.**
3. `process-accepted-offer` v19 and `storage-purge-worker` v7 have no matching source.
4. `receptionist-admin/-tools/-postcall` run from an unmerged branch; `deploy-golden-agent-functions.yml`
   on main references directories that do not exist on main.
5. `vienna-media` (unrelated trip app with service-role access) and `swift-function` (template).
6. Grant differences from platform default privileges (§4.5) are not modelled in local SQL harnesses.
7. Frontend `retryAutomationJob` (`src/lib/ownerFinance/offersApi.ts`) still updates
   `owner_automation_jobs` directly; it cannot re-arm an exhausted job (claim filter
   `attempt_count < max_attempts`). Production already has `owner_retry_automation_job_by_id(uuid)`;
   switching the frontend to it is a behaviour change and belongs to the planned permissions PR.
8. Pre-existing CI time bomb: SQL fixtures in `automation-worker-tests.sql`,
   `certificate-workflow-tests.sql`, `signature-proposal-tests.sql` hard-code
   `valid_until = 2026-07-31`, so those suites now fail with "offer has expired" on main as well.

## 8. Security-critical dependencies and findings (separate patches)

**SEC-0 — P0, CONFIRMED in production catalog.** `SECURITY DEFINER` row-destroying helpers that
take a table name and a row id are executable by **every authenticated user** (3 `customer`
profiles exist today), with no owner check in their bodies:
`owner_force_destroy_row(text, uuid, integer)`, `owner_purge_destroy_row(text, uuid, boolean)`,
`owner_force_delete_manifest(text, uuid, integer)`, `owner_purge_manifest(text, uuid)`,
`owner_force_purge_storage(text, uuid)`, `owner_purge_assert_no_orphans(text, uuid)`, plus read
helpers `owner_counterparty_snapshot(uuid, uuid)`, `owner_purge_storage_paths(text, uuid)`,
`owner_purge_blast_radius(text, uuid)`, `owner_force_delete_summary(text, uuid)`. Cause: §4.5 — the
20260910* migrations revoke from `public, anon` only. Fix: a forward migration revoking `EXECUTE`
from `authenticated` on every helper not in the intended browser list, plus a SQL test that
emulates Supabase default privileges. Not exploited or tested against production.

**SEC-1 — P1.** Deployed `process-accepted-offer` v19 returns raw database errors to anonymous
callers (§5). Fix: owner-approved redeploy of the repository version.

**SEC-2 — P2.** `swift-function` (template, `verify_jwt = false`) is unneeded attack surface.

**SEC-3 — P2.** `vienna-media` is an unrelated application with service-role access in the business
production project; its RPCs and buckets are not in this repository.

**OPS-1.** Storage purge worker: `STORAGE_PURGE_WORKER_SECRET` must equal Vault
`storage_purge_worker_secret`. Every call fails today; purges would be silently queued, not executed.

**Dependency to protect:** `20260924202220` (revokes `anon` on `owner_automation_jobs` and three
views) now lives in the repository; any future rebuild from main keeps it.

## 9. Test evidence

- **Exact-text checks:** md5 of imported bodies = recorded statement hashes (both match).
- **Statement split:** 47/47 statement hashes of `20260905120000` match the ledger.
- **Worker:** sha256 of all four worker files = deployed v27 content.
- **Object fingerprints:** a throwaway PostgreSQL 16 cluster was booted with
  `supabase/tests/lib_bootstrap.sql` + the extension/storage mocks of
  `run_owner_purge_policy_smoke.sh`, then main's migrations (minus the two protected club-ops
  versions and the hosted-only `20260731122000`) plus the three imported files and the
  `20260804120000` candidate were applied **with zero errors**. The same fingerprint query
  (functions: `pg_get_functiondef` per overload; tables: columns+types+defaults+nullability,
  constraints, indexes, policies, RLS flags, triggers; ACLs hashed separately) ran locally and
  read-only in production over 81 (migration, object) pairs: **81/81 definitions IDENTICAL (raw
  hash), 0 DIFFERENT, 0 MISSING** (`owner_purge_delete_storage` is absent on both sides, as
  intended); 41 pairs also have identical ACLs, 40 differ in ACL only (§4.5).
- Repository checks: see the PR description (typecheck, unit tests, build, lint, node script
  tests, SQL harnesses).

## 10. Production changes still requiring explicit owner approval

None of the following is performed by PR-1:

1. SEC-0 grant fix migration (recommended **first**, urgent).
2. Redeploy `process-accepted-offer` from repository source (SEC-1).
3. Set `STORAGE_PURGE_WORKER_SECRET` to the Vault value, or redeploy the repo storage worker with
   `WORKER_SECRET` (OPS-1).
4. Delete `swift-function`; decide on `vienna-media` (SEC-2/3).
5. Ledger repair for `20260910120000/130000/140000` (and the decision for `20260804120000`).
6. Any redeploy of `send-offer-document-email` (none needed: repo now equals production).

## 11. Rollback considerations

PR-1 changes only repository files. Reverting the commit restores the previous repository state
and has **no production effect**. The imported migration files describe already-applied versions;
the production migration workflow refuses to push a version that is present remotely, and its
isolated workspace is built from fetched remote history, so these files cannot be re-applied by it.
The worker source now equals production; reverting it would re-introduce the regression risk
described in §5.

## 12. Readiness assessment for PR-2 (manual-lead CRM)

**Ready to start, with one ordering condition.**

- Migration baseline: the repository now contains every recorded production version except
  `20260804120000` (documented). PR-2's first migration must use a version `> 20260924202220` and
  depends only on `20260710120000`, `20260722120000`, `20260724120000` (all in sync).
- PR-2 must use PR #71's grant model (browser `SELECT` only; writes via `SECURITY DEFINER` RPCs) and
  must revoke `EXECUTE` from **`authenticated`** explicitly on every internal helper — §4.5 shows
  `revoke … from public, anon` is not enough on Supabase. Its SQL tests should emulate platform
  default privileges.
- Condition: fix SEC-0 before shipping any new owner-only database surface, so the new CRM is not
  deployed next to a known privilege defect.
- PR-2 does not touch the worker; the worker baseline (§5) is a prerequisite only for the later
  reminder PRs.
