// Golden Agent — n8n webhook adapter contract.
//
// This is the executable half of docs/golden-agent-n8n-contract.md. A future customer workflow is
// correct exactly when it satisfies what these tests assert about requests, and returns one of the
// response shapes they accept.
//
// The governing rule is: NEVER INVENT SUCCESS. Every ambiguous, malformed or unexpected answer
// must become a typed failure, because the alternative is an agent telling a caller their
// appointment is booked when it is not.

import { describe, expect, it, vi } from 'vitest';

import { N8nBookingProvider } from './n8nBookingProvider.ts';
import type { ProviderContext } from './bookingProvider.ts';
import { testClinicConfig, TEST_CLINIC_CLIENT_ID } from '../index.ts';

const SECRET = 'n8n_shared_secret_value';

function context(): ProviderContext {
  return { clientId: TEST_CLINIC_CLIENT_ID, config: testClinicConfig({ stage: 'staging' }), conversationId: 'conv_7', now: '2026-09-08T09:00' };
}

interface Captured { url: string; init: RequestInit }

function providerReturning(response: Response | (() => Response | Promise<Response>), overrides: Record<string, unknown> = {}) {
  const captured: Captured[] = [];
  const fetchImpl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    captured.push({ url: String(url), init: init ?? {} });
    return typeof response === 'function' ? await response() : response;
  }) as unknown as typeof fetch;
  const provider = new N8nBookingProvider({
    baseUrl: 'https://n8n.example.com/webhook/haema/', secret: SECRET, fetchImpl,
    sign: async (secret, body) => `sig(${secret.length}:${body.length})`,
    now: () => 1_800_000_000_000,
    ...overrides,
  });
  return { provider, captured };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const SLOT_OK = {
  ok: true,
  data: {
    none_available: false,
    slots: [{ slot_id: 'zentrum|erstgespraech|2026-09-09T09:00', start_time: '2026-09-09T09:00', end_time: '2026-09-09T09:30', location_id: 'zentrum', service_id: 'erstgespraech' }],
  },
};

const BOOKED_OK = {
  ok: true,
  data: {
    status: 'booked',
    appointment: { appointment_id: 'a_1', start_time: '2026-09-09T09:00', end_time: '2026-09-09T09:30', location_id: 'zentrum', service_id: 'erstgespraech', status: 'booked' },
  },
};

const CREATE_REQUEST = {
  idempotencyKey: 'conv_7:create_appointment:abc123', slotId: 'zentrum|erstgespraech|2026-09-09T09:00',
  serviceId: 'erstgespraech', locationId: 'zentrum', startTime: '2026-09-09T09:00',
  caller: { firstName: 'Ben', lastName: 'Keller', dateOfBirth: '1992-11-02', phone: '+4917612345679' },
};

describe('n8n request shape', () => {
  it('posts one operation per endpoint with the signed timestamp, client and idempotency headers', async () => {
    const { provider, captured } = providerReturning(json(BOOKED_OK));
    await provider.createAppointment(context(), CREATE_REQUEST);

    expect(captured).toHaveLength(1);
    // Trailing slashes on the configured base URL are normalised away.
    expect(captured[0].url).toBe('https://n8n.example.com/webhook/haema/create_appointment');
    expect(captured[0].init.method).toBe('POST');

    const headers = captured[0].init.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['X-Cogniiq-Client']).toBe(TEST_CLINIC_CLIENT_ID);
    expect(headers['X-Cogniiq-Timestamp']).toBe('1800000000');
    expect(headers['X-Cogniiq-Idempotency-Key']).toBe(CREATE_REQUEST.idempotencyKey);
    expect(headers['X-Cogniiq-Signature']).toBeTruthy();

    const body = JSON.parse(String(captured[0].init.body)) as Record<string, unknown>;
    expect(body.client_id).toBe(TEST_CLINIC_CLIENT_ID);
    expect(body.conversation_id).toBe('conv_7');
    expect(body.idempotency_key).toBe(CREATE_REQUEST.idempotencyKey);
    expect(body.slot_id).toBe(CREATE_REQUEST.slotId);
    // snake_case all the way down, and fields the caller never gave are omitted, not null.
    expect(body.caller).toEqual({ first_name: 'Ben', last_name: 'Keller', date_of_birth: '1992-11-02', phone: '+4917612345679' });
  });

  it('signs `${timestamp}.${rawBody}`, so a captured request cannot be replayed with a new timestamp', async () => {
    const signed: string[] = [];
    const { provider, captured } = providerReturning(json(SLOT_OK), {
      sign: async (_secret: string, payload: string) => { signed.push(payload); return 'sig'; },
    });
    await provider.getAvailableSlots(context(), { serviceId: 'erstgespraech', fromDate: '2026-09-09', toDate: '2026-09-10' });
    expect(signed).toHaveLength(1);
    expect(signed[0]).toBe(`1800000000.${String(captured[0].init.body)}`);
  });

  it('never puts the shared secret into the request', async () => {
    const { provider, captured } = providerReturning(json(SLOT_OK), { sign: undefined });
    await provider.getAvailableSlots(context(), { serviceId: 'erstgespraech', fromDate: '2026-09-09', toDate: '2026-09-10' });
    const serialised = JSON.stringify(captured[0]);
    expect(serialised).not.toContain(SECRET);
  });

  it('covers every operation the booking contract defines', async () => {
    const responses: Record<string, unknown> = {
      get_available_slots: SLOT_OK,
      create_appointment: BOOKED_OK,
      find_appointment: { ok: true, data: { appointments: [], identity_verified: true } },
      reschedule_appointment: { ok: true, data: { status: 'rescheduled', appointment: BOOKED_OK.data.appointment, previous_start_time: '2026-09-08T09:00' } },
      cancel_appointment: { ok: true, data: { status: 'cancelled', appointment_id: 'a_1', late_cancellation: false } },
      send_confirmation: { ok: true, data: { status: 'sent', channel: 'sms' } },
      request_callback: { ok: true, data: { status: 'recorded', callback_id: 'cb_1', expectation: 'Wir melden uns.' } },
    };
    const seen: string[] = [];
    const fetchImpl = (async (url: string | URL | Request) => {
      const operation = String(url).split('/').pop() ?? '';
      seen.push(operation);
      return json(responses[operation]);
    }) as unknown as typeof fetch;
    const provider = new N8nBookingProvider({ baseUrl: 'https://n8n.example.com/webhook/x', secret: SECRET, fetchImpl, sign: async () => 'sig' });
    const ctx = context();

    expect((await provider.getAvailableSlots(ctx, { serviceId: 'erstgespraech', fromDate: '2026-09-09', toDate: '2026-09-10' })).ok).toBe(true);
    expect((await provider.createAppointment(ctx, CREATE_REQUEST)).ok).toBe(true);
    expect((await provider.findAppointments(ctx, { lastName: 'Keller', dateOfBirth: '1992-11-02' }, {})).ok).toBe(true);
    expect((await provider.rescheduleAppointment(ctx, { idempotencyKey: 'k', appointmentId: 'a_1', newSlotId: 's', newStartTime: '2026-09-09T09:00', caller: {} })).ok).toBe(true);
    expect((await provider.cancelAppointment(ctx, { idempotencyKey: 'k', appointmentId: 'a_1', caller: {} })).ok).toBe(true);
    expect((await provider.sendConfirmation(ctx, { idempotencyKey: 'k', appointmentId: 'a_1', channel: 'sms', destination: '+49176' })).ok).toBe(true);
    expect((await provider.requestCallback(ctx, { idempotencyKey: 'k', callerName: 'Ben', callerPhone: '+49176', topic: 'x', urgency: 'normal' })).ok).toBe(true);

    expect(seen).toEqual(['get_available_slots', 'create_appointment', 'find_appointment', 'reschedule_appointment', 'cancel_appointment', 'send_confirmation', 'request_callback']);
  });
});

describe('n8n failure translation', () => {
  const call = (provider: N8nBookingProvider) => provider.createAppointment(context(), CREATE_REQUEST);

  it('turns an unreachable or slow workflow into a retryable failure, never a success', async () => {
    const network = providerReturning(() => { throw new TypeError('fetch failed'); });
    const unreachable = await call(network.provider);
    expect(unreachable).toMatchObject({ ok: false, code: 'provider_unavailable', retryable: true, next_action: 'offer_callback' });

    // A workflow that never answers: the fake honours the abort signal exactly as fetch does.
    const hanging = (async (_url: string | URL | Request, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
    })) as unknown as typeof fetch;
    const timeout = new N8nBookingProvider({ baseUrl: 'https://n8n.example.com/webhook/x', secret: SECRET, fetchImpl: hanging, sign: async () => 'sig', timeoutMs: 5 });
    const timedOut = await call(timeout);
    expect(timedOut).toMatchObject({ ok: false, code: 'provider_timeout', retryable: true });
  });

  it('reports an authentication mismatch to the operator without telling the caller about it', async () => {
    const diagnostics: string[] = [];
    const { provider } = providerReturning(json({ message: 'unauthorized' }, 401), { onDiagnostic: (m: string) => diagnostics.push(m) });
    const result = await call(provider);
    expect(result).toMatchObject({ ok: false, code: 'provider_unavailable', retryable: false });
    // The caller-facing message says nothing about secrets, signatures or n8n.
    expect(result.ok === false && result.message).not.toMatch(/n8n|signature|secret|401/i);
    expect(diagnostics.join(' ')).toContain('shared secret');
  });

  it('reports a missing webhook path distinctly from a broken one', async () => {
    const diagnostics: string[] = [];
    const { provider } = providerReturning(json({}, 404), { onDiagnostic: (m: string) => diagnostics.push(m) });
    expect(await call(provider)).toMatchObject({ ok: false, code: 'provider_unavailable', retryable: false });
    expect(diagnostics.join(' ')).toContain('no webhook for this operation');
  });

  it('treats 429 as retryable and 5xx as a provider error', async () => {
    expect(await call(providerReturning(json({}, 429)).provider)).toMatchObject({ code: 'provider_timeout', retryable: true });
    expect(await call(providerReturning(json({}, 503)).provider)).toMatchObject({ code: 'provider_error', retryable: true });
    expect(await call(providerReturning(json({}, 500)).provider)).toMatchObject({ code: 'provider_error', retryable: false });
  });

  it('refuses to accept a success that arrives with an error status', async () => {
    const diagnostics: string[] = [];
    const { provider } = providerReturning(json(BOOKED_OK, 400), { onDiagnostic: (m: string) => diagnostics.push(m) });
    const result = await call(provider);
    expect(result).toMatchObject({ ok: false, code: 'malformed_provider_response' });
    expect(diagnostics.join(' ')).toContain('ok:true');
  });

  it('rejects non-JSON, envelope-less and schema-violating bodies', async () => {
    const notJson = providerReturning(new Response('<html>Cloudflare</html>', { status: 200 }));
    expect(await call(notJson.provider)).toMatchObject({ code: 'malformed_provider_response' });

    const noEnvelope = providerReturning(json({ appointment_id: 'a_1' }));
    expect(await call(noEnvelope.provider)).toMatchObject({ code: 'malformed_provider_response' });

    // ok:true, but the appointment is missing the fields the agent needs to read back.
    const wrongShape = providerReturning(json({ ok: true, data: { status: 'booked', appointment: { appointment_id: 'a_1' } } }));
    expect(await call(wrongShape.provider)).toMatchObject({ code: 'malformed_provider_response' });

    // ok:true with a status the contract does not define.
    const wrongStatus = providerReturning(json({ ok: true, data: { ...BOOKED_OK.data, status: 'maybe' } }));
    expect(await call(wrongStatus.provider)).toMatchObject({ code: 'malformed_provider_response' });
  });

  it('passes a documented failure code straight through and maps the next action', async () => {
    const unavailable = providerReturning(json({ ok: false, code: 'slot_unavailable', message: 'Der Termin ist vergeben.' }));
    expect(await call(unavailable.provider)).toMatchObject({ ok: false, code: 'slot_unavailable', next_action: 'offer_alternatives', message: 'Der Termin ist vergeben.' });

    const duplicate = providerReturning(json({ ok: false, code: 'duplicate_booking', message: 'Es besteht bereits ein Termin.' }));
    expect(await call(duplicate.provider)).toMatchObject({ ok: false, code: 'duplicate_booking' });

    const unverified = providerReturning(json({ ok: false, code: 'identity_unverified', message: 'Angaben stimmen nicht.' }));
    expect(await call(unverified.provider)).toMatchObject({ code: 'identity_unverified', next_action: 'verify_identity' });
  });

  it('downgrades an undocumented failure code to provider_error instead of trusting it', async () => {
    const { provider } = providerReturning(json({ ok: false, code: 'everything_is_fine_actually', message: 'x' }));
    expect(await call(provider)).toMatchObject({ ok: false, code: 'provider_error' });
  });

  it('replaces an over-long or non-string workflow message with a safe default', async () => {
    const long = providerReturning(json({ ok: false, code: 'provider_error', message: 'x'.repeat(500) }));
    const result = await call(long.provider);
    expect(result.ok === false && result.message).toBe('Das Buchungssystem konnte die Anfrage nicht ausführen.');
  });

  it('honours the workflow\'s own deduplication flag on a retried write', async () => {
    const { provider } = providerReturning(json({ ...BOOKED_OK, deduplicated: true }));
    const result = await call(provider);
    expect(result).toMatchObject({ ok: true, deduplicated: true });
  });
});
