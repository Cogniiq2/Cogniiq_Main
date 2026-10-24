import { describe, expect, it } from "vitest";
import { EINRICHTUNG, TARIFE } from "@/lib/telefonassistent-copy";
import { UNBEKANNT, berechnePreis, tarifPreis } from "@/lib/telefonassistent-rechner";

// Grenzfälle von Hand nachgerechnet und gegen die Implementierung gestellt.
// Erwartungswerte stehen als Literal, damit ein Fehler in der Implementierung
// nicht zugleich die Erwartung verschiebt.
//
// Verbindliches Modell (24.10.2026): Basis 300 € / 500 Min, Praxis 500 € /
// 1.000 Min, MVZ 800 € / 2.000 Min; jede weitere abrechenbare Minute 0,50 €
// in allen Tarifen; kein Preisdeckel; Standard-Einrichtung einmalig 990 €.
// Empfohlen wird der Tarif mit dem niedrigsten Monatsbetrag; bei Gleichstand
// der Tarif mit weniger Mehrminuten.
describe("Grenzfälle, von Hand nachgerechnet", () => {
  const faelle: Array<[string, number, number, string, number, number]> = [
    // [Name, Anrufe, Dauer, günstigster Tarif, Mehrminuten, Monatsbetrag]
    ["null Anrufe",                  0,    0, "Basis",  0,    300],
    ["genau Kontingent Basis",       250,  2, "Basis",  0,    300],   // 500 Min
    ["eine Minute über Basis",       501,  1, "Basis",  1,    300.5], // 300 + 0,50
    ["Gleichstand Basis/Praxis",     900,  1, "Praxis", 0,    500],   // Basis 300 + 200 = 500
    ["eine Minute vor Gleichstand",  899,  1, "Basis",  399,  499.5],
    ["genau Kontingent Praxis",      1000, 1, "Praxis", 0,    500],
    ["eine Minute über Praxis",      1001, 1, "Praxis", 1,    500.5],
    ["Gleichstand Praxis/MVZ",       1600, 1, "MVZ",    0,    800],   // Praxis 500 + 300 = 800
    ["genau Kontingent MVZ",         1000, 2, "MVZ",    0,    800],   // 2.000 Min
    ["eine Minute über MVZ",         2001, 1, "MVZ",    1,    800.5],
    ["sehr hoch",                    20000, 3, "MVZ",   58000, 29800], // 60.000 Min
  ];

  it.each(faelle)("%s", (_name, anrufe, dauer, tarif, mehr, betrag) => {
    const p = berechnePreis({ anrufeProMonat: anrufe, minutenProAnruf: dauer }, 0);
    expect(p.empfehlung.tarif.name).toBe(tarif);
    expect(p.empfehlung.mehrminuten).toBe(mehr);
    expect(p.empfehlung.monatlichEur).toBeCloseTo(betrag, 9);
    expect(p.monatlichGesamtEur).toBeCloseTo(betrag, 9);
  });

  it("kein Preisdeckel: der Betrag steigt über dem Kontingent je Minute um genau 0,50 €", () => {
    for (const t of TARIFE) {
      let vorher = tarifPreis(t, t.minuten).monatlichEur;
      expect(vorher).toBe(t.monatlichEur);
      for (let m = t.minuten + 1; m <= t.minuten + 5000; m += 1) {
        const jetzt = tarifPreis(t, m).monatlichEur;
        expect(jetzt - vorher).toBeCloseTo(0.5, 9);
        vorher = jetzt;
      }
    }
  });

  it("unter dem Kontingent ist der Betrag genau die Grundgebühr", () => {
    for (const t of TARIFE) {
      for (const m of [0, 1, Math.floor(t.minuten / 2), t.minuten - 1, t.minuten]) {
        const s = tarifPreis(t, m);
        expect(s.mehrminuten).toBe(0);
        expect(s.mehrminutenEur).toBe(0);
        expect(s.monatlichEur).toBe(t.monatlichEur);
      }
    }
  });

  it("die Empfehlung ist nie teurer als irgendein anderer Tarif", () => {
    for (let m = 0; m <= 4000; m += 1) {
      const p = berechnePreis({ anrufeProMonat: m, minutenProAnruf: 1 }, 0);
      for (const v of p.vergleich) {
        expect(p.empfehlung.monatlichEur).toBeLessThanOrEqual(v.monatlichEur + 1e-9);
      }
    }
  });

  it("die Einrichtung ist in jedem Fall 990 € einmalig und nie Teil des Monatsbetrags", () => {
    for (const m of [0, 400, 1200, 2000, 9000]) {
      const p = berechnePreis({ anrufeProMonat: m, minutenProAnruf: 1 }, 0);
      expect(p.einrichtungEur).toBe(990);
      expect(p.einrichtungEur).toBe(EINRICHTUNG.eur);
      expect(p.monatlichGesamtEur).toBe(p.empfehlung.monatlichEur);
    }
  });

  it("kein Tarif trägt eine Obergrenze oder einen eigenen Einrichtungsbetrag", () => {
    for (const t of TARIFE) {
      expect(t).not.toHaveProperty("obergrenze");
      expect(t).not.toHaveProperty("obergrenzeEur");
      expect(t).not.toHaveProperty("einrichtungEur");
    }
  });

  it("die Anbindung bleibt unbekannt, nie 0", () => {
    const p = berechnePreis({ anrufeProMonat: 300, minutenProAnruf: 2 }, 0);
    expect(p.anbindungEur).toBe(UNBEKANNT);
  });
});
