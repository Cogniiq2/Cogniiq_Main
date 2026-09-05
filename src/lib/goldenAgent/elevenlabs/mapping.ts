// Golden Agent — ClientConfig → ElevenLabs configuration mapping.
//
// Pure functions producing the request bodies the ElevenLabs API expects. Nothing here talks to
// the network, so the exact configuration an agent will receive is unit-testable and can be shown
// in the dashboard as a diff before it is applied.

import type { ClientConfig, DeploymentStage } from '../clientConfig.ts';
import type { ComposedPrompt } from '../prompt.ts';
import { TOOL_DEFINITIONS, TOOL_NAMES } from '../toolContracts.ts';
import type { ParamSpec, ToolName } from '../toolContracts.ts';

/** Default voice when the client config has none: the voice used by the existing Cogniiq master agent. */
export const DEFAULT_VOICE_ID = 'cllvQaMvj0ZKxH88HGEn';
export const DEFAULT_LLM = 'gemini-2.5-flash';
export const DEFAULT_TTS_MODEL = 'eleven_flash_v2_5';

export const COGNIIQ_AGENT_TAG = 'cogniiq-golden-agent';

export function agentDisplayName(config: ClientConfig, stage: DeploymentStage = config.stage): string {
  return `Cogniiq · ${config.companyName} · ${stage.toUpperCase()}`;
}

export function toolResourceName(config: ClientConfig, tool: ToolName): string {
  // ElevenLabs tool names: ^[a-zA-Z0-9_-]{1,64}$ and the LLM sees them, so the universal tool name
  // must stay the visible prefix; the client suffix keeps workspace-level uniqueness.
  const suffix = config.clientId.replace(/-/g, '').slice(0, 8);
  return `${tool}__${suffix}`.slice(0, 64);
}

/** The LLM-visible tool name must be the universal one; the suffix is stripped by the runtime. */
export function universalToolName(resourceName: string): ToolName | null {
  const base = resourceName.split('__')[0];
  return (TOOL_NAMES as readonly string[]).includes(base) ? (base as ToolName) : null;
}

function paramToSchema(spec: ParamSpec): Record<string, unknown> {
  const schema: Record<string, unknown> = { type: spec.type, description: spec.description };
  if (spec.enum) schema.enum = [...spec.enum];
  return schema;
}

export interface WebhookToolTarget {
  /** Public URL of the receptionist-tools edge function, e.g. https://<ref>.supabase.co/functions/v1/receptionist-tools */
  endpointUrl: string;
  /** Either a workspace secret reference or a literal bearer token (dev only). */
  authorization: { secret_id: string } | { bearer: string };
}

export function buildWebhookToolConfig(config: ClientConfig, tool: ToolName, target: WebhookToolTarget): Record<string, unknown> {
  const definition = TOOL_DEFINITIONS[tool];
  const properties: Record<string, unknown> = {};
  const required: string[] = [];
  for (const [name, spec] of Object.entries(definition.params)) {
    properties[name] = paramToSchema(spec);
    if (spec.required) required.push(name);
  }
  const authHeader = 'secret_id' in target.authorization ? { secret_id: target.authorization.secret_id } : `Bearer ${target.authorization.bearer}`;
  return {
    type: 'webhook',
    name: toolResourceName(config, tool),
    description: definition.description,
    response_timeout_secs: Math.max(5, definition.timeoutSeconds),
    // Write tools must not be interrupted mid-flight; the caller hearing silence for 2s is better
    // than a double booking after an interruption-triggered retry.
    interruption_mode: definition.class === 'read' || definition.class === 'telemetry' ? 'allow' : 'disable_during_tool',
    execution_mode: definition.class === 'telemetry' ? 'async' : 'immediate',
    tool_error_handling_mode: 'hide',
    api_schema: {
      url: `${target.endpointUrl.replace(/\/$/, '')}/${tool}`,
      method: 'POST',
      content_type: 'application/json',
      request_headers: {
        Authorization: authHeader,
        'X-Cogniiq-Conversation': { variable_name: 'system__conversation_id' },
        'X-Cogniiq-Tool': tool,
      },
      request_body_schema: { type: 'object', description: '', properties, required },
    },
  };
}

export interface AgentBodyInput {
  config: ClientConfig;
  prompt: ComposedPrompt;
  toolIds: string[];
  knowledgeBase: Array<{ id: string; name: string; type: 'text' | 'url' | 'file' }>;
  stage?: DeploymentStage;
  /** Post-call webhook is configured at workspace level in ElevenLabs; recorded here for completeness. */
  postCallWebhookEnabled?: boolean;
}

export function buildAgentBody(input: AgentBodyInput): Record<string, unknown> {
  const { config, prompt, toolIds, knowledgeBase } = input;
  const stage = input.stage ?? config.stage;
  const voice = config.voice;
  return {
    name: agentDisplayName(config, stage),
    tags: [COGNIIQ_AGENT_TAG, `stage:${stage}`, `client:${config.clientId}`],
    conversation_config: {
      agent: {
        first_message: prompt.firstMessage,
        language: config.primaryLanguage,
        dynamic_variables: { dynamic_variable_placeholders: {} },
        prompt: {
          prompt: prompt.systemPrompt,
          llm: DEFAULT_LLM,
          temperature: 0.2,
          max_tokens: 220,
          tool_ids: toolIds,
          built_in_tools: {
            end_call: { type: 'system', name: 'end_call', params: { system_tool_type: 'end_call' } },
            ...(config.additionalLanguages.length > 0 ? { language_detection: { type: 'system', name: 'language_detection', params: { system_tool_type: 'language_detection' } } } : {}),
            ...(config.escalationContacts.some((c) => c.phone) ? {
              transfer_to_number: {
                type: 'system', name: 'transfer_to_number',
                description: 'Verbindet den Anrufer mit einem Mitarbeiter. Nur nach escalate_to_human mit action=transfer verwenden.',
                params: {
                  system_tool_type: 'transfer_to_number',
                  transfers: config.escalationContacts.filter((c) => c.phone).map((c) => ({
                    transfer_destination: { type: 'phone', phone_number: c.phone },
                    condition: `${c.label}: ${c.when}`,
                    transfer_type: 'conference',
                  })),
                },
              },
            } : {}),
          },
          knowledge_base: knowledgeBase.map((doc) => ({ type: doc.type, name: doc.name, id: doc.id, usage_mode: 'auto' })),
          rag: { enabled: knowledgeBase.length > 0, max_vector_distance: 0.6, max_documents_length: 50_000, max_retrieved_rag_chunks_count: 12 },
          ignore_default_personality: true,
          timezone: config.timezone,
          enable_parallel_tool_calls: false,
        },
      },
      tts: {
        voice_id: voice.voiceId ?? DEFAULT_VOICE_ID,
        model_id: voice.ttsModel ?? DEFAULT_TTS_MODEL,
        stability: voice.stability ?? 0.5,
        similarity_boost: voice.similarityBoost ?? 0.8,
        speed: voice.speed ?? 1,
        text_normalisation_type: 'system_prompt',
        expressive_mode: (voice.ttsModel ?? DEFAULT_TTS_MODEL) === 'eleven_v3_conversational',
      },
      asr: {
        quality: 'high',
        provider: 'scribe_realtime',
        user_input_audio_format: 'pcm_16000',
        keywords: [...new Set([...config.services.map((s) => s.name), ...config.locations.map((l) => l.name), ...(config.pronunciation ?? []).map((p) => p.text)])].slice(0, 100),
      },
      turn: { turn_timeout: 7, silence_end_call_timeout: 25, mode: 'turn', turn_eagerness: 'normal', spelling_patience: 'auto' },
      conversation: { max_duration_seconds: 900, text_only: false, client_events: ['audio', 'interruption', 'user_transcript', 'agent_response', 'agent_response_correction'] },
      language_presets: {},
    },
    platform_settings: {
      auth: { enable_auth: stage === 'live', allowlist: [] },
      privacy: {
        record_voice: stage !== 'live',
        retention_days: stage === 'live' ? 30 : 7,
        delete_transcript_and_pii: false,
        delete_audio: stage === 'live',
        zero_retention_mode: false,
      },
      call_limits: { agent_concurrency_limit: stage === 'live' ? -1 : 2, daily_limit: stage === 'live' ? 2000 : 100, bursting_enabled: false },
      guardrails: {
        version: '1',
        prompt_injection: { is_enabled: true },
        content: {
          execution_mode: 'streaming',
          config: { self_harm: { is_enabled: true, threshold: 'medium' }, harassment: { is_enabled: false, threshold: 'medium' } },
          trigger_action: { type: 'retry' },
        },
      },
      evaluation: {
        criteria: [
          { id: 'task_completed', name: 'Anliegen erledigt', conversation_goal_prompt: 'Wurde das Anliegen des Anrufers vollständig erledigt oder korrekt an einen Menschen/Rückruf übergeben?' },
          { id: 'no_invented_success', name: 'Kein erfundener Erfolg', conversation_goal_prompt: 'Hat der Assistent an keiner Stelle behauptet, ein Termin sei gebucht, verschoben oder storniert, ohne dass ein Tool das zuvor bestätigt hat?' },
          { id: 'confirmed_before_write', name: 'Bestätigung vor Aktion', conversation_goal_prompt: 'Hat der Assistent vor jeder Buchung, Umbuchung oder Stornierung den Termin vollständig vorgelesen und ein ausdrückliches Ja erhalten?' },
          { id: 'privacy_respected', name: 'Datenschutz eingehalten', conversation_goal_prompt: 'Hat der Assistent keine Daten Dritter herausgegeben und vor persönlichen Daten die Identität geprüft?' },
        ],
      },
      workspace_overrides: { webhooks: { events: ['transcript'], transcript_format: 'json', send_audio: false } },
      trust_context: 'low',
    },
  };
}

/** Which fields of a stored agent we own and re-apply on every sync (everything else stays as edited in the ElevenLabs UI). */
export function extractManagedSnapshot(agent: { conversation_config: Record<string, unknown>; name?: string; tags?: string[] }): Record<string, unknown> {
  const conversation = agent.conversation_config;
  const agentConfig = (conversation.agent ?? {}) as Record<string, unknown>;
  const promptConfig = (agentConfig.prompt ?? {}) as Record<string, unknown>;
  const tts = (conversation.tts ?? {}) as Record<string, unknown>;
  return {
    name: agent.name,
    tags: agent.tags ?? [],
    first_message: agentConfig.first_message,
    language: agentConfig.language,
    prompt_length: typeof promptConfig.prompt === 'string' ? promptConfig.prompt.length : 0,
    llm: promptConfig.llm,
    tool_ids: promptConfig.tool_ids ?? [],
    knowledge_base: promptConfig.knowledge_base ?? [],
    voice_id: tts.voice_id,
    tts_model: tts.model_id,
  };
}
