// Self-contained, dependency-free invoice PDF generator (PDF 1.4, base-14 Helvetica,
// WinAnsiEncoding). It renders ONLY from the trusted server context returned by
// owner_worker_invoice_context — the customer browser can never influence its content.
// No external imports, so it runs unchanged under Deno (the worker) and Node (the tests).

export interface InvoicePdfContext {
  invoice: { invoice_number: string | null; issue_date: string | null; due_date: string | null; currency: string;
    net_total_cents: number; vat_total_cents: number; gross_total_cents: number };
  lines: Array<{ description: string; quantity_milli: number; unit_price_cents: number; net_cents: number; vat_rate_bp: number }>;
  recipient: { company: string | null; contact_name: string | null; street: string | null; postal_code: string | null; city: string | null };
  seller: { legal_name: string; street: string | null; postal_code: string | null; city: string | null;
    email: string | null; phone: string | null; vat_id: string | null; tax_number: string | null;
    iban: string | null; bic: string | null; bank_name: string | null; bank_account_holder: string | null };
}

// --- WinAnsi single-byte mapping for the German subset we emit. Unmapped -> '?'. ---
const WINANSI: Record<string, number> = {
  'ä': 0xe4, 'ö': 0xf6, 'ü': 0xfc, 'Ä': 0xc4, 'Ö': 0xd6, 'Ü': 0xdc, 'ß': 0xdf,
  '€': 0x80, '§': 0xa7, '–': 0x96, '—': 0x97, '„': 0x84, '“': 0x93, '”': 0x94, '·': 0xb7,
};

function encodeWinAnsi(text: string): number[] {
  const out: number[] = [];
  for (const ch of text) {
    if (ch === '\\') { out.push(0x5c, 0x5c); continue; }
    if (ch === '(') { out.push(0x5c, 0x28); continue; }
    if (ch === ')') { out.push(0x5c, 0x29); continue; }
    const code = ch.codePointAt(0)!;
    if (code < 128) out.push(code);
    else if (WINANSI[ch] !== undefined) out.push(WINANSI[ch]);
    else out.push(0x3f); // '?'
  }
  return out;
}

function fmtCents(cents: number, currency: string): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  const euros = Math.floor(abs / 100).toLocaleString('de-DE');
  const frac = (abs % 100).toString().padStart(2, '0');
  const sym = currency === 'EUR' ? '€' : currency;
  return `${sign}${euros},${frac} ${sym}`;
}
function fmtDateDe(iso: string | null): string {
  if (!iso) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso;
}
function fmtBp(bp: number): string { return `${(bp / 100).toLocaleString('de-DE')} %`; }
function clip(s: string, n: number): string { return s.length > n ? s.slice(0, n - 1) + '…' : s; }

export function invoicePdfFilename(invoiceNumber: string | null): string {
  const safe = (invoiceNumber ?? 'ENTWURF').replace(/[^A-Za-z0-9-]/g, '');
  return `Rechnung-${safe}-Cogniiq.pdf`;
}

/** Render the invoice to PDF bytes. Deterministic; no external state. */
export function renderInvoicePdf(ctx: InvoicePdfContext): Uint8Array {
  const inv = ctx.invoice; const cur = inv.currency || 'EUR';
  // Content-stream text operators (WinAnsi). Origin bottom-left; A4 = 595x842pt.
  const ops: number[] = [];
  const enc = (s: string) => { for (const b of new TextEncoder().encode(s)) ops.push(b); };
  const text = (x: number, y: number, size: number, bold: boolean, s: string) => {
    enc(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${x} ${y} Td (`);
    for (const b of encodeWinAnsi(s)) ops.push(b);
    enc(`) Tj ET\n`);
  };

  let y = 800;
  text(60, y, 16, true, clip(ctx.seller.legal_name || 'Cogniiq', 60)); y -= 16;
  text(60, y, 9, false, clip([ctx.seller.street, [ctx.seller.postal_code, ctx.seller.city].filter(Boolean).join(' ')].filter(Boolean).join(' · '), 90)); y -= 12;
  if (ctx.seller.email) { text(60, y, 9, false, clip(ctx.seller.email, 90)); y -= 12; }

  y -= 14;
  text(60, y, 20, true, `Rechnung ${inv.invoice_number ?? ''}`.trim()); y -= 26;

  // Recipient
  text(60, y, 9, true, 'Rechnungsempfänger'); y -= 13;
  for (const l of [ctx.recipient.company, ctx.recipient.contact_name, ctx.recipient.street,
    [ctx.recipient.postal_code, ctx.recipient.city].filter(Boolean).join(' ')].filter(Boolean)) {
    text(60, y, 10, false, clip(String(l), 70)); y -= 13;
  }

  y -= 8;
  text(60, y, 9, false, `Rechnungsdatum: ${fmtDateDe(inv.issue_date)}`);
  text(300, y, 9, false, `Fällig bis: ${fmtDateDe(inv.due_date)}`); y -= 20;

  // Line table header
  text(60, y, 9, true, 'Beschreibung');
  text(320, y, 9, true, 'Menge'); text(390, y, 9, true, 'USt'); text(470, y, 9, true, 'Netto'); y -= 4;
  enc(`60 ${y} m 540 ${y} l S\n`); y -= 14;
  for (const l of ctx.lines.slice(0, 24)) {
    text(60, y, 9, false, clip(l.description || '—', 55));
    text(320, y, 9, false, (l.quantity_milli / 1000).toLocaleString('de-DE'));
    text(390, y, 9, false, fmtBp(l.vat_rate_bp));
    text(470, y, 9, false, fmtCents(l.net_cents, cur)); y -= 13;
  }

  y -= 8; enc(`330 ${y + 4} m 540 ${y + 4} l S\n`);
  text(330, y - 8, 9, false, 'Netto'); text(470, y - 8, 9, false, fmtCents(inv.net_total_cents, cur));
  text(330, y - 22, 9, false, 'Umsatzsteuer'); text(470, y - 22, 9, false, fmtCents(inv.vat_total_cents, cur));
  text(330, y - 38, 11, true, 'Gesamt'); text(470, y - 38, 11, true, fmtCents(inv.gross_total_cents, cur));

  // Footer: tax + bank identity
  let fy = 120;
  const foot: string[] = [];
  if (ctx.seller.vat_id) foot.push(`USt-IdNr. ${ctx.seller.vat_id}`);
  if (ctx.seller.tax_number) foot.push(`Steuernummer ${ctx.seller.tax_number}`);
  if (ctx.seller.iban) foot.push(`IBAN ${ctx.seller.iban}${ctx.seller.bic ? ` · BIC ${ctx.seller.bic}` : ''}`);
  if (ctx.seller.bank_name) foot.push(`Bank ${ctx.seller.bank_name}`);
  enc(`60 ${fy + 10} m 540 ${fy + 10} l S\n`);
  for (const f of foot) { text(60, fy, 8, false, clip(f, 95)); fy -= 11; }

  // Assemble the PDF with a correct byte-offset xref.
  const objects: string[] = [];
  const streamContent = new Uint8Array(ops);
  objects[1] = '<</Type/Catalog/Pages 2 0 R>>';
  objects[2] = '<</Type/Pages/Kids[3 0 R]/Count 1>>';
  objects[3] = '<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Resources<</Font<</F1 5 0 R/F2 6 0 R>>>>/Contents 4 0 R>>';
  objects[5] = '<</Type/Font/Subtype/Type1/BaseFont/Helvetica/Encoding/WinAnsiEncoding>>';
  objects[6] = '<</Type/Font/Subtype/Type1/BaseFont/Helvetica-Bold/Encoding/WinAnsiEncoding>>';

  const chunks: Uint8Array[] = [];
  const te = new TextEncoder();
  let offset = 0;
  const offsets: number[] = new Array(7).fill(0);
  const push = (u8: Uint8Array) => { chunks.push(u8); offset += u8.length; };
  const pushStr = (s: string) => push(te.encode(s));

  pushStr('%PDF-1.4\n');
  const writeObj = (n: number, dict: string) => { offsets[n] = offset; pushStr(`${n} 0 obj\n${dict}\nendobj\n`); };
  writeObj(1, objects[1]); writeObj(2, objects[2]); writeObj(3, objects[3]);
  // object 4 = content stream
  offsets[4] = offset;
  pushStr(`4 0 obj\n<</Length ${streamContent.length}>>\nstream\n`);
  push(streamContent);
  pushStr('\nendstream\nendobj\n');
  writeObj(5, objects[5]); writeObj(6, objects[6]);

  const xrefStart = offset;
  let xref = 'xref\n0 7\n0000000000 65535 f \n';
  for (let i = 1; i <= 6; i++) xref += `${offsets[i].toString().padStart(10, '0')} 00000 n \n`;
  pushStr(xref);
  pushStr(`trailer\n<</Size 7/Root 1 0 R>>\nstartxref\n${xrefStart}\n%%EOF`);

  const total = chunks.reduce((s, c) => s + c.length, 0);
  const out = new Uint8Array(total);
  let p = 0;
  for (const c of chunks) { out.set(c, p); p += c.length; }
  return out;
}
