// Orchestrates a single Export Center action end to end: build the requested format from a typed
// spec, trigger the browser download, and record the owner_exports audit entry (with a deterministic
// source hash) so the Export history reflects every generated file — never just a toast. Kept out of
// the pure exports/ builders because it touches the Supabase client via recordExportRun.

import { recordExportRun } from '@/lib/ownerFinance/api';
import {
  exportTableCsv, exportWorkbook, exportReportPdf, exportJson,
  describeExport, type ExportFormat, type ExportMode, type ExportMeta,
  type MetadataSheet, type PdfReportModel,
} from '@/lib/ownerFinance/exports';
import type { ExportTable } from '@/lib/ownerFinance/exports';

export interface FinanceExportSpec {
  entityId: string;
  /** Logical export type, e.g. 'invoices'. Combined with the format for the audit export_type. */
  exportType: string;
  /** Base filename without extension, e.g. 'Rechnungen'. */
  baseFilename: string;
  meta: ExportMeta;
  /** Primary tabular data for CSV and the first XLSX sheet. */
  table: ExportTable<unknown>;
  /** Additional XLSX sheets (positions, payments, …). */
  extraTables?: ExportTable<unknown>[];
  metadataSheet?: MetadataSheet;
  reportModel: PdfReportModel;
  jsonPayload?: Record<string, unknown>;
  /** Snapshot hashed for provenance (owner_exports.source_hash). */
  snapshot: unknown;
  counts: Record<string, number>;
  includeIds?: boolean;
}

/**
 * Run an export for the chosen format/mode. Returns a warning string when the format is unsupported
 * for the spec (e.g. JSON requested without a payload), otherwise null on success. Throws on a real
 * build/download failure so the caller can surface an error toast.
 */
export async function runFinanceExport(
  format: ExportFormat,
  mode: ExportMode,
  spec: FinanceExportSpec,
): Promise<{ warning: string | null }> {
  const dateTag = new Date().toISOString().slice(0, 10);
  const filenameBase = `${spec.baseFilename}-${dateTag}`;
  let warning: string | null = null;

  switch (format) {
    case 'csv':
      exportTableCsv(`${filenameBase}.csv`, spec.table, { includeIds: spec.includeIds });
      break;
    case 'xlsx':
      await exportWorkbook(`${filenameBase}.xlsx`, {
        tables: [spec.table, ...(spec.extraTables ?? [])],
        metadata: spec.metadataSheet,
        includeIds: spec.includeIds,
      });
      break;
    case 'pdf':
      await exportReportPdf(`${filenameBase}.pdf`, spec.reportModel);
      break;
    case 'json':
      if (!spec.jsonPayload) { warning = 'JSON-Export für diese Ansicht nicht verfügbar.'; break; }
      exportJson(`${filenameBase}.json`, spec.meta, spec.jsonPayload);
      break;
    default:
      warning = `Format ${format} nicht unterstützt.`;
  }

  if (warning) return { warning };

  const descriptor = describeExport(
    `${spec.exportType}:${mode}`,
    format,
    spec.meta,
    spec.counts,
    spec.snapshot,
    [],
  );
  // Audit recording is best-effort: a failed insert must not break the user's download.
  const { error } = await recordExportRun(spec.entityId, {
    export_type: `${spec.exportType}:${format}`,
    period_start: spec.meta.periodStart ?? null,
    period_end: spec.meta.periodEnd ?? null,
    rules_version: descriptor.rules_version,
    record_counts: spec.counts,
    warnings: [],
    source_hash: descriptor.source_hash,
    file_metadata: { format, mode, filters: spec.meta.filtersLabel ?? null, value_basis: spec.meta.valueBasis },
  });
  return { warning: error ? `Export erstellt, Audit-Eintrag fehlgeschlagen: ${error}` : null };
}
