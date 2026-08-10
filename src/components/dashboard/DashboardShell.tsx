import { useMemo, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

import { PremiumShell, type ShellNavGroup } from '@/components/shell';
import { useAuth } from '@/contexts/AuthContext';

// The Owner / internal workspace shell. It renders the SAME premium vertical sidebar system as the
// customer portal (see components/shell/PremiumShell) while keeping its own, entirely separate
// navigation model: the top-level area switch and the active module's sub-navigation become two
// grouped sections of one vertical sidebar.
//
// The public props are unchanged, so every /admin/* module keeps mounting the shell exactly as
// before; the owner-only filtering still happens in internalNavigation.ts and remains backed by
// PlatformOwnerRoute + RLS.

export interface ShellSection {
  key: string;
  label: string;
  href: string;
  icon?: LucideIcon;
  /** true when the current location belongs to this top-level section */
  active: boolean;
  /** owner-only sections are marked so callers can gate them; the shell itself renders what it's given */
  ownerOnly?: boolean;
}

export interface ShellSubNavItem {
  key: string;
  label: string;
  href: string;
  icon?: LucideIcon;
}

export function DashboardShell({
  sections,
  subNav,
  subNavLabel,
  activeSubKey,
  title,
  loading,
  children,
}: {
  sections: ShellSection[];
  subNav?: ShellSubNavItem[];
  subNavLabel?: string;
  activeSubKey?: (pathname: string, href: string) => boolean;
  title?: string;
  /** Renders navigation skeletons instead of items, without shifting the layout. */
  loading?: boolean;
  children: ReactNode;
}) {
  const { pathname } = useLocation();
  const { profile, user, signOut } = useAuth();

  const isSubActive = (href: string) =>
    activeSubKey ? activeSubKey(pathname, href) : pathname === href || pathname.startsWith(`${href}/`);

  const groups = useMemo<ShellNavGroup[]>(() => {
    const areas: ShellNavGroup = {
      id: 'areas',
      label: 'Bereiche',
      items: sections.map((section) => ({
        key: section.key,
        label: section.label,
        href: section.href,
        icon: section.icon,
        active: section.active,
      })),
    };

    const module: ShellNavGroup = {
      id: 'module',
      label: subNavLabel ?? 'Navigation',
      items: (subNav ?? []).map((item) => ({
        key: item.key,
        label: item.label,
        href: item.href,
        icon: item.icon,
        active: isSubActive(item.href),
      })),
    };

    return [areas, module];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, subNav, subNavLabel, pathname, activeSubKey]);

  const email = profile?.email ?? user?.email ?? null;

  return (
    <PremiumShell
      brandTitle="Cogniiq"
      brandSubtitle={title ?? 'Dashboard'}
      groups={groups}
      navLabel="Interne Navigation"
      indicatorId="owner-shell"
      storageKey="cogniiq.shell.admin.collapsed"
      loading={loading}
      identity={{
        displayName: profile?.full_name || email || 'Konto',
        email,
        organizationName: 'Cogniiq Workspace',
        onSignOut: () => {
          void signOut();
        },
      }}
    >
      {children}
    </PremiumShell>
  );
}
