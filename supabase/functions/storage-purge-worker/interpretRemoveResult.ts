// Pure logic, no Deno/Supabase imports — deliberately, so it is testable with any JS test
// runner (this repo's own vitest included) rather than only under `deno test`. SOURCE ONLY —
// imported by index.ts, not deployed on its own.
//
// Turns one storage-js `.remove([path])` result into exactly one of the three outcomes the
// queue understands: 'deleted', 'already_missing', 'failed'. This is the one place that
// decision is made, so the worker's main loop never has to re-derive it inline.

export interface RemoveResult {
  /** storage-js returns the objects it actually removed; a path that was already gone is
   *  simply absent from this list — the call itself still succeeds (error is null). */
  data: Array<{ name?: string; path?: string; key?: string } | null> | null;
  error: { message?: string } | null;
}

export type PurgeOutcome =
  | { status: 'deleted' }
  | { status: 'already_missing' }
  | { status: 'failed'; error: string };

/**
 * `objectName` is the path AS STORED in owner_storage_purge_queue (and therefore as passed to
 * `.remove([objectName])`), so matching against it is exact — no normalization, no guessing at
 * a different key the API might echo back.
 */
export function interpretRemoveResult(objectName: string, result: RemoveResult): PurgeOutcome {
  if (result.error) {
    const message = (result.error.message ?? 'storage api error').slice(0, 200);
    return { status: 'failed', error: message };
  }

  const removed = result.data ?? [];
  const matched = removed.some((o) => o && (o.name === objectName || o.path === objectName || o.key === objectName));
  if (matched) return { status: 'deleted' };

  // No error, but the path we asked for does not appear among what was actually removed: it
  // was not there to remove. Distinguishing this from 'deleted' is the entire point of this
  // function existing rather than treating "no error" as blanket success.
  return { status: 'already_missing' };
}

/**
 * A transient-looking failure is worth a cheap client-side courtesy log distinguishing it from
 * a hard failure, but the queue itself does not need to know the difference: `failed` always
 * reverts to `pending` while attempts remain (owner_storage_purge_complete), and a genuinely
 * permanent error (403, bucket not found) will simply keep failing until attempts are exhausted
 * and the owner is shown a terminal, retryable record. No special-casing here would change that
 * outcome, so none is added.
 */
