// Customer-facing platform types. These mirror EXACTLY the `returns table (...)`
// allow-lists of the customer read RPCs — they are not a projection of the
// underlying tables, which carry internal columns the customer never receives.

export type CustomerProjectStatus =
  | 'on_track'
  | 'attention_needed'
  | 'blocked'
  | 'completed'
  | 'paused';

export type CustomerNextActionOwner = 'customer' | 'cogniiq';

export type CustomerMilestoneStatus =
  | 'upcoming'
  | 'in_progress'
  | 'completed'
  | 'delayed'
  | 'cancelled';

export type CustomerDocumentCategory =
  | 'offer'
  | 'acceptance'
  | 'contract'
  | 'invoice'
  | 'concept'
  | 'project_document'
  | 'meeting_notes'
  | 'handover'
  | 'manual'
  | 'dpa'
  | 'customer_upload';

/** Row shape of list_customer_projects() / get_customer_project(). */
export interface CustomerProject {
  id: string;
  organization_id: string;
  title: string;
  business_objective: string;
  status: CustomerProjectStatus;
  phase: string;
  progress_percent: number;
  start_date: string | null;
  target_date: string | null;
  next_action_summary: string | null;
  next_action_owner: CustomerNextActionOwner | null;
  next_action_due_date: string | null;
  customer_safe_blocker_summary: string | null;
  /** Null unless the referenced profile CURRENTLY holds an internal Cogniiq role. */
  contact_display_name: string | null;
  contact_role_label: string | null;
  contact_business_email: string | null;
  created_at: string;
  updated_at: string;
}

/** Row shape of list_customer_project_milestones(). */
export interface CustomerMilestone {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: CustomerMilestoneStatus;
  target_date: string | null;
  completed_at: string | null;
  sort_order: number;
}

/** Row shape of list_customer_documents(). Never carries a storage path. */
export interface CustomerDocument {
  id: string;
  project_id: string | null;
  category: CustomerDocumentCategory;
  title: string;
  version: number;
  content_type: string | null;
  size_bytes: number | null;
  uploaded_at: string;
}

/** Row shape of list_customer_invoices(). */
export interface CustomerInvoice {
  invoice_id: string;
  project_id: string | null;
  invoice_number: string | null;
  status: string;
  issue_date: string | null;
  due_date: string | null;
  currency: string;
  net_total_cents: number;
  vat_total_cents: number;
  gross_total_cents: number;
  amount_paid_cents: number;
  outstanding_cents: number;
  /** customer_documents id of the canonical invoice PDF, or null if none is published. */
  pdf_document_id: string | null;
}

// ---------------------------------------------------------------------------
// Display vocabulary (German). Kept in one place so status wording is identical
// everywhere it appears.
// ---------------------------------------------------------------------------

export const customerProjectStatusLabels: Record<CustomerProjectStatus, string> = {
  on_track: 'Im Plan',
  attention_needed: 'Aufmerksamkeit erforderlich',
  blocked: 'Blockiert',
  completed: 'Abgeschlossen',
  paused: 'Pausiert',
};

export const customerMilestoneStatusLabels: Record<CustomerMilestoneStatus, string> = {
  upcoming: 'Geplant',
  in_progress: 'In Arbeit',
  completed: 'Abgeschlossen',
  delayed: 'Verzögert',
  cancelled: 'Entfallen',
};

export const customerDocumentCategoryLabels: Record<CustomerDocumentCategory, string> = {
  offer: 'Angebot',
  acceptance: 'Annahmebestätigung',
  contract: 'Vertrag',
  invoice: 'Rechnung',
  concept: 'Konzept',
  project_document: 'Projektunterlage',
  meeting_notes: 'Gesprächsnotiz',
  handover: 'Übergabe',
  manual: 'Anleitung',
  dpa: 'Auftragsverarbeitung',
  customer_upload: 'Ihr Upload',
};

export const customerInvoiceStatusLabels: Record<string, string> = {
  issued: 'Offen',
  partially_paid: 'Teilweise bezahlt',
  paid: 'Bezahlt',
  overdue: 'Überfällig',
  credited: 'Gutgeschrieben',
};

/**
 * Projects treated as ACTIVE on the customer home page. `completed` and `paused`
 * are deliberately excluded — the home page answers "what is happening now".
 * Archived projects never reach the client at all (the RPC filters them).
 */
export const activeCustomerProjectStatuses: CustomerProjectStatus[] = [
  'on_track',
  'attention_needed',
  'blocked',
];

export function isActiveCustomerProject(project: CustomerProject): boolean {
  return activeCustomerProjectStatuses.includes(project.status);
}

export type CustomerStatusTone = 'neutral' | 'success' | 'attention' | 'danger' | 'paused';

export const customerProjectStatusTones: Record<CustomerProjectStatus, CustomerStatusTone> = {
  on_track: 'success',
  attention_needed: 'attention',
  blocked: 'danger',
  completed: 'neutral',
  paused: 'paused',
};
