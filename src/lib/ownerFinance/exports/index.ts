// Universal Export Center — public API. Composes the pure builders (CSV/XLSX/PDF/hash) into a small
// download-oriented surface used by ExportMenu and the finance pages. The heavier XLSX and PDF
// generators are pulled in via dynamic import() inside the export functions so they land in their own
// lazily-loaded chunks and never inflate the initial (or even the finance) bundle. Every export can
// be recorded in owner_exports for the export audit — this module returns the metadata needed for it.

import { RULES_VERSION } from '@/lib/ownerFinance/tax';
import { buildTableCsv, type ExportTable, type CsvOptions } from './columns';
import { sourceHash } from './sourceHash';
import { formatTimestampDe } from './format';
import type { WorkbookInput } from './xlsx';
import type { PdfReportModel } from './pdf';

export * from './format';
export * from './columns';
export * from './sourceHash';
export type { MetadataSheet, WorkbookInput } from './xlsx';
export type { PdfReportModel, PdfSection, PdfTableColumn } from './pdf';

export const EXPORT_SCHEMA_VERSION = 'owner-finance-export-v2';

export type ExportFormat = 'pdf' | 'csv' | 'xlsx' | 'json';
export type ExportMode = 'current' | 'selected' | 'all' | 'range' | 'tax_year';
export type ValueBasis = 'actual' | 'forecast' | 'estimated' | 'mixed';

export interface ExportMeta {
  entityName: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  valueBasis: ValueBasis;
  /** Human label for the active filters, echoed into exports for auditability. */
  filtersLabel?: string;
  /** Machine mode indicating what selection produced the export. */
  mode?: ExportMode;
}

/** Standard disclaimer for finance exports (preparation, not an official filing). */
export const EXPORT_DISCLAIMER =
  'Vorbereitung/Export – keine offizielle ELSTER-Übermittlung, keine ERiC-Validierung. Werte vor Abgabe prüfen.';

/* ----------------------------------------------------------------- Download helpers (browser) */

export function downloadText(filename: string, content: string, mime: string): void {
  downloadBlob(filename, new Blob([content], { type: `${mime};charset=utf-8` }));
}

export function downloadBytes(filename: string, bytes: Uint8Array, mime: string): void {
  // Copy into a fresh ArrayBuffer to satisfy the BlobPart type across TS lib versions.
  const buf = bytes.slice();
  downloadBlob(filename, new Blob([buf], { type: mime }));
}

function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ----------------------------------------------------------------- Metadata helpers */

/** Build the standard key/value metadata rows shared by CSV headers, XLSX metadata sheets and PDF meta lines. */
export function metadataRows(meta: ExportMeta, extra: Array<[string, string]> = []): Array<[string, string]> {
  return [
    ['Schema', EXPORT_SCHEMA_VERSION],
    ['Berechnungsversion', RULES_VERSION],
    ['Entität', meta.entityName],
    ['Zeitraum von', meta.periodStart ?? '—'],
    ['Zeitraum bis', meta.periodEnd ?? '—'],
    ['Wertebasis', meta.valueBasis],
    ['Filter', meta.filtersLabel ?? 'Alle'],
    ['Erstellt', formatTimestampDe(new Date())],
    ...extra,
    ['Hinweis', EXPORT_DISCLAIMER],
  ];
}

export function pdfMetaLines(meta: ExportMeta): string[] {
  const lines = [
    `Entität: ${meta.entityName}`,
    `Zeitraum: ${meta.periodStart ?? '—'} bis ${meta.periodEnd ?? '—'}`,
  ];
  if (meta.filtersLabel) lines.push(`Filter: ${meta.filtersLabel}`);
  lines.push(`Wertebasis: ${meta.valueBasis} · Erstellt: ${formatTimestampDe(new Date())} · ${EXPORT_SCHEMA_VERSION}`);
  return lines;
}

/* ----------------------------------------------------------------- CSV */

export { buildTableCsv } from './columns';

export function exportTableCsv<Row>(filename: string, table: ExportTable<Row>, opts?: CsvOptions): void {
  downloadText(filename, buildTableCsv(table, opts), 'text/csv');
}

/* ----------------------------------------------------------------- XLSX (dynamic) */

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Generate and download a real .xlsx. The generator (+ zip) load lazily on first use. */
export async function exportWorkbook(filename: string, input: WorkbookInput): Promise<void> {
  const { buildWorkbook } = await import('./xlsx');
  downloadBytes(filename, buildWorkbook(input), XLSX_MIME);
}

export async function buildWorkbookBytes(input: WorkbookInput): Promise<Uint8Array> {
  const { buildWorkbook } = await import('./xlsx');
  return buildWorkbook(input);
}

/* ----------------------------------------------------------------- PDF (dynamic) */

export async function exportReportPdf(filename: string, model: PdfReportModel): Promise<void> {
  const { renderReportPdf } = await import('./pdf');
  downloadBytes(filename, renderReportPdf(model), 'application/pdf');
}

export async function buildReportPdfBytes(model: PdfReportModel): Promise<Uint8Array> {
  const { renderReportPdf } = await import('./pdf');
  return renderReportPdf(model);
}

/* ----------------------------------------------------------------- JSON (back-compat + audited) */

export function exportJson(filename: string, meta: ExportMeta, payload: Record<string, unknown>): void {
  const doc = {
    schema: EXPORT_SCHEMA_VERSION,
    rules_version: RULES_VERSION,
    entity: meta.entityName,
    period: { start: meta.periodStart ?? null, end: meta.periodEnd ?? null },
    generated_at: new Date().toISOString(),
    value_basis: meta.valueBasis,
    filters: meta.filtersLabel ?? null,
    disclaimer: EXPORT_DISCLAIMER,
    data: payload,
  };
  downloadText(filename, JSON.stringify(doc, null, 2), 'application/json');
}

/**
 * Back-compat CSV helper matching the previous flat `exports.ts` signature (headers + raw rows). New
 * code should prefer the typed `exportTableCsv`. Emits UTF-8 BOM, semicolons and formula-safe cells.
 */
export function exportCsv(
  filename: string,
  _meta: ExportMeta,
  headers: string[],
  rows: (string | number | null | undefined)[][],
): void {
  const table: ExportTable<(string | number | null | undefined)[]> = {
    name: 'Export',
    columns: headers.map((h, i) => ({ key: `c${i}`, header: h, type: 'text', value: (r) => r[i] ?? '' })),
    rows,
  };
  downloadText(filename, buildTableCsv(table), 'text/csv');
}

/* ----------------------------------------------------------------- Export-audit descriptor */

export interface ExportAuditDescriptor {
  export_type: string;
  format: ExportFormat;
  period_start: string | null;
  period_end: string | null;
  rules_version: string;
  record_counts: Record<string, number>;
  warnings: string[];
  source_hash: string;
}

/** Build an owner_exports audit descriptor for a finished export, including a deterministic source hash. */
export function describeExport(
  exportType: string,
  format: ExportFormat,
  meta: ExportMeta,
  counts: Record<string, number>,
  snapshot: unknown,
  warnings: string[] = [],
): ExportAuditDescriptor {
  return {
    export_type: `${exportType}:${format}`,
    format,
    period_start: meta.periodStart ?? null,
    period_end: meta.periodEnd ?? null,
    rules_version: RULES_VERSION,
    record_counts: counts,
    warnings,
    source_hash: sourceHash(snapshot),
  };
}
