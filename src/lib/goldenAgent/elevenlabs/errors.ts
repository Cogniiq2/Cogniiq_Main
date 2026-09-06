// Golden Agent — provider error classification.
//
// Everything that goes wrong against the ElevenLabs API arrives here and leaves as ONE of a small
// set of kinds plus an operator-safe sentence. Three rules hold without exception:
//
//   1. No credential ever appears in a classified message. The API key is never part of a request
//      body or URL we build, but provider payloads can echo header names and partial tokens, so
//      every string that reaches an operator is scrubbed.
//   2. The HTTP status and the action are preserved, because "401 while creating the workspace
//      secret" and "401 while creating the agent" need different manual fixes.
//   3. The message says what a human should DO, not what the transport did.
//
// The result of `classifyProviderError` is safe to persist in `ai_receptionists.last_sync_error`
// and to render in the dashboard.

import { ElevenLabsApiError, ElevenLabsTransportError } from './client.ts';

export type ProviderErrorKind =
  | 'authentication'
  | 'permission'
  | 'rate_limited'
  | 'invalid_request'
  | 'not_found'
  | 'conflict'
  | 'provider_outage'
  | 'timeout'
  | 'network'
  | 'unknown';

/**
 * The provisioning step an API call belongs to. Used to turn a bare status into an instruction, so
 * an operator does not have to know which endpoint backs which button.
 */
export type ProviderAction =
  | 'create_workspace_secret'
  | 'create_tool'
  | 'update_tool'
  | 'list_tools'
  | 'create_knowledge'
  | 'delete_knowledge'
  | 'list_knowledge'
  | 'create_agent'
  | 'update_agent'
  | 'read_agent'
  | 'list_agents'
  | 'list_conversations'
  | 'create_test'
  | 'delete_test'
  | 'run_tests'
  | 'read_test_invocation'
  | 'provider_call';

const ACTION_LABEL: Record<ProviderAction, string> = {
  create_workspace_secret: 'creating the workspace tool secret',
  create_tool: 'creating a webhook tool',
  update_tool: 'updating a webhook tool',
  list_tools: 'listing the workspace tools',
  create_knowledge: 'creating a knowledge base document',
  delete_knowledge: 'deleting a superseded knowledge base document',
  list_knowledge: 'listing the knowledge base',
  create_agent: 'creating the agent',
  update_agent: 'updating the agent',
  read_agent: 'reading the agent',
  list_agents: 'listing the workspace agents',
  list_conversations: 'listing conversations',
  create_test: 'creating a simulation test',
  delete_test: 'deleting a superseded simulation test',
  run_tests: 'starting the simulation run',
  read_test_invocation: 'reading the simulation results',
  provider_call: 'calling the provider',
};

/**
 * The permission each action needs in the ElevenLabs API key. Named exactly as the workspace UI
 * names them so the operator can find the toggle.
 */
const ACTION_PERMISSION: Partial<Record<ProviderAction, string>> = {
  create_workspace_secret: 'Workspace Secrets (write)',
  create_tool: 'Agents Platform / Tools (write)',
  update_tool: 'Agents Platform / Tools (write)',
  list_tools: 'Agents Platform / Tools (read)',
  create_knowledge: 'Agents Platform / Knowledge Base (write)',
  delete_knowledge: 'Agents Platform / Knowledge Base (write)',
  list_knowledge: 'Agents Platform / Knowledge Base (read)',
  create_agent: 'Agents Platform / Agents (write)',
  update_agent: 'Agents Platform / Agents (write)',
  read_agent: 'Agents Platform / Agents (read)',
  list_agents: 'Agents Platform / Agents (read)',
  list_conversations: 'Agents Platform / Conversations (read)',
  create_test: 'Agents Platform / Tests (write)',
  delete_test: 'Agents Platform / Tests (write)',
  run_tests: 'Agents Platform / Tests (write)',
  read_test_invocation: 'Agents Platform / Tests (read)',
};

export interface ClassifiedProviderError {
  kind: ProviderErrorKind;
  /** HTTP status when the provider answered; 0 for transport failures. */
  status: number;
  action: ProviderAction;
  /** One sentence an operator can act on. Safe to persist and to show in a browser. */
  message: string;
  /** Short provider-supplied detail, scrubbed and truncated. Empty when nothing safe was available. */
  providerDetail?: string;
  /** Whether an unchanged retry could plausibly succeed. */
  retryable: boolean;
}

/**
 * Removes anything credential-shaped from a provider string before it is shown or stored. Errs
 * heavily on the side of deletion: an unreadable message is better than a leaked key.
 */
export function scrubProviderText(input: string): string {
  return input
    .replace(/\b(?:sk|xi)[-_][A-Za-z0-9_-]{8,}/g, '[redacted]')
    .replace(/\bcqr_[0-9a-f]{8,}/g, '[redacted]')
    .replace(/\b[0-9a-f]{32,}\b/g, '[redacted]')
    .replace(/(xi-api-key|authorization|api[_-]?key|secret|token|password)(\s*[:=]\s*)("?)[^\s",}]+/gi, '$1$2[redacted]')
    .replace(/\s+/g, ' ')
    .trim();
}

function detailFrom(body: unknown): string | undefined {
  const pick = (value: unknown, depth = 0): string | undefined => {
    if (depth > 3) return undefined;
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) {
      for (const entry of value) {
        const found = pick(entry, depth + 1);
        if (found) return found;
      }
      return undefined;
    }
    if (typeof value === 'object' && value !== null) {
      const record = value as Record<string, unknown>;
      for (const key of ['message', 'detail', 'error', 'reason', 'description']) {
        const found = pick(record[key], depth + 1);
        if (found) return found;
      }
      return undefined;
    }
    return undefined;
  };
  const raw = pick(body);
  if (!raw) return undefined;
  const clean = scrubProviderText(raw).slice(0, 160);
  return clean.length > 0 ? clean : undefined;
}

function kindForStatus(status: number): ProviderErrorKind {
  if (status === 401) return 'authentication';
  if (status === 403) return 'permission';
  if (status === 404) return 'not_found';
  if (status === 409) return 'conflict';
  if (status === 408) return 'timeout';
  if (status === 429) return 'rate_limited';
  if (status === 400 || status === 422) return 'invalid_request';
  if (status >= 500) return 'provider_outage';
  return 'unknown';
}

function sentenceFor(kind: ProviderErrorKind, action: ProviderAction, status: number): string {
  const what = ACTION_LABEL[action];
  const permission = ACTION_PERMISSION[action];
  switch (kind) {
    case 'authentication':
    case 'permission':
      return `ElevenLabs ${kind === 'authentication' ? 'authentication' : 'permission'} failure (HTTP ${status}) while ${what}. Verify that ELEVENLABS_API_KEY is valid, not expired, and${permission ? ` has the "${permission}" permission` : ' has permission for this operation'}. Nothing was changed on the provider side by this call.`;
    case 'rate_limited':
      return `ElevenLabs rate limit (HTTP ${status}) while ${what}. Wait a moment and run the provisioning again; it resumes from the resources that already exist.`;
    case 'invalid_request':
      return `ElevenLabs rejected the request (HTTP ${status}) while ${what}. This is a configuration or mapping problem, not a permission problem — check the ClientConfig and the generated plan.`;
    case 'not_found':
      return `ElevenLabs reported "not found" (HTTP ${status}) while ${what}. A resource this receptionist points at was deleted in the workspace; run the provisioning again to recreate it.`;
    case 'conflict':
      return `ElevenLabs reported a conflict (HTTP ${status}) while ${what}. A resource with the same managed name already exists; run the provisioning again so it is adopted instead of recreated.`;
    case 'provider_outage':
      return `ElevenLabs is currently failing (HTTP ${status}) while ${what}. This is a provider-side error; retry later.`;
    case 'timeout':
      return `The request to ElevenLabs timed out while ${what}. Retry; already created resources are reused.`;
    case 'network':
      return `The Cogniiq backend could not reach ElevenLabs while ${what}. Check outbound connectivity and retry.`;
    case 'unknown':
      return status
        ? `ElevenLabs returned an unexpected error (HTTP ${status}) while ${what}.`
        : `The provisioning step failed while ${what}. This is not a provider HTTP error — see the detail below.`;
  }
}

const RETRYABLE: ReadonlySet<ProviderErrorKind> = new Set<ProviderErrorKind>(['rate_limited', 'provider_outage', 'timeout', 'network', 'conflict', 'not_found']);

export function classifyProviderError(error: unknown, action: ProviderAction = 'provider_call'): ClassifiedProviderError {
  if (error instanceof ElevenLabsApiError) {
    const kind = kindForStatus(error.status);
    return {
      kind,
      status: error.status,
      action: error.action ?? action,
      message: sentenceFor(kind, error.action ?? action, error.status),
      providerDetail: detailFrom(error.body),
      retryable: RETRYABLE.has(kind),
    };
  }
  if (error instanceof ElevenLabsTransportError) {
    const kind: ProviderErrorKind = error.timedOut ? 'timeout' : 'network';
    return { kind, status: 0, action: error.action, message: sentenceFor(kind, error.action, 0), retryable: true };
  }
  const name = error instanceof Error ? error.name : '';
  const kind: ProviderErrorKind = name === 'AbortError' || name === 'TimeoutError' ? 'timeout' : name === 'TypeError' ? 'network' : 'unknown';
  return {
    kind,
    status: 0,
    action,
    message: sentenceFor(kind, action, 0),
    providerDetail: error instanceof Error ? scrubProviderText(error.message).slice(0, 160) : undefined,
    retryable: RETRYABLE.has(kind),
  };
}

/** The single string persisted in `last_sync_error` and rendered to the operator. */
export function operatorErrorText(classified: ClassifiedProviderError): string {
  return classified.providerDetail ? `${classified.message} Provider detail: ${classified.providerDetail}` : classified.message;
}

/**
 * Turns any thrown value into an operator-safe sentence. Non-provider failures (a database write,
 * a bug) keep their message but are scrubbed and truncated, never dumped raw into the browser.
 */
export function describeProvisioningFailure(error: unknown, action: ProviderAction = 'provider_call'): { classified: ClassifiedProviderError; text: string } {
  const classified = classifyProviderError(error, action);
  return { classified, text: operatorErrorText(classified).slice(0, 500) };
}
