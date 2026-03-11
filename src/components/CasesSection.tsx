import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Trophy, Utensils, Shirt, ArrowRight } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] },
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
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section
      id="cases"
      ref={ref}
      className="py-28 bg-gray-50 dark:bg-gray-900/40"
      aria-labelledby="cases-heading"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={fadeUp}
          custom={0}
          className="max-w-2xl mb-16"
        >
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500 mb-5">
            Referenzen
          </p>
          <h2
            id="cases-heading"
            className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 leading-[1.08] tracking-tight mb-5"
          >
            Wie das in der
            <br />
            <span className="text-gray-400 dark:text-gray-600">Praxis aussieht.</span>
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
            Reale Projekte: KI-Automationen und{' '}
            <Link
              to="/leistungen"
              className="font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors underline underline-offset-2 decoration-gray-300 dark:decoration-gray-600"
            >
              Webdesign für verschiedene Branchen
            </Link>{' '}
            in Deutschland – mit messbaren Ergebnissen.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-5">
          {cases.map((caseItem, index) => {
            const Icon = caseItem.icon;
            return (
              <motion.article
                key={index}
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
                variants={fadeUp}
                custom={index * 0.1}
                className="group relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 p-8 transition-all duration-300"
              >
                <div className="flex items-start gap-5">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                    <Icon size={18} className="text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 mb-2">
                      {caseItem.category}
                    </p>
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-3 leading-snug">
                      {caseItem.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-5">
                      {caseItem.description}
                    </p>

                    <div className="space-y-1.5 mb-6">
                      {caseItem.highlights.map((highlight, hi) => (
                        <div key={hi} className="flex items-center gap-2.5">
                          <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">{highlight}</span>
                        </div>
                      ))}
                    </div>

                    <Link
                      to={caseItem.link}
                      className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors uppercase tracking-[0.1em] group/link"
                    >
                      {caseItem.linkLabel}
                      <ArrowRight
                        size={11}
                        className="transition-transform duration-200 group-hover/link:translate-x-1"
                      />
                    </Link>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={fadeUp}
          custom={0.5}
          className="mt-10 text-center"
        >
          <Link
            to="/referenzen"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 px-6 py-3 rounded-xl"
          >
            Alle Referenzen ansehen
            <ArrowRight size={14} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
