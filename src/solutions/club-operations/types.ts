// Club Operations — domain model.
//
// This is the vocabulary the UI speaks. It is deliberately a *domain* model, not a transport model:
// no table names, no column names, no provider payload shapes. A later gateway adapter maps whatever
// the server returns onto these types, so the UI never changes when the transport does.
//
// Money is ALWAYS an integer number of cents, matching the Cogniiq convention (see
// `formatCents` in src/lib/clientPlatform/validation.ts). The reference system stores euro
// floats; converting at the adapter boundary is a mapping concern and must never leak into the UI.

/* ------------------------------------------------------------------ Courts */

export const courtKeys = ['padel-1', 'padel-2', 'tennis-1', 'tennis-2', 'tennis-3'] as const;
export type CourtKey = (typeof courtKeys)[number];

export type CourtSport = 'padel' | 'tennis';

/* ------------------------------------------------------------------ Bookings */

export const bookingStatuses = ['confirmed', 'pending', 'cancelled', 'refunded', 'failed'] as const;
export type BookingStatus = (typeof bookingStatuses)[number];

export const paymentProviders = ['stripe', 'paypal', 'voucher', 'free'] as const;
export type PaymentProvider = (typeof paymentProviders)[number];

export const paymentStatuses = ['paid', 'pending', 'refunded', 'failed', 'not_required'] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

/**
 * VAT treatment. Padel is rated by membership (reduced rate for members, standard rate for
 * non-members); tennis is exempt; free bookings carry no VAT. `padel_unresolved` marks a padel
 * booking whose membership could not be determined and which therefore needs manual review.
 */
export const taxCategories = [
  'padel_member_reduced',
  'padel_non_member_standard',
  'padel_unresolved',
  'tennis_exempt',
  'free',
  'unknown',
] as const;
export type TaxCategory = (typeof taxCategories)[number];

export type MembershipClassification = 'member' | 'non_member' | 'unresolved' | 'not_applicable';

/**
 * A booking as the operations dashboard needs it.
 *
 * Intentionally carries no contact details, no payment-provider identifiers and no cancellation
 * tokens: none of them are needed to read the operational picture, and omitting them keeps this
 * phase free of personal data by construction.
 */
export interface Booking {
  id: string;
  /** Human-facing reference shown to staff. */
  reference: string;
  court: CourtKey;
  /** ISO 8601 timestamps. */
  startsAt: string;
  endsAt: string;
  customerName: string;
  status: BookingStatus;
  provider: PaymentProvider;
  paymentStatus: PaymentStatus;
  amountCents: number;
  currency: string;
  membership: MembershipClassification;
  taxCategory: TaxCategory;
  /** Percent, e.g. 7 or 19. Null where no rate applies (exempt, free, unresolved). */
  taxRatePercent: number | null;
  /** Whether the booking requested floodlights. Read-only here; actuation is a later phase. */
  lightsRequested: boolean;
}

/* ------------------------------------------------------------------ Queries */

export interface BookingQuery {
  /** Free-text match against customer name and reference. */
  search?: string;
  /** Inclusive ISO date bounds (YYYY-MM-DD), compared against the booking's local start date. */
  dateFrom?: string;
  dateTo?: string;
  status?: BookingStatus | 'all';
  court?: CourtKey | 'all';
}

export const emptyBookingQuery: BookingQuery = {
  search: '',
  dateFrom: '',
  dateTo: '',
  status: 'all',
  court: 'all',
};

export interface BookingPage {
  bookings: Booking[];
  /** Total matching the query. Equal to `bookings.length` while the adapter returns unpaged data. */
  total: number;
}

export interface OverviewQuery {
  period: OverviewPeriod;
}

export const overviewPeriods = ['today', 'week', 'month', 'last_month'] as const;
export type OverviewPeriod = (typeof overviewPeriods)[number];

/* ------------------------------------------------------------------ Overview */

export interface RevenueByProvider {
  provider: PaymentProvider;
  amountCents: number;
}

export interface RevenueSummary {
  totalCents: number;
  averageBookingValueCents: number;
  byProvider: RevenueByProvider[];
}

export interface BookingCounts {
  total: number;
  paid: number;
  free: number;
  cancelled: number;
}

export interface PaymentStatusSlice {
  status: PaymentStatus;
  count: number;
  amountCents: number;
}

export interface VatCategoryStat {
  category: TaxCategory;
  bookingCount: number;
  netCents: number;
  vatCents: number;
  grossCents: number;
}

export interface VatSummary {
  totalVatCents: number;
  categories: VatCategoryStat[];
  /** Padel bookings whose membership could not be resolved; these need manual review. */
  unresolvedCount: number;
}

export interface CourtUtilization {
  court: CourtKey;
  bookingCount: number;
  revenueCents: number;
  /** Share of bookable slots taken, 0–100. */
  utilizationPercent: number;
}

export type ActivityKind = 'booking' | 'payment' | 'refund' | 'cancellation' | 'voucher';

export interface ActivityEntry {
  id: string;
  occurredAt: string;
  kind: ActivityKind;
  summary: string;
}

export interface OverviewSnapshot {
  period: OverviewPeriod;
  revenue: RevenueSummary;
  bookings: BookingCounts;
  paymentStatus: PaymentStatusSlice[];
  vat: VatSummary;
  courts: CourtUtilization[];
  activity: ActivityEntry[];
}
