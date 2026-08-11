# Club Operations — SVH admin dependency closure (Phase A)

Status: **analysis only**. Nothing in this document has been ported, connected or executed.

This records the exact set of files the SV Heinersreuth (SVH) owner/admin dashboard depends on, so
the port into Cogniiq's `club_operations` solution can be scoped precisely. It was produced by
reading the SVH repository without modifying it.

- Source repository (read-only): `SVHeinersreuth`, `main` @ `83824fe`, tree `bdda44c5fa4d942149061f3863b27a3ef64397d6`
- Target repository: `Cogniiq_Main`

**No SVH file, route, environment variable, database object, Edge Function or deployment was changed
to produce this document, and none may be changed by the PR that introduces it.**

Secret *values* are deliberately absent below. Environment variables are referred to by name only.

---

## 1. Dependency closure

### 1.1 Admin shell and pages

| File | LOC | Role |
| --- | ---: | --- |
| `src/pages/AdminControlCenter.tsx` | 421 | Shell; tab host for the 12 sections |
| `src/pages/AdminMitgliederPage.tsx` | 2418 | Standalone member administration (largest single file) |
| `src/pages/AdminFloodlightsPage.tsx` | 243 | Floodlight job list and retry |

### 1.2 Admin sections (`src/pages/admin/`, 8091 LOC total)

| File | LOC |
| --- | ---: |
| `AktivitaetsprotokollSection.tsx` | 473 |
| `AlertCenterSection.tsx` | 703 |
| `BuchungenSection.tsx` | 1154 |
| `DashboardSection.tsx` | 409 |
| `EinstellungenSection.tsx` | 181 |
| `GutscheineSection.tsx` | 836 |
| `MitgliederSection.tsx` | 468 |
| `MonatsberichteSection.tsx` | 654 |
| `RechnungenSection.tsx` | 776 |
| `ReportsSection.tsx` | 320 |
| `StripeAbgleichSection.tsx` | 1303 |
| `ZahlungenSection.tsx` | 814 |

### 1.3 Shared modules pulled in by the above

| File | LOC | Kind | Port disposition |
| --- | ---: | --- | --- |
| `src/lib/formatters.ts` | 147 | **Pure** — formatting only | Port near-verbatim |
| `src/lib/vatClassification.ts` | 287 | **Pure** — VAT/tax rules | Port near-verbatim; parity-critical |
| `src/lib/reportPdf.ts` | 719 | **Pure** — client-side PDF generation | Port near-verbatim |
| `src/lib/adminRoles.ts` | 69 | Permission vocabulary | Keep the vocabulary, discard the implementation (see §5) |
| `src/lib/adminThemeContext.ts` | 9 | Theme context | Replace with Cogniiq design tokens |
| `src/lib/adminAnalytics.ts` | 332 | **Impure** — builds admin URLs, attaches `x-admin-secret` | Rewrite against the adapter |
| `src/lib/auditLog.ts` | 30 | **Impure** — posts to `admin-audit-log` | Rewrite against the adapter |
| `src/lib/supabase.ts` | 6 | **Impure** — SVH browser client (hardcoded URL + anon key) | **Do not port** |
| `src/components/admin/AdminSelect.tsx` | 109 | Presentational | Replace with Cogniiq's `PremiumSelect` |
| `src/components/ui/button.tsx` | 44 | Presentational | Replace with Cogniiq's button |

The four files marked *pure* (`formatters`, `vatClassification`, `reportPdf`, plus the constant
tables in `adminRoles`) perform no I/O, read no environment variable and hold no credential. They are
the only files that can move without rewriting.

### 1.4 Explicit confirmation — no public SVH component is required

Every import in every file listed in §1.1 and §1.2 was enumerated. The complete set of non-`react`,
non-`framer-motion`, non-`lucide-react` imports is exactly the ten modules in §1.3.

**No admin file imports any public-site module.** Specifically, none of these are reachable from the
admin closure:

`components/Header.tsx`, `components/Footer.tsx`, `components/BookingTable.tsx`,
`components/CourtOverview.tsx`, `components/PaymentMethodModal.tsx`, `components/GutscheinKaufen.tsx`,
`components/GutscheinInput.tsx`, `components/ContactForm.tsx`, `components/MembershipContactForm.tsx`,
`components/CancelBookingButton.tsx`, `components/BookingResultView.tsx`,
`components/TimeRangePicker.tsx`, `components/MobileNavWrapper.tsx`, `components/SVHLogo.tsx`,
`src/payments/**`, `src/config/**`, and the public-only libraries `gcal.ts`, `getMembership.ts`,
`getMembershipClient.ts`, `gutschein.ts`, `buildBookingPayload.ts`, `readBookingForm.ts`,
`normalizeBookingResult.ts`, `courts.ts`, `calshim.ts`, `timeUtils.ts`, `floodlightClient.ts`,
`supabaseServer.ts`, `supabaseBrowser.ts`.

The single boundary crossing is `src/components/ui/button.tsx`, a generic 44-line presentational
component shared with the public site and replaced by a Cogniiq equivalent during the port.

**Consequence:** the port carries no booking, checkout, voucher-purchase, cancellation or membership
logic with it. Public behavior cannot be affected by porting the admin UI.

This property should become a CI rule in Cogniiq once the port begins, so it cannot silently regress.

---

## 2. Read vs. write, per section

"Write" means the operation mutates SVH production state or triggers an external side effect.

### 2.1 Read-only sections

| Section | Data source |
| --- | --- |
| `DashboardSection` | `admin-bookings`, `admin-payments` (via `adminAnalytics`), `admin-invoice-actions` action `list` |
| `ZahlungenSection` | `admin-payments` |
| `ReportsSection` | `adminAnalytics` aggregates; PDF rendered client-side, nothing persisted |
| `EinstellungenSection` | Local only — reads the `adminRoles` constants, persists nothing |

### 2.2 Mixed read/write sections

| Section | Reads | Writes |
| --- | --- | --- |
| `BuchungenSection` | `admin-bookings` | `admin-booking-tax-override` |
| `RechnungenSection` | `admin-invoice-actions` `list` | `admin-invoice-actions` `create_draft`, `create_and_send`, `send`, `refresh`, `sync`, `void` |
| `StripeAbgleichSection` | `admin-stripe-reconciliation` | `admin-invoice-actions` (same action set) |
| `MonatsberichteSection` | `admin-payout-summary` | `admin-monthly-reports` `save`, `delete` |
| `AktivitaetsprotokollSection` | `admin-audit-log` `list` | `admin-audit-log` `insert` (via `lib/auditLog.ts`, called from Buchungen, Monatsberichte and Reports) |
| `GutscheineSection` | direct table read | direct table insert |
| `MitgliederSection` | direct table read | direct table insert / update / delete |
| `AdminMitgliederPage` | direct table read + `admin-bookings`, `admin-payments` | direct table insert / update / delete, incl. bulk import |
| `AlertCenterSection` | direct table read | direct table update |
| `AdminFloodlightsPage` | — | `floodlight-retry` |

### 2.3 Externally visible writes

These have effects outside the SVH database and are the highest-risk operations in the whole port:

- `admin-invoice-actions` `send` / `create_and_send` — sends a real invoice email to a real customer.
- `admin-invoice-actions` `void` — irreversible Stripe invoice state change.
- `floodlight-retry` — actuates physical floodlight hardware.

---

## 3. Existing Edge Functions

### 3.1 Admin functions — candidates for replacement by the future gateway (9)

All nine authenticate by comparing a request header against the `ADMIN_SECRET` environment variable,
and all except `admin-payout-summary` then use the SVH service-role key.

| Function | LOC | Actions | Class |
| --- | ---: | --- | --- |
| `admin-bookings` | 377 | list/filter bookings | read |
| `admin-payments` | 160 | list/filter payments | read |
| `admin-payout-summary` | 295 | payout aggregation | read |
| `admin-stripe-reconciliation` | 649 | reconciliation view | read |
| `admin-audit-log` | 97 | `list`, `insert` | read + write |
| `admin-monthly-reports` | 261 | `list`, `save`, `delete` | read + write |
| `admin-booking-tax-override` | 121 | tax override | write |
| `admin-create-stripe-invoice` | 184 | invoice creation | write |
| `admin-invoice-actions` | 635 | `list`, `create_draft`, `create_and_send`, `send`, `refresh`, `sync`, `void` | read + write |

These remain deployed and untouched during the port so the existing dashboard stays available as a
rollback reference.

### 3.2 Public functions — must remain completely untouched (7)

None of these is called by any file in the admin closure. They carry the public revenue path.

| Function | Why it must not be touched |
| --- | --- |
| `stripe-webhook` | Payment settlement; signature-verified |
| `create-stripe-checkout-session` | Card checkout entry point |
| `get-payment-status` | Post-payment status polling |
| `reserve-gutschein` | Voucher reservation during purchase |
| `floodlight-register` | Booking-triggered floodlight scheduling |
| `floodlight-cancel` | Cancellation-triggered floodlight teardown |
| `floodlight-update` | Booking-change floodlight rescheduling |

### 3.3 `floodlight-retry` — a category of its own

`floodlight-retry` is consumed only by `AdminFloodlightsPage`, but unlike the nine admin functions it
performs **no `ADMIN_SECRET` check**. It sits in the floodlight family alongside the three public
functions and may also be invoked by n8n automations.

It must therefore be treated separately from both groups, and its callability analysed against the
n8n automation surface before any change. This PR changes nothing about it.

---

## 4. Direct-table access from the browser

Three tables are read **and written** straight from the browser using the SVH anon key, bypassing
Edge Functions entirely:

| Table | Accessed from | Operations |
| --- | --- | --- |
| `SV Heinersreuth Mitglieder` | `MitgliederSection.tsx`, `AdminMitgliederPage.tsx` | select, insert, update, delete, bulk insert |
| `Gutschein` | `GutscheineSection.tsx` | select, insert |
| `admin_alerts` | `AlertCenterSection.tsx` | select, update |

The only control on this path is row-level security on those three tables. **Their current RLS
policies must be audited before the real SVH account is invited.** This exposure is independent of
`ADMIN_SECRET`: securing or retiring the admin Edge Functions does not affect it, and no secret
rotation closes it.

---

## 5. Current authentication posture (why the port is worth doing)

Three findings, recorded because they determine the sequencing of later phases:

1. **The admin routes have no authentication gate.** `src/App.tsx` resolves `/admin`,
   `/admin/center`, `/admin/mitglieder` and `/admin/floodlights` through a plain path switch with no
   guard of any kind.
2. **The admin credential ships to the browser.** The admin sections read `VITE_ADMIN_SECRET`, which
   Vite compiles into the public bundle, and send it as a request header. A browser-exposed shared
   secret is not an acceptable long-term gateway credential under any circumstances, and the future
   Cogniiq gateway must not be designed around one.
3. **The role model is decorative.** `src/lib/adminRoles.ts:44` hardcodes
   `CURRENT_ROLE = 'superadmin'` with a TODO. The permission *vocabulary* it defines
   (`view:bookings`, `view:payments`, `manage:members`, `export:reports`, …) is sound and worth
   reusing; the resolution mechanism is not, and must be replaced by a server-side check against
   Cogniiq's database.

**Sequencing consequence:** the exposed legacy admin functions must be secured or retired, and the
direct-table RLS in §4 audited, **before** `info@svheinersreuth-padel.de` is invited to a Cogniiq
organization.

No evidence of an SVH service-role key leak was found — it appears only in Edge Function server
environments, never in client code. Rotating it is therefore **not** proposed. If later evidence
shows it leaked, that decision should be revisited on its own merits.

---

## 6. Authorization model for later phases

Recorded here so the port is built against it from the start.

Every future privileged operation must be authorized **server-side, from the database, on every
request**. Hiding navigation and guarding frontend routes is a usability measure, never the security
boundary.

The chain, in order, each step independently verified:

1. A valid Cogniiq Supabase JWT identifies the user.
2. The user holds an **active** membership in the target organization.
3. That organization has a `club_operations` solution instance whose
   **`status = 'active'`**. `provisioning`, `paused` and `disabled` must all **deny** access.
4. The user holds the specific permission the requested operation requires.
5. Only then may the server touch any SVH credential.

Cogniiq already provides the primitives for steps 2–3: `public.is_organization_member(uuid)` and the
RLS policies on `organization_solutions`
(`supabase/migrations/20260721120000_product_aware_client_platform.sql:325`).

### Configuration rules

- Per-user permissions must **not** be modelled inside arbitrary solution-config JSON. They belong in
  a typed, server-owned structure with its own constraints and its own audit trail.
- `organization_solutions.config` is browser-readable through RLS. It may eventually contain, at
  most, a **non-secret, server-recognized connection alias** — an opaque label the server resolves to
  real connection details out of its own environment.
- It must **never** contain a Supabase URL, service-role key, admin secret, or any unrestricted
  target identifier.

### Known gap to close before Phase D

`src/pages/app/SolutionPage.tsx` currently denies only on `status === 'disabled'` and renders content
for `paused`. That is the existing behavior for existing customer solutions and is **not** changed by
this PR. Before Club Operations carries real data, the server-side gate must enforce
`status = 'active'` strictly, and the frontend gate should be aligned in a separate, deliberate
change that is assessed against the existing solutions it would affect.

---

## 7. What the accompanying PR actually does

Inert scaffolding only:

- `club_operations` added to `solutionCatalogKeys` and `implementationKeys`.
- Registered in the closed frontend registry, mapped to the existing **unavailable** fallback.
- One additive migration inserting the catalog row with **`is_active = false`**.
- This document, plus tests asserting the inertness properties.

It ports no UI, builds no gateway, opens no connection to SVH, activates no catalog entry, provisions
no organization and invites nobody. `organization_solutions_implementation_key_check` is left
unwidened, so the database still rejects `implementation_key = 'club_operations'` outright.
