// ─────────────────────────────────────────────────────────────────────────────
// GET /api/private-bar/inventory?apartment=<public key>
//
// Current stock for ONE apartment, as { productId: count }. Read-only and side
// effect free; the browser uses it to cap quantities and to mark sold-out
// products. It is advisory, not authoritative: the confirmation is what actually
// decides, atomically, in the database.
//
// The query names an apartment with its PUBLIC key ('designaparts1'). It is
// resolved against the allow-list in src/private-bar/apartments.ts and only the
// resolved canonical id is ever used as a filter — a raw apartment_id from the
// query string is never forwarded, so no other apartment's stock can be read by
// guessing an id. An unknown key fails closed with no data.
// ─────────────────────────────────────────────────────────────────────────────
import { resolveApartment } from '../../../src/private-bar/apartments';

import { fetchStock, json, methodNotAllowed, readSupabaseConfig, type PrivateBarContext } from './_shared';

export async function onRequest(context: PrivateBarContext): Promise<Response> {
  if (context.request.method !== 'GET') return methodNotAllowed('GET');

  const requested = new URL(context.request.url).searchParams.get('apartment');
  const apartment = resolveApartment(requested);
  if (!apartment) return json({ error: 'unknown_apartment' }, 400);

  const config = readSupabaseConfig(context.env);
  if (!config) return json({ error: 'not_configured' }, 503);

  try {
    const stock = await fetchStock(config, apartment.apartmentId);
    // The public key goes back, never the canonical internal id.
    return json({ apartment: apartment.key, stock }, 200);
  } catch {
    // Nothing about the failure reaches the guest — the interface has its own copy.
    return json({ error: 'inventory_unavailable' }, 502);
  }
}
