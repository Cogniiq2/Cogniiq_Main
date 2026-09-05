// Golden Agent — receptionist-postcall request handler.
//
// Receives ElevenLabs post-call webhooks (type "post_call_transcription"), verifies the HMAC
// signature ("ElevenLabs-Signature: t=<unix>,v0=<hex hmac-sha256(secret, `${t}.${body}`)>"),
// maps the agent id to a receptionist and stores the call outcome plus PII-stripped tool events.
// Transcripts themselves are NOT stored here: the provider keeps them under its own retention;
// we keep outcomes, intents, tool statistics and the provider's short summary (bounded retention).

import { normaliseElevenLabsTranscript } from '../evaluation/elevenlabsEvaluation.ts';
import { detectOutcome } from '../evaluation/runner.ts';
import { hmacSha256Hex, isRecord, jsonResponse, scrubForLog, timingSafeEqual } from './shared.ts';

export interface PostCallDependencies {
  webhookSecret: string;
  findReceptionistByAgentId(agentId: string): Promise<{ id: string; organizationId: string; stage: string } | null>;
  upsertCall(call: {
    receptionistId: string; organizationId: string; conversationId: string; environment: 'dev' | 'staging' | 'live';
    startedAt?: string; durationSecs?: number; status: 'done' | 'failed' | 'unknown'; outcome: string;
    detectedIntents: string[]; toolCallCount: number; toolErrorCount: number; escalated: boolean; summary?: string; analysis: Record<string, unknown>;
  }): Promise<void>;
  recordEvents(events: Array<{ receptionistId: string; organizationId: string; conversationId: string; eventType: 'tool_call' | 'post_call'; toolName?: string; ok?: boolean; failureCode?: string; latencyMs?: number; detail?: string }>): Promise<void>;
  now?: () => number;
  /** Max age of the timestamp in seconds (replay protection). */
  toleranceSeconds?: number;
}

export function parseSignatureHeader(header: string | null): { timestamp: string; signature: string } | null {
  if (!header) return null;
  const parts = Object.fromEntries(header.split(',').map((part) => part.trim().split('=')).filter((pair) => pair.length === 2));
  if (typeof parts.t !== 'string' || typeof parts.v0 !== 'string') return null;
  return { timestamp: parts.t, signature: parts.v0 };
}

export async function verifyElevenLabsSignature(secret: string, header: string | null, body: string, nowSeconds: number, toleranceSeconds = 30 * 60): Promise<boolean> {
  const parsed = parseSignatureHeader(header);
  if (!parsed) return false;
  const timestamp = Number(parsed.timestamp);
  if (!Number.isFinite(timestamp) || Math.abs(nowSeconds - timestamp) > toleranceSeconds) return false;
  const expected = await hmacSha256Hex(secret, `${parsed.timestamp}.${body}`);
  return timingSafeEqual(expected, parsed.signature.toLowerCase());
}

export async function handlePostCallRequest(request: Request, deps: PostCallDependencies): Promise<Response> {
  if (request.method !== 'POST') return jsonResponse({ error: 'POST only' }, 405);
  if (!deps.webhookSecret) return jsonResponse({ error: 'webhook secret not configured' }, 500);
  const body = await request.text();
  const nowSeconds = Math.floor((deps.now?.() ?? Date.now()) / 1000);
  const valid = await verifyElevenLabsSignature(deps.webhookSecret, request.headers.get('ElevenLabs-Signature'), body, nowSeconds, deps.toleranceSeconds);
  if (!valid) return jsonResponse({ error: 'invalid signature' }, 401);

  let payload: unknown;
  try { payload = JSON.parse(body); } catch { return jsonResponse({ error: 'invalid json' }, 400); }
  if (!isRecord(payload) || !isRecord(payload.data)) return jsonResponse({ error: 'unexpected payload' }, 400);
  const type = String(payload.type ?? '');
  if (type !== 'post_call_transcription') return jsonResponse({ ok: true, ignored: type }, 200);
  const data = payload.data;
  const agentId = typeof data.agent_id === 'string' ? data.agent_id : '';
  const conversationId = typeof data.conversation_id === 'string' ? data.conversation_id : '';
  if (!agentId || !conversationId) return jsonResponse({ error: 'missing ids' }, 400);

  const receptionist = await deps.findReceptionistByAgentId(agentId);
  // Unknown agents (e.g. hand-made agents in the same workspace) are acknowledged, not stored.
  if (!receptionist) return jsonResponse({ ok: true, ignored: 'unknown agent' }, 200);

  const rawTranscript = Array.isArray(data.transcript) ? (data.transcript as Array<Record<string, unknown>>) : [];
  const transcript = normaliseElevenLabsTranscript(conversationId, rawTranscript, 'elevenlabs_conversation');
  const toolResults = transcript.turns.flatMap((turn) => turn.toolResults ?? []);
  const metadata = isRecord(data.metadata) ? data.metadata : {};
  const analysis = isRecord(data.analysis) ? data.analysis : {};
  const intents = [...new Set(transcript.turns.flatMap((turn) => (turn.toolCalls ?? []).filter((c) => c.name === 'log_conversation_event').map((c) => String(c.args.intent ?? '')).filter(Boolean)))];
  const summary = typeof analysis.transcript_summary === 'string' ? analysis.transcript_summary.slice(0, 1000) : undefined;
  const environment = receptionist.stage === 'live' ? 'live' : receptionist.stage === 'staging' ? 'staging' : 'dev';
  const status = data.status === 'done' ? 'done' : data.status === 'failed' ? 'failed' : 'unknown';

  await deps.upsertCall({
    receptionistId: receptionist.id, organizationId: receptionist.organizationId, conversationId, environment,
    startedAt: typeof metadata.start_time_unix_secs === 'number' ? new Date(metadata.start_time_unix_secs * 1000).toISOString() : undefined,
    durationSecs: typeof metadata.call_duration_secs === 'number' ? Math.round(metadata.call_duration_secs) : undefined,
    status, outcome: detectOutcome(transcript), detectedIntents: intents,
    toolCallCount: toolResults.length, toolErrorCount: toolResults.filter((r) => !r.ok).length,
    escalated: toolResults.some((r) => r.name === 'escalate_to_human' && r.ok),
    summary,
    analysis: {
      call_successful: analysis.call_successful,
      evaluation_criteria_results: analysis.evaluation_criteria_results,
      termination_reason: metadata.termination_reason,
      main_language: metadata.main_language,
    },
  });
  await deps.recordEvents([
    ...transcript.turns.flatMap((turn) => (turn.toolResults ?? []).map((result) => ({
      receptionistId: receptionist.id, organizationId: receptionist.organizationId, conversationId, eventType: 'tool_call' as const,
      toolName: result.name, ok: result.ok, failureCode: result.code, detail: undefined,
    }))),
    { receptionistId: receptionist.id, organizationId: receptionist.organizationId, conversationId, eventType: 'post_call', detail: scrubForLog(summary, 200) },
  ]);
  return jsonResponse({ ok: true }, 200);
}
