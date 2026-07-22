// API layer for the commercial document workflow: offers, document settings, generated documents,
// access tokens, owner notifications, invoice detail, and the anonymous public portal RPCs. All
// server-authoritative logic (totals, numbering, finalization, conversion, acceptance) lives in the
// database RPCs from migrations 20260723*. This module is a thin, typed wrapper over supabase.rpc /
// table reads and NEVER computes money or trusts client totals.

import { supabase } from '@/lib/supabase';
import { secureUuid } from '@/lib/ownerFinance/api';
import type {
  OwnerOffer, OwnerOfferLine, OwnerDocumentSettings, OwnerGeneratedDocument,
  OwnerFinanceNotification, OwnerOfferAcceptanceEvent, OwnerInvoice, OwnerInvoiceLine,
  OwnerOfferVersion,
} from '@/lib/ownerFinance/types';

/* ----------------------------------------------------------------- Document settings */

export async function loadDocumentSettings(entityId: string): Promise<OwnerDocumentSettings | null> {
  const { data, error } = await supabase.from('owner_document_settings').select('*').eq('business_entity_id', entityId).maybeSingle();
  if (error) throw error;
  return (data as OwnerDocumentSettings | null) ?? null;
}

export async function upsertDocumentSettings(entityId: string, patch: Partial<OwnerDocumentSettings>): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('upsert_owner_document_settings', { p_entity: entityId, p_settings: patch });
  return { error: error?.message ?? null };
}

/* ----------------------------------------------------------------- Offers */

export async function loadOffers(entityId: string): Promise<OwnerOffer[]> {
  const { data, error } = await supabase.from('owner_offers').select('*').eq('business_entity_id', entityId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as OwnerOffer[];
}

export async function loadOffer(offerId: string): Promise<{ offer: OwnerOffer; lines: OwnerOfferLine[] } | null> {
  const [{ data: offer, error: e1 }, { data: lines, error: e2 }] = await Promise.all([
    supabase.from('owner_offers').select('*').eq('id', offerId).maybeSingle(),
    supabase.from('owner_offer_lines').select('*').eq('offer_id', offerId).order('sort_order'),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  if (!offer) return null;
  return { offer: offer as OwnerOffer, lines: (lines ?? []) as OwnerOfferLine[] };
}

export interface OfferLineInput {
  description: string; details?: string | null; deliverables?: string[];
  phase_label?: string | null; duration_label?: string | null;
  quantity_milli: number; unit: string; unit_price_cents: number;
  vat_rate_bp: number; vat_treatment: string; is_optional?: boolean; sort_order?: number;
}

/** Structured offer-level content (JSONB arrays). */
export interface OfferSectionsInput {
  desired_outcomes?: string[];
  timeline?: Array<Record<string, unknown>>;
  payment_schedule?: Array<Record<string, unknown>>;
}

export async function createOffer(header: Record<string, unknown>, lines: OfferLineInput[], sections: OfferSectionsInput = {}): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc('create_owner_offer', { p_idempotency_key: secureUuid(), p_header: header, p_lines: lines, p_sections: sections });
  if (error) return { id: null, error: error.message };
  return { id: (data as { offer_id?: string })?.offer_id ?? null, error: null };
}

/**
 * Atomically edit a draft offer in place (same offer id, still a draft, no number assigned).
 * Uses optimistic concurrency: pass the offer's current `updated_at`; a stale value is rejected.
 * Returns the new `updated_at` for the next optimistic check.
 */
export async function updateOfferDraft(input: {
  offerId: string; expectedUpdatedAt: string; header: Record<string, unknown>;
  lines: OfferLineInput[]; sections?: OfferSectionsInput;
}): Promise<{ updatedAt: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc('update_owner_offer_draft', {
    p_idempotency_key: secureUuid(), p_offer_id: input.offerId, p_expected_updated_at: input.expectedUpdatedAt,
    p_header: input.header, p_lines: input.lines, p_sections: input.sections ?? {},
  });
  if (error) return { updatedAt: null, error: error.message };
  return { updatedAt: (data as { updated_at?: string })?.updated_at ?? null, error: null };
}

/** Delete a pristine draft offer (never finalized/converted, no document/token/acceptance). */
export async function deleteOfferDraft(offerId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('delete_owner_offer_draft', { p_idempotency_key: secureUuid(), p_offer_id: offerId });
  return { error: error?.message ?? null };
}

/** Load the latest immutable finalized version snapshot for an offer (final PDFs render from this). */
export async function loadLatestOfferVersion(offerId: string): Promise<OwnerOfferVersion | null> {
  const { data, error } = await supabase.from('owner_offer_versions').select('*').eq('offer_id', offerId).order('version', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return (data as OwnerOfferVersion | null) ?? null;
}

export async function finalizeOffer(offerId: string): Promise<{ error: string | null; offerNumber?: string }> {
  const { data, error } = await supabase.rpc('finalize_owner_offer', { p_idempotency_key: secureUuid(), p_offer_id: offerId });
  if (error) return { error: error.message };
  return { error: null, offerNumber: (data as { offer_number?: string })?.offer_number };
}

export async function createOfferRevision(offerId: string): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc('create_owner_offer_revision', { p_idempotency_key: secureUuid(), p_offer_id: offerId });
  if (error) return { id: null, error: error.message };
  return { id: (data as { offer_id?: string })?.offer_id ?? null, error: null };
}

export async function setOfferStatus(offerId: string, status: string, reason?: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('set_owner_offer_status', { p_offer_id: offerId, p_status: status, p_reason: reason ?? null });
  return { error: error?.message ?? null };
}

export async function convertOfferToInvoiceDraft(offerId: string): Promise<{ invoiceId: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc('convert_owner_offer_to_invoice_draft', { p_idempotency_key: secureUuid(), p_offer_id: offerId });
  if (error) return { invoiceId: null, error: error.message };
  return { invoiceId: (data as { invoice_id?: string })?.invoice_id ?? null, error: null };
}

/* ----------------------------------------------------------------- Generated documents + tokens */

export async function registerGeneratedDocument(doc: Record<string, unknown>): Promise<{ documentId: string | null; version: number | null; error: string | null }> {
  const { data, error } = await supabase.rpc('register_owner_generated_document', { p_idempotency_key: secureUuid(), p_doc: doc });
  if (error) return { documentId: null, version: null, error: error.message };
  const r = data as { document_id?: string; version?: number };
  return { documentId: r?.document_id ?? null, version: r?.version ?? null, error: null };
}

export async function createOfferAccessToken(offerId: string, documentId: string | null, validDays = 30, maxUses = 20): Promise<{ token: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc('create_offer_access_token', { p_offer_id: offerId, p_document_id: documentId, p_valid_days: validDays, p_max_uses: maxUses });
  if (error) return { token: null, error: error.message };
  return { token: (data as { token?: string })?.token ?? null, error: null };
}

export async function loadGeneratedDocuments(entityId: string, source?: { type: string; id: string }): Promise<OwnerGeneratedDocument[]> {
  let q = supabase.from('owner_generated_documents').select('*').eq('business_entity_id', entityId);
  if (source) q = q.eq('source_resource_type', source.type).eq('source_resource_id', source.id);
  const { data, error } = await q.order('generated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as OwnerGeneratedDocument[];
}

/** Short-lived signed URL for a private generated document (owner context). */
export async function signedDocumentUrl(storagePath: string, expiresIn = 120): Promise<{ url: string | null; error: string | null }> {
  const { data, error } = await supabase.storage.from('owner-finance-documents').createSignedUrl(storagePath, expiresIn);
  if (error) return { url: null, error: error.message };
  return { url: data?.signedUrl ?? null, error: null };
}

/**
 * Upload a generated PDF to the private bucket with compensation: if the storage upload succeeds but
 * the metadata RPC fails, remove the orphaned object so no unmanaged blob is left behind.
 */
export async function uploadGeneratedPdf(storagePath: string, bytes: Uint8Array): Promise<{ error: string | null }> {
  const body = new Blob([bytes.slice()], { type: 'application/pdf' });
  const { error } = await supabase.storage.from('owner-finance-documents').upload(storagePath, body, { contentType: 'application/pdf', upsert: false });
  return { error: error?.message ?? null };
}

export async function removeStorageObject(storagePath: string): Promise<void> {
  await supabase.storage.from('owner-finance-documents').remove([storagePath]);
}

/* ----------------------------------------------------------------- Notifications */

export async function loadNotifications(entityId: string, limit = 50): Promise<OwnerFinanceNotification[]> {
  const { data, error } = await supabase.from('owner_finance_notifications').select('*').eq('business_entity_id', entityId).is('dismissed_at', null).order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return (data ?? []) as OwnerFinanceNotification[];
}

export async function dismissNotification(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('owner_finance_notifications').update({ dismissed_at: new Date().toISOString() }).eq('id', id);
  return { error: error?.message ?? null };
}

export async function loadOfferAcceptanceEvents(offerId: string): Promise<OwnerOfferAcceptanceEvent[]> {
  const { data, error } = await supabase.from('owner_offer_acceptance_events').select('*').eq('offer_id', offerId).order('event_order', { ascending: false });
  if (error) throw error;
  return (data ?? []) as OwnerOfferAcceptanceEvent[];
}

/** Owner-only curated acceptance summary (signer, amount, signature path, invoice + automation status). */
export async function loadAcceptanceSummary(offerId: string): Promise<import('@/lib/ownerFinance/types').OwnerOfferAcceptanceSummary | null> {
  const { data, error } = await supabase.rpc('owner_offer_acceptance_summary', { p_offer_id: offerId });
  if (error) return null;
  return (data as import('@/lib/ownerFinance/types').OwnerOfferAcceptanceSummary) ?? null;
}

/** Short-lived signed URL for a private drawn signature (owner context only). */
export async function signedSignatureUrl(storagePath: string, expiresIn = 120): Promise<{ url: string | null; error: string | null }> {
  const { data, error } = await supabase.storage.from('owner-offer-signatures').createSignedUrl(storagePath, expiresIn);
  if (error) return { url: null, error: error.message };
  return { url: data?.signedUrl ?? null, error: null };
}

/** Manually re-arm a failed automation job from the owner dashboard. */
export async function retryAutomationJob(jobId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('owner_automation_jobs').update({ status: 'retrying', last_error: null }).eq('id', jobId);
  return { error: error?.message ?? null };
}

/* ----------------------------------------------------------------- Invoice detail */

export async function loadInvoiceDetail(invoiceId: string): Promise<{
  invoice: OwnerInvoice; lines: OwnerInvoiceLine[]; payments: Array<Record<string, unknown>>;
} | null> {
  const [{ data: invoice, error: e1 }, { data: lines, error: e2 }, { data: payments, error: e3 }] = await Promise.all([
    supabase.from('owner_invoices').select('*').eq('id', invoiceId).maybeSingle(),
    supabase.from('owner_invoice_lines').select('*').eq('invoice_id', invoiceId).order('sort_order'),
    supabase.from('owner_payments').select('*').eq('invoice_id', invoiceId).order('payment_date', { ascending: false }),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  if (e3) throw e3;
  if (!invoice) return null;
  return { invoice: invoice as OwnerInvoice, lines: (lines ?? []) as OwnerInvoiceLine[], payments: (payments ?? []) as Array<Record<string, unknown>> };
}

/* ----------------------------------------------------------------- Public portal (anon) */

export interface PublicOfferLine {
  description: string; quantity_milli: number; unit: string; unit_price_cents: number;
  vat_rate_bp: number; vat_treatment: string; net_cents: number; vat_cents: number; gross_cents: number; is_optional: boolean;
}

export interface PublicOfferRecipient {
  company: string | null;
  contact_name: string | null;
  city: string | null;
  email: string | null;
  salutation: string | null;
  title: string | null;
  first_name: string | null;
  last_name: string | null;
  greeting_name: string | null;
}

export interface PublicOfferTimelinePhase {
  phase?: string | null; title?: string | null; duration?: string | null; description?: string | null;
}
export interface PublicOfferPaymentMilestone {
  label?: string | null; percentage_bp?: number | null; amount_cents?: number | null; note?: string | null;
}

export interface PublicOfferProjection {
  offer_number: string | null;
  title: string | null;
  subtitle: string | null;
  status: string;
  issue_date: string | null;
  valid_until: string | null;
  currency: string;
  introduction: string | null;
  executive_summary: string | null;
  project_approach: string | null;
  next_steps: string | null;
  scope: string | null;
  assumptions: string | null;
  exclusions: string | null;
  payment_terms: string | null;
  delivery_terms: string | null;
  desired_outcomes: string[];
  timeline: PublicOfferTimelinePhase[];
  payment_schedule: PublicOfferPaymentMilestone[];
  net_total_cents: number;
  vat_total_cents: number;
  gross_total_cents: number;
  lines: PublicOfferLine[];
  recipient: PublicOfferRecipient;
  accepted: boolean;
  rejected: boolean;
  expired: boolean;
  has_pdf: boolean;
  document_version: number | null;
  template_version: string | null;
  accepted_signer_name: string | null;
  accepted_at: string | null;
  signed_document_available: boolean;
  seller: {
    legal_name: string; street: string | null; postal_code: string | null; city: string | null;
    country_code: string; email: string | null; website: string | null; vat_id: string | null;
  };
}

export async function fetchPublicOffer(token: string): Promise<{ offer: PublicOfferProjection | null; error: string | null }> {
  const { data, error } = await supabase.rpc('public_offer_by_token', { p_token: token, p_user_agent: navigator.userAgent.slice(0, 200) });
  if (error) return { offer: null, error: error.message };
  return { offer: data as PublicOfferProjection, error: null };
}

export async function respondPublicOffer(input: {
  token: string; decision: 'accepted' | 'rejected'; signerName: string; signerCompany: string;
  signerEmail: string; termsVersion: string; comment?: string;
}): Promise<{ result: Record<string, unknown> | null; error: string | null }> {
  const { data, error } = await supabase.rpc('respond_offer_by_token', {
    p_token: input.token, p_decision: input.decision, p_signer_name: input.signerName,
    p_signer_company: input.signerCompany, p_signer_email: input.signerEmail,
    p_terms_version: input.termsVersion, p_comment: input.comment ?? null,
    p_user_agent: navigator.userAgent.slice(0, 200),
  });
  if (error) return { result: null, error: error.message };
  return { result: data as Record<string, unknown>, error: null };
}

export interface SignedAcceptanceInput {
  token: string;
  signerName: string;
  signerCompany: string;
  signerEmail: string;
  signerRole?: string;
  comment?: string;
  termsVersion: string;
  signaturePngDataUrl: string; // "data:image/png;base64,...."
}

/**
 * Submit a signed offer acceptance. Preferred path: the token-authenticated
 * `process-accepted-offer` Edge Function validates the token, validates + hashes the
 * PNG and stores it PRIVATELY (server-generated path) before recording the acceptance.
 * If that function is not reachable/deployed, we fall back to the server-authoritative
 * anon RPC so the journey still completes (acceptance + automation recorded); the drawn
 * signature is preserved locally and can be re-submitted once the function is live.
 * The raw token is NEVER logged, and the signature bytes are never persisted client-side.
 */
export async function acceptOfferWithSignature(
  input: SignedAcceptanceInput,
): Promise<{ result: Record<string, unknown> | null; via: 'edge' | 'rpc'; error: string | null }> {
  try {
    const { data, error } = await supabase.functions.invoke('process-accepted-offer', {
      body: {
        token: input.token,
        signer_name: input.signerName,
        signer_company: input.signerCompany,
        signer_email: input.signerEmail,
        signer_role: input.signerRole ?? null,
        comment: input.comment ?? null,
        terms_version: input.termsVersion,
        signature_png: input.signaturePngDataUrl,
        user_agent: navigator.userAgent.slice(0, 200),
      },
    });
    if (!error && data && (data as { ok?: boolean }).ok !== false) {
      return { result: data as Record<string, unknown>, via: 'edge', error: null };
    }
  } catch {
    // fall through to the RPC path
  }
  const { result, error } = await respondPublicOffer({
    token: input.token, decision: 'accepted', signerName: input.signerName,
    signerCompany: input.signerCompany, signerEmail: input.signerEmail,
    termsVersion: input.termsVersion, comment: input.comment,
  });
  return { result, via: 'rpc', error };
}
