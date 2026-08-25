// owner_offers.{net,vat,gross}_total_cents now mean the ONE-TIME portion only. Every owner-facing
// list, KPI and export that showed "gross_total_cents" as *the* offer amount predates that split,
// so a recurring-only accepted deal — real, signed, worth real money — read as 0,00 EUR: invisible
// to a min-amount filter, sorted as the smallest deal, missing from pipeline/export sums. These
// tests pin the fix.

import { describe, it, expect } from 'vitest';

import { offerHasRecurringAmount, offerPipelineSortValueCents, formatOfferAmount } from './offerAmountDisplay';

const formatCents = (cents: number, currency = 'EUR') =>
  `${(cents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 })} ${currency === 'EUR' ? '€' : currency}`;

describe('offerHasRecurringAmount', () => {
  it('is false for a purely one-time offer', () => {
    expect(offerHasRecurringAmount({ gross_total_cents: 464100, recurring_monthly_gross_cents: 0 })).toBe(false);
  });
  it('is false when the field is absent (a consumer that never selected it)', () => {
    expect(offerHasRecurringAmount({ gross_total_cents: 464100 })).toBe(false);
  });
  it('is true once there is a committed monthly amount', () => {
    expect(offerHasRecurringAmount({ gross_total_cents: 464100, recurring_monthly_gross_cents: 34510 })).toBe(true);
  });
});

describe('offerPipelineSortValueCents', () => {
  it('does not silently zero out a recurring-only accepted deal', () => {
    // The bug this exists to fix: a min-amount filter or an amount sort using
    // gross_total_cents alone would drop or bottom-rank this real, signed offer.
    const recurringOnly = { gross_total_cents: 0, recurring_monthly_gross_cents: 34510 };
    expect(offerPipelineSortValueCents(recurringOnly)).toBeGreaterThan(0);
    expect(offerPipelineSortValueCents(recurringOnly)).toBe(34510);
  });

  it('combines both parts for a mixed offer', () => {
    expect(offerPipelineSortValueCents({ gross_total_cents: 464100, recurring_monthly_gross_cents: 34510 })).toBe(498610);
  });

  it('is exactly the one-time amount when there is no recurring commitment', () => {
    expect(offerPipelineSortValueCents({ gross_total_cents: 464100, recurring_monthly_gross_cents: 0 })).toBe(464100);
  });
});

describe('formatOfferAmount', () => {
  it('shows only the one-time amount for a one-time-only offer (unchanged presentation)', () => {
    expect(formatOfferAmount({ gross_total_cents: 464100, recurring_monthly_gross_cents: 0 }, 'EUR', formatCents))
      .toBe('4.641,00 €');
  });

  it('shows only the monthly amount for a recurring-only offer, never 0,00 €', () => {
    expect(formatOfferAmount({ gross_total_cents: 0, recurring_monthly_gross_cents: 34510 }, 'EUR', formatCents))
      .toBe('345,10 € / Monat');
  });

  it('shows both parts, never fused, for a mixed offer', () => {
    const label = formatOfferAmount({ gross_total_cents: 464100, recurring_monthly_gross_cents: 34510 }, 'EUR', formatCents);
    expect(label).toBe('4.641,00 € + 345,10 € / Monat');
    // Never a single summed figure that misstates what is owed.
    expect(label).not.toContain((4641 + 345.1).toFixed(2).replace('.', ','));
  });

  it('falls back to an em dash for a draft with nothing priced yet', () => {
    expect(formatOfferAmount({ gross_total_cents: 0, recurring_monthly_gross_cents: 0 }, 'EUR', formatCents)).toBe('—');
  });

  it('treats an absent recurring field as zero', () => {
    expect(formatOfferAmount({ gross_total_cents: 464100 }, 'EUR', formatCents)).toBe('4.641,00 €');
  });
});
