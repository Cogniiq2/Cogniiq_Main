// ─────────────────────────────────────────────────────────────────────────────
// The guest's selection.
//
// Pure functions over a plain array, plus a schema-safe reader/writer for
// browser storage. No React, no side effects at import time — so the reducer is
// exhaustively unit-testable and the page stays safe to prerender.
//
// Storage discipline: whatever comes back from the browser is UNTRUSTED. It may
// be from an older release, hand-edited, truncated, or written by a product that
// has since been removed from the catalogue or lost its price. Every line is
// re-validated against the live catalogue on read, and anything that does not
// validate is dropped rather than repaired — a wrong quantity is worse than a
// forgotten one.
// ─────────────────────────────────────────────────────────────────────────────
import { productById } from './catalog';
import { MAX_DISTINCT_LINES, MAX_QUANTITY_PER_PRODUCT, isPurchasable, isValidQuantity } from './pricing';

export interface CartLine {
  readonly productId: string;
  readonly quantity: number;
}

export type Cart = readonly CartLine[];

export const EMPTY_CART: Cart = [];

/** Version is part of the key: a schema change starts from an empty selection
 *  instead of trying to migrate a shopping list that is worth nothing. */
export const CART_STORAGE_KEY = 'bolagio:private-bar:cart:v1';

/** Minimal surface of `localStorage`, so tests need no DOM. */
export interface CartStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function isOrderable(productId: string): boolean {
  const product = productById(productId);
  return product !== undefined && isPurchasable(product);
}

/** Sets an absolute quantity. 0 (or less) removes the line. */
export function setQuantity(cart: Cart, productId: string, quantity: number): Cart {
  if (!isOrderable(productId)) return cart;

  const clamped = Math.min(Math.max(Math.trunc(quantity), 0), MAX_QUANTITY_PER_PRODUCT);
  const without = cart.filter((line) => line.productId !== productId);
  if (clamped === 0) return without;
  if (!cart.some((line) => line.productId === productId) && without.length >= MAX_DISTINCT_LINES) {
    return cart;
  }

  // Existing lines keep their position: a quantity change must never make the
  // review sheet reorder itself under the guest's finger.
  return cart.some((line) => line.productId === productId)
    ? cart.map((line) => (line.productId === productId ? { productId, quantity: clamped } : line))
    : [...cart, { productId, quantity: clamped }];
}

export function quantityOf(cart: Cart, productId: string): number {
  return cart.find((line) => line.productId === productId)?.quantity ?? 0;
}

export function increment(cart: Cart, productId: string): Cart {
  return setQuantity(cart, productId, quantityOf(cart, productId) + 1);
}

export function decrement(cart: Cart, productId: string): Cart {
  return setQuantity(cart, productId, quantityOf(cart, productId) - 1);
}

export function remove(cart: Cart, productId: string): Cart {
  return cart.filter((line) => line.productId !== productId);
}

/**
 * Validates an unknown value into a Cart.
 *
 * Exported for the storage reader and for tests; it is the only place where
 * untrusted data becomes a Cart.
 */
export function parseCart(value: unknown): Cart {
  if (!Array.isArray(value)) return EMPTY_CART;

  const seen = new Set<string>();
  const lines: CartLine[] = [];

  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null) continue;
    const { productId, quantity } = entry as { productId?: unknown; quantity?: unknown };
    if (typeof productId !== 'string' || typeof quantity !== 'number') continue;
    if (seen.has(productId) || !isOrderable(productId) || !isValidQuantity(quantity)) continue;
    if (lines.length >= MAX_DISTINCT_LINES) break;
    seen.add(productId);
    lines.push({ productId, quantity });
  }

  return lines;
}

/** Reads the persisted selection. Never throws: storage can be unavailable
 *  (private mode, blocked cookies) and that must not break the page. */
export function readStoredCart(storage: CartStorage | null | undefined): Cart {
  if (!storage) return EMPTY_CART;
  let raw: string | null;
  try {
    raw = storage.getItem(CART_STORAGE_KEY);
  } catch {
    return EMPTY_CART;
  }
  if (!raw) return EMPTY_CART;

  try {
    return parseCart(JSON.parse(raw));
  } catch {
    return EMPTY_CART;
  }
}

/** Persists the selection, removing the entry entirely when it is empty. */
export function writeStoredCart(storage: CartStorage | null | undefined, cart: Cart): void {
  if (!storage) return;
  try {
    if (cart.length === 0) storage.removeItem(CART_STORAGE_KEY);
    else storage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // A full or blocked storage must never interrupt the guest.
  }
}
