// The outbound half of the Club Operations read gateway (D3b-A, §4, §5).
//
// It does exactly four things: canonicalise the request body, sign it with CQGW1, issue one HTTPS
// request with a hard abort budget and no redirect tolerance, and hand the response to the §5.2
// validation pipeline. Everything it needs from the outside — the endpoint, the key id, the signing
// key, `fetch`, the clock, the request-id source, the result validators — is injected, so the whole
// path is exercisable locally without a network, a hosted project or a real credential.
//
// Nothing in this module logs. Not the signing key, not the caller's JWT, not an authorization
// header, not a request body, not a response body. The only thing that leaves it is a status and a
// reason code.
//
// The response is unsigned; see `clubGatewayResponse.ts` for the exact statement of what that does
// and does not protect.

import { base64urlDecode, base64urlEncode, utf8Bytes } from './encoding.ts';
import { canonicalJson } from './canonicalJson.ts';
import {
  CQGW1_CANONICAL_PATH,
  CQGW1_MAX_BODY_BYTES,
  signCqgw1Request,
  type Cqgw1Operation,
} from './cqgw1.ts';
import {
  GatewayResponseError,
  readGatewayEnvelope,
  type GatewayResultValidator,
} from './clubGatewayResponse.ts';

/**
 * Total per-request budget. The upstream statement timeout is 2 s, server-enforced; this covers
 * connection establishment, upstream verification, the query and the transfer. There is no retry: a
 * timed-out statement was cancelled upstream, and reissuing it immediately is how retry storms start.
 */
export const CLUB_GATEWAY_TIMEOUT_MS = 10_000;

/**
 * The statuses this transport reports outward, chosen for how the read-only adapter maps them.
 *
 *   200 → the validated result
 *   400 → the upstream refused the parameters            → `invalid_query`
 *   502 → the request did not produce a trustworthy answer → `unavailable`
 *   406 → an answer arrived and was not the contract's answer → `unknown`
 *
 * 406 is deliberately outside every range the adapter maps to a specific code, which is what makes a
 * protocol failure surface as `unknown` rather than as a permission or availability problem.
 */
export const CLUB_GATEWAY_OUTCOME_STATUS = {
  ok: 200,
  invalidQuery: 400,
  unavailable: 502,
  protocol: 406,
} as const;

export interface ClubGatewayTransportRequest {
  operation: Cqgw1Operation;
  query: Record<string, unknown>;
}

export interface ClubGatewayTransportResult {
  status: number;
  /** The validated operation payload on success; `null` on every failure. */
  body: unknown;
  /** Correlates this call with its upstream request. Never contains identity. */
  requestId: string;
  /** Internal reason code for logging. Never a value, a URL, a header or a body fragment. */
  reason?: string;
}

export type ClubGatewayTransport = (
  request: ClubGatewayTransportRequest,
) => Promise<ClubGatewayTransportResult>;

/** Raised when the transport cannot be constructed at all. Carries a reason, never a value. */
export class GatewayConfigError extends Error {
  readonly reason: string;

  constructor(reason: string) {
    super(`gateway transport misconfigured: ${reason}`);
    this.name = 'GatewayConfigError';
    this.reason = reason;
  }
}

/* --------------------------------------------------------------------- Endpoint */

/**
 * Resolve the one URL this transport may call.
 *
 * The path is not configurable: `CQGW1_CANONICAL_PATH` is what every signature commits to, so a
 * configured base carrying its own path, query or fragment is a misconfiguration rather than
 * something to normalise away. Plain HTTP is refused outright — TLS is the entire transit
 * protection for an unsigned response.
 */
export function resolveGatewayEndpoint(baseUrl: string): string {
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    throw new GatewayConfigError('endpoint_unparsable');
  }
  if (url.protocol !== 'https:') throw new GatewayConfigError('endpoint_not_https');
  if (url.search !== '' || url.hash !== '') throw new GatewayConfigError('endpoint_has_query');
  if (url.pathname !== '/' && url.pathname !== '') throw new GatewayConfigError('endpoint_has_path');
  if (url.username !== '' || url.password !== '') {
    throw new GatewayConfigError('endpoint_has_credentials');
  }
  return `${url.origin}${CQGW1_CANONICAL_PATH}`;
}

/* ------------------------------------------------------------------ Signing key */

/**
 * Import a PKCS#8 Ed25519 private key from its base64url encoding.
 *
 * The raw bytes never leave this function and are never returned, stringified or logged. A malformed
 * value produces a reason code and nothing else — echoing the input would put key material in an
 * error message.
 */
export async function importCqgw1SigningKey(base64urlPkcs8: string): Promise<CryptoKey> {
  let bytes: Uint8Array<ArrayBuffer>;
  try {
    bytes = base64urlDecode(base64urlPkcs8);
  } catch {
    throw new GatewayConfigError('signing_key_encoding');
  }
  try {
    return await crypto.subtle.importKey('pkcs8', bytes, { name: 'Ed25519' }, false, ['sign']);
  } catch {
    throw new GatewayConfigError('signing_key_unusable');
  }
}

/* ------------------------------------------------------------------ Request ids */

const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

/**
 * A fresh request id — which is also CQGW1's nonce: the contract carries no separate nonce header,
 * and `X-CQ-Request-Id` is what the upstream's replay window is keyed on (§4).
 */
export function createRandomRequestId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return base64urlEncode(bytes);
}

/* ------------------------------------------------------------------- Transport */

export interface ClubGatewayTransportConfig {
  /** Origin of the upstream project. Path, query and fragment are refused (see above). */
  baseUrl: string;
  keyId: string;
  /** Already imported, so no code path here handles raw private key material. */
  signingKey: CryptoKey;
  validateResult: GatewayResultValidator;
  fetchImpl?: typeof fetch;
  /** Milliseconds since the epoch. Injectable so signatures are reproducible in a test. */
  now?: () => number;
  /** The CQGW1 nonce source. Injectable for the same reason. */
  newRequestId?: () => string;
  timeoutMs?: number;
  maxResponseBytes?: number;
}

const KEY_ID_PATTERN = /^[A-Za-z0-9_.-]{1,64}$/;

function outcomeFor(error: GatewayResponseError, requestId: string): ClubGatewayTransportResult {
  const status =
    error.failureClass === 'invalid_query'
      ? CLUB_GATEWAY_OUTCOME_STATUS.invalidQuery
      : error.failureClass === 'unavailable'
        ? CLUB_GATEWAY_OUTCOME_STATUS.unavailable
        : CLUB_GATEWAY_OUTCOME_STATUS.protocol;
  return { status, body: null, requestId, reason: error.reason };
}

/**
 * Build the transport. Throws `GatewayConfigError` if it cannot be built — a boundary that cannot
 * sign correctly must fail to start rather than send something unsigned or wrongly signed.
 */
export function createClubGatewayTransport(
  config: ClubGatewayTransportConfig,
): ClubGatewayTransport {
  const endpoint = resolveGatewayEndpoint(config.baseUrl);
  if (!KEY_ID_PATTERN.test(config.keyId)) throw new GatewayConfigError('key_id_malformed');
  if (typeof config.validateResult !== 'function') {
    throw new GatewayConfigError('result_validator_missing');
  }

  const fetchImpl = config.fetchImpl ?? globalThis.fetch;
  if (typeof fetchImpl !== 'function') throw new GatewayConfigError('fetch_unavailable');

  const now = config.now ?? (() => Date.now());
  const newRequestId = config.newRequestId ?? createRandomRequestId;
  const timeoutMs = config.timeoutMs ?? CLUB_GATEWAY_TIMEOUT_MS;
  const maxResponseBytes = config.maxResponseBytes;

  return async function clubGatewayTransport(
    request: ClubGatewayTransportRequest,
  ): Promise<ClubGatewayTransportResult> {
    const requestId = newRequestId();
    if (typeof requestId !== 'string' || !REQUEST_ID_PATTERN.test(requestId)) {
      return { status: CLUB_GATEWAY_OUTCOME_STATUS.unavailable, body: null, requestId: '', reason: 'request_id_malformed' };
    }

    let rawBody: Uint8Array<ArrayBuffer>;
    try {
      rawBody = utf8Bytes(canonicalJson({ operation: request.operation, query: request.query }));
    } catch {
      // A body that cannot be canonicalised cannot be signed reproducibly, so it is never sent.
      return { status: CLUB_GATEWAY_OUTCOME_STATUS.invalidQuery, body: null, requestId, reason: 'body_not_canonical' };
    }
    if (rawBody.byteLength > CQGW1_MAX_BODY_BYTES) {
      return { status: CLUB_GATEWAY_OUTCOME_STATUS.invalidQuery, body: null, requestId, reason: 'body_too_large' };
    }

    const signed = await signCqgw1Request({
      privateKey: config.signingKey,
      keyId: config.keyId,
      method: 'POST',
      path: CQGW1_CANONICAL_PATH,
      requestId,
      timestampSeconds: Math.floor(now() / 1000),
      operation: request.operation,
      rawBody,
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: {
          ...signed.headers,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: signed.rawBody as BodyInit,
        // 1 — a redirect is a hard failure, never followed. The upstream has exactly one path.
        redirect: 'error',
        signal: controller.signal,
      });
    } catch {
      // 2 — an abort lands here as well; no partial read is ever parsed.
      clearTimeout(timer);
      const reason = controller.signal.aborted ? 'timeout' : 'transport_failed';
      return { status: CLUB_GATEWAY_OUTCOME_STATUS.unavailable, body: null, requestId, reason };
    }

    try {
      // A fetch implementation that surfaces a redirect instead of throwing is refused here, so the
      // guarantee does not depend on which of the two behaviours the runtime chose.
      if (response.redirected || (response.status >= 300 && response.status < 400)) {
        return {
          status: CLUB_GATEWAY_OUTCOME_STATUS.unavailable,
          body: null,
          requestId,
          reason: 'redirect_refused',
        };
      }

      const result = await readGatewayEnvelope({
        response,
        requestId,
        operation: request.operation,
        validateResult: config.validateResult,
        // The same signal the fetch was issued with, so an abort that lands while the body is still
        // streaming is reported as the timeout it is rather than as a network failure.
        signal: controller.signal,
        ...(maxResponseBytes === undefined ? {} : { maxBytes: maxResponseBytes }),
      });
      return { status: CLUB_GATEWAY_OUTCOME_STATUS.ok, body: result, requestId };
    } catch (cause) {
      if (cause instanceof GatewayResponseError) return outcomeFor(cause, requestId);
      return {
        status: CLUB_GATEWAY_OUTCOME_STATUS.unavailable,
        body: null,
        requestId,
        reason: 'transport_failed',
      };
    } finally {
      clearTimeout(timer);
    }
  };
}
