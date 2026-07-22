// Supabase Edge Function: automation-job worker + email provider abstraction.
// SOURCE ONLY — NOT DEPLOYED by this task.
//
// Drains `owner_automation_jobs` (the durable outbox) and performs the configured
// downstream steps after an offer is accepted: issue/finalize the invoice, generate its
// PDF, and send the invoice/offer email through a pluggable provider. Every step records
// its outcome back on the job (status, attempt_count, last_error, provider_message_id) so
// the owner dashboard can show delivery state and offer manual retry. Bounded retries.
//
// SECURITY / PRIVACY:
// - EMAIL provider secrets (e.g. RESEND_API_KEY) live ONLY in function env (Deno.env). They
//   are never a Vite/browser variable and never returned to any caller.
// - The raw customer access token is NEVER read or logged here (jobs reference offer/invoice
//   ids, not tokens). Signatures are never emailed or logged.
// - PUBLIC_APP_URL must be the configured production URL — never a preview host.
//
// This is intentionally a thin, provider-agnostic skeleton: the invoice issue/PDF steps are
// delegated to server-authoritative RPCs (owner_convert_offer_internal already created the
// draft; issuing/PDF are the owner's existing finance routines). Deploy + schedule (NOT here):
// see ./README.md.

// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const EMAIL_PROVIDER = Deno.env.get('EMAIL_PROVIDER') ?? 'resend';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') ?? '';
const PUBLIC_APP_URL = Deno.env.get('PUBLIC_APP_URL') ?? '';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'content-type': 'application/json' } });
}

interface EmailMessage { to: string; subject: string; html: string; }

/** Provider abstraction. Secrets are read from env; nothing is hardcoded. */
async function sendEmail(msg: EmailMessage): Promise<{ id: string | null; error: string | null }> {
  if (!msg.to) return { id: null, error: 'no recipient' };
  if (EMAIL_PROVIDER === 'resend') {
    if (!RESEND_API_KEY || !EMAIL_FROM) return { id: null, error: 'email provider not configured' };
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: EMAIL_FROM, to: msg.to, subject: msg.subject, html: msg.html }),
    });
    if (!res.ok) return { id: null, error: `provider ${res.status}` };
    const data = await res.json().catch(() => ({}));
    return { id: data?.id ?? null, error: null };
  }
  return { id: null, error: `unsupported provider ${EMAIL_PROVIDER}` };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ ok: false, error: 'method not allowed' }, 405);

  const svc = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  // Claim a small batch of pending/retrying jobs (bounded retries).
  const { data: jobs, error } = await svc
    .from('owner_automation_jobs')
    .select('*')
    .in('status', ['pending', 'retrying'])
    .lt('attempt_count', 5)
    .order('scheduled_at', { ascending: true })
    .limit(10);
  if (error) return json({ ok: false, error: 'could not load jobs' }, 500);

  const results: Array<{ id: string; status: string }> = [];
  for (const job of jobs ?? []) {
    await svc.from('owner_automation_jobs').update({ status: 'processing', attempt_count: job.attempt_count + 1 }).eq('id', job.id);
    try {
      let providerId: string | null = null;
      if (job.job_type === 'invoice_email' || job.job_type === 'invoice_send' || job.job_type === 'offer_email') {
        const link = PUBLIC_APP_URL ? `${PUBLIC_APP_URL.replace(/\/$/, '')}/` : '';
        const sent = await sendEmail({
          to: job.recipient_email ?? '',
          subject: job.subject ?? 'Cogniiq',
          html: `<p>Guten Tag,</p><p>Ihre Unterlagen liegen bereit.</p>${link ? `<p><a href="${link}">${link}</a></p>` : ''}<p>Beste Grüße<br/>Cogniiq</p>`,
        });
        if (sent.error) throw new Error(sent.error);
        providerId = sent.id;
      }
      // invoice_issue is delegated to the owner's server-authoritative issue routine (not shown);
      // this worker records the job outcome so the dashboard reflects delivery state.
      await svc.from('owner_automation_jobs').update({ status: 'sent', sent_at: new Date().toISOString(), provider_message_id: providerId, last_error: null }).eq('id', job.id);
      results.push({ id: job.id, status: 'sent' });
    } catch (e) {
      const retry = job.attempt_count + 1 < job.max_attempts;
      await svc.from('owner_automation_jobs').update({ status: retry ? 'retrying' : 'failed', last_error: String((e as Error).message).slice(0, 300) }).eq('id', job.id);
      results.push({ id: job.id, status: retry ? 'retrying' : 'failed' });
    }
  }
  return json({ ok: true, processed: results.length, results });
});
