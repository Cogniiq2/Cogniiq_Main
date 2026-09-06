// ─────────────────────────────────────────────────────────────────────────────
// GET /api/private-bar/status?order=<uuid>
//
// PHASE A: fails closed and implements nothing else. See ./checkout.ts.
//
// Phase D makes this the ONLY authority the success surface listens to: it asks
// n8n for the stored order state, which is written exclusively by a verified
// provider webhook. It is a pure read — repeating it has no side effects — and
// a browser redirect or query parameter can never produce a paid result.
// ─────────────────────────────────────────────────────────────────────────────
import {
  methodNotAllowed,
  missingConfiguration,
  notConfigured,
  notImplemented,
  type PrivateBarContext,
} from './_shared';

export async function onRequest(context: PrivateBarContext): Promise<Response> {
  if (context.request.method !== 'GET') return methodNotAllowed('GET');

  const missing = missingConfiguration(context.env);
  if (missing.length > 0) return notConfigured(missing);

  return notImplemented();
}
