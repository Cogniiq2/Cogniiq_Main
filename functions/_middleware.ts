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

  // ===========================================================================
  // FROZEN-EXPERIMENT HEAD OVERRIDES — the only per-route <head> data left here.
  //
  // Until 2026-09-12 this Function carried a 560-line copy of every route's
  // title, description, canonical and keywords and rewrote the prerendered
  // <head> with it on every request. That copy was a second source of truth for
  // facts the route manifest already owns, and it had drifted on 29 of 86 shared
  // routes — so the value a crawler read was the stale edge copy, not the
  // reviewed manifest value. Among the suppressed values were claim corrections
  // (BOOKING_WRITE, blanket "DSGVO-konform", "kein Anruf geht verloren") and two
  // titles whose search experiments therefore never reached a crawler at all.
  //
  // The table is gone rather than merely corrected. scripts/prerender.mjs writes
  // the head from the manifest AND validates it per route (title, description,
  // canonical, robots), with proper HTML escaping that this Function's raw string
  // interpolation never had. Rewriting that output at the edge could only drift
  // from it again. Same direction of truth as src/lib/routing/routeMetadata.ts,
  // which removed the third copy (the one in the page components) for the same
  // reason: the manifest wins, never the consumer.
  //
  // What remains below is a deliberate, shrinking exception. A route running a
  // frozen search experiment is measured against the bytes a crawler has been
  // receiving, and for these routes that is the edge value, not the manifest
  // value. Aligning them would silently restart a running measurement, so the
  // delivered bytes are held until the experiment is evaluated. Every key MUST
  // be in PROTECTED_EXPERIMENT_PATHS, and the map MUST be emptied when the last
  // experiment graduates — both asserted in .github/scripts/test-seo-consistency.mjs.
  //
  // WHY EVERY FROZEN ROUTE IS STILL NAMED IN THIS FILE
  //
  // The freeze rule (.claude/rules/seo-public-site.md) counts how many places in
  // the source tree mention a protected path, comments included — removing a
  // mention is itself a change to a frozen route. Each of the five is therefore
  // still named here, now stating what this Function does to its head instead of
  // carrying a copy of it. That is also the fact a future reader needs: whether
  // what a crawler receives for that route is the manifest value or a held one.
  //
  //   /bayreuth/webdesign ........... edge and manifest already agreed before the
  //                                   table was removed, so nothing is held and
  //                                   the delivered head is unchanged.
  //   /regensburg/website-relaunch .. same: the two values were identical.
  //   /muenchen/webdesign-kosten .... same: the two values were identical.
  //   /ki-telefonassistent-arzt ..... same, and expected — its head was aligned
  //                                   in both files by the claim-integrity fix of
  //                                   2026-09-11.
  //   /bayreuth/website-relaunch .... the one that DIVERGED. Held below.
  //
  // Verified route by route on 2026-09-12 against the removed table: the only
  // divergence among the five was the title of the relaunch route in Bayreuth.
  // /bayreuth/webdesign, /muenchen/webdesign-kosten, /regensburg/website-relaunch
  // and /ki-telefonassistent-arzt were byte-identical on both sides, which is why
  // dropping the table changes nothing a crawler sees for them.
  //
  // The held one: the manifest carries the 2026-08-29 "Performance & bessere
  // Rankings" title experiment, while the edge has been serving the older "Alte
  // Website modernisieren" throughout — so that experiment has never actually
  // reached a crawler. Aligning it now would start it, not continue it. Recorded
  // in docs/seo/post-experiment-opportunities.md; the owner decides whether to
  // ship it (a deliberate reset) or void it. Until then this route's SERP snippet
  // does not move.
  // ===========================================================================
  const frozenHeadOverrides: Record<string, { title?: string; description?: string }> = {
    '/bayreuth/website-relaunch': {
      title: 'Website Relaunch Bayreuth – Alte Website modernisieren | Cogniiq',
    },
  };

  const frozenHead = frozenHeadOverrides[pathname];

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

  // The prerendered head is already the manifest's, validated per route by
  // scripts/prerender.mjs. Serve it untouched unless this route is holding a
  // frozen experiment's delivered bytes.
  if (!frozenHead) {
    return new Response(html, {
      status,
      headers,
    });
  }

  if (frozenHead.title) {
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${frozenHead.title}</title>`);
    html = html.replace(/(<meta\s+property="og:title"\s+content=")[^"]*/i, `$1${frozenHead.title}`);
    html = html.replace(/(<meta\s+name="twitter:title"\s+content=")[^"]*/i, `$1${frozenHead.title}`);
  }

  if (frozenHead.description) {
    html = html.replace(/(<meta\s+name="description"\s+content=")[^"]*/i, `$1${frozenHead.description}`);
    html = html.replace(
      /(<meta\s+property="og:description"\s+content=")[^"]*/i,
      `$1${frozenHead.description}`
    );
    html = html.replace(
      /(<meta\s+name="twitter:description"\s+content=")[^"]*/i,
      `$1${frozenHead.description}`
    );
  }

  return new Response(html, {
    status,
    headers,
  });
}
