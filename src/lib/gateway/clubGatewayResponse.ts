// The upstream response pipeline for the Club Operations read gateway (D3b-A, §5.2).
//
// ─── What protects a response, stated exactly ────────────────────────────────────────────────────
//
// Responses from the upstream gateway are **unsigned** (owner decision 1). What protects them is
// **transport protection + application validation, not cryptographic end-to-end authenticity**.
// HTTPS protects the bytes in transit; this module treats everything that arrives as untrusted input
// and validates it exhaustively before any of it reaches a caller. It cannot distinguish "the real
// upstream answered" from "something holding a valid certificate at that host answered". Every
// operation is a pure read and a forged response can only mislead a dashboard — never cause a write
// — which is why the owner accepts this for the read-only release.
//
// There is no CQGW1-R, no response key pair, no response-signing secret and no environment variable
// for any of those. Adding one is a contract change, not an implementation detail.
//
// ─── The checks, in order, fail-closed at every step ─────────────────────────────────────────────
//
//   3  HTTP status classification
//   4  `Content-Type` exactly `application/json` (only `charset=utf-8` tolerated as a parameter)
//   5  capped reader — 4 MiB hard maximum, enforced *while streaming*; a declared `Content-Length`
//      over the cap is refused before a single byte is read
//   6  UTF-8 decode with `fatal: true`, then `JSON.parse` — malformed and truncated bodies both die
//      here, because a truncated body is not valid JSON
//   7  envelope shape: exactly `requestId`, `operation`, `result`; an unknown top-level field is a
//      failure, never something to ignore
//   8  `requestId` equals the id this side generated — a delayed or crossed response cannot satisfy
//      the wrong call
//   9  `operation` equals the operation this side requested
//  10  `result` passes the operation's runtime validator
//
// Steps 1 and 2 — redirect refusal and the abort budget — belong to the caller that issues the
// request, because they are properties of the fetch, not of the response (`clubGatewayTransport.ts`).

import {
  CappedReadError,
  decodeUtf8Strict,
  readCappedStream,
} from './cappedRead.ts';
import type { Cqgw1Operation } from './cqgw1.ts';

/** Hard maximum. Bytes beyond it are never read, let alone parsed. */
export const CLUB_GATEWAY_MAX_RESPONSE_BYTES = 4 * 1024 * 1024;

/** The three fields the envelope has. Not a minimum — an exact set (§5.1). */
export const CLUB_GATEWAY_ENVELOPE_KEYS = ['requestId', 'operation', 'result'] as const;

/**
 * Why a response was refused. Internal only: these never cross a boundary, and the public error
 * surface stays the five adapter codes.
 */
export const gatewayResponseFailureReasons = [
  'redirect_refused',
  'transport_failed',
  'timeout',
  'status_invalid_query',
  'status_untrusted',
  'status_unavailable',
  'status_unexpected',
  'content_type_invalid',
  'body_missing',
  'body_too_large',
  'body_undecodable',
  'body_unparsable',
  'envelope_shape',
  'request_id_mismatch',
  'operation_mismatch',
  'result_invalid',
] as const;
export type GatewayResponseFailureReason = (typeof gatewayResponseFailureReasons)[number];

/**
 * How a failure is answered outward.
 *
 *   `unavailable`   the request did not produce a trustworthy answer — including a 401/403 from the
 *                   upstream, which is a trust failure between the two servers and must never be
 *                   surfaced as a permission problem, or the client becomes an oracle for that
 *                   relationship;
 *   `invalid_query` the upstream refused the parameters;
 *   `protocol`      an answer arrived and was not the contract's answer.
 */
export type GatewayFailureClass = 'unavailable' | 'invalid_query' | 'protocol';

/** Carries a reason code and nothing else. No value, no header, no body fragment, no URL. */
export class GatewayResponseError extends Error {
  readonly reason: GatewayResponseFailureReason;
  readonly failureClass: GatewayFailureClass;

  constructor(reason: GatewayResponseFailureReason, failureClass: GatewayFailureClass) {
    super(`gateway response rejected: ${reason}`);
    this.name = 'GatewayResponseError';
    this.reason = reason;
    this.failureClass = failureClass;
  }
}

/**
 * Validates the operation-specific payload. Throws on anything it does not recognise.
 *
 * Injected rather than imported: the runtime validators are owned by the solution module, which no
 * file outside it may name. A missing or non-callable validator is a denial (step 10 below), so an
 * unwired registry fails closed rather than waving payloads through.
 */
export type GatewayResultValidator = (operation: Cqgw1Operation, result: unknown) => unknown;

export interface ReadGatewayEnvelopeOptions {
  response: Response;
  /** The id this side generated for this request. */
  requestId: string;
  /** The operation this side asked for. */
  operation: Cqgw1Operation;
  validateResult: GatewayResultValidator;
  maxBytes?: number;
  /**
   * The request's abort signal, when there is one. Used only to tell a timeout apart from an
   * unrelated stream failure while the body is still arriving.
   */
  signal?: AbortSignal;
}

/* ------------------------------------------------------------------ 3 — status */

/** Maps an upstream HTTP status onto the contract's classification (§5.2 step 3, §12). */
export function classifyUpstreamStatus(status: number): GatewayResponseError | null {
  if (status === 200) return null;
  if (status === 400 || status === 422) {
    return new GatewayResponseError('status_invalid_query', 'invalid_query');
  }
  if (status === 401 || status === 403) {
    return new GatewayResponseError('status_untrusted', 'unavailable');
  }
  if (status === 413 || status === 429 || status >= 500) {
    return new GatewayResponseError('status_unavailable', 'unavailable');
  }
  return new GatewayResponseError('status_unexpected', 'protocol');
}

/* ------------------------------------------------------------ 4 — content type */

/**
 * `application/json`, optionally with a single `charset=utf-8`. Everything else is refused.
 *
 * The permitted spellings are exactly `utf-8` and `"utf-8"`, case-insensitively. A quoted value must
 * be *balanced*: `charset="utf-8` is a malformed header, and stripping the stray quote to see what
 * was probably meant is how a parser ends up disagreeing with the parser on the other side of the
 * wire. A repeated `charset` is likewise refused rather than resolved by picking one — two answers
 * to one question is not a header this contract accepts.
 */
export function isPermittedContentType(raw: string | null): boolean {
  if (!raw) return false;
  const parts = raw.split(';').map((part) => part.trim());
  if (parts[0].toLowerCase() !== 'application/json') return false;

  let sawCharset = false;
  for (const parameter of parts.slice(1)) {
    if (parameter === '') return false;
    const separator = parameter.indexOf('=');
    if (separator < 0) return false;

    const name = parameter.slice(0, separator).trim().toLowerCase();
    if (name !== 'charset') return false;
    if (sawCharset) return false; // duplicate charset
    sawCharset = true;

    const rawValue = parameter.slice(separator + 1).trim();
    const startsQuoted = rawValue.startsWith('"');
    const endsQuoted = rawValue.endsWith('"');
    let value: string;
    if (startsQuoted || endsQuoted) {
      // A quote on one end only is unbalanced, and a bare `"` is both ends of nothing.
      if (!startsQuoted || !endsQuoted || rawValue.length < 2) return false;
      value = rawValue.slice(1, -1);
      if (value.includes('"')) return false;
    } else {
      value = rawValue;
    }
    if (value.toLowerCase() !== 'utf-8') return false;
  }
  return true;
}

/* --------------------------------------------------------------- 5 — capped read */

/**
 * Map the shared reader's reasons onto this pipeline's vocabulary.
 *
 * `read_failed` is the one that needs the signal: a stream that dies because *our own* abort fired
 * is a timeout, and a stream that dies for any other reason is a transport failure. Both answer
 * `unavailable` outward, so the distinction is for the operator reading the logs, not for the
 * caller — but an operator chasing a latency problem should not be told the network flaked.
 */
function fromCappedRead(error: CappedReadError, signal?: AbortSignal): GatewayResponseError {
  switch (error.reason) {
    case 'declared_length_invalid':
      return new GatewayResponseError('body_unparsable', 'protocol');
    case 'declared_length_over_cap':
    case 'body_too_large':
      return new GatewayResponseError('body_too_large', 'protocol');
    case 'body_missing':
      return new GatewayResponseError('body_missing', 'protocol');
    case 'read_failed':
      return signal?.aborted
        ? new GatewayResponseError('timeout', 'unavailable')
        : new GatewayResponseError('transport_failed', 'unavailable');
  }
}

/**
 * Read a response body through the hard cap, refusing **while streaming**.
 *
 * The cap is not a post-hoc length check: a body that exceeds it is abandoned at the chunk that
 * crosses the line and the remainder is never pulled, so an oversized or endless response cannot be
 * used to exhaust this side's memory. A declared `Content-Length` above the cap short-circuits the
 * read entirely; a declared length *below* the true size grants nothing.
 */
export async function readCappedBody(
  response: Response,
  maxBytes: number = CLUB_GATEWAY_MAX_RESPONSE_BYTES,
  signal?: AbortSignal,
): Promise<Uint8Array> {
  try {
    return await readCappedStream(response.body, response.headers.get('content-length'), maxBytes);
  } catch (cause) {
    if (cause instanceof CappedReadError) throw fromCappedRead(cause, signal);
    throw new GatewayResponseError('transport_failed', 'unavailable');
  }
}

/* ------------------------------------------------------------------- 6..10 */

function parseJsonStrict(bytes: Uint8Array): unknown {
  let text: string;
  try {
    text = decodeUtf8Strict(bytes);
  } catch {
    throw new GatewayResponseError('body_undecodable', 'protocol');
  }
  try {
    return JSON.parse(text);
  } catch {
    // A truncated body lands here too: a cut-off object is not valid JSON.
    throw new GatewayResponseError('body_unparsable', 'protocol');
  }
}

/**
 * Run steps 3–10 over an upstream response and return the validated `result`.
 *
 * Throws `GatewayResponseError` and nothing else. Only a value that survives every step is returned,
 * so no caller ever sees a partially valid object.
 */
export async function readGatewayEnvelope(
  options: ReadGatewayEnvelopeOptions,
): Promise<unknown> {
  const { response, requestId, operation, validateResult } = options;
  const maxBytes = options.maxBytes ?? CLUB_GATEWAY_MAX_RESPONSE_BYTES;

  // 3 — status.
  const statusFailure = classifyUpstreamStatus(response.status);
  if (statusFailure) throw statusFailure;

  // 4 — content type.
  if (!isPermittedContentType(response.headers.get('content-type'))) {
    throw new GatewayResponseError('content_type_invalid', 'protocol');
  }

  // 5 — capped read, 6 — decode and parse.
  const parsed = parseJsonStrict(await readCappedBody(response, maxBytes, options.signal));

  // 7 — exact envelope shape.
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new GatewayResponseError('envelope_shape', 'protocol');
  }
  const envelope = parsed as Record<string, unknown>;
  const keys = Object.keys(envelope);
  if (keys.length !== CLUB_GATEWAY_ENVELOPE_KEYS.length) {
    throw new GatewayResponseError('envelope_shape', 'protocol');
  }
  for (const key of CLUB_GATEWAY_ENVELOPE_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(envelope, key)) {
      throw new GatewayResponseError('envelope_shape', 'protocol');
    }
  }

  // 8 — correlation.
  if (typeof envelope.requestId !== 'string' || envelope.requestId !== requestId) {
    throw new GatewayResponseError('request_id_mismatch', 'protocol');
  }

  // 9 — operation echo.
  if (envelope.operation !== operation) {
    throw new GatewayResponseError('operation_mismatch', 'protocol');
  }

  // 10 — operation-specific runtime validation. A missing implementation denies.
  if (typeof validateResult !== 'function') {
    throw new GatewayResponseError('result_invalid', 'protocol');
  }
  try {
    return validateResult(operation, envelope.result);
  } catch {
    throw new GatewayResponseError('result_invalid', 'protocol');
  }
}
