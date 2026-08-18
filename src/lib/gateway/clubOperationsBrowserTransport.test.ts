// The browser transport is the only thing between the module and the Edge Function, so what it
// must get right is narrow and entirely about failure: preserve the status when there is one,
// invent "unreachable" rather than "denied" when there is not, and never widen the request body.

import { FunctionsHttpError } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';

import {
  CLUB_OPERATIONS_FUNCTION_NAME,
  createClubOperationsBrowserTransport,
  type ClubOperationsInvoke,
} from '@/lib/gateway/clubOperationsBrowserTransport';
import { createTransportAdapter } from '@/solutions/club-operations/adapter/transportAdapter';
import { ClubOperationsError } from '@/solutions/club-operations/adapter/ClubOperationsAdapter';

vi.mock('@/lib/supabase', () => ({ supabase: { functions: { invoke: vi.fn() } } }));

function httpError(status: number): FunctionsHttpError {
  return new FunctionsHttpError(new Response('{}', { status }));
}

describe('request contract', () => {
  it('calls the Club Operations function with exactly the operation and the query', async () => {
    const invoke = vi.fn(async () => ({ data: { ok: true }, error: null }));
    const transport = createClubOperationsBrowserTransport(invoke as unknown as ClubOperationsInvoke);

    await transport({ operation: 'listBookings', query: { page: 2 } });

    expect(invoke).toHaveBeenCalledTimes(1);
    const [name, options] = invoke.mock.calls[0] as unknown as [string, { body: unknown }];
    expect(name).toBe(CLUB_OPERATIONS_FUNCTION_NAME);
    // Exactly two keys: the caller's identity is the bearer token, never a body field.
    expect(Object.keys(options.body as Record<string, unknown>).sort()).toEqual(['operation', 'query']);
    expect(options.body).toEqual({ operation: 'listBookings', query: { page: 2 } });
  });

  it('passes a successful payload through untouched, for the adapter to validate', async () => {
    const payload = { rows: [], total: 0 };
    const transport = createClubOperationsBrowserTransport(
      (async () => ({ data: payload, error: null })) as ClubOperationsInvoke,
    );

    await expect(transport({ operation: 'getOverview', query: {} })).resolves.toEqual({
      status: 200,
      body: payload,
    });
  });
});

describe('failure mapping', () => {
  it('preserves the HTTP status of a non-2xx answer', async () => {
    for (const status of [400, 401, 403, 429, 500, 502]) {
      const transport = createClubOperationsBrowserTransport(
        (async () => ({ data: null, error: httpError(status) })) as ClubOperationsInvoke,
      );
      await expect(transport({ operation: 'getOverview', query: {} })).resolves.toEqual({
        status,
        body: null,
      });
    }
  });

  it('reports a transport failure as unreachable, never as denied', async () => {
    // A network error, a relay failure or a thrown invoke never produced a verdict. Surfacing any
    // of them as 403 would let the client probe a trust relationship it must not observe.
    const cases: ClubOperationsInvoke[] = [
      (async () => ({ data: null, error: new Error('network down') })) as ClubOperationsInvoke,
      (async () => ({ data: null, error: { message: 'relay failed' } })) as ClubOperationsInvoke,
      (() => Promise.reject(new Error('offline'))) as unknown as ClubOperationsInvoke,
    ];

    for (const invoke of cases) {
      const transport = createClubOperationsBrowserTransport(invoke);
      await expect(transport({ operation: 'getOverview', query: {} })).resolves.toEqual({
        status: 503,
        body: null,
      });
    }
  });
});

describe('through the adapter, only the five public codes escape', () => {
  async function codeFor(invoke: ClubOperationsInvoke): Promise<string> {
    const adapter = createTransportAdapter({
      transport: createClubOperationsBrowserTransport(invoke),
    });
    try {
      await adapter.getOverview({ period: 'month' });
    } catch (cause) {
      expect(cause).toBeInstanceOf(ClubOperationsError);
      return (cause as ClubOperationsError).code;
    }
    throw new Error('expected a rejection');
  }

  it('maps each transport outcome onto its documented code', async () => {
    const status = (code: number): ClubOperationsInvoke =>
      (async () => ({ data: null, error: httpError(code) })) as ClubOperationsInvoke;

    expect(await codeFor(status(401))).toBe('unauthorized');
    expect(await codeFor(status(403))).toBe('forbidden');
    expect(await codeFor(status(400))).toBe('invalid_query');
    expect(await codeFor(status(429))).toBe('unavailable');
    expect(await codeFor(status(500))).toBe('unavailable');
  });

  it('surfaces an undeployed or unreachable function as unavailable', async () => {
    // The gateway is not deployed yet. This is the state a customer sees until it is, and it must
    // read as "source unreachable", not as "you are not permitted".
    const code = await codeFor(
      (async () => ({ data: null, error: new Error('Failed to fetch') })) as ClubOperationsInvoke,
    );
    expect(code).toBe('unavailable');
  });

  it('never lets a malformed success body reach the caller as data', async () => {
    const code = await codeFor(
      (async () => ({ data: { nonsense: true }, error: null })) as ClubOperationsInvoke,
    );
    expect(code).toBe('unknown');
  });
});
