// Transport-backed implementation of the read-only adapter contract.
//
// It satisfies exactly the same interface as the fixture adapter, so swapping one for the other is a
// call-site change and nothing else. What it adds is the two things a real data path needs and a
// fixture does not: a mapping from transport outcomes onto the five public error codes, and runtime
// validation of every response before it reaches a component.
//
// What it deliberately does not have:
//   * a URL, host, project reference, alias or credential — the transport is injected;
//   * knowledge of the signing protocol, of Supabase, or of which system is upstream;
//   * a mutating method of any kind.
//
// Every failure becomes a `ClubOperationsError` carrying one of the five codes, so the UI's German
// messages stay the entire error surface. Internal detail never crosses this boundary.

import type {
  ActivityPage,
  ActivityQuery,
  AlertPage,
  AlertQuery,
  BookingPage,
  BookingQuery,
  InvoicePage,
  InvoiceQuery,
  MemberPage,
  MemberQuery,
  MonthlyReportComparison,
  MonthlyReportQuery,
  OverviewQuery,
  OverviewSnapshot,
  PaymentPage,
  PaymentQuery,
  ReconciliationPage,
  ReconciliationQuery,
  ReportQuery,
  ReportSnapshot,
  SettingsSnapshot,
  VoucherPage,
  VoucherQuery,
} from '../types';
import { ClubOperationsError, type ClubOperationsAdapter } from './ClubOperationsAdapter';
import {
  MalformedResponseError,
  validateActivityPage,
  validateAlertPage,
  validateBookingPage,
  validateInvoicePage,
  validateMemberPage,
  validateMonthlyReportComparison,
  validateOverviewSnapshot,
  validatePaymentPage,
  validateReconciliationPage,
  validateReportSnapshot,
  validateSettingsSnapshot,
  validateVoucherPage,
} from './responseValidation';
import type { ClubOperationsOperation, ClubOperationsTransport } from './transport';

export interface TransportAdapterOptions {
  transport: ClubOperationsTransport;
  /** Identifies the implementation in diagnostics. Never a connection target. */
  id?: string;
}

/**
 * Transport status → public error code.
 *
 *   401 → unauthorized   the session is gone; the user signs in again
 *   403 → forbidden      one identical answer for every denial reason, so nothing is probeable
 *   400 → invalid_query  a malformed request, i.e. a bug rather than a user error
 *   429 → unavailable    rate limited; deliberately not its own code, which would leak the limit
 *   5xx → unavailable    upstream could not answer
 *
 * A trust failure between the two servers must map to `unavailable`, never `forbidden`: surfacing it
 * as a permission problem would turn the client into an oracle for probing that relationship.
 */
function errorForStatus(status: number): ClubOperationsError {
  if (status === 401) return new ClubOperationsError('unauthorized', 'Sitzung ungültig.');
  if (status === 403) return new ClubOperationsError('forbidden', 'Zugriff verweigert.');
  if (status === 400 || status === 422) {
    return new ClubOperationsError('invalid_query', 'Abfrage ungültig.');
  }
  if (status === 429 || status >= 500) {
    return new ClubOperationsError('unavailable', 'Quelle nicht erreichbar.');
  }
  return new ClubOperationsError('unknown', 'Unerwartete Antwort.');
}

export function createTransportAdapter(options: TransportAdapterOptions): ClubOperationsAdapter {
  const { transport, id = 'transport' } = options;

  async function call<T>(
    operation: ClubOperationsOperation,
    query: Record<string, unknown>,
    validate: (value: unknown) => T,
  ): Promise<T> {
    let response;
    try {
      response = await transport({ operation, query });
    } catch (cause) {
      // A ClubOperationsError raised by the transport itself is already in the public vocabulary and
      // passes through unchanged. Anything else means the request did not complete — which is what
      // `unavailable` describes — and its internals must not escape.
      if (cause instanceof ClubOperationsError) throw cause;
      throw new ClubOperationsError('unavailable', 'Quelle nicht erreichbar.');
    }

    if (response.status !== 200) throw errorForStatus(response.status);

    try {
      return validate(response.body);
    } catch (cause) {
      // A response that does not match the domain shape is the `unknown` case by definition: the
      // request succeeded, so it is neither a permission nor an availability problem, and the caller
      // must not receive a partially valid object.
      if (cause instanceof MalformedResponseError) {
        throw new ClubOperationsError('unknown', 'Antwort konnte nicht gelesen werden.');
      }
      throw new ClubOperationsError('unknown', 'Antwort konnte nicht gelesen werden.');
    }
  }

  return {
    id,

    getOverview(query: OverviewQuery): Promise<OverviewSnapshot> {
      return call('getOverview', { ...query }, validateOverviewSnapshot);
    },

    listBookings(query: BookingQuery): Promise<BookingPage> {
      return call('listBookings', { ...query }, validateBookingPage);
    },

    listPayments(query: PaymentQuery): Promise<PaymentPage> {
      return call('listPayments', { ...query }, validatePaymentPage);
    },

    listInvoices(query: InvoiceQuery): Promise<InvoicePage> {
      return call('listInvoices', { ...query }, validateInvoicePage);
    },

    listReconciliation(query: ReconciliationQuery): Promise<ReconciliationPage> {
      return call('listReconciliation', { ...query }, validateReconciliationPage);
    },

    getMonthlyReport(query: MonthlyReportQuery): Promise<MonthlyReportComparison> {
      return call('getMonthlyReport', { ...query }, validateMonthlyReportComparison);
    },

    getReport(query: ReportQuery): Promise<ReportSnapshot> {
      return call('getReport', { ...query }, validateReportSnapshot);
    },

    listVouchers(query: VoucherQuery): Promise<VoucherPage> {
      return call('listVouchers', { ...query }, validateVoucherPage);
    },

    listMembers(query: MemberQuery): Promise<MemberPage> {
      return call('listMembers', { ...query }, validateMemberPage);
    },

    listActivity(query: ActivityQuery): Promise<ActivityPage> {
      return call('listActivity', { ...query }, validateActivityPage);
    },

    listAlerts(query: AlertQuery): Promise<AlertPage> {
      return call('listAlerts', { ...query }, validateAlertPage);
    },

    getSettings(): Promise<SettingsSnapshot> {
      return call('getSettings', {}, validateSettingsSnapshot);
    },
  };
}
