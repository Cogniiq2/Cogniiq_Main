import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { ExternalLink, Settings } from 'lucide-react';

import { AppRouteTransition, AppStatusBadge } from '@/components/app/CustomerAppPrimitives';
import { lifecycleDisplays } from '@/components/app/customerPortalModel';
import type { LifecycleDisplay } from '@/components/app/customerPortalModel';
import { PremiumShell, type ShellNavGroup } from '@/components/shell';
import { useAuth } from '@/contexts/AuthContext';
import {
  CustomerPortalPersistenceProvider,
  useCustomerPortalPersistenceValue,
} from '@/hooks/useCustomerPortalPersistence';
import {
  OrganizationSolutionsProvider,
  useOrganizationSolutions,
  useOrganizationSolutionsValue,
} from '@/hooks/useOrganizationSolutions';
import { useOrganizations } from '@/hooks/useOrganizations';
import { usePortalAccess } from '@/contexts/PortalAccessContext';
import { buildPortalNavigation } from '@/lib/portalAccess/navigation';

// The customer portal shell. Same premium vertical sidebar system as the internal workspace
// (components/shell/PremiumShell), with its own capability-derived navigation model.

function isActivePath(pathname: string, href: string) {
  if (href === '/app') return pathname === '/app';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function CustomerAppShell({ children }: { children: ReactNode }) {
  const portalPersistence = useCustomerPortalPersistenceValue();
  const solutionsValue = useOrganizationSolutionsValue();

  return (
    <CustomerPortalPersistenceProvider value={portalPersistence}>
      <OrganizationSolutionsProvider value={solutionsValue}>
        <CustomerAppShellInner>{children}</CustomerAppShellInner>
      </OrganizationSolutionsProvider>
    </CustomerPortalPersistenceProvider>
  );
}

function CustomerAppShellInner({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { profile, user, signOut } = useAuth();
  const { memberships, activeOrganization, activeOrganizationId, setActiveOrganizationId } = useOrganizations();
  const { solutions } = useOrganizationSolutions();
  const { organization: accessOrganization, hasEveryCapability, status: accessStatus } = usePortalAccess();
  const hasMultipleOrganizations = memberships.length > 1;
  const displayName = profile?.full_name || profile?.email || user?.email || 'Konto';

  // Navigation is derived from the ACCESS CONTEXT's solutions plus the effective capabilities.
  // There is no navigation model in this file: buildPortalNavigation is the single source of truth
  // shared with the route table, so the visual shell can never diverge from what is permitted.
  // While the context is loading, hasEveryCapability is false for everything, so a restricted item
  // is never briefly rendered and then withdrawn.
  const navGroups = useMemo<ShellNavGroup[]>(
    () =>
      buildPortalNavigation({ solutions: accessOrganization?.solutions ?? [], hasEveryCapability }).map(
        (group) => ({
          id: group.id,
          label: group.label,
          items: group.items.map((item) => ({
            key: item.href,
            label: item.label,
            href: item.href,
            icon: item.icon,
            active: isActivePath(location.pathname, item.href),
          })),
        })
      ),
    [accessOrganization, hasEveryCapability, location.pathname]
  );

  const lifecycle = getWorkspaceLifecycleDisplay(
    Boolean(activeOrganizationId),
    accessStatus === 'ready' ? (accessOrganization?.solutions.length ?? 0) : solutions.length
  );

  const organizationSwitcher = hasMultipleOrganizations ? (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
      {/* The control is labelled with aria-label rather than <label htmlFor>: the shell renders this
          same node in the sidebar, in the rail's profile menu and in the mobile drawer (exactly one
          is ever visible), so a shared DOM id would be duplicated. */}
      <p className="block text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400" aria-hidden="true">
        Organisation
      </p>
      <select
        aria-label="Organisation auswählen"
        data-testid="customer-organization-select"
        value={activeOrganizationId ?? ''}
        onChange={(event) => setActiveOrganizationId(event.target.value || null)}
        className="mt-1.5 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 outline-none transition-colors focus:border-gray-400 focus-visible:ring-2 focus-visible:ring-gray-950/40"
      >
        {memberships.map((membership) => (
          <option key={membership.id} value={membership.organization_id}>
            {membership.organization?.name ?? 'Unbenannte Organisation'}
          </option>
        ))}
      </select>
    </div>
  ) : null;

  const workspaceStatus = (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Workspace</p>
      <p className="mt-0.5 truncate text-[13px] font-semibold text-gray-800">
        {activeOrganization?.name ?? 'Noch nicht provisioniert'}
      </p>
      <div className="mt-2">
        <AppStatusBadge label={lifecycle.label} tone={lifecycle.tone} />
      </div>
    </div>
  );

  return (
    <PremiumShell
      brandTitle="Cogniiq"
      brandSubtitle="Kundenbereich"
      brandHref="/"
      groups={navGroups}
      navLabel="Kundenbereich Navigation"
      indicatorId="customer-shell"
      storageKey="cogniiq.shell.app.collapsed"
      loading={accessStatus === 'loading'}
      contextSlot={organizationSwitcher}
      statusSlot={workspaceStatus}
      identity={{
        displayName,
        email: profile?.email ?? user?.email ?? null,
        organizationName: activeOrganization?.name ?? 'Keine Organisation verbunden',
        menuItems: [
          { key: 'settings', label: 'Profil & Konto', href: '/app/settings', icon: Settings },
          { key: 'website', label: 'Zur Website', href: '/', icon: ExternalLink },
        ],
        onSignOut: () => {
          void signOut();
        },
      }}
    >
      <AppRouteTransition routeKey={location.pathname}>{children}</AppRouteTransition>
    </PremiumShell>
  );
}

function getWorkspaceLifecycleDisplay(hasOrganization: boolean, solutionCount: number): LifecycleDisplay {
  if (!hasOrganization) {
    return {
      label: 'Keine Organisation',
      description: 'Für dieses Konto ist noch keine Organisation verbunden.',
      tone: 'neutral',
    };
  }
  if (solutionCount === 0) {
    return {
      label: 'Keine aktive Lösung',
      description: 'Ihre Organisation ist verbunden, aber es ist noch keine Lösung zugewiesen.',
      tone: 'neutral',
    };
  }
  return lifecycleDisplays.live ?? {
    label: 'Aktiv',
    description: 'Ihre Lösungen sind verbunden.',
    tone: 'success',
  };
}
