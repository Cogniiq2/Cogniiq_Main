#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Real-browser verification of the PRODUCTION build output.
//
//   node .github/scripts/test-browser-hydration.mjs [--verbose]
//
// Serves dist/ with Netlify's routing semantics, loads representative routes in
// an already-installed headless Chromium over the DevTools Protocol, and fails
// on any React hydration error or on wrong post-hydration <head> metadata.
//
// Why this exists: the jsdom hydration test was a FALSE NEGATIVE. jsdom loads
// the app's modules synchronously from source, so every React.lazy boundary is
// already resolved before hydration and the real timing never occurs. In a
// browser the route chunk is a separate network request, so the Suspense
// boundary is genuinely pending at hydration time — which is where the real
// failures were. Only the shipped artifact in a real browser can prove this.
//
// No browser is downloaded and no automation dependency is added: the CDP
// client is built on Node's own WebSocket. If no Chrome/Chromium is installed
// the run SKIPS loudly rather than installing one.
// ─────────────────────────────────────────────────────────────────────────────
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { startStaticServer } from './lib/static-server.mjs';
import { findChromium, launchChromium } from './lib/chromium.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIST = join(ROOT, 'dist');
const VERBOSE = process.argv.includes('--verbose');

// Minified React errors carry only a code in production builds.
const REACT_ERRORS = {
  418: 'Hydration failed because the initial UI does not match what was rendered on the server',
  419: 'The server could not finish this Suspense boundary',
  421: 'This Suspense boundary received an update before it finished hydrating',
  422: 'There was an error while hydrating this Suspense boundary',
  423: 'There was an error while hydrating, the entire root switched to client rendering',
  425: 'Text content does not match server-rendered HTML',
};

const failures = [];
const fail = (msg) => failures.push(msg);
const ok = (msg) => console.log(`  ✓ ${msg}`);

/** Routes to exercise, with the metadata each must expose AFTER hydration. */
const ROUTES = [
  { path: '/', expect: { indexable: true, canonical: 'https://cogniiq.de/' } },
  { path: '/leistungen', expect: { indexable: true, canonical: 'https://cogniiq.de/leistungen' } },
  { path: '/bayreuth/lokales-seo', expect: { indexable: true, canonical: 'https://cogniiq.de/bayreuth/lokales-seo' } },
  {
    path: '/blog/lokales-seo-unternehmen',
    expect: { indexable: true, canonical: 'https://cogniiq.de/blog/lokales-seo-unternehmen' },
  },
  { path: '/gibt-es-nicht-xyz', expect: { indexable: false, canonical: null, status: 404, notFoundCopy: true } },
  { path: '/blog/kein-artikel', expect: { indexable: false, canonical: null, status: 404, notFoundCopy: true } },
  // 404 variants served at URLs the prerendered 404 document cannot predict.
  // A ".html" URL is one of these: it is not a canonical route, so returning the
  // 404 document is correct — but that document still has to HYDRATE cleanly
  // there, which is where React #421/#425 showed up on the live preview.
  { path: '/gibt-es-nicht.html', expect: { indexable: false, canonical: null, status: 404, notFoundCopy: true } },
  { path: '/leistungen/nicht-da', expect: { indexable: false, canonical: null, status: 404, notFoundCopy: true } },
  { path: '/blog/kein-artikel.html', expect: { indexable: false, canonical: null, status: 404, notFoundCopy: true } },
];

function describeConsole(entry) {
  const text = entry.text || '';
  const code = text.match(/(?:Minified React error #|react\.dev\/errors\/)(\d{3})/);
  if (code && REACT_ERRORS[code[1]]) return `React #${code[1]}: ${REACT_ERRORS[code[1]]}`;
  return text.length > 400 ? `${text.slice(0, 400)}…` : text;
}

/**
 * Console output originating from the page's own code, as opposed to browser
 * extensions or the browser itself. Extensions are disabled in the launch
 * flags, but a message is still attributed by URL so an extension-injected or
 * devtools-originated message can never fail the build.
 */
function isPageOriginated(entry, origin) {
  const urls = [entry.url, ...(entry.stack || [])].filter(Boolean);
  if (urls.some((u) => u.startsWith('chrome-extension://') || u.startsWith('devtools://'))) return false;
  if (!urls.length) return true; // no attribution: treat as ours, fail loudly rather than silently
  return urls.some((u) => u.startsWith(origin) || u.startsWith('blob:') || u === 'about:blank');
}

async function run() {
  if (!existsSync(join(DIST, 'index.html'))) {
    console.error('✗ dist/ not built. Run `npm run build` first.');
    process.exit(1);
  }

  const executable = findChromium();
  if (!executable) {
    console.log('⚠ No Chrome/Chromium found — skipping the real-browser hydration test.');
    console.log('  Set CHROMIUM_PATH to an installed browser to enable it.');
    console.log('  (No browser will be downloaded by this script.)');
    process.exit(0);
  }
  console.log(`  browser: ${executable}`);

  const server = await startStaticServer(DIST);
  const { page, close } = await launchChromium(executable);

  try {
    await page.send('Runtime.enable');
    await page.send('Log.enable');
    await page.send('Page.enable');
    await page.send('Network.enable');

    let collected = [];
    const record = (entry) => collected.push(entry);

    page.on('Runtime.consoleAPICalled', (params) => {
      if (!['error', 'warning', 'assert'].includes(params.type)) return;
      record({
        kind: params.type,
        text: (params.args || [])
          .map((a) => a.value ?? a.description ?? a.unserializableValue ?? '')
          .join(' ')
          .trim(),
        url: params.stackTrace?.callFrames?.[0]?.url,
        stack: params.stackTrace?.callFrames?.map((f) => f.url) || [],
      });
    });
    page.on('Runtime.exceptionThrown', (params) => {
      const d = params.exceptionDetails || {};
      record({
        kind: 'exception',
        text: d.exception?.description || d.text || 'uncaught exception',
        url: d.url || d.stackTrace?.callFrames?.[0]?.url,
        stack: d.stackTrace?.callFrames?.map((f) => f.url) || [],
      });
    });
    page.on('Log.entryAdded', (params) => {
      const e = params.entry || {};
      if (!['error', 'warning'].includes(e.level)) return;
      record({ kind: e.level, text: e.text || '', url: e.url, stack: [] });
    });

    for (const route of ROUTES) {
      collected = [];
      const url = `${server.origin}${route.path}`;

      let status = null;
      const onResponse = (params) => {
        if (params.type === 'Document' && params.response?.url === url) status = params.response.status;
      };
      page.on('Network.responseReceived', onResponse);

      await page.send('Page.navigate', { url });
      // Wait for load, then let hydration, effects and lazy chunks settle.
      await page.send('Runtime.evaluate', {
        expression:
          'new Promise(r => { if (document.readyState === "complete") r(); else addEventListener("load", () => r(), {once:true}); })',
        awaitPromise: true,
      });
      // Settle long enough for hydration AND the route's chunks, which the
      // asset-delay knob deliberately slows down when reproducing the real
      // network ordering.
      const settleMs = 1500 + Number(process.env.STATIC_SERVER_ASSET_DELAY_MS || 0) * 2;
      await new Promise((r) => setTimeout(r, settleMs));

      const { result } = await page.send('Runtime.evaluate', {
        expression: `JSON.stringify({
          href: location.href,
          pathname: location.pathname,
          title: document.title,
          robots: document.querySelector('meta[name="robots"]')?.content ?? null,
          canonical: document.querySelector('link[rel="canonical"]')?.href ?? null,
          hreflang: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map(l => l.href),
          ogUrl: document.querySelector('meta[property="og:url"]')?.content ?? null,
          twitterUrl: document.querySelector('meta[name="twitter:url"]')?.content ?? null,
          rootText: (() => {
            const root = document.getElementById('root');
            if (!root) return '';
            // JSON-LD <script> text is several KB and would push the visible copy
            // out of any reasonable slice, so scripts are excluded.
            const clone = root.cloneNode(true);
            clone.querySelectorAll('script,style').forEach((el) => el.remove());
            return (clone.textContent ?? '').slice(0, 20000);
          })(),
        })`,
        returnByValue: true,
      });
      const dom = JSON.parse(result.value);

      const pageErrors = collected.filter((e) => isPageOriginated(e, server.origin));
      const hydration = pageErrors.filter((e) =>
        /Minified React error #(418|419|421|422|423|425)|react\.dev\/errors\/(418|419|421|422|423|425)|hydrat|did not match|Text content does not match/i.test(
          e.text || ''
        )
      );

      if (VERBOSE) {
        console.log(`\n── ${route.path}`);
        console.log(`   status=${status} href=${dom.href}`);
        console.log(`   robots=${dom.robots} canonical=${dom.canonical}`);
        for (const e of collected) {
          console.log(`   [${e.kind}]${isPageOriginated(e, server.origin) ? '' : ' (external)'} ${describeConsole(e)}`);
        }
      }

      if (hydration.length) {
        fail(
          `${route.path}: ${hydration.length} React hydration error(s):\n      ` +
            [...new Set(hydration.map(describeConsole))].join('\n      ')
        );
      } else {
        ok(`${route.path}: hydrated with no React hydration errors`);
      }

      // Chromium logs "Failed to load resource: ... 404" for the navigation
      // itself whenever a document is served with a 404 status. On the routes
      // that are SUPPOSED to 404 that message is the expected outcome, not a
      // page error, so it is excluded rather than silencing errors generally.
      const otherErrors = pageErrors.filter(
        (e) =>
          !hydration.includes(e) &&
          e.kind !== 'warning' &&
          !(route.expect.status === 404 && /Failed to load resource[\s\S]*404/i.test(e.text || ''))
      );
      if (otherErrors.length) {
        fail(
          `${route.path}: ${otherErrors.length} page error(s):\n      ` +
            [...new Set(otherErrors.map(describeConsole))].join('\n      ')
        );
      }

      // ── post-hydration metadata ──
      if (route.expect.status && status !== route.expect.status) {
        fail(`${route.path}: HTTP ${status}, expected ${route.expect.status}`);
      }
      if (dom.pathname !== route.path) {
        fail(`${route.path}: browser URL became ${dom.pathname} — the requested URL must be preserved`);
      }
      if (route.expect.indexable) {
        if (!dom.robots || dom.robots.startsWith('noindex')) {
          fail(`${route.path}: robots is "${dom.robots}" after hydration, expected an indexable value`);
        }
        if (dom.canonical !== route.expect.canonical) {
          fail(`${route.path}: canonical is "${dom.canonical}" after hydration, expected "${route.expect.canonical}"`);
        }
      } else {
        if (!dom.robots || !dom.robots.startsWith('noindex')) {
          fail(`${route.path}: robots is "${dom.robots}" after hydration, expected noindex`);
        }
        if (dom.canonical) fail(`${route.path}: has canonical "${dom.canonical}" after hydration, expected none`);
        if (dom.hreflang.length) fail(`${route.path}: has hreflang alternates after hydration, expected none`);
        if (dom.ogUrl) fail(`${route.path}: has og:url "${dom.ogUrl}" after hydration, expected none`);
        if (dom.twitterUrl) fail(`${route.path}: has twitter:url after hydration, expected none`);
      }
      if (route.expect.notFoundCopy && !/Diese Seite existiert nicht/.test(dom.rootText)) {
        fail(`${route.path}: does not render the German 404 page after hydration`);
      }
      if (!route.expect.notFoundCopy && /Diese Seite existiert nicht/.test(dom.rootText)) {
        fail(`${route.path}: renders the 404 page but should render real content`);
      }

      // No fabricated counter values may survive into the hydrated DOM.
      const zeroMetric = dom.rootText.match(/<\s*0\s|[^\d]0\s*Tage/);
      if (zeroMetric) fail(`${route.path}: fabricated zero metric in the rendered DOM ("${zeroMetric[0].trim()}")`);
    }

    if (!failures.length) ok('post-hydration metadata correct on every route');
  } finally {
    await close();
    await server.close();
  }

  if (failures.length) {
    console.error('\n✗ Real-browser hydration verification FAILED:');
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log('\n✓ Real-browser hydration verification passed.');
}

run().catch((error) => {
  console.error(`\n✗ Browser test error: ${error.stack || error.message}`);
  process.exit(1);
});
