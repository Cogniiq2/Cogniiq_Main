import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
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

const base = BUSINESS_INFO.website;

const breadcrumbs = [
  { name: "Home", url: base },
  { name: "Bewertungen", url: `${base}/bewertungen` },
];

// No Review/AggregateRating markup is emitted here, and no customer statement is
// rendered at all: the previously shown quote named a real third party without a
// documented written consent. It was removed rather than marked, and no placeholder
// takes its place. See ASSETS-REQUIRED.md.

export function BewertungenPage() {
  return (
    <>
      <PageSEO
        title="Bewertungen – Kundenmeinungen zu Cogniiq | Webdesign Bayreuth"
        description="Bewertungen und Kundenmeinungen zu Cogniiq. Transparente Darstellung: veröffentlicht wird ausschließlich verifiziertes Kundenfeedback. Webdesign & Automatisierung aus Bayreuth."
        canonical={`${base}/bewertungen`}
        breadcrumbs={breadcrumbs}
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
              <span className="text-gray-600 dark:text-gray-300">Bewertungen</span>
            </motion.nav>

            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.1}>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 leading-tight tracking-tight mb-6">
                Bewertungen
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mb-4">
                Was Kunden über die Zusammenarbeit mit Cogniiq sagen – transparent und ohne Übertreibung.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium">
                  <CheckCircle2 size={12} />
                  Veröffentlichung nur mit schriftlicher Freigabe
                </div>
              </div>
            </motion.div>
          </div>
        </section>

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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Kundenstimmen
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Derzeit ist hier keine Kundenstimme veröffentlicht.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0.3}
              className="p-5 rounded-xl bg-white dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50 max-w-2xl"
            >
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                <strong className="text-gray-700 dark:text-gray-300">Hinweis zur Transparenz:</strong>{" "}
                Wir veröffentlichen Kundenstimmen ausschließlich mit schriftlicher
                Freigabe der genannten Kundinnen und Kunden. Solange keine solche
                Freigabe vorliegt, steht hier nichts – auch keine Beispiel- oder
                Mustertexte und keine anonymisierten Zitate, die wir selbst
                formuliert hätten. Eine leere Seite ist uns lieber als eine
                geschönte.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-16 bg-white dark:bg-gray-950 transition-colors duration-300">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="mb-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Was wir garantieren können
              </h2>
            </motion.div>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                "Persönliche Umsetzung durch Lazar und Djordje Popovic – kein Outsourcing",
                "Reale Projektumsetzung: Systeme im Livebetrieb, nicht nur Konzepte",
                "Direkte Erreichbarkeit während des gesamten Projekts",
                "Keine Fantasiezahlen, keine aufgebauschten Case Studies",
                "Datenschutzfreundliche Umsetzung: Cookie-Consent, Datenschutzerklärung und Impressum gehören zu jedem Launch",
                "Faire, transparente Preisgestaltung ohne Stundensatz-Überraschungen",
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i * 0.06}
                  className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50"
                >
                  <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5 text-[#515A61] dark:text-sky-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
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
                Überzeugen Sie sich selbst
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
                Kostenloses Erstgespräch – 30–45&nbsp;Minuten, ohne Verpflichtung. Sie entscheiden danach, ob es passt.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  to="/kontakt"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold hover:bg-gray-700 dark:hover:bg-white transition-colors"
                >
                  Erstgespräch vereinbaren
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/referenzen"
                  className="inline-flex items-center gap-2 px-7 py-3.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:border-gray-500 transition-colors"
                >
                  Referenzen ansehen
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
}
