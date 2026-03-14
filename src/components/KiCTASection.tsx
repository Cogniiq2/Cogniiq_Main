import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { PhoneCall, ArrowRight, CircleCheck as CheckCircle2 } from 'lucide-react';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const trust = [
  'DSGVO-konform & Made in Germany',
  'Einrichtung in wenigen Tagen',
  'Integration mit Kalender & CRM',
  'Kein Ausfall, kein Urlaub – 24/7',
];

export function KiCTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.25 });

  return (
    <section
      ref={ref}
      aria-labelledby="ki-cta-heading"
      className="py-16 bg-white border-t border-gray-100"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: EASE }}
          className="bg-gray-950 rounded-2xl overflow-hidden"
        >
          <div className="grid lg:grid-cols-[1fr_auto] gap-12 items-center px-10 py-12 lg:px-14 lg:py-14">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
                  <PhoneCall size={16} className="text-white/50" />
                </div>
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-gray-500">
                  KI Telefonassistent
                </span>
              </div>

              <h2
                id="ki-cta-heading"
                className="text-3xl lg:text-4xl font-bold text-white leading-[1.1] tracking-tight mb-5 max-w-xl"
              >
                Ihr Telefon arbeitet.
                <br />
                <span className="text-gray-600">Auch wenn Sie es nicht tun.</span>
              </h2>

              <p className="text-base text-gray-400 leading-relaxed max-w-lg mb-8">
                Verpasste Anrufe kosten Umsatz. Unser KI-Telefonassistent nimmt jeden Anruf entgegen, bucht Termine und beantwortet Fragen –{' '}
                <Link
                  to="/ki-telefonassistent"
                  className="font-medium text-gray-300 hover:text-white transition-colors underline underline-offset-2 decoration-gray-600"
                >
                  vollautomatisch, rund um die Uhr
                </Link>
                .
              </p>

              <div className="grid sm:grid-cols-2 gap-2.5 max-w-lg">
                {trust.map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <CheckCircle2 size={14} className="text-gray-500 flex-shrink-0" />
                    <span className="text-sm text-gray-400">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
              className="flex flex-col gap-4 lg:min-w-[220px]"
            >
              <Link
                to="/ki-telefonassistent"
                className="inline-flex items-center justify-center gap-2.5 bg-white text-gray-900 font-semibold text-sm rounded-xl h-12 px-6 hover:bg-gray-100 transition-colors group"
              >
                Demo ansehen
                <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <Link
                to="/kontakt"
                className="inline-flex items-center justify-center gap-2.5 bg-white/5 border border-white/10 text-white font-semibold text-sm rounded-xl h-12 px-6 hover:bg-white/10 transition-colors"
              >
                Kostenloses Gespräch
              </Link>
              <p className="text-[11px] text-gray-600 text-center">
                Kostenlos & unverbindlich – in 30 Min.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
