// ─────────────────────────────────────────────────────────────────────────────
// Private Bar configuration — CLIENT SIDE ONLY.
//
// This temporary version owns no payment lifecycle. The guest is handed off to
// PayPal through one link, and PayPal handles everything from there: this site
// creates no order, sees no callback, and can therefore never state that a
// payment has happened.
//
// Every value the operator has to set lives here, in one place.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The exact PayPal link, verbatim, as supplied by the owner.
 *
 * `null` until it is supplied — and null is a working state, not a broken one:
 * the payment section renders its unconfigured variant and the PayPal control
 * stays disabled. A placeholder URL is never used, and no PayPal parameters are
 * invented: whatever the owner pastes here is what the guest opens.
 */
export const PAYPAL_PAYMENT_URL: string | null = null;

/**
 * Guards against a half-configured deployment.
 *
 * Only an absolute https URL on PayPal's own domains is accepted, so a
 * placeholder, a relative path or a typo fails closed instead of sending a
 * guest somewhere unintended.
 */
export function resolvePaypalUrl(url: string | null = PAYPAL_PAYMENT_URL): string | null {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:') return null;
  const host = parsed.hostname.toLowerCase();
  const allowed =
    host === 'paypal.me' ||
    host === 'www.paypal.me' ||
    host === 'paypal.com' ||
    host.endsWith('.paypal.com');
  return allowed ? parsed.toString() : null;
}

/**
 * Where cash can be left, in the owner's own words.
 *
 * `null` until supplied, and the cash paragraph is written to read correctly
 * without it — no location is invented. Set it to a complete sentence, e.g.
 * "Sie finden das Kuvert in der obersten Schublade der Kommode."
 */
export const CASH_LOCATION: string | null = null;

/**
 * The apartment this deployment serves.
 *
 * Internal: it is not rendered anywhere in the guest interface. It exists so a
 * second apartment is a data change rather than a rebuild.
 */
export const APARTMENT = {
  id: 'bolagio-apartment-1',
} as const;
