import { AlertTriangle, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  Button, PremiumSelect, StatusBadge, border, radius, surface, text,
} from '@/components/dashboard';
import { Meter } from '@/components/services/servicePrimitives';
import {
  ENGAGEMENT_STATUS_ORDER, GATED_STATUSES, SERVICE_BY_KEY,
  engagementStatusLabel, engagementStatusTone,
} from '@/lib/serviceOnboarding/catalog';
import type { NextAction, ReadinessResult } from '@/lib/serviceOnboarding/readiness';
import type { EngagementDetail, EngagementStatus, GoLiveGate } from '@/lib/serviceOnboarding/types';

/**
 * The command centre.
 *
 * Everything needed to understand a client after three weeks away, in one glance and in a fixed
 * order: who, which service, what phase, how ready, whether they may go live, what is in the way,
 * and the single next thing to do. The rest of the workspace is detail behind this.
 */
export function EngagementHero({
  detail, readiness, gate, nextAction, onStatusChange, onShowBlockers, onContinue, statusSaving,
}: {
  detail: EngagementDetail;
  readiness: ReadinessResult;
  gate: GoLiveGate;
  nextAction: NextAction | null;
  onStatusChange: (status: EngagementStatus) => void;
  onShowBlockers: () => void;
  onContinue: () => void;
  statusSaving?: boolean;
}) {
  const { engagement, customer } = detail;
  const definition = SERVICE_BY_KEY[engagement.service_key];
  const Icon = definition.icon;
  const name = customer.company?.trim() || customer.contact_name?.trim() || customer.email?.trim() || 'Unbenannter Kunde';

  return (
    /* The command centre must dominate the page. It earns that with a stronger hairline and its
       own internal rhythm rather than elevation: `elevation.e1` currently compiles to a shadow
       COLOUR only (Tailwind reads `shadow-[var(--cq-elev-1)]` as a colour utility), so a raised
       surface would render identically to a flat card while pretending otherwise. */
    <section
      className={cn('overflow-hidden', surface.card, 'border-[var(--cq-border-strong)]')}
      aria-label="Projektstatus"
    >
      <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-8">
        {/* Identity + phase + next action */}
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center bg-[var(--cq-sunken)] text-[var(--cq-fg-muted)]', border.hairline, radius.md)} aria-hidden="true">
              <Icon size={17} />
            </span>
            <div className="min-w-0">
              <h1 className={cn('[overflow-wrap:anywhere]', text.pageTitle)}>{name}</h1>
              <p className={cn('mt-0.5', text.body)}>{definition.name}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <StatusBadge
              label={engagementStatusLabel[engagement.lifecycle_status]}
              tone={engagementStatusTone[engagement.lifecycle_status]}
            />
            {engagement.healthcare ? <StatusBadge label="Healthcare" tone="info" /> : null}
            {engagement.template_code ? (
              <span className={text.hint}>
                Vorlage {engagement.template_code} · v{engagement.template_version}
              </span>
            ) : null}
          </div>

          <div className="mt-4 max-w-xl">
            {/* The eyebrow tone is lifted from --cq-fg-subtle to --cq-fg-muted here: these two
                labels head the most important block on the page, and the shared hint tone sits
                below 4.5:1 on white. */}
            <p className={cn('mb-1.5', text.eyebrow, 'text-[var(--cq-fg-muted)]')}>Nächster Schritt</p>
            {nextAction ? (
              <>
                <p className={cn('[overflow-wrap:anywhere]', text.bodyStrong)}>{nextAction.title}</p>
                <p className={cn('mt-0.5 [overflow-wrap:anywhere]', text.body)}>{nextAction.reason}</p>
              </>
            ) : (
              <p className={text.body}>
                Alles Erforderliche ist erledigt. Es steht aktuell kein weiterer Schritt offen.
              </p>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {gate.count > 0 ? (
              <Button variant="secondary" icon={ShieldAlert} onClick={onShowBlockers}>
                {gate.count === 1 ? '1 Blocker ansehen' : `${gate.count} Blocker ansehen`}
              </Button>
            ) : null}
            {nextAction ? (
              <Button icon={ArrowRight} onClick={onContinue}>Onboarding fortsetzen</Button>
            ) : null}
          </div>
        </div>

        {/* Readiness + go-live gate */}
        <div className={cn('min-w-0 lg:border-l lg:border-[var(--cq-border)] lg:pl-6')}>
          <p className={cn(text.eyebrow, 'text-[var(--cq-fg-muted)]')}>Bereitschaft</p>
          <p className={cn('mt-1', text.metric)}>
            {readiness.percent === null ? '—' : `${readiness.percent}%`}
          </p>
          <Meter
            percent={readiness.percent}
            tone={gate.count > 0 ? 'blocked' : readiness.percent === 100 ? 'complete' : 'progress'}
            className="mt-2"
          />
          <p className={cn('mt-1.5', text.hint)}>
            {readiness.total === 0
              ? 'Noch keine erforderlichen Schritte'
              : `${readiness.done} von ${readiness.total} erforderlichen Punkten`}
          </p>

          <div
            className={cn(
              'mt-4 flex items-start gap-2 p-3',
              radius.lg,
              gate.ready ? 'border border-emerald-200 bg-emerald-50' : 'border border-amber-200 bg-amber-50',
            )}
          >
            {gate.ready
              ? <CheckCircle2 size={15} className="mt-px shrink-0 text-emerald-600" aria-hidden="true" />
              : <AlertTriangle size={15} className="mt-px shrink-0 text-amber-600" aria-hidden="true" />}
            <div className="min-w-0">
              <p className={cn('text-[12.5px] font-semibold leading-4', gate.ready ? 'text-emerald-800' : 'text-amber-800')}>
                {gate.ready ? 'Go-Live: freigegeben' : 'Go-Live: gesperrt'}
              </p>
              <p className={cn('mt-0.5 text-[11.5px] leading-4', gate.ready ? 'text-emerald-700' : 'text-amber-700')}>
                {gate.ready
                  ? 'Alle erforderlichen Freigaben liegen vor.'
                  : gate.count === 1
                    ? '1 Punkt verhindert den Produktivstart.'
                    : `${gate.count} Punkte verhindern den Produktivstart.`}
              </p>
            </div>
          </div>

          <div className="mt-3">
            <PremiumSelect
              id="engagement-status"
              label="Projektphase"
              value={engagement.lifecycle_status}
              onChange={(value) => onStatusChange(value as EngagementStatus)}
              disabled={statusSaving}
              options={ENGAGEMENT_STATUS_ORDER.map((status) => ({
                value: status,
                label: engagementStatusLabel[status],
                // Gated phases stay visible but unselectable, so the reason is obvious rather
                // than the option simply vanishing.
                disabled: !gate.ready && GATED_STATUSES.includes(status),
                description: !gate.ready && GATED_STATUSES.includes(status)
                  ? 'Gesperrt, solange Go-Live-Blocker offen sind'
                  : undefined,
              }))}
              hint={gate.ready ? undefined : 'Startbereit, Live und Monitoring bleiben gesperrt, solange Blocker offen sind.'}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default EngagementHero;
