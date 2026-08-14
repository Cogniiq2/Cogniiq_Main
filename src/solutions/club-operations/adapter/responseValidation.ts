// Runtime validation of everything the transport returns.
//
// TypeScript's types stop at the boundary: whatever arrives is `unknown`, and calling it a
// `BookingPage` because a type annotation says so is a lie the compiler is happy to accept. Every
// response is therefore checked structurally before it is handed to a component.
//
// The rule this enforces: **no malformed data reaches the UI.** A response that does not match the
// domain shape becomes a typed `unknown` failure and the section shows its error state — it never
// renders a half-populated table, and it never renders `undefined` where a figure belongs.
//
// Money is checked as a safe integer. A float amount is malformed by definition here, because the
// whole cents convention exists so that no component ever divides one.
//
// ─── Nullable does not mean lenient ──────────────────────────────────────────────────────────────
//
// A field that `types.ts` marks SOURCE-ABSENT is read with a `nullable*` reader here. Those readers
// accept exactly two things: a value of the field's own type, or an explicit `null`. They do **not**
// accept `undefined`, and they do **not** accept a missing property — both fail, because `undefined`
// reaching this boundary means the producer forgot the field rather than deciding it was
// unavailable, and silently converting that to `null` would erase the difference between "no source
// exists" and "the mapping is broken".
//
// The only exceptions are the two properties the existing protocol declares genuinely optional
// (`AttentionTarget.filter` and `SettingsEntry.hint`), which keep their `undefined` handling.

import {
  activityActorTypes,
  activityCategories,
  alertCategories,
  alertSeverities,
  alertStatuses,
  bookingStatuses,
  courtKeys,
  invoiceStatuses,
  membershipTypes,
  memberStatuses,
  overviewPeriods,
  paymentMetaClasses,
  paymentProviders,
  paymentStatuses,
  reconciliationIssues,
  reconciliationSeverities,
  reportRanges,
  taxCategories,
  voucherStatuses,
  type ActivityPage,
  type ActivityRecord,
  type AlertPage,
  type AlertSeverityCount,
  type Booking,
  type BookingCounts,
  type BookingPage,
  type CourtUtilization,
  type Invoice,
  type InvoiceCounts,
  type InvoicePage,
  type Member,
  type MemberPage,
  type MembershipClassification,
  type MembershipSlice,
  type MonthlyReport,
  type MonthlyReportComparison,
  type OperationalAlert,
  type OverviewSnapshot,
  type Payment,
  type PaymentPage,
  type PaymentStatusSlice,
  type PaymentTotals,
  type PeriodBounds,
  type PeriodTotals,
  type ProviderSlice,
  type ReconciliationCounts,
  type ReconciliationEntry,
  type ReconciliationPage,
  type ReportSnapshot,
  type RevenueSummary,
  type SettingsSnapshot,
  type TrendPoint,
  type VatSummary,
  type Voucher,
  type VoucherPage,
  type VoucherTotals,
} from '../types.ts';

/** A structural mismatch. Carries a path, never a value: a value here could be personal or financial. */
export class MalformedResponseError extends Error {
  readonly path: string;

  constructor(path: string, expected: string) {
    super(`malformed upstream response: expected ${expected} at ${path}`);
    this.name = 'MalformedResponseError';
    this.path = path;
  }
}

function fail(path: string, expected: string): never {
  throw new MalformedResponseError(path, expected);
}

function obj(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) fail(path, 'an object');
  return value as Record<string, unknown>;
}

function arr(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) fail(path, 'an array');
  return value;
}

function str(value: unknown, path: string): string {
  if (typeof value !== 'string') fail(path, 'a string');
  return value;
}

function nullableStr(value: unknown, path: string): string | null {
  if (value === null) return null;
  return str(value, path);
}

function bool(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') fail(path, 'a boolean');
  return value;
}

/** Integer counts and integer cents share one rule: a safe integer, or it is malformed. */
function int(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) fail(path, 'an integer');
  return value;
}

function nullableInt(value: unknown, path: string): number | null {
  if (value === null) return null;
  return int(value, path);
}

function oneOf<T extends string>(allowed: readonly T[], value: unknown, path: string): T {
  const text = str(value, path);
  if (!(allowed as readonly string[]).includes(text)) fail(path, `one of ${allowed.join('|')}`);
  return text as T;
}

function nullableOneOf<T extends string>(
  allowed: readonly T[],
  value: unknown,
  path: string,
): T | null {
  if (value === null) return null;
  return oneOf(allowed, value, path);
}

function mapArray<T>(value: unknown, path: string, read: (item: unknown, path: string) => T): T[] {
  return arr(value, path).map((item, index) => read(item, `${path}[${index}]`));
}

/**
 * As `mapArray`, but an explicit `null` means "this collection is not tracked upstream".
 *
 * Distinct from `[]`, which means "tracked, and empty". `undefined` and a missing property are still
 * rejected — see the header note.
 */
function nullableMapArray<T>(
  value: unknown,
  path: string,
  read: (item: unknown, path: string) => T,
): T[] | null {
  if (value === null) return null;
  return mapArray(value, path, read);
}

const membershipClassifications = [
  'member',
  'non_member',
  'unresolved',
  'not_applicable',
] as const satisfies readonly MembershipClassification[];

/* ------------------------------------------------------------------ Records */

function readBooking(value: unknown, path: string): Booking {
  const row = obj(value, path);
  return {
    id: str(row.id, `${path}.id`),
    reference: str(row.reference, `${path}.reference`),
    court: oneOf(courtKeys, row.court, `${path}.court`),
    startsAt: str(row.startsAt, `${path}.startsAt`),
    endsAt: str(row.endsAt, `${path}.endsAt`),
    customerName: str(row.customerName, `${path}.customerName`),
    status: oneOf(bookingStatuses, row.status, `${path}.status`),
    provider: oneOf(paymentProviders, row.provider, `${path}.provider`),
    paymentStatus: oneOf(paymentStatuses, row.paymentStatus, `${path}.paymentStatus`),
    amountCents: int(row.amountCents, `${path}.amountCents`),
    currency: str(row.currency, `${path}.currency`),
    membership: oneOf(membershipClassifications, row.membership, `${path}.membership`),
    taxCategory: oneOf(taxCategories, row.taxCategory, `${path}.taxCategory`),
    taxRatePercent: nullableInt(row.taxRatePercent, `${path}.taxRatePercent`),
    lightsRequested: bool(row.lightsRequested, `${path}.lightsRequested`),
  };
}

function readPayment(value: unknown, path: string): Payment {
  const row = obj(value, path);
  return {
    id: str(row.id, `${path}.id`),
    reference: str(row.reference, `${path}.reference`),
    occurredAt: str(row.occurredAt, `${path}.occurredAt`),
    provider: oneOf(paymentProviders, row.provider, `${path}.provider`),
    status: oneOf(paymentStatuses, row.status, `${path}.status`),
    grossCents: int(row.grossCents, `${path}.grossCents`),
    // SOURCE-ABSENT: `payments` has no refund-amount column.
    refundedCents: nullableInt(row.refundedCents, `${path}.refundedCents`),
    currency: str(row.currency, `${path}.currency`),
    referenceType: oneOf(['booking', 'voucher'] as const, row.referenceType, `${path}.referenceType`),
    referenceLabel: str(row.referenceLabel, `${path}.referenceLabel`),
    // SOURCE-ABSENT: no name column on `payments`; the unproven booking join is not used.
    customerName: nullableStr(row.customerName, `${path}.customerName`),
    // SOURCE-ABSENT: the classification lives in the excluded `metadata` jsonb.
    metaClass: nullableOneOf(paymentMetaClasses, row.metaClass, `${path}.metaClass`),
    // SOURCE-ABSENT: notes live in the excluded `metadata` jsonb.
    note: nullableStr(row.note, `${path}.note`),
  };
}

function readInvoice(value: unknown, path: string): Invoice {
  const row = obj(value, path);
  return {
    id: str(row.id, `${path}.id`),
    number: str(row.number, `${path}.number`),
    issuedAt: str(row.issuedAt, `${path}.issuedAt`),
    dueDate: str(row.dueDate, `${path}.dueDate`),
    sentAt: nullableStr(row.sentAt, `${path}.sentAt`),
    paidAt: nullableStr(row.paidAt, `${path}.paidAt`),
    voidedAt: nullableStr(row.voidedAt, `${path}.voidedAt`),
    status: oneOf(invoiceStatuses, row.status, `${path}.status`),
    customerName: str(row.customerName, `${path}.customerName`),
    bookingReference: nullableStr(row.bookingReference, `${path}.bookingReference`),
    netCents: int(row.netCents, `${path}.netCents`),
    vatCents: int(row.vatCents, `${path}.vatCents`),
    grossCents: int(row.grossCents, `${path}.grossCents`),
    taxRatePercent: nullableInt(row.taxRatePercent, `${path}.taxRatePercent`),
    currency: str(row.currency, `${path}.currency`),
    reason: str(row.reason, `${path}.reason`),
  };
}

function readInvoiceCounts(value: unknown, path: string): InvoiceCounts {
  const row = obj(value, path);
  return {
    total: int(row.total, `${path}.total`),
    draft: int(row.draft, `${path}.draft`),
    open: int(row.open, `${path}.open`),
    paid: int(row.paid, `${path}.paid`),
    voided: int(row.voided, `${path}.voided`),
    uncollectible: int(row.uncollectible, `${path}.uncollectible`),
    overdue: int(row.overdue, `${path}.overdue`),
    outstandingCents: int(row.outstandingCents, `${path}.outstandingCents`),
    collectedCents: int(row.collectedCents, `${path}.collectedCents`),
  };
}

function readReconciliationEntry(value: unknown, path: string): ReconciliationEntry {
  const row = obj(value, path);
  return {
    id: str(row.id, `${path}.id`),
    issue: oneOf(reconciliationIssues, row.issue, `${path}.issue`),
    severity: oneOf(reconciliationSeverities, row.severity, `${path}.severity`),
    occurredAt: str(row.occurredAt, `${path}.occurredAt`),
    // SOURCE-ABSENT for an orphaned payment: no booking, therefore no authorised name.
    customerName: nullableStr(row.customerName, `${path}.customerName`),
    bookingReference: nullableStr(row.bookingReference, `${path}.bookingReference`),
    paymentReference: nullableStr(row.paymentReference, `${path}.paymentReference`),
    court: nullableOneOf(courtKeys, row.court, `${path}.court`),
    provider: oneOf(paymentProviders, row.provider, `${path}.provider`),
    bookingAmountCents: int(row.bookingAmountCents, `${path}.bookingAmountCents`),
    paymentAmountCents: int(row.paymentAmountCents, `${path}.paymentAmountCents`),
    // SOURCE-ABSENT: this is the payment's refund amount, which has no upstream column.
    refundAmountCents: nullableInt(row.refundAmountCents, `${path}.refundAmountCents`),
    moneyToRecoverCents: int(row.moneyToRecoverCents, `${path}.moneyToRecoverCents`),
    bookingStatus: nullableOneOf(bookingStatuses, row.bookingStatus, `${path}.bookingStatus`),
    invoiceStatus: nullableOneOf(invoiceStatuses, row.invoiceStatus, `${path}.invoiceStatus`),
    suggestedAction: str(row.suggestedAction, `${path}.suggestedAction`),
  };
}

function readReconciliationCounts(value: unknown, path: string): ReconciliationCounts {
  const row = obj(value, path);
  return {
    totalPayments: int(row.totalPayments, `${path}.totalPayments`),
    matched: int(row.matched, `${path}.matched`),
    openReview: int(row.openReview, `${path}.openReview`),
    falseRefunds: int(row.falseRefunds, `${path}.falseRefunds`),
    moneyToRecoverCents: int(row.moneyToRecoverCents, `${path}.moneyToRecoverCents`),
    // SOURCE-ABSENT: sums the unavailable per-entry refund amount.
    refundedTotalCents: nullableInt(row.refundedTotalCents, `${path}.refundedTotalCents`),
    // SOURCE-ABSENT: the cancellation/double-booking split needs the excluded payment `metaClass`.
    cancellationRefundsCents: nullableInt(
      row.cancellationRefundsCents,
      `${path}.cancellationRefundsCents`,
    ),
    doubleBookingRefundsCents: nullableInt(
      row.doubleBookingRefundsCents,
      `${path}.doubleBookingRefundsCents`,
    ),
  };
}

function readVoucher(value: unknown, path: string): Voucher {
  const row = obj(value, path);
  return {
    id: str(row.id, `${path}.id`),
    code: str(row.code, `${path}.code`),
    originalValueCents: int(row.originalValueCents, `${path}.originalValueCents`),
    remainingCents: int(row.remainingCents, `${path}.remainingCents`),
    status: oneOf(voucherStatuses, row.status, `${path}.status`),
    issuedAt: str(row.issuedAt, `${path}.issuedAt`),
    soldAt: nullableStr(row.soldAt, `${path}.soldAt`),
    // SOURCE-ABSENT: voucher expiry is not tracked upstream.
    expiresAt: nullableStr(row.expiresAt, `${path}.expiresAt`),
    buyerName: nullableStr(row.buyerName, `${path}.buyerName`),
    // SOURCE-ABSENT: redemption history is not tracked upstream. `null` ≠ `[]`.
    usages: nullableMapArray(row.usages, `${path}.usages`, (usage, usagePath) => {
      const entry = obj(usage, usagePath);
      return {
        id: str(entry.id, `${usagePath}.id`),
        redeemedAt: str(entry.redeemedAt, `${usagePath}.redeemedAt`),
        amountCents: int(entry.amountCents, `${usagePath}.amountCents`),
        bookingReference: str(entry.bookingReference, `${usagePath}.bookingReference`),
      };
    }),
  };
}

function readMember(value: unknown, path: string): Member {
  const row = obj(value, path);
  return {
    id: str(row.id, `${path}.id`),
    memberNumber: int(row.memberNumber, `${path}.memberNumber`),
    firstName: str(row.firstName, `${path}.firstName`),
    lastName: str(row.lastName, `${path}.lastName`),
    membershipType: oneOf(membershipTypes, row.membershipType, `${path}.membershipType`),
    status: oneOf(memberStatuses, row.status, `${path}.status`),
    joinedAt: str(row.joinedAt, `${path}.joinedAt`),
    validUntil: nullableStr(row.validUntil, `${path}.validUntil`),
    vatClassification: oneOf(
      membershipClassifications,
      row.vatClassification,
      `${path}.vatClassification`,
    ),
    // SOURCE-ABSENT: no address columns are granted.
    city: nullableStr(row.city, `${path}.city`),
    postalCode: nullableStr(row.postalCode, `${path}.postalCode`),
    // SOURCE-ABSENT: member-to-booking association is none until a stable key exists.
    bookingCount: nullableInt(row.bookingCount, `${path}.bookingCount`),
    bookingRevenueCents: nullableInt(row.bookingRevenueCents, `${path}.bookingRevenueCents`),
  };
}

function readActivityRecord(value: unknown, path: string): ActivityRecord {
  const row = obj(value, path);
  return {
    id: str(row.id, `${path}.id`),
    occurredAt: str(row.occurredAt, `${path}.occurredAt`),
    category: oneOf(activityCategories, row.category, `${path}.category`),
    actionCode: str(row.actionCode, `${path}.actionCode`),
    actorType: oneOf(activityActorTypes, row.actorType, `${path}.actorType`),
    actorRole: str(row.actorRole, `${path}.actorRole`),
    summary: str(row.summary, `${path}.summary`),
    entityLabel: str(row.entityLabel, `${path}.entityLabel`),
    relatedReference: nullableStr(row.relatedReference, `${path}.relatedReference`),
  };
}

function readAlert(value: unknown, path: string): OperationalAlert {
  const row = obj(value, path);
  return {
    id: str(row.id, `${path}.id`),
    createdAt: str(row.createdAt, `${path}.createdAt`),
    severity: oneOf(alertSeverities, row.severity, `${path}.severity`),
    status: oneOf(alertStatuses, row.status, `${path}.status`),
    category: oneOf(alertCategories, row.category, `${path}.category`),
    title: str(row.title, `${path}.title`),
    message: str(row.message, `${path}.message`),
    relatedReference: nullableStr(row.relatedReference, `${path}.relatedReference`),
    court: nullableOneOf(courtKeys, row.court, `${path}.court`),
    amountCents: nullableInt(row.amountCents, `${path}.amountCents`),
    resolvedAt: nullableStr(row.resolvedAt, `${path}.resolvedAt`),
    resolvedByRole: nullableStr(row.resolvedByRole, `${path}.resolvedByRole`),
  };
}

/* ------------------------------------------------------------- Shared shapes */

function readPeriodBounds(value: unknown, path: string): PeriodBounds {
  const row = obj(value, path);
  return { start: str(row.start, `${path}.start`), end: str(row.end, `${path}.end`) };
}

function readRevenueSummary(value: unknown, path: string): RevenueSummary {
  const row = obj(value, path);
  return {
    totalCents: int(row.totalCents, `${path}.totalCents`),
    averageBookingValueCents: int(row.averageBookingValueCents, `${path}.averageBookingValueCents`),
    byProvider: mapArray(row.byProvider, `${path}.byProvider`, (slice, slicePath) => {
      const entry = obj(slice, slicePath);
      return {
        provider: oneOf(paymentProviders, entry.provider, `${slicePath}.provider`),
        amountCents: int(entry.amountCents, `${slicePath}.amountCents`),
      };
    }),
  };
}

function readBookingCounts(value: unknown, path: string): BookingCounts {
  const row = obj(value, path);
  return {
    total: int(row.total, `${path}.total`),
    paid: int(row.paid, `${path}.paid`),
    free: int(row.free, `${path}.free`),
    cancelled: int(row.cancelled, `${path}.cancelled`),
  };
}

function readPaymentStatusSlices(value: unknown, path: string): PaymentStatusSlice[] {
  return mapArray(value, path, (slice, slicePath) => {
    const entry = obj(slice, slicePath);
    return {
      status: oneOf(paymentStatuses, entry.status, `${slicePath}.status`),
      count: int(entry.count, `${slicePath}.count`),
      amountCents: int(entry.amountCents, `${slicePath}.amountCents`),
    };
  });
}

function readVatSummary(value: unknown, path: string): VatSummary {
  const row = obj(value, path);
  return {
    totalVatCents: int(row.totalVatCents, `${path}.totalVatCents`),
    unresolvedCount: int(row.unresolvedCount, `${path}.unresolvedCount`),
    categories: mapArray(row.categories, `${path}.categories`, (slice, slicePath) => {
      const entry = obj(slice, slicePath);
      return {
        category: oneOf(taxCategories, entry.category, `${slicePath}.category`),
        bookingCount: int(entry.bookingCount, `${slicePath}.bookingCount`),
        netCents: int(entry.netCents, `${slicePath}.netCents`),
        vatCents: int(entry.vatCents, `${slicePath}.vatCents`),
        grossCents: int(entry.grossCents, `${slicePath}.grossCents`),
      };
    }),
  };
}

function readCourtUtilization(value: unknown, path: string): CourtUtilization[] {
  return mapArray(value, path, (slice, slicePath) => {
    const entry = obj(slice, slicePath);
    return {
      court: oneOf(courtKeys, entry.court, `${slicePath}.court`),
      bookingCount: int(entry.bookingCount, `${slicePath}.bookingCount`),
      revenueCents: int(entry.revenueCents, `${slicePath}.revenueCents`),
      utilizationPercent: int(entry.utilizationPercent, `${slicePath}.utilizationPercent`),
    };
  });
}

function readMembershipSlices(value: unknown, path: string): MembershipSlice[] {
  return mapArray(value, path, (slice, slicePath) => {
    const entry = obj(slice, slicePath);
    return {
      classification: oneOf(
        membershipClassifications,
        entry.classification,
        `${slicePath}.classification`,
      ),
      bookingCount: int(entry.bookingCount, `${slicePath}.bookingCount`),
      revenueCents: int(entry.revenueCents, `${slicePath}.revenueCents`),
    };
  });
}

function readPeriodTotals(value: unknown, path: string): PeriodTotals {
  const row = obj(value, path);
  return {
    revenueCents: int(row.revenueCents, `${path}.revenueCents`),
    bookingCount: int(row.bookingCount, `${path}.bookingCount`),
    paidCount: int(row.paidCount, `${path}.paidCount`),
    cancelledCount: int(row.cancelledCount, `${path}.cancelledCount`),
    refundedCount: int(row.refundedCount, `${path}.refundedCount`),
    averageBookingValueCents: int(row.averageBookingValueCents, `${path}.averageBookingValueCents`),
  };
}

function readTrend(value: unknown, path: string): TrendPoint[] {
  return mapArray(value, path, (point, pointPath) => {
    const entry = obj(point, pointPath);
    return {
      key: str(entry.key, `${pointPath}.key`),
      label: str(entry.label, `${pointPath}.label`),
      revenueCents: int(entry.revenueCents, `${pointPath}.revenueCents`),
      bookingCount: int(entry.bookingCount, `${pointPath}.bookingCount`),
    };
  });
}

function readAlertSeverityCounts(value: unknown, path: string): AlertSeverityCount[] {
  return mapArray(value, path, (slice, slicePath) => {
    const entry = obj(slice, slicePath);
    return {
      severity: oneOf(alertSeverities, entry.severity, `${slicePath}.severity`),
      count: int(entry.count, `${slicePath}.count`),
    };
  });
}

/* ------------------------------------------------------------------ Responses */

export function validateOverviewSnapshot(value: unknown): OverviewSnapshot {
  const root = obj(value, '$');
  return {
    period: oneOf(overviewPeriods, root.period, '$.period'),
    bounds: readPeriodBounds(root.bounds, '$.bounds'),
    previousBounds: readPeriodBounds(root.previousBounds, '$.previousBounds'),
    comparisonLabel: str(root.comparisonLabel, '$.comparisonLabel'),
    revenue: readRevenueSummary(root.revenue, '$.revenue'),
    bookings: readBookingCounts(root.bookings, '$.bookings'),
    paymentStatus: readPaymentStatusSlices(root.paymentStatus, '$.paymentStatus'),
    vat: readVatSummary(root.vat, '$.vat'),
    courts: readCourtUtilization(root.courts, '$.courts'),
    activity: mapArray(root.activity, '$.activity', (entry, entryPath) => {
      const record = obj(entry, entryPath);
      return {
        id: str(record.id, `${entryPath}.id`),
        occurredAt: str(record.occurredAt, `${entryPath}.occurredAt`),
        kind: oneOf(
          ['booking', 'payment', 'refund', 'cancellation', 'voucher'] as const,
          record.kind,
          `${entryPath}.kind`,
        ),
        summary: str(record.summary, `${entryPath}.summary`),
      };
    }),
    invoices: readInvoiceCounts(root.invoices, '$.invoices'),
    reconciliation: readReconciliationCounts(root.reconciliation, '$.reconciliation'),
    openAlerts: readAlertSeverityCounts(root.openAlerts, '$.openAlerts'),
    totals: readPeriodTotals(root.totals, '$.totals'),
    previous: readPeriodTotals(root.previous, '$.previous'),
    trend: readTrend(root.trend, '$.trend'),
    attention: mapArray(root.attention, '$.attention', (item, itemPath) => {
      const entry = obj(item, itemPath);
      const target = obj(entry.target, `${itemPath}.target`);
      return {
        id: str(entry.id, `${itemPath}.id`),
        severity: oneOf(alertSeverities, entry.severity, `${itemPath}.severity`),
        title: str(entry.title, `${itemPath}.title`),
        detail: str(entry.detail, `${itemPath}.detail`),
        count: int(entry.count, `${itemPath}.count`),
        amountCents: nullableInt(entry.amountCents, `${itemPath}.amountCents`),
        target: {
          section: oneOf(
            [
              'overview',
              'bookings',
              'payments',
              'invoices',
              'reconciliation',
              'monthly-reports',
              'reports',
              'vouchers',
              'members',
              'activity',
              'alerts',
              'settings',
            ] as const,
            target.section,
            `${itemPath}.target.section`,
          ),
          filter:
            target.filter === undefined
              ? undefined
              : Object.fromEntries(
                  Object.entries(obj(target.filter, `${itemPath}.target.filter`)).map(
                    ([key, entryValue]) => [key, str(entryValue, `${itemPath}.target.filter.${key}`)],
                  ),
                ),
        },
      };
    }),
    health: (() => {
      const health = obj(root.health, '$.health');
      return {
        critical: int(health.critical, '$.health.critical'),
        high: int(health.high, '$.health.high'),
        medium: int(health.medium, '$.health.medium'),
        low: int(health.low, '$.health.low'),
        total: int(health.total, '$.health.total'),
        moneyAtRiskCents: int(health.moneyAtRiskCents, '$.health.moneyAtRiskCents'),
      };
    })(),
    dataAsOf: str(root.dataAsOf, '$.dataAsOf'),
  };
}

export function validateBookingPage(value: unknown): BookingPage {
  const root = obj(value, '$');
  return {
    bookings: mapArray(root.bookings, '$.bookings', readBooking),
    total: int(root.total, '$.total'),
  };
}

export function validatePaymentPage(value: unknown): PaymentPage {
  const root = obj(value, '$');
  const totals = obj(root.totals, '$.totals');
  const paymentTotals: PaymentTotals = {
    grossCents: int(totals.grossCents, '$.totals.grossCents'),
    // SOURCE-ABSENT: all three depend on the unavailable per-payment refund amount, and
    // `refundedCount` additionally on a status whose refund semantics hold only for Stripe.
    refundedCents: nullableInt(totals.refundedCents, '$.totals.refundedCents'),
    netCents: nullableInt(totals.netCents, '$.totals.netCents'),
    pendingCents: int(totals.pendingCents, '$.totals.pendingCents'),
    succeededCount: int(totals.succeededCount, '$.totals.succeededCount'),
    pendingCount: int(totals.pendingCount, '$.totals.pendingCount'),
    refundedCount: nullableInt(totals.refundedCount, '$.totals.refundedCount'),
    // SOURCE-ABSENT: both aggregate the excluded payment `metaClass`.
    doubleBookingCount: nullableInt(totals.doubleBookingCount, '$.totals.doubleBookingCount'),
    customerCancelledCount: nullableInt(
      totals.customerCancelledCount,
      '$.totals.customerCancelledCount',
    ),
  };
  const byProvider: ProviderSlice[] = mapArray(root.byProvider, '$.byProvider', (slice, slicePath) => {
    const entry = obj(slice, slicePath);
    return {
      provider: oneOf(paymentProviders, entry.provider, `${slicePath}.provider`),
      count: int(entry.count, `${slicePath}.count`),
      amountCents: int(entry.amountCents, `${slicePath}.amountCents`),
    };
  });
  return {
    payments: mapArray(root.payments, '$.payments', readPayment),
    total: int(root.total, '$.total'),
    totals: paymentTotals,
    byProvider,
    byStatus: readPaymentStatusSlices(root.byStatus, '$.byStatus'),
  };
}

export function validateInvoicePage(value: unknown): InvoicePage {
  const root = obj(value, '$');
  return {
    invoices: mapArray(root.invoices, '$.invoices', readInvoice),
    total: int(root.total, '$.total'),
    counts: readInvoiceCounts(root.counts, '$.counts'),
  };
}

export function validateReconciliationPage(value: unknown): ReconciliationPage {
  const root = obj(value, '$');
  return {
    entries: mapArray(root.entries, '$.entries', readReconciliationEntry),
    total: int(root.total, '$.total'),
    counts: readReconciliationCounts(root.counts, '$.counts'),
  };
}

function readMonthlyReport(value: unknown, path: string): MonthlyReport {
  const row = obj(value, path);
  return {
    id: str(row.id, `${path}.id`),
    month: str(row.month, `${path}.month`),
    periodStart: str(row.periodStart, `${path}.periodStart`),
    periodEnd: str(row.periodEnd, `${path}.periodEnd`),
    totalRevenueCents: int(row.totalRevenueCents, `${path}.totalRevenueCents`),
    stripeRevenueCents: int(row.stripeRevenueCents, `${path}.stripeRevenueCents`),
    paypalRevenueCents: int(row.paypalRevenueCents, `${path}.paypalRevenueCents`),
    voucherRevenueCents: int(row.voucherRevenueCents, `${path}.voucherRevenueCents`),
    refundedCents: int(row.refundedCents, `${path}.refundedCents`),
    refundedCancellationCents: int(row.refundedCancellationCents, `${path}.refundedCancellationCents`),
    refundedDoubleBookingCents: int(
      row.refundedDoubleBookingCents,
      `${path}.refundedDoubleBookingCents`,
    ),
    bookingCount: int(row.bookingCount, `${path}.bookingCount`),
    successfulCount: int(row.successfulCount, `${path}.successfulCount`),
    pendingCount: int(row.pendingCount, `${path}.pendingCount`),
    cancelledCount: int(row.cancelledCount, `${path}.cancelledCount`),
    topCourt: nullableOneOf(courtKeys, row.topCourt, `${path}.topCourt`),
    vat: readVatSummary(row.vat, `${path}.vat`),
    membership: readMembershipSlices(row.membership, `${path}.membership`),
    courts: readCourtUtilization(row.courts, `${path}.courts`),
  };
}

export function validateMonthlyReportComparison(value: unknown): MonthlyReportComparison {
  const root = obj(value, '$');
  return {
    report: readMonthlyReport(root.report, '$.report'),
    previous: root.previous === null ? null : readMonthlyReport(root.previous, '$.previous'),
    availableMonths: mapArray(root.availableMonths, '$.availableMonths', (month, monthPath) =>
      str(month, monthPath),
    ),
  };
}

export function validateReportSnapshot(value: unknown): ReportSnapshot {
  const root = obj(value, '$');
  const refunds = obj(root.refunds, '$.refunds');
  return {
    range: oneOf(reportRanges, root.range, '$.range'),
    periodStart: str(root.periodStart, '$.periodStart'),
    periodEnd: str(root.periodEnd, '$.periodEnd'),
    revenue: readRevenueSummary(root.revenue, '$.revenue'),
    bookings: readBookingCounts(root.bookings, '$.bookings'),
    paymentStatus: readPaymentStatusSlices(root.paymentStatus, '$.paymentStatus'),
    vat: readVatSummary(root.vat, '$.vat'),
    courts: readCourtUtilization(root.courts, '$.courts'),
    refunds: {
      // SOURCE-ABSENT: sums the unavailable per-payment refund amount.
      totalCents: nullableInt(refunds.totalCents, '$.refunds.totalCents'),
      // SOURCE-ABSENT: the live split by reason needs the excluded payment `metaClass`. The stored
      // monthly equivalents stay non-null — they have their own authoritative columns.
      cancellationCents: nullableInt(refunds.cancellationCents, '$.refunds.cancellationCents'),
      doubleBookingCents: nullableInt(refunds.doubleBookingCents, '$.refunds.doubleBookingCents'),
    },
    membership: readMembershipSlices(root.membership, '$.membership'),
  };
}

export function validateVoucherPage(value: unknown): VoucherPage {
  const root = obj(value, '$');
  const totals = obj(root.totals, '$.totals');
  const voucherTotals: VoucherTotals = {
    count: int(totals.count, '$.totals.count'),
    issuedValueCents: int(totals.issuedValueCents, '$.totals.issuedValueCents'),
    redeemedValueCents: int(totals.redeemedValueCents, '$.totals.redeemedValueCents'),
    outstandingValueCents: int(totals.outstandingValueCents, '$.totals.outstandingValueCents'),
    // SOURCE-ABSENT: expiry is not tracked upstream, so nothing can be counted as expired.
    expiredCount: nullableInt(totals.expiredCount, '$.totals.expiredCount'),
  };
  return {
    vouchers: mapArray(root.vouchers, '$.vouchers', readVoucher),
    total: int(root.total, '$.total'),
    totals: voucherTotals,
  };
}

export function validateMemberPage(value: unknown): MemberPage {
  const root = obj(value, '$');
  const totals = obj(root.totals, '$.totals');
  return {
    members: mapArray(root.members, '$.members', readMember),
    total: int(root.total, '$.total'),
    totals: {
      total: int(totals.total, '$.totals.total'),
      active: int(totals.active, '$.totals.active'),
      padel: int(totals.padel, '$.totals.padel'),
      tennis: int(totals.tennis, '$.totals.tennis'),
      combination: int(totals.combination, '$.totals.combination'),
    },
  };
}

export function validateActivityPage(value: unknown): ActivityPage {
  const root = obj(value, '$');
  return {
    records: mapArray(root.records, '$.records', readActivityRecord),
    total: int(root.total, '$.total'),
  };
}

export function validateAlertPage(value: unknown): AlertPage {
  const root = obj(value, '$');
  return {
    alerts: mapArray(root.alerts, '$.alerts', readAlert),
    total: int(root.total, '$.total'),
    openBySeverity: readAlertSeverityCounts(root.openBySeverity, '$.openBySeverity'),
    openCount: int(root.openCount, '$.openCount'),
  };
}

export function validateSettingsSnapshot(value: unknown): SettingsSnapshot {
  const root = obj(value, '$');
  return {
    groups: mapArray(root.groups, '$.groups', (group, groupPath) => {
      const entry = obj(group, groupPath);
      return {
        id: str(entry.id, `${groupPath}.id`),
        label: str(entry.label, `${groupPath}.label`),
        description: str(entry.description, `${groupPath}.description`),
        entries: mapArray(entry.entries, `${groupPath}.entries`, (settingsEntry, entryPath) => {
          const row = obj(settingsEntry, entryPath);
          return {
            key: str(row.key, `${entryPath}.key`),
            label: str(row.label, `${entryPath}.label`),
            value: str(row.value, `${entryPath}.value`),
            hint: row.hint === undefined ? undefined : str(row.hint, `${entryPath}.hint`),
          };
        }),
      };
    }),
    roles: mapArray(root.roles, '$.roles', (role, rolePath) => {
      const entry = obj(role, rolePath);
      return {
        id: str(entry.id, `${rolePath}.id`),
        label: str(entry.label, `${rolePath}.label`),
        description: str(entry.description, `${rolePath}.description`),
      };
    }),
    permissionGroups: mapArray(root.permissionGroups, '$.permissionGroups', (group, groupPath) => {
      const entry = obj(group, groupPath);
      return {
        id: str(entry.id, `${groupPath}.id`),
        label: str(entry.label, `${groupPath}.label`),
        permissions: mapArray(entry.permissions, `${groupPath}.permissions`, (row, rowPath) => {
          const permission = obj(row, rowPath);
          return {
            key: str(permission.key, `${rowPath}.key`),
            label: str(permission.label, `${rowPath}.label`),
            grants: Object.fromEntries(
              Object.entries(obj(permission.grants, `${rowPath}.grants`)).map(([role, granted]) => [
                role,
                bool(granted, `${rowPath}.grants.${role}`),
              ]),
            ),
          };
        }),
      };
    }),
  };
}
