// ─────────────────────────────────────────────────────────────────────────────
// Preis- und Wirtschaftlichkeitsrechner für /ki-telefonassistent.
//
// EINE KOMPONENTE, ZWEI ERGEBNISSE. Preis und Wirtschaftlichkeit sind getrennte
// Rechnungen mit getrennten Ergebnisblöcken und getrenntem Hinweis — aber sie
// brauchen dieselben zwei Mengenangaben. Wer sie doppelt abfragt, verliert
// genau die Leute, die er überzeugen will. Die Mengenangaben stehen deshalb
// einmal oben; darunter rechnen beide Blöcke mit.
//
// KEINE ARITHMETIK IN DIESER DATEI. Alles Rechnen steht in
// `src/lib/telefonassistent-rechner.ts` und ist dort einzeln getestet. Hier
// stehen Eingaben, Text und Darstellung — und kein einziger Betrag als Literal.
//
// KEIN GATE. Kein E-Mail-Feld, kein Countdown, keine versteckte Voreinstellung,
// kein Ergebnis, das erst nach einem Klick auf einen CTA erscheint. Die
// Transparenz IST das Verkaufsargument; sie zu verriegeln würde es aufheben.
//
// KEINE ZAHL AN GA4. Die Ereignisse melden, DASS gerechnet wurde, nie WOMIT.
// Anrufaufkommen, Stundensätze und Deckungsbeiträge sind Geschäftszahlen des
// Besuchers und verlassen den Browser nicht.
//
// KEINE NEUE ABHÄNGIGKEIT. Vier Grundrechenarten brauchen keine Bibliothek und
// kein Diagramm.
// ─────────────────────────────────────────────────────────────────────────────
import { useCallback, useId, useMemo, useRef, useState } from "react";
import { ArrowRight, Info } from "lucide-react";
import { trackEvent } from "@/lib/consent";
import { RECHNER_LINK } from "@/lib/rechner-anker";
import {
  ABWICKLUNG,
  FAKTEN,
  SPRACHEN,
  SPRACHEN_PREISE,
  TARIF_ENTERPRISE,
} from "@/lib/telefonassistent-copy";
import {
  UNBEKANNT,
  berechnePreis,
  berechneWirtschaftlichkeit,
  eur,
  zahl,
  type ChancenEingabe,
  type FehlendeAngabe,
  type Zusatzsprachen,
} from "@/lib/telefonassistent-rechner";

/*
  Startwerte. Bewusst unauffällige Beispielgrößen, die als Beispiel benannt
  werden — nicht als Branchendurchschnitt, den wir nicht erhoben haben.
  Stundensatz und Chancenfelder starten LEER: Für sie gibt es keinen Wert, den
  wir für einen beliebigen Betrieb belegen könnten, und ein Vorschlagswert wäre
  hier eine Behauptung im Gewand einer Bequemlichkeit.
*/
const START_ANRUFE = 300;
const START_DAUER = 2;
/*
  KEIN VORGABEWERT FÜR DEN ROUTINEANTEIL — und das ist der Kern der Korrektur
  vom 11.09.2026.

  Hier standen 20 %. Die Zahl wurde als „Automatisierungsgrad" beschriftet und
  las sich damit als Aussage über Cogniiq: der Assistent schafft ein Fünftel.
  Das ist falsch und verkauft das Produkt weit unter Wert. Einen KONFIGURIERTEN
  Routineablauf wickelt der Assistent vollständig ab — bis zu 100 % der
  konfigurierten Routineanrufe, von der Annahme über das Gespräch bis zum
  abgeschlossenen Vorgang, ohne dass daraus eine Aufgabe für einen Menschen
  entsteht. Ausnahmen bleiben Ausnahmen: Notfälle, Anliegen außerhalb des
  konfigurierten Umfangs, bewusst menschlich gehaltene Fälle.

  Was tatsächlich schwankt, ist etwas anderes: WELCHER ANTEIL DER ANRUFE EINES
  BETRIEBS überhaupt zu diesen Routineabläufen gehört. Das ist eine Eigenschaft
  des Anrufmix des Kunden, keine Leistungsgrenze des Systems — und deshalb eine
  Zahl, die nur der Kunde kennt. Sie startet leer. Ein Vorschlagswert wäre hier
  wieder eine Behauptung im Gewand einer Bequemlichkeit.
*/

const CARD =
  "rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50";
const LABEL = "text-[15px] font-medium text-gray-800 dark:text-gray-200";
const HINT = "text-[14px] text-gray-500 dark:text-gray-500 leading-[1.55]";
const ZEILE =
  "flex items-baseline justify-between gap-6 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0";

/** Zahlenfeld mit optionalem Schieber. Der exakte Wert bleibt immer tippbar —
 *  ein Schieber allein macht präzise Angaben unmöglich. */
function Zahlenfeld({
  label,
  hinweis,
  wert,
  onChange,
  min,
  max,
  step = 1,
  einheit,
  schieber = true,
  platzhalter,
}: {
  label: string;
  hinweis?: string;
  wert: number | null;
  onChange: (v: number | null) => void;
  min: number;
  max: number;
  step?: number;
  einheit: string;
  schieber?: boolean;
  platzhalter?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      {hinweis && <p className={`${HINT} mt-1`}>{hinweis}</p>}
      <div className="mt-2 flex items-center gap-3">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          value={wert === null ? "" : wert}
          placeholder={platzhalter}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") return onChange(null);
            const n = Number(raw);
            onChange(Number.isFinite(n) ? Math.max(min, n) : null);
          }}
          className="w-28 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-[16px] font-semibold text-gray-900 dark:text-gray-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300"
        />
        <span className="text-[15px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {einheit}
        </span>
        {schieber && (
          <input
            type="range"
            aria-label={`${label} (Schieberegler)`}
            min={min}
            max={max}
            step={step}
            value={wert ?? min}
            onChange={(e) => onChange(Number(e.target.value))}
            className="flex-1 min-w-0 h-11 accent-gray-900 dark:accent-gray-100 cursor-pointer"
          />
        )}
      </div>
    </div>
  );
}

function Zeile({
  label,
  wert,
  stark = false,
  hinweis,
}: {
  label: string;
  wert: string;
  stark?: boolean;
  hinweis?: string;
}) {
  return (
    <div className={ZEILE}>
      <div className="min-w-0">
        <span
          className={
            stark
              ? "text-[17px] font-semibold text-gray-900 dark:text-gray-100"
              : "text-[16px] text-gray-600 dark:text-gray-400"
          }
        >
          {label}
        </span>
        {hinweis && <p className={`${HINT} mt-0.5`}>{hinweis}</p>}
      </div>
      <span
        className={`tabular-nums whitespace-nowrap ${
          stark
            ? "text-[19px] font-bold text-gray-900 dark:text-gray-100"
            : "text-[16px] font-medium text-gray-800 dark:text-gray-200"
        }`}
      >
        {wert}
      </span>
    </div>
  );
}

/**
 * Beschriftung der Felder, die für eine vollständige Rechnung nötig sind.
 *
 * Gehört hierher und nicht in den Rechenkern: Der Kern nennt die Felder bei
 * ihrem technischen Namen, die Oberfläche bei dem Namen, den der Besucher im
 * Formular gelesen hat. Beides auseinanderzuhalten heißt, dass die Meldung
 * „es fehlen noch zwei Angaben" auf Felder zeigt, die tatsächlich so
 * beschriftet sind.
 */
const FEHLT_LABEL: Record<FehlendeAngabe, string> = {
  stundenkosten: "Vollkosten einer Arbeitsstunde",
  routineanteil: "Anteil Ihrer Routineabläufe",
  verpassteAnrufe: "heute nicht bearbeitete relevante Anrufe",
  chancenanteil: "Anteil echter Chancen",
  abschlussquote: "Abschluss- bzw. Buchungsquote",
  deckungsbeitrag: "Deckungsbeitrag je gewonnenem Fall",
  rueckgewinnbar: "realistisch zurückgewinnbarer Anteil",
};

/** Nummerierte Zwischenüberschrift. Macht den Ablauf als Ablauf lesbar, ohne
 *  einen Assistenten mit Seitenwechseln zu bauen — alles bleibt auf einer
 *  Seite und jederzeit korrigierbar. */
function Schritt({ nummer, titel }: { nummer: number; titel: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-[13px] font-bold flex items-center justify-center">
        {nummer}
      </span>
      <h4 className="text-[17px] font-semibold text-gray-900 dark:text-gray-100">{titel}</h4>
    </div>
  );
}

/**
 * Darstellungsvariante — UND NUR DARSTELLUNG.
 *
 * `voll` ist die Fassung der Flaggschiff-Seite: jede Preisposition einzeln,
 * Sprachwahl, vollständiger Rechenweg.
 *
 * `kompakt` ist die Fassung für Seiten, auf denen der Rechner nicht die
 * Hauptsache ist. Sie lässt Zeilen WEG, sie rechnet nicht anders: Dieselben
 * Eingaben laufen durch dieselben Funktionen aus
 * `src/lib/telefonassistent-rechner.ts` und ergeben denselben Tarif, dieselben
 * Monatskosten und denselben Nettoeffekt. `rechner-konsistenz.test.tsx` prüft
 * genau das — zwei Fassungen, die bei gleicher Eingabe verschiedene Zahlen
 * zeigen, wären schlimmer als gar kein zweiter Rechner.
 */
export type RechnerVariante = "voll" | "kompakt";

export function TelefonRechner({ variante = "voll" }: { variante?: RechnerVariante } = {}) {
  const kompakt = variante === "kompakt";
  /*
    „Gerechnet" wird EINMAL je Besuch gemeldet, beim ersten Eingriff in ein
    Feld — nicht bei jedem Tastendruck und nicht bei jeder Reglerbewegung. Ein
    Ereignis je Schieberpixel wäre Ereignismüll, der keine Auswertung trägt.
    Gemeldet wird weiterhin nur DASS, nie WOMIT.
  */
  const preisGemeldet = useRef(false);
  const roiGemeldet = useRef(false);
  const meldePreisStart = useCallback(() => {
    if (preisGemeldet.current) return;
    preisGemeldet.current = true;
    trackEvent("price_calculator_started");
  }, []);
  const meldeRoiStart = useCallback(() => {
    if (roiGemeldet.current) return;
    roiGemeldet.current = true;
    trackEvent("roi_calculator_started");
  }, []);

  const [anrufe, setAnrufe] = useState<number | null>(START_ANRUFE);
  const [dauer, setDauer] = useState<number | null>(START_DAUER);
  const [sprachen, setSprachen] = useState<Zusatzsprachen>(0);
  const [stundenkosten, setStundenkosten] = useState<number | null>(null);
  const [routineanteil, setRoutineanteil] = useState<number | null>(null);
  const [verpasst, setVerpasst] = useState<number | null>(null);
  const [chancenAnteil, setChancenAnteil] = useState<number | null>(null);
  const [abschluss, setAbschluss] = useState<number | null>(null);
  const [deckungsbeitrag, setDeckungsbeitrag] = useState<number | null>(null);
  const [rueckgewinn, setRueckgewinn] = useState<number | null>(null);

  const volumen = { anrufeProMonat: anrufe ?? 0, minutenProAnruf: dauer ?? 0 };

  const preis = useMemo(() => berechnePreis(volumen, sprachen), [anrufe, dauer, sprachen]); // eslint-disable-line react-hooks/exhaustive-deps

  /*
    Kein Gate mehr zwischen Eingabe und Rechnung: Was der Besucher einträgt,
    geht direkt in den Kern. Der Kern entscheidet, ob es für eine vollständige
    Rechnung reicht — nicht ein aufgeklappter oder zugeklappter Bereich.
  */
  const chancen: ChancenEingabe = {
    verpassteAnrufeProMonat: verpasst,
    davonChancenProzent: chancenAnteil,
    abschlussquoteProzent: abschluss,
    deckungsbeitragEur: deckungsbeitrag,
    rueckgewinnbarProzent: rueckgewinn,
  };

  const wirtschaft = useMemo(
    () =>
      berechneWirtschaftlichkeit(
        volumen,
        preis,
        { stundenkostenEur: stundenkosten, routineanteilProzent: routineanteil },
        chancen
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      anrufe, dauer, preis, stundenkosten, routineanteil,
      verpasst, chancenAnteil, abschluss, deckungsbeitrag, rueckgewinn,
    ]
  );

  const s = preis.szenario;

  return (
    <div className="space-y-6">
      {/* ── Mengenangaben, einmal für beide Rechnungen ──────────────────── */}
      <div className={`${CARD} p-6 sm:p-7`}>
        <h3 className="text-[19px] font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Ihr Anrufaufkommen
        </h3>
        <p className={`${HINT} mb-6`}>
          Startwerte sind frei gewählte Beispiele, keine Branchenstatistik.
          Tragen Sie ein, was auf Ihren Betrieb zutrifft.
        </p>
        <div className="grid sm:grid-cols-2 gap-6">
          <Zahlenfeld
            label="Anrufe pro Monat"
            wert={anrufe}
            onChange={(v) => { meldePreisStart(); setAnrufe(v); }}
            min={0}
            max={3000}
            step={10}
            einheit="Anrufe"
          />
          <Zahlenfeld
            label="Durchschnittliche Gesprächsdauer"
            wert={dauer}
            onChange={(v) => { meldePreisStart(); setDauer(v); }}
            min={0}
            max={15}
            step={0.5}
            einheit="Minuten"
          />
        </div>

        {!kompakt && (
        <fieldset className="mt-6">
          <legend className={LABEL}>Sprachen</legend>
          <p className={`${HINT} mt-1 mb-3`}>{SPRACHEN.text}</p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                [0, "Nur Deutsch"],
                [1, "+ 1 Sprache"],
                [2, "+ 2 Sprachen"],
                [3, `+ ${SPRACHEN_PREISE.paketAbZusatzsprachen} oder mehr`],
              ] as Array<[Zusatzsprachen, string]>
            ).map(([wert, text]) => (
              <button
                key={wert}
                type="button"
                aria-pressed={sprachen === wert}
                onClick={() => { meldePreisStart(); setSprachen(wert); }}
                className={`px-4 py-2.5 rounded-lg text-[15px] font-medium border transition-colors ${
                  sprachen === wert
                    ? "border-gray-900 dark:border-gray-100 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                    : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-500"
                }`}
              >
                {text}
              </button>
            ))}
          </div>
        </fieldset>
        )}
      </div>

      {/* ── Ergebnis 1: Preis ───────────────────────────────────────────── */}
      <div className={`${CARD} p-6 sm:p-7`} aria-live="polite">
        <h3 className="text-[19px] font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Was das bei Ihnen kostet
        </h3>
        <p className={`${HINT} mb-5`}>
          Sofort, ohne E-Mail. Keine Kostenposition wird still weggelassen: Was
          noch nicht feststeht, steht als offen in der Liste — nicht als Null.
        </p>

        <Zeile
          label="Gesprächsminuten pro Monat"
          wert={`${zahl(preis.minutenProMonat)} Min.`}
          hinweis="Anrufe × durchschnittliche Gesprächsdauer"
        />

        {preis.modus === "individuell" || !s ? (
          <>
            <Zeile label="Passender Tarif" wert="Individuell" />
            <p className="pt-4 text-[16px] text-gray-600 dark:text-gray-400 leading-[1.7]">
              Bei diesem Aufkommen liefe auch der größte Listentarif dauerhaft an
              seiner Obergrenze — genau der Zustand, den wir vertraglich
              ausschließen. Dafür gilt kein Listenpreis: {TARIF_ENTERPRISE} Was
              es für Ihr Aufkommen konkret ist, rechnen wir im Erstgespräch aus,
              statt es hier zu schätzen.
            </p>
          </>
        ) : (
          <>
            <Zeile label="Passender Tarif" wert={s.tarif.name} />
            {!kompakt && (
            <Zeile
              label="Enthaltene Minuten"
              wert={`${zahl(s.tarif.minuten)} Min.`}
            />
            )}
            {!kompakt && (
            <Zeile label="Monatlicher Grundpreis" wert={s.tarif.monatlich} />
            )}
            {!kompakt && (
            <Zeile
              label="Mehrverbrauch"
              wert={
                s.mehrverbrauchMinuten > 0
                  ? `${zahl(s.mehrverbrauchMinuten)} Min. · ${eur(s.mehrverbrauchEur, 2)}`
                  : "keiner"
              }
              hinweis={
                s.mehrverbrauchMinuten > 0
                  ? `Jede Minute über dem Kontingent: ${FAKTEN.mehrpreisProMinute}`
                  : undefined
              }
            />
            )}
            {!kompakt && (
            <Zeile
              label="Telefonie pro Monat"
              wert={eur(s.telefonieMonatlichEur, 2)}
              hinweis={
                s.amDeckel
                  ? `Auf die Obergrenze Ihres Tarifs gedeckelt (${s.tarif.obergrenze}). Läuft ein Tarif dauerhaft am Deckel, ordnen wir Sie dem günstigeren nächsten Tarif zu.`
                  : `Obergrenze dieses Tarifs: ${s.tarif.obergrenze} — mehr wird es in keinem Monat.`
              }
            />
            )}
            {preis.sprachenOffen ? (
              <Zeile
                label="Zusatzsprachen pro Monat"
                wert="nach Sprachauswahl im Angebot"
                hinweis={
                  'Ab zwei Zusatzsprachen lässt unsere eigene Preisliste zwei Lesarten zu: Ob „ab drei Sprachen" Deutsch mitzählt, steht dort nicht. Wir raten das hier nicht, sondern weisen die Position aus und beziffern sie im Angebot. Auf null setzen wir sie ausdrücklich nicht.'
                }
              />
            ) : (
              (preis.sprachenMonatlichEur as number) > 0 && (
                <Zeile
                  label="Zusatzsprachen pro Monat"
                  wert={eur(preis.sprachenMonatlichEur as number)}
                  hinweis="Steht als eigene Position. Ob dieser Aufschlag innerhalb der Tarif-Obergrenze liegt, weisen wir im Angebot aus — wir rechnen es hier nicht stillschweigend in die eine oder andere Richtung."
                />
              )
            )}
            <Zeile
              label="Wiederkehrend pro Monat"
              wert={
                preis.monatlichGesamtEur === UNBEKANNT
                  ? "Telefonie steht fest, Sprachaufschlag im Angebot"
                  : eur(preis.monatlichGesamtEur, 2)
              }
              stark
              hinweis={
                preis.monatlichGesamtEur === UNBEKANNT
                  ? `Die Telefonie kostet ${eur(s.telefonieMonatlichEur, 2)} im Monat. Eine Summe nennen wir erst, wenn der Sprachaufschlag feststeht — eine Summe ohne ihn wäre niedriger als Ihre spätere Rechnung.`
                  : undefined
              }
            />
            <Zeile
              label="Einmalige Einrichtung"
              wert={s.tarif.einrichtung}
              hinweis="Zur Hälfte bei Vertragsabschluss, zur Hälfte nach dem Go-live."
            />
          </>
        )}

        <Zeile
          label="Anbindung an Ihr System"
          wert="noch offen"
          hinweis="Wird vor Vertragsabschluss nach der technischen Prüfung ausgewiesen — einschließlich Gebühren, die Dritte für eine Schnittstelle verlangen. Wir setzen diese Position hier bewusst nicht auf null."
        />

        <p className={`${HINT} mt-5 flex items-start gap-2`}>
          <Info size={14} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            {FAKTEN.laufzeit} Wie sich dieser Aufschlag im Einzelnen bemisst,
            steht in Ihrem Angebot; diese Rechnung bildet ihn deshalb nicht ab,
            statt ihn zu raten. {FAKTEN.preisgarantie}
          </span>
        </p>
      </div>

      {/* ── Ergebnis 2: Wirtschaftlichkeit ──────────────────────────────
          Der Ablauf ist bewusst fortlaufend und vollständig sichtbar:
          Personalkosten, dann die Anrufe, die heute niemanden erreichen, dann
          das Ergebnis. Der zweite Block lag früher hinter „Optional
          erweitern" — und damit lag der in vielen Betrieben größte Posten
          außerhalb der Rechnung, während der Cogniiq-Monatsbetrag drinstand.
          Wer ihn nicht öffnete, bekam eine negative Überschrift aus einem
          halben Modell zu sehen. ────────────────────────────────────────── */}
      <div className={`${CARD} p-6 sm:p-7`}>
        <h3 className="text-[19px] font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Und was bringt es Ihnen?
        </h3>
        <p className={`${HINT} mb-7`}>
          Zwei Fragen, dann steht die Rechnung. Sie läuft ausschließlich mit
          Ihren Angaben — wir setzen weder einen Stundensatz noch einen
          Routineanteil, eine Abschlussquote oder einen Deckungsbeitrag für Sie
          ein. Felder, die Sie nicht wissen, lassen Sie leer; dann rechnen wir
          diesen Teil nicht.
        </p>

        {/* ── Schritt 1: Personalkosten ─────────────────────────────────── */}
        <Schritt nummer={1} titel="Was Sie die Telefonzeit heute kostet" />
        <div className="grid sm:grid-cols-2 gap-6 mb-6">
          <Zahlenfeld
            label="Vollkosten einer Arbeitsstunde"
            hinweis="Bruttolohn plus Arbeitgeberkosten der Person, die sonst ans Telefon geht."
            wert={stundenkosten}
            onChange={(v) => { meldeRoiStart(); setStundenkosten(v); }}
            min={0}
            max={150}
            step={1}
            einheit="€ / Stunde"
            schieber={false}
            platzhalter="z. B. 35"
          />
          <Zahlenfeld
            label="Anteil Ihrer Anrufe, die zu konfigurierten Routineabläufen gehören"
            hinweis="Ihre Einschätzung Ihres Anrufmix — nicht unsere Erfolgsquote. Diese Routineabläufe wickelt der Cogniiq-Telefonassistent vollständig ab: annehmen, sprechen, buchen, verschieben, absagen, abschließen. Ausnahmen und bewusst menschlich gehaltene Fälle werden nach Ihren Regeln eskaliert."
            wert={routineanteil}
            onChange={(v) => { meldeRoiStart(); setRoutineanteil(v); }}
            min={0}
            max={100}
            step={5}
            einheit="%"
            schieber={false}
            platzhalter="z. B. 60"
          />
        </div>

        {wirtschaft.zeitpotenzialRechenbar && (
          <div
            className="mb-8 rounded-xl bg-gray-50 dark:bg-gray-800/50 px-5 py-4"
            aria-live="polite"
          >
            {/*
              Zwischenstand, und die Überschrift sagt genau das. NICHT „ROI",
              nicht „Gesamtersparnis", nicht „wirtschaftlicher Gesamteffekt":
              Das hier ist EIN Posten von zweien.
            */}
            <p className="text-[13px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
              Zwischenstand · Potenzial aus Arbeitszeit
            </p>
            <Zeile
              label="Telefonzeit pro Monat"
              wert={`${zahl(wirtschaft.telefonstundenProMonat, 1)} Std.`}
              hinweis="Gesprächsminuten ÷ 60"
            />
            <Zeile
              label="Davon konfigurierte Routineabläufe"
              wert={`${zahl(wirtschaft.routinestundenProMonat, 1)} Std.`}
              hinweis={`Telefonzeit × ${zahl(routineanteil ?? 0)} % — diese Abläufe wickelt der Assistent vollständig ab, bis zu 100 % der konfigurierten Routineanrufe. Was nicht dazugehört, bleibt bei Ihnen.`}
            />
            <Zeile
              label="Gegenwert dieser Arbeitszeit"
              wert={eur(wirtschaft.zeitwertProMonatEur ?? 0)}
              stark
              hinweis="Freigesetzte Arbeitszeit ist nicht automatisch eingesparte Personalkosten. Zu Geld wird sie erst, wenn Sie sie tatsächlich abbauen oder anders einsetzen."
            />
          </div>
        )}

        {/* ── Schritt 2: Chancen ────────────────────────────────────────── */}
        <Schritt nummer={2} titel="Anrufe, die Sie heute nicht erreichen" />
        <p className={`${HINT} mb-5`}>
          Für viele Betriebe ist das der größere Posten — und deshalb steht er
          hier und nicht hinter einem Ausklapper. Wir nehmen ausdrücklich nicht
          an, dass jeder verpasste Anruf ein verlorener Auftrag war: Sie geben
          an, wie viel davon realistisch übrig bleibt.
        </p>
        <div className="grid sm:grid-cols-2 gap-6">
          <Zahlenfeld
            label="Relevante Anrufe pro Monat, die Sie heute nicht oder nicht rechtzeitig bearbeiten"
            hinweis="Ihre Schätzung. Wir setzen hier keine Verpasstquote ein. Tragen Sie 0 ein, wenn Sie keine verpassen — das ist eine vollständige Angabe, kein leeres Feld."
            wert={verpasst}
            onChange={(v) => { meldeRoiStart(); setVerpasst(v); }}
            min={0}
            max={500}
            step={5}
            einheit="Anrufe"
            schieber={false}
            platzhalter="z. B. 40"
          />
        </div>

        {/*
          Die vier Trichterfelder erscheinen erst, wenn es überhaupt etwas zu
          bewerten gibt. Bei 0 verpassten Anrufen wäre jede weitere Frage
          sinnlos — und die Rechnung ist dann trotzdem VOLLSTÄNDIG, mit einem
          Chancenwert von null. Dass danach ein negatives Gesamtergebnis stehen
          kann, ist kein Fehler, sondern die Antwort für diesen Betrieb.
        */}
        {(verpasst ?? 0) > 0 && (
          <div className="mt-6 grid sm:grid-cols-2 gap-6">
            <Zahlenfeld
              label="Davon echte Chancen"
              hinweis="Wie viele dieser Anrufe wollten wirklich etwas buchen, bestellen oder beauftragen — Werbeanrufe, Rückfragen und Irrläufer zählen nicht mit."
              wert={chancenAnteil}
              onChange={(v) => { meldeRoiStart(); setChancenAnteil(v); }}
              min={0} max={100} step={5} einheit="%" schieber={false} platzhalter="z. B. 50"
            />
            <Zahlenfeld
              label="Abschluss- bzw. Buchungsquote"
              hinweis="Von den echten Chancen: Wie viele werden bei Ihnen erfahrungsgemäß ein Termin oder ein Auftrag, wenn Sie sie erreichen?"
              wert={abschluss}
              onChange={(v) => { meldeRoiStart(); setAbschluss(v); }}
              min={0} max={100} step={5} einheit="%" schieber={false} platzhalter="z. B. 30"
            />
            <Zahlenfeld
              label="Deckungsbeitrag je gewonnenem Fall"
              hinweis="Was Ihnen von diesem Auftrag oder Termin ungefähr bleibt, nachdem die direkt damit verbundenen Kosten abgezogen sind — Material, Fremdleistung, variable Kosten. Bewusst nicht der Umsatz: Nur der Deckungsbeitrag sagt, was ein zusätzlicher Fall Ihnen wirklich bringt."
              wert={deckungsbeitrag}
              onChange={(v) => { meldeRoiStart(); setDeckungsbeitrag(v); }}
              min={0} max={5000} step={10} einheit="€" schieber={false} platzhalter="z. B. 200"
            />
            <Zahlenfeld
              label="Davon realistisch zurückgewinnbar"
              hinweis="Nicht jeder, der niemanden erreicht, wäre zu halten gewesen — manche hatten schon woanders gebucht. Ihre Einschätzung."
              wert={rueckgewinn}
              onChange={(v) => { meldeRoiStart(); setRueckgewinn(v); }}
              min={0} max={100} step={5} einheit="%" schieber={false} platzhalter="z. B. 50"
            />
          </div>
        )}

        {wirtschaft.chancenRechenbar && (
          <div
            className="mt-6 rounded-xl bg-gray-50 dark:bg-gray-800/50 px-5 py-4"
            aria-live="polite"
          >
            <p className="text-[13px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
              Zwischenstand · Potenzial aus zurückgewonnenen Anfragen
            </p>
            <Zeile
              label="Zurückgewinnbarer Deckungsbeitrag"
              wert={eur(wirtschaft.chancenwertProMonatEur ?? 0)}
              stark
              hinweis={
                (verpasst ?? 0) > 0
                  ? `${zahl(verpasst ?? 0)} Anrufe × ${zahl(chancenAnteil ?? 0)} % echte Chancen × ${zahl(abschluss ?? 0)} % Abschlussquote × ${eur(deckungsbeitrag ?? 0)} Deckungsbeitrag × ${zahl(rueckgewinn ?? 0)} % zurückgewinnbar. Jeder Faktor ist Ihre Angabe.`
                  : "Sie haben angegeben, dass Sie keine relevanten Anrufe verpassen. Dann gibt es aus diesem Posten nichts zurückzugewinnen — die Rechnung ist damit vollständig."
              }
            />
          </div>
        )}

        {/* ── Ergebnis ─────────────────────────────────────────────────── */}
        <div className="mt-8 pt-7 border-t border-gray-200 dark:border-gray-700" aria-live="polite">
          {wirtschaft.kostenProMonatEur === UNBEKANNT ? (
            <>
              <h4 className="text-[17px] font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Wirtschaftlichkeit noch nicht berechenbar
              </h4>
              <p className="text-[16px] text-gray-600 dark:text-gray-400 leading-[1.7]">
                Solange der monatliche Betrag nicht feststeht — im individuellen
                Tarif oder bei noch offenem Sprachaufschlag — gibt es keinen
                Betrag, gegen den sich rechnen ließe. Ihr Zeit- und
                Chancenpotenzial oben bleibt davon unberührt; den Nettoeffekt
                rechnen wir im Erstgespräch mit Ihrer konkreten Zahl.
              </p>
            </>
          ) : !wirtschaft.vollstaendig ? (
            /*
              DER NEUTRALE ZUSTAND. Weder positiv noch negativ — und
              ausdrücklich keine Zahl. Hier stand vorher ein Nettoeffekt, in den
              ein fehlender Chancenwert als 0 einging; die Überschrift las sich
              dann als „rechnet sich nicht", obwohl nur die Frage nach den
              verpassten Anrufen noch unbeantwortet war.
            */
            <>
              <h4 className="text-[17px] font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Wirtschaftlichkeit noch nicht vollständig berechnet
              </h4>
              <p className="text-[16px] text-gray-600 dark:text-gray-400 leading-[1.7] mb-4">
                Ihre bisherige Rechnung berücksichtigt noch nicht alle
                wirtschaftlichen Effekte. Ergänzen Sie die Angaben zu
                verpassten beziehungsweise nicht bearbeiteten Anrufen, damit wir
                den vollständigen Vergleich berechnen können. Bis dahin zeigen
                wir kein Gesamtergebnis — weder ein gutes noch ein schlechtes.
              </p>
              <p className="text-[16px] font-medium text-gray-800 dark:text-gray-200">
                Es {wirtschaft.fehlendeAngaben.length === 1 ? "fehlt noch eine Angabe" : `fehlen noch ${zahl(wirtschaft.fehlendeAngaben.length)} Angaben`}:{" "}
                {wirtschaft.fehlendeAngaben.map((f) => FEHLT_LABEL[f]).join(", ")}.
              </p>
            </>
          ) : (
            <>
              <h4 className="text-[17px] font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Ihr wirtschaftliches Gesamtergebnis
              </h4>
              <Zeile
                label="Potenzial aus Arbeitszeit"
                wert={eur(wirtschaft.zeitwertProMonatEur ?? 0)}
              />
              <Zeile
                label="Potenzial aus zurückgewonnenen Anfragen"
                wert={eur(wirtschaft.chancenwertProMonatEur ?? 0)}
              />
              <Zeile
                label="Cogniiq pro Monat"
                wert={`− ${eur(wirtschaft.kostenProMonatEur, 2)}`}
              />
              <Zeile
                label="Rechnerischer Nettoeffekt pro Monat"
                wert={eur(wirtschaft.nettoProMonatEur as number)}
                stark
                hinweis={
                  (wirtschaft.nettoProMonatEur as number) < 0
                    ? "Mit Ihren Angaben trägt sich der Empfang rechnerisch nicht. Das ist ein ehrliches Ergebnis und ein guter Grund, das Erstgespräch kurz zu halten — oder es sich zu sparen."
                    : undefined
                }
              />
              <Zeile
                label="Erstes Jahr, inklusive Einrichtung"
                wert={eur(wirtschaft.ersteJahrNettoEur as number)}
                hinweis={`Nutzen × 12 − (Monatsbetrag × 12 + Einrichtung ${eur(
                  wirtschaft.einrichtungEur as number
                )}) = Nutzen × 12 − ${eur(wirtschaft.ersteJahrKostenEur as number)}. Die Einrichtung steht bewusst im Nenner und wird nicht weggelassen. Kosten einer Systemanbindung sind hier nicht enthalten, weil sie erst nach der technischen Prüfung feststehen.`}
              />
              <Zeile
                label="Einrichtung hereingeholt nach"
                wert={
                  wirtschaft.amortisationMonate === null
                    ? "— bei diesen Angaben nicht"
                    : `${zahl(wirtschaft.amortisationMonate, 1)} Monaten`
                }
                hinweis={
                  wirtschaft.amortisationMonate === null
                    ? "Der Nettoeffekt ist mit Ihren Angaben null oder negativ. Dann gibt es keine Amortisationszeit, und wir zeigen auch keine."
                    : undefined
                }
              />
            </>
          )}
        </div>

        {/* ── Was diese Rechnung bewusst NICHT enthält ──────────────────── */}
        <details className="mt-7 pt-6 border-t border-gray-100 dark:border-gray-800">
          <summary className="text-[16px] font-semibold text-gray-700 dark:text-gray-300 cursor-pointer min-h-[44px] flex items-center">
            Was diese Rechnung bewusst nicht enthält
          </summary>
          {/*
            HIER gehört das Optionale hin — nicht die Chancenökonomie. Das sind
            Größen, für die wir keine belastbare Modellierung haben; sie zu
            schätzen würde das Ergebnis beliebig machen. Sie stehen als Liste
            da, damit niemand sie für eingerechnet hält.
          */}
          <ul className="mt-4 space-y-2.5 text-[16px] text-gray-600 dark:text-gray-400 leading-[1.7]">
            <li>
              <strong className="font-semibold text-gray-800 dark:text-gray-200">Wachstum und Saison.</strong>{" "}
              Gerechnet wird ein Durchschnittsmonat. Wer im Sommer das Dreifache
              telefoniert, verschiebt Tarif und Nutzen — beides.
            </li>
            <li>
              <strong className="font-semibold text-gray-800 dark:text-gray-200">Mehrere Standorte.</strong>{" "}
              Abgerechnet wird je Betrieb. Für mehrere Standorte rechnen wir im
              Erstgespräch, statt hier zu multiplizieren.
            </li>
            <li>
              <strong className="font-semibold text-gray-800 dark:text-gray-200">Ein alternatives Personalszenario.</strong>{" "}
              Was eine zusätzliche Kraft am Empfang kosten würde, hängt an Ihrem
              Arbeitsmarkt. Diesen Vergleich stellen wir nicht an Ihrer Stelle an.
            </li>
            <li>
              <strong className="font-semibold text-gray-800 dark:text-gray-200">Nacharbeit nach dem Gespräch.</strong>{" "}
              Die Telefonzeit oben ist die Gesprächszeit. Notieren, Eintragen und
              Weiterleiten kommen in vielen Betrieben dazu — bei konfigurierten
              Routineabläufen entfallen sie, hier sind sie trotzdem nicht
              eingerechnet.
            </li>
            <li>
              <strong className="font-semibold text-gray-800 dark:text-gray-200">Kosten einer Systemanbindung.</strong>{" "}
              Einschließlich der Gebühren, die Dritte für eine Schnittstelle
              verlangen. Sie stehen erst nach der technischen Prüfung fest und
              erscheinen deshalb als offene Position, nicht als null.
            </li>
          </ul>
        </details>

        <p className="mt-6 text-[15px] text-gray-600 dark:text-gray-400 leading-[1.65] p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
          <strong className="font-semibold text-gray-800 dark:text-gray-200">
            Keine Erfolgsprognose.
          </strong>{" "}
          Die Berechnung basiert auf Ihren Angaben und zeigt ein Szenario. Sie
          enthält keine Zusage über Einsparungen, Abschlüsse oder eine
          Übernahmequote. {ABWICKLUNG.kurz.replace(/\.$/, "")} gilt für alle
          Abläufe, die in Ihr System schreiben.
        </p>
      </div>

      <p className={HINT}>
        Alle Zahlen werden in Ihrem Browser gerechnet. Ihre Eingaben werden
        nicht gespeichert, nicht übertragen und nicht an Analysedienste
        gemeldet.
      </p>

      {/*
        Ereignisse melden, DASS gerechnet wurde — nie womit. Ausgelöst beim
        Klick auf den Abschluss-CTA, nicht bei jedem Tastendruck, damit ein
        Besucher beim Tippen keine Ereignislawine erzeugt.
      */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/*
          In der kompakten Fassung führt der erste Weg auf die vollständige
          Fassung, nicht auf ein Formular: Wer hier rechnet, will erst zu Ende
          rechnen. Der Demo-Weg bleibt daneben stehen und behält sein Gewicht.
        */}
        {kompakt && (
          <a
            href={RECHNER_LINK}
            onClick={() => trackEvent("calculator_anchor_click", "Kompaktrechner")}
            className="inline-flex items-center justify-center gap-2.5 px-7 py-4 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-semibold text-[15px] hover:border-gray-500 dark:hover:border-gray-500 transition-colors"
          >
            Vollständigen Rechner öffnen
            <ArrowRight size={14} aria-hidden="true" />
          </a>
        )}
        <a
          href="/ki-telefonassistent/demo"
          onClick={() => {
            trackEvent("price_calculator_completed");
            if (wirtschaft.vollstaendig) trackEvent("roi_calculator_completed");
            trackEvent("cta_demo_click", "Rechner");
          }}
          className="inline-flex items-center justify-center gap-2.5 px-7 py-4 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold text-[15px] hover:bg-gray-700 dark:hover:bg-white transition-colors"
        >
          Zahlen gemeinsam durchgehen
          <ArrowRight size={14} aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
