import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

/*
  Shared primitives for the PUBLIC marketing surfaces.

  Why this file exists: the public site had 44 distinct primary-CTA class
  strings and 239 distinct card class strings for what are conceptually three
  buttons and three cards. Four different radii were in use for the same
  primary action. Nothing imported a button primitive — every call site was
  hand-rolled, so nothing could be changed centrally.

  Everything here draws from the `--pub-*` tokens (index.css, scoped to
  `html.cq-public-light`). No raw palette utilities, no hex literals.

  NOT for the authenticated dashboard — that owns `--cq-*` and its own
  primitives under components/dashboard.
*/

/* ------------------------------------------------------------------ focus */

/*
  The public site shipped four `focus-visible` declarations in total, and the
  contact form actively removed its ring. One treatment, applied everywhere,
  visible against both paper and ink grounds.
*/
export const pubFocus =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pub-signal ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-pub-paper';

/* ------------------------------------------------------------------ button */

type PubButtonVariant = 'primary' | 'secondary' | 'quiet';
type PubButtonSize = 'md' | 'lg';

/*
  `primary` is the single most important action in a viewport — it is the only
  element on a public page allowed to carry a filled signal colour. If two
  primaries are visible at once, one of them is wrong.
*/
const variantClass: Record<PubButtonVariant, string> = {
  primary:
    'bg-pub-signal text-white border border-transparent ' +
    'hover:bg-pub-signal-ink active:bg-pub-signal-ink',
  secondary:
    'bg-transparent text-pub-ink border border-pub-ink/25 ' +
    'hover:border-pub-ink/50 hover:bg-pub-ink/[0.03]',
  quiet:
    'bg-transparent text-pub-ink-2 border border-transparent ' +
    'hover:text-pub-ink hover:bg-pub-ink/[0.04]',
};

// 44px minimum height: 128 of 147 tappable elements on the mobile homepage were
// below the touch-target minimum. These two sizes both clear it.
const sizeClass: Record<PubButtonSize, string> = {
  md: 'h-11 px-5 text-[14.5px]',
  lg: 'h-13 px-7 text-[15.5px]',
};

const buttonBase = cn(
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap',
  'transition-colors duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]',
  'disabled:cursor-not-allowed disabled:opacity-55',
  pubFocus,
);

interface CommonButtonProps {
  variant?: PubButtonVariant;
  size?: PubButtonSize;
  icon?: LucideIcon;
  /** Render the icon after the label (e.g. a trailing arrow). */
  iconTrailing?: boolean;
  children: ReactNode;
  className?: string;
}

export const PubButton = forwardRef<
  HTMLButtonElement,
  CommonButtonProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'>
>(function PubButton(
  { variant = 'primary', size = 'md', icon: Icon, iconTrailing, children, className, type = 'button', ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={cn(buttonBase, variantClass[variant], sizeClass[size], className)} {...rest}>
      {Icon && !iconTrailing ? <Icon size={17} aria-hidden="true" className="shrink-0" /> : null}
      {children}
      {Icon && iconTrailing ? <Icon size={17} aria-hidden="true" className="shrink-0" /> : null}
    </button>
  );
});

/** Same visual contract as PubButton, but a real link — crawlable, middle-clickable. */
export function PubLinkButton({
  to, variant = 'primary', size = 'md', icon: Icon, iconTrailing, children, className, ...rest
}: CommonButtonProps & { to: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'className' | 'href'>) {
  const cls = cn(buttonBase, variantClass[variant], sizeClass[size], className);
  const inner = (
    <>
      {Icon && !iconTrailing ? <Icon size={17} aria-hidden="true" className="shrink-0" /> : null}
      {children}
      {Icon && iconTrailing ? <Icon size={17} aria-hidden="true" className="shrink-0" /> : null}
    </>
  );
  // External and protocol links (tel:, mailto:) must not go through the router.
  const isExternal = /^(https?:|tel:|mailto:)/.test(to);
  if (isExternal) return <a href={to} className={cls} {...rest}>{inner}</a>;
  return <Link to={to} className={cls} {...rest}>{inner}</Link>;
}

/* ------------------------------------------------------------------ icon tile */

export type IconTileTone = 'neutral' | 'signal' | 'verify' | 'caution';

/*
  The site uses 352 distinct lucide icons with no size or stroke convention and
  no colour. Rather than recolour 352 glyphs, the colour lives in the TILE: the
  glyph keeps the ink stroke and the container carries the tone. That makes the
  whole icon vocabulary consistent without touching a single icon call site, and
  it keeps the glyph readable at small sizes where a coloured stroke greys out.
*/
const tileTone: Record<IconTileTone, string> = {
  neutral: 'bg-pub-paper-2 text-pub-ink-2 ring-1 ring-pub-hairline-soft',
  signal: 'bg-pub-signal-wash text-pub-signal-ink ring-1 ring-pub-signal/15',
  verify: 'bg-pub-verify-wash text-pub-verify ring-1 ring-pub-verify/15',
  caution: 'bg-pub-caution-wash text-pub-caution ring-1 ring-pub-caution/15',
};

const tileSize = {
  sm: { box: 'h-9 w-9 rounded-lg', glyph: 16 },
  md: { box: 'h-11 w-11 rounded-xl', glyph: 19 },
  lg: { box: 'h-14 w-14 rounded-2xl', glyph: 24 },
} as const;

export function IconTile({
  icon: Icon, tone = 'neutral', size = 'md', className,
}: {
  icon: LucideIcon;
  /** `verify` is reserved for contractually true facts; `caution` for named limitations. */
  tone?: IconTileTone;
  size?: keyof typeof tileSize;
  className?: string;
}) {
  const s = tileSize[size];
  return (
    <span aria-hidden="true" className={cn('inline-flex shrink-0 items-center justify-center', s.box, tileTone[tone], className)}>
      <Icon size={s.glyph} strokeWidth={1.75} />
    </span>
  );
}

/* ------------------------------------------------------------------ eyebrow */

/** Uppercase section label. `ink-4` is legible here because it is never body copy. */
export function PubEyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('text-[11.5px] font-semibold uppercase tracking-[0.15em] text-pub-ink-4', className)}>
      {children}
    </p>
  );
}
