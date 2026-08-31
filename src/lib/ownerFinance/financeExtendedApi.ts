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
import { secureUuid, isMissingBackendError, describeSupabaseError, type InvoiceLineInput } from '@/lib/ownerFinance/api';

/** Migration that provisions everything in this module. */
export const OWNER_FINANCE_EXTENDED_MIGRATION = '20260828120000_owner_finance_multipay_recurring_bulk.sql';
/** Migration that adds pre-invoice advance payments (Anzahlungen). */
export const OWNER_FINANCE_ADVANCE_MIGRATION = '20260829120000_owner_finance_advance_payments.sql';

/* ------------------------------------------------------------------ Payments */

/**
 * How a receipt relates to the invoice it settles.
 *
 * 'invoice_payment' — ordinary payment, dated on or after the invoice date.
 * 'advance_payment' — Anzahlung genuinely received BEFORE the final invoice was issued,
 *                     e.g. the "Abschlagszahlung 1/2" a final invoice then deducts.
 *
 * This is a different axis from the payment's accounting kind (income/expense): that says
 * what the money is, this says when it arrived relative to the invoice. Omitting the field
 * means 'invoice_payment', so every payload written before this existed still means what it
 * meant then.
 */
export type InvoicePaymentKind = 'invoice_payment' | 'advance_payment';

export interface InvoicePaymentInput {
  payment_date: string;
  amount_cents: number;
  method?: string | null;
  reference?: string | null;
  note?: string | null;
  payment_kind?: InvoicePaymentKind;
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

/** Payment history of one invoice, oldest first. Read-only. */
export async function loadInvoicePayments(invoiceId: string): Promise<Array<{
  id: string; payment_date: string; amount_cents: number;
  payment_method: string | null; reference: string | null; notes: string | null;
  payment_kind: InvoicePaymentKind;
}>> {
  const { data, error } = await supabase
    .from('owner_payments')
    .select('id, payment_date, amount_cents, payment_method, reference, notes, payment_kind')
    .eq('invoice_id', invoiceId)
    .order('payment_date', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Array<{
    id: string; payment_date: string; amount_cents: number;
    payment_method: string | null; reference: string | null; notes: string | null;
    payment_kind: InvoicePaymentKind;
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
 *
 * Failure is RETURNED, not thrown. Throwing the raw PostgREST error was how a missing RPC
 * reached the owner as "Kundenabgleich fehlgeschlagen: [object Object]": the value is a plain
 * object, so the caller's `instanceof Error` guard fell through to String(). A caller cannot
 * mis-render what it is handed already normalised, and `backendMissing` lets the UI say the
 * useful thing — the migration is not installed here — instead of relaying a PostgREST code.
 */
export async function resolveImportCustomers(
  entityId: string,
  names: string[],
): Promise<{ resolutions: CustomerResolution[]; error: string | null; backendMissing: boolean }> {
  const { data, error } = await supabase.rpc('owner_resolve_import_customers', {
    p_entity: entityId, p_names: names,
  });
  if (error) {
    return {
      resolutions: [],
      error: describeSupabaseError(error, 'Der Kundenabgleich konnte nicht ausgeführt werden.'),
      backendMissing: isMissingBackendError(error),
    };
  }
  return { resolutions: (data as CustomerResolution[]) ?? [], error: null, backendMissing: false };
}

/* --------------------------------------------------------- Expense bulk import */

/** Migration that provisions the Ausgaben-Schnellimport. */
export const OWNER_EXPENSE_IMPORT_MIGRATION = '20260904120000_owner_expense_bulk_import.sql';

export interface VendorResolutionRow {
  name: string;
  vendor_id: string | null;
  match_count: number;
  ambiguous: boolean;
}

/**
 * Resolve VENDOR names to ids at PREVIEW time.
 *
 * This is the supplier counterpart of resolveImportCustomers and must never be swapped for
 * it: Amazon and OpenAI are vendors, and looking them up in the customer table is precisely
 * the defect this path exists to fix. A name matching two vendors comes back `ambiguous`
 * with no id and the import UI stops that row; a name matching none is reported as a vendor
 * the import would CREATE, which the preview names before anything is written.
 *
 * Failure is RETURNED, not thrown, so a missing migration reaches the owner as a sentence
 * about the migration rather than a stringified PostgREST object.
 */
export async function resolveImportVendors(
  entityId: string,
  names: string[],
): Promise<{ resolutions: VendorResolutionRow[]; error: string | null; backendMissing: boolean }> {
  const { data, error } = await supabase.rpc('owner_resolve_import_vendors', {
    p_entity: entityId, p_names: names,
  });
  if (error) {
    return {
      resolutions: [],
      error: describeSupabaseError(error, 'Der Lieferantenabgleich konnte nicht ausgeführt werden.'),
      backendMissing: isMissingBackendError(error),
    };
  }
  return { resolutions: (data as VendorResolutionRow[]) ?? [], error: null, backendMissing: false };
}

export interface ExpenseImportResult {
  batch_id: string;
  expense_count: number;
  payment_count: number;
  net_cents: number;
  vat_cents: number;
  gross_cents: number;
  input_vat_cents: number;
  paid_cents: number;
  vendors_created: string[];
  expenses: Array<{
    client_import_id: string; expense_id: string; vendor_id: string | null;
    payment_status: string; gross_total_cents: number;
  }>;
}

/**
 * Run the atomic expense import.
 *
 * One RPC, one transaction, all-or-nothing — including any vendor the call creates. The
 * browser never loops createOwnerExpense/recordExpensePayment, because a loop that fails on
 * row 18 leaves 17 expenses behind and no way to tell which.
 */
export async function runExpenseBulkImport(
  payload: unknown,
): Promise<{ result: ExpenseImportResult | null; error: string | null; backendMissing: boolean }> {
  const { data, error } = await supabase.rpc('owner_bulk_import_expenses', {
    p_idempotency_key: secureUuid(),
    p_payload: payload,
  });
  if (error) {
    return {
      result: null,
      error: describeSupabaseError(error, 'Der Ausgaben-Import konnte nicht ausgeführt werden.'),
      backendMissing: isMissingBackendError(error),
    };
  }
  return { result: (data as ExpenseImportResult) ?? null, error: null, backendMissing: false };
}
