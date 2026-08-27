// Turning whatever a Supabase call rejected with into text a human can act on.
//
// This lives in its OWN module, deliberately: it has no runtime dependency on the Supabase
// client, so it can be unit-tested without VITE_SUPABASE_URL. api.ts re-exports it, so every
// existing import keeps working.

export interface PostgrestLikeError {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
}

// Distinguishes "the finance backend has not been installed in this environment" from an ordinary
// transient/auth error. Missing tables surface as Postgres 42P01 or PostgREST schema-cache misses
// (PGRST205); missing RPCs as PGRST202. We never treat an RLS denial as "missing".
export function isMissingBackendError(err: unknown): boolean {
  const e = err as PostgrestLikeError | null;
  if (!e) return false;
  const code = (e.code ?? '').toUpperCase();
  if (code === '42P01' || code === 'PGRST205' || code === 'PGRST202') return true;
  const text = `${e.message ?? ''} ${e.details ?? ''} ${e.hint ?? ''}`.toLowerCase();
  if (!text.trim()) return false;
  return (
    (text.includes('does not exist') && (text.includes('relation') || text.includes('table') || text.includes('function'))) ||
    text.includes('could not find the table') ||
    text.includes('could not find the function') ||
    text.includes('schema cache')
  );
}

/**
 * Turn ANY thrown/returned value into a sentence a human can act on.
 *
 * This exists because `String(e)` on a PostgREST error renders "[object Object]". PostgREST
 * only constructs a real PostgrestError instance when the caller opted into throwOnError; on
 * the ordinary `{ data, error }` path the error is the parsed JSON body — a PLAIN object with
 * message/details/hint/code and no prototype chain to Error. Any `e instanceof Error ?
 * e.message : String(e)` guard therefore falls through to String() and prints the useless
 * form, which is exactly what the owner saw for a missing RPC.
 *
 * Every branch below returns a non-empty string, so "[object Object]" cannot be produced by
 * construction rather than by convention.
 */
export function describeSupabaseError(err: unknown, fallback = 'Unbekannter Fehler'): string {
  if (err == null) return fallback;
  if (typeof err === 'string') return err.trim() || fallback;
  if (err instanceof Error) return err.message.trim() || fallback;
  if (typeof err === 'number' || typeof err === 'boolean') return String(err);

  if (typeof err === 'object') {
    const e = err as PostgrestLikeError;
    // message/details/hint are the PostgREST payload, in decreasing order of usefulness.
    // Only strings are read: a non-string field is data we cannot render, not text.
    const parts = [e.message, e.details, e.hint]
      .map((p) => (typeof p === 'string' ? p.trim() : ''))
      .filter(Boolean);
    // Deduplicated: PostgREST often repeats the message verbatim in details.
    const text = [...new Set(parts)].join(' — ');
    const code = typeof e.code === 'string' ? e.code.trim() : '';
    if (text) return code ? `${text} (${code})` : text;
    if (code) return `Fehlercode ${code}`;
    // Last resort before String(): a JSON dump is ugly but still tells the owner something.
    try {
      const json = JSON.stringify(err);
      if (json && json !== '{}' && json !== '[]') return json;
    } catch { /* circular or non-serialisable — fall through to the fallback */ }
  }
  return fallback;
}
