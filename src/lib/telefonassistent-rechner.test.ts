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
import { FAKTEN, SPRACHEN, SPRACHEN_PREISE, TARIFE } from "./telefonassistent-copy";
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
    expect(alsZahl(t.einrichtung)).toBe(t.einrichtungEur);
  });

  it("Mehrpreis je Minute stimmt mit FAKTEN.mehrpreisProMinute überein", () => {
    expect(alsZahl(FAKTEN.mehrpreisProMinute)).toBe(FAKTEN.mehrpreisProMinuteEur);
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

describe("Tarifwahl und Deckelung", () => {
  it("null Minuten: kleinster Tarif, kein Mehrverbrauch", () => {
    const s = waehleSzenario(0)!;
    expect(s.tarif.name).toBe(BASIS.name);
    expect(s.mehrverbrauchMinuten).toBe(0);
    expect(s.telefonieMonatlichEur).toBe(BASIS.monatlichEur);
    expect(s.amDeckel).toBe(false);
  });

  it("exakt am Kontingent: noch kein Mehrverbrauch", () => {
    const s = waehleSzenario(BASIS.minuten)!;
    expect(s.tarif.name).toBe(BASIS.name);
    expect(s.mehrverbrauchMinuten).toBe(0);
    expect(s.telefonieMonatlichEur).toBe(BASIS.monatlichEur);
  });

  it("eine Minute über dem Kontingent: genau ein Minutenpreis mehr", () => {
    const s = waehleSzenario(BASIS.minuten + 1)!;
    expect(s.tarif.name).toBe(BASIS.name);
    expect(s.mehrverbrauchMinuten).toBe(1);
    expect(s.telefonieMonatlichEur).toBeCloseTo(
      BASIS.monatlichEur + FAKTEN.mehrpreisProMinuteEur,
      10
    );
  });

  it("überschreitet der Basistarif seinen Deckel, greift der nächste Tarif", () => {
    // Basis erreicht 500 € bei 300 € + 0,39 €/Min → 512,82 Minuten über 500,
    // also ab 1.013 Minuten (aufgerundet). Ab dort ist Basis „am Deckel" und
    // fällt nach Regel 3 aus der Auswahl.
    const deckelMinuten = BASIS.minuten + (BASIS.obergrenzeEur - BASIS.monatlichEur) / FAKTEN.mehrpreisProMinuteEur;
    const s = waehleSzenario(Math.ceil(deckelMinuten))!;
    expect(s.tarif.name).not.toBe(BASIS.name);
  });

  it("wählt den günstigsten Tarif, der NICHT am Deckel läuft", () => {
    const minuten = 1200;
    const s = waehleSzenario(minuten)!;
    expect(s.amDeckel).toBe(false);
    // Kein anderer Tarif ohne Deckel ist billiger.
    for (const t of TARIFE) {
      const ueber = Math.max(0, minuten - t.minuten);
      const roh = t.monatlichEur + ueber * FAKTEN.mehrpreisProMinuteEur;
      if (roh < t.obergrenzeEur) {
        expect(s.telefonieMonatlichEur).toBeLessThanOrEqual(roh);
      }
    }
  });

  it("zahlt nie mehr als die Obergrenze des gewählten Tarifs", () => {
    for (let minuten = 0; minuten <= 3500; minuten += 50) {
      const s = waehleSzenario(minuten);
      if (!s) continue;
      expect(s.telefonieMonatlichEur).toBeLessThanOrEqual(s.tarif.obergrenzeEur);
      expect(s.telefonieMonatlichEur).toBeGreaterThanOrEqual(s.tarif.monatlichEur);
    }
  });

  it("sehr hohes Aufkommen: kein Listenpreis mehr, sondern individuell", () => {
    // Über dem Punkt, an dem auch der größte Tarif dauerhaft am Deckel liefe.
    const mvzDeckel = MVZ.minuten + (MVZ.obergrenzeEur - MVZ.monatlichEur) / FAKTEN.mehrpreisProMinuteEur;
    expect(waehleSzenario(Math.ceil(mvzDeckel))).toBeNull();
    expect(waehleSzenario(50_000)).toBeNull();
  });

  it("der mittlere Tarif wird tatsächlich irgendwo gewählt", () => {
    // Schutz gegen eine Regel, die einen Tarif faktisch nie erreichbar macht.
    const gewaehlte = new Set<string>();
    for (let m = 0; m <= 3500; m += 25) {
      const s = waehleSzenario(m);
      if (s) gewaehlte.add(s.tarif.name);
    }
    expect(gewaehlte).toContain(BASIS.name);
    expect(gewaehlte).toContain(PRAXIS.name);
    expect(gewaehlte).toContain(MVZ.name);
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
  it("weist die Anbindung als unbekannt aus — niemals als 0", () => {
    const p = berechnePreis({ anrufeProMonat: 200, minutenProAnruf: 2 }, 0);
    expect(p.anbindungEur).toBe(UNBEKANNT);
    // Der eigentliche Punkt: Die unbekannte Position darf nicht still als
    // Null in die Monatssumme eingehen.
    expect(p.monatlichGesamtEur).toBe(p.szenario!.telefonieMonatlichEur);
  });

  it("addiert einen eindeutigen Sprachaufschlag zur Monatssumme", () => {
    const ohne = berechnePreis({ anrufeProMonat: 200, minutenProAnruf: 2 }, 0);
    const mit = berechnePreis({ anrufeProMonat: 200, minutenProAnruf: 2 }, 1);
    expect(mit.monatlichGesamtEur).toBe(
      (ohne.monatlichGesamtEur as number) + SPRACHEN_PREISE.proSpracheEur
    );
  });

  it("nennt KEINE Monatssumme, solange der Sprachaufschlag offen ist", () => {
    const p = berechnePreis({ anrufeProMonat: 200, minutenProAnruf: 2 }, 2);
    // Die Telefonie steht fest …
    expect(p.szenario!.telefonieMonatlichEur).toBeGreaterThan(0);
    // … die Summe nicht. Sie ohne den offenen Posten auszuweisen wäre eine
    // Zahl, die niedriger ist als die spätere Rechnung des Kunden.
    expect(p.sprachenOffen).toBe(true);
    expect(p.monatlichGesamtEur).toBe(UNBEKANNT);
  });

  it("null Anrufe ergeben den kleinsten Tarif und keine Fehlerwerte", () => {
    const p = berechnePreis({ anrufeProMonat: 0, minutenProAnruf: 0 }, 0);
    expect(p.modus).toBe("standard");
    expect(p.minutenProMonat).toBe(0);
    expect(p.monatlichGesamtEur).toBe(BASIS.monatlichEur);
    expect(p.einrichtungEur).toBe(BASIS.einrichtungEur);
  });

  it("im individuellen Modus gibt es keinen erfundenen Monatsbetrag", () => {
    const p = berechnePreis({ anrufeProMonat: 5000, minutenProAnruf: 4 }, 1);
    expect(p.modus).toBe("individuell");
    expect(p.monatlichGesamtEur).toBe(UNBEKANNT);
    expect(p.einrichtungEur).toBe(UNBEKANNT);
    // Der eindeutige Sprachaufschlag bleibt bekannt, auch wenn der Tarif es
    // nicht ist — zwei verschiedene Gründe für „keine Zahl".
    expect(p.sprachenMonatlichEur).toBe(SPRACHEN_PREISE.proSpracheEur);
  });
});

/* ───────────────────────────────────────────────────────────────────────────
   DREI BAUSTEINE, EIN GELDSALDO — Korrektur vom 23.10.2026.

   Erwartungswerte sind von Hand hergeleitet und stehen als Literal, damit ein
   Fehler in der Implementierung nicht zugleich die Erwartung verschiebt.
   Preis für 300 × 2 Minuten, Deutsch: Basis 300 € + 100 × 0,39 € = 339 €;
   Einrichtung 1.490 €; bekannte Jahreskosten 12 × 339 + 1.490 = 5.558 €.
   ────────────────────────────────────────────────────────────────────────── */
const VOLUMEN = { anrufeProMonat: 300, minutenProAnruf: 2 };
const PREIS = berechnePreis(VOLUMEN, 0);

describe("Preisfixpunkt 300 × 2 Minuten", () => {
  it("339 € Listenrechnung, 1.490 € Einrichtung, 5.558 € bekannte Jahreskosten", () => {
    expect(PREIS.szenario!.tarif.name).toBe("Basis");
    expect(PREIS.monatlichGesamtEur).toBeCloseTo(339, 10);
    expect(PREIS.einrichtungEur).toBe(1490);
    expect((PREIS.monatlichGesamtEur as number) * 12 + (PREIS.einrichtungEur as number)).toBeCloseTo(5558, 10);
    expect(PREIS.anbindungEur).toBe(UNBEKANNT);
  });

  it("legt alle drei Listentarife bei diesem Aufkommen offen", () => {
    const v = tarifVergleich(600);
    expect(v.map((x) => x.tarif.name)).toEqual([BASIS.name, PRAXIS.name, MVZ.name]);
    expect(v[0].telefonieMonatlichEur).toBeCloseTo(339, 10);
    expect(v[1].telefonieMonatlichEur).toBe(PRAXIS.monatlichEur);
    expect(v[2].telefonieMonatlichEur).toBe(MVZ.monatlichEur);
    expect(PREIS.vergleich).toHaveLength(TARIFE.length);
  });

  it("1.000 × 2 Minuten: Zuordnungsregel nennt MVZ, der Vergleich zeigt Basis und Praxis an der Obergrenze", () => {
    const p = berechnePreis({ anrufeProMonat: 1000, minutenProAnruf: 2 }, 0);
    expect(p.szenario!.tarif.name).toBe("MVZ");
    expect(p.szenario!.telefonieMonatlichEur).toBe(800);
    const [b, pr] = p.vergleich;
    // 300 + 1.500 × 0,39 = 885 → Deckel 500; 500 + 1.000 × 0,39 = 890 → Deckel 800.
    expect(b.amDeckel).toBe(true);
    expect(b.telefonieMonatlichEur).toBe(BASIS.obergrenzeEur);
    expect(pr.amDeckel).toBe(true);
    expect(pr.telefonieMonatlichEur).toBe(PRAXIS.obergrenzeEur);
  });
});

describe("Sprachaufschlag und Obergrenze — Summe nur, wo beide Lesarten gleich sind", () => {
  it("unter der Obergrenze ist Telefonie + Aufschlag eine Zahl", () => {
    const p = berechnePreis(VOLUMEN, 1);
    expect(p.monatlichGesamtEur).toBeCloseTo(339 + SPRACHEN_PREISE.proSpracheEur, 10);
    expect(p.monatlichSpanne).toBeNull();
  });

  it("über der Obergrenze steht eine Spanne, keine stille Lesart", () => {
    // 1.012 Minuten: Basis 300 + 512 × 0,39 = 499,68 (knapp unter 500) + 79 = 578,68 > 500.
    const p = berechnePreis({ anrufeProMonat: 1012, minutenProAnruf: 1 }, 1);
    expect(p.szenario!.tarif.name).toBe("Basis");
    expect(p.monatlichGesamtEur).toBe(UNBEKANNT);
    expect(p.monatlichSpanne).toEqual({ min: BASIS.obergrenzeEur, max: 499.68 + SPRACHEN_PREISE.proSpracheEur });
  });

  it("ohne Zusatzsprache gibt es nie eine Spanne", () => {
    for (let m = 0; m <= 3600; m += 7) {
      const p = berechnePreis({ anrufeProMonat: m, minutenProAnruf: 1 }, 0);
      expect(p.monatlichSpanne).toBeNull();
    }
  });

  it("jede Tarif- und Deckelgrenze: knapp darunter, genau darauf, knapp darüber ohne Sprung ins Falsche", () => {
    for (const t of TARIFE) {
      for (const m of [t.minuten - 1, t.minuten, t.minuten + 1]) {
        const p = berechnePreis({ anrufeProMonat: m, minutenProAnruf: 1 }, 0);
        const eigene = p.vergleich.find((v) => v.tarif.name === t.name)!;
        expect(eigene.mehrverbrauchMinuten).toBe(Math.max(0, m - t.minuten));
        expect(eigene.telefonieMonatlichEur).toBeLessThanOrEqual(t.obergrenzeEur);
      }
      const deckelMinuten = t.minuten + (t.obergrenzeEur - t.monatlichEur) / FAKTEN.mehrpreisProMinuteEur;
      for (const m of [Math.floor(deckelMinuten) - 1, Math.floor(deckelMinuten), Math.ceil(deckelMinuten) + 1]) {
        const eigene = tarifVergleich(m).find((v) => v.tarif.name === t.name)!;
        expect(eigene.telefonieMonatlichEur).toBeLessThanOrEqual(t.obergrenzeEur);
        expect(eigene.amDeckel).toBe(t.monatlichEur + eigene.mehrverbrauchEur >= t.obergrenzeEur);
      }
    }
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
    expect(r.cash.saldoProMonatEur).toBeCloseTo(-339, 10);
    expect(r.cash.saldoProMonatEur).not.toBeCloseTo(-189, 10);
    expect(r.cash.ersteJahrSaldoEur).toBeCloseTo(-339 * 12 - 1490, 10);
    expect(r.cash.amortisationMonate).toBeNull();
  });

  it("100 % übernommen, 50 €/Stunde: 10 Stunden / 500 € Zeitwert, keine Amortisation aus dem Zeitwert", () => {
    const r = berechneNutzen(PREIS, mitZeit({ anrufeHeuteVomTeam: 300, minutenProAnrufTeam: 2, uebernommenProzent: 100, restaufwandProzent: 0, stundenkostenEur: 50 }));
    expect(r.zeit.nettoStundenProMonat).toBeCloseTo(10, 10);
    expect(r.zeit.zeitwertEur).toBeCloseTo(500, 10);
    // Vorher: (500 − 339) = +161 €/Monat und 9,3 Monate „hereingeholt".
    expect(r.cash.saldoProMonatEur).toBeLessThan(0);
    expect(r.cash.amortisationMonate).toBeNull();
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
    expect(r.cash.amortisationMonate).toBeNull();
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
    expect(r.cash.saldoProMonatEur).toBeCloseTo(-339, 10);
  });

  it("600 € entfallender Telefonservice: Saldo 261 €, Erstjahr 1.642 €, Amortisation 5,7 Monate", () => {
    const r = berechneNutzen(PREIS, mitKosten(600));
    expect(r.cash.saldoProMonatEur).toBeCloseTo(261, 10);
    expect(r.cash.ersteJahrSaldoEur).toBeCloseTo(261 * 12 - 1490, 10);
    expect(r.cash.amortisationMonate).toBeCloseTo(1490 / 261, 10);
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
    expect(r.cash.saldoProMonatEur).toBeCloseTo(-339, 10);
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
    expect(r.cash.saldoProMonatEur).toBeCloseTo(-339, 10);
  });

  it("erzeugt keine Fälle aus Anrufversuchen — es gibt kein Feld für verpasste Anrufe", () => {
    const r = berechneNutzen(PREIS, mitTerminen({ zusaetzlicheTermine: 5, deckungsbeitragEur: 40, freieKapazitaet: 8 }));
    expect(Object.keys(NICHTS.termine)).not.toContain("verpassteAnrufeProMonat");
    expect(r.termine.realisierbarEur).toBe(200);
  });
});

describe("Geldsaldo — nur Geld, nur bekannte Kosten", () => {
  it("Fixture: 600 € Ersparnis + 5 × 40 € realisierbar − 339 € = 461 €/Monat; 4.042 €/Jahr; 3,23 Monate", () => {
    const r = berechneNutzen(PREIS, {
      zeit: NICHTS.zeit,
      kosten: { aktiv: true, entfallendeAusgabenEur: 600 },
      termine: { aktiv: true, zusaetzlicheTermine: 5, deckungsbeitragEur: 40, freieKapazitaet: 8 },
    });
    expect(r.vollstaendig).toBe(true);
    expect(r.cash.saldoProMonatEur).toBeCloseTo(461, 10);
    expect(r.cash.ersteJahrSaldoEur).toBeCloseTo(4042, 10);
    expect(r.cash.amortisationMonate).toBeCloseTo(1490 / 461, 4);
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
    expect(r.cash.ersteJahrSaldoEur).toBe(UNVOLLSTAENDIG);
    expect(r.cash.amortisationMonate).toBeNull();
  });

  it("ein unvollständiger aktiver Baustein blockiert den Saldo, auch wenn ein anderer vollständig ist", () => {
    const r = berechneNutzen(PREIS, mitKosten(600, { termine: { aktiv: true, zusaetzlicheTermine: 5, deckungsbeitragEur: null, freieKapazitaet: 8 } }));
    expect(r.kosten.status).toBe("ok");
    expect(r.termine.status).toBe("unvollstaendig");
    expect(r.cash.saldoProMonatEur).toBe(UNVOLLSTAENDIG);
  });

  it("Saldo ≤ 0: keine Amortisation, negativer Wert sichtbar", () => {
    const r = berechneNutzen(PREIS, mitKosten(100));
    expect(r.cash.saldoProMonatEur).toBeCloseTo(-239, 10);
    expect(r.cash.ersteJahrSaldoEur).toBeLessThan(0);
    expect(r.cash.amortisationMonate).toBeNull();
    const exakt = berechneNutzen(PREIS, mitKosten(339));
    expect(exakt.cash.saldoProMonatEur).toBeCloseTo(0, 10);
    expect(exakt.cash.amortisationMonate).toBeNull();
  });

  it("ohne bezifferbaren Preis (individuell, offene Sprachen, Spanne) gibt es keinen Saldo", () => {
    const riesig = { anrufeProMonat: 5000, minutenProAnruf: 5 };
    expect(berechneNutzen(berechnePreis(riesig, 0), mitKosten(600)).cash.saldoProMonatEur).toBe(UNBEKANNT);
    expect(berechneNutzen(berechnePreis(VOLUMEN, 3), mitKosten(600)).cash.saldoProMonatEur).toBe(UNBEKANNT);
    const spanne = berechnePreis({ anrufeProMonat: 1012, minutenProAnruf: 1 }, 1);
    expect(spanne.monatlichSpanne).not.toBeNull();
    expect(berechneNutzen(spanne, mitKosten(600)).cash.saldoProMonatEur).toBe(UNBEKANNT);
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
          expect(r.cash.amortisationMonate).toBeNull();
        }
      }
    }
  });
});
