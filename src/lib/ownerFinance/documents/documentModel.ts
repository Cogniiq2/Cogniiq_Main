// Shared transactional document model for offers AND invoices. One model, one renderer, one hash —
// so an Angebot and a Rechnung are never rendered by divergent code paths. Money is integer cents,
// quantities integer milli-units. Pure and dependency-free (safe for the node test harness).

export type TransactionalDocumentKind = 'offer' | 'invoice';

export interface DocumentParty {
  name: string;
  addressLines: string[];
  email?: string | null;
  phone?: string | null;
  vatId?: string | null;
  taxNumber?: string | null;
}

export interface DocumentLineItem {
  description: string;
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
  introduction?: string | null;
  scope?: string | null;
  assumptions?: string | null;
  exclusions?: string | null;
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
