// Supabase Edge Function: public document portal backend. SOURCE ONLY — NOT DEPLOYED by this task.
//
// Purpose: provide a rate-limited, server-side surface for the anonymous offer portal that the
// browser cannot safely do itself — specifically issuing a SHORT-LIVED SIGNED URL for the stored
// offer PDF (anon has no access to the private finance bucket). Token verification and the curated
// projection / accept-reject already live in SECURITY DEFINER RPCs (public_offer_by_token,
// respond_offer_by_token) callable with the anon key; this function adds rate limiting and the
// signed-URL download that requires the service role.
//
// SECURITY:
// - SUPABASE_SERVICE_ROLE_KEY is a FUNCTION SECRET (supabase secrets set ...). It NEVER ships to the
//   browser and is not a Vite env var. Access via Deno.env only.
// - The raw offer id never grants access; only a valid token (verified by SHA-256 hash in the DB).
// - The service-role client is used ONLY to (a) resolve a verified token's document storage path and
//   (b) create a signed URL. It is never exposed to the caller.
// - Rate limiting here is a best-effort in-memory guard; a production deployment should back it with
//   a durable store (e.g. a Postgres table or KV) since Edge Functions are horizontally scaled.
//
// Deploy (NOT executed here): see ./README.md.

// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const BUCKET = 'owner-finance-documents';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Best-effort in-memory rate limiter (per IP + action). Production: back with a durable store.
const HITS = new Map<string, { count: number; resetAt: number }>();
function rateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const rec = HITS.get(key);
  if (!rec || rec.resetAt < now) { HITS.set(key, { count: 1, resetAt: now + windowMs }); return false; }
  rec.count += 1;
  return rec.count > limit;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'content-type': 'application/json' } });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const url = new URL(req.url);
  const action = url.pathname.split('/').pop();
  const body = await req.json().catch(() => ({}));
  const token: string | undefined = body?.token;
  if (!token || token.length < 32) return json({ error: 'invalid token' }, 400);

  // Anon client for the SECURITY DEFINER RPCs (same surface the browser uses).
  const anon = createClient(SUPABASE_URL, ANON_KEY);

  if (action === 'view') {
    if (rateLimited(`view:${ip}`, 60, 60_000)) return json({ error: 'rate limited' }, 429);
    const { data, error } = await anon.rpc('public_offer_by_token', { p_token: token, p_user_agent: req.headers.get('user-agent') ?? null });
    if (error) return json({ error: error.message }, 400);
    return json({ offer: data });
  }

  if (action === 'respond') {
    if (rateLimited(`respond:${ip}`, 10, 60_000)) return json({ error: 'rate limited' }, 429);
    const { data, error } = await anon.rpc('respond_offer_by_token', {
      p_token: token, p_decision: body.decision, p_signer_name: body.signerName ?? '',
      p_signer_company: body.signerCompany ?? '', p_signer_email: body.signerEmail ?? '',
      p_terms_version: body.termsVersion ?? '', p_comment: body.comment ?? null,
      p_user_agent: req.headers.get('user-agent') ?? null,
    });
    if (error) return json({ error: error.message }, 400);
    return json({ result: data });
  }

  if (action === 'download') {
    if (rateLimited(`download:${ip}`, 20, 60_000)) return json({ error: 'rate limited' }, 429);
    // Verify the token first via the anon projection (raises if invalid/expired/revoked).
    const { error: vErr } = await anon.rpc('public_offer_by_token', { p_token: token, p_user_agent: 'edge-download' });
    if (vErr) return json({ error: vErr.message }, 400);
    // Resolve the token's document storage path with the SERVICE ROLE, then sign it. The raw path is
    // never returned to the caller — only the time-limited signed URL.
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: tokenRow, error: tErr } = await admin
      .from('owner_document_access_tokens')
      .select('document_id, owner_generated_documents:document_id(pdf_storage_path)')
      .eq('token_hash', await sha256Hex(token))
      .maybeSingle();
    if (tErr || !tokenRow) return json({ error: 'not found' }, 404);
    const joined = tokenRow as { owner_generated_documents?: { pdf_storage_path?: string } | null };
    const path = joined.owner_generated_documents?.pdf_storage_path;
    if (!path) return json({ error: 'no document' }, 404);
    const { data: signed, error: sErr } = await admin.storage.from(BUCKET).createSignedUrl(path, 120);
    if (sErr || !signed) return json({ error: 'sign failed' }, 500);
    return json({ url: signed.signedUrl, expires_in: 120 });
  }

  return json({ error: 'unknown action' }, 404);
});

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
