// "Aufmerksamkeit erforderlich".
//
// The one place on the overview that answers "what should I do next". Everything else on that page
// reports; this ranks.
//
// Each row is a control that opens its own section with the filter that reproduces exactly these
// rows — so the count is never something the reader has to take on faith. It is not a mutation: the
// module has no write path, and the row's accessible name says where it goes, not what it does.

import { ArrowRight, ShieldCheck } from 'lucide-react';

import { border, focusRingOnSurface, radius, space, surface, text } from '@/components/dashboard/tokens';
import { cn } from '@/lib/utils';

import { fadeIn, feedback } from '../motion';
import { formatCents, formatCount } from '../formatting';
import { attentionSeverityLabels, sectionTargetLabels } from '../labels';
import type { AttentionItem, AttentionSeverity } from '../types';

/**
 * Severity is carried by a rail on the leading edge rather than by tinting the whole row.
 *
 * Eight tinted rows in four colours is a heat map, not a priority list — the eye lands on whichever
 * colour is largest rather than on whatever is topmost.
 */
const severityRail: Record<AttentionSeverity, string> = {
  critical: 'bg-red-600',
  high: 'bg-amber-500',
  medium: 'bg-sky-500',
  low: 'bg-[var(--cq-border-strong)]',
};

const severityText: Record<AttentionSeverity, string> = {
  critical: 'text-red-700',
  high: 'text-amber-700',
  medium: 'text-sky-700',
  low: 'text-[var(--cq-fg-muted)]',
};

export function AttentionPanel({
  items,
  onOpen,
}: {
  items: AttentionItem[];
  onOpen: (item: AttentionItem) => void;
}) {
  if (items.length === 0) {
    return (
      <div className={cn(surface.card, space.cardPadding, 'flex items-start gap-3')}>
        <span
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center bg-emerald-50 text-emerald-700',
            radius.lg,
          )}
        >
          <ShieldCheck size={16} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className={text.cardTitle}>Keine offenen Punkte</p>
          <p className={cn('mt-1', text.body)}>
            Zahlungen, Rechnungen, Abgleich und Meldungen sind im gewählten Datenbestand ohne
            Auffälligkeiten.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(surface.card, 'overflow-hidden p-0')}>
      <ul className="divide-y divide-[var(--cq-border-subtle)]">
        {items.map((item) => (
          <li key={item.id} className={fadeIn}>
            <button
              type="button"
              onClick={() => onOpen(item)}
              aria-label={`${item.title}: ${item.count} — ${sectionTargetLabels[item.target.section]} öffnen`}
              className={cn(
                'group relative flex w-full items-start gap-3 py-3 pl-5 pr-4 text-left',
                feedback,
                focusRingOnSurface,
                'hover:bg-[var(--cq-hover)]',
              )}
            >
              <span
                aria-hidden="true"
                className={cn('absolute inset-y-0 left-0 w-[3px]', severityRail[item.severity])}
              />

              {/* Count leads: the reader scans a column of numbers, then reads the one that is large. */}
              <span
                className={cn(
                  'w-9 shrink-0 pt-0.5 text-right text-[17px] font-semibold leading-6 tabular-nums',
                  severityText[item.severity],
                )}
              >
                {formatCount(item.count)}
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <span className={text.bodyStrong}>{item.title}</span>
                  <span className={cn('shrink-0', text.hint)}>
                    {attentionSeverityLabels[item.severity]}
                  </span>
                </span>
                <span className={cn('mt-0.5 block', text.hint)}>{item.detail}</span>
              </span>

              <span className="flex shrink-0 items-center gap-2 pt-0.5">
                {item.amountCents ? (
                  <span className={cn('tabular-nums', text.bodyStrong)}>
                    {formatCents(item.amountCents)}
                  </span>
                ) : null}
                <ArrowRight
                  size={14}
                  aria-hidden="true"
                  className={cn(
                    'text-[var(--cq-fg-subtle)] group-hover:translate-x-0.5 group-hover:text-[var(--cq-fg)]',
                    'transition-[transform,color] duration-fast ease-premium',
                  )}
                />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Compact severity pills for the module header.
 *
 * Rendered as static text, not controls: the header is orientation, and a control there would
 * compete with the navigation sitting directly beside it.
 */
export function HealthPills({
  health,
}: {
  health: { critical: number; high: number; medium: number; low: number };
}) {
  const entries: [AttentionSeverity, number][] = [
    ['critical', health.critical],
    ['high', health.high],
    ['medium', health.medium],
    ['low', health.low],
  ];
  const shown = entries.filter(([, count]) => count > 0);

  if (shown.length === 0) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 border px-2 py-0.5 text-[11px] font-medium leading-4',
          radius.sm,
          'border-emerald-200 bg-emerald-50 text-emerald-700',
        )}
      >
        <ShieldCheck size={11} aria-hidden="true" />
        Keine offenen Punkte
      </span>
    );
  }

  return (
    <ul className={cn('inline-flex items-center overflow-hidden', border.hairline, radius.sm)}>
      {shown.map(([severity, count], index) => (
        <li
          key={severity}
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium leading-4 tabular-nums',
            index > 0 && 'border-l border-[var(--cq-border)]',
            severityText[severity],
          )}
        >
          <span
            aria-hidden="true"
            className={cn('h-1.5 w-1.5 rounded-full', severityRail[severity])}
          />
          {count}
          <span className="text-[var(--cq-fg-subtle)]">{attentionSeverityLabels[severity]}</span>
        </li>
      ))}
    </ul>
  );
}
