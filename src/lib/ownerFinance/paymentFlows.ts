/**
 * Payment-flow classification — the finance firewall in one place.
 *
 * `owner_payments` is a *cash-transaction ledger*, not a revenue ledger. A row carries
 * two independent axes, both enforced by the database
 * (`supabase/migrations/20260722120000_owner_finance_cockpit.sql`):
 *
 *   `direction`  inflow | outflow                — which way the money moved
 *   `kind`       income | expense | owner_contribution | owner_withdrawal
 *                | tax_payment | tax_refund | transfer
 *
 * The distinction is not cosmetic. `owner_finance_period_summary` returns
 * `cash_in_cents` as the sum of *every* inflow and `cash_out_cents` as the sum of
 * *every* outflow, over all kinds. Neither is customer revenue and neither is a paid
 * business expense: a private capital injection, a tax refund and a transfer between
 * the owner's own accounts all land in `cash_in_cents`; an owner withdrawal, a tax
 * payment and the other side of that transfer all land in `cash_out_cents`.
 *
 * Presenting either figure as "Kundenzahlungen" or "Bezahlte Ausgaben" would overstate
 * the business. This module is the single place that decides which rows mean what, so
 * two surfaces cannot disagree and a mislabel cannot be introduced page by page.
 *
 * No accounting logic is defined here and nothing is computed that the ledger does not
 * already state. This is classification and summation over the existing `kind` column —
 * tax, VAT and EÜR semantics live in `taxSnapshot.ts` and the SQL, untouched.
 */

/** The `kind` values `owner_payments.kind`'s check constraint permits. */
export const PAYMENT_KINDS = [
  'income', 'expense', 'owner_contribution', 'owner_withdrawal',
  'tax_payment', 'tax_refund', 'transfer',
] as const;

export type PaymentKind = (typeof PAYMENT_KINDS)[number];
export type PaymentDirection = 'inflow' | 'outflow';

/** The minimum a row must carry to be classified. Every read that reaches this module selects `kind`. */
export interface PaymentFlowRow {
  payment_date: string | null;
  direction: string;
  kind: string;
  amount_cents: number;
}

/**
 * Money a customer or other business counterparty actually paid us.
 *
 * The DB trigger already guarantees `kind = 'income'` implies `direction = 'inflow'`,
 * but both are asserted here: this predicate is the definition the KPI is named after,
 * and it must not depend on a constraint holding somewhere else.
 */
export function isBusinessCollection(row: Pick<PaymentFlowRow, 'direction' | 'kind'>): boolean {
  return row.direction === 'inflow' && row.kind === 'income';
}

/** An operating expense that was actually paid out. Never an owner withdrawal, tax payment or transfer. */
export function isOperatingExpensePayment(row: Pick<PaymentFlowRow, 'direction' | 'kind'>): boolean {
  return row.direction === 'outflow' && row.kind === 'expense';
}

/**
 * A cash movement that is real liquidity but not business result: the owner's own
 * capital, the tax account, or a move between the owner's accounts. It belongs in a
 * liquidity figure and never in a revenue or expense figure.
 */
export function isNonOperatingFlow(row: Pick<PaymentFlowRow, 'direction' | 'kind'>): boolean {
  return !isBusinessCollection(row) && !isOperatingExpensePayment(row);
}

export interface PaymentFlowTotals {
  /** direction = inflow AND kind = income. The only figure that means a customer paid. */
  collectionsCents: number;
  /** direction = outflow AND kind = expense. The only figure that means an operating expense was paid. */
  operatingExpensePaymentsCents: number;
  /** Every inflow, all kinds. Equals `owner_finance_period_summary.cash_in_cents` over the same period. */
  liquidityInCents: number;
  /** Every outflow, all kinds. Equals `owner_finance_period_summary.cash_out_cents` over the same period. */
  liquidityOutCents: number;
  /** liquidityIn − liquidityOut. Net movement of cash — NOT an operating result. */
  netLiquidityCents: number;
  /** Inflows that are not customer income (owner capital, tax refunds, incoming transfers). */
  nonOperatingInCents: number;
  /** Outflows that are not operating expenses (owner withdrawals, tax payments, outgoing transfers). */
  nonOperatingOutCents: number;
  /** How many rows carried a `kind` this build does not know. Surfaced rather than silently bucketed. */
  unknownKindCount: number;
}

const KNOWN = new Set<string>(PAYMENT_KINDS);

/** Every headline cash figure, each defined by its own filter rather than by subtraction. */
export function summarisePaymentFlows(payments: PaymentFlowRow[]): PaymentFlowTotals {
  const totals: PaymentFlowTotals = {
    collectionsCents: 0,
    operatingExpensePaymentsCents: 0,
    liquidityInCents: 0,
    liquidityOutCents: 0,
    netLiquidityCents: 0,
    nonOperatingInCents: 0,
    nonOperatingOutCents: 0,
    unknownKindCount: 0,
  };

  for (const row of payments) {
    if (!KNOWN.has(row.kind)) totals.unknownKindCount += 1;

    if (row.direction === 'inflow') {
      totals.liquidityInCents += row.amount_cents;
      if (isBusinessCollection(row)) totals.collectionsCents += row.amount_cents;
      else totals.nonOperatingInCents += row.amount_cents;
    } else if (row.direction === 'outflow') {
      totals.liquidityOutCents += row.amount_cents;
      if (isOperatingExpensePayment(row)) totals.operatingExpensePaymentsCents += row.amount_cents;
      else totals.nonOperatingOutCents += row.amount_cents;
    }
    // A row with neither direction cannot exist under the check constraint; if one ever
    // does, it is counted nowhere rather than guessed into a bucket.
  }

  totals.netLiquidityCents = totals.liquidityInCents - totals.liquidityOutCents;
  return totals;
}

export interface MonthlyPaymentFlows {
  /** Customer/business collections per calendar month, index 0 = January. */
  collections: number[];
  /** Paid operating expenses per calendar month. */
  operatingExpenses: number[];
  /** All inflows per month, every kind. */
  liquidityIn: number[];
  /** All outflows per month, every kind. */
  liquidityOut: number[];
  /** Running cumulative (liquidityIn − liquidityOut). Net liquidity position, not profit. */
  cumulativeNetLiquidity: number[];
}

/**
 * The same classification, resolved per month — the series behind the overview charts
 * and the command-center sparkline. Both liquidity and the operating split are returned
 * so a caller picks the one its label promises instead of relabelling one series.
 */
export function monthlyPaymentFlows(payments: PaymentFlowRow[]): MonthlyPaymentFlows {
  const zero = () => Array.from({ length: 12 }, () => 0);
  const collections = zero();
  const operatingExpenses = zero();
  const liquidityIn = zero();
  const liquidityOut = zero();

  for (const row of payments) {
    if (!row.payment_date) continue;
    const index = Number(row.payment_date.slice(5, 7)) - 1;
    if (!Number.isInteger(index) || index < 0 || index > 11) continue;

    if (row.direction === 'inflow') {
      liquidityIn[index] += row.amount_cents;
      if (isBusinessCollection(row)) collections[index] += row.amount_cents;
    } else if (row.direction === 'outflow') {
      liquidityOut[index] += row.amount_cents;
      if (isOperatingExpensePayment(row)) operatingExpenses[index] += row.amount_cents;
    }
  }

  let running = 0;
  const cumulativeNetLiquidity = liquidityIn.map((value, index) => {
    running += value - liquidityOut[index];
    return running;
  });

  return { collections, operatingExpenses, liquidityIn, liquidityOut, cumulativeNetLiquidity };
}

/**
 * What each kind is, in the owner's language. Used wherever a single cash event is shown
 * on its own, so a tax refund is never captioned as a customer payment.
 */
export const PAYMENT_KIND_LABEL_DE: Record<PaymentKind, string> = {
  income: 'Zahlungseingang',
  expense: 'Ausgabe bezahlt',
  owner_contribution: 'Privateinlage',
  owner_withdrawal: 'Privatentnahme',
  tax_payment: 'Steuerzahlung',
  tax_refund: 'Steuererstattung',
  transfer: 'Umbuchung',
};
