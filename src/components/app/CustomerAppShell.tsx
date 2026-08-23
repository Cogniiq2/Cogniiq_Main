import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { CreditCard, ExternalLink, FileText, Headphones, LayoutGrid, Settings, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { AppRouteTransition, AppStatusBadge } from '@/components/app/CustomerAppPrimitives';
import { CommandPaletteProvider, useOptionalCommandPalette } from '@/components/dashboard/CommandPalette';
import type { CommandGroup } from '@/components/dashboard/CommandPalette';
import type { BreadcrumbItem } from '@/components/dashboard/primitives';
import { PremiumSelect } from '@/components/dashboard/PremiumSelect';
import { radius, text as dashText } from '@/components/dashboard/tokens';
import { lifecycleDisplays } from '@/components/app/customerPortalModel';
import type { LifecycleDisplay } from '@/components/app/customerPortalModel';
import { RailAccount } from '@/components/navigation/RailAccount';
import { SidebarShell } from '@/components/navigation/SidebarShell';
import { resolveAriaCurrent } from '@/components/navigation/navModel';
import type { SidebarNavGroup } from '@/components/navigation/navModel';
import { useNavCollapse } from '@/components/navigation/useNavCollapse';
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
import { buildSolutionNavHref, resolveImplementation } from '@/lib/solutions/registry';
import type { OrganizationSolution } from '@/lib/clientPlatform/types';
import { cn } from '@/lib/utils';

interface CustomerNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface CustomerNavGroup {
  id: string;
  label: string;
  items: CustomerNavItem[];
}

// Universal, product-neutral navigation shown to every customer.
const universalNav: CustomerNavGroup = {
  id: 'portal',
  label: 'Portal',
  items: [
    { label: 'Übersicht', href: '/app', icon: LayoutGrid },
    { label: 'Dokumente', href: '/app/documents', icon: FileText },
    { label: 'Abrechnung', href: '/app/billing', icon: CreditCard },
    { label: 'Meine Lösungen', href: '/app/solutions', icon: Headphones },
    { label: 'Support', href: '/app/support', icon: UserRound },
    { label: 'Einstellungen', href: '/app/settings', icon: Settings },
  ],
};

function isActivePath(pathname: string, href: string) {
  if (href === '/app') return pathname === '/app';
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Product navigation is generated from the active organization's accessible solution modules.
function buildProductNavGroups(solutions: OrganizationSolution[]): CustomerNavGroup[] {
  return solutions
    .filter((solution) => solution.status !== 'disabled')
    .flatMap((solution) => {
      const implementation = resolveImplementation(solution.implementation_key);
      return implementation.navGroups.map((group) => ({
        id: `${solution.id}-${group.id}`,
        label: solution.display_name,
        items: group.items.map((item) => ({
          label: item.label,
          href: buildSolutionNavHref(solution.instance_key, item),
          icon: item.icon,
        })),
      }));
    });
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
  const { collapsed, toggle } = useNavCollapse('customer');

  const hasMultipleOrganizations = memberships.length > 1;
  const displayName = profile?.full_name || profile?.email || user?.email || 'Konto';

  const productNav = useMemo(() => buildProductNavGroups(solutions), [solutions]);
  const navGroups = useMemo(() => [universalNav, ...productNav], [productNav]);
  const lifecycle = getWorkspaceLifecycleDisplay(Boolean(activeOrganizationId), solutions.length);

  const groups: SidebarNavGroup[] = useMemo(() => {
    const built: SidebarNavGroup[] = navGroups.map((group) => ({
      id: group.id,
      label: group.label,
      items: group.items.map((item) => ({
        key: item.href,
        label: item.label,
        href: item.href,
        icon: item.icon,
        active: isActivePath(location.pathname, item.href),
        // Every customer entry is a leaf destination; nesting is reconciled just below.
        current: 'page',
      })),
    }));

    // A solution's items live under /app/solutions/<key>/..., so the universal "Meine Lösungen"
    // entry matches those routes too and both light up. The highlighting is intended; the duplicate
    // aria-current="page" is not. resolveAriaCurrent keeps the deepest match as the page and
    // downgrades the containing entry to 'true'.
    return resolveAriaCurrent(built);
  }, [navGroups, location.pathname]);

  // Wayfinding: the group and label of the deepest matching entry ("Portal / Dokumente",
  // "<Lösung> / Rechnungen"). Groups are not pages, so only the leaf links.
  const breadcrumbs: BreadcrumbItem[] = useMemo(() => {
    let deepest: { group: string; label: string } | null = null;
    let deepestHref = '';
    for (const group of navGroups) {
      for (const item of group.items) {
        if (isActivePath(location.pathname, item.href) && item.href.length >= deepestHref.length) {
          deepest = { group: group.label, label: item.label };
          deepestHref = item.href;
        }
      }
    }
    if (!deepest) return [];
    return [{ label: deepest.group }, { label: deepest.label }];
  }, [navGroups, location.pathname]);

  // ⌘K: every reachable portal destination. Entity search (documents, invoices) follows once the
  // portal has a shared query layer — commands must never trigger a second fetch cascade per open.
  const commandGroups: CommandGroup[] = useMemo(
    () => [
      {
        id: 'navigation',
        label: 'Navigation',
        items: navGroups.flatMap((group) =>
          group.items.map((item) => ({
            key: `nav-${item.href}`,
            label: item.label,
            hint: group.label,
            icon: item.icon,
            to: item.href,
            keywords: [group.label],
          })),
        ),
      },
    ],
    [navGroups],
  );

  return (
    <CommandPaletteProvider groups={commandGroups}>
      <CustomerShellFrame
        groups={groups}
        breadcrumbs={breadcrumbs}
        collapsed={collapsed}
        onToggleCollapse={toggle}
        routeKey={location.pathname}
        topSlot={({ collapsed: railCollapsed, variant }) => (
        <WorkspaceSlot
          collapsed={railCollapsed}
          variant={variant}
          organizationName={activeOrganization?.name ?? null}
          lifecycle={lifecycle}
          memberships={memberships}
          activeOrganizationId={activeOrganizationId}
          onChangeOrganization={setActiveOrganizationId}
          hasMultipleOrganizations={hasMultipleOrganizations}
        />
      )}
        footerSlot={({ collapsed: railCollapsed }) => (
          <RailAccount
            collapsed={railCollapsed}
            withTooltip
            name={displayName}
            email={profile?.email ?? user?.email ?? null}
            context={activeOrganization?.name ?? 'Keine Organisation verbunden'}
            links={[
              { key: 'settings', label: 'Profil & Konto', to: '/app/settings', icon: Settings },
              { key: 'website', label: 'Zur Website', to: '/', icon: ExternalLink },
            ]}
            onSignOut={() => void signOut()}
          />
        )}
      >
        {children}
      </CustomerShellFrame>
    </CommandPaletteProvider>
  );
}

/**
 * Inside the palette provider so the topbar/mobile search triggers can open it; owns nothing else.
 */
function CustomerShellFrame({
  groups,
  breadcrumbs,
  collapsed,
  onToggleCollapse,
  routeKey,
  topSlot,
  footerSlot,
  children,
}: {
  groups: SidebarNavGroup[];
  breadcrumbs: BreadcrumbItem[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  routeKey: string;
  topSlot: Parameters<typeof SidebarShell>[0]['topSlot'];
  footerSlot: Parameters<typeof SidebarShell>[0]['footerSlot'];
  children: ReactNode;
}) {
  const palette = useOptionalCommandPalette();

  return (
    <SidebarShell
      surfaceLabel="Kundenbereich"
      brandHref="/app"
      brandAriaLabel="Cogniiq Kundenbereich"
      navLabel="Kundenbereich Navigation"
      groups={groups}
      collapsed={collapsed}
      onToggleCollapse={onToggleCollapse}
      breadcrumbs={breadcrumbs}
      onOpenSearch={palette ? palette.open : undefined}
      topSlot={topSlot}
      footerSlot={footerSlot}
    >
      <AppRouteTransition routeKey={routeKey}>{children}</AppRouteTransition>
    </SidebarShell>
  );
}

/**
 * Workspace context directly under the brand: which organization the portal is showing, its
 * lifecycle state, and the switcher for multi-organization accounts. Collapsed rails reduce this to
 * a single hairline so the icon column stays clean.
 */
function WorkspaceSlot({
  collapsed,
  variant,
  organizationName,
  lifecycle,
  memberships,
  activeOrganizationId,
  onChangeOrganization,
  hasMultipleOrganizations,
}: {
  collapsed: boolean;
  variant: 'desktop' | 'mobile';
  organizationName: string | null;
  lifecycle: LifecycleDisplay;
  memberships: ReturnType<typeof useOrganizations>['memberships'];
  activeOrganizationId: string | null;
  onChangeOrganization: (id: string | null) => void;
  hasMultipleOrganizations: boolean;
}) {
  if (collapsed) return <div className="mx-auto h-px w-6 bg-gray-200" aria-hidden="true" />;

  // Desktop rail and mobile drawer are both mounted, so the switcher needs a unique id per variant.
  const selectId = variant === 'mobile' ? 'customer-organization-select-mobile' : 'customer-organization-select';

  return (
    <div className="border-b border-[var(--cq-border)] px-3 py-3">
      <div className={cn('border border-[var(--cq-border)] bg-[var(--cq-sunken)] px-3 py-2.5', radius.lg)}>
        <p className={dashText.eyebrow}>Workspace</p>
        <p className="mt-1 truncate text-[12.5px] font-medium text-[var(--cq-fg)]">
          {organizationName ?? 'Noch nicht provisioniert'}
        </p>
        <div className="mt-2">
          <AppStatusBadge label={lifecycle.label} tone={lifecycle.tone} />
        </div>

        {hasMultipleOrganizations ? (
          // A constrained single choice that changes application state → Select, not DropdownMenu.
          // The menu portals to the body, so it is never clipped by the rail's overflow-hidden.
          <div className="mt-2.5">
            <PremiumSelect
              id={selectId}
              aria-label="Organisation auswählen"
              value={activeOrganizationId ?? ''}
              onChange={(value) => onChangeOrganization(value || null)}
              options={memberships.map((membership) => ({
                value: membership.organization_id,
                label: membership.organization?.name ?? 'Unbenannte Organisation',
              }))}
            />
          </div>
        ) : null}
      </div>
    </div>
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
