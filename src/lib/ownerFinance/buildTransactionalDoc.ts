// Build the shared TransactionalDocument model from stored offer/invoice records + document
// settings + the recipient (CRM customer). Used by the offer and invoice detail pages to preview,
// generate and hash PDFs from a single consistent source.

import type {
  OwnerOffer, OwnerOfferLine, OwnerInvoice, OwnerInvoiceLine, OwnerDocumentSettings,
  OfferPaymentMilestone,
} from '@/lib/ownerFinance/types';
import type { DocumentParty, DocumentLineItem, TransactionalDocument, PaymentMilestone } from '@/lib/ownerFinance/documents';
import { TRANSACTIONAL_TEMPLATE_VERSION, PREMIUM_OFFER_TEMPLATE_KEY } from '@/lib/ownerFinance/documents';

export interface RecipientInput {
  name: string;
  contactName?: string | null;
  department?: string | null;
  addressLines?: string[];
  email?: string | null;
  phone?: string | null;
  vatId?: string | null;
}

function sellerFromSettings(s: OwnerDocumentSettings | null, fallbackName: string): DocumentParty {
  if (!s) return { name: fallbackName, addressLines: [] };
  const addr = [s.street, [s.postal_code, s.city].filter(Boolean).join(' ')].filter((l) => l && l.trim()) as string[];
  return {
    name: s.legal_name || fallbackName,
    addressLines: addr,
    email: s.business_email,
    phone: s.business_phone,
    vatId: s.vat_id,
    taxNumber: s.tax_number,
  };
}

function recipientParty(r: RecipientInput | null): DocumentParty {
  if (!r) return { name: '—', addressLines: [] };
  return {
    name: r.name, contactName: r.contactName ?? null, department: r.department ?? null,
    addressLines: (r.addressLines ?? []).filter((l) => l && l.trim()),
    email: r.email ?? null, phone: r.phone ?? null, vatId: r.vatId ?? null,
  };
}

/** Recipient party from the offer's own snapshot fields (offer-specific override), if present. */
function recipientFromOffer(offer: OwnerOffer): DocumentParty | null {
  if (!offer.recipient_company) return null;
  const addr = [offer.recipient_street, [offer.recipient_postal_code, offer.recipient_city].filter(Boolean).join(' ')].filter((l) => l && l.trim()) as string[];
  return {
    name: offer.recipient_company, contactName: offer.recipient_contact_name, department: offer.recipient_department,
    addressLines: addr, email: offer.recipient_email, phone: offer.recipient_phone, vatId: offer.recipient_vat_id,
  };
}

function toMilestones(rows: OfferPaymentMilestone[] | undefined): PaymentMilestone[] {
  return (rows ?? []).map((m) => ({ label: m.label, percentageBp: m.percentage_bp ?? null, amountCents: m.amount_cents ?? null, note: m.note ?? null }));
}

function offerLineItems(lines: OwnerOfferLine[]): DocumentLineItem[] {
  return lines.map((l) => ({
    description: l.description, details: l.details, deliverables: l.deliverables ?? [],
    phaseLabel: l.phase_label, durationLabel: l.duration_label,
    quantityMilli: l.quantity_milli, unit: l.unit, unitPriceCents: l.unit_price_cents,
    vatRateBp: l.vat_rate_bp, vatTreatment: l.vat_treatment, netCents: l.net_cents, vatCents: l.vat_cents,
    grossCents: l.gross_cents, isOptional: l.is_optional,
  }));
}

export function offerToDocument(offer: OwnerOffer, lines: OwnerOfferLine[], settings: OwnerDocumentSettings | null, recipient: RecipientInput | null, fallbackSeller: string): TransactionalDocument {
  const seller = sellerFromSettings(settings, fallbackSeller);
  return {
    kind: 'offer',
    language: (settings?.document_language as 'de' | 'en') ?? 'de',
    documentNumber: offer.offer_number,
    title: offer.title,
    subtitle: offer.subtitle,
    valueProposition: offer.executive_summary ? null : (offer.introduction ?? null),
    seller: { ...seller, website: settings?.website ?? null } as DocumentParty,
    recipient: recipientFromOffer(offer) ?? recipientParty(recipient),
    issueDate: offer.issue_date,
    validUntil: offer.valid_until,
    serviceDate: null,
    currency: offer.currency,
    introduction: offer.introduction ?? settings?.default_offer_intro ?? null,
    executiveSummary: offer.executive_summary,
    desiredOutcomes: offer.desired_outcomes ?? [],
    projectApproach: offer.project_approach,
    scope: offer.scope,
    timeline: (offer.timeline ?? []).map((t) => ({ phase: t.phase, title: t.title, duration: t.duration, description: t.description })),
    paymentSchedule: toMilestones(offer.payment_schedule),
    nextSteps: offer.next_steps,
    assumptions: offer.assumptions,
    exclusions: offer.exclusions,
    brandAccent: settings?.brand_accent ?? null,
    templateKey: offer.template_key ?? PREMIUM_OFFER_TEMPLATE_KEY,
    lines: offerLineItems(lines),
    netTotalCents: offer.net_total_cents,
    vatTotalCents: offer.vat_total_cents,
    grossTotalCents: offer.gross_total_cents,
    paymentTerms: offer.payment_terms,
    deliveryTerms: offer.delivery_terms,
    closing: settings?.default_offer_closing ?? null,
    footer: settings?.default_offer_footer ?? null,
    isDraft: offer.status === 'draft',
    templateVersion: TRANSACTIONAL_TEMPLATE_VERSION,
  };
}

/**
 * Build a TransactionalDocument from an IMMUTABLE finalized version snapshot. Finalized offer PDFs
 * and previews MUST use this (never current CRM / current settings), so the finalized document is
 * byte-stable regardless of later CRM or settings changes.
 */
export function snapshotToDocument(snapshot: Record<string, unknown>): TransactionalDocument {
  const o = (snapshot.offer ?? {}) as Record<string, unknown>;
  const seller = (snapshot.seller ?? {}) as Record<string, unknown>;
  const rec = (snapshot.recipient ?? {}) as Record<string, unknown>;
  const ds = (snapshot.document_settings ?? {}) as Record<string, unknown>;
  const rawLines = (snapshot.lines ?? []) as Array<Record<string, unknown>>;
  const str = (v: unknown): string | null => (typeof v === 'string' && v.length ? v : null);
  const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v) || 0);

  const sellerAddr = [str(seller.street), [str(seller.postal_code), str(seller.city)].filter(Boolean).join(' ')].filter((l) => l && (l as string).trim()) as string[];
  const recAddr = [str(rec.street), [str(rec.postal_code), str(rec.city)].filter(Boolean).join(' ')].filter((l) => l && (l as string).trim()) as string[];

  return {
    kind: 'offer',
    language: (str(ds.document_language) as 'de' | 'en') ?? 'de',
    documentNumber: str(snapshot.offer_number) ?? str(o.offer_number),
    title: str(o.title),
    subtitle: str(o.subtitle),
    valueProposition: str(o.executive_summary) ? null : str(o.introduction),
    seller: {
      name: str(seller.legal_name) ?? 'Cogniiq', addressLines: sellerAddr,
      email: str(seller.email), phone: str(seller.phone), vatId: str(seller.vat_id), taxNumber: str(seller.tax_number),
      website: str(seller.website),
    } as DocumentParty,
    recipient: {
      name: str(rec.company) ?? '—', contactName: str(rec.contact_name), department: str(rec.department),
      addressLines: recAddr, email: str(rec.email), phone: str(rec.phone), vatId: str(rec.vat_id),
    },
    issueDate: str(o.issue_date),
    validUntil: str(o.valid_until),
    serviceDate: null,
    currency: str(o.currency) ?? 'EUR',
    introduction: str(o.introduction),
    executiveSummary: str(o.executive_summary),
    desiredOutcomes: (Array.isArray(o.desired_outcomes) ? o.desired_outcomes : []) as string[],
    projectApproach: str(o.project_approach),
    scope: str(o.scope),
    timeline: (Array.isArray(o.timeline) ? o.timeline : []) as TransactionalDocument['timeline'],
    paymentSchedule: toMilestones((Array.isArray(o.payment_schedule) ? o.payment_schedule : []) as OfferPaymentMilestone[]),
    nextSteps: str(o.next_steps),
    assumptions: str(o.assumptions),
    exclusions: str(o.exclusions),
    brandAccent: str(ds.brand_accent),
    templateKey: str(snapshot.template_key) ?? str(o.template_key) ?? PREMIUM_OFFER_TEMPLATE_KEY,
    lines: rawLines.map((l) => ({
      description: str(l.description) ?? '', details: str(l.details), deliverables: (Array.isArray(l.deliverables) ? l.deliverables : []) as string[],
      phaseLabel: str(l.phase_label), durationLabel: str(l.duration_label),
      quantityMilli: num(l.quantity_milli), unit: str(l.unit) ?? 'Stück', unitPriceCents: num(l.unit_price_cents),
      vatRateBp: num(l.vat_rate_bp), vatTreatment: str(l.vat_treatment) ?? 'standard',
      netCents: num(l.net_cents), vatCents: num(l.vat_cents), grossCents: num(l.gross_cents), isOptional: !!l.is_optional,
    })),
    netTotalCents: num(o.net_total_cents),
    vatTotalCents: num(o.vat_total_cents),
    grossTotalCents: num(o.gross_total_cents),
    paymentTerms: str(o.payment_terms),
    deliveryTerms: str(o.delivery_terms),
    closing: str(ds.default_offer_closing),
    footer: str(ds.default_offer_footer),
    isDraft: false,
    templateVersion: TRANSACTIONAL_TEMPLATE_VERSION,
  };
}

export function invoiceToDocument(invoice: OwnerInvoice, lines: OwnerInvoiceLine[], settings: OwnerDocumentSettings | null, recipient: RecipientInput | null, fallbackSeller: string): TransactionalDocument {
  return {
    kind: 'invoice',
    language: (settings?.document_language as 'de' | 'en') ?? 'de',
    documentNumber: invoice.invoice_number,
    title: null,
    seller: sellerFromSettings(settings, fallbackSeller),
    recipient: recipientParty(recipient),
    issueDate: invoice.issue_date,
    dueDate: invoice.due_date,
    serviceDate: invoice.service_date,
    servicePeriodStart: (invoice as unknown as { service_period_start?: string | null }).service_period_start ?? null,
    servicePeriodEnd: (invoice as unknown as { service_period_end?: string | null }).service_period_end ?? null,
    currency: invoice.currency,
    lines: lines.map((l) => ({
      description: l.description, quantityMilli: l.quantity_milli, unit: 'Stück', unitPriceCents: l.unit_price_cents,
      vatRateBp: l.vat_rate_bp, vatTreatment: l.vat_treatment, netCents: l.net_cents, vatCents: l.vat_cents,
      grossCents: l.gross_cents, isOptional: false,
    })),
    netTotalCents: invoice.net_total_cents,
    vatTotalCents: invoice.vat_total_cents,
    grossTotalCents: invoice.gross_total_cents,
    paymentTerms: settings ? `Zahlbar bis ${invoice.due_date ?? ''}` : null,
    bank: settings ? { holder: settings.bank_account_holder, iban: settings.iban, bic: settings.bic, bankName: settings.bank_name } : null,
    footer: settings?.default_invoice_footer ?? null,
    isDraft: invoice.status === 'draft',
    templateVersion: TRANSACTIONAL_TEMPLATE_VERSION,
  };
}
