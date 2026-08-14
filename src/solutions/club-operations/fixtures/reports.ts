// Period financial report.
//
// Reproduces the content the reference system renders into its PDF — summary, payment methods,
// status distribution, court utilisation, VAT breakdown and refunds — as an on-screen report.
// Nothing is generated, uploaded, e-mailed or persisted.

import {
  buildCounts,
  buildCourts,
  buildMembership,
  buildPaymentStatus,
  buildRefunds,
  buildRevenue,
  buildVat,
} from '../aggregation';
import { toLocalDateKey } from '../formatting';
import type { Booking, Payment, ReportRange, ReportSnapshot } from '../types';
import { fixtureBookings } from './bookings';
import { fixturePayments } from './payments';
import { FIXTURE_TODAY } from './vouchers';

/**
 * Ranges are resolved against a fixed "today" rather than the real clock, so a report rendered in
 * a test and a report rendered in a browser show the same figures.
 */
export function resolveRange(range: ReportRange): { periodStart: string; periodEnd: string } {
  switch (range) {
    case 'week':
      return { periodStart: '2026-03-25', periodEnd: FIXTURE_TODAY };
    case 'month':
      return { periodStart: '2026-03-01', periodEnd: '2026-03-31' };
    case 'last_month':
      return { periodStart: '2026-02-01', periodEnd: '2026-02-28' };
    case 'quarter':
      return { periodStart: '2026-01-01', periodEnd: '2026-03-31' };
  }
}

function withinRange(booking: Booking, periodStart: string, periodEnd: string): boolean {
  const day = toLocalDateKey(booking.startsAt);
  return day >= periodStart && day <= periodEnd;
}

/**
 * @param ledger The payments the refund figures are computed from. Defaults to the populated
 *   fixtures; the source-absent scenario supplies its own so the report's refund block reflects the
 *   same missing data as the rest of that dataset instead of quietly reading richer rows.
 */
export function buildReport(
  bookings: Booking[],
  range: ReportRange,
  ledger: Payment[] = fixturePayments,
): ReportSnapshot {
  const { periodStart, periodEnd } = resolveRange(range);
  const inRange = bookings.filter((booking) => withinRange(booking, periodStart, periodEnd));
  const references = new Set(inRange.map((booking) => booking.reference));
  const payments = ledger.filter(
    (payment) => payment.referenceType === 'booking' && references.has(payment.referenceLabel),
  );

  return {
    range,
    periodStart,
    periodEnd,
    revenue: buildRevenue(inRange),
    bookings: buildCounts(inRange),
    paymentStatus: buildPaymentStatus(inRange),
    vat: buildVat(inRange),
    courts: buildCourts(inRange),
    refunds: buildRefunds(payments),
    membership: buildMembership(inRange),
  };
}

export function fixtureReport(range: ReportRange): ReportSnapshot {
  return buildReport(fixtureBookings, range);
}
