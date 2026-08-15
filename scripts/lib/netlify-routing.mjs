// A faithful model of how Netlify resolves a request path against a published
// directory, used both by the local test server and by the routing guard.
//
// Resolution order (Netlify's documented behaviour):
//   1. FORCED redirect/rewrite rules (those with a "!" on the status)
//   2. an exact static file
//   3. pretty-URL normalisation, which is where redirect LOOPS come from:
//        a. "<path>/" with no matching file  -> 301 to "<path>"
//        b. "<path>" that names a DIRECTORY containing index.html -> 301 to "<path>/"
//      (a) and (b) point at each other. A directory-index artifact therefore
//      redirects "/leistungen" -> "/leistungen/" while normalisation redirects
//      "/leistungen/" -> "/leistungen", and the browser gives up with
//      ERR_TOO_MANY_REDIRECTS. Emitting "<path>.html" avoids (b) entirely, and
//      the explicit forced rewrites the prerenderer generates avoid the whole
//      question by resolving before any normalisation happens.
//   4. "<path>.html" (pretty URL for a file)
//   5. non-forced rules, in file order, first match wins
//   6. 404.html with status 404
import { existsSync, statSync } from 'node:fs';
import { join, normalize } from 'node:path';

export function parseRedirects(text) {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => l.split(/\s+/))
    .filter((parts) => parts.length >= 2)
    .map(([from, to, status = '200']) => ({
      from,
      to,
      status: Number(String(status).replace('!', '')) || 200,
      force: String(status).endsWith('!'),
    }));
}

export const matchesPattern = (pattern, path) =>
  pattern.endsWith('/*') ? path.startsWith(pattern.slice(0, -1)) : pattern === path;

const isFile = (p) => existsSync(p) && statSync(p).isFile();
const isDir = (p) => existsSync(p) && statSync(p).isDirectory();

/**
 * Resolve one request path to a single hop.
 * @returns {{ kind: 'file'|'redirect'|'notfound', file?: string, status: number, location?: string }}
 */
export function resolveOnce(dist, path, rules) {
  const safe = normalize(path).replace(/^(\.\.[/\\])+/, '');
  const target = join(dist, safe);
  if (!target.startsWith(dist)) return { kind: 'notfound', status: 403 };

  // 1. forced rules win over everything, including normalisation
  for (const rule of rules) {
    if (rule.force && matchesPattern(rule.from, path)) {
      const file = join(dist, rule.to.replace(/^\//, ''));
      if (isFile(file)) return { kind: 'file', file, status: rule.status };
      return { kind: 'redirect', status: rule.status, location: rule.to };
    }
  }

  // 2. exact static file
  if (isFile(target)) return { kind: 'file', file: target, status: 200 };

  // 2b. the site root is always served by index.html, never normalised
  if (path === '/') {
    const rootIndex = join(dist, 'index.html');
    if (isFile(rootIndex)) return { kind: 'file', file: rootIndex, status: 200 };
  }

  // 3. pretty-URL normalisation
  if (path !== '/' && path.endsWith('/')) {
    return { kind: 'redirect', status: 301, location: path.replace(/\/+$/, '') };
  }
  if (path !== '/' && isDir(target) && isFile(join(target, 'index.html'))) {
    return { kind: 'redirect', status: 301, location: `${path}/` };
  }

  // 4. pretty URL for a file
  const pretty = `${target}.html`;
  if (isFile(pretty)) return { kind: 'file', file: pretty, status: 200 };

  // 5. ordinary rules
  for (const rule of rules) {
    if (rule.force) continue;
    if (matchesPattern(rule.from, path)) {
      const file = join(dist, rule.to.replace(/^\//, ''));
      if (isFile(file)) return { kind: 'file', file, status: rule.status };
    }
  }

  // 6. the 404 document
  const notFound = join(dist, '404.html');
  if (isFile(notFound)) return { kind: 'file', file: notFound, status: 404 };
  return { kind: 'notfound', status: 404 };
}

/**
 * Follow the chain a browser would follow.
 * @returns {{ hops: string[], redirects: number, final: object, loop: boolean }}
 */
export function trace(dist, path, rules, maxHops = 12) {
  const hops = [path];
  const seen = new Set([path]);
  let current = path;

  for (let i = 0; i < maxHops; i++) {
    const step = resolveOnce(dist, current, rules);
    if (step.kind !== 'redirect') {
      return { hops, redirects: hops.length - 1, final: step, loop: false };
    }
    current = step.location;
    hops.push(current);
    if (seen.has(current)) return { hops, redirects: hops.length - 1, final: step, loop: true };
    seen.add(current);
  }
  return { hops, redirects: hops.length - 1, final: { kind: 'notfound', status: 508 }, loop: true };
}
