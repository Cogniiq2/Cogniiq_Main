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
  const [chancenOffen, setChancenOffen] = useState(false);
  const [verpasst, setVerpasst] = useState<number | null>(null);
  const [chancenAnteil, setChancenAnteil] = useState<number | null>(null);
  const [abschluss, setAbschluss] = useState<number | null>(null);
  const [deckungsbeitrag, setDeckungsbeitrag] = useState<number | null>(null);
  const [rueckgewinn, setRueckgewinn] = useState<number | null>(null);

  const volumen = { anrufeProMonat: anrufe ?? 0, minutenProAnruf: dauer ?? 0 };

  const preis = useMemo(() => berechnePreis(volumen, sprachen), [anrufe, dauer, sprachen]); // eslint-disable-line react-hooks/exhaustive-deps

  const chancen: ChancenEingabe = chancenOffen
    ? {
        verpassteAnrufeProMonat: verpasst,
        davonChancenProzent: chancenAnteil,
        abschlussquoteProzent: abschluss,
        deckungsbeitragEur: deckungsbeitrag,
        rueckgewinnbarProzent: rueckgewinn,
      }
    : {
        verpassteAnrufeProMonat: null,
        davonChancenProzent: null,
        abschlussquoteProzent: null,
        deckungsbeitragEur: null,
        rueckgewinnbarProzent: null,
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
      anrufe, dauer, preis, stundenkosten, routineanteil, chancenOffen,
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
            {preis.sprachenMonatlichEur > 0 && (
              <Zeile
                label={
                  preis.sprachenAlsPaket
                    ? "Sprachpaket pro Monat"
                    : "Zusatzsprachen pro Monat"
                }
                wert={eur(preis.sprachenMonatlichEur)}
                hinweis="Steht als eigene Position. Ob dieser Aufschlag innerhalb der Tarif-Obergrenze liegt, weisen wir im Angebot aus — wir rechnen es hier nicht stillschweigend in die eine oder andere Richtung."
              />
            )}
            <Zeile
              label="Wiederkehrend pro Monat"
              wert={eur(preis.monatlichGesamtEur as number, 2)}
              stark
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

      {/* ── Ergebnis 2: Wirtschaftlichkeit ──────────────────────────────── */}
      <div className={`${CARD} p-6 sm:p-7`}>
        <h3 className="text-[19px] font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Was es Ihnen wert ist
        </h3>
        <p className={`${HINT} mb-6`}>
          Diese Rechnung läuft ausschließlich mit Ihren Angaben. Wir setzen
          weder einen Stundensatz noch einen Routineanteil für Sie ein.
        </p>

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
            hinweis="Ihre Einschätzung Ihres Anrufmix — nicht unsere Erfolgsquote. Diese Routineabläufe wickelt der Cogniiq-Telefonassistent vollständig automatisiert ab. Ausnahmen und bewusst menschlich gehaltene Fälle werden nach Ihren Regeln eskaliert."
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

        {!wirtschaft.rechenbar ? (
          <p className="text-[16px] text-gray-500 dark:text-gray-400 leading-[1.7] p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            Tragen Sie oben beide Werte ein — Vollkosten einer Arbeitsstunde und
            den Anteil Ihrer Anrufe, der zu konfigurierten Routineabläufen
            gehört. Ohne diese beiden Angaben bleibt die Rechnung leer: Wir
            setzen hier weder einen typischen Stundensatz noch einen
            Routineanteil für Sie ein.
          </p>
        ) : (
          <div aria-live="polite">
            <Zeile
              label="Telefonzeit pro Monat"
              wert={`${zahl(wirtschaft.telefonstundenProMonat, 1)} Std.`}
              hinweis="Gesprächsminuten ÷ 60"
            />
            <Zeile
              label="Davon konfigurierte Routineabläufe"
              wert={`${zahl(wirtschaft.automatisierbareStundenProMonat, 1)} Std.`}
              hinweis={`Telefonzeit × ${zahl(routineanteil ?? 0)} % — diese Abläufe wickelt der Assistent vollständig ab, bis zu 100 % der konfigurierten Routineanrufe. Was nicht dazugehört, bleibt bei Ihnen.`}
            />
            <Zeile
              label="Gegenwert dieser Arbeitszeit"
              wert={eur(wirtschaft.zeitwertProMonatEur)}
              hinweis="Potenziell freigesetzte Arbeitszeit, bewertet mit Ihrem Stundensatz. Das ist ausdrücklich nicht dasselbe wie eingesparte Personalkosten: Zu Geld wird diese Zeit erst, wenn Sie sie tatsächlich abbauen oder anders einsetzen."
            />
            {wirtschaft.chancenwertProMonatEur !== null && (
              <Zeile
                label="Gegenwert zurückgewonnener Anfragen"
                wert={eur(wirtschaft.chancenwertProMonatEur)}
                hinweis="Verpasste Anrufe × Chancenanteil × Abschlussquote × Deckungsbeitrag × zurückgewinnbarer Anteil — alles Ihre Angaben."
              />
            )}
            {wirtschaft.kostenProMonatEur === UNBEKANNT ? (
              <p className="pt-4 text-[16px] text-gray-600 dark:text-gray-400 leading-[1.7]">
                Solange der Tarif individuell ist, gibt es keinen Monatsbetrag,
                gegen den sich rechnen ließe. Den Nettoeffekt rechnen wir im
                Erstgespräch mit Ihrer konkreten Zahl.
              </p>
            ) : (
              <>
                <Zeile
                  label="Cogniiq pro Monat"
                  wert={`− ${eur(wirtschaft.kostenProMonatEur, 2)}`}
                />
                <Zeile
                  label="Rechnerischer Nettoeffekt pro Monat"
                  wert={eur(wirtschaft.nettoProMonatEur as number)}
                  stark
                />
                <Zeile
                  label="Erstes Jahr, inklusive Einrichtung"
                  wert={eur(wirtschaft.ersteJahrNettoEur as number)}
                  hinweis={`Nutzen × 12 − (Monatsbetrag × 12 + Einrichtung ${eur(
                    wirtschaft.einrichtungEur as number
                  )}). Die Einrichtung steht bewusst im Nenner und wird nicht weggelassen. Kosten einer Systemanbindung sind hier nicht enthalten, weil sie erst nach der technischen Prüfung feststehen.`}
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
        )}

        {/* ── Optionale zweite Ebene ───────────────────────────────────── */}
        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            aria-expanded={chancenOffen}
            onClick={() => setChancenOffen((o) => !o)}
            className="text-[16px] font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 inline-flex items-center gap-2 min-h-[44px]"
          >
            {chancenOffen ? "Optionale Rechnung ausblenden" : "Optional: Anrufe mitrechnen, die heute gar nicht ankommen"}
            <ArrowRight
              size={14}
              aria-hidden="true"
              className={`transition-transform ${chancenOffen ? "rotate-90" : ""}`}
            />
          </button>
          {chancenOffen && (
            <div className="mt-4 space-y-5">
              <p className={HINT}>
                Diese Ebene bleibt leer, bis Sie alle fünf Felder ausgefüllt
                haben. Wir setzen hier keinen Wert für Sie ein — und wir gehen
                ausdrücklich nicht davon aus, dass jeder verpasste Anruf ein
                verlorener Auftrag war.
              </p>
              <div className="grid sm:grid-cols-2 gap-5">
                <Zahlenfeld
                  label="Verpasste Anrufe pro Monat"
                  wert={verpasst}
                  onChange={setVerpasst}
                  min={0}
                  max={500}
                  step={5}
                  einheit="Anrufe"
                  schieber={false}
                  platzhalter="z. B. 40"
                />
                <Zahlenfeld
                  label="Davon echte Chancen"
                  wert={chancenAnteil}
                  onChange={setChancenAnteil}
                  min={0}
                  max={100}
                  step={5}
                  einheit="%"
                  schieber={false}
                  platzhalter="z. B. 50"
                />
                <Zahlenfeld
                  label="Abschluss- bzw. Buchungsquote"
                  wert={abschluss}
                  onChange={setAbschluss}
                  min={0}
                  max={100}
                  step={5}
                  einheit="%"
                  schieber={false}
                  platzhalter="z. B. 30"
                />
                <Zahlenfeld
                  label="Deckungsbeitrag je gewonnenem Fall"
                  hinweis="Bewusst Deckungsbeitrag statt Umsatz — nur der Deckungsbeitrag sagt etwas darüber, was ein zusätzlicher Auftrag Ihnen wirklich bringt."
                  wert={deckungsbeitrag}
                  onChange={setDeckungsbeitrag}
                  min={0}
                  max={5000}
                  step={10}
                  einheit="€"
                  schieber={false}
                  platzhalter="z. B. 200"
                />
                <Zahlenfeld
                  label="Davon halten Sie für zurückgewinnbar"
                  wert={rueckgewinn}
                  onChange={setRueckgewinn}
                  min={0}
                  max={100}
                  step={5}
                  einheit="%"
                  schieber={false}
                  platzhalter="z. B. 50"
                />
              </div>
            </div>
          )}
        </div>

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
            if (wirtschaft.rechenbar) trackEvent("roi_calculator_completed");
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
