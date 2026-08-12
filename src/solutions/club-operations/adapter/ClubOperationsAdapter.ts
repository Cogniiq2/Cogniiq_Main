// Club Operations — adapter contract.
//
// The UI talks only to this interface. It is shaped for a later authenticated server-side gateway:
// every method is asynchronous, takes a *domain* query and returns a *domain* result.
//
// Deliberately absent, and required to stay absent:
//   * Credentials of any kind. The caller's identity is established by the server from its own
//     session; it is never a parameter, because a parameter can be forged by the browser.
//   * Connection details — host, project reference, database or table names. The server resolves
//     where to read from out of its own environment.
//   * Mutations. This phase is read-only; writes arrive only once each one has its own
//     server-side permission check, audit trail and tests.

import type { BookingPage, BookingQuery, OverviewQuery, OverviewSnapshot } from '../types';

/**
 * Failure modes the UI must distinguish. Modelled explicitly rather than as loose strings so the
 * gateway adapter cannot invent a code the UI does not handle.
 *
 *   unauthorized  — no valid session; the user must sign in again.
 *   forbidden     — signed in, but lacking membership, entitlement or the required permission.
 *   unavailable   — the upstream source could not be reached or answered in time.
 *   invalid_query — the request was malformed; a bug rather than a user error.
 *   unknown       — anything else, surfaced without leaking internals.
 */
export const clubOperationsErrorCodes = [
  'unauthorized',
  'forbidden',
  'unavailable',
  'invalid_query',
  'unknown',
] as const;
export type ClubOperationsErrorCode = (typeof clubOperationsErrorCodes)[number];

export class ClubOperationsError extends Error {
  readonly code: ClubOperationsErrorCode;

  constructor(code: ClubOperationsErrorCode, message: string) {
    super(message);
    this.name = 'ClubOperationsError';
    this.code = code;
  }
}

/** German, staff-facing message per failure mode. Never includes technical detail. */
export const clubOperationsErrorMessages: Record<ClubOperationsErrorCode, string> = {
  unauthorized: 'Die Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.',
  forbidden: 'Für diesen Bereich fehlt die Berechtigung.',
  unavailable: 'Die Daten sind derzeit nicht erreichbar. Bitte versuchen Sie es erneut.',
  invalid_query: 'Die Abfrage war ungültig. Bitte setzen Sie die Filter zurück.',
  unknown: 'Die Daten konnten nicht geladen werden.',
};

export function errorMessageFor(error: unknown): string {
  if (error instanceof ClubOperationsError) return clubOperationsErrorMessages[error.code];
  return clubOperationsErrorMessages.unknown;
}

export interface ClubOperationsAdapter {
  /** Identifies the implementation in diagnostics. Not a connection target. */
  readonly id: string;
  getOverview(query: OverviewQuery): Promise<OverviewSnapshot>;
  listBookings(query: BookingQuery): Promise<BookingPage>;
}
