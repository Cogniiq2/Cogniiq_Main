import { describe, expect, it } from 'vitest';

import {
  PAYMENT_KINDS, isBusinessCollection, isNonOperatingFlow, isOperatingExpensePayment,
  monthlyPaymentFlows, summarisePaymentFlows, type PaymentFlowRow,
} from '@/lib/ownerFinance/paymentFlows';
import { buildRecent } from '@/lib/ownerFinance/commandCenter';
import type { OwnerInvoice } from '@/lib/ownerFinance/types';

/**
 * The finance firewall.
 *
 * `owner_payments` mixes six kinds of cash event in one ledger. The failure this suite
 * exists to prevent is the quiet one: a private capital contribution counted as customer
 * revenue, a tax payment counted as a business expense, a transfer counted as both.
 * Every assertion below is about a figure the owner reads and makes a decision on.
 *
 * The fixture carries one row of every kind/direction combination the check constraint
 * permits, with distinct amounts, so a bucket that swallows the wrong row cannot produce
 * a coincidentally correct total.
 */

const LEDGER: PaymentFlowRow[] = [
  { payment_date: '2026-01-10', direction: 'inflow', kind: 'income', amount_cents: 100_000 },
  { payment_date: '2026-02-10', direction: 'inflow', kind: 'income', amount_cents: 20_000 },
  { payment_date: '2026-02-14', direction: 'outflow', kind: 'expense', amount_cents: 7_000 },
  { payment_date: '2026-03-01', direction: 'inflow', kind: 'owner_contribution', amount_cents: 500_000 },
  { payment_date: '2026-03-20', direction: 'outflow', kind: 'owner_withdrawal', amount_cents: 300_000 },
  { payment_date: '2026-04-05', direction: 'outflow', kind: 'tax_payment', amount_cents: 40_000 },
  { payment_date: '2026-04-25', direction: 'inflow', kind: 'tax_refund', amount_cents: 9_000 },
  { payment_date: '2026-05-02', direction: 'inflow', kind: 'transfer', amount_cents: 1_000 },
  { payment_date: '2026-05-02', direction: 'outflow', kind: 'transfer', amount_cents: 1_000 },
];

const COLLECTIONS = 120_000;      // 100.000 + 20.000
const OPERATING_EXPENSES = 7_000;
const LIQUIDITY_IN = 630_000;     // 100.000 + 20.000 + 500.000 + 9.000 + 1.000
const LIQUIDITY_OUT = 348_000;    // 7.000 + 300.000 + 40.000 + 1.000

describe('the ledger fixture', () => {
  it('covers every kind the database permits, in both directions where the trigger allows it', () => {
    // A firewall proven against a fixture that omits a kind proves nothing about that kind.
    expect(new Set(LEDGER.map((r) => r.kind))).toEqual(new Set(PAYMENT_KINDS));
    expect(LEDGER.filter((r) => r.kind === 'transfer').map((r) => r.direction).sort())
      .toEqual(['inflow', 'outflow']);
  });
});

describe('classification predicates', () => {
  it('treats only income inflows as a business collection', () => {
    const collected = LEDGER.filter(isBusinessCollection);
    expect(collected.map((r) => r.kind)).toEqual(['income', 'income']);
    for (const kind of ['owner_contribution', 'tax_refund', 'transfer'] as const) {
      expect(isBusinessCollection({ direction: 'inflow', kind })).toBe(false);
    }
  });

  it('treats only expense outflows as a paid operating expense', () => {
    const paid = LEDGER.filter(isOperatingExpensePayment);
    expect(paid.map((r) => r.kind)).toEqual(['expense']);
    for (const kind of ['owner_withdrawal', 'tax_payment', 'transfer'] as const) {
      expect(isOperatingExpensePayment({ direction: 'outflow', kind })).toBe(false);
    }
  });

  it('does not let a kind pass by direction alone', () => {
    // Both axes are checked. A row that somehow carried kind = 'income' with an outflow
    // direction is a data fault, not a collection.
    expect(isBusinessCollection({ direction: 'outflow', kind: 'income' })).toBe(false);
    expect(isOperatingExpensePayment({ direction: 'inflow', kind: 'expense' })).toBe(false);
  });

  it('classifies every non-business movement as non-operating', () => {
    const nonOperating = LEDGER.filter(isNonOperatingFlow);
    expect(nonOperating.map((r) => r.kind).sort()).toEqual(
      ['owner_contribution', 'owner_withdrawal', 'tax_payment', 'tax_refund', 'transfer', 'transfer'],
    );
  });
});

describe('summarisePaymentFlows', () => {
  const totals = summarisePaymentFlows(LEDGER);

  it('counts customer collections as income inflows only', () => {
    expect(totals.collectionsCents).toBe(COLLECTIONS);
  });

  it('counts paid operating expenses as expense outflows only', () => {
    expect(totals.operatingExpensePaymentsCents).toBe(OPERATING_EXPENSES);
  });

  it('counts total liquidity over every kind, matching what cash_in_cents / cash_out_cents mean', () => {
    expect(totals.liquidityInCents).toBe(LIQUIDITY_IN);
    expect(totals.liquidityOutCents).toBe(LIQUIDITY_OUT);
    expect(totals.netLiquidityCents).toBe(LIQUIDITY_IN - LIQUIDITY_OUT);
  });

  it('never lets an owner contribution, a tax refund or an incoming transfer raise customer collections', () => {
    const withoutIncome = LEDGER.filter((r) => r.kind !== 'income');
    const t = summarisePaymentFlows(withoutIncome);
    expect(t.collectionsCents).toBe(0);
    // …while the same rows still move liquidity, which is the whole point of the split.
    expect(t.liquidityInCents).toBe(510_000);
  });

  it('never lets an owner withdrawal, a tax payment or an outgoing transfer become an operating expense', () => {
    const withoutExpenses = LEDGER.filter((r) => r.kind !== 'expense');
    const t = summarisePaymentFlows(withoutExpenses);
    expect(t.operatingExpensePaymentsCents).toBe(0);
    expect(t.liquidityOutCents).toBe(341_000);
  });

  it('keeps the liquidity totals apart from the operating totals', () => {
    // The bug this pass corrected was presenting these as the same figure.
    expect(totals.liquidityInCents).not.toBe(totals.collectionsCents);
    expect(totals.liquidityOutCents).not.toBe(totals.operatingExpensePaymentsCents);
    expect(totals.nonOperatingInCents).toBe(LIQUIDITY_IN - COLLECTIONS);
    expect(totals.nonOperatingOutCents).toBe(LIQUIDITY_OUT - OPERATING_EXPENSES);
  });

  it('reports an unrecognised kind instead of bucketing it into a business figure', () => {
    const t = summarisePaymentFlows([
      ...LEDGER,
      { payment_date: '2026-06-01', direction: 'inflow', kind: 'something_new', amount_cents: 5_000 },
    ]);
    expect(t.unknownKindCount).toBe(1);
    expect(t.collectionsCents).toBe(COLLECTIONS);
    expect(t.liquidityInCents).toBe(LIQUIDITY_IN + 5_000);
  });

  it('returns zeroes for an empty ledger rather than NaN', () => {
    expect(summarisePaymentFlows([])).toMatchObject({
      collectionsCents: 0, operatingExpensePaymentsCents: 0,
      liquidityInCents: 0, liquidityOutCents: 0, netLiquidityCents: 0,
    });
  });
});

describe('monthlyPaymentFlows', () => {
  const series = monthlyPaymentFlows(LEDGER);

  it('puts each classified figure in its own month, split the same way as the totals', () => {
    expect(series.collections[0]).toBe(100_000);
    expect(series.collections[1]).toBe(20_000);
    expect(series.operatingExpenses[1]).toBe(7_000);
    // March is an owner contribution and a withdrawal: liquidity moves, business does not.
    expect(series.collections[2]).toBe(0);
    expect(series.operatingExpenses[2]).toBe(0);
    expect(series.liquidityIn[2]).toBe(500_000);
    expect(series.liquidityOut[2]).toBe(300_000);
  });

  it('accumulates net liquidity across the year over every kind', () => {
    expect(series.cumulativeNetLiquidity.slice(0, 5)).toEqual([
      100_000,                                    // Jan
      100_000 + 20_000 - 7_000,                   // Feb
      113_000 + 500_000 - 300_000,                // Mär
      313_000 - 40_000 + 9_000,                   // Apr
      282_000 + 1_000 - 1_000,                    // Mai — a transfer nets to nothing
    ]);
    expect(series.cumulativeNetLiquidity[11]).toBe(LIQUIDITY_IN - LIQUIDITY_OUT);
  });

  it('ignores a row without a payment date rather than dropping it into January', () => {
    const s = monthlyPaymentFlows([{ payment_date: null, direction: 'inflow', kind: 'income', amount_cents: 999 }]);
    expect(s.collections.reduce((a, b) => a + b, 0)).toBe(0);
  });
});

/* ------------------------------------------------- the same firewall in the UI feed */

const invoice = (over: Partial<OwnerInvoice> = {}): OwnerInvoice => ({
  id: 'i1', business_entity_id: 'e1', invoice_number: 'RE-2026-001', status: 'issued',
  issue_date: '2026-01-05', due_date: '2026-01-19', service_period_start: null, service_period_end: null,
  customer_name: 'Muster GmbH', customer_address: null, customer_vat_id: null, customer_email: null,
  net_total_cents: 100_000, vat_total_cents: 19_000, gross_total_cents: 119_000, amount_paid_cents: 0,
  paid_at: null, notes: null, cancelled_at: null, cancellation_reason: null,
  issued_at: '2026-01-05T00:00:00Z', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
  ...over,
} as OwnerInvoice);

describe('buildRecent respects the same classification', () => {
  const payments = LEDGER.map((row, index) => ({
    id: `p${index}`, ...row, payment_date: row.payment_date, invoice_id: null as string | null,
  }));

  it('presents only income inflows as a payment', () => {
    const items = buildRecent({ invoices: [], offers: [], payments });
    expect(items).toHaveLength(2);
    expect(items.every((i) => i.title === 'Zahlungseingang verbucht')).toBe(true);
  });

  it('never routes a non-income cash event to the invoice surface', () => {
    const items = buildRecent({ invoices: [], offers: [], payments });
    // Nothing that is not a customer payment reaches the list at all, so no owner
    // contribution, tax refund or transfer can be linked to an invoice or its list.
    expect(items.some((i) => (i.to ?? '').includes('/invoices'))).toBe(false);
  });

  it('links an invoice-linked collection to that invoice and leaves an unlinked one without a destination', () => {
    const items = buildRecent({
      invoices: [invoice({ id: 'inv-1', invoice_number: 'RE-2026-007' })],
      offers: [],
      payments: [
        { id: 'p-linked', payment_date: '2026-07-01', direction: 'inflow', kind: 'income', amount_cents: 5_000, invoice_id: 'inv-1' },
        { id: 'p-loose', payment_date: '2026-07-02', direction: 'inflow', kind: 'income', amount_cents: 5_000, invoice_id: null },
      ],
    });
    const linked = items.find((i) => i.id === 'pay-p-linked')!;
    const loose = items.find((i) => i.id === 'pay-p-loose')!;
    expect(linked.to).toBe('/admin/finance/invoices/inv-1');
    expect(linked.meta).toBe('RE-2026-007');
    // There is no payments workspace, so an unlinked payment gets no route rather than
    // a link into a list it does not appear in.
    expect(loose.to).toBeUndefined();
    expect(loose.meta).toBe('Ohne Rechnungsbezug');
  });

  it('keeps an owner contribution out of the feed even when it is the only cash event', () => {
    const items = buildRecent({
      invoices: [], offers: [],
      payments: [{ id: 'p-cap', payment_date: '2026-07-03', direction: 'inflow', kind: 'owner_contribution', amount_cents: 999_000, invoice_id: null }],
    });
    expect(items).toEqual([]);
  });
});
