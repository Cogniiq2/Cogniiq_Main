// ─────────────────────────────────────────────────────────────────────────────
// The browser's side of the Private Bar API.
//
// Two calls, both against our own origin: read stock, confirm a selection. The
// browser never talks to Supabase — the Cloudflare Function holds the only
// credential and is the sole security boundary.
//
// Every failure is reduced here to a small typed union. No HTTP status, no
// response body and no exception text ever travels further into the interface,
// which is what keeps the guest-facing copy free of technical language.
// ─────────────────────────────────────────────────────────────────────────────
import type { ApartmentKey } from './apartments';
import type { CartLine } from './cart';

export type Stock = Readonly<Record<string, number>>;

export interface ConfirmedOrderItem {
  readonly productId: string;
  readonly quantity: number;
  readonly unitAmountCents: number;
  readonly amountCents: number;
}

export interface ConfirmedOrder {
  readonly orderId: string;
  readonly clientOrderId: string;
  readonly totalCents: number;
  readonly currency: string;
  readonly items: readonly ConfirmedOrderItem[];
  /** ISO timestamp, set by the client when the order was accepted. */
  readonly confirmedAt: string;
}

export type InventoryResult =
  | { readonly ok: true; readonly stock: Stock }
  | { readonly ok: false };

export type ConfirmResult =
  | { readonly ok: true; readonly order: ConfirmedOrder; readonly stock: Stock }
  /** Stock moved between browsing and confirming. `stock` carries the current numbers. */
  | { readonly ok: false; readonly reason: 'out_of_stock'; readonly stock: Stock }
  | { readonly ok: false; readonly reason: 'failed'; readonly stock?: undefined };

const REQUEST_TIMEOUT_MS = 12_000;

async function requestJson(input: string, init?: RequestInit): Promise<unknown | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    const body = (await response.json().catch(() => null)) as unknown;
    return response.ok ? body : { __httpError: true, body };
  } catch {
    return null; // offline, aborted, DNS, anything: one shape for the caller
  } finally {
    clearTimeout(timer);
  }
}

function parseStock(value: unknown): Stock {
  if (typeof value !== 'object' || value === null) return {};
  const stock: Record<string, number> = {};
  for (const [productId, count] of Object.entries(value as Record<string, unknown>)) {
    if (typeof count === 'number' && Number.isInteger(count) && count >= 0) {
      stock[productId] = count;
    }
  }
  return stock;
}

export async function fetchInventory(apartment: ApartmentKey): Promise<InventoryResult> {
  // The public key only. The canonical internal id is never in the browser.
  const body = await requestJson(
    `/api/private-bar/inventory?apartment=${encodeURIComponent(apartment)}`
  );
  if (!body || typeof body !== 'object' || '__httpError' in body) return { ok: false };
  return { ok: true, stock: parseStock((body as { stock?: unknown }).stock) };
}

/** A v4 UUID, with a fallback for browsers without crypto.randomUUID. */
export function newClientOrderId(): string {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') return cryptoObj.randomUUID();

  const bytes = new Uint8Array(16);
  if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
    cryptoObj.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Confirms a selection.
 *
 * Only the apartment key, product ids and quantities are sent: prices and the
 * total are derived on the server. `clientOrderId` is the idempotency key — retrying with the same id
 * returns the same order and never decrements stock a second time.
 */
export async function confirmOrder(
  apartment: ApartmentKey,
  clientOrderId: string,
  lines: readonly CartLine[]
): Promise<ConfirmResult> {
  const body = await requestJson('/api/private-bar/confirm-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apartment,
      clientOrderId,
      items: lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
    }),
  });

  if (!body || typeof body !== 'object') return { ok: false, reason: 'failed' };

  if ('__httpError' in body) {
    const inner = (body as { body?: unknown }).body;
    const error = typeof inner === 'object' && inner !== null ? (inner as { error?: unknown }).error : null;
    if (error === 'out_of_stock') {
      const stock = parseStock((inner as { stock?: unknown }).stock);
      return { ok: false, reason: 'out_of_stock', stock };
    }
    return { ok: false, reason: 'failed' };
  }

  const record = body as Record<string, unknown>;
  if (
    typeof record.orderId !== 'string' ||
    typeof record.totalCents !== 'number' ||
    !Array.isArray(record.items)
  ) {
    return { ok: false, reason: 'failed' };
  }

  const items: ConfirmedOrderItem[] = [];
  for (const entry of record.items as unknown[]) {
    if (typeof entry !== 'object' || entry === null) continue;
    const item = entry as Record<string, unknown>;
    if (
      typeof item.productId === 'string' &&
      typeof item.quantity === 'number' &&
      typeof item.unitAmountCents === 'number' &&
      typeof item.amountCents === 'number'
    ) {
      items.push({
        productId: item.productId,
        quantity: item.quantity,
        unitAmountCents: item.unitAmountCents,
        amountCents: item.amountCents,
      });
    }
  }
  if (items.length === 0) return { ok: false, reason: 'failed' };

  return {
    ok: true,
    order: {
      orderId: record.orderId,
      clientOrderId,
      totalCents: record.totalCents,
      currency: typeof record.currency === 'string' ? record.currency : 'EUR',
      items,
      confirmedAt: new Date().toISOString(),
    },
    stock: parseStock(record.stock),
  };
}
