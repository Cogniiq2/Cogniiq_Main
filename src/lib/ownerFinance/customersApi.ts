// API layer for owner-side customer & task management. All server-authoritative logic (dedup,
// status transitions, task ordering, offer archiving) lives in the SECURITY DEFINER, owner-gated
// RPCs from migration 20260724120000. This module is a thin, typed wrapper over supabase.rpc and
// never trusts the client for ownership — RLS + the RPC owner checks are the security boundary.

import { supabase } from '@/lib/supabase';
import { secureUuid } from '@/lib/ownerFinance/api';
import type {
  OwnerCustomerListRow, OwnerCustomerDetail, OwnerCustomerStatus, OwnerCustomerTaskStatus,
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
