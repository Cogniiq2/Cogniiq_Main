// The shared "simple" report renderer (buildTransactionalReportModel) backs both the invoice PDF
// and the public offer portal's quick-download button — it is a different, older engine from the
// premium one used for the on-screen/canonical offer document. Its "Summen" section printed
// doc.{net,vat,gross}TotalCents directly, which is now the ONE-TIME portion only: a recurring
// commitment appeared as a priced line in the "Positionen" table but never reached the printed
// total underneath it — money the customer sees on the document but the total silently omits.
// These tests pin the fix: the total is derived from the lines via computeOfferPricing, split
// exactly like every other renderer, and the invoice path (which never has recurring lines) is
// untouched.

import { describe, it, expect } from 'vitest';

import { buildTransactionalReportModel } from './transactionalPdf';
import type { TransactionalDocument, DocumentLineItem } from './documentModel';
import type { PdfSection } from '../exports/pdf';

const vat19 = (net: number) => Math.round((net * 1900) / 10000);

function oneTimeLine(description: string, netCents: number): DocumentLineItem {
  return {
    description, quantityMilli: 1000, unit: 'Pauschal', unitPriceCents: netCents,
    vatRateBp: 1900, vatTreatment: 'standard', netCents, vatCents: vat19(netCents), grossCents: netCents + vat19(netCents),
    isOptional: false, pricingType: 'one_time',
  };
}

function monthlyLine(description: string, netCents: number, term: number): DocumentLineItem {
  return {
    description, quantityMilli: 1000, unit: 'Monat', unitPriceCents: netCents,
    vatRateBp: 1900, vatTreatment: 'standard', netCents, vatCents: vat19(netCents), grossCents: netCents + vat19(netCents),
    isOptional: false, pricingType: 'recurring', billingInterval: 'monthly', minimumTermMonths: term,
    billingStartType: 'commissioning',
  };
}

function offerDoc(lines: DocumentLineItem[]): TransactionalDocument {
  return {
    kind: 'offer', language: 'de', documentNumber: 'AN-2026-0100', title: 'Angebot',
    seller: { name: 'Cogniiq', addressLines: [] }, recipient: { name: 'SV Heinersreuth', addressLines: [] },
    issueDate: '2026-08-24', validUntil: '2026-09-23', currency: 'EUR', lines,
    // Deliberately WRONG/stale header totals (real owner_offers rows would have them correct,
    // but the whole point of the fix is that the Summen section must never trust these — it
    // derives from `lines` instead. If a header total ever leaked through, these fixtures would
    // catch it immediately.)
    netTotalCents: -1, vatTotalCents: -1, grossTotalCents: -1,
    isDraft: false, templateVersion: 'transactional-v1',
  };
}

function invoiceDoc(lines: DocumentLineItem[]): TransactionalDocument {
  return {
    kind: 'invoice', language: 'de', documentNumber: 'RE-2026-0001',
    seller: { name: 'Cogniiq', addressLines: [] }, recipient: { name: 'SV Heinersreuth', addressLines: [] },
    issueDate: '2026-08-24', dueDate: '2026-09-07', currency: 'EUR', lines,
    netTotalCents: lines.reduce((s, l) => s + l.netCents, 0),
    vatTotalCents: lines.reduce((s, l) => s + l.vatCents, 0),
    grossTotalCents: lines.reduce((s, l) => s + l.grossCents, 0),
    isDraft: false, templateVersion: 'transactional-v1',
  };
}

function summenRows(doc: TransactionalDocument): Array<[string, string]> {
  const model = buildTransactionalReportModel(doc);
  const section = model.sections.find((s): s is Extract<PdfSection, { kind: 'keyvalue' }> => s.kind === 'keyvalue' && s.heading === 'Summen');
  if (!section) throw new Error('Summen section not found');
  return section.rows;
}

describe('buildTransactionalReportModel — one-time-only offer (unchanged)', () => {
  it('prints exactly the classic three rows', () => {
    const rows = summenRows(offerDoc([oneTimeLine('Projekt', 390000)]));
    expect(rows).toEqual([
      ['Netto', '3.900,00 €'],
      ['Umsatzsteuer', '741,00 €'],
      ['Gesamt (brutto)', '4.641,00 €'],
    ]);
  });
});

describe('buildTransactionalReportModel — mixed offer', () => {
  const rows = summenRows(offerDoc([oneTimeLine('Einrichtung', 390000), monthlyLine('Betreuung', 29000, 12)]));

  it('never lets the recurring line vanish from the printed total', () => {
    // The bug this fix closes: a recurring line rendered in "Positionen" but the old "Summen"
    // section only ever showed doc.grossTotalCents, so the monthly amount disappeared here.
    const joined = JSON.stringify(rows);
    expect(joined).toContain('345,10');
    expect(joined).toContain('290,00');
  });

  it('labels the one-time total as one-time rather than "the whole offer"', () => {
    expect(rows).toContainEqual(['Gesamt (einmalig, brutto)', '4.641,00 €']);
    expect(rows.some(([label]) => label === 'Gesamt (brutto)')).toBe(false);
  });

  it('prints the recurring amount per interval, not multiplied by the term', () => {
    expect(rows).toContainEqual(['Gesamt (brutto) / Monat', '345,10 € / Monat']);
    const joined = JSON.stringify(rows);
    expect(joined).not.toContain('4.140'); // 345,10 x 12 would read as this if ever multiplied out
  });
});

describe('buildTransactionalReportModel — recurring-only offer', () => {
  it('labels the zero one-time amount explicitly rather than an unlabeled "Gesamt"', () => {
    // A genuinely zero one-time amount is fine to print — the bug was an UNLABELED "Gesamt
    // (brutto)" that looked like the whole offer's price. Once it says "(einmalig)" a 0,00 €
    // one-time figure next to a real monthly figure is honest, not misleading.
    const rows = summenRows(offerDoc([monthlyLine('Betreuung', 29000, 12)]));
    expect(rows).toContainEqual(['Gesamt (einmalig, brutto)', '0,00 €']);
    expect(rows.some(([label]) => label === 'Gesamt (brutto)')).toBe(false);
    expect(rows).toContainEqual(['Gesamt (brutto) / Monat', '345,10 € / Monat']);
  });
});

describe('buildTransactionalReportModel — invoices are unaffected', () => {
  it('keeps the classic three rows for an invoice (invoices never carry recurring lines)', () => {
    const rows = summenRows(invoiceDoc([{
      description: 'Leistung', quantityMilli: 1000, unit: 'Stück', unitPriceCents: 100000,
      vatRateBp: 1900, vatTreatment: 'standard', netCents: 100000, vatCents: 19000, grossCents: 119000, isOptional: false,
    }]));
    expect(rows).toEqual([
      ['Netto', '1.000,00 €'],
      ['Umsatzsteuer', '190,00 €'],
      ['Gesamt (brutto)', '1.190,00 €'],
    ]);
  });
});
