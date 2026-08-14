// Reconciliation rows, derived by running every payment through the classifier.
//
// Nothing here is hand-classified: the anomalies come from the payment and booking fixtures, and
// their classification comes from `reconciliation.ts`. That means the rows shown are exactly what
// the rules produce, which is what makes them worth testing.

import { buildReconciliationEntry } from '../reconciliation';
import type { ReconciliationCounts, ReconciliationEntry } from '../types';
import { findBookingByReference } from './bookings';
import { fixtureInvoices } from './invoices';
import { fixturePayments } from './payments';

function invoiceStatusFor(bookingReference: string | null): ReconciliationEntry['invoiceStatus'] {
  if (!bookingReference) return null;
  return fixtureInvoices.find((invoice) => invoice.bookingReference === bookingReference)?.status ?? null;
}

export const fixtureReconciliation: ReconciliationEntry[] = fixturePayments.map((payment) => {
  const booking =
    payment.referenceType === 'booking' ? findBookingByReference(payment.referenceLabel) : null;
  return buildReconciliationEntry(payment, booking, invoiceStatusFor);
});

/**
 * Roll-up of a reconciliation page, over already-classified entries.
 *
 * `ReconciliationCounts.cancellationRefundsCents` and `.doubleBookingRefundsCents` are typed
 * `number | null` because the *gateway* will not be able to compute them: both reasons are only
 * recognisable through the payment's `metaClass`, which has no authorised upstream source, and it
 * will emit `null` rather than a `0` that would read as "no cancellation refunds".
 *
 * This function cannot make that determination and does not try to guess at it. It receives entries
 * whose issue is already decided, and an entry's issue does not record *why* it was decided — a
 * `needs_review` row may be an unclassifiable payment or an ordinary failed one, and treating the
 * two alike would null out figures that are perfectly well known. Over fixture data, where every
 * class is present, these are real numbers.
 */
export function reconciliationCounts(entries: ReconciliationEntry[]): ReconciliationCounts {
  // One unknown refund amount makes every refund sum unknowable: the missing addend could be any
  // value, so the sum of the rest is a floor, not a total.
  const anyRefundUnknown = entries.some((entry) => entry.refundAmountCents === null);
  const sumRefunds = (rows: ReconciliationEntry[]): number | null =>
    anyRefundUnknown ? null : rows.reduce((sum, entry) => sum + (entry.refundAmountCents as number), 0);

  return {
    totalPayments: entries.length,
    matched: entries.filter((entry) => entry.issue === 'matched').length,
    openReview: entries.filter((entry) => entry.severity === 'warning' || entry.severity === 'critical')
      .length,
    // A count of issue classes, not a monetary aggregate, and it reports "none identified" rather
    // than "none exist" — which stays true when refund information is missing.
    //
    // Where such a row does show up: the entry list, as `needs_review` ("Prüfung erforderlich"). It
    // is **not** counted in `openReview`, which tallies only `warning` and `critical` severities,
    // and `needs_review` carries `info`. Whether an unexaminable row belongs in an outstanding-work
    // counter is a business question, deliberately not answered by this contract correction.
    falseRefunds: entries.filter(
      (entry) => entry.issue === 'active_booking_refunded' || entry.issue === 'false_refund_likely',
    ).length,
    moneyToRecoverCents: entries.reduce((sum, entry) => sum + entry.moneyToRecoverCents, 0),
    refundedTotalCents: sumRefunds(entries),
    cancellationRefundsCents: sumRefunds(
      entries.filter((entry) => entry.issue === 'customer_cancellation'),
    ),
    doubleBookingRefundsCents: sumRefunds(
      entries.filter((entry) => entry.issue === 'double_booking'),
    ),
  };
}
