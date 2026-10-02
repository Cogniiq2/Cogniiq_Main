import { describe, expect, it } from 'vitest';
import { aufZeitplan, enthuellteHoehe, uhrDauer, zeitplanAb, zeitplanFuer } from './gespraechsuhr';

const PHASE = { start: 0.06, ende: 0.5 };

describe('Gesprächsuhr', () => {
  it('bildet den Ausschnitt auf die freigegebene Zeitachse ab', () => {
    const plan = zeitplanFuer(PHASE, 5);
    expect(aufZeitplan(plan, 0)).toBe(0);
    expect(aufZeitplan(plan, 0.06)).toBe(0);
    expect(aufZeitplan(plan, 0.28)).toBeCloseTo(2.5);
    expect(aufZeitplan(plan, 0.5)).toBe(5);
    expect(aufZeitplan(plan, 0.9)).toBe(5);
  });

  it('ändert beim Aufklappen mitten im Gespräch an der aktuellen Stelle nichts', () => {
    const ausschnitt = zeitplanFuer(PHASE, 5);
    for (const p of [0.07, 0.2, 0.31, 0.49]) {
      const jetzt = aufZeitplan(ausschnitt, p);
      const neu = zeitplanAb(PHASE, p, jetzt, 9);
      expect(aufZeitplan(neu, p)).toBeCloseTo(jetzt, 10);
      // Davor bleibt die freigegebene Zeitachse unverändert.
      expect(aufZeitplan(neu, (PHASE.start + p) / 2)).toBeCloseTo(aufZeitplan(ausschnitt, (PHASE.start + p) / 2), 10);
      // Am Ende der Phase steht das ganze Gespräch.
      expect(aufZeitplan(neu, PHASE.ende)).toBe(9);
    }
  });

  it('wächst nach der Neuplanung stetig, ohne Rückschritt', () => {
    const neu = zeitplanAb(PHASE, 0.25, aufZeitplan(zeitplanFuer(PHASE, 5), 0.25), 9);
    let vorher = -Infinity;
    for (let p = 0; p <= 1; p += 0.01) {
      const u = aufZeitplan(neu, p);
      expect(u).toBeGreaterThanOrEqual(vorher);
      vorher = u;
    }
  });

  it('nutzt hinter der Gesprächsphase die gleichmäßige Zeitachse — dort übernimmt die Uhr', () => {
    expect(zeitplanAb(PHASE, 0.75, 5, 9)).toEqual(zeitplanFuer(PHASE, 9));
    expect(zeitplanAb(PHASE, 0.02, 0, 9)).toEqual(zeitplanFuer(PHASE, 9));
  });

  it('rechnet die sichtbare Höhe aus den Unterkanten', () => {
    const kanten = [60, 120, 200];
    expect(enthuellteHoehe(0, kanten, 0.8)).toBe(0);
    expect(enthuellteHoehe(0.4, kanten, 0.8)).toBeCloseTo(30);
    expect(enthuellteHoehe(1, kanten, 0.8)).toBe(60);
    expect(enthuellteHoehe(2.8, kanten, 0.8)).toBe(200);
    expect(enthuellteHoehe(9, kanten, 0.8)).toBe(200);
  });

  it('hält die Ankunft kurz, aber nie abrupt', () => {
    expect(uhrDauer(0)).toBeGreaterThan(0.2);
    expect(uhrDauer(4)).toBeCloseTo(0.9);
    expect(uhrDauer(40)).toBe(1.2);
  });
});
