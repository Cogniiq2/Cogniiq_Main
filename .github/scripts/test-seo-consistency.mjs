#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// SEO + consent consistency checks (Phase 0).
//
// Prevents drift between the route table (src/App.tsx + CITY_SERVICE_CONFIGS),
// the edge middleware metadata (functions/_middleware.ts), the sitemap
// (public/sitemap.xml) and the blog data (src/lib/blog-data.ts); verifies the
// legal routes exist; and guards the consent contract (no Google tag before
// consent). Runs in CI via .github/workflows/build.yml. No runtime deps.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const failures = [];
const fail = (msg) => failures.push(msg);
const ok = (msg) => console.log(`  ✓ ${msg}`);

// ─── 1. Collect the route table ──────────────────────────────────────────────
const appTsx = read('src/App.tsx');
const literalRoutes = [...appTsx.matchAll(/path="([^"]+)"/g)].map((m) => m[1]);

// City × service routes are registered dynamically from CITY_SERVICE_ROUTES in
// src/lib/standorte-data.ts. The page CONTENT moved to standorte-service-configs.ts
// (it is lazy — it must not sit in the entry chunk), so the authoritative
// `route:` declarations are read from there. src/lib/standorte-data.test.ts
// asserts the two lists agree, so either file answers this question; reading the
// configs keeps this check on the same declarations it has always used.
const standorte = read('src/lib/standorte-service-configs.ts');
const cityRoutes = [...standorte.matchAll(/route:\s*"([^"]+)"/g)].map((m) => m[1]);
if (cityRoutes.length !== 9) {
  fail(`Expected 9 city × service routes in standorte-service-configs.ts, found ${cityRoutes.length}`);
}

const allRoutePatterns = [...new Set([...literalRoutes, ...cityRoutes])]
  // Drop the bare catch-all so it cannot mask a genuinely missing route.
  .filter((r) => r !== '*');

// Convert a route pattern (":param" segments, "*" splat) into a matcher regex.
function toMatcher(pattern) {
  const parts = pattern.split('/').map((seg) => {
    if (seg === '*') return '.*';
    if (seg.startsWith(':')) return '[^/]+';
    return seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  });
  return new RegExp(`^${parts.join('/')}$`);
}
const matchers = allRoutePatterns.map(toMatcher);
const isRoute = (path) => matchers.some((re) => re.test(path));

// ─── 2. Sitemap ⇄ routes ─────────────────────────────────────────────────────
const sitemap = read('public/sitemap.xml');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const sitemapPaths = locs.map((u) => u.replace(/^https?:\/\/cogniiq\.de/, '') || '/');

// 2a. No duplicate <loc>.
const dupes = locs.filter((u, i) => locs.indexOf(u) !== i);
if (dupes.length) fail(`Duplicate <loc> in sitemap: ${[...new Set(dupes)].join(', ')}`);
else ok(`sitemap has ${locs.length} unique <loc> entries, no duplicates`);

// 2b. Every sitemap URL resolves to a real route.
const orphanSitemap = sitemapPaths.filter((p) => !isRoute(p));
if (orphanSitemap.length) fail(`Sitemap URLs with no matching route: ${orphanSitemap.join(', ')}`);
else ok('every sitemap URL resolves to a real route');

// ─── 3. Middleware metadata keys ⇄ routes ────────────────────────────────────
const middleware = read('functions/_middleware.ts');
const mwKeys = [...middleware.matchAll(/^\s*'(\/[^']*)':\s*\{/gm)].map((m) => m[1]);
const orphanMw = mwKeys.filter((p) => !isRoute(p));
if (orphanMw.length) fail(`Middleware seoConfig keys with no matching route: ${orphanMw.join(', ')}`);
else ok(`all ${mwKeys.length} middleware metadata keys map to real routes`);

// ─── 3b. Route manifest ⇄ runtime router (BIDIRECTIONAL) ─────────────────────
// src/lib/routing/publicRoutes.ts is the authoritative SEO/prerender/sitemap
// manifest. It is NOT the runtime router — src/App.tsx still owns the route
// table — so their parity is not assumed, it is enforced here in both
// directions. Source text is read (as everywhere else in this script) rather
// than imported: this check must work without a build.
const manifestSrc = read('src/lib/routing/publicRoutes.ts');
const manifestEntries = [
  ...manifestSrc.matchAll(/path:\s*"([^"]+)",[\s\S]*?indexable:\s*(true|false)/g),
].map((m) => ({ path: m[1], indexable: m[2] === 'true' }));
const manifestPaths = manifestEntries.map((e) => e.path);

// Routes registered only under `import.meta.env.DEV` never exist in a
// production build and must never enter the manifest, sitemap or prerender set.
const devBlock = appTsx.match(/import\.meta\.env\.DEV\s*&&\s*\(([\s\S]*?)\)\}/);
const devOnlyRoutes = devBlock ? [...devBlock[1].matchAll(/path="([^"]+)"/g)].map((m) => m[1]) : [];
if (!devOnlyRoutes.length) fail('Could not identify the DEV-only route block in src/App.tsx');
else ok(`dev-only routes identified: ${devOnlyRoutes.join(', ')}`);

const PRIVATE_PREFIXES = ['/app', '/admin', '/owner', '/auth', '/d'];
const isPrivatePath = (p) =>
  PRIVATE_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`));

// Concrete public routes the router actually serves in production.
const publicAppRoutes = allRoutePatterns.filter(
  (p) =>
    !isPrivatePath(p) &&
    !devOnlyRoutes.includes(p) &&
    !p.includes(':') &&
    !p.includes('*')
);

// 3b-i. Every public App route must be in the manifest (otherwise the catch-all
// turns it into a hard 404 instead of a prerendered page).
const missingFromManifest = publicAppRoutes.filter((p) => !manifestPaths.includes(p));
if (missingFromManifest.length) {
  fail(
    `Public routes in src/App.tsx missing from the manifest (they would 404 in production): ${missingFromManifest.join(', ')}`
  );
} else ok(`all ${publicAppRoutes.length} public App routes are in the manifest`);

// 3b-ii. Every manifest route must be servable by the router (otherwise we
// prerender a page the SPA cannot take over on navigation).
const orphanManifest = manifestPaths.filter((p) => !isRoute(p));
if (orphanManifest.length) {
  fail(`Manifest routes with no matching route in src/App.tsx: ${orphanManifest.join(', ')}`);
} else ok(`all ${manifestPaths.length} manifest routes resolve in the runtime router`);

// 3b-iii. Dev-only and private routes must never appear in the manifest.
const devInManifest = manifestPaths.filter((p) => devOnlyRoutes.includes(p));
if (devInManifest.length) fail(`Dev-only routes present in the manifest: ${devInManifest.join(', ')}`);
else ok('no dev-only route entered the manifest');

const privateInManifest = manifestPaths.filter(isPrivatePath);
if (privateInManifest.length) fail(`Private routes present in the public manifest: ${privateInManifest.join(', ')}`);
else ok('no private route entered the public manifest');

// 3b-iv. Non-indexable routes must never reach the sitemap.
const nonIndexable = manifestEntries.filter((e) => !e.indexable).map((e) => e.path);
const nonIndexableInSitemap = nonIndexable.filter((p) => sitemapPaths.includes(p));
if (nonIndexableInSitemap.length) {
  fail(`Non-indexable routes present in the sitemap: ${nonIndexableInSitemap.join(', ')}`);
} else ok(`non-indexable route(s) excluded from the sitemap: ${nonIndexable.join(', ') || 'none'}`);

// 3b-v. Sitemap ⇄ manifest is exact in both directions.
const indexableManifest = manifestEntries.filter((e) => e.indexable).map((e) => e.path);
const sitemapMissing = indexableManifest.filter((p) => !sitemapPaths.includes(p));
const sitemapExtra = sitemapPaths.filter((p) => !indexableManifest.includes(p));
if (sitemapMissing.length) fail(`Indexable manifest routes missing from the sitemap: ${sitemapMissing.join(', ')}`);
if (sitemapExtra.length) fail(`Sitemap URLs not in the manifest: ${sitemapExtra.join(', ')}`);
if (!sitemapMissing.length && !sitemapExtra.length) {
  ok(`sitemap matches the manifest exactly (${indexableManifest.length} indexable routes)`);
}

// 3b-vi. lastmod must never be a fabricated build date.
const manifestLastmods = [...manifestSrc.matchAll(/lastmod:\s*"([^"]+)"/g)].map((m) => m[1]);
if (/new Date\(|Date\.now\(/.test(manifestSrc)) fail('The manifest must not compute dates — lastmod is hand-maintained');
else if (!manifestLastmods.length) fail('No lastmod values found in the manifest');
else ok(`${manifestLastmods.length} hand-maintained lastmod values, none computed at build time`);

// 3b-vii. The manifest must not drift from the (inert on Netlify) Cloudflare
// middleware while that file still exists. functions/_middleware.ts is NOT
// modified by this gate; this only prevents the two from disagreeing.
const mwNotInManifest = mwKeys.filter((p) => !manifestPaths.includes(p));
if (mwNotInManifest.length) {
  fail(`functions/_middleware.ts has metadata for routes missing from the manifest: ${mwNotInManifest.join(', ')}`);
} else ok('middleware metadata keys are a subset of the manifest (no drift)');

// ─── 3c. Netlify routing + headers ───────────────────────────────────────────
const redirectsSrc = read('public/_redirects');
const redirectRules = redirectsSrc
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'))
  .map((l) => l.split(/\s+/));

if (redirectRules.some((r) => r[0] === '/*' && r[1] === '/index.html' && r[2] === '200')) {
  fail('public/_redirects still answers every unknown URL with the SPA shell at 200 (soft 404)');
}
const headersSrc = read('public/_headers');
for (const prefix of PRIVATE_PREFIXES) {
  for (const pattern of [prefix, `${prefix}/*`]) {
    const spa = redirectRules.find((r) => r[0] === pattern);
    // Must target the dedicated empty shell, never /index.html — that file is the
    // prerendered homepage, so private routes would serve marketing markup with
    // the homepage canonical on it.
    //
    // And by its PRETTY path, never '/app-shell.html': Cloudflare Pages
    // canonicalises an .html rewrite target to a bodyless 307, which the
    // middleware re-emitted at HTTP 200 — a script-less blank page.
    if (!spa || spa[1] !== '/app-shell' || spa[2] !== '200') {
      fail(`public/_redirects must serve /app-shell at 200 for ${pattern}`);
    }
    const esc = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!new RegExp(`^${esc}\\s*\\n\\s*X-Robots-Tag:\\s*noindex, nofollow, noarchive`, 'm').test(headersSrc)) {
      fail(`public/_headers must set X-Robots-Tag noindex for ${pattern}`);
    }
  }
}
if (!failures.some((f) => f.includes('_redirects') || f.includes('_headers'))) {
  ok('private prefixes keep the SPA shell at 200 and carry server-level noindex (exact root + deep paths)');
}

// The private SPA fallback document. Its generated form is asserted against the
// real artifact in .github/scripts/test-prerender-output.mjs; here the source
// contract is pinned so the guarantees cannot be quietly removed from the
// generator without CI noticing, build or no build.
const prerenderSrc = read('scripts/prerender.mjs');
for (const [re, label] of [
  [/const SHELL_FILE = 'app-shell\.html'/, 'the private shell is app-shell.html'],
  [/Private SPA shell still carries a canonical link/, 'shell generation fails if a canonical survives'],
  [/Private SPA shell is not noindex/, 'shell generation fails if the shell is not noindex'],
  [/Private SPA shell lost its empty #root marker/, 'shell generation fails if #root is not empty'],
]) {
  if (!re.test(prerenderSrc)) fail(`Prerender shell contract: expected ${label}`);
  else ok(label);
}

// ─── 3d. robots.txt must not contradict the noindex instructions ─────────────
// A crawler has to be allowed to FETCH a URL before it can see that URL's
// noindex. Disallowing a private prefix here would suppress both the
// X-Robots-Tag header and the shell's robots meta, and can leave URL-only
// listings in search results — the opposite of what the Disallow intended.
// robots.txt is not access control: authentication and RLS are.
const robotsTxt = read('public/robots.txt');
const disallowed = [...robotsTxt.matchAll(/^\s*Disallow:\s*(\S+)\s*$/gim)].map((m) => m[1]);
const contradicting = PRIVATE_PREFIXES.filter((prefix) =>
  disallowed.some((rule) => rule === prefix || rule === `${prefix}/` || rule.startsWith(`${prefix}/`))
);
if (contradicting.length) {
  fail(
    `robots.txt disallows ${contradicting.join(', ')}, which prevents crawlers from ever seeing the ` +
      'X-Robots-Tag / robots meta noindex on those routes'
  );
} else ok(`robots.txt blocks none of ${PRIVATE_PREFIXES.join(', ')} — their noindex stays readable`);

if (disallowed.some((rule) => rule === '/admin' || rule.startsWith('/admin/'))) {
  fail('robots.txt still disallows /admin');
} else ok('/admin is not blocked by robots.txt');

// The corollary: nothing private may be advertised anywhere public.
const privateInSitemap = sitemapPaths.filter(isPrivatePath);
if (privateInSitemap.length) fail(`Private paths present in the sitemap: ${privateInSitemap.join(', ')}`);
else ok('no private path appears in the sitemap');
// (privateInManifest is asserted in 3b-iii above.)

const catchAllRule = redirectRules[redirectRules.length - 1];
if (!catchAllRule || catchAllRule[0] !== '/*' || catchAllRule[1] !== '/404.html' || catchAllRule[2] !== '404') {
  fail('public/_redirects must end with "/* /404.html 404" so unknown public URLs get a real 404');
} else ok('unknown public URLs fall through to a real 404');

// ─── 4. Legal routes exist (route table + sitemap) ───────────────────────────
for (const legal of ['/impressum', '/datenschutz']) {
  if (!literalRoutes.includes(legal)) fail(`Legal route ${legal} missing from src/App.tsx`);
  else if (!sitemapPaths.includes(legal)) fail(`Legal route ${legal} missing from sitemap`);
  else ok(`legal route ${legal} present in route table + sitemap`);
}

// ─── 5. Blog slugs ⇄ sitemap ⇄ middleware ────────────────────────────────────
const blogData = read('src/lib/blog-data.ts');
const blogSlugs = [
  ...blogData.matchAll(/canonical:\s*"https:\/\/cogniiq\.de\/blog\/([^"]+)"/g),
].map((m) => m[1]);
const sitemapBlog = sitemapPaths.filter((p) => p.startsWith('/blog/')).map((p) => p.slice('/blog/'.length));

for (const slug of blogSlugs) {
  if (!sitemapBlog.includes(slug)) fail(`Blog post ${slug} missing from sitemap`);
  if (!mwKeys.includes(`/blog/${slug}`)) fail(`Blog post ${slug} missing middleware metadata`);
}
for (const slug of sitemapBlog) {
  if (!blogSlugs.includes(slug)) fail(`Sitemap references unknown blog post ${slug}`);
}

// Blog slugs ⇄ manifest, both directions: a post added to blog-data.ts without a
// manifest entry would never be prerendered, and a manifest entry for a deleted
// post would prerender a page /blog/:slug can no longer resolve.
const manifestBlog = manifestPaths
  .filter((p) => p.startsWith('/blog/'))
  .map((p) => p.slice('/blog/'.length));
for (const slug of blogSlugs) {
  if (!manifestBlog.includes(slug)) fail(`Blog post ${slug} missing from the route manifest`);
}
for (const slug of manifestBlog) {
  if (!blogSlugs.includes(slug)) fail(`Manifest lists blog post ${slug} which does not exist in blog-data.ts`);
}
if (blogSlugs.length === manifestBlog.length && !manifestBlog.some((s) => !blogSlugs.includes(s))) {
  ok(`all ${manifestBlog.length} blog slugs match between blog-data.ts and the manifest`);
}
if (blogSlugs.length && !failures.some((f) => f.includes('Blog') || f.includes('blog post')))
  ok(`all ${blogSlugs.length} blog posts consistent across data, sitemap and middleware`);

// ─── 6. Consent contract ─────────────────────────────────────────────────────
const indexHtml = read('index.html');
if (/googletagmanager\.com/.test(indexHtml))
  fail('index.html must NOT reference googletagmanager.com (tag loads only after consent)');
else if (/\bgtag\s*\(/.test(indexHtml))
  fail('index.html must NOT call gtag() (consent is managed in src/lib/consent.ts)');
else ok('index.html loads no Google tag before consent');

const consent = read('src/lib/consent.ts');
const consentChecks = [
  [/googletagmanager\.com\/gtag\/js/, 'consent.ts loads gtag.js dynamically'],
  [/AW-17946397271/, 'consent.ts references the Google Ads id'],
  [/ad_storage:\s*'denied'/, "consent.ts sets ad_storage default 'denied'"],
  [/ad_user_data:\s*'granted'/, "consent.ts grants ad_user_data on acceptance"],
  [/ad_personalization:\s*'granted'/, "consent.ts grants ad_personalization on acceptance"],
];
for (const [re, label] of consentChecks) {
  if (!re.test(consent)) fail(`Consent contract: expected ${label}`);
  else ok(label);
}
// analytics_storage must NOT be granted (no analytics product in use).
if (/analytics_storage:\s*'granted'/.test(consent))
  fail("consent.ts must not grant analytics_storage (no analytics product is used)");
else ok("consent.ts leaves analytics_storage denied");

// ─── 7. Duplicate SEO config removed / unconsumed ────────────────────────────
if (existsSync(join(ROOT, 'src/config/seoConfig.ts')))
  fail('src/config/seoConfig.ts still exists — remove the dead duplicate of functions/_middleware.ts');
else ok('duplicate src/config/seoConfig.ts removed');

const srcRefs = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(entry) && /config\/seoConfig/.test(readFileSync(p, 'utf8')))
      srcRefs.push(p.replace(ROOT + '/', ''));
  }
})(join(ROOT, 'src'));
if (srcRefs.length) fail(`Lingering imports of config/seoConfig in: ${srcRefs.join(', ')}`);
else ok('no source file imports config/seoConfig');

// ─── 8. Legal invariants (address + tax details) ────────────────────────────
// Scan the WHOLE repository (text files) so a forbidden value cannot reappear
// anywhere. Excludes vendor/build dirs and this script itself (it necessarily
// contains the forbidden patterns as guards). Forbidden patterns are also built
// from fragments so the script does not self-match.
const SELF = fileURLToPath(import.meta.url);
const SKIP_DIRS = new Set(['node_modules', 'dist', 'dist-ssr', '.git']);
const legalFiles = [];
(function collect(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) collect(p);
    else if (
      /\.(ts|tsx|html|xml|txt|js|mjs|md|json)$/.test(entry) &&
      entry !== 'package-lock.json' &&
      p !== SELF
    )
      legalFiles.push(p.replace(ROOT + '/', ''));
  }
})(ROOT);

const forbidden = [
  [new RegExp('Am\\s+Main\\s+Stra(?:ß|ss)e', 'i'), 'obsolete address "Am Main Straße" (use "Am Main 3")'],
  [new RegExp('Klein' + 'unternehmer', 'i'), 'small-business VAT label (business is VAT-liable)'],
  [new RegExp('96\\s*045\\s*817\\s*336'), 'personal Steuer-ID (must never be published)'],
];
for (const [re, label] of forbidden) {
  const hits = legalFiles.filter((f) => re.test(read(f)));
  if (hits.length) fail(`Forbidden ${label} found in: ${hits.join(', ')}`);
  else ok(`no ${label}`);
}

const legalContent = read('src/lib/legal-content.tsx');
for (const [re, label] of [
  [/DE460292419/, 'USt-IdNr. DE460292419 present in Impressum'],
  [/Inhaber: Lazar Popovic/, 'operator "Inhaber: Lazar Popovic" present'],
  [/Am Main 3/, 'corrected address "Am Main 3" referenced'],
]) {
  if (!re.test(legalContent) && !(label.includes('address') && /Am Main 3/.test(read('src/lib/seo-data.ts'))))
    fail(`Legal content: expected ${label}`);
  else ok(label);
}

// ─── Result ──────────────────────────────────────────────────────────────────
if (failures.length) {
  console.error('\n✗ SEO/consent consistency FAILED:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('\n✓ SEO/consent consistency checks passed.');
