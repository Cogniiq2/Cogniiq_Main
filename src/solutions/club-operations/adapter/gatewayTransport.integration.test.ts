// The read-only adapter over the *real* gateway transport, with a fake `fetch` (plan §14.1.4,
// §14.1.5).
//
// Why this test lives here rather than beside the transport: `clubOperations.boundaries.test.ts`
// fails the build if any file under `src/` outside this module so much as names the module's path,
// which is what keeps the browser module free of a transport. The transport therefore takes its
// operation validators as an injected dependency, and this is the one place where the real
// validators and the real transport meet — so it is the only place the two halves can be proven to
// agree.
//
// Nothing here opens a socket, names a real host or uses a real credential.

import { describe, expect, it } from 'vitest';

import {
  createClubGatewayTransport,
  type ClubGatewayTransportConfig,
} from '@/lib/gateway/clubGatewayTransport';
import { CQGW1_HEADERS, cqgw1Operations, type Cqgw1Operation } from '@/lib/gateway/cqgw1';

import { ClubOperationsError } from './ClubOperationsAdapter';
import { createFixtureAdapter } from './fixtureAdapter';
import {
  validateActivityPage,
  validateAlertPage,
  validateBookingPage,
  validateInvoicePage,
  validateMemberPage,
  validateMonthlyReportComparison,
  validateOverviewSnapshot,
  validatePaymentPage,
  validateReconciliationPage,
  validateReportSnapshot,
  validateSettingsSnapshot,
  validateVoucherPage,
} from './responseValidation';
import { createTransportAdapter } from './transportAdapter';

const BASE_URL = 'https://gateway.example.test';
const KEY_ID = 'integration-key';
const REQUEST_ID = 'integrationRequest01';

const VALIDATORS: Record<Cqgw1Operation, (value: unknown) => unknown> = {
  getOverview: validateOverviewSnapshot,
  listBookings: validateBookingPage,
  listPayments: validatePaymentPage,
  listInvoices: validateInvoicePage,
  listReconciliation: validateReconciliationPage,
  getMonthlyReport: validateMonthlyReportComparison,
  getReport: validateReportSnapshot,
  listVouchers: validateVoucherPage,
  listMembers: validateMemberPage,
  listActivity: validateActivityPage,
  listAlerts: validateAlertPage,
  getSettings: validateSettingsSnapshot,
};

/** Real payloads for every operation, produced by the fixture adapter the UI already renders. */
async function realPayloads(): Promise<Record<Cqgw1Operation, unknown>> {
  const fixtures = createFixtureAdapter({ latencyMs: 0 });
  return {
    getOverview: await fixtures.getOverview({ period: 'month' }),
    listBookings: await fixtures.listBookings({}),
    listPayments: await fixtures.listPayments({}),
    listInvoices: await fixtures.listInvoices({}),
    listReconciliation: await fixtures.listReconciliation({}),
    getMonthlyReport: await fixtures.getMonthlyReport({}),
    getReport: await fixtures.getReport({ range: 'month' }),
    listVouchers: await fixtures.listVouchers({}),
    listMembers: await fixtures.listMembers({}),
    listActivity: await fixtures.listActivity({}),
    listAlerts: await fixtures.listAlerts({}),
    getSettings: await fixtures.getSettings(),
  };
}

async function buildAdapter(
  respond: (operation: Cqgw1Operation, requestId: string) => Response | Promise<Response>,
  overrides: Partial<ClubGatewayTransportConfig> = {},
) {
  const { privateKey } = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, [
    'sign',
    'verify',
  ])) as CryptoKeyPair;

  const fetchImpl = (async (_url: unknown, init?: RequestInit) => {
    const headers = init!.headers as Record<string, string>;
    const operation = headers[CQGW1_HEADERS.operation] as Cqgw1Operation;
    return respond(operation, headers[CQGW1_HEADERS.requestId]);
  }) as unknown as typeof fetch;

  const transport = createClubGatewayTransport({
    baseUrl: BASE_URL,
    keyId: KEY_ID,
    signingKey: privateKey,
    validateResult: (operation, result) => VALIDATORS[operation](result),
    fetchImpl,
    newRequestId: () => REQUEST_ID,
    ...overrides,
  });

  return createTransportAdapter({ transport });
}

function envelope(operation: string, requestId: string, result: unknown): Response {
  return new Response(JSON.stringify({ requestId, operation, result }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function callOperation(
  adapter: Awaited<ReturnType<typeof buildAdapter>>,
  operation: Cqgw1Operation,
): Promise<unknown> {
  switch (operation) {
    case 'getOverview':
      return adapter.getOverview({ period: 'month' });
    case 'listBookings':
      return adapter.listBookings({});
    case 'listPayments':
      return adapter.listPayments({});
    case 'listInvoices':
      return adapter.listInvoices({});
    case 'listReconciliation':
      return adapter.listReconciliation({});
    case 'getMonthlyReport':
      return adapter.getMonthlyReport({});
    case 'getReport':
      return adapter.getReport({ range: 'month' });
    case 'listVouchers':
      return adapter.listVouchers({});
    case 'listMembers':
      return adapter.listMembers({});
    case 'listActivity':
      return adapter.listActivity({});
    case 'listAlerts':
      return adapter.listAlerts({});
    case 'getSettings':
      return adapter.getSettings();
  }
}

async function codeOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (cause) {
    expect(cause).toBeInstanceOf(ClubOperationsError);
    return (cause as ClubOperationsError).code;
  }
  throw new Error('expected a rejection');
}

describe('every operation round-trips through the real validators', () => {
  it('accepts a real payload for all twelve operations', async () => {
    const payloads = await realPayloads();
    const adapter = await buildAdapter((operation, requestId) =>
      envelope(operation, requestId, payloads[operation]),
    );

    for (const operation of cqgw1Operations) {
      const received = await callOperation(adapter, operation);
      expect(received, operation).toEqual(payloads[operation]);
    }
  });
});

describe('the corrected nullable contract survives the wire', () => {
  it('accepts an explicit null for a source-absent field', async () => {
    const payloads = await realPayloads();
    const page = structuredClone(payloads.listPayments) as unknown as {
      payments: Array<Record<string, unknown>>;
      totals: Record<string, unknown>;
    };
    page.payments[0].refundedCents = null;
    page.payments[0].customerName = null;
    page.payments[0].metaClass = null;
    page.totals.refundedCents = null;
    page.totals.netCents = null;
    page.totals.refundedCount = null;
    page.totals.doubleBookingCount = null;
    page.totals.customerCancelledCount = null;

    const adapter = await buildAdapter((operation, requestId) => envelope(operation, requestId, page));
    const received = (await adapter.listPayments({})) as unknown as typeof page;
    expect(received.payments[0].refundedCents).toBeNull();
    expect(received.totals.netCents).toBeNull();
  });

  it('rejects a missing key where the shape requires one, and rejects undefined', async () => {
    const payloads = await realPayloads();

    const missing = structuredClone(payloads.listPayments) as unknown as {
      payments: Array<Record<string, unknown>>;
    };
    delete missing.payments[0].refundedCents;
    const missingAdapter = await buildAdapter((operation, requestId) =>
      envelope(operation, requestId, missing),
    );
    expect(await codeOf(missingAdapter.listPayments({}))).toBe('unknown');

    // `undefined` cannot survive JSON, so it arrives as an absent key — which is the same rejection.
    // The explicit case is asserted here so the equivalence is recorded rather than assumed.
    const undefinedAdapter = await buildAdapter((operation, requestId) => {
      const withUndefined = structuredClone(payloads.listPayments) as unknown as {
        payments: Array<Record<string, unknown>>;
      };
      withUndefined.payments[0].refundedCents = undefined;
      return envelope(operation, requestId, withUndefined);
    });
    expect(await codeOf(undefinedAdapter.listPayments({}))).toBe('unknown');
  });

  it('rejects a float where cents belong and an unknown enum member', async () => {
    const payloads = await realPayloads();

    const float = structuredClone(payloads.listPayments) as unknown as {
      payments: Array<Record<string, unknown>>;
    };
    float.payments[0].grossCents = 1299.5;
    const floatAdapter = await buildAdapter((operation, requestId) =>
      envelope(operation, requestId, float),
    );
    expect(await codeOf(floatAdapter.listPayments({}))).toBe('unknown');

    const badEnum = structuredClone(payloads.listPayments) as unknown as {
      payments: Array<Record<string, unknown>>;
    };
    badEnum.payments[0].provider = 'klarna';
    const enumAdapter = await buildAdapter((operation, requestId) =>
      envelope(operation, requestId, badEnum),
    );
    expect(await codeOf(enumAdapter.listPayments({}))).toBe('unknown');
  });
});

describe('the five public codes, and no others', () => {
  it('maps every failure onto exactly one of them', async () => {
    const payloads = await realPayloads();
    const seen = new Set<string>();

    // A protocol failure — the envelope is not the contract's envelope.
    const wrongId = await buildAdapter((operation) => envelope(operation, 'someoneElsesId0001', {}));
    seen.add(await codeOf(wrongId.getSettings()));

    // An upstream trust failure. It must read as `unavailable`, never as `forbidden`.
    const untrusted = await buildAdapter(() =>
      new Response('{}', { status: 403, headers: { 'Content-Type': 'application/json' } }),
    );
    const untrustedCode = await codeOf(untrusted.getSettings());
    expect(untrustedCode).toBe('unavailable');
    seen.add(untrustedCode);

    // Upstream parameter refusal.
    const refused = await buildAdapter(() =>
      new Response('{}', { status: 400, headers: { 'Content-Type': 'application/json' } }),
    );
    seen.add(await codeOf(refused.getSettings()));

    // A transport failure.
    const broken = await buildAdapter(() => {
      throw new Error('ECONNRESET');
    });
    seen.add(await codeOf(broken.getSettings()));

    // A result that does not match the domain shape.
    const malformed = await buildAdapter((operation, requestId) =>
      envelope(operation, requestId, { payments: 'not an array' }),
    );
    seen.add(await codeOf(malformed.listPayments({})));

    expect([...seen].sort()).toEqual(['invalid_query', 'unavailable', 'unknown']);
    for (const code of seen) {
      expect(['unauthorized', 'forbidden', 'invalid_query', 'unavailable', 'unknown']).toContain(code);
    }
    // `forbidden` is never reachable from this path: the boundary answers denials itself, and an
    // upstream trust failure must not be spelled as a permission problem.
    expect(seen.has('forbidden')).toBe(false);

    // The healthy path still works with the same wiring.
    const healthy = await buildAdapter((operation, requestId) =>
      envelope(operation, requestId, payloads.getSettings),
    );
    await expect(healthy.getSettings()).resolves.toEqual(payloads.getSettings);
  });

  it('never surfaces an upstream trust failure as a permission problem', async () => {
    for (const status of [401, 403]) {
      const adapter = await buildAdapter(() =>
        new Response('{}', { status, headers: { 'Content-Type': 'application/json' } }),
      );
      expect(await codeOf(adapter.getSettings()), String(status)).toBe('unavailable');
    }
  });
});
