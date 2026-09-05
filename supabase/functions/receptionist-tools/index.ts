// receptionist-tools — the webhook endpoint every Golden Agent tool calls (see
// src/lib/goldenAgent/server/toolsHandler.ts for the behaviour and its tests).
//
// Auth: per-receptionist bearer token (hash in ai_receptionist_tool_bindings). verify_jwt is off
// for this function (supabase/config.toml) because the caller is the ElevenLabs platform.
//
// Environment (server-side only):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   runtime-provided
//   <config.bookingIntegration.secretEnvVar>  shared secret for a customer's n8n workflow

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

import { handleToolsRequest } from '../../../src/lib/goldenAgent/server/toolsHandler.ts';
import type { ToolsHandlerDependencies } from '../../../src/lib/goldenAgent/server/toolsHandler.ts';
import { MockBookingProvider } from '../../../src/lib/goldenAgent/adapters/mockBookingProvider.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const mockProviders = new Map<string, MockBookingProvider>();

const deps: ToolsHandlerDependencies = {
  mockProviders,
  resolveSecret: (name) => Deno.env.get(name) ?? undefined,
  async findBindingByTokenHash(tokenHash) {
    const { data } = await admin.from('ai_receptionist_tool_bindings').select('id, receptionist_id, organization_id, environment').eq('token_hash', tokenHash).eq('active', true).maybeSingle();
    if (!data) return null;
    return { bindingId: data.id, receptionistId: data.receptionist_id, organizationId: data.organization_id, environment: data.environment };
  },
  async loadReceptionist(id) {
    const { data } = await admin.from('ai_receptionists').select('id, organization_id, stage, client_config').eq('id', id).maybeSingle();
    if (!data) return null;
    return { id: data.id, organizationId: data.organization_id, stage: data.stage, clientConfig: data.client_config };
  },
  async recordEvent(event) {
    await admin.from('ai_receptionist_call_events').insert({
      receptionist_id: event.receptionistId, organization_id: event.organizationId, provider_conversation_id: event.conversationId,
      event_type: event.eventType, tool_name: event.toolName ?? null, ok: event.ok ?? null, failure_code: event.failureCode ?? null,
      latency_ms: event.latencyMs ?? null, intent: event.intent ?? null, detail: event.detail ?? null, payload: event.payload ?? {},
    });
  },
  async touchBinding(bindingId) {
    await admin.from('ai_receptionist_tool_bindings').update({ last_used_at: new Date().toISOString() }).eq('id', bindingId);
  },
};

serve((request: Request) => {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return new Response(JSON.stringify({ ok: false, code: 'provider_unavailable', message: 'Server is not configured' }), { status: 500 });
  return handleToolsRequest(request, deps);
});
