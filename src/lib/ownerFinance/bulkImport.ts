// Parse + validate the pasted bulk-import JSON, and build the preview the owner confirms.
//
// THE FIELD ACCEPTS JSON ONLY. It never accepts, parses or forwards SQL. An arbitrary-SQL
// box in a finance dashboard would be a a remote-code-execution hole with a text cursor in
// it, so pasted SQL is rejected up front with an explicit message rather than being handed
// to a backend that would (correctly) refuse it anyway.
//
// Nothing here writes. Parsing and validation are pure; the owner sees totals and problems
// first, and only a separate, explicit confirmation runs the atomic server import.

import type { InvoicePaymentInput, RevenueContractLineInput } from '@/lib/ownerFinance/financeExtendedApi';
import type { InvoiceLineInput } from '@/lib/ownerFinance/api';

// The schema contract lives HERE, next to the parser that enforces it, and is imported by
// the API layer rather than the other way round. That keeps this module free of any runtime
// dependency on the Supabase client, so it can be unit-tested without environment variables.
export const BULK_IMPORT_SCHEMA_VERSION = 1;
/** Mirrors the server-side bound so the preview can refuse early with a clear message. */
export const BULK_IMPORT_MAX_INVOICES = 100;
export const BULK_IMPORT_MAX_CONTRACTS = 100;

export interface BulkInvoiceInput {
  client_import_id: string;
  customer?: { organization_id?: string | null; name?: string | null } | null;
  external_reference?: string | null;
  issue_date: string;
  service_date?: string | null;
  service_period_start?: string | null;
  service_period_end?: string | null;
  due_date?: string | null;
  currency?: string;
  notes?: string | null;
  lines: InvoiceLineInput[];
  payments?: InvoicePaymentInput[];
}

export interface BulkContractInput {
  client_import_id: string;
  customer?: { organization_id?: string | null; name?: string | null } | null;
  name: string;
  description?: string | null;
  start_date: string;
  end_date?: string | null;
  billing_frequency?: 'monthly' | 'quarterly' | 'yearly';
  billing_day?: number | null;
  currency?: string;
  lines: RevenueContractLineInput[];
}

export interface BulkImportPayload {
  schema_version: number;
  business_entity_id?: string;
  source?: string | null;
  invoices?: BulkInvoiceInput[];
  recurring_contracts?: BulkContractInput[];
}

export interface RowIssue { row: string; message: string }

export interface BulkImportPreview {
  ok: boolean;
  /** Hard failures: nothing can be imported until these are resolved. */
  errors: RowIssue[];
  /** Rows that need the owner's attention (e.g. an ambiguous customer name). */
  warnings: RowIssue[];
  invoiceCount: number;
  paymentCount: number;
  contractCount: number;
  netCents: number;
  vatCents: number;
  grossCents: number;
  paidCents: number;
  /** Customer names needing server-side resolution before import. */
  unresolvedNames: string[];
  payload: BulkImportPayload | null;
}

/**
 * Statements that would only appear if someone pasted SQL instead of JSON. Matched
 * case-insensitively at a word boundary so ordinary German invoice prose ("Erstellung",
 * "Update der Website") does not trip the check.
 */
const SQL_TOKENS = [
  'select', 'insert', 'update', 'delete', 'drop', 'alter', 'create', 'truncate',
  'grant', 'revoke', 'merge', 'copy', 'vacuum',
];

export function looksLikeSql(raw: string): boolean {
  const text = raw.trim();
  if (!text) return false;
  // Valid payloads are JSON objects. Anything starting otherwise is suspicious.
  const startsAsJson = text.startsWith('{') || text.startsWith('[');
  if (/\bdo\s*\$\$/i.test(text) || /;\s*--/.test(text)) return true;
  if (startsAsJson) return false;
  return SQL_TOKENS.some((t) => new RegExp(`\\b${t}\\b`, 'i').test(text));
}

const isIsoDate = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);

function validateLines(lines: unknown, row: string, errors: RowIssue[]): InvoiceLineInput[] {
  if (!Array.isArray(lines) || lines.length === 0) {
    errors.push({ row, message: 'mindestens eine Position ist erforderlich' });
    return [];
  }
  const out: InvoiceLineInput[] = [];
  lines.forEach((l, i) => {
    const line = l as Record<string, unknown>;
    if (typeof line.description !== 'string' || !line.description.trim()) {
      errors.push({ row, message: `Position ${i + 1}: Beschreibung fehlt` });
    }
    if (!isInt(line.unit_price_cents)) {
      errors.push({ row, message: `Position ${i + 1}: unit_price_cents muss eine ganze Zahl in Cent sein` });
    }
    out.push({
      description: String(line.description ?? ''),
      quantity_milli: isInt(line.quantity_milli) ? line.quantity_milli : 1000,
      unit_price_cents: isInt(line.unit_price_cents) ? line.unit_price_cents : 0,
      vat_rate_bp: isInt(line.vat_rate_bp) ? line.vat_rate_bp : 1900,
      vat_treatment: typeof line.vat_treatment === 'string' ? line.vat_treatment : 'standard',
      sort_order: isInt(line.sort_order) ? line.sort_order : i,
    });
  });
  return out;
}

/**
 * Parse and validate pasted text into a preview.
 *
 * Totals shown here are a PREVIEW computed locally so the owner can sanity-check the paste.
 * They are never sent: the server recomputes net/VAT/gross from the lines and ignores any
 * total a client might supply.
 */
export function parseBulkImport(raw: string, entityId: string): BulkImportPreview {
  const empty: BulkImportPreview = {
    ok: false, errors: [], warnings: [], invoiceCount: 0, paymentCount: 0, contractCount: 0,
    netCents: 0, vatCents: 0, grossCents: 0, paidCents: 0, unresolvedNames: [], payload: null,
  };

  if (!raw.trim()) return { ...empty, errors: [{ row: '—', message: 'Bitte JSON einfügen.' }] };
  if (looksLikeSql(raw)) {
    return { ...empty, errors: [{ row: '—', message: 'Dieses Feld akzeptiert ausschließlich JSON. SQL wird nicht ausgeführt.' }] };
  }

  let parsed: unknown;
  try { parsed = JSON.parse(raw); }
  catch (e) { return { ...empty, errors: [{ row: '—', message: `Ungültiges JSON: ${e instanceof Error ? e.message : String(e)}` }] }; }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ...empty, errors: [{ row: '—', message: 'Die oberste Ebene muss ein JSON-Objekt sein.' }] };
  }
  const doc = parsed as Record<string, unknown>;
  const errors: RowIssue[] = [];
  const warnings: RowIssue[] = [];

  if (doc.schema_version !== BULK_IMPORT_SCHEMA_VERSION) {
    errors.push({ row: '—', message: `schema_version muss ${BULK_IMPORT_SCHEMA_VERSION} sein.` });
  }

  const invoices = Array.isArray(doc.invoices) ? (doc.invoices as unknown[]) : [];
  const contracts = Array.isArray(doc.recurring_contracts) ? (doc.recurring_contracts as unknown[]) : [];
  if (invoices.length === 0 && contracts.length === 0) {
    errors.push({ row: '—', message: 'Weder Rechnungen noch Verträge enthalten.' });
  }
  if (invoices.length > BULK_IMPORT_MAX_INVOICES) {
    errors.push({ row: '—', message: `Maximal ${BULK_IMPORT_MAX_INVOICES} Rechnungen pro Import.` });
  }
  if (contracts.length > BULK_IMPORT_MAX_CONTRACTS) {
    errors.push({ row: '—', message: `Maximal ${BULK_IMPORT_MAX_CONTRACTS} Verträge pro Import.` });
  }

  const seen = new Set<string>();
  const unresolved = new Set<string>();
  let netCents = 0, vatCents = 0, grossCents = 0, paidCents = 0, paymentCount = 0;
  const outInvoices: BulkInvoiceInput[] = [];

  invoices.forEach((raw, idx) => {
    const inv = raw as Record<string, unknown>;
    const row = typeof inv.client_import_id === 'string' && inv.client_import_id.trim()
      ? inv.client_import_id.trim() : `Rechnung ${idx + 1}`;

    if (typeof inv.client_import_id !== 'string' || !inv.client_import_id.trim()) {
      errors.push({ row, message: 'client_import_id fehlt (wird für den Duplikatschutz benötigt)' });
    } else if (seen.has(row)) {
      errors.push({ row, message: 'client_import_id kommt mehrfach vor' });
    } else { seen.add(row); }

    if (!isIsoDate(inv.issue_date)) errors.push({ row, message: 'issue_date fehlt oder ist kein JJJJ-MM-TT' });

    const customer = (inv.customer ?? {}) as Record<string, unknown>;
    const orgId = typeof customer.organization_id === 'string' ? customer.organization_id : null;
    const custName = typeof customer.name === 'string' ? customer.name.trim() : '';
    if (!orgId && !custName) {
      errors.push({ row, message: 'customer.organization_id oder customer.name ist erforderlich' });
    } else if (!orgId && custName) {
      unresolved.add(custName);
    }

    const lines = validateLines(inv.lines, row, errors);
    let invNet = 0, invVat = 0;
    for (const l of lines) {
      const net = Math.round((l.unit_price_cents * (l.quantity_milli ?? 1000)) / 1000);
      const vat = l.vat_treatment === 'standard' ? Math.round((net * (l.vat_rate_bp ?? 1900)) / 10000) : 0;
      invNet += net; invVat += vat;
    }
    const invGross = invNet + invVat;
    netCents += invNet; vatCents += invVat; grossCents += invGross;

    const payments = Array.isArray(inv.payments) ? (inv.payments as unknown[]) : [];
    let paidForInvoice = 0;
    payments.forEach((p, pi) => {
      const pay = p as Record<string, unknown>;
      if (!isIsoDate(pay.payment_date)) errors.push({ row, message: `Zahlung ${pi + 1}: payment_date fehlt oder ist kein JJJJ-MM-TT` });
      if (!isInt(pay.amount_cents) || (pay.amount_cents as number) <= 0) {
        errors.push({ row, message: `Zahlung ${pi + 1}: amount_cents muss eine positive ganze Zahl sein` });
      } else { paidForInvoice += pay.amount_cents as number; }
      if (isIsoDate(pay.payment_date) && isIsoDate(inv.issue_date) && (pay.payment_date as string) < (inv.issue_date as string)) {
        errors.push({ row, message: `Zahlung ${pi + 1}: liegt vor dem Rechnungsdatum` });
      }
      paymentCount += 1;
    });
    if (paidForInvoice > invGross) {
      errors.push({ row, message: `Zahlungen (${(paidForInvoice / 100).toFixed(2)}) übersteigen den Rechnungsbetrag (${(invGross / 100).toFixed(2)})` });
    }
    paidCents += Math.min(paidForInvoice, invGross);

    // Client-supplied totals are ignored on the server; say so rather than silently dropping them.
    for (const forbidden of ['net_total_cents', 'vat_total_cents', 'gross_total_cents', 'status', 'invoice_number', 'amount_paid_cents']) {
      if (forbidden in inv) {
        warnings.push({ row, message: `„${forbidden}" wird ignoriert — dieser Wert wird serverseitig berechnet` });
      }
    }

    outInvoices.push({
      client_import_id: row,
      customer: { organization_id: orgId, name: custName || null },
      external_reference: typeof inv.external_reference === 'string' ? inv.external_reference : null,
      issue_date: String(inv.issue_date ?? ''),
      service_date: isIsoDate(inv.service_date) ? inv.service_date : null,
      service_period_start: isIsoDate(inv.service_period_start) ? inv.service_period_start : null,
      service_period_end: isIsoDate(inv.service_period_end) ? inv.service_period_end : null,
      due_date: isIsoDate(inv.due_date) ? inv.due_date : null,
      currency: typeof inv.currency === 'string' ? inv.currency : 'EUR',
      notes: typeof inv.notes === 'string' ? inv.notes : null,
      lines,
      payments: payments as InvoicePaymentInput[],
    });
  });

  const outContracts: BulkContractInput[] = [];
  contracts.forEach((raw, idx) => {
    const c = raw as Record<string, unknown>;
    const row = typeof c.client_import_id === 'string' && c.client_import_id.trim()
      ? c.client_import_id.trim() : `Vertrag ${idx + 1}`;
    if (typeof c.client_import_id !== 'string' || !c.client_import_id.trim()) {
      errors.push({ row, message: 'client_import_id fehlt' });
    } else if (seen.has(row)) {
      errors.push({ row, message: 'client_import_id kommt mehrfach vor' });
    } else { seen.add(row); }
    if (typeof c.name !== 'string' || !c.name.trim()) errors.push({ row, message: 'name fehlt' });
    if (!isIsoDate(c.start_date)) errors.push({ row, message: 'start_date fehlt oder ist kein JJJJ-MM-TT' });

    const customer = (c.customer ?? {}) as Record<string, unknown>;
    const orgId = typeof customer.organization_id === 'string' ? customer.organization_id : null;
    const custName = typeof customer.name === 'string' ? customer.name.trim() : '';
    if (!orgId && custName) unresolved.add(custName);

    validateLines(c.lines, row, errors);
    outContracts.push({
      client_import_id: row,
      customer: { organization_id: orgId, name: custName || null },
      name: String(c.name ?? ''),
      description: typeof c.description === 'string' ? c.description : null,
      start_date: String(c.start_date ?? ''),
      end_date: isIsoDate(c.end_date) ? c.end_date : null,
      billing_frequency: (c.billing_frequency as BulkContractInput['billing_frequency']) ?? 'monthly',
      billing_day: isInt(c.billing_day) ? c.billing_day : null,
      currency: typeof c.currency === 'string' ? c.currency : 'EUR',
      lines: (Array.isArray(c.lines) ? c.lines : []) as RevenueContractLineInput[],
    });
  });

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    invoiceCount: outInvoices.length,
    paymentCount,
    contractCount: outContracts.length,
    netCents, vatCents, grossCents, paidCents,
    unresolvedNames: [...unresolved],
    payload: {
      schema_version: BULK_IMPORT_SCHEMA_VERSION,
      business_entity_id: entityId,
      source: 'paste',
      invoices: outInvoices,
      recurring_contracts: outContracts,
    },
  };
}

/**
 * Apply preview-time customer resolutions to the payload.
 *
 * Rows whose name stayed ambiguous keep no organization_id and are reported as errors, so
 * the import cannot proceed with a guessed customer.
 */
export function applyCustomerResolutions(
  preview: BulkImportPreview,
  resolutions: Array<{ name: string; organization_id: string | null; ambiguous: boolean; match_count: number }>,
): BulkImportPreview {
  if (!preview.payload) return preview;
  const byName = new Map(resolutions.map((r) => [r.name.toLowerCase(), r]));
  const errors = [...preview.errors];

  const resolve = <T extends { client_import_id: string; customer?: { organization_id?: string | null; name?: string | null } | null }>(row: T): T => {
    const name = row.customer?.name?.trim();
    if (row.customer?.organization_id || !name) return row;
    const hit = byName.get(name.toLowerCase());
    if (!hit || hit.match_count === 0) {
      errors.push({ row: row.client_import_id, message: `Kunde „${name}" wurde nicht gefunden` });
      return row;
    }
    if (hit.ambiguous) {
      errors.push({ row: row.client_import_id, message: `Kunde „${name}" ist mehrdeutig (${hit.match_count} Treffer) — bitte manuell zuordnen` });
      return row;
    }
    return { ...row, customer: { ...row.customer, organization_id: hit.organization_id } };
  };

  const invoices = (preview.payload.invoices ?? []).map(resolve);
  const recurring_contracts = (preview.payload.recurring_contracts ?? []).map(resolve);
  return {
    ...preview,
    errors,
    ok: errors.length === 0,
    payload: { ...preview.payload, invoices, recurring_contracts },
  };
}

/** The template the "JSON-Vorlage kopieren" button puts on the clipboard. */
export function bulkImportTemplate(): string {
  return JSON.stringify({
    schema_version: BULK_IMPORT_SCHEMA_VERSION,
    invoices: [
      {
        client_import_id: '2026-001',
        customer: { name: 'Beispielkunde GmbH' },
        external_reference: 'Original-RE-2026-001',
        issue_date: '2026-01-10',
        service_date: '2026-01-10',
        currency: 'EUR',
        lines: [
          { description: 'Digitalisierung', quantity_milli: 1000, unit_price_cents: 1000000, vat_rate_bp: 1900, vat_treatment: 'standard' },
        ],
        payments: [
          { payment_date: '2026-01-15', amount_cents: 300000, method: 'bank_transfer', reference: 'Abschlag 1' },
          { payment_date: '2026-02-15', amount_cents: 400000, method: 'bank_transfer', reference: 'Abschlag 2' },
          { payment_date: '2026-03-15', amount_cents: 490000, method: 'bank_transfer', reference: 'Restzahlung' },
        ],
      },
    ],
    recurring_contracts: [
      {
        client_import_id: 'contract-001',
        customer: { name: 'Beispielkunde GmbH' },
        name: 'Monatliche Betreuung',
        start_date: '2026-01-01',
        billing_frequency: 'monthly',
        billing_day: 1,
        currency: 'EUR',
        lines: [
          { description: 'Monatliche Betreuung', quantity_milli: 1000, unit_price_cents: 50000, vat_rate_bp: 1900, vat_treatment: 'standard' },
        ],
      },
    ],
  }, null, 2);
}
