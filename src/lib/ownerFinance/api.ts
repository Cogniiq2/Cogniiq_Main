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

function secureUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export { secureUuid };

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

// Append-only audit log. Best-effort; never blocks the primary action.
export async function logAudit(entry: {
  businessEntityId: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}): Promise<void> {
  const actor = await currentUserId();
  await supabase.from('owner_audit_log').insert({
    business_entity_id: entry.businessEntityId,
    actor_user_id: actor,
    action: entry.action,
    resource_type: entry.resourceType,
    resource_id: entry.resourceId ?? null,
    before_summary: entry.before ?? null,
    after_summary: entry.after ?? null,
  });
}

export async function loadEntities(): Promise<OwnerBusinessEntity[]> {
  const { data, error } = await supabase.from('owner_business_entities').select('*').order('is_active', { ascending: false });
  if (error) throw error;
  return (data ?? []) as OwnerBusinessEntity[];
}

// The single active, calculation-enabled entity for V1 (the Cogniiq Einzelunternehmen).
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
    .from('owner_tax_settings')
    .select('*')
    .eq('business_entity_id', entityId)
    .eq('tax_year', year)
    .maybeSingle();
  if (error) throw error;
  return (data as OwnerTaxSettings | null) ?? null;
}

export async function upsertTaxSettings(
  entityId: string,
  year: number,
  patch: Partial<OwnerTaxSettings>,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('owner_tax_settings')
    .upsert({ business_entity_id: entityId, tax_year: year, ...patch }, { onConflict: 'business_entity_id,tax_year' });
  if (!error) await logAudit({ businessEntityId: entityId, action: 'tax_settings.saved', resourceType: 'owner_tax_settings' });
  return { error: error?.message ?? null };
}

export async function loadPeriodSummary(entityId: string, from: string, to: string): Promise<PeriodSummary | null> {
  const { data, error } = await supabase.rpc('owner_finance_period_summary', { p_entity: entityId, p_from: from, p_to: to });
  if (error) throw error;
  return (data as PeriodSummary) ?? null;
}

export async function loadInvoices(entityId: string): Promise<OwnerInvoice[]> {
  const { data, error } = await supabase
    .from('owner_invoices')
    .select('*')
    .eq('business_entity_id', entityId)
    .order('issue_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as OwnerInvoice[];
}

export async function loadInvoiceLines(invoiceId: string): Promise<OwnerInvoiceLine[]> {
  const { data, error } = await supabase
    .from('owner_invoice_lines')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as OwnerInvoiceLine[];
}

export async function createDraftInvoice(entityId: string, patch: Partial<OwnerInvoice>): Promise<{ id: string | null; error: string | null }> {
  const createdBy = await currentUserId();
  const { data, error } = await supabase
    .from('owner_invoices')
    .insert({ business_entity_id: entityId, status: 'draft', created_by: createdBy, ...patch })
    .select('id')
    .maybeSingle();
  const id = (data as { id?: string } | null)?.id ?? null;
  if (!error && id) await logAudit({ businessEntityId: entityId, action: 'invoice.created', resourceType: 'owner_invoices', resourceId: id });
  return { id, error: error?.message ?? null };
}

export async function addInvoiceLine(line: Partial<OwnerInvoiceLine> & { invoice_id: string }): Promise<{ error: string | null }> {
  const { error } = await supabase.from('owner_invoice_lines').insert(line);
  return { error: error?.message ?? null };
}

export async function setInvoiceStatus(entityId: string, invoiceId: string, status: OwnerInvoice['status']): Promise<{ error: string | null }> {
  const { error } = await supabase.from('owner_invoices').update({ status }).eq('id', invoiceId);
  if (!error) await logAudit({ businessEntityId: entityId, action: `invoice.${status}`, resourceType: 'owner_invoices', resourceId: invoiceId, after: { status } });
  return { error: error?.message ?? null };
}

export async function recordInvoicePayment(entityId: string, invoiceId: string, amountCents: number, paymentDate: string): Promise<{ error: string | null }> {
  const createdBy = await currentUserId();
  const { error } = await supabase.from('owner_payments').insert({
    business_entity_id: entityId, kind: 'income', direction: 'inflow',
    payment_date: paymentDate, amount_cents: amountCents, invoice_id: invoiceId, created_by: createdBy,
  });
  if (!error) await logAudit({ businessEntityId: entityId, action: 'invoice.payment_recorded', resourceType: 'owner_invoices', resourceId: invoiceId, after: { amount_cents: amountCents } });
  return { error: error?.message ?? null };
}

export async function loadExpenses(entityId: string): Promise<OwnerExpense[]> {
  const { data, error } = await supabase
    .from('owner_expenses')
    .select('*')
    .eq('business_entity_id', entityId)
    .order('invoice_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as OwnerExpense[];
}

export async function createExpenseWithLine(
  entityId: string,
  header: Partial<OwnerExpense>,
  line: { description: string; net_cents: number; vat_rate_bp: number; vat_treatment: string; category_id?: string | null; input_vat_eligibility_bp?: number; deductibility_bp?: number; asset_candidate?: boolean },
): Promise<{ id: string | null; error: string | null }> {
  const createdBy = await currentUserId();
  const { data, error } = await supabase
    .from('owner_expenses')
    .insert({ business_entity_id: entityId, created_by: createdBy, ...header })
    .select('id')
    .maybeSingle();
  const id = (data as { id?: string } | null)?.id ?? null;
  if (error || !id) return { id: null, error: error?.message ?? 'insert failed' };
  const { error: lineError } = await supabase.from('owner_expense_lines').insert({ expense_id: id, ...line });
  if (!lineError) await logAudit({ businessEntityId: entityId, action: 'expense.created', resourceType: 'owner_expenses', resourceId: id });
  return { id, error: lineError?.message ?? null };
}

export async function markExpenseReviewed(entityId: string, expenseId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('owner_expenses').update({ review_status: 'reviewed' }).eq('id', expenseId);
  if (!error) await logAudit({ businessEntityId: entityId, action: 'expense.reviewed', resourceType: 'owner_expenses', resourceId: expenseId });
  return { error: error?.message ?? null };
}

export async function loadSubscriptions(entityId: string): Promise<OwnerSubscription[]> {
  const { data, error } = await supabase.from('owner_subscriptions').select('*').eq('business_entity_id', entityId).order('name');
  if (error) throw error;
  return (data ?? []) as OwnerSubscription[];
}

export async function createSubscription(entityId: string, patch: Partial<OwnerSubscription>): Promise<{ error: string | null }> {
  const { error } = await supabase.from('owner_subscriptions').insert({ business_entity_id: entityId, ...patch });
  if (!error) await logAudit({ businessEntityId: entityId, action: 'subscription.created', resourceType: 'owner_subscriptions' });
  return { error: error?.message ?? null };
}

export async function setSubscriptionStatus(entityId: string, id: string, status: OwnerSubscription['status']): Promise<{ error: string | null }> {
  const { error } = await supabase.from('owner_subscriptions').update({ status }).eq('id', id);
  if (!error) await logAudit({ businessEntityId: entityId, action: `subscription.${status}`, resourceType: 'owner_subscriptions', resourceId: id });
  return { error: error?.message ?? null };
}

export async function loadAssets(entityId: string): Promise<OwnerAsset[]> {
  const { data, error } = await supabase.from('owner_assets').select('*').eq('business_entity_id', entityId).order('purchase_date', { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as OwnerAsset[];
}

export async function createAsset(entityId: string, patch: Partial<OwnerAsset>): Promise<{ error: string | null }> {
  const { error } = await supabase.from('owner_assets').insert({ business_entity_id: entityId, ...patch });
  if (!error) await logAudit({ businessEntityId: entityId, action: 'asset.created', resourceType: 'owner_assets' });
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
    .from('owner_tax_estimates')
    .select('*')
    .eq('business_entity_id', entityId)
    .eq('tax_year', year)
    .order('calculated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as OwnerTaxEstimate[];
}

export async function saveTaxEstimate(entityId: string, snapshot: Partial<OwnerTaxEstimate> & { tax_year: number; tax_type: string; rules_version: string }): Promise<{ error: string | null }> {
  const createdBy = await currentUserId();
  const { error } = await supabase.from('owner_tax_estimates').insert({ business_entity_id: entityId, created_by: createdBy, ...snapshot });
  if (!error) await logAudit({ businessEntityId: entityId, action: 'tax_estimate.generated', resourceType: 'owner_tax_estimates', after: { tax_type: snapshot.tax_type } });
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
  run: { export_type: string; period_start?: string | null; period_end?: string | null; rules_version?: string | null; record_counts?: Record<string, number>; warnings?: string[] },
): Promise<{ error: string | null }> {
  const createdBy = await currentUserId();
  const { error } = await supabase.from('owner_exports').insert({
    business_entity_id: entityId, status: 'ready', generated_by: createdBy,
    export_type: run.export_type, period_start: run.period_start ?? null, period_end: run.period_end ?? null,
    rules_version: run.rules_version ?? null, record_counts: run.record_counts ?? {}, warnings: run.warnings ?? [],
  });
  if (!error) await logAudit({ businessEntityId: entityId, action: 'export.generated', resourceType: 'owner_exports', after: { export_type: run.export_type } });
  return { error: error?.message ?? null };
}

export async function loadAudit(entityId: string, limit = 100): Promise<OwnerAuditEntry[]> {
  const { data, error } = await supabase
    .from('owner_audit_log')
    .select('*')
    .eq('business_entity_id', entityId)
    .order('created_at', { ascending: false })
    .limit(limit);
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
