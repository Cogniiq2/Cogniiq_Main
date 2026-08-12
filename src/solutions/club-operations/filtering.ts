// Pure booking filtering. Extracted from the components so the behaviour is testable on its own and
// so the fixture adapter and a future gateway adapter can share exactly one definition of what a
// query means. Deterministic: same input, same output, no clock and no locale dependency.

import { toLocalDateKey } from './formatting';
import type { Booking, BookingQuery } from './types';

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
  let count = 0;
  if (query.search?.trim()) count += 1;
  if (query.dateFrom) count += 1;
  if (query.dateTo) count += 1;
  if ((query.status ?? 'all') !== 'all') count += 1;
  if ((query.court ?? 'all') !== 'all') count += 1;
  return count;
}
