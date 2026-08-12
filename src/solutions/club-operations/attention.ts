// The attention model.
//
// One definition of "something needs a human", derived from the same records the sections list.
// Before this existed, six sections each counted their own problems their own way, and nothing
// stopped the overview from claiming four open reviews while the reconciliation section showed five.
//
// Every item carries the filter that reproduces it in its own section, so a count is not an
// assertion about the data — it is the number of rows the target section shows once that filter is
// applied. The tests check exactly that equality rather than restating the arithmetic.
//
// Severity is derived from the finding, never chosen per item:
//   critical — money has left the club and the counterparty still holds the value
//   high     — money is owed or a payment did not complete
//   medium   — the books cannot be closed until someone decides something
//   low      — value is drifting, but nothing is lost yet

import { isOverdue } from './aggregation';
import { isAlertOpen } from './filtering';
import type {
  AttentionItem,
  Booking,
  Invoice,
  OperationalAlert,
  OperationalHealth,
  Payment,
  ReconciliationEntry,
  Voucher,
} from './types';
import { alertSeverities } from './types';

export interface AttentionInput {
  bookings: Booking[];
  payments: Payment[];
  invoices: Invoice[];
  reconciliation: ReconciliationEntry[];
  vouchers: Voucher[];
  alerts: OperationalAlert[];
  /** The date "overdue" and "expired" are judged against. */
  asOf: string;
}

/** Rank used for ordering. Mirrors `alertSeverities`, which runs critical -> low. */
const severityRank: Record<AttentionItem['severity'], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

/**
 * Build the prioritised list of findings.
 *
 * Items with a count of zero are dropped rather than rendered as "0" — a dashboard that lists nine
 * clean checks to surface one real problem has buried the problem.
 */
export function buildAttention(input: AttentionInput): AttentionItem[] {
  const { bookings, payments, invoices, reconciliation, vouchers, alerts, asOf } = input;

  const orphanPayments = reconciliation.filter((entry) => entry.issue === 'paid_no_booking');
  const refundedButActive = reconciliation.filter(
    (entry) => entry.issue === 'active_booking_refunded',
  );
  const mismatched = reconciliation.filter((entry) => entry.issue === 'amount_mismatch');
  const failedPayments = payments.filter((payment) => payment.status === 'failed');
  const pendingPayments = payments.filter((payment) => payment.status === 'pending');
  const overdueInvoices = invoices.filter((invoice) => isOverdue(invoice, asOf));
  const unresolvedVat = bookings.filter((booking) => booking.taxCategory === 'padel_unresolved');
  const strandedVouchers = vouchers.filter(
    (voucher) => voucher.status === 'expired' && voucher.remainingCents > 0,
  );
  const openAlerts = alerts.filter(isAlertOpen);

  const items: AttentionItem[] = [
    {
      id: 'payment-without-booking',
      severity: 'critical',
      title: 'Zahlung ohne Buchung',
      detail:
        'Geld ist eingegangen, aber keine Buchung steht dahinter. Buchung nachtragen oder Betrag erstatten.',
      count: orphanPayments.length,
      amountCents: sum(orphanPayments.map((entry) => entry.moneyToRecoverCents)),
      target: { section: 'reconciliation', filter: { issue: 'paid_no_booking' } },
    },
    {
      id: 'refunded-but-active',
      severity: 'critical',
      title: 'Erstattet, Platz weiter belegt',
      detail:
        'Der Betrag wurde zurückgezahlt, die Buchung blockiert den Platz aber weiterhin. Der Verein verliert Platz und Gebühr.',
      count: refundedButActive.length,
      amountCents: sum(refundedButActive.map((entry) => entry.moneyToRecoverCents)),
      target: { section: 'reconciliation', filter: { issue: 'active_booking_refunded' } },
    },
    {
      id: 'invoices-overdue',
      severity: 'high',
      title: 'Rechnungen überfällig',
      detail: 'Das Fälligkeitsdatum ist überschritten und die Rechnung ist weiterhin offen.',
      count: overdueInvoices.length,
      amountCents: sum(overdueInvoices.map((invoice) => invoice.grossCents)),
      target: { section: 'invoices', filter: { status: 'open' } },
    },
    {
      id: 'payments-failed',
      severity: 'high',
      title: 'Zahlungen fehlgeschlagen',
      detail: 'Die Zahlung wurde nicht abgeschlossen. Der zugehörige Platz gilt als gebucht.',
      count: failedPayments.length,
      amountCents: sum(failedPayments.map((payment) => payment.grossCents)),
      target: { section: 'payments', filter: { status: 'failed' } },
    },
    {
      id: 'amount-mismatch',
      severity: 'medium',
      title: 'Betragsabweichung',
      detail: 'Gezahlter und gebuchter Betrag stimmen nicht überein.',
      count: mismatched.length,
      amountCents: sum(mismatched.map((entry) => entry.moneyToRecoverCents)),
      target: { section: 'reconciliation', filter: { issue: 'amount_mismatch' } },
    },
    {
      id: 'vat-unresolved',
      severity: 'medium',
      title: 'Umsatzsteuer ungeklärt',
      detail:
        'Padel-Buchungen ohne geklärte Mitgliedschaft lassen sich keinem Steuersatz zuordnen und blockieren den Monatsabschluss.',
      count: unresolvedVat.length,
      amountCents: sum(unresolvedVat.map((booking) => booking.amountCents)),
      target: { section: 'bookings', filter: {} },
    },
    {
      id: 'payments-pending',
      severity: 'low',
      title: 'Zahlungen ausstehend',
      detail: 'Der Zahlungsvorgang läuft noch. Ohne Abschluss fehlt der Betrag im Monatsergebnis.',
      count: pendingPayments.length,
      amountCents: sum(pendingPayments.map((payment) => payment.grossCents)),
      target: { section: 'payments', filter: { status: 'pending' } },
    },
    {
      id: 'vouchers-expired-with-balance',
      severity: 'low',
      title: 'Gutscheine verfallen mit Restwert',
      detail: 'Die Gültigkeit ist abgelaufen, es besteht aber noch ein Restguthaben.',
      count: strandedVouchers.length,
      amountCents: sum(strandedVouchers.map((voucher) => voucher.remainingCents)),
      target: { section: 'vouchers', filter: { status: 'expired' } },
    },
    // Raised alerts enter the same model as the derived findings, so the header's health summary
    // counts a reported problem and a detected one on one scale.
    ...alertSeverities.map((severity) => {
      const slice = openAlerts.filter((alert) => alert.severity === severity);
      return {
        id: `alerts-${severity}`,
        severity,
        title: `Offene Meldungen · ${severityNoun[severity]}`,
        detail: 'Im Alert Center gemeldet und noch nicht abgeschlossen.',
        count: slice.length,
        amountCents: sum(slice.map((alert) => alert.amountCents ?? 0)) || null,
        // `unresolved`, not `open`: this count uses `isAlertOpen`, which also includes alerts
        // already in progress. Seeding `open` would land the reader on a shorter list than the
        // number they clicked.
        target: { section: 'alerts' as const, filter: { severity, status: 'unresolved' } },
      } satisfies AttentionItem;
    }),
  ];

  return items
    .filter((item) => item.count > 0)
    .sort((a, b) => {
      const bySeverity = severityRank[a.severity] - severityRank[b.severity];
      if (bySeverity !== 0) return bySeverity;
      // Then by money at stake, so the expensive instance of a severity leads.
      return (b.amountCents ?? 0) - (a.amountCents ?? 0);
    });
}

const severityNoun: Record<AttentionItem['severity'], string> = {
  critical: 'kritisch',
  high: 'hoch',
  medium: 'mittel',
  low: 'niedrig',
};

/** Roll up the model for the module header. */
export function summariseAttention(items: AttentionItem[]): OperationalHealth {
  const countOf = (severity: AttentionItem['severity']) =>
    items.filter((item) => item.severity === severity).reduce((total, item) => total + item.count, 0);

  return {
    critical: countOf('critical'),
    high: countOf('high'),
    medium: countOf('medium'),
    low: countOf('low'),
    total: items.reduce((total, item) => total + item.count, 0),
    moneyAtRiskCents: sum(items.map((item) => item.amountCents ?? 0)),
  };
}

/**
 * One-word verdict for the header.
 *
 * Deliberately coarse: the header answers "should I be worried right now", and a five-step scale
 * would make the reader decode a legend before they could answer it.
 */
export function healthVerdict(health: OperationalHealth): {
  tone: 'success' | 'warning' | 'danger';
  label: string;
} {
  if (health.critical > 0) return { tone: 'danger', label: 'Eingriff erforderlich' };
  if (health.high > 0) return { tone: 'warning', label: 'Prüfung erforderlich' };
  if (health.total > 0) return { tone: 'warning', label: 'Kleinere Hinweise' };
  return { tone: 'success', label: 'Ohne Auffälligkeiten' };
}
