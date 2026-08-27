// Parsing, validation and preview for the bulk finance import.
//
// The two things worth protecting here: the field must never behave like a SQL console,
// and the preview must refuse anything it cannot import cleanly — including a customer
// name that matches two customers, which would otherwise misfile someone's revenue.
import { describe, expect, it } from 'vitest';

import {
  applyCustomerResolutions, bulkImportTemplate, looksLikeSql, parseBulkImport,
} from '@/lib/ownerFinance/bulkImport';

const ENTITY = '11111111-1111-1111-1111-111111111111';
const ORG = '22222222-2222-2222-2222-222222222222';

const invoice = (over: Record<string, unknown> = {}) => ({
  client_import_id: '2026-001',
  customer: { organization_id: ORG },
  issue_date: '2026-01-10',
  lines: [{ description: 'Digitalisierung', quantity_milli: 1000, unit_price_cents: 1000000, vat_rate_bp: 1900, vat_treatment: 'standard' }],
  payments: [{ payment_date: '2026-01-15', amount_cents: 1190000 }],
  ...over,
});
const doc = (over: Record<string, unknown> = {}) => JSON.stringify({ schema_version: 1, invoices: [invoice()], ...over });

describe('the field is JSON-only and never a SQL console', () => {
  it.each([
    'SELECT * FROM owner_invoices;',
    'delete from owner_payments',
    'DROP TABLE owner_invoices;',
    'truncate owner_invoices cascade',
    'do $$ begin perform 1; end $$;',
    'ALTER TABLE owner_invoices ADD COLUMN x int',
    "insert into owner_payments values (1); -- oops",
  ])('rejects pasted SQL: %s', (bad) => {
    expect(looksLikeSql(bad)).toBe(true);
    const p = parseBulkImport(bad, ENTITY);
    expect(p.ok).toBe(false);
    expect(p.errors[0].message).toMatch(/ausschließlich JSON/);
    expect(p.payload).toBeNull();
  });

  it('does not mistake ordinary German invoice prose for SQL', () => {
    // "Update", "Erstellung" and similar appear constantly in real line descriptions.
    const text = doc({ invoices: [invoice({
      lines: [{ description: 'Update der Website und Erstellung neuer Inhalte', unit_price_cents: 100000, vat_rate_bp: 1900, vat_treatment: 'standard' }],
      payments: [{ payment_date: '2026-01-15', amount_cents: 119000 }],
    })] });
    expect(looksLikeSql(text)).toBe(false);
    expect(parseBulkImport(text, ENTITY).ok).toBe(true);
  });

  it('reports invalid JSON plainly', () => {
    const p = parseBulkImport('{ not json', ENTITY);
    expect(p.ok).toBe(false);
    expect(p.errors[0].message).toMatch(/Ungültiges JSON/);
  });
});

describe('preview totals', () => {
  it('computes net, VAT, gross and paid for a valid document', () => {
    const p = parseBulkImport(doc(), ENTITY);
    expect(p.ok).toBe(true);
    expect(p.invoiceCount).toBe(1);
    expect(p.paymentCount).toBe(1);
    expect(p.netCents).toBe(1000000);
    expect(p.vatCents).toBe(190000);
    expect(p.grossCents).toBe(1190000);
    expect(p.paidCents).toBe(1190000);
  });

  it('sums instalments without double counting', () => {
    const p = parseBulkImport(doc({ invoices: [invoice({ payments: [
      { payment_date: '2026-01-15', amount_cents: 300000 },
      { payment_date: '2026-02-15', amount_cents: 400000 },
      { payment_date: '2026-03-15', amount_cents: 490000 },
    ] })] }), ENTITY);
    expect(p.ok).toBe(true);
    expect(p.paymentCount).toBe(3);
    expect(p.paidCents).toBe(1190000);
  });

  it('carries the entity into the payload and never a client total', () => {
    const p = parseBulkImport(doc(), ENTITY);
    expect(p.payload?.business_entity_id).toBe(ENTITY);
    expect(JSON.stringify(p.payload)).not.toContain('gross_total_cents');
  });
});

describe('validation refuses anything it cannot import cleanly', () => {
  it.each([
    ['missing client_import_id', doc({ invoices: [invoice({ client_import_id: undefined })] }), /client_import_id/],
    ['duplicate client_import_id', doc({ invoices: [invoice(), invoice()] }), /mehrfach/],
    ['missing issue_date', doc({ invoices: [invoice({ issue_date: undefined })] }), /issue_date/],
    ['no customer at all', doc({ invoices: [invoice({ customer: {} })] }), /organization_id oder customer.name/],
    ['no lines', doc({ invoices: [invoice({ lines: [] })] }), /mindestens eine Position/],
    ['wrong schema_version', JSON.stringify({ schema_version: 2, invoices: [invoice()] }), /schema_version/],
    ['empty document', JSON.stringify({ schema_version: 1 }), /Weder Rechnungen noch Verträge/],
  ])('rejects %s', (_label, text, pattern) => {
    const p = parseBulkImport(text, ENTITY);
    expect(p.ok).toBe(false);
    expect(p.errors.map((e) => e.message).join(' | ')).toMatch(pattern);
  });

  it('rejects an overpaying invoice before it ever reaches the server', () => {
    const p = parseBulkImport(doc({ invoices: [invoice({ payments: [{ payment_date: '2026-01-15', amount_cents: 2000000 }] })] }), ENTITY);
    expect(p.ok).toBe(false);
    expect(p.errors.map((e) => e.message).join()).toMatch(/übersteigen den Rechnungsbetrag/);
  });

  it('rejects a payment dated before its invoice', () => {
    const p = parseBulkImport(doc({ invoices: [invoice({ payments: [{ payment_date: '2025-12-01', amount_cents: 1000 }] })] }), ENTITY);
    expect(p.ok).toBe(false);
    expect(p.errors.map((e) => e.message).join()).toMatch(/vor dem Rechnungsdatum/);
  });

  it('rejects an oversized batch', () => {
    const many = Array.from({ length: 101 }, (_, i) => invoice({ client_import_id: `X-${i}` }));
    const p = parseBulkImport(JSON.stringify({ schema_version: 1, invoices: many }), ENTITY);
    expect(p.ok).toBe(false);
    expect(p.errors.map((e) => e.message).join()).toMatch(/Maximal 100 Rechnungen/);
  });

  it('warns — rather than silently dropping — when a client supplies a derived total', () => {
    const p = parseBulkImport(doc({ invoices: [invoice({ gross_total_cents: 999999, status: 'paid' })] }), ENTITY);
    expect(p.ok).toBe(true);
    const warned = p.warnings.map((w) => w.message).join(' | ');
    expect(warned).toMatch(/gross_total_cents/);
    expect(warned).toMatch(/status/);
    expect(warned).toMatch(/serverseitig berechnet/);
  });
});

describe('customer resolution never guesses', () => {
  const byName = doc({ invoices: [invoice({ customer: { name: 'Beispielkunde GmbH' } })] });

  it('collects names that still need resolving', () => {
    const p = parseBulkImport(byName, ENTITY);
    expect(p.unresolvedNames).toEqual(['Beispielkunde GmbH']);
  });

  it('fills in a unique match', () => {
    const p = applyCustomerResolutions(parseBulkImport(byName, ENTITY),
      [{ name: 'Beispielkunde GmbH', organization_id: ORG, ambiguous: false, match_count: 1 }]);
    expect(p.ok).toBe(true);
    expect(p.payload?.invoices?.[0].customer?.organization_id).toBe(ORG);
  });

  it('STOPS the row when the name is ambiguous', () => {
    const p = applyCustomerResolutions(parseBulkImport(byName, ENTITY),
      [{ name: 'Beispielkunde GmbH', organization_id: null, ambiguous: true, match_count: 2 }]);
    expect(p.ok).toBe(false);
    expect(p.errors.map((e) => e.message).join()).toMatch(/mehrdeutig \(2 Treffer\)/);
    expect(p.payload?.invoices?.[0].customer?.organization_id).toBeNull();
  });

  it('STOPS the row when the name matches nothing', () => {
    const p = applyCustomerResolutions(parseBulkImport(byName, ENTITY),
      [{ name: 'Beispielkunde GmbH', organization_id: null, ambiguous: false, match_count: 0 }]);
    expect(p.ok).toBe(false);
    expect(p.errors.map((e) => e.message).join()).toMatch(/nicht gefunden/);
  });

  it('leaves an explicit organization_id alone', () => {
    const p = applyCustomerResolutions(parseBulkImport(doc(), ENTITY), []);
    expect(p.ok).toBe(true);
    expect(p.payload?.invoices?.[0].customer?.organization_id).toBe(ORG);
  });
});

describe('the copyable template is itself valid', () => {
  it('parses cleanly through the same validator', () => {
    const p = parseBulkImport(bulkImportTemplate(), ENTITY);
    // Its customers are named, not id'd, so it is valid but awaiting resolution.
    expect(p.errors).toEqual([]);
    expect(p.invoiceCount).toBe(1);
    expect(p.contractCount).toBe(1);
    expect(p.paymentCount).toBe(3);
    expect(p.unresolvedNames).toEqual(['Beispielkunde GmbH']);
  });
});
