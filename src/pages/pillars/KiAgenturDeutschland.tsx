import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Phone, CircleCheck as CheckCircle2, ChevronRight, Building2, Lightbulb, Zap, Shield, Clock, Users, TrendingUp } from "lucide-react";
import { PageSEO } from "@/components/PageSEO";
import { BUSINESS_INFO } from "@/lib/seo-data";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

const SERVICES = [
  {
    icon: Phone,
    title: "KI-Telefonassistent",
    description: "Automatische Anrufannahme, Terminbuchung und Weiterleitung – 24/7, mehrsprachig, DSGVO-konform. Kein verpasster Anruf, keine Warteschleife.",
    benefits: [
      "Einrichtung in 7–14 Tagen",
      "Integration in bestehende Kalender",
      "Mehrsprachig auf Anfrage",
    ],
  },
  {
    icon: Zap,
    title: "Prozessautomatisierung",
    description: "Wiederkehrende Prozesse automatisieren mit maßgeschneiderten Workflows und API-Integrationen. Für Unternehmen, die täglich Zeit durch manuelle Abläufe verlieren.",
    benefits: [
      "Quick-Win-Automatisierungen in 1–3 Wochen",
      "Vollständig dokumentiert, wartbar",
      "DSGVO-konform auf europäischen Servern",
    ],
  },
  {
    icon: Building2,
    title: "KI-Systemintegration",
    description: "Bestehende Tools und Systeme mit KI verbinden – CRM, ERP, Buchungssysteme, E-Mail-Marketing. Alles spricht miteinander, kein manueller Transfer.",
    benefits: [
      "API-Integrationen ohne Code-Kenntnisse nötig",
      "Daten fließen automatisch",
      "Keine Doppelerfassung mehr",
    ],
  },
];

const CHALLENGES = [
  {
    icon: Phone,
    title: "Verpasste Anrufe kosten Umsatz",
    description: "Jeder nicht angenommene Anruf ist ein potenzieller Auftrag, der zur Konkurrenz geht. KI-Telefonassistenten lösen dieses Problem dauerhaft.",
  },
  {
    icon: Clock,
    title: "Manuelle Prozesse fressen Zeit",
    description: "Deutsche KMU verlieren täglich Stunden durch Dateneingabe, Terminkoordination und manuelle Kundenkommunikation. Automatisierung schafft diese Zeit zurück.",
  },
  {
    icon: Users,
    title: "Fachkräftemangel als Wachstumsbremse",
    description: "Qualifiziertes Personal ist schwer zu finden. KI übernimmt repetitive Aufgaben – Telefonannahme, Datenpflege, Kommunikation – ohne Personalkosten.",
  },
  {
    icon: TrendingUp,
    title: "Wettbewerber automatisieren bereits",
    description: "Unternehmen, die KI einsetzen, arbeiten effizienter und günstiger. Wer wartet, verliert schrittweise Wettbewerbsvorteile, die schwer aufzuholen sind.",
  },
  {
    icon: Shield,
    title: "DSGVO-Unsicherheit bei KI-Einsatz",
    description: "Viele Unternehmen scheuen KI aus Datenschutzgründen. Cogniiq arbeitet ausschließlich mit DSGVO-konformen Lösungen auf europäischen Servern.",
  },
  {
    icon: Zap,
    title: "Tool-Chaos ohne Verbindung",
    description: "Unternehmen nutzen CRM, Kalender, E-Mail und Buchhaltung – aber alles getrennt. Automatisierung verbindet diese Systeme und schafft einen durchgängigen Workflow.",
  },
];

const INDUSTRIES = [
  { name: "Arztpraxen & Therapeuten", href: "/ki-telefonassistent-arzt", description: "DSGVO-konforme Terminautomatisierung für Praxen." },
  { name: "Gastronomie & Restaurants", href: "/ki-telefonassistent-restaurant", description: "24/7-Reservierungen, mehrsprachig." },
  { name: "Hotels & Pensionen", href: "/ki-telefonassistent-hotel", description: "Rund-um-die-Uhr-Rezeption, PMS-Integration." },
  { name: "Therapiepraxen", href: "/ki-telefonassistent-praxis", description: "Terminbuchung, Folgetermine, No-Show-Reduktion." },
  { name: "Automatisierung Restaurant", href: "/automatisierung-restaurant", description: "Reservierungen, Lieferanten, Kommunikation." },
  { name: "Automatisierung Arzt", href: "/automatisierung-arzt", description: "Terminbestätigung, Warteliste, DSGVO." },
];

const CITY_LINKS = [
  { label: "KI-Telefonassistent Bayreuth", href: "/bayreuth/ki-telefonassistent" },
  { label: "KI-Telefonassistent München", href: "/muenchen/ki-telefonassistent" },
  { label: "KI-Telefonassistent Regensburg", href: "/regensburg/ki-telefonassistent" },
  { label: "Bayern KI-Telefonassistent", href: "/bayern/ki-telefonassistent" },
];

const COST_LINKS = [
  { label: "KI Telefonassistent Kosten", href: "/kosten-ki-telefonassistent" },
  { label: "Automatisierung Kosten", href: "/kosten-automatisierung" },
  { label: "Verpasste Anrufe", href: "/verpasste-anrufe-verlust" },
  { label: "Zu viel manuelle Arbeit", href: "/zu-viel-manuelle-arbeit" },
];

const RELATED_LINKS = [
  { label: "Webdesign Agentur Deutschland", href: "/webdesign-agentur-deutschland" },
  { label: "Automatisierung Unternehmen", href: "/automatisierung-unternehmen" },
  { label: "KI Telefonassistent", href: "/ki-telefonassistent" },
  { label: "Deutschland", href: "/deutschland" },
  { label: "Kontakt", href: "/kontakt" },
];

const USE_CASES = [
  {
    title: "Arztpraxis – keine Anrufspitzen mehr",
    description: "Eine allgemeinmedizinische Praxis mit drei Ärzten erhält montags Anrufspitzen, die das Team überlasten. Der KI-Telefonassistent übernimmt Standardtermine, beantwortet Fragen zu Öffnungszeiten und qualifiziert Notfallanfragen – DSGVO-konform, vollautomatisch.",
  },
  {
    title: "Restaurant – 24/7-Reservierungen ohne Mitarbeiter",
    description: "Ein inhabergeführtes Restaurant erhält Reservierungsanfragen auch nach 22 Uhr. KI-Telefonassistent nimmt Reservierungen entgegen, sendet Bestätigungen und Erinnerungen – ohne dass jemand zum Telefon greifen muss.",
  },
  {
    title: "Handwerksbetrieb – keine verpassten Auftragsanfragen",
    description: "Ein Elektriker verpasst täglich Anfragen, weil die Mitarbeiter auf der Baustelle sind. Der KI-Assistent nimmt Anrufe an, qualifiziert das Anliegen und leitet strukturierte Nachrichten weiter. Kein Auftrag geht verloren.",
  },
  {
    title: "Beratungsunternehmen – Systemintegration",
    description: "Ein Beratungsunternehmen nutzt CRM, Terminkalender und Rechnungssystem getrennt. Nach Automatisierung: Leads fließen automatisch ins CRM, Termine werden synchron gebucht, Rechnungen entstehen automatisch nach Projektabschluss.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Was ist eine KI Agentur und was unterscheidet Cogniiq?",
    answer: "Eine KI Agentur hilft Unternehmen, künstliche Intelligenz und Automatisierung in ihre Prozesse zu integrieren. Cogniiq ist auf drei Kernbereiche spezialisiert: KI-Telefonassistenten, Prozessautomatisierung und Webdesign – ohne Großagentur-Overhead, mit direkten Ansprechpartnern und fairen Preisen.",
  },
  {
    question: "Wie schnell kann ein KI-Telefonassistent eingerichtet werden?",
    answer: "In der Regel 7–14 Tage. Das beinhaltet Einrichtung, Konfiguration der Sprache und Antworten, Integration in Ihren Kalender und eine Testphase. Bei einfacheren Setups auch schneller.",
  },
  {
    question: "Ist KI DSGVO-konform für deutsche Unternehmen?",
    answer: "Ja, wenn sie richtig konfiguriert ist. Cogniiq arbeitet ausschließlich mit Lösungen, die Daten auf europäischen Servern verarbeiten, vollständig DSGVO-konform sind und mit den notwendigen Auftragsverarbeitungsverträgen geliefert werden.",
  },
  {
    question: "Für welche Unternehmensgröße ist ein KI-Telefonassistent geeignet?",
    answer: "Ab ca. 20–30 Anrufen pro Tag rentiert sich ein KI-Telefonassistent deutlich. Besonders für Solo-Unternehmer, kleine Praxen, Restaurants und Handwerksbetriebe ist es ein unmittelbarer ROI-Gewinn.",
  },
  {
    question: "Was kostet ein KI-Telefonassistent monatlich?",
    answer: "Einfachere Setups beginnen ab ca. 99 €/Monat. Mittlere Konfigurationen mit Kalenderintegration und mehreren Szenarien 199–399 €/Monat. Komplexere Lösungen für große Praxen oder Unternehmensgruppen ab 499 €/Monat. Genaue Preise auf der Kosten-Seite.",
  },
  {
    question: "Kann Cogniiq bestehende Telefonsysteme integrieren?",
    answer: "Ja. Wir integrieren in die meisten gängigen Telefonanlagen, VoIP-Systeme und Kalender-Tools. Bei der Analyse des Systems klären wir vorab, was möglich ist.",
  },
  {
    question: "Arbeitet Cogniiq nur mit Unternehmen in Bayern?",
    answer: "Nein. Cogniiq betreut Projekte in ganz Deutschland – vollständig remote. Persönliche Termine sind im Raum Bayern möglich. Alle anderen Projekte laufen über Video-Calls und digitale Zusammenarbeit.",
  },
];

const kiAgenturSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ProfessionalService",
      "@id": `${BUSINESS_INFO.website}/ki-agentur-deutschland#service`,
      "name": "KI Agentur Deutschland – Cogniiq",
      "url": `${BUSINESS_INFO.website}/ki-agentur-deutschland`,
      "provider": {
        "@type": "Organization",
        "name": BUSINESS_INFO.name,
        "url": BUSINESS_INFO.website,
      },
      "areaServed": {
        "@type": "Country",
        "name": "Deutschland",
      },
      "serviceType": "KI Automatisierung",
      "description": "KI-Telefonassistenten und Prozessautomatisierung für Unternehmen in Deutschland. DSGVO-konform, schnelle Umsetzung, faire Preise.",
    },
  ],
};

export function KiAgenturDeutschland() {
  const breadcrumbs = [
    { name: "Home", url: BUSINESS_INFO.website },
    { name: "KI Agentur Deutschland", url: `${BUSINESS_INFO.website}/ki-agentur-deutschland` },
  ];

  const faqItems = FAQ_ITEMS.map((f) => ({ question: f.question, answer: f.answer }));

  return (
    <>
      <PageSEO
        title="KI Agentur Deutschland – KI Telefonassistent & Automatisierung für Unternehmen | Cogniiq"
        description="Cogniiq – KI Agentur für Unternehmen in Deutschland. KI-Telefonassistenten, Prozessautomatisierung und digitale Systemintegration. DSGVO-konform, schnelle Umsetzung, direkte Betreuung."
        canonical={`${BUSINESS_INFO.website}/ki-agentur-deutschland`}
        breadcrumbs={breadcrumbs}
        faqItems={faqItems}
        additionalSchema={kiAgenturSchema}
      />

      <main>
        {/* ── HERO ── */}
        <section className="pt-32 pb-20 bg-white dark:bg-gray-950 transition-colors duration-300">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <motion.nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Link to="/" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Home</Link>
              <ChevronRight size={12} />
              <span className="text-gray-600 dark:text-gray-300">KI Agentur Deutschland</span>
            </motion.nav>

            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.1}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium tracking-wide uppercase mb-6">
                <Phone size={12} />
                KI · Automatisierung · Deutschland · DSGVO-konform
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-tight mb-6">
                KI Agentur Deutschland – Telefonassistent & Automatisierung für Ihr Unternehmen
              </h1>

              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl leading-relaxed mb-8">
                Cogniiq ist Ihre spezialisierte KI Agentur in Deutschland. Wir implementieren KI-Telefonassistenten, automatisieren Geschäftsprozesse und verbinden Ihre Systeme – DSGVO-konform, schnell und ohne Großagentur-Overhead.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  to="/kontakt"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-700 dark:hover:bg-white transition-colors"
                >
                  Kostenloses Erstgespräch
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/ki-telefonassistent"
                  className="inline-flex items-center gap-2 px-6 py-3.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm hover:border-gray-500 dark:hover:border-gray-400 transition-colors"
                >
                  KI Telefonassistent
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── TRUST BAR ── */}
        <div className="border-y border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
              {["KI-Telefonassistent", "Prozessautomatisierung", "DSGVO-konform", "Einrichtung in 7–14 Tagen", "Europäische Server", "Persönliche Betreuung"].map((item, i) => (
                <span key={i} className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  {i > 0 && <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" aria-hidden="true" />}
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── INTRO ── */}
        <section className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300" aria-labelledby="intro-heading">
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
              <h2 id="intro-heading" className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
                KI für den deutschen Mittelstand – praktisch, nicht theoretisch
              </h2>
              <div className="space-y-5">
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  KI wird in Deutschland viel diskutiert, aber selten konkret umgesetzt. Viele Unternehmen wissen, dass sie KI einsetzen sollten – aber nicht wie, wo sie anfangen sollen und was es wirklich kostet. Cogniiq macht KI für den deutschen Mittelstand greifbar und einsatzfähig, ohne Beratungsoverhead und ohne monatelange Implementierungsprojekte.
                </p>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Unser Fokus liegt auf zwei Bereichen, die sofort ROI erzeugen: KI-Telefonassistenten, die kein Unternehmen mehr unerreichbar machen – und Automatisierungen, die manuelle Abläufe ein für allemal lösen. Beides DSGVO-konform, beides auf europäischen Servern, beides in Wochen statt Monaten umgesetzt.
                </p>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Mit Hauptsitz in{" "}
                  <Link to="/bayreuth/ki-telefonassistent" className="text-gray-800 dark:text-gray-200 underline underline-offset-2 hover:text-gray-600 transition-colors">Bayreuth</Link>{" "}
                  betreuen wir Projekte in ganz Deutschland – in{" "}
                  <Link to="/muenchen/ki-telefonassistent" className="text-gray-800 dark:text-gray-200 underline underline-offset-2 hover:text-gray-600 transition-colors">München</Link>,{" "}
                  <Link to="/regensburg/ki-telefonassistent" className="text-gray-800 dark:text-gray-200 underline underline-offset-2 hover:text-gray-600 transition-colors">Regensburg</Link>{" "}
                  und bundesweit. Vollständig remote, transparent und mit direkten Ansprechpartnern.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── LEISTUNGEN ── */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300" aria-labelledby="services-heading">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="mb-12">
              <h2 id="services-heading" className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                KI-Leistungen für Unternehmen in Deutschland
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Drei Kernbereiche, die sofortigen ROI erzeugen.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {SERVICES.map((service, i) => {
                const Icon = service.icon;
                return (
                  <motion.div
                    key={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    custom={i * 0.1}
                    className="bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl p-6"
                  >
                    <Icon size={24} className="mb-4 text-[#515A61] dark:text-sky-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{service.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">{service.description}</p>
                    <ul className="space-y-1.5">
                      {service.benefits.map((b, bi) => (
                        <li key={bi} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <CheckCircle2 size={13} className="flex-shrink-0 mt-0.5 text-[#515A61] dark:text-sky-400" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── HERAUSFORDERUNGEN ── */}
        <section className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300" aria-labelledby="challenges-heading">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="mb-12">
              <h2 id="challenges-heading" className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Warum deutsche Unternehmen KI brauchen
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Konkrete Probleme, die KI und Automatisierung dauerhaft lösen.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {CHALLENGES.map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    custom={i * 0.07}
                    className="flex gap-4 p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <Icon size={16} className="text-gray-500 dark:text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">{item.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── BRANCHEN ── */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300" aria-labelledby="industries-heading">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="mb-12">
              <h2 id="industries-heading" className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                KI nach Branche
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Spezialisierte KI-Lösungen für jede Branche.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {INDUSTRIES.map((industry, i) => (
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i * 0.07}
                  className="p-5 rounded-xl bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700"
                >
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">{industry.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">{industry.description}</p>
                  <Link
                    to={industry.href}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors group"
                  >
                    <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                    Mehr erfahren
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── EINSATZBEISPIELE ── */}
        <section className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300" aria-labelledby="usecases-heading">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="mb-12">
              <h2 id="usecases-heading" className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                KI in der Praxis – konkrete Anwendungen
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Wie Cogniiq-KI-Lösungen Unternehmen in Deutschland täglich entlasten.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {USE_CASES.map((uc, i) => (
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i * 0.09}
                  className="flex gap-4 p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <Lightbulb size={15} className="text-gray-400 dark:text-gray-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">{uc.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{uc.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── INTERNE LINKS ── */}
        <section className="py-16 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 transition-colors duration-300" aria-labelledby="links-heading">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="mb-10">
              <h2 id="links-heading" className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                KI nach Stadt & Thema
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Alle weiterführenden Seiten zu KI, Automatisierung und Standorten.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0.1}
              className="grid sm:grid-cols-3 gap-8"
            >
              {[
                { heading: "Städte", links: CITY_LINKS },
                { heading: "Kosten & Probleme", links: COST_LINKS },
                { heading: "Verwandte Themen", links: RELATED_LINKS },
              ].map((col) => (
                <div key={col.heading}>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">{col.heading}</p>
                  <ul className="space-y-2">
                    {col.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          to={link.href}
                          className="group inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors"
                        >
                          <ArrowRight size={12} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300" aria-labelledby="faq-heading">
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="mb-10">
              <h2 id="faq-heading" className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Häufige Fragen – KI Agentur Deutschland
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Alles Wichtige zu KI, Automatisierung und der Zusammenarbeit mit Cogniiq.
              </p>
            </motion.div>

            <div className="space-y-3">
              {FAQ_ITEMS.map((item, i) => (
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i * 0.05}
                  className="p-5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700"
                >
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">{item.question}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.answer}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300">
          <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                KI, die sofort ROI erzeugt
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
                Kostenloses Erstgespräch – wir analysieren, welche KI-Lösung für Ihr Unternehmen den schnellsten Return erzeugt. Für Unternehmen in ganz Deutschland, remote, ohne Verpflichtung.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  to="/kontakt"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold hover:bg-gray-700 dark:hover:bg-white transition-colors"
                >
                  Kostenloses Erstgespräch
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/ki-telefonassistent"
                  className="inline-flex items-center gap-2 px-7 py-3.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:border-gray-500 dark:hover:border-gray-400 transition-colors"
                >
                  KI Telefonassistent
                </Link>
              </div>
              <p className="mt-6 text-xs text-gray-400 dark:text-gray-500">
                {BUSINESS_INFO.name} · {BUSINESS_INFO.address.addressLocality} · {BUSINESS_INFO.contact.email}
              </p>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
}
