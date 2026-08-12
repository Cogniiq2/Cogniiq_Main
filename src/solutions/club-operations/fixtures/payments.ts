// Payment ledger, derived from the booking fixtures.
//
// Every booking that was not free produces exactly one payment, so the ledger and the booking list
// can never drift apart. Voucher purchases are added on top, because buying a voucher is a payment
// that has no booking behind it — which is also what makes the reconciliation section interesting.
//
// No provider identifiers (session, intent, capture) and no contact details are modelled.

import type { Payment, PaymentMetaClass } from '../types';
import { fixtureBookings } from './bookings';

/**
 * Two booking references are marked as double bookings: the club refunded them because the slot was
 * sold twice. One is marked as a customer cancellation. Everything else is a regular payment.
 */
const doubleBookingRefunds = new Set(['BU-2047']);
const customerCancellations = new Set(['BU-2109', 'BU-2120']);

function metaClassFor(reference: string): PaymentMetaClass {
  if (doubleBookingRefunds.has(reference)) return 'double_booking';
  if (customerCancellations.has(reference)) return 'customer_cancelled';
  return 'standard';
}

/**
 * Deliberate discrepancies. A payment that disagrees with its booking is not a defect in the
 * fixtures — it is the material the reconciliation section exists to surface, and without it that
 * section would have nothing to show. Each entry here produces exactly one known anomaly.
 */
const capturedAmountOverrides: Record<string, number> = {
  // Captured 3,00 € less than the booking price: an "amount mismatch" row.
  'BU-2111': 4500,
};

const noteFor: Record<PaymentMetaClass, string | null> = {
  standard: null,
  double_booking: 'Platz doppelt vergeben — Betrag automatisch erstattet.',
  customer_cancelled: 'Kunde hat fristgerecht storniert.',
};

const bookingPayments: Payment[] = fixtureBookings
  .filter((booking) => booking.provider !== 'free')
  .map((booking, index) => {
    const metaClass = metaClassFor(booking.reference);
    const captured = capturedAmountOverrides[booking.reference] ?? booking.amountCents;
    const refunded = booking.paymentStatus === 'refunded' ? captured : 0;
    return {
      id: `pay-${String(index + 1).padStart(4, '0')}`,
      reference: `ZA-${3000 + index + 1}`,
      occurredAt: booking.startsAt,
      provider: booking.provider,
      status: booking.paymentStatus,
      grossCents: captured,
      refundedCents: refunded,
      currency: booking.currency,
      referenceType: 'booking' as const,
      referenceLabel: booking.reference,
      customerName: booking.customerName,
      metaClass,
      note: noteFor[metaClass],
    };
  });

/** Voucher purchases: money in, with no booking attached until the voucher is redeemed. */
const voucherPayments: Payment[] = [
  {
    id: 'pay-9001',
    reference: 'ZA-3901',
    occurredAt: '2026-01-18T14:20:00+01:00',
    provider: 'stripe',
    status: 'paid',
    grossCents: 5000,
    refundedCents: 0,
    currency: 'EUR',
    referenceType: 'voucher',
    referenceLabel: 'GS-2026-0001',
    customerName: 'Friedhelm Ottensmeyer',
    metaClass: 'standard',
    note: 'Gutscheinkauf über den Onlineshop.',
  },
  {
    id: 'pay-9002',
    reference: 'ZA-3902',
    occurredAt: '2026-02-02T09:05:00+01:00',
    provider: 'paypal',
    status: 'paid',
    grossCents: 10000,
    refundedCents: 0,
    currency: 'EUR',
    referenceType: 'voucher',
    referenceLabel: 'GS-2026-0002',
    customerName: 'Anneliese Kupferschmid',
    metaClass: 'standard',
    note: 'Gutscheinkauf über den Onlineshop.',
  },
  {
    id: 'pay-9003',
    reference: 'ZA-3903',
    occurredAt: '2026-02-20T16:45:00+01:00',
    provider: 'stripe',
    status: 'paid',
    grossCents: 2000,
    refundedCents: 0,
    currency: 'EUR',
    referenceType: 'voucher',
    referenceLabel: 'GS-2026-0003',
    customerName: 'Burkhard Steinmetz',
    metaClass: 'standard',
    note: 'Gutscheinkauf über den Onlineshop.',
  },
  {
    id: 'pay-9004',
    reference: 'ZA-3904',
    occurredAt: '2026-03-04T11:30:00+01:00',
    provider: 'stripe',
    status: 'failed',
    grossCents: 5000,
    refundedCents: 0,
    currency: 'EUR',
    referenceType: 'voucher',
    referenceLabel: 'GS-2026-0004',
    customerName: 'Volkmar Dietershagen',
    metaClass: 'standard',
    note: 'Zahlung vom Kartenaussteller abgelehnt.',
  },
  {
    id: 'pay-9005',
    reference: 'ZA-3905',
    occurredAt: '2026-03-06T10:15:00+01:00',
    provider: 'paypal',
    status: 'paid',
    grossCents: 4000,
    refundedCents: 0,
    currency: 'EUR',
    referenceType: 'voucher',
    referenceLabel: 'GS-2026-0006',
    customerName: 'Hannelore Zwickelsberger',
    metaClass: 'standard',
    note: 'Gutscheinkauf über den Onlineshop.',
  },
];

/**
 * A booking-type payment whose booking cannot be found. Deliberate: this is the "Zahlung ohne
 * Buchung" case, the most serious class the reconciliation section reports.
 */
const orphanedPayments: Payment[] = [
  {
    id: 'pay-9101',
    reference: 'ZA-3906',
    occurredAt: '2026-03-19T17:45:00+01:00',
    provider: 'stripe',
    status: 'paid',
    grossCents: 4800,
    refundedCents: 0,
    currency: 'EUR',
    referenceType: 'booking',
    referenceLabel: 'BU-2199',
    customerName: 'Ottilie Sandbichler',
    metaClass: 'standard',
    note: 'Zahlung eingegangen, zugehörige Buchung nicht auffindbar.',
  },
];

export const fixturePayments: Payment[] = [
  ...bookingPayments,
  ...voucherPayments,
  ...orphanedPayments,
].sort((a, b) =>
  a.occurredAt < b.occurredAt ? 1 : a.occurredAt > b.occurredAt ? -1 : 0,
);

export function findPaymentByBookingReference(reference: string): Payment | null {
  return (
    fixturePayments.find(
      (payment) => payment.referenceType === 'booking' && payment.referenceLabel === reference,
    ) ?? null
  );
}
