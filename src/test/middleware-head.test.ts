// ─────────────────────────────────────────────────────────────────────────────
// HEAD must never fail where GET succeeds.
//
// Reproduces the production defect of 2026-10-23: Cloudflare's asset layer
// answers HEAD with the HTML response but WITHOUT a body. The Function read
// that empty body, ran the document check on it and answered
//   500  X-Cogniiq-Shell-Error: asset body is not an HTML document
// while GET on the same URL was 200. `wrangler pages dev` does not reproduce
// it (its asset server hands the Function a body for HEAD and strips it on the
// way out), so the mocked context below models the real runtime: a HEAD
// request whose `next()` returns status 200, text/html, empty body.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, expect, it } from 'vitest';
import { onRequest } from '../../functions/_middleware';

const DOC =
  '<!doctype html><html lang="de"><head><title>Seite</title><meta name="robots" content="index, follow"></head>' +
  '<body><div id="root"><h1>Hallo</h1></div><script type="module" src="/assets/index-abc123.js"></script></body></html>';
const SHELL =
  '<!doctype html><html lang="de"><head><title>Shell</title><meta name="robots" content="index, follow"></head>' +
  '<body><div id="root"></div><script type="module" src="/assets/index-abc123.js"></script></body></html>';
const NOT_FOUND = DOC.replace('Hallo', 'Nicht gefunden');

type Doc = { status: number; html: string; redirect?: string };

/** The asset store as Cloudflare exposes it: GET carries the body, HEAD does not. */
function makeContext(method: 'GET' | 'HEAD', url: string, assets: Record<string, Doc>) {
  const lookup = (req: Request): Response => {
    const path = new URL(req.url).pathname;
    const hit = assets[path];
    if (!hit) {
      return new Response(req.method === 'HEAD' ? null : 'Not Found', {
        status: 404,
        headers: { 'content-type': 'text/plain' },
      });
    }
    if (hit.redirect) {
      return new Response(null, { status: 307, headers: { location: hit.redirect } });
    }
    return new Response(req.method === 'HEAD' ? null : hit.html, {
      status: hit.status,
      headers: { 'content-type': 'text/html; charset=utf-8', etag: '"abc"' },
    });
  };
  const request = new Request(url, { method });
  return {
    request,
    next: async () => lookup(request),
    env: { ASSETS: { fetch: async (req: Request) => lookup(req) } },
  };
}

const ASSETS: Record<string, Doc> = {
  '/ki-telefonassistent-arzt': { status: 200, html: DOC },
  // The asset store serves the 404 document itself with 200; the Function
  // assigns the real 404 status.
  '/404': { status: 200, html: NOT_FOUND },
  '/app-shell': { status: 200, html: SHELL },
  '/webdesign-agentur-deutschland': { status: 301, html: '', redirect: '/webdesign' },
};

async function run(method: 'GET' | 'HEAD', path: string) {
  const ctx = makeContext(method, `https://cogniiq.de${path}`, ASSETS);
  // The Function's context type is structural; the mock satisfies it.
  return onRequest(ctx as unknown as Parameters<typeof onRequest>[0]);
}

describe('functions/_middleware — HEAD mirrors GET without a body', () => {
  it('a prerendered route: GET 200 with the document', async () => {
    const r = await run('GET', '/ki-telefonassistent-arzt');
    expect(r.status).toBe(200);
    expect(r.headers.get('x-cogniiq-shell-error')).toBeNull();
    expect(await r.text()).toContain('<h1>Hallo</h1>');
  });

  it('the same route: HEAD 200, no shell error, no body, GET headers', async () => {
    const r = await run('HEAD', '/ki-telefonassistent-arzt');
    expect(r.status).toBe(200);
    expect(r.headers.get('x-cogniiq-shell-error')).toBeNull();
    expect(r.headers.get('content-type')).toMatch(/^text\/html/);
    expect(r.headers.get('cache-control')).toBe('no-cache');
    expect(r.headers.get('content-length')).toBeNull();
    expect(await r.text()).toBe('');
  });

  it('an unknown route: GET and HEAD both answer a real 404', async () => {
    const g = await run('GET', '/gibt-es-nicht');
    const h = await run('HEAD', '/gibt-es-nicht');
    expect(g.status).toBe(404);
    expect(h.status).toBe(404);
    expect(await g.text()).toContain('Nicht gefunden');
    expect(await h.text()).toBe('');
    expect(h.headers.get('x-cogniiq-shell-error')).toBeNull();
  });

  it('a private deep link: HEAD carries the noindex header the GET carries', async () => {
    const g = await run('GET', '/app/login');
    const h = await run('HEAD', '/app/login');
    expect(g.status).toBe(200);
    expect(h.status).toBe(200);
    expect(g.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    expect(h.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    expect(await h.text()).toBe('');
  });

  it('a redirect passes through unchanged for both methods', async () => {
    for (const m of ['GET', 'HEAD'] as const) {
      const r = await run(m, '/webdesign-agentur-deutschland');
      expect(r.status).toBe(307);
      expect(r.headers.get('location')).toBe('/webdesign');
    }
  });

  it('a broken asset still surfaces as 500 — for HEAD without a text body', async () => {
    const ctx = makeContext('HEAD', 'https://cogniiq.de/kaputt', {
      '/kaputt': { status: 200, html: 'kein html' },
    });
    // Force the GET lookup to return the broken body as well.
    ctx.env.ASSETS.fetch = async () =>
      new Response('kein html', { status: 200, headers: { 'content-type': 'text/html' } });
    const r = await onRequest(ctx as unknown as Parameters<typeof onRequest>[0]);
    expect(r.status).toBe(500);
    expect(r.headers.get('x-cogniiq-shell-error')).toBe('asset body is not an HTML document');
    expect(await r.text()).toBe('');
  });
});
