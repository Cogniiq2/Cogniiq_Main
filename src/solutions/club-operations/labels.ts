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
  ActivityKind,
  BookingStatus,
  CourtKey,
  CourtSport,
  MembershipClassification,
  PaymentProvider,
  PaymentStatus,
  TaxCategory,
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
