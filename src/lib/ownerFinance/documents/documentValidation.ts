// Pre-generation validation for transactional documents, split into explicit PROFILES:
//   validateOfferDraft            — light integrity while editing a draft
//   validateOfferForFinalization  — everything required to freeze an immutable offer
//   validateInvoiceForIssuance    — everything required to issue an invoice
//
// Key correction vs. the previous single validator: an OFFER never requires a service
// date/period or an IBAN. An INVOICE requires a service date OR period, a due date and
// payment information. This does NOT assert legal/tax completeness — only that the fields
// the chosen document needs are present. Each item can link to an editor `section`.

import type { TransactionalDocument } from './documentModel';
import { baseModules, paymentScheduleBalanced } from './documentModel';

/** Editor section anchors a missing item can deep-link to. */
export type EditorSection =
  | 'seller' | 'recipient' | 'summary' | 'positions' | 'terms' | 'schedule' | 'dates' | 'meta';

export interface ValidationItem {
  key: string;
  label: string;
  ok: boolean;
  /** Whether this item blocks finalization/issuance (vs. a soft recommendation). */
  blocking: boolean;
  /** Editor section to jump to when fixing. */
  section?: EditorSection;
}

export interface ValidationResult {
  items: ValidationItem[];
  /** Labels of the blocking items that are not satisfied. */
  missing: string[];
  /** True when every blocking item is satisfied — required before finalizing/issuing. */
  canFinalize: boolean;
}

function partyComplete(p: { name: string; addressLines: string[] } | undefined | null): boolean {
  return !!p && p.name.trim().length > 0 && p.addressLines.some((l) => l.trim().length > 0);
}

function build(items: ValidationItem[]): ValidationResult {
  const missing = items.filter((i) => i.blocking && !i.ok).map((i) => i.label);
  return { items, missing, canFinalize: missing.length === 0 };
}

/** Light draft integrity: enough to persist and preview, never blocks editing. */
export function validateOfferDraft(doc: TransactionalDocument): ValidationResult {
  const base = baseModules(doc.lines);
  return build([
    { key: 'lines', label: 'Mindestens eine Position', ok: base.length >= 1, blocking: true, section: 'positions' },
    { key: 'descriptions', label: 'Titel je Position', ok: base.every((l) => l.description.trim().length > 0), blocking: true, section: 'positions' },
    { key: 'title', label: 'Angebotstitel', ok: !!doc.title && doc.title.trim().length > 0, blocking: false, section: 'meta' },
  ]);
}

/** Full blocking checklist required to finalize an offer into an immutable version. */
export function validateOfferForFinalization(doc: TransactionalDocument): ValidationResult {
  const base = baseModules(doc.lines);
  return build([
    { key: 'seller', label: 'Verkäufer-Identität & Anschrift', ok: partyComplete(doc.seller), blocking: true, section: 'seller' },
    { key: 'recipient', label: 'Empfänger-Firma & Anschrift', ok: partyComplete(doc.recipient), blocking: true, section: 'recipient' },
    { key: 'number', label: 'Angebotsnummer (bei Finalisierung vergeben)', ok: doc.isDraft ? true : !!doc.documentNumber, blocking: false, section: 'meta' },
    { key: 'title', label: 'Angebotstitel', ok: !!doc.title && doc.title.trim().length > 0, blocking: true, section: 'meta' },
    { key: 'issue_date', label: 'Angebotsdatum', ok: !!doc.issueDate, blocking: true, section: 'dates' },
    { key: 'valid_until', label: 'Gültigkeitsdatum', ok: !!doc.validUntil, blocking: true, section: 'dates' },
    { key: 'lines', label: 'Mindestens eine nicht-optionale Position', ok: base.length >= 1, blocking: true, section: 'positions' },
    { key: 'descriptions', label: 'Titel je Position', ok: base.every((l) => l.description.trim().length > 0), blocking: true, section: 'positions' },
    { key: 'vat_resolved', label: 'Aufgelöste USt-Behandlung', ok: base.every((l) => l.vatTreatment !== 'unknown'), blocking: true, section: 'positions' },
    { key: 'totals', label: 'Positive Summen (Netto/Brutto)', ok: doc.netTotalCents > 0 && doc.grossTotalCents > 0, blocking: true, section: 'positions' },
    { key: 'payment_terms', label: 'Zahlungsbedingungen', ok: !!doc.paymentTerms && doc.paymentTerms.trim().length > 0, blocking: true, section: 'terms' },
    { key: 'schedule_sum', label: 'Zahlungsplan-Prozente ergeben 100 %', ok: paymentScheduleBalanced(doc.paymentSchedule), blocking: true, section: 'schedule' },
  ]);
}

/** Full blocking checklist required to issue an invoice. */
export function validateInvoiceForIssuance(doc: TransactionalDocument): ValidationResult {
  const base = baseModules(doc.lines);
  return build([
    { key: 'seller', label: 'Verkäufer-Identität & Anschrift', ok: partyComplete(doc.seller), blocking: true, section: 'seller' },
    { key: 'recipient', label: 'Empfängerdaten', ok: partyComplete(doc.recipient), blocking: true, section: 'recipient' },
    { key: 'number', label: 'Rechnungsnummer', ok: doc.isDraft ? true : !!doc.documentNumber, blocking: true, section: 'meta' },
    { key: 'issue_date', label: 'Rechnungsdatum', ok: !!doc.issueDate, blocking: true, section: 'dates' },
    { key: 'service', label: 'Leistungsdatum oder -zeitraum', ok: !!doc.serviceDate || (!!doc.servicePeriodStart && !!doc.servicePeriodEnd), blocking: true, section: 'dates' },
    { key: 'due_date', label: 'Fälligkeitsdatum', ok: !!doc.dueDate, blocking: true, section: 'dates' },
    { key: 'payment_info', label: 'Zahlungsinformationen (IBAN)', ok: !!(doc.bank && doc.bank.iban && doc.bank.iban.trim().length > 0), blocking: true, section: 'terms' },
    { key: 'lines', label: 'Mindestens eine Position', ok: base.length >= 1, blocking: true, section: 'positions' },
    { key: 'descriptions', label: 'Beschreibung je Position', ok: base.every((l) => l.description.trim().length > 0), blocking: true, section: 'positions' },
    { key: 'totals', label: 'Positive Summen (Netto/Brutto)', ok: doc.netTotalCents > 0 && doc.grossTotalCents > 0, blocking: true, section: 'positions' },
    { key: 'vat_resolved', label: 'Aufgelöste USt-Behandlung', ok: base.every((l) => l.vatTreatment !== 'unknown'), blocking: true, section: 'positions' },
  ]);
}

/**
 * Back-compatible dispatcher: routes to the correct profile by kind. Existing callers
 * (generateDocument, transactionalPdf) keep working, now with the corrected offer rules
 * (no service date / no IBAN required for offers).
 */
export function validateTransactionalDocument(doc: TransactionalDocument): ValidationResult {
  return doc.kind === 'invoice' ? validateInvoiceForIssuance(doc) : validateOfferForFinalization(doc);
}
