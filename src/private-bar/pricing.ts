// ─────────────────────────────────────────────────────────────────────────────
// Private Bar pricing — the ONE place any amount is derived or formatted.
//
// Framework-free on purpose (see ./catalog.ts): the Cloudflare Pages Function
// that creates checkout sessions from Phase C onwards recomputes every total
// with these exact functions. The browser never sends an amount and its
// arithmetic is never authoritative.
//
// All amounts are integer euro cents. Floating point never touches money.
// ─────────────────────────────────────────────────────────────────────────────
import { productBelongsToApartment, type ApartmentKey } from './apartments';
import { productById, type PrivateBarProduct } from './catalog';

export const CURRENCY = 'EUR' as const;

/** Bounds enforced identically on the client and, authoritatively, on the server. */
export const MIN_QUANTITY = 1;
export const MAX_QUANTITY_PER_PRODUCT = 20;
export const MAX_DISTINCT_LINES = 20;

export interface CartLine {
  readonly productId: string;
  readonly quantity: number;
}

export interface PricedLine {
  readonly product: PrivateBarProduct;
  readonly quantity: number;
  readonly unitAmountCents: number;
  readonly amountCents: number;
}

/**
 * A product can be ordered only when it is physically available AND has a
 * configured price. `priceCents: null` is never treated as free, never as a
 * placeholder, and never as purchasable.
 */
export function isPurchasable(product: PrivateBarProduct): boolean {
  return product.available && typeof product.priceCents === 'number' && product.priceCents > 0;
}

export function isValidQuantity(quantity: number): boolean {
  return (
    Number.isInteger(quantity) && quantity >= MIN_QUANTITY && quantity <= MAX_QUANTITY_PER_PRODUCT
  );
}

/**
 * Resolves cart lines against the catalogue.
 *
 * Anything that cannot be priced with certainty is REJECTED rather than
 * silently dropped or defaulted: an unknown id, a product the selected
 * apartment does not sell, an unavailable product, a product without a
 * configured price, a quantity outside the bounds, a duplicated product id, or
 * more distinct lines than allowed.
 */
export function priceLines(
  lines: readonly CartLine[],
  apartment: ApartmentKey
): { ok: true; lines: readonly PricedLine[] } | { ok: false; reason: string } {
  if (lines.length === 0) return { ok: false, reason: 'empty_selection' };
  if (lines.length > MAX_DISTINCT_LINES) return { ok: false, reason: 'too_many_lines' };

  // Structural checks first: a malformed selection is rejected for what is
  // actually wrong with it, rather than for whichever line happens to fail the
  // catalogue lookup first.
  const ids = new Set(lines.map((line) => line.productId));
  if (ids.size !== lines.length) return { ok: false, reason: 'duplicate_line' };

  const priced: PricedLine[] = [];

  for (const line of lines) {
    const product = productById(line.productId);
    if (!product) return { ok: false, reason: 'unknown_product' };
    // A product the other apartment stocks is not orderable here, whatever the
    // interface offered: apartment assignment is part of pricing a line.
    if (!productBelongsToApartment(product.id, apartment)) {
      return { ok: false, reason: 'product_not_in_apartment' };
    }
    if (!isPurchasable(product)) return { ok: false, reason: 'product_not_purchasable' };
    if (!isValidQuantity(line.quantity)) return { ok: false, reason: 'invalid_quantity' };

    // isPurchasable() has already established that priceCents is a number.
    const unitAmountCents = product.priceCents as number;
    priced.push({
      product,
      quantity: line.quantity,
      unitAmountCents,
      amountCents: unitAmountCents * line.quantity,
    });
  }

  return { ok: true, lines: priced };
}

export function totalCents(lines: readonly PricedLine[]): number {
  return lines.reduce((sum, line) => sum + line.amountCents, 0);
}

/** Total item count (quantities, not distinct products). */
export function itemCount(lines: readonly CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

const EURO_FORMAT = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formats euro cents as German currency. Never called with an unconfigured price. */
export function formatEuro(amountCents: number): string {
  return EURO_FORMAT.format(amountCents / 100);
}

/**
 * The amount as the guest will type it into a payment form: a plain German
 * decimal, no currency symbol, no thousands separator ("18,50").
 *
 * Derived with integer arithmetic rather than by dividing, so the string is
 * exact for every value rather than for most of them.
 */
export function amountForCopy(amountCents: number): string {
  const sign = amountCents < 0 ? '-' : '';
  const absolute = Math.abs(Math.trunc(amountCents));
  const euros = Math.trunc(absolute / 100);
  const cents = absolute % 100;
  return `${sign}${euros},${String(cents).padStart(2, '0')}`;
}
