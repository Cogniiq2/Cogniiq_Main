import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Monitor,
  Globe,
  Zap,
  CircleCheck as CheckCircle2,
  MapPin,
  Building2,
  Stethoscope,
  Utensils,
  Hotel,
  Dumbbell,
  ChevronRight,
} from "lucide-react";
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
  { name: "Webdesign", url: `${BASE}/webdesign` },
];

const faqItems = [
  {
    question: "Was unterscheidet Cogniiq von anderen Webdesign-Agenturen?",
    answer:
      "Wir bauen keine Templates und keinen Baukasten-Websites. Jede Website wird individuell entwickelt – mit technischem SEO, Core Web Vitals und Conversion-Optimierung von Anfang an.",
  },
  {
    question: "Wie lange dauert eine Website-Entwicklung?",
    answer:
      "Einfache Unternehmenswebsites gehen in 7–14 Tagen live. Komplexere Projekte mit mehreren Seiten und Integrationen dauern 3–6 Wochen. Wir kommunizieren Meilensteine transparent.",
  },
  {
    question: "Was kostet eine professionelle Website?",
    answer:
      "Die Kosten hängen von Umfang, Seiten und Integrationen ab. Wir arbeiten mit Festpreisen – keine versteckten Kosten. Im kostenlosen Erstgespräch erhalten Sie eine konkrete Einschätzung.",
  },
  {
    question: "Ist SEO im Preis inklusive?",
    answer:
      "Technisches SEO und On-Page Optimierung sind immer inklusive. Lokale SEO-Struktur, Schema-Markup und Sitemap gehören zu jedem Projekt. Laufende SEO-Betreuung ist optional buchbar.",
  },
  {
    question: "Werden bestehende Websites auch überarbeitet?",
    answer:
      "Ja. Website Relaunches sind eines unserer Kernthemen. Wir modernisieren bestehende Websites ohne Rankingverlust – neues Design, bessere Performance, aktuelles SEO-Setup.",
  },
];

const CITY_LINKS = [
  { label: "Webdesign Bayreuth", href: "/bayreuth/webdesign", sub: "Hauptsitz & Region Oberfranken" },
  { label: "Webdesign München", href: "/muenchen/webdesign", sub: "Metropolregion München" },
  { label: "Webdesign Regensburg", href: "/regensburg/webdesign", sub: "Ostbayern & Regensburg" },
];

const CLUSTER_LINKS = [
  { label: "Webdesign-Kosten Bayreuth", href: "/bayreuth/webdesign-kosten" },
  { label: "Website erstellen Bayreuth", href: "/bayreuth/website-erstellen" },
  { label: "Landingpage Bayreuth", href: "/bayreuth/landingpage" },
  { label: "Website Relaunch Bayreuth", href: "/bayreuth/website-relaunch" },
  { label: "Lokales SEO Bayreuth", href: "/bayreuth/lokales-seo" },
  { label: "Webdesign-Kosten München", href: "/muenchen/webdesign-kosten" },
  { label: "Website erstellen München", href: "/muenchen/website-erstellen" },
  { label: "Landingpage München", href: "/muenchen/landingpage" },
  { label: "Website Relaunch München", href: "/muenchen/website-relaunch" },
  { label: "Lokales SEO München", href: "/muenchen/lokales-seo" },
  { label: "Webdesign-Kosten Regensburg", href: "/regensburg/webdesign-kosten" },
  { label: "Website erstellen Regensburg", href: "/regensburg/website-erstellen" },
  { label: "Landingpage Regensburg", href: "/regensburg/landingpage" },
  { label: "Website Relaunch Regensburg", href: "/regensburg/website-relaunch" },
  { label: "Lokales SEO Regensburg", href: "/regensburg/lokales-seo" },
];

const INDUSTRY_LINKS = [
  { icon: Stethoscope, label: "Webdesign für Ärzte", href: "/webdesign-arzt" },
  { icon: Utensils, label: "Webdesign Gastronomie", href: "/webdesign-gastronomie" },
  { icon: Building2, label: "Webdesign Immobilien", href: "/webdesign-immobilien" },
  { icon: Hotel, label: "Webdesign Hotels", href: "/webdesign-hotel" },
  { icon: Dumbbell, label: "Webdesign Sport & Fitness", href: "/webdesign-sport" },
];

const CITY_INDUSTRY_LINKS = [
  { label: "Webdesign Arzt Bayreuth", href: "/webdesign-arzt-bayreuth" },
  { label: "Webdesign Gastronomie Bayreuth", href: "/webdesign-gastronomie-bayreuth" },
  { label: "Webdesign Immobilien Bayreuth", href: "/webdesign-immobilien-bayreuth" },
  { label: "Webdesign Arzt München", href: "/webdesign-arzt-muenchen" },
  { label: "Webdesign Gastronomie München", href: "/webdesign-gastronomie-muenchen" },
  { label: "Webdesign Immobilien München", href: "/webdesign-immobilien-muenchen" },
  { label: "Webdesign Arzt Regensburg", href: "/webdesign-arzt-regensburg" },
  { label: "Webdesign Gastronomie Regensburg", href: "/webdesign-gastronomie-regensburg" },
  { label: "Webdesign Immobilien Regensburg", href: "/webdesign-immobilien-regensburg" },
];

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": `${BASE}/webdesign#service`,
  name: "Webdesign & Website-Entwicklung",
  description:
    "Individuelle, SEO-optimierte und hochkonvertierende Websites für Unternehmen in Bayern und Deutschland. Kein Template, kein Baukasten – sauberer Code, Core Web Vitals, Local SEO.",
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
  serviceType: "Webdesign",
  url: `${BASE}/webdesign`,
};

export function WebdesignHub() {
  return (
    <>
      <PageSEO
        title="Webdesign Agentur – Hochkonvertierende Websites für Unternehmen | Cogniiq"
        description="Cogniiq entwickelt individuelle Websites, die bei Google ranken und Besucher in Anfragen verwandeln. Kein Template, kein Baukasten – sauberer Code, Core Web Vitals, Local SEO."
        canonical={`${BASE}/webdesign`}
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
            <motion.p variants={fadeUp} custom={0} className="text-xs font-semibold tracking-[0.18em] uppercase text-blue-600 dark:text-blue-400 mb-4">
              Webdesign
            </motion.p>
            <motion.h1 variants={fadeUp} custom={0.05} className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 dark:text-white leading-[1.08] mb-6 max-w-3xl">
              Websites, die ranken.<br />
              <span className="text-blue-600 dark:text-blue-400">Und konvertieren.</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={0.1} className="text-lg text-gray-500 dark:text-white/55 leading-relaxed max-w-2xl mb-10">
              Cogniiq entwickelt individuelle Websites für Unternehmen in Bayern. Kein Template, kein Baukasten – sauberer Code, Core Web Vitals auf Niveau, Local SEO von Anfang an. Go-Live in 7–14 Tagen.
            </motion.p>
            <motion.div variants={fadeUp} custom={0.15} className="flex flex-wrap gap-4">
              <Link
                to="/kontakt"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors"
              >
                Kostenloses Erstgespräch <ArrowRight size={15} />
              </Link>
              <Link
                to="/kosten-webdesign"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/70 hover:border-gray-300 dark:hover:border-white/20 font-semibold text-sm transition-colors"
              >
                Webdesign Kosten
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* ── WHAT WE DO ── */}
        <section className="py-16 px-6 lg:px-10 max-w-7xl mx-auto border-t border-gray-100 dark:border-white/[0.06]">
          <motion.h2
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp}
            className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-10"
          >
            Was wir entwickeln
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Monitor,
                title: "Individuelle Website-Entwicklung",
                points: ["Mobile-First, Ladezeit unter 2 Sek.", "Konversionsorientiertes Design", "Sauberer Code, keine unnötigen Plugins"],
              },
              {
                icon: Globe,
                title: "Technisches SEO & Local SEO",
                points: ["On-Page SEO von Anfang an integriert", "Schema-Markup, Sitemap, Core Web Vitals", "Lokale SEO-Struktur für mehrere Standorte"],
              },
              {
                icon: Zap,
                title: "Performance & Conversion",
                points: ["Klare CTAs, optimierte Formulare", "Kontaktformulare mit Auto-Weiterleitung", "Analytics-Integration für Erfolgsmessung"],
              },
            ].map(({ icon: Icon, title, points }, i) => (
              <motion.div
                key={title}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i * 0.07}
                className="p-6 rounded-2xl border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02]"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-4">
                  <Icon size={18} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{title}</h3>
                <ul className="space-y-2">
                  {points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-gray-500 dark:text-white/50">
                      <CheckCircle2 size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
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
              Webdesign nach Standort
            </h2>
            <p className="text-gray-500 dark:text-white/50 mb-8 text-sm">
              Persönliche Betreuung in Bayreuth, München und Regensburg – remote für ganz Deutschland.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {CITY_LINKS.map(({ label, href, sub }, i) => (
              <motion.div key={href} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.07}>
                <Link to={href} className="group flex items-start gap-3 p-5 rounded-2xl border border-gray-100 dark:border-white/[0.06] hover:border-blue-200 dark:hover:border-blue-500/20 bg-white dark:bg-white/[0.01] hover:bg-blue-50/50 dark:hover:bg-blue-500/[0.04] transition-all">
                  <MapPin size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{label}</p>
                    <p className="text-xs text-gray-400 dark:text-white/35 mt-0.5">{sub}</p>
                  </div>
                  <ChevronRight size={14} className="ml-auto text-gray-300 dark:text-white/20 group-hover:text-blue-400 mt-0.5 transition-colors" />
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Cluster link grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {CLUSTER_LINKS.map(({ label, href }) => (
              <Link key={href} to={href} className="text-xs text-gray-500 dark:text-white/40 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-1 leading-snug">
                {label}
              </Link>
            ))}
          </div>
        </section>

        {/* ── INDUSTRIES ── */}
        <section id="branchen" className="py-16 px-6 lg:px-10 max-w-7xl mx-auto border-t border-gray-100 dark:border-white/[0.06]">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Webdesign nach Branche
          </motion.h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {INDUSTRY_LINKS.map(({ icon: Icon, label, href }, i) => (
              <motion.div key={href} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.06}>
                <Link to={href} className="group flex items-center gap-3 p-4 rounded-xl border border-gray-100 dark:border-white/[0.06] hover:border-blue-200 dark:hover:border-blue-500/20 bg-white dark:bg-transparent hover:bg-blue-50/50 dark:hover:bg-blue-500/[0.04] transition-all">
                  <Icon size={16} className="text-blue-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-700 dark:text-white/65 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{label}</span>
                  <ArrowRight size={13} className="ml-auto text-gray-300 dark:text-white/20 group-hover:text-blue-400 transition-colors" />
                </Link>
              </motion.div>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CITY_INDUSTRY_LINKS.map(({ label, href }) => (
              <Link key={href} to={href} className="text-xs text-gray-500 dark:text-white/40 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-1 leading-snug">
                {label}
              </Link>
            ))}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-16 px-6 lg:px-10 max-w-4xl mx-auto border-t border-gray-100 dark:border-white/[0.06]">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            Häufige Fragen zu Webdesign
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
              Bereit für eine Website, die wirklich arbeitet?
            </h2>
            <p className="text-gray-500 dark:text-white/50 mb-8 text-sm">
              Im kostenlosen Erstgespräch analysieren wir Ihre aktuelle Situation und zeigen konkret, was eine neue Website für Ihr Unternehmen bewirken kann.
            </p>
            <Link
              to="/kontakt"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
            >
              Jetzt Erstgespräch buchen <ArrowRight size={16} />
            </Link>
          </motion.div>
        </section>

      </div>
    </>
  );
}
