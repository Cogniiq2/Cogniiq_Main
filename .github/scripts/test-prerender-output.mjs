#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Prerender OUTPUT verification. Runs against dist/ after `npm run build`.
//
// Everything here is about what actually reached the deployable directory:
// the parity of the manifest against the router is checked separately, by
// .github/scripts/test-seo-consistency.mjs.
//
// Reads prerender-report.json (written by scripts/prerender.mjs) so it does not
// need the SSR bundle, which the build removes on completion.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIST = join(ROOT, 'dist');

const failures = [];
const fail = (msg) => failures.push(msg);
const ok = (msg) => console.log(`  ✓ ${msg}`);
const read = (p) => readFileSync(p, 'utf8');

if (!existsSync(DIST)) {
  console.error('✗ dist/ not found. Run `npm run build` first.');
  process.exit(1);
}

const REPORT_PATH = join(ROOT, 'prerender-report.json');
if (!existsSync(REPORT_PATH)) {
  console.error('✗ prerender-report.json not found. Run `npm run build` first.');
  process.exit(1);
}
const report = JSON.parse(read(REPORT_PATH));

// ─── 1. the SSR build did not damage the client build ────────────────────────
const assetsDir = join(DIST, 'assets');
if (!existsSync(assetsDir)) fail('dist/assets is missing — the client build was destroyed');
else {
  const assets = readdirSync(assetsDir);
  const js = assets.filter((f) => f.endsWith('.js'));
  const css = assets.filter((f) => f.endsWith('.css'));
  if (!js.length) fail('dist/assets contains no JavaScript chunks');
  if (!css.length) fail('dist/assets contains no CSS');
  else ok(`client build intact: ${js.length} JS chunks, ${css.length} CSS file(s)`);
}
for (const publicAsset of ['favicon.png', 'og-image.png', 'robots.txt', 'sitemap.xml', '_redirects', '_headers']) {
  if (!existsSync(join(DIST, publicAsset))) fail(`public asset missing from dist: ${publicAsset}`);
}
if (!failures.length) ok('public assets copied into dist (incl. _redirects and _headers)');
if (existsSync(join(ROOT, 'dist-ssr'))) fail('dist-ssr/ still exists — temporary SSR output was not cleaned');
else ok('temporary SSR output (dist-ssr/) cleaned up');

// ─── 2. every generated page exists and references existing client assets ────
const assetRefs = new Set();
let pagesChecked = 0;
const homeCanonical = 'https://cogniiq.de/';

for (const route of report.routes) {
  const file = join(ROOT, route.file);
  if (!existsSync(file)) {
    fail(`missing prerendered page for ${route.path} (${route.file})`);
    continue;
  }
  pagesChecked++;
  const html = read(file);

  // 2a. meaningful rendered content, not an empty SPA shell
  const rootMatch = html.match(/<div id="root">([\s\S]*)<\/div>\s*<\/body>/);
  if (!rootMatch || rootMatch[1].trim().length < 500) {
    fail(`${route.path}: #root has no meaningful prerendered content`);
  }
  if (html.includes('<div id="root"></div>')) fail(`${route.path}: empty root marker survived`);

  // 2b. page-specific, non-inherited metadata
  const title = html.match(/<title>([\s\S]*?)<\/title>/);
  if (!title || !title[1].trim()) fail(`${route.path}: empty <title>`);
  const description = html.match(/<meta name="description" content="([^"]*)"/);
  if (!description || !description[1].trim()) fail(`${route.path}: empty meta description`);

  const canonical = html.match(/<link rel="canonical" href="([^"]*)"/);
  if (!canonical) fail(`${route.path}: no canonical link`);
  else if (canonical[1] !== route.canonical) {
    fail(`${route.path}: canonical is ${canonical[1]}, expected ${route.canonical}`);
  } else if (route.path !== '/' && canonical[1] === homeCanonical) {
    fail(`${route.path}: inherited the homepage canonical`);
  }

  // 2c. robots reflects indexability
  const robots = html.match(/<meta name="robots" content="([^"]*)"/);
  if (!robots) fail(`${route.path}: no robots meta`);
  else if (route.indexable && robots[1].startsWith('noindex')) {
    fail(`${route.path}: indexable route serves noindex`);
  } else if (!route.indexable && !robots[1].startsWith('noindex')) {
    fail(`${route.path}: non-indexable route is missing noindex`);
  }

  for (const m of html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)) assetRefs.add(m[1]);
}
ok(`${pagesChecked} prerendered pages have content, unique titles, descriptions and correct canonicals`);

// 2d. referenced assets exist on disk
const brokenRefs = [...assetRefs].filter((ref) => !existsSync(join(DIST, ref.replace(/^\//, ''))));
if (brokenRefs.length) fail(`generated HTML references missing assets: ${brokenRefs.slice(0, 5).join(', ')}`);
else ok(`all ${assetRefs.size} referenced /assets/* files exist in dist`);

// 2e. titles are actually distinct
const titles = report.routes.map((r) => r.title);
const dupeTitles = [...new Set(titles.filter((t, i) => titles.indexOf(t) !== i))];
if (dupeTitles.length) fail(`duplicate <title> across routes: ${dupeTitles.join(' | ')}`);
else ok('every prerendered route has a distinct title');

// ─── 3. no private route HTML was generated ──────────────────────────────────
const PRIVATE_DIRS = ['app', 'admin', 'owner', 'auth', 'd'];
const leaked = PRIVATE_DIRS.filter((dir) => existsSync(join(DIST, dir)));
if (leaked.length) fail(`private route directories generated in dist: ${leaked.join(', ')}`);
else ok('no private-route HTML generated (/app, /admin, /owner, /auth, /d)');

// Dev-only routes must never reach production output.
for (const devOnly of ['logo-preview', 'scan']) {
  if (existsSync(join(DIST, devOnly))) fail(`dev-only route leaked into production output: /${devOnly}`);
}
ok('dev-only routes (/logo-preview, /scan) absent from production output');

// ─── 4. /anfrage-erhalten: prerendered, noindex, out of the sitemap ──────────
const anfrage = report.routes.find((r) => r.path === '/anfrage-erhalten');
if (!anfrage) fail('/anfrage-erhalten missing from the prerender report');
else {
  if (anfrage.indexable) fail('/anfrage-erhalten must not be indexable');
  const file = join(DIST, 'anfrage-erhalten', 'index.html');
  if (!existsSync(file)) fail('/anfrage-erhalten was not prerendered');
  else if (!/<meta name="robots" content="noindex/.test(read(file))) {
    fail('/anfrage-erhalten is not served noindex');
  }
  if (read(join(DIST, 'sitemap.xml')).includes('/anfrage-erhalten')) {
    fail('/anfrage-erhalten must not appear in the sitemap');
  } else ok('/anfrage-erhalten prerendered with noindex and excluded from the sitemap');
}

// ─── 5. the 404 document is truthful ─────────────────────────────────────────
const notFoundPath = join(DIST, '404.html');
if (!existsSync(notFoundPath)) fail('dist/404.html was not generated');
else {
  const html = read(notFoundPath);
  if (!/<meta name="robots" content="noindex/.test(html)) fail('404.html is not noindex');
  if (/rel="canonical"/.test(html)) fail('404.html carries a canonical link');
  if (/rel="alternate"/.test(html)) fail('404.html carries hreflang alternates');
  if (html.includes(homeCanonical + '"')) {
    // the homepage URL may legitimately appear inside structured data / links;
    // only a canonical or og:url pointing at it would be wrong, both checked above.
  }
  if (/og:url|twitter:url/.test(html)) fail('404.html carries an og:url/twitter:url');
  const body = html.match(/<div id="root">([\s\S]*)<\/div>\s*<\/body>/);
  if (!body || body[1].trim().length < 500) fail('404.html has no meaningful rendered content');
  else if (!/Diese Seite existiert nicht/.test(body[1])) {
    fail('404.html does not contain the German 404 copy');
  } else ok('404.html: rendered German content, noindex, no canonical, no hreflang, no og:url');
}

// ─── 6. routing rules ────────────────────────────────────────────────────────
const redirects = read(join(DIST, '_redirects'));
const rules = redirects
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'))
  .map((l) => l.split(/\s+/));

const SHELL = '/app-shell.html';
for (const prefix of ['/app', '/admin', '/owner', '/auth', '/d']) {
  for (const pattern of [prefix, `${prefix}/*`]) {
    const rule = rules.find((r) => r[0] === pattern);
    if (!rule) fail(`_redirects has no SPA fallback rule for ${pattern}`);
    else if (rule[1] !== SHELL || rule[2] !== '200') {
      fail(`_redirects rule for ${pattern} must be "${SHELL} 200", found "${rule.slice(1).join(' ')}"`);
    }
  }
}
ok('every private prefix has an exact-root AND deep-path SPA fallback at 200');

// The private fallback must be the empty SPA shell, never the prerendered
// homepage — otherwise /app serves marketing markup with the homepage canonical.
const shellFile = join(DIST, 'app-shell.html');
if (!existsSync(shellFile)) fail('dist/app-shell.html (private SPA fallback) was not generated');
else {
  const shell = read(shellFile);
  if (!shell.includes('<div id="root"></div>')) {
    fail('app-shell.html is not an empty SPA shell — private routes would serve prerendered content');
  }
  if (/rel="canonical"/.test(shell)) fail('app-shell.html carries a canonical link');
  if (!/<meta name="robots" content="noindex/.test(shell)) fail('app-shell.html is not noindex');
  if (!/src="\/assets\/[^"]+\.js"/.test(shell)) fail('app-shell.html does not load the client bundle');
  else ok('app-shell.html: empty #root, loads the client bundle, noindex, no canonical');
}
const indexHtml = read(join(DIST, 'index.html'));
if (indexHtml.includes('<div id="root"></div>')) {
  fail('dist/index.html was not prerendered — the homepage would still be an empty shell');
} else ok('dist/index.html is the prerendered homepage, distinct from the private shell');

const catchAll = rules.find((r) => r[0] === '/*');
if (!catchAll) fail('_redirects has no catch-all rule');
else if (catchAll[1] !== '/404.html' || catchAll[2] !== '404') {
  fail(`catch-all must be "/404.html 404", found "${catchAll.slice(1).join(' ')}"`);
} else ok('catch-all returns a real 404 (/404.html 404), not a 200 SPA shell');

if (rules.indexOf(catchAll) !== rules.length - 1) fail('the catch-all rule must be last — earlier rules win');
else ok('catch-all is the last rule');

// ─── 7. server-level noindex headers ─────────────────────────────────────────
const headers = read(join(DIST, '_headers'));
for (const prefix of ['/app', '/admin', '/owner', '/auth', '/d']) {
  for (const pattern of [prefix, `${prefix}/*`]) {
    const block = new RegExp(
      `^${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n\\s*X-Robots-Tag:\\s*noindex, nofollow, noarchive`,
      'm'
    );
    if (!block.test(headers)) fail(`_headers is missing X-Robots-Tag noindex for ${pattern}`);
  }
}
ok('every private prefix (exact root + deep paths) carries X-Robots-Tag: noindex, nofollow, noarchive');

if (!/^\/404\.html\s*\n\s*X-Robots-Tag:\s*noindex/m.test(headers)) fail('_headers is missing noindex for /404.html');
else if (!/^\/app-shell\.html\s*\n\s*X-Robots-Tag:\s*noindex/m.test(headers)) {
  fail('_headers is missing noindex for /app-shell.html');
} else ok('/404.html and /app-shell.html carry server-level noindex headers');

// ─── 8. sitemap sanity ───────────────────────────────────────────────────────
const sitemap = read(join(DIST, 'sitemap.xml'));
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const indexableRoutes = report.routes.filter((r) => r.indexable);
if (locs.length !== indexableRoutes.length) {
  fail(`sitemap has ${locs.length} URLs but the manifest has ${indexableRoutes.length} indexable routes`);
} else ok(`sitemap covers exactly the ${locs.length} indexable routes`);

const missingFromSitemap = indexableRoutes.filter((r) => !locs.includes(r.canonical));
if (missingFromSitemap.length) {
  fail(`indexable routes missing from sitemap: ${missingFromSitemap.map((r) => r.path).join(', ')}`);
}
if (/<lastmod>/.test(sitemap)) {
  const today = new Date().toISOString().slice(0, 10);
  const fabricated = [...sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].filter((m) => m[1] === today);
  if (fabricated.length === locs.length && locs.length > 1) {
    fail('every lastmod equals today — the build date is being fabricated as lastmod');
  } else ok('lastmod values come from the manifest, not the build date');
}

// ─── Result ──────────────────────────────────────────────────────────────────
if (failures.length) {
  console.error('\n✗ Prerender output verification FAILED:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('\n✓ Prerender output verification passed.');
