import { useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { MessageSquare, FileText, Cog, Rocket, ArrowRight } from 'lucide-react';

const stages = [
  {
    number: '01',
    title: 'Kennenlernen & Zieldefinition',
    icon: MessageSquare,
    accentColor: '#0ea5e9',
    description:
      'Kurzes Erstgespräch (30–45 Minuten), in dem wir dein Geschäftsmodell, deine Ziele und deinen Status Quo verstehen.',
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
      'Wir skizzieren Website/Automation/AI-Setup und erstellen ein klares, individuelles Angebot – ohne versteckte Kosten.',
    items: [
      'Maßgeschneidertes Konzept',
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
      'Regelmäßige Updates',
      'Ausgiebige Feedbackrunden',
      'Performance-Tests',
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
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="relative group"
    >
      <div className="grid grid-cols-[auto_1fr] gap-0 items-stretch">
        <div className="flex flex-col items-center">
          <div
            className="relative w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
            style={{ backgroundColor: `${stage.accentColor}18`, border: `1px solid ${stage.accentColor}30` }}
          >
            <Icon
              size={20}
              style={{ color: stage.accentColor }}
            />
          </div>
          {index < stages.length - 1 && (
            <div className="w-px flex-1 mt-4 bg-gradient-to-b from-gray-200 dark:from-gray-700 to-transparent min-h-[3rem]" />
          )}
        </div>

        <div className="pl-6 pb-16">
          <div className="flex items-center gap-3 mb-3">
            <span
              className="text-xs font-bold tracking-[0.2em] uppercase"
              style={{ color: stage.accentColor }}
            >
              {stage.number}
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-gray-200 dark:from-gray-700 to-transparent max-w-[3rem]" />
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
                initial={{ opacity: 0, x: -10 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: index * 0.1 + i * 0.07 + 0.2 }}
                className="flex items-center gap-2.5 group/item"
              >
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-transform duration-200 group-hover/item:scale-150"
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
      className="py-28 bg-white dark:bg-gray-950 transition-colors duration-300"
      aria-labelledby="process-heading"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1fr_1.4fr] gap-20 items-start">
          <div className="lg:sticky lg:top-32">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-8">
                <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-[0.15em]">
                  Prozess
                </span>
              </div>

              <h2
                id="process-heading"
                className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-[1.1] tracking-tight mb-6"
              >
                So arbeiten
                <br />
                <span className="text-gray-400 dark:text-gray-600">wir zusammen</span>
              </h2>

              <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm mb-10">
                Transparenter Prozess: Von der ersten Anfrage bis zum erfolgreichen Go-Live – klar, schnell, ohne Überraschungen.
              </p>

              <div className="flex flex-col gap-3">
                {stages.map((stage, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold"
                      style={{ backgroundColor: `${stage.accentColor}18`, color: stage.accentColor }}
                    >
                      {i + 1}
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-500 font-medium">
                      {stage.title}
                    </span>
                  </div>
                ))}
              </div>
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
