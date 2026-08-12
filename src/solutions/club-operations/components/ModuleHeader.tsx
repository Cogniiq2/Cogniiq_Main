// The module's own header.
//
// Not a page chrome: the surrounding Cogniiq shell still owns the sidebar, the account menu and the
// organisation switcher, and this deliberately duplicates none of them. What it does own is the
// orientation the module itself is responsible for — which dataset, which period, how fresh, and
// how healthy — so a reader arriving cold knows what they are looking at before they read a figure.
//
// Three things are absent on purpose:
//   * any account, profile or organisation control — those belong to the shell;
//   * any claim of live data, synchronisation or connection status. The dataset is fictional, and a
//     green "Verbunden" dot next to fixtures would be a lie told in the most credible place on the
//     page. The fixture badge sits where that dot would normally go, for exactly that reason;
//   * any refresh or export control, because nothing in this phase can perform one.

import { CircleDot, Database } from 'lucide-react';

import { border, radius, surface, text } from '@/components/dashboard/tokens';
import { cn } from '@/lib/utils';

import { healthVerdict } from '../attention';
import { formatDayKey, formatDayRange } from '../formatting';
import type { OperationalHealth, PeriodBounds } from '../types';
import { HealthPills } from './AttentionPanel';

const verdictTone = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-red-200 bg-red-50 text-red-700',
} as const;

export function ModuleHeader({
  bounds,
  periodLabel,
  dataAsOf,
  health,
  nav,
}: {
  /** The window the overview currently covers. */
  bounds: PeriodBounds | null;
  periodLabel: string;
  dataAsOf: string;
  health: OperationalHealth | null;
  /** The internal navigation, rendered inside the header so the two read as one control surface. */
  nav: React.ReactNode;
}) {
  const verdict = health ? healthVerdict(health) : null;

  return (
    // A <section>, not a <header>. The host shell owns the page's banner landmark; a second one
    // here would compete with it in the landmark list, and this block is the module's own
    // introduction rather than the page's.
    <section aria-label="Modulkopf Vereinsbetrieb" className={cn(surface.card, 'overflow-hidden p-0')}>
      <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className={text.pageTitle}>Vereinsbetrieb</h1>
            {/* Where a live-connection indicator would sit. It says the opposite, on purpose. */}
            <span
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 border border-dashed px-2 py-0.5 text-[11px] font-medium leading-4',
                radius.sm,
                'border-[var(--cq-border-strong)] bg-[var(--cq-sunken)] text-[var(--cq-fg-muted)]',
              )}
            >
              <Database size={11} aria-hidden="true" />
              Beispieldaten
            </span>
          </div>

          <p className={cn('mt-1.5 max-w-2xl', text.body)}>
            Buchungen, Zahlungen, Rechnungen und Umsatzsteuer des Vereins — nur lesend.
          </p>

          <dl className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5">
            <div className="flex items-baseline gap-1.5">
              <dt className={text.eyebrow}>Zeitraum</dt>
              <dd className={cn('tabular-nums', text.bodyStrong)}>
                {periodLabel}
                {bounds ? (
                  <span className={cn('ml-1.5 font-normal', text.hint)}>
                    {formatDayRange(bounds.start, bounds.end)}
                  </span>
                ) : null}
              </dd>
            </div>
            <div className="flex items-baseline gap-1.5">
              <dt className={text.eyebrow}>Datenstand</dt>
              <dd className={cn('tabular-nums', text.bodyStrong)}>{formatDayKey(dataAsOf)}</dd>
            </div>
          </dl>
        </div>

        {/* Operational health. The one thing worth reading before anything else on the page. */}
        {verdict && health ? (
          <div
            className={cn(
              'flex shrink-0 flex-col gap-2.5 p-3.5 lg:min-w-[268px]',
              border.hairline,
              radius.lg,
              'bg-[var(--cq-sunken)]',
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <span className={text.eyebrow}>Betriebslage</span>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 border px-2 py-0.5 text-[11px] font-medium leading-4',
                  radius.sm,
                  verdictTone[verdict.tone],
                )}
              >
                <CircleDot size={11} aria-hidden="true" />
                {verdict.label}
              </span>
            </div>
            <HealthPills health={health} />
          </div>
        ) : null}
      </div>

      <div className={cn('bg-[var(--cq-sunken)] px-3 py-2', border.hairlineT)}>{nav}</div>
    </section>
  );
}
