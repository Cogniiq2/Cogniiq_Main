import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity, AlertTriangle, CheckCircle2, FileSignature, Plus, Radio, ShieldAlert, Target,
} from 'lucide-react';

import {
  Button, Card, EmptyState, ErrorState, KpiCard, KpiSkeletonGrid, PageHeader,
  SectionHeader, StatusBadge, TableSkeleton, text,
} from '@/components/dashboard';
import { cn } from '@/lib/utils';
import { useOwnerEntity } from '@/pages/owner/ownerContext';
import { LeadFormDialog } from '@/components/crm/LeadFormDialog';
import { loadCommandCenter, localIsoDate } from '@/lib/ownerCrm/api';
import {
  ACTIVE_LEAD_STAGES, integrationCheckStatusLabel, leadStageLabel, leadStageTone,
  offerStatusLabel, offerStatusTone,
} from '@/lib/ownerCrm/catalog';
import { computeCommandNextActions, dayCountLabel, dayCountLabelDative, daysBetween } from '@/lib/ownerCrm/nextActions';
import { engagementStatusLabel, engagementStatusTone, SERVICE_BY_KEY } from '@/lib/serviceOnboarding/catalog';
import { formatCentsCurrencyDe, formatDateDe } from '@/lib/ownerFinance/exports';
import type { CommandCenterData } from '@/lib/ownerCrm/types';
import type { EngagementStatus } from '@/lib/serviceOnboarding/types';

/**
 * The owner's cockpit: what needs attention today, what the sales pipeline
 * looks like, and where every active delivery stands.
 *
 * Everything here is derived from rows that exist. There is no forecast, no
 * score and no recommendation — "Follow-up 2 Tage überfällig" is a follow-up row
 * whose due date was two days ago. A number that cannot be traced back to a
 * record does not belong on this page.
 */

const SEVERITY_STYLE: Record<string, string> = {
  overdue: 'border-red-200 bg-red-50 text-red-800',
  due: 'border-amber-200 bg-amber-50 text-amber-800',
  attention: 'border-[var(--cq-border)] bg-[var(--cq-sunken)] text-[var(--cq-fg)]',
  info: 'border-[var(--cq-border-subtle)] bg-[var(--cq-surface)] text-[var(--cq-fg-muted)]',
};

/** Engagement states the owner should look at rather than simply count. */
const ATTENTION_STATUSES: EngagementStatus[] = ['client_approval', 'ready_for_go_live', 'monitoring'];

export function CommandCenterPage() {
  const { entity } = useOwnerEntity();
  const navigate = useNavigate();
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const today = useMemo(() => localIsoDate(), []);

  const load = useCallback(async () => {
    if (!entity) return;
    setLoading(true);
    try {
      setData(await loadCommandCenter(entity.id, today));
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [entity, today]);

  useEffect(() => { void load(); }, [load]);

  const nextActions = useMemo(
    () => (data ? computeCommandNextActions(data, { today, limit: 12 }) : []),
    [data, today],
  );

  const overdueFollowUps = data?.follow_ups.filter((f) => f.bucket === 'overdue') ?? [];
  const todayFollowUps = data?.follow_ups.filter((f) => f.bucket === 'today') ?? [];

  const pipelineTotals = useMemo(() => {
    if (!data) return { count: 0, setupCents: 0, monthlyCents: 0 };
    return data.pipeline
      .filter((b) => (ACTIVE_LEAD_STAGES as string[]).includes(b.stage))
      .reduce(
        (acc, b) => ({
          count: acc.count + b.count,
          setupCents: acc.setupCents + b.estimated_setup_cents,
          monthlyCents: acc.monthlyCents + b.estimated_monthly_cents,
        }),
        { count: 0, setupCents: 0, monthlyCents: 0 },
      );
  }, [data]);

  const engagementByStatus = useMemo(() => {
    const map = new Map<EngagementStatus, number>();
    for (const b of data?.engagements ?? []) {
      const key = b.lifecycle_status as EngagementStatus;
      map.set(key, (map.get(key) ?? 0) + b.count);
    }
    return map;
  }, [data]);

  const liveCount = (engagementByStatus.get('live') ?? 0) + (engagementByStatus.get('monitoring') ?? 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Cockpit"
        description="Was heute Ihre Aufmerksamkeit braucht — abgeleitet aus den vorhandenen Daten."
        actions={(
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => navigate('/admin/finance/leads')}>
              <Target size={15} aria-hidden="true" /> Leads
            </Button>
            <Button onClick={() => setCreateOpen(true)} disabled={!entity}>
              <Plus size={15} aria-hidden="true" /> Lead hinzufügen
            </Button>
          </div>
        )}
      />

      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}

      {loading && !data ? (
        <>
          <KpiSkeletonGrid count={4} />
          <TableSkeleton rows={5} cols={3} />
        </>
      ) : null}

      {data ? (
        <>
          {/* ------------------------------------------------------- KPIs */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Überfällig" icon={AlertTriangle}
              value={String(overdueFollowUps.length + data.overdue_tasks.length)}
              tone={overdueFollowUps.length + data.overdue_tasks.length > 0 ? 'negative' : 'neutral'}
              hint={todayFollowUps.length > 0 ? `${todayFollowUps.length} weitere heute fällig` : 'Follow-ups und Aufgaben'}
            />
            <KpiCard
              label="Aktive Leads" icon={Target} value={String(pipelineTotals.count)}
              to="/admin/finance/leads"
              hint={pipelineTotals.setupCents > 0 ? `${formatCentsCurrencyDe(pipelineTotals.setupCents)} Potenzial` : undefined}
            />
            <KpiCard
              label="Offene Angebote" icon={FileSignature} value={String(data.open_offers.length)}
              to="/admin/finance/offers"
            />
            <KpiCard
              label="Blocker" icon={ShieldAlert} value={String(data.blockers.length)}
              tone={data.blockers.length > 0 ? 'negative' : 'neutral'}
              hint={liveCount > 0 ? `${liveCount} live` : undefined}
            />
          </div>

          {/* ----------------------------------------------- Nächste Schritte */}
          <Card>
            <SectionHeader
              title="Nächste Schritte"
              description="Deterministisch aus offenen Follow-ups, Aufgaben, Blockern und Prüfungen abgeleitet."
            />
            <div className="mt-3">
              {nextActions.length === 0 ? (
                <div className={cn('flex items-center gap-2 rounded-[10px] border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[13px] leading-5 text-emerald-800')}>
                  <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Nichts Überfälliges. Alle Follow-ups, Aufgaben und Prüfungen sind auf Kurs.
                </div>
              ) : (
                <ul className="space-y-2">
                  {nextActions.map((action, i) => {
                    const body = (
                      <>
                        <p className="text-[13px] font-medium leading-5">{action.label}</p>
                        {action.detail ? <p className="mt-0.5 text-[12px] leading-4 opacity-80">{action.detail}</p> : null}
                      </>
                    );
                    const className = cn('block rounded-[10px] border px-3 py-2', SEVERITY_STYLE[action.severity]);
                    return (
                      <li key={`${action.kind}-${action.label}-${i}`}>
                        {action.leadId
                          ? <Link to={`/admin/finance/leads/${action.leadId}`} className={cn(className, 'hover:opacity-90')}>{body}</Link>
                          : <div className={className}>{body}</div>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* ------------------------------------------------- Follow-ups */}
            <Card>
              <SectionHeader
                title="Follow-ups"
                description={data.upcoming_follow_up_count > 0
                  ? `${data.upcoming_follow_up_count} weitere in der Zukunft geplant.`
                  : 'Keine weiteren Termine geplant.'}
              />
              <div className="mt-3">
                {data.follow_ups.length === 0 ? (
                  <p className={text.hint}>Heute steht kein Follow-up an.</p>
                ) : (
                  <ul className="divide-y divide-[var(--cq-border-subtle)]">
                    {data.follow_ups.map((f) => {
                      const overdue = daysBetween(f.due_at, today);
                      return (
                        <li key={f.follow_up_id} className="py-2.5">
                          <Link to={`/admin/finance/leads/${f.lead_id}`} className="block hover:underline">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <span className={text.bodyStrong}>{f.lead_name}</span>
                              <StatusBadge
                                label={f.bucket === 'overdue' ? `${dayCountLabel(overdue)} überfällig` : 'Heute'}
                                tone={f.bucket === 'overdue' ? 'danger' : 'warning'}
                              />
                            </div>
                            <p className={text.hint}>
                              {formatDateDe(f.due_at)} · {leadStageLabel[f.stage]}
                              {f.reason ? ` · ${f.reason}` : ''}
                            </p>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {data.leads_without_follow_up.length > 0 ? (
                  <div className="mt-4">
                    <p className={cn('mb-1.5', text.eyebrow)}>Ohne geplantes Follow-up</p>
                    <ul className="space-y-0.5">
                      {data.leads_without_follow_up.slice(0, 6).map((l) => (
                        <li key={l.lead_id}>
                          {/* py-1 keeps the row a comfortable tap target on a phone. */}
                          <Link to={`/admin/finance/leads/${l.lead_id}`} className={cn('flex flex-wrap items-center gap-2 py-1 hover:underline', text.hint)}>
                            <span className="text-[var(--cq-fg)]">{l.lead_name}</span>
                            <StatusBadge label={leadStageLabel[l.stage]} tone={leadStageTone[l.stage]} />
                            <span>seit {dayCountLabelDative(daysBetween(l.last_activity_at, today))} ruhig</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    {data.leads_without_follow_up.length > 6 ? (
                      <p className={cn('mt-1', text.hint)}>
                        und {data.leads_without_follow_up.length - 6} weitere.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </Card>

            {/* ----------------------------------------------------- Tasks */}
            <Card>
              <SectionHeader title="Überfällige Aufgaben" description="Vertrieb und Kundenbetreuung." />
              <div className="mt-3">
                {data.overdue_tasks.length === 0 ? (
                  <p className={text.hint}>Keine überfälligen Aufgaben.</p>
                ) : (
                  <ul className="divide-y divide-[var(--cq-border-subtle)]">
                    {data.overdue_tasks.slice(0, 10).map((t) => {
                      const overdue = daysBetween(t.due_date, today);
                      const href = t.lead_id
                        ? `/admin/finance/leads/${t.lead_id}`
                        : `/admin/finance/customers/${t.customer_id}`;
                      return (
                        <li key={t.task_id} className="py-2.5">
                          <Link to={href} className="block hover:underline">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <span className={text.bodyStrong}>{t.title}</span>
                              <StatusBadge
                                label={overdue > 0 ? `${dayCountLabel(overdue)} überfällig` : 'Heute'}
                                tone={overdue > 0 ? 'danger' : 'warning'}
                              />
                            </div>
                            <p className={text.hint}>
                              {t.subject_name} · {t.subject_kind === 'lead' ? 'Lead' : 'Kunde'}
                            </p>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </Card>
          </div>

          {/* ------------------------------------------------------ Pipeline */}
          <Card>
            <SectionHeader
              title="Vertriebspipeline"
              description="Manuell gepflegt. Beträge sind Ihre eigenen Schätzungen, keine Prognose."
              action={<Link to="/admin/finance/leads" className={cn(text.hint, 'inline-flex min-h-[24px] items-center hover:underline')}>Alle Leads</Link>}
            />
            <div className="mt-3 overflow-x-auto">
              <div className="flex min-w-max gap-2">
                {ACTIVE_LEAD_STAGES.map((stage) => {
                  const bucket = data.pipeline.find((b) => b.stage === stage);
                  const count = bucket?.count ?? 0;
                  return (
                    <div
                      key={stage}
                      className={cn(
                        'min-w-[8.5rem] flex-1 rounded-[10px] border border-[var(--cq-border-subtle)] px-3 py-2.5',
                        count === 0 && 'opacity-55',
                      )}
                    >
                      <p className={text.eyebrow}>{leadStageLabel[stage]}</p>
                      <p className={cn('mt-1', text.metric)}>{count}</p>
                      {bucket && bucket.estimated_setup_cents > 0 ? (
                        <p className={cn('mt-0.5', text.hint)}>{formatCentsCurrencyDe(bucket.estimated_setup_cents)}</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className={cn('mt-3 flex flex-wrap gap-x-5 gap-y-1', text.hint)}>
              <span>Gesamt Setup: {formatCentsCurrencyDe(pipelineTotals.setupCents)}</span>
              <span>Gesamt monatlich: {formatCentsCurrencyDe(pipelineTotals.monthlyCents)}</span>
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* ------------------------------------------------ Open offers */}
            <Card>
              <SectionHeader title="Offene Angebote" description="Verbindlich, versendet oder angesehen — und noch unbeantwortet." />
              <div className="mt-3">
                {data.open_offers.length === 0 ? (
                  <p className={text.hint}>Kein offenes Angebot.</p>
                ) : (
                  <ul className="divide-y divide-[var(--cq-border-subtle)]">
                    {data.open_offers.slice(0, 8).map((o) => (
                      <li key={o.offer_id} className="py-2.5">
                        <Link to={`/admin/finance/offers/${o.offer_id}`} className="block hover:underline">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <span className={text.bodyStrong}>{o.subject_name}</span>
                            <span className={text.numeric}>{formatCentsCurrencyDe(o.gross_total_cents)}</span>
                          </div>
                          <div className={cn('mt-0.5 flex flex-wrap items-center gap-2', text.hint)}>
                            <StatusBadge label={offerStatusLabel[o.status] ?? o.status} tone={offerStatusTone[o.status] ?? 'neutral'} />
                            <span>seit {dayCountLabelDative(daysBetween(o.created_at, today))}</span>
                            {o.offer_number ? <span>{o.offer_number}</span> : null}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>

            {/* ------------------------------------------- Integration gate */}
            <Card>
              <SectionHeader
                title="Schnittstellen-Prüfung offen"
                description="Vor dem Angebot zu klären, damit keine Drittanbieter-Kosten nachträglich auftauchen."
              />
              <div className="mt-3">
                {data.integration_gate_open.length === 0 ? (
                  <p className={text.hint}>Keine offene Prüfung.</p>
                ) : (
                  <ul className="divide-y divide-[var(--cq-border-subtle)]">
                    {data.integration_gate_open.map((g) => (
                      <li key={g.lead_id} className="py-2.5">
                        <Link to={`/admin/finance/leads/${g.lead_id}`} className="block hover:underline">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <span className={text.bodyStrong}>{g.lead_name}</span>
                            <StatusBadge label={integrationCheckStatusLabel[g.integration_status]} tone="warning" />
                          </div>
                          <p className={text.hint}>{leadStageLabel[g.stage]}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          </div>

          {/* ------------------------------------------------------ Delivery */}
          <Card>
            <SectionHeader
              title="Umsetzung"
              description="Aktive Leistungen nach Lebenszyklus."
              action={<Link to="/admin/finance/customers" className={cn(text.hint, 'inline-flex min-h-[24px] items-center hover:underline')}>Alle Kunden</Link>}
            />
            <div className="mt-3">
              {data.engagements.length === 0 ? (
                <p className={text.hint}>Noch keine aktive Leistung.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {Array.from(engagementByStatus.entries())
                    .sort((a, b) => b[1] - a[1])
                    .map(([status, count]) => (
                      <div
                        key={status}
                        className={cn(
                          'min-w-[7.5rem] rounded-[10px] border border-[var(--cq-border-subtle)] px-3 py-2.5',
                          ATTENTION_STATUSES.includes(status) && 'border-[var(--cq-border-strong)]',
                        )}
                      >
                        <StatusBadge label={engagementStatusLabel[status] ?? status} tone={engagementStatusTone[status] ?? 'neutral'} />
                        <p className={cn('mt-1.5', text.metric)}>{count}</p>
                      </div>
                    ))}
                </div>
              )}

              {/* Per-service breakdown, so "3 in Aufbau" says which product. */}
              {data.engagements.length > 0 ? (
                <ul className={cn('mt-3 flex flex-wrap gap-x-4 gap-y-1', text.hint)}>
                  {data.engagements.map((b) => (
                    <li key={`${b.service_key}-${b.lifecycle_status}`}>
                      {SERVICE_BY_KEY[b.service_key]?.name ?? b.service_key}: {b.count} × {engagementStatusLabel[b.lifecycle_status as EngagementStatus] ?? b.lifecycle_status}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* ---------------------------------------------------- Waiting */}
            <Card>
              <SectionHeader
                title="Wir warten auf den Kunden"
                description="Offene Rückmeldungen aus dem Onboarding. Diese Liste ist intern."
              />
              <div className="mt-3">
                {data.waiting_for_client.length === 0 ? (
                  <p className={text.hint}>Es steht keine Kundenrückmeldung aus.</p>
                ) : (
                  <ul className="divide-y divide-[var(--cq-border-subtle)]">
                    {data.waiting_for_client.slice(0, 10).map((w) => (
                      <li key={w.task_id} className="py-2.5">
                        <Link
                          to={`/admin/finance/customers/${w.customer_id}/services/${w.service_key}`}
                          className="block hover:underline"
                        >
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <span className={text.bodyStrong}>{w.title}</span>
                            <span className={text.hint}>seit {dayCountLabelDative(daysBetween(w.updated_at, today))}</span>
                          </div>
                          <p className={text.hint}>
                            {w.customer_name}
                            {w.client_request ? ` · ${w.client_request}` : ''}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>

            {/* --------------------------------------------------- Blockers */}
            <Card>
              <SectionHeader title="Blocker" description="Verhindern den Go-Live, bis sie aufgelöst sind." />
              <div className="mt-3">
                {data.blockers.length === 0 ? (
                  <p className={text.hint}>Keine offenen Blocker.</p>
                ) : (
                  <ul className="divide-y divide-[var(--cq-border-subtle)]">
                    {data.blockers.slice(0, 10).map((b) => (
                      <li key={b.task_id} className="py-2.5">
                        <Link
                          to={`/admin/finance/customers/${b.customer_id}/services/${b.service_key}`}
                          className="block hover:underline"
                        >
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <span className={text.bodyStrong}>{b.title}</span>
                            <StatusBadge label="Blockiert" tone="danger" />
                          </div>
                          <p className={text.hint}>
                            {b.customer_name}
                            {b.blocker_reason ? ` · ${b.blocker_reason}` : ''}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          </div>

          {/* ---------------------------------------------------- Monitoring */}
          {data.monitoring.length > 0 ? (
            <Card>
              <SectionHeader title="Frisch live" description="Erste Woche nach dem Start — engmaschig beobachten." />
              <ul className="mt-3 divide-y divide-[var(--cq-border-subtle)]">
                {data.monitoring.map((m) => (
                  <li key={m.engagement_id} className="py-2.5">
                    <Link to={`/admin/finance/customers/${m.customer_id}/services/${m.service_key}`} className="block hover:underline">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className={text.bodyStrong}>{m.customer_name}</span>
                        <span className={cn('inline-flex items-center gap-1', text.hint)}>
                          <Radio size={12} aria-hidden="true" />
                          seit {dayCountLabelDative(daysBetween(m.went_live_at, today))} live
                        </span>
                      </div>
                      <p className={text.hint}>
                        {SERVICE_BY_KEY[m.service_key]?.name ?? m.service_key}
                        {m.monitoring_until ? ` · Monitoring bis ${formatDateDe(m.monitoring_until)}` : ''}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </>
      ) : null}

      {!loading && !error && !data ? (
        <EmptyState
          icon={Activity}
          title="Noch keine Daten"
          description="Legen Sie Ihren ersten Lead an, um das Cockpit zu füllen."
          action={<Button onClick={() => setCreateOpen(true)}><Plus size={15} aria-hidden="true" /> Lead hinzufügen</Button>}
        />
      ) : null}

      {entity ? (
        <LeadFormDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          entityId={entity.id}
          onSaved={(id) => navigate(`/admin/finance/leads/${id}`)}
        />
      ) : null}
    </div>
  );
}

export default CommandCenterPage;
