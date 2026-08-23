import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from './ui/input';
import { Label } from './ui/label';
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
  CircleCheck as CheckCircle,
  CircleAlert as AlertCircle,
  Sparkles,
  ShieldCheck,
  BadgeCheck,
  Mail,
} from 'lucide-react';
import { PremiumCalendar } from './PremiumCalendar';
import { N8N_ENDPOINTS } from '@/config/externalEndpoints';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1] as [number, number, number, number];

const INTEREST_OPTIONS = [
  { id: 'Webdesign', label: 'Webdesign', desc: 'Neue Website oder Relaunch' },
  { id: 'Automationen', label: 'Automationen', desc: 'Prozesse automatisieren' },
  { id: 'KI Telefonassistent', label: 'KI Telefonassistent', desc: 'Anrufe automatisch bearbeiten' },
  { id: 'KI Content Creation', label: 'KI Content', desc: 'Content automatisch erstellen' },
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
  { value: 'inhaber', label: 'Inhaber:in / Geschäftsführung' },
  { value: 'leitung', label: 'Leitung / Entscheidungsvorbereitung' },
  { value: 'team', label: 'Team / Fachbereich' },
  { value: 'sonstiges', label: 'Sonstiges' },
];

const INDUSTRY_OPTIONS = ['Medizin & Kliniken', 'Gastronomie', 'Sport & Fitness', 'Immobilien', 'E-Commerce', 'Sonstiges'];

const STEPS = [
  { label: 'Ihre Situation', short: 'Situation' },
  { label: 'Ihr Vorhaben', short: 'Vorhaben' },
  { label: 'Kontakt & Termin', short: 'Kontakt' },
];

const afterSteps = [
  { n: '01', label: 'Eingangsbestätigung', sub: 'Automatisch · sofort' },
  { n: '02', label: 'Systemanalyse', sub: 'Nach Ihrer Anfrage' },
  { n: '03', label: 'Analysegespräch', sub: '30–45 Min. · Video' },
  { n: '04', label: 'Systemkonzept', sub: 'Maßgeschneidert' },
];

const DSGVO_BADGES = [
  { icon: ShieldCheck, label: 'SSL-verschlüsselt' },
  { icon: BadgeCheck, label: 'Keine Weitergabe' },
];

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
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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

function ProgressBar({ step }: { step: number }) {
  const pct = ((step + 1) / STEPS.length) * 100;
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <motion.div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors"
              animate={{
                background: i <= step ? '#111827' : '#ffffff',
                borderColor: i <= step ? '#111827' : '#e5e7eb',
                color: i <= step ? '#ffffff' : '#9ca3af',
              }}
              transition={{ duration: 0.3 }}
            >
              {i < step ? (
                <motion.svg
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  width="10" height="8" viewBox="0 0 10 8" fill="none"
                >
                  <path d="M1 4L3.5 6.5L9 1" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </motion.svg>
              ) : (
                i + 1
              )}
            </motion.div>
            <span
              className="text-[11px] font-medium hidden sm:block transition-colors"
              style={{ color: i === step ? '#111827' : '#9ca3af' }}
            >
              {s.short}
            </span>
            {i < STEPS.length - 1 && (
              <div className="h-px w-8 sm:w-12 lg:w-16 mx-1" style={{ background: '#e5e7eb' }}>
                <motion.div
                  className="h-full"
                  style={{ background: '#111827', transformOrigin: 'left' }}
                  animate={{ scaleX: step > i ? 1 : 0 }}
                  transition={{ duration: 0.4, ease: EASE }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="h-[2px] w-full bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gray-900 rounded-full"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: EASE }}
        />
      </div>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: -3 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1.5 mt-1.5 text-[11.5px] text-red-600"
      role="alert"
    >
      <AlertCircle size={11} className="flex-shrink-0" />
      {message}
    </motion.p>
  );
}

function OptionGrid({
  options,
  value,
  onSelect,
  columns = 2,
}: {
  options: { value: string; label: string }[];
  value: string;
  onSelect: (v: string) => void;
  columns?: number;
}) {
  return (
    <div className={`grid gap-2 mt-1 ${columns === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            aria-pressed={active}
            className="flex items-center gap-2.5 px-4 py-3 border rounded-xl text-left transition-all"
            style={{
              borderColor: active ? '#111827' : '#e5e7eb',
              background: active ? '#111827' : '#ffffff',
            }}
          >
            <span
              className="flex-shrink-0 w-3.5 h-3.5 border rounded-full flex items-center justify-center transition-all"
              style={{
                borderColor: active ? '#ffffff60' : '#d1d5db',
                background: active ? '#ffffff18' : 'transparent',
              }}
            >
              {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
            </span>
            <span className="text-[13px] font-medium" style={{ color: active ? '#ffffff' : '#374151' }}>
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Step 1: Situation — clicks only, no personal data yet ─── */
function Step1({ data, onChange, errors }: { data: FormData; onChange: (d: Partial<FormData>) => void; errors: Record<string, string> }) {
  const toggleInterest = (v: string) =>
    onChange({
      interests: data.interests.includes(v)
        ? data.interests.filter(i => i !== v)
        : [...data.interests, v],
    });

  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="flex flex-col gap-6"
    >
      <div>
        <FormLabel>Wo sehen Sie den größten Hebel? *</FormLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-1">
          {INTEREST_OPTIONS.map((opt) => {
            const active = data.interests.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggleInterest(opt.id)}
                aria-pressed={active}
                className="group flex flex-col items-start gap-0.5 px-4 py-3 border rounded-xl text-left transition-all"
                style={{
                  borderColor: active ? '#111827' : '#e5e7eb',
                  background: active ? '#111827' : '#ffffff',
                }}
              >
                <div className="flex items-center gap-2 w-full">
                  <span
                    className="flex-shrink-0 w-3.5 h-3.5 border rounded-sm flex items-center justify-center transition-all"
                    style={{
                      borderColor: active ? '#ffffff60' : '#d1d5db',
                      background: active ? '#ffffff18' : 'transparent',
                    }}
                  >
                    <AnimatePresence>
                      {active && (
                        <motion.svg
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          width="9" height="7" viewBox="0 0 9 7" fill="none"
                        >
                          <path d="M1 3.5L3.5 6L8 1" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </motion.svg>
                      )}
                    </AnimatePresence>
                  </span>
                  <span className="text-[13px] font-medium" style={{ color: active ? '#ffffff' : '#374151' }}>
                    {opt.label}
                  </span>
                </div>
                <span className="text-[11px] pl-5" style={{ color: active ? '#ffffff70' : '#9ca3af' }}>
                  {opt.desc}
                </span>
              </button>
            );
          })}
        </div>
        <FieldError message={errors.interests} />
      </div>

      <div>
        <FormLabel>Wann möchten Sie starten? *</FormLabel>
        <OptionGrid options={TIMELINE_OPTIONS} value={data.timeline} onSelect={v => onChange({ timeline: v })} />
        <FieldError message={errors.timeline} />
      </div>
    </motion.div>
  );
}

/* ─── Step 2: Vorhaben & Rahmen — the qualifying step, framed as service ─── */
function Step2({ data, onChange, errors }: { data: FormData; onChange: (d: Partial<FormData>) => void; errors: Record<string, string> }) {
  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="flex flex-col gap-6"
    >
      <p className="text-[12.5px] text-gray-400 leading-relaxed -mb-1">
        Drei kurze Angaben, damit wir Ihnen im Gespräch realistische Optionen zeigen können — statt allgemeiner Beispiele.
      </p>

      <div>
        <FormLabel>Ihre Rolle im Unternehmen *</FormLabel>
        <OptionGrid options={ROLE_OPTIONS} value={data.role} onSelect={v => onChange({ role: v })} />
        <FieldError message={errors.role} />
      </div>

      <div>
        <FormLabel>Teamgröße *</FormLabel>
        <OptionGrid options={TEAM_SIZE_OPTIONS} value={data.teamSize} onSelect={v => onChange({ teamSize: v })} />
        <FieldError message={errors.teamSize} />
      </div>

      <div>
        <FormLabel>Ziel und Ausgangssituation *</FormLabel>
        <Textarea
          value={data.goal}
          onChange={e => onChange({ goal: e.target.value })}
          rows={4}
          placeholder="Beschreiben Sie Ihre aktuelle Situation und was Sie verändern möchten …"
          className="bg-white border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-300 focus:border-gray-400 focus-visible:ring-0 resize-none transition-colors leading-relaxed"
          aria-invalid={!!errors.goal}
        />
        <FieldError message={errors.goal} />
      </div>
    </motion.div>
  );
}

/* ─── Step 3: Kontakt & Termin ─── */
function Step3({ data, onChange, errors }: { data: FormData; onChange: (d: Partial<FormData>) => void; errors: Record<string, string> }) {
  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="flex flex-col gap-5"
    >
      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <FormLabel>Name *</FormLabel>
          <Input
            value={data.name}
            onChange={e => onChange({ name: e.target.value })}
            autoComplete="name"
            placeholder="Max Mustermann"
            className="h-11 bg-white border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-300 focus:border-gray-400 focus-visible:ring-0 transition-colors"
            aria-invalid={!!errors.name}
          />
          <FieldError message={errors.name} />
        </div>
        <div>
          <FormLabel>E-Mail *</FormLabel>
          <Input
            type="email"
            value={data.email}
            onChange={e => onChange({ email: e.target.value })}
            autoComplete="email"
            placeholder="max@unternehmen.de"
            className="h-11 bg-white border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-300 focus:border-gray-400 focus-visible:ring-0 transition-colors"
            aria-invalid={!!errors.email}
          />
          <FieldError message={errors.email} />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <FormLabel>Unternehmen *</FormLabel>
          <Input
            value={data.company}
            onChange={e => onChange({ company: e.target.value })}
            autoComplete="organization"
            placeholder="Unternehmensname"
            className="h-11 bg-white border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-300 focus:border-gray-400 focus-visible:ring-0 transition-colors"
            aria-invalid={!!errors.company}
          />
          <FieldError message={errors.company} />
        </div>
        <div>
          <FormLabel>Branche *</FormLabel>
          <Select value={data.industry} onValueChange={v => onChange({ industry: v })}>
            <SelectTrigger className="h-11 bg-white border-gray-200 rounded-lg text-sm focus:border-gray-400 focus:ring-0 transition-colors">
              <SelectValue placeholder="Branche wählen" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-xl text-sm">
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

      <div>
        <FormLabel optional>Bevorzugter Gesprächstermin</FormLabel>
        <p className="text-[12px] text-gray-400 mb-3 leading-relaxed">
          Wählen Sie optional einen Wunschtermin. Wir bestätigen Ihnen den Termin in der Regel innerhalb von 24&nbsp;Stunden.
        </p>
        <div className="mt-1">
          <PremiumCalendar
            onSelect={(dt) => onChange({ preferredTime: dt })}
            selectedDateTime={data.preferredTime}
          />
        </div>
      </div>

      <div className="mt-2 p-4 rounded-xl bg-gray-50 border border-gray-100">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400 mb-3">
          Zusammenfassung
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12.5px]">
          {[
            { label: 'Themen', value: data.interests.join(', ') },
            { label: 'Start', value: TIMELINE_OPTIONS.find(o => o.value === data.timeline)?.label },
            { label: 'Rolle', value: ROLE_OPTIONS.find(o => o.value === data.role)?.label },
            { label: 'Teamgröße', value: TEAM_SIZE_OPTIONS.find(o => o.value === data.teamSize)?.label },
            { label: 'Unternehmen', value: data.company },
            { label: 'Wunschtermin', value: data.preferredTime },
          ].map(({ label, value }) => (
            <div key={label}>
              <span className="text-gray-400">{label}: </span>
              <span className="text-gray-700 font-medium">{value || '—'}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function ContactSection() {
  const ref = useRef(null);
  const navigate = useNavigate();
  const isInView = useInView(ref, { once: true, amount: 0.08 });
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [data, setData] = useState<FormData>(loadDraft);
  const honeypotRef = useRef('');
  const mountedAt = useRef(Date.now());
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    } catch {
      /* storage unavailable — draft persistence is best-effort */
    }
  }, [data]);

  const update = (partial: Partial<FormData>) => {
    setData(d => ({ ...d, ...partial }));
    // clear the error of every field being edited, immediately
    setErrors(prev => {
      const next = { ...prev };
      Object.keys(partial).forEach(k => delete next[k]);
      return next;
    });
  };

  const validateStep = (s: number): Record<string, string> => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (data.interests.length === 0) e.interests = 'Bitte wählen Sie mindestens ein Thema aus.';
      if (!data.timeline) e.timeline = 'Bitte wählen Sie einen Startzeitraum.';
    }
    if (s === 1) {
      if (!data.role) e.role = 'Bitte wählen Sie Ihre Rolle aus.';
      if (!data.teamSize) e.teamSize = 'Bitte wählen Sie Ihre Teamgröße.';
      if (!data.goal.trim()) e.goal = 'Bitte beschreiben Sie kurz Ihr Vorhaben — ein Satz genügt.';
    }
    if (s === 2) {
      if (!data.name.trim()) e.name = 'Bitte geben Sie Ihren Namen an.';
      if (!data.email.trim()) e.email = 'Bitte geben Sie Ihre E-Mail-Adresse an.';
      else if (!EMAIL_RE.test(data.email.trim())) e.email = 'Diese E-Mail-Adresse sieht nicht vollständig aus.';
      if (!data.company.trim()) e.company = 'Bitte geben Sie Ihr Unternehmen an.';
      if (!data.industry) e.industry = 'Bitte wählen Sie Ihre Branche.';
    }
    return e;
  };

  const scrollToCard = () => {
    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleNext = () => {
    const e = validateStep(step);
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setStep(s => Math.min(s + 1, STEPS.length - 1));
    scrollToCard();
  };

  const handleBack = () => {
    setErrors({});
    setStep(s => Math.max(s - 1, 0));
  };

  const handleFinalSubmit = async () => {
    const e = validateStep(2);
    setErrors(e);
    if (Object.keys(e).length > 0) return;

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

  return (
    <section
      id="kontakt"
      ref={ref}
      className="relative py-24 lg:py-32 bg-white overflow-hidden"
      aria-labelledby="contact-heading"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 35% at 50% 0%, rgba(15,23,42,0.035) 0%, transparent 100%)' }}
      />

      <div className="relative max-w-6xl mx-auto px-6 lg:px-8">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: EASE }}
          className="mb-14 lg:mb-18"
        >
          <div className="flex items-center gap-2 mb-5">
            <Sparkles size={11} className="text-gray-300" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-400">
              Analysegespräch
            </p>
          </div>
          <h2
            id="contact-heading"
            className="text-gray-900 mb-4"
            style={{
              fontSize: 'clamp(28px, 4vw, 42px)',
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: '-0.024em',
              maxWidth: '16ch',
            }}
          >
            Analysegespräch anfragen.
          </h2>
          <p className="text-gray-500 text-[15px] leading-[1.7] max-w-[42ch]">
            Schildern Sie Ihre Ausgangssituation. Wir analysieren Ihren Prozessstatus und
            zeigen, wo KI-Systeme den größten Hebel erzeugen.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">

          {/* ─── Left: context panel ─── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
            className="lg:col-span-4 flex flex-col gap-8"
          >
            <div>
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.2em] text-gray-400 mb-5">
                Nach Ihrer Anfrage
              </p>
              <div className="flex flex-col">
                {afterSteps.map((s, i) => (
                  <div
                    key={s.n}
                    className="flex items-start gap-4 py-4 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
                      <span
                        className="text-gray-300 tabular-nums font-medium"
                        style={{ fontSize: '11px', letterSpacing: '0.04em', minWidth: '22px' }}
                      >
                        {s.n}
                      </span>
                      {i < afterSteps.length - 1 && (
                        <div className="w-px h-4 bg-gray-100" />
                      )}
                    </div>
                    <div>
                      <p className="text-[13.5px] font-medium text-gray-800 leading-snug">{s.label}</p>
                      <p className="text-[11.5px] text-gray-400 mt-0.5">{s.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-gray-100 rounded-xl p-5 bg-gray-50/60">
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-gray-400 mb-3">
                Für wen
              </p>
              <p className="text-[13px] text-gray-500 leading-[1.68]">
                Unternehmen in Deutschland, die operative Prozesse systematisch automatisieren
                wollen — keine Experimente, keine Demos.
              </p>
            </div>

            <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <CheckCircle size={13} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-emerald-700 leading-relaxed">
                Antwort in der Regel innerhalb von{' '}
                <span className="font-semibold">24&nbsp;Stunden</span>
              </p>
            </div>

            {/* DSGVO Trust Badges */}
            <div>
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-gray-400 mb-3">
                Datenschutz & Sicherheit
              </p>
              <div className="grid grid-cols-2 gap-2">
                {DSGVO_BADGES.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-100 bg-white"
                  >
                    <Icon size={12} className="text-emerald-600 flex-shrink-0" />
                    <span className="text-[11.5px] text-gray-600 font-medium leading-tight">{label}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10.5px] text-gray-400 mt-3 leading-relaxed">
                Ihre Daten werden ausschließlich zur Bearbeitung Ihrer Anfrage verwendet und niemals an Dritte weitergegeben.
              </p>
            </div>
          </motion.div>

          {/* ─── Right: Multistep Form ─── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.16, ease: EASE }}
            className="lg:col-span-8"
          >
            <div
              ref={cardRef}
              className="rounded-2xl border border-gray-100 bg-white p-8 scroll-mt-28"
              style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.04)' }}
            >
              <ProgressBar step={step} />

              <div className="mb-6">
                <h3 className="text-[15px] font-bold text-gray-900 leading-tight">
                  {STEPS[step].label}
                </h3>
                <p className="text-[12px] text-gray-400 mt-0.5">
                  Schritt {step + 1} von {STEPS.length}
                </p>
              </div>

              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  if (step < STEPS.length - 1) handleNext();
                  else handleFinalSubmit();
                }}
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

                <AnimatePresence mode="wait">
                  {step === 0 && <Step1 key="s1" data={data} onChange={update} errors={errors} />}
                  {step === 1 && <Step2 key="s2" data={data} onChange={update} errors={errors} />}
                  {step === 2 && <Step3 key="s3" data={data} onChange={update} errors={errors} />}
                </AnimatePresence>

                <AnimatePresence>
                  {submitError && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-6 p-4 rounded-xl bg-red-50 border border-red-100"
                      role="alert"
                    >
                      <p className="text-[13px] font-medium text-red-700 mb-1">
                        Ihre Anfrage konnte gerade nicht übertragen werden.
                      </p>
                      <p className="text-[12px] text-red-600/80 leading-relaxed mb-2.5">
                        Ihre Eingaben sind gespeichert — nichts geht verloren. Bitte versuchen Sie es
                        noch einmal oder schreiben Sie uns direkt.
                      </p>
                      <a
                        href="mailto:info@cogniiq.de?subject=Analysegespräch%20anfragen"
                        className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-red-700 hover:text-red-900 transition-colors"
                      >
                        <Mail size={12} />
                        info@cogniiq.de
                      </a>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                  <div>
                    {step > 0 && (
                      <button
                        type="button"
                        onClick={handleBack}
                        className="flex items-center gap-2 text-[13px] text-gray-400 hover:text-gray-700 transition-colors"
                      >
                        <ArrowLeft size={13} />
                        Zurück
                      </button>
                    )}
                  </div>

                  {step < STEPS.length - 1 ? (
                    <motion.button
                      type="submit"
                      className="flex items-center gap-2.5 text-white"
                      style={{
                        background: '#111827',
                        fontSize: '13.5px',
                        fontWeight: 600,
                        letterSpacing: '0.01em',
                        borderRadius: '8px',
                        minHeight: '46px',
                        padding: '0 22px',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.975 }}
                    >
                      Weiter
                      <ArrowRight size={14} />
                    </motion.button>
                  ) : (
                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center gap-2.5 text-white"
                      style={{
                        background: '#111827',
                        fontSize: '13.5px',
                        fontWeight: 600,
                        letterSpacing: '0.01em',
                        borderRadius: '8px',
                        minHeight: '46px',
                        padding: '0 22px',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
                        opacity: isSubmitting ? 0.65 : 1,
                        cursor: isSubmitting ? 'wait' : 'pointer',
                        border: 'none',
                        transition: 'opacity 0.2s',
                      }}
                      whileHover={{ scale: isSubmitting ? 1 : 1.015 }}
                      whileTap={{ scale: 0.975 }}
                    >
                      {isSubmitting ? (
                        <span>Wird gesendet …</span>
                      ) : (
                        <>
                          <span>{submitError ? 'Erneut senden' : 'Anfrage absenden'}</span>
                          <ArrowRight size={14} />
                        </>
                      )}
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

function FormLabel({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <Label
      className="block text-gray-700 mb-1.5"
      style={{ fontSize: '12.5px', fontWeight: 500, letterSpacing: '0.01em' }}
    >
      {children}
      {optional && (
        <span className="text-gray-400 ml-1.5 font-normal" style={{ fontSize: '11px' }}>
          optional
        </span>
      )}
    </Label>
  );
}
