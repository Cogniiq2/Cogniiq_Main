// Structured German e-invoice — FUTURE INTERFACE ONLY. This builds the abstraction + validation
// layer for XRechnung / ZUGFeRD but does NOT claim EN 16931 compliance and does NOT emit a certified
// document. A PDF is never a structured e-invoice. Generation is gated behind a feature flag and
// always reports status 'experimental' / 'not_certified' until a real validator is integrated. We
// never rename arbitrary XML as XRechnung, and never assert conformance without a validator.

import type { TransactionalDocument } from './documentModel';

export type StructuredInvoiceFormat = 'xrechnung' | 'zugferd';

/** Feature flags. Default: every structured format DISABLED / experimental. */
export interface StructuredInvoiceFlags {
  xrechnung: 'disabled' | 'experimental';
  zugferd: 'disabled' | 'experimental';
}

export const DEFAULT_STRUCTURED_FLAGS: StructuredInvoiceFlags = { xrechnung: 'disabled', zugferd: 'disabled' };

export interface StructuredValidationResult {
  ok: boolean;
  /** EN 16931 core fields our model can supply; presence-checked only, NOT semantically validated. */
  missing: string[];
  notes: string[];
}

/**
 * Presence-check the EN 16931 core fields we would need. This is a SOURCE-COMPLETENESS check only —
 * it is not an EN 16931 semantic validation and passing it does NOT imply conformance.
 */
export function validateStructuredSource(doc: TransactionalDocument): StructuredValidationResult {
  const missing: string[] = [];
  const need = (cond: boolean, label: string) => { if (!cond) missing.push(label); };

  need(doc.kind === 'invoice', 'BT-3 Rechnungstyp (nur invoice)');
  need(!!doc.documentNumber, 'BT-1 Rechnungsnummer');
  need(!!doc.issueDate, 'BT-2 Rechnungsdatum');
  need(!!doc.seller.name && doc.seller.addressLines.length > 0, 'BG-4 Verkäufer (Name/Anschrift)');
  need(!!doc.seller.vatId, 'BT-31 USt-IdNr. Verkäufer');
  need(!!doc.recipient.name && doc.recipient.addressLines.length > 0, 'BG-7 Käufer (Name/Anschrift)');
  need(!!doc.dueDate, 'BT-9 Fälligkeitsdatum');
  need(doc.lines.filter((l) => !l.isOptional).length >= 1, 'BG-25 Rechnungsposition(en)');
  need(doc.netTotalCents > 0 && doc.grossTotalCents > 0, 'BG-22 Belegsummen');
  need(doc.lines.every((l) => l.vatTreatment !== 'unknown'), 'BT-151 USt-Kategorie je Position');

  return {
    ok: missing.length === 0,
    missing,
    notes: [
      'Quellprüfung auf Vorhandensein — KEINE EN-16931-Validierung.',
      'Kein Konformitätsnachweis. Keine Zertifizierung. Nicht zur Übermittlung geeignet.',
    ],
  };
}

export interface StructuredIntermediate {
  format: StructuredInvoiceFormat;
  status: 'experimental' | 'not_certified';
  /** Documented, machine-readable intermediate representation (NOT a certified XRechnung/ZUGFeRD file). */
  representation: Record<string, unknown>;
  validation: StructuredValidationResult;
  disclaimer: string;
}

/**
 * Build a DOCUMENTED intermediate representation for a structured format. This is explicitly not a
 * certified file: `status` is always 'experimental'/'not_certified'. Throws if the flag is disabled,
 * so no code path can silently produce a fake "XRechnung".
 */
export function buildStructuredIntermediate(
  doc: TransactionalDocument,
  format: StructuredInvoiceFormat,
  flags: StructuredInvoiceFlags = DEFAULT_STRUCTURED_FLAGS,
): StructuredIntermediate {
  if (flags[format] === 'disabled') {
    throw new Error(`Strukturierte E-Rechnung (${format}) ist nicht aktiviert (Feature-Flag disabled).`);
  }
  const validation = validateStructuredSource(doc);
  const representation = {
    profile: format === 'xrechnung' ? 'urn:xrechnung (intermediate, uncertified)' : 'urn:zugferd (intermediate, uncertified)',
    invoiceNumber: doc.documentNumber,
    issueDate: doc.issueDate,
    dueDate: doc.dueDate,
    currency: doc.currency,
    seller: doc.seller,
    buyer: doc.recipient,
    lines: doc.lines.filter((l) => !l.isOptional).map((l, i) => ({
      id: i + 1, name: l.description, quantityMilli: l.quantityMilli, unit: l.unit,
      netUnitPriceCents: l.unitPriceCents, vatCategoryRateBp: l.vatRateBp, vatTreatment: l.vatTreatment,
      lineNetCents: l.netCents,
    })),
    totals: { netCents: doc.netTotalCents, vatCents: doc.vatTotalCents, grossCents: doc.grossTotalCents },
  };
  return {
    format,
    status: 'not_certified',
    representation,
    validation,
    disclaimer: 'Strukturierte E-Rechnung: experimentell / nicht validiert. Kein XRechnung-/ZUGFeRD-Konformitätsnachweis. Nicht zur Übermittlung.',
  };
}
