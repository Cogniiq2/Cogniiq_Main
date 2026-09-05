import { describe, expect, it } from 'vitest';

import { handleToolsRequest } from './toolsHandler.ts';
import type { CallEventRecord, ToolsHandlerDependencies } from './toolsHandler.ts';
import { handlePostCallRequest, verifyElevenLabsSignature } from './postCallHandler.ts';
import type { PostCallDependencies } from './postCallHandler.ts';
import { handleAdminAction } from './adminHandler.ts';
import type { AdminDatabase, AdminDependencies, AdminProviderClient, ReceptionistRow } from './adminHandler.ts';
import { hmacSha256Hex, sha256Hex } from './shared.ts';
import { testClinicConfig, TEST_CLINIC_CLIENT_ID, TOOL_NAMES } from '../index.ts';

const TOKEN = 'cqr_test_token';

function toolsDeps(overrides: Partial<ToolsHandlerDependencies> = {}) {
  const events: CallEventRecord[] = [];
  const deps: ToolsHandlerDependencies = {
    async findBindingByTokenHash(hash) {
      return hash === await sha256Hex(TOKEN) ? { bindingId: 'b1', receptionistId: 'r1', organizationId: TEST_CLINIC_CLIENT_ID, environment: 'dev' } : null;
    },
    async loadReceptionist(id) {
      return id === 'r1' ? { id: 'r1', organizationId: TEST_CLINIC_CLIENT_ID, stage: 'dev', clientConfig: testClinicConfig({ stage: 'dev' }) } : null;
    },
    async recordEvent(event) { events.push(event); },
    resolveSecret: () => undefined,
    mockProviders: new Map(),
    now: () => new Date('2026-09-07T10:00:00+02:00'),
    ...overrides,
  };
  return { deps, events };
}

function toolRequest(tool: string, body: unknown, token = TOKEN, conversation = 'conv_1') {
  return new Request(`https://x.supabase.co/functions/v1/receptionist-tools/${tool}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-Cogniiq-Conversation': conversation },
    body: JSON.stringify(body),
  });
}

describe('receptionist-tools handler', () => {
  it('rejects missing and unknown tokens without leaking anything', async () => {
    const { deps, events } = toolsDeps();
    const missing = await handleToolsRequest(new Request('https://x/receptionist-tools/get_opening_hours', { method: 'POST' }), deps);
    expect(missing.status).toBe(401);
    const wrong = await handleToolsRequest(toolRequest('get_opening_hours', {}, 'nope'), deps);
    expect(wrong.status).toBe(401);
    expect(await wrong.json()).toEqual({ ok: false, code: 'unauthorized', message: 'invalid token' });
    expect(events).toHaveLength(0);
  });

  it('refuses a dev binding on a live receptionist', async () => {
    const { deps, events } = toolsDeps({ loadReceptionist: async () => ({ id: 'r1', organizationId: TEST_CLINIC_CLIENT_ID, stage: 'live', clientConfig: testClinicConfig() }) });
    const response = await handleToolsRequest(toolRequest('get_opening_hours', {}), deps);
    expect(response.status).toBe(401);
    expect(events[0].eventType).toBe('auth_failure');
  });

  it('binds the tenant server-side, executes the tool and records a PII-free event', async () => {
    const { deps, events } = toolsDeps();
    const response = await handleToolsRequest(toolRequest('get_available_slots', { service_id: 'erstgespraech', location_id: 'zentrum', from_date: '2026-09-08', client_id: 'attacker' }), deps);
    expect(response.status).toBe(200);
    const body = await response.json();
    // client_id is not a contract parameter: the LLM cannot pick the tenant.
    expect(body.ok).toBe(false);
    expect(body.code).toBe('invalid_arguments');
    const ok = await handleToolsRequest(toolRequest('get_available_slots', { service_id: 'erstgespraech', location_id: 'zentrum', from_date: '2026-09-08' }), deps);
    const slots = await ok.json();
    expect(slots.ok).toBe(true);
    expect(slots.data.slots.length).toBeGreaterThan(0);
    expect(events.map((e) => e.toolName)).toEqual(['get_available_slots', 'get_available_slots']);
    expect(JSON.stringify(events)).not.toContain('attacker');
  });

  it('keeps mock state and idempotency across calls of one receptionist', async () => {
    const { deps } = toolsDeps();
    const slots = await (await handleToolsRequest(toolRequest('get_available_slots', { service_id: 'erstgespraech', location_id: 'zentrum', from_date: '2026-09-08' }), deps)).json();
    const slot = slots.data.slots[0];
    const args = { slot_id: slot.slot_id, service_id: 'erstgespraech', location_id: 'zentrum', start_time: slot.start_time, caller_confirmed: true, caller_first_name: 'Ben', caller_last_name: 'Keller', caller_date_of_birth: '1992-11-02', caller_phone: '+4917612345679' };
    const first = await (await handleToolsRequest(toolRequest('create_appointment', args), deps)).json();
    const second = await (await handleToolsRequest(toolRequest('create_appointment', args), deps)).json();
    expect(first.ok).toBe(true);
    expect(second.ok && second.deduplicated).toBe(true);
    const again = await (await handleToolsRequest(toolRequest('get_available_slots', { service_id: 'erstgespraech', location_id: 'zentrum', from_date: '2026-09-08' }), deps)).json();
    expect(again.data.slots.some((s: { slot_id: string }) => s.slot_id === slot.slot_id)).toBe(false);
  });
});

describe('receptionist-postcall handler', () => {
  const secret = 'whsec_test';
  async function signed(payload: unknown, at = 1_800_000_000) {
    const body = JSON.stringify(payload);
    const signature = await hmacSha256Hex(secret, `${at}.${body}`);
    return new Request('https://x/receptionist-postcall', { method: 'POST', headers: { 'ElevenLabs-Signature': `t=${at},v0=${signature}` }, body });
  }

  it('verifies signatures including replay tolerance', async () => {
    expect(await verifyElevenLabsSignature(secret, 't=100,v0=abc', '{}', 100)).toBe(false);
    const good = await hmacSha256Hex(secret, '100.{}');
    expect(await verifyElevenLabsSignature(secret, `t=100,v0=${good}`, '{}', 100)).toBe(true);
    expect(await verifyElevenLabsSignature(secret, `t=100,v0=${good}`, '{}', 100 + 3600)).toBe(false);
  });

  it('stores outcomes and PII-free events for known agents only', async () => {
    const calls: unknown[] = [];
    const events: unknown[] = [];
    const deps: PostCallDependencies = {
      webhookSecret: secret,
      findReceptionistByAgentId: async (agentId) => (agentId === 'agent_1' ? { id: 'r1', organizationId: 'org', stage: 'dev' } : null),
      upsertCall: async (call) => { calls.push(call); },
      recordEvents: async (rows) => { events.push(...rows); },
      now: () => 1_800_000_000 * 1000,
    };
    const unknown = await handlePostCallRequest(await signed({ type: 'post_call_transcription', data: { agent_id: 'other', conversation_id: 'c' } }), deps);
    expect((await unknown.json()).ignored).toBe('unknown agent');
    const payload = {
      type: 'post_call_transcription',
      data: {
        agent_id: 'agent_1', conversation_id: 'conv_9', status: 'done',
        metadata: { start_time_unix_secs: 1_799_999_000, call_duration_secs: 120.4, termination_reason: 'end_call' },
        analysis: { transcript_summary: 'Anna Schmidt +4915112345678 hat gebucht', call_successful: 'success' },
        transcript: [
          { role: 'agent', message: 'Guten Tag' },
          { role: 'user', message: 'Termin' },
          { role: 'agent', message: 'Moment', tool_calls: [{ tool_name: 'create_appointment__00000000', params_as_json: '{}' }], tool_results: [{ tool_name: 'create_appointment__00000000', result_value: '{"ok":true,"data":{"status":"booked","appointment":{"appointment_id":"a","start_time":"2026-09-08T09:00","end_time":"2026-09-08T09:30","location_id":"z","service_id":"s","status":"booked"}}}', is_error: false }] },
        ],
      },
    };
    const response = await handlePostCallRequest(await signed(payload), deps);
    expect(response.status).toBe(200);
    const call = calls[0] as { outcome: string; durationSecs: number; toolCallCount: number };
    expect(call.outcome).toBe('booked');
    expect(call.durationSecs).toBe(120);
    expect(call.toolCallCount).toBe(1);
    expect(JSON.stringify(events)).not.toContain('+4915112345678');
    const tampered = await handlePostCallRequest(new Request('https://x/receptionist-postcall', { method: 'POST', headers: { 'ElevenLabs-Signature': 't=1800000000,v0=deadbeef' }, body: JSON.stringify(payload) }), deps);
    expect(tampered.status).toBe(401);
  });
});

describe('receptionist-admin handler', () => {
  function fakeDb() {
    const rows = new Map<string, ReceptionistRow>();
    const bindings: Array<{ id: string; receptionistId: string; environment: string; active: boolean; tokenHash: string }> = [];
    const versions: unknown[] = [];
    const runs: Array<{ id: string; status: string }> = [];
    const results: unknown[] = [];
    let seq = 0;
    const db: AdminDatabase = {
      async createReceptionist(row) { const id = `r${++seq}`; rows.set(id, { id, organizationId: row.organizationId, name: row.name, stage: row.stage, clientConfig: row.clientConfig, configVersion: 0, providerState: {}, providerAgentId: null }); return { id }; },
      async getReceptionist(id) { return rows.get(id) ?? null; },
      async updateReceptionist(id, patch) {
        const row = rows.get(id)!;
        rows.set(id, { ...row, ...(patch.name !== undefined ? { name: patch.name } : {}), ...(patch.stage !== undefined ? { stage: patch.stage } : {}), ...(patch.clientConfig !== undefined ? { clientConfig: patch.clientConfig } : {}), ...(patch.configVersion !== undefined ? { configVersion: patch.configVersion } : {}), ...(patch.providerState !== undefined ? { providerState: patch.providerState } : {}), ...(patch.providerAgentId !== undefined ? { providerAgentId: patch.providerAgentId } : {}) });
      },
      async insertConfigVersion(row) { versions.push(row); },
      async findActiveBinding(receptionistId, environment) { const b = bindings.find((x) => x.receptionistId === receptionistId && x.environment === environment && x.active); return b ? { id: b.id } : null; },
      async revokeBindings(receptionistId, environment) { for (const b of bindings) if (b.receptionistId === receptionistId && b.environment === environment) b.active = false; },
      async insertBinding(row) { const id = `b${++seq}`; bindings.push({ id, receptionistId: row.receptionistId, environment: row.environment, active: true, tokenHash: row.tokenHash }); return { id }; },
      async insertEvaluationRun(row) { const id = `run${++seq}`; runs.push({ id, status: row.status }); return { id }; },
      async updateEvaluationRun(id, patch) { const run = runs.find((r) => r.id === id)!; if (patch.status) run.status = patch.status; },
      async insertEvaluationResults(list) { results.push(...list); },
      async upsertCalls() {},
    };
    return { db, rows, bindings, versions, runs, results };
  }

  function fakeProvider() {
    const log: string[] = [];
    const toolIds: string[] = [];
    let seq = 0;
    const provider: AdminProviderClient = {
      createTool: async () => { log.push('createTool'); const id = `tool_${++seq}`; toolIds.push(id); return { id }; },
      updateTool: async (id) => { log.push('updateTool'); return { id }; },
      createKnowledgeText: async () => { log.push('createKnowledgeText'); return { id: `doc_${++seq}` }; },
      deleteKnowledgeDocument: async () => ({}),
      createKnowledgeUrl: async () => ({ id: `doc_${++seq}` }),
      createAgent: async () => { log.push('createAgent'); return { agent_id: 'agent_dev_1' }; },
      updateAgent: async () => { log.push('updateAgent'); return {}; },
      getAgent: async () => ({ agent_id: 'agent_dev_1', name: 'x', conversation_config: { agent: { prompt: { tool_ids: [...toolIds] } } }, phone_numbers: [] }),
      createSecret: async () => { log.push('createSecret'); return { secret_id: `sec_${++seq}` }; },
      listConversations: async () => ({ conversations: [] }),
      createTest: async () => ({ id: `test_${++seq}` }),
      deleteTest: async () => ({}),
      runTests: async () => ({ id: 'inv_1', test_runs: [] }),
      getTestInvocation: async () => ({ id: 'inv_1', test_runs: [] }),
    };
    return { provider, log };
  }

  it('creates, configures, provisions, evaluates and protects live agents', async () => {
    const { db, rows, bindings, versions, runs, results } = fakeDb();
    const { provider, log } = fakeProvider();
    const deps: AdminDependencies = { db, provider: () => provider, toolsEndpointUrl: 'https://x.supabase.co/functions/v1/receptionist-tools', actorId: 'user_1' };

    const created = await (await handleAdminAction({ action: 'create', organizationId: TEST_CLINIC_CLIENT_ID, name: 'Praxis Musterstadt' }, deps)).json();
    expect(created.ok).toBe(true);
    expect(created.gaps.some((g: { severity: string }) => g.severity === 'blocker')).toBe(true);

    const invalid = await handleAdminAction({ action: 'save_config', receptionistId: created.receptionistId, clientConfig: { schemaVersion: 1 } }, deps);
    expect(invalid.status).toBe(422);
    const saved = await (await handleAdminAction({ action: 'save_config', receptionistId: created.receptionistId, clientConfig: testClinicConfig({ stage: 'dev' }), note: 'initial' }, deps)).json();
    expect(saved.configVersion).toBe(1);
    expect(versions).toHaveLength(1);

    const provisioned = await (await handleAdminAction({ action: 'provision', receptionistId: created.receptionistId }, deps)).json();
    expect(provisioned.ok).toBe(true);
    expect(provisioned.agentId).toBe('agent_dev_1');
    expect(provisioned.newToolToken).toMatch(/^cqr_/);
    expect(bindings.filter((b) => b.active)).toHaveLength(1);
    expect(log.filter((l) => l === 'createTool')).toHaveLength(TOOL_NAMES.length);
    expect(log.filter((l) => l === 'createAgent')).toHaveLength(1);
    const row = rows.get(created.receptionistId)!;
    expect(row.providerAgentId).toBe('agent_dev_1');
    expect((row.providerState as { toolSecretIds: Record<string, string> }).toolSecretIds.dev).toMatch(/^sec_/);

    // Second provision: no new token, tools updated not created, agent updated only if changed.
    const again = await (await handleAdminAction({ action: 'provision', receptionistId: created.receptionistId }, deps)).json();
    expect(again.newToolToken).toBeNull();
    expect(log.filter((l) => l === 'createTool')).toHaveLength(TOOL_NAMES.length);
    expect(log.filter((l) => l === 'updateTool')).toHaveLength(TOOL_NAMES.length);

    const status = await (await handleAdminAction({ action: 'status', receptionistId: created.receptionistId }, deps)).json();
    expect(status.provisioned).toBe(true);
    expect(status.toolDrift).toEqual([]);

    const evaluation = await (await handleAdminAction({ action: 'run_offline_evaluation', receptionistId: created.receptionistId }, deps)).json();
    expect(evaluation.ok).toBe(true);
    expect(evaluation.summary.failed).toBe(0);
    expect(runs[0].status).toBe('completed');
    expect(results.length).toBe(evaluation.summary.total);

    const tests = await (await handleAdminAction({ action: 'create_simulation_tests', receptionistId: created.receptionistId }, deps)).json();
    expect(tests.tests).toBe(evaluation.summary.total);

    // Going live requires blockers cleared and an agent; then changes need explicit approval.
    const live = await handleAdminAction({ action: 'set_stage', receptionistId: created.receptionistId, stage: 'live' }, deps);
    expect(live.status).toBe(422); // Test Clinic still uses the mock provider → not allowed live
    rows.set(created.receptionistId, { ...rows.get(created.receptionistId)!, stage: 'live' });
    const blocked = await handleAdminAction({ action: 'provision', receptionistId: created.receptionistId }, deps);
    expect(blocked.status).toBe(409);
  }, 60_000);
});
