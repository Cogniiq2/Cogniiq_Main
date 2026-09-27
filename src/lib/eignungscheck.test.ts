import { describe, expect, it } from "vitest";

import { WOCHEN_PRO_MONAT } from "@/lib/zeitrechnung";
import {
  ANLAESSE,
  ANLASS_IDS,
  LEERE_EINGABE,
  SCHWELLEN,
  ergebnisAlsText,
  fehlendeAngaben,
  gesamtbildAus,
  pruefeEignung,
  routinePunkte,
  type BereichsErgebnis,
  type EignungsEingabe,
} from "@/lib/eignungscheck";

/** Eine vollständige, unauffällige Eingabe: alles trägt. */
const GEEIGNET: EignungsEingabe = {
  ...LEERE_EINGABE,
  anrufeProWoche: 120,
  minutenProAnruf: 2,
  erreichbarkeit: "stosszeiten",
  stosszeiten: true,
  anlaesse: { ...LEERE_EINGABE.anlaesse, termin: "haeufig", auskunft: "gelegentlich" },
  uebernahmeMoeglich: "ja",
  terminregeln: "ja",
  freigabePerson: "ja",
  terminsystem: "keins",
  gesundheitsdaten: "nein",
};

function signal(e: EignungsEingabe, bereich: BereichsErgebnis["bereich"]) {
  return pruefeEignung(e).bereiche.find((b) => b.bereich === bereich)!.signal;
}

describe("Vollständigkeit", () => {
  it("liefert ohne Angaben kein Gesamtbild, sondern die Liste der fehlenden Felder", () => {
    const r = pruefeEignung(LEERE_EINGABE);
    expect(r.vollstaendig).toBe(false);
    expect(r.gesamtbild).toBeNull();
    expect(r.fehlendeAngaben).toEqual([
      "anrufeProWoche",
      "erreichbarkeit",
      "anlaesse",
      "uebernahmeMoeglich",
      "freigabePerson",
      "terminsystem",
      "gesundheitsdaten",
    ]);
  });

  it("fragt nach Terminregeln nur, wenn Termine überhaupt vorkommen", () => {
    expect(fehlendeAngaben({ ...GEEIGNET, terminregeln: null })).toEqual(["terminregeln"]);
    expect(
      fehlendeAngaben({
        ...GEEIGNET,
        terminregeln: null,
        anlaesse: { ...GEEIGNET.anlaesse, termin: "nie", rueckruf: "haeufig" },
      })
    ).toEqual([]);
  });

  it("zählt einen einzigen gesetzten Anlass als vollständig", () => {
    const nurEiner = { ...GEEIGNET.anlaesse };
    for (const id of ANLASS_IDS) nurEiner[id] = "nie";
    nurEiner.beschwerde = "selten";
    expect(fehlendeAngaben({ ...GEEIGNET, anlaesse: nurEiner })).toEqual([]);
  });

  it("gibt bei vollständiger Eingabe ein Gesamtbild aus", () => {
    const r = pruefeEignung(GEEIGNET);
    expect(r.vollstaendig).toBe(true);
    expect(r.gesamtbild).toBe("geeignet");
    expect(r.vorbereitung).toEqual([]);
  });
});

describe("Anrufsituation", () => {
  it("hält nicht bei geringem Aufkommen und erreichbarem Team", () => {
    const e = { ...GEEIGNET, anrufeProWoche: SCHWELLEN.geringesAufkommenProWoche - 1, erreichbarkeit: "kaum" as const };
    expect(signal(e, "bedarf")).toBe("haelt-nicht");
    expect(pruefeEignung(e).gesamtbild).toBe("abraten");
  });

  it("ist offen bei hohem Aufkommen ohne verlorene Anrufe — Entlastung statt Erreichbarkeit", () => {
    const e = { ...GEEIGNET, anrufeProWoche: SCHWELLEN.geringesAufkommenProWoche, erreichbarkeit: "kaum" as const };
    expect(signal(e, "bedarf")).toBe("offen");
  });

  it("ist offen, wenn die Zahl verlorener Anrufe unbekannt ist, und verlangt eine Zählung", () => {
    const r = pruefeEignung({ ...GEEIGNET, erreichbarkeit: "unbekannt" });
    expect(r.bereiche[0].signal).toBe("offen");
    expect(r.vorbereitung.join(" ")).toMatch(/Eine Woche lang zählen/);
  });

  it("trägt bei regelmäßig oder zu Stoßzeiten verlorenen Anrufen", () => {
    expect(signal({ ...GEEIGNET, erreichbarkeit: "regelmaessig" }, "bedarf")).toBe("traegt");
    expect(signal({ ...GEEIGNET, erreichbarkeit: "stosszeiten" }, "bedarf")).toBe("traegt");
  });

  it("verspricht bei Stoßzeiten Entlastung, nie die vollständige Übernahme", () => {
    const b = pruefeEignung(GEEIGNET).bereiche[0];
    expect(b.begruendung).toMatch(/nicht die vollständige Übernahme/);
  });
});

describe("Anrufanlässe", () => {
  it("gewichtet nur Routineanlässe: häufig zählt doppelt, selten und nie gar nicht", () => {
    expect(routinePunkte({ ...LEERE_EINGABE.anlaesse, termin: "haeufig" })).toBe(2);
    expect(routinePunkte({ ...LEERE_EINGABE.anlaesse, termin: "gelegentlich", auskunft: "selten" })).toBe(1);
    expect(routinePunkte({ ...LEERE_EINGABE.anlaesse, beschwerde: "haeufig", notfall: "haeufig" })).toBe(0);
  });

  it("hält nicht, wenn ausschließlich Anlässe vorkommen, die beim Menschen bleiben", () => {
    const e = { ...GEEIGNET, anlaesse: { ...LEERE_EINGABE.anlaesse, beschwerde: "haeufig" as const } };
    expect(signal(e, "anlaesse")).toBe("haelt-nicht");
    expect(pruefeEignung(e).uebernehmbar).toEqual([]);
    expect(pruefeEignung(e).bleibtBeimTeam.map((a) => a.id)).toEqual(["beschwerde"]);
  });

  it("ist offen bei kleinem Routineanteil", () => {
    const e = { ...GEEIGNET, anlaesse: { ...LEERE_EINGABE.anlaesse, rueckruf: "gelegentlich" as const } };
    expect(signal(e, "anlaesse")).toBe("offen");
  });

  it("nennt häufige Menschen-Anlässe als Hinweis, ohne das Signal zu kippen", () => {
    const e = { ...GEEIGNET, anlaesse: { ...GEEIGNET.anlaesse, notfall: "haeufig" as const } };
    const b = pruefeEignung(e).bereiche[1];
    expect(b.signal).toBe("traegt");
    expect(b.begruendung).toMatch(/dringende fälle und notfälle/i);
    expect(b.vorbereitung).toHaveLength(1);
  });

  it("teilt jeden Anlass genau einer Klasse zu", () => {
    for (const a of ANLAESSE) expect(["routine", "mensch"]).toContain(a.klasse);
    expect(ANLAESSE.filter((a) => a.klasse === "routine")).toHaveLength(4);
    expect(ANLAESSE.filter((a) => a.klasse === "mensch")).toHaveLength(4);
  });
});

describe("Team und Übergabe", () => {
  it("ist nie „hält nicht“: jede Lücke ist eine Vorbereitung, kein Ausschluss", () => {
    const e = { ...GEEIGNET, uebernahmeMoeglich: "nein" as const, terminregeln: "nein" as const, freigabePerson: "nein" as const };
    const b = pruefeEignung(e).bereiche[2];
    expect(b.signal).toBe("offen");
    expect(b.vorbereitung).toHaveLength(3);
  });

  it("ignoriert Terminregeln, wenn Termine nicht vorkommen", () => {
    const e = {
      ...GEEIGNET,
      terminregeln: "nein" as const,
      anlaesse: { ...LEERE_EINGABE.anlaesse, auskunft: "haeufig" as const, rueckruf: "haeufig" as const },
    };
    expect(signal(e, "team")).toBe("traegt");
  });

  it("verlangt bei fehlenden Terminregeln die Vorlage zur Bestätigung statt einer Vergabe", () => {
    const b = pruefeEignung({ ...GEEIGNET, terminregeln: "nein" }).bereiche[2];
    expect(b.begruendung).toMatch(/zur Bestätigung vorlegen/);
  });
});

describe("Systeme und Daten", () => {
  it("verspricht bei bekannter Schnittstelle keine Anbindung, sondern eine Prüfung", () => {
    const b = pruefeEignung({ ...GEEIGNET, terminsystem: "software-schnittstelle" }).bereiche[3];
    expect(b.signal).toBe("offen");
    expect(b.begruendung).toMatch(/Eine Zusage vorab gibt es nicht/);
  });

  it("trägt ohne Software und ohne Gesundheitsdaten", () => {
    expect(signal(GEEIGNET, "systeme")).toBe("traegt");
  });

  it("holt bei Gesundheitsdaten den Datenschutzbeauftragten an den Tisch, entscheidet die DSFA aber nicht", () => {
    const b = pruefeEignung({ ...GEEIGNET, gesundheitsdaten: "ja" }).bereiche[3];
    expect(b.signal).toBe("offen");
    expect(b.begruendung).toMatch(/nicht vom Anbieter/);
  });

  it("dedupliziert gleiche Vorbereitungspunkte", () => {
    const r = pruefeEignung({ ...GEEIGNET, terminsystem: "unbekannt" });
    const treffer = r.vorbereitung.filter((v) => /Terminsoftware/.test(v));
    expect(treffer).toHaveLength(1);
  });
});

describe("Erwartungen", () => {
  it.each(["ohneTeam", "kiVerbergen", "anbindungVorab", "wortlaut", "fachauskunft"] as const)(
    "%s führt allein zum Abraten",
    (id) => {
      const e = { ...GEEIGNET, erwartungen: { ...GEEIGNET.erwartungen, [id]: true } };
      expect(signal(e, "erwartungen")).toBe("haelt-nicht");
      expect(pruefeEignung(e).gesamtbild).toBe("abraten");
    }
  );

  it("nennt die Transparenzpflicht beim Verbergen der KI", () => {
    const e = { ...GEEIGNET, erwartungen: { ...GEEIGNET.erwartungen, kiVerbergen: true } };
    expect(pruefeEignung(e).bereiche[4].begruendung).toMatch(/Art\. 50/);
  });
});

describe("Gesamtbild", () => {
  const b = (signal: BereichsErgebnis["signal"]): BereichsErgebnis => ({
    bereich: "bedarf",
    titel: "",
    signal,
    begruendung: "",
    vorbereitung: [],
  });

  it("folgt der veröffentlichten Regel", () => {
    expect(gesamtbildAus([b("traegt"), b("traegt")])).toBe("geeignet");
    expect(gesamtbildAus([b("offen"), b("traegt")])).toBe("offene-punkte");
    expect(gesamtbildAus([b("offen"), b("offen")])).toBe("offene-punkte");
    expect(gesamtbildAus([b("offen"), b("offen"), b("offen")])).toBe("erst-klaeren");
    expect(gesamtbildAus([b("haelt-nicht"), b("traegt"), b("traegt")])).toBe("abraten");
    expect(gesamtbildAus([b("haelt-nicht"), b("offen"), b("offen"), b("offen")])).toBe("abraten");
  });

  it("kommt bei drei offenen Bereichen auf „erst klären“", () => {
    const e = { ...GEEIGNET, erreichbarkeit: "unbekannt" as const, terminregeln: "teilweise" as const, gesundheitsdaten: "ja" as const };
    expect(pruefeEignung(e).gesamtbild).toBe("erst-klaeren");
  });
});

describe("Rechnerische Größen", () => {
  it("rechnet Woche → Monat über genau die Umrechnung aus zeitrechnung.ts", () => {
    const r = pruefeEignung(GEEIGNET);
    expect(r.anrufeProMonat).toBe(Math.round(120 * WOCHEN_PRO_MONAT));
    expect(r.minutenProMonat).toBe(Math.round(120 * WOCHEN_PRO_MONAT) * 2);
  });

  it("lässt die Minuten leer, wenn keine Dauer angegeben ist", () => {
    expect(pruefeEignung({ ...GEEIGNET, minutenProAnruf: null }).minutenProMonat).toBeNull();
  });

  it("verträgt negative Eingaben, ohne negative Ergebnisse zu liefern", () => {
    const r = pruefeEignung({ ...GEEIGNET, anrufeProWoche: -5, minutenProAnruf: -1 });
    expect(r.anrufeProMonat).toBe(0);
    expect(r.minutenProMonat).toBe(0);
  });
});

describe("Klartext", () => {
  it("enthält nur eigene Angaben, Signale, Listen und die Quelle", () => {
    const r = pruefeEignung(GEEIGNET);
    const t = ergebnisAlsText(GEEIGNET, r, "https://example.test/check");
    expect(t).toMatch(/^Eignungscheck KI-Telefonassistent/);
    expect(t).toMatch(/Gesamtbild: Nach Ihren Angaben geeignet/);
    expect(t).toMatch(/Anrufe pro Woche \(Ihre Angabe\): 120/);
    expect(t).toMatch(/Anrufsituation: trägt/);
    expect(t).toMatch(/Könnte der Assistent übernehmen:/);
    expect(t).toMatch(/Quelle: https:\/\/example\.test\/check$/);
    // Keine Prozentzahl, keine Ersparnis — das Werkzeug beziffert beides nicht.
    expect(t).not.toMatch(/%|Ersparnis|€/);
  });

  it("weist ein unvollständiges Ergebnis als solches aus", () => {
    const t = ergebnisAlsText(LEERE_EINGABE, pruefeEignung(LEERE_EINGABE), "x");
    expect(t).toMatch(/Gesamtbild: noch unvollständig/);
  });
});
