// Pure aggregation over bookings and payments.
//
// Extracted so Übersicht, Monatsberichte and Berichte compute their figures from one definition
// rather than three. Three sections that each roll up revenue their own way is exactly how a
// dashboard ends up contradicting itself.
//
// All arithmetic is in integer cents. VAT is computed out of a gross amount, because the club
// prices inclusive of tax.

import { formatDayTick, percentOf, toLocalDateKey } from './formatting';
import { eachDay, isWithin, startOfWeek, type PeriodWindow } from './periods';
import type {
  Booking,
  BookingCounts,
  CourtKey,
  CourtUtilization,
  InvoiceCounts,
  MembershipClassification,
  MembershipSlice,
  Payment,
  PaymentProvider,
  PaymentStatus,
  PaymentStatusSlice,
  PeriodBounds,
  PeriodTotals,
  RefundBreakdown,
  RevenueSummary,
  TaxCategory,
  TrendPoint,
  VatCategoryStat,
  VatSummary,
} from './types';
import { courtKeys, paymentProviders, paymentStatuses, taxCategories } from './types';
import type { Invoice } from './types';

/** Revenue only counts money actually collected. */
export function isRevenue(booking: Booking): boolean {
  return booking.paymentStatus === 'paid';
}

/** Net and VAT split out of a gross amount at the given percent rate. */
export function splitGross(
  grossCents: number,
  ratePercent: number | null,
): { netCents: number; vatCents: number } {
  if (!ratePercent) return { netCents: grossCents, vatCents: 0 };
  const netCents = Math.round(grossCents / (1 + ratePercent / 100));
  return { netCents, vatCents: grossCents - netCents };
}

export function buildRevenue(bookings: Booking[]): RevenueSummary {
  const paid = bookings.filter(isRevenue);
  const totalCents = paid.reduce((sum, b) => sum + b.amountCents, 0);
  const earning = paid.filter((b) => b.amountCents > 0);
  return {
    totalCents,
    averageBookingValueCents: earning.length ? Math.round(totalCents / earning.length) : 0,
    byProvider: paymentProviders
      .map((provider: PaymentProvider) => ({
        provider,
        amountCents: paid.filter((b) => b.provider === provider).reduce((s, b) => s + b.amountCents, 0),
      }))
      .filter((entry) => entry.amountCents > 0),
  };
}

export function buildCounts(bookings: Booking[]): BookingCounts {
  return {
    total: bookings.length,
    paid: bookings.filter(isRevenue).length,
    free: bookings.filter((b) => b.paymentStatus === 'not_required').length,
    cancelled: bookings.filter((b) => b.status === 'cancelled').length,
  };
}

export function buildPaymentStatus(bookings: Booking[]): PaymentStatusSlice[] {
  return paymentStatuses
    .map((status: PaymentStatus) => {
      const slice = bookings.filter((b) => b.paymentStatus === status);
      return {
        status,
        count: slice.length,
        amountCents: slice.reduce((sum, b) => sum + b.amountCents, 0),
      };
    })
    .filter((slice) => slice.count > 0);
}

export function buildVat(bookings: Booking[]): VatSummary {
  const categories: VatCategoryStat[] = taxCategories
    .map((category: TaxCategory) => {
      const slice = bookings.filter((b) => b.taxCategory === category && isRevenue(b));
      const grossCents = slice.reduce((sum, b) => sum + b.amountCents, 0);
      const rate = slice[0]?.taxRatePercent ?? null;
      const { netCents, vatCents } = splitGross(grossCents, rate);
      return { category, bookingCount: slice.length, netCents, vatCents, grossCents };
    })
    .filter((stat) => stat.bookingCount > 0);

  return {
    totalVatCents: categories.reduce((sum, c) => sum + c.vatCents, 0),
    categories,
    unresolvedCount: bookings.filter((b) => b.taxCategory === 'padel_unresolved').length,
  };
}

/**
 * Bookable slots per court in a reporting window. A fixed figure, used only to express occupancy as
 * a share; the real system derives it from opening hours.
 */
export const SLOTS_PER_COURT_PER_MONTH = 30;

export function buildCourts(bookings: Booking[], slotsPerCourt = SLOTS_PER_COURT_PER_MONTH): CourtUtilization[] {
  return courtKeys.map((court: CourtKey) => {
    const slice = bookings.filter((b) => b.court === court);
    return {
      court,
      bookingCount: slice.length,
      revenueCents: slice.filter(isRevenue).reduce((sum, b) => sum + b.amountCents, 0),
      utilizationPercent: Math.round(percentOf(slice.length, slotsPerCourt)),
    };
  });
}

const membershipOrder: MembershipClassification[] = [
  'member',
  'non_member',
  'unresolved',
  'not_applicable',
];

export function buildMembership(bookings: Booking[]): MembershipSlice[] {
  return membershipOrder
    .map((classification) => {
      const slice = bookings.filter((b) => b.membership === classification);
      return {
        classification,
        bookingCount: slice.length,
        revenueCents: slice.filter(isRevenue).reduce((sum, b) => sum + b.amountCents, 0),
      };
    })
    .filter((slice) => slice.bookingCount > 0);
}

export function buildRefunds(payments: Payment[]): RefundBreakdown {
  const refunded = payments.filter((payment) => payment.refundedCents > 0);
  return {
    totalCents: refunded.reduce((sum, p) => sum + p.refundedCents, 0),
    cancellationCents: refunded
      .filter((p) => p.metaClass === 'customer_cancelled')
      .reduce((sum, p) => sum + p.refundedCents, 0),
    doubleBookingCents: refunded
      .filter((p) => p.metaClass === 'double_booking')
      .reduce((sum, p) => sum + p.refundedCents, 0),
  };
}

/** The court with the most bookings, or null when there are none. Ties resolve to the first court. */
export function topCourt(bookings: Booking[]): CourtKey | null {
  const ranked = buildCourts(bookings)
    .filter((court) => court.bookingCount > 0)
    .sort((a, b) => b.bookingCount - a.bookingCount);
  return ranked[0]?.court ?? null;
}

/* ------------------------------------------------------ Windows and movement */

/** Bookings whose *local* start date falls inside the window. */
export function bookingsWithin(bookings: Booking[], bounds: PeriodBounds): Booking[] {
  return bookings.filter((booking) => isWithin(toLocalDateKey(booking.startsAt), bounds));
}

/** Payments whose local date falls inside the window. */
export function paymentsWithin(payments: Payment[], bounds: PeriodBounds): Payment[] {
  return payments.filter((payment) => isWithin(toLocalDateKey(payment.occurredAt), bounds));
}

/**
 * The comparable scalars of a window.
 *
 * Built from the same predicates as `buildRevenue`/`buildCounts` rather than re-derived, so a
 * headline figure and the delta printed under it can never come from two different definitions of
 * "paid".
 */
export function buildPeriodTotals(bookings: Booking[]): PeriodTotals {
  const revenue = buildRevenue(bookings);
  const counts = buildCounts(bookings);
  return {
    revenueCents: revenue.totalCents,
    bookingCount: counts.total,
    paidCount: counts.paid,
    cancelledCount: counts.cancelled,
    refundedCount: bookings.filter((booking) => booking.paymentStatus === 'refunded').length,
    averageBookingValueCents: revenue.averageBookingValueCents,
  };
}

/**
 * Revenue and bookings over time inside a window.
 *
 * Every bucket in the window is emitted, including the empty ones. A series that skips its zeroes
 * draws a flat line across a quiet fortnight and reads as steady trade rather than none.
 */
export function buildTrend(
  bookings: Booking[],
  bounds: PeriodBounds,
  granularity: PeriodWindow['granularity'],
): TrendPoint[] {
  const bucketKey = (day: string) => (granularity === 'week' ? startOfWeek(day) : day);

  const buckets = new Map<string, TrendPoint>();
  for (const day of eachDay(bounds)) {
    const key = bucketKey(day);
    if (buckets.has(key)) continue;
    // A week bucket at the edge of the window is partial: the calendar week containing 1 March
    // began on 23 February, but the bucket only counts the days inside the window. Labelling it
    // "ab 23.02." would put a February date on a bar made entirely of March.
    const labelDay = key < bounds.start ? bounds.start : key;
    buckets.set(key, {
      key,
      label: granularity === 'week' ? `ab ${formatDayTick(labelDay)}` : formatDayTick(labelDay),
      revenueCents: 0,
      bookingCount: 0,
    });
  }

  for (const booking of bookingsWithin(bookings, bounds)) {
    const point = buckets.get(bucketKey(toLocalDateKey(booking.startsAt)));
    if (!point) continue;
    point.bookingCount += 1;
    if (isRevenue(booking)) point.revenueCents += booking.amountCents;
  }

  return [...buckets.values()];
}

/** An invoice is overdue when it is still open and its due date has passed. */
export function isOverdue(invoice: Invoice, asOf: string): boolean {
  return invoice.status === 'open' && invoice.dueDate < asOf;
}

export function buildInvoiceCounts(invoices: Invoice[], asOf: string): InvoiceCounts {
  return {
    total: invoices.length,
    draft: invoices.filter((i) => i.status === 'draft').length,
    open: invoices.filter((i) => i.status === 'open').length,
    paid: invoices.filter((i) => i.status === 'paid').length,
    voided: invoices.filter((i) => i.status === 'void').length,
    uncollectible: invoices.filter((i) => i.status === 'uncollectible').length,
    overdue: invoices.filter((i) => isOverdue(i, asOf)).length,
    outstandingCents: invoices
      .filter((i) => i.status === 'open')
      .reduce((sum, i) => sum + i.grossCents, 0),
    collectedCents: invoices
      .filter((i) => i.status === 'paid')
      .reduce((sum, i) => sum + i.grossCents, 0),
  };
}
