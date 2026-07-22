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
import { renderInvoicePdf, invoicePdfFilename } from './invoicePdf.ts';
import { buildInvoiceEmail, buildOfferEmail } from './email.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const WORKER_SECRET = Deno.env.get('WORKER_SECRET') ?? '';
const EMAIL_PROVIDER = Deno.env.get('EMAIL_PROVIDER') ?? 'resend';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') ?? '';
const PUBLIC_APP_URL = (Deno.env.get('PUBLIC_APP_URL') ?? '').replace(/\/$/, '');
const FINANCE_BUCKET = 'owner-finance-documents';
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
      const status = await processJob(svc, job);
      await svc.rpc('owner_complete_automation_job', {
        p_job_id: jobId, p_status: 'sent', p_provider_message_id: status.providerId ?? null, p_error: null, p_retry_delay_seconds: 60,
      });
      results.push({ id: jobId, status: 'sent' });
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

// Performs the real operation. Throws on failure (worker records retrying/failed).
async function processJob(svc: Sb, job: ClaimedJob): Promise<{ providerId: string | null }> {
  const type: string = job.job_type;

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

    const { data: ctx, error: ctxErr } = await svc.rpc('owner_worker_invoice_context', { p_invoice_id: invoiceId });
    if (ctxErr || !ctx) throw new Error('invoice context failed');
    const to = ctx.recipient?.email;
    if (!to) throw new Error('no recipient email');

    // Render the invoice PDF from TRUSTED server context and store it privately.
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
    const version = reg?.version ?? 1;

    const mail = buildInvoiceEmail(ctx);
    const sent = await sendEmail(
      { to, subject: mail.subject, html: mail.html, text: mail.text },
      { attachment: { filename, contentBase64: toBase64(pdf) }, idempotencyKey: `${job.id}:${version}` },
    );
    if (sent.error) throw new Error(`email ${sent.error}`);
    return { providerId: sent.id };
  }

  if (type === 'offer_email') {
    if (!job.offer_id) throw new Error('missing offer');
    if (!PUBLIC_APP_URL) throw new Error('app url not configured');
    // Mint a FRESH secure token (hash-only stored); use its raw value in memory only.
    const { data: minted, error: mintErr } = await svc.rpc('owner_worker_mint_offer_link', { p_offer_id: job.offer_id, p_valid_days: 30 });
    if (mintErr || !minted?.token) throw new Error('link mint failed');
    const link = `${PUBLIC_APP_URL}/d/${minted.token}`; // EXACT portal URL, never the app root
    const { data: ctx, error: ctxErr } = await svc.rpc('owner_worker_offer_context', { p_offer_id: job.offer_id });
    if (ctxErr || !ctx) throw new Error('offer context failed');
    const to = ctx.recipient?.email;
    if (!to) throw new Error('no recipient email');
    const mail = buildOfferEmail(ctx, link);
    const sent = await sendEmail(
      { to, subject: mail.subject, html: mail.html, text: mail.text },
      { idempotencyKey: `${job.id}:offer` },
    );
    if (sent.error) throw new Error(`email ${sent.error}`);
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
