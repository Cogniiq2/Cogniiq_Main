import { motion } from "framer-motion";
import {
  CheckCircle2,
  ArrowRight,
  MapPin,
  ChevronRight,
  Phone,
  Globe,
  Zap,
  AlertCircle,
  Lightbulb,
} from "lucide-react";
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

export interface IndustryPageConfig {
  route: string;
  industry: string;
  industrySlug: string;
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
    { name: "Bayreuth", url: `${BUSINESS_INFO.website}/bayreuth` },
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
          addressLocality: BUSINESS_INFO.address.addressLocality,
          addressRegion: BUSINESS_INFO.address.addressRegion,
          postalCode: BUSINESS_INFO.address.postalCode,
          addressCountry: BUSINESS_INFO.address.addressCountry,
        },
        areaServed: [
          { "@type": "City", name: "Bayreuth" },
          { "@type": "State", name: "Bayern" },
        ],
      },
      {
        "@type": "Service",
        name: `Webdesign & KI-Telefonassistent für ${config.industry} in Bayreuth`,
        description: config.seo.description,
        url: config.seo.canonical,
        provider: { "@id": `${BUSINESS_INFO.website}/#localbusiness` },
        areaServed: { "@type": "City", name: "Bayreuth" },
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
        <ProblemsSection config={config} />
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
    "Bayreuth",
    config.industry,
    "DSGVO-konform",
    "KI-Integration",
    "Terminprozesse",
    "Automatisierung",
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

function ProblemsSection({ config }: { config: IndustryPageConfig }) {
  return (
    <section
      className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300"
      aria-labelledby="problems-heading"
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
            id="problems-heading"
            className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2"
          >
            Herausforderungen für {config.industry} in Bayreuth
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Was lokale Betriebe täglich bremst – und wie digitale Lösungen das ändern.
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
              custom={i * 0.06}
              className="flex items-start gap-3 p-5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50"
            >
              <AlertCircle
                size={16}
                className="flex-shrink-0 mt-0.5 text-gray-400 dark:text-gray-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{problem}</span>
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
      className="py-20 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300"
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
            Digitale Lösungen für {config.industry} in Bayreuth
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Webdesign, KI-Telefonassistent und Automatisierung – branchenspezifisch eingesetzt.
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
                className="bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 flex flex-col gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
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
      className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300"
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
            Einsatzbeispiele in Bayreuth
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Konkrete Situationen, in denen die Lösung für {config.industry} in Bayreuth greift.
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
              className="flex gap-4 p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50"
            >
              <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center">
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
      className="py-20 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300"
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
            Vorteile für {config.industry} in Bayreuth
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-10">
            Was sich für Betriebe in Bayreuth konkret verändert – messbar und dauerhaft.
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
              className="flex items-start gap-3 p-5 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50"
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
      className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300"
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
            Cogniiq – Ihr Partner für {config.industry} in Bayreuth
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

function InternalLinksSection({ config }: { config: IndustryPageConfig }) {
  return (
    <section className="py-10 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="mb-6"
        >
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            Leistungen für {config.industry} in Bayreuth
          </h2>
        </motion.div>

        <div className="flex flex-wrap gap-3">
          {config.internalLinks.map((link, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i * 0.06}
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
    </section>
  );
}

function FAQSection({ config }: { config: IndustryPageConfig }) {
  return (
    <section
      className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300"
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
            Häufige Fragen
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Webdesign, KI-Telefonassistent und Automatisierung für {config.industry} in Bayreuth –
            konkret beantwortet.
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

function CTASection({ config }: { config: IndustryPageConfig }) {
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
            Digitalisierung für {config.industry} in Bayreuth starten
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
            Kostenloses Erstgespräch für {config.industry}-Betriebe in Bayreuth – 30 bis 45 Minuten,
            ohne Verpflichtung. Danach wissen Sie genau, was möglich ist und was es kostet.
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
              to="/bayreuth"
              className="inline-flex items-center gap-2 px-7 py-3.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:border-gray-500 dark:hover:border-gray-400 transition-colors"
            >
              Cogniiq Bayreuth
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
