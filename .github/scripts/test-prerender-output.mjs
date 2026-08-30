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
  const file = join(DIST, 'anfrage-erhalten.html');
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

// The PRETTY path, with no .html extension. Cloudflare Pages canonicalises an
// .html rewrite target to a bodyless 307, which functions/_middleware.ts then
// re-emitted at HTTP 200 — a script-less blank page on every private deep link.
const SHELL = '/app-shell';
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

// ─── 7b. artifact shape ─────────────────────────────────────────────────────
// The build must emit "<path>.html" for every public route and must NOT emit
// "<path>/index.html".
//
// This is an OBSERVED constraint, not a theory about any host's rule ordering:
// the deployment that shipped directory indexes answered a cold request to every
// public URL with ERR_TOO_MANY_REDIRECTS, while the .html artifact serves them
// correctly. Client-side navigation never touches the static layer, so an SPA
// hides this completely — hence a guard on the artifact itself.
//
// The canonical and sitemap URLs carry no trailing slash, so the emitted file
// names must match that form.
for (const route of report.routes) {
  if (route.path === '/') continue;
  const dirIndex = join(DIST, route.path, 'index.html');
  if (existsSync(dirIndex)) {
    fail(`${route.path}: emitted as a directory index — the shape that produced ERR_TOO_MANY_REDIRECTS`);
  }
  if (!existsSync(join(ROOT, route.file))) fail(`${route.path}: expected pretty file ${route.file}`);
  if (route.canonical.endsWith('/')) fail(`${route.path}: canonical must not end with a trailing slash`);
}
{
  const sitemapXml = read(join(DIST, 'sitemap.xml'));
  const trailing = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1])
    .filter((u) => u !== 'https://cogniiq.de/' && u.endsWith('/'));
  if (trailing.length) fail(`sitemap URLs with a trailing slash: ${trailing.slice(0, 3).join(', ')}`);
  else ok('URL policy consistent: pretty .html output, no trailing slash in canonicals or sitemap');
}

// ─── 7c. every page preloads the chunks its markup needs ────────────────────
// Without this the route's lazy chunks arrive after hydration starts, its
// Suspense boundary is still dehydrated when the auth context publishes its
// first update, and React discards the prerendered DOM (React #421).
{
  let missingPreload = 0;
  for (const route of report.routes) {
    const html = read(join(ROOT, route.file));
    const declared = html.match(/__COGNIIQ_ROUTE_CHUNKS__=(\[[^<]*\])/);
    if (!declared) {
      missingPreload++;
      continue;
    }
    const chunks = JSON.parse(declared[1]);
    if (!chunks.length) missingPreload++;
    for (const chunk of chunks) {
      if (!existsSync(join(DIST, chunk.replace(/^\//, '')))) {
        fail(`${route.path}: preloads a chunk that does not exist (${chunk})`);
      }
      if (!html.includes(`rel="modulepreload" crossorigin href="${chunk}"`)) {
        fail(`${route.path}: chunk ${chunk} is awaited but not modulepreloaded`);
      }
    }
  }
  if (missingPreload) fail(`${missingPreload} prerendered page(s) declare no route chunks to preload`);
  else ok(`all ${report.routes.length} pages declare and preload their route chunks`);

  const notFoundHtml = read(join(DIST, '404.html'));
  const fallbackChunks = notFoundHtml.match(/__COGNIIQ_ROUTE_CHUNKS__=(\[[^<]*\])/);
  if (!fallbackChunks) fail('404.html declares no route chunks');
  else if (!/BlogPostPage/.test(fallbackChunks[1])) {
    fail('404.html must also preload the dynamic blog route chunk — it is served for /blog/<unknown> too');
  } else ok('404.html preloads the catch-all page and the dynamic blog route');
}

// ─── 7d. provider-specific routing contract ─────────────────────────────────
// The generated CONTRACT is asserted here, not the host's behaviour — this file
// deliberately does not model or emulate Netlify or Cloudflare.
{
  const redirectsText = read(join(DIST, '_redirects'));
  const ruleLines = redirectsText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
  const rules = ruleLines.map((l) => l.split(/\s+/));
  const provider = report.provider;

  if (provider !== 'netlify' && provider !== 'portable') {
    fail(`prerender-report.json has no recognised provider mode (got ${JSON.stringify(provider)})`);
  }

  if (provider === 'netlify') {
    // One forced canonical rewrite per non-root public route.
    const nonRoot = report.routes.filter((r) => r.path !== '/');
    const missing = [];
    const duplicated = [];
    for (const route of nonRoot) {
      const matching = rules.filter((r) => r[0] === route.path && r[2] === '200!');
      if (matching.length === 0) missing.push(route.path);
      else if (matching.length > 1) duplicated.push(route.path);
      else if (matching[0][1] !== `${route.path}.html`) {
        fail(`${route.path}: rewrite targets ${matching[0][1]}, expected ${route.path}.html`);
      }
    }
    if (missing.length) fail(`Netlify build is missing canonical rewrites for: ${missing.slice(0, 5).join(', ')}`);
    if (duplicated.length) fail(`Netlify build has duplicate rewrites for: ${duplicated.slice(0, 5).join(', ')}`);
    if (!missing.length && !duplicated.length) {
      ok(`Netlify mode: exactly one forced 200 rewrite for each of ${nonRoot.length} non-root public routes`);
    }

    // No trailing-slash canonicalisation may be generated: Netlify states
    // redirects cannot reliably add or remove a trailing slash, and a forced
    // "/route/ -> /route" rule can loop.
    const slashRules = rules.filter((r) => r[0].endsWith('/') && r[0] !== '/' && r[0] !== '/*');
    const forcedRedirects = rules.filter((r) => /^30[128]!$/.test(r[2] || ''));
    if (slashRules.length) fail(`generated trailing-slash rules must not exist: ${slashRules.map((r) => r[0]).join(', ')}`);
    else if (forcedRedirects.length) fail(`forced redirect rules must not exist: ${forcedRedirects.map((r) => r[0]).join(', ')}`);
    else ok('Netlify mode: no trailing-slash rules and no forced redirects generated');

    if (report.generatedNetlifyRules !== nonRoot.length) {
      fail(`report says ${report.generatedNetlifyRules} generated rules, expected ${nonRoot.length}`);
    }
  } else {
    // Cloudflare / local: the shared _redirects format takes numeric statuses
    // only, so no Netlify-specific syntax may reach the artifact.
    const forced = ruleLines.filter((l) => l.includes('!'));
    if (forced.length) fail(`portable build emitted Netlify-only "!" syntax: ${forced.slice(0, 3).join(' | ')}`);
    else ok('portable mode: dist/_redirects contains no Netlify-only "!" syntax');

    if (report.generatedNetlifyRules) {
      fail(`portable build generated ${report.generatedNetlifyRules} Netlify rules — it must generate none`);
    } else ok('portable mode: no provider-specific rules generated');
  }

  // Both modes: the committed source file must stay portable.
  const committed = read(join(ROOT, 'public', '_redirects'))
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
  const committedForced = committed.filter((l) => l.includes('!'));
  if (committedForced.length) {
    fail(`public/_redirects must stay portable, found: ${committedForced.join(' | ')}`);
  } else ok('committed public/_redirects is portable (numeric statuses only)');
}

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

// ─── 9. one metadata source, end to end ──────────────────────────────────────
// Not an "SEO rule about byte identity". The invariant is provenance: a route's
// title and description are declared once, in PUBLIC_ROUTES, and everything that
// states them must be that declaration.
//
//   manifest ──> scripts/prerender.mjs ──> served <title> / meta description
//            └─> src/lib/routing/routeMetadata.ts ──> PageSEO ──> WebPage JSON-LD,
//                                                     OG/Twitter, hydrated <head>
//
// Both legs are checked, because either one breaking reintroduces the defect this
// architecture removed: 74 of 92 documents once shipped schema that contradicted
// their own title, and the hydrated document contradicted both.
{
  let checked = 0;
  const problems = [];
  const unescape = (s) => s.replace(/\\u003c/g, '<');
  const decode = (s) =>
    s
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');

  for (const route of report.routes) {
    const file = join(ROOT, route.file);
    if (!existsSync(file)) continue;
    const html = read(file);

    const servedTitle = decode((html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] ?? '');
    const servedDescription = decode(
      (html.match(/<meta name="description" content="([^"]*)" \/>/) || [])[1] ?? ''
    );

    // Leg 1 — the served head is the manifest's.
    if (servedTitle !== route.title) {
      problems.push(`${route.path}: served <title> "${servedTitle}" is not the manifest title "${route.title}"`);
    }
    if (route.description !== undefined && servedDescription !== route.description) {
      problems.push(`${route.path}: served meta description is not the manifest description`);
    }

    // Leg 2 — the component rendered from the same source.
    const open = '<script type="application/ld+json" id="page-webpage-schema">';
    const start = html.indexOf(open);
    if (start === -1) continue;
    const from = start + open.length;
    const end = html.indexOf('</script>', from);
    if (end === -1) {
      problems.push(`${route.path}: unterminated page-webpage-schema block`);
      continue;
    }

    let node;
    try {
      node = JSON.parse(unescape(html.slice(from, end)));
    } catch (error) {
      problems.push(`${route.path}: page-webpage-schema is not valid JSON (${error.message})`);
      continue;
    }

    checked += 1;
    if (node.name !== servedTitle) {
      problems.push(`${route.path}: WebPage.name "${node.name}" disagrees with the served <title> "${servedTitle}"`);
    }
    if (node.description !== servedDescription) {
      problems.push(`${route.path}: WebPage.description disagrees with the served meta description`);
    }
  }

  if (problems.length) {
    for (const p of problems.slice(0, 12)) fail(p);
    if (problems.length > 12) fail(`...and ${problems.length - 12} further metadata-provenance failures`);
  } else {
    ok(`title and description come from PUBLIC_ROUTES in the head and the schema on all ${checked} routes`);
  }
}

// ─── 10. the homepage hero is crawlable and works without JavaScript ─────────
// The hero is the most prominent module on the site and the only one that links
// to the two pages the business cares about. Both of its calls to action shipped
// as <button onClick={() => navigate(...)}>: a button carries no href, so the
// prerendered homepage passed NO link to /kontakt at all, the CTA did nothing
// without JavaScript, and it could not be opened in a new tab or copied.
//
// This asserts the shape of the served bytes, not of the React tree, because the
// React tree was never the thing that was wrong — a <button> renders perfectly
// and still exports no link. It also pins the canonical H1, which the hero owns:
// the homepage is rendered from MobileHero at build time and swapped to
// DesktopHero after hydration, so "how many H1s does / actually ship" is a
// question only the artifact can answer.
{
  const homepage = read(join(DIST, 'index.html'));
  const rootMatch = homepage.match(/<div id="root">([\s\S]*)<\/div>\s*<\/body>/);

  if (!rootMatch) {
    fail('homepage: could not locate the prerendered #root markup');
  } else {
    const root = rootMatch[1];

    // The hero region is bounded by the <section> that CONTAINS the H1: from the
    // last <section> opening before it to the next <section> opening after it.
    // A fixed byte window would silently pass — the pre-fix homepage had a
    // /kontakt link a few thousand bytes further down, in an unrelated section.
    const h1Index = root.indexOf('<h1');
    if (h1Index === -1) {
      fail('homepage: no <h1> in the prerendered markup');
    } else {
      const heroStart = root.lastIndexOf('<section', h1Index);
      const nextSection = root.indexOf('<section', h1Index);
      const heroEnd = nextSection === -1 ? root.length : nextSection;
      const heroRegion = root.slice(heroStart === -1 ? 0 : heroStart, heroEnd);

      const h1Count = (root.match(/<h1[\s>]/g) || []).length;
      if (h1Count !== 1) {
        fail(`homepage ships ${h1Count} <h1> elements; exactly 1 is required`);
      } else {
        ok('homepage ships exactly one <h1>');
      }

      // Exact canonical headline. <br> and the per-word <span> wrappers used by
      // the entrance animation are stripped; the non-breaking spaces that hold
      // the words together are normalised back to ordinary spaces.
      const h1Inner = (root.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '';
      const h1Text = h1Inner
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<[^>]+>/g, '')
        .replace(/ /g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const CANONICAL_H1 = 'Digitale Systeme, die Unternehmen führen.';
      if (h1Text !== CANONICAL_H1) {
        fail(`homepage <h1> is ${JSON.stringify(h1Text)}; must be exactly ${JSON.stringify(CANONICAL_H1)}`);
      } else {
        ok('homepage <h1> is the canonical headline');
      }

      // The actual regression guard: real hrefs, in the served HTML, in the hero.
      const heroHrefs = [...heroRegion.matchAll(/<a\s[^>]*href="([^"]+)"/g)].map((m) => m[1]);
      for (const target of ['/kontakt', '/leistungen']) {
        if (!heroHrefs.includes(target)) {
          fail(
            `homepage hero exports no crawlable <a href="${target}"> — ` +
              'a call to action routed through onClick/navigate() is invisible to a crawler ' +
              'and inert without JavaScript'
          );
        }
      }
      if (heroHrefs.includes('/kontakt') && heroHrefs.includes('/leistungen')) {
        ok('homepage hero exports crawlable links to /kontakt and /leistungen');
      }

      // A <button> in the hero is the defect itself reappearing. The hero has no
      // legitimate button: nothing in it submits, toggles or opens anything.
      const heroButtons = (heroRegion.match(/<button[\s>]/g) || []).length;
      if (heroButtons > 0) {
        fail(
          `homepage hero contains ${heroButtons} <button> element(s); ` +
            'hero navigation must be anchors so it is crawlable and works without JavaScript'
        );
      } else {
        ok('homepage hero contains no navigation buttons');
      }

      // framer-motion marks any element carrying whileTap/whileHover as
      // tabIndex=0. On a decorative overlay that puts an empty gradient <div>
      // into the keyboard tab order, inside the control it decorates.
      const focusableDecorations = (heroRegion.match(/<div[^>]*\stabindex="0"/g) || []).length;
      if (focusableDecorations > 0) {
        fail(
          `homepage hero has ${focusableDecorations} focusable decorative <div>(s) (tabindex="0") — ` +
            'these are keyboard traps between the real controls'
        );
      } else {
        ok('homepage hero has no focusable decorative elements');
      }
    }
  }
}

// ─── Result ──────────────────────────────────────────────────────────────────
if (failures.length) {
  console.error('\n✗ Prerender output verification FAILED:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('\n✓ Prerender output verification passed.');
