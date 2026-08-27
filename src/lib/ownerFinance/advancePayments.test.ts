// Advance payments (Anzahlungen) in the bulk-import parser, and the error normalisation that
// makes "[object Object]" impossible to render.
//
// The second half of this file exists because of a real defect: a missing RPC reached the
// owner as "Kundenabgleich fehlgeschlagen: [object Object]". PostgREST returns a PLAIN object
// on the { data, error } path — not an Error — so `e instanceof Error ? e.message : String(e)`
// fell through to String() and printed nothing usable. These tests pin the normaliser against
// every shape that path can produce.
import { describe, expect, it } from 'vitest';

import { parseBulkImport, applyCustomerResolutions } from '@/lib/ownerFinance/bulkImport';
// Imported from errorText, not api: the normaliser is deliberately free of any Supabase-client
// dependency so this suite runs without VITE_SUPABASE_URL. api.ts re-exports both names.
import { describeSupabaseError, isMissingBackendError } from '@/lib/ownerFinance/errorText';
import { paymentKindLabel, isAdvancePayment } from '@/lib/ownerFinance/paymentMethods';

const ENTITY = '11111111-1111-1111-1111-111111111111';
const ORG = '22222222-2222-2222-2222-222222222222';

/** RE-2026-001, the real case: two Anzahlungen in 2025 and a Restzahlung in 2026. */
const realInvoice = (payments: unknown[]) => ({
  client_import_id: 'RE-2026-001',
  customer: { organization_id: ORG },
  issue_date: '2026-02-28',
  service_date: '2026-02-28',
  lines: [{ description: 'Digitalisierung', quantity_milli: 1000, unit_price_cents: 490000, vat_rate_bp: 1900, vat_treatment: 'standard' }],
  payments,
});
const doc = (payments: unknown[]) => JSON.stringify({ schema_version: 1, invoices: [realInvoice(payments)] });

const REAL_PAYMENTS = [
  { payment_date: '2025-10-23', amount_cents: 196000, method: 'bank_transfer', reference: 'Abschlagszahlung 1', payment_kind: 'advance_payment' },
  { payment_date: '2025-11-12', amount_cents: 196000, method: 'bank_transfer', reference: 'Abschlagszahlung 2', payment_kind: 'advance_payment' },
  { payment_date: '2026-06-02', amount_cents: 191100, method: 'bank_transfer', reference: 'Restzahlung', payment_kind: 'invoice_payment' },
];

describe('a real historical invoice with pre-invoice advances', () => {
  it('accepts the real dates and amounts without changing any of them', () => {
    const preview = parseBulkImport(doc(REAL_PAYMENTS), ENTITY);
    expect(preview.errors).toEqual([]);
    expect(preview.ok).toBe(true);

    const out = preview.payload?.invoices?.[0].payments ?? [];
    expect(out.map((p) => [p.payment_date, p.amount_cents, p.payment_kind])).toEqual([
      ['2025-10-23', 196000, 'advance_payment'],
      ['2025-11-12', 196000, 'advance_payment'],
      ['2026-06-02', 191100, 'invoice_payment'],
    ]);
  });

  it('reconciles to gross 5.831,00 fully paid with nothing open', () => {
    const preview = parseBulkImport(doc(REAL_PAYMENTS), ENTITY);
    expect(preview.netCents).toBe(490000);
    expect(preview.vatCents).toBe(93100);
    expect(preview.grossCents).toBe(583100);
    expect(preview.paidCents).toBe(583100);
    expect(preview.grossCents - preview.paidCents).toBe(0);
  });

  it('still refuses an UNDECLARED payment before the invoice date, and names the fix', () => {
    const preview = parseBulkImport(doc([{ payment_date: '2025-10-23', amount_cents: 196000 }]), ENTITY);
    expect(preview.ok).toBe(false);
    expect(preview.errors[0].message).toContain('vor dem Rechnungsdatum');
    expect(preview.errors[0].message).toContain('advance_payment');
  });

  it('refuses an advance that does not actually predate the invoice', () => {
    const preview = parseBulkImport(doc([{ payment_date: '2026-03-15', amount_cents: 196000, payment_kind: 'advance_payment' }]), ENTITY);
    expect(preview.ok).toBe(false);
    expect(preview.errors.some((e) => e.message.includes('nicht vor dem Rechnungsdatum'))).toBe(true);
  });

  it('refuses an unknown payment_kind rather than silently treating it as ordinary', () => {
    const preview = parseBulkImport(doc([{ payment_date: '2026-03-15', amount_cents: 196000, payment_kind: 'prepayment' }]), ENTITY);
    expect(preview.ok).toBe(false);
    expect(preview.errors.some((e) => e.message.includes('payment_kind'))).toBe(true);
  });

  it('still refuses advances that would overpay the invoice', () => {
    const preview = parseBulkImport(doc([
      { payment_date: '2025-10-23', amount_cents: 400000, payment_kind: 'advance_payment' },
      { payment_date: '2025-11-12', amount_cents: 400000, payment_kind: 'advance_payment' },
    ]), ENTITY);
    expect(preview.ok).toBe(false);
    expect(preview.errors.some((e) => e.message.includes('übersteigen'))).toBe(true);
  });
});

describe('schema_version 1 stayed backward compatible', () => {
  it('treats a payment with no payment_kind as an ordinary payment', () => {
    const preview = parseBulkImport(doc([{ payment_date: '2026-06-02', amount_cents: 583100 }]), ENTITY);
    expect(preview.ok).toBe(true);
    expect(preview.payload?.invoices?.[0].payments?.[0].payment_kind).toBe('invoice_payment');
  });

  it('accepts a payload written before advances existed, unchanged', () => {
    const legacy = JSON.stringify({
      schema_version: 1,
      invoices: [{
        client_import_id: '2026-001',
        customer: { organization_id: ORG },
        issue_date: '2026-01-10',
        lines: [{ description: 'X', quantity_milli: 1000, unit_price_cents: 1000000, vat_rate_bp: 1900, vat_treatment: 'standard' }],
        payments: [
          { payment_date: '2026-01-15', amount_cents: 300000 },
          { payment_date: '2026-02-15', amount_cents: 890000 },
        ],
      }],
    });
    const preview = parseBulkImport(legacy, ENTITY);
    expect(preview.ok).toBe(true);
    expect(preview.paidCents).toBe(1190000);
    expect(preview.payload?.invoices?.[0].payments?.every((p) => p.payment_kind === 'invoice_payment')).toBe(true);
  });
});

describe('payment kinds are labelled, never left as raw tokens', () => {
  it('renders German labels', () => {
    expect(paymentKindLabel('advance_payment')).toBe('Anzahlung');
    expect(paymentKindLabel('invoice_payment')).toBe('Zahlung');
  });

  it('treats a row written before the column existed as an ordinary payment', () => {
    expect(paymentKindLabel(null)).toBe('Zahlung');
    expect(paymentKindLabel(undefined)).toBe('Zahlung');
    expect(paymentKindLabel('')).toBe('Zahlung');
    expect(isAdvancePayment(null)).toBe(false);
    expect(isAdvancePayment('advance_payment')).toBe(true);
  });
});

describe('describeSupabaseError makes "[object Object]" unreachable', () => {
  // The exact shape PostgREST hands back for a function that is not in the schema cache,
  // which is what the owner actually hit. It is a plain object: NOT an Error.
  const missingRpc = {
    code: 'PGRST202',
    details: 'Searched for the function public.owner_resolve_import_customers',
    hint: null,
    message: 'Could not find the function public.owner_resolve_import_customers(p_entity, p_names) in the schema cache',
  };

  it('renders the useful sentence for a missing RPC instead of [object Object]', () => {
    const text = describeSupabaseError(missingRpc);
    expect(text).toContain('Could not find the function');
    expect(text).toContain('PGRST202');
    expect(text).not.toContain('[object Object]');
  });

  it('still recognises that shape as a missing backend, so the UI can name the migration', () => {
    expect(isMissingBackendError(missingRpc)).toBe(true);
  });

  it.each([
    ['a plain postgrest object', { code: '42501', message: 'permission denied', details: null, hint: null }],
    ['an object with only details', { details: 'nur Details' }],
    ['an object with only a code', { code: 'PGRST301' }],
    ['a real Error', new Error('kaputt')],
    ['a bare string', 'kaputt'],
    ['an empty object', {}],
    ['null', null],
    ['undefined', undefined],
    ['a number', 42],
    ['an array', [{ message: 'x' }]],
    ['an object with non-string fields', { message: 5, details: true }],
  ])('never yields [object Object] for %s', (_label, input) => {
    const text = describeSupabaseError(input);
    expect(text).not.toContain('[object Object]');
    expect(text.trim().length).toBeGreaterThan(0);
  });

  it('survives a circular object rather than throwing', () => {
    const circular: Record<string, unknown> = { code: null, message: null };
    circular.self = circular;
    expect(() => describeSupabaseError(circular)).not.toThrow();
    expect(describeSupabaseError(circular)).not.toContain('[object Object]');
  });

  it('does not repeat a message that PostgREST also copied into details', () => {
    expect(describeSupabaseError({ message: 'gleich', details: 'gleich' })).toBe('gleich');
  });
});

describe('customer resolution failures stay legible', () => {
  it('names the missing customer rather than guessing one', () => {
    const preview = parseBulkImport(JSON.stringify({
      schema_version: 1,
      invoices: [{ ...realInvoice(REAL_PAYMENTS), customer: { name: 'SV Heinersreuth e.V.' } }],
    }), ENTITY);
    const resolved = applyCustomerResolutions(preview, [
      { name: 'SV Heinersreuth e.V.', organization_id: null, ambiguous: false, match_count: 0 },
    ]);
    expect(resolved.ok).toBe(false);
    expect(resolved.errors.some((e) => e.message.includes('SV Heinersreuth e.V.') && e.message.includes('nicht gefunden'))).toBe(true);
    expect(resolved.errors.every((e) => !e.message.includes('[object Object]'))).toBe(true);
  });

  it('reports an ambiguous customer with its match count instead of picking one', () => {
    const preview = parseBulkImport(JSON.stringify({
      schema_version: 1,
      invoices: [{ ...realInvoice(REAL_PAYMENTS), customer: { name: 'Doppelt GmbH' } }],
    }), ENTITY);
    const resolved = applyCustomerResolutions(preview, [
      { name: 'Doppelt GmbH', organization_id: null, ambiguous: true, match_count: 2 },
    ]);
    expect(resolved.ok).toBe(false);
    expect(resolved.errors.some((e) => e.message.includes('mehrdeutig') && e.message.includes('2 Treffer'))).toBe(true);
  });
});
