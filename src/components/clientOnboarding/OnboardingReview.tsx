import { useMemo, useState } from 'react';
import { Check, MessageSquareWarning } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button, ConfirmDialog, StatusBadge, Textarea, radius, text, useToast } from '@/components/dashboard';
import { reopenOnboarding, reviewOnboarding } from '@/lib/clientOnboarding/api';
import { STAGES, formatAnswer } from '@/lib/clientOnboarding/intake';
import type { OwnerOnboardingDetail, ReviewDecision } from '@/lib/clientOnboarding/types';

type Choice = { action: 'approve' | 'request_changes'; comment: string };

const ANSWER_TONE = { draft: 'neutral', submitted: 'accent', approved: 'success', changes_requested: 'warning' } as const;
const ANSWER_LABEL = { draft: 'Entwurf', submitted: 'Zu prüfen', approved: 'Bestätigt', changes_requested: 'Änderung erbeten' } as const;

/**
 * Owner review of the customer's submission. Nothing becomes canonical until the owner approves
 * it here: approval of a mapped answer writes the engagement field through the same RPC as a
 * manual edit (validation, activity log, go-live gate). Unmapped answers stay the approved record.
 */
export function OnboardingReview({ detail, onChanged }: { detail: OwnerOnboardingDetail; onChanged: () => void }) {
  const toast = useToast();
  const [choices, setChoices] = useState<Record<string, Choice>>({});
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmReopen, setConfirmReopen] = useState(false);
  const status = detail.intake?.status ?? 'not_started';
  const reviewable = status === 'submitted' || status === 'changes_requested' || status === 'approved';

  const grouped = useMemo(() => STAGES.map((s) => ({
    ...s,
    rows: detail.questions.filter((q) => q.stage === s.key && detail.answers[q.code]),
  })).filter((g) => g.rows.length > 0), [detail]);

  const pendingCodes = detail.questions.filter((q) => detail.answers[q.code]?.status === 'submitted').map((q) => q.code);
  // Approvals carry the exact value the owner is looking at; the server refuses if it changed since.
  const decisions: ReviewDecision[] = Object.entries(choices).map(([code, c]) => ({
    code, action: c.action, comment: c.comment.trim() || undefined,
    ...(c.action === 'approve' ? { expected_value: detail.answers[code]?.value ?? null } : {}),
  }));
  const missingComment = decisions.some((d) => d.action === 'request_changes' && !d.comment);

  function setChoice(code: string, action: Choice['action'] | null) {
    setChoices((prev) => {
      const next = { ...prev };
      if (action === null) delete next[code];
      else next[code] = { action, comment: prev[code]?.comment ?? '' };
      return next;
    });
  }

  async function save() {
    setBusy(true);
    const r = await reviewOnboarding(detail.engagement_id, decisions, note.trim() || null);
    setBusy(false);
    if (r.error) {
      toast.error('Prüfung nicht gespeichert', r.error.message);
      // A changed or no-longer-submitted answer means the screen is stale: reload it.
      if (r.error.kind === 'conflict' || r.error.kind === 'validation') { setChoices({}); onChanged(); }
      return;
    }
    toast.success('Prüfung gespeichert',
      `${r.data.approved} bestätigt · ${r.data.changes_requested} mit Änderungswunsch · ${r.data.applied_to_fields} in Einrichtungsfelder übernommen`);
    setChoices({}); setNote('');
    onChanged();
  }

  if (!reviewable) {
    return (
      <div className="mt-5">
        <p className={text.sectionTitle}>Kundenangaben</p>
        <p className={cn('mt-1', text.body)}>
          Der Kunde arbeitet noch an seinen Angaben ({Object.keys(detail.answers).length} gespeichert). Sie können prüfen,
          sobald er sie übermittelt hat.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-5">
      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={text.sectionTitle}>Kundenangaben prüfen</p>
          <p className={text.hint}>Übermittelt {detail.intake?.submitted_at ? new Date(detail.intake.submitted_at).toLocaleString('de-DE') : '—'} · {pendingCodes.length} offen</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {pendingCodes.length > 0 ? (
            <Button size="sm" variant="secondary" icon={Check}
              onClick={() => setChoices(Object.fromEntries(pendingCodes.map((c) => [c, { action: 'approve', comment: '' }])))}>
              Alle offenen auswählen
            </Button>
          ) : null}
          {status === 'submitted' || status === 'approved' ? (
            <Button size="sm" variant="ghost" onClick={() => setConfirmReopen(true)}>Zur Bearbeitung öffnen</Button>
          ) : null}
        </div>
      </div>

      <div className="space-y-4">
        {grouped.map((g) => (
          <div key={g.key}>
            <p className={cn('mb-1.5', text.eyebrow)}>{g.title}</p>
            <ul className="space-y-2">
              {g.rows.map((q) => {
                const a = detail.answers[q.code];
                const choice = choices[q.code];
                // Mirrors the server gate: only submitted (or already approved) values are decidable.
                const decidable = a.status === 'submitted' || a.status === 'approved';
                return (
                  <li key={q.code} className={cn('border p-3', radius.md,
                    choice?.action === 'approve' ? 'border-emerald-300' : choice?.action === 'request_changes' ? 'border-amber-300' : 'border-[var(--cq-border)]')}>
                    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className={text.label}>{q.label}{q.required ? ' *' : ''}</p>
                        <p className={cn('mt-0.5 whitespace-pre-wrap break-words', text.bodyStrong)}>{formatAnswer(q, a.value)}</p>
                        {q.target_field_code ? (
                          <p className={cn('mt-1', text.hint)}>
                            Wird übernommen in: {q.target_field_label ?? q.target_field_code}{q.target_is_blocker ? ' (Go-live-relevant)' : ''}
                            {q.current_field_value ? ` · aktuell: „${q.current_field_value.slice(0, 80)}“` : ' · aktuell leer'}
                          </p>
                        ) : (
                          <p className={cn('mt-1', text.hint)}>Bleibt als bestätigte Kundenangabe erhalten (kein Einrichtungsfeld).</p>
                        )}
                        {a.owner_comment ? <p className={cn('mt-1 text-amber-700', text.hint)}>Ihr Kommentar: {a.owner_comment}</p> : null}
                      </div>
                      <StatusBadge className="shrink-0 self-start whitespace-nowrap" label={ANSWER_LABEL[a.status]} tone={ANSWER_TONE[a.status]} />
                    </div>
                    {decidable ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Button size="sm" variant={choice?.action === 'approve' ? 'success' : 'ghost'} icon={Check}
                          onClick={() => setChoice(q.code, choice?.action === 'approve' ? null : 'approve')}>
                          Bestätigen
                        </Button>
                        <Button size="sm" variant={choice?.action === 'request_changes' ? 'accent' : 'ghost'} icon={MessageSquareWarning}
                          onClick={() => setChoice(q.code, choice?.action === 'request_changes' ? null : 'request_changes')}>
                          Änderung erbitten
                        </Button>
                      </div>
                    ) : null}
                    {choice?.action === 'request_changes' ? (
                      <div className="mt-2">
                        <Textarea id={`ob-comment-${q.code}`} label="Was soll der Kunde ergänzen oder ändern?" rows={2}
                          value={choice.comment}
                          onChange={(v) => setChoices((p) => ({ ...p, [q.code]: { action: 'request_changes', comment: v } }))} />
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {decisions.length > 0 ? (
        <div className={cn('sticky bottom-2 mt-4 space-y-2 border border-[var(--cq-border)] bg-[var(--cq-surface)] p-3 shadow-sm', radius.md)}>
          <Textarea id="ob-review-note" label="Nachricht an den Kunden (optional)" value={note} onChange={setNote} rows={2} />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className={text.hint}>
              {decisions.filter((d) => d.action === 'approve').length} bestätigen · {decisions.filter((d) => d.action === 'request_changes').length} Änderung erbitten
              {missingComment ? ' · Bitte bei jedem Änderungswunsch einen Kommentar angeben.' : ''}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setChoices({})}>Verwerfen</Button>
              <Button size="sm" loading={busy} disabled={missingComment} onClick={() => void save()}>Prüfung speichern</Button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog open={confirmReopen} onClose={() => setConfirmReopen(false)} title="Angaben zur Bearbeitung öffnen?"
        message="Der Kunde kann seine noch nicht bestätigten Angaben wieder ändern und erneut übermitteln. Bereits bestätigte Angaben bleiben gesperrt."
        confirmLabel="Öffnen"
        onConfirm={async () => {
          const r = await reopenOnboarding(detail.engagement_id, note.trim() || null);
          setConfirmReopen(false);
          if (r.error) { toast.error('Nicht möglich', r.error.message); return; }
          onChanged();
        }} />
    </div>
  );
}
