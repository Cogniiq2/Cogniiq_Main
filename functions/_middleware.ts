// The private-route contract — which prefixes are private, which documents
// serve them, and what makes a served document valid — lives in one place and
// is shared with scripts/prerender.mjs and the regression test. Pages Functions
// are bundled with esbuild, so importing from outside functions/ is resolved at
// build time.
import {
  NOT_FOUND_DOCUMENT,
  PRIVATE_PREFIXES,
  PRIVATE_SHELL,
  describeDocumentProblem,
} from '../scripts/lib/private-routing.mjs';

interface CloudflarePagesContext {
  request: Request;
  next: () => Promise<Response>;
  env: {
    ASSETS: {
      fetch: (request: Request) => Promise<Response>;
    };
  };
}

/** Follows the .html -> pretty-path canonicalisation instead of returning it. */
async function fetchDocument(context: CloudflarePagesContext, path: string): Promise<Response> {
  let response = await context.env.ASSETS.fetch(
    new Request(new URL(path, context.request.url).toString(), { method: 'GET' })
  );
  for (let hop = 0; hop < 3 && response.status >= 300 && response.status < 400; hop += 1) {
    const location = response.headers.get('location');
    if (!location) break;
    response = await context.env.ASSETS.fetch(
      new Request(new URL(location, context.request.url).toString(), { method: 'GET' })
    );
  }
  return response;
}

export async function onRequest(context: CloudflarePagesContext) {
  const url = new URL(context.request.url);
  let pathname = url.pathname;

  // ============================================================
  // CRITICAL GUARD: never process file/asset requests.
  //
  // Any path with a file extension (.js, .css, .png, .xml, ...)
  // or under /assets/ is passed through UNTOUCHED:
  //  - reading them via response.text() corrupts binary files
  //  - converting their 404s into index.html-with-200 poisons
  //    browser/edge caches and breaks ES module loading
  //    ("Expected JavaScript but got text/plain" white pages)
  //  - a missing hashed chunk MUST return a real 404 so the
  //    client-side vite:preloadError handler can recover
  // ============================================================
  const isFileRequest = /\.[a-zA-Z0-9]+$/.test(pathname);
  if (isFileRequest || pathname.startsWith('/assets/')) {
    return context.next();
  }

  if (pathname !== '/' && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }

  // /owner, /auth and /d used to be missing here, so the tokenized customer
  // document portal was neither marked noindex nor given the private shell.
  const isPrivateSurface = PRIVATE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // No per-route metadata lives here any more. Every public route is
  // prerendered by scripts/prerender.mjs with the <title>, description,
  // canonical, hreflang and OG/Twitter tags from src/lib/routing/publicRoutes.ts,
  // so the document Pages serves already carries the right head. This function
  // used to keep a second copy of that metadata and rewrite the head at the
  // edge; the copy drifted from the manifest (5 titles, 25 descriptions) and
  // silently overrode the prerendered values — including two frozen search
  // experiments — on every Cloudflare Pages request. The prerendered document
  // is the single source of truth; the middleware only decides which document
  // (page, 404, private shell) is served and with which status/headers.
  let response = await context.next();
  let status = 200;

  // ============================================================
  // Fallback for extension-less route paths that matched no file.
  // Asset 404s never reach this point — they returned real 404s above.
  //
  //  - private routes  -> /app-shell, 200 (empty #root, noindex)
  //  - anything else   -> /404, a REAL 404, never a soft 404 at 200
  //
  // Both are PRETTY paths. This used to fetch /index.html — the prerendered
  // marketing homepage — which would have hydrated homepage markup against a
  // tree rendered for /admin/finance or /d/<token>. It is also why the physical
  // filenames are never used: Cloudflare canonicalises an .html path to its
  // extension-less form with a bodyless 3xx, and this middleware forced every
  // response to status 200, so that empty body became a ~0.3 KB document with
  // no <script> and a permanently white page. fetchDocument() follows the
  // canonicalisation, and describeDocumentProblem() below refuses to serve
  // anything that is not a complete document.
  // ============================================================
  // In normal operation Cloudflare Pages answers the private routes from the
  // /app-shell rewrite in public/_redirects before this Function runs at all;
  // this branch is what serves them if that rule is ever missing.
  //
  // A redirect is a real answer. Reading its (empty) body and re-emitting it at
  // 200 is what produced the blank, script-less document; pass it through.
  if (response.status >= 300 && response.status < 400) {
    return response;
  }

  if (response.status === 404) {
    status = isPrivateSurface ? 200 : 404;
    response = await fetchDocument(context, isPrivateSurface ? PRIVATE_SHELL : NOT_FOUND_DOCUMENT);
  }

  let html = await response.text();

  // Assert the document is actually usable BEFORE committing to a status. A
  // failed or redirected asset lookup must surface as an error, never as a
  // blank 200 that the browser renders as a white page.
  const problem = describeDocumentProblem(
    { ok: response.ok, status: response.status, contentType: response.headers.get('content-type') },
    html,
    isPrivateSurface
  );
  if (problem) {
    return new Response(
      `Cogniiq: cannot serve ${isPrivateSurface ? 'the application shell' : 'this page'} — ${problem}.`,
      {
        status: 500,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
          'X-Cogniiq-Shell-Error': problem,
        },
      }
    );
  }

  // ============================================================
  // Cache semantics for HTML (the pointer to hashed assets):
  //  - HTML must ALWAYS revalidate, otherwise stale HTML keeps
  //    referencing chunk hashes deleted by newer deployments
  //    -> white pages after every deploy.
  //  - Hashed assets under /assets/ keep Cloudflare Pages'
  //    default immutable long-term caching (handled above by
  //    passing them through untouched).
  // ============================================================
  const headers = new Headers(response.headers);
  headers.set('Content-Type', 'text/html; charset=utf-8');
  headers.set('Cache-Control', 'no-cache');

  if (isPrivateSurface) {
    headers.set('X-Robots-Tag', 'noindex, nofollow');
    html = html.replace(
      /<title>[^<]*<\/title>/,
      pathname.startsWith('/admin') ? '<title>Cogniiq Admin</title>' : '<title>Cogniiq Kundenbereich</title>'
    );
    html = html.replace(/(<meta\s+name="robots"\s+content=")[^"]*/i, '$1noindex, nofollow');

    return new Response(html, {
      status,
      headers,
    });
  }

  return new Response(html, {
    status,
    headers,
  });
}
