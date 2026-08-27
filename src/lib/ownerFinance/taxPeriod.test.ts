// ─────────────────────────────────────────────────────────────────────────────
// The Auswertungszeitraum helper is the single source of truth for every date
// range on the Steuern page: the owner_tax_period_inputs call, the UStVA/PDF/
// JSON exports, the owner_exports audit entry and the on-screen labels.
//
// A wrong boundary here silently moves revenue between tax periods, so the exact
// inclusive dates are pinned rather than derived in the test.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, expect, it } from 'vitest';

import {
  formatPeriodDateDe, fullYearPeriod, isTaxPeriodKey, resolveTaxPeriod,
  TAX_PERIOD_KEYS, type TaxPeriodKey,
} from '@/lib/ownerFinance/taxPeriod';

describe('resolveTaxPeriod — exact inclusive quarter boundaries', () => {
  it.each([
    ['year', '2026-01-01', '2026-12-31'],
    ['Q1', '2026-01-01', '2026-03-31'],
    ['Q2', '2026-04-01', '2026-06-30'],
    ['Q3', '2026-07-01', '2026-09-30'],
    ['Q4', '2026-10-01', '2026-12-31'],
  ] as [TaxPeriodKey, string, string][])('%s → %s .. %s', (key, start, end) => {
    const p = resolveTaxPeriod(2026, key);
    expect(p.startDate).toBe(start);
    expect(p.endDate).toBe(end);
  });

  it('leaves no gap and no overlap between consecutive quarters', () => {
    const q = (['Q1', 'Q2', 'Q3', 'Q4'] as TaxPeriodKey[]).map((k) => resolveTaxPeriod(2026, k));
    // Q(n) ends the day before Q(n+1) starts — verified as calendar dates.
    expect(q[0].endDate).toBe('2026-03-31');
    expect(q[1].startDate).toBe('2026-04-01');
    expect(q[1].endDate).toBe('2026-06-30');
    expect(q[2].startDate).toBe('2026-07-01');
    expect(q[2].endDate).toBe('2026-09-30');
    expect(q[3].startDate).toBe('2026-10-01');
    // The quarters together cover exactly the full year.
    expect(q[0].startDate).toBe(fullYearPeriod(2026).startDate);
    expect(q[3].endDate).toBe(fullYearPeriod(2026).endDate);
  });

  it('a boundary day belongs to exactly one quarter', () => {
    const inPeriod = (d: string, key: TaxPeriodKey) => {
      const p = resolveTaxPeriod(2026, key);
      return d >= p.startDate && d <= p.endDate;
    };
    const quarters: TaxPeriodKey[] = ['Q1', 'Q2', 'Q3', 'Q4'];
    for (const day of ['2026-01-01', '2026-03-31', '2026-04-01', '2026-06-30', '2026-07-01', '2026-09-30', '2026-10-01', '2026-12-31']) {
      expect(quarters.filter((k) => inPeriod(day, k))).toHaveLength(1);
    }
  });

  it('is unaffected by leap years — no quarter boundary touches 29 February', () => {
    const leap = resolveTaxPeriod(2028, 'Q1');
    expect(leap.startDate).toBe('2028-01-01');
    expect(leap.endDate).toBe('2028-03-31');
    // 29 Feb 2028 falls inside Q1 and nowhere else.
    expect('2028-02-29' >= leap.startDate && '2028-02-29' <= leap.endDate).toBe(true);
    expect(resolveTaxPeriod(2028, 'year').endDate).toBe('2028-12-31');
  });

  it('switches years without leaking the previous year', () => {
    expect(resolveTaxPeriod(2025, 'Q4')).toMatchObject({ startDate: '2025-10-01', endDate: '2025-12-31' });
    expect(resolveTaxPeriod(2027, 'Q1')).toMatchObject({ startDate: '2027-01-01', endDate: '2027-03-31' });
    for (const key of TAX_PERIOD_KEYS) {
      const p = resolveTaxPeriod(2030, key);
      expect(p.startDate.startsWith('2030-')).toBe(true);
      expect(p.endDate.startsWith('2030-')).toBe(true);
    }
  });

  it('never routes an accounting date through Date (no timezone drift)', () => {
    // A UTC-parsed '2026-01-01' rendered in a negative-offset zone would become
    // 31.12.2025. The helper formats from the string parts instead.
    expect(formatPeriodDateDe('2026-01-01')).toBe('01.01.2026');
    expect(formatPeriodDateDe('2026-12-31')).toBe('31.12.2026');
  });
});

describe('resolveTaxPeriod — labels, filenames and snapshot period', () => {
  it('produces year-only filenames for the full year and quarter-tagged ones otherwise', () => {
    expect(resolveTaxPeriod(2026, 'year').filenameSuffix).toBe('2026');
    expect(resolveTaxPeriod(2026, 'Q1').filenameSuffix).toBe('2026-Q1');
    expect(resolveTaxPeriod(2026, 'Q4').filenameSuffix).toBe('2026-Q4');
  });

  it('labels the period for display and for export metadata', () => {
    const q2 = resolveTaxPeriod(2026, 'Q2');
    expect(q2.label).toBe('Q2 2026');
    expect(q2.shortLabel).toBe('Q2');
    expect(q2.rangeLabel).toBe('Q2 2026 · 01.04.2026–30.06.2026');
    expect(resolveTaxPeriod(2026, 'year').shortLabel).toBe('Gesamtjahr');
  });

  it('flags only the full year as isFullYear', () => {
    expect(resolveTaxPeriod(2026, 'year').isFullYear).toBe(true);
    for (const key of ['Q1', 'Q2', 'Q3', 'Q4'] as TaxPeriodKey[]) {
      expect(resolveTaxPeriod(2026, key).isFullYear).toBe(false);
    }
  });

  it('carries the period key into the snapshot label so a quarter is never stored as a year', () => {
    expect(resolveTaxPeriod(2026, 'Q3').snapshotPeriod).toBe('Q3');
    expect(resolveTaxPeriod(2026, 'year').snapshotPeriod).toBe('year');
  });

  it('validates period keys', () => {
    expect(isTaxPeriodKey('Q1')).toBe(true);
    expect(isTaxPeriodKey('year')).toBe(true);
    expect(isTaxPeriodKey('Q5')).toBe(false);
    expect(isTaxPeriodKey(null)).toBe(false);
  });
});
