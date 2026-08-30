# Owner CRM — the manual sales layer

One migration ships with this feature, applied by the existing **Supabase Production
Migration** workflow in a single run:

| Migration | Confirmation string | Requires (already applied) |
|-----------|--------------------|-----------------------------|
| `20260903120000_owner_crm_sales_pipeline.sql` | `APPLY_MIGRATION_20260903120000` | `20260710120000`, `20260722120000`, `20260723121000`, `20260724120000`, `20260830120000` |

## Why those prerequisites

They are the migrations whose objects the SQL actually references:

- `20260710120000` — `is_platform_owner()`, `set_updated_at()`
- `20260722120000` — `owner_business_entities`, `owner_finance_requests`,
  `owner_write_audit_row()`, `owner_claim_idempotency()`
- `20260723121000` — `owner_offers` (gains `owner_lead_id`)
- `20260724120000` — `owner_customers`, `owner_customer_tasks`,
  `owner_record_customer_activity()`
- `20260830120000` — `owner_add_customer_service()`, `owner_service_engagements`,
  `owner_engagement_tasks` (the conversion RPC and the command centre read these)

The later finance migrations are applied in production but are **not** prerequisites: nothing
here references them. Listing them would make the dependency gate assert something untrue.

## What the feature is

The dashboard already knew how to run a **customer**: `owner_customers` is the canonical
commercial identity, offers and invoices hang off it, and every purchased service gets a
template-instantiated onboarding engagement with a server-side go-live gate.

What it never had is the step *before* that — a prospect the owner met, is talking to, is
preparing an offer for, and has not yet won. This adds that layer and connects it to
everything that already exists.

```
Lead hinzufügen → Pipeline → (Schnittstellen-Gate) → Angebot → Gewonnen
                                                                   ↓
                                                      In Kunde umwandeln
                                                                   ↓
                                  owner_customers + Leistungen + AI-Receptionist-Onboarding
```

### Leads are manual only

There is no sourcing, no scraping, no enrichment, no import and no automated outreach. A lead
exists because a human typed it into `Lead hinzufügen`, and changing a pipeline stage records
an activity row and nothing else — it sends no mail, starts no sequence and touches no
external system.

This is enforced structurally, not by convention:
`src/lib/ownerCrm/crmBoundaries.test.ts` fails the build if the CRM ever gains a `fetch()`, an
export whose name suggests sourcing or outreach, or a second lead-creating RPC.

## Sales stage is not engagement lifecycle

The two pipelines share the word "lead" and are otherwise unrelated:

| | Column | Values | Lives |
|---|--------|--------|-------|
| **Sales** | `owner_leads.stage` | `new` → `contacted` → `qualification` → `discovery` → `interested` → `offer_preparation` → `offer_sent` → `negotiation` → `won` / `lost` | before conversion |
| **Delivery** | `owner_service_engagements.lifecycle_status` | `contracted` → `discovery` → `building` → `integrating` → `testing` → `client_approval` → `ready_for_go_live` → `live` → `monitoring` | after conversion |

No row carries both, and neither column is ever used to mean the other.

## Tables

| Table | Purpose |
|-------|---------|
| `owner_leads` | one manually entered prospect; every field but the identity check is optional |
| `owner_lead_service_interests` | which catalogue services the prospect wants |
| `owner_lead_follow_ups` | "call them back on Thursday", with completion and one optional successor |
| `owner_lead_activity` | append-only, sanitised German sales timeline |
| `owner_lead_integration_checks` | the pre-offer PVS / interface / third-party-cost gate |

Plus three additive links into systems that already exist:

- `owner_offers.owner_lead_id` — an offer written for a prospect. **Not** in
  `owner_guard_offer`'s frozen-column blocklist, so linking still works on a finalised offer
  while every commercial field stays immutable.
- `owner_customer_tasks.lead_id` — CRM tasks reuse the one task table. `customer_id` loses
  `NOT NULL` and a CHECK requires exactly one of the two. Every existing row has a
  `customer_id`, every existing RPC writes one and every existing read filters on one, so
  lead tasks are invisible to the customer surfaces and nothing existing changes behaviour.
- `owner_leads.converted_customer_id` — the prospect that became this customer.

## The pre-offer gate

Before an AI Receptionist offer is technically scoped, the owner needs to know whether the
client's appointment/PVS environment can actually be integrated and what a third party will
charge for it. Answering that after signature is how a client is surprised by a vendor licence
fee.

`owner_upsert_lead_integration_check` refuses `status = 'complete'` — as a database fact, so no
screen can talk its way past it — until **all** of:

1. a PVS **or** an appointment system is recorded;
2. the interface question has an answer (`none` is an answer; `NULL` means nobody looked);
3. third-party costs are explicitly confirmed, *including when there are none*;
4. the automation mode is decided (`unknown` is not a decision); and
5. anything short of full automation names its exact fallback.

`missingIntegrationAnswers()` in `src/lib/ownerCrm/nextActions.ts` mirrors those five
conditions so the UI can say what is missing *before* the owner tries to close the assessment.
The server stays the authority; the browser copy is only the polite version, and
`nextActions.test.ts` pins the two together.

Every supported-operation flag is genuinely tri-state. `NULL` renders as "—", never as "Nein":
an operation nobody has verified must not be sold as supported, and must not be written off as
impossible either.

## Conversion

`owner_convert_lead_to_customer` is the most consequential write in the CRM and is entirely
server-side:

- **Atomic** — one function, one transaction. Either the customer, the services, the link and
  the trail all exist, or none do.
- **Idempotent twice over** — the idempotency key replays the stored result, *and* an
  already-converted lead returns its existing customer instead of making a second one. A double
  click, a retry and a stale second tab all land on the same row.
- **Non-destructive** — the lead survives with every field, note, activity row and linked
  offer, and gains a link. There is no hard-delete RPC for a lead at all.
- **De-duplicating** — an explicit `customer_id` first, then a normalised e-mail. Company name
  alone never matches, the same rule `owner_create_customer` already uses.

Services are attached through `owner_add_customer_service`, which is itself idempotent per
(customer, service) and instantiates the AI Receptionist onboarding template exactly once.

## Order relative to the frontend merge

**Preferred: migration first, then merge the frontend.**

Frontend-first is safe but degrades less gracefully than the service layer did: the CRM RPCs
return PostgREST `PGRST202` and the Leads page shows its `ErrorState` with a retry. Nothing
else breaks — the cockpit renders its empty state, and every existing finance, customer,
offer, invoice and portal surface is untouched, because the only changes to existing files are
three route additions, a navigation reorder, one card on the customer page and an optional
prefill in the offer editor.

## Legacy: `public.cogniiq_receptionist_leads`

Created 2026-07-30 by a one-off sourcing experiment — `google_rating`, `review_count`,
`fit_score` and `sourced_date` give it away — and referenced by no application code whatsoever.
It is **not** the owner's pipeline and must not be presented as one: the manual CRM is
`public.owner_leads`.

Its security boundary belongs to `20260902120000_receptionist_leads_pii_rls.sql`, which landed
on `main` while this feature was being built and does the job far more completely than a side
note here could — it revokes the identity sequence, withholds `TRUNCATE`, and proves the result
against a demonstrated exposure. **This migration deliberately does not touch that table**, in
statement or in grant: re-granting it would silently narrow the access matrix that migration
chose. `crmBoundaries.test.ts` asserts that separation from both sides.

Whether the 50 rows are eventually deleted is an owner decision, not an engineering one.

## Verification

| Check | Where |
|-------|-------|
| RLS, gates, conversion idempotency, go-live blocking | `supabase/tests/run_owner_crm_smoke.sh` (real Postgres) |
| Lead lifecycle through the real components | `src/pages/owner/ownerCrm.test.tsx` |
| The deterministic next-action engine | `src/lib/ownerCrm/nextActions.test.ts` |
| Portal isolation and the manual-only rule | `src/lib/ownerCrm/crmBoundaries.test.ts` |
| Local vs UTC time formatting | `src/lib/ownerCrm/format.test.ts` |

Run the SQL smoke against a scratch database:

```bash
DATABASE_URL=postgresql://postgres@127.0.0.1:5432/postgres \
  supabase/tests/run_owner_crm_smoke.sh
```

It runs inside a transaction and rolls back, so it leaves no rows behind.
