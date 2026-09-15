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

  it('assigns every catalogue product to at least one apartment', () => {
    // A product assigned to neither would be invisible — priced, maintained and
    // unreachable.
    for (const product of PRIVATE_BAR_CATALOG) {
      const owners = APARTMENT_KEYS.filter((key) =>
        APARTMENTS[key].productIds.includes(product.id)
      );
      expect(owners.length, `${product.id} is assigned to no apartment`).toBeGreaterThan(0);
    }
  });

  it('shares exactly one product between the apartments, deliberately', () => {
    // Bayreuther Hell stands in both apartments, so it is ONE catalogue entry
    // sold in two places — same id, price, card and photograph — rather than a
    // copy that could drift. Anything else appearing in both lists would be an
    // accident, so it is asserted rather than tolerated.
    const shared = PRIVATE_BAR_CATALOG.filter((product) =>
      APARTMENT_KEYS.every((key) => APARTMENTS[key].productIds.includes(product.id))
    ).map((product) => product.id);
    expect(shared).toEqual(['bayreuther-hell']);
  });

  it('resolves every assigned product id to a real catalogue entry', () => {
    for (const key of APARTMENT_KEYS) {
      expect(productsForApartment(key).map((p) => p.id).sort()).toEqual(
        [...APARTMENTS[key].productIds].sort()
      );
    }
  });

  it('ships prepared photography for every product, and honest metadata with it', () => {
    // No product is left on the "Foto folgt" state, and every image declares a
    // real intrinsic size — that is what reserves the layout before the file
    // arrives and keeps cumulative layout shift at zero.
    for (const product of PRIVATE_BAR_CATALOG) {
      const image = product.image;
      expect(image, `${product.id} has no photograph`).not.toBeNull();
      if (!image) continue;
      expect(image.basePath).toBe(`/private-bar/products/${product.id}`);
      expect(image.widths).toEqual([240, 480]);
      expect(image.width).toBe(240);
      expect(Number.isInteger(image.height)).toBe(true);
      expect(image.height).toBeGreaterThan(240);
    }
  });

  it('gives each apartment the catalogue the owner stocked', () => {
    expect(productsForApartment('designaparts1')).toHaveLength(6);
    expect(productsForApartment('designaparts2')).toHaveLength(9);
  });

  it('hands both apartments the identical object for a shared product', () => {
    // Not a copy: the same catalogue entry, so a price or photograph can only
    // ever be changed in one place.
    const inOne = productsForApartment('designaparts1').find((p) => p.id === 'bayreuther-hell');
    const inTwo = productsForApartment('designaparts2').find((p) => p.id === 'bayreuther-hell');
    expect(inOne).toBeDefined();
    expect(inOne).toBe(inTwo);
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
