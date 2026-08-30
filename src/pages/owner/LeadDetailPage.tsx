import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Archive, CalendarClock, CheckCircle2, FileSignature,
  MessageSquarePlus, Pencil, Plus, Target, Trophy, XCircle,
} from 'lucide-react';

import {
  Button, Card, ConfirmDialog, EmptyState, ErrorState, Field, InfoBanner, LoadingState,
  Modal, PageHeader, SectionHeader, Select, StatusBadge, Tabs, Textarea, border, text, useToast,
} from '@/components/dashboard';
import { cn } from '@/lib/utils';
import { useOwnerEntity } from '@/pages/owner/ownerContext';
import { LeadFormDialog } from '@/components/crm/LeadFormDialog';
import { LeadTimeline } from '@/components/crm/LeadTimeline';
import { IntegrationCheckPanel } from '@/components/crm/IntegrationCheckPanel';
import { ConvertLeadDialog } from '@/components/crm/ConvertLeadDialog';
import {
  completeFollowUp, createLeadTask, deleteLeadTask, loadLeadDetail, localIsoDate,
  logLeadContact, setLeadArchived, setLeadStage, setLeadTaskStatus, updateLead, upsertFollowUp,
} from '@/lib/ownerCrm/api';
import {
  ACTIVITY_CHANNEL_ORDER, LEAD_PRIORITY_ORDER, LEAD_STAGE_ORDER, activityChannelLabel,
  contactChannelLabel, integrationCheckStatusLabel, integrationCheckStatusTone,
  leadPriorityLabel, leadPriorityTone, leadStageLabel, leadStageTone,
  offerStatusLabel, offerStatusTone,
} from '@/lib/ownerCrm/catalog';
import { computeLeadNextActions, dayCountLabel, dayCountLabelDative, daysBetween } from '@/lib/ownerCrm/nextActions';
import { SERVICE_BY_KEY } from '@/lib/serviceOnboarding/catalog';
import { formatCentsCurrencyDe, formatDateDe } from '@/lib/ownerFinance/exports';
import { formatLocalDateTimeDe, toDateTimeLocalValue } from '@/lib/ownerCrm/format';
import type { ActivityChannel, LeadDetail, LeadStage } from '@/lib/ownerCrm/types';

// The lead workspace: one page that carries identity, pipeline, follow-ups,
// tasks, the pre-offer integration gate, linked offers and the full timeline.
//
// Nothing on this page contacts the prospect. Every action here writes to
// Cogniiq's own records; reaching out stays a separate, deliberate human act.

type TabKey = 'overview' | 'integration' | 'activity';

const SEVERITY_STYLE: Record<string, string> = {
  overdue: 'border-red-200 bg-red-50 text-red-800',
  due: 'border-amber-200 bg-amber-50 text-amber-800',
  attention: 'border-[var(--cq-border)] bg-[var(--cq-sunken)] text-[var(--cq-fg)]',
  info: 'border-[var(--cq-border-subtle)] bg-[var(--cq-surface)] text-[var(--cq-fg-muted)]',
};

export function LeadDetailPage() {
  const { leadId } = useParams<{ leadId: string }>();
  const { entity } = useOwnerEntity();
  const navigate = useNavigate();
  const toast = useToast();

  const [detail, setDetail] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>('overview');

  const [editOpen, setEditOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [lostOpen, setLostOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const today = useMemo(() => localIsoDate(), []);

  const load = useCallback(async () => {
    if (!leadId) return;
    setLoading(true);
    try {
      setDetail(await loadLeadDetail(leadId));
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => { void load(); }, [load]);

  const nextActions = useMemo(
    () => (detail ? computeLeadNextActions(detail, { today }) : []),
    [detail, today],
  );

  const run = useCallback(async (fn: () => Promise<{ error: string | null }>, success: string) => {
    setBusy(true);
    try {
      const { error: err } = await fn();
      if (err) { toast.error('Nicht gespeichert', err); return false; }
      toast.success(success);
      await load();
      return true;
    } finally {
      setBusy(false);
    }
  }, [load, toast]);

  if (loading && !detail) return <LoadingState label="Lead wird geladen …" />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!detail) {
    return (
      <EmptyState
        icon={Target}
        title="Lead nicht gefunden"
        description="Der Lead existiert nicht mehr oder wurde nie angelegt."
        action={<Button variant="secondary" onClick={() => navigate('/admin/finance/leads')}>Zur Lead-Liste</Button>}
      />
    );
  }

  const { lead } = detail;
  const openFollowUp = detail.follow_ups.find((f) => f.status === 'open') ?? null;
  const terminal = lead.stage === 'won' || lead.stage === 'lost';

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumb={(
          <Link to="/admin/finance/leads" className={cn('inline-flex items-center gap-1', text.hint, 'hover:underline')}>
            <ArrowLeft size={13} aria-hidden="true" /> Leads
          </Link>
        )}
        title={lead.display_name}
        description={[lead.contact_name && lead.company ? lead.contact_name : null, lead.contact_role, lead.city]
          .filter(Boolean).join(' · ') || undefined}
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              <Pencil size={15} aria-hidden="true" /> Bearbeiten
            </Button>
            <Button variant="secondary" onClick={() => setNoteOpen(true)}>
              <MessageSquarePlus size={15} aria-hidden="true" /> Notiz / Kontakt
            </Button>
            {!lead.converted_customer_id ? (
              <Button onClick={() => setConvertOpen(true)}>
                <ArrowRight size={15} aria-hidden="true" /> In Kunde umwandeln
              </Button>
            ) : (
              <Button onClick={() => navigate(`/admin/finance/customers/${lead.converted_customer_id}`)}>
                Zum Kunden <ArrowRight size={15} aria-hidden="true" />
              </Button>
            )}
          </div>
        )}
      />

      {/* --------------------------------------------------------- Status row */}
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge label={leadStageLabel[lead.stage]} tone={leadStageTone[lead.stage]} />
        <StatusBadge label={leadPriorityLabel[lead.priority]} tone={leadPriorityTone[lead.priority]} />
        {lead.service_interests.includes('ai_receptionist') ? (
          <StatusBadge
            label={`Schnittstelle: ${integrationCheckStatusLabel[detail.integration_check?.status ?? 'not_started']}`}
            tone={integrationCheckStatusTone[detail.integration_check?.status ?? 'not_started']}
          />
        ) : null}
        {lead.archived_at ? <StatusBadge label="Archiviert" tone="neutral" /> : null}
        {lead.converted_customer_id ? <StatusBadge label="In Kunde umgewandelt" tone="success" /> : null}
      </div>

      {lead.stage === 'lost' && lead.lost_reason ? (
        <InfoBanner tone="info" title="Als verloren markiert">
          {lead.lost_reason}
          <p className={cn('mt-1', text.hint)}>
            Die Historie bleibt vollständig erhalten. Ein Wechsel der Phase öffnet den Lead wieder.
          </p>
        </InfoBanner>
      ) : null}

      {/* ------------------------------------------------------ Next actions */}
      {nextActions.length > 0 ? (
        <Card>
          <SectionHeader title="Nächste Schritte" description="Abgeleitet aus vorhandenen Daten — keine Empfehlungen, keine Schätzungen." />
          <ul className="mt-3 space-y-2">
            {nextActions.map((action, i) => (
              <li
                key={`${action.kind}-${action.label}-${i}`}
                className={cn('rounded-[10px] border px-3 py-2', SEVERITY_STYLE[action.severity])}
              >
                <p className="text-[13px] font-medium leading-5">{action.label}</p>
                {action.detail ? <p className="mt-0.5 text-[12px] leading-4 opacity-80">{action.detail}</p> : null}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Tabs
        value={tab}
        onChange={(v) => setTab(v as TabKey)}
        tabs={[
          { value: 'overview', label: 'Überblick' },
          { value: 'integration', label: 'Schnittstelle & Kosten' },
          { value: 'activity', label: 'Verlauf', count: detail.activity.length },
        ]}
      />

      {tab === 'overview' ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* ------------------------------------------------------- Left */}
          <div className="space-y-4 lg:col-span-2">
            {/* Pipeline */}
            <Card>
              <SectionHeader
                title="Vertriebsphase"
                description="Ein Phasenwechsel wird nur protokolliert. Es wird nichts an den Interessenten versendet."
              />
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Select
                  id="lead-stage-select"
                  label="Phase"
                  value={lead.stage}
                  disabled={busy || Boolean(lead.converted_customer_id)}
                  onChange={(v) => {
                    if (v === 'lost') { setLostOpen(true); return; }
                    void run(() => setLeadStage(lead.id, v), `Phase: ${leadStageLabel[v as LeadStage]}`);
                  }}
                  options={LEAD_STAGE_ORDER.map((s) => ({ value: s, label: leadStageLabel[s] }))}
                  hint={lead.converted_customer_id
                    ? 'Umgewandelte Leads bleiben gewonnen.'
                    : undefined}
                />
                <Select
                  id="lead-priority-select"
                  label="Priorität"
                  value={lead.priority}
                  disabled={busy}
                  onChange={(v) => void run(() => updateLead(lead.id, { priority: v }), 'Priorität aktualisiert')}
                  options={LEAD_PRIORITY_ORDER.map((p) => ({ value: p, label: leadPriorityLabel[p] }))}
                />
              </div>
              {!terminal ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant="secondary" disabled={busy}
                    onClick={() => void run(() => setLeadStage(lead.id, 'won'), 'Als gewonnen markiert')}
                  >
                    <Trophy size={15} aria-hidden="true" /> Als gewonnen markieren
                  </Button>
                  <Button variant="ghost" disabled={busy} onClick={() => setLostOpen(true)}>
                    <XCircle size={15} aria-hidden="true" /> Als verloren markieren
                  </Button>
                </div>
              ) : null}
            </Card>

            {/* Follow-up */}
            <Card>
              <SectionHeader
                title="Follow-up"
                description="Interne Erinnerung. Es werden keine Nachrichten automatisch versendet."
                action={(
                  <Button variant="secondary" onClick={() => setFollowUpOpen(true)} disabled={busy}>
                    <CalendarClock size={15} aria-hidden="true" />
                    {openFollowUp ? 'Anpassen' : 'Follow-up setzen'}
                  </Button>
                )}
              />
              <div className="mt-3">
                {openFollowUp ? (
                  <div className={cn('rounded-[10px] px-3 py-2.5', border.hairline)}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className={text.bodyStrong}>{formatLocalDateTimeDe(openFollowUp.due_at)}</p>
                      {(() => {
                        const overdue = daysBetween(openFollowUp.due_at, today);
                        if (overdue > 0) return <StatusBadge label={`${dayCountLabel(overdue)} überfällig`} tone="danger" />;
                        if (overdue === 0) return <StatusBadge label="Heute" tone="warning" />;
                        return <StatusBadge label={`in ${dayCountLabelDative(overdue)}`} tone="neutral" />;
                      })()}
                    </div>
                    {openFollowUp.reason ? <p className={cn('mt-1', text.hint)}>{openFollowUp.reason}</p> : null}
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      <Button
                        variant="secondary" disabled={busy}
                        onClick={() => void run(() => completeFollowUp(openFollowUp.id, 'done'), 'Follow-up erledigt')}
                      >
                        <CheckCircle2 size={15} aria-hidden="true" /> Erledigt
                      </Button>
                      <Button
                        variant="ghost" disabled={busy}
                        onClick={() => void run(() => completeFollowUp(openFollowUp.id, 'cancelled'), 'Follow-up abgebrochen')}
                      >
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className={text.hint}>Kein Follow-up geplant.</p>
                )}

                {detail.follow_ups.filter((f) => f.status !== 'open').length > 0 ? (
                  <ul className="mt-3 space-y-1.5">
                    {detail.follow_ups.filter((f) => f.status !== 'open').slice(0, 5).map((f) => (
                      <li key={f.id} className={cn('flex flex-wrap items-center gap-2', text.hint)}>
                        <span>{formatDateDe(f.due_at)}</span>
                        <StatusBadge label={f.status === 'done' ? 'Erledigt' : 'Abgebrochen'} tone={f.status === 'done' ? 'success' : 'neutral'} />
                        {f.reason ? <span className="min-w-0 truncate">{f.reason}</span> : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </Card>

            {/* Tasks */}
            <Card>
              <SectionHeader
                title="Aufgaben"
                description="Vertriebsaufgaben zu diesem Lead. Onboarding-Aufgaben entstehen erst beim Kunden."
                action={<Button variant="secondary" onClick={() => setTaskOpen(true)} disabled={busy}><Plus size={15} aria-hidden="true" /> Aufgabe</Button>}
              />
              <div className="mt-3">
                {detail.tasks.length === 0 ? (
                  <p className={text.hint}>Keine Aufgaben.</p>
                ) : (
                  <ul className="divide-y divide-[var(--cq-border-subtle)]">
                    {detail.tasks.map((t) => {
                      const done = t.status === 'completed' || t.status === 'cancelled';
                      const overdue = !done && t.due_date ? daysBetween(t.due_date, today) : -1;
                      return (
                        <li key={t.id} className="flex items-start gap-3 py-2.5">
                          {/* The padding, not the box, is the touch target: a bare
                              16px checkbox is not comfortably tappable on a phone. */}
                          <span className="-m-1 flex shrink-0 items-center justify-center p-1">
                            <input
                              type="checkbox" className="h-4 w-4" checked={t.status === 'completed'}
                              disabled={busy}
                              aria-label={`${t.title} als erledigt markieren`}
                              onChange={(e) => void run(
                                () => setLeadTaskStatus(t.id, e.target.checked ? 'completed' : 'open'),
                                e.target.checked ? 'Aufgabe erledigt' : 'Aufgabe wieder geöffnet',
                              )}
                            />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className={cn('text-[13px] leading-5', done && 'text-[var(--cq-fg-subtle)] line-through')}>
                              {t.title}
                            </p>
                            <div className={cn('flex flex-wrap items-center gap-2', text.hint)}>
                              {t.due_date ? <span className={cn(overdue > 0 && 'font-medium text-red-600')}>Fällig {formatDateDe(t.due_date)}</span> : null}
                              {t.priority !== 'normal' ? <StatusBadge label={leadPriorityLabel[t.priority]} tone={leadPriorityTone[t.priority]} /> : null}
                            </div>
                            {t.description ? <p className={cn('mt-0.5', text.hint)}>{t.description}</p> : null}
                          </div>
                          <Button
                            variant="ghost" disabled={busy}
                            onClick={() => void run(() => deleteLeadTask(t.id), 'Aufgabe gelöscht')}
                            aria-label={`Aufgabe ${t.title} löschen`}
                          >
                            Löschen
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </Card>
          </div>

          {/* ------------------------------------------------------- Right */}
          <div className="space-y-4">
            <Card>
              <SectionHeader title="Kontakt" />
              <dl className="mt-3 space-y-2 text-[13px] leading-5">
                <DetailRow label="Praxis / Firma" value={lead.company} />
                <DetailRow label="Ansprechpartner" value={lead.contact_name} />
                <DetailRow label="Funktion" value={lead.contact_role} />
                <DetailRow
                  label="E-Mail"
                  value={lead.email}
                  render={(v) => <a className="hover:underline" href={`mailto:${v}`}>{v}</a>}
                />
                <DetailRow
                  label="Telefon"
                  value={lead.phone}
                  render={(v) => <a className="hover:underline" href={`tel:${v.replace(/\s/g, '')}`}>{v}</a>}
                />
                <DetailRow
                  label="Website"
                  value={lead.website}
                  render={(v) => <a className="break-all hover:underline" href={v} target="_blank" rel="noreferrer noopener">{v}</a>}
                />
                <DetailRow label="Adresse" value={[lead.street, [lead.postal_code, lead.city].filter(Boolean).join(' ')].filter(Boolean).join(', ') || null} />
                <DetailRow label="Bevorzugter Kanal" value={lead.preferred_channel ? contactChannelLabel[lead.preferred_channel] : null} />
                <DetailRow label="Letzter Kontakt" value={lead.last_contact_at ? formatDateDe(lead.last_contact_at) : null} />
              </dl>
            </Card>

            <Card>
              <SectionHeader title="Kommerziell" description="Intern. Wird dem Kunden nie angezeigt." />
              <dl className="mt-3 space-y-2 text-[13px] leading-5">
                <DetailRow label="Erwartetes Setup" value={lead.estimated_setup_cents !== null ? formatCentsCurrencyDe(lead.estimated_setup_cents) : null} />
                <DetailRow label="Erwartet monatlich" value={lead.estimated_monthly_cents !== null ? formatCentsCurrencyDe(lead.estimated_monthly_cents) : null} />
                <DetailRow label="Quelle" value={lead.source} />
                <DetailRow label="Notiz zur Quelle" value={lead.source_note} />
              </dl>
            </Card>

            <Card>
              <SectionHeader
                title="Angebote"
                action={(
                  <Button variant="secondary" onClick={() => navigate(`/admin/finance/offers/new?leadId=${lead.id}`)}>
                    <FileSignature size={15} aria-hidden="true" /> Angebot
                  </Button>
                )}
              />
              <div className="mt-3">
                {detail.offers.length === 0 ? (
                  <p className={text.hint}>Noch kein Angebot verknüpft.</p>
                ) : (
                  <ul className="divide-y divide-[var(--cq-border-subtle)]">
                    {detail.offers.map((o) => (
                      <li key={o.id} className="py-2">
                        <Link to={`/admin/finance/offers/${o.id}`} className="block hover:underline">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className={text.bodyStrong}>{o.offer_number ?? 'Entwurf'}</span>
                            <span className={text.numeric}>{formatCentsCurrencyDe(o.gross_total_cents)}</span>
                          </div>
                          <div className={cn('mt-0.5 flex items-center gap-2', text.hint)}>
                            <StatusBadge label={offerStatusLabel[o.status] ?? o.status} tone={offerStatusTone[o.status] ?? 'neutral'} />
                            <span>{formatDateDe(o.created_at)}</span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>

            <Card>
              <SectionHeader title="Kontext" />
              <dl className="mt-3 space-y-2 text-[13px] leading-5">
                <DetailRow
                  label="Interesse"
                  value={detail.service_interests.length > 0
                    ? detail.service_interests.map((k) => SERVICE_BY_KEY[k]?.name ?? k).join(', ')
                    : null}
                />
                <DetailRow label="Branche" value={lead.industry} />
                <DetailRow label="Typ" value={lead.company_type} />
                <DetailRow label="Größe" value={lead.company_size} />
                <DetailRow label="Bestehende Systeme" value={lead.existing_systems} />
                <DetailRow label="Probleme / Anlass" value={lead.pain_points} />
                <DetailRow label="Anforderungen" value={lead.requirements} />
                <DetailRow label="Notizen" value={lead.notes} />
              </dl>
              <div className="mt-4">
                <Button variant="ghost" onClick={() => setArchiveOpen(true)} disabled={busy}>
                  <Archive size={15} aria-hidden="true" />
                  {lead.archived_at ? 'Wiederherstellen' : 'Archivieren'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {tab === 'integration' ? (
        detail.service_interests.includes('ai_receptionist') ? (
          <IntegrationCheckPanel leadId={lead.id} check={detail.integration_check} onSaved={load} />
        ) : (
          <EmptyState
            icon={Target}
            title="Keine Schnittstellen-Prüfung erforderlich"
            description="Die Prüfung von PVS, Schnittstelle und Drittanbieter-Kosten betrifft den AI Receptionist. Markieren Sie diese Leistung als Interesse, um die Prüfung zu starten."
            action={<Button variant="secondary" onClick={() => setEditOpen(true)}>Interesse bearbeiten</Button>}
          />
        )
      ) : null}

      {tab === 'activity' ? (
        <Card>
          <SectionHeader
            title="Verlauf"
            description="Manuell protokollierte Kontakte und Systemereignisse."
            action={<Button variant="secondary" onClick={() => setNoteOpen(true)}><MessageSquarePlus size={15} aria-hidden="true" /> Eintrag</Button>}
          />
          <div className="mt-4">
            <LeadTimeline activity={detail.activity} />
          </div>
        </Card>
      ) : null}

      {/* ---------------------------------------------------------- Dialogs */}
      {entity ? (
        <LeadFormDialog
          open={editOpen} onClose={() => setEditOpen(false)} entityId={entity.id}
          lead={lead} serviceInterests={detail.service_interests}
          onSaved={() => void load()}
        />
      ) : null}

      <ConvertLeadDialog
        open={convertOpen} onClose={() => setConvertOpen(false)} detail={detail}
        onConverted={(result) => { void load(); navigate(`/admin/finance/customers/${result.customer_id}`); }}
      />

      <LogContactDialog
        open={noteOpen} onClose={() => setNoteOpen(false)} busy={busy}
        onSubmit={(channel, summary, occurredAt) =>
          run(() => logLeadContact(lead.id, channel, summary, occurredAt), 'Eintrag gespeichert')}
      />

      <FollowUpDialog
        open={followUpOpen} onClose={() => setFollowUpOpen(false)} busy={busy}
        initialDue={openFollowUp?.due_at ?? null} initialReason={openFollowUp?.reason ?? null}
        onSubmit={(dueAt, reason) =>
          run(() => upsertFollowUp(lead.id, openFollowUp?.id ?? null, dueAt, reason).then((r) => ({ error: r.error })), 'Follow-up gespeichert')}
      />

      <TaskDialog
        open={taskOpen} onClose={() => setTaskOpen(false)} busy={busy}
        onSubmit={(title, description, dueDate, priority) =>
          run(() => createLeadTask({ lead_id: lead.id, title, description, due_date: dueDate, priority })
            .then((r) => ({ error: r.error })), 'Aufgabe erstellt')}
      />

      <LostDialog
        open={lostOpen} onClose={() => setLostOpen(false)} busy={busy}
        onSubmit={(reason) => run(() => setLeadStage(lead.id, 'lost', reason), 'Als verloren markiert')}
      />

      <ConfirmDialog
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        title={lead.archived_at ? 'Lead wiederherstellen?' : 'Lead archivieren?'}
        message={lead.archived_at
          ? 'Der Lead erscheint wieder in den aktiven Listen.'
          : 'Der Lead wird aus den aktiven Listen ausgeblendet. Es wird nichts gelöscht und die Historie bleibt vollständig erhalten.'}
        confirmLabel={lead.archived_at ? 'Wiederherstellen' : 'Archivieren'}
        onConfirm={() => {
          void run(() => setLeadArchived(lead.id, !lead.archived_at),
            lead.archived_at ? 'Lead wiederhergestellt' : 'Lead archiviert');
          setArchiveOpen(false);
        }}
      />
    </div>
  );
}

/* --------------------------------------------------------------- Fragments */

/** One definition row. Renders nothing at all when the value is unknown. */
function DetailRow({ label, value, render }: {
  label: string;
  value: string | null | undefined;
  render?: (value: string) => React.ReactNode;
}) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[minmax(0,9rem)_1fr] gap-2">
      <dt className={text.hint}>{label}</dt>
      <dd className="min-w-0 whitespace-pre-line break-words">{render ? render(value) : value}</dd>
    </div>
  );
}

function LogContactDialog({ open, onClose, busy, onSubmit }: {
  open: boolean; onClose: () => void; busy: boolean;
  onSubmit: (channel: ActivityChannel, summary: string, occurredAt: string | null) => Promise<boolean>;
}) {
  const [channel, setChannel] = useState<ActivityChannel>('call');
  const [summary, setSummary] = useState('');
  const [when, setWhen] = useState('');

  useEffect(() => { if (open) { setChannel('call'); setSummary(''); setWhen(''); } }, [open]);

  return (
    <Modal
      open={open} onClose={onClose} title="Kontakt protokollieren"
      description="Hält fest, was bereits passiert ist. Es wird nichts versendet."
      footer={(
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Abbrechen</Button>
          <Button
            loading={busy} disabled={!summary.trim()}
            onClick={async () => {
              const ok = await onSubmit(channel, summary.trim(), when ? new Date(when).toISOString() : null);
              if (ok) onClose();
            }}
          >
            Speichern
          </Button>
        </>
      )}
    >
      <div className="space-y-3">
        <Select
          id="log-channel" label="Art" value={channel}
          onChange={(v) => setChannel(v as ActivityChannel)}
          options={ACTIVITY_CHANNEL_ORDER.map((c) => ({ value: c, label: activityChannelLabel[c] }))}
          hint="„Notiz“ zählt nicht als Kontakt und verändert den letzten Kontakt nicht."
        />
        <Field id="log-when" label="Zeitpunkt" type="datetime-local" value={when} onChange={setWhen} hint="Leer lassen für jetzt." />
        <Textarea id="log-summary" label="Inhalt" rows={4} value={summary} onChange={setSummary} />
      </div>
    </Modal>
  );
}

function FollowUpDialog({ open, onClose, busy, initialDue, initialReason, onSubmit }: {
  open: boolean; onClose: () => void; busy: boolean;
  initialDue: string | null; initialReason: string | null;
  onSubmit: (dueAt: string, reason: string | null) => Promise<boolean>;
}) {
  const [due, setDue] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open) return;
    setDue(toDateTimeLocalValue(initialDue));
    setReason(initialReason ?? '');
  }, [open, initialDue, initialReason]);

  return (
    <Modal
      open={open} onClose={onClose} title="Follow-up setzen"
      description="Erinnert nur intern. Es wird keine Nachricht versendet."
      footer={(
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Abbrechen</Button>
          <Button
            loading={busy} disabled={!due}
            onClick={async () => {
              const ok = await onSubmit(new Date(due).toISOString(), reason.trim() || null);
              if (ok) onClose();
            }}
          >
            Speichern
          </Button>
        </>
      )}
    >
      <div className="space-y-3">
        <Field id="fu-due" label="Fällig am" type="datetime-local" value={due} onChange={setDue} required />
        <Field id="fu-reason" label="Grund" value={reason} onChange={setReason} placeholder="Rückruf zur PVS-Frage" />
      </div>
    </Modal>
  );
}

function TaskDialog({ open, onClose, busy, onSubmit }: {
  open: boolean; onClose: () => void; busy: boolean;
  onSubmit: (title: string, description: string | null, dueDate: string | null, priority: string) => Promise<boolean>;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [due, setDue] = useState('');
  const [priority, setPriority] = useState('normal');

  useEffect(() => { if (open) { setTitle(''); setDescription(''); setDue(''); setPriority('normal'); } }, [open]);

  return (
    <Modal
      open={open} onClose={onClose} title="Aufgabe anlegen"
      footer={(
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Abbrechen</Button>
          <Button
            loading={busy} disabled={!title.trim()}
            onClick={async () => {
              const ok = await onSubmit(title.trim(), description.trim() || null, due || null, priority);
              if (ok) onClose();
            }}
          >
            Anlegen
          </Button>
        </>
      )}
    >
      <div className="space-y-3">
        <Field id="task-title" label="Titel" value={title} onChange={setTitle} required autoFocus placeholder="Angebot vorbereiten" />
        <Textarea id="task-desc" label="Beschreibung" rows={3} value={description} onChange={setDescription} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="task-due" label="Fällig am" type="date" value={due} onChange={setDue} />
          <Select
            id="task-priority" label="Priorität" value={priority} onChange={setPriority}
            options={LEAD_PRIORITY_ORDER.map((p) => ({ value: p, label: leadPriorityLabel[p] }))}
          />
        </div>
      </div>
    </Modal>
  );
}

function LostDialog({ open, onClose, busy, onSubmit }: {
  open: boolean; onClose: () => void; busy: boolean;
  onSubmit: (reason: string) => Promise<boolean>;
}) {
  const [reason, setReason] = useState('');
  useEffect(() => { if (open) setReason(''); }, [open]);

  return (
    <Modal
      open={open} onClose={onClose} title="Als verloren markieren"
      description="Der Grund wird benötigt. Der Lead bleibt mit seiner gesamten Historie erhalten und kann später wieder geöffnet werden."
      footer={(
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Abbrechen</Button>
          <Button
            loading={busy} disabled={!reason.trim()}
            onClick={async () => { const ok = await onSubmit(reason.trim()); if (ok) onClose(); }}
          >
            Als verloren markieren
          </Button>
        </>
      )}
    >
      <Textarea id="lost-reason" label="Grund" rows={3} value={reason} onChange={setReason} placeholder="Budget für 2026 gestrichen" />
    </Modal>
  );
}

export default LeadDetailPage;
