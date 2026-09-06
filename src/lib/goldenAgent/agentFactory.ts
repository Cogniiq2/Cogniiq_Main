// Golden Agent — agent factory.
//
//   ClientConfig → (prompt, tools, knowledge) → ElevenLabs agent
//
// `planGoldenAgent` is pure: it computes exactly what will be created or updated. `applyGoldenAgentPlan`
// executes the plan through a structural ElevenLabs client interface (so tests use a fake and the
// edge function the real client).
//
// CONVERGENCE IS THE POINT OF THIS FILE. Provisioning talks to a remote API over many round trips
// and can fail at any of them. Three mechanisms together guarantee that a retry after a partial
// failure ends with exactly one logical resource per intended resource:
//
//   1. PERSISTED PROGRESS. Every id the provider hands back is reported through `options.onProgress`
//      immediately, before the next call is made. The caller writes it to the database, so a throw
//      one step later can never lose a created resource.
//   2. DETERMINISTIC MANAGED NAMES. Tools, knowledge documents and the agent all carry a name
//      derived only from (clientId, stage, resource). `reconcileProvisionedState` looks the
//      workspace up by those names and adopts anything the stored state has lost — the recovery
//      path when progress could not be persisted at all.
//   3. CONTENT FINGERPRINTS. Knowledge text documents are immutable in the provider API, so an
//      "update" is create-new + delete-old. Without a fingerprint every retry would create another
//      copy; with it, an unchanged document is left alone and a repeated provision is a no-op.
//
// The factory never touches phone numbers and never changes an agent whose stored stage is `live`
// unless the caller explicitly opts in — production changes are an explicit, approved action.

import type { ClientConfig, DeploymentStage } from './clientConfig.ts';
import { assertClientConfig } from './clientConfig.ts';
import { contentFingerprint } from './fingerprint.ts';
import { buildKnowledgeDocuments } from './knowledge.ts';
import { composeGoldenAgentPrompt } from './prompt.ts';
import type { ComposedPrompt } from './prompt.ts';
import { TOOL_NAMES } from './toolContracts.ts';
import type { ToolName } from './toolContracts.ts';
import { agentDisplayName, buildAgentBody, buildWebhookToolConfig, knowledgeResourceName, toolResourceName } from './elevenlabs/mapping.ts';
import type { WebhookToolTarget } from './elevenlabs/mapping.ts';

export interface ProvisionedState {
  agentId?: string;
  /** universal tool name → ElevenLabs tool id */
  toolIds: Partial<Record<ToolName, string>>;
  /** generated document key → ElevenLabs knowledge document id */
  knowledgeDocumentIds: Record<string, string>;
  /** generated document key → content fingerprint of the text that produced that document */
  knowledgeFingerprints: Record<string, string>;
  /** URL knowledge sources (config.knowledgeSources[].id → document id) */
  knowledgeSourceIds: Record<string, string>;
  promptVersion?: string;
  /** SHA of the last applied agent body, to skip no-op syncs. */
  appliedFingerprint?: string;
}

export function emptyProvisionedState(): ProvisionedState {
  return { toolIds: {}, knowledgeDocumentIds: {}, knowledgeFingerprints: {}, knowledgeSourceIds: {} };
}

export type PlanStep =
  | { kind: 'create_tool'; tool: ToolName; body: Record<string, unknown> }
  | { kind: 'update_tool'; tool: ToolName; toolId: string; body: Record<string, unknown> }
  | { kind: 'create_knowledge_text'; key: string; name: string; text: string; fingerprint: string }
  | { kind: 'update_knowledge_text'; key: string; documentId: string; name: string; text: string; fingerprint: string }
  | { kind: 'keep_knowledge_text'; key: string; documentId: string; name: string }
  | { kind: 'create_knowledge_url'; sourceId: string; name: string; url: string }
  | { kind: 'create_agent'; body: Record<string, unknown> }
  | { kind: 'update_agent'; agentId: string; body: Record<string, unknown> };

export interface GoldenAgentPlan {
  stage: DeploymentStage;
  agentName: string;
  prompt: ComposedPrompt;
  steps: PlanStep[];
  /** Tool resource names as they will appear in the ElevenLabs workspace. */
  toolNames: Record<ToolName, string>;
  warnings: string[];
}

export interface PlanInput {
  config: ClientConfig;
  state: ProvisionedState;
  toolTarget: WebhookToolTarget;
  /** Override the stage the agent is provisioned as (e.g. a DEV copy of a live config). */
  stage?: DeploymentStage;
}

function normaliseState(state: ProvisionedState): ProvisionedState {
  return {
    ...state,
    toolIds: { ...state.toolIds },
    knowledgeDocumentIds: { ...state.knowledgeDocumentIds },
    knowledgeFingerprints: { ...(state.knowledgeFingerprints ?? {}) },
    knowledgeSourceIds: { ...state.knowledgeSourceIds },
  };
}

export function planGoldenAgent(input: PlanInput): GoldenAgentPlan {
  const config = assertClientConfig(input.config);
  const stage = input.stage ?? config.stage;
  const state = normaliseState(input.state);
  const warnings: string[] = [];
  const prompt = composeGoldenAgentPrompt(config);
  if (prompt.length > 24_000) warnings.push(`Prompt is ${prompt.length} characters; consider moving FAQs into the knowledge base.`);
  if (!config.voice.voiceId) warnings.push('No voice configured; the default Cogniiq voice will be used.');
  if (config.bookingIntegration.provider === 'mock') warnings.push('Booking provider is the in-memory mock: bookings are not real.');

  const steps: PlanStep[] = [];
  const toolNames = {} as Record<ToolName, string>;
  for (const tool of TOOL_NAMES) {
    toolNames[tool] = toolResourceName(config, tool);
    const body = buildWebhookToolConfig(config, tool, input.toolTarget);
    const existing = state.toolIds[tool];
    steps.push(existing ? { kind: 'update_tool', tool, toolId: existing, body } : { kind: 'create_tool', tool, body });
  }

  for (const document of buildKnowledgeDocuments(config)) {
    const name = knowledgeResourceName(config, stage, document.name);
    const fingerprint = contentFingerprint(`${name}\n---\n${document.text}`);
    const existing = state.knowledgeDocumentIds[document.key];
    if (!existing) {
      steps.push({ kind: 'create_knowledge_text', key: document.key, name, text: document.text, fingerprint });
    } else if (state.knowledgeFingerprints[document.key] === fingerprint) {
      // Unchanged: keep the document as it is. This is what makes a repeated provision a no-op
      // instead of a slow leak of one new document per run.
      steps.push({ kind: 'keep_knowledge_text', key: document.key, documentId: existing, name });
    } else {
      steps.push({ kind: 'update_knowledge_text', key: document.key, documentId: existing, name, text: document.text, fingerprint });
    }
  }
  for (const source of config.knowledgeSources) {
    if ((source.kind === 'website' || source.kind === 'document') && source.reviewed && source.url && !state.knowledgeSourceIds[source.id] && !source.providerDocumentId) {
      steps.push({ kind: 'create_knowledge_url', sourceId: source.id, name: knowledgeResourceName(config, stage, `${config.companyName} – ${source.name}`), url: source.url });
    }
  }

  // The agent body is completed at apply time once tool/document ids are known; here we record the
  // shape with placeholders so the plan can be displayed.
  const agentBody = buildAgentBody({ config, prompt, toolIds: Object.values(state.toolIds).filter((id): id is string => typeof id === 'string'), knowledgeBase: [], stage });
  steps.push(state.agentId ? { kind: 'update_agent', agentId: state.agentId, body: agentBody } : { kind: 'create_agent', body: agentBody });

  return { stage, agentName: agentDisplayName(config, stage), prompt, steps, toolNames, warnings };
}

/** Minimal client surface the factory needs; ElevenLabsClient satisfies it structurally. */
export interface FactoryClient {
  createTool(toolConfig: Record<string, unknown>): Promise<{ id: string }>;
  updateTool(toolId: string, toolConfig: Record<string, unknown>): Promise<{ id: string }>;
  createKnowledgeText(name: string, text: string): Promise<{ id: string }>;
  deleteKnowledgeDocument(documentId: string): Promise<unknown>;
  createKnowledgeUrl(name: string, url: string): Promise<{ id: string }>;
  createAgent(body: Record<string, unknown>): Promise<{ agent_id: string }>;
  updateAgent(agentId: string, body: Record<string, unknown>): Promise<unknown>;
  getAgent(agentId: string): Promise<{ agent_id: string; conversation_config: Record<string, unknown> }>;
}

/**
 * The read-only surface used to rebuild lost state from the workspace itself. Optional because a
 * fake client in a unit test does not need it; when a method is missing that class of resource is
 * simply not reconciled.
 */
export interface ReconcileClient {
  listTools?(): Promise<{ tools: Array<{ id: string; tool_config: { name: string } }> }>;
  listKnowledgeBase?(): Promise<{ documents: Array<{ id: string; name: string; type?: string }> }>;
  listAgents?(params?: { search?: string; pageSize?: number }): Promise<{ agents: Array<{ agent_id: string; name: string; tags?: string[] }> }>;
}

export interface ReconcileResult {
  state: ProvisionedState;
  /** Human-readable list of what was adopted, for the operator log. */
  adopted: string[];
}

/**
 * Rebuilds provider ids the stored state is missing by looking the workspace up by managed name.
 *
 * This is the safety net for the worst case: provisioning created resources and the process died
 * before ANY progress could be written. Without it the next run would create a second set. It is
 * deliberately conservative — it only ever FILLS IN missing ids, never overwrites or deletes, and
 * only matches names this platform generates.
 *
 * Adopted knowledge documents deliberately get no fingerprint: their text is unknown, so the next
 * plan rewrites them once and records the fingerprint then.
 */
export async function reconcileProvisionedState(client: FactoryClient & ReconcileClient, input: { config: ClientConfig; state: ProvisionedState; stage?: DeploymentStage }): Promise<ReconcileResult> {
  const config = assertClientConfig(input.config);
  const stage = input.stage ?? config.stage;
  const state = normaliseState(input.state);
  const adopted: string[] = [];

  const missingTools = TOOL_NAMES.filter((tool) => !state.toolIds[tool]);
  if (missingTools.length > 0 && client.listTools) {
    const byName = new Map((await client.listTools()).tools.map((tool) => [tool.tool_config?.name, tool.id] as const));
    for (const tool of missingTools) {
      const id = byName.get(toolResourceName(config, tool));
      if (id) {
        state.toolIds[tool] = id;
        adopted.push(`tool:${tool}`);
      }
    }
  }

  const documents = buildKnowledgeDocuments(config);
  const missingDocuments = documents.filter((document) => !state.knowledgeDocumentIds[document.key]);
  const missingSources = config.knowledgeSources.filter((source) => (source.kind === 'website' || source.kind === 'document') && source.reviewed && source.url && !state.knowledgeSourceIds[source.id] && !source.providerDocumentId);
  if ((missingDocuments.length > 0 || missingSources.length > 0) && client.listKnowledgeBase) {
    const list = (await client.listKnowledgeBase()).documents;
    // A managed name is unique per (client, stage, document); if the workspace somehow holds more
    // than one, the newest wins and the older copies are left for a human to remove — deleting
    // provider resources is never automatic here.
    const byName = new Map(list.map((document) => [document.name, document.id] as const));
    for (const document of missingDocuments) {
      const id = byName.get(knowledgeResourceName(config, stage, document.name));
      if (id) {
        state.knowledgeDocumentIds[document.key] = id;
        delete state.knowledgeFingerprints[document.key];
        adopted.push(`knowledge:${document.key}`);
      }
    }
    for (const source of missingSources) {
      const id = byName.get(knowledgeResourceName(config, stage, `${config.companyName} – ${source.name}`));
      if (id) {
        state.knowledgeSourceIds[source.id] = id;
        adopted.push(`knowledge-url:${source.id}`);
      }
    }
  }

  if (!state.agentId && client.listAgents) {
    const name = agentDisplayName(config, stage);
    const match = (await client.listAgents({ search: name })).agents.find((agent) => agent.name === name);
    if (match) {
      state.agentId = match.agent_id;
      // The adopted agent's body is unknown, so the next apply must write it rather than skip.
      delete state.appliedFingerprint;
      adopted.push('agent');
    }
  }

  return { state, adopted };
}

export interface ApplyResult {
  state: ProvisionedState;
  agentId: string;
  created: string[];
  updated: string[];
  warnings: string[];
}

export interface ApplyOptions {
  /** Refuse to modify an agent whose stored stage is live unless true. */
  allowLiveChanges?: boolean;
  fingerprint?: (input: string) => Promise<string> | string;
  /**
   * Called after every provider mutation that produced an id, BEFORE the next provider call.
   * The caller persists the state; a failure of the next step then cannot lose what was created.
   * Must not throw — a persistence problem is reported by the caller, not by aborting mid-plan.
   */
  onProgress?: (state: ProvisionedState) => Promise<void> | void;
}

async function defaultFingerprint(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Applies a plan. Tools and documents first (so their ids exist), then the agent with the real ids.
 * Text documents are immutable in the knowledge base API, so an update is create-new + delete-old,
 * and the agent is re-pointed in the same run — the agent never references a deleted document.
 */
export async function applyGoldenAgentPlan(client: FactoryClient, input: PlanInput, plan: GoldenAgentPlan, options: ApplyOptions = {}): Promise<ApplyResult> {
  const config = assertClientConfig(input.config);
  if (config.stage === 'live' && input.state.agentId && !options.allowLiveChanges) {
    throw new Error('Refusing to modify a live agent without allowLiveChanges');
  }
  const state: ProvisionedState = { ...normaliseState(input.state), promptVersion: plan.prompt.version };
  const created: string[] = [];
  const updated: string[] = [];
  const warnings = [...plan.warnings];
  const documentsToDelete: string[] = [];
  const knowledgeBase: Array<{ id: string; name: string; type: 'text' | 'url' | 'file' }> = [];

  const progress = async () => {
    if (!options.onProgress) return;
    try {
      await options.onProgress({ ...state, toolIds: { ...state.toolIds }, knowledgeDocumentIds: { ...state.knowledgeDocumentIds }, knowledgeFingerprints: { ...state.knowledgeFingerprints }, knowledgeSourceIds: { ...state.knowledgeSourceIds } });
    } catch {
      // Losing one checkpoint is survivable (reconciliation covers it); aborting the run is not.
      warnings.push('Provisioning progress could not be checkpointed; a retry may need to adopt resources by name.');
    }
  };

  for (const step of plan.steps) {
    switch (step.kind) {
      case 'create_tool': {
        const tool = await client.createTool(step.body);
        state.toolIds[step.tool] = tool.id;
        created.push(`tool:${step.tool}`);
        await progress();
        break;
      }
      case 'update_tool': {
        await client.updateTool(step.toolId, step.body);
        updated.push(`tool:${step.tool}`);
        break;
      }
      case 'create_knowledge_text': {
        const document = await client.createKnowledgeText(step.name, step.text);
        state.knowledgeDocumentIds[step.key] = document.id;
        state.knowledgeFingerprints[step.key] = step.fingerprint;
        knowledgeBase.push({ id: document.id, name: step.name, type: 'text' });
        created.push(`knowledge:${step.key}`);
        await progress();
        break;
      }
      case 'update_knowledge_text': {
        const document = await client.createKnowledgeText(step.name, step.text);
        documentsToDelete.push(step.documentId);
        state.knowledgeDocumentIds[step.key] = document.id;
        state.knowledgeFingerprints[step.key] = step.fingerprint;
        knowledgeBase.push({ id: document.id, name: step.name, type: 'text' });
        updated.push(`knowledge:${step.key}`);
        await progress();
        break;
      }
      case 'keep_knowledge_text': {
        knowledgeBase.push({ id: step.documentId, name: step.name, type: 'text' });
        break;
      }
      case 'create_knowledge_url': {
        const document = await client.createKnowledgeUrl(step.name, step.url);
        state.knowledgeSourceIds[step.sourceId] = document.id;
        knowledgeBase.push({ id: document.id, name: step.name, type: 'url' });
        created.push(`knowledge-url:${step.sourceId}`);
        await progress();
        break;
      }
      case 'create_agent':
      case 'update_agent':
        break;
    }
  }
  for (const [sourceId, documentId] of Object.entries(state.knowledgeSourceIds)) {
    if (!knowledgeBase.some((doc) => doc.id === documentId)) {
      const source = config.knowledgeSources.find((s) => s.id === sourceId);
      if (source && source.reviewed) knowledgeBase.push({ id: documentId, name: knowledgeResourceName(config, plan.stage, `${config.companyName} – ${source.name}`), type: 'url' });
    }
  }
  for (const source of config.knowledgeSources) {
    if (source.providerDocumentId && source.reviewed && !knowledgeBase.some((doc) => doc.id === source.providerDocumentId)) {
      knowledgeBase.push({ id: source.providerDocumentId, name: `${config.companyName} – ${source.name}`, type: source.kind === 'website' ? 'url' : source.kind === 'document' ? 'file' : 'text' });
    }
  }

  const toolIds = TOOL_NAMES.map((tool) => state.toolIds[tool]).filter((id): id is string => typeof id === 'string');
  if (toolIds.length !== TOOL_NAMES.length) throw new Error('Not every tool was provisioned; refusing to create an agent with a partial toolset');
  const body = buildAgentBody({ config, prompt: plan.prompt, toolIds, knowledgeBase, stage: plan.stage });
  const fingerprint = await (options.fingerprint ?? defaultFingerprint)(JSON.stringify(body));

  if (state.agentId) {
    if (fingerprint !== input.state.appliedFingerprint) {
      // The fingerprint is recorded only after the provider accepted the body. A failed update
      // therefore leaves the agent marked as NOT synchronized, which is the truth.
      await client.updateAgent(state.agentId, body);
      updated.push('agent');
      state.appliedFingerprint = fingerprint;
      await progress();
    } else {
      state.appliedFingerprint = fingerprint;
    }
  } else {
    const agent = await client.createAgent(body);
    state.agentId = agent.agent_id;
    created.push('agent');
    state.appliedFingerprint = fingerprint;
    await progress();
  }

  for (const documentId of documentsToDelete) {
    try {
      await client.deleteKnowledgeDocument(documentId);
    } catch {
      warnings.push(`Old knowledge document ${documentId} could not be deleted; it is no longer referenced.`);
    }
  }
  return { state, agentId: state.agentId, created, updated, warnings };
}

/** The one-call convenience the product promises: config in, agent out. */
export async function createGoldenAgent(client: FactoryClient, input: PlanInput, options?: ApplyOptions): Promise<ApplyResult> {
  const plan = planGoldenAgent(input);
  return applyGoldenAgentPlan(client, input, plan, options);
}
