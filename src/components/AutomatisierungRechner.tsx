// ─────────────────────────────────────────────────────────────────────────────
// Wirtschaftlichkeitsrechner für /kosten-automatisierung.
//
// KEINE ARITHMETIK IN DIESER DATEI. Alles Rechnen steht in
// `src/lib/automatisierung-rechner.ts` und ist dort einzeln von Hand
// nachgerechnet. Hier stehen Eingaben, Text und Darstellung.
//
// KEIN GATE. Kein E-Mail-Feld, keine Telefonnummer, kein Konto, kein Ergebnis
// erst nach einem Klick auf einen CTA. Wer hier rechnet, bekommt sein Ergebnis;
// der Gesprächswunsch steht danach als Angebot da, nicht als Mautstelle.
//
// KEINE ZAHL AN GA4. Gemeldet wird, DASS gerechnet wurde, nie WOMIT. Stunden,
// Stundensätze, Investitionssummen, laufende Kosten, Reduktionsanteile,
// Nettoeffekt und Amortisationsdauer bleiben im Browser.
//
// KEIN VORBELEGTER WIRTSCHAFTSWERT. Alle Felder starten leer. Ein
// Vorschlagswert wäre eine Behauptung über den Betrieb des Besuchers im Gewand
// einer Bequemlichkeit — und bei einer Investitionsentscheidung die teuerste
// Sorte Bequemlichkeit.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowRight, Info } from "lucide-react";
import { Link } from "react-router-dom";

import { trackEvent } from "@/lib/consent";
import { WOCHEN_PRO_MONAT } from "@/lib/zeitrechnung";
import {
  UNVOLLSTAENDIG,
  berechneWirtschaftlichkeit,
  eur,
  kapazitaetsEingabe,
  personalkostenEingabe,
  zahl,
  type ArbeitsModus,
  type FehlendeAngabe,
} from "@/lib/automatisierung-rechner";

const CARD =
  "rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50";
const LABEL = "text-[15px] font-medium text-gray-800 dark:text-gray-200";
const HINT = "text-[14px] text-gray-500 dark:text-gray-500 leading-[1.55]";
const ZEILE =
  "flex items-baseline justify-between gap-6 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0";

/**
 * Zahlenfeld. `null` heißt LEER und wird nie zu 0 gemacht — der Unterschied
 * trägt die ganze Ehrlichkeit dieses Rechners: 0 laufende Kosten ist eine
 * Aussage, keine laufenden Kosten eingetragen zu haben ist keine.
 */
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

/** Die Felder unter dem Namen, unter dem sie im Formular stehen. Der Kern nennt
 *  sie technisch; ein Hinweis „es fehlt noch eine Angabe" ist nur dann
 *  hilfreich, wenn er auf eine Beschriftung zeigt, die der Besucher gelesen hat. */
const FEHLT_LABEL: Record<FehlendeAngabe, string> = {
  stundenProWoche: "manuelle Stunden pro Woche",
  stundenkosten: "Vollkosten einer Arbeitsstunde",
  reduzierbarerAnteil: "realistisch reduzierbarer Anteil",
  personalkostenMonat: "monatliche Vollkosten der Position",
  vermeidbarerAnteil: "tatsächlich vermeidbarer Anteil",
  investitionEinmalig: "einmalige Investition",
  laufendeKosten: "laufende Kosten pro Monat",
};

/**
 * Die Wahl zwischen den zwei wirtschaftlichen Lesarten.
 *
 * BEWUSST NEUTRAL. Beide Karten sind gleich groß, gleich formuliert und tragen
 * dieselbe Betonung. Kein „empfohlen", kein Häkchen, kein Hinweis darauf, dass
 * Modus B fast immer das größere Ergebnis liefert — genau deshalb darf die
 * Oberfläche nicht dorthin schieben. Es ist eine Tatsachenfrage über den
 * Betrieb des Besuchers, keine Präferenz.
 */
function ModusKarte({
  aktiv,
  titel,
  erklaerung,
  onClick,
}: {
  aktiv: boolean;
  titel: string;
  erklaerung: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={aktiv}
      onClick={onClick}
      className={`text-left rounded-xl border p-5 transition-colors min-h-[44px] ${
        aktiv
          ? "border-gray-900 dark:border-gray-100 bg-gray-50 dark:bg-gray-800/60"
          : "border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
      }`}
    >
      <span className="block text-[16px] font-semibold text-gray-900 dark:text-gray-100 leading-[1.45]">
        {titel}
      </span>
      <span className="block text-[14px] text-gray-600 dark:text-gray-400 leading-[1.6] mt-2">
        {erklaerung}
      </span>
    </button>
  );
}

function Schritt({ nummer, titel }: { nummer: number; titel: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-[13px] font-bold flex items-center justify-center">
        {nummer}
      </span>
      <h3 className="text-[17px] font-semibold text-gray-900 dark:text-gray-100">{titel}</h3>
    </div>
  );
}

/** Anker, damit andere Seiten gezielt auf den Rechner verweisen können. */
export const AUTOMATISIERUNG_RECHNER_ANKER = "wirtschaftlichkeitsrechner";

export function AutomatisierungRechner() {
  const [modus, setModus] = useState<ArbeitsModus>("kapazitaet");

  // Modus A
  const [stundenProWoche, setStundenProWoche] = useState<number | null>(null);
  const [stundenkosten, setStundenkosten] = useState<number | null>(null);
  const [reduzierbar, setReduzierbar] = useState<number | null>(null);
  // Modus B
  const [personalkosten, setPersonalkosten] = useState<number | null>(null);
  const [vermeidbar, setVermeidbar] = useState<number | null>(null);
  // Investition
  const [einmalig, setEinmalig] = useState<number | null>(null);
  const [laufend, setLaufend] = useState<number | null>(null);

  /*
    „Gerechnet" wird EINMAL je Besuch gemeldet, beim ersten Eingriff in ein
    Feld — nicht bei jedem Tastendruck und nicht bei jeder Reglerbewegung. Ein
    Ereignis je Schieberpixel wäre Ereignismüll, den keine Auswertung trägt.
  */
  const startGemeldet = useRef(false);
  const fertigGemeldet = useRef(false);

  function melde() {
    if (startGemeldet.current) return;
    startGemeldet.current = true;
    trackEvent("automation_roi_started");
  }

  /** Ein Setter, der zusätzlich das Start-Ereignis auslöst. */
  function feld<T>(setzen: (v: T) => void) {
    return (v: T) => {
      melde();
      setzen(v);
    };
  }

  const arbeit = useMemo(
    () =>
      modus === "kapazitaet"
        ? kapazitaetsEingabe(stundenProWoche, stundenkosten, reduzierbar)
        : personalkostenEingabe(personalkosten, vermeidbar),
    [modus, stundenProWoche, stundenkosten, reduzierbar, personalkosten, vermeidbar]
  );

  const ergebnis = useMemo(
    () => berechneWirtschaftlichkeit(arbeit, { einmaligEur: einmalig, laufendProMonatEur: laufend }),
    [arbeit, einmalig, laufend]
  );

  /*
    Der Abschluss wird im Effekt gemeldet, nicht im Render. Ein trackEvent()
    mitten im Render liefe im StrictMode doppelt und im SSR-Durchlauf gar nicht
    — beides Gründe, aus denen Messzahlen später niemand mehr traut. Auch hier:
    einmal je Besuch, und nur DASS gerechnet wurde.
  */
  useEffect(() => {
    if (!ergebnis.vollstaendig || fertigGemeldet.current) return;
    fertigGemeldet.current = true;
    trackEvent("automation_roi_completed");
  }, [ergebnis.vollstaendig]);

  const nutzenLabel =
    modus === "kapazitaet"
      ? "Wert freigesetzter Arbeitszeit pro Monat"
      : "Tatsächlich vermeidbare Personalkosten pro Monat";

  const fehlt = ergebnis.fehlendeAngaben.map((f) => FEHLT_LABEL[f]);

  return (
    <div id={AUTOMATISIERUNG_RECHNER_ANKER} className="scroll-mt-28">
      <div className={`${CARD} p-6 lg:p-8`}>
        <p className="text-[14px] font-semibold uppercase tracking-widest text-pub-ink-3 dark:text-gray-500 mb-2">
          Wirtschaftlichkeit rechnen
        </p>
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          Lohnt sich die Automatisierung dieses Prozesses?
        </h2>
        <p className="text-[16px] text-gray-600 dark:text-gray-400 leading-[1.65] max-w-2xl">
          Alle Felder sind Ihre Angaben — auch die Investition. Cogniiq trägt hier
          bewusst keine Beträge vor: Was ein Vorhaben kostet, steht erst nach der
          Prozessaufnahme fest, und eine vorbelegte Zahl wäre eine Behauptung über
          Ihren Betrieb. Wenn Sie noch kein Angebot haben, tragen Sie die Summe ein,
          die Ihnen das Vorhaben wert wäre. Dann beantwortet der Rechner die
          nützlichere Frage: bis zu welchem Preis es sich trägt.
        </p>

        {/* ── 1 · Die wirtschaftliche Lesart ── */}
        <div className="mt-8">
          <Schritt nummer={1} titel="Was ändert sich bei Ihnen wirtschaftlich?" />
          <div role="radiogroup" aria-label="Wirtschaftliche Lesart" className="grid sm:grid-cols-2 gap-4">
            <ModusKarte
              aktiv={modus === "kapazitaet"}
              titel="Die Mitarbeit bleibt"
              erklaerung="Niemand wird abgebaut. Frei werdende Zeit fließt in andere Arbeit. Bewertet wird der Wert dieser Zeit — ausdrücklich nicht „eingesparte Personalkosten“, denn Ihre Lohnsumme ändert sich dabei nicht."
              onClick={() => {
                melde();
                setModus("kapazitaet");
              }}
            />
            <ModusKarte
              aktiv={modus === "personalkosten"}
              titel="Eine Position entfällt"
              erklaerung="Eine Stelle wird nicht nachbesetzt, eine geplante Einstellung unterbleibt oder ein externer Dienstleister wird abbestellt. Bewertet wird der Teil der Vollkosten, der dadurch wirklich wegfällt."
              onClick={() => {
                melde();
                setModus("personalkosten");
              }}
            />
          </div>
          <p className={`${HINT} mt-3`}>
            Nur eine der beiden Lesarten gilt gleichzeitig. Beide bewerten dieselbe
            Arbeitskapazität; sie zusammenzuzählen hieße, sie zweimal zu verkaufen.
          </p>
        </div>

        {/* ── 2 · Der Aufwand ── */}
        <div className="mt-10">
          <Schritt nummer={2} titel="Der heutige Aufwand" />
          <div className="space-y-6">
            {modus === "kapazitaet" ? (
              <>
                <Zahlenfeld
                  label="Manuelle Arbeit für diesen Prozess"
                  hinweis="Über alle beteiligten Personen zusammen, in einer normalen Woche."
                  wert={stundenProWoche}
                  onChange={feld(setStundenProWoche)}
                  min={0}
                  max={80}
                  step={0.5}
                  einheit="Stunden / Woche"
                  platzhalter="—"
                />
                <Zahlenfeld
                  label="Vollkosten einer Arbeitsstunde"
                  hinweis="Arbeitgeber-Vollkosten, nicht Bruttolohn: Lohnnebenkosten, Ausfallzeiten und Arbeitsplatzkosten gehören dazu. Wir schlagen keinen Wert vor — für Ihren Betrieb kennen nur Sie ihn."
                  wert={stundenkosten}
                  onChange={feld(setStundenkosten)}
                  min={0}
                  max={200}
                  einheit="€ / Stunde"
                  platzhalter="—"
                />
                <Zahlenfeld
                  label="Davon realistisch reduzierbar"
                  hinweis="Kaum ein Ablauf verschwindet vollständig. Freigaben, Rückfragen, Ausnahmen und Stichproben bleiben. Schätzen Sie eher vorsichtig — ein zu hoher Wert macht das Ergebnis wertlos."
                  wert={reduzierbar}
                  onChange={feld(setReduzierbar)}
                  min={0}
                  max={100}
                  einheit="%"
                  platzhalter="—"
                />
              </>
            ) : (
              <>
                <Zahlenfeld
                  label="Monatliche Vollkosten dieser Position"
                  hinweis="Arbeitgeber-Vollkosten der Stelle, die entfällt oder nicht entsteht — kein Netto-, kein Bruttogehalt. Bei einem externen Dienstleister: dessen Monatsrechnung."
                  wert={personalkosten}
                  onChange={feld(setPersonalkosten)}
                  min={0}
                  max={12000}
                  step={50}
                  einheit="€ / Monat"
                  platzhalter="—"
                />
                <Zahlenfeld
                  label="Davon tatsächlich vermeidbar"
                  hinweis="100 % heißt: die Position entfällt vollständig. Bleibt ein Teil der Aufgaben bestehen, gehört nur der wegfallende Teil hierher."
                  wert={vermeidbar}
                  onChange={feld(setVermeidbar)}
                  min={0}
                  max={100}
                  einheit="%"
                  platzhalter="—"
                />
              </>
            )}
          </div>
        </div>

        {/* ── 3 · Die Investition ── */}
        <div className="mt-10">
          <Schritt nummer={3} titel="Was die Automatisierung kostet" />
          <div className="space-y-6">
            <Zahlenfeld
              label="Einmalige Investition"
              hinweis="Prozessaufnahme, Umsetzung, Tests und Übergabe. Aus Ihrem Angebot — oder die Summe, bis zu der Sie bereit wären zu gehen."
              wert={einmalig}
              onChange={feld(setEinmalig)}
              min={0}
              max={50000}
              step={100}
              einheit="€ einmalig"
              platzhalter="—"
            />
            <Zahlenfeld
              label="Laufende Kosten"
              hinweis="Betrieb, Überwachung, Betreuung und Gebühren Dritter für die beteiligten Schnittstellen. 0 ist eine gültige Angabe — nicht jede Automatisierung verursacht laufende Kosten."
              wert={laufend}
              onChange={feld(setLaufend)}
              min={0}
              max={3000}
              step={10}
              einheit="€ / Monat"
              platzhalter="—"
            />
          </div>
        </div>

        {/* ── Ergebnis ── */}
        <div className="mt-10 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60 p-6">
          <h3 className="text-[17px] font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Ergebnis
          </h3>

          {modus === "kapazitaet" && ergebnis.manuelleStundenProMonat !== null && (
            <Zeile
              label="Manuelle Arbeit pro Monat"
              wert={`${zahl(ergebnis.manuelleStundenProMonat, 1)} h`}
              hinweis={`Wochenstunden × ${zahl(WOCHEN_PRO_MONAT, 2)} Wochen je Monat.`}
            />
          )}
          {modus === "kapazitaet" && ergebnis.kapazitaetswertProMonatEur !== null && (
            <Zeile
              label="Wert dieser Arbeitszeit pro Monat"
              wert={eur(ergebnis.kapazitaetswertProMonatEur)}
              hinweis="Vor Abzug des Anteils, der bestehen bleibt."
            />
          )}

          <Zeile
            label={nutzenLabel}
            wert={
              ergebnis.arbeitsnutzenProMonatEur === UNVOLLSTAENDIG
                ? "noch offen"
                : eur(ergebnis.arbeitsnutzenProMonatEur)
            }
          />
          <Zeile
            label="Laufende Kosten pro Monat"
            wert={laufend === null ? "noch offen" : eur(laufend)}
          />

          {ergebnis.vollstaendig ? (
            <>
              <Zeile
                label="Nettoeffekt pro Monat"
                wert={eur(ergebnis.nettoProMonatEur as number)}
                stark
                hinweis="Arbeitsnutzen minus laufende Kosten. Die einmalige Investition steckt hier nicht drin — sie steht in der Jahreszeile."
              />
              <Zeile
                label="Erstes Jahr, nach allen Kosten"
                wert={eur(ergebnis.ersteJahrNettoEur as number)}
                stark
                hinweis="12 Monate Nettoeffekt minus die einmalige Investition."
              />
              <Zeile
                label="Amortisation der Investition"
                wert={
                  ergebnis.amortisationMonate === null
                    ? "trägt sich nicht"
                    : `${zahl(ergebnis.amortisationMonate, 1)} Monate`
                }
                hinweis={
                  ergebnis.amortisationMonate === null
                    ? "Der monatliche Nettoeffekt ist nicht positiv. Dann gibt es keine Dauer, nach der sich die Investition zurückverdient — und wir zeigen keine."
                    : undefined
                }
              />
            </>
          ) : (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
              <Info size={16} className="flex-shrink-0 mt-0.5 text-pub-ink-3 dark:text-gray-500" />
              <div>
                <p className="text-[16px] font-semibold text-gray-900 dark:text-gray-100">
                  Wirtschaftlichkeit noch nicht vollständig berechnet
                </p>
                <p className={`${HINT} mt-1`}>
                  Es {fehlt.length === 1 ? "fehlt noch eine Angabe" : `fehlen noch ${fehlt.length} Angaben`}:{" "}
                  {fehlt.join(", ")}. Ein leeres Feld setzen wir nicht auf null — sonst
                  stünde hier ein Plus oder ein Minus, das aus einer Lücke stammt und
                  nicht aus Ihren Zahlen.
                </p>
              </div>
            </div>
          )}
        </div>

        {ergebnis.vollstaendig && (
          <p className={`${HINT} mt-4`}>
            {modus === "kapazitaet"
              ? "Gerechnet ist der Wert freigesetzter Arbeitszeit. Das ist kein Geldzufluss: Ihre Lohnsumme bleibt gleich, die Zeit steht für andere Arbeit zur Verfügung. Wer Personalkosten wirklich vermeidet, rechnet oben mit der zweiten Lesart."
              : "Gerechnet sind tatsächlich vermeidbare Personalkosten. Das gilt nur, wenn die Position wirklich entfällt oder gar nicht erst entsteht. Bleibt die Mitarbeit im Betrieb, ist die erste Lesart die richtige."}
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            to="/kontakt"
            onClick={() => trackEvent("automation_cta_clicked", "rechner")}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-700 dark:hover:bg-white transition-colors"
          >
            Prozess besprechen und einschätzen lassen
            <ArrowRight size={16} />
          </Link>
          <Link
            to="/prozessautomatisierung"
            className="inline-flex items-center gap-2 px-6 py-3.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm hover:border-gray-500 dark:hover:border-gray-400 transition-colors"
          >
            Wie Cogniiq Prozesse automatisiert
          </Link>
        </div>
        <p className={`${HINT} mt-3`}>
          Kein Formular, keine E-Mail-Adresse, kein Konto. Ihre Zahlen bleiben in
          Ihrem Browser und werden nirgendwohin übertragen.
        </p>
      </div>
    </div>
  );
}
