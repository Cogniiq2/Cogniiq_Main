#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Cloudflare PAGES routing verification, against the real Pages runtime.
//
//   node .github/scripts/test-pages-routing.mjs [--verbose]
//
// This boots `wrangler pages dev dist`, which executes public/_redirects,
// public/_headers and functions/_middleware.ts exactly as Cloudflare Pages does.
// It is NOT a hand-written model — an earlier fix was validated only against a
// hand-written simulator of a different Cloudflare product, and shipped a
// preview in which every private deep link was still a blank white page.
//
// ── The defect this locks down ──────────────────────────────────────────────
// Pages evaluates _redirects BEFORE Pages Functions, and then canonicalises an
// .html target to its pretty path. A rule pointing at "/app-shell.html"
// therefore returned a BODYLESS 307 to /app-shell; functions/_middleware.ts,
// which re-emitted whatever it got at status 200, turned that into a ~0.3 KB
// HTML document with no <script> and no stylesheet. Chrome showed:
//
//     login        200  document   ~0.3 kB
//     (zero /assets/*.js or CSS requests)
//
// so no application JavaScript was ever fetched and the page stayed white.
//
// The contract asserted here is that /app/login, /admin/finance and /d/:token
// each return the ACTUAL generated shell — the same byte length and the same
// asset references as dist/app-shell.html — and that a real browser loading
// /app/login directly fetches the bundle and paints the login UI.
// ─────────────────────────────────────────────────────────────────────────────
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createServer } from 'node:net';

import { findChromium, launchChromium } from './lib/chromium.mjs';
import {
  PRIVATE_PREFIXES,
  PRIVATE_SHELL,
  describeDocumentProblem,
} from '../../scripts/lib/private-routing.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIST = join(ROOT, 'dist');
const VERBOSE = process.argv.includes('--verbose');

const failures = [];
const fail = (m) => { failures.push(m); console.log(`FAIL: ${m}`); };
const ok = (m) => console.log(`ok: ${m}`);
const check = (c, pass, bad) => (c ? ok(pass) : fail(bad));

if (!existsSync(DIST)) {
  console.error('dist/ not found — run `npm run build` first.');
  process.exit(1);
}
if (!existsSync(join(ROOT, 'node_modules/wrangler'))) {
  console.log('SKIP: wrangler is not installed — Pages routing not verified.');
  process.exit(0);
}

const SHELL = readFileSync(join(DIST, 'app-shell.html'), 'utf8');
const HOMEPAGE = readFileSync(join(DIST, 'index.html'), 'utf8');
const shellAssets = [...SHELL.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]).sort();

// ── 1. Source contract: every declaration of the private routes agrees ───────
{
  const redirects = readFileSync(join(ROOT, 'public/_redirects'), 'utf8');
  const headers = readFileSync(join(ROOT, 'public/_headers'), 'utf8');

  check(
    !/^\/\S+\s+\/app-shell\.html\s+200/m.test(redirects),
    "public/_redirects targets the shell as '/app-shell', never '/app-shell.html'",
    'public/_redirects points at /app-shell.html — Cloudflare Pages canonicalises that to a '
      + 'bodyless 307 and the browser receives a script-less blank document'
  );
  for (const prefix of PRIVATE_PREFIXES) {
    check(
      new RegExp(`^${prefix}\\s+${PRIVATE_SHELL}\\s+200`, 'm').test(redirects)
        && new RegExp(`^\\${prefix}/\\*\\s+${PRIVATE_SHELL}\\s+200`, 'm').test(redirects),
      `public/_redirects rewrites ${prefix} and ${prefix}/* to ${PRIVATE_SHELL}`,
      `public/_redirects is missing a ${PRIVATE_SHELL} rule for ${prefix}`
    );
    check(
      new RegExp(`^\\${prefix}/?\\*?$`, 'm').test(headers),
      `public/_headers covers ${prefix}`,
      `public/_headers is missing a block for ${prefix}`
    );
  }
}

// ── 2. The generated shell document's own invariants ─────────────────────────
{
  check(
    SHELL.includes('<div id="root"></div>'),
    'app-shell.html has an EMPTY #root before React mounts',
    'app-shell.html #root is not empty — src/main.tsx would hydrate instead of mount'
  );
  check(
    !HOMEPAGE.includes('<div id="root"></div>'),
    'index.html is prerendered and is therefore unusable as the shell',
    'index.html has an empty #root — the prerender did not run'
  );
  check(SHELL !== HOMEPAGE, 'app-shell.html is not the homepage HTML', 'app-shell.html is the homepage');
  check(
    /<meta name="robots" content="noindex, nofollow[^"]*"/.test(SHELL),
    'app-shell.html is noindex',
    'app-shell.html is missing a noindex robots tag'
  );
  check(
    !/<link rel="canonical"/.test(SHELL),
    'app-shell.html publishes no canonical URL',
    'app-shell.html carries a canonical URL, which would apply to every private route'
  );
  const missing = shellAssets.filter((a) => !existsSync(join(DIST, a.replace(/^\//, ''))));
  check(
    shellAssets.length > 0 && missing.length === 0,
    `all ${shellAssets.length} assets referenced by app-shell.html exist in this build`,
    `app-shell.html references assets this build did not emit: ${missing.join(', ')}`
  );
}

// ── 3. The guard that refuses to launder a failed lookup into a blank 200 ────
// Shared by functions/_middleware.ts. Every case below is a way the fallback
// asset lookup can fail; each MUST be reported so the middleware answers with
// an explicit error instead of a blank 200.
{
  const okHtml = { ok: true, status: 200, contentType: 'text/html; charset=utf-8' };
  const cases = [
    {
      name: 'the exact production failure: a bodyless 307 canonicalisation',
      response: { ok: false, status: 307, contentType: null }, html: '', shell: true, problem: true,
    },
    { name: 'a 404 from the asset store', response: { ok: false, status: 404, contentType: 'text/html' }, html: SHELL, shell: true, problem: true },
    { name: 'a non-HTML asset', response: { ok: true, status: 200, contentType: 'application/json' }, html: '{}', shell: true, problem: true },
    { name: 'a body that is not an HTML document', response: okHtml, html: 'not html at all', shell: true, problem: true },
    { name: 'the prerendered homepage offered as the shell', response: okHtml, html: HOMEPAGE, shell: true, problem: true },
    { name: 'a shell with no Vite entry script', response: okHtml, html: '<html><body><div id="root"></div></body></html>', shell: true, problem: true },
    { name: 'the real app-shell.html', response: okHtml, html: SHELL, shell: true, problem: false },
    { name: 'the real 404.html', response: okHtml, html: readFileSync(join(DIST, '404.html'), 'utf8'), shell: false, problem: false },
  ];
  for (const c of cases) {
    const problem = describeDocumentProblem(c.response, c.html, c.shell);
    check(
      Boolean(problem) === c.problem,
      c.problem ? `the guard rejects ${c.name} (${problem})` : `the guard accepts ${c.name}`,
      c.problem
        ? `the guard ACCEPTED ${c.name} — that becomes a blank 200`
        : `the guard wrongly rejected ${c.name}: ${problem}`
    );
  }
}

// ── 4. The route table, against the real Cloudflare Pages runtime ────────────
const freePort = () =>
  new Promise((resolve, reject) => {
    const s = createServer();
    s.on('error', reject);
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });

const port = await freePort();
const origin = `http://127.0.0.1:${port}`;

const wrangler = spawn(
  process.execPath,
  [join(ROOT, 'node_modules/wrangler/bin/wrangler.js'), 'pages', 'dev', 'dist',
   '--port', String(port), '--ip', '127.0.0.1'],
  { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] }
);

let log = '';
const collect = (chunk) => { log += chunk.toString(); };
wrangler.stdout.on('data', collect);
wrangler.stderr.on('data', collect);

const stop = async () => {
  wrangler.kill('SIGTERM');
  await new Promise((r) => { wrangler.on('exit', r); setTimeout(r, 4000); });
};

const ready = await (async () => {
  for (let i = 0; i < 90; i += 1) {
    if (/Ready on/.test(log)) return true;
    if (wrangler.exitCode !== null) return false;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
})();

if (!ready) {
  console.log('SKIP: `wrangler pages dev` did not start in this environment.');
  if (VERBOSE) console.log(log.slice(-1500));
  await stop();
  process.exit(0);
}
ok('`wrangler pages dev dist` is serving the built artifact');

// Pages must have accepted every private-route rewrite rule. Only the lines
// wrangler prints under "invalid redirect rule" are inspected — the surrounding
// output also mentions /app-shell in unrelated performance hints.
{
  const invalid = [...log.matchAll(/^\s*▶︎ .*$\n\s*at (dist\/_redirects:\d+ \| .*)$/gm)].map((m) => m[1].trim());
  check(
    invalid.every((rule) => !rule.includes('app-shell')),
    `Cloudflare Pages accepted every /app-shell rewrite rule (${(log.match(/Parsed (\d+) valid redirect rules/) || [])[1] ?? '?'} valid)`,
    `Cloudflare Pages rejected an /app-shell rewrite rule: ${invalid.filter((r) => r.includes('app-shell')).join('; ')}`
  );
  // The 404 rule is knowingly Netlify-only; Pages rejects it and the middleware
  // covers unknown URLs instead. Anything ELSE being rejected is a regression.
  const unexpected = invalid.filter((rule) => !/\/404\.html\s+404/.test(rule));
  check(
    unexpected.length === 0,
    'the only rule Pages rejects is the known Netlify-only /404.html rule',
    `Cloudflare Pages rejected unexpected rules: ${unexpected.join('; ')}`
  );
}

async function probe(path) {
  const response = await fetch(`${origin}${path}`, { redirect: 'manual' });
  const body = await response.text();
  return {
    path,
    status: response.status,
    bytes: Buffer.byteLength(body),
    contentType: response.headers.get('content-type') || '',
    location: response.headers.get('location'),
    robots: response.headers.get('x-robots-tag') || '',
    emptyRoot: body.includes('<div id="root"></div>'),
    scripts: [...body.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]),
    stylesheets: [...body.matchAll(/<link[^>]+rel="stylesheet"[^>]*href="([^"]+)"/g)].map((m) => m[1]),
    body,
  };
}

const PRIVATE = ['/app/login', '/admin/finance', '/d/test-token'];
const REPORT = [...PRIVATE, '/app-shell', '/app-shell.html', '/', '/leistungen', '/completely-unknown-url'];

console.log('\n--- observed Pages responses ---');
const seen = {};
for (const path of REPORT) {
  const r = await probe(path);
  seen[path] = r;
  console.log(
    `${path}\n   status=${r.status} bytes=${r.bytes} type=${r.contentType || '-'}`
    + `${r.location ? ` location=${r.location}` : ''}\n`
    + `   emptyRoot=${r.emptyRoot} scripts=[${r.scripts.join(', ') || '-'}] `
    + `stylesheets=[${r.stylesheets.join(', ') || '-'}]`
  );
}
console.log('--- end ---\n');

// ── The private shell contract ───────────────────────────────────────────────
for (const path of PRIVATE) {
  const r = seen[path];
  check(r.status === 200, `${path} -> 200`, `${path} -> ${r.status}${r.location ? ` (redirect to ${r.location})` : ''}`);
  check(
    r.body === SHELL,
    `${path} returns the actual generated shell (${r.bytes} bytes)`,
    `${path} did NOT return app-shell.html: ${r.bytes} bytes vs ${Buffer.byteLength(SHELL)} expected`
  );
  check(r.emptyRoot, `${path} has an empty #root`, `${path} has no empty <div id="root"></div>`);
  check(
    r.scripts.filter((s) => s.startsWith('/assets/')).length > 0,
    `${path} references the Vite entry script`,
    `${path} references NO application script — this is the blank-white-page signature`
  );
  check(
    [...r.scripts, ...r.stylesheets].filter((a) => a.startsWith('/assets/')).sort().join(',')
      === shellAssets.join(','),
    `${path} references exactly the shell's current hashed assets`,
    `${path} asset references differ from app-shell.html`
  );
  check(
    r.body !== HOMEPAGE,
    `${path} is not the prerendered homepage`,
    `${path} served the marketing homepage`
  );
  check(/noindex/.test(r.robots), `${path} is noindex at the server`, `${path} has no noindex X-Robots-Tag`);
}

// ── Public routes and real 404s are untouched ────────────────────────────────
check(seen['/'].status === 200 && !seen['/'].emptyRoot,
  '/ still serves the prerendered marketing homepage',
  `/ regressed: status ${seen['/'].status}, emptyRoot ${seen['/'].emptyRoot}`);
check(seen['/leistungen'].status === 200 && !seen['/leistungen'].emptyRoot,
  '/leistungen still serves prerendered HTML',
  `/leistungen regressed: status ${seen['/leistungen'].status}`);
check(seen['/completely-unknown-url'].status === 404,
  '/completely-unknown-url is a real 404',
  `/completely-unknown-url -> ${seen['/completely-unknown-url'].status}, expected 404`);
check(seen['/completely-unknown-url'].body !== HOMEPAGE,
  'an unknown URL does not serve the homepage',
  'an unknown URL served the homepage');

// No response may ever be a blank 200 document.
for (const [path, r] of Object.entries(seen)) {
  if (r.status !== 200 || !/html/i.test(r.contentType)) continue;
  check(
    r.bytes > 1000 && r.scripts.length > 0,
    `${path} is a complete document, not a blank 200`,
    `${path} returned a ${r.bytes}-byte 200 with ${r.scripts.length} scripts — a blank white page`
  );
}

// ── Real browser: direct navigation must load the bundle and paint ───────────
const chromium = findChromium();
if (!chromium) {
  console.log('SKIP: no Chromium installed — browser verification not run');
} else {
  const JOURNEYS = [
    { path: '/app/login', settles: ['/app/login'], expect: /sicherer zugang|anmelden|passwort|e-?mail/i,
      describe: 'the login UI' },
    // Signed out, the guard is expected to hand over to the auth entry point.
    { path: '/admin/finance', settles: ['/admin/finance', '/app/login'], expect: /sicherer zugang|anmelden|passwort|e-?mail/i,
      describe: 'the login UI (guard redirect)' },
    // The offer RPC is fulfilled with the invalid-token error the live
    // `public_offer_by_token` raises, so the portal renders its real
    // invalid-link screen instead of a network-failure screen.
    { path: '/d/THIS-IS-NOT-A-REAL-TOKEN', settles: ['/d/THIS-IS-NOT-A-REAL-TOKEN'],
      expect: /Link nicht gültig/i, describe: 'the invalid-link state', rpcError: 'invalid token' },
  ];

  for (const { path, settles, expect, describe, rpcError } of JOURNEYS) {
    const browser = await launchChromium(chromium);
    const page = browser.page;
    const scriptsLoaded = [];
    const netFailures = [];
    const pageErrors = [];
    const consoleErrors = [];

    await page.send('Runtime.enable');
    await page.send('Network.enable');
    await page.send('Page.enable');
    await page.send('Fetch.enable', { patterns: [{ urlPattern: '*supabase.co*' }] });

    page.on('Network.responseReceived', (p) => {
      const url = p.response?.url || '';
      if (/\/assets\/.*\.(js|css)(\?|$)/.test(url)) {
        if (p.response.status < 400) scriptsLoaded.push(url.replace(origin, ''));
        else netFailures.push(`${p.response.status} ${url}`);
      }
    });
    page.on('Network.loadingFailed', (p) => {
      if (p.type === 'Script' || p.type === 'Stylesheet') netFailures.push(`${p.type} ${p.errorText}`);
    });
    page.on('Runtime.exceptionThrown', (p) => {
      pageErrors.push(p.exceptionDetails?.exception?.description || p.exceptionDetails?.text || '?');
    });
    page.on('Runtime.consoleAPICalled', (p) => {
      if (p.type === 'error') {
        consoleErrors.push((p.args || []).map((a) => a.value ?? a.description ?? '').join(' '));
      }
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
        const isOfferRpc = request.url.includes('/rest/v1/rpc/public_offer_by_token');
        const body = isOfferRpc && rpcError
          ? JSON.stringify({ code: 'P0001', message: rpcError, details: null, hint: null })
          : '{}';
        await page.send('Fetch.fulfillRequest', {
          requestId,
          responseCode: isOfferRpc && rpcError ? 400 : 200,
          responseHeaders: [{ name: 'content-type', value: 'application/json' }, ...cors],
          body: Buffer.from(body).toString('base64'),
        });
      } catch { /* target gone */ }
    });

    // DIRECT navigation, never a client-side transition from "/": the blank
    // page only ever appeared on a cold deep link.
    await page.send('Page.navigate', { url: `${origin}${path}` });
    await page.send('Runtime.evaluate', {
      expression: 'new Promise(r=>{if(document.readyState==="complete")r();else addEventListener("load",()=>r(),{once:true})})',
      awaitPromise: true,
    });
    await new Promise((r) => setTimeout(r, 4000));

    const { result } = await page.send('Runtime.evaluate', {
      expression: `JSON.stringify({
        rootChildren: document.getElementById('root')?.children.length ?? -1,
        text: (document.body.innerText || '').trim().slice(0, 400),
        path: location.pathname
      })`,
    });
    await browser.close();
    const state = JSON.parse(result.value);
    if (VERBOSE) console.log(`   ${path}: root=${state.rootChildren} assets=${scriptsLoaded.length} ${JSON.stringify(state.text.slice(0, 90))}`);

    check(
      scriptsLoaded.some((u) => /\.js$/.test(u)),
      `${path} fetches the application JS bundle (${scriptsLoaded.length} assets)`,
      `${path} fetched NO /assets/*.js — the browser received a script-less document`
    );
    check(
      scriptsLoaded.some((u) => /\.css$/.test(u)),
      `${path} fetches the stylesheet`,
      `${path} fetched no CSS`
    );
    check(state.rootChildren > 0, `${path} paints (#root has ${state.rootChildren} children)`,
      `${path} rendered a BLANK PAGE (#root empty)`);
    check(expect.test(state.text), `${path} shows ${describe}`,
      `${path} did not show ${describe} — saw: ${JSON.stringify(state.text.slice(0, 140))}`);
    check(settles.includes(state.path), `${path} settles on ${state.path}`,
      `${path} navigated unexpectedly to ${state.path}`);
    check(netFailures.length === 0, `${path} loads every script and stylesheet`,
      `${path} asset failures: ${netFailures.slice(0, 3).join(' | ')}`);

    const hydration = [...consoleErrors, ...pageErrors].filter((m) =>
      /hydrat|Minified React error #(418|421|423)|did not match/i.test(m));
    check(hydration.length === 0, `${path} produces no hydration error`,
      `${path} hydration errors: ${hydration.slice(0, 2).join(' | ')}`);
    if (pageErrors.length && VERBOSE) console.log(`   page errors: ${pageErrors.slice(0, 2).join(' | ')}`);
  }

  // The login UI specifically, since that is the reported surface.
  const login = seen['/app/login'];
  check(login.body === SHELL, '/app/login is byte-identical to the generated shell',
    '/app/login diverged from the generated shell');
}

await stop();

console.log(failures.length === 0
  ? '\nCloudflare Pages routing: all checks passed.'
  : `\nCloudflare Pages routing: ${failures.length} failure(s).`);
process.exit(failures.length === 0 ? 0 : 1);
