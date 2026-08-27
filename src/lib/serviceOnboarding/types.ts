// Types for the client service delivery layer: which services a customer receives, and the
// template-instantiated onboarding engagement that sits underneath each one.
//
// These mirror migration 20260830120000 exactly. The customer itself stays canonical in
// `OwnerCustomer` — nothing here re-declares a name, an address or an email.

export type ServiceKey = 'ai_receptionist' | 'automations' | 'website' | 'custom_project';

export type ServiceState = 'active' | 'paused' | 'archived';

/** Primary navigation areas. The 20 operational sections fold into these nine. */
export type NavGroup =
  | 'overview' | 'discovery' | 'compliance' | 'integration'
  | 'agent' | 'telephony' | 'testing' | 'golive' | 'monitoring';

export type ReadinessCategory =
  | 'commercial' | 'discovery' | 'legal' | 'integration' | 'knowledge'
  | 'agent' | 'backend' | 'telephony' | 'testing' | 'client_approval';

export type EngagementStatus =
  | 'lead' | 'contracted' | 'discovery' | 'building' | 'integrating'
  | 'testing' | 'client_approval' | 'ready_for_go_live' | 'live' | 'monitoring';

export type EngagementTaskStatus =
  | 'not_started' | 'in_progress' | 'waiting_for_client'
  | 'blocked' | 'complete' | 'not_applicable';

export type FieldDataType =
  | 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'date' | 'url' | 'phone';

export type IntegrationMode = 'full_automation' | 'partial_automation';

export interface FieldOption {
  value: string;
  label: string;
}

export interface EngagementSection {
  id: string;
  engagement_id: string;
  code: string;
  title: string;
  description: string | null;
  nav_group: NavGroup;
  readiness_category: ReadinessCategory;
  healthcare_only: boolean;
  sort_order: number;
}

export interface EngagementTask {
  id: string;
  engagement_id: string;
  template_task_id: string | null;
  section_code: string;
  /** Stable machine code (LEG-003). Metadata — never the UI hierarchy. */
  code: string;
  title: string;
  description: string | null;
  readiness_category: ReadinessCategory;
  is_required: boolean;
  is_go_live_blocker: boolean;
  healthcare_only: boolean;
  status: EngagementTaskStatus;
  blocker_reason: string | null;
  client_request: string | null;
  evidence_url: string | null;
  evidence_note: string | null;
  notes: string | null;
  reviewer: string | null;
  completed_by: string | null;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface EngagementField {
  id: string;
  engagement_id: string;
  template_field_id: string | null;
  section_code: string;
  code: string;
  label: string;
  description: string | null;
  data_type: FieldDataType;
  options: FieldOption[];
  unit: string | null;
  placeholder: string | null;
  is_required: boolean;
  is_go_live_blocker: boolean;
  healthcare_only: boolean;
  value_text: string | null;
  value_number: number | null;
  value_bool: boolean | null;
  value_date: string | null;
  not_applicable: boolean;
  sort_order: number;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EngagementAppointmentType {
  id: string;
  engagement_id: string;
  internal_ref: string | null;
  spoken_name: string;
  duration_minutes: number | null;
  location: string | null;
  provider: string | null;
  new_patients_allowed: boolean;
  existing_patients_only: boolean;
  prerequisites: string | null;
  required_information: string | null;
  booking_horizon_days: number | null;
  cancellation_rules: string | null;
  rescheduling_rules: string | null;
  restrictions: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface EngagementActivity {
  id: string;
  event_type: string;
  summary: string;
  task_id: string | null;
  field_code: string | null;
  created_at: string;
}

export interface ServiceEngagement {
  id: string;
  business_entity_id: string;
  customer_id: string;
  customer_service_id: string;
  service_key: ServiceKey;
  /** Snapshot: which template version this engagement was born from. */
  template_id: string | null;
  template_code: string | null;
  template_version: number | null;
  lifecycle_status: EngagementStatus;
  healthcare: boolean;
  integration_mode: IntegrationMode | null;
  integration_limitations: string | null;
  summary: string | null;
  go_live_target_date: string | null;
  went_live_at: string | null;
  monitoring_until: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** One unresolved go-live blocker, as computed by the server's gate function. */
export interface GoLiveBlocker {
  kind: 'task' | 'field';
  id: string;
  code: string;
  title: string;
  category: ReadinessCategory | null;
  section_code: string;
  status: string;
  reason: string | null;
  client_request: string | null;
}

/** Server-computed go-live gate. The browser never decides this on its own. */
export interface GoLiveGate {
  ready: boolean;
  count: number;
  blockers: GoLiveBlocker[];
}

export interface EngagementDetail {
  engagement: ServiceEngagement;
  customer: {
    id: string;
    company: string | null;
    contact_name: string | null;
    email: string | null;
    phone: string | null;
    city: string | null;
    status: string;
  };
  sections: EngagementSection[];
  tasks: EngagementTask[];
  fields: EngagementField[];
  appointment_types: EngagementAppointmentType[];
  activity: EngagementActivity[];
  go_live: GoLiveGate;
}

/** Headline projection used by the customer page's service strip. */
export interface CustomerServiceSummary {
  id: string;
  customer_id: string;
  service_key: ServiceKey;
  state: ServiceState;
  label: string | null;
  notes: string | null;
  activated_at: string;
  archived_at: string | null;
  created_at: string;
  engagement: {
    id: string;
    lifecycle_status: EngagementStatus;
    healthcare: boolean;
    integration_mode: IntegrationMode | null;
    template_code: string | null;
    template_version: number | null;
    went_live_at: string | null;
    go_live_target_date: string | null;
    task_total: number;
    task_done: number;
    blocker_count: number;
  } | null;
}
