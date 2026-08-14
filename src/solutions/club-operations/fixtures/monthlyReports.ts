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
  buildRevenue,
  buildVat,
  isRevenue,
  topCourt,
} from '../aggregation';
import type {
  MonthlyReport,
  MonthlyReportComparison,
  Payment,
  PaymentMetaClass,
  PaymentProvider,
} from '../types';
import { bookingsInMonth, fixtureMonths } from './bookings';
import { fixturePayments } from './payments';

function revenueByProvider(month: string, provider: PaymentProvider): number {
  return bookingsInMonth(month)
    .filter((booking) => isRevenue(booking) && booking.provider === provider)
    .reduce((sum, booking) => sum + booking.amountCents, 0);
}

/**
 * The stored refund figures of a monthly report.
 *
 * `MonthlyReport.refundedCents`, `.refundedCancellationCents` and `.refundedDoubleBookingCents` all
 * stay non-null because upstream persists them as their own granted columns
 * (`admin_monthly_reports.refunded_amount`, `.refunded_cancellation_amount`,
 * `.refunded_double_booking_amount`). They are a stored fact, not the live derivation that
 * `RefundBreakdown` computes from per-payment amounts and `metaClass` — which is exactly why the
 * live figures may be null while these are not. These fixtures stand in for those columns, so they
 * must produce a number.
 *
 * If a fixture payment lacks the amount or the class, that number cannot be derived, and this raises
 * rather than substituting a zero: a fixture standing in for a stored column must either be right or
 * be visibly broken. This is fixture-construction code and runs at module load, never in the app.
 *
 * `metaClass === null` selects every refunded payment regardless of reason, which is the stand-in for
 * `refunded_amount`.
 */
function storedRefunds(
  payments: Payment[],
  metaClass: PaymentMetaClass | null,
  month: string,
): number {
  return payments.reduce((sum, payment) => {
    if (payment.refundedCents === null) {
      throw new Error(
        `monthly report fixture ${month}: payment ${payment.id} has no refund amount, so the ` +
          'stored refund columns cannot be derived',
      );
    }
    if (payment.refundedCents === 0) return sum;
    if (metaClass === null) return sum + payment.refundedCents;
    if (payment.metaClass === null) {
      throw new Error(
        `monthly report fixture ${month}: payment ${payment.id} has no metaClass, so the stored ` +
          'by-reason refund columns cannot be derived',
      );
    }
    return payment.metaClass === metaClass ? sum + payment.refundedCents : sum;
  }, 0);
}

function buildMonthlyReport(month: string): MonthlyReport {
  const bookings = bookingsInMonth(month);
  const payments = fixturePayments.filter((payment) => payment.occurredAt.slice(0, 7) === month);
  const revenue = buildRevenue(bookings);
  const counts = buildCounts(bookings);

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
    refundedCents: storedRefunds(payments, null, month),
    refundedCancellationCents: storedRefunds(payments, 'customer_cancelled', month),
    refundedDoubleBookingCents: storedRefunds(payments, 'double_booking', month),
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
