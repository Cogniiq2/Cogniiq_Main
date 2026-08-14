// The outbound half: canonical body, CQGW1 signing, one HTTPS request, no redirects, an abort
// budget (plan §4, §5, §14.1.3).
//
// Every test here uses a local fake `fetch` and a locally generated key pair. Nothing opens a
// socket, names a real host or contacts a hosted service.

import { afterEach, describe, expect, it, vi } from 'vitest';

import { canonicalJson } from './canonicalJson';
import {
  CLUB_GATEWAY_OUTCOME_STATUS,
  GatewayConfigError,
  createClubGatewayTransport,
  createRandomRequestId,
  importCqgw1SigningKey,
  resolveGatewayEndpoint,
  type ClubGatewayTransportConfig,
} from './clubGatewayTransport';
import {
  CQGW1_CANONICAL_PATH,
  CQGW1_HEADERS,
  CQGW1_VERSION,
  verifyCqgw1Request,
} from './cqgw1';
import { base64urlEncode } from './encoding';

const BASE_URL = 'https://gateway.example.test';
const KEY_ID = 'test-key-1';
const FIXED_NOW_MS = 1_800_000_000_000;
const FIXED_REQUEST_ID = 'fixedRequestId0001';

async function generateKeyPair(): Promise<CryptoKeyPair> {
  return (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, [
    'sign',
    'verify',
  ])) as CryptoKeyPair;
}

interface Capture {
  url: string;
  init: RequestInit;
}

function envelopeResponse(requestId: string, operation: string, result: unknown): Response {
  return new Response(JSON.stringify({ requestId, operation, result }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function buildTransport(
  overrides: Partial<ClubGatewayTransportConfig> = {},
  onFetch?: (capture: Capture) => Response | Promise<Response>,
): Promise<{ transport: ReturnType<typeof createClubGatewayTransport>; captures: Capture[]; publicKey: CryptoKey }> {
  const { privateKey, publicKey } = await generateKeyPair();
  const captures: Capture[] = [];
  const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
    const capture = { url: String(url), init: init ?? {} };
    captures.push(capture);
    if (onFetch) return onFetch(capture);
    const body = JSON.parse(new TextDecoder().decode(init!.body as Uint8Array)) as {
      operation: string;
    };
    const requestId = (init!.headers as Record<string, string>)[CQGW1_HEADERS.requestId];
    return envelopeResponse(requestId, body.operation, { ok: true });
  }) as unknown as typeof fetch;

  const transport = createClubGatewayTransport({
    baseUrl: BASE_URL,
    keyId: KEY_ID,
    signingKey: privateKey,
    validateResult: (_operation, result) => result,
    fetchImpl,
    now: () => FIXED_NOW_MS,
    newRequestId: () => FIXED_REQUEST_ID,
    ...overrides,
  });

  return { transport, captures, publicKey };
}

afterEach(() => {
  vi.restoreAllMocks();
});

/* -------------------------------------------------------------------- Endpoint */

describe('the endpoint', () => {
  it('appends the canonical path, which is not configurable', () => {
    expect(resolveGatewayEndpoint(BASE_URL)).toBe(`${BASE_URL}${CQGW1_CANONICAL_PATH}`);
    expect(resolveGatewayEndpoint(`${BASE_URL}/`)).toBe(`${BASE_URL}${CQGW1_CANONICAL_PATH}`);
    expect(CQGW1_CANONICAL_PATH).toBe('/functions/v1/cogniiq-read-gateway');
  });

  it('refuses plain HTTP — TLS is the entire transit protection for an unsigned response', () => {
    expect(() => resolveGatewayEndpoint('http://gateway.example.test')).toThrow(GatewayConfigError);
  });

  it('refuses a base carrying its own path, query, fragment or credentials', () => {
    for (const value of [
      'https://gateway.example.test/functions/v1/cogniiq-read-gateway',
      'https://gateway.example.test/other',
      'https://gateway.example.test/?a=1',
      'https://gateway.example.test/#x',
      'https://user:pass@gateway.example.test',
      'not-a-url',
    ]) {
      expect(() => resolveGatewayEndpoint(value), value).toThrow(GatewayConfigError);
    }
  });

  it('refuses to build a transport with a malformed key id or a missing validator', async () => {
    const { privateKey } = await generateKeyPair();
    const base = { baseUrl: BASE_URL, signingKey: privateKey, validateResult: (_o: unknown, r: unknown) => r };
    expect(() => createClubGatewayTransport({ ...base, keyId: 'bad key id' } as ClubGatewayTransportConfig)).toThrow(
      GatewayConfigError,
    );
    expect(() =>
      createClubGatewayTransport({
        ...base,
        keyId: KEY_ID,
        validateResult: undefined,
      } as unknown as ClubGatewayTransportConfig),
    ).toThrow(GatewayConfigError);
  });
});

/* ----------------------------------------------------------------- Signing key */

describe('the signing key', () => {
  it('imports a PKCS#8 Ed25519 key and signs with it', async () => {
    const { privateKey, publicKey } = await generateKeyPair();
    const pkcs8 = new Uint8Array(await crypto.subtle.exportKey('pkcs8', privateKey));
    const imported = await importCqgw1SigningKey(base64urlEncode(pkcs8));

    const message = new TextEncoder().encode('hello');
    const signature = await crypto.subtle.sign({ name: 'Ed25519' }, imported, message);
    await expect(
      crypto.subtle.verify({ name: 'Ed25519' }, publicKey, signature, message),
    ).resolves.toBe(true);
  });

  it('refuses a malformed key without echoing it', async () => {
    for (const value of ['not base64url!!', 'AAAA']) {
      await expect(importCqgw1SigningKey(value)).rejects.toMatchObject({
        name: 'GatewayConfigError',
      });
      await importCqgw1SigningKey(value).catch((error: Error) => {
        expect(error.message).not.toContain(value);
      });
    }
  });
});

/* ------------------------------------------------------------------ Request ids */

describe('request ids — the CQGW1 nonce', () => {
  it('generates ids matching the contract pattern, and different ones each time', () => {
    const ids = new Set(Array.from({ length: 32 }, () => createRandomRequestId()));
    expect(ids.size).toBe(32);
    for (const id of ids) expect(id).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
  });

  it('is deterministic under injection', async () => {
    const { transport, captures } = await buildTransport();
    await transport({ operation: 'getSettings', query: {} });
    await transport({ operation: 'getSettings', query: {} });
    const ids = captures.map((c) => (c.init.headers as Record<string, string>)[CQGW1_HEADERS.requestId]);
    expect(ids).toEqual([FIXED_REQUEST_ID, FIXED_REQUEST_ID]);
  });

  it('refuses to send when the injected id does not match the contract', async () => {
    const { transport, captures } = await buildTransport({ newRequestId: () => 'short' });
    const result = await transport({ operation: 'getSettings', query: {} });
    expect(result).toMatchObject({
      status: CLUB_GATEWAY_OUTCOME_STATUS.unavailable,
      reason: 'request_id_malformed',
    });
    expect(captures).toHaveLength(0);
  });
});

/* -------------------------------------------------------------------- Signing */

describe('CQGW1 signing', () => {
  it('sends all six signed headers, and a signature the existing verifier accepts', async () => {
    const { transport, captures, publicKey } = await buildTransport();
    await transport({ operation: 'listBookings', query: { status: 'all' } });

    const [capture] = captures;
    const headers = capture.init.headers as Record<string, string>;
    expect(headers[CQGW1_HEADERS.version]).toBe(CQGW1_VERSION);
    expect(headers[CQGW1_HEADERS.keyId]).toBe(KEY_ID);
    expect(headers[CQGW1_HEADERS.timestamp]).toBe(String(Math.floor(FIXED_NOW_MS / 1000)));
    expect(headers[CQGW1_HEADERS.requestId]).toBe(FIXED_REQUEST_ID);
    expect(headers[CQGW1_HEADERS.operation]).toBe('listBookings');
    expect(headers[CQGW1_HEADERS.signature]).toMatch(/^[A-Za-z0-9_-]+$/);

    const verification = await verifyCqgw1Request({
      method: 'POST',
      path: CQGW1_CANONICAL_PATH,
      header: (name) => headers[name] ?? null,
      rawBody: capture.init.body as Uint8Array,
      nowSeconds: Math.floor(FIXED_NOW_MS / 1000),
      publicKeys: new Map([[KEY_ID, publicKey]]),
    });
    expect(verification).toMatchObject({ ok: true, operation: 'listBookings', requestId: FIXED_REQUEST_ID });
  });

  it('signs the canonical body bytes, so key order cannot change the signature', async () => {
    const first = await buildTransport();
    await first.transport({ operation: 'listBookings', query: { status: 'all', search: 'a' } });
    await first.transport({ operation: 'listBookings', query: { search: 'a', status: 'all' } });

    const bodies = first.captures.map((c) => new TextDecoder().decode(c.init.body as Uint8Array));
    expect(bodies[0]).toBe(bodies[1]);
    expect(bodies[0]).toBe(canonicalJson({ operation: 'listBookings', query: { search: 'a', status: 'all' } }));

    const signatures = first.captures.map(
      (c) => (c.init.headers as Record<string, string>)[CQGW1_HEADERS.signature],
    );
    expect(signatures[0]).toBe(signatures[1]);
  });

  it('posts to the canonical path with redirect refusal', async () => {
    const { transport, captures } = await buildTransport();
    await transport({ operation: 'getSettings', query: {} });
    expect(captures[0].url).toBe(`${BASE_URL}${CQGW1_CANONICAL_PATH}`);
    expect(captures[0].init.method).toBe('POST');
    expect(captures[0].init.redirect).toBe('error');
    expect(captures[0].init.signal).toBeDefined();
  });

  it('refuses a body that cannot be canonicalised, before signing or sending', async () => {
    const { transport, captures } = await buildTransport();
    const result = await transport({ operation: 'listBookings', query: { bad: Number.NaN } });
    expect(result).toMatchObject({
      status: CLUB_GATEWAY_OUTCOME_STATUS.invalidQuery,
      reason: 'body_not_canonical',
    });
    expect(captures).toHaveLength(0);
  });
});

/* ------------------------------------------------------------------ Transport */

describe('the wire', () => {
  it('returns the validated result on success', async () => {
    const { transport } = await buildTransport();
    const result = await transport({ operation: 'getSettings', query: {} });
    expect(result).toMatchObject({ status: 200, body: { ok: true }, requestId: FIXED_REQUEST_ID });
  });

  it('refuses a redirect the fetch surfaced instead of throwing', async () => {
    const redirected = await buildTransport({}, () => {
      const response = envelopeResponse(FIXED_REQUEST_ID, 'getSettings', {});
      Object.defineProperty(response, 'redirected', { value: true });
      return response;
    });
    await expect(redirected.transport({ operation: 'getSettings', query: {} })).resolves.toMatchObject({
      status: CLUB_GATEWAY_OUTCOME_STATUS.unavailable,
      reason: 'redirect_refused',
    });

    const threeOhTwo = await buildTransport({}, () =>
      new Response('', { status: 302, headers: { 'Content-Type': 'application/json' } }),
    );
    await expect(threeOhTwo.transport({ operation: 'getSettings', query: {} })).resolves.toMatchObject({
      reason: 'redirect_refused',
    });
  });

  it('aborts on the timeout budget and reports it as a timeout', async () => {
    const { transport } = await buildTransport({ timeoutMs: 5 }, (capture) => {
      const signal = capture.init.signal as AbortSignal;
      return new Promise<Response>((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(new Error('aborted')));
      });
    });
    await expect(transport({ operation: 'getSettings', query: {} })).resolves.toMatchObject({
      status: CLUB_GATEWAY_OUTCOME_STATUS.unavailable,
      reason: 'timeout',
    });
  });

  it('reports a timeout that lands while the body is streaming as a timeout', async () => {
    // The headers arrive; the body never does. The abort fires mid-stream, and that is a timeout —
    // not the network failure it would look like without the signal.
    const { transport } = await buildTransport({ timeoutMs: 5 }, (capture) => {
      const signal = capture.init.signal as AbortSignal;
      return new Response(
        new ReadableStream<Uint8Array>({
          pull() {
            // The body stalls, then dies when the abort tears the connection down — which is what a
            // real runtime does to an in-flight response body on abort.
            return new Promise<void>((_resolve, reject) => {
              signal.addEventListener('abort', () => reject(new Error('aborted')));
            });
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    });
    await expect(transport({ operation: 'getSettings', query: {} })).resolves.toMatchObject({
      status: CLUB_GATEWAY_OUTCOME_STATUS.unavailable,
      reason: 'timeout',
    });
  });

  it('reports an unrelated stream failure as a transport failure, not a timeout', async () => {
    const { transport } = await buildTransport({ timeoutMs: 60_000 }, () =>
      new Response(
        new ReadableStream<Uint8Array>({
          pull() {
            throw new Error('socket reset by peer at 10.0.0.7');
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    const result = await transport({ operation: 'getSettings', query: {} });
    expect(result).toMatchObject({
      status: CLUB_GATEWAY_OUTCOME_STATUS.unavailable,
      reason: 'transport_failed',
    });
    expect(JSON.stringify(result)).not.toContain('10.0.0.7');
  });

  it('reports a refused connection as unavailable, never as a permission problem', async () => {
    const { transport } = await buildTransport({}, () => {
      throw new Error('ECONNREFUSED 10.0.0.1:443');
    });
    const result = await transport({ operation: 'getSettings', query: {} });
    expect(result).toMatchObject({
      status: CLUB_GATEWAY_OUTCOME_STATUS.unavailable,
      reason: 'transport_failed',
    });
    expect(JSON.stringify(result)).not.toContain('10.0.0.1');
  });

  it('maps upstream statuses onto the three outward outcomes', async () => {
    const cases: Array<[number, number]> = [
      [400, CLUB_GATEWAY_OUTCOME_STATUS.invalidQuery],
      [401, CLUB_GATEWAY_OUTCOME_STATUS.unavailable],
      [403, CLUB_GATEWAY_OUTCOME_STATUS.unavailable],
      [429, CLUB_GATEWAY_OUTCOME_STATUS.unavailable],
      [500, CLUB_GATEWAY_OUTCOME_STATUS.unavailable],
      [418, CLUB_GATEWAY_OUTCOME_STATUS.protocol],
    ];
    for (const [upstream, outward] of cases) {
      const { transport } = await buildTransport({}, () =>
        new Response('{}', { status: upstream, headers: { 'Content-Type': 'application/json' } }),
      );
      const result = await transport({ operation: 'getSettings', query: {} });
      expect(result.status, `upstream ${upstream}`).toBe(outward);
      expect(result.body).toBeNull();
    }
  });

  it('surfaces a protocol failure as its own outcome, distinct from a transport failure', async () => {
    const { transport } = await buildTransport({}, () =>
      envelopeResponse('some-other-id', 'getSettings', {}),
    );
    await expect(transport({ operation: 'getSettings', query: {} })).resolves.toMatchObject({
      status: CLUB_GATEWAY_OUTCOME_STATUS.protocol,
      reason: 'request_id_mismatch',
      body: null,
    });
  });

  it('rejects an operation echo that does not match what was asked', async () => {
    const { transport } = await buildTransport({}, () =>
      envelopeResponse(FIXED_REQUEST_ID, 'listMembers', {}),
    );
    await expect(transport({ operation: 'getSettings', query: {} })).resolves.toMatchObject({
      reason: 'operation_mismatch',
    });
  });

  it('applies the response cap', async () => {
    const { transport } = await buildTransport({ maxResponseBytes: 32 }, () =>
      envelopeResponse(FIXED_REQUEST_ID, 'getSettings', { padding: 'x'.repeat(4096) }),
    );
    await expect(transport({ operation: 'getSettings', query: {} })).resolves.toMatchObject({
      reason: 'body_too_large',
    });
  });
});

/* ----------------------------------------------------------------- Discretion */

describe('nothing is logged', () => {
  it('writes nothing to the console on success or on failure', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((level) =>
      vi.spyOn(console, level).mockImplementation(() => {}),
    );

    const ok = await buildTransport();
    await ok.transport({ operation: 'listMembers', query: { search: 'Mustermann' } });

    const bad = await buildTransport({}, () => {
      throw new Error('boom');
    });
    await bad.transport({ operation: 'listMembers', query: { search: 'Mustermann' } });

    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
  });

  it('never places the key id, the signature or the body into the returned reason', async () => {
    const { transport } = await buildTransport({}, () =>
      new Response('nope', { status: 200, headers: { 'Content-Type': 'text/plain' } }),
    );
    const result = await transport({ operation: 'listMembers', query: { search: 'Mustermann' } });
    const text = JSON.stringify(result);
    expect(text).not.toContain('Mustermann');
    expect(text).not.toContain(KEY_ID);
    expect(text).not.toContain('gateway.example.test');
  });
});

/* ---------------------------------------------------- No response-signing protocol */

describe('there is no response-signing protocol', () => {
  it('sends no response-key material and reads no response signature', async () => {
    const { transport, captures } = await buildTransport({}, () =>
      new Response(JSON.stringify({ requestId: FIXED_REQUEST_ID, operation: 'getSettings', result: {} }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          // A response signature header, if one existed, would be read here. Nothing reads it.
          'X-CQ-Response-Signature': 'ignored',
        },
      }),
    );
    const result = await transport({ operation: 'getSettings', query: {} });
    expect(result.status).toBe(200);
    const headerNames = Object.keys(captures[0].init.headers as Record<string, string>);
    expect(headerNames.filter((name) => /response/i.test(name))).toEqual([]);
  });
});
