import { describe, expect, it } from "vitest";
import { TARIFE, FAKTEN } from "@/lib/telefonassistent-copy";
import { berechnePreis, UNBEKANNT } from "@/lib/telefonassistent-rechner";

// Reviewer 4: Grenzfälle von Hand nachgerechnet und gegen die Implementierung
// gestellt. Erwartungswerte stehen als Literal, damit ein Fehler in der
// Implementierung nicht zugleich die Erwartung verschiebt.
describe("Grenzfälle, von Hand nachgerechnet", () => {
  const faelle: Array<[string, number, number, string | null, number | null]> = [
    // [Name, Anrufe, Dauer, erwarteter Tarif, erwarteter Telefoniebetrag]
    ["null Anrufe",            0,    0,   "Basis",  300],
    ["genau Kontingent Basis", 250,  2,   "Basis",  300],           // 500 Min
    ["eine Minute darüber",    501,  1,   "Basis",  300.39],        // 501 Min
    ["kurz vor Basis-Deckel",  1012, 1,   "Basis",  499.68],        // 512 über × 0,39
    ["genau am Basis-Deckel",  1013, 1,   "Praxis", 505.07],        // Basis fällt raus
    // Gegenintuitiv, aber richtig und absichtlich: Bei 1.000 Minuten kostet
    // Basis 300 € + 500 × 0,39 € = 495 € und liegt damit UNTER seiner
    // Obergrenze (500 €) und unter dem Praxis-Grundpreis (500 €). Der Rechner
    // wählt deshalb Basis. Dieselbe Regel gilt im älteren Praxis-Rechner auf
    // der Preisseite; hier abzuweichen hieße, zwei Rechner derselben Website
    // unterschiedliche Preise nennen zu lassen.
    ["genau Kontingent Praxis",1000, 1,   "Basis",  495],
    ["Praxis am Deckel",       1770, 1,   "MVZ",    800],           // 770 über → 800,3 > 800 ⇒ MVZ
    ["MVZ knapp unter Deckel", 3500, 1,   "MVZ",    1385],          // 1500 über × 0,39 = 585
    ["MVZ am Deckel",          3539, 1,   null,     null],          // individuell
    ["sehr hoch",              20000, 3,  null,     null],
  ];

  it.each(faelle)("%s", (_name, anrufe, dauer, tarif, betrag) => {
    const p = berechnePreis({ anrufeProMonat: anrufe, minutenProAnruf: dauer }, 0);
    if (tarif === null) {
      expect(p.modus).toBe("individuell");
      expect(p.monatlichGesamtEur).toBe(UNBEKANNT);
      return;
    }
    expect(p.szenario!.tarif.name).toBe(tarif);
    expect(p.szenario!.telefonieMonatlichEur).toBeCloseTo(betrag as number, 6);
  });

  it("der Deckel ist nirgends überschreitbar", () => {
    for (let m = 0; m <= 4000; m += 1) {
      const p = berechnePreis({ anrufeProMonat: m, minutenProAnruf: 1 }, 3);
      if (p.modus === "individuell") continue;
      expect(p.szenario!.telefonieMonatlichEur).toBeLessThanOrEqual(p.szenario!.tarif.obergrenzeEur);
    }
  });

  it("Einrichtung gehört zum gewählten Tarif", () => {
    const p = berechnePreis({ anrufeProMonat: 1200, minutenProAnruf: 1 }, 0);
    const t = TARIFE.find((x) => x.name === p.szenario!.tarif.name)!;
    expect(p.einrichtungEur).toBe(t.einrichtungEur);
  });

  it("Minutenpreis ist der kanonische", () => {
    const p = berechnePreis({ anrufeProMonat: 600, minutenProAnruf: 1 }, 0);
    expect(p.szenario!.mehrverbrauchEur).toBeCloseTo(100 * FAKTEN.mehrpreisProMinuteEur, 10);
  });
});
