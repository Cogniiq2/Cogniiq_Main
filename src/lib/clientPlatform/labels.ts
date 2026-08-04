// Centralized German presentation labels for the CRM vocabulary.
//
// The stored enum values are the contract with the database and are NEVER changed here:
// every map below is keyed by the exact literal that PostgREST returns and that filters,
// payloads and RLS policies compare against. This module only decides how those values
// are *spelled to a human*, which is why it lives next to the types rather than inside a
// page.
//
// Rule enforced by `src/lib/clientPlatform/labels.test.ts`: a raw enum value must never
// reach the screen. If a new value is added to one of the unions in `./types`, the
// exhaustive `Record<Union, string>` typing below fails the build until it is given a
// German label.

import type {
  ClientLifecycleStatus,
  EngagementStatus,
  ImplementationKey,
  InvitationStatus,
  OrganizationRole,
  OrganizationSolutionStatus,
  SolutionCatalogKey,
} from './types';

export const clientLifecycleStatusLabels: Record<ClientLifecycleStatus, string> = {
  lead: 'Interessent',
  qualified: 'Qualifiziert',
  active: 'Aktiv',
  paused: 'Pausiert',
  churned: 'Abgesprungen',
  archived: 'Archiviert',
};

export const engagementStatusLabels: Record<EngagementStatus, string> = {
  draft: 'Entwurf',
  active: 'Aktiv',
  paused: 'Pausiert',
  completed: 'Abgeschlossen',
  cancelled: 'Storniert',
};

export const invitationStatusLabels: Record<InvitationStatus, string> = {
  pending: 'Einladung offen',
  accepted: 'Zugang aktiv',
  revoked: 'Zurückgezogen',
  expired: 'Abgelaufen',
};

export const organizationSolutionStatusLabels: Record<OrganizationSolutionStatus, string> = {
  provisioning: 'Wird eingerichtet',
  active: 'Aktiv',
  paused: 'Pausiert',
  disabled: 'Deaktiviert',
};

export const solutionCatalogKeyLabels: Record<SolutionCatalogKey, string> = {
  ai_receptionist: 'KI-Telefonassistent',
  automation_workspace: 'Prozessautomatisierung',
  custom_client_portal: 'Kundenportal',
  website_management: 'Website-Betreuung',
};

export const implementationKeyLabels: Record<ImplementationKey, string> = {
  ai_receptionist: 'KI-Telefonassistent',
  automation_workspace: 'Prozessautomatisierung',
  pankofer_operations: 'Pankofer Betrieb',
  unavailable: 'Nicht verfügbar',
};

export const organizationRoleLabels: Record<OrganizationRole, string> = {
  owner: 'Inhaber',
  admin: 'Administrator',
  member: 'Mitglied',
  viewer: 'Leseberechtigt',
};

/**
 * Look a value up in one of the maps above.
 *
 * Data arriving from PostgREST is typed but not validated, so an unrecognised value is
 * possible in principle. It is rendered as a neutral placeholder rather than as the raw
 * enum: a user should never see `attention_needed` on screen, and an em dash is a more
 * honest answer than a database token.
 */
function lookup<T extends string>(map: Record<T, string>, value: string | null | undefined): string {
  if (!value) return '—';
  return (map as Record<string, string>)[value] ?? '—';
}

export const clientLifecycleStatusLabel = (v: string | null | undefined) => lookup(clientLifecycleStatusLabels, v);
export const engagementStatusLabel = (v: string | null | undefined) => lookup(engagementStatusLabels, v);
export const invitationStatusLabel = (v: string | null | undefined) => lookup(invitationStatusLabels, v);
export const organizationSolutionStatusLabel = (v: string | null | undefined) => lookup(organizationSolutionStatusLabels, v);
export const solutionCatalogKeyLabel = (v: string | null | undefined) => lookup(solutionCatalogKeyLabels, v);
export const implementationKeyLabel = (v: string | null | undefined) => lookup(implementationKeyLabels, v);
export const organizationRoleLabel = (v: string | null | undefined) => lookup(organizationRoleLabels, v);

/**
 * Every raw enum token that must never appear as rendered text in the CRM UI.
 * Consumed by the falsification test so the list cannot drift from the type unions.
 */
export const rawCrmEnumValues: readonly string[] = [
  ...Object.keys(clientLifecycleStatusLabels),
  ...Object.keys(engagementStatusLabels),
  ...Object.keys(invitationStatusLabels),
  ...Object.keys(organizationSolutionStatusLabels),
  ...Object.keys(solutionCatalogKeyLabels),
];
