// Over-invoicing protection for an offer's ONE-TIME amount.
//
// Warning was not enough. With SVH Admin's Rate 1 (1.950 EUR) already billed, the old dialog
// still offered "Gesamten Einmalbetrag — 3.900 EUR", which would have produced 5.850 EUR of
// invoices against a 3.900 EUR contract — and Rate 1 itself could be created twice. These tests
// pin the rule that closed it, in the pure form the dialog consumes. The authoritative copy of
// the same rule lives in the database (unique indexes + checks inside
// convert_owner_offer_to_invoice_draft) and is guarded in offerInvoiceConversion.test.ts.

import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

import {
  offerConversionAvailability, type OfferConversionRecord,
} from '@/lib/ownerFinance/offerConversionAvailability';
import { milestoneAmountCents } from '@/lib/ownerFinance/documents/documentModel';

const MIGRATION_SQL = readFileSync(
  'supabase/migrations/20260825064048_offer_recurring_pricing.sql', 'utf8',
).replace(/\r\n/g, '\n');

const rate = (index: number): OfferConversionRecord => ({ source_offer_conversion_kind: 'milestone', source_offer_milestone_index: index });
const full = (): OfferConversionRecord => ({ source_offer_conversion_kind: 'full', source_offer_milestone_index: null });
/** An invoice that exists but did not come from a conversion (hand-written, or pre-migration). */
const unrelated = (): OfferConversionRecord => ({ source_offer_conversion_kind: null, source_offer_milestone_index: null });

/** SVH Admin: 3.900 EUR one-time, 50/50. */
const ADMIN_ONE_TIME = 390000;
const FIFTY_FIFTY = 2;

describe('1. no invoices yet — everything is offered', () => {
  it('offers both rates and the full amount', () => {
    const a = offerConversionAvailability(FIFTY_FIFTY, []);
    expect(a.milestones.map((m) => m.available)).toEqual([true, true]);
    expect(a.fullAvailable).toBe(true);
    expect(a.nothingInvoiceable).toBe(false);
  });

  it('7. offers the full amount when the offer has no payment plan at all', () => {
    const a = offerConversionAvailability(0, []);
    expect(a.milestones).toEqual([]);
    expect(a.fullAvailable).toBe(true);
    expect(a.nothingInvoiceable).toBe(false);
  });
});

describe('2-4. Rate 1 already invoiced', () => {
  const a = offerConversionAvailability(FIFTY_FIFTY, [rate(0)]);

  it('2. Rate 1 cannot be created again', () => {
    expect(a.milestones[0].available).toBe(false);
    expect(a.milestones[0].reason).toBe('already_invoiced');
  });

  it('3. Rate 2 remains available', () => {
    expect(a.milestones[1].available).toBe(true);
    expect(a.milestones[1].reason).toBeNull();
  });

  it('4. the full amount is no longer offered — it would over-invoice the contract', () => {
    expect(a.fullAvailable).toBe(false);
    expect(a.fullReason).toBe('instalments_exist');
  });

  it('still has something invoiceable, so the dialog does not dead-end', () => {
    expect(a.nothingInvoiceable).toBe(false);
  });
});

describe('5-6. both rates invoiced', () => {
  const a = offerConversionAvailability(FIFTY_FIFTY, [rate(0), rate(1)]);

  it('5. Rate 2 cannot be created twice', () => {
    expect(a.milestones[1].available).toBe(false);
    expect(a.milestones[1].reason).toBe('already_invoiced');
  });

  it('6. nothing remains invoiceable', () => {
    expect(a.milestones.every((m) => !m.available)).toBe(true);
    expect(a.fullAvailable).toBe(false);
    expect(a.nothingInvoiceable).toBe(true);
  });
});

describe('8. full amount already invoiced', () => {
  const a = offerConversionAvailability(FIFTY_FIFTY, [full()]);

  it('blocks every rate', () => {
    expect(a.milestones.map((m) => m.available)).toEqual([false, false]);
    expect(a.milestones.map((m) => m.reason)).toEqual(['full_already_invoiced', 'full_already_invoiced']);
  });

  it('blocks a second full conversion and dead-ends cleanly', () => {
    expect(a.fullAvailable).toBe(false);
    expect(a.fullReason).toBe('full_already_invoiced');
    expect(a.nothingInvoiceable).toBe(true);
  });

  it('holds for an offer with no payment plan too', () => {
    const noPlan = offerConversionAvailability(0, [full()]);
    expect(noPlan.fullAvailable).toBe(false);
    expect(noPlan.nothingInvoiceable).toBe(true);
  });
});

describe('unrelated invoices do not consume any slot', () => {
  it('ignores invoices that did not come from a conversion', () => {
    const a = offerConversionAvailability(FIFTY_FIFTY, [unrelated(), unrelated()]);
    expect(a.milestones.map((m) => m.available)).toEqual([true, true]);
    expect(a.fullAvailable).toBe(true);
  });
});

describe('cancelled invoices keep their slot (deliberate rule)', () => {
  it('a cancelled Rate 1 does not free Rate 1 for re-invoicing', () => {
    // The availability input is status-blind on purpose: reissuing a cancelled rate needs a
    // credit-note workflow, and freeing the slot would silently re-open the double-invoicing
    // hole. Blocking can only ever refuse an action the owner can still take manually.
    const a = offerConversionAvailability(FIFTY_FIFTY, [rate(0)]);
    expect(a.milestones[0].available).toBe(false);
  });

  it('the database indexes are likewise not filtered by status', () => {
    const idx = MIGRATION_SQL.slice(
      MIGRATION_SQL.indexOf('create unique index if not exists owner_invoices_offer_milestone_once'),
      MIGRATION_SQL.indexOf('commit;', MIGRATION_SQL.indexOf('owner_invoices_offer_full_once')),
    );
    expect(idx).toMatch(/where source_offer_conversion_kind = 'milestone'/);
    expect(idx).not.toMatch(/status/);
  });
});

describe('the one-time amount can never be over-invoiced', () => {
  // Exhaustively walk every reachable sequence of conversions and assert the billed total never
  // exceeds the contract's one-time amount.
  function walk(oneTimeNet: number, schedule: number[]): number[] {
    const totals: number[] = [];
    const step = (done: OfferConversionRecord[], billed: number) => {
      totals.push(billed);
      const a = offerConversionAvailability(schedule.length, done);
      a.milestones.filter((m) => m.available).forEach((m) => {
        const amount = milestoneAmountCents({ label: `R${m.index}`, percentageBp: schedule[m.index] }, oneTimeNet)!;
        step([...done, rate(m.index)], billed + amount);
      });
      if (a.fullAvailable) step([...done, full()], billed + oneTimeNet);
    };
    step([], 0);
    return totals;
  }

  const PACKAGES = [
    { name: 'Admin', oneTime: 390000 },
    { name: 'Admin Pro', oneTime: 690000 },
    { name: 'Complete', oneTime: 890000 },
  ];

  for (const p of PACKAGES) {
    it(`${p.name}: no reachable sequence bills more than ${(p.oneTime / 100).toLocaleString('de-DE')},00 EUR netto`, () => {
      const totals = walk(p.oneTime, [5000, 5000]);
      expect(Math.max(...totals)).toBe(p.oneTime);
      expect(totals.every((t) => t <= p.oneTime)).toBe(true);
    });
  }

  it('Admin 50/50: the only two ways to reach the full 3.900 EUR are both rates, or one full conversion', () => {
    const totals = walk(ADMIN_ONE_TIME, [5000, 5000]);
    expect(totals.filter((t) => t === ADMIN_ONE_TIME).length).toBe(3); // R1+R2, R2+R1, full
    expect(totals).not.toContain(ADMIN_ONE_TIME + 195000); // the 5.850 EUR bug
  });

  it('holds for an uneven 30/40/30 plan too', () => {
    const totals = walk(ADMIN_ONE_TIME, [3000, 4000, 3000]);
    expect(Math.max(...totals)).toBe(ADMIN_ONE_TIME);
  });
});
