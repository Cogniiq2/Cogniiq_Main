// ─────────────────────────────────────────────────────────────────────────────
// Rechenkern für Preisschätzung und Wirtschaftlichkeit auf /ki-telefonassistent.
//
// BEWUSST OHNE REACT. Vertragsnahe Arithmetik gehört in Funktionen, die sich
// einzeln prüfen lassen — `telefonassistent-rechner.test.ts` rechnet jeden
// Grenzfall von Hand nach. Eine Zahl, die nur über ein gerendertes Bauteil
// getestet wird, ist nicht geprüft, sondern bloß einmal beobachtet worden.
//
// ZAHLENHERKUNFT. Jede Zahl kommt aus `telefonassistent-copy.ts`: `TARIFE`
// (Minutenkontingent, Monatspreis, Obergrenze, Einrichtung),
// `FAKTEN.mehrpreisProMinuteEur`, `SPRACHEN_PREISE`. In dieser Datei steht
// KEIN Betrag als Literal. Der ältere Praxis-Rechner parst die Anzeigestrings
// zurück in Zahlen; das wird hier nicht wiederholt.
//
// WAS HIER NICHT GERECHNET WIRD — und warum das Absicht ist:
//
//   • Der 20-%-Aufschlag für monatliche Kündbarkeit (`FAKTEN.laufzeit`). Die
//     Quelle sagt nicht, worauf er sich bemisst: Grundpreis, Mehrverbrauch,
//     Obergrenze, Sprachaufschlag, Einrichtung. Fünf Lesarten, fünf Ergebnisse.
//     Der Aufschlag wird deshalb als Regel angezeigt, nicht als Rechenweg.
//
//   • Ob der Sprachaufschlag INNERHALB der Tarif-Obergrenze liegt oder daneben.
//     Die Quelle sagt es nicht. Der Aufschlag steht deshalb als eigene Zeile
//     neben dem gedeckelten Telefoniebetrag, mit dem Hinweis, dass die
//     Zuordnung im Angebot steht. Er wird weder still in die Obergrenze
//     hineingerechnet noch still darüber hinaus addiert.
//
//   • Kosten einer kundenspezifischen Anbindung, inklusive Gebühren Dritter.
//     Die stehen erst nach der technischen Prüfung fest. Sie erscheinen als
//     `unbekannt`, NIE als 0 — eine unbekannte Position als Null zu zeigen
//     wäre die eine Unehrlichkeit, die ein Preisrechner nicht überlebt.
// ─────────────────────────────────────────────────────────────────────────────
import { FAKTEN, SPRACHEN_PREISE, TARIFE, type Tarif } from "@/lib/telefonassistent-copy";

/** Minuten pro Stunde — benannt, damit die Formeln lesbar bleiben. */
const MINUTEN_PRO_STUNDE = 60;
const MONATE_PRO_JAHR = 12;

/**
 * Wochen je Monat. EINE Zahl für das ganze Projekt.
 *
 * Vorher standen 4,3 (Startseite) und 4,33 (Praxis-Rechner) nebeneinander.
 * Zwei Rechner, dieselbe Eingabe, zwei Ergebnisse — genau die Sorte stiller
 * Widerspruch, die ein Besucher findet, wenn er beide Seiten öffnet. 4,33 ist
 * der genauere Wert (365 ÷ 7 ÷ 12 = 4,345); er gilt ab hier überall.
 */
export const WOCHEN_PRO_MONAT = 4.33;

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
  /** 'standard' = ein Tarif aus TARIFE trägt das Aufkommen.
   *  'individuell' = auch der größte Tarif liefe dauerhaft am Deckel; dann gilt
   *  kein Listenpreis mehr, sondern ein individuelles Kontingent. */
  modus: "standard" | "individuell";
  minutenProMonat: number;
  /** Nur bei modus === 'standard' gesetzt. */
  szenario: TarifSzenario | null;
  /** Aufschlag für Zusatzsprachen, monatlich. 0 bei „nur Deutsch". */
  sprachenMonatlichEur: number;
  /** Ob der Sprachpaketpreis greift (statt Preis je Sprache). */
  sprachenAlsPaket: boolean;
  /** Einmalige Einrichtung. 'unbekannt' im individuellen Modus. */
  einrichtungEur: Betrag;
  /** Wiederkehrend je Monat = Telefonie + Sprachen. 'unbekannt' im
   *  individuellen Modus, weil dort kein Listenpreis gilt. */
  monatlichGesamtEur: Betrag;
  /** Steht immer erst nach der technischen Prüfung fest. */
  anbindungEur: typeof UNBEKANNT;
}

// ── Preislogik ──────────────────────────────────────────────────────────────

/**
 * Minutenbedarf aus Anrufen und Dauer. Negative oder unsinnige Eingaben werden
 * auf 0 geklemmt, damit ein leeres Feld keine negative Rechnung erzeugt.
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

/**
 * Tarifwahl — bildet die Zusage aus `DECKELUNG.tarifwechsel` ab:
 *
 *   1. Über dem Kontingent kostet jede Minute `FAKTEN.mehrpreisProMinuteEur`.
 *   2. Nach oben ist jeder Tarif auf seine Obergrenze gedeckelt.
 *   3. Bei dauerhaft höherem Aufkommen ordnen wir den Kunden dem Tarif zu, der
 *      NICHT dauerhaft an seiner Obergrenze läuft.
 *
 * Aus (3) folgt: Gewählt wird der günstigste Tarif, dessen Deckel bei diesem
 * Bedarf NICHT greift. Ohne (3) würde die Deckelung den kleinsten Tarif bei
 * sehr hohem Verbrauch zum rechnerisch günstigsten machen — und genau das ist
 * der Zustand, den die Zusage ausschließt.
 *
 * Greift bei JEDEM Tarif der Deckel, ist das Aufkommen über dem, was die
 * Tarifliste abbildet. Dann gibt der Rechner bewusst KEINE Zahl aus: Der
 * größte Tarif mit seiner Obergrenze auszuweisen wäre zu billig, und der
 * Enterprise-Einstieg ist eine Untergrenze („ab …"), kein berechenbarer Preis.
 */
export function waehleSzenario(minuten: number): TarifSzenario | null {
  const kandidaten = TARIFE.map((t) => szenarioFuer(t, minuten));
  const ohneDeckel = kandidaten.filter((k) => !k.amDeckel);
  if (ohneDeckel.length === 0) return null;
  return ohneDeckel.reduce((a, b) => (b.telefonieMonatlichEur < a.telefonieMonatlichEur ? b : a));
}

/**
 * Monatlicher Sprachaufschlag. Unterhalb der Paketschwelle je Sprache, ab der
 * Schwelle der Paketpreis. Deutsch ist enthalten und zählt nicht mit.
 */
export function sprachenAufschlagEur(zusatzsprachen: Zusatzsprachen): {
  betrag: number;
  alsPaket: boolean;
} {
  const n = Math.max(0, Math.min(SPRACHEN_PREISE.paketAbZusatzsprachen, zusatzsprachen));
  if (n === 0) return { betrag: 0, alsPaket: false };
  if (n >= SPRACHEN_PREISE.paketAbZusatzsprachen) {
    return { betrag: SPRACHEN_PREISE.paketEur, alsPaket: true };
  }
  return { betrag: n * SPRACHEN_PREISE.proSpracheEur, alsPaket: false };
}

export function berechnePreis(
  volumen: VolumenEingabe,
  zusatzsprachen: Zusatzsprachen
): PreisErgebnis {
  const minuten = minutenProMonat(volumen);
  const szenario = waehleSzenario(minuten);
  const sprachen = sprachenAufschlagEur(zusatzsprachen);

  if (!szenario) {
    return {
      modus: "individuell",
      minutenProMonat: minuten,
      szenario: null,
      sprachenMonatlichEur: sprachen.betrag,
      sprachenAlsPaket: sprachen.alsPaket,
      einrichtungEur: UNBEKANNT,
      monatlichGesamtEur: UNBEKANNT,
      anbindungEur: UNBEKANNT,
    };
  }

  return {
    modus: "standard",
    minutenProMonat: minuten,
    szenario,
    sprachenMonatlichEur: sprachen.betrag,
    sprachenAlsPaket: sprachen.alsPaket,
    einrichtungEur: szenario.tarif.einrichtungEur,
    monatlichGesamtEur: szenario.telefonieMonatlichEur + sprachen.betrag,
    anbindungEur: UNBEKANNT,
  };
}

// ── Wirtschaftlichkeit ──────────────────────────────────────────────────────

export interface WirtschaftlichkeitEingabe {
  /** Vollkosten einer Arbeitsstunde in Euro — Angabe des Nutzers. Ohne diesen
   *  Wert wird NICHTS gerechnet: Es gibt keinen Vorschlagswert, den wir für
   *  einen beliebigen Betrieb belegen könnten. */
  stundenkostenEur: number | null;
  /*
    ROUTINEANTEIL — der eine Prozentsatz dieses Rechners, und ausdrücklich
    NICHT „wie viel Prozent schafft Cogniiq".

    Was hier gefragt wird: Welcher Anteil der eingehenden Anrufe gehört
    überhaupt zu den Abläufen, die für diesen Betrieb konfiguriert werden
    (Termin buchen, verschieben, absagen, vorgegebene Fragen beantworten).
    Das ist eine Eigenschaft des ANRUFMIX DES KUNDEN.

    Was NICHT hier steht: die Fähigkeit des Assistenten. Einen konfigurierten
    Routineablauf wickelt er vollständig ab — bis zu 100 % der konfigurierten
    Routineanrufe. Ausnahmen (Notfälle, Anliegen außerhalb des konfigurierten
    Umfangs, bewusst menschlich gehaltene Fälle) gehen nach den Regeln des
    Kunden an einen Menschen. Zwei verschiedene Zahlen, die nie zu einer
    verschmolzen werden dürfen.

    `null` bedeutet: der Besucher hat nichts eingetragen, und wir tragen auch
    nichts für ihn ein. Der frühere Vorgabewert von 20 % war eine Aussage über
    das eigene Produkt im Gewand einer Bequemlichkeit — und dazu eine falsche.
  */
  routineanteilProzent: number | null;
}

/** Optionale zweite Ebene: Anrufe, die heute gar nicht ankommen. Wird NUR
 *  gerechnet, wenn der Nutzer alle Felder ausfüllt. */
export interface ChancenEingabe {
  verpassteAnrufeProMonat: number | null;
  /** Anteil der verpassten Anrufe, der überhaupt eine Chance darstellt, in %. */
  davonChancenProzent: number | null;
  /** Anteil der Chancen, der zum Abschluss führt, in %. */
  abschlussquoteProzent: number | null;
  /** Deckungsbeitrag je gewonnenem Fall — bewusst nicht „Umsatz". */
  deckungsbeitragEur: number | null;
  /** Anteil, den der Nutzer selbst für zurückgewinnbar hält, in %. */
  rueckgewinnbarProzent: number | null;
}

export interface WirtschaftlichkeitErgebnis {
  /** false, solange die Pflichtangaben fehlen — dann wird nichts angezeigt. */
  rechenbar: boolean;
  telefonstundenProMonat: number;
  automatisierbareStundenProMonat: number;
  /** Telefonzeit, die auf konfigurierte Routineabläufe entfällt. Diese Abläufe
   *  wickelt der Assistent vollständig ab; die Zahl sagt nichts darüber, wie
   *  viel Prozent ALLER Anrufe das sind — das steht in der Eingabe. */
  /** Gegenwert der potenziell freigesetzten Arbeitszeit. AUSDRÜCKLICH NICHT
   *  „eingesparte Personalkosten": Freigewordene Zeit wird nur dann zu Geld,
   *  wenn der Betrieb sie auch wirklich abbaut oder anders einsetzt. */
  zeitwertProMonatEur: number;
  /** Nur gesetzt, wenn ALLE Chancenfelder ausgefüllt sind. */
  chancenwertProMonatEur: number | null;
  /** Cogniiq, wiederkehrend. 'unbekannt' im individuellen Preismodus. */
  kostenProMonatEur: Betrag;
  einrichtungEur: Betrag;
  /** Zeitwert + Chancenwert − Cogniiq-Monatskosten. */
  nettoProMonatEur: Betrag;
  /** Erstes Jahr inklusive Einrichtung — die Einrichtung wird NICHT
   *  weggelassen, um die Zahl schöner zu machen. */
  ersteJahrNettoEur: Betrag;
  /** Monate bis die Einrichtung hereingeholt ist. null, wenn der Nettoeffekt
   *  null oder negativ ist — dann gibt es keine Amortisation, und eine
   *  auszuweisen wäre eine Division durch eine Annahme. */
  amortisationMonate: number | null;
}

function chancenwert(c: ChancenEingabe): number | null {
  const werte = [
    c.verpassteAnrufeProMonat,
    c.davonChancenProzent,
    c.abschlussquoteProzent,
    c.deckungsbeitragEur,
    c.rueckgewinnbarProzent,
  ];
  // Alles oder nichts: Eine Teilrechnung mit stillen Standardwerten wäre genau
  // die Sorte ROI-Widget, die diese Seite nicht sein soll.
  if (werte.some((v) => v === null || v === undefined || Number.isNaN(v))) return null;
  const [anrufe, chancen, quote, db, rueck] = werte as number[];
  if (anrufe <= 0 || db <= 0) return 0;
  return (
    anrufe * (chancen / 100) * (quote / 100) * db * (rueck / 100)
  );
}

export function berechneWirtschaftlichkeit(
  volumen: VolumenEingabe,
  preis: PreisErgebnis,
  eingabe: WirtschaftlichkeitEingabe,
  chancen: ChancenEingabe
): WirtschaftlichkeitErgebnis {
  const telefonstunden = minutenProMonat(volumen) / MINUTEN_PRO_STUNDE;
  const anteil = Math.max(0, Math.min(100, eingabe.routineanteilProzent ?? 0)) / 100;
  const automatisierbareStunden = telefonstunden * anteil;

  const stundenkosten = eingabe.stundenkostenEur;
  const rechenbar =
    stundenkosten !== null && stundenkosten > 0 && eingabe.routineanteilProzent !== null;
  const zeitwert = rechenbar ? automatisierbareStunden * stundenkosten : 0;
  const chancenProMonat = chancenwert(chancen);

  const kosten = preis.monatlichGesamtEur;
  const einrichtung = preis.einrichtungEur;

  if (kosten === UNBEKANNT || einrichtung === UNBEKANNT) {
    return {
      rechenbar,
      telefonstundenProMonat: telefonstunden,
      automatisierbareStundenProMonat: automatisierbareStunden,
      zeitwertProMonatEur: zeitwert,
      chancenwertProMonatEur: chancenProMonat,
      kostenProMonatEur: UNBEKANNT,
      einrichtungEur: UNBEKANNT,
      nettoProMonatEur: UNBEKANNT,
      ersteJahrNettoEur: UNBEKANNT,
      amortisationMonate: null,
    };
  }

  const nutzen = zeitwert + (chancenProMonat ?? 0);
  const netto = nutzen - kosten;
  const ersteJahr = nutzen * MONATE_PRO_JAHR - (kosten * MONATE_PRO_JAHR + einrichtung);

  return {
    rechenbar,
    telefonstundenProMonat: telefonstunden,
    automatisierbareStundenProMonat: automatisierbareStunden,
    zeitwertProMonatEur: zeitwert,
    chancenwertProMonatEur: chancenProMonat,
    kostenProMonatEur: kosten,
    einrichtungEur: einrichtung,
    nettoProMonatEur: netto,
    ersteJahrNettoEur: ersteJahr,
    // Keine Amortisation bei nicht-positivem Nettoeffekt. Eine Zahl wie
    // „−14 Monate" oder „Infinity" ist keine Aussage, sondern ein Rechenfehler,
    // der als Ergebnis auftritt.
    amortisationMonate: rechenbar && netto > 0 ? einrichtung / netto : null,
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
