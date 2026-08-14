// The fail-closed entitlement boundary for the Club Operations read gateway (D3b-A, §6.2).
//
// This module answers exactly one question — "may this caller run this operation for this
// organization?" — and it is built so that every way of getting the answer wrong is a denial.
//
// What deliberately does not exist here:
//   * any customer, organization, user, project, email or solution identifier;
//   * any environment read, header read, cookie read or request-derived input;
//   * any development flag, preview switch or bypass parameter.
//
// The real, database-backed authorizer is separate reviewed work (plan §19, item B1). Until it
// exists the production shell wires `denyAllAuthorizer`, so every caller is denied — which is the
// correct posture while `club_operations` is inert.

import type { Cqgw1Operation } from './cqgw1.ts';

export interface EntitlementRequest {
  userId: string;
  organizationId: string;
  operation: Cqgw1Operation;
}

/**
 * The ONLY value that authorizes anything is the literal object `{ entitled: true }`.
 *
 * A throw, a rejection, a timeout, `undefined`, `null`, a truthy non-conforming value — every one of
 * them is a denial. There is no bypass parameter, no environment switch, no development flag, and no
 * way to construct an allow from anything except an authorizer that explicitly returns it.
 */
export type EntitlementAuthorizer = (
  request: EntitlementRequest,
) => Promise<{ entitled: boolean }>;

/** The production authorizer until a separately reviewed implementation replaces it (§6.3, B1). */
export const denyAllAuthorizer: EntitlementAuthorizer = async () => ({ entitled: false });

/**
 * Resolve an authorizer's answer to a boolean, denying on every abnormal outcome.
 *
 * The shape check is deliberately exact rather than "truthy `entitled`": a result carrying extra
 * keys is a result produced by something other than the contract, and an authorization decision is
 * the last place to be generous about what a value might have meant.
 */
export async function isEntitled(
  authorizer: EntitlementAuthorizer | null | undefined,
  request: EntitlementRequest,
): Promise<boolean> {
  if (typeof authorizer !== 'function') return false;

  let result: unknown;
  try {
    result = await authorizer(request);
  } catch {
    // A throwing or rejecting authorizer tells us nothing about entitlement, so it grants nothing.
    // The error itself is not propagated: it could carry internal detail, and every denial must be
    // indistinguishable from every other (§6.1).
    return false;
  }

  if (typeof result !== 'object' || result === null || Array.isArray(result)) return false;
  const keys = Object.keys(result as Record<string, unknown>);
  if (keys.length !== 1 || keys[0] !== 'entitled') return false;
  return (result as { entitled: unknown }).entitled === true;
}
