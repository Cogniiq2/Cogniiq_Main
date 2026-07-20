import { useParams, Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Clock, Calendar, ChevronRight, ArrowLeft, Lightbulb, TriangleAlert as AlertTriangle, Info } from "lucide-react";
import { PageSEO } from "@/components/PageSEO";
import {
  getArticleBySlug,
  getRelatedArticles,
  formatDate,
  type BlogSection,
} from "@/lib/blog-data";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const CATEGORY_COLORS: Record<string, string> = {
  "KI-Automatisierung": "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
  "Webdesign": "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
  "KI-Telefonassistent": "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
  "Digitalisierung": "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
  "Local SEO": "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800",
};

function SectionBlock({ section }: { section: BlogSection }) {
  switch (section.type) {
    case "h2":
      return (
        <div className="mt-10 mb-4">
          {section.heading && (
            <h2 className="text-[1.45rem] sm:text-[1.6rem] font-bold text-gray-900 dark:text-gray-50 leading-[1.25] tracking-[-0.016em]">
              {section.heading}
            </h2>
          )}
          {section.content && (
            <p className="mt-3 text-[15px] text-gray-600 dark:text-gray-300 leading-[1.82]">
              {section.content}
            </p>
          )}
        </div>
      );

    case "h3":
      return (
        <div className="mt-7 mb-3">
          {section.heading && (
            <h3 className="text-[1.1rem] font-semibold text-gray-900 dark:text-gray-100 leading-snug">
              {section.heading}
            </h3>
          )}
          {section.content && (
            <p className="mt-2 text-[15px] text-gray-600 dark:text-gray-300 leading-[1.82]">
              {section.content}
            </p>
          )}
        </div>
      );

    case "p":
      return (
        <p className="text-[15px] text-gray-600 dark:text-gray-300 leading-[1.82] my-5">
          {section.content}
        </p>
      );

    case "ul":
      return (
        <div className="my-6">
          {section.heading && (
            <h3 className="text-[1.05rem] font-semibold text-gray-900 dark:text-gray-100 mb-3">
              {section.heading}
            </h3>
          )}
          <ul className="space-y-2.5">
            {section.items?.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-[7px] flex-shrink-0 w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500" />
                <span className="text-[14.5px] text-gray-600 dark:text-gray-300 leading-relaxed">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      );

    case "ol":
      return (
        <div className="my-6">
          {section.heading && (
            <h3 className="text-[1.05rem] font-semibold text-gray-900 dark:text-gray-100 mb-3">
              {section.heading}
            </h3>
          )}
          <ol className="space-y-2.5">
            {section.items?.map((item, i) => (
              <li key={i} className="flex items-start gap-3.5">
                <span className="flex-shrink-0 w-5 h-5 mt-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-[10px] font-bold text-gray-500 dark:text-gray-400 flex items-center justify-center tabular-nums">
                  {i + 1}
                </span>
                <span className="text-[14.5px] text-gray-600 dark:text-gray-300 leading-relaxed">
                  {item}
                </span>
              </li>
            ))}
          </ol>
        </div>
      );

    case "callout": {
      const styles = {
        tip: {
          wrapper: "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800",
          icon: <Lightbulb size={15} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />,
          label: "text-emerald-700 dark:text-emerald-400",
          text: "text-emerald-800 dark:text-emerald-300",
          badge: "Tipp",
        },
        warning: {
          wrapper: "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800",
          icon: <AlertTriangle size={15} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />,
          label: "text-amber-700 dark:text-amber-400",
          text: "text-amber-800 dark:text-amber-300",
          badge: "Achtung",
        },
        info: {
          wrapper: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
          icon: <Info size={15} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />,
          label: "text-blue-700 dark:text-blue-400",
          text: "text-blue-800 dark:text-blue-300",
          badge: "Info",
        },
      };
      const s = styles[section.calloutType ?? "tip"];
      return (
        <div className={`my-7 rounded-xl border px-5 py-4 flex gap-3.5 ${s.wrapper}`}>
          {s.icon}
          <div>
            <p className={`text-[11px] font-bold uppercase tracking-[0.16em] mb-1.5 ${s.label}`}>
              {s.badge}
            </p>
            <p className={`text-[13.5px] leading-relaxed ${s.text}`}>{section.content}</p>
          </div>
        </div>
      );
    }

    case "table":
      return (
        <div className="my-7 overflow-x-auto">
          {section.heading && (
            <h3 className="text-[1.05rem] font-semibold text-gray-900 dark:text-gray-100 mb-3">
              {section.heading}
            </h3>
          )}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-[13px]">
              <tbody>
                {section.rows?.map((row, i) => (
                  <tr
                    key={i}
                    className={`border-b border-gray-100 dark:border-gray-800 last:border-0 ${
                      i % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/60 dark:bg-gray-800/40"
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300 w-[45%] align-top">
                      {row.label}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 align-top">
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

    default:
      return null;
  }
}

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getArticleBySlug(slug) : undefined;

  if (!article) return <Navigate to="/blog" replace />;

  const related = getRelatedArticles(article.relatedSlugs);

  const articleSchema = {
    "@type": "Article",
    headline: article.title,
    description: article.metaDescription,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: {
      "@type": "Organization",
      name: "Cogniiq",
      url: "https://cogniiq.de",
    },
    publisher: {
      "@type": "Organization",
      name: "Cogniiq",
      url: "https://cogniiq.de",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": article.canonical,
    },
  };

  return (
    <>
      <PageSEO
        title={article.metaTitle}
        description={article.metaDescription}
        canonical={article.canonical}
        breadcrumbs={[
          { name: "Start", url: "https://cogniiq.de" },
          { name: "Blog", url: "https://cogniiq.de/blog" },
          { name: article.title, url: article.canonical },
        ]}
        faqItems={article.faqItems}
        additionalSchema={articleSchema}
      />

      <div className="min-h-screen bg-white dark:bg-gray-950">
        <section className="relative pt-28 pb-16 px-6 lg:px-8 border-b border-gray-100 dark:border-gray-800 overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(15,23,42,0.04) 0%, transparent 70%)",
            }}
          />
          <div className="relative max-w-3xl mx-auto">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={0}
              className="flex items-center gap-2 mb-7"
            >
              <Link to="/" className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors">
                Start
              </Link>
              <ChevronRight size={10} className="text-gray-300" />
              <Link to="/blog" className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors">
                Blog
              </Link>
              <ChevronRight size={10} className="text-gray-300" />
              <span className="text-[11px] text-gray-700 dark:text-gray-300 font-medium truncate max-w-[200px]">
                {article.title}
              </span>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={0.04}
              className="flex items-center gap-2 mb-5"
            >
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10.5px] font-semibold border ${
                  CATEGORY_COLORS[article.category] ?? "bg-gray-100 text-gray-600 border-gray-200"
                }`}
              >
                {article.category}
              </span>
            </motion.div>

            <motion.h1
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={0.08}
              className="text-3xl sm:text-4xl lg:text-[2.6rem] font-bold text-gray-900 dark:text-gray-50 leading-[1.15] tracking-[-0.022em] mb-6"
            >
              {article.title}
            </motion.h1>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={0.12}
              className="flex flex-wrap items-center gap-4 text-[12px] text-gray-400"
            >
              <span className="flex items-center gap-1.5">
                <Clock size={11} />
                {article.readingTime} Min. Lesezeit
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={11} />
                {formatDate(article.publishedAt)}
              </span>
              {article.updatedAt !== article.publishedAt && (
                <span className="text-gray-300 dark:text-gray-600 text-[11px]">
                  Aktualisiert: {formatDate(article.updatedAt)}
                </span>
              )}
            </motion.div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid lg:grid-cols-[1fr_280px] gap-12 lg:gap-16 items-start">
            <article className="max-w-3xl">
              <motion.p
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={0}
                className="text-[16px] font-medium text-gray-700 dark:text-gray-200 leading-[1.75] mb-8 border-l-2 border-gray-200 dark:border-gray-700 pl-5"
              >
                {article.excerpt}
              </motion.p>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={0.06}
              >
                {article.sections.map((section, i) => (
                  <SectionBlock key={i} section={section} />
                ))}
              </motion.div>

              {article.faqItems && article.faqItems.length > 0 && (
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-40px" }}
                  variants={fadeUp}
                  custom={0}
                  className="mt-12 pt-10 border-t border-gray-100 dark:border-gray-800"
                >
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-6">
                    Häufig gestellte Fragen
                  </h2>
                  <div className="space-y-5">
                    {article.faqItems.map((faq, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40 p-6"
                      >
                        <h3 className="text-[14.5px] font-semibold text-gray-900 dark:text-gray-100 mb-2.5">
                          {faq.question}
                        </h3>
                        <p className="text-[13.5px] text-gray-600 dark:text-gray-300 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeUp}
                custom={0}
                className="mt-12 pt-10 border-t border-gray-100 dark:border-gray-800"
              >
                <div className="flex items-center justify-between">
                  <Link
                    to="/blog"
                    className="inline-flex items-center gap-2 text-[13px] text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    <ArrowLeft size={13} />
                    Alle Artikel
                  </Link>
                  <Link
                    to="/kontakt"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900 text-[13px] font-semibold hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors"
                  >
                    Gespräch vereinbaren
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </motion.div>
            </article>

            <aside className="hidden lg:block">
              <div className="sticky top-28 space-y-6">
                <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40 p-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400 mb-4">
                    Kostenlos
                  </p>
                  <h3 className="text-[15px] font-bold text-gray-900 dark:text-gray-100 mb-3 leading-snug">
                    Analysegespräch vereinbaren
                  </h3>
                  <p className="text-[12.5px] text-gray-500 dark:text-gray-400 leading-relaxed mb-5">
                    30 Minuten, in denen wir konkrete Potenziale für Ihr Unternehmen identifizieren.
                  </p>
                  <Link
                    to="/kontakt"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900 text-[13px] font-semibold hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors"
                  >
                    Jetzt anfragen
                    <ArrowRight size={13} />
                  </Link>
                </div>

                {related.length > 0 && (
                  <div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400 mb-4">
                      Weiterhin interessant
                    </p>
                    <div className="space-y-3">
                      {related.map((r) => (
                        <Link
                          key={r.slug}
                          to={`/blog/${r.slug}`}
                          className="group flex items-start gap-3 py-2"
                        >
                          <div className="flex-shrink-0 w-1 h-1 mt-2 rounded-full bg-gray-300 dark:bg-gray-600 group-hover:bg-gray-500 dark:group-hover:bg-gray-400 transition-colors" />
                          <p className="text-[13px] text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white leading-snug transition-colors">
                            {r.title}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>

        {related.length > 0 && (
          <section className="border-t border-gray-100 dark:border-gray-800 py-16 px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={fadeUp}
                custom={0}
                className="mb-8"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400 mb-3">
                  Verwandte Artikel
                </p>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
                  Das könnte Sie auch interessieren
                </h2>
              </motion.div>

              <div className="grid md:grid-cols-3 gap-5">
                {related.map((r, i) => (
                  <motion.div
                    key={r.slug}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-30px" }}
                    variants={fadeUp}
                    custom={i * 0.07}
                  >
                    <Link
                      to={`/blog/${r.slug}`}
                      className="group flex flex-col h-full rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md hover:shadow-gray-100/60 dark:hover:shadow-black/20 transition-all duration-300 overflow-hidden p-6"
                    >
                      <span
                        className={`inline-flex items-center self-start px-2.5 py-1 rounded-full text-[10px] font-semibold border mb-4 ${
                          CATEGORY_COLORS[r.category] ?? "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                      >
                        {r.category}
                      </span>
                      <h3 className="text-[14.5px] font-semibold text-gray-900 dark:text-gray-100 leading-[1.45] mb-2 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors flex-1">
                        {r.title}
                      </h3>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <span className="flex items-center gap-1 text-[11px] text-gray-400">
                          <Clock size={10} />
                          {r.readingTime} Min.
                        </span>
                        <ArrowRight
                          size={13}
                          className="text-gray-300 dark:text-gray-600 group-hover:text-gray-600 dark:group-hover:text-gray-300 group-hover:translate-x-0.5 transition-all duration-200"
                        />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
