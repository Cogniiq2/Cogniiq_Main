// The browser end of the Club Operations read path.
//
// This is the one piece that was missing between the module's transport seam and the
// `club-operations-read` Edge Function: something that turns a domain question into an
// authenticated request and an outcome back into `{ status, body }`.
//
// What it does NOT carry, and must never carry:
//   * the upstream club system's URL, project reference, key id or signing key — those live only in
//     the Edge Function's server-side environment;
//   * a user id, organization id or email in the request. The function derives the caller's identity
//     from their own bearer token and the entitled organization from the database. A body-supplied
//     identifier can be forged by the browser, so the contract admits exactly two keys.
//
// `supabase.functions.invoke` attaches the current session's Authorization header itself, which is
// why no credential appears here either.

import { FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import type {
  ClubOperationsTransport,
  ClubOperationsTransportResponse,
} from '@/solutions/club-operations/adapter/transport';

export const CLUB_OPERATIONS_FUNCTION_NAME = 'club-operations-read';

/** The seam the tests drive. Mirrors the shape of `supabase.functions.invoke`. */
export type ClubOperationsInvoke = (
  name: string,
  options: { body: { operation: string; query: Record<string, unknown> } },
) => Promise<{ data: unknown; error: unknown }>;

const defaultInvoke: ClubOperationsInvoke = (name, options) =>
  supabase.functions.invoke(name, options);

/**
 * Recover the HTTP status of a failed invocation.
 *
 * A non-2xx answer arrives as a `FunctionsHttpError` carrying the original response, so the real
 * status survives and the adapter can map 401/403/400/429/5xx onto its five public codes. Anything
 * else — a network failure, a relay error, an unrecognised error object — never reached a verdict,
 * so it becomes 503: "could not be reached", not "denied". Reporting a transport failure as a
 * permission failure would make the client an oracle for a relationship it must not observe.
 */
function statusForError(error: unknown): number {
  if (error instanceof FunctionsHttpError) {
    const status = error.context?.status;
    if (typeof status === 'number' && status >= 400) return status;
  }
  return 503;
}

export function createClubOperationsBrowserTransport(
  invoke: ClubOperationsInvoke = defaultInvoke,
): ClubOperationsTransport {
  return async ({ operation, query }): Promise<ClubOperationsTransportResponse> => {
    let result: { data: unknown; error: unknown };
    try {
      result = await invoke(CLUB_OPERATIONS_FUNCTION_NAME, {
        body: { operation, query },
      });
    } catch (cause) {
      // invoke() itself threw: the request did not complete. Same reasoning as above — unreachable,
      // not denied. The cause is not propagated so no internal detail crosses the boundary.
      void cause;
      return { status: 503, body: null };
    }

    if (result.error) return { status: statusForError(result.error), body: null };

    // The function's only successful body is the operation's payload. The adapter validates it
    // against the domain shape before any of it reaches a component, so nothing is trusted here.
    return { status: 200, body: result.data };
  };
}
