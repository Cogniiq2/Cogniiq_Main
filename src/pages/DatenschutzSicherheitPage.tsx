// ─────────────────────────────────────────────────────────────────────────────
// /datenschutz-sicherheit — die S4-Seite für den Datenschutz-Gatekeeper.
//
// Abgegrenzt von /datenschutz (juristische Datenschutzerklärung).
//
// Aufbau wie /integrationen, drei gleichrangige Abschnitte:
//   1. Was gilt                — die fünf freigegebenen Aussagen, vollständig
//   2. Was wir für Sie klären  — die Fragen, die der DSB uns stellen sollte
//   3. Was wir nicht behaupten — Konformität, Verarbeitungsort, TOM-Liste
//
// BINDEND (Inhaber-Antworten B und C):
//   - keine Aussage zu Hosting-Standort, Serverstandort oder EU-Verarbeitung
//   - kein „DSGVO-konform"
//   - keine TOM-Liste, auch nicht in Stichworten
//   - keine Aussage zur DSFA-Pflicht — Verweis auf den DSB der Praxis
//
// Die Route bleibt `indexable: false`, bis die Grundlagen belastbar sind —
// Bedingungen in ASSETS-REQUIRED.md §B2.
// ─────────────────────────────────────────────────────────────────────────────
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight } from "lucide-react";
import { PageSEO } from "@/components/PageSEO";
import { BUSINESS_INFO } from "@/lib/seo-data";
import {
  CTA,
  DATENSCHUTZ_PUNKTE,
  DATENSCHUTZ_SEITE,
  FAKTEN,
} from "@/lib/telefonassistent-copy";

const base = BUSINESS_INFO.website;
const url = `${base}/datenschutz-sicherheit`;

const breadcrumbs = [
  { name: "Home", url: base },
  { name: "Für Praxen", url: `${base}/praxen` },
  { name: "Datenschutz & Sicherheit", url },
];

const faqItems = [
  {
    question: DATENSCHUTZ_SEITE.nichtBehauptet.frage,
    answer:
      DATENSCHUTZ_SEITE.nichtBehauptet.absaetze[0] +
      " " +
      DATENSCHUTZ_SEITE.nichtBehauptet.absaetze[1],
  },
  {
    question: "Braucht meine Praxis eine Datenschutz-Folgenabschätzung?",
    answer: DATENSCHUTZ_SEITE.klaeren.absaetze[0],
  },
  {
    question: "Werden Gespräche mitgeschnitten?",
    answer: `${FAKTEN.keineAufzeichnung} ${FAKTEN.keinTraining}`,
  },
  {
    question: "Erfahren Anrufende, dass sie mit einem KI-System sprechen?",
    answer: FAKTEN.art50,
  },
];

const SECTION = "py-24";
const SECTION_ALT = "py-24 bg-gray-50 dark:bg-gray-900/40";
const PROSE = "text-[17px] text-gray-600 dark:text-gray-400 leading-[1.7]";
const H2 = "text-3xl font-bold text-gray-900 dark:text-gray-100 leading-[1.2] mb-3";
const KICKER =
  "text-[15px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-500 mb-3";
const CARD =
  "p-7 rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800";
const CARD_ALT =
  "p-7 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800";
const DOT =
  "mt-[10px] w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 flex-shrink-0";
const CTA_PRIMARY =
  "inline-flex items-center gap-2 px-7 py-4 min-h-[44px] bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold text-[16px] hover:bg-gray-700 dark:hover:bg-white transition-colors";
const TEXT_LINK =
  "inline-flex items-center gap-2 min-h-[44px] py-3 text-[16px] font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors";

export function DatenschutzSicherheitPage() {
  return (
    <>
      <PageSEO
        title="Datenschutz & Sicherheit – die Prüfpunkte | Cogniiq"
        description="Was beim Praxis-Empfang gilt, was Ihr Datenschutzbeauftragter uns fragen sollte und was wir nicht behaupten. Keine Aufzeichnung, kein Training."
        canonical={url}
        breadcrumbs={breadcrumbs}
        faqItems={faqItems}
        noIndex
      />

      <main className="min-h-screen bg-white dark:bg-gray-950">
        {/* ── Einstieg ── */}
        <section className="pt-32 pb-24">
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-[14px] text-gray-400 dark:text-gray-500 mb-10"
            >
              <Link to="/" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                Home
              </Link>
              <ChevronRight size={13} aria-hidden="true" />
              <Link
                to="/praxen"
                className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                Für Praxen
              </Link>
              <ChevronRight size={13} aria-hidden="true" />
              <span className="text-gray-600 dark:text-gray-300" aria-current="page">
                Datenschutz &amp; Sicherheit
              </span>
            </nav>

            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 leading-[1.12] tracking-tight mb-7">
              Datenschutz und Sicherheit
            </h1>
            <div className={`${PROSE} space-y-5`}>
              <p>
                Diese Seite richtet sich an die Person, die in Ihrer Praxis Nein
                sagen kann: Ihren Datenschutzbeauftragten. Sie ist nach demselben
                Muster gebaut wie unsere Seite zur Anbindung — was gilt, was wir
                für Sie klären, was wir nicht behaupten.
              </p>
              <p>
                Der dritte Teil ist hier der längste. Das liegt daran, dass
                mehrere Grundlagen bei uns noch nicht abgeschlossen sind, und wir
                halten es für richtig, das auf der Datenschutzseite selbst zu
                sagen — nicht erst im Gespräch.
              </p>
              <p className="text-[15px] text-gray-500 dark:text-gray-500">
                Rechtlich verbindlich ist unsere{" "}
                <Link to="/datenschutz" className="underline hover:text-gray-800 dark:hover:text-gray-300">
                  Datenschutzerklärung
                </Link>
                . Diese Seite erklärt, was praktisch passiert.
              </p>
            </div>
          </div>
        </section>

        {/* ── 1 · Was gilt ── */}
        <section className={SECTION_ALT} aria-labelledby="ds-gilt">
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <p className={KICKER}>1 · {DATENSCHUTZ_SEITE.gilt.headline}</p>
            <h2 id="ds-gilt" className={H2}>
              {DATENSCHUTZ_SEITE.gilt.frage}
            </h2>
            <p className={`${PROSE} mt-6 mb-8`}>{DATENSCHUTZ_SEITE.gilt.absaetze[0]}</p>
            <ul className="space-y-5">
              {DATENSCHUTZ_PUNKTE.map((punkt, i) => (
                <li key={i} className={`flex items-start gap-3 ${PROSE}`}>
                  <span className={DOT} />
                  {punkt}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── 2 · Was wir für Sie klären ── */}
        <section className={SECTION} aria-labelledby="ds-klaeren">
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <p className={KICKER}>2 · {DATENSCHUTZ_SEITE.klaeren.headline}</p>
            <h2 id="ds-klaeren" className={H2}>
              {DATENSCHUTZ_SEITE.klaeren.frage}
            </h2>
            <div className={`${PROSE} space-y-5 mt-6 mb-8`}>
              {DATENSCHUTZ_SEITE.klaeren.absaetze.map((a, i) => (
                <p key={i}>{a}</p>
              ))}
            </div>
            <ol className="space-y-4">
              {DATENSCHUTZ_SEITE.klaeren.fragen.map((f, i) => (
                <li key={i} className={`${CARD_ALT} flex items-start gap-5`}>
                  <span className="text-[15px] font-bold text-gray-400 dark:text-gray-500 tabular-nums mt-1 flex-shrink-0">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-[19px] font-semibold text-gray-900 dark:text-gray-100 leading-[1.4] mb-1.5">
                      {f.frage}
                    </p>
                    <p className="text-[16px] text-gray-500 dark:text-gray-500 leading-[1.6]">
                      {f.warum}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── 3 · Was wir nicht behaupten — gleichrangig ── */}
        <section className={SECTION_ALT} aria-labelledby="ds-nicht">
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <p className={KICKER}>3 · {DATENSCHUTZ_SEITE.nichtBehauptet.headline}</p>
            <h2 id="ds-nicht" className={H2}>
              {DATENSCHUTZ_SEITE.nichtBehauptet.frage}
            </h2>
            <div className={`${PROSE} space-y-5 mt-6`}>
              {DATENSCHUTZ_SEITE.nichtBehauptet.absaetze.map((a, i) => (
                <p key={i}>{a}</p>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className={SECTION}>
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 leading-[1.2] mb-8">
              Häufige Fragen zum Datenschutz
            </h2>
            <div className="space-y-4">
              {faqItems.map((item, i) => (
                <div key={i} className={CARD}>
                  <h3 className="text-[19px] font-semibold text-gray-900 dark:text-gray-100 mb-2.5">
                    {item.question}
                  </h3>
                  <p className={PROSE}>{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Abschluss ── */}
        <section className={SECTION_ALT}>
          <div className="max-w-2xl mx-auto px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 leading-[1.2] mb-6">
              Nehmen Sie Ihren Datenschutzbeauftragten mit.
            </h2>
            <p className={`${PROSE} mb-8`}>
              Im Erstgespräch beantworten wir die sechs Fragen oben so weit, wie
              wir sie heute beantworten können — und sagen bei den übrigen, wann
              wir sie beantworten können. Schriftlich, damit Ihr
              Datenschutzbeauftragter es prüfen kann.
            </p>
            <Link to="/kontakt" className={CTA_PRIMARY}>
              {CTA.primaryLabel}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <p className="mt-4 text-[15px] text-gray-500 dark:text-gray-500">{CTA.microcopy}</p>
          </div>
        </section>

        {/* ── Interne Verlinkung ── */}
        <section className={`${SECTION} border-t border-gray-100 dark:border-gray-800`}>
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Weiterlesen
            </h2>
            <ul className="space-y-3">
              <li>
                <Link to="/praxen" className={TEXT_LINK}>
                  Der Praxis-Empfang im Überblick
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </li>
              <li>
                <Link to="/integrationen" className={TEXT_LINK}>
                  Was nach einem Anruf mit dem Ergebnis passiert
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </li>
              <li>
                <Link to="/datenschutz" className={TEXT_LINK}>
                  Zur rechtlichen Datenschutzerklärung
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </li>
            </ul>
          </div>
        </section>
      </main>
    </>
  );
}
