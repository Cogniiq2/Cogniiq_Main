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
import { BUSINESS_INFO } from "@/lib/seo-data";
import type { CityServiceConfig } from "@/lib/standorte-data";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const CITY_COORDINATES: Record<string, {
  lat: string;
  lng: string;
  postalCodes: string[];
}> = {
  bayreuth: {
    lat: "49.9483",
    lng: "11.5783",
    postalCodes: ["95444", "95445", "95447", "95448"],
  },
  muenchen: {
    lat: "48.1372",
    lng: "11.5761",
    postalCodes: ["80331", "80333", "80335", "80336", "80337"],
  },
  regensburg: {
    lat: "49.0134",
    lng: "12.1016",
    postalCodes: ["93047", "93049", "93051", "93053", "93055"],
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
  const breadcrumbs = [
    { name: "Home", url: BUSINESS_INFO.website },
    { name: "Bayern", url: `${BUSINESS_INFO.website}/bayern` },
    { name: config.city, url: `${BUSINESS_INFO.website}/${config.citySlug}` },
    { name: config.service, url: `${BUSINESS_INFO.website}${config.route}` },
  ];

  const coords = CITY_COORDINATES[config.citySlug] ?? CITY_COORDINATES.bayreuth;

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
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": coords.lat,
          "longitude": coords.lng,
        },
        "hasMap": `https://www.google.com/maps/search/${encodeURIComponent(config.city)}+${encodeURIComponent(config.service)}`,
        "areaServed": [
          {
            "@type": "City",
            "name": config.city,
            "@id": `https://www.wikidata.org/wiki/${
              config.citySlug === "muenchen" ? "Q1726" :
              config.citySlug === "regensburg" ? "Q2749" : "Q3506"
            }`,
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
        <TrustStrip config={config} />
        <LocalIntroSection config={config} />
        <WarumCogniiq config={config} />
        <MidPageCTA config={config} />
        <UseCasesSection config={config} />
        <ProcessSection config={config} />
        <BranchenSection config={config} />
        <LocalSzenarienSection config={config} />
        <LocalRelevanzSection config={config} />
        <FAQSection config={config} />
        <RelatedPages config={config} />
        <CTASection config={config} />
      </main>
    </>
  );
}

function HeroSection({ config, breadcrumbs }: { config: CityServiceConfig; breadcrumbs: Array<{ name: string; url: string }> }) {
  return (
    <section className="pt-32 pb-20 bg-white dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <motion.nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 mb-8 flex-wrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
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
          custom={0.1}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium tracking-wide uppercase mb-6">
            <MapPin size={12} />
            {config.city} · Bayern · DSGVO-konform · Persönliche Betreuung
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 leading-tight tracking-tight mb-6">
            {config.intro.h1}
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-3xl mb-8">
            {config.intro.lead}
          </p>

          {config.locationNote && (
            <div className="flex items-start gap-2.5 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 max-w-xl mb-8">
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
  const items = [
    config.city,
    config.service,
    "Bayern",
    "DSGVO-konform",
    "Persönliche Betreuung",
    "Einrichtung in 7–14 Tagen",
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
          custom={0}
        >
          <h2 id="local-intro-heading" className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
            {config.service} in {config.city} – was das konkret für Ihren Betrieb bedeutet
          </h2>

          <div className="space-y-5">
            {config.localIntro.paragraphs.map((paragraph, i) => (
              <p key={i} className="text-gray-600 dark:text-gray-400 leading-relaxed">
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
          custom={0}
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
              custom={i * 0.07}
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
          custom={0}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex-1">
            <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
              {config.service} in {config.city} – kostenloses Erstgespräch
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              30–45 Minuten, unverbindlich, mit konkretem Ergebnis.
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
          custom={0}
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
              custom={i * 0.1}
              className="bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 flex flex-col gap-3"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-[#515A61] dark:text-sky-400">
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
          custom={0}
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
              custom={i * 0.08}
              className="relative"
            >
              <div className="text-4xl font-black text-gray-100 dark:text-gray-800 mb-4 select-none">
                {step.number}
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
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
            custom={0}
          >
            <h2 id="local-heading" className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Was Betriebe in {config.city} bremst
            </h2>
            <ul className="space-y-4">
              {config.localChallenges.map((challenge, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center justify-center text-xs font-bold mt-0.5">
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
            custom={0.1}
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
          custom={0}
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
              custom={i * 0.07}
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
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">
                    Herausforderung
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {block.problem}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#515A61] dark:text-sky-400 uppercase tracking-widest mb-1">
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
          custom={0}
          className="mb-12"
        >
          <h2 id="szenarien-heading" className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Reale Situationen, in denen {config.service} greift
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Ausgangssituationen aus der Praxis – anonymisiert, aus {config.city} und Umgebung.
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
              custom={i * 0.09}
              className="flex gap-4 p-6 rounded-2xl bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Lightbulb size={15} className="text-gray-400 dark:text-gray-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {scenario.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
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
          custom={0}
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
          custom={0.1}
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
                <AccordionContent className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed pb-5">
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
          custom={0}
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {config.service} in {config.city} anfragen
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
            Kostenloses Erstgespräch für Unternehmen in {config.city} – 30 bis 45 Minuten, ohne Verpflichtung. Danach wissen Sie genau, was möglich ist und was es kostet.
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

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-400 dark:text-gray-500">
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
