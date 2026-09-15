import { describe, expect, it } from 'vitest';

import { APARTMENTS, APARTMENT_KEYS, type ApartmentKey } from './apartments';
import {
  CATEGORY_ORDER,
  PRIVATE_BAR_CATALOG,
  availableProducts,
  productById,
  productsByCategory,
  productsForApartment,
} from './catalog';
import { isPurchasable } from './pricing';

const APT: ApartmentKey = 'designaparts2';

describe('Private Bar catalogue', () => {
  it('has unique ids and unique sort orders', () => {
    const ids = PRIVATE_BAR_CATALOG.map((p) => p.id);
    const orders = PRIVATE_BAR_CATALOG.map((p) => p.sortOrder);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it('uses slug-shaped ids that are safe in a URL and in a Stripe line item', () => {
    for (const product of PRIVATE_BAR_CATALOG) {
      expect(product.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it('never carries a fabricated price: a price is either a positive integer or null', () => {
    for (const product of PRIVATE_BAR_CATALOG) {
      if (product.priceCents === null) continue;
      expect(Number.isInteger(product.priceCents)).toBe(true);
      expect(product.priceCents).toBeGreaterThan(0);
    }
  });

  it('makes a product without a configured price unpurchasable', () => {
    for (const product of PRIVATE_BAR_CATALOG) {
      if (product.priceCents === null) expect(isPurchasable(product)).toBe(false);
    }
  });

  it('declares every category in the display order', () => {
    for (const product of PRIVATE_BAR_CATALOG) {
      expect(CATEGORY_ORDER).toContain(product.category);
    }
  });

  it('resolves products by id and returns undefined for anything else', () => {
    expect(productById(PRIVATE_BAR_CATALOG[0].id)?.id).toBe(PRIVATE_BAR_CATALOG[0].id);
    expect(productById('not-a-product')).toBeUndefined();
  });

  it('assigns every catalogue product to exactly one apartment', () => {
    // A product assigned to neither would be invisible; one assigned to both
    // would let either apartment sell a bottle only one of them holds.
    for (const product of PRIVATE_BAR_CATALOG) {
      const owners = APARTMENT_KEYS.filter((key) =>
        APARTMENTS[key].productIds.includes(product.id)
      );
      expect(owners, `${product.id} is assigned to ${owners.length} apartments`).toHaveLength(1);
    }
  });

  it('resolves every assigned product id to a real catalogue entry', () => {
    for (const key of APARTMENT_KEYS) {
      expect(productsForApartment(key).map((p) => p.id).sort()).toEqual(
        [...APARTMENTS[key].productIds].sort()
      );
    }
  });

  it('lists available products in sort order', () => {
    const orders = availableProducts(APT).map((p) => p.sortOrder);
    expect([...orders].sort((a, b) => a - b)).toEqual(orders);
  });

  it('groups every available product exactly once, dropping empty sections', () => {
    const grouped = productsByCategory(APT).flatMap((group) => group.products);
    expect(grouped.map((p) => p.id).sort()).toEqual(availableProducts(APT).map((p) => p.id).sort());
    for (const group of productsByCategory(APT)) expect(group.products.length).toBeGreaterThan(0);
  });
});
