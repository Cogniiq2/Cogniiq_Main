// Overview fixture.
//
// Derived from the booking fixtures rather than hand-written, so the headline figures always agree
// with the booking list a user can scroll through. Hand-typed totals drift the moment a fixture row
// changes, and a dashboard whose KPIs contradict its own table teaches the reader to distrust it.
//
// All arithmetic is in integer cents. VAT is computed out of a gross amount, which is how the club
// actually prices: the displayed price includes tax.

import { percentOf } from '../formatting';
import type {
  ActivityEntry,
  Booking,
  BookingCounts,
  CourtKey,
  CourtUtilization,
  OverviewPeriod,
  OverviewSnapshot,
  PaymentProvider,
  PaymentStatus,
  PaymentStatusSlice,
  RevenueSummary,
  TaxCategory,
  VatCategoryStat,
  VatSummary,
} from '../types';
import { courtKeys, paymentProviders, paymentStatuses, taxCategories } from '../types';
import { fixtureBookings } from './bookings';

/** Revenue only counts money actually collected. */
function isRevenue(booking: Booking): boolean {
  return booking.paymentStatus === 'paid';
}

/** Net and VAT split out of a gross amount at the given percent rate. */
function splitGross(grossCents: number, ratePercent: number | null): { netCents: number; vatCents: number } {
  if (!ratePercent) return { netCents: grossCents, vatCents: 0 };
  const netCents = Math.round(grossCents / (1 + ratePercent / 100));
  return { netCents, vatCents: grossCents - netCents };
}

function buildRevenue(bookings: Booking[]): RevenueSummary {
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

function buildCounts(bookings: Booking[]): BookingCounts {
  return {
    total: bookings.length,
    paid: bookings.filter(isRevenue).length,
    free: bookings.filter((b) => b.paymentStatus === 'not_required').length,
    cancelled: bookings.filter((b) => b.status === 'cancelled').length,
  };
}

function buildPaymentStatus(bookings: Booking[]): PaymentStatusSlice[] {
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

function buildVat(bookings: Booking[]): VatSummary {
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

/** Bookable slots per court in the fixture window, used to express utilisation as a share. */
const FIXTURE_SLOTS_PER_COURT = 14;

function buildCourts(bookings: Booking[]): CourtUtilization[] {
  return courtKeys.map((court: CourtKey) => {
    const slice = bookings.filter((b) => b.court === court);
    return {
      court,
      bookingCount: slice.length,
      revenueCents: slice.filter(isRevenue).reduce((sum, b) => sum + b.amountCents, 0),
      utilizationPercent: Math.round(percentOf(slice.length, FIXTURE_SLOTS_PER_COURT)),
    };
  });
}

const fixtureActivity: ActivityEntry[] = [
  { id: 'act-01', occurredAt: '2026-03-08T14:12:00+01:00', kind: 'booking', summary: 'Neue Buchung BU-2054 für Tennis 3' },
  { id: 'act-02', occurredAt: '2026-03-07T20:04:00+01:00', kind: 'payment', summary: 'Zahlung zu BU-2053 bestätigt' },
  { id: 'act-03', occurredAt: '2026-03-05T18:33:00+01:00', kind: 'voucher', summary: 'Gutschein für BU-2049 eingelöst' },
  { id: 'act-04', occurredAt: '2026-03-05T08:02:00+01:00', kind: 'cancellation', summary: 'Buchung BU-2048 storniert' },
  { id: 'act-05', occurredAt: '2026-03-04T21:35:00+01:00', kind: 'refund', summary: 'Erstattung zu BU-2047 ausgelöst' },
];

export function buildOverview(bookings: Booking[], period: OverviewPeriod): OverviewSnapshot {
  return {
    period,
    revenue: buildRevenue(bookings),
    bookings: buildCounts(bookings),
    paymentStatus: buildPaymentStatus(bookings),
    vat: buildVat(bookings),
    courts: buildCourts(bookings),
    activity: fixtureActivity,
  };
}

export function fixtureOverview(period: OverviewPeriod): OverviewSnapshot {
  return buildOverview(fixtureBookings, period);
}

/** A structurally valid but entirely empty snapshot, for the "no data yet" state. */
export function emptyOverview(period: OverviewPeriod): OverviewSnapshot {
  return buildOverview([], period);
}
