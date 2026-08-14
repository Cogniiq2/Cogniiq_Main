// The source-absent dataset: what the gateway will actually be able to return.
//
// The `populated` fixtures are deliberately rich — they are fiction, and fiction may know things.
// The real upstream cannot. Every field marked SOURCE-ABSENT in `types.ts` has no authorised column
// behind it, so a live gateway response will carry `null` there, and the UI has to stay truthful
// when it does.
//
// This dataset is that response, built by taking the populated fixtures and removing exactly what
// no granted column can supply. It is derived rather than hand-written on purpose: the rows keep
// their realistic shape and their cross-references, and the only difference from `populated` is the
// absence itself — which is what the rendering tests are actually about.
//
// Nothing here invents a replacement. No zero stands in for an unknown amount, no empty string for
// an unknown name, no empty array for an untracked history.
//
// The reduction also runs in the other direction: where a granted column is *coarser* than the
// populated fiction, this dataset is coarsened to match it. A voucher balance is the case in point —
// the grant carries a boolean, so the scenario carries a boolean's worth of precision.

import { buildReconciliationEntry } from '../reconciliation';
import type { Member, Payment, ReconciliationEntry, Voucher, VoucherStatus } from '../types';
import { findBookingByReference } from './bookings';
import { fixtureInvoices } from './invoices';
import { fixtureMembers } from './members';
import { fixturePayments } from './payments';
import { fixtureVouchers } from './vouchers';

/**
 * Payments as the gateway can read them.
 *
 * `public.payments` grants `id, created_at, provider, status, amount_eur, currency, reference_type,
 * reference_id` and nothing else, so the name, the classification, the note and the refund amount
 * are all unavailable — the first three live in the excluded `metadata` jsonb, and the fourth has no
 * column anywhere in the table.
 */
export const sourceAbsentPayments: Payment[] = fixturePayments.map((payment) => ({
  ...payment,
  customerName: null,
  metaClass: null,
  note: null,
  refundedCents: null,
}));

/**
 * Vouchers as the gateway can read them.
 *
 * Expiry and redemption history are not tracked upstream (D2 contract §3), and the sole redemption
 * signal granted on `"Gutschein"` is the **boolean** `is_redeemed`. Two consequences, both of them
 * reductions in fidelity rather than inventions:
 *
 *   * `partially_redeemed` and `expired` are unreachable — a sold voucher still holding value is
 *     simply `sold`;
 *   * the balance is binary too. A boolean cannot express "1.400 ct of 5.000 ct left", so the
 *     populated fixtures' partial balances are not carried over: redeemed reads as `0`, everything
 *     else as the full original value. Keeping a partial figure here would let the scenario show a
 *     precision the granted column cannot deliver, which is the same class of untruth this dataset
 *     exists to catch — merely pointing the other way.
 *
 * `remainingCents` itself stays a **number**, not `null`: it is derivable from a granted column, so
 * it is available. What changes is only how much detail that derivation can honestly carry.
 */
function isRedeemedUpstream(voucher: Voucher): boolean {
  return voucher.remainingCents <= 0;
}

function statusWithoutExpiry(voucher: Voucher): VoucherStatus {
  if (voucher.status === 'open') return 'open';
  return isRedeemedUpstream(voucher) ? 'redeemed' : 'sold';
}

export const sourceAbsentVouchers: Voucher[] = fixtureVouchers.map((voucher) => ({
  ...voucher,
  status: statusWithoutExpiry(voucher),
  remainingCents: isRedeemedUpstream(voucher) ? 0 : voucher.originalValueCents,
  expiresAt: null,
  usages: null,
}));

/**
 * Members as the gateway can read them.
 *
 * `"SV Heinersreuth Mitglieder"` grants identity, membership type, status, `created_at` and the
 * free-text `"Eintritt"`. No address column exists, and member-to-booking association is `none`
 * until a stable key exists — so the booking figures are not zero, they are unknowable.
 */
export const sourceAbsentMembers: Member[] = fixtureMembers.map((member) => ({
  ...member,
  validUntil: null,
  city: null,
  postalCode: null,
  bookingCount: null,
  bookingRevenueCents: null,
}));

/**
 * Reconciliation over the source-absent payments.
 *
 * Deliberately run through the real classifier rather than hand-written, so the entries are whatever
 * the rules actually produce from incomplete input: no refund amount and no classification means no
 * row can be called `matched`, and every one carries a null refund amount.
 */
function invoiceStatusFor(bookingReference: string | null): ReconciliationEntry['invoiceStatus'] {
  if (!bookingReference) return null;
  return fixtureInvoices.find((invoice) => invoice.bookingReference === bookingReference)?.status ?? null;
}

export const sourceAbsentReconciliation: ReconciliationEntry[] = sourceAbsentPayments.map(
  (payment) => {
    const booking =
      payment.referenceType === 'booking' ? findBookingByReference(payment.referenceLabel) : null;
    return buildReconciliationEntry(payment, booking, invoiceStatusFor);
  },
);
