// Golden Agent — post-call webhook hardening.
//
// This endpoint is unauthenticated by JWT on purpose: the caller is the ElevenLabs platform, and
// the HMAC signature is the credential. Everything below is a property that must hold for an
// endpoint anyone on the internet can POST to.

import { describe, expect, it } from 'vitest';

import { handlePostCallRequest, parseSignatureHeader, verifyElevenLabsSignature } from './postCallHandler.ts';
import type { PostCallDependencies } from './postCallHandler.ts';
import { hmacSha256Hex } from './shared.ts';

const SECRET = 'whsec_test_secret';
const NOW_SECONDS = 1_800_000_000;

interface Recorded {
  calls: Array<Record<string, unknown>>;
  events: Array<Record<string, unknown>>;
  deletes: Array<[string, string]>;
  deps: PostCallDependencies;
}

function recorder(overrides: Partial<PostCallDependencies> = {}): Recorded {
  const calls: Array<Record<string, unknown>> = [];
  const events: Array<Record<string, unknown>> = [];
  const deletes: Array<[string, string]> = [];
  const deps: PostCallDependencies = {
    webhookSecret: SECRET,
    findReceptionistByAgentId: async (agentId) => (agentId === 'agent_managed' ? { id: 'r1', organizationId: 'org_1', stage: 'dev' } : null),
    upsertCall: async (call) => { calls.push(call as unknown as Record<string, unknown>); },
    recordEvents: async (rows) => { events.push(...(rows as unknown as Array<Record<string, unknown>>)); },
    deletePriorEvents: async (receptionistId, conversationId) => { deletes.push([receptionistId, conversationId]); },
    now: () => NOW_SECONDS * 1000,
    ...overrides,
  };
  return { calls, events, deletes, deps };
}

const PAYLOAD = {
  type: 'post_call_transcription',
  data: {
    agent_id: 'agent_managed', conversation_id: 'conv_42', status: 'done',
    metadata: { start_time_unix_secs: NOW_SECONDS - 300, call_duration_secs: 91.6, termination_reason: 'end_call' },
    analysis: { transcript_summary: 'Frau Anna Schmidt, 0151 12345678, hat gebucht.', call_successful: 'success' },
    transcript: [
      { role: 'agent', message: 'Guten Tag' },
      { role: 'user', message: 'Ich hätte gern einen Termin' },
      {
        role: 'agent', message: 'Einen Moment',
        tool_calls: [{ tool_name: 'create_appointment__00000000', params_as_json: '{}' }],
        tool_results: [{ tool_name: 'create_appointment__00000000', is_error: false, result_value: '{"ok":true,"data":{"status":"booked","appointment":{"appointment_id":"a1","start_time":"2026-09-08T09:00","end_time":"2026-09-08T09:30","location_id":"z","service_id":"s","status":"booked"}}}' }],
      },
    ],
  },
};

async function signedRequest(payload: unknown, at = NOW_SECONDS, secret = SECRET): Promise<Request> {
  const body = JSON.stringify(payload);
  const signature = await hmacSha256Hex(secret, `${at}.${body}`);
  return new Request('https://x/receptionist-postcall', { method: 'POST', headers: { 'ElevenLabs-Signature': `t=${at},v0=${signature}` }, body });
}

describe('post-call signature verification', () => {
  it('parses the header on the first "=" so a padded value is not silently dropped', () => {
    expect(parseSignatureHeader('t=100,v0=abc')).toEqual({ timestamp: '100', signature: 'abc' });
    expect(parseSignatureHeader('t=100,v0=ab=cd')).toEqual({ timestamp: '100', signature: 'ab=cd' });
    expect(parseSignatureHeader('v0=abc')).toBeNull();
    expect(parseSignatureHeader('garbage')).toBeNull();
    expect(parseSignatureHeader(null)).toBeNull();
  });

  it('rejects malformed, wrong-secret, stale and future-dated signatures', async () => {
    const body = '{"a":1}';
    const good = await hmacSha256Hex(SECRET, `${NOW_SECONDS}.${body}`);
    expect(await verifyElevenLabsSignature(SECRET, `t=${NOW_SECONDS},v0=${good}`, body, NOW_SECONDS)).toBe(true);
    // Uppercase hex from the provider is still the same signature.
    expect(await verifyElevenLabsSignature(SECRET, `t=${NOW_SECONDS},v0=${good.toUpperCase()}`, body, NOW_SECONDS)).toBe(true);

    // Malformed: not 64 hex characters.
    expect(await verifyElevenLabsSignature(SECRET, `t=${NOW_SECONDS},v0=deadbeef`, body, NOW_SECONDS)).toBe(false);
    expect(await verifyElevenLabsSignature(SECRET, `t=${NOW_SECONDS},v0=${'z'.repeat(64)}`, body, NOW_SECONDS)).toBe(false);
    // Wrong secret.
    const wrong = await hmacSha256Hex('another_secret', `${NOW_SECONDS}.${body}`);
    expect(await verifyElevenLabsSignature(SECRET, `t=${NOW_SECONDS},v0=${wrong}`, body, NOW_SECONDS)).toBe(false);
    // Tampered body with a valid-for-the-old-body signature.
    expect(await verifyElevenLabsSignature(SECRET, `t=${NOW_SECONDS},v0=${good}`, '{"a":2}', NOW_SECONDS)).toBe(false);
    // Stale and future-dated timestamps are both outside the window.
    expect(await verifyElevenLabsSignature(SECRET, `t=${NOW_SECONDS},v0=${good}`, body, NOW_SECONDS + 3601)).toBe(false);
    expect(await verifyElevenLabsSignature(SECRET, `t=${NOW_SECONDS},v0=${good}`, body, NOW_SECONDS - 3601)).toBe(false);
    // A non-numeric timestamp cannot be coerced into the window.
    expect(await verifyElevenLabsSignature(SECRET, `t=abc,v0=${good}`, body, NOW_SECONDS)).toBe(false);
    // An unconfigured secret never verifies anything, whatever the signature looks like.
    expect(await verifyElevenLabsSignature('', `t=${NOW_SECONDS},v0=${good}`, body, NOW_SECONDS)).toBe(false);
  });

  it('refuses the request entirely when the server has no webhook secret configured', async () => {
    const { deps, calls } = recorder({ webhookSecret: '' });
    const response = await handlePostCallRequest(await signedRequest(PAYLOAD), deps);
    expect(response.status).toBe(500);
    expect(calls).toHaveLength(0);
  });

  it('rejects a replayed delivery whose timestamp has aged out', async () => {
    const { deps, calls } = recorder();
    const old = await signedRequest(PAYLOAD, NOW_SECONDS - 4000);
    const response = await handlePostCallRequest(old, deps);
    expect(response.status).toBe(401);
    expect(calls).toHaveLength(0);
  });
});

describe('post-call storage', () => {
  it('stores outcomes for a managed agent and nothing at all for an unknown one', async () => {
    const { deps, calls, events } = recorder();
    const foreign = { ...PAYLOAD, data: { ...PAYLOAD.data, agent_id: 'agent_someone_else' } };
    const ignored = await handlePostCallRequest(await signedRequest(foreign), deps);
    expect(ignored.status).toBe(200);
    expect((await ignored.json()).ignored).toBe('unknown agent');
    expect(calls).toHaveLength(0);
    expect(events).toHaveLength(0);

    const response = await handlePostCallRequest(await signedRequest(PAYLOAD), deps);
    expect(response.status).toBe(200);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ receptionistId: 'r1', organizationId: 'org_1', conversationId: 'conv_42', environment: 'dev', outcome: 'booked', toolCallCount: 1, toolErrorCount: 0 });
  });

  it('is idempotent across a redelivery: one call row, one post-call event, scoped deletes', async () => {
    const { deps, calls, events, deletes } = recorder();
    await handlePostCallRequest(await signedRequest(PAYLOAD), deps);
    await handlePostCallRequest(await signedRequest(PAYLOAD), deps);

    // Two upserts of the same (receptionist, conversation) — the unique index collapses them.
    expect(calls.map((c) => c.conversationId)).toEqual(['conv_42', 'conv_42']);
    // The prior events are cleared before each write, always scoped to this conversation.
    expect(deletes).toEqual([['r1', 'conv_42'], ['r1', 'conv_42']]);
    // Only the post-call summary event is written; live tool_call rows are never re-derived.
    expect(events.every((e) => e.eventType === 'post_call')).toBe(true);
    expect(events).toHaveLength(2);
  });

  it('keeps the full transcript out of storage and scrubs personal data from the summary', async () => {
    const { deps, calls, events } = recorder();
    await handlePostCallRequest(await signedRequest(PAYLOAD), deps);
    const stored = JSON.stringify({ calls, events });
    // The turns themselves are never persisted.
    expect(stored).not.toContain('Ich hätte gern einen Termin');
    expect(stored).not.toContain('Guten Tag');
    // The provider summary — free text that routinely names the caller — never reaches the event
    // table, which has no retention of its own. It lives only on the call row.
    expect(JSON.stringify(events)).not.toContain('0151 12345678');
    expect(JSON.stringify(events)).not.toContain('Anna Schmidt');
    expect(String(events[0].detail)).toContain('outcome=booked');
    expect(calls[0].summary).toContain('Anna Schmidt');
  });

  it('acknowledges other webhook types and rejects structurally broken payloads', async () => {
    const { deps, calls } = recorder();
    const other = await handlePostCallRequest(await signedRequest({ type: 'post_call_audio', data: {} }), deps);
    expect(other.status).toBe(200);
    expect((await other.json()).ignored).toBe('post_call_audio');

    const noIds = await handlePostCallRequest(await signedRequest({ type: 'post_call_transcription', data: { agent_id: '' } }), deps);
    expect(noIds.status).toBe(400);

    const notAnObject = await handlePostCallRequest(await signedRequest([1, 2, 3]), deps);
    expect(notAnObject.status).toBe(400);
    expect(calls).toHaveLength(0);
  });

  it('rejects a body that is not JSON even when the signature over it is valid', async () => {
    const { deps } = recorder();
    const body = 'not json at all';
    const signature = await hmacSha256Hex(SECRET, `${NOW_SECONDS}.${body}`);
    const request = new Request('https://x/receptionist-postcall', { method: 'POST', headers: { 'ElevenLabs-Signature': `t=${NOW_SECONDS},v0=${signature}` }, body });
    expect((await handlePostCallRequest(request, deps)).status).toBe(400);
  });

  it('only accepts POST', async () => {
    const { deps } = recorder();
    const response = await handlePostCallRequest(new Request('https://x/receptionist-postcall', { method: 'GET' }), deps);
    expect(response.status).toBe(405);
  });
});
