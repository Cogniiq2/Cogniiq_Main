// Pure intake logic shared by the customer form, the owner review and the unit tests.
// Client-side checks are a convenience only; the server re-validates every value.

import type {
  AnswerValue, DayHours, DayKey, IntakeStage, IntakeStatus, MessageStatus, OnboardingInvitation, OpeningHours, Question,
} from '@/lib/clientOnboarding/types';

export const STAGES: Array<{ key: IntakeStage; title: string; description: string }> = [
  { key: 'business', title: 'Ihr Unternehmen', description: 'Die wichtigsten Eckdaten, damit sich Ihr Assistent korrekt vorstellt.' },
  { key: 'operations', title: 'Ihre Abläufe', description: 'Öffnungszeiten, Leistungen und der Ton, in dem Ihr Assistent spricht.' },
  { key: 'appointments', title: 'Termine', description: 'Wie Termine bei Ihnen heute vergeben werden.' },
  { key: 'knowledge', title: 'Wissen & Kommunikation', description: 'Antworten auf häufige Fragen und die Begrüßung Ihrer Anrufer.' },
  { key: 'escalation', title: 'Erreichbarkeit & Eskalation', description: 'Wann und wohin Ihr Assistent an Ihr Team weiterleitet.' },
];

export const DAYS: Array<{ key: DayKey; label: string; short: string }> = [
  { key: 'mon', label: 'Montag', short: 'Mo' },
  { key: 'tue', label: 'Dienstag', short: 'Di' },
  { key: 'wed', label: 'Mittwoch', short: 'Mi' },
  { key: 'thu', label: 'Donnerstag', short: 'Do' },
  { key: 'fri', label: 'Freitag', short: 'Fr' },
  { key: 'sat', label: 'Samstag', short: 'Sa' },
  { key: 'sun', label: 'Sonntag', short: 'So' },
];

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function defaultHours(): OpeningHours {
  const out: OpeningHours = {};
  for (const d of DAYS) {
    out[d.key] = d.key === 'sat' || d.key === 'sun'
      ? { closed: true, ranges: [] }
      : { closed: false, ranges: [['08:00', '12:00'], ['14:00', '18:00']] };
  }
  return out;
}

export function isEmptyValue(value: AnswerValue | undefined): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'number') return !Number.isFinite(value);
  return Object.keys(value).length === 0;
}

/** Mirrors the server rules closely enough to give immediate feedback. Returns a German message or null. */
export function validateAnswer(q: Question, value: AnswerValue | undefined): string | null {
  if (isEmptyValue(value)) return q.required ? 'Bitte ausfüllen.' : null;
  switch (q.kind) {
    case 'text': case 'textarea': {
      const v = String(value);
      if (q.max_length && v.length > q.max_length) return `Höchstens ${q.max_length} Zeichen.`;
      return null;
    }
    case 'email':
      return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(value).trim()) ? null : 'Bitte eine gültige E-Mail-Adresse angeben.';
    case 'phone':
      return /^\+?[0-9 ()/.-]{5,40}$/.test(String(value).trim()) ? null : 'Bitte eine gültige Telefonnummer angeben.';
    case 'url':
      return /^https?:\/\/[^\s<>"]+$/i.test(String(value).trim()) ? null : 'Bitte eine Adresse beginnend mit https:// angeben.';
    case 'number':
      return /^\d{1,4}$/.test(String(value).trim()) ? null : 'Bitte eine ganze Zahl angeben.';
    case 'choice':
      return (q.options ?? []).some((o) => o.value === value) ? null : 'Bitte eine Möglichkeit wählen.';
    case 'multi_choice':
      return Array.isArray(value) && value.every((v) => (q.options ?? []).some((o) => o.value === v))
        ? null : 'Bitte nur angebotene Möglichkeiten wählen.';
    case 'hours':
      return validateHours(value as OpeningHours);
    default:
      return null;
  }
}

export function validateHours(hours: OpeningHours | null | undefined): string | null {
  if (!hours || typeof hours !== 'object') return 'Bitte Öffnungszeiten angeben.';
  for (const d of DAYS) {
    const day: DayHours | undefined = hours[d.key];
    if (!day || day.closed) continue;
    if (!Array.isArray(day.ranges) || day.ranges.length === 0) return `${d.label}: bitte Zeiten angeben oder „geschlossen“ wählen.`;
    if (day.ranges.length > 3) return `${d.label}: höchstens drei Zeitfenster.`;
    let lastEnd = '';
    for (const [start, end] of day.ranges) {
      if (!TIME_RE.test(start) || !TIME_RE.test(end)) return `${d.label}: Zeiten im Format HH:MM angeben.`;
      if (start >= end) return `${d.label}: Beginn muss vor dem Ende liegen.`;
      if (lastEnd && start < lastEnd) return `${d.label}: Zeitfenster dürfen sich nicht überschneiden.`;
      lastEnd = end;
    }
  }
  return null;
}

export function formatHours(hours: OpeningHours | null | undefined): string {
  if (!hours) return '—';
  return DAYS.map((d) => {
    const day = hours[d.key];
    if (!day || day.closed) return `${d.short}: geschlossen`;
    return `${d.short}: ${day.ranges.map(([a, b]) => `${a}–${b}`).join(', ')}`;
  }).join(' · ');
}

/** Human-readable rendering of any answer, for the review summary and the owner review. */
export function formatAnswer(q: Pick<Question, 'kind' | 'options'>, value: AnswerValue | undefined): string {
  if (isEmptyValue(value)) return '—';
  if (q.kind === 'hours') return formatHours(value as OpeningHours);
  const label = (v: string) => (q.options ?? []).find((o) => o.value === v)?.label ?? v;
  if (q.kind === 'choice') return label(String(value));
  if (q.kind === 'multi_choice' && Array.isArray(value)) return value.map((v) => label(String(v))).join(', ');
  return String(value);
}

export interface StageProgress { stage: IntakeStage; answered: number; required: number; requiredAnswered: number; complete: boolean }

export function stageProgress(questions: Question[], answers: Record<string, AnswerValue | undefined>): StageProgress[] {
  return STAGES.map(({ key }) => {
    const qs = questions.filter((q) => q.stage === key);
    const req = qs.filter((q) => q.required);
    const requiredAnswered = req.filter((q) => !isEmptyValue(answers[q.code]) && !validateAnswer(q, answers[q.code])).length;
    return {
      stage: key,
      answered: qs.filter((q) => !isEmptyValue(answers[q.code])).length,
      required: req.length,
      requiredAnswered,
      complete: requiredAnswered === req.length,
    };
  }).filter((p) => questions.some((q) => q.stage === p.stage));
}

export function overallPercent(progress: StageProgress[]): number {
  const req = progress.reduce((s, p) => s + p.required, 0);
  if (req === 0) return 0;
  return Math.round((progress.reduce((s, p) => s + p.requiredAnswered, 0) / req) * 100);
}

export function missingRequired(questions: Question[], answers: Record<string, AnswerValue | undefined>): Question[] {
  return questions.filter((q) => q.required && (isEmptyValue(answers[q.code]) || validateAnswer(q, answers[q.code]) !== null));
}

export const INTAKE_STATUS_LABEL: Record<IntakeStatus, string> = {
  not_started: 'Noch nicht begonnen',
  in_progress: 'In Bearbeitung',
  submitted: 'Übermittelt – wird geprüft',
  changes_requested: 'Ergänzungen erbeten',
  approved: 'Geprüft und übernommen',
};

/** Truthful message status: "accepted" is provider acceptance, never delivery. */
export function messageStatusLabel(status: MessageStatus, createdAt: string, now: number = Date.now()): { label: string; tone: 'success' | 'danger' | 'warning' | 'neutral' } {
  if (status === 'accepted') return { label: 'Vom E-Mail-Anbieter angenommen', tone: 'success' };
  if (status === 'failed') return { label: 'Versand fehlgeschlagen', tone: 'danger' };
  const ageMin = (now - new Date(createdAt).getTime()) / 60000;
  return ageMin > 10
    ? { label: 'Status unklar – kein Ergebnis protokolliert', tone: 'warning' }
    : { label: 'Wird versendet …', tone: 'neutral' };
}

/** Answers the customer may still edit: everything except owner-approved facts, and nothing once submitted. */
export function isLocked(intakeStatus: IntakeStatus, answerStatus: string | undefined): boolean {
  if (intakeStatus === 'submitted' || intakeStatus === 'approved') return true;
  return answerStatus === 'approved';
}

/** Truthful access state for one invitation — derived only from stored facts. */
export function invitationState(inv: OnboardingInvitation, now = Date.now()): { label: string; tone: 'success' | 'warning' | 'neutral' | 'danger' | 'info' } {
  if (inv.access_active) return { label: 'Portalzugang aktiv', tone: 'success' };
  if (inv.status === 'revoked') return { label: 'Widerrufen', tone: 'danger' };
  if (inv.status === 'superseded') return { label: 'Durch neuere Einladung ersetzt', tone: 'neutral' };
  if (inv.expires_at && new Date(inv.expires_at).getTime() < now) return { label: 'Abgelaufen', tone: 'warning' };
  if (inv.portal_invitation_status === 'revoked') return { label: 'Portal-Einladung widerrufen', tone: 'danger' };
  return { label: 'Eingeladen – noch nicht angemeldet', tone: 'info' };
}
