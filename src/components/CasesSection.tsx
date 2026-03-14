import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Trophy, Utensils, Shirt, ArrowRight } from 'lucide-react';

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
    title: 'Klinik: KI-Rezeptionistin + Automatisiertes Buchungssystem',
    description:
      'Eingehende Anrufe werden von einer KI-Rezeptionistin angenommen, Termine direkt im Kalender gebucht, Folge-SMS und E-Mails automatisch versendet.',
    highlights: [
      'Deutlich weniger verpasste Anrufe',
      'Klare Struktur bei Neu- & Bestandspatienten',
      'Empfangsteam spürbar entlastet',
    ],
    link: '/ki-telefonassistent',
    linkLabel: 'KI Telefonassistent ansehen',
  },
  {
    icon: Trophy,
    category: 'Sport & Freizeit',
    title: 'Padel- & Tennisanlage: Website + Buchung + Smartlocks',
    description:
      'Moderne Website mit Buchungssystem, automatischer Lichtsteuerung und Türöffnung – alles synchron mit Zahlungen und ohne Personalaufwand.',
    highlights: [
      'Buchungen laufen 24/7 online',
      'Licht & Zugang vollständig automatisiert',
      'Kein Personal nötig für Standardzeiten',
    ],
    link: '/leistungen',
    linkLabel: 'Leistungen entdecken',
  },
  {
    icon: Utensils,
    category: 'Gastronomie',
    title: 'Restaurant: Webdesign + KI-Rezeptionistin + Reservierung',
    description:
      'Website mit Speisekarte und KI-Telefonistin, die Anrufe annimmt, Reservierungen einträgt und No-Show-Risiko reduziert.',
    highlights: [
      'Mehr Online-Reservierungen',
      'Weniger Stress für das Service-Personal',
      'Mehr Zeit für Gäste statt fürs Telefon',
    ],
    link: '/webdesign-gastronomie-bayreuth',
    linkLabel: 'Webdesign Gastronomie',
  },
  {
    icon: Shirt,
    category: 'Fashion & E-Commerce',
    title: 'Fashion-Brand: AI-Content für Kampagnen',
    description:
      'AI-generierte Produktbilder und Social-Content im Brand-Look, kombiniert mit Landingpages für neue Drops.',
    highlights: [
      'Schnellere Kampagnenproduktion',
      'Konsistenter Brand-Look',
      'Kein komplexes Shooting-Setup nötig',
    ],
    link: '/leistungen',
    linkLabel: 'Alle Leistungen',
  },
];

export function CasesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.08 });

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
              Wie das in der
              <br />
              <span className="text-gray-300">Praxis aussieht.</span>
            </h2>
          </motion.div>
          <motion.p
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            variants={fadeUp}
            custom={0.1}
            className="text-base text-gray-500 leading-relaxed max-w-sm"
          >
            Reale Projekte: KI-Automationen und{' '}
            <Link
              to="/leistungen"
              className="font-medium text-gray-700 hover:text-gray-900 transition-colors underline underline-offset-2 decoration-gray-200"
            >
              Webdesign für verschiedene Branchen
            </Link>{' '}
            in Deutschland – mit messbaren Ergebnissen.
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
                custom={index * 0.09}
                className={`group relative bg-white p-10 transition-colors duration-300 hover:bg-gray-50/50 ${
                  isRight ? 'border-l border-gray-100' : ''
                } ${isBottom ? 'border-t border-gray-100' : ''}`}
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-gray-200 transition-colors">
                    <Icon size={17} className="text-gray-500" />
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

                <p className="text-[13.5px] text-gray-500 leading-relaxed mb-6">
                  {caseItem.description}
                </p>

                <div className="space-y-2 mb-7">
                  {caseItem.highlights.map((highlight, hi) => (
                    <div key={hi} className="flex items-center gap-2.5">
                      <div className="w-[3px] h-[3px] rounded-full bg-gray-300 flex-shrink-0" />
                      <span className="text-[13px] text-gray-600">{highlight}</span>
                    </div>
                  ))}
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

        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={fadeUp}
          custom={0.4}
          className="mt-8 flex justify-center"
        >
          <Link
            to="/referenzen"
            className="group inline-flex items-center gap-2 text-[13px] font-semibold text-gray-400 hover:text-gray-900 transition-colors"
          >
            Alle Referenzen ansehen
            <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
