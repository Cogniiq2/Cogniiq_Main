import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, CircleCheck as CheckCircle2, ChevronRight, CircleAlert as AlertCircle, Lightbulb, MapPin } from "lucide-react";
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
    transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

export interface NationalIndustryPageConfig {
  seo: {
    title: string;
    description: string;
    canonical: string;
    keywords: string;
  };
  h1: string;
  tagline: string;
  intro: string;
  serviceSlug: string;
  serviceLabel: string;
  costLink: string;
  costLinkLabel: string;
  problems: Array<{ title: string; description: string }>;
  solution: {
    headline: string;
    text: string;
  };
  benefits: string[];
  workflow: {
    title: string;
    steps: Array<{ step: string; title: string; description: string }>;
  };
  cityLinks: Array<{ label: string; href: string }>;
  relatedLinks: Array<{ label: string; href: string }>;
  faq: Array<{ question: string; answer: string }>;
}

interface Props {
  config: NationalIndustryPageConfig;
}

export function NationalIndustryPage({ config }: Props) {
  const breadcrumbs = [
    { name: "Home", url: BUSINESS_INFO.website },
    { name: config.serviceLabel, url: `${BUSINESS_INFO.website}/${config.serviceSlug}` },
    { name: config.h1, url: config.seo.canonical },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: config.h1,
        description: config.seo.description,
        url: config.seo.canonical,
        provider: {
          "@type": "Organization",
          name: BUSINESS_INFO.name,
          url: BUSINESS_INFO.website,
        },
        areaServed: { "@type": "Country", name: "Deutschland" },
        keywords: config.seo.keywords,
      },
      {
        "@type": "FAQPage",
        mainEntity: config.faq.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
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
              className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 mb-8 flex-wrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Link to="/" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Home</Link>
              <ChevronRight size={12} />
              <Link to={`/${config.serviceSlug}`} className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">{config.serviceLabel}</Link>
              <ChevronRight size={12} />
              <span className="text-gray-600 dark:text-gray-300">{config.h1}</span>
            </motion.nav>

            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.1}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium tracking-wide uppercase mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {config.tagline}
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
                  to={`/${config.serviceSlug}`}
                  className="inline-flex items-center gap-2 px-6 py-3.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm hover:border-gray-500 dark:hover:border-gray-400 transition-colors"
                >
                  {config.serviceLabel}
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <div className="border-y border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
              {["Deutschland", "DSGVO-konform", "Made in Germany", "Individuelle Lösung", "Schnelle Einrichtung"].map((item, i) => (
                <span key={i} className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  {i > 0 && <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" aria-hidden="true" />}
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <section className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300" aria-labelledby="problems-heading">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="mb-12"
            >
              <h2 id="problems-heading" className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Typische Herausforderungen in der Branche
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Was Unternehmen in dieser Branche täglich kostet – und warum digitale Lösungen entscheidend sind.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-4">
              {config.problems.map((problem, i) => (
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i * 0.07}
                  className="flex gap-4 p-5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50"
                >
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-gray-400 dark:text-gray-500" />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">{problem.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{problem.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300" aria-labelledby="solution-heading">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={0}
              >
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">
                  Die Lösung
                </p>
                <h2 id="solution-heading" className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-tight mb-6">
                  {config.solution.headline}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
                  {config.solution.text}
                </p>
                <Link
                  to="/kontakt"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-700 dark:hover:bg-white transition-colors"
                >
                  Lösung anfragen
                  <ArrowRight size={15} />
                </Link>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={0.15}
                className="space-y-3"
              >
                {config.benefits.map((benefit, i) => (
                  <motion.div
                    key={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    custom={i * 0.06}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50"
                  >
                    <CheckCircle2 size={15} className="text-[#515A61] dark:text-sky-400 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{benefit}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300" aria-labelledby="workflow-heading">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="mb-14"
            >
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">
                Beispiel-Workflow
              </p>
              <h2 id="workflow-heading" className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                {config.workflow.title}
              </h2>
            </motion.div>

            <div className="grid sm:grid-cols-3 gap-8">
              {config.workflow.steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i * 0.1}
                  className="relative"
                >
                  {i < config.workflow.steps.length - 1 && (
                    <div className="hidden sm:block absolute top-5 left-full w-full h-px border-t border-dashed border-gray-200 dark:border-gray-700 z-0 -translate-x-8" />
                  )}
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
                        <Lightbulb size={17} className="text-gray-500 dark:text-gray-400" />
                      </div>
                      <span className="text-xs font-bold tracking-widest text-gray-300 dark:text-gray-600 uppercase">
                        {step.step}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                      {step.description}
                    </p>
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
                Verfügbar in ganz Deutschland
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Cogniiq betreut Projekte remote in ganz Deutschland – Schwerpunkt Bayern.
              </p>
            </motion.div>

            <div className="flex flex-wrap gap-3 mb-8">
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

            <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">Weiterführende Seiten</p>
              <div className="flex flex-wrap gap-3">
                {config.relatedLinks.map((link, i) => (
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
                Häufige Fragen
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
                Nächster Schritt: Kostenlose Beratung
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
                Im kostenlosen Erstgespräch zeigen wir Ihnen, wie die Lösung konkret in Ihrer Branche funktioniert – ohne Verpflichtung.
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
                  to={config.costLink}
                  className="inline-flex items-center gap-2 px-7 py-3.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:border-gray-500 dark:hover:border-gray-400 transition-colors"
                >
                  {config.costLinkLabel}
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
