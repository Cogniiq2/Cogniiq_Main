// ─────────────────────────────────────────────────────────────────────────────
// POST /api/private-bar/checkout
//
// PHASE A: the endpoint exists so the routing and JSON contract can be verified
// end to end (see .github/scripts/test-pages-routing.mjs), and so the surface
// fails CLOSED by default. It creates nothing and talks to nobody.
//
// Phase C replaces the notImplemented() branch with: strict schema validation,
// server-authoritative pricing recomputed from src/private-bar/catalog.ts, an
// HMAC-SHA256-signed call to n8n, and a `{ checkoutUrl }` response. The browser
// never sends an amount and its arithmetic is never trusted.
// ─────────────────────────────────────────────────────────────────────────────
import {
  methodNotAllowed,
  missingConfiguration,
  notConfigured,
  notImplemented,
  type PrivateBarContext,
} from './_shared';

export async function onRequest(context: PrivateBarContext): Promise<Response> {
  if (context.request.method !== 'POST') return methodNotAllowed('POST');

  const missing = missingConfiguration(context.env);
  if (missing.length > 0) return notConfigured(missing);

  return notImplemented();
}
