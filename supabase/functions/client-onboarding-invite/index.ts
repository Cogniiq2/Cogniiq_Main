// Supabase Edge Function: owner-triggered client onboarding emails. SOURCE ONLY — NOT DEPLOYED.
//
// One request = one email (invitation | reminder | request), always initiated by the platform
// owner from the AI Receptionist engagement workspace. There is no cron and no automatic send.
//
// Flow:
//   1. Authenticate the caller with their own JWT (anon-key client + Authorization header).
//   2. Reserve the message via owner_onboarding_begin_send UNDER THE CALLER'S IDENTITY. That RPC
//      enforces: platform owner only, recipient belongs to this customer, test mails go to the
//      owner's own address, per-engagement rate limits, the idempotency key, and — for a real
//      invitation — the pending client_invitations row that the existing claim flow consumes.
//      The browser therefore cannot choose a foreign recipient or bypass any limit.
//   3. Build the entry link (Supabase itself emails nothing):
//        * pending portal invitation, no account yet     -> generateLink type=invite (creates the
//          one auth user for this address);
//        * pending portal invitation, account exists but
//          has never signed in (earlier link unused)    -> generateLink type=magiclink to the same
//          set-password page; no second account, no new membership;
//        * the address has signed in before              -> normal portal login, redirectTo=/app/setup;
//        * test send                                     -> portal login; no auth link is minted.
//      The link's own expiry (AUTH_LINK_TTL_SECONDS, which must equal the Supabase Auth
//      "Email OTP expiration") is recorded separately from the 30-day portal invitation.
//   4. Render the SAME template the owner previewed (src/lib/clientOnboarding/emailTemplate.ts).
//   5. Send via Resend with Idempotency-Key "onboarding:<message_id>".
//   6. Record the provider answer via service_onboarding_complete_send (service role only).
//
// Truthfulness: status "accepted" means the provider accepted the message for delivery. It is
// never reported as delivered, opened or read. No tracking pixel, no click tracking.
//
// Secrets (RESEND_API_KEY, service-role key) live only in Deno.env and are never returned or
// logged. The activation link is a credential: it is put into the email only, never into a
// response body, a database row or a log line. Errors returned to the browser are fixed,
// German, owner-facing strings — never raw database or provider messages.
//
// Environment: SUPABASE_URL, SUPABASE_ANON_KEY / SUPABASE_PUBLISHABLE_KEYS,
//   SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SECRET_KEYS (all provided by the runtime),
//   RESEND_API_KEY, EMAIL_FROM, PUBLIC_APP_URL, CUSTOMER_PORTAL_INVITE_REDIRECT (optional),
//   ONBOARDING_REPLY_TO (optional; defaults to the configured sender business email).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { getSupabasePublishableKey, getSupabaseSecretKey, getSupabaseUrl } from '../_shared/env.ts';
import { renderOnboardingEmail, type OnboardingEmailKind, type OnboardingEmailLanguage } from '../_shared/clientOnboarding/emailTemplate.ts';
import { ownerFacingError } from '../_shared/clientOnboarding/sendErrors.ts';
import { decideLink, linkTtlSeconds } from '../_shared/clientOnboarding/linkPolicy.ts';

const SUPABASE_URL = getSupabaseUrl();
const ANON_KEY = getSupabasePublishableKey();
const SERVICE_KEY = getSupabaseSecretKey();
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') ?? '';
const PUBLIC_APP_URL = (Deno.env.get('PUBLIC_APP_URL') ?? 'https://cogniiq.de').replace(/\/$/, '');
const REPLY_TO = Deno.env.get('ONBOARDING_REPLY_TO') ?? '';
const SETUP_PATH = '/app/setup';
// Lifetime of a Supabase email link. MUST equal Auth → Email → "Email OTP expiration" of the
// project. The conservative default (1 h) can only under-state validity, never over-state it.
const AUTH_LINK_TTL_SECONDS = linkTtlSeconds(Deno.env.get('AUTH_LINK_TTL_SECONDS'));
// The invite confirmation page sets the password, then continues into the portal.
const INVITE_REDIRECT = Deno.env.get('CUSTOMER_PORTAL_INVITE_REDIRECT')
  ?? `${PUBLIC_APP_URL}/auth/confirmed?flow=invite`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Json = Record<string, unknown>;

function json(body: Json, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KINDS: OnboardingEmailKind[] = ['invitation', 'reminder', 'request'];

function str(value: unknown, max = 2000): string | null {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null;
}

interface Reservation {
  message_id: string; replay: boolean; status: string;
  kind?: OnboardingEmailKind; language?: OnboardingEmailLanguage; subject?: string; intro?: string | null;
  recipient_email?: string; recipient_name?: string | null; is_test?: boolean; company?: string | null;
  is_member?: boolean; portal_invitation_pending?: boolean; request_question?: string | null;
  recipient_account?: 'none' | 'pending_activation' | 'active' | null;
  sender?: { legal_name?: string | null; email?: string | null; phone?: string | null } | null;
}

function loginUrl(): string {
  return `${PUBLIC_APP_URL}/app/login?redirectTo=${encodeURIComponent(SETUP_PATH)}`;
}

type LinkKind = 'activation' | 'login' | 'portal';

/** Returns the entry link. The activation link never leaves this function except inside the email. */
async function entryLink(admin: ReturnType<typeof createClient>, r: Reservation)
  : Promise<{ url: string; kind: LinkKind; expiresAt: string | null }> {
  const decision = decideLink({
    isTest: r.is_test === true, portalInvitationPending: r.portal_invitation_pending === true,
    recipientAccount: r.recipient_account,
  });
  if (decision === 'portal') return { url: loginUrl(), kind: 'portal', expiresAt: null };
  if ((decision === 'invite' || decision === 'magiclink') && r.recipient_email) {
    const mint = async (type: 'invite' | 'magiclink') => {
      const { data, error } = await admin.auth.admin.generateLink({
        type, email: r.recipient_email as string, options: { redirectTo: INVITE_REDIRECT },
      });
      const link = (data as { properties?: { action_link?: string } } | null)?.properties?.action_link;
      return !error && link ? link : null;
    };
    try {
      // An invite that fails because the account was created in the meantime falls back to a
      // magic link for that same account. Never a second account.
      let link = decision === 'invite' ? await mint('invite') : null;
      if (!link) link = await mint('magiclink');
      if (link) {
        return { url: link, kind: 'activation', expiresAt: new Date(Date.now() + AUTH_LINK_TTL_SECONDS * 1000).toISOString() };
      }
    } catch {
      // fall through to the login link; never fail the send over the link type
    }
  }
  return { url: loginUrl(), kind: 'login', expiresAt: null };
}

async function sendViaResend(msg: { to: string; subject: string; html: string; text: string; replyTo: string | null }, key: string)
  : Promise<{ id: string | null; error: string | null }> {
  if (!RESEND_API_KEY || !EMAIL_FROM) return { id: null, error: 'provider_not_configured' };
  const payload: Json = { from: EMAIL_FROM, to: [msg.to], subject: msg.subject, html: msg.html, text: msg.text };
  if (msg.replyTo) payload.reply_to = msg.replyTo;
  for (let attempt = 0; attempt < 2; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15_000);
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST', signal: ctrl.signal,
        headers: { authorization: `Bearer ${RESEND_API_KEY}`, 'content-type': 'application/json', 'Idempotency-Key': key },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        return { id: (data as { id?: string })?.id ?? null, error: null };
      }
      // Only rate limiting and server errors are retried; the idempotency key makes it safe.
      if ((res.status === 429 || res.status >= 500) && attempt === 0) { await new Promise((r) => setTimeout(r, 1200)); continue; }
      return { id: null, error: `provider_${res.status}` };
    } catch {
      if (attempt === 0) continue;
      return { id: null, error: 'provider_unreachable' };
    } finally {
      clearTimeout(timer);
    }
  }
  return { id: null, error: 'provider_unreachable' };
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ ok: false, error: 'Methode nicht erlaubt.' }, 405);
  if (!SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) return json({ ok: false, error: 'Der Versand ist serverseitig nicht konfiguriert.' }, 500);

  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.toLowerCase().startsWith('bearer ')) return json({ ok: false, error: 'Bitte melden Sie sich erneut an.' }, 401);

  let body: Json;
  try { body = (await req.json()) as Json; } catch { return json({ ok: false, error: 'Ungültige Anfrage.' }, 400); }

  const engagementId = str(body.engagementId, 64);
  const idempotencyKey = str(body.idempotencyKey, 64);
  const kind = str(body.kind, 20) as OnboardingEmailKind | null;
  const language = (str(body.language, 2) ?? 'de') as OnboardingEmailLanguage;
  const requestId = str(body.requestId, 64);
  if (!engagementId || !UUID_RE.test(engagementId)) return json({ ok: false, error: 'Ungültige Einrichtung.' }, 400);
  if (!idempotencyKey || !UUID_RE.test(idempotencyKey)) return json({ ok: false, error: 'Ungültige Anfrage.' }, 400);
  if (!kind || !KINDS.includes(kind)) return json({ ok: false, error: 'Ungültige Nachrichtenart.' }, 400);
  if (language !== 'de' && language !== 'en') return json({ ok: false, error: 'Ungültige Sprache.' }, 400);
  if (requestId && !UUID_RE.test(requestId)) return json({ ok: false, error: 'Ungültige Rückfrage.' }, 400);

  const caller = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: auth } }, auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: who, error: whoErr } = await caller.auth.getUser();
  if (whoErr || !who?.user) return json({ ok: false, error: 'Bitte melden Sie sich erneut an.' }, 401);

  // Step 1 — reservation under the caller's identity (all authorization lives in the RPC).
  const { data: reserved, error: reserveErr } = await caller.rpc('owner_onboarding_begin_send', {
    p_engagement_id: engagementId, p_kind: kind, p_recipient_email: str(body.recipientEmail, 320),
    p_recipient_name: str(body.recipientName, 120), p_language: language, p_subject: str(body.subject, 200) ?? '',
    p_intro: str(body.intro, 2000), p_is_test: body.isTest === true, p_idempotency_key: idempotencyKey,
    p_request_id: requestId,
  });
  if (reserveErr || !reserved) {
    const mapped = ownerFacingError(reserveErr?.message ?? '');
    return json({ ok: false, error: mapped.message }, mapped.status);
  }
  const r = reserved as Reservation;
  if (r.replay) {
    // A double click or a retried request: the original attempt owns the send.
    return json({ ok: r.status === 'accepted', replay: true, messageId: r.message_id, status: r.status });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const link = await entryLink(admin, r);
  const rendered = renderOnboardingEmail({
    kind: r.kind ?? kind, language: r.language ?? language, recipientName: r.recipient_name ?? null,
    company: r.company ?? '', intro: r.intro ?? null, ctaUrl: link.url, portalUrl: `${PUBLIC_APP_URL}/app`,
    requestQuestion: r.request_question ?? null, isTest: r.is_test === true,
    sender: { legalName: r.sender?.legal_name ?? null, email: r.sender?.email ?? null, phone: r.sender?.phone ?? null },
  });
  const subject = r.is_test ? `[TEST] ${r.subject ?? ''}` : (r.subject ?? '');
  const replyTo = REPLY_TO || r.sender?.email || null;

  const sent = await sendViaResend(
    { to: r.recipient_email ?? '', subject, html: rendered.html, text: rendered.text, replyTo },
    `onboarding:${r.message_id}`,
  );

  // Step 2 — record the provider's answer (service role only; "accepted" is final).
  const { error: completeErr } = await admin.rpc('service_onboarding_complete_send', {
    p_message_id: r.message_id, p_accepted: sent.error === null, p_provider_message_id: sent.id, p_error_code: sent.error,
    p_link_kind: link.kind, p_link_expires_at: link.expiresAt,
  });

  if (sent.error) {
    return json({ ok: false, messageId: r.message_id, status: 'failed',
      error: sent.error === 'provider_not_configured'
        ? 'Der E-Mail-Versand ist noch nicht eingerichtet. Es wurde keine E-Mail versendet.'
        : 'Der E-Mail-Anbieter hat die Nachricht nicht angenommen. Bitte versuchen Sie es später erneut.' });
  }
  return json({
    ok: true, messageId: r.message_id, status: 'accepted', linkMode: link.kind, linkExpiresAt: link.expiresAt,
    // The provider accepted the message; recording that fact failed. The owner sees it honestly.
    recordingWarning: completeErr ? 'Der Versand wurde vom Anbieter angenommen, konnte aber nicht vollständig protokolliert werden.' : null,
  });
});
