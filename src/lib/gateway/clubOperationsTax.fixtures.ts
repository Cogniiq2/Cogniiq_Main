// Shared, wholly fictional classification corpus.
//
// Every value here is invented. No row is copied from, derived from or observed in any live system:
// the corpus is a cartesian product of the *shapes* the upstream fields can take, which is what makes
// it exhaustive over the branches rather than representative of anyone's data.
//
// Deliberately absent: names, e-mail addresses, telephone numbers, references, amounts. The
// classification reads four fields and the corpus carries exactly those four.

import type { UpstreamClassificationInput } from './clubOperationsTax';

/** Provider spellings, including the whitespace and casing variants upstream normalises away. */
export const providerVariants: Array<string | null | undefined> = [
  undefined,
  null,
  '',
  '   ',
  'free',
  'FREE',
  '  Free  ',
  'stripe',
  'stripe ', // upstream data carries a trailing-space provider; normalisation must absorb it
  'paypal',
  'gutschein',
  'unknown-provider',
];

/** Court keys, including casing, padding, an unmapped court, and absence. */
export const courtVariants: Array<string | null | undefined> = [
  'padel-1',
  'padel-2',
  'PADEL-1',
  '  padel-2  ',
  'tennis-1',
  'tennis-2',
  'tennis-3',
  'TENNIS-3',
  'squash-1',
  '',
  null,
  undefined,
];

/**
 * Every `player_membership` token form the committed upstream parser can encounter.
 *
 * The field is free text, so the corpus covers the separator spellings and the empty-token cases as
 * well as the meaningful tokens — those are exactly where a re-implementation is most likely to
 * diverge from the original.
 */
export const membershipTokenVariants: Array<string | null | undefined> = [
  undefined,
  null,
  '',
  '   ',
  'member',
  'MEMBER',
  '  member  ',
  'Member',
  'guest',
  'student',
  'guest-student',
  'student-guest',
  'guest-guest',
  'member-guest',
  'member - guest -  - ',
  'guest - member',
  'guest-unknown',
  'unknown',
  'gast',
  'members',
  'member-',
  '-member',
  '-',
  ' - - ',
  '---',
  'Member-Guest',
  'MEMBER - STUDENT',
  'guest - student - guest',
];

/** Override values, including the two meaningful ones and several that must be ignored. */
export const overrideVariants: Array<string | null | undefined> = [
  undefined,
  null,
  '',
  'member',
  'non_member',
  'MEMBER',
  'nonmember',
  'guest',
];

/**
 * The full cartesian product — every combination of the four inputs.
 *
 * Exhaustive rather than sampled: the whole point of a drift test is that it covers the branch a
 * future change would take, and a sample cannot promise that.
 */
export function buildClassificationCorpus(): UpstreamClassificationInput[] {
  const corpus: UpstreamClassificationInput[] = [];
  for (const provider of providerVariants) {
    for (const court_key of courtVariants) {
      for (const player_membership of membershipTokenVariants) {
        for (const tax_membership_override of overrideVariants) {
          corpus.push({ provider, court_key, player_membership, tax_membership_override });
        }
      }
    }
  }
  return corpus;
}

/** Revenue-eligibility inputs, kept separate because they read a different set of fields. */
export const revenueEligibilityCorpus: Array<{
  status?: string | null;
  refund_status?: string | null;
  provider?: string | null;
}> = (() => {
  const statuses = [
    undefined,
    null,
    '',
    'CONFIRMED',
    'confirmed',
    'PENDING',
    'pending',
    'CANCELLED',
    'cancelled',
    'FAILED',
    'REFUNDED',
    'refunded',
    'COMPLETED',
  ];
  const refundStatuses = [undefined, null, '', 'refunded', 'none', 'partial'];
  const providers = [undefined, null, '', 'free', 'FREE', 'stripe', 'paypal', 'gutschein'];

  const rows: Array<{
    status?: string | null;
    refund_status?: string | null;
    provider?: string | null;
  }> = [];
  for (const status of statuses) {
    for (const refund_status of refundStatuses) {
      for (const provider of providers) {
        rows.push({ status, refund_status, provider });
      }
    }
  }
  return rows;
})();
