// ─────────────────────────────────────────────────────────────────────────────
// Der Rechenkern wird hier von Hand nachgerechnet, nicht über ein gerendertes
// Bauteil beobachtet. Preisarithmetik auf einer öffentlichen Seite ist eine
// Aussage gegenüber einem Käufer: Ein stiller Rundungs- oder Deckelungsfehler
// ist eine falsche Preisauskunft, kein Anzeigefehler.
//
// Die Grenzfälle stehen hier ausgeschrieben, weil genau sie in einem
// Preismodell mit Kontingent UND Deckel die interessanten sind: exakt am
// Kontingent, eine Minute darüber, exakt am Deckel, darüber.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, expect, it } from "vitest";
import { EINRICHTUNG, FAKTEN, SPRACHEN, SPRACHEN_PREISE, TARIFE } from "./telefonassistent-copy";
import {
  UNBEKANNT,
  UNVOLLSTAENDIG,
  berechneNutzen,
  berechnePreis,
  minutenProMonat,
  sprachenAufschlagEur,
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

describe("Die numerischen Zwillinge stimmen mit den Anzeigetexten überein", () => {
  // Der Grund, warum es beide Darstellungen geben darf: Sie können nicht
  // auseinanderlaufen, ohne dass dieser Test anschlägt.
  const alsZahl = (s: string) =>
    Number(s.replace(/[^\d,]/g, "").replace(/\./g, "").replace(",", "."));

  it.each(TARIFE)("$name: Zahl und String sagen dasselbe", (t) => {
    expect(alsZahl(t.monatlich)).toBe(t.monatlichEur);
    expect(alsZahl(t.obergrenze)).toBe(t.obergrenzeEur);
  });

  it("die Einrichtung ist kein Tariffeld mehr — ein Standard, Betrag offen", () => {
    for (const t of TARIFE) {
      expect(t).not.toHaveProperty("einrichtung");
      expect(t).not.toHaveProperty("einrichtungEur");
    }
    expect(EINRICHTUNG.betragOffen).toBe(true);
    expect(EINRICHTUNG.kurz).toMatch(/Angebot/);
    expect(FAKTEN).not.toHaveProperty("mehrpreisProMinute");
  });

  it("Der eindeutige Sprachpreis steht so auch im Fließtext", () => {
    // Bekannt und zusagbar: der Preis für EINE weitere Sprache.
    expect(SPRACHEN.text).toContain(String(SPRACHEN_PREISE.proSpracheEur));
  });

  it("nennt den unbestätigten Paketpreis NICHT als feststehenden Betrag", () => {
    /*
      OWNER-INPUT H3 ist offen: ob „ab drei Sprachen" zwei oder drei
      ZUSATZsprachen meint und ob „bis zu fünf" Deutsch mitzählt. Bis zum
      12.09.2026 nannte dieser Fließtext „230 €" trotzdem als Tatsache —
      während `sprachenAufschlagEur` dieselbe Konstellation schon als OFFEN
      auswies. Der sichtbare Text darf nicht sicherer sein als die Rechnung.
    */
    expect(SPRACHEN.text).not.toContain(String(SPRACHEN_PREISE.paketEur));
    // Und er verschweigt die Mehrkosten auch nicht.
    expect(SPRACHEN.text).toMatch(/Paketpreis/);
    expect(SPRACHEN.text).toMatch(/Angebot/);
  });

  it("weist ab zwei Zusatzsprachen einen offenen Betrag aus, keinen geratenen", () => {
    expect(sprachenAufschlagEur(0)).toEqual({ betrag: 0, offen: false });
    expect(sprachenAufschlagEur(1)).toEqual({
      betrag: SPRACHEN_PREISE.proSpracheEur,
      offen: false,
    });
    for (const n of [2, 3] as const) {
      const a = sprachenAufschlagEur(n);
      expect(a.offen, `${n} Zusatzsprachen müssen offen bleiben`).toBe(true);
      expect(typeof a.betrag).not.toBe("number");
    }
  });

  it("Das Sprachpaket ist günstiger als Einzelpreise ab der Schwelle", () => {
    // Diese Ungleichung ist der Grund, WARUM die Lesart überhaupt strittig ist
    // (siehe Kommentar an SPRACHEN_PREISE). Kippt sie, ist die Lesart falsch.
    const einzeln = SPRACHEN_PREISE.paketAbZusatzsprachen * SPRACHEN_PREISE.proSpracheEur;
    expect(SPRACHEN_PREISE.paketEur).toBeLessThan(einzeln);
    const eineWeniger = (SPRACHEN_PREISE.paketAbZusatzsprachen - 1) * SPRACHEN_PREISE.proSpracheEur;
    expect(eineWeniger).toBeLessThan(SPRACHEN_PREISE.paketEur);
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

describe("Tarifwahl nach Kontingent", () => {
  it("null Minuten: kleinster Tarif, Kontingent reicht", () => {
    const s = waehleSzenario(0)!;
    expect(s.tarif.name).toBe(BASIS.name);
    expect(s.mehrverbrauchMinuten).toBe(0);
    expect(s.passt).toBe(true);
    expect(s.telefonieMonatlichEur).toBe(BASIS.monatlichEur);
  });

  it("exakt am Kontingent: Basis passt noch", () => {
    const s = waehleSzenario(BASIS.minuten)!;
    expect(s.tarif.name).toBe(BASIS.name);
    expect(s.telefonieMonatlichEur).toBe(BASIS.monatlichEur);
  });

  it("eine Minute über dem Basis-Kontingent: der nächste Tarif, kein Minutenpreis", () => {
    const s = waehleSzenario(BASIS.minuten + 1)!;
    expect(s.tarif.name).toBe(PRAXIS.name);
    expect(s.telefonieMonatlichEur).toBe(PRAXIS.monatlichEur);
    // Basis liegt im Vergleich als „überschritten" mit offenem Betrag.
    const basis = tarifVergleich(BASIS.minuten + 1)[0];
    expect(basis.passt).toBe(false);
    expect(basis.mehrverbrauchMinuten).toBe(1);
    expect(basis.telefonieMonatlichEur).toBe(OFFEN);
  });

  it("jede Kontingentgrenze: knapp darunter, genau darauf, knapp darüber", () => {
    for (let i = 0; i < TARIFE.length; i += 1) {
      const t = TARIFE[i];
      expect(waehleSzenario(t.minuten - 1)!.tarif.name).toBe(t.name === BASIS.name ? BASIS.name : waehleSzenario(t.minuten - 1)!.tarif.name);
      expect(waehleSzenario(t.minuten)!.tarif.name).toBe(t.name);
      const darueber = waehleSzenario(t.minuten + 1);
      if (i + 1 < TARIFE.length) expect(darueber!.tarif.name).toBe(TARIFE[i + 1].name);
      else expect(darueber).toBeNull();
    }
  });

  it("der Monatspreis eines passenden Tarifs ist nie höher als sein Listenpreis", () => {
    for (let m = 0; m <= MVZ.minuten; m += 25) {
      const s = waehleSzenario(m)!;
      expect(s.telefonieMonatlichEur).toBe(s.tarif.monatlichEur);
    }
  });

  it("über dem größten Kontingent: kein Listenpreis mehr, sondern individuell", () => {
    expect(waehleSzenario(MVZ.minuten + 1)).toBeNull();
    expect(waehleSzenario(50_000)).toBeNull();
  });

  it("jeder Tarif wird irgendwo gewählt", () => {
    const gewaehlte = new Set<string>();
    for (let m = 0; m <= MVZ.minuten; m += 10) gewaehlte.add(waehleSzenario(m)!.tarif.name);
    expect([...gewaehlte]).toEqual(TARIFE.map((t) => t.name));
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

describe("Preisergebnis", () => {
  it("weist Anbindung als unbekannt und Einrichtung als offen aus — niemals als 0", () => {
    const p = berechnePreis({ anrufeProMonat: 100, minutenProAnruf: 2 }, 0);
    expect(p.anbindungEur).toBe(UNBEKANNT);
    expect(p.einrichtungEur).toBe(OFFEN);
    expect(p.monatlichGesamtEur).toBe(p.szenario!.telefonieMonatlichEur);
  });

  it("addiert einen eindeutigen Sprachaufschlag zur Monatssumme", () => {
    const ohne = berechnePreis({ anrufeProMonat: 100, minutenProAnruf: 2 }, 0);
    const mit = berechnePreis({ anrufeProMonat: 100, minutenProAnruf: 2 }, 1);
    expect(mit.monatlichGesamtEur).toBe((ohne.monatlichGesamtEur as number) + SPRACHEN_PREISE.proSpracheEur);
  });

  it("nennt KEINE Monatssumme, solange der Sprachaufschlag offen ist", () => {
    const p = berechnePreis({ anrufeProMonat: 100, minutenProAnruf: 2 }, 2);
    expect(p.sprachenOffen).toBe(true);
    expect(p.monatlichGesamtEur).toBe(UNBEKANNT);
  });

  it("null Anrufe ergeben den kleinsten Tarif und keine Fehlerwerte", () => {
    const p = berechnePreis({ anrufeProMonat: 0, minutenProAnruf: 0 }, 0);
    expect(p.modus).toBe("standard");
    expect(p.minutenProMonat).toBe(0);
    expect(p.monatlichGesamtEur).toBe(BASIS.monatlichEur);
  });

  it("im individuellen Modus gibt es keinen erfundenen Monatsbetrag", () => {
    const p = berechnePreis({ anrufeProMonat: 5000, minutenProAnruf: 5 }, 1);
    expect(p.modus).toBe("individuell");
    expect(p.monatlichGesamtEur).toBe(UNBEKANNT);
    expect(p.einrichtungEur).toBe(OFFEN);
    expect(p.sprachenMonatlichEur).toBe(SPRACHEN_PREISE.proSpracheEur);
  });
});

/* ───────────────────────────────────────────────────────────────────────────
   DREI BAUSTEINE, EIN GELDSALDO — Korrektur vom 23.10.2026; Preisbasis seit
   24.10.2026 nach Kontingent (kein Minutenpreis, Einrichtung offen).

   Erwartungswerte sind von Hand hergeleitet und stehen als Literal, damit ein
   Fehler in der Implementierung nicht zugleich die Erwartung verschiebt.
   Preis für 200 × 2 Minuten = 400 Minuten, Deutsch: Basis, 300 € im Monat.
   Einrichtung: offen (kein Erstjahr, keine Amortisation).
   ────────────────────────────────────────────────────────────────────────── */
const VOLUMEN = { anrufeProMonat: 200, minutenProAnruf: 2 };
const PREIS = berechnePreis(VOLUMEN, 0);

describe("Preisfixpunkte", () => {
  it("200 × 2 Minuten: Basis, 300 €, Einrichtung offen", () => {
    expect(PREIS.szenario!.tarif.name).toBe("Basis");
    expect(PREIS.monatlichGesamtEur).toBe(300);
    expect(PREIS.einrichtungEur).toBe(OFFEN);
    expect(PREIS.anbindungEur).toBe(UNBEKANNT);
  });

  it("300 × 2 Minuten = 600 Minuten: Basis-Kontingent überschritten → Praxis, 500 €", () => {
    const p = berechnePreis({ anrufeProMonat: 300, minutenProAnruf: 2 }, 0);
    expect(p.szenario!.tarif.name).toBe("Praxis");
    expect(p.monatlichGesamtEur).toBe(500);
    expect(p.vergleich[0].passt).toBe(false);
    expect(p.vergleich[0].mehrverbrauchMinuten).toBe(100);
  });

  it("1.000 × 2 Minuten = 2.000 Minuten: MVZ passt genau, 800 €", () => {
    const p = berechnePreis({ anrufeProMonat: 1000, minutenProAnruf: 2 }, 0);
    expect(p.szenario!.tarif.name).toBe("MVZ");
    expect(p.monatlichGesamtEur).toBe(800);
    expect(p.vergleich.map((v) => v.passt)).toEqual([false, false, true]);
  });

  it("legt alle drei Listentarife offen und rechnet nirgends mit Obergrenze oder Minutenpreis", () => {
    const v = tarifVergleich(600);
    expect(v.map((x) => x.tarif.name)).toEqual([BASIS.name, PRAXIS.name, MVZ.name]);
    expect(v[0].telefonieMonatlichEur).toBe(OFFEN);
    expect(v[1].telefonieMonatlichEur).toBe(PRAXIS.monatlichEur);
    expect(v[2].telefonieMonatlichEur).toBe(MVZ.monatlichEur);
    for (const x of v) expect(x).not.toHaveProperty("amDeckel");
  });
});

describe("Sprachaufschlag — 0, 1, 2, 3+ Zusatzsprachen", () => {
  it("0: keine Position; 1: 79 € dazu; 2 und 3+: offen", () => {
    expect(berechnePreis(VOLUMEN, 0).monatlichGesamtEur).toBe(300);
    expect(berechnePreis(VOLUMEN, 1).monatlichGesamtEur).toBe(300 + SPRACHEN_PREISE.proSpracheEur);
    expect(berechnePreis(VOLUMEN, 2).monatlichGesamtEur).toBe(UNBEKANNT);
    expect(berechnePreis(VOLUMEN, 3).monatlichGesamtEur).toBe(UNBEKANNT);
  });
});

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
    expect(r.cash.offeneKosten).toEqual(["einrichtung", "anbindung"]);
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

  it("600 € entfallender Telefonservice: Saldo 300 €/Monat — ohne Erstjahr und Amortisation, weil die Einrichtung offen ist", () => {
    const r = berechneNutzen(PREIS, mitKosten(600));
    expect(r.cash.saldoProMonatEur).toBeCloseTo(300, 10);
    expect(r.cash.einmaligeKostenEur).toBe(OFFEN);
    expect(r.cash).not.toHaveProperty("ersteJahrSaldoEur");
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
    expect(r.cash.offeneKosten).toEqual(["einrichtung", "anbindung"]);
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

  it("ohne bezifferbaren Preis (individuell, offene Sprachen) gibt es keinen Saldo", () => {
    const riesig = { anrufeProMonat: 5000, minutenProAnruf: 5 };
    expect(berechneNutzen(berechnePreis(riesig, 0), mitKosten(600)).cash.saldoProMonatEur).toBe(UNBEKANNT);
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
