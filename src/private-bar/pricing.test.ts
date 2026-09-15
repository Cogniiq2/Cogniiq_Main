import { describe, expect, it } from 'vitest';

import type { ApartmentKey } from './apartments';
import type { PrivateBarProduct } from './catalog';
import {
  MAX_DISTINCT_LINES,
  MAX_QUANTITY_PER_PRODUCT,
  formatEuro,
  isPurchasable,
  isValidQuantity,
  itemCount,
  priceLines,
  totalCents,
} from './pricing';

/** bayreuther-hell and the other eight legacy products live here. */
const APT: ApartmentKey = 'designaparts2';
const OTHER: ApartmentKey = 'designaparts1';

const base: PrivateBarProduct = {
  id: 'x',
  name: 'X',
  shortLabel: 'X',
  category: 'wine',
  origin: null,
  volume: null,
  priceCents: 450,
  image: null,
  available: true,
  sortOrder: 1,
};

describe('isPurchasable', () => {
  it('requires availability and a configured, positive price', () => {
    expect(isPurchasable(base)).toBe(true);
    expect(isPurchasable({ ...base, priceCents: null })).toBe(false);
    expect(isPurchasable({ ...base, priceCents: 0 })).toBe(false);
    expect(isPurchasable({ ...base, available: false })).toBe(false);
  });
});

describe('isValidQuantity', () => {
  it('accepts whole numbers inside the bounds only', () => {
    expect(isValidQuantity(1)).toBe(true);
    expect(isValidQuantity(MAX_QUANTITY_PER_PRODUCT)).toBe(true);
    expect(isValidQuantity(0)).toBe(false);
    expect(isValidQuantity(-1)).toBe(false);
    expect(isValidQuantity(1.5)).toBe(false);
    expect(isValidQuantity(MAX_QUANTITY_PER_PRODUCT + 1)).toBe(false);
    expect(isValidQuantity(Number.NaN)).toBe(false);
  });
});

describe('priceLines', () => {
  it('rejects an empty selection', () => {
    expect(priceLines([], APT)).toEqual({ ok: false, reason: 'empty_selection' });
  });

  it('rejects an unknown product rather than skipping it', () => {
    const result = priceLines([{ productId: 'not-a-product', quantity: 1 }], APT);
    expect(result).toEqual({ ok: false, reason: 'unknown_product' });
  });

  it('prices a line from the catalogue', () => {
    const result = priceLines([{ productId: 'bayreuther-hell', quantity: 2 }], APT);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const unit = result.lines[0].unitAmountCents;
    expect(unit).toBeGreaterThan(0);
    expect(result.lines[0].amountCents).toBe(unit * 2);
  });

  it('rejects a product the selected apartment does not sell', () => {
    // A real, priced, available product — from the OTHER apartment. Deliberately
    // NOT the beer: that one is stocked in both, so it would prove nothing here.
    expect(priceLines([{ productId: 's-pellegrino', quantity: 1 }], OTHER)).toEqual({
      ok: false,
      reason: 'product_not_in_apartment',
    });
    expect(priceLines([{ productId: 'planeta-plumbago-nero-davola-2021', quantity: 1 }], APT)).toEqual({
      ok: false,
      reason: 'product_not_in_apartment',
    });
  });

  it('prices a shared product identically in both apartments', () => {
    // Same catalogue entry, same engine: the apartment decides availability,
    // never the amount.
    for (const apartment of [APT, OTHER]) {
      const result = priceLines([{ productId: 'bayreuther-hell', quantity: 2 }], apartment);
      expect(result.ok, apartment).toBe(true);
      if (!result.ok) continue;
      expect(result.lines[0].unitAmountCents).toBe(450);
      expect(totalCents(result.lines)).toBe(900);
    }
  });

  it('prices designAparts I baskets through this same engine', () => {
    // 2 × 18,00 € Planeta + 1 × 14,00 € Cavalchina = 50,00 €, derived here
    // rather than written down: there is no second calculator.
    const result = priceLines(
      [
        { productId: 'planeta-plumbago-nero-davola-2021', quantity: 2 },
        { productId: 'cavalchina-custoza-2025', quantity: 1 },
      ],
      OTHER
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(totalCents(result.lines)).toBe(5000);
  });

  it('rejects duplicate lines and oversized selections', () => {
    expect(priceLines([
      { productId: 'bayreuther-hell', quantity: 1 },
      { productId: 'bayreuther-hell', quantity: 1 },
    ], APT)).toEqual({ ok: false, reason: 'duplicate_line' });

    const tooMany = Array.from({ length: MAX_DISTINCT_LINES + 1 }, (_, i) => ({
      productId: `p-${i}`,
      quantity: 1,
    }));
    expect(priceLines(tooMany, APT)).toEqual({ ok: false, reason: 'too_many_lines' });
  });
});

describe('totals', () => {
  it('multiplies in integer cents and never in floating point', () => {
    const lines = [
      { product: base, quantity: 3, unitAmountCents: 450, amountCents: 1350 },
      { product: base, quantity: 1, unitAmountCents: 1990, amountCents: 1990 },
    ];
    expect(totalCents(lines)).toBe(3340);
    expect(Number.isInteger(totalCents(lines))).toBe(true);
  });

  it('counts items, not lines', () => {
    expect(itemCount([
      { productId: 'a', quantity: 2 },
      { productId: 'b', quantity: 1 },
    ])).toBe(3);
  });
});

describe('formatEuro', () => {
  it('formats German currency from integer cents', () => {
    // Intl separates the amount from the symbol with a no-break space, which
    // varies by ICU build, so it is normalised rather than hard-coded.
    const normalise = (value: string) => value.replace(/\s/g, ' ');
    expect(normalise(formatEuro(1350))).toBe('13,50 €');
    expect(normalise(formatEuro(0))).toBe('0,00 €');
  });
});
