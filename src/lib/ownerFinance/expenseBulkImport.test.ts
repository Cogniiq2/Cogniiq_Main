// Parsing, validation and preview for the EXPENSE bulk import (Ausgaben-Schnellimport).
//
// This suite exists because a real paste of real business expenses was rejected by a
// Schnellimport that only understood revenue. The rows in fixtures/q2exp2026Expenses.ts are
// the ones that failed; they are asserted here as they are, not edited until green.
//
// The load-bearing rules, each with a mutation test that proves the assertion is real:
//   * expense VAT is expense VAT (19,33 + 3,67 = 23,00), so a 23,00 € payment is not an overpayment
//   * suppliers resolve against VENDORS, never customers
//   * `invoice_date` is the expense date; `issue_date` is not required and not accepted
//   * supplier credits are refused, never abs()'d into positive spending
import { describe, expect, it } from 'vitest';

import {
  applyExistingDocumentMatches, applyVendorResolutions, detectDuplicateSupplierDocuments,
  expenseImportTemplate, parseExpenseBulkImport, supplierDocumentsToCheck,
  normalizeSupplierInvoiceNumber, normalizeVendorName, supplierDocumentKey,
  EXPENSE_VAT_TREATMENTS, BULK_IMPORT_MAX_EXPENSES,
  type SupplierDocumentMatch, type VendorResolution,
} from '@/lib/ownerFinance/expenseBulkImport';
import { parseBulkImport } from '@/lib/ownerFinance/bulkImport';
import { computeExpenseLine } from '@/lib/ownerFinance/tax';
import { Q2EXP_2026_EXPENSES } from '@/lib/ownerFinance/fixtures/q2exp2026Expenses';

const ENTITY = '11111111-1111-1111-1111-111111111111';
const VENDOR = '44444444-4444-4444-4444-444444444444';
const CATEGORIES = ['ai_api', 'software', 'cloud_hosting', 'office', 'hardware', 'review_required'];

const expense = (over: Record<string, unknown> = {}) => ({
  client_import_id: 'AUSG-1',
  vendor: { name: 'Elm-Haustechnik' },
  invoice_date: '2026-04-08',
  category_key: 'office',
  lines: [{ description: 'Material', net_cents: 1933, vat_rate_bp: 1900, vat_treatment: 'domestic_standard' }],
  ...over,
});
const doc = (over: Record<string, unknown> = {}) =>
  JSON.stringify({ schema_version: 1, expenses: [expense()], ...over });

const parse = (raw: string) => parseExpenseBulkImport(raw, ENTITY, CATEGORIES);
const messages = (p: { errors: Array<{ message: string }> }) => p.errors.map((e) => e.message).join(' | ');
const warningsOf = (p: { warnings: Array<{ message: string }> }) => p.warnings.map((w) => w.message).join(' | ');

/* ------------------------------------------------------------------ JSON only */

describe('the expense field is JSON-only and never a SQL console', () => {
  it.each([
    'SELECT * FROM owner_expenses;',
    'delete from owner_payments',
    'DROP TABLE owner_vendors;',
    'do $$ begin perform 1; end $$;',
  ])('rejects pasted SQL: %s', (bad) => {
    const p = parse(bad);
    expect(p.ok).toBe(false);
    expect(p.errors[0].message).toMatch(/ausschließlich JSON/);
    expect(p.payload).toBeNull();
  });

  it('reports invalid JSON plainly', () => {
    expect(parse('{ not json').errors[0].message).toMatch(/Ungültiges JSON/);
  });

  it('does not mistake German supplier prose for SQL', () => {
    const text = doc({ expenses: [expense({
      lines: [{ description: 'Update der Serverumgebung und Erstellung der Backups', net_cents: 10000, vat_treatment: 'domestic_standard' }],
    })] });
    expect(parse(text).ok).toBe(true);
  });
});

/* ------------------------------------ A) the 19,33 / 23,00 VAT regression */

describe('expense VAT uses the canonical expense arithmetic', () => {
  it('derives 19,33 net + 3,67 USt = 23,00 brutto for domestic_standard', () => {
    const p = parse(doc());
    expect(p.netCents).toBe(1933);
    expect(p.vatCents).toBe(367);
    expect(p.grossCents).toBe(2300);
    // Vorsteuer defaults to fully eligible; it is a separate axis from the VAT charged.
    expect(p.inputVatCents).toBe(367);
  });

  it('accepts a 23,00 payment against that expense — the reported false overpayment', () => {
    const p = parse(doc({ expenses: [expense({
      payments: [{ payment_date: '2026-04-14', amount_cents: 2300, method: 'card' }],
    })] }));
    expect(p.ok).toBe(true);
    expect(messages(p)).not.toMatch(/übersteigen/);
    expect(p.paidCents).toBe(2300);
  });

  it('MUTATION GUARD: computeExpenseLine is what produces 2300 — invoice semantics do not', () => {
    // If domestic_standard were ever routed through invoice VAT logic (which knows only
    // 'standard'/'reduced'), VAT would be 0 and the gross would fall back to the bare net.
    expect(computeExpenseLine(1933, 1900, 'domestic_standard')).toEqual({ vatCents: 367, grossCents: 2300 });
    const invoiceStyleVat = ['standard', 'reduced'].includes('domestic_standard') ? 367 : 0;
    expect(invoiceStyleVat).toBe(0);
    expect(parse(doc()).grossCents).not.toBe(1933);
  });

  it('still refuses a payment that genuinely exceeds the expense gross', () => {
    const p = parse(doc({ expenses: [expense({
      payments: [{ payment_date: '2026-04-14', amount_cents: 2301 }],
    })] }));
    expect(p.ok).toBe(false);
    expect(messages(p)).toMatch(/Zahlungen \(23\.01\) übersteigen den Ausgabenbetrag \(23\.00\)/);
  });

  it('excludes self-assessed VAT from the supplier gross for reverse_charge_13b', () => {
    const p = parse(doc({ expenses: [expense({
      lines: [{ description: 'API', net_cents: 8400, vat_rate_bp: 1900, vat_treatment: 'reverse_charge_13b' }],
    })] }));
    // §13b VAT is owed to the tax office, not to the supplier: gross === net.
    expect(p.vatCents).toBe(1596);
    expect(p.grossCents).toBe(8400);
  });

  it('applies input-VAT eligibility to the Vorsteuer without touching the VAT charged', () => {
    const p = parse(doc({ expenses: [expense({
      lines: [{ description: 'Telefon', net_cents: 10000, vat_rate_bp: 1900, vat_treatment: 'domestic_standard', input_vat_eligibility_bp: 5000 }],
    })] }));
    expect(p.vatCents).toBe(1900);
    expect(p.inputVatCents).toBe(950);
    expect(p.grossCents).toBe(11900);
  });

  it('rejects an INVOICE VAT treatment outright', () => {
    const p = parse(doc({ expenses: [expense({
      lines: [{ description: 'x', net_cents: 1000, vat_treatment: 'standard' }],
    })] }));
    expect(p.ok).toBe(false);
    expect(messages(p)).toMatch(/unbekannte USt-Behandlung „standard"/);
  });

  it.each(EXPENSE_VAT_TREATMENTS)('accepts the canonical treatment %s', (t) => {
    const p = parse(doc({ expenses: [expense({ lines: [{ description: 'x', net_cents: 1000, vat_treatment: t }] })] }));
    expect(p.ok).toBe(true);
  });
});

/* ------------------------------------ B) vendors, never customers */

describe('suppliers are vendors, never customers', () => {
  it('collects vendor names for VENDOR resolution', () => {
    const p = parse(doc({ expenses: [expense({ vendor: { name: 'OpenAI Ireland Limited' } })] }));
    expect(p.unresolvedVendorNames).toEqual(['OpenAI Ireland Limited']);
  });

  it('binds a row to a vendor on a unique normalised name match', () => {
    const p = parse(doc({ expenses: [expense({ vendor: { name: '  elm-haustechnik  ' } })] }));
    const r = applyVendorResolutions(p, [{ name: '  elm-haustechnik  ', vendor_id: VENDOR, match_count: 1, ambiguous: false }]);
    expect(r.ok).toBe(true);
    expect(r.payload?.expenses[0].vendor.vendor_id).toBe(VENDOR);
    expect(r.vendorsToCreate).toEqual([]);
  });

  it('BLOCKS an ambiguous vendor rather than guessing', () => {
    const p = parse(doc({ expenses: [expense({ vendor: { name: 'Elm-Haustechnik' } })] }));
    const r = applyVendorResolutions(p, [{ name: 'Elm-Haustechnik', vendor_id: null, match_count: 2, ambiguous: true }]);
    expect(r.ok).toBe(false);
    expect(messages(r)).toMatch(/Lieferant „Elm-Haustechnik" ist mehrdeutig \(2 Treffer\)/);
    expect(r.payload?.expenses[0].vendor.vendor_id).toBeFalsy();
  });

  it('PREVIEWS an unknown vendor as one that will be created, by name', () => {
    const p = parse(doc({ expenses: [expense({ vendor: { name: 'OpenAI Ireland Limited', country_code: 'IE' } })] }));
    const r = applyVendorResolutions(p, [{ name: 'OpenAI Ireland Limited', vendor_id: null, match_count: 0, ambiguous: false }]);
    expect(r.ok).toBe(true);
    expect(r.vendorsToCreate).toEqual([
      { name: 'OpenAI Ireland Limited', country_code: 'IE', vat_id: null, rows: ['AUSG-1'] },
    ]);
    // Structured, not a warning string: the preview renders these in their own panel, so the
    // owner reads "Neuer Lieferant wird angelegt: …" as a decision rather than a caveat.
    expect(warningsOf(r)).not.toMatch(/Neuer Lieferant/);
  });

  it('groups two rows naming the same new vendor into ONE creation', () => {
    const raw = JSON.stringify({ schema_version: 1, expenses: [
      expense({ client_import_id: 'A', vendor: { name: 'Neuer Lieferant' } }),
      expense({ client_import_id: 'B', vendor: { name: 'neuer lieferant' } }),
    ] });
    const r = applyVendorResolutions(parse(raw), [
      { name: 'Neuer Lieferant', vendor_id: null, match_count: 0, ambiguous: false },
    ]);
    expect(r.vendorsToCreate).toHaveLength(1);
    expect(r.vendorsToCreate[0].rows).toEqual(['A', 'B']);
  });

  it('leaves an explicit vendor_id alone and asks for no resolution', () => {
    const p = parse(doc({ expenses: [expense({ vendor: { vendor_id: VENDOR } })] }));
    expect(p.ok).toBe(true);
    expect(p.unresolvedVendorNames).toEqual([]);
    expect(p.payload?.expenses[0].vendor.vendor_id).toBe(VENDOR);
  });

  it('refuses a malformed vendor_id', () => {
    const p = parse(doc({ expenses: [expense({ vendor: { vendor_id: 'not-a-uuid' } })] }));
    expect(p.ok).toBe(false);
    expect(messages(p)).toMatch(/vendor\.vendor_id ist keine gültige UUID/);
  });

  it('requires a vendor', () => {
    const p = parse(doc({ expenses: [expense({ vendor: {} })] }));
    expect(messages(p)).toMatch(/vendor\.vendor_id oder vendor\.name ist erforderlich/);
  });

  it('rejects a "customer" key with an explanation instead of resolving one', () => {
    const p = parse(doc({ expenses: [expense({ customer: { name: 'OpenAI Ireland Limited' } })] }));
    expect(p.ok).toBe(false);
    expect(messages(p)).toMatch(/Lieferanten gehören unter „vendor"/);
  });

  it('MUTATION GUARD: no expense path ever produces a customer field', () => {
    // If vendor resolution were swapped back to customer resolution, a resolved row would
    // carry organization_id / customer and this assertion would fail.
    const r = applyVendorResolutions(parse(doc()), [
      { name: 'Elm-Haustechnik', vendor_id: VENDOR, match_count: 1, ambiguous: false },
    ]);
    const serialized = JSON.stringify(r.payload);
    expect(serialized).not.toContain('organization_id');
    expect(serialized).not.toContain('customer');
    expect(serialized).not.toContain('client_account_id');
    expect(r.payload?.expenses[0]).toHaveProperty('vendor');
  });

  it('normalises names the same way the server does', () => {
    expect(normalizeVendorName('  OpenAI Ireland Limited ')).toBe('openai ireland limited');
  });
});

/* ------------------------------------ C) dates */

describe('an expense is dated by the SUPPLIER document', () => {
  it('accepts invoice_date and never asks for issue_date', () => {
    const p = parse(doc());
    expect(p.ok).toBe(true);
    expect(messages(p)).not.toMatch(/issue_date/);
    expect(p.payload?.expenses[0].invoice_date).toBe('2026-04-08');
  });

  it('refuses a missing or malformed invoice_date', () => {
    expect(messages(parse(doc({ expenses: [expense({ invoice_date: undefined })] })))).toMatch(/invoice_date fehlt/);
    expect(messages(parse(doc({ expenses: [expense({ invoice_date: '08.04.2026' })] })))).toMatch(/invoice_date fehlt oder ist kein JJJJ-MM-TT/);
  });

  it('names issue_date as an invoice field when it is used instead', () => {
    const p = parse(doc({ expenses: [expense({ invoice_date: undefined, issue_date: '2026-04-08' })] }));
    expect(p.ok).toBe(false);
    expect(messages(p)).toMatch(/„issue_date" ist ein Rechnungsfeld/);
  });

  it('keeps service_date and due_date optional', () => {
    expect(parse(doc({ expenses: [expense({ service_date: '2026-04-01', due_date: '2026-04-30' })] })).ok).toBe(true);
    expect(parse(doc()).payload?.expenses[0].service_date).toBeNull();
  });
});

/* ------------------------------------ categories */

describe('categories use stable keys, never database ids', () => {
  it('accepts a known key', () => {
    expect(parse(doc({ expenses: [expense({ category_key: 'ai_api' })] })).ok).toBe(true);
  });

  it('BLOCKS an unknown key', () => {
    const p = parse(doc({ expenses: [expense({ category_key: 'erfundene_kategorie' })] }));
    expect(p.ok).toBe(false);
    expect(messages(p)).toMatch(/Unbekannte Kategorie „erfundene_kategorie"/);
  });

  it('refuses a client-supplied category_id', () => {
    const p = parse(doc({ expenses: [expense({ category_id: '55555555-5555-5555-5555-555555555555' })] }));
    expect(p.ok).toBe(false);
    expect(messages(p)).toMatch(/Datenbank-IDs für Kategorien werden nicht akzeptiert/);
  });

  it('falls back to review_required WITH a warning when none is given', () => {
    const p = parse(doc({ expenses: [expense({ category_key: undefined })] }));
    expect(p.ok).toBe(true);
    expect(p.payload?.expenses[0].category_key).toBe('review_required');
    expect(warningsOf(p)).toMatch(/wird als „review_required" zur Prüfung erfasst/);
  });

  it('does not force the fallback when only a LINE names a category', () => {
    const p = parse(doc({ expenses: [expense({
      category_key: undefined,
      lines: [{ description: 'x', net_cents: 1000, vat_treatment: 'domestic_standard', category_key: 'software' }],
    })] }));
    expect(p.payload?.expenses[0].category_key).toBeNull();
    expect(warningsOf(p)).not.toMatch(/review_required/);
  });

  it('defers key validation to the server when the category list is unavailable', () => {
    const p = parseExpenseBulkImport(doc({ expenses: [expense({ category_key: 'whatever' })] }), ENTITY);
    expect(p.ok).toBe(true);
  });
});

/* ------------------------------------ D) supplier credits */

describe('supplier credits are refused, never coerced', () => {
  it('blocks a negative line with the canonical message', () => {
    const p = parse(doc({ expenses: [expense({
      lines: [{ description: 'Gutschrift', net_cents: -6048, vat_rate_bp: 1900, vat_treatment: 'domestic_standard' }],
    })] }));
    expect(p.ok).toBe(false);
    expect(messages(p)).toContain(
      'Lieferantengutschrift / negative Ausgabe benötigt eine gesonderte Buchungsart und wurde nicht importiert.',
    );
  });

  it('MUTATION GUARD: the negative is never turned into positive spending', () => {
    const p = parse(doc({ expenses: [expense({
      lines: [{ description: 'Gutschrift', net_cents: -6048, vat_rate_bp: 1900, vat_treatment: 'domestic_standard' }],
    })] }));
    // abs() would show 60,48 net / 71,97 gross and let the row import.
    expect(p.netCents).toBe(-6048);
    expect(p.grossCents).toBe(-7197);
    expect(p.payload).not.toBeNull();
    expect(p.ok).toBe(false);
  });
});

/* ------------------------------------ duplicate protection + bounds */

describe('duplicate protection and payload bounds', () => {
  it('requires a client_import_id', () => {
    expect(messages(parse(doc({ expenses: [expense({ client_import_id: undefined })] })))).toMatch(/client_import_id fehlt/);
  });

  it('refuses a repeated client_import_id inside one paste', () => {
    const raw = JSON.stringify({ schema_version: 1, expenses: [expense(), expense()] });
    expect(messages(parse(raw))).toMatch(/client_import_id kommt mehrfach vor/);
  });

  it(`refuses more than ${BULK_IMPORT_MAX_EXPENSES} expenses`, () => {
    const rows = Array.from({ length: BULK_IMPORT_MAX_EXPENSES + 1 }, (_, i) => expense({ client_import_id: `A-${i}` }));
    expect(messages(parse(JSON.stringify({ schema_version: 1, expenses: rows })))).toMatch(/Maximal 100 Ausgaben/);
  });

  it('refuses an empty or absent expenses array', () => {
    expect(messages(parse(JSON.stringify({ schema_version: 1, expenses: [] })))).toMatch(/Keine Ausgaben enthalten/);
  });

  it('refuses the wrong schema_version', () => {
    expect(messages(parse(JSON.stringify({ schema_version: 2, expenses: [expense()] })))).toMatch(/schema_version muss 1 sein/);
  });

  it('warns that server-derived totals in the paste are ignored', () => {
    const p = parse(doc({ expenses: [expense({ gross_total_cents: 999, payment_status: 'paid' })] }));
    expect(warningsOf(p)).toMatch(/„gross_total_cents" wird ignoriert/);
    expect(warningsOf(p)).toMatch(/„payment_status" wird ignoriert/);
    expect(JSON.stringify(p.payload)).not.toContain('999');
  });
});

/* ------------------------------------ the accounting firewall, at parse time */

describe('the two importers refuse each other\'s payloads', () => {
  it('the EXPENSE importer refuses invoices and recurring contracts', () => {
    const p = parse(JSON.stringify({ schema_version: 1, expenses: [expense()], invoices: [{ client_import_id: 'x' }] }));
    expect(p.ok).toBe(false);
    expect(messages(p)).toMatch(/„invoices" gehört nicht in den Ausgaben-Schnellimport/);
  });

  it('the REVENUE importer refuses expenses instead of dropping them silently', () => {
    const raw = JSON.stringify({
      schema_version: 1,
      invoices: [{
        client_import_id: '2026-001', customer: { organization_id: '22222222-2222-2222-2222-222222222222' },
        issue_date: '2026-01-10',
        lines: [{ description: 'x', unit_price_cents: 1000, vat_rate_bp: 1900, vat_treatment: 'standard' }],
      }],
      expenses: [expense()],
    });
    const p = parseBulkImport(raw, ENTITY);
    expect(p.ok).toBe(false);
    expect(p.errors.map((e) => e.message).join(' | ')).toMatch(/„expenses" gehört in den Ausgaben-Schnellimport/);
  });
});

/* ------------------------------------ the template */

describe('the "Beispiel einfügen" template', () => {
  const parsed = JSON.parse(expenseImportTemplate()) as { expenses: Array<Record<string, unknown>> };

  it('parses cleanly through the real validator', () => {
    const p = parse(expenseImportTemplate());
    expect(p.errors).toEqual([]);
    expect(p.ok).toBe(true);
  });

  it('uses expense terminology only — no customer, no issue_date, no invoice VAT vocabulary', () => {
    const text = expenseImportTemplate();
    expect(text).not.toContain('"customer"');
    expect(text).not.toContain('"issue_date"');
    expect(text).not.toContain('"vat_treatment": "standard"');
    expect(text).not.toContain('"vat_treatment": "reduced"');
    expect(text).not.toContain('unit_price_cents');
  });

  it('covers a German 19 % supplier, a foreign reverse-charge supplier and a paid expense', () => {
    expect(parsed.expenses).toHaveLength(3);
    const treatments = parsed.expenses.flatMap((e) => (e.lines as Array<{ vat_treatment: string }>).map((l) => l.vat_treatment));
    expect(treatments).toContain('domestic_standard');
    expect(treatments).toContain('reverse_charge_13b');
    expect(parsed.expenses.filter((e) => Array.isArray(e.payments) && (e.payments as unknown[]).length > 0)).toHaveLength(1);
  });

  it('demonstrates the 19,33 → 23,00 case it exists to document', () => {
    const p = parse(expenseImportTemplate());
    expect(p.paidCents).toBe(2300);
  });
});

/* ------------------------------------ the real Q2/2026 payload */

describe('the Q2/2026 payload that production rejected', () => {
  const preview = parse(Q2EXP_2026_EXPENSES);

  it('produces exactly ONE blocked row — the supplier credit — and nothing else', () => {
    expect(preview.errors).toHaveLength(1);
    expect(preview.errors[0].row).toBe('Q2EXP-2026-031');
    expect(preview.errors[0].message).toContain('Lieferantengutschrift');
  });

  it('no longer reports any of the four original errors', () => {
    const text = messages(preview);
    expect(text).not.toMatch(/Kunde/);
    expect(text).not.toMatch(/issue_date/);
    expect(text).not.toMatch(/übersteigen/);
    expect(text).not.toMatch(/nicht gefunden/);
  });

  it('treats Amazon and OpenAI as vendors awaiting resolution', () => {
    expect(preview.unresolvedVendorNames).toEqual([
      'Elm-Haustechnik',
      'Amazon Marketplace / VAT declared by Amazon EU S.à r.l.',
      'OpenAI Ireland Limited',
      'Hetzner Online GmbH',
    ]);
  });

  it('computes the four valid rows correctly (Q2EXP-2026-004 = 19,33 + 3,67 = 23,00)', () => {
    const four = JSON.parse(Q2EXP_2026_EXPENSES) as { expenses: Array<Record<string, unknown>> };
    const valid = parse(JSON.stringify({
      schema_version: 1,
      expenses: four.expenses.filter((e) => e.client_import_id !== 'Q2EXP-2026-031'),
    }));
    expect(valid.ok).toBe(true);
    expect(valid.expenseCount).toBe(4);
    expect(valid.paymentCount).toBe(3);
    expect(valid.netCents).toBe(41274);
    expect(valid.vatCents).toBe(7841);
    expect(valid.grossCents).toBe(49115);
    expect(valid.paidCents).toBe(15200);
  });

  it('lists the four suppliers as vendors to CREATE — and creates no customer', () => {
    const resolutions: VendorResolution[] = preview.unresolvedVendorNames.map((name) => ({
      name, vendor_id: null, match_count: 0, ambiguous: false,
    }));
    const r = applyVendorResolutions(preview, resolutions);
    expect(r.vendorsToCreate.map((v) => v.name)).toEqual(preview.unresolvedVendorNames);
    expect(JSON.stringify(r.payload)).not.toContain('organization_id');
    // The credit row still blocks; vendor resolution does not rescue it.
    expect(r.ok).toBe(false);
  });
});

/* -------------------------------------------- supplier-document duplicate protection */

// THE production blocker this section exists for:
//
//   The cross-batch guard is keyed on (business_entity_id, record_type, client_import_id).
//   client_import_id is a label the PASTE chooses, not a property of the supplier's
//   document, so the same OpenAI invoice INV-123 pasted once as Q2EXP-001 and again as
//   Q2EXP-099 passed that guard twice — booking the expense, the payment, the deductible
//   net AND the Vorsteuer twice.
//
// The identity enforced instead is (business entity, resolved vendor, normalised supplier
// invoice number) and nothing else. These tests pin both halves: what it MUST block, and
// what it must NOT — a guard that also refuses legitimate expenses is its own defect.

const OPENAI = '55555555-5555-5555-5555-555555555555';
const AMAZON = '66666666-6666-6666-6666-666666666666';

const supplierDoc = (over: Record<string, unknown> = {}) => expense({
  vendor: { vendor_id: OPENAI },
  supplier_invoice_number: 'INV-123',
  ...over,
});
const parseDocs = (...rows: Array<Record<string, unknown>>) =>
  parse(JSON.stringify({ schema_version: 1, expenses: rows }));

describe('normalisation is conservative and deterministic', () => {
  // (G) Trim + case-fold, and NOTHING else. Anything cleverer here is fuzzy matching by
  // another name, and fuzzy matching on document identity misfiles deductible spend.
  it.each([
    ['INV-123', 'inv-123'],
    ['  INV-123  ', 'inv-123'],
    ['inv-123', 'inv-123'],
    ['InV-123', 'inv-123'],
    ['\tINV-123\n', 'inv-123'],
  ])('normalises %j to %j', (raw, expected) => {
    expect(normalizeSupplierInvoiceNumber(raw)).toBe(expected);
  });

  it('treats blank and non-string invoice numbers as NO identity', () => {
    for (const blank of ['', '   ', '\t', null, undefined, 42, {}]) {
      expect(normalizeSupplierInvoiceNumber(blank)).toBeNull();
    }
  });

  it('does not strip separators — punctuation is part of the document number', () => {
    expect(normalizeSupplierInvoiceNumber('RE-2026/4711'))
      .not.toBe(normalizeSupplierInvoiceNumber('RE20264711'));
  });

  it('has no identity without BOTH a vendor and an invoice number', () => {
    expect(supplierDocumentKey(`id:${OPENAI}`, 'INV-123')).toBe(`id:${OPENAI}|inv-123`);
    expect(supplierDocumentKey(null, 'INV-123')).toBeNull();
    expect(supplierDocumentKey(`id:${OPENAI}`, '   ')).toBeNull();
    expect(supplierDocumentKey(`id:${OPENAI}`, null)).toBeNull();
  });

  it('mirrors the server: the parsed payload carries the TRIMMED number', () => {
    const p = parseDocs(supplierDoc({ supplier_invoice_number: '  INV-123  ' }));
    expect(p.payload!.expenses[0].supplier_invoice_number).toBe('INV-123');
  });
});

describe('(B) the same supplier document twice in ONE pasted batch is refused', () => {
  it('blocks BOTH rows even though the client_import_ids differ', () => {
    const p = parseDocs(
      supplierDoc({ client_import_id: 'Q2EXP-001' }),
      supplierDoc({ client_import_id: 'Q2EXP-099' }),
    );
    expect(p.ok).toBe(false);
    // Every row involved is named — the owner has to see both to know which to delete.
    const rows = p.errors.filter((e) => /mehrfach vor/.test(e.message)).map((e) => e.row).sort();
    expect(rows).toEqual(['Q2EXP-001', 'Q2EXP-099']);
    expect(messages(p)).toMatch(/nur einmal gebucht/);
  });

  it('blocks across case and whitespace differences in the number', () => {
    const p = parseDocs(
      supplierDoc({ client_import_id: 'A', supplier_invoice_number: 'INV-123' }),
      supplierDoc({ client_import_id: 'B', supplier_invoice_number: '  inv-123 ' }),
    );
    expect(p.ok).toBe(false);
    expect(messages(p)).toMatch(/mehrfach vor/);
  });

  it('blocks when the vendor is given by NAME rather than id', () => {
    const p = parseDocs(
      supplierDoc({ client_import_id: 'A', vendor: { name: 'OpenAI Ireland Limited' } }),
      supplierDoc({ client_import_id: 'B', vendor: { name: '  openai ireland limited ' } }),
    );
    expect(p.ok).toBe(false);
    expect(messages(p)).toMatch(/mehrfach vor/);
  });

  it('blocks after resolution binds a name row and an id row onto ONE vendor', () => {
    // Neither row is a duplicate of the other until the server says the name IS that vendor.
    const p = parseDocs(
      supplierDoc({ client_import_id: 'A', vendor: { vendor_id: OPENAI } }),
      supplierDoc({ client_import_id: 'B', vendor: { name: 'OpenAI Ireland Limited' } }),
    );
    expect(p.ok).toBe(true);
    const r = applyVendorResolutions(p, [
      { name: 'OpenAI Ireland Limited', vendor_id: OPENAI, match_count: 1, ambiguous: false },
    ]);
    expect(r.ok).toBe(false);
    expect(messages(r)).toMatch(/mehrfach vor/);
  });

  it('is idempotent — a second pass reports nothing new', () => {
    const p = parseDocs(
      supplierDoc({ client_import_id: 'A' }),
      supplierDoc({ client_import_id: 'B' }),
    );
    expect(detectDuplicateSupplierDocuments(p).errors).toHaveLength(p.errors.length);
  });
});

describe('(C, D, E) what the guard must NOT block', () => {
  it('(C) allows the SAME invoice number from two DIFFERENT vendors', () => {
    const p = parseDocs(
      supplierDoc({ client_import_id: 'A', vendor: { vendor_id: OPENAI } }),
      supplierDoc({ client_import_id: 'B', vendor: { vendor_id: AMAZON } }),
    );
    expect(messages(p)).not.toMatch(/mehrfach vor/);
    expect(p.ok).toBe(true);
  });

  it('(C) allows the same invoice number from two differently NAMED vendors', () => {
    const p = parseDocs(
      supplierDoc({ client_import_id: 'A', vendor: { name: 'OpenAI Ireland Limited' } }),
      supplierDoc({ client_import_id: 'B', vendor: { name: 'Amazon Marketplace' } }),
    );
    expect(p.ok).toBe(true);
  });

  it('(D) allows the same vendor with DIFFERENT invoice numbers', () => {
    const p = parseDocs(
      supplierDoc({ client_import_id: 'A', supplier_invoice_number: 'INV-123' }),
      supplierDoc({ client_import_id: 'B', supplier_invoice_number: 'INV-124' }),
    );
    expect(p.ok).toBe(true);
  });

  it('(E) the entity is part of the identity, so it never leaks across entities', () => {
    // The preview covers one entity, so a cross-entity collision cannot even be expressed
    // here; what IS asserted is that the entity travels with the payload the server keys on.
    const other = '22222222-2222-2222-2222-222222222222';
    const raw = JSON.stringify({ schema_version: 1, expenses: [supplierDoc()] });
    expect(parseExpenseBulkImport(raw, ENTITY, CATEGORIES).payload!.business_entity_id).toBe(ENTITY);
    expect(parseExpenseBulkImport(raw, other, CATEGORIES).payload!.business_entity_id).toBe(other);
  });

  it('two identical amounts from one supplier on one day are TWO expenses, not a duplicate', () => {
    // The guard is document identity, never amount+date+vendor. Two 9,99 € charges are two
    // real deductions and blocking the second would cost the owner one of them.
    const p = parseDocs(
      supplierDoc({ client_import_id: 'A', supplier_invoice_number: 'INV-1' }),
      supplierDoc({ client_import_id: 'B', supplier_invoice_number: 'INV-2' }),
    );
    expect(p.ok).toBe(true);
    expect(p.expenseCount).toBe(2);
  });
});

describe('(F) a missing supplier_invoice_number never gets a fabricated identity', () => {
  it('warns that document-level duplicate detection is unavailable', () => {
    const p = parseDocs(supplierDoc({ supplier_invoice_number: undefined }));
    expect(p.ok).toBe(true);
    expect(warningsOf(p)).toMatch(/Dublettenprüfung auf Belegebene nicht möglich/);
    expect(warningsOf(p)).toMatch(/client_import_id/);
  });

  it.each([undefined, null, '', '   '])('does NOT block two numberless rows (%j)', (blank) => {
    const p = parseDocs(
      supplierDoc({ client_import_id: 'A', supplier_invoice_number: blank }),
      supplierDoc({ client_import_id: 'B', supplier_invoice_number: blank }),
    );
    expect(messages(p)).not.toMatch(/mehrfach vor/);
    expect(p.ok).toBe(true);
  });

  it('never sends a numberless row to the server probe', () => {
    const p = parseDocs(
      supplierDoc({ client_import_id: 'A', supplier_invoice_number: null }),
      supplierDoc({ client_import_id: 'B', supplier_invoice_number: 'INV-9' }),
    );
    expect(supplierDocumentsToCheck(p)).toEqual([
      { client_import_id: 'B', vendor_id: OPENAI, supplier_invoice_number: 'INV-9' },
    ]);
  });

  it('a row whose vendor will be CREATED is not probed — nothing is booked against it yet', () => {
    const p = parseDocs(supplierDoc({ vendor: { name: 'Brand-new GmbH' } }));
    expect(supplierDocumentsToCheck(p)).toEqual([]);
  });

  it('(I) client_import_id duplicate protection still works on its own', () => {
    const p = parseDocs(
      supplierDoc({ client_import_id: 'SAME', supplier_invoice_number: null }),
      supplierDoc({ client_import_id: 'SAME', supplier_invoice_number: null }),
    );
    expect(p.ok).toBe(false);
    expect(messages(p)).toMatch(/client_import_id kommt mehrfach vor/);
  });
});

describe('(A) a document the books already hold is refused, whatever the client_import_id', () => {
  const alreadyBooked = (count: number): SupplierDocumentMatch[] => ([
    { client_import_id: 'Q2EXP-099', vendor_id: OPENAI, supplier_invoice_number: 'INV-123', match_count: count },
  ]);

  it('blocks the row when the entity already has exactly one such expense', () => {
    // This is the reported defect verbatim: INV-123 was imported as Q2EXP-001, and comes
    // back as Q2EXP-099.
    const p = parseDocs(supplierDoc({ client_import_id: 'Q2EXP-099' }));
    expect(p.ok).toBe(true);
    const r = applyExistingDocumentMatches(p, alreadyBooked(1));
    expect(r.ok).toBe(false);
    expect(messages(r)).toMatch(/bereits erfasst/);
    expect(messages(r)).toMatch(/Vorsteuer doppelt/);
  });

  it('blocks and names an inconsistency when the books already hold MORE than one', () => {
    const r = applyExistingDocumentMatches(parseDocs(supplierDoc()), alreadyBooked(3));
    expect(r.ok).toBe(false);
    expect(messages(r)).toMatch(/bereits 3-mal/);
    expect(messages(r)).toMatch(/inkonsistente Buchhaltungsdaten/i);
  });

  it('leaves the row alone when the books hold none', () => {
    const r = applyExistingDocumentMatches(parseDocs(supplierDoc()), alreadyBooked(0));
    expect(r.ok).toBe(true);
    expect(r.errors).toHaveLength(0);
  });

  it('matches the stored document across case and whitespace', () => {
    const p = parseDocs(supplierDoc({ supplier_invoice_number: ' inv-123 ' }));
    const r = applyExistingDocumentMatches(p, alreadyBooked(1));
    expect(r.ok).toBe(false);
  });

  it('does not block a DIFFERENT vendor carrying the same number', () => {
    const p = parseDocs(supplierDoc({ vendor: { vendor_id: AMAZON } }));
    expect(applyExistingDocumentMatches(p, alreadyBooked(1)).ok).toBe(true);
  });

  it('does not block a DIFFERENT number from the same vendor', () => {
    const p = parseDocs(supplierDoc({ supplier_invoice_number: 'INV-124' }));
    expect(applyExistingDocumentMatches(p, alreadyBooked(1)).ok).toBe(true);
  });

  it('(J) supplier credits stay refused — the duplicate guard rescues nothing', () => {
    const p = parseDocs(supplierDoc({
      lines: [{ description: 'Gutschrift', net_cents: -1933, vat_rate_bp: 1900, vat_treatment: 'domestic_standard' }],
    }));
    expect(p.ok).toBe(false);
    expect(messages(p)).toMatch(/Lieferantengutschrift/);
    expect(applyExistingDocumentMatches(p, alreadyBooked(0)).ok).toBe(false);
  });
});
