// ─────────────────────────────────────────────────────────────────────────────
// GET /api/private-bar/inventory
//
// Current stock for the configured apartment, as { productId: count }. Read-only
// and side-effect free; the browser uses it to cap quantities and to mark
// sold-out products. It is advisory, not authoritative: the confirmation is what
// actually decides, atomically, in the database.
// ─────────────────────────────────────────────────────────────────────────────
import { PRIVATE_BAR_APARTMENT_ID } from '../../../src/private-bar/config';

import { fetchStock, json, methodNotAllowed, readSupabaseConfig, type PrivateBarContext } from './_shared';

export async function onRequest(context: PrivateBarContext): Promise<Response> {
  if (context.request.method !== 'GET') return methodNotAllowed('GET');

  const config = readSupabaseConfig(context.env);
  if (!config) return json({ error: 'not_configured' }, 503);

  try {
    const stock = await fetchStock(config, PRIVATE_BAR_APARTMENT_ID);
    return json({ apartmentId: PRIVATE_BAR_APARTMENT_ID, stock }, 200);
  } catch {
    // Nothing about the failure reaches the guest — the interface has its own copy.
    return json({ error: 'inventory_unavailable' }, 502);
  }
}
