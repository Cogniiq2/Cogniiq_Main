# Commercial Document Workflow — Offers, Acceptance & Invoice PDFs

Branch: `claude/finance-automation-document-studio-v2-f8cxxd`

Implements one coherent vertical on top of the existing Finance V2 / Export Center foundation:

```
Create offer → finalize (immutable version) → generate branded PDF → secure customer link
→ customer views & accepts/rejects → owner notified → convert accepted offer to invoice draft
→ owner reviews & issues → immutable branded invoice PDF
```

Everything server-authoritative lives in the database (RPCs + triggers). The DB layer is validated
against a **local** PostgreSQL by `supabase/tests/run_commercial_documents_smoke.sh` (41 assertions).
No production migration, Edge Function, or deployment is performed by this work.

## Migrations (additive; order matters)

| File | Adds |
| --- | --- |
| `20260723120000_owner_document_settings.sql` | `owner_document_settings` + upsert RPC |
| `20260723121000_owner_offers.sql` | `owner_offers`, `owner_offer_lines`, `owner_offer_versions`, `owner_offer_counters` + offer RPCs |
| `20260723122000_owner_commercial_documents.sql` | `owner_generated_documents`, `owner_document_access_tokens`, `owner_document_access_events`, `owner_offer_acceptance_events`, `owner_finance_notifications` + generated-doc/token/public RPCs |

The applied `20260722120000_owner_finance_cockpit.sql` is **not modified**. All three new migrations
are idempotent/convergent (verified by double-apply). Apply order is by timestamp, after the cockpit.

Run the full local suite (throwaway DB):

```bash
DATABASE_URL=postgresql://postgres@127.0.0.1:5432/yourtestdb \
  bash supabase/tests/run_commercial_documents_smoke.sh
```

## New tables

- **owner_document_settings** — business identity, tax + bank identifiers (owner-only), document
  defaults. Bank/tax fields are RLS-restricted to the owner and only rendered onto intended customer
  documents.
- **owner_offers / owner_offer_lines** — offer header + lines. Totals are trigger-computed; optional
  lines are excluded from totals.
- **owner_offer_versions** — immutable JSON snapshot + SHA-256 source hash per finalized version.
- **owner_offer_counters** — concurrency-safe per-entity offer numbering.
- **owner_generated_documents** — registry of generated PDFs; finalized rows are immutable and cannot
  be hard-deleted by any role (archive instead).
- **owner_document_access_tokens** — public access tokens; only the **SHA-256 hash** is stored.
- **owner_document_access_events** — view/download/accept audit (ip_hash only, never raw IP in the
  ordinary flow).
- **owner_offer_acceptance_events** — acceptance evidence bound to the exact document version + hash.
- **owner_finance_notifications** — owner attention items (offer viewed/accepted/rejected).

## New RPCs

Owner-only (SECURITY DEFINER, `is_platform_owner` gate, safe search_path, UUID idempotency):
`upsert_owner_document_settings`, `create_owner_offer`, `finalize_owner_offer`,
`create_owner_offer_revision`, `set_owner_offer_status`, `convert_owner_offer_to_invoice_draft`,
`register_owner_generated_document`, `create_offer_access_token`, `revoke_offer_access_token`.

Public (anon-callable, curated projection only): `public_offer_by_token`, `respond_offer_by_token`.
Internal helper (not granted to anon): `owner_verify_offer_token`.

## Offer lifecycle

`draft → finalized → sent → viewed → accepted → converted` (with `rejected` / `expired` / `cancelled`
branches). Finalization assigns the concurrency-safe number, freezes content + lines
(guard triggers), and snapshots an immutable version + source hash. Finalized offers are edited only
via **revision** (clones into a new draft). Acceptance is customer-driven through the token RPC.

## Invoice-document lifecycle

Draft invoices (including those converted from an accepted offer) can be previewed as PDF (with an
ENTWURF marker) but a **finalized** invoice PDF is blocked when required fields are missing
(`documentValidation`). Issuing uses the existing `issue_owner_invoice` (server numbering + immutability).
Generated PDFs are uploaded to the private bucket and registered as immutable `owner_generated_documents`.

## Document versioning & storage

`generateAndStoreDocument` renders deterministic bytes, uploads to a **randomized entity-prefixed**
private path (`{entity}/{kind}/v1-{random}.pdf`), then registers the row with `source_hash` +
`template_version`. **Upload compensation:** if the metadata RPC fails after a successful upload, the
orphaned object is removed. Downloads always use short-lived signed URLs — never a public path.
Finalized documents are immutable; re-generating creates a new version rather than overwriting.

## Public acceptance security

- Access is by **token only**; the raw offer id never grants access.
- Only the token's **SHA-256 hash** is stored; the raw token is returned to the owner exactly once.
- Tokens expire, can be revoked, and are offer-scoped. `owner_verify_offer_token` checks revoked
  **and** expired before anything else.
- The public projection excludes internal notes, customer ids, and storage paths.
- Anonymous roles have **no table grants** on any finance table — the only anon surface is the two
  `SECURITY DEFINER` RPCs.
- Acceptance is idempotent: a second accept on an already-accepted offer records nothing new.
- Evidence (`owner_offer_acceptance_events`) binds signer + decision to the exact document version and
  source hash, with an event order.

## Electronic-signature levels

The native flow is **Online-Annahme / einfache elektronische Signatur** only. `signatureProvider.ts`
defines a provider-neutral adapter (`ESignatureProvider`) and level model
(`electronic_acceptance`, `simple_electronic_signature`, `advanced_provider_signature`,
`qualified_provider_signature`) but **does not simulate** external signing. With no provider
configured, callers surface **"Externer Signaturdienst nicht konfiguriert"** — never a fake success.
Advanced/qualified levels are never claimed without an external trust-service provider.

## Structured e-invoice (XRechnung / ZUGFeRD) — experimental only

`structuredInvoice.ts` provides the abstraction + a source-completeness (EN 16931 core field
presence) check and a documented machine-readable intermediate representation. It is **feature-flagged
off by default**; generation `throw`s when disabled so no path can silently emit a fake "XRechnung".
The intermediate is always `status: not_certified` with an explicit disclaimer. **No EN 16931
conformance, no XRechnung/ZUGFeRD compliance is claimed.** Integrating a real validator + PDF/A-3 XML
embedding remains future work.

## What requires which infrastructure

| Capability | Requires |
| --- | --- |
| Offers, finalization, conversion, settings | the three migrations (local-tested; **not** applied to prod here) |
| Generated-PDF storage + signed download | the private `owner-finance-documents` bucket (already created by the cockpit migration) |
| Public portal view / accept / reject | the anon RPCs (in migration C) — no function needed |
| Rate-limited portal + signed PDF download for anon | the `public-document-portal` Edge Function (**source only, not deployed**) |
| Email delivery of offers/invoices | not in this task |
| External advanced/qualified signature | an external trust-service provider (adapter defined, not wired) |
| Certified XRechnung/ZUGFeRD output | a real EN 16931 validator (not integrated) |

## Rollback / recovery

- Migrations are additive; a rollback drops the new tables/functions (no changes to existing objects).
- Upload compensation prevents orphaned storage objects when metadata registration fails.
- Finalized documents/versions are immutable evidence — recovery is by creating a new version, never
  by editing history.

## Manual test checklist (desktop + mobile)

1. Create a CRM test customer. 2. Create an offer draft with multiple lines (incl. an optional one).
3. Save draft. 4. Finalize (number assigned). 5. Generate PDF → 6. Preview → 7. Download.
8. Create secure link. 9. Open `/d/:token` logged out. 10. Confirm no internal notes appear.
11. Accept (name + checkbox). 12. Verify owner notification (offer_accepted). 13. Convert to invoice
draft. 14. Open invoice detail. 15. Issue invoice. 16. Generate + download invoice PDF.
17. Confirm generated docs appear on the detail page. 18. Verify an admin/customer cannot reach any
finance route. 19. Verify direct nested-route refresh. 20. Verify mobile nav + no console errors.

## Legal / wording

No `rechtssicher`, `qualifizierte elektronische Signatur`, `XRechnung-konform`, `ZUGFeRD-konform`, or
`ELSTER-fertig` claims appear anywhere. Accurate labels used: **Online-Annahme**, **Einfache
elektronische Signatur**, **Externer Signaturdienst nicht konfiguriert**, **Strukturierte E-Rechnung:
experimentell / nicht validiert**. Filling document fields never asserts legal/tax completeness.
