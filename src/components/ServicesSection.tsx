import { motion } from 'framer-motion';
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
  return (
    <section id="leistungen" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl"
        >
          <p className="text-sm font-medium tracking-[0.2em] uppercase text-violet-500">
            Leistungen
          </p>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold text-gray-900">
            Was wir für Sie bauen
          </h2>
          <p className="mt-4 text-gray-600">
            Fokus: mehr Umsatz, mehr Anfragen, weniger manuelle Arbeit. Alles,
            was wir entwickeln, zahlt direkt auf diese Ziele ein.
          </p>
        </motion.div>

        <motion.div
          className="mt-12 grid gap-8 md:grid-cols-2 xl:grid-cols-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            hidden: { opacity: 0, y: 24 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { staggerChildren: 0.08 },
            },
          }}
        >
          {services.map((service) => {
            const Icon = service.icon;

            return (
              <motion.div
                key={service.title}
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  visible: { opacity: 1, y: 0 },
                }}
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="group relative bg-white rounded-2xl p-8 border border-gray-200 hover:border-violet-400/60 hover:shadow-xl transition-all duration-300"
              >
                <div
                  className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                />

                <div className="relative">
                  <div
                    className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${service.gradient} mb-6`}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold mb-3 text-gray-900">
                    {service.title}
                  </h3>

                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {service.description}
                  </p>

                  <ul className="space-y-3">
                    {service.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-3 text-gray-700"
                      >
                        <div
                          className={`mt-1 w-1.5 h-1.5 rounded-full bg-gradient-to-r ${service.gradient} flex-shrink-0`}
                        />
                        <span className="text-sm leading-relaxed">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div
                  className={`pointer-events-none absolute -bottom-px -right-px w-32 h-32 bg-gradient-to-br ${service.gradient} rounded-full blur-3xl opacity-0 group-hover:opacity-25 transition-opacity duration-500`}
                />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}