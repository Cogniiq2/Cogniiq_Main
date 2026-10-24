// ─────────────────────────────────────────────────────────────────────────────
// Rechenkern für Preisschätzung und Nutzenrechnung auf /ki-telefonassistent.
//
// BEWUSST OHNE REACT. Vertragsnahe Arithmetik gehört in Funktionen, die sich
// einzeln prüfen lassen — `telefonassistent-rechner.test.ts` rechnet jeden
// Grenzfall von Hand nach. Eine Zahl, die nur über ein gerendertes Bauteil
// getestet wird, ist nicht geprüft, sondern bloß einmal beobachtet worden.
//
// ZAHLENHERKUNFT. Jede Zahl kommt aus `telefonassistent-copy.ts`: `TARIFE`
// (Minutenkontingent, Monatspreis, angegebene Obergrenze), `SPRACHEN_PREISE`.
// In dieser Datei steht KEIN Betrag als Literal.
//
// WAS HIER NICHT GERECHNET WIRD — und warum das Absicht ist:
//
//   • Minuten ÜBER dem Kontingent und die Obergrenze (Inhaber-Entscheidung
//     24.10.2026). Bis dahin rechnete der Kern Mehrminuten × 0,39 € und
//     deckelte auf die Obergrenze — eine Vertragsformel, die nicht bestätigt
//     ist (OWNER-INPUT J1–J8). Jetzt gilt: Ein Tarif „passt", wenn sein
//     Kontingent das Aufkommen trägt; was darüber liegt, ist `OFFEN` und steht
//     im Angebot. Die Obergrenze wird als ANGEGEBENER Wert durchgereicht,
//     nie als Rechengröße.
//
//   • Die Einrichtung. Sie ist bei allen Tarifen derselbe Standardaufwand,
//     ihr Betrag ist nicht freigegeben (`EINRICHTUNG.betragOffen`). Deshalb
//     gibt es keine Erstjahreskosten und keine Amortisation — beides bräuchte
//     einen Einmalbetrag, den es nicht gibt.
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
//   • Die TARIFZUORDNUNG als Vertragsregel. `waehleSzenario` nennt den
//     kleinsten Tarif, dessen Kontingent das eingegebene Aufkommen trägt. Ob
//     ein Kunde jeden Tarif nutzen darf und was bei dauerhaft höherem
//     Aufkommen passiert, ist nicht bestätigt; der Kern liefert deshalb auch
//     den Vergleich aller Listentarife (`tarifVergleich`), und die Oberfläche
//     verspricht keinen „günstigsten Tarif", sondern zeigt die Passung.
// ─────────────────────────────────────────────────────────────────────────────
import { EINRICHTUNG, SPRACHEN_PREISE, TARIFE, type Tarif } from "@/lib/telefonassistent-copy";

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
import { WOCHEN_PRO_MONAT } from "@/lib/zeitrechnung";

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
  /** true, wenn das Kontingent das Aufkommen trägt. Nur dann ist der
   *  Monatspreis dieses Tarifs eine bekannte Zahl. */
  passt: boolean;
  /** Monatspreis des Tarifs, wenn er passt; `OFFEN`, wenn Minuten über dem
   *  Kontingent liegen — deren Berechnung steht im Angebot. */
  telefonieMonatlichEur: Preisbetrag;
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
  /** Einmalige Standard-Einrichtung: Betrag nicht freigegeben, steht im
   *  Angebot (`EINRICHTUNG.betragOffen`). Immer `OFFEN`. */
  einrichtungEur: typeof OFFEN;
  /** Wiederkehrend je Monat = Monatspreis + Zusatzsprachen. 'unbekannt' im
   *  individuellen Modus und bei offenem Sprachaufschlag. */
  monatlichGesamtEur: Betrag;
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
  const passt = mehrverbrauchMinuten === 0;
  return {
    tarif,
    mehrverbrauchMinuten,
    passt,
    telefonieMonatlichEur: passt ? tarif.monatlichEur : OFFEN,
  };
}

/** Status der Standard-Einrichtung — durchgereicht, damit Flächen nicht raten. */
export const EINRICHTUNG_OFFEN = EINRICHTUNG.betragOffen;

/** Jeder Listentarif bei diesem Aufkommen, in Listenreihenfolge. */
export function tarifVergleich(minuten: number): TarifSzenario[] {
  return TARIFE.map((t) => szenarioFuer(t, minuten));
}

/**
 * Der kleinste Listentarif, dessen Kontingent das Aufkommen trägt.
 *
 * Nicht mehr und nicht weniger: Es gibt keine Mehrminutenformel und keine
 * Deckelung im Kern, weil beides vertraglich nicht bestätigt ist. Liegt das
 * Aufkommen über dem größten Kontingent, gibt der Rechner bewusst KEINE Zahl
 * aus — der Enterprise-Einstieg ist eine Untergrenze („ab …"), kein
 * berechenbarer Preis. Ob ein Kunde den so bestimmten Tarif auch vertraglich
 * erhält, legt das Angebot fest; die Oberfläche sagt das dazu.
 */
export function waehleSzenario(minuten: number): TarifSzenario | null {
  return tarifVergleich(minuten).find((k) => k.passt) ?? null;
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
      einrichtungEur: OFFEN,
      monatlichGesamtEur: UNBEKANNT,
      anbindungEur: UNBEKANNT,
    };
  }

  /*
    Innerhalb des Kontingents ist der Monatspreis eine Zahl, der Aufschlag für
    EINE Zusatzsprache ebenfalls. Die Summe steht nur, wenn beides steht.
  */
  const monatspreis = szenario.telefonieMonatlichEur as number;
  const gesamt: Betrag = sprachen.betrag === OFFEN ? UNBEKANNT : monatspreis + sprachen.betrag;

  return {
    modus: "standard",
    minutenProMonat: minuten,
    szenario,
    vergleich,
    sprachenMonatlichEur: sprachen.betrag,
    sprachenOffen: sprachen.offen,
    einrichtungEur: OFFEN,
    monatlichGesamtEur: gesamt,
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

  KEIN Erstjahressaldo, KEINE Amortisation: Beides bräuchte den Einmalbetrag
  der Einrichtung, und der ist nicht freigegeben (`EINRICHTUNG.betragOffen`).
  Offene Kosten (Einrichtung, Anbindung, Drittanbieter) sind NICHT in den
  „bekannten laufenden Kosten" und machen keine Summe vollständig; die
  Oberfläche beschriftet den Saldo entsprechend.
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
   *  Preismodus und bei offenem Sprachaufschlag. */
  bekannteKostenProMonatEur: Betrag;
  /** Standard-Einrichtung: immer `OFFEN`, solange der Betrag nicht
   *  freigegeben ist. */
  einmaligeKostenEur: typeof OFFEN;
  /** B + C(realisierbar) − bekannte laufende Kosten. `UNBEKANNT` ohne Preis,
   *  `UNVOLLSTAENDIG`, solange ein aktiver Geldbaustein unvollständig ist oder
   *  kein Baustein aktiv ist. */
  saldoProMonatEur: Wirtschaftsbetrag;
  /** Positionen, die in keiner Summe stehen und deshalb jede Summe zu einer
   *  Teilsumme machen. */
  offeneKosten: readonly ["einrichtung", "anbindung"];
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
  const preisBekannt = laufend !== UNBEKANNT;

  const umfang = { kosten: kosten.status !== "aus", termine: termine.status !== "aus" };
  const basis = {
    umfang,
    bekannteKostenProMonatEur: laufend,
    einmaligeKostenEur: OFFEN,
    offeneKosten: ["einrichtung", "anbindung"] as const,
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
  const saldo = (kosten.ersparnisEur ?? 0) + (termine.realisierbarEur ?? 0) - laufendZahl;

  return {
    zeit,
    kosten,
    termine,
    vollstaendig,
    cash: {
      ...basis,
      saldoProMonatEur: saldo,
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
