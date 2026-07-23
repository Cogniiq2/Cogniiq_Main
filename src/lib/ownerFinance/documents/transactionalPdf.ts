// Transactional PDF renderer for offers AND invoices. This does NOT introduce a second PDF engine:
// it maps the shared TransactionalDocument onto the existing deterministic renderReportPdf (pdf.ts),
// reusing its selectable text, branded header, repeatable table headers, pagination and page numbers.
// buildTransactionalReportModel is pure (testable); renderTransactionalPdf loads pdf.ts lazily.

import {
  formatCentsCurrencyDe, formatQuantityMilli, formatBpPercentDe, formatDateDe,
} from '../exports/format';
import type { PdfReportModel, PdfSection } from '../exports/pdf';
import { vatBreakdown, type TransactionalDocument } from './documentModel';
import { validateTransactionalDocument } from './documentValidation';

const KIND_LABEL = { offer: 'Angebot', invoice: 'Rechnung' } as const;
const DISCLAIMER =
  'Erstellt mit Cogniiq. Keine Zusicherung rechtlicher oder steuerlicher Vollständigkeit — bitte fachlich prüfen.';

function partyLines(p: { name: string; addressLines: string[]; email?: string | null; vatId?: string | null; taxNumber?: string | null }): [string, string][] {
  const rows: [string, string][] = [['Name', p.name || '—']];
  const addr = p.addressLines.filter((l) => l.trim());
  if (addr.length) rows.push(['Anschrift', addr.join(', ')]);
  if (p.email) rows.push(['E-Mail', p.email]);
  if (p.vatId) rows.push(['USt-IdNr.', p.vatId]);
  if (p.taxNumber) rows.push(['Steuernummer', p.taxNumber]);
  return rows;
}

export function buildTransactionalReportModel(doc: TransactionalDocument): PdfReportModel {
  const kindLabel = KIND_LABEL[doc.kind];
  const numberLabel = doc.documentNumber ?? 'Entwurf';
  const validation = validateTransactionalDocument(doc);

  const sellerMeta: string[] = [];
  const sellerAddr = doc.seller.addressLines.filter((l) => l.trim());
  if (sellerAddr.length) sellerMeta.push(sellerAddr.join(', '));
  const idBits = [doc.seller.email, doc.seller.vatId ? `USt-IdNr. ${doc.seller.vatId}` : null, doc.seller.taxNumber ? `St.-Nr. ${doc.seller.taxNumber}` : null].filter(Boolean);
  if (idBits.length) sellerMeta.push(idBits.join(' · '));
  const dateBits = [`${kindLabel}datum: ${formatDateDe(doc.issueDate)}`];
  if (doc.kind === 'offer' && doc.validUntil) dateBits.push(`Gültig bis: ${formatDateDe(doc.validUntil)}`);
  if (doc.kind === 'invoice' && doc.dueDate) dateBits.push(`Fällig: ${formatDateDe(doc.dueDate)}`);
  if (doc.serviceDate) dateBits.push(`Leistung: ${formatDateDe(doc.serviceDate)}`);
  else if (doc.servicePeriodStart && doc.servicePeriodEnd) dateBits.push(`Leistungszeitraum: ${formatDateDe(doc.servicePeriodStart)}–${formatDateDe(doc.servicePeriodEnd)}`);
  sellerMeta.push(dateBits.join(' · '));

  const sections: PdfSection[] = [];

  if (doc.isDraft) {
    sections.push({ kind: 'note', text: `ENTWURF — noch nicht ${doc.kind === 'invoice' ? 'gestellt' : 'finalisiert'}.${validation.missing.length ? ' Fehlende Pflichtangaben: ' + validation.missing.join(', ') + '.' : ''}` });
  }

  sections.push({ kind: 'keyvalue', heading: 'Empfänger', rows: partyLines(doc.recipient) });

  if (doc.title) sections.push({ kind: 'paragraph', heading: 'Betreff', text: doc.title });
  if (doc.introduction) sections.push({ kind: 'paragraph', heading: 'Einleitung', text: doc.introduction });
  if (doc.scope) sections.push({ kind: 'paragraph', heading: 'Leistungsumfang', text: doc.scope });

  // Line items table (non-optional first, then optional flagged).
  const orderedLines = [...doc.lines].sort((a, b) => Number(a.isOptional) - Number(b.isOptional));
  sections.push({
    kind: 'table', heading: 'Positionen',
    columns: [
      { header: 'Beschreibung', align: 'left', width: 5 },
      { header: 'Menge', align: 'right', width: 1.4 },
      { header: 'Einheit', align: 'left', width: 1.6 },
      { header: 'Einzelpreis', align: 'right', width: 2.2 },
      { header: 'USt', align: 'right', width: 1.4 },
      { header: 'Netto', align: 'right', width: 2.2 },
    ],
    rows: orderedLines.map((l) => [
      l.description + (l.isOptional ? '  (optional)' : ''),
      formatQuantityMilli(l.quantityMilli),
      l.unit,
      formatCentsCurrencyDe(l.unitPriceCents, doc.currency),
      formatBpPercentDe(l.vatRateBp),
      formatCentsCurrencyDe(l.netCents, doc.currency),
    ]),
  });

  // VAT breakdown + totals (optional lines excluded from totals, per the offer model).
  const breakdown = vatBreakdown(doc.lines);
  if (breakdown.length) {
    sections.push({
      kind: 'keyvalue', heading: 'USt-Aufschlüsselung',
      rows: breakdown.map((b) => [`Netto ${formatBpPercentDe(b.rateBp)} (${b.vatTreatment})`, `${formatCentsCurrencyDe(b.netCents, doc.currency)} → USt ${formatCentsCurrencyDe(b.vatCents, doc.currency)}`]),
    });
  }
  sections.push({
    kind: 'keyvalue', heading: 'Summen',
    rows: [
      ['Netto', formatCentsCurrencyDe(doc.netTotalCents, doc.currency)],
      ['Umsatzsteuer', formatCentsCurrencyDe(doc.vatTotalCents, doc.currency)],
      ['Gesamt (brutto)', formatCentsCurrencyDe(doc.grossTotalCents, doc.currency)],
    ],
  });

  const termRows: [string, string][] = [];
  if (doc.paymentTerms) termRows.push(['Zahlungsbedingungen', doc.paymentTerms]);
  if (doc.deliveryTerms) termRows.push(['Lieferbedingungen', doc.deliveryTerms]);
  if (doc.assumptions) termRows.push(['Annahmen', doc.assumptions]);
  if (doc.exclusions) termRows.push(['Ausschlüsse', doc.exclusions]);
  if (termRows.length) sections.push({ kind: 'keyvalue', heading: 'Bedingungen', rows: termRows });

  if (doc.kind === 'invoice' && doc.bank && (doc.bank.iban || doc.bank.holder)) {
    const b = doc.bank;
    const parts = [b.holder ? `Kontoinhaber: ${b.holder}` : null, b.iban ? `IBAN: ${b.iban}` : null, b.bic ? `BIC: ${b.bic}` : null, b.bankName ? `Bank: ${b.bankName}` : null].filter(Boolean);
    sections.push({ kind: 'keyvalue', heading: 'Zahlungsinformationen', rows: parts.map((p) => { const [k, ...v] = (p as string).split(': '); return [k, v.join(': ')] as [string, string]; }) });
  }

  if (doc.closing) sections.push({ kind: 'paragraph', text: doc.closing });
  if (doc.footer) sections.push({ kind: 'note', text: doc.footer });
  sections.push({ kind: 'note', text: DISCLAIMER });

  return {
    brand: 'Cogniiq',
    documentTitle: `${kindLabel} ${numberLabel}`,
    entityName: doc.seller.name || 'Cogniiq',
    metaLines: sellerMeta,
    sections,
    disclaimer: `Cogniiq · ${kindLabel} ${numberLabel}`,
  };
}

/** Render the document to PDF bytes. Loads the pdf engine lazily so it stays in its own chunk. */
export async function renderTransactionalPdf(doc: TransactionalDocument): Promise<Uint8Array> {
  const { renderReportPdf } = await import('../exports/pdf');
  return renderReportPdf(buildTransactionalReportModel(doc));
}
