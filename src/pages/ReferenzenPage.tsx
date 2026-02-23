import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, ExternalLink, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { PageSEO } from "@/components/PageSEO";
import { BUSINESS_INFO } from "@/lib/seo-data";
import {
  TestimonialBlock,
  REAL_TESTIMONIAL,
  PLACEHOLDER_TESTIMONIAL,
  PLACEHOLDER_TESTIMONIAL_2,
} from "@/components/TestimonialBlock";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

const base = BUSINESS_INFO.website;

const breadcrumbs = [
  { name: "Home", url: base },
  { name: "Referenzen", url: `${base}/referenzen` },
];

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": `${base}/#localbusiness`,
      name: BUSINESS_INFO.name,
      url: base,
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
    },
    {
      "@type": "Review",
      itemReviewed: {
        "@type": "LocalBusiness",
        "@id": `${base}/#localbusiness`,
      },
      reviewRating: {
        "@type": "Rating",
        ratingValue: "5",
        bestRating: "5",
      },
      author: {
        "@type": "Person",
        name: "Betreiber, Sportanlage Region Bayreuth",
      },
      reviewBody:
        "Die neue Website und das Buchungssystem funktionieren deutlich zuverlässiger als vorher. Besucher finden schneller, was sie suchen, und Reservierungen laufen jetzt ohne manuelle Abstimmung. Insgesamt wirkt der Auftritt deutlich moderner und professioneller.",
    },
  ],
};

export function ReferenzenPage() {
  return (
    <>
      <PageSEO
        title="Referenzen – Webdesign & Automatisierung Projekte | Cogniiq"
        description="Referenzen von Cogniiq: Reale Projektbeispiele aus Webdesign, Website-Automatisierung und KI-Integration. Systeme im Livebetrieb – transparent dargestellt."
        canonical={`${base}/referenzen`}
        breadcrumbs={breadcrumbs}
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
              <span className="text-gray-600 dark:text-gray-300">Referenzen</span>
            </motion.nav>

            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.1}>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 leading-tight tracking-tight mb-6">
                Referenzen
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mb-4">
                Reale Projektbeispiele – keine Hochglanzdarstellung, keine erfundenen Zahlen. Systeme, die im Livebetrieb funktionieren.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium mt-2">
                <CheckCircle2 size={12} />
                1 reales Projekt · weitere in Aufbau
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
                Abgeschlossene Projekte
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Projekte mit öffentlich darstellbarem Ergebnis.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0.1}
              className="bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
                      Sportverein · Region Bayreuth · Oberfranken
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      SV Heinersreuth
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Website Relaunch & Buchungsautomatisierung
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                    <CheckCircle2 size={12} />
                    Im Livebetrieb
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-6">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Projektumfang</p>
                    <ul className="space-y-2">
                      {[
                        "Kompletter Website-Relaunch",
                        "Responsive, Mobile-First Design",
                        "Automatisiertes Buchungssystem",
                        "Performance-Optimierung",
                        "DSGVO-konforme Umsetzung",
                        "On-Page SEO Setup",
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                          <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5 text-[#515A61] dark:text-sky-400" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Ergebnisse</p>
                    <ul className="space-y-2">
                      {[
                        "Deutlich schnellere Ladezeit",
                        "Reservierungen ohne manuelle Abstimmung",
                        "Klarere UX für Vereinsmitglieder und Besucher",
                        "Modernerer, professionellerer Auftritt",
                        "System läuft stabil im Livebetrieb",
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                          <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5 text-[#515A61] dark:text-sky-400" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/40 rounded-xl p-5 border border-gray-100 dark:border-gray-700/50">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Kundenstimme</p>
                  <blockquote className="text-base text-gray-700 dark:text-gray-300 leading-relaxed italic mb-3">
                    "{REAL_TESTIMONIAL.quote}"
                  </blockquote>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    — {REAL_TESTIMONIAL.attribution}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Weitere Projekte
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Cogniiq befindet sich im Aufbau des öffentlichen Referenzportfolios. Weitere Projekte werden nach Freigabe durch Kunden ergänzt.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-5">
              {[
                { type: "Webdesign & Local SEO", sector: "Dienstleistung, Region Bayern", status: "In Bearbeitung" },
                { type: "Website Relaunch", sector: "Handwerk, Nordbayern", status: "Referenz in Abstimmung" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i * 0.1}
                  className="bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 border-dashed rounded-2xl p-6 opacity-60"
                >
                  <div className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
                    {item.type}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.sector}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">{item.status}</p>
                </motion.div>
              ))}
            </div>
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
              className="mb-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Warum Cogniiq trotzdem wählen?
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-2xl">
                Cogniiq ist eine junge Agentur – und wir sagen das offen. Das bedeutet nicht weniger Qualität, sondern einen anderen Vorteil.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-5">
              {[
                {
                  heading: "Reale Projektumsetzung",
                  text: "SV Heinersreuth läuft im Livebetrieb. Das Buchungssystem wurde gebaut, getestet und ist stabil. Keine Theorie – funktionierende Systeme.",
                },
                {
                  heading: "Persönliche Umsetzung",
                  text: "Kein Outsourcing, keine anonyme Agenturstruktur. Lazar und Djordje Popovic arbeiten direkt an Ihrem Projekt – mit persönlicher Erreichbarkeit.",
                },
                {
                  heading: "Fokus auf Funktionalität",
                  text: "Websites, die ranken, laden und konvertieren – nicht nur gut aussehen. Jede technische Entscheidung dient dem messbaren Ergebnis.",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i * 0.1}
                  className="bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl p-6"
                >
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">{item.heading}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

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
                Ihr Projekt als nächstes?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
                Kostenloses Erstgespräch – 30–45 Minuten, ohne Verpflichtung. Wir analysieren Ihre Situation und geben eine konkrete erste Einschätzung.
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
                  to="/bewertungen"
                  className="inline-flex items-center gap-2 px-7 py-3.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:border-gray-500 transition-colors"
                >
                  Bewertungen ansehen
                  <ExternalLink size={14} />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
}
