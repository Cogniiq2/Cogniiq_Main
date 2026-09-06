// ─────────────────────────────────────────────────────────────────────────────
// Shared plumbing for the Private Bar API routes.
//
// A leading underscore keeps this file out of Cloudflare Pages' file-based
// routing — it is a module, not an endpoint.
//
// Types are hand-rolled rather than pulled from @cloudflare/workers-types, the
// same choice functions/_middleware.ts already makes: one dependency fewer, and
// the surface these handlers touch is small enough to state exactly.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Server-side configuration. Every value is a Cloudflare Pages SECRET and is
 * read only here, on the server. None of them is prefixed VITE_, so none can
 * reach the client bundle.
 *
 * Whether the FRONTEND offers payment controls is a separate, non-secret build
 * flag (VITE_PRIVATE_BAR_CHECKOUT_ENABLED, see src/private-bar/config.ts). The
 * two are independent on purpose: the frontend flag is a UI decision, and this
 * module fails closed regardless of it, so a wrongly enabled frontend can never
 * produce a checkout.
 */
export interface PrivateBarEnv {
  /** n8n webhook that creates a provider checkout session. */
  readonly N8N_PRIVATE_BAR_CHECKOUT_URL?: string;
  /** n8n webhook that reports authoritative order status. */
  readonly N8N_PRIVATE_BAR_STATUS_URL?: string;
  /** HMAC-SHA256 key for Function -> n8n request signing. */
  readonly PRIVATE_BAR_SHARED_SECRET?: string;
}

export interface PrivateBarContext {
  readonly request: Request;
  readonly env: PrivateBarEnv;
}

export function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      // A guest surface talks to its own origin only; nothing else may call these.
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

/**
 * Names of the required secrets that are absent or blank.
 *
 * Presence is the only thing checked here. A configured-but-wrong secret is
 * rejected downstream by n8n's own signature check, which is where that belongs.
 */
export function missingConfiguration(env: PrivateBarEnv): readonly string[] {
  const required = [
    'N8N_PRIVATE_BAR_CHECKOUT_URL',
    'N8N_PRIVATE_BAR_STATUS_URL',
    'PRIVATE_BAR_SHARED_SECRET',
  ] as const;
  return required.filter((key) => {
    const value = env[key];
    return typeof value !== 'string' || value.trim() === '';
  });
}

/**
 * The fail-closed answer. Returned whenever the payment configuration is
 * incomplete, which is the state of every environment until Phase F.
 */
export function notConfigured(missing: readonly string[]): Response {
  return json({ error: 'not_configured', missing }, 503);
}

/** Phase A ships the routing contract; the integration itself lands in Phase C/D. */
export function notImplemented(): Response {
  return json({ error: 'not_implemented' }, 501);
}

export function methodNotAllowed(allow: string): Response {
  return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
    status: 405,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      Allow: allow,
    },
  });
}
