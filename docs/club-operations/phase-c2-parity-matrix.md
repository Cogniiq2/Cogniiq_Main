# Club Operations — Phase C2 parity matrix

Authoritative inventory of the SV Heinersreuth (SVH) owner/admin dashboard, and the disposition of
each section in the Cogniiq Club Operations module.

- Reference repository (read-only): `SVHeinersreuth`, `main` @ `83824fe`, tree `bdda44c5fa4d942149061f3863b27a3ef64397d6`
- Target: `Cogniiq_Main`, `src/solutions/club-operations/`

Produced by reading the actual source, not from a prior summary. **No SVH file was modified.**

Secret *values* never appear here. Environment variables are named only.

---

## 1. Authoritative section list

The section list is defined by `NAV_ITEMS` in `src/pages/AdminControlCenter.tsx:29-42`. It contains
**exactly twelve** sections, in this order. This is the authoritative list — no section was invented
and none omitted.

| # | Nav label (German) | Section id | Reference description | Source file |
|---:|---|---|---|---|
| 1 | Dashboard | `dashboard` | KPIs & Überblick | `admin/DashboardSection.tsx` |
| 2 | Buchungen | `buchungen` | Alle Plätze & Zeiten | `admin/BuchungenSection.tsx` |
| 3 | Zahlungen | `zahlungen` | Stripe & PayPal | `admin/ZahlungenSection.tsx` |
| 4 | Gutscheine | `gutscheine` | Codes & Status | `admin/GutscheineSection.tsx` |
| 5 | Reports | `reports` | PDF & CSV Export | `admin/ReportsSection.tsx` |
| 6 | Monatsberichte | `monatsberichte` | Monatliche Finanzberichte | `admin/MonatsberichteSection.tsx` |
| 7 | Stripe Abgleich | `stripe_abgleich` | Zahlungen prüfen & Rechnungen | `admin/StripeAbgleichSection.tsx` |
| 8 | Rechnungen | `rechnungen` | Stripe Invoices | `admin/RechnungenSection.tsx` |
| 9 | Mitglieder | `mitglieder` | Verwaltung | `admin/MitgliederSection.tsx` |
| 10 | Alert Center | `alerts` | Probleme & Fehler | `admin/AlertCenterSection.tsx` |
| 11 | Aktivitätsprotokoll | `aktivitaetsprotokoll` | Admin Audit Log | `admin/AktivitaetsprotokollSection.tsx` |
| 12 | Einstellungen | `einstellungen` | Rollen & System | `admin/EinstellungenSection.tsx` |

### Admin surfaces outside the Control Center

Two further admin routes exist as standalone pages, resolved by a path switch in `src/App.tsx:62-64`:

| Route | Page | Disposition |
|---|---|---|
| `/admin/mitglieder` | `AdminMitgliederPage.tsx` (2418 LOC) | **Folded into Mitglieder.** Its read surface duplicates `MitgliederSection`; its distinctive parts are bulk CSV import and member CRUD, all writes. |
| `/admin/floodlights` | `AdminFloodlightsPage.tsx` (243 LOC) | **Deliberately excluded.** See §4. |

### Naming decision

Cogniiq labels section 1 **Übersicht** rather than *Dashboard*. Inside a Cogniiq solution the word
"Dashboard" already denotes the surrounding portal, so reusing it for a section within that portal
would be ambiguous. All other labels are carried over verbatim, including "Stripe Abgleich".

---

## 2. Section-by-section inventory

### 1. Dashboard → **Übersicht** — recreated (refined)

- **Purpose:** KPI overview across revenue, bookings, payments, VAT and court utilisation.
- **Displayed:** Umsatz group (Gesamtumsatz, Stripe, PayPal, Gutschein); Buchungen group (Gesamt,
  Bezahlt, Kostenlos, Ø Buchungswert); Zahlungen group (Erfolgreich, Ausstehend, Erstattet,
  Storniert); Umsatzsteuer group (MwSt. gesamt, Padel Mitgl. 7 %, Padel Nichtmitgl. 19 %, Ungeklärt);
  Rechnungen KPIs; court cards with utilisation bars; revenue-by-day bar chart.
- **Filters:** period presets — Heute, Diese Woche, Dieser Monat, Letzter Monat.
- **Views:** KPI cards, court cards, day chart.
- **States:** loading spinner, error text, zero-state via empty aggregates.
- **Writes:** none.
- **Dependencies:** `admin-bookings`, `admin-payments`, `admin-invoice-actions:list`, `VITE_ADMIN_SECRET`.
- **Disposition:** **Recreated.** Extended so its figures aggregate the full C2 fixture dataset,
  including invoice and reconciliation KPIs.

### 2. Buchungen — recreated (preserved from C1)

- **Purpose:** browse and filter every court booking.
- **Displayed:** reference, customer, court, date/time, status, provider, payment status, tax
  category, amount; detail with membership and floodlight request.
- **Filters:** search, period, status, court, tax category, provider.
- **Views:** table + detail panel.
- **Writes:** `admin-booking-tax-override` (tax category override).
- **Dependencies:** `admin-bookings`, `admin-booking-tax-override`, `VITE_ADMIN_SECRET`.
- **Disposition:** **Recreated read-only.** Tax override deferred to the write phase.

### 3. Zahlungen — recreated

- **Purpose:** payment ledger across Stripe, PayPal, voucher and free.
- **Displayed (`AdminPayment`):** `created_at`, `provider`, `status`, `amount_eur`,
  `reference_type` (Buchung/Gutschein), `reference_id`, `customer_email`, `metadata`,
  `stripe_session_id`. Table columns: Datum, Anbieter, Status, Betrag, Typ, E-Mail, Referenz/Grund.
- **KPIs:** Gesamtumsatz, Stripe, PayPal, Erstattungen (+count), Ausstehend (+count),
  Erfolgreiche Zahlungen, Doppelbuchungen, Kundenstornierungen.
- **Filters:** search (e-mail/reference), status, provider, reference type, plus two boolean
  facets — Doppelbuchungen and Kundenstornierungen — derived from a `MetaClass` classification of
  payment metadata (`double_booking | customer_cancelled | other`).
- **Views:** KPI grid, table, detail drawer with metadata, pagination.
- **Writes:** none. Copy-to-clipboard only.
- **Dependencies:** `admin-payments`, `VITE_ADMIN_SECRET`.
- **Disposition:** **Recreated read-only.** `customer_email` and `stripe_session_id` are **dropped**:
  neither is needed to read the operational picture, and omitting them keeps the fixtures free of
  contact data and payment identifiers. Reference linkage is kept via booking reference.

### 4. Gutscheine — recreated

- **Purpose:** voucher inventory and redemption state.
- **Displayed (`AdminGutschein`):** `code`, `value_eur`, `is_redeemed`, `redeemed_at`,
  `redeemed_by`, `buyer_name`, `buyer_email`, `buyer_message`, `sold_at`, `created_at`,
  `payment_provider`, `booking_id`. Columns: Code, Wert, Status, Käufer, Erstellt, Eingelöst, Buchung.
- **Filters:** search (code/e-mail/name), status (Offen, Verkauft, Eingelöst), value.
- **Views:** KPI cards, table, detail, pagination.
- **Writes:** create vouchers in bulk (`generateCode()` + direct `Gutschein` table insert), delete,
  update.
- **Dependencies:** direct browser access to the `Gutschein` table via the anon key.
- **Disposition:** **Recreated read-only.** Creation/deletion excluded. `buyer_email` dropped. The
  reference model is binary redeemed/not; Cogniiq models a **remaining balance** so partial
  redemption is representable, which the brief requires and which the reference cannot express.

### 5. Reports — rewritten

- **Purpose:** generate a period financial report, download as PDF or CSV.
- **Displayed:** date presets (Diese Woche, Dieser Monat, Letzter Monat) or custom range; KPI grid;
  court statistics; VAT breakdown; booking table preview.
- **Views:** report preview then two download buttons.
- **Writes:** none to business data, but `logAdminAction` writes `EXPORT_PDF` / `EXPORT_CSV` audit
  rows, and PDF generation runs client-side through `reportPdf.ts` (719 LOC, jsPDF).
- **Dependencies:** `admin-bookings`, `admin-payments`, `admin-payout-summary`, `VITE_ADMIN_SECRET`.
- **Disposition:** **Rewritten as an on-screen report preview.** The aggregation is pure and is
  reproduced against fixtures. PDF/CSV *download* is **excluded from C2**: it adds a heavyweight
  dependency for no review value, and the audit-log write that accompanies it in the reference is a
  mutation. The preview shows exactly the sections the PDF contains, so parity of *content* is kept.

### 6. Monatsberichte — recreated

- **Purpose:** persisted monthly financial reports.
- **Displayed (`MonthlyReport`):** `report_month`, `period_start/end`, `total_revenue`,
  `stripe_revenue`, `paypal_revenue`, `giftcard_revenue`, `refunded_amount`,
  `refunded_cancellation_amount`, `refunded_double_booking_amount`, `cancelled_count`,
  `booking_count`, `successful_count`, `pending_count`, `top_court`, `stripe_payout_total/count`,
  `paypal_receipts_total/count`, `payout_note`, `status`, `pdf_url`, `csv_url`.
- **Filters:** month selector over the past 14 months.
- **Writes:** `save`, `delete`, `GENERATE_MONTHLY_REPORT`; writes PDF/CSV to Storage.
- **Dependencies:** `admin-monthly-reports`, `admin-payout-summary`, `VITE_ADMIN_SECRET`, Storage.
- **Disposition:** **Recreated read-only.** Generation, saving, deletion and Storage URLs excluded.
  `pdf_url` / `csv_url` are dropped entirely — they are live Storage links. Month-over-month
  comparison added, which the reference lacks but the brief requires.

### 7. Stripe Abgleich — recreated

- **Purpose:** reconcile Stripe payments against bookings and surface discrepancies.
- **Displayed (`ReconciliationRow`):** `issue_type`, `severity`, customer, booking/payment linkage,
  `booking_amount`, `stripe_amount`, `refund_amount`, `money_to_recover`, statuses, court, provider,
  `suggested_action`, invoice linkage, plus live-Stripe enrichment fields.
- **Issue types:** `paid_no_booking`, `active_booking_refunded`, `amount_mismatch`,
  `double_booking`, `customer_cancellation`, `false_refund_likely`, `needs_review`, `matched`.
- **Severities:** `ok | info | warning | critical`.
- **KPIs:** Stripe Zahlungen, Abgleichene Buchungen, Offene Prüfungen, Fehlerhafte Rückerstattungen,
  Potenziell nachzufordern, Erstattet gesamt, Davon Stornierungen, Davon Doppelbuchungen.
- **Filters:** search by e-mail, issue type, severity.
- **Writes:** create Stripe invoice (draft/send), refresh, sync — all mutations against Stripe.
- **Dependencies:** `admin-stripe-reconciliation`, `admin-invoice-actions`, `admin-create-stripe-invoice`,
  **live Stripe API enrichment**, `VITE_ADMIN_SECRET`.
- **Disposition:** **Recreated read-only.** All invoice actions excluded. The `stripe_live_*`
  enrichment block is **excluded entirely** — it exists only to call Stripe, which C2 must not do.
  The eight issue types and four severities are reproduced faithfully as the classification model.

### 8. Rechnungen — recreated

- **Purpose:** Stripe invoice ledger.
- **Displayed (`Invoice`):** `stripe_invoice_id`, `invoice_number`, `customer_email`,
  `customer_name`, `amount_eur`, `reason`, `internal_note`, `status`, `sent_at`, `due_date`,
  `paid_at`, `voided_at`, booking/payment linkage, `currency`, plus `hosted_invoice_url`,
  `invoice_pdf`, `stripe_dashboard_url`, `stripe_customer_id`.
- **Statuses:** `draft` (Entwurf), `open` (Versendet / Offen), `paid` (Bezahlt), `void` (Storniert),
  `uncollectible` (Uneinbringlich).
- **KPIs:** Offene Rechnungen, Überfällig, Bezahlt, Entwürfe, Ausstehender Betrag,
  Dieser Monat eingezogen, Gesamt, Storniert.
- **Filters:** search (e-mail, invoice id, customer), status.
- **Writes:** `create_draft`, `create_and_send`, `send`, `refresh`, `sync`, `void`.
- **Dependencies:** `admin-invoice-actions`, `VITE_SUPABASE_URL`, `VITE_ADMIN_SECRET`.
- **Disposition:** **Recreated read-only.** All six actions excluded. The three URL fields and
  `stripe_customer_id` are **dropped** — they are live external links and provider identifiers.
  Net/VAT/gross is **added**: the reference stores only a gross `amount_eur`, and the brief requires
  the split, so it is derived from the booking's tax category.

### 9. Mitglieder — recreated

- **Purpose:** club membership register.
- **Displayed (`Member`):** `first_name`, `last_name`, `email` (array), `membership_number`,
  `membership_type`, `status`, `Eintritt` (join date), `created_at`.
- **Membership types:** `padel`, `tennis`, `combination`, `other` (Padel, Tennis, Kombination, Sonstige).
- **Filters:** search, membership type, status.
- **Writes:** insert, update, delete, and bulk CSV import in `AdminMitgliederPage`.
- **Dependencies:** direct browser access to the `SV Heinersreuth Mitglieder` table via the anon key.
- **Disposition:** **Recreated read-only.** All CRUD and bulk import excluded. E-mail addresses
  **dropped**. Membership is what drives the padel VAT rate, so the member record carries its VAT
  classification and a booking summary, making the link explicit — the reference leaves it implicit.

### 10. Alert Center — recreated

- **Purpose:** operational problem queue.
- **Displayed (`AdminAlert`):** `type`, `severity`, `title`, `message`, `customer_email`,
  `booking_id`, `payment_id`, `reference`, `court`, `amount`, `status`, `resolved`, `resolved_at`,
  `resolved_by`, `metadata`, `created_at`.
- **Severities:** `critical` (Kritisch), `high` (Hoch), `medium` (Mittel), `low` (Niedrig).
- **Statuses:** `open` (Offen), `in_progress` (In Bearbeitung), `resolved` (Gelöst), `ignored` (Ignoriert).
- **Filters:** search, status, severity, type, date range. Sort: unresolved first, then severity, then newest.
- **Writes:** update `admin_alerts` status/resolution directly from the browser.
- **Dependencies:** direct browser access to the `admin_alerts` table via the anon key.
- **Disposition:** **Recreated read-only.** Status mutation excluded. `customer_email` dropped.

### 11. Aktivitätsprotokoll — recreated

- **Purpose:** admin audit trail.
- **Displayed (`AuditEntry`):** `actor_email`, `actor_role`, `action`, `entity_type`, `entity_id`,
  `entity_label`, `old_value`, `new_value`, `metadata`, `ip_address`, `user_agent`, `created_at`.
  Columns: Zeitpunkt, Admin, Aktion, Objekt, Typ.
- **Actions:** `VIEW_REPORT`, `EXPORT_PDF`, `EXPORT_CSV`, `GENERATE_MONTHLY_REPORT`,
  `DELETE_MONTHLY_REPORT`, `CREATE_GUTSCHEIN`, `DELETE_GUTSCHEIN`, `UPDATE_GUTSCHEIN`,
  `VIEW_BOOKINGS`, `VIEW_PAYMENTS`, `SET_TAX_OVERRIDE`, `REMOVE_TAX_OVERRIDE`, `UNKNOWN`.
- **Filters:** actor e-mail search, action, entity type, date range.
- **Writes:** `admin-audit-log` `insert` (called from Buchungen, Monatsberichte, Reports).
- **Dependencies:** `admin-audit-log`, `VITE_ADMIN_SECRET`.
- **Disposition:** **Recreated read-only.** Insert excluded. `ip_address`, `user_agent` and
  `actor_email` are **dropped** — they are personal data with no read-only operational value here;
  an actor *role* is kept instead.

### 12. Einstellungen — recreated

- **Purpose:** role and permission reference. Already read-only in the reference system.
- **Displayed:** current role badge; a role × permission matrix over five roles
  (`superadmin`, `vorstand`, `finanzadmin`, `buchungsadmin`, `readonly`) and five permission groups
  (Dashboard & Berichte, Buchungen, Zahlungen, Mitglieder, Einstellungen).
- **Writes:** none. `CURRENT_ROLE` is a hardcoded constant with a TODO
  (`lib/adminRoles.ts:44`); the section itself persists nothing.
- **Disposition:** **Recreated read-only.** The permission vocabulary and grouping are kept as the
  model Cogniiq's server-side checks will eventually enforce. The hardcoded `superadmin` constant is
  **not** carried over. The section is explicitly labelled as fixture configuration.

---

## 3. Cross-cutting rewrites

| Concern | Reference | Cogniiq C2 |
|---|---|---|
| Money | Euro floats (`amount_eur`, `value_eur`, `total_revenue`) | **Integer cents** everywhere; converted at the adapter boundary |
| Dates | Mixed ISO/Date | ISO internally, de-DE only in presentation |
| Auth | Browser login gate + `sessionStorage` flag; `CURRENT_ROLE = 'superadmin'` | None in the module; the Cogniiq shell and a future server gateway own it |
| Data access | `x-admin-secret` fetch + direct anon-key table access | Typed async adapter, fixtures only |
| Styling | Dark slate, glows, grid backgrounds, framer-motion entrances | Cogniiq dashboard tokens and shared primitives |
| Pagination | Page offsets against the server | Client-side over fixtures; the query model carries paging so a gateway can push it down |
| Contact data | E-mails, names, IPs, user agents | Fictional names only; no e-mail, phone, IP or user agent anywhere |

---

## 4. Deliberately excluded

| Excluded | Reason |
|---|---|
| **`/admin/floodlights` page** | Its sole function is `floodlight-retry`, which actuates physical hardware. It is a write surface with no read-only content worth representing, and `floodlight-retry` carries no `ADMIN_SECRET` check in the reference. Belongs to the write phase. |
| **All 20+ write actions** | Tax override, invoice create/send/void/refresh/sync, monthly report save/delete/generate, voucher create/delete/update, member CRUD and bulk import, alert resolution, audit insert. Each needs its own server-side permission check, audit trail and tests. |
| **Live Stripe enrichment** (`stripe_live_*`) | Exists only to call the Stripe API. |
| **PDF/CSV download** | Heavy dependency, no review value in C2, and the reference pairs it with an audit-log write. Report *content* is reproduced on screen. |
| **Storage URLs** (`pdf_url`, `csv_url`, `hosted_invoice_url`, `invoice_pdf`, `stripe_dashboard_url`) | Live external links. |
| **Provider identifiers** (`stripe_session_id`, `stripe_payment_intent_id`, `stripe_customer_id`, `paypal_capture_id`) | Real payment identifiers; no read-only value here. |
| **Contact and tracking data** (`customer_email`, `buyer_email`, `phone_number`, `ip_address`, `user_agent`, `cancel_token`) | Personal data. Omitted by construction so the fixtures cannot contain it. |
| **Browser login gate** | `AdminControlCenter.tsx:56-57` compares against `VITE_MEMBERS_ADMIN_USERNAME` / `VITE_MEMBERS_ADMIN_PASSWORD`, both compiled into the public bundle, then sets a `sessionStorage` flag. Not carried over in any form. |
| **Admin theme toggle** | Cogniiq owns theming. |

---

## 5. Security findings recorded during this audit

Additional to the Phase A findings, and relevant to sequencing the cutover:

1. **The admin login gate is client-side with browser-embedded credentials.**
   `AdminControlCenter.tsx:56-57` reads `VITE_MEMBERS_ADMIN_USERNAME` and
   `VITE_MEMBERS_ADMIN_PASSWORD` — Vite compiles both into the public bundle — and on match writes
   `sessionStorage['members_admin_authenticated'] = 'true'`. Anyone can read the credentials from the
   bundle, or simply set the flag. This is **in addition to** the browser-exposed `VITE_ADMIN_SECRET`.
2. **Three tables are written directly from the browser** with the anon key: `Gutschein`,
   `SV Heinersreuth Mitglieder`, `admin_alerts`. Rotating `ADMIN_SECRET` does not affect this path;
   only RLS does.
3. Consequence unchanged: the legacy admin surface must be secured or retired, and the RLS on those
   three tables audited, **before** the real club account is invited.

---

## 6. Disposition summary

| Section | Disposition |
|---|---|
| Übersicht | Recreated (refined to aggregate the full C2 dataset) |
| Buchungen | Recreated (preserved from C1) |
| Zahlungen | Recreated read-only |
| Gutscheine | Recreated read-only (+ partial-balance model) |
| Reports | Rewritten as on-screen preview; download excluded |
| Monatsberichte | Recreated read-only (+ month-over-month comparison) |
| Stripe Abgleich | Recreated read-only (live Stripe enrichment excluded) |
| Rechnungen | Recreated read-only (+ net/VAT/gross split) |
| Mitglieder | Recreated read-only |
| Alert Center | Recreated read-only |
| Aktivitätsprotokoll | Recreated read-only |
| Einstellungen | Recreated read-only |
| `/admin/floodlights` | Deliberately excluded (write-only actuator) |

**Twelve of twelve** Control Center sections are implemented in Phase C2. One out-of-nav admin page
is excluded with cause.
