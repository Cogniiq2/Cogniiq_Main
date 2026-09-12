// ─────────────────────────────────────────────────────────────────────────────
// Der Wirtschaftlichkeitsrechner von /kosten-automatisierung, von Hand
// nachgerechnet.
//
// Die Reihenfolge der Blöcke ist die Reihenfolge der Risiken:
//   1. LEER IST NICHT NULL — der Fehler, der eine Kaufentscheidung verfälscht.
//   2. Die Arithmetik selbst.
//   3. Amortisation — die Zahl, die am leichtesten unsinnig wird.
//   4. Die zwei Arbeits-Lesarten, die nie zusammenfallen dürfen.
//   5. Der systematische Nachweis über eine Eingabematrix.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, expect, it } from 'vitest';

import { WOCHEN_PRO_MONAT } from '@/lib/zeitrechnung';
import {
  UNVOLLSTAENDIG,
  berechneWirtschaftlichkeit,
  kapazitaetsEingabe,
  personalkostenEingabe,
  stundenProMonatAusWoche,
} from '@/lib/automatisierung-rechner';

/** Eine vollständige, klar positive Ausgangslage. 10 h/Woche à 45 €, 60 %
 *  reduzierbar, 6.000 € einmalig, 150 €/Monat laufend. */
const VOLL_KAPAZITAET = kapazitaetsEingabe(10, 45, 60);
const INVEST = { einmaligEur: 6000, laufendProMonatEur: 150 };

/** Von Hand: 10 × 4,33 = 43,3 h → × 45 € = 1.948,50 € → × 0,6 = 1.169,10 €. */
const ARBEITSNUTZEN = 10 * WOCHEN_PRO_MONAT * 45 * 0.6;

describe('leer ist nicht null', () => {
  it('nennt jede fehlende Pflichtangabe beim Namen', () => {
    const r = berechneWirtschaftlichkeit(kapazitaetsEingabe(null, null, null), {
      einmaligEur: null,
      laufendProMonatEur: null,
    });
    expect(r.vollstaendig).toBe(false);
    expect([...r.fehlendeAngaben].sort()).toEqual(
      [
        'investitionEinmalig',
        'laufendeKosten',
        'reduzierbarerAnteil',
        'stundenProWoche',
        'stundenkosten',
      ].sort()
    );
  });

  it('gibt keinen Betrag aus, solange eine einzige Angabe fehlt', () => {
    // Der gefährliche Fall: Kosten stehen, Nutzen fehlt. Eine 0 für den Nutzen
    // ergäbe ein sattes Minus — aus einer Lücke, nicht aus einer Tatsache.
    const r = berechneWirtschaftlichkeit(kapazitaetsEingabe(10, null, 60), INVEST);
    expect(r.nettoProMonatEur).toBe(UNVOLLSTAENDIG);
    expect(r.ersteJahrNettoEur).toBe(UNVOLLSTAENDIG);
    expect(r.ersteJahrKostenEur).toBe(UNVOLLSTAENDIG);
    expect(r.amortisationMonate).toBeNull();
    expect(r.fehlendeAngaben).toEqual(['stundenkosten']);
  });

  it('behandelt eine fehlende Investition genauso streng wie einen fehlenden Nutzen', () => {
    const r = berechneWirtschaftlichkeit(VOLL_KAPAZITAET, {
      einmaligEur: null,
      laufendProMonatEur: 150,
    });
    expect(r.vollstaendig).toBe(false);
    expect(r.nettoProMonatEur).toBe(UNVOLLSTAENDIG);
    // Der Arbeitsnutzen allein ist bezifferbar und darf angezeigt werden — die
    // Bilanz daraus nicht.
    expect(r.arbeitsnutzenRechenbar).toBe(true);
    expect(r.arbeitsnutzenProMonatEur).toBeCloseTo(ARBEITSNUTZEN, 6);
  });

  it('nimmt eine eingetragene 0 als vollständige Angabe, nicht als Lücke', () => {
    // Nicht jede Automatisierung hat laufende Kosten, und 0 % reduzierbar ist
    // ein Ergebnis. Beides muss rechnen, nicht blockieren.
    const r = berechneWirtschaftlichkeit(VOLL_KAPAZITAET, {
      einmaligEur: 6000,
      laufendProMonatEur: 0,
    });
    expect(r.vollstaendig).toBe(true);
    expect(r.nettoProMonatEur).toBeCloseTo(ARBEITSNUTZEN, 6);

    const ohneReduktion = berechneWirtschaftlichkeit(kapazitaetsEingabe(10, 45, 0), INVEST);
    expect(ohneReduktion.vollstaendig).toBe(true);
    expect(ohneReduktion.arbeitsnutzenProMonatEur).toBe(0);
    expect(ohneReduktion.nettoProMonatEur).toBe(-150);
  });
});

describe('die Arithmetik', () => {
  it('rechnet Wochenstunden über genau eine Umrechnung in Monatsstunden', () => {
    expect(stundenProMonatAusWoche(10)).toBeCloseTo(10 * WOCHEN_PRO_MONAT, 10);
    expect(stundenProMonatAusWoche(-3)).toBe(0);
  });

  it('bewertet Kapazität als Stunden × Satz × reduzierbarem Anteil', () => {
    const r = berechneWirtschaftlichkeit(VOLL_KAPAZITAET, INVEST);
    expect(r.manuelleStundenProMonat).toBeCloseTo(43.3, 6);
    expect(r.kapazitaetswertProMonatEur).toBeCloseTo(43.3 * 45, 6);
    expect(r.arbeitsnutzenProMonatEur).toBeCloseTo(ARBEITSNUTZEN, 6);
  });

  it('zieht die laufenden Kosten monatlich ab, die Investition nur einmal', () => {
    const r = berechneWirtschaftlichkeit(VOLL_KAPAZITAET, INVEST);
    expect(r.nettoProMonatEur).toBeCloseTo(ARBEITSNUTZEN - 150, 6);
    expect(r.ersteJahrNettoEur).toBeCloseTo((ARBEITSNUTZEN - 150) * 12 - 6000, 6);
    expect(r.ersteJahrKostenEur).toBeCloseTo(150 * 12 + 6000, 6);
  });

  it('lässt die einmalige Investition im ersten Jahr NICHT weg', () => {
    const r = berechneWirtschaftlichkeit(VOLL_KAPAZITAET, INVEST);
    const ohneInvestition = (r.nettoProMonatEur as number) * 12;
    expect(r.ersteJahrNettoEur).toBeLessThan(ohneInvestition);
    expect(ohneInvestition - (r.ersteJahrNettoEur as number)).toBeCloseTo(6000, 6);
  });

  it('beschneidet Prozentangaben auf 0–100 statt sie durchzureichen', () => {
    const ueber = berechneWirtschaftlichkeit(kapazitaetsEingabe(10, 45, 250), INVEST);
    const hundert = berechneWirtschaftlichkeit(kapazitaetsEingabe(10, 45, 100), INVEST);
    expect(ueber.arbeitsnutzenProMonatEur).toBe(hundert.arbeitsnutzenProMonatEur);

    const negativ = berechneWirtschaftlichkeit(kapazitaetsEingabe(10, 45, -40), INVEST);
    expect(negativ.arbeitsnutzenProMonatEur).toBe(0);
  });

  it('zeigt ein vollständiges negatives Ergebnis unverändert an', () => {
    // Der Gegentest zur Unvollständigkeitsregel: Wer alles beantwortet hat und
    // schlecht dasteht, bekommt genau das zu sehen.
    const r = berechneWirtschaftlichkeit(kapazitaetsEingabe(1, 20, 30), {
      einmaligEur: 9000,
      laufendProMonatEur: 400,
    });
    expect(r.vollstaendig).toBe(true);
    expect(r.nettoProMonatEur).toBeLessThan(0);
    expect(r.ersteJahrNettoEur).toBeLessThan(0);
    expect(r.amortisationMonate).toBeNull();
  });
});

describe('Amortisation', () => {
  it('rechnet Investition ÷ monatlichem Nettoeffekt', () => {
    const r = berechneWirtschaftlichkeit(VOLL_KAPAZITAET, INVEST);
    expect(r.amortisationMonate).toBeCloseTo(6000 / (ARBEITSNUTZEN - 150), 6);
  });

  it('gibt keine Dauer aus, wenn der Nettoeffekt nicht positiv ist', () => {
    // Genau null: kein „unendlich", kein „0 Monate", keine Zahl.
    const genauNull = berechneWirtschaftlichkeit(kapazitaetsEingabe(10, 45, 0), {
      einmaligEur: 5000,
      laufendProMonatEur: 0,
    });
    expect(genauNull.nettoProMonatEur).toBe(0);
    expect(genauNull.amortisationMonate).toBeNull();

    const negativ = berechneWirtschaftlichkeit(kapazitaetsEingabe(2, 30, 20), {
      einmaligEur: 5000,
      laufendProMonatEur: 900,
    });
    expect(negativ.nettoProMonatEur).toBeLessThan(0);
    expect(negativ.amortisationMonate).toBeNull();
  });

  it('liefert nie eine negative oder unendliche Amortisationsdauer', () => {
    for (const stunden of [0, 1, 5, 40]) {
      for (const laufend of [0, 200, 5000]) {
        const r = berechneWirtschaftlichkeit(kapazitaetsEingabe(stunden, 50, 50), {
          einmaligEur: 4000,
          laufendProMonatEur: laufend,
        });
        if (r.amortisationMonate !== null) {
          expect(r.amortisationMonate).toBeGreaterThan(0);
          expect(Number.isFinite(r.amortisationMonate)).toBe(true);
        }
      }
    }
  });
});

describe('die zwei Arbeits-Lesarten', () => {
  it('füllt im Kapazitätsmodus keine Personalkostenfelder und umgekehrt', () => {
    const a = kapazitaetsEingabe(10, 45, 60);
    expect(a.personalkostenProMonatEur).toBeNull();
    expect(a.vermeidbarerAnteilProzent).toBeNull();

    const b = personalkostenEingabe(3200, 50);
    expect(b.stundenProWoche).toBeNull();
    expect(b.stundenkostenEur).toBeNull();
    expect(b.reduzierbarerAnteilProzent).toBeNull();
  });

  it('bewertet im Personalkostenmodus den vermeidbaren Anteil der Vollkosten', () => {
    const r = berechneWirtschaftlichkeit(personalkostenEingabe(3200, 50), INVEST);
    expect(r.modus).toBe('personalkosten');
    expect(r.arbeitsnutzenProMonatEur).toBe(1600);
    expect(r.nettoProMonatEur).toBe(1450);
    // Die Kapazitätskennzahlen bleiben leer — sie gehören zur anderen Lesart
    // und dürfen nicht nebenher als zweiter Nutzen erscheinen.
    expect(r.manuelleStundenProMonat).toBeNull();
    expect(r.kapazitaetswertProMonatEur).toBeNull();
  });

  it('zählt nie beide Lesarten zusammen', () => {
    const a = berechneWirtschaftlichkeit(VOLL_KAPAZITAET, INVEST);
    const b = berechneWirtschaftlichkeit(personalkostenEingabe(3200, 50), INVEST);
    // Jedes Ergebnis trägt genau einen Arbeitsnutzen — den seines eigenen Modus.
    expect(a.arbeitsnutzenProMonatEur).toBeCloseTo(ARBEITSNUTZEN, 6);
    expect(b.arbeitsnutzenProMonatEur).toBe(1600);
    expect(a.arbeitsnutzenProMonatEur).not.toBe(
      (a.arbeitsnutzenProMonatEur as number) + (b.arbeitsnutzenProMonatEur as number)
    );
  });

  it('behandelt 0 % vermeidbar als Ergebnis, nicht als fehlende Angabe', () => {
    const r = berechneWirtschaftlichkeit(personalkostenEingabe(3200, 0), INVEST);
    expect(r.vollstaendig).toBe(true);
    expect(r.arbeitsnutzenProMonatEur).toBe(0);
    expect(r.amortisationMonate).toBeNull();
  });
});

describe('systematisch: keine Zahl aus einem halben Modell', () => {
  it('liefert über alle unvollständigen Kombinationen nie einen Betrag', () => {
    const stunden = [null, 0, 10, 60];
    const saetze = [null, 0, 45, 120];
    const anteile = [null, 0, 60, 100];
    const investitionen = [
      { einmaligEur: null, laufendProMonatEur: null },
      { einmaligEur: 6000, laufendProMonatEur: null },
      { einmaligEur: null, laufendProMonatEur: 150 },
      { einmaligEur: 0, laufendProMonatEur: 0 },
      { einmaligEur: 6000, laufendProMonatEur: 150 },
    ];
    for (const s of stunden) {
      for (const satz of saetze) {
        for (const a of anteile) {
          for (const inv of investitionen) {
            const r = berechneWirtschaftlichkeit(kapazitaetsEingabe(s, satz, a), inv);
            if (r.vollstaendig) {
              expect(typeof r.nettoProMonatEur).toBe('number');
              expect(typeof r.ersteJahrNettoEur).toBe('number');
            } else {
              expect(typeof r.nettoProMonatEur).not.toBe('number');
              expect(typeof r.ersteJahrNettoEur).not.toBe('number');
              expect(typeof r.ersteJahrKostenEur).not.toBe('number');
              expect(r.amortisationMonate).toBeNull();
            }
          }
        }
      }
    }
  });

  it('gilt dieselbe Regel im Personalkostenmodus', () => {
    for (const kosten of [null, 0, 3200]) {
      for (const anteil of [null, 0, 50, 100]) {
        for (const inv of [
          { einmaligEur: null, laufendProMonatEur: 150 },
          { einmaligEur: 6000, laufendProMonatEur: 150 },
        ]) {
          const r = berechneWirtschaftlichkeit(personalkostenEingabe(kosten, anteil), inv);
          if (!r.vollstaendig) {
            expect(typeof r.nettoProMonatEur).not.toBe('number');
            expect(r.amortisationMonate).toBeNull();
          }
        }
      }
    }
  });
});
