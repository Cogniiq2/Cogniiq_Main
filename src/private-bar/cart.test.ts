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

// The fixture products belong to designaparts1. designaparts2 sells something
// else entirely, which is what makes the cross-apartment cases meaningful.
vi.mock('./apartments', async () => {
  const actual = await vi.importActual<typeof import('./apartments')>('./apartments');
  const assignment: Record<string, readonly string[]> = {
    designaparts1: ['wine-a', 'wine-b', 'no-price', 'gone'],
    designaparts2: ['other-wine'],
  };
  return {
    ...actual,
    productBelongsToApartment: (productId: string, key: string) =>
      (assignment[key] ?? []).includes(productId),
  };
});

const { MAX_QUANTITY_PER_PRODUCT } = await import('./pricing');
const {
  cartStorageKey,
  decrement,
  increment,
  parseCart,
  quantityOf,
  readStoredCart,
  reconcileCart,
  remove,
  setQuantity,
  writeStoredCart,
} = await import('./cart');

/** The apartment these fixture products belong to. */
const APT = 'designaparts1' as const;
/** The other apartment, which sells none of them. */
const OTHER = 'designaparts2' as const;
const KEY = cartStorageKey(APT);

function memoryStorage(initial?: string) {
  const map = new Map<string, string>();
  if (initial !== undefined) map.set(KEY, initial);
  return {
    map,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
}

describe('cart operations', () => {
  it('adds, increases and decreases', () => {
    let cart = increment([], APT, 'wine-a');
    expect(quantityOf(cart, 'wine-a')).toBe(1);
    cart = increment(cart, APT, 'wine-a');
    expect(quantityOf(cart, 'wine-a')).toBe(2);
    cart = decrement(cart, APT, 'wine-a');
    expect(quantityOf(cart, 'wine-a')).toBe(1);
  });

  it('removes the line when the quantity reaches zero', () => {
    const cart = decrement(increment([], APT, 'wine-a'), APT, 'wine-a');
    expect(cart).toEqual([]);
    expect(quantityOf(cart, 'wine-a')).toBe(0);
  });

  it('clamps to the maximum quantity instead of growing without bound', () => {
    const cart = setQuantity([], APT, 'wine-a', 999);
    expect(quantityOf(cart, 'wine-a')).toBe(MAX_QUANTITY_PER_PRODUCT);
  });

  it('refuses products that are unknown, unpriced or unavailable', () => {
    expect(setQuantity([], APT, 'not-a-product', 1)).toEqual([]);
    expect(setQuantity([], APT, 'no-price', 1)).toEqual([]);
    expect(setQuantity([], APT, 'gone', 1)).toEqual([]);
  });

  it('keeps line order stable when a quantity changes', () => {
    const cart = increment(increment([], APT, 'wine-a'), APT, 'wine-b');
    const updated = increment(cart, APT, 'wine-a');
    expect(updated.map((l) => l.productId)).toEqual(['wine-a', 'wine-b']);
  });

  it('refuses a product the selected apartment does not sell', () => {
    // Everything about this product is fine — it exists, it is priced, it is
    // available — except that it belongs to the other apartment.
    expect(setQuantity([], OTHER, 'wine-a', 1)).toEqual([]);
    expect(increment([], OTHER, 'wine-a')).toEqual([]);
  });

  it('removes a line outright', () => {
    const cart = increment(increment([], APT, 'wine-a'), APT, 'wine-b');
    expect(remove(cart, 'wine-a').map((l) => l.productId)).toEqual(['wine-b']);
  });
});

describe('live stock as a ceiling', () => {
  it('never lets a quantity exceed what the apartment holds', () => {
    expect(quantityOf(setQuantity([], APT, 'wine-a', 5, 3), 'wine-a')).toBe(3);
    expect(quantityOf(increment(increment([], APT, 'wine-a', 1), APT, 'wine-a', 1), 'wine-a')).toBe(1);
  });

  it('adds nothing at all when stock is zero', () => {
    expect(setQuantity([], APT, 'wine-a', 2, 0)).toEqual([]);
    expect(increment([], APT, 'wine-a', 0)).toEqual([]);
  });

  it('applies the per-product maximum when stock is not yet known', () => {
    expect(quantityOf(setQuantity([], APT, 'wine-a', 999), 'wine-a')).toBe(MAX_QUANTITY_PER_PRODUCT);
  });
});

describe('reconcileCart', () => {
  it('leaves a selection that still fits alone', () => {
    const cart = [{ productId: 'wine-a', quantity: 2 }];
    const result = reconcileCart(cart, { 'wine-a': 5 });
    expect(result.changed).toBe(false);
    expect(result.cart).toBe(cart);
  });

  it('trims a line to what is left', () => {
    const result = reconcileCart([{ productId: 'wine-a', quantity: 4 }], { 'wine-a': 2 });
    expect(result.changed).toBe(true);
    expect(result.cart).toEqual([{ productId: 'wine-a', quantity: 2 }]);
  });

  it('drops a product that has sold out or vanished from inventory', () => {
    const cart = [
      { productId: 'wine-a', quantity: 1 },
      { productId: 'wine-b', quantity: 1 },
    ];
    const result = reconcileCart(cart, { 'wine-a': 1 });
    expect(result.changed).toBe(true);
    expect(result.cart).toEqual([{ productId: 'wine-a', quantity: 1 }]);
  });
});

describe('parseCart', () => {
  it('accepts a well-formed selection', () => {
    expect(parseCart([{ productId: 'wine-a', quantity: 2 }], APT)).toEqual([
      { productId: 'wine-a', quantity: 2 },
    ]);
  });

  it('rejects anything that is not an array of valid lines', () => {
    expect(parseCart(null, APT)).toEqual([]);
    expect(parseCart('nope', APT)).toEqual([]);
    expect(parseCart({ productId: 'wine-a', quantity: 1 }, APT)).toEqual([]);
    expect(parseCart([null, 42, 'x'], APT)).toEqual([]);
  });

  it('drops lines with an invalid quantity rather than repairing them', () => {
    expect(parseCart([{ productId: 'wine-a', quantity: 0 }], APT)).toEqual([]);
    expect(parseCart([{ productId: 'wine-a', quantity: -3 }], APT)).toEqual([]);
    expect(parseCart([{ productId: 'wine-a', quantity: 1.5 }], APT)).toEqual([]);
    expect(parseCart([{ productId: 'wine-a', quantity: 9999 }], APT)).toEqual([]);
    expect(parseCart([{ productId: 'wine-a', quantity: '2' }], APT)).toEqual([]);
  });

  it('drops products that no longer exist, lost their price or went out of stock', () => {
    expect(
      parseCart([
        { productId: 'wine-a', quantity: 1 },
        { productId: 'removed-product', quantity: 1 },
        { productId: 'no-price', quantity: 1 },
        { productId: 'gone', quantity: 1 },
      ], APT)
    ).toEqual([{ productId: 'wine-a', quantity: 1 }]);
  });

  it('drops duplicates instead of summing them', () => {
    expect(
      parseCart([
        { productId: 'wine-a', quantity: 1 },
        { productId: 'wine-a', quantity: 5 },
      ], APT)
    ).toEqual([{ productId: 'wine-a', quantity: 1 }]);
  });
});

describe('apartment isolation', () => {
  it("stores each apartment's selection under its own key", () => {
    expect(cartStorageKey(APT)).not.toBe(cartStorageKey(OTHER));
  });

  it("never reads one apartment's selection back into the other", () => {
    const storage = memoryStorage();
    writeStoredCart(storage, [{ productId: 'wine-a', quantity: 2 }], APT);
    expect(readStoredCart(storage, APT)).toEqual([{ productId: 'wine-a', quantity: 2 }]);
    expect(readStoredCart(storage, OTHER)).toEqual([]);
  });

  it("drops a foreign product even when it was written under this apartment's key", () => {
    const storage = memoryStorage();
    storage.map.set(cartStorageKey(OTHER), JSON.stringify([{ productId: 'wine-a', quantity: 1 }]));
    expect(readStoredCart(storage, OTHER)).toEqual([]);
  });
});

describe('persistence', () => {
  it('round-trips a selection', () => {
    const storage = memoryStorage();
    writeStoredCart(storage, [{ productId: 'wine-a', quantity: 3 }], APT);
    expect(readStoredCart(storage, APT)).toEqual([{ productId: 'wine-a', quantity: 3 }]);
  });

  it('clears the entry when the selection is emptied', () => {
    const storage = memoryStorage(JSON.stringify([{ productId: 'wine-a', quantity: 1 }]));
    writeStoredCart(storage, [], APT);
    expect(storage.map.has(KEY)).toBe(false);
  });

  it('survives corrupt, truncated or foreign stored data', () => {
    expect(readStoredCart(memoryStorage('{not json'), APT)).toEqual([]);
    expect(readStoredCart(memoryStorage('null'), APT)).toEqual([]);
    expect(readStoredCart(memoryStorage('{"lines":[]}'), APT)).toEqual([]);
    expect(readStoredCart(memoryStorage(''), APT)).toEqual([]);
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
    expect(readStoredCart(hostile, APT)).toEqual([]);
    expect(() => writeStoredCart(hostile, [{ productId: 'wine-a', quantity: 1 }], APT)).not.toThrow();
    expect(readStoredCart(null, APT)).toEqual([]);
  });
});
