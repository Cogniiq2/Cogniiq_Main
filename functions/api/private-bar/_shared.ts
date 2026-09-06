// ─────────────────────────────────────────────────────────────────────────────
// Shared plumbing for the Private Bar API.
//
// The leading underscore keeps this file out of Cloudflare Pages' file-based
// routing — it is a module, not an endpoint.
//
// THIS FILE IS THE SECURITY BOUNDARY. The Supabase service-role key exists only
// here, in a server-side environment variable. The browser never receives it,
// never talks to Supabase directly, and cannot change stock by any route other
// than the two endpoints beside this file.
//
// Types are hand-rolled rather than pulled from @cloudflare/workers-types, the
// same choice functions/_middleware.ts already makes: one dependency fewer, and
// the surface these handlers touch is small enough to state exactly.
// ─────────────────────────────────────────────────────────────────────────────

export interface PrivateBarEnv {
  /** Supabase project URL, e.g. https://<ref>.supabase.co. Server-side only. */
  readonly SUPABASE_URL?: string;
  /** Service-role key. SECRET. Never prefixed VITE_, never sent to a browser. */
  readonly SUPABASE_SERVICE_ROLE_KEY?: string;
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
      // Inventory is shared, mutable state: a cached copy is a wrong copy.
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
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

export interface SupabaseConfig {
  readonly url: string;
  readonly serviceRoleKey: string;
}

/**
 * Reads the server configuration, or null when it is incomplete.
 *
 * Fails closed: with no configuration the endpoints answer 503 and the guest
 * interface shows its "not available right now" state. It never falls back to
 * an anonymous key, and never guesses a project URL.
 */
export function readSupabaseConfig(env: PrivateBarEnv): SupabaseConfig | null {
  const url = env.SUPABASE_URL?.trim();
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) return null;
  return { url: url.replace(/\/+$/, ''), serviceRoleKey };
}

/** Requests that outlive this budget are abandoned: a guest waiting on a
 *  hanging socket is a worse failure than a clean error. */
const SUPABASE_TIMEOUT_MS = 8000;

async function supabaseFetch(
  config: SupabaseConfig,
  path: string,
  init: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SUPABASE_TIMEOUT_MS);
  try {
    return await fetch(`${config.url}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        ...(init.headers as Record<string, string> | undefined),
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

export interface StockRow {
  readonly product_id: string;
  readonly stock: number;
}

/** Current stock for one apartment, as a product_id -> count map. */
export async function fetchStock(
  config: SupabaseConfig,
  apartmentId: string
): Promise<Record<string, number>> {
  const query = new URLSearchParams({
    select: 'product_id,stock',
    apartment_id: `eq.${apartmentId}`,
  });
  const response = await supabaseFetch(config, `/rest/v1/private_bar_inventory?${query}`, {
    method: 'GET',
  });
  if (!response.ok) throw new Error(`inventory_read_failed:${response.status}`);

  const rows = (await response.json()) as StockRow[];
  const stock: Record<string, number> = {};
  for (const row of rows) {
    if (typeof row?.product_id === 'string' && Number.isInteger(row?.stock)) {
      stock[row.product_id] = Math.max(0, row.stock);
    }
  }
  return stock;
}

export interface ConfirmOrderRpcResult {
  readonly order_id: string;
  readonly total_cents: number;
  readonly currency: string;
  readonly status: string;
  readonly created_at: string;
  readonly idempotent: boolean;
}

export type RpcOutcome =
  | { readonly ok: true; readonly result: ConfirmOrderRpcResult }
  | { readonly ok: false; readonly reason: 'out_of_stock' | 'rejected' | 'unavailable' };

/**
 * Calls the atomic confirmation function.
 *
 * The database raises `private_bar:<code>` on a rejection; those messages are
 * mapped to a small outcome type here and NEVER forwarded to the guest — no SQL,
 * no Supabase wording, no status codes reach the interface.
 */
export async function confirmOrderRpc(
  config: SupabaseConfig,
  payload: {
    p_apartment_id: string;
    p_client_order_id: string;
    p_items: unknown;
    p_total_cents: number;
    p_currency: string;
  }
): Promise<RpcOutcome> {
  let response: Response;
  try {
    response = await supabaseFetch(config, '/rest/v1/rpc/private_bar_confirm_order', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch {
    return { ok: false, reason: 'unavailable' };
  }

  if (response.ok) {
    const result = (await response.json()) as ConfirmOrderRpcResult;
    return { ok: true, result };
  }

  const body = await response.text();
  if (body.includes('private_bar:out_of_stock')) return { ok: false, reason: 'out_of_stock' };
  if (body.includes('private_bar:')) return { ok: false, reason: 'rejected' };
  return { ok: false, reason: 'unavailable' };
}
