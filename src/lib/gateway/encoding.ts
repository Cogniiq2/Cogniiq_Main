// Byte-level helpers shared by the canonical-JSON and CQGW1 modules.
//
// These live outside the browser solution module on purpose: they are server-side gateway concerns.
// No browser component imports them, and none may — the module boundary tests in
// `clubOperations.boundaries.test.ts` enforce that the UI stays ignorant of the transport, and one
// of those tests fails if any file outside the module so much as names its path.
//
// Nothing here logs, and nothing here accepts a key: these are pure byte transformations.

/** UTF-8 bytes of a string. The single place the encoder is constructed. */
const utf8Encoder = new TextEncoder();

// The `Uint8Array<ArrayBuffer>` annotation is deliberate: the default `Uint8Array` widens its buffer
// to `ArrayBufferLike`, which includes `SharedArrayBuffer` and therefore does not satisfy
// `BufferSource`. Pinning it here means callers can pass these bytes straight to `crypto.subtle`
// without a cast at every call site.
export function utf8Bytes(value: string): Uint8Array<ArrayBuffer> {
  return utf8Encoder.encode(value) as Uint8Array<ArrayBuffer>;
}

/**
 * UTF-8 byte length — never the UTF-16 code-unit length.
 *
 * This distinction is the whole point of the CQGW1 length prefix: `'/functions/v1/…'.length` and its
 * byte length agree only for ASCII, and a signing contract that silently used the wrong one would
 * verify locally and fail against any non-ASCII value.
 */
export function utf8ByteLength(value: string): number {
  return utf8Bytes(value).length;
}

/** Lowercase hex of a byte sequence. */
export function toHex(bytes: Uint8Array): string {
  let out = '';
  for (const byte of bytes) out += byte.toString(16).padStart(2, '0');
  return out;
}

/** SHA-256 over exact bytes, lowercase hex. Never re-serialises its input. */
export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
  );
  return toHex(new Uint8Array(digest));
}

const BASE64URL_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/** base64url, **unpadded** — the encoding the CQGW1 contract fixes for signatures. */
export function base64urlEncode(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    out += BASE64URL_ALPHABET[b0 >> 2];
    out += BASE64URL_ALPHABET[((b0 & 0b11) << 4) | ((b1 ?? 0) >> 4)];
    if (b1 === undefined) break;
    out += BASE64URL_ALPHABET[((b1 & 0b1111) << 2) | ((b2 ?? 0) >> 6)];
    if (b2 === undefined) break;
    out += BASE64URL_ALPHABET[b2 & 0b111111];
  }
  return out;
}

/** Raised when a value does not match the encoding the contract fixes. Carries no value. */
export class EncodingError extends Error {
  readonly reason: string;

  constructor(reason: string) {
    super(`encoding rejected: ${reason}`);
    this.name = 'EncodingError';
    this.reason = reason;
  }
}

/**
 * Strict, unpadded base64url decode.
 *
 * Padding is rejected rather than tolerated. The contract fixes one encoding, and accepting a second
 * spelling of the same bytes would mean two distinct header values verify identically — exactly the
 * kind of ambiguity a signing contract exists to remove.
 */
export function base64urlDecode(value: string): Uint8Array<ArrayBuffer> {
  if (value.includes('=')) throw new EncodingError('padded base64url');
  if (!/^[A-Za-z0-9_-]*$/.test(value)) throw new EncodingError('non-base64url character');
  if (value.length % 4 === 1) throw new EncodingError('impossible base64url length');

  const bytes = new Uint8Array(Math.floor((value.length * 3) / 4));
  let bits = 0;
  let accumulator = 0;
  let out = 0;
  for (const character of value) {
    const index = BASE64URL_ALPHABET.indexOf(character);
    accumulator = (accumulator << 6) | index;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes[out++] = (accumulator >> bits) & 0xff;
    }
  }
  return bytes.subarray(0, out);
}
