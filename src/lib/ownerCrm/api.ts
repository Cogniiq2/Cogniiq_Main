// API layer for the owner CRM sales pipeline.
//
// Like the rest of the owner area this is a thin typed wrapper over owner-gated
// SECURITY DEFINER RPCs (migration 20260902120000). Every authorization
// decision, every stage rule, the pre-offer gate and the conversion transaction
// itself live in the database — this module never decides who may do what.
//
// It also does not talk to anything else. There is no sourcing endpoint, no
// enrichment call and no outreach: a lead exists because a human typed it, and
// changing a stage sends nothing to anyone.

import { supabase } from '@/lib/supabase';
import { secureUuid } from '@/lib/ownerFinance/api';
import type { ServiceKey } from '@/lib/serviceOnboarding/types';
import type {
  ActivityChannel, CommandCenterData, ConversionResult, DuplicateMatch,
  LeadDetail, LeadListRow,
} from '@/lib/ownerCrm/types';

/* ------------------------------------------------------------------- Reads */

export async function loadLeads(entityId: string): Promise<LeadListRow[]> {
  const { data, error } = await supabase.rpc('owner_list_leads', { p_entity_id: entityId });
  if (error) throw error;
  return (data as LeadListRow[] | null) ?? [];
}

export async function loadLeadDetail(leadId: string): Promise<LeadDetail | null> {
  const { data, error } = await supabase.rpc('owner_lead_detail', { p_lead_id: leadId });
  if (error) throw error;
  return (data as LeadDetail | null) ?? null;
}

/**
 * The owner's day decides what counts as overdue, so the local date is sent
 * rather than letting the server's UTC clock draw the line — at 01:00 CET those
 * are different days, and "überfällig" would be wrong for an hour every night.
 */
export async function loadCommandCenter(entityId: string, today = localIsoDate()): Promise<CommandCenterData | null> {
  const { data, error } = await supabase.rpc('owner_command_center', {
    p_entity_id: entityId, p_today: today,
  });
  if (error) throw error;
  return (data as CommandCenterData | null) ?? null;
}

/** Today in the browser's timezone, as YYYY-MM-DD. */
export function localIsoDate(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/* -------------------------------------------------------------- Duplicates */

/**
 * Advisory only. The server reports likely matches across leads AND customers;
 * nothing is merged, nothing is blocked, and a shared company name alone comes
 * back as `weak` on purpose.
 */
export async function findDuplicates(
  entityId: string,
  probe: { company?: string | null; email?: string | null; phone?: string | null; website?: string | null },
  excludeLeadId: string | null = null,
): Promise<DuplicateMatch[]> {
  const { data, error } = await supabase.rpc('owner_find_lead_duplicates', {
    p_entity_id: entityId, p_payload: probe, p_exclude_lead_id: excludeLeadId,
  });
  if (error) throw error;
  return (data as DuplicateMatch[] | null) ?? [];
}

/* ------------------------------------------------------------- Lead writes */

export interface LeadInput {
  business_entity_id?: string;
  company?: string | null;
  contact_name?: string | null;
  contact_role?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  street?: string | null;
  postal_code?: string | null;
  city?: string | null;
  country_code?: string | null;
  stage?: string;
  priority?: string;
  source?: string | null;
  source_note?: string | null;
  estimated_setup_cents?: number | null;
  estimated_monthly_cents?: number | null;
  probability_percent?: number | null;
  industry?: string | null;
  company_type?: string | null;
  company_size?: string | null;
  existing_systems?: string | null;
  pain_points?: string | null;
  requirements?: string | null;
  notes?: string | null;
  preferred_channel?: string | null;
  last_contact_at?: string | null;
  service_interests?: ServiceKey[];
  next_follow_up_at?: string | null;
  follow_up_note?: string | null;
}

/**
 * Create a lead. The server needs a company OR a contact OR an e-mail and
 * nothing else — everything the owner does not yet know stays empty rather than
 * being invented.
 *
 * Duplicate matches come back with the new lead instead of preventing it: the
 * owner is warned, and then decides.
 */
export async function createLead(input: LeadInput): Promise<{
  id: string | null; duplicates: DuplicateMatch[]; error: string | null;
}> {
  const { data, error } = await supabase.rpc('owner_create_lead', {
    p_idempotency_key: secureUuid(), p_payload: input,
  });
  if (error) return { id: null, duplicates: [], error: error.message };
  const r = data as { lead_id?: string; duplicates?: DuplicateMatch[] };
  return { id: r?.lead_id ?? null, duplicates: r?.duplicates ?? [], error: null };
}

/** Patch semantics: an omitted key is left alone, a present empty value clears. */
export async function updateLead(leadId: string, patch: LeadInput): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('owner_update_lead', { p_lead_id: leadId, p_patch: patch });
  return { error: error?.message ?? null };
}

export async function setLeadArchived(leadId: string, archived: boolean): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('owner_set_lead_archived', {
    p_lead_id: leadId, p_archived: archived,
  });
  return { error: error?.message ?? null };
}

/**
 * Move the lead along the pipeline. This records an activity row and nothing
 * else: no mail is sent, no sequence starts, no external system is touched.
 * `note` is REQUIRED for `lost` — the server refuses a reasonless loss.
 */
export async function setLeadStage(leadId: string, stage: string, note?: string | null): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('owner_set_lead_stage', {
    p_lead_id: leadId, p_stage: stage, p_note: note ?? null,
  });
  return { error: error?.message ?? null };
}

/* --------------------------------------------------------- Contact & notes */

export async function logLeadContact(
  leadId: string, channel: ActivityChannel, summary: string, occurredAt?: string | null,
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('owner_log_lead_contact', {
    p_lead_id: leadId, p_channel: channel, p_summary: summary, p_occurred_at: occurredAt ?? null,
  });
  return { error: error?.message ?? null };
}

/* ------------------------------------------------------------- Follow-ups */

export async function upsertFollowUp(
  leadId: string, followUpId: string | null, dueAt: string, reason: string | null,
): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc('owner_upsert_lead_follow_up', {
    p_lead_id: leadId, p_follow_up_id: followUpId, p_due_at: dueAt, p_reason: reason,
  });
  if (error) return { id: null, error: error.message };
  return { id: (data as { follow_up_id?: string })?.follow_up_id ?? null, error: null };
}

/**
 * Close one follow-up. A successor is created only when the owner supplies one
 * — there is no recurrence and no automatic next step.
 */
export async function completeFollowUp(
  followUpId: string,
  status: 'done' | 'cancelled',
  note?: string | null,
  next?: { dueAt: string; reason: string | null } | null,
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('owner_complete_lead_follow_up', {
    p_follow_up_id: followUpId, p_status: status, p_note: note ?? null,
    p_next_due_at: next?.dueAt ?? null, p_next_reason: next?.reason ?? null,
  });
  return { error: error?.message ?? null };
}

/* ------------------------------------------------------------------ Tasks */

export interface LeadTaskInput {
  lead_id: string;
  title: string;
  description?: string | null;
  priority?: string;
  due_date?: string | null;
  notes?: string | null;
  status?: string;
}

export async function createLeadTask(input: LeadTaskInput): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc('owner_create_lead_task', {
    p_idempotency_key: secureUuid(), p_payload: input,
  });
  if (error) return { id: null, error: error.message };
  return { id: (data as { task_id?: string })?.task_id ?? null, error: null };
}

export async function setLeadTaskStatus(taskId: string, status: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('owner_set_lead_task_status', { p_task_id: taskId, p_status: status });
  return { error: error?.message ?? null };
}

export async function deleteLeadTask(taskId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('owner_delete_lead_task', { p_task_id: taskId });
  return { error: error?.message ?? null };
}

/* --------------------------------------------- Pre-offer integration check */

export type IntegrationCheckPatch = Record<string, string | number | boolean | null>;

/**
 * Write the pre-offer assessment. Sending `status: 'complete'` is what triggers
 * the gate: the server refuses it until the PVS, the interface answer, the
 * third-party costs and — for anything short of full automation — the exact
 * fallback are all recorded. The returned error IS that gate, not a hint.
 */
export async function saveIntegrationCheck(
  leadId: string, patch: IntegrationCheckPatch,
): Promise<{ status: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc('owner_upsert_lead_integration_check', {
    p_lead_id: leadId, p_patch: patch,
  });
  if (error) return { status: null, error: error.message };
  return { status: (data as { status?: string })?.status ?? null, error: null };
}

/* ------------------------------------------------------------- Conversion */

/**
 * Turn a won opportunity into the canonical customer.
 *
 * Safe to call twice. The server replays a repeated idempotency key, and an
 * already-converted lead returns its EXISTING customer rather than making a
 * second one — so a double click, a retry and a stale second tab all land on
 * the same row. The source lead is never deleted and keeps its full history.
 *
 * `services` overrides the lead's recorded interests; omit it to attach exactly
 * what the owner marked as interesting during the sale.
 */
export async function convertLeadToCustomer(
  leadId: string,
  options: { services?: ServiceKey[]; customerId?: string | null } = {},
): Promise<{ result: ConversionResult | null; error: string | null }> {
  const payload: Record<string, unknown> = { lead_id: leadId };
  if (options.services) payload.services = options.services;
  if (options.customerId) payload.customer_id = options.customerId;

  const { data, error } = await supabase.rpc('owner_convert_lead_to_customer', {
    p_idempotency_key: secureUuid(), p_payload: payload,
  });
  if (error) return { result: null, error: error.message };
  return { result: data as ConversionResult, error: null };
}

/* ------------------------------------------------------------ Offer linking */

/**
 * Record which prospect an offer was written for. Mirrors `linkOfferCustomer`:
 * the offer itself stays entirely in the canonical finance system, and this
 * writes only the link. Permitted on a finalised offer, because the linking
 * column is not one of the commercial fields the offer guard freezes.
 */
export async function linkOfferLead(offerId: string, leadId: string | null): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('owner_link_offer_lead', {
    p_offer_id: offerId, p_lead_id: leadId,
  });
  return { error: error?.message ?? null };
}

/* -------------------------------------------------------- Customer ← lead */

export interface OriginLead {
  id: string;
  display_name: string;
  stage: string;
  source: string | null;
  created_at: string;
  converted_at: string | null;
  activity_count: number;
  integration_status: string;
}

/**
 * Which prospect became this customer. A narrow projection on purpose: the
 * customer workspace shows the PROVENANCE of the relationship, never the sales
 * record — estimated value, probability and internal sales notes stay on the
 * lead page.
 */
export async function loadOriginLead(customerId: string): Promise<OriginLead | null> {
  const { data, error } = await supabase.rpc('owner_customer_origin_lead', { p_customer_id: customerId });
  if (error) throw error;
  return (data as OriginLead | null) ?? null;
}
