// D2d — Ed25519 and CQGW1 proof under the installed Deno runtime.
//
// This imports the REPOSITORY'S OWN modules rather than a copy, so what is proved here is the
// behaviour of the code that would ship, not of a re-implementation written for the test.
//
// Run:
//   deno run --unstable-sloppy-imports --allow-read docs/club-operations/d2-spike/scripts/d2d_deno.ts
//
// No network access is requested and none is granted: there is no --allow-net flag.

import {
  buildCanonicalString,
  CQGW1_CANONICAL_PATH,
  CQGW1_HEADERS,
  CQGW1_VERSION,
  cqgw1Operations,
  signCqgw1Request,
  verifyCqgw1Request,
} from '../../../../src/lib/gateway/cqgw1.ts';
import {
  base64urlDecode,
  sha256Hex,
  utf8ByteLength,
  utf8Bytes,
} from '../../../../src/lib/gateway/encoding.ts';

const results: Array<{ check: string; pass: boolean; detail: string }> = [];

function record(check: string, pass: boolean, detail: string) {
  results.push({ check, pass, detail });
}

async function main() {
  record('runtime', true, `Deno ${Deno.version.deno}, V8 ${Deno.version.v8}, TS ${Deno.version.typescript}`);

  // 1 — key generation
  let pair: CryptoKeyPair;
  try {
    pair = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, [
      'sign',
      'verify',
    ])) as CryptoKeyPair;
    record('ed25519.generateKey', true, `algorithm=${(pair.privateKey.algorithm as { name: string }).name}`);
  } catch (error) {
    record('ed25519.generateKey', false, String(error));
    return;
  }

  // 2 — signing, 3 — verification, 4 — 64-byte signature
  const message = utf8Bytes('CQGW1 Deno runtime probe');
  const signature = new Uint8Array(
    await crypto.subtle.sign({ name: 'Ed25519' }, pair.privateKey, message),
  );
  record('ed25519.sign', signature.length > 0, `signature produced`);
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
  const verifiedTampered = await crypto.subtle.verify(
    { name: 'Ed25519' },
    pair.publicKey,
    signature,
    tampered,
  );
  record('ed25519.rejectsTamperedMessage', verifiedTampered === false, `verify=${verifiedTampered}`);

  // 5 — 32-byte raw public key export and re-import
  const raw = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
  record('ed25519.rawPublicKeyExport=32', raw.length === 32, `${raw.length} bytes`);
  const reimported = await crypto.subtle.importKey('raw', raw, { name: 'Ed25519' }, true, [
    'verify',
  ]);
  const verifiedReimported = await crypto.subtle.verify(
    { name: 'Ed25519' },
    reimported,
    signature,
    message,
  );
  record('ed25519.rawPublicKeyReimport', verifiedReimported === true, `verify=${verifiedReimported}`);

  // 6 — the canonical string, byte lengths computed rather than assumed
  const pathBytes = utf8ByteLength(CQGW1_CANONICAL_PATH);
  record('cqgw1.canonicalPathByteLength=34', pathBytes === 34, `${pathBytes} bytes`);
  const canonical = buildCanonicalString({
    method: 'POST',
    path: CQGW1_CANONICAL_PATH,
    keyId: 'cq-spike',
    timestamp: '1786000000',
    requestId: 'req-0123456789ab',
    operation: 'listBookings',
    bodySha256Hex: 'a'.repeat(64),
  });
  const lines = canonical.split('\n');
  record(
    'cqgw1.canonicalShape',
    lines.length === 8 && lines[0] === CQGW1_VERSION && lines[2] === `${pathBytes}:${CQGW1_CANONICAL_PATH}`,
    `${lines.length} lines, header=${lines[0]}`,
  );
  record('cqgw1.operationUnion=12', cqgw1Operations.length === 12, cqgw1Operations.join(','));

  // 7 — end-to-end sign + verify through the shipped verification pipeline
  const now = Math.floor(Date.now() / 1000);
  const bodyText = JSON.stringify({ operation: 'listBookings', query: { search: 'Grüße Köln ß' } });
  const rawBody = utf8Bytes(bodyText);
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

  const accepted = await verifyCqgw1Request({
    method: 'POST',
    path: CQGW1_CANONICAL_PATH,
    header: headerReader(signed.headers),
    rawBody: signed.rawBody,
    nowSeconds: now,
    publicKeys,
  });
  record('cqgw1.verifyAccepts', accepted.ok === true, JSON.stringify(accepted.ok ? accepted.operation : accepted));

  record(
    'cqgw1.signatureIsUnpaddedBase64url',
    !signed.headers[CQGW1_HEADERS.signature].includes('=') &&
      base64urlDecode(signed.headers[CQGW1_HEADERS.signature]).length === 64,
    `${signed.headers[CQGW1_HEADERS.signature].length} chars`,
  );

  // 8 — exact-body verification: a single flipped byte must fail
  const flipped = Uint8Array.from(signed.rawBody);
  flipped[flipped.length - 2] ^= 0x01;
  const flippedResult = await verifyCqgw1Request({
    method: 'POST',
    path: CQGW1_CANONICAL_PATH,
    header: headerReader(signed.headers),
    rawBody: flipped,
    nowSeconds: now,
    publicKeys,
  });
  record(
    'cqgw1.rejectsFlippedBodyByte',
    !flippedResult.ok && flippedResult.reason === 'signature_invalid',
    flippedResult.ok ? 'ACCEPTED (bad)' : flippedResult.reason,
  );

  // 9 — a whole-body swap changes the hash and therefore the canonical string
  const otherBody = utf8Bytes(JSON.stringify({ operation: 'listBookings', query: { limit: 200 } }));
  record(
    'cqgw1.bodyHashDiffers',
    (await sha256Hex(otherBody)) !== (await sha256Hex(signed.rawBody)),
    'sha256 differs',
  );
  const swapped = await verifyCqgw1Request({
    method: 'POST',
    path: CQGW1_CANONICAL_PATH,
    header: headerReader(signed.headers),
    rawBody: otherBody,
    nowSeconds: now,
    publicKeys,
  });
  record(
    'cqgw1.rejectsSwappedBody',
    !swapped.ok && swapped.reason === 'signature_invalid',
    swapped.ok ? 'ACCEPTED (bad)' : swapped.reason,
  );

  // 10 — header-operation tampering and staleness
  const opSwap = await verifyCqgw1Request({
    method: 'POST',
    path: CQGW1_CANONICAL_PATH,
    header: headerReader({ ...signed.headers, [CQGW1_HEADERS.operation]: 'listMembers' }),
    rawBody: signed.rawBody,
    nowSeconds: now,
    publicKeys,
  });
  record(
    'cqgw1.rejectsOperationHeaderSwap',
    !opSwap.ok && opSwap.reason === 'signature_invalid',
    opSwap.ok ? 'ACCEPTED (bad)' : opSwap.reason,
  );

  const stale = await verifyCqgw1Request({
    method: 'POST',
    path: CQGW1_CANONICAL_PATH,
    header: headerReader(signed.headers),
    rawBody: signed.rawBody,
    nowSeconds: now + 61,
    publicKeys,
  });
  record(
    'cqgw1.rejectsStaleTimestamp',
    !stale.ok && stale.reason === 'timestamp_out_of_window',
    stale.ok ? 'ACCEPTED (bad)' : stale.reason,
  );

  const wrongKey = await verifyCqgw1Request({
    method: 'POST',
    path: CQGW1_CANONICAL_PATH,
    header: headerReader(signed.headers),
    rawBody: signed.rawBody,
    nowSeconds: now,
    publicKeys: new Map(),
  });
  record(
    'cqgw1.rejectsUnknownKeyId',
    !wrongKey.ok && wrongKey.reason === 'key_unknown',
    wrongKey.ok ? 'ACCEPTED (bad)' : wrongKey.reason,
  );

  // NOTE: no timing measurement appears anywhere in this file. Constant-time execution is a property
  // of the platform's Ed25519 implementation and cannot be established by wall-clock observation.
}

await main();

const failed = results.filter((entry) => !entry.pass);
console.log(JSON.stringify({ runtime: 'deno', results, failed: failed.length }, null, 2));
Deno.exit(failed.length === 0 ? 0 : 1);
