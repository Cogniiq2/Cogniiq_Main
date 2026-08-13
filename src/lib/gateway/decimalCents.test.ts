// Vector table and property tests for the exact decimal→cents conversion.
//
// The four counterexamples that motivated replacing `Math.round(parseFloat(v) * 100)` are asserted
// against the naive expression as well as against the correct one, so the test records *why* the
// simple version is unusable rather than merely asserting the right answer.

import { describe, expect, it } from 'vitest';

import {
  centsToDecimalString,
  MalformedAmountError,
  MAX_CENTS,
  splitVatFromGross,
  sumCents,
  toCents,
  toCentsBigInt,
} from './decimalCents';

describe('accepted values convert exactly', () => {
  const vectors: Array<[string, number, string]> = [
    ['0', 0, 'bare zero'],
    ['0.00', 0, 'zero with cents'],
    ['0.0', 0, 'one fraction digit'],
    ['0.004', 0, 'third digit 4 rounds down'],
    ['0.005', 1, 'third digit 5 rounds up'],
    ['0.0049', 0, 'digits beyond the third cannot lift a 4'],
    ['0.0051', 1, 'digits beyond the third cannot drop a 5'],
    ['0.015', 2, 'naive float gives 1'],
    ['1.005', 101, 'naive float gives 100'],
    ['1234.565', 123457, 'naive float gives 123456'],
    ['1234.5649999', 123456, 'stays below the half cent'],
    ['-0.005', -1, 'half away from zero'],
    ['-0.015', -2, 'negative equivalent of 0.015'],
    ['-1.005', -101, 'negative equivalent of 1.005'],
    ['-1234.565', -123457, 'negative equivalent of 1234.565'],
    ['-12.50', -1250, 'ordinary negative'],
    ['+7.5', 750, 'leading plus accepted'],
    ['7.5', 750, 'single fraction digit padded'],
    ['999999999.99', 99999999999, 'within the bound'],
    ['1000000000.00', 100_000_000_000, 'exactly the maximum'],
    ['-1000000000.00', -100_000_000_000, 'exactly the minimum'],
    ['1000000000', 100_000_000_000, 'maximum without a fraction'],
    ['  12.34  ', 1234, 'ASCII whitespace is trimmed'],
    ['000000000000012.34', 1234, 'leading zeros within 15 digits'],
    ['-0', 0, 'negative zero normalises to zero'],
    ['-0.004', 0, 'negative below half a cent is zero, not minus zero'],
  ];

  for (const [input, expected, note] of vectors) {
    it(`${JSON.stringify(input)} → ${expected} (${note})`, () => {
      expect(toCents(input)).toBe(expected);
      expect(Object.is(toCents(input), -0)).toBe(false);
    });
  }

  // The D1 addendum listed `0.015`, `1.005` and `1234.565` as cases where the naive expression is
  // wrong. Measured here, only `1.005` (and its negation) actually misconverts: `0.015 * 100` and
  // `1234.565 * 100` happen to land on 1.5 and 123456.5 exactly in this runtime, and `Math.round`
  // then gives the right answer for the wrong reason. The correction is recorded rather than
  // smoothed over, and the naive result is pinned per input so a runtime change is caught instead of
  // quietly widening or narrowing the claim.
  it('records exactly where the naive float conversion diverges', () => {
    // `+ 0` collapses the negative zero `Math.round(-0.5)` returns — itself a symptom of the same
    // half-up-toward-positive-infinity rule that makes this expression unusable for refunds.
    const naive = (value: string) => Math.round(parseFloat(value) * 100) + 0;
    const table: Array<[string, number, number]> = [
      // input, correct cents, what the naive expression actually produces
      ['0.015', 2, 2],
      ['1234.565', 123457, 123457],
      ['1.005', 101, 100], // ← genuinely wrong
      ['-1.005', -101, -100], // ← genuinely wrong
      ['-0.005', -1, 0], // ← wrong: Math.round is half-up toward +∞, so it breaks sign symmetry
    ];

    for (const [input, correct, naiveResult] of table) {
      expect(toCents(input), input).toBe(correct);
      expect(naive(input), `naive(${input})`).toBe(naiveResult);
    }

    const divergent = table.filter(([, correct, naiveResult]) => correct !== naiveResult);
    expect(divergent.map(([input]) => input)).toEqual(['1.005', '-1.005', '-0.005']);
  });
});

describe('malformed values raise a typed error and never become zero', () => {
  const rejected: Array<[unknown, string]> = [
    ['', 'empty'],
    ['   ', 'whitespace only'],
    [null, 'null'],
    [undefined, 'undefined'],
    [12.34, 'a JavaScript number, which has already lost precision'],
    [1234n, 'a bigint'],
    [{}, 'an object'],
    [[], 'an array'],
    ['.5', 'no integer part'],
    ['5.', 'no fraction digits after the point'],
    ['1e5', 'exponent'],
    ['1E5', 'uppercase exponent'],
    ['NaN', 'NaN'],
    ['Infinity', 'Infinity'],
    ['-Infinity', 'negative Infinity'],
    ['1,50', 'comma decimal separator'],
    ['1.234,56', 'German thousands separator'],
    ['1,234.56', 'English thousands separator'],
    ['€5', 'currency symbol'],
    ['5 €', 'trailing currency symbol'],
    ['--1', 'double sign'],
    ['+-1', 'mixed sign'],
    ['1.2.3', 'two points'],
    ['1 234.56', 'inner space'],
    [' 12.34', 'a non-breaking space is not ASCII whitespace'],
    ['​12.34', 'a zero-width space is not ASCII whitespace'],
    ['0.123456789', 'more than 8 fraction digits'],
    ['1234567890123456', 'more than 15 integer digits'],
    ['12345678901234567.89', 'far more than 15 integer digits'],
    ['0x10', 'hex'],
    ['1_000.00', 'numeric separator'],
  ];

  for (const [input, note] of rejected) {
    it(`rejects ${JSON.stringify(String(input))} (${note})`, () => {
      expect(() => toCents(input)).toThrow(MalformedAmountError);
    });
  }

  it('the error carries a reason but never the offending value', () => {
    for (const input of ['1,50', '€1234.56', '999999999999.99']) {
      let caught: unknown;
      try {
        toCents(input);
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(MalformedAmountError);
      const message = (caught as MalformedAmountError).message;
      expect(message).not.toContain('1234');
      expect(message).not.toContain('999999999999');
      expect(message).not.toContain('1,50');
    }
  });
});

describe('the overflow bound is enforced before narrowing to number', () => {
  const outOfRange = [
    '1000000000.01',
    '1000000000.005',
    '-1000000000.01',
    '-1000000000.005',
    '999999999999.99',
  ];

  for (const input of outOfRange) {
    it(`rejects ${input}`, () => {
      expect(() => toCents(input)).toThrow(MalformedAmountError);
      try {
        toCents(input);
      } catch (error) {
        expect((error as MalformedAmountError).reason).toBe('out_of_range');
      }
    });
  }

  it('every accepted value is exactly representable as a JavaScript number', () => {
    for (const bound of [MAX_CENTS, -MAX_CENTS]) {
      expect(BigInt(Number(bound))).toBe(bound);
      expect(Number(bound)).toBeLessThan(Number.MAX_SAFE_INTEGER);
    }
  });

  it('rounding up at the bound is rejected rather than silently clamped', () => {
    expect(toCentsBigInt('1000000000.004')).toBe(MAX_CENTS);
    expect(() => toCentsBigInt('1000000000.005')).toThrow(MalformedAmountError);
  });
});

/* --------------------------------------------------------------- Property tests */

// A seeded generator rather than a property-testing dependency: the existing stack has none, and
// adding one for two properties would be a dependency bought for very little. Determinism matters
// more than shrinking here — a failure reproduces from the printed seed.
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomAcceptedMagnitude(random: () => number): string {
  // At most 9 integer digits, so every generated value stays inside the ±1e9 EUR domain bound and a
  // property failure means a real defect rather than a generator that wandered out of range.
  const intLength = 1 + Math.floor(random() * 9);
  let intDigits = '';
  for (let i = 0; i < intLength; i += 1) intDigits += Math.floor(random() * 10).toString();
  if (random() < 0.3) return intDigits;
  const fracLength = 1 + Math.floor(random() * 8);
  let fracDigits = '';
  for (let i = 0; i < fracLength; i += 1) fracDigits += Math.floor(random() * 10).toString();
  return `${intDigits}.${fracDigits}`;
}

describe('properties hold across generated values', () => {
  const SEED = 0x0d2a0001;
  const ITERATIONS = 2000;

  it('round-trip: re-parsing the canonical rendering yields the same cents', () => {
    const random = mulberry32(SEED);
    for (let i = 0; i < ITERATIONS; i += 1) {
      const magnitude = randomAcceptedMagnitude(random);
      const sample = random() < 0.5 ? magnitude : `-${magnitude}`;
      const cents = toCents(sample);
      expect(toCents(centsToDecimalString(cents)), `seed ${SEED} iteration ${i}`).toBe(cents);
    }
  });

  it('sign symmetry: negating the input negates the cents exactly', () => {
    const random = mulberry32(SEED ^ 0xabcd);
    for (let i = 0; i < ITERATIONS; i += 1) {
      const magnitude = randomAcceptedMagnitude(random);
      // `===` rather than `toBe`, because `toBe` is Object.is and would treat the legitimate
      // 0 / -0 pair at zero as a mismatch. Zero is its own negation here by design: the conversion
      // never produces a negative zero.
      const negated = toCents(`-${magnitude}`);
      expect(negated === -toCents(magnitude), `seed ${SEED} iteration ${i}`).toBe(true);
      expect(toCents(`+${magnitude}`)).toBe(toCents(magnitude));
    }
  });

  it('monotonicity: a longer, larger fraction never converts to fewer cents', () => {
    const random = mulberry32(SEED ^ 0x5555);
    for (let i = 0; i < 500; i += 1) {
      const whole = Math.floor(random() * 100000).toString();
      const lower = toCents(`${whole}.000`);
      const upper = toCents(`${whole}.999`);
      expect(upper).toBeGreaterThan(lower);
      expect(upper - lower).toBe(100);
    }
  });

  it('the canonical rendering always carries exactly two fraction digits', () => {
    const random = mulberry32(SEED ^ 0x7777);
    for (let i = 0; i < 500; i += 1) {
      const rendered = centsToDecimalString(toCents(randomAcceptedMagnitude(random)));
      expect(rendered).toMatch(/^-?\d+\.\d{2}$/);
    }
  });
});

/* ------------------------------------------------------------------ VAT split */

describe('VAT extraction leaves no residual', () => {
  it('net plus VAT equals gross for every rate on a wide sweep', () => {
    for (const rate of [0, 7, 19]) {
      for (let gross = -5000; gross <= 5000; gross += 1) {
        const { netCents, vatCents } = splitVatFromGross(gross, rate);
        expect(netCents + vatCents).toBe(gross);
      }
    }
  });

  it('a zero rate leaves the whole amount net', () => {
    expect(splitVatFromGross(12345, 0)).toEqual({ netCents: 12345, vatCents: 0 });
  });

  it('matches worked examples at the reduced and standard rates', () => {
    expect(splitVatFromGross(10700, 7)).toEqual({ netCents: 10000, vatCents: 700 });
    expect(splitVatFromGross(11900, 19)).toEqual({ netCents: 10000, vatCents: 1900 });
    // 20.00 EUR gross at 7% → 18.69 net (18.6915… rounds half away from zero), 1.31 VAT.
    expect(splitVatFromGross(2000, 7)).toEqual({ netCents: 1869, vatCents: 131 });
  });

  it('is symmetric under negation, so a refund reverses its charge exactly', () => {
    for (const gross of [1, 2000, 12345, 99999]) {
      const positive = splitVatFromGross(gross, 19);
      const negative = splitVatFromGross(-gross, 19);
      // `===` for the same 0 / -0 reason as the sign-symmetry property above.
      expect(negative.netCents === -positive.netCents, `net at ${gross}`).toBe(true);
      expect(negative.vatCents === -positive.vatCents, `vat at ${gross}`).toBe(true);
    }
  });

  it('rejects a non-integer gross or an impossible rate', () => {
    expect(() => splitVatFromGross(1.5, 19)).toThrow(MalformedAmountError);
    expect(() => splitVatFromGross(100, 7.5)).toThrow(MalformedAmountError);
    expect(() => splitVatFromGross(100, -1)).toThrow(MalformedAmountError);
    expect(() => splitVatFromGross(100, 101)).toThrow(MalformedAmountError);
  });
});

describe('summation stays exact', () => {
  it('sums in integer arithmetic', () => {
    expect(sumCents([1, 2, 3])).toBe(6);
    expect(sumCents([])).toBe(0);
    expect(sumCents([-1250, 1250])).toBe(0);
  });

  it('rejects a non-integer contribution rather than absorbing it', () => {
    expect(() => sumCents([1, 2.5])).toThrow(MalformedAmountError);
  });

  it('rejects a total outside the domain bound', () => {
    expect(() => sumCents([Number(MAX_CENTS), 1])).toThrow(MalformedAmountError);
  });
});
