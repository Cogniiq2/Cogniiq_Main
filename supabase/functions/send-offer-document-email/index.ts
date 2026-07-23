// Supabase Edge Function: PRODUCTION automation-job worker. SOURCE ONLY — NOT DEPLOYED.
//
// Invoked every minute by a secure Supabase Cron/pg_net call (see ./README.md). It:
//   1. authenticates the caller with a constant-time WORKER_SECRET check (x-worker-secret);
//   2. ATOMICALLY claims a bounded batch of due jobs via owner_claim_automation_jobs
//      (FOR UPDATE SKIP LOCKED) so concurrent runs never double-process;
//   3. performs the REAL operation for each job type:
//        invoice_create  -> idempotent server-authoritative invoice draft
//        invoice_issue   -> server-authoritative issue (final number + status, preflight)
//        invoice_send /   -> issue if needed, render the invoice PDF from TRUSTED server
//        invoice_email       context, store it privately, and email it as a Base64 attachment
//        offer_email     -> mint a FRESH secure token (hash-only) and email the EXACT
//                           /d/<token> portal link (never the app root, never a fabricated link)
//   4. records the outcome via owner_complete_automation_job (sent | retrying+backoff | failed).
//
// SECURITY / PRIVACY:
// - WORKER_SECRET, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY live ONLY in Deno.env; none is
//   ever returned or logged. Raw tokens, signatures and document bytes are never logged and
//   never stored in the job table. Private storage paths are never exposed to callers.
// - Resend Idempotency-Key = sha256(jobId:documentVersion) so retries never send duplicates.

// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { renderInvoicePdf, invoicePdfFilename, type InvoicePdfContext } from './invoicePdf.ts';
import { renderAcceptanceCertificatePdf, certificatePdfFilename, type CertificateContext } from './certificatePdf.ts';
import { buildInvoiceEmail, buildOfferEmail, buildConfirmationEmail, type InvoiceEmailContext } from './email.ts';

// The trusted invoice context returned by owner_worker_invoice_context — satisfies both the
// PDF renderer and the email builder, plus the entity id + resolved recipient email.
type InvoiceWorkerCtx = InvoicePdfContext & InvoiceEmailContext & {
  business_entity_id: string; recipient: { email: string | null };
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const WORKER_SECRET = Deno.env.get('WORKER_SECRET') ?? '';
const EMAIL_PROVIDER = Deno.env.get('EMAIL_PROVIDER') ?? 'resend';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') ?? '';
const PUBLIC_APP_URL = (Deno.env.get('PUBLIC_APP_URL') ?? '').replace(/\/$/, '');
const FINANCE_BUCKET = 'owner-finance-documents';
const SIGNATURE_BUCKET = 'owner-offer-signatures';
const BATCH = 10;

type Sb = ReturnType<typeof createClient>;
interface ClaimedJob {
  id: string; job_type: string; business_entity_id: string;
  offer_id: string | null; invoice_id: string | null; acceptance_event_id: string | null;
  recipient_email: string | null; subject: string | null;
  attempt_count: number; max_attempts: number; payload: unknown;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

// Constant-time string comparison (no early exit on mismatch, length-safe).
function safeEqual(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  const len = Math.max(ea.length, eb.length);
  let diff = ea.length ^ eb.length;
  for (let i = 0; i < len; i++) diff |= (ea[i] ?? 0) ^ (eb[i] ?? 0);
  return diff === 0;
}

async function sha256Hex(s: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function toBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

interface Attachment { filename: string; contentBase64: string; }
async function sendEmail(
  msg: { to: string; subject: string; html: string; text: string },
  opts: { attachment?: Attachment; idempotencyKey: string },
): Promise<{ id: string | null; error: string | null }> {
  if (!msg.to) return { id: null, error: 'no recipient' };
  if (EMAIL_PROVIDER !== 'resend') return { id: null, error: `unsupported provider ${EMAIL_PROVIDER}` };
  if (!RESEND_API_KEY || !EMAIL_FROM) return { id: null, error: 'email provider not configured' };
  const payload: Record<string, unknown> = {
    from: EMAIL_FROM, to: msg.to, subject: msg.subject, html: msg.html, text: msg.text,
  };
  if (opts.attachment) payload.attachments = [{ filename: opts.attachment.filename, content: opts.attachment.contentBase64 }];
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${RESEND_API_KEY}`, 'content-type': 'application/json',
      // Deterministic key -> retries never create a duplicate send.
      'Idempotency-Key': opts.idempotencyKey,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { id: null, error: `provider ${res.status}` };
  const data = await res.json().catch(() => ({}));
  return { id: data?.id ?? null, error: null };
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'method not allowed' }, 405);

  // ---- Worker authentication: constant-time secret check. ----
  if (!WORKER_SECRET) return json({ ok: false, error: 'worker not configured' }, 500);
  const provided = req.headers.get('x-worker-secret') ?? '';
  if (!provided || !safeEqual(provided, WORKER_SECRET)) return json({ ok: false, error: 'unauthorized' }, 401);

  const svc = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  // ---- Atomic claim (FOR UPDATE SKIP LOCKED inside the RPC). ----
  const { data: claimed, error: claimErr } = await svc.rpc('owner_claim_automation_jobs', { p_limit: BATCH, p_types: null });
  if (claimErr) return json({ ok: false, error: 'could not claim jobs' }, 500);

  const results: Array<{ id: string; status: string }> = [];
  for (const job of (claimed ?? []) as ClaimedJob[]) {
    const jobId: string = job.id;
    try {
      const outcome = await processJob(svc, job);
      // Generation-only jobs (certificate/PDF) terminate as 'completed', never 'sent'.
      const terminal = outcome.terminal ?? 'sent';
      await svc.rpc('owner_complete_automation_job', {
        p_job_id: jobId, p_status: terminal, p_provider_message_id: outcome.providerId ?? null,
        p_error: null, p_retry_delay_seconds: 60, p_output_document_id: outcome.outputDocumentId ?? null,
      });
      results.push({ id: jobId, status: terminal });
    } catch (e) {
      // Map to a SAFE summary; never leak provider errors, tokens or bytes.
      const summary = String((e as Error).message ?? 'error').slice(0, 200);
      const { data: done } = await svc.rpc('owner_complete_automation_job', {
        p_job_id: jobId, p_status: 'retrying', p_provider_message_id: null, p_error: summary, p_retry_delay_seconds: 60,
      });
      results.push({ id: jobId, status: done?.status ?? 'retrying' });
    }
  }
  return json({ ok: true, processed: results.length, results });
});

interface JobOutcome { providerId: string | null; terminal?: 'sent' | 'completed'; outputDocumentId?: string | null; }

// Performs the real operation. Throws on failure (worker records retrying/failed).
async function processJob(svc: Sb, job: ClaimedJob): Promise<JobOutcome> {
  const type: string = job.job_type;

  // ---- Signed acceptance certificate: server-authoritative generation (no send). ----
  if (type === 'signed_offer_certificate_generate') {
    if (!job.offer_id) throw new Error('missing offer');
    const cert = await ensureCertificate(svc, job.offer_id, job.acceptance_event_id);
    return { providerId: null, terminal: 'completed', outputDocumentId: cert.documentId };
  }

  // ---- Premium signed-acceptance confirmation email (certificate attached). ----
  if (type === 'signed_offer_confirmation_email') {
    if (!job.offer_id) throw new Error('missing offer');
    const cert = await ensureCertificate(svc, job.offer_id, job.acceptance_event_id);
    const to = cert.ctx.recipient.email;
    if (!to) throw new Error('no recipient email');
    const mail = buildConfirmationEmail({
      offer: { offer_number: cert.ctx.offer.offer_number, currency: cert.ctx.offer.currency, gross_total_cents: cert.ctx.offer.gross_total_cents },
      signature: { accepted_at: cert.ctx.signature.accepted_at },
      signer: { name: cert.ctx.signer.name },
      recipient: cert.ctx.recipient,
      seller: cert.ctx.seller,
      templates: cert.ctx.templates,
    });
    const sent = await sendEmail(
      { to, subject: mail.subject, html: mail.html, text: mail.text },
      { attachment: { filename: cert.filename, contentBase64: toBase64(cert.pdf) }, idempotencyKey: `${job.id}:confirmation` },
    );
    if (sent.error) throw new Error(`email ${sent.error}`);
    return { providerId: sent.id, terminal: 'sent' };
  }

  // ---- Explicit, separately-retryable invoice PDF generation (no send). ----
  if (type === 'invoice_pdf_generate') {
    const invoiceId = await resolveInvoiceId(svc, job);
    const { error: issueErr } = await svc.rpc('owner_issue_invoice_internal', { p_invoice_id: invoiceId });
    if (issueErr) throw new Error('invoice issue failed');
    const reg = await generateAndStoreInvoicePdf(svc, invoiceId);
    return { providerId: null, terminal: 'completed', outputDocumentId: reg.documentId };
  }

  if (type === 'invoice_create') {
    if (!job.offer_id) throw new Error('missing offer');
    const { error } = await svc.rpc('owner_ensure_offer_invoice_internal', { p_offer_id: job.offer_id });
    if (error) throw new Error('invoice create failed');
    return { providerId: null };
  }

  if (type === 'invoice_issue') {
    const invoiceId = await resolveInvoiceId(svc, job);
    const { error } = await svc.rpc('owner_issue_invoice_internal', { p_invoice_id: invoiceId });
    if (error) throw new Error('invoice issue failed'); // NOT marked sent unless the issue succeeded
    return { providerId: null };
  }

  if (type === 'invoice_send' || type === 'invoice_email') {
    const invoiceId = await resolveInvoiceId(svc, job);
    // Ensure the invoice is finalized before emailing it.
    const { error: issueErr } = await svc.rpc('owner_issue_invoice_internal', { p_invoice_id: invoiceId });
    if (issueErr) throw new Error('invoice issue failed');

    const gen = await generateAndStoreInvoicePdf(svc, invoiceId);
    const to = gen.ctx.recipient?.email;
    if (!to) throw new Error('no recipient email');
    const mail = buildInvoiceEmail(gen.ctx);
    const sent = await sendEmail(
      { to, subject: mail.subject, html: mail.html, text: mail.text },
      { attachment: { filename: gen.filename, contentBase64: toBase64(gen.pdf) }, idempotencyKey: `${job.id}:${gen.version}` },
    );
    if (sent.error) throw new Error(`email ${sent.error}`);
    return { providerId: sent.id, terminal: 'sent', outputDocumentId: gen.documentId };
  }

  if (type === 'offer_email') {
    if (!job.offer_id) throw new Error('missing offer');
    if (!PUBLIC_APP_URL) throw new Error('app url not configured');
    // Editable subject/message authored in the owner dialog (safe payload; escaped in the builder).
    const payload = (job.payload ?? {}) as { subject?: string | null; message?: string | null };
    // Prefer the server-authoritative recipient email over the free-text one on the job. The RPC
    // already validated + normalized the recipient into recipient_email; the context resolves the
    // trusted address again so we never send to an unvalidated string.
    const { data: ctx, error: ctxErr } = await svc.rpc('owner_worker_offer_context', { p_offer_id: job.offer_id });
    if (ctxErr || !ctx) throw new Error('offer context failed');
    const to = ctx.recipient?.email ?? job.recipient_email;
    if (!to) throw new Error('no recipient email');
    // Mint a FRESH secure token (hash-only stored); use its raw value in memory only. Minted here
    // in the worker — NEVER when the dialog opens — so no active token is created on UI renders.
    const { data: minted, error: mintErr } = await svc.rpc('owner_worker_mint_offer_link', { p_offer_id: job.offer_id, p_valid_days: 30 });
    if (mintErr || !minted?.token) throw new Error('link mint failed');
    const link = `${PUBLIC_APP_URL}/d/${minted.token}`; // EXACT portal URL, never the app root
    const mail = buildOfferEmail(ctx, link, { subject: job.subject ?? payload.subject, message: payload.message });
    const sent = await sendEmail(
      { to, subject: mail.subject, html: mail.html, text: mail.text },
      { idempotencyKey: `${job.id}:offer` },
    );
    if (sent.error) {
      // Send failed → revoke the just-minted token so no active token is orphaned; a retry mints
      // a fresh one. Best-effort; never throws over the original failure.
      if (minted.token_id) await svc.rpc('owner_worker_revoke_offer_token', { p_token_id: minted.token_id }).catch(() => {});
      throw new Error(`email ${sent.error}`);
    }
    // Provider confirmed acceptance → advance the offer to 'sent' (finalized/viewed only; idempotent).
    await svc.rpc('owner_worker_mark_offer_sent', { p_offer_id: job.offer_id });
    return { providerId: sent.id };
  }

  throw new Error(`unknown job type ${type}`);
}

async function resolveInvoiceId(svc: Sb, job: ClaimedJob): Promise<string> {
  if (job.invoice_id) return job.invoice_id;
  if (!job.offer_id) throw new Error('missing invoice/offer');
  const { data, error } = await svc.rpc('owner_ensure_offer_invoice_internal', { p_offer_id: job.offer_id });
  if (error || !data?.invoice_id) throw new Error('invoice resolve failed');
  return data.invoice_id;
}

// Render + privately store the invoice PDF from TRUSTED server context; register it (idempotent).
// Deterministic storage path per invoice → retries overwrite the same object (no orphans).
async function generateAndStoreInvoicePdf(svc: Sb, invoiceId: string): Promise<{ ctx: InvoiceWorkerCtx; pdf: Uint8Array; filename: string; version: number; documentId: string | null }> {
  const { data, error: ctxErr } = await svc.rpc('owner_worker_invoice_context', { p_invoice_id: invoiceId });
  if (ctxErr || !data) throw new Error('invoice context failed');
  const ctx = data as InvoiceWorkerCtx;
  const pdf = renderInvoicePdf(ctx);
  const filename = invoicePdfFilename(ctx.invoice?.invoice_number ?? null);
  const path = `${ctx.business_entity_id}/invoices/${invoiceId}/${filename}`;
  const up = await svc.storage.from(FINANCE_BUCKET).upload(path, pdf, { contentType: 'application/pdf', upsert: true });
  if (up.error) throw new Error('pdf storage failed');
  const sourceHash = await sha256Hex(`${invoiceId}:${ctx.invoice?.invoice_number ?? ''}:${ctx.invoice?.gross_total_cents ?? 0}`);
  const { data: reg } = await svc.rpc('owner_worker_register_document', {
    p_entity: ctx.business_entity_id, p_document_type: 'invoice', p_source_resource_type: 'owner_invoices',
    p_source_resource_id: invoiceId, p_document_number: ctx.invoice?.invoice_number ?? null,
    p_currency: ctx.invoice?.currency ?? 'EUR', p_template_version: 'invoice-worker-v1', p_source_hash: sourceHash,
    p_storage_path: path, p_metadata: { via: 'automation-worker' },
  });
  return { ctx, pdf, filename, version: reg?.version ?? 1, documentId: reg?.document_id ?? null };
}

// Server-authoritative signed-acceptance certificate: fetch the private signature PNG, render the
// certificate from TRUSTED context, store it privately (deterministic path → retry-safe), and
// register it as a SIGNED offer document (idempotent). Returns the PDF bytes so the confirmation
// email can attach them. The private storage path is used only here (worker) — never surfaced.
async function ensureCertificate(
  svc: Sb, offerId: string, acceptanceEventId: string | null,
): Promise<{ ctx: CertificateContext & { recipient: { email: string | null } }; pdf: Uint8Array; filename: string; documentId: string | null }> {
  const { data: ctx, error: ctxErr } = await svc.rpc('owner_worker_certificate_context', {
    p_offer_id: offerId, p_accept_event: acceptanceEventId,
  });
  if (ctxErr || !ctx) throw new Error('certificate context failed');

  // Fetch the drawn signature PNG from the PRIVATE bucket (worker-only) to embed it.
  let signaturePng: Uint8Array | null = null;
  const sigPath: string | null = ctx.signature?.storage_path ?? null;
  if (sigPath) {
    const dl = await svc.storage.from(SIGNATURE_BUCKET).download(sigPath);
    if (!dl.error && dl.data) signaturePng = new Uint8Array(await dl.data.arrayBuffer());
  }
  if (!signaturePng) throw new Error('signature unavailable');

  const pdf = await renderAcceptanceCertificatePdf(ctx as CertificateContext, signaturePng);
  const filename = certificatePdfFilename(ctx.offer?.offer_number ?? null);
  const path = `${ctx.business_entity_id}/certificates/${offerId}/${filename}`;
  const up = await svc.storage.from(FINANCE_BUCKET).upload(path, pdf, { contentType: 'application/pdf', upsert: true });
  if (up.error) throw new Error('certificate storage failed');
  const { data: reg } = await svc.rpc('owner_worker_register_certificate', {
    p_entity: ctx.business_entity_id, p_offer_id: offerId, p_acceptance_event_id: ctx.acceptance_event_id ?? acceptanceEventId,
    p_document_number: ctx.offer?.offer_number ?? null, p_currency: ctx.offer?.currency ?? 'EUR',
    p_source_hash: ctx.offer?.source_hash ?? null, p_signature_sha256: ctx.signature?.sha256 ?? null, p_storage_path: path,
  });
  return { ctx, pdf, filename, documentId: reg?.document_id ?? null };
}
