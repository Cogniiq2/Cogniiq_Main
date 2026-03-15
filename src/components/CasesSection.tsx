import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Trophy, Utensils, Shirt, ArrowRight, TrendingUp } from 'lucide-react';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay, ease: EASE },
  }),
};

const cases = [
  {
    icon: Building2,
    category: 'Medizin & Gesundheit',
    title: 'Arztpraxis: KI-Rezeptionistin ersetzt manuelle Terminannahme',
    situation: 'Die Praxis verpasste täglich 20–30 Anrufe. Das Empfangsteam war ausgelastet, Neupatienten sprangen ab.',
    solution: 'KI-Telefonassistentin übernimmt Anrufannahme rund um die Uhr, bucht Termine direkt ins System, sendet Bestätigungs-SMS automatisch.',
    outcomes: [
      'Keine verpassten Anrufe mehr außerhalb der Öffnungszeiten',
      'Empfangsteam fokussiert sich auf Patienten vor Ort',
      'Neupatienten-Buchungen spürbar angestiegen',
    ],
    link: '/ki-telefonassistent',
    linkLabel: 'KI Telefonassistent ansehen',
  },
  {
    icon: Trophy,
    category: 'Sport & Freizeit',
    title: 'Sportanlage: Website + Buchung + vollautomatischer Zugang',
    situation: 'Personal wurde täglich mit Buchungsanfragen und Zugangsproblemen belastet. Keine Online-Präsenz.',
    solution: 'Neue Website mit integriertem Buchungssystem, automatischer Lichtsteuerung und KI-gesteuerter Türöffnung – alles synchron mit Zahlungen.',
    outcomes: [
      '24/7 Buchungen ohne Personalaufwand',
      'Licht & Zugang vollautomatisch gesteuert',
      'Umsatz auch außerhalb der Kernzeiten',
    ],
    link: '/leistungen',
    linkLabel: 'Automation ansehen',
  },
  {
    icon: Utensils,
    category: 'Gastronomie',
    title: 'Restaurant: KI-Rezeptionistin + Webauftritt mit Conversion',
    situation: 'Das Serviceteam verlor täglich Zeit am Telefon. Tischreservierungen liefen chaotisch, No-Shows waren häufig.',
    solution: 'Neue Website mit Speisekarte, KI-Telefonistin für Reservierungen und automatische Bestätigungs-/Erinnerungssequenz.',
    outcomes: [
      'No-Show-Rate um ca. 40% reduziert',
      'Service-Team nimmt deutlich seltener Anrufe entgegen',
      'Online-Reservierungen als primärer Buchungskanal',
    ],
    link: '/webdesign-gastronomie-bayreuth',
    linkLabel: 'Webdesign Gastronomie',
  },
  {
    icon: Shirt,
    category: 'Fashion & E-Commerce',
    title: 'Fashion-Brand: AI-Content-Produktion für Kampagnen',
    situation: 'Kampagnenproduktion dauerte Wochen und war teuer. Shooting-Setups für jede Kollektion nicht skalierbar.',
    solution: 'AI-generierte Produktbilder und Social-Content im exakten Brand-Look, kombiniert mit Landingpages für jeden Drop.',
    outcomes: [
      'Kampagnenzeit von Wochen auf Tage reduziert',
      'Konsistenter Brand-Look über alle Kanäle',
      'Shooting-Kosten erheblich gesunken',
    ],
    link: '/leistungen',
    linkLabel: 'Alle Leistungen',
  },
];

export function CasesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.06 });

  return (
    <section
      id="cases"
      ref={ref}
      className="py-28 bg-white border-t border-gray-100"
      aria-labelledby="cases-heading"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-20">
          <motion.div
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            variants={fadeUp}
            custom={0}
            className="max-w-xl"
          >
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-gray-400 mb-5">
              Referenzen
            </p>
            <h2
              id="cases-heading"
              className="text-4xl lg:text-5xl font-bold text-gray-900 leading-[1.08] tracking-tight"
            >
              Reale Probleme.
              <br />
              <span className="text-gray-300">Messbare Ergebnisse.</span>
            </h2>
          </motion.div>
          <motion.p
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            variants={fadeUp}
            custom={0.1}
            className="text-[14.5px] text-gray-500 leading-relaxed max-w-sm"
          >
            Projekte, die mit einem konkreten Problem starteten – und mit einem System endeten,
            das selbstständig arbeitet.{' '}
            <Link
              to="/referenzen"
              className="font-medium text-gray-700 hover:text-gray-900 transition-colors underline underline-offset-2 decoration-gray-200"
            >
              Alle Referenzen ansehen
            </Link>
            .
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-2 border border-gray-100 rounded-2xl overflow-hidden">
          {cases.map((caseItem, index) => {
            const Icon = caseItem.icon;
            const isRight = index % 2 === 1;
            const isBottom = index >= 2;
            return (
              <motion.article
                key={index}
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
                variants={fadeUp}
                custom={index * 0.08}
                className={`group relative bg-white p-10 transition-colors duration-300 hover:bg-gray-50/40 ${
                  isRight ? 'border-l border-gray-100' : ''
                } ${isBottom ? 'border-t border-gray-100' : ''}`}
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-gray-200 transition-colors duration-300">
                    <Icon size={16} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-300 mb-1.5">
                      {caseItem.category}
                    </p>
                    <h3 className="text-[15px] font-bold text-gray-900 leading-snug tracking-tight">
                      {caseItem.title}
                    </h3>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-300 mb-1">
                      Ausgangslage
                    </p>
                    <p className="text-[13px] text-gray-500 leading-relaxed">
                      {caseItem.situation}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-300 mb-1">
                      Lösung
                    </p>
                    <p className="text-[13px] text-gray-500 leading-relaxed">
                      {caseItem.solution}
                    </p>
                  </div>
                </div>

                <div className="pt-5 border-t border-gray-100 mb-7">
                  <div className="flex items-center gap-1.5 mb-3">
                    <TrendingUp size={11} className="text-gray-400" />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                      Ergebnisse
                    </p>
                  </div>
                  <div className="space-y-2">
                    {caseItem.outcomes.map((outcome, oi) => (
                      <div key={oi} className="flex items-start gap-2.5">
                        <div className="w-[3px] h-[3px] rounded-full bg-gray-300 flex-shrink-0 mt-[6px]" />
                        <span className="text-[13px] text-gray-600 leading-snug">{outcome}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  to={caseItem.link}
                  className="group/link inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-[0.12em]"
                >
                  {caseItem.linkLabel}
                  <ArrowRight
                    size={11}
                    className="transition-transform duration-200 group-hover/link:translate-x-1"
                  />
                </Link>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
