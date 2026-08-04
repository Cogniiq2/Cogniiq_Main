import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, LogOut, Menu, X, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useMotionPresets } from '@/lib/motion';
import { focusRing } from './primitives';
import { PremiumDropdownMenu } from './premiumControls';
import { useAuth } from '@/contexts/AuthContext';

// The one Owner/Admin application shell.
//
// Layout model (unchanged navigation model, rebuilt presentation):
//   ≥ lg : a fixed 268px left rail carrying brand → module switch → module sub-navigation,
//          with a slim topbar holding page context and the account control. Global navigation,
//          module context and page content each get their own plane, so a dense financial page
//          never competes with the chrome around it.
//   < lg : the topbar stays, and the same rail content is presented as a slide-in drawer.
//
// The `sections` / `subNav` API is deliberately identical to before — routing, permission
// filtering and active-state logic all still live in pages/admin/internalNavigation.ts.

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

function AccountMenu() {
  const { profile, user, signOut } = useAuth();
  const email = profile?.email ?? user?.email ?? '\u2014';
  const initials = (email[0] ?? 'C').toUpperCase();

  // Radix owns focus return, Escape and outside-click. The previous hand-rolled menu
  // listened on the document and dropped focus to <body> when it closed.
  return (
    <PremiumDropdownMenu
      align="end"
      className="w-64"
      trigger={
        <button
          type="button"
          className={cn(
            'group inline-flex h-9 items-center gap-2 rounded-control border border-gray-200 bg-white pl-1.5 pr-2.5 text-[13px] font-semibold text-gray-700',
            'transition-colors duration-fast ease-premium hover:border-gray-300 hover:text-gray-950',
            focusRing,
          )}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-950 text-[11px] font-bold text-white">{initials}</span>
          <span className="hidden max-w-[160px] truncate sm:inline">{email}</span>
          <ChevronDown
            size={14}
            aria-hidden="true"
            className="text-gray-400 transition-transform duration-fast ease-premium group-data-[state=open]:rotate-180 motion-reduce:transition-none"
          />
        </button>
      }
      groups={[
        {
          label: 'Angemeldet als',
          items: [
            {
              key: 'signout',
              label: 'Abmelden',
              description: email,
              icon: LogOut,
              onSelect: () => void signOut(),
            },
          ],
        },
      ]}
    />
  );
}

function BrandMark({ title }: { title?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-gray-200 bg-white text-sm font-bold tracking-tight text-gray-950 shadow-sm">C</span>
      <span className="min-w-0">
        <span className="block truncate text-[13.5px] font-semibold leading-tight tracking-tight text-gray-950">Cogniiq</span>
        <span className="block truncate text-[10px] font-bold uppercase leading-tight tracking-[0.16em] text-gray-500">{title ?? 'Dashboard'}</span>
      </span>
    </div>
  );
}

function RailLabel({ children }: { children: ReactNode }) {
  return <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">{children}</p>;
}

/**
 * Rail item. The active state is unmistakable: a solid graphite chip for the module switch and a
 * filled tint plus a left marker for the current page inside a module — never colour alone.
 */
function RailLink({
  href, label, icon: Icon, active, variant, onNavigate, indicatorId, indicatorTransition,
}: {
  href: string;
  label: string;
  icon?: LucideIcon;
  active: boolean;
  variant: 'section' | 'sub';
  onNavigate?: () => void;
  indicatorId?: string;
  indicatorTransition?: object;
}) {
  return (
    <Link
      to={href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative flex min-h-10 items-center gap-2.5 overflow-hidden rounded-control px-3 text-[13px] font-semibold',
        'transition-colors duration-fast ease-premium',
        variant === 'section'
          ? active ? 'text-white' : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-950'
          : active ? 'text-gray-950' : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-950',
        focusRing,
      )}
    >
      {active && variant === 'section' ? (
        indicatorId ? (
          <motion.span layoutId={indicatorId} transition={indicatorTransition} className="absolute inset-0 rounded-control bg-gray-950" />
        ) : (
          <span className="absolute inset-0 rounded-control bg-gray-950" />
        )
      ) : null}
      {active && variant === 'sub' ? <span className="absolute inset-0 rounded-control bg-gray-100" /> : null}
      {active && variant === 'sub' ? <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-gray-950" aria-hidden="true" /> : null}
      {Icon ? (
        <Icon
          size={15}
          className={cn('relative z-10 shrink-0', active ? (variant === 'section' ? 'text-white' : 'text-gray-950') : 'text-gray-400')}
          aria-hidden="true"
        />
      ) : null}
      <span className="relative z-10 truncate">{label}</span>
    </Link>
  );
}

function RailContent({
  sections, subNav, subNavLabel, isSubActive, onNavigate, indicatorId, indicatorTransition,
}: {
  sections: ShellSection[];
  subNav?: ShellSubNavItem[];
  subNavLabel?: string;
  isSubActive: (href: string) => boolean;
  onNavigate?: () => void;
  indicatorId?: string;
  indicatorTransition?: object;
}) {
  return (
    <>
      <nav aria-label="Bereiche">
        <RailLabel>Bereiche</RailLabel>
        <div className="space-y-0.5">
          {sections.map((s) => (
            <RailLink
              key={s.key}
              href={s.href}
              label={s.label}
              icon={s.icon}
              active={s.active}
              variant="section"
              onNavigate={onNavigate}
              indicatorId={indicatorId}
              indicatorTransition={indicatorTransition}
            />
          ))}
        </div>
      </nav>

      {subNav && subNav.length ? (
        <nav className="mt-6 border-t border-hairline pt-4" aria-label={subNavLabel ?? 'Navigation'}>
          <RailLabel>{subNavLabel ?? 'Navigation'}</RailLabel>
          <div className="space-y-0.5">
            {subNav.map((item) => (
              <RailLink
                key={item.key}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={isSubActive(item.href)}
                variant="sub"
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </nav>
      ) : null}
    </>
  );
}

export function DashboardShell({
  sections, subNav, subNavLabel, activeSubKey, title, children,
}: {
  sections: ShellSection[];
  subNav?: ShellSubNavItem[];
  subNavLabel?: string;
  activeSubKey?: (pathname: string, href: string) => boolean;
  title?: string;
  children: ReactNode;
}) {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const motionPresets = useMotionPresets();

  const isSubActive = (href: string) =>
    activeSubKey ? activeSubKey(pathname, href) : pathname === href || pathname.startsWith(`${href}/`);

  const activeSection = sections.find((s) => s.active);
  const activeSubItem = subNav?.find((item) => isSubActive(item.href));

  // Close the drawer on navigation and lock the background scroll while it is open.
  useEffect(() => { setMobileOpen(false); }, [pathname]);
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setMobileOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', onKey); };
  }, [mobileOpen]);

  return (
    <div data-cq-surface="owner" className="min-h-screen bg-canvas text-gray-950">
      {/* With a 16-item rail, a keyboard user would otherwise re-traverse the whole
          navigation on every page. */}
      <a
        href="#dashboard-main"
        className="sr-only left-4 top-4 z-[60] rounded-control bg-gray-950 px-4 py-2.5 text-[13px] font-semibold text-white focus:not-sr-only focus:fixed focus:outline-none focus:ring-2 focus:ring-gray-950/25 focus:ring-offset-2"
      >
        Zum Inhalt springen
      </a>
      {/* Desktop rail */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[268px] flex-col border-r border-hairline bg-white lg:flex">
        <div className="flex h-16 shrink-0 items-center border-b border-hairline px-5">
          <BrandMark title={title} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
          <RailContent
            sections={sections}
            subNav={subNav}
            subNavLabel={subNavLabel}
            isSubActive={isSubActive}
            indicatorId="dashboard-section-active"
            indicatorTransition={motionPresets.indicator}
          />
        </div>
      </aside>

      <div className="lg:pl-[268px]">
        {/* Topbar */}
        <header className="sticky top-0 z-20 border-b border-hairline bg-white/85 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70">
          <div className="mx-auto flex h-16 max-w-[1360px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className={cn(
                  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-gray-200 bg-white text-gray-600 lg:hidden',
                  'transition-colors duration-fast ease-premium hover:border-gray-300 hover:text-gray-950',
                  focusRing,
                )}
                aria-label="Navigation öffnen"
                aria-expanded={mobileOpen}
              >
                <Menu size={17} aria-hidden="true" />
              </button>

              {/* Brand on mobile (the rail carries it on desktop); module context on desktop. */}
              <div className="lg:hidden"><BrandMark title={title} /></div>
              <nav aria-label="Aktueller Pfad" className="hidden min-w-0 items-center gap-2 lg:flex">
                <span className="truncate text-[13px] font-semibold text-gray-950">{activeSection?.label ?? title ?? 'Dashboard'}</span>
                {activeSubItem ? (
                  <>
                    <span className="text-gray-300" aria-hidden="true">/</span>
                    <span className="truncate text-[13px] font-medium text-gray-500">{activeSubItem.label}</span>
                  </>
                ) : null}
              </nav>
            </div>

            <AccountMenu />
          </div>
        </header>

        <main id="dashboard-main" tabIndex={-1} className="mx-auto w-full max-w-[1360px] px-4 py-7 focus:outline-none sm:px-6 sm:py-8 lg:px-8">{children}</main>
      </div>

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
              aria-label="Navigation"
              initial={motionPresets.reduce ? { opacity: 0 } : { x: '-100%' }}
              animate={motionPresets.reduce ? { opacity: 1 } : { x: 0 }}
              exit={motionPresets.reduce ? { opacity: 0 } : { x: '-100%' }}
              transition={motionPresets.reduce ? { duration: 0 } : { duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-y-0 left-0 flex w-[290px] max-w-[86vw] flex-col bg-white shadow-overlay"
            >
              <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-hairline px-4">
                <BrandMark title={title} />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className={cn('inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-gray-500 hover:bg-gray-100 hover:text-gray-950', focusRing)}
                  aria-label="Navigation schließen"
                >
                  <X size={17} aria-hidden="true" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
                <RailContent
                  sections={sections}
                  subNav={subNav}
                  subNavLabel={subNavLabel}
                  isSubActive={isSubActive}
                  onNavigate={() => setMobileOpen(false)}
                />
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
