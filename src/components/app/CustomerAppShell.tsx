import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  CreditCard,
  ExternalLink,
  FileText,
  Headphones,
  LayoutGrid,
  LogOut,
  Menu,
  Settings,
  UserRound,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { AppRouteTransition, AppStatusBadge } from '@/components/app/CustomerAppPrimitives';
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
import { useMotionPresets } from '@/lib/motion';
import type { OrganizationSolution } from '@/lib/clientPlatform/types';
import { cn } from '@/lib/utils';

// The Customer Portal shell.
//
// Deliberately calmer than the owner rail: one horizontal plane of navigation, a single
// workspace identity strip, and a narrower reading measure. A customer should be able to
// take in the whole surface at a glance — the portal is an executive summary of their
// engagement, not an operations console. Navigation content, solution resolution and
// organization switching are unchanged; this is presentation only.

const portalFocusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950/25 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas';

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const motionPresets = useMotionPresets();
  const { profile, user, signOut } = useAuth();
  const { memberships, activeOrganization, activeOrganizationId, setActiveOrganizationId } = useOrganizations();
  const { solutions } = useOrganizationSolutions();
  const hasMultipleOrganizations = memberships.length > 1;
  const displayName = profile?.full_name || profile?.email || user?.email || 'Konto';

  const productNav = useMemo(() => buildProductNavGroups(solutions), [solutions]);
  const navGroups = useMemo(() => [universalNav, ...productNav], [productNav]);
  const lifecycle = getWorkspaceLifecycleDisplay(Boolean(activeOrganizationId), solutions.length);

  // Close the drawer on navigation and lock background scroll while it is open.
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setMobileOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', onKey); };
  }, [mobileOpen]);

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    setMobileOpen(false);
    await signOut();
  };

  const organizationSelect = (idSuffix: string, className: string) =>
    hasMultipleOrganizations ? (
      <>
        <label className="sr-only" htmlFor={`customer-organization-select${idSuffix}`}>
          Organisation auswählen
        </label>
        <select
          id={`customer-organization-select${idSuffix}`}
          value={activeOrganizationId ?? ''}
          onChange={(event) => setActiveOrganizationId(event.target.value || null)}
          className={className}
        >
          {memberships.map((membership) => (
            <option key={membership.id} value={membership.organization_id}>
              {membership.organization?.name ?? 'Unbenannte Organisation'}
            </option>
          ))}
        </select>
      </>
    ) : null;

  return (
    <div data-cq-surface="customer" className="min-h-screen bg-canvas text-gray-950">
      <header className="sticky top-0 z-40 border-b border-hairline bg-white/85 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70">
        {/* Row 1 — identity: who you are, whose workspace this is, and how to leave. */}
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className={cn('group flex min-w-0 items-center gap-3 rounded-control', portalFocusRing)} aria-label="Zur Cogniiq Website">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-control border border-gray-200 bg-white text-sm font-bold tracking-tight text-gray-950 shadow-sm transition-colors duration-fast ease-premium group-hover:border-gray-300">
              C
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13.5px] font-semibold leading-tight tracking-tight text-gray-950">Cogniiq</span>
              <span className="block truncate text-[10px] font-bold uppercase leading-tight tracking-[0.16em] text-gray-500">
                Kundenbereich
              </span>
            </span>
          </Link>

          {/* Workspace context, centred on wide screens so the customer's own name is the
              anchor of the page rather than an afterthought in a corner. */}
          <div className="hidden min-w-0 flex-1 items-center justify-center gap-2.5 lg:flex">
            <span className="min-w-0 truncate text-[15px] font-semibold tracking-tight text-gray-950">
              {activeOrganization?.name ?? 'Noch nicht provisioniert'}
            </span>
            <AppStatusBadge label={lifecycle.label} tone={lifecycle.tone} />
          </div>

          {/* Desktop cluster and the mobile trigger below share ONE breakpoint (lg). Splitting
              them (md here, lg on the nav row) previously left 768–1023px with no navigation
              at all: the hamburger was already hidden while the nav row had not appeared yet. */}
          <div className="hidden items-center gap-2 lg:flex">
            {organizationSelect(
              '',
              cn(
                'h-9 max-w-[200px] rounded-control border border-gray-200 bg-white px-3 text-[13px] font-medium text-gray-700 outline-none transition-colors duration-fast ease-premium hover:border-gray-300 focus:border-gray-400',
                portalFocusRing,
              ),
            )}

            <Link
              to="/"
              className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-control border border-gray-200 bg-white px-3 text-[13px] font-semibold text-gray-600',
                'transition-colors duration-fast ease-premium hover:border-gray-300 hover:text-gray-950',
                portalFocusRing,
              )}
            >
              Zur Website
              <ExternalLink size={13} aria-hidden="true" />
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((open) => !open)}
                className={cn(
                  'inline-flex h-9 items-center gap-2 rounded-control border border-gray-200 bg-white px-3 text-gray-700',
                  'transition-colors duration-fast ease-premium hover:border-gray-300 hover:text-gray-950',
                  portalFocusRing,
                )}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
              >
                <UserRound size={14} className="text-gray-400" aria-hidden="true" />
                <span className="max-w-[150px] truncate text-[13px] font-semibold">{displayName}</span>
                <ChevronDown size={13} className={cn('text-gray-400 transition-transform duration-fast ease-premium', userMenuOpen && 'rotate-180')} aria-hidden="true" />
              </button>

              <AnimatePresence>
                {userMenuOpen ? (
                  <motion.div
                    role="menu"
                    variants={motionPresets.popIn}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="absolute right-0 mt-2 w-72 origin-top-right overflow-hidden rounded-card border border-hairline bg-white shadow-panel"
                  >
                    <div className="border-b border-hairline px-4 py-3">
                      <p className="truncate text-sm font-semibold text-gray-950">{displayName}</p>
                      <p className="mt-1 truncate text-xs text-gray-500">{profile?.email ?? user?.email}</p>
                      <p className="mt-2 truncate text-[11px] font-medium text-gray-500">
                        {activeOrganization?.name ?? 'Keine Organisation verbunden'}
                      </p>
                    </div>
                    <div className="p-2">
                      <MenuLink to="/app/settings" icon={Settings} label="Profil & Konto" onClick={() => setUserMenuOpen(false)} />
                      <MenuLink to="/" icon={ExternalLink} label="Zur Website" onClick={() => setUserMenuOpen(false)} />
                      <button
                        type="button"
                        onClick={() => void handleSignOut()}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-left text-sm font-semibold text-gray-600',
                          'transition-colors duration-fast ease-premium hover:bg-gray-50 hover:text-gray-950',
                          portalFocusRing,
                        )}
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
            onClick={() => setMobileOpen(true)}
            className={cn(
              'inline-flex h-10 w-10 items-center justify-center rounded-control border border-gray-200 bg-white text-gray-700 lg:hidden',
              'transition-colors duration-fast ease-premium hover:border-gray-300 hover:text-gray-950',
              portalFocusRing,
            )}
            aria-label="Kundenbereich Navigation"
            aria-expanded={mobileOpen}
          >
            <Menu size={17} aria-hidden="true" />
          </button>
        </div>

        {/* Row 2 — navigation. */}
        <div className="hidden border-t border-hairline lg:block">
          <nav className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8" aria-label="Kundenbereich Navigation">
            {navGroups.map((group, groupIndex) => (
              <div key={group.id} className="flex items-center gap-1">
                {groupIndex > 0 ? (
                  <span className="mx-2 h-5 w-px shrink-0 bg-hairline" aria-hidden="true" />
                ) : null}
                {groupIndex > 0 ? (
                  <span className="whitespace-nowrap px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
                    {group.label}
                  </span>
                ) : null}
                {group.items.map((item) => (
                  <AppNavLink
                    key={item.href}
                    item={item}
                    active={isActivePath(location.pathname, item.href)}
                    indicatorTransition={motionPresets.indicator}
                  />
                ))}
              </div>
            ))}
          </nav>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={motionPresets.transition}
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-gray-950/35 backdrop-blur-[2px]"
              aria-hidden="true"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Kundenbereich Navigation"
              initial={motionPresets.reduce ? { opacity: 0 } : { x: '100%' }}
              animate={motionPresets.reduce ? { opacity: 1 } : { x: 0 }}
              exit={motionPresets.reduce ? { opacity: 0 } : { x: '100%' }}
              transition={motionPresets.reduce ? { duration: 0 } : { duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-y-0 right-0 flex w-[300px] max-w-[88vw] flex-col bg-white shadow-overlay"
            >
              <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-hairline px-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500">Kundenbereich</p>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className={cn('inline-flex h-9 w-9 items-center justify-center rounded-control text-gray-500 hover:bg-gray-100 hover:text-gray-950', portalFocusRing)}
                  aria-label="Navigation schließen"
                >
                  <X size={17} aria-hidden="true" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                <div className="rounded-card border border-hairline bg-gray-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500">Workspace</p>
                  <p className="mt-1 truncate text-[15px] font-semibold tracking-tight text-gray-950">
                    {activeOrganization?.name ?? 'Noch nicht provisioniert'}
                  </p>
                  <p className="mt-2 text-[12px] leading-5 text-gray-600">{lifecycle.description}</p>
                  {hasMultipleOrganizations
                    ? organizationSelect(
                        '-mobile',
                        cn(
                          'mt-3 h-11 w-full rounded-control border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 outline-none focus:border-gray-400',
                          portalFocusRing,
                        ),
                      )
                    : null}
                </div>

                <nav className="mt-5 space-y-5" aria-label="Mobile Kundenbereich Navigation">
                  {navGroups.map((group) => (
                    <div key={group.id}>
                      <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500">
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
              </div>

              <div className="shrink-0 border-t border-hairline p-4">
                <p className="truncate text-sm font-semibold text-gray-950">{displayName}</p>
                <p className="mt-0.5 truncate text-xs text-gray-500">{profile?.email ?? user?.email}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link
                    to="/"
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-gray-200 bg-white px-4 text-[13px] font-semibold text-gray-700',
                      'transition-colors duration-fast ease-premium hover:border-gray-300 hover:text-gray-950',
                      portalFocusRing,
                    )}
                  >
                    Website
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleSignOut()}
                    className={cn(
                      'inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-gray-200 bg-white px-4 text-[13px] font-semibold text-gray-700',
                      'transition-colors duration-fast ease-premium hover:border-gray-300 hover:text-gray-950',
                      portalFocusRing,
                    )}
                  >
                    <LogOut size={14} aria-hidden="true" />
                    Abmelden
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
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

function AppNavLink({
  item,
  active,
  indicatorTransition,
}: {
  item: CustomerNavItem;
  active: boolean;
  indicatorTransition: object;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative inline-flex h-9 items-center gap-2 overflow-hidden whitespace-nowrap rounded-control px-3 text-[13px] font-semibold',
        'transition-colors duration-fast ease-premium',
        active ? 'text-white' : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-950',
        portalFocusRing,
      )}
    >
      {active ? (
        <motion.span
          layoutId="customer-nav-active"
          className="absolute inset-0 rounded-control bg-gray-950"
          transition={indicatorTransition}
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
        'relative flex min-h-11 items-center gap-3 overflow-hidden rounded-control px-3 text-sm font-semibold',
        'transition-colors duration-fast ease-premium',
        active ? 'text-white' : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-950',
        portalFocusRing,
      )}
    >
      {active ? <span className="absolute inset-0 rounded-control bg-gray-950" /> : null}
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
      className={cn(
        'flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-semibold text-gray-600',
        'transition-colors duration-fast ease-premium hover:bg-gray-50 hover:text-gray-950',
        portalFocusRing,
      )}
      role="menuitem"
    >
      <Icon size={15} className="text-gray-400" aria-hidden="true" />
      {label}
    </Link>
  );
}
