import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight } from "lucide-react";
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

const ARCHITECTURE_LAYERS = [
  {
    id: "platforms",
    index: "01",
    title: "Digital Platforms",
    definition:
      "Conversion-optimierte Websites und digitale Interfaces, die Besucher in Anfragen, Buchungen und Kunden verwandeln. Gebaut auf messbarer Architektur, nicht auf visuellen Trends.",
    capabilities: [
      "Conversion UX Architektur",
      "SEO & Performance Engineering",
      "Buchungs- & CRM-Integration",
      "Content- & Landing-Systeme",
    ],
  },
  {
    id: "ai-operations",
    index: "02",
    title: "AI Operations",
    definition:
      "Autonome AI-Systeme, die Kommunikation, Terminlogik und Kundeninteraktion übernehmen — rund um die Uhr, ohne Wartezeit, ohne Fehler.",
    capabilities: [
      "AI Telefonrezeption",
      "AI Chat & Lead-Qualifizierung",
      "Termin- & Reservierungslogik",
      "CRM-synchronisierte Kommunikation",
    ],
  },
  {
    id: "automation",
    index: "03",
    title: "Automation Infrastructure",
    definition:
      "Hintergrund-Automatisierung, die Tools verbindet, manuelle Arbeit eliminiert und Abläufe stabil hält — ohne tägliches Eingreifen.",
    capabilities: [
      "System-Integrationen (CRM, Kalender, Buchung, Payments)",
      "Operational Workflows & Prozess-Orchestrierung",
      "Benachrichtigungen, Eskalationen & SLA-Logik",
      "Monitoring, Logging & Ausfall-Absicherung",
    ],
  },
];

const SYSTEM_PANELS = [
  {
    label: "Klinik System",
    stack: ["Website", "AI Rezeption", "Terminlogik", "Automatisierung"],
    outcomes: [
      "Weniger verpasste Anrufe",
      "Automatisierte Buchungen",
      "Entlastung am Empfang",
      "Höhere Patientenzufriedenheit",
    ],
  },
  {
    label: "Padel / Sportanlage System",
    stack: ["Website", "Online-Buchungssystem", "AI Chat", "Auslastungs-Automation"],
    outcomes: [
      "Platzbuchungen ohne Telefon",
      "Automatische Bestätigungen",
      "Klarere Kapazitätsplanung",
      "Direkter Umsatz online",
    ],
  },
  {
    label: "Restaurant System",
    stack: ["Website", "Reservierungslogik", "AI Telefonrezeption", "CRM-Integration"],
    outcomes: [
      "Tischbuchung 24/7",
      "Weniger No-Shows",
      "Automatisierte Erinnerungen",
      "Bessere Auslastung",
    ],
  },
  {
    label: "Brand / E-Commerce System",
    stack: ["Website", "Performance-Architektur", "Lead-Automation", "Analytics-Integration"],
    outcomes: [
      "Höhere Conversion-Rate",
      "Automatischer Lead-Flow",
      "Skalierbare Content-Systeme",
      "Messbare Wachstumskurve",
    ],
  },
];

const PROCESS_STEPS = [
  {
    number: "01",
    title: "Kennenlernen & Zieldefinition",
    description: "Wir verstehen Ihr Geschäftsmodell, Ihre Engpässe und konkreten Ziele. Keine generischen Fragen — spezifische Analyse.",
  },
  {
    number: "02",
    title: "Konzept & Architektur",
    description: "Wir entwerfen die Systemarchitektur: Welche Komponenten, Integrationen und Flows Ihr Ziel am direktesten erreichen.",
  },
  {
    number: "03",
    title: "Umsetzung & Integration",
    description: "Umsetzung in klar definierten Phasen. Alle Systeme werden integriert, getestet und auf Ihren Betrieb kalibriert.",
  },
  {
    number: "04",
    title: "Go-Live & Optimierung",
    description: "Inbetriebnahme mit Übergabe, Monitoring und gezielter Nachoptimierung auf Basis realer Nutzungsdaten.",
  },
];

const AUTHORITY_POINTS = [
  "Wir bauen Systeme statt Einzellösungen",
  "Alle Komponenten greifen ineinander",
  "Fokus auf reale Betriebsprozesse",
  "Schnelle Umsetzung statt monatelanger Projekte",
  "Messbare Effekte auf Umsatz und Aufwand",
];

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

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section className="pt-40 pb-32 px-6 lg:px-8">
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

            <motion.p
              className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gray-400 dark:text-gray-500 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.05 }}
            >
              AI Systems · Automation · Digital Platforms · Deutschland
            </motion.p>

            <motion.h1
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-[1.05] mb-8"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              Digitale Systeme,<br />
              die Umsatz erzeugen<br />
              und Arbeit eliminieren.
            </motion.h1>

            <motion.p
              className="text-xl text-gray-500 dark:text-gray-400 leading-relaxed font-light max-w-[620px]"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              Cogniiq entwickelt integrierte AI-gestützte Websites, Automatisierungen und operative Systeme für Unternehmen, die wachsen wollen — nicht nur online existieren.
            </motion.p>

            <motion.div
              className="mt-14 pt-8 border-t border-gray-100 dark:border-gray-800"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              <div className="flex flex-wrap items-center gap-10">
                {["Digital Platforms", "AI Operations", "Automation Infrastructure"].map((layer) => (
                  <span key={layer} className="text-xs font-medium text-gray-400 dark:text-gray-600 tracking-wide">
                    {layer}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── SYSTEMS ARCHITECTURE ─────────────────────────────────────── */}
        <section aria-labelledby="architecture-heading" className="border-t border-gray-100 dark:border-gray-800">
          <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-6">
            <motion.p
              id="architecture-heading"
              className="text-[10px] font-semibold tracking-[0.22em] uppercase text-gray-300 dark:text-gray-700 py-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
            >
              Systems Architecture
            </motion.p>
          </div>

          {ARCHITECTURE_LAYERS.map((layer, i) => (
            <motion.div
              key={layer.id}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
              custom={i * 0.06}
              className="border-t border-gray-100 dark:border-gray-800"
            >
              <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-16 md:py-20">
                <div className="grid md:grid-cols-[1fr_1fr] gap-12 lg:gap-24 items-start">
                  <div>
                    <span className="text-[11px] font-mono text-gray-300 dark:text-gray-700 block mb-4">
                      {layer.index}
                    </span>
                    <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-6">
                      {layer.title}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-[15px] max-w-sm">
                      {layer.definition}
                    </p>
                  </div>
                  <div className="pt-8 md:pt-0">
                    <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gray-300 dark:text-gray-700 mb-5">
                      Capabilities
                    </p>
                    <ul className="space-y-3">
                      {layer.capabilities.map((cap) => (
                        <li
                          key={cap}
                          className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300"
                        >
                          <span className="w-4 h-px bg-gray-300 dark:bg-gray-700 flex-shrink-0" />
                          {cap}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </section>

        {/* ── REAL SYSTEMS IN USE ──────────────────────────────────────── */}
        <section
          aria-labelledby="cases-heading"
          className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 transition-colors duration-300"
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
                Real Systems
              </p>
              <h2 id="cases-heading" className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-4">
                Reale Systeme im Einsatz
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-[15px] max-w-md">
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
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-none p-8"
                >
                  <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gray-400 dark:text-gray-600 mb-5">
                    System
                  </p>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">
                    {panel.label}
                  </h3>

                  <div className="mb-8">
                    <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-gray-300 dark:text-gray-700 mb-3">
                      Komposition
                    </p>
                    <div className="flex flex-wrap items-center gap-0">
                      {panel.stack.map((layer, li) => (
                        <span key={layer} className="flex items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 font-mono">
                            {layer}
                          </span>
                          {li < panel.stack.length - 1 && (
                            <span className="text-gray-300 dark:text-gray-700 text-xs mx-0.5">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
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
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── DELIVERY MODEL ───────────────────────────────────────────── */}
        <section
          aria-labelledby="process-heading"
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
                Delivery Model
              </p>
              <h2 id="process-heading" className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                Wie Systeme entstehen
              </h2>
            </motion.div>

            <div className="relative">
              <div className="hidden lg:block absolute top-[22px] left-0 right-0 h-px bg-gray-200 dark:bg-gray-800" aria-hidden="true" />

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

        {/* ── SYSTEM AUTHORITY ─────────────────────────────────────────── */}
        <section
          aria-labelledby="authority-heading"
          className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 transition-colors duration-300"
        >
          <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-20 lg:py-28">
            <div className="grid lg:grid-cols-[1fr_2fr] gap-16 items-start">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={0}
              >
                <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-gray-300 dark:text-gray-700 mb-6">
                  Warum Cogniiq
                </p>
                <h2 id="authority-heading" className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-tight">
                  Warum Cogniiq Systeme funktionieren
                </h2>
              </motion.div>

              <div className="space-y-0 divide-y divide-gray-200 dark:divide-gray-800">
                {AUTHORITY_POINTS.map((point, i) => (
                  <motion.div
                    key={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    custom={i * 0.06}
                    className="flex items-center gap-6 py-5"
                  >
                    <span className="text-[11px] font-mono text-gray-300 dark:text-gray-700 w-6 flex-shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="text-base text-gray-800 dark:text-gray-200 font-medium">
                      {point}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ────────────────────────────────────────────────── */}
        <section className="border-t border-gray-100 dark:border-gray-800">
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
              <p className="text-gray-500 dark:text-gray-400 text-lg font-light mb-14 max-w-md mx-auto">
                Kostenloses Erstgespräch. 30–45 Minuten. Konkrete Systemeinschätzung für Ihr Unternehmen.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  to="/kontakt"
                  className="inline-flex items-center gap-2.5 px-8 py-4 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-semibold text-sm tracking-wide hover:bg-gray-700 dark:hover:bg-white transition-colors"
                >
                  Projekt anfragen
                  <ArrowRight size={15} />
                </Link>
                <Link
                  to="/bayern"
                  className="inline-flex items-center gap-2.5 px-8 py-4 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm tracking-wide hover:border-gray-500 dark:hover:border-gray-500 transition-colors"
                >
                  Standorte ansehen
                </Link>
              </div>

              <p className="mt-12 text-xs text-gray-400 dark:text-gray-600 tracking-wide">
                {BUSINESS_INFO.name} · {BUSINESS_INFO.address.addressLocality} · {BUSINESS_INFO.contact.email}
              </p>
            </motion.div>
          </div>
        </section>

      </main>
    </>
  );
}
