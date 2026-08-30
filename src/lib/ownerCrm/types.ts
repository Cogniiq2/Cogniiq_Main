// Types for the owner CRM sales layer: the manual lead, its pipeline, its
// follow-ups and the pre-offer integration assessment.
//
// These mirror migration 20260902120000 exactly. Nothing here re-declares a
// customer — the moment a lead is won, `OwnerCustomer` takes over and this
// layer keeps only a link to it.

import type { ServiceKey } from '@/lib/serviceOnboarding/types';

/**
 * The SALES pipeline. Deliberately not the same vocabulary as
 * `EngagementStatus`: that one is the delivery lifecycle and only begins where
 * this one ends. A lead is never in both.
 */
export type LeadStage =
  | 'new' | 'contacted' | 'qualification' | 'discovery' | 'interested'
  | 'offer_preparation' | 'offer_sent' | 'negotiation' | 'won' | 'lost';

export type LeadPriority = 'low' | 'normal' | 'high' | 'urgent';

export type ContactChannel = 'phone' | 'email' | 'meeting' | 'other';

/** Channel of a manually logged interaction. `note` is not contact. */
export type ActivityChannel = 'call' | 'email' | 'meeting' | 'note' | 'other';

export type FollowUpStatus = 'open' | 'done' | 'cancelled';

export type IntegrationCheckStatus = 'not_started' | 'in_progress' | 'blocked' | 'complete';

export type InterfaceType =
  | 'official_api' | 'fhir' | 'hl7' | 'gdt' | 'rest_api'
  | 'partner_interface' | 'middleware' | 'none' | 'unknown';

export type PartnerApprovalStatus = 'granted' | 'pending' | 'refused' | 'not_required';

/**
 * How much of the customer's process the assistant can actually take over.
 * `not_possible` and `unknown` exist so the honest answer is always available —
 * a scope that cannot be delivered must never be recorded as "partial".
 */
export type LeadIntegrationMode = 'full_automation' | 'partial_automation' | 'not_possible' | 'unknown';

/** Row shape of the leads list. Every count is server-computed. */
export interface LeadListRow {
  id: string;
  company: string | null;
  contact_name: string | null;
  contact_role: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  city: string | null;
  postal_code: string | null;
  display_name: string;
  stage: LeadStage;
  priority: LeadPriority;
  source: string | null;
  estimated_setup_cents: number | null;
  estimated_monthly_cents: number | null;
  probability_percent: number | null;
  next_follow_up_at: string | null;
  follow_up_note: string | null;
  last_contact_at: string | null;
  last_activity_at: string;
  won_at: string | null;
  lost_at: string | null;
  lost_reason: string | null;
  converted_customer_id: string | null;
  converted_at: string | null;
  archived_at: string | null;
  created_at: string;
  service_interests: ServiceKey[];
  open_task_count: number;
  offer_count: number;
  integration_status: IntegrationCheckStatus;
}

/** The full lead record, as stored. */
export interface Lead extends LeadListRow {
  business_entity_id: string;
  street: string | null;
  country_code: string | null;
  source_note: string | null;
  industry: string | null;
  company_type: string | null;
  company_size: string | null;
  existing_systems: string | null;
  pain_points: string | null;
  requirements: string | null;
  notes: string | null;
  preferred_channel: ContactChannel | null;
  created_by: string | null;
  updated_at: string;
}

export interface LeadFollowUp {
  id: string;
  lead_id: string;
  due_at: string;
  reason: string | null;
  status: FollowUpStatus;
  completed_at: string | null;
  completed_by: string | null;
  completion_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  event_type: string;
  summary: string;
  channel: ActivityChannel | null;
  occurred_at: string;
  related_offer_id: string | null;
  actor_user_id: string | null;
  created_at: string;
}

/** A CRM task on a prospect. Same table and same statuses as customer tasks. */
export interface LeadTask {
  id: string;
  lead_id: string;
  customer_id: null;
  title: string;
  description: string | null;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  priority: LeadPriority;
  due_date: string | null;
  notes: string | null;
  sort_order: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * The pre-offer gate. Every `boolean | null` here is genuinely tri-state:
 * `null` means "not yet established", which is NOT `false` and must never be
 * rendered as "Nein".
 */
export interface LeadIntegrationCheck {
  lead_id: string;
  pvs_name: string | null;
  pvs_vendor: string | null;
  pvs_version: string | null;
  appointment_system: string | null;
  interface_type: InterfaceType | null;
  api_documentation_obtained: boolean | null;
  api_access_included: boolean | null;
  partner_approval_required: boolean | null;
  partner_approval_status: PartnerApprovalStatus | null;
  sandbox_available: boolean | null;
  supports_availability: boolean | null;
  supports_booking: boolean | null;
  supports_reschedule: boolean | null;
  supports_cancel: boolean | null;
  supports_patient_write: boolean | null;
  rate_limits: string | null;
  vendor_restrictions: string | null;
  third_party_setup_cents: number | null;
  third_party_monthly_cents: number | null;
  third_party_cost_note: string | null;
  third_party_costs_confirmed: boolean;
  integration_mode: LeadIntegrationMode | null;
  fallback_description: string | null;
  customer_informed_at: string | null;
  documented_in_offer_at: string | null;
  status: IntegrationCheckStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadOfferRef {
  id: string;
  offer_number: string | null;
  title: string | null;
  status: string;
  gross_total_cents: number;
  valid_until: string | null;
  created_at: string;
  archived_at: string | null;
}

export interface LeadDetail {
  lead: Lead;
  service_interests: ServiceKey[];
  follow_ups: LeadFollowUp[];
  tasks: LeadTask[];
  activity: LeadActivity[];
  integration_check: LeadIntegrationCheck | null;
  offers: LeadOfferRef[];
  /** Present only once the lead has been converted. */
  customer: { id: string; company: string | null; contact_name: string | null; status: string } | null;
}

/**
 * One advisory duplicate match. `strong` came from an e-mail, a phone number or
 * a website; `weak` came from a company name alone and is shown as a much
 * quieter warning, because two practices really can share a name.
 */
export interface DuplicateMatch {
  kind: 'lead' | 'customer';
  id: string;
  name: string;
  state: string;
  city: string | null;
  matched_on: 'email' | 'phone' | 'website' | 'company';
  confidence: 'strong' | 'weak';
}

export interface ConvertedService {
  service_key: ServiceKey;
  service_id: string | null;
  engagement_id: string | null;
  created: boolean;
}

export interface ConversionResult {
  lead_id: string;
  customer_id: string;
  /** True when an existing customer was reused instead of a new one created. */
  matched_existing: boolean;
  services: ConvertedService[];
}

/* ------------------------------------------------------------- Command center */

export interface CommandFollowUp {
  follow_up_id: string;
  lead_id: string;
  lead_name: string;
  due_at: string;
  reason: string | null;
  stage: LeadStage;
  priority: LeadPriority;
  bucket: 'overdue' | 'today';
}

export interface CommandLeadWithoutFollowUp {
  lead_id: string;
  lead_name: string;
  stage: LeadStage;
  priority: LeadPriority;
  last_activity_at: string;
}

export interface CommandTask {
  task_id: string;
  title: string;
  due_date: string;
  priority: LeadPriority;
  lead_id: string | null;
  customer_id: string | null;
  subject_name: string;
  subject_kind: 'lead' | 'customer';
}

export interface CommandEngagementItem {
  task_id: string;
  title: string;
  client_request?: string | null;
  blocker_reason?: string | null;
  readiness_category?: string;
  updated_at: string;
  engagement_id: string;
  service_key: ServiceKey;
  customer_id: string;
  customer_name: string;
}

export interface CommandPipelineBucket {
  stage: LeadStage;
  count: number;
  estimated_setup_cents: number;
  estimated_monthly_cents: number;
}

export interface CommandOffer {
  offer_id: string;
  offer_number: string | null;
  title: string | null;
  status: string;
  gross_total_cents: number;
  valid_until: string | null;
  created_at: string;
  owner_lead_id: string | null;
  owner_customer_id: string | null;
  subject_name: string;
}

export interface CommandEngagementBucket {
  lifecycle_status: string;
  service_key: ServiceKey;
  count: number;
}

export interface CommandMonitoringItem {
  engagement_id: string;
  customer_id: string;
  service_key: ServiceKey;
  went_live_at: string;
  monitoring_until: string | null;
  customer_name: string;
}

export interface CommandIntegrationGateItem {
  lead_id: string;
  lead_name: string;
  stage: LeadStage;
  last_activity_at: string;
  integration_status: IntegrationCheckStatus;
}

export interface CommandCenterData {
  follow_ups: CommandFollowUp[];
  upcoming_follow_up_count: number;
  leads_without_follow_up: CommandLeadWithoutFollowUp[];
  overdue_tasks: CommandTask[];
  waiting_for_client: CommandEngagementItem[];
  blockers: CommandEngagementItem[];
  pipeline: CommandPipelineBucket[];
  open_offers: CommandOffer[];
  engagements: CommandEngagementBucket[];
  monitoring: CommandMonitoringItem[];
  integration_gate_open: CommandIntegrationGateItem[];
}
