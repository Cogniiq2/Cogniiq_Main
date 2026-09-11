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

/*
  Ein Ergebnis, das NICHT „null" und NICHT „negativ" ist, sondern „noch nicht
  vollständig gerechnet".

  Der Unterschied ist der Kern der Korrektur vom 11.09.2026 (zweiter Durchgang).
  Vorher galt: fehlende Chancenangaben = Chancenwert 0. Damit stand dem
  Cogniiq-Monatsbetrag nur der Zeitwert gegenüber, und die Überschrift zeigte
  eine negative Zahl — bevor der Besucher überhaupt gefragt worden war, welche
  Anrufe ihn heute nicht erreichen. Das ist der Posten, der in vielen Betrieben
  der größte ist. Eine Rechnung, die ihn stillschweigend auf null setzt, ist
  kein konservatives Ergebnis, sondern ein falsches — und sie sagt dem Besucher
  „rechnet sich nicht", wo sie „mir fehlen noch Angaben" sagen müsste.

  `UNVOLLSTAENDIG` erzwingt diese Unterscheidung im Typsystem: Solange ein
  Pflichtfeld fehlt, gibt es für Nettoeffekt, Jahreseffekt und Amortisation
  KEINE Zahl — weder eine negative noch eine positive. Die Oberfläche kann
  daraus nichts anderes machen als einen neutralen Hinweis.
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
  /** 'standard' = ein Tarif aus TARIFE trägt das Aufkommen.
   *  'individuell' = auch der größte Tarif liefe dauerhaft am Deckel; dann gilt
   *  kein Listenpreis mehr, sondern ein individuelles Kontingent. */
  modus: "standard" | "individuell";
  minutenProMonat: number;
  /** Nur bei modus === 'standard' gesetzt. */
  szenario: TarifSzenario | null;
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
 * „bis zu fünf".
 *
 * Die frühere Fassung entschied das per Wirtschaftslogik: Bei zwei
 * Zusatzsprachen wären 2 × 79 € = 158 € günstiger als 230 €, ein Paket an
 * dieser Stelle also sinnlos — daraus wurde „ab drei ZUSATZsprachen"
 * abgeleitet. Das Argument ist plausibel und trotzdem kein Beleg: Aus einer
 * Preisliste eine Vertragsbedingung zu erschließen, weil die andere Lesart
 * unwirtschaftlich wäre, ist genau die Sorte stille Annahme, die dieser
 * Rechner nicht treffen darf. Der Kunde bekommt am Ende, was im Vertrag steht,
 * nicht was hier plausibel war.
 *
 * Deshalb: unterhalb der Paketfrage wird gerechnet, ab der Paketfrage steht
 * `OFFEN` — sichtbar als eigene Position, niemals als 0.
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
  const szenario = waehleSzenario(minuten);
  const sprachen = sprachenAufschlagEur(zusatzsprachen);

  if (!szenario) {
    return {
      modus: "individuell",
      minutenProMonat: minuten,
      szenario: null,
      sprachenMonatlichEur: sprachen.betrag,
      sprachenOffen: sprachen.offen,
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
    sprachenOffen: sprachen.offen,
    einrichtungEur: szenario.tarif.einrichtungEur,
    /*
      Steht der Sprachaufschlag offen, ist die Summe NICHT bezifferbar. Sie
      ohne ihn auszuweisen wäre der teuerste Fehler dieses Rechners: eine
      Monatssumme, die niedriger ist als die Rechnung, die der Kunde später
      bekommt. Lieber keine Zahl als eine zu niedrige.
    */
    monatlichGesamtEur:
      sprachen.betrag === OFFEN ? UNBEKANNT : szenario.telefonieMonatlichEur + sprachen.betrag,
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

/**
 * Die Chancenrechnung — Anrufe, die heute niemanden erreichen.
 *
 * NICHT MEHR OPTIONAL (Stand 11.09.2026). Diese Felder standen hinter einem
 * zugeklappten „Optional"-Bereich, den die meisten Besucher nie geöffnet haben.
 * Damit lag der in vielen Betrieben GRÖSSTE wirtschaftliche Posten außerhalb
 * der Rechnung, während der Cogniiq-Monatsbetrag drinstand — das Ergebnis war
 * systematisch zu negativ. Sie gehören in den normalen Ablauf.
 */
export interface ChancenEingabe {
  /** Relevante Anrufe je Monat, die heute nicht oder nicht rechtzeitig
   *  bearbeitet werden. Angabe des Besuchers; wir schätzen keine Quote. */
  verpassteAnrufeProMonat: number | null;
  /** Anteil davon, der überhaupt eine echte Chance darstellt, in %. */
  davonChancenProzent: number | null;
  /** Anteil der Chancen, der zum Abschluss führt, in %. */
  abschlussquoteProzent: number | null;
  /** Deckungsbeitrag je gewonnenem Fall — bewusst nicht „Umsatz". */
  deckungsbeitragEur: number | null;
  /** Anteil, den der Besucher selbst für zurückgewinnbar hält, in %. */
  rueckgewinnbarProzent: number | null;
}

/** Die Felder, die eine vollständige Wirtschaftlichkeitsrechnung braucht.
 *  Die Oberfläche zählt sie, um zu sagen, wie viele noch fehlen. */
export type FehlendeAngabe =
  | "stundenkosten"
  | "routineanteil"
  | "verpassteAnrufe"
  | "chancenanteil"
  | "abschlussquote"
  | "deckungsbeitrag"
  | "rueckgewinnbar";

export interface WirtschaftlichkeitErgebnis {
  /** Zeitpotenzial rechenbar: Stundenkosten UND Routineanteil liegen vor.
   *  Reicht für „Potenzial aus Arbeitszeit" — NICHT für ein Gesamtergebnis. */
  zeitpotenzialRechenbar: boolean;
  /** Chancenrechnung rechenbar. Siehe `chancenwert` für die Null-Regel. */
  chancenRechenbar: boolean;
  /** Beide Teilrechnungen liegen vor. Erst dann darf ein Nettoeffekt,
   *  ein Jahreseffekt oder eine Amortisation angezeigt werden — in welche
   *  Richtung auch immer er ausfällt. */
  vollstaendig: boolean;
  /** Was noch fehlt, in der Reihenfolge des Formulars. */
  fehlendeAngaben: readonly FehlendeAngabe[];

  telefonstundenProMonat: number;
  /** Telefonzeit, die auf konfigurierte Routineabläufe entfällt. Diese Abläufe
   *  wickelt der Assistent vollständig ab; die Zahl sagt nichts darüber, wie
   *  viel Prozent ALLER Anrufe das sind — das steht in der Eingabe. */
  routinestundenProMonat: number;
  /** Gegenwert der potenziell freigesetzten Arbeitszeit. AUSDRÜCKLICH NICHT
   *  „eingesparte Personalkosten": Freigewordene Zeit wird nur dann zu Geld,
   *  wenn der Betrieb sie auch wirklich abbaut oder anders einsetzt.
   *  `null`, solange Stundenkosten oder Routineanteil fehlen. */
  zeitwertProMonatEur: number | null;
  /** `null`, solange ein Pflichtfeld der Chancenrechnung fehlt. */
  chancenwertProMonatEur: number | null;

  /** Cogniiq, wiederkehrend. `UNBEKANNT` im individuellen Preismodus und bei
   *  offenem Sprachaufschlag. */
  kostenProMonatEur: Betrag;
  einrichtungEur: Betrag;
  /** Monatsbetrag × 12 + Einrichtung. Die Einrichtung wird NICHT weggelassen. */
  ersteJahrKostenEur: Betrag;

  /** Zeitwert + Chancenwert − Cogniiq-Monatskosten.
   *  `UNVOLLSTAENDIG`, solange nicht alle Pflichtangaben vorliegen —
   *  nie eine Zahl aus einem halben Modell. */
  nettoProMonatEur: Wirtschaftsbetrag;
  /** Erstes Jahr inklusive Einrichtung. */
  ersteJahrNettoEur: Wirtschaftsbetrag;
  /** Monate bis die Einrichtung hereingeholt ist. `null`, wenn die Rechnung
   *  unvollständig ist ODER der Nettoeffekt null oder negativ ist — dann gibt
   *  es keine Amortisation, und eine auszuweisen wäre eine Division durch eine
   *  Annahme. */
  amortisationMonate: number | null;
}

/**
 * Chancenwert und die Frage, welche Felder wirklich Pflicht sind.
 *
 * KEINE VERPASSTEN ANRUFE IST EINE VOLLSTÄNDIGE ANTWORT. Trägt jemand 0 ein,
 * ist der Chancenwert 0 — und zwar als ERGEBNIS, nicht als Lücke. Die vier
 * Folgefelder werden dann nicht mehr gebraucht: Null Anrufe mal irgendetwas
 * bleibt null. Dieser Betrieb bekommt danach womöglich ein negatives
 * Gesamtergebnis, und das ist dann die Wahrheit und wird gezeigt.
 *
 * Dasselbe gilt für einen Deckungsbeitrag von 0: eine Angabe, kein fehlender
 * Wert. Was NICHT gilt: ein leeres Feld als 0 zu lesen.
 */
function chancenAuswertung(c: ChancenEingabe): {
  wert: number | null;
  fehlend: FehlendeAngabe[];
} {
  const fehlt = (v: number | null | undefined) => v === null || v === undefined || Number.isNaN(v);

  if (fehlt(c.verpassteAnrufeProMonat)) {
    return { wert: null, fehlend: ["verpassteAnrufe"] };
  }
  const anrufe = c.verpassteAnrufeProMonat as number;
  if (anrufe <= 0) return { wert: 0, fehlend: [] };

  const paare: Array<[FehlendeAngabe, number | null]> = [
    ["chancenanteil", c.davonChancenProzent],
    ["abschlussquote", c.abschlussquoteProzent],
    ["deckungsbeitrag", c.deckungsbeitragEur],
    ["rueckgewinnbar", c.rueckgewinnbarProzent],
  ];
  const fehlend = paare.filter(([, v]) => fehlt(v)).map(([name]) => name);
  if (fehlend.length > 0) return { wert: null, fehlend };

  const anteil = (v: number | null) => Math.max(0, Math.min(100, v as number)) / 100;
  const db = Math.max(0, c.deckungsbeitragEur as number);

  /*
    Der konservative Trichter. Jeder Faktor nimmt etwas weg, und jeder ist eine
    Angabe des Besuchers:

      verpasste relevante Anrufe
      × Anteil echter Chancen        (nicht jeder Anrufer wollte etwas kaufen)
      × Abschluss-/Buchungsquote     (nicht jede Chance wird ein Auftrag)
      × Deckungsbeitrag je Fall      (nicht Umsatz — was übrig bleibt)
      × zurückgewinnbarer Anteil     (nicht jeder Verlorene wäre zu halten)

    Das ist bewusst deutlich weniger als „verpasster Anruf × Umsatz". Wer die
    größere Zahl will, muss die Faktoren selbst hochsetzen und sieht dabei, was
    er annimmt.
  */
  return {
    wert:
      anrufe *
      anteil(c.davonChancenProzent) *
      anteil(c.abschlussquoteProzent) *
      db *
      anteil(c.rueckgewinnbarProzent),
    fehlend: [],
  };
}

export function berechneWirtschaftlichkeit(
  volumen: VolumenEingabe,
  preis: PreisErgebnis,
  eingabe: WirtschaftlichkeitEingabe,
  chancen: ChancenEingabe
): WirtschaftlichkeitErgebnis {
  const telefonstunden = minutenProMonat(volumen) / MINUTEN_PRO_STUNDE;
  const anteil = Math.max(0, Math.min(100, eingabe.routineanteilProzent ?? 0)) / 100;
  const routinestunden = telefonstunden * anteil;

  const stundenkosten = eingabe.stundenkostenEur;
  const zeitFehlend: FehlendeAngabe[] = [];
  if (stundenkosten === null || Number.isNaN(stundenkosten)) zeitFehlend.push("stundenkosten");
  if (eingabe.routineanteilProzent === null || Number.isNaN(eingabe.routineanteilProzent)) {
    zeitFehlend.push("routineanteil");
  }
  const zeitpotenzialRechenbar = zeitFehlend.length === 0;
  const zeitwert = zeitpotenzialRechenbar
    ? routinestunden * Math.max(0, stundenkosten as number)
    : null;

  const { wert: chancenwertProMonat, fehlend: chancenFehlend } = chancenAuswertung(chancen);
  const chancenRechenbar = chancenwertProMonat !== null;

  const fehlendeAngaben = [...zeitFehlend, ...chancenFehlend];
  const kosten = preis.monatlichGesamtEur;
  const einrichtung = preis.einrichtungEur;
  const preisBekannt = kosten !== UNBEKANNT && einrichtung !== UNBEKANNT;

  const basis = {
    zeitpotenzialRechenbar,
    chancenRechenbar,
    fehlendeAngaben,
    telefonstundenProMonat: telefonstunden,
    routinestundenProMonat: routinestunden,
    zeitwertProMonatEur: zeitwert,
    chancenwertProMonatEur: chancenwertProMonat,
    kostenProMonatEur: kosten,
    einrichtungEur: einrichtung,
  };

  /*
    Ohne bezifferbaren Preis gibt es nichts, wogegen sich rechnen ließe — im
    individuellen Tarif und bei offenem Sprachaufschlag. Das Zeitpotenzial
    bleibt trotzdem stehen: Es hängt nicht am Preis.
  */
  if (!preisBekannt) {
    return {
      ...basis,
      vollstaendig: false,
      ersteJahrKostenEur: UNBEKANNT,
      nettoProMonatEur: UNBEKANNT,
      ersteJahrNettoEur: UNBEKANNT,
      amortisationMonate: null,
    };
  }

  const kostenZahl = kosten as number;
  const einrichtungZahl = einrichtung as number;
  const ersteJahrKosten = kostenZahl * MONATE_PRO_JAHR + einrichtungZahl;

  /*
    DIE REGEL, UM DIE ES IN DIESEM RECHNER GEHT.

    Fehlt auch nur eine Pflichtangabe, gibt es KEINEN Nettoeffekt — weder einen
    negativen noch einen positiven. Vorher wurde ein fehlender Chancenwert als
    0 gelesen; die Überschrift zeigte dann „−180 € / Monat", obwohl der
    Besucher zu dem Posten, der das Vorzeichen dreht, noch gar nicht befragt
    worden war. Eine unvollständige negative Zahl ist keine ehrliche Zahl,
    sondern eine falsche Aussage über das Produkt.

    Eine VOLLSTÄNDIGE negative Zahl dagegen wird gezeigt, unverändert. Das ist
    der Unterschied zwischen Zurückhaltung und Schönrechnen.
  */
  const vollstaendig = zeitpotenzialRechenbar && chancenRechenbar;
  if (!vollstaendig) {
    return {
      ...basis,
      vollstaendig: false,
      ersteJahrKostenEur: ersteJahrKosten,
      nettoProMonatEur: UNVOLLSTAENDIG,
      ersteJahrNettoEur: UNVOLLSTAENDIG,
      amortisationMonate: null,
    };
  }

  const nutzen = (zeitwert as number) + (chancenwertProMonat as number);
  const netto = nutzen - kostenZahl;
  const ersteJahr = nutzen * MONATE_PRO_JAHR - ersteJahrKosten;

  return {
    ...basis,
    vollstaendig: true,
    ersteJahrKostenEur: ersteJahrKosten,
    nettoProMonatEur: netto,
    ersteJahrNettoEur: ersteJahr,
    // Keine Amortisation bei nicht-positivem Nettoeffekt. Eine Zahl wie
    // „−14 Monate" oder „Infinity" ist keine Aussage, sondern ein Rechenfehler,
    // der als Ergebnis auftritt.
    amortisationMonate: netto > 0 ? einrichtungZahl / netto : null,
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
