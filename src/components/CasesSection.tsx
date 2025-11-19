import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Building2, Trophy, Utensils, Shirt } from 'lucide-react';

const cases = [
  {
    icon: Building2,
    title: 'Klinik: AI-Rezeptionistin + Automatisiertes Buchungssystem',
    description:
      'Eingehende Anrufe werden von einer AI-Rezeptionistin angenommen, Termine direkt im Kalender gebucht, Folge-SMS und E-Mails automatisch versendet.',
    highlights: [
      'Weniger verpasste Anrufe',
      'Klare Struktur bei Neu- & Bestandspatienten',
      'Team am Empfang entlastet',
    ],
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Trophy,
    title: 'Padel- & Tennisanlage: Website + Buchung + Smartlocks',
    description:
      'Moderne Website mit Buchungssystem, automatischer Lichtsteuerung und Türöffnung – alles synchron mit Zahlungen.',
    highlights: [
      'Buchungen laufen 24/7 online',
      'Licht & Zugang sind automatisiert',
      'Kein Personal nötig für Standardzeiten',
    ],
    gradient: 'from-[#8b5cf6] to-[#7c3aed]',
  },
  {
    icon: Utensils,
    title: 'Restaurant: Webdesign + AI-Rezeptionistin + Reservierungssystem',
    description:
      'Website mit Speisekarte, Fotos, und AI-Telefonistin, die Anrufe annimmt, Reservierungen einträgt und No-Show-Risiko reduziert.',
    highlights: [
      'Mehr Online-Reservierungen',
      'Weniger Stress für Service-Personal',
      'Mehr Zeit für Gäste statt fürs Telefon',
    ],
    gradient: 'from-[#22d3ee] to-[#06b6d4]',
  },
  {
    icon: Shirt,
    title: 'Fashion-Brand: AI-Content für Kampagnen',
    description:
      'AI-generierte Produktbilder und Social-Content im Brand-Look, kombiniert mit Landingpages für neue Drops.',
    highlights: [
      'Schnellere Kampagnenproduktion',
      'Konsistenter Brand-Look',
      'Kein komplexes Shooting-Setup nötig',
    ],
    gradient: 'from-violet-500 to-fuchsia-500',
  },
];

export function CasesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section id="cases" ref={ref} className="py-32 bg-white" aria-labelledby="cases-heading">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 id="cases-heading" className="text-4xl lg:text-5xl font-bold mb-6 text-gray-900">
            Wie das in der{' '}
            <span className="bg-gradient-to-r from-[#D4AF37] to-[#C9A961] bg-clip-text text-transparent">
              Praxis aussieht
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Erfolgreiche Projekte: AI Automationen und Webdesign für verschiedene Branchen in Deutschland
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {cases.map((caseItem, index) => {
            const Icon = caseItem.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                whileHover={{ y: -6 }}
                className="group relative bg-gray-50 rounded-2xl p-8 border border-gray-200 hover:border-[#8b5cf6]/50 hover:shadow-xl transition-all duration-300"
              >
                <div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${caseItem.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                />

                <div className="relative flex items-start gap-6">
                  <div
                    className={`p-4 rounded-xl bg-gradient-to-br ${caseItem.gradient} flex-shrink-0`}
                    aria-hidden="true"
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-3 text-gray-900">
                      {caseItem.title}
                    </h3>
                    <p className="text-gray-600 mb-6 leading-relaxed text-sm">
                      {caseItem.description}
                    </p>

                    <div className="space-y-2">
                      {caseItem.highlights.map((highlight, highlightIndex) => (
                        <div
                          key={highlightIndex}
                          className="flex items-center gap-2"
                        >
                          <div
                            className={`w-1 h-1 rounded-full bg-gradient-to-r ${caseItem.gradient}`}
                          />
                          <span className="text-sm text-gray-700">{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div
                  className={`absolute -bottom-px -right-px w-24 h-24 bg-gradient-to-br ${caseItem.gradient} rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
