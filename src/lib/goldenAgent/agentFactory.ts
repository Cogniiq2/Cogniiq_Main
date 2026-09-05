// Golden Agent — agent factory.
//
//   ClientConfig → (prompt, tools, knowledge) → ElevenLabs agent
//
// `planGoldenAgent` is pure: it computes exactly what will be created or updated. `applyGoldenAgentPlan`
// executes the plan through a structural ElevenLabs client interface (so tests use a fake and the
// edge function the real client). Every step is idempotent: existing resources are matched by the
// deterministic names/ids stored in the receptionist record and updated in place, never duplicated.
//
// The factory never touches phone numbers and never changes an agent whose stored stage is `live`
// unless the caller explicitly opts in — production changes are an explicit, approved action.

import type { ClientConfig, DeploymentStage } from './clientConfig.ts';
import { assertClientConfig } from './clientConfig.ts';
import { buildKnowledgeDocuments } from './knowledge.ts';
import { composeGoldenAgentPrompt } from './prompt.ts';
import type { ComposedPrompt } from './prompt.ts';
import { TOOL_NAMES } from './toolContracts.ts';
import type { ToolName } from './toolContracts.ts';
import { agentDisplayName, buildAgentBody, buildWebhookToolConfig, toolResourceName } from './elevenlabs/mapping.ts';
import type { WebhookToolTarget } from './elevenlabs/mapping.ts';

export interface ProvisionedState {
  agentId?: string;
  /** universal tool name → ElevenLabs tool id */
  toolIds: Partial<Record<ToolName, string>>;
  /** generated document key → ElevenLabs knowledge document id */
  knowledgeDocumentIds: Record<string, string>;
  /** URL knowledge sources (config.knowledgeSources[].id → document id) */
  knowledgeSourceIds: Record<string, string>;
  promptVersion?: string;
  /** SHA of the last applied agent body, to skip no-op syncs. */
  appliedFingerprint?: string;
}

export function emptyProvisionedState(): ProvisionedState {
  return { toolIds: {}, knowledgeDocumentIds: {}, knowledgeSourceIds: {} };
}

export type PlanStep =
  | { kind: 'create_tool'; tool: ToolName; body: Record<string, unknown> }
  | { kind: 'update_tool'; tool: ToolName; toolId: string; body: Record<string, unknown> }
  | { kind: 'create_knowledge_text'; key: string; name: string; text: string }
  | { kind: 'update_knowledge_text'; key: string; documentId: string; name: string; text: string }
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

export function planGoldenAgent(input: PlanInput): GoldenAgentPlan {
  const config = assertClientConfig(input.config);
  const stage = input.stage ?? config.stage;
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
    const existing = input.state.toolIds[tool];
    steps.push(existing ? { kind: 'update_tool', tool, toolId: existing, body } : { kind: 'create_tool', tool, body });
  }

  for (const document of buildKnowledgeDocuments(config)) {
    const existing = input.state.knowledgeDocumentIds[document.key];
    steps.push(existing
      ? { kind: 'update_knowledge_text', key: document.key, documentId: existing, name: document.name, text: document.text }
      : { kind: 'create_knowledge_text', key: document.key, name: document.name, text: document.text });
  }
  for (const source of config.knowledgeSources) {
    if ((source.kind === 'website' || source.kind === 'document') && source.reviewed && source.url && !input.state.knowledgeSourceIds[source.id] && !source.providerDocumentId) {
      steps.push({ kind: 'create_knowledge_url', sourceId: source.id, name: `${config.companyName} – ${source.name}`, url: source.url });
    }
  }

  // The agent body is completed at apply time once tool/document ids are known; here we record the
  // shape with placeholders so the plan can be displayed.
  const agentBody = buildAgentBody({ config, prompt, toolIds: Object.values(input.state.toolIds).filter((id): id is string => typeof id === 'string'), knowledgeBase: [], stage });
  steps.push(input.state.agentId ? { kind: 'update_agent', agentId: input.state.agentId, body: agentBody } : { kind: 'create_agent', body: agentBody });

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
  const state: ProvisionedState = {
    agentId: input.state.agentId,
    toolIds: { ...input.state.toolIds },
    knowledgeDocumentIds: { ...input.state.knowledgeDocumentIds },
    knowledgeSourceIds: { ...input.state.knowledgeSourceIds },
    promptVersion: plan.prompt.version,
  };
  const created: string[] = [];
  const updated: string[] = [];
  const warnings = [...plan.warnings];
  const documentsToDelete: string[] = [];
  const knowledgeBase: Array<{ id: string; name: string; type: 'text' | 'url' | 'file' }> = [];

  for (const step of plan.steps) {
    switch (step.kind) {
      case 'create_tool': {
        const tool = await client.createTool(step.body);
        state.toolIds[step.tool] = tool.id;
        created.push(`tool:${step.tool}`);
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
        knowledgeBase.push({ id: document.id, name: step.name, type: 'text' });
        created.push(`knowledge:${step.key}`);
        break;
      }
      case 'update_knowledge_text': {
        const document = await client.createKnowledgeText(step.name, step.text);
        documentsToDelete.push(step.documentId);
        state.knowledgeDocumentIds[step.key] = document.id;
        knowledgeBase.push({ id: document.id, name: step.name, type: 'text' });
        updated.push(`knowledge:${step.key}`);
        break;
      }
      case 'create_knowledge_url': {
        const document = await client.createKnowledgeUrl(step.name, step.url);
        state.knowledgeSourceIds[step.sourceId] = document.id;
        knowledgeBase.push({ id: document.id, name: step.name, type: 'url' });
        created.push(`knowledge-url:${step.sourceId}`);
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
      if (source && source.reviewed) knowledgeBase.push({ id: documentId, name: `${config.companyName} – ${source.name}`, type: 'url' });
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
      await client.updateAgent(state.agentId, body);
      updated.push('agent');
    }
  } else {
    const agent = await client.createAgent(body);
    state.agentId = agent.agent_id;
    created.push('agent');
  }
  state.appliedFingerprint = fingerprint;

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
