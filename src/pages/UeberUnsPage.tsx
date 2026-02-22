import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight, Globe, Phone, Zap, MessageSquare, FileText, Cog, Rocket } from "lucide-react";
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

const FOUNDERS = [
  {
    initial: "L",
    name: "Lazar Popovic",
    role: "Gründer",
    focus: "KI-Automatisierung & Technische Integrationen",
    description:
      "Spezialisierung auf KI-Automatisierung, Prozesssysteme und technische Integrationen für effiziente Geschäftsabläufe.",
  },
  {
    initial: "D",
    name: "Djordje Popovic",
    role: "Gründer",
    focus: "Webdesign-Architektur & Digitale Plattformen",
    description:
      "Fokus auf Webdesign-Architektur, Performance-Optimierung und digitale Plattformen mit hoher Conversion-Qualität.",
  },
];

const EXPERTISE_POINTS = [
  { icon: Globe, label: "Hochkonvertierende Websites" },
  { icon: Phone, label: "KI-Telefonassistenten & Automatisierung" },
  { icon: Zap, label: "Skalierbare digitale Infrastruktur" },
  { icon: ArrowRight, label: "Fokus auf messbare Ergebnisse" },
];

const PROCESS_STEPS = [
  {
    number: "01",
    icon: MessageSquare,
    title: "Kennenlernen & Zieldefinition",
    description:
      "Kurzes Erstgespräch (30–45 Minuten) — wir verstehen Ihr Geschäftsmodell, Ihre Engpässe und konkreten Ziele. Keine generischen Fragen.",
  },
  {
    number: "02",
    icon: FileText,
    title: "System-Architektur",
    description:
      "Wir definieren, welche Komponenten und Integrationen Ihr Ziel am direktesten erreichen. Konzept, Roadmap und transparentes Angebot.",
  },
  {
    number: "03",
    icon: Cog,
    title: "Umsetzung & Integration",
    description:
      "Entwicklung in klar definierten Phasen. Alle Systeme werden integriert, getestet und auf Ihren Betrieb kalibriert.",
  },
  {
    number: "04",
    icon: Rocket,
    title: "Go-Live & Optimierung",
    description:
      "Inbetriebnahme mit Übergabe, laufendem Monitoring und Nachoptimierung auf Basis realer Nutzungsdaten.",
  },
];

const LOCATION_LINKS = [
  { label: "Webdesign Bayreuth", href: "/bayreuth" },
  { label: "KI-Telefonassistent Bayreuth", href: "/bayreuth" },
  { label: "Automatisierung Bayreuth", href: "/bayreuth" },
  { label: "Webdesign Deutschland", href: "/deutschland" },
  { label: "KI Agentur Deutschland", href: "/deutschland" },
];

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
        <section className="pt-40 pb-20 px-6 lg:px-8 border-b border-gray-100 dark:border-gray-800">
          <div className="max-w-[1100px] mx-auto">
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

            <div className="grid lg:grid-cols-[1fr_420px] gap-16 lg:gap-24 items-start">
              <div>
                <motion.p
                  className="text-[10px] font-semibold tracking-[0.22em] uppercase text-gray-300 dark:text-gray-700 mb-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.05 }}
                >
                  Über Cogniiq
                </motion.p>

                <motion.h1
                  className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-[1.05] mb-8"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                >
                  Wer hinter<br />Cogniiq steckt
                </motion.h1>

                <motion.p
                  className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed font-light max-w-[560px] mb-8"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                  AI-Agentur für Webdesign, Automatisierung und KI-Systeme aus Bayreuth — tätig für Unternehmen in ganz Deutschland.
                </motion.p>

                <motion.p
                  className="text-[15px] text-gray-500 dark:text-gray-400 leading-relaxed max-w-[540px] mb-10"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                  Cogniiq wurde von Lazar und Djordje Popovic gegründet — mit dem Ziel, Unternehmen durch hochkonvertierende Websites und intelligente Automatisierung messbar effizienter zu machen. Fokus: klare Systeme, echte Ergebnisse, keine unnötige Komplexität.
                </motion.p>

                <motion.div
                  className="flex flex-wrap items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.35 }}
                >
                  {["Sitz in Bayreuth", "Projekte deutschlandweit", "Spezialisierung auf KI & Automatisierung"].map((badge) => (
                    <span
                      key={badge}
                      className="inline-block px-3 py-1 text-[11px] font-medium text-gray-500 dark:text-gray-500 border border-gray-200 dark:border-gray-800 tracking-wide"
                    >
                      {badge}
                    </span>
                  ))}
                </motion.div>
              </div>

              {/* FOUNDER CARDS */}
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                {FOUNDERS.map((founder, i) => (
                  <motion.div
                    key={founder.name}
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                    custom={0.4 + i * 0.1}
                    className="border border-gray-200 dark:border-gray-800 p-7"
                  >
                    <div className="flex items-start gap-5">
                      <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center text-lg font-bold text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900">
                        {founder.initial}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-0.5">
                          {founder.name}
                        </p>
                        <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-gray-400 dark:text-gray-600 mb-3">
                          {founder.focus}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                          {founder.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── EXPERTISE & POSITIONING ───────────────────────────────────── */}
        <section
          aria-labelledby="expertise-heading"
          className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40"
        >
          <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-20 lg:py-28">
            <div className="grid lg:grid-cols-[1fr_1fr] gap-16 lg:gap-24 items-start">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={0}
              >
                <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-gray-300 dark:text-gray-700 mb-6">
                  Expertise
                </p>
                <h2
                  id="expertise-heading"
                  className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-tight mb-6"
                >
                  Spezialisierung auf digitale Systeme mit Business-Impact
                </h2>
                <p className="text-[15px] text-gray-500 dark:text-gray-400 leading-relaxed">
                  Cogniiq verbindet strategisches Webdesign mit moderner KI-Automatisierung. Unternehmen erhalten nicht nur eine Website, sondern digitale Systeme, die Anfragen generieren, Prozesse automatisieren und Wachstum unterstützen.
                </p>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={0.1}
                className="pt-2 lg:pt-10"
              >
                <ul className="space-y-0 divide-y divide-gray-200 dark:divide-gray-800">
                  {EXPERTISE_POINTS.map((point, i) => {
                    const Icon = point.icon;
                    return (
                      <motion.li
                        key={point.label}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeUp}
                        custom={i * 0.06}
                        className="flex items-center gap-4 py-4"
                      >
                        <Icon size={14} className="text-gray-400 dark:text-gray-600 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {point.label}
                        </span>
                      </motion.li>
                    );
                  })}
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── LOCAL AUTHORITY ───────────────────────────────────────────── */}
        <section
          aria-labelledby="local-heading"
          className="border-b border-gray-100 dark:border-gray-800"
        >
          <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-20 lg:py-28">
            <div className="grid lg:grid-cols-[1fr_1fr] gap-16 lg:gap-24 items-start">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={0}
              >
                <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-gray-300 dark:text-gray-700 mb-6">
                  Standort & Reichweite
                </p>
                <h2
                  id="local-heading"
                  className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-tight mb-6"
                >
                  Digitale Lösungen aus Bayreuth — im Einsatz in ganz Deutschland
                </h2>
                <p className="text-[15px] text-gray-500 dark:text-gray-400 leading-relaxed">
                  Als AI-Agentur mit Sitz in Bayreuth betreut Cogniiq Unternehmen regional und deutschlandweit. Schwerpunkte liegen auf Webdesign, Automatisierung und KI-Integration für wachsende Unternehmen.
                </p>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={0.1}
                className="pt-2 lg:pt-10"
              >
                <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gray-300 dark:text-gray-700 mb-5">
                  Leistungen & Standorte
                </p>
                <div className="flex flex-wrap gap-2">
                  {LOCATION_LINKS.map((link) => (
                    <Link
                      key={link.href + link.label}
                      to={link.href}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                    >
                      {link.label}
                      <ChevronRight size={10} />
                    </Link>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── PROCESS ───────────────────────────────────────────────────── */}
        <section
          id="ablauf"
          aria-labelledby="process-heading"
          className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40"
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
                Prozess
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
                {PROCESS_STEPS.map((step, i) => {
                  const Icon = step.icon;
                  return (
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
                        <Icon size={14} className="text-gray-400 dark:text-gray-600" />
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 leading-snug">
                        {step.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed">
                        {step.description}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────────────────────── */}
        <section className="border-b border-gray-100 dark:border-gray-800">
          <div className="max-w-[780px] mx-auto px-6 lg:px-8 py-32 lg:py-40 text-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
            >
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-6">
                Lass uns dein digitales<br />System aufbauen
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-lg font-light mb-14 max-w-md mx-auto">
                Ob Website, Automatisierung oder KI-Integration — wir entwickeln Systeme, die messbar wirken.
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
        <div className="px-6 lg:px-8 py-4">
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
