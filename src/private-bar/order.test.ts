import { describe, expect, it } from 'vitest';

import { APARTMENTS, APARTMENT_KEYS } from './apartments';
import { productById } from './catalog';
import { buildTrustedOrder, isValidClientOrderId } from './order';
import { MAX_QUANTITY_PER_PRODUCT } from './pricing';

/** The public key the browser sends. BEER and WATER are sold here. */
const APARTMENT = 'designaparts2';
/** The other apartment, which sells neither of them. */
const OTHER = 'designaparts1';
const PLANETA = 'planeta-plumbago-nero-davola-2021';
const ORDER_ID = '11111111-2222-4333-8444-555555555555';
const BEER = 'bayreuther-hell';
const WATER = 's-pellegrino';

function body(overrides: Record<string, unknown> = {}) {
  return {
    apartment: APARTMENT,
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

    const result = buildTrustedOrder(malicious);
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
      })
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const expected = productById(BEER)!.priceCents! * 3 + productById(WATER)!.priceCents! * 1;
    expect(result.order.totalCents).toBe(expected);
    expect(Number.isInteger(result.order.totalCents)).toBe(true);
  });

  it('resolves the public apartment key to the canonical internal id', () => {
    const result = buildTrustedOrder(body());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.order.apartment).toBe('designaparts2');
    expect(result.order.apartmentId).toBe('bolagio-apartment-1');

    const first = buildTrustedOrder(body({ apartment: OTHER, items: [{ productId: PLANETA, quantity: 1 }] }));
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.order.apartmentId).toBe('bolagio-designaparts-1');
  });

  it('fails closed on any apartment that is not a known public key', () => {
    for (const apartment of [
      'somewhere-else',
      // A canonical internal id is NOT an accepted input: only the public key is.
      'bolagio-apartment-1',
      'bolagio-designaparts-1',
      'DESIGNAPARTS1',
      '',
      42,
      null,
      undefined,
      { key: 'designaparts1' },
      '__proto__',
      'constructor',
    ]) {
      expect(buildTrustedOrder(body({ apartment }))).toEqual({
        ok: false,
        reason: 'unknown_apartment',
      });
    }
  });

  it('refuses a product that belongs to the other apartment', () => {
    // The whole point of the server-side assignment: selecting designAparts I
    // and posting a designAparts II SKU (or the reverse) buys nothing.
    expect(
      buildTrustedOrder(body({ apartment: OTHER, items: [{ productId: BEER, quantity: 1 }] }))
    ).toEqual({ ok: false, reason: 'product_not_in_apartment' });
    expect(buildTrustedOrder(body({ items: [{ productId: PLANETA, quantity: 1 }] }))).toEqual({
      ok: false,
      reason: 'product_not_in_apartment',
    });
    // Not even mixed into an otherwise valid basket.
    expect(
      buildTrustedOrder(
        body({ items: [{ productId: BEER, quantity: 1 }, { productId: PLANETA, quantity: 1 }] })
      )
    ).toEqual({ ok: false, reason: 'product_not_in_apartment' });
  });

  it('prices the designAparts I wines at exactly the owner-set amounts', () => {
    const expected: Record<string, number> = {
      'planeta-plumbago-nero-davola-2021': 1800,
      'ottella-rosesroses': 1700,
      'cavalchina-custoza-2025': 1400,
      'nunzio-ghiraldi-il-gruccione': 1900,
      'manz-grauburgunder-fruchtecke': 1400,
    };
    for (const [productId, cents] of Object.entries(expected)) {
      const result = buildTrustedOrder(
        body({ apartment: OTHER, items: [{ productId, quantity: 1 }] })
      );
      expect(result.ok, `${productId} was rejected`).toBe(true);
      if (!result.ok) continue;
      expect(result.order.items[0].unit_amount_cents).toBe(cents);
      expect(result.order.totalCents).toBe(cents);
    }
  });

  it('rejects an unusable client order id', () => {
    for (const clientOrderId of ['', 'abc', 42, null, '11111111-2222-3333-4444-555555555555']) {
      expect(buildTrustedOrder(body({ clientOrderId }))).toEqual({
        ok: false,
        reason: 'invalid_order_id',
      });
    }
  });

  it('rejects malformed bodies rather than interpreting them', () => {
    for (const value of [null, 'nope', 42, [], { apartment: APARTMENT }]) {
      const result = buildTrustedOrder(value);
      expect(result.ok).toBe(false);
    }
    expect(buildTrustedOrder(body({ items: 'two beers' }))).toEqual({
      ok: false,
      reason: 'malformed_request',
    });
    expect(buildTrustedOrder(body({ items: [{ productId: BEER }] }))).toEqual({
      ok: false,
      reason: 'malformed_request',
    });
  });

  it('rejects an empty, duplicated or oversized selection', () => {
    expect(buildTrustedOrder(body({ items: [] }))).toEqual({
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
        })
      )
    ).toEqual({ ok: false, reason: 'duplicate_line' });
    expect(
      buildTrustedOrder(
        body({ items: Array.from({ length: 21 }, (_, i) => ({ productId: `p-${i}`, quantity: 1 })) })
      )
    ).toEqual({ ok: false, reason: 'too_many_lines' });
  });

  it('rejects unknown products and impossible quantities', () => {
    expect(buildTrustedOrder(body({ items: [{ productId: 'ghost', quantity: 1 }] }))).toEqual({
      ok: false,
      reason: 'unknown_product',
    });
    for (const quantity of [0, -1, 1.5, Number.NaN, MAX_QUANTITY_PER_PRODUCT + 1]) {
      expect(buildTrustedOrder(body({ items: [{ productId: BEER, quantity }] }))).toEqual({
        ok: false,
        reason: 'invalid_quantity',
      });
    }
  });

  it('accepts every product each apartment actually sells', () => {
    for (const apartment of APARTMENT_KEYS) {
      for (const productId of APARTMENTS[apartment].productIds) {
        const result = buildTrustedOrder(body({ apartment, items: [{ productId, quantity: 1 }] }));
        expect(result.ok, `${apartment}/${productId} was rejected`).toBe(true);
      }
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
