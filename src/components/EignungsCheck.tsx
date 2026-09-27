// ─────────────────────────────────────────────────────────────────────────────
// EIGNUNGS- UND VORBEREITUNGSCHECK · Oberfläche.
//
// Zeigt an, entscheidet nichts: jede Regel steht in `src/lib/eignungscheck.ts`
// und ist dort getestet. Diese Datei kennt keine Schwelle und keinen Betrag.
//
// Drei Arten von Inhalt sind sichtbar unterschieden, weil ein Besucher
// sonst nicht auseinanderhalten kann, was er selbst gesagt hat und was das
// Werkzeug daraus macht:
//   • IHRE ANGABE   — Eingaben des Besuchers
//   • ANNAHME       — die eine feste Größe (Wochen je Monat) und die Schwellen
//   • ERGEBNIS      — was das Regelwerk daraus ableitet
//
// Gemeldet wird nur, DASS geprüft wurde (fit_check_*). Anrufzahlen, Anlässe,
// Systemangaben und Erwartungen sind Geschäftsdaten des Besuchers; sie bleiben
// im Browser, es gibt keinen Server, an den sie gingen.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

import { trackEvent } from "@/lib/consent";
import {
  ANLAESSE,
  GESAMTBILD_TEXT,
  FELD_LABEL,
  LEERE_EINGABE,
  SCHWELLEN,
  SIGNAL_TEXT,
  ergebnisAlsText,
  pruefeEignung,
  type AnlassId,
  type Dreistufig,
  type EignungsEingabe,
  type Erreichbarkeit,
  type ErwartungId,
  type Haeufigkeit,
  type Signal,
  type Terminsystem,
} from "@/lib/eignungscheck";
import { RECHNER_LINK } from "@/lib/rechner-anker";
import { CTA } from "@/lib/telefonassistent-copy";

const CARD =
  "rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50";
const LABEL = "text-[16px] font-semibold text-gray-900 dark:text-gray-100";
const HINT = "text-[14px] text-gray-500 dark:text-gray-500 leading-[1.55]";
const BUTTON_PRIMARY =
  "inline-flex items-center justify-center rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-5 py-3 text-[16px] font-semibold min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-gray-300 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950";
const BUTTON_SECONDARY =
  "inline-flex items-center justify-center rounded-xl border border-gray-300 dark:border-gray-700 px-5 py-3 text-[16px] font-semibold text-gray-900 dark:text-gray-100 min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-gray-300 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950";

/** Die drei Inhaltsarten als Etikett. */
type Art = "angabe" | "annahme" | "ergebnis";
const ART_TEXT: Record<Art, string> = {
  angabe: "Ihre Angabe",
  annahme: "Annahme",
  ergebnis: "Ergebnis",
};
const ART_KLASSE: Record<Art, string> = {
  angabe: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  annahme: "bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  ergebnis: "bg-sky-50 text-sky-900 dark:bg-sky-950/40 dark:text-sky-200",
};

function Etikett({ art }: { art: Art }) {
  return (
    <span
      className={`inline-block rounded-md px-2 py-0.5 text-[12px] font-semibold uppercase tracking-wide ${ART_KLASSE[art]}`}
    >
      {ART_TEXT[art]}
    </span>
  );
}

const SIGNAL_KLASSE: Record<Signal, string> = {
  traegt: "bg-emerald-500",
  offen: "bg-amber-500",
  "haelt-nicht": "bg-rose-500",
};

const SCHRITTE = [
  "Anrufsituation",
  "Anrufanlässe",
  "Team und Übergabe",
  "Systeme und Daten",
  "Erwartungen",
  "Ergebnis",
] as const;
const ERGEBNIS_SCHRITT = SCHRITTE.length - 1;

// ── Bausteine ───────────────────────────────────────────────────────────────

function Feld({
  label,
  hinweis,
  children,
}: {
  label: string;
  hinweis?: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id} className="pt-6 first:pt-0">
      <div className="flex flex-wrap items-center gap-2">
        <span id={id} className={LABEL}>
          {label}
        </span>
        <Etikett art="angabe" />
      </div>
      {hinweis && <p className={`${HINT} mt-1`}>{hinweis}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Auswahl<T extends string>({
  wert,
  optionen,
  onChange,
  klein = false,
}: {
  wert: T | null;
  optionen: ReadonlyArray<readonly [T, string]>;
  onChange: (v: T) => void;
  klein?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {optionen.map(([v, text]) => {
        const aktiv = wert === v;
        return (
          <button
            key={v}
            type="button"
            aria-pressed={aktiv}
            onClick={() => onChange(v)}
            className={`rounded-xl border text-left transition-colors min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-gray-300 ${
              klein ? "px-3 py-2 text-[14px]" : "px-4 py-2.5 text-[15px]"
            } ${
              aktiv
                ? "border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900"
                : "border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:border-gray-500 dark:hover:border-gray-500"
            }`}
          >
            {text}
          </button>
        );
      })}
    </div>
  );
}

function Zahlenfeld({
  label,
  hinweis,
  wert,
  onChange,
  min,
  step,
  einheit,
}: {
  label: string;
  hinweis?: string;
  wert: number | null;
  onChange: (v: number | null) => void;
  min: number;
  step: number;
  einheit: string;
}) {
  const id = useId();
  return (
    <div className="pt-6 first:pt-0">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={id} className={LABEL}>
          {label}
        </label>
        <Etikett art="angabe" />
      </div>
      {hinweis && <p className={`${HINT} mt-1`}>{hinweis}</p>}
      <div className="mt-3 flex items-center gap-3">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          value={wert === null ? "" : wert}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") return onChange(null);
            const n = Number(raw);
            onChange(Number.isFinite(n) ? Math.max(min, n) : null);
          }}
          className="w-32 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-[16px] font-semibold text-gray-900 dark:text-gray-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300"
        />
        <span className="text-[15px] text-gray-500 dark:text-gray-400">{einheit}</span>
      </div>
    </div>
  );
}

const DREISTUFIG: ReadonlyArray<readonly [Dreistufig, string]> = [
  ["ja", "Ja"],
  ["teilweise", "Teilweise"],
  ["nein", "Nein"],
];

const HAEUFIGKEIT: ReadonlyArray<readonly [Haeufigkeit, string]> = [
  ["haeufig", "Häufig"],
  ["gelegentlich", "Gelegentlich"],
  ["selten", "Selten"],
  ["nie", "Nie"],
];

const ERWARTUNGEN: ReadonlyArray<readonly [ErwartungId, string]> = [
  ["ohneTeam", "Die Telefonie soll vollständig ohne mein Team laufen."],
  ["kiVerbergen", "Anrufer sollen nicht erfahren, dass ein KI-System spricht."],
  ["anbindungVorab", "Ich brauche vor jeder Prüfung die Zusage, dass Termine automatisch in meinem System stehen."],
  ["wortlaut", "Ich brauche später den genauen Wortlaut von Gesprächen."],
  ["fachauskunft", "Der Assistent soll fachliche oder medizinische Auskünfte geben."],
];

// ── Das Werkzeug ────────────────────────────────────────────────────────────

export function EignungsCheck({ quelle }: { quelle: string }) {
  const [eingabe, setEingabe] = useState<EignungsEingabe>(LEERE_EINGABE);
  const [schritt, setSchritt] = useState(0);
  const [kopiert, setKopiert] = useState<"nein" | "ja" | "fehler">("nein");
  const kopfId = useId();
  const kopf = useRef<HTMLDivElement>(null);

  /*
    Gemeldet wird einmal je Besuch: dass begonnen wurde und dass ein
    vollständiges Ergebnis vorlag. Nicht bei jedem Klick, nicht im Render —
    im StrictMode liefe ein trackEvent() im Render doppelt, im SSR-Durchlauf
    gar nicht.
  */
  const startGemeldet = useRef(false);
  const fertigGemeldet = useRef(false);

  function aendere(patch: Partial<EignungsEingabe>) {
    if (!startGemeldet.current) {
      startGemeldet.current = true;
      trackEvent("fit_check_started");
    }
    setKopiert("nein");
    setEingabe((alt) => ({ ...alt, ...patch }));
  }
  function aendereAnlass(id: AnlassId, wert: Haeufigkeit) {
    aendere({ anlaesse: { ...eingabe.anlaesse, [id]: wert } });
  }
  function aendereErwartung(id: ErwartungId, wert: boolean) {
    aendere({ erwartungen: { ...eingabe.erwartungen, [id]: wert } });
  }

  const ergebnis = useMemo(() => pruefeEignung(eingabe), [eingabe]);

  useEffect(() => {
    if (!ergebnis.vollstaendig || fertigGemeldet.current) return;
    fertigGemeldet.current = true;
    trackEvent("fit_check_completed");
  }, [ergebnis.vollstaendig]);

  function geheZu(n: number) {
    setSchritt(Math.min(Math.max(0, n), ERGEBNIS_SCHRITT));
    // Auf schmalen Schirmen liegt der Kopf des Werkzeugs sonst außer Sicht.
    kopf.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  async function kopiere() {
    const text = ergebnisAlsText(eingabe, ergebnis, quelle);
    try {
      await navigator.clipboard.writeText(text);
      setKopiert("ja");
    } catch {
      setKopiert("fehler");
    }
  }

  const terminRelevant = eingabe.anlaesse.termin !== "nie";
  const wochenText = String(SCHWELLEN.wochenProMonat).replace(".", ",");

  return (
    <div ref={kopf} className="scroll-mt-24" aria-labelledby={kopfId} role="region">
      {/* ── Legende ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px] text-gray-600 dark:text-gray-400 mb-5">
        <span className="flex items-center gap-2">
          <Etikett art="angabe" /> kommt von Ihnen
        </span>
        <span className="flex items-center gap-2">
          <Etikett art="annahme" /> feste Größe des Werkzeugs
        </span>
        <span className="flex items-center gap-2">
          <Etikett art="ergebnis" /> folgt aus Ihren Angaben
        </span>
      </div>

      {/* ── Schrittleiste ────────────────────────────────────────────────── */}
      <nav aria-label="Schritte des Checks" className="mb-5">
        <ol className="flex flex-wrap gap-2">
          {SCHRITTE.map((name, i) => {
            const aktiv = i === schritt;
            return (
              <li key={name}>
                <button
                  type="button"
                  onClick={() => geheZu(i)}
                  aria-current={aktiv ? "step" : undefined}
                  className={`rounded-full px-3.5 py-1.5 text-[14px] font-medium min-h-[36px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-gray-300 ${
                    aktiv
                      ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  <span className="tabular-nums">{i + 1}</span> · {name}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className={`${CARD} p-6 sm:p-8`}>
        <h3 id={kopfId} className="text-[22px] font-bold text-gray-900 dark:text-gray-100">
          {schritt === ERGEBNIS_SCHRITT
            ? "Ihr Ergebnis"
            : `Schritt ${schritt + 1} von ${ERGEBNIS_SCHRITT}: ${SCHRITTE[schritt]}`}
        </h3>

        {/* ── 1 · Anrufsituation ──────────────────────────────────────── */}
        {schritt === 0 && (
          <div className="mt-2">
            <p className={HINT}>
              Grobe Schätzungen genügen. Es geht darum, ob heute ein Problem besteht, nicht um eine
              exakte Zählung.
            </p>
            <div className="mt-6">
              <Zahlenfeld
                label="Eingehende Anrufe pro Woche"
                hinweis="Alle Anrufe, die bei Ihnen eingehen, ob angenommen oder nicht."
                wert={eingabe.anrufeProWoche}
                onChange={(v) => aendere({ anrufeProWoche: v })}
                min={0}
                step={10}
                einheit="Anrufe"
              />
              <Zahlenfeld
                label="Typische Gesprächsdauer"
                hinweis="Optional. Dient nur dazu, Ihre Gesprächsminuten je Monat auszurechnen."
                wert={eingabe.minutenProAnruf}
                onChange={(v) => aendere({ minutenProAnruf: v })}
                min={0}
                step={0.5}
                einheit="Minuten"
              />
              <Feld
                label="Wie oft gehen Anrufe heute verloren?"
                hinweis="Besetzt, nicht abgenommen, nach der Warteschleife aufgelegt."
              >
                <Auswahl<Erreichbarkeit>
                  wert={eingabe.erreichbarkeit}
                  onChange={(v) => aendere({ erreichbarkeit: v })}
                  optionen={[
                    ["kaum", "Kaum, wir sind gut erreichbar"],
                    ["stosszeiten", "Zu Stoßzeiten"],
                    ["regelmaessig", "Regelmäßig, auch außerhalb der Stoßzeiten"],
                    ["unbekannt", "Weiß ich nicht"],
                  ]}
                />
              </Feld>
              <Feld label="Wann kommen die Anrufe, die verloren gehen?" hinweis="Optional, Mehrfachauswahl.">
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["stosszeiten", "Zu Stoßzeiten während der Öffnungszeiten"],
                      ["ausserhalbOeffnungszeiten", "Außerhalb der Öffnungszeiten"],
                    ] as const
                  ).map(([key, text]) => (
                    <label
                      key={key}
                      className="flex items-center gap-3 rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-[15px] text-gray-800 dark:text-gray-200 min-h-[44px] cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gray-900 dark:has-[:focus-visible]:ring-gray-300"
                    >
                      <input
                        type="checkbox"
                        checked={eingabe[key]}
                        onChange={(e) => aendere({ [key]: e.target.checked })}
                        className="h-5 w-5 accent-gray-900 dark:accent-gray-100"
                      />
                      {text}
                    </label>
                  ))}
                </div>
              </Feld>
            </div>
          </div>
        )}

        {/* ── 2 · Anlässe ─────────────────────────────────────────────── */}
        {schritt === 1 && (
          <div className="mt-2">
            <p className={HINT}>
              Wie häufig kommt jeder Anlass bei Ihnen vor? Das Etikett rechts sagt, was ein
              Assistent damit tut. Das ist die eigentliche Trennlinie.
            </p>
            <ul className="mt-6 divide-y divide-gray-100 dark:divide-gray-800">
              {ANLAESSE.map((a) => (
                <li key={a.id} className="py-5 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                    <div className="min-w-0 max-w-prose">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={LABEL}>{a.label}</span>
                        <Etikett art="angabe" />
                      </div>
                      <p className={`${HINT} mt-1`}>{a.beispiel}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 text-[12px] font-semibold ${
                        a.klasse === "routine"
                          ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {a.klasse === "routine" ? "Kann der Assistent erledigen" : "Bleibt beim Menschen"}
                    </span>
                  </div>
                  <div className="mt-3">
                    <Auswahl<Haeufigkeit>
                      klein
                      wert={eingabe.anlaesse[a.id]}
                      onChange={(v) => aendereAnlass(a.id, v)}
                      optionen={HAEUFIGKEIT}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── 3 · Team ────────────────────────────────────────────────── */}
        {schritt === 2 && (
          <div className="mt-2">
            <p className={HINT}>
              Drei Voraussetzungen liegen bei Ihnen, nicht beim Anbieter. Keine davon ist ein
              Ausschlussgrund; jede offene wird zur Vorbereitung.
            </p>
            <div className="mt-6">
              <Feld
                label="Kann während der Öffnungszeiten ein Mensch übernehmen?"
                hinweis="Für Beschwerden, Notfälle und alles, was der Assistent nicht zu Ende bringen darf."
              >
                <Auswahl<Dreistufig>
                  wert={eingabe.uebernahmeMoeglich}
                  onChange={(v) => aendere({ uebernahmeMoeglich: v })}
                  optionen={DREISTUFIG}
                />
              </Feld>
              {terminRelevant && (
                <Feld
                  label="Lassen sich Ihre Terminregeln aufschreiben?"
                  hinweis="Welche Termine, welche Zeiten, welche Ausnahmen, wer bestätigt. Ohne Regeln kann der Assistent nur den Wunsch vorlegen."
                >
                  <Auswahl<Dreistufig>
                    wert={eingabe.terminregeln}
                    onChange={(v) => aendere({ terminregeln: v })}
                    optionen={DREISTUFIG}
                  />
                </Feld>
              )}
              <Feld
                label="Gibt es eine Person, die entscheidet und freigibt?"
                hinweis="Jemand, der den Anliegen-Katalog verantwortet und am Ende der Testphase Ja oder Nein sagt."
              >
                <Auswahl<"ja" | "nein">
                  wert={eingabe.freigabePerson}
                  onChange={(v) => aendere({ freigabePerson: v })}
                  optionen={[
                    ["ja", "Ja"],
                    ["nein", "Nein, noch nicht"],
                  ]}
                />
              </Feld>
            </div>
          </div>
        )}

        {/* ── 4 · Systeme ─────────────────────────────────────────────── */}
        {schritt === 3 && (
          <div className="mt-2">
            <p className={HINT}>
              Hier entstehen die meisten falschen Erwartungen. Das Werkzeug verspricht deshalb
              nichts, es nennt nur, was vorher geprüft werden muss.
            </p>
            <div className="mt-6">
              <Feld label="Wie verwalten Sie Termine heute?">
                <Auswahl<Terminsystem>
                  wert={eingabe.terminsystem}
                  onChange={(v) => aendere({ terminsystem: v })}
                  optionen={[
                    ["keins", "Ohne Software, etwa Kalender oder Papier"],
                    ["software-unbekannt", "Mit Software, Schnittstelle unbekannt"],
                    ["software-schnittstelle", "Mit Software, die eine Schnittstelle hat"],
                    ["unbekannt", "Weiß ich nicht"],
                  ]}
                />
              </Feld>
              <Feld
                label="Fallen am Telefon Gesundheitsdaten oder Berufsgeheimnisse an?"
                hinweis="Praxen, Therapeuten, Apotheken, Kanzleien: in der Regel ja."
              >
                <Auswahl<"ja" | "nein">
                  wert={eingabe.gesundheitsdaten}
                  onChange={(v) => aendere({ gesundheitsdaten: v })}
                  optionen={[
                    ["ja", "Ja"],
                    ["nein", "Nein"],
                  ]}
                />
              </Feld>
            </div>
          </div>
        )}

        {/* ── 5 · Erwartungen ─────────────────────────────────────────── */}
        {schritt === 4 && (
          <div className="mt-2">
            <p className={HINT}>
              Kreuzen Sie an, was auf Sie zutrifft. Jeder dieser Punkte ist ein Grund, von einem
              KI-Telefonassistenten abzuraten, jedenfalls von unserem.
            </p>
            <div className="mt-6 space-y-3">
              {ERWARTUNGEN.map(([id, text]) => (
                <label
                  key={id}
                  className="flex items-start gap-3 rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-3 text-[15px] text-gray-800 dark:text-gray-200 cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gray-900 dark:has-[:focus-visible]:ring-gray-300"
                >
                  <input
                    type="checkbox"
                    checked={eingabe.erwartungen[id]}
                    onChange={(e) => aendereErwartung(id, e.target.checked)}
                    className="mt-0.5 h-5 w-5 shrink-0 accent-gray-900 dark:accent-gray-100"
                  />
                  <span>{text}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* ── 6 · Ergebnis ────────────────────────────────────────────── */}
        {schritt === ERGEBNIS_SCHRITT && (
          <div className="mt-2">
            {!ergebnis.vollstaendig ? (
              <div className="mt-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20 p-5">
                <p className="text-[16px] font-semibold text-gray-900 dark:text-gray-100">
                  Noch kein Gesamtbild: es fehlen Angaben.
                </p>
                <ul className="mt-2 list-disc pl-5 text-[15px] text-gray-700 dark:text-gray-300 space-y-1">
                  {ergebnis.fehlendeAngaben.map((f) => (
                    <li key={f}>{FELD_LABEL[f] ?? f}</li>
                  ))}
                </ul>
                <p className={`${HINT} mt-3`}>
                  Solange etwas fehlt, gibt das Werkzeug kein Urteil ab, auch kein vorläufiges. Die
                  Signale je Bereich sehen Sie unten trotzdem.
                </p>
              </div>
            ) : (
              <div className="mt-4">
                <Etikett art="ergebnis" />
                <p className="mt-2 text-[24px] font-bold text-gray-900 dark:text-gray-100 leading-[1.25]">
                  {GESAMTBILD_TEXT[ergebnis.gesamtbild!].titel}
                </p>
                <p className="mt-2 text-[16px] text-gray-700 dark:text-gray-300 leading-[1.6] max-w-prose">
                  {GESAMTBILD_TEXT[ergebnis.gesamtbild!].text}
                </p>
              </div>
            )}

            {/* Signale */}
            <div className="mt-8">
              <div className="flex items-center gap-2">
                <h4 className="text-[17px] font-semibold text-gray-900 dark:text-gray-100">
                  Signale je Bereich
                </h4>
                <Etikett art="ergebnis" />
              </div>
              <ul className="mt-3 divide-y divide-gray-100 dark:divide-gray-800">
                {ergebnis.bereiche.map((b) => (
                  <li key={b.bereich} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className={`h-3 w-3 shrink-0 rounded-full ${SIGNAL_KLASSE[b.signal]}`}
                      />
                      <span className="text-[16px] font-semibold text-gray-900 dark:text-gray-100">
                        {b.titel}
                      </span>
                      <span className="text-[14px] text-gray-500 dark:text-gray-400">
                        {SIGNAL_TEXT[b.signal]}
                      </span>
                    </div>
                    {b.begruendung && (
                      <p className="mt-1.5 pl-6 text-[15px] text-gray-700 dark:text-gray-300 leading-[1.6] max-w-prose">
                        {b.begruendung}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Anlässe */}
            {(ergebnis.uebernehmbar.length > 0 || ergebnis.bleibtBeimTeam.length > 0) && (
              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-[17px] font-semibold text-gray-900 dark:text-gray-100">
                      Könnte der Assistent übernehmen
                    </h4>
                    <Etikett art="ergebnis" />
                  </div>
                  {ergebnis.uebernehmbar.length === 0 ? (
                    <p className={`${HINT} mt-2`}>Nach Ihren Angaben nichts.</p>
                  ) : (
                    <ul className="mt-3 space-y-3">
                      {ergebnis.uebernehmbar.map((a) => (
                        <li key={a.id} className="text-[15px] leading-[1.55]">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">{a.label}</span>
                          <span className="block text-gray-600 dark:text-gray-400">{a.umgang}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-[17px] font-semibold text-gray-900 dark:text-gray-100">
                      Bleibt beim Team
                    </h4>
                    <Etikett art="ergebnis" />
                  </div>
                  {ergebnis.bleibtBeimTeam.length === 0 ? (
                    <p className={`${HINT} mt-2`}>Nach Ihren Angaben nichts davon.</p>
                  ) : (
                    <ul className="mt-3 space-y-3">
                      {ergebnis.bleibtBeimTeam.map((a) => (
                        <li key={a.id} className="text-[15px] leading-[1.55]">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">{a.label}</span>
                          <span className="block text-gray-600 dark:text-gray-400">{a.umgang}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* Rechnerisch */}
            {ergebnis.anrufeProMonat !== null && (
              <div className="mt-8 rounded-xl bg-gray-50 dark:bg-gray-900 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-[17px] font-semibold text-gray-900 dark:text-gray-100">
                    Ihre Größenordnung
                  </h4>
                  <Etikett art="ergebnis" />
                  <Etikett art="annahme" />
                </div>
                <dl className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2 text-[15px]">
                  <div className="flex justify-between gap-4 border-b border-gray-200 dark:border-gray-800 py-1.5">
                    <dt className="text-gray-600 dark:text-gray-400">Anrufe pro Monat</dt>
                    <dd className="font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                      {ergebnis.anrufeProMonat.toLocaleString("de-DE")}
                    </dd>
                  </div>
                  {ergebnis.minutenProMonat !== null && (
                    <div className="flex justify-between gap-4 border-b border-gray-200 dark:border-gray-800 py-1.5">
                      <dt className="text-gray-600 dark:text-gray-400">Gesprächsminuten pro Monat</dt>
                      <dd className="font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                        {ergebnis.minutenProMonat.toLocaleString("de-DE")}
                      </dd>
                    </div>
                  )}
                </dl>
                <p className={`${HINT} mt-3`}>
                  Annahme: {wochenText} Wochen je Monat, dieselbe Umrechnung wie im Preisrechner.
                  Was das kostet, rechnet der{" "}
                  <Link to={RECHNER_LINK} className="underline underline-offset-4 hover:no-underline">
                    Preis- und Wirtschaftlichkeitsrechner
                  </Link>{" "}
                  mit genau diesen Werten.
                </p>
              </div>
            )}

            {/* Vorbereitung */}
            {ergebnis.vorbereitung.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center gap-2">
                  <h4 className="text-[17px] font-semibold text-gray-900 dark:text-gray-100">
                    Vor dem Erstgespräch klären
                  </h4>
                  <Etikett art="ergebnis" />
                </div>
                <ol className="mt-3 list-decimal pl-5 space-y-2 text-[15px] text-gray-700 dark:text-gray-300 leading-[1.6] max-w-prose">
                  {ergebnis.vorbereitung.map((v) => (
                    <li key={v}>{v}</li>
                  ))}
                </ol>
              </div>
            )}

            {/* Nächster Schritt */}
            <div className="mt-10 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
              <p className="text-[16px] text-gray-700 dark:text-gray-300 leading-[1.6] max-w-prose">
                {ergebnis.gesamtbild === "abraten"
                  ? "Wenn sich die Voraussetzung ändert, die zum Abraten führt, gehen Sie den Check einfach noch einmal durch. Ein Erstgespräch lohnt sich erst dann."
                  : CTA.nextStep}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                {ergebnis.gesamtbild !== "abraten" && (
                  <Link
                    to="/kontakt"
                    onClick={() => trackEvent("fit_check_cta_clicked", "Eignungscheck")}
                    className={BUTTON_PRIMARY}
                  >
                    {CTA.primaryLabel}
                  </Link>
                )}
                <button type="button" onClick={kopiere} className={BUTTON_SECONDARY}>
                  {kopiert === "ja" ? "Kopiert" : "Ergebnis als Text kopieren"}
                </button>
              </div>
              {kopiert === "fehler" && (
                <div className="mt-4">
                  <p className={HINT}>
                    Das Kopieren war in diesem Browser nicht möglich. Hier ist der Text zum Markieren:
                  </p>
                  <textarea
                    readOnly
                    aria-label="Ergebnis als Text"
                    value={ergebnisAlsText(eingabe, ergebnis, quelle)}
                    rows={12}
                    className="mt-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-[13px] font-mono text-gray-800 dark:text-gray-200"
                  />
                </div>
              )}
              <p className={`${HINT} mt-4`}>
                Ihre Angaben bleiben in diesem Browser. Es wird nichts gespeichert und nichts
                übertragen; gemeldet wird nur, dass der Check genutzt wurde, und auch das nur mit Ihrer
                Einwilligung in die Reichweitenmessung.
              </p>
            </div>
          </div>
        )}

        {/* ── Navigation ──────────────────────────────────────────────── */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 dark:border-gray-800 pt-6">
          <button
            type="button"
            onClick={() => geheZu(schritt - 1)}
            disabled={schritt === 0}
            className={BUTTON_SECONDARY}
          >
            Zurück
          </button>
          {schritt < ERGEBNIS_SCHRITT ? (
            <button type="button" onClick={() => geheZu(schritt + 1)} className={BUTTON_PRIMARY}>
              {schritt === ERGEBNIS_SCHRITT - 1 ? "Zum Ergebnis" : "Weiter"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEingabe(LEERE_EINGABE);
                setKopiert("nein");
                geheZu(0);
              }}
              className={BUTTON_SECONDARY}
            >
              Von vorn beginnen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
