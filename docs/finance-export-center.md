# Finance Export Center & Document Rendering (V2 — Phase 1)

Branch: `claude/finance-automation-document-studio-v2-f8cxxd`

This document describes the **Universal Export Center** and the **deterministic document
rendering foundation** delivered in the first phase of the Finance Automation / Document Studio
V2 work. It is written to be accurate about what is implemented, tested and shipped — and honest
about what is deliberately **not** in this phase.

## Scope delivered

| Area | Status |
| --- | --- |
| Reusable `ExportMenu` component | ✅ Implemented, wired into Rechnungen, Ausgaben, Steuern |
| Hardened CSV (UTF‑8 BOM, semicolon, formula‑injection safe) | ✅ Implemented + tested |
| Real OOXML `.xlsx` (typed cells, frozen header, autofilter, multi‑sheet, metadata) | ✅ Implemented + tested |
| Deterministic selectable‑text PDF reports (branding, pagination, page numbers) | ✅ Implemented + tested |
| Deterministic source hashing (provenance) | ✅ Implemented + tested |
| Export audit into `owner_exports` (format, source hash, counts, filters) | ✅ Implemented |
| German number/date/currency formatting for exports & documents | ✅ Implemented + tested |
| Dynamic imports so XLSX/PDF stay out of the initial (and finance) bundle | ✅ Verified in build output |

The broader V2 program (offers, client portal, e‑signature, automation engine, reconciliation,
structured e‑invoice generation) is **not** part of this phase — see "Deliberately out of scope".

## Architecture

All export logic lives under `src/lib/ownerFinance/exports/`:

```
exports/
  format.ts        German de-DE number/date/currency/percent formatting (pure)
  columns.ts       Typed ExportColumn/ExportTable model + hardened CSV builder
  sourceHash.ts    Pure SHA-256 + canonical JSON → deterministic source hash
  zip.ts           Minimal STORE-method ZIP writer + CRC32 (for .xlsx)
  xlsx.ts          Real OOXML workbook generator (typed cells, styles, panes)
  pdf.ts           Real PDF 1.4 writer (Helvetica base fonts, tables, pagination)
  datasets.ts      Domain → export mappings (invoices, expenses)
  index.ts         Public API + dynamic-import wrappers + audit descriptor
```

Supporting pieces:

- `src/components/finance/ExportMenu.tsx` — reusable grouped export menu (format + scope + raw‑ID toggle).
- `src/lib/ownerFinance/financeExportRunner.ts` — builds the chosen format, downloads it, and records
  the `owner_exports` audit entry with a deterministic `source_hash`.

### The typed column model

A dataset is described **once** as an `ExportTable<Row>` with typed columns
(`text | number | currency | percent | date | integer`). The same table feeds both CSV and XLSX,
guaranteeing identical column order and value typing across formats. `currency` values are stored as
integer **cents** and `percent` as **basis points**; the writers convert at emit time.

### CSV specifics

- UTF‑8 with a leading BOM (`﻿`) so Microsoft Excel auto‑detects UTF‑8 (toggleable).
- Semicolon delimiter by default (German Excel). Comma is available via option.
- RFC‑style quoting: values containing the delimiter, a quote or a newline are quoted; embedded
  quotes are doubled.
- **Formula‑injection protection (OWASP "CSV Injection"):** any text cell beginning with
  `= + - @` or a tab/CR is prefixed with a single quote so spreadsheet apps treat it as text.
  Numeric/date cells are emitted as typed values and are never affected.
- Numbers use the German decimal comma; **dates in data columns are machine‑readable ISO**
  (`YYYY-MM-DD`), never localized display strings.
- Internal IDs are **excluded by default**; an advanced "Interne IDs einbeziehen (Rohexport)"
  toggle includes columns flagged `id`.

### XLSX specifics

`xlsx.ts` emits a real SpreadsheetML package (a ZIP of XML parts built by `zip.ts`), **not** a
renamed CSV. Verified properties (see tests):

- Correctly **typed** cells: currency/number/integer as numbers, dates as serial numbers with a
  `DD.MM.YYYY` number format, percentages stored as fractions with a `0.00%` format.
- Currency number format `#,##0.00 €`.
- **Frozen header row** (`pane state="frozen"`) and an **auto‑filter** over the data range.
- Sensible per‑column widths; bold, shaded header row.
- One or more domain sheets plus an optional **Metadaten** sheet (entity, period, filters,
  generated timestamp, record counts, disclaimer).
- Text cells are formula‑injection sanitized and XML‑escaped.
- Deterministic output (fixed archive timestamps) so a given dataset hashes identically.

The test harness **parses the generated ZIP back and recomputes every entry's CRC32**, then asserts
the typed‑cell XML — i.e. it proves the file is a structurally valid, correctly typed workbook.

Example workbook structures used today:

```
Rechnungen-YYYY-MM-DD.xlsx → [ Rechnungen ] [ Metadaten ]
Ausgaben-YYYY-MM-DD.xlsx   → [ Ausgaben ]   [ Metadaten ]
```

### PDF specifics

`pdf.ts` writes a real PDF 1.4 file with **selectable text** using the standard Helvetica /
Helvetica‑Bold base‑14 fonts (no embedding) and WinAnsi encoding (so `€` and umlauts render). It is
**not** a browser screenshot. Features:

- Branded header block (brand, document title, entity, period/filters/value‑basis meta lines).
- Automatic pagination with **repeatable table headers** and clean row striping.
- Footer with a disclaimer and **"Seite x von y"** page numbers.
- German amount/date formatting supplied by the caller.
- Deterministic byte‑exact output; the test validates the **xref offset table** points exactly at
  each object (guards the byte‑counting that a hand‑written PDF depends on).

Report models are composed of `keyvalue`, `table`, `paragraph` and `note` sections. Analytical
reports currently implemented: **Rechnungen‑Bericht**, **Ausgaben‑Bericht**, **Steuerübersicht**.
Transactional single‑document PDFs (branded invoice/offer) are **foundation‑ready** via the same
renderer but are part of a later phase (see below).

### Export audit

Every export records a row in `owner_exports` via `recordExportRun`, including `export_type`
(`<domain>:<format>`), period, `rules_version`, `record_counts`, a deterministic `source_hash`, and
`file_metadata` (format, mode, filters, value basis). Audit recording is best‑effort and never
blocks the user's download.

### Bundle impact

The heavy generators load via `import()` and build into their own chunks:

- `pdf-*.js` ≈ 6 kB (2.8 kB gzip)
- `xlsx-*.js` ≈ 9.5 kB (3.2 kB gzip, includes the ZIP writer)

The initial application bundle is unchanged. The lazy `FinanceModule` chunk grows ~20 kB (gzip) for
the export UI/model code, loaded only when the finance area is opened.

## Value labelling / legal wording

Exports and reports consistently carry the preparation disclaimer:

> Vorbereitung/Export – keine offizielle ELSTER‑Übermittlung, keine ERiC‑Validierung. Werte vor
> Abgabe prüfen.

Tax figures are labelled **Steuerschätzung**. No `rechtssicher`, `XRechnung‑konform`,
`ZUGFeRD‑konform`, `ELSTER‑fertig` or "qualifizierte elektronische Signatur" claims are made
anywhere in this phase.

## Tests

`node .github/scripts/test-finance-exports.mjs` (bundled with esbuild, no DB, no framework) covers:

- German formatting (decimal, currency, percent trimming, quantity, ISO/German dates).
- CSV: BOM, semicolon/comma, quoting, quote doubling, newline handling, formula‑injection
  neutralization, ISO dates in data, hidden‑vs‑raw IDs, `sanitizeTextCell` unit cases.
- Source hash: known SHA‑256 vectors, key‑order invariance, determinism, sensitivity to data.
- XLSX: full ZIP parse + **CRC32 recomputation** per entry, presence of all package parts, typed
  currency/percent/date cells, frozen pane, autofilter, number formats, sheet naming, exact date
  serial, formula‑injection sanitization on data and metadata sheets.
- PDF: header/EOF, catalog, Helvetica + WinAnsi, text‑show operators, page numbers, **multi‑page
  pagination**, and **xref offset integrity**.

Run alongside the existing suites:

```
npm run typecheck
npm run lint
npm run build
node .github/scripts/test-finance-exports.mjs
node .github/scripts/test-owner-finance-tax.mjs
node .github/scripts/test-auth-routing.mjs
```

## Deliberately out of scope for this phase

The V2 brief also specifies offers & acceptance, a public document portal, electronic signatures,
server‑side email delivery, an automation engine, payment import & reconciliation, recurring
invoices, and structured e‑invoice (XRechnung/ZUGFeRD) generation. Those require **new database
migrations, RPCs, RLS policies, Edge Functions and a public token endpoint** that cannot be
implemented and *verified* end‑to‑end without applying migrations and deploying functions — which
this task explicitly forbids. Rather than ship large volumes of unverifiable SQL/UI, this phase
delivers the export/document foundation those features build on (deterministic PDF/XLSX rendering,
source hashing, the typed data model, and the export‑audit pattern), fully tested. Follow‑up phases
should add the migrations and server functions in an environment where they can be applied and
tested against a database.

## Required infrastructure

Nothing new is required to run this phase:

- **Migration:** none added. The existing `owner_exports` table (from
  `20260722120000_owner_finance_cockpit.sql`) already carries `source_hash`, `file_metadata`,
  `record_counts` and `warnings`, which the audit now populates.
- **Edge Function / cron / email / signing provider / storage:** not used by this phase.
