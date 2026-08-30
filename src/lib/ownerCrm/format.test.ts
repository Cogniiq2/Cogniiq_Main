// The CRM formats in the reader's timezone; the finance exports format in UTC.
// Mixing the two is how a follow-up ends up an hour early, so both halves of
// that split are pinned here.
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  centsToEuroInput, formatLocalDateDe, formatLocalDateTimeDe, parseEuroToCents,
  toDateTimeLocalValue,
} from '@/lib/ownerCrm/format';
import { formatTimestampDe } from '@/lib/ownerFinance/exports';

/** Berlin in August: UTC+2. 22:30Z is 00:30 the NEXT day locally. */
function withTimezoneOffset(minutesWestOfUtc: number, run: () => void) {
  const spy = vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(minutesWestOfUtc);
  try { run(); } finally { spy.mockRestore(); }
}

afterEach(() => { vi.restoreAllMocks(); });

describe('formatLocalDateTimeDe', () => {
  it('renders German day-first order without a timezone label', () => {
    // The local components are read straight off the Date, so this holds in
    // whatever timezone the test runner happens to be in.
    const d = new Date(2026, 7, 31, 10, 5);
    expect(formatLocalDateTimeDe(d)).toBe('31.08.2026 10:05');
  });

  it('pads single digits on both sides of the time', () => {
    expect(formatLocalDateTimeDe(new Date(2026, 0, 2, 9, 7))).toBe('02.01.2026 09:07');
  });

  it('shows an em dash rather than "Invalid Date" for a missing value', () => {
    expect(formatLocalDateTimeDe(null)).toBe('—');
    expect(formatLocalDateTimeDe(undefined)).toBe('—');
  });

  it('returns unparseable input unchanged instead of inventing a date', () => {
    expect(formatLocalDateTimeDe('not a date')).toBe('not a date');
  });
});

describe('formatLocalDateDe', () => {
  it('drops the time', () => {
    expect(formatLocalDateDe(new Date(2026, 8, 2, 23, 59))).toBe('02.09.2026');
  });
});

describe('toDateTimeLocalValue', () => {
  it('produces the wall-clock string a datetime-local input expects', () => {
    const d = new Date(2026, 7, 31, 14, 30);
    expect(toDateTimeLocalValue(d.toISOString())).toBe('2026-08-31T14:30');
  });

  it('round-trips through the input format without drifting', () => {
    // The bug this guards: toISOString().slice(0,16) hands the input a UTC time
    // while the browser renders and re-reads it as local, so every save shifts
    // the follow-up by the offset.
    const original = new Date(2026, 7, 31, 14, 30);
    const value = toDateTimeLocalValue(original.toISOString());
    expect(new Date(value).getTime()).toBe(original.getTime());
  });

  it('is empty for a missing value, so the field renders blank', () => {
    expect(toDateTimeLocalValue(null)).toBe('');
    expect(toDateTimeLocalValue('')).toBe('');
  });
});

describe('the finance formatter stays UTC', () => {
  it('still labels its output, because a document footer must not move', () => {
    // Not a CRM concern, asserted here so a future "let's unify these" does not
    // quietly change what an issued invoice says.
    expect(formatTimestampDe('2026-08-31T22:30:00Z')).toBe('31.08.2026 22:30 UTC');
  });

  it('differs from the CRM formatter across a UTC midnight', () => {
    withTimezoneOffset(-120, () => {
      // Same instant, two legitimate renderings: the document keeps UTC, the
      // CRM shows the owner's day.
      expect(formatTimestampDe('2026-08-31T22:30:00Z')).toContain('31.08.2026');
      expect(formatTimestampDe('2026-08-31T22:30:00Z')).toContain('UTC');
      expect(formatLocalDateTimeDe('2026-08-31T22:30:00Z')).not.toContain('UTC');
    });
  });
});

describe('parseEuroToCents', () => {
  it('accepts the German form the owner actually types', () => {
    expect(parseEuroToCents('4.800,00')).toBe(480000);
    expect(parseEuroToCents('399,00')).toBe(39900);
    expect(parseEuroToCents('1.234,56')).toBe(123456);
  });

  it('accepts the plain form too', () => {
    expect(parseEuroToCents('4800')).toBe(480000);
    // A lone dot with one or two trailing digits is a decimal point — that is
    // what a numeric keypad produces.
    expect(parseEuroToCents('399.5')).toBe(39950);
    expect(parseEuroToCents('399.50')).toBe(39950);
  });

  it('reads a bare "1.234" as German thousands, not as one euro twenty-three', () => {
    // The field's placeholder is "4.800,00". In that context the dot is a
    // thousands separator, and guessing otherwise silently divides the owner's
    // pipeline by a thousand.
    expect(parseEuroToCents('1.234')).toBe(123400);
    expect(parseEuroToCents('4.800')).toBe(480000);
  });

  it('ignores currency symbols and stray spaces', () => {
    expect(parseEuroToCents(' 4.800,00 € ')).toBe(480000);
  });

  it('keeps an empty field empty rather than calling it zero', () => {
    // "no estimate yet" and "estimated at nothing" are different answers.
    expect(parseEuroToCents('')).toBeNull();
    expect(parseEuroToCents('   ')).toBeNull();
    expect(parseEuroToCents('keine Angabe')).toBeNull();
  });

  it('rounds to whole cents instead of storing a fraction', () => {
    expect(parseEuroToCents('0,005')).toBe(1);
    expect(parseEuroToCents('10,004')).toBe(1000);
  });
});

describe('centsToEuroInput', () => {
  it('round-trips through the parser', () => {
    for (const cents of [0, 1, 39900, 480000, 123456]) {
      expect(parseEuroToCents(centsToEuroInput(cents))).toBe(cents);
    }
  });

  it('renders an unknown amount as an empty field, not "0,00"', () => {
    expect(centsToEuroInput(null)).toBe('');
    expect(centsToEuroInput(undefined)).toBe('');
  });
});
