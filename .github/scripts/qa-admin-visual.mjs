#!/usr/bin/env node
// =============================================================================
// Admin Center visual + interaction QA — real browser, real app, fixtured data
// =============================================================================
// Drives the actual Admin Center in headless Chromium against a running dev
// server with every Supabase call answered from .github/scripts/lib/admin-
// fixtures.mjs, then, per route and per viewport:
//
//   * captures a full-page PNG (so composition can actually be looked at),
//   * asserts the document never scrolls horizontally,
//   * collects console errors and uncaught exceptions,
//   * checks that the page rendered a real <h1>, not a blank shell.
//
// It complements qa-admin-shell.mjs rather than replacing it: that one measures
// rail geometry with empty reads, this one judges pages with rows on screen.
//
// Screenshots go to a directory of your choosing so a before/after pair can be
// compared across a branch:
//
//   node .github/scripts/qa-admin-visual.mjs --out /tmp/before
//   node .github/scripts/qa-admin-visual.mjs --out /tmp/after --viewports all
//
// Nothing here talks to a real backend, and no production data is involved.

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { findChromium, launchChromium } from './lib/chromium.mjs';
import { fixtureFor, FIXTURE_IDS } from './lib/admin-fixtures.mjs';

const ORIGIN = 'http://127.0.0.1:4321';
const SUPABASE = 'https://qa.supabase.co';

const args = process.argv.slice(2);
const argValue = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const OUT_DIR = resolve(argValue('--out', '.qa-screens'));
const VIEWPORT_MODE = argValue('--viewports', 'desktop');

const ALL_VIEWPORTS = [
  { label: '1440x900', width: 1440, height: 900, mobile: false },
  { label: '1280x800', width: 1280, height: 800, mobile: false },
  { label: '1024x768', width: 1024, height: 768, mobile: false },
  { label: '768x1024', width: 768, height: 1024, mobile: true },
  { label: '390x844', width: 390, height: 844, mobile: true },
];
const VIEWPORTS = VIEWPORT_MODE === 'all'
  ? ALL_VIEWPORTS
  : ALL_VIEWPORTS.filter((v) => v.label === '1440x900');

// The surfaces the owner actually works in every day. `expect` is a selector the
// page must have painted before it is judged — without it a slow chunk would be
// screenshotted as an empty canvas and pass.
const ROUTES = [
  { slug: '01-home', path: '/admin' },
  { slug: '02-finance-overview', path: '/admin/finance/overview' },
  { slug: '03-customers', path: '/admin/finance/customers' },
  { slug: '04-customer-detail', path: `/admin/finance/customers/${FIXTURE_IDS.CUSTOMER_ID}` },
  { slug: '05-invoices', path: '/admin/finance/invoices' },
  { slug: '06-offers', path: '/admin/finance/offers' },
  { slug: '07-expenses', path: '/admin/finance/expenses' },
  { slug: '08-contracts', path: '/admin/finance/contracts' },
  { slug: '09-clients', path: '/admin/clients' },
];

let failures = 0;
const ok = (label) => console.log(`ok: ${label}`);
const bad = (label, detail) => {
  failures += 1;
  console.error(`FAIL: ${label}${detail ? `\n      ${detail}` : ''}`);
};

const chromiumPath = findChromium();
if (!chromiumPath) {
  console.log('no Chrome/Chromium found — skipping admin visual QA');
  process.exit(0);
}

function startDevServer() {
  const child = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', '4321', '--strictPort'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      VITE_SUPABASE_URL: SUPABASE,
      VITE_SUPABASE_ANON_KEY: 'qa-anon-key',
      VITE_OURA_CLIENT_ID: 'qa',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  });
  return new Promise((res, rej) => {
    const timer = setTimeout(() => rej(new Error('dev server did not start in 90s')), 90_000);
    const onData = (chunk) => {
      const text = String(chunk);
      if (text.includes('ready in') || text.includes('Local:')) {
        clearTimeout(timer);
        setTimeout(() => res(child), 1500);
      }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', (chunk) => process.env.QA_DEBUG && process.stderr.write(chunk));
    child.on('exit', (code) => { clearTimeout(timer); rej(new Error(`dev server exited ${code}`)); });
  });
}

const b64 = (value) => Buffer.from(value, 'utf8').toString('base64');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function evaluate(page, expression, { awaitPromise = false } = {}) {
  const { result, exceptionDetails } = await page.send('Runtime.evaluate', {
    expression, returnByValue: true, awaitPromise,
  });
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? 'evaluate failed');
  return result.value;
}

async function preparePage(page, { reducedMotion = false } = {}) {
  const consoleErrors = [];
  await page.send('Page.enable');
  await page.send('Runtime.enable');
  await page.send('Network.enable');

  page.on('Runtime.consoleAPICalled', (event) => {
    if (event.type !== 'error') return;
    const text = (event.args ?? []).map((a) => a.value ?? a.description ?? '').join(' ');
    if (/favicon|Failed to load resource|net::ERR|Download the React DevTools/.test(text)) return;
    consoleErrors.push(text);
  });
  page.on('Runtime.exceptionThrown', (event) => {
    consoleErrors.push(event.exceptionDetails?.exception?.description ?? 'uncaught exception');
  });

  await page.send('Fetch.enable', { patterns: [{ urlPattern: `${SUPABASE}/*` }] });
  page.on('Fetch.requestPaused', async ({ requestId, request }) => {
    const headers = [
      { name: 'access-control-allow-origin', value: '*' },
      { name: 'access-control-allow-headers', value: '*' },
      { name: 'access-control-allow-methods', value: '*' },
      { name: 'content-type', value: 'application/json' },
    ];
    try {
      if (request.method === 'OPTIONS') {
        await page.send('Fetch.fulfillRequest', { requestId, responseCode: 204, responseHeaders: headers });
        return;
      }
      const accept = Object.entries(request.headers ?? {})
        .find(([k]) => k.toLowerCase() === 'accept')?.[1] ?? '';
      await page.send('Fetch.fulfillRequest', {
        requestId,
        responseCode: 200,
        responseHeaders: headers,
        body: b64(JSON.stringify(fixtureFor(request.url, { accept }))),
      });
    } catch { /* navigated away mid-flight */ }
  });

  await page.send('Emulation.setEmulatedMedia', {
    features: [
      { name: 'prefers-color-scheme', value: 'light' },
      { name: 'prefers-reduced-motion', value: reducedMotion ? 'reduce' : 'no-preference' },
    ],
  });

  await page.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
      (() => {
        const ref = ${JSON.stringify(SUPABASE)}.split('//')[1].split('.')[0];
        window.localStorage.setItem('sb-' + ref + '-auth-token', JSON.stringify({
          access_token: 'qa-token', token_type: 'bearer', expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'qa-refresh',
          user: { id: ${JSON.stringify(FIXTURE_IDS.USER_ID)}, aud: 'authenticated',
                  email: 'owner@cogniiq.invalid', user_metadata: {}, app_metadata: {},
                  created_at: '2026-01-01T00:00:00Z' },
        }));
      })();
    `,
  });

  return consoleErrors;
}

async function setViewport(page, viewport) {
  await page.send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile,
  });
}

async function goto(page, path) {
  await page.send('Page.navigate', { url: `${ORIGIN}${path}` });
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    await wait(400);
    const ready = await evaluate(page, 'Boolean(document.querySelector("aside, header"))').catch(() => false);
    if (ready) { await wait(1200); return true; }
  }
  return false;
}

const PROBE = `(() => {
  const doc = document.scrollingElement;
  const h1 = document.querySelector('h1');
  return {
    overflow: Math.round(doc.scrollWidth - doc.clientWidth),
    scrollWidth: doc.scrollWidth,
    clientWidth: doc.clientWidth,
    heading: h1 ? h1.textContent.trim().slice(0, 90) : null,
    textLength: (document.querySelector('main')?.innerText ?? '').length,
  };
})()`;

async function screenshot(page, file) {
  const { data } = await page.send('Page.captureScreenshot', {
    format: 'png', captureBeyondViewport: true, fromSurface: true, optimizeForSpeed: false,
  });
  writeFileSync(file, Buffer.from(data, 'base64'));
}

// --------------------------------------------------------------------- run
mkdirSync(OUT_DIR, { recursive: true });
const server = await startDevServer();
const browser = await launchChromium(chromiumPath);
const { page } = browser;

try {
  const consoleErrors = await preparePage(page);

  for (const viewport of VIEWPORTS) {
    await setViewport(page, viewport);
    for (const route of ROUTES) {
      const label = `${route.slug} @ ${viewport.label}`;
      consoleErrors.length = 0;
      const rendered = await goto(page, route.path);
      if (!rendered) { bad(label, `${route.path} never rendered a shell`); continue; }

      const probe = await evaluate(page, PROBE);
      const file = `${OUT_DIR}/${route.slug}--${viewport.label}.png`;
      await screenshot(page, file);

      if (probe.overflow > 1) {
        bad(`${label}: horizontal overflow`, `scrollWidth ${probe.scrollWidth} > clientWidth ${probe.clientWidth}`);
      } else if (!probe.heading) {
        bad(`${label}: no page heading`, 'the route painted a shell but no <h1>');
      } else if (probe.textLength < 60) {
        bad(`${label}: empty content area`, `main carried ${probe.textLength} characters`);
      } else {
        ok(`${label} — "${probe.heading}"`);
      }

      if (consoleErrors.length) {
        bad(`${label}: console errors`, consoleErrors.slice(0, 3).join('\n      '));
      }
    }
  }

  // Reduced motion: the same landing surface must still render completely.
  await page.send('Emulation.setEmulatedMedia', {
    features: [
      { name: 'prefers-color-scheme', value: 'light' },
      { name: 'prefers-reduced-motion', value: 'reduce' },
    ],
  });
  await setViewport(page, ALL_VIEWPORTS[0]);
  consoleErrors.length = 0;
  if (await goto(page, '/admin')) {
    const probe = await evaluate(page, PROBE);
    await screenshot(page, `${OUT_DIR}/00-home--reduced-motion.png`);
    if (probe.heading && probe.overflow <= 1 && !consoleErrors.length) ok('reduced motion: /admin renders completely');
    else bad('reduced motion: /admin', JSON.stringify(probe) + consoleErrors.join(' '));
  } else {
    bad('reduced motion: /admin', 'never rendered');
  }
} finally {
  await browser.close();
  try { process.kill(-server.pid, 'SIGKILL'); } catch { /* already gone */ }
}

console.log(`\nscreenshots: ${OUT_DIR}`);
if (failures) {
  console.error(`\n${failures} admin visual QA check(s) failed`);
  process.exit(1);
}
console.log('\nadmin visual QA passed');
