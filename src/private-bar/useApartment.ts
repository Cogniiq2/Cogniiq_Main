// ─────────────────────────────────────────────────────────────────────────────
// Which apartment the guest is in.
//
// Remembered for the BROWSING SESSION only (sessionStorage), never permanently:
// a guest who returns for an unrelated stay must be asked again rather than
// silently served the previous apartment's bar.
//
// Whatever comes back from storage is UNTRUSTED — an older release, a hand-
// edited value, a stale key. It is validated against the allow-list in
// ./apartments.ts on every read, and anything that does not resolve is REMOVED
// and the guest is returned to the selection gate.
// ─────────────────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

import { isApartmentKey, type ApartmentKey } from './apartments';

export const APARTMENT_STORAGE_KEY = 'bolagio:private-bar:apartment:v1';

/** Minimal surface of `sessionStorage`, so tests need no DOM. */
export interface ApartmentStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Reads the remembered apartment, discarding anything that is not one of the
 * two public keys. A tampered value is removed rather than repaired.
 */
export function readStoredApartment(storage: ApartmentStorage | null | undefined): ApartmentKey | null {
  if (!storage) return null;
  let raw: string | null;
  try {
    raw = storage.getItem(APARTMENT_STORAGE_KEY);
  } catch {
    return null;
  }
  if (raw === null) return null;
  if (isApartmentKey(raw)) return raw;

  try {
    storage.removeItem(APARTMENT_STORAGE_KEY);
  } catch {
    // Storage that refuses to forget must not break the page.
  }
  return null;
}

export function writeStoredApartment(
  storage: ApartmentStorage | null | undefined,
  apartment: ApartmentKey | null
): void {
  if (!storage) return;
  try {
    if (apartment === null) storage.removeItem(APARTMENT_STORAGE_KEY);
    else storage.setItem(APARTMENT_STORAGE_KEY, apartment);
  } catch {
    // A blocked or full storage costs the guest one extra tap, nothing more.
  }
}

/**
 * useLayoutEffect in the browser, useEffect on the server.
 *
 * The apartment decides which tree is rendered, so restoring it has to happen
 * BEFORE the browser paints the hydrated result — otherwise a guest who already
 * chose would watch the selection gate flash past on every navigation. React
 * warns about useLayoutEffect during server rendering, where it would never run
 * anyway, so the server gets the plain effect.
 */
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

function sessionStore(): ApartmentStorage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null; // blocked storage: the selection simply does not survive a reload
  }
}

export interface ApartmentSelection {
  /** null means: ask. The catalogue is not rendered until this is set. */
  readonly apartment: ApartmentKey | null;
  /** False until storage has been read. The gate does not wait for it — an
   *  unanswered gate IS the correct default, and it is what the prerendered
   *  document carries, so a guest arriving by QR code reads the question
   *  immediately rather than an empty page. */
  readonly ready: boolean;
  select(apartment: ApartmentKey): void;
  clear(): void;
}

/**
 * SSR-safe by construction: nothing is read during render. The page is
 * prerendered, so the first client render must match the server's — which means
 * starting with no apartment and resolving it in an effect.
 */
export function useApartmentSelection(): ApartmentSelection {
  const [apartment, setApartment] = useState<ApartmentKey | null>(null);
  const [ready, setReady] = useState(false);

  useIsomorphicLayoutEffect(() => {
    setApartment(readStoredApartment(sessionStore()));
    setReady(true);
  }, []);

  const select = useCallback((next: ApartmentKey) => {
    writeStoredApartment(sessionStore(), next);
    setApartment(next);
  }, []);

  const clear = useCallback(() => {
    writeStoredApartment(sessionStore(), null);
    setApartment(null);
  }, []);

  return { apartment, ready, select, clear };
}
