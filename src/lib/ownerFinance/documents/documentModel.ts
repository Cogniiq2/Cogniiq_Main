// Shared transactional document model for offers AND invoices. One model, one renderer, one hash —
// so an Angebot and a Rechnung are never rendered by divergent code paths. Money is integer cents,
// quantities integer milli-units. Pure and dependency-free (safe for the node test harness).

export type TransactionalDocumentKind = 'offer' | 'invoice';

export interface DocumentParty {
  name: string;
  contactName?: string | null;
  department?: string | null;
  addressLines: string[];
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  vatId?: string | null;
  taxNumber?: string | null;
}

export interface DocumentLineItem {
  /** Short position/module title. */
  description: string;
  /** Optional longer explanation of the module. */
  details?: string | null;
  /** Bullet deliverables included in the module. */
  deliverables?: string[];
  phaseLabel?: string | null;
  durationLabel?: string | null;
  quantityMilli: number;
  unit: string;
  unitPriceCents: number;
  vatRateBp: number;
  vatTreatment: string;
  netCents: number;
  vatCents: number;
  grossCents: number;
  isOptional?: boolean;
}

/** A project timeline phase (premium offers). */
export interface TimelinePhase {
  phase?: string | null;
  title?: string | null;
  duration?: string | null;
  description?: string | null;
}

/** A payment-plan milestone. Either a percentage (basis points) or a fixed amount (cents). */
export interface PaymentMilestone {
  label: string;
  percentageBp?: number | null;
  amountCents?: number | null;
  note?: string | null;
}

export interface DocumentBankInfo {
  holder?: string | null;
  iban?: string | null;
  bic?: string | null;
  bankName?: string | null;
}

export interface TransactionalDocument {
  kind: TransactionalDocumentKind;
  language: 'de' | 'en';
  documentNumber: string | null;
  title?: string | null;
  seller: DocumentParty;
  recipient: DocumentParty;
  issueDate: string | null;
  /** Offers: validity date. */
  validUntil?: string | null;
  /** Invoices: due date. */
  dueDate?: string | null;
  serviceDate?: string | null;
  servicePeriodStart?: string | null;
  servicePeriodEnd?: string | null;
  currency: string;
  /** Premium offer cover subtitle. */
  subtitle?: string | null;
  /** Short value proposition rendered on the cover. */
  valueProposition?: string | null;
  introduction?: string | null;
  executiveSummary?: string | null;
  desiredOutcomes?: string[];
  projectApproach?: string | null;
  scope?: string | null;
  timeline?: TimelinePhase[];
  paymentSchedule?: PaymentMilestone[];
  nextSteps?: string | null;
  assumptions?: string | null;
  exclusions?: string | null;
  /** Brand accent hex (e.g. "#0F766E") for the premium template. */
  brandAccent?: string | null;
  /** Template key, e.g. "cogniiq-premium-offer-v2". */
  templateKey?: string | null;
  lines: DocumentLineItem[];
  netTotalCents: number;
  vatTotalCents: number;
  grossTotalCents: number;
  paymentTerms?: string | null;
  deliveryTerms?: string | null;
  /** Invoice payment info (rendered onto invoices only). */
  bank?: DocumentBankInfo | null;
  footer?: string | null;
  closing?: string | null;
  /** Whether this is a draft (renders a DRAFT/ENTWURF marker, blocks finalization if invalid). */
  isDraft: boolean;
  templateVersion: string;
}

export interface VatBreakdownRow {
  rateBp: number;
  vatTreatment: string;
  netCents: number;
  vatCents: number;
}

/** Aggregate a VAT breakdown by (rate, treatment) over the non-optional lines. */
export function vatBreakdown(lines: DocumentLineItem[]): VatBreakdownRow[] {
  const map = new Map<string, VatBreakdownRow>();
  for (const l of lines) {
    if (l.isOptional) continue;
    const key = `${l.vatRateBp}:${l.vatTreatment}`;
    const existing = map.get(key);
    if (existing) {
      existing.netCents += l.netCents;
      existing.vatCents += l.vatCents;
    } else {
      map.set(key, { rateBp: l.vatRateBp, vatTreatment: l.vatTreatment, netCents: l.netCents, vatCents: l.vatCents });
    }
  }
  return [...map.values()].sort((a, b) => b.rateBp - a.rateBp);
}

export const TRANSACTIONAL_TEMPLATE_VERSION = 'transactional-v1';
export const PREMIUM_OFFER_TEMPLATE_KEY = 'cogniiq-premium-offer-v2';

/** Base (non-optional) modules — counted in the investment total. */
export function baseModules(lines: DocumentLineItem[]): DocumentLineItem[] {
  return lines.filter((l) => !l.isOptional);
}

/** Optional modules — shown separately, excluded from the base total. */
export function optionalModules(lines: DocumentLineItem[]): DocumentLineItem[] {
  return lines.filter((l) => l.isOptional);
}

/**
 * Resolve a payment milestone to a concrete cents amount against the base net total.
 * Percentage milestones win; an explicit amount is used as a fallback.
 */
export function milestoneAmountCents(m: PaymentMilestone, baseNetCents: number): number | null {
  if (typeof m.percentageBp === 'number') return Math.round((baseNetCents * m.percentageBp) / 10000);
  if (typeof m.amountCents === 'number') return m.amountCents;
  return null;
}

/** Sum of milestone percentages in basis points (only for milestones that use a percentage). */
export function paymentScheduleTotalBp(schedule: PaymentMilestone[] | undefined | null): number {
  return (schedule ?? []).reduce((s, m) => s + (typeof m.percentageBp === 'number' ? m.percentageBp : 0), 0);
}

/** True when every milestone is a percentage and they sum to exactly 100 %. */
export function paymentScheduleBalanced(schedule: PaymentMilestone[] | undefined | null): boolean {
  const list = schedule ?? [];
  if (list.length === 0) return true;
  if (!list.every((m) => typeof m.percentageBp === 'number')) return true; // amount-based schedules are not %-validated
  return paymentScheduleTotalBp(list) === 10000;
}
