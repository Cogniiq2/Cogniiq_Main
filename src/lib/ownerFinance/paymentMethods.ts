// Canonical payment-method vocabulary for owner finance.
//
// The stored value is a short machine token (`bank_transfer`); the owner should only ever
// see German. Three components previously carried their own near-identical option arrays,
// which is how a raw `bank_transfer` ended up rendered in the invoice payment history while
// the payment dialog beside it said "Überweisung". One list, one label map, one fallback.
//
// The union deliberately includes every token any owner-finance surface can produce
// (invoices, expenses), so a value written by one surface always renders correctly in
// another rather than leaking its internal token.

export const PAYMENT_METHOD_LABEL_DE: Record<string, string> = {
  bank_transfer: 'Überweisung',
  direct_debit: 'Lastschrift',
  card: 'Karte',
  cash: 'Bar',
  paypal: 'PayPal',
  other: 'Sonstige',
};

/** Options for a <Select>, in the order an owner is most likely to need them. */
export const PAYMENT_METHOD_OPTIONS: Array<{ value: string; label: string }> = [
  'bank_transfer', 'card', 'cash', 'paypal', 'direct_debit', 'other',
].map((value) => ({ value, label: PAYMENT_METHOD_LABEL_DE[value] }));

/**
 * German label for a stored payment method.
 *
 * Degrades safely rather than throwing: an unknown or legacy token (imported data, a value
 * from an older release) is humanised — `sepa_direct_debit` → "Sepa direct debit" — so the
 * row still reads as something rather than breaking the page or showing a raw snake_case id.
 */
export function paymentMethodLabel(value: string | null | undefined): string {
  const key = (value ?? '').trim();
  if (!key) return '—';
  const known = PAYMENT_METHOD_LABEL_DE[key];
  if (known) return known;
  const humanised = key.replace(/[_-]+/g, ' ').trim();
  return humanised.charAt(0).toUpperCase() + humanised.slice(1);
}

/**
 * German label for a payment's settlement kind.
 *
 * "Anzahlung" is not a decorative distinction: it is the reason a receipt is allowed to
 * predate its invoice at all, and under Soll-Versteuerung it changes which period the USt
 * falls into. The two must therefore be visibly different wherever payments are listed —
 * an owner reading a payment history has to be able to see which receipts arrived before
 * the invoice existed.
 */
export const PAYMENT_KIND_LABEL_DE: Record<string, string> = {
  invoice_payment: 'Zahlung',
  advance_payment: 'Anzahlung',
};

export function paymentKindLabel(value: string | null | undefined): string {
  // Rows written before the column existed carry no value and are ordinary payments.
  return PAYMENT_KIND_LABEL_DE[(value ?? '').trim()] ?? PAYMENT_KIND_LABEL_DE.invoice_payment;
}

export function isAdvancePayment(value: string | null | undefined): boolean {
  return (value ?? '').trim() === 'advance_payment';
}
