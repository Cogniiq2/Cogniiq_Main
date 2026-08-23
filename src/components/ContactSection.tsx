import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  CircleAlert as AlertCircle,
  ShieldCheck,
  BadgeCheck,
  Mail,
  Pencil,
} from 'lucide-react';
import { PremiumCalendar } from './PremiumCalendar';
import { N8N_ENDPOINTS } from '@/config/externalEndpoints';

/*
  Guided contact flow — one question per screen.

  Why this shape: the visitor is never shown more than one decision at a
  time, selections advance automatically, and a live dossier on the left
  mirrors every answer back — the anfrage builds itself in front of them.
  Qualification (role, team size, timeline) reads as preparation for the
  Analysegespräch, not as a gate; scoring rides in the webhook payload and
  never blocks (owner decision). The n8n webhook contract is unchanged:
  one POST to N8N_ENDPOINTS.contact.

  Motion per COPY-BRIEF-3 §1.4: ≤200ms, ease-out, opacity + small shift.
*/

const EASE_OUT = [0.0, 0.0, 0.2, 1] as [number, number, number, number];

const INTEREST_OPTIONS = [
  { id: 'KI Telefonassistent', label: 'KI Telefonassistent', desc: 'Anrufe annehmen, wenn niemand frei ist' },
  { id: 'Automationen', label: 'Automationen', desc: 'Manuelle Abläufe abgeben' },
  { id: 'Webdesign', label: 'Webdesign', desc: 'Eine Website, die Anfragen bringt' },
  { id: 'KI Content Creation', label: 'KI Content', desc: 'Inhalte systematisch erstellen' },
];

const TIMELINE_OPTIONS = [
  { value: 'asap', label: 'So schnell wie möglich' },
  { value: '1-2months', label: 'In 1–2 Monaten' },
  { value: '3+months', label: 'In 3+ Monaten' },
];

const TEAM_SIZE_OPTIONS = [
  { value: 'solo', label: 'Nur ich' },
  { value: '2-10', label: '2–10 Mitarbeitende' },
  { value: '11-50', label: '11–50 Mitarbeitende' },
  { value: '50+', label: 'Über 50 Mitarbeitende' },
];

const ROLE_OPTIONS = [
  { value: 'inhaber', label: 'Ich führe das Unternehmen' },
  { value: 'leitung', label: 'Ich leite einen Bereich' },
  { value: 'team', label: 'Ich arbeite im Team mit' },
  { value: 'sonstiges', label: 'Etwas anderes' },
];

const INDUSTRY_OPTIONS = ['Medizin & Kliniken', 'Gastronomie', 'Sport & Fitness', 'Immobilien', 'E-Commerce', 'Sonstiges'];

interface FormData {
  name: string;
  email: string;
  company: string;
  industry: string;
  timeline: string;
  teamSize: string;
  role: string;
  interests: string[];
  goal: string;
  preferredTime: string;
}

const EMPTY: FormData = {
  name: '',
  email: '',
  company: '',
  industry: '',
  timeline: '',
  teamSize: '',
  role: '',
  interests: [],
  goal: '',
  preferredTime: '',
};

const DRAFT_KEY = 'cogniiq-contact-draft';
const STEP_KEY = 'cogniiq-contact-step';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* Question sequence. Selections auto-advance; typed steps use Weiter. */
const QUESTIONS = [
  { key: 'interests', dossier: 'Themen' },
  { key: 'timeline', dossier: 'Start' },
  { key: 'role', dossier: 'Rolle' },
  { key: 'teamSize', dossier: 'Teamgröße' },
  { key: 'goal', dossier: 'Vorhaben' },
  { key: 'contact', dossier: 'Kontakt' },
  { key: 'termin', dossier: 'Wunschtermin' },
] as const;

type QuestionKey = (typeof QUESTIONS)[number]['key'];

/* Lead scoring — travels with the payload so n8n can prioritise.
   Never blocks submission (owner decision: score, don't gate). */
function scoreLead(data: FormData): { score: number; qualification: 'hoch' | 'mittel' | 'niedrig'; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (data.timeline === 'asap') { score += 30; reasons.push('Start: sofort'); }
  else if (data.timeline === '1-2months') { score += 20; reasons.push('Start: 1–2 Monate'); }
  else if (data.timeline === '3+months') { score += 5; reasons.push('Start: 3+ Monate'); }

  if (data.role === 'inhaber') { score += 30; reasons.push('Entscheidet selbst'); }
  else if (data.role === 'leitung') { score += 20; reasons.push('Bereitet Entscheidung vor'); }
  else if (data.role) { score += 5; reasons.push('Keine Entscheidungsrolle angegeben'); }

  if (data.teamSize === '11-50') { score += 25; reasons.push('Teamgröße 11–50'); }
  else if (data.teamSize === '2-10' || data.teamSize === '50+') { score += 20; reasons.push(`Teamgröße ${data.teamSize}`); }
  else if (data.teamSize === 'solo') { score += 5; reasons.push('Solo-Unternehmen'); }

  if (data.goal.trim().length >= 80) { score += 10; reasons.push('Vorhaben konkret beschrieben'); }
  if (data.interests.length > 0) { score += 5; }

  const qualification = score >= 70 ? 'hoch' : score >= 40 ? 'mittel' : 'niedrig';
  return { score, qualification, reasons };
}

function loadDraft(): FormData {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<FormData>;
    return { ...EMPTY, ...parsed, interests: Array.isArray(parsed.interests) ? parsed.interests : [] };
  } catch {
    return EMPTY;
  }
}

function loadStep(): number {
  try {
    const n = Number(sessionStorage.getItem(STEP_KEY));
    return Number.isInteger(n) && n >= 0 && n < QUESTIONS.length ? n : 0;
  } catch {
    return 0;
  }
}

function labelOf(options: { value: string; label: string }[], value: string): string {
  return options.find(o => o.value === value)?.label ?? '';
}

/* ─── Building blocks ──────────────────────────────────────────────── */

function QuestionShell({
  children,
  qKey,
}: {
  children: React.ReactNode;
  qKey: string;
}) {
  return (
    <motion.div
      key={qKey}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18, ease: EASE_OUT }}
      className="flex flex-col"
    >
      {children}
    </motion.div>
  );
}

function QuestionHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-7">
      <h3
        className="text-gray-900 leading-[1.15]"
        style={{ fontSize: 'clamp(21px, 2.4vw, 26px)', fontWeight: 700, letterSpacing: '-0.02em' }}
      >
        {title}
      </h3>
      {sub && (
        <p className="text-[14px] text-gray-500 leading-[1.65] mt-2 max-w-[52ch]">{sub}</p>
      )}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: -3 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: EASE_OUT }}
      className="flex items-center gap-1.5 mt-2 text-[13px] text-red-600"
      role="alert"
    >
      <AlertCircle size={13} className="flex-shrink-0" />
      {message}
    </motion.p>
  );
}

/* Large single-select option row — the workhorse of the flow. */
function ChoiceList({
  options,
  value,
  onSelect,
}: {
  options: { value: string; label: string }[];
  value: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5" role="radiogroup">
      {options.map((opt, i) => {
        const active = value === opt.value;
        return (
          <motion.button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onSelect(opt.value)}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: i * 0.04, ease: EASE_OUT }}
            className="group flex items-center justify-between gap-3 px-5 rounded-xl border text-left transition-colors duration-150"
            style={{
              minHeight: '56px',
              borderColor: active ? '#111827' : '#e5e7eb',
              background: active ? '#111827' : '#ffffff',
            }}
          >
            <span className="flex items-center gap-3.5">
              <span
                className="flex-shrink-0 w-[18px] h-[18px] rounded-full border flex items-center justify-center transition-colors duration-150"
                style={{
                  borderColor: active ? 'rgba(255,255,255,0.5)' : '#d1d5db',
                  background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
                }}
              >
                {active && <Check size={11} strokeWidth={3} className="text-white" />}
              </span>
              <span
                className="text-[15px] font-medium transition-colors duration-150"
                style={{ color: active ? '#ffffff' : '#374151' }}
              >
                {opt.label}
              </span>
            </span>
            <ArrowRight
              size={14}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              style={{ color: active ? '#ffffff' : '#9ca3af' }}
            />
          </motion.button>
        );
      })}
    </div>
  );
}

const inputCls =
  'h-12 bg-white border-gray-200 rounded-xl text-[15px] text-gray-900 placeholder:text-gray-300 focus:border-gray-900 focus-visible:ring-0 transition-colors px-4';

/* ─── The section ──────────────────────────────────────────────────── */

export function ContactSection() {
  const ref = useRef(null);
  const navigate = useNavigate();
  const isInView = useInView(ref, { once: true, amount: 0.05 });
  const [step, setStep] = useState(loadStep);
  const [maxVisited, setMaxVisited] = useState(step);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [data, setData] = useState<FormData>(loadDraft);
  const honeypotRef = useRef('');
  const mountedAt = useRef(Date.now());
  const cardRef = useRef<HTMLDivElement>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(data));
      sessionStorage.setItem(STEP_KEY, String(step));
    } catch {
      /* best-effort */
    }
  }, [data, step]);

  useEffect(() => () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
  }, []);

  const update = (partial: Partial<FormData>) => {
    setData(d => ({ ...d, ...partial }));
    setErrors(prev => {
      const next = { ...prev };
      Object.keys(partial).forEach(k => delete next[k]);
      return next;
    });
  };

  const scrollToCard = useCallback(() => {
    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const goTo = useCallback((n: number) => {
    setErrors({});
    setStep(n);
    setMaxVisited(m => Math.max(m, n));
    scrollToCard();
  }, [scrollToCard]);

  const validate = (key: QuestionKey): Record<string, string> => {
    const e: Record<string, string> = {};
    if (key === 'interests' && data.interests.length === 0) e.interests = 'Bitte wählen Sie mindestens ein Thema aus.';
    if (key === 'timeline' && !data.timeline) e.timeline = 'Bitte wählen Sie einen Startzeitraum.';
    if (key === 'role' && !data.role) e.role = 'Bitte wählen Sie Ihre Rolle aus.';
    if (key === 'teamSize' && !data.teamSize) e.teamSize = 'Bitte wählen Sie Ihre Teamgröße.';
    if (key === 'goal' && !data.goal.trim()) e.goal = 'Ein Satz genügt — worum geht es?';
    if (key === 'contact') {
      if (!data.name.trim()) e.name = 'Bitte geben Sie Ihren Namen an.';
      if (!data.email.trim()) e.email = 'Bitte geben Sie Ihre E-Mail-Adresse an.';
      else if (!EMAIL_RE.test(data.email.trim())) e.email = 'Diese E-Mail-Adresse sieht nicht vollständig aus.';
      if (!data.company.trim()) e.company = 'Bitte geben Sie Ihr Unternehmen an.';
      if (!data.industry) e.industry = 'Bitte wählen Sie Ihre Branche.';
    }
    return e;
  };

  const handleNext = () => {
    const key = QUESTIONS[step].key;
    const e = validate(key);
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    if (step < QUESTIONS.length - 1) goTo(step + 1);
  };

  /* Single-selects: register the choice, breathe for 220ms, move on. */
  const selectAndAdvance = (partial: Partial<FormData>) => {
    update(partial);
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => {
      setStep(s => {
        const next = Math.min(s + 1, QUESTIONS.length - 1);
        setMaxVisited(m => Math.max(m, next));
        return next;
      });
      setErrors({});
      scrollToCard();
    }, 220);
  };

  const handleBack = () => {
    if (step > 0) goTo(step - 1);
  };

  const handleFinalSubmit = async () => {
    // final safety net across everything typed
    const e = { ...validate('goal'), ...validate('contact') };
    setErrors(e);
    if (Object.keys(e).length > 0) {
      // jump back to the first incomplete question
      if (e.goal) goTo(4);
      else goTo(5);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(false);

    const { score, qualification, reasons } = scoreLead(data);
    const elapsedSeconds = Math.round((Date.now() - mountedAt.current) / 1000);

    const payload = {
      ...data,
      source: 'kontakt-page',
      submitted_at: new Date().toISOString(),
      page_url: window.location.href,
      referrer: document.referrer || null,
      lead_score: score,
      qualification,
      qualification_reasons: reasons,
      time_to_complete_s: elapsedSeconds,
      spam_suspect: honeypotRef.current !== '' || elapsedSeconds < 5,
    };

    try {
      const res = await fetch(N8N_ENDPOINTS.contact, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
      try {
        sessionStorage.removeItem(DRAFT_KEY);
        sessionStorage.removeItem(STEP_KEY);
        sessionStorage.setItem(
          'cogniiq-anfrage-recap',
          JSON.stringify({ name: data.name, email: data.email, preferredTime: data.preferredTime, interests: data.interests })
        );
      } catch {
        /* best-effort */
      }
      navigate('/anfrage-erhalten');
    } catch (err) {
      console.error(err);
      setSubmitError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* Enter advances on typed steps (except inside the textarea). */
  const onFormKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    const target = e.target as HTMLElement;
    if (target.tagName === 'TEXTAREA') return;
    e.preventDefault();
    if (step < QUESTIONS.length - 1) handleNext();
  };

  /* ── Dossier rows (left panel) — the anfrage building itself ── */
  const dossier: { label: string; value: string; at: number }[] = [
    { label: 'Themen', value: data.interests.join(' · '), at: 0 },
    { label: 'Start', value: labelOf(TIMELINE_OPTIONS, data.timeline), at: 1 },
    { label: 'Rolle', value: labelOf(ROLE_OPTIONS, data.role), at: 2 },
    { label: 'Teamgröße', value: labelOf(TEAM_SIZE_OPTIONS, data.teamSize), at: 3 },
    { label: 'Vorhaben', value: data.goal.trim() ? (data.goal.trim().length > 60 ? `${data.goal.trim().slice(0, 59)}…` : data.goal.trim()) : '', at: 4 },
    { label: 'Kontakt', value: [data.name, data.company].filter(Boolean).join(' · '), at: 5 },
    { label: 'Wunschtermin', value: data.preferredTime, at: 6 },
  ];
  const answeredCount = dossier.filter(d => d.value).length;

  const currentKey = QUESTIONS[step].key;
  const stepNo = step + 1;

  return (
    <section
      id="kontakt"
      ref={ref}
      className="relative py-24 lg:py-32 bg-white overflow-hidden"
      aria-labelledby="contact-heading"
      data-rail-label="Analysegespräch anfragen"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 35% at 50% 0%, rgba(15,23,42,0.035) 0%, transparent 100%)' }}
      />

      <div className="relative max-w-6xl mx-auto px-6 lg:px-8">

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.2, ease: EASE_OUT }}
          className="mb-12 lg:mb-16"
        >
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-gray-400 mb-4">
            Analysegespräch
          </p>
          <h2
            id="contact-heading"
            className="text-gray-900 mb-4"
            style={{
              fontSize: 'clamp(28px, 4vw, 42px)',
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: '-0.024em',
              maxWidth: '18ch',
            }}
          >
            Sieben Fragen. Dann übernehmen wir.
          </h2>
          <p className="text-gray-500 text-[16px] leading-[1.7] max-w-[52ch]">
            Jede Antwort fließt direkt in die Vorbereitung Ihres Gesprächs ein —
            Sie sprechen mit jemandem, der Ihre Situation bereits kennt.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">

          {/* ─── Left: live dossier ─── */}
          <motion.aside
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.2, delay: 0.05, ease: EASE_OUT }}
            className="lg:col-span-4 order-2 lg:order-1 flex flex-col gap-6 lg:sticky lg:top-24"
          >
            <div
              className="rounded-2xl border border-gray-100 bg-white overflow-hidden"
              style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.04)' }}
            >
              <div className="px-5 pt-5 pb-4 border-b border-gray-50 flex items-baseline justify-between">
                <p className="text-[13px] font-semibold text-gray-900">Ihre Anfrage</p>
                <p className="text-[13px] text-gray-400 tabular-nums">{answeredCount}/7</p>
              </div>
              <div className="px-5 py-2">
                {dossier.map((row) => {
                  const answered = !!row.value;
                  const isCurrent = row.at === step;
                  return (
                    <button
                      key={row.label}
                      type="button"
                      disabled={row.at > maxVisited}
                      onClick={() => goTo(row.at)}
                      className="group w-full flex items-start gap-3 py-3 border-b border-gray-50 last:border-0 text-left disabled:cursor-default"
                    >
                      <span
                        className="flex-shrink-0 mt-[3px] w-[16px] h-[16px] rounded-full border flex items-center justify-center transition-colors duration-150"
                        style={{
                          borderColor: answered ? '#111827' : isCurrent ? '#9ca3af' : '#e5e7eb',
                          background: answered ? '#111827' : 'transparent',
                        }}
                      >
                        {answered && <Check size={9} strokeWidth={3.5} className="text-white" />}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span
                          className="block text-[13px] font-medium transition-colors duration-150"
                          style={{ color: isCurrent ? '#111827' : answered ? '#374151' : '#9ca3af' }}
                        >
                          {row.label}
                        </span>
                        {answered && (
                          <span className="block text-[13px] text-gray-500 truncate mt-0.5">{row.value}</span>
                        )}
                      </span>
                      {answered && row.at <= maxVisited && (
                        <Pencil size={12} className="flex-shrink-0 mt-1 text-gray-200 group-hover:text-gray-500 transition-colors duration-150" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <Check size={14} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-[13px] text-emerald-700 leading-relaxed">
                Antwort in der Regel innerhalb von{' '}
                <span className="font-semibold">24&nbsp;Stunden</span> — persönlich, kein Ticketsystem.
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              {[
                { icon: ShieldCheck, text: 'SSL-verschlüsselt übertragen' },
                { icon: BadgeCheck, text: 'Keine Weitergabe an Dritte' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5">
                  <Icon size={13} className="text-gray-300 flex-shrink-0" />
                  <span className="text-[13px] text-gray-400">{text}</span>
                </div>
              ))}
            </div>
          </motion.aside>

          {/* ─── Right: one question at a time ─── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.2, delay: 0.08, ease: EASE_OUT }}
            className="lg:col-span-8 order-1 lg:order-2"
          >
            <div
              ref={cardRef}
              className="rounded-2xl border border-gray-100 bg-white p-7 sm:p-10 scroll-mt-28"
              style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.04)' }}
            >
              {/* Segmented progress */}
              <div className="flex items-center gap-4 mb-9">
                <div className="flex-1 flex gap-1.5">
                  {QUESTIONS.map((q, i) => (
                    <div key={q.key} className="flex-1 h-[3px] rounded-full bg-gray-100 overflow-hidden">
                      <motion.div
                        className="h-full bg-gray-900 rounded-full"
                        initial={false}
                        animate={{ scaleX: i < stepNo ? 1 : 0 }}
                        style={{ transformOrigin: 'left' }}
                        transition={{ duration: 0.2, ease: EASE_OUT }}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-[13px] text-gray-400 tabular-nums flex-shrink-0">
                  {stepNo} / {QUESTIONS.length}
                </p>
              </div>

              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  if (step < QUESTIONS.length - 1) handleNext();
                  else handleFinalSubmit();
                }}
                onKeyDown={onFormKeyDown}
              >
                {/* Honeypot — invisible to humans, filled by bots */}
                <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', height: 0, overflow: 'hidden' }}>
                  <label>
                    Website
                    <input
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      onChange={(e) => { honeypotRef.current = e.target.value; }}
                    />
                  </label>
                </div>

                <div style={{ minHeight: '320px' }}>
                  <AnimatePresence mode="wait">

                    {currentKey === 'interests' && (
                      <QuestionShell qKey="interests">
                        <QuestionHead
                          title="Wo sehen Sie den größten Hebel?"
                          sub="Wählen Sie alles, was auf Ihre Situation zutrifft."
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {INTEREST_OPTIONS.map((opt, i) => {
                            const active = data.interests.includes(opt.id);
                            return (
                              <motion.button
                                key={opt.id}
                                type="button"
                                aria-pressed={active}
                                onClick={() =>
                                  update({
                                    interests: active
                                      ? data.interests.filter(x => x !== opt.id)
                                      : [...data.interests, opt.id],
                                  })
                                }
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.18, delay: i * 0.04, ease: EASE_OUT }}
                                className="flex flex-col items-start gap-1 px-5 py-4 border rounded-xl text-left transition-colors duration-150"
                                style={{
                                  borderColor: active ? '#111827' : '#e5e7eb',
                                  background: active ? '#111827' : '#ffffff',
                                  minHeight: '76px',
                                }}
                              >
                                <span className="flex items-center gap-2.5 w-full">
                                  <span
                                    className="flex-shrink-0 w-[16px] h-[16px] border rounded-[5px] flex items-center justify-center transition-colors duration-150"
                                    style={{
                                      borderColor: active ? 'rgba(255,255,255,0.5)' : '#d1d5db',
                                      background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
                                    }}
                                  >
                                    {active && <Check size={10} strokeWidth={3} className="text-white" />}
                                  </span>
                                  <span className="text-[14.5px] font-semibold" style={{ color: active ? '#ffffff' : '#111827' }}>
                                    {opt.label}
                                  </span>
                                </span>
                                <span className="text-[13px] leading-snug pl-[26px]" style={{ color: active ? 'rgba(255,255,255,0.65)' : '#9ca3af' }}>
                                  {opt.desc}
                                </span>
                              </motion.button>
                            );
                          })}
                        </div>
                        <FieldError message={errors.interests} />
                      </QuestionShell>
                    )}

                    {currentKey === 'timeline' && (
                      <QuestionShell qKey="timeline">
                        <QuestionHead
                          title="Wann soll es losgehen?"
                          sub="Eine ehrliche Einschätzung genügt — das ist keine Festlegung."
                        />
                        <ChoiceList
                          options={TIMELINE_OPTIONS}
                          value={data.timeline}
                          onSelect={v => selectAndAdvance({ timeline: v })}
                        />
                        <FieldError message={errors.timeline} />
                      </QuestionShell>
                    )}

                    {currentKey === 'role' && (
                      <QuestionShell qKey="role">
                        <QuestionHead
                          title="Welche Rolle haben Sie im Unternehmen?"
                          sub="Damit wir das Gespräch auf der richtigen Ebene führen."
                        />
                        <ChoiceList
                          options={ROLE_OPTIONS}
                          value={data.role}
                          onSelect={v => selectAndAdvance({ role: v })}
                        />
                        <FieldError message={errors.role} />
                      </QuestionShell>
                    )}

                    {currentKey === 'teamSize' && (
                      <QuestionShell qKey="teamSize">
                        <QuestionHead
                          title="Wie groß ist Ihr Team?"
                          sub="Die Größenordnung entscheidet, welche Systeme sich für Sie rechnen."
                        />
                        <ChoiceList
                          options={TEAM_SIZE_OPTIONS}
                          value={data.teamSize}
                          onSelect={v => selectAndAdvance({ teamSize: v })}
                        />
                        <FieldError message={errors.teamSize} />
                      </QuestionShell>
                    )}

                    {currentKey === 'goal' && (
                      <QuestionShell qKey="goal">
                        <QuestionHead
                          title="Was soll sich konkret ändern?"
                          sub="In Ihren Worten. Je konkreter, desto besser vorbereitet sind wir im Gespräch."
                        />
                        <Textarea
                          value={data.goal}
                          onChange={e => update({ goal: e.target.value })}
                          rows={5}
                          autoFocus
                          placeholder="Zum Beispiel: Uns gehen abends und samstags Anrufe verloren, und die Terminvergabe frisst jeden Vormittag …"
                          className="bg-white border-gray-200 rounded-xl text-[15px] text-gray-900 placeholder:text-gray-300 focus:border-gray-900 focus-visible:ring-0 resize-none transition-colors leading-[1.7] p-4"
                          aria-invalid={!!errors.goal}
                        />
                        <FieldError message={errors.goal} />
                      </QuestionShell>
                    )}

                    {currentKey === 'contact' && (
                      <QuestionShell qKey="contact">
                        <QuestionHead
                          title="An wen dürfen wir uns wenden?"
                          sub="Ihre Daten werden ausschließlich zur Bearbeitung dieser Anfrage verwendet."
                        />
                        <div className="flex flex-col gap-5">
                          <div className="grid md:grid-cols-2 gap-5">
                            <div>
                              <FieldLabel>Name</FieldLabel>
                              <Input
                                value={data.name}
                                onChange={e => update({ name: e.target.value })}
                                autoComplete="name"
                                autoFocus
                                placeholder="Max Mustermann"
                                className={inputCls}
                                aria-invalid={!!errors.name}
                              />
                              <FieldError message={errors.name} />
                            </div>
                            <div>
                              <FieldLabel>E-Mail</FieldLabel>
                              <Input
                                type="email"
                                value={data.email}
                                onChange={e => update({ email: e.target.value })}
                                autoComplete="email"
                                placeholder="max@unternehmen.de"
                                className={inputCls}
                                aria-invalid={!!errors.email}
                              />
                              <FieldError message={errors.email} />
                            </div>
                          </div>
                          <div className="grid md:grid-cols-2 gap-5">
                            <div>
                              <FieldLabel>Unternehmen</FieldLabel>
                              <Input
                                value={data.company}
                                onChange={e => update({ company: e.target.value })}
                                autoComplete="organization"
                                placeholder="Unternehmensname"
                                className={inputCls}
                                aria-invalid={!!errors.company}
                              />
                              <FieldError message={errors.company} />
                            </div>
                            <div>
                              <FieldLabel>Branche</FieldLabel>
                              <Select value={data.industry} onValueChange={v => update({ industry: v })}>
                                <SelectTrigger className="h-12 bg-white border-gray-200 rounded-xl text-[15px] focus:border-gray-900 focus:ring-0 transition-colors px-4">
                                  <SelectValue placeholder="Branche wählen" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-xl text-[14px]">
                                  {INDUSTRY_OPTIONS.map((v) => (
                                    <SelectItem key={v} value={v} className="py-2.5 cursor-pointer">
                                      {v}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FieldError message={errors.industry} />
                            </div>
                          </div>
                        </div>
                      </QuestionShell>
                    )}

                    {currentKey === 'termin' && (
                      <QuestionShell qKey="termin">
                        <QuestionHead
                          title={data.name ? `Fast geschafft, ${data.name.trim().split(/\s+/)[0]}.` : 'Fast geschafft.'}
                          sub="Wählen Sie optional einen Wunschtermin — wir bestätigen in der Regel innerhalb von 24 Stunden."
                        />
                        <PremiumCalendar
                          onSelect={(dt) => update({ preferredTime: dt })}
                          selectedDateTime={data.preferredTime}
                        />

                        {/* Natural-language recap — reads like a briefing, not a table */}
                        <div className="mt-7 p-5 rounded-xl bg-gray-50 border border-gray-100">
                          <p className="text-[13px] font-semibold text-gray-900 mb-2">Das geht an uns:</p>
                          <p className="text-[14px] text-gray-600 leading-[1.75]">
                            {data.company || 'Ihr Unternehmen'}
                            {data.industry ? ` (${data.industry})` : ''} mit{' '}
                            {labelOf(TEAM_SIZE_OPTIONS, data.teamSize).toLowerCase() || 'Ihrer Teamgröße'} —
                            Thema{data.interests.length > 1 ? 'n' : ''}:{' '}
                            <span className="text-gray-900 font-medium">{data.interests.join(', ') || '—'}</span>,
                            Start {labelOf(TIMELINE_OPTIONS, data.timeline).toLowerCase() || 'offen'}
                            {data.preferredTime ? `, Wunschtermin ${data.preferredTime}` : ''}.
                          </p>
                          <button
                            type="button"
                            onClick={() => goTo(0)}
                            className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-400 hover:text-gray-900 transition-colors"
                          >
                            <Pencil size={12} />
                            Angaben ändern
                          </button>
                        </div>
                      </QuestionShell>
                    )}

                  </AnimatePresence>
                </div>

                <AnimatePresence>
                  {submitError && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18, ease: EASE_OUT }}
                      className="mt-6 p-4 rounded-xl bg-red-50 border border-red-100"
                      role="alert"
                    >
                      <p className="text-[14px] font-medium text-red-700 mb-1">
                        Ihre Anfrage konnte gerade nicht übertragen werden.
                      </p>
                      <p className="text-[13px] text-red-600/80 leading-relaxed mb-2.5">
                        Ihre Eingaben sind gespeichert — nichts geht verloren. Bitte versuchen Sie es
                        noch einmal oder schreiben Sie uns direkt.
                      </p>
                      <a
                        href="mailto:info@cogniiq.de?subject=Analysegespräch%20anfragen"
                        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-red-700 hover:text-red-900 transition-colors"
                      >
                        <Mail size={13} />
                        info@cogniiq.de
                      </a>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Footer controls */}
                <div className="flex items-center justify-between mt-9 pt-6 border-t border-gray-100">
                  <div>
                    {step > 0 ? (
                      <button
                        type="button"
                        onClick={handleBack}
                        className="flex items-center gap-2 text-[14px] text-gray-400 hover:text-gray-900 transition-colors py-2"
                      >
                        <ArrowLeft size={14} />
                        Zurück
                      </button>
                    ) : (
                      <p className="text-[13px] text-gray-300">Dauert etwa 2 Minuten</p>
                    )}
                  </div>

                  {currentKey === 'termin' ? (
                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center gap-2.5 text-white"
                      style={{
                        background: '#111827',
                        fontSize: '15px',
                        fontWeight: 600,
                        letterSpacing: '0.01em',
                        borderRadius: '10px',
                        minHeight: '52px',
                        padding: '0 28px',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
                        opacity: isSubmitting ? 0.65 : 1,
                        cursor: isSubmitting ? 'wait' : 'pointer',
                        border: 'none',
                        transition: 'opacity 0.15s',
                      }}
                      whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
                      whileTap={{ scale: 0.985 }}
                    >
                      {isSubmitting ? (
                        <span>Wird gesendet …</span>
                      ) : (
                        <>
                          <span>{submitError ? 'Erneut senden' : 'Anfrage absenden'}</span>
                          <ArrowRight size={15} />
                        </>
                      )}
                    </motion.button>
                  ) : (
                    <motion.button
                      type="submit"
                      className="flex items-center gap-2.5 text-white"
                      style={{
                        background: '#111827',
                        fontSize: '15px',
                        fontWeight: 600,
                        letterSpacing: '0.01em',
                        borderRadius: '10px',
                        minHeight: '52px',
                        padding: '0 28px',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.985 }}
                    >
                      Weiter
                      <ArrowRight size={15} />
                    </motion.button>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="block text-gray-700 mb-2"
      style={{ fontSize: '14px', fontWeight: 500, letterSpacing: '0.01em' }}
    >
      {children}
    </label>
  );
}
