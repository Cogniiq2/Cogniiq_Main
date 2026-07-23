// Unit tests for the Universal Export Center pure builders (CSV / XLSX / PDF / source hash / German
// formatting). Like the tax tests, the TypeScript modules are bundled on the fly with esbuild (a
// devDependency) and imported directly — no test framework, no DB, no deployment. These exercise the
// real shipped logic that produces downloaded files. The XLSX check parses the generated ZIP back
// and recomputes every entry's CRC32; the PDF check validates the byte-exact xref offset table.

import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const base = resolve(here, '../../src/lib/ownerFinance/exports');

async function bundle(rel) {
  const result = await build({
    entryPoints: [resolve(base, rel)],
    bundle: true, format: 'esm', write: false, platform: 'neutral', logLevel: 'silent',
  });
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
}

const [format, columns, xlsx, pdf, hash] = await Promise.all([
  bundle('format.ts'), bundle('columns.ts'), bundle('xlsx.ts'), bundle('pdf.ts'), bundle('sourceHash.ts'),
]);

let failures = 0;
function eq(actual, expected, msg) {
  if (actual !== expected) { console.error(`FAIL: ${msg} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`); failures += 1; }
}
function ok(cond, msg) { if (!cond) { console.error(`FAIL: ${msg}`); failures += 1; } }

/* ---------------------------------------------------------------- ZIP/PDF parse helpers (defined before use) */
function u32(bytes, off) { return (bytes[off] | (bytes[off + 1] << 8) | (bytes[off + 2] << 16) | (bytes[off + 3] << 24)) >>> 0; }
function u16(bytes, off) { return bytes[off] | (bytes[off + 1] << 8); }
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(b) { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function parseZip(bytes) {
  let eocd = -1;
  for (let i = bytes.length - 22; i >= 0; i--) { if (u32(bytes, i) === 0x06054b50) { eocd = i; break; } }
  if (eocd < 0) { ok(false, 'EOCD found'); return []; }
  const count = u16(bytes, eocd + 10);
  let cd = u32(bytes, eocd + 16);
  const out = [];
  for (let i = 0; i < count; i++) {
    if (u32(bytes, cd) !== 0x02014b50) { ok(false, 'central dir signature'); break; }
    const crc = u32(bytes, cd + 16);
    const size = u32(bytes, cd + 20);
    const nameLen = u16(bytes, cd + 28);
    const extraLen = u16(bytes, cd + 30);
    const commentLen = u16(bytes, cd + 32);
    const localOff = u32(bytes, cd + 42);
    const name = Buffer.from(bytes.slice(cd + 46, cd + 46 + nameLen)).toString('utf8');
    ok(u32(bytes, localOff) === 0x04034b50, `local header sig for ${name}`);
    const lNameLen = u16(bytes, localOff + 26);
    const lExtraLen = u16(bytes, localOff + 28);
    const dataStart = localOff + 30 + lNameLen + lExtraLen;
    const data = bytes.slice(dataStart, dataStart + size);
    out.push({ name, data, crcOk: crc32(data) === crc });
    cd += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}
function textOf(entries, name) { const e = entries.find((x) => x.name === name); return e ? Buffer.from(e.data).toString('utf8') : ''; }

/* ---------------------------------------------------------------- German formatting */
eq(format.formatDecimalDe(1234.5, 2), '1.234,50', 'de decimal thousands + comma');
eq(format.formatDecimalDe(-9.9, 2), '-9,90', 'de decimal negative');
eq(format.formatCentsPlain(123456), '1.234,56', 'cents plain');
eq(format.formatCentsCurrencyDe(123456, 'EUR'), '1.234,56 €', 'cents currency euro');
eq(format.formatBpPercentDe(1900), '19 %', 'bp percent whole');
eq(format.formatBpPercentDe(750), '7,5 %', 'bp percent fractional');
eq(format.formatQuantityMilli(1500), '1,5', 'quantity milli trims zeros');
eq(format.formatQuantityMilli(2000), '2', 'quantity milli integer');
eq(format.isoDate('2026-07-22T10:00:00Z'), '2026-07-22', 'iso date from timestamp');
eq(format.formatDateDe('2026-12-31'), '31.12.2026', 'german display date');

/* ---------------------------------------------------------------- CSV: escaping, BOM, injection */
const invoiceCols = [
  { key: 'id', header: 'ID', type: 'text', value: (r) => r.id, id: true },
  { key: 'number', header: 'Nummer', type: 'text', value: (r) => r.number },
  { key: 'customer', header: 'Kunde', type: 'text', value: (r) => r.customer },
  { key: 'issue', header: 'Datum', type: 'date', value: (r) => r.issue },
  { key: 'net', header: 'Netto', type: 'currency', value: (r) => r.net },
  { key: 'rate', header: 'USt-Satz', type: 'percent', value: (r) => r.rate },
];
const invoiceRows = [
  { id: 'uuid-1', number: 'RE-2026-0001', customer: 'ACME; GmbH', issue: '2026-03-01', net: 123456, rate: 1900 },
  { id: 'uuid-2', number: 'RE-2026-0002', customer: '=cmd|calc', issue: '2026-04-15T00:00:00Z', net: -5000, rate: 700 },
  { id: 'uuid-3', number: 'RE"quote"', customer: 'Line\nBreak', issue: '', net: 0, rate: 0 },
];
const table = { name: 'Rechnungen', columns: invoiceCols, rows: invoiceRows };

const csv = columns.buildTableCsv(table);
ok(csv.charCodeAt(0) === 0xfeff, 'CSV starts with UTF-8 BOM');
const csvBody = csv.slice(1);
const lines = csvBody.split('\r\n');
eq(lines[0], 'Nummer;Kunde;Datum;Netto;USt-Satz', 'header excludes id column by default, semicolon-delimited');
ok(lines[0].split(';').length === 5, 'id column hidden by default');
ok(csvBody.includes('"ACME; GmbH"'), 'delimiter inside value is quoted');
ok(csvBody.includes("'=cmd|calc") || csvBody.includes('"\'=cmd|calc"'), 'formula-injection value prefixed with quote');
ok(!/;=cmd\|calc/.test(csvBody), 'no raw leading = survives (formula injection neutralized)');
ok(csvBody.includes('"RE""quote"""'), 'embedded double-quotes doubled');
ok(csvBody.includes('"Line\nBreak"'), 'newline value quoted');
ok(csvBody.includes('1234,56'), 'currency uses comma decimal, no thousands dot in data');
ok(csvBody.includes('-50,00'), 'negative currency');
ok(csvBody.includes('19,00'), 'percent rendered as comma decimal');
ok(csvBody.includes('2026-03-01'), 'machine-readable ISO date in data column');
ok(csvBody.includes('2026-04-15'), 'timestamp normalized to ISO date');

const csvIds = columns.buildTableCsv(table, { includeIds: true });
ok(csvIds.slice(1).split('\r\n')[0].startsWith('ID;Nummer;'), 'includeIds exposes id column');

const csvComma = columns.buildTableCsv(table, { delimiter: ',', bom: false });
ok(csvComma.charCodeAt(0) !== 0xfeff, 'bom:false suppresses BOM');
ok(csvComma.split('\r\n')[0] === 'Nummer,Kunde,Datum,Netto,USt-Satz', 'comma delimiter option');

// sanitizeTextCell direct
eq(columns.sanitizeTextCell('=1+1'), "'=1+1", 'sanitize equals');
eq(columns.sanitizeTextCell('+49 170'), "'+49 170", 'sanitize plus');
eq(columns.sanitizeTextCell('-5'), "'-5", 'sanitize minus');
eq(columns.sanitizeTextCell('@handle'), "'@handle", 'sanitize at');
eq(columns.sanitizeTextCell('normal'), 'normal', 'sanitize leaves normal text');
eq(columns.sanitizeTextCell(''), '', 'sanitize empty');

/* ---------------------------------------------------------------- Source hash */
eq(hash.sha256HexString(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'sha256 empty vector');
eq(hash.sha256HexString('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad', 'sha256 abc vector');
const h1 = hash.sourceHash({ a: 1, b: [2, 3], c: { x: 9, y: 10 } });
const h2 = hash.sourceHash({ c: { y: 10, x: 9 }, b: [2, 3], a: 1 });
eq(h1, h2, 'source hash invariant to object key order');
ok(hash.sourceHash({ a: 1 }) !== hash.sourceHash({ a: 2 }), 'source hash changes with data');
eq(hash.sourceHash(invoiceRows), hash.sourceHash(invoiceRows), 'source hash deterministic on same input');

/* ---------------------------------------------------------------- XLSX: real ZIP + typed cells */
const wb = xlsx.buildWorkbook({
  tables: [table],
  metadata: { name: 'Metadaten', rows: [['Entität', 'Cogniiq'], ['Zeitraum', '2026'], ['Bad', '=EVIL()']] },
});
ok(wb instanceof Uint8Array && wb.length > 200, 'workbook produced bytes');

const entries = parseZip(wb);
ok(entries.length >= 6, `zip has expected parts (got ${entries.length})`);
for (const e of entries) ok(e.crcOk, `crc32 valid for ${e.name}`);
const names = entries.map((e) => e.name);
ok(names.includes('[Content_Types].xml'), 'has content types');
ok(names.includes('xl/workbook.xml'), 'has workbook');
ok(names.includes('xl/styles.xml'), 'has styles');
ok(names.includes('xl/worksheets/sheet1.xml'), 'has data sheet');
ok(names.includes('xl/worksheets/sheet2.xml'), 'has metadata sheet');

const sheet1 = textOf(entries, 'xl/worksheets/sheet1.xml');
ok(sheet1.includes('state="frozen"'), 'frozen header pane present');
ok(sheet1.includes('<autoFilter'), 'autofilter present');
// Visible columns after hiding the id column: A=Nummer(text) B=Kunde(text) C=Datum(date) D=Netto(currency) E=USt-Satz(percent).
ok(/<c r="D2" s="2"><v>1234\.56<\/v>/.test(sheet1), 'currency cell typed as number in euros (cents/100)');
ok(/<c r="E2" s="3"><v>0\.19<\/v>/.test(sheet1), 'percent cell stored as fraction 0.19');
ok(/<c r="B2"[^>]*t="inlineStr"/.test(sheet1), 'text cell is inline string');
ok(/<c r="C2" s="4"><v>\d+<\/v>/.test(sheet1), 'date cell is a numeric serial, not a string');
ok(sheet1.includes('&apos;=cmd|calc'), 'xlsx text cell formula-injection sanitized (leading = prefixed then xml-escaped)');
const styles = textOf(entries, 'xl/styles.xml');
ok(styles.includes('numFmtId="164"'), 'currency number format defined');
ok(styles.includes('0.00%'), 'percent number format defined');
ok(styles.includes('DD.MM.YYYY'), 'date number format defined');
const wbXml = textOf(entries, 'xl/workbook.xml');
ok(wbXml.includes('name="Rechnungen"') && wbXml.includes('name="Metadaten"'), 'both sheets named');
const metaSheet = textOf(entries, 'xl/worksheets/sheet2.xml');
ok(metaSheet.includes(">'=EVIL()<") || metaSheet.includes('>&apos;=EVIL()<'), 'metadata formula injection sanitized');

// date serial: build a tiny table with one date to check exact serial
const dwb = xlsx.buildWorkbook({ tables: [{ name: 'D', columns: [{ key: 'd', header: 'D', type: 'date', value: (r) => r.d }], rows: [{ d: '2026-07-22' }] }] });
const dSheet = textOf(parseZip(dwb), 'xl/worksheets/sheet1.xml');
// Excel serial for 2026-07-22 = 46225
ok(/<c r="A2" s="4"><v>46225<\/v>/.test(dSheet), 'date serial computed correctly (2026-07-22 => 46225)');

/* ---------------------------------------------------------------- PDF: structure + xref integrity */
const bigRows = [];
for (let i = 0; i < 80; i++) bigRows.push([`RE-2026-${String(i).padStart(4, '0')}`, 'Kunde ' + i, format.formatCentsCurrencyDe(i * 12345, 'EUR')]);
const pdfBytes = pdf.renderReportPdf({
  brand: 'Cogniiq',
  documentTitle: 'Rechnungen — Bericht',
  entityName: 'Cogniiq Testentität',
  metaLines: ['Zeitraum: 2026-01-01 bis 2026-12-31', 'Wertebasis: actual'],
  sections: [
    { kind: 'keyvalue', heading: 'Kennzahlen', rows: [['Umsatz netto', '12.345,00 €'], ['Offen', '2.000,00 €']] },
    { kind: 'note', text: 'Steuerschätzung — keine offizielle ELSTER-Übermittlung. Werte vor Abgabe prüfen.' },
    { kind: 'table', heading: 'Positionen', columns: [
      { header: 'Nummer', align: 'left', width: 3 }, { header: 'Kunde', align: 'left', width: 4 }, { header: 'Brutto', align: 'right', width: 3 },
    ], rows: bigRows },
  ],
  disclaimer: 'Cogniiq · Vorbereitung/Export — keine offizielle ELSTER-Übermittlung.',
});
ok(pdfBytes instanceof Uint8Array, 'pdf produced bytes');
const pdfStr = Buffer.from(pdfBytes).toString('latin1');
ok(pdfStr.startsWith('%PDF-1.4'), 'pdf header');
ok(pdfStr.trimEnd().endsWith('%%EOF'), 'pdf EOF');
ok(pdfStr.includes('/Type /Catalog'), 'pdf catalog');
ok(pdfStr.includes('/BaseFont /Helvetica'), 'pdf uses Helvetica base font (selectable text)');
ok(pdfStr.includes('/WinAnsiEncoding'), 'pdf WinAnsi encoding for € and umlauts');
ok(pdfStr.includes(' Tj'), 'pdf has text-show operators (real selectable text, not an image)');
ok(pdfStr.includes('Seite 1 von '), 'pdf has page numbers');
// Multi-page: 80 rows must overflow one A4 page.
const pageCount = (pdfStr.match(/\/Type \/Page[^s]/g) || []).length;
ok(pageCount >= 2, `pdf paginates long tables (pages=${pageCount})`);
ok(pdfStr.includes('Seite 1 von ' + pageCount), 'page total matches page count');

// xref integrity: startxref offset must point exactly at the 'xref' keyword.
const m = /startxref\s+(\d+)/.exec(pdfStr);
ok(!!m, 'startxref present');
if (m) {
  const off = Number(m[1]);
  eq(pdfStr.slice(off, off + 4), 'xref', 'startxref points exactly at xref table (byte offsets correct)');
}
// Every xref offset must point at "N 0 obj".
const xrefBlock = pdfStr.slice(pdfStr.lastIndexOf('\nxref\n') + 6);
const offLines = xrefBlock.split('\n').filter((l) => /^\d{10} \d{5} [nf] $/.test(l));
let objIdx = 0;
for (const l of offLines) {
  const off = Number(l.slice(0, 10));
  if (l.endsWith('n ')) {
    ok(new RegExp(`^${objIdx} 0 obj`).test(pdfStr.slice(off)), `xref entry ${objIdx} points at object header`);
  }
  objIdx += 1;
}

/* ---------------------------------------------------------------- result */
if (failures > 0) { console.error(`\nfinance export tests: ${failures} FAILED`); process.exit(1); }
console.log('finance export tests: ALL PASSED');
