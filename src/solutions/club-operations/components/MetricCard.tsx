// Metric cards.
//
// Two deliberate sizes, because sixteen identically-weighted KPI cards is not a hierarchy — it is a
// list, and it forces the reader to read all sixteen to find the one that matters.
//
//   PrimaryMetric — the two or three figures the section exists to report. Large numeral, movement
//                   against the comparison window, optional trend glyph.
//   Metric        — everything else. Compact, one line of context, no decoration.
//
// A delta is only ever rendered when a comparison window actually exists. "0 %" against an absent
// baseline is a fabricated claim about movement, so the absent case says so in words instead.

import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowRight, ArrowUpRight, type LucideIcon } from 'lucide-react';

import { border, focusRingOnSurface, radius, space, surface, text } from '@/components/dashboard/tokens';
import { cn } from '@/lib/utils';

import { feedback } from '../motion';
import { formatSignedPercent, percentChange } from '../formatting';
import { Sparkline } from './charts';

/** Whether an increase in this figure is good news, bad news, or neither. */
export type MetricDirection = 'up-good' | 'up-bad' | 'neutral';

function toneFor(diff: number, direction: MetricDirection): string {
  if (diff === 0 || direction === 'neutral') return 'text-[var(--cq-fg-muted)]';
  const good = direction === 'up-good' ? diff > 0 : diff < 0;
  return good ? 'text-emerald-700' : 'text-red-600';
}

/**
 * Movement against the previous comparable window.
 *
 * Shows the rate and the absolute change together: a rate alone hides that a "+120 %" is two
 * bookings becoming four, and an absolute alone hides that fifty euros is a rout or a rounding
 * error depending on the base.
 */
export function Delta({
  current,
  previous,
  direction = 'neutral',
  comparisonLabel,
  format,
}: {
  current: number;
  previous: number | null;
  direction?: MetricDirection;
  /** e.g. "Vormonat". Named so the reader never has to guess what "+8 %" is measured against. */
  comparisonLabel: string;
  format: (value: number) => string;
}) {
  if (previous === null) {
    return <span className={text.hint}>Kein Vergleichszeitraum</span>;
  }

  const diff = current - previous;
  const rate = percentChange(current, previous);

  if (diff === 0) {
    return (
      <span className={cn('inline-flex items-center gap-1', text.hint)}>
        <ArrowRight size={12} aria-hidden="true" />
        unverändert ggü. {comparisonLabel}
      </span>
    );
  }

  const Icon = diff > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        'inline-flex flex-wrap items-center gap-x-1.5 text-[12px] leading-4 tabular-nums',
        toneFor(diff, direction),
      )}
    >
      <Icon size={12} aria-hidden="true" className="shrink-0" />
      <span className="font-medium">
        {rate === null ? `${diff > 0 ? '+' : '−'}${format(Math.abs(diff))}` : formatSignedPercent(rate)}
      </span>
      <span className="text-[var(--cq-fg-subtle)]">
        {rate === null ? '' : `${diff > 0 ? '+' : '−'}${format(Math.abs(diff))} · `}
        ggü. {comparisonLabel}
      </span>
    </span>
  );
}

export function PrimaryMetric({
  label,
  value,
  icon: Icon,
  current,
  previous,
  comparisonLabel,
  direction = 'up-good',
  format,
  spark,
  footnote,
}: {
  label: string;
  /** Pre-formatted headline, e.g. "1.234,00 €". */
  value: string;
  icon?: LucideIcon;
  /** Raw current value, for the delta. Omit together with `previous` to hide movement. */
  current?: number;
  previous?: number | null;
  comparisonLabel?: string;
  direction?: MetricDirection;
  format?: (value: number) => string;
  /** Values for the supporting trend glyph. */
  spark?: number[];
  footnote?: ReactNode;
}) {
  return (
    <div className={cn(surface.card, space.cardPadding, 'flex flex-col')}>
      <div className="mb-2.5 flex items-start justify-between gap-3">
        <p className={cn('inline-flex min-w-0 items-center gap-1.5', text.eyebrow)}>
          {Icon ? <Icon size={13} className="shrink-0" aria-hidden="true" /> : null}
          <span className="truncate">{label}</span>
        </p>
        {spark && spark.length > 1 ? (
          <Sparkline values={spark} className="text-[var(--cq-fg-subtle)]" />
        ) : null}
      </div>

      <p className="text-[26px] font-semibold leading-8 tracking-[-0.022em] tabular-nums text-[var(--cq-fg)]">
        {value}
      </p>

      {current !== undefined && comparisonLabel && format ? (
        <div className="mt-1.5">
          <Delta
            current={current}
            previous={previous ?? null}
            direction={direction}
            comparisonLabel={comparisonLabel}
            format={format}
          />
        </div>
      ) : null}

      {footnote ? <div className={cn('mt-2', text.hint)}>{footnote}</div> : null}
    </div>
  );
}

/**
 * A compact figure.
 *
 * `onSelect` turns the whole card into a navigation control within the module. It is a real button
 * that really moves the reader somewhere — the module has no disabled or decorative controls.
 */
export function Metric({
  label,
  value,
  hint,
  tone = 'neutral',
  onSelect,
  selectLabel,
}: {
  label: string;
  value: string;
  hint?: ReactNode;
  tone?: 'neutral' | 'positive' | 'negative';
  onSelect?: () => void;
  /** Accessible name for the navigation, e.g. "Zu den Rechnungen". Required with `onSelect`. */
  selectLabel?: string;
}) {
  const valueColor =
    tone === 'positive' ? 'text-emerald-700' : tone === 'negative' ? 'text-red-600' : '';

  const body = (
    <>
      <p className={cn('truncate', text.eyebrow)}>{label}</p>
      <p
        className={cn(
          'mt-1.5 text-[19px] font-semibold leading-6 tracking-[-0.014em] tabular-nums text-[var(--cq-fg)]',
          valueColor,
        )}
      >
        {value}
      </p>
      {hint ? <div className={cn('mt-1', text.hint)}>{hint}</div> : null}
    </>
  );

  const shell = cn(surface.card, space.cardPaddingTight, 'min-w-0');

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={onSelect}
        aria-label={selectLabel}
        className={cn(
          shell,
          'block w-full text-left',
          feedback,
          focusRingOnSurface,
          'hover:border-[var(--cq-border-strong)] hover:bg-[var(--cq-hover)]',
        )}
      >
        {body}
      </button>
    );
  }

  return <div className={shell}>{body}</div>;
}

/**
 * A row of metrics under a shared eyebrow.
 *
 * `columns` is explicit rather than always four: a group of three stretched across four columns
 * leaves a hole that reads as a missing figure.
 */
export function MetricRow({
  label,
  columns = 4,
  children,
}: {
  label?: string;
  columns?: 2 | 3 | 4;
  children: ReactNode;
}) {
  const grid =
    columns === 2
      ? 'sm:grid-cols-2'
      : columns === 3
        ? 'sm:grid-cols-2 lg:grid-cols-3'
        : 'sm:grid-cols-2 xl:grid-cols-4';

  return (
    <section aria-label={label} className="space-y-2.5">
      {label ? <h3 className={text.eyebrow}>{label}</h3> : null}
      <div className={cn('grid gap-3', grid)}>{children}</div>
    </section>
  );
}

/** A hairline-separated strip of small figures. Denser than cards where the figures are secondary. */
export function MetricStrip({ items }: { items: { label: string; value: string; hint?: string }[] }) {
  return (
    <dl
      className={cn(
        'grid grid-cols-2 divide-[var(--cq-border-subtle)] sm:grid-cols-4 sm:divide-x',
        surface.card,
        radius.xl,
      )}
    >
      {items.map((item, index) => (
        <div
          key={item.label}
          className={cn(
            'min-w-0 px-4 py-3.5',
            // Row separators on the two-column phone layout, column separators from sm up.
            index < items.length - 2 && 'border-b sm:border-b-0',
            index % 2 === 0 && 'border-r sm:border-r-0',
            border.subtle,
          )}
        >
          <dt className={cn('truncate', text.eyebrow)}>{item.label}</dt>
          <dd className={cn('mt-1 text-[15px] font-semibold leading-5 tabular-nums text-[var(--cq-fg)]')}>
            {item.value}
          </dd>
          {item.hint ? <p className={cn('mt-0.5 truncate', text.hint)}>{item.hint}</p> : null}
        </div>
      ))}
    </dl>
  );
}
