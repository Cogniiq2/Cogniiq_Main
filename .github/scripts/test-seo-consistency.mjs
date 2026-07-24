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

// City × service routes are registered dynamically from CITY_SERVICE_CONFIGS.
const standorte = read('src/lib/standorte-data.ts');
const cityRoutes = [...standorte.matchAll(/route:\s*"([^"]+)"/g)].map((m) => m[1]);

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
