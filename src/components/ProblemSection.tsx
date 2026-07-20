import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { PhoneMissed, Globe, Clock, TrendingDown, Zap, LayoutDashboard, ArrowRight } from 'lucide-react';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1] as [number, number, number, number];

const problems = [
  {
    icon: PhoneMissed,
    title: 'Jeder verpasste Anruf ist ein verlorener Kunde.',
    body: 'Im Schnitt 30% aller Anrufe gehen unbeantwortet – das ist täglicher Umsatzverlust. Wer nicht abhebt, verliert an den Mitbewerber, der es tut.',
    stat: '30%',
    statLabel: 'der Anrufe unbeantwortet',
    accent: true,
    href: '/verpasste-anrufe-verlust',
  },
  {
    icon: Globe,
    title: 'Ihre Website bringt keine Anfragen.',
    body: 'Eine Website ohne klare Conversion-Führung und SEO-Struktur ist unsichtbar. Sie existiert – aber sie arbeitet nicht.',
    stat: '94%',
    statLabel: 'verlassen ohne Aktion',
    accent: false,
    href: '/keine-anfragen-website',
  },
  {
    icon: Clock,
    title: 'Manuelle Arbeit ist der teuerste Posten.',
    body: 'Terminverwaltung, Follow-ups, Angebote per Hand – das summiert sich auf 10–20 Stunden pro Woche. Zeit, die für Kerngeschäft fehlt.',
    stat: '18h',
    statLabel: 'pro Woche verloren',
    accent: false,
    href: '/zu-viel-manuelle-arbeit',
  },
  {
    icon: TrendingDown,
    title: 'Nicht sichtbar. Nicht existent.',
    body: 'Wer bei lokalen Suchanfragen nicht auf Seite 1 erscheint, existiert für Neukunden nicht. Google entscheidet täglich, wer die Anfrage bekommt.',
    stat: '75%',
    statLabel: 'klicken nur Seite 1',
    accent: false,
    href: '/keine-anfragen-website',
  },
  {
    icon: Zap,
    title: 'Tools, die nicht zusammenarbeiten.',
    body: 'CRM, Kalender, Buchungssystem, Buchhaltung – alle isoliert. Jede manuelle Übertragung ist eine Fehlerquelle und Zeitfresser.',
    stat: '6+',
    statLabel: 'isolierte Tools im Schnitt',
    accent: false,
    href: '/digitale-automatisierung-unternehmen',
  },
  {
    icon: LayoutDashboard,
    title: 'Kein Überblick bedeutet kein Wachstum.',
    body: 'Ohne automatisiertes Reporting weiß niemand, wo Leads hängen bleiben und welche Maßnahmen tatsächlich wirken.',
    stat: '∅',
    statLabel: 'kein Reporting vorhanden',
    accent: false,
    href: '/digitale-automatisierung-unternehmen',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (d = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay: d, ease: EASE },
  }),
};

export function ProblemSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.06 });

  return (
    <section ref={ref} className="py-28 bg-white border-t border-gray-100" aria-labelledby="problem-heading">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-20">
          <motion.div
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            variants={fadeUp}
            custom={0}
            className="max-w-2xl"
          >
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-gray-400 mb-5">
              Warum Unternehmen stagnieren
            </p>
            <h2
              id="problem-heading"
              className="text-4xl lg:text-5xl font-bold text-gray-900 leading-[1.08] tracking-tight"
            >
              Das kostet Sie täglich
              <br />
              <span className="text-gray-300">bares Geld.</span>
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            variants={fadeUp}
            custom={0.1}
            className="flex flex-col gap-4 max-w-xs"
          >
            <p className="text-[14px] text-gray-500 leading-relaxed">
              Nicht weil die Kunden ausbleiben. Sondern weil operative Lücken sie still wegschicken.
            </p>
            <Link
              to="/kontakt"
              className="group inline-flex items-center gap-2 text-[12.5px] font-semibold text-gray-400 hover:text-gray-900 transition-colors"
            >
              Problem lösen lassen
              <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>

        {/* Problem grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-100 rounded-2xl overflow-hidden border border-gray-100">
          {problems.map((problem, i) => {
            const Icon = problem.icon;
            return (
              <motion.div
                key={i}
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
                variants={fadeUp}
                custom={i * 0.07}
                className={`group relative flex flex-col p-8 transition-all duration-300 ${
                  problem.accent
                    ? 'bg-gray-50 hover:bg-gray-100/60'
                    : 'bg-white hover:bg-gray-50/60'
                }`}
              >
                {/* Hover left accent bar */}
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-sky-500 scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-bottom" />

                <div className="flex items-start justify-between mb-6">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                    problem.accent
                      ? 'bg-gray-200 border border-gray-200 group-hover:bg-gray-300'
                      : 'bg-gray-100 border border-gray-100 group-hover:bg-gray-200'
                  }`}>
                    <Icon size={15} className="text-gray-500" />
                  </div>

                  {/* Stat chip */}
                  <div className="text-right">
                    <p className="text-[22px] font-bold text-gray-200 tabular-nums leading-none group-hover:text-gray-400 transition-colors">
                      {problem.stat}
                    </p>
                    <p className="text-[9px] text-gray-300 uppercase tracking-[0.1em] leading-tight mt-0.5">
                      {problem.statLabel}
                    </p>
                  </div>
                </div>

                <h3 className="text-[14px] font-semibold leading-snug tracking-tight mb-3 text-gray-900">
                  {problem.title}
                </h3>
                <p className="text-[13px] leading-relaxed flex-1 text-gray-500">
                  {problem.body}
                </p>

                <Link
                  to={problem.href}
                  className="mt-5 inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-gray-400 hover:text-gray-900 transition-colors group/link"
                >
                  Lösung ansehen
                  <ArrowRight size={9} className="transition-transform group-hover/link:translate-x-0.5" />
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA row */}
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={fadeUp}
          custom={0.5}
          className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-6 pt-10 border-t border-gray-100"
        >
          <p className="text-[14px] text-gray-500 max-w-lg">
            Diese Probleme sind lösbar — in Tagen, nicht Monaten.
            Wir bauen das System, das sie vollständig eliminiert.
          </p>
          <Link
            to="/kontakt"
            className="group flex-shrink-0 inline-flex items-center gap-2.5 bg-gray-950 text-white font-semibold text-[13px] px-7 py-3.5 hover:bg-gray-800 transition-colors"
          >
            Jetzt Lösung anfragen
            <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>

      </div>
    </section>
  );
}
