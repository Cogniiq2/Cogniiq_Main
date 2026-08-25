// Deterministic, presentation-agnostic source model for the premium transactional
// document. BOTH the @react-pdf PDF engine and the HTML live preview consume THIS model,
// so there is never divergent business logic between preview and print. Pure & dependency
// -light (only the shared formatters), safe for the node PDF/test harness.

import {
  formatCentsCurrencyDe, formatBpPercentDe, formatDateDe,
} from '../../exports/format';
import {
  baseModules, optionalModules, vatBreakdown, milestoneAmountCents, paymentScheduleTotalBp,
  type TransactionalDocument, type DocumentLineItem, type PaymentMilestone,
} from '../documentModel';
import {
  computeOfferPricing, pricingTypeOf, billingIntervalOf, billingStartText,
  intervalSuffix, intervalAdverb,
  type OfferPricing, type RecurringGroup,
} from '../offerPricing';
import { asListOrProse, type TextBlock } from '../listFields';

/** Recurring presentation for a single position ("290,00 € netto / Monat", term, start). */
export interface PremiumModuleRecurring {
  suffix: string;                    // "/ Monat"
  intervalAdverb: string;            // "monatlich"
  minimumTermLabel: string | null;   // "12 Monate"
  billingStartLabel: string | null;  // "ab Inbetriebnahme"
}

export interface PremiumModule {
  index: number;          // 1-based, base modules only
  title: string;
  details: string | null;
  deliverables: string[];
  phaseLabel: string | null;
  durationLabel: string | null;
  /**
   * Formatted net price. For a recurring position this is the amount PER INTERVAL — the
   * interval is carried by `recurring.suffix`, never multiplied into the figure.
   */
  netLabel: string;
  /** Non-null exactly for recurring positions. */
  recurring: PremiumModuleRecurring | null;
  isOptional: boolean;
}

export interface PremiumVatRow { label: string; net: string; vat: string }

/** The one-time (project) investment: paid once, per the payment plan. */
export interface PremiumOneTimeBlock {
  netLabel: string;
  vatRows: PremiumVatRow[];
  vatTotalLabel: string;
  grossLabel: string;
}

/** An ongoing commitment for one billing interval. Amounts are PER INTERVAL. */
export interface PremiumRecurringBlock {
  suffix: string;                        // "/ Monat"
  intervalAdverb: string;                // "monatlich"
  netLabel: string;                      // "290,00 €"
  grossLabel: string;                    // "345,10 €"
  vatRows: PremiumVatRow[];
  vatTotalLabel: string;
  minimumTermLabel: string | null;       // "12 Monate"
  billingStartLabel: string | null;      // "ab Inbetriebnahme"
  /** Secondary: what the recurring commitment adds up to over its minimum term. */
  minimumTermNetLabel: string | null;
  minimumTermGrossLabel: string | null;
}

export interface PremiumInvestment {
  /** Null when the document has no committed one-time position. */
  oneTime: PremiumOneTimeBlock | null;
  /** One block per committed billing interval. Empty for a purely one-time offer. */
  recurring: PremiumRecurringBlock[];
  /** True when one-time and recurring commitments coexist and must be shown apart. */
  isSplit: boolean;
  /**
   * Secondary transparency figure: one-time investment plus every recurring commitment over
   * its minimum term. Null unless the document actually has a recurring minimum term, and
   * never the headline price.
   */
  minimumTermTotalNetLabel: string | null;
  minimumTermTotalGrossLabel: string | null;
}

export interface PremiumPaymentRow {
  label: string;
  right: string;          // "30 %" or an amount
  amountLabel: string | null;
  note: string | null;
}

export interface PremiumSource {
  kindLabel: string;                 // "Angebot" / "Rechnung"
  isDraft: boolean;
  documentNumber: string | null;
  draftBadge: string;                // "ENTWURF"
  title: string;
  subtitle: string | null;
  valueProposition: string | null;
  accent: string;
  seller: {
    legalName: string; addressLines: string[]; email: string | null; phone: string | null;
    website: string | null; vatId: string | null; taxNumber: string | null;
  };
  recipient: {
    company: string; contactName: string | null; department: string | null;
    addressLines: string[]; email: string | null; phone: string | null; vatId: string | null;
  };
  dates: { issueLabel: string; issue: string; validLabel: string; valid: string | null };
  introduction: string | null;
  projectApproach: string | null;
  executiveSummary: string | null;
  desiredOutcomes: string[];
  modules: PremiumModule[];
  optionalModules: PremiumModule[];
  investment: PremiumInvestment;
  /** Raw split totals, for callers that need the numbers rather than the labels. */
  pricing: OfferPricing;
  timeline: Array<{ phase: string | null; title: string | null; duration: string | null; description: string | null }>;
  cooperation: string | null;        // Mitwirkung des Kunden
  deliveryTerms: string | null;
  payment: {
    rows: PremiumPaymentRow[];
    note: string | null;
    balanced: boolean;
    /**
     * Set when the document also has recurring positions: the percentages resolve against the
     * one-time amount ONLY, and the reader must be told so explicitly.
     */
    scopeNote: string | null;
  };
  /**
   * Assumptions and exclusions are list-capable: the owner types one entry per line and the
   * renderers draw a bullet row per entry. Resolved once here so the PDF and the HTML preview
   * cannot disagree about whether a field is a list. See documents/listFields.ts.
   */
  assumptions: TextBlock | null;
  exclusions: TextBlock | null;
  closing: string | null;
  nextSteps: string | null;
  footer: string | null;
}

const KIND_LABEL: Record<string, string> = { offer: 'Angebot', invoice: 'Rechnung' };
const VAT_TREATMENT_LABEL: Record<string, string> = {
  standard: 'Umsatzsteuer', reduced: 'Umsatzsteuer (ermäßigt)', zero_rated: 'Nullsatz',
  exempt: 'Steuerfrei (§ 4 UStG)', reverse_charge: 'Reverse-Charge', outside_scope: 'Nicht steuerbar', unknown: 'USt offen',
};

/** "12 Monate" / "1 Monat" — null when the position has no minimum term. */
function termLabel(months: number | null | undefined): string | null {
  if (typeof months !== 'number' || months <= 0) return null;
  return `${months} ${months === 1 ? 'Monat' : 'Monate'}`;
}

function moduleRecurringFrom(l: DocumentLineItem): PremiumModuleRecurring | null {
  if (pricingTypeOf(l) !== 'recurring') return null;
  const interval = billingIntervalOf(l);
  return {
    suffix: intervalSuffix(interval),
    intervalAdverb: intervalAdverb(interval),
    minimumTermLabel: termLabel(l.minimumTermMonths),
    billingStartLabel: billingStartText(
      l.billingStartType ? { type: l.billingStartType, label: l.billingStartLabel?.trim() || null } : null,
    ),
  };
}

function moduleFrom(l: DocumentLineItem, index: number, currency: string): PremiumModule {
  return {
    index,
    title: l.description || `Modul ${index}`,
    details: l.details && l.details.trim() ? l.details.trim() : null,
    deliverables: (l.deliverables ?? []).filter((d) => d && d.trim().length > 0),
    phaseLabel: l.phaseLabel && l.phaseLabel.trim() ? l.phaseLabel.trim() : null,
    durationLabel: l.durationLabel && l.durationLabel.trim() ? l.durationLabel.trim() : null,
    netLabel: formatCentsCurrencyDe(l.netCents, currency),
    recurring: moduleRecurringFrom(l),
    isOptional: !!l.isOptional,
  };
}

function vatRowsFor(lines: DocumentLineItem[], currency: string): PremiumVatRow[] {
  return vatBreakdown(lines).map((b) => ({
    label: `${VAT_TREATMENT_LABEL[b.vatTreatment] ?? 'Umsatzsteuer'} ${formatBpPercentDe(b.rateBp)}`,
    net: formatCentsCurrencyDe(b.netCents, currency),
    vat: formatCentsCurrencyDe(b.vatCents, currency),
  }));
}

function recurringBlock(group: RecurringGroup, lines: DocumentLineItem[], currency: string): PremiumRecurringBlock {
  const hasTerm = group.minimumTerm.netCents > 0;
  return {
    suffix: intervalSuffix(group.interval),
    intervalAdverb: intervalAdverb(group.interval),
    netLabel: formatCentsCurrencyDe(group.netCents, currency),
    grossLabel: formatCentsCurrencyDe(group.grossCents, currency),
    vatRows: vatRowsFor(lines, currency),
    vatTotalLabel: formatCentsCurrencyDe(group.vatCents, currency),
    minimumTermLabel: termLabel(group.minimumTermMonths),
    billingStartLabel: billingStartText(group.billingStart),
    minimumTermNetLabel: hasTerm ? formatCentsCurrencyDe(group.minimumTerm.netCents, currency) : null,
    minimumTermGrossLabel: hasTerm ? formatCentsCurrencyDe(group.minimumTerm.grossCents, currency) : null,
  };
}

function buildInvestment(pricing: OfferPricing, base: DocumentLineItem[], currency: string): PremiumInvestment {
  const oneTimeLines = base.filter((l) => pricingTypeOf(l) === 'one_time');
  const oneTime: PremiumOneTimeBlock | null = pricing.hasOneTime
    ? {
      netLabel: formatCentsCurrencyDe(pricing.oneTime.netCents, currency),
      vatRows: vatRowsFor(oneTimeLines, currency),
      vatTotalLabel: formatCentsCurrencyDe(pricing.oneTime.vatCents, currency),
      grossLabel: formatCentsCurrencyDe(pricing.oneTime.grossCents, currency),
    }
    : null;

  const recurring = pricing.recurring.map((g) => recurringBlock(
    g, base.filter((l) => pricingTypeOf(l) === 'recurring' && billingIntervalOf(l) === g.interval), currency,
  ));

  // Only meaningful once a recurring minimum term actually contributes something; otherwise
  // it would just restate the one-time total under a misleading "contract value" label.
  const showTermTotal = pricing.recurring.some((g) => g.minimumTerm.netCents > 0);

  return {
    oneTime,
    recurring,
    isSplit: pricing.hasOneTime && pricing.hasRecurring,
    minimumTermTotalNetLabel: showTermTotal ? formatCentsCurrencyDe(pricing.minimumTermTotal.netCents, currency) : null,
    minimumTermTotalGrossLabel: showTermTotal ? formatCentsCurrencyDe(pricing.minimumTermTotal.grossCents, currency) : null,
  };
}

function paymentRow(m: PaymentMilestone, baseNet: number, currency: string): PremiumPaymentRow {
  const amount = milestoneAmountCents(m, baseNet);
  const right = typeof m.percentageBp === 'number' ? formatBpPercentDe(m.percentageBp) : (amount != null ? formatCentsCurrencyDe(amount, currency) : '—');
  return {
    label: m.label,
    right,
    amountLabel: typeof m.percentageBp === 'number' && amount != null ? formatCentsCurrencyDe(amount, currency) : null,
    note: m.note && m.note.trim() ? m.note.trim() : null,
  };
}

/** Build the deterministic premium source model from a TransactionalDocument. */
export function buildPremiumSource(doc: TransactionalDocument): PremiumSource {
  const currency = doc.currency;
  const base = baseModules(doc.lines);
  const optional = optionalModules(doc.lines);
  // Totals are derived from the positions, never read off the stored header totals, so the
  // editor's unsaved state, the live preview, the PDF and the customer portal always agree.
  const pricing = computeOfferPricing(doc.lines);
  // The payment plan resolves against the ONE-TIME amount only. Recurring charges are billed
  // on their own interval and are never part of a project instalment percentage.
  const baseNet = pricing.oneTime.netCents;

  const schedule = doc.paymentSchedule ?? [];

  return {
    kindLabel: KIND_LABEL[doc.kind] ?? 'Dokument',
    isDraft: doc.isDraft,
    documentNumber: doc.documentNumber,
    draftBadge: 'ENTWURF',
    title: doc.title ?? (doc.kind === 'invoice' ? 'Rechnung' : 'Angebot'),
    subtitle: doc.subtitle ?? null,
    valueProposition: doc.valueProposition ?? null,
    accent: doc.brandAccent && /^#[0-9A-Fa-f]{6}$/.test(doc.brandAccent) ? doc.brandAccent : '#0F766E',
    seller: {
      legalName: doc.seller.name || 'Cogniiq',
      addressLines: doc.seller.addressLines.filter((l) => l.trim()),
      email: doc.seller.email ?? null, phone: doc.seller.phone ?? null,
      website: (doc.seller as { website?: string | null }).website ?? null,
      vatId: doc.seller.vatId ?? null, taxNumber: doc.seller.taxNumber ?? null,
    },
    recipient: {
      company: doc.recipient.name || '—',
      contactName: doc.recipient.contactName ?? null,
      department: doc.recipient.department ?? null,
      addressLines: doc.recipient.addressLines.filter((l) => l.trim()),
      email: doc.recipient.email ?? null, phone: doc.recipient.phone ?? null,
      vatId: doc.recipient.vatId ?? null,
    },
    dates: {
      issueLabel: doc.kind === 'invoice' ? 'Rechnungsdatum' : 'Angebotsdatum',
      issue: formatDateDe(doc.issueDate),
      validLabel: doc.kind === 'invoice' ? 'Fällig bis' : 'Gültig bis',
      valid: doc.kind === 'invoice' ? (doc.dueDate ? formatDateDe(doc.dueDate) : null) : (doc.validUntil ? formatDateDe(doc.validUntil) : null),
    },
    introduction: doc.introduction ?? null,
    projectApproach: doc.projectApproach ?? null,
    executiveSummary: doc.executiveSummary ?? null,
    desiredOutcomes: (doc.desiredOutcomes ?? []).filter((o) => o && o.trim().length > 0),
    modules: base.map((l, i) => moduleFrom(l, i + 1, currency)),
    optionalModules: optional.map((l, i) => moduleFrom(l, i + 1, currency)),
    investment: buildInvestment(pricing, base, currency),
    pricing,
    timeline: (doc.timeline ?? []).map((t) => ({
      phase: t.phase ?? null, title: t.title ?? null, duration: t.duration ?? null, description: t.description ?? null,
    })),
    cooperation: null,
    deliveryTerms: doc.deliveryTerms ?? null,
    payment: {
      rows: schedule.map((m) => paymentRow(m, baseNet, currency)),
      note: doc.paymentTerms ?? null,
      balanced: schedule.length === 0 || !schedule.every((m) => typeof m.percentageBp === 'number') || paymentScheduleTotalBp(schedule) === 10000,
      scopeNote: pricing.hasRecurring && schedule.length > 0
        ? 'Die Raten beziehen sich auf die einmalige Projektinvestition. Wiederkehrende Leistungen werden separat gemäß ihrem Abrechnungsintervall berechnet.'
        : null,
    },
    assumptions: asListOrProse(doc.assumptions),
    exclusions: asListOrProse(doc.exclusions),
    closing: doc.closing ?? null,
    nextSteps: doc.nextSteps ?? null,
    footer: doc.footer ?? null,
  };
}
