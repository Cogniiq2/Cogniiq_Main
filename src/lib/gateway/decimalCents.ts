// Exact decimal-string → integer-cent conversion.
//
// The upstream club system stores money as PostgreSQL `numeric`, which arrives over the wire as a
// *decimal string*. It is parsed here as a string and converted with integer arithmetic only.
//
// `Math.round(parseFloat(v) * 100)` — the conversion the earlier design proposed — is wrong on real
// inputs, because the intermediate multiplication happens in binary floating point:
//
//     1.005    * 100 = 100.49999999999999  → 100  (should be 101)
//     0.015    * 100 =   1.4999999999999998 →   1  (should be 2)
//     1234.565 * 100 = 123456.49999999999  → 123456 (should be 123457)
//
// Nothing in this file passes a monetary value through `Number`, `parseFloat` or any floating-point
// operation. The only narrowing to `number` happens after an explicit bound check that keeps the
// result far inside `Number.MAX_SAFE_INTEGER`, so it is always exact.
//
// Malformed input raises a typed error and is NEVER coerced to zero. Silent coercion to zero is what
// the reference implementation does, and it understates totals with no signal that anything is wrong.

/** Why a value was rejected. Deliberately coarse — a reason is loggable, a value is not. */
export const malformedAmountReasons = [
  'not_a_string',
  'empty',
  'grammar',
  'out_of_range',
] as const;
export type MalformedAmountReason = (typeof malformedAmountReasons)[number];

/**
 * A rejected monetary value.
 *
 * The offending value is deliberately absent from the message. Amounts are financial data, and the
 * logging rules for this surface forbid an amount reaching a log line; an error message is the most
 * likely thing to be logged, so it must be safe by construction rather than by convention.
 */
export class MalformedAmountError extends Error {
  readonly reason: MalformedAmountReason;

  constructor(reason: MalformedAmountReason) {
    super(`malformed monetary value (${reason})`);
    this.name = 'MalformedAmountError';
    this.reason = reason;
  }
}

/**
 * The whole accepted language.
 *
 *   optional sign · 1–15 integer digits · optionally a point and 1–8 fraction digits
 *
 * Rejected by construction: `''`, `'.5'`, `'5.'`, `'1e5'`, `'NaN'`, `'Infinity'`, `'1,50'`, `'€5'`,
 * `'--1'`, `'1.2.3'`, thousands separators, >15 integer digits and >8 fraction digits. A `numeric`
 * carrying more than 8 fraction digits signals a schema surprise worth failing on rather than
 * rounding away.
 */
const AMOUNT_GRAMMAR = /^([+-]?)(\d{1,15})(?:\.(\d{1,8}))?$/;

/** ASCII whitespace only. A Unicode space is a malformed value, not something to trim away. */
const ASCII_TRIM = /^[ \t\n\r\f\v]+|[ \t\n\r\f\v]+$/g;

/**
 * Domain bound: ±1 000 000 000.00 EUR, i.e. ±100 000 000 000 cents.
 *
 * Far above any plausible club figure and ~90× below `Number.MAX_SAFE_INTEGER`, so every accepted
 * value survives the `BigInt → number` narrowing exactly.
 */
export const MAX_CENTS = 100_000_000_000n;

const CHAR_FIVE = '5'.charCodeAt(0);

/**
 * Decimal string → integer cents.
 *
 * Rounding is **half away from zero** on the magnitude: `0.005 → 1` and `-0.005 → -1`. Chosen over
 * half-up-toward-positive-infinity because a refund must be the exact negation of the charge it
 * reverses; the asymmetric rule breaks that identity by a cent.
 *
 * Only the third fraction digit can decide the rounding: a third digit < 5 leaves a remainder
 * strictly below half a cent, and a third digit ≥ 5 leaves one at or above it, whatever follows.
 */
export function toCents(value: unknown): number {
  return Number(toCentsBigInt(value));
}

/** As `toCents`, but without the final narrowing — for callers accumulating in `BigInt`. */
export function toCentsBigInt(value: unknown): bigint {
  if (typeof value !== 'string') throw new MalformedAmountError('not_a_string');

  const trimmed = value.replace(ASCII_TRIM, '');
  if (trimmed.length === 0) throw new MalformedAmountError('empty');

  const match = AMOUNT_GRAMMAR.exec(trimmed);
  if (!match) throw new MalformedAmountError('grammar');

  const [, sign, intDigits, fracDigits = ''] = match;
  const padded = fracDigits.padEnd(3, '0');

  let magnitude = BigInt(intDigits + padded.slice(0, 2));
  if (padded.charCodeAt(2) >= CHAR_FIVE) magnitude += 1n;

  const cents = sign === '-' ? -magnitude : magnitude;
  if (cents > MAX_CENTS || cents < -MAX_CENTS) throw new MalformedAmountError('out_of_range');
  return cents;
}

/**
 * Integer cents → the canonical decimal string with exactly two fraction digits.
 *
 * `toCents(centsToDecimalString(c)) === c` for every representable `c`; that round-trip is what makes
 * a stored figure re-derivable rather than merely re-renderable.
 */
export function centsToDecimalString(cents: number | bigint): string {
  const value = typeof cents === 'bigint' ? cents : BigInt(cents);
  const negative = value < 0n;
  const magnitude = negative ? -value : value;
  const whole = magnitude / 100n;
  const fraction = magnitude % 100n;
  return `${negative ? '-' : ''}${whole}.${fraction.toString().padStart(2, '0')}`;
}

/** Half-away-from-zero division of `numerator / denominator`, both exact integers. */
function divideHalfAwayFromZero(numerator: bigint, denominator: bigint): bigint {
  const negative = numerator < 0n;
  const magnitude = negative ? -numerator : numerator;
  const quotient = magnitude / denominator;
  const remainder = magnitude % denominator;
  const rounded = remainder * 2n >= denominator ? quotient + 1n : quotient;
  return negative ? -rounded : rounded;
}

export interface VatSplit {
  netCents: number;
  vatCents: number;
}

/**
 * Extract VAT from a gross amount at a whole-percent rate.
 *
 * `net = round_half_away_from_zero(gross × 100 / (100 + rate))`, and `vat = gross − net` by
 * definition. Computing VAT as the difference rather than independently is what makes
 * `net + vat === gross` hold on every single row, with no residual to explain away.
 */
export function splitVatFromGross(grossCents: number, ratePercent: number): VatSplit {
  if (!Number.isInteger(grossCents)) throw new MalformedAmountError('grammar');
  if (!Number.isInteger(ratePercent) || ratePercent < 0 || ratePercent > 100) {
    throw new MalformedAmountError('out_of_range');
  }
  const gross = BigInt(grossCents);
  const net = divideHalfAwayFromZero(gross * 100n, BigInt(100 + ratePercent));
  return { netCents: Number(net), vatCents: Number(gross - net) };
}

/** Exact sum of integer cents, bound-checked before narrowing. */
export function sumCents(values: readonly number[]): number {
  let total = 0n;
  for (const value of values) {
    if (!Number.isInteger(value)) throw new MalformedAmountError('grammar');
    total += BigInt(value);
  }
  if (total > MAX_CENTS || total < -MAX_CENTS) throw new MalformedAmountError('out_of_range');
  return Number(total);
}
