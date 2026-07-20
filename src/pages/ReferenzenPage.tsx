import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, ExternalLink, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { PageSEO } from "@/components/PageSEO";
import { BUSINESS_INFO } from "@/lib/seo-data";
import {
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
      "@type": "CollectionPage",
      "@id": `${base}/referenzen/#webpage`,
      url: `${base}/referenzen`,
      name: "Referenzen – Digitale Systeme im Livebetrieb | Cogniiq",
      description:
        "Dokumentierte Kundenprojekte von Cogniiq aus Webentwicklung, Buchungs- und Zahlungssystemen, Verwaltungssoftware und Prozessautomatisierung.",
      isPartOf: {
        "@id": `${base}/#website`,
      },
      about: {
        "@id": `${base}/#localbusiness`,
      },
      mainEntity: {
        "@type": "CreativeWork",
        name: "Digitale Infrastruktur für den SV Heinersreuth e.V.",
        description:
          "Website, Buchungs- und Zahlungssystem, Admin-Center sowie angebundene Automationen für den laufenden Betrieb der Sportanlage.",
        creator: {
          "@id": `${base}/#localbusiness`,
        },
      },
    },
  ],
};

export function ReferenzenPage() {
  return (
    <>
      <PageSEO
        title="Referenzen – Digitale Systeme im Livebetrieb | Cogniiq"
        description="Cogniiq Referenzen: Website, Buchung, Zahlung, Verwaltung und Automatisierung für den SV Heinersreuth – als verbundenes System im Livebetrieb."
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
                Dokumentierte Kundenprojekte aus Webentwicklung, Buchung, Zahlung, Verwaltung und Automatisierung – produktiv eingesetzt und langfristig betreut.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium mt-2">
                <CheckCircle2 size={12} aria-hidden="true" />
                Reale Umsetzung · produktiver Betrieb · direkte Betreuung
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
                Ausgewähltes Kundenprojekt
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-2xl">
                Kein isolierter Website-Relaunch, sondern eine verbundene digitale Infrastruktur für den operativen Betrieb.
              </p>
            </motion.div>

            <motion.article
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0.1}
              className="bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden"
              aria-labelledby="svh-project-title"
            >
              <div className="p-8">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                  <div className="max-w-2xl">
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
                      Sportverein · Heinersreuth bei Bayreuth · Oberfranken
                    </div>
                    <h3 id="svh-project-title" className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      SV Heinersreuth e.V.
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                      Digitale Infrastruktur für Website, Buchung, Zahlung, Verwaltung und Anlagenautomation
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                    <CheckCircle2 size={12} aria-hidden="true" />
                    Im produktiven Betrieb
                  </div>
                </div>

                <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-8 max-w-3xl">
                  Für die Sportanlage entstand ein zusammenhängendes System, das die digitale Nutzerreise mit den internen Verwaltungsprozessen und technischen Funktionen der Anlage verbindet. Mitglieder, Gäste und Verantwortliche arbeiten dadurch nicht mit voneinander getrennten Einzellösungen, sondern mit einer zentralen Infrastruktur.
                </p>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                  {[
                    { label: "Nutzererlebnis", value: "Website" },
                    { label: "Kernprozess", value: "Buchung & Zahlung" },
                    { label: "Betrieb", value: "Admin-Center" },
                    { label: "Infrastruktur", value: "Automation" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="bg-gray-50 dark:bg-gray-900/40 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50"
                    >
                      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">
                        {item.label}
                      </p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                      Ausgangslage
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      Buchung, Bezahlung, Mitgliederstatus, Verwaltungsinformationen und technische Anlagenfunktionen sollten in einem belastbaren digitalen Ablauf zusammengeführt werden. Entscheidend war nicht nur die Oberfläche, sondern ein System, das sich im täglichen Vereinsbetrieb eigenständig bedienen und zuverlässig weiterbetreiben lässt.
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                      Zielbild
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      Eine zentrale Nutzer- und Verwaltungsplattform, die wiederkehrende Abstimmungen reduziert, definierte Preis- und Berechtigungslogiken abbildet und digitale Buchungen mit den relevanten Prozessen der Sportanlage verbindet.
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                      Nutzer & Buchung
                    </p>
                    <ul className="space-y-2">
                      {[
                        "Kompletter Website-Relaunch mit mobiler Nutzerführung",
                        "Zentraler Buchungsprozess für Mitglieder und Gäste",
                        "Integrierte digitale Zahlungsabwicklung",
                        "Automatisierte Preis-, Rollen- und Berechtigungslogik",
                        "Klare Buchungsbestätigungen und Nutzerinformationen",
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                          <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5 text-[#515A61] dark:text-sky-400" aria-hidden="true" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                      Verwaltung & Betrieb
                    </p>
                    <ul className="space-y-2">
                      {[
                        "Admin-Center für Buchungen und Zahlungen",
                        "Mitglieder- und Gutscheinverwaltung zur eigenständigen Nutzung",
                        "Finanz-, Steuer- und Berichtsfunktionen",
                        "Auditierbare Systemhinweise, Alerts und Einstellungen",
                        "Laufendes Hosting, Monitoring, Wartung und Support",
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                          <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5 text-[#515A61] dark:text-sky-400" aria-hidden="true" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/40 rounded-xl p-5 border border-gray-100 dark:border-gray-700/50 mb-8">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                    Verbindung mit der Anlage
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    Die Lösung endet nicht bei einer Buchungsbestätigung. Digitale Abläufe wurden mit Zugangs- und Flutlichtfunktionen der Padelanlage verbunden; ergänzend wurde die technische Infrastruktur der Videoüberwachung integriert. Sicherheitsrelevante Details bleiben bewusst nicht öffentlich dokumentiert.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                      Ergebnis im Betrieb
                    </p>
                    <ul className="space-y-2">
                      {[
                        "Reservierungen über einen zentralen digitalen Prozess",
                        "Nachvollziehbare Verwaltung von Buchungen und Zahlungen",
                        "Eigenständige Pflege zentraler Vereinsdaten und Gutscheine",
                        "Verknüpfung digitaler Buchungen mit Anlagenfunktionen",
                        "Betreuter Livebetrieb statt einmaliger Projektübergabe",
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                          <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5 text-[#515A61] dark:text-sky-400" aria-hidden="true" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                      Verantwortung von Cogniiq
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      Cogniiq konzipierte und implementierte die digitale Infrastruktur und verantwortet die technische Betreuung. Die laufende operative Datenpflege erfolgt durch den Verein über die bereitgestellten Verwaltungsfunktionen – ohne Abhängigkeit von manueller Agenturarbeit im Tagesgeschäft.
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/40 rounded-xl p-5 border border-gray-100 dark:border-gray-700/50">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                    Rückmeldung aus dem laufenden Betrieb
                  </p>
                  <blockquote className="text-base text-gray-700 dark:text-gray-300 leading-relaxed italic mb-3">
                    „{REAL_TESTIMONIAL.quote}“
                  </blockquote>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    — {REAL_TESTIMONIAL.attribution}
                  </p>
                </div>
              </div>
            </motion.article>
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
                Was dieses Projekt über unsere Arbeitsweise zeigt
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-2xl">
                Digitale Projekte werden bei Cogniiq als betriebliche Gesamtsysteme gedacht – von der Nutzeroberfläche bis zum stabilen Betrieb.
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
