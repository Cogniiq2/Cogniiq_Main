#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Static routing guard for the published artifact.
//
//   node .github/scripts/test-netlify-routing.mjs
//
// Resolves EVERY public route — and its trailing-slash, .html and unknown-URL
// variants — through a model of Netlify's documented resolution order
// (scripts/lib/netlify-routing.mjs) and fails on:
//
//   • a redirect loop (ERR_TOO_MANY_REDIRECTS)
//   • a canonical URL that does not settle on its own prerendered document
//   • more than one redirect hop for any URL
//   • a directory/file namespace collision (<path>/index.html alongside the
//     route <path>), which is what caused the loop in the first place
//   • a private route that stops serving the SPA shell at 200
//   • an unknown URL that stops returning a real 404
//
// WHY THIS EXISTS
// The previous deployment emitted <path>/index.html. Netlify then redirected
// "/leistungen" -> "/leistungen/" (the path names a directory) while
// trailing-slash normalisation redirected "/leistungen/" -> "/leistungen". Cold
// requests to every public URL died with ERR_TOO_MANY_REDIRECTS. Client-side
// navigation never touches the static layer, so the SPA hid it completely, and
// no test in the suite looked at redirect chains at all.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

import { parseRedirects, trace } from '../../scripts/lib/netlify-routing.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
// --dist=<path> lets the guard be pointed at a reconstructed artifact, which is
// how its ability to catch the redirect-loop shape is proven rather than assumed.
const distArg = process.argv.find((a) => a.startsWith('--dist='));
const DIST = distArg ? distArg.slice('--dist='.length) : join(ROOT, 'dist');
const reportArg = process.argv.find((a) => a.startsWith('--report='));

const failures = [];
const fail = (msg) => failures.push(msg);
const ok = (msg) => console.log(`  ✓ ${msg}`);

if (!existsSync(join(DIST, '_redirects'))) {
  console.error('✗ dist/_redirects not found. Run `npm run build` first.');
  process.exit(1);
}
const reportPath = reportArg ? reportArg.slice('--report='.length) : join(ROOT, 'prerender-report.json');
if (!existsSync(reportPath)) {
  console.error('✗ prerender-report.json not found. Run `npm run build` first.');
  process.exit(1);
}

const report = JSON.parse(readFileSync(reportPath, 'utf8'));
const rules = parseRedirects(readFileSync(join(DIST, '_redirects'), 'utf8'));
const expectedFile = (route) => join(DIST, route.file.replace(/^dist\//, ''));

// ─── 1. every canonical public URL resolves to its own page, no redirect ─────
let loops = 0;
let wrongDoc = 0;
let redirected = 0;
for (const route of report.routes) {
  const t = trace(DIST, route.path, rules);
  if (t.loop) {
    loops++;
    fail(`${route.path}: REDIRECT LOOP (${t.hops.join(' -> ')})`);
    continue;
  }
  if (t.redirects > 0) {
    redirected++;
    fail(`${route.path}: canonical URL redirects (${t.hops.join(' -> ')}) — it must be served directly`);
  }
  if (t.final.status !== 200) {
    fail(`${route.path}: resolves with status ${t.final.status}, expected 200`);
  } else if (t.final.file !== expectedFile(route)) {
    wrongDoc++;
    fail(
      `${route.path}: served ${relative(DIST, t.final.file)}, expected ${route.file}`
    );
  }
}
if (!loops && !wrongDoc && !redirected) {
  ok(`all ${report.routes.length} canonical public URLs resolve directly to their own document, 0 redirects, 0 loops`);
}

// ─── 2. trailing-slash variants collapse in exactly one hop ─────────────────
let slashProblems = 0;
for (const route of report.routes) {
  if (route.path === '/') continue;
  const t = trace(DIST, `${route.path}/`, rules);
  if (t.loop) {
    slashProblems++;
    fail(`${route.path}/: REDIRECT LOOP (${t.hops.join(' -> ')})`);
  } else if (t.redirects > 1) {
    slashProblems++;
    fail(`${route.path}/: ${t.redirects} redirects (${t.hops.join(' -> ')}), expected at most 1`);
  } else if (t.final.status !== 200 || t.final.file !== expectedFile(route)) {
    slashProblems++;
    fail(`${route.path}/: settles on status ${t.final.status} / ${t.final.file && relative(DIST, t.final.file)}`);
  }
}
if (!slashProblems) {
  ok(`all trailing-slash variants collapse onto the canonical URL in one hop and serve the same document`);
}

// ─── 3. no directory/file namespace collision ───────────────────────────────
// A route emitted as <path>/index.html is exactly what made Netlify redirect
// "<path>" -> "<path>/" and start the loop.
const collisions = report.routes
  .filter((r) => r.path !== '/')
  .filter((r) => existsSync(join(DIST, r.path, 'index.html')));
if (collisions.length) {
  fail(
    `routes emitted as a directory index (this is the redirect-loop shape): ${collisions
      .map((r) => r.path)
      .join(', ')}`
  );
} else ok('no route is emitted as <path>/index.html — no directory/file namespace collision');

// A directory may still exist as a namespace parent (dist/bayreuth/ next to
// dist/bayreuth.html); that is fine as long as it holds no index.html.
const parentDirs = report.routes
  .filter((r) => r.path !== '/' && existsSync(join(DIST, r.path)) && statSync(join(DIST, r.path)).isDirectory())
  .map((r) => r.path);
ok(`${parentDirs.length} route path(s) also act as a directory namespace, none with an index.html`);

// ─── 4. private routes keep the SPA shell at 200 ────────────────────────────
let privateProblems = 0;
for (const prefix of ['/app', '/admin', '/owner', '/auth', '/d']) {
  for (const path of [prefix, `${prefix}/deep`, `${prefix}/deep/deeper`]) {
    const t = trace(DIST, path, rules);
    if (t.loop) {
      privateProblems++;
      fail(`${path}: REDIRECT LOOP on a private route`);
    } else if (t.final.status !== 200) {
      privateProblems++;
      fail(`${path}: status ${t.final.status}, expected the SPA shell at 200`);
    } else if (!t.final.file.endsWith('app-shell.html')) {
      privateProblems++;
      fail(`${path}: served ${relative(DIST, t.final.file)}, expected app-shell.html`);
    }
  }
}
if (!privateProblems) ok('private routes (exact root + deep paths) serve app-shell.html at 200, no loops');

// ─── 5. unknown URLs still return a real 404 ────────────────────────────────
let notFoundProblems = 0;
for (const path of [
  '/gibt-es-nicht-xyz',
  '/blog/kein-artikel',
  '/leistungen/nicht-existent',
  '/logo-preview',
  '/scan',
]) {
  const t = trace(DIST, path, rules);
  if (t.loop) {
    notFoundProblems++;
    fail(`${path}: REDIRECT LOOP on an unknown URL`);
  } else if (t.final.status !== 404) {
    notFoundProblems++;
    fail(`${path}: status ${t.final.status}, expected 404`);
  } else if (!t.final.file.endsWith('404.html')) {
    notFoundProblems++;
    fail(`${path}: served ${relative(DIST, t.final.file)}, expected 404.html`);
  }
}
if (!notFoundProblems) ok('unknown URLs and dev-only routes return a real 404 from 404.html');

// ─── 6. the generated rule block is present and complete ────────────────────
const redirectsText = readFileSync(join(DIST, '_redirects'), 'utf8');
if (!redirectsText.includes('# @generated-public-routes')) {
  fail('dist/_redirects is missing the generated public-route block');
} else {
  const missingRule = report.routes
    .filter((r) => r.path !== '/')
    .filter((r) => !rules.some((rule) => rule.from === r.path && rule.force && rule.status === 200));
  if (missingRule.length) {
    fail(`routes without a forced 200 rewrite: ${missingRule.map((r) => r.path).slice(0, 5).join(', ')}`);
  } else ok(`every non-root public route has a forced 200 rewrite (${report.routes.length - 1} rules)`);
}

// ─── Result ─────────────────────────────────────────────────────────────────
if (failures.length) {
  console.error('\n✗ Netlify routing verification FAILED:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('\n✓ Netlify routing verification passed.');
