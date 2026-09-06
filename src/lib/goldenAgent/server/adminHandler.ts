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
//   fetch_simulation_results  { receptionistId, runId, invocationId }

import { assertClientConfig, createDefaultClientConfig, validateClientConfig } from '../clientConfig.ts';
import type { ClientConfig, DeploymentStage } from '../clientConfig.ts';
import { applyGoldenAgentPlan, emptyProvisionedState, planGoldenAgent, reconcileProvisionedState } from '../agentFactory.ts';
import type { FactoryClient, ProvisionedState, ReconcileClient } from '../agentFactory.ts';
import { describeProvisioningFailure } from '../elevenlabs/errors.ts';
import { EVALUATION_MODE_MEANING, describeProvisioning } from '../provisioningState.ts';
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
  lastSyncedAt?: string | null;
  lastSyncError?: string | null;
}

export interface AdminDatabase {
  createReceptionist(row: { organizationId: string; name: string; stage: DeploymentStage; clientConfig: ClientConfig; createdBy: string }): Promise<{ id: string }>;
  getReceptionist(id: string): Promise<ReceptionistRow | null>;
  updateReceptionist(id: string, patch: Partial<{ name: string; stage: DeploymentStage; clientConfig: ClientConfig; configVersion: number; providerState: ProvisionedState & Record<string, unknown>; providerAgentId: string | null; promptVersion: string | null; lastSyncedAt: string | null; lastSyncError: string | null }>): Promise<void>;
  insertConfigVersion(row: { receptionistId: string; organizationId: string; version: number; clientConfig: ClientConfig; note?: string; createdBy: string }): Promise<void>;
  findActiveBinding(receptionistId: string, environment: 'dev' | 'staging' | 'live'): Promise<{ id: string } | null>;
  /** Revokes every active binding for the environment except `exceptBindingId` (the one just issued). */
  revokeBindings(receptionistId: string, environment: 'dev' | 'staging' | 'live', exceptBindingId?: string): Promise<void>;
  insertBinding(row: { receptionistId: string; organizationId: string; environment: 'dev' | 'staging' | 'live'; tokenHash: string; label: string }): Promise<{ id: string }>;
  insertEvaluationRun(row: { receptionistId: string; organizationId: string; mode: 'offline_reference' | 'elevenlabs_simulation' | 'conversation_replay'; status: string; configVersion: number; promptVersion: string | null; providerInvocationId?: string; createdBy: string }): Promise<{ id: string }>;
  updateEvaluationRun(id: string, patch: Partial<{ status: string; total: number; passed: number; failed: number; summary: Record<string, unknown>; error: string | null; startedAt: string; finishedAt: string }>): Promise<void>;
  insertEvaluationResults(rows: Array<{ runId: string; receptionistId: string; organizationId: string; scenarioId: string; category: string; title: string; passed: boolean; outcome: string; scores: unknown[]; findings: unknown[]; transcript: Record<string, unknown> }>): Promise<void>;
  upsertCalls(rows: Array<{ receptionistId: string; organizationId: string; conversationId: string; environment: 'dev' | 'staging' | 'live'; startedAt?: string; durationSecs?: number; status: 'in_progress' | 'done' | 'failed' | 'unknown'; analysis: Record<string, unknown> }>): Promise<void>;
}

export interface AdminProviderClient extends FactoryClient, ReconcileClient {
  createSecret(name: string, value: string): Promise<{ secret_id: string }>;
  /** Best-effort cleanup of a secret a rotation replaced. Optional: never required for correctness. */
  deleteSecret?(secretId: string): Promise<unknown>;
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
  return {
    ...emptyProvisionedState(),
    ...raw,
    toolIds: isRecord(raw.toolIds) ? (raw.toolIds as ProvisionedState['toolIds']) : {},
    knowledgeDocumentIds: isRecord(raw.knowledgeDocumentIds) ? (raw.knowledgeDocumentIds as Record<string, string>) : {},
    knowledgeFingerprints: isRecord(raw.knowledgeFingerprints) ? (raw.knowledgeFingerprints as Record<string, string>) : {},
    knowledgeSourceIds: isRecord(raw.knowledgeSourceIds) ? (raw.knowledgeSourceIds as Record<string, string>) : {},
    // The agent id in the row is authoritative: it survives even if provider_state was reset.
    agentId: typeof raw.agentId === 'string' ? raw.agentId : row.providerAgentId ?? undefined,
  };
}

function secretIdsOf(state: Record<string, unknown>): Record<string, string> {
  return isRecord(state.toolSecretIds) ? (state.toolSecretIds as Record<string, string>) : {};
}

async function loadOrThrow(deps: AdminDependencies, receptionistId: unknown): Promise<ReceptionistRow> {
  if (typeof receptionistId !== 'string' || !receptionistId) throw new AdminError(400, 'receptionistId is required');
  const row = await deps.db.getReceptionist(receptionistId);
  if (!row) throw new AdminError(404, 'receptionist not found');
  return row;
}

/**
 * Guarantees that the environment has exactly one active tool binding whose token is the value of
 * one ElevenLabs workspace secret.
 *
 * ORDER MATTERS AND IS THE FIX FOR A REAL BUG. The previous implementation revoked the working
 * binding and inserted the new one BEFORE asking the provider for a secret. When the provider then
 * refused (the observed `POST /v1/convai/secrets` 401), the receptionist was left with a token no
 * secret carried: a previously working DEV agent would have started failing every tool call.
 *
 * Now the provider call comes first. If it fails, no database row has changed and the old binding
 * keeps working. Only after a secret exists is the new binding inserted and the old one revoked.
 */
async function ensureBinding(deps: AdminDependencies, row: ReceptionistRow, state: ProvisionedState & Record<string, unknown>, rotate: boolean): Promise<{ secretId: string; token?: string; state: ProvisionedState & Record<string, unknown> }> {
  const environment = environmentOf(row.stage);
  const existing = await deps.db.findActiveBinding(row.id, environment);
  const secretIds = secretIdsOf(state);
  if (existing && secretIds[environment] && !rotate) return { secretId: secretIds[environment], state };

  const token = generateToken();
  const secretName = `cogniiq-receptionist-${row.id.slice(0, 8)}-${environment}-${Date.now().toString(36)}`;
  const secret = await deps.provider().createSecret(secretName, token);

  const binding = await deps.db.insertBinding({ receptionistId: row.id, organizationId: row.organizationId, environment, tokenHash: await sha256Hex(token), label: `${environment} · ${new Date().toISOString().slice(0, 10)}` });
  // Everything else for this environment stops working now — including a binding an interrupted
  // earlier run may have left behind. Exactly one credential per environment is the invariant.
  await deps.db.revokeBindings(row.id, environment, binding.id);
  const previousSecretId = secretIds[environment];
  const nextState = { ...state, toolSecretIds: { ...secretIds, [environment]: secret.secret_id } };
  await deps.db.updateReceptionist(row.id, { providerState: nextState });
  if (previousSecretId && previousSecretId !== secret.secret_id) {
    // The superseded secret can no longer authenticate anything; removing it keeps the workspace
    // from accumulating one dead secret per rotation. Never fatal.
    try { await deps.provider().deleteSecret?.(previousSecretId); } catch { /* the operator can delete it manually */ }
  }
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
        const provider = deps.provider();
        let state = stateOf(row);
        const notes: string[] = [];

        // A run that died before it could checkpoint leaves resources in the workspace that the
        // stored state knows nothing about. Adopt them by managed name BEFORE planning, otherwise
        // this run creates a second copy of each.
        try {
          const reconciled = await reconcileProvisionedState(provider, { config, state, stage });
          if (reconciled.adopted.length > 0) {
            state = { ...state, ...reconciled.state };
            await deps.db.updateReceptionist(row.id, { providerState: state, ...(state.agentId ? { providerAgentId: state.agentId } : {}) });
            notes.push(`Adopted existing provider resources: ${reconciled.adopted.join(', ')}.`);
          }
        } catch (error) {
          // Reconciliation is a recovery aid, not a precondition. Its failure (typically a missing
          // read permission) must not block a first-time provisioning.
          notes.push(`Workspace reconciliation was skipped: ${describeProvisioningFailure(error, 'list_tools').text}`);
        }

        let binding: { secretId: string; token?: string; state: ProvisionedState & Record<string, unknown> };
        try {
          binding = await ensureBinding(deps, row, state, false);
        } catch (error) {
          const { classified, text } = describeProvisioningFailure(error, 'create_workspace_secret');
          await deps.db.updateReceptionist(row.id, { lastSyncError: text });
          throw new AdminError(502, text, { kind: classified.kind, status: classified.status, action: classified.action, retryable: classified.retryable });
        }
        state = binding.state;

        const input = { config: { ...config, stage }, state, toolTarget: { endpointUrl: deps.toolsEndpointUrl, authorization: { secret_id: binding.secretId } }, stage };
        const plan = planGoldenAgent(input);
        // Checkpointed after every provider mutation, so a failure halfway cannot lose ids.
        const persist = async (progressState: ProvisionedState) => {
          const merged = { ...state, ...progressState, toolSecretIds: secretIdsOf(state) };
          await deps.db.updateReceptionist(row.id, { providerState: merged, ...(progressState.agentId ? { providerAgentId: progressState.agentId } : {}) });
        };
        try {
          const result = await applyGoldenAgentPlan(provider, input, plan, { allowLiveChanges: body.allowLiveChanges === true, fingerprint: sha256Hex, onProgress: persist });
          const nextState = { ...state, ...result.state, toolSecretIds: secretIdsOf(state) };
          await deps.db.updateReceptionist(row.id, { providerState: nextState, providerAgentId: result.agentId, promptVersion: plan.prompt.version, lastSyncedAt: (deps.now?.() ?? new Date()).toISOString(), lastSyncError: null });
          return jsonResponse({ ok: true, agentId: result.agentId, created: result.created, updated: result.updated, warnings: [...result.warnings, ...notes], promptVersion: plan.prompt.version, promptLength: plan.prompt.length, newToolToken: binding.token ?? null });
        } catch (error) {
          const { classified, text } = describeProvisioningFailure(error, 'provider_call');
          await deps.db.updateReceptionist(row.id, { lastSyncError: text });
          throw new AdminError(502, text, { kind: classified.kind, status: classified.status, action: classified.action, retryable: classified.retryable });
        }
      }
      case 'status': {
        const row = await loadOrThrow(deps, body.receptionistId);
        const state = stateOf(row);
        const configValid = validateClientConfig(row.clientConfig).config !== null;
        const baseFacts = { configValid, providerAgentId: row.providerAgentId, toolIds: state.toolIds, lastSyncedAt: row.lastSyncedAt ?? null, lastSyncError: row.lastSyncError ?? null };
        if (!row.providerAgentId) {
          return jsonResponse({ ok: true, provisioned: false, provisioning: describeProvisioning(baseFacts), bookingProvider: validateClientConfig(row.clientConfig).config?.bookingIntegration.provider ?? null });
        }
        let agent: Awaited<ReturnType<AdminProviderClient['getAgent']>>;
        try {
          agent = await deps.provider().getAgent(row.providerAgentId);
        } catch (error) {
          const { classified, text } = describeProvisioningFailure(error, 'read_agent');
          throw new AdminError(502, text, { kind: classified.kind, status: classified.status, action: classified.action, retryable: classified.retryable });
        }
        const snapshot = extractManagedSnapshot(agent);
        const expectedToolIds = Object.values(state.toolIds).filter((id): id is string => typeof id === 'string');
        const liveToolIds = Array.isArray(snapshot.tool_ids) ? (snapshot.tool_ids as string[]) : [];
        const drift = expectedToolIds.filter((id) => !liveToolIds.includes(id));
        return jsonResponse({
          ok: true, provisioned: true, agentId: agent.agent_id, snapshot,
          phoneNumbers: (agent.phone_numbers ?? []).map((p) => p.phone_number),
          updatedAtUnix: agent.metadata?.updated_at_unix_secs ?? null,
          toolDrift: drift, promptVersion: state.promptVersion ?? null,
          provisioning: describeProvisioning({ ...baseFacts, toolDrift: drift }),
          bookingProvider: validateClientConfig(row.clientConfig).config?.bookingIntegration.provider ?? null,
        });
      }
      case 'rotate_token': {
        const row = await loadOrThrow(deps, body.receptionistId);
        try {
          const binding = await ensureBinding(deps, row, stateOf(row), true);
          return jsonResponse({ ok: true, newToolToken: binding.token, secretId: binding.secretId, note: 'Re-provision the agent so the tools use the new secret.' });
        } catch (error) {
          // The old binding is still active: rotation only swaps once a new secret exists.
          const { classified, text } = describeProvisioningFailure(error, 'create_workspace_secret');
          throw new AdminError(502, text, { kind: classified.kind, status: classified.status, action: classified.action, retryable: classified.retryable });
        }
      }
      case 'sync_calls': {
        const row = await loadOrThrow(deps, body.receptionistId);
        if (!row.providerAgentId) throw new AdminError(409, 'agent has not been provisioned');
        let list: Awaited<ReturnType<AdminProviderClient['listConversations']>>;
        try {
          list = await deps.provider().listConversations({ agentId: row.providerAgentId, pageSize: 50 });
        } catch (error) {
          const { classified, text } = describeProvisioningFailure(error, 'list_conversations');
          throw new AdminError(502, text, { kind: classified.kind, status: classified.status, retryable: classified.retryable });
        }
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
        try {
          for (const scenario of scenarios) {
            const { transcript } = await runReferenceConversation(config, scenario);
            results.push(evaluateTranscript(scenario, transcript));
          }
        } catch (error) {
          // A crashed suite must not stay `running` forever in the dashboard. This runs entirely
          // in-process, so there is no provider to blame and no provider payload to scrub.
          const text = `The offline evaluation stopped after ${results.length} of ${scenarios.length} scenarios: ${(error instanceof Error ? error.message : 'unknown error').slice(0, 200)}`;
          await deps.db.updateEvaluationRun(run.id, { status: 'failed', error: text, finishedAt: (deps.now?.() ?? new Date()).toISOString() });
          throw new AdminError(500, text);
        }
        const summary = summarize(results);
        await deps.db.insertEvaluationResults(results.map((r) => ({ runId: run.id, receptionistId: row.id, organizationId: row.organizationId, scenarioId: r.scenarioId, category: r.category, title: r.title, passed: r.passed, outcome: r.outcome, scores: r.scores, findings: r.findings, transcript: r.transcript as unknown as Record<string, unknown> })));
        await deps.db.updateEvaluationRun(run.id, { status: 'completed', total: summary.total, passed: summary.passed, failed: summary.failed, summary: summary as unknown as Record<string, unknown>, finishedAt: (deps.now?.() ?? new Date()).toISOString() });
        // Said explicitly on every response so no caller can mistake a green offline suite for
        // evidence about the live agent.
        return jsonResponse({ ok: true, runId: run.id, summary, mode: 'offline_reference', evidence: EVALUATION_MODE_MEANING.offline_reference.evidence });
      }
      case 'create_simulation_tests': {
        const row = await loadOrThrow(deps, body.receptionistId);
        const config = assertClientConfig(row.clientConfig);
        const state = stateOf(row);
        if (Object.keys(state.toolIds).length === 0) throw new AdminError(409, 'provision the agent first so tools can be mocked');
        const provider = deps.provider();
        // Everything a previous run left behind: the last complete suite plus anything an
        // interrupted run created. Kept as a LIST of provider ids, not a map keyed by scenario:
        // two runs produce different ids for the same scenario, and a map would silently drop the
        // older one — leaking exactly the orphan this bookkeeping exists to remove.
        const previousSuite = isRecord(state.simulationTests) ? Object.values(state.simulationTests as Record<string, string>) : [];
        const previousOrphans = Array.isArray(state.simulationTestsSuperseded) ? (state.simulationTestsSuperseded as string[]) : [];
        const previous = [...new Set([...previousOrphans, ...previousSuite])];
        const scenarios = generateCustomerScenarios(config);
        const created: Record<string, string> = {};
        // Create first, delete the superseded tests only afterwards. The old order (delete, then
        // create) meant a failure halfway left the receptionist with neither the old nor a complete
        // new suite, and the newly created tests orphaned in the workspace.
        const checkpoint = () => deps.db.updateReceptionist(row.id, { providerState: { ...state, simulationTests: created, simulationTestsSuperseded: previous } });
        // `previous` already contains everything to retire; `created` is what this run owns.
        try {
          for (const [index, scenario] of scenarios.entries()) {
            const test = await provider.createTest(compileSimulationTest(config, scenario, state.toolIds));
            created[scenario.id] = test.id;
            if ((index + 1) % 10 === 0) await checkpoint();
          }
        } catch (error) {
          await checkpoint();
          const { classified, text } = describeProvisioningFailure(error, 'create_test');
          throw new AdminError(502, text, { kind: classified.kind, status: classified.status, createdBeforeFailure: Object.keys(created).length, retryable: classified.retryable });
        }
        await deps.db.updateReceptionist(row.id, { providerState: { ...state, simulationTests: created, simulationTestsSuperseded: [] } });
        const own = new Set(Object.values(created));
        let removed = 0;
        for (const testId of previous) {
          if (own.has(testId)) continue;
          try { await provider.deleteTest(testId); removed += 1; } catch { /* already gone; harmless */ }
        }
        return jsonResponse({ ok: true, tests: Object.keys(created).length, removedPreviousTests: removed });
      }
      case 'run_simulation_tests': {
        const row = await loadOrThrow(deps, body.receptionistId);
        const state = stateOf(row);
        if (!row.providerAgentId) throw new AdminError(409, 'agent has not been provisioned');
        const tests = isRecord(state.simulationTests) ? (state.simulationTests as Record<string, string>) : {};
        const ids = Object.values(tests);
        if (ids.length === 0) throw new AdminError(409, 'create simulation tests first');
        let invocation: { id: string };
        try {
          invocation = await deps.provider().runTests(row.providerAgentId, ids);
        } catch (error) {
          // No run row is written for a start that never happened; a phantom "running" row would
          // sit in the dashboard forever.
          const { classified, text } = describeProvisioningFailure(error, 'run_tests');
          throw new AdminError(502, text, { kind: classified.kind, status: classified.status, retryable: classified.retryable });
        }
        const run = await deps.db.insertEvaluationRun({ receptionistId: row.id, organizationId: row.organizationId, mode: 'elevenlabs_simulation', status: 'running', configVersion: row.configVersion, promptVersion: state.promptVersion ?? null, providerInvocationId: invocation.id, createdBy: deps.actorId });
        await deps.db.updateEvaluationRun(run.id, { startedAt: (deps.now?.() ?? new Date()).toISOString(), total: ids.length });
        return jsonResponse({ ok: true, runId: run.id, invocationId: invocation.id, tests: ids.length });
      }
      case 'fetch_simulation_results': {
        const row = await loadOrThrow(deps, body.receptionistId);
        const config = assertClientConfig(row.clientConfig);
        const state = stateOf(row);
        if (typeof body.runId !== 'string' || typeof body.invocationId !== 'string') throw new AdminError(400, 'runId and invocationId are required');
        const runId = body.runId;
        let invocation: { id: string; test_runs: Array<Record<string, unknown>> };
        try {
          invocation = await deps.provider().getTestInvocation(body.invocationId);
        } catch (error) {
          const { classified, text } = describeProvisioningFailure(error, 'read_test_invocation');
          // A provider outage while polling is not a failed evaluation — leave the run `running`
          // so the operator can poll again. Only a definitive answer changes the run's status.
          if (classified.retryable) throw new AdminError(502, text, { kind: classified.kind, retryable: true });
          await deps.db.updateEvaluationRun(runId, { status: 'failed', error: text, finishedAt: (deps.now?.() ?? new Date()).toISOString() });
          throw new AdminError(502, text, { kind: classified.kind, retryable: false });
        }
        const tests = isRecord(state.simulationTests) ? (state.simulationTests as Record<string, string>) : {};
        const scenarioByTest = new Map(Object.entries(tests).map(([scenarioId, testId]) => [testId, scenarioId]));
        const scenarios = new Map(generateCustomerScenarios(config).map((s) => [s.id, s]));
        const results: ScenarioResult[] = [];
        let pending = 0;
        let unmatched = 0;
        let malformed = 0;
        for (const testRun of invocation.test_runs) {
          const testId = String(testRun.test_id ?? '');
          const scenarioId = scenarioByTest.get(testId);
          const scenario = scenarioId ? scenarios.get(scenarioId) : undefined;
          if (!scenario) {
            // A test the provider ran that this receptionist does not own, or a scenario the
            // current config no longer generates. Counted, never guessed at.
            unmatched += 1;
            continue;
          }
          const status = String(testRun.status ?? 'pending');
          if (status === 'pending' || status === 'running' || status === 'queued') { pending += 1; continue; }
          const responses = Array.isArray(testRun.agent_responses) ? (testRun.agent_responses as Array<Record<string, unknown>>) : null;
          if (!responses) {
            // The provider reported the run as finished but returned no transcript. That is a
            // failure of the run, not a pass, and never silently dropped.
            malformed += 1;
            results.push({
              scenarioId: scenario.id, category: scenario.category, title: scenario.title, passed: false,
              outcome: 'unknown', scores: [], toolCalls: [], transcript: { conversationId: `sim_${testId}`, turns: [], source: 'elevenlabs_simulation' },
              findings: [{ dimension: 'task_completion', severity: 'fail', message: `ElevenLabs returned status "${status}" without a transcript; the scenario could not be evaluated.` }],
            });
            continue;
          }
          const transcript = normaliseElevenLabsTranscript(`sim_${testId}`, responses, 'elevenlabs_simulation');
          const evaluated = evaluateTranscript(scenario, transcript);
          const providerVerdict = isRecord(testRun.condition_result) ? String(testRun.condition_result.result ?? status) : status;
          const providerPassed = providerVerdict === 'success' || providerVerdict === 'passed';
          results.push({ ...evaluated, passed: evaluated.passed && providerPassed, findings: providerPassed ? evaluated.findings : [...evaluated.findings, { dimension: 'task_completion', severity: 'fail', message: `ElevenLabs evaluator verdict: ${providerVerdict}` }] });
        }
        if (pending > 0) return jsonResponse({ ok: true, status: 'running', pending, completed: results.length, unmatched });
        if (results.length === 0) {
          const message = `The simulation run returned no evaluable results (${invocation.test_runs.length} test runs, ${unmatched} not attributable to this receptionist). Recreate the simulation tests and run again.`;
          await deps.db.updateEvaluationRun(runId, { status: 'failed', error: message, finishedAt: (deps.now?.() ?? new Date()).toISOString() });
          return jsonResponse({ ok: true, status: 'failed', error: message, unmatched });
        }
        const summary = summarize(results);
        await deps.db.insertEvaluationResults(results.map((r) => ({ runId, receptionistId: row.id, organizationId: row.organizationId, scenarioId: r.scenarioId, category: r.category, title: r.title, passed: r.passed, outcome: r.outcome, scores: r.scores, findings: r.findings, transcript: r.transcript as unknown as Record<string, unknown> })));
        await deps.db.updateEvaluationRun(runId, { status: 'completed', total: summary.total, passed: summary.passed, failed: summary.failed, summary: summary as unknown as Record<string, unknown>, finishedAt: (deps.now?.() ?? new Date()).toISOString() });
        return jsonResponse({ ok: true, status: 'completed', summary, unmatched, malformed });
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
