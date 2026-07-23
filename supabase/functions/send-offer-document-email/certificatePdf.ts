// Self-contained, dependency-free SIGNED ACCEPTANCE CERTIFICATE generator (PDF 1.4,
// base-14 Helvetica, WinAnsiEncoding, A4, multi-page). It renders ONLY from the trusted
// server context returned by owner_worker_certificate_context — the customer browser can
// never influence its content. The drawn signature PNG is decoded (inflate → unfilter →
// flatten onto white) and embedded as a real DeviceRGB image XObject, so the certificate
// shows the customer's actual signature. No external imports, so it runs unchanged under
// Deno (the worker) and Node 18+ (the tests) — both expose Decompression/CompressionStream.
//
// The certificate PROVES: which offer + immutable version was accepted, by whom, when, for
// what amount, under which terms version, bound by which SHA-256 values, with the original
// PNG privately stored. It is explicitly labelled a SIMPLE electronic signature — never a
// qualified/advanced one. No raw database field names, storage paths or debug data appear.

export interface CertificateContext {
  offer: {
    offer_number: string | null; title: string | null; issue_date: string | null;
    currency: string; gross_total_cents: number; document_version: number | null;
    source_hash: string | null; terms_version: string | null;
  };
  signer: { name: string | null; company: string | null; email: string | null; role: string | null };
  recipient: { company: string | null; greeting_name?: string | null };
  signature: {
    level: string | null; sha256: string | null; accepted_at: string | null;
    user_agent?: string | null; ip_hash_present?: boolean | null;
  };
  seller: {
    legal_name: string; owner_name: string | null; street: string | null; postal_code: string | null;
    city: string | null; country_code: string; email: string | null; phone: string | null;
    website: string | null; vat_id: string | null; tax_number: string | null;
  };
  acceptance_event_id?: string | null;
}

// --- WinAnsi single-byte mapping for the German subset we emit. Unmapped -> '?'. ---
const WINANSI: Record<string, number> = {
  'ä': 0xe4, 'ö': 0xf6, 'ü': 0xfc, 'Ä': 0xc4, 'Ö': 0xd6, 'Ü': 0xdc, 'ß': 0xdf,
  '€': 0x80, '§': 0xa7, '–': 0x96, '—': 0x97, '„': 0x84, '“': 0x93, '”': 0x94, '·': 0xb7, '•': 0x95,
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
    else out.push(0x3f);
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
function fmtDateDe(iso: string | null | undefined): string {
  if (!iso) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso;
}
function fmtDateTimeDe(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return fmtDateDe(iso);
  const p = (n: number) => n.toString().padStart(2, '0');
  return `${p(d.getUTCDate())}.${p(d.getUTCMonth() + 1)}.${d.getUTCFullYear()} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} UTC`;
}
function clip(s: string, n: number): string { return s.length > n ? s.slice(0, n - 1) + '…' : s; }

/** Filesystem-safe certificate filename, e.g. Annahmebestaetigung-ANG-2026-0001-Cogniiq.pdf */
export function certificatePdfFilename(offerNumber: string | null): string {
  const safe = (offerNumber ?? 'ANGEBOT').replace(/[^A-Za-z0-9-]/g, '');
  return `Annahmebestaetigung-${safe}-Cogniiq.pdf`;
}

// ---------------------------------------------------------------------------
// PNG → flattened DeviceRGB decoder. Supports the 8-bit non-interlaced greyscale/
// RGB/grey+alpha/RGBA PNGs a browser canvas produces. Alpha is composited onto a
// white background so the embedded image is a clean black-on-white signature and no
// PDF SMask is needed. Returns null for anything it cannot safely decode (the caller
// then renders a graceful evidence note instead of a broken image).
// ---------------------------------------------------------------------------
interface DecodedImage { width: number; height: number; rgb: Uint8Array; }

async function inflate(data: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream('deflate'); // zlib-wrapped (PNG IDAT)
  const stream = new Response(new Blob([data.slice()]).stream().pipeThrough(ds));
  return new Uint8Array(await stream.arrayBuffer());
}
async function deflate(data: Uint8Array): Promise<Uint8Array> {
  const cs = new CompressionStream('deflate');
  const stream = new Response(new Blob([data.slice()]).stream().pipeThrough(cs));
  return new Uint8Array(await stream.arrayBuffer());
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

export async function decodePngToRgb(png: Uint8Array): Promise<DecodedImage | null> {
  try {
    const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    if (png.length < 8 || sig.some((b, i) => png[i] !== b)) return null;
    const dv = new DataView(png.buffer, png.byteOffset, png.byteLength);
    let off = 8;
    let width = 0, height = 0, bitDepth = 0, colorType = 0, interlace = 0;
    const idat: Uint8Array[] = [];
    let plte: Uint8Array | null = null; let trns: Uint8Array | null = null;
    while (off + 8 <= png.length) {
      const len = dv.getUint32(off); off += 4;
      const type = String.fromCharCode(png[off], png[off + 1], png[off + 2], png[off + 3]); off += 4;
      const body = png.subarray(off, off + len); off += len; off += 4; // skip CRC
      if (type === 'IHDR') {
        width = dv.getUint32(off - len - 4);
        height = dv.getUint32(off - len - 4 + 4);
        bitDepth = body[8]; colorType = body[9]; interlace = body[12];
      } else if (type === 'PLTE') { plte = body.slice(); }
      else if (type === 'tRNS') { trns = body.slice(); }
      else if (type === 'IDAT') { idat.push(body.slice()); }
      else if (type === 'IEND') break;
    }
    if (!width || !height || bitDepth !== 8 || interlace !== 0) return null;
    if (width * height > 8_000_000) return null; // sanity cap

    const channels = colorType === 0 ? 1 : colorType === 2 ? 3 : colorType === 3 ? 1 : colorType === 4 ? 2 : colorType === 6 ? 4 : 0;
    if (!channels) return null;
    if (colorType === 3 && !plte) return null;

    const merged = new Uint8Array(idat.reduce((s, c) => s + c.length, 0));
    { let p = 0; for (const c of idat) { merged.set(c, p); p += c.length; } }
    const raw = await inflate(merged);

    const bpp = channels;
    const stride = width * bpp;
    if (raw.length < (stride + 1) * height) return null;
    const recon = new Uint8Array(stride * height);
    let prevRow = new Uint8Array(stride);
    let rp = 0;
    for (let y = 0; y < height; y++) {
      const filter = raw[rp++];
      const row = new Uint8Array(stride);
      for (let x = 0; x < stride; x++) {
        const rawv = raw[rp++];
        const a = x >= bpp ? row[x - bpp] : 0;
        const b = prevRow[x];
        const c = x >= bpp ? prevRow[x - bpp] : 0;
        let v: number;
        switch (filter) {
          case 0: v = rawv; break;
          case 1: v = rawv + a; break;
          case 2: v = rawv + b; break;
          case 3: v = rawv + ((a + b) >> 1); break;
          case 4: v = rawv + paeth(a, b, c); break;
          default: return null;
        }
        row[x] = v & 0xff;
      }
      recon.set(row, y * stride);
      prevRow = row;
    }

    // Flatten onto white → DeviceRGB.
    const rgb = new Uint8Array(width * height * 3);
    const put = (i: number, r: number, g: number, bl: number) => { rgb[i] = r; rgb[i + 1] = g; rgb[i + 2] = bl; };
    for (let px = 0; px < width * height; px++) {
      const s = px * bpp; const d = px * 3;
      if (colorType === 6) {
        const a = recon[s + 3] / 255;
        put(d, Math.round(recon[s] * a + 255 * (1 - a)), Math.round(recon[s + 1] * a + 255 * (1 - a)), Math.round(recon[s + 2] * a + 255 * (1 - a)));
      } else if (colorType === 2) {
        put(d, recon[s], recon[s + 1], recon[s + 2]);
      } else if (colorType === 0) {
        put(d, recon[s], recon[s], recon[s]);
      } else if (colorType === 4) {
        const a = recon[s + 1] / 255; const g = Math.round(recon[s] * a + 255 * (1 - a));
        put(d, g, g, g);
      } else if (colorType === 3) {
        const idx = recon[s]; const pr = plte![idx * 3], pg = plte![idx * 3 + 1], pb = plte![idx * 3 + 2];
        const a = trns && idx < trns.length ? trns[idx] / 255 : 1;
        put(d, Math.round(pr * a + 255 * (1 - a)), Math.round(pg * a + 255 * (1 - a)), Math.round(pb * a + 255 * (1 - a)));
      }
    }
    return { width, height, rgb };
  } catch { return null; }
}

// ---------------------------------------------------------------------------
// PDF builder (multi-page, one embedded image XObject).
// ---------------------------------------------------------------------------
const PAGE_W = 595, PAGE_H = 842, MARGIN = 60, BOTTOM = 70;
const ACCENT = '0.06 0.09 0.16'; // slate-900-ish for rules/labels

export async function renderAcceptanceCertificatePdf(ctx: CertificateContext, signaturePng?: Uint8Array | null): Promise<Uint8Array> {
  const img = signaturePng ? await decodePngToRgb(signaturePng) : null;

  // Each page is an independent content-stream byte array. We flow text top→bottom and
  // start a new page whenever the cursor would cross the bottom margin.
  const pages: number[][] = [];
  let ops: number[] = [];
  let y = 0;
  const te = new TextEncoder();
  const enc = (s: string) => { for (const b of te.encode(s)) ops.push(b); };
  const newPage = () => { ops = []; pages.push(ops); y = PAGE_H - MARGIN; };
  newPage();

  const text = (x: number, size: number, bold: boolean, s: string, gray = '0.10 0.11 0.13') => {
    enc(`q ${gray} rg BT /${bold ? 'F2' : 'F1'} ${size} Tf ${x} ${y} Td (`);
    for (const b of encodeWinAnsi(s)) ops.push(b);
    enc(`) Tj ET Q\n`);
  };
  const rule = (x1: number, x2: number, g = '0.85 0.86 0.88') => { enc(`q ${g} RG 0.7 w ${x1} ${y} m ${x2} ${y} l S Q\n`); };
  const space = (n: number) => { y -= n; if (y < BOTTOM) newPage(); };
  const ensure = (n: number) => { if (y - n < BOTTOM) newPage(); };
  const label = (s: string) => { text(MARGIN, 8, true, s.toUpperCase(), '0.55 0.58 0.62'); space(13); };
  const row = (k: string, v: string, strong = false) => {
    ensure(14);
    text(MARGIN, 9.5, false, k, '0.42 0.45 0.50');
    text(MARGIN + 175, 9.5, strong, clip(v, 68), strong ? '0.06 0.09 0.16' : '0.12 0.14 0.17');
    space(15);
  };

  // ---- Header band ----
  text(MARGIN, 11, true, clip(ctx.seller.legal_name || 'Cogniiq', 60), ACCENT);
  space(14);
  const sellerLine = [ctx.seller.street, [ctx.seller.postal_code, ctx.seller.city].filter(Boolean).join(' '),
    ctx.seller.email, ctx.seller.website].filter(Boolean).join('  ·  ');
  if (sellerLine) { text(MARGIN, 8.5, false, clip(sellerLine, 100), '0.5 0.53 0.58'); space(10); }
  rule(MARGIN, PAGE_W - MARGIN); space(26);

  // ---- Title ----
  text(MARGIN, 22, true, 'Annahmebestätigung', ACCENT); space(24);
  text(MARGIN, 10.5, false, 'Verbindliche Online-Annahme eines Angebots mit erfasster Unterschrift.', '0.4 0.43 0.48');
  space(28);

  // ---- Offer ----
  label('Angebot');
  row('Angebotsnummer', ctx.offer.offer_number ?? '—', true);
  if (ctx.offer.title) row('Titel', ctx.offer.title);
  row('Ausstellungsdatum', fmtDateDe(ctx.offer.issue_date));
  row('Angenommen am', fmtDateTimeDe(ctx.signature.accepted_at));
  row('Angenommener Betrag (brutto)', fmtCents(ctx.offer.gross_total_cents, ctx.offer.currency), true);
  row('Dokumentversion', ctx.offer.document_version != null ? `v${ctx.offer.document_version}` : '—');
  row('Bedingungen', ctx.offer.terms_version ?? '—');
  space(12);

  // ---- Parties ----
  label('Anbieter');
  row('Unternehmen', ctx.seller.legal_name || '—', true);
  if (ctx.seller.owner_name) row('Inhaber/Vertretung', ctx.seller.owner_name);
  row('Anschrift', [ctx.seller.street, [ctx.seller.postal_code, ctx.seller.city].filter(Boolean).join(' '), ctx.seller.country_code].filter(Boolean).join(', '));
  if (ctx.seller.email) row('E-Mail', ctx.seller.email);
  if (ctx.seller.vat_id) row('USt-IdNr.', ctx.seller.vat_id);
  else if (ctx.seller.tax_number) row('Steuernummer', ctx.seller.tax_number);
  space(12);

  label('Kunde');
  row('Unternehmen', ctx.recipient.company ?? ctx.signer.company ?? '—', true);
  row('Unterzeichner/in', ctx.signer.name ?? '—', true);
  if (ctx.signer.role) row('Funktion', ctx.signer.role);
  if (ctx.signer.email) row('E-Mail', ctx.signer.email);
  space(16);

  // ---- Signature evidence ----
  ensure(150);
  rule(MARGIN, PAGE_W - MARGIN); space(20);
  label('Unterschrift & Nachweis');
  space(4);
  // The signature image sits in a bordered box.
  const boxW = 260, boxH = 96, boxX = MARGIN;
  ensure(boxH + 8);
  const boxBottom = y - boxH;
  enc(`q 0.85 0.86 0.88 RG 0.7 w ${boxX} ${boxBottom} ${boxW} ${boxH} re S Q\n`);
  if (img) {
    // Fit the image into the box while preserving aspect ratio.
    const scale = Math.min((boxW - 16) / img.width, (boxH - 16) / img.height, 1);
    const drawW = Math.max(1, img.width * scale), drawH = Math.max(1, img.height * scale);
    const ix = boxX + (boxW - drawW) / 2, iy = boxBottom + (boxH - drawH) / 2;
    // A single /Im0 image XObject is registered on every page's resources.
    enc(`q ${drawW.toFixed(2)} 0 0 ${drawH.toFixed(2)} ${ix.toFixed(2)} ${iy.toFixed(2)} cm /Im0 Do Q\n`);
  } else {
    text(boxX + 12, 9, false, 'Unterschrift privat gespeichert (siehe SHA-256).', '0.5 0.53 0.58');
  }
  // Evidence details to the right of the box.
  const rx = boxX + boxW + 24;
  const saveY = y;
  const evi = (k: string, v: string) => {
    text(rx, 8, true, k.toUpperCase(), '0.55 0.58 0.62');
    text(rx, 9.5, false, clip(v, 40), '0.12 0.14 0.17');
    y -= 26;
  };
  evi('Signaturklasse', 'Online-Annahme mit einfacher elektronischer Signatur');
  evi('Signatur-SHA-256', ctx.signature.sha256 ? ctx.signature.sha256.slice(0, 32) + '…' : '—');
  evi('Quell-Hash (Angebot)', ctx.offer.source_hash ? ctx.offer.source_hash.slice(0, 32) + '…' : '—');
  y = Math.min(saveY - boxH, y) - 8;
  if (y < BOTTOM) newPage();
  space(10);

  // Full hashes (readable, wrapped over two lines each if needed).
  const hashBlock = (title: string, hash: string | null) => {
    if (!hash) return;
    ensure(30);
    text(MARGIN, 8, true, title.toUpperCase(), '0.55 0.58 0.62'); space(12);
    text(MARGIN, 8.5, false, hash.slice(0, 64), '0.30 0.33 0.38'); space(18);
  };
  hashBlock('Signatur-SHA-256 (vollständig)', ctx.signature.sha256);
  hashBlock('Quell-Hash des angenommenen Angebots (vollständig)', ctx.offer.source_hash);

  // ---- Legal / evidence statement ----
  ensure(120);
  rule(MARGIN, PAGE_W - MARGIN); space(18);
  label('Rechtlicher Hinweis');
  const para = (s: string) => {
    // naive word wrap at ~95 chars for 9pt Helvetica across the content width
    const words = s.split(' '); let line = '';
    for (const w of words) {
      if ((line + ' ' + w).trim().length > 95) { ensure(14); text(MARGIN, 9, false, line.trim(), '0.30 0.33 0.38'); space(13); line = w; }
      else line = (line + ' ' + w).trim();
    }
    if (line) { ensure(14); text(MARGIN, 9, false, line.trim(), '0.30 0.33 0.38'); space(13); }
    space(4);
  };
  para('Der Kunde hat das oben bezeichnete Angebot in der angegebenen, unveränderlichen Dokumentversion online verbindlich angenommen und die Annahme mit einer selbst gezeichneten Unterschrift bestätigt.');
  para('Es handelt sich um eine einfache elektronische Signatur im Sinne der eIDAS-Verordnung. Es liegt keine fortgeschrittene und keine qualifizierte elektronische Signatur vor.');
  para('Die Original-Unterschriftsdatei (PNG) wird privat und zugriffsgeschützt gespeichert und ist über die oben angegebenen SHA-256-Prüfwerte eindeutig mit dieser Annahme und der angenommenen Angebotsversion verknüpft. Diese Bestätigung wurde serverseitig aus den maßgeblichen Daten erzeugt.');

  space(8);
  text(MARGIN, 8, false, `Beleg-ID ${ctx.acceptance_event_id ?? '—'}  ·  Erzeugt am ${fmtDateTimeDe(new Date().toISOString())}`, '0.55 0.58 0.62');

  // ---------------------------------------------------------------------------
  // Assemble the PDF: catalog, pages tree, N page objects (each sharing fonts + the
  // single image XObject), N content streams, fonts, and (optionally) the image.
  // ---------------------------------------------------------------------------
  const te2 = new TextEncoder();
  const chunks: Uint8Array[] = [];
  let offset = 0;
  const offsets: number[] = [];
  const push = (u8: Uint8Array) => { chunks.push(u8); offset += u8.length; };
  const pushStr = (s: string) => push(te2.encode(s));

  // Object numbering:
  //  1 Catalog, 2 Pages, 3 F1, 4 F2, [5 Image?], then page objs + content objs.
  const hasImg = !!img;
  const imgObjNum = hasImg ? 5 : 0;
  const firstPageObj = hasImg ? 6 : 5;
  const n = pages.length;
  const pageObjNums: number[] = [];
  const contentObjNums: number[] = [];
  for (let i = 0; i < n; i++) { pageObjNums.push(firstPageObj + i); contentObjNums.push(firstPageObj + n + i); }
  const totalObjs = firstPageObj + 2 * n - 1;

  const setOff = (num: number) => { offsets[num] = offset; };

  pushStr('%PDF-1.4\n');
  const writeObj = (num: number, dict: string) => { setOff(num); pushStr(`${num} 0 obj\n${dict}\nendobj\n`); };

  writeObj(1, '<</Type/Catalog/Pages 2 0 R>>');
  writeObj(2, `<</Type/Pages/Kids[${pageObjNums.map((p) => `${p} 0 R`).join(' ')}]/Count ${n}>>`);
  writeObj(3, '<</Type/Font/Subtype/Type1/BaseFont/Helvetica/Encoding/WinAnsiEncoding>>');
  writeObj(4, '<</Type/Font/Subtype/Type1/BaseFont/Helvetica-Bold/Encoding/WinAnsiEncoding>>');

  if (hasImg) {
    const zdata = await deflate(img!.rgb);
    setOff(imgObjNum);
    pushStr(`${imgObjNum} 0 obj\n<</Type/XObject/Subtype/Image/Width ${img!.width}/Height ${img!.height}/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/FlateDecode/Length ${zdata.length}>>\nstream\n`);
    push(zdata);
    pushStr('\nendstream\nendobj\n');
  }

  const resources = `<</Font<</F1 3 0 R/F2 4 0 R>>${hasImg ? `/XObject<</Im0 ${imgObjNum} 0 R>>` : ''}>>`;
  for (let i = 0; i < n; i++) {
    writeObj(pageObjNums[i], `<</Type/Page/Parent 2 0 R/MediaBox[0 0 ${PAGE_W} ${PAGE_H}]/Resources${resources}/Contents ${contentObjNums[i]} 0 R>>`);
  }
  for (let i = 0; i < n; i++) {
    const content = new Uint8Array(pages[i]);
    setOff(contentObjNums[i]);
    pushStr(`${contentObjNums[i]} 0 obj\n<</Length ${content.length}>>\nstream\n`);
    push(content);
    pushStr('\nendstream\nendobj\n');
  }

  const xrefStart = offset;
  let xref = `xref\n0 ${totalObjs + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= totalObjs; i++) xref += `${(offsets[i] ?? 0).toString().padStart(10, '0')} 00000 n \n`;
  pushStr(xref);
  pushStr(`trailer\n<</Size ${totalObjs + 1}/Root 1 0 R>>\nstartxref\n${xrefStart}\n%%EOF`);

  const total = chunks.reduce((s, c) => s + c.length, 0);
  const out = new Uint8Array(total);
  let p = 0;
  for (const c of chunks) { out.set(c, p); p += c.length; }
  return out;
}
