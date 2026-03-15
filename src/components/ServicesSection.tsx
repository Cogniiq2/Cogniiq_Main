import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { MonitorSmartphone, PhoneCall, Bot, Workflow, ArrowRight, CircleCheck as CheckCircle, TrendingUp } from 'lucide-react';

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
    title: 'Websites, die Anfragen generieren',
    description:
      'Kein Baukasten, kein Standard-Theme. Entwickelt auf Basis Ihres Conversion-Ziels – mit SEO-Architektur, Core Web Vitals und klarer Nutzerführung.',
    icon: MonitorSmartphone,
    link: '/leistungen',
    cityLinks: [
      { label: 'Bayreuth', href: '/bayreuth/webdesign' },
      { label: 'München', href: '/muenchen/webdesign' },
      { label: 'Regensburg', href: '/regensburg/webdesign' },
    ],
    features: [
      'Individuelles Design ohne Templates',
      'Core Web Vitals optimiert – messbar schnell',
      'SEO-Architektur für lokale Sichtbarkeit',
      'Buchung, Kontaktformular & CRM integriert',
    ],
    roi: { value: '3×', label: 'mehr qualifizierte Anfragen' },
    result: 'Ø +340% mehr organische Anfragen nach 90 Tagen',
    cta: 'Website anfragen',
    featured: false,
  },
  {
    number: '02',
    title: 'KI-Telefonassistent',
    description:
      'Nimmt jeden Anruf entgegen, bucht Termine und beantwortet Fragen – vollautomatisch, in natürlicher Sprache, rund um die Uhr. Kein Anruf geht verloren.',
    icon: PhoneCall,
    link: '/ki-telefonassistent',
    cityLinks: [
      { label: 'Bayreuth', href: '/bayreuth/ki-telefonassistent' },
      { label: 'München', href: '/muenchen/ki-telefonassistent' },
      { label: 'Regensburg', href: '/regensburg/ki-telefonassistent' },
    ],
    features: [
      'Anrufannahme in natürlicher Sprache',
      'Terminbuchung & -änderung in Echtzeit',
      'Nahtlose Anbindung an Kalender & CRM',
      'DSGVO-konform · Made in Germany · 24/7',
    ],
    roi: { value: '100%', label: 'Anrufe beantwortet' },
    result: 'Kein verpasster Anruf — 24/7 aktiv',
    cta: 'Demo ansehen',
    featured: true,
  },
  {
    number: '03',
    title: 'AI-Chatbot & digitaler Berater',
    description:
      'Qualifiziert Leads, beantwortet Anfragen und übergibt an Ihr CRM – automatisch und on-brand. Auf Web, WhatsApp und Social Media.',
    icon: Bot,
    link: '/leistungen',
    cityLinks: [],
    features: [
      'Antworten in Ihrem Wording & Stil',
      'Lead-Qualifizierung mit CRM-Übergabe',
      'Mehrsprachig – DE, EN, weitere',
      'Integration in bestehende Systeme',
    ],
    roi: { value: '67%', label: 'mehr Lead-Qualifikation' },
    result: 'Ø 67% höhere Lead-Qualität durch automatische Vorqualifizierung',
    cta: 'Mehr erfahren',
    featured: false,
  },
  {
    number: '04',
    title: 'Automationen & operative Workflows',
    description:
      'Verbindet Ihre Tools zu einem System, das im Hintergrund entscheidet und handelt – Follow-ups, Benachrichtigungen, Berichte, API-Integrationen.',
    icon: Workflow,
    link: '/leistungen',
    cityLinks: [
      { label: 'Bayreuth', href: '/bayreuth/automatisierung' },
      { label: 'München', href: '/muenchen/automatisierung' },
      { label: 'Regensburg', href: '/regensburg/automatisierung' },
    ],
    features: [
      'Maßgeschneiderte Workflows für Ihre Prozesse',
      'Automatisierte Follow-ups, Reviews, E-Mails',
      'Reporting, Alerts & Monitoring',
      'Skalierbare, wartungsarme Infrastruktur',
    ],
    roi: { value: '18h', label: 'pro Woche eingespart' },
    result: 'Ø 18 Stunden Handarbeit/Woche werden vollständig eliminiert',
    cta: 'Workflows besprechen',
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
              Vier Systeme,
              <br />
              <span className="text-gray-300">die täglich für Sie arbeiten.</span>
            </h2>
          </motion.div>
          <motion.div
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            variants={fadeUp}
            custom={0.1}
            className="flex flex-col gap-3 max-w-sm"
          >
            <p className="text-[14.5px] text-gray-500 leading-relaxed">
              Kein System für sich allein. Jedes Stück zahlt direkt auf Anfragen, Buchungen
              und weniger manuelle Arbeit ein.
            </p>
            <Link
              to="/leistungen"
              className="font-medium text-[13px] text-gray-700 hover:text-gray-900 transition-colors underline underline-offset-2 decoration-gray-200 w-fit"
            >
              Alle Details & Preise ansehen →
            </Link>
          </motion.div>
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
                  <span className="absolute top-8 right-8 text-[9px] font-semibold uppercase tracking-[0.15em] px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-400/20 text-sky-300">
                    Meistgebucht
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
                      className={service.featured ? 'text-white/40' : 'text-gray-500'}
                    />
                  </div>
                  <span
                    className={`text-[11px] font-bold tracking-[0.22em] tabular-nums ${
                      service.featured ? 'text-white/10' : 'text-gray-200'
                    }`}
                  >
                    {service.number}
                  </span>
                </div>

                <h3
                  className={`text-[18px] font-bold mb-3 leading-snug tracking-tight ${
                    service.featured ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {service.title}
                </h3>

                <p
                  className={`text-[13.5px] leading-relaxed mb-5 ${
                    service.featured ? 'text-gray-500' : 'text-gray-500'
                  }`}
                >
                  {service.description}
                </p>

                {/* ROI highlight */}
                <div className={`flex items-center gap-3 mb-6 px-4 py-2.5 rounded-xl ${
                  service.featured
                    ? 'bg-white/[0.04] border border-white/[0.06]'
                    : 'bg-gray-50 border border-gray-100'
                }`}>
                  <TrendingUp size={13} className={service.featured ? 'text-emerald-400' : 'text-emerald-500'} />
                  <div>
                    <span className={`text-[20px] font-bold tracking-tight tabular-nums ${
                      service.featured ? 'text-white/80' : 'text-gray-900'
                    }`}>{service.roi.value}</span>
                    <span className={`text-[12px] ml-2 ${
                      service.featured ? 'text-gray-500' : 'text-gray-500'
                    }`}>{service.roi.label}</span>
                  </div>
                </div>

                <div className="space-y-2.5 mb-7">
                  {service.features.map((feature, fi) => (
                    <div key={fi} className="flex items-center gap-2.5">
                      <CheckCircle
                        size={11}
                        className={`flex-shrink-0 ${service.featured ? 'text-emerald-400/60' : 'text-emerald-500'}`}
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
                    className={`pt-4 border-t mb-6 ${
                      service.featured ? 'border-white/[0.06]' : 'border-gray-100'
                    }`}
                  >
                    <p
                      className={`text-[10px] font-semibold uppercase tracking-[0.15em] mb-2.5 ${
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
                          className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all ${
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

                {/* Result proof bar */}
                <div className={`flex items-start gap-2 mb-6 text-[11.5px] leading-snug ${
                  service.featured ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  <span className="flex-shrink-0 mt-px">✦</span>
                  <span>{service.result}</span>
                </div>

                <Link
                  to={service.link}
                  className={`group/link inline-flex items-center gap-2 text-[12.5px] font-semibold transition-all px-5 py-2.5 rounded-xl border ${
                    service.featured
                      ? 'bg-white text-gray-900 border-white hover:bg-gray-100'
                      : 'bg-gray-950 text-white border-gray-950 hover:bg-gray-800'
                  }`}
                >
                  {service.cta}
                  <ArrowRight
                    size={12}
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
