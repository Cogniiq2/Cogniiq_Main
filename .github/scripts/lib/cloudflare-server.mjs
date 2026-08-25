// ─────────────────────────────────────────────────────────────────────────────
// Static server that reproduces the CLOUDFLARE WORKERS ASSETS serving order for
// dist/ — which is NOT the Netlify order that lib/static-server.mjs models.
//
// The difference is the whole reason the production white-screen existed:
//
//   Netlify (lib/static-server.mjs)   applies public/_redirects, including the
//                                     "200" REWRITE rules that point every
//                                     private route family at /app-shell.html.
//
//   Workers Assets (this file)        serves matching files from dist/ and then
//                                     invokes the Worker. It does NOT apply
//                                     _redirects rewrites, so those ten
//                                     /app-shell.html rules are inert there.
//
// Modelling only Netlify is exactly how CI stayed green while every private
// deep link in production was white: the rules the test relied on were never
// executed by the host that actually serves the site.
//
// Serving order reproduced here, matching wrangler.jsonc:
//
//   1. an exact static file in dist/
//   2. <path>.html                 (html_handling, what the prerenderer emits)
//   3. <path>/index.html           (directory index)
//   4. not_found_handling: "none"  -> fall through to the Worker
//   5. worker/routing.mjs decides: private shell 200, 404 document 404, or a
//      bare 404 for a missing asset
//
// public/_headers blocks are applied to the response, as Cloudflare applies
// them, against the REQUEST path.
//
// This is an imitation for local/CI verification. It cannot prove what the live
// edge does — it proves that the artifact plus the committed routing config
// produce the required contract under Workers Assets semantics.
// ─────────────────────────────────────────────────────────────────────────────
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';

import { DOCUMENT_FILES, PRIVATE_SHELL_HEADERS, resolveUnmatchedRequest } from '../../../worker/routing.mjs';

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
export function startCloudflareServer(dist) {
  const headerBlocks = parseHeaders(dist);
  const assetDelayMs = Number(process.env.STATIC_SERVER_ASSET_DELAY_MS || 0);

  const send = (res, file, status, path, extraHeaders = {}) => {
    const headers = { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' };
    for (const block of headerBlocks) {
      if (matchesPattern(block.pattern, path)) {
        for (const [k, v] of block.headers) headers[k] = v;
      }
    }
    Object.assign(headers, extraHeaders);
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
    const safe = normalize(path).replace(/^(\.\.[/\\])+/, '');
    const target = join(dist, safe);
    if (!target.startsWith(dist)) {
      res.writeHead(403);
      res.end('forbidden');
      return;
    }

    // 1-3: whatever the asset store holds is served before the Worker runs.
    if (existsSync(target) && statSync(target).isFile()) return send(res, target, 200, path);
    const pretty = `${target}.html`;
    if (existsSync(pretty) && statSync(pretty).isFile()) return send(res, pretty, 200, path);
    const index = join(target, 'index.html');
    if (existsSync(index) && statSync(index).isFile()) return send(res, index, 200, path);

    // 4-5: nothing matched -> the Worker. NOTE: public/_redirects is
    // deliberately NOT consulted here. Workers Assets does not apply its
    // rewrite rules, and pretending otherwise is the bug this file exists to
    // stop reintroducing.
    const decision = resolveUnmatchedRequest(path);
    if (decision.kind === 'asset-not-found') {
      res.writeHead(404);
      res.end();
      return;
    }
    // The decision names a PRETTY path; resolve it to the physical file the
    // asset store holds, which is what the edge's canonicalisation does.
    const document = join(dist, DOCUMENT_FILES[decision.document] || decision.document.replace(/^\//, ''));
    if (!existsSync(document)) {
      res.writeHead(decision.status);
      res.end();
      return;
    }
    return send(
      res,
      document,
      decision.status,
      path,
      decision.kind === 'private-shell'
        ? PRIVATE_SHELL_HEADERS
        : {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache, must-revalidate',
            'X-Robots-Tag': 'noindex, nofollow',
          }
    );
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
