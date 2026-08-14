// One capped stream reader, used on both sides of the boundary.
//
// The gateway reads two attacker-influenced byte streams: the inbound request from the browser and
// the outbound gateway's response. Both need the same guarantee — **never buffer an unbounded body**
// — and having two implementations of that guarantee is how one of them ends up weaker. So there is
// one reader here, and both callers map its reasons onto their own vocabularies.
//
// The property that matters: a body over the cap is abandoned *at the chunk that crosses the line*.
// The reader is cancelled, the remainder is never pulled, and at no point is more than the cap plus
// one bounded chunk held in memory. A body with no declared length is not exempt — the cap is
// enforced by the reader, not by a header, because a header is something the sender chose.
//
// Nothing here decodes, parses or interprets. It returns bytes or it throws a reason code.

export const cappedReadFailureReasons = [
  'declared_length_invalid',
  'declared_length_over_cap',
  'body_missing',
  'body_too_large',
  'read_failed',
] as const;
export type CappedReadFailureReason = (typeof cappedReadFailureReasons)[number];

/** Carries a reason code. Never a byte, a length, a header value or an upstream error. */
export class CappedReadError extends Error {
  readonly reason: CappedReadFailureReason;

  constructor(reason: CappedReadFailureReason) {
    super(`capped read rejected: ${reason}`);
    this.name = 'CappedReadError';
    this.reason = reason;
  }
}

/** A declared length must be exactly this: decimal digits, nothing else. */
const DECLARED_LENGTH_PATTERN = /^\d+$/;

/**
 * Parse a `Content-Length` value strictly.
 *
 * Returns `null` when the header is absent, which is permitted — the stream cap still applies.
 * Everything else must be plain decimal digits within the safe integer range. This rejects, without
 * a special case for each: a negative value (`-5` has no digit-only spelling), a decimal (`1.5`), a
 * signed value (`+5`), whitespace padding, hex, and — importantly — the `"12, 12"` that `Headers.get`
 * produces when a request arrives with the header duplicated, which is a request-smuggling shape and
 * not something to pick a winner from.
 */
export function parseDeclaredLength(raw: string | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  if (!DECLARED_LENGTH_PATTERN.test(raw)) throw new CappedReadError('declared_length_invalid');
  const length = Number(raw);
  if (!Number.isSafeInteger(length)) throw new CappedReadError('declared_length_invalid');
  return length;
}

/**
 * Read a stream through a hard byte cap.
 *
 * @param body           the stream, or `null` when there is none
 * @param declaredLength the raw `Content-Length` header value, if any
 * @param maxBytes       the cap, in bytes
 *
 * A declared length above the cap short-circuits before a single byte is pulled. A declared length
 * *below* the cap grants nothing: a sender that understates its length is caught by the reader like
 * any other oversized body.
 */
export async function readCappedStream(
  body: ReadableStream<Uint8Array> | null | undefined,
  declaredLength: string | null | undefined,
  maxBytes: number,
): Promise<Uint8Array> {
  const declared = parseDeclaredLength(declaredLength);
  if (declared !== null && declared > maxBytes) {
    throw new CappedReadError('declared_length_over_cap');
  }

  if (!body) throw new CappedReadError('body_missing');

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        // Abandon the rest of the stream rather than draining it. A cancel that itself fails must
        // not mask the reason we are here.
        await reader.cancel().catch(() => undefined);
        throw new CappedReadError('body_too_large');
      }
      chunks.push(value);
    }
  } catch (cause) {
    if (cause instanceof CappedReadError) throw cause;
    throw new CappedReadError('read_failed');
  } finally {
    // Releasing a cancelled or errored reader is a no-op; releasing a completed one lets the stream
    // be collected. Either way the caller is not left holding a lock.
    try {
      reader.releaseLock();
    } catch {
      // The lock is already gone, which is the outcome we wanted.
    }
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

/** UTF-8 decode that refuses invalid sequences rather than substituting replacement characters. */
export function decodeUtf8Strict(bytes: Uint8Array): string {
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}
