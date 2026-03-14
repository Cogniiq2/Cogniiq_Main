import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Zap, CircleCheck as CheckCircle2, ChevronRight, Building2, Lightbulb, Shield, Clock, Users, TrendingUp, Settings, ChartBar as BarChart3 } from "lucide-react";
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
    icon: Settings,
    title: "Workflow-Automatisierung",
    description: "Wiederkehrende Prozesse mit n8n und Make.com automatisieren – Leadverarbeitung, Terminbestätigung, Rechnungsstellung, Kundenkommunikation.",
    benefits: [
      "Quick-Wins in 1–3 Wochen live",
      "Skalierbar ohne Mehrpersonal",
      "Vollständig dokumentiert",
    ],
  },
  {
    icon: Building2,
    title: "System-Integration",
    description: "CRM, ERP, Kalender, E-Mail-Marketing und Buchungssysteme verbinden – Daten fließen automatisch, keine manuelle Doppelerfassung.",
    benefits: [
      "API-Integrationen für alle gängigen Tools",
      "Bidirektionale Datensynchronisation",
      "Fehlerüberwachung und Alerting",
    ],
  },
  {
    icon: BarChart3,
    title: "Reporting & Monitoring",
    description: "Automatische Berichte, Dashboards und Benachrichtigungen – Sie sehen immer, was in Ihrem Unternehmen passiert, ohne manuell Daten zusammenzutragen.",
    benefits: [
      "Automatische Wochen- und Monatsberichte",
      "Echtzeit-Benachrichtigungen bei Abweichungen",
      "KPI-Dashboards ohne manuellen Aufwand",
    ],
  },
];

const CHALLENGES = [
  {
    icon: Clock,
    title: "Stunden täglich für manuelle Aufgaben",
    description: "Dateneingabe, Terminkoordination, Kundenkommunikation, Rechnungsstellung – alles manuell. Jede dieser Aufgaben kostet 30–60 € pro Stunde in Personalkosten.",
  },
  {
    icon: Users,
    title: "Wachstum erfordert mehr Personal",
    description: "Manuelle Prozesse skalieren mit Headcount. Wer wachsen will, ohne ständig neue Mitarbeiter einzustellen, kommt an Automatisierung nicht vorbei.",
  },
  {
    icon: TrendingUp,
    title: "Wettbewerber bereits effizienter",
    description: "Während Sie Daten manuell übertragen, automatisieren Ihre Konkurrenten. Der Produktivitätsunterschied wächst jeden Monat – und holt sich schwer ein.",
  },
  {
    icon: Shield,
    title: "Fehler durch manuelle Prozesse",
    description: "Manuelle Eingaben produzieren Fehler: falsche Termine, verlorene Leads, vergessene Rechnungen. Automatisierung macht Fehler strukturell unmöglich.",
  },
  {
    icon: Zap,
    title: "Tool-Inseln ohne Verbindung",
    description: "CRM, Kalender, E-Mail und Buchhaltung arbeiten isoliert. Mitarbeiter übertragen Daten manuell von einem System ins nächste – täglich, fehlerbehaftet, teuer.",
  },
  {
    icon: BarChart3,
    title: "Keine Sichtbarkeit über Prozesse",
    description: "Ohne automatisches Reporting weiß die Führungsebene erst am Monatsende, was gelaufen ist. Echtzeitdaten ermöglichen bessere, schnellere Entscheidungen.",
  },
];

const INDUSTRIES = [
  { name: "Automatisierung Restaurant", href: "/automatisierung-restaurant", description: "Reservierungen, No-Show-Kommunikation, Lieferanten." },
  { name: "Automatisierung Arzt", href: "/automatisierung-arzt", description: "Terminbestätigung, Warteliste, DSGVO-konform." },
  { name: "Automatisierung Immobilien", href: "/automatisierung-immobilien", description: "Lead-Erstansprache, Exposé-Versand, CRM-Pflege." },
  { name: "Automatisierung Sport", href: "/automatisierung-sport", description: "Mitglieder-Onboarding, Zahlungserinnerungen, Re-Engagement." },
];

const CITY_LINKS = [
  { label: "Automatisierung Bayreuth", href: "/bayreuth/automatisierung" },
  { label: "Automatisierung München", href: "/muenchen/automatisierung" },
  { label: "Automatisierung Regensburg", href: "/regensburg/automatisierung" },
  { label: "Automatisierung Bayern", href: "/bayern" },
];

const COST_LINKS = [
  { label: "Was kostet Automatisierung?", href: "/kosten-automatisierung" },
  { label: "Zu viel manuelle Arbeit", href: "/zu-viel-manuelle-arbeit" },
  { label: "Digitale Automatisierung", href: "/digitale-automatisierung-unternehmen" },
  { label: "KI Telefonassistent Kosten", href: "/kosten-ki-telefonassistent" },
];

const RELATED_LINKS = [
  { label: "KI Agentur Deutschland", href: "/ki-agentur-deutschland" },
  { label: "Webdesign Agentur Deutschland", href: "/webdesign-agentur-deutschland" },
  { label: "KI Telefonassistent", href: "/ki-telefonassistent" },
  { label: "Deutschland", href: "/deutschland" },
  { label: "Kontakt", href: "/kontakt" },
];

const USE_CASES = [
  {
    title: "E-Mail-Eingang → CRM → Aufgabe: vollautomatisch",
    description: "Eine neue Kundenanfrage per E-Mail wird automatisch im CRM als Lead angelegt, dem zuständigen Mitarbeiter zugewiesen und eine Aufgabe mit Deadline erstellt. Antwort-E-Mail geht automatisch raus. Ohne dass jemand eingreift.",
  },
  {
    title: "Online-Termin → Bestätigung → Erinnerung → Follow-up",
    description: "Ein Kunde bucht einen Termin online. Sofort geht eine Bestätigung raus. 24 Stunden vorher eine Erinnerung. Nach dem Termin ein Follow-up mit Bewertungsanfrage. Alles automatisch, ohne manuellen Aufwand.",
  },
  {
    title: "Angebot angenommen → Onboarding startet",
    description: "Ein Kunde akzeptiert ein Angebot. Sofort starten: Willkommens-E-Mail, Vertragsversand, Zugangseinrichtung, Onboarding-Checkliste. Was früher 30 Minuten dauerte, passiert jetzt in Sekunden.",
  },
  {
    title: "Monatliche Reports ohne Arbeit",
    description: "Am ersten Montag jedes Monats sammelt ein automatischer Workflow Daten aus CRM, Buchhaltung und Kalender und sendet einen übersichtlichen Report an die Führungsebene. Kein Mitarbeiter muss Zahlen zusammentragen.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Was kostet Prozessautomatisierung für ein KMU?",
    answer: "Einfache Automatisierungen (ein Workflow, ein Use Case) beginnen ab ca. 500–1.500 €. Mittlere Projekte mit mehreren Workflows 1.500–5.000 €. Komplexe Systemintegrationen ab 5.000 €. Genaue Preisübersicht auf der Kosten-Seite.",
  },
  {
    question: "Wie schnell können Automatisierungen live gehen?",
    answer: "Einfache Quick-Win-Automatisierungen in 1–3 Wochen. Mittlere Projekte in 3–6 Wochen. Komplexe System-Integrationen je nach Umfang. Wir starten immer mit dem schnellsten ROI.",
  },
  {
    question: "Welche Tools können automatisiert werden?",
    answer: "Die meisten gängigen Business-Tools: HubSpot, Pipedrive, Salesforce, Google Workspace, Microsoft 365, Calendly, Stripe, Lexoffice, Datev, Slack, und Hunderte weitere – über n8n, Make.com oder direkte APIs.",
  },
  {
    question: "Muss ich technisches Wissen haben?",
    answer: "Nein. Cogniiq übernimmt die gesamte technische Umsetzung. Sie beschreiben, was Sie manuell tun – wir automatisieren es und dokumentieren alles so, dass Sie die Systeme verstehen und bei Bedarf anpassen können.",
  },
  {
    question: "Sind automatisierte Prozesse DSGVO-konform?",
    answer: "Ja, wenn richtig konfiguriert. Wir arbeiten ausschließlich mit Lösungen auf europäischen Servern, liefern die notwendigen Auftragsverarbeitungsverträge und stellen sicher, dass alle Datenflüsse DSGVO-konform sind.",
  },
  {
    question: "Was passiert, wenn eine Automatisierung fehlschlägt?",
    answer: "Wir implementieren Fehlerüberwachung und Alerting für alle kritischen Workflows. Bei Fehlern erhalten Sie oder Ihr Team sofort eine Benachrichtigung. Kritische Prozesse haben Fallback-Mechanismen.",
  },
  {
    question: "Kann Cogniiq bestehende Automatisierungen verbessern?",
    answer: "Ja. Wir analysieren bestehende Workflows, identifizieren Schwachstellen und optimieren oder erweitern bestehende Systeme. Manchmal sind kleine Anpassungen effizienter als ein Neuaufbau.",
  },
];

const automatisierungSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ProfessionalService",
      "@id": `${BUSINESS_INFO.website}/automatisierung-unternehmen#service`,
      "name": "Automatisierung für Unternehmen – Cogniiq",
      "url": `${BUSINESS_INFO.website}/automatisierung-unternehmen`,
      "provider": {
        "@type": "Organization",
        "name": BUSINESS_INFO.name,
        "url": BUSINESS_INFO.website,
      },
      "areaServed": {
        "@type": "Country",
        "name": "Deutschland",
      },
      "serviceType": "Prozessautomatisierung",
      "description": "Prozessautomatisierung mit n8n und Make.com für Unternehmen in Deutschland. DSGVO-konform, Quick-Wins in 1–3 Wochen, vollständig dokumentiert.",
    },
  ],
};

export function AutomatisierungUnternehmen() {
  const breadcrumbs = [
    { name: "Home", url: BUSINESS_INFO.website },
    { name: "Automatisierung für Unternehmen", url: `${BUSINESS_INFO.website}/automatisierung-unternehmen` },
  ];

  const faqItems = FAQ_ITEMS.map((f) => ({ question: f.question, answer: f.answer }));

  return (
    <>
      <PageSEO
        title="Automatisierung für Unternehmen – Prozessautomatisierung Deutschland | Cogniiq"
        description="Cogniiq automatisiert Geschäftsprozesse für Unternehmen in Deutschland. Workflow-Automatisierung, System-Integration, Quick-Wins in 1–3 Wochen. DSGVO-konform, fair bepreist."
        canonical={`${BUSINESS_INFO.website}/automatisierung-unternehmen`}
        breadcrumbs={breadcrumbs}
        faqItems={faqItems}
        additionalSchema={automatisierungSchema}
      />

      <main>
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
              <span className="text-gray-600 dark:text-gray-300">Automatisierung für Unternehmen</span>
            </motion.nav>

            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.1}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium tracking-wide uppercase mb-6">
                <Zap size={12} />
                Automatisierung · Deutschland · DSGVO-konform · Quick-Wins
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-tight mb-6">
                Automatisierung für Unternehmen – manuelle Prozesse ein für allemal lösen
              </h1>

              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl leading-relaxed mb-8">
                Cogniiq automatisiert Geschäftsprozesse für Unternehmen in ganz Deutschland – Workflow-Automatisierung, System-Integration und automatisches Reporting. DSGVO-konform, vollständig dokumentiert, Quick-Wins in 1–3 Wochen.
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
                  to="/kosten-automatisierung"
                  className="inline-flex items-center gap-2 px-6 py-3.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm hover:border-gray-500 dark:hover:border-gray-400 transition-colors"
                >
                  Automatisierung Kosten
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <div className="border-y border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
              {["Quick-Wins in 1–3 Wochen", "n8n & Make.com", "DSGVO-konform", "Europäische Server", "Vollständig dokumentiert", "Skalierbar"].map((item, i) => (
                <span key={i} className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  {i > 0 && <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" aria-hidden="true" />}
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <section className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300" aria-labelledby="intro-heading">
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
              <h2 id="intro-heading" className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
                Warum Automatisierung für deutsche Unternehmen unverzichtbar wird
              </h2>
              <div className="space-y-5">
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Deutsche Unternehmen stehen unter Druck: Fachkräftemangel, steigende Lohnkosten, wachsender Wettbewerb. Die Antwort auf alle drei Probleme ist dieselbe – Automatisierung. Prozesse, die heute manuell 30 Minuten kosten, laufen automatisch in Sekunden. Ohne Fehler, ohne Personalaufwand, ohne Urlaub.
                </p>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Cogniiq automatisiert mit n8n und Make.com – den führenden Automatisierungsplattformen, die DSGVO-konform auf europäischen Servern betrieben werden können. Wir beginnen immer mit dem Prozess, der den schnellsten ROI erzeugt, und skalieren von dort aus. Von einem einzelnen Workflow zur vollständig automatisierten Geschäftsstruktur.
                </p>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Mit Projekten in{" "}
                  <Link to="/bayreuth/automatisierung" className="text-gray-800 dark:text-gray-200 underline underline-offset-2 hover:text-gray-600 transition-colors">Bayreuth</Link>,{" "}
                  <Link to="/muenchen/automatisierung" className="text-gray-800 dark:text-gray-200 underline underline-offset-2 hover:text-gray-600 transition-colors">München</Link>,{" "}
                  <Link to="/regensburg/automatisierung" className="text-gray-800 dark:text-gray-200 underline underline-offset-2 hover:text-gray-600 transition-colors">Regensburg</Link>{" "}
                  und deutschlandweit betreuen wir Unternehmen vollständig remote – transparent, mit vollständiger Dokumentation und ohne Abhängigkeit.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-20 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300" aria-labelledby="services-heading">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="mb-12">
              <h2 id="services-heading" className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Automatisierungs-Leistungen für Unternehmen
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Von einzelnen Workflows bis zur vollständigen System-Integration.
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

        <section className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300" aria-labelledby="challenges-heading">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="mb-12">
              <h2 id="challenges-heading" className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Was manuelle Prozesse täglich kosten
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Konkrete Probleme, die Automatisierung dauerhaft löst.
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

        <section className="py-20 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300" aria-labelledby="industries-heading">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="mb-12">
              <h2 id="industries-heading" className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Automatisierung nach Branche
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Branchenspezifische Automatisierungslösungen für den deutschen Mittelstand.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

        <section className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300" aria-labelledby="usecases-heading">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="mb-12">
              <h2 id="usecases-heading" className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Automatisierung in der Praxis
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Konkrete Workflows, die Cogniiq für Unternehmen in Deutschland umsetzt.
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

        <section className="py-16 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 transition-colors duration-300" aria-labelledby="links-heading">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="mb-10">
              <h2 id="links-heading" className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Automatisierung nach Stadt & Thema
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Alle weiterführenden Seiten zu Automatisierung, Standorten und verwandten Themen.
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

        <section className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300" aria-labelledby="faq-heading">
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="mb-10">
              <h2 id="faq-heading" className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Häufige Fragen – Automatisierung für Unternehmen
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Alles Wichtige zu Kosten, Umsetzung und Ergebnissen.
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

        <section className="py-20 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300">
          <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Manuelle Arbeit automatisieren – jetzt starten
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
                Kostenloses Erstgespräch – wir analysieren Ihre manuellen Prozesse und zeigen, welche Automatisierung den schnellsten ROI erzeugt. Für Unternehmen in ganz Deutschland, remote, ohne Verpflichtung.
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
                  to="/kosten-automatisierung"
                  className="inline-flex items-center gap-2 px-7 py-3.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:border-gray-500 dark:hover:border-gray-400 transition-colors"
                >
                  Automatisierung Kosten
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
