import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MessageSquare, FileText, Cog, Rocket, ArrowRight } from 'lucide-react';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1] as [number, number, number, number];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay, ease: EASE },
  }),
};

const stages = [
  {
    number: '01',
    title: 'Kennenlernen & Zieldefinition',
    icon: MessageSquare,
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
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const Icon = stage.icon;
  const isLast = index === stages.length - 1;

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={fadeUp}
      custom={index * 0.1}
      className="relative"
    >
      <div className="grid grid-cols-[auto_1fr] items-stretch">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-150 flex items-center justify-center flex-shrink-0 border-gray-200">
            <Icon size={16} className="text-gray-500" />
          </div>
          {!isLast && (
            <div className="w-px flex-1 mt-3 min-h-[2.5rem]" style={{ background: 'linear-gradient(to bottom, #e5e7eb, transparent)' }} />
          )}
        </div>

        <div className="pl-7 pb-12">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[10px] font-bold tracking-[0.22em] uppercase text-gray-300 tabular-nums">
              {stage.number}
            </span>
            <div className="h-px w-8 bg-gray-100" />
          </div>

          <h3 className="text-[20px] font-bold text-gray-900 mb-3 leading-tight tracking-tight">
            {stage.title}
          </h3>

          <p className="text-[13.5px] text-gray-500 leading-relaxed mb-5 max-w-lg">
            {stage.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {stage.items.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: index * 0.1 + i * 0.06 + 0.2, ease: EASE }}
                className="flex items-center gap-2.5"
              >
                <div className="w-[3px] h-[3px] rounded-full bg-gray-300 flex-shrink-0" />
                <span className="text-[13px] text-gray-600 font-medium">{item}</span>
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
      className="py-28 bg-white border-t border-gray-100"
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
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-gray-400 mb-5">
                Prozess
              </p>

              <h2
                id="process-heading"
                className="text-4xl lg:text-5xl font-bold text-gray-900 leading-[1.08] tracking-tight mb-6"
              >
                So arbeiten
                <br />
                <span className="text-gray-300">wir zusammen.</span>
              </h2>

              <p className="text-base text-gray-500 leading-relaxed max-w-sm mb-10">
                Transparenter Prozess von der ersten Anfrage bis zum Go-Live – klar, schnell, ohne Überraschungen.{' '}
                <Link
                  to="/kontakt"
                  className="font-medium text-gray-700 hover:text-gray-900 transition-colors underline underline-offset-2 decoration-gray-200"
                >
                  Jetzt starten
                </Link>
                .
              </p>

              <div className="flex flex-col gap-3 mb-10">
                {stages.map((stage, i) => {
                  const Icon = stage.icon;
                  return (
                    <div key={i} className="flex items-center gap-3 group cursor-default">
                      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-200 transition-colors">
                        <Icon size={13} className="text-gray-500" />
                      </div>
                      <span className="text-[13px] text-gray-500 font-medium leading-snug">
                        {stage.title}
                      </span>
                    </div>
                  );
                })}
              </div>

              <Link
                to="/kontakt"
                className="group inline-flex items-center gap-2 text-[13px] font-semibold text-gray-900 transition-all"
              >
                Kostenloses Erstgespräch
                <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-1" />
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
