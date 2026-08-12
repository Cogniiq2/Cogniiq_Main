// Monthly reports, derived entirely from the booking and payment fixtures.
//
// Nothing is typed in. A month's report is what the aggregation functions produce for that month's
// bookings, which means the report, the booking list and the overview can never disagree.
//
// The reference model also stores Storage URLs for a generated PDF and CSV; both are dropped, as
// they are live external links.

import {
  buildCounts,
  buildCourts,
  buildMembership,
  buildRefunds,
  buildRevenue,
  buildVat,
  isRevenue,
  topCourt,
} from '../aggregation';
import type { MonthlyReport, MonthlyReportComparison, PaymentProvider } from '../types';
import { bookingsInMonth, fixtureMonths } from './bookings';
import { fixturePayments } from './payments';

function revenueByProvider(month: string, provider: PaymentProvider): number {
  return bookingsInMonth(month)
    .filter((booking) => isRevenue(booking) && booking.provider === provider)
    .reduce((sum, booking) => sum + booking.amountCents, 0);
}

function buildMonthlyReport(month: string): MonthlyReport {
  const bookings = bookingsInMonth(month);
  const payments = fixturePayments.filter((payment) => payment.occurredAt.slice(0, 7) === month);
  const revenue = buildRevenue(bookings);
  const counts = buildCounts(bookings);
  const refunds = buildRefunds(payments);

  const [year, monthIndex] = month.split('-').map(Number);
  const periodStart = `${month}-01`;
  const periodEnd = `${month}-${String(new Date(year, monthIndex, 0).getDate()).padStart(2, '0')}`;

  return {
    id: `mrep-${month}`,
    month,
    periodStart,
    periodEnd,
    totalRevenueCents: revenue.totalCents,
    stripeRevenueCents: revenueByProvider(month, 'stripe'),
    paypalRevenueCents: revenueByProvider(month, 'paypal'),
    voucherRevenueCents: revenueByProvider(month, 'voucher'),
    refundedCents: refunds.totalCents,
    refundedCancellationCents: refunds.cancellationCents,
    refundedDoubleBookingCents: refunds.doubleBookingCents,
    bookingCount: counts.total,
    successfulCount: counts.paid,
    pendingCount: bookings.filter((booking) => booking.paymentStatus === 'pending').length,
    cancelledCount: counts.cancelled,
    topCourt: topCourt(bookings),
    vat: buildVat(bookings),
    membership: buildMembership(bookings),
    courts: buildCourts(bookings),
  };
}

/** Newest month first, matching how the reference system lists its saved reports. */
export const fixtureMonthlyReports: MonthlyReport[] = [...fixtureMonths]
  .sort((a, b) => (a < b ? 1 : -1))
  .map(buildMonthlyReport);

export const fixtureAvailableMonths: string[] = fixtureMonthlyReports.map((report) => report.month);

export function monthlyReportComparison(month?: string): MonthlyReportComparison | null {
  const selected = month ?? fixtureAvailableMonths[0];
  const index = fixtureMonthlyReports.findIndex((report) => report.month === selected);
  if (index === -1) return null;
  return {
    report: fixtureMonthlyReports[index],
    // The list runs newest-first, so the preceding month is the next entry.
    previous: fixtureMonthlyReports[index + 1] ?? null,
    availableMonths: fixtureAvailableMonths,
  };
}
