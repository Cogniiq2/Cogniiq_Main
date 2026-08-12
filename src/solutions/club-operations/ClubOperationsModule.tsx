// Club Operations — module shell.
//
// Renders *inside* whatever authenticated Cogniiq shell hosts it. It deliberately provides no
// layout chrome of its own: no sidebar, no header bar, no account menu, no organisation switcher.
// Those belong to the surrounding shell, and duplicating them would produce a second navigation
// system competing with the one the customer portal already has.
//
// Reachability: nothing in the production route tree imports this file. The solution registry
// continues to resolve `club_operations` to the shared unavailable fallback, so the module cannot
// be reached by guessing a URL. It is wired up in a later phase, together with the authenticated
// server-side gateway that will supply its data.

import { useMemo, useState } from 'react';

import { border, focusRingOnSurface, interactive, radius, space, text } from '@/components/dashboard/tokens';
import { cn } from '@/lib/utils';

import type { ClubOperationsAdapter } from './adapter/ClubOperationsAdapter';
import {
  clubOperationsNavItems,
  defaultClubOperationsSection,
  type ClubOperationsSectionId,
} from './navigation';
import { BookingsSection } from './sections/BookingsSection';
import { OverviewSection } from './sections/OverviewSection';
import type { OverviewPeriod } from './types';

export interface ClubOperationsModuleProps {
  adapter: ClubOperationsAdapter;
  /** Controlled section, for hosts that map sections onto their own routing. */
  section?: ClubOperationsSectionId;
  onSectionChange?: (section: ClubOperationsSectionId) => void;
  initialSection?: ClubOperationsSectionId;
}

export function ClubOperationsModule({
  adapter,
  section,
  onSectionChange,
  initialSection = defaultClubOperationsSection,
}: ClubOperationsModuleProps) {
  const [uncontrolled, setUncontrolled] = useState<ClubOperationsSectionId>(initialSection);
  const active = section ?? uncontrolled;

  const [period, setPeriod] = useState<OverviewPeriod>('month');

  const selectSection = useMemo(
    () => (next: ClubOperationsSectionId) => {
      if (section === undefined) setUncontrolled(next);
      onSectionChange?.(next);
    },
    [section, onSectionChange],
  );

  return (
    <div className={space.pageGap}>
      <ClubOperationsNav active={active} onSelect={selectSection} />

      {active === 'overview' ? (
        <OverviewSection adapter={adapter} period={period} onPeriodChange={setPeriod} />
      ) : null}

      {active === 'bookings' ? <BookingsSection adapter={adapter} /> : null}
    </div>
  );
}

function ClubOperationsNav({
  active,
  onSelect,
}: {
  active: ClubOperationsSectionId;
  onSelect: (section: ClubOperationsSectionId) => void;
}) {
  return (
    <nav aria-label="Vereinsbetrieb">
      <ul
        className={cn(
          'flex items-center gap-0.5 overflow-x-auto bg-[var(--cq-sunken)] p-0.5',
          border.hairline,
          radius.md,
        )}
      >
        {clubOperationsNavItems.map((item) => {
          const isActive = item.id === active;
          const Icon = item.icon;
          return (
            <li key={item.id} className="shrink-0">
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                aria-current={isActive ? 'page' : undefined}
                title={item.description}
                className={cn(
                  // 40px tall: comfortably above the 24px touch-target floor on phones.
                  'inline-flex h-10 items-center gap-1.5 px-3 text-[13px] font-medium',
                  radius.sm,
                  interactive.transition,
                  focusRingOnSurface,
                  isActive
                    ? 'bg-[var(--cq-surface)] text-[var(--cq-fg)] shadow-[0_1px_2px_rgba(16,24,40,0.06)]'
                    : 'text-[var(--cq-fg-muted)] hover:text-[var(--cq-fg)]',
                )}
              >
                <Icon size={14} aria-hidden="true" />
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
      <p className={cn('mt-2', text.hint)}>
        {clubOperationsNavItems.find((item) => item.id === active)?.description}
      </p>
    </nav>
  );
}
