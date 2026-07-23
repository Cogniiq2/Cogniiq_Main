// Supabase Edge Function: token-authenticated offer acceptance with a drawn signature.
// SOURCE ONLY — NOT DEPLOYED by this task.
//
// This is the PREFERRED acceptance path. The browser cannot safely store a signature in a
// private bucket, hash it authoritatively, or drive the server-side acceptance pipeline —
// so it posts here. This function:
//   1. validates the token (length only; the DB verifies the SHA-256 hash),
//   2. validates the signature payload (data: URL, image/png MIME, strict max size,
//      non-empty, decodable),
//   3. hashes the PNG SERVER-SIDE (SHA-256),
//   4. stores the PNG PRIVATELY at a SERVER-GENERATED path (never a client-chosen path)
//      in the private `owner-offer-signatures` bucket (no public URL),
//   5. calls the service-role RPC `record_offer_acceptance` which binds the evidence to the
//      exact immutable offer version + source hash, is idempotent, and queues the configured
//      invoice automation.
//
// SECURITY / PRIVACY:
// - SUPABASE_SERVICE_ROLE_KEY is a FUNCTION SECRET (Deno.env only) — never shipped to the browser.
// - The raw token and the signature bytes are NEVER logged.
// - MIME + size are enforced; malformed/oversized payloads are rejected before any storage write.
// - Best-effort in-memory rate limiting per IP (production: back with a durable store).
//
// Deploy (NOT executed here): see ./README.md.

// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SIGNATURE_BUCKET = 'owner-offer-signatures';
const MAX_SIGNATURE_BYTES = 400_000; // ~250–400 KB budget

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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

function decodePngDataUrl(dataUrl: string): Uint8Array | null {
  const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl.trim());
  if (!m) return null;
  try {
    const bin = atob(m[1]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    // PNG magic number check (reject malformed image payloads).
    const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    if (bytes.length < 8 || sig.some((b, i) => bytes[i] !== b)) return null;
    return bytes;
  } catch { return null; }
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ ok: false, error: 'method not allowed' }, 405);

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (rateLimited(`accept:${ip}`, 8, 60_000)) return json({ ok: false, error: 'rate limited' }, 429);

  const body = await req.json().catch(() => ({}));
  const token: string | undefined = body?.token;
  if (!token || token.length < 32) return json({ ok: false, error: 'invalid token' }, 400);
  const signerName: string = (body?.signer_name ?? '').toString().trim();
  if (!signerName) return json({ ok: false, error: 'signer name is required' }, 400);

  const png = decodePngDataUrl((body?.signature_png ?? '').toString());
  if (!png) return json({ ok: false, error: 'invalid signature image' }, 400);
  if (png.byteLength > MAX_SIGNATURE_BYTES) return json({ ok: false, error: 'signature too large' }, 413);

  const hash = await sha256Hex(png);

  const svc = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  // Resolve the verified token's offer to build a SERVER-GENERATED storage path (never client-chosen).
  const { data: tok, error: tokErr } = await svc.rpc('owner_verify_offer_token', { p_token: token });
  if (tokErr || !tok) return json({ ok: false, error: 'link is not valid' }, 400);
  const businessEntityId = tok.business_entity_id;
  const offerId = tok.offer_id;
  const path = `${businessEntityId}/${offerId}/${crypto.randomUUID()}.png`;

  const up = await svc.storage.from(SIGNATURE_BUCKET).upload(path, png, { contentType: 'image/png', upsert: false });
  if (up.error) return json({ ok: false, error: 'could not store signature' }, 500);

  const ipHash = await sha256Hex(new TextEncoder().encode(`${ip}:${offerId}`));
  const { data, error } = await svc.rpc('record_offer_acceptance', {
    p_token: token,
    p_signer_name: signerName,
    p_signer_company: (body?.signer_company ?? '').toString(),
    p_signer_email: (body?.signer_email ?? '').toString(),
    p_signer_role: (body?.signer_role ?? '') ? (body?.signer_role ?? '').toString() : null,
    p_comment: (body?.comment ?? '') ? (body?.comment ?? '').toString() : null,
    p_terms_version: (body?.terms_version ?? 'annahme-v1').toString(),
    p_signature_path: path,
    p_signature_sha256: hash,
    p_signature_bytes: png.byteLength,
    p_user_agent: (body?.user_agent ?? '').toString().slice(0, 200),
    p_ip_hash: ipHash,
  });

  if (error) {
    // Compensation: remove the orphaned signature object so no unmanaged blob is left behind.
    await svc.storage.from(SIGNATURE_BUCKET).remove([path]).catch(() => {});
    // Never surface a raw Postgres error to the customer.
    return json({ ok: false, error: 'acceptance could not be recorded' }, 400);
  }

  // Enqueue the signed-offer PDF + confirmation email generation is handled by the DB pipeline
  // (owner_process_offer_acceptance) and the automation-job worker; nothing sensitive is returned.
  return json({ ok: true, offer_number: data?.offer_number ?? null });
});
