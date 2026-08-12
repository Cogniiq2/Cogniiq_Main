// Pure booking filtering. Extracted from the components so the behaviour is testable on its own and
// so the fixture adapter and a future gateway adapter can share exactly one definition of what a
// query means. Deterministic: same input, same output, no clock and no locale dependency.

import { toLocalDateKey } from './formatting';
import type {
  ActivityQuery,
  ActivityRecord,
  AlertQuery,
  AlertSeverity,
  AlertStatus,
  Booking,
  BookingQuery,
  Invoice,
  InvoiceQuery,
  Member,
  MemberQuery,
  OperationalAlert,
  Payment,
  PaymentQuery,
  ReconciliationEntry,
  ReconciliationQuery,
  Voucher,
  VoucherQuery,
} from './types';

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/** Matches customer name or booking reference, case- and accent-tolerant for German input. */
function matchesSearch(booking: Booking, search: string): boolean {
  const needle = normalize(search);
  if (!needle) return true;
  const haystack = `${booking.customerName} ${booking.reference}`.toLowerCase();
  if (haystack.includes(needle)) return true;
  // Umlaut-tolerant fallback so "Muller" finds "Müller" and "Grosse" finds "Große".
  return fold(haystack).includes(fold(needle));
}

function fold(value: string): string {
  return value
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss');
}

export function filterBookings(bookings: Booking[], query: BookingQuery): Booking[] {
  const { search = '', dateFrom = '', dateTo = '', status = 'all', court = 'all' } = query;

  return bookings.filter((booking) => {
    if (!matchesSearch(booking, search)) return false;
    if (status !== 'all' && booking.status !== status) return false;
    if (court !== 'all' && booking.court !== court) return false;

    if (dateFrom || dateTo) {
      const day = toLocalDateKey(booking.startsAt);
      if (!day) return false;
      // Lexicographic comparison is correct for zero-padded YYYY-MM-DD.
      if (dateFrom && day < dateFrom) return false;
      if (dateTo && day > dateTo) return false;
    }

    return true;
  });
}

/** True when the query would return every booking, i.e. nothing is actually being filtered. */
export function isEmptyQuery(query: BookingQuery): boolean {
  return (
    !query.search?.trim() &&
    !query.dateFrom &&
    !query.dateTo &&
    (query.status ?? 'all') === 'all' &&
    (query.court ?? 'all') === 'all'
  );
}

/** Number of active filter facets, for the "N Filter aktiv" affordance. */
export function activeFilterCount(query: BookingQuery): number {
  return countActiveFacets(query);
}

/**
 * Generic facet counter for any query object.
 *
 * A facet is active when it is a non-blank string that is not the literal 'all'. Every query type in
 * this module follows that shape, so one implementation serves all of them and a new section cannot
 * forget to count one of its own filters.
 */
export function countActiveFacets(query: object): number {
  return Object.values(query).filter(
    (value) => typeof value === 'string' && value.trim() !== '' && value !== 'all',
  ).length;
}

/** True when no facet of the query is active. */
export function hasNoActiveFacets(query: object): boolean {
  return countActiveFacets(query) === 0;
}

/**
 * Apply a drill-down's facets on top of a section's empty query.
 *
 * Keys the query does not already declare are dropped rather than merged in. A drill-down target is
 * data, and data that can add arbitrary keys to a query object is data that can reach the adapter
 * with a facet the section never validated.
 */
export function withSeed<Q extends object>(base: Q, seed: Record<string, string> | undefined): Q {
  if (!seed) return base;
  const next = { ...base } as Record<string, unknown>;
  for (const [key, value] of Object.entries(seed)) {
    if (key in next) next[key] = value;
  }
  return next as Q;
}

/** Case- and umlaut-tolerant containment across the given haystack fields. */
export function matchesText(search: string | undefined, ...fields: (string | null | undefined)[]): boolean {
  const needle = normalize(search ?? '');
  if (!needle) return true;
  const haystack = fields.filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(needle) || fold(haystack).includes(fold(needle));
}

/** Inclusive YYYY-MM-DD bounds against an ISO timestamp's local date. */
export function withinDateRange(
  iso: string,
  dateFrom: string | undefined,
  dateTo: string | undefined,
): boolean {
  if (!dateFrom && !dateTo) return true;
  const day = toLocalDateKey(iso);
  if (!day) return false;
  if (dateFrom && day < dateFrom) return false;
  if (dateTo && day > dateTo) return false;
  return true;
}

/** Equality against a facet that may be the literal 'all'. */
export function matchesFacet<T extends string>(value: T, facet: T | 'all' | undefined): boolean {
  return !facet || facet === 'all' || value === facet;
}

/* ------------------------------------------------------------------ Payments */

export function filterPayments(payments: Payment[], query: PaymentQuery): Payment[] {
  return payments.filter(
    (payment) =>
      matchesText(query.search, payment.customerName, payment.reference, payment.referenceLabel) &&
      matchesFacet(payment.provider, query.provider) &&
      matchesFacet(payment.status, query.status) &&
      matchesFacet(payment.metaClass, query.metaClass) &&
      withinDateRange(payment.occurredAt, query.dateFrom, query.dateTo),
  );
}

/* ------------------------------------------------------------------ Invoices */

export function filterInvoices(invoices: Invoice[], query: InvoiceQuery): Invoice[] {
  return invoices.filter(
    (invoice) =>
      matchesText(query.search, invoice.customerName, invoice.number, invoice.bookingReference) &&
      matchesFacet(invoice.status, query.status) &&
      withinDateRange(invoice.issuedAt, query.dateFrom, query.dateTo),
  );
}

/* ------------------------------------------------------------ Reconciliation */

export function filterReconciliation(
  entries: ReconciliationEntry[],
  query: ReconciliationQuery,
): ReconciliationEntry[] {
  return entries.filter(
    (entry) =>
      matchesText(query.search, entry.customerName, entry.bookingReference, entry.paymentReference) &&
      matchesFacet(entry.issue, query.issue) &&
      matchesFacet(entry.severity, query.severity),
  );
}

/* ------------------------------------------------------------------ Vouchers */

export function filterVouchers(vouchers: Voucher[], query: VoucherQuery): Voucher[] {
  return vouchers.filter(
    (voucher) =>
      matchesText(query.search, voucher.code, voucher.buyerName) &&
      matchesFacet(voucher.status, query.status),
  );
}

/* ------------------------------------------------------------------- Members */

export function filterMembers(members: Member[], query: MemberQuery): Member[] {
  return members.filter(
    (member) =>
      matchesText(
        query.search,
        `${member.firstName} ${member.lastName}`,
        String(member.memberNumber),
        member.city,
      ) &&
      matchesFacet(member.membershipType, query.membershipType) &&
      matchesFacet(member.status, query.status),
  );
}

/* ------------------------------------------------------------------ Activity */

/** Newest first. The audit trail is only readable in reverse chronological order. */
export function filterActivity(records: ActivityRecord[], query: ActivityQuery): ActivityRecord[] {
  return records
    .filter(
      (record) =>
        matchesText(query.search, record.summary, record.entityLabel, record.relatedReference, record.actorRole) &&
        matchesFacet(record.category, query.category) &&
        matchesFacet(record.actorType, query.actorType) &&
        withinDateRange(record.occurredAt, query.dateFrom, query.dateTo),
    )
    .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : a.occurredAt > b.occurredAt ? -1 : 0));
}

/* -------------------------------------------------------------------- Alerts */

/** Severity order for sorting: the most serious unresolved problem belongs at the top. */
const severityWeight: Record<AlertSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const resolvedStatuses = new Set<AlertStatus>(['resolved', 'ignored']);

export function isAlertOpen(alert: OperationalAlert): boolean {
  return !resolvedStatuses.has(alert.status);
}

/** The status facet, which accepts the synthetic `unresolved` value alongside the real statuses. */
function matchesAlertStatus(alert: OperationalAlert, facet: AlertQuery['status']): boolean {
  if (!facet || facet === 'all') return true;
  if (facet === 'unresolved') return isAlertOpen(alert);
  return alert.status === facet;
}

/** Unresolved first, then by severity, then newest — matching the reference system's ordering. */
export function filterAlerts(alerts: OperationalAlert[], query: AlertQuery): OperationalAlert[] {
  return alerts
    .filter(
      (alert) =>
        matchesText(query.search, alert.title, alert.message, alert.relatedReference) &&
        matchesFacet(alert.severity, query.severity) &&
        matchesAlertStatus(alert, query.status) &&
        matchesFacet(alert.category, query.category) &&
        withinDateRange(alert.createdAt, query.dateFrom, query.dateTo),
    )
    .sort((a, b) => {
      const openDelta = Number(isAlertOpen(b)) - Number(isAlertOpen(a));
      if (openDelta !== 0) return openDelta;
      const severityDelta = severityWeight[a.severity] - severityWeight[b.severity];
      if (severityDelta !== 0) return severityDelta;
      return a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0;
    });
}
