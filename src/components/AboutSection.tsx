import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Target, Wrench, Award } from 'lucide-react';

const highlights = [
  {
    icon: Target,
    text: 'Seit 2025 Fokus auf Websites und KI-Lösungen, die messbar mehr Anfragen, Termine und Umsatz bringen – nicht nur optisch überzeugen.',
  },
  {
    icon: Wrench,
    text: 'Spezialisiert auf Praxen, Architekten, Ingenieurbüros und hochwertige Dienstleister, die ihre Abläufe mit KI und Automatisierung skalieren wollen.',
  },
  {
    icon: Award,
    text: 'Limitierte, ausgewählte Projekte mit direkter Zusammenarbeit mit Lazar & Djordje – keine Massenabfertigung, sondern persönliche Verantwortung für Ergebnisse.',
  },
];

const founders = [
  {
    name: 'Lazar Popovic',
    role: 'Co-Founder: AI-Automationen, KI-Workflows, technische Integration. Experte für Make.com und n8n.',
  },
  {
    name: 'Djordje Popovic',
    role: 'Co-Founder: Webdesign, System-Architektur, Performance-Optimierung. Spezialisiert auf hochkonvertierende Websites.',
  },
];

export function AboutSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section id="ueber-uns" ref={ref} className="py-32 bg-white" aria-labelledby="about-heading">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 id="about-heading" className="text-4xl lg:text-5xl font-bold mb-6 text-gray-900">
            Wer hinter{' '}
            <span className="bg-gradient-to-r from-[#8b5cf6] to-[#22d3ee] bg-clip-text text-transparent">
              Cogniiq
            </span>{' '}
            steckt
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* === About-Text-Block === */}
            <div className="space-y-3 text-base text-gray-600 leading-relaxed">
              <p className="text-lg font-semibold text-gray-800">
                Über Cogniiq
              </p>

              <p>
                Cogniiq wurde 2025 von Lazar und Djordje Popovic in Bayreuth gegründet. Unser Fokus: digitale Lösungen, die messbar mehr Anfragen und Umsatz bringen – nicht nur schöne Optik.
              </p>

              <p>
                Wir arbeiten vor allem mit Praxen, Architekturbüros, Ingenieuren und anderen hochwertigen Dienstleistern in ganz Deutschland.
              </p>

              <p className="mt-2">
                Was uns ausmacht:
              </p>

              <ul className="list-disc list-inside space-y-1">
                <li>Fokus auf Ergebnisse statt Buzzwords</li>
                <li>Website, KI-Automationen und AI-Rezeptionisten aus einem Guss</li>
                <li>Persönliche Betreuung direkt durch Lazar &amp; Djordje – keine Massenabfertigung</li>
              </ul>

              <p className="mt-2">
                Ziel: Ihre Online-Präsenz soll Ihnen täglich neue Patienten, Mandanten oder Kunden bringen – klar messbar und zuverlässig.
              </p>
            </div>
            {/* === Ende About-Text-Block === */}

            <div className="space-y-6">
              {highlights.map((highlight, index) => {
                const Icon = highlight.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -30 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="p-2 rounded-lg bg-gradient-to-br from-[#8b5cf6]/20 to-[#22d3ee]/20 flex-shrink-0">
                      <Icon className="w-5 h-5 text-[#8b5cf6]" />
                    </div>
                    <p className="text-gray-700 leading-relaxed">{highlight.text}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            {founders.map((founder, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.4 + index * 0.2 }}
                className="group relative bg-gray-50 rounded-2xl p-8 border border-gray-200 hover:border-[#8b5cf6]/50 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#22d3ee] flex items-center justify-center text-2xl font-bold"
                    aria-hidden="true"
                  >
                    {founder.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {founder.name}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {founder.role}
                    </p>
                  </div>
                </div>

                <div className="absolute -bottom-px -right-px w-24 h-24 bg-gradient-to-br from-[#8b5cf6] to-[#22d3ee] rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
