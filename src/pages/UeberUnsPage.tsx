import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChevronRight,
  Globe,
  Phone,
  Zap,
  Brain,
  Target,
  Shield,
  Clock,
  MapPin,
  Users,
} from "lucide-react";
import { PageSEO } from "@/components/PageSEO";
import { PAGE_META, BUSINESS_INFO } from "@/lib/seo-data";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

const SUBNAV_ITEMS = [
  { label: "Über uns", anchor: "ueber-uns" },
  { label: "Expertise", anchor: "expertise" },
  { label: "Gründer", anchor: "gruender" },
  { label: "Ablauf", anchor: "ablauf" },
  { label: "Standorte", anchor: "standorte" },
  { label: "Branchen", anchor: "branchen" },
  { label: "FAQ", anchor: "faq" },
  { label: "Kontakt", anchor: "cta" },
];

const COMPETENCIES = [
  {
    index: "01",
    icon: Globe,
    name: "Webdesign & Conversion",
    tagline: "Websites, die nicht nur aussehen — sondern qualifizierte Anfragen erzeugen.",
    points: [
      "Conversion-Architektur statt Standard-Templates",
      "Technisches SEO für organische Sichtbarkeit",
      "Schnelle Ladezeiten und vollständige Mobile-Optimierung",
      "Integration von Buchungs- und Kontaktsystemen",
    ],
  },
  {
    index: "02",
    icon: Phone,
    name: "KI-Telefonassistenten",
    tagline: "Kein Anruf geht verloren. Kein Termin bleibt ungebucht.",
    points: [
      "24/7-Anrufannahme in natürlicher Sprache",
      "Automatische Terminbuchung und Bestätigung",
      "Intelligente Weiterleitung und Eskalationslogik",
      "Synchronisation mit Kalender und CRM-Systemen",
    ],
  },
  {
    index: "03",
    icon: Zap,
    name: "Automatisierung & KI-Systeme",
    tagline: "Operative Abläufe laufen im Hintergrund — ohne tägliches Eingreifen.",
    points: [
      "Systemintegrationen zwischen CRM, Kalender und Buchung",
      "Automatische Benachrichtigungen und Erinnerungen",
      "Prozess-Workflows mit Eskalations- und SLA-Logik",
      "Monitoring, Logging und Ausfall-Absicherung",
    ],
  },
];

const PRINCIPLES = [
  {
    icon: Target,
    title: "Systeme, keine Einzellösungen",
    description:
      "Jede Komponente ist Teil eines größeren Systemgedankens. Website, KI und Automatisierung greifen ineinander — konzipiert als Einheit, nicht als Einzelprojekte.",
  },
  {
    icon: Brain,
    title: "Analyse vor Umsetzung",
    description:
      "Kein Standardpaket, keine Agentur-Templates. Wir verstehen zuerst Ihr Geschäftsmodell, Ihre Engpässe und Ziele — dann bauen wir.",
  },
  {
    icon: Shield,
    title: "DSGVO-konforme Architektur",
    description:
      "Alle Daten werden auf europäischen Servern verarbeitet. Datenschutzkonforme Architekturen und vollständige Dokumentation inklusive.",
  },
  {
    icon: Clock,
    title: "Schnelle Inbetriebnahme",
    description:
      "Go-Live in 7 bis 14 Tagen für erste Systeme. Komplexere Systemverbünde in 3 bis 5 Wochen — ohne Abstriche bei der Qualität.",
  },
];

const FOUNDERS = [
  {
    initial: "L",
    name: "Lazar Popovic",
    role: "Gründer",
    focus: "KI-Automatisierung & Technische Integrationen",
    description:
      "Spezialisierung auf KI-Automatisierung, Prozesssysteme und technische Integrationen für effiziente Geschäftsabläufe. Konzipiert und implementiert Systemarchitekturen, die operative Abläufe dauerhaft entlasten — präzise, skalierbar und ohne unnötige Komplexität.",
    expertise: [
      "KI-Workflow-Architekturen & Automatisierung",
      "API-Integrationen & System-Orchestrierung",
      "KI-Telefonassistenten & Voice-Systeme",
      "Prozessanalyse & Automatisierungsstrategie",
    ],
  },
  {
    initial: "D",
    name: "Djordje Popovic",
    role: "Gründer",
    focus: "Webdesign-Architektur & Digitale Plattformen",
    description:
      "Fokus auf Webdesign-Architektur, Performance-Optimierung und digitale Plattformen mit hoher Conversion-Qualität. Entwickelt hochmoderne Websites und digitale Systeme, die klar strukturiert sind und messbaren geschäftlichen Mehrwert liefern.",
    expertise: [
      "Conversion-Architektur & UX-Design",
      "Technisches SEO & Performance-Optimierung",
      "Frontend-Entwicklung & Systemintegration",
      "Digitale Plattformstrategie",
    ],
  },
];

const PROCESS_STEPS = [
  {
    number: "01",
    title: "Kennenlernen & Zieldefinition",
    description:
      "30-minütiges Erstgespräch — wir verstehen Ihr Geschäftsmodell, Ihre konkreten Engpässe und messbaren Ziele. Kein generischer Fragebogen.",
  },
  {
    number: "02",
    title: "System-Architektur & Konzept",
    description:
      "Wir definieren, welche Komponenten und Integrationen Ihr Ziel am direktesten erreichen. Klare Roadmap und transparentes Angebot.",
  },
  {
    number: "03",
    title: "Umsetzung & Integration",
    description:
      "Entwicklung in klar definierten Phasen. Alle Systeme werden integriert, getestet und auf Ihren Betrieb kalibriert.",
  },
  {
    number: "04",
    title: "Go-Live & Optimierung",
    description:
      "Inbetriebnahme mit Übergabe, laufendem Monitoring und Nachoptimierung auf Basis realer Nutzungsdaten.",
  },
];

const CITY_HUBS = [
  {
    city: "Bayreuth",
    href: "/bayreuth",
    note: "Hauptsitz",
    services: [
      { label: "Webdesign Bayreuth", href: "/bayreuth" },
      { label: "KI-Telefonassistent Bayreuth", href: "/bayreuth" },
      { label: "Automatisierung Bayreuth", href: "/bayreuth" },
    ],
  },
  {
    city: "München",
    href: "/muenchen",
    note: "Bayern",
    services: [
      { label: "Webdesign München", href: "/muenchen" },
      { label: "KI-Telefonassistent München", href: "/muenchen" },
      { label: "Automatisierung München", href: "/muenchen" },
    ],
  },
  {
    city: "Regensburg",
    href: "/regensburg",
    note: "Bayern",
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
    description: "KI-Rezeption, Terminlogik, Patientenautomatisierung",
    links: [
      { label: "Arzt-System Bayreuth", href: "/webdesign-arzt-bayreuth" },
      { label: "Arzt-System München", href: "/webdesign-arzt-muenchen" },
      { label: "Arzt-System Regensburg", href: "/webdesign-arzt-regensburg" },
    ],
  },
  {
    branche: "Gastronomie",
    description: "Reservierungslogik, Gäste-Automatisierung, Auslastung",
    links: [
      { label: "Restaurant-System Bayreuth", href: "/webdesign-gastronomie-bayreuth" },
      { label: "Restaurant-System München", href: "/webdesign-gastronomie-muenchen" },
      { label: "Restaurant-System Regensburg", href: "/webdesign-gastronomie-regensburg" },
    ],
  },
  {
    branche: "Immobilien",
    description: "Lead-Qualifizierung, Besichtigungslogik, Nachverfolgung",
    links: [
      { label: "Immobilien-System Bayreuth", href: "/webdesign-immobilien-bayreuth" },
      { label: "Immobilien-System München", href: "/webdesign-immobilien-muenchen" },
      { label: "Immobilien-System Regensburg", href: "/webdesign-immobilien-regensburg" },
    ],
  },
];

const FAQ_ITEMS = [
  {
    q: "Wo sitzt Cogniiq und für welche Kunden arbeitet ihr?",
    a: "Cogniiq hat seinen Sitz in Bayreuth, Bayern. Wir betreuen Unternehmen regional in Bayreuth, München und Regensburg, sowie deutschlandweit vollständig remote. Alle Abstimmungen laufen per Video-Call, Go-Lives und Übergaben asynchron mit Dokumentation.",
  },
  {
    q: "Was unterscheidet Cogniiq von einer klassischen Webagentur?",
    a: "Klassische Agenturen liefern eine Website. Cogniiq liefert ein digitales System — Website, KI-Telefonassistent und Automatisierung als integrierte Einheit. Der Unterschied: nicht ein Designprojekt, sondern ein System, das dauerhaft Anfragen generiert und Abläufe entlastet.",
  },
  {
    q: "Wie schnell sind Systeme live?",
    a: "Einzellösungen wie eine Website oder ein KI-Telefonassistent sind in 7 bis 14 Tagen einsatzbereit. Komplexe Systemverbünde planen wir in 3 bis 5 Wochen — mit regelmäßigen Zwischenständen und klar definierten Phasen.",
  },
  {
    q: "Sind die Systeme DSGVO-konform?",
    a: "Ja. Alle Daten werden auf europäischen Servern verarbeitet und gespeichert. Wir implementieren datenschutzkonforme Architekturen und stellen alle notwendige Dokumentation bereit.",
  },
  {
    q: "Kann ich mit einem einzelnen Service starten?",
    a: "Das ist der häufigste Einstieg. Sie wählen, was den größten unmittelbaren Hebel hat — Website, KI-Telefon oder Automatisierung. Die Architektur ist so gestaltet, dass spätere Erweiterungen ohne Umbauten möglich sind.",
  },
  {
    q: "Gibt es Betreuung nach dem Go-Live?",
    a: "Ja. Wir bieten Monitoring, Optimierung und Anpassungen auf Basis realer Nutzungsdaten. Der Umfang wird projektspezifisch vereinbart.",
  },
];

function SubNav() {
  const [active, setActive] = useState("ueber-uns");
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

export function UeberUnsPage() {
  const breadcrumbs = [
    { name: "Home", url: BUSINESS_INFO.website },
    { name: "Über Uns", url: PAGE_META.ueberUns.canonical },
  ];

  return (
    <>
      <PageSEO
        title={PAGE_META.ueberUns.title}
        description={PAGE_META.ueberUns.description}
        canonical={PAGE_META.ueberUns.canonical}
        breadcrumbs={breadcrumbs}
      />

      <main className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section id="ueber-uns" className="pt-40 pb-20 px-6 lg:px-8 scroll-mt-0">
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
              <span className="text-gray-500 dark:text-gray-400">Über Uns</span>
            </motion.nav>

            <motion.h1
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-[1.05] mb-7"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              Wer hinter<br />
              Cogniiq steckt.
            </motion.h1>

            <motion.p
              className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed font-light max-w-[560px] mb-8"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              AI-Agentur aus Bayreuth für Webdesign, KI-Automatisierung und digitale Systeme — tätig für Unternehmen in ganz Deutschland.
            </motion.p>

            <motion.p
              className="text-xs text-gray-400 dark:text-gray-600 tracking-wide mb-9 font-light italic"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.28 }}
            >
              Gegründet von Lazar und Djordje Popovic — mit dem Ziel, Unternehmen durch intelligente Systeme messbar effizienter zu machen.
            </motion.p>

            <motion.div
              className="flex flex-wrap items-center gap-2 mb-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.32 }}
            >
              {["Sitz in Bayreuth", "Projekte deutschlandweit", "KI & Automatisierung", "DSGVO-konform"].map((chip) => (
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
                Projekt anfragen
                <ArrowRight size={14} />
              </Link>
              <Link
                to="/leistungen"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 font-semibold text-sm tracking-wide hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
              >
                Leistungen ansehen
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ── STICKY SUBNAV ─────────────────────────────────────────────── */}
        <SubNav />

        {/* ── EXPERTISE / KOMPETENZEN ───────────────────────────────────── */}
        <section
          id="expertise"
          aria-labelledby="expertise-heading"
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
                Expertise
              </p>
              <h2
                id="expertise-heading"
                className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight"
              >
                Drei Kompetenzen. Ein Systemgedanke.
              </h2>
            </motion.div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {COMPETENCIES.map((comp, i) => {
                const Icon = comp.icon;
                return (
                  <motion.div
                    key={comp.index}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-60px" }}
                    variants={fadeUp}
                    custom={i * 0.07}
                    className="py-16"
                  >
                    <div className="grid md:grid-cols-[260px_1fr] lg:grid-cols-[320px_1fr] gap-12 lg:gap-20 items-start">
                      <div>
                        <div className="flex items-center gap-3 mb-5">
                          <span className="text-[11px] font-mono text-gray-300 dark:text-gray-700">
                            {comp.index}
                          </span>
                          <Icon size={16} className="text-gray-400 dark:text-gray-600" />
                        </div>
                        <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-4">
                          {comp.name}
                        </h3>
                        <p className="text-[15px] text-gray-500 dark:text-gray-400 leading-relaxed">
                          {comp.tagline}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gray-300 dark:text-gray-700 mb-5">
                          Was wir liefern
                        </p>
                        <ul className="space-y-3">
                          {comp.points.map((p) => (
                            <li key={p} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                              <span className="w-4 h-px bg-gray-300 dark:bg-gray-700 flex-shrink-0 mt-2.5" />
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── PRINZIPIEN ────────────────────────────────────────────────── */}
        <section
          aria-labelledby="principles-heading"
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
                Arbeitsweise
              </p>
              <h2
                id="principles-heading"
                className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight max-w-lg"
              >
                Prinzipien, die jedes Projekt prägen
              </h2>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {PRINCIPLES.map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.title}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    custom={i * 0.07}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-7"
                  >
                    <Icon size={16} className="text-gray-400 dark:text-gray-600 mb-5" />
                    <p className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2 leading-snug">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed">
                      {item.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── GRÜNDER ───────────────────────────────────────────────────── */}
        <section
          id="gruender"
          aria-labelledby="founders-heading"
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
                Gründer
              </p>
              <h2
                id="founders-heading"
                className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight"
              >
                Direkte Zusammenarbeit, volle Verantwortung.
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-5">
              {FOUNDERS.map((founder, i) => (
                <motion.div
                  key={founder.name}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i * 0.08}
                  className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 flex flex-col"
                >
                  <div className="flex items-start gap-5 mb-7">
                    <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center text-lg font-bold text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900">
                      {founder.initial}
                    </div>
                    <div>
                      <p className="text-base font-bold text-gray-900 dark:text-gray-100 mb-0.5">
                        {founder.name}
                      </p>
                      <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-gray-400 dark:text-gray-600">
                        {founder.focus}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-7 flex-1">
                    {founder.description}
                  </p>

                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-gray-300 dark:text-gray-700 mb-3">
                      Schwerpunkte
                    </p>
                    <ul className="space-y-2">
                      {founder.expertise.map((e) => (
                        <li key={e} className="flex items-center gap-2.5 text-xs text-gray-600 dark:text-gray-400">
                          <span className="w-3 h-px bg-gray-300 dark:bg-gray-700 flex-shrink-0" />
                          {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PROZESS ───────────────────────────────────────────────────── */}
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
                So arbeiten wir zusammen
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

        {/* ── STANDORTE ─────────────────────────────────────────────────── */}
        <section
          id="standorte"
          aria-labelledby="standorte-heading"
          className="border-t border-gray-100 dark:border-gray-800 scroll-mt-16"
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
                Aus Bayreuth — für ganz Deutschland
              </h2>
              <p className="text-[15px] text-gray-500 dark:text-gray-400 max-w-md">
                Cogniiq arbeitet remote und vor Ort — mit Schwerpunkten in Bayreuth, München und Regensburg.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-5 mb-8">
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
                  <div className="flex items-center justify-between mb-5">
                    <Link
                      to={hub.href}
                      className="text-lg font-bold text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-400 transition-colors inline-flex items-center gap-1"
                    >
                      {hub.city}
                      <ChevronRight size={14} className="opacity-50" />
                    </Link>
                    {hub.note === "Hauptsitz" && (
                      <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-gray-400 dark:text-gray-600 border border-gray-200 dark:border-gray-800 px-2 py-0.5">
                        Hauptsitz
                      </span>
                    )}
                  </div>
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

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0.2}
              className="flex items-center gap-4"
            >
              <MapPin size={12} className="text-gray-300 dark:text-gray-700" />
              <div className="flex items-center gap-6">
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
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── BRANCHEN ──────────────────────────────────────────────────── */}
        <section
          id="branchen"
          aria-labelledby="branchen-heading"
          className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 scroll-mt-16"
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
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">
                    {hub.branche}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-600 mb-5 leading-relaxed">
                    {hub.description}
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
              className="flex items-center gap-4"
            >
              <Users size={12} className="text-gray-300 dark:text-gray-700" />
              <Link
                to="/leistungen"
                className="text-xs text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 transition-colors underline underline-offset-4"
              >
                Alle Leistungen ansehen
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
          id="cta"
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
                Lass uns dein<br />digitales System aufbauen.
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-lg font-light mb-3 max-w-md mx-auto">
                Ob Website, Automatisierung oder KI-Integration — wir entwickeln Systeme, die messbar wirken.
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
                  to="/leistungen"
                  className="inline-flex items-center gap-2.5 px-8 py-4 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm tracking-wide hover:border-gray-500 dark:hover:border-gray-500 transition-colors"
                >
                  Leistungen ansehen
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
              <span className="text-gray-500 dark:text-gray-400">Über Uns</span>
            </nav>
          </div>
        </div>

      </main>
    </>
  );
}
