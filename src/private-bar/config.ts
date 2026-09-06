// ─────────────────────────────────────────────────────────────────────────────
// Private Bar configuration — the single place every operator-set value lives.
//
// This version owns no payment lifecycle. The guest is handed off to PayPal
// through one link, and PayPal handles everything from there: this site sees no
// callback and can therefore never state that a payment has happened.
//
// Framework-free on purpose: functions/api/private-bar/* imports
// PRIVATE_BAR_APARTMENT_ID from here, so nothing in this file may reach for
// `import.meta.env`, the DOM or React.
// ─────────────────────────────────────────────────────────────────────────────

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
 * The apartment this deployment serves — the ONE place this id is written.
 *
 * It keys the inventory rows in Supabase (private_bar_inventory.apartment_id)
 * and every order, so it must match the value used by the seed in
 * supabase/migrations/20260906120000_private_bar_inventory.sql. The repository
 * has no pre-existing canonical property id (Cogniiq's organizations are
 * customer accounts, not BoLaGio apartments), so this is the canonical one.
 *
 * Internal: never rendered in the guest interface.
 */
export const PRIVATE_BAR_APARTMENT_ID = 'bolagio-apartment-1';
