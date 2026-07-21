import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  CreditCard,
  ExternalLink,
  Headphones,
  LayoutGrid,
  LogOut,
  Menu,
  Settings,
  UserRound,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { AppRouteTransition, AppStatusBadge, appEase } from '@/components/app/CustomerAppPrimitives';
import { lifecycleDisplays } from '@/components/app/customerPortalModel';
import type { LifecycleDisplay } from '@/components/app/customerPortalModel';
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
    { label: 'Meine Lösungen', href: '/app/solutions', icon: Headphones },
    { label: 'Support', href: '/app/support', icon: UserRound },
    { label: 'Abrechnung', href: '/app/billing', icon: CreditCard },
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const { profile, user, signOut } = useAuth();
  const { memberships, activeOrganization, activeOrganizationId, setActiveOrganizationId } = useOrganizations();
  const { solutions } = useOrganizationSolutions();
  const hasMultipleOrganizations = memberships.length > 1;
  const displayName = profile?.full_name || profile?.email || user?.email || 'Konto';

  const productNav = useMemo(() => buildProductNavGroups(solutions), [solutions]);
  const navGroups = useMemo(() => [universalNav, ...productNav], [productNav]);
  const lifecycle = getWorkspaceLifecycleDisplay(Boolean(activeOrganizationId), solutions.length);

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    setMobileOpen(false);
    await signOut();
  };

  return (
    <div className="min-h-screen bg-[#f7f7f4] text-gray-950">
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="group flex min-w-0 items-center gap-3" aria-label="Zur Cogniiq Website">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-sm font-bold tracking-tight text-gray-950 shadow-sm transition-colors group-hover:border-gray-300">
              C
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold tracking-tight text-gray-950">Cogniiq</span>
              <span className="block truncate text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                Kundenbereich
              </span>
            </span>
          </Link>

          <div className="hidden min-w-0 flex-1 items-center justify-center gap-3 lg:flex">
            <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Workspace</span>
              <span className="max-w-[220px] truncate text-sm font-semibold text-gray-800">
                {activeOrganization?.name ?? 'Noch nicht provisioniert'}
              </span>
            </div>
            <AppStatusBadge label={lifecycle.label} tone={lifecycle.tone} />
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {hasMultipleOrganizations ? (
              <label className="sr-only" htmlFor="customer-organization-select">
                Organisation auswählen
              </label>
            ) : null}
            {hasMultipleOrganizations ? (
              <select
                id="customer-organization-select"
                value={activeOrganizationId ?? ''}
                onChange={(event) => setActiveOrganizationId(event.target.value || null)}
                className="h-10 max-w-[220px] rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 outline-none transition-colors focus:border-gray-400"
              >
                {memberships.map((membership) => (
                  <option key={membership.id} value={membership.organization_id}>
                    {membership.organization?.name ?? 'Unbenannte Organisation'}
                  </option>
                ))}
              </select>
            ) : null}

            <Link
              to="/"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 text-sm font-semibold text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
            >
              Zur Website
              <ExternalLink size={13} aria-hidden="true" />
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((open) => !open)}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
              >
                <UserRound size={14} className="text-gray-400" aria-hidden="true" />
                <span className="max-w-[150px] truncate text-sm font-medium">{displayName}</span>
                <ChevronDown size={13} className="text-gray-400" aria-hidden="true" />
              </button>

              <AnimatePresence>
                {userMenuOpen ? (
                  <motion.div
                    role="menu"
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: appEase }}
                    className="absolute right-0 mt-2 w-72 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.12)]"
                  >
                    <div className="border-b border-gray-100 px-4 py-3">
                      <p className="truncate text-sm font-semibold text-gray-950">{displayName}</p>
                      <p className="mt-1 truncate text-xs text-gray-500">{profile?.email ?? user?.email}</p>
                      <p className="mt-2 truncate text-[11px] font-medium text-gray-400">
                        {activeOrganization?.name ?? 'Keine Organisation verbunden'}
                      </p>
                    </div>
                    <div className="p-2">
                      <MenuLink to="/app/settings" icon={Settings} label="Profil & Konto" onClick={() => setUserMenuOpen(false)} />
                      <MenuLink to="/" icon={ExternalLink} label="Zur Website" onClick={() => setUserMenuOpen(false)} />
                      <button
                        type="button"
                        onClick={() => void handleSignOut()}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                        role="menuitem"
                      >
                        <LogOut size={15} className="text-gray-400" aria-hidden="true" />
                        Abmelden
                      </button>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 md:hidden"
            aria-label="Kundenbereich Navigation"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={17} aria-hidden="true" /> : <Menu size={17} aria-hidden="true" />}
          </button>
        </div>

        <div className="hidden border-t border-gray-100 bg-white/80 lg:block">
          <nav className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8" aria-label="Kundenbereich Navigation">
            {navGroups.map((group) => (
              <div key={group.id} className="flex items-center gap-1">
                <span className="px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-300">
                  {group.label}
                </span>
                {group.items.map((item) => (
                  <AppNavLink key={item.href} item={item} active={isActivePath(location.pathname, item.href)} />
                ))}
              </div>
            ))}
          </nav>
        </div>

        <AnimatePresence>
          {mobileOpen ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: appEase }}
              className="overflow-hidden border-t border-gray-100 bg-white md:hidden"
            >
              <div className="px-4 py-4">
                <div className="mb-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Workspace</p>
                  <p className="mt-1 truncate text-sm font-semibold text-gray-900">
                    {activeOrganization?.name ?? 'Noch nicht provisioniert'}
                  </p>
                  <p className="mt-2 text-[12px] leading-5 text-gray-500">{lifecycle.description}</p>
                </div>
                <nav className="space-y-5" aria-label="Mobile Kundenbereich Navigation">
                  {navGroups.map((group) => (
                    <div key={group.id}>
                      <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                        {group.label}
                      </p>
                      <div className="space-y-1">
                        {group.items.map((item) => (
                          <MobileNavLink
                            key={item.href}
                            item={item}
                            active={isActivePath(location.pathname, item.href)}
                            onClick={() => setMobileOpen(false)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </nav>
                <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                  <p className="truncate text-sm font-semibold text-gray-900">{displayName}</p>
                  <p className="mt-1 truncate text-xs text-gray-500">{profile?.email ?? user?.email}</p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link
                    to="/"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700"
                  >
                    Website
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleSignOut()}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700"
                  >
                    <LogOut size={14} aria-hidden="true" />
                    Abmelden
                  </button>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AppRouteTransition routeKey={location.pathname}>{children}</AppRouteTransition>
      </main>
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

function AppNavLink({ item, active }: { item: CustomerNavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative inline-flex h-10 items-center gap-2 overflow-hidden whitespace-nowrap rounded-xl px-3 text-[13px] font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2',
        active ? 'text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-950'
      )}
    >
      {active ? (
        <motion.span
          layoutId="customer-nav-active"
          className="absolute inset-0 rounded-xl bg-gray-950 shadow-sm"
          transition={{ duration: 0.22, ease: appEase }}
        />
      ) : null}
      <Icon size={14} className={cn('relative z-10', active ? 'text-white' : 'text-gray-400')} aria-hidden="true" />
      <span className="relative z-10">{item.label}</span>
    </Link>
  );
}

function MobileNavLink({
  item,
  active,
  onClick,
}: {
  item: CustomerNavItem;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative flex min-h-11 items-center gap-3 overflow-hidden rounded-xl px-3 text-sm font-semibold transition-colors',
        active ? 'text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-950'
      )}
    >
      {active ? <span className="absolute inset-0 rounded-xl bg-gray-950" /> : null}
      <Icon size={16} className={cn('relative z-10', active ? 'text-white' : 'text-gray-400')} aria-hidden="true" />
      <span className="relative z-10">{item.label}</span>
    </Link>
  );
}

function MenuLink({
  to,
  icon: Icon,
  label,
  onClick,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
      role="menuitem"
    >
      <Icon size={15} className="text-gray-400" aria-hidden="true" />
      {label}
    </Link>
  );
}
