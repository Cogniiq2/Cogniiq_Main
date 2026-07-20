import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Clock, BookOpen, ChevronRight } from "lucide-react";
import { PageSEO } from "@/components/PageSEO";
import { BLOG_ARTICLES, BLOG_CATEGORIES, formatDate } from "@/lib/blog-data";

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const CATEGORY_COLORS: Record<string, string> = {
  "KI-Automatisierung": "bg-blue-50 text-blue-700 border-blue-100",
  "Webdesign": "bg-emerald-50 text-emerald-700 border-emerald-100",
  "KI-Telefonassistent": "bg-amber-50 text-amber-700 border-amber-100",
  "Digitalisierung": "bg-gray-100 text-gray-700 border-gray-200",
  "Local SEO": "bg-rose-50 text-rose-700 border-rose-100",
};

export function BlogIndexPage() {
  const [activeCategory, setActiveCategory] = useState<string>("Alle");

  const categories = ["Alle", ...BLOG_CATEGORIES];

  const filtered =
    activeCategory === "Alle"
      ? BLOG_ARTICLES
      : BLOG_ARTICLES.filter((a) => a.category === activeCategory);

  const [featured, ...rest] = filtered;

  return (
    <>
      <PageSEO
        title="Blog | KI, Webdesign & Automatisierung für Unternehmen | Cogniiq"
        description="Praxiswissen zu KI-Automatisierung, Webdesign, KI-Telefonassistenten und Digitalisierung für kleine und mittlere Unternehmen in Deutschland."
        canonical="https://cogniiq.de/blog"
        breadcrumbs={[
          { name: "Start", url: "https://cogniiq.de" },
          { name: "Blog", url: "https://cogniiq.de/blog" },
        ]}
      />

      <div className="min-h-screen bg-white dark:bg-gray-950">
        <section className="relative pt-28 pb-16 px-6 lg:px-8 overflow-hidden border-b border-gray-100 dark:border-gray-800">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(15,23,42,0.04) 0%, transparent 70%)",
            }}
          />
          <div className="relative max-w-7xl mx-auto">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={0}
              className="flex items-center gap-2 mb-6"
            >
              <Link to="/" className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors">
                Start
              </Link>
              <ChevronRight size={10} className="text-gray-300" />
              <span className="text-[11px] text-gray-700 font-medium">Blog</span>
            </motion.div>

            <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-end">
              <div>
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  custom={0.04}
                  className="flex items-center gap-2 mb-4"
                >
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 border border-gray-100 dark:bg-gray-900 dark:border-gray-800">
                    <BookOpen size={10} className="text-gray-400" />
                    <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-gray-500">
                      Praxiswissen
                    </span>
                  </div>
                </motion.div>

                <motion.h1
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  custom={0.08}
                  className="text-4xl sm:text-5xl lg:text-[3rem] font-bold text-gray-900 dark:text-gray-50 leading-[1.08] tracking-[-0.022em] mb-4"
                >
                  KI, Webdesign &<br />
                  <span className="text-gray-400 dark:text-gray-500 font-light">Automatisierung</span>
                </motion.h1>

                <motion.p
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  custom={0.12}
                  className="text-[15px] text-gray-500 dark:text-gray-400 leading-relaxed max-w-[520px]"
                >
                  Praxisorientiertes Wissen für Unternehmer, die digitale Systeme
                  nutzen wollen, um Effizienz zu steigern und mehr Kunden zu gewinnen.
                </motion.p>
              </div>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={0.14}
                className="flex items-center gap-1.5 text-[12px] text-gray-400 dark:text-gray-500"
              >
                <span className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                  {BLOG_ARTICLES.length}
                </span>
                <span>Artikel</span>
              </motion.div>
            </div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={0.16}
              className="flex flex-wrap gap-2 mt-8"
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium border transition-all duration-200 ${
                    activeCategory === cat
                      ? "bg-gray-900 text-white border-gray-900 dark:bg-gray-50 dark:text-gray-900 dark:border-gray-50"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-400 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700 dark:hover:border-gray-500"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="py-16 px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {featured && (
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeUp}
                custom={0}
                className="mb-14"
              >
                <Link
                  to={`/blog/${featured.slug}`}
                  className="group grid lg:grid-cols-[1fr_420px] gap-0 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 hover:shadow-lg hover:shadow-gray-100/60 dark:hover:shadow-black/30"
                >
                  <div className="bg-gray-950 dark:bg-gray-900 relative overflow-hidden min-h-[280px] lg:min-h-0 flex items-end p-10 lg:p-12">
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background:
                          "radial-gradient(ellipse 80% 60% at 30% 40%, rgba(2,132,199,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 70% 70%, rgba(16,185,129,0.08) 0%, transparent 55%)",
                      }}
                    />
                    <div
                      className="absolute top-0 left-0 right-0 h-px"
                      style={{
                        background:
                          "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
                      }}
                    />
                    <div className="relative">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10.5px] font-semibold border mb-4 ${
                          CATEGORY_COLORS[featured.category] ?? "bg-gray-800 text-gray-300 border-gray-700"
                        } !bg-opacity-20 !text-white !border-white/20`}
                      >
                        {featured.category}
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-bold text-white leading-[1.2] tracking-tight mb-3 group-hover:text-gray-100 transition-colors">
                        {featured.title}
                      </h2>
                      <div className="flex items-center gap-4 text-[12px] text-gray-400">
                        <span className="flex items-center gap-1.5">
                          <Clock size={11} />
                          {featured.readingTime} Min. Lesezeit
                        </span>
                        <span>{formatDate(featured.publishedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-900 p-10 lg:p-12 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-gray-800">
                    <div>
                      <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-gray-400 mb-4">
                        Empfohlen
                      </p>
                      <p className="text-[15px] text-gray-600 dark:text-gray-300 leading-[1.75]">
                        {featured.excerpt}
                      </p>
                    </div>
                    <div className="mt-8 flex items-center gap-2 text-[13px] font-semibold text-gray-900 dark:text-gray-100 group-hover:gap-3 transition-all duration-200">
                      Artikel lesen
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {rest.map((article, i) => (
                <motion.div
                  key={article.slug}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-30px" }}
                  variants={fadeUp}
                  custom={i * 0.06}
                >
                  <Link
                    to={`/blog/${article.slug}`}
                    className="group flex flex-col h-full rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md hover:shadow-gray-100/60 dark:hover:shadow-black/20 transition-all duration-300 overflow-hidden"
                  >
                    <div className="bg-gray-950 dark:bg-gray-800/50 px-7 pt-8 pb-6 relative overflow-hidden min-h-[130px] flex items-end">
                      <div
                        className="absolute inset-0 pointer-events-none opacity-60"
                        style={{
                          background: `radial-gradient(ellipse 100% 80% at 0% 100%, rgba(2,132,199,0.1) 0%, transparent 55%)`,
                        }}
                      />
                      <span
                        className={`relative inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold border !bg-white/10 !text-white/80 !border-white/15`}
                      >
                        {article.category}
                      </span>
                    </div>

                    <div className="flex flex-col flex-1 p-7">
                      <h2 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 leading-[1.45] mb-3 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
                        {article.title}
                      </h2>
                      <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed flex-1 line-clamp-3">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3 text-[11px] text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {article.readingTime} Min.
                          </span>
                          <span className="w-px h-3 bg-gray-200 dark:bg-gray-700" />
                          <span>{formatDate(article.publishedAt)}</span>
                        </div>
                        <ArrowRight
                          size={13}
                          className="text-gray-300 dark:text-gray-600 group-hover:text-gray-700 dark:group-hover:text-gray-300 group-hover:translate-x-0.5 transition-all duration-200"
                        />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-20">
                <p className="text-gray-400 text-[15px]">Keine Artikel in dieser Kategorie.</p>
              </div>
            )}
          </div>
        </section>

        <section className="py-20 px-6 lg:px-8 border-t border-gray-100 dark:border-gray-800">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
              custom={0}
              className="bg-gray-950 rounded-2xl p-10 lg:p-14 relative overflow-hidden"
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse 60% 50% at 80% 50%, rgba(2,132,199,0.09) 0%, transparent 55%)",
                }}
              />
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(2,132,199,0.35), transparent)",
                }}
              />
              <div className="relative max-w-xl">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-500 mb-4">
                  Analysegespräch
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-white leading-[1.2] tracking-tight mb-4">
                  Wissen in die Praxis umsetzen?
                </h2>
                <p className="text-[14px] text-gray-400 leading-relaxed mb-8">
                  In einem kostenlosen Analysegespräch zeigen wir, wie KI-Automatisierung,
                  Webdesign oder ein KI-Telefonassistent konkret in Ihrem Unternehmen wirken.
                </p>
                <Link
                  to="/kontakt"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-white text-gray-900 text-[13.5px] font-semibold hover:bg-gray-100 transition-colors duration-200"
                >
                  Kostenloses Gespräch sichern
                  <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
}
