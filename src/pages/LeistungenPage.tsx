import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight, Globe, Phone, Zap } from "lucide-react";
import { PageSEO } from "@/components/PageSEO";
import { PAGE_META, BUSINESS_INFO } from "@/lib/seo-data";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const SUBNAV_ITEMS = [
  { label: "Übersicht", anchor: "uebersicht" },
  { label: "Webdesign", anchor: "webdesign" },
  { label: "KI-Telefon", anchor: "ki-telefonassistent" },
  { label: "Automatisierung", anchor: "automatisierung" },
  { label: "System-Beispiele", anchor: "systeme" },
  { label: "Ablauf", anchor: "ablauf" },
  { label: "FAQ", anchor: "faq" },
  { label: "Kontakt", anchor: "kontakt-cta" },
];

const SERVICES = [
  {
    id: "webdesign",
    index: "01",
    icon: Globe,
    name: "Webdesign",
    tagline: "Eine Website, die gefunden wird, überzeugt und Anfragen erzeugt — nicht nur existiert.",
    benefits: [
      "Conversion-Architektur für messbar mehr Anfragen",
      "Technisches SEO und Local SEO für organische Sichtbarkeit",
      "Schnelle Ladezeiten und Mobile-first Entwicklung",
      "Integration von Buchungs-, Kalender- und Kontaktsystemen",
    ],
    usecases: ["Arzt & Praxis", "Gastronomie & Restaurant"],
    cities: [
      { label: "Bayreuth", href: "/bayreuth" },
      { label: "München", href: "/muenchen" },
      { label: "Regensburg", href: "/regensburg" },
    ],
    branchenLinks: [
      { label: "Webdesign Gastronomie", href: "/webdesign-gastronomie" },
      { label: "Webdesign Arzt", href: "/webdesign-arzt" },
      { label: "Webdesign Immobilien", href: "/webdesign-immobilien" },
      { label: "Webdesign Kosten", href: "/kosten-webdesign" },
    ],
  },
  {
    id: "ki-telefonassistent",
    index: "02",
    icon: Phone,
    name: "KI-Telefonassistent",
    tagline: "24/7 Anrufannahme in natürlicher Sprache — kein verpasster Termin, kein verpasster Umsatz.",
    benefits: [
      "Anrufannahme rund um die Uhr in natürlicher Sprache",
      "Automatische Terminbuchung, Bestätigung und Erinnerung",
      "Intelligente Weiterleitung bei komplexen Anfragen",
      "Vollständige Synchronisation mit Kalender und CRM",
    ],
    usecases: ["Praxis & Klinik", "Gastronomie & Hotel"],
    cities: [
      { label: "Bayreuth", href: "/bayreuth" },
      { label: "München", href: "/muenchen" },
      { label: "Regensburg", href: "/regensburg" },
    ],
    branchenLinks: [
      { label: "KI Telefonassistent Arzt", href: "/ki-telefonassistent-arzt" },
      { label: "KI Telefonassistent Restaurant", href: "/ki-telefonassistent-restaurant" },
      { label: "KI Telefonassistent Hotel", href: "/ki-telefonassistent-hotel" },
      { label: "KI Telefonassistent Kosten", href: "/kosten-ki-telefonassistent" },
    ],
  },
  {
    id: "automatisierung",
    index: "03",
    icon: Zap,
    name: "Automatisierung",
    tagline: "Routineaufgaben laufen vollautomatisch — ohne tägliches Eingreifen, ohne zusätzliches Personal.",
    benefits: [
      "Nahtlose Systemintegration: CRM, Kalender, Buchung, Kasse",
      "Automatische Benachrichtigungen, Erinnerungen und Follow-ups",
      "Prozess-Workflows mit Eskalations- und Ausfall-Logik",
      "Monitoring und Logging für zuverlässigen Dauerbetrieb",
    ],
    usecases: ["Restaurants & Gastronomie", "Arztpraxen & Therapeuten"],
    cities: [
      { label: "Bayreuth", href: "/bayreuth" },
      { label: "München", href: "/muenchen" },
      { label: "Regensburg", href: "/regensburg" },
    ],
    branchenLinks: [
      { label: "Automatisierung Restaurant", href: "/automatisierung-restaurant" },
      { label: "Automatisierung Arzt", href: "/automatisierung-arzt" },
      { label: "Automatisierung Immobilien", href: "/automatisierung-immobilien" },
      { label: "Automatisierung Kosten", href: "/kosten-automatisierung" },
    ],
  },
];

const OUTCOMES = [
  { metric: "Keine verpassten Anrufe mehr", context: "KI-Assistent nimmt 24/7 ab — auch nachts, am Wochenende und bei Stoßzeiten" },
  { metric: "Terminbuchung ohne Rückruf", context: "Patienten, Gäste und Kunden buchen direkt — ohne auf eine Antwort zu warten" },
  { metric: "No-Shows messbar reduziert", context: "Automatische Erinnerungen mit Bestätigungslink bis zu 48 Stunden vorher" },
  { metric: "Mehr qualifizierte Anfragen", context: "SEO-optimierte Websites, die gefunden werden — und Besucher in Kunden verwandeln" },
  { metric: "Stunden Verwaltung eingespart", context: "Bestätigungen, Erinnerungen, Follow-ups und CRM-Pflege laufen ohne manuellen Aufwand" },
];

const SYSTEM_PANELS = [
  {
    label: "Praxis-System",
    stack: ["Website", "KI-Telefonrezeption", "Terminlogik", "Automatisierung"],
    outcomes: [
      "Kein verpasster Anruf mehr",
      "Terminbuchung ohne Empfangsaufwand",
      "Automatische Erinnerungen für Patienten",
      "Entlastung des gesamten Praxisteams",
    ],
    branche: "/webdesign-arzt-bayreuth",
    brancheLabel: "Praxis-Lösung ansehen",
  },
  {
    label: "Restaurant-System",
    stack: ["Website", "Reservierungslogik", "KI-Telefonassistent", "CRM-Integration"],
    outcomes: [
      "Tischreservierung 24 Stunden, 7 Tage",
      "Spürbar weniger No-Shows",
      "Automatisierte Gäste-Erinnerungen",
      "Bessere Auslastung bei gleichem Team",
    ],
    branche: "/webdesign-gastronomie-bayreuth",
    brancheLabel: "Restaurant-Lösung ansehen",
  },
  {
    label: "Immobilien-System",
    stack: ["Website", "Lead-Qualifizierung", "Besichtigungslogik", "Automatisierung"],
    outcomes: [
      "Anfragen 24/7 qualifiziert und sortiert",
      "Besichtigungstermine ohne Rückrufaufwand",
      "Automatische Nachverfolgung von Interessenten",
      "Mehr Kapazität für echte Verkaufsgespräche",
    ],
    branche: "/webdesign-immobilien-bayreuth",
    brancheLabel: "Immobilien-Lösung ansehen",
  },
  {
    label: "Sportanlage-System",
    stack: ["Website", "Online-Buchungssystem", "Auslastungs-Automation", "Zahlungslogik"],
    outcomes: [
      "Platzbuchungen vollständig ohne Telefon",
      "Automatische Bestätigungen und Erinnerungen",
      "Klare Kapazitätsplanung in Echtzeit",
      "Direkter Umsatz ohne manuellen Aufwand",
    ],
    branche: "/kontakt",
    brancheLabel: "Ähnliches Projekt besprechen",
  },
];

const PROCESS_STEPS = [
  {
    number: "01",
    title: "Analyse & Zieldefinition",
    description:
      "Wir verstehen Ihr Geschäftsmodell, Ihre konkreten Engpässe und messbaren Ziele. Kein generischer Fragebogen — spezifische Einschätzung in 30 Minuten.",
  },
  {
    number: "02",
    title: "System-Architektur",
    description:
      "Wir definieren, welche Komponenten, Integrationen und Prozessflows Ihr Ziel am direktesten erreichen. Die Architektur entscheidet über den Erfolg.",
  },
  {
    number: "03",
    title: "Umsetzung & Integration",
    description:
      "Entwicklung in klar definierten Phasen mit regelmäßigen Zwischenständen. Alle Systeme werden integriert, getestet und auf Ihren Betrieb kalibriert.",
  },
  {
    number: "04",
    title: "Go-Live & Optimierung",
    description:
      "Inbetriebnahme mit Übergabe, laufendem Monitoring und gezielter Nachoptimierung auf Basis realer Nutzungsdaten — nicht auf Annahmen.",
  },
];

const FAQ_ITEMS = [
  {
    q: "Wie schnell ist ein Go-Live realistisch?",
    a: "Einzelne Workflows wie Terminbestätigungen oder der KI-Telefonassistent sind oft in 7–14 Tagen live. Vollständige Systemverbünde aus Website, KI-Assistenten und Automatisierung planen wir in 3–6 Wochen — abhängig vom Scope und wie schnell Feedback kommt.",
  },
  {
    q: "Was kostet ein System?",
    a: "Einzellösungen starten im niedrigen vierstelligen Bereich. Integrierte Systemarchitekturen — Website, KI-Assistent und Automatisierung kombiniert — liegen je nach Komplexität höher. Eine konkrete Einschätzung Ihres spezifischen Setups erhalten Sie im kostenlosen Erstgespräch, ohne Verpflichtung.",
  },
  {
    q: "Sind die Systeme DSGVO-konform?",
    a: "Ja, und das ist kein Marketingversprechen. Alle Daten werden ausschließlich auf europäischen Servern verarbeitet. Wir liefern mit jedem System die notwendige Dokumentation: Datenschutzerklärung, AVV und Cookie-Consent. Für Praxen und Betriebe mit sensiblen Patientendaten gibt es spezielle Konfigurationen.",
  },
  {
    q: "Kann das in unsere bestehenden Tools integriert werden?",
    a: "In der Regel ja. Wir integrieren in gängige Kalender-, CRM-, Buchungs- und Kassensysteme: von Tomedo und CGM über OnOffice und HubSpot bis zu Lightspeed und Magicline. Im Erstgespräch klären wir konkret, was mit Ihrer Infrastruktur möglich und sinnvoll ist.",
  },
  {
    q: "Was, wenn wir nur mit einem Service starten möchten?",
    a: "Das ist der häufigste Einstieg — und der richtige. Starten Sie mit dem, was den größten unmittelbaren Hebel hat. Die Architektur ist von Anfang an so gestaltet, dass spätere Erweiterungen um weitere Services ohne Umbauten möglich sind.",
  },
  {
    q: "Wie läuft die Zusammenarbeit remote ab?",
    a: "Vollständig remote — von der Analyse bis zum Go-Live. Abstimmungen per Video-Call, Zwischenstände mit Dokumentation, technische Übergaben asynchron. Für Standorte in Bayreuth, München und Regensburg sind auch Vor-Ort-Termine möglich.",
  },
  {
    q: "Gibt es laufende Betreuung nach dem Go-Live?",
    a: "Ja. Wir bieten Monitoring, Optimierung und Anpassungen auf Basis realer Nutzungsdaten. Kein System ist nach dem Launch fertig — das Optimierungspotenzial entsteht erst, wenn echte Nutzer mit dem System interagieren. Der Umfang wird projektspezifisch vereinbart.",
  },
];

const CITY_HUBS = [
  {
    city: "Bayreuth",
    href: "/bayreuth",
    services: [
      { label: "Webdesign Bayreuth", href: "/bayreuth" },
      { label: "KI-Telefonassistent Bayreuth", href: "/bayreuth" },
      { label: "Automatisierung Bayreuth", href: "/bayreuth" },
    ],
  },
  {
    city: "München",
    href: "/muenchen",
    services: [
      { label: "Webdesign München", href: "/muenchen" },
      { label: "KI-Telefonassistent München", href: "/muenchen" },
      { label: "Automatisierung München", href: "/muenchen" },
    ],
  },
  {
    city: "Regensburg",
    href: "/regensburg",
    services: [
      { label: "Webdesign Regensburg", href: "/regensburg" },
      { label: "KI-Telefonassistent Regensburg", href: "/regensburg" },
      { label: "Automatisierung Regensburg", href: "/regensburg" },
    ],
  },
];

const BRANCHEN_HUBS = [
  {
    branche: "Arzt & Praxis",
    links: [
      { label: "Bayreuth", href: "/webdesign-arzt-bayreuth" },
      { label: "München", href: "/webdesign-arzt-muenchen" },
      { label: "Regensburg", href: "/webdesign-arzt-regensburg" },
    ],
  },
  {
    branche: "Gastronomie",
    links: [
      { label: "Bayreuth", href: "/webdesign-gastronomie-bayreuth" },
      { label: "München", href: "/webdesign-gastronomie-muenchen" },
      { label: "Regensburg", href: "/webdesign-gastronomie-regensburg" },
    ],
  },
  {
    branche: "Immobilien",
    links: [
      { label: "Bayreuth", href: "/webdesign-immobilien-bayreuth" },
      { label: "München", href: "/webdesign-immobilien-muenchen" },
      { label: "Regensburg", href: "/webdesign-immobilien-regensburg" },
    ],
  },
];

function SubNav() {
  const [active, setActive] = useState("uebersicht");
  const [isSticky, setIsSticky] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsSticky(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-1px 0px 0px 0px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const sections = SUBNAV_ITEMS.map((item) => ({
        id: item.anchor,
        el: document.getElementById(item.anchor),
      }));
      const scrollY = window.scrollY + 120;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = sections[i].el;
        if (el && el.offsetTop <= scrollY) {
          setActive(sections[i].id);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (anchor: string) => {
    const el = document.getElementById(anchor);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <>
      <div ref={sentinelRef} className="h-0" />
      <div
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isSticky
            ? "bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm shadow-sm"
            : "bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm"
        } border-b border-gray-100 dark:border-gray-800`}
      >
        <div className="max-w-[1100px] mx-auto px-6 lg:px-8">
          <div className="overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            <nav
              aria-label="Seitennavigation"
              className="flex items-center gap-0 h-12 min-w-max"
            >
              {SUBNAV_ITEMS.map((item) => (
                <button
                  key={item.anchor}
                  onClick={() => scrollTo(item.anchor)}
                  className={`px-4 h-full text-xs font-medium tracking-wide transition-colors whitespace-nowrap border-b-2 ${
                    active === item.anchor
                      ? "border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100"
                      : "border-transparent text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
      custom={index * 0.05}
      className="border-b border-gray-100 dark:border-gray-800"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug">
          {q}
        </span>
        <span
          className={`flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-400 transition-transform duration-200 ${
            open ? "rotate-45" : ""
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <line x1="7" y1="1" x2="7" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="1" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      {open && (
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed pb-5 pr-8 max-w-2xl">
          {a}
        </p>
      )}
    </motion.div>
  );
}

export function LeistungenPage() {
  const breadcrumbs = [
    { name: "Home", url: BUSINESS_INFO.website },
    { name: "Leistungen", url: PAGE_META.leistungen.canonical },
  ];

  return (
    <>
      <PageSEO
        title={PAGE_META.leistungen.title}
        description={PAGE_META.leistungen.description}
        canonical={PAGE_META.leistungen.canonical}
        breadcrumbs={breadcrumbs}
      />

      <main className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section id="uebersicht" className="pt-40 pb-20 px-6 lg:px-8 scroll-mt-0">
          <div className="max-w-[780px] mx-auto">
            <motion.nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-600 mb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Link to="/" className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors">
                Home
              </Link>
              <ChevronRight size={10} />
              <span className="text-gray-500 dark:text-gray-400">Leistungen</span>
            </motion.nav>

            <h1
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-[1.05] mb-7"
            >
              Digitale Systeme,<br />
              die Umsatz erzeugen<br />
              und Arbeit eliminieren.
            </h1>

            <motion.p
              className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed font-light max-w-[560px] mb-8"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            >
              Für Praxen, Restaurants, Makler und Studios, die aufgehört haben, Einzellösungen zu stapeln — und ein System wollen, das tatsächlich Ergebnisse erzeugt.
            </motion.p>

            <motion.p
              className="text-xs text-gray-400 dark:text-gray-600 tracking-wide mb-9 font-light italic"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.28 }}
            >
              Wir analysieren zuerst, dann bauen wir — kein Standardpaket, keine Agentur-Vorlagen.
            </motion.p>

            <motion.div
              className="flex flex-wrap items-center gap-2 mb-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.32 }}
            >
              {["DSGVO-konform", "Europa-Hosting", "Setup 7–14 Tage", "Remote möglich"].map((chip) => (
                <span
                  key={chip}
                  className="inline-block px-3 py-1 text-[11px] font-medium text-gray-500 dark:text-gray-500 border border-gray-200 dark:border-gray-800 tracking-wide"
                >
                  {chip}
                </span>
              ))}
            </motion.div>

            <motion.div
              className="flex flex-wrap items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Link
                to="/kontakt"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-semibold text-sm tracking-wide hover:bg-gray-700 dark:hover:bg-white transition-colors"
              >
                Kostenloses Erstgespräch
                <ArrowRight size={14} />
              </Link>
              <Link
                to="/deutschland"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 font-semibold text-sm tracking-wide hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
              >
                Standorte ansehen
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ── STICKY SUBNAV ─────────────────────────────────────────────── */}
        <SubNav />

        {/* ── THREE SERVICES ────────────────────────────────────────────── */}
        <section
          aria-labelledby="services-heading"
          className="border-t border-gray-100 dark:border-gray-800"
        >
          <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-20 lg:py-28">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="mb-16"
            >
              <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-gray-300 dark:text-gray-700 mb-6">
                Services
              </p>
              <h2
                id="services-heading"
                className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight"
              >
                Drei Services. Ein Systemgedanke.
              </h2>
            </motion.div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {SERVICES.map((service, i) => {
                const Icon = service.icon;
                return (
                  <motion.div
                    key={service.id}
                    id={service.id}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-60px" }}
                    variants={fadeUp}
                    custom={i * 0.07}
                    className="py-16 scroll-mt-20"
                  >
                    <div className="grid md:grid-cols-[260px_1fr] lg:grid-cols-[320px_1fr] gap-12 lg:gap-20 items-start">
                      <div>
                        <div className="flex items-center gap-3 mb-5">
                          <span className="text-[11px] font-mono text-gray-300 dark:text-gray-700">
                            {service.index}
                          </span>
                          <Icon size={16} className="text-gray-400 dark:text-gray-600" />
                        </div>
                        <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-4">
                          {service.name}
                        </h3>
                        <p className="text-[15px] text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
                          {service.tagline}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-8">
                          {service.usecases.map((uc) => (
                            <span
                              key={uc}
                              className="text-[11px] text-gray-500 dark:text-gray-500 border border-gray-200 dark:border-gray-800 px-2.5 py-1"
                            >
                              {uc}
                            </span>
                          ))}
                        </div>
                        <div className="flex flex-col gap-2.5">
                          {service.branchenLinks.map((link) => (
                            <Link
                              key={link.href}
                              to={link.href}
                              className="inline-flex items-center gap-2 text-xs text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 transition-colors group"
                            >
                              <span className="w-3 h-px bg-gray-300 dark:bg-gray-700 group-hover:w-5 transition-all duration-200" />
                              {link.label}
                            </Link>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gray-300 dark:text-gray-700 mb-5">
                          Was Sie konkret erhalten
                        </p>
                        <ul className="space-y-3 mb-10">
                          {service.benefits.map((b) => (
                            <li key={b} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                              <span className="w-4 h-px bg-gray-300 dark:bg-gray-700 flex-shrink-0 mt-2.5" />
                              {b}
                            </li>
                          ))}
                        </ul>

                        <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gray-300 dark:text-gray-700 mb-4">
                          Verfügbar in
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {service.cities.map((city) => (
                            <Link
                              key={city.href}
                              to={city.href}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                            >
                              {city.label}
                              <ChevronRight size={10} />
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── OUTCOMES ──────────────────────────────────────────────────── */}
        <section
          aria-labelledby="outcomes-heading"
          className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40"
        >
          <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-20 lg:py-28">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="mb-14"
            >
              <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-gray-300 dark:text-gray-700 mb-6">
                Typische Ergebnisse
              </p>
              <h2
                id="outcomes-heading"
                className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight max-w-lg"
              >
                Was unsere Kunden typischerweise erreichen
              </h2>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {OUTCOMES.map((item, i) => (
                <motion.div
                  key={item.metric}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i * 0.07}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-7"
                >
                  <p className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {item.metric}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed">
                    {item.context}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SYSTEM PANELS ─────────────────────────────────────────────── */}
        <section
          id="systeme"
          aria-labelledby="systems-heading"
          className="border-t border-gray-100 dark:border-gray-800 scroll-mt-16"
        >
          <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-20 lg:py-28">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="mb-16"
            >
              <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-gray-300 dark:text-gray-700 mb-6">
                Systembeispiele
              </p>
              <h2
                id="systems-heading"
                className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-4"
              >
                Reale Systeme im Einsatz
              </h2>
              <p className="text-[15px] text-gray-500 dark:text-gray-400 max-w-md">
                Typische Systemarchitekturen, die Cogniiq für reale Betriebe umsetzt.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-5">
              {SYSTEM_PANELS.map((panel, i) => (
                <motion.div
                  key={panel.label}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i * 0.08}
                  className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 flex flex-col"
                >
                  <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gray-400 dark:text-gray-600 mb-4">
                    Systembeispiel
                  </p>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">
                    {panel.label}
                  </h3>

                  <div className="mb-7">
                    <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-gray-300 dark:text-gray-700 mb-3">
                      Komposition
                    </p>
                    <div className="flex flex-wrap items-center gap-0">
                      {panel.stack.map((layer, li) => (
                        <span key={layer} className="flex items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2.5 py-1 font-mono">
                            {layer}
                          </span>
                          {li < panel.stack.length - 1 && (
                            <span className="text-gray-300 dark:text-gray-700 text-xs mx-0.5">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mb-8 flex-1">
                    <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-gray-300 dark:text-gray-700 mb-3">
                      Ergebnisse
                    </p>
                    <ul className="space-y-2">
                      {panel.outcomes.map((outcome) => (
                        <li key={outcome} className="flex items-center gap-2.5 text-xs text-gray-600 dark:text-gray-400">
                          <span className="w-3 h-px bg-gray-300 dark:bg-gray-700 flex-shrink-0" />
                          {outcome}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    to={panel.branche}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors group"
                  >
                    {panel.brancheLabel}
                    <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PROCESS ───────────────────────────────────────────────────── */}
        <section
          id="ablauf"
          aria-labelledby="process-heading"
          className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 scroll-mt-16"
        >
          <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-20 lg:py-28">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="mb-16"
            >
              <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-gray-300 dark:text-gray-700 mb-6">
                Ablauf
              </p>
              <h2
                id="process-heading"
                className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight"
              >
                Wie Systeme entstehen
              </h2>
            </motion.div>

            <div className="relative">
              <div
                className="hidden lg:block absolute top-[22px] left-0 right-0 h-px bg-gray-200 dark:bg-gray-800"
                aria-hidden="true"
              />
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
                {PROCESS_STEPS.map((step, i) => (
                  <motion.div
                    key={step.number}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    custom={i * 0.08}
                    className="relative"
                  >
                    <div className="relative z-10 flex items-center gap-3 mb-5">
                      <span className="w-11 h-11 flex items-center justify-center text-xs font-mono font-bold text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800">
                        {step.number}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 leading-snug">
                      {step.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed">
                      {step.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── INTERNAL LINKS — STANDORTE ────────────────────────────────── */}
        <section
          aria-labelledby="standorte-heading"
          className="border-t border-gray-100 dark:border-gray-800"
        >
          <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-20 lg:py-28">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="mb-14"
            >
              <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-gray-300 dark:text-gray-700 mb-6">
                Standorte
              </p>
              <h2
                id="standorte-heading"
                className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-3"
              >
                Lokal verankert in Bayern
              </h2>
              <p className="text-[15px] text-gray-500 dark:text-gray-400 max-w-md">
                Cogniiq arbeitet remote und vor Ort — in Bayreuth, München und Regensburg.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-5">
              {CITY_HUBS.map((hub, i) => (
                <motion.div
                  key={hub.city}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i * 0.08}
                  className="border border-gray-200 dark:border-gray-800 p-7"
                >
                  <Link
                    to={hub.href}
                    className="text-lg font-bold text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-400 transition-colors inline-flex items-center gap-1 mb-5"
                  >
                    {hub.city}
                    <ChevronRight size={14} className="opacity-50" />
                  </Link>
                  <ul className="space-y-2.5">
                    {hub.services.map((s) => (
                      <li key={s.label}>
                        <Link
                          to={s.href}
                          className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 transition-colors group"
                        >
                          <span className="w-3 h-px bg-gray-300 dark:bg-gray-700 group-hover:w-5 transition-all duration-200" />
                          {s.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── INTERNAL LINKS — BRANCHEN ─────────────────────────────────── */}
        <section
          aria-labelledby="branchen-heading"
          className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40"
        >
          <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-20 lg:py-28">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="mb-14"
            >
              <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-gray-300 dark:text-gray-700 mb-6">
                Branchen
              </p>
              <h2
                id="branchen-heading"
                className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-3"
              >
                Spezialisiert nach Branche
              </h2>
              <p className="text-[15px] text-gray-500 dark:text-gray-400 max-w-md">
                Branchenspezifische Systemarchitekturen für Praxen, Gastronomie und Immobilien.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-5 mb-10">
              {BRANCHEN_HUBS.map((hub, i) => (
                <motion.div
                  key={hub.branche}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i * 0.08}
                  className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-7"
                >
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-5">
                    {hub.branche}
                  </p>
                  <ul className="space-y-2.5">
                    {hub.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          to={link.href}
                          className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 transition-colors group"
                        >
                          <span className="w-3 h-px bg-gray-300 dark:bg-gray-700 group-hover:w-5 transition-all duration-200" />
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0.2}
              className="flex items-center gap-6"
            >
              <Link
                to="/bayern"
                className="text-xs text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 transition-colors underline underline-offset-4"
              >
                Bayern Hub
              </Link>
              <Link
                to="/deutschland"
                className="text-xs text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 transition-colors underline underline-offset-4"
              >
                Deutschland Hub
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────────────── */}
        <section
          id="faq"
          aria-labelledby="faq-heading"
          className="border-t border-gray-100 dark:border-gray-800 scroll-mt-16"
        >
          <div className="max-w-[780px] mx-auto px-6 lg:px-8 py-20 lg:py-28">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="mb-12"
            >
              <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-gray-300 dark:text-gray-700 mb-6">
                FAQ
              </p>
              <h2
                id="faq-heading"
                className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight"
              >
                Häufige Fragen
              </h2>
            </motion.div>

            <div>
              {FAQ_ITEMS.map((item, i) => (
                <FAQItem key={i} q={item.q} a={item.a} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ─────────────────────────────────────────────────── */}
        <section
          id="kontakt-cta"
          className="border-t border-gray-100 dark:border-gray-800 scroll-mt-16"
        >
          <div className="max-w-[780px] mx-auto px-6 lg:px-8 py-32 lg:py-40 text-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
            >
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-6">
                Bereit für ein System<br />statt Einzellösungen?
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-lg font-light mb-3 max-w-md mx-auto">
                Kostenloses Erstgespräch. Konkrete Systemeinschätzung.
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-600 tracking-wide mb-14">
                30–45 Min. &middot; keine Vorbereitung nötig &middot; keine Verkaufspräsentation
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  to="/kontakt"
                  className="inline-flex items-center gap-2.5 px-8 py-4 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-semibold text-sm tracking-wide hover:bg-gray-700 dark:hover:bg-white transition-colors"
                >
                  Erstgespräch vereinbaren
                  <ArrowRight size={15} />
                </Link>
                <Link
                  to="/deutschland"
                  className="inline-flex items-center gap-2.5 px-8 py-4 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm tracking-wide hover:border-gray-500 dark:hover:border-gray-500 transition-colors"
                >
                  Standorte
                </Link>
              </div>

              <p className="mt-12 text-xs text-gray-400 dark:text-gray-600 tracking-wide">
                {BUSINESS_INFO.name} &middot; {BUSINESS_INFO.address.addressLocality} &middot; {BUSINESS_INFO.contact.email}
              </p>
            </motion.div>
          </div>
        </section>

        {/* ── BREADCRUMB (bottom) ────────────────────────────────────────── */}
        <div className="border-t border-gray-100 dark:border-gray-800 px-6 lg:px-8 py-4">
          <div className="max-w-[1100px] mx-auto">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-600">
              <Link to="/" className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors">
                Home
              </Link>
              <ChevronRight size={10} />
              <span className="text-gray-500 dark:text-gray-400">Leistungen</span>
            </nav>
          </div>
        </div>

      </main>
    </>
  );
}
