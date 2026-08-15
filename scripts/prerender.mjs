#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Build-time prerendering.
//
// Runs AFTER `vite build` (client -> dist/) and `vite build --ssr` (-> dist-ssr/).
// For every route in the manifest it renders real HTML and rewrites the <head>,
// so public pages carry meaningful content and page-specific metadata with no
// client-side JavaScript. src/main.tsx already hydrates when #root has children.
//
// ATOMICITY: nothing is written until EVERY route has rendered and validated.
// Renders are collected in memory first; any failure — timeout, rejected lazy
// import, incomplete stream, missing metadata, malformed output — throws and
// the build fails with dist/ untouched by this script. A partially generated
// site is never produced and therefore never deployed.
//
// ISOLATION: this script only ever WRITES into dist/. The SSR bundle lives in
// dist-ssr/ and is built with its own outDir so it can neither empty dist/ nor
// copy public assets into it.
//
// Private surfaces (/app, /admin, /owner, /auth, /d) are never rendered here:
// they must keep hitting the SPA fallback with their auth guards intact.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const SSR_ENTRY = join(ROOT, 'dist-ssr', 'entry-server.js');
const TEMPLATE_PATH = join(DIST, 'index.html');
const ROOT_MARKER = '<div id="root"></div>';
const PER_ROUTE_TIMEOUT_MS = 30_000;
/** SPA fallback document for private routes. Must match public/_redirects. */
const SHELL_FILE = 'app-shell.html';

/** Private prefixes that must never receive prerendered HTML. */
const PRIVATE_PREFIXES = ['/app', '/admin', '/owner', '/auth', '/d'];

// ─── escaping ────────────────────────────────────────────────────────────────
// Injected metadata is German marketing copy full of &, –, quotes and umlauts.
// Attribute values and text nodes need different (overlapping) escapes; both are
// applied strictly rather than trusting the source strings.
const escapeAttr = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const escapeText = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ─── head rewriting ──────────────────────────────────────────────────────────
// Each helper REPLACES an existing tag from index.html and asserts it did so.
// A silently missed replacement would leave the homepage's metadata on another
// page — exactly the soft-duplicate this gate exists to remove — so a miss is a
// hard failure, never a warning.
// NOTE on the `() => replacement` replacers below: String.replace interprets
// `$&`, "$`", `$'` and `$$` inside a replacement STRING. Rendered German copy and
// JSON-LD are arbitrary text, so a literal `$&` in a page title or in the
// rendered body would be silently rewritten into the matched text. Passing a
// function makes the replacement literal.
function replaceOnce(html, pattern, replacement, label, routePath) {
  const matches = html.match(pattern);
  if (!matches) {
    throw new Error(`Prerender ${routePath}: expected to rewrite ${label}, found no match`);
  }
  return html.replace(pattern, () => replacement);
}

function replaceAll(html, pattern, replacement) {
  return html.replace(pattern, () => replacement);
}

function buildHead(html, route, canonical) {
  const p = route.path;
  const title = escapeText(route.title);
  const titleAttr = escapeAttr(route.title);
  const descriptionAttr = escapeAttr(route.description);
  const canonicalAttr = escapeAttr(canonical);
  const robots = route.indexable
    ? 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
    : 'noindex, nofollow';

  let out = html;
  out = replaceOnce(out, /<title>[\s\S]*?<\/title>/, `<title>${title}</title>`, '<title>', p);
  out = replaceOnce(
    out,
    /<meta name="description" content="[^"]*" \/>/,
    `<meta name="description" content="${descriptionAttr}" />`,
    'meta description',
    p
  );
  out = replaceOnce(
    out,
    /<meta name="robots" content="[^"]*" \/>/,
    `<meta name="robots" content="${robots}" />`,
    'meta robots',
    p
  );
  out = replaceOnce(
    out,
    /<link rel="canonical" href="[^"]*" \/>/,
    `<link rel="canonical" href="${canonicalAttr}" />`,
    'link canonical',
    p
  );
  out = replaceAll(
    out,
    /<link rel="alternate" hreflang="de-DE" href="[^"]*" \/>/g,
    `<link rel="alternate" hreflang="de-DE" href="${canonicalAttr}" />`
  );
  out = replaceAll(
    out,
    /<link rel="alternate" hreflang="x-default" href="[^"]*" \/>/g,
    `<link rel="alternate" hreflang="x-default" href="${canonicalAttr}" />`
  );

  const metaRewrites = [
    [/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${canonicalAttr}" />`],
    [/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${titleAttr}" />`],
    [
      /<meta property="og:description" content="[^"]*" \/>/,
      `<meta property="og:description" content="${descriptionAttr}" />`,
    ],
    [
      /<meta property="og:image:alt" content="[^"]*" \/>/,
      `<meta property="og:image:alt" content="${titleAttr}" />`,
    ],
    [/<meta name="twitter:url" content="[^"]*" \/>/, `<meta name="twitter:url" content="${canonicalAttr}" />`],
    [/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${titleAttr}" />`],
    [
      /<meta name="twitter:description" content="[^"]*" \/>/,
      `<meta name="twitter:description" content="${descriptionAttr}" />`,
    ],
    [
      /<meta name="twitter:image:alt" content="[^"]*" \/>/,
      `<meta name="twitter:image:alt" content="${titleAttr}" />`,
    ],
  ];
  for (const [pattern, replacement] of metaRewrites) {
    out = replaceOnce(out, pattern, replacement, pattern.source.slice(0, 48), p);
  }

  if (route.keywords) {
    out = replaceOnce(
      out,
      /<meta name="keywords" content="[^"]*" \/>/,
      `<meta name="keywords" content="${escapeAttr(route.keywords)}" />`,
      'meta keywords',
      p
    );
  }

  return out;
}

// ─── per-route validation ────────────────────────────────────────────────────
function validate(page, route, canonical, homeCanonical) {
  const p = route.path;
  const fail = (msg) => {
    throw new Error(`Prerender ${p}: ${msg}`);
  };

  // Greedy on purpose: the rendered tree contains many </div>, so the container
  // is closed by the LAST one before </body>.
  const rootMatch = page.match(/<div id="root">([\s\S]*)<\/div>\s*<\/body>/);
  if (!rootMatch) fail('could not locate the rendered #root container in the output');
  const body = rootMatch[1];
  if (body.trim().length < 500) {
    fail(`rendered body is only ${body.trim().length} chars — page did not render meaningful HTML`);
  }

  const title = page.match(/<title>([\s\S]*?)<\/title>/);
  if (!title || !title[1].trim()) fail('empty <title>');
  if (title[1] !== escapeText(route.title)) fail('title does not match the manifest');

  const description = page.match(/<meta name="description" content="([^"]*)"/);
  if (!description || !description[1].trim()) fail('empty meta description');

  const canonicalTag = page.match(/<link rel="canonical" href="([^"]*)"/);
  if (!canonicalTag) fail('no canonical link');
  if (canonicalTag[1] !== escapeAttr(canonical)) fail('canonical does not match the manifest');
  if (p !== '/' && canonicalTag[1] === homeCanonical) {
    fail('inherited the homepage canonical');
  }

  const robots = page.match(/<meta name="robots" content="([^"]*)"/);
  if (!robots) fail('no robots meta');
  if (route.indexable && robots[1].startsWith('noindex')) fail('indexable route emitted noindex');
  if (!route.indexable && !robots[1].startsWith('noindex')) fail('non-indexable route is missing noindex');

  if (page.includes(ROOT_MARKER)) fail('the empty root marker survived — nothing was injected');
}

// ─── main ────────────────────────────────────────────────────────────────────
async function main() {
  if (!existsSync(SSR_ENTRY)) {
    throw new Error(`SSR bundle not found at ${SSR_ENTRY}. Run "npm run build:ssr" first.`);
  }
  if (!existsSync(TEMPLATE_PATH)) {
    throw new Error(`Client build not found at ${TEMPLATE_PATH}. Run "vite build" first.`);
  }

  const { PUBLIC_ROUTES, canonicalFor, render } = await import(pathToFileURL(SSR_ENTRY).href);

  // Immutable template. Read exactly once, never mutated; every route starts
  // from this same string, so no route can inherit another route's metadata.
  const TEMPLATE = Object.freeze({ html: readFileSync(TEMPLATE_PATH, 'utf8') });

  const markerCount = TEMPLATE.html.split(ROOT_MARKER).length - 1;
  if (markerCount !== 1) {
    throw new Error(
      `Expected exactly one "${ROOT_MARKER}" injection point in dist/index.html, found ${markerCount}.`
    );
  }

  const leaked = PUBLIC_ROUTES.filter((r) =>
    PRIVATE_PREFIXES.some((prefix) => r.path === prefix || r.path.startsWith(`${prefix}/`))
  );
  if (leaked.length) {
    throw new Error(`Private paths present in the public manifest: ${leaked.map((r) => r.path).join(', ')}`);
  }

  const dynamic = PUBLIC_ROUTES.filter((r) => r.path.includes(':') || r.path.includes('*'));
  if (dynamic.length) {
    throw new Error(`Manifest paths must be concrete URLs, found patterns: ${dynamic.map((r) => r.path).join(', ')}`);
  }

  const homeCanonical = escapeAttr(canonicalFor('/'));

  // ── phase 1: render everything into memory (nothing written yet) ──
  const rendered = [];
  for (const route of PUBLIC_ROUTES) {
    const { html: body } = await render(route.path, PER_ROUTE_TIMEOUT_MS);
    if (!body || !body.trim()) {
      throw new Error(`Prerender ${route.path}: renderer returned an empty document`);
    }

    const canonical = canonicalFor(route.path);
    let page = buildHead(TEMPLATE.html, route, canonical);
    page = page.replace(ROOT_MARKER, () => `<div id="root">${body}</div>`);

    validate(page, route, canonical, homeCanonical);

    const outDir = route.path === '/' ? DIST : join(DIST, route.path);
    rendered.push({ path: route.path, outDir, file: join(outDir, 'index.html'), page });
  }

  // ── phase 1b: the 404 document ──
  // Rendered from an unrouted path so React Router resolves the real
  // NotFoundPage. It must never look indexable and never carry the homepage
  // canonical, so it gets an explicit noindex head and no canonical at all.
  // Rendered at "/404" rather than a synthetic marker path: NotFoundPage prints
  // the current pathname, and whatever we render here is frozen into the static
  // document that Netlify serves for every unknown URL. "/404" is honest about
  // what the document is; the client corrects it to the real URL on hydration.
  const NOT_FOUND_PATH = '/404';
  const { html: notFoundBody } = await render(NOT_FOUND_PATH, PER_ROUTE_TIMEOUT_MS);
  if (!notFoundBody.includes('404')) {
    throw new Error('Prerender 404: rendered document does not contain the 404 page content');
  }
  let notFound = buildHead(
    TEMPLATE.html,
    {
      path: '/404',
      title: 'Seite nicht gefunden (404) | Cogniiq',
      description:
        'Diese Seite existiert nicht. Die URL wurde möglicherweise geändert oder entfernt. Zurück zur Startseite oder direkt zu unseren Leistungen.',
      indexable: false,
    },
    // A 404 document has no canonical address of its own. The tag is removed
    // below; this placeholder only satisfies the shared head builder.
    'about:blank'
  );
  notFound = notFound
    .replace(/\s*<link rel="canonical" href="[^"]*" \/>/, '')
    .replace(/\s*<link rel="alternate" hreflang="de-DE" href="[^"]*" \/>/g, '')
    .replace(/\s*<link rel="alternate" hreflang="x-default" href="[^"]*" \/>/g, '')
    .replace(/\s*<meta property="og:url" content="[^"]*" \/>/, '')
    .replace(/\s*<meta name="twitter:url" content="[^"]*" \/>/, '')
    .replace(ROOT_MARKER, () => `<div id="root">${notFoundBody}</div>`);

  if (/rel="canonical"/.test(notFound)) throw new Error('Prerender 404: canonical link survived');
  if (!/content="noindex/.test(notFound)) throw new Error('Prerender 404: missing noindex');
  if (notFound.includes(ROOT_MARKER)) throw new Error('Prerender 404: nothing was injected');

  rendered.push({ path: '/404.html', outDir: DIST, file: join(DIST, '404.html'), page: notFound });

  // ── phase 1c: the private SPA shell ──
  // Private routes (/app, /admin, /owner, /auth, /d) must NOT fall back to
  // dist/index.html any more: that file is now the prerendered HOMEPAGE, so the
  // customer portal would serve marketing markup carrying the homepage canonical
  // and an indexable robots tag, and would then throw all of it away on
  // hydration. They fall back to this document instead: the untouched client
  // template with an empty #root — exactly the shell the SPA expects — marked
  // noindex and stripped of every public URL claim.
  let shell = TEMPLATE.html
    .replace(/<title>[\s\S]*?<\/title>/, '<title>Cogniiq</title>')
    .replace(/<meta name="robots" content="[^"]*" \/>/, '<meta name="robots" content="noindex, nofollow, noarchive" />')
    .replace(/\s*<link rel="canonical" href="[^"]*" \/>/, '')
    .replace(/\s*<link rel="alternate" hreflang="[^"]*" href="[^"]*" \/>/g, '')
    .replace(/\s*<meta property="og:url" content="[^"]*" \/>/, '')
    .replace(/\s*<meta name="twitter:url" content="[^"]*" \/>/, '');

  if (!shell.includes(ROOT_MARKER)) throw new Error('Private SPA shell lost its empty #root marker');
  if (/rel="canonical"/.test(shell)) throw new Error('Private SPA shell still carries a canonical link');
  if (!/content="noindex/.test(shell)) throw new Error('Private SPA shell is not noindex');

  rendered.push({ path: SHELL_FILE, outDir: DIST, file: join(DIST, SHELL_FILE), page: shell });

  // ── phase 2: commit to disk (all-or-nothing) ──
  for (const item of rendered) {
    mkdirSync(item.outDir, { recursive: true });
    writeFileSync(item.file, item.page, 'utf8');
  }

  // Ground truth for .github/scripts/test-prerender-output.mjs, so the verifier
  // can check dist/ without needing the SSR bundle (which the build removes).
  // Untracked and gitignored: it is a build artifact, not a source of truth.
  writeFileSync(
    join(ROOT, 'prerender-report.json'),
    `${JSON.stringify(
      {
        routes: PUBLIC_ROUTES.map((r) => ({
          path: r.path,
          indexable: r.indexable,
          canonical: canonicalFor(r.path),
          title: r.title,
          file: join('dist', r.path === '/' ? '' : r.path, 'index.html'),
        })),
        notFound: 'dist/404.html',
      privateShell: `dist/${SHELL_FILE}`,
      },
      null,
      2
    )}\n`,
    'utf8'
  );

  const indexable = PUBLIC_ROUTES.filter((r) => r.indexable).length;
  console.log(
    `✓ Prerendered ${PUBLIC_ROUTES.length} public routes ` +
      `(${indexable} indexable, ${PUBLIC_ROUTES.length - indexable} noindex) ` +
      `+ dist/404.html + dist/${SHELL_FILE} (private SPA fallback)`
  );
}

main().catch((error) => {
  console.error(`\n✗ Prerender failed: ${error.message}`);
  console.error('  dist/ was not modified by this step. The build must not be deployed.');
  process.exit(1);
});
