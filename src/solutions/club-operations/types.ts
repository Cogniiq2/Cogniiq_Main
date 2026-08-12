// Club Operations — domain model.
//
// This is the vocabulary the UI speaks. It is deliberately a *domain* model, not a transport model:
// no table names, no column names, no provider payload shapes. A later gateway adapter maps whatever
// the server returns onto these types, so the UI never changes when the transport does.
//
// Money is ALWAYS an integer number of cents, matching the Cogniiq convention (see
// `formatCents` in src/lib/clientPlatform/validation.ts). The reference system stores euro
// floats; converting at the adapter boundary is a mapping concern and must never leak into the UI.

/* ------------------------------------------------------------------ Sections */

/**
 * The module's own sections.
 *
 * Declared here rather than in `navigation.ts` because the attention model needs to name a
 * drill-down target, and `navigation.ts` carries icon components. A pure domain type must not drag
 * a rendering dependency behind it.
 */
export const clubOperationsSectionIds = [
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
] as const;
export type ClubOperationsSectionId = (typeof clubOperationsSectionIds)[number];

/* ------------------------------------------------------------------ Courts */

export const courtKeys = ['padel-1', 'padel-2', 'tennis-1', 'tennis-2', 'tennis-3'] as const;
export type CourtKey = (typeof courtKeys)[number];

export type CourtSport = 'padel' | 'tennis';

/* ------------------------------------------------------------------ Bookings */

export const bookingStatuses = ['confirmed', 'pending', 'cancelled', 'refunded', 'failed'] as const;
export type BookingStatus = (typeof bookingStatuses)[number];

export const paymentProviders = ['stripe', 'paypal', 'voucher', 'free'] as const;
export type PaymentProvider = (typeof paymentProviders)[number];

export const paymentStatuses = ['paid', 'pending', 'refunded', 'failed', 'not_required'] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

/**
 * VAT treatment. Padel is rated by membership (reduced rate for members, standard rate for
 * non-members); tennis is exempt; free bookings carry no VAT. `padel_unresolved` marks a padel
 * booking whose membership could not be determined and which therefore needs manual review.
 */
export const taxCategories = [
  'padel_member_reduced',
  'padel_non_member_standard',
  'padel_unresolved',
  'tennis_exempt',
  'free',
  'unknown',
] as const;
export type TaxCategory = (typeof taxCategories)[number];

export type MembershipClassification = 'member' | 'non_member' | 'unresolved' | 'not_applicable';

/**
 * A booking as the operations dashboard needs it.
 *
 * Intentionally carries no contact details, no payment-provider identifiers and no cancellation
 * tokens: none of them are needed to read the operational picture, and omitting them keeps this
 * phase free of personal data by construction.
 */
export interface Booking {
  id: string;
  /** Human-facing reference shown to staff. */
  reference: string;
  court: CourtKey;
  /** ISO 8601 timestamps. */
  startsAt: string;
  endsAt: string;
  customerName: string;
  status: BookingStatus;
  provider: PaymentProvider;
  paymentStatus: PaymentStatus;
  amountCents: number;
  currency: string;
  membership: MembershipClassification;
  taxCategory: TaxCategory;
  /** Percent, e.g. 7 or 19. Null where no rate applies (exempt, free, unresolved). */
  taxRatePercent: number | null;
  /** Whether the booking requested floodlights. Read-only here; actuation is a later phase. */
  lightsRequested: boolean;
}

/* ------------------------------------------------------------------ Queries */

export interface BookingQuery {
  /** Free-text match against customer name and reference. */
  search?: string;
  /** Inclusive ISO date bounds (YYYY-MM-DD), compared against the booking's local start date. */
  dateFrom?: string;
  dateTo?: string;
  status?: BookingStatus | 'all';
  court?: CourtKey | 'all';
}

export const emptyBookingQuery: BookingQuery = {
  search: '',
  dateFrom: '',
  dateTo: '',
  status: 'all',
  court: 'all',
};

export interface BookingPage {
  bookings: Booking[];
  /** Total matching the query. Equal to `bookings.length` while the adapter returns unpaged data. */
  total: number;
}

export interface OverviewQuery {
  period: OverviewPeriod;
}

export const overviewPeriods = ['today', 'week', 'month', 'last_month'] as const;
export type OverviewPeriod = (typeof overviewPeriods)[number];

/* ------------------------------------------------------------------ Overview */

export interface RevenueByProvider {
  provider: PaymentProvider;
  amountCents: number;
}

export interface RevenueSummary {
  totalCents: number;
  averageBookingValueCents: number;
  byProvider: RevenueByProvider[];
}

export interface BookingCounts {
  total: number;
  paid: number;
  free: number;
  cancelled: number;
}

export interface PaymentStatusSlice {
  status: PaymentStatus;
  count: number;
  amountCents: number;
}

export interface VatCategoryStat {
  category: TaxCategory;
  bookingCount: number;
  netCents: number;
  vatCents: number;
  grossCents: number;
}

export interface VatSummary {
  totalVatCents: number;
  categories: VatCategoryStat[];
  /** Padel bookings whose membership could not be resolved; these need manual review. */
  unresolvedCount: number;
}

export interface CourtUtilization {
  court: CourtKey;
  bookingCount: number;
  revenueCents: number;
  /** Share of bookable slots taken, 0–100. */
  utilizationPercent: number;
}

export type ActivityKind = 'booking' | 'payment' | 'refund' | 'cancellation' | 'voucher';

export interface ActivityEntry {
  id: string;
  occurredAt: string;
  kind: ActivityKind;
  summary: string;
}

/** Inclusive YYYY-MM-DD bounds of a reporting window. */
export interface PeriodBounds {
  start: string;
  end: string;
}

/**
 * The comparable figures of a reporting window.
 *
 * Deliberately a flat set of scalars rather than a nested snapshot: its only job is to sit beside
 * the current period so a delta can be computed, and a second full snapshot would invite the two to
 * be aggregated differently.
 */
export interface PeriodTotals {
  revenueCents: number;
  bookingCount: number;
  paidCount: number;
  cancelledCount: number;
  refundedCount: number;
  averageBookingValueCents: number;
}

/** One point on the overview's trend series. `key` is a YYYY-MM-DD or YYYY-MM bucket. */
export interface TrendPoint {
  key: string;
  label: string;
  revenueCents: number;
  bookingCount: number;
}

/* ------------------------------------------------------------------ Attention */

/**
 * Severity of an item in the attention model. Shares its vocabulary with `AlertSeverity` so a
 * derived finding and a raised alert can never be ranked on two different scales.
 */
export type AttentionSeverity = AlertSeverity;

/** Where an attention item leads. Always a section of this module, never an external link. */
export interface AttentionTarget {
  section: ClubOperationsSectionId;
  /** Facet values to pre-apply in the target section, e.g. `{ status: 'failed' }`. */
  filter?: Record<string, string>;
}

/**
 * One thing that needs a human.
 *
 * Every field is derived from the same records the sections list, so an item's count is the count
 * the target section shows once its filter is applied — that equality is asserted in the tests
 * rather than assumed.
 */
export interface AttentionItem {
  id: string;
  severity: AttentionSeverity;
  title: string;
  /** One sentence on what it means and what it costs. */
  detail: string;
  count: number;
  /** Money implicated, or null where the finding is not monetary. */
  amountCents: number | null;
  target: AttentionTarget;
}

/** Roll-up of the attention model, used by the module header's health summary. */
export interface OperationalHealth {
  critical: number;
  high: number;
  medium: number;
  low: number;
  /** Findings of any severity. */
  total: number;
  /** Sum of every item's implicated amount. */
  moneyAtRiskCents: number;
}

export interface OverviewSnapshot {
  period: OverviewPeriod;
  /** The window the figures cover, so the reader never has to infer it. */
  bounds: PeriodBounds;
  /** The preceding comparable window. */
  previousBounds: PeriodBounds;
  /** German name of the comparison, e.g. "Vormonat". */
  comparisonLabel: string;
  revenue: RevenueSummary;
  bookings: BookingCounts;
  paymentStatus: PaymentStatusSlice[];
  vat: VatSummary;
  courts: CourtUtilization[];
  activity: ActivityEntry[];
  /** Invoice headline figures, mirroring the reference dashboard's invoice KPI row. */
  invoices: InvoiceCounts;
  /** Reconciliation headline figures. */
  reconciliation: ReconciliationCounts;
  /** Unresolved operational alerts by severity. */
  openAlerts: AlertSeverityCount[];
  /** This window's comparable totals. */
  totals: PeriodTotals;
  /** The preceding window's comparable totals, for deltas. */
  previous: PeriodTotals;
  /** Revenue and bookings over time within the window. */
  trend: TrendPoint[];
  /** Everything that needs a human, most serious first. */
  attention: AttentionItem[];
  /** Roll-up of `attention`. */
  health: OperationalHealth;
  /** The date the dataset is current as of (YYYY-MM-DD). */
  dataAsOf: string;
}

/* ================================================================== Payments */

export type PaymentReferenceType = 'booking' | 'voucher';

/**
 * Why a payment exists in its current shape. The reference dashboard derives this from payment
 * metadata to drive its "Doppelbuchungen" and "Kundenstornierungen" facets.
 */
export const paymentMetaClasses = ['standard', 'double_booking', 'customer_cancelled'] as const;
export type PaymentMetaClass = (typeof paymentMetaClasses)[number];

/**
 * A payment as the ledger needs it.
 *
 * Carries no provider identifiers (session/intent/capture ids) and no contact details: neither is
 * needed to read the ledger, and omitting them keeps this phase free of payment identifiers and
 * personal data by construction.
 */
export interface Payment {
  id: string;
  reference: string;
  occurredAt: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  grossCents: number;
  refundedCents: number;
  currency: string;
  referenceType: PaymentReferenceType;
  /** Booking reference or voucher code this payment settles. */
  referenceLabel: string;
  customerName: string;
  metaClass: PaymentMetaClass;
  note: string | null;
}

export interface PaymentQuery {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  provider?: PaymentProvider | 'all';
  status?: PaymentStatus | 'all';
  metaClass?: PaymentMetaClass | 'all';
}

export const emptyPaymentQuery: PaymentQuery = {
  search: '',
  dateFrom: '',
  dateTo: '',
  provider: 'all',
  status: 'all',
  metaClass: 'all',
};

export interface PaymentTotals {
  grossCents: number;
  refundedCents: number;
  /** gross - refunded: what the club actually keeps. */
  netCents: number;
  pendingCents: number;
  succeededCount: number;
  pendingCount: number;
  refundedCount: number;
  doubleBookingCount: number;
  customerCancelledCount: number;
}

export interface ProviderSlice {
  provider: PaymentProvider;
  count: number;
  amountCents: number;
}

export interface PaymentPage {
  payments: Payment[];
  total: number;
  totals: PaymentTotals;
  byProvider: ProviderSlice[];
  byStatus: PaymentStatusSlice[];
}

/* ================================================================== Invoices */

export const invoiceStatuses = ['draft', 'open', 'paid', 'void', 'uncollectible'] as const;
export type InvoiceStatus = (typeof invoiceStatuses)[number];

/**
 * An invoice. Net/VAT/gross are all stored explicitly rather than derived at render time, because
 * the split is a bookkeeping fact and must not drift with formatting code.
 *
 * Deliberately carries no hosted URL, PDF link, dashboard link or customer identifier: those are
 * live external references.
 */
export interface Invoice {
  id: string;
  number: string;
  issuedAt: string;
  dueDate: string;
  sentAt: string | null;
  paidAt: string | null;
  voidedAt: string | null;
  status: InvoiceStatus;
  customerName: string;
  bookingReference: string | null;
  netCents: number;
  vatCents: number;
  grossCents: number;
  taxRatePercent: number | null;
  currency: string;
  reason: string;
}

export interface InvoiceQuery {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: InvoiceStatus | 'all';
}

export const emptyInvoiceQuery: InvoiceQuery = {
  search: '',
  dateFrom: '',
  dateTo: '',
  status: 'all',
};

export interface InvoiceCounts {
  total: number;
  draft: number;
  open: number;
  paid: number;
  voided: number;
  uncollectible: number;
  overdue: number;
  outstandingCents: number;
  collectedCents: number;
}

export interface InvoicePage {
  invoices: Invoice[];
  total: number;
  counts: InvoiceCounts;
}

/* ============================================================ Reconciliation */

export const reconciliationIssues = [
  'matched',
  'paid_no_booking',
  'active_booking_refunded',
  'amount_mismatch',
  'double_booking',
  'customer_cancellation',
  'false_refund_likely',
  'needs_review',
] as const;
export type ReconciliationIssue = (typeof reconciliationIssues)[number];

export const reconciliationSeverities = ['ok', 'info', 'warning', 'critical'] as const;
export type ReconciliationSeverity = (typeof reconciliationSeverities)[number];

/**
 * One payment checked against its booking.
 *
 * The reference system additionally enriches each row by calling the Stripe API at render time.
 * That enrichment is deliberately absent here: it exists only to reach an external service.
 */
export interface ReconciliationEntry {
  id: string;
  issue: ReconciliationIssue;
  severity: ReconciliationSeverity;
  occurredAt: string;
  customerName: string;
  bookingReference: string | null;
  paymentReference: string | null;
  court: CourtKey | null;
  provider: PaymentProvider;
  bookingAmountCents: number;
  paymentAmountCents: number;
  refundAmountCents: number;
  /** Amount the club could still reclaim. Zero for healthy rows. */
  moneyToRecoverCents: number;
  bookingStatus: BookingStatus | null;
  invoiceStatus: InvoiceStatus | null;
  /** German, human-readable next step. Advisory only — nothing acts on it in this phase. */
  suggestedAction: string;
}

export interface ReconciliationQuery {
  search?: string;
  issue?: ReconciliationIssue | 'all';
  severity?: ReconciliationSeverity | 'all';
}

export const emptyReconciliationQuery: ReconciliationQuery = {
  search: '',
  issue: 'all',
  severity: 'all',
};

export interface ReconciliationCounts {
  totalPayments: number;
  matched: number;
  openReview: number;
  falseRefunds: number;
  moneyToRecoverCents: number;
  refundedTotalCents: number;
  cancellationRefundsCents: number;
  doubleBookingRefundsCents: number;
}

export interface ReconciliationPage {
  entries: ReconciliationEntry[];
  total: number;
  counts: ReconciliationCounts;
}

/* =========================================================== Monthly reports */

export interface MembershipSlice {
  classification: MembershipClassification;
  bookingCount: number;
  revenueCents: number;
}

/**
 * A persisted monthly financial report.
 *
 * The reference model also stores Storage URLs for a generated PDF and CSV; both are dropped, as
 * they are live external links.
 */
export interface MonthlyReport {
  id: string;
  /** YYYY-MM. */
  month: string;
  periodStart: string;
  periodEnd: string;
  totalRevenueCents: number;
  stripeRevenueCents: number;
  paypalRevenueCents: number;
  voucherRevenueCents: number;
  refundedCents: number;
  refundedCancellationCents: number;
  refundedDoubleBookingCents: number;
  bookingCount: number;
  successfulCount: number;
  pendingCount: number;
  cancelledCount: number;
  topCourt: CourtKey | null;
  vat: VatSummary;
  membership: MembershipSlice[];
  courts: CourtUtilization[];
}

export interface MonthlyReportQuery {
  /** YYYY-MM. Omitted selects the most recent available month. */
  month?: string;
}

/** A month's figures alongside the preceding month, so movement is visible rather than implied. */
export interface MonthlyReportComparison {
  report: MonthlyReport;
  previous: MonthlyReport | null;
  availableMonths: string[];
}

/* ==================================================================== Reports */

export interface RefundBreakdown {
  totalCents: number;
  cancellationCents: number;
  doubleBookingCents: number;
}

export const reportRanges = ['week', 'month', 'last_month', 'quarter'] as const;
export type ReportRange = (typeof reportRanges)[number];

export interface ReportQuery {
  range: ReportRange;
}

/**
 * The content of the period financial report.
 *
 * Mirrors the sections the reference system renders into its PDF, so the on-screen preview carries
 * the same information without needing a document generator.
 */
export interface ReportSnapshot {
  range: ReportRange;
  periodStart: string;
  periodEnd: string;
  revenue: RevenueSummary;
  bookings: BookingCounts;
  paymentStatus: PaymentStatusSlice[];
  vat: VatSummary;
  courts: CourtUtilization[];
  refunds: RefundBreakdown;
  membership: MembershipSlice[];
}

/* =================================================================== Vouchers */

export const voucherStatuses = ['open', 'sold', 'partially_redeemed', 'redeemed', 'expired'] as const;
export type VoucherStatus = (typeof voucherStatuses)[number];

export interface VoucherUsage {
  id: string;
  redeemedAt: string;
  amountCents: number;
  bookingReference: string;
}

/**
 * A gift voucher.
 *
 * The reference model is binary — redeemed or not. A remaining balance is modelled here instead, so
 * partial redemption is representable; `redeemed` is simply the case where the balance reaches zero.
 */
export interface Voucher {
  id: string;
  code: string;
  originalValueCents: number;
  remainingCents: number;
  status: VoucherStatus;
  issuedAt: string;
  soldAt: string | null;
  expiresAt: string;
  buyerName: string | null;
  usages: VoucherUsage[];
}

export interface VoucherQuery {
  search?: string;
  status?: VoucherStatus | 'all';
}

export const emptyVoucherQuery: VoucherQuery = { search: '', status: 'all' };

export interface VoucherTotals {
  count: number;
  issuedValueCents: number;
  redeemedValueCents: number;
  outstandingValueCents: number;
  expiredCount: number;
}

export interface VoucherPage {
  vouchers: Voucher[];
  total: number;
  totals: VoucherTotals;
}

/* ==================================================================== Members */

export const membershipTypes = ['padel', 'tennis', 'combination', 'other'] as const;
export type MembershipType = (typeof membershipTypes)[number];

export const memberStatuses = ['active', 'pending', 'inactive', 'resigned'] as const;
export type MemberStatus = (typeof memberStatuses)[number];

/**
 * A club member.
 *
 * Membership is what determines the padel VAT rate, so the VAT classification the member confers is
 * carried explicitly. No e-mail, phone or other contact channel is modelled.
 */
export interface Member {
  id: string;
  memberNumber: number;
  firstName: string;
  lastName: string;
  membershipType: MembershipType;
  status: MemberStatus;
  joinedAt: string;
  validUntil: string | null;
  /** VAT treatment this membership confers on padel bookings. */
  vatClassification: MembershipClassification;
  city: string;
  postalCode: string;
  bookingCount: number;
  bookingRevenueCents: number;
}

export interface MemberQuery {
  search?: string;
  membershipType?: MembershipType | 'all';
  status?: MemberStatus | 'all';
}

export const emptyMemberQuery: MemberQuery = { search: '', membershipType: 'all', status: 'all' };

export interface MemberTotals {
  total: number;
  active: number;
  padel: number;
  tennis: number;
  combination: number;
}

export interface MemberPage {
  members: Member[];
  total: number;
  totals: MemberTotals;
}

/* =================================================================== Activity */

export const activityCategories = [
  'booking',
  'payment',
  'refund',
  'voucher',
  'invoice',
  'report',
  'member',
  'tax',
  'system',
] as const;
export type ActivityCategory = (typeof activityCategories)[number];

export const activityActorTypes = ['admin', 'system', 'customer'] as const;
export type ActivityActorType = (typeof activityActorTypes)[number];

/**
 * One audit-trail entry.
 *
 * The reference model stores actor e-mail, IP address and user agent. All three are dropped: they
 * are personal and network-identifying data with no read-only operational value here. An actor
 * *role* is kept, which is what the reader actually needs.
 */
export interface ActivityRecord {
  id: string;
  occurredAt: string;
  category: ActivityCategory;
  /** Stable machine code, e.g. EXPORT_PDF. Rendered through a German label map. */
  actionCode: string;
  actorType: ActivityActorType;
  actorRole: string;
  summary: string;
  entityLabel: string;
  relatedReference: string | null;
}

export interface ActivityQuery {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  category?: ActivityCategory | 'all';
  actorType?: ActivityActorType | 'all';
}

export const emptyActivityQuery: ActivityQuery = {
  search: '',
  dateFrom: '',
  dateTo: '',
  category: 'all',
  actorType: 'all',
};

export interface ActivityPage {
  records: ActivityRecord[];
  total: number;
}

/* ===================================================================== Alerts */

export const alertSeverities = ['critical', 'high', 'medium', 'low'] as const;
export type AlertSeverity = (typeof alertSeverities)[number];

export const alertStatuses = ['open', 'in_progress', 'resolved', 'ignored'] as const;
export type AlertStatus = (typeof alertStatuses)[number];

export const alertCategories = [
  'payment',
  'booking',
  'refund',
  'reconciliation',
  'voucher',
  'floodlight',
  'system',
] as const;
export type AlertCategory = (typeof alertCategories)[number];

export interface OperationalAlert {
  id: string;
  createdAt: string;
  severity: AlertSeverity;
  status: AlertStatus;
  category: AlertCategory;
  title: string;
  message: string;
  relatedReference: string | null;
  court: CourtKey | null;
  amountCents: number | null;
  resolvedAt: string | null;
  resolvedByRole: string | null;
}

/**
 * Alert status facet.
 *
 * `unresolved` is not an `AlertStatus` — it is the union of `open` and `in_progress`, i.e. exactly
 * what `isAlertOpen` means. It exists as a facet because triage asks "what is still outstanding",
 * and without it the only way to ask that was two separate queries. Its absence also made the
 * overview's open-alert count irreproducible in the Alert Center, which is the failure the
 * drill-down tests exist to catch.
 */
export type AlertStatusFacet = AlertStatus | 'unresolved';

export interface AlertQuery {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  severity?: AlertSeverity | 'all';
  status?: AlertStatusFacet | 'all';
  category?: AlertCategory | 'all';
}

export const emptyAlertQuery: AlertQuery = {
  search: '',
  dateFrom: '',
  dateTo: '',
  severity: 'all',
  status: 'all',
  category: 'all',
};

export interface AlertSeverityCount {
  severity: AlertSeverity;
  count: number;
}

export interface AlertPage {
  alerts: OperationalAlert[];
  total: number;
  openBySeverity: AlertSeverityCount[];
  openCount: number;
}

/* =================================================================== Settings */

export interface SettingsEntry {
  key: string;
  label: string;
  value: string;
  hint?: string;
}

export interface SettingsGroup {
  id: string;
  label: string;
  description: string;
  entries: SettingsEntry[];
}

export interface PermissionRow {
  key: string;
  label: string;
  /** Role id -> granted. */
  grants: Record<string, boolean>;
}

export interface PermissionGroup {
  id: string;
  label: string;
  permissions: PermissionRow[];
}

export interface RoleDefinition {
  id: string;
  label: string;
  description: string;
}

/**
 * Read-only configuration view.
 *
 * Values are fictional and illustrative. No secret, URL, key, identifier or contact address is
 * modelled — the type has no field capable of holding one.
 */
export interface SettingsSnapshot {
  groups: SettingsGroup[];
  roles: RoleDefinition[];
  permissionGroups: PermissionGroup[];
}
