import { describe, expect, it, vi } from 'vitest';

// The live catalogue has no configured prices yet, so nothing in it is
// orderable — which is exactly the guard the guest interface relies on. These
// tests need priced products, so the catalogue is replaced with a fixture.
vi.mock('./catalog', async () => {
  const actual = await vi.importActual<typeof import('./catalog')>('./catalog');
  const make = (id: string, priceCents: number | null, available = true) => ({
    id,
    name: id,
    shortLabel: id,
    category: 'wine' as const,
    origin: null,
    volume: null,
    priceCents,
    image: null,
    available,
    sortOrder: 1,
  });
  const catalogue = [make('wine-a', 450), make('wine-b', 1290), make('no-price', null), make('gone', 500, false)];
  return {
    ...actual,
    PRIVATE_BAR_CATALOG: catalogue,
    productById: (id: string) => catalogue.find((p) => p.id === id),
  };
});

const { MAX_QUANTITY_PER_PRODUCT } = await import('./pricing');
const {
  CART_STORAGE_KEY,
  decrement,
  increment,
  parseCart,
  quantityOf,
  readStoredCart,
  remove,
  setQuantity,
  writeStoredCart,
} = await import('./cart');

function memoryStorage(initial?: string) {
  const map = new Map<string, string>();
  if (initial !== undefined) map.set(CART_STORAGE_KEY, initial);
  return {
    map,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
}

describe('cart operations', () => {
  it('adds, increases and decreases', () => {
    let cart = increment([], 'wine-a');
    expect(quantityOf(cart, 'wine-a')).toBe(1);
    cart = increment(cart, 'wine-a');
    expect(quantityOf(cart, 'wine-a')).toBe(2);
    cart = decrement(cart, 'wine-a');
    expect(quantityOf(cart, 'wine-a')).toBe(1);
  });

  it('removes the line when the quantity reaches zero', () => {
    const cart = decrement(increment([], 'wine-a'), 'wine-a');
    expect(cart).toEqual([]);
    expect(quantityOf(cart, 'wine-a')).toBe(0);
  });

  it('clamps to the maximum quantity instead of growing without bound', () => {
    const cart = setQuantity([], 'wine-a', 999);
    expect(quantityOf(cart, 'wine-a')).toBe(MAX_QUANTITY_PER_PRODUCT);
  });

  it('refuses products that are unknown, unpriced or unavailable', () => {
    expect(setQuantity([], 'not-a-product', 1)).toEqual([]);
    expect(setQuantity([], 'no-price', 1)).toEqual([]);
    expect(setQuantity([], 'gone', 1)).toEqual([]);
  });

  it('keeps line order stable when a quantity changes', () => {
    const cart = increment(increment([], 'wine-a'), 'wine-b');
    const updated = increment(cart, 'wine-a');
    expect(updated.map((l) => l.productId)).toEqual(['wine-a', 'wine-b']);
  });

  it('removes a line outright', () => {
    const cart = increment(increment([], 'wine-a'), 'wine-b');
    expect(remove(cart, 'wine-a').map((l) => l.productId)).toEqual(['wine-b']);
  });
});

describe('parseCart', () => {
  it('accepts a well-formed selection', () => {
    expect(parseCart([{ productId: 'wine-a', quantity: 2 }])).toEqual([
      { productId: 'wine-a', quantity: 2 },
    ]);
  });

  it('rejects anything that is not an array of valid lines', () => {
    expect(parseCart(null)).toEqual([]);
    expect(parseCart('nope')).toEqual([]);
    expect(parseCart({ productId: 'wine-a', quantity: 1 })).toEqual([]);
    expect(parseCart([null, 42, 'x'])).toEqual([]);
  });

  it('drops lines with an invalid quantity rather than repairing them', () => {
    expect(parseCart([{ productId: 'wine-a', quantity: 0 }])).toEqual([]);
    expect(parseCart([{ productId: 'wine-a', quantity: -3 }])).toEqual([]);
    expect(parseCart([{ productId: 'wine-a', quantity: 1.5 }])).toEqual([]);
    expect(parseCart([{ productId: 'wine-a', quantity: 9999 }])).toEqual([]);
    expect(parseCart([{ productId: 'wine-a', quantity: '2' }])).toEqual([]);
  });

  it('drops products that no longer exist, lost their price or went out of stock', () => {
    expect(
      parseCart([
        { productId: 'wine-a', quantity: 1 },
        { productId: 'removed-product', quantity: 1 },
        { productId: 'no-price', quantity: 1 },
        { productId: 'gone', quantity: 1 },
      ])
    ).toEqual([{ productId: 'wine-a', quantity: 1 }]);
  });

  it('drops duplicates instead of summing them', () => {
    expect(
      parseCart([
        { productId: 'wine-a', quantity: 1 },
        { productId: 'wine-a', quantity: 5 },
      ])
    ).toEqual([{ productId: 'wine-a', quantity: 1 }]);
  });
});

describe('persistence', () => {
  it('round-trips a selection', () => {
    const storage = memoryStorage();
    writeStoredCart(storage, [{ productId: 'wine-a', quantity: 3 }]);
    expect(readStoredCart(storage)).toEqual([{ productId: 'wine-a', quantity: 3 }]);
  });

  it('clears the entry when the selection is emptied', () => {
    const storage = memoryStorage(JSON.stringify([{ productId: 'wine-a', quantity: 1 }]));
    writeStoredCart(storage, []);
    expect(storage.map.has(CART_STORAGE_KEY)).toBe(false);
  });

  it('survives corrupt, truncated or foreign stored data', () => {
    expect(readStoredCart(memoryStorage('{not json'))).toEqual([]);
    expect(readStoredCart(memoryStorage('null'))).toEqual([]);
    expect(readStoredCart(memoryStorage('{"lines":[]}'))).toEqual([]);
    expect(readStoredCart(memoryStorage(''))).toEqual([]);
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
    expect(readStoredCart(hostile)).toEqual([]);
    expect(() => writeStoredCart(hostile, [{ productId: 'wine-a', quantity: 1 }])).not.toThrow();
    expect(readStoredCart(null)).toEqual([]);
  });
});
