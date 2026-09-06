// Golden Agent — receptionist-tools request handler.
//
// The single HTTPS endpoint every ElevenLabs webhook tool calls:
//   POST {base}/receptionist-tools/{tool_name}
//   Authorization: Bearer <binding token>     (workspace secret on the ElevenLabs side)
//   X-Cogniiq-Conversation: <conversation id> (dynamic variable; may be empty in tests)
//
// Tenant resolution is the whole point of this file: the tenant comes from the hashed bearer
// token → ai_receptionist_tool_bindings → ai_receptionists, never from the request body, the URL or
// anything the LLM can influence. The LLM only chooses the tool and its arguments; the runtime
// validates both.

import { assertClientConfig } from '../clientConfig.ts';
import type { ClientConfig } from '../clientConfig.ts';
import { MockBookingProvider } from '../adapters/mockBookingProvider.ts';
import { N8nBookingProvider } from '../adapters/n8nBookingProvider.ts';
import type { BookingProvider } from '../adapters/bookingProvider.ts';
import { ToolRuntime } from '../toolRuntime.ts';
import type { ToolCallEvent } from '../toolRuntime.ts';
import { contentFingerprint } from '../fingerprint.ts';
import { isToolName } from '../toolContracts.ts';
import { bearerFrom, jsonResponse, scrubForLog, sha256Hex } from './shared.ts';

export interface ToolBindingRecord {
  bindingId: string;
  receptionistId: string;
  organizationId: string;
  environment: 'dev' | 'staging' | 'live';
}

export interface ReceptionistRecord {
  id: string;
  organizationId: string;
  stage: string;
  clientConfig: unknown;
}

export interface CallEventRecord {
  receptionistId: string;
  organizationId: string;
  conversationId: string;
  eventType: 'tool_call' | 'conversation_event' | 'auth_failure' | 'system';
  toolName?: string;
  ok?: boolean;
  failureCode?: string;
  latencyMs?: number;
  intent?: string;
  detail?: string;
  payload?: Record<string, unknown>;
}

export interface ToolsHandlerDependencies {
  findBindingByTokenHash(tokenHash: string): Promise<ToolBindingRecord | null>;
  loadReceptionist(receptionistId: string): Promise<ReceptionistRecord | null>;
  recordEvent(event: CallEventRecord): Promise<void>;
  touchBinding?(bindingId: string): Promise<void>;
  /** Resolves a server-side secret by env var name (never returns it to the caller). */
  resolveSecret(envVarName: string): string | undefined;
  /** In-memory providers per receptionist so DEV conversations keep state across tool calls. */
  mockProviders?: Map<string, MockBookingProvider>;
  now?: () => Date;
}

export function providerForConfig(config: ClientConfig, deps: ToolsHandlerDependencies, receptionistId: string, onDiagnostic?: (message: string) => void): BookingProvider | { error: string } {
  const integration = config.bookingIntegration;
  switch (integration.provider) {
    case 'mock': {
      const cache = deps.mockProviders;
      if (cache) {
        const existing = cache.get(receptionistId);
        if (existing) return existing;
        const created = new MockBookingProvider();
        cache.set(receptionistId, created);
        return created;
      }
      return new MockBookingProvider();
    }
    case 'n8n_webhook': {
      if (!integration.baseUrl || !integration.secretEnvVar) return { error: 'n8n integration is not fully configured' };
      const secret = deps.resolveSecret(integration.secretEnvVar);
      if (!secret) return { error: `secret ${integration.secretEnvVar} is not set on the server` };
      return new N8nBookingProvider({ baseUrl: integration.baseUrl, secret, onDiagnostic });
    }
    case 'none':
      return new MockBookingProvider({ faults: {} });
  }
}

const runtimeCache = new WeakMap<ToolsHandlerDependencies, Map<string, { fingerprint: string; runtime: ToolRuntime }>>();

export async function handleToolsRequest(request: Request, deps: ToolsHandlerDependencies): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response('ok', { status: 200 });
  if (request.method !== 'POST') return jsonResponse({ ok: false, code: 'method_not_allowed', message: 'POST only' }, 405);

  const url = new URL(request.url);
  const toolFromPath = url.pathname.split('/').filter(Boolean).pop() ?? '';
  const toolFromHeader = request.headers.get('X-Cogniiq-Tool') ?? '';
  const tool = isToolName(toolFromPath) ? toolFromPath : toolFromHeader;

  const token = bearerFrom(request.headers.get('Authorization'));
  if (!token) return jsonResponse({ ok: false, code: 'unauthorized', message: 'missing bearer token' }, 401);
  const binding = await deps.findBindingByTokenHash(await sha256Hex(token));
  if (!binding) {
    // Unknown token: do not reveal whether the tool or receptionist exists.
    return jsonResponse({ ok: false, code: 'unauthorized', message: 'invalid token' }, 401);
  }
  const receptionist = await deps.loadReceptionist(binding.receptionistId);
  if (!receptionist || receptionist.organizationId !== binding.organizationId) {
    await deps.recordEvent({ receptionistId: binding.receptionistId, organizationId: binding.organizationId, conversationId: 'unknown', eventType: 'auth_failure', detail: 'binding does not match receptionist' });
    return jsonResponse({ ok: false, code: 'unauthorized', message: 'invalid binding' }, 401);
  }
  if (receptionist.stage === 'paused') {
    return jsonResponse({ ok: false, code: 'provider_unavailable', message: 'Dieser Assistent ist derzeit pausiert.', retryable: false, next_action: 'offer_callback' }, 200);
  }
  // DEV/staging bindings must never reach a live receptionist and vice versa.
  const stageEnvironment = receptionist.stage === 'live' ? 'live' : receptionist.stage === 'staging' ? 'staging' : 'dev';
  if (binding.environment !== stageEnvironment) {
    await deps.recordEvent({ receptionistId: receptionist.id, organizationId: receptionist.organizationId, conversationId: 'unknown', eventType: 'auth_failure', detail: `environment mismatch ${binding.environment}≠${stageEnvironment}` });
    return jsonResponse({ ok: false, code: 'unauthorized', message: 'environment mismatch' }, 401);
  }

  let config: ClientConfig;
  try {
    config = assertClientConfig(receptionist.clientConfig);
  } catch (error) {
    await deps.recordEvent({ receptionistId: receptionist.id, organizationId: receptionist.organizationId, conversationId: 'unknown', eventType: 'system', detail: `invalid stored config: ${(error as Error).message.slice(0, 200)}` });
    return jsonResponse({ ok: false, code: 'provider_unavailable', message: 'Die Konfiguration ist unvollständig.', retryable: false, next_action: 'offer_callback' }, 200);
  }
  if (config.clientId !== receptionist.organizationId) {
    return jsonResponse({ ok: false, code: 'unauthorized', message: 'tenant mismatch' }, 401);
  }

  let body: unknown = {};
  try {
    const text = await request.text();
    body = text ? JSON.parse(text) : {};
  } catch {
    return jsonResponse({ ok: false, code: 'invalid_arguments', message: 'Ungültige Anfrage.', retryable: false, next_action: 'ask_caller' }, 200);
  }
  const conversationId = request.headers.get('X-Cogniiq-Conversation')?.trim() || (typeof (body as Record<string, unknown>).conversation_id === 'string' ? String((body as Record<string, unknown>).conversation_id) : '') || 'no-conversation';

  // Integration diagnostics are written as system events (operator-visible) and never returned to
  // the voice runtime, so a misconfigured n8n secret cannot become something the agent says.
  const diagnostics: string[] = [];
  const provider = providerForConfig(config, deps, receptionist.id, (message) => { diagnostics.push(message); });
  if ('error' in provider) {
    await deps.recordEvent({ receptionistId: receptionist.id, organizationId: receptionist.organizationId, conversationId, eventType: 'system', detail: provider.error });
    return jsonResponse({ ok: false, code: 'provider_unavailable', message: 'Das Buchungssystem ist nicht angebunden.', retryable: false, next_action: 'offer_callback' }, 200);
  }

  const onEvent = async (event: ToolCallEvent) => {
    await deps.recordEvent({
      receptionistId: receptionist.id, organizationId: receptionist.organizationId, conversationId: event.conversationId,
      eventType: event.tool === 'log_conversation_event' ? 'conversation_event' : 'tool_call',
      toolName: event.tool, ok: event.ok, failureCode: event.failureCode, latencyMs: event.latencyMs,
      intent: event.reported?.intent, detail: scrubForLog(event.reported?.detail ?? event.reported?.event_type),
      payload: event.deduplicated ? { deduplicated: true } : {},
    });
  };

  // One runtime per receptionist + config fingerprint so idempotency keys and mock state survive across calls.
  const perDeps = runtimeCache.get(deps) ?? new Map();
  runtimeCache.set(deps, perDeps);
  // A content hash, not a length: two different configurations of the same size must not share a
  // cached runtime, or a saved configuration change would silently not take effect.
  const fingerprint = `${receptionist.id}:${contentFingerprint(JSON.stringify(receptionist.clientConfig))}`;
  let entry = perDeps.get(receptionist.id);
  if (!entry || entry.fingerprint !== fingerprint) {
    entry = { fingerprint, runtime: new ToolRuntime(config, { provider, onEvent, now: deps.now, hash: sha256Hex }) };
    perDeps.set(receptionist.id, entry);
  }
  const result = await entry.runtime.execute({ conversationId, tool, arguments: body });
  for (const message of diagnostics.splice(0)) {
    await deps.recordEvent({ receptionistId: receptionist.id, organizationId: receptionist.organizationId, conversationId, eventType: 'system', toolName: isToolName(tool) ? tool : undefined, detail: message.slice(0, 480) });
  }
  await deps.touchBinding?.(binding.bindingId);
  return jsonResponse(result, 200);
}
