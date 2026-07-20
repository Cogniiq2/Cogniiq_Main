import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight, TriangleAlert as AlertTriangle, TrendingDown, CircleCheck as CheckCircle2 } from "lucide-react";
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

export interface ProblemPageConfig {
  seo: {
    title: string;
    description: string;
    canonical: string;
  };
  h1: string;
  tagline: string;
  intro: string;
  problem: {
    headline: string;
    points: string[];
  };
  costs: {
    headline: string;
    points: Array<{ title: string; description: string }>;
  };
  solution: {
    headline: string;
    text: string;
    bullets: string[];
  };
  serviceLinks: Array<{ label: string; href: string }>;
}

interface Props {
  config: ProblemPageConfig;
}

export function ProblemPage({ config }: Props) {
  const breadcrumbs = [
    { name: "Home", url: BUSINESS_INFO.website },
    { name: config.h1, url: config.seo.canonical },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: config.h1,
    description: config.seo.description,
    url: config.seo.canonical,
    author: {
      "@type": "Organization",
      name: BUSINESS_INFO.name,
      url: BUSINESS_INFO.website,
    },
  };

  return (
    <>
      <PageSEO
        title={config.seo.title}
        description={config.seo.description}
        canonical={config.seo.canonical}
        breadcrumbs={breadcrumbs}
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
                <AlertTriangle size={12} />
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
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-20 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300" aria-labelledby="problem-heading">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="mb-12"
            >
              <h2 id="problem-heading" className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {config.problem.headline}
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-4">
              {config.problem.points.map((point, i) => (
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i * 0.07}
                  className="flex items-start gap-3 p-5 rounded-xl bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700"
                >
                  <AlertTriangle size={15} className="flex-shrink-0 mt-0.5 text-gray-400 dark:text-gray-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{point}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-white dark:bg-gray-950 transition-colors duration-300" aria-labelledby="costs-heading">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="mb-12"
            >
              <h2 id="costs-heading" className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {config.costs.headline}
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {config.costs.points.map((item, i) => (
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i * 0.08}
                  className="flex gap-4 p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700"
                >
                  <TrendingDown size={18} className="flex-shrink-0 mt-0.5 text-gray-400 dark:text-gray-500" />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.description}</p>
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
                  Problem jetzt lösen
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
                {config.solution.bullets.map((bullet, i) => (
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
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{bullet}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 transition-colors duration-300">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="mb-8"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Passende Lösungen
              </p>
            </motion.div>
            <div className="flex flex-wrap gap-3">
              {config.serviceLinks.map((link, i) => (
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
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                  >
                    {link.label}
                    <ArrowRight size={12} />
                  </Link>
                </motion.div>
              ))}
            </div>
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
                Dieses Problem lösen wir gemeinsam.
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
                Im kostenlosen Erstgespräch analysieren wir Ihre konkrete Situation und zeigen Ihnen, welche Lösung den schnellsten ROI liefert.
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
                  to="/leistungen"
                  className="inline-flex items-center gap-2 px-7 py-3.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:border-gray-500 dark:hover:border-gray-400 transition-colors"
                >
                  Alle Leistungen
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
