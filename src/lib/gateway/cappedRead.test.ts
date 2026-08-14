// The shared capped stream reader — the single implementation both boundaries rely on.
//
// The property under test is not "an oversized body is rejected". It is "an oversized body is
// rejected *without being buffered*", which is a different claim and needs streams that would hang
// or exhaust memory if the claim were false.

import { describe, expect, it } from 'vitest';

import {
  CappedReadError,
  decodeUtf8Strict,
  parseDeclaredLength,
  readCappedStream,
} from './cappedRead';

function streamOf(...chunks: Uint8Array[]): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });
}

/** A stream that never ends. Reading it without a cap does not terminate. */
function endlessStream(chunkBytes: number): {
  stream: ReadableStream<Uint8Array>;
  produced: () => number;
  cancelled: () => boolean;
} {
  let produced = 0;
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      produced += 1;
      controller.enqueue(new Uint8Array(chunkBytes));
    },
    cancel() {
      cancelled = true;
    },
  });
  return { stream, produced: () => produced, cancelled: () => cancelled };
}

async function reasonOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (cause) {
    expect(cause).toBeInstanceOf(CappedReadError);
    return (cause as CappedReadError).reason;
  }
  throw new Error('expected a rejection');
}

const bytes = (text: string) => new TextEncoder().encode(text);

/**
 * Compare byte content, not byte-array identity.
 *
 * `toEqual` on two `Uint8Array`s also compares their constructors, and in the jsdom test environment
 * `TextEncoder` and the global `Uint8Array` do not always come from the same realm — which makes
 * identical bytes compare unequal for a reason that has nothing to do with this module.
 */
const sameBytes = (actual: Uint8Array, expected: Uint8Array) =>
  expect(Array.from(actual)).toEqual(Array.from(expected));

/* ------------------------------------------------------------- Declared length */

describe('Content-Length parsing is strict', () => {
  it('treats an absent header as absent, not as zero', () => {
    expect(parseDeclaredLength(null)).toBeNull();
    expect(parseDeclaredLength(undefined)).toBeNull();
  });

  it('accepts plain decimal digits', () => {
    expect(parseDeclaredLength('0')).toBe(0);
    expect(parseDeclaredLength('12')).toBe(12);
    expect(parseDeclaredLength('65536')).toBe(65536);
  });

  const malformed = [
    '',
    ' ',
    '12 ',
    ' 12',
    '-1',
    '-0',
    '+12',
    '1.5',
    '1e3',
    '0x10',
    'twelve',
    'NaN',
    'Infinity',
    // What `Headers.get` produces when the header arrives twice — a smuggling shape, never resolved
    // by picking a winner.
    '12, 12',
    '12,13',
    '9007199254740993',
  ];

  for (const value of malformed) {
    it(`refuses ${JSON.stringify(value)}`, () => {
      expect(() => parseDeclaredLength(value)).toThrow(CappedReadError);
      try {
        parseDeclaredLength(value);
      } catch (cause) {
        expect((cause as CappedReadError).reason).toBe('declared_length_invalid');
      }
    });
  }

  it('refuses a declared length above the cap without consuming the stream', async () => {
    const stream = streamOf(bytes('first'), bytes('second'));
    expect(await reasonOf(readCappedStream(stream, '999999', 1024))).toBe('declared_length_over_cap');

    // Never locked means `getReader()` was never called, and the stream is still whole: its first
    // chunk is right where it was. Nothing was read, so nothing was buffered.
    expect(stream.locked).toBe(false);
    const { value } = await stream.getReader().read();
    sameBytes(value!, bytes('first'));
  });
});

/* -------------------------------------------------------------------- The cap */

describe('the cap is enforced by the reader, not by the header', () => {
  it('accepts a body exactly at the cap', async () => {
    const payload = bytes('0123456789');
    sameBytes(await readCappedStream(streamOf(payload), null, 10), payload);
  });

  it('refuses a body one byte over the cap', async () => {
    expect(await reasonOf(readCappedStream(streamOf(bytes('01234567890')), null, 10))).toBe(
      'body_too_large',
    );
  });

  it('caps a chunked body that declares no length at all', async () => {
    // No Content-Length, four 4-byte chunks, a 10-byte cap: the reader is the only thing that can
    // stop this, and it must.
    const stream = streamOf(bytes('aaaa'), bytes('bbbb'), bytes('cccc'), bytes('dddd'));
    expect(await reasonOf(readCappedStream(stream, null, 10))).toBe('body_too_large');
  });

  it('cancels an endless stream at the chunk that crosses the cap', async () => {
    const { stream, produced, cancelled } = endlessStream(1024);
    expect(await reasonOf(readCappedStream(stream, null, 4096))).toBe('body_too_large');
    // Five 1 KiB chunks is what it takes to exceed 4 KiB. An unrestricted reader would still be
    // pulling: this stream has no end.
    expect(produced()).toBeLessThanOrEqual(6);
    expect(cancelled()).toBe(true);
  });

  it('catches a body whose declared length understates its true size', async () => {
    // The sender claims 4 bytes and sends 40. The declared length passes the pre-check; the reader
    // is what refuses.
    const stream = streamOf(bytes('x'.repeat(40)));
    expect(await reasonOf(readCappedStream(stream, '4', 10))).toBe('body_too_large');
  });

  it('measures UTF-8 bytes, not JavaScript characters', async () => {
    // Ten characters, thirty bytes. A `String.length` check would have let this through a 10-byte
    // cap; a byte cap must not.
    const multibyte = 'äöü€€€€€€€';
    expect(multibyte.length).toBe(10);
    const encoded = bytes(multibyte);
    expect(encoded.byteLength).toBeGreaterThan(10);
    expect(await reasonOf(readCappedStream(streamOf(encoded), null, 10))).toBe('body_too_large');
    sameBytes(await readCappedStream(streamOf(encoded), null, encoded.byteLength), encoded);
  });

  it('reassembles multi-chunk bodies in order', async () => {
    const stream = streamOf(bytes('{"a"'), bytes(':1,'), bytes('"b":2}'));
    const read = await readCappedStream(stream, null, 1024);
    expect(decodeUtf8Strict(read)).toBe('{"a":1,"b":2}');
  });
});

/* ------------------------------------------------------------------ Failures */

describe('abnormal streams fail closed', () => {
  it('refuses a missing body', async () => {
    expect(await reasonOf(readCappedStream(null, null, 1024))).toBe('body_missing');
    expect(await reasonOf(readCappedStream(undefined, null, 1024))).toBe('body_missing');
  });

  it('reports a reader failure without surfacing its cause', async () => {
    const stream = new ReadableStream<Uint8Array>({
      pull() {
        throw new Error('socket reset by peer at 10.0.0.7');
      },
    });
    const reason = await reasonOf(readCappedStream(stream, null, 1024));
    expect(reason).toBe('read_failed');

    try {
      await readCappedStream(
        new ReadableStream<Uint8Array>({
          pull() {
            throw new Error('socket reset by peer at 10.0.0.7');
          },
        }),
        null,
        1024,
      );
    } catch (cause) {
      const text = `${(cause as Error).message} ${JSON.stringify(cause)}`;
      expect(text).not.toContain('10.0.0.7');
      expect(text).not.toContain('socket reset');
    }
  });

  it('survives a cancel that itself fails, and still reports the size refusal', async () => {
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(new Uint8Array(64));
      },
      cancel() {
        throw new Error('cancel failed');
      },
    });
    expect(await reasonOf(readCappedStream(stream, null, 16))).toBe('body_too_large');
  });

  it('releases the reader lock on success and on failure', async () => {
    const ok = streamOf(bytes('{}'));
    await readCappedStream(ok, null, 1024);
    expect(ok.locked).toBe(false);

    const oversized = streamOf(bytes('x'.repeat(64)));
    await reasonOf(readCappedStream(oversized, null, 8));
    expect(oversized.locked).toBe(false);
  });
});

describe('decoding is strict', () => {
  it('refuses invalid UTF-8 rather than substituting replacement characters', () => {
    expect(() => decodeUtf8Strict(new Uint8Array([0xff, 0xfe, 0xfd]))).toThrow();
    expect(() => decodeUtf8Strict(new Uint8Array([0xe2, 0x82]))).toThrow(); // truncated sequence
  });

  it('decodes valid multibyte UTF-8', () => {
    expect(decodeUtf8Strict(bytes('grüß Gott €'))).toBe('grüß Gott €');
  });
});
