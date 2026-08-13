// Club Operations — VAT classification, computed once, server-side.
//
// The upstream club system computes this twice, by hand, in two files that carry a comment demanding
// they be kept identical. This is deliberately the *third* place the rules exist, and it is the last:
// the gateway imports this module rather than mirroring it, and `clubOperationsTax.parity.test.ts`
// fails if the committed upstream semantics move away from it.
//
// The rules themselves are upstream's, transcribed and re-expressed in Cogniiq vocabulary. Whether
// they are the *correct* tax positions is a question for the club's tax adviser, not for this file.
// Everything computed here is provisional until that sign-off exists — see the D1 §9.3 authority
// statement. Nothing produced from this module may be labelled a tax report or a VAT return input.
//
// This module lives outside the browser solution module because it is a server-side concern: the
// browser receives already-classified rows and never runs a classification of its own.

/** Cogniiq's category names. The upstream names (`padel_member_7`, …) never cross this boundary. */
export const clubOperationsTaxCategories = [
  'padel_member_reduced',
  'padel_non_member_standard',
  'padel_unresolved',
  'tennis_exempt',
  'free',
  'unknown',
] as const;
export type ClubOperationsTaxCategory = (typeof clubOperationsTaxCategories)[number];

export const clubOperationsMembershipClassifications = [
  'member',
  'non_member',
  'unresolved',
  'not_applicable',
] as const;
export type ClubOperationsMembershipClassification =
  (typeof clubOperationsMembershipClassifications)[number];

export const clubOperationsClassificationSources = [
  'automatic',
  'manual_override',
  'not_required',
  'unresolved',
] as const;
export type ClubOperationsClassificationSource =
  (typeof clubOperationsClassificationSources)[number];

/** Court keys, exactly as upstream partitions them. */
export const PADEL_COURT_KEYS: ReadonlySet<string> = new Set(['padel-1', 'padel-2']);
export const TENNIS_COURT_KEYS: ReadonlySet<string> = new Set(['tennis-1', 'tennis-2', 'tennis-3']);

/** Tokens that, alone, mean a non-member. Any other token leaves the booking unresolved. */
const NON_MEMBER_TOKENS: ReadonlySet<string> = new Set(['guest', 'student']);

/**
 * The upstream fields the classification reads — and the only ones it may read.
 *
 * Names are upstream's, because this is the projection boundary. Nothing beyond these four fields
 * participates: no customer name, no e-mail, no amount.
 */
export interface UpstreamClassificationInput {
  provider?: string | null;
  court_key?: string | null;
  player_membership?: string | null;
  tax_membership_override?: string | null;
}

export interface ClubOperationsTaxTreatment {
  category: ClubOperationsTaxCategory;
  /** Whole percent. 0 for exempt tennis; null where no rate applies at all. */
  ratePercent: number | null;
  membership: ClubOperationsMembershipClassification;
  source: ClubOperationsClassificationSource;
  /** True for the two buckets a human must resolve before any figure is filed. */
  requiresReview: boolean;
}

function normalizeProvider(raw: string | null | undefined): string {
  return (raw ?? '').trim().toLowerCase();
}

function normalizeCourtKey(raw: string | null | undefined): string {
  return String(raw ?? '').trim().toLowerCase();
}

/**
 * Parse the free-text `player_membership` field, e.g. `"member - guest -  - "`.
 *
 * Split on `-`, trim, lowercase, drop empties. Then:
 *   any token `member`            → member
 *   all tokens in {guest, student} → non_member
 *   anything else, or nothing at all → unresolved
 *
 * This field is self-declared free text with no join to the member register. It is the weakest link
 * in the whole VAT chain, and `unresolved` exists so that weakness is visible rather than guessed at.
 * No fuzzy matching is performed, deliberately.
 */
export function classifyMembershipToken(
  rawValue: string | null | undefined,
): 'member' | 'non_member' | 'unresolved' {
  if (rawValue == null) return 'unresolved';
  const normalized = String(rawValue).trim();
  if (!normalized) return 'unresolved';

  const tokens = normalized
    .split('-')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);

  if (tokens.length === 0) return 'unresolved';
  if (tokens.includes('member')) return 'member';
  if (tokens.every((token) => NON_MEMBER_TOKENS.has(token))) return 'non_member';
  return 'unresolved';
}

/**
 * Category resolution, in strict priority order:
 *
 *   1. an empty or `free` provider short-circuits **before** the court is examined, so a free padel
 *      booking never reaches membership logic;
 *   2. a tennis court is exempt and never raises a membership question;
 *   3. a padel court takes the manual override if present, then the parsed membership token;
 *   4. any other court key is unknown.
 */
export function classifyTaxCategory(
  booking: UpstreamClassificationInput,
): ClubOperationsTaxCategory {
  const provider = normalizeProvider(booking.provider);
  if (!provider || provider === 'free') return 'free';

  const courtKey = normalizeCourtKey(booking.court_key);
  if (TENNIS_COURT_KEYS.has(courtKey)) return 'tennis_exempt';

  if (PADEL_COURT_KEYS.has(courtKey)) {
    const override = booking.tax_membership_override;
    if (override === 'member') return 'padel_member_reduced';
    if (override === 'non_member') return 'padel_non_member_standard';

    const parsed = classifyMembershipToken(booking.player_membership);
    if (parsed === 'member') return 'padel_member_reduced';
    if (parsed === 'non_member') return 'padel_non_member_standard';
    return 'padel_unresolved';
  }

  return 'unknown';
}

export function taxRatePercentFor(category: ClubOperationsTaxCategory): number | null {
  if (category === 'padel_member_reduced') return 7;
  if (category === 'padel_non_member_standard') return 19;
  if (category === 'tennis_exempt') return 0;
  return null;
}

function membershipFor(
  category: ClubOperationsTaxCategory,
): ClubOperationsMembershipClassification {
  switch (category) {
    case 'padel_member_reduced':
      return 'member';
    case 'padel_non_member_standard':
      return 'non_member';
    case 'padel_unresolved':
      return 'unresolved';
    case 'tennis_exempt':
    case 'free':
      return 'not_applicable';
    case 'unknown':
      // An unrecognised court cannot support a membership statement either way. It is reported as
      // unresolved rather than not_applicable, because it needs a human exactly as much as a padel
      // booking with an unparseable token does.
      return 'unresolved';
  }
}

function sourceFor(
  booking: UpstreamClassificationInput,
  category: ClubOperationsTaxCategory,
): ClubOperationsClassificationSource {
  if (category === 'free') return 'not_required';
  if (category === 'tennis_exempt') return 'not_required';
  if (category === 'unknown') return 'unresolved';
  if (
    booking.tax_membership_override === 'member' ||
    booking.tax_membership_override === 'non_member'
  ) {
    return 'manual_override';
  }
  if (category === 'padel_unresolved') return 'unresolved';
  return 'automatic';
}

/** The full treatment for one booking. */
export function classifyBooking(
  booking: UpstreamClassificationInput,
): ClubOperationsTaxTreatment {
  const category = classifyTaxCategory(booking);
  return {
    category,
    ratePercent: taxRatePercentFor(category),
    membership: membershipFor(category),
    source: sourceFor(booking, category),
    requiresReview: category === 'padel_unresolved' || category === 'unknown',
  };
}

/**
 * Whether a booking contributes to revenue and VAT.
 *
 * `refund_status` is tested **before** `status`, because every refunded booking upstream also carries
 * `status = 'CANCELLED'`; testing them the other way round double-counts the exclusion and hides the
 * refund. The upstream code carries an explicit comment saying the same thing, and it is load-bearing.
 */
export function isRevenueEligible(booking: {
  status?: string | null;
  refund_status?: string | null;
  provider?: string | null;
}): boolean {
  const status = (booking.status ?? '').toUpperCase();
  if (status === 'REFUNDED' || booking.refund_status === 'refunded') return false;
  if (status === 'CANCELLED' || status === 'FAILED' || status === 'PENDING') return false;
  const provider = normalizeProvider(booking.provider);
  if (!provider || provider === 'free') return false;
  return true;
}
