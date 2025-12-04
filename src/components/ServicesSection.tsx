import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { MonitorSmartphone, PhoneCall, Bot, Workflow } from 'lucide-react';

const services = [
  {
    title: 'High-End Websites',
    description:
      'Premium Webauftritte, die aussehen wie eine Million Euro – mit Fokus auf Conversion, Geschwindigkeit und Mobile-Optimierung.',
    icon: MonitorSmartphone,
    gradient: 'from-[#8b5cf6] to-[#ec4899]',
    features: [
      'Individuelles Design statt Baukasten',
      'Ultra-schnelle Ladezeiten (Core Web Vitals)',
      'SEO-Struktur für maximale Sichtbarkeit',
      'Direkte Integration von Buchung & Kontakt',
    ],
  },
  {
    title: 'AI Telefon-Reception',
    description:
      '24/7 digitale Rezeption, die Anrufe annimmt, Termine bucht, absagt und Fragen beantwortet – ohne Wartezeit.',
    icon: PhoneCall,
    gradient: 'from-[#22c55e] to-[#14b8a6]',
    features: [
      'Anrufannahme in natürlicher Sprache',
      'Terminbuchung & -änderung in Echtzeit',
      'Praxis- / Restaurant- / Studio-Logik integriert',
      'Nahtlose Anbindung an Kalender & CRM',
    ],
  },
  {
    title: 'AI Chatbots & Concierge',
    description:
      'Intelligente Chatbots für Web, WhatsApp & Social – verkaufen, beraten und qualifizieren Leads vollautomatisch.',
    icon: Bot,
    gradient: 'from-[#0ea5e9] to-[#6366f1]',
    features: [
      'On-Brand Antworten mit Ihrem Wording',
      'Lead-Qualifizierung & Übergabe an Team',
      'Mehrsprachige Kommunikation',
      'Integration in bestehende Systeme',
    ],
  },
  {
    title: 'Automationen & n8n Workflows',
    description:
      'Wir verbinden Ihre Tools zu einem System, das im Hintergrund arbeitet – während Sie Umsatz machen.',
    icon: Workflow,
    gradient: 'from-[#f97316] to-[#e11d48]',
    features: [
      'n8n & Make Szenarien für Ihre Prozesse',
      'Reporting, Alerts & Monitoring',
      'Automatisierte E-Mails, Reviews & Follow-ups',
      'Zuverlässige, skalierbare Infrastruktur',
    ],
  },
];

export function ServicesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section id="leistungen" ref={ref} className="py-32 bg-white" aria-labelledby="services-heading">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2
            id="services-heading"
            className="text-4xl lg:text-5xl font-bold mb-6 text-gray-900"
          >
            Was wir für Sie bauen
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Fokus: mehr Umsatz, mehr Anfragen, weniger manuelle Arbeit. Alles,
            was wir entwickeln, zahlt direkt auf diese Ziele ein.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {services.map((service, index) => {
            const Icon = service.icon;
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
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                />

                <div className="relative flex items-start gap-6">
                  <div
                    className={`p-4 rounded-xl bg-gradient-to-br ${service.gradient} flex-shrink-0`}
                    aria-hidden="true"
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-3 text-gray-900">
                      {service.title}
                    </h3>
                    <p className="text-gray-600 mb-6 leading-relaxed text-sm">
                      {service.description}
                    </p>

                    <div className="space-y-2">
                      {service.features.map((feature, featureIndex) => (
                        <div
                          key={featureIndex}
                          className="flex items-center gap-2"
                        >
                          <div
                            className={`w-1 h-1 rounded-full bg-gradient-to-r ${service.gradient}`}
                          />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div
                  className={`absolute -bottom-px -right-px w-24 h-24 bg-gradient-to-br ${service.gradient} rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
