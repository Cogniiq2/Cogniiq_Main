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
import { FAKTEN, GO_LIVE_GARANTIE, TARIFE } from "./telefonassistent-copy";

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
  { literal: /(zwei\s+Wochen|\b14\s?Tage[n]?)\s+nach\s+Zahlungseingang/, quelle: "FAKTEN.goLive" },
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
    expect(FAKTEN.goLive).toContain(FAKTEN.goLiveFrist);
    expect(FAKTEN.goLiveTage).toBe(14);
    expect(FAKTEN.goLiveFrist).toBe("zwei Wochen");
    expect(FAKTEN.aenderungen).toContain(String(FAKTEN.aenderungTage));
    expect(FAKTEN.laufzeit).toContain(String(FAKTEN.laufzeitMonate));
    expect(FAKTEN.laufzeit).toContain(FAKTEN.monatlichAufschlag);
    expect(FAKTEN.preisgarantie).toContain(String(FAKTEN.preisgarantieMonate));
  });
});

/*
  Die Go-live-Garantie ist die einzige Zusage der Website mit unmittelbarer
  Geldfolge. Sie ist damit die Aussage, bei der Drift am teuersten ist: Eine
  zu kurze Frist macht uns fuer einen Termin haftbar, den der Vertrag nicht
  traegt, und eine bedingungslose Frist macht uns fuer Verzoegerungen haftbar,
  die der Kunde selbst verursacht. Beides wird hier festgehalten.

  Bewusst eng gefasst: geprueft werden nur die Zusage-Konstanten selbst und
  eindeutig veraltete Fristvarianten, nicht beliebiger Fliesstext.
*/
describe("Go-live-Garantie bleibt vertragssicher", () => {
  /** Fristvarianten, die einmal auf der Seite standen und nicht zurueckkehren duerfen. */
  const VERALTET: RegExp[] = [
    /\b7\s?Tage[n]?\s+nach\s+Zahlungseingang/,
    /7-Tage-Garantie/,
    /sieben\s+Tage/i,
    /innerhalb\s+einer\s+Woche/i,
  ];

  const ZUSAGEN = [
    FAKTEN.goLive,
    FAKTEN.goLiveStart,
    FAKTEN.goLiveOhneAntrag,
    FAKTEN.goLivePause,
    FAKTEN.zahlungsaufteilung,
  ];

  it("nennt keine veraltete Frist", () => {
    for (const zusage of ZUSAGEN) {
      for (const alt of VERALTET) expect(zusage).not.toMatch(alt);
    }
  });

  it("laesst die Frist nicht bedingungslos ab Zahlungseingang laufen", () => {
    // Der Ausloeser gehoert in goLiveStart, nicht in die Zusage selbst. Stuende
    // "nach Zahlungseingang" wieder in goLive, waere die Frist wieder unbedingt
    // — und Schritt 5 der Einrichtung liegt vollstaendig beim Kunden.
    expect(FAKTEN.goLive).not.toMatch(/nach\s+Zahlungseingang/);
    expect(FAKTEN.goLive).toContain("nach dem Start");
  });

  it("definiert den Fristbeginn und die Pause bei Kundenverzug", () => {
    expect(FAKTEN.goLiveStart).toContain("erste Hälfte");
    expect(FAKTEN.goLiveStart).toMatch(/vollständig/);
    expect(FAKTEN.goLivePause).toMatch(/pausiert/);
  });

  it("verlangt vom Kunden keinen Antrag", () => {
    expect(FAKTEN.goLiveOhneAntrag).toMatch(/nichts geltend machen/);
  });

  it("stellt die Zusage vollstaendig im Garantie-Block dar", () => {
    // Die Zusage darf nie ohne ihren Ausloeser erscheinen.
    expect(GO_LIVE_GARANTIE.text).toContain(FAKTEN.goLive);
    expect(GO_LIVE_GARANTIE.mechanik).toContain(FAKTEN.goLiveStart);
    expect(GO_LIVE_GARANTIE.mechanik).toContain(FAKTEN.goLivePause);
  });
});
