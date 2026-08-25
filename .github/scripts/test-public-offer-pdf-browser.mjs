#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// The customer's PDF download, in a REAL browser, from the built artifact.
//
//   node .github/scripts/test-public-offer-pdf-browser.mjs [--verbose]
//
// test-public-offer-pdf.mjs proves the renderer and adapter in Node. This proves the
// thing the customer actually does: open /d/<token> in a browser and press the download
// button. It exercises the real lazy chunks, the browser @react-pdf entry point
// (pdf().toBlob() — the Node renderToBuffer path would throw here) and the browser font
// registration, none of which the Node test can reach.
//
// The produced blob is captured by patching URL.createObjectURL, carried back as base64,
// and then inspected with poppler in Node — so the bytes under assertion are the exact
// bytes the customer's browser produced.
//
// Supabase is fulfilled at the network layer with the AN-2026-0009 projection. No egress,
// no database, no real token.
// ─────────────────────────────────────────────────────────────────────────────
import { existsSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';

import { startStaticServer } from './lib/static-server.mjs';
import { findChromium, launchChromium } from './lib/chromium.mjs';
import { hasPoppler, readLayout, findOverlaps, findOutOfBounds } from './lib/pdf-layout.mjs';
import { PDF_OFFER_PROJECTION, EXPECTED_EXCLUSIONS } from './fixtures/public-offer-pdf-fixture.mjs';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..', '..');
const DIST = join(ROOT, 'dist');
const VERBOSE = process.argv.includes('--verbose');
const TOKEN = 'pdf'.padEnd(48, 'x'); // never a real token

const failures = [];
const fail = (m) => { failures.push(m); console.log(`FAIL: ${m}`); };
const ok = (m) => console.log(`ok: ${m}`);
const check = (c, pass, bad) => (c ? ok(pass) : fail(bad));

if (!existsSync(DIST)) { console.error('dist/ not found — run `npm run build` first.'); process.exit(1); }
const chromium = findChromium();
if (!chromium) { console.log('SKIP: no Chromium installed'); process.exit(0); }

const server = await startStaticServer(DIST);
const browser = await launchChromium(chromium);
const page = browser.page;
const pageErrors = [];

await page.send('Runtime.enable');
await page.send('Network.enable');
await page.send('Page.enable');
await page.send('Fetch.enable', { patterns: [{ urlPattern: '*supabase.co*' }] });
page.on('Runtime.exceptionThrown', (p) => {
  pageErrors.push(p.exceptionDetails?.exception?.description || p.exceptionDetails?.text || '?');
});
page.on('Fetch.requestPaused', async ({ requestId, request }) => {
  const cors = [
    { name: 'access-control-allow-origin', value: '*' },
    { name: 'access-control-allow-headers', value: '*' },
    { name: 'access-control-allow-methods', value: '*' },
  ];
  try {
    if (request.method === 'OPTIONS') {
      await page.send('Fetch.fulfillRequest', { requestId, responseCode: 204, responseHeaders: cors, body: '' });
      return;
    }
    const isOffer = request.url.includes('/rest/v1/rpc/public_offer_by_token');
    await page.send('Fetch.fulfillRequest', {
      requestId, responseCode: 200,
      responseHeaders: [{ name: 'content-type', value: 'application/json' }, ...cors],
      body: Buffer.from(isOffer ? JSON.stringify(PDF_OFFER_PROJECTION) : '{}').toString('base64'),
    });
  } catch { /* target gone */ }
});

await page.send('Page.navigate', { url: `${server.origin}/d/${TOKEN}` });
await page.send('Runtime.evaluate', {
  expression: 'new Promise(r=>{if(document.readyState==="complete")r();else addEventListener("load",()=>r(),{once:true})})',
  awaitPromise: true,
});
await new Promise((r) => setTimeout(r, 4000));

// Capture whatever the download hands to the browser, and neutralise the navigation the
// anchor would otherwise perform.
await page.send('Runtime.evaluate', {
  expression: `(() => {
    window.__pdf = null;
    const realCreate = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (blob) => {
      window.__pdfPromise = blob.arrayBuffer().then((b) => {
        let s = ''; const v = new Uint8Array(b);
        for (let i = 0; i < v.length; i += 1) s += String.fromCharCode(v[i]);
        window.__pdf = btoa(s);
        return window.__pdf;
      });
      return realCreate(blob);
    };
    HTMLAnchorElement.prototype.click = function () { /* do not navigate in the harness */ };
  })()`,
});

// Press the customer's download control.
const { result: clicked } = await page.send('Runtime.evaluate', {
  expression: `(() => {
    const el = [...document.querySelectorAll('button, a')]
      .find((n) => /pdf|herunterladen|download/i.test(n.textContent || ''));
    if (!el) return 'NO_BUTTON';
    el.click();
    return el.textContent.trim().slice(0, 60);
  })()`,
});
check(clicked.value !== 'NO_BUTTON', `found the customer download control ("${clicked.value}")`,
  'no download control found in the portal');

const { result: b64 } = await page.send('Runtime.evaluate', {
  expression: 'window.__pdfPromise ? window.__pdfPromise : new Promise(r=>setTimeout(()=>r(window.__pdf),12000))',
  awaitPromise: true,
});

await browser.close();
await server.close();

check(pageErrors.length === 0, 'the download raises no page error',
  `page errors during download: ${pageErrors.slice(0, 2).join(' | ')}`);

if (!b64.value) {
  fail('the browser produced no PDF blob');
} else {
  const bytes = Buffer.from(b64.value, 'base64');
  check(bytes.slice(0, 5).toString('latin1') === '%PDF-',
    `the browser produced a real PDF (${bytes.length} bytes)`, 'the download is not a PDF');
  // The generic renderer produced ~10 KB for this offer; the premium engine embeds fonts
  // and paginates, so it is several times larger. A collapse back under that size means the
  // browser silently fell back to the old path.
  check(bytes.length > 20000, 'the download is the premium document, not the ~10 KB generic one',
    `the download is only ${bytes.length} bytes — it looks like the generic renderer`);

  if (hasPoppler()) {
    const out = mkdtempSync(join(tmpdir(), 'offer-pdf-browser-'));
    const path = join(out, 'browser.pdf');
    writeFileSync(path, bytes);
    const text = execFileSync('pdftotext', [path, '-'], { encoding: 'utf8' });
    const flat = text.replace(/\s+/g, ' ');
    const pages = readLayout(path);

    check(pages.length >= 2, `the browser PDF paginates (${pages.length} pages)`,
      `the browser PDF is ${pages.length} page(s)`);
    check(!text.includes('?'), 'no "?" glyph in the browser-produced PDF', 'a "?" glyph is present');
    check(/€/.test(text), 'the euro glyph renders in the browser build', 'no euro glyph');
    check(flat.includes('AN-2026-0009'), 'the browser PDF carries the offer number', 'offer number missing');
    check(flat.includes('Investitionsübersicht'), 'the browser PDF has the premium investment overview',
      'the premium sections are missing — the generic renderer may still be in use');
    check(/390,00 € \/ Monat/.test(flat), 'recurring pricing survives the browser render',
      'the recurring interval was lost');
    check(/Einmalige Investition \(brutto\) 2\.963,10 €/.test(flat),
      'the one-time headline is unchanged in the browser render', 'the one-time headline changed');
    const missing = EXPECTED_EXCLUSIONS.filter((e) => !flat.includes(e.replace(/\s+/g, ' ')));
    check(missing.length === 0, `all ${EXPECTED_EXCLUSIONS.length} exclusions survive the browser render`,
      `${missing.length} exclusion(s) missing from the browser PDF`);
    const overlaps = pages.flatMap((p) => findOverlaps(p));
    const oob = pages.flatMap((p) => findOutOfBounds(p));
    check(overlaps.length === 0, 'no overlapping text in the browser-produced PDF',
      `overlaps: ${overlaps.slice(0, 2).map((o) => `p${o.page}`).join(', ')}`);
    check(oob.length === 0, 'no text outside the page in the browser-produced PDF',
      `out of bounds: ${oob.slice(0, 2).map((o) => o.text).join(', ')}`);
    if (VERBOSE) console.log(`   browser PDF: ${pages.length} pages, ${bytes.length} bytes`);
    rmSync(out, { recursive: true, force: true });
  } else {
    console.log('SKIP: poppler unavailable — browser PDF content not inspected.');
  }
}

console.log(failures.length === 0 ? '\nPublic offer PDF (browser): all checks passed.'
  : `\nPublic offer PDF (browser): ${failures.length} failure(s).`);
process.exit(failures.length === 0 ? 0 : 1);
