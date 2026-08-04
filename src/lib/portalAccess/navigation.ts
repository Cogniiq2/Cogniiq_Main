// Capability-derived customer navigation.
//
// The sidebar is a pure function of (enabled solutions, effective capabilities). There is no
// per-customer branch anywhere in this file: no organization id, no organization name comparison,
// no hard-coded email. A customer sees an item because their capabilities say so, full stop.

import { CreditCard, FileText, Headphones, LayoutGrid, Settings, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { buildSolutionNavHref, resolveImplementation } from '@/lib/solutions/registry';
import type { PortalSolution } from '@/lib/portalAccess/types';

export interface PortalNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Every listed capability must be held. Empty means the item is always available. */
  requiredCapabilities: readonly string[];
}

export interface PortalNavGroup {
  id: string;
  label: string;
  items: PortalNavItem[];
}

/**
 * The universal portal group. Each entry declares the capability it needs; the baseline grants all
 * of them, so an existing customer with no functional role sees exactly the same six items as
 * before this feature existed.
 *
 * Settings is deliberately capability-free: managing your own profile is not an organization
 * permission, and gating it would strand a member who holds a narrow functional role.
 */
export const UNIVERSAL_NAV_ITEMS: readonly PortalNavItem[] = [
  { label: 'Übersicht', href: '/app', icon: LayoutGrid, requiredCapabilities: ['portal.overview.view'] },
  { label: 'Dokumente', href: '/app/documents', icon: FileText, requiredCapabilities: ['portal.documents.view'] },
  { label: 'Abrechnung', href: '/app/billing', icon: CreditCard, requiredCapabilities: ['portal.billing.view'] },
  { label: 'Meine Lösungen', href: '/app/solutions', icon: Headphones, requiredCapabilities: [] },
  { label: 'Support', href: '/app/support', icon: UserRound, requiredCapabilities: ['portal.support.view_own'] },
  { label: 'Einstellungen', href: '/app/settings', icon: Settings, requiredCapabilities: [] },
];

/** Solution statuses whose navigation is shown at all. Disabled instances never appear. */
const VISIBLE_SOLUTION_STATUSES = new Set(['provisioning', 'active', 'paused']);

export interface BuildNavOptions {
  solutions: readonly PortalSolution[];
  hasEveryCapability: (keys: readonly string[]) => boolean;
}

/**
 * Builds the customer navigation from the enabled solutions plus the effective capabilities.
 *
 * While the access context is still loading, `hasEveryCapability` returns false for everything, so
 * this returns only the capability-free entries — there is no window in which a restricted item is
 * briefly visible.
 */
export function buildPortalNavigation({ solutions, hasEveryCapability }: BuildNavOptions): PortalNavGroup[] {
  const universal: PortalNavGroup = {
    id: 'portal',
    label: 'Portal',
    items: UNIVERSAL_NAV_ITEMS.filter((item) => hasEveryCapability(item.requiredCapabilities)),
  };

  const productGroups = solutions
    .filter((solution) => VISIBLE_SOLUTION_STATUSES.has(solution.status))
    .flatMap((solution) => {
      const implementation = resolveImplementation(solution.implementation_key);
      return implementation.navGroups.map<PortalNavGroup>((group) => ({
        id: `${solution.id}-${group.id}`,
        label: solution.display_name,
        items: group.items.map((item) => ({
          label: item.label,
          href: buildSolutionNavHref(solution.instance_key, item),
          icon: item.icon,
          requiredCapabilities: [],
        })),
      }));
    });

  return [universal, ...productGroups].filter((group) => group.items.length > 0);
}
