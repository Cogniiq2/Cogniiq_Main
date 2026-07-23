// Deterministic source hash for a transactional document. Hashes the commercial substance (parties,
// lines, totals, dates, terms) — NOT volatile presentation flags — so the same offer/invoice content
// hashes identically across renders, and acceptance evidence can be bound to an exact document hash.

import { sourceHash } from '../exports/sourceHash';
import type { TransactionalDocument } from './documentModel';

export function documentHash(doc: TransactionalDocument): string {
  const substance = {
    kind: doc.kind,
    language: doc.language,
    documentNumber: doc.documentNumber,
    title: doc.title ?? null,
    seller: doc.seller,
    recipient: doc.recipient,
    issueDate: doc.issueDate,
    validUntil: doc.validUntil ?? null,
    dueDate: doc.dueDate ?? null,
    serviceDate: doc.serviceDate ?? null,
    servicePeriodStart: doc.servicePeriodStart ?? null,
    servicePeriodEnd: doc.servicePeriodEnd ?? null,
    currency: doc.currency,
    introduction: doc.introduction ?? null,
    scope: doc.scope ?? null,
    assumptions: doc.assumptions ?? null,
    exclusions: doc.exclusions ?? null,
    lines: doc.lines.map((l) => ({
      description: l.description, quantityMilli: l.quantityMilli, unit: l.unit,
      unitPriceCents: l.unitPriceCents, vatRateBp: l.vatRateBp, vatTreatment: l.vatTreatment,
      netCents: l.netCents, vatCents: l.vatCents, grossCents: l.grossCents, isOptional: !!l.isOptional,
    })),
    netTotalCents: doc.netTotalCents,
    vatTotalCents: doc.vatTotalCents,
    grossTotalCents: doc.grossTotalCents,
    paymentTerms: doc.paymentTerms ?? null,
    deliveryTerms: doc.deliveryTerms ?? null,
    bank: doc.bank ?? null,
    templateVersion: doc.templateVersion,
  };
  return sourceHash(substance);
}
