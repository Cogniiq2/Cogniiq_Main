// ─────────────────────────────────────────────────────────────────────────────
// Preis- und Nutzenrechner für /ki-telefonassistent.
//
// EINE KOMPONENTE, ZWEI ERGEBNISSE. Preis und Nutzen sind getrennte Rechnungen
// mit getrennten Ergebnisblöcken — aber sie brauchen dieselben Mengenangaben.
// Die stehen deshalb einmal oben; darunter rechnen beide Blöcke mit.
//
// KEINE ARITHMETIK IN DIESER DATEI. Alles Rechnen steht in
// `src/lib/telefonassistent-rechner.ts` und ist dort einzeln getestet. Hier
// stehen Eingaben, Text und Darstellung — und kein einziger Betrag als Literal.
//
// KEIN GATE. Kein E-Mail-Feld, kein Countdown, keine versteckte Voreinstellung,
// kein Ergebnis, das erst nach einem Klick auf einen CTA erscheint.
//
// DREI BAUSTEINE STATT EINES „ROI". Seit dem 23.10.2026 trennt der Rechner,
// was vorher in einer Zahl verschwand: Zeit (Stunden), tatsächlich entfallende
// Kosten (Euro) und zusätzliche Termine (Euro, nur mit Kapazität). Nur die
// beiden Geldbausteine gehen in den Saldo; ein Euro-Zeitwert bleibt daneben
// stehen. Jeder Baustein ist freiwillig — was nicht gewählt ist, steht nicht
// in der Rechnung und wird nicht still auf null gesetzt.
//
// KEINE ZAHL AN GA4. Die Ereignisse melden, DASS gerechnet wurde, nie WOMIT.
// Anrufaufkommen, Stundensätze und Deckungsbeiträge sind Geschäftszahlen des
// Besuchers und verlassen den Browser nicht — auch nicht über die URL.
// ─────────────────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowRight, Info } from "lucide-react";
import { magneticHandlers, reducedMotion } from "@/lib/publicMotion";

const magnetic = magneticHandlers(4);
import { trackEvent } from "@/lib/consent";
import { RECHNER_LINK } from "@/lib/rechner-anker";
import {
  ABWICKLUNG,
  EINRICHTUNG,
  FAKTEN,
  SPRACHEN,
  SPRACHEN_PREISE,
  TARIF_ENTERPRISE,
} from "@/lib/telefonassistent-copy";
import {
  UNBEKANNT,
  UNVOLLSTAENDIG,
  berechneNutzen,
  berechnePreis,
  eur,
  zahl,
  type FehlendeAngabe,
  type NutzenEingabe,
  type Zusatzsprachen,
} from "@/lib/telefonassistent-rechner";

/*
  Startwerte für das Aufkommen. Bewusst unauffällige Beispielgrößen, die als
  Beispiel beschriftet sind — nicht als Branchendurchschnitt, den wir nicht
  erhoben haben. Alle Nutzenfelder starten LEER: Für sie gibt es keinen Wert,
  den wir für einen beliebigen Betrieb belegen könnten.
*/
const START_ANRUFE = 200;
const START_DAUER = 2;

const CARD =
  "rounded-[22px] border border-pub-hairline bg-white shadow-[0_1px_2px_rgba(11,15,20,0.03),0_24px_60px_-32px_rgba(11,15,20,0.16)] dark:border-gray-800 dark:bg-gray-900/50";
const LABEL = "text-[15px] font-medium text-gray-800 dark:text-gray-200";
const HINT = "text-[14px] text-pub-ink-3 dark:text-gray-500 leading-[1.55]";
const ZEILE =
  "flex items-baseline justify-between gap-6 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0";
const KASTEN = "rounded-2xl bg-pub-paper-2 px-5 py-4 ring-1 ring-pub-hairline-soft dark:bg-gray-800/50";

/** Rollender Betrag. Zeigt beim Mount und ohne Animationsumgebung sofort den
 *  Endwert; nur eine ÄNDERUNG wird über ~550 ms hochgezählt. Während des
 *  Rollens trägt ein `sr-only`-Span den Endwert, damit der `aria-live`-Bereich
 *  darüber nicht jeden Zwischenwert ansagt; danach steht genau ein Span. */
function Rollwert({ wert, format }: { wert: number; format: (n: number) => string }) {
  const [anzeige, setAnzeige] = useState(wert);
  const [rollt, setRollt] = useState(false);
  const gezeigt = useRef(wert);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const start = gezeigt.current;
    if (start === wert) return;
    if (typeof requestAnimationFrame !== "function" || reducedMotion()) {
      gezeigt.current = wert;
      setAnzeige(wert);
      return;
    }
    const dauer = 550;
    const t0 = performance.now();
    setRollt(true);
    const schritt = (t: number) => {
      const p = Math.min(1, (t - t0) / dauer);
      const e = 1 - Math.pow(1 - p, 3);
      const v = p < 1 ? start + (wert - start) * e : wert;
      gezeigt.current = v;
      setAnzeige(v);
      if (p < 1) {
        frame.current = requestAnimationFrame(schritt);
      } else {
        frame.current = null;
        setRollt(false);
      }
    };
    frame.current = requestAnimationFrame(schritt);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
    };
  }, [wert]);

  if (!rollt) return <span>{format(wert)}</span>;
  return (
    <>
      <span aria-hidden="true">{format(anzeige)}</span>
      <span className="sr-only">{format(wert)}</span>
    </>
  );
}

/** Lässt eine CSS-Animation (`klasse`) genau dann laufen, wenn sich `schluessel`
 *  ändert — nicht beim ersten Rendern. */
function PulsBeiWechsel({
  schluessel,
  klasse,
  className,
  children,
}: {
  schluessel: string | number;
  klasse: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [tick, setTick] = useState(0);
  const vorher = useRef(schluessel);
  useEffect(() => {
    if (vorher.current === schluessel) return;
    vorher.current = schluessel;
    setTick((t) => t + 1);
  }, [schluessel]);
  return (
    <span key={tick} className={`${className ?? ""} ${tick > 0 ? klasse : ""}`.trim()}>
      {children}
    </span>
  );
}

/**
 * Zahlenfeld mit optionalem Schieber. Der exakte Wert bleibt immer tippbar.
 *
 * Validierung an genau einer Stelle: Eingaben werden auf [min, max] geklemmt
 * und — bei `ganzzahl` — gerundet; das Feld zeigt danach die Zahl, mit der
 * tatsächlich gerechnet wird, nicht die getippte. Leer bleibt leer (`null`),
 * eine ungültige Zeichenfolge wird zu leer, nie zu 0. Der Schieber kann ein
 * kleineres Maximum haben als das Feld (`schieberMax`): Ein Verbund mit
 * 8.000 Anrufen soll die Zahl eintippen können, ohne dass der Schieber dafür
 * unbedienbar wird.
 */
function Zahlenfeld({
  label,
  hinweis,
  wert,
  onChange,
  min,
  max,
  schieberMax,
  step = 1,
  ganzzahl = false,
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
  schieberMax?: number;
  step?: number;
  ganzzahl?: boolean;
  einheit: string;
  schieber?: boolean;
  platzhalter?: string;
}) {
  const id = useId();
  const hinweisId = `${id}-hinweis`;
  const sMax = schieberMax ?? max;
  const normiere = (raw: string): number | null => {
    if (raw.trim() === "") return null;
    const n = Number(raw.replace(",", "."));
    if (!Number.isFinite(n)) return null;
    const geklemmt = Math.min(max, Math.max(min, n));
    return ganzzahl ? Math.round(geklemmt) : geklemmt;
  };
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      {hinweis && (
        <p id={hinweisId} className={`${HINT} mt-1`}>
          {hinweis}
        </p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <div className="relative flex h-12 min-w-0 flex-1 basis-[180px] items-center rounded-xl border border-pub-hairline bg-white transition-[border-color,box-shadow] duration-200 focus-within:border-pub-ink focus-within:shadow-[0_0_0_4px_rgba(11,15,20,0.06)] hover:border-pub-ink/35 dark:border-gray-700 dark:bg-gray-900">
          <input
            id={id}
            type="number"
            inputMode={ganzzahl ? "numeric" : "decimal"}
            min={min}
            max={max}
            step={step}
            value={wert === null ? "" : wert}
            placeholder={platzhalter}
            aria-describedby={hinweis ? hinweisId : undefined}
            onChange={(e) => onChange(normiere(e.target.value))}
            className="cq-numfield h-full w-full min-w-0 rounded-xl bg-transparent pl-4 pr-2 text-[17px] font-semibold text-gray-900 tabular-nums placeholder:font-normal placeholder:text-pub-ink-4 focus:outline-none dark:text-gray-100"
          />
          <span className="pointer-events-none shrink-0 whitespace-nowrap pr-4 text-[13.5px] font-medium text-pub-ink-3 dark:text-gray-400">
            {einheit}
          </span>
        </div>
        {schieber && (
          <input
            type="range"
            aria-label={`${label} (Schieberegler)`}
            min={min}
            max={sMax}
            step={step}
            value={Math.min(sMax, wert ?? min)}
            onChange={(e) => onChange(normiere(e.target.value))}
            style={{ "--cq-fill": `${(Math.min(Math.max((wert ?? min) - min, 0), sMax - min) / (sMax - min)) * 100}%` } as React.CSSProperties}
            className="cq-range basis-full min-w-0"
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
  pille = false,
}: {
  label: string;
  wert: string;
  stark?: boolean;
  hinweis?: string;
  /** Wert als Ink-Pille, die beim Wechsel einmal pulsiert (Tarifname). */
  pille?: boolean;
}) {
  if (pille) {
    return (
      <div className={ZEILE}>
        <div className="min-w-0">
          <span className="text-[16px] text-gray-600 dark:text-gray-400">{label}</span>
          {hinweis && <p className={`${HINT} mt-0.5`}>{hinweis}</p>}
        </div>
        <PulsBeiWechsel
          schluessel={wert}
          klasse="cq-tariff-pulse"
          className="inline-flex h-8 items-center rounded-full bg-pub-signal px-3.5 text-[14px] font-semibold text-white whitespace-nowrap"
        >
          {wert}
        </PulsBeiWechsel>
      </div>
    );
  }
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

/** Betrag mit Vorrang vor dem erklärenden Text. */
function Betrag({
  label,
  wert,
  betrag,
  format,
  hinweis,
}: {
  label: string;
  wert: string;
  /** Numerischer Wert für die rollende Anzeige; `wert` bleibt der Endtext. */
  betrag?: number;
  format?: (n: number) => string;
  hinweis?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-pub-ink-3 dark:text-gray-400">
        {label}
      </p>
      <p className="mt-2 text-[clamp(26px,3vw,36px)] font-bold leading-[1.05] tracking-[-0.025em] text-gray-900 dark:text-gray-100 tabular-nums break-words">
        {betrag !== undefined && format ? (
          <Rollwert wert={betrag} format={format} />
        ) : (
          <PulsBeiWechsel schluessel={wert} klasse="cq-value-settle" className="inline-block">
            {wert}
          </PulsBeiWechsel>
        )}
      </p>
      {hinweis && <p className={`${HINT} mt-1.5`}>{hinweis}</p>}
    </div>
  );
}

/** Beschriftung der Felder, die ein aktiver Baustein noch braucht. */
const FEHLT_LABEL: Record<FehlendeAngabe, string> = {
  anrufeHeuteVomTeam: "Anrufe, die heute Ihr Team führt",
  minutenProAnrufTeam: "Bearbeitungszeit je Anruf im Team",
  uebernommenProzent: "übernommener Anteil",
  entfallendeAusgaben: "tatsächlich entfallende Ausgaben",
  zusaetzlicheTermine: "zusätzliche wahrgenommene Termine",
  deckungsbeitrag: "Deckungsbeitrag je Termin",
};

/**
 * Ein Baustein, den der Besucher ein- oder ausschaltet.
 *
 * `role="checkbox"`: Es sind drei unabhängige Ja/Nein-Entscheidungen, keine
 * Auswahl aus Alternativen. Keiner ist vorgewählt, keiner als „empfohlen"
 * markiert — die Kostenbausteine ergeben das größere Ergebnis, und genau
 * deshalb darf die Oberfläche nicht dorthin schieben.
 */
function BausteinWahl({
  aktiv,
  kennung,
  titel,
  erklaerung,
  onToggle,
}: {
  aktiv: boolean;
  kennung: string;
  titel: string;
  erklaerung: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={aktiv}
      onClick={onToggle}
      className={`text-left rounded-2xl border p-5 transition-[border-color,background-color,box-shadow] duration-200 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pub-signal focus-visible:ring-offset-2 ${
        aktiv
          ? "border-pub-signal bg-pub-signal-wash dark:bg-gray-800/60 shadow-[inset_0_0_0_1px_#1c4fd8]"
          : "border-gray-200 dark:border-gray-700 hover:border-pub-signal/45"
      }`}
    >
      <span className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={`flex-shrink-0 w-7 h-7 rounded-full text-[13px] font-bold flex items-center justify-center ${
            aktiv
              ? "bg-pub-signal text-white"
              : "bg-pub-accent-wash dark:bg-blue-500/10 text-pub-accent dark:text-blue-400"
          }`}
        >
          {kennung}
        </span>
        <span className="block text-[16px] font-semibold text-gray-900 dark:text-gray-100 leading-[1.45]">
          {titel}
        </span>
      </span>
      <span className="block text-[14px] text-gray-600 dark:text-gray-400 leading-[1.6] mt-2">
        {erklaerung}
      </span>
      <span className="block text-[13px] font-medium mt-2 text-pub-ink-3 dark:text-gray-500">
        {aktiv ? "Wird berücksichtigt" : "Nicht berücksichtigt"}
      </span>
    </button>
  );
}

/**
 * Darstellungsvariante — UND NUR DARSTELLUNG.
 *
 * `voll` ist die Fassung der Flaggschiff- und der Kostenseite: jede
 * Preisposition einzeln, Kontingent-Passung aller Tarife, Sprachwahl,
 * Nutzenbausteine.
 *
 * `kompakt` ist die Fassung für Seiten, auf denen der Rechner nicht die
 * Hauptsache ist — heute genau eine: die Startseite. Sie zeigt die PREISFRAGE
 * und lässt den Nutzenteil WEG; der Weg dorthin steht als eigener Schritt
 * darunter und führt auf die vollständige Fassung. Sie rechnet nicht anders:
 * Dieselben Eingaben laufen durch dieselben Funktionen und ergeben denselben
 * Tarif und dieselben Monatskosten — `rechner-konsistenz.test.tsx` prüft das.
 */
export type RechnerVariante = "voll" | "kompakt";

export function TelefonRechner({ variante = "voll" }: { variante?: RechnerVariante } = {}) {
  const kompakt = variante === "kompakt";
  /*
    Gemeldet wird EINMAL je Besuch, DASS gerechnet wurde — beim ersten Eingriff
    in ein Preisfeld bzw. beim ersten Einschalten eines Nutzenbausteins. Ein
    Ereignis je Schieberpixel wäre Ereignismüll. „Berechnet" (ein Ergebnis
    liegt vor) ist davon getrennt und wird ebenfalls höchstens einmal gemeldet;
    der Klick auf das Gespräch ist ein drittes, eigenes Ereignis. Nie womit.
  */
  const preisGemeldet = useRef(false);
  const roiGemeldet = useRef(false);
  const preisBerechnetGemeldet = useRef(false);
  const roiBerechnetGemeldet = useRef(false);
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

  // Baustein A — Zeit
  const [zeitAktiv, setZeitAktiv] = useState(false);
  const [teamAnrufe, setTeamAnrufe] = useState<number | null>(null);
  const [teamMinuten, setTeamMinuten] = useState<number | null>(null);
  const [uebernommen, setUebernommen] = useState<number | null>(null);
  const [restaufwand, setRestaufwand] = useState<number | null>(null);
  const [stundenkosten, setStundenkosten] = useState<number | null>(null);
  // Baustein B — Kosten
  const [kostenAktiv, setKostenAktiv] = useState(false);
  const [entfallend, setEntfallend] = useState<number | null>(null);
  // Baustein C — Termine
  const [termineAktiv, setTermineAktiv] = useState(false);
  const [zusatzTermine, setZusatzTermine] = useState<number | null>(null);
  const [deckungsbeitrag, setDeckungsbeitrag] = useState<number | null>(null);
  const [kapazitaet, setKapazitaet] = useState<number | null>(null);

  /*
    Ein leeres Anruf- oder Dauerfeld ist KEIN Aufkommen von null. Erst wenn
    beide Felder etwas enthalten, gibt es einen Preis; vorher steht die
    Aufforderung, nicht „Basis, 300 €".
  */
  const volumenVollstaendig = anrufe !== null && dauer !== null;
  const volumen = { anrufeProMonat: anrufe ?? 0, minutenProAnruf: dauer ?? 0 };
  const preis = useMemo(() => berechnePreis(volumen, sprachen), [anrufe, dauer, sprachen]); // eslint-disable-line react-hooks/exhaustive-deps

  const nutzenEingabe: NutzenEingabe = {
    zeit: {
      aktiv: zeitAktiv,
      anrufeHeuteVomTeam: teamAnrufe,
      minutenProAnrufTeam: teamMinuten,
      uebernommenProzent: uebernommen,
      restaufwandProzent: restaufwand,
      stundenkostenEur: stundenkosten,
    },
    kosten: { aktiv: kostenAktiv, entfallendeAusgabenEur: entfallend },
    termine: {
      aktiv: termineAktiv,
      zusaetzlicheTermine: zusatzTermine,
      deckungsbeitragEur: deckungsbeitrag,
      freieKapazitaet: kapazitaet,
    },
  };
  const nutzen = useMemo(
    () => berechneNutzen(preis, nutzenEingabe),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      preis, zeitAktiv, teamAnrufe, teamMinuten, uebernommen, restaufwand, stundenkosten,
      kostenAktiv, entfallend, termineAktiv, zusatzTermine, deckungsbeitrag, kapazitaet,
    ]
  );

  const s = preis.empfehlung;
  const preisSteht = volumenVollstaendig;
  const saldo = nutzen.cash.saldoProMonatEur;
  const saldoSteht = typeof saldo === "number";

  useEffect(() => {
    if (!preisSteht || preisBerechnetGemeldet.current || !preisGemeldet.current) return;
    preisBerechnetGemeldet.current = true;
    trackEvent("price_calculated");
  }, [preisSteht]);
  useEffect(() => {
    if (!saldoSteht || roiBerechnetGemeldet.current) return;
    roiBerechnetGemeldet.current = true;
    trackEvent("roi_calculated");
  }, [saldoSteht]);

  const umfangText = (() => {
    const fehlt: string[] = [];
    if (!nutzen.cash.umfang.kosten) fehlt.push("ohne Kostensenkung");
    if (!nutzen.cash.umfang.termine) fehlt.push("ohne zusätzliche Termine");
    return fehlt.length ? ` (${fehlt.join(", ")})` : "";
  })();

  return (
    <div className="space-y-6">
      <div
        className={
          kompakt
            ? "grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start"
            : "space-y-6"
        }
      >
      {/* ── Mengenangaben, einmal für beide Rechnungen ──────────────────── */}
      <div className={`${CARD} p-6 sm:p-7 ${kompakt ? "lg:h-full" : ""}`}>
        <h3 className="text-[19px] font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Ihr Anrufaufkommen
        </h3>
        <p className={`${HINT} mb-6`}>
          Die Startwerte sind ein Beispiel – bitte anpassen. Sie sind kein
          Praxisdurchschnitt und keine Branchenstatistik.
        </p>
        <div className={`grid gap-6 ${kompakt ? "sm:grid-cols-2 lg:grid-cols-1" : "sm:grid-cols-2"}`}>
          <Zahlenfeld
            label="Anrufe pro Monat, die der Assistent annehmen soll"
            wert={anrufe}
            onChange={(v) => { meldePreisStart(); setAnrufe(v); }}
            min={0}
            max={100000}
            schieberMax={3000}
            step={10}
            ganzzahl
            einheit="Anrufe"
            platzhalter="z. B. 200"
          />
          <Zahlenfeld
            label="Durchschnittliche Gesprächsdauer mit dem Assistenten"
            wert={dauer}
            onChange={(v) => { meldePreisStart(); setDauer(v); }}
            min={0}
            max={60}
            schieberMax={15}
            step={0.5}
            einheit="Minuten"
            platzhalter="z. B. 2"
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
                className={`inline-flex h-11 items-center rounded-full px-5 text-[15px] font-medium border transition-[background-color,border-color,color,transform] duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pub-signal focus-visible:ring-offset-2 ${
                  sprachen === wert
                    ? "border-pub-signal bg-pub-signal text-white"
                    : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-pub-signal/45"
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
      <div className={`${CARD} p-6 sm:p-7 ${kompakt ? "lg:h-full" : ""}`} aria-live="polite">
        <h3 className="text-[19px] font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Was das bei Ihnen kostet
        </h3>
        <p className={`${HINT} mb-5`}>
          Sofort, ohne E-Mail. Grundgebühr, Mehrminuten und Einrichtung stehen
          getrennt; was vor der technischen Prüfung nicht feststeht, steht als
          offen in der Liste – nicht als Null.
        </p>

        {!volumenVollstaendig ? (
          <p className="text-[16px] text-gray-600 dark:text-gray-400 leading-[1.7]">
            Tragen Sie Anrufe pro Monat und Gesprächsdauer ein – erst dann gibt
            es einen Preis. Ein leeres Feld rechnen wir nicht als null.
          </p>
        ) : (
          <>
        {kompakt && (
          <div className="mb-6 grid gap-6 border-b border-gray-100 pb-6 dark:border-gray-800 sm:grid-cols-2 sm:gap-8">
            <Betrag
              label="Pro Monat"
              wert={eur(s.monatlichEur, 2)}
              betrag={s.monatlichEur}
              format={(n) => eur(n, 2)}
              hinweis={
                s.mehrminuten > 0
                  ? `Tarif ${s.tarif.name}: ${s.tarif.monatlich} Grundgebühr + ${zahl(s.mehrminuten, 1)} Mehrminuten × ${FAKTEN.mehrpreisProMinute}.`
                  : `Tarif ${s.tarif.name}: ${s.tarif.monatlich} Grundgebühr, ${zahl(s.inklusivMinuten)} Minuten enthalten.`
              }
            />
            <Betrag
              label="Einmalige Einrichtung"
              wert={EINRICHTUNG.anzeige}
              hinweis="Standardumfang, in jedem Tarif gleich. Nicht im Monatspreis enthalten."
            />
          </div>
        )}

        <Zeile
          label="Abrechenbare Minuten pro Monat"
          wert={`${zahl(preis.minutenProMonat, 1)} Min.`}
          hinweis="Anrufe × durchschnittliche Gesprächsdauer, ohne Rundung. Wie Gesprächssekunden in der Abrechnung zu Minuten werden, legt Ihr Vertrag fest."
        />
        <Zeile
          label="Günstigster Tarif bei diesem Aufkommen"
          wert={s.tarif.name}
          pille
          hinweis={FAKTEN.tarifzuordnung}
        />
        {!kompakt && (
          <>
            <Zeile
              label={`Grundgebühr Tarif ${s.tarif.name}`}
              wert={eur(s.tarif.monatlichEur, 2)}
              hinweis={`Enthält ${zahl(s.inklusivMinuten)} Minuten.`}
            />
            <Zeile
              label="Mehrminuten"
              wert={
                s.mehrminuten > 0
                  ? `${zahl(s.mehrminuten, 1)} Min. × ${FAKTEN.mehrpreisProMinute} = ${eur(s.mehrminutenEur, 2)}`
                  : "keine"
              }
              hinweis={`Jede abrechenbare Minute über dem Kontingent kostet ${FAKTEN.mehrpreisProMinute}. Es gibt keinen Preisdeckel.`}
            />
          </>
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
              hinweis="Eigene Position neben Grundgebühr und Mehrminuten."
            />
          )
        )}
        {!kompakt && (
          <Zeile
            label="Monatsrechnung (bekannte Positionen)"
            wert={
              preis.monatlichGesamtEur !== UNBEKANNT
                ? eur(preis.monatlichGesamtEur, 2)
                : `${eur(s.monatlichEur, 2)} + Sprachaufschlag`
            }
            stark
            hinweis={
              preis.monatlichGesamtEur !== UNBEKANNT
                ? "Grundgebühr + Mehrminuten + Zusatzsprachen. Ohne Einrichtung (einmalig, darunter) und ohne Anbindung (offen)."
                : "Eine Summe nennen wir erst, wenn der Sprachaufschlag feststeht – eine Summe ohne ihn wäre niedriger als Ihre spätere Rechnung."
            }
          />
        )}
        {!kompakt && (
          <Zeile
            label="Einmalige Standard-Einrichtung"
            wert={EINRICHTUNG.anzeige}
            hinweis={`${EINRICHTUNG.standard} ${EINRICHTUNG.sonder}`}
          />
        )}
        {!kompakt && preis.ersteJahrBekannteKostenEur !== UNBEKANNT && (
          <Zeile
            label="Erstes Jahr, bekannte Kosten"
            wert={eur(preis.ersteJahrBekannteKostenEur, 2)}
            hinweis={`12 × ${eur(preis.monatlichGesamtEur as number, 2)} + ${EINRICHTUNG.anzeige} Einrichtung, bei gleichbleibendem Aufkommen. Ohne Anbindung, ohne Aufschlag für monatliche Kündbarkeit.`}
          />
        )}

        <Zeile
          label="Anbindung an Ihr System"
          wert="noch offen"
          hinweis="Wird vor Vertragsabschluss nach der technischen Prüfung ausgewiesen – einschließlich Gebühren, die Dritte für eine Schnittstelle verlangen. Wir setzen diese Position hier bewusst nicht auf null."
        />

        {preis.individuellPruefen && (
          <p className={`${HINT} mt-4`}>
            Bei diesem Aufkommen liegt auch der günstigste Listentarif auf dem
            Niveau eines individuellen Kontingents. {TARIF_ENTERPRISE} Sprechen
            Sie uns darauf an.
          </p>
        )}

        {!kompakt && (
          <details className="mt-5">
            <summary className="text-[15px] font-semibold text-pub-accent-ink dark:text-blue-300 cursor-pointer min-h-[44px] flex items-center">
              Alle drei Tarife bei diesem Aufkommen vergleichen
            </summary>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-[15px] text-left">
                <thead>
                  <tr className="text-[13px] uppercase tracking-wider text-pub-ink-3 dark:text-gray-500">
                    <th scope="col" className="py-2 pr-4 font-semibold">Tarif</th>
                    <th scope="col" className="py-2 pr-4 font-semibold">Grundgebühr</th>
                    <th scope="col" className="py-2 pr-4 font-semibold">Mehrminuten</th>
                    <th scope="col" className="py-2 font-semibold">Monat</th>
                  </tr>
                </thead>
                <tbody>
                  {preis.vergleich.map((v) => (
                    <tr key={v.tarif.name} className="border-t border-gray-100 dark:border-gray-800">
                      <th scope="row" className="py-2 pr-4 font-medium text-gray-900 dark:text-gray-100">
                        {v.tarif.name}
                        {v.tarif.name === s.tarif.name && (
                          <span className="ml-2 text-[12px] font-semibold text-pub-accent-ink dark:text-blue-300">günstigster</span>
                        )}
                      </th>
                      <td className="py-2 pr-4 tabular-nums">{v.tarif.monatlich} · {zahl(v.inklusivMinuten)} Min.</td>
                      <td className="py-2 pr-4 tabular-nums">
                        {v.mehrminuten > 0 ? `${zahl(v.mehrminuten, 1)} × ${FAKTEN.mehrpreisProMinute}` : "–"}
                      </td>
                      <td className="py-2 tabular-nums font-medium text-gray-900 dark:text-gray-100">{eur(v.monatlichEur, 2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={`${HINT} mt-3`}>
              Monat = Grundgebühr + Mehrminuten × {FAKTEN.mehrpreisProMinute},
              ohne Deckel. Die Einrichtung ({EINRICHTUNG.anzeige} einmalig) ist
              in jedem Tarif gleich und deshalb nicht Teil des Vergleichs.
            </p>
          </details>
        )}

        <p className={`${HINT} mt-5 flex items-start gap-2`}>
          <Info size={14} className="flex-shrink-0 mt-0.5 text-pub-signal" aria-hidden="true" />
          <span>
            {FAKTEN.laufzeit} Wie sich dieser Aufschlag im Einzelnen bemisst,
            steht in Ihrem Angebot; diese Rechnung bildet ihn deshalb nicht ab,
            statt ihn zu raten. {FAKTEN.preisgarantie} Beträge wie in unserer
            Preisliste; die Steuerbasis nennt Ihr Angebot.
          </span>
        </p>
          </>
        )}
      </div>

      </div>

      {/* ── Ergebnis 2: Nutzen in drei Bausteinen ───────────────────────── */}
      {!kompakt && (
      <div className={`${CARD} p-6 sm:p-7`}>
        <h3 className="text-[19px] font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Und was bringt es Ihnen?
        </h3>
        <p className={`${HINT} mb-7`}>
          Drei Bausteine, jeder freiwillig. Wählen Sie, was Sie betrachten
          möchten; was Sie nicht wählen, steht nicht in der Rechnung – und wird
          nicht still auf null gesetzt. Wir setzen keinen Wert für Sie ein.
        </p>

        <div className="grid sm:grid-cols-3 gap-4 mb-7" role="group" aria-label="Bausteine der Nutzenrechnung">
          <BausteinWahl
            aktiv={zeitAktiv}
            kennung="A"
            titel="Mehr Zeit fürs Praxisteam"
            erklaerung="Stunden pro Monat, die Ihr Team weniger am Telefon ist. Kein Geldzufluss – ein optionaler Euro-Zeitwert bleibt daneben stehen."
            onToggle={() => { meldeRoiStart(); setZeitAktiv((v) => !v); }}
          />
          <BausteinWahl
            aktiv={kostenAktiv}
            kennung="B"
            titel="Weniger laufende Kosten"
            erklaerung="Ausgaben, die tatsächlich entfallen: ein externer Telefonservice, bezahlte Überstunden, eine wirklich vermiedene Einstellung."
            onToggle={() => { meldeRoiStart(); setKostenAktiv((v) => !v); }}
          />
          <BausteinWahl
            aktiv={termineAktiv}
            kennung="C"
            titel="Zusätzliche Termine"
            erklaerung="Termine, die ohne Erreichbarkeitslücke zusätzlich zustande kämen – bewertet mit dem Deckungsbeitrag, begrenzt durch freie Kapazität."
            onToggle={() => { meldeRoiStart(); setTermineAktiv((v) => !v); }}
          />
        </div>

        {/* ── A · Zeit ──────────────────────────────────────────────────── */}
        {zeitAktiv && (
          <section aria-labelledby="baustein-zeit" className="mb-8">
            <h4 id="baustein-zeit" className="text-[17px] font-semibold text-gray-900 dark:text-gray-100 mb-4">
              A · Mehr Zeit fürs Praxisteam
            </h4>
            <div className="grid sm:grid-cols-2 gap-6 mb-5">
              <Zahlenfeld
                label="Anrufe pro Monat, die heute Ihr Team führt und die der Assistent übernehmen soll"
                hinweis="Nicht das Aufkommen oben: Darin können Anrufe stecken, die heute niemanden erreichen – die binden heute keine Teamzeit."
                wert={teamAnrufe}
                onChange={setTeamAnrufe}
                min={0} max={100000} step={10} ganzzahl einheit="Anrufe" schieber={false} platzhalter="z. B. 200"
              />
              <Zahlenfeld
                label="Bearbeitungszeit je Anruf im Team"
                hinweis="Gespräch plus Notieren, Eintragen, Weiterleiten – die menschliche Zeit, nicht die Gesprächsdauer des Assistenten."
                wert={teamMinuten}
                onChange={setTeamMinuten}
                min={0} max={60} step={0.5} einheit="Minuten" schieber={false} platzhalter="z. B. 3"
              />
              <Zahlenfeld
                label="Anteil dieser Anrufe, den der Assistent vollständig übernimmt"
                hinweis="Ihr Szenario, 0 bis 100 %. 100 % ist eine bewusste Wahl, kein Standard: Was außerhalb der freigegebenen Abläufe liegt, bleibt beim Team."
                wert={uebernommen}
                onChange={setUebernommen}
                min={0} max={100} step={5} ganzzahl einheit="%" schieber={false} platzhalter="z. B. 60"
              />
              <Zahlenfeld
                label="Verbleibender Aufwand je übernommenem Anruf (optional)"
                hinweis="Kontrolle, Rückfragen, Eskalationen, zusätzlicher Betriebsaufwand – in % der bisherigen Zeit. Leer gelassen rechnen wir ohne Abzug und kennzeichnen das Ergebnis als bedingt."
                wert={restaufwand}
                onChange={setRestaufwand}
                min={0} max={300} step={5} ganzzahl einheit="%" schieber={false} platzhalter="z. B. 15"
              />
              <Zahlenfeld
                label="Vollkosten einer Arbeitsstunde (optional)"
                hinweis="Nur für den Euro-Zeitwert. Er bleibt eine Vergleichsgröße und geht nicht in den Geldsaldo."
                wert={stundenkosten}
                onChange={setStundenkosten}
                min={0} max={500} step={1} einheit="€ / Stunde" schieber={false} platzhalter="z. B. 35"
              />
            </div>
            {nutzen.zeit.status === "ok" && (
              <div className={KASTEN} aria-live="polite">
                <p className="text-[13px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                  Zwischenstand · Zeit
                </p>
                <Zeile
                  label="Heutige Teamzeit für diese Anrufe"
                  wert={`${zahl(nutzen.zeit.heuteStundenProMonat ?? 0, 1)} Std.`}
                  hinweis="Anrufe × Bearbeitungszeit ÷ 60"
                />
                <Zeile
                  label={nutzen.zeit.bedingt ? "Frei werdende Zeit (bedingt)" : "Frei werdende Zeit"}
                  wert={`${zahl(nutzen.zeit.nettoStundenProMonat ?? 0, 1)} Std.`}
                  stark
                  hinweis={
                    nutzen.zeit.bedingt
                      ? `× ${zahl(uebernommen ?? 0)} % übernommen, ohne Abzug für Restaufwand – ein Potenzial unter der Bedingung, dass nichts nachzuarbeiten ist. Tragen Sie den verbleibenden Aufwand ein, wird daraus eine Netto-Zahl.`
                      : (nutzen.zeit.nettoStundenProMonat ?? 0) < 0
                        ? "Negativ: Der verbleibende Aufwand übersteigt die übernommene Zeit – das wäre Mehrarbeit, kein Gewinn."
                        : `× ${zahl(uebernommen ?? 0)} % übernommen − ${zahl(restaufwand ?? 0)} % Restaufwand.`
                  }
                />
                {nutzen.zeit.zeitwertEur !== null && (
                  <Zeile
                    label="Euro-Zeitwert (Vergleichsgröße)"
                    wert={eur(nutzen.zeit.zeitwertEur)}
                    hinweis="Frei werdende Zeit × Stundensatz. Kein Geldzufluss: Lohn wird weiter gezahlt, solange die Person bleibt. Dieser Wert steht in keinem Saldo."
                  />
                )}
              </div>
            )}
          </section>
        )}

        {/* ── B · Kosten ────────────────────────────────────────────────── */}
        {kostenAktiv && (
          <section aria-labelledby="baustein-kosten" className="mb-8">
            <h4 id="baustein-kosten" className="text-[17px] font-semibold text-gray-900 dark:text-gray-100 mb-4">
              B · Weniger laufende Kosten
            </h4>
            <div className="grid sm:grid-cols-2 gap-6 mb-5">
              <Zahlenfeld
                label="Monatliche Ausgaben, die durch den Assistenten tatsächlich entfallen"
                hinweis="Nur echte Posten: der Rechnungsbetrag eines externen Telefonservices, bezahlte Überstunden am Telefon, eine Einstellung, die dadurch nicht nötig wird. Bleibt Ihr Team beschäftigt, ist 0 die richtige Antwort – und eine gültige."
                wert={entfallend}
                onChange={setEntfallend}
                min={0} max={50000} step={10} einheit="€ / Monat" schieber={false} platzhalter="z. B. 0"
              />
            </div>
            {nutzen.kosten.status === "ok" && (
              <div className={KASTEN} aria-live="polite">
                <p className="text-[13px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                  Zwischenstand · Kosten
                </p>
                <Zeile
                  label="Tatsächlich entfallende Ausgaben"
                  wert={eur(nutzen.kosten.ersparnisEur ?? 0)}
                  stark
                  hinweis="Ihre Angabe. Wir verteilen keine Vollkosten auf Telefonminuten und setzen keinen Empfang als Standardersparnis an. Bei Teilentlastung prüfen Sie, welche übrigen Aufgaben weiter Personal brauchen."
                />
              </div>
            )}
          </section>
        )}

        {/* ── C · Termine ───────────────────────────────────────────────── */}
        {termineAktiv && (
          <section aria-labelledby="baustein-termine" className="mb-8">
            <h4 id="baustein-termine" className="text-[17px] font-semibold text-gray-900 dark:text-gray-100 mb-4">
              C · Zusätzliche Termine
            </h4>
            <div className="grid sm:grid-cols-2 gap-6 mb-5">
              <Zahlenfeld
                label="Zusätzliche Termine pro Monat, die tatsächlich wahrgenommen würden"
                hinweis="Bereits bereinigt um Wiederholungsanrufe, Patienten, die ohnehin später buchen, Verschiebungen und Ausfälle. Keine Anzahl verpasster Anrufe – ein Anrufversuch ist kein neuer Fall."
                wert={zusatzTermine}
                onChange={setZusatzTermine}
                min={0} max={10000} step={1} ganzzahl einheit="Termine" schieber={false} platzhalter="z. B. 5"
              />
              <Zahlenfeld
                label="Deckungsbeitrag je Termin"
                hinweis="Was von einem Termin nach Material, Fremdleistung und variablen Kosten bleibt – nicht der Umsatz. Keine pauschalen Patientenwerte."
                wert={deckungsbeitrag}
                onChange={setDeckungsbeitrag}
                min={0} max={10000} step={5} einheit="€" schieber={false} platzhalter="z. B. 40"
              />
              <Zahlenfeld
                label="Freie Behandlungskapazität pro Monat (optional)"
                hinweis="Wie viele zusätzliche Termine Ihr Kalender tatsächlich aufnimmt. Leer gelassen zeigen wir nur das Anfragepotenzial, keinen realisierbaren Beitrag. 0 ist eine gültige Antwort."
                wert={kapazitaet}
                onChange={setKapazitaet}
                min={0} max={10000} step={1} ganzzahl einheit="Termine" schieber={false} platzhalter="z. B. 8"
              />
            </div>
            {nutzen.termine.status === "ok" && (
              <div className={KASTEN} aria-live="polite">
                <p className="text-[13px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                  Zwischenstand · Termine
                </p>
                <Zeile
                  label="Anfragepotenzial ohne Kapazitätsgrenze"
                  wert={eur(nutzen.termine.potenzialEur ?? 0)}
                  hinweis={`${zahl(zusatzTermine ?? 0)} Termine × ${eur(deckungsbeitrag ?? 0)}.`}
                />
                {nutzen.termine.kapazitaetUnbekannt ? (
                  <Zeile
                    label="Realisierbarer Beitrag"
                    wert="offen"
                    stark
                    hinweis="Ohne Angabe zur freien Kapazität ist das Potenzial kein realisierter Gewinn. Es geht nicht in den Geldsaldo."
                  />
                ) : (
                  <Zeile
                    label="Realisierbarer Beitrag"
                    wert={eur(nutzen.termine.realisierbarEur ?? 0)}
                    stark
                    hinweis={
                      nutzen.termine.kapazitaetBegrenzt
                        ? `Begrenzt durch Ihre freie Kapazität: ${zahl(nutzen.termine.realisierbareTermine ?? 0)} von ${zahl(zusatzTermine ?? 0)} Terminen sind durchführbar.`
                        : "Ihre Kapazität reicht für alle genannten Termine."
                    }
                  />
                )}
              </div>
            )}
          </section>
        )}

        {/* ── Ergebnis ─────────────────────────────────────────────────── */}
        <div className="mt-2 pt-7 border-t border-gray-200 dark:border-gray-700" aria-live="polite">
          {!preisSteht || nutzen.cash.bekannteKostenProMonatEur === UNBEKANNT ? (
            <>
              <h4 className="text-[17px] font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Geldsaldo noch nicht berechenbar
              </h4>
              <p className="text-[16px] text-gray-600 dark:text-gray-400 leading-[1.7]">
                Solange der monatliche Betrag nicht feststeht – ohne vollständiges
                Aufkommen oder bei offenem Sprachaufschlag – gibt es keinen
                Betrag, gegen den sich rechnen ließe. Ihre Zwischenstände oben bleiben davon unberührt;
                den Saldo rechnen wir im Erstgespräch mit Ihrer konkreten Zahl.
              </p>
            </>
          ) : saldo === UNVOLLSTAENDIG ? (
            <>
              <h4 className="text-[17px] font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Wirtschaftlichkeit noch nicht vollständig berechnet
              </h4>
              {!zeitAktiv && !kostenAktiv && !termineAktiv ? (
                <p className="text-[16px] text-gray-600 dark:text-gray-400 leading-[1.7]">
                  Wählen Sie oben mindestens einen Baustein. Bis dahin zeigen wir
                  kein Ergebnis – weder ein gutes noch ein schlechtes.
                </p>
              ) : (
                <p className="text-[16px] font-medium text-gray-800 dark:text-gray-200">
                  {(() => {
                    const fehlend = [...nutzen.zeit.fehlend, ...nutzen.kosten.fehlend, ...nutzen.termine.fehlend];
                    return `Es ${fehlend.length === 1 ? "fehlt noch eine Angabe" : `fehlen noch ${zahl(fehlend.length)} Angaben`}: ${fehlend.map((f) => FEHLT_LABEL[f]).join(", ")}.`;
                  })()}
                </p>
              )}
            </>
          ) : (
            <>
              <h4 className="text-[17px] font-semibold text-gray-900 dark:text-gray-100 mb-5">
                Ihr Ergebnis
              </h4>
              <div className="grid gap-6 sm:grid-cols-3 mb-6">
                <Betrag
                  label="A · Zeit pro Monat"
                  wert={
                    nutzen.zeit.status === "ok"
                      ? `${zahl(nutzen.zeit.nettoStundenProMonat ?? 0, 1)} Std.`
                      : "nicht berücksichtigt"
                  }
                  hinweis={
                    nutzen.zeit.status === "ok"
                      ? nutzen.zeit.bedingt ? "bedingt, ohne Restaufwand" : "netto, nach Restaufwand"
                      : undefined
                  }
                />
                <Betrag
                  label="B · Weniger Kosten"
                  wert={nutzen.kosten.status === "ok" ? eur(nutzen.kosten.ersparnisEur ?? 0) : "nicht berücksichtigt"}
                  hinweis={nutzen.kosten.status === "ok" ? "tatsächlich entfallende Ausgaben" : undefined}
                />
                <Betrag
                  label="C · Zusätzliche Termine"
                  wert={
                    nutzen.termine.status !== "ok"
                      ? "nicht berücksichtigt"
                      : nutzen.termine.kapazitaetUnbekannt
                        ? "Potenzial, offen"
                        : eur(nutzen.termine.realisierbarEur ?? 0)
                  }
                  hinweis={
                    nutzen.termine.status === "ok"
                      ? nutzen.termine.kapazitaetUnbekannt
                        ? "ohne Kapazitätsangabe nicht im Saldo"
                        : "realisierbarer Deckungsbeitrag"
                      : undefined
                  }
                />
              </div>

              <Zeile
                label="Bekannte laufende Kosten Cogniiq"
                wert={`− ${eur(nutzen.cash.bekannteKostenProMonatEur as number, 2)}`}
                hinweis="Monatspreis plus Zusatzsprachen. Zuzüglich offener Einrichtung und Anbindung – siehe unten."
              />
              <Zeile
                label={`Geldsaldo pro Monat${umfangText}`}
                wert={eur(saldo as number)}
                stark
                hinweis={
                  (saldo as number) < 0
                    ? "Negativ: Mit den gewählten Geldbausteinen decken die entfallenden Ausgaben und realisierbaren Termine die bekannten laufenden Kosten nicht. Zeitgewinn und Erreichbarkeit sind damit nicht bewertet – sie werden hier aber auch nicht in Euro umgedeutet."
                    : "Entfallende Ausgaben plus realisierbare Termine minus bekannte laufende Kosten. Der Zeitwert aus A ist nicht enthalten; Einrichtung und Anbindung stehen darunter getrennt."
                }
              />
              <Zeile
                label="Einmalige Standard-Einrichtung"
                wert={EINRICHTUNG.anzeige}
                hinweis="Einmalig, nicht Teil des Monatssaldos. Eine Amortisationsdauer zeigen wir nicht: Sie hinge an der offenen Anbindung und an Annahmen, die wir nicht für Sie treffen."
              />
              <Zeile
                label="Anbindung an Ihr System"
                wert="offen"
                hinweis="Steht erst nach der technischen Prüfung fest und ist in keiner Zeile oben enthalten. Jede Summe hier ist deshalb eine Teilsumme aus bekannten Kosten."
              />
              {nutzen.cash.kapazitaetskonflikt && (
                <p className={`${HINT} mt-4`}>
                  Hinweis: Sie rechnen mit entfallender Besetzung UND zusätzlichen
                  Terminen. Prüfen Sie, ob die Kapazität für die neuen Termine
                  nicht gerade von der Besetzung käme, die wegfällt – dieselbe
                  Arbeitszeit lässt sich nur einmal verplanen.
                </p>
              )}
              <p className="mt-5 text-[15px] text-gray-700 dark:text-gray-300 leading-[1.65]">
                Mehr Zeit bedeutet nicht automatisch weniger Lohnkosten. Ob sich
                Cogniiq finanziell rechnet, hängt von tatsächlich entfallenden
                Ausgaben und zusätzlichen Terminen ab. Was darüber hinaus zählt –
                weniger Unterbrechungen, strukturierte Rückrufe, bessere
                Erreichbarkeit –, ist möglich, aber hier nicht in Euro bewertet.
              </p>
            </>
          )}
        </div>

        {/* ── Was diese Rechnung bewusst NICHT enthält ──────────────────── */}
        <details className="mt-7 pt-6 border-t border-gray-100 dark:border-gray-800">
          <summary className="text-[16px] font-semibold text-gray-700 dark:text-gray-300 cursor-pointer min-h-[44px] flex items-center">
            Was diese Rechnung bewusst nicht enthält
          </summary>
          <ul className="mt-4 space-y-2.5 text-[16px] text-gray-600 dark:text-gray-400 leading-[1.7]">
            <li>
              <strong className="font-semibold text-gray-800 dark:text-gray-200">Wachstum und Saison.</strong>{" "}
              Gerechnet wird ein Durchschnittsmonat. Wer im Sommer das Dreifache
              telefoniert, verschiebt Tarif und Nutzen – beides.
            </li>
            <li>
              <strong className="font-semibold text-gray-800 dark:text-gray-200">Mehrere Standorte.</strong>{" "}
              Abgerechnet wird je Betrieb. Für mehrere Standorte rechnen wir im
              Erstgespräch, statt hier zu multiplizieren.
            </li>
            <li>
              <strong className="font-semibold text-gray-800 dark:text-gray-200">Steuern und Liquidität.</strong>{" "}
              Beträge wie in der Preisliste; ob Umsatzsteuer für Ihre Praxis
              wirtschaftlich neutral ist, klärt Ihre Steuerberatung, nicht dieser
              Rechner.
            </li>
            <li>
              <strong className="font-semibold text-gray-800 dark:text-gray-200">Kosten einer Systemanbindung.</strong>{" "}
              Einschließlich der Gebühren, die Dritte für eine Schnittstelle
              verlangen. Sie stehen erst nach der technischen Prüfung fest und
              erscheinen deshalb als offene Position, nicht als null.
            </li>
            <li>
              <strong className="font-semibold text-gray-800 dark:text-gray-200">Gemessene Quoten.</strong>{" "}
              Keine Zufriedenheits-, Fehler- oder Umsatzquote – wir haben sie
              nicht erhoben und setzen sie nicht ein.
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

      )}

      <p className={HINT}>
        Alle Zahlen werden in Ihrem Browser gerechnet. Ihre Eingaben werden
        nicht gespeichert, nicht übertragen und nicht an Analysedienste
        gemeldet – auch der Link zum Gespräch trägt sie nicht mit.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        {kompakt && (
          <a
            href={RECHNER_LINK}
            onClick={() => trackEvent("calculator_anchor_click", "Kompaktrechner")}
            {...magnetic}
            className="group cq-magnetic inline-flex h-12 items-center justify-center gap-2.5 rounded-full bg-pub-signal px-7 text-[15px] font-semibold text-white hover:bg-pub-signal-ink hover:shadow-[0_10px_28px_-10px_rgba(28,79,216,0.55)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pub-signal focus-visible:ring-offset-2"
          >
            Wirtschaftlichkeit berechnen
            <ArrowRight size={15} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5" />
          </a>
        )}
        <a
          href="/ki-telefonassistent/demo"
          onClick={() => trackEvent("cta_demo_click", "Rechner")}
          {...magnetic}
          className={
            kompakt
              ? "group cq-magnetic inline-flex h-12 items-center justify-center gap-2.5 rounded-full border border-pub-ink/20 bg-white px-7 text-[15px] font-semibold text-pub-ink hover:border-pub-ink/45 hover:bg-pub-paper-2 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pub-signal focus-visible:ring-offset-2"
              : "group cq-magnetic inline-flex h-12 items-center justify-center gap-2.5 rounded-full bg-pub-signal px-7 text-[15px] font-semibold text-white hover:bg-pub-signal-ink hover:shadow-[0_10px_28px_-10px_rgba(28,79,216,0.55)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pub-signal focus-visible:ring-offset-2"
          }
        >
          {kompakt ? "Zahlen gemeinsam durchgehen" : "Szenario und Anbindung prüfen"}
          <ArrowRight size={15} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5" />
        </a>
      </div>
    </div>
  );
}
