// Commercial pricing model for transactional documents: one-time investment and recurring
// commitments are separate first-class amounts, never a single fused headline.
//
// This is the ONLY place offer/invoice totals are derived. The editor, the HTML live preview,
// the @react-pdf document and the customer portal all call `computeOfferPricing`, so the four
// surfaces cannot disagree about what the customer pays.
//
// Conventions:
//   * A line without an explicit `pricingType` is one-time. Historical offers and finalized
//     snapshots carry no pricing type, so they keep exactly their original presentation.
//   * For a recurring line, `netCents` (= quantity x unit price) is the amount PER BILLING
//     INTERVAL. 5 licences x 20 EUR = 100 EUR / month.
//   * The minimum term is contract metadata and is never folded into quantity. It only
//     produces the secondary "value over the first minimum term" figure.
//   * Optional lines are excluded from committed totals, one-time and recurring alike.
//
// Pure and dependency-free (safe for the node test harness).

import type {
  DocumentLineItem, PricingType, BillingInterval, BillingStartType,
} from './documentModel';

export interface MoneyTotals {
  netCents: number;
  vatCents: number;
  grossCents: number;
}

export interface RecurringGroup extends MoneyTotals {
  interval: BillingInterval;
  /** Shared minimum term when every line in the group agrees, otherwise null. */
  minimumTermMonths: number | null;
  /** Shared billing start when every line in the group agrees, otherwise null. */
  billingStart: BillingStartLabelParts | null;
  /** Recurring net/vat/gross accumulated over each line's own minimum term. */
  minimumTerm: MoneyTotals;
}

export interface BillingStartLabelParts {
  type: BillingStartType;
  label: string | null;
}

export interface OfferPricing {
  /** Committed one-time positions. */
  oneTime: MoneyTotals;
  /** Committed recurring positions, grouped by billing interval. */
  recurring: RecurringGroup[];
  /** Optional positions, kept out of every committed total. */
  optionalOneTime: MoneyTotals;
  optionalRecurring: RecurringGroup[];
  /**
   * Secondary transparency figure: one-time investment plus every recurring commitment over
   * its own minimum term. Present so the customer can see the full first-term value — never
   * the headline price, and never payable up front.
   */
  minimumTermTotal: MoneyTotals;
  /** True when the document mixes one-time and recurring commitments. */
  hasRecurring: boolean;
  hasOneTime: boolean;
}

const ZERO: MoneyTotals = { netCents: 0, vatCents: 0, grossCents: 0 };

/** A line's pricing type, defaulting to one-time for records written before recurring existed. */
export function pricingTypeOf(line: DocumentLineItem): PricingType {
  return line.pricingType === 'recurring' ? 'recurring' : 'one_time';
}

/** A recurring line's interval, defaulting to monthly (the only interval accepted today). */
export function billingIntervalOf(line: DocumentLineItem): BillingInterval {
  return line.billingInterval ?? 'monthly';
}

function add(a: MoneyTotals, b: MoneyTotals): MoneyTotals {
  return { netCents: a.netCents + b.netCents, vatCents: a.vatCents + b.vatCents, grossCents: a.grossCents + b.grossCents };
}

function lineMoney(l: DocumentLineItem): MoneyTotals {
  return { netCents: l.netCents, vatCents: l.vatCents, grossCents: l.grossCents };
}

function scale(m: MoneyTotals, factor: number): MoneyTotals {
  return { netCents: m.netCents * factor, vatCents: m.vatCents * factor, grossCents: m.grossCents * factor };
}

function billingStartOf(l: DocumentLineItem): BillingStartLabelParts | null {
  if (!l.billingStartType) return null;
  return { type: l.billingStartType, label: l.billingStartLabel?.trim() || null };
}

function sameBillingStart(a: BillingStartLabelParts | null, b: BillingStartLabelParts | null): boolean {
  if (a === null || b === null) return a === b;
  return a.type === b.type && a.label === b.label;
}

/** Group recurring lines by interval, summing per-interval amounts and minimum-term value. */
function groupRecurring(lines: DocumentLineItem[]): RecurringGroup[] {
  const groups = new Map<BillingInterval, RecurringGroup>();
  // Tracked separately so "all lines agree" collapses to a shared value and any disagreement
  // collapses to null (the renderers then fall back to the per-position detail).
  const termAgreement = new Map<BillingInterval, { term: number | null; mixed: boolean }>();
  const startAgreement = new Map<BillingInterval, { start: BillingStartLabelParts | null; mixed: boolean }>();

  for (const l of lines) {
    const interval = billingIntervalOf(l);
    const money = lineMoney(l);
    const term = typeof l.minimumTermMonths === 'number' && l.minimumTermMonths > 0 ? l.minimumTermMonths : null;
    const start = billingStartOf(l);

    const existing = groups.get(interval);
    if (existing) {
      const merged = add(existing, money);
      existing.netCents = merged.netCents;
      existing.vatCents = merged.vatCents;
      existing.grossCents = merged.grossCents;
      existing.minimumTerm = add(existing.minimumTerm, scale(money, term ?? 0));
    } else {
      groups.set(interval, {
        interval, ...money,
        minimumTermMonths: term,
        billingStart: start,
        minimumTerm: scale(money, term ?? 0),
      });
      termAgreement.set(interval, { term, mixed: false });
      startAgreement.set(interval, { start, mixed: false });
      continue;
    }

    const ta = termAgreement.get(interval)!;
    if (ta.term !== term) ta.mixed = true;
    const sa = startAgreement.get(interval)!;
    if (!sameBillingStart(sa.start, start)) sa.mixed = true;
  }

  for (const [interval, group] of groups) {
    const ta = termAgreement.get(interval);
    const sa = startAgreement.get(interval);
    if (ta?.mixed) group.minimumTermMonths = null;
    if (sa?.mixed) group.billingStart = null;
  }
  return [...groups.values()];
}

/**
 * Split the document's positions into committed one-time, committed recurring (by interval)
 * and their optional counterparts, plus the secondary first-minimum-term contract value.
 */
export function computeOfferPricing(lines: DocumentLineItem[]): OfferPricing {
  const committed = lines.filter((l) => !l.isOptional);
  const optional = lines.filter((l) => l.isOptional);

  const committedOneTime = committed.filter((l) => pricingTypeOf(l) === 'one_time');
  const committedRecurring = committed.filter((l) => pricingTypeOf(l) === 'recurring');
  const optionalOneTime = optional.filter((l) => pricingTypeOf(l) === 'one_time');
  const optionalRecurring = optional.filter((l) => pricingTypeOf(l) === 'recurring');

  const oneTime = committedOneTime.map(lineMoney).reduce(add, ZERO);
  const recurring = groupRecurring(committedRecurring);

  const minimumTermTotal = recurring.map((g) => g.minimumTerm).reduce(add, oneTime);

  return {
    oneTime,
    recurring,
    optionalOneTime: optionalOneTime.map(lineMoney).reduce(add, ZERO),
    optionalRecurring: groupRecurring(optionalRecurring),
    minimumTermTotal,
    hasRecurring: committedRecurring.length > 0,
    hasOneTime: committedOneTime.length > 0,
  };
}

/** The monthly group, or null when the document has no committed monthly commitment. */
export function monthlyGroup(pricing: OfferPricing): RecurringGroup | null {
  return pricing.recurring.find((g) => g.interval === 'monthly') ?? null;
}

const BILLING_START_LABEL: Record<BillingStartType, string> = {
  commissioning: 'ab Inbetriebnahme',
  order: 'ab Auftragserteilung',
  go_live: 'ab Go-Live',
  handover: 'ab Übergabe',
  custom: '',
};

/** German display text for a billing start. `custom` renders the stored free-text label. */
export function billingStartText(start: BillingStartLabelParts | null): string | null {
  if (!start) return null;
  if (start.type === 'custom') return start.label;
  return BILLING_START_LABEL[start.type] ?? start.label;
}

const INTERVAL_SUFFIX: Record<BillingInterval, string> = { monthly: '/ Monat' };
const INTERVAL_ADVERB: Record<BillingInterval, string> = { monthly: 'monatlich' };

/** "/ Monat" — appended to a formatted recurring amount. */
export function intervalSuffix(interval: BillingInterval): string {
  return INTERVAL_SUFFIX[interval];
}

/** "monatlich" — used for the "Abrechnung: …" detail line. */
export function intervalAdverb(interval: BillingInterval): string {
  return INTERVAL_ADVERB[interval];
}
