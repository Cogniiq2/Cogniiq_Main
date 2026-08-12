// Reporting windows and their comparison periods.
//
// Every period the overview offers resolves to an explicit pair of windows: the one being looked at
// and the one immediately before it. Without the second window a dashboard can state a figure but
// never state whether it is good, which is the question staff actually have.
//
// All arithmetic runs on YYYY-MM-DD strings through UTC date objects. Deliberately not on local
// `Date` construction: a window boundary computed in the browser's timezone and a window boundary
// computed in a test runner's timezone would disagree, and the figures would move between them.
//
// Nothing here reads the clock. The anchor date is always passed in, so the same input always
// produces the same window.

import type { OverviewPeriod, PeriodBounds } from './types';

/** A reporting window together with the window it is compared against. */
export interface PeriodWindow {
  current: PeriodBounds;
  previous: PeriodBounds;
  /** German name of the comparison, e.g. "Vormonat". Shown beside every delta. */
  comparisonLabel: string;
  /** How the trend series inside the window is bucketed. */
  granularity: 'day' | 'week';
}

function toUtc(day: string): Date {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, date));
}

function toKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(day: string, delta: number): string {
  const date = toUtc(day);
  date.setUTCDate(date.getUTCDate() + delta);
  return toKey(date);
}

export function addMonths(day: string, delta: number): string {
  const date = toUtc(day);
  date.setUTCMonth(date.getUTCMonth() + delta, 1);
  return toKey(date);
}

/** Monday of the week containing `day`. German weeks start on Monday, not Sunday. */
export function startOfWeek(day: string): string {
  const date = toUtc(day);
  // getUTCDay(): 0 = Sunday. Shift so Monday is 0.
  const offset = (date.getUTCDay() + 6) % 7;
  return addDays(day, -offset);
}

export function startOfMonth(day: string): string {
  return `${day.slice(0, 7)}-01`;
}

export function endOfMonth(day: string): string {
  const date = toUtc(startOfMonth(day));
  date.setUTCMonth(date.getUTCMonth() + 1, 0);
  return toKey(date);
}

/** Inclusive day count of a window. Always at least 1. */
export function daysInBounds(bounds: PeriodBounds): number {
  return Math.max(
    1,
    Math.round((toUtc(bounds.end).getTime() - toUtc(bounds.start).getTime()) / 86_400_000) + 1,
  );
}

/** Every YYYY-MM-DD in the window, inclusive of both ends. */
export function eachDay(bounds: PeriodBounds): string[] {
  const days: string[] = [];
  for (let day = bounds.start; day <= bounds.end; day = addDays(day, 1)) days.push(day);
  return days;
}

/**
 * Resolve a period against an anchor date.
 *
 * `month` is the calendar month containing the anchor and is compared against the whole preceding
 * calendar month — not the preceding 30 days. Staff close their books by calendar month, so a
 * rolling window would produce a number that reconciles against nothing they file.
 */
export function resolvePeriod(period: OverviewPeriod, asOf: string): PeriodWindow {
  switch (period) {
    case 'today':
      return {
        current: { start: asOf, end: asOf },
        previous: { start: addDays(asOf, -1), end: addDays(asOf, -1) },
        comparisonLabel: 'Vortag',
        granularity: 'day',
      };
    case 'week': {
      const start = startOfWeek(asOf);
      return {
        current: { start, end: asOf },
        previous: { start: addDays(start, -7), end: addDays(asOf, -7) },
        comparisonLabel: 'Vorwoche',
        granularity: 'day',
      };
    }
    case 'month': {
      const start = startOfMonth(asOf);
      const previousStart = addMonths(start, -1);
      return {
        current: { start, end: endOfMonth(asOf) },
        previous: { start: previousStart, end: endOfMonth(previousStart) },
        comparisonLabel: 'Vormonat',
        granularity: 'week',
      };
    }
    case 'last_month': {
      const start = addMonths(startOfMonth(asOf), -1);
      const previousStart = addMonths(start, -1);
      return {
        current: { start, end: endOfMonth(start) },
        previous: { start: previousStart, end: endOfMonth(previousStart) },
        comparisonLabel: 'Vormonat',
        granularity: 'week',
      };
    }
  }
}

/** True when the local calendar date of `iso` falls inside the window. */
export function isWithin(dayKey: string, bounds: PeriodBounds): boolean {
  // Lexicographic comparison is exact for zero-padded YYYY-MM-DD.
  return dayKey !== '' && dayKey >= bounds.start && dayKey <= bounds.end;
}
