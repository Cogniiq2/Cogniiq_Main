import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar } from 'lucide-react';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function FinalCTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section
      ref={ref}
      aria-labelledby="final-cta-heading"
      className="py-28 bg-white dark:bg-gray-950"
    >
      <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500 mb-5">
            Bereit?
          </p>

          <h2
            id="final-cta-heading"
            className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 leading-[1.06] tracking-tight mb-6"
          >
            Wachstum fängt mit
            <br />
            <span className="text-gray-400 dark:text-gray-600">einem Gespräch an.</span>
          </h2>

          <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed mb-10 max-w-xl mx-auto">
            Kostenloses Erstgespräch – 30 Minuten. Kein Pitch, keine Verpflichtung.{' '}
            <Link
              to="/leistungen"
              className="font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors underline underline-offset-2 decoration-gray-300 dark:decoration-gray-600"
            >
              Alle Leistungen ansehen
            </Link>{' '}
            oder direkt starten.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/kontakt"
              className="inline-flex items-center gap-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-semibold text-sm rounded-xl h-12 px-7 hover:bg-gray-700 dark:hover:bg-white transition-colors group"
            >
              <Calendar size={15} />
              Kostenloses Erstgespräch
              <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link
              to="/leistungen"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 px-7 h-12 rounded-xl"
            >
              Leistungen ansehen
              <ArrowRight size={13} />
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-5 text-xs text-gray-400 dark:text-gray-600"
          >
            Keine Verpflichtung · Antwort innerhalb von 24h · Remote in ganz Deutschland
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
