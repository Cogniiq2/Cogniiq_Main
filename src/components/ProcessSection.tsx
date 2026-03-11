import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MessageSquare, FileText, Cog, Rocket, ArrowRight } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

const stages = [
  {
    number: '01',
    title: 'Kennenlernen & Zieldefinition',
    icon: MessageSquare,
    accentColor: '#0ea5e9',
    description:
      'Kurzes Erstgespräch (30–45 Min.), in dem wir Ihr Geschäftsmodell, Ihre Ziele und den Status quo verstehen. Kostenlos und unverbindlich.',
    items: [
      'Kostenloser Strategiecall',
      'Analyse des Status Quo',
      'Klare Zielsetzung & KPIs',
      'Erste Einschätzung der Möglichkeiten',
    ],
  },
  {
    number: '02',
    title: 'Konzept & Angebot',
    icon: FileText,
    accentColor: '#14b8a6',
    description:
      'Wir skizzieren Website / Automation / AI-Setup und erstellen ein klares, individuelles Angebot – keine versteckten Kosten.',
    items: [
      'Maßgeschneidertes Systemkonzept',
      'Detaillierte Roadmap',
      'Transparente Preisgestaltung',
      'Klare Meilensteine',
    ],
  },
  {
    number: '03',
    title: 'Umsetzung & Feinschliff',
    icon: Cog,
    accentColor: '#3b82f6',
    description:
      'Umsetzung in klaren Sprints, regelmäßige Zwischenstände, Feedbackrunden, Tests. Fokus auf Performance und Stabilität.',
    items: [
      'Entwicklung in Sprints',
      'Regelmäßige Updates & Abstimmungen',
      'Ausgiebige Feedbackrunden',
      'Performance-Tests vor Go-Live',
    ],
  },
  {
    number: '04',
    title: 'Go-Live & Optimierung',
    icon: Rocket,
    accentColor: '#06b6d4',
    description:
      'Launch, Monitoring und Optimierung auf das, was zählt: Anfragen, Buchungen, Umsatz – nicht nur Pixel.',
    items: [
      'Reibungsloser Launch',
      'Laufendes Monitoring',
      'Datenbasierte Optimierung',
      'Langfristige Partnerschaft',
    ],
  },
];

function StageCard({ stage, index }: { stage: typeof stages[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.25 });
  const Icon = stage.icon;

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={fadeUp}
      custom={index * 0.1}
      className="relative group"
    >
      <div className="grid grid-cols-[auto_1fr] gap-0 items-stretch">
        <div className="flex flex-col items-center">
          <div
            className="relative w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
            style={{ backgroundColor: `${stage.accentColor}15`, border: `1px solid ${stage.accentColor}25` }}
          >
            <Icon size={18} style={{ color: stage.accentColor }} />
          </div>
          {index < stages.length - 1 && (
            <div className="w-px flex-1 mt-4 bg-gradient-to-b from-gray-200 dark:from-gray-700 to-transparent min-h-[3rem]" />
          )}
        </div>

        <div className="pl-6 pb-14">
          <div className="flex items-center gap-3 mb-3">
            <span
              className="text-xs font-bold tracking-[0.2em] uppercase"
              style={{ color: stage.accentColor }}
            >
              {stage.number}
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-gray-200 dark:from-gray-700 to-transparent max-w-[2.5rem]" />
          </div>

          <h3 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-3 leading-tight tracking-tight">
            {stage.title}
          </h3>

          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-5 max-w-lg">
            {stage.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {stage.items.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: index * 0.1 + i * 0.07 + 0.2 }}
                className="flex items-center gap-2.5"
              >
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: stage.accentColor }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                  {item}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function ProcessSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });

  return (
    <section
      id="ablauf"
      ref={sectionRef}
      className="py-28 bg-white dark:bg-gray-950"
      aria-labelledby="process-heading"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1fr_1.4fr] gap-20 items-start">
          <div className="lg:sticky lg:top-32">
            <motion.div
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              variants={fadeUp}
              custom={0}
            >
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500 mb-5">
                Prozess
              </p>

              <h2
                id="process-heading"
                className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-[1.08] tracking-tight mb-6"
              >
                So arbeiten
                <br />
                <span className="text-gray-400 dark:text-gray-600">wir zusammen.</span>
              </h2>

              <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm mb-10">
                Transparenter Prozess von der ersten Anfrage bis zum Go-Live –
                klar, schnell, ohne Überraschungen.{' '}
                <Link
                  to="/kontakt"
                  className="font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors underline underline-offset-2 decoration-gray-300 dark:decoration-gray-600"
                >
                  Jetzt starten
                </Link>
                .
              </p>

              <div className="flex flex-col gap-3 mb-10">
                {stages.map((stage, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{ backgroundColor: `${stage.accentColor}15`, color: stage.accentColor }}
                    >
                      {i + 1}
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-500 font-medium">
                      {stage.title}
                    </span>
                  </div>
                ))}
              </div>

              <Link
                to="/kontakt"
                className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100 hover:gap-3 transition-all group"
              >
                Kostenloses Erstgespräch
                <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </div>

          <div className="relative pt-2">
            {stages.map((stage, index) => (
              <StageCard key={index} stage={stage} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
