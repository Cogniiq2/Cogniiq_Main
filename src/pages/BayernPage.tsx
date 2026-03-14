import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Phone, Zap, Globe, CircleCheck as CheckCircle2, ChevronRight, Building2, Users, TrendingUp, Shield, Lightbulb } from "lucide-react";
import { PageSEO } from "@/components/PageSEO";
import { BUSINESS_INFO } from "@/lib/seo-data";
import { CITY_LINKS } from "@/lib/standorte-data";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

const SERVICES_OVERVIEW = [
  {
    icon: Phone,
    title: "KI-Telefonassistent Bayern",
    slug: "ki-telefonassistent",
    description:
      "Automatische Anrufannahme, Terminbuchung und Weiterleitung – 24/7, für Praxen, Gastronomie und Dienstleister in ganz Bayern. Einrichtung in 7–14 Tagen.",
    benefits: [
      "Kein Anruf mehr verpasst",
      "Entlastung von Routinegesprächen",
      "DSGVO-konforme Sprachverarbeitung",
    ],
  },
  {
    icon: Zap,
    title: "Automatisierung Bayern",
    slug: "automatisierung",
    description:
      "Wiederkehrende Prozesse mit maßgeschneiderten Workflows und direkten API-Integrationen automatisieren. Einmalig eingerichtet, dauerhaft entlastend, vollständig dokumentiert.",
    benefits: [
      "Zeitersparnis täglich ab dem ersten Tag",
      "Fehlerreduktion durch saubere Datenflüsse",
      "Skalierbar mit Ihrem Unternehmen",
    ],
  },
  {
    icon: Globe,
    title: "Webdesign Bayern",
    slug: "webdesign",
    description:
      "Hochkonvertierende Websites für Unternehmen in Bayern – individuell entwickelt, technisch präzise, lokal SEO-optimiert, auf Leads und Conversion ausgerichtet.",
    benefits: [
      "Mobile-First, unter 2 Sekunden Ladezeit",
      "Lokales SEO für bayerische Märkte",
      "Conversion-Fokus statt Visitenkarte",
    ],
  },
];

const TRUST_POINTS = [
  "Hauptsitz in Bayreuth – persönliche Betreuung in der Region",
  "Projekte in ganz Bayern – auch remote vollständig betreut",
  "Einrichtung in 7–14 Tagen – keine monatelangen Projekte",
  "DSGVO-konform – alle Daten bleiben in Europa",
  "Keine anonymen Ticket-Systeme – direkter Ansprechpartner",
  "Faire Preise – kein Agentur-Overhead, keine versteckten Kosten",
];

const CHALLENGES = [
  {
    icon: Users,
    title: "Fachkräftemangel im Mittelstand",
    description:
      "Bayerische KMU finden kaum Fachkräfte für administrative Aufgaben. Telefonannahme, Datenpflege und Kundenkommunikation binden Personal, das anderswo dringend benötigt wird. KI-Systeme übernehmen genau diese Aufgaben – dauerhaft und skalierbar.",
  },
  {
    icon: Phone,
    title: "Telefonische Erreichbarkeit als Wettbewerbsfaktor",
    description:
      "Studien zeigen: Über 60 % aller Anrufversuche bei kleinen Unternehmen in Bayern landen auf einem Anrufbeantworter oder werden gar nicht angenommen. Ein nicht beantworteter Anruf ist ein verlorener Kunde – besonders in wettbewerbsintensiven Märkten.",
  },
  {
    icon: Globe,
    title: "Lokale Sichtbarkeit bei Google",
    description:
      "Über 80 % aller lokalen Suchanfragen in Bayern erfolgen mobil. Wer auf Google Maps und in der organischen Suche nicht sichtbar ist, verliert täglich potenzielle Kunden an besser positionierte Mitbewerber.",
  },
  {
    icon: Zap,
    title: "Prozessineffizienz durch manuelle Abläufe",
    description:
      "Viele bayerische Unternehmen nutzen gewachsene Software-Landschaften ohne automatische Synchronisation. Daten werden manuell übertragen, Bestätigungen per Hand verschickt – täglich verlorene Stunden, die für Kernaufgaben fehlen.",
  },
  {
    icon: TrendingUp,
    title: "Digitalisierung im regionalen Wettbewerb",
    description:
      "Der Digitalisierungsgrad unter bayerischen KMU wächst, aber ungleich. Wer jetzt modernisiert, verschafft sich einen nachhaltigen Vorsprung gegenüber Mitbewerbern, die noch auf veraltete Prozesse setzen.",
  },
  {
    icon: Shield,
    title: "DSGVO-konforme KI-Nutzung",
    description:
      "Viele bayerische Unternehmer zögern beim KI-Einsatz aus Datenschutzgründen zu Recht. Cogniiq setzt ausschließlich auf europäische Server und DSGVO-konforme Prozesse – kein Datenschutzrisiko, volle Rechtssicherheit.",
  },
];

const INDUSTRIES = [
  {
    name: "Mittelstand & KMU",
    description:
      "Bayerische Mittelständler optimieren interne Abläufe, automatisieren Kundenbeziehungen und professionalisieren ihren digitalen Auftritt – ohne eigene IT-Abteilung.",
  },
  {
    name: "Handwerk & Betriebe",
    description:
      "Handwerksbetriebe in Bayern sichern Auftragsanfragen automatisch, reduzieren Büroaufwand und werden online besser gefunden – mehr Zeit für die eigentliche Arbeit.",
  },
  {
    name: "Gastronomie & Restaurants",
    description:
      "Restaurants und Cafés in Bayern nehmen Reservierungen rund um die Uhr entgegen, automatisieren Erinnerungen und haben eine Website, die Gäste direkt zur Buchung führt.",
  },
  {
    name: "Arztpraxen & Therapeuten",
    description:
      "Praxen in Bayern entlasten ihr Team durch automatische Terminbuchung am Telefon, reduzieren Anrufspitzen und erscheinen bei lokalen Suchanfragen prominent.",
  },
  {
    name: "Dienstleister & Beratung",
    description:
      "Lokale Dienstleister automatisieren Leadverarbeitung, qualifizieren Erstanfragen ohne Zeitaufwand und generieren mehr qualifizierte Anfragen über eine optimierte Website.",
  },
  {
    name: "Immobilien & Kanzleien",
    description:
      "Immobilienbüros und Kanzleien in Bayern filtern Erstanfragen effizient, verwalten Kundenprozesse automatisiert und strahlen online die Qualität aus, die ihre Marke verdient.",
  },
  {
    name: "Industrie & Fertigung",
    description:
      "Industrieunternehmen in Bayern synchronisieren ERP, CRM und Kundenkommunikation automatisch – keine manuellen Datentransfers, keine Doppelerfassung.",
  },
  {
    name: "Sport, Wellness & Beauty",
    description:
      "Studios und Salons in Bayern nehmen Buchungen vollautomatisch entgegen, senden Erinnerungen und sind mobil optimal auffindbar.",
  },
];

const USE_CASE_SCENARIOS = [
  {
    icon: "🏥",
    title: "Hausarztpraxis in Bayern",
    description:
      "Eine Allgemeinmedizin-Praxis mit sechs Behandlungszimmern erhält montags über 100 Anrufe vor 9 Uhr. Das Praxisteam ist überlastet. Nach Einführung des KI-Telefonassistenten werden Standardtermine automatisch vergeben, Rezeptanfragen strukturiert entgegengenommen und Rückrufe priorisiert. Das Team konzentriert sich auf die Patienten im Raum.",
  },
  {
    icon: "🍽️",
    title: "Restaurant in der bayerischen Innenstadt",
    description:
      "Ein inhabergeführtes Restaurant mit 60 Plätzen erhält täglich Reservierungsanfragen per Telefon – viele abends nach Küchenschluss. Durch Automatisierung laufen Reservierungen, Bestätigungen und Erinnerungen vollautomatisch. Die Website generiert dank lokalem SEO messbar mehr direkte Buchungen.",
  },
  {
    icon: "🔨",
    title: "Handwerksbetrieb im Umland",
    description:
      "Ein Elektriker mit sieben Mitarbeitern verpasst täglich Auftragsanfragen, weil die Mitarbeiter auf der Baustelle sind. Der KI-Telefonassistent nimmt Anfragen entgegen, qualifiziert das Anliegen und leitet strukturierte Nachrichten weiter. Gleichzeitig läuft die Angebotserstellung und Rechnungsstellung über automatisierte Workflows.",
  },
  {
    icon: "💼",
    title: "Lokaler Dienstleister mit mehreren Standorten",
    description:
      "Ein Beratungsunternehmen in Bayern mit drei Standorten nutzt vier verschiedene Tools für Leads, CRM, Termine und Abrechnung – ohne automatische Verbindung. Nach der Automatisierung fließen alle Anfragen zentral zusammen, Kunden-Onboarding läuft in Minuten, Rechnungen werden automatisch erstellt.",
  },
];

const FAQ_ITEMS = [
  {
    q: "Für welche Unternehmensgrößen in Bayern arbeitet Cogniiq?",
    a: "Wir betreuen Unternehmen ab 1 Mitarbeiter (Einzelunternehmen, Praxen, lokale Dienstleister) bis zu mittelständischen Betrieben mit 50–200 Mitarbeitern. Entscheidend ist nicht die Größe, sondern ob ein klarer digitaler Bedarf vorhanden ist.",
  },
  {
    q: "Ist Cogniiq wirklich in Bayern ansässig?",
    a: "Ja. Unser Hauptsitz ist in Bayreuth – wir kennen den bayerischen Markt und betreuen Projekte in Regensburg, München und ganz Bayern persönlich oder remote.",
  },
  {
    q: "Kann die gesamte Zusammenarbeit remote stattfinden?",
    a: "Ja. Alle Projektphasen – von der Analyse bis zur Übergabe – laufen vollständig remote. Persönliche Termine sind im Raum Bayreuth möglich und für München und Regensburg auf Anfrage.",
  },
  {
    q: "Wie schnell sind die Lösungen einsatzbereit?",
    a: "KI-Telefonassistenten: 7–14 Tage. Automatisierungsworkflows: 1–4 Wochen je nach Komplexität. Websites: 4–12 Wochen. Nach dem Erstgespräch erhalten Sie immer einen realistischen Zeitplan.",
  },
  {
    q: "Sind alle Lösungen DSGVO-konform?",
    a: "Ja. Alle Systeme verarbeiten Daten ausschließlich auf europäischen Servern. Wir erstellen auf Wunsch die notwendigen Auftragsverarbeitungsverträge (AVV) und unterstützen bei der Datenschutzdokumentation.",
  },
  {
    q: "Was kostet ein KI-Telefonassistent für Bayern?",
    a: "Die Kosten hängen von Anrufvolumen und Konfigurationskomplexität ab. Nach dem Erstgespräch erhalten Sie ein transparentes Festpreisangebot. Das Erstgespräch ist kostenlos und unverbindlich.",
  },
  {
    q: "Was kostet eine Website für ein bayerisches Unternehmen?",
    a: "Einfache Unternehmenswebsites ab ca. 2.500 €, komplexere Projekte nach Aufwand. Kein versteckter Overhead – faire Preise ohne Agenturaufschläge für teure Bürolagen.",
  },
  {
    q: "Wie unterscheidet sich Cogniiq von anderen Agenturen in Bayern?",
    a: "Wir sind auf drei Kernbereiche spezialisiert – KI-Telefonie, Automatisierung und Webdesign – und kennen deren Zusammenspiel. Kein Overhead einer Großagentur, direkter Ansprechpartner, persönliche Betreuung und faire Preise.",
  },
];

const ADDITIONAL_CITIES = [
  { name: "Nürnberg", note: "Zweitgrößte Stadt in Bayern – starker Wirtschaftsstandort" },
  { name: "Augsburg", note: "Wichtiger Industrie- und Handelsstandort in Schwaben" },
  { name: "Ingolstadt", note: "Automobilregion mit gewachsenem Mittelstand" },
  { name: "Würzburg", note: "Wirtschafts- und Universitätsstadt in Unterfranken" },
  { name: "Erlangen", note: "Technologiestandort mit starker Medizintechnikbranche" },
  { name: "Fürth", note: "Wachsende Wirtschaftsregion im Großraum Nürnberg" },
];

const cities = Object.entries(CITY_LINKS) as Array<[string, typeof CITY_LINKS[keyof typeof CITY_LINKS]]>;

const bayernSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": `${BUSINESS_INFO.website}/#localbusiness`,
      "name": BUSINESS_INFO.name,
      "url": BUSINESS_INFO.website,
      "telephone": BUSINESS_INFO.contact.phone,
      "email": BUSINESS_INFO.contact.email,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": BUSINESS_INFO.address.addressLocality,
        "addressRegion": BUSINESS_INFO.address.addressRegion,
        "postalCode": BUSINESS_INFO.address.postalCode,
        "addressCountry": BUSINESS_INFO.address.addressCountry,
      },
      "areaServed": [
        { "@type": "State", "name": "Bayern" },
        { "@type": "City", "name": "Bayreuth" },
        { "@type": "City", "name": "Regensburg" },
        { "@type": "City", "name": "München" },
        { "@type": "City", "name": "Nürnberg" },
        { "@type": "City", "name": "Augsburg" },
      ],
    },
  ],
};

export function BayernPage() {
  const breadcrumbs = [
    { name: "Home", url: BUSINESS_INFO.website },
    { name: "Bayern", url: `${BUSINESS_INFO.website}/bayern` },
  ];

  return (
    <>
      <PageSEO
        title="KI Agentur Bayern – KI Telefonassistent, Automatisierung & Webdesign | Cogniiq"
        description="Cogniiq ist Ihre KI Agentur für Bayern. KI Telefonassistent, Prozessautomatisierung und Webdesign für Unternehmen in Bayreuth, Regensburg, München und ganz Bayern. DSGVO-konform, persönliche Betreuung."
        canonical={`${BUSINESS_INFO.website}/bayern`}
        breadcrumbs={breadcrumbs}
        additionalSchema={bayernSchema}
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
              <span className="text-gray-600 dark:text-gray-300">Bayern</span>
            </motion.nav>

            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.1}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium tracking-wide uppercase mb-6">
                <MapPin size={12} />
                Bayern · Deutschland · DSGVO-konform · Persönliche Betreuung
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-tight mb-6">
                KI Agentur Bayern – Webdesign, KI-Telefonassistent & Automatisierung
              </h1>

              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl leading-relaxed mb-8">
                Cogniiq entwickelt KI-Lösungen, Automatisierungssysteme und professionelle Websites für Unternehmen in ganz Bayern. Mit Hauptsitz in Bayreuth betreuen wir Kunden in Regensburg, München und dem gesamten Freistaat – persönlich oder vollständig remote.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  to="/kontakt"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-700 dark:hover:bg-white transition-colors"
                >
                  Projekt in Bayern starten
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/leistungen"
                  className="inline-flex items-center gap-2 px-6 py-3.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm hover:border-gray-500 dark:hover:border-gray-400 transition-colors"
                >
                  Alle Leistungen
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── TRUST BAR ── */}
        <div className="border-y border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
              {["Bayern", "Bayreuth", "Regensburg", "München", "KI-Telefonassistent", "Automatisierung", "Webdesign", "DSGVO-konform"].map((item, i) => (
                <span key={i} className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  {i > 0 && <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" aria-hidden="true" />}
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── INTRO ── */}
        <section className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300" aria-labelledby="regional-intro-heading">
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
            >
              <h2 id="regional-intro-heading" className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
                KI und Digitalisierung für den bayerischen Mittelstand
              </h2>
              <div className="space-y-5">
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Bayern ist ein starker Wirtschaftsstandort – mit einem dichten Netz aus mittelständischen Unternehmen, Handwerksbetrieben, Praxen, Gastronomie und wachsenden Start-ups. Was viele dieser Unternehmen verbindet: Sie wollen digital effizienter werden, haben aber keine Ressourcen für große IT-Projekte, keine eigene Tech-Abteilung und kein Budget für teure Beratungsagenturen.
                </p>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Cogniiq ist als regionale KI-Agentur genau für diese Unternehmen gemacht. Wir automatisieren Prozesse, die täglich Zeit kosten. Wir setzen KI-Telefonassistenten ein, die keine Anrufe mehr verpassen lassen. Wir entwickeln Websites, die Besucher in Kunden verwandeln. Und wir tun das mit persönlicher Betreuung, klarer Kommunikation und fairen Preisen – ohne Agentur-Overhead, ohne versteckte Kosten.
                </p>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Mit Hauptsitz in Bayreuth kennen wir den bayerischen Mittelstand aus erster Hand. Projekte in Regensburg, München und dem gesamten Freistaat betreuen wir remote – vollständig, transparent und ohne Qualitätseinbußen. Unsere Lösungen sind auch <Link to="/deutschland" className="text-gray-800 dark:text-gray-200 underline underline-offset-2 hover:text-gray-600 transition-colors">deutschlandweit verfügbar</Link>.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── HERAUSFORDERUNGEN ── */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300" aria-labelledby="challenges-heading">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="mb-12"
            >
              <h2 id="challenges-heading" className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Digitale Herausforderungen für Unternehmen in Bayern
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Was bayerische KMU heute täglich belastet – und wie KI konkret hilft.
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
                    className="flex gap-4 p-6 rounded-2xl bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700"
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

        {/* ── LEISTUNGEN ── */}
        <section className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300" aria-labelledby="services-heading">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="mb-12"
            >
              <h2 id="services-heading" className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Leistungen in ganz Bayern
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Drei Bereiche – alle darauf ausgelegt, Ihren Betrieb effizienter und sichtbarer zu machen.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {SERVICES_OVERVIEW.map((service, i) => {
                const Icon = service.icon;
                return (
                  <motion.div
                    key={service.slug}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    custom={i * 0.1}
                    className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl p-6"
                  >
                    <Icon size={24} className="mb-4 text-[#515A61] dark:text-sky-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {service.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                      {service.description}
                    </p>
                    <ul className="space-y-1.5 mb-5">
                      {service.benefits.map((b, bi) => (
                        <li key={bi} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <CheckCircle2 size={13} className="flex-shrink-0 mt-0.5 text-[#515A61] dark:text-sky-400" />
                          {b}
                        </li>
                      ))}
                    </ul>
                    <div className="space-y-1.5 pt-4 border-t border-gray-200 dark:border-gray-700">
                      {cities.map(([slug, cityData]) => (
                        <Link
                          key={`${cityData.label}-${service.slug}`}
                          to={`/${slug}/${service.slug}`}
                          className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors group"
                        >
                          <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                          {service.title.split(" ")[0] === "KI-Telefonassistent" ? "KI-Telefonassistent" : service.slug === "automatisierung" ? "Automatisierung" : "Webdesign"} {cityData.label}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── WARUM COGNIIQ ── */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300" aria-labelledby="trust-heading">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="mb-12"
            >
              <h2 id="trust-heading" className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Warum digitale Systeme in Bayern entscheidend sind
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Warum Cogniiq die richtige Wahl für bayerische Unternehmen ist.
              </p>
            </motion.div>

            <ul className="grid md:grid-cols-2 gap-4">
              {TRUST_POINTS.map((point, i) => (
                <motion.li
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i * 0.06}
                  className="flex items-start gap-3 p-5 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50"
                >
                  <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5 text-[#515A61] dark:text-sky-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{point}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── BRANCHEN ── */}
        <section className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300" aria-labelledby="industries-heading">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="mb-12"
            >
              <h2 id="industries-heading" className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Branchen in Bayern
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Cogniiq betreut Unternehmen quer durch alle Sektoren der bayerischen Wirtschaft.
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
                  custom={i * 0.05}
                  className="p-5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{industry.name}</h3>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{industry.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── EINSATZBEISPIELE ── */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300" aria-labelledby="scenarios-heading">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="mb-12"
            >
              <h2 id="scenarios-heading" className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                KI & Automatisierung in Bayern – Einsatzbeispiele
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Wie Cogniiq-Lösungen bayerische Unternehmen konkret entlasten.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {USE_CASE_SCENARIOS.map((scenario, i) => (
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i * 0.09}
                  className="flex gap-4 p-6 rounded-2xl bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <Lightbulb size={15} className="text-gray-400 dark:text-gray-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">{scenario.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{scenario.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── INTERNE LINKMATRIX ── */}
        <section className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300" aria-labelledby="linkmatrix-heading">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="mb-10"
            >
              <h2 id="linkmatrix-heading" className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Standorte & Servicegebiete in Bayern
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Wir betreuen Unternehmen persönlich und remote in ganz Bayern.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {cities.map(([slug, cityData], i) => (
                <motion.div
                  key={slug}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i * 0.1}
                  className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin size={16} className="text-[#515A61] dark:text-sky-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {cityData.label}
                    </h3>
                    {slug === "bayreuth" && (
                      <span className="ml-auto text-[10px] font-semibold uppercase tracking-widest bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                        Hauptsitz
                      </span>
                    )}
                    {slug === "muenchen" && (
                      <span className="ml-auto text-[10px] font-semibold uppercase tracking-widest bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                        Remote
                      </span>
                    )}
                  </div>
                  <ul className="space-y-2">
                    {cityData.services.map((service) => (
                      <li key={service.href}>
                        <Link
                          to={service.href}
                          className="group flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                        >
                          <ArrowRight size={13} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                          {service.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>

            {/* Weitere Städte */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0.3}
              className="mt-10 p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">
                Weitere Regionen & Städte in Bayern
              </p>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {ADDITIONAL_CITIES.map((city, i) => (
                  <div key={i} className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{city.name}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{city.note}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                Cogniiq betreut Projekte in ganz Bayern – für alle genannten Städte und den gesamten Freistaat vollständig remote verfügbar.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300" aria-labelledby="faq-heading">
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="mb-10"
            >
              <h2 id="faq-heading" className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Häufige Fragen – Bayern
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Alles Wichtige zu Cogniiq und unseren Leistungen für bayerische Unternehmen.
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
                  className="p-5 rounded-xl bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700"
                >
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">{item.q}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.a}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── DEUTSCHLAND LINK ── */}
        <section className="py-12 bg-white dark:bg-gray-950 transition-colors duration-300">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Leistungen auch deutschlandweit verfügbar
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Cogniiq betreut Projekte in ganz Deutschland – remote, persönlich und DSGVO-konform.
                </p>
              </div>
              <Link
                to="/deutschland"
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm hover:border-gray-500 dark:hover:border-gray-400 transition-colors whitespace-nowrap"
              >
                Deutschland-Übersicht
                <ArrowRight size={14} />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300">
          <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Projekt in Bayern besprechen
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
                Kostenloses Erstgespräch – für Unternehmen in ganz Bayern. Remote oder persönlich in Bayreuth und Umgebung. 30–45 Minuten, ohne Verpflichtung, mit konkretem Ergebnis.
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
                  to="/leistungen"
                  className="inline-flex items-center gap-2 px-7 py-3.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:border-gray-500 dark:hover:border-gray-400 transition-colors"
                >
                  Alle Leistungen
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
