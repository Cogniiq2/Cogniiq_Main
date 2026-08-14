// The source-absent field contract (Phase D3b step 0, owner decision 4).
//
// Some fields of the domain model have no authorised upstream column. The gateway role's grant is
// column-scoped and deliberately narrow, so those values are simply not knowable and must arrive as
// an explicit `null`. This file pins that contract from both ends:
//
//   * `null` is accepted wherever a field is genuinely source-absent, and nowhere else;
//   * `undefined` and a missing property are still rejected, so "no source exists" stays
//     distinguishable from "the producer forgot the field";
//   * the wrong type is still rejected, nullability having widened nothing else;
//   * no substitute — `''`, `0`, `[]` — is ever produced in place of an absent value.
//
// Payloads are taken from the fixture adapter and put through a JSON round trip, then mutated. That
// way each case starts from something known to be valid, and the only difference under test is the
// one field the case is about.

import { describe, expect, it } from 'vitest';

import { buildRefunds } from '../aggregation';
import { buildReconciliationEntry, classifyReconciliation } from '../reconciliation';
import { filterPayments } from '../filtering';
import { reconciliationCounts } from '../fixtures/reconciliation';
import {
  emptyMemberQuery,
  emptyPaymentQuery,
  emptyReconciliationQuery,
  emptyVoucherQuery,
  type Booking,
  type Payment,
} from '../types';
import { createFixtureAdapter } from './fixtureAdapter';
import {
  MalformedResponseError,
  validateBookingPage,
  validateInvoicePage,
  validateMemberPage,
  validateMonthlyReportComparison,
  validatePaymentPage,
  validateReconciliationPage,
  validateReportSnapshot,
  validateVoucherPage,
} from './responseValidation';

const fixtures = createFixtureAdapter();

function overTheWire<T>(value: T): unknown {
  return JSON.parse(JSON.stringify(value));
}

type Json = Record<string, unknown>;

/** A deep clone of a known-valid payload, ready to be mutated by one case. */
async function payload(build: () => Promise<unknown>): Promise<Json> {
  return overTheWire(await build()) as Json;
}

/* ------------------------------------------------------------------ The audit */

/**
 * Every field this correction made nullable, with the validator that reads it and a path to it.
 *
 * The table is the point: it is the audited list, and each row is exercised four ways below. A field
 * added to the domain model without an authorised source has to be added here too, or its case
 * simply will not exist.
 */
interface NullableCase {
  label: string;
  /** A non-null value of the field's own type, to prove nullability widened nothing. */
  validValue: unknown;
  /** A value of the wrong type, which must still be rejected. */
  wrongValue: unknown;
  build: () => Promise<Json>;
  /** Walks to the object holding the field. */
  locate: (root: Json) => Json;
  key: string;
  validate: (value: unknown) => unknown;
}

const paymentPage = () => payload(() => fixtures.listPayments(emptyPaymentQuery));
const voucherPage = () => payload(() => fixtures.listVouchers(emptyVoucherQuery));
const memberPage = () => payload(() => fixtures.listMembers(emptyMemberQuery));
const reconciliationPage = () => payload(() => fixtures.listReconciliation(emptyReconciliationQuery));
const reportSnapshot = () => payload(() => fixtures.getReport({ range: 'month' }));

const firstOf = (key: string) => (root: Json) => (root[key] as Json[])[0];
const totals = (root: Json) => root.totals as Json;

const cases: NullableCase[] = [
  // ── Payment: no name column, and the classification lives in the excluded metadata jsonb ──
  {
    label: 'Payment.customerName',
    validValue: 'Adelheid Rosenkranz',
    wrongValue: 42,
    build: paymentPage,
    locate: firstOf('payments'),
    key: 'customerName',
    validate: validatePaymentPage,
  },
  {
    label: 'Payment.note',
    validValue: 'Kunde hat fristgerecht storniert.',
    wrongValue: 7,
    build: paymentPage,
    locate: firstOf('payments'),
    key: 'note',
    validate: validatePaymentPage,
  },
  {
    label: 'Payment.metaClass',
    validValue: 'double_booking',
    wrongValue: 'not_a_meta_class',
    build: paymentPage,
    locate: firstOf('payments'),
    key: 'metaClass',
    validate: validatePaymentPage,
  },
  {
    label: 'Payment.refundedCents',
    validValue: 3600,
    wrongValue: 36.5,
    build: paymentPage,
    locate: firstOf('payments'),
    key: 'refundedCents',
    validate: validatePaymentPage,
  },
  {
    label: 'PaymentTotals.refundedCents',
    validValue: 7200,
    wrongValue: '7200',
    build: paymentPage,
    locate: totals,
    key: 'refundedCents',
    validate: validatePaymentPage,
  },
  {
    label: 'PaymentTotals.netCents',
    validValue: 50000,
    wrongValue: 500.5,
    build: paymentPage,
    locate: totals,
    key: 'netCents',
    validate: validatePaymentPage,
  },
  {
    label: 'PaymentTotals.refundedCount',
    validValue: 2,
    wrongValue: '2',
    build: paymentPage,
    locate: totals,
    key: 'refundedCount',
    validate: validatePaymentPage,
  },
  {
    label: 'PaymentTotals.doubleBookingCount',
    validValue: 3,
    wrongValue: '3',
    build: paymentPage,
    locate: totals,
    key: 'doubleBookingCount',
    validate: validatePaymentPage,
  },
  {
    label: 'PaymentTotals.customerCancelledCount',
    validValue: 2,
    wrongValue: 1.5,
    build: paymentPage,
    locate: totals,
    key: 'customerCancelledCount',
    validate: validatePaymentPage,
  },

  // ── Voucher: expiry and redemption history are not tracked upstream ──
  {
    label: 'Voucher.expiresAt',
    validValue: '2028-01-18',
    wrongValue: 20280118,
    build: voucherPage,
    locate: firstOf('vouchers'),
    key: 'expiresAt',
    validate: validateVoucherPage,
  },
  {
    label: 'Voucher.usages',
    validValue: [],
    wrongValue: 'none',
    build: voucherPage,
    locate: firstOf('vouchers'),
    key: 'usages',
    validate: validateVoucherPage,
  },
  {
    label: 'VoucherTotals.expiredCount',
    validValue: 1,
    // The string "null" is not null: a producer that stringifies its absent values must still fail.
    wrongValue: 'null',
    build: voucherPage,
    locate: totals,
    key: 'expiredCount',
    validate: validateVoucherPage,
  },

  // ── Member: no address columns, and no member-to-booking association ──
  {
    label: 'Member.city',
    validValue: 'Heinersreuth',
    wrongValue: 0,
    build: memberPage,
    locate: firstOf('members'),
    key: 'city',
    validate: validateMemberPage,
  },
  {
    label: 'Member.postalCode',
    validValue: '95500',
    wrongValue: 95500,
    build: memberPage,
    locate: firstOf('members'),
    key: 'postalCode',
    validate: validateMemberPage,
  },
  {
    label: 'Member.validUntil',
    validValue: '2026-12-31',
    wrongValue: false,
    build: memberPage,
    locate: firstOf('members'),
    key: 'validUntil',
    validate: validateMemberPage,
  },
  {
    label: 'Member.bookingCount',
    validValue: 4,
    wrongValue: '4',
    build: memberPage,
    locate: firstOf('members'),
    key: 'bookingCount',
    validate: validateMemberPage,
  },
  {
    label: 'Member.bookingRevenueCents',
    validValue: 14400,
    wrongValue: 144.5,
    build: memberPage,
    locate: firstOf('members'),
    key: 'bookingRevenueCents',
    validate: validateMemberPage,
  },

  // ── Reconciliation: the orphaned payment has no booking, hence no authorised name ──
  {
    label: 'ReconciliationEntry.customerName',
    validValue: 'Ottilie Sandbichler',
    wrongValue: {},
    build: reconciliationPage,
    locate: firstOf('entries'),
    key: 'customerName',
    validate: validateReconciliationPage,
  },
  {
    label: 'ReconciliationEntry.refundAmountCents',
    validValue: 3600,
    wrongValue: '3600',
    build: reconciliationPage,
    locate: firstOf('entries'),
    key: 'refundAmountCents',
    validate: validateReconciliationPage,
  },
  {
    label: 'ReconciliationCounts.refundedTotalCents',
    validValue: 12000,
    wrongValue: 120.5,
    build: reconciliationPage,
    locate: (root) => root.counts as Json,
    key: 'refundedTotalCents',
    validate: validateReconciliationPage,
  },
  {
    label: 'ReconciliationCounts.cancellationRefundsCents',
    validValue: 3600,
    wrongValue: '3600',
    build: reconciliationPage,
    locate: (root) => root.counts as Json,
    key: 'cancellationRefundsCents',
    validate: validateReconciliationPage,
  },
  {
    label: 'ReconciliationCounts.doubleBookingRefundsCents',
    validValue: 4800,
    wrongValue: [],
    build: reconciliationPage,
    locate: (root) => root.counts as Json,
    key: 'doubleBookingRefundsCents',
    validate: validateReconciliationPage,
  },

  // ── Report: the live refund figures need per-payment amounts and the excluded metaClass ──
  {
    label: 'RefundBreakdown.totalCents',
    validValue: 8400,
    wrongValue: '8400',
    build: reportSnapshot,
    locate: (root) => root.refunds as Json,
    key: 'totalCents',
    validate: validateReportSnapshot,
  },
  {
    label: 'RefundBreakdown.cancellationCents',
    validValue: 3600,
    wrongValue: '3600',
    build: reportSnapshot,
    locate: (root) => root.refunds as Json,
    key: 'cancellationCents',
    validate: validateReportSnapshot,
  },
  {
    label: 'RefundBreakdown.doubleBookingCents',
    validValue: 4800,
    wrongValue: {},
    build: reportSnapshot,
    locate: (root) => root.refunds as Json,
    key: 'doubleBookingCents',
    validate: validateReportSnapshot,
  },
];

describe('the audited source-absent fields accept null', () => {
  it('covers every field the contract correction made nullable', () => {
    // Guards against a case being deleted and the suite still passing.
    expect(cases).toHaveLength(25);
    expect(new Set(cases.map((entry) => entry.label)).size).toBe(cases.length);
  });

  for (const testCase of cases) {
    describe(testCase.label, () => {
      it('accepts an explicit null and preserves it', async () => {
        const root = await testCase.build();
        testCase.locate(root)[testCase.key] = null;
        const result = testCase.validate(root) as Json;
        // The null must survive validation rather than being defaulted on the way through.
        expect(testCase.locate(result as Json)[testCase.key]).toBeNull();
      });

      it('still accepts a real value', async () => {
        const root = await testCase.build();
        testCase.locate(root)[testCase.key] = testCase.validValue;
        const result = testCase.validate(root) as Json;
        expect(testCase.locate(result as Json)[testCase.key]).toEqual(testCase.validValue);
      });

      it('rejects a missing property', async () => {
        const root = await testCase.build();
        delete testCase.locate(root)[testCase.key];
        expect(() => testCase.validate(root)).toThrow(MalformedResponseError);
      });

      it('rejects an explicit undefined', async () => {
        const root = await testCase.build();
        testCase.locate(root)[testCase.key] = undefined;
        expect(() => testCase.validate(root)).toThrow(MalformedResponseError);
      });

      it('rejects the wrong type', async () => {
        const root = await testCase.build();
        testCase.locate(root)[testCase.key] = testCase.wrongValue;
        expect(() => testCase.validate(root)).toThrow(MalformedResponseError);
      });
    });
  }
});

/* ------------------------------------------------- Nullability is not contagious */

describe('fields that do have an authorised source stay non-nullable', () => {
  // The other half of the audit. These fields map to real granted columns, so a null in one of them
  // is a malformed response rather than an absent source — and a correction that quietly widened
  // them too would have given away exactly the strictness it was supposed to be protecting.

  it('rejects null for Booking.customerName, which has bookings.customer_name', async () => {
    const root = await payload(() => fixtures.listBookings({}));
    (root.bookings as Json[])[0].customerName = null;
    expect(() => validateBookingPage(root)).toThrow(MalformedResponseError);
  });

  it('rejects null for Invoice.customerName, which has admin_stripe_invoices.customer_name', async () => {
    const root = await payload(() => fixtures.listInvoices({}));
    (root.invoices as Json[])[0].customerName = null;
    expect(() => validateInvoicePage(root)).toThrow(MalformedResponseError);
  });

  it('rejects null for the stored monthly refund columns', async () => {
    // The pointed contrast with `RefundBreakdown`: these three are persisted upstream as
    // `admin_monthly_reports.refunded_amount`, `.refunded_cancellation_amount` and
    // `.refunded_double_booking_amount`, all granted. A stored fact is available even when the live
    // derivation of the same quantity is not, which is why one is nullable and the other is not.
    for (const key of [
      'refundedCents',
      'refundedCancellationCents',
      'refundedDoubleBookingCents',
    ]) {
      const root = await payload(() => fixtures.getMonthlyReport({}));
      (root.report as Json)[key] = null;
      expect(() => validateMonthlyReportComparison(root), key).toThrow(MalformedResponseError);
    }
  });

  it('rejects null for ReconciliationEntry.moneyToRecoverCents, which needs no refund amount', async () => {
    const root = await payload(() => fixtures.listReconciliation(emptyReconciliationQuery));
    (root.entries as Json[])[0].moneyToRecoverCents = null;
    expect(() => validateReconciliationPage(root)).toThrow(MalformedResponseError);
  });

  it('rejects null for Payment.grossCents, which is payments.amount_eur', async () => {
    const root = await paymentPage();
    (root.payments as Json[])[0].grossCents = null;
    expect(() => validatePaymentPage(root)).toThrow(MalformedResponseError);
  });
});

/* ------------------------------------------------------- No synthetic substitutes */

describe('nothing is substituted for an absent value', () => {
  it('an absent voucher history stays null and never becomes an empty array', async () => {
    const root = await voucherPage();
    (root.vouchers as Json[])[0].usages = null;
    const page = validateVoucherPage(root);
    expect(page.vouchers[0].usages).toBeNull();
    expect(page.vouchers[0].usages).not.toEqual([]);
  });

  it('an unlinkable member stays null and never becomes zero', async () => {
    const root = await memberPage();
    const member = (root.members as Json[])[0];
    member.bookingCount = null;
    member.bookingRevenueCents = null;
    const page = validateMemberPage(root);
    expect(page.members[0].bookingCount).toBeNull();
    expect(page.members[0].bookingRevenueCents).toBeNull();
  });

  it('an unavailable name stays null and never becomes an empty string', async () => {
    const root = await paymentPage();
    (root.payments as Json[])[0].customerName = null;
    const page = validatePaymentPage(root);
    expect(page.payments[0].customerName).toBeNull();
    expect(page.payments[0].customerName).not.toBe('');
  });

  it('an unavailable refund amount stays null and never becomes zero', async () => {
    // Zero is the substitution that would matter most here: it reads as "nothing was refunded",
    // which is a financial claim about money the club may or may not still hold.
    const root = await paymentPage();
    (root.payments as Json[])[0].refundedCents = null;
    const page = validatePaymentPage(root);
    expect(page.payments[0].refundedCents).toBeNull();
    expect(page.payments[0].refundedCents).not.toBe(0);
  });
});

/* ------------------------------------------- Scenario fidelity, not just nullability */

describe('the source-absent scenario carries no precision the grant cannot deliver', () => {
  it('holds only binary voucher balances, never a partial one', async () => {
    // `"Gutschein"` grants the boolean `is_redeemed` and no redemption history, so a balance can
    // only be "all of it" or "none of it". The populated fixtures deliberately contain partial
    // balances (a voucher with 1.400 ct left of 5.000 ct); carrying one into this scenario would
    // show a precision the granted column cannot support — the same untruth as a fabricated value,
    // pointing the other way.
    const { vouchers } = await payload(() =>
      createFixtureAdapter({ scenario: 'source-absent' }).listVouchers(emptyVoucherQuery),
    ).then((root) => root as unknown as { vouchers: Json[] });

    expect(vouchers.length).toBeGreaterThan(0);
    for (const voucher of vouchers) {
      const remaining = voucher.remainingCents as number;
      const original = voucher.originalValueCents as number;
      expect([0, original], `${String(voucher.code)} remainingCents`).toContain(remaining);
    }

    // The scenario is only meaningful if the populated set it derives from *does* hold a partial
    // balance to lose — otherwise this test would pass against an unchanged mapping.
    const populated = (await payload(() => fixtures.listVouchers(emptyVoucherQuery))) as unknown as {
      vouchers: Json[];
    };
    expect(
      populated.vouchers.some(
        (voucher) =>
          (voucher.remainingCents as number) > 0 &&
          (voucher.remainingCents as number) < (voucher.originalValueCents as number),
      ),
    ).toBe(true);
  });

  it('keeps a redeemed voucher at zero and an unredeemed one at full value', async () => {
    const { vouchers } = (await payload(() =>
      createFixtureAdapter({ scenario: 'source-absent' }).listVouchers(emptyVoucherQuery),
    )) as unknown as { vouchers: Json[] };

    for (const voucher of vouchers) {
      // `remainingCents` stays a number — it is derivable from a granted column, so it is available.
      expect(typeof voucher.remainingCents).toBe('number');
      const redeemed = voucher.status === 'redeemed';
      expect(voucher.remainingCents, String(voucher.code)).toBe(
        redeemed ? 0 : voucher.originalValueCents,
      );
    }
    // Neither status the binary signal cannot support may appear.
    expect(vouchers.map((voucher) => voucher.status)).not.toContain('partially_redeemed');
    expect(vouchers.map((voucher) => voucher.status)).not.toContain('expired');
  });
});

/* --------------------------------------------------------- Unknown-field behaviour */

describe('unknown response fields', () => {
  it('are dropped rather than rejected, which is the existing contract behaviour', async () => {
    // Recorded rather than changed. The validators are constructive: each one builds a new object
    // from the fields it names, so a field it does not name cannot reach a component whether or not
    // it was sent. Tightening this into a rejection is a protocol decision for the gateway phase —
    // D3b-A's response envelope is where exactness is enforced — not something this correction
    // changes on its own.
    const root = await paymentPage();
    (root.payments as Json[])[0].unexpectedField = 'ignored';
    root.anotherUnexpectedField = 'ignored';
    const page = validatePaymentPage(root);
    expect(page.payments[0]).not.toHaveProperty('unexpectedField');
    expect(page).not.toHaveProperty('anotherUnexpectedField');
  });
});

/* ------------------------------------------------------------ Behaviour under null */

describe('logic that reads a source-absent field', () => {
  const booking = (overrides: Partial<Booking> = {}): Booking => ({
    id: 'b1',
    reference: 'BU-1',
    court: 'padel-1',
    startsAt: '2026-03-01T18:00:00+01:00',
    endsAt: '2026-03-01T19:30:00+01:00',
    customerName: 'Adelheid Rosenkranz',
    status: 'confirmed',
    provider: 'stripe',
    paymentStatus: 'paid',
    amountCents: 3600,
    currency: 'EUR',
    membership: 'member',
    taxCategory: 'padel_member_reduced',
    taxRatePercent: 7,
    lightsRequested: true,
    ...overrides,
  });

  const payment = (overrides: Partial<Payment> = {}): Payment => ({
    id: 'p1',
    reference: 'ZA-1',
    occurredAt: '2026-03-01T18:00:00+01:00',
    provider: 'stripe',
    status: 'paid',
    grossCents: 3600,
    refundedCents: 0,
    currency: 'EUR',
    referenceType: 'booking',
    referenceLabel: 'BU-1',
    customerName: null,
    metaClass: null,
    note: null,
    ...overrides,
  });

  it('does not report a payment as reconciled when its class is unknown', () => {
    // Everything else about the row looks fine, so the old code would have called it `matched` —
    // a clean bill of health issued without the two checks that could have contradicted it.
    expect(classifyReconciliation(payment(), booking()).issue).toBe('needs_review');
  });

  it('still reports a genuinely reconciled payment as matched when the class is known', () => {
    expect(classifyReconciliation(payment({ metaClass: 'standard' }), booking()).issue).toBe(
      'matched',
    );
  });

  it('still detects the more serious issues without the class', () => {
    expect(classifyReconciliation(payment({ grossCents: 3300 }), booking()).issue).toBe(
      'amount_mismatch',
    );
    expect(classifyReconciliation(payment(), null).issue).toBe('paid_no_booking');
  });

  it('matches an unclassified payment only against the unfiltered facet', () => {
    const rows = [payment(), payment({ id: 'p2', metaClass: 'double_booking' })];
    expect(filterPayments(rows, emptyPaymentQuery)).toHaveLength(2);
    // An unknown class is not a "standard" one, and must not be returned when filtering for one.
    expect(filterPayments(rows, { ...emptyPaymentQuery, metaClass: 'standard' })).toHaveLength(0);
    expect(filterPayments(rows, { ...emptyPaymentQuery, metaClass: 'double_booking' })).toHaveLength(
      1,
    );
  });

  it('reports the refund split as unavailable rather than partial', () => {
    const refunds = buildRefunds([
      payment({ refundedCents: 500, metaClass: 'customer_cancelled' }),
      payment({ id: 'p2', refundedCents: 300, metaClass: null }),
    ]);
    expect(refunds.totalCents).toBe(800);
    expect(refunds.cancellationCents).toBeNull();
    expect(refunds.doubleBookingCents).toBeNull();
  });

  it('computes the refund split when every payment is classified', () => {
    const refunds = buildRefunds([
      payment({ refundedCents: 500, metaClass: 'customer_cancelled' }),
      payment({ id: 'p2', refundedCents: 300, metaClass: 'double_booking' }),
    ]);
    expect(refunds.cancellationCents).toBe(500);
    expect(refunds.doubleBookingCents).toBe(300);
  });

  it('reports every refund figure as unavailable when one amount is unknown', () => {
    // The missing addend could be any value, so the sum of the rest is a floor and not a total.
    // Reporting 500 here would understate the refunds by an unknown amount.
    const refunds = buildRefunds([
      payment({ refundedCents: 500, metaClass: 'customer_cancelled' }),
      payment({ id: 'p2', refundedCents: null, metaClass: 'customer_cancelled' }),
    ]);
    expect(refunds.totalCents).toBeNull();
    expect(refunds.cancellationCents).toBeNull();
    expect(refunds.doubleBookingCents).toBeNull();
  });

  it('never raises the active-booking-refunded finding on an unknown refund amount', () => {
    // `null > 0` is silence, not a refund. The amount must be *explicitly* null here: the helper's
    // default of 0 would test a known absence of a refund instead, which proves nothing about the
    // unknown case and would pass even without the null guard.
    const confirmed = booking();
    expect(
      classifyReconciliation(payment({ metaClass: 'standard', refundedCents: null }), confirmed)
        .issue,
    ).not.toBe('active_booking_refunded');

    // And with the amount known, the finding still fires — the guard narrowed nothing else.
    expect(
      classifyReconciliation(payment({ metaClass: 'standard', refundedCents: 3600 }), confirmed)
        .issue,
    ).toBe('active_booking_refunded');
  });

  it('routes a payment with an unknown refund amount to needs_review, not matched', () => {
    // The complementary half: not merely "not active_booking_refunded", but positively classified
    // as needing a human. A row that cannot be examined must not be reported as reconciled.
    expect(
      classifyReconciliation(payment({ metaClass: 'standard', refundedCents: null }), booking())
        .issue,
    ).toBe('needs_review');
  });

  it('propagates an unknown refund amount through the reconciliation roll-up', () => {
    const entries = [
      buildReconciliationEntry(payment({ refundedCents: 3600, metaClass: 'standard' }), booking(), () => null),
      buildReconciliationEntry(
        payment({ id: 'p2', refundedCents: null, metaClass: 'standard' }),
        booking(),
        () => null,
      ),
    ];
    const counts = reconciliationCounts(entries);

    // Every refund sum is unavailable ...
    expect(counts.refundedTotalCents).toBeNull();
    expect(counts.cancellationRefundsCents).toBeNull();
    expect(counts.doubleBookingRefundsCents).toBeNull();
    // ... while the figures that need no refund amount stay real. The first row is a refund against
    // a still-confirmed booking, so its recoverable amount is known exactly even though the totals
    // it would contribute to are not.
    expect(counts.totalPayments).toBe(2);
    expect(counts.moneyToRecoverCents).toBe(3600);
  });

  /* ---------------------------------------------------- The voucher shortcut */

  // Being a voucher purchase is not evidence of health. The shortcut that skips the booking checks
  // must still answer to the incomplete-data guard, or `matched` becomes reachable for a row whose
  // refund state nobody can see — which is how a clean bill of health gets issued without an exam.
  const voucherPayment = (overrides: Partial<Payment> = {}): Payment =>
    payment({
      id: 'v1',
      referenceType: 'voucher',
      referenceLabel: 'GS-2026-0001',
      metaClass: 'standard',
      refundedCents: 0,
      ...overrides,
    });

  it('sends a voucher payment with an unknown refund amount to needs_review', () => {
    expect(classifyReconciliation(voucherPayment({ refundedCents: null }), null).issue).toBe(
      'needs_review',
    );
  });

  it('sends a voucher payment with an unknown classification to needs_review', () => {
    expect(classifyReconciliation(voucherPayment({ metaClass: null }), null).issue).toBe(
      'needs_review',
    );
  });

  it('never calls an incomplete voucher payment matched, whichever input is missing', () => {
    for (const incomplete of [
      voucherPayment({ refundedCents: null }),
      voucherPayment({ metaClass: null }),
      voucherPayment({ refundedCents: null, metaClass: null }),
    ]) {
      const result = classifyReconciliation(incomplete, null);
      expect(result.issue).not.toBe('matched');
      // Zero here means nothing recoverable was identified, not that nothing is recoverable.
      expect(result.moneyToRecoverCents).toBe(0);
    }
  });

  it('still calls a fully known voucher payment matched', () => {
    // The guard narrowed the shortcut, it did not remove it: with both inputs present the existing
    // voucher branch is reached exactly as before.
    expect(classifyReconciliation(voucherPayment(), null).issue).toBe('matched');
    // And a failed voucher purchase still short-circuits ahead of the guard.
    expect(classifyReconciliation(voucherPayment({ status: 'failed' }), null).issue).toBe(
      'needs_review',
    );
  });

  it('keeps an incomplete voucher payment out of the matched count', () => {
    const entries = [
      buildReconciliationEntry(voucherPayment(), null, () => null),
      buildReconciliationEntry(
        voucherPayment({ id: 'v2', refundedCents: null }),
        null,
        () => null,
      ),
    ];
    const counts = reconciliationCounts(entries);
    expect(counts.totalPayments).toBe(2);
    // One knowable voucher purchase is reconciled; the unknowable one is not counted alongside it.
    expect(counts.matched).toBe(1);
    // The severity map is untouched: `needs_review` is `info`, so it does not inflate openReview.
    expect(counts.openReview).toBe(0);
  });

  it('computes the reconciliation roll-up when every refund amount is known', () => {
    // The booking is cancelled, so the refund does not read as money returned on a slot the club is
    // still holding — which is what `active_booking_refunded` means and what a confirmed booking
    // here would produce instead.
    const cancelled = booking({ status: 'cancelled' });
    const entries = [
      buildReconciliationEntry(payment({ refundedCents: 0, metaClass: 'standard' }), cancelled, () => null),
      buildReconciliationEntry(
        payment({ id: 'p2', refundedCents: 900, metaClass: 'customer_cancelled' }),
        cancelled,
        () => null,
      ),
    ];
    const counts = reconciliationCounts(entries);
    expect(counts.refundedTotalCents).toBe(900);
    expect(counts.cancellationRefundsCents).toBe(900);
  });
});
