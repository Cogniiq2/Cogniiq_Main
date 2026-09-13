import { Link } from 'react-router-dom';
import { MonitorSmartphone, PhoneCall, Bot, Workflow, ArrowRight } from 'lucide-react';

import { IconTile, PubEyebrow, PubLinkButton } from '@/components/public/PublicUI';

// Typical starting situations; formerly the ProblemSection cards on the homepage.
// Kept as links so the problem pages stay reachable from the start page.
const situations = [
  { label: 'Verpasste Anrufe', href: '/verpasste-anrufe-verlust' },
  { label: 'Keine Anfragen über die Website', href: '/keine-anfragen-website' },
  { label: 'Zu viel manuelle Arbeit', href: '/zu-viel-manuelle-arbeit' },
  { label: 'Digitale Automatisierung im Unternehmen', href: '/digitale-automatisierung-unternehmen' },
];

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
    // No performance figures here: any number would imply a measured customer average.
    roi: { value: 'SEO-ready', label: 'ab dem ersten Entwurf' },
    result: 'Individuell entwickelt, auf lokale Sichtbarkeit und Conversion ausgelegt',
    cta: 'Website anfragen',
    featured: false,
  },
  {
    number: '02',
    title: 'KI-Telefonassistent',
    description:
      'Nimmt Anrufe entgegen, wenn Ihr Team gebunden ist – erfasst Terminwünsche nach Ihren Regeln und beantwortet Fragen in natürlicher Sprache, auch außerhalb der Öffnungszeiten.',
    icon: PhoneCall,
    link: '/ki-telefonassistent',
    cityLinks: [
      { label: 'Bayreuth', href: '/bayreuth/ki-telefonassistent' },
      { label: 'München', href: '/muenchen/ki-telefonassistent' },
      { label: 'Regensburg', href: '/regensburg/ki-telefonassistent' },
    ],
    features: [
      'Anrufannahme in natürlicher Sprache',
      'Terminwünsche und Änderungen sofort erfasst',
      'Anbindung an Kalender & CRM – vorab geprüft',
      'Erreichbar auch außerhalb der Öffnungszeiten',
    ],
    roi: { value: 'Auch nachts', label: 'Anrufannahme' },
    result: 'Der Assistent nimmt Anrufe auch außerhalb der Öffnungszeiten entgegen — abends, nachts und am Wochenende',
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
    roi: { value: 'CRM', label: 'Übergabe inklusive' },
    result: 'Anfragen werden automatisch vorqualifiziert und strukturiert übergeben',
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
    roi: { value: 'Automatisch', label: 'statt Handarbeit' },
    result: 'Wiederkehrende Abläufe laufen ohne manuelle Zwischenschritte',
    cta: 'Workflows besprechen',
    featured: false,
  },
];

export function ServicesSection() {
  return (
    <section id="leistungen" className="border-t border-pub-hairline-soft bg-white py-20 lg:py-28" aria-labelledby="services-heading">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-10">
        <div className="mb-10 flex flex-col gap-6 lg:mb-14 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <PubEyebrow className="mb-4">Leistungen</PubEyebrow>
            <h2 id="services-heading" className="text-[clamp(30px,3.2vw,40px)] font-bold leading-[1.1] tracking-[-0.02em] text-pub-ink">
              Vier Leistungen, die täglich für Sie arbeiten.
            </h2>
          </div>
          <PubLinkButton to="/leistungen" variant="secondary" size="md" icon={ArrowRight} iconTrailing className="self-start lg:self-auto">
            Alle Leistungen &amp; Details ansehen
          </PubLinkButton>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <article
                key={service.number}
                className={`flex flex-col rounded-2xl border p-6 sm:p-8 ${
                  service.featured
                    ? 'border-white/[0.06] bg-pub-ink text-white'
                    : 'border-pub-hairline bg-white'
                }`}
              >
                <div className="mb-5 flex items-center justify-between">
                  <IconTile icon={Icon} size="md" className={service.featured ? '!bg-white/[0.08] !text-white !ring-white/10' : ''} />
                  <span className={`text-[12px] font-semibold tabular-nums tracking-[0.14em] ${service.featured ? 'text-white/50' : 'text-pub-ink-3'}`}>
                    {service.number}
                  </span>
                </div>
                <h3 className={`mb-3 text-[22px] font-semibold leading-[1.25] tracking-[-0.012em] ${service.featured ? 'text-white' : 'text-pub-ink'}`}>
                  {service.title}
                </h3>
                <p className={`mb-6 text-[15px] leading-[1.6] ${service.featured ? 'text-white/75' : 'text-pub-ink-2'}`}>
                  {service.description}
                </p>
                <ul className={`mb-7 space-y-2 text-[14px] leading-snug ${service.featured ? 'text-white/70' : 'text-pub-ink-2'}`}>
                  {service.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <span className={`mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full ${service.featured ? 'bg-white/40' : 'bg-pub-ink/35'}`} aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-3">
                  <Link
                    to={service.link}
                    className={`inline-flex h-11 items-center gap-1.5 text-[14.5px] font-semibold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:rounded-full focus-visible:ring-2 focus-visible:ring-pub-signal focus-visible:ring-offset-2 ${service.featured ? 'text-white focus-visible:ring-offset-pub-ink' : 'text-pub-ink'}`}
                  >
                    {service.cta}
                    <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                  {service.cityLinks.length > 0 && (
                    <span className={`flex flex-wrap items-center gap-x-3 text-[13px] ${service.featured ? 'text-white/55' : 'text-pub-ink-3'}`}>
                      {service.cityLinks.map((cl) => (
                        <Link
                          key={cl.href}
                          to={cl.href}
                          className={`inline-flex h-11 items-center hover:underline focus-visible:outline-none focus-visible:rounded-full focus-visible:ring-2 focus-visible:ring-pub-signal focus-visible:ring-offset-2 ${service.featured ? 'hover:text-white focus-visible:ring-offset-pub-ink' : 'hover:text-pub-ink'}`}
                        >
                          {cl.label}
                        </Link>
                      ))}
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-pub-hairline-soft pt-8 sm:flex-row sm:items-center sm:gap-6">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-pub-ink-3">Typische Ausgangslagen</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-1">
            {situations.map((s) => (
              <li key={s.href}>
                <Link to={s.href} className="inline-flex h-11 items-center text-[14.5px] text-pub-ink-2 underline-offset-4 hover:text-pub-ink hover:underline focus-visible:outline-none focus-visible:rounded-full focus-visible:ring-2 focus-visible:ring-pub-signal focus-visible:ring-offset-2">
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
