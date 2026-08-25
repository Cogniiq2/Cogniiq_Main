#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Deployment routing regression test.
//
//   node .github/scripts/test-deployment-routing.mjs [--verbose]
//
// Why this exists: every private deep link in production opened as a completely
// white page — /admin/finance, /app/login and every emailed /d/<token> offer
// link — while /  and the public pages were fine, and while CI was green.
//
// The cause was a routing contract that was only ever asserted under NETLIFY
// semantics. wrangler.jsonc declared `not_found_handling:
// "single-page-application"`, so Cloudflare answered every unmatched path with
// the contents of dist/index.html — the PRERENDERED MARKETING HOMEPAGE — and
// the ten "/app-shell.html 200" rewrite rules in public/_redirects, which
// Workers Assets does not apply, never ran. src/main.tsx then saw a populated
// #root, took its hydrateRoot() branch, and asked React to reconcile homepage
// markup against a tree rendered for a private route with only the homepage's
// chunks preloaded — so the private application never mounted, leaving either
// the marketing homepage (React #418) or, on slower chunk delivery, a tree
// React discarded outright (#421) and never painted.
//
// This test asserts the routing contract against the real dist/ artifact under
// CLOUDFLARE WORKERS ASSETS semantics (.github/scripts/lib/cloudflare-server.mjs),
// which is the host that actually serves the site:
//
//   /                        prerendered homepage
//   /leistungen              prerendered public page
//   /admin/finance           app-shell.html
//   /app/login               app-shell.html
//   /d/<token>               app-shell.html
//   /auth/callback           app-shell.html
//   /completely-unknown-url  a real 404
//
// plus the invariants of the private shell itself, and the agreement of every
// place the private route families are declared.
// ─────────────────────────────────────────────────────────────────────────────
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { startCloudflareServer } from './lib/cloudflare-server.mjs';
import { findChromium, launchChromium } from './lib/chromium.mjs';
import { PRIVATE_PREFIXES } from '../../worker/routing.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIST = join(ROOT, 'dist');
const VERBOSE = process.argv.includes('--verbose');

const failures = [];
const fail = (m) => { failures.push(m); console.log(`FAIL: ${m}`); };
const ok = (m) => console.log(`ok: ${m}`);
const check = (condition, pass, failMessage) => (condition ? ok(pass) : fail(failMessage));

if (!existsSync(DIST)) {
  console.error('dist/ not found — run `npm run build` first.');
  process.exit(1);
}

const read = (relative) => readFileSync(join(DIST, relative), 'utf8');
const HOMEPAGE = read('index.html');
const SHELL = read('app-shell.html');

// ── 1. The committed configuration cannot reintroduce the SPA fallback ───────
{
  const wrangler = readFileSync(join(ROOT, 'wrangler.jsonc'), 'utf8');
  // Strip // comments before parsing; the file documents the decision at length.
  const config = JSON.parse(wrangler.replace(/^\s*\/\/.*$/gm, ''));

  check(
    config.assets?.not_found_handling !== 'single-page-application',
    'wrangler.jsonc does not use the single-page-application fallback',
    'wrangler.jsonc still sets not_found_handling: "single-page-application" — '
      + 'that serves the prerendered homepage on every private deep link'
  );
  check(
    typeof config.main === 'string' && existsSync(join(ROOT, config.main)),
    `wrangler.jsonc declares an existing Worker entry point (${config.main})`,
    'wrangler.jsonc has no Worker entry point, so unmatched private routes cannot be '
      + 'served the shell'
  );
  check(
    config.assets?.binding === 'ASSETS',
    'the Worker has an ASSETS binding to read the shell from',
    'wrangler.jsonc does not bind the asset store as ASSETS'
  );
}

// ── 2. Every declaration of the private route families agrees ────────────────
{
  const sources = {
    'scripts/prerender.mjs': readFileSync(join(ROOT, 'scripts/prerender.mjs'), 'utf8'),
    'functions/_middleware.ts': readFileSync(join(ROOT, 'functions/_middleware.ts'), 'utf8'),
  };
  for (const [name, source] of Object.entries(sources)) {
    const declared = source.match(/PRIVATE_PREFIXES = \[([^\]]*)\]/);
    if (!declared) { fail(`${name} no longer declares PRIVATE_PREFIXES`); continue; }
    const list = declared[1].match(/'([^']+)'/g)?.map((s) => s.slice(1, -1)) ?? [];
    check(
      list.join(',') === PRIVATE_PREFIXES.join(','),
      `${name} declares the same private prefixes as worker/routing.mjs`,
      `${name} private prefixes drifted: ${list.join(',')} vs ${PRIVATE_PREFIXES.join(',')}`
    );
  }

  const redirects = readFileSync(join(ROOT, 'public/_redirects'), 'utf8');
  const headers = readFileSync(join(ROOT, 'public/_headers'), 'utf8');
  for (const prefix of PRIVATE_PREFIXES) {
    check(
      new RegExp(`^${prefix}\\s+/app-shell\\.html\\s+200`, 'm').test(redirects)
        && new RegExp(`^\\${prefix}/\\*\\s+/app-shell\\.html\\s+200`, 'm').test(redirects),
      `public/_redirects routes ${prefix} and ${prefix}/* to the shell (Netlify build)`,
      `public/_redirects is missing a shell rule for ${prefix}`
    );
    check(
      new RegExp(`^\\${prefix}/?\\*?$`, 'm').test(headers),
      `public/_headers covers ${prefix}`,
      `public/_headers is missing a block for ${prefix}`
    );
  }
}

// ── 3. The private shell document's own invariants ───────────────────────────
{
  check(
    /<div id="root"><\/div>/.test(SHELL),
    'app-shell.html has an EMPTY #root before React mounts',
    'app-shell.html #root is not empty — src/main.tsx would hydrate instead of mount'
  );
  check(
    !/<div id="root"><\/div>/.test(HOMEPAGE),
    'index.html is prerendered (populated #root) and is therefore unusable as the shell',
    'index.html has an empty #root — the prerender did not run'
  );
  check(
    SHELL !== HOMEPAGE,
    'app-shell.html is not the homepage HTML',
    'app-shell.html and index.html are byte-identical'
  );
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

  const referenced = [...SHELL.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]);
  check(referenced.length > 0, 'app-shell.html references hashed assets', 'app-shell.html references no assets');
  const missing = referenced.filter((asset) => !existsSync(join(DIST, asset.replace(/^\//, ''))));
  check(
    missing.length === 0,
    `all ${referenced.length} assets referenced by app-shell.html exist in this build`,
    `app-shell.html references assets that this build did not emit: ${missing.join(', ')}`
  );
  if (VERBOSE) console.log(`   shell assets: ${referenced.join(', ')}`);
}

// ── 4. The route table, over HTTP, under Workers Assets semantics ────────────
const server = await startCloudflareServer(DIST);

async function get(path) {
  const response = await fetch(`${server.origin}${path}`, { redirect: 'manual' });
  const body = await response.text();
  return { status: response.status, headers: response.headers, body };
}

const CASES = [
  { path: '/', expect: 'prerendered', label: 'prerendered homepage' },
  { path: '/leistungen', expect: 'prerendered', label: 'prerendered public page' },
  { path: '/admin/finance', expect: 'shell', label: 'app-shell.html' },
  { path: '/admin', expect: 'shell', label: 'app-shell.html' },
  { path: '/app/login', expect: 'shell', label: 'app-shell.html' },
  { path: '/owner/finanzen', expect: 'shell', label: 'app-shell.html' },
  { path: '/auth/callback', expect: 'shell', label: 'app-shell.html' },
  { path: '/d/test-token', expect: 'shell', label: 'app-shell.html' },
  { path: '/d/THIS-IS-NOT-A-REAL-TOKEN', expect: 'shell', label: 'app-shell.html' },
  { path: '/completely-unknown-url', expect: 'notfound', label: 'a real 404' },
];

for (const { path, expect, label } of CASES) {
  const response = await get(path);
  if (VERBOSE) console.log(`   ${path} -> ${response.status} ${response.body.length}b`);

  if (expect === 'shell') {
    check(response.status === 200, `${path} -> 200`, `${path} -> ${response.status}, expected 200`);
    check(response.body === SHELL, `${path} -> ${label}`, `${path} did NOT serve app-shell.html`);
    check(
      response.body !== HOMEPAGE,
      `${path} is not the prerendered homepage`,
      `${path} served the PRERENDERED HOMEPAGE — this is the white-screen bug`
    );
    check(
      /noindex/.test(response.headers.get('x-robots-tag') || ''),
      `${path} is noindex at the server`,
      `${path} has no noindex X-Robots-Tag`
    );
    check(
      /no-cache/.test(response.headers.get('cache-control') || ''),
      `${path} HTML revalidates`,
      `${path} Cache-Control does not revalidate: ${response.headers.get('cache-control')}`
    );
  } else if (expect === 'prerendered') {
    check(response.status === 200, `${path} -> 200`, `${path} -> ${response.status}, expected 200`);
    check(
      !/<div id="root"><\/div>/.test(response.body),
      `${path} -> ${label} (server-rendered content present)`,
      `${path} served an empty shell instead of prerendered HTML`
    );
    check(
      response.body !== SHELL,
      `${path} is not the private shell`,
      `${path} served app-shell.html — public SEO would be lost`
    );
    check(
      /<meta name="robots" content="index, follow/.test(response.body),
      `${path} stays indexable`,
      `${path} is no longer indexable`
    );
  } else {
    check(
      response.status === 404,
      `${path} -> ${label}`,
      `${path} -> ${response.status}; an unknown URL must never be a soft 404`
    );
    check(
      response.body !== HOMEPAGE,
      `${path} does not serve the homepage`,
      `${path} served the homepage — every typo'd URL becomes a duplicate homepage`
    );
  }
}

// A hashed chunk that no longer exists must stay a real, bodyless 404 so the
// vite:preloadError recovery in src/main.tsx sees a genuine failure.
{
  const response = await get('/assets/does-not-exist-STALEHASH.js');
  check(response.status === 404, 'a missing hashed chunk -> real 404', `missing chunk -> ${response.status}`);
  check(
    !/<html/i.test(response.body),
    'a missing hashed chunk is not answered with HTML',
    'a missing hashed chunk was answered with an HTML document'
  );
}

// ── 5. Real browser: direct navigation to a private deep link must paint ─────
const chromium = findChromium();
if (!chromium) {
  console.log('SKIP: no Chromium installed — browser verification not run');
} else {
  // `settles`: where an unauthenticated visitor may legitimately end up. The
  // guards (ProtectedRoute / PlatformAdminRoute) send a signed-out visitor to
  // the auth entry point, which is correct behaviour — the invariant under test
  // is that SOMETHING renders, never a blank document.
  const JOURNEYS = [
    { path: '/admin/finance', settles: ['/admin/finance', '/app/login'] },
    { path: '/d/THIS-IS-NOT-A-REAL-TOKEN', settles: ['/d/THIS-IS-NOT-A-REAL-TOKEN'] },
    { path: '/app/login', settles: ['/app/login'] },
  ];
  for (const { path, settles } of JOURNEYS) {
    const browser = await launchChromium(chromium);
    const page = browser.page;
    const consoleErrors = [];
    const pageErrors = [];
    const networkFailures = [];

    await page.send('Runtime.enable');
    await page.send('Network.enable');
    await page.send('Page.enable');
    page.on('Runtime.consoleAPICalled', (p) => {
      if (p.type === 'error') {
        consoleErrors.push((p.args || []).map((a) => a.value ?? a.description ?? '').join(' '));
      }
    });
    page.on('Runtime.exceptionThrown', (p) => {
      pageErrors.push(p.exceptionDetails?.exception?.description || p.exceptionDetails?.text || 'unknown');
    });
    page.on('Network.responseReceived', (p) => {
      if (p.response?.status >= 400 && /\.(js|css)(\?|$)/.test(p.response.url)) {
        networkFailures.push(`${p.response.status} ${p.response.url}`);
      }
    });

    // Direct navigation, never a client-side transition from "/": the bug only
    // ever appeared on a cold deep link.
    await page.send('Page.navigate', { url: `${server.origin}${path}` });
    await page.send('Runtime.evaluate', {
      expression:
        'new Promise(r=>{if(document.readyState==="complete")r();else addEventListener("load",()=>r(),{once:true})})',
      awaitPromise: true,
    });
    await new Promise((r) => setTimeout(r, 3000));

    const { result } = await page.send('Runtime.evaluate', {
      expression: `JSON.stringify({
        rootChildren: document.getElementById('root')?.children.length ?? -1,
        text: (document.body.innerText || '').trim().slice(0, 300),
        path: location.pathname
      })`,
    });
    await browser.close();
    const state = JSON.parse(result.value);
    if (VERBOSE) console.log(`   ${path}: root=${state.rootChildren} text=${JSON.stringify(state.text.slice(0, 90))}`);

    check(
      state.rootChildren > 0,
      `direct navigation to ${path} paints (root has ${state.rootChildren} children)`,
      `direct navigation to ${path} rendered a BLANK PAGE (#root is empty)`
    );
    check(
      settles.includes(state.path),
      `${path} settles on ${state.path}`,
      `${path} navigated somewhere unexpected: ${state.path}`
    );
    check(
      state.text.length > 0,
      `${path} renders visible text, not a blank document`,
      `${path} rendered an empty document body`
    );
    // A hydration mismatch is the exact failure mode this fix removes.
    const hydration = [...consoleErrors, ...pageErrors].filter((m) =>
      /hydrat|Minified React error #(418|421|423)|did not match/i.test(m)
    );
    check(
      hydration.length === 0,
      `${path} produces no hydration error`,
      `${path} produced hydration errors: ${hydration.slice(0, 2).join(' | ')}`
    );
    check(
      networkFailures.length === 0,
      `${path} loads every script and stylesheet`,
      `${path} network failures: ${networkFailures.slice(0, 3).join(' | ')}`
    );
    if (pageErrors.length && VERBOSE) console.log(`   page errors: ${pageErrors.slice(0, 3).join(' | ')}`);
  }
}

await server.close();

console.log(
  failures.length === 0
    ? '\nDeployment routing: all checks passed.'
    : `\nDeployment routing: ${failures.length} failure(s).`
);
process.exit(failures.length === 0 ? 1 - 1 : 1);
