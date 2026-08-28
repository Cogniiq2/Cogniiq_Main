// API layer for the client service delivery system. Like the rest of the owner area, this is a
// thin typed wrapper over owner-gated SECURITY DEFINER RPCs (migration 20260830120000). Every
// authorization decision, every status rule and the go-live gate itself live in the database —
// this module never decides who may do what.

import { supabase } from '@/lib/supabase';
import { secureUuid } from '@/lib/ownerFinance/api';
import type {
  CustomerServiceSummary, EngagementDetail, EngagementStatus, EngagementTaskStatus,
  ServiceKey, ServiceState,
} from '@/lib/serviceOnboarding/types';
import { describeServiceFailure } from '@/lib/serviceOnboarding/serviceErrors';
import type { ServiceFailure } from '@/lib/serviceOnboarding/serviceErrors';

// Error classification and sanitisation live in serviceErrors.ts, which has no Supabase
// dependency. Re-exported here so every existing import keeps working.
export {
  classifyServiceError, describeServiceError, describeServiceFailure, isMissingBackendMessage,
} from '@/lib/serviceOnboarding/serviceErrors';
export type {
  ServiceBackendStatus, ServiceFailure, ServiceFailureKind,
} from '@/lib/serviceOnboarding/serviceErrors';

/* ----------------------------------------------------------------- Services */

export async function loadCustomerServices(customerId: string): Promise<CustomerServiceSummary[]> {
  const { data, error } = await supabase.rpc('owner_list_customer_services', { p_customer_id: customerId });
  if (error) throw error;
  return (data as CustomerServiceSummary[] | null) ?? [];
}

/**
 * Add a service to a customer, instantiating its onboarding workspace from the currently active
 * template. Safe to call repeatedly: the server returns the existing service and engagement
 * instead of creating a second one, so a double click, a retry or a re-save never duplicates an
 * onboarding. Re-adding a paused or archived service reactivates it with its history intact.
 */
export async function addCustomerService(customerId: string, serviceKey: ServiceKey, label?: string): Promise<{
  serviceId: string | null; engagementId: string | null; created: boolean;
  /** Raw message, kept for callers that classify on it. Do not render it. */
  error: string | null;
  /** Sanitised, renderable description of the same failure. */
  failure: ServiceFailure | null;
}> {
  const { data, error } = await supabase.rpc('owner_add_customer_service', {
    p_idempotency_key: secureUuid(),
    p_customer_id: customerId,
    p_service_key: serviceKey,
  });
  if (error) {
    return {
      serviceId: null, engagementId: null, created: false,
      error: error.message,
      failure: describeServiceFailure(error, label),
    };
  }
  const r = data as { service_id?: string; engagement_id?: string; created?: boolean };
  return {
    serviceId: r?.service_id ?? null,
    engagementId: r?.engagement_id ?? null,
    created: r?.created ?? false,
    error: null,
    failure: null,
  };
}

/** Pause, archive or reactivate. Never destructive — the engagement and its history survive. */
export async function setCustomerServiceState(serviceId: string, state: ServiceState): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('owner_set_customer_service_state', {
    p_service_id: serviceId, p_state: state,
  });
  return { error: error?.message ?? null };
}

/* ----------------------------------------------------------------- Engagement */

export async function loadEngagementDetail(engagementId: string): Promise<EngagementDetail | null> {
  const { data, error } = await supabase.rpc('owner_engagement_detail', { p_engagement_id: engagementId });
  if (error) throw error;
  return (data as EngagementDetail | null) ?? null;
}

export interface EngagementPatch {
  healthcare?: boolean;
  integration_mode?: string | null;
  integration_limitations?: string | null;
  summary?: string | null;
  go_live_target_date?: string | null;
  monitoring_until?: string | null;
}

export async function updateEngagement(engagementId: string, patch: EngagementPatch): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('owner_update_engagement', {
    p_engagement_id: engagementId, p_patch: patch,
  });
  return { error: error?.message ?? null };
}

/**
 * Move the engagement along its lifecycle. The server refuses `ready_for_go_live`, `live` and
 * `monitoring` while any go-live blocker is unresolved, so the returned error is the real gate,
 * not a UI courtesy.
 */
export async function setEngagementStatus(engagementId: string, status: EngagementStatus): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('owner_set_engagement_status', {
    p_engagement_id: engagementId, p_status: status,
  });
  return { error: error?.message ?? null };
}

/* ----------------------------------------------------------------- Tasks */

export interface TaskPatch {
  status?: EngagementTaskStatus;
  blocker_reason?: string | null;
  client_request?: string | null;
  evidence_url?: string | null;
  evidence_note?: string | null;
  notes?: string | null;
  reviewer?: string | null;
}

/**
 * One entry point for every task edit. The server enforces the rules that matter: a blocked task
 * needs a reason, a waiting-for-client task needs the exact request, and completion stamps who
 * and when.
 */
export async function setEngagementTask(taskId: string, patch: TaskPatch): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('owner_set_engagement_task', {
    p_task_id: taskId, p_patch: patch,
  });
  return { error: error?.message ?? null };
}

/* ----------------------------------------------------------------- Fields */

/**
 * Write one structured field. `value` is always sent as text; the server casts it into the
 * single typed column that matches the field's own data_type, so the browser can never choose
 * which column a value lands in.
 */
export async function setEngagementField(
  fieldId: string,
  patch: { value?: string | null; not_applicable?: boolean },
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('owner_set_engagement_field', {
    p_field_id: fieldId, p_patch: patch,
  });
  return { error: error?.message ?? null };
}

/* ----------------------------------------------------------------- Appointment types */

export interface AppointmentTypePayload {
  spoken_name: string;
  internal_ref?: string | null;
  duration_minutes?: string | null;
  location?: string | null;
  provider?: string | null;
  new_patients_allowed?: boolean;
  existing_patients_only?: boolean;
  prerequisites?: string | null;
  required_information?: string | null;
  booking_horizon_days?: string | null;
  cancellation_rules?: string | null;
  rescheduling_rules?: string | null;
  restrictions?: string | null;
}

export async function upsertAppointmentType(
  engagementId: string, appointmentTypeId: string | null, payload: AppointmentTypePayload,
): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc('owner_upsert_engagement_appointment_type', {
    p_engagement_id: engagementId,
    p_appointment_type_id: appointmentTypeId,
    p_payload: payload,
  });
  if (error) return { id: null, error: error.message };
  return { id: (data as { appointment_type_id?: string })?.appointment_type_id ?? null, error: null };
}

export async function deleteAppointmentType(appointmentTypeId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('owner_delete_engagement_appointment_type', {
    p_appointment_type_id: appointmentTypeId,
  });
  return { error: error?.message ?? null };
}
