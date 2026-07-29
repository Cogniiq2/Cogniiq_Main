// Customer-facing error translation.
//
// Raw Supabase/PostgREST failures carry internal detail — schema and function
// names ("permission denied for function public.list_customer_invoices"),
// constraint text, and English platform strings. None of that belongs on a
// customer screen: it is unactionable for the reader and it narrates the
// server's internals to an untrusted party.
//
// Every customer read therefore passes its failure through here, which:
//   * logs the FULL error to the browser console (developer-reachable, never
//     rendered), and
//   * returns one short, understandable German sentence that tells the customer
//     what to do next.
//
// The classes below are the ones a customer can actually hit and act on
// differently; anything else collapses to the surface-specific fallback the
// caller supplies, so a new backend failure mode can never leak its raw text.

export const CUSTOMER_ERROR_SESSION_EXPIRED =
  'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.';

export const CUSTOMER_ERROR_OFFLINE =
  'Die Verbindung zu Cogniiq ist unterbrochen. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.';

export const CUSTOMER_ERROR_FORBIDDEN =
  'Für diese Ansicht fehlt Ihrem Konto die Berechtigung. Bitte wenden Sie sich an Ihren Ansprechpartner bei Cogniiq.';

function rawText(error: unknown): string {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  if (typeof error === 'object') {
    const shaped = error as { message?: unknown; code?: unknown; details?: unknown; hint?: unknown };
    return [shaped.code, shaped.message, shaped.details, shaped.hint]
      .filter((part) => typeof part === 'string' && part)
      .join(' | ');
  }
  return String(error);
}

/**
 * Translate a backend failure into safe German customer copy.
 *
 * `fallback` is the surface-specific sentence ("Die Rechnungen konnten nicht
 * geladen werden.") and is what an unrecognised failure becomes — the raw error
 * is never part of the return value under any branch.
 */
export function toCustomerFacingError(error: unknown, fallback: string): string {
  const raw = rawText(error);
  // Console only. This is the one place the real error stays visible, and it is
  // never returned to a caller that renders it.
  console.error('[customer-platform] request failed:', error);

  const normalized = raw.toLowerCase();

  // An expired or invalid session: the only failure with a genuinely different
  // remedy (sign in again) rather than "try again".
  if (
    normalized.includes('jwt expired')
    || normalized.includes('jwt is expired')
    || normalized.includes('token is expired')
    || normalized.includes('invalid jwt')
    || normalized.includes('refresh_token')
    || normalized.includes('authentication required')
    || normalized.includes('28000')
    || normalized.includes('pgrst301')
  ) {
    return CUSTOMER_ERROR_SESSION_EXPIRED;
  }

  // Browser could not reach the backend at all (offline, DNS, CORS preflight,
  // backend unavailable). Retrying is meaningful once connectivity returns.
  if (
    normalized.includes('failed to fetch')
    || normalized.includes('networkerror')
    || normalized.includes('network request failed')
    || normalized.includes('load failed')
    || normalized.includes('err_internet_disconnected')
    || normalized.includes('typeerror: fetch')
  ) {
    return CUSTOMER_ERROR_OFFLINE;
  }

  // Genuine authorization refusal — retrying will not help, so say so instead of
  // offering false hope.
  if (
    normalized.includes('42501')
    || normalized.includes('not authorized')
    || normalized.includes('permission denied')
    || normalized.includes('pgrst302')
  ) {
    return CUSTOMER_ERROR_FORBIDDEN;
  }

  return fallback;
}
