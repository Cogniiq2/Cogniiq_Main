import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Globe, CircleCheck as CheckCircle2, ChevronRight, Building2, Lightbulb, Star, Zap, Shield, TrendingUp, Monitor } from "lucide-react";
import { PageSEO } from "@/components/PageSEO";
import { BUSINESS_INFO } from "@/lib/seo-data";

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
    icon: Monitor,
    title: "Individuelle Website-Entwicklung",
    description: "Keine Templates, kein Baukasten. Jede Website wird von Grund auf für Ihre Branche, Ihre Zielgruppe und Ihre Conversion-Ziele entwickelt.",
    benefits: [
      "Mobile-First, Ladezeit unter 2 Sekunden",
      "Konversionsorientiertes Design",
      "Sauberer Code, keine unnötigen Plugins",
    ],
  },
  {
    icon: Globe,
    title: "Lokales & nationales SEO",
    description: "Websites, die bei Google für die richtigen Suchbegriffe gefunden werden – lokal in Ihrer Stadt und national für Ihre Branche.",
    benefits: [
      "On-Page SEO von Anfang an integriert",
      "Technisches SEO: Schema, Sitemap, Core Web Vitals",
      "Lokale SEO-Struktur für mehrere Standorte",
    ],
  },
  {
    icon: Zap,
    title: "Performance & Conversion",
    description: "Eine Website, die Besucher in Anfragen und Kunden verwandelt. Klare CTAs, optimierte Formulare und messbare Conversion-Pfade.",
    benefits: [
      "A/B-getestete Seitenstrukturen",
      "Kontaktformulare mit automatischer Weiterleitung",
      "Analytics-Integration für Erfolgsmessung",
    ],
  },
];

const CHALLENGES = [
  {
    icon: Globe,
    title: "Webseiten, die nicht gefunden werden",
    description: "Millionen Websites in Deutschland ranken nie auf Seite 1. Ohne technische SEO-Grundlage und lokale Optimierung ist eine Website unsichtbar.",
  },
  {
    icon: TrendingUp,
    title: "Keine Conversion trotz Traffic",
    description: "Besucher kommen, aber Anfragen bleiben aus. Schlechte Nutzerführung, unklare CTAs und langsame Ladezeiten kosten täglich Umsatz.",
  },
  {
    icon: Building2,
    title: "Template-Websites ohne Differenzierung",
    description: "WordPress-Templates und Baukastensysteme sehen alle gleich aus. Kunden spüren es – und entscheiden sich für Anbieter mit professionellerem Auftritt.",
  },
  {
    icon: Shield,
    title: "Veraltete Websites, die Vertrauen kosten",
    description: "Eine Website aus 2018 signalisiert Kunden, dass das Unternehmen nicht investiert. Im B2B- und Dienstleistungssektor ein direkter Kundenverlust.",
  },
  {
    icon: Monitor,
    title: "Schlechte Mobile-Erfahrung",
    description: "Über 65 % aller Suchanfragen in Deutschland kommen von Mobilgeräten. Websites, die auf dem Smartphone nicht funktionieren, verlieren die Mehrheit ihrer potenziellen Kunden.",
  },
  {
    icon: Star,
    title: "Kein System für Online-Bewertungen",
    description: "Unternehmen ohne Bewertungsstrategie werden in lokalen Suchergebnissen von gut bewerteten Mitbewerbern verdrängt.",
  },
];

const INDUSTRIES = [
  { name: "Gastronomie & Restaurants", href: "/webdesign-gastronomie", description: "Digitale Speisekarten, Online-Reservierung, lokales SEO." },
  { name: "Arztpraxen & Therapeuten", href: "/webdesign-arzt", description: "DSGVO-konforme Praxis-Websites mit Online-Terminbuchung." },
  { name: "Immobilien", href: "/webdesign-immobilien", description: "Premium-Webdesign für Makler mit Exposé-Präsentation." },
  { name: "Hotels & Pensionen", href: "/webdesign-hotel", description: "Direktbuchungs-Systeme, OTA-Abhängigkeit reduzieren." },
  { name: "Fitness & Sport", href: "/webdesign-sport", description: "Digitaler Kurskalender, Mitglieder gewinnen." },
];

const CITIES = [
  { label: "Webdesign Bayreuth", href: "/bayreuth/webdesign" },
  { label: "Webdesign München", href: "/muenchen/webdesign" },
  { label: "Webdesign Regensburg", href: "/regensburg/webdesign" },
  { label: "Webdesign Bayern", href: "/bayern" },
];

const COST_LINKS = [
  { label: "Was kostet eine Website?", href: "/kosten-webdesign" },
  { label: "Website erstellen Bayreuth", href: "/bayreuth/website-erstellen" },
  { label: "Website erstellen München", href: "/muenchen/website-erstellen" },
  { label: "Website Relaunch", href: "/bayreuth/website-relaunch" },
];

const RELATED_LINKS = [
  { label: "KI Agentur Deutschland", href: "/ki-agentur-deutschland" },
  { label: "Automatisierung für Unternehmen", href: "/automatisierung-unternehmen" },
  { label: "KI Telefonassistent", href: "/ki-telefonassistent" },
  { label: "Leistungen", href: "/leistungen" },
  { label: "Kontakt", href: "/kontakt" },
];

const USE_CASES = [
  {
    title: "Arztpraxis mit schlechtem Online-Auftritt",
    description: "Eine Praxis mit drei Ärzten erscheint bei Google auf Seite 4. Keine Terminbuchung online, keine Bewertungen, veraltetes Design. Nach Website-Neugestaltung und lokaler SEO-Optimierung: Platz 1 für die wichtigsten Suchbegriffe, 40 % mehr Online-Anfragen.",
  },
  {
    title: "Restaurant ohne Direktbuchungen",
    description: "Ein Restaurant zahlt 20–30 % Provision an Reservierungsplattformen. Nach Website-Relaunch mit eigenem Buchungssystem: 60 % der Reservierungen direkt – keine Provision mehr.",
  },
  {
    title: "Handwerksbetrieb ohne digitale Sichtbarkeit",
    description: "Ein Elektriker in Bayern erhält alle Anfragen über Empfehlungen. Nach Website-Launch mit lokalem SEO: erste Google-Anfragen innerhalb von 8 Wochen, Auftragskalender voll.",
  },
  {
    title: "Immobilienmakler ohne Premium-Präsenz",
    description: "Ein Maklerbüro tritt mit einer Vorlage-Website gegen große Portale an. Nach Neugestaltung mit professioneller Exposé-Darstellung und Local SEO: deutlich mehr direkte Anfragen ohne Portalgebühren.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Was kostet eine professionelle Website bei Cogniiq?",
    answer: "Einfachere Websites beginnen ab ca. 1.500–2.500 €, professionelle Unternehmenswebsites mit SEO und Conversion-Optimierung liegen typischerweise bei 2.500–6.000 €. Komplexere Projekte mit Buchungssystem, mehrsprachigkeit oder E-Commerce darüber. Genaue Preise auf der Kosten-Seite oder nach kostenlosem Erstgespräch.",
  },
  {
    question: "Wie lange dauert die Entwicklung einer Website?",
    answer: "Einfachere Websites: 4–6 Wochen. Professionelle Unternehmenswebsites: 6–10 Wochen. Komplexe Projekte: 10–14 Wochen. Der genaue Zeitplan wird im Erstgespräch festgelegt und eingehalten.",
  },
  {
    question: "Betreut Cogniiq Webdesign-Projekte in ganz Deutschland?",
    answer: "Ja, vollständig remote. Persönliche Termine sind im Raum Bayern möglich. Für den Rest Deutschlands läuft die Zusammenarbeit über Video-Calls und geteilte Arbeitsdokumente – ohne Qualitätsverlust.",
  },
  {
    question: "Welche Technologien verwendet Cogniiq für Websites?",
    answer: "Je nach Anforderung: React/Next.js für Performance-optimierte Websites, WordPress für Content-lastige Seiten mit einfacher Verwaltung, oder statische Generatoren für maximale Ladegeschwindigkeit. Immer mit sauberem Code und ohne unnötige Plugin-Abhängigkeiten.",
  },
  {
    question: "Ist SEO in der Website-Entwicklung inklusive?",
    answer: "Ja. On-Page SEO, technische SEO-Grundlage (Schema, Sitemap, Core Web Vitals), Ladegeschwindigkeit und lokale SEO-Struktur sind in jedes Projekt integriert – kein kostenpflichtiges Add-on.",
  },
  {
    question: "Kann Cogniiq bestehende Websites verbessern oder muss alles neu gebaut werden?",
    answer: "Beides ist möglich. Bei Websites, die strukturell funktionieren, setzen wir gezielte Optimierungen um. Bei veralteten Websites, die technisch nicht mehr zeitgemäß sind, empfehlen wir einen Relaunch – klare Empfehlung nach kostenloser Analyse.",
  },
  {
    question: "Gibt es laufende Betreuung nach der Website-Fertigstellung?",
    answer: "Auf Wunsch ja. Wir bieten Wartungspakete für Updates, Backups, Sicherheits-Monitoring und Inhaltsanpassungen. Kein Muss – die Website gehört vollständig Ihnen.",
  },
];

const webdesignSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ProfessionalService",
      "@id": `${BUSINESS_INFO.website}/webdesign-agentur-deutschland#service`,
      "name": "Webdesign Agentur Deutschland – Cogniiq",
      "url": `${BUSINESS_INFO.website}/webdesign-agentur-deutschland`,
      "provider": {
        "@type": "Organization",
        "name": BUSINESS_INFO.name,
        "url": BUSINESS_INFO.website,
      },
      "areaServed": {
        "@type": "Country",
        "name": "Deutschland",
      },
      "serviceType": "Webdesign",
      "description": "Professionelles Webdesign für Unternehmen in ganz Deutschland. Individuelle Websites mit SEO-Optimierung und Conversion-Fokus.",
    },
  ],
};

export function WebdesignAgenturDeutschland() {
  const breadcrumbs = [
    { name: "Home", url: BUSINESS_INFO.website },
    { name: "Webdesign Agentur Deutschland", url: `${BUSINESS_INFO.website}/webdesign-agentur-deutschland` },
  ];

  const faqItems = FAQ_ITEMS.map((f) => ({ question: f.question, answer: f.answer }));

  return (
    <>
      <PageSEO
        title="Webdesign Agentur Deutschland – Professionelle Websites für Unternehmen | Cogniiq"
        description="Cogniiq – Webdesign Agentur für Unternehmen in Deutschland. Individuelle Websites mit lokalem SEO, schneller Ladezeit und Conversion-Fokus. DSGVO-konform, transparent, fair bepreist."
        canonical={`${BUSINESS_INFO.website}/webdesign-agentur-deutschland`}
        breadcrumbs={breadcrumbs}
        faqItems={faqItems}
        additionalSchema={webdesignSchema}
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
              <span className="text-gray-600 dark:text-gray-300">Webdesign Agentur Deutschland</span>
            </motion.nav>

            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.1}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium tracking-wide uppercase mb-6">
                <Globe size={12} />
                Webdesign · Deutschland · DSGVO-konform · Lokal & National
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-tight mb-6">
                Webdesign Agentur Deutschland – Websites, die gefunden werden und konvertieren
              </h1>

              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl leading-relaxed mb-8">
                Cogniiq entwickelt professionelle Websites für Unternehmen in ganz Deutschland – individuell gestaltet, technisch sauber, mit integrierter SEO und klarem Conversion-Fokus. Kein Template, kein Baukasten, kein Overhead einer Großagentur.
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
                  to="/kosten-webdesign"
                  className="inline-flex items-center gap-2 px-6 py-3.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm hover:border-gray-500 dark:hover:border-gray-400 transition-colors"
                >
                  Webdesign Kosten
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── TRUST BAR ── */}
        <div className="border-y border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
              {["Individuelle Entwicklung", "Mobile-First", "SEO integriert", "DSGVO-konform", "Unter 2 Sekunden Ladezeit", "Persönliche Betreuung"].map((item, i) => (
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
                Professionelles Webdesign für den deutschen Mittelstand
              </h2>
              <div className="space-y-5">
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Der Großteil der Unternehmenswebsites in Deutschland erfüllt seinen eigentlichen Zweck nicht: gefunden werden und Anfragen generieren. Entweder rankt die Website nicht, oder sie überzeugt nicht – oft beides. Das Ergebnis: Wachstum findet offline statt, während die digitale Präsenz Kosten produziert, aber keinen Umsatz.
                </p>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Cogniiq entwickelt Websites, die beides leisten. Technisch sauber und schnell genug für Google, inhaltlich und strukturell überzeugend genug für Ihre Zielgruppe. Mit integriertem lokalem SEO für Ihre Stadt und Ihrer Branche – ob in{" "}
                  <Link to="/bayreuth/webdesign" className="text-gray-800 dark:text-gray-200 underline underline-offset-2 hover:text-gray-600 transition-colors">Bayreuth</Link>,{" "}
                  <Link to="/muenchen/webdesign" className="text-gray-800 dark:text-gray-200 underline underline-offset-2 hover:text-gray-600 transition-colors">München</Link>,{" "}
                  <Link to="/regensburg/webdesign" className="text-gray-800 dark:text-gray-200 underline underline-offset-2 hover:text-gray-600 transition-colors">Regensburg</Link>{" "}
                  oder deutschlandweit.
                </p>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Kein Münchner Agenturoverhead, kein Team von 30 Personen, das Projekte verzögert. Direkte Ansprechpartner, schnelle Umsetzung, faire Preise – und Websites, die nachweislich besser ranken und mehr konvertieren als das, was die meisten Agenturen liefern.
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
                Was Cogniiq im Webdesign liefert
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Drei Kernbereiche, die zusammen eine Website entstehen lassen, die wirklich arbeitet.
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
                Warum viele Websites in Deutschland scheitern
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Häufige Probleme, die wir in der Praxis immer wieder lösen.
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
                Webdesign nach Branche
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Spezialisierte Lösungen für jede Branche – kein Einheitsprodukt.
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
                Webdesign in der Praxis – konkrete Beispiele
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Was Cogniiq-Websites für Unternehmen in Deutschland bewirken.
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
                Webdesign nach Stadt & Thema
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Alle weiterführenden Seiten zu Webdesign, Standorten und verwandten Themen.
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
                { heading: "Städte", links: CITIES },
                { heading: "Kosten & Infos", links: COST_LINKS },
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
                Häufige Fragen – Webdesign Deutschland
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Alles Wichtige zu Webdesign, Kosten und Zusammenarbeit mit Cogniiq.
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
                Website, die wirklich arbeitet
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
                Kostenloses Erstgespräch – wir analysieren Ihre aktuelle Situation und zeigen, was möglich ist. Für Unternehmen in ganz Deutschland, remote und ohne Verpflichtung.
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
                  to="/kosten-webdesign"
                  className="inline-flex items-center gap-2 px-7 py-3.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:border-gray-500 dark:hover:border-gray-400 transition-colors"
                >
                  Webdesign Kosten
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
