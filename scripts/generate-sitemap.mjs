#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Deterministic sitemap generator.
//
//   node scripts/generate-sitemap.mjs           write public/sitemap.xml
//   node scripts/generate-sitemap.mjs --check    fail if the committed file
//                                                differs from the generated one
//
// public/sitemap.xml stays a COMMITTED artifact: it is reviewable in the diff
// and CI proves it is current (--check runs in .github/workflows/build.yml).
//
// Guarantees:
//   • Routes with `indexable: false` never appear (this excludes
//     /anfrage-erhalten, which is also Disallow-ed in robots.txt).
//   • `lastmod` comes from the manifest only. The build date is NEVER used —
//     a lastmod that moves on every deploy is a fabricated signal to crawlers.
//   • Output is byte-stable: manifest order, fixed formatting, priorities kept
//     as literal strings, trailing newline. Re-running changes nothing.
//   • hreflang structure is preserved exactly as it is today: every URL gets
//     de-DE pointing at itself, and the homepage additionally gets x-default.
//
// Reads the manifest through the compiled SSR bundle (dist-ssr), so no .mjs
// script parses or transpiles TypeScript. Run `npm run build:ssr` first.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SSR_ENTRY = join(ROOT, 'dist-ssr', 'entry-server.js');
const SITEMAP_PATH = join(ROOT, 'public', 'sitemap.xml');

export function buildSitemap(indexableRoutes, canonicalFor) {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    '',
  ];

  for (const route of indexableRoutes) {
    const loc = canonicalFor(route.path);
    const { lastmod, changefreq, priority, xDefault } = route.sitemap;
    lines.push('  <url>');
    lines.push(`    <loc>${loc}</loc>`);
    lines.push(`    <lastmod>${lastmod}</lastmod>`);
    lines.push(`    <changefreq>${changefreq}</changefreq>`);
    lines.push(`    <priority>${priority}</priority>`);
    lines.push(`    <xhtml:link rel="alternate" hreflang="de-DE" href="${loc}"/>`);
    if (xDefault) {
      lines.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}"/>`);
    }
    lines.push('  </url>');
    lines.push('');
  }

  lines.push('</urlset>');
  return `${lines.join('\n')}\n`;
}

async function loadManifest() {
  if (!existsSync(SSR_ENTRY)) {
    throw new Error(
      `SSR bundle not found at ${SSR_ENTRY}. Run "npm run build:ssr" first — the route ` +
        'manifest reaches Node through the compiled bundle, never by importing src/*.ts.'
    );
  }
  return import(pathToFileURL(SSR_ENTRY).href);
}

async function main() {
  const check = process.argv.includes('--check');
  const { INDEXABLE_ROUTES, PUBLIC_ROUTES, canonicalFor } = await loadManifest();

  const nonIndexable = PUBLIC_ROUTES.filter((r) => !r.indexable);
  const missingSitemapData = INDEXABLE_ROUTES.filter((r) => !r.sitemap);
  if (missingSitemapData.length) {
    throw new Error(
      `Indexable routes without sitemap metadata: ${missingSitemapData.map((r) => r.path).join(', ')}`
    );
  }

  const xml = buildSitemap(INDEXABLE_ROUTES, canonicalFor);

  // Determinism guard: generating twice must produce identical bytes.
  if (buildSitemap(INDEXABLE_ROUTES, canonicalFor) !== xml) {
    throw new Error('Sitemap generation is not deterministic — refusing to write.');
  }

  if (check) {
    const committed = existsSync(SITEMAP_PATH) ? readFileSync(SITEMAP_PATH, 'utf8') : '';
    if (committed !== xml) {
      console.error(
        '\n✗ public/sitemap.xml is out of date with src/lib/routing/publicRoutes.ts.\n' +
          '  Run: npm run build:ssr && npm run sitemap\n'
      );
      process.exit(1);
    }
    console.log(
      `✓ public/sitemap.xml is current (${INDEXABLE_ROUTES.length} indexable URLs; ` +
        `${nonIndexable.length} non-indexable route(s) correctly excluded).`
    );
    return;
  }

  writeFileSync(SITEMAP_PATH, xml, 'utf8');
  console.log(
    `✓ public/sitemap.xml written: ${INDEXABLE_ROUTES.length} URLs, ` +
      `${nonIndexable.length} non-indexable route(s) excluded (${nonIndexable
        .map((r) => r.path)
        .join(', ') || 'none'}).`
  );
}

main().catch((error) => {
  console.error(`\n✗ Sitemap generation failed: ${error.message}`);
  process.exit(1);
});
