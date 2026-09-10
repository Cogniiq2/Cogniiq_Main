// Imports the storage-purge-worker Edge Function's PURE logic module directly from
// supabase/functions/ — it has no Deno-specific or network imports, so it runs unmodified under
// vitest. This is the one piece of the worker's behaviour genuinely executable in this
// environment (no Deno runtime, no live Supabase Storage backend); the rest — auth, claiming,
// concurrency, retries, idempotency, cascading multi-object purges — is proven against a real
// Postgres in supabase/tests/run_owner_purge_policy_smoke.sh (S9), including two true
// concurrent sessions racing to claim the same batch.
import { describe, expect, it } from 'vitest';
import { interpretRemoveResult, type RemoveResult } from '../../../supabase/functions/storage-purge-worker/interpretRemoveResult';

describe('interpreting a storage-js remove() result', () => {
  it('is "deleted" when the requested path appears in what was actually removed', () => {
    const result: RemoveResult = { data: [{ name: 'e/rechnung.pdf' }], error: null };
    expect(interpretRemoveResult('e/rechnung.pdf', result)).toEqual({ status: 'deleted' });
  });

  it('matches on "path" or "key" too — different storage-js versions shape the removed object differently', () => {
    expect(interpretRemoveResult('a.pdf', { data: [{ path: 'a.pdf' }], error: null }))
      .toEqual({ status: 'deleted' });
    expect(interpretRemoveResult('a.pdf', { data: [{ key: 'a.pdf' }], error: null }))
      .toEqual({ status: 'deleted' });
  });

  it('is "already_missing" — never an error — when no error was returned but nothing matched', () => {
    expect(interpretRemoveResult('never-uploaded.pdf', { data: [], error: null }))
      .toEqual({ status: 'already_missing' });
    expect(interpretRemoveResult('never-uploaded.pdf', { data: null, error: null }))
      .toEqual({ status: 'already_missing' });
  });

  it('is "already_missing" when OTHER objects were removed but not the one asked about', () => {
    // Defensive: this worker only ever calls remove() with a single path, but the interpreter
    // must not claim success for the wrong object if that ever changes.
    const result: RemoveResult = { data: [{ name: 'unrelated.pdf' }], error: null };
    expect(interpretRemoveResult('the-one-we-asked-for.pdf', result)).toEqual({ status: 'already_missing' });
  });

  it('is "failed" with the (truncated) message when the API returns an error', () => {
    const result: RemoveResult = { data: null, error: { message: 'x'.repeat(500) } };
    const outcome = interpretRemoveResult('a.pdf', result);
    expect(outcome.status).toBe('failed');
    if (outcome.status === 'failed') {
      expect(outcome.error.length).toBe(200);
    }
  });

  it('is "failed" with a generic message when the API returns an error with no message', () => {
    expect(interpretRemoveResult('a.pdf', { data: null, error: {} }))
      .toEqual({ status: 'failed', error: 'storage api error' });
  });

  it('never reports "deleted" when an error is present, even if data also looks successful', () => {
    // A defensive case: if a future storage-js version ever returns both a partial `data` and
    // an `error` on the same response, the error must win — reporting deleted for something an
    // error was raised about would let a purge claim success on a call that actually failed.
    const result: RemoveResult = { data: [{ name: 'a.pdf' }], error: { message: 'partial failure' } };
    expect(interpretRemoveResult('a.pdf', result)).toEqual({ status: 'failed', error: 'partial failure' });
  });
});
