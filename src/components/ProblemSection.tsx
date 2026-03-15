import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { PhoneMissed, Globe, Clock, TrendingDown, Zap, LayoutDashboard } from 'lucide-react';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const problems = [
  {
    icon: PhoneMissed,
    title: 'Jeder verpasste Anruf ist ein verlorener Kunde.',
    body: 'Im Schnitt 30% aller Anrufe gehen unbeantwortet – das sind keine Statistiken, das ist täglicher Umsatzverlust. Wer nicht abhebt, verliert an den Mitbewerber, der es tut.',
    accent: true,
  },
  {
    icon: Globe,
    title: 'Ihre Website bringt keine Anfragen.',
    body: 'Eine Website ohne klare Conversion-Führung, ohne Ladezeit-Optimierung und ohne SEO-Struktur ist unsichtbar. Sie existiert – aber sie arbeitet nicht.',
    accent: false,
  },
  {
    icon: Clock,
    title: 'Manuelle Arbeit ist der teuerste Posten.',
    body: 'Terminverwaltung, Follow-ups, Angebote per Hand – das summiert sich auf 10–20 Stunden pro Woche. Zeit, die für das Kerngeschäft fehlt.',
    accent: false,
  },
  {
    icon: TrendingDown,
    title: 'Nicht sichtbar. Nicht existent.',
    body: 'Wer bei lokalen Suchanfragen nicht auf Seite 1 erscheint, existiert für potenzielle Neukunden schlicht nicht. Google entscheidet täglich, wer die Anfrage bekommt.',
    accent: false,
  },
  {
    icon: Zap,
    title: 'Tools, die nicht zusammenarbeiten.',
    body: 'CRM, Kalender, Buchungssystem, Buchhaltung – alle isoliert. Jede manuelle Übertragung ist eine Fehlerquelle. Ein System, das kommuniziert, ist kein Luxus.',
    accent: false,
  },
  {
    icon: LayoutDashboard,
    title: 'Kein Überblick bedeutet kein Wachstum.',
    body: 'Ohne automatisiertes Reporting weiß niemand, wo Leads hängen bleiben, wo Umsatz verloren geht und welche Maßnahmen tatsächlich wirken.',
    accent: false,
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
            className="text-4xl lg:text-5xl font-bold text-white leading-[1.08] tracking-tight mb-6"
          >
            Das kostet Sie täglich
            <br />
            <span className="text-gray-600">bares Geld.</span>
          </h2>
          <p className="text-[15px] text-gray-500 leading-relaxed max-w-xl">
            Nicht weil die Kunden ausbleiben. Sondern weil operative Lücken sie still wegschicken.
          </p>
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
                className={`group p-8 transition-colors duration-300 ${
                  problem.accent
                    ? 'bg-white/[0.03] hover:bg-white/[0.06]'
                    : 'bg-gray-950 hover:bg-gray-900/60'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-6 transition-colors ${
                  problem.accent
                    ? 'bg-white/[0.07] border border-white/[0.12] group-hover:bg-white/[0.1]'
                    : 'bg-white/[0.04] border border-white/[0.07] group-hover:bg-white/[0.07]'
                }`}>
                  <Icon size={16} className={problem.accent ? 'text-gray-300' : 'text-gray-500'} />
                </div>
                <h3 className={`text-[14px] font-semibold leading-snug tracking-tight mb-3 ${
                  problem.accent ? 'text-white' : 'text-white/90'
                }`}>
                  {problem.title}
                </h3>
                <p className={`text-[13px] leading-relaxed ${
                  problem.accent ? 'text-gray-400' : 'text-gray-500'
                }`}>
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
