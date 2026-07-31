# Customer platform — staging runbook

Everything needed to bring the customer project / document / billing release up on a
staging Supabase project and verify it, in order. Nothing here touches production, and
nothing here runs automatically.

> ## Current hosted state (as of this branch)
>
> The hosted project is **partly deployed already**. Seven of the nine migrations in
> this PR were applied manually, and the customer-facing flow has been exercised
> against them: project creation, document upload and download, invoice→project
> linking, and a customer PDF download all work.
>
> **Two migrations remain to be applied**, plus a redeploy of one Edge Function and
> the frontend. Jump to [§2b](#2b-what-is-still-outstanding-on-the-hosted-project).
>
> The one thing that did **not** work was the Owner UI: the Pankofer invoice PDF had
> to be generated and published by hand because no owner-facing publishing surface
> existed. That is what `20260731120000` and the new publishing card fix.

| File | What it does | Writes? |
|---|---|---|
| `preflight.sql` | 300+ read-only assertions about database state (184 release-9 assertions + Case D tasks/execution_*/oura_* convergence invariants) | no |
| `preflight.sh` | Runs the above, exits non-zero on any mismatch | no |
| `verify-endpoints.mjs` | Edge Function health, frontend↔backend agreement, bucket privacy | no |
| `seed-staging-fixtures.sh` | Guarded entry point for the fixture loader | **yes** |
| `seed-staging-fixtures.sql` | The disposable fixtures themselves | **yes** |
| `cleanup-staging-fixtures.sql` | Removes exactly those fixtures | **yes** |

`preflight.sql` now also fingerprints migrations 6–9 and asserts that the normalized
company-name indexes are **not** unique — uniqueness there would make a deliberate
same-name split un-representable and break provisioning outright.

No credentials live in this directory or anywhere else in the repository. Every
connection string comes from the environment at run time.

---

## 0. What you need

```bash
export DATABASE_URL='postgresql://postgres:<password>@db.<staging-ref>.supabase.co:5432/postgres'
export STAGING_PROJECT_REF='<staging-ref>'          # the subdomain of your Supabase URL
export SUPABASE_URL="https://$STAGING_PROJECT_REF.supabase.co"
export VITE_SUPABASE_URL="$SUPABASE_URL"            # what the staging frontend build uses
```

`STAGING_PROJECT_REF` is the safety interlock. Both the endpoint verifier and the
seeder refuse to do anything unless every URL and connection string agrees with it,
so a stray production value aborts the run instead of being acted on.

---

## 1. Preflight — before applying anything

```bash
bash scripts/staging/preflight.sh            # failures only
bash scripts/staging/preflight.sh --verbose  # every check
```

On a fresh staging project this reports all eight schema migrations as **not
applied**, which is the expected starting point. On the current hosted project it
reports the first six as applied and the last two as not. It also verifies up front that the server is
PostgreSQL 15+ (migrations 1 and 2 use column-specific `ON DELETE SET NULL`) and that
every table, helper function and role this release builds on already exists.

Any `FAIL` is a stop. The script exits non-zero so it can gate a deploy.

---

## 2. Every migration in this PR

Nine files, in apply order. The last column is the state on the **hosted** project.

| # | Migration | What it adds | Re-appliable? | Hosted |
|---|---|---|---|---|
| 1 | `20260728120000_customer_project_core` | `customer_projects`, `customer_project_milestones`, three enums | no — fails loudly | **applied** |
| 2 | `20260728121000_customer_documents` | `customer_documents`, access events, the private bucket, the source-consistency trigger | no — fails loudly | **applied** |
| 3 | `20260728122000_customer_billing_link` | `customer_project_invoices`, `list_customer_invoices`, org/id anchors | no — fails loudly | **applied** |
| 4 | `20260728123000_owner_invoice_organization_assignment` | `assign_invoice_organization` | yes (function-only) | **applied** |
| 5 | `20260728124000_customer_document_archive_service_role` | `archive_customer_document_as` | yes (function-only) | **applied** |
| 6 | `20260730120000_customer_project_organization_scope` | `create_customer_project_for_organization` — portal projects without an `owner_customers` row | yes (function-only) | **applied** |
| 7 | `20260730130000_pankofer_organization_reconciliation` | one-off forward-only data migration merging the two Pankofer organizations | no — aborts if the duplicate is absent | **applied, succeeded** |
| 8 | `20260731120000_customer_document_publish_guard` | pointer uniqueness index, category helper, validated + idempotent publish RPC | no — index name collides | **NOT applied** |
| 9 | `20260731121000_client_provisioning_identity` | identity normalization, candidate discovery, `provision_client_workspace_with_identity`, and a replaced `provision_client_workspace` | no — index names collide | **NOT applied** |

Order is not optional: 2 depends on 1's `customer_projects`, 3 on both, 5 on 2's
`is_platform_admin_as`, 8 on 2's `customer_documents` and 3's `owner_invoices` anchor,
and 9 only on the phase-0/CRM chain that is long since applied.

Migrations 1–3 and 8–9 are deliberately **not idempotent** — re-applying one fails
loudly and rolls back rather than silently masking schema drift. That is the intended
behaviour, not a bug. 4, 5 and 6 are function-only and safely re-runnable. 7 is a
one-off data migration that aborts rather than guessing if its subject is not present,
and **must not be run again** — it has already succeeded.

Re-run the preflight after each one; it will show that migration flip to applied.

```bash
bash scripts/staging/preflight.sh
```

It must end at **0 failed** before you continue.

### 2b. What is still outstanding on the hosted project

Exactly these steps, in this order. Everything above them is already done.

```bash
# 1 — read-only check of true current state. Only #8 and #9 may report "not applied".
bash scripts/staging/preflight.sh

# 2 — publish guard. Pre-checks for pre-existing duplicate pointers and reports them by
#     id before creating its unique index, so it can never fail opaquely.
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f supabase/migrations/20260731120000_customer_document_publish_guard.sql

# 3 — provisioning identity. Replaces provision_client_workspace IN PLACE (same
#     signature), so the currently deployed frontend keeps working the moment this
#     lands — it simply can no longer create a duplicate organization.
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f supabase/migrations/20260731121000_client_provisioning_identity.sql

# 4 — preflight again. Must now reach 0 failed with all eight schema migrations applied.
bash scripts/staging/preflight.sh

# 5 — redeploy the provisioning Edge Function. It now calls
#     provision_client_workspace_with_identity and returns 409 + the candidate list on
#     an identity conflict. Must go AFTER step 3: the RPC has to exist first.
supabase functions deploy admin-provision-client --project-ref "$STAGING_PROJECT_REF"

# 6 — endpoint verification (unauthenticated probes only; everything must be refused).
node scripts/staging/verify-endpoints.mjs

# 7 — frontend LAST. The publishing card and the identity-decision panel call the RPC
#     and the function deployed above.
```

**If step 2 aborts** with `duplicate live customer_documents pointers exist`, it will
name every offending `customer_documents` id in its `DETAIL`. Archive the redundant
rows with `archive_customer_document(<id>)` — keeping whichever one the customer has
already downloaded — then re-run. The migration deliberately refuses to pick a winner
and archive a customer-visible document on its own.

**Rollback.** 8 and 9 are additive apart from replacing one function body. To undo 9,
re-apply the `provision_client_workspace` definition from
`20260721120000_product_aware_client_platform.sql`; note that doing so restores the
duplicate-organization defect. To undo 8, `drop index
public.customer_documents_owner_source_live_unique` and re-apply the
`register_customer_document_from_owner_source` definition from `20260728121000`.
Rolling the frontend back alone is always safe.

---

## 3. Deploy the Edge Functions

```bash
supabase functions deploy customer-document-download --project-ref "$STAGING_PROJECT_REF"
supabase functions deploy customer-document-upload   --project-ref "$STAGING_PROJECT_REF"
# Changed in this PR — see §2b. Deploy only AFTER migration 9 is applied.
supabase functions deploy admin-provision-client     --project-ref "$STAGING_PROJECT_REF"
```

There is no secrets step. `SUPABASE_URL` and the publishable/secret keys are provided
automatically by the Edge Function runtime — `supabase secrets set` rejects the
reserved `SUPABASE_` prefix outright, so there is nothing to set.

---

## 4. Verify the endpoints

```bash
node scripts/staging/verify-endpoints.mjs
```

This sends only unauthenticated requests and asserts they are **refused**: a deployed,
correctly configured function answers an anonymous POST with `401 authentication_required`,
which proves in one probe that it exists, boots, reaches its handler, and puts the auth
gate before anything else. It also confirms the frontend and backend point at the same
project, and that an anonymous public-object read of the bucket is refused.

---

## 5. Optional — load disposable fixtures

Only if you want real two-tenant data to click through.

```bash
export ALLOW_STAGING_SEED=true
bash scripts/staging/seed-staging-fixtures.sh
```

Five interlocks must all pass first: `ALLOW_STAGING_SEED=true`, a well-formed
`STAGING_PROJECT_REF`, a `DATABASE_URL` containing that same reference, no CI
environment variable set, and a target that already carries all five migrations.

You get two organizations, an active member, a **suspended** member, a member of the
other organization, an internal Cogniiq staff account, one project with three
milestones, published/unpublished/archived documents, and issued invoices including
one with no organization for the assign-and-link flow. Everything is prefixed
`ZZ STAGING FIXTURE` / `ZZ-FIXTURE` and carries the `ffffffff-…` id prefix.

The internal fixture account is `cogniiq_admin`, not `cogniiq_owner`, on purpose:
`is_platform_admin()` accepts both so every owner-side path is exercised identically,
but minting a second platform owner on a real project is a privilege-escalation
footgun, and the last-owner delete guard would then also block cleanup.

Fixture documents reference storage paths that were never uploaded, so no fixture bytes
land in the bucket.

### Cleanup — always

```bash
psql "$DATABASE_URL" -f scripts/staging/cleanup-staging-fixtures.sql
```

Id-scoped, safe to repeat, and complete: after it runs the fixtures can be seeded
again from scratch. If you uploaded real files while testing, delete those from the
`customer-documents` bucket separately — the script removes database rows only.

---

## 6. Smoke test

As a customer (organization A's active member):

- `/app` — the project, its status, and "Ihre nächste Aktion"
- `/app/projects/<id>` — all four tabs
- `/app/documents` — exactly one document; open it (the signed URL is minted at click time)
- `/app/billing` — two invoices, correct outstanding balance

As the suspended member: every surface must be empty, with no error revealing that data exists.

As organization B's member: none of organization A's data, and organization A's project
id must render "Projekt nicht verfügbar" rather than an error that confirms it exists.

As internal staff: create a project, add a milestone, publish a document, archive one,
and link the unassigned invoice via the assign-and-link flow.

As internal staff, the **commercial publishing** flow (new in this PR):

- `/admin/finance/invoices/<id>` → the **Kundenportal** card. With no finalized PDF it
  must say `PDF speichern` is required; after `PDF speichern` the version appears as
  `Nicht registriert`.
- Pick the customer project → **Für Kundenportal registrieren**. The state becomes
  `Registriert, nicht freigegeben` and the customer must **not** see it yet.
- Press it a second time: still exactly one row in `customer_documents` for that PDF.
- **Für Kunden freigeben** → the customer's `/app/billing` now offers the PDF and the
  download succeeds against the canonical object in `owner-finance-documents`.
- **Freigabe zurücknehmen** → the customer's download action disappears;
  `published_at` stays set.
- `/admin/clients/<organizationId>` → the **Kommerziell** tab shows the offer and
  invoice counts with working links, for a customer with no `owner_customers` row.
- `/admin/finance/offers/<id>` → the same card, with `Angebot` for a finalized offer and
  `Annahmebestätigung` only for a signed acceptance certificate.

And the **duplicate-organization** guard:

- Provision a customer, then provision the same company name again with a *different*
  invitation address. It must **stop** with the candidate list and offer
  `Diese weiterverwenden` / `Bewusst separate Organisation anlegen` — and must not have
  created a second organization.
- Choose `Diese weiterverwenden`: no second `client_accounts`, engagement, solution,
  portal-settings row or membership appears, and the solution's `instance_key`
  (the portal URL) is unchanged.

---

## 7. Deploy the frontend

Last. The new UI calls RPCs and functions that must already exist, and the bucket must
already be correctly policied before any upload path is reachable.

---

## If something fails

**A migration fails partway.** Each runs in its own transaction, so its own changes roll
back automatically — no partial schema survives a single failed migration. Do not blindly
re-run a failed structural migration (1–3); read the error, fix the root cause, then re-run.
4 and 5 are safely re-runnable.

**An Edge Function misbehaves.** Both are additive; no existing route depends on them. A
failed deployment leaves document downloads non-functional (with a German error and a
retry) but breaks nothing else. Redeploy the previous version — no data migration is tied
to function deployment.

**The frontend is broken.** Roll it back alone. The new backend objects are purely additive
and unused by the previous build.

---

## Self-tests

The tooling here is itself tested, in CI, against throwaway local PostgreSQL clusters:

```bash
bash .github/scripts/run-staging-preflight-selftest.sh   # preflight catches 13 deliberate breaks
bash .github/scripts/run-staging-seed-selftest.sh        # every seeder interlock refuses; fixtures + cleanup work
```

The release logic itself is covered by:

```bash
bash .github/scripts/run-customer-platform-sql-tests.sh        # incl. the publish guard
bash .github/scripts/run-provisioning-identity-sql-tests.sh    # incl. real concurrent sessions
node .github/scripts/test-commercial-publishing-ui.mjs
node .github/scripts/qa-commercial-publishing-flow.mjs         # needs a browser + dev server
```
