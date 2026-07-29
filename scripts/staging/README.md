# Customer platform — staging runbook

Everything needed to bring the customer project / document / billing release up on a
staging Supabase project and verify it, in order. Nothing here touches production, and
nothing here runs automatically.

| File | What it does | Writes? |
|---|---|---|
| `preflight.sql` | 180 read-only assertions about database state | no |
| `preflight.sh` | Runs the above, exits non-zero on any mismatch | no |
| `verify-endpoints.mjs` | Edge Function health, frontend↔backend agreement, bucket privacy | no |
| `seed-staging-fixtures.sh` | Guarded entry point for the fixture loader | **yes** |
| `seed-staging-fixtures.sql` | The disposable fixtures themselves | **yes** |
| `cleanup-staging-fixtures.sql` | Removes exactly those fixtures | **yes** |

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

On a fresh staging project this reports the five migrations as **not applied**, which
is the expected starting point. It also verifies up front that the server is
PostgreSQL 15+ (migrations 1 and 2 use column-specific `ON DELETE SET NULL`) and that
every table, helper function and role this release builds on already exists.

Any `FAIL` is a stop. The script exits non-zero so it can gate a deploy.

---

## 2. Apply the five migrations, in this exact order

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20260728120000_customer_project_core.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20260728121000_customer_documents.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20260728122000_customer_billing_link.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20260728123000_owner_invoice_organization_assignment.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20260728124000_customer_document_archive_service_role.sql
```

Order is not optional: 2 depends on 1's `customer_projects`, 3 on both, and 5 on 2's
`is_platform_admin_as`. Do not start one until the previous one is confirmed applied.

Migrations 1–3 are deliberately **not idempotent** — re-applying one fails loudly and
rolls back rather than silently masking schema drift. That is the intended behaviour,
not a bug. Migrations 4 and 5 are function-only and safely re-runnable.

Re-run the preflight after each one; it will show that migration flip to applied.

```bash
bash scripts/staging/preflight.sh
```

It must end at **0 failed** before you continue.

---

## 3. Deploy the Edge Functions

```bash
supabase functions deploy customer-document-download --project-ref "$STAGING_PROJECT_REF"
supabase functions deploy customer-document-upload   --project-ref "$STAGING_PROJECT_REF"
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
