import { describe, expect, it } from 'vitest';

import { activeFilterCount, filterBookings, isEmptyQuery } from './filtering';
import { formatCents, formatCount, formatPercent, formatTimeRange, toLocalDateKey } from './formatting';
import { fixtureBookings } from './fixtures/bookings';
import { emptyBookingQuery } from './types';

const all = fixtureBookings;

describe('search', () => {
  it('matches on customer name, case-insensitively', () => {
    const result = filterBookings(all, { ...emptyBookingQuery, search: 'krautwurst' });
    expect(result.map((b) => b.reference)).toEqual(['BU-2050']);
  });

  it('matches on booking reference', () => {
    const result = filterBookings(all, { ...emptyBookingQuery, search: 'BU-2045' });
    expect(result).toHaveLength(1);
    expect(result[0].customerName).toContain('Annegret');
  });

  it('matches partial names inside long compound German names', () => {
    const result = filterBookings(all, { ...emptyBookingQuery, search: 'Schöllhammer' });
    expect(result).toHaveLength(1);
  });

  it('is umlaut-tolerant, so "Duesterhoeft" finds "Düsterhöft"', () => {
    expect(filterBookings(all, { ...emptyBookingQuery, search: 'Duesterhoeft' })).toHaveLength(1);
    expect(filterBookings(all, { ...emptyBookingQuery, search: 'Jorg' })).toHaveLength(0);
    expect(filterBookings(all, { ...emptyBookingQuery, search: 'Joerg' })).toHaveLength(1);
  });

  it('ignores surrounding whitespace', () => {
    expect(filterBookings(all, { ...emptyBookingQuery, search: '  BU-2044  ' })).toHaveLength(1);
  });

  it('returns nothing for a term that matches no booking', () => {
    expect(filterBookings(all, { ...emptyBookingQuery, search: 'zzzz' })).toEqual([]);
  });
});

describe('date filtering', () => {
  it('filters by an inclusive lower bound', () => {
    const result = filterBookings(all, { ...emptyBookingQuery, dateFrom: '2026-03-06' });
    expect(result.every((b) => toLocalDateKey(b.startsAt) >= '2026-03-06')).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThan(all.length);
  });

  it('filters by an inclusive upper bound', () => {
    const result = filterBookings(all, { ...emptyBookingQuery, dateTo: '2026-03-03' });
    expect(result.every((b) => toLocalDateKey(b.startsAt) <= '2026-03-03')).toBe(true);
  });

  it('includes bookings falling exactly on both bounds', () => {
    const day = toLocalDateKey(all[0].startsAt);
    const result = filterBookings(all, { ...emptyBookingQuery, dateFrom: day, dateTo: day });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((b) => toLocalDateKey(b.startsAt) === day)).toBe(true);
  });

  it('returns nothing for an inverted range', () => {
    expect(
      filterBookings(all, { ...emptyBookingQuery, dateFrom: '2026-03-08', dateTo: '2026-03-02' }),
    ).toEqual([]);
  });
});

describe('status filtering', () => {
  it('filters to a single status', () => {
    const result = filterBookings(all, { ...emptyBookingQuery, status: 'cancelled' });
    expect(result.every((b) => b.status === 'cancelled')).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('"all" does not filter', () => {
    expect(filterBookings(all, { ...emptyBookingQuery, status: 'all' })).toHaveLength(all.length);
  });

  it('covers every status present in the fixtures', () => {
    for (const status of ['confirmed', 'pending', 'cancelled', 'refunded', 'failed'] as const) {
      expect(filterBookings(all, { ...emptyBookingQuery, status }).length).toBeGreaterThan(0);
    }
  });
});

describe('court filtering', () => {
  it('filters to a single court', () => {
    const result = filterBookings(all, { ...emptyBookingQuery, court: 'padel-1' });
    expect(result.every((b) => b.court === 'padel-1')).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('covers every court present in the fixtures', () => {
    for (const court of ['padel-1', 'padel-2', 'tennis-1', 'tennis-2', 'tennis-3'] as const) {
      expect(filterBookings(all, { ...emptyBookingQuery, court }).length).toBeGreaterThan(0);
    }
  });
});

describe('combined filters', () => {
  it('applies every facet conjunctively', () => {
    const result = filterBookings(all, {
      search: '',
      dateFrom: '2026-03-02',
      dateTo: '2026-03-07',
      status: 'confirmed',
      court: 'padel-1',
    });
    for (const booking of result) {
      expect(booking.status).toBe('confirmed');
      expect(booking.court).toBe('padel-1');
      expect(toLocalDateKey(booking.startsAt) >= '2026-03-02').toBe(true);
      expect(toLocalDateKey(booking.startsAt) <= '2026-03-07').toBe(true);
    }
    expect(result.length).toBeGreaterThan(0);
  });

  it('can narrow to an empty result', () => {
    const result = filterBookings(all, {
      ...emptyBookingQuery,
      status: 'failed',
      court: 'padel-1',
    });
    expect(result).toEqual([]);
  });

  it('is order-independent and deterministic', () => {
    const query = { ...emptyBookingQuery, status: 'confirmed' as const, court: 'padel-2' as const };
    expect(filterBookings(all, query)).toEqual(filterBookings(all, query));
  });
});

describe('filter reset', () => {
  it('the empty query returns the full set', () => {
    expect(filterBookings(all, emptyBookingQuery)).toHaveLength(all.length);
  });

  it('resetting after a narrowing filter restores every booking', () => {
    const narrowed = filterBookings(all, { ...emptyBookingQuery, court: 'tennis-3', status: 'cancelled' });
    expect(narrowed.length).toBeLessThan(all.length);
    expect(filterBookings(all, emptyBookingQuery)).toHaveLength(all.length);
  });

  it('recognises the reset state', () => {
    expect(isEmptyQuery(emptyBookingQuery)).toBe(true);
    expect(isEmptyQuery({ ...emptyBookingQuery, search: '   ' })).toBe(true);
    expect(isEmptyQuery({ ...emptyBookingQuery, court: 'padel-1' })).toBe(false);
  });

  it('counts active facets', () => {
    expect(activeFilterCount(emptyBookingQuery)).toBe(0);
    expect(activeFilterCount({ ...emptyBookingQuery, search: 'a', court: 'padel-1' })).toBe(2);
    expect(
      activeFilterCount({ search: 'a', dateFrom: '2026-03-01', dateTo: '2026-03-02', status: 'confirmed', court: 'padel-1' }),
    ).toBe(5);
  });
});

// Intl.NumberFormat separates the amount from the currency symbol with a non-breaking space.
// Normalising it keeps the expectations readable without weakening them.
const NBSP = String.fromCharCode(0x00a0);
const eur = (cents: number) => formatCents(cents).split(NBSP).join(' ');

describe('money and number formatting', () => {
  it('renders integer cents as de-DE euros', () => {
    expect(eur(3600)).toBe('36,00 €');
    expect(eur(0)).toBe('0,00 €');
    expect(eur(123456)).toBe('1.234,56 €');
  });

  it('does not confuse cents with euros', () => {
    // 4800 cents is 48 euros, never 4.800 euros.
    expect(eur(4800)).toBe('48,00 €');
    expect(eur(4800)).not.toBe('4.800,00 €');
  });

  it('renders a single cent correctly', () => {
    expect(eur(1)).toBe('0,01 €');
    expect(eur(99)).toBe('0,99 €');
  });

  it('renders an em dash rather than NaN for missing values', () => {
    expect(formatCents(null)).toBe('—');
    expect(formatCents(undefined)).toBe('—');
    expect(formatCents(Number.NaN)).toBe('—');
    expect(formatCount(null)).toBe('—');
  });

  it('formats counts and percentages in German notation', () => {
    expect(formatCount(1234)).toBe('1.234');
    expect(formatPercent(42)).toBe('42 %');
    expect(formatPercent(42.5, 1)).toBe('42,5 %');
  });

  it('formats a time range with an en dash', () => {
    const range = formatTimeRange('2026-03-02T18:00:00+01:00', '2026-03-02T19:30:00+01:00');
    expect(range).toMatch(/\d{2}:\d{2} – \d{2}:\d{2}/);
    expect(formatTimeRange(null, null)).toBe('—');
  });
});

describe('fixture hygiene', () => {
  it('holds only integer cent amounts', () => {
    for (const booking of fixtureBookings) {
      expect(Number.isInteger(booking.amountCents)).toBe(true);
      expect(booking.amountCents).toBeGreaterThanOrEqual(0);
    }
  });

  it('uses unique ids and references', () => {
    expect(new Set(fixtureBookings.map((b) => b.id)).size).toBe(fixtureBookings.length);
    expect(new Set(fixtureBookings.map((b) => b.reference)).size).toBe(fixtureBookings.length);
  });

  it('carries no contact details, so the fixtures contain no personal data shape', () => {
    const serialized = JSON.stringify(fixtureBookings);
    expect(serialized).not.toMatch(/@/);
    expect(serialized).not.toMatch(/\+49|phone|email/i);
  });

  it('includes long compound German names to exercise wrapping', () => {
    expect(fixtureBookings.some((b) => b.customerName.length >= 28)).toBe(true);
    expect(fixtureBookings.some((b) => /[äöüß]/i.test(b.customerName))).toBe(true);
  });

  it('covers paid, pending, refunded and free payment states', () => {
    const states = new Set(fixtureBookings.map((b) => b.paymentStatus));
    for (const expected of ['paid', 'pending', 'refunded', 'not_required']) {
      expect(states.has(expected as never)).toBe(true);
    }
  });
});
