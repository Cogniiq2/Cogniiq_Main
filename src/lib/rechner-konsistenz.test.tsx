// ─────────────────────────────────────────────────────────────────────────────
// KONSISTENZWACHE FÜR ALLE ÖFFENTLICHEN RECHNER.
//
// Warum es diese Datei gibt. Vor dem 11.09.2026 standen auf der Website vier
// Stellen, die Geld ausrechneten, und sie widersprachen einander:
//
//   • `CostComparisonSection` behauptete einen Festpreis von 297 € im Monat.
//     Der steht in keiner Tarifliste; die Tarife beginnen bei 300 € und richten
//     sich nach dem Minutenkontingent.
//   • `ROICalculator` und `CostComparisonSection` rechneten mit 4,3 Wochen je
//     Monat, der Praxis-Rechner mit 4,33. Gleiche Eingabe, zwei Ergebnisse.
//   • `PraxisRechnerWidget` hatte eine eigene Tarifrechnung samt eigenem
//     Mehrpreis je Minute und parste dafür die ANZEIGESTRINGS der Preisseite
//     zurück in Zahlen.
//   • Derselbe Rechner setzte 20 % als „Automatisierungsgrad" voreingestellt —
//     eine Aussage über das eigene Produkt, die es weit unter Wert verkauft.
//
// Jede dieser Abweichungen war für sich plausibel begründbar und in Summe ein
// Glaubwürdigkeitsproblem: Ein Besucher, der zwei Seiten öffnet, findet den
// Widerspruch in unter einer Minute.
//
// Diese Suite prüft deshalb ZWEIERLEI, und beides ist nötig:
//   1. ARITHMETIK — gleiche Eingabe, gleiches Ergebnis, über alle Fassungen.
//      Ein Test, der nur gerenderten Text liest, hätte 297 € nie gefunden.
//   2. QUELLTEXT — dass kein Bauteil einen Betrag oder einen Vorgabewert erneut
//      tippt. Arithmetik allein fängt eine neu eingeführte Konstante erst, wenn
//      jemand zufällig genau den Fall testet, in dem sie auffällt.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

import { FAKTEN, SPRACHEN_PREISE, TARIFE } from '@/lib/telefonassistent-copy';
import { RECHNER_ANKER, RECHNER_LINK, RECHNER_ROUTE } from '@/lib/rechner-anker';
import {
  WOCHEN_PRO_MONAT,
  anrufeProMonatAusWoche,
  berechnePreis,
  berechneWirtschaftlichkeit,
  minutenProMonat,
  UNVOLLSTAENDIG,
  waehleSzenario,
} from '@/lib/telefonassistent-rechner';

const REPO_ROOT = process.cwd();

function sammle(dir: string, out: Map<string, string> = new Map()): Map<string, string> {
  for (const eintrag of readdirSync(dir)) {
    if (eintrag === 'node_modules' || eintrag === '.git') continue;
    const voll = join(dir, eintrag);
    if (statSync(voll).isDirectory()) {
      sammle(voll, out);
      continue;
    }
    if (!/\.tsx?$/.test(eintrag)) continue;
    out.set(relative(REPO_ROOT, voll).split(sep).join('/'), readFileSync(voll, 'utf8'));
  }
  return out;
}

const QUELLEN = sammle(join(REPO_ROOT, 'src'));

/*
  Kommentare werden vor jeder Quelltextprüfung entfernt — und zwar nicht aus
  Bequemlichkeit. Die Kommentare dieses Projekts erklären genau die Fehler, die
  hier verboten werden: „hier stand 297 €", „hier stand betragZuZahl". Würde die
  Prüfung sie mitlesen, wäre die Dokumentation eines behobenen Fehlers selbst
  ein Fehler — und der nächste Entwickler löschte die Erklärung, statt den Code
  zu verstehen.
*/
function nurCode(inhalt: string): string {
  return inhalt.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

/** Nur Produktionsquelltext — Tests dürfen Beträge nennen, sie prüfen sie ja. */
const PRODUKTION: Array<[string, string]> = [...QUELLEN]
  .filter(([pfad]) => !/\.test\.tsx?$/.test(pfad))
  .map(([pfad, inhalt]) => [pfad, nurCode(inhalt)]);

/** Die Dateien, in denen Beträge legitim als Literal stehen dürfen. */
const KANONISCHE_ZAHLENQUELLEN = new Set(['src/lib/telefonassistent-copy.ts']);

/**
 * Die eingefrorene Preisseite.
 *
 * `PraxisRechnerWidget` bedient nur noch dieses eine, laufende SEO-Experiment.
 * Seine Anzeige darf sich bis zum Ende der Messung nicht ändern — deshalb
 * überlebt dort der voreingestellte Automatisierungsgrad von 20 %. Seine
 * ARITHMETIK ist trotzdem vereinheitlicht, und genau das prüft diese Suite
 * weiter unten. Endet das Experiment, verschwindet die Ausnahme mit der Datei.
 */
const EINGEFROREN = 'src/components/PraxisRechnerWidget.tsx';

// ── 1 · Der Preis ist überall derselbe ──────────────────────────────────────

describe('Preis — eine Quelle, ein Ergebnis', () => {
  /*
    Die Fälle decken jede Kante der Tarifregel ab: unter dem Kontingent, exakt
    am Kontingent, im Mehrverbrauch, am Deckel des kleinsten Tarifs, im
    Tarifwechsel und jenseits der Liste.
  */
  const FAELLE: Array<[string, number, number]> = [
    ['leerer Warenkorb', 0, 0],
    ['weit unter dem Basiskontingent', 100, 2],
    ['exakt am Basiskontingent', 250, 2],
    ['knapp über dem Basiskontingent', 300, 2],
    ['im Praxis-Bereich', 600, 2],
    ['im MVZ-Bereich', 900, 2],
    ['jenseits der Tarifliste', 3000, 5],
  ];

  it.each(FAELLE)(
    '%s — Tarifwahl, Monatsbetrag und Einrichtung hängen nur an den Minuten',
    (_name, anrufe, dauer) => {
      const a = berechnePreis({ anrufeProMonat: anrufe, minutenProAnruf: dauer }, 0);
      // Dieselben Minuten, anders zusammengesetzt, müssen dasselbe ergeben:
      // Der Preis hängt am Minutenbedarf, nicht an der Zerlegung in Anrufe.
      const b = berechnePreis({ anrufeProMonat: anrufe * dauer, minutenProAnruf: 1 }, 0);
      expect(b).toEqual(a);
    }
  );

  it('leitet jeden Tarifbetrag aus TARIFE ab, nie aus einem eigenen Literal', () => {
    for (const tarif of TARIFE) {
      // Ein Aufkommen knapp unter dem Kontingent trifft diesen Tarif genau dann,
      // wenn kein kleinerer ihn unterbietet, ohne am Deckel zu laufen.
      const szenario = waehleSzenario(tarif.minuten);
      expect(szenario).not.toBeNull();
      expect(szenario!.telefonieMonatlichEur).toBeLessThanOrEqual(szenario!.tarif.obergrenzeEur);
      expect(TARIFE).toContain(szenario!.tarif);
    }
  });

  it('rechnet den Mehrverbrauch mit dem kanonischen Minutenpreis', () => {
    const einMinuteUeberBasis = TARIFE[0].minuten + 1;
    const szenario = waehleSzenario(einMinuteUeberBasis)!;
    // Basis ist bei einer Minute Mehrverbrauch noch der günstigste Tarif.
    expect(szenario.tarif.name).toBe(TARIFE[0].name);
    expect(szenario.mehrverbrauchEur).toBeCloseTo(FAKTEN.mehrpreisProMinuteEur, 10);
  });

  it('kippt jenseits der Tarifliste in den individuellen Modus statt in eine zu billige Zahl', () => {
    const groesster = TARIFE[TARIFE.length - 1];
    const weitDarueber =
      groesster.minuten +
      (groesster.obergrenzeEur - groesster.monatlichEur) / FAKTEN.mehrpreisProMinuteEur +
      1;
    expect(waehleSzenario(weitDarueber)).toBeNull();
    const preis = berechnePreis({ anrufeProMonat: weitDarueber, minutenProAnruf: 1 }, 0);
    expect(preis.modus).toBe('individuell');
    expect(preis.monatlichGesamtEur).toBe('unbekannt');
    expect(preis.einrichtungEur).toBe('unbekannt');
  });

  it('weist die Anbindung IMMER als unbekannt aus, nie als 0', () => {
    for (const [, anrufe, dauer] of FAELLE) {
      const preis = berechnePreis({ anrufeProMonat: anrufe, minutenProAnruf: dauer }, 0);
      expect(preis.anbindungEur).toBe('unbekannt');
      expect(preis.anbindungEur).not.toBe(0);
    }
  });

  it('beziffert den eindeutigen Sprachaufschlag aus SPRACHEN_PREISE', () => {
    const basis = { anrufeProMonat: 200, minutenProAnruf: 2 };
    expect(berechnePreis(basis, 0).sprachenMonatlichEur).toBe(0);
    expect(berechnePreis(basis, 1).sprachenMonatlichEur).toBe(SPRACHEN_PREISE.proSpracheEur);
  });

  it('lässt den mehrdeutigen Paketpreis offen statt ihn abzuleiten', () => {
    /*
      „Ab drei Sprachen 230 € für bis zu fünf Sprachen" legt nicht fest, ob
      Deutsch mitzählt. Aus wirtschaftlicher Plausibilität eine
      Vertragsbedingung zu erschließen ist keine Quelle — und ein zu niedrig
      ausgewiesener Monatsbetrag ist der teuerste Fehler, den ein Preisrechner
      machen kann. Offen bis OWNER-INPUT H3 beantwortet ist.
    */
    const basis = { anrufeProMonat: 200, minutenProAnruf: 2 };
    for (const n of [2, 3] as const) {
      const p = berechnePreis(basis, n);
      expect(p.sprachenOffen).toBe(true);
      expect(p.sprachenMonatlichEur).not.toBe(0);
      expect(p.monatlichGesamtEur).toBe('unbekannt');
    }
  });
});

// ── 2 · Die Wirtschaftlichkeit ist überall dieselbe ─────────────────────────

describe('Wirtschaftlichkeit — eine Definition, drei Zustände', () => {
  const volumen = { anrufeProMonat: 400, minutenProAnruf: 2.5 };
  const preis = berechnePreis(volumen, 0);

  /** Nichts beantwortet — die Rechnung ist unvollständig. */
  const KEINE_CHANCEN = {
    verpassteAnrufeProMonat: null,
    davonChancenProzent: null,
    abschlussquoteProzent: null,
    deckungsbeitragEur: null,
    rueckgewinnbarProzent: null,
  };
  /** „Ich verpasse keine" — eine VOLLSTÄNDIGE Antwort mit Chancenwert 0. */
  const KEINE_VERPASSTEN = { ...KEINE_CHANCEN, verpassteAnrufeProMonat: 0 };
  const VOLLER_TRICHTER = {
    verpassteAnrufeProMonat: 100,
    davonChancenProzent: 50,
    abschlussquoteProzent: 30,
    deckungsbeitragEur: 200,
    rueckgewinnbarProzent: 50,
  };
  const ZEIT = { stundenkostenEur: 40, routineanteilProzent: 60 };

  // ── Zustand 1: unvollständig ──────────────────────────────────────────
  /*
    DER FEHLER, DEN DIESE GRUPPE VERHINDERT.

    Vorher ging ein fehlender Chancenwert als 0 in den Nettoeffekt ein. Die
    Überschrift zeigte dann eine negative Zahl, bevor der Besucher zu dem
    Posten befragt worden war, der in vielen Betrieben das Vorzeichen dreht —
    und las sich als „Cogniiq rechnet sich nicht", wo sie „mir fehlen noch
    Angaben" hätte sagen müssen.
  */
  it('zeigt ohne Chancenangaben KEINEN Nettoeffekt — auch keinen negativen', () => {
    const r = berechneWirtschaftlichkeit(volumen, preis, ZEIT, KEINE_CHANCEN);
    expect(r.vollstaendig).toBe(false);
    expect(r.nettoProMonatEur).toBe(UNVOLLSTAENDIG);
    expect(r.ersteJahrNettoEur).toBe(UNVOLLSTAENDIG);
    expect(r.amortisationMonate).toBeNull();
    expect(typeof r.nettoProMonatEur).not.toBe('number');
  });

  it('nennt genau die Felder, die noch fehlen', () => {
    expect(
      berechneWirtschaftlichkeit(volumen, preis, ZEIT, KEINE_CHANCEN).fehlendeAngaben
    ).toEqual(['verpassteAnrufe']);

    expect(
      berechneWirtschaftlichkeit(
        volumen,
        preis,
        { stundenkostenEur: null, routineanteilProzent: null },
        KEINE_CHANCEN
      ).fehlendeAngaben
    ).toEqual(['stundenkosten', 'routineanteil', 'verpassteAnrufe']);

    expect(
      berechneWirtschaftlichkeit(volumen, preis, ZEIT, {
        ...VOLLER_TRICHTER,
        abschlussquoteProzent: null,
        deckungsbeitragEur: null,
      }).fehlendeAngaben
    ).toEqual(['abschlussquote', 'deckungsbeitrag']);
  });

  it('zeigt das Zeitpotenzial auch dann, wenn die Gesamtrechnung noch fehlt', () => {
    const r = berechneWirtschaftlichkeit(volumen, preis, ZEIT, KEINE_CHANCEN);
    expect(r.zeitpotenzialRechenbar).toBe(true);
    expect(r.zeitwertProMonatEur).toBeGreaterThan(0);
    expect(r.vollstaendig).toBe(false);
  });

  it('rechnet ohne Stundensatz und ohne Routineanteil gar nicht', () => {
    const ohneSatz = berechneWirtschaftlichkeit(
      volumen,
      preis,
      { stundenkostenEur: null, routineanteilProzent: 60 },
      VOLLER_TRICHTER
    );
    expect(ohneSatz.zeitpotenzialRechenbar).toBe(false);
    expect(ohneSatz.zeitwertProMonatEur).toBeNull();
    expect(ohneSatz.nettoProMonatEur).toBe(UNVOLLSTAENDIG);

    const ohneAnteil = berechneWirtschaftlichkeit(
      volumen,
      preis,
      { stundenkostenEur: 40, routineanteilProzent: null },
      VOLLER_TRICHTER
    );
    expect(ohneAnteil.zeitpotenzialRechenbar).toBe(false);
    expect(ohneAnteil.nettoProMonatEur).toBe(UNVOLLSTAENDIG);
  });

  it('lässt die Chancenrechnung leer, solange ein einziges Feld fehlt', () => {
    const r = berechneWirtschaftlichkeit(volumen, preis, ZEIT, {
      ...KEINE_CHANCEN,
      verpassteAnrufeProMonat: 40,
      davonChancenProzent: 50,
    });
    expect(r.chancenwertProMonatEur).toBeNull();
    expect(r.vollstaendig).toBe(false);
  });

  // ── Zustand 2: vollständig positiv ────────────────────────────────────
  it('zeigt das vollständige Ergebnis, sobald alle Angaben vorliegen', () => {
    const r = berechneWirtschaftlichkeit(
      volumen,
      preis,
      { stundenkostenEur: 60, routineanteilProzent: 80 },
      VOLLER_TRICHTER
    );
    expect(r.vollstaendig).toBe(true);
    expect(r.fehlendeAngaben).toEqual([]);
    expect(typeof r.nettoProMonatEur).toBe('number');
    expect(r.nettoProMonatEur).toBeGreaterThan(0);
    expect(r.amortisationMonate).toBeGreaterThan(0);
  });

  // ── Zustand 3: vollständig negativ ────────────────────────────────────
  it('zeigt ein vollständiges negatives Ergebnis unverändert an', () => {
    /*
      Der Gegentest zur Unvollständigkeits-Regel. Wer alles beantwortet hat und
      wirtschaftlich schlecht dasteht, bekommt genau das zu sehen. Die Regel
      schützt vor einer Zahl aus einem halben Modell — nicht vor der Wahrheit.
    */
    const r = berechneWirtschaftlichkeit(
      volumen,
      preis,
      { stundenkostenEur: 12, routineanteilProzent: 5 },
      { ...VOLLER_TRICHTER, verpassteAnrufeProMonat: 1, deckungsbeitragEur: 10 }
    );
    expect(r.vollstaendig).toBe(true);
    expect(r.nettoProMonatEur).toBeLessThan(0);
    expect(r.ersteJahrNettoEur).toBeLessThan(0);
    expect(r.amortisationMonate).toBeNull();
  });

  it('null verpasste Anrufe sind eine vollständige Angabe, keine Lücke', () => {
    const r = berechneWirtschaftlichkeit(volumen, preis, ZEIT, KEINE_VERPASSTEN);
    expect(r.chancenRechenbar).toBe(true);
    expect(r.chancenwertProMonatEur).toBe(0);
    expect(r.vollstaendig).toBe(true);
    expect(r.fehlendeAngaben).toEqual([]);
    expect(typeof r.nettoProMonatEur).toBe('number');
  });

  it('setzt einen verpassten Anruf NIE mit einem verlorenen Auftrag gleich', () => {
    const r = berechneWirtschaftlichkeit(volumen, preis, ZEIT, VOLLER_TRICHTER);
    // 100 × 50 % × 30 % × 200 € × 50 % = 1.500 €, nicht 100 × 200 € = 20.000 €.
    expect(r.chancenwertProMonatEur).toBeCloseTo(1500, 6);
    expect(r.chancenwertProMonatEur).toBeLessThan(
      VOLLER_TRICHTER.verpassteAnrufeProMonat * VOLLER_TRICHTER.deckungsbeitragEur
    );
  });

  it('lässt die Einrichtung im ersten Jahr NICHT weg', () => {
    const r = berechneWirtschaftlichkeit(
      volumen,
      preis,
      { stundenkostenEur: 60, routineanteilProzent: 80 },
      VOLLER_TRICHTER
    );
    const ohneEinrichtung = (r.nettoProMonatEur as number) * 12;
    expect(r.ersteJahrNettoEur).toBeCloseTo(ohneEinrichtung - (r.einrichtungEur as number), 6);
    expect(r.ersteJahrKostenEur).toBeCloseTo(
      (r.kostenProMonatEur as number) * 12 + (r.einrichtungEur as number),
      6
    );
  });

  it('gibt bei individuellem Tarif keinen Nettoeffekt aus, statt einen zu erfinden', () => {
    const riesig = { anrufeProMonat: 5000, minutenProAnruf: 5 };
    const r = berechneWirtschaftlichkeit(
      riesig,
      berechnePreis(riesig, 0),
      { stundenkostenEur: 50, routineanteilProzent: 70 },
      VOLLER_TRICHTER
    );
    expect(r.nettoProMonatEur).toBe('unbekannt');
    expect(r.amortisationMonate).toBeNull();
  });

  it('gibt bei offenem Sprachaufschlag keinen Nettoeffekt aus', () => {
    const mitSprachen = berechnePreis(volumen, 3);
    const r = berechneWirtschaftlichkeit(volumen, mitSprachen, ZEIT, VOLLER_TRICHTER);
    expect(r.nettoProMonatEur).toBe('unbekannt');
    expect(r.amortisationMonate).toBeNull();
  });

  /*
    Der systematische Nachweis: Über eine Matrix aus Eingaben darf NIE eine
    negative Zahl herauskommen, solange `vollstaendig` false ist. Diese Prüfung
    ist wichtiger als jeder Einzelfall oben — sie hält die Regel auch dann,
    wenn jemand später einen neuen Pfad durch die Funktion legt.
  */
  it('liefert über alle unvollständigen Kombinationen nie eine Zahl', () => {
    const stundensaetze = [null, 0, 15, 90];
    const anteile = [null, 0, 40, 100];
    const chancenVarianten = [
      KEINE_CHANCEN,
      { ...KEINE_CHANCEN, verpassteAnrufeProMonat: 50 },
      { ...VOLLER_TRICHTER, rueckgewinnbarProzent: null },
      { ...VOLLER_TRICHTER, deckungsbeitragEur: null },
      VOLLER_TRICHTER,
      KEINE_VERPASSTEN,
    ];
    for (const stundenkostenEur of stundensaetze) {
      for (const routineanteilProzent of anteile) {
        for (const c of chancenVarianten) {
          const r = berechneWirtschaftlichkeit(
            volumen,
            preis,
            { stundenkostenEur, routineanteilProzent },
            c
          );
          if (r.vollstaendig) {
            expect(typeof r.nettoProMonatEur).toBe('number');
          } else {
            expect(typeof r.nettoProMonatEur).not.toBe('number');
            expect(typeof r.ersteJahrNettoEur).not.toBe('number');
            expect(r.amortisationMonate).toBeNull();
          }
        }
      }
    }
  });
});

// ── 3 · Ein Wochenfaktor ────────────────────────────────────────────────────

describe('Wochen je Monat', () => {
  it('rechnet Wochenaufkommen über genau eine Umrechnung in Monatsaufkommen', () => {
    expect(anrufeProMonatAusWoche(120)).toBeCloseTo(120 * WOCHEN_PRO_MONAT, 10);
    expect(anrufeProMonatAusWoche(-5)).toBe(0);
  });

  it('taucht als Zahlenliteral in keinem Bauteil erneut auf', () => {
    for (const [pfad, inhalt] of PRODUKTION) {
      if (pfad === 'src/lib/telefonassistent-rechner.ts') continue;
      expect(
        /(^|[^\d.])4\.3{1,2}([^\d]|$)/.test(inhalt),
        `${pfad} tippt einen eigenen Wochenfaktor; er gehört in telefonassistent-rechner.ts`
      ).toBe(false);
    }
  });
});

// ── 4 · Keine überlebenden Fremdbeträge ─────────────────────────────────────

describe('Beträge stehen an genau einer Stelle', () => {
  it('kennt keinen KI-Monatspreis von 297 € mehr', () => {
    for (const [pfad, inhalt] of PRODUKTION) {
      expect(
        /KI_PRICE_MONTHLY|\b297\s*€|297\\u00A0€/.test(inhalt),
        `${pfad} enthält den alten Beispielpreis 297 €`
      ).toBe(false);
    }
  });

  it('tippt den Minutenpreis 0,39 € nirgends erneut', () => {
    for (const [pfad, inhalt] of PRODUKTION) {
      if (KANONISCHE_ZAHLENQUELLEN.has(pfad)) continue;
      expect(
        /0[.,]39/.test(inhalt),
        `${pfad} tippt den Mehrpreis je Minute erneut; er steht in FAKTEN.mehrpreisProMinuteEur`
      ).toBe(false);
    }
  });

  it('tippt keinen Tarif-, Obergrenzen- oder Einrichtungsbetrag erneut', () => {
    const betraege = new Set(
      TARIFE.flatMap((t) => [t.monatlichEur, t.obergrenzeEur, t.einrichtungEur])
    );
    /*
      Geprüft wird die ZUWEISUNG AN EINEN PREIS-BEZEICHNER, nicht die nackte
      Zahl. `const START_ANRUFE = 300` ist ein Startwert für Anrufe und hat mit
      dem Basis-Monatspreis von 300 € nur die Ziffern gemeinsam; ein Test, der
      beides verwechselt, wird beim ersten Fehlalarm entschärft und schützt
      danach nichts mehr.
    */
    const preisZuweisung =
      /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::\s*number\s*)?=\s*(\d+(?:[.,]\d+)?)\s*;/g;
    const preisWort = /PREIS|PRICE|MONATLICH|MONTHLY|EINRICHTUNG|SETUP|OBERGRENZE|TARIF|KOSTEN/i;
    for (const [pfad, inhalt] of PRODUKTION) {
      if (KANONISCHE_ZAHLENQUELLEN.has(pfad)) continue;
      for (const treffer of inhalt.matchAll(preisZuweisung)) {
        const [, name, rohwert] = treffer;
        if (!preisWort.test(name)) continue;
        expect(
          betraege.has(Number(rohwert.replace(',', '.'))),
          `${pfad} weist ${name} = ${rohwert} zu; Tarifzahlen kommen aus TARIFE`
        ).toBe(false);
      }
    }
  });

  it('parst keinen formatierten Preisstring zurück in eine Zahl', () => {
    for (const [pfad, inhalt] of PRODUKTION) {
      expect(
        /betragZuZahl|replace\(\/\[\^\\d,\]/.test(inhalt),
        `${pfad} leitet Geschäftslogik aus einer Anzeigeformatierung ab`
      ).toBe(false);
    }
  });
});

// ── 5 · Die Automatisierungs-Semantik ───────────────────────────────────────

describe('Automatisierung — Fähigkeit und Anrufmix bleiben getrennt', () => {
  it('setzt auf keiner lebenden Fläche einen Automatisierungsgrad voreingestellt', () => {
    for (const [pfad, inhalt] of PRODUKTION) {
      if (pfad === EINGEFROREN) continue;
      expect(
        /AUTOMATISIERUNG_STANDARD|START_AUTOMATISIERUNG/.test(inhalt),
        `${pfad} setzt wieder einen Vorgabewert für den Automatisierungsgrad`
      ).toBe(false);
    }
  });

  it('behauptet nirgends, dass jeder Anruf vollständig automatisiert wird', () => {
    for (const [pfad, inhalt] of PRODUKTION) {
      expect(
        /100\s*%\s*(aller|jedes|jeder)\s+Anruf/.test(inhalt),
        `${pfad} verspricht die Automatisierung ALLER Anrufe; zugesagt sind konfigurierte Routineabläufe`
      ).toBe(false);
    }
  });

  it('hält die Ausnahmeregel im Rechenkern fest', () => {
    const kern = QUELLEN.get('src/lib/telefonassistent-rechner.ts')!;
    expect(kern).toMatch(/routineanteilProzent/);
    // Der Kommentar ist hier Teil der Zusage: Er ist die einzige Stelle, an der
    // steht, warum diese Zahl NICHT die Übernahmequote von Cogniiq ist.
    expect(kern).toMatch(/Anrufmix|ANRUFMIX/);
  });
});

// ── 6 · Der Anker trägt ─────────────────────────────────────────────────────

describe('Rechner-Anker', () => {
  it('existiert genau einmal als ID auf der Zielseite', () => {
    const seite = QUELLEN.get('src/pages/KiTelefonassistentPage.tsx')!;
    expect(seite).toMatch(/id=\{RECHNER_ANKER\}/);
    expect(seite).toMatch(/from "@\/lib\/rechner-anker"/);
  });

  it('setzt sich aus Route und ID zusammen — kein getippter Pfad', () => {
    expect(RECHNER_LINK).toBe(`${RECHNER_ROUTE}#${RECHNER_ANKER}`);
    expect(RECHNER_ROUTE.startsWith('/')).toBe(true);
    expect(RECHNER_ANKER.startsWith('#')).toBe(false);
  });

  it('wird von keinem Bauteil als Literal nachgebaut', () => {
    for (const [pfad, inhalt] of PRODUKTION) {
      if (pfad === 'src/lib/rechner-anker.ts') continue;
      expect(
        inhalt.includes(`"${RECHNER_LINK}"`) || inhalt.includes(`'${RECHNER_LINK}'`),
        `${pfad} tippt das Sprungziel; es steht in RECHNER_LINK`
      ).toBe(false);
    }
  });

  it('verweist von keiner eingefrorenen Seite auf den Rechner', () => {
    // Die Inbound-Zählung in protectedExperiments.test.tsx deckt die
    // Gegenrichtung ab. Diese Prüfung deckt die Hinrichtung: ein CTA, der auf
    // einer eingefrorenen Seite landet, verändert deren gerenderte Bytes.
    for (const pfad of [
      'src/pages/industries/KiTelefonassistentArzt.tsx',
      'src/pages/costs/KostenKiTelefonassistent.tsx',
    ]) {
      const inhalt = QUELLEN.get(pfad)!;
      expect(inhalt).not.toMatch(/RechnerCta|rechner-anker|rechner:/);
    }
  });
});

// ── 7 · Der eingefrorene Rechner widerspricht dem Kern nicht ────────────────

describe('Eingefrorener Praxis-Rechner — Paritätswache', () => {
  const widget = QUELLEN.get(EINGEFROREN)!;

  it('bezieht Tarifwahl und Deckelung aus dem kanonischen Rechenkern', () => {
    expect(widget).toMatch(/from "@\/lib\/telefonassistent-rechner"/);
    expect(widget).toMatch(/waehleSzenario/);
  });

  it('hat keine eigene Tarifarithmetik und keinen eigenen Minutenpreis mehr', () => {
    const ohneKommentare = widget
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');
    expect(ohneKommentare).not.toMatch(/MEHRPREIS_PRO_MINUTE\s*=/);
    expect(ohneKommentare).not.toMatch(/function betragZuZahl/);
    expect(ohneKommentare).not.toMatch(/obergrenzeEur\s*\)/);
  });

  it('kommt im Startzustand der Seite auf denselben Tarif wie der Kern', () => {
    /*
      Der Startzustand ist der Teil, der in die gerenderten Bytes der
      eingefrorenen Seite eingeht: 120 Anrufe je Woche, zwei Gesprächsminuten je
      Anruf. Wandert dieses Ergebnis, wandert die Seite — und das fällt sonst
      erst der Fingerabdruck-Wache auf, ohne Hinweis auf die Ursache.
    */
    const minuten = minutenProMonat({
      anrufeProMonat: anrufeProMonatAusWoche(120),
      minutenProAnruf: 2,
    });
    const szenario = waehleSzenario(minuten);
    expect(szenario).not.toBeNull();
    expect(szenario!.tarif.name).toBe('Praxis');
    expect(szenario!.amDeckel).toBe(false);
  });
});

// ── 8 · Produktwahrheit auf den nicht eingefrorenen Flächen ────────────────

describe('Produktwahrheit — Abwicklung ist der Normalfall, Übergabe die Ausnahme', () => {
  /*
    Die eingefrorenen Experimentrouten sind ausgenommen, und zwar NICHT weil
    ihre Formulierungen richtig wären, sondern weil ihre gerenderten Bytes die
    Messbedingung eines laufenden Tests sind. Sobald der endet, fällt die
    Ausnahme weg — die Nachträge stehen in
    docs/seo/post-experiment-opportunities.md.
  */
  const EINGEFROREN_QUELLEN = new Set([
    'src/pages/industries/KiTelefonassistentArzt.tsx',
    'src/pages/costs/KostenKiTelefonassistent.tsx',
    'src/components/PraxisRechnerWidget.tsx',
  ]);
  const LEBEND = PRODUKTION.filter(([pfad]) => !EINGEFROREN_QUELLEN.has(pfad));

  it('verspricht nirgends eine unbedingte Erreichbarkeit ohne Warteschleife', () => {
    /*
      „ohne Warteschleife", „kein Besetztzeichen", „jeder Anruf wird
      angenommen" sind unbedingte Zusagen. Sie hängen an einer endlichen
      Gleichzeitigkeit, deren Bereitstellung je Kunde nicht dokumentiert ist
      (OWNER-INPUT B11a) — und an einem Überlaufverhalten, das ebenfalls offen
      ist (B9). Erlaubt bleibt die Aussage, die in jedem Fall trägt: mehrere
      Anrufe zur selben Zeit.
    */
    const verboten = /ohne Warteschleife|kein(?:e)? Besetztzeichen|ohne Besetztzeichen|egal wie voll|jeder Anruf wird angenommen/;
    for (const [pfad, inhalt] of LEBEND) {
      expect(verboten.test(inhalt), `${pfad} verspricht unbedingte Erreichbarkeit`).toBe(false);
    }
  });

  it('nennt keine Anzahl gleichzeitiger Anrufe als öffentliche Zusage', () => {
    const verboten = /(zehn|10)\s+(?:Anrufe|Gespräche)\s+gleichzeitig/i;
    for (const [pfad, inhalt] of LEBEND) {
      expect(verboten.test(inhalt), `${pfad} beziffert die Gleichzeitigkeit`).toBe(false);
    }
  });

  it('beschreibt die Übergabe nirgends als den Kern des Produkts', () => {
    const verboten = /Übergabe (?:ist|bleibt) der Kern|Kern des Produkts ist die (?:strukturierte )?Übergabe|nimmt Terminwünsche auf, Ihr Team bestätigt/i;
    for (const [pfad, inhalt] of LEBEND) {
      expect(verboten.test(inhalt), `${pfad} macht die Notiz zum Produkt`).toBe(false);
    }
  });

  it('hält Fähigkeit und Anbindungsbedingung als getrennte Regeln fest', () => {
    const copy = QUELLEN.get('src/lib/telefonassistent-copy.ts')!;
    // Die Fähigkeit darf benannt werden …
    expect(copy).toMatch(/AUTOMATED_WORKFLOW_COMPLETION|AUTOMATISIERTE_ABWICKLUNG/);
    // … und die Bedingung für Schreibzugriff steht daneben, nicht statt ihrer.
    expect(copy).toMatch(/SYSTEM_SCHREIBZUGRIFF/);
    // Die alte Fehlleseung darf nicht zurückkehren.
    expect(copy).not.toMatch(
      /was universell und\s+belegt gilt, ist die Aufnahme des Terminwunsches/
    );
  });
});

// ── 8 · Messung ohne Geschäftszahlen ────────────────────────────────────────

describe('Analytics', () => {
  const rechner = QUELLEN.get('src/components/TelefonRechner.tsx')!;

  it('meldet nur Ereignisnamen und feste Labels, nie einen Eingabewert', () => {
    const aufrufe = [...rechner.matchAll(/trackEvent\(([^)]*)\)/g)].map((m) => m[1]);
    expect(aufrufe.length).toBeGreaterThan(0);
    for (const argumente of aufrufe) {
      // Erlaubt: "name" oder "name", "Label". Verboten: jede Variable.
      expect(
        /^"[a-z_]+"(,\s*"[^"]*")?$/.test(argumente.trim()),
        `trackEvent(${argumente}) übergibt etwas anderes als feste Zeichenketten`
      ).toBe(true);
    }
  });

  it('meldet den Rechenstart höchstens einmal je Besuch', () => {
    expect(rechner).toMatch(/preisGemeldet\.current/);
    expect(rechner).toMatch(/roiGemeldet\.current/);
  });
});
