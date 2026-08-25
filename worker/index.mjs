// ─────────────────────────────────────────────────────────────────────────────
// Cloudflare Worker entry point for the Workers-Assets deployment.
//
// ── When this runs ──────────────────────────────────────────────────────────
// wrangler.jsonc sets `not_found_handling: "none"`, so Workers Assets serves any
// request that matches a file in dist/ directly from the edge and only invokes
// this Worker when NOTHING matched. That ordering is what keeps the fix small:
//
//   /                     -> dist/index.html          (asset, prerendered home)
//   /leistungen           -> dist/leistungen.html     (asset, prerendered)
//   /assets/index-*.js    -> dist/assets/...          (asset, immutable)
//   /admin/finance        -> no asset -> THIS WORKER -> dist/app-shell.html 200
//   /d/<token>            -> no asset -> THIS WORKER -> dist/app-shell.html 200
//   /voellig-unbekannt    -> no asset -> THIS WORKER -> dist/404.html      404
//
// Public prerendering, private deep links and real 404s are therefore all
// preserved, and no route is ever answered with the homepage at HTTP 200.
//
// ── What this replaces ──────────────────────────────────────────────────────
// `not_found_handling: "single-page-application"`, which answered every one of
// those unmatched paths with the CONTENTS of dist/index.html — the prerendered
// marketing homepage — so the private application never mounted on any deep
// link. See worker/routing.mjs for why that is fatal rather than merely wrong.
//
// public/_redirects cannot express this on Workers Assets: its rewrite ("200")
// rules are a Netlify/Pages feature and are not applied there, which is exactly
// how the /app-shell.html rules came to be silently inert in production. The
// file is kept for the Netlify build, and this Worker makes the Cloudflare
// deployment stop depending on it.
// ─────────────────────────────────────────────────────────────────────────────
import { PRIVATE_SHELL_HEADERS, resolveUnmatchedRequest } from './routing.mjs';

export default {
  /**
   * @param {Request} request
   * @param {{ ASSETS: { fetch: (request: Request) => Promise<Response> } }} env
   */
  async fetch(request, env) {
    const url = new URL(request.url);
    const decision = resolveUnmatchedRequest(url.pathname);

    // A missing hashed chunk stays a real, bodyless 404 so that the
    // `vite:preloadError` recovery in src/main.tsx sees a genuine failure.
    if (decision.kind === 'asset-not-found') {
      return new Response(null, { status: 404 });
    }

    const document = await env.ASSETS.fetch(
      new Request(new URL(decision.document, url.origin), { method: 'GET' })
    );

    // The shell/404 document is expected to exist: the build writes both and
    // .github/scripts/test-deployment-routing.mjs fails the build if it does
    // not. Degrade to a bare status rather than to the homepage if it is gone.
    if (!document.ok) {
      return new Response(null, { status: decision.status });
    }

    const headers = new Headers(document.headers);
    if (decision.kind === 'private-shell') {
      for (const [name, value] of Object.entries(PRIVATE_SHELL_HEADERS)) {
        headers.set(name, value);
      }
    } else {
      headers.set('Content-Type', 'text/html; charset=utf-8');
      headers.set('Cache-Control', 'no-cache, must-revalidate');
      headers.set('X-Robots-Tag', 'noindex, nofollow');
    }

    return new Response(request.method === 'HEAD' ? null : document.body, {
      status: decision.status,
      headers,
    });
  },
};
