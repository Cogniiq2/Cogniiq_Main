// Recurring pricing: the commercial contract these calculations must honour.
//
// The rule under test throughout: a monthly service is a price PER INTERVAL plus a contract
// term, never "quantity 12 x 290 EUR" folded into the project headline. Every surface (editor,
// live preview, PDF, customer portal) derives its numbers from `computeOfferPricing`, so these
// tests pin the behaviour for all of them at once.

import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

import {
  computeOfferPricing, monthlyGroup, billingStartText, intervalSuffix, intervalAdverb,
  pricingTypeOf,
} from '@/lib/ownerFinance/documents/offerPricing';
import { milestoneAmountCents, type DocumentLineItem } from '@/lib/ownerFinance/documents/documentModel';
import { buildPremiumSource } from '@/lib/ownerFinance/documents/premium/premiumSource';
import { snapshotToDocument, offerLinesToDocumentItems } from '@/lib/ownerFinance/buildTransactionalDoc';
import { publicLinesToDocumentItems } from '@/lib/ownerFinance/publicOfferPricing';
import type { TransactionalDocument } from '@/lib/ownerFinance/documents/documentModel';
import type { OwnerOfferLine } from '@/lib/ownerFinance/types';
import type { PublicOfferLine } from '@/lib/ownerFinance/offersApi';

const EUR = 100;
const VAT_19 = 1900;

/** Read with normalised line endings so the assertions hold on Windows checkouts too. */
const MIGRATION_SQL = readFileSync(
  'supabase/migrations/20260824193000_offer_recurring_pricing.sql', 'utf8',
).replace(/\r\n/g, '\n');

/** Server-side line math (mirrors owner_recalc_offer_line): net = qty x price, VAT on net. */
function withMath(
  partial: Omit<DocumentLineItem, 'netCents' | 'vatCents' | 'grossCents'>,
): DocumentLineItem {
  const netCents = Math.round((partial.quantityMilli * partial.unitPriceCents) / 1000);
  const hasVat = partial.vatTreatment === 'standard' || partial.vatTreatment === 'reduced';
  const vatCents = hasVat ? Math.round((netCents * partial.vatRateBp) / 10000) : 0;
  return { ...partial, netCents, vatCents, grossCents: netCents + vatCents };
}

function oneTimeLine(description: string, euros: number, opts: Partial<DocumentLineItem> = {}): DocumentLineItem {
  return withMath({
    description, quantityMilli: 1000, unit: 'Pauschal', unitPriceCents: euros * EUR,
    vatRateBp: VAT_19, vatTreatment: 'standard', pricingType: 'one_time', ...opts,
  });
}

function monthlyLine(
  description: string, eurosPerMonth: number, minimumTermMonths: number | null,
  opts: Partial<DocumentLineItem> = {},
): DocumentLineItem {
  return withMath({
    description, quantityMilli: 1000, unit: 'Monat', unitPriceCents: eurosPerMonth * EUR,
    vatRateBp: VAT_19, vatTreatment: 'standard',
    pricingType: 'recurring', billingInterval: 'monthly', minimumTermMonths,
    billingStartType: 'commissioning', billingStartLabel: null, ...opts,
  });
}

/** The three SV Heinersreuth packages, as the owner intends to sell them. */
const PACKAGES = [
  { name: 'Admin', setup: 3900, monthly: 290, term: 12, termRecurringNet: 3480, contractNet: 7380 },
  { name: 'Admin Pro', setup: 6900, monthly: 590, term: 12, termRecurringNet: 7080, contractNet: 13980 },
  { name: 'Complete', setup: 8900, monthly: 690, term: 12, termRecurringNet: 8280, contractNet: 17180 },
];

function packageLines(p: typeof PACKAGES[number]): DocumentLineItem[] {
  return [oneTimeLine('Einrichtung', p.setup), monthlyLine('Laufende Betreuung & Betrieb', p.monthly, p.term)];
}

function docFrom(lines: DocumentLineItem[], extra: Partial<TransactionalDocument> = {}): TransactionalDocument {
  return {
    kind: 'offer', language: 'de', documentNumber: 'AN-2026-0001', title: 'Angebot',
    seller: { name: 'Cogniiq', addressLines: [] },
    recipient: { name: 'SV Heinersreuth', addressLines: [] },
    issueDate: '2026-08-24', validUntil: '2026-09-23', currency: 'EUR',
    lines,
    netTotalCents: 0, vatTotalCents: 0, grossTotalCents: 0,
    isDraft: false, templateVersion: 'transactional-v1',
    ...extra,
  };
}

describe('one-time offers are untouched', () => {
  it('keeps a single headline total for a purely one-time offer', () => {
    const p = computeOfferPricing([oneTimeLine('Projekt', 3900), oneTimeLine('Workshop', 1000)]);
    expect(p.oneTime.netCents).toBe(490000);
    expect(p.oneTime.vatCents).toBe(93100);
    expect(p.oneTime.grossCents).toBe(583100);
    expect(p.recurring).toEqual([]);
    expect(p.hasRecurring).toBe(false);
    // No recurring commitment, so the "first minimum term" figure is just the one-time sum
    // and the renderers suppress it entirely.
    expect(p.minimumTermTotal.netCents).toBe(490000);
  });

  it('treats a line with no pricing type as one-time', () => {
    const legacy = withMath({
      description: 'Alt', quantityMilli: 1000, unit: 'Pauschal', unitPriceCents: 100000,
      vatRateBp: VAT_19, vatTreatment: 'standard',
    });
    expect(pricingTypeOf(legacy)).toBe('one_time');
    expect(computeOfferPricing([legacy]).hasRecurring).toBe(false);
  });
});

describe('recurring-only offers', () => {
  it('reports the monthly amount, not a multiplied-out term total', () => {
    const p = computeOfferPricing([monthlyLine('Betreuung', 290, 12)]);
    expect(p.hasOneTime).toBe(false);
    expect(p.oneTime.netCents).toBe(0);
    const m = monthlyGroup(p)!;
    expect(m.netCents).toBe(29000);
    expect(m.vatCents).toBe(5510);
    expect(m.grossCents).toBe(34510);
    expect(m.minimumTermMonths).toBe(12);
    expect(m.minimumTerm.netCents).toBe(348000);
    expect(p.minimumTermTotal.netCents).toBe(348000);
  });
});

describe('mixed one-time + monthly offers', () => {
  const p = computeOfferPricing(packageLines(PACKAGES[0]));

  it('separates the one-time and recurring totals', () => {
    expect(p.oneTime.netCents).toBe(390000);
    expect(monthlyGroup(p)!.netCents).toBe(29000);
    expect(p.hasOneTime && p.hasRecurring).toBe(true);
  });

  it('does not inflate the one-time headline with the 12-month term', () => {
    // The bug this feature exists to kill: 12 x 290 must never reach the project total.
    expect(p.oneTime.netCents).toBe(390000);
    expect(p.oneTime.netCents).not.toBe(738000);
  });

  it('computes the minimum-term recurring value', () => {
    expect(monthlyGroup(p)!.minimumTerm.netCents).toBe(348000);
  });

  it('computes the minimum-term total contract value as a secondary figure', () => {
    expect(p.minimumTermTotal.netCents).toBe(738000);
  });
});

describe('VAT stays transparent on both sides', () => {
  it('applies VAT to the one-time amount', () => {
    const p = computeOfferPricing(packageLines(PACKAGES[0]));
    expect(p.oneTime.vatCents).toBe(74100);   // 19 % of 3.900,00
    expect(p.oneTime.grossCents).toBe(464100); // 4.641,00
  });

  it('applies VAT per billing interval, not to the whole term', () => {
    const m = monthlyGroup(computeOfferPricing(packageLines(PACKAGES[0])))!;
    expect(m.vatCents).toBe(5510);    // 19 % of 290,00
    expect(m.grossCents).toBe(34510); // 345,10 per month
    expect(m.minimumTerm.grossCents).toBe(414120); // 12 x 345,10, secondary only
  });

  it('honours a VAT-free treatment on a recurring line', () => {
    const line = monthlyLine('Betreuung', 290, 12, { vatTreatment: 'reverse_charge', vatRateBp: 0 });
    const m = monthlyGroup(computeOfferPricing([line]))!;
    expect(m.vatCents).toBe(0);
    expect(m.grossCents).toBe(29000);
  });
});

describe('payment plan applies to the one-time amount only', () => {
  const p = computeOfferPricing(packageLines(PACKAGES[0]));

  it('resolves percentages against the one-time net', () => {
    expect(milestoneAmountCents({ label: '50 % bei Auftragserteilung', percentageBp: 5000 }, p.oneTime.netCents)).toBe(195000);
    expect(milestoneAmountCents({ label: '50 % nach Übergabe', percentageBp: 5000 }, p.oneTime.netCents)).toBe(195000);
  });

  it('excludes the recurring amount from the instalments', () => {
    const src = buildPremiumSource(docFrom(packageLines(PACKAGES[0]), {
      paymentSchedule: [
        { label: 'Bei Auftragserteilung', percentageBp: 5000 },
        { label: 'Nach Fertigstellung und Übergabe', percentageBp: 5000 },
      ],
    }));
    // 2 x 1.950,00, summing to the one-time net — never to 3.690,00 (half of 7.380).
    expect(src.payment.rows.map((r) => r.amountLabel)).toEqual(['1.950,00 €', '1.950,00 €']);
    expect(src.payment.balanced).toBe(true);
    expect(src.payment.scopeNote).toMatch(/einmalige Projektinvestition/);
  });

  it('says nothing about scope when there is no recurring position', () => {
    const src = buildPremiumSource(docFrom([oneTimeLine('Projekt', 3900)], {
      paymentSchedule: [{ label: 'Voll', percentageBp: 10000 }],
    }));
    expect(src.payment.scopeNote).toBeNull();
  });
});

describe('optional positions stay out of committed totals', () => {
  it('excludes an optional one-time item', () => {
    const p = computeOfferPricing([oneTimeLine('Projekt', 3900), oneTimeLine('Extra', 1000, { isOptional: true })]);
    expect(p.oneTime.netCents).toBe(390000);
    expect(p.optionalOneTime.netCents).toBe(100000);
  });

  it('excludes an optional recurring item', () => {
    const p = computeOfferPricing([
      monthlyLine('Betreuung', 290, 12),
      monthlyLine('Zusatz-Monitoring', 90, 12, { isOptional: true }),
    ]);
    expect(monthlyGroup(p)!.netCents).toBe(29000);
    expect(p.optionalRecurring[0].netCents).toBe(9000);
    // The optional recurring commitment must not reach the contract-value figure either.
    expect(p.minimumTermTotal.netCents).toBe(348000);
  });
});

describe('quantity and minimum term are independent', () => {
  it('multiplies quantity into the per-interval amount', () => {
    const licences = withMath({
      description: '5 Lizenzen', quantityMilli: 5000, unit: 'Lizenz', unitPriceCents: 20 * EUR,
      vatRateBp: VAT_19, vatTreatment: 'standard',
      pricingType: 'recurring', billingInterval: 'monthly', minimumTermMonths: 12,
    });
    const m = monthlyGroup(computeOfferPricing([licences]))!;
    expect(m.netCents).toBe(10000);              // 100,00 per month
    expect(m.minimumTermMonths).toBe(12);
    expect(m.minimumTerm.netCents).toBe(120000); // 1.200,00 over the term
  });

  it('leaves the per-interval amount unchanged when the term changes', () => {
    const short = monthlyGroup(computeOfferPricing([monthlyLine('Betreuung', 290, 6)]))!;
    const long = monthlyGroup(computeOfferPricing([monthlyLine('Betreuung', 290, 24)]))!;
    expect(short.netCents).toBe(long.netCents);
    expect(short.minimumTerm.netCents).toBe(174000);
    expect(long.minimumTerm.netCents).toBe(696000);
  });

  it('reports no shared term when positions disagree', () => {
    const p = computeOfferPricing([monthlyLine('A', 100, 12), monthlyLine('B', 50, 24)]);
    const m = monthlyGroup(p)!;
    expect(m.minimumTermMonths).toBeNull();
    expect(m.netCents).toBe(15000);
    // Each line still contributes its own term value: 12 x 100 + 24 x 50.
    expect(m.minimumTerm.netCents).toBe(120000 + 120000);
  });
});

describe('backward compatibility with historical offers', () => {
  it('does not reinterpret a legacy "12 x Monat" line as recurring', () => {
    // Exactly the shape the old editor produced. It must keep behaving as one position of
    // 3.480,00 in the project total — silently converting it would restate a signed document.
    const legacy = withMath({
      description: 'Betreuung', quantityMilli: 12000, unit: 'Monat', unitPriceCents: 290 * EUR,
      vatRateBp: VAT_19, vatTreatment: 'standard',
    });
    const p = computeOfferPricing([oneTimeLine('Einrichtung', 3900), legacy]);
    expect(p.hasRecurring).toBe(false);
    expect(p.oneTime.netCents).toBe(390000 + 348000);
    expect(p.recurring).toEqual([]);
  });

  it('reads a pre-recurring finalized snapshot as one-time', () => {
    const doc = snapshotToDocument({
      offer: { title: 'Alt', currency: 'EUR', net_total_cents: 348000, vat_total_cents: 66120, gross_total_cents: 414120 },
      lines: [{
        description: 'Betreuung', unit: 'Monat', quantity_milli: 12000, unit_price_cents: 29000,
        vat_rate_bp: 1900, vat_treatment: 'standard', net_cents: 348000, vat_cents: 66120,
        gross_cents: 414120, is_optional: false, sort_order: 0,
      }],
      seller: {}, recipient: {}, document_settings: {},
    });
    expect(doc.lines[0].pricingType).toBe('one_time');
    expect(doc.lines[0].minimumTermMonths).toBeNull();
    const src = buildPremiumSource(doc);
    expect(src.investment.recurring).toEqual([]);
    expect(src.investment.isSplit).toBe(false);
    expect(src.investment.oneTime!.netLabel).toBe('3.480,00 €');
    expect(src.modules[0].recurring).toBeNull();
    expect(src.investment.minimumTermTotalNetLabel).toBeNull();
  });

  it('carries recurring fields through a snapshot that has them', () => {
    const doc = snapshotToDocument({
      offer: { title: 'Neu', currency: 'EUR' },
      lines: [{
        description: 'Betreuung', unit: 'Monat', quantity_milli: 1000, unit_price_cents: 29000,
        vat_rate_bp: 1900, vat_treatment: 'standard', net_cents: 29000, vat_cents: 5510,
        gross_cents: 34510, is_optional: false, sort_order: 0,
        pricing_type: 'recurring', billing_interval: 'monthly', minimum_term_months: 12,
        billing_start_type: 'commissioning', billing_start_label: null,
      }],
      seller: {}, recipient: {}, document_settings: {},
    });
    expect(doc.lines[0].pricingType).toBe('recurring');
    expect(doc.lines[0].minimumTermMonths).toBe(12);
    expect(monthlyGroup(computeOfferPricing(doc.lines))!.netCents).toBe(29000);
  });
});

describe('editor, preview, document and portal agree', () => {
  const lines = packageLines(PACKAGES[0]);

  it('derives identical totals from stored rows and from document items', () => {
    // The editor path: OwnerOfferLine rows -> DocumentLineItem -> pricing.
    const rows: OwnerOfferLine[] = lines.map((l, i) => ({
      id: `l${i}`, offer_id: 'o', description: l.description, details: null, deliverables: [],
      phase_label: null, duration_label: null, quantity_milli: l.quantityMilli, unit: l.unit,
      unit_price_cents: l.unitPriceCents, net_cents: l.netCents, vat_rate_bp: l.vatRateBp,
      vat_treatment: l.vatTreatment, vat_cents: l.vatCents, gross_cents: l.grossCents,
      is_optional: false, sort_order: i,
      pricing_type: l.pricingType ?? 'one_time',
      billing_interval: l.billingInterval ?? null,
      minimum_term_months: l.minimumTermMonths ?? null,
      billing_start_type: l.billingStartType ?? null,
      billing_start_label: l.billingStartLabel ?? null,
    }));
    expect(computeOfferPricing(offerLinesToDocumentItems(rows))).toEqual(computeOfferPricing(lines));
  });

  it('derives identical totals from the customer-portal projection', () => {
    const projected: PublicOfferLine[] = lines.map((l) => ({
      description: l.description, quantity_milli: l.quantityMilli, unit: l.unit,
      unit_price_cents: l.unitPriceCents, vat_rate_bp: l.vatRateBp, vat_treatment: l.vatTreatment,
      net_cents: l.netCents, vat_cents: l.vatCents, gross_cents: l.grossCents, is_optional: false,
      pricing_type: l.pricingType ?? 'one_time',
      billing_interval: l.billingInterval ?? null,
      minimum_term_months: l.minimumTermMonths ?? null,
      billing_start_type: l.billingStartType ?? null,
      billing_start_label: l.billingStartLabel ?? null,
    }));
    const portal = computeOfferPricing(publicLinesToDocumentItems(projected));
    expect(portal.oneTime).toEqual(computeOfferPricing(lines).oneTime);
    expect(monthlyGroup(portal)!.netCents).toBe(29000);
    expect(portal.minimumTermTotal.netCents).toBe(738000);
  });

  it('renders the same figures through the shared premium source (preview + PDF)', () => {
    const src = buildPremiumSource(docFrom(lines));
    expect(src.investment.oneTime!.netLabel).toBe('3.900,00 €');
    expect(src.investment.oneTime!.grossLabel).toBe('4.641,00 €');
    expect(src.investment.recurring[0].netLabel).toBe('290,00 €');
    expect(src.investment.recurring[0].grossLabel).toBe('345,10 €');
    expect(src.investment.recurring[0].suffix).toBe('/ Monat');
    expect(src.investment.recurring[0].minimumTermLabel).toBe('12 Monate');
    expect(src.investment.recurring[0].billingStartLabel).toBe('ab Inbetriebnahme');
    expect(src.investment.isSplit).toBe(true);
    // The first-term value is present but secondary.
    expect(src.investment.minimumTermTotalNetLabel).toBe('7.380,00 €');
    // The premium source exposes the raw pricing too — identical to the direct computation.
    expect(src.pricing).toEqual(computeOfferPricing(lines));
  });

  it('renders a recurring position per interval, not multiplied out', () => {
    const src = buildPremiumSource(docFrom(lines));
    const recurringModule = src.modules.find((m) => m.recurring !== null)!;
    expect(recurringModule.netLabel).toBe('290,00 €');
    expect(recurringModule.netLabel).not.toContain('3.480');
    expect(recurringModule.recurring).toEqual({
      suffix: '/ Monat', intervalAdverb: 'monatlich',
      minimumTermLabel: '12 Monate', billingStartLabel: 'ab Inbetriebnahme',
    });
  });
});

describe('offer to invoice conversion', () => {
  // The initial invoice is the ONE-TIME project charge only. Recurring positions are a
  // separate billing track — typically starting only after go-live/commissioning — and must
  // never appear on this invoice, not at one period and not at the whole minimum term. An
  // earlier version of this RPC copied each recurring line at one billing period, which
  // produced "setup + one month" the instant an offer was accepted, before the recurring
  // charge's own billing start had even occurred. That is exactly the bug this policy exists
  // to prevent.
  function invoicedNet(lines: DocumentLineItem[]): number {
    return lines
      .filter((l) => !l.isOptional && pricingTypeOf(l) === 'one_time')
      .reduce((sum, l) => sum + l.netCents, 0);
  }

  it('invoices the one-time amount only — never setup plus a month, never setup plus the term', () => {
    const lines = packageLines(PACKAGES[0]);
    expect(invoicedNet(lines)).toBe(390000);
    expect(invoicedNet(lines)).not.toBe(390000 + 29000);
    expect(invoicedNet(lines)).not.toBe(738000);
  });

  it('excludes recurring lines from the invoice regardless of quantity or term', () => {
    const short = packageLines({ ...PACKAGES[0], term: 6 });
    const long = packageLines({ ...PACKAGES[0], term: 36 });
    expect(invoicedNet(short)).toBe(390000);
    expect(invoicedNet(long)).toBe(390000);
  });

  it('produces a zero-line invoice for a recurring-only offer rather than inventing a charge', () => {
    expect(invoicedNet([monthlyLine('Betreuung', 290, 12)])).toBe(0);
  });

  it('SV Heinersreuth Admin: the initial invoice is 3.900 EUR, split 50/50, and never touches the 290 EUR/Monat', () => {
    // Exactly the scenario from the commercial spec: setup 3.900 EUR, 50/50 payment plan,
    // recurring 290 EUR/Monat starting ab Inbetriebnahme. The invoice must be 3.900 EUR — not
    // 3.900 + 290, and never 3.900 + 12 x 290.
    const lines = [
      oneTimeLine('Einrichtung & Inbetriebnahme', 3900),
      monthlyLine('Laufende Betreuung & Betrieb', 290, 12),
    ];
    const invoiced = invoicedNet(lines);
    expect(invoiced).toBe(390000);

    const rate1 = milestoneAmountCents({ label: '50 % bei Auftragserteilung', percentageBp: 5000 }, invoiced);
    const rate2 = milestoneAmountCents({ label: '50 % nach Fertigstellung und Übergabe', percentageBp: 5000 }, invoiced);
    expect(rate1).toBe(195000);
    expect(rate2).toBe(195000);
    expect(rate1! + rate2!).toBe(invoiced);

    // The recurring commitment is untouched by the invoice — it stays a per-position fact on
    // the offer, ready to be billed separately once its own billing start actually occurs.
    const recurring = lines.find((l) => pricingTypeOf(l) === 'recurring')!;
    expect(recurring.billingStartType).toBe('commissioning'); // "ab Inbetriebnahme"
    expect(recurring.netCents).toBe(29000);
  });

  it('never copies a recurring line onto the invoice in the SQL', () => {
    // Guards the actual migration text. The conversion function has TWO ways to build invoice
    // lines now — the full-amount loop and the per-rate VAT-group loop (see
    // offerInvoiceConversion.test.ts for the detailed rate-selection behaviour) — but neither
    // may ever source from a recurring line.
    const code = MIGRATION_SQL.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n');
    const conversion = code.slice(code.indexOf('function public.convert_owner_offer_to_invoice_draft'));
    const body = conversion.slice(0, conversion.indexOf('update public.owner_offers set converted_invoice_id'));
    // Every "for v_line in select ..." loop that walks owner_offer_lines is explicitly
    // filtered to one-time; the rate branch groups instead of looping per line, so it has no
    // such loop at all — its own SQL guard is 'group by vat_rate_bp, vat_treatment' among
    // one-time lines, asserted in offerInvoiceConversion.test.ts.
    const loops = body.match(/for v_line in select \* from public\.owner_offer_lines[\s\S]*?end loop;/g) ?? [];
    expect(loops).toHaveLength(1);
    expect(loops[0]).toMatch(/pricing_type = 'one_time'/);
    expect(loops[0]).not.toMatch(/pricing_type = 'recurring'/);
    // Every query that FEEDS an insert (the full-amount loop, and the rate branch's two
    // "group by vat_rate_bp" queries) is one-time only; the ONLY reference to
    // pricing_type = 'recurring' anywhere in the function is the separate count used purely
    // to report `recurring_lines_excluded` back to the caller — never to source an insert.
    const occurrences = [...body.matchAll(/pricing_type = 'recurring'/g)];
    expect(occurrences).toHaveLength(1);
    const context = body.slice(Math.max(0, occurrences[0].index! - 200), occurrences[0].index!);
    expect(context).toMatch(/select count\(\*\) into v_recurring_excluded/);
    // The excluded count is reported back to the caller (checked against the whole function,
    // since it is computed and returned after the insert loop, past the `body` truncation point).
    const fnEnd = conversion.indexOf('$fn$;');
    expect(conversion.slice(0, fnEnd)).toMatch(/recurring_lines_excluded/);
  });

  it('surfaces the excluded count to the caller instead of silently dropping it', () => {
    expect(MIGRATION_SQL).toMatch(/recurring_lines_excluded/);
    expect(MIGRATION_SQL).not.toMatch(/recurring_lines_billed_once/);
  });
});

describe('the migration keeps historical data intact', () => {
  it('adds recurring columns without rewriting existing rows', () => {
    expect(MIGRATION_SQL).toMatch(/add column if not exists pricing_type text not null default 'one_time'/);
    // Additive only: no backfill, no reinterpretation of legacy "12 x Monat" positions.
    expect(MIGRATION_SQL).not.toMatch(/update public\.owner_offer_lines\s+set pricing_type/);
  });

  it('keeps the classic totals columns as the one-time totals', () => {
    expect(MIGRATION_SQL).toMatch(/sum\(net_cents\)\s+filter \(where pricing_type = 'one_time'\)/);
    expect(MIGRATION_SQL).toMatch(/recurring_monthly_net_cents = coalesce\(agg\.mon_net, 0\)/);
  });

  it('freezes the recurring commitment on a finalized offer', () => {
    expect(MIGRATION_SQL).toMatch(/new\.recurring_monthly_net_cents is distinct from old\.recurring_monthly_net_cents/);
  });
});

describe('the SV Heinersreuth packages', () => {
  for (const p of PACKAGES) {
    it(`${p.name}: ${p.setup} € einmalig + ${p.monthly} € / Monat over ${p.term} months`, () => {
      const pricing = computeOfferPricing(packageLines(p));
      const m = monthlyGroup(pricing)!;

      expect(pricing.oneTime.netCents).toBe(p.setup * EUR);
      expect(m.netCents).toBe(p.monthly * EUR);
      expect(m.minimumTermMonths).toBe(p.term);
      expect(m.minimumTerm.netCents).toBe(p.termRecurringNet * EUR);
      expect(pricing.minimumTermTotal.netCents).toBe(p.contractNet * EUR);

      // The primary presentation is the split, and the contract value is not the headline.
      const src = buildPremiumSource(docFrom(packageLines(p)));
      expect(src.investment.oneTime!.netLabel).toBe(`${p.setup.toLocaleString('de-DE')},00 €`);
      expect(src.investment.recurring[0].netLabel).toBe(`${p.monthly},00 €`);
      expect(src.investment.recurring[0].suffix).toBe('/ Monat');
      expect(src.investment.isSplit).toBe(true);
    });
  }
});

describe('German labels', () => {
  it('names the billing start and interval', () => {
    expect(billingStartText({ type: 'commissioning', label: null })).toBe('ab Inbetriebnahme');
    expect(billingStartText({ type: 'go_live', label: null })).toBe('ab Go-Live');
    expect(billingStartText({ type: 'custom', label: 'ab Abnahme Phase 2' })).toBe('ab Abnahme Phase 2');
    expect(billingStartText(null)).toBeNull();
    expect(intervalSuffix('monthly')).toBe('/ Monat');
    expect(intervalAdverb('monthly')).toBe('monatlich');
  });

  it('singularises a one-month term', () => {
    const src = buildPremiumSource(docFrom([monthlyLine('Betreuung', 290, 1)]));
    expect(src.investment.recurring[0].minimumTermLabel).toBe('1 Monat');
  });

  it('omits the term line when a recurring position has none', () => {
    const src = buildPremiumSource(docFrom([monthlyLine('Betreuung', 290, null)]));
    expect(src.investment.recurring[0].minimumTermLabel).toBeNull();
    expect(src.investment.minimumTermTotalNetLabel).toBeNull();
  });
});
