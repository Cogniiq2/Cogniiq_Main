// ─────────────────────────────────────────────────────────────────────────────
// Regelwerk des Eignungs- und Vorbereitungschecks für einen KI-Telefonassistenten.
//
// BEWUSST OHNE REACT. Jede Regel ist eine Funktion über den Angaben des
// Besuchers und liefert ein benanntes Signal mit Begründung. Die Oberfläche
// (`EignungsCheck.tsx`) zeigt an, sie entscheidet nichts. `eignungscheck.test.ts`
// rechnet jede Regel von Hand nach.
//
// WAS DIESES MODUL NICHT TUT — und warum das Absicht ist:
//
//   • Es rechnet keine Ersparnis, keinen Anteil automatisierter Anrufe und
//     keinen Nutzen in Euro. Dafür gibt es den kanonischen Preis- und
//     Wirtschaftlichkeitsrechner (`telefonassistent-rechner.ts`). Ein zweiter
//     Rechner mit anderen Annahmen wäre ein zweites Ergebnis auf derselben
//     Website.
//
//   • Es setzt keinen Vorgabewert, der eine Aussage über das Produkt wäre.
//     Alle Zahlen kommen vom Besucher. Die einzige feste Größe ist die
//     Umrechnung Woche → Monat aus `zeitrechnung.ts`, und die wird angezeigt.
//
//   • Es vergibt keine Punktzahl. Ein „Eignungsscore von 78 %“ sähe präzise
//     aus und wäre erfunden. Ausgegeben wird je Bereich ein Signal (trägt /
//     offen / hält nicht) mit dem Satz, der es begründet — und daraus ein
//     Gesamtbild nach einer Regel, die auf der Seite steht.
//
// Die inhaltlichen Grenzen (was ein Assistent im Gespräch erledigt, was beim
// Team bleibt, wann wir abraten) stammen aus `telefonassistent-copy.ts`:
// ANLIEGEN_UEBERNIMMT_ABWICKLUNG, ANLIEGEN_IMMER_MENSCH, GRENZEN, NICHT_PASSEND.
// Dieses Modul formt sie in Fragen um, es erfindet keine neuen.
// ─────────────────────────────────────────────────────────────────────────────
import { WOCHEN_PRO_MONAT } from "@/lib/zeitrechnung";

// ── Eingaben ────────────────────────────────────────────────────────────────

export type Haeufigkeit = "haeufig" | "gelegentlich" | "selten" | "nie";
export type Dreistufig = "ja" | "teilweise" | "nein";
export type Erreichbarkeit = "kaum" | "stosszeiten" | "regelmaessig" | "unbekannt";
export type Terminsystem = "keins" | "software-unbekannt" | "software-schnittstelle" | "unbekannt";

export type AnlassId =
  | "termin"
  | "auskunft"
  | "rueckruf"
  | "erfassung"
  | "fachlich"
  | "beschwerde"
  | "notfall"
  | "einzelfall";

export type ErwartungId = "ohneTeam" | "kiVerbergen" | "anbindungVorab" | "wortlaut" | "fachauskunft";

export interface EignungsEingabe {
  /** Eingehende Anrufe pro Woche, grob geschätzt. */
  anrufeProWoche: number | null;
  /** Typische Gesprächsdauer in Minuten. Optional; dient nur der Minutenrechnung. */
  minutenProAnruf: number | null;
  /** Wie oft Anrufe heute nicht angenommen werden. */
  erreichbarkeit: Erreichbarkeit | null;
  /** Wann die Anrufe kommen. Mehrfachauswahl, optional. */
  stosszeiten: boolean;
  ausserhalbOeffnungszeiten: boolean;
  /** Wie häufig jeder Anlass vorkommt. */
  anlaesse: Record<AnlassId, Haeufigkeit>;
  /** Kann während der Öffnungszeiten ein Mensch übernehmen? */
  uebernahmeMoeglich: Dreistufig | null;
  /** Lassen sich die Regeln für Termine aufschreiben? */
  terminregeln: Dreistufig | null;
  /** Gibt es eine Person, die entscheidet und freigibt? */
  freigabePerson: "ja" | "nein" | null;
  /** Wie Termine heute verwaltet werden. */
  terminsystem: Terminsystem | null;
  /** Fallen Gesundheitsdaten oder Berufsgeheimnis an? */
  gesundheitsdaten: "ja" | "nein" | null;
  /** Erwartungen, die ein Ausschlussgrund sind. */
  erwartungen: Record<ErwartungId, boolean>;
}

export const LEERE_EINGABE: EignungsEingabe = {
  anrufeProWoche: null,
  minutenProAnruf: null,
  erreichbarkeit: null,
  stosszeiten: false,
  ausserhalbOeffnungszeiten: false,
  anlaesse: {
    termin: "nie",
    auskunft: "nie",
    rueckruf: "nie",
    erfassung: "nie",
    fachlich: "nie",
    beschwerde: "nie",
    notfall: "nie",
    einzelfall: "nie",
  },
  uebernahmeMoeglich: null,
  terminregeln: null,
  freigabePerson: null,
  terminsystem: null,
  gesundheitsdaten: null,
  erwartungen: {
    ohneTeam: false,
    kiVerbergen: false,
    anbindungVorab: false,
    wortlaut: false,
    fachauskunft: false,
  },
};

// ── Katalog der Anlässe ─────────────────────────────────────────────────────

export type AnlassKlasse = "routine" | "mensch";

export interface Anlass {
  id: AnlassId;
  label: string;
  beispiel: string;
  /** routine = kann im Gespräch erledigt oder strukturiert erfasst werden;
   *  mensch = bleibt immer bei einem Menschen. */
  klasse: AnlassKlasse;
  /** Was der Assistent damit tut, wenn der Anlass vorkommt. */
  umgang: string;
}

/**
 * Die Zuordnung folgt ANLIEGEN_UEBERNIMMT_ABWICKLUNG und ANLIEGEN_IMMER_MENSCH.
 * „einzelfall“ ist die Chefsache aus GRENZEN: alles, was der Betrieb als
 * Entscheidung eines Menschen markiert.
 */
export const ANLAESSE: readonly Anlass[] = [
  {
    id: "termin",
    label: "Termine vereinbaren, verschieben, absagen",
    beispiel: "„Ich bräuchte nächste Woche einen Termin“ oder „Kann ich den Donnerstag verschieben?“",
    klasse: "routine",
    umgang:
      "Im Gespräch erledigt, im Rahmen, den Sie festlegen. Wo Sie eine Bestätigung wünschen, legt der Assistent den Wunsch zur Bestätigung vor.",
  },
  {
    id: "auskunft",
    label: "Wiederkehrende Fragen",
    beispiel: "Öffnungszeiten, Anfahrt, Parken, benötigte Unterlagen, Vertretung",
    klasse: "routine",
    umgang: "Beantwortet aus den Angaben, die Sie freigegeben haben. Nichts darüber hinaus.",
  },
  {
    id: "rueckruf",
    label: "Rückrufwünsche",
    beispiel: "„Können Sie mich zurückrufen? Es geht um …“",
    klasse: "routine",
    umgang: "Mit Anliegen und Rückrufnummer auf die Rückrufliste gesetzt.",
  },
  {
    id: "erfassung",
    label: "Wünsche, die Ihr Team später bearbeitet",
    beispiel: "Rezept- oder Überweisungswünsche, Unterlagen, Bestellungen nach Liste",
    klasse: "routine",
    umgang: "Strukturiert erfasst: worum es geht, für wen, Rückrufnummer. Die Bearbeitung bleibt bei Ihnen.",
  },
  {
    id: "fachlich",
    label: "Fachliche Fragen und Beratung",
    beispiel: "Medizinische, rechtliche oder technische Einschätzungen",
    klasse: "mensch",
    umgang: "Keine Auskunft durch das System. Der Anruf wird erfasst oder weitergeleitet.",
  },
  {
    id: "beschwerde",
    label: "Beschwerden und emotionale Gespräche",
    beispiel: "Reklamationen, Ärger über einen Vorfall, verunsicherte Anrufer",
    klasse: "mensch",
    umgang: "Übernimmt immer ein Mensch. Der Assistent leitet weiter oder nimmt den Rückrufwunsch auf.",
  },
  {
    id: "notfall",
    label: "Dringende Fälle und Notfälle",
    beispiel: "Akute Beschwerden, Wasserschaden, Ausfall vor Ort",
    klasse: "mensch",
    umgang:
      "Erkannt und sofort weitergeleitet, an Ihr Team oder eine Bereitschaft, oder mit der klaren Ansage, den Notruf zu wählen. Keine Bewertung durch das System.",
  },
  {
    id: "einzelfall",
    label: "Einzelfallentscheidungen",
    beispiel: "Preise, Ausnahmen, Sonderwünsche, alles, was Sie als Chefsache sehen",
    klasse: "mensch",
    umgang: "Landet immer bei einem Menschen. Sie legen fest, was dazugehört.",
  },
];

export const ANLASS_IDS: readonly AnlassId[] = ANLAESSE.map((a) => a.id);

// ── Feste Größen, die auf der Seite offengelegt werden ──────────────────────

/**
 * Die einzigen Schwellen des Regelwerks. Sie stehen hier benannt, damit die
 * Seite sie anzeigen kann. Es sind Entscheidungsgrenzen dieses Werkzeugs,
 * keine Branchenstatistik.
 */
export const SCHWELLEN = {
  /** Unterhalb dieser Wochenzahl gilt das Aufkommen als gering, wenn zugleich
   *  kaum Anrufe verloren gehen. Dann fehlt das Problem, das ein Assistent löst. */
  geringesAufkommenProWoche: 30,
  /** Gewichtung der Häufigkeit für den Routineanteil. */
  gewicht: { haeufig: 2, gelegentlich: 1, selten: 0, nie: 0 } as Record<Haeufigkeit, number>,
  /** Ab dieser gewichteten Summe trägt der Routineanteil. */
  routineTraegtAb: 3,
  /** Ab so vielen offenen Punkten heißt das Gesamtbild „erst klären“. */
  offenAbKlaeren: 3,
  wochenProMonat: WOCHEN_PRO_MONAT,
} as const;

// ── Ergebnis ────────────────────────────────────────────────────────────────

export type Signal = "traegt" | "offen" | "haelt-nicht";

export type BereichId = "bedarf" | "anlaesse" | "team" | "systeme" | "erwartungen";

export interface BereichsErgebnis {
  bereich: BereichId;
  titel: string;
  signal: Signal;
  /** Ein Satz, der das Signal begründet und die Angabe nennt, an der es hängt. */
  begruendung: string;
  /** Was vor einem Erstgespräch zu klären ist. Leer, wenn nichts offen ist. */
  vorbereitung: string[];
}

export type Gesamtbild = "geeignet" | "offene-punkte" | "erst-klaeren" | "abraten";

export interface EignungsErgebnis {
  vollstaendig: boolean;
  /** Feldnamen, die noch fehlen. Leer bei vollstaendig === true. */
  fehlendeAngaben: string[];
  bereiche: BereichsErgebnis[];
  /** Nur gesetzt, wenn vollstaendig. */
  gesamtbild: Gesamtbild | null;
  /** Anlässe, die der Assistent nach Ihren Angaben übernehmen könnte. */
  uebernehmbar: Anlass[];
  /** Anlässe, die nach Ihren Angaben immer beim Team bleiben. */
  bleibtBeimTeam: Anlass[];
  /** Rechnerische Größen aus den eigenen Angaben. null, wenn die Angabe fehlt. */
  anrufeProMonat: number | null;
  minutenProMonat: number | null;
  /** Alle Vorbereitungspunkte, dedupliziert, in Bereichsreihenfolge. */
  vorbereitung: string[];
}

export const GESAMTBILD_TEXT: Record<Gesamtbild, { titel: string; text: string }> = {
  geeignet: {
    titel: "Nach Ihren Angaben geeignet",
    text: "Es gibt eine Erreichbarkeitslücke oder Entlastungsbedarf, genug Routineanlässe und keine Erwartung, die dagegen spricht. Ein Erstgespräch ist der sinnvolle nächste Schritt.",
  },
  "offene-punkte": {
    titel: "Geeignet, mit offenen Punkten",
    text: "Die Grundlage trägt. Einzelne Voraussetzungen sind noch ungeklärt; sie stehen unten und lassen sich meist vor dem Erstgespräch klären.",
  },
  "erst-klaeren": {
    titel: "Erst Voraussetzungen klären",
    text: "Mehrere Punkte sind offen. Ein Erstgespräch ist möglich, wird aber ergiebiger, wenn Sie die Vorbereitungsliste vorher durchgehen.",
  },
  abraten: {
    titel: "Nach Ihren Angaben raten wir ab",
    text: "Mindestens eine Angabe spricht gegen einen KI-Telefonassistenten, jedenfalls gegen unseren. Der Grund steht beim jeweiligen Bereich. Ändert sich die Voraussetzung, ändert sich auch das Bild.",
  },
};

// ── Regeln ──────────────────────────────────────────────────────────────────

function pruefeBedarf(e: EignungsEingabe): BereichsErgebnis {
  const titel = "Anrufsituation";
  const anrufe = e.anrufeProWoche ?? 0;
  const gering = anrufe < SCHWELLEN.geringesAufkommenProWoche;

  if (e.erreichbarkeit === "unbekannt") {
    return {
      bereich: "bedarf",
      titel,
      signal: "offen",
      begruendung:
        "Sie wissen nicht, wie viele Anrufe heute verloren gehen. Ohne diese Zahl lässt sich nicht sagen, ob ein Assistent ein Problem löst, das Sie haben.",
      vorbereitung: [
        "Eine Woche lang zählen: Anrufe angenommen, nicht angenommen, außerhalb der Öffnungszeiten eingegangen.",
      ],
    };
  }
  if (e.erreichbarkeit === "kaum" && gering) {
    return {
      bereich: "bedarf",
      titel,
      signal: "haelt-nicht",
      begruendung: `Unter ${SCHWELLEN.geringesAufkommenProWoche} Anrufen pro Woche und kaum verlorene Anrufe: Ihr Team ist erreichbar. Ein Assistent löst dann kein Problem, das Sie haben, und ein System ohne Problem ist nur ein Kostenpunkt.`,
      vorbereitung: [],
    };
  }
  if (e.erreichbarkeit === "kaum") {
    return {
      bereich: "bedarf",
      titel,
      signal: "offen",
      begruendung:
        "Anrufe gehen kaum verloren. Der mögliche Nutzen liegt dann nicht in der Erreichbarkeit, sondern in der Entlastung des Teams. Das ist ein anderes Ziel und braucht eine andere Messgröße.",
      vorbereitung: [
        "Festlegen, was Entlastung für Sie heißt: welche Anrufe das Team heute unterbrechen und wie oft.",
      ],
    };
  }
  const wann = e.ausserhalbOeffnungszeiten
    ? " Ein Teil davon kommt außerhalb der Öffnungszeiten an, also zu Zeiten, in denen heute niemand abnimmt."
    : "";
  return {
    bereich: "bedarf",
    titel,
    signal: "traegt",
    begruendung:
      (e.erreichbarkeit === "regelmaessig"
        ? "Anrufe gehen regelmäßig verloren. Das ist der Fall, für den ein Telefonassistent gebaut ist."
        : "Anrufe gehen zu Stoßzeiten verloren. Genau dort ist Entlastung realistisch, nicht die vollständige Übernahme der Telefonie.") +
      wann,
    vorbereitung: [],
  };
}

export function routinePunkte(anlaesse: Record<AnlassId, Haeufigkeit>): number {
  return ANLAESSE.filter((a) => a.klasse === "routine").reduce(
    (summe, a) => summe + SCHWELLEN.gewicht[anlaesse[a.id]],
    0
  );
}

function pruefeAnlaesse(e: EignungsEingabe): BereichsErgebnis {
  const titel = "Anrufanlässe";
  const punkte = routinePunkte(e.anlaesse);
  const menschHaeufig = ANLAESSE.filter(
    (a) => a.klasse === "mensch" && e.anlaesse[a.id] === "haeufig"
  );

  if (punkte === 0) {
    return {
      bereich: "anlaesse",
      titel,
      signal: "haelt-nicht",
      begruendung:
        "Sie haben keinen Routineanlass als häufig oder gelegentlich angegeben. Ein Assistent übernimmt Termine, wiederkehrende Fragen, Rückrufwünsche und strukturierte Erfassung. Kommt davon nichts vor, bleibt ihm nichts zu tun.",
      vorbereitung: [],
    };
  }
  if (punkte < SCHWELLEN.routineTraegtAb) {
    return {
      bereich: "anlaesse",
      titel,
      signal: "offen",
      begruendung:
        "Der Routineanteil ist klein. Der Assistent hätte wenig zu erledigen; ob sich das trägt, hängt daran, wie viel Zeit diese wenigen Anlässe heute kosten.",
      vorbereitung: [
        "Die Anrufanlässe einer Woche notieren, mit Strichliste je Anlass. Erst dann zeigt sich, was Routine ist.",
      ],
    };
  }
  const hinweis =
    menschHaeufig.length > 0
      ? ` Häufig kommen auch Anlässe vor, die immer beim Team bleiben (${menschHaeufig
          .map((a) => a.label.toLowerCase())
          .join(", ")}). Für diese braucht der Assistent einen klaren Weg zu einem Menschen.`
      : "";
  return {
    bereich: "anlaesse",
    titel,
    signal: "traegt",
    begruendung: "Genug Routineanlässe, die im Gespräch erledigt oder strukturiert erfasst werden können." + hinweis,
    vorbereitung: menschHaeufig.length > 0 ? ["Für Beschwerden, Notfälle und Chefsachen festlegen, wohin der Assistent weiterleitet, auch außerhalb der Öffnungszeiten."] : [],
  };
}

function pruefeTeam(e: EignungsEingabe): BereichsErgebnis {
  const titel = "Team und Übergabe";
  const offen: string[] = [];
  const gruende: string[] = [];

  if (e.uebernahmeMoeglich === "nein") {
    gruende.push(
      "Während der Öffnungszeiten kann niemand übernehmen. Beschwerden, Notfälle und alles Fachliche brauchen trotzdem ein Ziel: eine Rückrufliste, eine Bereitschaft oder eine klare Ansage."
    );
    offen.push("Festlegen, wohin Anrufe gehen, die der Assistent nicht zu Ende bringen darf, wenn niemand abnimmt.");
  } else if (e.uebernahmeMoeglich === "teilweise") {
    gruende.push("Eine Übernahme ist zeitweise möglich. Für die übrigen Zeiten braucht es eine Regel.");
    offen.push("Die Zeiten benennen, in denen niemand übernehmen kann, und dafür den Rückweg festlegen.");
  }

  const terminRelevant = e.anlaesse.termin !== "nie";
  if (terminRelevant && e.terminregeln === "nein") {
    gruende.push(
      "Termine kommen vor, aber die Regeln dafür lassen sich nicht aufschreiben. Dann kann der Assistent Termine nicht im Gespräch vergeben, sondern nur den Wunsch zur Bestätigung vorlegen."
    );
    offen.push("Terminregeln festhalten: welche Termine, welche Zeiten, welche Ausnahmen, wer bestätigt.");
  } else if (terminRelevant && e.terminregeln === "teilweise") {
    gruende.push("Die Terminregeln sind teilweise aufgeschrieben. Der Rest entsteht in der Einrichtung, kostet dort aber Zeit.");
    offen.push("Die fehlenden Terminregeln vor dem Erstgespräch ergänzen.");
  }

  if (e.freigabePerson === "nein") {
    gruende.push("Es gibt keine Person, die entscheidet und freigibt. Ohne sie bleibt eine Einführung in der Testphase stehen.");
    offen.push("Eine Person benennen, die den Anliegen-Katalog verantwortet und die Freigabe erteilt.");
  }

  if (gruende.length === 0) {
    return {
      bereich: "team",
      titel,
      signal: "traegt",
      begruendung:
        "Ein Mensch kann übernehmen, die Regeln lassen sich aufschreiben, und jemand gibt frei. Das sind die drei Voraussetzungen, die bei Ihnen liegen.",
      vorbereitung: [],
    };
  }
  return { bereich: "team", titel, signal: "offen", begruendung: gruende.join(" "), vorbereitung: offen };
}

function pruefeSysteme(e: EignungsEingabe): BereichsErgebnis {
  const titel = "Systeme und Daten";
  const offen: string[] = [];
  const gruende: string[] = [];

  switch (e.terminsystem) {
    case "keins":
      gruende.push(
        "Termine laufen ohne Software. Das Ergebnis eines Gesprächs steht dann strukturiert in einer Übersicht, und Ihr Team überträgt es. Das ist ein Übertrag, kein Rekonstruieren."
      );
      break;
    case "software-schnittstelle":
      gruende.push(
        "Ihre Software hat nach Ihrer Kenntnis eine Schnittstelle. Ob sie trägt, steht erst nach einer Prüfung fest: ob Zugang und Freigabe möglich sind, welche Vorgänge sie zulässt und ob Dritte Gebühren verlangen. Eine Zusage vorab gibt es nicht."
      );
      offen.push("Name und Version der Terminsoftware bereitlegen und beim Hersteller nach Schnittstelle und Freigabe fragen.");
      break;
    case "software-unbekannt":
    case "unbekannt":
      gruende.push(
        "Ob Ihre Terminsoftware eine Schnittstelle hat, ist offen. Bis das geprüft ist, gilt der Übergabeweg über eine strukturierte Übersicht als Grundlage."
      );
      offen.push("Name und Version der Terminsoftware bereitlegen und beim Hersteller nach Schnittstelle und Freigabe fragen.");
      break;
    default:
      break;
  }

  if (e.gesundheitsdaten === "ja") {
    gruende.push(
      "Es fallen Gesundheitsdaten oder Berufsgeheimnisse an. Dann gehört Ihre Datenschutzbeauftragte oder Ihr Datenschutzbeauftragter früh an den Tisch, und die Frage nach einer Datenschutz-Folgenabschätzung wird dort entschieden, nicht vom Anbieter."
    );
    offen.push("Datenschutzbeauftragte oder Datenschutzbeauftragten einbinden und die Frage nach einer Datenschutz-Folgenabschätzung klären.");
  }

  return {
    bereich: "systeme",
    titel,
    signal: offen.length === 0 ? "traegt" : "offen",
    begruendung: gruende.join(" "),
    vorbereitung: offen,
  };
}

const ERWARTUNG_GRUND: Record<ErwartungId, string> = {
  ohneTeam:
    "Sie erwarten, dass die Telefonie vollständig ohne Ihr Team läuft. Ein Assistent entlastet; er ersetzt keine Anmeldung und keine fachliche Entscheidung.",
  kiVerbergen:
    "Anrufer sollen nicht erfahren, dass ein KI-System spricht. Diese Transparenz ist vorgeschrieben (Art. 50 KI-Verordnung) und bei uns nicht verhandelbar.",
  anbindungVorab:
    "Sie brauchen die Zusage, dass Termine automatisch in Ihrem System stehen, bevor das System geprüft ist. Ob das geht, hängt an Ihrer Software. Eine Zusage vorab bekommen Sie von uns nicht.",
  wortlaut:
    "Sie brauchen später den genauen Wortlaut von Gesprächen. Bei uns wird nicht aufgezeichnet; es gibt das strukturierte Ergebnis, nicht die Aufnahme.",
  fachauskunft:
    "Der Assistent soll fachliche oder medizinische Auskünfte geben. Das tut er nicht, in keiner Konfiguration.",
};

function pruefeErwartungen(e: EignungsEingabe): BereichsErgebnis {
  const titel = "Erwartungen";
  const aktiv = (Object.keys(ERWARTUNG_GRUND) as ErwartungId[]).filter((k) => e.erwartungen[k]);
  if (aktiv.length === 0) {
    return {
      bereich: "erwartungen",
      titel,
      signal: "traegt",
      begruendung: "Keine Ihrer Erwartungen widerspricht dem, was ein Assistent leistet.",
      vorbereitung: [],
    };
  }
  return {
    bereich: "erwartungen",
    titel,
    signal: "haelt-nicht",
    begruendung: aktiv.map((k) => ERWARTUNG_GRUND[k]).join(" "),
    vorbereitung: [],
  };
}

// ── Gesamtbild ──────────────────────────────────────────────────────────────

export const FELD_LABEL: Record<string, string> = {
  anrufeProWoche: "Anrufe pro Woche",
  erreichbarkeit: "Wie oft Anrufe verloren gehen",
  anlaesse: "Mindestens ein Anrufanlass",
  uebernahmeMoeglich: "Ob ein Mensch übernehmen kann",
  terminregeln: "Ob sich Terminregeln aufschreiben lassen",
  freigabePerson: "Ob jemand freigibt",
  terminsystem: "Wie Termine verwaltet werden",
  gesundheitsdaten: "Ob Gesundheitsdaten anfallen",
};

export function fehlendeAngaben(e: EignungsEingabe): string[] {
  const fehlt: string[] = [];
  if (e.anrufeProWoche === null) fehlt.push("anrufeProWoche");
  if (e.erreichbarkeit === null) fehlt.push("erreichbarkeit");
  if (ANLASS_IDS.every((id) => e.anlaesse[id] === "nie")) fehlt.push("anlaesse");
  if (e.uebernahmeMoeglich === null) fehlt.push("uebernahmeMoeglich");
  if (e.anlaesse.termin !== "nie" && e.terminregeln === null) fehlt.push("terminregeln");
  if (e.freigabePerson === null) fehlt.push("freigabePerson");
  if (e.terminsystem === null) fehlt.push("terminsystem");
  if (e.gesundheitsdaten === null) fehlt.push("gesundheitsdaten");
  return fehlt;
}

export function gesamtbildAus(bereiche: readonly BereichsErgebnis[]): Gesamtbild {
  if (bereiche.some((b) => b.signal === "haelt-nicht")) return "abraten";
  const offen = bereiche.filter((b) => b.signal === "offen").length;
  if (offen >= SCHWELLEN.offenAbKlaeren) return "erst-klaeren";
  if (offen >= 1) return "offene-punkte";
  return "geeignet";
}

export function pruefeEignung(e: EignungsEingabe): EignungsErgebnis {
  const fehlt = fehlendeAngaben(e);
  const vollstaendig = fehlt.length === 0;

  const bereiche = [
    pruefeBedarf(e),
    pruefeAnlaesse(e),
    pruefeTeam(e),
    pruefeSysteme(e),
    pruefeErwartungen(e),
  ];

  const uebernehmbar = ANLAESSE.filter((a) => a.klasse === "routine" && e.anlaesse[a.id] !== "nie");
  const bleibtBeimTeam = ANLAESSE.filter((a) => a.klasse === "mensch" && e.anlaesse[a.id] !== "nie");

  const anrufeProMonat =
    e.anrufeProWoche === null ? null : Math.round(Math.max(0, e.anrufeProWoche) * WOCHEN_PRO_MONAT);
  const minutenProMonat =
    anrufeProMonat === null || e.minutenProAnruf === null
      ? null
      : Math.round(anrufeProMonat * Math.max(0, e.minutenProAnruf));

  const vorbereitung = [...new Set(bereiche.flatMap((b) => b.vorbereitung))];

  return {
    vollstaendig,
    fehlendeAngaben: fehlt,
    bereiche,
    gesamtbild: vollstaendig ? gesamtbildAus(bereiche) : null,
    uebernehmbar,
    bleibtBeimTeam,
    anrufeProMonat,
    minutenProMonat,
    vorbereitung,
  };
}

export const SIGNAL_TEXT: Record<Signal, string> = {
  traegt: "trägt",
  offen: "offen",
  "haelt-nicht": "hält nicht",
};

/**
 * Das Ergebnis als Klartext, zum Kopieren in eine Notiz oder E-Mail. Enthält
 * nur, was der Besucher selbst eingegeben hat und was daraus folgt.
 */
export function ergebnisAlsText(e: EignungsEingabe, r: EignungsErgebnis, quelle: string): string {
  const zeilen: string[] = ["Eignungscheck KI-Telefonassistent", ""];
  if (r.gesamtbild) {
    zeilen.push(`Gesamtbild: ${GESAMTBILD_TEXT[r.gesamtbild].titel}`, "");
  } else {
    zeilen.push("Gesamtbild: noch unvollständig", "");
  }
  if (r.anrufeProMonat !== null) {
    zeilen.push(`Anrufe pro Woche (Ihre Angabe): ${e.anrufeProWoche}`);
    zeilen.push(`Anrufe pro Monat (rechnerisch, × ${String(WOCHEN_PRO_MONAT).replace(".", ",")}): ${r.anrufeProMonat}`);
  }
  if (r.minutenProMonat !== null) {
    zeilen.push(`Gesprächsminuten pro Monat (rechnerisch): ${r.minutenProMonat}`);
  }
  zeilen.push("");
  for (const b of r.bereiche) {
    zeilen.push(`${b.titel}: ${SIGNAL_TEXT[b.signal]}`);
    zeilen.push(`  ${b.begruendung}`);
  }
  if (r.uebernehmbar.length > 0) {
    zeilen.push("", "Könnte der Assistent übernehmen:");
    for (const a of r.uebernehmbar) zeilen.push(`  - ${a.label}`);
  }
  if (r.bleibtBeimTeam.length > 0) {
    zeilen.push("", "Bleibt beim Team:");
    for (const a of r.bleibtBeimTeam) zeilen.push(`  - ${a.label}`);
  }
  if (r.vorbereitung.length > 0) {
    zeilen.push("", "Vor dem Erstgespräch klären:");
    for (const v of r.vorbereitung) zeilen.push(`  - ${v}`);
  }
  zeilen.push("", `Quelle: ${quelle}`);
  return zeilen.join("\n");
}
