import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useRef, useState } from 'react';
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
  Sparkles,
  ShieldCheck,
  Lock,
  Server,
  BadgeCheck,
} from 'lucide-react';
import { PremiumCalendar } from './PremiumCalendar';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const INTEREST_OPTIONS = [
  { id: 'Webdesign', label: 'Webdesign', desc: 'Neue Website oder Relaunch' },
  { id: 'Automationen', label: 'Automationen', desc: 'Prozesse automatisieren' },
  { id: 'KI Telefonassistent', label: 'KI Telefonassistent', desc: 'Anrufe automatisch bearbeiten' },
  { id: 'KI Content Creation', label: 'KI Content', desc: 'Content automatisch erstellen' },
];

const STEPS = [
  { label: 'Kontaktdaten', short: 'Kontakt' },
  { label: 'Ihr Vorhaben', short: 'Vorhaben' },
  { label: 'Wunschtermin', short: 'Termin' },
];

const afterSteps = [
  { n: '01', label: 'Eingangsbestätigung', sub: 'Automatisch · sofort' },
  { n: '02', label: 'Systemanalyse', sub: 'Innerhalb 24 h' },
  { n: '03', label: 'Analysegespräch', sub: '45 Min. · Video' },
  { n: '04', label: 'Systemkonzept', sub: 'Maßgeschneidert' },
];

const DSGVO_BADGES = [
  { icon: Lock, label: 'DSGVO-konform' },
  { icon: Server, label: 'Deutsche Server' },
  { icon: ShieldCheck, label: 'SSL-verschlüsselt' },
  { icon: BadgeCheck, label: 'Keine Weitergabe' },
];

interface FormData {
  name: string;
  email: string;
  company: string;
  industry: string;
  timeline: string;
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
  interests: [],
  goal: '',
  preferredTime: '',
};

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
                background: i < step ? '#111827' : i === step ? '#111827' : '#ffffff',
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

function Step1({ data, onChange }: { data: FormData; onChange: (d: Partial<FormData>) => void }) {
  return (
    <motion.div
      key="step1"
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
            required
            placeholder="Max Mustermann"
            className="h-11 bg-white border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-300 focus:border-gray-400 focus-visible:ring-0 transition-colors"
          />
        </div>
        <div>
          <FormLabel>E-Mail *</FormLabel>
          <Input
            type="email"
            value={data.email}
            onChange={e => onChange({ email: e.target.value })}
            required
            placeholder="max@unternehmen.de"
            className="h-11 bg-white border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-300 focus:border-gray-400 focus-visible:ring-0 transition-colors"
          />
        </div>
      </div>
      <div>
        <FormLabel>Unternehmen *</FormLabel>
        <Input
          value={data.company}
          onChange={e => onChange({ company: e.target.value })}
          required
          placeholder="Unternehmensname"
          className="h-11 bg-white border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-300 focus:border-gray-400 focus-visible:ring-0 transition-colors"
        />
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <FormLabel>Branche *</FormLabel>
          <Select value={data.industry} onValueChange={v => onChange({ industry: v })} required>
            <SelectTrigger className="h-11 bg-white border-gray-200 rounded-lg text-sm focus:border-gray-400 focus:ring-0 transition-colors">
              <SelectValue placeholder="Branche wählen" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-xl text-sm">
              {['Medizin & Kliniken', 'Gastronomie', 'Sport & Fitness', 'Immobilien', 'E-Commerce', 'Sonstiges'].map((v) => (
                <SelectItem key={v} value={v.toLowerCase().replace(/[^a-z]/g, '')} className="py-2.5 cursor-pointer">
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <FormLabel>Startzeitraum *</FormLabel>
          <Select value={data.timeline} onValueChange={v => onChange({ timeline: v })} required>
            <SelectTrigger className="h-11 bg-white border-gray-200 rounded-lg text-sm focus:border-gray-400 focus:ring-0 transition-colors">
              <SelectValue placeholder="Zeitraum wählen" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-xl text-sm">
              <SelectItem value="asap" className="py-2.5 cursor-pointer">So schnell wie möglich</SelectItem>
              <SelectItem value="1-2months" className="py-2.5 cursor-pointer">In 1–2 Monaten</SelectItem>
              <SelectItem value="3+months" className="py-2.5 cursor-pointer">In 3+ Monaten</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </motion.div>
  );
}

function Step2({ data, onChange }: { data: FormData; onChange: (d: Partial<FormData>) => void }) {
  const toggleInterest = (v: string) =>
    onChange({
      interests: data.interests.includes(v)
        ? data.interests.filter(i => i !== v)
        : [...data.interests, v],
    });

  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="flex flex-col gap-6"
    >
      <div>
        <FormLabel>Interessensfelder</FormLabel>
        <div className="grid grid-cols-2 gap-2.5 mt-1">
          {INTEREST_OPTIONS.map((opt) => {
            const active = data.interests.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggleInterest(opt.id)}
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
      </div>

      <div>
        <FormLabel>Ziel und Ausgangssituation *</FormLabel>
        <Textarea
          value={data.goal}
          onChange={e => onChange({ goal: e.target.value })}
          required
          rows={4}
          placeholder="Beschreiben Sie Ihre aktuelle Situation und was Sie verändern möchten …"
          className="bg-white border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-300 focus:border-gray-400 focus-visible:ring-0 resize-none transition-colors leading-relaxed"
        />
      </div>
    </motion.div>
  );
}

function Step3({ data, onChange }: { data: FormData; onChange: (d: Partial<FormData>) => void }) {
  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="flex flex-col gap-5"
    >
      <div>
        <FormLabel optional>Bevorzugter Gesprächstermin</FormLabel>
        <p className="text-[12px] text-gray-400 mb-3 leading-relaxed">
          Wählen Sie optional einen Wunschtermin. Wir bestätigen Ihnen den Termin innerhalb von 24 h.
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
        <div className="grid grid-cols-2 gap-2 text-[12.5px]">
          {[
            { label: 'Name', value: data.name },
            { label: 'E-Mail', value: data.email },
            { label: 'Unternehmen', value: data.company },
            { label: 'Branche', value: data.industry },
            { label: 'Start', value: data.timeline === 'asap' ? 'So schnell wie möglich' : data.timeline === '1-2months' ? '1–2 Monate' : '3+ Monate' },
            { label: 'Services', value: data.interests.join(', ') || '—' },
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
  const [data, setData] = useState<FormData>(EMPTY);

  const update = (partial: Partial<FormData>) => setData(d => ({ ...d, ...partial }));

  const canAdvance = () => {
    if (step === 0) return data.name && data.email && data.company && data.industry && data.timeline;
    if (step === 1) return !!data.goal;
    return true;
  };

  const handleNext = () => {
    if (!canAdvance()) return;
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => setStep(s => Math.max(s - 1, 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < STEPS.length - 1) {
      handleNext();
      return;
    }
    setIsSubmitting(true);
    try {
      await fetch('https://n8n.cogniiq.co/webhook/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, source: 'kontakt-page' }),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
      navigate('/anfrage-erhalten');
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
            System anfragen.
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
                Antwort garantiert innerhalb von{' '}
                <span className="font-semibold">24–48 Stunden</span>
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
              className="rounded-2xl border border-gray-100 bg-white p-8"
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

              <form onSubmit={handleSubmit}>
                <AnimatePresence mode="wait">
                  {step === 0 && <Step1 key="s1" data={data} onChange={update} />}
                  {step === 1 && <Step2 key="s2" data={data} onChange={update} />}
                  {step === 2 && <Step3 key="s3" data={data} onChange={update} />}
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
                      type="button"
                      onClick={handleNext}
                      disabled={!canAdvance()}
                      className="flex items-center gap-2.5 text-white"
                      style={{
                        background: canAdvance() ? '#111827' : '#d1d5db',
                        fontSize: '13.5px',
                        fontWeight: 600,
                        letterSpacing: '0.01em',
                        borderRadius: '8px',
                        minHeight: '46px',
                        padding: '0 22px',
                        border: 'none',
                        cursor: canAdvance() ? 'pointer' : 'not-allowed',
                        transition: 'background 0.2s',
                      }}
                      whileHover={canAdvance() ? { scale: 1.015 } : {}}
                      whileTap={canAdvance() ? { scale: 0.975 } : {}}
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
                          <span>Anfrage absenden</span>
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
