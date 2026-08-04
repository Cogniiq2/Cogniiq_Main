// The capability vocabulary, mirrored from the database catalog.
//
// The DATABASE is the authority: hiding a navigation item or a button here is a usability
// decision, never a security boundary. Every capability listed below also exists in
// supabase/migrations/20260804120000_reusable_capability_authorization.sql, and every backend
// path re-checks authorization independently of anything the browser believes.
//
// Unknown capability keys fail CLOSED — see `hasCapability` in PortalAccessContext.

export const PORTAL_CAPABILITIES = [
  'portal.overview.view',
  'portal.projects.view',
  'portal.documents.view',
  'portal.billing.view',
  'portal.support.create',
  'portal.support.view_own',
] as const;

export const SVH_CAPABILITIES = [
  'svh.dashboard.view',
  'svh.bookings.view',
  'svh.bookings.manage',
  'svh.members.view',
  'svh.members.manage',
  'svh.members.applications_review',
  'svh.members.numbers_assign',
  'svh.finance.view',
  'svh.finance.manage',
  'svh.facilities.view',
  'svh.facilities.manage',
  'svh.devices.view',
  'svh.devices.manage',
] as const;

export const KNOWN_CAPABILITIES = [...PORTAL_CAPABILITIES, ...SVH_CAPABILITIES] as const;

export type PortalCapability = (typeof PORTAL_CAPABILITIES)[number];
export type SvhCapability = (typeof SVH_CAPABILITIES)[number];
export type CapabilityKey = (typeof KNOWN_CAPABILITIES)[number];

const KNOWN_CAPABILITY_SET: ReadonlySet<string> = new Set(KNOWN_CAPABILITIES);

/**
 * Whether a key is part of the vocabulary this build knows about.
 *
 * A key the frontend does not know cannot be reasoned about, so it is never treated as granted.
 * This is what makes an unknown capability fail closed rather than open.
 */
export function isKnownCapability(key: string): key is CapabilityKey {
  return KNOWN_CAPABILITY_SET.has(key);
}

/**
 * The general-portal baseline, mirroring public.portal_baseline_capability_keys().
 *
 * Every active membership without a functional role holds exactly this set, which is what keeps
 * existing customers working unchanged after functional roles are introduced.
 */
export const BASELINE_CAPABILITIES: readonly PortalCapability[] = PORTAL_CAPABILITIES;

/** Human-readable German labels, mirroring the catalog's `label` column. */
export const CAPABILITY_LABELS: Record<CapabilityKey, string> = {
  'portal.overview.view': 'Portal-Übersicht ansehen',
  'portal.projects.view': 'Projekte ansehen',
  'portal.documents.view': 'Dokumente ansehen',
  'portal.billing.view': 'Abrechnung ansehen',
  'portal.support.create': 'Supportanfrage erstellen',
  'portal.support.view_own': 'Eigene Supportanfragen',
  'svh.dashboard.view': 'Vereins-Dashboard',
  'svh.bookings.view': 'Buchungen ansehen',
  'svh.bookings.manage': 'Buchungen verwalten',
  'svh.members.view': 'Mitglieder ansehen',
  'svh.members.manage': 'Mitglieder verwalten',
  'svh.members.applications_review': 'Aufnahmeanträge prüfen',
  'svh.members.numbers_assign': 'Mitgliedsnummern vergeben',
  'svh.finance.view': 'Finanzen ansehen',
  'svh.finance.manage': 'Finanzen verwalten',
  'svh.facilities.view': 'Anlagen ansehen',
  'svh.facilities.manage': 'Anlagen verwalten',
  'svh.devices.view': 'Geräte ansehen',
  'svh.devices.manage': 'Geräte verwalten',
};

export function capabilityLabel(key: string): string {
  return isKnownCapability(key) ? CAPABILITY_LABELS[key] : key;
}

/**
 * The catalog key a capability is bound to, mirroring capabilities.solution_catalog_key.
 * `null` means a general portal capability that no solution gates.
 */
export function capabilitySolutionCatalogKey(key: string): string | null {
  return key.startsWith('svh.') ? 'sports_club_operations' : null;
}

/**
 * The reusable sports-club role presets, mirroring public.apply_sports_club_role_presets().
 *
 * Documented here so the capability matrix is reviewable in one place and so the admin UI can
 * explain what a preset role grants. Nothing in this file assigns anything to anyone.
 */
export interface RolePreset {
  roleKey: string;
  label: string;
  description: string;
  capabilities: readonly CapabilityKey[];
}

export const SPORTS_CLUB_ROLE_PRESETS: readonly RolePreset[] = [
  {
    roleKey: 'vorstand',
    label: 'Vorstand',
    description: 'Vollzugriff auf alle Bereiche der Vereinsverwaltung.',
    capabilities: [...BASELINE_CAPABILITIES, ...SVH_CAPABILITIES],
  },
  {
    roleKey: 'mitgliederverwaltung',
    label: 'Mitgliederverwaltung',
    description: 'Mitglieder pflegen, Aufnahmeanträge prüfen und Mitgliedsnummern vergeben.',
    capabilities: [
      ...BASELINE_CAPABILITIES,
      'svh.dashboard.view',
      'svh.members.view',
      'svh.members.manage',
      'svh.members.applications_review',
      'svh.members.numbers_assign',
    ],
  },
  {
    roleKey: 'kassenwart',
    label: 'Kassenwart',
    description: 'Beiträge und Finanzen verwalten, Mitglieder lesend einsehen.',
    capabilities: [
      ...BASELINE_CAPABILITIES,
      'svh.dashboard.view',
      'svh.finance.view',
      'svh.finance.manage',
      'svh.members.view',
    ],
  },
  {
    roleKey: 'buchungsverwaltung',
    label: 'Buchungsverwaltung',
    description: 'Belegungen und Buchungen verwalten, Anlagen lesend einsehen.',
    capabilities: [
      ...BASELINE_CAPABILITIES,
      'svh.dashboard.view',
      'svh.bookings.view',
      'svh.bookings.manage',
      'svh.facilities.view',
    ],
  },
  {
    roleKey: 'anlagenverwaltung',
    label: 'Anlagenverwaltung',
    description: 'Sportanlagen, Räume und technische Geräte verwalten.',
    capabilities: [
      ...BASELINE_CAPABILITIES,
      'svh.dashboard.view',
      'svh.facilities.view',
      'svh.facilities.manage',
      'svh.devices.view',
      'svh.devices.manage',
    ],
  },
  {
    roleKey: 'lesender_administrator',
    label: 'Lesender Administrator',
    description: 'Vollständiger Lesezugriff ohne jede Änderungsberechtigung.',
    capabilities: [
      ...BASELINE_CAPABILITIES,
      'svh.dashboard.view',
      'svh.bookings.view',
      'svh.members.view',
      'svh.finance.view',
      'svh.facilities.view',
      'svh.devices.view',
    ],
  },
];
