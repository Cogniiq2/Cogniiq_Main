// ─────────────────────────────────────────────────────────────────────────────
// POST /api/private-bar/confirm-order
//
// The guest states they are taking these drinks. This endpoint prices the
// selection from the trusted catalogue, then asks the database to record the
// order and decrement stock atomically.
//
// It is NOT a payment endpoint. Nothing here contacts PayPal, and the order it
// writes carries status 'awaiting_payment' precisely because this architecture
// cannot verify a payment.
//
// Trust boundary, stated plainly: the request body may name an apartment KEY,
// product ids and quantities. The key is resolved against the allow-list in
// src/private-bar/apartments.ts (a raw apartment_id is never accepted), every
// product must belong to that apartment, and every price and the total are
// derived here from src/private-bar/catalog.ts. A body carrying its own total is
// not honoured.
// ─────────────────────────────────────────────────────────────────────────────
import { buildTrustedOrder } from '../../../src/private-bar/order';

import {
  confirmOrderRpc,
  fetchStock,
  json,
  methodNotAllowed,
  readSupabaseConfig,
  type PrivateBarContext,
} from './_shared';

/** A body larger than this is not a drinks order. */
const MAX_BODY_BYTES = 8 * 1024;

export async function onRequest(context: PrivateBarContext): Promise<Response> {
  if (context.request.method !== 'POST') return methodNotAllowed('POST');

  const config = readSupabaseConfig(context.env);
  if (!config) return json({ error: 'not_configured' }, 503);

  const raw = await context.request.text();
  if (raw.length > MAX_BODY_BYTES) return json({ error: 'malformed_request' }, 400);

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'malformed_request' }, 400);
  }

  // Resolves the apartment key against the allow-list, verifies every product is
  // one THIS apartment sells, and prices the order from the trusted catalogue.
  const built = buildTrustedOrder(body);
  if (!built.ok) return json({ error: built.reason }, 400);
  const { order } = built;

  const outcome = await confirmOrderRpc(config, {
    p_apartment_id: order.apartmentId,
    p_client_order_id: order.clientOrderId,
    p_items: order.items,
    p_total_cents: order.totalCents,
    p_currency: order.currency,
  });

  if (!outcome.ok) {
    // Stock moved underneath the guest: hand back the current numbers so the
    // interface can reconcile the selection instead of guessing.
    if (outcome.reason === 'out_of_stock') {
      let stock: Record<string, number> = {};
      try {
        stock = await fetchStock(config, order.apartmentId);
      } catch {
        // The reconciliation is best-effort; the error copy stands without it.
      }
      return json({ error: 'out_of_stock', stock }, 409);
    }
    return json({ error: outcome.reason === 'rejected' ? 'rejected' : 'unavailable' }, 503);
  }

  let stock: Record<string, number> = {};
  try {
    stock = await fetchStock(config, order.apartmentId);
  } catch {
    // The order is committed; a failed follow-up read must not fail the response.
  }

  return json(
    {
      orderId: outcome.result.order_id,
      clientOrderId: order.clientOrderId,
      totalCents: outcome.result.total_cents,
      currency: outcome.result.currency,
      status: outcome.result.status,
      items: order.items.map((item) => ({
        productId: item.product_id,
        quantity: item.quantity,
        unitAmountCents: item.unit_amount_cents,
        amountCents: item.amount_cents,
      })),
      stock,
    },
    200
  );
}
