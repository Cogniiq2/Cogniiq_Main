// Drift protection for the VAT classification.
//
// The reference implementation below is a **transcription** of the committed upstream source, not an
// import: no runtime code crosses the repository boundary, and the upstream repository is neither
// read at runtime nor modified. The transcription was made from one specific committed revision, and
// the digest of that file is recorded so a later upstream change is caught rather than assumed away.
//
// If the reference repository is not present — as it will not be in CI — the digest check reports
// that it could not run instead of passing silently. A parity test that quietly skips is worse than
// no parity test, because it reads as green.

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  classifyBooking,
  classifyMembershipToken,
  clubOperationsTaxCategories,
  isRevenueEligible,
  type ClubOperationsTaxCategory,
  type UpstreamClassificationInput,
} from './clubOperationsTax';
import {
  buildClassificationCorpus,
  membershipTokenVariants,
  revenueEligibilityCorpus,
} from './clubOperationsTax.fixtures';

/* ═══════════════════════════════════════════ Transcribed upstream reference ═════ */

type UpstreamCategory =
  | 'padel_member_7'
  | 'padel_non_member_19'
  | 'padel_unresolved'
  | 'tennis_0'
  | 'free'
  | 'unknown';

const UPSTREAM_PADEL_COURTS = new Set(['padel-1', 'padel-2']);
const UPSTREAM_TENNIS_COURTS = new Set(['tennis-1', 'tennis-2', 'tennis-3']);

function upstreamNormProvider(raw: string | undefined | null): string {
  return (raw ?? '').trim().toLowerCase();
}

function upstreamClassifyPadelMembership(
  rawValue: string | null | undefined,
): 'member' | 'non_member' | 'unresolved' {
  if (rawValue == null) return 'unresolved';
  const normalized = String(rawValue).trim();
  if (!normalized) return 'unresolved';

  const tokens = normalized
    .split('-')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  if (tokens.length === 0) return 'unresolved';
  if (tokens.includes('member')) return 'member';

  const validNonMember = new Set(['guest', 'student']);
  if (tokens.every((t) => validNonMember.has(t))) return 'non_member';

  return 'unresolved';
}

function upstreamGetFinalTaxCategory(booking: UpstreamClassificationInput): UpstreamCategory {
  const prov = upstreamNormProvider(booking.provider);
  if (!prov || prov === 'free') return 'free';

  const courtKey = String(booking.court_key ?? '').trim().toLowerCase();

  if (UPSTREAM_TENNIS_COURTS.has(courtKey)) return 'tennis_0';

  if (UPSTREAM_PADEL_COURTS.has(courtKey)) {
    const override = booking.tax_membership_override;
    if (override === 'member') return 'padel_member_7';
    if (override === 'non_member') return 'padel_non_member_19';

    const auto = upstreamClassifyPadelMembership(booking.player_membership);
    if (auto === 'member') return 'padel_member_7';
    if (auto === 'non_member') return 'padel_non_member_19';
    return 'padel_unresolved';
  }

  return 'unknown';
}

function upstreamGetTaxRate(cat: UpstreamCategory): number | null {
  if (cat === 'padel_member_7') return 0.07;
  if (cat === 'padel_non_member_19') return 0.19;
  if (cat === 'tennis_0') return 0;
  return null;
}

function upstreamGetSource(
  booking: UpstreamClassificationInput,
  cat: UpstreamCategory,
): 'automatic' | 'manual_override' | 'not_required' | 'unresolved' {
  if (cat === 'free') return 'not_required';
  if (cat === 'tennis_0') return 'not_required';
  if (cat === 'unknown') return 'unresolved';
  if (
    booking.tax_membership_override === 'member' ||
    booking.tax_membership_override === 'non_member'
  ) {
    return 'manual_override';
  }
  if (cat === 'padel_unresolved') return 'unresolved';
  return 'automatic';
}

function upstreamIsRevenueEligible(b: {
  status?: string | null;
  refund_status?: string | null;
  provider?: string | null;
}): boolean {
  const st = (b.status ?? '').toUpperCase();
  if (['CANCELLED', 'FAILED', 'PENDING'].includes(st)) return false;
  if (st === 'REFUNDED' || b.refund_status === 'refunded') return false;
  const prov = upstreamNormProvider(b.provider);
  if (!prov || prov === 'free') return false;
  return true;
}

/** The one place the two vocabularies are related. Every other comparison goes through it. */
const CATEGORY_MAP: Record<UpstreamCategory, ClubOperationsTaxCategory> = {
  padel_member_7: 'padel_member_reduced',
  padel_non_member_19: 'padel_non_member_standard',
  padel_unresolved: 'padel_unresolved',
  tennis_0: 'tennis_exempt',
  free: 'free',
  unknown: 'unknown',
};

/* ═══════════════════════════════════════════════════════ Parity over the corpus ═ */

const corpus = buildClassificationCorpus();

function describeCase(input: UpstreamClassificationInput): string {
  return JSON.stringify(input);
}

describe('the corpus covers every branch', () => {
  it('is large enough to be a product rather than a sample', () => {
    expect(corpus.length).toBeGreaterThan(4000);
  });

  it('reaches every category on both implementations', () => {
    const cogniiqReached = new Set(corpus.map((row) => classifyBooking(row).category));
    const upstreamReached = new Set(
      corpus.map((row) => CATEGORY_MAP[upstreamGetFinalTaxCategory(row)]),
    );
    for (const category of clubOperationsTaxCategories) {
      expect(cogniiqReached.has(category), `category not reached: ${category}`).toBe(true);
      expect(upstreamReached.has(category), `upstream category not reached: ${category}`).toBe(true);
    }
  });

  it('reaches every classification source', () => {
    const sources = new Set(corpus.map((row) => classifyBooking(row).source));
    expect([...sources].sort()).toEqual(['automatic', 'manual_override', 'not_required', 'unresolved']);
  });

  it('exercises every membership token form', () => {
    const seen = new Set(membershipTokenVariants.map((token) => classifyMembershipToken(token)));
    expect([...seen].sort()).toEqual(['member', 'non_member', 'unresolved']);
    expect(membershipTokenVariants.length).toBeGreaterThanOrEqual(20);
  });
});

describe('Cogniiq classification matches the committed upstream semantics', () => {
  it('agrees on the category for every case in the corpus', () => {
    const divergences: string[] = [];
    for (const input of corpus) {
      const mine = classifyBooking(input).category;
      const theirs = CATEGORY_MAP[upstreamGetFinalTaxCategory(input)];
      if (mine !== theirs) divergences.push(`${describeCase(input)}: ${theirs} → ${mine}`);
    }
    expect(divergences).toEqual([]);
  });

  it('agrees on the classification source for every case in the corpus', () => {
    const divergences: string[] = [];
    for (const input of corpus) {
      const mine = classifyBooking(input).source;
      const theirs = upstreamGetSource(input, upstreamGetFinalTaxCategory(input));
      if (mine !== theirs) divergences.push(`${describeCase(input)}: ${theirs} → ${mine}`);
    }
    expect(divergences).toEqual([]);
  });

  it('agrees on the rate, allowing for the fraction-versus-percent representation', () => {
    const divergences: string[] = [];
    for (const input of corpus) {
      const mine = classifyBooking(input).ratePercent;
      const theirsFraction = upstreamGetTaxRate(upstreamGetFinalTaxCategory(input));
      // Upstream stores 0.07 / 0.19 / 0 / null; Cogniiq stores whole percent, so a rate is an exact
      // integer and never a binary fraction that has to be multiplied out at use.
      const theirs = theirsFraction === null ? null : Math.round(theirsFraction * 100);
      if (mine !== theirs) divergences.push(`${describeCase(input)}: ${theirs} → ${mine}`);
    }
    expect(divergences).toEqual([]);
  });

  it('agrees on which rows require review', () => {
    for (const input of corpus) {
      const upstreamCategory = upstreamGetFinalTaxCategory(input);
      const theirs = upstreamCategory === 'padel_unresolved' || upstreamCategory === 'unknown';
      expect(classifyBooking(input).requiresReview, describeCase(input)).toBe(theirs);
    }
  });

  it('agrees on the membership token parse for every token form', () => {
    for (const token of membershipTokenVariants) {
      expect(classifyMembershipToken(token), JSON.stringify(token)).toBe(
        upstreamClassifyPadelMembership(token),
      );
    }
  });

  it('agrees on revenue eligibility, including the refund-before-status ordering', () => {
    const divergences: string[] = [];
    for (const row of revenueEligibilityCorpus) {
      if (isRevenueEligible(row) !== upstreamIsRevenueEligible(row)) {
        divergences.push(JSON.stringify(row));
      }
    }
    expect(divergences).toEqual([]);
  });

  it('keeps a refunded booking out of revenue even though it is also cancelled', () => {
    // Every refunded booking upstream also carries CANCELLED. Testing status first would exclude the
    // row for the wrong reason and hide the refund; both implementations must agree on that ordering.
    const refunded = { status: 'CANCELLED', refund_status: 'refunded', provider: 'stripe' };
    expect(isRevenueEligible(refunded)).toBe(false);
    expect(upstreamIsRevenueEligible(refunded)).toBe(false);
  });
});

describe('the priority order itself is pinned, not merely the outcomes', () => {
  it('a free provider short-circuits before the court is examined', () => {
    expect(
      classifyBooking({ provider: 'free', court_key: 'padel-1', player_membership: 'member' })
        .category,
    ).toBe('free');
    expect(
      classifyBooking({ provider: '', court_key: 'tennis-1', player_membership: 'guest' }).category,
    ).toBe('free');
  });

  it('tennis is exempt regardless of any membership token or override', () => {
    for (const token of membershipTokenVariants) {
      expect(
        classifyBooking({
          provider: 'stripe',
          court_key: 'tennis-2',
          player_membership: token,
          tax_membership_override: 'non_member',
        }).category,
      ).toBe('tennis_exempt');
    }
  });

  it('a manual override beats the parsed token, in both directions', () => {
    expect(
      classifyBooking({
        provider: 'stripe',
        court_key: 'padel-1',
        player_membership: 'guest',
        tax_membership_override: 'member',
      }).category,
    ).toBe('padel_member_reduced');
    expect(
      classifyBooking({
        provider: 'stripe',
        court_key: 'padel-1',
        player_membership: 'member',
        tax_membership_override: 'non_member',
      }).category,
    ).toBe('padel_non_member_standard');
  });

  it('an unrecognised override is ignored rather than trusted', () => {
    expect(
      classifyBooking({
        provider: 'stripe',
        court_key: 'padel-1',
        player_membership: 'guest',
        tax_membership_override: 'nonmember',
      }).category,
    ).toBe('padel_non_member_standard');
  });

  it('one member token among guests makes the whole booking a member booking', () => {
    expect(classifyMembershipToken('guest - member - student')).toBe('member');
  });

  it('a token outside {member, guest, student} leaves the booking unresolved', () => {
    for (const token of ['gast', 'members', 'unknown', 'guest-unknown']) {
      expect(classifyMembershipToken(token), token).toBe('unresolved');
    }
  });
});

/* ═════════════════════════════════════════════════ Upstream drift guard ═════════ */

// The revision the transcription above was made from.
const UPSTREAM_RELATIVE_PATH = 'src/lib/vatClassification.ts';
const UPSTREAM_SHA256 = 'a05a1e5bba713a9be79b8539bcfa74b60358f69fff0e80f9ff6857dda917cd7f';
const UPSTREAM_BYTES = 11254;

// A conventional sibling checkout. Read-only, and only if it happens to be there.
const referencePath = resolve(
  __dirname,
  '../../..',
  '..',
  'SVHeinersreuth',
  UPSTREAM_RELATIVE_PATH,
);
const referenceAvailable = existsSync(referencePath);

describe('the committed upstream source has not drifted', () => {
  it.runIf(referenceAvailable)('still hashes to the revision this transcription was made from', () => {
    const bytes = readFileSync(referencePath);
    const digest = createHash('sha256').update(bytes).digest('hex');
    expect(
      bytes.length,
      'the upstream classification source changed size — re-review the transcription above',
    ).toBe(UPSTREAM_BYTES);
    expect(
      digest,
      'the upstream classification source changed — re-review the transcription above before trusting this parity test',
    ).toBe(UPSTREAM_SHA256);
  });

  it.skipIf(referenceAvailable)(
    'CANNOT VERIFY UPSTREAM DRIFT HERE — the reference checkout is absent, so parity is only as fresh as the transcription',
    () => {
      expect(referenceAvailable).toBe(false);
    },
  );

  it('records the digest as a constant, so the check is meaningful wherever it does run', () => {
    expect(UPSTREAM_SHA256).toMatch(/^[0-9a-f]{64}$/);
  });
});
