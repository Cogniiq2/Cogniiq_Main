import { describe, expect, it } from 'vitest';

import {
  APARTMENTS,
  APARTMENT_KEYS,
  APARTMENT_LIST,
  apartmentIdOf,
  isApartmentKey,
  productBelongsToApartment,
  productIdsForApartment,
  resolveApartment,
} from './apartments';
import { PRIVATE_BAR_CATALOG, productById } from './catalog';
import { PRIVATE_BAR_APARTMENT_ID } from './config';

/**
 * These are the values the guest, the inventory rows and the order history all
 * depend on. They are asserted literally on purpose: a rename here is a data
 * migration, never a refactor, and this test is what makes that obvious.
 */
describe('apartment mapping', () => {
  it('resolves designAparts I to its own canonical id', () => {
    expect(resolveApartment('designaparts1')?.apartmentId).toBe('bolagio-designaparts-1');
    expect(apartmentIdOf('designaparts1')).toBe('bolagio-designaparts-1');
    expect(APARTMENTS.designaparts1.label).toBe('designAparts I');
  });

  it('keeps designAparts II on its historical id', () => {
    // 'bolagio-apartment-1' already keys live inventory and real orders. The
    // guest-facing name changed; this value must not.
    expect(resolveApartment('designaparts2')?.apartmentId).toBe('bolagio-apartment-1');
    expect(apartmentIdOf('designaparts2')).toBe('bolagio-apartment-1');
    expect(APARTMENTS.designaparts2.label).toBe('designAparts II');
    expect(PRIVATE_BAR_APARTMENT_ID).toBe('bolagio-apartment-1');
  });

  it('gives the two apartments different canonical ids', () => {
    const ids = APARTMENT_KEYS.map(apartmentIdOf);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('fails closed for anything that is not a known public key', () => {
    for (const value of [
      'designaparts3',
      'designAparts I',
      'DESIGNAPARTS1',
      ' designaparts1',
      // A canonical internal id is an OUTPUT, never an accepted input.
      'bolagio-apartment-1',
      'bolagio-designaparts-1',
      '',
      null,
      undefined,
      42,
      {},
      ['designaparts1'],
      // Prototype keys must not resolve through the record lookup.
      '__proto__',
      'constructor',
      'toString',
      'hasOwnProperty',
    ]) {
      expect(resolveApartment(value), `${String(value)} resolved`).toBeNull();
      expect(isApartmentKey(value), `${String(value)} passed the guard`).toBe(false);
    }
  });

  it('lists both apartments for the selection gate, in a stable order', () => {
    expect(APARTMENT_LIST.map((a) => a.key)).toEqual(['designaparts1', 'designaparts2']);
  });
});

describe('product assignment', () => {
  const DESIGNAPARTS_1 = [
    'planeta-plumbago-nero-davola-2021',
    'ottella-rosesroses',
    'cavalchina-custoza-2025',
    'nunzio-ghiraldi-il-gruccione',
    'manz-grauburgunder-fruchtecke',
  ];
  const DESIGNAPARTS_2 = [
    'stella-rossa-prosecco-doc-brut',
    'ploner-marell',
    'masseria-borgo-dei-trulli-primitivo',
    'covo-moro',
    'ploner-sauvignon',
    'tiefenbrunner-merus-gewuerztraminer-2022',
    'biancavigna-2022',
    'bayreuther-hell',
    's-pellegrino',
  ];

  it('sells the five new wines in designAparts I, and only there', () => {
    expect([...productIdsForApartment('designaparts1')]).toEqual(DESIGNAPARTS_1);
    for (const id of DESIGNAPARTS_1) {
      expect(productBelongsToApartment(id, 'designaparts1'), id).toBe(true);
      expect(productBelongsToApartment(id, 'designaparts2'), id).toBe(false);
    }
  });

  it('keeps the existing nine products in designAparts II, and only there', () => {
    expect([...productIdsForApartment('designaparts2')]).toEqual(DESIGNAPARTS_2);
    for (const id of DESIGNAPARTS_2) {
      expect(productBelongsToApartment(id, 'designaparts2'), id).toBe(true);
      expect(productBelongsToApartment(id, 'designaparts1'), id).toBe(false);
    }
  });

  it('assigns no product that does not exist, and leaves none unassigned', () => {
    const assigned = APARTMENT_KEYS.flatMap((key) => [...productIdsForApartment(key)]);
    expect(new Set(assigned).size).toBe(assigned.length);
    for (const id of assigned) expect(productById(id), `${id} is not in the catalogue`).toBeDefined();
    expect([...assigned].sort()).toEqual(PRIVATE_BAR_CATALOG.map((p) => p.id).sort());
  });

  it('claims nothing for an unknown product id', () => {
    for (const key of APARTMENT_KEYS) {
      expect(productBelongsToApartment('ghost', key)).toBe(false);
      expect(productBelongsToApartment('', key)).toBe(false);
    }
  });
});

describe('prices', () => {
  it('carries the designAparts I wines at exactly the owner-set gross amounts', () => {
    const expected: Record<string, number> = {
      'planeta-plumbago-nero-davola-2021': 1800,
      'ottella-rosesroses': 1700,
      'cavalchina-custoza-2025': 1400,
      'nunzio-ghiraldi-il-gruccione': 1900,
      'manz-grauburgunder-fruchtecke': 1400,
    };
    for (const [id, cents] of Object.entries(expected)) {
      expect(productById(id)?.priceCents, id).toBe(cents);
    }
  });

  it('leaves every designAparts II price exactly as it was', () => {
    // Regression baseline, frozen deliberately: adding a second apartment must
    // not move a single existing amount.
    const expected: Record<string, number> = {
      'stella-rossa-prosecco-doc-brut': 2200,
      'ploner-marell': 3900,
      'masseria-borgo-dei-trulli-primitivo': 1600,
      'covo-moro': 1900,
      'ploner-sauvignon': 2900,
      'tiefenbrunner-merus-gewuerztraminer-2022': 2400,
      'biancavigna-2022': 2400,
      'bayreuther-hell': 450,
      's-pellegrino': 450,
    };
    for (const [id, cents] of Object.entries(expected)) {
      expect(productById(id)?.priceCents, id).toBe(cents);
    }
  });
});
