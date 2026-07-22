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

export interface PremiumModule {
  index: number;          // 1-based, base modules only
  title: string;
  details: string | null;
  deliverables: string[];
  phaseLabel: string | null;
  durationLabel: string | null;
  netLabel: string;       // formatted net price
  isOptional: boolean;
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
  investment: {
    netLabel: string;
    vatRows: Array<{ label: string; net: string; vat: string }>;
    vatTotalLabel: string;
    grossLabel: string;
  };
  timeline: Array<{ phase: string | null; title: string | null; duration: string | null; description: string | null }>;
  cooperation: string | null;        // Mitwirkung des Kunden
  deliveryTerms: string | null;
  payment: { rows: PremiumPaymentRow[]; note: string | null; balanced: boolean };
  assumptions: string | null;
  exclusions: string | null;
  closing: string | null;
  nextSteps: string | null;
  footer: string | null;
}

const KIND_LABEL: Record<string, string> = { offer: 'Angebot', invoice: 'Rechnung' };
const VAT_TREATMENT_LABEL: Record<string, string> = {
  standard: 'Umsatzsteuer', reduced: 'Umsatzsteuer (ermäßigt)', zero_rated: 'Nullsatz',
  exempt: 'Steuerfrei (§ 4 UStG)', reverse_charge: 'Reverse-Charge', outside_scope: 'Nicht steuerbar', unknown: 'USt offen',
};

function moduleFrom(l: DocumentLineItem, index: number, currency: string): PremiumModule {
  return {
    index,
    title: l.description || `Modul ${index}`,
    details: l.details && l.details.trim() ? l.details.trim() : null,
    deliverables: (l.deliverables ?? []).filter((d) => d && d.trim().length > 0),
    phaseLabel: l.phaseLabel && l.phaseLabel.trim() ? l.phaseLabel.trim() : null,
    durationLabel: l.durationLabel && l.durationLabel.trim() ? l.durationLabel.trim() : null,
    netLabel: formatCentsCurrencyDe(l.netCents, currency),
    isOptional: !!l.isOptional,
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
  const baseNet = doc.netTotalCents;

  const breakdown = vatBreakdown(doc.lines).map((b) => ({
    label: `${VAT_TREATMENT_LABEL[b.vatTreatment] ?? 'Umsatzsteuer'} ${formatBpPercentDe(b.rateBp)}`,
    net: formatCentsCurrencyDe(b.netCents, currency),
    vat: formatCentsCurrencyDe(b.vatCents, currency),
  }));

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
    investment: {
      netLabel: formatCentsCurrencyDe(doc.netTotalCents, currency),
      vatRows: breakdown,
      vatTotalLabel: formatCentsCurrencyDe(doc.vatTotalCents, currency),
      grossLabel: formatCentsCurrencyDe(doc.grossTotalCents, currency),
    },
    timeline: (doc.timeline ?? []).map((t) => ({
      phase: t.phase ?? null, title: t.title ?? null, duration: t.duration ?? null, description: t.description ?? null,
    })),
    cooperation: null,
    deliveryTerms: doc.deliveryTerms ?? null,
    payment: {
      rows: schedule.map((m) => paymentRow(m, baseNet, currency)),
      note: doc.paymentTerms ?? null,
      balanced: schedule.length === 0 || !schedule.every((m) => typeof m.percentageBp === 'number') || paymentScheduleTotalBp(schedule) === 10000,
    },
    assumptions: doc.assumptions ?? null,
    exclusions: doc.exclusions ?? null,
    closing: doc.closing ?? null,
    nextSteps: doc.nextSteps ?? null,
    footer: doc.footer ?? null,
  };
}
