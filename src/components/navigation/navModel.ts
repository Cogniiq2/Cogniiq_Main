import type { LucideIcon } from 'lucide-react';

// Shared vocabulary for the authenticated navigation rails (customer portal + internal/owner
// workspace). Deliberately presentational: `active` is resolved by the caller, so route matching,
// entitlement filtering and owner-only gating stay in each surface's own navigation module and never
// leak into the shell.

export interface SidebarNavItem {
  key: string;
  label: string;
  href: string;
  icon?: LucideIcon;
  /** Resolved by the caller from the current location. */
  active: boolean;
}

export interface SidebarNavGroup {
  id: string;
  /** Restrained section label. Omit for an unlabelled leading group. */
  label?: string;
  items: SidebarNavItem[];
}

/** Rail geometry. Expanded sits in the 260-288px band, collapsed in the 72-88px band. */
export const NAV_WIDTH_EXPANDED = 272;
export const NAV_WIDTH_COLLAPSED = 76;

/** Same easing curve the customer portal already uses for its route transitions. */
export const NAV_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const NAV_EASE_CSS = 'cubic-bezier(0.22,1,0.36,1)';

/** Common transition duration for rail width, label fade and indicator movement. */
export const NAV_DURATION_MS = 200;
