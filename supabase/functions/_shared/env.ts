// Shared environment lookup for Edge Functions. SOURCE ONLY — NOT DEPLOYED by this task.
//
// SUPABASE_URL and the legacy SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY scalars are
// AUTOMATICALLY provided by the Supabase Edge Function runtime for every deployed
// function — they are never set manually, and `supabase secrets set` REJECTS any name
// starting with the reserved `SUPABASE_` prefix outright. Nothing in the deployment
// process asks for them.
//
// Supabase's newer API key rotation system exposes SUPABASE_PUBLISHABLE_KEYS and
// SUPABASE_SECRET_KEYS (note the plural) as JSON OBJECTS mapping a key id to its
// value, e.g. `{"default": "sb_publishable_xxx", "<rotated-id>": "sb_publishable_yyy"}`,
// so the currently active key is the `default` entry, NOT the raw env var value
// itself. Treating the plural vars as plain scalars silently sends the JSON blob
// itself as the "key" — this module parses them correctly and selects `default`.
//
// Lookup order per credential: modern JSON map (`default` entry) -> legacy singular
// scalar name -> the long-standing SUPABASE_ANON_KEY/SUPABASE_SERVICE_ROLE_KEY name.
// Any missing or malformed value falls through safely to '' (never throws, never
// logs, never echoes the malformed input) so a misconfigured project fails the
// downstream Supabase client construction with a clear "invalid URL/key" error
// rather than leaking anything about *why* the env var was unusable.

function readScalar(...names: string[]): string {
  for (const name of names) {
    const value = Deno.env.get(name);
    if (value) return value;
  }
  return '';
}

/**
 * Parses a Supabase key-rotation env var (a JSON object keyed by key id) and
 * returns the `default` entry. Returns '' for a missing, malformed, or
 * structurally invalid value — never throws, never logs the raw content.
 */
function readDefaultFromJsonKeyMap(name: string): string {
  const raw = Deno.env.get(name);
  if (!raw) return '';
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return '';
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return '';
  const value = (parsed as Record<string, unknown>).default;
  return typeof value === 'string' && value ? value : '';
}

export function getSupabaseUrl(): string {
  return readScalar('SUPABASE_URL');
}

/** Publishable/anon key — safe for anon-scoped operations (e.g. verifying a caller's own JWT). */
export function getSupabasePublishableKey(): string {
  return readDefaultFromJsonKeyMap('SUPABASE_PUBLISHABLE_KEYS')
    || readScalar('SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_ANON_KEY');
}

/** Secret/service-role key — full-privilege, server-side only. Never sent to the browser. */
export function getSupabaseSecretKey(): string {
  return readDefaultFromJsonKeyMap('SUPABASE_SECRET_KEYS')
    || readScalar('SUPABASE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY');
}
