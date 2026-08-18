// ─────────────────────────────────────────────────────────────────────────────
// Der interaktive Teil des Praxis-Rechners (COPY-BRIEF-3 §6).
//
// Wird von `PraxisRechnerSection` lazy nachgeladen; Überschrift und
// erklärender Text stehen dort statisch im HTML, damit sie im Prerender
// enthalten bleiben.
//
// Regeln, die hier bindend sind:
// - Zwei getrennte Kennzahlen. Angenommene Anrufe und eingesparte
//   Bearbeitungszeit werden NIE zu einer Zahl zusammengefasst.
// - Ergebnis immer als Spanne. Untere Kante fest bei 10 % — der belegten
//   Untergrenze der einzigen dokumentierten Praxisrechnung.
// - Cogniiq-Kosten vollständig gegengerechnet: Monatspreis und Einrichtung.
// - Keine hochzählenden Zahlen, keine Animation, kein Gate.
// - Alle Tarifzahlen aus TARIFE — keine Zahl wird hier erneut getippt.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { RECHNER, TARIFE, type Tarif } from "@/lib/telefonassistent-copy";

/** Wochen je Monat, gerundet. */
const WOCHEN_PRO_MONAT = 4.33;
/** Gesprächsdauer je Anruf — dieselbe Annahme wie auf der Preisseite. */
const MINUTEN_PRO_ANRUF = 2;
/** Preis je Minute über dem Kontingent. */
const MEHRPREIS_PRO_MINUTE = 0.39;
/** Belegte Untergrenze der einzigen dokumentierten Praxisrechnung. */
const UNTERGRENZE_PROZENT = 10;

function eur(v: number): string {
  return `${Math.round(v).toLocaleString("de-DE")}\u00A0€`;
}

function zahl(v: number): string {
  return Math.round(v).toLocaleString("de-DE");
}

function betragZuZahl(betrag: string): number {
  return Number(betrag.replace(/[^\d,]/g, "").replace(/\./g, "").replace(",", "."));
}

interface TarifErgebnis {
  tarif: Tarif;
  monatlich: number;
  mehrverbrauchMinuten: number;
  einrichtung: number;
}

/**
 * Tarifwahl — bildet die Zusage der Preisseite exakt ab:
 *
 *   1. Über dem Kontingent kostet jede Minute 0,39 €.
 *   2. Nach oben ist jeder Tarif auf seine ausgewiesene Obergrenze gedeckelt.
 *   3. Bei dauerhaft höherem Aufkommen wechseln wir in den passenden Tarif,
 *      damit der Kunde nicht Monat für Monat den Zuschlag zahlt.
 *
 * Aus Punkt 3 folgt die Regel: Wir nehmen den günstigsten Tarif, dessen
 * Obergrenze bei diesem Bedarf NICHT erreicht wird — denn ein dauerhaft am
 * Deckel laufender Tarif ist genau der Zustand, den Punkt 3 ausschließt. Ist
 * bei jedem Tarif der Deckel erreicht, bleibt der größte mit seiner
 * Obergrenze.
 *
 * Ohne Punkt 3 würde die Deckelung den kleinsten Tarif bei hohem Verbrauch zum
 * günstigsten machen; mit Punkt 3 wählt der Rechner das, was der Kunde
 * tatsächlich bekommt.
 */
function waehleTarif(minutenBedarf: number): TarifErgebnis {
  const kandidaten = TARIFE.map((t) => {
    const ueber = Math.max(0, minutenBedarf - t.minuten);
    const obergrenze = betragZuZahl(t.obergrenze);
    const roh = betragZuZahl(t.monatlich) + ueber * MEHRPREIS_PRO_MINUTE;
    return {
      tarif: t,
      monatlich: Math.min(roh, obergrenze),
      mehrverbrauchMinuten: ueber,
      einrichtung: betragZuZahl(t.einrichtung),
      amDeckel: roh >= obergrenze,
    };
  });

  const ohneDeckel = kandidaten.filter((k) => !k.amDeckel);
  const gewaehlt =
    ohneDeckel.length > 0
      ? ohneDeckel.reduce((a, b) => (b.monatlich < a.monatlich ? b : a))
      : kandidaten[kandidaten.length - 1];

  return {
    tarif: gewaehlt.tarif,
    monatlich: gewaehlt.monatlich,
    mehrverbrauchMinuten: gewaehlt.mehrverbrauchMinuten,
    einrichtung: gewaehlt.einrichtung,
  };
}

interface ReglerProps {
  id: string;
  label: string;
  hinweis?: string;
  wert: number;
  min: number;
  max: number;
  step: number;
  einheit: string;
  onChange: (v: number) => void;
}

function Regler({ id, label, hinweis, wert, min, max, step, einheit, onChange }: ReglerProps) {
  const pct = ((wert - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 mb-2">
        <label htmlFor={id} className="text-[16px] font-medium text-gray-800 dark:text-gray-200">
          {label}
        </label>
        <span className="text-[17px] font-semibold text-gray-900 dark:text-gray-100 tabular-nums whitespace-nowrap">
          {zahl(wert)}&nbsp;{einheit}
        </span>
      </div>
      {hinweis && (
        <p className="text-[14px] text-gray-500 dark:text-gray-500 mb-2 leading-[1.5]">{hinweis}</p>
      )}
      <div className="relative h-11 flex items-center">
        <div className="absolute left-0 right-0 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full">
          <div
            className="absolute left-0 top-0 h-full bg-gray-900 dark:bg-gray-100 rounded-full"
            style={{ width: `${pct}%` }}
          />
        </div>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={wert}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative w-full h-11 opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}

function Zeile({ label, wert }: { label: string; wert: string }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-[16px] text-gray-600 dark:text-gray-400">{label}</span>
      <span className="text-[16px] text-gray-900 dark:text-gray-100 tabular-nums whitespace-nowrap font-medium">
        {wert}
      </span>
    </div>
  );
}

export function PraxisRechnerWidget() {
  const [anrufeProWoche, setAnrufeProWoche] = useState(120);
  const [verpasstProzent, setVerpasstProzent] = useState(20);
  const [minutenProAnruf, setMinutenProAnruf] = useState(3);
  const [stundenkosten, setStundenkosten] = useState(18);
  const [ersparnisProzent, setErsparnisProzent] = useState(20);
  // Bewusst als String und bewusst leer: ohne Angabe des Besuchers wird dieser
  // Teil der Rechnung NICHT berechnet und NICHT geschätzt.
  const [terminwertEingabe, setTerminwertEingabe] = useState("");

  const anrufeProMonat = anrufeProWoche * WOCHEN_PRO_MONAT;
  const heuteAngenommen = anrufeProMonat * (1 - verpasstProzent / 100);
  const zusaetzlichAngenommen = anrufeProMonat - heuteAngenommen;

  // Kennzahl 2 — Bearbeitungszeit, getrennt von Kennzahl 1.
  const telefonzeitMinuten = heuteAngenommen * minutenProAnruf;
  const stundenBei = (p: number) => (telefonzeitMinuten * (p / 100)) / 60;
  const stundenUnten = stundenBei(UNTERGRENZE_PROZENT);
  const stundenOben = stundenBei(Math.max(ersparnisProzent, UNTERGRENZE_PROZENT));
  const wertUnten = stundenUnten * stundenkosten;
  const wertOben = stundenOben * stundenkosten;

  // Cogniiq-Kosten, vollständig gegengerechnet.
  const minutenBedarf = anrufeProMonat * MINUTEN_PRO_ANRUF;
  const { tarif, monatlich, mehrverbrauchMinuten, einrichtung } = waehleTarif(minutenBedarf);
  const einrichtungProMonat = einrichtung / 12;
  const kostenProMonat = monatlich + einrichtungProMonat;

  // Wert der zusätzlich angenommenen Anrufe — nur wenn der Besucher eine Zahl
  // eingetragen hat. `null` bedeutet: dieser Teil bleibt leer.
  const terminwert =
    terminwertEingabe.trim() === "" ? null : Number(terminwertEingabe.replace(",", "."));
  const terminwertGueltig = terminwert !== null && Number.isFinite(terminwert) && terminwert > 0;
  const anrufwertMax = terminwertGueltig ? zusaetzlichAngenommen * (terminwert as number) : null;

  const nettoUnten = wertUnten - kostenProMonat;
  const nettoOben = wertOben - kostenProMonat;
  // Wie viele der zusätzlich angenommenen Anrufe zu einem Termin führen müssten,
  // damit sich der Empfang trägt. Keine Abschlussquote unterstellt — die Zahl
  // wird ausgerechnet, nicht angenommen.
  const noetigeTermine = terminwertGueltig
    ? Math.max(0, (kostenProMonat - wertOben) / (terminwert as number))
    : null;
  const istPunktwert = ersparnisProzent <= UNTERGRENZE_PROZENT;

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* ── Eingaben ── */}
      <div className="p-7 rounded-2xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
        <p className="text-[19px] font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Ihre Zahlen
        </p>
        <p className="text-[14px] text-gray-500 dark:text-gray-500 mb-8 leading-[1.5]">
          {RECHNER.startwertHinweis}
        </p>

        <div className="space-y-7">
          <Regler
            id="rechner-anrufe"
            label="Anrufe pro Woche"
            hinweis="Alle eingehenden Anrufe, auch die, die niemand annimmt."
            wert={anrufeProWoche}
            min={20}
            max={600}
            step={10}
            einheit="Anrufe"
            onChange={setAnrufeProWoche}
          />
          <Regler
            id="rechner-verpasst"
            label="Davon heute nicht angenommen"
            hinweis="Besetzt, niemand am Tresen frei, außerhalb der Telefonzeiten."
            wert={verpasstProzent}
            min={0}
            max={60}
            step={1}
            einheit="%"
            onChange={setVerpasstProzent}
          />
          <Regler
            id="rechner-dauer"
            label="Bearbeitungszeit je Anruf"
            hinweis="Gespräch plus Nacharbeit: notieren, eintragen, weiterleiten."
            wert={minutenProAnruf}
            min={1}
            max={10}
            step={1}
            einheit="Min."
            onChange={setMinutenProAnruf}
          />
          <div>
            <Regler
              id="rechner-stundenkosten"
              label="Stundenkosten Ihres Personals"
              wert={stundenkosten}
              min={12}
              max={60}
              step={1}
              einheit="€/h"
              onChange={setStundenkosten}
            />
            <p className="text-[14px] text-gray-500 dark:text-gray-500 leading-[1.5]">
              {RECHNER.stundenkostenQuelle}
              <span className="block mt-1">Quelle: {RECHNER.stundenkostenSource}</span>
            </p>
          </div>
          <Regler
            id="rechner-ersparnis"
            label="Angenommene Zeitersparnis"
            hinweis="Obere Kante der Spanne. Die untere liegt fest bei 10 %."
            wert={ersparnisProzent}
            min={10}
            max={40}
            step={1}
            einheit="%"
            onChange={setErsparnisProzent}
          />

          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <p className="text-[16px] text-gray-600 dark:text-gray-400 leading-[1.7] mb-4 mt-5">
              {RECHNER.terminwertKontext}
            </p>
            <label
              htmlFor="rechner-terminwert"
              className="block text-[16px] font-medium text-gray-800 dark:text-gray-200 mb-2"
            >
              {RECHNER.terminwertLabel}
            </label>
            <div className="flex items-center gap-3">
              <input
                id="rechner-terminwert"
                type="number"
                inputMode="decimal"
                min={0}
                step={1}
                value={terminwertEingabe}
                onChange={(e) => setTerminwertEingabe(e.target.value)}
                aria-describedby="rechner-terminwert-hinweis"
                className="w-40 min-h-[44px] px-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-[17px] text-gray-900 dark:text-gray-100 tabular-nums focus:outline-none focus:border-gray-900 dark:focus:border-gray-100"
              />
              <span className="text-[17px] text-gray-600 dark:text-gray-400">€ je Termin</span>
            </div>
            {!terminwertGueltig && (
              <p
                id="rechner-terminwert-hinweis"
                className="text-[14px] text-gray-500 dark:text-gray-500 mt-2 leading-[1.5]"
              >
                {RECHNER.terminwertLeer}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Ergebnis ── */}
      <div className="space-y-5">
        {/* Kennzahl 1 — bewusst ohne Geldbetrag */}
        <div className="p-7 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
          <p className="text-[14px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-500 mb-4">
            1 · Angenommene Anrufe
          </p>
          <Zeile label="Anrufe im Monat" wert={zahl(anrufeProMonat)} />
          <Zeile label="davon heute angenommen" wert={zahl(heuteAngenommen)} />
          <Zeile label="künftig angenommen" wert={`${zahl(anrufeProMonat)} (rund alle)`} />
          <p className="text-[17px] text-gray-900 dark:text-gray-100 leading-[1.6] mt-4">
            <span className="font-semibold tabular-nums">{zahl(zusaetzlichAngenommen)}</span>{" "}
            Anrufe im Monat, die heute niemanden erreichen, werden angenommen.
          </p>
          {terminwertGueltig ? (
            <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-700">
              <Zeile
                label={`Bei ${zahl(terminwert as number)} € je Termin, wenn jeder dieser Anrufe zu einem Termin führt`}
                wert={`${eur(anrufwertMax as number)} / Monat`}
              />
              <p className="text-[14px] text-gray-500 dark:text-gray-500 mt-3 leading-[1.5]">
                Das ist die Obergrenze, nicht die Erwartung: Nicht jeder angenommene
                Anruf wird ein Termin. Wie hoch der Anteil in Ihrer Praxis ist, wissen
                wir nicht und setzen dafür keine Zahl ein.
              </p>
            </div>
          ) : (
            <p className="text-[14px] text-gray-500 dark:text-gray-500 mt-2 leading-[1.5]">
              Bewusst ohne Eurobetrag: Was ein einzelner Anruf wert ist, weiß Ihre
              Praxis besser als wir. Tragen Sie unten einen Wert ein, wenn Sie diesen
              Teil rechnen möchten.
            </p>
          )}
        </div>

        {/* Kennzahl 2 — getrennt, als Spanne */}
        <div className="p-7 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
          <p className="text-[14px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-500 mb-4">
            2 · Eingesparte Bearbeitungszeit
          </p>
          <p className="text-[26px] font-bold text-gray-900 dark:text-gray-100 tabular-nums leading-tight">
            {istPunktwert
              ? `${zahl(stundenOben)} Stunden`
              : `${zahl(stundenUnten)} bis ${zahl(stundenOben)} Stunden`}
          </p>
          <p className="text-[16px] text-gray-600 dark:text-gray-400 mb-4">im Monat</p>
          <Zeile
            label="Gegenwert"
            wert={istPunktwert ? eur(wertOben) : `${eur(wertUnten)} bis ${eur(wertOben)}`}
          />
          {istPunktwert && (
            <p className="text-[14px] text-gray-500 dark:text-gray-500 mt-3 leading-[1.5]">
              Am unteren Anschlag rechnet der Rechner mit genau 10 % — dann ist das
              Ergebnis ein einzelner Wert statt einer Spanne.
            </p>
          )}
        </div>

        {/* Gegenrechnung */}
        <div className="p-7 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
          <p className="text-[14px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-500 mb-4">
            3 · Was Cogniiq kostet
          </p>
          <Zeile label={`Tarif ${tarif.name}`} wert={`${eur(monatlich)} / Monat`} />
          {mehrverbrauchMinuten > 0 && (
            <Zeile
              label="darin Mehrverbrauch"
              wert={`${zahl(mehrverbrauchMinuten)} Min., gedeckelt auf ${tarif.obergrenze}`}
            />
          )}
          <Zeile label="Einrichtung, einmalig" wert={tarif.einrichtung} />
          <Zeile label="Einrichtung, auf zwölf Monate verteilt" wert={`${eur(einrichtungProMonat)} / Monat`} />
          <Zeile label="Kosten im ersten Jahr" wert={`${eur(kostenProMonat)} / Monat`} />
        </div>

        {/* Ergebnis */}
        <div className="p-7 rounded-2xl border border-gray-300 dark:border-gray-600">
          <p className="text-[14px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-500 mb-3">
            Bleibt im ersten Jahr
          </p>
          <p className="text-[30px] font-bold text-gray-900 dark:text-gray-100 tabular-nums leading-tight">
            {istPunktwert
              ? `${eur(nettoOben)} / Monat`
              : `${eur(nettoUnten)} bis ${eur(nettoOben)} / Monat`}
          </p>
          <p className="text-[16px] text-gray-600 dark:text-gray-400 mt-3 leading-[1.6]">
            {nettoOben < 0
              ? "Bei diesen Angaben trägt sich der Empfang rechnerisch nicht. Das ist ein ehrliches Ergebnis und ein guter Grund, das Erstgespräch kurz zu halten."
              : "Nach Abzug unserer eigenen Kosten, einschließlich der Einrichtung."}
          </p>
          {terminwertGueltig && (
            <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-700">
              <p className="text-[17px] text-gray-900 dark:text-gray-100 leading-[1.6]">
                {(noetigeTermine as number) <= 0 ? (
                  <>Die eingesparte Zeit deckt die Kosten bereits — jeder gewonnene Termin kommt hinzu.</>
                ) : (
                  <>
                    Damit sich der Empfang trägt, müssten{" "}
                    <span className="font-semibold tabular-nums">
                      {Math.ceil(noetigeTermine as number)}
                    </span>{" "}
                    der {zahl(zusaetzlichAngenommen)} zusätzlich angenommenen Anrufe im
                    Monat zu einem Termin führen. Das sind{" "}
                    {Math.round((Math.ceil(noetigeTermine as number) / zusaetzlichAngenommen) * 100)}{" "}
                    Prozent.
                  </>
                )}
              </p>
              <p className="text-[14px] text-gray-500 dark:text-gray-500 mt-2 leading-[1.5]">
                Diese Zahl ist ausgerechnet, nicht angenommen. Ob sie realistisch ist,
                beurteilen Sie.
              </p>
            </div>
          )}
          <p className="text-[14px] text-gray-500 dark:text-gray-500 mt-4 leading-[1.5]">
            {RECHNER.label}
          </p>
        </div>

        {/* Rechenweg — aufklappbar, ohne JavaScript-Animation */}
        <details className="p-7 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
          <summary className="text-[17px] font-semibold text-gray-900 dark:text-gray-100 cursor-pointer min-h-[44px] flex items-center">
            Rechenweg im Einzelnen
          </summary>
          <div className="mt-5 space-y-3 text-[16px] text-gray-600 dark:text-gray-400 leading-[1.7]">
            <p>
              <strong className="font-semibold text-gray-900 dark:text-gray-100">
                Anrufe im Monat:
              </strong>{" "}
              {zahl(anrufeProWoche)} × {WOCHEN_PRO_MONAT} Wochen = {zahl(anrufeProMonat)}.
            </p>
            <p>
              <strong className="font-semibold text-gray-900 dark:text-gray-100">
                Telefonzeit heute:
              </strong>{" "}
              {zahl(heuteAngenommen)} angenommene Anrufe × {minutenProAnruf} Min. ={" "}
              {zahl(telefonzeitMinuten)} Min. im Monat.
            </p>
            <p>
              <strong className="font-semibold text-gray-900 dark:text-gray-100">
                Eingesparte Zeit:
              </strong>{" "}
              {UNTERGRENZE_PROZENT} % bis {Math.max(ersparnisProzent, UNTERGRENZE_PROZENT)} % davon
              = {zahl(stundenUnten)} bis {zahl(stundenOben)} Stunden. Mal{" "}
              {zahl(stundenkosten)} €/h ergibt {eur(wertUnten)} bis {eur(wertOben)}.
            </p>
            <p>
              <strong className="font-semibold text-gray-900 dark:text-gray-100">
                Tarifwahl:
              </strong>{" "}
              {zahl(anrufeProMonat)} Anrufe × {MINUTEN_PRO_ANRUF} Min. ={" "}
              {zahl(minutenBedarf)} Min. Bedarf. Gewählt wird der günstigste Tarif,
              der bei diesem Bedarf nicht dauerhaft an seiner Obergrenze läuft:{" "}
              {tarif.name} mit {zahl(tarif.minuten)} Min.
              {mehrverbrauchMinuten > 0 &&
                ` Darüber ${zahl(mehrverbrauchMinuten)} Min. zu ${MEHRPREIS_PRO_MINUTE.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €, gedeckelt auf ${tarif.obergrenze}.`}
            </p>
            <p>
              <strong className="font-semibold text-gray-900 dark:text-gray-100">
                Kosten:
              </strong>{" "}
              {eur(monatlich)} monatlich plus {tarif.einrichtung} Einrichtung, auf zwölf
              Monate verteilt = {eur(kostenProMonat)} im Monat.
            </p>
            <p>
              <strong className="font-semibold text-gray-900 dark:text-gray-100">
                Warum die untere Kante bei 10 % liegt:
              </strong>{" "}
              Die einzige öffentlich dokumentierte Rechnung eines Praxisinhabers zu
              genau dieser Frage liegt bei 10 bis 20 %, bewusst netto nach Nacharbeit
              gerechnet. Wir setzen die untere Kante deshalb fest auf diesen Wert.
            </p>
            {terminwertGueltig ? (
              <p>
                <strong className="font-semibold text-gray-900 dark:text-gray-100">
                  Gewonnene Termine, getrennt gerechnet:
                </strong>{" "}
                {zahl(zusaetzlichAngenommen)} zusätzlich angenommene Anrufe ×{" "}
                {zahl(terminwert as number)} € = {eur(anrufwertMax as number)} — aber nur,
                wenn jeder dieser Anrufe zu einem Termin führt. Diese Zahl fließt
                deshalb NICHT in das Ergebnis oben ein; sie steht daneben. Ins
                Verhältnis gesetzt ergibt sie, wie viele Termine die Kosten decken
                würden.
              </p>
            ) : (
              <p>
                <strong className="font-semibold text-gray-900 dark:text-gray-100">
                  Was nicht eingerechnet ist:
                </strong>{" "}
                Der Wert der zusätzlich angenommenen Anrufe. Was ein gewonnener Termin
                oder eine rechtzeitige Absage wert ist, hängt von Ihrer Praxis ab — wir
                setzen dafür keine Zahl ein.
              </p>
            )}
          </div>
        </details>
      </div>
    </div>
  );
}
