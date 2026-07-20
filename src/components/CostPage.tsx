import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, CircleCheck as CheckCircle2, ChevronRight, Euro, CircleAlert as AlertCircle, MapPin } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PageSEO } from "@/components/PageSEO";
import { BUSINESS_INFO } from "@/lib/seo-data";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

export interface PriceRange {
  label: string;
  range: string;
  description: string;
}

export interface PriceFactor {
  title: string;
  description: string;
}

export interface ExampleProject {
  title: string;
  description: string;
  investment: string;
}

export interface CostPageConfig {
  seo: {
    title: string;
    description: string;
    canonical: string;
  };
  h1: string;
  intro: string;
  serviceLink: string;
  serviceLinkLabel: string;
  priceRanges: PriceRange[];
  priceFactors: PriceFactor[];
  exampleProjects: ExampleProject[];
  cityLinks: Array<{ label: string; href: string }>;
  industryLinks: Array<{ label: string; href: string }>;
  faq: Array<{ question: string; answer: string }>;
  ctaHeadline: string;
  ctaText: string;
}

interface CostPageProps {
  config: CostPageConfig;
}

export function CostPage({ config }: CostPageProps) {
  const breadcrumbs = [
    { name: "Home", url: BUSINESS_INFO.website },
    { name: config.h1, url: config.seo.canonical },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        mainEntity: config.faq.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      },
      {
        "@type": "Service",
        name: config.h1,
        description: config.seo.description,
        url: config.seo.canonical,
        provider: {
          "@type": "Organization",
          "@id": `${BUSINESS_INFO.website}/#organization`,
          name: BUSINESS_INFO.name,
          url: BUSINESS_INFO.website,
          address: {
            "@type": "PostalAddress",
            streetAddress: BUSINESS_INFO.address.streetAddress,
            addressLocality: BUSINESS_INFO.address.addressLocality,
            addressRegion: BUSINESS_INFO.address.addressRegion,
            postalCode: BUSINESS_INFO.address.postalCode,
            addressCountry: BUSINESS_INFO.address.addressCountry,
          },
        },
        offers: config.priceRanges.map((p) => ({
          "@type": "Offer",
          name: p.label,
          description: p.description,
          price: p.range,
          priceCurrency: "EUR",
          seller: {
            "@type": "Organization",
            name: BUSINESS_INFO.name,
          },
        })),
        areaServed: {
          "@type": "Country",
          name: "Deutschland",
        },
        inLanguage: "de-DE",
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
        additionalSchema={schema}
      />

      <main className="min-h-screen">
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
              <span className="text-gray-600 dark:text-gray-300">{config.h1}</span>
            </motion.nav>

            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.1}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium tracking-wide uppercase mb-6">
                <Euro size={12} />
                Preise · Kosten · Deutschland · DSGVO-konform
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-tight mb-6">
                {config.h1}
              </h1>

              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl leading-relaxed mb-8">
                {config.intro}
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
                  to={config.serviceLink}
                  className="inline-flex items-center gap-2 px-6 py-3.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm hover:border-gray-500 dark:hover:border-gray-400 transition-colors"
                >
                  {config.serviceLinkLabel}
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <div className="border-y border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
              {["Individuelles Angebot", "Kostenlos Erstgespräch", "DSGVO-konform", "Made in Germany", "Faire Preise"].map((item, i) => (
                <span key={i} className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  {i > 0 && <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" aria-hidden="true" />}
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <section className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300" aria-labelledby="ranges-heading">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="mb-12"
            >
              <h2 id="ranges-heading" className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Typische Preisspannen
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Orientierungswerte für Projekte in Deutschland – individuelle Angebote nach kostenlosem Erstgespräch.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {config.priceRanges.map((range, i) => (
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i * 0.1}
                  className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl p-6"
                >
                  <div className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
                    {range.label}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                    {range.range}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {range.description}
                  </p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0.3}
              className="mt-8 p-5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 flex items-start gap-3"
            >
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-gray-400 dark:text-gray-500" />
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Alle Preise sind Richtwerte. Das tatsächliche Angebot hängt von Ihrem individuellen Bedarf ab. Das Erstgespräch ist kostenlos und unverbindlich.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-20 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300" aria-labelledby="factors-heading">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="mb-12"
            >
              <h2 id="factors-heading" className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Was beeinflusst den Preis?
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Diese Faktoren bestimmen den Umfang und damit die Investitionshöhe.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-4">
              {config.priceFactors.map((factor, i) => (
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i * 0.07}
                  className="flex gap-4 p-5 rounded-xl bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700"
                >
                  <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5 text-[#515A61] dark:text-sky-400" />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">{factor.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{factor.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300" aria-labelledby="examples-heading">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="mb-12"
            >
              <h2 id="examples-heading" className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Beispielprojekte
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Anonymisierte Praxisbeispiele aus der Zusammenarbeit mit deutschen Unternehmen.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {config.exampleProjects.map((project, i) => (
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i * 0.09}
                  className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden"
                >
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">{project.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{project.description}</p>
                  </div>
                  <div className="px-6 py-4 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Investition</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{project.investment}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300" aria-labelledby="cities-heading">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="mb-10"
            >
              <h2 id="cities-heading" className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Verfügbar in Deutschland
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Cogniiq betreut Projekte in ganz Deutschland – Schwerpunkt Bayern.
              </p>
            </motion.div>
            <div className="flex flex-wrap gap-3">
              {config.cityLinks.map((link, i) => (
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i * 0.05}
                >
                  <Link
                    to={link.href}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                  >
                    <MapPin size={12} className="text-gray-400" />
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </div>

            {config.industryLinks.length > 0 && (
              <div className="mt-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">Branchen</p>
                <div className="flex flex-wrap gap-3">
                  {config.industryLinks.map((link, i) => (
                    <motion.div
                      key={i}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      variants={fadeUp}
                      custom={i * 0.05}
                    >
                      <Link
                        to={link.href}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                      >
                        {link.label}
                        <ArrowRight size={12} />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

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
                Häufige Fragen zu Kosten & Preisen
              </h2>
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
                {config.ctaHeadline}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
                {config.ctaText}
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
                  to={config.serviceLink}
                  className="inline-flex items-center gap-2 px-7 py-3.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:border-gray-500 dark:hover:border-gray-400 transition-colors"
                >
                  {config.serviceLinkLabel}
                </Link>
              </div>
              <p className="mt-6 text-xs text-gray-400 dark:text-gray-500">
                {BUSINESS_INFO.name} · {BUSINESS_INFO.contact.email} · {BUSINESS_INFO.contact.phoneDisplay}
              </p>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
}
