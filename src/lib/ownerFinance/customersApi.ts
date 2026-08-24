// API layer for owner-side customer & task management. All server-authoritative logic (dedup,
// status transitions, task ordering, offer archiving) lives in the SECURITY DEFINER, owner-gated
// RPCs from migration 20260724120000. This module is a thin, typed wrapper over supabase.rpc and
// never trusts the client for ownership — RLS + the RPC owner checks are the security boundary.

import { supabase } from '@/lib/supabase';
import { secureUuid } from '@/lib/ownerFinance/api';
import type {
  OwnerCustomerListRow, OwnerCustomerDetail, OwnerCustomerDeleteBlockers,
  OwnerCustomerStatus, OwnerCustomerTaskStatus,
} from '@/lib/ownerFinance/types';

/* ----------------------------------------------------------------- Customers */

export async function loadCustomers(entityId: string): Promise<OwnerCustomerListRow[]> {
  const { data, error } = await supabase.rpc('owner_list_customers', { p_entity: entityId });
  if (error) throw error;
  return (data as OwnerCustomerListRow[] | null) ?? [];
}

export async function loadCustomerDetail(customerId: string): Promise<OwnerCustomerDetail | null> {
  const { data, error } = await supabase.rpc('owner_customer_detail', { p_customer_id: customerId });
  if (error) throw error;
  return (data as OwnerCustomerDetail | null) ?? null;
}

export interface CustomerInput {
  business_entity_id: string;
  company?: string | null;
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
  street?: string | null;
  postal_code?: string | null;
  city?: string | null;
  country_code?: string | null;
  notes?: string | null;
  status?: OwnerCustomerStatus;
  client_account_id?: string | null;
  organization_id?: string | null;
}

/**
 * Create a customer (or return an existing match). The server de-duplicates on the strongest key —
 * a linked CRM `client_account_id`, else the normalized email — and never merges on company name
 * alone, so `matched` tells the caller whether an existing record was reused.
 */
export async function createCustomer(input: CustomerInput): Promise<{ id: string | null; matched: boolean; error: string | null }> {
  const { data, error } = await supabase.rpc('owner_create_customer', { p_idempotency_key: secureUuid(), p_payload: input });
  if (error) return { id: null, matched: false, error: error.message };
  const r = data as { customer_id?: string; matched?: boolean };
  return { id: r?.customer_id ?? null, matched: r?.matched ?? false, error: null };
}

export async function updateCustomer(customerId: string, patch: Partial<CustomerInput>): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('owner_update_customer', { p_customer_id: customerId, p_patch: patch });
  return { error: error?.message ?? null };
}

export async function setCustomerStatus(customerId: string, status: OwnerCustomerStatus): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('owner_set_customer_status', { p_customer_id: customerId, p_status: status });
  return { error: error?.message ?? null };
}

/**
 * What stands between this customer and permanent deletion.
 *
 * Read before opening the delete dialog so the confirmation can name the
 * blockers ("2 ausgestellte Rechnungen") instead of only refusing. The same
 * function is re-evaluated inside `owner_delete_customer`, so a stale UI can
 * never talk the server into deleting protected records.
 */
export async function loadDeleteBlockers(customerId: string): Promise<OwnerCustomerDeleteBlockers | null> {
  const { data, error } = await supabase.rpc('owner_customer_delete_blockers', { p_customer_id: customerId });
  if (error) throw error;
  return (data as OwnerCustomerDeleteBlockers | null) ?? null;
}

/**
 * Permanently delete a customer together with its never-issued drafts.
 *
 * Refused by the server — and by the ON DELETE RESTRICT foreign keys underneath
 * it — as soon as one issued invoice, payment, finalized offer or subscription
 * exists. Those customers are archived instead; nothing cascades into
 * accounting data.
 */
export async function deleteCustomer(customerId: string): Promise<{
  deleted: boolean; deletedDraftOffers: number; deletedDraftInvoices: number; error: string | null;
}> {
  const { data, error } = await supabase.rpc('owner_delete_customer', { p_customer_id: customerId });
  if (error) return { deleted: false, deletedDraftOffers: 0, deletedDraftInvoices: 0, error: error.message };
  const r = data as { deleted?: boolean; deleted_draft_offers?: number; deleted_draft_invoices?: number };
  return {
    deleted: r?.deleted ?? false,
    deletedDraftOffers: r?.deleted_draft_offers ?? 0,
    deletedDraftInvoices: r?.deleted_draft_invoices ?? 0,
    error: null,
  };
}

/** Hide from the active CRM and from finance selectors. Destroys nothing. */
export async function archiveCustomer(customerId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('owner_archive_customer', { p_customer_id: customerId });
  return { error: error?.message ?? null };
}

export async function unarchiveCustomer(customerId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('owner_unarchive_customer', { p_customer_id: customerId });
  return { error: error?.message ?? null };
}

/* ----------------------------------------------------------------- Invoices */

/**
 * Storno, not deletion. An issued invoice keeps its number, totals and lines —
 * §147 AO retention — and only gains the fact, time, actor and reason of its
 * cancellation. Drafts are refused here: they are deleted instead.
 */
export async function cancelInvoice(invoiceId: string, reason: string | null): Promise<{
  status: string | null; alreadyCancelled: boolean; error: string | null;
}> {
  const { data, error } = await supabase.rpc('owner_cancel_invoice', { p_invoice_id: invoiceId, p_reason: reason });
  if (error) return { status: null, alreadyCancelled: false, error: error.message };
  const r = data as { status?: string; already_cancelled?: boolean };
  return { status: r?.status ?? null, alreadyCancelled: r?.already_cancelled ?? false, error: null };
}

/** Point an invoice at the canonical customer. Re-pointing is draft-only. */
export async function linkInvoiceCustomer(invoiceId: string, ownerCustomerId: string | null): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('owner_link_invoice_customer', { p_invoice_id: invoiceId, p_owner_customer_id: ownerCustomerId });
  return { error: error?.message ?? null };
}

/* ----------------------------------------------------------------- Tasks */

export interface TaskInput {
  customer_id: string;
  title: string;
  description?: string | null;
  priority?: string;
  due_date?: string | null;
  notes?: string | null;
  status?: OwnerCustomerTaskStatus;
}

export async function createTask(input: TaskInput): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc('owner_create_customer_task', { p_idempotency_key: secureUuid(), p_payload: input });
  if (error) return { id: null, error: error.message };
  return { id: (data as { task_id?: string })?.task_id ?? null, error: null };
}

export async function updateTask(taskId: string, patch: Partial<Omit<TaskInput, 'customer_id'>>): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('owner_update_customer_task', { p_task_id: taskId, p_patch: patch });
  return { error: error?.message ?? null };
}

export async function setTaskStatus(taskId: string, status: OwnerCustomerTaskStatus): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('owner_set_customer_task_status', { p_task_id: taskId, p_status: status });
  return { error: error?.message ?? null };
}

export async function deleteTask(taskId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('owner_delete_customer_task', { p_task_id: taskId });
  return { error: error?.message ?? null };
}

export async function reorderTasks(customerId: string, orderedIds: string[]): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('owner_reorder_customer_tasks', { p_customer_id: customerId, p_ordered_ids: orderedIds });
  return { error: error?.message ?? null };
}

/* ----------------------------------------------------------------- Offer archive / link */

export async function archiveOffer(offerId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('owner_archive_offer', { p_offer_id: offerId });
  return { error: error?.message ?? null };
}

export async function unarchiveOffer(offerId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('owner_unarchive_offer', { p_offer_id: offerId });
  return { error: error?.message ?? null };
}

export async function linkOfferCustomer(offerId: string, ownerCustomerId: string | null): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('owner_link_offer_customer', { p_offer_id: offerId, p_owner_customer_id: ownerCustomerId });
  return { error: error?.message ?? null };
}
