// ─────────────────────────────────────────────────────────────────────────────
// Der Rechenkern wird hier von Hand nachgerechnet, nicht über ein gerendertes
// Bauteil beobachtet. Preisarithmetik auf einer öffentlichen Seite ist eine
// Aussage gegenüber einem Käufer: Ein stiller Rundungsfehler ist eine falsche
// Preisauskunft, kein Anzeigefehler.
//
// Preismodell seit 24.10.2026 (verbindliche Inhaber-Preisstruktur):
//   Basis 300 € / 500 Min · Praxis 500 € / 1.000 Min · MVZ 800 € / 2.000 Min
//   jede weitere Minute 0,50 € · kein Deckel · Einrichtung 990 € für alle.
// Die Erwartungswerte unten sind von Hand gerechnet und stehen als Literal,
// damit ein Fehler in der Implementierung nicht zugleich die Erwartung
// verschiebt.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, expect, it } from "vitest";
import { EINRICHTUNG, FAKTEN, TARIFE, SPRACHEN_PREISE } from "./telefonassistent-copy";
import {
  UNBEKANNT,
  UNVOLLSTAENDIG,
  berechneNutzen,
  berechnePreis,
  minutenProMonat,
  sprachenAufschlagEur,
  tarifPreis,
  tarifVergleich,
  waehleSzenario,
  OFFEN,
  type NutzenEingabe,
} from "./telefonassistent-rechner";

const [BASIS, PRAXIS, MVZ] = TARIFE;

/** Kein Baustein gewählt — es gibt nichts zu rechnen, also auch keine Zahl. */
const NICHTS: NutzenEingabe = {
  zeit: { aktiv: false, anrufeHeuteVomTeam: null, minutenProAnrufTeam: null, uebernommenProzent: null, restaufwandProzent: null, stundenkostenEur: null },
  kosten: { aktiv: false, entfallendeAusgabenEur: null },
  termine: { aktiv: false, zusaetzlicheTermine: null, deckungsbeitragEur: null, freieKapazitaet: null },
};
const mitZeit = (z: Partial<NutzenEingabe["zeit"]>, rest: Partial<NutzenEingabe> = {}): NutzenEingabe => ({
  ...NICHTS, ...rest, zeit: { ...NICHTS.zeit, aktiv: true, ...z },
});
const mitKosten = (betrag: number | null, rest: Partial<NutzenEingabe> = {}): NutzenEingabe => ({
  ...NICHTS, ...rest, kosten: { aktiv: true, entfallendeAusgabenEur: betrag },
});
const mitTerminen = (t: Partial<NutzenEingabe["termine"]>, rest: Partial<NutzenEingabe> = {}): NutzenEingabe => ({
  ...NICHTS, ...rest, termine: { ...NICHTS.termine, aktiv: true, ...t },
});

describe("Verbindliche Preisstruktur", () => {
  it("Grundgebühren und Inklusivminuten wie vom Inhaber festgelegt", () => {
    expect(TARIFE.map((t) => [t.name, t.monatlichEur, t.minuten])).toEqual([
      ["Basis", 300, 500],
      ["Praxis", 500, 1000],
      ["MVZ", 800, 2000],
    ]);
  });

  it("Mehrminute 0,50 € für alle Tarife; Einrichtung 990 € für alle Tarife", () => {
    expect(FAKTEN.mehrpreisProMinuteEur).toBe(0.5);
    expect(FAKTEN.mehrpreisProMinute.replace(/\s/g, " ")).toBe("0,50 €");
    expect(EINRICHTUNG.eur).toBe(990);
    expect(EINRICHTUNG.anzeige.replace(/\s/g, " ")).toBe("990 €");
    for (const t of TARIFE) {
      expect(t).not.toHaveProperty("obergrenze");
      expect(t).not.toHaveProperty("obergrenzeEur");
      expect(t).not.toHaveProperty("einrichtungEur");
    }
  });

  it("Zahl und Anzeigetext des Monatspreises sagen dasselbe", () => {
    const alsZahl = (v: string) => Number(v.replace(/[^\d,]/g, "").replace(",", "."));
    for (const t of TARIFE) expect(alsZahl(t.monatlich)).toBe(t.monatlichEur);
  });
});

/*
  DIE FÜNF PFLICHTFÄLLE DES INHABERS (Auftrag 24.10.2026), von Hand:
     500 Min: Basis 300                       → Basis 300
   1.000 Min: Basis 300 + 500 × 0,50 = 550; Praxis 500; MVZ 800      → Praxis 500
   1.500 Min: Basis 300 + 1.000 × 0,50 = 800; Praxis 500 + 250 = 750; MVZ 800 → Praxis 750
   2.000 Min: Basis 1.050; Praxis 1.000; MVZ 800                      → MVZ 800
   3.000 Min: Basis 1.550; Praxis 1.500; MVZ 800 + 500 = 1.300       → MVZ 1.300
*/
describe("Pflichtfälle: Monatspreis je Tarif und günstigster Tarif", () => {
  const FAELLE: Array<[number, [number, number, number], string, number]> = [
    [500, [300, 500, 800], "Basis", 300],
    [1000, [550, 500, 800], "Praxis", 500],
    [1500, [800, 750, 800], "Praxis", 750],
    [2000, [1050, 1000, 800], "MVZ", 800],
    [3000, [1550, 1500, 1300], "MVZ", 1300],
  ];

  it.each(FAELLE)("%i Minuten", (minuten, erwartet, tarif, summe) => {
    const v = tarifVergleich(minuten);
    expect(v.map((x) => x.monatlichEur)).toEqual(erwartet);
    const best = waehleSzenario(minuten);
    expect(best.tarif.name).toBe(tarif);
    expect(best.monatlichEur).toBe(summe);
    const p = berechnePreis({ anrufeProMonat: minuten, minutenProAnruf: 1 }, 0);
    expect(p.empfehlung.tarif.name).toBe(tarif);
    expect(p.monatlichGesamtEur).toBe(summe);
  });

  it("weist Grundgebühr und Mehrminuten getrennt aus", () => {
    const basis1000 = tarifPreis(BASIS, 1000);
    expect(basis1000.tarif.monatlichEur).toBe(300);
    expect(basis1000.mehrminuten).toBe(500);
    expect(basis1000.mehrminutenEur).toBe(250);
    expect(basis1000.monatlichEur).toBe(550);
    const mvz3000 = tarifPreis(MVZ, 3000);
    expect(mvz3000.mehrminuten).toBe(1000);
    expect(mvz3000.mehrminutenEur).toBe(500);
  });
});

describe("Grenzen um jedes Kontingent", () => {
  it.each(TARIFE)("$name: knapp darunter, genau darauf, knapp darüber", (t) => {
    const unter = tarifPreis(t, t.minuten - 1);
    const genau = tarifPreis(t, t.minuten);
    const ueber = tarifPreis(t, t.minuten + 1);
    expect(unter.mehrminuten).toBe(0);
    expect(unter.monatlichEur).toBe(t.monatlichEur);
    expect(genau.mehrminuten).toBe(0);
    expect(genau.monatlichEur).toBe(t.monatlichEur);
    expect(ueber.mehrminuten).toBe(1);
    expect(ueber.monatlichEur).toBe(t.monatlichEur + 0.5);
  });

  it("Gleichstand Basis/Praxis bei 900 Minuten (beide 500 €): Praxis, weil ohne Mehrminuten", () => {
    expect(tarifPreis(BASIS, 900).monatlichEur).toBe(500);
    expect(tarifPreis(PRAXIS, 900).monatlichEur).toBe(500);
    expect(waehleSzenario(900).tarif.name).toBe("Praxis");
    expect(waehleSzenario(899).tarif.name).toBe("Basis"); // 499,50 € < 500 €
    expect(waehleSzenario(901).tarif.name).toBe("Praxis");
  });

  it("Gleichstand Praxis/MVZ bei 1.600 Minuten (beide 800 €): MVZ, weil ohne Mehrminuten", () => {
    expect(tarifPreis(PRAXIS, 1600).monatlichEur).toBe(800);
    expect(waehleSzenario(1600).tarif.name).toBe("MVZ");
    expect(waehleSzenario(1599).tarif.name).toBe("Praxis"); // 799,50 €
  });

  it("es gibt keinen Deckel: der Preis wächst linear und unbegrenzt", () => {
    for (const t of TARIFE) {
      const a = tarifPreis(t, t.minuten + 10_000).monatlichEur;
      const b = tarifPreis(t, t.minuten + 20_000).monatlichEur;
      expect(b - a).toBe(5000);
    }
  });

  it("der empfohlene Tarif ist nie teurer als ein anderer Listentarif", () => {
    for (let m = 0; m <= 5000; m += 7) {
      const best = waehleSzenario(m).monatlichEur;
      for (const v of tarifVergleich(m)) expect(best).toBeLessThanOrEqual(v.monatlichEur + 1e-9);
    }
  });

  it("Bruchminuten werden nicht gerundet (Rundungsregel offen, OWNER-INPUT J15)", () => {
    const p = tarifPreis(BASIS, 500.5);
    expect(p.mehrminuten).toBeCloseTo(0.5, 10);
    expect(p.mehrminutenEur).toBeCloseTo(0.25, 10);
  });

  it("ungültige Minuten erzeugen weder NaN noch Infinity", () => {
    for (const m of [NaN, -10, Infinity]) {
      const p = tarifPreis(BASIS, m);
      expect(Number.isFinite(p.monatlichEur)).toBe(true);
      expect(p.monatlichEur).toBe(300);
    }
  });
});

describe("Preisergebnis", () => {
  it("Einrichtung 990 € separat, nie im Monatspreis; Anbindung unbekannt, nie 0", () => {
    const p = berechnePreis({ anrufeProMonat: 100, minutenProAnruf: 2 }, 0);
    expect(p.einrichtungEur).toBe(990);
    expect(p.monatlichGesamtEur).toBe(300);
    expect(p.anbindungEur).toBe(UNBEKANNT);
  });

  it("bekannte Erstjahreskosten = 12 × Monat + 990 €", () => {
    const p = berechnePreis({ anrufeProMonat: 750, minutenProAnruf: 2 }, 0); // 1.500 Min → Praxis 750 €
    expect(p.monatlichGesamtEur).toBe(750);
    expect(p.ersteJahrBekannteKostenEur).toBe(12 * 750 + 990);
  });

  it("addiert eine eindeutige Zusatzsprache zur Monatssumme", () => {
    const p = berechnePreis({ anrufeProMonat: 100, minutenProAnruf: 2 }, 1);
    expect(p.monatlichGesamtEur).toBe(300 + SPRACHEN_PREISE.proSpracheEur);
  });

  it("nennt KEINE Monatssumme und keine Erstjahreskosten, solange der Sprachaufschlag offen ist", () => {
    const p = berechnePreis({ anrufeProMonat: 100, minutenProAnruf: 2 }, 2);
    expect(p.sprachenOffen).toBe(true);
    expect(p.monatlichGesamtEur).toBe(UNBEKANNT);
    expect(p.ersteJahrBekannteKostenEur).toBe(UNBEKANNT);
    expect(p.sprachenMonatlichEur).toBe(OFFEN);
  });

  it("null Minuten: Basis, 300 €", () => {
    const p = berechnePreis({ anrufeProMonat: 0, minutenProAnruf: 0 }, 0);
    expect(p.empfehlung.tarif.name).toBe("Basis");
    expect(p.monatlichGesamtEur).toBe(300);
  });

  it("weist ab der Enterprise-Untergrenze auf ein individuelles Kontingent hin", () => {
    // MVZ: 800 + (m − 2.000) × 0,50 ≥ 5.000 ⇔ m ≥ 10.400
    expect(berechnePreis({ anrufeProMonat: 10_399, minutenProAnruf: 1 }, 0).individuellPruefen).toBe(false);
    expect(berechnePreis({ anrufeProMonat: 10_400, minutenProAnruf: 1 }, 0).individuellPruefen).toBe(true);
  });
});

describe("Minutenbedarf", () => {
  it("multipliziert Anrufe mit Dauer", () => {
    expect(minutenProMonat({ anrufeProMonat: 200, minutenProAnruf: 2.5 })).toBe(500);
  });

  it("behandelt null Anrufe als null Minuten", () => {
    expect(minutenProMonat({ anrufeProMonat: 0, minutenProAnruf: 3 })).toBe(0);
  });

  it("klemmt unsinnige Eingaben auf null statt negativ zu rechnen", () => {
    expect(minutenProMonat({ anrufeProMonat: -50, minutenProAnruf: 3 })).toBe(0);
    expect(minutenProMonat({ anrufeProMonat: 50, minutenProAnruf: -3 })).toBe(0);
    expect(minutenProMonat({ anrufeProMonat: NaN, minutenProAnruf: 3 })).toBe(0);
  });
});

describe("Sprachaufschlag", () => {
  /*
    Die Quelle ist nur zum Teil eindeutig, und der Rechner hört genau dort auf.

    Eindeutig: Deutsch ist enthalten, jede weitere Sprache kostet 79 €.
    Nicht eindeutig: „ab drei Sprachen sind es 230 € … für bis zu fünf Sprachen"
    — ob Deutsch mitzählt, steht nirgends. Die frühere Fassung entschied das
    per Wirtschaftslogik (bei zwei Zusatzsprachen wäre ein Paket unwirtschaftlich,
    also müssen drei ZUSATZsprachen gemeint sein). Plausibel, aber kein Beleg;
    der Kunde bekommt, was im Vertrag steht.
  */
  it("nur Deutsch kostet nichts extra", () => {
    expect(sprachenAufschlagEur(0)).toEqual({ betrag: 0, offen: false });
  });

  it("eine Zusatzsprache ist eindeutig und wird beziffert", () => {
    expect(sprachenAufschlagEur(1)).toEqual({
      betrag: SPRACHEN_PREISE.proSpracheEur,
      offen: false,
    });
  });

  it("ab zwei Zusatzsprachen bleibt der Aufschlag offen statt geraten", () => {
    expect(sprachenAufschlagEur(2)).toEqual({ betrag: OFFEN, offen: true });
    expect(sprachenAufschlagEur(3)).toEqual({ betrag: OFFEN, offen: true });
  });

  it("zeigt einen offenen Aufschlag nie als 0", () => {
    for (const n of [2, 3] as const) {
      expect(sprachenAufschlagEur(n).betrag).not.toBe(0);
    }
  });
});

/* ───────────────────────────────────────────────────────────────────────────
   DREI BAUSTEINE, EIN GELDSALDO. Preis für 200 × 2 Minuten = 400 Minuten,
   Deutsch: Basis, 300 € im Monat; Einrichtung 990 € einmalig, nie im Saldo.
   ────────────────────────────────────────────────────────────────────────── */
const VOLUMEN = { anrufeProMonat: 200, minutenProAnruf: 2 };
const PREIS = berechnePreis(VOLUMEN, 0);

describe("Baustein A — Zeit ist kein Geldzufluss", () => {
  it("300 Teamanrufe × 2 Minuten, 50 % übernommen, ohne Nacharbeit: 5 Stunden, bedingt", () => {
    const r = berechneNutzen(PREIS, mitZeit({ anrufeHeuteVomTeam: 300, minutenProAnrufTeam: 2, uebernommenProzent: 50, restaufwandProzent: 0 }));
    expect(r.zeit.status).toBe("ok");
    expect(r.zeit.heuteStundenProMonat).toBeCloseTo(10, 10);
    expect(r.zeit.nettoStundenProMonat).toBeCloseTo(5, 10);
    expect(r.zeit.bedingt).toBe(false);
    expect(r.zeit.zeitwertEur).toBeNull();
  });

  it("30 €/Stunde ergibt 150 € Zeitwert — und KEINE Lohnersparnis im Saldo", () => {
    const r = berechneNutzen(PREIS, mitZeit({ anrufeHeuteVomTeam: 300, minutenProAnrufTeam: 2, uebernommenProzent: 50, restaufwandProzent: 0, stundenkostenEur: 30 }));
    expect(r.zeit.zeitwertEur).toBeCloseTo(150, 10);
    expect(r.cash.umfang).toEqual({ kosten: false, termine: false });
    // Der Saldo enthält nur Geld: 0 + 0 − 339. Die alten −189 €/Monat
    // (150 − 339) dürfen nicht als Cash-Rechnung fortbestehen.
    expect(r.cash.saldoProMonatEur).toBeCloseTo(-300, 10);
    expect(r.cash.saldoProMonatEur).not.toBeCloseTo(-150, 10);
    expect(r.cash.offeneKosten).toEqual(["anbindung"]);
  });

  it("100 % übernommen, 50 €/Stunde: 10 Stunden / 500 € Zeitwert, keine Amortisation aus dem Zeitwert", () => {
    const r = berechneNutzen(PREIS, mitZeit({ anrufeHeuteVomTeam: 300, minutenProAnrufTeam: 2, uebernommenProzent: 100, restaufwandProzent: 0, stundenkostenEur: 50 }));
    expect(r.zeit.nettoStundenProMonat).toBeCloseTo(10, 10);
    expect(r.zeit.zeitwertEur).toBeCloseTo(500, 10);
    // Vorher: (500 − 339) = +161 €/Monat und 9,3 Monate „hereingeholt".
    expect(r.cash.saldoProMonatEur).toBeLessThan(0);
    expect(r.cash).not.toHaveProperty("amortisationMonate");
  });

  it("ohne Restaufwand-Angabe ist das Ergebnis bedingt; mit Restaufwand wird abgezogen", () => {
    const bedingt = berechneNutzen(PREIS, mitZeit({ anrufeHeuteVomTeam: 300, minutenProAnrufTeam: 2, uebernommenProzent: 100 }));
    expect(bedingt.zeit.bedingt).toBe(true);
    expect(bedingt.zeit.nettoStundenProMonat).toBeCloseTo(10, 10);
    const netto = berechneNutzen(PREIS, mitZeit({ anrufeHeuteVomTeam: 300, minutenProAnrufTeam: 2, uebernommenProzent: 100, restaufwandProzent: 20 }));
    expect(netto.zeit.bedingt).toBe(false);
    expect(netto.zeit.nettoStundenProMonat).toBeCloseTo(8, 10);
  });

  it("Restaufwand über 100 % ergibt Mehrarbeit — negativ, nicht versteckt", () => {
    const r = berechneNutzen(PREIS, mitZeit({ anrufeHeuteVomTeam: 300, minutenProAnrufTeam: 2, uebernommenProzent: 100, restaufwandProzent: 150 }));
    expect(r.zeit.nettoStundenProMonat).toBeCloseTo(-5, 10);
  });

  it("150 % übernommen wird auf 100 % geklemmt — Rechenweg und Zahl stimmen überein", () => {
    const r = berechneNutzen(PREIS, mitZeit({ anrufeHeuteVomTeam: 300, minutenProAnrufTeam: 2, uebernommenProzent: 150, restaufwandProzent: 0 }));
    expect(r.zeit.nettoStundenProMonat).toBeCloseTo(10, 10);
  });

  it("leer ist nicht null: fehlende Pflichtfelder machen den Baustein unvollständig", () => {
    const r = berechneNutzen(PREIS, mitZeit({ anrufeHeuteVomTeam: null, minutenProAnrufTeam: 2, uebernommenProzent: 50 }));
    expect(r.zeit.status).toBe("unvollstaendig");
    expect(r.zeit.fehlend).toEqual(["anrufeHeuteVomTeam"]);
    expect(r.cash.saldoProMonatEur).toBe(UNVOLLSTAENDIG);
  });

  it("negative, NaN und zu große Eingaben erzeugen weder NaN noch Infinity", () => {
    for (const roh of [-5, Number.NaN, 1e9]) {
      const r = berechneNutzen(PREIS, mitZeit({ anrufeHeuteVomTeam: roh, minutenProAnrufTeam: 2, uebernommenProzent: 50, restaufwandProzent: 0 }));
      if (Number.isNaN(roh)) {
        expect(r.zeit.status).toBe("unvollstaendig");
      } else {
        expect(Number.isFinite(r.zeit.nettoStundenProMonat as number)).toBe(true);
        expect(r.zeit.nettoStundenProMonat as number).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe("Baustein B — nur tatsächlich entfallende Ausgaben", () => {
  it("0 € ist eine gültige, vollständige Antwort", () => {
    const r = berechneNutzen(PREIS, mitKosten(0));
    expect(r.kosten.status).toBe("ok");
    expect(r.kosten.ersparnisEur).toBe(0);
    expect(r.cash.saldoProMonatEur).toBeCloseTo(-300, 10);
  });

  it("600 € entfallender Telefonservice: Saldo 300 €/Monat; Einrichtung 990 € einmalig daneben, keine Amortisationsdauer", () => {
    const r = berechneNutzen(PREIS, mitKosten(600));
    expect(r.cash.saldoProMonatEur).toBeCloseTo(300, 10);
    expect(r.cash.einmaligeKostenEur).toBe(990);
    expect(r.cash).not.toHaveProperty("amortisationMonate");
  });

  it("keine Vollkosten auf Minuten: das Aufkommen ändert die Ersparnis nicht", () => {
    const a = berechneNutzen(berechnePreis({ anrufeProMonat: 100, minutenProAnruf: 2 }, 0), mitKosten(600));
    const b = berechneNutzen(berechnePreis({ anrufeProMonat: 250, minutenProAnruf: 2 }, 0), mitKosten(600));
    expect(a.kosten.ersparnisEur).toBe(600);
    expect(b.kosten.ersparnisEur).toBe(600);
  });
});

describe("Baustein C — zusätzliche Termine nur mit Kapazität", () => {
  it("ohne Kapazitätsangabe: Potenzial, kein realisierbarer Beitrag, nichts im Saldo", () => {
    const r = berechneNutzen(PREIS, mitTerminen({ zusaetzlicheTermine: 5, deckungsbeitragEur: 40 }));
    expect(r.termine.potenzialEur).toBe(200);
    expect(r.termine.kapazitaetUnbekannt).toBe(true);
    expect(r.termine.realisierbarEur).toBeNull();
    expect(r.cash.saldoProMonatEur).toBeCloseTo(-300, 10);
  });

  it("0 freie Kapazität: kein realisierbarer Beitrag", () => {
    const r = berechneNutzen(PREIS, mitTerminen({ zusaetzlicheTermine: 5, deckungsbeitragEur: 40, freieKapazitaet: 0 }));
    expect(r.termine.realisierbareTermine).toBe(0);
    expect(r.termine.realisierbarEur).toBe(0);
    expect(r.termine.kapazitaetBegrenzt).toBe(true);
  });

  it("Kapazität begrenzt: 5 Termine, 3 frei → 3 × 40 € = 120 €", () => {
    const r = berechneNutzen(PREIS, mitTerminen({ zusaetzlicheTermine: 5, deckungsbeitragEur: 40, freieKapazitaet: 3 }));
    expect(r.termine.realisierbarEur).toBe(120);
    expect(r.termine.kapazitaetBegrenzt).toBe(true);
  });

  it("0 zusätzliche Termine ist eine vollständige Angabe mit Beitrag 0", () => {
    const r = berechneNutzen(PREIS, mitTerminen({ zusaetzlicheTermine: 0, deckungsbeitragEur: 40, freieKapazitaet: 8 }));
    expect(r.termine.status).toBe("ok");
    expect(r.termine.realisierbarEur).toBe(0);
    expect(r.cash.saldoProMonatEur).toBeCloseTo(-300, 10);
  });

  it("erzeugt keine Fälle aus Anrufversuchen — es gibt kein Feld für verpasste Anrufe", () => {
    const r = berechneNutzen(PREIS, mitTerminen({ zusaetzlicheTermine: 5, deckungsbeitragEur: 40, freieKapazitaet: 8 }));
    expect(Object.keys(NICHTS.termine)).not.toContain("verpassteAnrufeProMonat");
    expect(r.termine.realisierbarEur).toBe(200);
  });
});

describe("Geldsaldo — nur Geld, nur bekannte Kosten", () => {
  it("Fixture: 600 € Ersparnis + 5 × 40 € realisierbar − 300 € = 500 €/Monat; kein Jahreswert ohne Einrichtungsbetrag", () => {
    const r = berechneNutzen(PREIS, {
      zeit: NICHTS.zeit,
      kosten: { aktiv: true, entfallendeAusgabenEur: 600 },
      termine: { aktiv: true, zusaetzlicheTermine: 5, deckungsbeitragEur: 40, freieKapazitaet: 8 },
    });
    expect(r.vollstaendig).toBe(true);
    expect(r.cash.saldoProMonatEur).toBeCloseTo(500, 10);
    expect(r.cash.offeneKosten).toEqual(["anbindung"]);
    expect(r.cash.kapazitaetskonflikt).toBe(true);
  });

  it("der Zeitwert geht in keinen Saldo — auch nicht zusammen mit Geldbausteinen", () => {
    const ohne = berechneNutzen(PREIS, mitKosten(600));
    const mit = berechneNutzen(PREIS, mitKosten(600, { zeit: { aktiv: true, anrufeHeuteVomTeam: 300, minutenProAnrufTeam: 2, uebernommenProzent: 100, restaufwandProzent: 0, stundenkostenEur: 50 } }));
    expect(mit.zeit.zeitwertEur).toBeCloseTo(500, 10);
    expect(mit.cash.saldoProMonatEur).toBeCloseTo(ohne.cash.saldoProMonatEur as number, 10);
  });

  it("kein Baustein gewählt: keine Zahl — weder positiv noch negativ", () => {
    const r = berechneNutzen(PREIS, NICHTS);
    expect(r.vollstaendig).toBe(false);
    expect(r.cash.saldoProMonatEur).toBe(UNVOLLSTAENDIG);
  });

  it("ein unvollständiger aktiver Baustein blockiert den Saldo, auch wenn ein anderer vollständig ist", () => {
    const r = berechneNutzen(PREIS, mitKosten(600, { termine: { aktiv: true, zusaetzlicheTermine: 5, deckungsbeitragEur: null, freieKapazitaet: 8 } }));
    expect(r.kosten.status).toBe("ok");
    expect(r.termine.status).toBe("unvollstaendig");
    expect(r.cash.saldoProMonatEur).toBe(UNVOLLSTAENDIG);
  });

  it("Saldo ≤ 0: negativer Wert sichtbar, nicht versteckt", () => {
    const r = berechneNutzen(PREIS, mitKosten(100));
    expect(r.cash.saldoProMonatEur).toBeCloseTo(-200, 10);
    const exakt = berechneNutzen(PREIS, mitKosten(300));
    expect(exakt.cash.saldoProMonatEur).toBeCloseTo(0, 10);
  });

  it("ohne bezifferbaren Preis (offene Sprachen) gibt es keinen Saldo; hohes Aufkommen rechnet ohne Deckel", () => {
    // 25.000 Min → MVZ 800 € + 23.000 × 0,50 € = 12.300 €; 600 − 12.300 = −11.700 €.
    const riesig = { anrufeProMonat: 5000, minutenProAnruf: 5 };
    expect(berechneNutzen(berechnePreis(riesig, 0), mitKosten(600)).cash.saldoProMonatEur).toBe(-11700);
    expect(berechneNutzen(berechnePreis(VOLUMEN, 3), mitKosten(600)).cash.saldoProMonatEur).toBe(UNBEKANNT);
  });

  it("über eine Matrix aus Eingaben: unvollständig heißt nie eine Zahl, vollständig heißt endlich", () => {
    const werte = [null, 0, 40, 1000];
    for (const k of werte) for (const t of werte) for (const db of werte) for (const kap of [null, 0, 2, 100]) {
      for (const kostenAktiv of [false, true]) for (const termineAktiv of [false, true]) {
        const r = berechneNutzen(PREIS, {
          zeit: NICHTS.zeit,
          kosten: { aktiv: kostenAktiv, entfallendeAusgabenEur: k },
          termine: { aktiv: termineAktiv, zusaetzlicheTermine: t, deckungsbeitragEur: db, freieKapazitaet: kap },
        });
        if (r.vollstaendig) {
          expect(Number.isFinite(r.cash.saldoProMonatEur as number)).toBe(true);
        } else {
          expect(typeof r.cash.saldoProMonatEur).not.toBe("number");
        }
      }
    }
  });
});
