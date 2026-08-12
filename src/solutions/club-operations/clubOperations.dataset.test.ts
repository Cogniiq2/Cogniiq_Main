// Cross-fixture consistency and business-rule coverage for Phase C2.
//
// The fixtures are one dataset, not ten independent ones: a payment points at a booking, an invoice
// at a booking, a voucher usage at a booking, a member at their own bookings. These tests pin those
// relationships, because a dashboard whose sections disagree with each other is worse than one with
// less data.

import { describe, expect, it } from 'vitest';

import {
  buildCounts,
  buildInvoiceCounts,
  buildRevenue,
  buildVat,
  isOverdue,
  splitGross,
} from './aggregation';
import { createFixtureAdapter } from './adapter/fixtureAdapter';
import {
  filterActivity,
  filterAlerts,
  filterInvoices,
  filterMembers,
  filterPayments,
  filterReconciliation,
  filterVouchers,
  isAlertOpen,
} from './filtering';
import { toLocalDateKey } from './formatting';
import { fixtureActivityRecords } from './fixtures/activity';
import { fixtureAlerts } from './fixtures/alerts';
import { fixtureBookings, findBookingByReference, taxTreatmentFor } from './fixtures/bookings';
import { fixtureInvoices, invoicesWithUnknownBooking } from './fixtures/invoices';
import { fixtureMembers, memberFullName } from './fixtures/members';
import { fixtureMonthlyReports, monthlyReportComparison } from './fixtures/monthlyReports';
import { fixturePayments } from './fixtures/payments';
import { fixtureReconciliation } from './fixtures/reconciliation';
import { fixtureReport } from './fixtures/reports';
import { fixtureSettings } from './fixtures/settings';
import { FIXTURE_TODAY, fixtureVouchers } from './fixtures/vouchers';
import { classifyReconciliation, severityForIssue } from './reconciliation';
import {
  emptyActivityQuery,
  emptyAlertQuery,
  emptyInvoiceQuery,
  emptyMemberQuery,
  emptyPaymentQuery,
  emptyReconciliationQuery,
  emptyVoucherQuery,
} from './types';

/* ================================================ Cross-fixture consistency */

describe('the fixtures form one consistent dataset', () => {
  it('every booking-type payment names a booking that exists, except the deliberate orphan', () => {
    const orphans = fixturePayments
      .filter((p) => p.referenceType === 'booking' && findBookingByReference(p.referenceLabel) === null)
      .map((p) => p.referenceLabel);
    expect(orphans).toEqual(['BU-2199']);
  });

  it('every invoice that names a booking names one that exists', () => {
    expect(invoicesWithUnknownBooking()).toEqual([]);
  });

  it('every voucher usage names a booking that exists and was paid by voucher', () => {
    for (const voucher of fixtureVouchers) {
      for (const usage of voucher.usages) {
        const booking = findBookingByReference(usage.bookingReference);
        expect(booking, `${voucher.code} -> ${usage.bookingReference}`).not.toBeNull();
        expect(booking!.provider).toBe('voucher');
      }
    }
  });

  it('every voucher usage amount matches its booking amount', () => {
    for (const voucher of fixtureVouchers) {
      for (const usage of voucher.usages) {
        expect(findBookingByReference(usage.bookingReference)!.amountCents).toBe(usage.amountCents);
      }
    }
  });

  it('every alert reference resolves to a booking, payment, voucher or invoice', () => {
    const known = new Set<string>([
      ...fixtureBookings.map((b) => b.reference),
      ...fixturePayments.map((p) => p.reference),
      ...fixtureVouchers.map((v) => v.code),
      ...fixtureInvoices.map((i) => i.number),
    ]);
    const unknown = fixtureAlerts
      .map((alert) => alert.relatedReference)
      .filter((reference): reference is string => reference !== null)
      .filter((reference) => !known.has(reference));
    expect(unknown).toEqual([]);
  });

  it('every activity reference resolves to a known record', () => {
    const known = new Set<string>([
      ...fixtureBookings.map((b) => b.reference),
      ...fixturePayments.map((p) => p.reference),
      ...fixtureVouchers.map((v) => v.code),
      ...fixtureInvoices.map((i) => i.number),
    ]);
    const unknown = fixtureActivityRecords
      .map((record) => record.relatedReference)
      .filter((reference): reference is string => reference !== null)
      .filter((reference) => !known.has(reference));
    expect(unknown).toEqual([]);
  });

  it('every member booking summary matches the booking fixtures', () => {
    for (const member of fixtureMembers) {
      const own = fixtureBookings.filter((b) => b.customerName === memberFullName(member));
      expect(member.bookingCount, memberFullName(member)).toBe(own.length);
      expect(member.bookingRevenueCents).toBe(
        own.filter((b) => b.paymentStatus === 'paid').reduce((sum, b) => sum + b.amountCents, 0),
      );
    }
  });

  it('every padel member in the register is the customer of a reduced-rate booking', () => {
    const reducedCustomers = new Set(
      fixtureBookings.filter((b) => b.taxCategory === 'padel_member_reduced').map((b) => b.customerName),
    );
    const withBookings = fixtureMembers.filter((m) => m.bookingCount > 0 && m.vatClassification === 'member');
    expect(withBookings.length).toBeGreaterThan(0);
    for (const member of withBookings) {
      expect(reducedCustomers.has(memberFullName(member)), memberFullName(member)).toBe(true);
    }
  });

  it('holds no contact details anywhere in the dataset', () => {
    const everything = JSON.stringify({
      fixtureBookings, fixturePayments, fixtureInvoices, fixtureVouchers,
      fixtureMembers, fixtureActivityRecords, fixtureAlerts, fixtureSettings,
    });
    expect(everything).not.toMatch(/@/);
    expect(everything).not.toMatch(/\+49|\bhttps?:\/\//i);
    expect(everything).not.toMatch(/ip_address|user_agent|telefon/i);
  });

  it('uses only invented place names', () => {
    const cities = new Set(fixtureMembers.map((m) => m.city));
    for (const real of ['Heinersreuth', 'Bayreuth', 'Bindlach', 'Eckersdorf']) {
      expect([...cities]).not.toContain(real);
    }
  });

  it('keeps every identifier unique within its own domain', () => {
    const unique = <T>(items: T[], pick: (item: T) => string) =>
      new Set(items.map(pick)).size === items.length;
    expect(unique(fixturePayments, (p) => p.id)).toBe(true);
    expect(unique(fixturePayments, (p) => p.reference)).toBe(true);
    expect(unique(fixtureInvoices, (i) => i.number)).toBe(true);
    expect(unique(fixtureVouchers, (v) => v.code)).toBe(true);
    expect(unique(fixtureMembers, (m) => String(m.memberNumber))).toBe(true);
    expect(unique(fixtureAlerts, (a) => a.id)).toBe(true);
    expect(unique(fixtureActivityRecords, (r) => r.id)).toBe(true);
  });
});

/* ============================================================ Tax treatment */

describe('VAT treatment', () => {
  it('every booking carries the treatment its court and membership imply', () => {
    for (const booking of fixtureBookings) {
      const expected = taxTreatmentFor(booking.court, booking.membership, booking.paymentStatus);
      expect(booking.taxCategory, booking.reference).toBe(expected.taxCategory);
      expect(booking.taxRatePercent, booking.reference).toBe(expected.taxRatePercent);
    }
  });

  it('rates padel by membership and exempts tennis', () => {
    expect(taxTreatmentFor('padel-1', 'member', 'paid')).toEqual({ taxCategory: 'padel_member_reduced', taxRatePercent: 7 });
    expect(taxTreatmentFor('padel-1', 'non_member', 'paid')).toEqual({ taxCategory: 'padel_non_member_standard', taxRatePercent: 19 });
    expect(taxTreatmentFor('padel-1', 'unresolved', 'paid')).toEqual({ taxCategory: 'padel_unresolved', taxRatePercent: null });
    expect(taxTreatmentFor('tennis-1', 'not_applicable', 'paid')).toEqual({ taxCategory: 'tennis_exempt', taxRatePercent: 0 });
  });

  it('treats a booking that required no payment as free regardless of court', () => {
    expect(taxTreatmentFor('padel-1', 'member', 'not_required').taxCategory).toBe('free');
    expect(taxTreatmentFor('tennis-3', 'not_applicable', 'not_required').taxCategory).toBe('free');
  });

  it('splits VAT out of a gross amount without losing a cent', () => {
    expect(splitGross(4800, 19)).toEqual({ netCents: 4034, vatCents: 766 });
    expect(splitGross(3600, 7)).toEqual({ netCents: 3364, vatCents: 236 });
    expect(splitGross(2000, 0)).toEqual({ netCents: 2000, vatCents: 0 });
    expect(splitGross(2000, null)).toEqual({ netCents: 2000, vatCents: 0 });
    for (const gross of [1, 99, 3600, 4800, 123456]) {
      const { netCents, vatCents } = splitGross(gross, 19);
      expect(netCents + vatCents).toBe(gross);
    }
  });

  it('excludes unresolved padel bookings from every VAT category', () => {
    const vat = buildVat(fixtureBookings);
    expect(vat.unresolvedCount).toBeGreaterThan(0);
    expect(vat.categories.some((c) => c.category === 'padel_unresolved' && c.vatCents > 0)).toBe(false);
  });

  it('totals VAT as the sum of its categories', () => {
    const vat = buildVat(fixtureBookings);
    expect(vat.totalVatCents).toBe(vat.categories.reduce((sum, c) => sum + c.vatCents, 0));
  });
});

/* ========================================================== Reconciliation */

describe('reconciliation rules', () => {
  const booking = (overrides: Partial<ReturnType<typeof baseBooking>> = {}) => ({ ...baseBooking(), ...overrides });
  function baseBooking() {
    return fixtureBookings.find((b) => b.reference === 'BU-2043')!;
  }
  const payment = (overrides: Partial<(typeof fixturePayments)[number]> = {}) => ({
    ...fixturePayments.find((p) => p.referenceType === 'booking')!,
    ...overrides,
  });

  it('reports a booking-type payment with no booking as critical', () => {
    const result = classifyReconciliation(payment({ grossCents: 4800 }), null);
    expect(result.issue).toBe('paid_no_booking');
    expect(result.moneyToRecoverCents).toBe(4800);
    expect(severityForIssue[result.issue]).toBe('critical');
  });

  it('reports a refund on a still-confirmed booking as critical', () => {
    const result = classifyReconciliation(
      payment({ refundedCents: 3600, status: 'refunded' }),
      booking({ status: 'confirmed' }),
    );
    expect(result.issue).toBe('active_booking_refunded');
    expect(result.moneyToRecoverCents).toBe(3600);
    expect(severityForIssue[result.issue]).toBe('critical');
  });

  it('reports an amount mismatch and the shortfall', () => {
    const result = classifyReconciliation(
      payment({ grossCents: 4500, refundedCents: 0, metaClass: 'standard', status: 'paid' }),
      booking({ amountCents: 4800, status: 'confirmed' }),
    );
    expect(result.issue).toBe('amount_mismatch');
    expect(result.moneyToRecoverCents).toBe(300);
    expect(severityForIssue[result.issue]).toBe('warning');
  });

  it('treats a voucher purchase as matched despite having no booking', () => {
    const voucherPayment = fixturePayments.find((p) => p.referenceType === 'voucher' && p.status === 'paid')!;
    expect(classifyReconciliation(voucherPayment, null).issue).toBe('matched');
  });

  it('flags a failed voucher purchase for review rather than as an orphan', () => {
    const failed = fixturePayments.find((p) => p.referenceType === 'voucher' && p.status === 'failed')!;
    expect(classifyReconciliation(failed, null).issue).toBe('needs_review');
  });

  it('classifies double bookings and customer cancellations without money to recover', () => {
    expect(classifyReconciliation(payment({ metaClass: 'double_booking', refundedCents: 0 }), booking({ status: 'cancelled' })).moneyToRecoverCents).toBe(0);
    expect(classifyReconciliation(payment({ metaClass: 'customer_cancelled', refundedCents: 0 }), booking({ status: 'cancelled' })).moneyToRecoverCents).toBe(0);
  });

  it('derives severity from the issue and never independently', () => {
    for (const entry of fixtureReconciliation) {
      expect(entry.severity, entry.issue).toBe(severityForIssue[entry.issue]);
    }
  });

  it('produces the deliberate anomalies the fixtures encode', () => {
    const issues = fixtureReconciliation.map((entry) => entry.issue);
    expect(issues).toContain('paid_no_booking');
    expect(issues).toContain('active_booking_refunded');
    expect(issues).toContain('amount_mismatch');
    expect(issues).toContain('matched');
  });
});

/* =============================================================== Invoices */

describe('invoice totals', () => {
  it('splits every invoice so net plus VAT equals gross', () => {
    for (const invoice of fixtureInvoices) {
      expect(invoice.netCents + invoice.vatCents, invoice.number).toBe(invoice.grossCents);
    }
  });

  it('applies no VAT where no rate applies', () => {
    for (const invoice of fixtureInvoices.filter((i) => i.taxRatePercent === null)) {
      expect(invoice.vatCents).toBe(0);
    }
  });

  it('counts an open invoice past its due date as overdue', () => {
    const counts = buildInvoiceCounts(fixtureInvoices, FIXTURE_TODAY);
    const manual = fixtureInvoices.filter((i) => i.status === 'open' && i.dueDate < FIXTURE_TODAY).length;
    expect(counts.overdue).toBe(manual);
    expect(counts.overdue).toBeGreaterThan(0);
  });

  it('never counts a paid or voided invoice as overdue', () => {
    for (const invoice of fixtureInvoices.filter((i) => i.status !== 'open')) {
      expect(isOverdue(invoice, FIXTURE_TODAY), invoice.number).toBe(false);
    }
  });

  it('sums outstanding from open invoices and collected from paid ones', () => {
    const counts = buildInvoiceCounts(fixtureInvoices, FIXTURE_TODAY);
    expect(counts.outstandingCents).toBe(
      fixtureInvoices.filter((i) => i.status === 'open').reduce((s, i) => s + i.grossCents, 0),
    );
    expect(counts.collectedCents).toBe(
      fixtureInvoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.grossCents, 0),
    );
  });
});

/* =============================================================== Vouchers */

describe('voucher balances', () => {
  it('derives the remaining balance from the usage history', () => {
    for (const voucher of fixtureVouchers) {
      const used = voucher.usages.reduce((sum, usage) => sum + usage.amountCents, 0);
      expect(voucher.remainingCents, voucher.code).toBe(voucher.originalValueCents - used);
    }
  });

  it('never lets a balance go negative or exceed the original value', () => {
    for (const voucher of fixtureVouchers) {
      expect(voucher.remainingCents).toBeGreaterThanOrEqual(0);
      expect(voucher.remainingCents).toBeLessThanOrEqual(voucher.originalValueCents);
    }
  });

  it('marks a fully consumed voucher as redeemed and a partly used one as partial', () => {
    const redeemed = fixtureVouchers.filter((v) => v.remainingCents === 0 && v.soldAt !== null);
    expect(redeemed.length).toBeGreaterThan(0);
    for (const voucher of redeemed) expect(voucher.status).toBe('redeemed');

    const partial = fixtureVouchers.filter(
      (v) => v.usages.length > 0 && v.remainingCents > 0 && v.expiresAt >= FIXTURE_TODAY,
    );
    expect(partial.length).toBeGreaterThan(0);
    for (const voucher of partial) expect(voucher.status).toBe('partially_redeemed');
  });

  it('covers open, sold, partially redeemed, redeemed and expired', () => {
    const statuses = new Set(fixtureVouchers.map((v) => v.status));
    for (const expected of ['open', 'sold', 'partially_redeemed', 'redeemed', 'expired']) {
      expect(statuses.has(expected as never), expected).toBe(true);
    }
  });

  it('uses invented codes that carry no reference-system prefix', () => {
    for (const voucher of fixtureVouchers) {
      expect(voucher.code).toMatch(/^GS-\d{4}-\d{4}$/);
    }
  });
});

/* ======================================================== Monthly reports */

describe('monthly aggregation', () => {
  it('produces one report per month present in the bookings', () => {
    expect(fixtureMonthlyReports.length).toBeGreaterThanOrEqual(2);
    expect(fixtureMonthlyReports.map((r) => r.month)).toEqual(
      [...fixtureMonthlyReports.map((r) => r.month)].sort().reverse(),
    );
  });

  it('matches an independent aggregation of the same month', () => {
    for (const report of fixtureMonthlyReports) {
      const inMonth = fixtureBookings.filter((b) => b.startsAt.slice(0, 7) === report.month);
      expect(report.bookingCount, report.month).toBe(buildCounts(inMonth).total);
      expect(report.totalRevenueCents, report.month).toBe(buildRevenue(inMonth).totalCents);
      expect(report.successfulCount, report.month).toBe(buildCounts(inMonth).paid);
    }
  });

  it('splits revenue by provider so the parts sum to the total', () => {
    for (const report of fixtureMonthlyReports) {
      const parts =
        report.stripeRevenueCents + report.paypalRevenueCents + report.voucherRevenueCents;
      expect(parts, report.month).toBe(report.totalRevenueCents);
    }
  });

  it('offers the preceding month as the comparison', () => {
    const latest = monthlyReportComparison()!;
    expect(latest.report.month).toBe(fixtureMonthlyReports[0].month);
    expect(latest.previous?.month).toBe(fixtureMonthlyReports[1].month);
  });

  it('has no previous month for the oldest report', () => {
    const oldest = fixtureMonthlyReports[fixtureMonthlyReports.length - 1];
    expect(monthlyReportComparison(oldest.month)!.previous).toBeNull();
  });

  it('returns null for an unknown month rather than guessing', () => {
    expect(monthlyReportComparison('1999-01')).toBeNull();
  });
});

/* ================================================================ Reports */

describe('report calculations', () => {
  it('restricts a range to the bookings inside it', () => {
    const march = fixtureReport('month');
    const february = fixtureReport('last_month');
    expect(march.bookings.total).toBeGreaterThan(0);
    expect(february.bookings.total).toBeGreaterThan(0);
    expect(march.periodStart).toBe('2026-03-01');
    expect(february.periodEnd).toBe('2026-02-28');
  });

  it('covers both months in the quarter range', () => {
    const quarter = fixtureReport('quarter');
    expect(quarter.bookings.total).toBe(
      fixtureReport('month').bookings.total + fixtureReport('last_month').bookings.total,
    );
  });

  it('sums provider revenue to the reported total', () => {
    const report = fixtureReport('quarter');
    expect(report.revenue.byProvider.reduce((sum, p) => sum + p.amountCents, 0)).toBe(
      report.revenue.totalCents,
    );
  });

  it('splits refunds into cancellations and double bookings', () => {
    const report = fixtureReport('quarter');
    expect(report.refunds.totalCents).toBeGreaterThanOrEqual(
      report.refunds.cancellationCents + report.refunds.doubleBookingCents,
    );
  });
});

/* ================================================================= Alerts */

describe('alerts', () => {
  it('sorts unresolved before resolved, then by severity', () => {
    const sorted = filterAlerts(fixtureAlerts, emptyAlertQuery);
    const openFlags = sorted.map(isAlertOpen);
    expect(openFlags).toEqual([...openFlags].sort((a, b) => Number(b) - Number(a)));

    const weight = { critical: 0, high: 1, medium: 2, low: 3 } as const;
    const openSeverities = sorted.filter(isAlertOpen).map((a) => weight[a.severity]);
    expect(openSeverities).toEqual([...openSeverities].sort((a, b) => a - b));
  });

  it('covers every severity and every status', () => {
    const severities = new Set(fixtureAlerts.map((a) => a.severity));
    const statuses = new Set(fixtureAlerts.map((a) => a.status));
    for (const s of ['critical', 'high', 'medium', 'low']) expect(severities.has(s as never), s).toBe(true);
    for (const s of ['open', 'in_progress', 'resolved', 'ignored']) expect(statuses.has(s as never), s).toBe(true);
  });

  it('filters by severity, status and category independently', () => {
    expect(filterAlerts(fixtureAlerts, { ...emptyAlertQuery, severity: 'critical' }).every((a) => a.severity === 'critical')).toBe(true);
    expect(filterAlerts(fixtureAlerts, { ...emptyAlertQuery, status: 'resolved' }).every((a) => a.status === 'resolved')).toBe(true);
    expect(filterAlerts(fixtureAlerts, { ...emptyAlertQuery, category: 'refund' }).every((a) => a.category === 'refund')).toBe(true);
  });

  it('treats resolved and ignored alerts as closed', () => {
    for (const alert of fixtureAlerts) {
      expect(isAlertOpen(alert)).toBe(alert.status !== 'resolved' && alert.status !== 'ignored');
    }
  });
});

/* =============================================================== Activity */

describe('activity ordering and filtering', () => {
  it('returns entries newest first', () => {
    const ordered = filterActivity(fixtureActivityRecords, emptyActivityQuery);
    const timestamps = ordered.map((r) => r.occurredAt);
    expect(timestamps).toEqual([...timestamps].sort().reverse());
  });

  it('filters by category and actor type', () => {
    expect(filterActivity(fixtureActivityRecords, { ...emptyActivityQuery, category: 'invoice' }).every((r) => r.category === 'invoice')).toBe(true);
    expect(filterActivity(fixtureActivityRecords, { ...emptyActivityQuery, actorType: 'system' }).every((r) => r.actorType === 'system')).toBe(true);
  });

  it('filters by date range', () => {
    const march = filterActivity(fixtureActivityRecords, { ...emptyActivityQuery, dateFrom: '2026-03-01' });
    expect(march.length).toBeGreaterThan(0);
    expect(march.every((r) => r.occurredAt >= '2026-03-01')).toBe(true);
  });

  it('has a German label for every action code it uses', async () => {
    const { activityActionLabel, activityActionLabels } = await import('./labels');
    for (const record of fixtureActivityRecords) {
      expect(activityActionLabels[record.actionCode], record.actionCode).toBeDefined();
      expect(activityActionLabel(record.actionCode)).not.toBe(activityActionLabels.UNKNOWN);
    }
  });
});

/* ================================================== Filters across domains */

describe('filters, combined and reset', () => {
  it('payments: search, provider, status and date narrow independently and together', () => {
    expect(filterPayments(fixturePayments, emptyPaymentQuery)).toHaveLength(fixturePayments.length);
    expect(filterPayments(fixturePayments, { ...emptyPaymentQuery, provider: 'paypal' }).every((p) => p.provider === 'paypal')).toBe(true);
    expect(filterPayments(fixturePayments, { ...emptyPaymentQuery, status: 'refunded' }).every((p) => p.status === 'refunded')).toBe(true);

    const combined = filterPayments(fixturePayments, { ...emptyPaymentQuery, provider: 'stripe', status: 'paid' });
    expect(combined.every((p) => p.provider === 'stripe' && p.status === 'paid')).toBe(true);
    expect(combined.length).toBeLessThan(fixturePayments.length);
  });

  it('payments: an impossible combination yields an empty result', () => {
    expect(filterPayments(fixturePayments, { ...emptyPaymentQuery, search: 'zzzz', provider: 'paypal' })).toEqual([]);
  });

  it('invoices: filters by status and by issue date', () => {
    expect(filterInvoices(fixtureInvoices, { ...emptyInvoiceQuery, status: 'paid' }).every((i) => i.status === 'paid')).toBe(true);
    expect(filterInvoices(fixtureInvoices, { ...emptyInvoiceQuery, dateFrom: '2026-03-01' }).every((i) => i.issuedAt >= '2026-03-01')).toBe(true);
  });

  it('reconciliation: filters by issue and severity', () => {
    expect(filterReconciliation(fixtureReconciliation, { ...emptyReconciliationQuery, severity: 'critical' }).every((e) => e.severity === 'critical')).toBe(true);
    expect(filterReconciliation(fixtureReconciliation, { ...emptyReconciliationQuery, issue: 'matched' }).every((e) => e.issue === 'matched')).toBe(true);
  });

  it('vouchers: filters by status and searches by code', () => {
    expect(filterVouchers(fixtureVouchers, { ...emptyVoucherQuery, status: 'expired' }).every((v) => v.status === 'expired')).toBe(true);
    expect(filterVouchers(fixtureVouchers, { ...emptyVoucherQuery, search: 'GS-2026-0001' })).toHaveLength(1);
  });

  it('members: filters by membership type and status, and searches by number', () => {
    expect(filterMembers(fixtureMembers, { ...emptyMemberQuery, membershipType: 'tennis' }).every((m) => m.membershipType === 'tennis')).toBe(true);
    expect(filterMembers(fixtureMembers, { ...emptyMemberQuery, status: 'resigned' }).every((m) => m.status === 'resigned')).toBe(true);
    expect(filterMembers(fixtureMembers, { ...emptyMemberQuery, search: '1042' })).toHaveLength(1);
  });

  it('every domain returns its full set for the empty query', () => {
    expect(filterPayments(fixturePayments, emptyPaymentQuery)).toHaveLength(fixturePayments.length);
    expect(filterInvoices(fixtureInvoices, emptyInvoiceQuery)).toHaveLength(fixtureInvoices.length);
    expect(filterReconciliation(fixtureReconciliation, emptyReconciliationQuery)).toHaveLength(fixtureReconciliation.length);
    expect(filterVouchers(fixtureVouchers, emptyVoucherQuery)).toHaveLength(fixtureVouchers.length);
    expect(filterMembers(fixtureMembers, emptyMemberQuery)).toHaveLength(fixtureMembers.length);
    expect(filterActivity(fixtureActivityRecords, emptyActivityQuery)).toHaveLength(fixtureActivityRecords.length);
    expect(filterAlerts(fixtureAlerts, emptyAlertQuery)).toHaveLength(fixtureAlerts.length);
  });
});

/* ================================================ Adapter, every read path */

describe('adapter read methods', () => {
  const adapter = createFixtureAdapter();

  it('returns populated results for every section', async () => {
    expect((await adapter.listPayments(emptyPaymentQuery)).total).toBeGreaterThan(0);
    expect((await adapter.listInvoices(emptyInvoiceQuery)).total).toBeGreaterThan(0);
    expect((await adapter.listReconciliation(emptyReconciliationQuery)).total).toBeGreaterThan(0);
    expect((await adapter.listVouchers(emptyVoucherQuery)).total).toBeGreaterThan(0);
    expect((await adapter.listMembers(emptyMemberQuery)).total).toBeGreaterThan(0);
    expect((await adapter.listActivity(emptyActivityQuery)).total).toBeGreaterThan(0);
    expect((await adapter.listAlerts(emptyAlertQuery)).total).toBeGreaterThan(0);
    expect((await adapter.getMonthlyReport({})).report.bookingCount).toBeGreaterThan(0);
    expect((await adapter.getReport({ range: 'month' })).bookings.total).toBeGreaterThan(0);
    expect((await adapter.getSettings()).groups.length).toBeGreaterThan(0);
  });

  it('returns structurally valid empty results for every section', async () => {
    const empty = createFixtureAdapter({ scenario: 'empty' });
    expect((await empty.listPayments(emptyPaymentQuery)).payments).toEqual([]);
    expect((await empty.listInvoices(emptyInvoiceQuery)).counts.total).toBe(0);
    expect((await empty.listReconciliation(emptyReconciliationQuery)).entries).toEqual([]);
    expect((await empty.listVouchers(emptyVoucherQuery)).totals.count).toBe(0);
    expect((await empty.listMembers(emptyMemberQuery)).members).toEqual([]);
    expect((await empty.listActivity(emptyActivityQuery)).records).toEqual([]);
    expect((await empty.listAlerts(emptyAlertQuery)).openCount).toBe(0);
    expect((await empty.getReport({ range: 'month' })).bookings.total).toBe(0);
    expect((await empty.getSettings()).groups).toEqual([]);
    await expect(empty.getMonthlyReport({})).rejects.toMatchObject({ code: 'unavailable' });
  });

  it('rejects every read in the error scenario', async () => {
    const failing = createFixtureAdapter({ scenario: 'error', errorCode: 'forbidden' });
    for (const call of [
      () => failing.listPayments(emptyPaymentQuery),
      () => failing.listInvoices(emptyInvoiceQuery),
      () => failing.listReconciliation(emptyReconciliationQuery),
      () => failing.listVouchers(emptyVoucherQuery),
      () => failing.listMembers(emptyMemberQuery),
      () => failing.listActivity(emptyActivityQuery),
      () => failing.listAlerts(emptyAlertQuery),
      () => failing.getMonthlyReport({}),
      () => failing.getReport({ range: 'month' }),
      () => failing.getSettings(),
    ]) {
      await expect(call()).rejects.toMatchObject({ code: 'forbidden' });
    }
  });

  it('never settles any read in the loading scenario', async () => {
    const pending = createFixtureAdapter({ scenario: 'loading' });
    const raced = await Promise.race([
      pending.listPayments(emptyPaymentQuery).then(() => 'settled'),
      pending.getSettings().then(() => 'settled'),
      Promise.resolve('pending'),
    ]);
    expect(raced).toBe('pending');
  });

  it('reports payment totals consistent with the rows it returns', async () => {
    const page = await adapter.listPayments(emptyPaymentQuery);
    const expectedRefunded = page.payments.reduce((sum, p) => sum + p.refundedCents, 0);
    expect(page.totals.refundedCents).toBe(expectedRefunded);
    expect(page.totals.netCents).toBe(page.totals.grossCents - page.totals.refundedCents);
    expect(page.byProvider.reduce((sum, s) => sum + s.count, 0)).toBe(page.total);
  });

  it('summarises the dataset in the overview, scoped where scoping is meaningful', async () => {
    const overview = await adapter.getOverview({ period: 'month' });
    const bookingPage = await adapter.listBookings({});
    const invoicePage = await adapter.listInvoices(emptyInvoiceQuery);

    // Bookings are window-scoped ...
    const inWindow = bookingPage.bookings.filter((booking) => {
      const day = toLocalDateKey(booking.startsAt);
      return day >= overview.bounds.start && day <= overview.bounds.end;
    });
    expect(overview.bookings.total).toBe(inWindow.length);

    // ... while standing obligations are not: an open invoice, an unresolved discrepancy and an
    // unhandled alert stay open regardless of which window the reader is looking at.
    expect(overview.invoices.total).toBe(invoicePage.total);
    expect(overview.reconciliation.totalPayments).toBe(fixtureReconciliation.length);
    expect(overview.openAlerts.reduce((sum, e) => sum + e.count, 0)).toBe(
      fixtureAlerts.filter(isAlertOpen).length,
    );
  });
});

/* =============================================================== Settings */

describe('settings are read-only reference data', () => {
  it('exposes roles and permission groups', () => {
    expect(fixtureSettings.roles.length).toBeGreaterThan(0);
    expect(fixtureSettings.permissionGroups.length).toBeGreaterThan(0);
  });

  it('grants every permission an explicit decision for every role', () => {
    const roleIds = fixtureSettings.roles.map((role) => role.id);
    for (const group of fixtureSettings.permissionGroups) {
      for (const permission of group.permissions) {
        for (const roleId of roleIds) {
          expect(typeof permission.grants[roleId], `${permission.key}/${roleId}`).toBe('boolean');
        }
      }
    }
  });

  it('carries no URL, key, identifier or contact address in any value', () => {
    const values = fixtureSettings.groups.flatMap((group) => group.entries.map((entry) => entry.value));
    for (const value of values) {
      expect(value).not.toMatch(/https?:\/\/|@|[A-Za-z0-9_-]{32,}/);
    }
  });
});
