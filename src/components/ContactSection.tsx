import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useRef, useState } from 'react';
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
import { ArrowRight, CircleCheck as CheckCircle, Sparkles } from 'lucide-react';
import { PremiumCalendar } from './PremiumCalendar';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const INTEREST_OPTIONS = [
  { id: 'Webdesign', label: 'Webdesign', desc: 'Neue Website oder Relaunch' },
  { id: 'Automationen', label: 'Automationen', desc: 'Prozesse automatisieren' },
  { id: 'KI Telefonassistent', label: 'KI Telefonassistent', desc: 'Anrufe automatisch bearbeiten' },
  { id: 'KI Content Creation', label: 'KI Content', desc: 'Content automatisch erstellen' },
];

const FIELD_META = [
  { id: 'name', label: 'Name', type: 'text', placeholder: 'Max Mustermann', required: true },
  { id: 'email', label: 'E-Mail', type: 'email', placeholder: 'max@unternehmen.de', required: true },
  { id: 'company', label: 'Unternehmen', type: 'text', placeholder: 'Unternehmensname', required: true },
];

const steps = [
  { n: '01', label: 'Eingangsbestätigung', sub: 'Automatisch · sofort' },
  { n: '02', label: 'Systemanalyse', sub: 'Innerhalb 24 h' },
  { n: '03', label: 'Analysegespräch', sub: '45 Min. · Video' },
  { n: '04', label: 'Systemkonzept', sub: 'Maßgeschneidert' },
];

export function ContactSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.08 });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [selectedDateTime, setSelectedDateTime] = useState('');
  const [industryValue, setIndustryValue] = useState('');
  const [timelineValue, setTimelineValue] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      name: (document.getElementById('name') as HTMLInputElement).value,
      email: (document.getElementById('email') as HTMLInputElement).value,
      company: (document.getElementById('company') as HTMLInputElement).value,
      industry: industryValue,
      interests,
      timeline: timelineValue,
      goal: (document.getElementById('goal') as HTMLTextAreaElement).value,
      preferredTime: selectedDateTime || 'Keine Angabe',
    };

    try {
      await fetch('https://n8n.cogniiq.co/webhook/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleInterest = (v: string) =>
    setInterests((prev) => (prev.includes(v) ? prev.filter((i) => i !== v) : [...prev, v]));

  if (isSubmitted) {
    return (
      <section id="kontakt" className="relative py-32 bg-white overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(16,185,129,0.04) 0%, transparent 70%)' }}
        />
        <div className="max-w-xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 mb-8 rounded-2xl bg-emerald-50 border border-emerald-100"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
            >
              <CheckCircle size={24} className="text-emerald-600" />
            </motion.div>
            <h3 className="text-[28px] font-bold text-gray-900 mb-3 tracking-tight">
              Anfrage eingegangen.
            </h3>
            <p className="text-gray-500 text-[15px] leading-[1.75] mb-8">
              Wir melden uns innerhalb von <span className="font-medium text-gray-700">24–48 Stunden</span> für Ihr persönliches Analysegespräch.
            </p>
            <button
              onClick={() => setIsSubmitted(false)}
              className="inline-flex items-center gap-2 text-[13px] text-gray-400 hover:text-gray-700 transition-colors"
            >
              Weitere Anfrage senden
              <ArrowRight size={13} />
            </button>
          </motion.div>
        </div>
      </section>
    );
  }

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

        {/* Header */}
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
            {/* Process steps */}
            <div>
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.2em] text-gray-400 mb-5">
                Nach Ihrer Anfrage
              </p>
              <div className="flex flex-col">
                {steps.map((step, i) => (
                  <div
                    key={step.n}
                    className="flex items-start gap-4 py-4 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
                      <span
                        className="text-gray-300 tabular-nums font-medium"
                        style={{ fontSize: '11px', letterSpacing: '0.04em', minWidth: '22px' }}
                      >
                        {step.n}
                      </span>
                      {i < steps.length - 1 && (
                        <div className="w-px h-4 bg-gray-100" />
                      )}
                    </div>
                    <div>
                      <p className="text-[13.5px] font-medium text-gray-800 leading-snug">
                        {step.label}
                      </p>
                      <p className="text-[11.5px] text-gray-400 mt-0.5">{step.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* For whom note */}
            <div className="border border-gray-100 rounded-xl p-5 bg-gray-50/60">
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-gray-400 mb-3">
                Für wen
              </p>
              <p className="text-[13px] text-gray-500 leading-[1.68]">
                Unternehmen in Deutschland, die operative Prozesse systematisch automatisieren
                wollen — keine Experimente, keine Demos.
              </p>
            </div>

            {/* Response guarantee */}
            <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <CheckCircle size={13} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-emerald-700 leading-relaxed">
                Antwort garantiert innerhalb von{' '}
                <span className="font-semibold">24–48 Stunden</span>
              </p>
            </div>
          </motion.div>

          {/* ─── Right: Form ─── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.16, ease: EASE }}
            className="lg:col-span-8"
          >
            <form onSubmit={handleSubmit} className="flex flex-col gap-7">

              {/* Name / Email / Company */}
              <div className="grid md:grid-cols-2 gap-5">
                {FIELD_META.map((f) => (
                  <div key={f.id} className={f.id === 'company' ? 'md:col-span-2' : ''}>
                    <FormLabel>{f.label}</FormLabel>
                    <Input
                      id={f.id}
                      type={f.type}
                      required={f.required}
                      placeholder={f.placeholder}
                      className="h-11 bg-white border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-300 focus:border-gray-400 focus-visible:ring-0 transition-colors"
                    />
                  </div>
                ))}
              </div>

              {/* Industry / Timeline */}
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <FormLabel>Branche</FormLabel>
                  <Select required onValueChange={setIndustryValue}>
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
                  <FormLabel>Startzeitraum</FormLabel>
                  <Select required onValueChange={setTimelineValue}>
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

              {/* Interests */}
              <div>
                <FormLabel>Interessensfelder</FormLabel>
                <div className="grid grid-cols-2 gap-2.5 mt-1">
                  {INTEREST_OPTIONS.map((opt) => {
                    const active = interests.includes(opt.id);
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

              {/* Goal */}
              <div>
                <FormLabel>Ziel und Ausgangssituation</FormLabel>
                <Textarea
                  id="goal"
                  required
                  rows={4}
                  placeholder="Beschreiben Sie Ihre aktuelle Situation und was Sie verändern möchten …"
                  className="bg-white border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-300 focus:border-gray-400 focus-visible:ring-0 resize-none transition-colors leading-relaxed"
                />
              </div>

              {/* Calendar */}
              <div>
                <FormLabel optional>Bevorzugter Gesprächstermin</FormLabel>
                <div className="mt-1">
                  <PremiumCalendar
                    onSelect={setSelectedDateTime}
                    selectedDateTime={selectedDateTime}
                  />
                </div>
              </div>

              <div className="w-full h-px bg-gray-100" />

              {/* Submit row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                <p className="text-[11.5px] text-gray-400 leading-relaxed max-w-[32ch]">
                  Ihre Daten werden vertraulich behandelt und nicht weitergegeben.
                </p>
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-shrink-0 flex items-center gap-2.5 text-white"
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
                    transition: 'opacity 0.2s, transform 0.15s',
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
              </div>

            </form>
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
