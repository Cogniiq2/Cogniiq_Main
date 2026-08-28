// Turning a failure from a service-onboarding RPC into something the owner can act on.
//
// Like ownerFinance/errorText.ts, this lives in its OWN module deliberately: it has no runtime
// dependency on the Supabase client, so it can be unit-tested without VITE_SUPABASE_URL and
// mocked test suites can use the REAL implementation instead of a stub that hides regressions.
// api.ts re-exports everything here, so callers import from either.

import { describeSupabaseError, isMissingBackendError } from '@/lib/ownerFinance/errorText';

/**
 * How a caller should react to a failure from the service layer.
 *
 * `missing` means the service-onboarding migrations have not been applied to this environment
 * yet — the tables and RPCs simply do not exist. That is a deployment state, not a fault, and
 * the UI says so calmly instead of showing a red error on every customer page during the
 * window between merging the frontend and running the migration.
 *
 * `error` is everything else and is never dressed up as "not deployed yet": an RLS denial, a
 * network failure or a constraint violation after deployment must stay visible.
 */
export type ServiceBackendStatus = 'missing' | 'error';

export function classifyServiceError(err: unknown): ServiceBackendStatus {
  return isMissingBackendError(err) ? 'missing' : 'error';
}

/** Human-readable text for a failure, never "[object Object]". */
export function describeServiceError(err: unknown): string {
  return describeSupabaseError(err, 'Unbekannter Fehler');
}

/** True when a returned `{ error }` string came from an un-migrated environment. */
export function isMissingBackendMessage(message: string | null): boolean {
  return message !== null && isMissingBackendError({ message });
}

/** How a service mutation failed, in terms the owner can act on. */
export type ServiceFailureKind = 'missing' | 'denied' | 'conflict' | 'server';

/**
 * A failure, split into the part that is safe to render and the part that is not.
 *
 * The owner area is an admin surface, but a raw Postgres error is still the wrong thing to
 * paint into a toast: it names constraints, columns and functions, and it tells the owner
 * nothing about what to do next. So `message` is a sanitised German sentence, `code` is the
 * bare SQLSTATE / PostgREST code (safe, and the one token worth quoting in a bug report), and
 * the untouched original stays on `cause` — logged to the console and available to tests, but
 * never rendered.
 */
export interface ServiceFailure {
  kind: ServiceFailureKind;
  /** Owner-readable German sentence. Never raw SQL, never a constraint name. */
  message: string;
  /** e.g. "23503" or "PGRST202". Null when the failure carried no code. */
  code: string | null;
  /** The original error, for developer diagnostics only. Never rendered. */
  cause: unknown;
}

/**
 * Classify and sanitise a failure from a service RPC.
 *
 * `label` names the thing that failed ("AI Receptionist") so the sentence can be specific
 * without quoting the database. The original error is logged here, in one place, rather than
 * at each call site — the same shape `toCustomerFacingError` uses on the customer platform.
 *
 * This exists because the services panel used to discard the error entirely and show
 * "Leistung konnte nicht hinzugefügt werden" with only the service name, which made the
 * confirmed 23503 audit-trigger failure indistinguishable from an expired session.
 */
export function describeServiceFailure(err: unknown, label?: string): ServiceFailure {
  // Console only. This is the one place the real error stays visible, and it is never part of
  // the returned `message`.
  console.error('[serviceOnboarding] RPC failed:', err);

  const e = (err ?? {}) as { code?: unknown; message?: unknown; details?: unknown };
  const code = typeof e.code === 'string' && e.code.trim() ? e.code.trim() : null;
  const text = `${typeof e.message === 'string' ? e.message : ''} ${typeof e.details === 'string' ? e.details : ''}`.toLowerCase();
  const subject = label ? `„${label}“` : 'Die Leistung';

  if (isMissingBackendError(err)) {
    return {
      kind: 'missing',
      message: 'Die Leistungsverwaltung ist in dieser Umgebung noch nicht aktiviert. Sie wird verfügbar, sobald die zugehörige Datenbank-Migration eingespielt ist.',
      code,
      cause: err,
    };
  }

  // The owner gate or RLS refused it. The remedy is a new session, not a retry.
  if (code === '42501' || text.includes('owner access required') || text.includes('row-level security')) {
    return {
      kind: 'denied',
      message: `${subject} konnte nicht hinzugefügt werden: Ihre Sitzung hat keine Owner-Berechtigung. Bitte melden Sie sich neu an.`,
      code,
      cause: err,
    };
  }

  // A constraint refused the write (23503 foreign key, 23505 unique, 23514 check). Retrying
  // cannot help, so the message says so instead of inviting a retry loop — this is the class
  // the production audit-trigger bug fell into.
  if (code !== null && /^23\d{3}$/.test(code)) {
    return {
      kind: 'conflict',
      message: `${subject} wurde vom Server abgelehnt (Datenbankregel ${code}). Das ist kein Eingabefehler — bitte melden Sie diesen Code an die Entwicklung; ein erneuter Versuch ändert nichts.`,
      code,
      cause: err,
    };
  }

  return {
    kind: 'server',
    message: code
      ? `${subject} konnte nicht hinzugefügt werden (Serverfehler ${code}). Bitte später erneut versuchen.`
      : `${subject} konnte nicht hinzugefügt werden. Bitte später erneut versuchen.`,
    code,
    cause: err,
  };
}
