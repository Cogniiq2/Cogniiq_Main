// ─────────────────────────────────────────────────────────────────────────────
// Private Bar configuration — the single place every operator-set value lives.
//
// This version owns no payment lifecycle. The guest is handed off to PayPal
// through one link, and PayPal handles everything from there: this site sees no
// callback and can therefore never state that a payment has happened.
//
// Framework-free on purpose: this module is reachable from
// functions/api/private-bar/*, so nothing in it may reach for
// `import.meta.env`, the DOM or React.
// ─────────────────────────────────────────────────────────────────────────────
import { APARTMENTS } from './apartments';

/**
 * The exact PayPal link, verbatim, as supplied by the owner.
 *
 * It is a PayPal Business payment page configured for a customer-entered amount
 * ("Vom Kunden festgelegter Preis"), so NOTHING is appended to it — no amount,
 * no currency, no undocumented parameter. This site computes the exact total and
 * shows it (and offers to copy it); the guest enters it in PayPal.
 *
 * `null` is a working state, not a broken one: the payment control renders
 * disabled rather than pointing anywhere. A placeholder URL is never used.
 */
export const PAYPAL_PAYMENT_URL: string | null =
  'https://www.paypal.com/ncp/payment/G6BPUTG3WZQEE';

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
 * Legacy alias for designAparts II's canonical internal id.
 *
 * Apartment ids now live in ./apartments.ts, which is the single place both the
 * browser and the Cloudflare Functions read them from. This export is kept
 * because the value itself must not change: 'bolagio-apartment-1' already keys
 * live inventory rows and real order history, and renaming it for cosmetic
 * consistency with the guest-facing "designAparts II" would be a data migration
 * for no benefit.
 *
 * Internal: never rendered in the guest interface.
 */
export const PRIVATE_BAR_APARTMENT_ID = APARTMENTS.designaparts2.apartmentId;
