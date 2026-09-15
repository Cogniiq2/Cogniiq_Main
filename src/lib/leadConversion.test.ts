/*
  Der Riegel hinter `lead_submitted` — auf der Ebene, auf der ein RELOAD
  überhaupt prüfbar ist.

  Ein Reload wirft den JavaScript-Zustand weg und behält `sessionStorage` und
  `window.history.state`. In einer Komponententestdatei ist das nicht ehrlich
  nachstellbar: `vi.resetModules()` setzt ein bereits importiertes Modul nicht
  zurück, und die Seite importiert dieses Modul statisch — ein „Reload-Test"
  dort würde in Wahrheit weiter gegen den überlebenden Modulzustand laufen und
  grün sein, ohne die Zusage zu prüfen. Deshalb steht er hier: mit einem
  frischen Modulimport neben unverändertem `sessionStorage` ist es genau der
  Zustandsübergang, den ein Reload erzeugt.
*/
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  __leadSpeicherZuruecksetzen,
  leadAlsGemeldetVormerken,
  neueLeadKennung,
} from '@/lib/leadConversion';

beforeEach(() => {
  __leadSpeicherZuruecksetzen();
  sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('eine Kennung wird genau einmal angenommen', () => {
  it('nimmt eine frische Kennung an', () => {
    expect(leadAlsGemeldetVormerken(neueLeadKennung())).toBe(true);
  });

  it('lehnt dieselbe Kennung beim zweiten Mal ab', () => {
    const id = neueLeadKennung();
    expect(leadAlsGemeldetVormerken(id)).toBe(true);
    expect(leadAlsGemeldetVormerken(id)).toBe(false);
    expect(leadAlsGemeldetVormerken(id)).toBe(false);
  });

  it('nimmt eine zweite, echte Übermittlung wieder an', () => {
    expect(leadAlsGemeldetVormerken(neueLeadKennung())).toBe(true);
    expect(leadAlsGemeldetVormerken(neueLeadKennung())).toBe(true);
  });

  it('lehnt eine leere Kennung ab, statt sie als gültig zu führen', () => {
    expect(leadAlsGemeldetVormerken('')).toBe(false);
  });

  it('vergibt bei jedem Aufruf eine andere Kennung', () => {
    const ids = new Set(Array.from({ length: 200 }, () => neueLeadKennung()));
    expect(ids.size).toBe(200);
  });
});

describe('ein RELOAD meldet nicht erneut', () => {
  it('kennt eine vor dem Reload angenommene Kennung auch nach frischem Modulimport', async () => {
    const id = neueLeadKennung();
    expect(leadAlsGemeldetVormerken(id)).toBe(true);

    // Der Reload: der Modulzustand ist weg, der Tab-Speicher nicht.
    vi.resetModules();
    const frisch = await import('@/lib/leadConversion');

    // Die frische Instanz hat ein leeres Set und MUSS die Kennung aus dem
    // Speicher wiedererkennen. Täte sie es nicht, wäre jeder Reload der
    // Dankeseite eine weitere gezählte Anfrage.
    expect(frisch.leadAlsGemeldetVormerken(id)).toBe(false);
  });

  it('nimmt nach dem Reload eine NEUE Kennung weiterhin an', async () => {
    expect(leadAlsGemeldetVormerken(neueLeadKennung())).toBe(true);

    vi.resetModules();
    const frisch = await import('@/lib/leadConversion');

    expect(frisch.leadAlsGemeldetVormerken(frisch.neueLeadKennung())).toBe(true);
  });
});

describe('ohne verfügbaren Tab-Speicher', () => {
  it('meldet innerhalb der Seitensitzung trotzdem nur einmal', () => {
    // Privates Fenster, blockierte Site-Daten: jeder Zugriff wirft. Remount und
    // Zurück sind dann weiterhin gedeckt — über das Modul-Set.
    const werfen = () => {
      throw new Error('storage blocked');
    };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(werfen);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(werfen);

    const id = neueLeadKennung();
    expect(leadAlsGemeldetVormerken(id)).toBe(true);
    expect(leadAlsGemeldetVormerken(id)).toBe(false);
  });

  it('wirft nicht, sondern degradiert', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(() => leadAlsGemeldetVormerken(neueLeadKennung())).not.toThrow();
  });
});

describe('der Speicher wächst nicht unbegrenzt', () => {
  it('führt höchstens 20 Kennungen mit', () => {
    for (let i = 0; i < 50; i++) leadAlsGemeldetVormerken(neueLeadKennung());
    const abgelegt: unknown = JSON.parse(sessionStorage.getItem('cogniiq_reported_leads') ?? '[]');
    expect(Array.isArray(abgelegt)).toBe(true);
    expect((abgelegt as string[]).length).toBeLessThanOrEqual(20);
  });

  it('legt nur Kennungen ab, keine Besucherangaben', () => {
    leadAlsGemeldetVormerken(neueLeadKennung());
    const roh = sessionStorage.getItem('cogniiq_reported_leads') ?? '';
    expect(roh).not.toMatch(/@/);
    expect(JSON.parse(roh).every((e: unknown) => typeof e === 'string')).toBe(true);
  });
});
