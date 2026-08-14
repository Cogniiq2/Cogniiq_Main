// The Club Operations request boundary (D3b-A, §6.1, §11, §12).
//
// This is the whole of the Edge Function's behaviour. `supabase/functions/club-operations-read/
// index.ts` reads the environment, builds the dependencies and calls straight into here, because
// Cogniiq's test suite collects only `src/**/*.test.ts` — logic that lives in the function directory
// is logic no test can reach.
//
// ─── Order, fail-closed at every step ────────────────────────────────────────────────────────────
//
//   1  OPTIONS  → CORS preflight, nothing else
//   2  method must be POST
//   3  server configuration present — the reply never names which piece is missing
//   4  `Authorization: Bearer …` present
//   5  the caller's own token resolves to an identity
//   6  the caller belongs to at least one organization
//   7  the entitlement authorizer explicitly allows the operation for one of those organizations
//   8  the parameters validate
//   9  the rate limiter allows the call
//  10  only now is anything signed and sent
//
// ─── Identity ────────────────────────────────────────────────────────────────────────────────────
//
// Identity comes from the caller's own bearer token and from nowhere else. The request body admits
// exactly two keys (`operation`, `query`), no header beyond `Authorization`, `Origin`,
// `Content-Type`, `Content-Length` and a correlation id is read, and no query string is consulted at
// all. A `userId`, `organizationId` or `email` in a body, header or URL is refused, never adopted.
//
// ─── Denials ─────────────────────────────────────────────────────────────────────────────────────
//
// Every denial in steps 6–7 returns one byte-identical 403 — no membership, no entitlement, unknown
// organization, an authorizer that threw, an operation outside the closed twelve. Nothing about the
// entitlement model is probeable, and an unentitled caller learns nothing about whether its
// parameters would have validated.
//
// Nothing here logs a payload, a header, a token, a key or an upstream URL. Reason codes and a
// correlation id are the entire observable surface.

import { CappedReadError, decodeUtf8Strict, readCappedStream } from './cappedRead.ts';
import { isEntitled, type EntitlementAuthorizer } from './entitlement.ts';
import { isCqgw1Operation, CQGW1_MAX_BODY_BYTES, type Cqgw1Operation } from './cqgw1.ts';
import { validateOperationQuery } from './operationValidation.ts';
import {
  CLUB_GATEWAY_OUTCOME_STATUS,
  type ClubGatewayTransport,
} from './clubGatewayTransport.ts';

/* -------------------------------------------------------------------- Identity */

/**
 * What the caller's own token resolves to.
 *
 * Deliberately minimal: a user id and the organizations that user belongs to, both read under the
 * caller's identity through RLS-protected tables. No role, no email, no metadata — none of it is
 * needed to decide this request, and carrying it would invite someone to decide on it.
 */
export interface CallerIdentity {
  userId: string;
  organizationIds: readonly string[];
}

/**
 * Resolves a bearer token to an identity, or `null` when it does not resolve.
 *
 * Injected rather than constructed here so the boundary is provable without a hosted project: a test
 * supplies a local fake, and the Edge shell supplies the caller-scoped Supabase client that the rest
 * of this repository already uses for exactly this purpose.
 */
export type CallerIdentityResolver = (
  authorizationHeader: string,
) => Promise<CallerIdentity | null>;

/** Resolve an identity, treating every abnormal outcome as "not authenticated". */
export async function resolveCallerIdentity(
  resolver: CallerIdentityResolver | null | undefined,
  authorizationHeader: string,
): Promise<CallerIdentity | null> {
  if (typeof resolver !== 'function') return null;

  let identity: unknown;
  try {
    identity = await resolver(authorizationHeader);
  } catch {
    return null;
  }

  if (typeof identity !== 'object' || identity === null || Array.isArray(identity)) return null;
  const candidate = identity as { userId?: unknown; organizationIds?: unknown };
  if (typeof candidate.userId !== 'string' || candidate.userId === '') return null;
  if (!Array.isArray(candidate.organizationIds)) return null;
  if (!candidate.organizationIds.every((id) => typeof id === 'string' && id !== '')) return null;

  return { userId: candidate.userId, organizationIds: [...candidate.organizationIds] };
}

/* ------------------------------------------------------------------ Rate limit */

export interface RateLimitRequest {
  userId: string;
  organizationId: string;
  operation: Cqgw1Operation;
  /** Milliseconds since the epoch, from the boundary's own clock. */
  nowMs: number;
}

/**
 * The rate-limit seam. Generic and injectable on purpose.
 *
 * No threshold is defined here. The durable atomic limiter and its numbers are an unresolved owner
 * decision (plan §19, item B4) and a precondition for any deployment; inventing values would look
 * like a decision that has not been taken. What is implemented is the boundary: a limiter is
 * consulted, and every way of failing to get an allow is a denial.
 */
export type ClubGatewayRateLimiter = (
  request: RateLimitRequest,
) => Promise<{ allowed: boolean }>;

/**
 * The limiter the production shell wires until B4 is resolved: it denies.
 *
 * A boundary with no agreed limit has no safe number to use, and denying without contacting the
 * upstream is the only answer that cannot be wrong.
 */
export const unconfiguredRateLimiter: ClubGatewayRateLimiter = async () => ({ allowed: false });

/** Resolve a limiter's answer, denying on throw, on a malformed result and on a missing limiter. */
export async function isWithinRateLimit(
  limiter: ClubGatewayRateLimiter | null | undefined,
  request: RateLimitRequest,
): Promise<boolean> {
  if (typeof limiter !== 'function') return false;

  let result: unknown;
  try {
    result = await limiter(request);
  } catch {
    return false;
  }

  if (typeof result !== 'object' || result === null || Array.isArray(result)) return false;
  return (result as { allowed: unknown }).allowed === true;
}

/* ------------------------------------------------------------------ Observability */

export const clubGatewayEvents = [
  'preflight',
  'method_rejected',
  'not_configured',
  'unauthenticated',
  'denied',
  'invalid_request',
  'rate_limited',
  'upstream_failed',
  'ok',
] as const;
export type ClubGatewayEvent = (typeof clubGatewayEvents)[number];

/** Everything an observer may see. No payload, no identity, no header, no URL, no key. */
export interface ClubGatewayLogRecord {
  event: ClubGatewayEvent;
  correlationId: string;
  status: number;
  /** Present only for failures; always a fixed code from a closed set. */
  reason?: string;
  /** Present only once the operation is known and inside the closed twelve. */
  operation?: Cqgw1Operation;
}

export type ClubGatewayLogger = (record: ClubGatewayLogRecord) => void;

/* ---------------------------------------------------------------- Dependencies */

export interface ClubGatewayShellDependencies {
  resolveCaller: CallerIdentityResolver;
  /** The production shell wires `denyAllAuthorizer` (plan §6.2, §6.3). */
  authorize: EntitlementAuthorizer;
  rateLimiter: ClubGatewayRateLimiter;
  /** `null` means the server is not configured; the reply says so without naming a variable. */
  transport: ClubGatewayTransport | null;
  /** Exact-match allowlist. An origin outside it gets no CORS headers at all. */
  allowedOrigins?: readonly string[];
  now?: () => number;
  newCorrelationId?: () => string;
  log?: ClubGatewayLogger;
  maxRequestBytes?: number;
}

/* ------------------------------------------------------------------ Responses */

/**
 * The complete outward error vocabulary. Fixed strings, no interpolation, no detail.
 *
 * `denied` is one constant used for every denial reason, so the 403 is byte-identical whatever
 * produced it.
 */
const BODIES = {
  methodNotAllowed: '{"error":"Method not allowed"}',
  notConfigured: '{"error":"Server is not configured"}',
  unauthenticated: '{"error":"Not authenticated"}',
  denied: '{"error":"Not permitted"}',
  invalid: '{"error":"Invalid request"}',
  unavailable: '{"error":"Unavailable"}',
} as const;

const CORRELATION_HEADER = 'X-Correlation-Id';
const CORRELATION_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

function corsHeaders(origin: string | null, allowed: readonly string[]): Record<string, string> {
  // `Vary: Origin` is set whether or not the origin matched: the response body differs by origin, and
  // a cache that does not know that will serve one origin's answer to another.
  const headers: Record<string, string> = { Vary: 'Origin' };
  if (origin && allowed.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Headers'] = 'authorization, content-type';
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
  }
  return headers;
}

/* ---------------------------------------------------------------------- Handler */

/**
 * Handle one request. Returns a `Response` and never throws.
 *
 * The only successful body is the operation's validated payload; every failure body is one of the
 * fixed strings above. No stack trace, internal URL, database detail, JWT claim or key material can
 * reach a caller, because none of them is ever placed in a response.
 */
export async function handleClubGatewayRequest(
  request: Request,
  dependencies: ClubGatewayShellDependencies,
): Promise<Response> {
  const allowedOrigins = dependencies.allowedOrigins ?? [];
  const origin = request.headers.get('Origin');
  const cors = corsHeaders(origin, allowedOrigins);
  const now = dependencies.now ?? (() => Date.now());

  const inboundCorrelation = request.headers.get(CORRELATION_HEADER);
  const correlationId =
    inboundCorrelation && CORRELATION_PATTERN.test(inboundCorrelation)
      ? inboundCorrelation
      : (dependencies.newCorrelationId ?? defaultCorrelationId)();

  const respond = (
    status: number,
    body: string,
    record: Omit<ClubGatewayLogRecord, 'correlationId' | 'status'>,
  ): Response => {
    dependencies.log?.({ ...record, correlationId, status });
    return new Response(body, {
      status,
      headers: {
        ...cors,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        [CORRELATION_HEADER]: correlationId,
      },
    });
  };

  // 1 — preflight.
  if (request.method === 'OPTIONS') {
    dependencies.log?.({ event: 'preflight', correlationId, status: 204 });
    return new Response(null, { status: 204, headers: cors });
  }

  // 2 — method.
  if (request.method !== 'POST') {
    return respond(405, BODIES.methodNotAllowed, { event: 'method_rejected' });
  }

  // 3 — configuration. Which piece is missing is never named.
  if (!dependencies.transport) {
    return respond(500, BODIES.notConfigured, { event: 'not_configured' });
  }

  // 4 — bearer present.
  const authorization = request.headers.get('Authorization') ?? '';
  if (!authorization.toLowerCase().startsWith('bearer ') || authorization.slice(7).trim() === '') {
    return respond(401, BODIES.unauthenticated, { event: 'unauthenticated', reason: 'bearer_missing' });
  }

  // 5 — identity from the caller's own token.
  const caller = await resolveCallerIdentity(dependencies.resolveCaller, authorization);
  if (!caller) {
    return respond(401, BODIES.unauthenticated, { event: 'unauthenticated', reason: 'session_invalid' });
  }

  // The body is read before entitlement because the authorizer needs to know which operation is
  // being asked for. Nothing about the body's validity is reported until entitlement has passed, so
  // an unentitled caller cannot use the reply to probe the parameter rules; an operation outside the
  // closed twelve simply cannot be entitled, and receives the same 403 as any other denial.
  //
  // The read goes through the shared capped reader, never `request.text()` or `request.json()`. An
  // authenticated caller can otherwise stream an unbounded chunked body — no `Content-Length` to
  // check, nothing to stop it — and exhaust the worker before the deny-all authorizer is ever
  // consulted. The cap is enforced by the reader, at the chunk that crosses it.
  const maxRequestBytes = dependencies.maxRequestBytes ?? CQGW1_MAX_BODY_BYTES;

  let parsedBody: unknown;
  try {
    const bytes = await readCappedStream(
      request.body,
      request.headers.get('Content-Length'),
      maxRequestBytes,
    );
    parsedBody = JSON.parse(decodeUtf8Strict(bytes));
  } catch (cause) {
    // One denial for an oversized body, a malformed declared length, a missing body, invalid UTF-8,
    // a failed read and unparsable JSON alike. The reason code stays internal; the caller gets the
    // same 403 as every other denial, and no fragment of what it sent is echoed back.
    const reason = cause instanceof CappedReadError ? cause.reason : 'body_unreadable';
    return respond(403, BODIES.denied, { event: 'denied', reason });
  }

  const operation = readOperation(parsedBody);

  // 6 + 7 — membership and entitlement, one identical denial for every reason.
  let entitledOrganizationId: string | null = null;
  if (operation) {
    for (const organizationId of caller.organizationIds) {
      if (await isEntitled(dependencies.authorize, { userId: caller.userId, organizationId, operation })) {
        entitledOrganizationId = organizationId;
        break;
      }
    }
  }
  if (!operation || entitledOrganizationId === null) {
    return respond(403, BODIES.denied, { event: 'denied', reason: 'not_entitled' });
  }

  // 8 — parameters. Only an entitled caller ever sees this answer.
  const query = readQuery(parsedBody);
  const validated = validateOperationQuery(operation, query);
  if (!validated.ok) {
    return respond(400, BODIES.invalid, {
      event: 'invalid_request',
      reason: validated.reason,
      operation,
    });
  }

  // 9 — rate limit. A denial here never reaches the upstream.
  const allowed = await isWithinRateLimit(dependencies.rateLimiter, {
    userId: caller.userId,
    organizationId: entitledOrganizationId,
    operation,
    nowMs: now(),
  });
  if (!allowed) {
    return respond(429, BODIES.unavailable, { event: 'rate_limited', operation });
  }

  // 10 — sign and send.
  const outcome = await dependencies.transport({ operation, query: validated.query });

  if (outcome.status === CLUB_GATEWAY_OUTCOME_STATUS.ok) {
    dependencies.log?.({ event: 'ok', correlationId, status: 200, operation });
    return new Response(JSON.stringify(outcome.body ?? null), {
      status: 200,
      headers: {
        ...cors,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        [CORRELATION_HEADER]: correlationId,
      },
    });
  }

  if (outcome.status === CLUB_GATEWAY_OUTCOME_STATUS.invalidQuery) {
    return respond(400, BODIES.invalid, {
      event: 'invalid_request',
      ...(outcome.reason === undefined ? {} : { reason: outcome.reason }),
      operation,
    });
  }

  return respond(outcome.status, BODIES.unavailable, {
    event: 'upstream_failed',
    ...(outcome.reason === undefined ? {} : { reason: outcome.reason }),
    operation,
  });
}

/* ------------------------------------------------------------------- Helpers */

function readOperation(body: unknown): Cqgw1Operation | null {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null;
  const keys = Object.keys(body as Record<string, unknown>);
  // The exact-key rule is what stops an identity riding along in the body.
  if (keys.some((key) => key !== 'operation' && key !== 'query')) return null;
  const operation = (body as { operation?: unknown }).operation;
  return isCqgw1Operation(operation) ? operation : null;
}

function readQuery(body: unknown): unknown {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return undefined;
  return (body as { query?: unknown }).query;
}

function defaultCorrelationId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let out = '';
  for (const byte of bytes) out += byte.toString(16).padStart(2, '0');
  return out;
}
