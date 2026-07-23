// Shared, typed column model consumed by both the CSV and XLSX builders so a dataset is described
// once and exported to any format with a stable column order and correct value typing. This is the
// backbone of the Export Center: the same ExportTable feeds CSV, XLSX and (for summaries) PDF.

import { formatCentsPlain, formatDecimalDe, isoDate } from './format';

/** Logical value type. Drives XLSX cell typing/number-format and CSV decimal representation. */
export type ExportCellType = 'text' | 'number' | 'currency' | 'percent' | 'date' | 'integer';

export interface ExportColumn<Row> {
  /** Stable machine key (also the CSV/XLSX header unless `header` overrides). */
  key: string;
  /** Human header. */
  header: string;
  type: ExportCellType;
  /** Extract the logical value. Numbers are returned in their natural unit: currency = cents,
   *  percent = basis points, number/integer = the number itself, date = ISO string, text = string. */
  value: (row: Row) => string | number | null | undefined;
  /** Marks a column as an internal identifier, excluded unless `includeIds` is requested. */
  id?: boolean;
  /** Optional preferred width in characters for XLSX. */
  width?: number;
}

export interface ExportTable<Row> {
  /** Sheet/section name, e.g. "Rechnungen". */
  name: string;
  columns: ExportColumn<Row>[];
  rows: Row[];
}

/** A normalized cell used by the format writers: keeps the logical number plus a display string. */
export interface NormalizedCell {
  type: ExportCellType;
  /** Raw number in natural unit (cents/bp/number) or null for text/empty. */
  num: number | null;
  /** Text value for text/date columns, or the German-formatted string for CSV number output. */
  text: string;
}

const FORMULA_TRIGGERS = ['=', '+', '-', '@', '\t', '\r'];

/**
 * Neutralize spreadsheet formula injection. A leading =, +, -, @ (or tab/CR) in a text value can be
 * interpreted as a formula by Excel/LibreOffice/Sheets. We prefix a single quote which those apps
 * treat as "force text". Applied to text-typed values only; numeric/date cells are emitted as typed
 * values and are never affected. See OWASP "CSV Injection".
 */
export function sanitizeTextCell(raw: string): string {
  if (raw.length === 0) return raw;
  return FORMULA_TRIGGERS.includes(raw[0]) ? `'${raw}` : raw;
}

/** Convert a logical value into a normalized cell for a given column type. */
export function normalizeCell(type: ExportCellType, value: string | number | null | undefined): NormalizedCell {
  if (value == null || value === '') {
    return { type, num: null, text: '' };
  }
  switch (type) {
    case 'currency': {
      const cents = typeof value === 'number' ? value : Number(value);
      return { type, num: cents, text: formatCentsPlain(cents) };
    }
    case 'percent': {
      const bp = typeof value === 'number' ? value : Number(value);
      return { type, num: bp, text: formatDecimalDe(bp / 100, 2) };
    }
    case 'number': {
      const n = typeof value === 'number' ? value : Number(value);
      return { type, num: n, text: formatDecimalDe(n, 2) };
    }
    case 'integer': {
      const n = typeof value === 'number' ? value : Number(value);
      return { type, num: Math.round(n), text: String(Math.round(n)) };
    }
    case 'date': {
      const iso = isoDate(String(value));
      return { type, num: null, text: iso };
    }
    case 'text':
    default:
      return { type, num: null, text: sanitizeTextCell(String(value)) };
  }
}

export interface CsvOptions {
  /** Include columns flagged `id`. Default false (advanced/raw export sets true). */
  includeIds?: boolean;
  /** Prepend a UTF-8 BOM so Microsoft Excel detects UTF-8. Default true. */
  bom?: boolean;
  /** Field delimiter. Default ';' for German Excel compatibility. */
  delimiter?: ';' | ',';
}

const CSV_BOM = '﻿';

function csvEscape(text: string, delimiter: string): string {
  // Always quote when the value contains the delimiter, a quote, or any newline; escape quotes by doubling.
  if (text.includes('"') || text.includes(delimiter) || /[\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/** Serialize a value for CSV: numbers use German decimals (comma), text is formula-safe. */
function csvValue(cell: NormalizedCell): string {
  if (cell.num == null) return cell.text; // text/date/empty (already sanitized)
  // Numeric types: emit the German-formatted number WITHOUT thousands separators to keep it
  // machine-parseable while matching the de-DE decimal comma. Excel with de locale parses this.
  switch (cell.type) {
    case 'currency':
      return formatDecimalDe(cell.num / 100, 2).replace(/\./g, '');
    case 'percent':
      return formatDecimalDe(cell.num / 100, 2).replace(/\./g, '');
    case 'integer':
      return String(Math.round(cell.num));
    case 'number':
    default:
      return formatDecimalDe(cell.num, 2).replace(/\./g, '');
  }
}

/** Build a single-table CSV string (UTF-8, semicolon, BOM, formula-safe, stable columns). */
export function buildTableCsv<Row>(table: ExportTable<Row>, opts: CsvOptions = {}): string {
  const delimiter = opts.delimiter ?? ';';
  const bom = opts.bom ?? true;
  const cols = table.columns.filter((c) => opts.includeIds || !c.id);
  const headerLine = cols.map((c) => csvEscape(sanitizeTextCell(c.header), delimiter)).join(delimiter);
  const lines = [headerLine];
  for (const row of table.rows) {
    const line = cols
      .map((c) => csvEscape(csvValue(normalizeCell(c.type, c.value(row))), delimiter))
      .join(delimiter);
    lines.push(line);
  }
  return (bom ? CSV_BOM : '') + lines.join('\r\n') + '\r\n';
}
