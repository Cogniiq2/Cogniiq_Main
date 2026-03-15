import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { PhoneCall, ArrowRight, CircleCheck as CheckCircle2, PhoneMissed } from 'lucide-react';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const facts = [
  { stat: '30%', label: 'aller Anrufe gehen unbeantwortet' },
  { stat: '67%', label: 'rufen danach nicht zurück' },
  { stat: '< 3s', label: 'Reaktionszeit des KI-Assistenten' },
];

const trust = [
  'Einrichtung in unter 14 Tagen',
  'Integration mit Kalender & CRM',
  'DSGVO-konform & Made in Germany',
  'Kein Ausfall, kein Urlaub – 24/7',
];

export function KiCTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section
      ref={ref}
      aria-labelledby="ki-cta-heading"
      className="py-20 bg-white border-t border-gray-100"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: EASE }}
          className="bg-gray-950 rounded-2xl overflow-hidden"
        >
          <div className="grid lg:grid-cols-[1fr_320px] gap-0">
            <div className="px-10 py-12 lg:px-14 lg:py-14">
              <div className="flex items-center gap-3 mb-7">
                <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
                  <PhoneCall size={15} className="text-white/40" />
                </div>
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-gray-500">
                  KI Telefonassistent
                </span>
              </div>

              <h2
                id="ki-cta-heading"
                className="text-3xl lg:text-[2.1rem] font-bold text-white leading-[1.1] tracking-tight mb-5 max-w-lg"
              >
                Jeder Anruf beantwortet.
                <br />
                <span className="text-gray-500">Jeder Termin gebucht. Automatisch.</span>
              </h2>

              <p className="text-[14.5px] text-gray-400 leading-relaxed max-w-lg mb-8">
                Die meisten Unternehmen verlieren täglich Kunden an das Besetztzeichen. Unser
                KI-Telefonassistent übernimmt jeden Anruf, bucht Termine direkt im Kalender
                und beantwortet Fragen –{' '}
                <Link
                  to="/ki-telefonassistent"
                  className="font-medium text-gray-300 hover:text-white transition-colors underline underline-offset-2 decoration-gray-700"
                >
                  vollautomatisch, in natürlicher Sprache
                </Link>
                .
              </p>

              <div className="grid sm:grid-cols-2 gap-2.5 mb-8 max-w-lg">
                {trust.map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <CheckCircle2 size={13} className="text-gray-600 flex-shrink-0" />
                    <span className="text-[13px] text-gray-400">{item}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/ki-telefonassistent"
                  className="group inline-flex items-center justify-center gap-2.5 bg-white text-gray-900 font-semibold text-[13px] rounded-xl h-11 px-6 hover:bg-gray-100 transition-colors"
                >
                  Demo ansehen
                  <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/kontakt"
                  className="inline-flex items-center justify-center gap-2.5 bg-white/[0.05] border border-white/[0.09] text-white font-semibold text-[13px] rounded-xl h-11 px-6 hover:bg-white/[0.09] transition-colors"
                >
                  Kostenloses Gespräch
                </Link>
              </div>
              <p className="text-[11px] text-gray-700 mt-3">
                Kostenlos & unverbindlich – in 30 Min.
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
              className="hidden lg:flex flex-col justify-center px-10 py-12 bg-white/[0.025] border-l border-white/[0.05]"
            >
              <div className="flex items-center gap-2 mb-8">
                <PhoneMissed size={13} className="text-gray-600" />
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-gray-600">
                  Branchen-Realität
                </span>
              </div>
              <div className="space-y-7">
                {facts.map((fact, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 12 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.25 + i * 0.1, ease: EASE }}
                  >
                    <p className="text-[28px] font-bold text-white/90 tabular-nums leading-none mb-1.5">
                      {fact.stat}
                    </p>
                    <p className="text-[12px] text-gray-500 leading-snug">{fact.label}</p>
                    {i < facts.length - 1 && (
                      <div className="mt-7 w-8 h-px bg-white/[0.06]" />
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
