// "Angebot -> Rechnung erstellen" with a payment plan.
//
// Converting an accepted offer used to silently create a draft for the whole one-time amount,
// even when the offer had a 50/50 payment plan sitting right next to it — the owner had no way
// to say "invoice Rate 1 now, Rate 2 later" through the conversion action itself. This file pins
// the corrected policy:
//   - the owner chooses WHAT to invoice: the whole one-time amount, or one payment-plan rate;
//   - a rate invoice is grouped by VAT (never a 1:1 copy of the underlying offer lines) and is
//     scaled by that rate's percentage (or amount) against the ONE-TIME net only;
//   - a rate invoice does not close the offer out — only the full amount does — so a later rate
//     stays a possible, separate, deliberate action;
//   - an offer with no invoiceable one-time content raises before any row is inserted, so a
//     recurring-only offer can never produce an empty draft.
//
// The SQL is guarded textually (same technique as offerRecurringPricing.test.ts); the ratio/
// grouping arithmetic is mirrored in JS so the exact cents for every case can be asserted without
// a live Postgres instance.

import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

import { milestoneAmountCents } from '@/lib/ownerFinance/documents/documentModel';

const MIGRATION_SQL = readFileSync(
  'supabase/migrations/20260825064048_offer_recurring_pricing.sql', 'utf8',
).replace(/\r\n/g, '\n');

const CONVERT_FN = (() => {
  const code = MIGRATION_SQL.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n');
  const start = code.indexOf('function public.convert_owner_offer_to_invoice_draft');
  const end = code.indexOf('$fn$;', start);
  return code.slice(start, end);
})();

/* ------------------------------------------------------------------------ JS mirror of the SQL */

interface OneTimeLine { netCents: number; vatRateBp: number; vatTreatment: 'standard' | 'reduced' | 'zero_rated' | 'exempt' | 'reverse_charge' | 'outside_scope'; isOptional?: boolean; pricingType?: 'one_time' | 'recurring' }
interface Milestone { label: string; percentageBp?: number | null; amountCents?: number | null }

/** Mirrors the plpgsql body exactly: raises (throws) instead of inserting when nothing to invoice. */
function convert(lines: OneTimeLine[], milestone?: Milestone): { lines: Array<{ description: string; netCents: number; vatRateBp: number }>; label: string | null; isFull: boolean } {
  const oneTime = lines.filter((l) => !l.isOptional && (l.pricingType ?? 'one_time') === 'one_time');
  const oneTimeNet = oneTime.reduce((s, l) => s + l.netCents, 0);
  if (oneTimeNet <= 0) throw new Error('offer has no invoiceable one-time position — recurring positions are billed separately');

  if (!milestone) {
    return { lines: oneTime.map((l) => ({ description: 'line', netCents: l.netCents, vatRateBp: l.vatRateBp })), label: null, isFull: true };
  }

  const ratio = typeof milestone.percentageBp === 'number' ? milestone.percentageBp / 10000
    : typeof milestone.amountCents === 'number' ? milestone.amountCents / oneTimeNet
    : (() => { throw new Error('payment milestone has neither a percentage nor an amount'); })();
  if (ratio <= 0) throw new Error('payment milestone resolves to a non-positive amount');

  const groups = new Map<string, { vatRateBp: number; net: number }>();
  for (const l of oneTime) {
    const key = `${l.vatRateBp}:${l.vatTreatment}`;
    const g = groups.get(key);
    if (g) g.net += l.netCents; else groups.set(key, { vatRateBp: l.vatRateBp, net: l.netCents });
  }
  const multi = groups.size > 1;
  const label = typeof milestone.percentageBp === 'number'
    ? `${milestone.label} (${(milestone.percentageBp / 100).toFixed(2)} %)` : milestone.label;
  return {
    lines: [...groups.values()].map((g) => ({
      description: label + (multi ? ` (${g.vatRateBp / 100} USt)` : ''), netCents: Math.round(g.net * ratio), vatRateBp: g.vatRateBp,
    })),
    label, isFull: false,
  };
}

const oneTime = (netCents: number, vatRateBp = 1900): OneTimeLine => ({ netCents, vatRateBp, vatTreatment: 'standard', pricingType: 'one_time' });
const recurring = (netCents: number, opts: Partial<OneTimeLine> = {}): OneTimeLine => ({ netCents, vatRateBp: 1900, vatTreatment: 'standard', pricingType: 'recurring', ...opts });

describe('Case A — one-time only (3.900 EUR setup, no recurring)', () => {
  it('invoices the full one-time amount, unchanged from pre-payment-plan behaviour', () => {
    const result = convert([oneTime(390000)]);
    expect(result.isFull).toBe(true);
    expect(result.lines).toEqual([{ description: 'line', netCents: 390000, vatRateBp: 1900 }]);
  });
});

describe('Case B — mixed (3.900 EUR setup + 290 EUR/Monat, no payment plan)', () => {
  it('invoices the one-time amount only; the recurring line is not among the invoiced lines', () => {
    const result = convert([oneTime(390000), recurring(29000)]);
    expect(result.lines).toEqual([{ description: 'line', netCents: 390000, vatRateBp: 1900 }]);
    expect(result.lines.some((l) => l.netCents === 29000)).toBe(false);
  });
});

describe('Case C — mixed with 50/50 payment plan (SVH Admin)', () => {
  const lines = [oneTime(390000), recurring(29000)];

  it('Rate 1 (50%) invoices exactly 1.950,00 EUR, never touching the 290 EUR/Monat', () => {
    const rate1 = convert(lines, { label: 'Bei Auftragserteilung', percentageBp: 5000 });
    expect(rate1.isFull).toBe(false);
    expect(rate1.lines).toEqual([{ description: 'Bei Auftragserteilung (50.00 %)', netCents: 195000, vatRateBp: 1900 }]);
  });

  it('Rate 2 (50%) also invoices exactly 1.950,00 EUR, and is not created automatically', () => {
    const rate2 = convert(lines, { label: 'Nach Fertigstellung und Übergabe', percentageBp: 5000 });
    expect(rate2.lines).toEqual([{ description: 'Nach Fertigstellung und Übergabe (50.00 %)', netCents: 195000, vatRateBp: 1900 }]);
    // Two independent calls, two independent choices — nothing here chains Rate 1 into Rate 2.
  });

  it('the two rates sum to the one-time amount, matching milestoneAmountCents used elsewhere', () => {
    const oneTimeNet = 390000;
    const viaShared1 = milestoneAmountCents({ label: 'Rate 1', percentageBp: 5000 }, oneTimeNet);
    const viaShared2 = milestoneAmountCents({ label: 'Rate 2', percentageBp: 5000 }, oneTimeNet);
    expect(viaShared1).toBe(195000);
    expect(viaShared2).toBe(195000);
    expect(viaShared1! + viaShared2!).toBe(oneTimeNet);
  });

  it('a rate never appears in the same invoice as any recurring line', () => {
    const rate1 = convert(lines, { label: 'Bei Auftragserteilung', percentageBp: 5000 });
    expect(rate1.lines).toHaveLength(1);
    expect(rate1.lines[0].netCents).not.toBe(29000);
  });
});

describe('Case D — recurring only (290 EUR/Monat)', () => {
  it('refuses to convert before any invoice row would be created', () => {
    expect(() => convert([recurring(29000)])).toThrowError(/no invoiceable one-time position/);
    expect(() => convert([recurring(29000)], { label: 'Egal', percentageBp: 5000 })).toThrowError(/no invoiceable one-time position/);
  });
});

describe('Case E — optional recurring line', () => {
  it('is never invoiced, full conversion or by rate', () => {
    const lines = [oneTime(390000), recurring(9000, { isOptional: true })];
    expect(convert(lines).lines.some((l) => l.netCents === 9000)).toBe(false);
    expect(convert(lines, { label: 'Rate 1', percentageBp: 5000 }).lines.some((l) => l.netCents === 4500)).toBe(false);
  });
});

describe('mixed VAT groups (defensive — not part of the SVH scenarios)', () => {
  it('splits a rate proportionally per VAT group rather than one blended line', () => {
    const lines = [oneTime(200000, 1900), oneTime(100000, 700)];
    const rate = convert(lines, { label: 'Anzahlung', percentageBp: 5000 });
    expect(rate.lines).toEqual([
      { description: 'Anzahlung (50.00 %) (19 USt)', netCents: 100000, vatRateBp: 1900 },
      { description: 'Anzahlung (50.00 %) (7 USt)', netCents: 50000, vatRateBp: 700 },
    ]);
  });
});

/* ------------------------------------------------------------------------ SQL structural guards */

describe('the migration keeps every guarantee in the actual SQL', () => {
  it('a full conversion still copies one-time lines verbatim, unchanged', () => {
    expect(CONVERT_FN).toMatch(/if p_milestone_index is null then[\s\S]*?for v_line in select \* from public\.owner_offer_lines/);
  });

  it('checks for a positive one-time amount before inserting anything', () => {
    const insertIdx = CONVERT_FN.indexOf('insert into public.owner_invoices');
    const checkIdx = CONVERT_FN.indexOf('if v_one_time_net <= 0 then');
    expect(checkIdx).toBeGreaterThan(-1);
    expect(checkIdx).toBeLessThan(insertIdx);
  });

  it('a rate conversion groups by VAT rather than copying original lines 1:1', () => {
    expect(CONVERT_FN).toMatch(/group by vat_rate_bp, vat_treatment/);
  });

  it('only a full conversion sets converted_invoice_id / status = converted', () => {
    const block = CONVERT_FN.slice(CONVERT_FN.indexOf('if p_milestone_index is null then\n    update'));
    expect(block).toMatch(/update public\.owner_offers set converted_invoice_id = v_inv, converted_at = now\(\), status = 'converted'/);
    // The milestone branch must never reach that statement — confirmed by the surrounding
    // `if p_milestone_index is null then ... end if;` guard captured above.
  });

  it('links every created invoice back to its offer for the duplicate-instalment warning', () => {
    expect(MIGRATION_SQL).toMatch(/add column if not exists source_offer_id uuid references public\.owner_offers/);
    expect(CONVERT_FN).toMatch(/source_offer_id[\s\S]*?values \([\s\S]*?o\.id,/);
  });

  it('does not build a milestone-to-invoice-line tracking table (smallest robust solution)', () => {
    expect(MIGRATION_SQL).not.toMatch(/create table.*payment_schedule/i);
    expect(MIGRATION_SQL).not.toMatch(/milestone_invoice/i);
  });
});

/* -------------------------------------------------- over-invoicing protection, at the DB level */

describe('10. the RPC itself rejects duplicate and conflicting conversions', () => {
  it('refuses a milestone that already produced an invoice', () => {
    expect(CONVERT_FN).toMatch(/if v_this_milestone > 0 then\s*\n\s*raise exception 'payment-plan instalment % has already been invoiced/);
  });

  it('refuses the full amount once any instalment exists', () => {
    expect(CONVERT_FN).toMatch(/if v_milestone_total > 0 then\s*\n\s*raise exception 'cannot invoice the full one-time amount/);
  });

  it('refuses an instalment once the full amount has been invoiced', () => {
    expect(CONVERT_FN).toMatch(/if v_full_invoiced then\s*\n\s*raise exception 'cannot invoice an instalment/);
  });

  it('treats a pre-migration conversion as a full conversion, so historical offers are protected', () => {
    // Invoices created before this migration carry no source_offer_* columns at all; only
    // owner_offers.converted_invoice_id records that they happened.
    expect(CONVERT_FN).toMatch(/v_full_invoiced := v_full_invoiced or o\.converted_invoice_id is not null;/);
  });

  it('counts prior conversions across ALL invoice statuses (a cancelled invoice keeps its slot)', () => {
    const countQuery = CONVERT_FN.slice(
      CONVERT_FN.indexOf('into v_full_invoiced, v_milestone_total, v_this_milestone') - 500,
      CONVERT_FN.indexOf('where i.source_offer_id = p_offer_id') + 60,
    );
    expect(countQuery).toMatch(/from public\.owner_invoices i where i\.source_offer_id = p_offer_id/);
    expect(countQuery).not.toMatch(/i\.status/);
  });

  it('checks every rule BEFORE inserting the invoice', () => {
    const insertIdx = CONVERT_FN.indexOf('insert into public.owner_invoices');
    for (const guard of ['cannot invoice the full one-time amount', 'cannot invoice an instalment', 'has already been invoiced']) {
      expect(CONVERT_FN.indexOf(guard)).toBeGreaterThan(-1);
      expect(CONVERT_FN.indexOf(guard)).toBeLessThan(insertIdx);
    }
  });
});

describe('11. concurrency-safe duplicate prevention', () => {
  it('serialises concurrent conversions of the same offer with a row lock', () => {
    // Two tabs both clicking "Rate 1" queue behind this lock; the second then sees the first's
    // invoice row in the count above and raises instead of inserting a duplicate.
    const lockIdx = CONVERT_FN.indexOf('from public.owner_offers where id = p_offer_id for update');
    const countIdx = CONVERT_FN.indexOf('into v_full_invoiced, v_milestone_total, v_this_milestone');
    expect(lockIdx).toBeGreaterThan(-1);
    expect(countIdx).toBeGreaterThan(lockIdx);
  });

  it('backs the rule with unique indexes, so even a direct INSERT cannot duplicate', () => {
    expect(MIGRATION_SQL).toMatch(
      /create unique index if not exists owner_invoices_offer_milestone_once\s*\n\s*on public\.owner_invoices \(source_offer_id, source_offer_milestone_index\)\s*\n\s*where source_offer_conversion_kind = 'milestone';/,
    );
    expect(MIGRATION_SQL).toMatch(
      /create unique index if not exists owner_invoices_offer_full_once\s*\n\s*on public\.owner_invoices \(source_offer_id\)\s*\n\s*where source_offer_conversion_kind = 'full';/,
    );
  });

  it('records the provenance in the same INSERT the index protects', () => {
    const insert = CONVERT_FN.slice(CONVERT_FN.indexOf('insert into public.owner_invoices'));
    expect(insert).toMatch(/source_offer_id, source_offer_conversion_kind, source_offer_milestone_index/);
    expect(insert).toMatch(/case when p_milestone_index is null then 'full' else 'milestone' end, p_milestone_index/);
  });
});

describe('the replaced production function leaves no reachable overload', () => {
  it('drops the pre-existing two-argument signature', () => {
    // convert_owner_offer_to_invoice_draft(uuid, uuid) is live in production. Adding a third
    // parameter with a default creates a NEW function rather than replacing it: without this
    // drop both would exist, every two-argument call would fail with "function is not unique",
    // and the old body — which copies recurring lines onto the invoice — would stay reachable.
    expect(MIGRATION_SQL).toMatch(/drop function if exists public\.convert_owner_offer_to_invoice_draft\(uuid, uuid\);/);
  });

  it('grants the new three-argument signature explicitly', () => {
    expect(MIGRATION_SQL).toMatch(/revoke execute on function public\.convert_owner_offer_to_invoice_draft\(uuid, uuid, int\) from public, anon;/);
    expect(MIGRATION_SQL).toMatch(/grant execute on function public\.convert_owner_offer_to_invoice_draft\(uuid, uuid, int\) to authenticated, service_role;/);
  });
});

describe('12. recurring-only offer still creates no empty invoice', () => {
  it('raises before the insert, with the recurring explanation', () => {
    const insertIdx = CONVERT_FN.indexOf('insert into public.owner_invoices');
    const guardIdx = CONVERT_FN.indexOf('offer has no invoiceable one-time position');
    expect(guardIdx).toBeGreaterThan(-1);
    expect(guardIdx).toBeLessThan(insertIdx);
  });
});
