// Static file server that reproduces Netlify's documented serving order for the
// generated dist/ directory:
//
//   1. an exact static file
//   2. <path>.html            (pretty URL, no trailing slash — what we emit)
//   3. <path>/index.html      (directory index; Netlify serves these at a
//                              trailing slash, which is why we do NOT emit them)
//   4. public/_redirects rules, in order, first match wins
//   5. 404.html with status 404
//
// public/_headers blocks are applied to the response.
//
// Shared by .github/scripts/test-browser-hydration.mjs so the browser test
// exercises the same routing semantics the deployment uses. This is an
// imitation for local/CI verification — the authoritative check is always the
// real Netlify preview.
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function parseRedirects(dist) {
  const file = join(dist, '_redirects');
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => l.split(/\s+/))
    .filter((parts) => parts.length >= 2);
}

function parseHeaders(dist) {
  const file = join(dist, '_headers');
  if (!existsSync(file)) return [];
  const blocks = [];
  let current = null;
  for (const raw of readFileSync(file, 'utf8').split('\n')) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      current = { pattern: line.trim(), headers: [] };
      blocks.push(current);
    } else if (current) {
      const i = line.indexOf(':');
      if (i > 0) current.headers.push([line.slice(0, i).trim(), line.slice(i + 1).trim()]);
    }
  }
  return blocks;
}

const matchesPattern = (pattern, path) =>
  pattern.endsWith('/*') ? path.startsWith(pattern.slice(0, -1)) : pattern === path;

/**
 * @param {string} dist absolute path to the built site
 * @returns {Promise<{ origin: string, close: () => Promise<void> }>}
 */
export function startStaticServer(dist) {
  const redirects = parseRedirects(dist);
  const headerBlocks = parseHeaders(dist);

  // Test-only knob. Netlify serves JS chunks over a real network, so a route's
  // lazy chunk arrives well AFTER hydration starts. Over loopback it can arrive
  // first, which hides Suspense-hydration races — that is precisely how the
  // earlier test suite passed while the preview failed. Setting this forces the
  // slow, realistic ordering.
  const assetDelayMs = Number(process.env.STATIC_SERVER_ASSET_DELAY_MS || 0);

  const send = (res, file, status, path) => {
    const headers = { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' };
    for (const block of headerBlocks) {
      if (matchesPattern(block.pattern, path)) {
        for (const [k, v] of block.headers) headers[k] = v;
      }
    }
    const write = () => {
      res.writeHead(status, headers);
      res.end(readFileSync(file));
    };
    if (assetDelayMs > 0 && path.startsWith('/assets/') && path.endsWith('.js')) {
      setTimeout(write, assetDelayMs);
    } else {
      write();
    }
  };

  const server = createServer((req, res) => {
    let path;
    try {
      path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    } catch {
      res.writeHead(400);
      res.end('bad request');
      return;
    }
    // Contain the resolved path inside dist.
    const safe = normalize(path).replace(/^(\.\.[/\\])+/, '');
    const target = join(dist, safe);
    if (!target.startsWith(dist)) {
      res.writeHead(403);
      res.end('forbidden');
      return;
    }

    if (existsSync(target) && statSync(target).isFile()) return send(res, target, 200, path);

    // Pretty URL: "/leistungen" is served by "leistungen.html" with no trailing
    // slash. This is why the prerenderer emits <path>.html rather than
    // <path>/index.html — a directory index would make Netlify canonicalise the
    // URL to "/leistungen/" and contradict the published canonical.
    const pretty = `${target}.html`;
    if (existsSync(pretty) && statSync(pretty).isFile()) return send(res, pretty, 200, path);

    const index = join(target, 'index.html');
    if (existsSync(index) && statSync(index).isFile()) return send(res, index, 200, path);

    for (const [pattern, to, status] of redirects) {
      if (matchesPattern(pattern, path)) {
        // The target may be a PRETTY path ("/app-shell"), which resolves
        // through the same <path>.html lookup that serves every prerendered
        // public route. Cloudflare Pages canonicalises an .html target to this
        // form, so the committed rules name it directly.
        const base = join(dist, to.replace(/^\//, ''));
        for (const file of [base, `${base}.html`, join(base, 'index.html')]) {
          if (existsSync(file) && statSync(file).isFile()) {
            return send(res, file, Number(status) || 200, path);
          }
        }
      }
    }

    const notFound = join(dist, '404.html');
    if (existsSync(notFound)) return send(res, notFound, 404, path);
    res.writeHead(404);
    res.end('not found');
  });

  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        origin: `http://127.0.0.1:${port}`,
        close: () => new Promise((done) => server.close(done)),
      });
    });
  });
}
