// Static file server for the generated dist/ directory.
//
// Resolution is delegated to scripts/lib/netlify-routing.mjs — the same model
// the routing guard uses — so the browser test exercises exactly the semantics
// that .github/scripts/test-netlify-routing.mjs verifies, and neither can drift
// from the other. This is still an imitation for local/CI use; the authoritative
// check is always the real Netlify preview.
//
// public/_headers blocks are applied to the response.
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

import { parseRedirects, resolveOnce } from '../../../scripts/lib/netlify-routing.mjs';

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
export function startStaticServer(dist) {
  const redirectsFile = join(dist, '_redirects');
  const redirects = existsSync(redirectsFile) ? parseRedirects(readFileSync(redirectsFile, 'utf8')) : [];
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

    const step = resolveOnce(dist, path, redirects);
    if (step.kind === 'redirect') {
      res.writeHead(step.status, { Location: step.location });
      res.end();
      return;
    }
    if (step.kind !== 'file') {
      res.writeHead(step.status);
      res.end('not found');
      return;
    }
    send(res, step.file, step.status, path);
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
