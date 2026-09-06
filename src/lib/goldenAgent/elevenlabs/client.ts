// Golden Agent — ElevenLabs Agents Platform REST client.
//
// Server-side only. The API key is passed in by the edge function from its environment; this
// module never reads env vars, never logs the key and is never imported by browser code (the
// dashboard talks to the `receptionist-admin` edge function, which uses this client).
//
// Kept deliberately thin: typed wrappers over the endpoints the factory needs, structural
// validation of responses, and one error type. Request/response shapes mirror the live workspace
// schemas inspected through the ElevenLabs connector (agents, tools, knowledge base, tests).

import type { ProviderAction } from './errors.ts';

export const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io';

/**
 * A provider HTTP failure. `action` names the provisioning step, so `classifyProviderError`
 * (elevenlabs/errors.ts) can turn a bare status into an instruction an operator can follow.
 * The message stays terse and never contains request headers, so an accidental log of
 * `error.message` cannot leak the API key.
 */
export class ElevenLabsApiError extends Error {
  constructor(readonly status: number, readonly endpoint: string, readonly body: unknown, readonly action?: ProviderAction) {
    super(`ElevenLabs ${endpoint} failed with ${status}`);
    this.name = 'ElevenLabsApiError';
  }
}

/** Transport failure: DNS, TLS, connection reset or the client-side timeout. No HTTP status exists. */
export class ElevenLabsTransportError extends Error {
  constructor(readonly endpoint: string, readonly action: ProviderAction, readonly timedOut: boolean, readonly underlying: unknown) {
    super(`ElevenLabs ${endpoint} ${timedOut ? 'timed out' : 'could not be reached'}`);
    this.name = 'ElevenLabsTransportError';
  }
}

export interface ElevenLabsClientOptions {
  apiKey: string;
  fetchImpl?: typeof fetch;
  baseUrl?: string;
  timeoutMs?: number;
}

export interface AgentSummary {
  agent_id: string;
  name: string;
  tags?: string[];
  created_at_unix_secs?: number;
  archived?: boolean;
}

export interface AgentDetail extends AgentSummary {
  conversation_config: Record<string, unknown>;
  platform_settings?: Record<string, unknown>;
  metadata?: { created_at_unix_secs?: number; updated_at_unix_secs?: number };
  phone_numbers?: Array<{ phone_number: string; phone_number_id: string }>;
  version_id?: string;
}

export interface ToolSummary {
  id: string;
  tool_config: { name: string; type: string; description?: string } & Record<string, unknown>;
}

export interface KnowledgeDocumentSummary {
  id: string;
  name: string;
  type?: string;
}

export interface ConversationSummary {
  conversation_id: string;
  agent_id: string;
  start_time_unix_secs: number;
  call_duration_secs: number;
  status: string;
  call_successful?: string;
  message_count?: number;
}

export interface ConversationDetail extends Record<string, unknown> {
  conversation_id: string;
  agent_id: string;
  status: string;
  transcript: Array<Record<string, unknown>>;
  metadata?: Record<string, unknown>;
  analysis?: Record<string, unknown>;
}

export interface TestSummary {
  id: string;
  name: string;
  type?: string;
}

export interface TestRunInvocation {
  id: string;
  test_runs: Array<Record<string, unknown>>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export class ElevenLabsClient {
  private readonly fetchImpl: typeof fetch;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(private readonly options: ElevenLabsClientOptions) {
    if (!options.apiKey) throw new Error('ElevenLabs API key is required');
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.baseUrl = (options.baseUrl ?? ELEVENLABS_API_BASE).replace(/\/$/, '');
    this.timeoutMs = options.timeoutMs ?? 30_000;
  }

  private async request<T>(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', path: string, action: ProviderAction, body?: unknown, validate?: (value: unknown) => value is T): Promise<T> {
    const endpoint = `${method} ${path.split('?')[0]}`;
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, this.timeoutMs);
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method,
        headers: { 'xi-api-key': this.options.apiKey, ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch (error) {
      // A transport failure must never surface the request we sent (it carries the API key header).
      throw new ElevenLabsTransportError(endpoint, action, timedOut, error);
    } finally {
      clearTimeout(timer);
    }
    const text = await response.text();
    let parsed: unknown = null;
    if (text) {
      try { parsed = JSON.parse(text); } catch { parsed = text; }
    }
    if (!response.ok) throw new ElevenLabsApiError(response.status, endpoint, parsed, action);
    if (validate && !validate(parsed)) throw new ElevenLabsApiError(response.status, endpoint, { reason: 'unexpected response shape' }, action);
    return parsed as T;
  }

  /* ---------------------------------------------------------------- agents */

  listAgents(params: { search?: string; pageSize?: number } = {}): Promise<{ agents: AgentSummary[]; has_more: boolean }> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    query.set('page_size', String(params.pageSize ?? 100));
    return this.request('GET', `/v1/convai/agents?${query.toString()}`, 'list_agents', undefined, (v): v is { agents: AgentSummary[]; has_more: boolean } => isRecord(v) && Array.isArray(v.agents));
  }

  getAgent(agentId: string): Promise<AgentDetail> {
    return this.request('GET', `/v1/convai/agents/${encodeURIComponent(agentId)}`, 'read_agent', undefined, (v): v is AgentDetail => isRecord(v) && typeof v.agent_id === 'string' && isRecord(v.conversation_config));
  }

  createAgent(body: Record<string, unknown>): Promise<{ agent_id: string }> {
    return this.request('POST', '/v1/convai/agents/create', 'create_agent', body, (v): v is { agent_id: string } => isRecord(v) && typeof v.agent_id === 'string');
  }

  updateAgent(agentId: string, body: Record<string, unknown>): Promise<AgentDetail> {
    return this.request('PATCH', `/v1/convai/agents/${encodeURIComponent(agentId)}`, 'update_agent', body, (v): v is AgentDetail => isRecord(v) && typeof v.agent_id === 'string');
  }

  /* ---------------------------------------------------------------- tools */

  listTools(): Promise<{ tools: ToolSummary[] }> {
    return this.request('GET', '/v1/convai/tools?page_size=100', 'list_tools', undefined, (v): v is { tools: ToolSummary[] } => isRecord(v) && Array.isArray(v.tools));
  }

  createTool(toolConfig: Record<string, unknown>): Promise<ToolSummary> {
    return this.request('POST', '/v1/convai/tools', 'create_tool', { tool_config: toolConfig }, (v): v is ToolSummary => isRecord(v) && typeof v.id === 'string');
  }

  updateTool(toolId: string, toolConfig: Record<string, unknown>): Promise<ToolSummary> {
    return this.request('PATCH', `/v1/convai/tools/${encodeURIComponent(toolId)}`, 'update_tool', { tool_config: toolConfig }, (v): v is ToolSummary => isRecord(v) && typeof v.id === 'string');
  }

  deleteTool(toolId: string): Promise<unknown> {
    return this.request('DELETE', `/v1/convai/tools/${encodeURIComponent(toolId)}`, 'update_tool');
  }

  /* ---------------------------------------------------------------- secrets */

  /** Workspace secret used by webhook tools for the Authorization header; the value is never readable back. */
  createSecret(name: string, value: string): Promise<{ secret_id: string }> {
    return this.request('POST', '/v1/convai/secrets', 'create_workspace_secret', { name, value }, (v): v is { secret_id: string } => isRecord(v) && typeof v.secret_id === 'string');
  }

  /** Names and ids only — the provider never returns a secret value. */
  listSecrets(): Promise<{ secrets: Array<{ secret_id: string; name: string }> }> {
    return this.request('GET', '/v1/convai/secrets', 'create_workspace_secret', undefined, (v): v is { secrets: Array<{ secret_id: string; name: string }> } => isRecord(v) && Array.isArray(v.secrets));
  }

  /** Used to retire the secret a rotation replaced; failures are non-fatal for the caller. */
  deleteSecret(secretId: string): Promise<unknown> {
    return this.request('DELETE', `/v1/convai/secrets/${encodeURIComponent(secretId)}`, 'create_workspace_secret');
  }

  /* ---------------------------------------------------------------- knowledge base */

  listKnowledgeBase(): Promise<{ documents: KnowledgeDocumentSummary[] }> {
    return this.request('GET', '/v1/convai/knowledge-base?page_size=100', 'list_knowledge', undefined, (v): v is { documents: KnowledgeDocumentSummary[] } => isRecord(v) && Array.isArray(v.documents));
  }

  createKnowledgeText(name: string, text: string): Promise<KnowledgeDocumentSummary> {
    return this.request('POST', '/v1/convai/knowledge-base/text', 'create_knowledge', { name, text }, (v): v is KnowledgeDocumentSummary => isRecord(v) && typeof v.id === 'string');
  }

  createKnowledgeUrl(name: string, url: string): Promise<KnowledgeDocumentSummary> {
    return this.request('POST', '/v1/convai/knowledge-base/url', 'create_knowledge', { name, url }, (v): v is KnowledgeDocumentSummary => isRecord(v) && typeof v.id === 'string');
  }

  deleteKnowledgeDocument(documentId: string): Promise<unknown> {
    return this.request('DELETE', `/v1/convai/knowledge-base/${encodeURIComponent(documentId)}`, 'delete_knowledge');
  }

  /* ---------------------------------------------------------------- conversations */

  listConversations(params: { agentId: string; pageSize?: number; cursor?: string }): Promise<{ conversations: ConversationSummary[]; has_more: boolean; next_cursor?: string }> {
    const query = new URLSearchParams({ agent_id: params.agentId, page_size: String(params.pageSize ?? 30) });
    if (params.cursor) query.set('cursor', params.cursor);
    return this.request('GET', `/v1/convai/conversations?${query.toString()}`, 'list_conversations', undefined, (v): v is { conversations: ConversationSummary[]; has_more: boolean } => isRecord(v) && Array.isArray(v.conversations));
  }

  getConversation(conversationId: string): Promise<ConversationDetail> {
    return this.request('GET', `/v1/convai/conversations/${encodeURIComponent(conversationId)}`, 'list_conversations', undefined, (v): v is ConversationDetail => isRecord(v) && typeof v.conversation_id === 'string' && Array.isArray(v.transcript));
  }

  /* ---------------------------------------------------------------- tests */

  listTests(params: { search?: string } = {}): Promise<{ tests: TestSummary[] }> {
    const query = new URLSearchParams({ page_size: '100' });
    if (params.search) query.set('search', params.search);
    return this.request('GET', `/v1/convai/agent-testing?${query.toString()}`, 'read_test_invocation', undefined, (v): v is { tests: TestSummary[] } => isRecord(v) && Array.isArray(v.tests));
  }

  createTest(body: Record<string, unknown>): Promise<{ id: string }> {
    return this.request('POST', '/v1/convai/agent-testing/create', 'create_test', body, (v): v is { id: string } => isRecord(v) && typeof v.id === 'string');
  }

  deleteTest(testId: string): Promise<unknown> {
    return this.request('DELETE', `/v1/convai/agent-testing/${encodeURIComponent(testId)}`, 'delete_test');
  }

  runTests(agentId: string, testIds: string[]): Promise<TestRunInvocation> {
    return this.request('POST', `/v1/convai/agents/${encodeURIComponent(agentId)}/run-tests`, 'run_tests', { tests: testIds.map((test_id) => ({ test_id })) }, (v): v is TestRunInvocation => isRecord(v) && typeof v.id === 'string' && Array.isArray(v.test_runs));
  }

  getTestInvocation(invocationId: string): Promise<TestRunInvocation> {
    return this.request('GET', `/v1/convai/test-invocations/${encodeURIComponent(invocationId)}`, 'read_test_invocation', undefined, (v): v is TestRunInvocation => isRecord(v) && typeof v.id === 'string' && Array.isArray(v.test_runs));
  }

  /** Runs a simulated conversation against the agent (LLM plays the caller). Returns transcript + analysis. */
  simulateConversation(agentId: string, body: Record<string, unknown>): Promise<{ simulated_conversation: Array<Record<string, unknown>>; analysis?: Record<string, unknown> }> {
    return this.request('POST', `/v1/convai/agents/${encodeURIComponent(agentId)}/simulate-conversation`, 'run_tests', body, (v): v is { simulated_conversation: Array<Record<string, unknown>> } => isRecord(v) && Array.isArray(v.simulated_conversation));
  }
}
