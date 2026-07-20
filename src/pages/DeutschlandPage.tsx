import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Phone, Zap, Globe, CircleCheck as CheckCircle2, ChevronRight, Building2, Lightbulb, Users, TrendingUp, Shield } from "lucide-react";
import { PageSEO } from "@/components/PageSEO";
import { BUSINESS_INFO } from "@/lib/seo-data";
import { CITY_LINKS } from "@/lib/standorte-data";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const SERVICES = [
  {
    icon: Globe,
    title: "Webdesign Deutschland",
    slug: "webdesign",
    description:
      "Individuelle Websites für Unternehmen in ganz Deutschland – entwickelt für Performance, lokale SEO-Sichtbarkeit und messbare Conversion. Kein Template, kein Baukastenprodukt.",
    benefits: [
      "Mobile-First, Ladezeit unter 2 Sekunden",
      "Lokal und national SEO-optimiert",
      "Klare Conversion-Struktur für mehr Anfragen",
    ],
  },
  {
    icon: Phone,
    title: "KI-Telefonassistent Deutschland",
    slug: "ki-telefonassistent",
    description:
      "Automatische Anrufannahme, Terminbuchung und Weiterleitung – 24/7, mehrsprachig, DSGVO-konform. Für Praxen, Gastronomie, Dienstleister und Handwerk in ganz Deutschland.",
    benefits: [
      "Einrichtung in 7–14 Tagen",
      "Kein verpasster Anruf, keine Warteschleife",
      "Mehrsprachig auf Anfrage",
    ],
  },
  {
    icon: Zap,
    title: "Automatisierung Deutschland",
    slug: "automatisierung",
    description:
      "Wiederkehrende Prozesse automatisieren mit maßgeschneiderten Workflows und direkten API-Integrationen. Für Unternehmen, die täglich Zeit durch manuelle Abläufe verlieren.",
    benefits: [
      "Skalierbar ohne Mehrpersonal",
      "Vollständig dokumentiert, wartbar",
      "DSGVO-konform auf europäischen Servern",
    ],
  },
];

const CHALLENGES = [
  {
    icon: Users,
    title: "Fachkräftemangel in deutschen KMU",
    description:
      "Kleinen und mittelständischen Unternehmen in Deutschland fehlen Fachkräfte für administrative Tätigkeiten. KI übernimmt Telefonannahme, Datenpflege und Kundenkommunikation – zuverlässig und rund um die Uhr.",
  },
  {
    icon: TrendingUp,
    title: "Digitaler Wettbewerb wächst",
    description:
      "Der Digitalisierungsstand unter deutschen KMU ist ungleich verteilt. Wer jetzt investiert, sichert sich einen messbaren Wettbewerbsvorteil gegenüber Mitbewerbern, die noch auf analoge Prozesse setzen.",
  },
  {
    icon: Globe,
    title: "Online-Sichtbarkeit entscheidet",
    description:
      "Über 90 % aller Kaufentscheidungen beginnen mit einer Google-Suche. Unternehmen, die lokal und national nicht sichtbar sind, verlieren täglich Kunden – unabhängig von ihrer tatsächlichen Qualität.",
  },
  {
    icon: Phone,
    title: "Telefonische Erreichbarkeit als Konversionsfaktor",
    description:
      "In fast jeder deutschen Branche entscheidet die telefonische Erreichbarkeit darüber, ob eine Anfrage zum Auftrag wird. KI-Telefonassistenten lösen dieses Problem dauerhaft und kosteneffizient.",
  },
  {
    icon: Zap,
    title: "Manuelle Prozesse als Wachstumsengpass",
    description:
      "Deutschen KMU kostet manuelle Dateneingabe, Terminkoordination und Kundenkommunikation täglich Stunden. Automatisierung löst diese Engpässe einmalig – ohne laufenden Personalaufwand.",
  },
  {
    icon: Shield,
    title: "DSGVO-konforme KI-Nutzung",
    description:
      "Viele deutsche Unternehmen scheuen KI-Einsatz aus Datenschutzgründen. Cogniiq arbeitet ausschließlich mit DSGVO-konformen Lösungen auf europäischen Servern – volle Rechtssicherheit, keine Kompromisse.",
  },
];

const REGIONS = [
  {
    name: "Bayern",
    href: "/bayern",
    description: "Schwerpunktregion mit Standorten in Bayreuth, München und Regensburg.",
    highlight: true,
  },
  {
    name: "Baden-Württemberg",
    href: null,
    description: "Wirtschaftsstarkes Bundesland mit ausgeprägtem Mittelstand und Maschinenbausektor.",
    highlight: false,
  },
  {
    name: "Hessen",
    href: null,
    description: "Finanzmetropole Frankfurt und starker Dienstleistungssektor im Rhein-Main-Gebiet.",
    highlight: false,
  },
  {
    name: "Nordrhein-Westfalen",
    href: null,
    description: "Größtes Bundesland mit der höchsten Unternehmensdichte in Deutschland.",
    highlight: false,
  },
  {
    name: "Sachsen",
    href: null,
    description: "Wachsender Technologie- und Industriestandort mit starkem Mittelstand.",
    highlight: false,
  },
  {
    name: "Berlin",
    href: null,
    description: "Start-up-Metropole und Standort für skalierbare digitale Unternehmen.",
    highlight: false,
  },
];

const INDUSTRIES = [
  {
    name: "Mittelstand & KMU",
    description: "Deutsche Mittelständler automatisieren interne Abläufe und digitalisieren ihren Kundenauftritt – ohne eigene IT-Abteilung.",
  },
  {
    name: "Handwerk & Betriebe",
    description: "Handwerksbetriebe sichern Auftragsanfragen automatisch, optimieren ihr digitales Erscheinungsbild und werden lokal besser gefunden.",
  },
  {
    name: "Gastronomie & Restaurants",
    description: "Restaurants und Gastronomiebetriebe nehmen Reservierungen rund um die Uhr entgegen und automatisieren Gästekommunikation vollständig.",
  },
  {
    name: "Arztpraxen & Therapeuten",
    description: "Praxen entlasten ihr Team durch automatische Terminbuchung und erscheinen prominent bei lokalen Suchanfragen.",
  },
  {
    name: "Dienstleister & Beratung",
    description: "Lokale und überregionale Dienstleister automatisieren Leadverarbeitung und qualifizieren Anfragen ohne Zeitverlust.",
  },
  {
    name: "Industrie & Fertigung",
    description: "Industrieunternehmen synchronisieren ERP, CRM und Kundenkommunikation automatisch – keine manuelle Doppelerfassung mehr.",
  },
  {
    name: "Immobilien & Recht",
    description: "Immobilienbüros und Kanzleien filtern Erstanfragen effizient und strahlen online die Qualität aus, die ihre Marke verdient.",
  },
];

const USE_CASE_SCENARIOS = [
  {
    title: "Arztpraxis in Deutschland",
    description:
      "Eine Allgemeinmedizin-Praxis mit mehreren Behandlungszimmern erhält montags Anrufspitzen, die das Team überlasten. Der KI-Telefonassistent übernimmt Standardtermine, beantwortet Fragen zu Öffnungszeiten und qualifiziert Anfragen – ohne Personalaufwand und DSGVO-konform.",
  },
  {
    title: "Restaurant deutschlandweit",
    description:
      "Ein inhabergeführtes Restaurant erhält täglich Reservierungsanfragen per Telefon – auch abends nach Küchenschluss. Durch Automatisierung laufen Reservierungen, Bestätigungen und Erinnerungen vollständig automatisch, die Website generiert dank SEO mehr direkte Buchungen.",
  },
  {
    title: "Handwerksbetrieb überregional",
    description:
      "Ein Elektriker verpasst täglich Auftragsanfragen, weil die Mitarbeiter auf der Baustelle sind. Der KI-Telefonassistent nimmt Anfragen entgegen, qualifiziert das Anliegen und leitet strukturierte Nachrichten weiter. Angebotserstellung und Rechnungsstellung laufen automatisiert.",
  },
  {
    title: "Dienstleister mit nationaler Reichweite",
    description:
      "Ein Beratungsunternehmen mit mehreren Standorten nutzt verschiedene Tools für Leads, CRM, Termine und Abrechnung – ohne automatische Verbindung. Nach der Automatisierung fließen alle Anfragen zentral zusammen, Onboarding läuft in Minuten, Rechnungen entstehen automatisch.",
  },
];

const FAQ_ITEMS = [
  {
    q: "Arbeitet Cogniiq nur in Bayern oder deutschlandweit?",
    a: "Cogniiq betreut Projekte in ganz Deutschland – vollständig remote. Persönliche Vor-Ort-Termine sind im Raum Bayern möglich. Alle anderen Projekte laufen transparent und professionell über Video-Calls, geteilte Boards und vollständige Dokumentation.",
  },
  {
    q: "Kann die gesamte Zusammenarbeit remote stattfinden?",
    a: "Ja. Alle Projektphasen – von der Analyse bis zur Übergabe – laufen vollständig remote. Kein Vor-Ort-Termin nötig, keine Reisekosten, kein Zeitverlust.",
  },
  {
    q: "Welche Branchen in Deutschland betreut Cogniiq?",
    a: "Wir betreuen Unternehmen in Gastronomie, Gesundheitswesen, Handwerk, Mittelstand, Dienstleistung, Immobilien, Industrie und weiteren Sektoren – überall dort, wo manuelle Prozesse Zeit kosten oder digitale Sichtbarkeit fehlt.",
  },
  {
    q: "Sind die Lösungen DSGVO-konform für den deutschen Markt?",
    a: "Ja. Alle Systeme verarbeiten Daten ausschließlich auf europäischen Servern, entsprechen der DSGVO vollständig und werden mit den notwendigen Auftragsverarbeitungsverträgen (AVV) geliefert.",
  },
  {
    q: "Was unterscheidet Cogniiq von großen deutschen Agenturen?",
    a: "Kein Overhead einer Großagentur – direkter Ansprechpartner, faire Preise, schnelle Umsetzung. Wir sind auf drei Kernbereiche spezialisiert und kennen deren Zusammenspiel präzise.",
  },
  {
    q: "Welche Technologien nutzt Cogniiq für Automatisierungen?",
    a: "Wir setzen auf professionelle Automatisierungsplattformen – je nach Anforderungen an Datenschutz, Skalierbarkeit und Budget. Bei komplexeren Anforderungen auch direkte API-Integrationen.",
  },
  {
    q: "Wie schnell können Projekte starten?",
    a: "KI-Telefonassistenten sind in 7–14 Tagen live. Einfache Automatisierungen in 1–2 Wochen. Websites je nach Umfang in 4–12 Wochen. Realistischer Zeitplan nach dem Erstgespräch.",
  },
  {
    q: "Was kostet ein Projekt mit Cogniiq in Deutschland?",
    a: "Ohne Münchner oder Berliner Agenturoverhead. KI-Telefonassistenten nach Anrufvolumen, Automatisierungen ab ca. 500–1.500 €, Websites ab ca. 2.500 €. Erstgespräch immer kostenlos.",
  },
];

const cities = Object.entries(CITY_LINKS) as Array<[string, typeof CITY_LINKS[keyof typeof CITY_LINKS]]>;

const deutschlandSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${BUSINESS_INFO.website}/#organization`,
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
      "areaServed": {
        "@type": "Country",
        "name": "Deutschland",
      },
    },
  ],
};

export function DeutschlandPage() {
  const breadcrumbs = [
    { name: "Home", url: BUSINESS_INFO.website },
    { name: "Deutschland", url: `${BUSINESS_INFO.website}/deutschland` },
  ];

  return (
    <>
      <PageSEO
        title="KI Agentur Deutschland – Webdesign, KI Telefonassistent & Automatisierung | Cogniiq"
        description="Cogniiq – KI Agentur für Deutschland. Webdesign, KI Telefonassistent und Prozessautomatisierung für Unternehmen in ganz Deutschland. DSGVO-konform, remote betreut, faire Preise."
        canonical={`${BUSINESS_INFO.website}/deutschland`}
        breadcrumbs={breadcrumbs}
        additionalSchema={deutschlandSchema}
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
              <span className="text-gray-600 dark:text-gray-300">Deutschland</span>
            </motion.nav>

            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.1}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium tracking-wide uppercase mb-6">
                <MapPin size={12} />
                Deutschland · DSGVO-konform · Remote & Vor Ort · Persönliche Betreuung
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-tight mb-6">
                Webdesign, KI-Telefonassistent & Automatisierung in Deutschland
              </h1>

              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl leading-relaxed mb-8">
                Cogniiq entwickelt Websites, KI-Telefonassistenten und Automatisierungssysteme für Unternehmen in ganz Deutschland – mit Schwerpunkt Bayern und Standorten in Bayreuth, München und Regensburg. Remote betreut, persönlich begleitet, DSGVO-konform.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  to="/kontakt"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-700 dark:hover:bg-white transition-colors"
                >
                  Projekt in Deutschland starten
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
              {["Deutschland", "Bayern", "Bayreuth", "München", "Regensburg", "KI-Agentur", "DSGVO-konform", "Remote"].map((item, i) => (
                <span key={i} className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  {i > 0 && <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" aria-hidden="true" />}
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── EINLEITUNG ── */}
        <section className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300" aria-labelledby="intro-heading">
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
            >
              <h2 id="intro-heading" className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
                Digitalisierung für den deutschen Mittelstand
              </h2>
              <div className="space-y-5">
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Deutschland hat einen der dichtesten Mittelstandsmärkte der Welt – und gleichzeitig einen der größten Nachholbedarfe bei der Digitalisierung. Viele Unternehmen haben in den letzten Jahren Tools angesammelt, die nicht miteinander kommunizieren, Prozesse, die noch manuell laufen, und eine digitale Präsenz, die nicht dem Standard entspricht, den Kunden heute erwarten.
                </p>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Cogniiq ist eine spezialisierte KI-Agentur, die genau dort ansetzt: Wir automatisieren Abläufe, die täglich Zeit kosten. Wir setzen KI-Telefonassistenten ein, die kein Unternehmen mehr unerreichbar machen. Und wir entwickeln Websites, die in deutschen Suchmaschinen sichtbar sind und Besucher in qualifizierte Anfragen verwandeln. Alles DSGVO-konform, alles auf europäischen Servern, alles mit persönlicher Betreuung.
                </p>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Mit Hauptsitz in Bayern betreuen wir Projekte in ganz Deutschland – vollständig remote, transparent und ohne Qualitätseinbußen gegenüber lokalen Agenturen. Unser Schwerpunkt liegt auf <Link to="/bayern" className="text-gray-800 dark:text-gray-200 underline underline-offset-2 hover:text-gray-600 transition-colors">Bayern</Link>, aber unsere Leistungen kennen keine Grenzen im Bundesgebiet.
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
                Digitale Herausforderungen für Unternehmen in Deutschland
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Was deutsche KMU heute täglich belastet – und wie KI-Systeme konkret helfen.
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
                Leistungen für Unternehmen in Deutschland
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Drei Bereiche, die sich ideal ergänzen und gemeinsam die digitale Basis eines modernen Unternehmens bilden.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {SERVICES.map((service, i) => {
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
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── REGIONEN ── */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300" aria-labelledby="regions-heading">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="mb-12"
            >
              <h2 id="regions-heading" className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Regionen in Deutschland
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Schwerpunkt Bayern – Projekte in ganz Deutschland.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {REGIONS.map((region, i) => (
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i * 0.07}
                  className={`p-5 rounded-xl border transition-colors ${
                    region.highlight
                      ? "bg-white dark:bg-gray-800/80 border-gray-300 dark:border-gray-600"
                      : "bg-white dark:bg-gray-800/40 border-gray-200 dark:border-gray-700/50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin size={14} className={region.highlight ? "text-[#515A61] dark:text-sky-400" : "text-gray-400 dark:text-gray-500"} />
                    {region.href ? (
                      <Link
                        to={region.href}
                        className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        {region.name}
                        {region.highlight && (
                          <span className="ml-2 text-[10px] font-semibold uppercase tracking-widest bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
                            Schwerpunkt
                          </span>
                        )}
                      </Link>
                    ) : (
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{region.name}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{region.description}</p>
                  {region.href && (
                    <Link
                      to={region.href}
                      className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors group"
                    >
                      <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                      Bayern-Übersicht
                    </Link>
                  )}
                </motion.div>
              ))}
            </div>

            <motion.p
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0.4}
              className="mt-6 text-xs text-gray-500 dark:text-gray-400 text-center"
            >
              Cogniiq betreut Projekte in allen genannten Regionen sowie dem gesamten Bundesgebiet – vollständig remote.
            </motion.p>
          </div>
        </section>

        {/* ── STANDORTE ── */}
        <section className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300" aria-labelledby="standorte-heading">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="mb-10"
            >
              <h2 id="standorte-heading" className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Standorte & Leistungen im Detail
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Unsere lokalen Service-Seiten für Bayern – vollständige Informationen je Stadt und Service.
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
          </div>
        </section>

        {/* ── BRANCHEN ── */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300" aria-labelledby="industries-heading">
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
                Branchen in Deutschland
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Cogniiq betreut Unternehmen quer durch alle Sektoren der deutschen Wirtschaft.
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
                  className="p-5 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50"
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
        <section className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300" aria-labelledby="scenarios-heading">
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
                Einsatz von KI & Automatisierung in Deutschland
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Konkrete Szenarien, wie Cogniiq-Lösungen Unternehmen deutschlandweit entlasten.
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
                  className="flex gap-4 p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700"
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
        <section className="py-16 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 transition-colors duration-300" aria-labelledby="linkmatrix-heading">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="mb-10"
            >
              <h2 id="linkmatrix-heading" className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Alle Leistungen nach Stadt & Service
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Vollständige Übersicht aller lokalen Service-Seiten.
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
                {
                  service: "Webdesign",
                  links: [
                    { label: "Webdesign Bayern", href: "/bayern" },
                    { label: "Webdesign Bayreuth", href: "/bayreuth/webdesign" },
                    { label: "Webdesign München", href: "/muenchen/webdesign" },
                    { label: "Webdesign Regensburg", href: "/regensburg/webdesign" },
                  ],
                },
                {
                  service: "KI-Telefonassistent",
                  links: [
                    { label: "KI-Telefonassistent Bayern", href: "/bayern" },
                    { label: "KI-Telefonassistent Bayreuth", href: "/bayreuth/ki-telefonassistent" },
                    { label: "KI-Telefonassistent München", href: "/muenchen/ki-telefonassistent" },
                    { label: "KI-Telefonassistent Regensburg", href: "/regensburg/ki-telefonassistent" },
                  ],
                },
                {
                  service: "Automatisierung",
                  links: [
                    { label: "Automatisierung Bayern", href: "/bayern" },
                    { label: "Automatisierung Bayreuth", href: "/bayreuth/automatisierung" },
                    { label: "Automatisierung München", href: "/muenchen/automatisierung" },
                    { label: "Automatisierung Regensburg", href: "/regensburg/automatisierung" },
                  ],
                },
              ].map((col) => (
                <div key={col.service}>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                    {col.service}
                  </p>
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
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="mb-10"
            >
              <h2 id="faq-heading" className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Häufige Fragen – Deutschland
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Alles Wichtige zu Cogniiq und unseren Leistungen für Unternehmen in Deutschland.
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
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">{item.q}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.a}</p>
                </motion.div>
              ))}
            </div>
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
                Digitale Systeme für Unternehmen in Deutschland
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
                Kostenloses Erstgespräch – für Unternehmen in ganz Deutschland. Remote, ohne Verpflichtung, mit konkretem Ergebnis in 30–45 Minuten.
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
