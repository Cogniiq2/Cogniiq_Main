import { FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

import type {
  CustomerDocumentCategory,
  CustomerMilestoneStatus,
  CustomerProjectStatus,
} from './types';

// Owner-side management of customer-visible projects, milestones and documents.
// Every mutation goes through an is_platform_admin()-gated SECURITY DEFINER RPC —
// there is no direct table write from the browser.

export interface OwnerCustomerProject {
  id: string;
  organization_id: string;
  engagement_id: string | null;
  title: string;
  business_objective: string;
  status: CustomerProjectStatus;
  phase: string;
  progress_percent: number;
  start_date: string | null;
  target_date: string | null;
  next_action_summary: string | null;
  next_action_owner: 'customer' | 'cogniiq' | null;
  next_action_due_date: string | null;
  customer_safe_blocker_summary: string | null;
  contact_profile_id: string | null;
  contact_role_label: string | null;
  contact_business_email: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface OwnerCustomerMilestone {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: CustomerMilestoneStatus;
  target_date: string | null;
  completed_at: string | null;
  sort_order: number;
}

export interface OwnerCustomerDocument {
  id: string;
  project_id: string | null;
  category: CustomerDocumentCategory;
  title: string;
  version: number;
  customer_visible: boolean;
  published_at: string | null;
  archived_at: string | null;
  content_type: string | null;
  size_bytes: number | null;
  uploaded_at: string;
  owner_generated_document_id: string | null;
}

type Result<T> = { data: T; error: string | null };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string | null | undefined): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

function toMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error ?? 'Unbekannter Fehler');
}

/**
 * Projects for one organization. Internal staff read the table directly (their RLS
 * policy permits it) because the owner view legitimately includes internal columns
 * such as engagement_id and the archived flag.
 */
export async function loadOwnerCustomerProjects(
  organizationId: string,
): Promise<Result<OwnerCustomerProject[]>> {
  const { data, error } = await supabase
    .from('customer_projects')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });
  if (error) return { data: [], error: toMessage(error) };
  return { data: (data ?? []) as OwnerCustomerProject[], error: null };
}

export async function loadOwnerProjectMilestones(
  projectId: string,
): Promise<Result<OwnerCustomerMilestone[]>> {
  const { data, error } = await supabase
    .from('customer_project_milestones')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true });
  if (error) return { data: [], error: toMessage(error) };
  return { data: (data ?? []) as OwnerCustomerMilestone[], error: null };
}

export async function loadOwnerProjectDocuments(
  organizationId: string,
): Promise<Result<OwnerCustomerDocument[]>> {
  const { data, error } = await supabase
    .from('customer_documents')
    .select('id, project_id, category, title, version, customer_visible, published_at, archived_at, content_type, size_bytes, uploaded_at, owner_generated_document_id')
    .eq('organization_id', organizationId)
    .order('uploaded_at', { ascending: false });
  if (error) return { data: [], error: toMessage(error) };
  return { data: (data ?? []) as OwnerCustomerDocument[], error: null };
}

/**
 * Create a customer-visible project for a CRM customer.
 *
 * Fails when the CRM customer has no linked organization — a project cannot be
 * tenant-scoped without one, and creating an unreachable row would be worse than
 * an explicit error. The caller should disable the action in that case.
 */
export async function createCustomerProject(input: {
  ownerCustomerId: string;
  title: string;
  businessObjective: string;
  phase: string;
}): Promise<Result<string | null>> {
  const { data, error } = await supabase.rpc('create_customer_project_for_owner_customer', {
    p_owner_customer_id: input.ownerCustomerId,
    p_title: input.title,
    p_business_objective: input.businessObjective,
    p_phase: input.phase,
  });
  if (error) return { data: null, error: toMessage(error) };
  return { data: data as string, error: null };
}

/**
 * Create a customer-visible project directly from an organization id — the path
 * used by the canonical /admin/clients/:organizationId "Kundenportal" tab, which
 * has no owner_customers (Finance CRM) row at all. Never creates, backfills or
 * merges an owner_customers row as a side effect.
 */
export async function createCustomerProjectForOrganization(input: {
  organizationId: string;
  title: string;
  businessObjective: string;
  phase: string;
}): Promise<Result<string | null>> {
  const { data, error } = await supabase.rpc('create_customer_project_for_organization', {
    p_organization_id: input.organizationId,
    p_title: input.title,
    p_business_objective: input.businessObjective,
    p_phase: input.phase,
  });
  if (error) return { data: null, error: toMessage(error) };
  return { data: data as string, error: null };
}

export async function updateCustomerProject(input: {
  projectId: string;
  title: string;
  businessObjective: string;
  phase: string;
  status: CustomerProjectStatus;
  progressPercent: number;
  startDate: string | null;
  targetDate: string | null;
  blockerSummary: string | null;
  contactProfileId: string | null;
  contactRoleLabel: string | null;
  contactBusinessEmail: string | null;
}): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('update_customer_project', {
    p_project_id: input.projectId,
    p_title: input.title,
    p_business_objective: input.businessObjective,
    p_phase: input.phase,
    p_status: input.status,
    p_progress_percent: input.progressPercent,
    p_start_date: input.startDate,
    p_target_date: input.targetDate,
    p_customer_safe_blocker_summary: input.blockerSummary,
    p_contact_profile_id: input.contactProfileId,
    p_contact_role_label: input.contactRoleLabel,
    p_contact_business_email: input.contactBusinessEmail,
  });
  return { error: error ? toMessage(error) : null };
}

/**
 * Next action. Summary, owner and due date are all-or-nothing: clearing the summary
 * clears the other two. The RPC enforces this and returns a clear message.
 */
export async function setCustomerProjectNextAction(input: {
  projectId: string;
  summary: string | null;
  owner: 'customer' | 'cogniiq' | null;
  dueDate: string | null;
}): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('set_customer_project_next_action', {
    p_project_id: input.projectId,
    p_summary: input.summary,
    p_owner: input.owner,
    p_due_date: input.dueDate,
  });
  return { error: error ? toMessage(error) : null };
}

export async function archiveCustomerProject(projectId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('archive_customer_project', { p_project_id: projectId });
  return { error: error ? toMessage(error) : null };
}

export async function createCustomerMilestone(input: {
  projectId: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  sortOrder: number;
}): Promise<Result<string | null>> {
  const { data, error } = await supabase.rpc('create_customer_project_milestone', {
    p_project_id: input.projectId,
    p_title: input.title,
    p_description: input.description,
    p_target_date: input.targetDate,
    p_sort_order: input.sortOrder,
  });
  if (error) return { data: null, error: toMessage(error) };
  return { data: data as string, error: null };
}

/** completed_at is derived from status server-side and is never supplied here. */
export async function updateCustomerMilestone(input: {
  milestoneId: string;
  title: string;
  description: string | null;
  status: CustomerMilestoneStatus;
  targetDate: string | null;
  sortOrder: number;
}): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('update_customer_project_milestone', {
    p_milestone_id: input.milestoneId,
    p_title: input.title,
    p_description: input.description,
    p_status: input.status,
    p_target_date: input.targetDate,
    p_sort_order: input.sortOrder,
  });
  return { error: error ? toMessage(error) : null };
}

export async function deleteCustomerMilestone(milestoneId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('delete_customer_project_milestone', {
    p_milestone_id: milestoneId,
  });
  return { error: error ? toMessage(error) : null };
}

/**
 * Publish a canonical owner PDF (offer / signed acceptance certificate / invoice) to
 * a customer. The database validates that the source document belongs to the same
 * organization, is finalized, and that the category matches the document type — an
 * ordinary offer can never be published as an acceptance.
 */
export async function publishOwnerDocumentToCustomer(input: {
  organizationId: string;
  projectId: string | null;
  category: CustomerDocumentCategory;
  title: string;
  ownerGeneratedDocumentId: string;
}): Promise<Result<string | null>> {
  const { data, error } = await supabase.rpc('register_customer_document_from_owner_source', {
    p_organization_id: input.organizationId,
    p_project_id: input.projectId,
    p_category: input.category,
    p_title: input.title,
    p_owner_generated_document_id: input.ownerGeneratedDocumentId,
  });
  if (error) return { data: null, error: toMessage(error) };
  return { data: data as string, error: null };
}

export async function setCustomerDocumentVisibility(
  documentId: string,
  visible: boolean,
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('set_customer_document_visibility', {
    p_document_id: documentId,
    p_visible: visible,
  });
  return { error: error ? toMessage(error) : null };
}

/** Permanent retirement. Published documents are archived, never hard-deleted. */
export async function archiveCustomerDocument(documentId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('archive_customer_document', { p_document_id: documentId });
  return { error: error ? toMessage(error) : null };
}

export interface OwnerInvoiceCandidate {
  id: string;
  invoice_number: string | null;
  status: string;
  /**
   * Null means the invoice has no organization yet — linking/publishing is refused
   * by the database until `assignInvoiceOrganization` fixes it. A non-null value
   * that differs from the project's organization means the invoice belongs to a
   * DIFFERENT customer and can never be assigned here.
   */
  organization_id: string | null;
}

/**
 * Invoices that could plausibly belong to this customer: already scoped to their
 * organization, or matched via the CRM client account (covers invoices created
 * before portal provisioning, which is exactly the case that needs the
 * organization-assignment fix below).
 */
export async function loadCustomerInvoiceCandidates(input: {
  clientAccountId: string | null;
  organizationId: string;
}): Promise<Result<OwnerInvoiceCandidate[]>> {
  let query = supabase
    .from('owner_invoices')
    .select('id, invoice_number, status, organization_id')
    .order('issue_date', { ascending: false });

  // `.or()` takes a raw PostgREST filter EXPRESSION, not bound parameters: anything
  // interpolated here is grammar, not a value. Both ids are UUIDs from server-side
  // records, so this is defence in depth rather than a known hole — but a value that
  // is not UUID-shaped must never be spliced into the expression at all.
  const canUseOrFilter = isUuid(input.organizationId) && isUuid(input.clientAccountId);
  query = canUseOrFilter
    ? query.or(`organization_id.eq.${input.organizationId},client_account_id.eq.${input.clientAccountId}`)
    : query.eq('organization_id', input.organizationId);

  const { data, error } = await query;
  if (error) return { data: [], error: toMessage(error) };
  return { data: (data ?? []) as OwnerInvoiceCandidate[], error: null };
}

export interface OwnerLinkedInvoice {
  invoice_id: string;
  invoice_number: string | null;
  status: string;
}

export async function loadLinkedProjectInvoices(
  projectId: string,
): Promise<Result<OwnerLinkedInvoice[]>> {
  const { data: links, error: linkError } = await supabase
    .from('customer_project_invoices')
    .select('invoice_id')
    .eq('project_id', projectId);
  if (linkError) return { data: [], error: toMessage(linkError) };

  const ids = (links ?? []).map((row) => row.invoice_id as string);
  if (ids.length === 0) return { data: [], error: null };

  const { data: invoiceRows, error: invoiceError } = await supabase
    .from('owner_invoices')
    .select('id, invoice_number, status')
    .in('id', ids);
  if (invoiceError) return { data: [], error: toMessage(invoiceError) };

  return {
    data: (invoiceRows ?? []).map((row) => ({
      invoice_id: row.id as string,
      invoice_number: row.invoice_number as string | null,
      status: row.status as string,
    })),
    error: null,
  };
}

/**
 * Assigns an organization to an invoice that does not have one yet — the actual
 * fix path for the null-organization gap. Refuses (server-side) to reassign an
 * invoice that already belongs to a different organization: this is a one-way,
 * null-to-set operation only, never a retroactive move between customers.
 */
export async function assignInvoiceOrganization(
  invoiceId: string,
  organizationId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('assign_invoice_organization', {
    p_invoice_id: invoiceId,
    p_organization_id: organizationId,
  });
  return { error: error ? toMessage(error) : null };
}

export async function linkProjectInvoice(
  projectId: string,
  invoiceId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('link_customer_project_invoice', {
    p_project_id: projectId,
    p_invoice_id: invoiceId,
  });
  return { error: error ? toMessage(error) : null };
}

export async function unlinkProjectInvoice(
  projectId: string,
  invoiceId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('unlink_customer_project_invoice', {
    p_project_id: projectId,
    p_invoice_id: invoiceId,
  });
  return { error: error ? toMessage(error) : null };
}

// Mirrors supabase/functions/customer-document-upload/handler.ts exactly (MAX_UPLOAD_BYTES,
// ALLOWED_CONTENT_TYPES). Kept here so the upload dialog can show the real limits and
// reject obviously-invalid files before spending a round trip — the Edge Function remains
// the actual enforcement point either way.
export const CUSTOMER_UPLOAD_MAX_BYTES = 25 * 1024 * 1024;

export const CUSTOMER_UPLOAD_ALLOWED_CONTENT_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export const customerUploadContentTypeLabels: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/png': 'PNG',
  'image/jpeg': 'JPEG',
  'text/plain': 'TXT',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
};

// Categories reserved for the canonical owner registry (offer / acceptance / invoice) can
// only be populated by publishOwnerDocumentToCustomer, never by a raw upload — the Edge
// Function enforces this too; this list keeps the upload dialog from even offering them.
export const CUSTOMER_UPLOAD_CATEGORIES: CustomerDocumentCategory[] = [
  'contract',
  'concept',
  'project_document',
  'meeting_notes',
  'handover',
  'manual',
  'dpa',
  'customer_upload',
];

/** German, owner-facing translation of the Edge Function's stable error codes. */
function describeUploadErrorCode(code: string | null): string | null {
  switch (code) {
    case 'authentication_required': return 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.';
    case 'not_authorized': return 'Für den Dokumenten-Upload fehlt Ihrem Konto die Berechtigung.';
    case 'invalid_organization_id': return 'Ungültige Organisation.';
    case 'invalid_project_id': return 'Ungültiges Projekt.';
    case 'category_required': return 'Bitte wählen Sie eine Kategorie.';
    case 'category_requires_canonical_document':
      return 'Diese Kategorie ist Angeboten, Annahmebestätigungen und Rechnungen aus dem jeweiligen Beleg vorbehalten und kann nicht direkt hochgeladen werden.';
    case 'title_required': return 'Bitte geben Sie einen Titel ein.';
    case 'unsupported_content_type': return 'Dieser Dateityp wird nicht unterstützt. Erlaubt sind PDF, PNG, JPEG, TXT und DOCX.';
    case 'file_required': return 'Bitte wählen Sie eine Datei aus.';
    case 'file_too_large': return 'Die Datei überschreitet das Limit von 25 MB.';
    case 'project_not_found': return 'Das ausgewählte Projekt wurde nicht gefunden.';
    case 'project_organization_mismatch': return 'Das ausgewählte Projekt gehört zu einer anderen Organisation.';
    case 'organization_not_found': return 'Die Organisation wurde nicht gefunden.';
    case 'upload_failed': return 'Der Upload ist fehlgeschlagen. Bitte versuchen Sie es erneut.';
    case 'upload_verification_failed': return 'Der Upload konnte nicht verifiziert werden. Bitte versuchen Sie es erneut.';
    case 'stored_object_rejected': return 'Die gespeicherte Datei entspricht nicht den Vorgaben und wurde verworfen.';
    case 'registration_failed': return 'Das Dokument konnte nicht registriert werden. Bitte versuchen Sie es erneut.';
    default: return null;
  }
}

async function extractFunctionErrorCode(error: unknown): Promise<string | null> {
  if (!(error instanceof FunctionsHttpError)) return null;
  try {
    const body = await error.context.clone().json();
    return typeof body?.error === 'string' ? body.error : null;
  } catch {
    return null;
  }
}

/**
 * Upload a customer document through the controlled server-side flow.
 *
 * The browser deliberately does NOT touch Storage: the Edge Function generates the
 * path, enforces the MIME allow-list and size cap, verifies the stored object and
 * compensates on partial failure. Uploaded documents start unpublished.
 */
export async function uploadCustomerDocument(input: {
  organizationId: string;
  projectId: string | null;
  category: CustomerDocumentCategory;
  title: string;
  file: File;
}): Promise<Result<string | null>> {
  const form = new FormData();
  form.append('organization_id', input.organizationId);
  if (input.projectId) form.append('project_id', input.projectId);
  form.append('category', input.category);
  form.append('title', input.title);
  form.append('file', input.file);

  const { data, error } = await supabase.functions.invoke('customer-document-upload', {
    body: form,
  });
  if (error) {
    const code = await extractFunctionErrorCode(error);
    return { data: null, error: describeUploadErrorCode(code) ?? toMessage(error) };
  }
  const documentId = (data as { document_id?: string } | null)?.document_id ?? null;
  if (!documentId) return { data: null, error: 'Der Upload konnte nicht registriert werden.' };
  return { data: documentId, error: null };
}
