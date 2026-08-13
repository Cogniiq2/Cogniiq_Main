// D2d — Ed25519 and CQGW1 inside the ACTUAL locally served Supabase Edge runtime.
//
// `vendor/cqgw1.ts` and `vendor/encoding.ts` are byte-identical copies of the repository modules
// (SHA-256 recorded in the spike report). The edge runtime cannot import from outside the functions
// directory, so the files are copied rather than referenced — and the digests are what make the copy
// trustworthy as evidence about the shipping code.

import {
  buildCanonicalString,
  CQGW1_CANONICAL_PATH,
  CQGW1_HEADERS,
  CQGW1_VERSION,
  cqgw1Operations,
  signCqgw1Request,
  verifyCqgw1Request,
} from './vendor/cqgw1.ts';
import { base64urlDecode, sha256Hex, utf8ByteLength, utf8Bytes } from './vendor/encoding.ts';

interface Check {
  check: string;
  pass: boolean;
  detail: string;
}

Deno.serve(async () => {
  const results: Check[] = [];
  const record = (check: string, pass: boolean, detail: string) =>
    results.push({ check, pass, detail });

  record(
    'runtime',
    true,
    `${Deno.version.deno} | V8 ${Deno.version.v8} | TS ${Deno.version.typescript}`,
  );

  try {
    // ── key generation ────────────────────────────────────────────────────────
    const pair = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, [
      'sign',
      'verify',
    ])) as CryptoKeyPair;
    record('ed25519.generateKey', true, 'Ed25519 keypair generated');

    // ── sign / verify / 64-byte signature ─────────────────────────────────────
    const message = utf8Bytes('CQGW1 edge runtime probe');
    const signature = new Uint8Array(
      await crypto.subtle.sign({ name: 'Ed25519' }, pair.privateKey, message),
    );
    record('ed25519.signatureLength=64', signature.length === 64, `${signature.length} bytes`);
    const verified = await crypto.subtle.verify(
      { name: 'Ed25519' },
      pair.publicKey,
      signature,
      message,
    );
    record('ed25519.verify', verified === true, `verify=${verified}`);

    const tampered = Uint8Array.from(message);
    tampered[0] ^= 0x01;
    record(
      'ed25519.rejectsTamperedMessage',
      (await crypto.subtle.verify({ name: 'Ed25519' }, pair.publicKey, signature, tampered)) === false,
      'tampered message rejected',
    );

    // ── 32-byte raw public key export / re-import ─────────────────────────────
    const raw = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
    record('ed25519.rawPublicKeyExport=32', raw.length === 32, `${raw.length} bytes`);
    const reimported = await crypto.subtle.importKey('raw', raw, { name: 'Ed25519' }, true, [
      'verify',
    ]);
    record(
      'ed25519.rawPublicKeyReimport',
      (await crypto.subtle.verify({ name: 'Ed25519' }, reimported, signature, message)) === true,
      're-imported key verifies the same signature',
    );

    // ── canonical string ──────────────────────────────────────────────────────
    const pathBytes = utf8ByteLength(CQGW1_CANONICAL_PATH);
    record('cqgw1.canonicalPathByteLength=34', pathBytes === 34, `${pathBytes} bytes`);
    const lines = buildCanonicalString({
      method: 'POST',
      path: CQGW1_CANONICAL_PATH,
      keyId: 'cq-spike',
      timestamp: '1786000000',
      requestId: 'req-0123456789ab',
      operation: 'listBookings',
      bodySha256Hex: 'a'.repeat(64),
    }).split('\n');
    record(
      'cqgw1.canonicalShape',
      lines.length === 8 && lines[0] === CQGW1_VERSION,
      `${lines.length} lines, version=${lines[0]}`,
    );
    record('cqgw1.operationUnion=12', cqgw1Operations.length === 12, `${cqgw1Operations.length}`);

    // ── end-to-end sign + verify through the shipped pipeline ─────────────────
    const now = Math.floor(Date.now() / 1000);
    const rawBody = utf8Bytes(
      JSON.stringify({ operation: 'listBookings', query: { search: 'Grüße Köln ß' } }),
    );
    const signed = await signCqgw1Request({
      privateKey: pair.privateKey,
      keyId: 'cq-spike',
      method: 'POST',
      path: CQGW1_CANONICAL_PATH,
      requestId: 'req-0123456789ab',
      timestampSeconds: now,
      operation: 'listBookings',
      rawBody,
    });
    const headerReader = (headers: Record<string, string>) => {
      const lower = new Map(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
      return (name: string) => lower.get(name.toLowerCase()) ?? null;
    };
    const publicKeys = new Map([['cq-spike', pair.publicKey]]);
    const base = {
      method: 'POST',
      path: CQGW1_CANONICAL_PATH,
      nowSeconds: now,
      publicKeys,
    };

    const accepted = await verifyCqgw1Request({
      ...base,
      header: headerReader(signed.headers),
      rawBody: signed.rawBody,
    });
    record('cqgw1.verifyAccepts', accepted.ok === true, accepted.ok ? accepted.operation : 'rejected');

    record(
      'cqgw1.signatureUnpaddedBase64url',
      !signed.headers[CQGW1_HEADERS.signature].includes('=') &&
        base64urlDecode(signed.headers[CQGW1_HEADERS.signature]).length === 64,
      `${signed.headers[CQGW1_HEADERS.signature].length} chars`,
    );

    // ── exact-body verification ───────────────────────────────────────────────
    const flipped = Uint8Array.from(signed.rawBody);
    flipped[flipped.length - 2] ^= 0x01;
    const flippedResult = await verifyCqgw1Request({
      ...base,
      header: headerReader(signed.headers),
      rawBody: flipped,
    });
    record(
      'cqgw1.rejectsFlippedBodyByte',
      !flippedResult.ok && flippedResult.reason === 'signature_invalid',
      flippedResult.ok ? 'ACCEPTED (bad)' : flippedResult.reason,
    );

    const otherBody = utf8Bytes(JSON.stringify({ operation: 'listBookings', query: { limit: 200 } }));
    record(
      'cqgw1.bodyHashDiffers',
      (await sha256Hex(otherBody)) !== (await sha256Hex(signed.rawBody)),
      'sha256 differs',
    );
    const swapped = await verifyCqgw1Request({
      ...base,
      header: headerReader(signed.headers),
      rawBody: otherBody,
    });
    record(
      'cqgw1.rejectsSwappedBody',
      !swapped.ok && swapped.reason === 'signature_invalid',
      swapped.ok ? 'ACCEPTED (bad)' : swapped.reason,
    );

    const opSwap = await verifyCqgw1Request({
      ...base,
      header: headerReader({ ...signed.headers, [CQGW1_HEADERS.operation]: 'listMembers' }),
      rawBody: signed.rawBody,
    });
    record(
      'cqgw1.rejectsOperationHeaderSwap',
      !opSwap.ok && opSwap.reason === 'signature_invalid',
      opSwap.ok ? 'ACCEPTED (bad)' : opSwap.reason,
    );

    const stale = await verifyCqgw1Request({
      ...base,
      nowSeconds: now + 61,
      header: headerReader(signed.headers),
      rawBody: signed.rawBody,
    });
    record(
      'cqgw1.rejectsStaleTimestamp',
      !stale.ok && stale.reason === 'timestamp_out_of_window',
      stale.ok ? 'ACCEPTED (bad)' : stale.reason,
    );

    const unknownKey = await verifyCqgw1Request({
      ...base,
      publicKeys: new Map(),
      header: headerReader(signed.headers),
      rawBody: signed.rawBody,
    });
    record(
      'cqgw1.rejectsUnknownKeyId',
      !unknownKey.ok && unknownKey.reason === 'key_unknown',
      unknownKey.ok ? 'ACCEPTED (bad)' : unknownKey.reason,
    );
  } catch (error) {
    record('fatal', false, String(error));
  }

  const failed = results.filter((entry) => !entry.pass);
  return new Response(JSON.stringify({ runtime: 'supabase-edge', results, failed: failed.length }, null, 2), {
    status: failed.length === 0 ? 200 : 500,
    headers: { 'content-type': 'application/json' },
  });
});
