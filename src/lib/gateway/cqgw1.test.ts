// CQGW1 contract tests, including the D2d Ed25519 runtime probe.
//
// Everything here runs against the local runtime only. No host is contacted, no key is read from an
// environment variable, and every keypair is generated in-process and discarded.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import { canonicalJson } from './canonicalJson';
import {
  buildCanonicalString,
  CQGW1_CANONICAL_PATH,
  CQGW1_HEADERS,
  CQGW1_MAX_BODY_BYTES,
  CQGW1_MAX_SKEW_SECONDS,
  CQGW1_VERSION,
  cqgw1Operations,
  isCqgw1Operation,
  signCqgw1Request,
  verifyCqgw1Request,
  type Cqgw1Operation,
  type Cqgw1RejectionReason,
} from './cqgw1';
import { base64urlDecode, base64urlEncode, EncodingError, sha256Hex, utf8Bytes } from './encoding';

/* ------------------------------------------------------------- D2d: Ed25519 probe */

describe('D2d — Ed25519 in this runtime', () => {
  it('crypto.subtle generates, signs and verifies with Ed25519', async () => {
    const pair = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, [
      'sign',
      'verify',
    ])) as CryptoKeyPair;

    const message = utf8Bytes('CQGW1 runtime probe');
    const signature = await crypto.subtle.sign({ name: 'Ed25519' }, pair.privateKey, message);

    expect(signature.byteLength).toBe(64);
    expect(await crypto.subtle.verify({ name: 'Ed25519' }, pair.publicKey, signature, message)).toBe(
      true,
    );
  });

  it('exports and re-imports a public key in raw form, which is how the verifier will hold it', async () => {
    const pair = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, [
      'sign',
      'verify',
    ])) as CryptoKeyPair;

    const raw = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
    expect(raw.length).toBe(32);

    const reimported = await crypto.subtle.importKey('raw', raw, { name: 'Ed25519' }, true, [
      'verify',
    ]);
    const message = utf8Bytes('round trip');
    const signature = await crypto.subtle.sign({ name: 'Ed25519' }, pair.privateKey, message);
    expect(await crypto.subtle.verify({ name: 'Ed25519' }, reimported, signature, message)).toBe(true);
  });

  // NOTE: no timing assertion appears anywhere in this file. Whether the platform's implementation
  // is constant-time is a property of the platform, and a wall-clock measurement in a JIT-compiled,
  // garbage-collected runtime cannot establish it.
});

/* ------------------------------------------------------- Canonical string shape */

describe('the canonical string is length-prefixed and unambiguous', () => {
  const base = {
    method: 'POST',
    path: CQGW1_CANONICAL_PATH,
    keyId: 'cq-2026a',
    timestamp: '1786000000',
    requestId: 'b3f1c2d4e5a60718',
    operation: 'listBookings' as Cqgw1Operation,
    bodySha256Hex: 'a'.repeat(64),
  };

  it('measures the canonical path in UTF-8 bytes, computed rather than asserted from memory', () => {
    // The D1 addendum's example said 25. The real length is 34, which is why the prefix is derived
    // from the value at build time instead of being embedded as a literal anywhere.
    const expectedLength = new TextEncoder().encode(CQGW1_CANONICAL_PATH).length;
    expect(expectedLength).toBe(34);
    expect(buildCanonicalString(base)).toContain(`${expectedLength}:${CQGW1_CANONICAL_PATH}`);
  });

  it('starts with the version and joins seven prefixed fields', () => {
    const lines = buildCanonicalString(base).split('\n');
    expect(lines).toHaveLength(8);
    expect(lines[0]).toBe(CQGW1_VERSION);
    expect(lines[1]).toBe('4:POST');
    expect(lines[3]).toBe('8:cq-2026a');
    expect(lines[4]).toBe('10:1786000000');
    expect(lines[6]).toBe('12:listBookings');
    expect(lines[7]).toBe(`64:${'a'.repeat(64)}`);
  });

  it('resists boundary shifting: moving a character between adjacent fields changes the string', () => {
    // Without length prefixes, `keyId='cq-2026'` + `timestamp='a1786000000'` and
    // `keyId='cq-2026a'` + `timestamp='1786000000'` would concatenate identically.
    const shifted = buildCanonicalString({ ...base, keyId: 'cq-2026', timestamp: '1786000000' });
    expect(shifted).not.toBe(buildCanonicalString(base));

    const a = buildCanonicalString({ ...base, keyId: 'ab', requestId: 'cdefghij' });
    const b = buildCanonicalString({ ...base, keyId: 'abc', requestId: 'defghij0' });
    expect(a).not.toBe(b);
  });

  it('a newline inside a field cannot fabricate a new line, because the prefix still counts it', () => {
    const injected = buildCanonicalString({ ...base, requestId: 'aaa\n64:deadbeef' });
    expect(injected).toContain('15:aaa\n64:deadbeef');
    // The prefix says 16 bytes, so a verifier reading by length cannot be fooled by the newline.
  });

  it('counts non-ASCII fields in bytes, not characters', () => {
    const withUmlaut = buildCanonicalString({ ...base, keyId: 'kü' });
    expect(withUmlaut).toContain('3:kü');
  });

  it('changes whenever any single field changes', () => {
    const baseline = buildCanonicalString(base);
    const mutations: Array<Partial<typeof base>> = [
      { method: 'GET' },
      { path: '/functions/v1/other' },
      { keyId: 'cq-2026b' },
      { timestamp: '1786000001' },
      { requestId: 'b3f1c2d4e5a60719' },
      { operation: 'listPayments' },
      { bodySha256Hex: 'b'.repeat(64) },
    ];
    for (const mutation of mutations) {
      expect(buildCanonicalString({ ...base, ...mutation })).not.toBe(baseline);
    }
  });
});

describe('the operation union is closed', () => {
  it('names exactly the twelve read operations', () => {
    expect([...cqgw1Operations].sort()).toEqual(
      [
        'getMonthlyReport',
        'getOverview',
        'getReport',
        'getSettings',
        'listActivity',
        'listAlerts',
        'listBookings',
        'listInvoices',
        'listMembers',
        'listPayments',
        'listReconciliation',
        'listVouchers',
      ].sort(),
    );
    expect(cqgw1Operations).toHaveLength(12);
  });

  it('admits nothing outside the union', () => {
    for (const candidate of [
      'createBooking',
      'deleteMember',
      'listbookings',
      '',
      '__proto__',
      'toString',
      null,
      undefined,
      42,
    ]) {
      expect(isCqgw1Operation(candidate)).toBe(false);
    }
  });

  it('declares no mutating operation', () => {
    for (const operation of cqgw1Operations) {
      expect(operation).not.toMatch(/^(create|update|delete|save|send|void|refund|set|post)/i);
    }
  });
});

/* ----------------------------------------------------------------- base64url */

describe('base64url handling follows the contract exactly', () => {
  it('round-trips arbitrary bytes unpadded', () => {
    for (let length = 0; length < 70; length += 1) {
      const bytes = new Uint8Array(length);
      for (let i = 0; i < length; i += 1) bytes[i] = (i * 37 + length) & 0xff;
      const encoded = base64urlEncode(bytes);
      expect(encoded).not.toContain('=');
      expect([...base64urlDecode(encoded)]).toEqual([...bytes]);
    }
  });

  it('rejects padded input rather than accepting a second spelling of the same bytes', () => {
    expect(() => base64urlDecode('AAAA=')).toThrow(EncodingError);
    expect(() => base64urlDecode('QQ==')).toThrow(EncodingError);
  });

  it('rejects standard-base64 characters and any other stray character', () => {
    for (const bad of ['ab+c', 'ab/c', 'ab c', 'ab\nc', 'ünf']) {
      expect(() => base64urlDecode(bad)).toThrow(EncodingError);
    }
  });

  it('rejects a length that cannot come from any byte sequence', () => {
    expect(() => base64urlDecode('A')).toThrow(EncodingError);
    expect(() => base64urlDecode('AAAAA')).toThrow(EncodingError);
  });
});

/* --------------------------------------------------------- End-to-end verification */

interface Harness {
  keyId: string;
  privateKey: CryptoKey;
  publicKeys: Map<string, CryptoKey>;
  otherPrivateKey: CryptoKey;
}

const harness: Harness = {} as Harness;

beforeAll(async () => {
  const pair = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, [
    'sign',
    'verify',
  ])) as CryptoKeyPair;
  const other = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, [
    'sign',
    'verify',
  ])) as CryptoKeyPair;

  harness.keyId = 'cq-test-2026a';
  harness.privateKey = pair.privateKey;
  harness.otherPrivateKey = other.privateKey;
  harness.publicKeys = new Map([[harness.keyId, pair.publicKey]]);
});

const NOW = 1_786_000_000;

function bodyBytes(value: unknown): Uint8Array {
  return utf8Bytes(canonicalJson(value));
}

async function signed(options: {
  operation?: Cqgw1Operation;
  body?: unknown;
  timestampSeconds?: number;
  keyId?: string;
  privateKey?: CryptoKey;
  requestId?: string;
  path?: string;
  method?: string;
}) {
  const operation = options.operation ?? 'listBookings';
  const rawBody = bodyBytes(options.body ?? { operation, query: { status: 'all' } });
  return signCqgw1Request({
    privateKey: options.privateKey ?? harness.privateKey,
    keyId: options.keyId ?? harness.keyId,
    method: options.method ?? 'POST',
    path: options.path ?? CQGW1_CANONICAL_PATH,
    requestId: options.requestId ?? 'req-0123456789ab',
    timestampSeconds: options.timestampSeconds ?? NOW,
    operation,
    rawBody,
  });
}

function headerReader(headers: Record<string, string>) {
  const lower = new Map(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  return (name: string) => lower.get(name.toLowerCase()) ?? null;
}

async function verify(
  headers: Record<string, string>,
  rawBody: Uint8Array,
  overrides: { nowSeconds?: number; method?: string; path?: string; maxBodyBytes?: number } = {},
) {
  return verifyCqgw1Request({
    method: overrides.method ?? 'POST',
    path: overrides.path ?? CQGW1_CANONICAL_PATH,
    header: headerReader(headers),
    rawBody,
    nowSeconds: overrides.nowSeconds ?? NOW,
    publicKeys: harness.publicKeys,
    maxBodyBytes: overrides.maxBodyBytes,
  });
}

async function expectRejected(
  result: Awaited<ReturnType<typeof verify>>,
  reason: Cqgw1RejectionReason,
) {
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.reason).toBe(reason);
}

describe('a well-formed signed request verifies', () => {
  it('accepts and returns the operation, key id, request id and parsed body', async () => {
    const request = await signed({});
    const result = await verify(request.headers, request.rawBody);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.operation).toBe('listBookings');
      expect(result.keyId).toBe(harness.keyId);
      expect(result.requestId).toBe('req-0123456789ab');
      expect(result.body.operation).toBe('listBookings');
    }
  });

  it('carries all six signed headers', async () => {
    const request = await signed({});
    expect(Object.keys(request.headers).sort()).toEqual(
      [
        CQGW1_HEADERS.version,
        CQGW1_HEADERS.keyId,
        CQGW1_HEADERS.timestamp,
        CQGW1_HEADERS.requestId,
        CQGW1_HEADERS.operation,
        CQGW1_HEADERS.signature,
      ].sort(),
    );
  });

  it('verifies every operation in the union', async () => {
    for (const operation of cqgw1Operations) {
      const request = await signed({ operation, body: { operation } });
      const result = await verify(request.headers, request.rawBody);
      expect(result.ok, operation).toBe(true);
    }
  });

  it('accepts a body that omits the operation entirely', async () => {
    const request = await signed({ body: { query: {} } });
    const result = await verify(request.headers, request.rawBody);
    expect(result.ok).toBe(true);
  });

  it('accepts German text in the body without disturbing the hash', async () => {
    const request = await signed({ body: { operation: 'listBookings', query: { search: 'Grüße Köln ß' } } });
    const result = await verify(request.headers, request.rawBody);
    expect(result.ok).toBe(true);
  });
});

describe('every rejection is fail-closed, in the specified order', () => {
  it('rejects an unknown version before anything else is read', async () => {
    const request = await signed({});
    await expectRejected(
      await verify({ ...request.headers, [CQGW1_HEADERS.version]: 'CQGW2' }, request.rawBody),
      'version_unsupported',
    );
    const stripped = { ...request.headers };
    delete stripped[CQGW1_HEADERS.version];
    await expectRejected(await verify(stripped, request.rawBody), 'version_unsupported');
  });

  it('rejects a missing header, including the operation header', async () => {
    const request = await signed({});
    for (const header of [
      CQGW1_HEADERS.keyId,
      CQGW1_HEADERS.timestamp,
      CQGW1_HEADERS.requestId,
      CQGW1_HEADERS.operation,
      CQGW1_HEADERS.signature,
    ]) {
      const headers = { ...request.headers };
      delete headers[header];
      await expectRejected(await verify(headers, request.rawBody), 'headers_missing');
    }
  });

  it('rejects a malformed header value', async () => {
    const request = await signed({});
    for (const [header, value] of [
      [CQGW1_HEADERS.keyId, 'key with spaces'],
      [CQGW1_HEADERS.timestamp, 'not-a-number'],
      [CQGW1_HEADERS.timestamp, '-1'],
      [CQGW1_HEADERS.requestId, 'short'],
      [CQGW1_HEADERS.requestId, 'has spaces in it'],
    ] as Array<[string, string]>) {
      await expectRejected(
        await verify({ ...request.headers, [header]: value }, request.rawBody),
        'headers_malformed',
      );
    }
  });

  it('rejects an operation outside the closed union', async () => {
    const request = await signed({});
    await expectRejected(
      await verify({ ...request.headers, [CQGW1_HEADERS.operation]: 'dropTable' }, request.rawBody),
      'operation_unknown',
    );
  });

  it('rejects a stale or future timestamp outside ±60 s', async () => {
    const request = await signed({});
    for (const now of [NOW + CQGW1_MAX_SKEW_SECONDS + 1, NOW - CQGW1_MAX_SKEW_SECONDS - 1]) {
      await expectRejected(await verify(request.headers, request.rawBody, { nowSeconds: now }), 'timestamp_out_of_window');
    }
  });

  it('accepts exactly at the ±60 s boundary', async () => {
    const request = await signed({});
    for (const now of [NOW + CQGW1_MAX_SKEW_SECONDS, NOW - CQGW1_MAX_SKEW_SECONDS]) {
      expect((await verify(request.headers, request.rawBody, { nowSeconds: now })).ok).toBe(true);
    }
  });

  it('rejects an oversized body before hashing it', async () => {
    const request = await signed({});
    const oversized = new Uint8Array(CQGW1_MAX_BODY_BYTES + 1);
    await expectRejected(await verify(request.headers, oversized), 'body_too_large');
    expect(CQGW1_MAX_BODY_BYTES).toBe(65536);
  });

  it('rejects an unknown key id', async () => {
    const request = await signed({ keyId: 'cq-not-trusted' });
    await expectRejected(await verify(request.headers, request.rawBody), 'key_unknown');
  });

  it('rejects a signature made with the wrong key', async () => {
    const request = await signed({ privateKey: harness.otherPrivateKey });
    await expectRejected(await verify(request.headers, request.rawBody), 'signature_invalid');
  });

  it('rejects a tampered body — the hash, and therefore the canonical string, changes', async () => {
    const request = await signed({ body: { operation: 'listBookings', query: { limit: 10 } } });
    const tampered = bodyBytes({ operation: 'listBookings', query: { limit: 200 } });
    expect(await sha256Hex(tampered)).not.toBe(await sha256Hex(request.rawBody));
    await expectRejected(await verify(request.headers, tampered), 'signature_invalid');
  });

  it('rejects a single flipped byte in the body', async () => {
    const request = await signed({});
    const tampered = Uint8Array.from(request.rawBody);
    tampered[tampered.length - 2] ^= 0x01;
    await expectRejected(await verify(request.headers, tampered), 'signature_invalid');
  });

  it('rejects a header-operation swap, because the operation is signed', async () => {
    const request = await signed({ operation: 'getSettings', body: { operation: 'getSettings' } });
    await expectRejected(
      await verify({ ...request.headers, [CQGW1_HEADERS.operation]: 'listMembers' }, request.rawBody),
      'signature_invalid',
    );
  });

  it('rejects a body-operation that disagrees with the signed header operation', async () => {
    // Signed as listBookings, but the body claims listMembers. The signature is valid — the body
    // bytes are exactly what was signed — so this must be caught by the explicit agreement check
    // after parsing, which is why that step exists at all.
    const request = await signed({
      operation: 'listBookings',
      body: { operation: 'listMembers', query: {} },
    });
    await expectRejected(await verify(request.headers, request.rawBody), 'operation_mismatch');
  });

  it('rejects a method or path the signature did not cover', async () => {
    const request = await signed({});
    await expectRejected(await verify(request.headers, request.rawBody, { method: 'GET' }), 'signature_invalid');
    await expectRejected(
      await verify(request.headers, request.rawBody, { path: '/functions/v1/something-else' }),
      'signature_invalid',
    );
  });

  it('rejects an unparsable or non-object body only after the signature verified', async () => {
    for (const [text, reason] of [
      ['{ not json', 'body_unparsable'],
      ['[1,2,3]', 'body_unparsable'],
      ['"a string"', 'body_unparsable'],
      ['null', 'body_unparsable'],
    ] as Array<[string, Cqgw1RejectionReason]>) {
      const rawBody = utf8Bytes(text);
      const request = await signCqgw1Request({
        privateKey: harness.privateKey,
        keyId: harness.keyId,
        method: 'POST',
        path: CQGW1_CANONICAL_PATH,
        requestId: 'req-0123456789ab',
        timestampSeconds: NOW,
        operation: 'listBookings',
        rawBody,
      });
      await expectRejected(await verify(request.headers, rawBody), reason);
    }
  });

  it('rejects a payload the operation validator refuses', async () => {
    const request = await signed({ operation: 'listBookings', body: { operation: 'listBookings' } });
    const result = await verifyCqgw1Request({
      method: 'POST',
      path: CQGW1_CANONICAL_PATH,
      header: headerReader(request.headers),
      rawBody: request.rawBody,
      nowSeconds: NOW,
      publicKeys: harness.publicKeys,
      validatePayload: (_operation, body) => 'query' in body,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('payload_invalid');
  });

  it('rejects a padded signature, because the contract fixes unpadded base64url', async () => {
    const request = await signed({});
    await expectRejected(
      await verify(
        { ...request.headers, [CQGW1_HEADERS.signature]: `${request.headers[CQGW1_HEADERS.signature]}=` },
        request.rawBody,
      ),
      'signature_invalid',
    );
  });

  it('rejects a signature of the wrong length', async () => {
    const request = await signed({});
    await expectRejected(
      await verify({ ...request.headers, [CQGW1_HEADERS.signature]: base64urlEncode(new Uint8Array(63)) }, request.rawBody),
      'signature_invalid',
    );
  });
});

describe('nothing sensitive is emitted', () => {
  it('a rejection carries a reason code and a status, and no request material', async () => {
    const request = await signed({ privateKey: harness.otherPrivateKey });
    const result = await verify(request.headers, request.rawBody);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result).sort()).toEqual(['ok', 'reason', 'status']);
      expect(JSON.stringify(result)).not.toContain(request.headers[CQGW1_HEADERS.signature]);
    }
  });

  it('the module source contains no key, host or token literal', async () => {
    const source = readFileSync(resolve(__dirname, 'cqgw1.ts'), 'utf8');
    expect(source).not.toMatch(/https?:\/\//);
    expect(source).not.toMatch(/eyJ[A-Za-z0-9_-]{10,}/);
    expect(source).not.toMatch(/-----BEGIN/);
    expect(source).not.toMatch(/\bsupabase\.(co|in)\b/);
  });
});
