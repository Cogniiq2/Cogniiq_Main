// Pre-generation validation for transactional documents. Produces a checklist of missing required
// fields. A finalized (non-draft) invoice PDF MUST be blocked when required source info is missing;
// a draft preview may render with the missing-field warnings visible. This does NOT assert legal or
// tax completeness — it only checks that the fields the document needs are present.

import type { TransactionalDocument } from './documentModel';

export interface ValidationItem {
  key: string;
  label: string;
  ok: boolean;
}

export interface ValidationResult {
  items: ValidationItem[];
  missing: string[];
  /** True when every required item is satisfied — required before finalizing/generating a final PDF. */
  canFinalize: boolean;
}

function partyComplete(p: { name: string; addressLines: string[] } | undefined | null): boolean {
  return !!p && p.name.trim().length > 0 && p.addressLines.some((l) => l.trim().length > 0);
}

export function validateTransactionalDocument(doc: TransactionalDocument): ValidationResult {
  const items: ValidationItem[] = [];
  const add = (key: string, label: string, ok: boolean) => items.push({ key, label, ok });

  add('seller', 'Vollständige Geschäftsidentität (Absender)', partyComplete(doc.seller));
  add('recipient', 'Vollständige Empfängerdaten', partyComplete(doc.recipient));
  add('number', doc.kind === 'invoice' ? 'Rechnungsnummer' : 'Angebotsnummer', !doc.isDraft ? !!doc.documentNumber : true);
  add('issue_date', doc.kind === 'invoice' ? 'Rechnungsdatum' : 'Angebotsdatum', !!doc.issueDate);
  add('service', 'Leistungsdatum oder -zeitraum', !!doc.serviceDate || (!!doc.servicePeriodStart && !!doc.servicePeriodEnd));

  if (doc.kind === 'invoice') {
    add('due_date', 'Fälligkeitsdatum', !!doc.dueDate);
    add('payment_info', 'Zahlungsinformationen (IBAN)', !!(doc.bank && doc.bank.iban && doc.bank.iban.trim().length > 0));
  } else {
    add('valid_until', 'Gültigkeitsdatum', !!doc.validUntil);
  }

  const nonOptional = doc.lines.filter((l) => !l.isOptional);
  add('lines', 'Mindestens eine Position', nonOptional.length >= 1);
  add('descriptions', 'Beschreibung je Position', nonOptional.every((l) => l.description.trim().length > 0));
  add('totals', 'Positive Summen (Netto/Brutto)', doc.netTotalCents > 0 && doc.grossTotalCents > 0);
  add('vat_resolved', 'Aufgelöste USt-Behandlung', nonOptional.every((l) => l.vatTreatment !== 'unknown'));

  const missing = items.filter((i) => !i.ok).map((i) => i.label);
  return { items, missing, canFinalize: missing.length === 0 };
}
