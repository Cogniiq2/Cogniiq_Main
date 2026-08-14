// Reconciliation classification.
//
// Pure business logic: given a payment and the booking it claims to settle, decide what — if
// anything — is wrong. Kept out of the fixtures and out of the components so the rules can be
// tested directly, and so a later gateway adapter classifies rows exactly the same way.
//
// The eight issue types and four severities mirror the reference dashboard's model.

import type {
  Booking,
  Payment,
  ReconciliationEntry,
  ReconciliationIssue,
  ReconciliationSeverity,
} from './types';

/** Severity follows from the issue; it is never chosen independently. */
export const severityForIssue: Record<ReconciliationIssue, ReconciliationSeverity> = {
  matched: 'ok',
  customer_cancellation: 'info',
  needs_review: 'info',
  double_booking: 'warning',
  amount_mismatch: 'warning',
  false_refund_likely: 'warning',
  active_booking_refunded: 'critical',
  paid_no_booking: 'critical',
};

/** German next step. Advisory text only — nothing in this phase acts on it. */
export const suggestedActionForIssue: Record<ReconciliationIssue, string> = {
  matched: 'Keine Maßnahme erforderlich.',
  customer_cancellation: 'Erstattung dokumentiert — keine Maßnahme erforderlich.',
  needs_review: 'Zahlungsstatus manuell prüfen.',
  double_booking: 'Doppelbuchung prüfen und Platzbelegung korrigieren.',
  amount_mismatch: 'Differenz zwischen Buchung und Zahlung klären.',
  false_refund_likely: 'Erstattung prüfen — vermutlich zu Unrecht ausgelöst.',
  active_booking_refunded: 'Buchung ist weiterhin aktiv, Betrag wurde erstattet. Betrag nachfordern oder Buchung stornieren.',
  paid_no_booking: 'Zahlung ohne zugehörige Buchung. Buchung nachtragen oder Betrag erstatten.',
};

/**
 * Whether a "nothing is wrong" verdict is supportable at all.
 *
 * `matched` is the only outcome that asserts the *absence* of a problem, and it rests on checks that
 * cannot run without the payment's class and its refund amount. Neither has an authorised upstream
 * source, so both may be `null` — and when they are, a clean verdict would be a bill of health
 * issued without the examination.
 *
 * This gates every clean verdict, whatever the reference type. It deliberately does **not** gate the
 * findings above them: `paid_no_booking` and `amount_mismatch` are decided entirely from sourced
 * values (`grossCents`, the booking's absence, `booking.amountCents`), and demoting them to
 * `needs_review` would discard a critical finding and the recoverable money it identifies — trading
 * one falsehood for a worse one.
 */
function cleanVerdictIsSupportable(payment: Payment): boolean {
  return payment.metaClass !== null && payment.refundedCents !== null;
}

/**
 * Classify one payment against its booking.
 *
 * Order matters: the checks run from most to least serious, so a row that is both orphaned and
 * mismatched is reported as orphaned.
 */
export function classifyReconciliation(
  payment: Payment,
  booking: Booking | null,
): { issue: ReconciliationIssue; moneyToRecoverCents: number } {
  // A voucher purchase legitimately has no booking behind it.
  if (payment.referenceType === 'voucher') {
    if (payment.status === 'failed') {
      return { issue: 'needs_review', moneyToRecoverCents: 0 };
    }
    // The incomplete-data guard runs before this shortcut may call anything reconciled. Being a
    // voucher purchase is not itself evidence of health: a refunded one is indistinguishable from an
    // untouched one without a refund amount, and `matched` would be asserting exactly that
    // difference. Voucher payments have no authorised refund-amount source at all, so under a live
    // gateway this branch is expected to yield `needs_review` — fail-closed, not a fault.
    if (!cleanVerdictIsSupportable(payment)) {
      return { issue: 'needs_review', moneyToRecoverCents: 0 };
    }
    return { issue: 'matched', moneyToRecoverCents: 0 };
  }

  if (booking === null) {
    return { issue: 'paid_no_booking', moneyToRecoverCents: payment.grossCents };
  }

  // Money went back but the slot is still held: the club is out both the court and the fee.
  // An unknown refund amount cannot satisfy this test — `null > 0` is not a refund, it is silence.
  if (payment.refundedCents !== null && payment.refundedCents > 0 && booking.status === 'confirmed') {
    return { issue: 'active_booking_refunded', moneyToRecoverCents: payment.refundedCents };
  }

  if (payment.metaClass === 'double_booking') {
    return { issue: 'double_booking', moneyToRecoverCents: 0 };
  }

  if (payment.metaClass === 'customer_cancelled') {
    return { issue: 'customer_cancellation', moneyToRecoverCents: 0 };
  }

  if (payment.grossCents !== booking.amountCents) {
    return {
      issue: 'amount_mismatch',
      moneyToRecoverCents: Math.max(0, booking.amountCents - payment.grossCents),
    };
  }

  if (payment.status === 'failed' || payment.status === 'pending') {
    return { issue: 'needs_review', moneyToRecoverCents: 0 };
  }

  if (payment.status === 'refunded' && booking.status === 'cancelled') {
    return { issue: 'customer_cancellation', moneyToRecoverCents: 0 };
  }

  // Everything above is decidable without the payment's class or its refund amount. `matched` is
  // not — the same guard the voucher shortcut answers to, applied to the booking path's own clean
  // verdict. `moneyToRecoverCents: 0` here means nothing recoverable was *identified*, not that
  // nothing is recoverable: the checks that would have found an amount could not run.
  if (!cleanVerdictIsSupportable(payment)) {
    return { issue: 'needs_review', moneyToRecoverCents: 0 };
  }

  return { issue: 'matched', moneyToRecoverCents: 0 };
}

export function buildReconciliationEntry(
  payment: Payment,
  booking: Booking | null,
  invoiceStatusFor: (bookingReference: string | null) => ReconciliationEntry['invoiceStatus'],
): ReconciliationEntry {
  const { issue, moneyToRecoverCents } = classifyReconciliation(payment, booking);
  return {
    id: `rec-${payment.id}`,
    issue,
    severity: severityForIssue[issue],
    occurredAt: payment.occurredAt,
    // The booking is the authoritative source for the name (`bookings.customer_name`); the payment
    // carries one only in fixtures. An orphaned payment has neither, and stays null rather than
    // borrowing a name from somewhere it does not belong to.
    customerName: booking?.customerName ?? payment.customerName,
    bookingReference: payment.referenceType === 'booking' ? payment.referenceLabel : null,
    paymentReference: payment.reference,
    court: booking?.court ?? null,
    provider: payment.provider,
    bookingAmountCents: booking?.amountCents ?? 0,
    paymentAmountCents: payment.grossCents,
    refundAmountCents: payment.refundedCents,
    moneyToRecoverCents,
    bookingStatus: booking?.status ?? null,
    invoiceStatus: invoiceStatusFor(booking?.reference ?? null),
    suggestedAction: suggestedActionForIssue[issue],
  };
}
