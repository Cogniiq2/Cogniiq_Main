// The ten-step upstream response pipeline (plan §5.2, §14.1.4).
//
// Every fixture here is local. Nothing in this file opens a socket, names a host or reaches a
// service: a `Response` is constructed in memory and handed to the pipeline.

import { describe, expect, it } from 'vitest';

import {
  CLUB_GATEWAY_MAX_RESPONSE_BYTES,
  GatewayResponseError,
  classifyUpstreamStatus,
  isPermittedContentType,
  readCappedBody,
  readGatewayEnvelope,
  type GatewayResultValidator,
} from './clubGatewayResponse';
import type { Cqgw1Operation } from './cqgw1';

const REQUEST_ID = 'req-abcdefgh';
const OPERATION: Cqgw1Operation = 'listPayments';

/** Accepts anything. Used where the test is about a step before step 10. */
const acceptAnything: GatewayResultValidator = (_operation, result) => result;

function jsonResponse(body: string, init: ResponseInit = {}): Response {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    ...init,
  });
}

function envelope(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    requestId: REQUEST_ID,
    operation: OPERATION,
    result: { payments: [], total: 0 },
    ...overrides,
  });
}

async function read(
  response: Response,
  validateResult: GatewayResultValidator = acceptAnything,
): Promise<unknown> {
  return readGatewayEnvelope({
    response,
    requestId: REQUEST_ID,
    operation: OPERATION,
    validateResult,
  });
}

async function reasonOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (cause) {
    expect(cause).toBeInstanceOf(GatewayResponseError);
    return (cause as GatewayResponseError).reason;
  }
  throw new Error('expected a rejection');
}

/* ------------------------------------------------------------------- 3 status */

describe('step 3 — status classification', () => {
  const cases: Array<[number, string, string]> = [
    [400, 'status_invalid_query', 'invalid_query'],
    [422, 'status_invalid_query', 'invalid_query'],
    [401, 'status_untrusted', 'unavailable'],
    [403, 'status_untrusted', 'unavailable'],
    [413, 'status_unavailable', 'unavailable'],
    [429, 'status_unavailable', 'unavailable'],
    [500, 'status_unavailable', 'unavailable'],
    [503, 'status_unavailable', 'unavailable'],
    [504, 'status_unavailable', 'unavailable'],
    [204, 'status_unexpected', 'protocol'],
    [418, 'status_unexpected', 'protocol'],
  ];

  it('lets 200 through', () => {
    expect(classifyUpstreamStatus(200)).toBeNull();
  });

  for (const [status, reason, failureClass] of cases) {
    it(`maps ${status} to ${reason}`, () => {
      const failure = classifyUpstreamStatus(status)!;
      expect(failure.reason).toBe(reason);
      expect(failure.failureClass).toBe(failureClass);
    });
  }

  it('never surfaces an upstream 403 as a permission problem', () => {
    // A trust failure between the two servers must read as `unavailable`, or the client becomes an
    // oracle for that relationship.
    expect(classifyUpstreamStatus(403)!.failureClass).toBe('unavailable');
  });

  it('refuses a non-success response without reading its body', async () => {
    // The stream never produces a byte and never closes. Anything that tried to consume it would
    // hang here rather than reject, so a prompt rejection is the proof that it was not consumed.
    const response = new Response(new ReadableStream<Uint8Array>({ pull() {} }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
    await expect(readGatewayEnvelope({
      response,
      requestId: REQUEST_ID,
      operation: OPERATION,
      validateResult: acceptAnything,
    })).rejects.toBeInstanceOf(GatewayResponseError);
  });
});

/* -------------------------------------------------------------- 4 content type */

describe('step 4 — content type', () => {
  const permitted = [
    'application/json',
    'application/json; charset=utf-8',
    'Application/JSON;charset=UTF-8',
    'application/json; charset="utf-8"',
  ];
  const refused = [
    null,
    '',
    'text/plain',
    'text/html; charset=utf-8',
    'application/json; charset=iso-8859-1',
    'application/json; boundary=x',
    'application/ld+json',
    'application/json, text/plain',
    'application/jsonx',
    // Unbalanced quotes. Guessing what was meant is how two parsers end up disagreeing about the
    // same header, which is exactly the ambiguity a contract exists to remove.
    'application/json; charset="utf-8',
    'application/json; charset=utf-8"',
    'application/json; charset="',
    'application/json; charset=""utf-8""',
    // Two answers to one question.
    'application/json; charset=utf-8; charset=utf-8',
    'application/json; charset=utf-8; charset=iso-8859-1',
    // A permitted parameter alongside one that is not.
    'application/json; charset=utf-8; boundary=x',
    'application/json; charset=utf-16',
    'application/json; charset=',
    'application/json; charset',
    'application/json;;charset=utf-8',
  ];

  for (const value of permitted) {
    it(`accepts ${JSON.stringify(value)}`, () => {
      expect(isPermittedContentType(value)).toBe(true);
    });
  }

  for (const value of refused) {
    it(`refuses ${JSON.stringify(value)}`, () => {
      expect(isPermittedContentType(value)).toBe(false);
    });
  }

  it('rejects the whole response when the type is wrong', async () => {
    const response = new Response(envelope(), {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
    expect(await reasonOf(read(response))).toBe('content_type_invalid');
  });
});

/* ------------------------------------------------------------------- 5 the cap */

describe('step 5 — the 4 MiB cap', () => {
  it('is four mebibytes', () => {
    expect(CLUB_GATEWAY_MAX_RESPONSE_BYTES).toBe(4 * 1024 * 1024);
  });

  it('refuses a declared Content-Length over the cap before reading a byte', async () => {
    // Same construction as above: a stream that never yields and never ends. The rejection can only
    // come from the declared length, because reading is the one thing that could not have finished.
    const response = new Response(new ReadableStream<Uint8Array>({ pull() {} }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Content-Length': String(8 * 1024 * 1024) },
    });
    expect(await reasonOf(read(response))).toBe('body_too_large');
  });

  it('stops reading at the chunk that crosses the cap, rather than buffering the rest', async () => {
    const chunk = new Uint8Array(1024);
    let produced = 0;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        produced += 1;
        controller.enqueue(chunk);
      },
    });
    const response = new Response(body, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

    await expect(readCappedBody(response, 4 * 1024)).rejects.toMatchObject({
      reason: 'body_too_large',
    });
    // Five 1 KiB chunks is what it takes to exceed a 4 KiB cap; an unrestricted reader would have
    // drained an endless stream instead. The stream here never ends.
    expect(produced).toBeLessThanOrEqual(6);
  });

  it('accepts a body exactly at the cap', async () => {
    const payload = envelope();
    const response = jsonResponse(payload);
    const bytes = await readCappedBody(response, new TextEncoder().encode(payload).length);
    expect(new TextDecoder().decode(bytes)).toBe(payload);
  });

  it('refuses a malformed Content-Length', async () => {
    for (const declared of ['not-a-number', '-1', '1.5', '12, 12']) {
      const response = new Response(envelope(), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Content-Length': declared },
      });
      expect(await reasonOf(read(response)), declared).toBe('body_unparsable');
    }
  });

  it('catches a body whose declared length understates its true size', async () => {
    // The sender claims 4 bytes and streams far more. The declared length sails through the
    // pre-check; the reader is what refuses.
    const oversized = new TextEncoder().encode('x'.repeat(256));
    const response = new Response(
      new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(oversized);
          controller.close();
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Content-Length': '4' },
      },
    );
    expect(
      await reasonOf(
        readGatewayEnvelope({
          response,
          requestId: REQUEST_ID,
          operation: OPERATION,
          validateResult: acceptAnything,
          maxBytes: 16,
        }),
      ),
    ).toBe('body_too_large');
  });
});

/* ------------------------------------------------- timeout vs transport failure */

describe('a stream failure is classified by whether our own abort caused it', () => {
  function failingBody(): ReadableStream<Uint8Array> {
    return new ReadableStream<Uint8Array>({
      pull() {
        throw new Error('socket reset by peer at 10.0.0.7');
      },
    });
  }

  it('reports a timeout when the configured budget aborted mid-stream', async () => {
    const controller = new AbortController();
    controller.abort();
    const response = new Response(failingBody(), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    expect(
      await reasonOf(
        readGatewayEnvelope({
          response,
          requestId: REQUEST_ID,
          operation: OPERATION,
          validateResult: acceptAnything,
          signal: controller.signal,
        }),
      ),
    ).toBe('timeout');
  });

  it('reports a transport failure when nothing aborted', async () => {
    const controller = new AbortController();
    const response = new Response(failingBody(), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    expect(
      await reasonOf(
        readGatewayEnvelope({
          response,
          requestId: REQUEST_ID,
          operation: OPERATION,
          validateResult: acceptAnything,
          signal: controller.signal,
        }),
      ),
    ).toBe('transport_failed');
  });

  it('reports a transport failure when no signal was supplied at all', async () => {
    const response = new Response(failingBody(), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    expect(await reasonOf(read(response))).toBe('transport_failed');
  });

  it('answers unavailable either way, and names nothing', async () => {
    const controller = new AbortController();
    controller.abort();
    try {
      await readGatewayEnvelope({
        response: new Response(failingBody(), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
        requestId: REQUEST_ID,
        operation: OPERATION,
        validateResult: acceptAnything,
        signal: controller.signal,
      });
      throw new Error('expected a rejection');
    } catch (cause) {
      expect(cause).toBeInstanceOf(GatewayResponseError);
      expect((cause as GatewayResponseError).failureClass).toBe('unavailable');
      const text = `${(cause as Error).message} ${JSON.stringify(cause)}`;
      expect(text).not.toContain('10.0.0.7');
      expect(text).not.toContain('socket reset');
    }
  });
});

/* --------------------------------------------------------------- 6 decode/parse */

describe('step 6 — decode and parse', () => {
  it('refuses an empty body', async () => {
    expect(await reasonOf(read(jsonResponse('')))).toBe('body_unparsable');
  });

  it('refuses malformed JSON', async () => {
    expect(await reasonOf(read(jsonResponse('{ nope')))).toBe('body_unparsable');
  });

  it('refuses truncated JSON', async () => {
    const truncated = envelope().slice(0, -12);
    expect(await reasonOf(read(jsonResponse(truncated)))).toBe('body_unparsable');
  });

  it('refuses bytes that are not UTF-8', async () => {
    const response = new Response(new Uint8Array([0xff, 0xfe, 0xfd]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    expect(await reasonOf(read(response))).toBe('body_undecodable');
  });
});

/* -------------------------------------------------------------- 7..9 envelope */

describe('steps 7–9 — the envelope', () => {
  it('accepts exactly the three fields', async () => {
    await expect(read(jsonResponse(envelope()))).resolves.toEqual({ payments: [], total: 0 });
  });

  it('refuses an unknown top-level field', async () => {
    const body = JSON.stringify({
      requestId: REQUEST_ID,
      operation: OPERATION,
      result: {},
      meta: { page: 1 },
    });
    expect(await reasonOf(read(jsonResponse(body)))).toBe('envelope_shape');
  });

  it('refuses a missing field', async () => {
    for (const missing of ['requestId', 'operation', 'result']) {
      const parsed = JSON.parse(envelope()) as Record<string, unknown>;
      delete parsed[missing];
      expect(await reasonOf(read(jsonResponse(JSON.stringify(parsed)))), missing).toBe('envelope_shape');
    }
  });

  it('refuses a non-object envelope', async () => {
    for (const body of ['null', '[]', '"x"', '3', 'true']) {
      expect(await reasonOf(read(jsonResponse(body))), body).toBe('envelope_shape');
    }
  });

  it('refuses a request-id mismatch, so a crossed response cannot satisfy the wrong call', async () => {
    expect(await reasonOf(read(jsonResponse(envelope({ requestId: 'req-zzzzzzzz' }))))).toBe(
      'request_id_mismatch',
    );
    expect(await reasonOf(read(jsonResponse(envelope({ requestId: 123 }))))).toBe(
      'request_id_mismatch',
    );
  });

  it('refuses an operation mismatch', async () => {
    expect(await reasonOf(read(jsonResponse(envelope({ operation: 'listBookings' }))))).toBe(
      'operation_mismatch',
    );
  });
});

/* ------------------------------------------------------------ 10 result validator */

describe('step 10 — the operation validator', () => {
  it('passes the operation and the result to the validator', async () => {
    const seen: unknown[] = [];
    await read(jsonResponse(envelope()), (operation, result) => {
      seen.push(operation, result);
      return result;
    });
    expect(seen).toEqual([OPERATION, { payments: [], total: 0 }]);
  });

  it('refuses a result the validator rejects', async () => {
    expect(
      await reasonOf(
        read(jsonResponse(envelope()), () => {
          throw new Error('float where cents belong');
        }),
      ),
    ).toBe('result_invalid');
  });

  it('refuses when no validator is wired at all', async () => {
    expect(
      await reasonOf(
        readGatewayEnvelope({
          response: jsonResponse(envelope()),
          requestId: REQUEST_ID,
          operation: OPERATION,
          validateResult: undefined as unknown as GatewayResultValidator,
        }),
      ),
    ).toBe('result_invalid');
  });

  it('returns exactly what the validator returned, never the raw envelope', async () => {
    const validated = { payments: [], total: 0, validated: true };
    await expect(read(jsonResponse(envelope()), () => validated)).resolves.toBe(validated);
  });

  it('never lets a validator error escape as itself', async () => {
    const secret = 'connection to db.internal failed for user cogniiq_readonly';
    try {
      await read(jsonResponse(envelope()), () => {
        throw new Error(secret);
      });
      throw new Error('expected a rejection');
    } catch (cause) {
      expect(cause).toBeInstanceOf(GatewayResponseError);
      expect(String((cause as Error).message)).not.toContain(secret);
      expect(JSON.stringify(cause)).not.toContain('db.internal');
    }
  });
});

describe('failures carry a reason and nothing else', () => {
  it('never puts a value, a header or a URL into the error', async () => {
    const body = JSON.stringify({
      requestId: 'req-zzzzzzzz',
      operation: OPERATION,
      result: { customerName: 'Erika Mustermann', grossCents: 129900 },
    });
    try {
      await read(jsonResponse(body));
      throw new Error('expected a rejection');
    } catch (cause) {
      const text = `${(cause as Error).message} ${JSON.stringify(cause)}`;
      expect(text).not.toContain('Mustermann');
      expect(text).not.toContain('129900');
      expect(text).not.toMatch(/https?:/);
    }
  });
});
