import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  EMPTY_CART,
  decrement,
  increment,
  quantityOf,
  readStoredCart,
  remove,
  setQuantity,
  writeStoredCart,
  type Cart,
} from './cart';
import { priceLines, totalCents, type PricedLine } from './pricing';

function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null; // storage blocked: the selection simply does not survive a reload.
  }
}

export interface CartController {
  readonly cart: Cart;
  /** Priced, catalogue-resolved lines, in the order they were selected. */
  readonly lines: readonly PricedLine[];
  readonly totalCents: number;
  readonly itemCount: number;
  /** False during the first render and on the server, so nothing pops in mid-hydration. */
  readonly ready: boolean;
  quantityOf(productId: string): number;
  add(productId: string): void;
  subtract(productId: string): void;
  removeLine(productId: string): void;
  setLineQuantity(productId: string, quantity: number): void;
  clear(): void;
}

/**
 * The selection, persisted locally.
 *
 * Deliberately starts EMPTY on the server and on the first client render, and
 * only then loads from storage: the page is prerendered, so reading storage
 * during render would both crash the build and hand React a different tree than
 * the one it is hydrating.
 */
export function useCart(): CartController {
  const [cart, setCart] = useState<Cart>(EMPTY_CART);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCart(readStoredCart(browserStorage()));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return; // never overwrite storage with the pre-load empty state
    writeStoredCart(browserStorage(), cart);
  }, [cart, ready]);

  const priced = useMemo(() => {
    const result = priceLines(cart);
    return result.ok ? result.lines : [];
  }, [cart]);

  return {
    cart,
    lines: priced,
    totalCents: useMemo(() => totalCents(priced), [priced]),
    itemCount: useMemo(() => cart.reduce((sum, line) => sum + line.quantity, 0), [cart]),
    ready,
    quantityOf: useCallback((productId: string) => quantityOf(cart, productId), [cart]),
    add: useCallback((productId: string) => setCart((c) => increment(c, productId)), []),
    subtract: useCallback((productId: string) => setCart((c) => decrement(c, productId)), []),
    removeLine: useCallback((productId: string) => setCart((c) => remove(c, productId)), []),
    setLineQuantity: useCallback(
      (productId: string, quantity: number) => setCart((c) => setQuantity(c, productId, quantity)),
      []
    ),
    clear: useCallback(() => setCart(EMPTY_CART), []),
  };
}
