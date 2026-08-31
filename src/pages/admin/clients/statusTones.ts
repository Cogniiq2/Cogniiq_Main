// Status tone mapping for the client-platform CRM.
//
// DOMAIN knowledge, not styling: which lifecycle state reads as a warning and which reads as a
// failure is a product judgement, and it must be the same judgement wherever a status is shown.
// Keeping it in a plain module (rather than beside the components that happen to render it) is
// what lets the migrated list pages and the not-yet-migrated detail page share one answer.
//
// Typed against the dashboard's BadgeTone so a tone that does not exist cannot be named.
import type { BadgeTone } from '@/components/dashboard';

export const lifecycleTone: Record<string, BadgeTone> = {
  lead: 'neutral',
  qualified: 'info',
  active: 'success',
  paused: 'warning',
  churned: 'danger',
  archived: 'neutral',
};

/** German labels for the lifecycle states, which are stored as English enum values. */
export const lifecycleLabel: Record<string, string> = {
  lead: 'Lead',
  qualified: 'Qualifiziert',
  active: 'Aktiv',
  paused: 'Pausiert',
  churned: 'Abgesprungen',
  archived: 'Archiviert',
};

export const solutionTone: Record<string, BadgeTone> = {
  active: 'success',
  provisioning: 'info',
  paused: 'warning',
  disabled: 'neutral',
};

export const solutionLabel: Record<string, string> = {
  active: 'Aktiv',
  provisioning: 'Wird bereitgestellt',
  paused: 'Pausiert',
  disabled: 'Deaktiviert',
};

export const invitationTone: Record<string, BadgeTone> = {
  pending: 'warning',
  accepted: 'success',
  revoked: 'danger',
  expired: 'neutral',
};

export const invitationLabel: Record<string, string> = {
  pending: 'Offen',
  accepted: 'Angenommen',
  revoked: 'Widerrufen',
  expired: 'Abgelaufen',
};

/** Catalogue keys are snake_case identifiers; this is what a human reads instead. */
export const solutionCatalogLabel: Record<string, string> = {
  ai_receptionist: 'KI-Telefonassistent',
  automation_workspace: 'Automatisierung',
  club_operations: 'Vereinsverwaltung',
  custom_client_portal: 'Eigenes Kundenportal',
  website_management: 'Website-Betreuung',
};

export function catalogLabel(key: string): string {
  return solutionCatalogLabel[key] ?? key.replace(/_/g, ' ');
}
