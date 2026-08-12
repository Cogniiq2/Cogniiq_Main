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

export function reconciliationCounts(entries: ReconciliationEntry[]): ReconciliationCounts {
  const refundedTotalCents = entries.reduce((sum, entry) => sum + entry.refundAmountCents, 0);
  return {
    totalPayments: entries.length,
    matched: entries.filter((entry) => entry.issue === 'matched').length,
    openReview: entries.filter((entry) => entry.severity === 'warning' || entry.severity === 'critical')
      .length,
    falseRefunds: entries.filter(
      (entry) => entry.issue === 'active_booking_refunded' || entry.issue === 'false_refund_likely',
    ).length,
    moneyToRecoverCents: entries.reduce((sum, entry) => sum + entry.moneyToRecoverCents, 0),
    refundedTotalCents,
    cancellationRefundsCents: entries
      .filter((entry) => entry.issue === 'customer_cancellation')
      .reduce((sum, entry) => sum + entry.refundAmountCents, 0),
    doubleBookingRefundsCents: entries
      .filter((entry) => entry.issue === 'double_booking')
      .reduce((sum, entry) => sum + entry.refundAmountCents, 0),
  };
}
