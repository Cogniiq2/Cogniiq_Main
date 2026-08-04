import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  CreditCard,
  ExternalLink,
  FileText,
  FolderKanban,
  Headphones,
  LayoutGrid,
  LifeBuoy,
  LogOut,
  Menu,
  Settings,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { AppRouteTransition } from '@/components/app/CustomerAppPrimitives';
import { PremiumDropdownMenu, PremiumSelect } from '@/components/dashboard/premiumControls';
import { useAuth } from '@/contexts/AuthContext';
import {
  CustomerPortalPersistenceProvider,
  useCustomerPortalPersistenceValue,
} from '@/hooks/useCustomerPortalPersistence';
import {
  CustomerProjectsProvider,
  useCustomerProjectsValue,
  useSharedCustomerProjects,
} from '@/hooks/useCustomerProjectsContext';
import {
  OrganizationSolutionsProvider,
  useOrganizationSolutions,
  useOrganizationSolutionsValue,
} from '@/hooks/useOrganizationSolutions';
import { useOrganizations } from '@/hooks/useOrganizations';
import { buildSolutionNavHref, resolveImplementation } from '@/lib/solutions/registry';
import { useMotionPresets } from '@/lib/motion';
import {
  buildRailProjectChildren,
  getWorkspaceStatus,
  type CustomerWorkspaceTone,
} from '@/lib/customerPlatform/customerPortalModel';
import { isActiveCustomerProject } from '@/lib/customerPlatform/types';
import type { OrganizationSolution } from '@/lib/clientPlatform/types';
import { cn } from '@/lib/utils';

// The Customer Portal shell.
//
// A dedicated LEFT RAIL, not a scaled-down copy of the owner rail. The owner surface is
// an operations cockpit: sixteen destinations, dense rows, a module switcher. This one is
// an executive project experience — six destinations, generous vertical rhythm, and the
// customer's own workspace and projects as the anchor rather than a product menu. The
// horizontal navigation row that used to sit under the header is gone on desktop.
//
// Navigation CONTENT, solution resolution, entitlement filtering and organization
// switching are unchanged; the rail is presentation plus one addition — the customer's
// real projects are listed as rail children, read from the shared project request rather
// than a second query.

const RAIL_WIDTH_PX = 244;

const portalFocusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950/25 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas';

interface CustomerNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /**
   * Path prefix that marks this entry active, when it differs from `href`.
   *
   * "Übersicht" and "Projekte" both lead to `/app` (there is no project index route), so
   * without this both matched on the overview and the animated indicator landed on
   * whichever rendered last.
   */
  activePrefix?: string;
  /** Real child destinations (projects). Never invented — see buildRailProjectChildren. */
  children?: Array<{ label: string; href: string; tone?: 'attention' | 'danger' }>;
}

interface CustomerNavGroup {
  id: string;
  label: string;
  items: CustomerNavItem[];
}

function isActiveItem(pathname: string, item: { href: string; activePrefix?: string }) {
  const match = item.activePrefix ?? item.href;
  if (match === '/app') return pathname === '/app';
  return pathname === match || pathname.startsWith(`${match}/`);
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
  const projectsValue = useCustomerProjectsValue();

  return (
    <CustomerPortalPersistenceProvider value={portalPersistence}>
      <OrganizationSolutionsProvider value={solutionsValue}>
        <CustomerProjectsProvider value={projectsValue}>
          <CustomerAppShellInner>{children}</CustomerAppShellInner>
        </CustomerProjectsProvider>
      </OrganizationSolutionsProvider>
    </CustomerPortalPersistenceProvider>
  );
}

function CustomerAppShellInner({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const motionPresets = useMotionPresets();
  const { profile, user, signOut } = useAuth();
  const { memberships, activeOrganization, activeOrganizationId, setActiveOrganizationId } = useOrganizations();
  const { solutions } = useOrganizationSolutions();
  const { projects, status: projectsStatus } = useSharedCustomerProjects();

  const hasMultipleOrganizations = memberships.length > 1;
  const displayName = profile?.full_name || profile?.email || user?.email || 'Konto';
  const accountEmail = profile?.email ?? user?.email ?? null;

  // Focus must return to the control that opened the drawer, not to <body>.
  const mobileTriggerRef = useRef<HTMLButtonElement | null>(null);
  const drawerCloseRef = useRef<HTMLButtonElement | null>(null);

  const productNav = useMemo(() => buildProductNavGroups(solutions), [solutions]);
  const portalNav = useMemo(() => buildPortalNav(projects), [projects]);
  const navGroups = useMemo(() => [portalNav, ...productNav], [portalNav, productNav]);

  const workspaceStatus = getWorkspaceStatus(
    Boolean(activeOrganizationId),
    activeOrganization?.status ?? null,
    projects.filter(isActiveCustomerProject).length,
    projectsStatus,
  );

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

  // Move focus into the drawer when it opens and back to the trigger when it closes.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (mobileOpen) {
      wasOpen.current = true;
      const id = window.setTimeout(() => drawerCloseRef.current?.focus(), 40);
      return () => window.clearTimeout(id);
    }
    if (wasOpen.current) {
      wasOpen.current = false;
      mobileTriggerRef.current?.focus();
    }
    return undefined;
  }, [mobileOpen]);

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    setMobileOpen(false);
    await signOut();
  };

  // Organization switching is byte-for-byte the previous contract: same membership order,
  // same `setActiveOrganizationId(value || null)` call, same scoping. Only its placement
  // changed — it now sits in the workspace block at the top of the rail.
  const organizationSelect = (idSuffix: string, triggerClassName: string, wrapperClassName?: string) =>
    hasMultipleOrganizations ? (
      <PremiumSelect
        className={wrapperClassName}
        id={`customer-organization-select${idSuffix}`}
        ariaLabel="Organisation auswählen"
        value={activeOrganizationId ?? ''}
        onValueChange={(value) => setActiveOrganizationId(value || null)}
        options={memberships.map((membership) => ({
          value: membership.organization_id,
          label: membership.organization?.name ?? 'Unbenannte Organisation',
        }))}
        triggerClassName={triggerClassName}
      />
    ) : null;

  const accountMenu = (align: 'start' | 'end', triggerClassName: string) => (
    <PremiumDropdownMenu
      open={userMenuOpen}
      onOpenChange={setUserMenuOpen}
      align={align}
      side="top"
      className="w-64"
      trigger={
        <button
          type="button"
          className={cn(
            'group flex w-full items-center gap-2.5 rounded-control border border-gray-200 bg-white px-2.5 text-left text-gray-700',
            'transition-colors duration-fast ease-premium hover:border-gray-300 hover:text-gray-950',
            portalFocusRing,
            triggerClassName,
          )}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-[11px] font-bold text-gray-600">
            {initialsOf(displayName)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12.5px] font-semibold leading-tight text-gray-950">{displayName}</span>
            {accountEmail ? (
              <span className="block truncate text-[10.5px] leading-tight text-gray-500">{accountEmail}</span>
            ) : null}
          </span>
          <ChevronDown
            size={13}
            aria-hidden="true"
            className="shrink-0 text-gray-400 transition-transform duration-fast ease-premium group-data-[state=open]:rotate-180 motion-reduce:transition-none"
          />
        </button>
      }
      groups={[
        {
          label: activeOrganization?.name ?? 'Keine Organisation verbunden',
          items: [
            {
              key: 'settings',
              label: 'Profil & Konto',
              description: accountEmail ?? undefined,
              icon: Settings,
              onSelect: () => navigate('/app/settings'),
            },
            {
              key: 'support',
              label: 'Support kontaktieren',
              icon: LifeBuoy,
              onSelect: () => navigate('/app/support'),
            },
            {
              key: 'website',
              label: 'Zur Website',
              icon: ExternalLink,
              onSelect: () => navigate('/'),
            },
          ],
        },
        {
          items: [
            {
              key: 'signout',
              label: 'Abmelden',
              icon: LogOut,
              onSelect: () => void handleSignOut(),
            },
          ],
        },
      ]}
    />
  );

  return (
    <div data-cq-surface="customer" className="min-h-screen bg-canvas text-gray-950">
      <a
        href="#portal-main"
        className="sr-only left-4 top-4 z-[60] rounded-control bg-gray-950 px-4 py-2.5 text-[13px] font-semibold text-white focus:not-sr-only focus:fixed focus:outline-none focus:ring-2 focus:ring-gray-950/25 focus:ring-offset-2"
      >
        Zum Inhalt springen
      </a>

      {/* ---------------------------------------------------------------- desktop rail */}
      <aside
        data-qa="customer-sidebar"
        style={{ width: RAIL_WIDTH_PX }}
        className="fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-hairline bg-white lg:flex"
      >
        <div className="flex flex-col gap-5 px-4 pb-5 pt-6">
          <Link
            to="/app"
            className={cn('group flex min-w-0 items-center gap-2.5 rounded-control', portalFocusRing)}
            aria-label="Cogniiq Kundenportal"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-gray-950 text-[13px] font-bold tracking-tight text-white">
              C
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[14px] font-semibold leading-tight tracking-tight text-gray-950">
                Cogniiq
              </span>
              <span className="block truncate text-[9.5px] font-bold uppercase leading-tight tracking-[0.18em] text-gray-500">
                Kundenportal
              </span>
            </span>
          </Link>

          <WorkspaceBlock
            organizationName={activeOrganization?.name ?? null}
            statusLabel={workspaceStatus.label}
            statusTone={workspaceStatus.tone}
            switcher={organizationSelect('', 'h-9 w-full text-[12.5px] font-semibold text-gray-950', 'w-full')}
          />
        </div>

        <nav
          aria-label="Kundenportal Navigation"
          className="min-h-0 flex-1 overflow-y-auto px-3 pb-4"
        >
          {navGroups.map((group, index) => (
            <div key={group.id} className={index === 0 ? undefined : 'mt-6'}>
              {index > 0 ? (
                <p className="mb-2 truncate px-2.5 text-[9.5px] font-bold uppercase tracking-[0.18em] text-gray-400">
                  {group.label}
                </p>
              ) : null}
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <RailNavLink
                      item={item}
                      active={isActiveItem(location.pathname, item)}
                      indicatorTransition={motionPresets.indicator}
                    />
                    {item.children?.length ? (
                      <ul className="mb-1 mt-0.5 space-y-0.5 border-l border-hairline pl-3 ml-4">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <RailChildLink
                              label={child.label}
                              href={child.href}
                              tone={child.tone}
                              active={location.pathname === child.href}
                            />
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 space-y-1.5 border-t border-hairline p-3">
          <RailNavLink
            item={{ label: 'Einstellungen', href: '/app/settings', icon: Settings }}
            active={isActiveItem(location.pathname, { href: '/app/settings' })}
            indicatorTransition={motionPresets.indicator}
          />
          {accountMenu('start', 'h-12')}
        </div>
      </aside>

      {/* ---------------------------------------------------------------- compact header */}
      <header className="sticky top-0 z-40 border-b border-hairline bg-white/85 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70 lg:hidden">
        <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/app" className={cn('flex min-w-0 items-center gap-2.5 rounded-control', portalFocusRing)}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-gray-950 text-[13px] font-bold text-white">
              C
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold leading-tight tracking-tight text-gray-950">
                {activeOrganization?.name ?? 'Cogniiq'}
              </span>
              <span className="block truncate text-[9.5px] font-bold uppercase leading-tight tracking-[0.18em] text-gray-500">
                Kundenportal
              </span>
            </span>
          </Link>

          <button
            ref={mobileTriggerRef}
            type="button"
            onClick={() => setMobileOpen(true)}
            className={cn(
              'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control border border-gray-200 bg-white text-gray-700',
              'transition-colors duration-fast ease-premium hover:border-gray-300 hover:text-gray-950',
              portalFocusRing,
            )}
            aria-label="Navigation öffnen"
            aria-expanded={mobileOpen}
          >
            <Menu size={18} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* ---------------------------------------------------------------- mobile drawer */}
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
              aria-label="Kundenportal Navigation"
              initial={motionPresets.reduce ? { opacity: 0 } : { x: '100%' }}
              animate={motionPresets.reduce ? { opacity: 1 } : { x: 0 }}
              exit={motionPresets.reduce ? { opacity: 0 } : { x: '100%' }}
              transition={motionPresets.reduce ? { duration: 0 } : { duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-y-0 right-0 flex w-[310px] max-w-[88vw] flex-col bg-white shadow-overlay"
            >
              <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-hairline px-4">
                <p className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-gray-500">Kundenportal</p>
                <button
                  ref={drawerCloseRef}
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'inline-flex h-11 w-11 items-center justify-center rounded-control text-gray-500 hover:bg-gray-100 hover:text-gray-950',
                    portalFocusRing,
                  )}
                  aria-label="Navigation schließen"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                <WorkspaceBlock
                  organizationName={activeOrganization?.name ?? null}
                  statusLabel={workspaceStatus.label}
                  statusTone={workspaceStatus.tone}
                  switcher={organizationSelect('-mobile', 'h-11 w-full text-sm font-medium text-gray-700', 'mt-3 w-full')}
                />

                <nav className="mt-5" aria-label="Mobile Kundenportal Navigation">
                  {navGroups.map((group, index) => (
                    <div key={group.id} className={index === 0 ? undefined : 'mt-6'}>
                      {index > 0 ? (
                        <p className="mb-2 truncate px-1 text-[9.5px] font-bold uppercase tracking-[0.18em] text-gray-400">
                          {group.label}
                        </p>
                      ) : null}
                      <ul className="space-y-1">
                        {group.items.map((item) => (
                          <li key={item.href}>
                            <MobileNavLink
                              item={item}
                              active={isActiveItem(location.pathname, item)}
                              onClick={() => setMobileOpen(false)}
                            />
                            {item.children?.length ? (
                              <ul className="mb-1 ml-4 mt-1 space-y-1 border-l border-hairline pl-3">
                                {item.children.map((child) => (
                                  <li key={child.href}>
                                    <MobileChildLink
                                      label={child.label}
                                      href={child.href}
                                      active={location.pathname === child.href}
                                      onClick={() => setMobileOpen(false)}
                                    />
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  <ul className="mt-6 space-y-1 border-t border-hairline pt-4">
                    <li>
                      <MobileNavLink
                        item={{ label: 'Einstellungen', href: '/app/settings', icon: Settings }}
                        active={isActiveItem(location.pathname, { href: '/app/settings' })}
                        onClick={() => setMobileOpen(false)}
                      />
                    </li>
                  </ul>
                </nav>
              </div>

              <div className="shrink-0 border-t border-hairline p-4">
                <p className="truncate text-sm font-semibold text-gray-950">{displayName}</p>
                {accountEmail ? <p className="mt-0.5 truncate text-xs text-gray-500">{accountEmail}</p> : null}
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

      {/* ---------------------------------------------------------------- content */}
      {/* max-w-[1080px] rather than the owner's full-bleed tables: an executive summary
          reads better at a bounded measure than stretched across a 1440px display. */}
      {/* The rail is fixed, so the content column reserves its width. This MUST NOT be an
          inline style — one here previously overrode the class and let the rail sit on top
          of the page text. */}
      <div className="lg:pl-[244px]">
        <main
          id="portal-main"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1080px] px-4 py-8 focus:outline-none sm:px-6 sm:py-10 lg:px-10 lg:py-12"
        >
          <AppRouteTransition routeKey={location.pathname}>{children}</AppRouteTransition>
        </main>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ navigation model */

/**
 * The six portal destinations, plus the customer's REAL projects as children of
 * "Projekte" (see `buildRailProjectChildren` for why no `/app/projects` index is
 * invented). "Einstellungen" is deliberately NOT here: it lives at the bottom of the
 * rail with the account control, where a settings entry belongs.
 */
function buildPortalNav(projects: Array<{ id: string; title: string; status: string }>): CustomerNavGroup {
  return {
    id: 'portal',
    label: 'Portal',
    items: [
      { label: 'Übersicht', href: '/app', icon: LayoutGrid },
      {
        label: 'Projekte',
        href: '/app',
        activePrefix: '/app/projects',
        icon: FolderKanban,
        children: buildRailProjectChildren(projects),
      },
      { label: 'Dokumente', href: '/app/documents', icon: FileText },
      { label: 'Abrechnung', href: '/app/billing', icon: CreditCard },
      { label: 'Lösungen', href: '/app/solutions', icon: Headphones },
      { label: 'Support', href: '/app/support', icon: LifeBuoy },
    ],
  };
}

type WorkspaceTone = CustomerWorkspaceTone;

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '·';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* ------------------------------------------------------------------ pieces */

const workspaceToneClasses: Record<WorkspaceTone, string> = {
  neutral: 'border-gray-200 bg-white text-gray-600',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  attention: 'border-amber-200 bg-amber-50 text-amber-800',
};

function WorkspaceBlock({
  organizationName,
  statusLabel,
  statusTone,
  switcher,
}: {
  organizationName: string | null;
  statusLabel: string;
  statusTone: WorkspaceTone;
  switcher: ReactNode;
}) {
  return (
    <div className="rounded-card border border-hairline bg-gray-50/70 p-3">
      <p className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-gray-500">Ihr Workspace</p>
      {/* break-words, not truncate: the organisation name is the customer's own company
          and deserves to be readable in full even when it is long and German. */}
      <p className="mt-1 break-words text-[14px] font-semibold leading-snug tracking-tight text-gray-950">
        {organizationName ?? 'Noch nicht provisioniert'}
      </p>
      <span
        className={cn(
          'mt-2 inline-flex max-w-full items-center truncate rounded-lg border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]',
          workspaceToneClasses[statusTone],
        )}
      >
        {statusLabel}
      </span>
      {switcher}
    </div>
  );
}

function RailNavLink({
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
        'relative flex min-h-10 items-center gap-2.5 overflow-hidden rounded-control px-2.5 text-[13px] font-semibold',
        'transition-colors duration-fast ease-premium',
        active ? 'text-white' : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-950',
        portalFocusRing,
      )}
    >
      {active ? (
        <motion.span
          layoutId="customer-rail-active"
          className="absolute inset-0 rounded-control bg-gray-950"
          transition={indicatorTransition}
        />
      ) : null}
      <Icon size={15} className={cn('relative z-10 shrink-0', active ? 'text-white' : 'text-gray-400')} aria-hidden="true" />
      <span className="relative z-10 truncate">{item.label}</span>
    </Link>
  );
}

const childToneDot: Record<'attention' | 'danger', string> = {
  attention: 'bg-amber-500',
  danger: 'bg-red-500',
};

function RailChildLink({
  label,
  href,
  active,
  tone,
}: {
  label: string;
  href: string;
  active: boolean;
  tone?: 'attention' | 'danger';
}) {
  return (
    <Link
      to={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex min-h-8 items-center gap-2 rounded-control px-2.5 py-1 text-[12px] font-medium leading-snug',
        'transition-colors duration-fast ease-premium',
        active ? 'bg-gray-100 text-gray-950' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-950',
        portalFocusRing,
      )}
    >
      {tone ? (
        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', childToneDot[tone])} aria-hidden="true" />
      ) : null}
      <span className="line-clamp-2">{label}</span>
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
      <Icon size={16} className={cn('relative z-10 shrink-0', active ? 'text-white' : 'text-gray-400')} aria-hidden="true" />
      <span className="relative z-10 truncate">{item.label}</span>
    </Link>
  );
}

function MobileChildLink({
  label,
  href,
  active,
  onClick,
}: {
  label: string;
  href: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      to={href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex min-h-11 items-center rounded-control px-3 text-[13px] font-medium leading-snug',
        'transition-colors duration-fast ease-premium',
        active ? 'bg-gray-100 text-gray-950' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-950',
        portalFocusRing,
      )}
    >
      <span className="line-clamp-2">{label}</span>
    </Link>
  );
}
