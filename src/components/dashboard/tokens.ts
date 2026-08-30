/**
 * Authenticated dashboard design foundation.
 *
 * Scope: this file is the single source of truth for the *authenticated* Cogniiq surfaces —
 * the customer portal (/app/*) and the internal workspace (/admin/*, incl. owner finance).
 * It is deliberately NOT global CSS: everything here is either a Tailwind class recipe consumed
 * by a dashboard primitive, or a custom property defined under the `[data-cq-surface="dashboard"]`
 * scope in index.css. Public marketing pages never mount that scope, so nothing can leak.
 *
 * Character: precise, calm, dense enough for professional work. Restrained radii, hairline
 * borders, controlled elevation, application-scale typography (no marketing headings), and
 * motion that is short, interruptible and opacity/transform based.
 */

/* ------------------------------------------------------------------ Motion */

/**
 * Premium decelerate curve. One easing across the whole dashboard so dropdowns, dialogs,
 * tabs and drawers share a single physical character.
 */
export const dashEase: [number, number, number, number] = [0.2, 0, 0, 1];

/** Milliseconds. Kept inside the 140–200ms interaction band; `slow` is for overlays only. */
export const dashDuration = {
  fast: 140,
  base: 180,
  slow: 240,
} as const;

/** Framer Motion transition presets. Seconds, because Framer expects seconds. */
export const dashMotion = {
  fast: { duration: dashDuration.fast / 1000, ease: dashEase },
  base: { duration: dashDuration.base / 1000, ease: dashEase },
  slow: { duration: dashDuration.slow / 1000, ease: dashEase },
} as const;

/* ------------------------------------------------------------------ Radii */

/**
 * Restrained and consistent. The previous system mixed 12/16/20px which read as soft and
 * generic; the dashboard now tops out at 12px so surfaces feel structured rather than pill-like.
 */
export const radius = {
  sm: 'rounded-[6px]',
  md: 'rounded-[8px]',
  lg: 'rounded-[10px]',
  xl: 'rounded-[12px]',
  full: 'rounded-full',
} as const;

/* ------------------------------------------------------------------ Borders & surfaces */

export const border = {
  hairline: 'border border-[var(--cq-border)]',
  hairlineB: 'border-b border-[var(--cq-border)]',
  hairlineT: 'border-t border-[var(--cq-border)]',
  strong: 'border border-[var(--cq-border-strong)]',
  /** Row separation inside tables/lists — lighter than a container edge. */
  subtle: 'border-[var(--cq-border-subtle)]',
} as const;

export const surface = {
  /** Page canvas. Owned by the shells. */
  canvas: 'bg-[var(--cq-canvas)]',
  /** Default informational container. Flat: border only, no shadow. */
  card: `bg-[var(--cq-surface)] ${border.hairline} ${radius.xl}`,
  /** Raised container — used sparingly, for genuinely elevated content. */
  raised: `bg-[var(--cq-surface)] ${border.hairline} ${radius.xl} shadow-[var(--cq-elev-1)]`,
  /** Overlay surface: menus, dialogs, drawers. */
  overlay: `bg-[var(--cq-surface)] ${border.hairline} shadow-[var(--cq-elev-3)]`,
  /** Recessed area — empty states, inline groupings, read-only blocks. */
  sunken: `bg-[var(--cq-sunken)] ${border.hairline} ${radius.xl}`,
} as const;

export const elevation = {
  none: '',
  e1: 'shadow-[var(--cq-elev-1)]',
  e2: 'shadow-[var(--cq-elev-2)]',
  e3: 'shadow-[var(--cq-elev-3)]',
} as const;

/* ------------------------------------------------------------------ Typography */

/**
 * Application scale. The ceiling is 20px: a dashboard page title is a wayfinding label, not a
 * marketing headline. (The customer portal previously ran up to 44px — the public site's scale.)
 */
export const text = {
  pageTitle: 'text-[21px] font-semibold leading-7 tracking-[-0.018em] text-[var(--cq-fg)]',
  sectionTitle: 'text-[13px] font-semibold leading-5 tracking-[-0.004em] text-[var(--cq-fg)]',
  cardTitle: 'text-[14px] font-semibold leading-5 tracking-[-0.004em] text-[var(--cq-fg)]',
  body: 'text-[13px] leading-5 text-[var(--cq-fg-muted)]',
  bodyStrong: 'text-[13px] leading-5 font-medium text-[var(--cq-fg)]',
  label: 'text-[12px] font-medium leading-4 text-[var(--cq-fg-muted)]',
  hint: 'text-[11.5px] leading-4 text-[var(--cq-fg-subtle)]',
  /** Column headers and metric labels. Tracking is 0.04em — not the 0.22em marketing eyebrow. */
  eyebrow:
    'text-[11px] font-medium uppercase leading-4 tracking-[0.04em] text-[var(--cq-fg-subtle)]',
  metric: 'text-[22px] font-semibold leading-7 tracking-[-0.02em] tabular-nums text-[var(--cq-fg)]',
  /** The one figure a summary band leads with. Used sparingly — once per band. */
  metricLead: 'text-[27px] font-semibold leading-8 tracking-[-0.028em] tabular-nums text-[var(--cq-fg)]',
  /** Secondary figures inside a summary band: readable at a glance, not shouting. */
  metricSm: 'text-[17px] font-semibold leading-6 tracking-[-0.016em] tabular-nums text-[var(--cq-fg)]',
  numeric: 'tabular-nums',
} as const;

/* ------------------------------------------------------------------ Spacing rhythm */

/** 4px base. Page/section/card rhythm is fixed so no two pages drift apart. */
export const space = {
  pageGap: 'space-y-6',
  sectionGap: 'space-y-4',
  cardPadding: 'p-5',
  cardPaddingTight: 'p-4',
  /** Horizontal cell padding — shared by table headers and cells so columns align exactly. */
  cellX: 'px-4',
  cellY: 'py-2.5',
} as const;

/** Content width. One value, so pages cannot drift to arbitrary containers. */
export const layout = {
  contentMax: 'max-w-[1440px]',
} as const;

/* ------------------------------------------------------------------ Interactive states */

/**
 * One focus treatment across the entire dashboard. Always visible, never removed —
 * `focus-visible` so pointer users don't see rings on click.
 */
export const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cq-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--cq-canvas)]';

/** For controls sitting on a white surface rather than the canvas. */
export const focusRingOnSurface =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cq-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--cq-surface)]';

export const interactive = {
  /** Colour-only transition: never animates layout. */
  transition: 'transition-colors duration-fast ease-premium',
  hoverRow: 'hover:bg-[var(--cq-hover)]',
  disabled: 'disabled:cursor-not-allowed disabled:opacity-50',
  /**
   * Tactile press. Buttons and clickable rows answer a pointer-down within one
   * frame with a 1px sink instead of waiting for the network — the whole reason
   * the interface reads as responsive rather than merely fast.
   *
   * `transform` is on the compositor, so this never triggers layout, and the
   * reduced-motion block in index.css collapses its duration to 1ms.
   */
  press: 'transition-[background-color,border-color,color,transform] duration-fast ease-premium active:translate-y-px',
} as const;

/**
 * Card/panel rhythm for the workspace grids.
 *
 * Every recipe starts at an explicit `grid-cols-1`, which is `minmax(0, 1fr)`. A bare
 * `grid` leaves the single implicit column at max-content, so one wide child — a chart,
 * a long row, a nowrap amount — silently widens the track and gives the whole page a
 * horizontal scrollbar on a phone.
 *
 * The Admin Center used one 4-up grid of identical cards on every page, which is
 * why every page looked like every other page. These are the two compositions
 * that replaced it: an asymmetric main/side split for a workspace, and a
 * three-band split for a landing surface.
 */
export const grid = {
  /** Main work area with a narrower context column. Collapses under xl. */
  workspace: 'grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]',
  /** Two equal halves. Collapses under lg. */
  halves: 'grid grid-cols-1 gap-4 lg:grid-cols-2',
  /** Attention-first landing: a wide primary column and a narrower rail. */
  landing: 'grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]',
} as const;

/**
 * Control heights. 36px is the dense default; 40px is used for form inputs so touch targets
 * stay comfortable on phones. Nothing in the dashboard is shorter than 32px.
 */
export const control = {
  sm: 'h-8 px-2.5 text-[12.5px]',
  md: 'h-9 px-3 text-[13px]',
  lg: 'h-10 px-3 text-[13px]',
} as const;

/* ------------------------------------------------------------------ Status & data colours */

/**
 * Status tones. Used by badges, banners and metric deltas alike so a given semantic never
 * changes colour between surfaces.
 */
export const statusTone = {
  neutral: 'border-[var(--cq-border)] bg-[var(--cq-sunken)] text-[var(--cq-fg-muted)]',
  accent: 'border-[var(--cq-accent-border)] bg-[var(--cq-accent-weak)] text-[var(--cq-accent-fg)]',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-red-200 bg-red-50 text-red-700',
  info: 'border-sky-200 bg-sky-50 text-sky-700',
} as const;

export type StatusToneKey = keyof typeof statusTone;

/**
 * Chart palette. Restrained and Cogniiq-compatible: graphite leads, accents are muted and
 * ordered by perceptual distance so the first three series stay separable.
 * Consumed in P4 when the finance charts are recomposed.
 */
export const chartPalette = [
  'var(--cq-chart-1)',
  'var(--cq-chart-2)',
  'var(--cq-chart-3)',
  'var(--cq-chart-4)',
  'var(--cq-chart-5)',
] as const;

/* ------------------------------------------------------------------ Skeleton */

export const skeleton = `animate-pulse bg-[var(--cq-skeleton)] ${radius.sm}`;

/* ------------------------------------------------------------------ Overlay layering */

/**
 * Explicit z-scale. Dropdown menus must portal above sticky table headers, cards and dialogs —
 * the previous code used ad-hoc z-[90] which clipped menus inside dialogs.
 */
export const zIndex = {
  stickyHeader: 'z-20',
  overlay: 'z-[80]',
  dialog: 'z-[90]',
  /** Popovers/selects render above dialogs so a select inside a modal is never clipped. */
  popover: 'z-[100]',
  toast: 'z-[110]',
} as const;
