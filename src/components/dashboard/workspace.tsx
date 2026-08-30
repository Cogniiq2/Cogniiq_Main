import { forwardRef, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Search, X, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  border, control, focusRing, focusRingOnSurface, interactive, radius, skeleton as skeletonClass,
  space, statusTone, surface, text,
} from './tokens';

/**
 * Composition primitives for the Admin Center.
 *
 * `primitives.tsx` holds the atoms — a button, a badge, a field. This module holds
 * the *page shapes*: the header band every workspace opens with, the summary strip
 * that replaced the grid of identical KPI cards, the panel that frames a section,
 * and the row that makes a list feel like something you can click.
 *
 * Split out deliberately: the atoms are consumed by the customer portal too, while
 * everything here exists to make the internal workspace read as one product.
 * Nothing here hard-codes a colour, radius or duration — it all comes from ./tokens.
 */

/* ================================================================= page header */

export interface Crumb {
  label: string;
  to?: string;
}

/**
 * The band every Admin Center page opens with.
 *
 * One structure — breadcrumb, identity, status, actions, and an optional toolbar
 * rail underneath — so moving between Customers, Invoices and Offers never feels
 * like moving between three applications. The old `PageHeader` stacked a title and
 * a paragraph and left every page to invent its own filter row below it; the
 * toolbar slot is what pulls that back into the header.
 */
export function WorkspaceHeader({
  eyebrow, crumbs, title, subtitle, status, actions, toolbar, meta, className,
}: {
  /** Small caps context line. Use when there is no breadcrumb trail. */
  eyebrow?: string;
  crumbs?: Crumb[];
  title: ReactNode;
  subtitle?: ReactNode;
  /** Badges sitting on the title line — the record's state, not decoration. */
  status?: ReactNode;
  actions?: ReactNode;
  /** Filters, search and view switches. Rendered on its own rail under the title. */
  toolbar?: ReactNode;
  /** Compact facts under the title (dates, owner, reference numbers). */
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('mb-5', className)}>
      {crumbs?.length ? (
        <nav aria-label="Breadcrumb" className="mb-2">
          <ol className="flex flex-wrap items-center gap-1">
            {crumbs.map((crumb, index) => (
              <li key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                {index > 0 ? (
                  <ChevronRight size={12} className="text-[var(--cq-fg-subtle)]" aria-hidden="true" />
                ) : null}
                {crumb.to ? (
                  <Link
                    to={crumb.to}
                    className={cn(
                      'truncate px-1 py-0.5 text-[12px] font-medium text-[var(--cq-fg-muted)]',
                      radius.sm, interactive.transition, focusRing, 'hover:text-[var(--cq-fg)]',
                    )}
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="truncate px-1 py-0.5 text-[12px] font-medium text-[var(--cq-fg-subtle)]">
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      ) : eyebrow ? (
        <p className={cn('mb-1.5', text.eyebrow)}>{eyebrow}</p>
      ) : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className={cn('min-w-0 [overflow-wrap:anywhere]', text.pageTitle)}>{title}</h1>
            {status}
          </div>
          {subtitle ? <p className={cn('mt-1.5 max-w-3xl', text.body)}>{subtitle}</p> : null}
          {meta ? (
            <dl className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5">{meta}</dl>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2 lg:shrink-0">{actions}</div> : null}
      </div>

      {toolbar ? <div className="mt-4">{toolbar}</div> : null}
    </header>
  );
}

/** One `label: value` fact on the header's meta line. */
export function HeaderMeta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-baseline gap-1.5">
      <dt className={text.eyebrow}>{label}</dt>
      <dd className={cn('min-w-0 truncate', text.bodyStrong)}>{children}</dd>
    </div>
  );
}

/* ================================================================== stat band */

export interface StatItem {
  key: string;
  label: string;
  value: string;
  /** One short line under the figure saying exactly what it counts. */
  hint?: string;
  tone?: 'neutral' | 'positive' | 'negative' | 'attention';
  to?: string;
  /** Renders larger and first. At most one per band. */
  lead?: boolean;
  /** Small inline visual (sparkline, share bar) under the value. */
  visual?: ReactNode;
}

const statValueTone: Record<NonNullable<StatItem['tone']>, string> = {
  neutral: '',
  positive: 'text-emerald-700',
  negative: 'text-red-600',
  attention: 'text-amber-700',
};

/**
 * The summary strip that replaced the 4-up grid of identical KPI cards.
 *
 * One surface with hairline dividers rather than N boxes: the figures read as one
 * statement about the business instead of four unrelated tiles, and the page gets
 * back the vertical space the card gutters were eating. `lead` promotes a single
 * figure so there is an obvious entry point; everything else stays quiet.
 *
 * Labels must say exactly what the number is. A band never invents a metric — it
 * only re-presents one the backend already computes.
 */
export function StatBand({ items, className }: { items: StatItem[]; className?: string }) {
  if (!items.length) return null;
  return (
    <div className={cn(surface.card, 'overflow-hidden p-0', className)}>
      <dl className="grid grid-cols-2 divide-[var(--cq-border-subtle)] sm:grid-cols-3 lg:flex lg:divide-x [&>*]:border-t [&>*]:border-[var(--cq-border-subtle)] sm:[&>*:nth-child(-n+3)]:border-t-0 [&>*:nth-child(-n+2)]:border-t-0 lg:[&>*]:border-t-0">
        {items.map((item) => {
          const inner = (
            <>
              {/* Neither the label nor the hint truncates: a clipped metric label
                  ("VERTRAGLICH WIEDERKEH…") is worse than a two-line one, because the
                  owner then cannot tell what the number counts. */}
              <dt className={text.eyebrow}>{item.label}</dt>
              <dd
                className={cn(
                  'mt-1.5',
                  item.lead ? text.metricLead : text.metricSm,
                  statValueTone[item.tone ?? 'neutral'],
                )}
              >
                {item.value}
              </dd>
              {item.visual ? <div className="mt-2">{item.visual}</div> : null}
              {item.hint ? <p className={cn('mt-1', text.hint)}>{item.hint}</p> : null}
            </>
          );
          const base = cn(
            'min-w-0 px-4 py-3.5 lg:px-5 lg:py-4',
            item.lead ? 'lg:min-w-[210px] lg:flex-[1.25]' : 'lg:flex-1',
          );
          if (item.to) {
            return (
              <Link
                key={item.key}
                to={item.to}
                className={cn(base, 'group block', interactive.transition, focusRingOnSurface, 'hover:bg-[var(--cq-hover)]')}
              >
                {inner}
              </Link>
            );
          }
          return <div key={item.key} className={base}>{inner}</div>;
        })}
      </dl>
    </div>
  );
}

export function StatBandSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className={cn(surface.card, 'overflow-hidden p-0')} aria-hidden="true">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="min-w-0 flex-1 px-4 py-3.5 lg:px-5 lg:py-4">
            <div className={cn(skeletonClass, 'h-2.5 w-20')} />
            <div className={cn(skeletonClass, 'mt-3 h-6 w-28')} />
            <div className={cn(skeletonClass, 'mt-2 h-2.5 w-16')} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ====================================================================== panel */

/**
 * A framed section of a page.
 *
 * Differs from `Card` in that it owns a header rail — title, count, an action —
 * and can go `flush` so a table sits edge to edge inside it instead of floating in
 * padding. Almost every section of the redesigned pages is one of these, which is
 * what makes the pages look like the same product.
 */
export function Panel({
  title, description, count, action, children, footer, flush, className, tone = 'default', icon: Icon, id,
}: {
  title?: ReactNode;
  description?: ReactNode;
  /** Rendered as a quiet pill next to the title. */
  count?: number | string;
  action?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** Remove body padding — for tables and full-bleed lists. */
  flush?: boolean;
  className?: string;
  tone?: 'default' | 'attention';
  icon?: LucideIcon;
  id?: string;
}) {
  const headingId = useId();
  return (
    <section
      id={id}
      aria-labelledby={title ? headingId : undefined}
      className={cn(
        'flex min-w-0 flex-col overflow-hidden',
        surface.card, 'p-0',
        tone === 'attention' && 'border-[var(--cq-accent-border)]',
        className,
      )}
    >
      {title ? (
        <div className={cn('flex items-start justify-between gap-3 px-4 py-3 sm:px-5', border.hairlineB)}>
          <div className="flex min-w-0 items-center gap-2">
            {Icon ? <Icon size={14} className="shrink-0 text-[var(--cq-fg-subtle)]" aria-hidden="true" /> : null}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 id={headingId} className={cn('truncate', text.cardTitle)}>{title}</h2>
                {count != null ? (
                  <span className={cn('shrink-0 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums', radius.sm, statusTone.neutral, 'border')}>
                    {count}
                  </span>
                ) : null}
              </div>
              {description ? <p className={cn('mt-0.5 truncate', text.hint)}>{description}</p> : null}
            </div>
          </div>
          {action ? <div className="flex shrink-0 items-center gap-1.5">{action}</div> : null}
        </div>
      ) : null}
      <div className={cn('min-w-0 flex-1', flush ? '' : 'p-4 sm:p-5')}>{children}</div>
      {footer ? <div className={cn('px-4 py-3 sm:px-5', border.hairlineT)}>{footer}</div> : null}
    </section>
  );
}

/** Quiet inline link used in panel headers ("Alle ansehen"). */
export function PanelLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className={cn(
        'inline-flex items-center gap-0.5 px-1.5 py-1 text-[12.5px] font-medium text-[var(--cq-fg-muted)]',
        radius.sm, interactive.transition, focusRingOnSurface, 'hover:bg-[var(--cq-hover)] hover:text-[var(--cq-fg)]',
      )}
    >
      {children}
      <ChevronRight size={13} aria-hidden="true" />
    </Link>
  );
}

/* ======================================================================== row */

/**
 * A tactile, keyboard-reachable list row.
 *
 * Rendered as a real `<Link>` so it is focusable, announced, and openable in a new
 * tab — the previous lists used `onClick` on a `<div>`, which is unreachable by
 * keyboard. The accent rail on the left appears on hover/focus rather than always,
 * so a quiet list stays quiet until the pointer says otherwise.
 */
export function ListRow({
  to, onClick, icon: Icon, tone = 'neutral', title, meta, value, valueHint, trailing, badge, className,
}: {
  to?: string;
  onClick?: () => void;
  icon?: LucideIcon;
  tone?: 'neutral' | 'attention' | 'danger' | 'positive';
  title: ReactNode;
  meta?: ReactNode;
  value?: ReactNode;
  valueHint?: ReactNode;
  trailing?: ReactNode;
  badge?: ReactNode;
  className?: string;
}) {
  const railTone = {
    neutral: 'bg-[var(--cq-accent)]',
    attention: 'bg-amber-500',
    danger: 'bg-red-500',
    positive: 'bg-emerald-500',
  }[tone];

  const iconTone = {
    neutral: 'text-[var(--cq-fg-subtle)]',
    attention: 'text-amber-600',
    danger: 'text-red-600',
    positive: 'text-emerald-600',
  }[tone];

  const body = (
    <>
      <span
        aria-hidden="true"
        className={cn(
          'absolute inset-y-1 left-0 w-[2.5px] origin-center scale-y-0 rounded-r-full opacity-0',
          railTone,
          'transition-[opacity,transform] duration-fast ease-premium',
          'group-hover:scale-y-100 group-hover:opacity-100 group-focus-visible:scale-y-100 group-focus-visible:opacity-100',
        )}
      />
      {Icon ? <Icon size={15} className={cn('mt-0.5 shrink-0', iconTone)} aria-hidden="true" /> : null}
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className={cn('min-w-0 [overflow-wrap:anywhere]', text.bodyStrong)}>{title}</span>
          {badge}
        </span>
        {meta ? <span className={cn('mt-0.5 block [overflow-wrap:anywhere]', text.hint)}>{meta}</span> : null}
      </span>
      {value != null ? (
        <span className="shrink-0 text-right">
          <span className={cn('block', text.bodyStrong, text.numeric)}>{value}</span>
          {valueHint ? <span className={cn('mt-0.5 block', text.hint)}>{valueHint}</span> : null}
        </span>
      ) : null}
      {trailing}
      {to || onClick ? (
        <ChevronRight
          size={14}
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-[var(--cq-fg-subtle)] transition-transform duration-fast ease-premium group-hover:translate-x-0.5"
        />
      ) : null}
    </>
  );

  const shell = cn(
    'group relative flex w-full items-start gap-3 px-4 py-3 text-left sm:px-5',
    interactive.press, focusRingOnSurface,
    (to || onClick) && 'hover:bg-[var(--cq-hover)]',
    className,
  );

  if (to) return <Link to={to} className={shell}>{body}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className={shell}>{body}</button>;
  return <div className={cn(shell, 'cursor-default')}>{body}</div>;
}

/** Hairline-separated stack of `ListRow`s inside a flush `Panel`. */
export function RowList({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('divide-y divide-[var(--cq-border-subtle)]', className)}>{children}</div>;
}

/* =================================================================== toolbar */

/** The filter/search rail under a page title. One shape across every list page. */
export function Toolbar({ children, trailing, className }: { children?: ReactNode; trailing?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between', className)}>
      <div className="flex min-w-0 flex-wrap items-center gap-2">{children}</div>
      {trailing ? <div className="flex shrink-0 flex-wrap items-center gap-2">{trailing}</div> : null}
    </div>
  );
}

/** Search input with an inline clear affordance and a real accessible name. */
export const SearchInput = forwardRef<HTMLInputElement, {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
  className?: string;
  id?: string;
}>(function SearchInput({ value, onChange, placeholder, label, className, id }, ref) {
  const generated = useId();
  const inputId = id ?? generated;
  return (
    <div className={cn('relative min-w-0', className)}>
      <Search
        size={14}
        aria-hidden="true"
        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--cq-fg-subtle)]"
      />
      <input
        ref={ref}
        id={inputId}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className={cn(
          'w-full bg-[var(--cq-surface)] text-[13px] text-[var(--cq-fg)] outline-none',
          control.md, border.hairline, radius.md, interactive.transition, focusRing,
          // AFTER control.md: cn() runs tailwind-merge, and control.md's `px-3` would
          // otherwise drop these, putting the placeholder's first character under the icon.
          'pl-9 pr-8',
          'placeholder:text-[var(--cq-fg-subtle)] hover:border-[var(--cq-border-strong)]',
          '[&::-webkit-search-cancel-button]:appearance-none',
        )}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Suche zurücksetzen"
          className={cn(
            'absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-[var(--cq-fg-subtle)]',
            radius.sm, interactive.transition, focusRingOnSurface, 'hover:bg-[var(--cq-hover)] hover:text-[var(--cq-fg)]',
          )}
        >
          <X size={13} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
});

/**
 * Compact single-choice filter chips.
 *
 * A real radio group: arrow keys move between options and the selection is
 * announced, which the old `<button>` rows never were.
 */
export function FilterChips<T extends string>({
  value, onChange, options, label, className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; count?: number }[];
  label: string;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('flex min-w-0 flex-wrap items-center gap-1', className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => {
              if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
              event.preventDefault();
              const index = options.findIndex((o) => o.value === value);
              const next = event.key === 'ArrowRight'
                ? options[(index + 1) % options.length]
                : options[(index - 1 + options.length) % options.length];
              onChange(next.value);
            }}
            className={cn(
              'inline-flex h-8 shrink-0 items-center gap-1.5 border px-2.5 text-[12.5px] font-medium',
              radius.md, interactive.press, focusRing,
              active
                ? 'border-[var(--cq-accent-border)] bg-[var(--cq-accent-weak)] text-[var(--cq-accent-fg)]'
                : cn('border-transparent bg-transparent text-[var(--cq-fg-muted)]', 'hover:bg-[var(--cq-hover)] hover:text-[var(--cq-fg)]'),
            )}
          >
            {option.label}
            {option.count != null ? (
              <span className={cn('tabular-nums', active ? 'opacity-70' : 'text-[var(--cq-fg-subtle)]')}>
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/* =================================================================== visuals */

/**
 * Dependency-free sparkline.
 *
 * Recharts is already in the bundle for the two real charts on the finance
 * overview; pulling it in for a 60×18px trend line would cost far more than the
 * 20 lines of SVG it replaces.
 */
export function Sparkline({ values, className, tone = 'neutral', label }: {
  values: number[];
  className?: string;
  tone?: 'neutral' | 'positive' | 'negative';
  label?: string;
}) {
  const path = useMemo(() => {
    if (values.length < 2) return null;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const span = max - min || 1;
    const step = 100 / (values.length - 1);
    return values
      .map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(2)},${(24 - ((v - min) / span) * 22).toFixed(2)}`)
      .join(' ');
  }, [values]);

  if (!path) return null;
  const stroke = tone === 'positive' ? '#047857' : tone === 'negative' ? '#dc2626' : 'var(--cq-chart-2)';
  return (
    <svg
      viewBox="0 0 100 26"
      preserveAspectRatio="none"
      className={cn('h-5 w-full', className)}
      role={label ? 'img' : 'presentation'}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Horizontal share bar — one segment per part, sized by value. */
export function ShareBar({ segments, className }: {
  segments: { key: string; value: number; className: string; label: string }[];
  className?: string;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return null;
  return (
    <div className={cn('flex h-1.5 w-full overflow-hidden rounded-full bg-[var(--cq-sunken)]', className)}>
      {segments.filter((s) => s.value > 0).map((segment) => (
        <span
          key={segment.key}
          className={segment.className}
          style={{ width: `${(segment.value / total) * 100}%` }}
          title={segment.label}
        />
      ))}
    </div>
  );
}

/** Label/value pairs for a record's identity block. */
export function DefinitionGrid({ items, columns = 1 }: {
  items: { label: string; value: ReactNode }[];
  columns?: 1 | 2;
}) {
  return (
    <dl className={cn('grid gap-x-6 gap-y-2.5', columns === 2 ? 'sm:grid-cols-2' : '')}>
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className={text.eyebrow}>{item.label}</dt>
          <dd className={cn('mt-0.5 [overflow-wrap:anywhere]', text.bodyStrong)}>{item.value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Vertical activity timeline. */
export function Timeline({ items }: {
  items: { id: string; title: ReactNode; time: string; tone?: 'neutral' | 'positive' | 'attention' }[];
}) {
  return (
    <ol className="relative space-y-3.5 pl-4">
      <span aria-hidden="true" className="absolute bottom-1 left-[3px] top-1.5 w-px bg-[var(--cq-border)]" />
      {items.map((item) => (
        <li key={item.id} className="relative">
          <span
            aria-hidden="true"
            className={cn(
              'absolute -left-4 top-1.5 h-[7px] w-[7px] rounded-full ring-2 ring-[var(--cq-surface)]',
              item.tone === 'positive' ? 'bg-emerald-500' : item.tone === 'attention' ? 'bg-amber-500' : 'bg-[var(--cq-border-strong)]',
            )}
          />
          <p className={cn('[overflow-wrap:anywhere]', text.body, 'text-[var(--cq-fg)]')}>{item.title}</p>
          <p className={text.hint}>{item.time}</p>
        </li>
      ))}
    </ol>
  );
}

/* ============================================================ section anchors */

/**
 * Sticky in-page section switch for long record pages (Customer 360).
 *
 * Scroll-spy over real anchors, so the sections stay linkable and the page stays
 * one document rather than a tab widget that hides half the record.
 */
export function SectionNav({ sections, className }: {
  sections: { id: string; label: string; count?: number }[];
  className?: string;
}) {
  const [active, setActive] = useState(sections[0]?.id ?? '');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nodes = sections
      .map((section) => document.getElementById(section.id))
      .filter((node): node is HTMLElement => Boolean(node));
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      // Bias the band toward the top of the viewport so the highlighted section is
      // the one the owner is actually reading, not the one entering from below.
      { rootMargin: '-96px 0px -60% 0px', threshold: 0 },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [sections]);

  return (
    <div
      ref={ref}
      className={cn(
        'sticky top-0 z-20 -mx-4 mb-4 overflow-x-auto border-b border-[var(--cq-border)] bg-[var(--cq-canvas)]/92 px-4 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8',
        className,
      )}
    >
      <nav aria-label="Abschnitte" className="flex items-center gap-0.5">
        {sections.map((section) => {
          const isActive = section.id === active;
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-current={isActive ? 'true' : undefined}
              className={cn(
                'relative inline-flex shrink-0 items-center gap-1.5 px-2.5 py-2.5 text-[12.5px] font-medium',
                interactive.transition, focusRing,
                isActive ? 'text-[var(--cq-fg)]' : 'text-[var(--cq-fg-muted)] hover:text-[var(--cq-fg)]',
              )}
            >
              {section.label}
              {section.count != null ? (
                <span className={cn('tabular-nums', isActive ? 'text-[var(--cq-fg-muted)]' : 'text-[var(--cq-fg-subtle)]')}>
                  {section.count}
                </span>
              ) : null}
              <span
                aria-hidden="true"
                className={cn(
                  'absolute inset-x-1.5 bottom-0 h-[2px] rounded-t-full bg-[var(--cq-accent)]',
                  'transition-opacity duration-fast ease-premium',
                  isActive ? 'opacity-100' : 'opacity-0',
                )}
              />
            </a>
          );
        })}
      </nav>
    </div>
  );
}

/* ================================================================== skeleton */

/** Content-shaped placeholder for a list panel — never a full-page spinner. */
export function RowListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="divide-y divide-[var(--cq-border-subtle)]" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
          <div className={cn(skeletonClass, 'h-4 w-4 shrink-0 rounded-full')} />
          <div className="min-w-0 flex-1">
            <div className={cn(skeletonClass, 'h-3 w-1/2')} />
            <div className={cn(skeletonClass, 'mt-2 h-2.5 w-1/3')} />
          </div>
          <div className={cn(skeletonClass, 'h-3 w-16')} />
        </div>
      ))}
    </div>
  );
}

/** Inline "this section failed, the rest of the page did not" recovery. */
export function PanelError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className={cn('px-4 py-6 text-center sm:px-5', space.sectionGap)} role="alert">
      <p className="text-[13px] font-semibold leading-5 text-[var(--cq-fg)]">Dieser Bereich konnte nicht geladen werden</p>
      <p className={cn('mx-auto mt-1 max-w-sm [overflow-wrap:anywhere]', text.hint)}>{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className={cn(
            'mt-3 inline-flex items-center bg-[var(--cq-surface)] px-3 text-[12.5px] font-medium text-[var(--cq-fg)]',
            control.sm, border.hairline, radius.md, interactive.press, focusRingOnSurface, 'hover:bg-[var(--cq-hover)]',
          )}
        >
          Erneut versuchen
        </button>
      ) : null}
    </div>
  );
}
