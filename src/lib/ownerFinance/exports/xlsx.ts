// Real OOXML (.xlsx) workbook generation — NOT a renamed CSV. Produces a valid SpreadsheetML package
// (a ZIP of XML parts) with correctly typed number/date/currency/percent cells, a frozen header row,
// an auto-filter, sensible column widths and one or more sheets. Text cells are formula-injection
// sanitized upstream via the shared column model. Loaded via dynamic import so it never inflates the
// initial bundle. Deterministic output (fixed timestamps) so a given dataset hashes identically.

import { ZipBuilder } from './zip';
import {
  type ExportTable,
  normalizeCell,
  sanitizeTextCell,
} from './columns';

/** A key/value metadata sheet (e.g. entity, period, generated timestamp, record counts). */
export interface MetadataSheet {
  name: string;
  rows: Array<[string, string]>;
}

function colLetter(index: number): string {
  let n = index + 1;
  let s = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function xmlEscape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Excel serial date (1900 system, includes the historical 1900 leap-year offset via 1899-12-30 epoch). */
function excelSerial(iso: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  const date = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const epoch = Date.UTC(1899, 11, 30);
  return Math.round((date - epoch) / 86400000);
}

// Style indices (must match the order of <cellXfs> below).
const STYLE = { text: 0, header: 1, currency: 2, percent: 3, date: 4, integer: 5, number: 6, metaKey: 7 } as const;

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="4">
<numFmt numFmtId="164" formatCode="#,##0.00&quot; &#8364;&quot;"/>
<numFmt numFmtId="165" formatCode="0.00%"/>
<numFmt numFmtId="166" formatCode="DD.MM.YYYY"/>
<numFmt numFmtId="167" formatCode="#,##0.00"/>
</numFmts>
<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF3F4F6"/></patternFill></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="8">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="166" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="1" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="167" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

interface SheetSpec {
  name: string;
  xml: string;
}

function buildDataSheetXml<Row>(table: ExportTable<Row>, includeIds: boolean): string {
  const cols = table.columns.filter((c) => includeIds || !c.id);
  const lastCol = colLetter(cols.length - 1);
  const lastRow = table.rows.length + 1;

  const colWidths = cols
    .map((c, i) => {
      const width = c.width ?? Math.min(48, Math.max(10, c.header.length + 4));
      return `<col min="${i + 1}" max="${i + 1}" width="${width}" customWidth="1"/>`;
    })
    .join('');

  // Header row (style: header).
  const headerCells = cols
    .map((c, i) => `<c r="${colLetter(i)}1" s="${STYLE.header}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(sanitizeTextCell(c.header))}</t></is></c>`)
    .join('');
  const rows = [`<row r="1">${headerCells}</row>`];

  table.rows.forEach((row, rIdx) => {
    const r = rIdx + 2;
    const cells = cols
      .map((c, i) => {
        const ref = `${colLetter(i)}${r}`;
        const cell = normalizeCell(c.type, c.value(row));
        if (cell.text === '' && cell.num == null) return `<c r="${ref}"/>`;
        switch (cell.type) {
          case 'currency':
            return `<c r="${ref}" s="${STYLE.currency}"><v>${(cell.num as number) / 100}</v></c>`;
          case 'percent':
            return `<c r="${ref}" s="${STYLE.percent}"><v>${(cell.num as number) / 10000}</v></c>`;
          case 'integer':
            return `<c r="${ref}" s="${STYLE.integer}"><v>${Math.round(cell.num as number)}</v></c>`;
          case 'number':
            return `<c r="${ref}" s="${STYLE.number}"><v>${cell.num}</v></c>`;
          case 'date': {
            const serial = excelSerial(cell.text);
            return serial == null
              ? `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(cell.text)}</t></is></c>`
              : `<c r="${ref}" s="${STYLE.date}"><v>${serial}</v></c>`;
          }
          case 'text':
          default:
            return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(cell.text)}</t></is></c>`;
        }
      })
      .join('');
    rows.push(`<row r="${r}">${cells}</row>`);
  });

  const dimension = `A1:${lastCol}${Math.max(lastRow, 1)}`;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<dimension ref="${dimension}"/>
<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="15"/>
<cols>${colWidths}</cols>
<sheetData>${rows.join('')}</sheetData>
<autoFilter ref="A1:${lastCol}${Math.max(lastRow, 1)}"/>
</worksheet>`;
}

function buildMetadataSheetXml(meta: MetadataSheet): string {
  const rows = meta.rows
    .map(([k, v], idx) => {
      const r = idx + 1;
      return `<row r="${r}"><c r="A${r}" s="${STYLE.metaKey}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(sanitizeTextCell(k))}</t></is></c><c r="B${r}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(sanitizeTextCell(v))}</t></is></c></row>`;
    })
    .join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<dimension ref="A1:B${Math.max(meta.rows.length, 1)}"/>
<sheetViews><sheetView workbookViewId="0"/></sheetViews>
<cols><col min="1" max="1" width="32" customWidth="1"/><col min="2" max="2" width="52" customWidth="1"/></cols>
<sheetData>${rows}</sheetData>
</worksheet>`;
}

export interface WorkbookInput {
  /** Data sheets, exported in order. */
  tables: ExportTable<unknown>[];
  /** Optional metadata sheet appended last (entity, period, counts, warnings, source hash). */
  metadata?: MetadataSheet;
  /** Include internal-id columns (advanced/raw export). Default false. */
  includeIds?: boolean;
}

/** Build a complete .xlsx byte array from one or more typed tables plus optional metadata. */
export function buildWorkbook(input: WorkbookInput): Uint8Array {
  const specs: SheetSpec[] = [];
  input.tables.forEach((t) => specs.push({ name: sheetName(t.name, specs), xml: buildDataSheetXml(t, input.includeIds ?? false) }));
  if (input.metadata) specs.push({ name: sheetName(input.metadata.name, specs), xml: buildMetadataSheetXml(input.metadata) });
  if (specs.length === 0) specs.push({ name: 'Leer', xml: buildDataSheetXml({ name: 'Leer', columns: [], rows: [] }, false) });

  const zip = new ZipBuilder();
  zip.addText(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
${specs.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('\n')}
</Types>`,
  );
  zip.addText(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
  );
  zip.addText(
    'xl/workbook.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>${specs.map((s, i) => `<sheet name="${xmlEscape(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets>
</workbook>`,
  );
  zip.addText(
    'xl/_rels/workbook.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${specs.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('\n')}
<Relationship Id="rId${specs.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
  );
  zip.addText('xl/styles.xml', STYLES_XML);
  specs.forEach((s, i) => zip.addText(`xl/worksheets/sheet${i + 1}.xml`, s.xml));
  return zip.build();
}

/** Sanitize + de-duplicate a sheet name to Excel's constraints (≤31 chars, no []:*?/\ ). */
function sheetName(raw: string, existing: SheetSpec[]): string {
  const name = raw.replace(/[[\]:*?/\\]/g, ' ').slice(0, 31).trim() || 'Blatt';
  let candidate = name;
  let n = 2;
  while (existing.some((s) => s.name.toLowerCase() === candidate.toLowerCase())) {
    const suffix = ` ${n}`;
    candidate = name.slice(0, 31 - suffix.length) + suffix;
    n += 1;
  }
  return candidate;
}
