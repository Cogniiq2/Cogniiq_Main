import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, LogOut, Menu, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * The one premium application shell.
 *
 * Both authenticated surfaces — the internal Owner workspace (`/admin/*`) and the Customer portal
 * (`/app/*`) — render their primary navigation through this component, so they share one layout
 * system, one active-route treatment and one responsive contract while keeping entirely separate
 * navigation models.
 *
 * Responsive contract (three states, driven purely by CSS so there is no measure-then-paint jump):
 *
 *   ≥ 1024px (lg)  persistent vertical sidebar, 272px expanded / 80px collapsed by user choice
 *   768–1023px     persistent 80px vertical rail — icons plus tooltips, never a drawer over content
 *   < 768px        slim top bar, navigation opens as a left drawer
 *
 * The shell renders what it is given. It performs NO authorization: callers pass an already
 * filtered navigation model, so the visual layer can never become a second, divergent copy of the
 * access rules.
 */

/** Expanded sidebar width. Also the desktop content offset. */
export const SHELL_SIDEBAR_WIDTH = 272;
/** Collapsed rail width — the tablet width too. */
export const SHELL_RAIL_WIDTH = 80;

export interface ShellNavItem {
  key: string;
  label: string;
  href: string;
  icon?: LucideIcon;
  /** true when the current location belongs to this item. Computed by the caller. */
  active: boolean;
}

export interface ShellNavGroup {
  id: string;
  label: string;
  items: ShellNavItem[];
}

export interface ShellIdentityMenuItem {
  key: string;
  label: string;
  href: string;
  icon?: LucideIcon;
}

export interface ShellIdentity {
  displayName: string;
  email?: string | null;
  /** Organization / workspace context line shown under the profile. */
  organizationName?: string | null;
  menuItems?: readonly ShellIdentityMenuItem[];
  onSignOut: () => void;
  signOutLabel?: string;
}

export interface PremiumShellProps {
  brandTitle: string;
  brandSubtitle: string;
  /** Where the brand block links to. Omit for a non-interactive brand. */
  brandHref?: string;
  groups: readonly ShellNavGroup[];
  /** Accessible name of the primary navigation. */
  navLabel: string;
  identity: ShellIdentity;
  /** Organization switcher or similar context control. Expanded sidebar + drawer only. */
  contextSlot?: ReactNode;
  /** Small status indicator rendered next to the workspace context. */
  statusSlot?: ReactNode;
  /** Renders fixed-height navigation skeletons instead of items — no layout shift on resolve. */
  loading?: boolean;
  /** Distinguishes the shared active-indicator animation between shells. */
  indicatorId: string;
  /** localStorage key for the collapsed preference. */
  storageKey: string;
  children: ReactNode;
}

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Whether the viewer asked for reduced motion.
 *
 * Read directly from matchMedia at mount and kept in sync afterwards, rather than through
 * framer-motion's own hook, which resolves the preference once at module-evaluation time — so the
 * setting is honoured for the session it is actually set in, and the behaviour is verifiable.
 */
function useShellReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia(REDUCED_MOTION_QUERY).matches;
  });

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia(REDUCED_MOTION_QUERY);
    const onChange = () => setReduced(query.matches);
    setReduced(query.matches);
    query.addEventListener?.('change', onChange);
    return () => query.removeEventListener?.('change', onChange);
  }, []);

  return reduced;
}

function readCollapsedPreference(storageKey: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(storageKey) === 'collapsed';
  } catch {
    // Private mode / blocked storage: the preference is simply not persisted.
    return false;
  }
}

export function PremiumShell({
  brandTitle,
  brandSubtitle,
  brandHref,
  groups,
  navLabel,
  identity,
  contextSlot,
  statusSlot,
  loading = false,
  indicatorId,
  storageKey,
  children,
}: PremiumShellProps) {
  const { pathname } = useLocation();
  const prefersReducedMotion = useShellReducedMotion();
  const [collapsed, setCollapsed] = useState(() => readCollapsedPreference(storageKey));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const drawerTriggerRef = useRef<HTMLButtonElement | null>(null);
  const drawerTitleId = useId();

  const toggleCollapsed = useCallback(() => {
    setCollapsed((previous) => {
      const next = !previous;
      try {
        window.localStorage.setItem(storageKey, next ? 'collapsed' : 'expanded');
      } catch {
        /* preference is optional */
      }
      return next;
    });
  }, [storageKey]);

  // Selecting a route closes the drawer. Keyed on pathname so it also fires for a redirect.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Drawer behaviour: body scroll lock, Escape, outside click, focus trap, focus restoration.
  useEffect(() => {
    if (!drawerOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusablesIn = (root: HTMLElement) =>
      Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), select:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => element.offsetParent !== null || element === document.activeElement);

    // The panel mounts in the same tick in reduced-motion mode and one frame later otherwise;
    // querying lazily inside the handlers keeps both paths correct.
    const focusFirst = () => {
      const panel = drawerRef.current;
      if (!panel) return;
      const items = focusablesIn(panel);
      (items[0] ?? panel).focus();
    };
    const raf = window.requestAnimationFrame(focusFirst);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setDrawerOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const panel = drawerRef.current;
      if (!panel) return;
      const items = focusablesIn(panel);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!panel.contains(active)) {
        event.preventDefault();
        first.focus();
        return;
      }
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (drawerRef.current?.contains(target)) return;
      // The trigger toggles on click; closing here too would immediately reopen it.
      if (drawerTriggerRef.current?.contains(target)) return;
      setDrawerOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('mousedown', onPointerDown, true);
    document.addEventListener('touchstart', onPointerDown, true);

    return () => {
      window.cancelAnimationFrame(raf);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('mousedown', onPointerDown, true);
      document.removeEventListener('touchstart', onPointerDown, true);
      previouslyFocused?.focus?.();
    };
  }, [drawerOpen]);

  const visibleGroups = useMemo(() => groups.filter((group) => group.items.length > 0), [groups]);

  // `collapsed` only applies from lg up: 768–1023px is always the rail, because a 272px sidebar
  // plus real content does not fit there without either overlap or a horizontal scrollbar.
  const railOnly = (base: string, expanded: string) => (collapsed ? base : cn(base, expanded));

  return (
    // data-cq-surface opts this whole subtree — sidebar, topbar, drawer and content —
    // into the product motion tokens and the reduced-motion collapse defined in index.css.
    // The marketing tree never carries the attribute, so the public site is unaffected.
    <div data-cq-surface="shell" className="min-h-screen bg-canvas text-gray-950">
      <a
        href="#shell-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-xl focus:bg-gray-950 focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white"
      >
        Zum Inhalt springen
      </a>

      {/* ---------------------------------------------------------------- persistent sidebar */}
      <aside
        data-shell-nav="primary-desktop"
        data-shell-collapsed={collapsed ? 'true' : 'false'}
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden w-20 flex-col border-r border-gray-200/70 bg-white md:flex',
          collapsed ? '' : 'lg:w-[272px]'
        )}
      >
        <ShellBrand
          title={brandTitle}
          subtitle={brandSubtitle}
          href={brandHref}
          collapsed={collapsed}
          className={railOnly('justify-center px-2', 'lg:justify-between lg:px-4')}
          trailing={
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={collapsed ? 'Navigation ausklappen' : 'Navigation einklappen'}
              aria-pressed={collapsed}
              className="hidden h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950/40 lg:inline-flex"
            >
              {collapsed ? (
                <PanelLeftOpen size={17} aria-hidden="true" />
              ) : (
                <PanelLeftClose size={17} aria-hidden="true" />
              )}
            </button>
          }
        />

        <nav
          aria-label={navLabel}
          data-orientation="vertical"
          className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden py-3"
        >
          {loading ? (
            <ShellNavSkeleton collapsed={collapsed} />
          ) : (
            visibleGroups.map((group, index) => (
              <div key={group.id} className="flex flex-col">
                <p
                  className={cn(
                    'mt-2 truncate px-5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400',
                    collapsed ? 'hidden' : 'hidden lg:block'
                  )}
                >
                  {group.label}
                </p>
                {index > 0 ? (
                  <div
                    aria-hidden="true"
                    className={cn(
                      'mx-auto my-2 h-px w-8 rounded-full bg-gray-200',
                      collapsed ? '' : 'lg:hidden'
                    )}
                  />
                ) : null}
                <div className="flex flex-col gap-0.5 px-2">
                  {group.items.map((item) => (
                    <ShellNavLink
                      key={item.key}
                      item={item}
                      collapsed={collapsed}
                      indicatorId={indicatorId}
                      prefersReducedMotion={prefersReducedMotion}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </nav>

        <div className="border-t border-gray-100">
          {contextSlot ? (
            <div className={cn('px-3 pt-3', collapsed ? 'hidden' : 'hidden lg:block')}>{contextSlot}</div>
          ) : null}
          <SidebarIdentity
            identity={identity}
            collapsed={collapsed}
            statusSlot={statusSlot}
            contextSlot={contextSlot}
          />
        </div>
      </aside>

      {/* ---------------------------------------------------------------- content column */}
      <div className={cn('flex min-h-screen flex-col md:pl-20', collapsed ? '' : 'lg:pl-[272px]')}>
        {/* Slim mobile top bar. Carries no navigation items of its own — only the drawer trigger —
            so a viewport never presents two primary navigation systems at once. */}
        <header className="sticky top-0 z-30 flex min-h-14 items-center justify-between gap-3 border-b border-gray-100 bg-white/95 px-4 backdrop-blur-xl md:hidden">
          <ShellBrandMark title={brandTitle} subtitle={brandSubtitle} href={brandHref} />
          <button
            ref={drawerTriggerRef}
            type="button"
            onClick={() => setDrawerOpen((open) => !open)}
            aria-label={navLabel}
            aria-expanded={drawerOpen}
            aria-haspopup="dialog"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition-colors hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950/40"
          >
            <Menu size={18} aria-hidden="true" />
          </button>
        </header>

        <main id="shell-main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>

      {/* ---------------------------------------------------------------- mobile drawer */}
      <AnimatePresence>
        {drawerOpen ? (
          <div className="fixed inset-0 z-50 md:hidden" role="presentation">
            <motion.div
              aria-hidden="true"
              className="absolute inset-0 bg-gray-950/40"
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
            />
            <motion.div
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={drawerTitleId}
              data-shell-nav="primary-mobile"
              data-shell-motion={prefersReducedMotion ? 'reduced' : 'full'}
              tabIndex={-1}
              className="absolute inset-y-0 left-0 flex w-[300px] max-w-[86vw] flex-col border-r border-gray-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] outline-none"
              initial={prefersReducedMotion ? false : { x: -24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={prefersReducedMotion ? { opacity: 1 } : { x: -24, opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex min-h-14 items-center justify-between gap-3 border-b border-gray-100 px-4">
                <span id={drawerTitleId} className="min-w-0">
                  <span className="block truncate text-sm font-semibold tracking-tight text-gray-950">
                    {brandTitle}
                  </span>
                  <span className="block truncate text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                    {brandSubtitle}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Navigation schließen"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950/40"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>

              <nav
                aria-label={navLabel}
                data-orientation="vertical"
                className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2 py-3"
              >
                {loading ? (
                  <ShellNavSkeleton collapsed={false} />
                ) : (
                  visibleGroups.map((group) => (
                    <div key={group.id} className="flex flex-col">
                      <p className="mt-2 truncate px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
                        {group.label}
                      </p>
                      <div className="flex flex-col gap-0.5">
                        {group.items.map((item) => (
                          <ShellDrawerLink key={item.key} item={item} onNavigate={() => setDrawerOpen(false)} />
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </nav>

              <div className="border-t border-gray-100 px-3 py-3">
                {contextSlot ? <div className="pb-3">{contextSlot}</div> : null}
                <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3">
                  <p className="truncate text-sm font-semibold text-gray-950">{identity.displayName}</p>
                  {identity.email ? (
                    <p className="mt-0.5 truncate text-xs text-gray-500">{identity.email}</p>
                  ) : null}
                  {identity.organizationName ? (
                    <p className="mt-1.5 truncate text-[11px] font-medium text-gray-400">
                      {identity.organizationName}
                    </p>
                  ) : null}
                </div>
                <div className="mt-2 flex flex-col gap-0.5">
                  {(identity.menuItems ?? []).map((entry) => {
                    const Icon = entry.icon;
                    return (
                      <Link
                        key={entry.key}
                        to={entry.href}
                        onClick={() => setDrawerOpen(false)}
                        className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950/40"
                      >
                        {Icon ? <Icon size={16} className="text-gray-400" aria-hidden="true" /> : null}
                        <span className="truncate">{entry.label}</span>
                      </Link>
                    );
                  })}
                  <button
                    type="button"
                    onClick={identity.onSignOut}
                    className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950/40"
                  >
                    <LogOut size={16} className="text-gray-400" aria-hidden="true" />
                    {identity.signOutLabel ?? 'Abmelden'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ brand */

function ShellBrandMark({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle: string;
  href?: string;
}) {
  const content = (
    <>
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-sm font-bold tracking-tight text-gray-950 shadow-sm">
        {title.charAt(0).toUpperCase()}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold tracking-tight text-gray-950">{title}</span>
        <span className="block truncate text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
          {subtitle}
        </span>
      </span>
    </>
  );
  if (!href) return <span className="flex min-w-0 items-center gap-3">{content}</span>;
  return (
    <Link
      to={href}
      className="flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950/40"
    >
      {content}
    </Link>
  );
}

function ShellBrand({
  title,
  subtitle,
  href,
  collapsed,
  className,
  trailing,
}: {
  title: string;
  subtitle: string;
  href?: string;
  collapsed: boolean;
  className?: string;
  trailing?: ReactNode;
}) {
  const mark = (
    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-sm font-bold tracking-tight text-gray-950 shadow-sm">
      {title.charAt(0).toUpperCase()}
    </span>
  );
  const words = (
    <span className={cn('min-w-0', collapsed ? 'hidden' : 'hidden lg:block')}>
      <span className="block truncate text-sm font-semibold tracking-tight text-gray-950">{title}</span>
      <span className="block truncate text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
        {subtitle}
      </span>
    </span>
  );
  const inner = href ? (
    <Link
      to={href}
      title={title}
      className="flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950/40"
    >
      {mark}
      {words}
    </Link>
  ) : (
    <span className="flex min-w-0 items-center gap-3">
      {mark}
      {words}
    </span>
  );

  return (
    <div className={cn('flex min-h-16 items-center gap-2 border-b border-gray-100', className)}>
      {inner}
      {collapsed ? null : trailing}
    </div>
  );
}

/* ------------------------------------------------------------------ navigation links */

function ShellNavLink({
  item,
  collapsed,
  indicatorId,
  prefersReducedMotion,
}: {
  item: ShellNavItem;
  collapsed: boolean;
  indicatorId: string;
  prefersReducedMotion: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.href}
      aria-current={item.active ? 'page' : undefined}
      // The label is rendered twice — inline and as the rail tooltip — and exactly one of the two
      // is visible at any width. Naming the link explicitly (and hiding both copies from assistive
      // technology) keeps the accessible name identical in every responsive state.
      aria-label={item.label}
      className={cn(
        'group relative flex min-h-11 items-center gap-3 rounded-xl px-2.5 text-[13.5px] font-semibold transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950/40',
        'justify-center',
        collapsed ? '' : 'lg:justify-start lg:px-3',
        item.active ? 'text-white' : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-950 active:bg-gray-200/70'
      )}
    >
      {item.active ? (
        prefersReducedMotion ? (
          <span
            aria-hidden="true"
            data-shell-indicator="static"
            className="absolute inset-0 rounded-xl bg-gray-950 shadow-sm"
          />
        ) : (
          <motion.span
            aria-hidden="true"
            data-shell-indicator="animated"
            layoutId={`${indicatorId}-active`}
            className="absolute inset-0 rounded-xl bg-gray-950 shadow-sm"
            transition={{ type: 'spring', stiffness: 420, damping: 38, mass: 0.7 }}
          />
        )
      ) : null}

      {Icon ? (
        <Icon
          size={17}
          className={cn('relative z-10 flex-shrink-0', item.active ? 'text-white' : 'text-gray-400')}
          aria-hidden="true"
        />
      ) : null}

      <span
        aria-hidden="true"
        className={cn('relative z-10 min-w-0 truncate', collapsed ? 'hidden' : 'hidden lg:inline')}
      >
        {item.label}
      </span>

      {/* Collapsed / rail tooltip. Hidden as soon as the label itself is visible. */}
      <span
        aria-hidden="true"
        data-shell-tooltip=""
        className={cn(
          'pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-lg bg-gray-950 px-2.5 py-1.5 text-[12px] font-semibold text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none',
          collapsed ? '' : 'lg:hidden'
        )}
      >
        {item.label}
      </span>
    </Link>
  );
}

function ShellDrawerLink({ item, onNavigate }: { item: ShellNavItem; onNavigate: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.href}
      onClick={onNavigate}
      aria-current={item.active ? 'page' : undefined}
      className={cn(
        'relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors',
        item.active ? 'text-white' : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-950'
      )}
    >
      {item.active ? <span aria-hidden="true" className="absolute inset-0 rounded-xl bg-gray-950" /> : null}
      {Icon ? (
        <Icon
          size={17}
          className={cn('relative z-10 flex-shrink-0', item.active ? 'text-white' : 'text-gray-400')}
          aria-hidden="true"
        />
      ) : null}
      <span className="relative z-10 min-w-0 truncate">{item.label}</span>
    </Link>
  );
}

/* ------------------------------------------------------------------ skeleton */

function ShellNavSkeleton({ collapsed }: { collapsed: boolean }) {
  // Same 44px rhythm as a real item, so resolving the navigation never shifts the layout.
  return (
    <div className="flex flex-col gap-0.5 px-2" aria-hidden="true" data-testid="shell-nav-skeleton">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex min-h-11 items-center gap-3 rounded-xl px-2.5">
          <span className="h-[17px] w-[17px] flex-shrink-0 animate-pulse rounded-md bg-gray-200 motion-reduce:animate-none" />
          <span
            className={cn(
              'h-3 w-24 animate-pulse rounded-full bg-gray-200 motion-reduce:animate-none',
              collapsed ? 'hidden' : 'hidden lg:block'
            )}
          />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ identity footer */

function SidebarIdentity({
  identity,
  collapsed,
  statusSlot,
  contextSlot,
}: {
  identity: ShellIdentity;
  collapsed: boolean;
  statusSlot?: ReactNode;
  /** Rendered inside the menu only while the sidebar is a rail, where the inline copy is hidden. */
  contextSlot?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const initials = (identity.displayName.trim()[0] ?? 'C').toUpperCase();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative p-3">
      {statusSlot ? (
        <div className={cn('pb-2', collapsed ? 'hidden' : 'hidden lg:block')}>{statusSlot}</div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={identity.displayName}
        className={cn(
          'flex min-h-11 w-full items-center gap-2.5 rounded-xl border border-transparent px-2 text-left transition-colors hover:border-gray-200 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950/40',
          'justify-center',
          collapsed ? '' : 'lg:justify-start'
        )}
      >
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-950 text-[12px] font-bold text-white">
          {initials}
        </span>
        <span className={cn('min-w-0 flex-1', collapsed ? 'hidden' : 'hidden lg:block')}>
          <span className="block truncate text-[13px] font-semibold text-gray-950">{identity.displayName}</span>
          {identity.organizationName ? (
            <span className="block truncate text-[11px] font-medium text-gray-400">
              {identity.organizationName}
            </span>
          ) : identity.email ? (
            <span className="block truncate text-[11px] font-medium text-gray-400">{identity.email}</span>
          ) : null}
        </span>
        <ChevronDown
          size={14}
          className={cn('flex-shrink-0 text-gray-400', collapsed ? 'hidden' : 'hidden lg:block')}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          role="menu"
          // Anchored to the bottom-left of the sidebar and constrained to the viewport width, so it
          // is never clipped by the sidebar's own bounds in either rail or expanded state.
          className="absolute bottom-[calc(100%-0.25rem)] left-3 z-50 w-[248px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.14)]"
        >
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="truncate text-[13px] font-semibold text-gray-950">{identity.displayName}</p>
            {identity.email ? <p className="mt-0.5 truncate text-xs text-gray-500">{identity.email}</p> : null}
            {identity.organizationName ? (
              <p className="mt-1.5 truncate text-[11px] font-medium text-gray-400">{identity.organizationName}</p>
            ) : null}
          </div>
          {/* Rail widths hide the inline context control, so the menu carries it there instead —
              a multi-organization member never loses the switcher between 768px and 1023px. */}
          {contextSlot ? (
            <div className={cn('border-b border-gray-100 p-3', collapsed ? '' : 'lg:hidden')}>{contextSlot}</div>
          ) : null}
          <div className="p-1.5">
            {(identity.menuItems ?? []).map((entry) => {
              const Icon = entry.icon;
              return (
                <Link
                  key={entry.key}
                  to={entry.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-semibold text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950/40"
                >
                  {Icon ? <Icon size={15} className="text-gray-400" aria-hidden="true" /> : null}
                  <span className="truncate">{entry.label}</span>
                </Link>
              );
            })}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                identity.onSignOut();
              }}
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] font-semibold text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950/40"
            >
              <LogOut size={15} className="text-gray-400" aria-hidden="true" />
              {identity.signOutLabel ?? 'Abmelden'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
