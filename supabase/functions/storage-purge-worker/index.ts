// Supabase Edge Function: PRODUCTION storage-purge worker. SOURCE ONLY — NOT DEPLOYED.
//
// Invoked every minute by a secure Supabase Cron / pg_net call (see ./README.md), mirroring
// send-offer-document-email exactly. It drains the durable `owner_storage_purge_queue` outbox —
// written by the owner purge RPCs (owner_workspace_purge_items, owner_force_purge_items,
// owner_force_delete_customer, owner_purge_customer) in the SAME transaction as the DB row
// destruction and the tombstone — and is the ONLY thing in this system that calls the real
// Supabase Storage API to remove file bytes. Nothing else does; no SQL function issues
// `delete from storage.objects` for a purge.
//
//   1. authenticates the caller with a constant-time WORKER_SECRET check (x-worker-secret);
//   2. ATOMICALLY claims a bounded batch of due queue entries via
//      owner_storage_purge_claim_batch (FOR UPDATE SKIP LOCKED) so concurrent runs never
//      double-process the same object;
//   3. calls storage.from(bucket).remove([path]) for each — the real API call that removes
//      both the backing bytes and the metadata row together;
//   4. reports the outcome via owner_storage_purge_complete: 'deleted' | 'already_missing' |
//      'failed' (which reverts to 'pending' while attempts remain, so a transient failure is
//      retried next sweep rather than dropped).
//
// SECURITY:
// - WORKER_SECRET and the service-role key live ONLY in Deno.env; neither is ever returned,
//   logged, or echoed. A caller without the correct secret gets a bare 401.
// - The service-role key is read via ../_shared/env.ts — the platform-injected runtime
//   credential (or the newer key-rotation JSON map, whichever the project uses), never a
//   value from a request, never sent to a browser, never stored in the queue table.
// - Every path this worker ever touches came from owner_storage_purge_queue, which only the
//   owner-gated purge RPCs can write (service_role-only grant; direct INSERT as `authenticated`
//   is refused at the GRANT level, before RLS is even evaluated) and which itself only accepts
//   entries from the three buckets this system owns (owner_storage_purge_allowed_buckets()).
//   This worker never receives or trusts a path from an HTTP request body.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseSecretKey, getSupabaseUrl } from '../_shared/env.ts';
import { interpretRemoveResult } from './interpretRemoveResult.ts';

const SUPABASE_URL = getSupabaseUrl();
const SERVICE_ROLE = getSupabaseSecretKey();
const WORKER_SECRET = Deno.env.get('WORKER_SECRET') ?? '';
const BATCH = 25;

interface ClaimedEntry {
  id: string;
  bucket_id: string;
  object_name: string;
  attempt_count: number;
  max_attempts: number;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

// Constant-time string comparison (no early exit on mismatch, length-safe) — identical to the
// automation worker's own helper, duplicated rather than shared across function bundles, which
// Supabase deploys independently of one another.
function safeEqual(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  const len = Math.max(ea.length, eb.length);
  let diff = ea.length ^ eb.length;
  for (let i = 0; i < len; i++) diff |= (ea[i] ?? 0) ^ (eb[i] ?? 0);
  return diff === 0;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'method not allowed' }, 405);

  if (!WORKER_SECRET) return json({ ok: false, error: 'worker not configured' }, 500);
  const provided = req.headers.get('x-worker-secret') ?? '';
  if (!provided || !safeEqual(provided, WORKER_SECRET)) return json({ ok: false, error: 'unauthorized' }, 401);

  const svc = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  const { data: claimed, error: claimErr } = await svc.rpc('owner_storage_purge_claim_batch', { p_limit: BATCH });
  if (claimErr) return json({ ok: false, error: 'could not claim queue entries' }, 500);

  const results: Array<{ id: string; status: string }> = [];
  for (const entry of (claimed ?? []) as ClaimedEntry[]) {
    let outcomeStatus: 'deleted' | 'already_missing' | 'failed';
    let outcomeError: string | null = null;

    try {
      // The real deletion. One object per call: batch-remove exists on the client, but a
      // single-item call keeps interpretRemoveResult's per-entry mapping unambiguous, and the
      // queue is already the batching mechanism — one HTTP round trip per object is the cost
      // of that clarity, and this runs in the background with no one waiting on it.
      const removeResult = await svc.storage.from(entry.bucket_id).remove([entry.object_name]);
      const outcome = interpretRemoveResult(entry.object_name, removeResult);
      outcomeStatus = outcome.status;
      if (outcome.status === 'failed') outcomeError = outcome.error;
    } catch (e) {
      // A thrown network/timeout error is exactly as retryable as a returned `error` — treated
      // identically so a flaky connection cannot look different from a Storage API rejection.
      outcomeStatus = 'failed';
      outcomeError = String((e as Error).message ?? 'error').slice(0, 200);
    }

    const { data: completed } = await svc.rpc('owner_storage_purge_complete', {
      p_id: entry.id, p_status: outcomeStatus, p_error: outcomeError,
    });
    results.push({ id: entry.id, status: (completed as { status?: string } | null)?.status ?? outcomeStatus });
  }

  return json({ ok: true, processed: results.length, results });
});
