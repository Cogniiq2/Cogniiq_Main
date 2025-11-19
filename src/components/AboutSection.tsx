import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Target, Wrench, Award } from 'lucide-react';

const highlights = [
  {
    icon: Target,
    text: 'Seit 2020 Fokus auf hochkonvertierende Websites, KI Automationen und AI-Lösungen, die vom ersten Tag an messbar sind.',
  },
  {
    icon: Wrench,
    text: 'Expertise in bewährten Technologien: Make.com, n8n, Vapi, Cal.com, Google Workspace und modernen Webdesign-Frameworks.',
  },
  {
    icon: Award,
    text: 'Ausgewählte Projekte statt Massenabfertigung. Persönliche Betreuung aus Bayreuth für ganz Deutschland.',
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
            <p className="text-lg text-gray-600 leading-relaxed">
             Über Cogniiq</p>
Cogniiq wurde 2025 von Lazar und Djordje Popovic in Bayreuth gegründet. Unser Fokus: digitale Lösungen, die messbar mehr Anfragen und Umsatz bringen – nicht nur schöne Optik.</p>
Wir arbeiten vor allem mit Praxen, Architekturbüros, Ingenieuren und anderen hochwertigen Dienstleistern in ganz Deutschland.</p>
Was uns ausmacht:</p>
• Fokus auf Ergebnisse statt Buzzwords</p>
• Website, KI-Automationen und AI-Rezeptionisten aus einem Guss</p>
• Persönliche Betreuung direkt durch Lazar & Djordje, keine Massenabfertigung</p>
Unser Ziel: Ihre Online-Präsenz soll Ihnen täglich neue Patienten, Mandanten oder Kunden bringen – klar messbar und zuverlässig.</p>
            </p>

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
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#22d3ee] flex items-center justify-center text-2xl font-bold" aria-hidden="true">
                    {founder.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {founder.name}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{founder.role}</p>
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
