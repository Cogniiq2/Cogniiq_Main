import { useMemo, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { ExternalLink, type LucideIcon } from 'lucide-react';

import { RailAccount } from '@/components/navigation/RailAccount';
import { SidebarShell } from '@/components/navigation/SidebarShell';
import type { SidebarNavGroup } from '@/components/navigation/navModel';
import { useNavCollapse } from '@/components/navigation/useNavCollapse';
import { useAuth } from '@/contexts/AuthContext';
import { CommandPaletteProvider, useOptionalCommandPalette, type CommandGroup } from './CommandPalette';
import type { BreadcrumbItem } from './primitives';

// Unified dashboard shell shared by the Cogniiq internal workspace and the owner Finance & Steuern
// module. One Cogniiq brand, one account/logout control, a top-level app switch and the active
// module's sub-navigation — rendered as a premium vertical rail.
//
// The props below are the shell's contract with @/pages/admin/internalNavigation: callers resolve
// which sections a user may see (owner-only filtering) and which item is active. The shell renders
// exactly what it is given and decides nothing about routes or authorization.

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
  sections, subNav, subNavLabel, activeSubKey, title, commandGroups, onCommandOpen, children,
}: {
  sections: ShellSection[];
  subNav?: ShellSubNavItem[];
  subNavLabel?: string;
  activeSubKey?: (pathname: string, href: string) => boolean;
  title?: string;
  /** Command palette model for this surface. Providing it enables ⌘K and the topbar search trigger. */
  commandGroups?: CommandGroup[];
  /** Fired when the palette opens — the hook for lazily loading entity commands. */
  onCommandOpen?: () => void;
  children: ReactNode;
}) {
  const { pathname } = useLocation();
  const { profile, user, signOut } = useAuth();
  const { collapsed, toggle } = useNavCollapse('internal');

  const isSubActive = useMemo(
    () => (href: string) =>
      activeSubKey ? activeSubKey(pathname, href) : pathname === href || pathname.startsWith(`${href}/`),
    [activeSubKey, pathname],
  );

  const groups: SidebarNavGroup[] = useMemo(() => {
    const hasSubNav = Boolean(subNav && subNav.length);

    const result: SidebarNavGroup[] = [
      {
        id: 'sections',
        label: 'Bereiche',
        items: sections.map((section) => ({
          key: section.key,
          label: section.label,
          href: section.href,
          icon: section.icon,
          active: section.active,
          // The active module only *contains* the current page once its sub-navigation is on
          // screen, so it announces 'true' and leaves the single 'page' to the active sub-item.
          // A module without sub-navigation (Oura, or any module whose sub-nav is withheld from a
          // non-owner) is itself the destination and keeps 'page'.
          current: hasSubNav ? ('true' as const) : ('page' as const),
        })),
      },
    ];

    if (hasSubNav) {
      result.push({
        id: 'module',
        label: subNavLabel ?? 'Navigation',
        items: subNav!.map((item) => ({
          key: item.key,
          label: item.label,
          href: item.href,
          icon: item.icon,
          active: isSubActive(item.href),
          current: 'page' as const,
        })),
      });
    }

    return result;
  }, [sections, subNav, subNavLabel, isSubActive]);

  // Wayfinding: active module, then the active sub-item. Detail pages still resolve to their list
  // section (isSubNavActive matches prefixes), so the trail never dead-ends.
  const breadcrumbs: BreadcrumbItem[] = useMemo(() => {
    const activeSection = sections.find((section) => section.active);
    if (!activeSection) return [];
    const items: BreadcrumbItem[] = [{ label: activeSection.label, href: activeSection.href }];
    const activeSub = subNav?.find((item) => isSubActive(item.href));
    if (activeSub && activeSub.href !== activeSection.href) {
      items.push({ label: activeSub.label, href: activeSub.href });
    }
    return items;
  }, [sections, subNav, isSubActive]);

  const email = profile?.email ?? user?.email ?? null;
  const displayName = profile?.full_name || email || 'Konto';

  const shell = (
    <ShellFrame
      title={title}
      groups={groups}
      breadcrumbs={breadcrumbs}
      collapsed={collapsed}
      onToggleCollapse={toggle}
      displayName={displayName}
      email={displayName === email ? null : email}
      onSignOut={() => void signOut()}
    >
      {children}
    </ShellFrame>
  );

  if (!commandGroups) return shell;

  return (
    <CommandPaletteProvider groups={commandGroups} onOpen={onCommandOpen}>
      {shell}
    </CommandPaletteProvider>
  );
}

/**
 * Split so the topbar search trigger can consume the (optional) palette context from inside the
 * provider, while a shell without commandGroups renders identically minus the trigger.
 */
function ShellFrame({
  title, groups, breadcrumbs, collapsed, onToggleCollapse, displayName, email, onSignOut, children,
}: {
  title?: string;
  groups: SidebarNavGroup[];
  breadcrumbs: BreadcrumbItem[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  displayName: string;
  email: string | null;
  onSignOut: () => void;
  children: ReactNode;
}) {
  const palette = useOptionalCommandPalette();

  return (
    <SidebarShell
      surfaceLabel={title ?? 'Dashboard'}
      brandHref="/admin"
      brandAriaLabel="Cogniiq Workspace"
      navLabel="Workspace Navigation"
      groups={groups}
      collapsed={collapsed}
      onToggleCollapse={onToggleCollapse}
      breadcrumbs={breadcrumbs}
      onOpenSearch={palette ? palette.open : undefined}
      footerSlot={({ collapsed: railCollapsed }) => (
        <RailAccount
          collapsed={railCollapsed}
          withTooltip
          name={displayName}
          email={email}
          links={[{ key: 'website', label: 'Zur Website', to: '/', icon: ExternalLink }]}
          onSignOut={onSignOut}
        />
      )}
    >
      {children}
    </SidebarShell>
  );
}
