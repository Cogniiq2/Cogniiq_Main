// Owner-only API for multi-payment invoices, recurring REVENUE contracts and bulk import.
//
// Every function here is a thin typed wrapper over one owner-gated SECURITY DEFINER RPC from
// 20260828120000_owner_finance_multipay_recurring_bulk.sql. No money is computed in the
// browser: line totals, VAT, gross, invoice numbers and invoice status are all derived
// server-side. What the client DOES supply is actual payment amounts and dates, because those
// are real accounting facts the server cannot derive — and the server still validates them
// (positive, not before the invoice, never exceeding the gross in total).
//
// Nothing in this module can send a customer anything. There is no email path, no automation
// enqueue, no edge-function invoke and no bank integration — asserted by financeWriteSafety.test.ts.

import { supabase } from '@/lib/supabase';
import { secureUuid, isMissingBackendError, type InvoiceLineInput } from '@/lib/ownerFinance/api';

/** Migration that provisions everything in this module. */
export const OWNER_FINANCE_EXTENDED_MIGRATION = '20260828120000_owner_finance_multipay_recurring_bulk.sql';

/* ------------------------------------------------------------------ Payments */

export interface InvoicePaymentInput {
  payment_date: string;
  amount_cents: number;
  method?: string | null;
  reference?: string | null;
  note?: string | null;
}

export interface MultiPaymentInvoiceResult {
  invoice_id: string;
  invoice_number: string | null;
  status: string;
  payment_ids: string[];
  payment_count: number;
  amount_paid_cents: number;
  net_total_cents: number;
  vat_total_cents: number;
  gross_total_cents: number;
  open_cents: number;
  issue_date: string;
}

/**
 * Record a historical invoice together with EVERY payment that settled it.
 *
 * Unlike recordHistoricalPaidInvoice (which is unchanged and still handles the
 * settle-in-full-with-one-payment case), this deliberately permits a partially paid
 * result: instalments that are still running are a real state worth recording.
 */
export async function recordHistoricalInvoiceWithPayments(
  header: Record<string, unknown>,
  lines: InvoiceLineInput[],
  payments: InvoicePaymentInput[],
): Promise<{ result: MultiPaymentInvoiceResult | null; error: string | null; backendMissing: boolean }> {
  const { data, error } = await supabase.rpc('record_owner_historical_invoice_with_payments', {
    p_idempotency_key: secureUuid(),
    p_header: header,
    p_lines: lines,
    p_payments: payments,
  });
  if (error) return { result: null, error: error.message, backendMissing: isMissingBackendError(error) };
  return { result: (data as MultiPaymentInvoiceResult) ?? null, error: null, backendMissing: false };
}

/**
 * Add one further payment to an existing invoice.
 *
 * Metadata travels WITH the payment in the same server statement, rather than being
 * patched onto the row from the browser afterwards.
 */
export async function addInvoicePayment(
  invoiceId: string,
  payment: InvoicePaymentInput,
): Promise<{ result: { status: string; amount_paid_cents: number; open_cents: number } | null; error: string | null }> {
  const { data, error } = await supabase.rpc('owner_add_invoice_payment', {
    p_idempotency_key: secureUuid(),
    p_invoice_id: invoiceId,
    p_payment: payment,
  });
  if (error) return { result: null, error: error.message };
  return { result: data as { status: string; amount_paid_cents: number; open_cents: number }, error: null };
}

/** Payment history of one invoice, newest first. Read-only. */
export async function loadInvoicePayments(invoiceId: string): Promise<Array<{
  id: string; payment_date: string; amount_cents: number;
  payment_method: string | null; reference: string | null; notes: string | null;
}>> {
  const { data, error } = await supabase
    .from('owner_payments')
    .select('id, payment_date, amount_cents, payment_method, reference, notes')
    .eq('invoice_id', invoiceId)
    .order('payment_date', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Array<{
    id: string; payment_date: string; amount_cents: number;
    payment_method: string | null; reference: string | null; notes: string | null;
  }>;
}

/* --------------------------------------------------- Recurring revenue contracts */

export type RevenueContractStatus = 'active' | 'paused' | 'ended';
export type BillingFrequency = 'monthly' | 'quarterly' | 'yearly';

export interface RevenueContractLineInput {
  description: string;
  quantity_milli?: number;
  unit_price_cents: number;
  vat_rate_bp?: number;
  vat_treatment?: string;
  sort_order?: number;
}

export interface RevenueContractRow {
  contract_id: string;
  name: string;
  status: RevenueContractStatus;
  organization_id: string | null;
  start_date: string;
  end_date: string | null;
  billing_frequency: BillingFrequency;
  billing_day: number | null;
  currency: string;
  expected_net_cents: number;
  expected_vat_cents: number;
  expected_gross_cents: number;
  last_posted_period_start: string | null;
  posted_count: number;
}

/**
 * The FORECAST aggregate.
 *
 * `basis` is always 'expected'. These numbers are contractual, never actual: nothing here
 * comes from owner_payments, and none of it may be added to paid revenue, EÜR or VAT. The
 * dashboard labels them ERWARTET for exactly that reason.
 */
export interface RevenueContractOverview {
  active_contract_count: number;
  mrr_net_cents: number;
  mrr_gross_cents: number;
  arr_net_cents: number;
  arr_gross_cents: number;
  basis: 'expected';
  contracts: RevenueContractRow[];
}

export async function loadRevenueContractOverview(entityId: string): Promise<RevenueContractOverview | null> {
  const { data, error } = await supabase.rpc('owner_revenue_contract_overview', { p_entity: entityId });
  if (error) throw error;
  return (data as RevenueContractOverview) ?? null;
}

export async function createRevenueContract(
  header: Record<string, unknown>,
  lines: RevenueContractLineInput[],
): Promise<{ contractId: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc('owner_create_revenue_contract', {
    p_idempotency_key: secureUuid(), p_header: header, p_lines: lines,
  });
  if (error) return { contractId: null, error: error.message };
  return { contractId: (data as { contract_id?: string })?.contract_id ?? null, error: null };
}

export async function setRevenueContractStatus(
  contractId: string, status: RevenueContractStatus, endDate?: string | null,
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('owner_set_revenue_contract_status', {
    p_contract_id: contractId, p_status: status, p_end_date: endDate ?? null,
  });
  return { error: error?.message ?? null };
}

/**
 * Post ONE billing period of a contract as a real invoice.
 *
 * This is the deliberate boundary where forecast becomes actual revenue. It never runs on a
 * schedule, never emails anyone, and the server refuses to post the same period twice.
 */
export async function postRevenueContractMonth(
  contractId: string, periodStart: string, payments: InvoicePaymentInput[] = [],
): Promise<{ result: { invoice_id: string; invoice_number: string | null; status: string } | null; error: string | null }> {
  const { data, error } = await supabase.rpc('owner_post_revenue_contract_month', {
    p_idempotency_key: secureUuid(),
    p_contract_id: contractId,
    p_period_start: periodStart,
    p_payments: payments,
  });
  if (error) return { result: null, error: error.message };
  return { result: data as { invoice_id: string; invoice_number: string | null; status: string }, error: null };
}

/* ------------------------------------------------------------------ Bulk import */

// Defined in bulkImport.ts (next to the validator) and re-exported here for convenience.
export { BULK_IMPORT_SCHEMA_VERSION, BULK_IMPORT_MAX_INVOICES, BULK_IMPORT_MAX_CONTRACTS } from '@/lib/ownerFinance/bulkImport';

export interface BulkImportResult {
  batch_id: string;
  invoice_count: number;
  payment_count: number;
  contract_count: number;
  net_cents: number;
  vat_cents: number;
  gross_cents: number;
  paid_cents: number;
  invoices: Array<{ client_import_id: string; invoice_id: string; invoice_number: string | null; status: string }>;
}

export async function runBulkImport(payload: unknown): Promise<{ result: BulkImportResult | null; error: string | null; backendMissing: boolean }> {
  const { data, error } = await supabase.rpc('owner_bulk_import_finance', {
    p_idempotency_key: secureUuid(),
    p_payload: payload,
  });
  if (error) return { result: null, error: error.message, backendMissing: isMissingBackendError(error) };
  return { result: (data as BulkImportResult) ?? null, error: null, backendMissing: false };
}

export interface CustomerResolution {
  name: string;
  organization_id: string | null;
  match_count: number;
  ambiguous: boolean;
}

/**
 * Resolve customer names to ids at PREVIEW time.
 *
 * A name matching two customers comes back `ambiguous` with no id, and the import UI stops
 * that row. Guessing between two similarly named customers would silently misfile revenue.
 */
export async function resolveImportCustomers(entityId: string, names: string[]): Promise<CustomerResolution[]> {
  const { data, error } = await supabase.rpc('owner_resolve_import_customers', {
    p_entity: entityId, p_names: names,
  });
  if (error) throw error;
  return (data as CustomerResolution[]) ?? [];
}
