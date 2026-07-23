import { supabase } from '@/lib/supabase';
import type {
  OwnerAsset,
  OwnerAuditEntry,
  OwnerBusinessEntity,
  OwnerExpense,
  OwnerExpenseCategory,
  OwnerExportRun,
  OwnerFinanceDocument,
  OwnerInvoice,
  OwnerInvoiceLine,
  OwnerSubscription,
  OwnerTaxEstimate,
  OwnerTaxSettings,
  OwnerVendor,
  PeriodSummary,
} from './types';

// The additive migration that provisions the entire owner-finance backend (tables + RPCs + RLS).
// Surfaced to the owner when the schema is absent in the target environment.
export const OWNER_FINANCE_MIGRATION = '20260722120000_owner_finance_cockpit.sql';

export type FinanceBackendStatus = 'ready' | 'missing' | 'error';

interface PostgrestLikeError {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
}

// Distinguishes "the finance backend has not been installed in this environment" from an ordinary
// transient/auth error. Missing tables surface as Postgres 42P01 or PostgREST schema-cache misses
// (PGRST205); missing RPCs as PGRST202. We never treat an RLS denial as "missing".
export function isMissingBackendError(err: unknown): boolean {
  const e = err as PostgrestLikeError | null;
  if (!e) return false;
  const code = (e.code ?? '').toUpperCase();
  if (code === '42P01' || code === 'PGRST205' || code === 'PGRST202') return true;
  const text = `${e.message ?? ''} ${e.details ?? ''} ${e.hint ?? ''}`.toLowerCase();
  if (!text.trim()) return false;
  return (
    (text.includes('does not exist') && (text.includes('relation') || text.includes('table') || text.includes('function'))) ||
    text.includes('could not find the table') ||
    text.includes('could not find the function') ||
    text.includes('schema cache')
  );
}

export function classifyBackendError(err: unknown): FinanceBackendStatus {
  return isMissingBackendError(err) ? 'missing' : 'error';
}

// Lightweight probe used at cockpit boot: resolves whether the finance schema is installed without
// leaking SQL detail to the UI. A missing backend resolves to a clean 'missing' status; an existing
// backend (even with zero rows or an RLS denial that still hits a real table) resolves to 'ready'.
export async function probeFinanceBackend(): Promise<{ status: FinanceBackendStatus; detail: string | null }> {
  const { error } = await supabase.from('owner_business_entities').select('id').limit(1);
  if (!error) return { status: 'ready', detail: null };
  if (isMissingBackendError(error)) return { status: 'missing', detail: error.message ?? 'relation not found' };
  return { status: 'error', detail: error.message ?? 'unknown error' };
}

export function secureUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

// NOTE: material accounting audit records are generated DATABASE-SIDE by triggers (auth.uid() actor,
// append-only). The frontend never writes the accounting audit trail.

export async function loadEntities(): Promise<OwnerBusinessEntity[]> {
  const { data, error } = await supabase.from('owner_business_entities').select('*').order('is_active', { ascending: false });
  if (error) throw error;
  return (data ?? []) as OwnerBusinessEntity[];
}

export async function loadActiveEntity(): Promise<OwnerBusinessEntity | null> {
  const { data, error } = await supabase
    .from('owner_business_entities')
    .select('*')
    .eq('is_active', true)
    .eq('calculations_enabled', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as OwnerBusinessEntity | null) ?? null;
}

export async function loadTaxSettings(entityId: string, year: number): Promise<OwnerTaxSettings | null> {
  const { data, error } = await supabase
    .from('owner_tax_settings').select('*').eq('business_entity_id', entityId).eq('tax_year', year).maybeSingle();
  if (error) throw error;
  return (data as OwnerTaxSettings | null) ?? null;
}

export async function upsertTaxSettings(entityId: string, year: number, patch: Partial<OwnerTaxSettings>): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('owner_tax_settings')
    .upsert({ business_entity_id: entityId, tax_year: year, ...patch }, { onConflict: 'business_entity_id,tax_year' });
  return { error: error?.message ?? null };
}

export async function loadPeriodSummary(entityId: string, from: string, to: string): Promise<PeriodSummary | null> {
  const { data, error } = await supabase.rpc('owner_finance_period_summary', { p_entity: entityId, p_from: from, p_to: to });
  if (error) throw error;
  return (data as PeriodSummary) ?? null;
}

// Payment-based EÜR + VAT (Ist/Soll) inputs for the tax engine.
export interface TaxPeriodInputs {
  vat_timing: string;
  paid_revenue_net_cents: number;
  paid_expense_deductible_net_cents: number;
  vat_output_cents: number;
  vat_reverse_charge_output_cents: number;
  vat_input_cents: number;
  has_unlinked_income: boolean;
  has_unresolved_treatment: boolean;
  missing_service_date: boolean;
  recurring_flag_count: number;
  filing_ready: boolean;
  warnings: string[];
}

export async function loadTaxPeriodInputs(entityId: string, from: string, to: string, vatTiming: string): Promise<TaxPeriodInputs | null> {
  const { data, error } = await supabase.rpc('owner_tax_period_inputs', { p_entity: entityId, p_from: from, p_to: to, p_vat_timing: vatTiming });
  if (error) throw error;
  return (data as TaxPeriodInputs) ?? null;
}

export async function loadInvoices(entityId: string): Promise<OwnerInvoice[]> {
  const { data, error } = await supabase
    .from('owner_invoices').select('*').eq('business_entity_id', entityId)
    .order('issue_date', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as OwnerInvoice[];
}

export async function loadInvoiceLines(invoiceId: string): Promise<OwnerInvoiceLine[]> {
  const { data, error } = await supabase.from('owner_invoice_lines').select('*').eq('invoice_id', invoiceId).order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as OwnerInvoiceLine[];
}

export interface InvoiceLineInput { description: string; quantity_milli: number; unit_price_cents: number; vat_rate_bp: number; vat_treatment: string; sort_order?: number }

// Atomic + UUID-idempotent draft creation (header + lines in one transaction, server-side).
export async function createOwnerInvoice(header: Record<string, unknown>, lines: InvoiceLineInput[]): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc('create_owner_invoice', { p_idempotency_key: secureUuid(), p_header: header, p_lines: lines });
  if (error) return { id: null, error: error.message };
  return { id: (data as { invoice_id?: string })?.invoice_id ?? null, error: null };
}

export async function issueOwnerInvoice(invoiceId: string): Promise<{ result: Record<string, unknown> | null; error: string | null }> {
  const { data, error } = await supabase.rpc('issue_owner_invoice', { p_idempotency_key: secureUuid(), p_invoice_id: invoiceId });
  if (error) return { result: null, error: error.message };
  return { result: data as Record<string, unknown>, error: null };
}

// void / cancel — an allowed, audited status update (never a hard delete).
export async function setInvoiceStatus(invoiceId: string, status: OwnerInvoice['status']): Promise<{ error: string | null }> {
  const { error } = await supabase.from('owner_invoices').update({ status }).eq('id', invoiceId);
  return { error: error?.message ?? null };
}

export interface PaymentMeta { method?: string | null; reference?: string | null; note?: string | null }

// Best-effort enrichment of the payment row that the atomic RPC created. The amount+date are always
// recorded server-authoritatively by the RPC; method/reference/note are optional metadata columns
// updated afterwards, so a failure here never affects the recorded payment.
async function enrichPayment(paymentId: string | null | undefined, meta?: PaymentMeta): Promise<void> {
  if (!paymentId || !meta) return;
  const patch: Record<string, string> = {};
  if (meta.method) patch.payment_method = meta.method;
  if (meta.reference) patch.reference = meta.reference;
  if (meta.note) patch.notes = meta.note;
  if (Object.keys(patch).length === 0) return;
  await supabase.from('owner_payments').update(patch).eq('id', paymentId);
}

export async function recordInvoicePayment(invoiceId: string, amountCents: number, paymentDate: string, meta?: PaymentMeta): Promise<{ error: string | null }> {
  const { data, error } = await supabase.rpc('record_owner_invoice_payment', { p_idempotency_key: secureUuid(), p_invoice_id: invoiceId, p_amount_cents: amountCents, p_payment_date: paymentDate });
  if (error) return { error: error.message };
  await enrichPayment((data as { payment_id?: string })?.payment_id, meta);
  return { error: null };
}

export async function deleteDraftInvoice(invoiceId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('delete_owner_draft_invoice', { p_invoice_id: invoiceId });
  return { error: error?.message ?? null };
}

export async function loadExpenses(entityId: string): Promise<OwnerExpense[]> {
  const { data, error } = await supabase
    .from('owner_expenses').select('*').eq('business_entity_id', entityId)
    .order('invoice_date', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as OwnerExpense[];
}

export interface ExpenseLineInput { description: string; net_cents: number; vat_rate_bp: number; vat_treatment: string; category_id?: string | null; input_vat_eligibility_bp?: number; deductibility_bp?: number; asset_candidate?: boolean }

export async function createOwnerExpense(header: Record<string, unknown>, lines: ExpenseLineInput[]): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc('create_owner_expense', { p_idempotency_key: secureUuid(), p_header: header, p_lines: lines });
  if (error) return { id: null, error: error.message };
  return { id: (data as { expense_id?: string })?.expense_id ?? null, error: null };
}

export async function markExpenseReviewed(expenseId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('owner_expenses').update({ review_status: 'reviewed' }).eq('id', expenseId);
  return { error: error?.message ?? null };
}

export async function recordExpensePayment(expenseId: string, amountCents: number, paymentDate: string, meta?: PaymentMeta): Promise<{ error: string | null }> {
  const { data, error } = await supabase.rpc('record_owner_expense_payment', { p_idempotency_key: secureUuid(), p_expense_id: expenseId, p_amount_cents: amountCents, p_payment_date: paymentDate });
  if (error) return { error: error.message };
  await enrichPayment((data as { payment_id?: string })?.payment_id, meta);
  return { error: null };
}

// CRM customers for the invoice/expense composers (organization + account, owner-readable).
export interface CrmCustomerOption {
  organizationId: string;
  clientAccountId: string | null;
  name: string;
  email: string | null;
  legalName: string | null;
  address: string | null;
}

export async function loadSubscriptions(entityId: string): Promise<OwnerSubscription[]> {
  const { data, error } = await supabase.from('owner_subscriptions').select('*').eq('business_entity_id', entityId).order('name');
  if (error) throw error;
  return (data ?? []) as OwnerSubscription[];
}

export async function createSubscription(entityId: string, patch: Partial<OwnerSubscription>): Promise<{ error: string | null }> {
  const { error } = await supabase.from('owner_subscriptions').insert({ business_entity_id: entityId, ...patch });
  return { error: error?.message ?? null };
}

export async function setSubscriptionStatus(id: string, status: OwnerSubscription['status']): Promise<{ error: string | null }> {
  const { error } = await supabase.from('owner_subscriptions').update({ status }).eq('id', id);
  return { error: error?.message ?? null };
}

export async function loadAssets(entityId: string): Promise<OwnerAsset[]> {
  const { data, error } = await supabase.from('owner_assets').select('*').eq('business_entity_id', entityId).order('purchase_date', { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as OwnerAsset[];
}

export async function createAsset(entityId: string, patch: Partial<OwnerAsset>): Promise<{ error: string | null }> {
  const { error } = await supabase.from('owner_assets').insert({ business_entity_id: entityId, ...patch });
  return { error: error?.message ?? null };
}

export async function loadVendors(): Promise<OwnerVendor[]> {
  const { data, error } = await supabase.from('owner_vendors').select('*').order('name');
  if (error) throw error;
  return (data ?? []) as OwnerVendor[];
}

export async function loadCategories(): Promise<OwnerExpenseCategory[]> {
  const { data, error } = await supabase.from('owner_expense_categories').select('*').eq('is_active', true).order('sort_order');
  if (error) throw error;
  return (data ?? []) as OwnerExpenseCategory[];
}

export async function loadTaxEstimates(entityId: string, year: number): Promise<OwnerTaxEstimate[]> {
  const { data, error } = await supabase
    .from('owner_tax_estimates').select('*').eq('business_entity_id', entityId).eq('tax_year', year)
    .order('calculated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as OwnerTaxEstimate[];
}

export async function saveTaxEstimate(entityId: string, snapshot: Partial<OwnerTaxEstimate> & { tax_year: number; tax_type: string; rules_version: string }): Promise<{ error: string | null }> {
  const createdBy = await currentUserId();
  const { error } = await supabase.from('owner_tax_estimates').insert({ business_entity_id: entityId, created_by: createdBy, ...snapshot });
  return { error: error?.message ?? null };
}

export async function loadDocuments(entityId: string): Promise<OwnerFinanceDocument[]> {
  const { data, error } = await supabase.from('owner_finance_documents').select('*').eq('business_entity_id', entityId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as OwnerFinanceDocument[];
}

export async function loadExports(entityId: string): Promise<OwnerExportRun[]> {
  const { data, error } = await supabase.from('owner_exports').select('*').eq('business_entity_id', entityId).order('generated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as OwnerExportRun[];
}

export async function recordExportRun(
  entityId: string,
  run: {
    export_type: string; period_start?: string | null; period_end?: string | null;
    rules_version?: string | null; record_counts?: Record<string, number>; warnings?: string[];
    source_hash?: string | null; file_metadata?: Record<string, unknown>;
  },
): Promise<{ error: string | null }> {
  const createdBy = await currentUserId();
  const { error } = await supabase.from('owner_exports').insert({
    business_entity_id: entityId, status: 'ready', generated_by: createdBy,
    export_type: run.export_type, period_start: run.period_start ?? null, period_end: run.period_end ?? null,
    rules_version: run.rules_version ?? null, record_counts: run.record_counts ?? {}, warnings: run.warnings ?? [],
    source_hash: run.source_hash ?? null, file_metadata: run.file_metadata ?? {},
  });
  return { error: error?.message ?? null };
}

export async function loadAudit(entityId: string, limit = 100): Promise<OwnerAuditEntry[]> {
  const { data, error } = await supabase
    .from('owner_audit_log').select('*').eq('business_entity_id', entityId).order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return (data ?? []) as OwnerAuditEntry[];
}

export async function createCrmOnlyClient(payload: {
  displayName: string; legalName?: string | null; primaryEmail?: string | null; phone?: string | null;
  industry?: string | null; lifecycleStatus: string; primaryContactName?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc('create_crm_only_client', {
    p_idempotency_key: secureUuid(),
    p_display_name: payload.displayName,
    p_legal_name: payload.legalName ?? null,
    p_primary_email: payload.primaryEmail ?? null,
    p_phone: payload.phone ?? null,
    p_industry: payload.industry ?? null,
    p_lifecycle_status: payload.lifecycleStatus,
    p_primary_contact_name: payload.primaryContactName ?? null,
  });
  return { ok: !error, error: error?.message };
}
