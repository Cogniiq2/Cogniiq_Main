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
import { TelefonRechnerSection } from "@/components/TelefonRechnerSection";
import { BUSINESS_INFO } from "@/lib/seo-data";
import {
  ABWICKLUNG,
  BETREUUNG,
  CTA,
  DECKELUNG,
  EINRICHTUNG,
  FAKTEN,
  EINRICHTUNG_PROJEKT,
  ZWEI_WOCHEN_GARANTIE,
  BETREUUNG_NACH_GOLIVE,
  NICHT_EXTRA,
  PERSONALKOSTEN_ANKER,
  RECHNER,
  SPRACHEN,
  TARIFE,
  TARIF_ENTERPRISE,
  UMKEHRBARKEIT,
  VERTRAG,
  ANBIETER_CHECKLISTE,
  GENERISCH_DECKELUNG,
} from "@/lib/telefonassistent-copy";
import { CTA_PRIMARY_CLASS } from "@/components/public/PublicUI";

const base = BUSINESS_INFO.website;
const url = `${base}/kosten-ki-telefonassistent`;

/*
  Die numerischen Beträge des Angebots-Schemas kommen aus den numerischen
  Zwillingen in TARIFE (`monatlichEur`); die Einrichtung ist ein Standardaufwand
  ohne freigegebenen Betrag (`EINRICHTUNG`) und steht deshalb nicht im Schema.

  Hier stand bis zum 11.09.2026 ein `toNumber`, das die ANZEIGESTRINGS zurück
  in Zahlen parste — Geschäftslogik, die an einer Tausenderpunkt-Formatierung
  hing. Ein Punkt an der falschen Stelle hätte einen falschen Preis in
  strukturierte Daten geschrieben, ohne dass im sichtbaren Text etwas auffällt.
  Die ausgegebenen Zahlen sind dieselben; diese Seite ist ein eingefrorenes
  Experiment, und ihre gerenderten Bytes ändern sich dadurch nicht.
*/

const breadcrumbs = [
  { name: "Home", url: base },
  { name: "Für Praxen", url: `${base}/praxen` },
  { name: "Kosten", url },
];

const faqItems = [
  {
    question: "Kann die Rechnung teurer werden als der Tarif?",
    answer:
      `Innerhalb des Kontingents nicht: Der Monatspreis steht fest. ${FAKTEN.deckelung} ${FAKTEN.tarifzuordnung} ${FAKTEN.deckelungGeltung}`,
  },
  {
    question: "Was kostet ein KI Telefonassistent für eine Praxis pro Monat?",
    answer:
      `${TARIFE.map((t) => `${t.monatlich} im Monat für ${t.minuten.toLocaleString("de-DE")}\u00A0Minuten`).join(", ")}. ${TARIFE[0].minuten}\u00A0Minuten entsprechen bei rund zwei Minuten je Anruf ungefähr ${TARIFE[0].anrufeCa} Anrufen – eine Annahme, keine Zusicherung. Dazu kommt einmalig die Standard-Einrichtung Ihres Empfangs; ${EINRICHTUNG.standard.charAt(0).toLowerCase()}${EINRICHTUNG.standard.slice(1)}`,
  },
  {
    question: "Was kostet die Einrichtung – und warum ist sie in jedem Tarif gleich?",
    answer:
      `${EINRICHTUNG.standard} Sie ist kein Freischalten, sondern acht Schritte Arbeit: Erstgespräch, Angebot, Unterschrift, Zugang, Ihre Vorgaben, Aufbau, Übergabe zur Freigabe und zwei Tage Testphase. ${EINRICHTUNG.sonder} ${FAKTEN.zahlungsaufteilung} ${FAKTEN.uebergabeGarantie}`,
  },
  {
    question: "Ist die Testphase kostenlos?",
    answer:
      "Nein, und das sagen wir deutlich: Die zwei Tage liegen nach Vertragsabschluss und nach Zahlung der ersten Hälfte der Einrichtung. Was Sie dafür bekommen, ist ein Vetorecht — ohne Ihre Freigabe geht der Empfang nicht live.",
  },
  {
    question: "Wird pro Behandler abgerechnet?",
    answer:
      `Nein. ${FAKTEN.nichtProBehandler} Der Monatsbetrag gilt für Ihre Praxis, unabhängig davon, wie viele Personen bei Ihnen behandeln. Wächst Ihr Team, ändert sich am Preis nichts — nur der Minutenverbrauch kann steigen.`,
  },
  {
    question: "Wie lange bin ich gebunden und wie kündige ich?",
    answer:
      `${FAKTEN.laufzeit} ${FAKTEN.kuendigung} ${FAKTEN.preisgarantie}`,
  },
  {
    question: "Was kostet ein KI Telefonassistent pro Minute?",
    answer:
      `Innerhalb des Kontingents nichts extra — die Minuten sind im Monatspreis enthalten. Rechnerisch ergibt das im kleinsten Tarif ${(TARIFE[0].monatlichEur / TARIFE[0].minuten).toLocaleString("de-DE", { style: "currency", currency: "EUR" })} je Kontingentminute (${TARIFE[0].monatlich} für ${TARIFE[0].minuten.toLocaleString("de-DE")}\u00A0Minuten). Wie Minuten über dem Kontingent berechnet werden, steht in Ihrem Angebot – wir nennen hier keinen Minutenpreis, den der Vertrag nicht bestätigt. Viele Angebote am Markt rechnen pro Minute ohne Kontingent; vergleichen Sie deshalb immer den Spitzenmonat, nicht den Minutenpreis.`,
  },
  {
    question: "Gibt es versteckte Kosten?",
    answer:
      `Keine Kostenposition wird still weggelassen: Monatspreis, Kontingent, angegebene Obergrenze, Einrichtung und Zusatzsprachen stehen auf dieser Seite; wie Minuten über dem Kontingent berechnet werden, steht in Ihrem Angebot. Zwei Posten stehen bewusst als offen da, weil sie von Ihrem System abhängen: die Anbindung an Ihre Praxissoftware und Gebühren, die Dritte für eine Schnittstelle verlangen. Beides prüfen wir vor dem Angebot und nennen es dort — nicht danach. ${FAKTEN.deckelungGeltung}`,
  },
  {
    question: "Lohnt sich ein KI Telefonassistent für eine kleine Praxis?",
    answer:
      "Das hängt an Ihrem Anrufaufkommen, nicht an Ihrer Größe. Der Rechner oben zeigt für Ihre Anrufe pro Monat Tarif, Monatsbetrag und Einrichtung; die Gegenrechnung — was eine nicht besetzte Leitung Sie kostet — kennen nur Sie. Wenn die Anmeldung zu Stoßzeiten regelmäßig nicht abnehmen kann, ist das der Fall, für den der Assistent gebaut ist; wenn Ihr Telefon selten klingelt, raten wir ab.",
  },
  {
    // Die Beträge stehen NUR in SPRACHEN. Hier stand bis zum 12.09.2026 eine
    // zweite, abgetippte Fassung, die einen Paketpreis als feststehend nannte —
    // während der Rechner dieselbe Konstellation schon als offen auswies.
    question: "Was kostet eine weitere Sprache?",
    answer: SPRACHEN.text,
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
      /*
        Beschreibung an den sichtbaren Text gezogen, 12.09.2026.

        Vorher: „Telefonische Anrufannahme für Praxen …" — das beschrieb einen
        Anrufbeantworter mit Notiz und widersprach damit dem, was die Seite
        sichtbar zusagt. Die Fassung unten nennt dieselbe Leistung wie der
        Fließtext und trägt die Anbindungsbedingung mit, statt eine universelle
        Integration zu behaupten. Keine Keyword-Liste, keine erfundenen
        Systemnamen: Was hier steht, steht auch auf der Seite.
      */
      description:
        "KI-Telefonassistent für Praxen: Der Assistent nimmt Anrufe an, führt freigegebene Routineabläufe im Gespräch zu Ende — Termin buchen, verschieben, absagen, konfigurierte Fragen beantworten — und übergibt Ausnahmen an Ihr Team. Festes Minutenkontingent, gedeckelte Monatsrechnung, einmalige Einrichtung. Direkter Schreibzugriff auf ein Praxis- oder Kalendersystem setzt eine für dieses System eingerichtete und verifizierte Anbindung voraus.",
      url,
      provider: { "@type": "Organization", name: BUSINESS_INFO.name, url: base },
      offers: [
        ...TARIFE.map((t) => ({
          "@type": "Offer",
          name: `Tarif ${t.name}`,
          description: `${t.minuten}\u00A0Minuten im Monat; bei rund zwei Minuten je Anruf ungefähr ${t.anrufeCa} Anrufe.`,
          url,
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: t.monatlichEur,
            priceCurrency: "EUR",
            unitCode: "MON",
            billingDuration: 1,
            billingIncrement: 1,
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
const CTA_PRIMARY = CTA_PRIMARY_CLASS;
const TEXT_LINK =
  "inline-flex items-center gap-2 min-h-[44px] py-3 text-[16px] font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors";

export function KostenKiTelefonassistent() {
  return (
    <>
      <PageSEO
        title="Was kostet ein KI Telefonassistent? Preise | Cogniiq"
        description="Was kostet ein KI Telefonassistent für Praxen? Tarife ab 300 € im Monat mit festem Minutenkontingent, einheitlicher Standard-Einrichtung und Übergabe in zwei Wochen."
        canonical={url}
        breadcrumbs={breadcrumbs}
        faqItems={faqItems}
        additionalSchema={schema}
      />

      <div className="min-h-screen bg-white dark:bg-gray-950">
        {/* ── Einstieg: Planbarkeit vor Betrag ── */}
        <section className="pt-32 pb-24">
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-[14px] text-pub-ink-3 dark:text-gray-500 mb-10"
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
              Nein, die Telefonierechnung kann nicht aus dem Ruder laufen. Wie
              weit sie überhaupt steigen kann, steht im nächsten Absatz — und
              zwar vollständig, nicht in einer Fußnote, einschließlich dessen,
              was die Obergrenze nicht abdeckt.
            </p>
          </div>
        </section>

        {/* ── 1 · Die Deckelung, vor der ersten Zahl ── */}
        <section className={SECTION_ALT}>
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <h2 className={H2}>{DECKELUNG.headline}</h2>
            <p className={`${PROSE} mb-4`}>{DECKELUNG.text}</p>
            {/* Der Geltungsbereich steht DIREKT hinter der Zusage, nicht als
                Fußnote: Eine Obergrenze, deren Bezug erst drei Absätze später
                kommt, wird als Gesamtdeckel gelesen. */}
            <p className={`${PROSE} mb-6`}>{DECKELUNG.geltung}</p>
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
                      angegebene Obergrenze {t.obergrenze} im Monat
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
              wie vielen Anrufen es ungefähr entspricht – unter der Annahme von rund
              zwei Minuten je Anruf, nicht als Zusicherung. Die Monatspreise
              unterscheiden sich, weil die genutzten Minuten laufende Kosten
              verursachen; eine unbegrenzte Nutzung zum festen Preis gibt es nicht.
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
                      <dt className="text-gray-500 dark:text-gray-500">angegebene Obergrenze</dt>
                      <dd className="text-gray-700 dark:text-gray-300 tabular-nums text-right">
                        {t.obergrenze}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-gray-500 dark:text-gray-500">Einrichtung</dt>
                      <dd className="text-gray-700 dark:text-gray-300 text-right">
                        {EINRICHTUNG.kurz}
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

        {/* ── 3 · Der Rechner, direkt nach den Tarifen ────────────────────────
            Bis zum 12.09.2026 stand hier gar nichts: Der Rechner lag neun
            Abschnitte weiter unten, hinter Einrichtung, Testphase, Sprachen,
            Vertrag und „was nicht extra kostet". Wer „was kostet ein KI
            Telefonassistent" sucht, will genau diese eine Frage beantwortet
            haben — und zwar für den eigenen Betrieb, nicht erst nachdem er die
            Vertragsbedingungen gelesen hat. Deckelung und Tarife stehen
            weiterhin davor, damit die Zahlen im Rechner in einen Rahmen fallen,
            den der Leser schon kennt.

            Es ist derselbe `TelefonRechner` wie auf /ki-telefonassistent, /praxen
            und der Startseite: eine Rechnung, eine Quelle. Dieser Rahmen ist
            reine Darstellung — Überschrift und Einleitung sind seitenspezifisch,
            die Arithmetik kommt aus src/lib/telefonassistent-rechner.ts. ── */}
        <TelefonRechnerSection
          tone="alt"
          headline="Was kostet das bei Ihrem Anrufaufkommen?"
          intro={[
            "Tragen Sie Ihr Anrufaufkommen ein. Der Rechner nennt den passenden Tarif nach Kontingent und den Monatsbetrag — sofort, ohne E-Mail und ohne Verkaufsgespräch. Die einmalige Standard-Einrichtung steht als offene Position dabei, bis ihr Betrag im Angebot steht.",
            "Danach können Sie weiterrechnen, ob sich das für Ihren Betrieb trägt. Für die wirtschaftlichen Felder setzen wir bewusst keine Werte ein: Stundenkosten, Routineanteil und verpasste Anrufe kennen nur Sie. Solange etwas fehlt, nennt der Rechner das Zeitpotenzial und sagt, was noch fehlt — er rechnet kein Ergebnis aus einem halben Modell.",
            "Was vor der technischen Prüfung nicht feststeht, etwa die Anbindung an Ihr System, steht als offene Position in der Liste. Nicht als Null.",
          ]}
          nachsatz={RECHNER.anbindungsHinweis}
        />

        {/* ── 5 · Einrichtung als Projekt + Zwei-Wochen-Garantie ── */}
        <section className={SECTION}>
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <h2 className={H2}>Wofür zahlen Sie die Einrichtung?</h2>
            <p className={`${PROSE} mb-10`}>{EINRICHTUNG_PROJEKT.intro}</p>
            <ol className="space-y-4">
              {EINRICHTUNG_PROJEKT.schritte.map((s) => (
                <li key={s.nummer} className={`${CARD_ALT} flex items-start gap-5`}>
                  <span className="text-[15px] font-bold text-pub-ink-3 dark:text-gray-500 tabular-nums mt-1 flex-shrink-0">
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

            <div className="mt-10 rounded-2xl border border-pub-signal/25 bg-pub-signal-wash p-8">
              <h3 className="mb-3 text-[22px] font-bold text-pub-ink">
                {ZWEI_WOCHEN_GARANTIE.headline}
              </h3>
              <p className={PROSE}>{ZWEI_WOCHEN_GARANTIE.text}</p>
              <ul className="mt-5 space-y-2.5 border-t border-pub-signal/20 pt-5">
                {ZWEI_WOCHEN_GARANTIE.mechanik.map((satz) => (
                  <li key={satz} className="flex gap-3 text-[15px] leading-relaxed text-pub-ink-2">
                    <span aria-hidden="true" className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-pub-signal" />
                    <span>{satz}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 rounded-2xl border border-pub-hairline p-8">
              <h3 className="mb-3 text-[22px] font-bold text-pub-ink">
                {BETREUUNG_NACH_GOLIVE.headline}
              </h3>
              {BETREUUNG_NACH_GOLIVE.paragraphs.map((absatz) => (
                <p key={absatz} className={`${PROSE} mt-3 first:mt-0`}>{absatz}</p>
              ))}
            </div>
          </div>
        </section>

        {/* ── 6 · Testphase als Vetorecht ── */}
        <section className={SECTION_ALT}>
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

        {/* ── Preismodelle am Markt: Muster, keine Anbieter (COPY-BRIEF §2.3) ── */}
        <section className={SECTION}>
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <h2 className={H2}>Wie KI-Telefonassistenten am Markt abgerechnet werden</h2>
            <div className={`${PROSE} space-y-5`}>
              <p>
                AI Rezeptionist, KI Telefonassistent, digitale Rezeption,
                Telefonannahme mit KI — gemeint ist überall dasselbe Produkt, und
                die Preisfrage stellt sich für alle diese Begriffe gleich. Worin
                sich Angebote tatsächlich unterscheiden, ist die Abrechnungsform.
                Vier Muster sind verbreitet; keines davon ist an sich unseriös, aber
                jedes verteilt das Mengenrisiko anders. Die Tabelle nennt Muster,
                keine Anbieter und keine Fremdpreise — die ändern sich zu schnell,
                um sie hier verlässlich zu nennen.
              </p>
            </div>
            <div className="mt-8 overflow-x-auto">
              <table className="w-full text-left text-[16px] text-gray-700 dark:text-gray-300">
                <caption className="sr-only">Abrechnungsmodelle für KI-Telefonassistenten im Vergleich</caption>
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 text-[14px] uppercase tracking-wide text-gray-500">
                    <th scope="col" className="py-3 pr-4 font-semibold">Modell</th>
                    <th scope="col" className="py-3 pr-4 font-semibold">Was Sie zahlen</th>
                    <th scope="col" className="py-3 pr-4 font-semibold">Risiko im Spitzenmonat</th>
                    <th scope="col" className="py-3 font-semibold">Woran Sie es erkennen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 align-top">
                  <tr>
                    <th scope="row" className="py-4 pr-4 font-semibold text-gray-900 dark:text-gray-100">Pro Minute, ohne Obergrenze</th>
                    <td className="py-4 pr-4">Jede Gesprächsminute wird berechnet, oft mit kleinem Grundpreis.</td>
                    <td className="py-4 pr-4">Hoch: Infektwelle, Rückrufwelle oder Kampagne treiben die Rechnung ohne Deckel.</td>
                    <td className="py-4">Preis „ab … Cent pro Minute“, kein Kontingent, keine genannte Höchstsumme.</td>
                  </tr>
                  <tr>
                    <th scope="row" className="py-4 pr-4 font-semibold text-gray-900 dark:text-gray-100">Pro Anruf</th>
                    <td className="py-4 pr-4">Fester Betrag je angenommenem Gespräch, unabhängig von der Dauer.</td>
                    <td className="py-4 pr-4">Hoch: Viele kurze Anrufe — Absagen, Nachfragen — kosten so viel wie lange.</td>
                    <td className="py-4">Preis „pro Anruf“ oder „pro Vorgang“; Anrufe, die der Assistent nur weiterleitet, zählen oft mit.</td>
                  </tr>
                  <tr>
                    <th scope="row" className="py-4 pr-4 font-semibold text-gray-900 dark:text-gray-100">Pauschale pro Behandler oder Nebenstelle</th>
                    <td className="py-4 pr-4">Monatspreis je Person oder Leitung, Anrufe meist inklusive.</td>
                    <td className="py-4 pr-4">Gering im Monat, aber der Preis wächst mit dem Team statt mit dem Anrufaufkommen.</td>
                    <td className="py-4">Preis „pro Nutzer“, „pro Arbeitsplatz“ oder „pro Behandler“.</td>
                  </tr>
                  <tr>
                    <th scope="row" className="py-4 pr-4 font-semibold text-gray-900 dark:text-gray-100">Kontingent mit Obergrenze — unser Modell</th>
                    <td className="py-4 pr-4">Fester Monatspreis für ein Minutenkontingent; die Konditionen für Minuten darüber stehen im Angebot.</td>
                    <td className="py-4 pr-4">Planbar innerhalb des Kontingents; für jeden Tarif ist eine Obergrenze angegeben, deren Geltung das Angebot festlegt.</td>
                    <td className="py-4">Kontingent, Monatspreis und angegebene Obergrenze stehen zusammen auf einer Seite — wie oben. Die Zeilen darüber beschreiben Marktmodelle, keine Cogniiq-Preise.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className={`${PROSE} space-y-5 mt-8`}>
              <p>
                {ABWICKLUNG.faehigkeit} Das ist der zweite Punkt, an dem Angebote
                auseinandergehen: Ein System, das Anliegen nur notiert, erzeugt
                nach jedem Anruf eine Aufgabe für Ihr Team — die Minute ist dann
                billig, der Anruf nicht. {ABWICKLUNG.qualifikation}
              </p>
            </div>
          </div>
        </section>

        {/* ── Fragen an jeden Anbieter — die Kaufkriterien aus der Produktseite ── */}
        <section className={SECTION_ALT}>
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <h2 className={H2}>Welche Fragen Sie jedem Anbieter zum Preis stellen sollten</h2>
            <p className={`${PROSE} mb-8`}>
              Der Preis auf der Website ist selten der Preis auf der Rechnung. Diese
              Fragen gelten für jedes Angebot — auch für unseres; die Antwort von
              Cogniiq steht jeweils darunter.
            </p>
            <dl className="space-y-8">
              {ANBIETER_CHECKLISTE.filter((k) =>
                /Rechnung|Anbindung|Ansage|Aufgabe/.test(k.frage)
              ).map((k) => (
                <div key={k.frage}>
                  <dt className="text-[19px] font-semibold text-gray-900 dark:text-gray-100">{k.frage}</dt>
                  <dd className={`${PROSE} mt-2`}>{k.warum}</dd>
                  <dd className={`${PROSE} mt-2`}>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">Bei Cogniiq: </span>
                    {k.cogniiq}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ── Generische Kostenquery: die Tariflogik gilt nicht nur für Praxen ── */}
        <section className={SECTION}>
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <h2 className={H2}>Gilt das auch außerhalb von Praxen?</h2>
            <div className={`${PROSE} space-y-5`}>
              <p>
                Die Tarife auf dieser Seite sind für Praxen formuliert — Kontingente
                in Patientenanrufen, Abrechnung pro Praxis, der Vergleichswert einer
                MFA-Stelle. Die Preislogik dahinter ist dieselbe für jeden Betrieb mit
                hohem Telefonaufkommen: {GENERISCH_DECKELUNG.text}
              </p>
              <p>{GENERISCH_DECKELUNG.geltung}</p>
              <p>
                Wie der Assistent in Handwerk, Kanzlei, Immobilienverwaltung oder
                Gastronomie arbeitet und was dort anders ist, steht auf der{" "}
                <Link to="/ki-telefonassistent" className={TEXT_LINK}>
                  branchenoffenen Produktseite
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
                ; das Angebot für Ihren Betrieb nennt Kontingent und Einrichtung
                konkret, nicht als Spanne.
              </p>
            </div>
          </div>
        </section>

        {/* ── 7 · Zusätzliche Sprachen ── */}
        <section className={SECTION_ALT}>
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <h2 className={H2}>Was kostet eine weitere Sprache?</h2>
            <p className={PROSE}>{SPRACHEN.text}</p>
          </div>
        </section>

        {/* ── 8 · Laufzeit, Kündigung, Preisgarantie ── */}
        <section className={SECTION}>
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
        <section className={SECTION_ALT}>
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
              Bei 46&nbsp;% der Praxen sind versteckte Preissteigerungen oder zu hohe
              Wartungskosten ein Grund, ihr System zu wechseln. Deshalb steht diese
              Liste hier und nicht in den AGB.
            </p>
            <p className="text-[14px] text-gray-500 dark:text-gray-500 mt-2">
              Quelle: Zi, PVS-Monitoring, 2026
            </p>
          </div>
        </section>

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
              innerhalb von 24&nbsp;Stunden.
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
                <Link to="/ki-telefonassistent-zahnarztpraxis" className={TEXT_LINK}>
                  KI Telefonassistent in der Zahnarztpraxis
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
                <Link to="/ki-telefonassistent-einfuehren" className={TEXT_LINK}>
                  Einen KI Telefonassistenten in der Praxis einführen
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
      </div>
    </>
  );
}
