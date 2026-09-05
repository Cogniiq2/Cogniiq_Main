// Golden Agent — receptionist-admin request handler.
//
// Owner/admin-only operations that need server-side secrets (the ElevenLabs API key) or must
// enforce invariants the browser cannot be trusted with (config validation + versioning, token
// generation, live-agent protection). The Deno shell verifies the caller's JWT and platform role
// and hands the request here; every database access below runs as service_role, so this module
// re-checks that the receptionist belongs to the organization named in the request.
//
// Actions (body.action):
//   create                    { organizationId, name, timezone? }
//   save_config               { receptionistId, clientConfig, note? }
//   set_stage                 { receptionistId, stage }
//   plan                      { receptionistId, stage? }
//   provision                 { receptionistId, stage?, allowLiveChanges? }
//   status                    { receptionistId }
//   rotate_token              { receptionistId }
//   sync_calls                { receptionistId }
//   run_offline_evaluation    { receptionistId }
//   create_simulation_tests   { receptionistId }
//   run_simulation_tests      { receptionistId }
//   fetch_simulation_results  { receptionistId, runId }

import { assertClientConfig, createDefaultClientConfig, validateClientConfig } from '../clientConfig.ts';
import type { ClientConfig, DeploymentStage } from '../clientConfig.ts';
import { applyGoldenAgentPlan, emptyProvisionedState, planGoldenAgent } from '../agentFactory.ts';
import type { FactoryClient, ProvisionedState } from '../agentFactory.ts';
import { extractManagedSnapshot } from '../elevenlabs/mapping.ts';
import { findKnowledgeGaps } from '../knowledge.ts';
import { compileSimulationTest, normaliseElevenLabsTranscript } from '../evaluation/elevenlabsEvaluation.ts';
import { generateCustomerScenarios } from '../evaluation/customerScenarios.ts';
import { runReferenceConversation } from '../evaluation/referencePolicy.ts';
import { evaluateTranscript, summarize } from '../evaluation/runner.ts';
import type { ScenarioResult } from '../evaluation/types.ts';
import { generateToken, isRecord, jsonResponse, sha256Hex } from './shared.ts';

export interface ReceptionistRow {
  id: string;
  organizationId: string;
  name: string;
  stage: DeploymentStage;
  clientConfig: unknown;
  configVersion: number;
  providerState: unknown;
  providerAgentId: string | null;
}

export interface AdminDatabase {
  createReceptionist(row: { organizationId: string; name: string; stage: DeploymentStage; clientConfig: ClientConfig; createdBy: string }): Promise<{ id: string }>;
  getReceptionist(id: string): Promise<ReceptionistRow | null>;
  updateReceptionist(id: string, patch: Partial<{ name: string; stage: DeploymentStage; clientConfig: ClientConfig; configVersion: number; providerState: ProvisionedState & Record<string, unknown>; providerAgentId: string | null; promptVersion: string | null; lastSyncedAt: string | null; lastSyncError: string | null }>): Promise<void>;
  insertConfigVersion(row: { receptionistId: string; organizationId: string; version: number; clientConfig: ClientConfig; note?: string; createdBy: string }): Promise<void>;
  findActiveBinding(receptionistId: string, environment: 'dev' | 'staging' | 'live'): Promise<{ id: string } | null>;
  revokeBindings(receptionistId: string, environment: 'dev' | 'staging' | 'live'): Promise<void>;
  insertBinding(row: { receptionistId: string; organizationId: string; environment: 'dev' | 'staging' | 'live'; tokenHash: string; label: string }): Promise<{ id: string }>;
  insertEvaluationRun(row: { receptionistId: string; organizationId: string; mode: 'offline_reference' | 'elevenlabs_simulation' | 'conversation_replay'; status: string; configVersion: number; promptVersion: string | null; providerInvocationId?: string; createdBy: string }): Promise<{ id: string }>;
  updateEvaluationRun(id: string, patch: Partial<{ status: string; total: number; passed: number; failed: number; summary: Record<string, unknown>; error: string | null; startedAt: string; finishedAt: string }>): Promise<void>;
  insertEvaluationResults(rows: Array<{ runId: string; receptionistId: string; organizationId: string; scenarioId: string; category: string; title: string; passed: boolean; outcome: string; scores: unknown[]; findings: unknown[]; transcript: Record<string, unknown> }>): Promise<void>;
  upsertCalls(rows: Array<{ receptionistId: string; organizationId: string; conversationId: string; environment: 'dev' | 'staging' | 'live'; startedAt?: string; durationSecs?: number; status: 'in_progress' | 'done' | 'failed' | 'unknown'; analysis: Record<string, unknown> }>): Promise<void>;
}

export interface AdminProviderClient extends FactoryClient {
  createSecret(name: string, value: string): Promise<{ secret_id: string }>;
  getAgent(agentId: string): Promise<{ agent_id: string; name?: string; tags?: string[]; conversation_config: Record<string, unknown>; phone_numbers?: Array<{ phone_number: string }>; metadata?: { updated_at_unix_secs?: number } }>;
  listConversations(params: { agentId: string; pageSize?: number }): Promise<{ conversations: Array<{ conversation_id: string; start_time_unix_secs: number; call_duration_secs: number; status: string; call_successful?: string }> }>;
  createTest(body: Record<string, unknown>): Promise<{ id: string }>;
  deleteTest(testId: string): Promise<unknown>;
  runTests(agentId: string, testIds: string[]): Promise<{ id: string; test_runs: Array<Record<string, unknown>> }>;
  getTestInvocation(invocationId: string): Promise<{ id: string; test_runs: Array<Record<string, unknown>> }>;
}

export interface AdminDependencies {
  db: AdminDatabase;
  provider: () => AdminProviderClient;
  toolsEndpointUrl: string;
  actorId: string;
  /** Organizations the caller may operate on; platform admins pass '*'. */
  now?: () => Date;
}

export class AdminError extends Error {
  constructor(readonly status: number, message: string, readonly details?: unknown) {
    super(message);
    this.name = 'AdminError';
  }
}

function environmentOf(stage: DeploymentStage): 'dev' | 'staging' | 'live' {
  return stage === 'live' ? 'live' : stage === 'staging' ? 'staging' : 'dev';
}

function stateOf(row: ReceptionistRow): ProvisionedState & Record<string, unknown> {
  const raw = isRecord(row.providerState) ? row.providerState : {};
  return { ...emptyProvisionedState(), ...raw, toolIds: isRecord(raw.toolIds) ? (raw.toolIds as ProvisionedState['toolIds']) : {}, knowledgeDocumentIds: isRecord(raw.knowledgeDocumentIds) ? (raw.knowledgeDocumentIds as Record<string, string>) : {}, knowledgeSourceIds: isRecord(raw.knowledgeSourceIds) ? (raw.knowledgeSourceIds as Record<string, string>) : {} };
}

async function loadOrThrow(deps: AdminDependencies, receptionistId: unknown): Promise<ReceptionistRow> {
  if (typeof receptionistId !== 'string' || !receptionistId) throw new AdminError(400, 'receptionistId is required');
  const row = await deps.db.getReceptionist(receptionistId);
  if (!row) throw new AdminError(404, 'receptionist not found');
  return row;
}

async function ensureBinding(deps: AdminDependencies, row: ReceptionistRow, state: ProvisionedState & Record<string, unknown>, rotate: boolean): Promise<{ secretId: string; token?: string; state: ProvisionedState & Record<string, unknown> }> {
  const environment = environmentOf(row.stage);
  const existing = await deps.db.findActiveBinding(row.id, environment);
  const secretIds = isRecord(state.toolSecretIds) ? (state.toolSecretIds as Record<string, string>) : {};
  if (existing && secretIds[environment] && !rotate) return { secretId: secretIds[environment], state };
  if (existing || rotate) await deps.db.revokeBindings(row.id, environment);
  const token = generateToken();
  await deps.db.insertBinding({ receptionistId: row.id, organizationId: row.organizationId, environment, tokenHash: await sha256Hex(token), label: `${environment} · ${new Date().toISOString().slice(0, 10)}` });
  const secret = await deps.provider().createSecret(`cogniiq-receptionist-${row.id.slice(0, 8)}-${environment}-${Date.now().toString(36)}`, token);
  const nextState = { ...state, toolSecretIds: { ...secretIds, [environment]: secret.secret_id } };
  await deps.db.updateReceptionist(row.id, { providerState: nextState });
  return { secretId: secret.secret_id, token, state: nextState };
}

export async function handleAdminAction(body: unknown, deps: AdminDependencies): Promise<Response> {
  try {
    if (!isRecord(body) || typeof body.action !== 'string') throw new AdminError(400, 'action is required');
    switch (body.action) {
      case 'create': {
        if (typeof body.organizationId !== 'string' || typeof body.name !== 'string' || !body.name.trim()) throw new AdminError(400, 'organizationId and name are required');
        const config = createDefaultClientConfig({ clientId: body.organizationId, companyName: body.name.trim(), timezone: typeof body.timezone === 'string' ? body.timezone : undefined });
        const created = await deps.db.createReceptionist({ organizationId: body.organizationId, name: body.name.trim(), stage: 'dev', clientConfig: config, createdBy: deps.actorId });
        return jsonResponse({ ok: true, receptionistId: created.id, gaps: findKnowledgeGaps(config) });
      }
      case 'save_config': {
        const row = await loadOrThrow(deps, body.receptionistId);
        const { issues, config } = validateClientConfig(body.clientConfig);
        if (!config) return jsonResponse({ ok: false, error: 'invalid config', issues }, 422);
        if (config.clientId !== row.organizationId) throw new AdminError(422, 'clientConfig.clientId must equal the receptionist organization');
        const version = row.configVersion + 1;
        await deps.db.updateReceptionist(row.id, { clientConfig: config, configVersion: version, stage: config.stage, name: row.name });
        await deps.db.insertConfigVersion({ receptionistId: row.id, organizationId: row.organizationId, version, clientConfig: config, note: typeof body.note === 'string' ? body.note : undefined, createdBy: deps.actorId });
        return jsonResponse({ ok: true, configVersion: version, issues, gaps: findKnowledgeGaps(config) });
      }
      case 'set_stage': {
        const row = await loadOrThrow(deps, body.receptionistId);
        const stage = body.stage;
        if (!['dev', 'evaluation', 'staging', 'live', 'paused'].includes(String(stage))) throw new AdminError(400, 'invalid stage');
        const current = validateClientConfig(row.clientConfig);
        if (stage === 'live') {
          if (!current.config) throw new AdminError(422, 'config must be valid before going live', current.issues);
          // Re-validate as a LIVE config: mock providers, unreviewed knowledge etc. are only allowed below live.
          const asLive = validateClientConfig({ ...current.config, stage: 'live' });
          if (!asLive.config) throw new AdminError(422, 'config is not valid for the live stage', asLive.issues);
          const blockers = findKnowledgeGaps(current.config).filter((g) => g.severity === 'blocker');
          if (blockers.length) throw new AdminError(422, 'onboarding blockers remain', blockers);
          if (!row.providerAgentId) throw new AdminError(422, 'agent has not been provisioned');
        }
        const config = current.config ? { ...current.config, stage: stage as DeploymentStage } : undefined;
        await deps.db.updateReceptionist(row.id, { stage: stage as DeploymentStage, ...(config ? { clientConfig: config } : {}) });
        return jsonResponse({ ok: true, stage });
      }
      case 'plan': {
        const row = await loadOrThrow(deps, body.receptionistId);
        const config = assertClientConfig(row.clientConfig);
        const state = stateOf(row);
        const plan = planGoldenAgent({ config, state, toolTarget: { endpointUrl: deps.toolsEndpointUrl, authorization: { secret_id: 'planned' } }, stage: typeof body.stage === 'string' ? (body.stage as DeploymentStage) : undefined });
        return jsonResponse({ ok: true, plan: { stage: plan.stage, agentName: plan.agentName, promptVersion: plan.prompt.version, promptLength: plan.prompt.length, systemPrompt: plan.prompt.systemPrompt, firstMessage: plan.prompt.firstMessage, steps: plan.steps.map((s) => ('tool' in s ? `${s.kind}:${s.tool}` : 'key' in s ? `${s.kind}:${s.key}` : 'sourceId' in s ? `${s.kind}:${s.sourceId}` : s.kind)), toolNames: plan.toolNames, warnings: plan.warnings }, gaps: findKnowledgeGaps(config) });
      }
      case 'provision': {
        const row = await loadOrThrow(deps, body.receptionistId);
        const config = assertClientConfig(row.clientConfig);
        const stage = typeof body.stage === 'string' ? (body.stage as DeploymentStage) : row.stage;
        if ((row.stage === 'live' || stage === 'live') && row.providerAgentId && body.allowLiveChanges !== true) {
          throw new AdminError(409, 'live agent: pass allowLiveChanges=true after explicit approval');
        }
        let state = stateOf(row);
        const binding = await ensureBinding(deps, row, state, false);
        state = binding.state;
        const input = { config: { ...config, stage }, state, toolTarget: { endpointUrl: deps.toolsEndpointUrl, authorization: { secret_id: binding.secretId } }, stage };
        const plan = planGoldenAgent(input);
        try {
          const result = await applyGoldenAgentPlan(deps.provider(), input, plan, { allowLiveChanges: body.allowLiveChanges === true, fingerprint: sha256Hex });
          const nextState = { ...state, ...result.state, toolSecretIds: state.toolSecretIds };
          await deps.db.updateReceptionist(row.id, { providerState: nextState, providerAgentId: result.agentId, promptVersion: plan.prompt.version, lastSyncedAt: (deps.now?.() ?? new Date()).toISOString(), lastSyncError: null });
          return jsonResponse({ ok: true, agentId: result.agentId, created: result.created, updated: result.updated, warnings: result.warnings, promptVersion: plan.prompt.version, promptLength: plan.prompt.length, newToolToken: binding.token ?? null });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          await deps.db.updateReceptionist(row.id, { lastSyncError: message.slice(0, 500) });
          throw new AdminError(502, `provider sync failed: ${message.slice(0, 300)}`);
        }
      }
      case 'status': {
        const row = await loadOrThrow(deps, body.receptionistId);
        if (!row.providerAgentId) return jsonResponse({ ok: true, provisioned: false });
        const agent = await deps.provider().getAgent(row.providerAgentId);
        const snapshot = extractManagedSnapshot(agent);
        const state = stateOf(row);
        const expectedToolIds = Object.values(state.toolIds).filter(Boolean);
        const liveToolIds = Array.isArray(snapshot.tool_ids) ? (snapshot.tool_ids as string[]) : [];
        const drift = expectedToolIds.filter((id) => !liveToolIds.includes(id as string));
        return jsonResponse({ ok: true, provisioned: true, agentId: agent.agent_id, snapshot, phoneNumbers: (agent.phone_numbers ?? []).map((p) => p.phone_number), updatedAtUnix: agent.metadata?.updated_at_unix_secs ?? null, toolDrift: drift, promptVersion: state.promptVersion ?? null });
      }
      case 'rotate_token': {
        const row = await loadOrThrow(deps, body.receptionistId);
        const binding = await ensureBinding(deps, row, stateOf(row), true);
        return jsonResponse({ ok: true, newToolToken: binding.token, secretId: binding.secretId, note: 'Re-provision the agent so the tools use the new secret.' });
      }
      case 'sync_calls': {
        const row = await loadOrThrow(deps, body.receptionistId);
        if (!row.providerAgentId) throw new AdminError(409, 'agent has not been provisioned');
        const list = await deps.provider().listConversations({ agentId: row.providerAgentId, pageSize: 50 });
        await deps.db.upsertCalls(list.conversations.map((c) => ({
          receptionistId: row.id, organizationId: row.organizationId, conversationId: c.conversation_id, environment: environmentOf(row.stage),
          startedAt: new Date(c.start_time_unix_secs * 1000).toISOString(), durationSecs: c.call_duration_secs,
          status: c.status === 'done' ? 'done' : c.status === 'failed' ? 'failed' : c.status === 'in-progress' || c.status === 'processing' ? 'in_progress' : 'unknown',
          analysis: { call_successful: c.call_successful ?? null },
        })));
        return jsonResponse({ ok: true, synced: list.conversations.length });
      }
      case 'run_offline_evaluation': {
        const row = await loadOrThrow(deps, body.receptionistId);
        const config = assertClientConfig(row.clientConfig);
        const run = await deps.db.insertEvaluationRun({ receptionistId: row.id, organizationId: row.organizationId, mode: 'offline_reference', status: 'running', configVersion: row.configVersion, promptVersion: stateOf(row).promptVersion ?? null, createdBy: deps.actorId });
        await deps.db.updateEvaluationRun(run.id, { startedAt: (deps.now?.() ?? new Date()).toISOString() });
        const scenarios = generateCustomerScenarios(config);
        const results: ScenarioResult[] = [];
        for (const scenario of scenarios) {
          const { transcript } = await runReferenceConversation(config, scenario);
          results.push(evaluateTranscript(scenario, transcript));
        }
        const summary = summarize(results);
        await deps.db.insertEvaluationResults(results.map((r) => ({ runId: run.id, receptionistId: row.id, organizationId: row.organizationId, scenarioId: r.scenarioId, category: r.category, title: r.title, passed: r.passed, outcome: r.outcome, scores: r.scores, findings: r.findings, transcript: r.transcript as unknown as Record<string, unknown> })));
        await deps.db.updateEvaluationRun(run.id, { status: 'completed', total: summary.total, passed: summary.passed, failed: summary.failed, summary: summary as unknown as Record<string, unknown>, finishedAt: (deps.now?.() ?? new Date()).toISOString() });
        return jsonResponse({ ok: true, runId: run.id, summary });
      }
      case 'create_simulation_tests': {
        const row = await loadOrThrow(deps, body.receptionistId);
        const config = assertClientConfig(row.clientConfig);
        const state = stateOf(row);
        if (Object.keys(state.toolIds).length === 0) throw new AdminError(409, 'provision the agent first so tools can be mocked');
        const provider = deps.provider();
        const previous = isRecord(state.simulationTests) ? (state.simulationTests as Record<string, string>) : {};
        for (const testId of Object.values(previous)) {
          try { await provider.deleteTest(testId); } catch { /* already gone */ }
        }
        const scenarios = generateCustomerScenarios(config);
        const created: Record<string, string> = {};
        for (const scenario of scenarios) {
          const test = await provider.createTest(compileSimulationTest(config, scenario, state.toolIds));
          created[scenario.id] = test.id;
        }
        await deps.db.updateReceptionist(row.id, { providerState: { ...state, simulationTests: created } });
        return jsonResponse({ ok: true, tests: Object.keys(created).length });
      }
      case 'run_simulation_tests': {
        const row = await loadOrThrow(deps, body.receptionistId);
        const state = stateOf(row);
        if (!row.providerAgentId) throw new AdminError(409, 'agent has not been provisioned');
        const tests = isRecord(state.simulationTests) ? (state.simulationTests as Record<string, string>) : {};
        const ids = Object.values(tests);
        if (ids.length === 0) throw new AdminError(409, 'create simulation tests first');
        const invocation = await deps.provider().runTests(row.providerAgentId, ids);
        const run = await deps.db.insertEvaluationRun({ receptionistId: row.id, organizationId: row.organizationId, mode: 'elevenlabs_simulation', status: 'running', configVersion: row.configVersion, promptVersion: state.promptVersion ?? null, providerInvocationId: invocation.id, createdBy: deps.actorId });
        await deps.db.updateEvaluationRun(run.id, { startedAt: (deps.now?.() ?? new Date()).toISOString(), total: ids.length });
        return jsonResponse({ ok: true, runId: run.id, invocationId: invocation.id, tests: ids.length });
      }
      case 'fetch_simulation_results': {
        const row = await loadOrThrow(deps, body.receptionistId);
        const config = assertClientConfig(row.clientConfig);
        const state = stateOf(row);
        if (typeof body.runId !== 'string' || typeof body.invocationId !== 'string') throw new AdminError(400, 'runId and invocationId are required');
        const invocation = await deps.provider().getTestInvocation(body.invocationId);
        const tests = isRecord(state.simulationTests) ? (state.simulationTests as Record<string, string>) : {};
        const scenarioByTest = new Map(Object.entries(tests).map(([scenarioId, testId]) => [testId, scenarioId]));
        const scenarios = new Map(generateCustomerScenarios(config).map((s) => [s.id, s]));
        const results: ScenarioResult[] = [];
        let pending = 0;
        for (const testRun of invocation.test_runs) {
          const testId = String(testRun.test_id ?? '');
          const scenarioId = scenarioByTest.get(testId);
          const scenario = scenarioId ? scenarios.get(scenarioId) : undefined;
          if (!scenario) continue;
          const status = String(testRun.status ?? 'pending');
          if (status === 'pending' || status === 'running') { pending += 1; continue; }
          const responses = Array.isArray(testRun.agent_responses) ? (testRun.agent_responses as Array<Record<string, unknown>>) : [];
          const transcript = normaliseElevenLabsTranscript(`sim_${testId}`, responses, 'elevenlabs_simulation');
          const evaluated = evaluateTranscript(scenario, transcript);
          const providerVerdict = isRecord(testRun.condition_result) ? String(testRun.condition_result.result ?? status) : status;
          const providerPassed = providerVerdict === 'success' || providerVerdict === 'passed';
          results.push({ ...evaluated, passed: evaluated.passed && providerPassed, findings: providerPassed ? evaluated.findings : [...evaluated.findings, { dimension: 'task_completion', severity: 'fail', message: `ElevenLabs evaluator verdict: ${providerVerdict}` }] });
        }
        if (pending > 0) return jsonResponse({ ok: true, status: 'running', pending, completed: results.length });
        const summary = summarize(results);
        await deps.db.insertEvaluationResults(results.map((r) => ({ runId: body.runId as string, receptionistId: row.id, organizationId: row.organizationId, scenarioId: r.scenarioId, category: r.category, title: r.title, passed: r.passed, outcome: r.outcome, scores: r.scores, findings: r.findings, transcript: r.transcript as unknown as Record<string, unknown> })));
        await deps.db.updateEvaluationRun(body.runId, { status: 'completed', total: summary.total, passed: summary.passed, failed: summary.failed, summary: summary as unknown as Record<string, unknown>, finishedAt: (deps.now?.() ?? new Date()).toISOString() });
        return jsonResponse({ ok: true, status: 'completed', summary });
      }
      default:
        throw new AdminError(400, `unknown action ${body.action}`);
    }
  } catch (error) {
    if (error instanceof AdminError) return jsonResponse({ ok: false, error: error.message, details: error.details ?? null }, error.status);
    const message = error instanceof Error ? error.message : 'unexpected error';
    return jsonResponse({ ok: false, error: message.slice(0, 300) }, 500);
  }
}
