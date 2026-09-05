// Dashboard API for the AI Receptionists control center.
//
// Reads go straight to the tables under RLS (platform admins see every tenant; a customer would
// only see their own rows). Every mutation that touches a provider or needs validation goes
// through the receptionist-admin edge function, which re-checks the caller's role from the
// database and holds the only copy of the ElevenLabs API key.

import { FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import type { ClientConfig, DeploymentStage, EvaluationSummary, Finding, DimensionScore, Transcript } from '@/lib/goldenAgent';

export interface ReceptionistListRow {
  id: string;
  organization_id: string;
  organization_name: string | null;
  name: string;
  stage: DeploymentStage;
  provider: string;
  provider_agent_id: string | null;
  config_version: number;
  prompt_version: string | null;
  last_synced_at: string | null;
  last_sync_error: string | null;
  updated_at: string;
}

export interface ReceptionistDetail extends ReceptionistListRow {
  client_config: ClientConfig | Record<string, unknown>;
  provider_state: Record<string, unknown>;
  notes: string | null;
  created_at: string;
}

export interface CallRow {
  id: string;
  provider_conversation_id: string;
  environment: string;
  started_at: string | null;
  duration_secs: number | null;
  status: string;
  outcome: string | null;
  detected_intents: string[];
  tool_call_count: number;
  tool_error_count: number;
  escalated: boolean;
  summary: string | null;
}

export interface CallEventRow {
  id: number;
  provider_conversation_id: string;
  event_type: string;
  tool_name: string | null;
  ok: boolean | null;
  failure_code: string | null;
  latency_ms: number | null;
  intent: string | null;
  detail: string | null;
  occurred_at: string;
}

export interface EvaluationRunRow {
  id: string;
  mode: string;
  status: string;
  config_version: number | null;
  prompt_version: string | null;
  provider_invocation_id: string | null;
  total: number;
  passed: number;
  failed: number;
  summary: Partial<EvaluationSummary>;
  error: string | null;
  created_at: string;
  finished_at: string | null;
}

export interface EvaluationResultRow {
  id: string;
  scenario_id: string;
  category: string;
  title: string;
  passed: boolean;
  outcome: string | null;
  scores: DimensionScore[];
  findings: Finding[];
  transcript: Transcript;
}

export interface ConfigVersionRow {
  id: string;
  version: number;
  note: string | null;
  created_at: string;
}

export interface OrganizationOption {
  id: string;
  name: string;
}

const LIST_COLUMNS = 'id, organization_id, name, stage, provider, provider_agent_id, config_version, prompt_version, last_synced_at, last_sync_error, updated_at, organizations(name)';

type RawListRow = Omit<ReceptionistListRow, 'organization_name'> & { organizations: { name: string } | { name: string }[] | null };

function organizationName(raw: RawListRow['organizations']): string | null {
  if (!raw) return null;
  return Array.isArray(raw) ? raw[0]?.name ?? null : raw.name;
}

export async function listReceptionists(): Promise<ReceptionistListRow[]> {
  const { data, error } = await supabase.from('ai_receptionists').select(LIST_COLUMNS).order('updated_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as RawListRow[]).map(({ organizations, ...row }) => ({ ...row, organization_name: organizationName(organizations) }));
}

export async function getReceptionist(id: string): Promise<ReceptionistDetail | null> {
  const { data, error } = await supabase.from('ai_receptionists').select(`${LIST_COLUMNS}, client_config, provider_state, notes, created_at`).eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { organizations, ...row } = data as unknown as RawListRow & { client_config: ClientConfig; provider_state: Record<string, unknown>; notes: string | null; created_at: string };
  return { ...row, organization_name: organizationName(organizations) };
}

export async function listOrganizations(): Promise<OrganizationOption[]> {
  const { data, error } = await supabase.from('organizations').select('id, name').order('name');
  if (error) throw error;
  return (data ?? []) as OrganizationOption[];
}

export async function listCalls(receptionistId: string): Promise<CallRow[]> {
  const { data, error } = await supabase.from('ai_receptionist_calls').select('id, provider_conversation_id, environment, started_at, duration_secs, status, outcome, detected_intents, tool_call_count, tool_error_count, escalated, summary').eq('receptionist_id', receptionistId).order('started_at', { ascending: false, nullsFirst: false }).limit(100);
  if (error) throw error;
  return (data ?? []) as CallRow[];
}

export async function listCallEvents(receptionistId: string, conversationId?: string): Promise<CallEventRow[]> {
  let query = supabase.from('ai_receptionist_call_events').select('id, provider_conversation_id, event_type, tool_name, ok, failure_code, latency_ms, intent, detail, occurred_at').eq('receptionist_id', receptionistId).order('occurred_at', { ascending: false }).limit(200);
  if (conversationId) query = query.eq('provider_conversation_id', conversationId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as CallEventRow[];
}

export async function listEvaluationRuns(receptionistId: string): Promise<EvaluationRunRow[]> {
  const { data, error } = await supabase.from('ai_receptionist_evaluation_runs').select('id, mode, status, config_version, prompt_version, provider_invocation_id, total, passed, failed, summary, error, created_at, finished_at').eq('receptionist_id', receptionistId).order('created_at', { ascending: false }).limit(50);
  if (error) throw error;
  return (data ?? []) as EvaluationRunRow[];
}

export async function listEvaluationResults(runId: string): Promise<EvaluationResultRow[]> {
  const { data, error } = await supabase.from('ai_receptionist_evaluation_results').select('id, scenario_id, category, title, passed, outcome, scores, findings, transcript').eq('run_id', runId).order('passed', { ascending: true }).order('scenario_id');
  if (error) throw error;
  return (data ?? []) as EvaluationResultRow[];
}

export async function listConfigVersions(receptionistId: string): Promise<ConfigVersionRow[]> {
  const { data, error } = await supabase.from('ai_receptionist_config_versions').select('id, version, note, created_at').eq('receptionist_id', receptionistId).order('version', { ascending: false }).limit(30);
  if (error) throw error;
  return (data ?? []) as ConfigVersionRow[];
}

/* ------------------------------------------------------------------ admin function */

export type AdminActionResult = { ok: true } & Record<string, unknown>;

export class AdminActionError extends Error {
  constructor(message: string, readonly status: number, readonly details: unknown) {
    super(message);
    this.name = 'AdminActionError';
  }
}

export async function adminAction(body: Record<string, unknown>): Promise<AdminActionResult> {
  const { data, error } = await supabase.functions.invoke('receptionist-admin', { body });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      let parsed: { error?: string; details?: unknown; issues?: unknown } | null = null;
      try { parsed = await error.context.clone().json(); } catch { parsed = null; }
      throw new AdminActionError(parsed?.error ?? error.message, error.context.status, parsed?.details ?? parsed?.issues ?? null);
    }
    throw new AdminActionError(error.message, 0, null);
  }
  const result = data as { ok?: boolean; error?: string } | null;
  if (!result || result.ok !== true) throw new AdminActionError(result?.error ?? 'Unbekannter Fehler', 0, result);
  return result as AdminActionResult;
}
