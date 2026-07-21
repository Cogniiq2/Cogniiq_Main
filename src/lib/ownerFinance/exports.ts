// Client-side export builders. V1 is preparation/export only — never an official ELSTER filing.
// Every export declares entity, period, generated timestamp and rules version in a header block.

import { RULES_VERSION } from '@/lib/ownerFinance/tax';

export const EXPORT_SCHEMA_VERSION = 'owner-finance-export-v1';

function csvCell(value: unknown): string {
  const s = value == null ? '' : String(value);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function buildCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const lines = [headers.map(csvCell).join(';')];
  for (const row of rows) lines.push(row.map(csvCell).join(';'));
  return lines.join('\r\n');
}

export interface ExportMeta {
  entityName: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  valueBasis: 'actual' | 'forecast' | 'estimated' | 'mixed';
}

export function withExportBanner(meta: ExportMeta, body: string): string {
  const banner = [
    `# Cogniiq Finanz-Export (${EXPORT_SCHEMA_VERSION})`,
    `# Entität: ${meta.entityName}`,
    `# Zeitraum: ${meta.periodStart ?? '—'} bis ${meta.periodEnd ?? '—'}`,
    `# Erstellt: ${new Date().toISOString()}`,
    `# Berechnungsversion: ${RULES_VERSION}`,
    `# Wertebasis: ${meta.valueBasis}`,
    '# Hinweis: Vorbereitung/Export – keine offizielle ELSTER-Übermittlung; Werte vor Abgabe prüfen.',
    '',
  ].join('\r\n');
  return banner + body;
}

export function downloadText(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportCsv(filename: string, meta: ExportMeta, headers: string[], rows: (string | number | null | undefined)[][]): void {
  downloadText(filename, withExportBanner(meta, buildCsv(headers, rows)), 'text/csv');
}

export function exportJson(filename: string, meta: ExportMeta, payload: Record<string, unknown>): void {
  const doc = {
    schema: EXPORT_SCHEMA_VERSION,
    rules_version: RULES_VERSION,
    entity: meta.entityName,
    period: { start: meta.periodStart ?? null, end: meta.periodEnd ?? null },
    generated_at: new Date().toISOString(),
    value_basis: meta.valueBasis,
    disclaimer: 'Vorbereitung/Export – keine offizielle ELSTER-Übermittlung, keine ERiC-Validierung. Werte vor Abgabe prüfen.',
    data: payload,
  };
  downloadText(filename, JSON.stringify(doc, null, 2), 'application/json');
}
