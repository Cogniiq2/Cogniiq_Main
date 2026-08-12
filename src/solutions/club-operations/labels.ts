// German terminology for the Club Operations domain.
//
// The wording is carried over from the reference dashboard so staff read the same words they read
// today. Only the vocabulary is ported — the reference implementation's colour classes and badge
// styling are deliberately dropped in favour of Cogniiq's shared tokens.

// Imported from the specific token module rather than the dashboard barrel: the barrel also exports
// DashboardShell, which pulls in AuthContext and the Supabase client. This module must stay
// independent of both, so it never imports the barrel.
import type { StatusToneKey } from '@/components/dashboard/tokens';

import type {
  ActivityActorType,
  ActivityCategory,
  ActivityKind,
  AlertCategory,
  AlertSeverity,
  AlertStatus,
  AlertStatusFacet,
  AttentionSeverity,
  BookingStatus,
  ClubOperationsSectionId,
  CourtKey,
  CourtSport,
  InvoiceStatus,
  MemberStatus,
  MembershipClassification,
  MembershipType,
  PaymentMetaClass,
  PaymentProvider,
  PaymentReferenceType,
  PaymentStatus,
  ReconciliationIssue,
  ReconciliationSeverity,
  ReportRange,
  TaxCategory,
  VoucherStatus,
} from './types';

export const courtLabels: Record<CourtKey, string> = {
  'padel-1': 'Padel 1',
  'padel-2': 'Padel 2',
  'tennis-1': 'Tennis 1',
  'tennis-2': 'Tennis 2',
  'tennis-3': 'Tennis 3',
};

export function courtLabel(court: CourtKey): string {
  return courtLabels[court];
}

export function courtSport(court: CourtKey): CourtSport {
  return court.startsWith('padel') ? 'padel' : 'tennis';
}

export const bookingStatusLabels: Record<BookingStatus, string> = {
  confirmed: 'Bestätigt',
  pending: 'Ausstehend',
  cancelled: 'Storniert',
  refunded: 'Erstattet',
  failed: 'Fehlgeschlagen',
};

export const bookingStatusTones: Record<BookingStatus, StatusToneKey> = {
  confirmed: 'success',
  pending: 'warning',
  cancelled: 'neutral',
  refunded: 'info',
  failed: 'danger',
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  paid: 'Bezahlt',
  pending: 'Ausstehend',
  refunded: 'Erstattet',
  failed: 'Fehlgeschlagen',
  not_required: 'Nicht erforderlich',
};

export const paymentStatusTones: Record<PaymentStatus, StatusToneKey> = {
  paid: 'success',
  pending: 'warning',
  refunded: 'info',
  failed: 'danger',
  not_required: 'neutral',
};

export const paymentProviderLabels: Record<PaymentProvider, string> = {
  stripe: 'Stripe',
  paypal: 'PayPal',
  voucher: 'Gutschein',
  free: 'Kostenlos',
};

export const taxCategoryLabels: Record<TaxCategory, string> = {
  padel_member_reduced: 'Padel Mitglieder – 7 %',
  padel_non_member_standard: 'Padel Nichtmitglieder – 19 %',
  padel_unresolved: 'Padel ungeklärt',
  tennis_exempt: 'Tennis – 0 %',
  free: 'Kostenlos',
  unknown: 'Unbekannt',
};

export const taxCategoryTones: Record<TaxCategory, StatusToneKey> = {
  padel_member_reduced: 'info',
  padel_non_member_standard: 'info',
  padel_unresolved: 'warning',
  tennis_exempt: 'neutral',
  free: 'neutral',
  unknown: 'neutral',
};

export const membershipLabels: Record<MembershipClassification, string> = {
  member: 'Mitglied',
  non_member: 'Nichtmitglied',
  unresolved: 'Ungeklärt',
  not_applicable: 'Nicht zutreffend',
};

export const activityKindLabels: Record<ActivityKind, string> = {
  booking: 'Buchung',
  payment: 'Zahlung',
  refund: 'Erstattung',
  cancellation: 'Stornierung',
  voucher: 'Gutschein',
};

export const overviewPeriodLabels = {
  today: 'Heute',
  week: 'Diese Woche',
  month: 'Dieser Monat',
  last_month: 'Letzter Monat',
} as const;

/* ------------------------------------------------------------------ Payments */

export const paymentReferenceTypeLabels: Record<PaymentReferenceType, string> = {
  booking: 'Buchung',
  voucher: 'Gutschein',
};

export const paymentMetaClassLabels: Record<PaymentMetaClass, string> = {
  standard: 'Regulär',
  double_booking: 'Doppelbuchung',
  customer_cancelled: 'Kundenstornierung',
};

export const paymentMetaClassTones: Record<PaymentMetaClass, StatusToneKey> = {
  standard: 'neutral',
  double_booking: 'danger',
  customer_cancelled: 'warning',
};

/* ------------------------------------------------------------------ Invoices */

export const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  draft: 'Entwurf',
  open: 'Versendet / Offen',
  paid: 'Bezahlt',
  void: 'Storniert',
  uncollectible: 'Uneinbringlich',
};

export const invoiceStatusTones: Record<InvoiceStatus, StatusToneKey> = {
  draft: 'warning',
  open: 'info',
  paid: 'success',
  void: 'neutral',
  uncollectible: 'danger',
};

/* ------------------------------------------------------------ Reconciliation */

export const reconciliationIssueLabels: Record<ReconciliationIssue, string> = {
  matched: 'Abgeglichen',
  paid_no_booking: 'Zahlung ohne Buchung',
  active_booking_refunded: 'Aktive Buchung erstattet',
  amount_mismatch: 'Betragsabweichung',
  double_booking: 'Doppelbuchung',
  customer_cancellation: 'Kundenstornierung',
  false_refund_likely: 'Erstattung vermutlich fehlerhaft',
  needs_review: 'Prüfung erforderlich',
};

export const reconciliationSeverityLabels: Record<ReconciliationSeverity, string> = {
  ok: 'In Ordnung',
  info: 'Hinweis',
  warning: 'Warnung',
  critical: 'Kritisch',
};

export const reconciliationSeverityTones: Record<ReconciliationSeverity, StatusToneKey> = {
  ok: 'success',
  info: 'info',
  warning: 'warning',
  critical: 'danger',
};

/* ------------------------------------------------------------------ Vouchers */

export const voucherStatusLabels: Record<VoucherStatus, string> = {
  open: 'Offen',
  sold: 'Verkauft',
  partially_redeemed: 'Teilweise eingelöst',
  redeemed: 'Eingelöst',
  expired: 'Verfallen',
};

export const voucherStatusTones: Record<VoucherStatus, StatusToneKey> = {
  open: 'info',
  sold: 'warning',
  partially_redeemed: 'warning',
  redeemed: 'success',
  expired: 'neutral',
};

/* ------------------------------------------------------------------- Members */

export const membershipTypeLabels: Record<MembershipType, string> = {
  padel: 'Padel',
  tennis: 'Tennis',
  combination: 'Kombination',
  other: 'Sonstige',
};

export const memberStatusLabels: Record<MemberStatus, string> = {
  active: 'Aktiv',
  pending: 'In Aufnahme',
  inactive: 'Ruhend',
  resigned: 'Ausgetreten',
};

export const memberStatusTones: Record<MemberStatus, StatusToneKey> = {
  active: 'success',
  pending: 'warning',
  inactive: 'neutral',
  resigned: 'neutral',
};

/* ------------------------------------------------------------------ Activity */

export const activityCategoryLabels: Record<ActivityCategory, string> = {
  booking: 'Buchung',
  payment: 'Zahlung',
  refund: 'Erstattung',
  voucher: 'Gutschein',
  invoice: 'Rechnung',
  report: 'Bericht',
  member: 'Mitglied',
  tax: 'Umsatzsteuer',
  system: 'System',
};

export const activityActorTypeLabels: Record<ActivityActorType, string> = {
  admin: 'Administration',
  system: 'System',
  customer: 'Kunde',
};

/**
 * German labels for the audit action codes the reference system records. Carried over verbatim so
 * the protocol reads identically to the one staff know.
 */
export const activityActionLabels: Record<string, string> = {
  VIEW_REPORT: 'Bericht angesehen',
  EXPORT_PDF: 'PDF exportiert',
  EXPORT_CSV: 'CSV exportiert',
  GENERATE_MONTHLY_REPORT: 'Monatsbericht erstellt',
  DELETE_MONTHLY_REPORT: 'Monatsbericht gelöscht',
  CREATE_VOUCHER: 'Gutschein erstellt',
  DELETE_VOUCHER: 'Gutschein gelöscht',
  UPDATE_VOUCHER: 'Gutschein aktualisiert',
  VIEW_BOOKINGS: 'Buchungen angesehen',
  VIEW_PAYMENTS: 'Zahlungen angesehen',
  SET_TAX_OVERRIDE: 'MwSt.-Kategorie überschrieben',
  REMOVE_TAX_OVERRIDE: 'MwSt.-Überschreibung entfernt',
  INVOICE_CREATED: 'Rechnung erstellt',
  INVOICE_SENT: 'Rechnung versendet',
  PAYMENT_REFUNDED: 'Zahlung erstattet',
  BOOKING_CANCELLED: 'Buchung storniert',
  ALERT_RAISED: 'Warnung ausgelöst',
  UNKNOWN: 'Unbekannte Aktion',
};

export function activityActionLabel(code: string): string {
  return activityActionLabels[code] ?? activityActionLabels.UNKNOWN;
}

/* -------------------------------------------------------------------- Alerts */

export const alertSeverityLabels: Record<AlertSeverity, string> = {
  critical: 'Kritisch',
  high: 'Hoch',
  medium: 'Mittel',
  low: 'Niedrig',
};

export const alertSeverityTones: Record<AlertSeverity, StatusToneKey> = {
  critical: 'danger',
  high: 'danger',
  medium: 'warning',
  low: 'info',
};

export const alertStatusLabels: Record<AlertStatus, string> = {
  open: 'Offen',
  in_progress: 'In Bearbeitung',
  resolved: 'Gelöst',
  ignored: 'Ignoriert',
};

/** The status facet, including the synthetic union used for triage. */
export const alertStatusFacetLabels: Record<AlertStatusFacet, string> = {
  ...alertStatusLabels,
  unresolved: 'Unerledigt (offen und in Bearbeitung)',
};

export const alertStatusTones: Record<AlertStatus, StatusToneKey> = {
  open: 'warning',
  in_progress: 'info',
  resolved: 'success',
  ignored: 'neutral',
};

export const alertCategoryLabels: Record<AlertCategory, string> = {
  payment: 'Zahlung',
  booking: 'Buchung',
  refund: 'Erstattung',
  reconciliation: 'Abgleich',
  voucher: 'Gutschein',
  floodlight: 'Flutlicht',
  system: 'System',
};

/* ----------------------------------------------------------------- Attention */

/**
 * Severity wording for the attention model.
 *
 * Deliberately different from `alertSeverityLabels`: an alert's severity describes the alert
 * ("Kritisch"), while an attention item's describes what the reader should do about it. Reusing one
 * map would force a derived finding to borrow an alert's voice.
 */
export const attentionSeverityLabels: Record<AttentionSeverity, string> = {
  critical: 'sofort prüfen',
  high: 'heute prüfen',
  medium: 'vor Abschluss klären',
  low: 'beobachten',
};

/** Section names, for the accessible name of a drill-down control. */
export const sectionTargetLabels: Record<ClubOperationsSectionId, string> = {
  overview: 'Übersicht',
  bookings: 'Buchungen',
  payments: 'Zahlungen',
  invoices: 'Rechnungen',
  reconciliation: 'Zahlungsabgleich',
  'monthly-reports': 'Monatsberichte',
  reports: 'Berichte',
  vouchers: 'Gutscheine',
  members: 'Mitglieder',
  activity: 'Aktivitätsprotokoll',
  alerts: 'Alert Center',
  settings: 'Einstellungen',
};

/* ------------------------------------------------------------------- Reports */

export const reportRangeLabels: Record<ReportRange, string> = {
  week: 'Diese Woche',
  month: 'Dieser Monat',
  last_month: 'Letzter Monat',
  quarter: 'Letzte 3 Monate',
};

/** "2026-03" -> "März 2026". Pure: builds the date from the parts, never parses a locale string. */
export function monthLabel(month: string): string {
  const [year, monthIndex] = month.split('-').map(Number);
  if (!year || !monthIndex) return month;
  return new Date(year, monthIndex - 1, 1).toLocaleDateString('de-DE', {
    month: 'long',
    year: 'numeric',
  });
}
