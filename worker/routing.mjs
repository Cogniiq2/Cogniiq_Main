// ─────────────────────────────────────────────────────────────────────────────
// THE deployment routing decision, in one place.
//
// This module is the single source of truth for what a request that matched no
// static file in dist/ must receive. It is imported by:
//
//   worker/index.mjs                          the deployed Cloudflare Worker
//   .github/scripts/lib/cloudflare-server.mjs the local model of that Worker
//
// so the regression test can never drift from the thing it is asserting.
//
// It is deliberately platform-free: no Request, no Response, no env. Given a
// pathname it returns which document to serve and with what status.
//
// ── Which defect was which ──────────────────────────────────────────────────
// The production white pages on cogniiq.de were NOT caused by the fallback
// described below. That deployment is Cloudflare Pages, which ignores
// wrangler.jsonc. Its cause was public/_redirects pointing the private routes
// at "/app-shell.html": Pages canonicalised the .html target to a bodyless 307,
// and functions/_middleware.ts re-emitted that empty body at status 200, so the
// browser received a ~0.3 KB document with no <script> and fetched no JS at
// all. That is fixed in public/_redirects and functions/_middleware.ts.
//
// What follows is why the WORKERS ASSETS fallback would be wrong too, so a
// future migration onto that platform cannot trade one blank page for another.
//
// ── Why this exists ─────────────────────────────────────────────────────────
// dist/index.html is the PRERENDERED MARKETING HOMEPAGE: its #root is full of
// server-rendered homepage markup and its <head> carries the homepage canonical
// and an indexable robots tag. src/main.tsx branches on that markup — it calls
// hydrateRoot() when #root has children and createRoot() when it does not.
//
// Serving index.html for a private deep link therefore does not merely show the
// wrong metadata. React is asked to hydrate homepage markup against a tree
// rendered for /admin/finance or /d/<token>, with only the homepage's chunks
// preloaded. Reproduced in a real browser against a production build, the
// private application never mounts: the visitor is left looking at the
// marketing homepage, with React #418 in the console; and because the route's
// own Suspense boundary is still dehydrated when the auth context publishes its
// first update, slower chunk delivery instead discards the whole tree (#421)
// and paints nothing. Both outcomes are the same defect.
//
// The private surfaces must instead receive dist/app-shell.html: the untouched
// client template, empty #root, noindex — which makes main.tsx take the
// createRoot() branch and mount cleanly with no server markup to reconcile.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Route families that are client-routed and auth-guarded, and therefore have no
 * prerendered HTML of their own. Must stay in step with:
 *   scripts/prerender.mjs   PRIVATE_PREFIXES
 *   public/_redirects       the /app-shell.html rewrite rules
 *   public/_headers         the noindex / no-cache blocks
 *   functions/_middleware.ts
 * .github/scripts/test-deployment-routing.mjs asserts that agreement.
 */
export const PRIVATE_PREFIXES = ['/app', '/admin', '/owner', '/auth', '/d'];

/**
 * The clean, empty-root SPA shell. NEVER index.html.
 *
 * Addressed by its PRETTY path, with no .html extension. Cloudflare
 * canonicalises an .html path to its extension-less form with a 3xx redirect,
 * so asking the asset store for "/app-shell.html" yields a BODYLESS REDIRECT
 * rather than the document — which, re-emitted at status 200, is precisely the
 * ~0.3 KB script-less white page this whole module exists to prevent.
 */
export const PRIVATE_SHELL = '/app-shell';

/** The real 404 document, served with a real 404 status. Pretty path, as above. */
export const NOT_FOUND_DOCUMENT = '/404';

/** The physical files behind those pretty paths, for build-time assertions. */
export const DOCUMENT_FILES = { '/app-shell': 'app-shell.html', '/404': '404.html' };

/**
 * Why `html` is NOT a usable document, or null when it is fine. Shared by the
 * Worker and the Pages middleware: an unsuccessful asset lookup must never be
 * laundered into a blank 200.
 */
export function describeDocumentProblem({ ok, status, contentType }, html, requireEmptyRoot) {
  if (!ok) return `asset lookup returned HTTP ${status}`;
  if (contentType && !/^text\/html/i.test(contentType)) return `asset is ${contentType}, not HTML`;
  if (!/<html[\s>]/i.test(html)) return 'asset body is not an HTML document';
  if (requireEmptyRoot && !html.includes('<div id="root"></div>')) {
    return 'shell has no empty <div id="root"></div>';
  }
  if (!/<script[^>]+src="\/assets\/[^"]+\.js"/.test(html)) {
    return 'document references no Vite entry script';
  }
  return null;
}

/** Trailing slashes are a URL variant, not a different route. "/" is kept. */
export function normalizePathname(pathname) {
  if (pathname !== '/' && pathname.endsWith('/')) return pathname.replace(/\/+$/, '') || '/';
  return pathname;
}

/**
 * A request for a file, not a page: anything under /assets/ or with an
 * extension. A missing hashed chunk MUST stay a real, bodyless 404 so Vite's
 * `vite:preloadError` handler in src/main.tsx can recover. Answering it with an
 * HTML document is how "Expected a JavaScript module but the server responded
 * with text/html" white pages happen.
 */
export function isAssetRequest(pathname) {
  return pathname.startsWith('/assets/') || /\.[a-zA-Z0-9]+$/.test(pathname);
}

/** Is this one of the private, client-routed surfaces? */
export function isPrivateRoute(pathname) {
  const path = normalizePathname(pathname);
  return PRIVATE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

/**
 * What an unmatched request must receive.
 *
 * Only ever called when dist/ held no matching static file — every public route
 * is prerendered to disk and is served before this runs.
 *
 * @returns {{ kind: 'private-shell'|'not-found-document'|'asset-not-found',
 *             document: string|null, status: number }}
 */
export function resolveUnmatchedRequest(pathname) {
  const path = normalizePathname(pathname);

  if (isAssetRequest(path)) {
    return { kind: 'asset-not-found', document: null, status: 404 };
  }

  if (isPrivateRoute(path)) {
    return { kind: 'private-shell', document: PRIVATE_SHELL, status: 200 };
  }

  // An unknown public URL is a real 404. It must never be answered with the
  // homepage at HTTP 200 — that turns the entire unknown URL space into a soft
  // 404 and lets any typo'd URL be indexed as a duplicate homepage.
  return { kind: 'not-found-document', document: NOT_FOUND_DOCUMENT, status: 404 };
}

/** Response headers every private shell response carries, whoever serves it. */
export const PRIVATE_SHELL_HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  // The shell names content-hashed chunks that a deploy renames. It must always
  // revalidate, or a cached shell asks for a filename that no longer exists.
  'Cache-Control': 'no-cache, must-revalidate',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
};
