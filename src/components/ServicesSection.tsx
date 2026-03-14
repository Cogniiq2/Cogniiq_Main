import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { MonitorSmartphone, PhoneCall, Bot, Workflow, ArrowRight } from 'lucide-react';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay, ease: EASE },
  }),
};

const services = [
  {
    number: '01',
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
    number: '02',
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
    number: '03',
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
    number: '04',
    title: 'Automationen & Workflows',
    description:
      'Wir verbinden Ihre Tools zu einem System, das im Hintergrund arbeitet – maßgeschneiderte Workflows und direkte API-Integrationen.',
    icon: Workflow,
    link: '/leistungen',
    cityLinks: [
      { label: 'Automatisierung Bayreuth', href: '/bayreuth/automatisierung' },
      { label: 'Automatisierung München', href: '/muenchen/automatisierung' },
      { label: 'Automatisierung Regensburg', href: '/regensburg/automatisierung' },
    ],
    features: [
      'Individuelle Workflow-Szenarien für Ihre Prozesse',
      'Automatisierte E-Mails, Reviews & Follow-ups',
      'Reporting, Alerts & Monitoring',
      'Zuverlässige, skalierbare Infrastruktur',
    ],
    featured: false,
  },
];

export function ServicesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.08 });

  return (
    <section
      id="leistungen"
      ref={ref}
      className="py-28 bg-white"
      aria-labelledby="services-heading"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-20">
          <motion.div
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            variants={fadeUp}
            custom={0}
            className="max-w-xl"
          >
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-gray-400 mb-5">
              Leistungen
            </p>
            <h2
              id="services-heading"
              className="text-4xl lg:text-5xl font-bold text-gray-900 leading-[1.08] tracking-tight"
            >
              Vier Systeme.
              <br />
              <span className="text-gray-300">Ein Ziel: Wachstum.</span>
            </h2>
          </motion.div>
          <motion.p
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            variants={fadeUp}
            custom={0.1}
            className="text-base text-gray-500 leading-relaxed max-w-sm"
          >
            Alles zahlt direkt auf Umsatz, Anfragen und weniger manuelle Arbeit ein.{' '}
            <Link
              to="/leistungen"
              className="font-medium text-gray-700 hover:text-gray-900 transition-colors underline underline-offset-2 decoration-gray-200"
            >
              Alle Leistungen ansehen
            </Link>
            .
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-2 border border-gray-100 rounded-2xl overflow-hidden">
          {services.map((service, index) => {
            const Icon = service.icon;
            const isRight = index % 2 === 1;
            const isBottom = index >= 2;
            return (
              <motion.article
                key={index}
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
                variants={fadeUp}
                custom={index * 0.08}
                className={`relative group p-10 transition-colors duration-300 ${
                  service.featured ? 'bg-gray-950' : 'bg-white hover:bg-gray-50/50'
                } ${isRight ? 'border-l border-gray-100' : ''} ${
                  isBottom ? 'border-t border-gray-100' : ''
                }`}
              >
                {service.featured && (
                  <span className="absolute top-8 right-8 text-[9px] font-semibold uppercase tracking-[0.15em] px-2.5 py-1 rounded-full border border-white/[0.08] text-white/30">
                    Beliebt
                  </span>
                )}

                <div className="flex items-start justify-between mb-8">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      service.featured
                        ? 'bg-white/[0.06] border border-white/[0.08]'
                        : 'bg-gray-100 group-hover:bg-gray-200 transition-colors'
                    }`}
                  >
                    <Icon
                      size={17}
                      className={service.featured ? 'text-white/50' : 'text-gray-500'}
                    />
                  </div>
                  <span
                    className={`text-[11px] font-bold tracking-[0.22em] tabular-nums ${
                      service.featured ? 'text-white/15' : 'text-gray-200'
                    }`}
                  >
                    {service.number}
                  </span>
                </div>

                <h3
                  className={`text-[19px] font-bold mb-3 leading-snug tracking-tight ${
                    service.featured ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {service.title}
                </h3>

                <p
                  className={`text-[13.5px] leading-relaxed mb-7 ${
                    service.featured ? 'text-gray-500' : 'text-gray-500'
                  }`}
                >
                  {service.description}
                </p>

                <div className="space-y-2.5 mb-8">
                  {service.features.map((feature, fi) => (
                    <div key={fi} className="flex items-center gap-3">
                      <div
                        className={`w-[3px] h-[3px] rounded-full flex-shrink-0 ${
                          service.featured ? 'bg-gray-600' : 'bg-gray-300'
                        }`}
                      />
                      <span
                        className={`text-[13px] ${
                          service.featured ? 'text-gray-400' : 'text-gray-600'
                        }`}
                      >
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {service.cityLinks.length > 0 && (
                  <div
                    className={`pt-5 border-t mb-7 ${
                      service.featured ? 'border-white/[0.06]' : 'border-gray-100'
                    }`}
                  >
                    <p
                      className={`text-[10px] font-semibold uppercase tracking-[0.15em] mb-3 ${
                        service.featured ? 'text-gray-700' : 'text-gray-300'
                      }`}
                    >
                      Verfügbar in
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {service.cityLinks.map((cl) => (
                        <Link
                          key={cl.href}
                          to={cl.href}
                          className={`text-[11.5px] font-medium px-3 py-1.5 rounded-lg border transition-all ${
                            service.featured
                              ? 'border-white/[0.07] text-gray-500 hover:border-white/15 hover:text-gray-300'
                              : 'border-gray-100 text-gray-500 hover:border-gray-300 hover:text-gray-800'
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
                  className={`group/link inline-flex items-center gap-2 text-[12.5px] font-semibold transition-all ${
                    service.featured
                      ? 'text-white/50 hover:text-white'
                      : 'text-gray-400 hover:text-gray-900'
                  }`}
                >
                  Mehr erfahren
                  <ArrowRight
                    size={13}
                    className="transition-transform duration-200 group-hover/link:translate-x-1"
                  />
                </Link>
              </motion.article>
            );
          })}
        </div>

        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={fadeUp}
          custom={0.4}
          className="mt-8 flex justify-center"
        >
          <Link
            to="/leistungen"
            className="group inline-flex items-center gap-2 text-[13px] font-semibold text-gray-400 hover:text-gray-900 transition-colors"
          >
            Alle Leistungen & Details ansehen
            <ArrowRight
              size={13}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
