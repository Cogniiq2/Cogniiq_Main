// Module-local visualisations.
//
// Hand-rolled SVG and CSS. No chart library is imported, and none may be: the module's import
// boundary (see clubOperations.boundaries.test.ts) permits react, lucide-react and four dashboard
// submodules, and widening it to pull in a rendering dependency would be a real architectural change
// smuggled in as a visual one.
//
// Accessibility is the reason these are as plain as they are. Every chart carries:
//   * `role="img"` with an `aria-label` that states the finding in words, so a screen reader gets
//     the conclusion rather than a list of coordinates;
//   * a visually hidden <table> with the full series, so the underlying numbers stay reachable;
//   * visible value labels or a legend, so nothing depends on colour alone.
//
// There are no tooltips anywhere. A hover-only tooltip is unreachable by keyboard, and building a
// keyboard-navigable one would put a focus trap between the reader and a number that is already
// printed on the page.

import type { ReactNode } from 'react';

import { radius, text } from '@/components/dashboard/tokens';
import { cn } from '@/lib/utils';

import { chartReveal, feedback } from '../motion';
import { formatCents, formatCount, formatPercent } from '../formatting';

/* ------------------------------------------------------------------ Shared */

/**
 * The full series, available to assistive technology but not painted.
 *
 * A description list rather than a table on purpose. A chart's textual equivalent has no reason to
 * claim table semantics, and an invisible <table> beside every chart would put rows and column
 * headers into the accessibility tree — and into any query for "the table on this page" — that no
 * reader asked for and that the section's real table would then have to compete with.
 */
function SeriesList({ caption, entries }: { caption: string; entries: { term: string; detail: string }[] }) {
  return (
    <div className="sr-only">
      <p>{caption}</p>
      <dl>
        {entries.map((entry) => (
          <div key={entry.term}>
            <dt>{entry.term}</dt>
            <dd>{entry.detail}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function ChartEmpty({ label }: { label: string }) {
  return (
    <div
      className={cn(
        'flex h-full min-h-[120px] items-center justify-center border border-dashed border-[var(--cq-border)] px-4 py-8 text-center',
        radius.lg,
        text.hint,
      )}
    >
      {label}
    </div>
  );
}

/* ------------------------------------------------------------------ Trend */

export interface TrendDatum {
  key: string;
  label: string;
  revenueCents: number;
  bookingCount: number;
}

/**
 * Revenue over time, with the booking count as a secondary read.
 *
 * A column chart rather than a line: the buckets are discrete periods, and a line between two
 * Mondays implies a value on the Wednesday between them that nobody measured. Columns also make a
 * zero bucket visibly zero instead of a dip in a curve.
 *
 * The booking count rides along as a thin marker on each column rather than as a second axis. Two
 * y-axes at different scales is the classic way to make an unrelated pair of series look correlated.
 */
export function TrendChart({
  data,
  emptyLabel,
  height = 168,
}: {
  data: TrendDatum[];
  emptyLabel: string;
  height?: number;
}) {
  const nonEmpty = data.filter((point) => point.revenueCents > 0 || point.bookingCount > 0);
  if (data.length === 0 || nonEmpty.length === 0) return <ChartEmpty label={emptyLabel} />;

  const peak = Math.max(...data.map((point) => point.revenueCents), 1);
  const peakBookings = Math.max(...data.map((point) => point.bookingCount), 1);
  const total = data.reduce((sum, point) => sum + point.revenueCents, 0);
  const best = data.reduce((leader, point) =>
    point.revenueCents > leader.revenueCents ? point : leader,
  );

  // Ticks are thinned rather than rotated: a rotated axis label is unreadable at 320px and a
  // horizontal one that overlaps its neighbour is worse than one that is simply not drawn.
  const tickEvery = Math.ceil(data.length / 6);

  return (
    <figure className="m-0">
      <div
        role="img"
        aria-label={`Umsatzverlauf über ${data.length} Zeitabschnitte. Gesamt ${formatCents(total)}. Höchster Wert ${formatCents(best.revenueCents)} im Abschnitt ${best.label}.`}
        className={cn('flex items-end gap-[3px]', chartReveal)}
        style={{ height }}
      >
        {data.map((point) => {
          const revenueShare = (point.revenueCents / peak) * 100;
          const bookingShare = (point.bookingCount / peakBookings) * 100;
          return (
            <div key={point.key} className="group flex h-full min-w-0 flex-1 flex-col justify-end">
              {/* Booking-count marker: a hairline at the height the count reaches. */}
              <div className="relative w-full flex-1">
                {point.bookingCount > 0 ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 h-px bg-[var(--cq-chart-4)] opacity-70"
                    style={{ bottom: `${bookingShare}%` }}
                  />
                ) : null}
              </div>
              <div
                aria-hidden="true"
                className={cn(
                  'w-full bg-[var(--cq-chart-1)] opacity-[0.82] group-hover:opacity-100',
                  feedback,
                  'rounded-t-[2px]',
                )}
                // Minimum 2px so a non-zero bucket is never invisible, and 0 stays 0.
                style={{
                  height:
                    point.revenueCents > 0 ? `max(2px, ${(revenueShare * (height - 24)) / 100}px)` : 0,
                }}
              />
            </div>
          );
        })}
      </div>

      <div aria-hidden="true" className={cn('mt-2 flex gap-[3px]', text.hint)}>
        {data.map((point, index) => (
          <span key={point.key} className="min-w-0 flex-1 truncate text-center">
            {index % tickEvery === 0 ? point.label.replace('ab ', '') : ' '}
          </span>
        ))}
      </div>

      <figcaption className={cn('mt-3 flex flex-wrap items-center gap-x-4 gap-y-1', text.hint)}>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-[1px] bg-[var(--cq-chart-1)]" aria-hidden="true" />
          Umsatz
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-px w-3 bg-[var(--cq-chart-4)]" aria-hidden="true" />
          Buchungen
        </span>
        <span className="ml-auto tabular-nums">
          Spitze: {formatCents(best.revenueCents)} · {best.label}
        </span>
      </figcaption>

      <SeriesList
        caption="Umsatz und Buchungen je Zeitabschnitt"
        entries={data.map((point) => ({
          term: point.label,
          detail: `${formatCents(point.revenueCents)}, ${formatCount(point.bookingCount)} Buchungen`,
        }))}
      />
    </figure>
  );
}

/* ------------------------------------------------------- Composition bar */

export interface CompositionSlice {
  key: string;
  label: string;
  value: number;
  /** Text shown beside the label, e.g. a formatted amount. */
  display: string;
  /** Index into the chart palette, 0–4. */
  tone?: number;
}

const paletteVar = (index: number) => `var(--cq-chart-${(index % 5) + 1})`;

/**
 * A single stacked bar plus a legend with values.
 *
 * Used where the question is "what is this made of" — payment providers, payment statuses, VAT
 * categories. One bar rather than a pie, because comparing two adjacent segment lengths is a task
 * people do accurately and comparing two pie wedges is not.
 */
export function CompositionBar({
  slices,
  emptyLabel,
  totalLabel,
}: {
  slices: CompositionSlice[];
  emptyLabel: string;
  /** Rendered under the legend, e.g. "39 Buchungen". */
  totalLabel?: string;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  if (slices.length === 0 || total <= 0) return <ChartEmpty label={emptyLabel} />;

  const summary = slices
    .map((slice) => `${slice.label} ${formatPercent((slice.value / total) * 100)}`)
    .join(', ');

  return (
    <figure className="m-0">
      <div
        role="img"
        aria-label={`Zusammensetzung: ${summary}.`}
        className={cn('flex h-2.5 w-full overflow-hidden bg-[var(--cq-sunken)]', radius.full, chartReveal)}
      >
        {slices.map((slice, index) => (
          <span
            key={slice.key}
            aria-hidden="true"
            className={feedback}
            style={{
              width: `${(slice.value / total) * 100}%`,
              background: paletteVar(slice.tone ?? index),
            }}
          />
        ))}
      </div>

      <ul className="mt-3 space-y-1.5">
        {slices.map((slice, index) => (
          <li key={slice.key} className="flex items-baseline gap-2.5">
            <span
              aria-hidden="true"
              className="mt-1 h-2 w-2 shrink-0 rounded-[1px]"
              style={{ background: paletteVar(slice.tone ?? index) }}
            />
            <span className={cn('min-w-0 flex-1 truncate', text.body)}>{slice.label}</span>
            <span className={cn('shrink-0 tabular-nums', text.bodyStrong)}>{slice.display}</span>
            <span className={cn('w-12 shrink-0 text-right tabular-nums', text.hint)}>
              {formatPercent((slice.value / total) * 100)}
            </span>
          </li>
        ))}
      </ul>

      {totalLabel ? <figcaption className={cn('mt-2', text.hint)}>{totalLabel}</figcaption> : null}
      {/* No hidden equivalent here: the legend above already prints every label, value and share,
          so a screen reader gets the full series from the visible content. */}
    </figure>
  );
}

/* ------------------------------------------------------------ Ranked bars */

export interface RankedDatum {
  key: string;
  label: string;
  /** 0–100. Drives the bar length. */
  percent: number;
  /** The headline value, right-aligned. */
  value: string;
  /** Secondary context under the row. */
  hint?: string;
  /** Highlights the row as the leader. */
  leading?: boolean;
}

/**
 * A ranked proportion list: label, bar, value.
 *
 * Replaces the old flat grey list. The leader is tinted with the primary chart colour and the rest
 * stay neutral, so "which is biggest" is answerable without reading a single number — while every
 * value is still printed, so nothing depends on the tint.
 */
export function RankedBars({ rows, emptyLabel }: { rows: RankedDatum[]; emptyLabel: string }) {
  if (rows.length === 0) return <ChartEmpty label={emptyLabel} />;

  return (
    <ul className="space-y-2.5">
      {rows.map((row) => (
        <li key={row.key}>
          <div className="flex items-baseline justify-between gap-3">
            <span className={cn('min-w-0 truncate', row.leading ? text.bodyStrong : text.body)}>
              {row.label}
            </span>
            <span className={cn('shrink-0 tabular-nums', text.bodyStrong)}>{row.value}</span>
          </div>
          <div
            className={cn('mt-1.5 h-1.5 w-full overflow-hidden bg-[var(--cq-sunken)]', radius.full)}
            role="img"
            aria-label={`${row.label}: ${formatPercent(row.percent)}`}
          >
            <div
              className={cn('h-full', radius.full, chartReveal)}
              style={{
                width: `${Math.max(0, Math.min(100, row.percent))}%`,
                background: row.leading ? 'var(--cq-chart-1)' : 'var(--cq-chart-5)',
              }}
            />
          </div>
          {row.hint ? <p className={cn('mt-1', text.hint)}>{row.hint}</p> : null}
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------- Sparkline */

/**
 * A 40×16 trend glyph for a metric card.
 *
 * Purely supporting: it carries no axis and no scale, so it is marked `aria-hidden` and the card's
 * own delta text carries the meaning. A glyph that claimed to be readable at this size would be
 * lying about its precision.
 */
export function Sparkline({ values, className }: { values: number[]; className?: string }) {
  if (values.length < 2) return null;
  const peak = Math.max(...values, 1);
  const step = 40 / (values.length - 1);
  const points = values
    .map((value, index) => `${(index * step).toFixed(2)},${(16 - (value / peak) * 15).toFixed(2)}`)
    .join(' ');

  return (
    <svg
      viewBox="0 0 40 16"
      width="40"
      height="16"
      aria-hidden="true"
      focusable="false"
      className={cn('shrink-0 overflow-visible', className)}
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* ------------------------------------------------------------- Gauge row */

/**
 * A labelled count with a proportion track. Used for severity triage, where the question is
 * "how much of the total is this severity" rather than "what is the trend".
 */
export function GaugeRow({
  label,
  count,
  total,
  tone,
  children,
}: {
  label: string;
  count: number;
  total: number;
  /** Any CSS colour, normally a semantic token. */
  tone: string;
  children?: ReactNode;
}) {
  const share = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className={cn('inline-flex items-center gap-2', text.body)}>
          <span
            aria-hidden="true"
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: tone }}
          />
          {label}
        </span>
        <span className={cn('tabular-nums', text.bodyStrong)}>{formatCount(count)}</span>
      </div>
      <div
        className={cn('mt-1.5 h-1 w-full overflow-hidden bg-[var(--cq-sunken)]', radius.full)}
        aria-hidden="true"
      >
        <div
          className={cn('h-full', radius.full, chartReveal)}
          style={{ width: `${share}%`, background: tone }}
        />
      </div>
      {children}
    </div>
  );
}
