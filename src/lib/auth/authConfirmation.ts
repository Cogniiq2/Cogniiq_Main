// Pure logic and copy for the authentication completion surface (/auth/confirmed).
//
// Kept free of React and Supabase so every decision the page makes — which flow is running, whether
// the link already failed, whether a *confirmed* session exists, which German message to show — is
// unit-testable in isolation. The page itself only wires this to state.
//
// Two hard rules encoded here:
//   1. No false success. `ready` is reached only with a confirmed, authenticated session.
//   2. No raw provider errors. Supabase messages never reach the UI; they are mapped to a fixed set
//      of German messages.

export type AuthConfirmationFlow = 'signup' | 'invite';

export type AuthConfirmationErrorReason =
  | 'expired-link'
  | 'missing-session'
  | 'network'
  | 'password-update';

export type AuthConfirmationPhase =
  | { kind: 'resolving' }
  | { kind: 'ready' }
  | { kind: 'error'; reason: AuthConfirmationErrorReason };

export interface AuthConfirmationCopy {
  title: string;
  description: string;
}

/** Bounded wait for Supabase to turn the URL fragment into a session before we call it a failure. */
export const SESSION_RESOLUTION_TIMEOUT_MS = 12_000;

export const MIN_PASSWORD_LENGTH = 8;

const FLOWS: readonly AuthConfirmationFlow[] = ['signup', 'invite'];

/** `?flow=` is user-controlled; anything unrecognised falls back to the signup flow. */
export function normalizeFlow(raw: string | null | undefined): AuthConfirmationFlow {
  const value = (raw ?? '').trim().toLowerCase();
  return (FLOWS as readonly string[]).includes(value) ? (value as AuthConfirmationFlow) : 'signup';
}

/**
 * Supabase reports a dead link either in the query string or in the URL fragment, depending on the
 * flow and on whether the redirect was rewritten. Both are inspected. Only the *presence* of an
 * error is returned — the provider's `error_description` is deliberately discarded so it can never
 * be rendered.
 */
export function hasLinkError(search: string, hash: string): boolean {
  return [search, hash].some((part) => {
    if (!part) return false;
    const params = new URLSearchParams(part.replace(/^[#?]/, ''));
    return Boolean(params.get('error') ?? params.get('error_code'));
  });
}

export interface ConfirmationInput {
  /** Supabase already told us the link is dead (query/hash carries an error). */
  linkFailed: boolean;
  /** The auth bootstrap is still running. */
  isLoading: boolean;
  /** The auth bootstrap never answered — treated as a network failure, not as "signed out". */
  authTimedOut: boolean;
  /** An authenticated session exists right now. */
  hasSession: boolean;
  /** That session belongs to a user whose email is confirmed. */
  isEmailConfirmed: boolean;
  /** The bounded wait for the URL session has elapsed. */
  waitElapsed: boolean;
}

/**
 * Decide what the page shows. Ordering matters: a link Supabase itself rejected is reported as such
 * even while the bootstrap is still running, and a bootstrap that never answered is a network
 * problem rather than a missing session.
 */
export function resolveConfirmationPhase(input: ConfirmationInput): AuthConfirmationPhase {
  if (input.linkFailed) return { kind: 'error', reason: 'expired-link' };
  if (input.authTimedOut) return { kind: 'error', reason: 'network' };

  if (input.hasSession && input.isEmailConfirmed) return { kind: 'ready' };

  // Still loading, or the session simply has not landed yet: keep waiting until the deadline. Never
  // show success, never show an error, in this window.
  if (input.isLoading || !input.waitElapsed) return { kind: 'resolving' };

  return { kind: 'error', reason: 'missing-session' };
}

export const CONFIRMATION_ERROR_COPY: Record<AuthConfirmationErrorReason, AuthConfirmationCopy> = {
  'expired-link': {
    title: 'Bestätigungslink ungültig oder abgelaufen',
    description:
      'Dieser Link ist nicht mehr gültig. Bitte fordern Sie einen neuen Link an oder wenden Sie sich an unseren Support.',
  },
  'missing-session': {
    title: 'Keine gültige Sitzung gefunden',
    description:
      'Wir konnten über diesen Link keine bestätigte Sitzung herstellen. Bitte öffnen Sie den Link erneut direkt aus Ihrer E-Mail.',
  },
  network: {
    title: 'Verbindung nicht möglich',
    description:
      'Die Verbindung zu Cogniiq ist unterbrochen. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.',
  },
  'password-update': {
    title: 'Passwort konnte nicht gespeichert werden',
    description:
      'Ihr Passwort konnte nicht gesetzt werden. Bitte versuchen Sie es erneut oder wenden Sie sich an unseren Support.',
  },
};

export const SIGNUP_SUCCESS_COPY: AuthConfirmationCopy = {
  title: 'E-Mail erfolgreich bestätigt',
  description: 'Ihr Cogniiq-Zugang wurde aktiviert.',
};

export const INVITE_READY_COPY: AuthConfirmationCopy = {
  title: 'Einladung erfolgreich angenommen',
  description: 'Legen Sie jetzt Ihr persönliches Passwort fest.',
};

export const INVITE_SUCCESS_COPY: AuthConfirmationCopy = {
  title: 'Passwort gespeichert',
  description: 'Ihr persönliches Passwort ist aktiv. Sie können Ihren Zugang jetzt öffnen.',
};

export const RESOLVING_COPY: AuthConfirmationCopy = {
  title: 'Zugang wird geprüft',
  description: 'Ihre Anmeldung wird sicher bestätigt. Einen Moment bitte.',
};

export const CONTINUE_PATH = '/auth/continue';

export const SIGNUP_CTA_LABEL = 'Zum Kundenportal';
export const INVITE_CTA_LABEL = 'Zugang öffnen';

export const PASSWORD_TOO_SHORT_MESSAGE = `Bitte verwenden Sie mindestens ${MIN_PASSWORD_LENGTH} Zeichen.`;
export const PASSWORD_MISMATCH_MESSAGE = 'Die Passwörter stimmen nicht überein.';

/** Returns a German validation message, or null when the pair is acceptable. */
export function validatePasswordPair(password: string, confirmation: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return PASSWORD_TOO_SHORT_MESSAGE;
  if (password !== confirmation) return PASSWORD_MISMATCH_MESSAGE;
  return null;
}

/**
 * Collapse anything Supabase (or the network) throws during `updateUser` into our own copy. The
 * provider message is intentionally never returned, so it can never be rendered.
 */
export function describePasswordUpdateFailure(): AuthConfirmationCopy {
  return CONFIRMATION_ERROR_COPY['password-update'];
}
