import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { PhoneMissed, Globe, Clock, TrendingDown, Zap, LayoutDashboard } from 'lucide-react';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const problems = [
  {
    icon: PhoneMissed,
    title: 'Verpasste Anrufe kosten Umsatz',
    body: 'Jeder Anruf, der ins Leere läuft, ist ein Kunde, der beim nächsten Anbieter landet. Ohne KI-Lösung passiert das täglich.',
  },
  {
    icon: Globe,
    title: 'Website, die keine Anfragen bringt',
    body: 'Eine Website ohne SEO-Architektur, ohne klare Conversion-Führung und ohne Ladezeit-Optimierung generiert kaum Leads.',
  },
  {
    icon: Clock,
    title: 'Manuelle Arbeit frisst Arbeitszeit',
    body: 'Terminverwaltung, E-Mail-Antworten, Rechnungen – alles manuell. Das kostet Stunden pro Woche, die besser investiert wären.',
  },
  {
    icon: TrendingDown,
    title: 'Keine Sichtbarkeit bei lokalen Suchen',
    body: 'Wer nicht auf Seite 1 erscheint, wenn jemand lokal sucht, existiert für neue Kunden schlicht nicht.',
  },
  {
    icon: Zap,
    title: 'Tools, die nicht zusammenarbeiten',
    body: 'CRM, Kalender, Buchhaltung, Buchungssystem – alle isoliert. Daten werden manuell übertragen, Fehler entstehen.',
  },
  {
    icon: LayoutDashboard,
    title: 'Kein Überblick, kein System',
    body: 'Ohne automatisiertes Reporting weiß niemand genau, was läuft, was stockt und wo Umsatz verloren geht.',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: EASE },
  }),
};

export function ProblemSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.08 });

  return (
    <section
      ref={ref}
      className="py-28 bg-gray-950"
      aria-labelledby="problem-heading"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={fadeUp}
          custom={0}
          className="max-w-2xl mb-20"
        >
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-gray-600 mb-5">
            Warum Unternehmen stagnieren
          </p>
          <h2
            id="problem-heading"
            className="text-4xl lg:text-5xl font-bold text-white leading-[1.08] tracking-tight"
          >
            Wachstum blockiert.
            <br />
            <span className="text-gray-600">Täglich.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.04] rounded-2xl overflow-hidden border border-white/[0.05]">
          {problems.map((problem, i) => {
            const Icon = problem.icon;
            return (
              <motion.div
                key={i}
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
                variants={fadeUp}
                custom={i * 0.07}
                className="bg-gray-950 p-8 hover:bg-gray-900/60 transition-colors duration-300"
              >
                <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mb-6">
                  <Icon size={16} className="text-gray-500" />
                </div>
                <h3 className="text-[14px] font-semibold text-white leading-snug tracking-tight mb-3">
                  {problem.title}
                </h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">
                  {problem.body}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
