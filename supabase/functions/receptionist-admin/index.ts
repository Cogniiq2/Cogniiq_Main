// receptionist-admin — owner/admin operations for AI receptionists (behaviour + tests in
// src/lib/goldenAgent/server/adminHandler.ts).
//
// Security posture (same as admin-provision-client):
//   * caller authenticated via their own bearer token (verify_jwt on) AND platform-admin status
//     re-read from profiles.platform_role through the caller-scoped client;
//   * service-role client only for the table writes the handler performs after that check;
//   * the ElevenLabs API key never leaves this process and is never returned.
//
// Environment: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (runtime),
//              ELEVENLABS_API_KEY, RECEPTIONIST_TOOLS_URL (optional; defaults to this project's receptionist-tools URL)

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

import { handleAdminAction } from '../../../src/lib/goldenAgent/server/adminHandler.ts';
import type { AdminDatabase } from '../../../src/lib/goldenAgent/server/adminHandler.ts';
import { ElevenLabsClient } from '../../../src/lib/goldenAgent/elevenlabs/client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY') ?? '';
const TOOLS_URL = Deno.env.get('RECEPTIONIST_TOOLS_URL') ?? `${SUPABASE_URL}/functions/v1/receptionist-tools`;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders)) headers.set(key, value);
  return new Response(response.body, { status: response.status, headers });
}

function must<T>(result: { data: T | null; error: { message: string } | null }, what: string): T {
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
  if (result.data === null) throw new Error(`${what}: no data`);
  return result.data;
}

serve(async (request: Request): Promise<Response> => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY) return json({ error: 'Server is not configured' }, 500);

  const authHeader = request.headers.get('Authorization') ?? '';
  if (!authHeader.toLowerCase().startsWith('bearer ')) return json({ error: 'Missing bearer token' }, 401);
  const caller = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: userError } = await caller.auth.getUser();
  if (userError || !userData?.user) return json({ error: 'Invalid session' }, 401);
  const { data: profile, error: profileError } = await caller.from('profiles').select('platform_role').eq('id', userData.user.id).maybeSingle();
  const role = (profile as { platform_role?: string } | null)?.platform_role;
  if (profileError || (role !== 'cogniiq_admin' && role !== 'cogniiq_owner')) return json({ error: 'Platform administrator access required' }, 403);

  let body: unknown;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON body' }, 400); }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const db: AdminDatabase = {
    async createReceptionist(row) {
      const data = must(await admin.from('ai_receptionists').insert({ organization_id: row.organizationId, name: row.name, stage: row.stage, client_config: row.clientConfig, created_by: row.createdBy }).select('id').single(), 'create receptionist');
      return { id: (data as { id: string }).id };
    },
    async getReceptionist(id) {
      const { data } = await admin.from('ai_receptionists').select('id, organization_id, name, stage, client_config, config_version, provider_state, provider_agent_id').eq('id', id).maybeSingle();
      if (!data) return null;
      return { id: data.id, organizationId: data.organization_id, name: data.name, stage: data.stage, clientConfig: data.client_config, configVersion: data.config_version, providerState: data.provider_state, providerAgentId: data.provider_agent_id };
    },
    async updateReceptionist(id, patch) {
      const row: Record<string, unknown> = {};
      if (patch.name !== undefined) row.name = patch.name;
      if (patch.stage !== undefined) row.stage = patch.stage;
      if (patch.clientConfig !== undefined) row.client_config = patch.clientConfig;
      if (patch.configVersion !== undefined) row.config_version = patch.configVersion;
      if (patch.providerState !== undefined) row.provider_state = patch.providerState;
      if (patch.providerAgentId !== undefined) row.provider_agent_id = patch.providerAgentId;
      if (patch.promptVersion !== undefined) row.prompt_version = patch.promptVersion;
      if (patch.lastSyncedAt !== undefined) row.last_synced_at = patch.lastSyncedAt;
      if (patch.lastSyncError !== undefined) row.last_sync_error = patch.lastSyncError;
      const { error } = await admin.from('ai_receptionists').update(row).eq('id', id);
      if (error) throw new Error(`update receptionist: ${error.message}`);
    },
    async insertConfigVersion(row) {
      const { error } = await admin.from('ai_receptionist_config_versions').insert({ receptionist_id: row.receptionistId, organization_id: row.organizationId, version: row.version, client_config: row.clientConfig, note: row.note ?? null, created_by: row.createdBy });
      if (error) throw new Error(`insert config version: ${error.message}`);
    },
    async findActiveBinding(receptionistId, environment) {
      const { data } = await admin.from('ai_receptionist_tool_bindings').select('id').eq('receptionist_id', receptionistId).eq('environment', environment).eq('active', true).limit(1).maybeSingle();
      return data ? { id: data.id } : null;
    },
    async revokeBindings(receptionistId, environment) {
      await admin.from('ai_receptionist_tool_bindings').update({ active: false, revoked_at: new Date().toISOString() }).eq('receptionist_id', receptionistId).eq('environment', environment).eq('active', true);
    },
    async insertBinding(row) {
      const data = must(await admin.from('ai_receptionist_tool_bindings').insert({ receptionist_id: row.receptionistId, organization_id: row.organizationId, environment: row.environment, token_hash: row.tokenHash, label: row.label }).select('id').single(), 'insert binding');
      return { id: (data as { id: string }).id };
    },
    async insertEvaluationRun(row) {
      const data = must(await admin.from('ai_receptionist_evaluation_runs').insert({ receptionist_id: row.receptionistId, organization_id: row.organizationId, mode: row.mode, status: row.status, config_version: row.configVersion, prompt_version: row.promptVersion, provider_invocation_id: row.providerInvocationId ?? null, created_by: row.createdBy }).select('id').single(), 'insert evaluation run');
      return { id: (data as { id: string }).id };
    },
    async updateEvaluationRun(id, patch) {
      const row: Record<string, unknown> = {};
      if (patch.status !== undefined) row.status = patch.status;
      if (patch.total !== undefined) row.total = patch.total;
      if (patch.passed !== undefined) row.passed = patch.passed;
      if (patch.failed !== undefined) row.failed = patch.failed;
      if (patch.summary !== undefined) row.summary = patch.summary;
      if (patch.error !== undefined) row.error = patch.error;
      if (patch.startedAt !== undefined) row.started_at = patch.startedAt;
      if (patch.finishedAt !== undefined) row.finished_at = patch.finishedAt;
      const { error } = await admin.from('ai_receptionist_evaluation_runs').update(row).eq('id', id);
      if (error) throw new Error(`update evaluation run: ${error.message}`);
    },
    async insertEvaluationResults(rows) {
      if (rows.length === 0) return;
      const { error } = await admin.from('ai_receptionist_evaluation_results').upsert(rows.map((r) => ({ run_id: r.runId, receptionist_id: r.receptionistId, organization_id: r.organizationId, scenario_id: r.scenarioId, category: r.category, title: r.title, passed: r.passed, outcome: r.outcome, scores: r.scores, findings: r.findings, transcript: r.transcript })), { onConflict: 'run_id,scenario_id' });
      if (error) throw new Error(`insert evaluation results: ${error.message}`);
    },
    async upsertCalls(rows) {
      if (rows.length === 0) return;
      const { error } = await admin.from('ai_receptionist_calls').upsert(rows.map((c) => ({ receptionist_id: c.receptionistId, organization_id: c.organizationId, provider_conversation_id: c.conversationId, environment: c.environment, started_at: c.startedAt ?? null, duration_secs: c.durationSecs ?? null, status: c.status, analysis: c.analysis })), { onConflict: 'receptionist_id,provider_conversation_id', ignoreDuplicates: false });
      if (error) throw new Error(`upsert calls: ${error.message}`);
    },
  };

  const response = await handleAdminAction(body, {
    db,
    provider: () => {
      if (!ELEVENLABS_API_KEY) throw new Error('ELEVENLABS_API_KEY is not configured on the server');
      return new ElevenLabsClient({ apiKey: ELEVENLABS_API_KEY });
    },
    toolsEndpointUrl: TOOLS_URL,
    actorId: userData.user.id,
  });
  return withCors(response);
});
