// Golden Agent — receptionist-postcall request handler.
//
// Receives ElevenLabs post-call webhooks (type "post_call_transcription"), verifies the HMAC
// signature ("ElevenLabs-Signature: t=<unix>,v0=<hex hmac-sha256(secret, `${t}.${body}`)>"),
// maps the agent id to a receptionist and stores the call OUTCOME.
//
// What is stored and what is not:
//   * stored on ai_receptionist_calls: outcome, duration, intents, tool counts, escalation flag,
//     the provider's short summary — all bounded by `retention_until` and purged by
//     `ai_receptionist_purge_expired_calls()`;
//   * stored on ai_receptionist_call_events: one `post_call` marker with counts and no free text;
//   * NEVER stored: the transcript turns, and the provider summary outside the retained column.
//
// Only agents this platform provisioned are matched (`provider_agent_id`); a hand-made agent in
// the same ElevenLabs workspace is acknowledged and dropped, so no cross-tenant data is written.

import { normaliseElevenLabsTranscript } from '../evaluation/elevenlabsEvaluation.ts';
import { detectOutcome } from '../evaluation/runner.ts';
import { hmacSha256Hex, isRecord, jsonResponse, timingSafeEqual } from './shared.ts';

export interface PostCallDependencies {
  webhookSecret: string;
  findReceptionistByAgentId(agentId: string): Promise<{ id: string; organizationId: string; stage: string } | null>;
  upsertCall(call: {
    receptionistId: string; organizationId: string; conversationId: string; environment: 'dev' | 'staging' | 'live';
    startedAt?: string; durationSecs?: number; status: 'done' | 'failed' | 'unknown'; outcome: string;
    detectedIntents: string[]; toolCallCount: number; toolErrorCount: number; escalated: boolean; summary?: string; analysis: Record<string, unknown>;
  }): Promise<void>;
  recordEvents(events: Array<{ receptionistId: string; organizationId: string; conversationId: string; eventType: 'tool_call' | 'post_call'; toolName?: string; ok?: boolean; failureCode?: string; latencyMs?: number; detail?: string }>): Promise<void>;
  /**
   * Removes the `post_call` event a previous delivery of the SAME conversation wrote, so a
   * redelivery replaces rather than duplicates it. Must never touch other event types (the live
   * `tool_call` rows) or another conversation. Optional so a test can omit it.
   */
  deletePriorEvents?(receptionistId: string, conversationId: string): Promise<void>;
  now?: () => number;
  /** Max age of the timestamp in seconds (replay protection). */
  toleranceSeconds?: number;
}

/**
 * `t=<unix>,v0=<hex>`. Split on the FIRST `=` only: a value that itself contains `=` must not be
 * silently dropped, because a dropped `v0` would look like "no signature" rather than "bad
 * signature" — both are rejected here, but only one of them is the truth.
 */
export function parseSignatureHeader(header: string | null): { timestamp: string; signature: string } | null {
  if (!header) return null;
  const parts: Record<string, string> = {};
  for (const part of header.split(',')) {
    const trimmed = part.trim();
    const index = trimmed.indexOf('=');
    if (index <= 0) continue;
    parts[trimmed.slice(0, index)] = trimmed.slice(index + 1);
  }
  if (typeof parts.t !== 'string' || typeof parts.v0 !== 'string') return null;
  return { timestamp: parts.t, signature: parts.v0 };
}

const HEX_SHA256 = /^[0-9a-f]{64}$/;

export async function verifyElevenLabsSignature(secret: string, header: string | null, body: string, nowSeconds: number, toleranceSeconds = 30 * 60): Promise<boolean> {
  if (!secret) return false;
  const parsed = parseSignatureHeader(header);
  if (!parsed) return false;
  // Reject a malformed signature before spending an HMAC on it, and before `timingSafeEqual` can
  // leak a length difference as an early return.
  const signature = parsed.signature.trim().toLowerCase();
  if (!HEX_SHA256.test(signature)) return false;
  if (!/^\d{1,15}$/.test(parsed.timestamp)) return false;
  const timestamp = Number(parsed.timestamp);
  // Future-dated timestamps are as suspicious as stale ones: a clock the sender controls must not
  // be able to widen the replay window.
  if (!Number.isFinite(timestamp) || Math.abs(nowSeconds - timestamp) > toleranceSeconds) return false;
  const expected = await hmacSha256Hex(secret, `${parsed.timestamp}.${body}`);
  return timingSafeEqual(expected, signature);
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
  // ElevenLabs retries a delivery until it sees a 2xx, so the same conversation can arrive several
  // times. The call row is an upsert and therefore idempotent; the events are inserts, so the
  // previous delivery's post-call event is cleared first. The delete is scoped to
  // (receptionist, conversation) and to the post_call type: it can never touch another tenant and
  // never removes the live `tool_call` rows receptionist-tools wrote during the conversation.
  //
  // Per-tool rows are deliberately NOT written here. Every tool call already produced one live
  // event with real latency and intent; re-deriving them from the transcript would duplicate the
  // truth with a poorer copy. The aggregate counts live on the call row.
  await deps.deletePriorEvents?.(receptionist.id, conversationId);
  // The event detail is a marker, NOT the provider summary. A summary is free text a language
  // model wrote about a real caller; it routinely contains a name, which `scrubForLog` does not
  // and cannot remove. It belongs only in `ai_receptionist_calls.summary`, which is bounded by
  // `retention_until` and purged — the event table has no retention of its own.
  await deps.recordEvents([
    {
      receptionistId: receptionist.id, organizationId: receptionist.organizationId, conversationId, eventType: 'post_call',
      detail: `post-call received · outcome=${detectOutcome(transcript)} · tools=${toolResults.length} · errors=${toolResults.filter((r) => !r.ok).length}${summary ? ' · summary stored on the call record' : ''}`,
    },
  ]);
  return jsonResponse({ ok: true, receptionistId: receptionist.id, toolCalls: toolResults.length }, 200);
}
