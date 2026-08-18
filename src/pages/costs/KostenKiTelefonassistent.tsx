// ─────────────────────────────────────────────────────────────────────────────
// /kosten-ki-telefonassistent — Preisseite.
//
// Baut NICHT mehr auf der generischen `CostPage` auf: Deren Form (Preisspannen,
// Preisfaktoren, Beispielprojekte) kann die vorgeschriebene Reihenfolge aus
// COPY-BRIEF-3 §5 nicht abbilden — vor allem nicht die Deckelung VOR der ersten
// Zahl und die Einrichtung als Projekt statt als Gebühr. `CostPage` bleibt für
// die beiden anderen Kostenseiten unverändert in Gebrauch.
//
// Alle Beträge stammen aus `telefonassistent-copy.ts`. Keine Zahl wird hier
// erneut getippt — dieselbe Quelle speist Text und Offer-Schema.
//
// Zum Offer-Schema: Es trägt die Grundpreise in Googles strukturierte Daten.
// Eine bedingte Obergrenze lässt sich in schema.org nicht ausdrücken, deshalb
// steht die Deckelungslogik vollständig im sichtbaren Text und NICHT im Schema;
// die Einrichtung ist ein eigenes, einmaliges Offer.
// ─────────────────────────────────────────────────────────────────────────────
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight } from "lucide-react";
import { PageSEO } from "@/components/PageSEO";
import { PraxisRechnerSection } from "@/components/PraxisRechnerSection";
import { BUSINESS_INFO } from "@/lib/seo-data";
import {
  BETREUUNG,
  CTA,
  DECKELUNG,
  EINRICHTUNG_PROJEKT,
  GO_LIVE_GARANTIE,
  NICHT_EXTRA,
  PERSONALKOSTEN_ANKER,
  SPRACHEN,
  TARIFE,
  TARIF_ENTERPRISE,
  UMKEHRBARKEIT,
  VERTRAG,
} from "@/lib/telefonassistent-copy";

const base = BUSINESS_INFO.website;
const url = `${base}/kosten-ki-telefonassistent`;

/** Numerische Beträge für das Schema — aus denselben Konstanten abgeleitet. */
function toNumber(betrag: string): number {
  return Number(betrag.replace(/[^\d,]/g, "").replace(/\./g, "").replace(",", "."));
}

const breadcrumbs = [
  { name: "Home", url: base },
  { name: "Für Praxen", url: `${base}/praxen` },
  { name: "Kosten", url },
];

const faqItems = [
  {
    question: "Kann die Rechnung teurer werden als der Tarif?",
    answer:
      "Ja, aber nur bis zu einer festen Grenze. Über dem Minutenkontingent kostet jede weitere Minute 0,39 €. Nach oben ist gedeckelt: Mehr als der nächsthöhere Tarif kostet es nie. Im Tarif Basis heißt das 500 € im Monat, in Praxis 800 € und in MVZ 1.400 €.",
  },
  {
    question: "Was kostet ein KI Telefonassistent für eine Praxis pro Monat?",
    answer:
      "300 € im Monat für 500 Minuten, 500 € für 1.000 Minuten und 800 € für 2.000 Minuten. 500 Minuten entsprechen ungefähr 250 Anrufen. Dazu kommt einmalig die Einrichtung Ihres Empfangs, je nach Tarif 1.490 €, 2.490 € oder 3.490 €.",
  },
  {
    question: "Warum kostet die Einrichtung so viel?",
    answer:
      "Weil sie kein Freischalten ist, sondern acht Schritte Arbeit: Erstgespräch, Angebot, Unterschrift, Zugang, Ihre Vorgaben, Aufbau, zwei Tage Testphase und Go-live. Ihr Assistent wird auf Basis Ihrer Angaben gebaut, nicht aus einer Vorlage kopiert. Sie zahlen die Hälfte bei Vertragsabschluss und die Hälfte nach dem Go-live — und wenn wir die 7 Tage nicht halten, entfällt die zweite Hälfte.",
  },
  {
    question: "Ist die Testphase kostenlos?",
    answer:
      "Nein, und das sagen wir deutlich: Die zwei Tage liegen nach Vertragsabschluss und nach Zahlung der ersten Hälfte der Einrichtung. Was Sie dafür bekommen, ist ein Vetorecht — ohne Ihre Freigabe geht der Empfang nicht live.",
  },
  {
    question: "Wird pro Behandler abgerechnet?",
    answer:
      "Nein. Der Monatsbetrag gilt für Ihre Praxis, unabhängig davon, wie viele Personen bei Ihnen behandeln. Wächst Ihr Team, ändert sich am Preis nichts — nur der Minutenverbrauch kann steigen.",
  },
  {
    question: "Wie lange bin ich gebunden und wie kündige ich?",
    answer:
      "Die Laufzeit beträgt 12 Monate; wer monatlich kündbar bleiben möchte, zahlt 20 % Aufschlag. Gekündigt wird mit einem Klick im Kundendashboard, zum Laufzeitende. Der Preis ist für 24 Monate schriftlich garantiert.",
  },
  {
    question: "Was kostet eine weitere Sprache?",
    answer:
      "79 € im Monat je Sprache. Ab drei Sprachen sind es 230 € im Monat für bis zu fünf Sprachen gleichzeitig. Der Assistent kann die Sprache mitten im Gespräch wechseln.",
  },
];

/**
 * Offer-Schema: nur Grundpreise mit `priceSpecification`, Einrichtung als
 * separates einmaliges Offer. Die Deckelung steht bewusst NICHT im Schema —
 * sie ist bedingt und wäre dort nur als nackter Preis darstellbar, also
 * unehrlicher als der sichtbare Text.
 */
// FAQPage wird von PageSEO aus `faqItems` erzeugt und steht deshalb NICHT
// zusaetzlich hier — sonst laege derselbe Block zweimal im Dokument.
const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      name: "KI Telefonassistent für Praxen",
      description:
        "Telefonische Anrufannahme für Praxen mit festem Minutenkontingent, gedeckelter Monatsrechnung und einmaliger Einrichtung.",
      url,
      provider: { "@type": "Organization", name: BUSINESS_INFO.name, url: base },
      offers: [
        ...TARIFE.map((t) => ({
          "@type": "Offer",
          name: `Tarif ${t.name}`,
          description: `${t.minuten} Minuten im Monat, entspricht ungefähr ${t.anrufeCa} Anrufen.`,
          url,
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: toNumber(t.monatlich),
            priceCurrency: "EUR",
            unitCode: "MON",
            billingDuration: 1,
            billingIncrement: 1,
          },
        })),
        ...TARIFE.map((t) => ({
          "@type": "Offer",
          name: `Einrichtung Ihres Empfangs – Tarif ${t.name}`,
          description:
            "Einmalige Einrichtung in acht Schritten, zahlbar zur Hälfte bei Vertragsabschluss und zur Hälfte nach dem Go-live.",
          url,
          priceSpecification: {
            "@type": "PriceSpecification",
            price: toNumber(t.einrichtung),
            priceCurrency: "EUR",
          },
        })),
      ],
    },
  ],
};

const SECTION = "py-24";
const SECTION_ALT = "py-24 bg-gray-50 dark:bg-gray-900/40";
const PROSE = "text-[17px] text-gray-600 dark:text-gray-400 leading-[1.7]";
const H2 = "text-3xl font-bold text-gray-900 dark:text-gray-100 leading-[1.2] mb-6";
const H3 = "text-[19px] font-semibold text-gray-900 dark:text-gray-100 mb-2.5";
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

export function KostenKiTelefonassistent() {
  return (
    <>
      <PageSEO
        title="Was kostet ein KI Telefonassistent? Preise | Cogniiq"
        description="Was kostet ein KI Telefonassistent für Praxen? Tarife ab 300 € im Monat mit festem Minutenkontingent, gedeckelter Rechnung, Einrichtung und Go-live-Garantie."
        canonical={url}
        breadcrumbs={breadcrumbs}
        faqItems={faqItems}
        additionalSchema={schema}
      />

      <main className="min-h-screen bg-white dark:bg-gray-950">
        {/* ── Einstieg: Planbarkeit vor Betrag ── */}
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
                Kosten
              </span>
            </nav>

            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 leading-[1.12] tracking-tight mb-7">
              Was kostet ein KI Telefonassistent?
            </h1>
            <p className={PROSE}>
              Bevor ein Betrag fällt, die Antwort auf die Frage, die dahintersteht:
              Nein, die Rechnung kann nicht aus dem Ruder laufen. Wie weit sie
              überhaupt steigen kann, steht im nächsten Absatz — und zwar
              vollständig, nicht in einer Fußnote.
            </p>
          </div>
        </section>

        {/* ── 1 · Die Deckelung, vor der ersten Zahl ── */}
        <section className={SECTION_ALT}>
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <h2 className={H2}>{DECKELUNG.headline}</h2>
            <p className={`${PROSE} mb-6`}>{DECKELUNG.text}</p>
            <div className={CARD}>
              <p className="text-[19px] font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {DECKELUNG.hinweis}
              </p>
              <ul className="space-y-2.5">
                {TARIFE.map((t) => (
                  <li
                    key={t.name}
                    className="flex justify-between gap-4 text-[17px] text-gray-600 dark:text-gray-400"
                  >
                    <span>Tarif {t.name}</span>
                    <span className="tabular-nums text-gray-900 dark:text-gray-100 font-medium">
                      höchstens {t.obergrenze} im Monat
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-[17px] text-gray-600 dark:text-gray-400 leading-[1.7] mt-6">
                {DECKELUNG.tarifwechsel}
              </p>
            </div>
          </div>
        </section>

        {/* ── 2 · Die drei Tarife ── */}
        <section className={SECTION}>
          <div className="max-w-4xl mx-auto px-6 lg:px-8">
            <h2 className={H2}>Welcher Tarif passt zu wie vielen Anrufen?</h2>
            <p className={`${PROSE} mb-10`}>
              Praxen denken nicht in Minuten, deshalb steht neben jedem Kontingent,
              wie vielen Anrufen es ungefähr entspricht. Ein Anruf dauert in dieser
              Rechnung rund zwei Minuten.
            </p>
            <div className="grid md:grid-cols-3 gap-5">
              {TARIFE.map((t) => (
                <div key={t.name} className={CARD_ALT}>
                  <p className="text-[19px] font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    {t.name}
                  </p>
                  <p className="text-[30px] font-bold text-gray-900 dark:text-gray-100 tabular-nums leading-none mb-1">
                    {t.monatlich}
                  </p>
                  <p className="text-[15px] text-gray-500 dark:text-gray-500 mb-6">im Monat</p>
                  <dl className="space-y-2.5 text-[16px]">
                    <div className="flex justify-between gap-3">
                      <dt className="text-gray-500 dark:text-gray-500">Kontingent</dt>
                      <dd className="text-gray-700 dark:text-gray-300 tabular-nums text-right">
                        {t.minuten.toLocaleString("de-DE")} Min.
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-gray-500 dark:text-gray-500">entspricht</dt>
                      <dd className="text-gray-700 dark:text-gray-300 tabular-nums text-right">
                        ca. {t.anrufeCa.toLocaleString("de-DE")} Anrufe
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-gray-500 dark:text-gray-500">Obergrenze</dt>
                      <dd className="text-gray-700 dark:text-gray-300 tabular-nums text-right">
                        {t.obergrenze}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-gray-500 dark:text-gray-500">Einrichtung</dt>
                      <dd className="text-gray-700 dark:text-gray-300 tabular-nums text-right">
                        {t.einrichtung}
                      </dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>

            {/* 3 · Enterprise als Textzeile, ohne Kachel */}
            <p className={`${PROSE} mt-8`}>{TARIF_ENTERPRISE}</p>

            {/* 4 · Nicht pro Behandler */}
            <div className={`${CARD_ALT} mt-8`}>
              <h3 className={H3}>Nicht pro Behandler</h3>
              <p className={PROSE}>{DECKELUNG.nichtProBehandler}</p>
            </div>

            <div className={`${CARD_ALT} mt-5`}>
              <p className={PROSE}>{PERSONALKOSTEN_ANKER.text}</p>
              <p className="text-[14px] text-gray-500 dark:text-gray-500 mt-2">
                Quelle: {PERSONALKOSTEN_ANKER.source}
              </p>
            </div>
          </div>
        </section>

        {/* ── 5 · Einrichtung als Projekt + Go-live-Garantie ── */}
        <section className={SECTION_ALT}>
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <h2 className={H2}>Wofür zahlen Sie die Einrichtung?</h2>
            <p className={`${PROSE} mb-10`}>{EINRICHTUNG_PROJEKT.intro}</p>
            <ol className="space-y-4">
              {EINRICHTUNG_PROJEKT.schritte.map((s) => (
                <li key={s.nummer} className={`${CARD} flex items-start gap-5`}>
                  <span className="text-[15px] font-bold text-gray-400 dark:text-gray-500 tabular-nums mt-1 flex-shrink-0">
                    {s.nummer}
                  </span>
                  <div>
                    <h3 className="text-[19px] font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
                      {s.title}
                      {s.dauer && (
                        <span className="ml-2 text-[15px] font-normal text-gray-500 dark:text-gray-500">
                          · {s.dauer}
                        </span>
                      )}
                    </h3>
                    <p className={PROSE}>{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-10 p-8 rounded-2xl border border-gray-300 dark:border-gray-600">
              <h3 className="text-[22px] font-bold text-gray-900 dark:text-gray-100 mb-3">
                {GO_LIVE_GARANTIE.headline}
              </h3>
              <p className={PROSE}>{GO_LIVE_GARANTIE.text}</p>
            </div>
          </div>
        </section>

        {/* ── 6 · Testphase als Vetorecht ── */}
        <section className={SECTION}>
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <h2 className={H2}>Können Sie den Empfang vorher testen?</h2>
            <p className={`${PROSE} mb-5`}>
              Ja, zwei Tage lang — und wir sagen dazu, wann diese zwei Tage liegen:
              nach Vertragsabschluss und nach Zahlung der ersten Hälfte der
              Einrichtung. Es ist kein kostenloser Test, und wir wollen es auch
              nicht so nennen.
            </p>
            <p className={PROSE}>{UMKEHRBARKEIT.vetorecht}</p>
          </div>
        </section>

        {/* ── Begriffsklärung: hält „AI Rezeptionist" als Synonym auf der Seite ── */}
        <section className={SECTION_ALT}>
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <h2 className={H2}>Was kostet ein AI Rezeptionist im Vergleich?</h2>
            <div className={`${PROSE} space-y-5`}>
              <p>
                AI Rezeptionist, KI Telefonassistent, digitale Rezeption,
                Telefonannahme mit KI — gemeint ist überall dasselbe: ein System,
                das ans Telefon geht, das Anliegen aufnimmt und strukturiert
                weitergibt. Die Begriffe unterscheiden sich, die Preisfrage nicht.
              </p>
              <p>
                Worin sich Angebote tatsächlich unterscheiden, ist die
                Abrechnungsform. Verbreitet ist die Abrechnung pro Anruf oder pro
                Minute ohne Obergrenze — planbar ist das nicht, weil ausgerechnet
                der Monat teuer wird, in dem besonders viel los ist. Unser Modell
                setzt deshalb an derselben Stelle an: ein Kontingent, ein fester
                Betrag, eine benannte Obergrenze.
              </p>
            </div>
          </div>
        </section>

        {/* ── 7 · Zusätzliche Sprachen ── */}
        <section className={SECTION}>
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <h2 className={H2}>Was kostet eine weitere Sprache?</h2>
            <p className={PROSE}>{SPRACHEN.text}</p>
          </div>
        </section>

        {/* ── 8 · Laufzeit, Kündigung, Preisgarantie ── */}
        <section className={SECTION_ALT}>
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <h2 className={H2}>{VERTRAG.headline}</h2>
            <dl className="space-y-5">
              {VERTRAG.fakten.map((f) => (
                <div key={f.label} className={CARD_ALT}>
                  <dt className="text-[15px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {f.label}
                  </dt>
                  <dd className={PROSE}>{f.wert}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ── 9 · Was nicht extra kostet ── */}
        <section className={SECTION}>
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <h2 className={H2}>{NICHT_EXTRA.headline}</h2>
            <p className={`${PROSE} mb-8`}>{NICHT_EXTRA.intro}</p>
            <ul className="space-y-4">
              {NICHT_EXTRA.punkte.map((p, i) => (
                <li key={i} className={`flex items-start gap-3 ${PROSE}`}>
                  <span className={DOT} />
                  {p}
                </li>
              ))}
            </ul>
            <p className={`${PROSE} mt-8`}>
              Bei 46 % der Praxen sind versteckte Preissteigerungen oder zu hohe
              Wartungskosten ein Grund, ihr System zu wechseln. Deshalb steht diese
              Liste hier und nicht in den AGB.
            </p>
            <p className="text-[14px] text-gray-500 dark:text-gray-500 mt-2">
              Quelle: Zi, PVS-Monitoring, 2026
            </p>
          </div>
        </section>

        {/* ── Rechner: nach "Was nicht extra kostet", vor der FAQ ── */}
        <PraxisRechnerSection tone="alt" />

        {/* ── 10 · FAQ zum Preis, unbequeme Fragen zuerst ── */}
        <section className={SECTION}>
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <h2 className={H2}>Häufige Fragen zum Preis</h2>
            <div className="space-y-4">
              {faqItems.map((item, i) => (
                <div key={i} className={CARD_ALT}>
                  <h3 className={H3}>{item.question}</h3>
                  <p className={PROSE}>{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Abschluss ── */}
        <section className={SECTION_ALT}>
          <div className="max-w-2xl mx-auto px-6 lg:px-8">
            <h2 className={H2}>Ihr Angebot: schriftlich, aufgeschlüsselt, ohne Überraschungen</h2>
            <p className={`${PROSE} mb-8`}>
              Im Erstgespräch gehen wir Ihre typischen Anrufe durch und klären,
              welcher Tarif zu Ihrem Aufkommen passt. Danach erhalten Sie ein
              schriftliches Angebot mit allen Posten — und entscheiden in Ruhe.
            </p>
            <Link to="/kontakt" className={CTA_PRIMARY}>
              {CTA.primaryLabel}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <p className="mt-4 text-[15px] text-gray-500 dark:text-gray-500">
              {CTA.microcopy} Antwort von {BETREUUNG.person.name} spätestens
              innerhalb von 24 Stunden.
            </p>
          </div>
        </section>

        {/* ── Interne Verlinkung: /praxen ist der Hub ── */}
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
                <Link to="/ki-telefonassistent-arzt" className={TEXT_LINK}>
                  KI Telefonassistent für Arztpraxen
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </li>
              <li>
                <Link to="/ki-telefonassistent-praxis" className={TEXT_LINK}>
                  KI Telefonassistent für Therapiepraxen
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
