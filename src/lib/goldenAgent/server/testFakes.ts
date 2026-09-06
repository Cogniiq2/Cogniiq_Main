// Golden Agent — in-memory doubles for the admin handler's two dependencies.
//
// Test-only, but a normal module so several test files share one behaviour. The fakes mirror the
// real implementations closely enough to be worth trusting:
//   * the database honours `exceptBindingId` exactly as the SQL `neq('id', …)` does, so a test can
//     detect a rotation that revokes the credential it just issued;
//   * the provider hands out monotonically increasing ids and records a call log, so a test can
//     assert that a retry did NOT create a second copy of anything;
//   * `failOnce` / `failAlways` inject the provider failures this platform must survive.

import { ElevenLabsApiError } from '../elevenlabs/client.ts';
import type { AdminDatabase, AdminProviderClient, ReceptionistRow } from './adminHandler.ts';
import type { ProviderAction } from '../elevenlabs/errors.ts';

export interface FakeBinding {
  id: string;
  receptionistId: string;
  environment: string;
  active: boolean;
  tokenHash: string;
}

export interface FakeDb {
  db: AdminDatabase;
  rows: Map<string, ReceptionistRow>;
  bindings: FakeBinding[];
  versions: unknown[];
  runs: Array<{ id: string; status: string; error?: string | null; total?: number }>;
  results: Array<{ scenarioId: string }>;
  /** Every provider_state written, in order — the checkpoint trail a retry depends on. */
  stateWrites: Array<Record<string, unknown>>;
}

export function fakeDb(): FakeDb {
  const rows = new Map<string, ReceptionistRow>();
  const bindings: FakeBinding[] = [];
  const versions: unknown[] = [];
  const runs: Array<{ id: string; status: string; error?: string | null; total?: number }> = [];
  const results: Array<{ scenarioId: string }> = [];
  const stateWrites: Array<Record<string, unknown>> = [];
  let seq = 0;
  const db: AdminDatabase = {
    async createReceptionist(row) {
      const id = `r${++seq}`;
      rows.set(id, { id, organizationId: row.organizationId, name: row.name, stage: row.stage, clientConfig: row.clientConfig, configVersion: 0, providerState: {}, providerAgentId: null, lastSyncedAt: null, lastSyncError: null });
      return { id };
    },
    async getReceptionist(id) { return rows.get(id) ?? null; },
    async updateReceptionist(id, patch) {
      const row = rows.get(id);
      if (!row) throw new Error(`unknown receptionist ${id}`);
      if (patch.providerState !== undefined) stateWrites.push(patch.providerState as unknown as Record<string, unknown>);
      rows.set(id, {
        ...row,
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.stage !== undefined ? { stage: patch.stage } : {}),
        ...(patch.clientConfig !== undefined ? { clientConfig: patch.clientConfig } : {}),
        ...(patch.configVersion !== undefined ? { configVersion: patch.configVersion } : {}),
        ...(patch.providerState !== undefined ? { providerState: patch.providerState } : {}),
        ...(patch.providerAgentId !== undefined ? { providerAgentId: patch.providerAgentId } : {}),
        ...(patch.lastSyncedAt !== undefined ? { lastSyncedAt: patch.lastSyncedAt } : {}),
        ...(patch.lastSyncError !== undefined ? { lastSyncError: patch.lastSyncError } : {}),
      });
    },
    async insertConfigVersion(row) { versions.push(row); },
    async findActiveBinding(receptionistId, environment) {
      const binding = bindings.find((b) => b.receptionistId === receptionistId && b.environment === environment && b.active);
      return binding ? { id: binding.id } : null;
    },
    async revokeBindings(receptionistId, environment, exceptBindingId) {
      for (const binding of bindings) {
        if (binding.receptionistId !== receptionistId || binding.environment !== environment) continue;
        if (exceptBindingId && binding.id === exceptBindingId) continue;
        binding.active = false;
      }
    },
    async insertBinding(row) {
      const id = `b${++seq}`;
      bindings.push({ id, receptionistId: row.receptionistId, environment: row.environment, active: true, tokenHash: row.tokenHash });
      return { id };
    },
    async insertEvaluationRun(row) { const id = `run${++seq}`; runs.push({ id, status: row.status }); return { id }; },
    async updateEvaluationRun(id, patch) {
      const run = runs.find((r) => r.id === id);
      if (!run) throw new Error(`unknown run ${id}`);
      if (patch.status) run.status = patch.status;
      if (patch.error !== undefined) run.error = patch.error;
      if (patch.total !== undefined) run.total = patch.total;
    },
    async insertEvaluationResults(list) { results.push(...list); },
    async upsertCalls() {},
  };
  return { db, rows, bindings, versions, runs, results, stateWrites };
}

export interface ProviderFailure {
  /** Which client method should fail. */
  method: keyof AdminProviderClient;
  status: number;
  action: ProviderAction;
  /** Fail only on the Nth call of that method (1-based). Omit to fail every call. */
  onCall?: number;
  body?: unknown;
}

export interface FakeProvider {
  provider: AdminProviderClient;
  /** Method names in call order. */
  log: string[];
  /** Every id the provider has ever handed out, per kind. */
  issued: { tools: string[]; documents: string[]; agents: string[]; secrets: string[]; tests: string[] };
  failures: ProviderFailure[];
  /** Result returned by getTestInvocation; a test can swap it between polls. */
  invocation: { id: string; test_runs: Array<Record<string, unknown>> };
  /** Tools currently attached to the agent, as `getAgent` reports them. */
  agentToolIds: string[];
}

/**
 * A provider whose failures are scripted. `failures` is consulted on every call, so a test can add
 * a failure, run a provisioning, remove it and run again — which is exactly the retry story.
 */
export function fakeProvider(initialFailures: ProviderFailure[] = []): FakeProvider {
  const log: string[] = [];
  const issued = { tools: [] as string[], documents: [] as string[], agents: [] as string[], secrets: [] as string[], tests: [] as string[] };
  const failures = [...initialFailures];
  const counts = new Map<string, number>();
  const toolNames = new Map<string, string>();
  const documentNames = new Map<string, string>();
  const agentNames = new Map<string, string>();
  let seq = 0;

  const state = {
    invocation: { id: 'inv_1', test_runs: [] as Array<Record<string, unknown>> },
    agentToolIds: [] as string[],
  };

  function enter(method: keyof AdminProviderClient): void {
    log.push(method);
    const count = (counts.get(method) ?? 0) + 1;
    counts.set(method, count);
    const failure = failures.find((f) => f.method === method && (f.onCall === undefined || f.onCall === count));
    if (failure) throw new ElevenLabsApiError(failure.status, `POST /fake/${method}`, failure.body ?? { detail: { message: 'fake provider failure' } }, failure.action);
  }

  const provider: AdminProviderClient = {
    createTool: async (config) => {
      enter('createTool');
      const id = `tool_${++seq}`;
      issued.tools.push(id);
      toolNames.set(id, String((config as { name?: string }).name ?? ''));
      state.agentToolIds = [...state.agentToolIds];
      return { id };
    },
    updateTool: async (id) => { enter('updateTool'); return { id }; },
    listTools: async () => {
      enter('listTools');
      return { tools: issued.tools.map((id) => ({ id, tool_config: { name: toolNames.get(id) ?? '' } })) };
    },
    createKnowledgeText: async (name) => {
      enter('createKnowledgeText');
      const id = `doc_${++seq}`;
      issued.documents.push(id);
      documentNames.set(id, name);
      return { id };
    },
    createKnowledgeUrl: async (name) => {
      enter('createKnowledgeUrl');
      const id = `doc_${++seq}`;
      issued.documents.push(id);
      documentNames.set(id, name);
      return { id };
    },
    deleteKnowledgeDocument: async (id) => {
      enter('deleteKnowledgeDocument');
      const index = issued.documents.indexOf(id);
      if (index >= 0) issued.documents.splice(index, 1);
      documentNames.delete(id);
      return {};
    },
    listKnowledgeBase: async () => {
      enter('listKnowledgeBase');
      return { documents: issued.documents.map((id) => ({ id, name: documentNames.get(id) ?? '' })) };
    },
    createAgent: async (body) => {
      enter('createAgent');
      const id = `agent_${++seq}`;
      issued.agents.push(id);
      agentNames.set(id, String((body as { name?: string }).name ?? ''));
      const prompt = ((body.conversation_config as Record<string, unknown> | undefined)?.agent as Record<string, unknown> | undefined)?.prompt as Record<string, unknown> | undefined;
      state.agentToolIds = Array.isArray(prompt?.tool_ids) ? (prompt.tool_ids as string[]) : [];
      return { agent_id: id };
    },
    updateAgent: async (agentId, body) => {
      enter('updateAgent');
      const prompt = ((body.conversation_config as Record<string, unknown> | undefined)?.agent as Record<string, unknown> | undefined)?.prompt as Record<string, unknown> | undefined;
      state.agentToolIds = Array.isArray(prompt?.tool_ids) ? (prompt.tool_ids as string[]) : state.agentToolIds;
      agentNames.set(agentId, String((body as { name?: string }).name ?? agentNames.get(agentId) ?? ''));
      return {};
    },
    listAgents: async () => {
      enter('listAgents');
      return { agents: issued.agents.map((id) => ({ agent_id: id, name: agentNames.get(id) ?? '' })) };
    },
    getAgent: async (agentId) => {
      enter('getAgent');
      return { agent_id: agentId, name: agentNames.get(agentId) ?? '', conversation_config: { agent: { prompt: { tool_ids: [...state.agentToolIds] } } }, phone_numbers: [] };
    },
    createSecret: async () => {
      enter('createSecret');
      const id = `sec_${++seq}`;
      issued.secrets.push(id);
      return { secret_id: id };
    },
    deleteSecret: async (secretId) => {
      enter('deleteSecret');
      const index = issued.secrets.indexOf(secretId);
      if (index >= 0) issued.secrets.splice(index, 1);
      return {};
    },
    listConversations: async () => { enter('listConversations'); return { conversations: [] }; },
    createTest: async () => { enter('createTest'); const id = `test_${++seq}`; issued.tests.push(id); return { id }; },
    deleteTest: async (id) => {
      enter('deleteTest');
      const index = issued.tests.indexOf(id);
      if (index >= 0) issued.tests.splice(index, 1);
      return {};
    },
    runTests: async () => { enter('runTests'); return state.invocation; },
    getTestInvocation: async () => { enter('getTestInvocation'); return state.invocation; },
  };

  return {
    provider, log, issued, failures,
    get invocation() { return state.invocation; },
    set invocation(value: { id: string; test_runs: Array<Record<string, unknown>> }) { state.invocation = value; },
    get agentToolIds() { return state.agentToolIds; },
    set agentToolIds(value: string[]) { state.agentToolIds = value; },
  };
}

/** Counts how often a method appears in the provider call log. */
export function countCalls(log: string[], method: string): number {
  return log.filter((entry) => entry === method).length;
}
