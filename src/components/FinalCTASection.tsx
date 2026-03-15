import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Shield, Clock, Users } from 'lucide-react';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const reassurances = [
  { icon: Shield, text: 'Keine Verpflichtung' },
  { icon: Clock, text: 'Antwort innerhalb von 24h' },
  { icon: Users, text: 'Persönliches Gespräch, kein Sales-Pitch' },
];

export function FinalCTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section
      ref={ref}
      aria-labelledby="final-cta-heading"
      className="py-32 bg-white"
    >
      <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
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
            className="text-4xl lg:text-[3.4rem] font-bold text-gray-900 leading-[1.06] tracking-tight mb-6"
          >
            30 Minuten, die zeigen,
            <br />
            <span className="text-gray-300">was bei Ihnen möglich ist.</span>
          </h2>

          <p className="text-[16px] text-gray-500 leading-relaxed mb-10 max-w-lg mx-auto">
            Kein Pitch. Kein Standardangebot. Wir schauen uns Ihre konkrete Situation an und
            zeigen, wo Automatisierung sofort wirkt –{' '}
            <Link
              to="/leistungen"
              className="font-medium text-gray-700 hover:text-gray-900 transition-colors underline underline-offset-2 decoration-gray-300"
            >
              und was das realistisch bringt
            </Link>
            .
          </p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.12, ease: EASE }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8"
          >
            <Link
              to="/kontakt"
              className="group inline-flex items-center gap-2.5 bg-gray-900 text-white font-semibold text-[13.5px] rounded-xl h-12 px-8 hover:bg-gray-700 transition-colors"
            >
              <Calendar size={14} />
              Kostenloses Erstgespräch
              <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link
              to="/leistungen"
              className="group inline-flex items-center gap-2 text-[13.5px] font-semibold text-gray-500 hover:text-gray-900 transition-colors border border-gray-200 hover:border-gray-400 px-8 h-12 rounded-xl"
            >
              Leistungen & Preise ansehen
              <ArrowRight size={12} className="text-gray-400 group-hover:text-gray-700 transition-colors" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            {reassurances.map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-2">
                <Icon size={12} className="text-gray-300" />
                <span className="text-[12px] text-gray-400">{text}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
