import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Target, Wrench, Award } from 'lucide-react';

const highlights = [
  {
    icon: Target,
    text: 'Seit 2025 konsequenter Fokus auf hochkonvertierende Websites, KI-Automationen und AI-Systeme, die messbar Resultate liefern – nicht nur Eindruck.',
  },
  {
    icon: Wrench,
    text: 'Technische Präzision: Make.com, n8n, Vapi, Cal.com, Google Workspace und moderne Web-Frameworks auf Enterprise-Niveau.',
  },
  {
    icon: Award,
    text: 'Wenige, ausgewählte Projekte. Absolute Qualität statt Masse. Direkte Zusammenarbeit aus Bayreuth für Unternehmen in ganz Deutschland.',
  },
];

const founders = [
  {
    name: 'Lazar Popovic',
    role: 'Co-Founder: AI-Automationen, KI-Workflows & technische Integrationen. Spezialisiert auf Make.com und n8n – von Strategy bis Implementation.',
  },
  {
    name: 'Djordje Popovic',
    role: 'Co-Founder: Webdesign, System-Architektur & Performance-Optimierung. Baut Websites, die nicht nur schön aussehen – sondern Umsatz erzeugen.',
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
        <h2
  id="about-heading"
  className="text-4xl lg:text-5xl font-bold mb-6 text-gray-900"
>
  Wer hinter{' '}
  <span className="tracking-tight">
    <span style={{ color: '#1C2327' }}>Cogni</span>
    <span style={{ color: '#515A61' }}>IQ</span>
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
              Cogniiq wurde 2025 von <strong>Lazar und Djordje Popovic</strong> in <strong>Bayreuth</strong> gegründet.
              Die Vision: Technologie so einsetzen, dass sie echte Business-Resultate erzeugt – klar, präzise und ohne
              unnötige Komplexität.  
              <br /><br />
              Heute verbindet Cogniiq erstklassiges Webdesign mit modernster AI-Automatisierung. Unternehmen in ganz Deutschland
              profitieren von Websites, die verkaufen – und Systemen, die Arbeit automatisieren.
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
                    <div className="p-2 rounded-lg bg-gray-200/40 flex-shrink-0">
                      <Icon className="w-5 h-5 text-[#515A61]" />
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
                className="group relative bg-gray-50 rounded-2xl p-8 border border-gray-200 hover:border-[#515A61]/50 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#515A61] flex items-center justify-center text-2xl font-bold text-white">
                    {founder.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {founder.name}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{founder.role}</p>
                  </div>
                </div>

                <div className="absolute -bottom-px -right-px w-24 h-24 bg-[#515A61] rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
