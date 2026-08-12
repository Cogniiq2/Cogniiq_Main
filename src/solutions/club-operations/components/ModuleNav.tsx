// The module's internal navigation.
//
// Twelve entries is too many for a flat strip at any width, so the entries stay grouped the way the
// work divides: Betrieb, Finanzen, Auswertung, Verwaltung. The group labels are rendered — the
// previous version grouped the buttons but printed no group names, which produced separators the
// reader had to reverse-engineer.
//
// Width behaviour:
//   < 640px  one horizontally scrolling row of icon+label buttons, with the group labels dropped.
//            Twelve entries wrapped into a block at 320px pushed the content itself below the fold.
//   >= 640px labelled groups that wrap, so nothing is ever hidden behind a scroll on a screen with
//            room for it.
//
// The active entry carries a badge count where its section has one, so the reader can see there are
// four overdue invoices without opening Rechnungen.
//
// Active state is a button-local layer, not a shared measured overlay. An earlier version painted
// one absolutely-positioned "rail" behind whichever button was active, sized by JS from
// getBoundingClientRect. That broke the moment the strip wrapped onto multiple rows (>= 640px, once
// the twelve entries don't fit one line): the rail was positioned with `top-0 bottom-0` against the
// *whole* multi-row container, so its height always spanned every row rather than just the active
// button's row — at 1024px it measured 116px tall against a 36px button, visually swallowing
// whichever buttons in the other rows happened to sit at the same horizontal offset. A button-local
// layer cannot have that failure mode: it is never positioned or sized relative to anything but the
// button that owns it, so it is correct at every width, every scroll offset, mid-resize and on every
// section change without any measurement at all.

import { focusRingOnSurface, radius, text } from '@/components/dashboard/tokens';
import { cn } from '@/lib/utils';

import { feedback } from '../motion';
import { clubOperationsNavGroups, type ClubOperationsSectionId } from '../navigation';

export function ModuleNav({
  active,
  onSelect,
  badges,
}: {
  active: ClubOperationsSectionId;
  onSelect: (section: ClubOperationsSectionId) => void;
  /** Per-section counts worth surfacing on the navigation itself. Zero and absent both hide it. */
  badges?: Partial<Record<ClubOperationsSectionId, number>>;
}) {
  return (
    <nav aria-label="Vereinsbetrieb">
      <div className="flex items-stretch gap-1 overflow-x-auto sm:flex-wrap sm:gap-x-2 sm:overflow-x-visible">
        {clubOperationsNavGroups.map((group, groupIndex) => (
          <div key={group.id} className="flex shrink-0 items-center gap-1">
            {groupIndex > 0 ? (
              <span
                aria-hidden="true"
                className="mx-1 hidden h-5 w-px shrink-0 bg-[var(--cq-border)] sm:block"
              />
            ) : null}

            <span className={cn('hidden shrink-0 pl-1 pr-1.5 lg:inline', text.eyebrow)}>
              {group.label}
            </span>

            <ul className="flex items-center gap-1" aria-label={group.label}>
              {group.items.map((item) => {
                const isActive = item.id === active;
                const Icon = item.icon;
                const badge = badges?.[item.id] ?? 0;
                return (
                  <li key={item.id} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => onSelect(item.id)}
                      aria-current={isActive ? 'page' : undefined}
                      title={item.description}
                      className={cn(
                        // 36px tall: comfortably above the touch-target floor on phones. `border`
                        // is unconditional — only its colour toggles — so the box never resizes
                        // by the border's own width when active state changes.
                        'relative inline-flex h-9 items-center gap-1.5 whitespace-nowrap border px-2.5 text-[13px] font-medium',
                        radius.sm,
                        feedback,
                        focusRingOnSurface,
                        isActive
                          ? cn(
                              'border-[var(--cq-border)] bg-[var(--cq-surface)] text-[var(--cq-fg)]',
                              'shadow-[0_1px_2px_rgba(16,24,40,0.07)]',
                            )
                          : cn(
                              'border-transparent text-[var(--cq-fg-muted)]',
                              'hover:border-[var(--cq-border-subtle)] hover:bg-[var(--cq-hover)] hover:text-[var(--cq-fg)]',
                            ),
                      )}
                    >
                      <Icon size={14} aria-hidden="true" className="shrink-0" />
                      {/* Marked so the entry's own name stays separable from its badge count —
                          the shell test asserts the exact set of section labels. */}
                      <span data-nav-label>{item.label}</span>
                      {badge > 0 ? (
                        <span
                          className={cn(
                            'ml-0.5 inline-flex h-4 min-w-[16px] items-center justify-center px-1 text-[10.5px] font-semibold leading-none tabular-nums',
                            radius.full,
                            isActive
                              ? 'bg-[var(--cq-fg)] text-white'
                              : 'bg-[var(--cq-border)] text-[var(--cq-fg-muted)]',
                          )}
                          aria-label={`${badge} offen`}
                        >
                          {badge}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
