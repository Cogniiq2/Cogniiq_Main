// receptionist-postcall — ElevenLabs post-call webhook receiver (behaviour + tests in
// src/lib/goldenAgent/server/postCallHandler.ts). verify_jwt is off; the request is authenticated
// by the ElevenLabs HMAC signature.
//
// Environment: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (runtime), ELEVENLABS_WEBHOOK_SECRET

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

import { handlePostCallRequest } from '../../../src/lib/goldenAgent/server/postCallHandler.ts';
import type { PostCallDependencies } from '../../../src/lib/goldenAgent/server/postCallHandler.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const WEBHOOK_SECRET = Deno.env.get('ELEVENLABS_WEBHOOK_SECRET') ?? '';

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

const deps: PostCallDependencies = {
  webhookSecret: WEBHOOK_SECRET,
  async findReceptionistByAgentId(agentId) {
    const { data } = await admin.from('ai_receptionists').select('id, organization_id, stage').eq('provider', 'elevenlabs').eq('provider_agent_id', agentId).maybeSingle();
    return data ? { id: data.id, organizationId: data.organization_id, stage: data.stage } : null;
  },
  async upsertCall(call) {
    await admin.from('ai_receptionist_calls').upsert({
      receptionist_id: call.receptionistId, organization_id: call.organizationId, provider_conversation_id: call.conversationId, environment: call.environment,
      started_at: call.startedAt ?? null, duration_secs: call.durationSecs ?? null, status: call.status, outcome: call.outcome,
      detected_intents: call.detectedIntents, tool_call_count: call.toolCallCount, tool_error_count: call.toolErrorCount, escalated: call.escalated,
      summary: call.summary ?? null, analysis: call.analysis,
    }, { onConflict: 'receptionist_id,provider_conversation_id' });
  },
  async deletePriorEvents(receptionistId, conversationId) {
    // Only this conversation's post-call summary event; the live tool_call rows stay.
    await admin.from('ai_receptionist_call_events').delete()
      .eq('receptionist_id', receptionistId).eq('provider_conversation_id', conversationId).eq('event_type', 'post_call');
  },
  async recordEvents(events) {
    if (events.length === 0) return;
    await admin.from('ai_receptionist_call_events').insert(events.map((e) => ({
      receptionist_id: e.receptionistId, organization_id: e.organizationId, provider_conversation_id: e.conversationId, event_type: e.eventType,
      tool_name: e.toolName ?? null, ok: e.ok ?? null, failure_code: e.failureCode ?? null, latency_ms: e.latencyMs ?? null, detail: e.detail ?? null,
    })));
  },
};

serve((request: Request) => {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return new Response(JSON.stringify({ error: 'Server is not configured' }), { status: 500 });
  return handlePostCallRequest(request, deps);
});
