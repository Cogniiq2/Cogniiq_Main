import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { MonitorSmartphone, PhoneCall, Bot, Workflow, ArrowRight } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

const services = [
  {
    title: 'High-End Websites',
    description:
      'Premium-Webauftritte mit Fokus auf Conversion, Core Web Vitals und organische Sichtbarkeit. Individuell – kein Baukasten.',
    icon: MonitorSmartphone,
    link: '/leistungen',
    cityLinks: [
      { label: 'Webdesign Bayreuth', href: '/bayreuth/webdesign' },
      { label: 'Webdesign München', href: '/muenchen/webdesign' },
      { label: 'Webdesign Regensburg', href: '/regensburg/webdesign' },
    ],
    features: [
      'Individuelles Design – kein Template',
      'Ultra-schnelle Ladezeiten (Core Web Vitals)',
      'SEO-Architektur für maximale Sichtbarkeit',
      'Integration von Buchung, Kontakt & CRM',
    ],
    featured: false,
  },
  {
    title: 'KI Telefonassistent',
    description:
      '24/7 digitale Rezeption – nimmt Anrufe an, bucht Termine, beantwortet Fragen. Vollautomatisch, in natürlicher Sprache.',
    icon: PhoneCall,
    link: '/ki-telefonassistent',
    cityLinks: [
      { label: 'KI-Telefon Bayreuth', href: '/bayreuth/ki-telefonassistent' },
      { label: 'KI-Telefon München', href: '/muenchen/ki-telefonassistent' },
      { label: 'KI-Telefon Regensburg', href: '/regensburg/ki-telefonassistent' },
    ],
    features: [
      'Anrufannahme in natürlicher Sprache',
      'Terminbuchung & -änderung in Echtzeit',
      'Nahtlose Anbindung an Kalender & CRM',
      'DSGVO-konform, Made in Germany',
    ],
    featured: true,
  },
  {
    title: 'AI Chatbots & Concierge',
    description:
      'Intelligente Chatbots für Web, WhatsApp & Social. Verkaufen, beraten, qualifizieren – vollautomatisch und on-brand.',
    icon: Bot,
    link: '/leistungen',
    cityLinks: [],
    features: [
      'On-Brand Antworten mit Ihrem Wording',
      'Lead-Qualifizierung & CRM-Übergabe',
      'Mehrsprachige Kommunikation',
      'Integration in bestehende Systeme',
    ],
    featured: false,
  },
  {
    title: 'Automationen & Workflows',
    description:
      'Wir verbinden Ihre Tools zu einem System, das im Hintergrund arbeitet – Make, n8n, Zapier und maßgeschneiderte Flows.',
    icon: Workflow,
    link: '/leistungen',
    cityLinks: [
      { label: 'Automatisierung Bayreuth', href: '/bayreuth/automatisierung' },
      { label: 'Automatisierung München', href: '/muenchen/automatisierung' },
      { label: 'Automatisierung Regensburg', href: '/regensburg/automatisierung' },
    ],
    features: [
      'n8n & Make Szenarien für Ihre Prozesse',
      'Automatisierte E-Mails, Reviews & Follow-ups',
      'Reporting, Alerts & Monitoring',
      'Zuverlässige, skalierbare Infrastruktur',
    ],
    featured: false,
  },
];

export function ServicesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section
      id="leistungen"
      ref={ref}
      className="py-28 bg-gray-50 dark:bg-gray-900/40"
      aria-labelledby="services-heading"
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
            Leistungen
          </p>
          <h2
            id="services-heading"
            className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 leading-[1.08] tracking-tight mb-5"
          >
            Vier Systeme.
            <br />
            <span className="text-gray-400 dark:text-gray-600">Ein Ziel: Wachstum.</span>
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
            Alles, was wir entwickeln, zahlt direkt auf mehr Umsatz, mehr Anfragen und weniger manuelle Arbeit ein.
            {' '}
            <Link
              to="/leistungen"
              className="font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors underline underline-offset-2 decoration-gray-300 dark:decoration-gray-600"
            >
              Alle Leistungen ansehen
            </Link>
            .
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-5">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <motion.article
                key={index}
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
                variants={fadeUp}
                custom={index * 0.1}
                className={`relative group rounded-2xl border transition-all duration-300 overflow-hidden ${
                  service.featured
                    ? 'bg-gray-900 dark:bg-gray-800 border-gray-800 dark:border-gray-700'
                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                }`}
              >
                {service.featured && (
                  <div className="absolute top-5 right-5">
                    <span className="text-[9px] font-semibold uppercase tracking-[0.15em] px-2 py-1 rounded-full bg-white/10 text-white/60">
                      Beliebt
                    </span>
                  </div>
                )}

                <div className="p-8">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center mb-6 ${
                      service.featured
                        ? 'bg-white/10'
                        : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors'
                    }`}
                  >
                    <Icon
                      size={18}
                      className={service.featured ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'}
                    />
                  </div>

                  <h3
                    className={`text-xl font-bold mb-3 leading-snug ${
                      service.featured ? 'text-white' : 'text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    {service.title}
                  </h3>

                  <p
                    className={`text-sm leading-relaxed mb-6 ${
                      service.featured ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {service.description}
                  </p>

                  <div className="space-y-2 mb-7">
                    {service.features.map((feature, fi) => (
                      <div key={fi} className="flex items-center gap-2.5">
                        <div
                          className={`w-1 h-1 rounded-full flex-shrink-0 ${
                            service.featured ? 'bg-gray-500' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        />
                        <span
                          className={`text-sm ${
                            service.featured ? 'text-gray-300' : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {service.cityLinks.length > 0 && (
                    <div
                      className={`pt-5 border-t mb-6 ${
                        service.featured ? 'border-white/10' : 'border-gray-100 dark:border-gray-800'
                      }`}
                    >
                      <p
                        className={`text-[10px] font-semibold uppercase tracking-[0.15em] mb-2.5 ${
                          service.featured ? 'text-gray-600' : 'text-gray-300 dark:text-gray-600'
                        }`}
                      >
                        Verfügbar in
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {service.cityLinks.map((cl) => (
                          <Link
                            key={cl.href}
                            to={cl.href}
                            className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
                              service.featured
                                ? 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                          >
                            {cl.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  <Link
                    to={service.link}
                    className={`inline-flex items-center gap-2 text-sm font-semibold transition-all group/link ${
                      service.featured
                        ? 'text-white hover:gap-3'
                        : 'text-gray-900 dark:text-gray-100 hover:gap-3'
                    }`}
                  >
                    Mehr erfahren
                    <ArrowRight
                      size={14}
                      className="transition-transform duration-200 group-hover/link:translate-x-1"
                    />
                  </Link>
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
            to="/leistungen"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 px-6 py-3 rounded-xl"
          >
            Alle Leistungen & Details ansehen
            <ArrowRight size={14} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
