// ─────────────────────────────────────────────────────────────────────────────
// The trusted order request.
//
// This module is the SERVER's view of a confirmation: it takes an untrusted
// request body and either produces a fully priced order derived from the
// catalogue, or a typed rejection. It is framework-free (no React, no DOM, no
// `import.meta.env`) so the Cloudflare Function imports it directly — verified:
// `wrangler pages functions build` bundles it and inlines the catalogue.
//
// THE RULE THIS MODULE EXISTS TO ENFORCE: the browser sends product ids and
// quantities. Nothing else from the request is ever used to compute money. A
// body carrying `unitAmountCents`, `total`, `price` or a product name is not
// rejected for containing them — those fields are simply never read, so
// {productId, quantity: 2, total: 100} buys nothing at a discount.
// ─────────────────────────────────────────────────────────────────────────────
import { productById } from './catalog';
import {
  CURRENCY,
  MAX_DISTINCT_LINES,
  isPurchasable,
  isValidQuantity,
  type CartLine,
} from './pricing';

/** Machine-readable rejection reasons. The guest never sees these strings. */
export type OrderRejection =
  | 'malformed_request'
  | 'unknown_apartment'
  | 'invalid_order_id'
  | 'empty_selection'
  | 'too_many_lines'
  | 'duplicate_line'
  | 'unknown_product'
  | 'product_not_purchasable'
  | 'invalid_quantity';

export interface TrustedOrderItem {
  readonly product_id: string;
  readonly quantity: number;
  /** Derived from the catalogue. Never read from the request. */
  readonly unit_amount_cents: number;
  readonly amount_cents: number;
}

export interface TrustedOrder {
  readonly apartmentId: string;
  readonly clientOrderId: string;
  readonly items: readonly TrustedOrderItem[];
  readonly totalCents: number;
  readonly currency: typeof CURRENCY;
}

export type OrderResult =
  | { readonly ok: true; readonly order: TrustedOrder }
  | { readonly ok: false; readonly reason: OrderRejection };

/** A v4-shaped UUID. The id is a nonce, so its only requirement is that it
 *  cannot be crafted into something surprising downstream. */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidClientOrderId(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

function readLines(value: unknown): CartLine[] | null {
  if (!Array.isArray(value)) return null;
  const lines: CartLine[] = [];
  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null) return null;
    const record = entry as Record<string, unknown>;
    // Only these two fields are read. Anything else the client sent — a price,
    // a total, a name — is ignored rather than trusted.
    const productId = record.productId;
    const quantity = record.quantity;
    if (typeof productId !== 'string' || typeof quantity !== 'number') return null;
    lines.push({ productId, quantity });
  }
  return lines;
}

/**
 * Validates and prices an untrusted confirmation request.
 *
 * @param body           the parsed JSON request body, entirely untrusted
 * @param knownApartment the apartment this deployment serves
 */
export function buildTrustedOrder(body: unknown, knownApartment: string): OrderResult {
  if (typeof body !== 'object' || body === null) return { ok: false, reason: 'malformed_request' };
  const record = body as Record<string, unknown>;

  if (record.apartmentId !== knownApartment) return { ok: false, reason: 'unknown_apartment' };
  if (!isValidClientOrderId(record.clientOrderId)) return { ok: false, reason: 'invalid_order_id' };

  const lines = readLines(record.items);
  if (lines === null) return { ok: false, reason: 'malformed_request' };
  if (lines.length === 0) return { ok: false, reason: 'empty_selection' };
  if (lines.length > MAX_DISTINCT_LINES) return { ok: false, reason: 'too_many_lines' };
  if (new Set(lines.map((line) => line.productId)).size !== lines.length) {
    return { ok: false, reason: 'duplicate_line' };
  }

  const items: TrustedOrderItem[] = [];
  for (const line of lines) {
    const product = productById(line.productId);
    if (!product) return { ok: false, reason: 'unknown_product' };
    if (!isPurchasable(product)) return { ok: false, reason: 'product_not_purchasable' };
    if (!isValidQuantity(line.quantity)) return { ok: false, reason: 'invalid_quantity' };

    // isPurchasable() has established that priceCents is a positive number.
    const unit = product.priceCents as number;
    items.push({
      product_id: product.id,
      quantity: line.quantity,
      unit_amount_cents: unit,
      amount_cents: unit * line.quantity,
    });
  }

  return {
    ok: true,
    order: {
      apartmentId: knownApartment,
      clientOrderId: record.clientOrderId,
      items,
      totalCents: items.reduce((sum, item) => sum + item.amount_cents, 0),
      currency: CURRENCY,
    },
  };
}
