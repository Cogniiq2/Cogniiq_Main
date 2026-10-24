import { describe, expect, it } from "vitest";
import { TARIFE } from "@/lib/telefonassistent-copy";
import { OFFEN, UNBEKANNT, berechnePreis } from "@/lib/telefonassistent-rechner";

// Grenzfälle von Hand nachgerechnet und gegen die Implementierung gestellt.
// Erwartungswerte stehen als Literal, damit ein Fehler in der Implementierung
// nicht zugleich die Erwartung verschiebt. Seit dem 24.10.2026 gibt es keinen
// Minutenpreis und keine Deckelung im Kern: Ein Tarif passt, wenn sein
// Kontingent reicht; darüber steht die Position offen.
describe("Grenzfälle, von Hand nachgerechnet", () => {
  const faelle: Array<[string, number, number, string | null, number | null]> = [
    // [Name, Anrufe, Dauer, erwarteter Tarif, erwarteter Monatspreis]
    ["null Anrufe",               0,    0, "Basis",  300],
    ["genau Kontingent Basis",    250,  2, "Basis",  300],   // 500 Min
    ["eine Minute darüber",       501,  1, "Praxis", 500],   // 501 Min
    ["genau Kontingent Praxis",   1000, 1, "Praxis", 500],
    ["eine Minute über Praxis",   1001, 1, "MVZ",    800],
    ["genau Kontingent MVZ",      1000, 2, "MVZ",    800],   // 2.000 Min
    ["eine Minute über MVZ",      2001, 1, null,     null],  // individuell
    ["sehr hoch",                 20000, 3, null,    null],
  ];

  it.each(faelle)("%s", (_name, anrufe, dauer, tarif, betrag) => {
    const p = berechnePreis({ anrufeProMonat: anrufe, minutenProAnruf: dauer }, 0);
    if (tarif === null) {
      expect(p.modus).toBe("individuell");
      expect(p.monatlichGesamtEur).toBe(UNBEKANNT);
      return;
    }
    expect(p.szenario!.tarif.name).toBe(tarif);
    expect(p.szenario!.telefonieMonatlichEur).toBe(betrag);
    expect(p.monatlichGesamtEur).toBe(betrag);
  });

  it("der Monatspreis ist nie etwas anderes als der Listenpreis des passenden Tarifs", () => {
    for (let m = 0; m <= 2000; m += 1) {
      const p = berechnePreis({ anrufeProMonat: m, minutenProAnruf: 1 }, 0);
      expect(p.modus).toBe("standard");
      expect(p.szenario!.telefonieMonatlichEur).toBe(p.szenario!.tarif.monatlichEur);
      expect(p.monatlichGesamtEur).toBe(p.szenario!.tarif.monatlichEur);
    }
  });

  it("die Einrichtung ist in jedem Fall offen — kein Tarif trägt einen Einmalbetrag", () => {
    for (const m of [0, 400, 1200, 2000, 9000]) {
      expect(berechnePreis({ anrufeProMonat: m, minutenProAnruf: 1 }, 0).einrichtungEur).toBe(OFFEN);
    }
    for (const t of TARIFE) expect(t).not.toHaveProperty("einrichtungEur");
  });

  it("die angegebene Obergrenze wird durchgereicht, nie verrechnet", () => {
    const p = berechnePreis({ anrufeProMonat: 1800, minutenProAnruf: 1 }, 0);
    expect(p.szenario!.tarif.obergrenzeEur).toBe(1400);
    expect(p.monatlichGesamtEur).toBe(800);
  });
});
