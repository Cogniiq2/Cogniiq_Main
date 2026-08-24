// ─────────────────────────────────────────────────────────────────────────────
// Schutz gegen die wiederkehrende Fehlerklasse aus HONESTY-AUDIT §7:
// Dieselbe Zusage stand mehrfach an Stellen, die niemand zusammen im Blick
// hatte — Modultext, FAQ-String, Stadt-Config, Meta-Description. Drei
// Korrekturrunden mussten deshalb nachgebessert werden.
//
// Formulierungen dürfen sich je nach Kontext unterscheiden. Zahlen nicht.
// Dieser Test schlägt an, sobald eine Kernzahl irgendwo im Cluster als Literal
// auftaucht, statt aus FAKTEN oder TARIFE zu kommen.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FAKTEN, ZWEI_WOCHEN_GARANTIE, TARIFE } from "./telefonassistent-copy";

const ROOT = join(__dirname, "..", "..");

/** Dateien, die Copy des Telefonassistent-Clusters tragen. */
const CLUSTER = [
  "src/lib/standorte-service-configs.ts",
  "src/lib/routing/publicRoutes.ts",
  "src/pages/PraxenPage.tsx",
  "src/pages/KiTelefonassistentPage.tsx",
  "src/pages/costs/KostenKiTelefonassistent.tsx",
  "src/pages/industries/KiTelefonassistentArzt.tsx",
  "src/pages/industries/KiTelefonassistentPraxis.tsx",
  "src/pages/IntegrationenPage.tsx",
  "src/pages/DatenschutzSicherheitPage.tsx",
  "src/components/PraxisRechnerWidget.tsx",
  "src/components/PraxisRechnerSection.tsx",
  "src/components/CityServicePage.tsx",
  "src/components/TelefonassistentKompaktSection.tsx",
  "src/components/TelefonassistentBeweiskette.tsx",
  "src/components/NationalIndustryPage.tsx",
];

/**
 * Kernzahlen. Der Schlüssel ist der Suchbegriff, der Wert die Konstante, aus
 * der er kommen muss. Beides steht hier nebeneinander, damit klar ist, wohin
 * eine Änderung gehört.
 */
const KERNZAHLEN: Array<{ literal: RegExp; quelle: string }> = [
  { literal: /0,39\s?€/, quelle: "FAKTEN.mehrpreisProMinute bzw. FAKTEN.deckelung" },
  { literal: /1\.400\s?€/, quelle: "TARIFE (obergrenze) bzw. FAKTEN.deckelung" },
  { literal: /(zwei\s+Wochen|\b14\s?Tage[n]?)\s+nach\s+Zahlungseingang/, quelle: "FAKTEN.uebergabeGarantie" },
  { literal: /innerhalb\s+von\s+3\s?Tagen/, quelle: "FAKTEN.aenderungen" },
  { literal: /24\s?Monate/, quelle: "FAKTEN.preisgarantie" },
  { literal: /12\s?Monate/, quelle: "FAKTEN.laufzeit" },
  { literal: /20\s?%\s+Aufschlag/, quelle: "FAKTEN.laufzeit" },
  { literal: /täglich\s+6–20\s?Uhr/, quelle: "FAKTEN.erreichbarkeit" },
];

function lies(datei: string): string {
  return readFileSync(join(ROOT, datei), "utf-8");
}

/** Kommentarzeilen zählen nicht — dort dürfen Zahlen zur Erläuterung stehen. */
function ohneKommentare(quelltext: string): string {
  return quelltext
    .split("\n")
    .filter((zeile) => !zeile.trim().startsWith("//") && !zeile.trim().startsWith("*"))
    .join("\n");
}

describe("Kernaussagen liegen an genau einer Stelle", () => {
  it.each(CLUSTER)("%s tippt keine Kernzahl selbst", (datei) => {
    const text = ohneKommentare(lies(datei));
    const treffer = KERNZAHLEN.filter((k) => k.literal.test(text)).map(
      (k) => `${k.literal.source} → gehört in ${k.quelle}`
    );
    expect(treffer).toEqual([]);
  });

  it("FAKTEN und TARIFE bleiben widerspruchsfrei", () => {
    // Die Deckelungsaussage muss jede Obergrenze aus TARIFE wörtlich nennen.
    for (const tarif of TARIFE) {
      expect(FAKTEN.deckelung).toContain(tarif.obergrenze);
    }
    expect(FAKTEN.deckelung).toContain(FAKTEN.mehrpreisProMinute);
    // Die Zusage spricht die Frist aus ("zwei Wochen"), sie beziffert sie nicht.
    // Beide Formen muessen dieselbe Frist meinen — sonst steht eine Zusage mit
    // Geldfolge im Markt, die der Vertrag nicht deckt (Korrektur 23.08.2026).
    expect(FAKTEN.uebergabeGarantie).toContain(FAKTEN.einrichtungsfrist);
    expect(FAKTEN.einrichtungsfristTage).toBe(14);
    expect(FAKTEN.einrichtungsfrist).toBe("zwei Wochen");
    expect(FAKTEN.aenderungen).toContain(String(FAKTEN.aenderungTage));
    expect(FAKTEN.laufzeit).toContain(String(FAKTEN.laufzeitMonate));
    expect(FAKTEN.laufzeit).toContain(FAKTEN.monatlichAufschlag);
    expect(FAKTEN.preisgarantie).toContain(String(FAKTEN.preisgarantieMonate));
  });
});

/*
  Die Zwei-Wochen-Garantie ist die einzige Zusage der Website mit unmittelbarer
  Geldfolge. Sie ist damit die Aussage, bei der Drift am teuersten ist — und sie
  ist zweimal gekippt:

  1. Sie versprach sieben Tage, wo zwei Wochen zugesagt waren.
  2. Sie versprach einen LIVE-Termin und raeumte im selben Atemzug ein
     unbefristetes Freigaberecht ein. Ein Kunde, der drei Wochen prueft, haette
     damit die Frist selbst gerissen und die zweite Haelfte der
     Einrichtungsgebuehr einbehalten koennen.

  Kanonisch ist deshalb: 14 KALENDERTAGE ab dem Start bis zur UEBERGABE ZUR
  FREIGABE. Nicht bis zum Go-live. Dieser Block haelt genau das fest.

  Bewusst eng gefasst: geprueft werden nur die Zusage-Konstanten selbst und
  eindeutig veraltete Fristvarianten, nicht beliebiger Fliesstext.
*/
describe("Zwei-Wochen-Garantie bleibt widerspruchsfrei", () => {
  /** Fristvarianten, die einmal auf der Seite standen und nicht zurueckkehren duerfen. */
  const VERALTET: RegExp[] = [
    /\b7\s?Tage[n]?\s+nach\s+Zahlungseingang/,
    /7-Tage-Garantie/,
    /sieben\s+Tage/i,
    /innerhalb\s+einer\s+Woche/i,
    /7\s?[–-]\s?14\s?Tage/,
    /1\s?[–-]\s?2\s?Wochen/,
  ];

  const ZUSAGEN = [
    FAKTEN.uebergabeGarantie,
    FAKTEN.startDefinition,
    FAKTEN.freigabeNachUebergabe,
    FAKTEN.pruefzeitNeutral,
    FAKTEN.garantieOhneAntrag,
    FAKTEN.fristPause,
    FAKTEN.zahlungsaufteilung,
  ];

  it("nennt keine veraltete Frist", () => {
    for (const zusage of ZUSAGEN) {
      for (const alt of VERALTET) expect(zusage).not.toMatch(alt);
    }
  });

  /*
    Der Kern der Korrektur. Zugesagt ist der EINGERICHTETE, freigabebereite
    Empfang — nicht der Live-Gang. Stuende hier wieder "geht live", waere der
    Widerspruch zum Freigaberecht sofort zurueck.
  */
  it("sagt die Uebergabe zur Freigabe zu, nicht den Go-live", () => {
    expect(FAKTEN.uebergabeGarantie).toMatch(/vollständig eingerichtet/);
    expect(FAKTEN.uebergabeGarantie).toMatch(/bereit für Ihre Freigabe/);
    expect(FAKTEN.uebergabeGarantie).not.toMatch(/geht\s+.*\blive\b/i);
    expect(FAKTEN.uebergabeGarantie).toContain(FAKTEN.einrichtungsfrist);
  });

  it("benennt die Folge einer verpassten Frist", () => {
    expect(FAKTEN.uebergabeGarantie).toMatch(/entfällt die zweite Hälfte/);
  });

  it("laesst die Frist nicht bedingungslos ab Zahlungseingang laufen", () => {
    // Der Ausloeser gehoert in startDefinition, nicht in die Zusage selbst.
    expect(FAKTEN.uebergabeGarantie).not.toMatch(/nach\s+Zahlungseingang/);
    expect(FAKTEN.uebergabeGarantie).toContain("nach dem Start");
  });

  /* Beide Startbedingungen — Geld UND vollstaendige Angaben. */
  it("definiert den Start aus beiden Bedingungen", () => {
    expect(FAKTEN.startDefinition).toContain("erste Hälfte");
    expect(FAKTEN.startDefinition).toMatch(/vollständig/);
    expect(FAKTEN.startDefinition).toMatch(/\bund\b/);
  });

  it("stellt den Go-live ausdruecklich unter die Freigabe des Kunden", () => {
    expect(FAKTEN.freigabeNachUebergabe).toMatch(/erst nach Ihrer Freigabe/);
  });

  /*
    Die Pruefzeit des Kunden darf nicht gegen uns laufen — sonst ist die Frist
    wieder unerfuellbar. Und sie darf nicht gegen ihn laufen — sonst ist das
    Freigaberecht ein Druckmittel statt eines Rechts.
  */
  it("nimmt die Pruefzeit des Kunden aus der Frist heraus", () => {
    expect(FAKTEN.pruefzeitNeutral).toMatch(/Prüfzeit/);
    expect(FAKTEN.pruefzeitNeutral).toMatch(/weder|nicht/);
  });

  /*
    Pausieren darf die Frist nur an KUNDENSEITIGEN Abhaengigkeiten. Eigene
    Dienstleister sind unser Risiko: Ein Drittanbieter-Ausschluss wuerde die
    Zusage aushoehlen.
  */
  it("pausiert nur an kundenseitigen Abhaengigkeiten", () => {
    expect(FAKTEN.fristPause).toMatch(/pausiert/);
    expect(FAKTEN.fristPause).toMatch(/auf Ihrer Seite/);
    expect(FAKTEN.fristPause).toMatch(/nach dem Start/);
    expect(FAKTEN.fristPause).toMatch(/Dienstleister/);
    expect(FAKTEN.fristPause).not.toMatch(/Drittanbieter|Anbieter\s+ausgenommen|höhere Gewalt/i);
  });

  it("verlangt vom Kunden keinen Antrag", () => {
    expect(FAKTEN.garantieOhneAntrag).toMatch(/nichts geltend machen/);
  });

  it("stellt die Zusage vollstaendig im Garantie-Block dar", () => {
    // Die Zusage darf nie ohne Ausloeser, Freigabe-Vorbehalt und Pausenregel
    // erscheinen — jedes fehlende Stueck stellt den Widerspruch wieder her.
    expect(ZWEI_WOCHEN_GARANTIE.text).toContain(FAKTEN.uebergabeGarantie);
    expect(ZWEI_WOCHEN_GARANTIE.mechanik).toContain(FAKTEN.startDefinition);
    expect(ZWEI_WOCHEN_GARANTIE.mechanik).toContain(FAKTEN.freigabeNachUebergabe);
    expect(ZWEI_WOCHEN_GARANTIE.mechanik).toContain(FAKTEN.pruefzeitNeutral);
    expect(ZWEI_WOCHEN_GARANTIE.mechanik).toContain(FAKTEN.garantieOhneAntrag);
    expect(ZWEI_WOCHEN_GARANTIE.mechanik).toContain(FAKTEN.fristPause);
  });

  /*
    Der Vertragsverweis ("Das steht so im Vertrag") war eine Aussage ueber ein
    Dokument, das in dieser Fassung nicht geprueft vorliegt. Er darf nicht
    zurueckkehren, solange das nicht der Fall ist.
  */
  it("behauptet nichts ueber den Vertragsinhalt", () => {
    const VERTRAGSVERWEIS = /steht so im Vertrag|vertraglich zugesagt/i;
    expect(ZWEI_WOCHEN_GARANTIE.text).not.toMatch(VERTRAGSVERWEIS);
    for (const satz of ZWEI_WOCHEN_GARANTIE.mechanik) {
      expect(satz).not.toMatch(VERTRAGSVERWEIS);
    }
    for (const datei of CLUSTER) {
      expect(ohneKommentare(lies(datei))).not.toMatch(VERTRAGSVERWEIS);
    }
  });
});
