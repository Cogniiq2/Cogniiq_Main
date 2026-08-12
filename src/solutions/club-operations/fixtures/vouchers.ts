// Fictional gift vouchers.
//
// Codes are invented and follow a neutral GS-YYYY-NNNN scheme; no code from the reference system
// appears here. Each redemption points at a booking that actually paid by voucher in the booking
// fixtures, so the usage history and the ledger agree.
//
// Remaining balance and status are computed from the usage list rather than stated, so a voucher
// cannot claim a balance its own history contradicts.

import type { Voucher, VoucherStatus, VoucherUsage } from '../types';

interface VoucherSeed {
  code: string;
  originalValueCents: number;
  issuedAt: string;
  soldAt: string | null;
  expiresAt: string;
  buyerName: string | null;
  usages: VoucherUsage[];
}

/** The date the fixture set is "current" as of. Fixed, so status never drifts with the real clock. */
export const FIXTURE_TODAY = '2026-03-31';

function statusFor(seed: VoucherSeed, remainingCents: number): VoucherStatus {
  if (seed.soldAt === null) return 'open';
  if (remainingCents <= 0) return 'redeemed';
  if (seed.expiresAt < FIXTURE_TODAY) return 'expired';
  return seed.usages.length > 0 ? 'partially_redeemed' : 'sold';
}

const voucherSeeds: VoucherSeed[] = [
  {
    code: 'GS-2026-0001',
    originalValueCents: 5000,
    issuedAt: '2026-01-18',
    soldAt: '2026-01-18',
    expiresAt: '2028-01-18',
    buyerName: 'Friedhelm Ottensmeyer',
    usages: [
      { id: 'vu-0001', redeemedAt: '2026-03-05T18:30:00+01:00', amountCents: 3600, bookingReference: 'BU-2049' },
    ],
  },
  {
    code: 'GS-2026-0002',
    originalValueCents: 10000,
    issuedAt: '2026-02-02',
    soldAt: '2026-02-02',
    expiresAt: '2028-02-02',
    buyerName: 'Anneliese Kupferschmid',
    usages: [
      { id: 'vu-0002', redeemedAt: '2026-02-11T18:30:00+01:00', amountCents: 3600, bookingReference: 'BU-2107' },
      { id: 'vu-0003', redeemedAt: '2026-03-20T19:00:00+01:00', amountCents: 3600, bookingReference: 'BU-2123' },
    ],
  },
  {
    code: 'GS-2026-0003',
    originalValueCents: 2000,
    issuedAt: '2026-02-20',
    soldAt: '2026-02-20',
    expiresAt: '2028-02-20',
    buyerName: 'Burkhard Steinmetz',
    usages: [
      { id: 'vu-0004', redeemedAt: '2026-03-11T09:30:00+01:00', amountCents: 2000, bookingReference: 'BU-2117' },
    ],
  },
  {
    // The purchase payment failed, so the voucher was never sold and carries its full value.
    code: 'GS-2026-0004',
    originalValueCents: 5000,
    issuedAt: '2026-03-04',
    soldAt: null,
    expiresAt: '2028-03-04',
    buyerName: null,
    usages: [],
  },
  {
    code: 'GS-2025-0087',
    originalValueCents: 2500,
    issuedAt: '2025-06-12',
    soldAt: '2025-06-12',
    expiresAt: '2025-12-31',
    buyerName: 'Gundula Merzbacher',
    usages: [],
  },
  {
    code: 'GS-2026-0006',
    originalValueCents: 4000,
    issuedAt: '2026-03-06',
    soldAt: '2026-03-06',
    expiresAt: '2028-03-06',
    buyerName: 'Hannelore Zwickelsberger',
    usages: [],
  },
];

export const fixtureVouchers: Voucher[] = voucherSeeds.map((seed, index) => {
  const redeemed = seed.usages.reduce((sum, usage) => sum + usage.amountCents, 0);
  const remainingCents = Math.max(0, seed.originalValueCents - redeemed);
  return {
    id: `vou-${String(index + 1).padStart(4, '0')}`,
    code: seed.code,
    originalValueCents: seed.originalValueCents,
    remainingCents,
    status: statusFor(seed, remainingCents),
    issuedAt: seed.issuedAt,
    soldAt: seed.soldAt,
    expiresAt: seed.expiresAt,
    buyerName: seed.buyerName,
    usages: seed.usages,
  };
});
