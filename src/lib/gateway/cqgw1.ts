// CQGW1 — the server-to-server signing contract between the Cogniiq gateway function and the
// upstream club read gateway.
//
// This module is server-side only. No browser component imports it, and none may: the browser sends
// nothing but its own Cogniiq session, and knows neither that this protocol exists nor where the
// upstream is.
//
// ─── What changed against the D1 addendum ────────────────────────────────────────────────────────
//
// 1. `X-CQ-Operation` is part of the signed header set. The canonical string commits to the
//    operation, so the verifier must know it *before* it can rebuild the string — and it cannot
//    learn it from the body, because the body must not be parsed until the signature verifies.
//
// 2. The instruction to "compare the computed body hash with the signed hash before verifying the
//    signature" is removed as impossible: no body-hash header is transmitted, so there is nothing to
//    compare against. Integrity comes from building the canonical string *with the locally computed
//    hash* and having the Ed25519 verification succeed. A tampered body yields a different hash,
//    hence a different canonical string, hence a failed verification.
//
// 3. No custom cryptography. Signing and verification go through `crypto.subtle` with the platform
//    Ed25519 primitive. This module makes no claim about constant-time execution: the guarantee is
//    the platform's, and an ordinary wall-clock test cannot demonstrate it.
//
// ─── Canonical string ────────────────────────────────────────────────────────────────────────────
//
//   CQGW1\n
//   <byteLen>:<http_method>\n
//   <byteLen>:<canonical_path>\n
//   <byteLen>:<key_id>\n
//   <byteLen>:<timestamp_unix_seconds>\n
//   <byteLen>:<request_id>\n
//   <byteLen>:<operation>\n
//   <byteLen>:<body_sha256_lowercase_hex>
//
// Every length is a **UTF-8 byte** count. Length prefixing is what makes field boundaries
// unforgeable: without it, moving a character from the end of one field to the start of the next
// produces the same concatenation and therefore the same signature.

import { base64urlDecode, base64urlEncode, sha256Hex, utf8ByteLength, utf8Bytes } from './encoding.ts';

export const CQGW1_VERSION = 'CQGW1';

/** The one path this contract signs for. Never a scheme, host, query string or fragment. */
export const CQGW1_CANONICAL_PATH = '/functions/v1/cogniiq-read-gateway';

/** Signed transport headers. All six are mandatory. */
export const CQGW1_HEADERS = {
  version: 'X-CQ-Version',
  keyId: 'X-CQ-Key-Id',
  timestamp: 'X-CQ-Timestamp',
  requestId: 'X-CQ-Request-Id',
  operation: 'X-CQ-Operation',
  signature: 'X-CQ-Signature',
} as const;

/** ±60 seconds. This window is the entire replay exposure for these pure-read operations. */
export const CQGW1_MAX_SKEW_SECONDS = 60;

/** 64 KiB. Bytes beyond this are never read, let alone hashed. */
export const CQGW1_MAX_BODY_BYTES = 64 * 1024;

/**
 * The closed operation union — one name per method on the read-only adapter contract, and nothing
 * else. A caller cannot name a table, a query, a URL or a project; it can only name one of these.
 */
export const cqgw1Operations = [
  'getOverview',
  'listBookings',
  'listPayments',
  'listInvoices',
  'listReconciliation',
  'getMonthlyReport',
  'getReport',
  'listVouchers',
  'listMembers',
  'listActivity',
  'listAlerts',
  'getSettings',
] as const;
export type Cqgw1Operation = (typeof cqgw1Operations)[number];

const operationSet: ReadonlySet<string> = new Set(cqgw1Operations);

export function isCqgw1Operation(value: unknown): value is Cqgw1Operation {
  return typeof value === 'string' && operationSet.has(value);
}

export interface Cqgw1CanonicalParts {
  method: string;
  path: string;
  keyId: string;
  /** Unix seconds, as the decimal string that travels in the header. */
  timestamp: string;
  requestId: string;
  operation: Cqgw1Operation;
  /** Lowercase hex SHA-256 of the exact raw request bytes. */
  bodySha256Hex: string;
}

function lengthPrefixed(value: string): string {
  return `${utf8ByteLength(value)}:${value}`;
}

/** Build the canonical string. Pure; no clock, no key, no I/O. */
export function buildCanonicalString(parts: Cqgw1CanonicalParts): string {
  return [
    CQGW1_VERSION,
    lengthPrefixed(parts.method),
    lengthPrefixed(parts.path),
    lengthPrefixed(parts.keyId),
    lengthPrefixed(parts.timestamp),
    lengthPrefixed(parts.requestId),
    lengthPrefixed(parts.operation),
    lengthPrefixed(parts.bodySha256Hex),
  ].join('\n');
}

/* ------------------------------------------------------------------ Primitives */

const ED25519 = { name: 'Ed25519' } as const;

/** Ed25519 signature length in bytes. A signature of any other length is rejected before verifying. */
const SIGNATURE_BYTES = 64;

/**
 * Sign a canonical string. The private key never appears in a log line, an error or a return value.
 *
 * The key is passed as an already-imported `CryptoKey` so that no code path in this module ever
 * handles raw private key material.
 */
export async function signCanonicalString(
  privateKey: CryptoKey,
  canonical: string,
): Promise<string> {
  const signature = await crypto.subtle.sign(ED25519, privateKey, utf8Bytes(canonical));
  return base64urlEncode(new Uint8Array(signature));
}

/** Verify a base64url-unpadded signature over a canonical string. Never throws on a bad signature. */
export async function verifyCanonicalString(
  publicKey: CryptoKey,
  canonical: string,
  signatureBase64Url: string,
): Promise<boolean> {
  let signature: Uint8Array<ArrayBuffer>;
  try {
    signature = base64urlDecode(signatureBase64Url);
  } catch {
    return false;
  }
  if (signature.length !== SIGNATURE_BYTES) return false;
  return crypto.subtle.verify(
    ED25519,
    publicKey,
    signature,
    utf8Bytes(canonical),
  );
}

/* ---------------------------------------------------------------- Verification */

/**
 * Why a request was rejected. Internal only — the transmitted body is opaque and identical for every
 * rejection, so a caller cannot probe which step failed.
 */
export const cqgw1RejectionReasons = [
  'version_unsupported',
  'headers_missing',
  'headers_malformed',
  'operation_unknown',
  'timestamp_out_of_window',
  'body_too_large',
  'key_unknown',
  'signature_invalid',
  'body_unparsable',
  'operation_mismatch',
  'payload_invalid',
] as const;
export type Cqgw1RejectionReason = (typeof cqgw1RejectionReasons)[number];

/** HTTP status per rejection. Every 401 body is byte-identical; the reason stays server-side. */
const REJECTION_STATUS: Record<Cqgw1RejectionReason, number> = {
  version_unsupported: 400,
  headers_missing: 400,
  headers_malformed: 400,
  operation_unknown: 400,
  timestamp_out_of_window: 401,
  body_too_large: 413,
  key_unknown: 401,
  signature_invalid: 401,
  body_unparsable: 400,
  operation_mismatch: 400,
  payload_invalid: 400,
};

export interface Cqgw1Rejected {
  ok: false;
  reason: Cqgw1RejectionReason;
  status: number;
}

export interface Cqgw1Accepted {
  ok: true;
  keyId: string;
  requestId: string;
  operation: Cqgw1Operation;
  /** The parsed body — produced only after the signature verified. */
  body: Record<string, unknown>;
}

export type Cqgw1VerificationResult = Cqgw1Accepted | Cqgw1Rejected;

function reject(reason: Cqgw1RejectionReason): Cqgw1Rejected {
  return { ok: false, reason, status: REJECTION_STATUS[reason] };
}

export interface Cqgw1VerifyInput {
  method: string;
  path: string;
  /** Case-insensitive header lookup, as a `Headers` object provides. */
  header: (name: string) => string | null | undefined;
  /** The exact raw request bytes, already capped by the caller's reader. */
  rawBody: Uint8Array;
  /** Unix seconds. The verifier's own clock — never a client-supplied offset. */
  nowSeconds: number;
  /** Trusted public keys by key id. A key id outside this map is unknown. */
  publicKeys: ReadonlyMap<string, CryptoKey>;
  /** Optional per-operation payload validation, run last of all. */
  validatePayload?: (operation: Cqgw1Operation, body: Record<string, unknown>) => boolean;
  maxBodyBytes?: number;
  maxSkewSeconds?: number;
}

const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;
const TIMESTAMP_PATTERN = /^\d{1,12}$/;
const KEY_ID_PATTERN = /^[A-Za-z0-9_.-]{1,64}$/;

/**
 * The verification order, fail-closed at every step.
 *
 *   1  reject an unknown version
 *   2  require every header, including the operation header
 *   3  reject an operation outside the closed union
 *   4  enforce the ±60 s timestamp window
 *   5  refuse a body over the cap (the caller must not have read past it either)
 *   6  SHA-256 the exact raw bytes
 *   7  build the canonical string from the *header* operation and the *computed* hash
 *   8  verify the Ed25519 signature
 *   9  only now, parse the JSON body
 *  10  require body.operation === the signed header operation
 *  11  validate the operation-specific payload
 *
 * A database or adapter call may happen only after this returns `ok`.
 */
export async function verifyCqgw1Request(input: Cqgw1VerifyInput): Promise<Cqgw1VerificationResult> {
  const maxBodyBytes = input.maxBodyBytes ?? CQGW1_MAX_BODY_BYTES;
  const maxSkew = input.maxSkewSeconds ?? CQGW1_MAX_SKEW_SECONDS;

  // 1 — version, before anything else is looked at.
  if (input.header(CQGW1_HEADERS.version) !== CQGW1_VERSION) return reject('version_unsupported');

  // 2 — all headers present.
  const keyId = input.header(CQGW1_HEADERS.keyId);
  const timestamp = input.header(CQGW1_HEADERS.timestamp);
  const requestId = input.header(CQGW1_HEADERS.requestId);
  const operationHeader = input.header(CQGW1_HEADERS.operation);
  const signature = input.header(CQGW1_HEADERS.signature);
  if (!keyId || !timestamp || !requestId || !operationHeader || !signature) {
    return reject('headers_missing');
  }
  if (
    !KEY_ID_PATTERN.test(keyId) ||
    !TIMESTAMP_PATTERN.test(timestamp) ||
    !REQUEST_ID_PATTERN.test(requestId)
  ) {
    return reject('headers_malformed');
  }

  // 3 — operation inside the closed union.
  if (!isCqgw1Operation(operationHeader)) return reject('operation_unknown');

  // 4 — freshness, on the verifier's own clock.
  if (Math.abs(input.nowSeconds - Number(timestamp)) > maxSkew) {
    return reject('timestamp_out_of_window');
  }

  // 5 — size cap.
  if (input.rawBody.byteLength > maxBodyBytes) return reject('body_too_large');

  // 6 — hash the exact bytes, never a re-serialisation of a parsed object.
  const bodySha256Hex = await sha256Hex(input.rawBody);

  // 7 — canonical string from the header operation and the computed hash. There is no transmitted
  //     body hash to compare against; the comparison happens implicitly in step 8.
  const canonical = buildCanonicalString({
    method: input.method,
    path: input.path,
    keyId,
    timestamp,
    requestId,
    operation: operationHeader,
    bodySha256Hex,
  });

  // 8 — key resolution, then signature verification.
  const publicKey = input.publicKeys.get(keyId);
  if (!publicKey) return reject('key_unknown');
  if (!(await verifyCanonicalString(publicKey, canonical, signature))) {
    return reject('signature_invalid');
  }

  // 9 — only now is the body parsed.
  let body: unknown;
  try {
    body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(input.rawBody));
  } catch {
    return reject('body_unparsable');
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return reject('body_unparsable');
  }
  const record = body as Record<string, unknown>;

  // 10 — the body may restate the operation, but it must agree with the signed header.
  if ('operation' in record && record.operation !== operationHeader) {
    return reject('operation_mismatch');
  }

  // 11 — operation-specific payload validation.
  if (input.validatePayload && !input.validatePayload(operationHeader, record)) {
    return reject('payload_invalid');
  }

  return { ok: true, keyId, requestId, operation: operationHeader, body: record };
}

/* ------------------------------------------------------------------- Outbound */

export interface Cqgw1SignedRequest {
  headers: Record<string, string>;
  /** The exact bytes that were hashed. Send these, unchanged. */
  rawBody: Uint8Array;
}

/**
 * Produce the signed header set for an outbound request.
 *
 * The body is hashed as the exact bytes handed in, and those same bytes are returned: re-serialising
 * a parsed object before sending would break the signature in a way that is very hard to see.
 */
export async function signCqgw1Request(options: {
  privateKey: CryptoKey;
  keyId: string;
  method: string;
  path: string;
  requestId: string;
  timestampSeconds: number;
  operation: Cqgw1Operation;
  rawBody: Uint8Array;
}): Promise<Cqgw1SignedRequest> {
  const timestamp = String(Math.floor(options.timestampSeconds));
  const bodySha256Hex = await sha256Hex(options.rawBody);
  const canonical = buildCanonicalString({
    method: options.method,
    path: options.path,
    keyId: options.keyId,
    timestamp,
    requestId: options.requestId,
    operation: options.operation,
    bodySha256Hex,
  });
  const signature = await signCanonicalString(options.privateKey, canonical);

  return {
    headers: {
      [CQGW1_HEADERS.version]: CQGW1_VERSION,
      [CQGW1_HEADERS.keyId]: options.keyId,
      [CQGW1_HEADERS.timestamp]: timestamp,
      [CQGW1_HEADERS.requestId]: options.requestId,
      [CQGW1_HEADERS.operation]: options.operation,
      [CQGW1_HEADERS.signature]: signature,
    },
    rawBody: options.rawBody,
  };
}
