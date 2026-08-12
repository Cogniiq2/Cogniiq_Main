// Fixture adapter — the only adapter implementation in this phase.
//
// It reads from local fixture arrays. It performs no network request, opens no client, reads no
// environment variable and accepts no credential. Replacing it with a gateway adapter later is a
// one-line change at the call site, because both satisfy `ClubOperationsAdapter`.
//
// Scenarios make every UI state reachable deterministically, which is what lets the states be
// tested and inspected without a server:
//
//   populated — the full fixture set
//   empty     — a successful response that happens to contain nothing
//   error     — a typed failure, for the error state
//   loading   — never settles, for inspecting the loading state
//
// `latencyMs` defaults to 0 so tests resolve on the microtask queue rather than on timers.

import { buildInvoiceCounts } from '../aggregation';
import {
  filterActivity,
  filterAlerts,
  filterBookings,
  filterInvoices,
  filterMembers,
  filterPayments,
  filterReconciliation,
  filterVouchers,
  isAlertOpen,
} from '../filtering';
import { fixtureActivityRecords } from '../fixtures/activity';
import { fixtureAlerts } from '../fixtures/alerts';
import { fixtureBookings } from '../fixtures/bookings';
import { fixtureInvoices } from '../fixtures/invoices';
import { fixtureMembers } from '../fixtures/members';
import { monthlyReportComparison } from '../fixtures/monthlyReports';
import { buildOverview } from '../fixtures/overview';
import { fixturePayments } from '../fixtures/payments';
import { fixtureReconciliation, reconciliationCounts } from '../fixtures/reconciliation';
import { buildReport } from '../fixtures/reports';
import { fixtureSettings } from '../fixtures/settings';
import { FIXTURE_TODAY, fixtureVouchers } from '../fixtures/vouchers';
import {
  alertSeverities,
  paymentProviders,
  paymentStatuses,
  type ActivityPage,
  type ActivityQuery,
  type AlertPage,
  type AlertQuery,
  type BookingPage,
  type BookingQuery,
  type InvoicePage,
  type InvoiceQuery,
  type MemberPage,
  type MemberQuery,
  type MonthlyReportComparison,
  type MonthlyReportQuery,
  type OverviewQuery,
  type OverviewSnapshot,
  type Payment,
  type PaymentPage,
  type PaymentQuery,
  type PaymentTotals,
  type ReconciliationPage,
  type ReconciliationQuery,
  type ReportQuery,
  type ReportSnapshot,
  type SettingsSnapshot,
  type VoucherPage,
  type VoucherQuery,
  type VoucherTotals,
} from '../types';
import {
  ClubOperationsError,
  type ClubOperationsAdapter,
  type ClubOperationsErrorCode,
} from './ClubOperationsAdapter';

export type FixtureScenario = 'populated' | 'empty' | 'error' | 'loading';

export interface FixtureAdapterOptions {
  scenario?: FixtureScenario;
  /** Artificial delay in ms. 0 keeps tests off the timer queue. */
  latencyMs?: number;
  /** Which failure the `error` scenario produces. */
  errorCode?: ClubOperationsErrorCode;
}

function settle<T>(value: T, latencyMs: number): Promise<T> {
  if (latencyMs <= 0) return Promise.resolve(value);
  return new Promise((resolve) => setTimeout(() => resolve(value), latencyMs));
}

function paymentTotals(payments: Payment[]): PaymentTotals {
  const grossCents = payments
    .filter((p) => p.status === 'paid' || p.status === 'refunded')
    .reduce((sum, p) => sum + p.grossCents, 0);
  const refundedCents = payments.reduce((sum, p) => sum + p.refundedCents, 0);
  return {
    grossCents,
    refundedCents,
    netCents: grossCents - refundedCents,
    pendingCents: payments.filter((p) => p.status === 'pending').reduce((sum, p) => sum + p.grossCents, 0),
    succeededCount: payments.filter((p) => p.status === 'paid').length,
    pendingCount: payments.filter((p) => p.status === 'pending').length,
    refundedCount: payments.filter((p) => p.refundedCents > 0).length,
    doubleBookingCount: payments.filter((p) => p.metaClass === 'double_booking').length,
    customerCancelledCount: payments.filter((p) => p.metaClass === 'customer_cancelled').length,
  };
}

function voucherTotals(vouchers: VoucherPage['vouchers']): VoucherTotals {
  return {
    count: vouchers.length,
    issuedValueCents: vouchers.reduce((sum, v) => sum + v.originalValueCents, 0),
    redeemedValueCents: vouchers.reduce(
      (sum, v) => sum + (v.originalValueCents - v.remainingCents),
      0,
    ),
    outstandingValueCents: vouchers
      .filter((v) => v.status !== 'expired')
      .reduce((sum, v) => sum + v.remainingCents, 0),
    expiredCount: vouchers.filter((v) => v.status === 'expired').length,
  };
}

/** An overview shaped correctly but with every figure at zero, for the empty scenario. */
function emptySnapshot(query: OverviewQuery): OverviewSnapshot {
  return buildOverview(query.period);
}

export function createFixtureAdapter(options: FixtureAdapterOptions = {}): ClubOperationsAdapter {
  const { scenario = 'populated', latencyMs = 0, errorCode = 'unavailable' } = options;
  const isEmpty = scenario === 'empty';

  function guard<T>(produce: () => T): Promise<T> {
    if (scenario === 'loading') return new Promise<T>(() => {});
    if (scenario === 'error') {
      return Promise.reject(
        new ClubOperationsError(errorCode, `Fixture-Szenario "${scenario}" (${errorCode})`),
      );
    }
    // A failure inside `produce` must surface as a rejected promise, never as a synchronous throw:
    // callers await these methods, and a synchronous throw would bypass the resource hook's error
    // handling entirely and escape as an unhandled exception during render.
    try {
      return settle(produce(), latencyMs);
    } catch (cause) {
      return Promise.reject(cause);
    }
  }

  const bookings = () => (isEmpty ? [] : fixtureBookings);
  const payments = () => (isEmpty ? [] : fixturePayments);
  const invoices = () => (isEmpty ? [] : fixtureInvoices);
  const reconciliation = () => (isEmpty ? [] : fixtureReconciliation);
  const vouchers = () => (isEmpty ? [] : fixtureVouchers);
  const members = () => (isEmpty ? [] : fixtureMembers);
  const activity = () => (isEmpty ? [] : fixtureActivityRecords);
  const alerts = () => (isEmpty ? [] : fixtureAlerts);

  return {
    id: `fixture:${scenario}`,

    getOverview(query: OverviewQuery): Promise<OverviewSnapshot> {
      return guard(() =>
        isEmpty
          ? emptySnapshot(query)
          : buildOverview(query.period, {
              bookings: bookings(),
              payments: payments(),
              invoices: invoices(),
              reconciliation: reconciliation(),
              vouchers: vouchers(),
              alerts: alerts(),
              asOf: FIXTURE_TODAY,
            }),
      );
    },

    listBookings(query: BookingQuery): Promise<BookingPage> {
      return guard(() => {
        const result = filterBookings(bookings(), query);
        return { bookings: result, total: result.length };
      });
    },

    listPayments(query: PaymentQuery): Promise<PaymentPage> {
      return guard(() => {
        const result = filterPayments(payments(), query);
        return {
          payments: result,
          total: result.length,
          totals: paymentTotals(result),
          byProvider: paymentProviders
            .map((provider) => {
              const slice = result.filter((p) => p.provider === provider);
              return {
                provider,
                count: slice.length,
                amountCents: slice.reduce((sum, p) => sum + p.grossCents, 0),
              };
            })
            .filter((slice) => slice.count > 0),
          byStatus: paymentStatuses
            .map((status) => {
              const slice = result.filter((p) => p.status === status);
              return {
                status,
                count: slice.length,
                amountCents: slice.reduce((sum, p) => sum + p.grossCents, 0),
              };
            })
            .filter((slice) => slice.count > 0),
        };
      });
    },

    listInvoices(query: InvoiceQuery): Promise<InvoicePage> {
      return guard(() => {
        const result = filterInvoices(invoices(), query);
        return {
          invoices: result,
          total: result.length,
          counts: buildInvoiceCounts(result, FIXTURE_TODAY),
        };
      });
    },

    listReconciliation(query: ReconciliationQuery): Promise<ReconciliationPage> {
      return guard(() => {
        const result = filterReconciliation(reconciliation(), query);
        return { entries: result, total: result.length, counts: reconciliationCounts(result) };
      });
    },

    getMonthlyReport(query: MonthlyReportQuery): Promise<MonthlyReportComparison> {
      return guard(() => {
        if (isEmpty) {
          throw new ClubOperationsError('unavailable', 'Keine Monatsberichte vorhanden.');
        }
        const comparison = monthlyReportComparison(query.month);
        if (!comparison) {
          throw new ClubOperationsError('invalid_query', 'Unbekannter Berichtsmonat.');
        }
        return comparison;
      });
    },

    getReport(query: ReportQuery): Promise<ReportSnapshot> {
      return guard(() => buildReport(bookings(), query.range));
    },

    listVouchers(query: VoucherQuery): Promise<VoucherPage> {
      return guard(() => {
        const result = filterVouchers(vouchers(), query);
        return { vouchers: result, total: result.length, totals: voucherTotals(result) };
      });
    },

    listMembers(query: MemberQuery): Promise<MemberPage> {
      return guard(() => {
        const result = filterMembers(members(), query);
        return {
          members: result,
          total: result.length,
          totals: {
            total: result.length,
            active: result.filter((m) => m.status === 'active').length,
            padel: result.filter((m) => m.membershipType === 'padel').length,
            tennis: result.filter((m) => m.membershipType === 'tennis').length,
            combination: result.filter((m) => m.membershipType === 'combination').length,
          },
        };
      });
    },

    listActivity(query: ActivityQuery): Promise<ActivityPage> {
      return guard(() => {
        const result = filterActivity(activity(), query);
        return { records: result, total: result.length };
      });
    },

    listAlerts(query: AlertQuery): Promise<AlertPage> {
      return guard(() => {
        const result = filterAlerts(alerts(), query);
        const open = result.filter(isAlertOpen);
        return {
          alerts: result,
          total: result.length,
          openCount: open.length,
          openBySeverity: alertSeverities
            .map((severity) => ({
              severity,
              count: open.filter((alert) => alert.severity === severity).length,
            }))
            .filter((entry) => entry.count > 0),
        };
      });
    },

    getSettings(): Promise<SettingsSnapshot> {
      return guard(() =>
        isEmpty ? { groups: [], roles: [], permissionGroups: [] } : fixtureSettings,
      );
    },
  };
}
