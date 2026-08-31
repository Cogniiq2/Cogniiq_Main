// Parse + validate the pasted EXPENSE bulk-import JSON, and build the preview the owner confirms.
//
// This is the Ausgaben half of the Schnellimport, and it is deliberately NOT
// bulkImport.ts with the nouns swapped. An expense is not an invoice with the sign
// flipped: its counterparty is a VENDOR rather than a customer, its VAT vocabulary is a
// different enum with different arithmetic, its date field is `invoice_date` (the
// supplier's), and its payments are outflows. Reusing the invoice parser is exactly how
// the reported defect happened — expense rows went through invoice semantics and came back
// as "Kunde „OpenAI Ireland Limited" wurde nicht gefunden" and
// "Zahlungen (23.00) übersteigen den Rechnungsbetrag (19.33)".
//
// Nothing here writes. Parsing and validation are pure; the owner sees totals, the vendors
// that would be created and every problem FIRST, and only a separate explicit confirmation
// runs the atomic server import.

import { computeExpenseLine, eligibleInputVat, type ExpenseVatTreatment } from '@/lib/ownerFinance/tax';
import { looksLikeSql, type RowIssue } from '@/lib/ownerFinance/bulkImport';

/**
 * The expense contract rides on the SAME schema_version as the invoice contract.
 *
 * `expenses` is an additive, optional top-level key: every payload that was valid before it
 * existed is still valid and still imports identically. Bumping the version would only have
 * forced owners to edit working invoice files for no semantic gain.
 */
export const EXPENSE_IMPORT_SCHEMA_VERSION = 1;
/** Mirrors the server-side bound so the preview can refuse early with a clear message. */
export const BULK_IMPORT_MAX_EXPENSES = 100;

/** The canonical expense-category key used when a row does not name one. */
export const REVIEW_REQUIRED_CATEGORY_KEY = 'review_required';

/**
 * The expense VAT vocabulary, straight from the owner_expense_lines CHECK constraint.
 * It shares not a single member with the invoice vocabulary ('standard' / 'reduced' /
 * 'reverse_charge'), which is why an invoice-shaped payload cannot silently pass here.
 */
export const EXPENSE_VAT_TREATMENTS: ExpenseVatTreatment[] = [
  'domestic_standard', 'domestic_reduced', 'no_vat', 'exempt',
  'outside_scope', 'reverse_charge_13b', 'intra_community', 'unknown',
];

export interface BulkExpenseVendorInput {
  /** Explicit id wins outright — no name matching is attempted for a row that has one. */
  vendor_id?: string | null;
  name?: string | null;
  country_code?: string | null;
  vat_id?: string | null;
}

export interface BulkExpenseLineInput {
  description: string;
  net_cents: number;
  vat_rate_bp?: number;
  vat_treatment?: ExpenseVatTreatment;
  /** Stable key from owner_expense_categories. Preferred over an id the client cannot know. */
  category_key?: string | null;
  input_vat_eligibility_bp?: number;
  deductibility_bp?: number;
  asset_candidate?: boolean;
  sort_order?: number;
}

export interface BulkExpensePaymentInput {
  payment_date: string;
  amount_cents: number;
  method?: string | null;
  reference?: string | null;
  note?: string | null;
}

export interface BulkExpenseInput {
  client_import_id: string;
  vendor: BulkExpenseVendorInput;
  supplier_invoice_number?: string | null;
  /** The SUPPLIER's document date. Deliberately not `issue_date`: we do not issue this. */
  invoice_date: string;
  service_date?: string | null;
  due_date?: string | null;
  currency?: string;
  notes?: string | null;
  category_key?: string | null;
  lines: BulkExpenseLineInput[];
  payments?: BulkExpensePaymentInput[];
}

export interface ExpenseImportPayload {
  schema_version: number;
  business_entity_id?: string;
  source?: string | null;
  expenses: BulkExpenseInput[];
}

/** A supplier the import would CREATE. Surfaced before anything is written, never after. */
export interface VendorToCreate {
  name: string;
  country_code: string | null;
  vat_id: string | null;
  rows: string[];
}

export interface ExpenseImportPreview {
  ok: boolean;
  errors: RowIssue[];
  warnings: RowIssue[];
  expenseCount: number;
  paymentCount: number;
  netCents: number;
  /** Total VAT charged/self-assessed on the lines. */
  vatCents: number;
  /** Vorsteuer: the eligible portion only (UStG §15 is never inferred from the rate). */
  inputVatCents: number;
  /** Supplier gross — excludes self-assessed §13b / intra-community VAT, per the canonical model. */
  grossCents: number;
  paidCents: number;
  /** Vendor names still needing server-side resolution before import. */
  unresolvedVendorNames: string[];
  /** Vendors the import would create, once resolution has run. */
  vendorsToCreate: VendorToCreate[];
  payload: ExpenseImportPayload | null;
}

const isIsoDate = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);
const isUuid = (v: unknown): v is string =>
  typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const isTreatment = (v: unknown): v is ExpenseVatTreatment =>
  typeof v === 'string' && (EXPENSE_VAT_TREATMENTS as string[]).includes(v);
const inBp = (v: unknown): v is number => isInt(v) && v >= 0 && v <= 10000;

/** Normalisation used for vendor name matching. Must agree with the server's lower(trim(...)). */
export const normalizeVendorName = (name: string): string => name.trim().toLowerCase();

const emptyPreview: ExpenseImportPreview = {
  ok: false, errors: [], warnings: [], expenseCount: 0, paymentCount: 0,
  netCents: 0, vatCents: 0, inputVatCents: 0, grossCents: 0, paidCents: 0,
  unresolvedVendorNames: [], vendorsToCreate: [], payload: null,
};

const money = (cents: number) => (cents / 100).toFixed(2);

/**
 * Parse and validate pasted text into an expense preview.
 *
 * `categoryKeys`, when supplied, is the live set of owner_expense_categories keys. A row
 * naming a key that is not in it fails HERE rather than after a write attempt. When the set
 * is not supplied (categories still loading) key validation is deferred to the server, which
 * is authoritative either way.
 *
 * Totals shown are a PREVIEW computed with the canonical `computeExpenseLine`. They are
 * never sent: the server recomputes net/VAT/gross/Vorsteuer from the lines and ignores any
 * total a client might supply.
 */
export function parseExpenseBulkImport(
  raw: string,
  entityId: string,
  categoryKeys?: string[],
): ExpenseImportPreview {
  if (!raw.trim()) return { ...emptyPreview, errors: [{ row: '—', message: 'Bitte JSON einfügen.' }] };
  if (looksLikeSql(raw)) {
    return { ...emptyPreview, errors: [{ row: '—', message: 'Dieses Feld akzeptiert ausschließlich JSON. SQL wird nicht ausgeführt.' }] };
  }

  let parsed: unknown;
  try { parsed = JSON.parse(raw); }
  catch (e) { return { ...emptyPreview, errors: [{ row: '—', message: `Ungültiges JSON: ${e instanceof Error ? e.message : String(e)}` }] }; }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ...emptyPreview, errors: [{ row: '—', message: 'Die oberste Ebene muss ein JSON-Objekt sein.' }] };
  }

  const doc = parsed as Record<string, unknown>;
  const errors: RowIssue[] = [];
  const warnings: RowIssue[] = [];
  const knownKeys = categoryKeys && categoryKeys.length > 0 ? new Set(categoryKeys) : null;

  if (doc.schema_version !== EXPENSE_IMPORT_SCHEMA_VERSION) {
    errors.push({ row: '—', message: `schema_version muss ${EXPENSE_IMPORT_SCHEMA_VERSION} sein.` });
  }

  // Revenue rows in the Ausgaben importer are a paste into the wrong dialog, not a
  // silent no-op. Dropping them without a word is how bookkeeping goes missing.
  for (const foreign of ['invoices', 'recurring_contracts', 'offers'] as const) {
    if (Array.isArray(doc[foreign]) && (doc[foreign] as unknown[]).length > 0) {
      errors.push({ row: '—', message: `„${foreign}" gehört nicht in den Ausgaben-Schnellimport — bitte den Einnahmen-Import verwenden.` });
    }
  }

  const rows = Array.isArray(doc.expenses) ? (doc.expenses as unknown[]) : [];
  if (rows.length === 0) errors.push({ row: '—', message: 'Keine Ausgaben enthalten („expenses" fehlt oder ist leer).' });
  if (rows.length > BULK_IMPORT_MAX_EXPENSES) {
    errors.push({ row: '—', message: `Maximal ${BULK_IMPORT_MAX_EXPENSES} Ausgaben pro Import.` });
  }

  const seen = new Set<string>();
  const unresolvedVendors = new Map<string, string>();
  const out: BulkExpenseInput[] = [];
  let netCents = 0, vatCents = 0, inputVatCents = 0, grossCents = 0, paidCents = 0, paymentCount = 0;

  rows.forEach((entry, idx) => {
    const e = (entry ?? {}) as Record<string, unknown>;
    const row = typeof e.client_import_id === 'string' && e.client_import_id.trim()
      ? e.client_import_id.trim() : `Ausgabe ${idx + 1}`;

    if (typeof e.client_import_id !== 'string' || !e.client_import_id.trim()) {
      errors.push({ row, message: 'client_import_id fehlt (wird für den Duplikatschutz benötigt)' });
    } else if (seen.has(row)) {
      errors.push({ row, message: 'client_import_id kommt mehrfach vor' });
    } else { seen.add(row); }

    // An expense carries the SUPPLIER's document date. Requiring an invoice's issue_date
    // here was the direct cause of "issue_date fehlt oder ist kein JJJJ-MM-TT".
    if (!isIsoDate(e.invoice_date)) {
      errors.push({ row, message: 'invoice_date fehlt oder ist kein JJJJ-MM-TT' });
    }
    if ('issue_date' in e && !('invoice_date' in e)) {
      errors.push({ row, message: '„issue_date" ist ein Rechnungsfeld — eine Ausgabe verwendet „invoice_date"' });
    }
    if (e.service_date !== undefined && e.service_date !== null && !isIsoDate(e.service_date)) {
      errors.push({ row, message: 'service_date ist kein JJJJ-MM-TT' });
    }
    if (e.due_date !== undefined && e.due_date !== null && !isIsoDate(e.due_date)) {
      errors.push({ row, message: 'due_date ist kein JJJJ-MM-TT' });
    }

    // ---- vendor (never a customer) ----------------------------------------
    if ('customer' in e) {
      errors.push({ row, message: '„customer" gibt es bei Ausgaben nicht — Lieferanten gehören unter „vendor"' });
    }
    const vendorRaw = (e.vendor ?? {}) as Record<string, unknown>;
    const vendorId = typeof vendorRaw.vendor_id === 'string' && vendorRaw.vendor_id.trim() ? vendorRaw.vendor_id.trim() : null;
    const vendorName = typeof vendorRaw.name === 'string' ? vendorRaw.name.trim() : '';
    const countryCode = typeof vendorRaw.country_code === 'string' && vendorRaw.country_code.trim()
      ? vendorRaw.country_code.trim().toUpperCase() : null;
    const vatId = typeof vendorRaw.vat_id === 'string' && vendorRaw.vat_id.trim() ? vendorRaw.vat_id.trim() : null;

    if (vendorId && !isUuid(vendorId)) {
      errors.push({ row, message: 'vendor.vendor_id ist keine gültige UUID' });
    }
    if (!vendorId && !vendorName) {
      errors.push({ row, message: 'vendor.vendor_id oder vendor.name ist erforderlich' });
    }
    if (countryCode && !/^[A-Z]{2}$/.test(countryCode)) {
      errors.push({ row, message: 'vendor.country_code muss ein ISO-Ländercode aus zwei Buchstaben sein (z. B. „IE")' });
    }
    if (!vendorId && vendorName) unresolvedVendors.set(normalizeVendorName(vendorName), vendorName);

    // ---- category ---------------------------------------------------------
    if ('category_id' in e || (Array.isArray(e.lines) && (e.lines as unknown[]).some((l) => l && typeof l === 'object' && 'category_id' in (l as object)))) {
      errors.push({ row, message: 'Datenbank-IDs für Kategorien werden nicht akzeptiert — bitte „category_key" verwenden' });
    }
    let categoryKey = typeof e.category_key === 'string' && e.category_key.trim() ? e.category_key.trim() : null;
    if (categoryKey && knownKeys && !knownKeys.has(categoryKey)) {
      errors.push({ row, message: `Unbekannte Kategorie „${categoryKey}"` });
    }

    // ---- lines ------------------------------------------------------------
    const rawLines = Array.isArray(e.lines) ? (e.lines as unknown[]) : [];
    if (rawLines.length === 0) errors.push({ row, message: 'mindestens eine Position ist erforderlich' });

    const lines: BulkExpenseLineInput[] = [];
    let rowNet = 0, rowVat = 0, rowInputVat = 0, rowGross = 0;
    let rowHasNegative = false;
    let rowHasCategory = Boolean(categoryKey);

    rawLines.forEach((l, i) => {
      const line = (l ?? {}) as Record<string, unknown>;
      const label = `Position ${i + 1}`;
      if (typeof line.description !== 'string' || !line.description.trim()) {
        errors.push({ row, message: `${label}: Beschreibung fehlt` });
      }
      if (!isInt(line.net_cents)) {
        errors.push({ row, message: `${label}: net_cents muss eine ganze Zahl in Cent sein` });
      } else if ((line.net_cents as number) < 0) {
        rowHasNegative = true;
      }

      const treatment: ExpenseVatTreatment = isTreatment(line.vat_treatment) ? line.vat_treatment : 'domestic_standard';
      if (line.vat_treatment !== undefined && line.vat_treatment !== null && !isTreatment(line.vat_treatment)) {
        errors.push({
          row,
          message: `${label}: unbekannte USt-Behandlung „${String(line.vat_treatment)}" — erlaubt sind ${EXPENSE_VAT_TREATMENTS.join(', ')}`,
        });
      }
      const rateBp = line.vat_rate_bp === undefined || line.vat_rate_bp === null
        ? (treatment === 'domestic_reduced' ? 700 : 1900)
        : (inBp(line.vat_rate_bp) ? line.vat_rate_bp : -1);
      if (rateBp < 0) errors.push({ row, message: `${label}: vat_rate_bp muss zwischen 0 und 10000 liegen` });

      const eligibility = line.input_vat_eligibility_bp === undefined || line.input_vat_eligibility_bp === null
        ? 10000 : (inBp(line.input_vat_eligibility_bp) ? line.input_vat_eligibility_bp : -1);
      if (eligibility < 0) errors.push({ row, message: `${label}: input_vat_eligibility_bp muss zwischen 0 und 10000 liegen` });
      const deductibility = line.deductibility_bp === undefined || line.deductibility_bp === null
        ? 10000 : (inBp(line.deductibility_bp) ? line.deductibility_bp : -1);
      if (deductibility < 0) errors.push({ row, message: `${label}: deductibility_bp muss zwischen 0 und 10000 liegen` });

      const lineKey = typeof line.category_key === 'string' && line.category_key.trim() ? line.category_key.trim() : null;
      if (lineKey && knownKeys && !knownKeys.has(lineKey)) {
        errors.push({ row, message: `${label}: unbekannte Kategorie „${lineKey}"` });
      }
      if (lineKey) rowHasCategory = true;

      // THE canonical expense arithmetic — the same function the Ausgaben composer uses and
      // an exact mirror of owner_recalc_expense_line(). 1933 net @ 1900bp domestic_standard
      // yields 367 VAT and a 2300 gross; the invoice parser produced 1933 and refused the
      // real 23,00 € payment.
      const net = isInt(line.net_cents) ? line.net_cents : 0;
      const { vatCents: lineVat, grossCents: lineGross } = computeExpenseLine(
        net, rateBp < 0 ? 0 : rateBp, treatment,
      );
      rowNet += net;
      rowVat += lineVat;
      rowGross += lineGross;
      rowInputVat += eligibleInputVat(lineVat, eligibility < 0 ? 0 : eligibility);

      lines.push({
        description: String(line.description ?? ''),
        net_cents: net,
        vat_rate_bp: rateBp < 0 ? 0 : rateBp,
        vat_treatment: treatment,
        category_key: lineKey,
        input_vat_eligibility_bp: eligibility < 0 ? 0 : eligibility,
        deductibility_bp: deductibility < 0 ? 0 : deductibility,
        asset_candidate: line.asset_candidate === true,
        sort_order: isInt(line.sort_order) ? line.sort_order : i,
      });
    });

    // ---- supplier credits / negative expenses -----------------------------
    //
    // AUDITED: the canonical model has no representation for one. owner_expenses.payment_status
    // has no 'credited' state, owner_payments.amount_cents is CHECK (> 0) and an expense-linked
    // payment must be an outflow, so a refund cannot be recorded at all; a negative gross can
    // never reach 'paid' because the status rule requires gross_total_cents > 0. Importing such
    // a row would quietly reduce Vorsteuer with nothing to audit it against. Neither abs() nor
    // inventing a booking type belongs in this PR, so the row is refused precisely.
    if (rowHasNegative || rowGross < 0) {
      errors.push({
        row,
        message: 'Lieferantengutschrift / negative Ausgabe benötigt eine gesonderte Buchungsart und wurde nicht importiert.',
      });
    }

    if (!rowHasCategory) {
      categoryKey = REVIEW_REQUIRED_CATEGORY_KEY;
      warnings.push({ row, message: `Keine Kategorie angegeben — wird als „${REVIEW_REQUIRED_CATEGORY_KEY}" zur Prüfung erfasst` });
    }

    // ---- payments ---------------------------------------------------------
    const rawPayments = Array.isArray(e.payments) ? (e.payments as unknown[]) : [];
    const payments: BulkExpensePaymentInput[] = [];
    let rowPaid = 0;
    rawPayments.forEach((p, pi) => {
      const pay = (p ?? {}) as Record<string, unknown>;
      const label = `Zahlung ${pi + 1}`;
      if (!isIsoDate(pay.payment_date)) errors.push({ row, message: `${label}: payment_date fehlt oder ist kein JJJJ-MM-TT` });
      if (!isInt(pay.amount_cents) || (pay.amount_cents as number) <= 0) {
        errors.push({ row, message: `${label}: amount_cents muss eine positive ganze Zahl sein` });
      } else { rowPaid += pay.amount_cents as number; }
      if ('payment_kind' in pay) {
        warnings.push({ row, message: `${label}: „payment_kind" gibt es bei Ausgaben nicht und wird ignoriert` });
      }
      payments.push({
        payment_date: String(pay.payment_date ?? ''),
        amount_cents: isInt(pay.amount_cents) ? pay.amount_cents : 0,
        method: typeof pay.method === 'string' ? pay.method : null,
        reference: typeof pay.reference === 'string' ? pay.reference : null,
        note: typeof pay.note === 'string' ? pay.note : null,
      });
      paymentCount += 1;
    });

    // Compared against the SUPPLIER GROSS from the canonical calculation. This is the
    // assertion the invoice parser got wrong: it compared 2300 against a bare 1933 net.
    if (!rowHasNegative && rowPaid > rowGross) {
      errors.push({ row, message: `Zahlungen (${money(rowPaid)}) übersteigen den Ausgabenbetrag (${money(rowGross)})` });
    }

    for (const forbidden of ['net_total_cents', 'vat_total_cents', 'gross_total_cents', 'input_vat_cents', 'amount_paid_cents', 'payment_status']) {
      if (forbidden in e) {
        warnings.push({ row, message: `„${forbidden}" wird ignoriert — dieser Wert wird serverseitig berechnet` });
      }
    }

    netCents += rowNet; vatCents += rowVat; grossCents += rowGross; inputVatCents += rowInputVat;
    paidCents += Math.min(rowPaid, Math.max(rowGross, 0));

    out.push({
      client_import_id: row,
      vendor: { vendor_id: vendorId, name: vendorName || null, country_code: countryCode, vat_id: vatId },
      supplier_invoice_number: typeof e.supplier_invoice_number === 'string' ? e.supplier_invoice_number : null,
      invoice_date: String(e.invoice_date ?? ''),
      service_date: isIsoDate(e.service_date) ? e.service_date : null,
      due_date: isIsoDate(e.due_date) ? e.due_date : null,
      currency: typeof e.currency === 'string' ? e.currency : 'EUR',
      notes: typeof e.notes === 'string' ? e.notes : null,
      category_key: categoryKey,
      lines,
      payments,
    });
  });

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    expenseCount: out.length,
    paymentCount,
    netCents, vatCents, inputVatCents, grossCents, paidCents,
    unresolvedVendorNames: [...unresolvedVendors.values()],
    vendorsToCreate: [],
    payload: {
      schema_version: EXPENSE_IMPORT_SCHEMA_VERSION,
      business_entity_id: entityId,
      source: 'paste',
      expenses: out,
    },
  };
}

/** What the server's vendor resolver returns for one pasted name. */
export interface VendorResolution {
  name: string;
  vendor_id: string | null;
  match_count: number;
  ambiguous: boolean;
}

/**
 * Apply preview-time vendor resolutions to the payload.
 *
 * Deterministic normalised-exact matching only. There is no fuzzy matching anywhere in this
 * path: "OpenAI Ireland Limited" and "OpenAI Ireland Ltd." are two different suppliers until
 * a human says otherwise, and guessing between them would misfile deductible spend.
 *
 *   exactly one match → the row is bound to that vendor_id
 *   more than one     → HARD ERROR, the row is blocked as ambiguous
 *   no match          → the vendor is listed as one the import will CREATE, and the preview
 *                       says so by name before anything is written
 */
export function applyVendorResolutions(
  preview: ExpenseImportPreview,
  resolutions: VendorResolution[],
): ExpenseImportPreview {
  if (!preview.payload) return preview;
  const byName = new Map(resolutions.map((r) => [normalizeVendorName(r.name), r]));
  const errors = [...preview.errors];
  const toCreate = new Map<string, VendorToCreate>();

  const expenses = preview.payload.expenses.map((row) => {
    const name = row.vendor.name?.trim();
    if (row.vendor.vendor_id || !name) return row;
    const hit = byName.get(normalizeVendorName(name));
    if (!hit) {
      errors.push({ row: row.client_import_id, message: `Lieferant „${name}" konnte nicht abgeglichen werden` });
      return row;
    }
    if (hit.ambiguous) {
      errors.push({
        row: row.client_import_id,
        message: `Lieferant „${name}" ist mehrdeutig (${hit.match_count} Treffer) — bitte manuell zuordnen`,
      });
      return row;
    }
    if (hit.match_count === 0 || !hit.vendor_id) {
      const key = normalizeVendorName(name);
      const existing = toCreate.get(key);
      if (existing) existing.rows.push(row.client_import_id);
      else toCreate.set(key, {
        name, country_code: row.vendor.country_code ?? null, vat_id: row.vendor.vat_id ?? null,
        rows: [row.client_import_id],
      });
      return row;
    }
    return { ...row, vendor: { ...row.vendor, vendor_id: hit.vendor_id } };
  });

  // Vendors to CREATE are returned as structured data (`vendorsToCreate`) rather than as
  // warning strings. The preview gives them their own panel — "Neuer Lieferant wird angelegt:
  // …" — because a new supplier is a decision the owner is making, not a caveat to skim past,
  // and a consumer that needs the names should read them as names.
  return {
    ...preview,
    errors,
    ok: errors.length === 0,
    vendorsToCreate: [...toCreate.values()],
    payload: { ...preview.payload, expenses },
  };
}

/** The template the "Beispiel einfügen" button writes into the textarea. */
export function expenseImportTemplate(): string {
  return JSON.stringify({
    schema_version: EXPENSE_IMPORT_SCHEMA_VERSION,
    expenses: [
      {
        // 1) German supplier, 19 % Vorsteuer, still unpaid.
        client_import_id: 'AUSG-2026-001',
        vendor: { name: 'Elm-Haustechnik GmbH', country_code: 'DE' },
        supplier_invoice_number: 'RE-2026-4711',
        invoice_date: '2026-02-03',
        service_date: '2026-02-03',
        due_date: '2026-02-17',
        currency: 'EUR',
        category_key: 'office',
        lines: [
          {
            description: 'Wartung Heizungsanlage',
            net_cents: 42000,
            vat_rate_bp: 1900,
            vat_treatment: 'domestic_standard',
          },
        ],
      },
      {
        // 2) Foreign software supplier — §13b reverse charge. The supplier gross is the NET:
        //    the VAT is self-assessed, not paid to the vendor.
        client_import_id: 'AUSG-2026-002',
        vendor: { name: 'OpenAI Ireland Limited', country_code: 'IE', vat_id: 'IE3717981AH' },
        supplier_invoice_number: 'INV-9F2A1C',
        invoice_date: '2026-02-05',
        currency: 'EUR',
        category_key: 'ai_api',
        lines: [
          {
            description: 'API-Nutzung Februar 2026',
            net_cents: 8400,
            vat_rate_bp: 1900,
            vat_treatment: 'reverse_charge_13b',
          },
        ],
      },
      {
        // 3) Fully paid German 19 % expense — the exact 19,33 + 3,67 = 23,00 case.
        client_import_id: 'AUSG-2026-003',
        vendor: { name: 'Amazon Marketplace', country_code: 'DE' },
        supplier_invoice_number: 'DE-INV-2026-88213',
        invoice_date: '2026-02-11',
        currency: 'EUR',
        category_key: 'office',
        lines: [
          {
            description: 'Büromaterial',
            net_cents: 1933,
            vat_rate_bp: 1900,
            vat_treatment: 'domestic_standard',
          },
        ],
        payments: [
          { payment_date: '2026-02-11', amount_cents: 2300, method: 'card', reference: 'Kreditkarte' },
        ],
      },
    ],
  }, null, 2);
}
