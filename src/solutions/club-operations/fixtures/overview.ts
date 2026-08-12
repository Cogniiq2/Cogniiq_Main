// Overview snapshot.
//
// Derived from the other fixtures rather than hand-written, so the headline figures always agree
// with the lists a user can scroll through. Hand-typed totals drift the moment a fixture row
// changes, and a dashboard whose KPIs contradict its own tables teaches the reader to distrust it.
//
// The snapshot is genuinely period-scoped. Until this phase `period` was accepted and ignored, so
// every choice in the Zeitraum control produced the same figures — a visible control that changed
// nothing. Bookings, VAT, court utilisation, the trend series and the comparison window are now all
// sliced by the resolved window; invoices, reconciliation and alerts stay whole-dataset, because a
// receivable and an unresolved discrepancy do not stop being open when the reader narrows to a week.

import {
  bookingsWithin,
  buildCounts,
  buildCourts,
  buildInvoiceCounts,
  buildPaymentStatus,
  buildPeriodTotals,
  buildRevenue,
  buildTrend,
  buildVat,
} from '../aggregation';
import { buildAttention, summariseAttention } from '../attention';
import { resolvePeriod } from '../periods';
import { toLocalDateKey } from '../formatting';
import { isWithin } from '../periods';
import type {
  ActivityEntry,
  AlertSeverityCount,
  Booking,
  Invoice,
  OperationalAlert,
  OverviewPeriod,
  OverviewSnapshot,
  Payment,
  ReconciliationEntry,
  Voucher,
} from '../types';
import { alertSeverities } from '../types';
import { fixtureBookings } from './bookings';
import { fixtureInvoices } from './invoices';
import { fixtureAlerts } from './alerts';
import { fixturePayments } from './payments';
import { fixtureReconciliation, reconciliationCounts } from './reconciliation';
import { FIXTURE_TODAY, fixtureVouchers } from './vouchers';

const fixtureActivity: ActivityEntry[] = [
  { id: 'act-01', occurredAt: '2026-03-31T09:20:00+02:00', kind: 'booking', summary: 'Neue Buchung BU-2129 für Padel 2' },
  { id: 'act-02', occurredAt: '2026-03-30T17:35:00+02:00', kind: 'booking', summary: 'Neue Buchung BU-2126 für Tennis 3' },
  { id: 'act-03', occurredAt: '2026-03-27T18:05:00+01:00', kind: 'refund', summary: 'Erstattung zu BU-2127 ausgelöst — Buchung weiterhin aktiv' },
  { id: 'act-04', occurredAt: '2026-03-26T09:12:00+01:00', kind: 'payment', summary: 'Rechnung RE-2026-0038 versendet' },
  { id: 'act-05', occurredAt: '2026-03-20T19:05:00+01:00', kind: 'voucher', summary: 'Gutschein GS-2026-0002 für BU-2123 eingelöst' },
  { id: 'act-06', occurredAt: '2026-03-14T15:05:00+01:00', kind: 'cancellation', summary: 'Buchung BU-2120 storniert' },
];

function openAlertsBySeverity(alerts: OperationalAlert[]): AlertSeverityCount[] {
  return alertSeverities
    .map((severity) => ({
      severity,
      count: alerts.filter((alert) => alert.severity === severity && alert.status !== 'resolved' && alert.status !== 'ignored').length,
    }))
    .filter((entry) => entry.count > 0);
}

export interface OverviewInput {
  bookings: Booking[];
  payments: Payment[];
  invoices: Invoice[];
  reconciliation: ReconciliationEntry[];
  vouchers: Voucher[];
  alerts: OperationalAlert[];
  /** The date the dataset is current as of. Never the wall clock. */
  asOf: string;
}

const emptyInput = (asOf: string): OverviewInput => ({
  bookings: [],
  payments: [],
  invoices: [],
  reconciliation: [],
  vouchers: [],
  alerts: [],
  asOf,
});

export function buildOverview(
  period: OverviewPeriod,
  input: OverviewInput = emptyInput(FIXTURE_TODAY),
): OverviewSnapshot {
  const { bookings, payments, invoices, reconciliation, vouchers, alerts, asOf } = input;
  const window = resolvePeriod(period, asOf);

  const inPeriod = bookingsWithin(bookings, window.current);
  const inPrevious = bookingsWithin(bookings, window.previous);

  const attention = buildAttention({
    bookings,
    payments,
    invoices,
    reconciliation,
    vouchers,
    alerts,
    asOf,
  });

  return {
    period,
    bounds: window.current,
    previousBounds: window.previous,
    comparisonLabel: window.comparisonLabel,
    revenue: buildRevenue(inPeriod),
    bookings: buildCounts(inPeriod),
    paymentStatus: buildPaymentStatus(inPeriod),
    vat: buildVat(inPeriod),
    courts: buildCourts(inPeriod),
    // Recent activity is scoped to the window too, so "Letzte Aktivität" is the activity of the
    // period being read rather than of the dataset as a whole.
    activity: fixtureActivity.filter((entry) =>
      isWithin(toLocalDateKey(entry.occurredAt), window.current),
    ),
    invoices: buildInvoiceCounts(invoices, asOf),
    reconciliation: reconciliationCounts(reconciliation),
    openAlerts: openAlertsBySeverity(alerts),
    totals: buildPeriodTotals(inPeriod),
    previous: buildPeriodTotals(inPrevious),
    trend: buildTrend(bookings, window.current, window.granularity),
    attention,
    health: summariseAttention(attention),
    dataAsOf: asOf,
  };
}

/** The whole fixture dataset, sliced to the requested period. */
export function fixtureOverview(period: OverviewPeriod): OverviewSnapshot {
  return buildOverview(period, {
    bookings: fixtureBookings,
    payments: fixturePayments,
    invoices: fixtureInvoices,
    reconciliation: fixtureReconciliation,
    vouchers: fixtureVouchers,
    alerts: fixtureAlerts,
    asOf: FIXTURE_TODAY,
  });
}

/** A structurally valid but entirely empty snapshot, for the "no data yet" state. */
export function emptyOverview(period: OverviewPeriod): OverviewSnapshot {
  return buildOverview(period, emptyInput(FIXTURE_TODAY));
}
