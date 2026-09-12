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
  berechnePreis,
  berechneWirtschaftlichkeit,
  kapazitaetsEingabe,
  personalkostenEingabe,
  minutenProMonat,
  sprachenAufschlagEur,
  waehleSzenario,
  OFFEN,
  type ChancenEingabe,
} from "./telefonassistent-rechner";

const [BASIS, PRAXIS, MVZ] = TARIFE;

/** Keine Chancenangaben — die Rechnung bleibt damit UNVOLLSTÄNDIG. Nicht zu
 *  verwechseln mit `KEINE_VERPASSTEN`: dort hat der Besucher geantwortet. */
const KEINE_CHANCEN: ChancenEingabe = {
  verpassteAnrufeProMonat: null,
  davonChancenProzent: null,
  abschlussquoteProzent: null,
  deckungsbeitragEur: null,
  rueckgewinnbarProzent: null,
};

/** Der Besucher gibt an, keine relevanten Anrufe zu verpassen. Das ist eine
 *  VOLLSTÄNDIGE Antwort — Chancenwert 0, Rechnung rechenbar. */
const KEINE_VERPASSTEN: ChancenEingabe = { ...KEINE_CHANCEN, verpassteAnrufeProMonat: 0 };

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

describe("Wirtschaftlichkeit", () => {
  const volumen = { anrufeProMonat: 300, minutenProAnruf: 2 };
  const preis = berechnePreis(volumen, 0);

  it("rechnet nichts ohne Stundensatz des Nutzers", () => {
    const r = berechneWirtschaftlichkeit(
      volumen,
      preis,
      kapazitaetsEingabe(null, 30),
      KEINE_CHANCEN
    );
    expect(r.arbeitsnutzenRechenbar).toBe(false);
    expect(r.zeitwertProMonatEur).toBeNull();
    expect(r.amortisationMonate).toBeNull();
  });

  it("rechnet Telefonstunden und Zeitwert nachvollziehbar", () => {
    const r = berechneWirtschaftlichkeit(
      volumen,
      preis,
      kapazitaetsEingabe(30, 50),
      KEINE_CHANCEN
    );
    expect(r.telefonstundenProMonat).toBeCloseTo((300 * 2) / 60, 10); // 10 h
    expect(r.routinestundenProMonat).toBeCloseTo(5, 10);
    expect(r.zeitwertProMonatEur).toBeCloseTo(150, 10);
  });

  it("zieht die Cogniiq-Kosten ab und lässt die Einrichtung im ersten Jahr stehen", () => {
    const r = berechneWirtschaftlichkeit(
      volumen,
      preis,
      kapazitaetsEingabe(200, 50),
      KEINE_VERPASSTEN
    );
    const kosten = preis.monatlichGesamtEur as number;
    const einrichtung = preis.einrichtungEur as number;
    expect(r.nettoProMonatEur).toBeCloseTo(1000 - kosten, 10);
    expect(r.ersteJahrNettoEur).toBeCloseTo(1000 * 12 - (kosten * 12 + einrichtung), 10);
  });

  it("weist keine Amortisation aus, wenn der Nettoeffekt nicht positiv ist", () => {
    const r = berechneWirtschaftlichkeit(
      volumen,
      preis,
      kapazitaetsEingabe(10, 10),
      KEINE_VERPASSTEN
    );
    expect(r.nettoProMonatEur).toBeLessThan(0);
    expect(r.amortisationMonate).toBeNull();
  });

  it("Automatisierungsanteil 0 % ergibt keinen Zeitwert", () => {
    const r = berechneWirtschaftlichkeit(
      volumen,
      preis,
      kapazitaetsEingabe(50, 0),
      KEINE_CHANCEN
    );
    expect(r.zeitwertProMonatEur).toBe(0);
  });

  it("Anteile über 100 % werden geklemmt statt hochgerechnet", () => {
    const r = berechneWirtschaftlichkeit(
      volumen,
      preis,
      kapazitaetsEingabe(50, 400),
      KEINE_CHANCEN
    );
    expect(r.routinestundenProMonat).toBeCloseTo(r.telefonstundenProMonat, 10);
  });

  it("im individuellen Preismodus bleibt der Nettoeffekt unbekannt", () => {
    const gross = { anrufeProMonat: 5000, minutenProAnruf: 4 };
    const r = berechneWirtschaftlichkeit(
      gross,
      berechnePreis(gross, 0),
      kapazitaetsEingabe(50, 30),
      KEINE_CHANCEN
    );
    expect(r.nettoProMonatEur).toBe(UNBEKANNT);
    expect(r.ersteJahrNettoEur).toBe(UNBEKANNT);
    expect(r.amortisationMonate).toBeNull();
  });
});

describe("Optionale Chancenrechnung", () => {
  const volumen = { anrufeProMonat: 300, minutenProAnruf: 2 };
  const preis = berechnePreis(volumen, 0);
  const basis = kapazitaetsEingabe(40, 30);

  it("bleibt leer, solange ein einziges Feld fehlt", () => {
    const teil: ChancenEingabe = {
      verpassteAnrufeProMonat: 40,
      davonChancenProzent: 50,
      abschlussquoteProzent: 30,
      deckungsbeitragEur: 200,
      rueckgewinnbarProzent: null,
    };
    const r = berechneWirtschaftlichkeit(volumen, preis, basis, teil);
    expect(r.chancenwertProMonatEur).toBeNull();
  });

  it("rechnet die Kette erst, wenn der Nutzer alle Angaben gemacht hat", () => {
    const voll: ChancenEingabe = {
      verpassteAnrufeProMonat: 40,
      davonChancenProzent: 50,
      abschlussquoteProzent: 30,
      deckungsbeitragEur: 200,
      rueckgewinnbarProzent: 50,
    };
    const r = berechneWirtschaftlichkeit(volumen, preis, basis, voll);
    // 40 × 0,5 × 0,3 × 200 € × 0,5 = 600 €
    expect(r.chancenwertProMonatEur).toBeCloseTo(600, 10);
  });

  it("fließt in den Nettoeffekt ein, sobald sie gerechnet wird", () => {
    const voll: ChancenEingabe = {
      verpassteAnrufeProMonat: 40,
      davonChancenProzent: 50,
      abschlussquoteProzent: 30,
      deckungsbeitragEur: 200,
      rueckgewinnbarProzent: 50,
    };
    const ohne = berechneWirtschaftlichkeit(volumen, preis, basis, KEINE_VERPASSTEN);
    const mit = berechneWirtschaftlichkeit(volumen, preis, basis, voll);
    expect((mit.nettoProMonatEur as number) - (ohne.nettoProMonatEur as number)).toBeCloseTo(600, 10);
  });

  it("null verpasste Anrufe ergeben null Chancenwert, nicht null Ergebnis", () => {
    const keine: ChancenEingabe = {
      verpassteAnrufeProMonat: 0,
      davonChancenProzent: 50,
      abschlussquoteProzent: 30,
      deckungsbeitragEur: 200,
      rueckgewinnbarProzent: 50,
    };
    const r = berechneWirtschaftlichkeit(volumen, preis, basis, keine);
    expect(r.chancenwertProMonatEur).toBe(0);
  });
});

/* ───────────────────────────────────────────────────────────────────────────
   DIE ZWEI PERSONALLESARTEN — Korrektur vom 12.09.2026.

   Der alte Rechner kannte nur „Telefonstunden × Stundensatz". Diese Rechnung
   ist mathematisch korrekt und beantwortet trotzdem nur eine von zwei Fragen:
   Sie bewertet freigesetzte ZEIT. Wo Cogniiq eine Stelle tatsächlich
   überflüssig macht oder eine Einstellung vermeidet, ist die Ersparnis der
   Wegfall einer Personalposition — und die hängt am Dienstplan, nicht an der
   Sprechzeit.

   Was hier geprüft wird, ist vor allem die Grenze zwischen den beiden: Sie
   bewerten DIESELBE Arbeitskapazität und dürfen deshalb nie zusammen in einer
   Summe stehen.
   ────────────────────────────────────────────────────────────────────────── */
describe("Personallesart A — Kapazität (die Person bleibt)", () => {
  const volumen = { anrufeProMonat: 300, minutenProAnruf: 2 }; // 600 Min. = 10 Std.
  const preis = berechnePreis(volumen, 0);

  it("bewertet 10 Routinestunden × 35 €/h mit 350 €", () => {
    // 10 Telefonstunden × 100 % Routineanteil = 10 Routinestunden.
    const r = berechneWirtschaftlichkeit(
      volumen,
      preis,
      kapazitaetsEingabe(35, 100),
      KEINE_VERPASSTEN
    );
    expect(r.telefonstundenProMonat).toBeCloseTo(10, 10);
    expect(r.routinestundenProMonat).toBeCloseTo(10, 10);
    expect(r.zeitwertProMonatEur).toBeCloseTo(350, 10);
    expect(r.arbeitsnutzenProMonatEur).toBeCloseTo(350, 10);
    // Die Personallesart B ist in diesem Modus nicht bloß 0, sondern NICHT DA.
    expect(r.personalersparnisProMonatEur).toBeNull();
    expect(r.personalModus).toBe("kapazitaet");
  });

  it("meldet den Modus im Ergebnis, damit die Oberfläche richtig beschriftet", () => {
    const r = berechneWirtschaftlichkeit(
      volumen,
      preis,
      kapazitaetsEingabe(35, 100),
      KEINE_VERPASSTEN
    );
    expect(r.personalModus).toBe("kapazitaet");
  });
});

describe("Personallesart B — tatsächlich vermeidbare Personalkosten", () => {
  const volumen = { anrufeProMonat: 300, minutenProAnruf: 2 };
  const preis = berechnePreis(volumen, 0);
  const modusB = (kosten: number | null, anteil: number | null) =>
    berechneWirtschaftlichkeit(volumen, preis, personalkostenEingabe(kosten, anteil), KEINE_VERPASSTEN);

  it("4.000 € Vollkosten × 75 % vermeidbar = 3.000 €", () => {
    const r = modusB(4000, 75);
    expect(r.personalersparnisProMonatEur).toBeCloseTo(3000, 10);
    expect(r.arbeitsnutzenProMonatEur).toBeCloseTo(3000, 10);
    expect(r.personalModus).toBe("personalkosten");
  });

  it("vollständiger Wegfall der Position: 4.000 € × 100 % = 4.000 €", () => {
    expect(modusB(4000, 100).personalersparnisProMonatEur).toBeCloseTo(4000, 10);
  });

  it("keine vermeidbare Lohnsumme: 4.000 € × 0 % = 0 € — und das ist VOLLSTÄNDIG", () => {
    const r = modusB(4000, 0);
    expect(r.personalersparnisProMonatEur).toBe(0);
    expect(r.arbeitsnutzenRechenbar).toBe(true);
    // Eine 0 aus einer Angabe ist ein Ergebnis, kein fehlendes Feld — genau
    // wie „0 verpasste Anrufe". Die Rechnung ist damit vollständig, und ein
    // danach negatives Gesamtergebnis ist die Wahrheit für diesen Betrieb.
    expect(r.vollstaendig).toBe(true);
    expect(typeof r.nettoProMonatEur).toBe("number");
  });

  it("verteilt KEINE Vollkosten auf Telefonminuten — das Anrufaufkommen ändert die Ersparnis nicht", () => {
    /*
      Der eigentliche Inhalt dieser Lesart: Die Empfangskraft wird für ihren
      Dienstplan bezahlt. Verdoppelt sich das Anrufaufkommen, ändert das den
      Cogniiq-Preis — aber nicht die Lohnsumme, die wegfällt.
    */
    const wenig = { anrufeProMonat: 100, minutenProAnruf: 2 };
    const viel = { anrufeProMonat: 400, minutenProAnruf: 2 };
    const a = berechneWirtschaftlichkeit(
      wenig,
      berechnePreis(wenig, 0),
      personalkostenEingabe(4000, 75),
      KEINE_VERPASSTEN
    );
    const b = berechneWirtschaftlichkeit(
      viel,
      berechnePreis(viel, 0),
      personalkostenEingabe(4000, 75),
      KEINE_VERPASSTEN
    );
    expect(a.personalersparnisProMonatEur).toBeCloseTo(3000, 10);
    expect(b.personalersparnisProMonatEur).toBeCloseTo(3000, 10);
  });

  it("ohne Monatsvollkosten: unvollständig, kein Gesamtergebnis", () => {
    const r = modusB(null, 75);
    expect(r.arbeitsnutzenRechenbar).toBe(false);
    expect(r.vollstaendig).toBe(false);
    expect(r.fehlendeAngaben).toContain("personalkostenMonat");
    expect(typeof r.nettoProMonatEur).not.toBe("number");
    expect(typeof r.ersteJahrNettoEur).not.toBe("number");
    expect(r.amortisationMonate).toBeNull();
  });

  it("ohne vermeidbaren Anteil: unvollständig, kein Gesamtergebnis", () => {
    const r = modusB(4000, null);
    expect(r.arbeitsnutzenRechenbar).toBe(false);
    expect(r.vollstaendig).toBe(false);
    expect(r.fehlendeAngaben).toContain("vermeidbarerAnteil");
    expect(typeof r.nettoProMonatEur).not.toBe("number");
  });

  it("verlangt in diesem Modus KEINEN Stundensatz und KEINEN Routineanteil", () => {
    // Die Mode-A-Felder dürfen die Vollständigkeit hier nicht blockieren.
    const r = modusB(4000, 75);
    expect(r.fehlendeAngaben).not.toContain("stundenkosten");
    expect(r.fehlendeAngaben).not.toContain("routineanteil");
    expect(r.vollstaendig).toBe(true);
  });
});

describe("Keine Doppelzählung der Arbeitskapazität", () => {
  const volumen = { anrufeProMonat: 300, minutenProAnruf: 2 };
  const preis = berechnePreis(volumen, 0);

  it("Modus B addiert den Zeitwert NICHT dazu", () => {
    const r = berechneWirtschaftlichkeit(
      volumen,
      preis,
      personalkostenEingabe(4000, 75),
      KEINE_VERPASSTEN
    );
    // 3.000 € — nicht 3.000 € + 350 €.
    expect(r.arbeitsnutzenProMonatEur).toBeCloseTo(3000, 10);
    expect(r.zeitwertProMonatEur).toBeNull();
  });

  it("Modus A addiert die Personalersparnis NICHT dazu", () => {
    const r = berechneWirtschaftlichkeit(
      volumen,
      preis,
      kapazitaetsEingabe(35, 100),
      KEINE_VERPASSTEN
    );
    expect(r.arbeitsnutzenProMonatEur).toBeCloseTo(350, 10);
    expect(r.personalersparnisProMonatEur).toBeNull();
  });

  it("der Konstruktor macht es unmöglich, Felder beider Modi zu füllen", () => {
    /*
      Die strukturelle Absicherung: Nicht die Oberfläche entscheidet, was in
      die Summe geht. Die Konstruktoren nullen die Felder des jeweils anderen
      Modus — ein Aufrufer KANN nicht beide Lesarten gleichzeitig befüllen.
    */
    const a = kapazitaetsEingabe(35, 100);
    expect(a.personalkostenProMonatEur).toBeNull();
    expect(a.vermeidbarerAnteilProzent).toBeNull();
    const b = personalkostenEingabe(4000, 75);
    expect(b.stundenkostenEur).toBeNull();
    expect(b.routineanteilProzent).toBeNull();
  });

  it("in beiden Modi gilt: Nutzen = genau ein Arbeitsposten + Chancenwert", () => {
    const chancen = {
      verpassteAnrufeProMonat: 40,
      davonChancenProzent: 50,
      abschlussquoteProzent: 50,
      deckungsbeitragEur: 100,
      rueckgewinnbarProzent: 50,
    };
    // 40 × 0,5 × 0,5 × 100 € × 0,5 = 500 €
    const chancenwert = 500;
    const volumen2 = { anrufeProMonat: 300, minutenProAnruf: 2 };
    const preis2 = berechnePreis(volumen2, 0);
    const kosten = preis2.monatlichGesamtEur as number;

    const a = berechneWirtschaftlichkeit(volumen2, preis2, kapazitaetsEingabe(35, 100), chancen);
    expect(a.chancenwertProMonatEur).toBeCloseTo(chancenwert, 10);
    expect(a.nettoProMonatEur as number).toBeCloseTo(350 + chancenwert - kosten, 10);

    const b = berechneWirtschaftlichkeit(volumen2, preis2, personalkostenEingabe(4000, 75), chancen);
    expect(b.chancenwertProMonatEur).toBeCloseTo(chancenwert, 10);
    expect(b.nettoProMonatEur as number).toBeCloseTo(3000 + chancenwert - kosten, 10);
  });
});
