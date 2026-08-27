# Client service onboarding — deployment runbook

Two migrations ship with this feature. They are applied to production by the existing
**Supabase Production Migration** workflow, one run each, in this order:

| # | Migration | Confirmation string | Requires (already applied) |
|---|-----------|--------------------|-----------------------------|
| 1 | `20260830120000_client_service_onboarding.sql` | `APPLY_MIGRATION_20260830120000` | `20260710120000`, `20260722120000`, `20260724120000` |
| 2 | `20260830121000_ai_receptionist_template_v1.sql` | `APPLY_MIGRATION_20260830121000` | the three above **plus** `20260830120000` |

The workflow's isolation invariant is that exactly one local-only migration reaches
`supabase db push`, so these cannot be applied in a single run. That is deliberate: the
dependency gate re-checks the remote history before each push, and run 2 is refused until
run 1 is present.

## Why those prerequisites

They are the migrations whose objects the SQL actually references — not simply the most
recent ones:

- `20260710120000` — `is_platform_owner()`, `set_updated_at()`
- `20260722120000` — `owner_business_entities`, `owner_finance_requests`,
  `owner_write_audit_row()`, `owner_claim_idempotency()`
- `20260724120000` — `owner_customers`, `owner_record_customer_activity()`
- `20260830120000` — the template tables the seed writes into

The finance chain (`20260826120000` / `20260828120000` / `20260829120000`) is already applied
in production but is **not** a prerequisite: nothing in this feature references it. Listing it
would make the gate assert something untrue.

## Order relative to the frontend merge

**Preferred: migrations first, then merge the frontend.** Run 1, then run 2, then merge the PR.
The feature is then live the moment the code deploys.

**Frontend-first is also safe.** Between a frontend deploy and the migrations, every service
RPC returns PostgREST `PGRST202` (function not in the schema cache). That is classified through
the finance area's existing `isMissingBackendError()` and surfaces as a calm, factual state
rather than an error:

| Surface | Behaviour before the migrations |
|---------|--------------------------------|
| Customer detail → *Leistungen* | "Die Leistungsverwaltung ist in dieser Umgebung noch nicht aktiviert…" — no red error, no retry button, no *Leistung hinzufügen* action |
| `/admin/finance/customers/:id/services/:key` | The same sentence in a plain card, not an `ErrorState` |
| Customer create/edit dialog | The customer **is saved**; a toast explains that the service could not be provisioned yet |

Nothing else on the customer page changes: offers, invoices, tasks, documents and activity are
untouched by this feature.

This degradation is deliberately narrow. It triggers **only** on the missing-object codes
(`42P01`, `PGRST202`, `PGRST205`). A genuine failure after deployment — an RLS denial, a
constraint violation, a network error — is still shown as an error with its message and a
retry, so a real fault can never hide behind "not deployed yet".

## The 16 canonical phases → 20 template sections

The onboarding process has **16 phases**. The template stores **20 sections**, because four
phases are split where one section would have mixed two unrelated kinds of data. A split is a
subdivision; no phase is missing and no extra phase was invented.

| # | Canonical phase | Section(s) | Nav group | Readiness category |
|---|-----------------|-----------|-----------|--------------------|
| 1 | Kundenprofil & Leistungsumfang | `profile`, `scope` | Aufnahme | Aufnahme |
| 2 | Bestandssysteme & Integrationsfähigkeit | `software`, `integration` | Integration | Integration |
| 3 | Recht & Datenschutz | `legal` | Compliance | Recht & Datenschutz |
| 4 | Datenschutz-Produktionsinfrastruktur | `privacy_infra` | Compliance | Recht & Datenschutz |
| 5 | Workflow-Discovery | `workflow`, `identity` | Aufnahme | Aufnahme |
| 6 | Wissensdatenbank | `knowledge` | Agent | Wissensdatenbank |
| 7 | Golden Agent / ElevenLabs | `agent` | Agent | Agent |
| 8 | Backend / n8n | `backend` | Integration | Backend |
| 9 | Telefonie | `telephony` | Telefonie | Telefonie |
| 10 | Automatisierte Tests | `testing` | Tests | Tests |
| 11 | Performance | `performance` | Tests | Tests |
| 12 | Kundenabnahme (UAT) | `uat` | Tests | Kundenabnahme |
| 13 | Go-Live-Gate | `commercial`, `golive` | Überblick / Go-Live | Kommerziell |
| 14 | Produktivsetzung | `deployment` | Go-Live | Kommerziell |
| 15 | Monitoring erste Woche | `monitoring` | Monitoring | Tests |
| 16 | Laufende Wartung | `maintenance` | Monitoring | Tests |

**Why the four splits**

- **P1** — who the client is (contacts, locations, languages) is stable reference data;
  what the agent may do is a 16-capability decision list. Together they are one unreadable form.
- **P2** — what the client runs today is discovery; whether it can be automated, and how
  honestly, is an assessment carrying its own go-live gate (`INT-001`, `INT-005`).
- **P5** — appointment types are a one-to-many record list; identification and escalation rules
  are prose decisions. Different shapes, different editors.
- **P13** — the gate has a commercial half (contract signed, scope approved) and a technical half
  (rollback plan, production credential readiness). Both block go-live; different people sign
  them off at different times.

`sort_order` is **display** order within a navigation group, not phase order — the commercial half
of P13 appears first because it belongs in the Overview tab, and compliance precedes integration
because that is the order the work is done in.

The mapping lives in code as `CANONICAL_PHASES` in `src/lib/serviceOnboarding/catalog.ts`.
`aiReceptionistTemplate.test.ts` asserts it in both directions: every phase must exist in the
seed, every seeded section must belong to exactly one phase, no section may be claimed twice, no
phase may be empty, and every split must carry a written rationale.

## RPC permission model

Verified against a real PostgreSQL instance with the migrations applied (`has_function_privilege`,
`pg_proc.prosecdef`):

| RPC | SEC DEFINER | anon | authenticated | service_role | owner check | Intended caller |
|-----|-------------|------|---------------|--------------|-------------|-----------------|
| `owner_add_customer_service` | yes | no | **yes** | yes | yes | browser (owner) |
| `owner_set_customer_service_state` | yes | no | **yes** | yes | yes | browser (owner) |
| `owner_list_customer_services` | yes | no | **yes** | yes | yes | browser (owner) |
| `owner_engagement_detail` | yes | no | **yes** | yes | yes | browser (owner) |
| `owner_update_engagement` | yes | no | **yes** | yes | yes | browser (owner) |
| `owner_set_engagement_status` | yes | no | **yes** | yes | yes | browser (owner) |
| `owner_set_engagement_task` | yes | no | **yes** | yes | yes | browser (owner) |
| `owner_set_engagement_field` | yes | no | **yes** | yes | yes | browser (owner) |
| `owner_upsert_engagement_appointment_type` | yes | no | **yes** | yes | yes | browser (owner) |
| `owner_delete_engagement_appointment_type` | yes | no | **yes** | yes | yes | browser (owner) |
| `owner_engagement_go_live_blockers` | yes | no | **no** | yes | no | internal only |
| `owner_instantiate_service_engagement` | yes | no | **no** | yes | yes¹ | internal only |
| `owner_record_engagement_activity` | yes | no | **no** | yes | no | internal only |

¹ `owner_instantiate_service_engagement` has no check of its own; its only caller,
`owner_add_customer_service`, performs the owner check before invoking it.

Two distinct mechanisms are at work, and the word "service role" means something different in
each:

1. **EXECUTE grants** — which *database role* may call the function at all. The three internal
   helpers are granted to the `service_role` database role only. That role is never used from a
   browser (the browser presents the anon key plus a user JWT and acts as `authenticated`), and a
   holder of the service-role key already has unrestricted database access, so the grant confers
   nothing extra.
2. **Runtime authorization** — `is_platform_owner()` inside the ten browser-facing RPCs. This is
   what refuses a signed-in non-owner. The disposable-database suite exercises it by simulating
   the request context as anon, admin and service and asserting all three are refused by all ten.

The three internal helpers have no runtime check, so for them the *absence of the grant* is the
authorization boundary. That is asserted explicitly rather than assumed.

## Rollback

The migrations are purely additive: they create new tables and functions and modify nothing
that existed before. `owner_customer_detail(uuid)` is deliberately untouched. If the feature
has to be withdrawn, revert the frontend — the unused tables are inert, and the frontend
degrades exactly as described above.

Dropping the tables is **not** a rollback step: it would destroy onboarding history. Do it only
as a deliberate, separately reviewed decision.

## Verification after each run

The workflow already verifies the ledger. Beyond that:

- after run 1: `owner_service_engagements` and `owner_engagement_tasks` exist and are empty
- after run 2: exactly one row in `owner_service_templates`
  (`ai_receptionist_healthcare`, version 1) with 20 sections, 171 tasks and 132 fields

The same numbers are asserted by `.github/scripts/run-client-service-onboarding-sql-tests.sh`
(disposable Postgres, runs in CI) and by
`src/lib/serviceOnboarding/aiReceptionistTemplate.test.ts`.
