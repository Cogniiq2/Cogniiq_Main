import { supabase } from '@/lib/supabase';

import { toCustomerFacingError } from './customerErrors';
import type {
  CustomerDocument,
  CustomerInvoice,
  CustomerMilestone,
  CustomerProject,
} from './types';

// Every customer read goes through a SECURITY DEFINER RPC. There is deliberately no
// `.from(table).select()` anywhere in this file: customers hold no table grant, and the
// RPC signature is the column allow-list. Passing an organization id from the client
// would be meaningless — the functions derive tenancy from auth.uid() server-side.

export interface CustomerApiResult<T> {
  data: T;
  error: string | null;
}

/**
 * Build a failed result.
 *
 * The raw backend error is NEVER placed in `error`: it is translated to safe
 * German customer copy (and logged to the console) by `toCustomerFacingError`.
 * Every customer surface renders this string directly, so anything internal —
 * schema names, function signatures, constraint text — must not reach it.
 */
function fail<T>(fallback: T, error: unknown, message: string): CustomerApiResult<T> {
  return { data: fallback, error: toCustomerFacingError(error, message) };
}

export async function fetchCustomerProjects(): Promise<CustomerApiResult<CustomerProject[]>> {
  const { data, error } = await supabase.rpc('list_customer_projects');
  if (error) return fail<CustomerProject[]>([], error, 'Ihre Projekte konnten nicht geladen werden.');
  return { data: (data ?? []) as CustomerProject[], error: null };
}

export async function fetchCustomerProject(
  projectId: string,
): Promise<CustomerApiResult<CustomerProject | null>> {
  const { data, error } = await supabase.rpc('get_customer_project', { p_project_id: projectId });
  if (error) return fail<CustomerProject | null>(null, error, 'Das Projekt konnte nicht geladen werden.');
  const rows = (data ?? []) as CustomerProject[];
  // Zero rows is the single, indistinguishable answer for "not yours", "archived"
  // and "does not exist" — the UI must not try to tell them apart either.
  return { data: rows[0] ?? null, error: null };
}

export async function fetchCustomerMilestones(
  projectId: string,
): Promise<CustomerApiResult<CustomerMilestone[]>> {
  const { data, error } = await supabase.rpc('list_customer_project_milestones', {
    p_project_id: projectId,
  });
  if (error) return fail<CustomerMilestone[]>([], error, 'Die Meilensteine konnten nicht geladen werden.');
  return { data: (data ?? []) as CustomerMilestone[], error: null };
}

/** `projectId = null` returns every visible document in the organization (/app/documents). */
export async function fetchCustomerDocuments(
  projectId: string | null = null,
): Promise<CustomerApiResult<CustomerDocument[]>> {
  const { data, error } = await supabase.rpc('list_customer_documents', {
    p_project_id: projectId,
  });
  if (error) return fail<CustomerDocument[]>([], error, 'Die Dokumente konnten nicht geladen werden.');
  return { data: (data ?? []) as CustomerDocument[], error: null };
}

/** `projectId = null` returns every issued invoice in the organization (/app/billing). */
export async function fetchCustomerInvoices(
  projectId: string | null = null,
): Promise<CustomerApiResult<CustomerInvoice[]>> {
  const { data, error } = await supabase.rpc('list_customer_invoices', {
    p_project_id: projectId,
  });
  if (error) return fail<CustomerInvoice[]>([], error, 'Die Rechnungen konnten nicht geladen werden.');
  return { data: (data ?? []) as CustomerInvoice[], error: null };
}

/**
 * Exchange a document id for a short-lived signed URL.
 *
 * The browser never learns a bucket name or an object path: it sends only the
 * document id, and the Edge Function verifies the session, re-checks organization
 * membership and visibility server-side, then mints a 10-minute single-object URL.
 */
export async function requestCustomerDocumentUrl(
  documentId: string,
): Promise<CustomerApiResult<string | null>> {
  const { data, error } = await supabase.functions.invoke('customer-document-download', {
    body: { document_id: documentId },
  });
  if (error) return fail<string | null>(null, error, 'Der Download konnte nicht gestartet werden. Bitte versuchen Sie es erneut.');
  const url = (data as { url?: string } | null)?.url ?? null;
  if (!url) return { data: null, error: 'Der Download-Link konnte nicht erstellt werden.' };
  return { data: url, error: null };
}
