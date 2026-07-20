import { motion } from "framer-motion";
import {
  CheckCircle2,
  ArrowRight,
  MapPin,
  ChevronRight,
  AlertCircle,
  ArrowUpRight,
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
import {
  TestimonialBlock,
  REAL_TESTIMONIAL,
} from "@/components/TestimonialBlock";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

export interface ClusterFAQ {
  question: string;
  answer: string;
}

export interface ClusterPricingTier {
  name: string;
  anchor: string;
  range: string;
  deliverables: string[];
}

export interface ClusterPageConfig {
  route: string;
  city: string;
  citySlug: string;
  cityHub: string;
  topic: string;
  seo: {
    title: string;
    description: string;
    canonical: string;
    keywords: string;
  };
  hero: {
    h1: string;
    lead: string;
    trustTags: string[];
    ctaLabel: string;
  };
  tldr: {
    heading: string;
    items: Array<{ label: string; value: string }>;
  };
  intro: {
    heading: string;
    paragraphs: string[];
  };
  painPoints?: string[];
  pricing?: {
    heading: string;
    rangeText: string;
    tiers: ClusterPricingTier[];
  };
  deliverables?: {
    heading: string;
    items: string[];
  };
  comparison?: {
    heading: string;
    rows: Array<{ criterion: string; pro: string; con: string }>;
  };
  localRelevance: {
    heading: string;
    paragraphs: string[];
  };
  faq: ClusterFAQ[];
  internalLinks: Array<{ label: string; href: string }>;
}

interface ClusterPageProps {
  config: ClusterPageConfig;
}

export function ClusterPage({ config }: ClusterPageProps) {
  const breadcrumbs = [
    { name: "Home", url: BUSINESS_INFO.website },
    { name: "Bayern", url: `${BUSINESS_INFO.website}/bayern` },
    { name: config.city, url: `${BUSINESS_INFO.website}${config.cityHub}` },
    { name: "Webdesign", url: `${BUSINESS_INFO.website}${config.cityHub}/webdesign` },
    { name: config.topic, url: `${BUSINESS_INFO.website}${config.route}` },
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: config.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

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
        name: `${config.topic} in ${config.city}`,
        description: config.seo.description,
        url: config.seo.canonical,
        provider: { "@id": `${BUSINESS_INFO.website}/#localbusiness` },
        areaServed: { "@type": "City", name: config.city },
        keywords: config.seo.keywords,
      },
      faqSchema,
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
        <TLDRSection config={config} />
        <IntroSection config={config} />
        {config.painPoints && <PainPointsSection config={config} />}
        {config.pricing && <PricingSection config={config} />}
        {config.deliverables && <DeliverablesSection config={config} />}
        {config.comparison && <ComparisonSection config={config} />}
        <LocalRelevanceSection config={config} />
        <TestimonialBlock
          testimonials={[REAL_TESTIMONIAL]}
          heading="Aus der Praxis"
          subheading="Reale Projektumsetzung – Systeme im Livebetrieb."
          compact
        />
        <FAQSection config={config} />
        <InternalLinksSection config={config} />
        <CTASection config={config} />
      </main>
    </>
  );
}

function HeroSection({
  config,
  breadcrumbs,
}: {
  config: ClusterPageConfig;
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
            {config.hero.h1}
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-3xl mb-8">
            {config.hero.lead}
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
              to={`${config.cityHub}/webdesign`}
              className="inline-flex items-center gap-2 px-6 py-3.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm hover:border-gray-500 dark:hover:border-gray-400 transition-colors"
            >
              Webdesign {config.city}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function TLDRSection({ config }: { config: ClusterPageConfig }) {
  return (
    <div className="border-y border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-8">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-5">
          {config.tldr.heading}
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {config.tldr.items.map((item, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i * 0.06}
              className="flex flex-col gap-1"
            >
              <span className="text-xs text-gray-400 dark:text-gray-500">{item.label}</span>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{item.value}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function IntroSection({ config }: { config: ClusterPageConfig }) {
  return (
    <section className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
            {config.intro.heading}
          </h2>
          <div className="space-y-5">
            {config.intro.paragraphs.map((para, i) => (
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

function PainPointsSection({ config }: { config: ClusterPageConfig }) {
  if (!config.painPoints) return null;
  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="mb-10"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Typische Ausgangssituationen
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Was Unternehmen in {config.city} bewegt – konkret, nicht theoretisch.
          </p>
        </motion.div>
        <div className="grid md:grid-cols-2 gap-4">
          {config.painPoints.map((item, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i * 0.06}
              className="flex items-start gap-3 p-5 rounded-xl bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50"
            >
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-gray-400 dark:text-gray-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection({ config }: { config: ClusterPageConfig }) {
  if (!config.pricing) return null;
  return (
    <section className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="mb-4"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            {config.pricing.heading}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
            {config.pricing.rangeText}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mt-10">
          {config.pricing.tiers.map((tier, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i * 0.1}
              className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 flex flex-col gap-5"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">
                  {tier.name}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{tier.anchor}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{tier.range}</p>
              </div>
              <ul className="space-y-2.5 flex-1">
                {tier.deliverables.map((item, j) => (
                  <li key={j} className="flex items-start gap-2.5">
                    <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5 text-[#515A61] dark:text-sky-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/kontakt"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                Jetzt anfragen <ArrowUpRight size={13} />
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0.3}
          className="mt-6 text-xs text-gray-400 dark:text-gray-500"
        >
          Alle Preisangaben sind Richtwerte. Das individuelle Angebot hängt von Umfang, Zielgruppe und spezifischen Anforderungen ab. Kostenloses Erstgespräch für eine konkrete Einschätzung.
        </motion.p>
      </div>
    </section>
  );
}

function DeliverablesSection({ config }: { config: ClusterPageConfig }) {
  if (!config.deliverables) return null;
  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="mb-10"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {config.deliverables.heading}
          </h2>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {config.deliverables.items.map((item, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i * 0.05}
              className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50"
            >
              <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5 text-[#515A61] dark:text-sky-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ComparisonSection({ config }: { config: ClusterPageConfig }) {
  if (!config.comparison) return null;
  return (
    <section className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="mb-10"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {config.comparison.heading}
          </h2>
        </motion.div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0.1}
          className="overflow-x-auto"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 pr-6 font-semibold text-gray-500 dark:text-gray-400 w-1/3">Kriterium</th>
                <th className="text-left py-3 pr-6 font-semibold text-gray-900 dark:text-gray-100 w-1/3">Professionell</th>
                <th className="text-left py-3 font-semibold text-gray-500 dark:text-gray-400 w-1/3">Baukasten</th>
              </tr>
            </thead>
            <tbody>
              {config.comparison.rows.map((row, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-800/50 last:border-0">
                  <td className="py-3.5 pr-6 text-gray-600 dark:text-gray-400">{row.criterion}</td>
                  <td className="py-3.5 pr-6 text-gray-900 dark:text-gray-100 font-medium">{row.pro}</td>
                  <td className="py-3.5 text-gray-400 dark:text-gray-500">{row.con}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  );
}

function LocalRelevanceSection({ config }: { config: ClusterPageConfig }) {
  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
            {config.localRelevance.heading}
          </h2>
          <div className="space-y-5">
            {config.localRelevance.paragraphs.map((para, i) => (
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

function FAQSection({ config }: { config: ClusterPageConfig }) {
  return (
    <section className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="mb-10"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Häufige Fragen
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            {config.topic} in {config.city} – konkret beantwortet.
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

function InternalLinksSection({ config }: { config: ClusterPageConfig }) {
  return (
    <section className="py-10 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="mb-5"
        >
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            Weiterführende Seiten
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

function CTASection({ config }: { config: ClusterPageConfig }) {
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
            Kostenloses Erstgespräch für Unternehmen in {config.city}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
            30–45 Minuten, ohne Verpflichtung. Wir analysieren Ihre Situation und geben eine konkrete Einschätzung zu {config.topic} in {config.city}.
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
              to={`${config.cityHub}/webdesign`}
              className="inline-flex items-center gap-2 px-7 py-3.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:border-gray-500 dark:hover:border-gray-400 transition-colors"
            >
              Webdesign {config.city}
            </Link>
          </div>
          <p className="mt-6 text-xs text-gray-400 dark:text-gray-500">
            {BUSINESS_INFO.name} · {BUSINESS_INFO.address.addressLocality} · {BUSINESS_INFO.contact.email}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
