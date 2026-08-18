// Die zuvor hier veröffentlichte Fallstudie benannte einen realen Kunden
// (Verein, Ort, Projektdetails, wörtliches Zitat) ohne dokumentierte
// schriftliche Einwilligung im Repository. Sie wurde vollständig aus dem
// Rendering entfernt — inklusive Meta-Description und JSON-LD — und nicht
// lediglich markiert. Kein Platzhalter, keine anonymisierte Restfassung:
// Anlage, Ort und Funktionsumfang blieben auch ohne Namen identifizierbar.
// Inhalt gesichert in ASSETS-REQUIRED.md; Wiederherstellung nur nach
// schriftlicher Einwilligung.
//
// [[ASSET: Referenzprojekt mit schriftlicher Einwilligung]]
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, ExternalLink, ChevronRight } from "lucide-react";
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
      // Kein mainEntity mehr: Das benannte Kundenprojekt wurde aus dem Rendering
      // entfernt, also darf es auch nicht im strukturierten Datenmarkup stehen.
      "@type": "CollectionPage",
      "@id": `${base}/referenzen/#webpage`,
      url: `${base}/referenzen`,
      name: "Referenzen – Arbeitsweise und Projektverständnis | Cogniiq",
      description:
        "Wie Cogniiq digitale Systeme baut: Nutzerführung, Geschäftslogik, Verwaltung und Betrieb als zusammenhängendes System.",
      isPartOf: {
        "@id": `${base}/#website`,
      },
      about: {
        "@id": `${base}/#localbusiness`,
      },
    },
  ],
};

export function ReferenzenPage() {
  return (
    <>
      <PageSEO
        title="Referenzen – Arbeitsweise & Projektverständnis | Cogniiq"
        description="Wie Cogniiq arbeitet: Nutzerführung, Geschäftslogik, Verwaltung und Betrieb als ein System. Kundenprojekte veröffentlichen wir nur mit schriftlicher Freigabe."
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
              <Link to="/" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                Home
              </Link>
              <ChevronRight size={12} aria-hidden="true" />
              <span className="text-gray-600 dark:text-gray-300" aria-current="page">
                Referenzen
              </span>
            </motion.nav>

            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.1}>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 leading-tight tracking-tight mb-6">
                Digitale Systeme, die im Alltag funktionieren.
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mb-4">
                Wie wir arbeiten: Nutzerführung, Geschäftslogik, Verwaltung und Betrieb
                gehören für uns in ein System – nicht in vier voneinander getrennte
                Einzellösungen.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium mt-2">
                <CheckCircle2 size={12} aria-hidden="true" />
                Kundenprojekte nur mit schriftlicher Freigabe
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-20 bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300">
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Warum hier gerade kein Kundenprojekt steht
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                An dieser Stelle stand bisher eine ausführliche Fallstudie mit
                Kundennamen. Wir haben sie entfernt, weil uns dafür keine
                schriftliche Freigabe des Kunden vorlag – unabhängig davon, wie
                gut das Projekt gelaufen ist.
              </p>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                Kundenprojekte veröffentlichen wir erst, wenn die Freigabe
                schriftlich vorliegt. Anonymisierte Fassungen zeigen wir nicht:
                Wo Branche, Ort und Funktionsumfang zusammenkommen, ist ein
                Kunde auch ohne Namen erkennbar.
              </p>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
                Wenn Sie wissen möchten, was wir konkret gebaut haben: Fragen Sie
                uns im Erstgespräch. Dort zeigen wir umgesetzte Systeme – mit
                Zustimmung der jeweiligen Kunden.
              </p>
              <Link
                to="/kontakt"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold hover:bg-gray-700 dark:hover:bg-white transition-colors"
              >
                Projekte im Erstgespräch ansehen
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
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
              className="mb-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Wie wir Projekte angehen
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-2xl">
                Digitale Projekte denken wir als betriebliche Gesamtsysteme – von der Nutzeroberfläche bis zum stabilen Betrieb.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-5">
              {[
                {
                  heading: "End-to-End statt Insellösung",
                  text: "Wir verbinden Nutzerführung, Geschäftslogik, Verwaltung und technische Infrastruktur zu einem konsistenten Ablauf.",
                },
                {
                  heading: "Direkte Verantwortung",
                  text: "Lazar und Djordje Popovic arbeiten direkt am Projekt. Entscheidungen gehen nicht durch anonyme Vertriebs- oder Outsourcingstrukturen.",
                },
                {
                  heading: "Für den Betrieb gebaut",
                  text: "Berechtigungen, Monitoring, Berichte, Wartung und Weiterentwicklung werden von Anfang an als Teil des Systems berücksichtigt.",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.heading}
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
                Welche Abläufe kosten Ihr Unternehmen heute unnötig Zeit?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
                In einem unverbindlichen Erstgespräch analysieren wir Ihre bestehenden Prozesse und geben eine konkrete Einschätzung zu Automatisierungspotenzial, Machbarkeit und sinnvollen nächsten Schritten.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  to="/kontakt"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold hover:bg-gray-700 dark:hover:bg-white transition-colors"
                >
                  Prozesse analysieren lassen
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <Link
                  to="/bewertungen"
                  className="inline-flex items-center gap-2 px-7 py-3.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:border-gray-500 transition-colors"
                >
                  Bewertungen ansehen
                  <ExternalLink size={14} aria-hidden="true" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
}
