// Read-only configuration view.
//
// The reference system's settings area is a role and permission reference — it displays a matrix and
// persists nothing. That structure is reproduced here, together with a small set of illustrative
// operational values.
//
// Every value is fictional and descriptive. No URL, key, identifier, endpoint or contact address
// appears, and the domain type has no field capable of carrying one. The reference system's
// hardcoded `CURRENT_ROLE = 'superadmin'` constant is deliberately not carried over: role resolution
// belongs to the server, not to a constant in the browser.

import type { PermissionGroup, RoleDefinition, SettingsGroup, SettingsSnapshot } from '../types';

const roles: RoleDefinition[] = [
  { id: 'superadmin', label: 'Super Admin', description: 'Vollzugriff auf alle Bereiche' },
  { id: 'vorstand', label: 'Vorstand', description: 'Einsicht in Kennzahlen und Berichte' },
  { id: 'finanzadmin', label: 'Finanz Admin', description: 'Zahlungen, Rechnungen und Berichte' },
  { id: 'buchungsadmin', label: 'Buchungs Admin', description: 'Buchungen und Platzbelegung' },
  { id: 'readonly', label: 'Nur Lesen', description: 'Eingeschränkte Leseansicht' },
];

/** Which roles hold a permission. Mirrors the reference system's role model. */
function grants(...roleIds: string[]): Record<string, boolean> {
  return Object.fromEntries(roles.map((role) => [role.id, roleIds.includes(role.id)]));
}

const permissionGroups: PermissionGroup[] = [
  {
    id: 'reporting',
    label: 'Übersicht & Berichte',
    permissions: [
      { key: 'view:dashboard', label: 'Übersicht anzeigen', grants: grants('superadmin', 'vorstand', 'finanzadmin', 'buchungsadmin', 'readonly') },
      { key: 'view:reports', label: 'Berichte anzeigen', grants: grants('superadmin', 'vorstand', 'finanzadmin', 'readonly') },
      { key: 'export:reports', label: 'Berichte exportieren', grants: grants('superadmin', 'vorstand', 'finanzadmin') },
    ],
  },
  {
    id: 'bookings',
    label: 'Buchungen',
    permissions: [
      { key: 'view:bookings', label: 'Buchungen anzeigen', grants: grants('superadmin', 'vorstand', 'buchungsadmin') },
      { key: 'manage:bookings', label: 'Buchungen verwalten', grants: grants('superadmin', 'buchungsadmin') },
    ],
  },
  {
    id: 'payments',
    label: 'Zahlungen',
    permissions: [
      { key: 'view:payments', label: 'Zahlungen anzeigen', grants: grants('superadmin', 'vorstand', 'finanzadmin') },
      { key: 'view:payment_details', label: 'Zahlungsdetails anzeigen', grants: grants('superadmin', 'finanzadmin') },
      { key: 'export:payments', label: 'Zahlungen exportieren', grants: grants('superadmin', 'finanzadmin') },
      { key: 'view:vouchers', label: 'Gutscheine anzeigen', grants: grants('superadmin', 'vorstand', 'finanzadmin') },
    ],
  },
  {
    id: 'members',
    label: 'Mitglieder',
    permissions: [
      { key: 'view:members', label: 'Mitglieder anzeigen', grants: grants('superadmin') },
      { key: 'manage:members', label: 'Mitglieder verwalten', grants: grants('superadmin') },
    ],
  },
  {
    id: 'settings',
    label: 'Einstellungen',
    permissions: [
      { key: 'view:settings', label: 'Einstellungen anzeigen', grants: grants('superadmin') },
      { key: 'manage:roles', label: 'Rollen verwalten', grants: grants('superadmin') },
    ],
  },
];

const groups: SettingsGroup[] = [
  {
    id: 'club',
    label: 'Verein',
    description: 'Stammdaten des Vereinsbetriebs.',
    entries: [
      { key: 'club-name', label: 'Vereinsname', value: 'Beispielverein Tennis & Padel' },
      { key: 'courts', label: 'Plätze', value: '2 Padel, 3 Tennis' },
      { key: 'timezone', label: 'Zeitzone', value: 'Europa/Berlin' },
      { key: 'currency', label: 'Währung', value: 'Euro (EUR)' },
    ],
  },
  {
    id: 'booking',
    label: 'Buchung',
    description: 'Regeln für Platzbuchungen.',
    entries: [
      { key: 'slot-length', label: 'Buchungsraster', value: '30 Minuten' },
      { key: 'opening-hours', label: 'Buchbare Zeiten', value: '08:00 – 22:00 Uhr' },
      { key: 'lead-time', label: 'Vorlaufzeit', value: 'Bis 60 Minuten vor Beginn' },
      { key: 'cancellation', label: 'Stornofrist', value: '24 Stunden vor Beginn', hint: 'Danach ist keine Erstattung vorgesehen.' },
    ],
  },
  {
    id: 'tax',
    label: 'Umsatzsteuer',
    description: 'Steuerliche Behandlung der Platzmiete.',
    entries: [
      { key: 'padel-member', label: 'Padel, Mitglieder', value: '7 % ermäßigt' },
      { key: 'padel-non-member', label: 'Padel, Nichtmitglieder', value: '19 % Regelsatz' },
      { key: 'tennis', label: 'Tennis', value: '0 % steuerfrei' },
      { key: 'unresolved', label: 'Ungeklärte Mitgliedschaft', value: 'Manuelle Prüfung', hint: 'Buchungen bleiben offen, bis die Mitgliedschaft geklärt ist.' },
    ],
  },
  {
    id: 'payments',
    label: 'Zahlungswege',
    description: 'Angebotene Zahlungsarten.',
    entries: [
      { key: 'card', label: 'Kartenzahlung', value: 'Aktiv' },
      { key: 'wallet', label: 'Online-Wallet', value: 'Aktiv' },
      { key: 'voucher', label: 'Gutscheine', value: 'Aktiv' },
      { key: 'free', label: 'Kostenlose Buchungen', value: 'Für berechtigte Gruppen aktiv' },
    ],
  },
  {
    id: 'operations',
    label: 'Betrieb',
    description: 'Automatisierungen rund um den Platzbetrieb.',
    entries: [
      { key: 'floodlight', label: 'Flutlicht', value: 'Automatisch zur Buchung' },
      { key: 'floodlight-buffer', label: 'Vorlauf Flutlicht', value: '5 Minuten vor Buchungsbeginn' },
      { key: 'calendar', label: 'Kalenderabgleich', value: 'Aktiv' },
      { key: 'notifications', label: 'Benachrichtigungen', value: 'Bestätigung und Erinnerung' },
    ],
  },
];

export const fixtureSettings: SettingsSnapshot = { groups, roles, permissionGroups };
