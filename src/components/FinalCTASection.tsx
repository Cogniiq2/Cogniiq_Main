import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Shield, Clock, Star, CircleCheck as CheckCircle, Quote, TrendingUp, PhoneCall, Zap } from 'lucide-react';
import { useAvailability } from '@/hooks/useAvailability';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const guarantees = [
  { icon: Shield, text: 'Keine Verpflichtung — kündbar jederzeit' },
  { icon: Clock, text: 'Antwort innerhalb 24h garantiert' },
  { icon: Calendar, text: 'Persönliches Gespräch — kein Formular-Loop' },
];

const outcomes = [
  'Wir analysieren Ihre konkreten Verlustquellen',
  'Sie sehen, wo Automatisierung sofort wirkt',
  'Sie erhalten ein realistisches Konzept — kein Pitch',
];

const TESTIMONIAL = {
  quote: 'In der ersten Woche nach dem Go-Live haben wir 11 Terminbuchungen über den KI-Assistenten erhalten — ohne einen einzigen Anruf selbst annehmen zu müssen.',
  name: 'Dr. Michael K.',
  role: 'Allgemeinarzt, München',
  result: '+11 Buchungen Woche 1',
  initials: 'MK',
  color: '#0ea5e9',
};

const microResults = [
  { icon: PhoneCall, stat: '+28%', label: 'mehr Terminbuchungen' },
  { icon: TrendingUp, stat: '3×', label: 'mehr qualifizierte Leads' },
  { icon: Zap, stat: '< 14d', label: 'bis Go-Live' },
];

export function FinalCTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const { label: availLabel } = useAvailability();

  return (
    <section
      ref={ref}
      aria-labelledby="final-cta-heading"
      className="py-32 bg-white border-t border-gray-100 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1fr_440px] gap-16 lg:gap-20 items-start">

          {/* ─── Left: Copy + proof ─── */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.75, ease: EASE }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400 mb-5">
              Der erste Schritt
            </p>

            <h2
              id="final-cta-heading"
              className="text-4xl lg:text-[3.4rem] font-bold text-gray-900 leading-[1.04] tracking-[-0.024em] mb-6"
            >
              30 Minuten, die zeigen,
              <br />
              <span className="text-gray-200">was bei Ihnen möglich ist.</span>
            </h2>

            <p className="text-[16px] text-gray-500 leading-[1.75] mb-8 max-w-lg">
              Kein Pitch. Kein Standardangebot. Wir schauen uns Ihre konkrete Situation an und
              zeigen, wo Automatisierung sofort wirkt — und was das{' '}
              <Link
                to="/leistungen"
                className="font-medium text-gray-700 hover:text-gray-900 transition-colors underline underline-offset-2 decoration-gray-200"
              >
                realistisch bringt
              </Link>
              .
            </p>

            {/* Outcomes */}
            <div className="space-y-2.5 mb-10">
              {outcomes.map((o) => (
                <div key={o} className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle size={9} className="text-emerald-600" />
                  </div>
                  <span className="text-[14.5px] text-gray-600 leading-relaxed">{o}</span>
                </div>
              ))}
            </div>

            {/* Micro results strip */}
            <div className="flex items-stretch gap-0 mb-10 border border-gray-100 rounded-2xl overflow-hidden">
              {microResults.map(({ icon: Icon, stat, label }, i) => (
                <div
                  key={stat}
                  className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-5 px-4 ${i > 0 ? 'border-l border-gray-100' : ''}`}
                >
                  <Icon size={12} className="text-gray-300" />
                  <span className="text-[22px] font-bold text-gray-900 tabular-nums tracking-tight leading-none">{stat}</span>
                  <span className="text-[11px] text-gray-400 text-center leading-tight">{label}</span>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <motion.div
              className="relative bg-gray-50 border border-gray-100 rounded-2xl p-6 mb-8"
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.65, delay: 0.2, ease: EASE }}
            >
              <Quote size={18} className="text-gray-200 mb-4" />
              <p className="text-[14px] text-gray-700 leading-[1.72] mb-4 italic">
                "{TESTIMONIAL.quote}"
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold border-2"
                    style={{ background: TESTIMONIAL.color + '18', borderColor: TESTIMONIAL.color + '40', color: TESTIMONIAL.color }}
                  >
                    {TESTIMONIAL.initials}
                  </div>
                  <div>
                    <p className="text-[12.5px] font-semibold text-gray-900">{TESTIMONIAL.name}</p>
                    <p className="text-[11px] text-gray-400">{TESTIMONIAL.role}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={10} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-[10.5px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    {TESTIMONIAL.result}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Social proof footer */}
            <div className="flex items-center gap-3 pt-6 border-t border-gray-100">
              <div className="flex -space-x-2">
                {['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#64748b'].map((c, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold"
                    style={{ background: `${c}20`, borderColor: c + '50', color: c }}
                  >
                    {['MK', 'SR', 'TH', 'AB', 'LP'][i]}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-0.5 mb-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={10} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-[11.5px] text-gray-400">
                  <span className="font-semibold text-gray-700">40+</span> Unternehmen vertrauen auf Cogniiq-Systeme
                </p>
              </div>
            </div>
          </motion.div>

          {/* ─── Right: CTA card ─── */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.75, delay: 0.14, ease: EASE }}
            className="lg:sticky lg:top-28"
          >
            <div className="bg-gray-950 rounded-2xl overflow-hidden relative">
              {/* Ambient glow */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at 65% 15%, rgba(2,132,199,0.10) 0%, transparent 55%), radial-gradient(ellipse at 20% 85%, rgba(16,185,129,0.06) 0%, transparent 50%)',
                }}
              />
              {/* Top accent line */}
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(2,132,199,0.4), rgba(16,185,129,0.2), transparent)' }}
              />

              <div className="relative p-10">
                {/* Header */}
                <div className="flex items-center gap-2 mb-6">
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                  />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-500">
                    Kostenloses Erstgespräch
                  </span>
                  <span className="ml-auto text-[10px] font-semibold text-amber-400/80 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                    {availLabel}
                  </span>
                </div>

                <h3 className="text-[24px] font-bold text-white leading-tight tracking-tight mb-2">
                  Gespräch vereinbaren
                </h3>
                <p className="text-[13px] text-gray-500 mb-8 leading-relaxed">
                  30 Min · keine Vorbereitung nötig · kein Sales-Pitch
                </p>

                {/* Primary CTA */}
                <Link
                  to="/kontakt"
                  className="group w-full flex items-center justify-between gap-3 bg-white text-gray-900 font-semibold text-[14px] px-6 py-4 rounded-xl hover:bg-gray-50 transition-all mb-3"
                  style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
                >
                  <div className="flex items-center gap-2.5">
                    <Calendar size={14} className="text-gray-500" />
                    Jetzt Gespräch buchen
                  </div>
                  <ArrowRight size={14} className="text-gray-400 transition-transform group-hover:translate-x-1" />
                </Link>

                {/* Secondary CTA */}
                <Link
                  to="/leistungen"
                  className="group w-full flex items-center justify-between gap-3 bg-white/[0.04] border border-white/[0.07] text-gray-400 font-medium text-[13px] px-6 py-3.5 rounded-xl hover:bg-white/[0.07] hover:text-gray-200 transition-all mb-8"
                >
                  Leistungen & Preise ansehen
                  <ArrowRight size={13} className="text-gray-600 transition-transform group-hover:translate-x-1 group-hover:text-gray-400" />
                </Link>

                {/* Divider */}
                <div className="w-full h-px bg-white/[0.05] mb-6" />

                {/* Guarantees */}
                <div className="space-y-3.5 mb-8">
                  {guarantees.map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center flex-shrink-0">
                        <Icon size={9} className="text-emerald-400" />
                      </div>
                      <span className="text-[12px] text-gray-500">{text}</span>
                    </div>
                  ))}
                </div>

                {/* Money-back guarantee */}
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-4 text-center">
                  <p className="text-[11.5px] text-gray-600 leading-relaxed">
                    Go-Live in 14 Tagen —{' '}
                    <span className="text-gray-400 font-medium">oder volle Rückerstattung.</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Below card: quick contact note */}
            <div className="mt-4 flex items-center justify-center gap-2 text-[11.5px] text-gray-400">
              <div className="w-1 h-1 rounded-full bg-emerald-500" />
              Durchschnittliche Antwortzeit: unter 2 Stunden
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
