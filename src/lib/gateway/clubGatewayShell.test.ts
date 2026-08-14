// The request boundary end to end, with local fakes only (plan §6.1, §11, §12, §14.1.1, §14.1.7).
//
// No test here reaches a network, a hosted project or a real credential. The caller resolver, the
// authorizer, the rate limiter and the transport are all injected fakes.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import {
  handleClubGatewayRequest,
  isWithinRateLimit,
  resolveCallerIdentity,
  unconfiguredRateLimiter,
  type CallerIdentity,
  type ClubGatewayLogRecord,
  type ClubGatewayRateLimiter,
  type ClubGatewayShellDependencies,
} from './clubGatewayShell';
import { denyAllAuthorizer, type EntitlementAuthorizer } from './entitlement';
import { CLUB_GATEWAY_OUTCOME_STATUS, type ClubGatewayTransport } from './clubGatewayTransport';
import { cqgw1Operations } from './cqgw1';

const CALLER: CallerIdentity = { userId: 'user-1', organizationIds: ['org-1'] };
const BEARER = 'Bearer local-fake-token';

const allowAll: EntitlementAuthorizer = async () => ({ entitled: true });
const allowRate: ClubGatewayRateLimiter = async () => ({ allowed: true });

interface Harness {
  dependencies: ClubGatewayShellDependencies;
  sent: Array<{ operation: string; query: Record<string, unknown> }>;
  logs: ClubGatewayLogRecord[];
}

function harness(overrides: Partial<ClubGatewayShellDependencies> = {}): Harness {
  const sent: Array<{ operation: string; query: Record<string, unknown> }> = [];
  const logs: ClubGatewayLogRecord[] = [];
  const transport: ClubGatewayTransport = async (request) => {
    sent.push({ operation: request.operation, query: request.query });
    return { status: 200, body: { echoed: request.operation }, requestId: 'req-abcdefgh' };
  };
  return {
    sent,
    logs,
    dependencies: {
      resolveCaller: async () => CALLER,
      authorize: denyAllAuthorizer,
      rateLimiter: allowRate,
      transport,
      allowedOrigins: ['https://app.example.test'],
      now: () => 1_800_000_000_000,
      newCorrelationId: () => 'correlation01',
      log: (record) => logs.push(record),
      ...overrides,
    },
  };
}

function post(body: unknown, init: { headers?: Record<string, string> } = {}): Request {
  return new Request('https://cogniiq.example.test/functions/v1/club-operations-read', {
    method: 'POST',
    headers: { Authorization: BEARER, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

/** A request whose body is a live stream — what a chunked upload actually looks like. */
function streamedPost(
  body: ReadableStream<Uint8Array>,
  headers: Record<string, string> = {},
): Request {
  return new Request('https://cogniiq.example.test/functions/v1/club-operations-read', {
    method: 'POST',
    headers: { Authorization: BEARER, 'Content-Type': 'application/json', ...headers },
    body,
    // Required by undici when a request body is a stream.
    duplex: 'half',
  } as RequestInit & { duplex: 'half' });
}

function streamOfText(text: string): ReadableStream<Uint8Array> {
  const bytes = new TextEncoder().encode(text);
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
}

/* --------------------------------------------------------------------- Method */

describe('method and preflight', () => {
  it('answers OPTIONS with a preflight and nothing else', async () => {
    const { dependencies } = harness();
    const response = await handleClubGatewayRequest(
      new Request('https://x.test/', { method: 'OPTIONS', headers: { Origin: 'https://app.example.test' } }),
      dependencies,
    );
    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://app.example.test');
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
    expect(await response.text()).toBe('');
  });

  it('omits CORS headers entirely for an origin outside the allowlist', async () => {
    const { dependencies } = harness();
    const response = await handleClubGatewayRequest(
      new Request('https://x.test/', { method: 'OPTIONS', headers: { Origin: 'https://evil.test' } }),
      dependencies,
    );
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
    expect(response.headers.get('Vary')).toBe('Origin');
  });

  it('refuses every method but POST and OPTIONS', async () => {
    const { dependencies } = harness();
    for (const method of ['GET', 'PUT', 'DELETE', 'PATCH', 'HEAD']) {
      const response = await handleClubGatewayRequest(
        new Request('https://x.test/', { method }),
        dependencies,
      );
      expect(response.status, method).toBe(405);
    }
  });
});

/* -------------------------------------------------------------- Configuration */

describe('configuration', () => {
  it('answers 500 without naming a variable when the transport could not be built', async () => {
    const { dependencies } = harness({ transport: null });
    const response = await handleClubGatewayRequest(post({ operation: 'getSettings', query: {} }), dependencies);
    expect(response.status).toBe(500);
    expect(await response.text()).toBe('{"error":"Server is not configured"}');
  });
});

/* ------------------------------------------------------------ Authentication */

describe('authentication fails closed', () => {
  const unauthenticated = '{"error":"Not authenticated"}';

  it('refuses a missing Authorization header', async () => {
    const { dependencies, sent } = harness();
    const request = new Request('https://x.test/', {
      method: 'POST',
      body: JSON.stringify({ operation: 'getSettings', query: {} }),
    });
    const response = await handleClubGatewayRequest(request, dependencies);
    expect(response.status).toBe(401);
    expect(await response.text()).toBe(unauthenticated);
    expect(sent).toHaveLength(0);
  });

  it('refuses a malformed Authorization header', async () => {
    for (const header of ['', 'Basic abc', 'Bearer', 'Bearer    ', 'token abc']) {
      const { dependencies } = harness();
      const response = await handleClubGatewayRequest(
        post({ operation: 'getSettings', query: {} }, { headers: { Authorization: header } }),
        dependencies,
      );
      expect(response.status, JSON.stringify(header)).toBe(401);
    }
  });

  it('refuses an invalid or expired session — the resolver returning null', async () => {
    const { dependencies, sent } = harness({ resolveCaller: async () => null });
    const response = await handleClubGatewayRequest(post({ operation: 'getSettings', query: {} }), dependencies);
    expect(response.status).toBe(401);
    expect(sent).toHaveLength(0);
  });

  it('refuses when the resolver throws', async () => {
    const { dependencies } = harness({
      resolveCaller: async () => {
        throw new Error('jwt expired at 2026-01-01, sub=00000000-0000-0000-0000-000000000000');
      },
    });
    const response = await handleClubGatewayRequest(post({ operation: 'getSettings', query: {} }), dependencies);
    expect(response.status).toBe(401);
    const text = await response.text();
    expect(text).toBe(unauthenticated);
    expect(text).not.toContain('jwt');
  });

  it('refuses a malformed identity from the resolver', async () => {
    const malformed = [undefined, null, {}, { userId: '' }, { userId: 'u' }, { userId: 'u', organizationIds: 'org' }, { userId: 'u', organizationIds: [1] }, { userId: 1, organizationIds: [] }];
    for (const identity of malformed) {
      await expect(
        resolveCallerIdentity(async () => identity as unknown as CallerIdentity, BEARER),
      ).resolves.toBeNull();
    }
  });

  it('accepts a well-formed identity and copies it defensively', async () => {
    const source = { userId: 'u', organizationIds: ['a', 'b'] };
    const resolved = await resolveCallerIdentity(async () => source, BEARER);
    expect(resolved).toEqual(source);
    expect(resolved!.organizationIds).not.toBe(source.organizationIds);
  });
});

/* ---------------------------------------------------------- Identity injection */

describe('identity cannot be injected', () => {
  const denied = '{"error":"Not permitted"}';

  it('refuses a body carrying an identity, even from an otherwise entitled caller', async () => {
    for (const extra of [{ userId: 'admin' }, { organizationId: 'org-9' }, { email: 'x@y.test' }, { role: 'superadmin' }]) {
      const { dependencies, sent } = harness({ authorize: allowAll });
      const response = await handleClubGatewayRequest(
        post({ operation: 'getSettings', query: {}, ...extra }),
        dependencies,
      );
      expect(response.status, JSON.stringify(extra)).toBe(403);
      expect(await response.text()).toBe(denied);
      expect(sent).toHaveLength(0);
    }
  });

  it('refuses an identity smuggled into the query', async () => {
    const { dependencies, sent } = harness({ authorize: allowAll });
    const response = await handleClubGatewayRequest(
      post({ operation: 'listBookings', query: { userId: 'admin' } }),
      dependencies,
    );
    expect(response.status).toBe(400);
    expect(sent).toHaveLength(0);
  });

  it('ignores identity-shaped headers and the query string entirely', async () => {
    const seen: Array<{ userId: string; organizationId: string }> = [];
    const spyAuthorizer: EntitlementAuthorizer = async (request) => {
      seen.push({ userId: request.userId, organizationId: request.organizationId });
      return { entitled: true };
    };
    const { dependencies } = harness({ authorize: spyAuthorizer });
    const request = new Request(
      'https://cogniiq.example.test/functions/v1/club-operations-read?userId=admin&organizationId=org-9',
      {
        method: 'POST',
        headers: {
          Authorization: BEARER,
          'Content-Type': 'application/json',
          'X-User-Id': 'admin',
          'X-Organization-Id': 'org-9',
        },
        body: JSON.stringify({ operation: 'getSettings', query: {} }),
      },
    );
    await handleClubGatewayRequest(request, dependencies);
    // The only identity that reached the authorizer is the one the resolver produced.
    expect(seen).toEqual([{ userId: 'user-1', organizationId: 'org-1' }]);
  });
});

/* ------------------------------------------------------------- Entitlement */

describe('entitlement fails closed, with one identical denial', () => {
  const denied = '{"error":"Not permitted"}';

  it('denies every operation under the production authorizer, and sends nothing', async () => {
    for (const operation of cqgw1Operations) {
      const { dependencies, sent } = harness();
      const query = operation === 'getOverview' ? { period: 'month' } : operation === 'getReport' ? { range: 'week' } : {};
      const response = await handleClubGatewayRequest(post({ operation, query }), dependencies);
      expect(response.status, operation).toBe(403);
      expect(await response.text()).toBe(denied);
      expect(sent, operation).toHaveLength(0);
    }
  });

  it('denies identically for no membership, a false authorizer, a throwing one and a malformed one', async () => {
    const variants: Array<[string, Partial<ClubGatewayShellDependencies>]> = [
      ['no membership', { resolveCaller: async () => ({ userId: 'u', organizationIds: [] }), authorize: allowAll }],
      ['explicit false', { authorize: async () => ({ entitled: false }) }],
      ['throwing authorizer', { authorize: (() => { throw new Error('table organization_solutions does not exist'); }) as unknown as EntitlementAuthorizer }],
      ['rejecting authorizer', { authorize: async () => { throw new Error('boom'); } }],
      ['malformed result', { authorize: (async () => ({ entitled: 'yes' })) as unknown as EntitlementAuthorizer }],
      ['missing authorizer', { authorize: undefined as unknown as EntitlementAuthorizer }],
      ['unknown operation', {}],
    ];

    const bodies = new Set<string>();
    for (const [what, overrides] of variants) {
      const { dependencies, sent } = harness(overrides);
      const body = what === 'unknown operation'
        ? { operation: 'dropEverything', query: {} }
        : { operation: 'getSettings', query: {} };
      const response = await handleClubGatewayRequest(post(body), dependencies);
      expect(response.status, what).toBe(403);
      bodies.add(await response.text());
      expect(sent, what).toHaveLength(0);
    }
    // One byte-identical body for every reason.
    expect([...bodies]).toEqual([denied]);
  });

  it('lets an explicitly entitled caller through — the test-only injection, not the production shell', async () => {
    const { dependencies, sent } = harness({ authorize: allowAll });
    const response = await handleClubGatewayRequest(
      post({ operation: 'listVouchers', query: { status: 'open' } }),
      dependencies,
    );
    expect(response.status).toBe(200);
    expect(sent).toEqual([{ operation: 'listVouchers', query: { status: 'open' } }]);
    expect(await response.json()).toEqual({ echoed: 'listVouchers' });
  });

  it('tries each of the caller organizations and reports the one that allowed', async () => {
    const asked: string[] = [];
    const authorize: EntitlementAuthorizer = async (request) => {
      asked.push(request.organizationId);
      return { entitled: request.organizationId === 'org-3' };
    };
    const rateSeen: string[] = [];
    const rateLimiter: ClubGatewayRateLimiter = async (request) => {
      rateSeen.push(request.organizationId);
      return { allowed: true };
    };
    const { dependencies } = harness({
      resolveCaller: async () => ({ userId: 'u', organizationIds: ['org-1', 'org-2', 'org-3'] }),
      authorize,
      rateLimiter,
    });
    const response = await handleClubGatewayRequest(post({ operation: 'getSettings', query: {} }), dependencies);
    expect(response.status).toBe(200);
    expect(asked).toEqual(['org-1', 'org-2', 'org-3']);
    expect(rateSeen).toEqual(['org-3']);
  });
});

/* ---------------------------------------------------------------- Validation */

describe('parameter validation runs after entitlement', () => {
  it('answers 400 for an entitled caller with bad parameters, and sends nothing', async () => {
    const { dependencies, sent } = harness({ authorize: allowAll });
    const response = await handleClubGatewayRequest(
      post({ operation: 'listBookings', query: { dateFrom: 'yesterday' } }),
      dependencies,
    );
    expect(response.status).toBe(400);
    expect(await response.text()).toBe('{"error":"Invalid request"}');
    expect(sent).toHaveLength(0);
  });

  it('gives an unentitled caller the same 403 whether the parameters were valid or not', async () => {
    const valid = await handleClubGatewayRequest(
      post({ operation: 'listBookings', query: { status: 'all' } }),
      harness().dependencies,
    );
    const invalid = await handleClubGatewayRequest(
      post({ operation: 'listBookings', query: { status: 'nonsense' } }),
      harness().dependencies,
    );
    expect(valid.status).toBe(invalid.status);
    expect(await valid.text()).toBe(await invalid.text());
  });

  it('refuses an unreadable body without revealing why', async () => {
    for (const body of ['not json', '[]', 'null', '']) {
      const { dependencies, sent } = harness({ authorize: allowAll });
      const response = await handleClubGatewayRequest(post(body), dependencies);
      expect(response.status, JSON.stringify(body)).toBe(403);
      expect(sent).toHaveLength(0);
    }
  });

  it('refuses an oversized body by its declared length, before reading it', async () => {
    const { dependencies, sent } = harness({ authorize: allowAll, maxRequestBytes: 16 });
    const response = await handleClubGatewayRequest(
      post({ operation: 'listBookings', query: { search: 'x'.repeat(64) } }),
      dependencies,
    );
    expect(response.status).toBe(403);
    expect(sent).toHaveLength(0);
  });

  it('caps a chunked body that declares no length, and cancels the stream', async () => {
    // The attack this closes: an authenticated caller streams an unbounded chunked body. There is no
    // `Content-Length` to check, so only the reader can stop it — and it must stop before the worker
    // has buffered the stream. This stream never ends; a completing request is the proof.
    let produced = 0;
    let cancelled = false;
    const endless = new ReadableStream<Uint8Array>({
      pull(controller) {
        produced += 1;
        controller.enqueue(new Uint8Array(1024));
      },
      cancel() {
        cancelled = true;
      },
    });

    const { dependencies, sent } = harness({ authorize: allowAll, maxRequestBytes: 4096 });
    const response = await handleClubGatewayRequest(streamedPost(endless), dependencies);

    expect(response.status).toBe(403);
    expect(await response.text()).toBe('{"error":"Not permitted"}');
    expect(cancelled).toBe(true);
    // Five 1 KiB chunks is what it takes to cross a 4 KiB cap; an unbounded read would still be
    // pulling on a stream with no end.
    expect(produced).toBeLessThanOrEqual(8);
    expect(sent).toHaveLength(0);
  });

  it('catches a body whose declared length understates its true size', async () => {
    const oversized = JSON.stringify({ operation: 'listBookings', query: { search: 'x'.repeat(400) } });
    const { dependencies, sent } = harness({ authorize: allowAll, maxRequestBytes: 64 });
    const response = await handleClubGatewayRequest(
      // The declared length passes the pre-check; the reader is what refuses.
      streamedPost(streamOfText(oversized), { 'Content-Length': '8' }),
      dependencies,
    );
    expect(response.status).toBe(403);
    expect(sent).toHaveLength(0);
  });

  it('refuses a malformed, duplicated or negative Content-Length', async () => {
    // Padded values like `" 12"` are absent from this list on purpose: `Headers` trims them before
    // the boundary ever sees them, so asserting a rejection here would be asserting something the
    // platform already prevents. The parser's own rejection of padding is pinned in
    // `cappedRead.test.ts`, where no `Headers` sits in between.
    for (const declared of ['-1', '1.5', 'twelve', '12, 12', '']) {
      const { dependencies, sent } = harness({ authorize: allowAll });
      const body = JSON.stringify({ operation: 'getSettings', query: {} });
      const response = await handleClubGatewayRequest(
        streamedPost(streamOfText(body), { 'Content-Length': declared }),
        dependencies,
      );
      expect(response.status, JSON.stringify(declared)).toBe(403);
      expect(sent).toHaveLength(0);
    }
  });

  it('accepts a body exactly at the cap, and refuses one byte more', async () => {
    const body = JSON.stringify({ operation: 'getSettings', query: {} });
    const exact = new TextEncoder().encode(body).length;

    const atCap = harness({ authorize: allowAll, maxRequestBytes: exact });
    const accepted = await handleClubGatewayRequest(
      streamedPost(streamOfText(body)),
      atCap.dependencies,
    );
    expect(accepted.status).toBe(200);
    expect(atCap.sent).toHaveLength(1);

    const underCap = harness({ authorize: allowAll, maxRequestBytes: exact - 1 });
    const refused = await handleClubGatewayRequest(
      streamedPost(streamOfText(body)),
      underCap.dependencies,
    );
    expect(refused.status).toBe(403);
    expect(underCap.sent).toHaveLength(0);
  });

  it('measures UTF-8 bytes, not JavaScript characters', async () => {
    // The search term is 20 characters and more than 20 bytes. A character-count cap would let this
    // through; a byte cap must not.
    const body = JSON.stringify({ operation: 'listMembers', query: { search: 'ä'.repeat(20) } });
    expect(new TextEncoder().encode(body).length).toBeGreaterThan(body.length);

    const { dependencies, sent } = harness({ authorize: allowAll, maxRequestBytes: body.length });
    const response = await handleClubGatewayRequest(streamedPost(streamOfText(body)), dependencies);
    expect(response.status).toBe(403);
    expect(sent).toHaveLength(0);
  });

  it('refuses a body that is not valid UTF-8', async () => {
    const invalid = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([0xff, 0xfe, 0xfd]));
        controller.close();
      },
    });
    const { dependencies, sent } = harness({ authorize: allowAll });
    const response = await handleClubGatewayRequest(streamedPost(invalid), dependencies);
    expect(response.status).toBe(403);
    expect(sent).toHaveLength(0);
  });

  it('refuses a body whose stream fails mid-read, without surfacing the cause', async () => {
    const failing = new ReadableStream<Uint8Array>({
      pull() {
        throw new Error('socket reset by peer at 10.0.0.7');
      },
    });
    const { dependencies, sent, logs } = harness({ authorize: allowAll });
    const response = await handleClubGatewayRequest(streamedPost(failing), dependencies);
    expect(response.status).toBe(403);
    const text = `${await response.text()} ${JSON.stringify(logs)}`;
    expect(text).not.toContain('10.0.0.7');
    expect(text).not.toContain('socket reset');
    expect(sent).toHaveLength(0);
  });

  it('never calls the unrestricted body readers', () => {
    const source = readFileSync(resolve(__dirname, 'clubGatewayShell.ts'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');
    expect(source).not.toMatch(/request\.text\(\)/);
    expect(source).not.toMatch(/request\.json\(\)/);
    expect(source).not.toMatch(/request\.arrayBuffer\(\)/);
    expect(source).not.toMatch(/request\.blob\(\)/);
    expect(source).toMatch(/readCappedStream\(/);
  });

  it('forwards only the validated query, never the raw one', async () => {
    const { dependencies, sent } = harness({ authorize: allowAll });
    await handleClubGatewayRequest(
      post({ operation: 'listMembers', query: { search: 'Muster', status: undefined } }),
      dependencies,
    );
    expect(sent).toEqual([{ operation: 'listMembers', query: { search: 'Muster' } }]);
  });
});

/* ---------------------------------------------------------------- Rate limit */

describe('the rate limit denies safely', () => {
  it('is unconfigured in production, and denies', async () => {
    await expect(
      unconfiguredRateLimiter({ userId: 'u', organizationId: 'o', operation: 'getSettings', nowMs: 0 }),
    ).resolves.toEqual({ allowed: false });
  });

  const denyingLimiters: Array<[string, unknown]> = [
    ['a missing limiter', undefined],
    ['a non-callable limiter', {}],
    ['an explicit denial', async () => ({ allowed: false })],
    ['a throwing limiter', () => { throw new Error('rate_limits table missing'); }],
    ['a rejecting limiter', async () => { throw new Error('boom'); }],
    ['a malformed result', async () => ({ allowed: 'yes' })],
    ['undefined', async () => undefined],
    ['null', async () => null],
  ];

  for (const [what, limiter] of denyingLimiters) {
    it(`denies with ${what}`, async () => {
      await expect(
        isWithinRateLimit(limiter as ClubGatewayRateLimiter, {
          userId: 'u',
          organizationId: 'o',
          operation: 'getSettings',
          nowMs: 0,
        }),
      ).resolves.toBe(false);
    });
  }

  it('answers 429 with an opaque body and contacts nothing upstream', async () => {
    const { dependencies, sent } = harness({ authorize: allowAll, rateLimiter: unconfiguredRateLimiter });
    const response = await handleClubGatewayRequest(post({ operation: 'getSettings', query: {} }), dependencies);
    expect(response.status).toBe(429);
    expect(await response.text()).toBe('{"error":"Unavailable"}');
    expect(sent).toHaveLength(0);
  });

  it('receives the boundary clock, not a caller-supplied time', async () => {
    let seen = -1;
    const { dependencies } = harness({
      authorize: allowAll,
      rateLimiter: async (request) => {
        seen = request.nowMs;
        return { allowed: true };
      },
    });
    await handleClubGatewayRequest(
      post({ operation: 'getSettings', query: {} }, { headers: { 'X-Now': '0' } }),
      dependencies,
    );
    expect(seen).toBe(1_800_000_000_000);
  });
});

/* ------------------------------------------------------------------- Upstream */

describe('upstream outcomes map to stable public answers', () => {
  const cases: Array<[number, number, string]> = [
    [CLUB_GATEWAY_OUTCOME_STATUS.invalidQuery, 400, '{"error":"Invalid request"}'],
    [CLUB_GATEWAY_OUTCOME_STATUS.unavailable, 502, '{"error":"Unavailable"}'],
    [CLUB_GATEWAY_OUTCOME_STATUS.protocol, 406, '{"error":"Unavailable"}'],
  ];

  for (const [outcome, status, body] of cases) {
    it(`turns transport ${outcome} into ${status}`, async () => {
      const { dependencies } = harness({
        authorize: allowAll,
        transport: async () => ({ status: outcome, body: null, requestId: 'r', reason: 'status_untrusted' }),
      });
      const response = await handleClubGatewayRequest(post({ operation: 'getSettings', query: {} }), dependencies);
      expect(response.status).toBe(status);
      expect(await response.text()).toBe(body);
    });
  }

  it('never lets an upstream reason reach the caller', async () => {
    const { dependencies } = harness({
      authorize: allowAll,
      transport: async () => ({
        status: CLUB_GATEWAY_OUTCOME_STATUS.unavailable,
        body: null,
        requestId: 'r',
        reason: 'status_untrusted',
      }),
    });
    const response = await handleClubGatewayRequest(post({ operation: 'getSettings', query: {} }), dependencies);
    expect(await response.text()).not.toContain('untrusted');
  });
});

/* -------------------------------------------------------------- Observability */

describe('errors and logs carry no secret', () => {
  it('logs reason codes and a correlation id, never a payload or an identity', async () => {
    const { dependencies, logs } = harness({ authorize: allowAll });
    await handleClubGatewayRequest(
      post({ operation: 'listMembers', query: { search: 'Erika Mustermann' } }),
      dependencies,
    );
    const text = JSON.stringify(logs);
    expect(text).not.toContain('Mustermann');
    expect(text).not.toContain('user-1');
    expect(text).not.toContain('org-1');
    expect(text).not.toContain(BEARER);
    expect(logs[0]).toMatchObject({ event: 'ok', status: 200, operation: 'listMembers' });
  });

  it('distinguishes the failure classes without exposing internals', async () => {
    const events: string[] = [];
    const collect = async (overrides: Partial<ClubGatewayShellDependencies>, body: unknown) => {
      const { dependencies, logs } = harness(overrides);
      await handleClubGatewayRequest(post(body), dependencies);
      events.push(logs[0].event);
    };
    await collect({ transport: null }, { operation: 'getSettings', query: {} });
    await collect({ resolveCaller: async () => null }, { operation: 'getSettings', query: {} });
    await collect({}, { operation: 'getSettings', query: {} });
    await collect({ authorize: allowAll }, { operation: 'listBookings', query: { dateFrom: 'x' } });
    await collect({ authorize: allowAll, rateLimiter: unconfiguredRateLimiter }, { operation: 'getSettings', query: {} });
    await collect(
      {
        authorize: allowAll,
        transport: async () => ({ status: 502, body: null, requestId: 'r', reason: 'timeout' }),
      },
      { operation: 'getSettings', query: {} },
    );
    expect(events).toEqual([
      'not_configured',
      'unauthenticated',
      'denied',
      'invalid_request',
      'rate_limited',
      'upstream_failed',
    ]);
  });

  it('preserves a well-formed correlation id and replaces a malformed one', async () => {
    const { dependencies } = harness();
    const preserved = await handleClubGatewayRequest(
      post({ operation: 'getSettings', query: {} }, { headers: { 'X-Correlation-Id': 'abcdefgh1234' } }),
      dependencies,
    );
    expect(preserved.headers.get('X-Correlation-Id')).toBe('abcdefgh1234');

    const replaced = await handleClubGatewayRequest(
      post({ operation: 'getSettings', query: {} }, { headers: { 'X-Correlation-Id': '<script>x</script>' } }),
      dependencies,
    );
    expect(replaced.headers.get('X-Correlation-Id')).toBe('correlation01');
  });

  it('writes nothing to the console of its own accord', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((level) =>
      vi.spyOn(console, level).mockImplementation(() => {}),
    );
    const { dependencies } = harness({ log: undefined });
    await handleClubGatewayRequest(post({ operation: 'getSettings', query: {} }), dependencies);
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('never returns a stack trace or an internal detail', async () => {
    const { dependencies } = harness({
      resolveCaller: async () => {
        const error = new Error('relation "organization_members" does not exist');
        throw error;
      },
    });
    const response = await handleClubGatewayRequest(post({ operation: 'getSettings', query: {} }), dependencies);
    const text = await response.text();
    expect(text).not.toMatch(/organization_members|at Object|\.ts:\d+/);
  });

  it('marks every answer no-store', async () => {
    const { dependencies } = harness({ authorize: allowAll });
    const response = await handleClubGatewayRequest(post({ operation: 'getSettings', query: {} }), dependencies);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });
});

/* ------------------------------------------------------------------- Inertness */

const repoRoot = resolve(__dirname, '../../..');

describe('Club Operations stays inert', () => {
  it('the registry still resolves the solution to the unavailable fallback', () => {
    const registry = readFileSync(resolve(repoRoot, 'src/lib/solutions/registry.tsx'), 'utf8');
    expect(registry).toMatch(/club_operations:\s*unavailableImplementation/);
    expect(registry).not.toMatch(/ClubOperationsModule/);
  });

  it('the route tree still matches nothing', () => {
    const app = readFileSync(resolve(repoRoot, 'src/App.tsx'), 'utf8');
    expect(app).not.toMatch(/club-operations/i);
    expect(app).not.toMatch(/ClubOperationsModule/);
  });

  it('the new Edge Function is not registered in supabase config', () => {
    const configPath = resolve(repoRoot, 'supabase/config.toml');
    let config = '';
    try {
      config = readFileSync(configPath, 'utf8');
    } catch {
      config = '';
    }
    expect(config).not.toMatch(/club-operations-read/);
  });

  it('no browser-reachable module imports the gateway', () => {
    // The gateway is server-side only. If a component ever imported it, the signing contract and the
    // upstream endpoint would be one bundle away from the browser.
    const app = readFileSync(resolve(repoRoot, 'src/App.tsx'), 'utf8');
    expect(app).not.toMatch(/lib\/gateway\/clubGateway/);
  });
});
