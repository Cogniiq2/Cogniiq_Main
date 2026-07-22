// Domain → export mappings. Turns owner-finance records into the shared typed ExportTable model
// (consumed by CSV + XLSX) and into PDF report models. Centralized here so Invoices/Expenses/Taxes
// pages describe their data once and get every format with identical columns, ordering and typing.

import type { OwnerInvoice, OwnerExpense } from '@/lib/ownerFinance/types';
import type { ExportColumn, ExportTable } from './columns';
import type { PdfReportModel, PdfSection } from './pdf';
import type { ExportMeta } from './index';
import { formatCentsCurrencyDe, formatDateDe } from './format';
import { metadataRows, pdfMetaLines, EXPORT_DISCLAIMER } from './index';

const INVOICE_STATUS_LABEL: Record<string, string> = {
  draft: 'Entwurf', issued: 'Gestellt', partially_paid: 'Teilbezahlt', paid: 'Bezahlt',
  overdue: 'Überfällig', void: 'Storniert', cancelled: 'Storniert', credited: 'Gutgeschrieben',
};

const EXPENSE_STATUS_LABEL: Record<string, string> = {
  unpaid: 'Offen', partially_paid: 'Teilbezahlt', paid: 'Bezahlt', void: 'Storniert',
};

export interface CustomerLookup {
  (invoice: OwnerInvoice): string;
}

/* ----------------------------------------------------------------- Invoices */

export function invoiceExportTable(invoices: OwnerInvoice[], customerName: CustomerLookup): ExportTable<OwnerInvoice> {
  const columns: ExportColumn<OwnerInvoice>[] = [
    { key: 'id', header: 'ID', type: 'text', value: (i) => i.id, id: true, width: 38 },
    { key: 'number', header: 'Nummer', type: 'text', value: (i) => i.invoice_number ?? 'Entwurf', width: 16 },
    { key: 'status', header: 'Status', type: 'text', value: (i) => INVOICE_STATUS_LABEL[i.status] ?? i.status, width: 14 },
    { key: 'customer', header: 'Kunde', type: 'text', value: (i) => customerName(i), width: 26 },
    { key: 'issue_date', header: 'Rechnungsdatum', type: 'date', value: (i) => i.issue_date, width: 15 },
    { key: 'service_date', header: 'Leistungsdatum', type: 'date', value: (i) => i.service_date, width: 15 },
    { key: 'due_date', header: 'Fällig am', type: 'date', value: (i) => i.due_date, width: 13 },
    { key: 'net', header: 'Netto', type: 'currency', value: (i) => i.net_total_cents, width: 14 },
    { key: 'vat', header: 'USt', type: 'currency', value: (i) => i.vat_total_cents, width: 12 },
    { key: 'gross', header: 'Brutto', type: 'currency', value: (i) => i.gross_total_cents, width: 14 },
    { key: 'paid', header: 'Bezahlt', type: 'currency', value: (i) => i.amount_paid_cents, width: 14 },
    { key: 'open', header: 'Offen', type: 'currency', value: (i) => i.gross_total_cents - i.amount_paid_cents, width: 14 },
    { key: 'currency', header: 'Währung', type: 'text', value: (i) => i.currency, width: 10 },
    { key: 'external_reference', header: 'Referenz', type: 'text', value: (i) => i.external_reference, id: true, width: 16 },
  ];
  return { name: 'Rechnungen', columns, rows: invoices };
}

export function invoiceReportModel(invoices: OwnerInvoice[], meta: ExportMeta, customerName: CustomerLookup): PdfReportModel {
  const sum = (f: (i: OwnerInvoice) => number) => invoices.reduce((s, i) => s + f(i), 0);
  const net = sum((i) => i.net_total_cents);
  const vat = sum((i) => i.vat_total_cents);
  const gross = sum((i) => i.gross_total_cents);
  const open = sum((i) => (['issued', 'partially_paid', 'overdue'].includes(i.status) ? i.gross_total_cents - i.amount_paid_cents : 0));
  const overdue = sum((i) => (i.status === 'overdue' ? i.gross_total_cents - i.amount_paid_cents : 0));

  const sections: PdfSection[] = [
    {
      kind: 'keyvalue', heading: 'Kennzahlen',
      rows: [
        ['Anzahl Rechnungen', String(invoices.length)],
        ['Netto gesamt', formatCentsCurrencyDe(net)],
        ['USt gesamt', formatCentsCurrencyDe(vat)],
        ['Brutto gesamt', formatCentsCurrencyDe(gross)],
        ['Offene Forderungen', formatCentsCurrencyDe(open)],
        ['davon überfällig', formatCentsCurrencyDe(overdue)],
      ],
    },
    {
      kind: 'table', heading: 'Rechnungen',
      columns: [
        { header: 'Nummer', align: 'left', width: 3 },
        { header: 'Kunde', align: 'left', width: 4 },
        { header: 'Datum', align: 'left', width: 2.4 },
        { header: 'Status', align: 'left', width: 2.4 },
        { header: 'Brutto', align: 'right', width: 2.6 },
        { header: 'Offen', align: 'right', width: 2.6 },
      ],
      rows: invoices.map((i) => [
        i.invoice_number ?? 'Entwurf',
        customerName(i),
        formatDateDe(i.issue_date),
        INVOICE_STATUS_LABEL[i.status] ?? i.status,
        formatCentsCurrencyDe(i.gross_total_cents, i.currency),
        formatCentsCurrencyDe(i.gross_total_cents - i.amount_paid_cents, i.currency),
      ]),
    },
    { kind: 'note', text: `Klar gekennzeichnete Ist-Werte aus erfassten Rechnungen und Zahlungen. ${EXPORT_DISCLAIMER}` },
  ];

  return {
    brand: 'Cogniiq',
    documentTitle: 'Rechnungen — Bericht',
    entityName: meta.entityName,
    metaLines: pdfMetaLines(meta),
    sections,
    disclaimer: `Cogniiq · ${EXPORT_DISCLAIMER}`,
  };
}

export function invoiceMetadataSheet(invoices: OwnerInvoice[], meta: ExportMeta) {
  return {
    name: 'Metadaten',
    rows: metadataRows(meta, [['Datensätze (Rechnungen)', String(invoices.length)]]),
  };
}

/* ----------------------------------------------------------------- Expenses */

export interface VendorLookup {
  (expense: OwnerExpense): string;
}

export function expenseExportTable(expenses: OwnerExpense[], vendorName: VendorLookup): ExportTable<OwnerExpense> {
  const columns: ExportColumn<OwnerExpense>[] = [
    { key: 'id', header: 'ID', type: 'text', value: (e) => e.id, id: true, width: 38 },
    { key: 'supplier_invoice_number', header: 'Belegnummer', type: 'text', value: (e) => e.supplier_invoice_number, width: 16 },
    { key: 'vendor', header: 'Lieferant', type: 'text', value: (e) => vendorName(e), width: 24 },
    { key: 'status', header: 'Status', type: 'text', value: (e) => EXPENSE_STATUS_LABEL[e.payment_status] ?? e.payment_status, width: 14 },
    { key: 'review', header: 'Prüfung', type: 'text', value: (e) => e.review_status, width: 12 },
    { key: 'invoice_date', header: 'Belegdatum', type: 'date', value: (e) => e.invoice_date, width: 14 },
    { key: 'due_date', header: 'Fällig am', type: 'date', value: (e) => e.due_date, width: 13 },
    { key: 'net', header: 'Netto', type: 'currency', value: (e) => e.net_total_cents, width: 14 },
    { key: 'input_vat', header: 'Vorsteuer', type: 'currency', value: (e) => e.input_vat_cents, width: 14 },
    { key: 'gross', header: 'Brutto', type: 'currency', value: (e) => e.gross_total_cents, width: 14 },
    { key: 'paid', header: 'Bezahlt', type: 'currency', value: (e) => e.amount_paid_cents, width: 14 },
    { key: 'deductible', header: 'Abziehbar netto', type: 'currency', value: (e) => e.deductible_net_cents, width: 16 },
    { key: 'currency', header: 'Währung', type: 'text', value: (e) => e.currency, width: 10 },
  ];
  return { name: 'Ausgaben', columns, rows: expenses };
}

export function expenseReportModel(expenses: OwnerExpense[], meta: ExportMeta, vendorName: VendorLookup): PdfReportModel {
  const sum = (f: (e: OwnerExpense) => number) => expenses.reduce((s, e) => s + f(e), 0);
  const net = sum((e) => e.net_total_cents);
  const inputVat = sum((e) => e.input_vat_cents);
  const gross = sum((e) => e.gross_total_cents);
  const open = sum((e) => (e.payment_status === 'unpaid' || e.payment_status === 'partially_paid' ? e.gross_total_cents - e.amount_paid_cents : 0));

  const sections: PdfSection[] = [
    {
      kind: 'keyvalue', heading: 'Kennzahlen',
      rows: [
        ['Anzahl Ausgaben', String(expenses.length)],
        ['Netto gesamt', formatCentsCurrencyDe(net)],
        ['Vorsteuer gesamt', formatCentsCurrencyDe(inputVat)],
        ['Brutto gesamt', formatCentsCurrencyDe(gross)],
        ['Offen', formatCentsCurrencyDe(open)],
      ],
    },
    {
      kind: 'table', heading: 'Ausgaben',
      columns: [
        { header: 'Beleg', align: 'left', width: 2.6 },
        { header: 'Lieferant', align: 'left', width: 4 },
        { header: 'Datum', align: 'left', width: 2.4 },
        { header: 'Status', align: 'left', width: 2.2 },
        { header: 'Netto', align: 'right', width: 2.6 },
        { header: 'Brutto', align: 'right', width: 2.6 },
      ],
      rows: expenses.map((e) => [
        e.supplier_invoice_number ?? '—',
        vendorName(e),
        formatDateDe(e.invoice_date),
        EXPENSE_STATUS_LABEL[e.payment_status] ?? e.payment_status,
        formatCentsCurrencyDe(e.net_total_cents, e.currency),
        formatCentsCurrencyDe(e.gross_total_cents, e.currency),
      ]),
    },
    { kind: 'note', text: `Ist-Werte aus erfassten Belegen. ${EXPORT_DISCLAIMER}` },
  ];

  return {
    brand: 'Cogniiq',
    documentTitle: 'Ausgaben — Bericht',
    entityName: meta.entityName,
    metaLines: pdfMetaLines(meta),
    sections,
    disclaimer: `Cogniiq · ${EXPORT_DISCLAIMER}`,
  };
}

export function expenseMetadataSheet(expenses: OwnerExpense[], meta: ExportMeta) {
  return {
    name: 'Metadaten',
    rows: metadataRows(meta, [['Datensätze (Ausgaben)', String(expenses.length)]]),
  };
}
