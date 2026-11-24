import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, CloudOff, Loader2, Send, ShieldCheck } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  AppButton, AppCard, AppErrorState, AppProgress, AppSkeleton, AppStatusBadge, AppTextarea,
} from '@/components/app/CustomerAppPrimitives';
import { radius, text } from '@/components/dashboard/tokens';
import { QuestionInput } from '@/components/app/setup/QuestionInput';
import { MilestoneTimeline } from '@/components/app/setup/MilestoneTimeline';
import { getMyOnboarding, respondToRequest, saveMyOnboarding, submitMyOnboarding } from '@/lib/clientOnboarding/api';
import {
  INTAKE_STATUS_LABEL, STAGES, formatAnswer, isEmptyValue, isLocked, missingRequired, overallPercent,
  stageProgress, validateAnswer,
} from '@/lib/clientOnboarding/intake';
import type { AnswerValue, CustomerIntake, IntakeStage, Question } from '@/lib/clientOnboarding/types';

const AUTOSAVE_MS = 1200;
const REVIEW_INDEX = STAGES.length;

type SaveState = { kind: 'idle' } | { kind: 'saving' } | { kind: 'saved'; at: Date } | { kind: 'error'; message: string } | { kind: 'conflict'; message: string };

const STATUS_TONE = {
  not_started: 'neutral', in_progress: 'working', submitted: 'ready', changes_requested: 'attention', approved: 'success',
} as const;

/**
 * The customer's guided setup. Answers are saved as drafts on the server as the customer types
 * (debounced, with optimistic concurrency), so leaving and coming back on any device resumes
 * exactly where they stopped. Nothing here changes the project itself: Cogniiq reviews every
 * submitted answer before it is used.
 */
export function IntakeWizard({ engagementId }: { engagementId: string }) {
  const [data, setData] = useState<CustomerIntake | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, AnswerValue>>({});
  const [prefilled, setPrefilled] = useState<Set<string>>(new Set());
  const [stageIndex, setStageIndex] = useState(0);
  const [save, setSave] = useState<SaveState>({ kind: 'idle' });
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const dirty = useRef<Set<string>>(new Set());
  /** Per-answer edit counter: a save only clears an answer if it was not edited while saving. */
  const editSeq = useRef<Map<string, number>>(new Map());
  /** Prefill suggestions are stored only after the customer has actually edited something. */
  const userEdited = useRef(false);
  const version = useRef(0);
  const inFlight = useRef<Promise<boolean> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const topRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    const r = await getMyOnboarding(engagementId);
    if (r.error) { setLoadError(r.error.message); return; }
    const d = r.data;
    setLoadError(null);
    setData(d);
    version.current = d.intake.version;
    const initial: Record<string, AnswerValue> = {};
    const fromPrefill = new Set<string>();
    for (const q of d.questions) {
      const stored = d.answers[q.code];
      if (stored && !isEmptyValue(stored.value)) initial[q.code] = stored.value;
      else if (d.can_edit && !isEmptyValue(d.prefill[q.code]) && validateAnswer(q, d.prefill[q.code]) === null) {
        initial[q.code] = d.prefill[q.code];
        fromPrefill.add(q.code);
      }
    }
    dirty.current = new Set(fromPrefill);
    setPrefilled(fromPrefill);
    setValues(initial);
    const resumeAt = STAGES.findIndex((s) => s.key === d.intake.current_stage);
    setStageIndex(d.intake.current_stage === 'review' ? REVIEW_INDEX : Math.max(0, resumeAt));
  }, [engagementId]);

  useEffect(() => { void load(); }, [load]);

  const questions = useMemo(() => data?.questions ?? [], [data]);
  const status = data?.intake.status ?? 'not_started';
  const editable = Boolean(data?.can_edit) && status !== 'submitted' && status !== 'approved';
  const byStage = useMemo(() => {
    const m = new Map<IntakeStage, Question[]>();
    for (const q of questions) m.set(q.stage, [...(m.get(q.stage) ?? []), q]);
    return m;
  }, [questions]);
  const progress = useMemo(() => stageProgress(questions, values), [questions, values]);
  const percent = overallPercent(progress);
  const missing = useMemo(() => missingRequired(questions, values), [questions, values]);

  /** Saves every dirty answer that passes the local check. Returns true when nothing is left unsaved. */
  const flush = useCallback(async (stageKey?: string): Promise<boolean> => {
    if (!data || !editable) return true;
    if (inFlight.current) await inFlight.current;
    const codes = [...dirty.current].filter((code) => {
      const q = questions.find((x) => x.code === code);
      return q && validateAnswer({ ...q, required: false }, values[code]) === null;
    });
    if (codes.length === 0 && !stageKey) return dirty.current.size === 0;
    const payload: Record<string, AnswerValue> = {};
    const seqAtSave = new Map<string, number>();
    for (const c of codes) {
      payload[c] = isEmptyValue(values[c]) ? null : values[c];
      seqAtSave.set(c, editSeq.current.get(c) ?? 0);
    }
    setSave({ kind: 'saving' });
    const run = (async () => {
      const r = await saveMyOnboarding(engagementId, payload, version.current, stageKey ?? null);
      if (r.error) {
        setSave(r.error.kind === 'conflict' ? { kind: 'conflict', message: r.error.message } : { kind: 'error', message: r.error.message });
        return false;
      }
      version.current = r.data.version;
      codes.forEach((c) => { if ((editSeq.current.get(c) ?? 0) === seqAtSave.get(c)) dirty.current.delete(c); });
      setPrefilled((prev) => { const n = new Set(prev); codes.forEach((c) => n.delete(c)); return n; });
      setSave({ kind: 'saved', at: new Date() });
      return true;
    })();
    inFlight.current = run;
    const ok = await run;
    inFlight.current = null;
    return ok;
  }, [data, editable, engagementId, questions, values]);

  // Debounced autosave after the customer edits something.
  const setValue = (code: string, v: AnswerValue) => {
    userEdited.current = true;
    dirty.current.add(code);
    editSeq.current.set(code, (editSeq.current.get(code) ?? 0) + 1);
    setValues((prev) => ({ ...prev, [code]: v }));
  };
  useEffect(() => {
    if (!editable || !userEdited.current || dirty.current.size === 0 || save.kind === 'conflict') return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { void flush(); }, AUTOSAVE_MS);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [values, editable, flush, save.kind]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { if (dirty.current.size > 0 && editable) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [editable]);

  async function goTo(index: number) {
    const target = Math.max(0, Math.min(REVIEW_INDEX, index));
    const key = target === REVIEW_INDEX ? 'review' : STAGES[target].key;
    if (editable) await flush(key);
    setShowErrors(false);
    setStageIndex(target);
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function next() {
    if (stageIndex < REVIEW_INDEX) {
      const stage = STAGES[stageIndex].key;
      const invalid = (byStage.get(stage) ?? []).some((q) => !isEmptyValue(values[q.code]) && validateAnswer(q, values[q.code]));
      if (invalid) { setShowErrors(true); return; }
    }
    await goTo(stageIndex + 1);
  }

  async function submit() {
    setSubmitError(null);
    if (missing.length > 0) { setShowErrors(true); return; }
    setSubmitting(true);
    const saved = await flush('review');
    if (!saved || dirty.current.size > 0) {
      setSubmitting(false);
      setSubmitError('Einige Angaben konnten nicht gespeichert werden. Bitte prüfen Sie die markierten Felder.');
      return;
    }
    const r = await submitMyOnboarding(engagementId, version.current);
    setSubmitting(false);
    if (r.error) { setSubmitError(r.error.message); return; }
    await load();
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (loadError) return <AppErrorState message={loadError} onRetry={() => void load()} />;
  if (!data) return <AppSkeleton label="Ihre Einrichtung wird geladen" />;

  const openRequests = data.requests.filter((r) => r.status === 'open' || r.status === 'answered');

  return (
    <div ref={topRef} className="scroll-mt-24 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0 space-y-5">
        {/* Status header */}
        <AppCard>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className={text.eyebrow}>Einrichtung Ihres KI-Telefonassistenten</p>
              <p className={cn('mt-1', text.cardTitle)}>{data.organization_name ?? 'Ihr Unternehmen'}</p>
            </div>
            <div className="shrink-0"><AppStatusBadge label={INTAKE_STATUS_LABEL[status]} tone={STATUS_TONE[status]} /></div>
          </div>
          {editable ? <div className="mt-4"><AppProgress value={percent} label="Pflichtangaben" /></div> : null}
          {status === 'changes_requested' ? (
            <p className={cn('mt-3 border-l-2 border-amber-400 bg-amber-50 px-3 py-2 text-[13px] leading-5 text-amber-900', radius.sm)}>
              Wir haben uns Ihre Angaben angesehen und bitten bei einigen Punkten um Ergänzung. Die betreffenden Felder sind markiert.
              {data.intake.review_note ? <><br /><span className="font-medium">Nachricht von Cogniiq:</span> {data.intake.review_note}</> : null}
            </p>
          ) : null}
          {!data.can_edit ? (
            <p className={cn('mt-3', text.body)}>Sie haben Lesezugriff. Angaben können Mitglieder mit Bearbeitungsrecht Ihrer Organisation machen.</p>
          ) : null}
        </AppCard>

        {openRequests.length > 0 ? <RequestsCard requests={openRequests} canEdit={data.can_edit} onAnswered={() => void load()} /> : null}

        {status === 'submitted' || status === 'approved' ? (
          <CompletedState data={data} />
        ) : (
          <>
            {/* Stepper */}
            <nav aria-label="Schritte der Einrichtung" className="-mx-1 overflow-x-auto px-1">
              <ol className="flex min-w-max gap-1.5 sm:min-w-0">
                {[...STAGES.map((s) => s.title), 'Prüfen & senden'].map((title, i) => {
                  const p = progress.find((x) => x.stage === STAGES[i]?.key);
                  const active = i === stageIndex;
                  const done = i < REVIEW_INDEX ? p?.complete : false;
                  return (
                    <li key={title} className="sm:flex-1">
                      <button type="button" onClick={() => void goTo(i)} aria-current={active ? 'step' : undefined}
                        className={cn('flex h-full w-full min-h-11 flex-col items-start gap-0.5 border px-3 py-2 text-left transition-colors', radius.md,
                          active ? 'border-[var(--cq-fg)] bg-[var(--cq-surface)]' : 'border-[var(--cq-border)] bg-[var(--cq-sunken)] hover:border-[var(--cq-border-strong)]')}>
                        <span className={cn('flex items-center gap-1 text-[11px] leading-4', done ? 'text-emerald-700' : 'text-[var(--cq-fg-subtle)]')}>
                          {done ? <CheckCircle2 size={11} aria-hidden="true" /> : null}Schritt {i + 1}
                        </span>
                        <span className={cn('text-[12.5px] leading-4', active ? 'font-semibold text-[var(--cq-fg)]' : 'text-[var(--cq-fg-muted)]')}>{title}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </nav>

            {stageIndex < REVIEW_INDEX ? (
              <AppCard>
                <h2 className={text.cardTitle}>{STAGES[stageIndex].title}</h2>
                <p className={cn('mt-1', text.body)}>{STAGES[stageIndex].description}</p>
                <div className="mt-5 space-y-6">
                  {(byStage.get(STAGES[stageIndex].key) ?? []).map((q) => {
                    const ans = data.answers[q.code];
                    const err = validateAnswer(q, values[q.code]);
                    return (
                      <QuestionInput key={q.code} question={q} value={values[q.code]} onChange={(v) => setValue(q.code, v)}
                        locked={!editable || isLocked(status, ans?.status)}
                        error={err && (showErrors || !isEmptyValue(values[q.code])) ? err : null}
                        ownerComment={ans?.status === 'changes_requested' ? ans.owner_comment : null}
                        prefilled={prefilled.has(q.code)} />
                    );
                  })}
                </div>
              </AppCard>
            ) : (
              <ReviewStep questions={questions} values={values} missing={missing} onEdit={(stage) => void goTo(STAGES.findIndex((s) => s.key === stage))} />
            )}

            {/* Action bar: sticky on phones so the next step is always within reach. */}
            <div className={cn('sticky bottom-0 z-10 -mx-4 border-t border-[var(--cq-border)] bg-[var(--cq-canvas)]/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none')}>
              {submitError ? (
                <p role="alert" className="mb-2 flex items-start gap-1.5 text-[12.5px] leading-5 text-red-700">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />{submitError}
                </p>
              ) : null}
              {stageIndex === REVIEW_INDEX && editable ? (
                <label className="mb-3 flex items-start gap-2 text-[12.5px] leading-5 text-[var(--cq-fg-muted)]">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[var(--cq-fg)]" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
                  Meine Angaben enthalten keine Patientendaten, Passwörter oder Zugangsdaten.
                </label>
              ) : null}
              <div className="flex items-center justify-between gap-3">
                <SaveIndicator state={save} onReload={() => void load()} />
                <div className="flex gap-2">
                  {stageIndex > 0 ? <AppButton variant="secondary" icon={ArrowLeft} onClick={() => void goTo(stageIndex - 1)}>Zurück</AppButton> : null}
                  {stageIndex < REVIEW_INDEX ? (
                    <AppButton icon={ArrowRight} onClick={() => void next()}>Weiter</AppButton>
                  ) : editable ? (
                    <AppButton icon={Send} disabled={submitting || !confirmed || missing.length > 0}
                      disabledReason={missing.length > 0 ? `Es fehlen noch ${missing.length} Pflichtangaben.` : undefined}
                      onClick={() => void submit()}>
                      {submitting ? 'Wird übermittelt …' : 'Angaben übermitteln'}
                    </AppButton>
                  ) : null}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <AppCard>
          <p className={cn('mb-3', text.eyebrow)}>Ihr Projektstand</p>
          <MilestoneTimeline milestones={data.milestones} />
        </AppCard>
        <AppCard className="hidden lg:block">
          <p className={cn('flex items-center gap-1.5', text.bodyStrong)}><ShieldCheck size={14} aria-hidden="true" /> Gut zu wissen</p>
          <ul className={cn('mt-2 list-disc space-y-1.5 pl-4', text.body)}>
            <li>Ihre Angaben werden automatisch gespeichert. Sie können jederzeit unterbrechen.</li>
            <li>Bitte geben Sie keine Patientendaten, Passwörter oder Zugangsdaten ein.</li>
            <li>Wir prüfen alle Angaben persönlich, bevor wir sie verwenden.</li>
          </ul>
        </AppCard>
      </aside>
    </div>
  );
}

function SaveIndicator({ state, onReload }: { state: SaveState; onReload: () => void }) {
  const base = 'flex min-w-0 items-center gap-1.5 text-[12px] leading-4';
  if (state.kind === 'saving') return <span className={cn(base, 'text-[var(--cq-fg-subtle)]')} aria-live="polite"><Loader2 size={12} className="animate-spin" aria-hidden="true" />Wird gespeichert …</span>;
  if (state.kind === 'saved') return <span className={cn(base, 'text-[var(--cq-fg-subtle)]')} aria-live="polite"><CheckCircle2 size={12} aria-hidden="true" />Gespeichert {state.at.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>;
  if (state.kind === 'conflict') {
    return (
      <span className={cn(base, 'text-amber-800')} role="alert">
        <CloudOff size={12} aria-hidden="true" />{state.message}
        <button type="button" onClick={onReload} className="font-medium underline">Neu laden</button>
      </span>
    );
  }
  if (state.kind === 'error') return <span className={cn(base, 'text-red-700')} role="alert"><CloudOff size={12} aria-hidden="true" /><span className="truncate">{state.message}</span></span>;
  return <span className={cn(base, 'text-[var(--cq-fg-subtle)]')}>Automatische Speicherung aktiv</span>;
}

function ReviewStep({ questions, values, missing, onEdit }: {
  questions: Question[]; values: Record<string, AnswerValue>; missing: Question[]; onEdit: (stage: IntakeStage) => void;
}) {
  return (
    <AppCard>
      <h2 className={text.cardTitle}>Prüfen & senden</h2>
      <p className={cn('mt-1', text.body)}>Bitte sehen Sie Ihre Angaben noch einmal durch. Nach dem Übermitteln prüfen wir sie und melden uns bei Rückfragen.</p>
      {missing.length > 0 ? (
        <div className={cn('mt-4 border border-amber-200 bg-amber-50 p-3', radius.md)}>
          <p className="text-[13px] font-medium text-amber-900">Es fehlen noch {missing.length} Pflichtangaben</p>
          <ul className="mt-1.5 space-y-1">
            {missing.map((q) => (
              <li key={q.code}>
                <button type="button" onClick={() => onEdit(q.stage)} className="text-left text-[12.5px] leading-5 text-amber-900 underline underline-offset-2">{q.label}</button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="mt-5 space-y-5">
        {STAGES.map((s) => {
          const qs = questions.filter((q) => q.stage === s.key);
          if (qs.length === 0) return null;
          return (
            <section key={s.key}>
              <div className="mb-2 flex items-center justify-between">
                <h3 className={text.sectionTitle}>{s.title}</h3>
                <button type="button" onClick={() => onEdit(s.key)} className="text-[12px] font-medium text-[var(--cq-fg-muted)] hover:text-[var(--cq-fg)]">Bearbeiten</button>
              </div>
              <dl className="divide-y divide-[var(--cq-border)] border-y border-[var(--cq-border)]">
                {qs.map((q) => (
                  <div key={q.code} className="grid gap-0.5 py-2 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)] sm:gap-4">
                    <dt className={text.label}>{q.label}</dt>
                    <dd className={cn('whitespace-pre-wrap break-words text-[13px] leading-5', isEmptyValue(values[q.code]) ? 'text-[var(--cq-fg-subtle)]' : 'text-[var(--cq-fg)]')}>
                      {formatAnswer(q, values[q.code])}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          );
        })}
      </div>
    </AppCard>
  );
}

function CompletedState({ data }: { data: CustomerIntake }) {
  const approved = data.intake.status === 'approved';
  return (
    <AppCard>
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <CheckCircle2 size={18} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className={text.cardTitle}>{approved ? 'Ihre Angaben sind geprüft' : 'Vielen Dank. Ihre Angaben sind bei uns eingegangen.'}</h2>
          <p className={cn('mt-1', text.body)}>
            {approved
              ? 'Wir haben Ihre Angaben geprüft und für die Einrichtung übernommen. Den weiteren Fortschritt sehen Sie im Projektstand.'
              : `Übermittelt am ${data.intake.submitted_at ? new Date(data.intake.submitted_at).toLocaleString('de-DE', { dateStyle: 'long', timeStyle: 'short' }) : '—'}. Wir prüfen Ihre Angaben und melden uns, falls etwas fehlt.`}
          </p>
          <ul className={cn('mt-3 space-y-1', text.body)}>
            <li>1. Wir prüfen Ihre Angaben persönlich.</li>
            <li>2. Bei Rückfragen erscheinen sie hier und Sie erhalten eine E-Mail.</li>
            <li>3. Anschließend richten wir Ihren Assistenten ein und testen ihn gemeinsam mit Ihnen.</li>
          </ul>
          <p className={cn('mt-3', text.hint)}>Bis Sie ihn freigeben, nimmt Ihr Assistent keine Anrufe entgegen.</p>
        </div>
      </div>
    </AppCard>
  );
}

function RequestsCard({ requests, canEdit, onAnswered }: {
  requests: CustomerIntake['requests']; canEdit: boolean; onAnswered: () => void;
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send(id: string) {
    setBusy(id); setError(null);
    const r = await respondToRequest(id, (drafts[id] ?? '').trim());
    setBusy(null);
    if (r.error) { setError(r.error.message); return; }
    setDrafts((d) => ({ ...d, [id]: '' }));
    onAnswered();
  }

  return (
    <AppCard className="border-[var(--cq-border-strong)]">
      <p className={text.cardTitle}>Rückfragen von Cogniiq</p>
      <p className={cn('mt-1', text.body)}>Bitte beantworten Sie diese Fragen, damit wir mit der Einrichtung fortfahren können.</p>
      {error ? <p role="alert" className="mt-2 text-[12.5px] text-red-700">{error}</p> : null}
      <ul className="mt-4 space-y-4">
        {requests.map((r) => (
          <li key={r.id} className={cn('border border-[var(--cq-border)] p-3', radius.md)}>
            <p className="whitespace-pre-wrap text-[13px] font-medium leading-5 text-[var(--cq-fg)]">{r.question}</p>
            {r.status === 'answered' ? (
              <p className={cn('mt-2', text.body)}><span className="font-medium">Ihre Antwort:</span> {r.response} <span className={text.hint}>(wird geprüft)</span></p>
            ) : canEdit ? (
              <div className="mt-2 space-y-2">
                <AppTextarea id={`req-${r.id}`} label="Ihre Antwort" value={drafts[r.id] ?? ''} maxLength={4000}
                  onChange={(e) => setDrafts((d) => ({ ...d, [r.id]: e.target.value }))} />
                <AppButton variant="secondary" disabled={busy === r.id || !(drafts[r.id] ?? '').trim()} onClick={() => void send(r.id)}>
                  {busy === r.id ? 'Wird gesendet …' : 'Antwort senden'}
                </AppButton>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </AppCard>
  );
}
