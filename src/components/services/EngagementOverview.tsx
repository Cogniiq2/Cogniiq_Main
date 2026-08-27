import { ArrowUpRight, ShieldCheck } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Card, SectionHeader, StatusBadge, border, focusRing, interactive, radius, text } from '@/components/dashboard';
import { InlineEmpty, Meter } from '@/components/services/servicePrimitives';
import { formatDateDe } from '@/lib/ownerFinance/exports';
import { readinessCategoryLabel, taskStatusLabel } from '@/lib/serviceOnboarding/catalog';
import type { NextAction, ReadinessResult } from '@/lib/serviceOnboarding/readiness';
import type {
  EngagementActivity, EngagementSection, EngagementTaskStatus, GoLiveBlocker, GoLiveGate,
} from '@/lib/serviceOnboarding/types';

/* ------------------------------------------------------------------ Readiness */

/**
 * Nine categories, one line each: label, meter, number, and a blocker marker where it applies.
 *
 * Comparison is the whole point, so the rows share a grid and the numbers are tabular — the eye
 * runs down the column and finds the low one. A category with no applicable required items shows
 * "—", not 0%, because inventing a percentage for an empty set is a lie the owner would act on.
 */
export function ReadinessPanel({ readiness }: { readiness: ReadinessResult }) {
  return (
    <Card>
      <SectionHeader
        title="Bereitschaft nach Bereich"
        description="Nur erforderliche und zutreffende Punkte zählen."
      />
      {readiness.categories.length === 0 ? (
        <InlineEmpty>Für dieses Projekt sind noch keine Bereiche hinterlegt.</InlineEmpty>
      ) : (
        <ul className="space-y-2.5">
          {readiness.categories.map((category) => (
            <li key={category.category} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
              <div className="flex min-w-0 items-center gap-2">
                <span className={cn('truncate', text.body)}>{category.label}</span>
                {category.blockerCount > 0 ? (
                  <span className={cn('shrink-0 border border-amber-200 bg-amber-50 px-1.5 py-px text-[10px] font-medium text-amber-700', radius.sm)}>
                    {category.blockerCount} Blocker
                  </span>
                ) : null}
              </div>
              <span className={cn('shrink-0 text-[12.5px] font-medium tabular-nums', category.percent === null ? 'text-[var(--cq-fg-subtle)]' : 'text-[var(--cq-fg)]')}>
                {category.percent === null ? '—' : `${category.percent}%`}
              </span>
              <div className="col-span-2">
                <Meter
                  percent={category.percent}
                  tone={category.blockerCount > 0 ? 'blocked' : category.percent === 100 ? 'complete' : 'progress'}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ Next actions */

/**
 * The prioritised worklist. The ordering is deterministic (see `computeNextActions`): blocked
 * items first, then unresolved go-live blockers, then what the client owes, then work in flight,
 * then the next required step. No model decides this.
 */
export function NextActionsPanel({ actions, onSelect }: {
  actions: NextAction[];
  onSelect: (action: NextAction) => void;
}) {
  return (
    <Card>
      <SectionHeader title="Nächste Schritte" description="Automatisch nach Dringlichkeit sortiert." />
      {actions.length === 0 ? (
        <InlineEmpty>
          Es steht nichts Erforderliches mehr offen. Alle Pflichtangaben und Pflichtschritte sind erledigt.
        </InlineEmpty>
      ) : (
        <ol className="space-y-1">
          {actions.map((action, index) => (
            <li key={`${action.kind}-${action.id}`}>
              <button
                type="button"
                onClick={() => onSelect(action)}
                className={cn(
                  'group flex w-full items-start gap-3 px-2 py-2 text-left',
                  radius.md, interactive.transition, focusRing, 'hover:bg-[var(--cq-hover)]',
                )}
              >
                <span className={cn('mt-px w-4 shrink-0 text-right tabular-nums', text.hint)}>{index + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className={cn('block [overflow-wrap:anywhere]', text.bodyStrong)}>{action.title}</span>
                  <span className={cn('mt-0.5 block [overflow-wrap:anywhere]', text.body)}>{action.reason}</span>
                </span>
                {action.isGoLiveBlocker ? <StatusBadge label="Go-Live" tone="warning" /> : null}
                <ArrowUpRight
                  size={14}
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-[var(--cq-fg-subtle)] opacity-0 transition-opacity duration-fast group-hover:opacity-100 motion-reduce:transition-none"
                />
              </button>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ Blockers */

/**
 * Everything standing between this client and production, with the reason attached and a route
 * to the place it is fixed. A missing structured field is as much a blocker as an unfinished
 * task, and both appear here.
 */
export function BlockerPanel({ gate, sections, onSelect, id }: {
  gate: GoLiveGate;
  sections: EngagementSection[];
  onSelect: (blocker: GoLiveBlocker) => void;
  id?: string;
}) {
  const sectionTitle = new Map(sections.map((s) => [s.code, s.title]));

  return (
    <Card id={id}>
      <SectionHeader
        title="Go-Live-Blocker"
        description="Punkte, die den Produktivstart verhindern."
        action={
          gate.ready ? <StatusBadge label="Keine offenen Blocker" tone="success" /> : <StatusBadge label={`${gate.count} offen`} tone="danger" />
        }
      />
      {gate.ready ? (
        <div className={cn('flex items-start gap-2.5 border border-emerald-200 bg-emerald-50 p-3.5', radius.lg)}>
          <ShieldCheck size={16} className="mt-px shrink-0 text-emerald-600" aria-hidden="true" />
          <p className="text-[13px] leading-5 text-emerald-800">
            Alle erforderlichen Freigaben, Nachweise und Tests liegen vor. Der Produktivstart ist
            aus Sicht dieser Checkliste freigegeben.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--cq-border-subtle)]">
          {gate.blockers.map((blocker) => (
            <li key={`${blocker.kind}-${blocker.id}`}>
              <button
                type="button"
                onClick={() => onSelect(blocker)}
                className={cn('group flex w-full items-start gap-3 py-2.5 text-left', radius.md, interactive.transition, focusRing)}
              >
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className={cn('block [overflow-wrap:anywhere]', text.bodyStrong, 'group-hover:underline')}>
                    {blocker.title}
                  </span>
                  <span className={cn('mt-0.5 block [overflow-wrap:anywhere]', text.body)}>
                    {sectionTitle.get(blocker.section_code) ?? blocker.section_code}
                    {' · '}
                    {blocker.kind === 'field'
                      ? 'Pflichtangabe fehlt'
                      : blockerStatusText(blocker)}
                  </span>
                  {blocker.kind === 'task' && blocker.reason ? (
                    <span className="mt-0.5 block text-[12px] leading-4 text-red-700 [overflow-wrap:anywhere]">
                      {blocker.reason}
                    </span>
                  ) : null}
                  {blocker.kind === 'task' && blocker.client_request ? (
                    <span className="mt-0.5 block text-[12px] leading-4 text-amber-700 [overflow-wrap:anywhere]">
                      Vom Kunden benötigt: {blocker.client_request}
                    </span>
                  ) : null}
                </span>
                <span className={cn('shrink-0', text.hint)}>
                  {blocker.category ? readinessCategoryLabel[blocker.category] : 'Angabe'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/**
 * Who the ball is with. A blocked step is on us until its reason is resolved; a
 * waiting-for-client step is not, and the difference decides what the owner does next.
 */
function blockerStatusText(blocker: GoLiveBlocker): string {
  const status = blocker.status as EngagementTaskStatus;
  if (status === 'waiting_for_client') return 'Wartet auf Kunde';
  if (status === 'blocked') return 'Blockiert — liegt bei uns';
  return taskStatusLabel[status] ?? blocker.status;
}

/* ------------------------------------------------------------------ Activity */

export function ActivityPanel({ activity }: { activity: EngagementActivity[] }) {
  return (
    <Card>
      <SectionHeader title="Verlauf" description="Wichtige Statusänderungen, Freigaben und Angaben." />
      {activity.length === 0 ? (
        <InlineEmpty>Noch keine Ereignisse in diesem Projekt.</InlineEmpty>
      ) : (
        <ul className="space-y-3">
          {activity.map((entry) => (
            <li key={entry.id} className="relative pl-4">
              <span className={cn('absolute left-0 top-1.5 h-1.5 w-1.5 rounded-full', border.hairline, 'bg-[var(--cq-border-strong)]')} aria-hidden="true" />
              <p className={cn('[overflow-wrap:anywhere]', text.body)}>{entry.summary}</p>
              <p className={text.hint}>{formatDateDe(entry.created_at)}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
