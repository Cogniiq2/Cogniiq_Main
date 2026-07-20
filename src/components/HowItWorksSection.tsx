import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { PhoneCall, Globe, Zap, ArrowRight, CircleCheck as CheckCircle } from 'lucide-react';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const STEPS = [
  {
    number: '01',
    icon: PhoneCall,
    title: 'Kostenloses Analysegespräch',
    subtitle: '30 Minuten reichen aus',
    description:
      'Wir analysieren gemeinsam Ihre größten Verlustquellen: verpasste Anrufe, langsame Websites, manuelle Prozesse. Keine Vorbereitung nötig.',
    outcomes: [
      'Potenzialanalyse Ihres Unternehmens',
      'Konkrete Hebel identifiziert',
      'Klarer Lösungsvorschlag',
    ],
    color: '#0ea5e9',
    bgLight: 'rgba(14,165,233,0.06)',
    borderLight: 'rgba(14,165,233,0.12)',
    tag: 'Kostenlos',
    tagColor: '#0ea5e9',
    tagBg: 'rgba(14,165,233,0.08)',
  },
  {
    number: '02',
    icon: Globe,
    title: 'System-Konzept & Angebot',
    subtitle: 'Maßgeschneidert, nicht von der Stange',
    description:
      'Sie erhalten ein individuelles Systemkonzept mit klarer Roadmap, transparenter Preisgestaltung und definierten Meilensteinen — innerhalb von 24 Stunden nach dem Gespräch.',
    outcomes: [
      'Individuelles Systemkonzept',
      'Feste Meilensteine & Kosten',
      'Keine versteckten Extras',
    ],
    color: '#10b981',
    bgLight: 'rgba(16,185,129,0.06)',
    borderLight: 'rgba(16,185,129,0.12)',
    tag: 'Innerhalb 24 h',
    tagColor: '#10b981',
    tagBg: 'rgba(16,185,129,0.08)',
  },
  {
    number: '03',
    icon: Zap,
    title: 'Go-Live in 14 Tagen',
    subtitle: 'Garantiert — oder Geld zurück',
    description:
      'Entwicklung in klaren Sprints, regelmäßige Zwischenstände, ausgiebige Tests. Go-Live in 14 Tagen — mit Monitoring, Optimierung und langfristiger Partnerschaft.',
    outcomes: [
      'Go-Live in maximal 14 Tagen',
      'Laufendes Monitoring inklusive',
      'Geld-zurück-Garantie',
    ],
    color: '#f59e0b',
    bgLight: 'rgba(245,158,11,0.06)',
    borderLight: 'rgba(245,158,11,0.12)',
    tag: '14-Tage-Garantie',
    tagColor: '#d97706',
    tagBg: 'rgba(245,158,11,0.08)',
  },
];

function StepCard({ step, index, isActive, onClick }: {
  step: typeof STEPS[0];
  index: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const Icon = step.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay: index * 0.12, ease: EASE }}
      onClick={onClick}
      className="relative cursor-pointer group"
    >
      <motion.div
        className="relative rounded-2xl border overflow-hidden transition-all duration-300"
        animate={{
          borderColor: isActive ? step.color + '33' : '#f3f4f6',
          background: isActive ? step.bgLight : '#ffffff',
          boxShadow: isActive
            ? `0 8px 40px ${step.color}14, 0 2px 8px rgba(0,0,0,0.04)`
            : '0 1px 4px rgba(0,0,0,0.03)',
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Top accent line */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: step.color }}
          animate={{ scaleX: isActive ? 1 : 0, transformOrigin: 'left' }}
          transition={{ duration: 0.4, ease: EASE }}
        />

        <div className="p-6">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <motion.div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                animate={{
                  background: isActive ? step.color + '18' : '#f9fafb',
                  borderColor: isActive ? step.color + '33' : '#e5e7eb',
                }}
                style={{ border: '1px solid' }}
                transition={{ duration: 0.3 }}
              >
                <Icon
                  size={16}
                  style={{ color: isActive ? step.color : '#6b7280' }}
                  className="transition-colors duration-300"
                />
              </motion.div>
              <span
                className="text-[10px] font-bold tracking-[0.22em] uppercase tabular-nums"
                style={{ color: isActive ? step.color : '#d1d5db' }}
              >
                {step.number}
              </span>
            </div>

            <span
              className="text-[10.5px] font-semibold px-2.5 py-1 rounded-full"
              style={{
                color: step.tagColor,
                background: step.tagBg,
                border: `1px solid ${step.tagColor}22`,
              }}
            >
              {step.tag}
            </span>
          </div>

          <h3 className="text-[16px] font-bold text-gray-900 mb-1 leading-tight tracking-tight">
            {step.title}
          </h3>
          <p className="text-[12px] text-gray-400 mb-4 font-medium">{step.subtitle}</p>

          <AnimatePresence>
            {isActive && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="overflow-hidden"
              >
                <p className="text-[13px] text-gray-500 leading-[1.72] mb-5">
                  {step.description}
                </p>
                <div className="flex flex-col gap-2">
                  {step.outcomes.map((o, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.07, ease: EASE }}
                      className="flex items-center gap-2.5"
                    >
                      <CheckCircle size={12} style={{ color: step.color }} className="flex-shrink-0" />
                      <span className="text-[12.5px] text-gray-600 font-medium">{o}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!isActive && (
            <p className="text-[12.5px] text-gray-400 leading-[1.65] line-clamp-2">
              {step.description}
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function AnimatedTimeline({ activeStep }: { activeStep: number }) {
  return (
    <div className="hidden lg:flex flex-col items-center gap-0 absolute left-1/2 -translate-x-1/2 top-0 bottom-0 pointer-events-none z-10">
      {STEPS.map((step, i) => (
        <div key={i} className="flex flex-col items-center flex-1">
          <motion.div
            className="w-3 h-3 rounded-full border-2 flex-shrink-0 mt-8"
            animate={{
              borderColor: i <= activeStep ? step.color : '#e5e7eb',
              background: i <= activeStep ? step.color : '#ffffff',
              scale: i === activeStep ? 1.3 : 1,
            }}
            transition={{ duration: 0.3 }}
          />
          {i < STEPS.length - 1 && (
            <div className="flex-1 w-[1px] bg-gray-100 my-1 overflow-hidden">
              <motion.div
                className="w-full"
                style={{ background: STEPS[i].color }}
                animate={{ height: i < activeStep ? '100%' : '0%' }}
                transition={{ duration: 0.5, ease: EASE }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function HowItWorksSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section
      ref={ref}
      id="wie-es-funktioniert"
      className="relative py-24 lg:py-32 bg-white border-t border-gray-100 overflow-hidden"
      aria-labelledby="how-it-works-heading"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 50% 40% at 80% 20%, rgba(14,165,233,0.03) 0%, transparent 60%), radial-gradient(ellipse 40% 35% at 20% 80%, rgba(16,185,129,0.03) 0%, transparent 60%)',
        }}
      />

      <div className="relative max-w-6xl mx-auto px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: EASE }}
          className="mb-16 lg:mb-20"
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-1 rounded-full bg-gray-300" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400">
              Wie es funktioniert
            </p>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <h2
              id="how-it-works-heading"
              style={{
                fontSize: 'clamp(30px, 4.5vw, 48px)',
                fontWeight: 700,
                lineHeight: 1.06,
                letterSpacing: '-0.026em',
                color: '#111827',
                maxWidth: '14ch',
              }}
            >
              Vom Gespräch
              <br />
              <span className="text-gray-200">zum System.</span>
            </h2>

            <div className="flex flex-col gap-2 lg:text-right">
              <p className="text-[14px] text-gray-500 leading-[1.7] max-w-[38ch] lg:max-w-[32ch]">
                In drei Schritten — transparent, verbindlich und ohne Überraschungen.
              </p>
              <Link
                to="/kontakt"
                className="group inline-flex items-center gap-1.5 text-[13px] font-semibold text-gray-700 hover:text-gray-900 transition-colors"
              >
                Jetzt starten
                <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Steps grid */}
        <div className="relative grid lg:grid-cols-3 gap-5">
          <AnimatedTimeline activeStep={activeStep} />
          {STEPS.map((step, i) => (
            <StepCard
              key={i}
              step={step}
              index={i}
              isActive={activeStep === i}
              onClick={() => setActiveStep(i)}
            />
          ))}
        </div>

        {/* Bottom CTA bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5, ease: EASE }}
          className="mt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl border border-gray-100 bg-gray-50/60"
        >
          <div className="flex flex-col gap-1">
            <p className="text-[14px] font-bold text-gray-900">
              Bereit in 14 Tagen live zu gehen?
            </p>
            <p className="text-[12.5px] text-gray-400">
              Kein Risiko — Go-Live-Garantie oder volle Rückerstattung.
            </p>
          </div>

          <Link
            to="/kontakt"
            className="group flex items-center gap-2.5 px-6 py-3 bg-gray-950 text-white text-[13px] font-semibold rounded-xl hover:bg-gray-800 transition-colors flex-shrink-0"
          >
            Kostenloses Erstgespräch
            <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
