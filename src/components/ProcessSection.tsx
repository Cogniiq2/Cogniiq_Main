import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { MessageSquare, FileText, Cog, Rocket } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: MessageSquare,
    title: 'Kennenlernen & Zieldefinition',
    description:
      'Kurzes Erstgespräch (30–45 Minuten), in dem wir dein Geschäftsmodell, deine Ziele und deinen Status Quo verstehen.',
  },
  {
    number: '02',
    icon: FileText,
    title: 'Konzept & Angebot',
    description:
      'Wir skizzieren Website/Automation/AI-Setup und erstellen ein klares, individuelles Angebot – ohne versteckte Kosten.',
  },
  {
    number: '03',
    icon: Cog,
    title: 'Umsetzung & Feinschliff',
    description:
      'Umsetzung in klaren Sprints, regelmäßige Zwischenstände, Feedbackrunden, Tests. Fokus auf Performance und Stabilität.',
  },
  {
    number: '04',
    icon: Rocket,
    title: 'Go-Live & Optimierung',
    description:
      'Launch, Monitoring und Optimierung auf das, was zählt: Anfragen, Buchungen, Umsatz – nicht nur Pixel.',
  },
];

export function ProcessSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section id="ablauf" ref={ref} className="py-32 bg-gray-50" aria-labelledby="process-heading">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 id="process-heading" className="text-4xl lg:text-5xl font-bold mb-6 text-gray-900">
            So arbeiten wir{' '}
            <span className="bg-gradient-to-r from-[#D4AF37] to-[#C9A961] bg-clip-text text-transparent">
              zusammen
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transparenter Prozess: Von der ersten Anfrage bis zum erfolgreichen Go-Live
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className="relative group"
              >
                <div className="relative bg-white rounded-2xl p-6 border border-gray-200 hover:border-[#D4AF37]/50 hover:shadow-xl transition-all duration-300 h-full">
                  <div className="absolute -top-4 -left-4 text-6xl font-bold text-gray-200">
                    {step.number}
                  </div>

                  <div className="relative">
                    <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#C9A961] mb-4" aria-hidden="true">
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    <h3 className="text-lg font-bold mb-3 text-gray-900">
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>

                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-px bg-gradient-to-r from-gray-300 to-transparent" />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
