// ─────────────────────────────────────────────────────────────────────────────
// /integrationen — Anbindung an bestehende Systeme.
//
// Dreistufig, in fester Reihenfolge und optisch GLEICHRANGIG:
//   1. Was heute läuft      — die strukturierte Übergabe als echte Leistung
//   2. Was wir für Sie prüfen — Schnittstellenprüfung vor der Unterschrift
//   3. Was wir ohne Prüfung des konkreten Systems nicht zusagen
//
// Abschnitt 3 wird NICHT kleiner gesetzt und NICHT ans Ende geschoben. Er ist
// der Grund, warum diese Seite glaubwürdig ist.
//
// Keine Produktnamen von Praxisverwaltungssystemen, solange keine Anbindung
// existiert (Inhaber-Antwort B). Die Route bleibt `indexable: false`, bis
// mindestens eine real bestehende Anbindung oder eine belastbare Aussage zur
// Schnittstellenprüfung vorliegt — Bedingungen in ASSETS-REQUIRED.md §B.
//
// Sämtliche Copy stammt aus `telefonassistent-copy.ts`; Kernaussagen kommen aus
// FAKTEN (siehe HONESTY-AUDIT §7.4.1).
// ─────────────────────────────────────────────────────────────────────────────
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight } from "lucide-react";
import { PageSEO } from "@/components/PageSEO";
import { BUSINESS_INFO } from "@/lib/seo-data";
import { ANBINDUNG, CTA, FAKTEN, UEBERGABE } from "@/lib/telefonassistent-copy";

const base = BUSINESS_INFO.website;
const url = `${base}/integrationen`;

const breadcrumbs = [
  { name: "Home", url: base },
  { name: "Für Praxen", url: `${base}/praxen` },
  { name: "Anbindung", url },
];

const faqItems = [
  {
    question: ANBINDUNG.nichtBehauptet.frage,
    answer: ANBINDUNG.nichtBehauptet.absaetze[0] + " " + ANBINDUNG.nichtBehauptet.absaetze[1],
  },
  {
    question: "Kann ich mir die Anrufe später anhören?",
    answer: `Nein. ${FAKTEN.keineAufzeichnung} Wenn Sie den genauen Wortlaut eines Gesprächs brauchen, gibt es ihn nicht — dafür entsteht auch keine Aufnahme, die aufbewahrt und geschützt werden müsste.`,
  },
  {
    question: "Wann erfahre ich, ob mein System angebunden werden kann?",
    answer:
      "Vor der Unterschrift. Die Schnittstellenprüfung gehört zum Angebot: Sie nennen uns Ihr Praxisverwaltungssystem, Ihren Kalender und Ihre Telefonanlage, und das Ergebnis steht im Angebot — auch dann, wenn es negativ ausfällt.",
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

export function IntegrationenPage() {
  return (
    <>
      <PageSEO
        title="Anbindung an Ihr System | Cogniiq"
        description="Was nach einem Anruf passiert, was wir an Ihrem System vor dem Angebot prüfen — geeignete Schnittstelle, Zugang, mögliche Vorgänge, Kosten Dritter — und was wir ohne diese Prüfung nicht zusagen."
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
                Anbindung
              </span>
            </nav>

            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 leading-[1.12] tracking-tight mb-7">
              Anbindung an Ihr System
            </h1>
            <div className={`${PROSE} space-y-5`}>
              <p>
                Die Frage, an der sich entscheidet, ob ein Telefonassistent Ihren
                Alltag entlastet oder ihn nur verschiebt, lautet: Was passiert
                nach dem Gespräch?
              </p>
              <p>
                Diese Seite beantwortet sie in drei Teilen — was heute läuft, was
                wir für Ihr System prüfen, und was wir nicht behaupten. Der dritte
                Teil ist so ausführlich wie die ersten beiden.
              </p>
            </div>
          </div>
        </section>

        {/* ── 1 · Was heute läuft ── */}
        <section className={SECTION_ALT} aria-labelledby="anbindung-heute">
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <p className={KICKER}>1 · {ANBINDUNG.heute.headline}</p>
            <h2 id="anbindung-heute" className={H2}>
              {ANBINDUNG.heute.frage}
            </h2>
            <div className={`${PROSE} space-y-5 mt-6`}>
              {ANBINDUNG.heute.absaetze.map((a, i) => (
                <p key={i}>{a}</p>
              ))}
            </div>
            <div className={`${CARD} mt-8`}>
              <h3 className="text-[19px] font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {UEBERGABE.wasAnkommt.headline}
              </h3>
              <ul className="space-y-3">
                {ANBINDUNG.heute.punkte.map((p) => (
                  <li key={p} className={`flex items-start gap-3 ${PROSE}`}>
                    <span className={DOT} />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── 2 · Was wir für Sie prüfen ── */}
        <section className={SECTION} aria-labelledby="anbindung-pruefen">
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <p className={KICKER}>2 · {ANBINDUNG.pruefen.headline}</p>
            <h2 id="anbindung-pruefen" className={H2}>
              {ANBINDUNG.pruefen.frage}
            </h2>
            <div className={`${PROSE} space-y-5 mt-6`}>
              {ANBINDUNG.pruefen.absaetze.map((a, i) => (
                <p key={i}>{a}</p>
              ))}
            </div>
            <ol className="mt-8 space-y-4">
              {ANBINDUNG.pruefen.schritte.map((schritt, i) => (
                <li key={i} className={`${CARD_ALT} flex items-start gap-5`}>
                  <span className="text-[15px] font-bold text-gray-400 dark:text-gray-500 tabular-nums mt-0.5 flex-shrink-0">
                    {i + 1}
                  </span>
                  <p className={PROSE}>{schritt}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── 3 · Was wir nicht behaupten — gleichrangig, nicht kleiner ── */}
        <section className={SECTION_ALT} aria-labelledby="anbindung-nicht">
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <p className={KICKER}>3 · {ANBINDUNG.nichtBehauptet.headline}</p>
            <h2 id="anbindung-nicht" className={H2}>
              {ANBINDUNG.nichtBehauptet.frage}
            </h2>
            <div className={`${PROSE} space-y-5 mt-6`}>
              {ANBINDUNG.nichtBehauptet.absaetze.map((a, i) => (
                <p key={i}>{a}</p>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className={SECTION}>
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 leading-[1.2] mb-8">
              Häufige Fragen zur Anbindung
            </h2>
            <div className="space-y-4">
              {faqItems.map((item, i) => (
                <div key={i} className={CARD_ALT}>
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
              Gehen wir Ihr System gemeinsam durch.
            </h2>
            <p className={`${PROSE} mb-8`}>
              Nennen Sie uns im Erstgespräch Ihr Praxisverwaltungssystem, Ihren
              Kalender und Ihre Telefonanlage. Was möglich ist, steht danach im
              Angebot — vor Ihrer Entscheidung.
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
                <Link to="/kosten-ki-telefonassistent" className={TEXT_LINK}>
                  Was der Empfang kostet
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </li>
              <li>
                <Link to="/ki-telefonassistent" className={TEXT_LINK}>
                  Wie der Empfang am Telefon arbeitet
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
