import { motion } from "framer-motion";
import { CircleCheck as CheckCircle2, ArrowRight, MapPin, ChevronRight, Info, Phone, Building2, Lightbulb } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PageSEO } from "@/components/PageSEO";
import { RelatedPages } from "@/components/RelatedPages";
import { StimmprobeSection } from "@/components/StimmprobeSection";
import { TelefonassistentKompaktSection } from "@/components/TelefonassistentKompaktSection";
import { BUSINESS_INFO } from "@/lib/seo-data";
import { FAKTEN } from "@/lib/telefonassistent-copy";
import type { CityServiceConfig } from "@/lib/standorte-data";

/**
 * Bewegung nach COPY-BRIEF-3 §1.4: höchstens 180 ms, `ease-out`, ausschließlich
 * Deckkraft und kleine Verschiebung. Keine gestaffelten Scroll-Sequenzen — die
 * frühere Fassung verzögerte jedes Element um `i * 0.06`, was bei sechs Karten
 * eine halbe Sekunde Nachlauf ergab. Das ist genau die Scroll-Choreografie, die
 * §1.4 untersagt.
 */
const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.18, ease: "easeOut" as const },
  },
};

function renderWithLinks(text: string) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (match) {
          return (
            <Link
              key={i}
              to={match[2]}
              className="text-gray-800 dark:text-gray-200 underline underline-offset-2 decoration-gray-300 dark:decoration-gray-600 hover:decoration-gray-500 transition-colors"
            >
              {match[1]}
            </Link>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

interface CityServicePageProps {
  config: CityServiceConfig;
}

export function CityServicePage({ config }: CityServicePageProps) {
  const isTelefonassistent = config.serviceSlug === "ki-telefonassistent";

  const breadcrumbs = [
    { name: "Home", url: BUSINESS_INFO.website },
    { name: "Bayern", url: `${BUSINESS_INFO.website}/bayern` },
    { name: config.city, url: `${BUSINESS_INFO.website}/${config.citySlug}` },
    { name: config.service, url: `${BUSINESS_INFO.website}${config.route}` },
  ];


  const localBusinessSchema = {
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
        // Geo describes the business itself, which has one location (Bayreuth). It must
        // not be rewritten to the page's target city: doing so made the same @id claim
        // Munich/Regensburg coordinates against a Bayreuth postal address, contradicting
        // the identical @id emitted by index.html and LocalBusinessSchema on the same page.
        // The city relationship is expressed by areaServed below, which is what it means.
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": BUSINESS_INFO.geo.latitude,
          "longitude": BUSINESS_INFO.geo.longitude,
        },
        "areaServed": [
          {
            // No Wikidata @id: the previous mapping could not be verified (the Regensburg
            // entry in particular appeared to reference a different city). A wrong entity
            // reference is worse than none, so the city is identified by name only until
            // the IDs are confirmed.
            "@type": "City",
            "name": config.city,
          },
          {
            "@type": "State",
            "name": "Bayern",
          },
        ],
      },
      {
        "@type": "Service",
        "name": `${config.service} ${config.city}`,
        "description": config.seo.description,
        "url": config.seo.canonical,
        "provider": {
          "@id": `${BUSINESS_INFO.website}/#localbusiness`,
        },
        "areaServed": {
          "@type": "City",
          "name": config.city,
        },
        "serviceType": config.service,
      },
    ],
  };

  return (
    <>
      <PageSEO
        title={config.seo.title}
        description={config.seo.description}
        canonical={config.seo.canonical}
        breadcrumbs={breadcrumbs}
        faqItems={config.faq}
        additionalSchema={localBusinessSchema}
      />

      <main className="min-h-screen">
        <HeroSection config={config} breadcrumbs={breadcrumbs} />
        {/* M13 · Stimmprobe — nur Telefonassistent-Stadtseiten; asset-gated,
            rendert ohne Audiodatei nichts. */}
        {isTelefonassistent && <StimmprobeSection />}
        <TrustStrip config={config} />
        <LocalIntroSection config={config} />
        <WarumCogniiq config={config} />
        <MidPageCTA config={config} />
        <UseCasesSection config={config} />
        <ProcessSection config={config} />
        <BranchenSection config={config} />
        <LocalSzenarienSection config={config} />
        <LocalRelevanzSection config={config} />
        {/* Kompaktfassungen von M4/M10/M19/M7 — nur auf den drei
            Telefonassistent-Stadtseiten. Sie stehen nach dem lokalen Teil,
            damit die Stadtseite lokal bleibt; die Vollversionen liegen auf
            /praxen, der Preisseite und /datenschutz-sicherheit. */}
        {isTelefonassistent && <TelefonassistentKompaktSection city={config.city} />}
        <FAQSection config={config} />
        <RelatedPages config={config} />
        <CTASection config={config} />
      </main>
    </>
  );
}

function HeroSection({ config, breadcrumbs }: { config: CityServiceConfig; breadcrumbs: Array<{ name: string; url: string }> }) {
  const isTelefonassistent = config.serviceSlug === "ki-telefonassistent";

  return (
    <section className="pt-32 pb-20 bg-white dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <motion.nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 mb-8 flex-wrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.url} className="flex items-center gap-1.5">
              {i < breadcrumbs.length - 1 ? (
                <>
                  <Link to={crumb.url.replace(BUSINESS_INFO.website, "") || "/"} className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    {crumb.name}
                  </Link>
                  <ChevronRight size={12} />
                </>
              ) : (
                <span className="text-gray-600 dark:text-gray-300">{crumb.name}</span>
              )}
            </span>
          ))}
        </motion.nav>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm font-medium tracking-wide uppercase mb-6">
            <MapPin size={12} />
            {/* „DSGVO-konform" stand hier als Selbstzusage. Sie ist auf keiner
                Seite belegt — konform ist eine Verarbeitung, kein Produkt, und
                die Verträge mit den Unterauftragsverarbeitern sind nicht
                unterzeichnet (Inhaber-Entscheidung 18.08.2026, gilt fuer alle
                Produkte, nicht nur den Telefonassistenten). */}
            {config.city} · Bayern · {isTelefonassistent ? "Keine Gesprächsaufzeichnung" : "Feste Ansprechpartner"} · Persönliche Betreuung
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 leading-tight tracking-tight mb-6">
            {config.intro.h1}
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-3xl mb-8">
            {config.intro.lead}
          </p>

          {config.locationNote && (
            <div className="flex items-start gap-2.5 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-[17px] text-gray-600 dark:text-gray-400 max-w-xl mb-8">
              <Info size={16} className="flex-shrink-0 mt-0.5 text-gray-400" />
              <span>{config.locationNote}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-4">
            <Link
              to="/kontakt"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-700 dark:hover:bg-white transition-colors"
            >
              Kostenloses Erstgespräch
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/leistungen"
              className="inline-flex items-center gap-2 px-6 py-3.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm hover:border-gray-500 dark:hover:border-gray-400 transition-colors"
            >
              Beispiele ansehen
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function TrustStrip({ config }: { config: CityServiceConfig }) {
  // Zwei Angaben standen hier und hielten der Prüfung nicht stand:
  // - „DSGVO-konform" als Selbstzusage — auf keiner Seite belegt, siehe
  //   Hero-Kommentar. Ersatzlos gestrichen, nicht umformuliert.
  // - „Einrichtung in 7–14 Tagen" widerspricht der Go-live-Garantie aus
  //   FAKTEN.goLive. Die Angabe wurde in den Stadt-Configs bereits an vier
  //   Stellen korrigiert und lebte hier — in der geteilten Komponente —
  //   unbemerkt weiter (die Fehlerklasse aus HONESTY-AUDIT §7).
  const isTelefonassistent = config.serviceSlug === "ki-telefonassistent";
  const items = [
    config.city,
    config.service,
    "Bayern",
    "Persönliche Betreuung",
    ...(isTelefonassistent
      ? ["Keine Gesprächsaufzeichnung", `Go-live in ${FAKTEN.goLiveTage}\u00A0Tagen`]
      : ["Einrichtung in 7–14 Tagen"]),
  ];

  return (
    <div className="border-y border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
          {items.map((item, i) => (
            <span key={i} className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
              {i > 0 && <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" aria-hidden="true" />}
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function LocalIntroSection({ config }: { config: CityServiceConfig }) {
  return (
    <section className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300" aria-labelledby="local-intro-heading">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <h2 id="local-intro-heading" className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
            {config.service} in {config.city} – was das konkret für Ihren Betrieb bedeutet
          </h2>

          <div className="space-y-5">
            {config.localIntro.paragraphs.map((paragraph, i) => (
              <p key={i} className="text-[17px] text-gray-600 dark:text-gray-400 leading-relaxed">
                {renderWithLinks(paragraph)}
              </p>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function WarumCogniiq({ config }: { config: CityServiceConfig }) {
  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300" aria-labelledby="warum-heading">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <h2 id="warum-heading" className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Warum Cogniiq für {config.service} in {config.city}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-10">
            Was konkret für uns spricht – ohne Hochglanz-Versprechen.
          </p>
        </motion.div>

        <ul className="space-y-4">
          {config.warumCogniiq.map((point, i) => (
            <motion.li
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="flex items-start gap-3 p-5 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50"
            >
              <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5 text-[#515A61] dark:text-sky-400" />
              <span className="text-gray-700 dark:text-gray-300">{point}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function MidPageCTA({ config }: { config: CityServiceConfig }) {
  return (
    <div className="bg-white dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex-1">
            <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
              {config.service} in {config.city} – kostenloses Erstgespräch
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              30–45&nbsp;Minuten, unverbindlich, mit konkretem Ergebnis.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/kontakt"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-700 dark:hover:bg-white transition-colors whitespace-nowrap"
            >
              Gespräch vereinbaren
              <ArrowRight size={14} />
            </Link>
            {BUSINESS_INFO.contact.phone && (
              <a
                href={`tel:${BUSINESS_INFO.contact.phone.replace(/\s/g, "")}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm hover:border-gray-500 dark:hover:border-gray-400 transition-colors whitespace-nowrap"
              >
                <Phone size={14} />
                Anrufen
              </a>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function UseCasesSection({ config }: { config: CityServiceConfig }) {
  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300" aria-labelledby="usecases-heading">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mb-12"
        >
          <h2 id="usecases-heading" className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Wer in {config.city} davon profitiert
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Branchen und Betriebe, bei denen {config.service} in {config.city} sofort wirkt.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {config.useCases.map((useCase, i) => (
            <motion.article
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 flex flex-col gap-3"
            >
              <span className="text-sm font-semibold uppercase tracking-wider text-[#515A61] dark:text-sky-400">
                {useCase.industry}
              </span>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {useCase.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed flex-1">
                {useCase.description}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProcessSection({ config }: { config: CityServiceConfig }) {
  return (
    <section className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300" aria-labelledby="process-heading">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mb-12"
        >
          <h2 id="process-heading" className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            So läuft ein Projekt ab
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Von der ersten Anfrage bis zum fertigen Ergebnis – in vier klaren Schritten.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {config.processSteps.map((step, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="relative"
            >
              <div className="text-4xl font-black text-gray-100 dark:text-gray-800 mb-4 select-none">
                {step.number}
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {step.title}
              </h3>
              <p className="text-[17px] text-gray-600 dark:text-gray-400 leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LocalRelevanzSection({ config }: { config: CityServiceConfig }) {
  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300" aria-labelledby="local-heading">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <h2 id="local-heading" className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Was Betriebe in {config.city} bremst
            </h2>
            <ul className="space-y-4">
              {config.localChallenges.map((challenge, i) => (
                <li key={i} className="flex items-start gap-3 text-[17px] text-gray-600 dark:text-gray-400">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center justify-center text-sm font-bold mt-0.5">
                    {i + 1}
                  </span>
                  {challenge}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Geeignet für diese Branchen in {config.city}
            </h2>
            <div className="flex flex-wrap gap-2">
              {config.industries.map((industry) => (
                <span
                  key={industry}
                  className="px-3 py-1.5 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg"
                >
                  {industry}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function BranchenSection({ config }: { config: CityServiceConfig }) {
  if (!config.industriesExpanded || config.industriesExpanded.length === 0) return null;

  return (
    <section className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300" aria-labelledby="branchen-heading">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mb-12"
        >
          <h2 id="branchen-heading" className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Herausforderung & Lösung – branchenspezifisch
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Typische Ausgangssituationen in {config.city} – und wie {config.service} konkret hilft.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-5">
          {config.industriesExpanded.map((block, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50"
            >
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <Building2 size={14} className="text-gray-500 dark:text-gray-400" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                  {block.name}
                </h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">
                    Herausforderung
                  </p>
                  <p className="text-[17px] text-gray-600 dark:text-gray-400 leading-relaxed">
                    {block.problem}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#515A61] dark:text-sky-400 uppercase tracking-widest mb-1">
                    Lösung
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {block.solution}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LocalSzenarienSection({ config }: { config: CityServiceConfig }) {
  if (!config.localScenarios || config.localScenarios.length === 0) return null;

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300" aria-labelledby="szenarien-heading">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mb-12"
        >
          <h2 id="szenarien-heading" className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Beispielszenarien, in denen {config.service} greift
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Typische Ausgangssituationen in {config.city} und Umgebung – als Beispielszenarien beschrieben.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {config.localScenarios.map((scenario, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="flex gap-4 p-6 rounded-2xl bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Lightbulb size={15} className="text-gray-400 dark:text-gray-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {scenario.title}
                </h3>
                <p className="text-[17px] text-gray-600 dark:text-gray-400 leading-relaxed">
                  {scenario.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection({ config }: { config: CityServiceConfig }) {
  return (
    <section className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300" aria-labelledby="faq-heading">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mb-10"
        >
          <h2 id="faq-heading" className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Häufige Fragen
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Alles Wichtige zu {config.service} in {config.city} – konkret beantwortet.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {config.faq.map((item, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl px-5 data-[state=open]:border-gray-300 dark:data-[state=open]:border-gray-600 transition-colors"
              >
                <AccordionTrigger className="text-left text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-300 transition-colors py-5 [&>svg]:text-gray-400">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-[17px] text-gray-600 dark:text-gray-400 leading-relaxed pb-5">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}

function CTASection({ config }: { config: CityServiceConfig }) {
  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300">
      <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {config.service} in {config.city} anfragen
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
            Kostenloses Erstgespräch für Unternehmen in {config.city} – 30 bis 45&nbsp;Minuten, ohne Verpflichtung. Danach wissen Sie genau, was möglich ist und was es kostet.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/kontakt"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold hover:bg-gray-700 dark:hover:bg-white transition-colors"
            >
              {config.service} in {config.city} anfragen
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/leistungen"
              className="inline-flex items-center gap-2 px-7 py-3.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:border-gray-500 dark:hover:border-gray-400 transition-colors"
            >
              Alle Leistungen ansehen
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400 dark:text-gray-500">
            <Link to="/ki-telefonassistent" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">KI-Telefonassistent</Link>
            <span aria-hidden="true">·</span>
            <Link to="/webdesign-agentur-deutschland" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Webdesign Agentur</Link>
            <span aria-hidden="true">·</span>
            <Link to="/automatisierung-unternehmen" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Automatisierung</Link>
            <span aria-hidden="true">·</span>
            <Link to="/verpasste-anrufe-verlust" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Verpasste Anrufe</Link>
            <span aria-hidden="true">·</span>
            <span>{BUSINESS_INFO.contact.email}</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
