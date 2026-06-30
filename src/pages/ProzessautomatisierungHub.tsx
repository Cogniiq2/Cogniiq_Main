import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Settings, CircleCheck as CheckCircle2, MapPin, Building2, Stethoscope, Utensils, Briefcase, ChevronRight, GitMerge, ChartBar as BarChart2 } from "lucide-react";
import { PageSEO } from "@/components/PageSEO";
import { BUSINESS_INFO } from "@/lib/seo-data";

const BASE = BUSINESS_INFO.website;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

const breadcrumbs = [
  { name: "Home", url: BASE },
  { name: "Prozessautomatisierung", url: `${BASE}/prozessautomatisierung` },
];

const faqItems = [
  {
    question: "Was kann mit KI automatisiert werden?",
    answer:
      "Buchungen, Terminbestätigungen, Lead-Nachverfolgung, E-Mail-Sequenzen, Rechnungsstellung, Dokumentenverwaltung, CRM-Updates und vieles mehr. Wir analysieren Ihre Prozesse und zeigen konkret, wo Automatisierung sofort wirkt.",
  },
  {
    question: "Wie lange dauert die Einrichtung einer Automatisierung?",
    answer:
      "Einfache Workflows sind in 1–3 Wochen live. Komplexe Systeme mit mehreren Integrationen dauern 4–8 Wochen. Wir liefern Quick-Wins zuerst – damit Sie schnell erste Entlastung spüren.",
  },
  {
    question: "Welche Tools und Systeme können integriert werden?",
    answer:
      "Wir integrieren alle gängigen Tools: Google Workspace, Microsoft 365, HubSpot, Salesforce, Calendly, Stripe, Shopify, Lexoffice, Datev und viele weitere. Auch individuelle API-Integrationen sind möglich.",
  },
  {
    question: "Was kostet Prozessautomatisierung?",
    answer:
      "Die Kosten hängen von Komplexität und Anzahl der Integrationen ab. Wir arbeiten mit Festpreisen nach transparenter Analyse. Im kostenlosen Erstgespräch erhalten Sie eine konkrete Einschätzung.",
  },
  {
    question: "Braucht mein Team technisches Wissen?",
    answer:
      "Nein. Wir entwickeln und betreuen die Automatisierungen vollständig. Ihr Team erhält eine verständliche Dokumentation und kann die Systeme ohne technische Vorkenntnisse nutzen.",
  },
];

const CITY_LINKS = [
  { label: "Automatisierung Bayreuth", href: "/bayreuth/automatisierung", sub: "Hauptsitz & Region Oberfranken" },
  { label: "Automatisierung München", href: "/muenchen/automatisierung", sub: "Metropolregion München" },
  { label: "Automatisierung Regensburg", href: "/regensburg/automatisierung", sub: "Ostbayern & Regensburg" },
];

const INDUSTRY_LINKS = [
  { icon: Stethoscope, label: "Automatisierung Arztpraxen", href: "/automatisierung-arzt" },
  { icon: Utensils, label: "Automatisierung Restaurants", href: "/automatisierung-restaurant" },
  { icon: Building2, label: "Automatisierung Immobilien", href: "/automatisierung-immobilien" },
  { icon: Briefcase, label: "Automatisierung Sport & Fitness", href: "/automatisierung-sport" },
];

const RELATED_LINKS = [
  { label: "KI-Telefonassistent", href: "/ki-telefonassistent" },
  { label: "Webdesign", href: "/webdesign" },
  { label: "KI Agentur Deutschland", href: "/ki-agentur-deutschland" },
  { label: "Automatisierung Unternehmen", href: "/automatisierung-unternehmen" },
  { label: "Verpasste Anrufe lösen", href: "/verpasste-anrufe-verlust" },
  { label: "Manuelle Arbeit reduzieren", href: "/zu-viel-manuelle-arbeit" },
];

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": `${BASE}/prozessautomatisierung#service`,
  name: "Prozessautomatisierung & KI-Workflows",
  description:
    "KI-gestützte Prozessautomatisierung für Unternehmen in Bayern. Buchungen, Leads, Kommunikation und Verwaltung automatisieren – weniger manuelle Arbeit, mehr Kapazität.",
  provider: {
    "@type": "LocalBusiness",
    "@id": `${BASE}/#localbusiness`,
    name: "Cogniiq",
    url: BASE,
    telephone: BUSINESS_INFO.contact.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS_INFO.address.streetAddress,
      addressLocality: BUSINESS_INFO.address.addressLocality,
      postalCode: BUSINESS_INFO.address.postalCode,
      addressCountry: "DE",
    },
  },
  areaServed: ["Bayreuth", "München", "Regensburg", "Bayern", "Deutschland"],
  serviceType: "Prozessautomatisierung",
  url: `${BASE}/prozessautomatisierung`,
};

export function ProzessautomatisierungHub() {
  return (
    <>
      <PageSEO
        title="Prozessautomatisierung für Unternehmen | KI-Workflows – Cogniiq"
        description="Cogniiq automatisiert wiederkehrende Prozesse: Buchungen, Lead-Nachverfolgung, E-Mail-Workflows und mehr. Weniger manuelle Arbeit, mehr Kapazität für das Wesentliche."
        canonical={`${BASE}/prozessautomatisierung`}
        breadcrumbs={breadcrumbs}
        faqItems={faqItems}
        additionalSchema={serviceSchema}
      />

      <div className="min-h-screen bg-white dark:bg-gray-950">

        {/* ── HERO ── */}
        <section className="pt-20 pb-16 px-6 lg:px-10 max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            <motion.p variants={fadeUp} custom={0} className="text-xs font-semibold tracking-[0.18em] uppercase text-emerald-600 dark:text-emerald-400 mb-4">
              Prozessautomatisierung
            </motion.p>
            <motion.h1 variants={fadeUp} custom={0.05} className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 dark:text-white leading-[1.08] mb-6 max-w-3xl">
              Manuelle Prozesse stoppen.<br />
              <span className="text-emerald-600 dark:text-emerald-400">KI übernimmt.</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={0.1} className="text-lg text-gray-500 dark:text-white/55 leading-relaxed max-w-2xl mb-10">
              Cogniiq automatisiert wiederkehrende Aufgaben in Ihrem Unternehmen: Buchungen, Lead-Nachverfolgung, E-Mail-Sequenzen, Terminbestätigungen. Weniger manuelle Arbeit – mehr Kapazität für Wachstum.
            </motion.p>
            <motion.div variants={fadeUp} custom={0.15} className="flex flex-wrap gap-4">
              <Link
                to="/kontakt"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors"
              >
                Kostenloses Erstgespräch <ArrowRight size={15} />
              </Link>
              <Link
                to="/kosten-automatisierung"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/70 hover:border-gray-300 dark:hover:border-white/20 font-semibold text-sm transition-colors"
              >
                Automatisierung Kosten
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* ── WHAT WE DO ── */}
        <section className="py-16 px-6 lg:px-10 max-w-7xl mx-auto border-t border-gray-100 dark:border-white/[0.06]">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-10">
            Was wir automatisieren
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Settings,
                title: "Workflow-Automatisierung",
                points: ["Buchungen & Terminbestätigungen", "Lead-Nachverfolgung & CRM-Updates", "Rechnungsstellung & Dokumentenverwaltung"],
              },
              {
                icon: GitMerge,
                title: "System-Integration",
                points: ["CRM, ERP, Kalender verbinden", "Bidirektionale Datensynchronisation", "API-Integrationen für alle gängigen Tools"],
              },
              {
                icon: BarChart2,
                title: "Reporting & Monitoring",
                points: ["Automatische Wochen- und Monatsberichte", "Echtzeit-Benachrichtigungen bei Abweichungen", "KPI-Dashboards ohne manuellen Aufwand"],
              },
            ].map(({ icon: Icon, title, points }, i) => (
              <motion.div key={title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.07}
                className="p-6 rounded-2xl border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02]">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-4">
                  <Icon size={18} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{title}</h3>
                <ul className="space-y-2">
                  {points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-gray-500 dark:text-white/50">
                      <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── CITY HUB ── */}
        <section id="standorte" className="py-16 px-6 lg:px-10 max-w-7xl mx-auto border-t border-gray-100 dark:border-white/[0.06]">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Automatisierung nach Standort
            </h2>
            <p className="text-gray-500 dark:text-white/50 mb-8 text-sm">
              Persönliche Betreuung in Bayreuth, München und Regensburg – remote für ganz Deutschland.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-4">
            {CITY_LINKS.map(({ label, href, sub }, i) => (
              <motion.div key={href} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.07}>
                <Link to={href} className="group flex items-start gap-3 p-5 rounded-2xl border border-gray-100 dark:border-white/[0.06] hover:border-emerald-200 dark:hover:border-emerald-500/20 bg-white dark:bg-white/[0.01] hover:bg-emerald-50/50 dark:hover:bg-emerald-500/[0.04] transition-all">
                  <MapPin size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{label}</p>
                    <p className="text-xs text-gray-400 dark:text-white/35 mt-0.5">{sub}</p>
                  </div>
                  <ChevronRight size={14} className="ml-auto text-gray-300 dark:text-white/20 group-hover:text-emerald-400 mt-0.5 transition-colors" />
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── INDUSTRIES ── */}
        <section id="branchen" className="py-16 px-6 lg:px-10 max-w-7xl mx-auto border-t border-gray-100 dark:border-white/[0.06]">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Automatisierung nach Branche
          </motion.h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {INDUSTRY_LINKS.map(({ icon: Icon, label, href }, i) => (
              <motion.div key={href} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.06}>
                <Link to={href} className="group flex items-center gap-3 p-4 rounded-xl border border-gray-100 dark:border-white/[0.06] hover:border-emerald-200 dark:hover:border-emerald-500/20 bg-white dark:bg-transparent hover:bg-emerald-50/50 dark:hover:bg-emerald-500/[0.04] transition-all">
                  <Icon size={16} className="text-emerald-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-700 dark:text-white/65 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{label}</span>
                  <ArrowRight size={13} className="ml-auto text-gray-300 dark:text-white/20 group-hover:text-emerald-400 transition-colors" />
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── RELATED ── */}
        <section className="py-12 px-6 lg:px-10 max-w-7xl mx-auto border-t border-gray-100 dark:border-white/[0.06]">
          <motion.h3 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-sm font-semibold text-gray-400 dark:text-white/30 uppercase tracking-widest mb-4">
            Verwandte Seiten
          </motion.h3>
          <div className="flex flex-wrap gap-2">
            {RELATED_LINKS.map(({ label, href }) => (
              <Link key={href} to={href} className="text-sm text-gray-500 dark:text-white/40 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors border border-gray-100 dark:border-white/[0.06] px-3 py-1.5 rounded-lg hover:border-emerald-200 dark:hover:border-emerald-500/20">
                {label}
              </Link>
            ))}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-16 px-6 lg:px-10 max-w-4xl mx-auto border-t border-gray-100 dark:border-white/[0.06]">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            Häufige Fragen zur Automatisierung
          </motion.h2>
          <div className="space-y-4">
            {faqItems.map(({ question, answer }, i) => (
              <motion.div key={question} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.06}
                className="p-5 rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02]">
                <p className="font-semibold text-gray-900 dark:text-white text-sm mb-2">{question}</p>
                <p className="text-sm text-gray-500 dark:text-white/50 leading-relaxed">{answer}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-16 px-6 lg:px-10 max-w-3xl mx-auto text-center border-t border-gray-100 dark:border-white/[0.06]">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Welche Prozesse können wir automatisieren?
            </h2>
            <p className="text-gray-500 dark:text-white/50 mb-8 text-sm">
              Im kostenlosen Erstgespräch analysieren wir Ihre aktuellen Prozesse und zeigen, wo Automatisierung sofort messbar wirkt.
            </p>
            <Link
              to="/kontakt"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors"
            >
              Jetzt Erstgespräch buchen <ArrowRight size={16} />
            </Link>
          </motion.div>
        </section>

      </div>
    </>
  );
}
