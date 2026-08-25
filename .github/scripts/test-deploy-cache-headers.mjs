#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Deployment cache safety for the built artifact.
//
//   node .github/scripts/test-deploy-cache-headers.mjs
//
// The HTML shell is a pointer to content-hashed chunks. A deploy renames every
// chunk, so HTML that is allowed to go stale will keep asking for filenames that
// no longer exist — which is how a freshly emailed /d/<token> offer link opened
// to a blank page. HTML must therefore always revalidate, and hashed assets must
// NOT (they are immutable by construction; no-cache there would re-download the
// whole bundle on every navigation and fix nothing).
//
// This asserts the real shipped dist/_headers, applied to real requests by the
// shared static server — which matches header blocks against the REQUEST path,
// the same way Cloudflare and Netlify do. That is the point being proven: the
// rule has to apply to /d/<token>, not merely to /app-shell.html fetched
// directly, because the customer never requests the shell by name.
// ─────────────────────────────────────────────────────────────────────────────
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { startStaticServer } from './lib/static-server.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIST = join(ROOT, 'dist');

const failures = [];
const fail = (m) => { failures.push(m); console.log(`FAIL: ${m}`); };
const ok = (m) => console.log(`ok: ${m}`);

if (!existsSync(join(DIST, '_headers'))) {
  console.error('dist/_headers not found — run `npm run build` first.');
  process.exit(1);
}

const REVALIDATES = /no-cache/i;

const server = await startStaticServer(DIST);
try {
  const head = async (path) => {
    const res = await fetch(`${server.origin}${path}`);
    await res.arrayBuffer();
    return { status: res.status, cache: res.headers.get('cache-control'), type: res.headers.get('content-type') };
  };

  // ── The customer document route: the response the customer actually gets ──
  const token = 'z'.repeat(48);
  const doc = await head(`/d/${token}`);
  doc.type?.includes('text/html')
    ? ok('/d/<token> is served an HTML shell')
    : fail(`/d/<token> content-type was ${doc.type}`);
  doc.cache && REVALIDATES.test(doc.cache)
    ? ok(`/d/<token> revalidates: Cache-Control: ${doc.cache}`)
    : fail(`/d/<token> may be cached stale — Cache-Control: ${doc.cache ?? '(none)'}`);

  // A second, differently-shaped token must behave identically (it is a wildcard).
  const doc2 = await head('/d/abc-DEF_123.456');
  doc2.cache && REVALIDATES.test(doc2.cache)
    ? ok('/d/* applies to any token shape')
    : fail(`/d/<other-token> not covered — Cache-Control: ${doc2.cache ?? '(none)'}`);

  // ── The shell documents themselves ────────────────────────────────────────
  for (const shell of ['/app-shell.html', '/index.html']) {
    const r = await head(shell);
    r.cache && REVALIDATES.test(r.cache)
      ? ok(`${shell} revalidates`)
      : fail(`${shell} may be cached stale — Cache-Control: ${r.cache ?? '(none)'}`);
  }

  // ── The other SPA surfaces served from the same shell ─────────────────────
  for (const route of ['/app', '/app/dashboard', '/admin', '/auth/confirmed']) {
    const r = await head(route);
    r.cache && REVALIDATES.test(r.cache)
      ? ok(`${route} revalidates`)
      : fail(`${route} may be cached stale — Cache-Control: ${r.cache ?? '(none)'}`);
  }

  // ── Hashed assets must NOT be no-cache ────────────────────────────────────
  const headersText = readFileSync(join(DIST, '_headers'), 'utf8');
  /^\/assets\//m.test(headersText)
    ? fail('dist/_headers contains an /assets/ rule — hashed assets must keep their caching')
    : ok('no /assets/ rule in _headers: hashed assets keep long-lived caching');

  const { readdirSync } = await import('node:fs');
  const assets = readdirSync(join(DIST, 'assets'));
  for (const name of [assets.find((f) => f.endsWith('.js')), assets.find((f) => f.endsWith('.css'))]) {
    if (!name) continue;
    const r = await head(`/assets/${name}`);
    r.cache && REVALIDATES.test(r.cache)
      ? fail(`/assets/${name} was given no-cache — hashed assets must stay cacheable`)
      : ok(`/assets/${name} is not no-cache`);
  }

  // A marketing page keeps whatever caching it had; this change must not touch it.
  const marketing = await head('/leistungen');
  marketing.cache && REVALIDATES.test(marketing.cache)
    ? fail('a public marketing page was given no-cache — out of scope for this fix')
    : ok('public marketing pages are untouched');
} finally {
  await server.close();
}

// ── The Pages Function must keep the same policy ────────────────────────────
// wrangler.jsonc declares a Workers Assets project, where functions/ does NOT
// execute — which is exactly why _headers above must carry the policy too. Both
// paths are asserted so neither deployment mode can regress silently.
const middleware = readFileSync(join(ROOT, 'functions', '_middleware.ts'), 'utf8');
/headers\.set\(\s*['"]Cache-Control['"]\s*,\s*['"]no-cache/i.test(middleware)
  ? ok('middleware still sets Cache-Control: no-cache on HTML')
  : fail('middleware no longer sets no-cache on HTML');
/pathname\.startsWith\(\s*['"]\/assets\/['"]\s*\)/.test(middleware)
  ? ok('middleware still passes /assets/ through untouched')
  : fail('middleware no longer passes /assets/ through');

console.log('');
if (failures.length) {
  console.log(`deploy cache header tests: ${failures.length} FAILED`);
  process.exit(1);
}
console.log('deploy cache header tests: ALL PASSED');
