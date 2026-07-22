// Build the shared TransactionalDocument model from stored offer/invoice records + document
// settings + the recipient (CRM customer). Used by the offer and invoice detail pages to preview,
// generate and hash PDFs from a single consistent source.

import type {
  OwnerOffer, OwnerOfferLine, OwnerInvoice, OwnerInvoiceLine, OwnerDocumentSettings,
} from '@/lib/ownerFinance/types';
import type { DocumentParty, TransactionalDocument } from '@/lib/ownerFinance/documents';
import { TRANSACTIONAL_TEMPLATE_VERSION } from '@/lib/ownerFinance/documents';

export interface RecipientInput {
  name: string;
  addressLines?: string[];
  email?: string | null;
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
  return { name: r.name, addressLines: (r.addressLines ?? []).filter((l) => l && l.trim()), email: r.email ?? null, vatId: r.vatId ?? null };
}

export function offerToDocument(offer: OwnerOffer, lines: OwnerOfferLine[], settings: OwnerDocumentSettings | null, recipient: RecipientInput | null, fallbackSeller: string): TransactionalDocument {
  return {
    kind: 'offer',
    language: (settings?.document_language as 'de' | 'en') ?? 'de',
    documentNumber: offer.offer_number,
    title: offer.title,
    seller: sellerFromSettings(settings, fallbackSeller),
    recipient: recipientParty(recipient),
    issueDate: offer.issue_date,
    validUntil: offer.valid_until,
    serviceDate: null,
    currency: offer.currency,
    introduction: offer.introduction ?? settings?.default_offer_intro ?? null,
    scope: offer.scope,
    assumptions: offer.assumptions,
    exclusions: offer.exclusions,
    lines: lines.map((l) => ({
      description: l.description, quantityMilli: l.quantity_milli, unit: l.unit, unitPriceCents: l.unit_price_cents,
      vatRateBp: l.vat_rate_bp, vatTreatment: l.vat_treatment, netCents: l.net_cents, vatCents: l.vat_cents,
      grossCents: l.gross_cents, isOptional: l.is_optional,
    })),
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
