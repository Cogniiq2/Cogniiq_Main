import { useEffect, useId, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, useReducedMotion } from 'framer-motion';
import { Menu, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';

import { RailScroller } from '@/components/navigation/RailScroller';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  NAV_DURATION_MS,
  NAV_EASE,
  NAV_EASE_CSS,
  NAV_WIDTH_COLLAPSED,
  NAV_WIDTH_EXPANDED,
  type SidebarNavGroup,
} from '@/components/navigation/navModel';

// The shared premium navigation rail behind both authenticated surfaces (customer portal and the
// internal/owner workspace). It owns layout, motion, collapse, tooltips, the mobile drawer and the
// accessibility contract. It owns NO routing, entitlement or authorization logic: callers pass
// already-resolved groups, so each surface keeps its own routes and permission boundaries.

interface SlotContext {
  collapsed: boolean;
  /**
   * Desktop rail and mobile drawer are mounted at the same time (CSS decides which is visible), so
   * slots that render form controls must derive unique ids/names from this.
   */
  variant: 'desktop' | 'mobile';
}

export interface SidebarShellProps {
  /** Small caps label under the Cogniiq wordmark, e.g. 'Kundenbereich'. */
  surfaceLabel: string;
  /** Where the brand mark links to. */
  brandHref: string;
  brandAriaLabel?: string;
  groups: SidebarNavGroup[];
  /** Accessible name for the <nav> landmark. */
  navLabel: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  /** Rendered directly under the brand block (workspace switcher, status). */
  topSlot?: (context: SlotContext) => ReactNode;
  /** Rendered at the very bottom of the rail — account and session controls. */
  footerSlot?: (context: SlotContext) => ReactNode;
  children: ReactNode;
}

export function SidebarShell({
  surfaceLabel,
  brandHref,
  brandAriaLabel,
  groups,
  navLabel,
  collapsed,
  onToggleCollapse,
  topSlot,
  footerSlot,
  children,
}: SidebarShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const reduceMotion = useReducedMotion();
  const instanceId = useId();

  // Close the drawer on navigation so tapping a link never leaves the overlay covering the page.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Resizing up to the desktop breakpoint hides the drawer via CSS; without this it would stay
  // "open" and leave Radix's body-scroll lock engaged on a page that no longer shows it.
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)');
    const sync = () => {
      if (query.matches) setMobileOpen(false);
    };
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  // The rail must render at its persisted width on the first paint, never transition into it.
  // Enabling the transition one frame later keeps collapsing smooth without an on-load slide.
  const [animateWidth, setAnimateWidth] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimateWidth(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const width = collapsed ? NAV_WIDTH_COLLAPSED : NAV_WIDTH_EXPANDED;
  const transitions = animateWidth && !reduceMotion;
  const transitionStyle: CSSProperties = transitions
    ? { transitionDuration: `${NAV_DURATION_MS}ms`, transitionTimingFunction: NAV_EASE_CSS }
    : {};

  return (
    <TooltipProvider delayDuration={120} skipDelayDuration={300}>
      <div
        // Scopes the authenticated dashboard design tokens (see index.css + dashboard/tokens.ts).
        // This root is shared by the customer portal shell and the internal workspace shell, so it
        // is the single place both surfaces opt in — and public pages never mount it.
        // The canvas value is unchanged (#f7f7f4), so the approved sidebar renders identically.
        data-cq-surface="dashboard"
        className="min-h-screen bg-[var(--cq-canvas)] text-[var(--cq-fg)]"
        style={{ '--nav-w': `${width}px` } as CSSProperties}
      >
        {/* ---------------------------------------------------------------- desktop rail */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 hidden w-[var(--nav-w)] flex-col overflow-hidden border-r border-gray-200/80 bg-white lg:flex',
            transitions && 'transition-[width]',
          )}
          style={transitionStyle}
        >
          <RailContent
            instanceId={`${instanceId}-desktop`}
            surfaceLabel={surfaceLabel}
            brandHref={brandHref}
            brandAriaLabel={brandAriaLabel}
            groups={groups}
            navLabel={navLabel}
            collapsed={collapsed}
            onToggleCollapse={onToggleCollapse}
            topSlot={topSlot}
            footerSlot={footerSlot}
            reduceMotion={Boolean(reduceMotion)}
            variant="desktop"
            withTooltips
          />
        </aside>

        {/* ---------------------------------------------------------------- mobile header
            The trigger and the desktop rail share ONE breakpoint (lg). Splitting them would leave
            768-1023px with no navigation at all. */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-gray-200/80 bg-white/95 px-4 backdrop-blur-xl sm:px-6 lg:hidden">
          <Link to={brandHref} className="flex min-w-0 items-center gap-2.5" aria-label={brandAriaLabel ?? 'Cogniiq'}>
            <BrandMark />
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold tracking-tight text-gray-950">Cogniiq</span>
              <span className="block truncate text-[9px] font-bold uppercase tracking-[0.18em] text-gray-400">
                {surfaceLabel}
              </span>
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label={navLabel}
            aria-expanded={mobileOpen}
            className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition-colors duration-150 hover:border-gray-300 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950/25 focus-visible:ring-offset-2"
          >
            <Menu size={18} aria-hidden="true" />
          </button>
        </header>

        {/* ---------------------------------------------------------------- mobile drawer
            Radix Dialog supplies the focus trap, Escape handling, outside-click close and
            body-scroll lock, so this surface does not reimplement any of them. */}
        <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-gray-950/25 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 lg:hidden" />
            <Dialog.Content
              className="fixed inset-y-0 left-0 z-50 flex w-[300px] max-w-[86vw] flex-col overflow-hidden border-r border-gray-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.16)] duration-200 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:animate-in data-[state=open]:slide-in-from-left lg:hidden"
              aria-describedby={undefined}
            >
              <Dialog.Title className="sr-only">{navLabel}</Dialog.Title>
              <Dialog.Close
                className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition-colors duration-150 hover:bg-gray-50 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950/25"
                aria-label="Navigation schließen"
              >
                <X size={17} aria-hidden="true" />
              </Dialog.Close>
              <RailContent
                instanceId={`${instanceId}-mobile`}
                surfaceLabel={surfaceLabel}
                brandHref={brandHref}
                brandAriaLabel={brandAriaLabel}
                groups={groups}
                navLabel={navLabel}
                collapsed={false}
                topSlot={topSlot}
                footerSlot={footerSlot}
                reduceMotion={Boolean(reduceMotion)}
                variant="mobile"
              />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* ---------------------------------------------------------------- content */}
        <div
          className={cn('lg:pl-[var(--nav-w)]', transitions && 'transition-[padding-left]')}
          style={transitionStyle}
        >
          <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}

function BrandMark() {
  return (
    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gray-950 text-[13px] font-bold tracking-tight text-white shadow-[0_1px_2px_rgba(15,23,42,0.16)]">
      C
    </span>
  );
}

function RailContent({
  instanceId,
  surfaceLabel,
  brandHref,
  brandAriaLabel,
  groups,
  navLabel,
  collapsed,
  onToggleCollapse,
  topSlot,
  footerSlot,
  reduceMotion,
  withTooltips = false,
  variant,
}: {
  instanceId: string;
  surfaceLabel: string;
  brandHref: string;
  brandAriaLabel?: string;
  groups: SidebarNavGroup[];
  navLabel: string;
  collapsed: boolean;
  onToggleCollapse?: () => void;
  topSlot?: (context: SlotContext) => ReactNode;
  footerSlot?: (context: SlotContext) => ReactNode;
  reduceMotion: boolean;
  withTooltips?: boolean;
  variant: 'desktop' | 'mobile';
}) {
  return (
    <>
      {/* Brand — pinned at the top, aligned to the same 16px optical gutter as the items below. */}
      <div
        className={cn(
          'flex h-16 flex-shrink-0 items-center border-b border-gray-100',
          collapsed ? 'justify-center px-0' : 'px-4',
        )}
      >
        <Link
          to={brandHref}
          aria-label={brandAriaLabel ?? 'Cogniiq'}
          className="group flex min-w-0 items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950/25 focus-visible:ring-offset-2"
        >
          <BrandMark />
          <RailLabel collapsed={collapsed} reduceMotion={reduceMotion}>
            <span className="block truncate text-[13.5px] font-semibold tracking-tight text-gray-950">Cogniiq</span>
            <span className="block truncate text-[9px] font-bold uppercase tracking-[0.18em] text-gray-400">
              {surfaceLabel}
            </span>
          </RailLabel>
        </Link>
      </div>

      {topSlot ? <div className="flex-shrink-0">{topSlot({ collapsed, variant })}</div> : null}

      {/* `min-h-0` is what lets this flex child actually shrink; without it the rail
          grows past the viewport and the footer (account, collapse) is pushed off
          screen instead of the navigation scrolling. */}
      <nav aria-label={navLabel} className="flex min-h-0 flex-1 flex-col">
        <RailScroller viewportClassName={cn('py-3', collapsed ? 'px-2.5' : 'px-3')}>
          {groups.map((group, groupIndex) => (
            <div key={group.id} className={groupIndex > 0 ? 'mt-5' : undefined}>
              {group.label ? (
                collapsed ? (
                  // Collapsed rails trade the section label for a hairline rule: the grouping stays
                  // legible without a cramped, unreadable caption.
                  <div className="mx-auto mb-2 mt-1 h-px w-6 bg-gray-200" aria-hidden="true" />
                ) : (
                  <p className="mb-1.5 truncate px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
                    {group.label}
                  </p>
                )
              ) : null}

              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.key}>
                    <NavRow
                      instanceId={instanceId}
                      item={item}
                      collapsed={collapsed}
                      reduceMotion={reduceMotion}
                      withTooltip={withTooltips && collapsed}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </RailScroller>
      </nav>

      <div className="flex-shrink-0 border-t border-gray-100">
        {onToggleCollapse ? (
          <div className={cn('py-2', collapsed ? 'px-2.5' : 'px-3')}>
            <CollapseToggle
              collapsed={collapsed}
              onToggle={onToggleCollapse}
              withTooltip={withTooltips}
              reduceMotion={reduceMotion}
            />
          </div>
        ) : null}
        {footerSlot ? footerSlot({ collapsed, variant }) : null}
      </div>
    </>
  );
}

/**
 * Labels fade and slide rather than reflow, so collapsing the rail never squeezes text mid-transition.
 * `w-0` while collapsed keeps them out of the flex measurement entirely.
 */
function RailLabel({
  collapsed,
  reduceMotion,
  children,
}: {
  collapsed: boolean;
  reduceMotion: boolean;
  children: ReactNode;
}) {
  return (
    <span
      aria-hidden={collapsed}
      className={cn(
        'min-w-0 overflow-hidden whitespace-nowrap text-left',
        collapsed ? 'pointer-events-none w-0 -translate-x-1 opacity-0' : 'w-auto flex-1 translate-x-0 opacity-100',
        reduceMotion ? '' : 'transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
      )}
    >
      {children}
    </span>
  );
}

function NavRow({
  instanceId,
  item,
  collapsed,
  reduceMotion,
  withTooltip,
}: {
  instanceId: string;
  item: SidebarNavGroup['items'][number];
  collapsed: boolean;
  reduceMotion: boolean;
  withTooltip: boolean;
}) {
  const Icon = item.icon;

  const link = (
    <Link
      to={item.href}
      // A leaf destination defaults to 'page'; callers downgrade containing sections to 'true'.
      aria-current={item.active ? item.current ?? 'page' : undefined}
      className={cn(
        // 44px touch targets below lg (the drawer); the denser 38px rail applies from lg up.
        'group relative flex min-h-[44px] items-center rounded-lg text-[13.5px] font-medium outline-none lg:min-h-[38px] lg:text-[13px]',
        'transition-colors duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]',
        'focus-visible:ring-2 focus-visible:ring-gray-950/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
        collapsed ? 'justify-center px-0' : 'gap-3 px-3',
        item.active
          ? 'font-semibold text-gray-950'
          : 'text-gray-500 hover:bg-gray-100/70 hover:text-gray-950 active:bg-gray-200/60',
      )}
    >
      {item.active ? (
        <motion.span
          layoutId={`${instanceId}-nav-active`}
          className="absolute inset-0 rounded-lg bg-gray-100 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.04)]"
          transition={reduceMotion ? { duration: 0 } : { duration: NAV_DURATION_MS / 1000, ease: NAV_EASE }}
        >
          {/* Accent bar travels with the pill, so the active position stays instantly readable. */}
          <span className="absolute left-0 top-1/2 h-4 w-[2.5px] -translate-y-1/2 rounded-r-full bg-gray-950" />
        </motion.span>
      ) : null}

      {Icon ? (
        <Icon
          size={17}
          strokeWidth={item.active ? 2.15 : 1.85}
          aria-hidden="true"
          className={cn(
            'relative z-10 flex-shrink-0 transition-colors duration-150',
            item.active ? 'text-gray-950' : 'text-gray-400 group-hover:text-gray-700',
          )}
        />
      ) : null}

      <RailLabel collapsed={collapsed} reduceMotion={reduceMotion}>
        <span className="relative z-10 block truncate">{item.label}</span>
      </RailLabel>

      {/* Collapsed rails hide the label visually but must keep it for screen readers. */}
      {collapsed ? <span className="sr-only">{item.label}</span> : null}
    </Link>
  );

  if (!withTooltip) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={10} className="bg-gray-950 text-[12px] font-medium text-white">
        {item.label}
      </TooltipContent>
    </Tooltip>
  );
}

function CollapseToggle({
  collapsed,
  onToggle,
  withTooltip,
  reduceMotion,
}: {
  collapsed: boolean;
  onToggle: () => void;
  withTooltip: boolean;
  reduceMotion: boolean;
}) {
  const label = collapsed ? 'Navigation ausklappen' : 'Navigation einklappen';
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose;

  const button = (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      aria-expanded={!collapsed}
      className={cn(
        'flex min-h-[38px] w-full items-center rounded-lg text-[12.5px] font-medium text-gray-500 outline-none',
        'transition-colors duration-150 hover:bg-gray-100/70 hover:text-gray-950 active:bg-gray-200/60',
        'focus-visible:ring-2 focus-visible:ring-gray-950/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
        collapsed ? 'justify-center px-0' : 'gap-3 px-3',
      )}
    >
      <Icon size={17} strokeWidth={1.85} aria-hidden="true" className="flex-shrink-0 text-gray-400" />
      <RailLabel collapsed={collapsed} reduceMotion={reduceMotion}>
        <span className="block truncate">Einklappen</span>
      </RailLabel>
    </button>
  );

  if (!withTooltip) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={10} className="bg-gray-950 text-[12px] font-medium text-white">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
