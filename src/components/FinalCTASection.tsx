import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Shield, Clock, Star, CircleCheck as CheckCircle } from 'lucide-react';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const guarantees = [
  { icon: Shield, text: 'Keine Verpflichtung' },
  { icon: Clock, text: 'Antwort innerhalb 24h' },
  { icon: Calendar, text: 'Persönliches Gespräch' },
];

const outcomes = [
  'Wir analysieren Ihre konkreten Verlustquellen',
  'Sie sehen, wo Automatisierung sofort wirkt',
  'Sie bekommen eine realistische Einschätzung — kein Pitch',
];

export function FinalCTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.25 });

  return (
    <section
      ref={ref}
      aria-labelledby="final-cta-heading"
      className="py-32 bg-white"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1fr_400px] gap-16 lg:gap-24 items-center">

          {/* Left: Copy */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-gray-400 mb-6">
              Der erste Schritt
            </p>

            <h2
              id="final-cta-heading"
              className="text-4xl lg:text-[3.2rem] font-bold text-gray-900 leading-[1.06] tracking-tight mb-6"
            >
              30 Minuten, die zeigen,
              <br />
              <span className="text-gray-300">was bei Ihnen möglich ist.</span>
            </h2>

            <p className="text-[16px] text-gray-500 leading-relaxed mb-8 max-w-lg">
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

            <div className="space-y-2.5 mb-10">
              {outcomes.map((o) => (
                <div key={o} className="flex items-start gap-2.5">
                  <CheckCircle size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-[14px] text-gray-600">{o}</span>
                </div>
              ))}
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-3 pt-6 border-t border-gray-100">
              <div className="flex -space-x-2">
                {['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'].map((c, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center"
                    style={{ background: `${c}20`, borderColor: c + '50' }}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ background: c }} />
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-0.5 mb-0.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={10} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-[11.5px] text-gray-400">
                  40+ Unternehmen vertrauen auf Cogniiq-Systeme
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right: CTA card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.12, ease: EASE }}
          >
            <div className="bg-gray-950 rounded-2xl p-10 relative overflow-hidden">
              {/* Background shimmer */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at 60% 20%, rgba(2,132,199,0.08) 0%, transparent 60%)',
                }}
              />

              <div className="relative">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-gray-500 mb-4">
                  Kostenloses Erstgespräch
                </p>

                <h3 className="text-[22px] font-bold text-white leading-snug tracking-tight mb-2">
                  Gespräch vereinbaren
                </h3>
                <p className="text-[13px] text-gray-500 mb-8 leading-relaxed">
                  30 Min. · keine Vorbereitung nötig · kein Sales-Pitch
                </p>

                <Link
                  to="/kontakt"
                  className="group w-full flex items-center justify-between gap-3 bg-white text-gray-900 font-semibold text-[14px] px-6 py-4 rounded-xl hover:bg-gray-100 transition-colors mb-4"
                >
                  <div className="flex items-center gap-2.5">
                    <Calendar size={15} className="text-gray-500" />
                    Jetzt Gespräch buchen
                  </div>
                  <ArrowRight size={14} className="text-gray-400 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  to="/leistungen"
                  className="group w-full flex items-center justify-between gap-3 bg-white/[0.04] border border-white/[0.07] text-gray-300 font-medium text-[13.5px] px-6 py-3.5 rounded-xl hover:bg-white/[0.07] transition-colors mb-8"
                >
                  Leistungen & Preise ansehen
                  <ArrowRight size={13} className="text-gray-600 transition-transform group-hover:translate-x-1" />
                </Link>

                <div className="space-y-2.5">
                  {guarantees.map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2.5">
                      <Icon size={12} className="text-gray-700 flex-shrink-0" />
                      <span className="text-[12px] text-gray-600">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
