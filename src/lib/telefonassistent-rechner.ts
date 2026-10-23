// ─────────────────────────────────────────────────────────────────────────────
// Rechenkern für Preisschätzung und Nutzenrechnung auf /ki-telefonassistent.
//
// BEWUSST OHNE REACT. Vertragsnahe Arithmetik gehört in Funktionen, die sich
// einzeln prüfen lassen — `telefonassistent-rechner.test.ts` rechnet jeden
// Grenzfall von Hand nach. Eine Zahl, die nur über ein gerendertes Bauteil
// getestet wird, ist nicht geprüft, sondern bloß einmal beobachtet worden.
//
// ZAHLENHERKUNFT. Jede Zahl kommt aus `telefonassistent-copy.ts`: `TARIFE`
// (Minutenkontingent, Monatspreis, Obergrenze, Einrichtung),
// `FAKTEN.mehrpreisProMinuteEur`, `SPRACHEN_PREISE`. In dieser Datei steht
// KEIN Betrag als Literal.
//
// WAS HIER NICHT GERECHNET WIRD — und warum das Absicht ist:
//
//   • Der 20-%-Aufschlag für monatliche Kündbarkeit (`FAKTEN.laufzeit`). Die
//     Quelle sagt nicht, worauf er sich bemisst: Grundpreis, Mehrverbrauch,
//     Obergrenze, Sprachaufschlag, Einrichtung. Fünf Lesarten, fünf Ergebnisse.
//     Der Aufschlag wird deshalb als Regel angezeigt, nicht als Rechenweg.
//
//   • Ob der Sprachaufschlag INNERHALB der Tarif-Obergrenze liegt oder daneben.
//     Die Quelle sagt es nicht. Solange Telefonie + Aufschlag UNTER der
//     Obergrenze bleiben, ergeben beide Lesarten dieselbe Summe, und die wird
//     genannt. Darüber steht die Summe als Spanne zwischen Obergrenze und
//     Telefonie + Aufschlag — nicht als eine Zahl (siehe `monatlichSpanne`).
//
//   • Kosten einer kundenspezifischen Anbindung, inklusive Gebühren Dritter.
//     Die stehen erst nach der technischen Prüfung fest. Sie erscheinen als
//     `unbekannt`, NIE als 0 — eine unbekannte Position als Null zu zeigen
//     wäre die eine Unehrlichkeit, die ein Preisrechner nicht überlebt.
//
//   • Die TARIFZUORDNUNG als Vertragsregel. `waehleSzenario` bildet die
//     veröffentlichte Zusage (`FAKTEN.tarifzuordnung`) auf EINEN eingegebenen
//     Monatswert ab. Ob dieser Wert „dauerhaft" ist, ob ein Kunde bei einem
//     Spitzenmonat im kleineren Tarif mit Obergrenze bleibt und wer welchen
//     Tarif überhaupt nutzen darf, ist nicht bestätigt (COPY-CLAIMS F10/Z1,
//     OWNER-INPUT). Der Kern liefert deshalb beides: den Tarif nach der
//     veröffentlichten Regel UND den Vergleich aller Listentarife bei diesem
//     Aufkommen (`tarifVergleich`), damit die Oberfläche keinen „günstigsten
//     Tarif" verspricht, sondern den Rechenweg offenlegt.
// ─────────────────────────────────────────────────────────────────────────────
import { FAKTEN, SPRACHEN_PREISE, TARIFE, type Tarif } from "@/lib/telefonassistent-copy";

/** Minuten pro Stunde — benannt, damit die Formeln lesbar bleiben. */
const MINUTEN_PRO_STUNDE = 60;

/*
  Wochen je Monat und Monate je Jahr stehen seit dem 12.09.2026 in
  `src/lib/zeitrechnung.ts` — einem Modul ohne Abhängigkeiten, das auch der
  Automatisierungs-Rechner liest, ohne dafür das Preismodell des
  Telefonassistenten mitzuladen. Hier unverändert weiterexportiert, damit für
  bestehende Aufrufer und Tests nichts umzuschreiben ist; die Zahl selbst steht
  weiterhin an genau einer Stelle.
*/
export { WOCHEN_PRO_MONAT } from "@/lib/zeitrechnung";
import { MONATE_PRO_JAHR, WOCHEN_PRO_MONAT } from "@/lib/zeitrechnung";

/** Wochenaufkommen in Monatsaufkommen. Ein Ort, eine Umrechnung. */
export function anrufeProMonatAusWoche(anrufeProWoche: number): number {
  return Math.max(0, anrufeProWoche || 0) * WOCHEN_PRO_MONAT;
}

// ── Eingaben ────────────────────────────────────────────────────────────────

export interface VolumenEingabe {
  /** Eingehende Anrufe pro Monat, die der Assistent annehmen soll. */
  anrufeProMonat: number;
  /** Durchschnittliche Gesprächsdauer in Minuten. */
  minutenProAnruf: number;
}

/**
 * Zusatzsprachen NEBEN Deutsch. Deutsch ist enthalten, zählt hier also nicht
 * mit. `3` bedeutet „drei oder mehr" und löst den Paketpreis aus — die Quelle
 * beziffert oberhalb des Pakets keinen weiteren Sprung.
 */
export type Zusatzsprachen = 0 | 1 | 2 | 3;

// ── Ergebnisse ──────────────────────────────────────────────────────────────

/** Ein Betrag, der noch nicht feststeht. Niemals als 0 dargestellt. */
export const UNBEKANNT = "unbekannt" as const;
export type Betrag = number | typeof UNBEKANNT;

/*
  Ein Ergebnis, das NICHT „null" und NICHT „negativ" ist, sondern „noch nicht
  vollständig gerechnet". Solange ein Pflichtfeld eines AKTIVEN Bausteins
  fehlt, gibt es für Saldo, Jahreswert und Amortisation KEINE Zahl — weder
  eine negative noch eine positive. Die Oberfläche kann daraus nichts anderes
  machen als einen neutralen Hinweis.
*/
export const UNVOLLSTAENDIG = "unvollstaendig" as const;
export type Wirtschaftsbetrag = number | typeof UNBEKANNT | typeof UNVOLLSTAENDIG;

/*
  Ein Preis, den die Quelle nicht eindeutig festlegt.

  Unterschied zu UNBEKANNT: UNBEKANNT steht für etwas, das erst nach einer
  Prüfung feststeht (die Systemanbindung). OFFEN steht für etwas, das
  feststeht — aber in unserer eigenen Preisliste zwei Lesarten zulässt. Beides
  darf nie als 0 erscheinen, und beides gehört benannt statt geraten.
*/
export const OFFEN = "offen" as const;
export type Preisbetrag = number | typeof OFFEN;

export interface TarifSzenario {
  tarif: Tarif;
  /** Minuten über dem Kontingent; 0, wenn das Kontingent reicht. */
  mehrverbrauchMinuten: number;
  /** Mehrverbrauch in Euro, vor der Deckelung. */
  mehrverbrauchEur: number;
  /** Grundpreis + Mehrverbrauch, auf die Obergrenze gedeckelt. */
  telefonieMonatlichEur: number;
  /** true, wenn die Deckelung greift — der Tarif läuft dann am Anschlag. */
  amDeckel: boolean;
}

export interface PreisErgebnis {
  /** 'standard' = ein Tarif aus TARIFE trägt das Aufkommen nach der
   *  veröffentlichten Zuordnungsregel.
   *  'individuell' = auch der größte Tarif liefe dauerhaft am Deckel; dann gilt
   *  kein Listenpreis mehr, sondern ein individuelles Kontingent. */
  modus: "standard" | "individuell";
  minutenProMonat: number;
  /** Tarif nach der veröffentlichten Zuordnungsregel. Nur bei
   *  modus === 'standard' gesetzt. */
  szenario: TarifSzenario | null;
  /** Alle Listentarife bei diesem Aufkommen — der offengelegte Rechenweg,
   *  aus dem die Zuordnung folgt. Immer gesetzt, auch im individuellen Modus. */
  vergleich: TarifSzenario[];
  /** Aufschlag für Zusatzsprachen, monatlich. 0 bei „nur Deutsch",
   *  `OFFEN`, wo die Preisliste zwei Lesarten zulässt (siehe
   *  `sprachenAufschlagEur`). */
  sprachenMonatlichEur: Preisbetrag;
  /** true, wenn der Aufschlag nicht eindeutig ableitbar ist und im Angebot
   *  ausgewiesen wird. Dann ist auch `monatlichGesamtEur` nicht bezifferbar. */
  sprachenOffen: boolean;
  /** Einmalige Einrichtung. 'unbekannt' im individuellen Modus. */
  einrichtungEur: Betrag;
  /** Wiederkehrend je Monat = Telefonie + Sprachen. 'unbekannt' im
   *  individuellen Modus, bei offenem Sprachaufschlag — und wenn Telefonie +
   *  Aufschlag die Obergrenze überschreiten, weil dann offen ist, ob der
   *  Aufschlag unter die Obergrenze fällt (dann `monatlichSpanne`). */
  monatlichGesamtEur: Betrag;
  /** Gesetzt, wenn die Summe nur als Spanne benennbar ist: `min` = Obergrenze
   *  (Aufschlag innerhalb), `max` = Telefonie + Aufschlag (Aufschlag daneben). */
  monatlichSpanne: { min: number; max: number } | null;
  /** Steht immer erst nach der technischen Prüfung fest. */
  anbindungEur: typeof UNBEKANNT;
}

// ── Preislogik ──────────────────────────────────────────────────────────────

/**
 * Minutenbedarf aus Anrufen und Dauer. Negative oder unsinnige Eingaben werden
 * auf 0 geklemmt, damit ein leeres Feld keine negative Rechnung erzeugt. Ob
 * ein Feld überhaupt ausgefüllt ist, entscheidet die Oberfläche VOR diesem
 * Aufruf — ein leeres Anruffeld ist kein Aufkommen von null.
 */
export function minutenProMonat({ anrufeProMonat, minutenProAnruf }: VolumenEingabe): number {
  const anrufe = Math.max(0, anrufeProMonat || 0);
  const dauer = Math.max(0, minutenProAnruf || 0);
  return anrufe * dauer;
}

function szenarioFuer(tarif: Tarif, minuten: number): TarifSzenario {
  const mehrverbrauchMinuten = Math.max(0, minuten - tarif.minuten);
  const mehrverbrauchEur = mehrverbrauchMinuten * FAKTEN.mehrpreisProMinuteEur;
  const roh = tarif.monatlichEur + mehrverbrauchEur;
  return {
    tarif,
    mehrverbrauchMinuten,
    mehrverbrauchEur,
    telefonieMonatlichEur: Math.min(roh, tarif.obergrenzeEur),
    amDeckel: roh >= tarif.obergrenzeEur,
  };
}

/** Jeder Listentarif bei diesem Aufkommen, in Listenreihenfolge. */
export function tarifVergleich(minuten: number): TarifSzenario[] {
  return TARIFE.map((t) => szenarioFuer(t, minuten));
}

/**
 * Tarif nach der VERÖFFENTLICHTEN Zuordnungsregel (`FAKTEN.tarifzuordnung`):
 *
 *   1. Über dem Kontingent kostet jede Minute `FAKTEN.mehrpreisProMinuteEur`.
 *   2. Nach oben ist jeder Tarif auf seine Obergrenze gedeckelt.
 *   3. Bei dauerhaft höherem Aufkommen ordnen wir den Kunden dem Tarif zu, der
 *      NICHT dauerhaft an seiner Obergrenze läuft.
 *
 * Aus (3) folgt für EINEN Monatswert: der günstigste Tarif, dessen Deckel bei
 * diesem Bedarf NICHT greift. Was die Funktion NICHT weiß und nicht behauptet:
 * ob der eingegebene Wert „dauerhaft" ist, ob der Kunde den kleineren Tarif
 * mit Obergrenze nutzen dürfte, und ab wann umgestellt wird. Das ist eine
 * Vertragsfrage (OWNER-INPUT, COPY-CLAIMS F10/Z1). Die Oberfläche nennt das
 * Ergebnis deshalb „Tarif nach unserer Zuordnungsregel" und zeigt daneben
 * `tarifVergleich` — nie „der günstigste Tarif für Sie".
 *
 * Greift bei JEDEM Tarif der Deckel, ist das Aufkommen über dem, was die
 * Tarifliste abbildet. Dann gibt der Rechner bewusst KEINE Zahl aus: Der
 * größte Tarif mit seiner Obergrenze auszuweisen wäre zu billig, und der
 * Enterprise-Einstieg ist eine Untergrenze („ab …"), kein berechenbarer Preis.
 */
export function waehleSzenario(minuten: number): TarifSzenario | null {
  const ohneDeckel = tarifVergleich(minuten).filter((k) => !k.amDeckel);
  if (ohneDeckel.length === 0) return null;
  return ohneDeckel.reduce((a, b) => (b.telefonieMonatlichEur < a.telefonieMonatlichEur ? b : a));
}

/**
 * Monatlicher Sprachaufschlag — und die Stelle, an der der Rechner bewusst
 * AUFHÖRT zu rechnen.
 *
 * Eindeutig ist die Quelle nur an zwei Punkten:
 *   • Deutsch ist enthalten und kostet nichts extra.
 *   • „Jede weitere Sprache kostet 79 € im Monat."
 *
 * Nicht eindeutig ist der Paketpreis. „Ab drei Sprachen sind es 230 € im Monat
 * für bis zu fünf Sprachen gleichzeitig" lässt offen, ob „drei Sprachen"
 * DEUTSCH MITZÄHLT (also zwei Zusatzsprachen die Schwelle wären) oder drei
 * ZUSATZsprachen meint — und dieselbe Frage stellt sich bei der Obergrenze
 * „bis zu fünf". Deshalb: unterhalb der Paketfrage wird gerechnet, ab der
 * Paketfrage steht `OFFEN` — sichtbar als eigene Position, niemals als 0.
 * Offen bleibt es, bis OWNER-INPUT H3 beantwortet ist.
 */
export function sprachenAufschlagEur(zusatzsprachen: Zusatzsprachen): {
  betrag: Preisbetrag;
  offen: boolean;
} {
  const n = Math.max(0, Math.min(SPRACHEN_PREISE.paketAbZusatzsprachen, zusatzsprachen));
  if (n === 0) return { betrag: 0, offen: false };
  // Eine Zusatzsprache liegt unter jeder Lesart der Paketschwelle. Erst ab
  // zwei greift die Mehrdeutigkeit: Zählt Deutsch mit, wäre hier bereits das
  // Paket fällig; zählt es nicht mit, sind es 2 × der Einzelpreis.
  if (n === 1) return { betrag: SPRACHEN_PREISE.proSpracheEur, offen: false };
  return { betrag: OFFEN, offen: true };
}

export function berechnePreis(
  volumen: VolumenEingabe,
  zusatzsprachen: Zusatzsprachen
): PreisErgebnis {
  const minuten = minutenProMonat(volumen);
  const vergleich = tarifVergleich(minuten);
  const szenario = waehleSzenario(minuten);
  const sprachen = sprachenAufschlagEur(zusatzsprachen);

  if (!szenario) {
    return {
      modus: "individuell",
      minutenProMonat: minuten,
      szenario: null,
      vergleich,
      sprachenMonatlichEur: sprachen.betrag,
      sprachenOffen: sprachen.offen,
      einrichtungEur: UNBEKANNT,
      monatlichGesamtEur: UNBEKANNT,
      monatlichSpanne: null,
      anbindungEur: UNBEKANNT,
    };
  }

  /*
    Die Summe Telefonie + Sprachaufschlag ist nur dann EINE Zahl, wenn beide
    Lesarten der Obergrenze dasselbe ergeben — also solange die Summe unter
    der Obergrenze bleibt. Liegt sie darüber, hängt die Rechnung daran, ob der
    Aufschlag unter die Obergrenze fällt (dann Obergrenze) oder daneben steht
    (dann Telefonie + Aufschlag). Beides steht als Spanne, nichts davon wird
    still gewählt. Bis zum 23.10.2026 addierte diese Stelle den Aufschlag
    immer — im Widerspruch zum Kommentar am Dateianfang.
  */
  let gesamt: Betrag;
  let spanne: { min: number; max: number } | null = null;
  if (sprachen.betrag === OFFEN) {
    gesamt = UNBEKANNT;
  } else {
    const summe = szenario.telefonieMonatlichEur + sprachen.betrag;
    if (sprachen.betrag > 0 && summe > szenario.tarif.obergrenzeEur) {
      gesamt = UNBEKANNT;
      spanne = { min: szenario.tarif.obergrenzeEur, max: summe };
    } else {
      gesamt = summe;
    }
  }

  return {
    modus: "standard",
    minutenProMonat: minuten,
    szenario,
    vergleich,
    sprachenMonatlichEur: sprachen.betrag,
    sprachenOffen: sprachen.offen,
    einrichtungEur: szenario.tarif.einrichtungEur,
    monatlichGesamtEur: gesamt,
    monatlichSpanne: spanne,
    anbindungEur: UNBEKANNT,
  };
}

// ── Nutzen: drei Bausteine, ein Geldsaldo ──────────────────────────────────

/*
  DREI ERGEBNISSE, DIE NICHT VERMISCHT WERDEN — Korrektur vom 23.10.2026.

  Bis dahin rechnete der Kern „Telefonminuten × Routineanteil × Stundensatz"
  als Nutzen GEGEN den Cogniiq-Preis und wies daraus einen Nettoeffekt, einen
  Jahreseffekt und eine Amortisation aus. Das war eine Cash-Rechnung aus einer
  Größe, die kein Geldzufluss ist: Wer 10 Stunden Telefonzeit freimacht und
  seine Besetzung weiter bezahlt, hat 10 Stunden mehr Kapazität — und keinen
  Euro weniger Ausgaben. Außerdem setzte die Rechnung KI-Gesprächsminuten mit
  menschlicher Telefonzeit gleich, zog weder Nacharbeit noch Kontrolle ab und
  rechnete zusätzliche Termine ohne Kapazitätsgrenze.

  Jetzt gibt es drei getrennte Bausteine, jeder vom Besucher ausdrücklich
  ein- oder ausgeschaltet:

    A  ZEIT      Stunden, die das Team tatsächlich weniger am Telefon ist.
                 Ein optionaler Euro-Zeitwert bleibt daneben stehen und geht
                 NIE in den Geldsaldo.
    B  KOSTEN    Ausgaben, die tatsächlich entfallen (externer Telefonservice,
                 bezahlte Überstunden, eine wirklich vermiedene Einstellung).
                 Der Besucher nennt den Betrag; wir verteilen keine
                 Vollkosten auf Minuten und setzen keinen Empfang als
                 Standardersparnis an.
    C  TERMINE   Zusätzliche, tatsächlich wahrgenommene Termine × Deckungs-
                 beitrag — nur realisierbar, soweit freie Behandlungskapazität
                 benannt ist. Ohne Kapazitätsangabe ist es Anfragepotenzial,
                 kein Gewinn.

  Geldsaldo je Monat = B + C(realisierbar) − bekannte laufende Kosten.
  Erstjahressaldo    = 12 × Geldsaldo − einmalige Kosten (12 gleiche Monate,
                       als Annahme benannt).
  Amortisation       = einmalige Kosten ÷ Geldsaldo, nur bei positivem Saldo
                       und bekannten Kosten.

  Offene Kosten (Anbindung, Drittanbieter) sind NICHT in den „bekannten
  laufenden Kosten" und machen keine Summe vollständig; die Oberfläche
  beschriftet den Saldo entsprechend.
*/

export interface ZeitEingabe {
  aktiv: boolean;
  /** Anrufe je Monat, die HEUTE ein Mensch führt und die der Assistent künftig
   *  übernehmen soll. Nicht das Preisvolumen: Darin können Anrufe stecken, die
   *  heute niemand erreicht und die deshalb keine Teamzeit binden. */
  anrufeHeuteVomTeam: number | null;
  /** Menschliche Bearbeitungszeit je Anruf in Minuten — Gespräch plus
   *  Notieren, Eintragen, Weiterleiten. Nicht die KI-Gesprächsdauer. */
  minutenProAnrufTeam: number | null;
  /** Anteil dieser Anrufe, den der Assistent vollständig übernimmt, 0–100.
   *  Bewusst gewähltes Szenario, kein versteckter Standard von 100 %. */
  uebernommenProzent: number | null;
  /** Verbleibender Aufwand je übernommenem Anruf in % der bisherigen Zeit:
   *  Kontrolle, Rückfragen, Eskalationen, zusätzlicher Betriebsaufwand.
   *  `null` = unbekannt → das Ergebnis gilt als BEDINGT (ohne Abzug). */
  restaufwandProzent: number | null;
  /** Optionaler Stundensatz für den Euro-Zeitwert. Geht nie in den Saldo. */
  stundenkostenEur: number | null;
}

export interface KostenEingabe {
  aktiv: boolean;
  /** Monatliche Ausgaben, die durch den Assistenten tatsächlich entfallen,
   *  in Euro. 0 ist eine gültige Antwort (entlastete Mitarbeitende bleiben
   *  beschäftigt). */
  entfallendeAusgabenEur: number | null;
}

export interface TermineEingabe {
  aktiv: boolean;
  /** Zusätzliche Termine je Monat, die ohne Erreichbarkeitslücke zustande
   *  kämen — bereits bereinigt um Wiederholungsanrufe, ohnehin wiederkehrende
   *  Patienten und Ausfälle. Keine Anzahl verpasster Anrufe. */
  zusaetzlicheTermine: number | null;
  /** Deckungsbeitrag je wahrgenommenem Termin, nach variablen Kosten. */
  deckungsbeitragEur: number | null;
  /** Freie Behandlungskapazität je Monat in Terminen. `null` = unbekannt →
   *  nur Potenzial, kein realisierbarer Beitrag. 0 = keine Kapazität. */
  freieKapazitaet: number | null;
}

export interface NutzenEingabe {
  zeit: ZeitEingabe;
  kosten: KostenEingabe;
  termine: TermineEingabe;
}

export type FehlendeAngabe =
  | "anrufeHeuteVomTeam"
  | "minutenProAnrufTeam"
  | "uebernommenProzent"
  | "entfallendeAusgaben"
  | "zusaetzlicheTermine"
  | "deckungsbeitrag";

export type BausteinStatus = "aus" | "unvollstaendig" | "ok";

export interface ZeitErgebnis {
  status: BausteinStatus;
  fehlend: FehlendeAngabe[];
  /** Heutige Teamzeit für diese Anrufe, Stunden je Monat. */
  heuteStundenProMonat: number | null;
  /** Übernommene Teamzeit abzüglich Restaufwand, Stunden je Monat. Kann
   *  negativ sein, wenn der Restaufwand über 100 % liegt — dann ist es
   *  Mehrarbeit und wird so gezeigt. */
  nettoStundenProMonat: number | null;
  /** true, wenn ohne Restaufwand-Angabe gerechnet wurde (Abzug 0). */
  bedingt: boolean;
  /** Optionaler Gegenwert der Stunden. NIE Teil des Geldsaldos. */
  zeitwertEur: number | null;
}

export interface KostenErgebnis {
  status: BausteinStatus;
  fehlend: FehlendeAngabe[];
  ersparnisEur: number | null;
}

export interface TermineErgebnis {
  status: BausteinStatus;
  fehlend: FehlendeAngabe[];
  /** Termine × Deckungsbeitrag ohne Kapazitätsgrenze. */
  potenzialEur: number | null;
  /** Durch die freie Kapazität begrenzte Termine; `null`, wenn die
   *  Kapazität unbekannt ist. */
  realisierbareTermine: number | null;
  /** Realisierbarer Beitrag; `null`, wenn die Kapazität unbekannt ist. */
  realisierbarEur: number | null;
  kapazitaetUnbekannt: boolean;
  kapazitaetBegrenzt: boolean;
}

export interface CashErgebnis {
  /** Welche Bausteine im Saldo stehen. Zeit steht nie darin. */
  umfang: { kosten: boolean; termine: boolean };
  /** Cogniiq, wiederkehrend und bekannt. `UNBEKANNT` im individuellen
   *  Preismodus, bei offenem Sprachaufschlag und bei Spanne. */
  bekannteKostenProMonatEur: Betrag;
  einmaligeKostenEur: Betrag;
  /** B + C(realisierbar) − bekannte laufende Kosten. `UNBEKANNT` ohne Preis,
   *  `UNVOLLSTAENDIG`, solange ein aktiver Geldbaustein unvollständig ist oder
   *  kein Baustein aktiv ist. */
  saldoProMonatEur: Wirtschaftsbetrag;
  /** 12 × Saldo − einmalige Kosten. */
  ersteJahrSaldoEur: Wirtschaftsbetrag;
  /** Einmalige Kosten ÷ Saldo. `null`, wenn der Saldo nicht positiv ist oder
   *  nicht feststeht. Bezieht sich nur auf bekannte Kosten. */
  amortisationMonate: number | null;
  /** Positionen, die in keiner Summe stehen und deshalb jede Summe zu einer
   *  Teilsumme machen. */
  offeneKosten: readonly ["anbindung"];
  /** true, wenn Kostenersparnis UND realisierbare Zusatztermine zugleich
   *  positiv sind — die entfallende Besetzung kann die neue Kapazität nicht
   *  betreuen; der Besucher muss das selbst prüfen. */
  kapazitaetskonflikt: boolean;
}

export interface NutzenErgebnis {
  zeit: ZeitErgebnis;
  kosten: KostenErgebnis;
  termine: TermineErgebnis;
  cash: CashErgebnis;
  /** Mindestens ein Baustein aktiv und jeder aktive vollständig. */
  vollstaendig: boolean;
}

const fehlt = (v: number | null | undefined): v is null | undefined =>
  v === null || v === undefined || Number.isNaN(v);
const prozent = (v: number) => Math.max(0, Math.min(100, v)) / 100;
const nichtNegativ = (v: number) => Math.max(0, v);

function zeitErgebnis(e: ZeitEingabe): ZeitErgebnis {
  const leer: ZeitErgebnis = {
    status: "aus",
    fehlend: [],
    heuteStundenProMonat: null,
    nettoStundenProMonat: null,
    bedingt: false,
    zeitwertEur: null,
  };
  if (!e.aktiv) return leer;
  const fehlend: FehlendeAngabe[] = [];
  if (fehlt(e.anrufeHeuteVomTeam)) fehlend.push("anrufeHeuteVomTeam");
  if (fehlt(e.minutenProAnrufTeam)) fehlend.push("minutenProAnrufTeam");
  if (fehlt(e.uebernommenProzent)) fehlend.push("uebernommenProzent");
  if (fehlend.length > 0) return { ...leer, status: "unvollstaendig", fehlend };

  const heuteStunden =
    (nichtNegativ(e.anrufeHeuteVomTeam as number) * nichtNegativ(e.minutenProAnrufTeam as number)) /
    MINUTEN_PRO_STUNDE;
  const uebernommen = heuteStunden * prozent(e.uebernommenProzent as number);
  const bedingt = fehlt(e.restaufwandProzent);
  // Restaufwand darf über 100 % liegen: Dann kostet die Übernahme mehr Zeit,
  // als sie spart, und das Ergebnis ist negativ — Mehrarbeit, kein Fehler.
  const rest = bedingt ? 0 : nichtNegativ(e.restaufwandProzent as number) / 100;
  const netto = uebernommen * (1 - rest);
  const zeitwert = fehlt(e.stundenkostenEur) ? null : netto * nichtNegativ(e.stundenkostenEur as number);
  return {
    status: "ok",
    fehlend: [],
    heuteStundenProMonat: heuteStunden,
    nettoStundenProMonat: netto,
    bedingt,
    zeitwertEur: zeitwert,
  };
}

function kostenErgebnis(e: KostenEingabe): KostenErgebnis {
  if (!e.aktiv) return { status: "aus", fehlend: [], ersparnisEur: null };
  if (fehlt(e.entfallendeAusgabenEur)) {
    return { status: "unvollstaendig", fehlend: ["entfallendeAusgaben"], ersparnisEur: null };
  }
  return { status: "ok", fehlend: [], ersparnisEur: nichtNegativ(e.entfallendeAusgabenEur as number) };
}

function termineErgebnis(e: TermineEingabe): TermineErgebnis {
  const leer: TermineErgebnis = {
    status: "aus",
    fehlend: [],
    potenzialEur: null,
    realisierbareTermine: null,
    realisierbarEur: null,
    kapazitaetUnbekannt: false,
    kapazitaetBegrenzt: false,
  };
  if (!e.aktiv) return leer;
  const fehlend: FehlendeAngabe[] = [];
  if (fehlt(e.zusaetzlicheTermine)) fehlend.push("zusaetzlicheTermine");
  if (fehlt(e.deckungsbeitragEur)) fehlend.push("deckungsbeitrag");
  if (fehlend.length > 0) return { ...leer, status: "unvollstaendig", fehlend };

  const termine = nichtNegativ(e.zusaetzlicheTermine as number);
  const db = nichtNegativ(e.deckungsbeitragEur as number);
  const potenzial = termine * db;
  if (fehlt(e.freieKapazitaet)) {
    return {
      ...leer,
      status: "ok",
      potenzialEur: potenzial,
      kapazitaetUnbekannt: true,
    };
  }
  const kapazitaet = nichtNegativ(e.freieKapazitaet as number);
  const realisierbar = Math.min(termine, kapazitaet);
  return {
    status: "ok",
    fehlend: [],
    potenzialEur: potenzial,
    realisierbareTermine: realisierbar,
    realisierbarEur: realisierbar * db,
    kapazitaetUnbekannt: false,
    kapazitaetBegrenzt: realisierbar < termine,
  };
}

export function berechneNutzen(preis: PreisErgebnis, eingabe: NutzenEingabe): NutzenErgebnis {
  const zeit = zeitErgebnis(eingabe.zeit);
  const kosten = kostenErgebnis(eingabe.kosten);
  const termine = termineErgebnis(eingabe.termine);

  const aktive = [zeit, kosten, termine].filter((b) => b.status !== "aus");
  const vollstaendig = aktive.length > 0 && aktive.every((b) => b.status === "ok");

  const laufend = preis.monatlichGesamtEur;
  const einmalig = preis.einrichtungEur;
  const preisBekannt = laufend !== UNBEKANNT && einmalig !== UNBEKANNT;

  const umfang = { kosten: kosten.status !== "aus", termine: termine.status !== "aus" };
  const basis = {
    umfang,
    bekannteKostenProMonatEur: laufend,
    einmaligeKostenEur: einmalig,
    offeneKosten: ["anbindung"] as const,
  };

  /*
    Ein realisierbarer Zusatzbeitrag verlangt Kapazität, die entfallende
    Besetzung hätte sie betreut. Der Kern kann die Praxis nicht kennen; er
    meldet den Konflikt, die Oberfläche benennt ihn neben dem Saldo.
  */
  const kapazitaetskonflikt =
    (kosten.ersparnisEur ?? 0) > 0 && (termine.realisierbarEur ?? 0) > 0;

  if (!preisBekannt) {
    return {
      zeit,
      kosten,
      termine,
      vollstaendig,
      cash: {
        ...basis,
        saldoProMonatEur: UNBEKANNT,
        ersteJahrSaldoEur: UNBEKANNT,
        amortisationMonate: null,
        kapazitaetskonflikt,
      },
    };
  }

  if (!vollstaendig) {
    return {
      zeit,
      kosten,
      termine,
      vollstaendig,
      cash: {
        ...basis,
        saldoProMonatEur: UNVOLLSTAENDIG,
        ersteJahrSaldoEur: UNVOLLSTAENDIG,
        amortisationMonate: null,
        kapazitaetskonflikt,
      },
    };
  }

  /*
    Geldsaldo nur aus Geld: entfallende Ausgaben plus realisierbarer
    Zusatzbeitrag minus bekannte laufende Kosten. Der Zeitwert kommt hier
    nicht vor; ein nicht aktiver Baustein zählt als „nicht berücksichtigt"
    und steht so im `umfang`. Potenzial ohne Kapazitätsangabe zählt ebenfalls
    nicht — es ist kein realisierter Beitrag.
  */
  const laufendZahl = laufend as number;
  const einmaligZahl = einmalig as number;
  const saldo = (kosten.ersparnisEur ?? 0) + (termine.realisierbarEur ?? 0) - laufendZahl;
  const ersteJahr = saldo * MONATE_PRO_JAHR - einmaligZahl;

  return {
    zeit,
    kosten,
    termine,
    vollstaendig,
    cash: {
      ...basis,
      saldoProMonatEur: saldo,
      ersteJahrSaldoEur: ersteJahr,
      // Keine Amortisation bei nicht-positivem Saldo. „−14 Monate" oder
      // „Infinity" ist keine Aussage, sondern ein Rechenfehler als Ergebnis.
      amortisationMonate: saldo > 0 ? einmaligZahl / saldo : null,
      kapazitaetskonflikt,
    },
  };
}

// ── Formatierung ────────────────────────────────────────────────────────────

export function eur(v: number, nachkomma = 0): string {
  return `${v.toLocaleString("de-DE", {
    minimumFractionDigits: nachkomma,
    maximumFractionDigits: nachkomma,
  })}\u00A0€`;
}

export function zahl(v: number, nachkomma = 0): string {
  return v.toLocaleString("de-DE", {
    minimumFractionDigits: nachkomma,
    maximumFractionDigits: nachkomma,
  });
}
