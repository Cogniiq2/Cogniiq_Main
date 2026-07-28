// Shared environment lookup for Edge Functions. SOURCE ONLY — NOT DEPLOYED by this task.
//
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are AUTOMATICALLY
// provided by the Supabase Edge Function runtime for every deployed function — they
// are never set manually, and `supabase secrets set` REJECTS any name starting with
// the reserved `SUPABASE_` prefix outright. Nothing in the deployment process asks
// for them.
//
// Supabase's newer API key system (publishable/secret keys, replacing anon/service
// role) may expose those under different names depending on project configuration.
// These helpers check the modern name first and fall back to the long-standing
// legacy name, so the same code works on either key system without a code change
// when a project migrates. Values are read once per cold start and are NEVER logged
// or included in any response body — only used to construct a Supabase client.

function readEnv(...names: string[]): string {
  for (const name of names) {
    const value = Deno.env.get(name);
    if (value) return value;
  }
  return '';
}

export function getSupabaseUrl(): string {
  return readEnv('SUPABASE_URL');
}

/** Publishable/anon key — safe for anon-scoped operations (e.g. verifying a caller's own JWT). */
export function getSupabasePublishableKey(): string {
  return readEnv('SUPABASE_PUBLISHABLE_KEYS', 'SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_ANON_KEY');
}

/** Secret/service-role key — full-privilege, server-side only. Never sent to the browser. */
export function getSupabaseSecretKey(): string {
  return readEnv('SUPABASE_SECRET_KEYS', 'SUPABASE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY');
}
