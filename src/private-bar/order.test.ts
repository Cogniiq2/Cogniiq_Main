import { describe, expect, it } from 'vitest';

import { PRIVATE_BAR_CATALOG, productById } from './catalog';
import { buildTrustedOrder, isValidClientOrderId } from './order';
import { MAX_QUANTITY_PER_PRODUCT } from './pricing';

const APARTMENT = 'test-apartment';
const ORDER_ID = '11111111-2222-4333-8444-555555555555';
const BEER = 'bayreuther-hell';
const WATER = 's-pellegrino';

function body(overrides: Record<string, unknown> = {}) {
  return {
    apartmentId: APARTMENT,
    clientOrderId: ORDER_ID,
    items: [{ productId: BEER, quantity: 2 }],
    ...overrides,
  };
}

describe('trusted order', () => {
  it('prices the order from the catalogue, never from the request', () => {
    const malicious = body({
      items: [
        {
          productId: BEER,
          quantity: 2,
          // Everything below is what an attacker would send. None of it is read.
          unitAmountCents: 1,
          amountCents: 2,
          price: 1,
          total: 100,
          name: 'Free beer',
        },
      ],
      totalCents: 1,
      total: 1,
    });

    const result = buildTrustedOrder(malicious, APARTMENT);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const unit = productById(BEER)!.priceCents!;
    expect(result.order.items[0].unit_amount_cents).toBe(unit);
    expect(result.order.items[0].amount_cents).toBe(unit * 2);
    expect(result.order.totalCents).toBe(unit * 2);
    expect(result.order.totalCents).not.toBe(1);
  });

  it('totals several lines in integer cents', () => {
    const result = buildTrustedOrder(
      body({
        items: [
          { productId: BEER, quantity: 3 },
          { productId: WATER, quantity: 1 },
        ],
      }),
      APARTMENT
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const expected = productById(BEER)!.priceCents! * 3 + productById(WATER)!.priceCents! * 1;
    expect(result.order.totalCents).toBe(expected);
    expect(Number.isInteger(result.order.totalCents)).toBe(true);
  });

  it('rejects an order for another apartment', () => {
    expect(buildTrustedOrder(body({ apartmentId: 'somewhere-else' }), APARTMENT)).toEqual({
      ok: false,
      reason: 'unknown_apartment',
    });
  });

  it('rejects an unusable client order id', () => {
    for (const clientOrderId of ['', 'abc', 42, null, '11111111-2222-3333-4444-555555555555']) {
      expect(buildTrustedOrder(body({ clientOrderId }), APARTMENT)).toEqual({
        ok: false,
        reason: 'invalid_order_id',
      });
    }
  });

  it('rejects malformed bodies rather than interpreting them', () => {
    for (const value of [null, 'nope', 42, [], { apartmentId: APARTMENT }]) {
      const result = buildTrustedOrder(value, APARTMENT);
      expect(result.ok).toBe(false);
    }
    expect(buildTrustedOrder(body({ items: 'two beers' }), APARTMENT)).toEqual({
      ok: false,
      reason: 'malformed_request',
    });
    expect(buildTrustedOrder(body({ items: [{ productId: BEER }] }), APARTMENT)).toEqual({
      ok: false,
      reason: 'malformed_request',
    });
  });

  it('rejects an empty, duplicated or oversized selection', () => {
    expect(buildTrustedOrder(body({ items: [] }), APARTMENT)).toEqual({
      ok: false,
      reason: 'empty_selection',
    });
    expect(
      buildTrustedOrder(
        body({
          items: [
            { productId: BEER, quantity: 1 },
            { productId: BEER, quantity: 1 },
          ],
        }),
        APARTMENT
      )
    ).toEqual({ ok: false, reason: 'duplicate_line' });
    expect(
      buildTrustedOrder(
        body({ items: Array.from({ length: 21 }, (_, i) => ({ productId: `p-${i}`, quantity: 1 })) }),
        APARTMENT
      )
    ).toEqual({ ok: false, reason: 'too_many_lines' });
  });

  it('rejects unknown products and impossible quantities', () => {
    expect(buildTrustedOrder(body({ items: [{ productId: 'ghost', quantity: 1 }] }), APARTMENT)).toEqual({
      ok: false,
      reason: 'unknown_product',
    });
    for (const quantity of [0, -1, 1.5, Number.NaN, MAX_QUANTITY_PER_PRODUCT + 1]) {
      expect(buildTrustedOrder(body({ items: [{ productId: BEER, quantity }] }), APARTMENT)).toEqual({
        ok: false,
        reason: 'invalid_quantity',
      });
    }
  });

  it('accepts every product in the shipped catalogue', () => {
    for (const product of PRIVATE_BAR_CATALOG) {
      const result = buildTrustedOrder(body({ items: [{ productId: product.id, quantity: 1 }] }), APARTMENT);
      expect(result.ok, `${product.id} was rejected`).toBe(true);
    }
  });
});

describe('client order id', () => {
  it('accepts a v4 UUID only', () => {
    expect(isValidClientOrderId(ORDER_ID)).toBe(true);
    expect(isValidClientOrderId('11111111222243338444555555555555')).toBe(false);
    expect(isValidClientOrderId(undefined)).toBe(false);
  });
});
