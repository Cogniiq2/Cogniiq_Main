# Owner Finance & Tax Cockpit — V1

Owner-only financial and tax cockpit for the Cogniiq Einzelunternehmen (EÜR, Regelbesteuerung).
Not a customer product and not a general admin dashboard.

## Architecture

- **Frontend:** lazy-loaded `/owner/*` area (`src/pages/owner/*`) behind `PlatformOwnerRoute`, with a
  dedicated premium dark shell (`ownerUi.tsx`). Routes are dispatched from `src/App.tsx`
  (`location.pathname.startsWith('/owner')`), separate from `/app` (customer) and `/admin` (CRM).
- **Data layer:** `src/lib/ownerFinance/api.ts` (Supabase queries + owner-only RPCs + audit logging),
  `types.ts`, `exports.ts` (CSV/JSON with metadata banner).
- **Tax engine:** `src/lib/ownerFinance/tax/*` — pure, deterministic, versioned `de-2026-v1`. No tax
  formulas in React components.
- **Database:** additive migration `supabase/migrations/20260722120000_owner_finance_cockpit.sql`.

## Authorization

- Access requires the database-backed role `profiles.platform_role = 'cogniiq_owner'`
  (`public.is_platform_owner()`), never email, JWT metadata, organization ownership, `cogniiq_admin`,
  or client state. `info@cogniiq.de` is never hardcoded.
- `PlatformOwnerRoute` uses `isPlatformOwner`. Every finance table/policy and both mutation RPCs
  enforce `is_platform_owner()`. RLS is the final boundary; the denied UI never reveals whether
  records exist. The "Owner Cockpit" link in the admin shell renders only for owners.

## Schema overview (all owner-only RLS, money = bigint cents, % = basis points)

`owner_business_entities` (seed: active Cogniiq sole proprietorship + disabled Cogniiq Family GmbH),
`owner_tax_settings` (per entity/year), `owner_expense_categories` (seeded) + `owner_vendors`,
`owner_invoices`/`owner_invoice_lines`, `owner_expenses`/`owner_expense_lines`, `owner_payments`
(cash/transaction ledger), `owner_subscriptions`, `owner_assets`, `owner_tax_estimates` (immutable
snapshots) + `owner_tax_payments`, `owner_finance_documents`, `owner_exports`,
`owner_elster_submissions` (V2 states, flag off), append-only `owner_audit_log`,
`owner_finance_requests` (uuid idempotency ledger). Server-authoritative triggers recompute
line/header totals (header totals cannot be forged — computed columns are not update-grantable);
per-entity invoice-number uniqueness; issued invoices cannot be hard-deleted or renumbered; payments
derive invoice/expense status. RPCs: `create_crm_only_client` (owner/admin, idempotent, no
solution/membership/invitation) and `owner_finance_period_summary` (scoped aggregates).

## Calculation scope

EÜR cash result, VAT/Vorsteuer period summary, EStG §32a income tariff (single/joint), Gewerbesteuer,
§35 relief, Solidaritätszuschlag, church tax, combined reserve, safely-available cash, straight-line
depreciation schedule. All are **planning estimates, not tax assessments**. VAT is never treated as a
normal operating expense. Unknown VAT classifications block the "filing-ready" state.

## Tax assumptions & sources (`de-2026-v1`)

| Rule | Value | Statutory | Effective | Verification |
|---|---|---|---|---|
| VAT standard / reduced | 19% / 7% | UStG §12(1)/(2) | 2007/2020 | search-verified |
| Income tariff 2026 (Grundfreibetrag 12,348 €; kinks 17,799/69,878/277,825) | zone formulas | EStG §32a(1) | 2026-01-01 | search-verified |
| GewSt allowance / Messzahl / min Hebesatz | 24,500 € / 3.5% / 200% | GewStG §11, §16 | — | search-verified |
| §35 factor / three-way min | 4.0× Messbetrag | EStG §35(1) | 2020 | search-verified (estimate) |
| Soli 2026 Freigrenzen / rate / marginal | 20,350 € / 40,700 € / 5.5% / 11.9% | SolzG §3–§4 | 2026-01-01 | search-verified |
| Church tax (BY) | 8% | Landes-KiStG | — | knowledge-based (estimate) |
| GWG / Sammelposten | 800 € / 250.01–1,000 € over 5y | EStG §6(2)/(2a) | 2018 | search-verified |

**Verification caveat:** primary hosts (gesetze-im-internet.de, bundesfinanzministerium.de) returned
egress-policy 403 during research; constants were verified via WebSearch snippets quoting the official
statutory text ("search-verified"). Re-verify with a direct primary fetch before any production
filing. Hebesatz, church-tax rate/opt-in, per-asset useful life and Sammelposten election are
**inputs**, not frozen constants. Every rule carries source metadata in `tax/rules.ts`.

## ELSTER / ERiC boundary

V1 is **export/preparation only**. Buttons are labelled "…-Paket erstellen", never "An ELSTER senden".
ERiC requires manufacturer registration/licensing and cannot be freely bundled, so no XML schema is
frozen and no transmission occurs. `owner_elster_submissions` + the `elster_direct_submission_enabled`
flag (default false) exist only as a V2 interface boundary. No ELSTER certificate/password is stored in
tables, storage, repo files or Vite env vars.

## Migration / deployment order

Apply after all existing migrations: Phase 0 → hardening → receptionist persistence → product-aware
client platform → **20260722120000_owner_finance_cockpit**. The storage bucket + `storage.objects`
policies are created only when the `storage` schema exists (guarded for the bare CI DB). No production
migration has been applied by this PR.

## Storage & environment

- Private bucket `owner-finance-documents` (not public); owner-only `storage.objects` policies (gated
  on `is_platform_owner()`); signed URLs only; randomized object paths (`<entity>/<uuid>-<safe-name>`);
  MIME/size validation (≤25 MB) in the client; the metadata `owner_finance_documents` row is
  entity-validated in the database and audited.
- **Storage caveat:** object paths begin with the owning entity id by convention, but a
  storage-object-level check that the path prefix matches the metadata entity, and blocking hard
  deletion of objects linked to reviewed/paid/issued/snapshotted records, requires a real Supabase
  Storage integration test (the bare CI DB has no `storage` schema). The metadata table already
  prevents cross-entity linking and is delete-restricted; tighten the object-level path policy during
  a real-Supabase integration pass.
- No new frontend env vars. The service-role key is never used in the browser.

## Manual test checklist

- Owner sees `/owner/*`; `cogniiq_admin` and customers get the denied state / redirect and no owner nav.
- Overview shows real KPIs, setup-incomplete banner, alerts, and empty chart state with no data.
- Create draft invoice → issue → record partial then full payment → status transitions; issued invoice
  cannot be deleted/renumbered.
- Add expense with VAT treatment + eligibility; review queue; mark reviewed.
- Settings: save Hebesatz/USt-mode/assessment/church/other income → Taxes reflects them; without
  Hebesatz, trade tax shows "Hebesatz fehlt".
- Taxes: sections separate exact vs estimate; save an immutable snapshot; export UStVA CSV /
  Steuerübersicht JSON (banner states unsubmitted + rules version).
- Existing `/app` customer portal and `/admin/clients` CRM still work.

## Integrity model (server-authoritative)

- **EÜR is payment-based.** `owner_tax_period_inputs(entity, from, to, vat_timing)` derives revenue and
  deductible expenses from `owner_payments.payment_date` (proportional net allocation to the linked
  invoice/expense), excluding owner contributions/withdrawals, transfers and tax payments/refunds.
  Cross-year and partial payments land in the correct period; unpaid invoices are excluded from cash
  revenue. §11 ±10-day recurring payments are flagged for review, not auto-reassigned.
- **VAT timing.** `ist` recognizes output VAT on received payments proportionally to each invoice's
  VAT ratio (handles mixed rates via the invoice's actual VAT total; unlinked income blocks
  filing-ready). `soll` recognizes output VAT by the service date/period (missing service dates block
  filing-ready). Input VAT is determined independently of the output-timing mode.
- **No hard deletes.** `authenticated` has no `DELETE` on any owner-finance table; history is
  preserved via void/archive. Draft-only `delete_owner_draft_invoice`/`delete_owner_draft_expense`
  RPCs enforce (in the database) that the object was never issued/paid/reviewed/linked. Disaster
  recovery stays with `service_role`, separate from the owner browser.
- **DB-authoritative audit.** A `SECURITY DEFINER` trigger writes every material insert/update/delete
  into the append-only `owner_audit_log` inside the same transaction, with `auth.uid()` as actor and
  safe field summaries (no secrets/document contents). Browser clients cannot insert/update/delete
  audit rows.
- **Relational/entity consistency.** Triggers reject payments, documents, expense→subscription,
  asset→source-line and invoice/expense→CRM links whose entities/organizations differ.
- **Atomic idempotent RPCs.** `create_owner_invoice`, `create_owner_expense`,
  `record_owner_invoice_payment`, `record_owner_expense_payment`, `record_owner_tax_payment` and
  `issue_owner_invoice` are single-transaction and UUID-idempotent (a key is bound to one operation
  kind); a failed line rolls back the header.
- **Invoice issuance boundary.** `issue_owner_invoice` validates draft state, ≥1 line, positive
  server-derived totals, issue/service/due dates, supported currency, resolved VAT, and assigns a
  concurrency-safe per-entity number from `owner_invoice_counters` (locked row, never `MAX()+1`).
  After issuance, number/metadata and lines are immutable; corrections use void/credit.
- **Depreciation timing.** Straight-line AfA reduces the first year pro rata by the start month;
  cumulative rounding keeps cents reproducible and accumulated depreciation never exceeds the base.

## Rollback considerations

Additive migration; to roll back, drop the `owner_*` objects and the two RPCs (no existing objects are
modified). The storage bucket/policies are additive. No production data is touched.

## Known limitations / needs Steuerberater confirmation

- All tax outputs are estimates; income tax depends on the private "other income" input; §35, Soli and
  church tax are approximated at the incremental level.
- The §11 ±10-day rule for recurring year-end payments is **flagged**, not auto-applied.
- Useful lives must come from the amtliche AfA-Tabellen; degressive AfA is not enabled.
- Rates verified via search snippets, not a direct primary fetch — confirm before filing.
- No ERiC/ELSTER transmission, bank/Stripe sync, OCR, payroll, or GmbH/corporate-tax logic in V1.
