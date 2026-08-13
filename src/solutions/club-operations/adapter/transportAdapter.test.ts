// Transport-backed adapter, exercised entirely against fakes.
//
// No network call is made and none can be: the transport is a function supplied by each test. The
// payloads are produced by the fixture adapter and sent through a JSON round trip first, so what the
// validators see is a plain parsed object rather than the very object the fixtures constructed —
// which is the only way this proves the validation does anything.

import { describe, expect, it } from 'vitest';

import {
  emptyActivityQuery,
  emptyAlertQuery,
  emptyBookingQuery,
  emptyInvoiceQuery,
  emptyMemberQuery,
  emptyPaymentQuery,
  emptyReconciliationQuery,
  emptyVoucherQuery,
} from '../types';
import {
  ClubOperationsError,
  clubOperationsErrorCodes,
  clubOperationsErrorMessages,
  errorMessageFor,
  type ClubOperationsAdapter,
  type ClubOperationsErrorCode,
} from './ClubOperationsAdapter';
import { createFixtureAdapter } from './fixtureAdapter';
import { createTransportAdapter } from './transportAdapter';
import {
  clubOperationsOperations,
  type ClubOperationsOperation,
  type ClubOperationsTransport,
  type ClubOperationsTransportRequest,
} from './transport';

const fixtures = createFixtureAdapter();

/** Every operation, with the query each takes and how to invoke it on any adapter. */
const operations: Array<{
  operation: ClubOperationsOperation;
  invoke: (adapter: ClubOperationsAdapter) => Promise<unknown>;
}> = [
  { operation: 'getOverview', invoke: (a) => a.getOverview({ period: 'month' }) },
  { operation: 'listBookings', invoke: (a) => a.listBookings(emptyBookingQuery) },
  { operation: 'listPayments', invoke: (a) => a.listPayments(emptyPaymentQuery) },
  { operation: 'listInvoices', invoke: (a) => a.listInvoices(emptyInvoiceQuery) },
  { operation: 'listReconciliation', invoke: (a) => a.listReconciliation(emptyReconciliationQuery) },
  { operation: 'getMonthlyReport', invoke: (a) => a.getMonthlyReport({}) },
  { operation: 'getReport', invoke: (a) => a.getReport({ range: 'month' }) },
  { operation: 'listVouchers', invoke: (a) => a.listVouchers(emptyVoucherQuery) },
  { operation: 'listMembers', invoke: (a) => a.listMembers(emptyMemberQuery) },
  { operation: 'listActivity', invoke: (a) => a.listActivity(emptyActivityQuery) },
  { operation: 'listAlerts', invoke: (a) => a.listAlerts(emptyAlertQuery) },
  { operation: 'getSettings', invoke: (a) => a.getSettings() },
];

/** A JSON round trip, which is what any real transport would impose. */
function overTheWire<T>(value: T): unknown {
  return JSON.parse(JSON.stringify(value));
}

/** A transport that answers from the fixture adapter, recording what it was asked. */
function fixtureTransport(record?: ClubOperationsTransportRequest[]): ClubOperationsTransport {
  return async (request) => {
    record?.push(request);
    const entry = operations.find((candidate) => candidate.operation === request.operation)!;
    return { status: 200, body: overTheWire(await entry.invoke(fixtures)) };
  };
}

async function codeOf(promise: Promise<unknown>): Promise<ClubOperationsErrorCode | 'no-error'> {
  try {
    await promise;
    return 'no-error';
  } catch (error) {
    if (error instanceof ClubOperationsError) return error.code;
    throw error;
  }
}

/* ------------------------------------------------------------------ Contract */

describe('the transport adapter satisfies the whole read-only contract', () => {
  it('covers all twelve operations and no more', () => {
    expect(operations).toHaveLength(12);
    expect(operations.map((entry) => entry.operation).sort()).toEqual(
      [...clubOperationsOperations].sort(),
    );
  });

  it('returns validated data for every operation', async () => {
    const adapter = createTransportAdapter({ transport: fixtureTransport() });
    for (const { operation, invoke } of operations) {
      const result = await invoke(adapter);
      expect(result, operation).toBeTruthy();
      expect(result, operation).toEqual(overTheWire(await invoke(fixtures)));
    }
  });

  it('sends the operation name and the domain query, and nothing else', async () => {
    const seen: ClubOperationsTransportRequest[] = [];
    const adapter = createTransportAdapter({ transport: fixtureTransport(seen) });
    for (const { invoke } of operations) await invoke(adapter);

    expect(seen.map((request) => request.operation)).toEqual(
      operations.map((entry) => entry.operation),
    );
    for (const request of seen) {
      expect(Object.keys(request).sort()).toEqual(['operation', 'query']);
      // Nothing resembling a tenant, credential or connection target may be in the request.
      const serialised = JSON.stringify(request);
      for (const forbidden of [
        'organization',
        'organisation',
        'token',
        'secret',
        'key',
        'url',
        'project',
        'supabase',
        'password',
        'authorization',
      ]) {
        expect(serialised.toLowerCase(), forbidden).not.toContain(forbidden);
      }
    }
  });

  it('passes the caller query through unchanged', async () => {
    const seen: ClubOperationsTransportRequest[] = [];
    const adapter = createTransportAdapter({ transport: fixtureTransport(seen) });
    await adapter.listBookings({ search: 'abc', status: 'confirmed', court: 'padel-1' });
    expect(seen[0].query).toEqual({ search: 'abc', status: 'confirmed', court: 'padel-1' });
  });

  it('exposes no mutating method', () => {
    const adapter = createTransportAdapter({ transport: fixtureTransport() });
    const names = Object.keys(adapter);
    for (const name of names) {
      expect(name, `${name} looks like a mutation`).not.toMatch(
        /^(create|update|delete|remove|save|send|void|refund|set|write|post|put|patch|cancel|issue|redeem)/i,
      );
    }
    expect(names.filter((name) => name !== 'id').sort()).toEqual(
      [...clubOperationsOperations].sort(),
    );
  });

  it('identifies itself without naming a connection target', () => {
    const adapter = createTransportAdapter({ transport: fixtureTransport() });
    expect(adapter.id).toBe('transport');
    expect(createTransportAdapter({ transport: fixtureTransport(), id: 'transport:fake' }).id).toBe(
      'transport:fake',
    );
  });
});

/* -------------------------------------------------------------- Error mapping */

describe('every transport outcome maps to a public error code and its German message', () => {
  const statusExpectations: Array<[number, ClubOperationsErrorCode]> = [
    [401, 'unauthorized'],
    [403, 'forbidden'],
    [400, 'invalid_query'],
    [422, 'invalid_query'],
    [429, 'unavailable'],
    [500, 'unavailable'],
    [502, 'unavailable'],
    [503, 'unavailable'],
    [504, 'unavailable'],
    [204, 'unknown'],
    [302, 'unknown'],
    [418, 'unknown'],
  ];

  for (const [status, expected] of statusExpectations) {
    it(`maps status ${status} to ${expected} on every operation`, async () => {
      const adapter = createTransportAdapter({
        transport: async () => ({ status, body: { anything: true } }),
      });
      for (const { operation, invoke } of operations) {
        expect(await codeOf(invoke(adapter)), operation).toBe(expected);
      }
    });
  }

  it('produces the exact German message the UI already shows, for all five codes', async () => {
    const seen = new Set<ClubOperationsErrorCode>();
    for (const [status, expected] of statusExpectations) {
      const adapter = createTransportAdapter({
        transport: async () => ({ status, body: {} }),
      });
      try {
        await adapter.listBookings(emptyBookingQuery);
      } catch (error) {
        expect(errorMessageFor(error)).toBe(clubOperationsErrorMessages[expected]);
        seen.add(expected);
      }
    }
    // A transport that never completes is the fifth code's own path.
    const throwing = createTransportAdapter({
      transport: async () => {
        throw new TypeError('the fake transport blew up');
      },
    });
    try {
      await throwing.listBookings(emptyBookingQuery);
    } catch (error) {
      expect(errorMessageFor(error)).toBe(clubOperationsErrorMessages.unavailable);
      seen.add('unavailable');
    }

    expect([...seen].sort()).toEqual([...clubOperationsErrorCodes].sort());
  });

  it('treats a transport that throws as unavailable, and leaks nothing of the cause', async () => {
    const adapter = createTransportAdapter({
      transport: async () => {
        throw new Error('ECONNREFUSED 10.0.0.7:5432 while opening a pooled connection');
      },
    });
    try {
      await adapter.listMembers(emptyMemberQuery);
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ClubOperationsError);
      expect((error as ClubOperationsError).code).toBe('unavailable');
      expect((error as ClubOperationsError).message).not.toContain('ECONNREFUSED');
      expect((error as ClubOperationsError).message).not.toContain('10.0.0.7');
    }
  });

  it('passes a ClubOperationsError raised by the transport through unchanged', async () => {
    const adapter = createTransportAdapter({
      transport: async () => {
        throw new ClubOperationsError('forbidden', 'denied by the caller');
      },
    });
    expect(await codeOf(adapter.listMembers(emptyMemberQuery))).toBe('forbidden');
  });

  it('never invents a code outside the five the UI handles', async () => {
    for (const status of [100, 201, 301, 404, 409, 451, 599, 0, -1]) {
      const adapter = createTransportAdapter({ transport: async () => ({ status, body: {} }) });
      const code = await codeOf(adapter.listBookings(emptyBookingQuery));
      expect(clubOperationsErrorCodes as readonly string[], `status ${status}`).toContain(code);
    }
  });
});

/* ------------------------------------------------------------ Malformed input */

describe('a malformed upstream payload becomes unknown and never reaches a component', () => {
  const malformedBodies: Array<[string, unknown]> = [
    ['null', null],
    ['an array', []],
    ['a string', 'ok'],
    ['a number', 42],
    ['a boolean', true],
    ['an empty object', {}],
  ];

  for (const [what, body] of malformedBodies) {
    it(`rejects ${what} on every operation`, async () => {
      const adapter = createTransportAdapter({ transport: async () => ({ status: 200, body }) });
      for (const { operation, invoke } of operations) {
        expect(await codeOf(invoke(adapter)), operation).toBe('unknown');
      }
    });
  }

  it('rejects a missing field', async () => {
    const adapter = createTransportAdapter({
      transport: async () => ({ status: 200, body: { bookings: [] } }), // no `total`
    });
    expect(await codeOf(adapter.listBookings(emptyBookingQuery))).toBe('unknown');
  });

  it('rejects a field of the wrong primitive type', async () => {
    const adapter = createTransportAdapter({
      transport: async () => ({ status: 200, body: { bookings: [], total: '3' } }),
    });
    expect(await codeOf(adapter.listBookings(emptyBookingQuery))).toBe('unknown');
  });

  it('rejects an enum value outside the domain vocabulary', async () => {
    const page = overTheWire(await fixtures.listBookings(emptyBookingQuery)) as {
      bookings: Array<Record<string, unknown>>;
      total: number;
    };
    page.bookings[0].status = 'ARCHIVED';
    const adapter = createTransportAdapter({ transport: async () => ({ status: 200, body: page }) });
    expect(await codeOf(adapter.listBookings(emptyBookingQuery))).toBe('unknown');
  });

  it('rejects a float where integer cents belong', async () => {
    const page = overTheWire(await fixtures.listPayments(emptyPaymentQuery)) as {
      payments: Array<Record<string, unknown>>;
    };
    page.payments[0].grossCents = 1234.5;
    const adapter = createTransportAdapter({ transport: async () => ({ status: 200, body: page }) });
    expect(await codeOf(adapter.listPayments(emptyPaymentQuery))).toBe('unknown');
  });

  it('rejects a null where a non-nullable field belongs', async () => {
    const page = overTheWire(await fixtures.listMembers(emptyMemberQuery)) as {
      members: Array<Record<string, unknown>>;
    };
    page.members[0].lastName = null;
    const adapter = createTransportAdapter({ transport: async () => ({ status: 200, body: page }) });
    expect(await codeOf(adapter.listMembers(emptyMemberQuery))).toBe('unknown');
  });

  it('rejects a nested collection whose element is malformed', async () => {
    const page = overTheWire(await fixtures.listVouchers(emptyVoucherQuery)) as {
      vouchers: Array<{ usages: unknown }>;
    };
    page.vouchers[0].usages = [{ id: 'u1' }];
    const adapter = createTransportAdapter({ transport: async () => ({ status: 200, body: page }) });
    expect(await codeOf(adapter.listVouchers(emptyVoucherQuery))).toBe('unknown');
  });

  it('rejects an array where an object belongs, and vice versa', async () => {
    const adapter = createTransportAdapter({
      transport: async () => ({ status: 200, body: { records: {}, total: 0 } }),
    });
    expect(await codeOf(adapter.listActivity(emptyActivityQuery))).toBe('unknown');
  });

  it('rejects a prototype-pollution shaped payload rather than reading through it', async () => {
    const body = JSON.parse('{"__proto__":{"total":1},"bookings":[]}');
    const adapter = createTransportAdapter({ transport: async () => ({ status: 200, body }) });
    expect(await codeOf(adapter.listBookings(emptyBookingQuery))).toBe('unknown');
    expect(({} as Record<string, unknown>).total).toBeUndefined();
  });

  it('surfaces nothing of the malformed value in the error the UI receives', async () => {
    const adapter = createTransportAdapter({
      transport: async () => ({
        status: 200,
        body: { bookings: [], total: 'Müller, Rechnung RE-2026-0007, 1234.56 EUR' },
      }),
    });
    try {
      await adapter.listBookings(emptyBookingQuery);
      expect.unreachable('should have thrown');
    } catch (error) {
      const message = (error as ClubOperationsError).message;
      expect(message).not.toContain('Müller');
      expect(message).not.toContain('RE-2026-0007');
      expect(message).not.toContain('1234.56');
      expect(errorMessageFor(error)).toBe(clubOperationsErrorMessages.unknown);
    }
  });

  it('accepts a well-formed payload for every operation, so the validators are not simply strict', async () => {
    const adapter = createTransportAdapter({ transport: fixtureTransport() });
    for (const { operation, invoke } of operations) {
      expect(await codeOf(invoke(adapter)), operation).toBe('no-error');
    }
  });
});

/* ------------------------------------------------------------------ Isolation */

describe('the adapter stays ignorant of the transport', () => {
  it('works with a transport that shares nothing but the function signature', async () => {
    const adapter = createTransportAdapter({
      transport: async ({ operation }) => {
        if (operation !== 'getSettings') return { status: 503, body: null };
        return { status: 200, body: overTheWire(await fixtures.getSettings()) };
      },
    });
    expect(await codeOf(adapter.getSettings())).toBe('no-error');
    expect(await codeOf(adapter.listBookings(emptyBookingQuery))).toBe('unavailable');
  });

  it('one failing operation does not disturb another', async () => {
    const adapter = createTransportAdapter({
      transport: async ({ operation }) => {
        if (operation === 'listMembers') return { status: 403, body: null };
        const entry = operations.find((candidate) => candidate.operation === operation)!;
        return { status: 200, body: overTheWire(await entry.invoke(fixtures)) };
      },
    });
    expect(await codeOf(adapter.listMembers(emptyMemberQuery))).toBe('forbidden');
    expect(await codeOf(adapter.listBookings(emptyBookingQuery))).toBe('no-error');
    expect(await codeOf(adapter.getOverview({ period: 'month' }))).toBe('no-error');
  });
});
