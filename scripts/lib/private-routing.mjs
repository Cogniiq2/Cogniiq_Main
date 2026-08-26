// ─────────────────────────────────────────────────────────────────────────────
// The private-route contract, in one place.
//
// Imported by:
//   scripts/prerender.mjs                     (which routes never get prerendered)
//   functions/_middleware.ts                  (the deployed Cloudflare Pages Function)
//   .github/scripts/test-pages-routing.mjs    (the regression test)
//
// Pages Functions are bundled with esbuild, so importing from outside functions/
// is resolved at build time.
//
// Platform-neutral on purpose: no Request, no Response, no env. It states which
// paths are private, which documents serve them, and what makes a served
// document valid.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Route families that are client-routed and auth-guarded, and therefore have no
 * prerendered HTML of their own. public/_redirects rewrites each of these (and
 * its /* deep paths) to PRIVATE_SHELL, and public/_headers marks them noindex.
 * .github/scripts/test-pages-routing.mjs asserts all four stay in agreement.
 */
export const PRIVATE_PREFIXES = ['/app', '/admin', '/owner', '/auth', '/d'];

/**
 * The clean, empty-root SPA shell — addressed by its PRETTY path.
 *
 * NEVER '/app-shell.html'. Cloudflare Pages canonicalises an .html path to its
 * extension-less form with a bodyless 3xx redirect. A _redirects rule pointing
 * at the physical filename therefore did not serve the shell at all: it
 * returned a 0-byte 307, which functions/_middleware.ts re-emitted at HTTP 200,
 * so the browser received a ~0.3 KB document with no <script> and fetched no
 * application JavaScript at all — a permanently white private deep link.
 */
export const PRIVATE_SHELL = '/app-shell';

/** The physical file behind PRIVATE_SHELL, written by scripts/prerender.mjs. */
export const PRIVATE_SHELL_FILE = 'app-shell.html';

/** The real 404 document, served with a real 404 status. Pretty path, as above. */
export const NOT_FOUND_DOCUMENT = '/404';

/** Trailing slashes are a URL variant, not a different route. '/' is kept. */
export function normalizePathname(pathname) {
  if (pathname !== '/' && pathname.endsWith('/')) return pathname.replace(/\/+$/, '') || '/';
  return pathname;
}

/** Is this one of the private, client-routed surfaces? */
export function isPrivateRoute(pathname) {
  const path = normalizePathname(pathname);
  return PRIVATE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

/**
 * Why `html` is NOT a usable document, or null when it is fine.
 *
 * An unsuccessful asset lookup must never be laundered into a blank 200. The
 * caller asserts with this BEFORE committing to a status, and answers with an
 * explicit error when it returns a reason — a failure that is visible in logs
 * and to monitoring, rather than silently as a white page.
 *
 * @param {{ ok: boolean, status: number, contentType: string|null }} response
 * @param {string} html
 * @param {boolean} requireEmptyRoot true when the document must be the SPA shell
 * @returns {string|null}
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
