// Club Operations internal navigation.
//
// Only sections that actually exist appear here. The reference dashboard has twelve; showing the
// other ten as dead links would be worse than showing two working ones, so they are added as they
// are built rather than stubbed out now.

import { CalendarRange, LayoutGrid, type LucideIcon } from 'lucide-react';

export const clubOperationsSectionIds = ['overview', 'bookings'] as const;
export type ClubOperationsSectionId = (typeof clubOperationsSectionIds)[number];

export interface ClubOperationsNavItem {
  id: ClubOperationsSectionId;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const clubOperationsNavItems: ClubOperationsNavItem[] = [
  {
    id: 'overview',
    label: 'Übersicht',
    description: 'Umsatz, Buchungen, Zahlungen und Umsatzsteuer auf einen Blick',
    icon: LayoutGrid,
  },
  {
    id: 'bookings',
    label: 'Buchungen',
    description: 'Alle Platzbuchungen durchsuchen und filtern',
    icon: CalendarRange,
  },
];

export const defaultClubOperationsSection: ClubOperationsSectionId = 'overview';

export function isClubOperationsSection(value: string): value is ClubOperationsSectionId {
  return (clubOperationsSectionIds as readonly string[]).includes(value);
}
