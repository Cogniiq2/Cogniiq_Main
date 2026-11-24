// Turns an onboarding RPC error into something safe to render.
//
// Only deliberate, user-facing validation messages pass through: those the migration raises
// with the default errcode P0001 and phrases as German sentences. Everything else — PostgREST
// internals, constraint names, English internal guards — becomes a generic message, so raw
// database text never reaches the screen.

export type OnboardingFailureKind = 'conflict' | 'forbidden' | 'validation' | 'unavailable' | 'unknown';

export interface OnboardingFailure { kind: OnboardingFailureKind; message: string }

interface PgLikeError { code?: string | null; message?: string | null }

const MISSING_BACKEND = /could not find the function|schema cache|does not exist/i;

export function isUserFacingMessage(message: string): boolean {
  const m = message.trim();
  if (m.length === 0 || m.length > 400) return false;
  // German sentence: starts upper-case or with a quote mark, ends with punctuation.
  return /^[A-ZÄÖÜ„"]/.test(m) && /[äöüßÄÖÜ„]|\b(Bitte|Sie|Ihre?|Kein|Ungültig|Diese|Der|Die|Das|Es|Zu|Nur|Für)\b/.test(m);
}

export function describeOnboardingError(error: PgLikeError | null | undefined): OnboardingFailure {
  const code = error?.code ?? '';
  const message = (error?.message ?? '').trim();
  if (code === '40001') {
    return { kind: 'conflict', message: isUserFacingMessage(message) ? message
      : 'Die Angaben wurden zwischenzeitlich geändert. Bitte laden Sie die Seite neu.' };
  }
  if (code === '42501') {
    return { kind: 'forbidden', message: isUserFacingMessage(message) ? message : 'Kein Zugriff.' };
  }
  if (code === 'PGRST202' || MISSING_BACKEND.test(message)) {
    return { kind: 'unavailable', message: 'Diese Funktion ist auf dem Server noch nicht verfügbar.' };
  }
  if (code === 'P0001' && isUserFacingMessage(message)) return { kind: 'validation', message };
  if (message === 'Owner access required') return { kind: 'forbidden', message: 'Nur der Inhaber hat hierauf Zugriff.' };
  return { kind: 'unknown', message: 'Die Aktion konnte nicht ausgeführt werden. Bitte versuchen Sie es erneut.' };
}
