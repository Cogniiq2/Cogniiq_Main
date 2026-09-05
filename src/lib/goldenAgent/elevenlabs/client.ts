// Golden Agent — ElevenLabs Agents Platform REST client.
//
// Server-side only. The API key is passed in by the edge function from its environment; this
// module never reads env vars, never logs the key and is never imported by browser code (the
// dashboard talks to the `receptionist-admin` edge function, which uses this client).
//
// Kept deliberately thin: typed wrappers over the endpoints the factory needs, structural
// validation of responses, and one error type. Request/response shapes mirror the live workspace
// schemas inspected through the ElevenLabs connector (agents, tools, knowledge base, tests).

export const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io';

export class ElevenLabsApiError extends Error {
  constructor(readonly status: number, readonly endpoint: string, readonly body: unknown) {
    super(`ElevenLabs ${endpoint} failed with ${status}`);
    this.name = 'ElevenLabsApiError';
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

  private async request<T>(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', path: string, body?: unknown, validate?: (value: unknown) => value is T): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method,
        headers: { 'xi-api-key': this.options.apiKey, ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
    const text = await response.text();
    let parsed: unknown = null;
    if (text) {
      try { parsed = JSON.parse(text); } catch { parsed = text; }
    }
    if (!response.ok) throw new ElevenLabsApiError(response.status, `${method} ${path}`, parsed);
    if (validate && !validate(parsed)) throw new ElevenLabsApiError(response.status, `${method} ${path}`, { reason: 'unexpected response shape', parsed });
    return parsed as T;
  }

  /* ---------------------------------------------------------------- agents */

  listAgents(params: { search?: string; pageSize?: number } = {}): Promise<{ agents: AgentSummary[]; has_more: boolean }> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    query.set('page_size', String(params.pageSize ?? 100));
    return this.request('GET', `/v1/convai/agents?${query.toString()}`, undefined, (v): v is { agents: AgentSummary[]; has_more: boolean } => isRecord(v) && Array.isArray(v.agents));
  }

  getAgent(agentId: string): Promise<AgentDetail> {
    return this.request('GET', `/v1/convai/agents/${encodeURIComponent(agentId)}`, undefined, (v): v is AgentDetail => isRecord(v) && typeof v.agent_id === 'string' && isRecord(v.conversation_config));
  }

  createAgent(body: Record<string, unknown>): Promise<{ agent_id: string }> {
    return this.request('POST', '/v1/convai/agents/create', body, (v): v is { agent_id: string } => isRecord(v) && typeof v.agent_id === 'string');
  }

  updateAgent(agentId: string, body: Record<string, unknown>): Promise<AgentDetail> {
    return this.request('PATCH', `/v1/convai/agents/${encodeURIComponent(agentId)}`, body, (v): v is AgentDetail => isRecord(v) && typeof v.agent_id === 'string');
  }

  /* ---------------------------------------------------------------- tools */

  listTools(): Promise<{ tools: ToolSummary[] }> {
    return this.request('GET', '/v1/convai/tools?page_size=100', undefined, (v): v is { tools: ToolSummary[] } => isRecord(v) && Array.isArray(v.tools));
  }

  createTool(toolConfig: Record<string, unknown>): Promise<ToolSummary> {
    return this.request('POST', '/v1/convai/tools', { tool_config: toolConfig }, (v): v is ToolSummary => isRecord(v) && typeof v.id === 'string');
  }

  updateTool(toolId: string, toolConfig: Record<string, unknown>): Promise<ToolSummary> {
    return this.request('PATCH', `/v1/convai/tools/${encodeURIComponent(toolId)}`, { tool_config: toolConfig }, (v): v is ToolSummary => isRecord(v) && typeof v.id === 'string');
  }

  deleteTool(toolId: string): Promise<unknown> {
    return this.request('DELETE', `/v1/convai/tools/${encodeURIComponent(toolId)}`);
  }

  /* ---------------------------------------------------------------- secrets */

  /** Workspace secret used by webhook tools for the Authorization header; the value is never readable back. */
  createSecret(name: string, value: string): Promise<{ secret_id: string }> {
    return this.request('POST', '/v1/convai/secrets', { name, value }, (v): v is { secret_id: string } => isRecord(v) && typeof v.secret_id === 'string');
  }

  /* ---------------------------------------------------------------- knowledge base */

  listKnowledgeBase(): Promise<{ documents: KnowledgeDocumentSummary[] }> {
    return this.request('GET', '/v1/convai/knowledge-base?page_size=100', undefined, (v): v is { documents: KnowledgeDocumentSummary[] } => isRecord(v) && Array.isArray(v.documents));
  }

  createKnowledgeText(name: string, text: string): Promise<KnowledgeDocumentSummary> {
    return this.request('POST', '/v1/convai/knowledge-base/text', { name, text }, (v): v is KnowledgeDocumentSummary => isRecord(v) && typeof v.id === 'string');
  }

  createKnowledgeUrl(name: string, url: string): Promise<KnowledgeDocumentSummary> {
    return this.request('POST', '/v1/convai/knowledge-base/url', { name, url }, (v): v is KnowledgeDocumentSummary => isRecord(v) && typeof v.id === 'string');
  }

  deleteKnowledgeDocument(documentId: string): Promise<unknown> {
    return this.request('DELETE', `/v1/convai/knowledge-base/${encodeURIComponent(documentId)}`);
  }

  /* ---------------------------------------------------------------- conversations */

  listConversations(params: { agentId: string; pageSize?: number; cursor?: string }): Promise<{ conversations: ConversationSummary[]; has_more: boolean; next_cursor?: string }> {
    const query = new URLSearchParams({ agent_id: params.agentId, page_size: String(params.pageSize ?? 30) });
    if (params.cursor) query.set('cursor', params.cursor);
    return this.request('GET', `/v1/convai/conversations?${query.toString()}`, undefined, (v): v is { conversations: ConversationSummary[]; has_more: boolean } => isRecord(v) && Array.isArray(v.conversations));
  }

  getConversation(conversationId: string): Promise<ConversationDetail> {
    return this.request('GET', `/v1/convai/conversations/${encodeURIComponent(conversationId)}`, undefined, (v): v is ConversationDetail => isRecord(v) && typeof v.conversation_id === 'string' && Array.isArray(v.transcript));
  }

  /* ---------------------------------------------------------------- tests */

  listTests(params: { search?: string } = {}): Promise<{ tests: TestSummary[] }> {
    const query = new URLSearchParams({ page_size: '100' });
    if (params.search) query.set('search', params.search);
    return this.request('GET', `/v1/convai/agent-testing?${query.toString()}`, undefined, (v): v is { tests: TestSummary[] } => isRecord(v) && Array.isArray(v.tests));
  }

  createTest(body: Record<string, unknown>): Promise<{ id: string }> {
    return this.request('POST', '/v1/convai/agent-testing/create', body, (v): v is { id: string } => isRecord(v) && typeof v.id === 'string');
  }

  deleteTest(testId: string): Promise<unknown> {
    return this.request('DELETE', `/v1/convai/agent-testing/${encodeURIComponent(testId)}`);
  }

  runTests(agentId: string, testIds: string[]): Promise<TestRunInvocation> {
    return this.request('POST', `/v1/convai/agents/${encodeURIComponent(agentId)}/run-tests`, { tests: testIds.map((test_id) => ({ test_id })) }, (v): v is TestRunInvocation => isRecord(v) && typeof v.id === 'string' && Array.isArray(v.test_runs));
  }

  getTestInvocation(invocationId: string): Promise<TestRunInvocation> {
    return this.request('GET', `/v1/convai/test-invocations/${encodeURIComponent(invocationId)}`, undefined, (v): v is TestRunInvocation => isRecord(v) && typeof v.id === 'string' && Array.isArray(v.test_runs));
  }

  /** Runs a simulated conversation against the agent (LLM plays the caller). Returns transcript + analysis. */
  simulateConversation(agentId: string, body: Record<string, unknown>): Promise<{ simulated_conversation: Array<Record<string, unknown>>; analysis?: Record<string, unknown> }> {
    return this.request('POST', `/v1/convai/agents/${encodeURIComponent(agentId)}/simulate-conversation`, body, (v): v is { simulated_conversation: Array<Record<string, unknown>> } => isRecord(v) && Array.isArray(v.simulated_conversation));
  }
}
