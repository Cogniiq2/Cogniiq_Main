// Turning a bearer token into a caller identity (D3b-A, §6.1 steps 5–6).
//
// This lives here, not in the Edge Function, for one reason: `vitest.config.ts` collects only
// `src/**/*.test.ts`, so anything implemented in the function directory is authentication logic no
// test can reach. What the function supplies is the real client factory. What this module supplies
// is every decision made with it.
//
// ─── The rules, each of which the tests pin ──────────────────────────────────────────────────────
//
//   * identity comes from `auth.getUser()`, which validates the token against the auth server. The
//     JWT is never decoded here and its claims are never read: a claim is what the token *says*, and
//     this boundary needs to know what the auth server *agrees*;
//   * the membership read runs through the same caller-scoped client, so RLS applies to it under the
//     caller's own identity;
//   * exactly one column is requested — an identity check has no business selecting a row;
//   * every error, malformed shape and unexpected value resolves to `null`, which the shell answers
//     as a 401. No Supabase error, message, code or hint is returned, logged or rethrown;
//   * there is no service-role credential in this module, and no parameter through which one could
//     be passed;
//   * nothing here reads a request body, a query string, a custom header or an environment variable.
//     The only input is the `Authorization` header value the shell already required.

import type { CallerIdentity, CallerIdentityResolver } from './clubGatewayShell.ts';

/** The table holding the caller's organization memberships. */
export const ORGANIZATION_MEMBERS_TABLE = 'organization_members';

/** The only column this check needs. Widening it is a review-worthy change, not a convenience. */
export const ORGANIZATION_MEMBERS_COLUMN = 'organization_id';

/** The column the membership rows are filtered by. */
export const ORGANIZATION_MEMBERS_USER_COLUMN = 'user_id';

/* ------------------------------------------------------- The minimal client surface */

/**
 * The smallest shape of a Supabase client this module actually uses.
 *
 * Declared structurally rather than imported so that no browser-reachable module, and no test, has
 * to pull in the Supabase library to exercise this logic — and so the Edge Function can hand in the
 * real client without this module ever naming it.
 */
export interface CallerScopedClient {
  auth: {
    getUser: () => Promise<{
      data?: { user?: { id?: unknown } | null } | null;
      error?: unknown;
    }>;
  };
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => Promise<{ data?: unknown; error?: unknown }>;
    };
  };
}

/**
 * Builds a client scoped to the caller's own token.
 *
 * The header is the factory's only input: there is no place to pass a privileged key, and the
 * factory the production shell supplies closes over the publishable key alone.
 */
export type CallerScopedClientFactory = (authorizationHeader: string) => CallerScopedClient;

/* --------------------------------------------------------------------- Resolution */

function readUserId(result: {
  data?: { user?: { id?: unknown } | null } | null;
  error?: unknown;
}): string | null {
  if (result === null || typeof result !== 'object') return null;
  if (result.error) return null;
  const id = result.data?.user?.id;
  return typeof id === 'string' && id !== '' ? id : null;
}

/**
 * Read organization ids out of whatever the query returned.
 *
 * Defensive by construction: a non-array, a null, a row that is not an object, a row whose
 * `organization_id` is missing or not a non-empty string — each is dropped rather than trusted, and
 * extra columns are ignored. Duplicates are collapsed so a caller with two memberships in one
 * organization is not asked about it twice. An empty result is a legitimate answer, not an error:
 * the shell turns "no memberships" into its opaque 403.
 */
function readOrganizationIds(data: unknown): string[] {
  if (!Array.isArray(data)) return [];
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const row of data) {
    if (typeof row !== 'object' || row === null) continue;
    const id = (row as Record<string, unknown>)[ORGANIZATION_MEMBERS_COLUMN];
    if (typeof id !== 'string' || id === '') continue;
    if (seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

/**
 * Build the production caller resolver over an injected client factory.
 *
 * Returns `null` — never throws — for every failure. A resolver that threw would put a Supabase
 * error object on the shell's error path, and the shell's job is to answer one fixed 401.
 */
export function createSupabaseCallerResolver(
  createClient: CallerScopedClientFactory,
): CallerIdentityResolver {
  return async function resolveCaller(
    authorizationHeader: string,
  ): Promise<CallerIdentity | null> {
    let client: CallerScopedClient;
    try {
      client = createClient(authorizationHeader);
    } catch {
      // A factory that cannot build a client tells us nothing about the caller.
      return null;
    }

    let userId: string | null;
    try {
      userId = readUserId(await client.auth.getUser());
    } catch {
      return null;
    }
    if (!userId) return null;

    let memberships: { data?: unknown; error?: unknown };
    try {
      memberships = await client
        .from(ORGANIZATION_MEMBERS_TABLE)
        .select(ORGANIZATION_MEMBERS_COLUMN)
        .eq(ORGANIZATION_MEMBERS_USER_COLUMN, userId);
    } catch {
      return null;
    }
    // A failed membership read is not "no memberships": it is an unknown answer, and an unknown
    // answer must not be reported as an authenticated caller with nothing to their name.
    if (memberships === null || typeof memberships !== 'object' || memberships.error) return null;

    return { userId, organizationIds: readOrganizationIds(memberships.data) };
  };
}
