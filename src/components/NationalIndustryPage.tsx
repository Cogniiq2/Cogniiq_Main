import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CircleCheck as CheckCircle2,
  ChevronRight,
  MapPin,
  ChevronDown,
  Phone,
  Lock,
} from "lucide-react";
import { PageSEO } from "@/components/PageSEO";
import { BUSINESS_INFO } from "@/lib/seo-data";

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.58, delay, ease: [0.22, 1, 0.36, 1] },
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

function FAQItem({ item, index }: { item: { question: string; answer: string }; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
      custom={index * 0.05}
      className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/60 rounded-xl overflow-hidden"
    >
      <button
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left text-[14px] font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors duration-150"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>{item.question}</span>
        <ChevronDown
          size={15}
          className={`flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5 pt-0">
              <div className="w-full h-px bg-gray-100 dark:bg-gray-700/60 mb-4" />
              <p className="text-[14px] text-gray-600 dark:text-gray-400 leading-[1.7]">
                {item.answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
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

        {/* ── HERO ── */}
        <section className="pt-32 pb-24 bg-white dark:bg-gray-950">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <motion.nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-[12px] text-gray-400 dark:text-gray-500 mb-10 flex-wrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Link to="/" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Home</Link>
              <ChevronRight size={10} />
              <Link to={`/${config.serviceSlug}`} className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">{config.serviceLabel}</Link>
              <ChevronRight size={10} />
              <span className="text-gray-600 dark:text-gray-300">{config.h1}</span>
            </motion.nav>

            <div className="grid lg:grid-cols-[1fr_380px] gap-16 items-start">
              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.08}>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-[11px] font-medium tracking-widest uppercase mb-8 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {config.tagline}
                </div>

                <h1 className="text-[2.4rem] md:text-5xl lg:text-[3.2rem] font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-[1.08] mb-6">
                  {config.h1}
                </h1>

                <p className="text-[17px] text-gray-600 dark:text-gray-400 leading-[1.7] max-w-xl mb-8">
                  {config.intro}
                </p>

                <div className="flex flex-wrap gap-3 mb-10">
                  <Link
                    to="/kontakt"
                    className="inline-flex items-center gap-2.5 px-7 py-4 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold text-[14px] hover:bg-gray-700 dark:hover:bg-white transition-all duration-200 hover:-translate-y-0.5 shadow-sm hover:shadow-md"
                  >
                    <Phone size={14} />
                    Kostenloses Erstgespräch
                  </Link>
                  <Link
                    to={`/${config.serviceSlug}`}
                    className="inline-flex items-center gap-2.5 px-7 py-4 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-[14px] hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    {config.serviceLabel}
                    <ArrowRight size={13} />
                  </Link>
                </div>

                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {["DSGVO-konform · Deutsche Server", "Einrichtung in wenigen Tagen", "Individuelle Konfiguration"].map((item, i) => (
                    <motion.div
                      key={i}
                      initial="hidden"
                      animate="visible"
                      variants={fadeUp}
                      custom={0.3 + i * 0.06}
                      className="flex items-center gap-2 text-[12px] text-gray-500 dark:text-gray-400"
                    >
                      <CheckCircle2 size={11} className="text-emerald-500 flex-shrink-0" />
                      {item}
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Hero trust card */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={0.18}
                className="hidden lg:block"
              >
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-900 overflow-hidden shadow-[0_2px_24px_rgba(0,0,0,0.07)] dark:shadow-[0_2px_24px_rgba(0,0,0,0.3)]">
                  <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/60">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 tracking-widest uppercase">
                      Cogniiq · {config.serviceLabel}
                    </span>
                  </div>
                  <div className="p-5 space-y-3">
                    {config.benefits.slice(0, 5).map((b, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50">
                        <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
                        <span className="text-[13px] text-gray-700 dark:text-gray-300 font-medium leading-snug">{b}</span>
                      </div>
                    ))}
                  </div>
                  <div className="px-5 py-3.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/30 flex items-center gap-2">
                    <Lock size={11} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
                    <span className="text-[11px] text-gray-400 dark:text-gray-500">DSGVO-konform · Verarbeitung auf deutschen Servern</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── CREDENTIAL STRIP ── */}
        <div className="border-y border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/30">
          <div className="max-w-6xl mx-auto px-6 lg:px-8 py-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {["Deutschland · Remote", "DSGVO-konform", "Einrichtung in Tagen", "Individuelle Konfiguration", "Keine IT-Vorkenntnisse nötig"].map((item, i) => (
                <span key={i} className="flex items-center gap-2 text-[12px] font-medium text-gray-500 dark:text-gray-400">
                  <CheckCircle2 size={11} className="text-emerald-500 flex-shrink-0" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── PROBLEMS ── */}
        <section className="py-24 bg-white dark:bg-gray-950" aria-labelledby="problems-heading">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
              custom={0}
              className="max-w-2xl mb-14"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-4">
                Das Problem
              </p>
              <h2 id="problems-heading" className="text-3xl lg:text-[2.2rem] font-bold text-gray-900 dark:text-gray-100 leading-[1.15] mb-4">
                Typische Herausforderungen in der Branche
              </h2>
              <p className="text-[15px] text-gray-500 dark:text-gray-400 leading-[1.7]">
                Was Betriebe in diesem Bereich täglich Umsatz und Zeit kostet – und warum gezielt eingesetzte Digitallösungen entscheidend sind.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-4">
              {config.problems.map((problem, i) => (
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-30px" }}
                  variants={fadeUp}
                  custom={i * 0.06}
                  className="flex gap-4 p-6 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-colors duration-300 group"
                >
                  <div className="w-1 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 mt-1 self-stretch group-hover:bg-gray-300 dark:group-hover:bg-gray-600 transition-colors" />
                  <div>
                    <h3 className="text-[14px] font-semibold text-gray-900 dark:text-gray-100 mb-2 leading-snug">
                      {problem.title}
                    </h3>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
                      {problem.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SOLUTION ── */}
        <section className="py-24 bg-gray-50 dark:bg-gray-900/40" aria-labelledby="solution-heading">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={fadeUp}
                custom={0}
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-4">
                  Die Lösung
                </p>
                <h2 id="solution-heading" className="text-3xl lg:text-[2.1rem] font-bold text-gray-900 dark:text-gray-100 leading-[1.15] mb-5">
                  {config.solution.headline}
                </h2>
                <p className="text-[15px] text-gray-600 dark:text-gray-400 leading-[1.7] mb-8 max-w-lg">
                  {config.solution.text}
                </p>
                <Link
                  to="/kontakt"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold text-[14px] hover:bg-gray-700 dark:hover:bg-white transition-all duration-200 hover:-translate-y-0.5 shadow-sm"
                >
                  Lösung anfragen
                  <ArrowRight size={14} />
                </Link>
                <p className="mt-3 text-[12px] text-gray-400 dark:text-gray-500">
                  Kostenlos · Unverbindlich · Ca. 15 Minuten
                </p>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={fadeUp}
                custom={0.12}
                className="space-y-2.5"
              >
                {config.benefits.map((benefit, i) => (
                  <motion.div
                    key={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    custom={i * 0.05}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 hover:border-gray-200 dark:hover:border-gray-600 transition-colors duration-200"
                  >
                    <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                    <span className="text-[13px] text-gray-700 dark:text-gray-300 font-medium leading-snug">{benefit}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── WORKFLOW ── */}
        <section className="py-24 bg-white dark:bg-gray-950" aria-labelledby="workflow-heading">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
              custom={0}
              className="max-w-2xl mb-16"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-4">
                Ablauf
              </p>
              <h2 id="workflow-heading" className="text-3xl lg:text-[2.1rem] font-bold text-gray-900 dark:text-gray-100 leading-[1.15]">
                {config.workflow.title}
              </h2>
            </motion.div>

            <div className="relative">
              <div className="hidden lg:block absolute top-[28px] left-[calc(16.66%+28px)] right-[calc(16.66%+28px)] h-px border-t border-dashed border-gray-200 dark:border-gray-700" />
              <div className="grid sm:grid-cols-3 gap-8 lg:gap-12">
                {config.workflow.steps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-30px" }}
                    variants={fadeUp}
                    custom={i * 0.1}
                    className="relative"
                  >
                    <div className="relative z-10 w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 flex items-center justify-center mb-5 flex-shrink-0">
                      <span className="text-[13px] font-bold font-mono text-gray-400 dark:text-gray-500">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 mb-2.5 leading-snug">
                      {step.title}
                    </h3>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
                      {step.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── DEMO CTA ── */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900/40 border-y border-gray-100 dark:border-gray-800">
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
              custom={0}
              className="text-center"
            >
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-[1.2] mb-4">
                Passend für Ihren Betrieb?
              </h2>
              <p className="text-[15px] text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8 leading-[1.7]">
                Im kostenlosen Erstgespräch zeigen wir Ihnen, wie die Lösung konkret
                in Ihrer Branche funktioniert – ohne Verpflichtung, ca. 15 Minuten.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-5">
                <Link
                  to="/kontakt"
                  className="inline-flex items-center justify-center gap-2.5 px-7 py-4 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold text-[14px] hover:bg-gray-700 dark:hover:bg-white transition-all duration-200 hover:-translate-y-0.5 shadow-sm"
                >
                  <Phone size={14} />
                  Kostenloses Erstgespräch
                </Link>
                <Link
                  to={config.costLink}
                  className="inline-flex items-center justify-center gap-2.5 px-7 py-4 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-[14px] hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200"
                >
                  {config.costLinkLabel}
                  <ArrowRight size={13} />
                </Link>
              </div>
              <p className="text-[12px] text-gray-400 dark:text-gray-500">
                Kostenlos · Unverbindlich · Keine Vorkenntnisse nötig
              </p>
            </motion.div>
          </div>
        </section>

        {/* ── LOCATIONS ── */}
        <section className="py-16 bg-white dark:bg-gray-950" aria-labelledby="cities-heading">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="mb-8"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-2">
                Verfügbarkeit
              </p>
              <h2 id="cities-heading" className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Verfügbar in ganz Deutschland
              </h2>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1.5">
                Cogniiq betreut Projekte vollständig remote – Schwerpunkt Bayern.
              </p>
            </motion.div>

            <div className="flex flex-wrap gap-2.5 mb-8">
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
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm transition-all duration-200"
                  >
                    <MapPin size={11} className="text-gray-400 flex-shrink-0" />
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-4">
                Weiterführende Seiten
              </p>
              <div className="flex flex-wrap gap-2.5">
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
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 group"
                    >
                      {link.label}
                      <ArrowRight size={11} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-500 transition-colors" />
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900/40" aria-labelledby="faq-heading">
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="mb-10"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-4">
                FAQ
              </p>
              <h2 id="faq-heading" className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Häufige Fragen
              </h2>
            </motion.div>
            <div className="space-y-2">
              {config.faq.map((item, i) => (
                <FAQItem key={i} item={item} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="py-24 bg-white dark:bg-gray-950">
          <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 leading-[1.15] mb-4">
                Nächster Schritt: Kostenlose Beratung
              </h2>
              <p className="text-[15px] text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto leading-[1.7]">
                Im Erstgespräch zeigen wir Ihnen, wie die Lösung konkret in Ihrem
                Betrieb funktioniert – spezifisch, realistisch, ohne Verpflichtung.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 mb-5">
                <Link
                  to="/kontakt"
                  className="inline-flex items-center gap-2.5 px-7 py-4 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold text-[14px] hover:bg-gray-700 dark:hover:bg-white transition-all duration-200 hover:-translate-y-0.5 shadow-sm"
                >
                  Kostenloses Erstgespräch
                  <ArrowRight size={14} />
                </Link>
                <Link
                  to={config.costLink}
                  className="inline-flex items-center gap-2.5 px-7 py-4 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-[14px] hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200"
                >
                  {config.costLinkLabel}
                </Link>
              </div>
              <p className="text-[12px] text-gray-400 dark:text-gray-500">
                {BUSINESS_INFO.name} · {BUSINESS_INFO.contact.email} · {BUSINESS_INFO.contact.phoneDisplay}
              </p>
            </motion.div>
          </div>
        </section>

      </main>
    </>
  );
}
