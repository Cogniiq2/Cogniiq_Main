import { motion, useInView } from 'framer-motion';
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
import { ArrowRight } from 'lucide-react';
import { PremiumCalendar } from './PremiumCalendar';

const INTEREST_OPTIONS = [
  'Webdesign',
  'Automationen',
  'KI Telefonassistent',
  'KI Content Creation',
];

const FIELD_META = [
  { id: 'name',    label: 'Name',              type: 'text',  placeholder: 'Max Mustermann',        required: true },
  { id: 'email',   label: 'E-Mail',             type: 'email', placeholder: 'max@unternehmen.de',    required: true },
  { id: 'company', label: 'Unternehmen',        type: 'text',  placeholder: 'Unternehmensname',      required: true },
];

export function ContactSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
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
      name:          (document.getElementById('name')    as HTMLInputElement).value,
      email:         (document.getElementById('email')   as HTMLInputElement).value,
      company:       (document.getElementById('company') as HTMLInputElement).value,
      industry:      industryValue,
      interests,
      timeline:      timelineValue,
      goal:          (document.getElementById('goal')    as HTMLTextAreaElement).value,
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
    setInterests(prev => prev.includes(v) ? prev.filter(i => i !== v) : [...prev, v]);

  if (isSubmitted) {
    return (
      <section id="kontakt" className="relative py-32 bg-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(15,23,42,0.04) 0%, transparent 100%)' }} />
        <div className="max-w-2xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 mb-10 border border-gray-200 rounded-2xl">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className="text-3xl font-semibold text-gray-900 mb-4" style={{ letterSpacing: '-0.02em' }}>
              Anfrage eingegangen.
            </h3>
            <p className="text-gray-500 text-lg leading-relaxed mb-10" style={{ fontWeight: 400 }}>
              Wir melden uns innerhalb von 24–48 Stunden für Ihr Analysegespräch.
            </p>
            <button
              onClick={() => setIsSubmitted(false)}
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
              style={{ letterSpacing: '0.01em' }}
            >
              Weitere Anfrage senden
              <ArrowRight size={14} />
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
        style={{ background: 'radial-gradient(ellipse 70% 35% at 50% 0%, rgba(15,23,42,0.04) 0%, transparent 100%)' }}
      />

      <div className="relative max-w-6xl mx-auto px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16 lg:mb-20"
        >
          <p
            className="text-gray-400 uppercase mb-4"
            style={{ fontSize: '10.5px', fontWeight: 500, letterSpacing: '0.20em' }}
          >
            Analysegespräch
          </p>
          <h2
            id="contact-heading"
            className="text-gray-900"
            style={{
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: '-0.022em',
              maxWidth: '18ch',
            }}
          >
            System anfragen.
          </h2>
          <p
            className="text-gray-500 mt-4"
            style={{ fontSize: '15px', fontWeight: 400, lineHeight: 1.65, maxWidth: '44ch' }}
          >
            Schildern Sie Ihre Ausgangssituation. Wir analysieren Ihren Prozessstatus und zeigen, wo operative KI-Systeme den größten Hebel erzeugen.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">

          {/* Left — context panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-4 flex flex-col gap-8"
          >
            {/* What happens after */}
            <div>
              <p
                className="text-gray-400 uppercase mb-5"
                style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.18em' }}
              >
                Nach Ihrer Anfrage
              </p>
              <div className="flex flex-col gap-0">
                {[
                  { n: '01', label: 'Eingangsbestätigung', sub: 'Automatisch · sofort' },
                  { n: '02', label: 'Systemanalyse',       sub: 'Innerhalb 24 h' },
                  { n: '03', label: 'Analysegespräch',     sub: '45 Min. · video' },
                  { n: '04', label: 'Systemkonzept',       sub: 'Maßgeschneidert' },
                ].map((step, i) => (
                  <div
                    key={step.n}
                    className="flex items-start gap-4 py-4 border-b border-gray-100 last:border-0"
                  >
                    <span
                      className="text-gray-300 tabular-nums"
                      style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.05em', paddingTop: '2px', minWidth: '20px' }}
                    >
                      {step.n}
                    </span>
                    <div>
                      <p className="text-gray-900 text-sm font-medium" style={{ lineHeight: 1.3 }}>
                        {step.label}
                      </p>
                      <p className="text-gray-400 mt-0.5" style={{ fontSize: '12px', lineHeight: 1.4 }}>
                        {step.sub}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scope note */}
            <div
              className="border border-gray-100 rounded-xl p-5"
              style={{ background: '#fafafa' }}
            >
              <p
                className="text-gray-400 uppercase mb-3"
                style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.16em' }}
              >
                Für wen
              </p>
              <p className="text-gray-600 text-sm leading-relaxed">
                Unternehmen in Deutschland, die operative Prozesse systematisch automatisieren wollen — keine Experimente, keine Demos.
              </p>
            </div>
          </motion.div>

          {/* Right — form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-8"
          >
            <form onSubmit={handleSubmit} className="flex flex-col gap-7">

              {/* Row: Name / Email / Company */}
              <div className="grid md:grid-cols-2 gap-5">
                {FIELD_META.map(f => (
                  <div key={f.id} className={f.id === 'company' ? 'md:col-span-2' : ''}>
                    <FormLabel>{f.label}</FormLabel>
                    <Input
                      id={f.id}
                      type={f.type}
                      required={f.required}
                      placeholder={f.placeholder}
                      className="h-11 bg-white border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-300 focus:border-gray-400 focus:ring-0 transition-colors"
                    />
                  </div>
                ))}
              </div>

              {/* Row: Industry / Timeline */}
              <div className="grid md:grid-cols-2 gap-5">
                <div id="industry">
                  <FormLabel>Branche</FormLabel>
                  <Select required onValueChange={setIndustryValue}>
                    <SelectTrigger className="h-11 bg-white border-gray-200 rounded-lg text-sm focus:border-gray-400 focus:ring-0 transition-colors">
                      <SelectValue placeholder="Branche wählen" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-xl text-sm">
                      {['Medizin & Kliniken', 'Gastronomie', 'Sport & Fitness', 'Immobilien', 'E-Commerce', 'Sonstiges'].map(v => (
                        <SelectItem key={v} value={v.toLowerCase().replace(/[^a-z]/g, '')} className="py-2.5 cursor-pointer">
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div id="timeline">
                  <FormLabel>Startzeitraum</FormLabel>
                  <Select required onValueChange={setTimelineValue}>
                    <SelectTrigger className="h-11 bg-white border-gray-200 rounded-lg text-sm focus:border-gray-400 focus:ring-0 transition-colors">
                      <SelectValue placeholder="Zeitraum wählen" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-xl text-sm">
                      <SelectItem value="asap"     className="py-2.5 cursor-pointer">So schnell wie möglich</SelectItem>
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
                  {INTEREST_OPTIONS.map(opt => {
                    const active = interests.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleInterest(opt)}
                        className="flex items-center gap-3 px-4 py-3 border rounded-lg text-sm text-left transition-all"
                        style={{
                          borderColor: active ? '#111827' : '#e5e7eb',
                          background: active ? '#111827' : '#ffffff',
                          color: active ? '#ffffff' : '#374151',
                          fontWeight: 400,
                        }}
                      >
                        <span
                          className="flex-shrink-0 w-3.5 h-3.5 border rounded-sm flex items-center justify-center transition-all"
                          style={{
                            borderColor: active ? '#ffffff' : '#d1d5db',
                            background: active ? '#ffffff' : 'transparent',
                          }}
                        >
                          {active && (
                            <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                              <path d="M1 3.5L3.5 6L8 1" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                        {opt}
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
                  className="bg-white border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-300 focus:border-gray-400 focus:ring-0 resize-none transition-colors leading-relaxed"
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

              {/* Divider */}
              <div className="w-full h-px bg-gray-100" />

              {/* Submit */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                <p className="text-gray-400 text-xs leading-relaxed" style={{ maxWidth: '34ch' }}>
                  Ihre Daten werden vertraulich behandelt und nicht weitergegeben.
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-shrink-0 flex items-center gap-2.5 text-white transition-all"
                  style={{
                    background: '#111827',
                    fontSize: '14px',
                    fontWeight: 500,
                    letterSpacing: '0.01em',
                    borderRadius: '8px',
                    minHeight: '46px',
                    padding: '0 22px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
                    opacity: isSubmitting ? 0.6 : 1,
                    cursor: isSubmitting ? 'wait' : 'pointer',
                    border: 'none',
                  }}
                >
                  {isSubmitting ? (
                    <span>Wird gesendet …</span>
                  ) : (
                    <>
                      <span>Anfrage absenden</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
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
