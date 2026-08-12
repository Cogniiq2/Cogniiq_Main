// Derived-insight guarantees.
//
// Everything the redesigned dashboard *claims* rather than merely lists: reporting windows, movement
// against a previous period, the attention model, and the promise that a count shown on the overview
// is the number of rows its target section will actually show.
//
// The last of those is the point of this file. An attention item is only trustworthy if drilling
// into it reproduces it, so the tests apply each item's own filter through the adapter and compare
// row counts — rather than restating the arithmetic the model already performs, which would only
// prove that the same expression evaluates the same way twice.

import { describe, expect, it } from 'vitest';

import { buildPeriodTotals, buildTrend, bookingsWithin } from './aggregation';
import { createFixtureAdapter } from './adapter/fixtureAdapter';
import { buildAttention, healthVerdict, summariseAttention } from './attention';
import { filterAlerts, filterInvoices, filterPayments, filterReconciliation, filterVouchers, isAlertOpen, withSeed } from './filtering';
import { percentChange, formatSignedPercent, formatDayRange, toLocalDateKey } from './formatting';
import { fixtureAlerts } from './fixtures/alerts';
import { fixtureBookings } from './fixtures/bookings';
import { fixtureInvoices } from './fixtures/invoices';
import { fixturePayments } from './fixtures/payments';
import { fixtureReconciliation } from './fixtures/reconciliation';
import { FIXTURE_TODAY, fixtureVouchers } from './fixtures/vouchers';
import { addDays, daysInBounds, eachDay, resolvePeriod, startOfMonth, startOfWeek } from './periods';
import { overviewPeriods, type AttentionItem } from './types';

const dataset = {
  bookings: fixtureBookings,
  payments: fixturePayments,
  invoices: fixtureInvoices,
  reconciliation: fixtureReconciliation,
  vouchers: fixtureVouchers,
  alerts: fixtureAlerts,
  asOf: FIXTURE_TODAY,
};

/* ================================================================== Periods */

describe('reporting windows', () => {
  it('resolves every period to a window and a strictly earlier comparison window', () => {
    for (const period of overviewPeriods) {
      const window = resolvePeriod(period, FIXTURE_TODAY);
      expect(window.current.start <= window.current.end, period).toBe(true);
      expect(window.previous.start <= window.previous.end, period).toBe(true);
      // No overlap: a delta computed against a window containing part of itself is not a delta.
      expect(window.previous.end < window.current.start, period).toBe(true);
      expect(window.comparisonLabel.length).toBeGreaterThan(0);
    }
  });

  it('gives the comparison window the same length as the current one, where the period is fixed', () => {
    for (const period of ['today', 'week'] as const) {
      const window = resolvePeriod(period, FIXTURE_TODAY);
      expect(daysInBounds(window.current), period).toBe(daysInBounds(window.previous));
    }
  });

  it('uses calendar months, not rolling 30-day windows', () => {
    const month = resolvePeriod('month', FIXTURE_TODAY);
    expect(month.current).toEqual({ start: '2026-03-01', end: '2026-03-31' });
    expect(month.previous).toEqual({ start: '2026-02-01', end: '2026-02-28' });

    const last = resolvePeriod('last_month', FIXTURE_TODAY);
    expect(last.current).toEqual({ start: '2026-02-01', end: '2026-02-28' });
    expect(last.previous).toEqual({ start: '2026-01-01', end: '2026-01-31' });
  });

  it('starts weeks on Monday', () => {
    // 2026-03-31 is a Tuesday, so its week starts on the 30th.
    expect(startOfWeek('2026-03-31')).toBe('2026-03-30');
    expect(startOfWeek('2026-03-30')).toBe('2026-03-30');
    // A Sunday belongs to the week that began the previous Monday, not to the next one.
    expect(startOfWeek('2026-03-29')).toBe('2026-03-23');
  });

  it('computes windows independently of the runtime timezone', () => {
    // The helpers work on YYYY-MM-DD through UTC, so no local-midnight shift can move a boundary.
    expect(startOfMonth('2026-03-01')).toBe('2026-03-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(eachDay({ start: '2026-03-29', end: '2026-03-31' })).toEqual([
      '2026-03-29', '2026-03-30', '2026-03-31',
    ]);
  });

  it('every period the UI offers contains at least one booking', async () => {
    // A period control whose options mostly resolve to an empty state teaches the reader that the
    // control is broken. "Heute" in particular is the reason the fixture carries same-day bookings.
    const adapter = createFixtureAdapter();
    for (const period of overviewPeriods) {
      const overview = await adapter.getOverview({ period });
      expect(overview.bookings.total, period).toBeGreaterThan(0);
    }
  });
});

/* ================================================================ Comparison */

describe('period comparison', () => {
  it('derives totals from the same predicates the headline figures use', () => {
    const window = resolvePeriod('month', FIXTURE_TODAY);
    const inWindow = bookingsWithin(fixtureBookings, window.current);
    const totals = buildPeriodTotals(inWindow);

    expect(totals.bookingCount).toBe(inWindow.length);
    expect(totals.revenueCents).toBe(
      inWindow.filter((b) => b.paymentStatus === 'paid').reduce((sum, b) => sum + b.amountCents, 0),
    );
    expect(totals.paidCount).toBe(inWindow.filter((b) => b.paymentStatus === 'paid').length);
    expect(totals.refundedCount).toBe(inWindow.filter((b) => b.paymentStatus === 'refunded').length);
    expect(totals.cancelledCount).toBe(inWindow.filter((b) => b.status === 'cancelled').length);
  });

  it('exposes real movement between March and February rather than a flat zero', async () => {
    const overview = await createFixtureAdapter().getOverview({ period: 'month' });
    expect(overview.previous.bookingCount).toBeGreaterThan(0);
    expect(overview.totals.bookingCount).not.toBe(overview.previous.bookingCount);
    expect(overview.comparisonLabel).toBe('Vormonat');
  });

  it('reports no rate of change against a zero baseline instead of inventing one', () => {
    expect(percentChange(10, 0)).toBeNull();
    expect(percentChange(0, 0)).toBeNull();
    expect(percentChange(150, 100)).toBeCloseTo(50);
    expect(percentChange(50, 100)).toBeCloseTo(-50);
  });

  it('signs a percentage with a real minus sign, not a hyphen', () => {
    expect(formatSignedPercent(12.34)).toBe('+12,3 %');
    expect(formatSignedPercent(-8)).toBe('−8,0 %');
    expect(formatSignedPercent(0)).toBe('0,0 %');
  });

  it('states both ends of a window, and collapses a single-day one', () => {
    expect(formatDayRange('2026-03-01', '2026-03-31')).toBe('01.03.2026 – 31.03.2026');
    expect(formatDayRange('2026-03-31', '2026-03-31')).toBe('31.03.2026');
  });
});

/* ===================================================================== Trend */

describe('trend series', () => {
  it('emits every bucket in the window, including the empty ones', () => {
    const bounds = { start: '2026-03-01', end: '2026-03-31' };
    const trend = buildTrend(fixtureBookings, bounds, 'day');
    expect(trend).toHaveLength(31);
    expect(trend.some((point) => point.bookingCount === 0)).toBe(true);
  });

  it('sums to the window total, so the chart and the headline agree', () => {
    const bounds = { start: '2026-03-01', end: '2026-03-31' };
    const trend = buildTrend(fixtureBookings, bounds, 'day');
    const totals = buildPeriodTotals(bookingsWithin(fixtureBookings, bounds));

    expect(trend.reduce((sum, point) => sum + point.bookingCount, 0)).toBe(totals.bookingCount);
    expect(trend.reduce((sum, point) => sum + point.revenueCents, 0)).toBe(totals.revenueCents);
  });

  it('buckets by week without losing or duplicating a booking', () => {
    const bounds = { start: '2026-03-01', end: '2026-03-31' };
    const weekly = buildTrend(fixtureBookings, bounds, 'week');
    const daily = buildTrend(fixtureBookings, bounds, 'day');

    expect(weekly.length).toBeLessThan(daily.length);
    expect(weekly.reduce((sum, point) => sum + point.bookingCount, 0)).toBe(
      daily.reduce((sum, point) => sum + point.bookingCount, 0),
    );
    // Every bucket key is the Monday of its week.
    for (const point of weekly) expect(startOfWeek(point.key)).toBe(point.key);
  });

  it('places each booking in the bucket of its local date', () => {
    const bounds = { start: '2026-03-30', end: '2026-03-31' };
    const trend = buildTrend(fixtureBookings, bounds, 'day');
    for (const point of trend) {
      const expected = fixtureBookings.filter(
        (booking) => toLocalDateKey(booking.startsAt) === point.key,
      );
      expect(point.bookingCount, point.key).toBe(expected.length);
    }
  });
});

/* ================================================================= Attention */

describe('the attention model', () => {
  const items = buildAttention(dataset);

  it('finds something in a dataset that deliberately contains anomalies', () => {
    expect(items.length).toBeGreaterThan(0);
  });

  it('never lists an item with a count of zero', () => {
    for (const item of items) expect(item.count, item.id).toBeGreaterThan(0);
  });

  it('orders the most serious first, then by money at stake', () => {
    const rank = { critical: 0, high: 1, medium: 2, low: 3 } as const;
    for (let index = 1; index < items.length; index += 1) {
      const previous = items[index - 1];
      const current = items[index];
      expect(rank[previous.severity], `${previous.id} before ${current.id}`).toBeLessThanOrEqual(
        rank[current.severity],
      );
      if (previous.severity === current.severity) {
        expect(previous.amountCents ?? 0).toBeGreaterThanOrEqual(current.amountCents ?? 0);
      }
    }
  });

  it('gives every item a target section inside this module', () => {
    for (const item of items) {
      expect(item.target.section, item.id).toBeTruthy();
      expect(item.title.length, item.id).toBeGreaterThan(0);
      expect(item.detail.length, item.id).toBeGreaterThan(0);
    }
  });

  /**
   * The central promise: an item's count is the number of rows its own drill-down produces.
   * Checked against the same filter functions the sections use, applied to the same fixtures.
   */
  it('reproduces every count through its own drill-down filter', () => {
    const resolve: Record<string, (item: AttentionItem) => number> = {
      reconciliation: (item) =>
        filterReconciliation(fixtureReconciliation, withSeed({ search: '', issue: 'all', severity: 'all' }, item.target.filter)).length,
      payments: (item) =>
        filterPayments(fixturePayments, withSeed({ search: '', dateFrom: '', dateTo: '', provider: 'all', status: 'all', metaClass: 'all' }, item.target.filter)).length,
      vouchers: (item) =>
        filterVouchers(fixtureVouchers, withSeed({ search: '', status: 'all' }, item.target.filter))
          // The finding is "expired *with a balance*", which the status facet alone cannot express.
          .filter((voucher) => voucher.remainingCents > 0).length,
      alerts: (item) =>
        filterAlerts(fixtureAlerts, withSeed({ search: '', dateFrom: '', dateTo: '', severity: 'all', status: 'all', category: 'all' }, item.target.filter)).length,
    };

    for (const item of items) {
      const resolver = resolve[item.target.section];
      if (!resolver) continue; // invoices and bookings are checked separately below
      expect(resolver(item), `${item.id} -> ${item.target.section}`).toBe(item.count);
    }
  });

  it('counts overdue invoices as a strict subset of the open ones its drill-down shows', () => {
    const overdue = items.find((item) => item.id === 'invoices-overdue');
    expect(overdue).toBeDefined();
    const open = filterInvoices(fixtureInvoices, withSeed({ search: '', dateFrom: '', dateTo: '', status: 'all' }, overdue!.target.filter));
    // The invoice section has no "overdue" facet — overdue is derived from the due date — so the
    // drill-down lands on the open invoices, of which the overdue ones are a subset.
    expect(overdue!.count).toBeLessThanOrEqual(open.length);
    expect(open.filter((invoice) => invoice.dueDate < FIXTURE_TODAY)).toHaveLength(overdue!.count);
  });

  it('counts unresolved VAT as the bookings the ledger itself flags', () => {
    const vat = items.find((item) => item.id === 'vat-unresolved');
    expect(vat).toBeDefined();
    expect(vat!.count).toBe(
      fixtureBookings.filter((booking) => booking.taxCategory === 'padel_unresolved').length,
    );
  });

  it('counts open alerts on the same definition the Alert Center uses', () => {
    const alertItems = items.filter((item) => item.id.startsWith('alerts-'));
    const total = alertItems.reduce((sum, item) => sum + item.count, 0);
    expect(total).toBe(fixtureAlerts.filter(isAlertOpen).length);
  });

  it('produces an empty model, and a clean verdict, for an empty dataset', () => {
    const empty = buildAttention({
      bookings: [], payments: [], invoices: [], reconciliation: [], vouchers: [], alerts: [],
      asOf: FIXTURE_TODAY,
    });
    expect(empty).toEqual([]);
    const health = summariseAttention(empty);
    expect(health.total).toBe(0);
    expect(health.moneyAtRiskCents).toBe(0);
    expect(healthVerdict(health)).toEqual({ tone: 'success', label: 'Ohne Auffälligkeiten' });
  });
});

/* ============================================================ Health summary */

describe('operational health', () => {
  const health = summariseAttention(buildAttention(dataset));

  it('sums each severity across the model', () => {
    const items = buildAttention(dataset);
    const countOf = (severity: AttentionItem['severity']) =>
      items.filter((item) => item.severity === severity).reduce((sum, item) => sum + item.count, 0);

    expect(health.critical).toBe(countOf('critical'));
    expect(health.high).toBe(countOf('high'));
    expect(health.medium).toBe(countOf('medium'));
    expect(health.low).toBe(countOf('low'));
    expect(health.total).toBe(health.critical + health.high + health.medium + health.low);
  });

  it('escalates the verdict on the most serious finding present', () => {
    expect(healthVerdict({ critical: 1, high: 0, medium: 0, low: 0, total: 1, moneyAtRiskCents: 0 }).tone).toBe('danger');
    expect(healthVerdict({ critical: 0, high: 2, medium: 0, low: 0, total: 2, moneyAtRiskCents: 0 }).tone).toBe('warning');
    expect(healthVerdict({ critical: 0, high: 0, medium: 0, low: 3, total: 3, moneyAtRiskCents: 0 }).tone).toBe('warning');
    expect(healthVerdict({ critical: 0, high: 0, medium: 0, low: 0, total: 0, moneyAtRiskCents: 0 }).tone).toBe('success');
  });

  it('does not move when the reader narrows the reporting period', async () => {
    // Health describes standing obligations, not the window. A treasurer who narrows to "Heute"
    // must not see the club's open discrepancies appear to resolve themselves.
    const adapter = createFixtureAdapter();
    const month = await adapter.getOverview({ period: 'month' });
    const today = await adapter.getOverview({ period: 'today' });
    expect(today.health).toEqual(month.health);
    expect(today.attention).toEqual(month.attention);
  });
});

/* ================================================================== Seeding */

describe('drill-down seeding', () => {
  it('applies facets the target query declares', () => {
    expect(withSeed({ search: '', status: 'all' }, { status: 'expired' })).toEqual({
      search: '',
      status: 'expired',
    });
  });

  it('ignores facets the target query does not declare', () => {
    // A target is data. Data that could add arbitrary keys could reach the adapter with a facet the
    // section never validated.
    expect(withSeed({ search: '', status: 'all' }, { severity: 'critical' })).toEqual({
      search: '',
      status: 'all',
    });
  });

  it('returns the base query untouched when there is nothing to seed', () => {
    const base = { search: '', status: 'all' };
    expect(withSeed(base, undefined)).toBe(base);
  });

  it('every attention target seeds a query its section actually accepts', () => {
    // Guards the failure this file exists to prevent: a target naming a facet that silently does
    // nothing, producing a drill-down that lands on an unfiltered list.
    const declared: Record<string, string[]> = {
      reconciliation: ['search', 'issue', 'severity'],
      payments: ['search', 'dateFrom', 'dateTo', 'provider', 'status', 'metaClass'],
      invoices: ['search', 'dateFrom', 'dateTo', 'status'],
      vouchers: ['search', 'status'],
      alerts: ['search', 'dateFrom', 'dateTo', 'severity', 'status', 'category'],
      bookings: ['search', 'dateFrom', 'dateTo', 'status', 'court'],
    };

    for (const item of buildAttention(dataset)) {
      const allowed = declared[item.target.section];
      expect(allowed, `${item.id} targets ${item.target.section}`).toBeDefined();
      for (const key of Object.keys(item.target.filter ?? {})) {
        expect(allowed, `${item.id} seeds "${key}"`).toContain(key);
      }
    }
  });
});
