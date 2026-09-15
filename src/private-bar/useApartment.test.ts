import { describe, expect, it } from 'vitest';

import { APARTMENT_STORAGE_KEY, readStoredApartment, writeStoredApartment } from './useApartment';

function memoryStorage(initial?: string) {
  const map = new Map<string, string>();
  if (initial !== undefined) map.set(APARTMENT_STORAGE_KEY, initial);
  return {
    map,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
}

describe('remembered apartment', () => {
  it('round-trips a valid selection', () => {
    const storage = memoryStorage();
    writeStoredApartment(storage, 'designaparts1');
    expect(readStoredApartment(storage)).toBe('designaparts1');
    writeStoredApartment(storage, 'designaparts2');
    expect(readStoredApartment(storage)).toBe('designaparts2');
  });

  it('forgets the selection when it is cleared', () => {
    const storage = memoryStorage('designaparts1');
    writeStoredApartment(storage, null);
    expect(storage.map.has(APARTMENT_STORAGE_KEY)).toBe(false);
    expect(readStoredApartment(storage)).toBeNull();
  });

  it('discards and REMOVES a tampered or stale value instead of trusting it', () => {
    for (const stored of [
      'designaparts3',
      'bolagio-apartment-1',
      'designAparts I',
      '',
      '{"key":"designaparts1"}',
      '__proto__',
    ]) {
      const storage = memoryStorage(stored);
      expect(readStoredApartment(storage), stored).toBeNull();
      expect(storage.map.has(APARTMENT_STORAGE_KEY), `${stored} was kept`).toBe(false);
    }
  });

  it('never throws when storage is unavailable', () => {
    const hostile = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };
    expect(readStoredApartment(hostile)).toBeNull();
    expect(() => writeStoredApartment(hostile, 'designaparts1')).not.toThrow();
    expect(readStoredApartment(null)).toBeNull();
    expect(readStoredApartment(undefined)).toBeNull();
  });
});
