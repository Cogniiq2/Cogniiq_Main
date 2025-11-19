import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Globe, Zap, Headphones, Sparkles, ArrowRight } from 'lucide-react';

const services = [
  {
    icon: Globe,
    title: 'Webdesign für lokale Unternehmen',
    description:
      'Hochkonvertierende Websites für Unternehmen in Deutschland. Kein Template-Design, sondern individueller Markenaufbau mit Fokus auf Performance und Conversion.',
    features: [
      'SEO-optimiertes Webdesign mit erstklassiger User Experience',
      'Mobile-first, blitzschnelle Ladezeiten, Google-optimiert',
      'Einfache Pflege durch CMS-Integration ohne technische Hürden',
    ],
    gradient: 'from-[#8b5cf6] to-[#7c3aed]',
  },
  {
    icon: Zap,
    title: 'KI Automationen & Workflows',
    description:
      'Intelligente Prozessautomatisierung mit Make.com und n8n. Wir verbinden Ihre Tools und automatisieren Buchungen, Leads und Geschäftsprozesse für mehr Effizienz.',
    features: [
      'Make.com und n8n Automationen für Buchungssysteme, Lead-Generierung und Rechnungsstellung',
      'Nahtlose Integration mit Google Calendar, Gmail, PayPal, Stripe, CRM-Systemen',
      'Professionelles Monitoring und Fehlerbehandlung für zuverlässige Abläufe',
    ],
    gradient: 'from-[#22d3ee] to-[#06b6d4]',
  },
  {
    icon: Headphones,
    title: 'AI Rezeptionistin',
    description:
      'Ihr digitaler Mitarbeiter für Telefon und Chat. Die AI Rezeptionistin arbeitet 24/7, beantwortet Kundenanfragen und bucht Termine – zuverlässig und freundlich.',
    features: [
      'AI Chatbot für Unternehmen: Telefon- und Chat-Assistent für Kliniken, Restaurants und Dienstleister',
      'Automatisierte Buchung, Umbuchung, Stornierung und FAQ-Beantwortung',
      'Deutschsprachig trainiert, angepasst an Ihre Prozesse und Unternehmenstonalität',
    ],
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Sparkles,
    title: 'AI Content Erstellung',
    description:
      'Professionelle Content-Erstellung mit Künstlicher Intelligenz. Kampagnen-Content, der Ihre Marke stärkt – skalierbar, konsistent und conversion-optimiert.',
    features: [
      'AI-generierte Produkt- und Kampagnenbilder im Corporate Design Ihres Unternehmens',
      'Conversion-optimierte Texte für Landingpages und Werbekampagnen',
      'Social Media Content-Pakete für konsistente Online-Präsenz',
    ],
    gradient: 'from-violet-500 to-fuchsia-500',
  },
];

export function ServicesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section id="leistungen" ref={ref} className="py-32 bg-gray-50" aria-labelledby="services-heading">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
        <h2 id="services-heading" className="text-4xl lg:text-5xl font-bold mb-6 text-gray-900">
  Was wir für Sie umsetzen
</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Vier Kernleistungen unserer AI und Webdesign Agentur aus Bayreuth
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                whileHover={{ scale: 1.02, y: -4 }}
                className="group relative bg-white rounded-2xl p-8 border border-gray-200 hover:border-[#8b5cf6]/50 hover:shadow-xl transition-all duration-300"
              >
                <div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
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

                  <ul className="space-y-3 mb-6">
                    {service.features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="flex items-start gap-3 text-gray-700"
                      >
                        <div
                          className={`mt-1 w-1.5 h-1.5 rounded-full bg-gradient-to-r ${service.gradient} flex-shrink-0`}
                        />
                        <span className="text-sm leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => {
                      const element = document.querySelector('#kontakt');
                      if (element) element.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#8b5cf6] transition-colors group/link"
                    aria-label={`Kontakt aufnehmen für ${service.title}`}
                  >
                    Mehr zu dieser Leistung
                    <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" aria-hidden="true" />
                  </button>
                </div>

                <div
                  className={`absolute -bottom-px -right-px w-32 h-32 bg-gradient-to-br ${service.gradient} rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
