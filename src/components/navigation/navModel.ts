import type { LucideIcon } from 'lucide-react';

// Shared vocabulary for the authenticated navigation rails (customer portal + internal/owner
// workspace). Deliberately presentational: `active` is resolved by the caller, so route matching,
// entitlement filtering and owner-only gating stay in each surface's own navigation module and never
// leak into the shell.

/**
 * Which aria-current value an active item announces.
 *
 * 'page' is the destination the user is actually on. 'true' marks an ancestor — a module item that
 * merely *contains* the current page. Exactly one link per rendered navigation landmark may be
 * 'page', so a shell that renders both a module switch and that module's sub-navigation must
 * downgrade the module item to 'true'.
 */
export type SidebarNavCurrent = 'page' | 'true';

export interface SidebarNavItem {
  key: string;
  label: string;
  href: string;
  icon?: LucideIcon;
  /** Resolved by the caller from the current location. */
  active: boolean;
  /** aria-current to announce while active. Defaults to 'page' (a leaf destination). */
  current?: SidebarNavCurrent;
}

export interface SidebarNavGroup {
  id: string;
  /** Restrained section label. Omit for an unlabelled leading group. */
  label?: string;
  items: SidebarNavItem[];
}

/**
 * Enforces the "one current page per rail" rule for navigation whose entries can nest.
 *
 * When several items match the location (a customer solution lives under /app/solutions/<key>/...,
 * so the universal "Meine Lösungen" entry matches it too) every match still highlights, but only
 * the deepest one is the current *page*; shallower matches are containing sections and announce
 * 'true'. Items are left untouched when at most one is active.
 *
 * Rails whose groups are structurally layered (a module switch plus that module's sub-navigation)
 * should set `current` explicitly instead — their hrefs can be equal, so depth cannot rank them.
 */
export function resolveAriaCurrent(groups: SidebarNavGroup[]): SidebarNavGroup[] {
  const activeCount = groups.reduce(
    (total, group) => total + group.items.filter((item) => item.active).length,
    0,
  );
  if (activeCount < 2) return groups;

  let deepest: SidebarNavItem | null = null;
  for (const group of groups) {
    for (const item of group.items) {
      if (item.active && (!deepest || item.href.length > deepest.href.length)) deepest = item;
    }
  }

  return groups.map((group) => ({
    ...group,
    items: group.items.map((item) =>
      item.active ? { ...item, current: item === deepest ? ('page' as const) : ('true' as const) } : item,
    ),
  }));
}

/** Rail geometry. Expanded sits in the 260-288px band, collapsed in the 72-88px band. */
export const NAV_WIDTH_EXPANDED = 272;
export const NAV_WIDTH_COLLAPSED = 76;

/** Same easing curve the customer portal already uses for its route transitions. */
export const NAV_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const NAV_EASE_CSS = 'cubic-bezier(0.22,1,0.36,1)';

/** Common transition duration for rail width, label fade and indicator movement. */
export const NAV_DURATION_MS = 200;
