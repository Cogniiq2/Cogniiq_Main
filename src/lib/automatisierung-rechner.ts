// ─────────────────────────────────────────────────────────────────────────────
// Rechenkern der Wirtschaftlichkeit einer Prozessautomatisierung.
// Fläche: /kosten-automatisierung.
//
// BEWUSST OHNE REACT, wie der Telefon-Rechner: Arithmetik, an der eine
// Investitionsentscheidung hängt, gehört in Funktionen, die sich einzeln von
// Hand nachrechnen lassen. Eine Zahl, die nur über ein gerendertes Bauteil
// geprüft wurde, ist nicht geprüft, sondern einmal beobachtet worden.
//
// KEIN EIGENER BETRAG. Dieser Kern kennt KEINEN Cogniiq-Preis — weder als
// Literal noch als Import. Und das ist keine Nachlässigkeit, sondern die
// Kernaussage der Seite: Für Automatisierungsprojekte gibt es keine vom
// Inhaber bestätigte Preisstaffel (OWNER-INPUT A1–A3 sind unbeantwortet,
// COPY-CLAIMS-TO-VERIFY Z12). Die Investition und die laufenden Kosten sind
// deshalb EINGABEN des Besuchers — die Zahl aus seinem Angebot, seinem Budget
// oder seiner Schätzung. Der Rechner bewertet sie, er erfindet sie nicht.
//
// KEIN VORBELEGTER WIRTSCHAFTSWERT. Kein Stundensatz, kein Reduktionsanteil,
// keine Investitionssumme startet mit einem Vorschlag. Jeder Vorgabewert wäre
// eine Behauptung über den Betrieb des Besuchers im Gewand einer Bequemlichkeit
// — dieselbe Korrektur, die der Telefon-Rechner am 11.09.2026 bekommen hat.
//
// LEER IST NICHT NULL. Der teuerste Fehler eines Wirtschaftlichkeitsrechners
// ist ein Ergebnis aus einem halben Modell: Wer die laufenden Kosten eingetragen
// hat, aber den Stundensatz noch nicht, bekäme sonst ein Minus zu sehen, das
// nichts bedeutet — und wer es umgekehrt macht, ein Plus. Solange eine
// Pflichtangabe fehlt, ist das Ergebnis `UNVOLLSTAENDIG` und wird als „noch
// nicht vollständig berechnet" beschriftet, nie als 0 und nie als Betrag.
// ─────────────────────────────────────────────────────────────────────────────
import { MONATE_PRO_JAHR, WOCHEN_PRO_MONAT } from "@/lib/zeitrechnung";

/** Ein Ergebnis, das noch nicht vollständig gerechnet werden kann. Niemals 0. */
export const UNVOLLSTAENDIG = "unvollstaendig" as const;
export type Wirtschaftsbetrag = number | typeof UNVOLLSTAENDIG;

/*
  DIE ZWEI LESARTEN VON „EINGESPARTER ARBEIT" — dieselbe Unterscheidung wie im
  Telefon-Rechner, und aus demselben Grund hier wiederholt statt importiert:
  Der Telefon-Modus hängt an Anrufminuten und Tarifen, dieser an Prozessstunden
  und einer frei eingegebenen Investition. Gemeinsam ist nur die Idee.

    kapazitaet      Die Mitarbeiterin bleibt. Bewertet wird die Zeit, die sie
                    nicht mehr in diesen Ablauf steckt: „Wert freigesetzter
                    Arbeitszeit". Das ist NICHT „eingesparte Personalkosten" —
                    die Lohnsumme ändert sich dabei um keinen Cent.

    personalkosten  Eine Personalposition entfällt oder entsteht gar nicht erst
                    (eine Stelle wird nicht nachbesetzt, eine geplante
                    Einstellung unterbleibt, ein externer Dienstleister wird
                    abbestellt). Bewertet wird der Teil der monatlichen
                    Arbeitgeber-Vollkosten, der dadurch tatsächlich wegfällt.

  NIE BEIDE ZUGLEICH. Beide bewerten dieselbe Arbeitskapazität; sie zu addieren
  hieße, sie zweimal zu verkaufen. Die Konstruktoren unten machen es unmöglich,
  die Felder beider Lesarten gleichzeitig zu füllen.
*/
export type ArbeitsModus = "kapazitaet" | "personalkosten";

export interface ArbeitsEingabe {
  readonly modus: ArbeitsModus;
  /** Stunden je Woche, die dieser Ablauf heute in Handarbeit kostet — über alle
   *  beteiligten Personen zusammen. NUR im Modus `kapazitaet`. */
  readonly stundenProWoche: number | null;
  /** Arbeitgeber-Vollkosten einer Arbeitsstunde in Euro. Vollkosten, nicht
   *  Bruttolohn: Lohnnebenkosten, Ausfallzeiten und Arbeitsplatzkosten gehören
   *  dazu. Ohne Vorschlagswert. NUR im Modus `kapazitaet`. */
  readonly stundenkostenEur: number | null;
  /** Anteil dieses Aufwands in %, der realistisch entfällt — 0 bis 100.
   *
   *  Das ist die ehrlichste Zahl des ganzen Rechners und deshalb eine EINGABE:
   *  Kaum ein Ablauf verschwindet vollständig. Ausnahmen, Freigaben, Rückfragen
   *  und Stichproben bleiben. Wer hier 100 einträgt, behauptet einen Ablauf ohne
   *  jeden menschlichen Rest; der Rechner hindert ihn nicht daran, schlägt es
   *  aber auch niemandem vor. NUR im Modus `kapazitaet`. */
  readonly reduzierbarerAnteilProzent: number | null;
  /** Monatliche Arbeitgeber-Vollkosten der Position, die entfällt oder nicht
   *  entsteht. Kein Netto-, kein Bruttogehalt. NUR im Modus `personalkosten`. */
  readonly personalkostenProMonatEur: number | null;
  /** Anteil dieser Kosten in %, der tatsächlich wegfällt — 0 bis 100.
   *  0 % ist ein Ergebnis, keine Lücke: dann ändert sich an der Lohnsumme
   *  nichts. NUR im Modus `personalkosten`. */
  readonly vermeidbarerAnteilProzent: number | null;
}

/** Modus A — die Person bleibt, bewertet wird freigesetzte Zeit. */
export function kapazitaetsEingabe(
  stundenProWoche: number | null,
  stundenkostenEur: number | null,
  reduzierbarerAnteilProzent: number | null
): ArbeitsEingabe {
  return {
    modus: "kapazitaet",
    stundenProWoche,
    stundenkostenEur,
    reduzierbarerAnteilProzent,
    personalkostenProMonatEur: null,
    vermeidbarerAnteilProzent: null,
  };
}

/** Modus B — eine Personalposition entfällt oder entsteht nicht. */
export function personalkostenEingabe(
  personalkostenProMonatEur: number | null,
  vermeidbarerAnteilProzent: number | null
): ArbeitsEingabe {
  return {
    modus: "personalkosten",
    stundenProWoche: null,
    stundenkostenEur: null,
    reduzierbarerAnteilProzent: null,
    personalkostenProMonatEur,
    vermeidbarerAnteilProzent,
  };
}

/**
 * Was die Automatisierung kostet — beides Angaben des Besuchers.
 *
 * Cogniiq veröffentlicht für Automatisierungsprojekte keine Preisstaffel, weil
 * keine bestätigt ist. Wer ein Angebot hat, trägt dessen Zahlen ein; wer keines
 * hat, rechnet mit der Summe, die ihm das Vorhaben wert wäre, und sieht, was
 * dabei herauskommt. Das ist die ehrlichere Reihenfolge und nebenbei die
 * nützlichere: Sie beantwortet „bis zu welchem Preis lohnt sich das?".
 */
export interface InvestitionsEingabe {
  /** Einmalige Investition in die Umsetzung, in Euro. */
  readonly einmaligEur: number | null;
  /** Laufende monatliche Kosten: Betrieb, Überwachung, Betreuung, Lizenzen
   *  Dritter. 0 ist eine vollständige Angabe — nicht jede Automatisierung hat
   *  laufende Kosten. */
  readonly laufendProMonatEur: number | null;
}

/** Die Felder, die eine vollständige Rechnung braucht. Die Oberfläche
 *  beschriftet sie; der Kern nennt sie beim technischen Namen. */
export type FehlendeAngabe =
  | "stundenProWoche"
  | "stundenkosten"
  | "reduzierbarerAnteil"
  | "personalkostenMonat"
  | "vermeidbarerAnteil"
  | "investitionEinmalig"
  | "laufendeKosten";

export interface WirtschaftlichkeitErgebnis {
  readonly modus: ArbeitsModus;
  /** Manuelle Stunden je Monat. Nur im Modus `kapazitaet` bezifferbar. */
  readonly manuelleStundenProMonat: number | null;
  /** Bruttowert der heute in diesen Ablauf fließenden Arbeitszeit, vor dem
   *  Reduktionsanteil. Nur im Modus `kapazitaet`. */
  readonly kapazitaetswertProMonatEur: number | null;
  /**
   * Der monatliche Arbeitsnutzen — je nach Modus der Wert der freigesetzten
   * Arbeitszeit ODER die tatsächlich vermeidbaren Personalkosten. NIE beides.
   * Die Oberfläche beschriftet ihn nach `modus`; die beiden Zahlen bedeuten
   * Verschiedenes, und ein Besucher darf die eine nie für die andere halten.
   */
  readonly arbeitsnutzenProMonatEur: Wirtschaftsbetrag;
  readonly arbeitsnutzenRechenbar: boolean;
  /** Arbeitsnutzen minus laufende Kosten. Die einmalige Investition steckt
   *  hier NICHT drin — sie fällt einmal an und gehört in die Jahres- und
   *  Amortisationszeile. */
  readonly nettoProMonatEur: Wirtschaftsbetrag;
  /** 12 Monate Nettoeffekt minus die einmalige Investition. Die Investition
   *  wegzulassen wäre die häufigste Schönfärberei dieser Rechnerklasse. */
  readonly ersteJahrNettoEur: Wirtschaftsbetrag;
  /** Gesamtkosten des ersten Jahres: 12 × laufend + einmalig. */
  readonly ersteJahrKostenEur: Wirtschaftsbetrag;
  /**
   * Monate bis zur Amortisation der einmaligen Investition.
   *
   * `null`, sobald der monatliche Nettoeffekt nicht positiv ist. Eine negative
   * oder unendliche Amortisationsdauer ist keine Zahl, die man anzeigt — sie
   * bedeutet „amortisiert sich nicht", und genau das sagt die Oberfläche dann.
   */
  readonly amortisationMonate: number | null;
  readonly vollstaendig: boolean;
  readonly fehlendeAngaben: readonly FehlendeAngabe[];
}

/** Wochenstunden in Monatsstunden. Eine Umrechnung, ein Faktor. */
export function stundenProMonatAusWoche(stundenProWoche: number): number {
  return Math.max(0, stundenProWoche || 0) * WOCHEN_PRO_MONAT;
}

/** `null` bleibt `null`; alles andere wird auf [0, max] beschnitten. */
function anteil(prozent: number | null): number | null {
  if (prozent === null || !Number.isFinite(prozent)) return null;
  return Math.min(100, Math.max(0, prozent)) / 100;
}

function betrag(wert: number | null): number | null {
  if (wert === null || !Number.isFinite(wert)) return null;
  return Math.max(0, wert);
}

export function berechneWirtschaftlichkeit(
  arbeit: ArbeitsEingabe,
  investition: InvestitionsEingabe
): WirtschaftlichkeitErgebnis {
  const fehlend: FehlendeAngabe[] = [];

  const einmalig = betrag(investition.einmaligEur);
  if (einmalig === null) fehlend.push("investitionEinmalig");
  const laufend = betrag(investition.laufendProMonatEur);
  if (laufend === null) fehlend.push("laufendeKosten");

  let manuelleStundenProMonat: number | null = null;
  let kapazitaetswertProMonatEur: number | null = null;
  let arbeitsnutzen: number | null = null;

  if (arbeit.modus === "kapazitaet") {
    const stunden = betrag(arbeit.stundenProWoche);
    if (stunden === null) fehlend.push("stundenProWoche");
    const satz = betrag(arbeit.stundenkostenEur);
    if (satz === null) fehlend.push("stundenkosten");
    const reduktion = anteil(arbeit.reduzierbarerAnteilProzent);
    if (reduktion === null) fehlend.push("reduzierbarerAnteil");

    if (stunden !== null) manuelleStundenProMonat = stundenProMonatAusWoche(stunden);
    if (manuelleStundenProMonat !== null && satz !== null) {
      kapazitaetswertProMonatEur = manuelleStundenProMonat * satz;
    }
    if (kapazitaetswertProMonatEur !== null && reduktion !== null) {
      arbeitsnutzen = kapazitaetswertProMonatEur * reduktion;
    }
  } else {
    const kosten = betrag(arbeit.personalkostenProMonatEur);
    if (kosten === null) fehlend.push("personalkostenMonat");
    const vermeidbar = anteil(arbeit.vermeidbarerAnteilProzent);
    if (vermeidbar === null) fehlend.push("vermeidbarerAnteil");
    if (kosten !== null && vermeidbar !== null) arbeitsnutzen = kosten * vermeidbar;
  }

  const vollstaendig = fehlend.length === 0;

  if (!vollstaendig || arbeitsnutzen === null || einmalig === null || laufend === null) {
    return {
      modus: arbeit.modus,
      manuelleStundenProMonat,
      kapazitaetswertProMonatEur,
      arbeitsnutzenProMonatEur: arbeitsnutzen ?? UNVOLLSTAENDIG,
      arbeitsnutzenRechenbar: arbeitsnutzen !== null,
      nettoProMonatEur: UNVOLLSTAENDIG,
      ersteJahrNettoEur: UNVOLLSTAENDIG,
      ersteJahrKostenEur: UNVOLLSTAENDIG,
      amortisationMonate: null,
      vollstaendig: false,
      fehlendeAngaben: fehlend,
    };
  }

  const nettoProMonat = arbeitsnutzen - laufend;
  const ersteJahrNetto = nettoProMonat * MONATE_PRO_JAHR - einmalig;
  const ersteJahrKosten = laufend * MONATE_PRO_JAHR + einmalig;

  return {
    modus: arbeit.modus,
    manuelleStundenProMonat,
    kapazitaetswertProMonatEur,
    arbeitsnutzenProMonatEur: arbeitsnutzen,
    arbeitsnutzenRechenbar: true,
    nettoProMonatEur: nettoProMonat,
    ersteJahrNettoEur: ersteJahrNetto,
    ersteJahrKostenEur: ersteJahrKosten,
    // Nur bei positivem Nettoeffekt. Bei 0 oder negativ gibt es keine Dauer,
    // nach der sich die Investition zurückverdient — es gibt keine.
    amortisationMonate: nettoProMonat > 0 ? einmalig / nettoProMonat : null,
    vollstaendig: true,
    fehlendeAngaben: [],
  };
}

/** Euro-Formatierung, de-DE. Getrennt vom Rechnen gehalten: Anzeigeformate
 *  dürfen sich ändern, ohne dass ein Test über die Arithmetik dabei umfällt. */
export function eur(v: number, nachkomma = 0): string {
  return `${v.toLocaleString("de-DE", {
    minimumFractionDigits: nachkomma,
    maximumFractionDigits: nachkomma,
  })} €`;
}

export function zahl(v: number, nachkomma = 0): string {
  return v.toLocaleString("de-DE", {
    minimumFractionDigits: nachkomma,
    maximumFractionDigits: nachkomma,
  });
}
