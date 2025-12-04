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
                whileHover={{ y: -6, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className="group relative overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur-xl px-6 py-7 flex flex-col"
              >
                {/* subtle gradient aura on hover */}
                <div
                  className={`pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                />

                <div className="relative z-10 flex flex-col gap-6">
                  {/* top row: icon + title */}
                  <div className="flex items-center gap-4">
                    <div
                      className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${service.gradient} shadow-lg shadow-black/10`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                        {service.title}
                      </h3>
                    </div>
                  </div>

                  {/* description */}
                  <p className="text-sm leading-relaxed text-slate-600">
                    {service.description}
                  </p>

                  {/* divider */}
                  <div className="h-px w-full bg-gradient-to-r from-slate-200/60 via-slate-100 to-slate-200/60" />

                  {/* features, more compact, less vertical stretch */}
                  <ul className="space-y-2.5 text-sm">
                    {service.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2.5 text-slate-700"
                      >
                        <div
                          className={`mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gradient-to-r ${service.gradient}`}
                        />
                        <span className="leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* bottom glow */}
                <div
                  className={`pointer-events-none absolute -bottom-10 inset-x-10 h-24 bg-gradient-to-br ${service.gradient} blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-700`}
                />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
