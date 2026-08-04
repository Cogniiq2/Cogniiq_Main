// Shared German labels + badge tones for owner customer management, plus the derived offer
// display-state (Active / Archived / Cancelled) used by the offer list and detail. Keeping these
// in one place ensures the overview, detail page and offer views stay consistent.

import type { BadgeTone } from '@/components/dashboard';
import type {
  OwnerCustomerStatus, OwnerCustomerTaskStatus, OwnerCustomerTaskPriority, OwnerOffer,
} from '@/lib/ownerFinance/types';

export const customerStatusLabel: Record<OwnerCustomerStatus, string> = {
  active: 'Aktiv', waiting: 'Wartend', completed: 'Abgeschlossen', archived: 'Archiviert',
};
export const customerStatusTone: Record<OwnerCustomerStatus, BadgeTone> = {
  active: 'success', waiting: 'warning', completed: 'info', archived: 'neutral',
};

export const taskStatusLabel: Record<OwnerCustomerTaskStatus, string> = {
  open: 'Offen', in_progress: 'In Bearbeitung', completed: 'Erledigt', cancelled: 'Abgebrochen',
};
export const taskStatusTone: Record<OwnerCustomerTaskStatus, BadgeTone> = {
  open: 'neutral', in_progress: 'info', completed: 'success', cancelled: 'neutral',
};

export const taskPriorityLabel: Record<OwnerCustomerTaskPriority, string> = {
  low: 'Niedrig', normal: 'Normal', high: 'Hoch', urgent: 'Dringend',
};
export const taskPriorityTone: Record<OwnerCustomerTaskPriority, BadgeTone> = {
  low: 'neutral', normal: 'neutral', high: 'warning', urgent: 'danger',
};

export const offerStatusLabel: Record<string, string> = {
  draft: 'Entwurf', finalized: 'Finalisiert', sent: 'Versendet', viewed: 'Angesehen',
  accepted: 'Angenommen', rejected: 'Abgelehnt', expired: 'Abgelaufen', cancelled: 'Storniert', converted: 'Umgewandelt',
};
export const offerStatusTone: Record<string, BadgeTone> = {
  draft: 'neutral', finalized: 'info', sent: 'info', viewed: 'warning',
  accepted: 'success', rejected: 'danger', expired: 'warning', cancelled: 'neutral', converted: 'success',
};

export const invoiceStatusLabel: Record<string, string> = {
  draft: 'Entwurf', issued: 'Gestellt', partially_paid: 'Teilbezahlt', paid: 'Bezahlt',
  overdue: 'Überfällig', void: 'Storniert', cancelled: 'Storniert', credited: 'Gutgeschrieben',
};
export const invoiceStatusTone: Record<string, BadgeTone> = {
  draft: 'neutral', issued: 'info', partially_paid: 'warning', paid: 'success',
  overdue: 'danger', void: 'neutral', cancelled: 'neutral', credited: 'neutral',
};

export const automationJobStatusLabel: Record<string, string> = {
  queued: 'In Warteschlange', scheduled: 'Geplant', running: 'Wird ausgeführt',
  sent: 'Versendet', succeeded: 'Erfolgreich', completed: 'Abgeschlossen',
  failed: 'Fehlgeschlagen', cancelled: 'Abgebrochen',
};

export const assetStatusLabel: Record<string, string> = {
  active: 'Aktiv', disposed: 'Veräußert', written_off: 'Abgeschrieben',
};

export const expensePaymentStatusLabel: Record<string, string> = {
  unpaid: 'Offen', partially_paid: 'Teilbezahlt', paid: 'Bezahlt', void: 'Storniert',
};

export const expenseReviewStatusLabel: Record<string, string> = {
  pending: 'Prüfung offen', reviewed: 'Geprüft', needs_info: 'Rückfrage offen',
};

/**
 * Resolve a stored status to its German label.
 *
 * Deliberately does NOT fall back to the raw value. `?? status` was the exact hole through
 * which `partially_paid` and `needs_info` reached the screen: a value missing from the map
 * is a gap in this file, and an em dash makes that gap visible without showing a database
 * token to the user. The stored value itself is never touched.
 */
export function statusText(map: Record<string, string>, status: string | null | undefined): string {
  if (!status) return '—';
  return map[status] ?? '—';
}

export const offerStatusText = (status: string | null | undefined) => statusText(offerStatusLabel, status);
export const invoiceStatusText = (status: string | null | undefined) => statusText(invoiceStatusLabel, status);
export const automationJobStatusText = (status: string | null | undefined) => statusText(automationJobStatusLabel, status);
export const assetStatusText = (status: string | null | undefined) => statusText(assetStatusLabel, status);

export type OfferDisplayState = 'active' | 'archived' | 'cancelled';

/** Derived, customer-facing offer state. Archiving is a flag layered over the legal status. */
export function offerDisplayState(offer: Pick<OwnerOffer, 'status' | 'archived_at'>): OfferDisplayState {
  if (offer.archived_at) return 'archived';
  if (offer.status === 'cancelled') return 'cancelled';
  return 'active';
}

export const offerDisplayStateLabel: Record<OfferDisplayState, string> = {
  active: 'Aktiv', archived: 'Archiviert', cancelled: 'Storniert',
};
export const offerDisplayStateTone: Record<OfferDisplayState, BadgeTone> = {
  active: 'success', archived: 'neutral', cancelled: 'neutral',
};

/** Best display name for a customer, falling back through the identity fields. */
export function customerDisplayName(c: { company?: string | null; contact_name?: string | null; email?: string | null }): string {
  return (c.company?.trim() || c.contact_name?.trim() || c.email?.trim() || 'Unbenannter Kunde');
}
