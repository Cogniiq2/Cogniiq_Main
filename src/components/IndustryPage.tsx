import { motion } from "framer-motion";
import { CircleCheck as CheckCircle2, ArrowRight, MapPin, ChevronRight, Phone, Globe, Zap, CircleAlert as AlertCircle, Lightbulb, Package, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
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

export interface IndustryServiceBlock {
  icon: "web" | "phone" | "zap";
  title: string;
  description: string;
}

export interface IndustryUseCase {
  title: string;
  description: string;
}

export interface IndustryFAQ {
  question: string;
  answer: string;
}

export interface IndustryPaket {
  name: string;
  tagline: string;
  deliverables: string[];
}

export interface IndustrySolutionStep {
  step: string;
  title: string;
  description: string;
}

export interface IndustryWorkflow {
  title: string;
  trigger: string;
  process: string;
  result: string;
}

export interface IndustryPageConfig {
  route: string;
  industry: string;
  industrySlug: string;
  city: string;
  citySlug: string;
  cityHub: string;
  seo: {
    title: string;
    description: string;
    canonical: string;
    keywords: string;
  };
  hero: {
    trustTags: string[];
    ctaLabel: string;
  };
  intro: {
    h1: string;
    lead: string;
  };
  engpaesse: string[];
  solutionSteps: IndustrySolutionStep[];
  workflow: IndustryWorkflow;
  pakete: IndustryPaket[];
  problems: string[];
  services: IndustryServiceBlock[];
  useCases: IndustryUseCase[];
  benefits: string[];
  localContext: string[];
  internalLinks: Array<{ label: string; href: string }>;
  faq: IndustryFAQ[];
}

interface IndustryPageProps {
  config: IndustryPageConfig;
}

export function IndustryPage({ config }: IndustryPageProps) {
  const breadcrumbs = [
    { name: "Home", url: BUSINESS_INFO.website },
    { name: "Bayern", url: `${BUSINESS_INFO.website}/bayern` },
    { name: config.city, url: `${BUSINESS_INFO.website}${config.cityHub}` },
    { name: config.industry, url: `${BUSINESS_INFO.website}${config.route}` },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": `${BUSINESS_INFO.website}/#localbusiness`,
        name: BUSINESS_INFO.name,
        url: BUSINESS_INFO.website,
        telephone: BUSINESS_INFO.contact.phone,
        email: BUSINESS_INFO.contact.email,
        address: {
          "@type": "PostalAddress",
          streetAddress: BUSINESS_INFO.address.streetAddress,
          addressLocality: BUSINESS_INFO.address.addressLocality,
          addressRegion: BUSINESS_INFO.address.addressRegion,
          postalCode: BUSINESS_INFO.address.postalCode,
          addressCountry: BUSINESS_INFO.address.addressCountry,
        },
        areaServed: [
          { "@type": "City", name: config.city },
          { "@type": "State", name: "Bayern" },
          { "@type": "Country", name: "Deutschland" },
        ],
      },
      {
        "@type": "Service",
        name: `Webdesign & KI-Telefonassistent für ${config.industry} in ${config.city}`,
        description: config.seo.description,
        url: config.seo.canonical,
        provider: { "@id": `${BUSINESS_INFO.website}/#localbusiness` },
        areaServed: { "@type": "City", name: config.city },
        keywords: config.seo.keywords,
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
        <HeroSection config={config} breadcrumbs={breadcrumbs} />
        <TrustStripSection config={config} />
        <EngpaesseSection config={config} />
        <SolutionSection config={config} />
        <WorkflowSection config={config} />
        <PaketeSection config={config} />
        <ServicesSection config={config} />
        <UseCasesSection config={config} />
        <BenefitsSection config={config} />
        <LocalContextSection config={config} />
        <InternalLinksSection config={config} />
        <FAQSection config={config} />
        <CTASection config={config} />
      </main>
    </>
  );
}

function HeroSection({
  config,
  breadcrumbs,
}: {
  config: IndustryPageConfig;
  breadcrumbs: Array<{ name: string; url: string }>;
}) {
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
                  <Link
                    to={crumb.url.replace(BUSINESS_INFO.website, "") || "/"}
                    className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
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

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.1}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium tracking-wide uppercase mb-6">
            <MapPin size={12} />
            {config.hero.trustTags.join(" · ")}
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 leading-tight tracking-tight mb-6">
            {config.intro.h1}
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-3xl mb-8">
            {config.intro.lead}
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              to="/kontakt"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-700 dark:hover:bg-white transition-colors"
            >
              {config.hero.ctaLabel}
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/leistungen"
              className="inline-flex items-center gap-2 px-6 py-3.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm hover:border-gray-500 dark:hover:border-gray-400 transition-colors"
            >
              Alle Leistungen
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function TrustStripSection({ config }: { config: IndustryPageConfig }) {
  const items = [
    config.city,
    config.industry,
    "DSGVO-konform",
    "KI-Integration",
    "Automatisierung",
    "7–14 Tage Setup",
  ];

  return (
    <div className="border-y border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
          {items.map((item, i) => (
            <span
              key={i}
              className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2"
            >
              {i > 0 && (
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" aria-hidden="true" />
              )}
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function EngpaesseSection({ config }: { config: IndustryPageConfig }) {
  return (
    <section
      className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300"
      aria-labelledby="engpaesse-heading"
    >
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="mb-12"
        >
          <h2
            id="engpaesse-heading"
            className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2"
          >
            Was {config.industry}-Betriebe in {config.city} täglich kostet
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Operative Realität – keine Theorie. Das sind die häufigsten Blockaden.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-4">
          {config.engpaesse.map((item, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i * 0.06}
              className="flex items-start gap-3 p-5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50"
            >
              <AlertCircle
                size={16}
                className="flex-shrink-0 mt-0.5 text-gray-400 dark:text-gray-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SolutionSection({ config }: { config: IndustryPageConfig }) {
  return (
    <section
      className="py-20 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300"
      aria-labelledby="solution-heading"
    >
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="mb-12"
        >
          <h2
            id="solution-heading"
            className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2"
          >
            Vom Problem zum laufenden System
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Wie ein {config.industry}-Projekt mit Cogniiq in {config.city} konkret abläuft – Schritt für Schritt.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {config.solutionSteps.map((step, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i * 0.1}
              className="relative bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl p-6"
            >
              <div className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                {step.step}
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">
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

function WorkflowSection({ config }: { config: IndustryPageConfig }) {
  return (
    <section
      className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300"
      aria-labelledby="workflow-heading"
    >
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="mb-10"
        >
          <h2
            id="workflow-heading"
            className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2"
          >
            Beispiel-Workflow
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Anonymisiertes Praxisbeispiel aus dem Bereich {config.industry} – so läuft ein typisches Projekt ab.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0.1}
          className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">Ausgangslage</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{config.workflow.trigger}</p>
          </div>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">Vorgehen</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{config.workflow.process}</p>
          </div>
          <div className="p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">Ergebnis</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{config.workflow.result}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function PaketeSection({ config }: { config: IndustryPageConfig }) {
  return (
    <section
      className="py-20 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300"
      aria-labelledby="pakete-heading"
    >
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="mb-12"
        >
          <h2
            id="pakete-heading"
            className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2"
          >
            Was wir für {config.industry} bauen
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Konkrete Leistungspakete – skalierbar nach Betriebsgröße und Zielsetzung.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {config.pakete.map((paket, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i * 0.1}
              className="bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 flex flex-col gap-5"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Package size={14} className="text-gray-400 dark:text-gray-500" />
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    {paket.name}
                  </span>
                </div>
                <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  {paket.tagline}
                </p>
              </div>
              <ul className="space-y-2.5">
                {paket.deliverables.map((item, j) => (
                  <li key={j} className="flex items-start gap-2.5">
                    <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5 text-[#515A61] dark:text-sky-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/kontakt"
                className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                Jetzt anfragen <ArrowUpRight size={13} />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const ICON_MAP = {
  web: Globe,
  phone: Phone,
  zap: Zap,
};

function ServicesSection({ config }: { config: IndustryPageConfig }) {
  return (
    <section
      className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300"
      aria-labelledby="services-heading"
    >
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="mb-12"
        >
          <h2
            id="services-heading"
            className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2"
          >
            Drei Systeme, die für Sie arbeiten
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Webdesign, KI-Telefonassistent und Automatisierung – auf {config.industry} in {config.city} zugeschnitten.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {config.services.map((service, i) => {
            const Icon = ICON_MAP[service.icon];
            return (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i * 0.1}
                className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 flex flex-col gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {service.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function UseCasesSection({ config }: { config: IndustryPageConfig }) {
  return (
    <section
      className="py-20 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300"
      aria-labelledby="usecases-heading"
    >
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="mb-12"
        >
          <h2
            id="usecases-heading"
            className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2"
          >
            Wie das in der Praxis aussieht
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Reale Ausgangssituationen aus dem {config.industry}-Bereich – anonymisiert, konkret.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {config.useCases.map((useCase, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i * 0.08}
              className="flex gap-4 p-6 rounded-2xl bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50"
            >
              <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center">
                <Lightbulb size={15} className="text-gray-400 dark:text-gray-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {useCase.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {useCase.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BenefitsSection({ config }: { config: IndustryPageConfig }) {
  return (
    <section
      className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300"
      aria-labelledby="benefits-heading"
    >
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
        >
          <h2
            id="benefits-heading"
            className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2"
          >
            Was sich konkret verändert
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-10">
            Messbare Unterschiede für {config.industry}-Betriebe – nach dem ersten Live-System.
          </p>
        </motion.div>

        <ul className="space-y-4">
          {config.benefits.map((benefit, i) => (
            <motion.li
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i * 0.07}
              className="flex items-start gap-3 p-5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50"
            >
              <CheckCircle2
                size={18}
                className="flex-shrink-0 mt-0.5 text-[#515A61] dark:text-sky-400"
              />
              <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function LocalContextSection({ config }: { config: IndustryPageConfig }) {
  return (
    <section
      className="py-20 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300"
      aria-labelledby="local-heading"
    >
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
        >
          <h2
            id="local-heading"
            className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8"
          >
            Cogniiq – Ihr Partner für {config.industry} in {config.city}
          </h2>
          <div className="space-y-5">
            {config.localContext.map((para, i) => (
              <p key={i} className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {para}
              </p>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const PROBLEM_LINKS = [
  { label: "Verpasste Anrufe & Umsatzverlust", href: "/verpasste-anrufe-verlust" },
  { label: "Keine Anfragen über die Website", href: "/keine-anfragen-website" },
  { label: "Zu viel manuelle Arbeit", href: "/zu-viel-manuelle-arbeit" },
  { label: "Keine automatische Terminbuchung", href: "/keine-terminbuchung" },
];

function InternalLinksSection({ config }: { config: IndustryPageConfig }) {
  return (
    <section className="py-14 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">
              Verwandte Seiten
            </p>
            <div className="flex flex-wrap gap-2">
              {config.internalLinks.map((link, i) => (
                <Link
                  key={i}
                  to={link.href}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                >
                  {link.label}
                  <ArrowRight size={11} className="text-gray-400" />
                </Link>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0.1}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">
              Häufige Probleme – direkt adressiert
            </p>
            <ul className="space-y-2">
              {PROBLEM_LINKS.map((link, i) => (
                <li key={i}>
                  <Link
                    to={link.href}
                    className="group inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                  >
                    <ArrowRight size={13} className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function FAQSection({ config }: { config: IndustryPageConfig }) {
  return (
    <section
      className="py-20 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300"
      aria-labelledby="faq-heading"
    >
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
            Häufige Fragen – {config.industry} in {config.city}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Webdesign, KI-Telefonassistent und Automatisierung für {config.industry} in {config.city} – konkret beantwortet.
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
                className="bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl px-5 data-[state=open]:border-gray-300 dark:data-[state=open]:border-gray-600 transition-colors"
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

function CTASection({ config }: { config: IndustryPageConfig }) {
  return (
    <section className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Nächster Schritt: {config.industry} in {config.city} digital aufstellen
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
            Kostenloses Erstgespräch für {config.industry}-Betriebe in {config.city} – 30 bis 45 Minuten, ohne Verpflichtung, mit konkretem Ergebnis.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/kontakt"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold hover:bg-gray-700 dark:hover:bg-white transition-colors"
            >
              {config.hero.ctaLabel}
              <ArrowRight size={16} />
            </Link>
            <Link
              to={config.cityHub}
              className="inline-flex items-center gap-2 px-7 py-3.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:border-gray-500 dark:hover:border-gray-400 transition-colors"
            >
              Cogniiq {config.city}
            </Link>
          </div>
          <p className="mt-6 text-xs text-gray-400 dark:text-gray-500">
            {BUSINESS_INFO.name} · {BUSINESS_INFO.address.addressLocality} ·{" "}
            {BUSINESS_INFO.contact.email}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
