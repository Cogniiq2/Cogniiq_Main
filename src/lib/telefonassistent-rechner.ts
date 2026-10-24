// ─────────────────────────────────────────────────────────────────────────────
// Rechenkern für Preisschätzung und Nutzenrechnung auf /ki-telefonassistent.
//
// BEWUSST OHNE REACT. Vertragsnahe Arithmetik gehört in Funktionen, die sich
// einzeln prüfen lassen — `telefonassistent-rechner.test.ts` rechnet jeden
// Grenzfall von Hand nach. Eine Zahl, die nur über ein gerendertes Bauteil
// getestet wird, ist nicht geprüft, sondern bloß einmal beobachtet worden.
//
// ZAHLENHERKUNFT. Jede Zahl kommt aus `telefonassistent-copy.ts`: `TARIFE`
// (Inklusivminuten, Monatspreis), `FAKTEN.mehrpreisProMinuteEur`,
// `EINRICHTUNG.eur`, `SPRACHEN_PREISE`, `TARIF_ENTERPRISE_AB_EUR`. In dieser
// Datei steht KEIN Betrag als Literal.
//
// PREISMODELL (verbindliche Inhaber-Preisstruktur vom 24.10.2026):
//   Monatspreis je Tarif  = Grundgebühr + Mehrminuten × 0,50 €
//   Mehrminuten           = max(0, abrechenbare Minuten − Inklusivminuten)
//   Kein Preisdeckel, keine Obergrenze — die Summe wächst linear.
//   Einrichtung           = 990 € einmalig, für alle Tarife gleich; nie Teil
//                           des Monatspreises.
//   Empfehlung            = der Tarif mit dem niedrigsten Monatspreis für das
//                           eingegebene Volumen; bei Gleichstand der mit
//                           weniger Mehrminuten (mehr Puffer, gleicher Preis).
//
// RUNDUNG. Der Rechner rechnet mit der eingegebenen Minutenzahl, ohne Rundung.
// Wie die Abrechnung Gesprächssekunden in Minuten umrechnet, ist nicht
// festgelegt (OWNER-INPUT J15) und wird hier nicht erfunden; die Oberfläche
// sagt das am Ergebnis.
//
// WAS HIER NICHT GERECHNET WIRD — und warum das Absicht ist:
//
//   • Der 20-%-Aufschlag für monatliche Kündbarkeit (`FAKTEN.laufzeit`). Die
//     Quelle sagt nicht, worauf er sich bemisst. Er wird deshalb als Regel
//     angezeigt, nicht als Rechenweg.
//
//   • Steuern. Ob die Preise netto oder brutto gelten, ist nicht bestätigt
//     (OWNER-INPUT J8); der Rechner nennt Beträge wie die Preisliste.
//
//   • Kosten einer kundenspezifischen Anbindung oder Sonderlösung, inklusive
//     Gebühren Dritter. Sie stehen erst nach der technischen Prüfung fest und
//     erscheinen als `unbekannt`, NIE als 0.
// ─────────────────────────────────────────────────────────────────────────────
import {
  EINRICHTUNG,
  FAKTEN,
  SPRACHEN_PREISE,
  TARIF_ENTERPRISE_AB_EUR,
  TARIFE,
  type Tarif,
} from "@/lib/telefonassistent-copy";

/** Minuten pro Stunde — benannt, damit die Formeln lesbar bleiben. */
const MINUTEN_PRO_STUNDE = 60;

/*
  Wochen je Monat und Monate je Jahr stehen seit dem 12.09.2026 in
  `src/lib/zeitrechnung.ts`. Hier weiterexportiert, damit für bestehende
  Aufrufer nichts umzuschreiben ist.
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
 * mit. `3` bedeutet „drei oder mehr".
 */
export type Zusatzsprachen = 0 | 1 | 2 | 3;

// ── Ergebnisse ──────────────────────────────────────────────────────────────

/** Ein Betrag, der noch nicht feststeht. Niemals als 0 dargestellt. */
export const UNBEKANNT = "unbekannt" as const;
export type Betrag = number | typeof UNBEKANNT;

/** „Noch nicht vollständig gerechnet" — weder null noch negativ. */
export const UNVOLLSTAENDIG = "unvollstaendig" as const;
export type Wirtschaftsbetrag = number | typeof UNBEKANNT | typeof UNVOLLSTAENDIG;

/** Ein Preis, den unsere eigene Preisliste nicht eindeutig festlegt. */
export const OFFEN = "offen" as const;
export type Preisbetrag = number | typeof OFFEN;

export interface TarifSzenario {
  tarif: Tarif;
  /** Inklusivminuten des Tarifs (Kopie zur bequemen Anzeige). */
  inklusivMinuten: number;
  /** Minuten über dem Kontingent; 0, wenn das Kontingent reicht. */
  mehrminuten: number;
  /** Mehrminuten × Mehrminutensatz. */
  mehrminutenEur: number;
  /** Grundgebühr + Mehrminutenbetrag. Kein Deckel. */
  monatlichEur: number;
}

export interface PreisErgebnis {
  minutenProMonat: number;
  /** Alle Listentarife bei diesem Volumen, in Listenreihenfolge. */
  vergleich: TarifSzenario[];
  /** Der Tarif mit dem niedrigsten Monatspreis für dieses Volumen. */
  empfehlung: TarifSzenario;
  /** Aufschlag für Zusatzsprachen, monatlich. 0 bei „nur Deutsch",
   *  `OFFEN` ab zwei Zusatzsprachen (OWNER-INPUT H3). */
  sprachenMonatlichEur: Preisbetrag;
  sprachenOffen: boolean;
  /** Empfohlener Tarif + Zusatzsprachen. `UNBEKANNT`, solange der
   *  Sprachaufschlag offen ist. */
  monatlichGesamtEur: Betrag;
  /** Einmalige Standard-Einrichtung — für alle Tarife gleich. */
  einrichtungEur: number;
  /** 12 × Monatsbetrag + Einrichtung, nur aus bekannten Positionen.
   *  `UNBEKANNT`, solange der Monatsbetrag offen ist. Anbindung nie enthalten. */
  ersteJahrBekannteKostenEur: Betrag;
  /** true, wenn der günstigste Listentarif die Enterprise-Untergrenze
   *  erreicht — dann ist ein individuelles Kontingent zu besprechen. */
  individuellPruefen: boolean;
  /** Steht immer erst nach der technischen Prüfung fest. */
  anbindungEur: typeof UNBEKANNT;
}

// ── Preislogik ──────────────────────────────────────────────────────────────

/**
 * Minutenbedarf aus Anrufen und Dauer. Negative oder unsinnige Eingaben werden
 * auf 0 geklemmt. Ob ein Feld überhaupt ausgefüllt ist, entscheidet die
 * Oberfläche VOR diesem Aufruf — ein leeres Feld ist kein Aufkommen von null.
 */
export function minutenProMonat({ anrufeProMonat, minutenProAnruf }: VolumenEingabe): number {
  const anrufe = Math.max(0, anrufeProMonat || 0);
  const dauer = Math.max(0, minutenProAnruf || 0);
  return anrufe * dauer;
}

/** Monatspreis eines Tarifs bei `minuten` abrechenbaren Minuten. */
export function tarifPreis(tarif: Tarif, minuten: number): TarifSzenario {
  const m = Math.max(0, Number.isFinite(minuten) ? minuten : 0);
  const mehrminuten = Math.max(0, m - tarif.minuten);
  const mehrminutenEur = mehrminuten * FAKTEN.mehrpreisProMinuteEur;
  return {
    tarif,
    inklusivMinuten: tarif.minuten,
    mehrminuten,
    mehrminutenEur,
    monatlichEur: tarif.monatlichEur + mehrminutenEur,
  };
}

/** Jeder Listentarif bei diesem Volumen, in Listenreihenfolge. */
export function tarifVergleich(minuten: number): TarifSzenario[] {
  return TARIFE.map((t) => tarifPreis(t, minuten));
}

/**
 * Der günstigste Tarif für dieses Volumen — inklusive Mehrminuten. Bei
 * Gleichstand gewinnt der Tarif mit weniger Mehrminuten: gleicher Preis,
 * mehr Puffer im Kontingent.
 */
export function waehleSzenario(minuten: number): TarifSzenario {
  const kandidaten = tarifVergleich(minuten);
  return kandidaten.reduce((best, k) => {
    const diff = k.monatlichEur - best.monatlichEur;
    if (Math.abs(diff) < 1e-9) return k.mehrminuten < best.mehrminuten ? k : best;
    return diff < 0 ? k : best;
  });
}

/**
 * Monatlicher Sprachaufschlag. Eindeutig sind nur „Deutsch inklusive" und
 * „eine weitere Sprache 79 €"; ab zwei Zusatzsprachen ist die Paketregel
 * offen (OWNER-INPUT H3) und steht als `OFFEN`, nie als 0.
 */
export function sprachenAufschlagEur(zusatzsprachen: Zusatzsprachen): {
  betrag: Preisbetrag;
  offen: boolean;
} {
  const n = Math.max(0, Math.min(SPRACHEN_PREISE.paketAbZusatzsprachen, zusatzsprachen));
  if (n === 0) return { betrag: 0, offen: false };
  if (n === 1) return { betrag: SPRACHEN_PREISE.proSpracheEur, offen: false };
  return { betrag: OFFEN, offen: true };
}

export function berechnePreis(
  volumen: VolumenEingabe,
  zusatzsprachen: Zusatzsprachen
): PreisErgebnis {
  const minuten = minutenProMonat(volumen);
  const vergleich = tarifVergleich(minuten);
  const empfehlung = waehleSzenario(minuten);
  const sprachen = sprachenAufschlagEur(zusatzsprachen);
  const gesamt: Betrag =
    sprachen.betrag === OFFEN ? UNBEKANNT : empfehlung.monatlichEur + sprachen.betrag;

  return {
    minutenProMonat: minuten,
    vergleich,
    empfehlung,
    sprachenMonatlichEur: sprachen.betrag,
    sprachenOffen: sprachen.offen,
    monatlichGesamtEur: gesamt,
    einrichtungEur: EINRICHTUNG.eur,
    ersteJahrBekannteKostenEur:
      gesamt === UNBEKANNT ? UNBEKANNT : gesamt * MONATE_PRO_JAHR + EINRICHTUNG.eur,
    individuellPruefen: empfehlung.monatlichEur >= TARIF_ENTERPRISE_AB_EUR,
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

  KEINE Amortisationsdauer: Eine Monatszahl bis „Einrichtung hereingeholt"
  hinge an der offenen Anbindung und an Steuerfragen (OWNER-INPUT J8), und
  sie würde Nutzenannahmen wie Kassenstände behandeln. Der Rechner zeigt
  stattdessen die bekannten Erstjahreskosten im Preisblock. Offene Kosten
  (Anbindung, Drittanbieter) sind in keiner Summe und machen jede Summe zu
  einer Teilsumme; die Oberfläche beschriftet das.
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
  /** Standard-Einrichtung, einmalig — nie Teil des Monatssaldos. */
  einmaligeKostenEur: number;
  /** B + C(realisierbar) − bekannte laufende Kosten. `UNBEKANNT` ohne Preis,
   *  `UNVOLLSTAENDIG`, solange ein aktiver Geldbaustein unvollständig ist oder
   *  kein Baustein aktiv ist. */
  saldoProMonatEur: Wirtschaftsbetrag;
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
  const preisBekannt = laufend !== UNBEKANNT;

  const umfang = { kosten: kosten.status !== "aus", termine: termine.status !== "aus" };
  const basis = {
    umfang,
    bekannteKostenProMonatEur: laufend,
    einmaligeKostenEur: preis.einrichtungEur,
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
