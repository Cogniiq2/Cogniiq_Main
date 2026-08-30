# PR 70A — Owner CRM: pre-customer manual sales foundation

**This PR ships the PRE-CUSTOMER MANUAL SALES FOUNDATION and nothing else.**

It is the database layer that sits *in front of* the canonical customer:
prospects the owner has met, is talking to, and has not yet won. It is
independently deployable and has no frontend. Nothing in it converts a lead into
a customer, links an offer to a lead, creates a project, or changes any existing
table.

Migration: `supabase/migrations/20260903120000_owner_crm_lead_foundation.sql`

---

## What this PR contains

| Object | Purpose |
| --- | --- |
| `owner_leads` | one manually entered prospect / opportunity |
| `owner_lead_service_interests` | which catalogue services the prospect wants |
| `owner_lead_follow_ups` | "call them back on Thursday", with completion |
| `owner_lead_activity` | append-only, sanitised sales timeline |
| `owner_lead_integration_checks` | the pre-offer PVS / interface / third-party-cost gate |

Owner-gated RPCs (the only write paths):
`owner_create_lead`, `owner_update_lead`, `owner_set_lead_archived`,
`owner_set_lead_stage`, `owner_upsert_lead_follow_up`,
`owner_complete_lead_follow_up`, `owner_log_lead_contact`,
`owner_upsert_lead_integration_check`, `owner_find_lead_duplicates`.

Read models: `owner_list_leads`, `owner_lead_detail`.

---

## What this PR deliberately does NOT contain

Lead → customer conversion. Any change to `owner_customer_tasks` (no `lead_id`
column, no `NOT NULL` relaxation, no polymorphic task table, no second task
table). Any change to `owner_offers` or offer provenance. Service engagement
lifecycle mutations. `owner_projects` or any project architecture. Command
Center, Cockpit, navigation, or any frontend at all. Sourcing, scraping,
enrichment, outreach, telephony, ElevenLabs, n8n, PVS integration, Stripe,
PayPal, or any tax/accounting semantics.

Nothing in this migration writes to, reads from, or schedules an external
system. Leads arrive exactly one way: a human types them in.

The suite in `.github/scripts/sql/owner-crm-lead-foundation-tests.sql` asserts
these absences (section L) rather than merely documenting them.

---

## Security model

The independent review of PR #70 found a P0 defect: `authenticated` held direct
`INSERT`/`UPDATE`/`DELETE` on the gated CRM tables, so a browser could bypass
every RPC validation with a hand-written PostgREST call. PR 70A fixes that
architecture rather than the symptom.

### Grant matrix

| Role | owner_leads | owner_lead_service_interests | owner_lead_follow_ups | owner_lead_activity | owner_lead_integration_checks |
| --- | --- | --- | --- | --- | --- |
| `anon` | — | — | — | — | — |
| `authenticated` | `SELECT` | `SELECT` | `SELECT` | `SELECT` | `SELECT` |
| `service_role` | — | — | — | — | — |
| RPC (SECURITY DEFINER) | full | full | full | insert only | full |

`SELECT` is additionally filtered by an RLS policy requiring
`public.is_platform_owner()`, so an ordinary authenticated user reads zero rows.
There is **no** `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES` or
`TRIGGER` grant to any browser role, and no policy on any of the five tables is
anything other than `FOR SELECT`.

`service_role` is granted nothing — neither table privileges nor RPC execute.
Holding a service-role key is not the same as being the owner, and possessing
one is not a way into the sales domain.

Internal helpers (`owner_record_lead_activity`, `owner_lead_refresh_follow_up`,
`owner_normalize_phone`, `owner_normalize_domain`, `owner_lead_display_name`,
`owner_write_lead_audit_row`) are revoked from `public`, `anon`,
`authenticated` and `service_role`. They are reachable only from inside the
definer bodies.

Every RPC independently calls `is_platform_owner()` on its first line and pins
its `search_path`. The RLS policy is a second layer, not the only one.

`owner_lead_activity` is append-only as a matter of privilege, not convention:
no role holds `INSERT`, `UPDATE`, `DELETE` or `TRUNCATE` on it, so
`owner_record_lead_activity` — itself unreachable from a browser — is the only
writer.

---

## The pre-offer gate

`owner_lead_integration_checks.status = 'complete'` is refused unless all five
conditions hold:

1. a PVS **or** an appointment system is recorded;
2. `interface_type` is answered — `'none'` counts, `NULL` and `'unknown'` do not;
3. third-party costs are explicitly confirmed **and** carry recorded amounts
   (zero is a valid amount, `NULL` is not);
4. `integration_mode` is actually decided — `'unknown'` is not a decision;
5. anything other than `'full_automation'` states an explicit
   `fallback_description`.

Two independent layers enforce this, and neither may be weakened in favour of the
other:

1. **Message layer.** `owner_upsert_lead_integration_check` folds the patch over
   the current row to build the *prospective* row, validates that, and raises the
   condition-specific German error **before issuing any `UPDATE`**. Because
   patch semantics are applied once, the state validated is exactly the state
   written. A refused completion therefore writes nothing at all — a rejected
   save cannot half-apply.
2. **Enforcement layer.** The table constraint
   `owner_lead_integration_checks_complete_gate` is the hard backstop and holds
   for every write path that exists now or is added later — a future migration,
   a direct `psql` session, a superuser — none of which pass through the RPC.

Validating *after* the `UPDATE` would make layer 1 unreachable: the constraint
rejects the statement first and the caller sees a constraint name instead of an
explanation. The suite asserts both layers separately — section F-A requires the
RPC's own message and treats a raw `check_violation` surfacing there as a
failure; section F-B drives each condition through a raw table-owner write and
requires the constraint to reject it.

**Tri-state is load-bearing.** `supports_availability`, `supports_booking`,
`supports_reschedule`, `supports_cancel` and `supports_patient_write` are
`TRUE` / `FALSE` / `NULL`. `NULL` means *not yet established* and is
semantically different from `FALSE`; nothing coerces one into the other. In
patch semantics an absent key leaves the value alone, an explicit JSON `null`
restores "unknown", and only an explicit `false` stores `false`. A consuming UI
must never render `NULL` as "Nein".

---

## Leads

Creation requires exactly one recognisable identity: a **company**, a **contact
name**, or an **email**. Everything else is optional, so a prospect can be
captured mid-conversation.

Duplicate detection is **advisory only**. It never merges, never blocks and
never decides. Email, normalised phone and website host are *strong* signals;
a shared company or contact name alone is *weak*, because two practices
genuinely can be called "Praxis Dr. Müller". Matches are returned alongside the
newly created lead — creation proceeds regardless. Existing **customers** are
scanned too, so "this is already a customer" is not missed.

A stage change writes an activity row and nothing else. It creates no customer,
no project and no invoice; it mutates no accounting, sends no mail and triggers
no external system.

**`'won'` is refused in 70A.** A project starts at Won, so winning must create
the customer, the project and the sold services atomically. That path does not
exist yet, and a lead parked at `'won'` with none of them would be an orphan the
rest of the system cannot represent. `'won'` remains a valid value of the stage
`CHECK` so the conversion migration needs no destructive schema change — it is
the *transition* that is withheld, not the value. No sanctioned path can produce
a won lead: `owner_create_lead` refuses `'won'` as a starting stage,
`owner_update_lead` cannot write `stage` at all, `owner_set_lead_stage` refuses
it with a domain error naming the future atomic path, and a direct table write is
refused by the grant matrix.

A loss requires a reason. Reopening a lost lead keeps every field and every
timeline row and clears only the now-stale loss.

There is no hard-delete RPC for a lead. Archiving is reversible.

---

## Task seam (documented, not implemented)

A lead may eventually need internal to-dos. This PR does **not** add `lead_id`
to `owner_customer_tasks`, does not relax its `NOT NULL`, and does not create a
second physical task table — a parallel task system is the thing this codebase
deliberately does not build.

`owner_lead_detail` reserves a `tasks` key and returns an empty array, so a
consumer written today keeps working when task support arrives. When it does, it
must remain **one** task concept with the owning row resolved at the API seam.

---

## Migration safety

Forward-only and purely additive. It creates new objects and touches no existing
table, column, constraint, policy, grant or row. No `DROP` of anything
pre-existing, no `TRUNCATE`, no data deletion, no `NOT NULL` relaxation. Safe on
a populated production database.

Replay-safe: every statement is `IF NOT EXISTS` / `CREATE OR REPLACE` /
guarded, and the test runner re-applies the migration onto a populated schema and
re-asserts that neither the grant matrix nor the data changed.

The migration opens with a fail-closed preamble that raises if any prerequisite
it actually uses is missing.

A dedicated audit trigger function (`owner_write_lead_audit_row`) is used rather
than the generic `owner_write_audit_row`. The generic factory resolves the
business entity as `coalesce(row->>'business_entity_id', row->>'id')`, which is
correct only for `owner_business_entities` and wrong for any table lacking the
column — the exact defect migration `20260830122000` had to repair in
production. `owner_lead_integration_checks` has neither column (its primary key
is `lead_id`), so the dedicated function resolves the entity through the lead, or
fails, and never substitutes a row id for an entity id. Free-text sales columns
are stripped before anything reaches `owner_audit_log`.

### Production deployment — DO NOT RUN AS PART OF THIS PR

The migration is on the guarded allowlist
(`.github/scripts/lib/supabase-migration-allowlist.mjs`) with its real
prerequisites recorded: `20260710120000`, `20260722120000`, `20260724120000`.
Applying it is a separate, deliberate operator action through the
**Supabase Production Migration** workflow — `audit-history`, then `dry-run`,
then `apply` with confirmation `APPLY_MIGRATION_20260903120000`. Nothing in this
PR applies it.

---

## Tests

`.github/scripts/run-owner-crm-lead-foundation-sql-tests.sh` boots a throwaway
PostgreSQL cluster, reproduces Supabase's real hosted default public-schema
grants (so the migration's `REVOKE` has to do actual work), applies the real
migration chain, and executes
`.github/scripts/sql/owner-crm-lead-foundation-tests.sql`:

| Section | Covers |
| --- | --- |
| A | grant matrix from the live catalogs; policy commands; helper execute privileges; pinned `search_path` on every definer |
| B | direct DML denial **as the real platform owner** — gate `UPDATE`, stage `UPDATE`, activity `INSERT`/`UPDATE`/`DELETE`, `TRUNCATE`, and every remaining write verb |
| C | `anon`, an ordinary customer and `cogniiq_admin`: no reads, no writes, no RPCs |
| D | the sanctioned owner RPCs, the deterministic follow-up cache, patch semantics, read-model shape |
| E | identity validation and advisory duplicate warnings (strong vs. weak, cross-format phone, website host, existing customers) |
| F-A | each of the five gate conditions independently through the RPC, asserting its specific domain message and failing on a raw `check_violation`; plus a refused completion writing nothing |
| F-B | the same five conditions through a raw table-owner write, requiring the CHECK constraint to reject each |
| G | tri-state preservation across absent / null / true / false patches |
| H | loss, reopening, the refusal of `'won'` (RPC and direct write), and the containment of a stage change |
| I | idempotency, including key-to-operation binding |
| J | cross-business-entity isolation |
| K | the append-only activity contract and honest audit-entity resolution |
| L | proof that no pre-existing schema changed and no out-of-scope object exists |

Wired into CI as the `owner-crm-lead-foundation-sql-tests` job in
`.github/workflows/build.yml`.

---

## Future phases

This PR is **not** the Owner OS and does **not** deliver conversion.

The order is fixed by one architectural fact: **a project starts at Won.**
Winning an opportunity must create the customer, the project and the sold
services in a single atomic step, so conversion cannot ship before the
first-class project spine exists.

- **70A** — CRM lead foundation *(this PR)*
- **70B** — `owner_projects` + project / service architecture
- **70C** — atomic Won → customer → project → sold-service conversion, + Lead UI
- **70D** — offer / project provenance + work / task integration
- **70E** — Command Center + final HOME / CUSTOMERS / FINANCE navigation
