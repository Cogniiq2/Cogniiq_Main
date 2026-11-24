import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, Link2, Mail, MessageSquarePlus, RotateCcw, ShieldOff } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  Button, Card, ConfirmDialog, InfoBanner, Select, Skeleton, StatusBadge, Textarea, radius, text, useToast,
} from '@/components/dashboard';
import { OnboardingComposer } from '@/components/clientOnboarding/OnboardingComposer';
import { OnboardingReview } from '@/components/clientOnboarding/OnboardingReview';
import {
  closeOnboardingRequest, createOnboardingRequest, linkCustomerOrganization, loadOwnerOnboarding,
  revokeOnboardingInvitation,
} from '@/lib/clientOnboarding/api';
import { INTAKE_STATUS_LABEL, invitationState, messageStatusLabel } from '@/lib/clientOnboarding/intake';
import type { MessageKind, OnboardingInvitation, OwnerOnboardingDetail, OwnerRequest } from '@/lib/clientOnboarding/types';
import type { EngagementTask } from '@/lib/serviceOnboarding/types';

const dateFmt = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' });
const fmt = (iso: string | null | undefined) => (iso ? dateFmt.format(new Date(iso)) : '—');

const KIND_LABEL: Record<MessageKind, string> = { invitation: 'Einladung', reminder: 'Erinnerung', request: 'Rückfrage' };

const INTAKE_TONE = {
  not_started: 'neutral', in_progress: 'info', submitted: 'accent', changes_requested: 'warning', approved: 'success',
} as const;

/**
 * Owner communication centre for the customer's own onboarding: portal access, invitations,
 * message history, review of submitted answers and follow-up requests. Every rule is enforced by
 * the database; this panel only shows stored facts and offers the actions the server allows.
 */
export function ClientOnboardingPanel({ engagementId, tasks, onEngagementChanged }: {
  engagementId: string;
  tasks: EngagementTask[];
  onEngagementChanged: () => void;
}) {
  const toast = useToast();
  const [detail, setDetail] = useState<OwnerOnboardingDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [composer, setComposer] = useState<{ kind: MessageKind; recipient?: string | null; request?: OwnerRequest | null } | null>(null);
  const [linkChoice, setLinkChoice] = useState('');
  const [confirmLink, setConfirmLink] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<OnboardingInvitation | null>(null);

  const load = useCallback(async () => {
    const r = await loadOwnerOnboarding(engagementId);
    if (r.error) {
      setUnavailable(r.error.kind === 'unavailable');
      setLoadError(r.error.message);
      return;
    }
    setLoadError(null);
    setDetail(r.data);
  }, [engagementId]);

  useEffect(() => { void load(); }, [load]);

  const refreshAll = useCallback(() => { void load(); onEngagementChanged(); }, [load, onEngagementChanged]);

  if (unavailable) {
    return (
      <Card>
        <p className={text.cardTitle}>Kunden-Onboarding</p>
        <p className={cn('mt-1.5', text.body)}>Das Kunden-Onboarding ist in dieser Umgebung noch nicht aktiviert (Datenbank-Migration ausstehend).</p>
      </Card>
    );
  }
  if (loadError && !detail) {
    return (
      <Card>
        <p className={text.cardTitle}>Kunden-Onboarding</p>
        <p className={cn('mt-1.5', text.body)}>{loadError}</p>
        <Button className="mt-3" size="sm" variant="secondary" onClick={() => void load()}>Erneut laden</Button>
      </Card>
    );
  }
  if (!detail) return <Skeleton className="h-[220px] w-full" />;

  const intakeStatus = detail.intake?.status ?? 'not_started';
  const linked = Boolean(detail.organization);
  const activeInvitations = detail.invitations.filter((i) => i.status === 'active');

  return (
    <Card as="section" id="client-onboarding">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className={text.eyebrow}>Kunden-Onboarding</p>
          <p className={cn('mt-1', text.cardTitle)}>Angaben direkt vom Kunden einholen</p>
          <p className={cn('mt-1 max-w-xl', text.body)}>
            Der Kunde füllt im Portal einen geführten Fragebogen aus. Nichts wird automatisch übernommen: Sie prüfen jede Angabe
            und bestätigen sie, bevor sie in die Einrichtung einfließt.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <StatusBadge label={INTAKE_STATUS_LABEL[intakeStatus]} tone={INTAKE_TONE[intakeStatus]} />
        </div>
      </div>

      {/* 1. Portal organization link */}
      {!linked ? (
        <div className="mt-4 space-y-3">
          <InfoBanner tone="warning" title="Noch keine Portal-Organisation verknüpft">
            Einladungen sind erst möglich, wenn dieser Kunde mit seiner Organisation im Kundenportal verknüpft ist.
            Es wird keine Organisation automatisch angelegt – so entstehen keine Duplikate.
          </InfoBanner>
          {detail.link_candidates.length > 0 ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <Select id="ob-link-org" label="Bestehende Organisation verknüpfen" value={linkChoice} onChange={setLinkChoice}
                  options={[{ value: '', label: 'Organisation wählen …' }, ...detail.link_candidates.map((o) => ({ value: o.id, label: o.name }))]} />
              </div>
              <Button icon={Link2} variant="secondary" disabled={!linkChoice} onClick={() => setConfirmLink(true)}>Verknüpfen</Button>
            </div>
          ) : (
            <p className={text.body}>
              Es gibt keine freie Organisation. Legen Sie den Portalzugang über „Kunde anlegen“ im Kundenportal-Bereich an
              und verknüpfen Sie ihn anschließend hier.
            </p>
          )}
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className={text.body}>Portal-Organisation: <span className="font-medium text-[var(--cq-fg)]">{detail.organization?.name}</span></span>
          <span className={text.body}>Aktive Portalzugänge: <span className="font-medium text-[var(--cq-fg)]">{detail.members.filter((m) => m.status === 'active').length}</span></span>
        </div>
      )}

      {/* 2. Primary actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button icon={Mail} disabled={!linked} onClick={() => setComposer({ kind: 'invitation' })}>Onboarding-Einladung senden</Button>
        {activeInvitations.length > 0 && intakeStatus !== 'approved' ? (
          <Button icon={Bell} variant="secondary" onClick={() => setComposer({ kind: 'reminder', recipient: activeInvitations[0].recipient_email })}>
            Erinnerung senden
          </Button>
        ) : null}
      </div>

      {/* 3. Invitations */}
      {detail.invitations.length > 0 ? (
        <div className="mt-5">
          <p className={cn('mb-2', text.sectionTitle)}>Einladungen</p>
          <ul className="divide-y divide-[var(--cq-border)] border-y border-[var(--cq-border)]">
            {detail.invitations.map((inv) => {
              const st = invitationState(inv);
              const canRevoke = inv.status === 'active' && !inv.access_active;
              const canRenew = inv.status !== 'active' || st.label === 'Abgelaufen';
              return (
                <li key={inv.id} className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className={cn('truncate', text.bodyStrong)}>{inv.recipient_name ? `${inv.recipient_name} · ` : ''}{inv.recipient_email}</p>
                    <p className={text.hint}>Gesendet {fmt(inv.created_at)}{inv.status === 'active' && !inv.access_active ? ` · gültig bis ${fmt(inv.expires_at)}` : ''}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge label={st.label} tone={st.tone} />
                    {canRenew ? (
                      <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => setComposer({ kind: 'invitation', recipient: inv.recipient_email })}>Neu einladen</Button>
                    ) : null}
                    {canRevoke ? (
                      <Button size="sm" variant="ghost" icon={ShieldOff} onClick={() => setRevokeTarget(inv)}>Widerrufen</Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {/* 4. Review */}
      {detail.intake && Object.keys(detail.answers).length > 0 ? (
        <OnboardingReview detail={detail} onChanged={refreshAll} />
      ) : null}

      {/* 5. Follow-up requests */}
      <RequestsSection detail={detail} tasks={tasks} onChanged={refreshAll}
        onNotify={(req) => setComposer({ kind: 'request', recipient: activeInvitations[0]?.recipient_email ?? null, request: req })} />

      {/* 6. Communication history */}
      <div className="mt-5">
        <p className={cn('mb-2', text.sectionTitle)}>Kommunikationsverlauf</p>
        {detail.messages.length === 0 ? (
          <p className={text.body}>Noch keine Nachricht versendet.</p>
        ) : (
          <ul className="space-y-1.5">
            {detail.messages.map((m) => {
              const st = messageStatusLabel(m.status, m.created_at);
              return (
                <li key={m.id} className={cn('flex flex-col gap-1 border border-[var(--cq-border)] px-3 py-2 sm:flex-row sm:items-center sm:justify-between', radius.md)}>
                  <div className="min-w-0">
                    <p className={cn('truncate', text.bodyStrong)}>
                      {m.is_test ? 'Test · ' : ''}{KIND_LABEL[m.kind]} · {m.subject}
                    </p>
                    <p className={text.hint}>{fmt(m.created_at)} · an {m.recipient_email}</p>
                  </div>
                  <StatusBadge label={st.label} tone={st.tone} />
                </li>
              );
            })}
          </ul>
        )}
        <p className={cn('mt-2', text.hint)}>„Angenommen“ bedeutet: Der E-Mail-Anbieter hat die Nachricht übernommen. Zustellung und Öffnen werden nicht erfasst.</p>
      </div>

      {composer ? (
        <OnboardingComposer open onClose={() => setComposer(null)} detail={detail} kind={composer.kind}
          defaultRecipient={composer.recipient ?? null} requestId={composer.request?.id ?? null}
          requestQuestion={composer.request?.question ?? null} onSent={() => void load()} />
      ) : null}

      <ConfirmDialog open={confirmLink} onClose={() => setConfirmLink(false)} title="Organisation verknüpfen?"
        message={`Der Kunde wird dauerhaft mit „${detail.link_candidates.find((o) => o.id === linkChoice)?.name ?? ''}“ verknüpft. Mitglieder dieser Organisation sehen danach das Onboarding dieses Kunden. Eine bestehende Verknüpfung wird nie überschrieben.`}
        confirmLabel="Verknüpfen"
        onConfirm={async () => {
          const r = await linkCustomerOrganization(detail.customer.id, linkChoice);
          setConfirmLink(false);
          if (r.error) { toast.error('Verknüpfung nicht möglich', r.error.message); return; }
          toast.success('Organisation verknüpft');
          refreshAll();
        }} />

      <ConfirmDialog open={Boolean(revokeTarget)} onClose={() => setRevokeTarget(null)} tone="danger" title="Einladung widerrufen?"
        message={`Der Einladungslink für ${revokeTarget?.recipient_email ?? ''} wird ungültig. Bereits bestehende Portalzugänge bleiben unverändert.`}
        confirmLabel="Widerrufen"
        onConfirm={async () => {
          if (!revokeTarget) return;
          const r = await revokeOnboardingInvitation(revokeTarget.id);
          setRevokeTarget(null);
          if (r.error) { toast.error('Widerruf fehlgeschlagen', r.error.message); return; }
          toast.success('Einladung widerrufen');
          void load();
        }} />
    </Card>
  );
}

const REQUEST_STATUS: Record<OwnerRequest['status'], { label: string; tone: 'info' | 'accent' | 'success' | 'neutral' }> = {
  open: { label: 'Wartet auf Kunde', tone: 'info' },
  answered: { label: 'Beantwortet – bitte prüfen', tone: 'accent' },
  accepted: { label: 'Erledigt', tone: 'success' },
  cancelled: { label: 'Zurückgezogen', tone: 'neutral' },
};

function RequestsSection({ detail, tasks, onChanged, onNotify }: {
  detail: OwnerOnboardingDetail; tasks: EngagementTask[]; onChanged: () => void; onNotify: (r: OwnerRequest) => void;
}) {
  const toast = useToast();
  const [question, setQuestion] = useState('');
  const [taskId, setTaskId] = useState('');
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const taskOptions = useMemo(() => [
    { value: '', label: 'Keinem Schritt zuordnen' },
    ...tasks.filter((t) => t.status !== 'complete' && t.status !== 'not_applicable')
      .map((t) => ({ value: t.id, label: t.title, description: t.code })),
  ], [tasks]);
  const linked = Boolean(detail.organization);

  async function create() {
    setBusy(true);
    const r = await createOnboardingRequest(detail.engagement_id, question.trim(), null, taskId || null);
    setBusy(false);
    if (r.error) { toast.error('Rückfrage nicht angelegt', r.error.message); return; }
    toast.success('Rückfrage angelegt', 'Der Kunde sieht sie im Portal. Optional können Sie ihn per E-Mail informieren.');
    setQuestion(''); setTaskId(''); setOpen(false);
    onChanged();
  }

  async function close(id: string, outcome: 'accepted' | 'cancelled' | 'reopen') {
    const r = await closeOnboardingRequest(id, outcome);
    if (r.error) { toast.error('Aktion fehlgeschlagen', r.error.message); return; }
    onChanged();
  }

  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className={text.sectionTitle}>Rückfragen an den Kunden</p>
        {linked && !open ? <Button size="sm" variant="ghost" icon={MessageSquarePlus} onClick={() => setOpen(true)}>Neue Rückfrage</Button> : null}
      </div>
      {open ? (
        <div className={cn('mb-3 space-y-3 border border-[var(--cq-border)] p-3', radius.md)}>
          <Textarea id="ob-new-request" label="Ihre Frage an den Kunden" value={question} onChange={setQuestion} rows={3}
            hint="Bitte keine Patientendaten, Passwörter oder Zugangsdaten anfordern." />
          <Select id="ob-request-task" label="Zugehöriger Schritt (optional)" value={taskId} onChange={setTaskId} options={taskOptions}
            hint="Der Schritt wird auf „Wartet auf Kunde“ gesetzt." />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Abbrechen</Button>
            <Button size="sm" loading={busy} disabled={question.trim().length < 5} onClick={() => void create()}>Rückfrage anlegen</Button>
          </div>
        </div>
      ) : null}
      {detail.requests.length === 0 ? (
        <p className={text.body}>Keine Rückfragen.</p>
      ) : (
        <ul className="space-y-2">
          {detail.requests.map((r) => (
            <li key={r.id} className={cn('border border-[var(--cq-border)] p-3', radius.md)}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <p className={cn('min-w-0 whitespace-pre-wrap', text.bodyStrong)}>{r.question}</p>
                <StatusBadge label={REQUEST_STATUS[r.status].label} tone={REQUEST_STATUS[r.status].tone} />
              </div>
              {r.response ? (
                <div className={cn('mt-2 bg-[var(--cq-sunken)] px-3 py-2', radius.sm)}>
                  <p className={text.hint}>Antwort vom {fmt(r.responded_at)}</p>
                  <p className={cn('mt-0.5 whitespace-pre-wrap', text.body)}>{r.response}</p>
                </div>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {r.status === 'open' ? <Button size="sm" variant="ghost" icon={Mail} onClick={() => onNotify(r)}>Per E-Mail ankündigen</Button> : null}
                {r.status === 'answered' ? <Button size="sm" variant="secondary" onClick={() => void close(r.id, 'accepted')}>Antwort übernehmen</Button> : null}
                {r.status === 'answered' ? <Button size="sm" variant="ghost" onClick={() => void close(r.id, 'reopen')}>Erneut nachfragen</Button> : null}
                {r.status === 'open' || r.status === 'answered' ? <Button size="sm" variant="ghost" onClick={() => void close(r.id, 'cancelled')}>Zurückziehen</Button> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
