#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Real-browser verification of the customer offer portal (/d/:token) against the
// PRODUCTION build output.
//
//   node .github/scripts/test-public-document-portal.mjs [--verbose]
//
// Why this exists: a finalized offer was emailed successfully and the customer
// opened the secure link to a completely blank white page. Component tests could
// not have caught it — nothing in the portal was wrong. The route's lazy chunk
// 404'd after a deploy changed every asset hash, and `vite:preloadError`
// reloaded unconditionally, so the page reload-looped and never painted anything.
// Only the shipped artifact, in a real browser, reproduces that.
//
// Supabase is fulfilled at the network layer (CDP Fetch) with the exact shape the
// live `public_offer_by_token` returns, so the real chunks and the real schema are
// both exercised. No network egress, no database, no real token.
// ─────────────────────────────────────────────────────────────────────────────
import { existsSync, cpSync, rmSync, readdirSync, renameSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { startStaticServer } from './lib/static-server.mjs';
import { findChromium, launchChromium } from './lib/chromium.mjs';
import { PUBLIC_OFFER_PROJECTION, LEGACY_OFFER_PROJECTION } from './fixtures/public-offer-projection.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIST = join(ROOT, 'dist');
const STALE = join(ROOT, 'dist-portal-stale');
const VERBOSE = process.argv.includes('--verbose');
const TOKEN = 'e2e'.padEnd(48, 'x'); // never a real token

const failures = [];
const fail = (m) => { failures.push(m); console.log(`FAIL: ${m}`); };
const ok = (m) => console.log(`ok: ${m}`);

if (!existsSync(DIST)) {
  console.error('dist/ not found — run `npm run build` first.');
  process.exit(1);
}
const chromium = findChromium();
if (!chromium) { console.log('SKIP: no Chromium installed'); process.exit(0); }

/** A dist/ copy whose portal chunk filename no longer matches what the entry imports. */
function makeStaleDist() {
  rmSync(STALE, { recursive: true, force: true });
  cpSync(DIST, STALE, { recursive: true });
  const assets = join(STALE, 'assets');
  const portal = readdirSync(assets).find((f) => f.startsWith('PublicDocumentPortal') && f.endsWith('.js'));
  if (!portal) throw new Error('no PublicDocumentPortal chunk in dist/assets');
  renameSync(join(assets, portal), join(assets, 'PublicDocumentPortal-STALEHASH.js'));
  return portal;
}

/**
 * Load /d/<token> and report what the customer actually sees.
 * `rpc` decides how the Supabase RPC is answered: an object is returned as data,
 * a string is returned as a Postgres error message.
 */
async function visit({ dist, rpc, settleMs = 4000 }) {
  const server = await startStaticServer(dist);
  const browser = await launchChromium(chromium);
  const page = browser.page;
  const consoleErrors = [], pageErrors = [], chunkFailures = [];

  await page.send('Runtime.enable');
  await page.send('Network.enable');
  await page.send('Page.enable');
  await page.send('Fetch.enable', { patterns: [{ urlPattern: '*supabase.co*' }] });

  page.on('Runtime.consoleAPICalled', (p) => {
    if (p.type === 'error') consoleErrors.push((p.args || []).map((a) => a.value ?? a.description ?? '').join(' '));
  });
  page.on('Runtime.exceptionThrown', (p) => {
    pageErrors.push(p.exceptionDetails?.exception?.description || p.exceptionDetails?.text || 'unknown');
  });
  page.on('Network.responseReceived', (p) => {
    if (p.response?.status >= 400 && /\.(js|css)(\?|$)/.test(p.response.url)) chunkFailures.push(`${p.response.status} ${p.response.url}`);
  });
  page.on('Network.loadingFailed', (p) => { if (p.type === 'Script') chunkFailures.push(`script ${p.errorText}`); });

  page.on('Fetch.requestPaused', async ({ requestId, request }) => {
    // The CORS preflight must always succeed. Answering OPTIONS with the RPC's error status
    // fails the preflight instead, and every error case then surfaces as a generic network
    // failure rather than the specific screen under test.
    if (request.method === 'OPTIONS') {
      try {
        await page.send('Fetch.fulfillRequest', {
          requestId, responseCode: 204,
          responseHeaders: [
            { name: 'access-control-allow-origin', value: '*' },
            { name: 'access-control-allow-headers', value: '*' },
            { name: 'access-control-allow-methods', value: '*' },
          ],
          body: '',
        });
      } catch { /* target gone */ }
      return;
    }
    const isRpc = request.url.includes('/rest/v1/rpc/public_offer_by_token');
    const body = isRpc
      ? (typeof rpc === 'string'
        ? JSON.stringify({ code: 'P0001', message: rpc, details: null, hint: null })
        : JSON.stringify(rpc))
      : '{}';
    const status = isRpc && typeof rpc === 'string' ? 400 : 200;
    try {
      await page.send('Fetch.fulfillRequest', {
        requestId, responseCode: status,
        responseHeaders: [
          { name: 'content-type', value: 'application/json' },
          { name: 'access-control-allow-origin', value: '*' },
          { name: 'access-control-allow-headers', value: '*' },
          { name: 'access-control-allow-methods', value: '*' },
        ],
        body: Buffer.from(body).toString('base64'),
      });
    } catch { /* target gone (a reload raced us) — harmless */ }
  });

  await page.send('Page.navigate', { url: `${server.origin}/d/${TOKEN}` });
  await page.send('Runtime.evaluate', {
    expression: 'new Promise(r=>{if(document.readyState==="complete")r();else addEventListener("load",()=>r(),{once:true})})',
    awaitPromise: true,
  });
  await new Promise((r) => setTimeout(r, settleMs));

  const { result } = await page.send('Runtime.evaluate', {
    expression: `JSON.stringify({
      rootChildren: document.getElementById('root')?.children.length ?? -1,
      text: (document.body.innerText || '').trim(),
      bullets: [...document.querySelectorAll('li')].map(li => li.textContent.replace(/^\\s*[•·]\\s*/, '').trim()),
      title: document.title
    })`,
  });
  await browser.close();
  await server.close();
  return { ...JSON.parse(result.value), consoleErrors, pageErrors, chunkFailures };
}

// ── 1. The real customer flow: a valid token renders the offer ───────────────
{
  const r = await visit({ dist: DIST, rpc: PUBLIC_OFFER_PROJECTION });
  if (VERBOSE) console.log(r.text.slice(0, 400));

  r.rootChildren > 0 ? ok('valid token: the page is not blank') : fail('valid token: BLANK PAGE (root is empty)');
  r.text.includes('SV Heinersreuth – Admin') ? ok('offer title is visible') : fail(`offer title missing — saw: ${r.text.slice(0, 120)}`);
  r.text.includes('AN-2026-0009') ? ok('offer number is visible') : fail('offer number missing');
  r.title.includes('AN-2026-0009') ? ok('document title carries the offer number') : fail(`document title wrong: ${r.title}`);

  // Pricing: one-time and recurring are separate, and the term is never multiplied out.
  r.text.includes('2.960,10') || r.text.includes('2.490,00') ? ok('one-time amount is visible') : fail('one-time amount missing');
  r.text.includes('390,00') || r.text.includes('464,10') ? ok('recurring monthly amount is visible') : fail('recurring monthly amount missing');
  r.text.includes('Monat') ? ok('recurring interval is labelled') : fail('recurring interval label missing');

  // Controls the customer needs.
  /pdf|herunterladen/i.test(r.text) ? ok('PDF download control present') : fail('PDF download control missing');
  /annehmen|akzeptieren/i.test(r.text) ? ok('accept control present') : fail('accept control missing');
  /ablehnen/i.test(r.text) ? ok('decline control present') : fail('decline control missing');

  // The list-rendering regression (d9b393c) against the real projection shape.
  const EXPECTED = PUBLIC_OFFER_PROJECTION.exclusions.split('\n');
  const rendered = EXPECTED.filter((e) => r.bullets.includes(e));
  rendered.length === EXPECTED.length
    ? ok(`all ${EXPECTED.length} newline exclusions render as separate rows`)
    : fail(`only ${rendered.length}/${EXPECTED.length} exclusions rendered as rows`);
  r.text.includes('Das Angebot basiert auf der bestehenden technischen Plattform')
    ? ok('one-paragraph assumptions still render as prose')
    : fail('one-paragraph assumptions missing');
  r.bullets.some((b) => b.startsWith('•'))
    ? fail('a rendered row still carries a doubled bullet character')
    : ok('no doubled bullets');

  r.consoleErrors.length === 0 ? ok('no console errors') : fail(`console errors: ${r.consoleErrors.slice(0, 2).join(' | ')}`);
  r.pageErrors.length === 0 ? ok('no page errors') : fail(`page errors: ${r.pageErrors.slice(0, 2).join(' | ')}`);
  r.chunkFailures.length === 0 ? ok('no failed JS/CSS chunks') : fail(`failed chunks: ${r.chunkFailures.slice(0, 2).join(' | ')}`);
}

// ── 2. A legacy pre-recurring offer still renders ────────────────────────────
{
  const r = await visit({ dist: DIST, rpc: LEGACY_OFFER_PROJECTION });
  r.rootChildren > 0 ? ok('legacy offer: not blank') : fail('legacy offer: BLANK PAGE');
  r.text.includes('Historisches Angebot') ? ok('legacy offer renders its title') : fail('legacy offer title missing');
  r.text.includes('Nicht enthalten sind Hardware') ? ok('legacy prose exclusions stay prose') : fail('legacy prose exclusions missing');
  r.pageErrors.length === 0 ? ok('legacy offer: no page errors (missing recurring keys tolerated)') : fail(`legacy offer page errors: ${r.pageErrors[0]}`);
}

// ── 3. Bad token states get an explicit screen, never a blank page ───────────
for (const [label, message, expected] of [
  ['invalid', 'invalid token', 'Link nicht gültig'],
  ['expired', 'token expired', 'Link abgelaufen'],
  ['revoked', 'token revoked', 'Link widerrufen'],
]) {
  const r = await visit({ dist: DIST, rpc: message });
  r.rootChildren > 0 ? ok(`${label} token: not blank`) : fail(`${label} token: BLANK PAGE`);
  r.text.includes(expected) ? ok(`${label} token: explicit "${expected}" screen`) : fail(`${label} token: expected "${expected}", saw: ${r.text.slice(0, 100)}`);
}

// ── 4. THE REGRESSION: a stale chunk must recover, never blank ───────────────
{
  const original = makeStaleDist();
  try {
    const r = await visit({ dist: STALE, rpc: PUBLIC_OFFER_PROJECTION, settleMs: 6000 });
    r.rootChildren > 0
      ? ok('stale chunk: the page is NOT blank (the reported bug)')
      : fail('stale chunk: BLANK PAGE — the reported bug is back');
    r.text.includes('Neue Version verfügbar')
      ? ok('stale chunk: explicit recovery screen')
      : fail(`stale chunk: no recovery screen, saw: ${r.text.slice(0, 120)}`);
    r.text.includes('Erneut laden') ? ok('stale chunk: "Erneut laden" offered') : fail('stale chunk: no reload control');
    // The unguarded vite:preloadError reload used to loop forever; one attempt is the cap.
    const reloadLoop = r.consoleErrors.filter((e) => e.includes('dynamically imported module')).length;
    reloadLoop <= 4
      ? ok(`stale chunk: no reload loop (${reloadLoop} import failures)`)
      : fail(`stale chunk: reload loop — ${reloadLoop} import failures`);
    if (VERBOSE) console.log(`  (renamed ${original})`);
  } finally {
    rmSync(STALE, { recursive: true, force: true });
  }
}

console.log('');
if (failures.length) {
  console.log(`public document portal tests: ${failures.length} FAILED`);
  process.exit(1);
}
console.log('public document portal tests: ALL PASSED');
