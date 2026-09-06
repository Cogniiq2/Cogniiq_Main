import { afterEach, describe, expect, it, vi } from 'vitest';

// The Cloudflare Pages Functions themselves, imported directly: this exercises
// the real handlers, including the Supabase call they make and the way every
// failure is reduced to guest-safe JSON.
import { onRequest as confirmOrder } from '../../functions/api/private-bar/confirm-order';
import { onRequest as inventory } from '../../functions/api/private-bar/inventory';
import { PRIVATE_BAR_APARTMENT_ID } from './config';
import { productById } from './catalog';

const ENV = {
  SUPABASE_URL: 'https://project.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-test-key',
};

const ORDER_ID = '11111111-2222-4333-8444-555555555555';
const BEER = 'bayreuther-hell';
const BEER_PRICE = productById(BEER)!.priceCents!;

interface FetchCall {
  url: string;
  init: RequestInit;
}

/** Stands in for Supabase: records what the Function sent and replies to script. */
function stubSupabase(handlers: {
  rpc?: (body: Record<string, unknown>) => Response | Promise<Response>;
  stock?: () => Response | Promise<Response>;
}) {
  const calls: FetchCall[] = [];
  const fetchMock = vi.fn(async (url: string, init: RequestInit = {}) => {
    calls.push({ url, init });
    if (url.includes('/rpc/private_bar_confirm_order')) {
      const body = JSON.parse(String(init.body)) as Record<string, unknown>;
      return handlers.rpc ? handlers.rpc(body) : new Response('{}', { status: 500 });
    }
    if (url.includes('private_bar_inventory')) {
      return handlers.stock ? handlers.stock() : new Response('[]', { status: 200 });
    }
    throw new Error(`unexpected request: ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  return calls;
}

function post(body: unknown, env: Record<string, string> = ENV) {
  return confirmOrder({
    request: new Request('https://bolagio.test/api/private-bar/confirm-order', {
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
    env,
  });
}

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    apartmentId: PRIVATE_BAR_APARTMENT_ID,
    clientOrderId: ORDER_ID,
    items: [{ productId: BEER, quantity: 2 }],
    ...overrides,
  };
}

const okRpc = (overrides: Record<string, unknown> = {}) =>
  new Response(
    JSON.stringify({
      order_id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
      total_cents: BEER_PRICE * 2,
      currency: 'EUR',
      status: 'awaiting_payment',
      created_at: '2026-09-06T10:00:00Z',
      idempotent: false,
      ...overrides,
    }),
    { status: 200 }
  );

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('POST /api/private-bar/confirm-order', () => {
  it('derives the total server-side and ignores any amount the client sent', async () => {
    const calls = stubSupabase({
      rpc: () => okRpc(),
      stock: () => new Response(JSON.stringify([{ product_id: BEER, stock: 3 }]), { status: 200 }),
    });

    const response = await post(
      validBody({
        items: [{ productId: BEER, quantity: 2, unitAmountCents: 1, amountCents: 2 }],
        totalCents: 1,
      })
    );

    expect(response.status).toBe(200);
    const rpcCall = calls.find((c) => c.url.includes('/rpc/'))!;
    const sent = JSON.parse(String(rpcCall.init.body)) as Record<string, unknown>;
    expect(sent.p_total_cents).toBe(BEER_PRICE * 2);
    expect(sent.p_total_cents).not.toBe(1);
    expect((sent.p_items as Array<Record<string, number>>)[0].unit_amount_cents).toBe(BEER_PRICE);

    const payload = (await response.json()) as Record<string, unknown>;
    expect(payload.totalCents).toBe(BEER_PRICE * 2);
    expect(payload.status).toBe('awaiting_payment');
  });

  it('passes the client order id straight through as the idempotency key', async () => {
    const calls = stubSupabase({ rpc: () => okRpc(), stock: () => new Response('[]', { status: 200 }) });
    await post(validBody());
    const sent = JSON.parse(String(calls.find((c) => c.url.includes('/rpc/'))!.init.body));
    expect(sent.p_client_order_id).toBe(ORDER_ID);
  });

  it('returns the existing order for a repeated confirmation without a second decrement', async () => {
    const rpc = vi.fn(() => okRpc({ idempotent: true }));
    stubSupabase({ rpc, stock: () => new Response('[]', { status: 200 }) });

    const first = await post(validBody());
    const second = await post(validBody());

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    // Both requests reached the same idempotent database function; the database
    // is what guarantees the single decrement, and it reported the replay.
    expect(rpc).toHaveBeenCalledTimes(2);
    expect(((await second.json()) as Record<string, unknown>).orderId).toBe(
      'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
    );
  });

  it('answers an insufficient-stock rejection with 409 and the current stock', async () => {
    stubSupabase({
      rpc: () =>
        new Response(
          JSON.stringify({ message: 'private_bar:out_of_stock:bayreuther-hell', code: 'P0001' }),
          { status: 400 }
        ),
      stock: () => new Response(JSON.stringify([{ product_id: BEER, stock: 1 }]), { status: 200 }),
    });

    const response = await post(validBody());
    expect(response.status).toBe(409);
    const payload = (await response.json()) as Record<string, unknown>;
    expect(payload.error).toBe('out_of_stock');
    expect(payload.stock).toEqual({ [BEER]: 1 });
  });

  it('never leaks database wording to the guest', async () => {
    stubSupabase({
      rpc: () =>
        new Response('ERROR: relation "private_bar_inventory" does not exist (SQLSTATE 42P01)', {
          status: 500,
        }),
    });

    const response = await post(validBody());
    const text = await response.text();
    expect(text).not.toMatch(/SQLSTATE|relation|supabase|postgres/i);
    expect(JSON.parse(text).error).toBe('unavailable');
  });

  it('rejects malformed input before touching the database', async () => {
    const rpc = vi.fn(() => okRpc());
    stubSupabase({ rpc });

    for (const body of [
      'not json',
      validBody({ items: [] }),
      validBody({ items: [{ productId: 'ghost', quantity: 1 }] }),
      validBody({ items: [{ productId: BEER, quantity: 0 }] }),
      validBody({ clientOrderId: 'nope' }),
      validBody({ apartmentId: 'another-apartment' }),
    ]) {
      const response = await post(body);
      expect(response.status).toBe(400);
    }
    expect(rpc).not.toHaveBeenCalled();
  });

  it('fails closed when the server is not configured', async () => {
    stubSupabase({ rpc: () => okRpc() });
    const response = await post(validBody(), {});
    expect(response.status).toBe(503);
    expect(((await response.json()) as Record<string, unknown>).error).toBe('not_configured');
  });

  it('refuses anything but POST', async () => {
    const response = await confirmOrder({
      request: new Request('https://bolagio.test/api/private-bar/confirm-order'),
      env: ENV,
    });
    expect(response.status).toBe(405);
  });

  it('never sends the service-role key to the browser', async () => {
    stubSupabase({ rpc: () => okRpc(), stock: () => new Response('[]', { status: 200 }) });
    const response = await post(validBody());
    const text = await response.text();
    expect(text).not.toContain(ENV.SUPABASE_SERVICE_ROLE_KEY);
    expect([...response.headers.values()].join(' ')).not.toContain(ENV.SUPABASE_SERVICE_ROLE_KEY);
  });
});

describe('GET /api/private-bar/inventory', () => {
  it('returns stock for the configured apartment', async () => {
    stubSupabase({
      stock: () =>
        new Response(JSON.stringify([{ product_id: BEER, stock: 4 }, { product_id: 'x', stock: 0 }]), {
          status: 200,
        }),
    });

    const response = await inventory({
      request: new Request('https://bolagio.test/api/private-bar/inventory'),
      env: ENV,
    });
    expect(response.status).toBe(200);
    const payload = (await response.json()) as Record<string, unknown>;
    expect(payload.apartmentId).toBe(PRIVATE_BAR_APARTMENT_ID);
    expect(payload.stock).toEqual({ [BEER]: 4, x: 0 });
  });

  it('answers with safe JSON when the database cannot be reached', async () => {
    stubSupabase({ stock: () => new Response('boom', { status: 500 }) });
    const response = await inventory({
      request: new Request('https://bolagio.test/api/private-bar/inventory'),
      env: ENV,
    });
    expect(response.status).toBe(502);
    expect(((await response.json()) as Record<string, unknown>).error).toBe('inventory_unavailable');
  });

  it('fails closed without configuration', async () => {
    const response = await inventory({
      request: new Request('https://bolagio.test/api/private-bar/inventory'),
      env: {},
    });
    expect(response.status).toBe(503);
  });
});
