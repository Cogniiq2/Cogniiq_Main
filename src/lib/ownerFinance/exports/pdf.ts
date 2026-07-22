// Deterministic, selectable-text PDF generation for finance reports and transactional documents.
// This is NOT a browser screenshot: it emits a real PDF 1.4 file with text objects using the
// standard Helvetica/Helvetica-Bold base-14 fonts (no embedding needed) and WinAnsi encoding so €
// and German umlauts render. It supports automatic pagination with repeatable table headers, a
// branded header block, page numbers ("Seite x von y") and a footer disclaimer. Loaded via dynamic
// import so it stays out of the initial bundle. Given fixed input it produces byte-identical output.

/* ----------------------------------------------------------------- Font metrics */

// Standard Helvetica advance widths (per 1000 units) for ASCII 32..126. Digits are all 556 so
// right-aligned currency columns align exactly. Extended chars default to 556 (close for umlauts).
const HELV_WIDTHS: Record<number, number> = {
  32: 278, 33: 278, 34: 355, 35: 556, 36: 556, 37: 889, 38: 667, 39: 191, 40: 333, 41: 333,
  42: 389, 43: 584, 44: 278, 45: 333, 46: 278, 47: 278, 48: 556, 49: 556, 50: 556, 51: 556,
  52: 556, 53: 556, 54: 556, 55: 556, 56: 556, 57: 556, 58: 278, 59: 278, 60: 584, 61: 584,
  62: 584, 63: 556, 64: 1015, 65: 667, 66: 667, 67: 722, 68: 722, 69: 667, 70: 611, 71: 778,
  72: 722, 73: 278, 74: 500, 75: 667, 76: 556, 77: 833, 78: 722, 79: 778, 80: 667, 81: 778,
  82: 722, 83: 667, 84: 611, 85: 722, 86: 667, 87: 944, 88: 667, 89: 667, 90: 611, 91: 278,
  92: 278, 93: 278, 94: 469, 95: 556, 96: 333, 97: 556, 98: 556, 99: 500, 100: 556, 101: 556,
  102: 278, 103: 556, 104: 556, 105: 222, 106: 222, 107: 500, 108: 222, 109: 833, 110: 556,
  111: 556, 112: 556, 113: 556, 114: 333, 115: 500, 116: 278, 117: 556, 118: 500, 119: 722,
  120: 500, 121: 500, 122: 500, 123: 334, 124: 260, 125: 334, 126: 584,
};

/** WinAnsi byte for a code point (covers Latin-1 plus €). Unknown → '?'. */
function winAnsiByte(cp: number): number {
  if (cp === 0x20ac) return 0x80; // €
  if (cp === 0x2013) return 0x96; // –
  if (cp === 0x2014) return 0x97; // —
  if (cp === 0x201e) return 0x84; // „
  if (cp === 0x201c) return 0x93; // “
  if (cp === 0x2026) return 0x85; // …
  if (cp <= 0xff) return cp;
  return 0x3f; // ?
}

function textWidth(str: string, size: number): number {
  let units = 0;
  for (const ch of str) {
    const b = winAnsiByte(ch.codePointAt(0) ?? 32);
    units += HELV_WIDTHS[b] ?? 556;
  }
  return (units / 1000) * size;
}

/** Escape a string into a PDF literal encoded as WinAnsi bytes. */
function pdfString(str: string): string {
  let out = '';
  for (const ch of str) {
    const b = winAnsiByte(ch.codePointAt(0) ?? 32);
    if (b === 0x28) out += '\\(';
    else if (b === 0x29) out += '\\)';
    else if (b === 0x5c) out += '\\\\';
    else if (b < 32 || b > 126) out += '\\' + b.toString(8).padStart(3, '0');
    else out += String.fromCharCode(b);
  }
  return out;
}

/** Truncate a string with an ellipsis so it fits within maxWidth at the given size. */
function ellipsize(str: string, size: number, maxWidth: number): string {
  if (textWidth(str, size) <= maxWidth) return str;
  let s = str;
  while (s.length > 1 && textWidth(s + '…', size) > maxWidth) s = s.slice(0, -1);
  return s + '…';
}

/* ----------------------------------------------------------------- Report model */

export interface PdfTableColumn {
  header: string;
  align: 'left' | 'right';
  /** Relative weight for width distribution. */
  width: number;
}

export type PdfSection =
  | { kind: 'keyvalue'; heading?: string; rows: Array<[string, string]> }
  | { kind: 'table'; heading?: string; columns: PdfTableColumn[]; rows: string[][] }
  | { kind: 'paragraph'; heading?: string; text: string }
  | { kind: 'note'; text: string };

export interface PdfReportModel {
  brand: string; // "Cogniiq"
  documentTitle: string; // "Rechnungen — Bericht"
  entityName: string;
  metaLines: string[]; // period, filters, value basis, generated timestamp
  sections: PdfSection[];
  disclaimer?: string;
}

/* ----------------------------------------------------------------- Layout engine */

const PAGE_W = 595.28; // A4
const PAGE_H = 841.89;
const MARGIN_X = 48;
const MARGIN_TOP = 56;
const MARGIN_BOTTOM = 64;
const CONTENT_W = PAGE_W - MARGIN_X * 2;

const GRAPHITE = '0.11 0.12 0.15';
const MUTED = '0.42 0.45 0.5';
const HAIRLINE = '0.85 0.86 0.88';
const HEADER_FILL = '0.96 0.965 0.97';

class PageBuilder {
  ops: string[] = [];
  y = PAGE_H - MARGIN_TOP;

  text(x: number, size: number, str: string, opts: { bold?: boolean; color?: string; align?: 'left' | 'right'; width?: number } = {}): void {
    const font = opts.bold ? '/F2' : '/F1';
    const color = opts.color ?? GRAPHITE;
    let drawX = x;
    if (opts.align === 'right' && opts.width != null) drawX = x + opts.width - textWidth(str, size);
    this.ops.push(`BT ${color} rg ${font} ${size} Tf 1 0 0 1 ${drawX.toFixed(2)} ${this.y.toFixed(2)} Tm (${pdfString(str)}) Tj ET`);
  }

  textAt(x: number, yTop: number, size: number, str: string, opts: { bold?: boolean; color?: string; align?: 'left' | 'right'; width?: number } = {}): void {
    const savedY = this.y;
    this.y = yTop;
    this.text(x, size, str, opts);
    this.y = savedY;
  }

  rect(x: number, yTop: number, w: number, h: number, fill: string): void {
    this.ops.push(`${fill} rg ${x.toFixed(2)} ${(yTop - h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
  }

  line(x1: number, yTop: number, x2: number, color = HAIRLINE): void {
    this.ops.push(`${color} RG 0.6 w ${x1.toFixed(2)} ${yTop.toFixed(2)} m ${x2.toFixed(2)} ${yTop.toFixed(2)} l S`);
  }
}

class Doc {
  pages: PageBuilder[] = [];
  current: PageBuilder;

  constructor(private model: PdfReportModel) {
    this.current = new PageBuilder();
    this.pages.push(this.current);
    this.renderHeader(true);
  }

  private renderHeader(first: boolean): void {
    const p = this.current;
    p.text(MARGIN_X, 9, this.model.brand.toUpperCase(), { bold: true, color: MUTED });
    p.y -= 16;
    if (first) {
      p.text(MARGIN_X, 18, this.model.documentTitle, { bold: true });
      p.y -= 20;
      p.text(MARGIN_X, 11, this.model.entityName, { color: MUTED });
      p.y -= 15;
      for (const line of this.model.metaLines) {
        p.text(MARGIN_X, 9, line, { color: MUTED });
        p.y -= 12;
      }
      p.y -= 6;
      p.line(MARGIN_X, p.y, PAGE_W - MARGIN_X);
      p.y -= 18;
    } else {
      p.text(MARGIN_X, 12, this.model.documentTitle, { bold: true });
      p.y -= 16;
      p.line(MARGIN_X, p.y, PAGE_W - MARGIN_X);
      p.y -= 16;
    }
  }

  private ensure(space: number): void {
    if (this.current.y - space < MARGIN_BOTTOM) this.newPage();
  }

  private newPage(): void {
    this.current = new PageBuilder();
    this.pages.push(this.current);
    this.renderHeader(false);
  }

  heading(text: string): void {
    this.ensure(30);
    this.current.y -= 6;
    this.current.text(MARGIN_X, 12, text, { bold: true });
    this.current.y -= 18;
  }

  keyValue(rows: Array<[string, string]>): void {
    for (const [k, v] of rows) {
      this.ensure(16);
      const p = this.current;
      p.text(MARGIN_X, 10, k, { color: MUTED });
      p.text(MARGIN_X + 200, 10, v, { align: 'right', width: CONTENT_W - 200, bold: true });
      p.y -= 15;
    }
  }

  paragraph(text: string): void {
    const words = text.split(/\s+/);
    let line = '';
    const flush = () => {
      if (!line) return;
      this.ensure(14);
      this.current.text(MARGIN_X, 10, line, { color: GRAPHITE });
      this.current.y -= 13;
      line = '';
    };
    for (const w of words) {
      const trial = line ? `${line} ${w}` : w;
      if (textWidth(trial, 10) > CONTENT_W) { flush(); line = w; } else line = trial;
    }
    flush();
    this.current.y -= 4;
  }

  note(text: string): void {
    this.ensure(30);
    const p = this.current;
    const boxTop = p.y + 4;
    const lines: string[] = [];
    const words = text.split(/\s+/);
    let line = '';
    for (const w of words) {
      const trial = line ? `${line} ${w}` : w;
      if (textWidth(trial, 9) > CONTENT_W - 24) { lines.push(line); line = w; } else line = trial;
    }
    if (line) lines.push(line);
    const boxH = lines.length * 12 + 16;
    this.ensure(boxH + 6);
    p.rect(MARGIN_X, p.y + 4, CONTENT_W, boxH, '0.98 0.97 0.9');
    p.y -= 6;
    for (const l of lines) { p.text(MARGIN_X + 12, 9, l, { color: '0.4 0.36 0.2' }); p.y -= 12; }
    p.y = Math.min(p.y, boxTop - boxH) - 8;
  }

  table(columns: PdfTableColumn[], rows: string[][]): void {
    const totalWeight = columns.reduce((s, c) => s + c.width, 0);
    const widths = columns.map((c) => (c.width / totalWeight) * CONTENT_W);
    const xs: number[] = [];
    let acc = MARGIN_X;
    for (const w of widths) { xs.push(acc); acc += w; }
    const pad = 5;
    const rowH = 16;
    const headerH = 18;

    const drawHeader = () => {
      const p = this.current;
      p.rect(MARGIN_X, p.y + 3, CONTENT_W, headerH, HEADER_FILL);
      columns.forEach((c, i) => {
        const w = widths[i];
        const label = ellipsize(c.header, 8.5, w - pad * 2);
        p.textAt(xs[i] + pad, p.y - 9, 8.5, label, { bold: true, color: MUTED, align: c.align, width: w - pad * 2 });
      });
      p.y -= headerH + 2;
    };

    this.ensure(headerH + rowH * 2);
    drawHeader();
    rows.forEach((row, rIdx) => {
      if (this.current.y - rowH < MARGIN_BOTTOM) { this.newPage(); drawHeader(); }
      const p = this.current;
      if (rIdx % 2 === 1) p.rect(MARGIN_X, p.y + 3, CONTENT_W, rowH, '0.985 0.985 0.99');
      columns.forEach((c, i) => {
        const w = widths[i];
        const cell = ellipsize(row[i] ?? '', 9, w - pad * 2);
        p.textAt(xs[i] + pad, p.y - 8, 9, cell, { align: c.align, width: w - pad * 2 });
      });
      p.line(MARGIN_X, p.y, PAGE_W - MARGIN_X, HAIRLINE);
      p.y -= rowH;
    });
    this.current.y -= 8;
  }

  /** Draw footers (page numbers + disclaimer) once total page count is known. */
  finalizeFooters(): void {
    const total = this.pages.length;
    this.pages.forEach((p, i) => {
      const yFoot = MARGIN_BOTTOM - 26;
      p.line(MARGIN_X, yFoot + 16, PAGE_W - MARGIN_X, HAIRLINE);
      p.textAt(MARGIN_X, yFoot, 8, this.model.disclaimer ?? '', { color: MUTED });
      p.textAt(MARGIN_X, yFoot, 8, `Seite ${i + 1} von ${total}`, { color: MUTED, align: 'right', width: CONTENT_W });
    });
  }
}

/* ----------------------------------------------------------------- Serialization */

function serialize(pages: PageBuilder[]): Uint8Array {
  const objects: string[] = [];
  const ref = (n: number) => `${n} 0 R`;
  // 1: catalog, 2: pages, 3: font F1, 4: font F2, then per page: content + page.
  const pageObjNums: number[] = [];
  const contentObjNums: number[] = [];
  let objNum = 5;
  for (let i = 0; i < pages.length; i++) {
    contentObjNums.push(objNum++);
    pageObjNums.push(objNum++);
  }

  objects[1] = `<< /Type /Catalog /Pages 2 0 R >>`;
  objects[2] = `<< /Type /Pages /Kids [${pageObjNums.map(ref).join(' ')}] /Count ${pages.length} >>`;
  objects[3] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`;
  objects[4] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`;

  pages.forEach((p, i) => {
    const stream = p.ops.join('\n');
    const bytes = new TextEncoder().encode(stream);
    objects[contentObjNums[i]] = `<< /Length ${bytes.length} >>\nstream\n${stream}\nendstream`;
    objects[pageObjNums[i]] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W.toFixed(2)} ${PAGE_H.toFixed(2)}] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${ref(contentObjNums[i])} >>`;
  });

  // Assemble with xref. All object bodies are ASCII (non-ASCII text was octal-escaped in pdfString),
  // and the only bytes above 0x7F are in the header's binary comment. We serialize the whole file as
  // latin1 (one output byte per JS char), so byte offsets equal JS string lengths — count them that way.
  const header = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  let body = '';
  const offsets: number[] = [];
  let cursor = header.length;
  const maxObj = objNum - 1;
  for (let n = 1; n <= maxObj; n++) {
    const obj = `${n} 0 obj\n${objects[n]}\nendobj\n`;
    offsets[n] = cursor;
    body += obj;
    cursor += obj.length;
  }
  const xrefStart = cursor;
  let xref = `xref\n0 ${maxObj + 1}\n0000000000 65535 f \n`;
  for (let n = 1; n <= maxObj; n++) xref += `${String(offsets[n]).padStart(10, '0')} 00000 n \n`;
  const trailer = `trailer\n<< /Size ${maxObj + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  const full = header + body + xref + trailer;
  // The header contains bytes above 0x7F; encode via latin1-safe path.
  const out = new Uint8Array(full.length);
  for (let i = 0; i < full.length; i++) out[i] = full.charCodeAt(i) & 0xff;
  return out;
}

/** Render a report model to PDF bytes. */
export function renderReportPdf(model: PdfReportModel): Uint8Array {
  const doc = new Doc(model);
  for (const section of model.sections) {
    if ('heading' in section && section.heading) doc.heading(section.heading);
    if (section.kind === 'keyvalue') doc.keyValue(section.rows);
    else if (section.kind === 'table') doc.table(section.columns, section.rows);
    else if (section.kind === 'paragraph') doc.paragraph(section.text);
    else if (section.kind === 'note') doc.note(section.text);
  }
  doc.finalizeFooters();
  return serialize(doc.pages);
}
