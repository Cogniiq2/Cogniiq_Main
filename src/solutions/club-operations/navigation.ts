// Club Operations internal navigation.
//
// Only sections that actually exist appear here — every entry opens an implemented, fixture-backed
// section. Twelve entries is too many for a flat strip, so they are grouped the way the work
// actually divides: what happened, what it cost, and how the club is run.
//
// The surrounding Cogniiq shell owns the global navigation; this is strictly the module's own.

import {
  Activity,
  BadgeEuro,
  BarChart3,
  Bell,
  CalendarRange,
  FileText,
  Gift,
  LayoutGrid,
  Receipt,
  ScanLine,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react';

// The id list itself lives in `types.ts`: the attention model names a drill-down target, and a pure
// domain type must not drag these icon components behind it.
import { clubOperationsSectionIds, type ClubOperationsSectionId } from './types';

export { clubOperationsSectionIds };
export type { ClubOperationsSectionId };

export interface ClubOperationsNavItem {
  id: ClubOperationsSectionId;
  label: string;
  /** Long form, used as the accessible description and in the section header. */
  description: string;
  /** One or two words, shown under the module header as orientation. */
  short: string;
  icon: LucideIcon;
}

export interface ClubOperationsNavGroup {
  id: string;
  label: string;
  items: ClubOperationsNavItem[];
}

export const clubOperationsNavGroups: ClubOperationsNavGroup[] = [
  {
    id: 'operations',
    label: 'Betrieb',
    items: [
      { id: 'overview', label: 'Übersicht', short: 'Lagebild', description: 'Umsatz, Buchungen, Zahlungen und Umsatzsteuer auf einen Blick', icon: LayoutGrid },
      { id: 'bookings', label: 'Buchungen', short: 'Platzbelegung', description: 'Alle Platzbuchungen durchsuchen und filtern', icon: CalendarRange },
      { id: 'alerts', label: 'Alert Center', short: 'Triage', description: 'Offene Probleme und Auffälligkeiten im Betrieb', icon: Bell },
    ],
  },
  {
    id: 'finance',
    label: 'Finanzen',
    items: [
      { id: 'payments', label: 'Zahlungen', short: 'Zahlungseingang', description: 'Zahlungseingänge, Erstattungen und Zahlungswege', icon: BadgeEuro },
      { id: 'invoices', label: 'Rechnungen', short: 'Forderungen', description: 'Rechnungsstellung, Zahlungsstatus und offene Beträge', icon: Receipt },
      { id: 'reconciliation', label: 'Zahlungsabgleich', short: 'Abweichungen', description: 'Zahlungen gegen Buchungen prüfen und Abweichungen erkennen', icon: ScanLine },
      { id: 'vouchers', label: 'Gutscheine', short: 'Restguthaben', description: 'Ausgabe, Restguthaben und Einlösungen', icon: Gift },
    ],
  },
  {
    id: 'analysis',
    label: 'Auswertung',
    items: [
      { id: 'reports', label: 'Berichte', short: 'Zeitraum', description: 'Finanzbericht für einen frei wählbaren Zeitraum', icon: BarChart3 },
      { id: 'monthly-reports', label: 'Monatsberichte', short: 'Monatsabschluss', description: 'Monatsabschlüsse mit Vergleich zum Vormonat', icon: FileText },
      { id: 'activity', label: 'Aktivitätsprotokoll', short: 'Historie', description: 'Nachvollziehbare Historie aller Vorgänge', icon: Activity },
    ],
  },
  {
    id: 'administration',
    label: 'Verwaltung',
    items: [
      { id: 'members', label: 'Mitglieder', short: 'Verzeichnis', description: 'Mitgliederverzeichnis und steuerliche Einstufung', icon: Users },
      { id: 'settings', label: 'Einstellungen', short: 'Konfiguration', description: 'Konfiguration und Rollenberechtigungen', icon: Settings },
    ],
  },
];

export const clubOperationsNavItems: ClubOperationsNavItem[] = clubOperationsNavGroups.flatMap(
  (group) => group.items,
);

export const defaultClubOperationsSection: ClubOperationsSectionId = 'overview';

export function isClubOperationsSection(value: string): value is ClubOperationsSectionId {
  return (clubOperationsSectionIds as readonly string[]).includes(value);
}

export function navItemFor(id: ClubOperationsSectionId): ClubOperationsNavItem {
  const item = clubOperationsNavItems.find((entry) => entry.id === id);
  if (!item) throw new Error(`Unknown Club Operations section: ${id}`);
  return item;
}
