// Resolves each public route to the exact set of client JS chunks that must be
// loaded before hydration.
//
// WHY THIS EXISTS
// Every page — and, inside several pages, every below-the-fold section — is a
// React.lazy component, so its code lives in its own chunk. The prerendered HTML
// references only the entry chunk, so in a real browser those chunks are still
// in flight when hydration begins. Their Suspense boundaries are therefore
// dehydrated at that moment, and the first context update (Supabase publishes an
// initial auth session within milliseconds of mount) forces React to throw the
// whole prerendered subtree away and re-render on the client — "React #421:
// This Suspense boundary received an update before it finished hydrating".
//
// jsdom cannot see this: there every module is already loaded synchronously from
// source, so no boundary is ever dehydrated. It only reproduces in a browser
// over a real network, which is why it reached the Netlify preview.
//
// WHY NOT JUST PRELOAD THE STATIC IMPORT GRAPH
// Too little: it misses the nested lazy sections (the homepage has fifteen).
// WHY NOT THE FULL DYNAMIC GRAPH
// Too much: it is the entire application, 8.9 MB, including the 2 MB Spline
// runtime and react-pdf — code the server never renders and the visitor may
// never need.
//
// So the set is measured, not guessed: a module load hook records every SSR
// chunk actually pulled in while prerendering, which yields the dynamic import
// edges the server really takes. Per route we then walk the page's chunk over
// static imports plus those observed edges. Client-only lazies such as the
// Spline hero are never rendered on the server, so their edges are never
// observed and never preloaded.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, basename } from 'node:path';

/** `path="/x"` + `element={<Comp ... />}` pairs, in declaration order. */
function parseRouteElements(appTsx) {
  const routes = [];
  for (const match of appTsx.matchAll(/<Route\s+([^>]*?)\/?>/gs)) {
    const attrs = match[1];
    const path = attrs.match(/path="([^"]+)"/);
    const element = attrs.match(/element=\{<([A-Za-z0-9_]+)/);
    if (path && element) routes.push({ pattern: path[1], component: element[1] });
  }
  return routes;
}

/** `const X = lazyNamed(() => import('./pages/Y'), 'Z');` */
function parseLazyImports(appTsx) {
  const map = new Map();
  const re = /const\s+([A-Za-z0-9_]+)\s*=\s*lazyNamed\(\s*\(\)\s*=>\s*import\(\s*'([^']+)'\s*\)/g;
  for (const m of appTsx.matchAll(re)) map.set(m[1], m[2]);
  return map;
}

function patternToRegExp(pattern) {
  const parts = pattern.split('/').map((seg) => {
    if (seg === '*') return '.*';
    if (seg.startsWith(':')) return '[^/]+';
    return seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  });
  return new RegExp(`^${parts.join('/')}$`);
}

/** './pages/HomePage' or '@/components/X' -> the key used by a Vite manifest. */
function toManifestKey(importPath, manifest) {
  const base = importPath.replace(/^\.\//, 'src/').replace(/^@\//, 'src/');
  for (const suffix of ['.tsx', '.ts', '/index.tsx', '/index.ts', '']) {
    if (manifest[`${base}${suffix}`]) return `${base}${suffix}`;
  }
  return null;
}

/**
 * Records every module the SSR bundle loads. Install BEFORE rendering.
 * @returns {{ loaded: Set<string> }}
 */
export function trackSsrModuleLoads(registerHooks) {
  const loaded = new Set();
  registerHooks({
    load(url, context, nextLoad) {
      if (url.startsWith('file:')) {
        try {
          loaded.add(basename(fileURLToPath(url)));
        } catch {
          /* not a real file url */
        }
      }
      return nextLoad(url, context);
    },
  });
  return { loaded };
}

/**
 * @param {string} root repository root
 * @param {Set<string>} loadedSsrFiles basenames of SSR chunks loaded while rendering
 */
export function createRouteChunkResolver(root, loadedSsrFiles) {
  const clientManifestPath = join(root, 'dist', '.vite', 'manifest.json');
  const ssrManifestPath = join(root, 'dist-ssr', '.vite', 'manifest.json');
  for (const [label, p] of [
    ['client', clientManifestPath],
    ['SSR', ssrManifestPath],
  ]) {
    if (!existsSync(p)) {
      throw new Error(`Vite ${label} manifest not found at ${p}. Both builds must run with build.manifest enabled.`);
    }
  }
  const client = JSON.parse(readFileSync(clientManifestPath, 'utf8'));
  const ssr = JSON.parse(readFileSync(ssrManifestPath, 'utf8'));
  const appTsx = readFileSync(join(root, 'src', 'App.tsx'), 'utf8');

  const routes = parseRouteElements(appTsx).map((r) => ({ ...r, re: patternToRegExp(r.pattern) }));
  const lazyImports = parseLazyImports(appTsx);
  if (!routes.length) throw new Error('Could not parse any <Route> elements from src/App.tsx');
  if (!lazyImports.size) throw new Error('Could not parse any lazyNamed() imports from src/App.tsx');

  // Dynamic edges the SERVER actually took, keyed by source module. A dynamic
  // import whose SSR chunk never loaded is code the prerendered HTML does not
  // contain, so hydration does not need it.
  const observedDynamic = new Map();
  let skippedEdges = 0;
  for (const [key, entry] of Object.entries(ssr)) {
    const taken = [];
    for (const dep of entry.dynamicImports || []) {
      const depFile = ssr[dep]?.file;
      if (depFile && loadedSsrFiles.has(basename(depFile))) taken.push(dep);
      else skippedEdges++;
    }
    if (taken.length) observedDynamic.set(key, taken);
  }

  /** Closure over static imports + server-observed dynamic imports. */
  function collect(key, seen = new Set()) {
    if (seen.has(key)) return seen;
    seen.add(key);
    const entry = client[key];
    if (entry) {
      for (const dep of entry.imports || []) collect(dep, seen);
    }
    for (const dep of observedDynamic.get(key) || []) collect(dep, seen);
    return seen;
  }

  const stats = { lazyRoutes: 0, staticRoutes: 0, skippedEdges, maxChunks: 0 };

  const PRIVATE = ['/app', '/admin', '/owner', '/auth', '/d'];
  const isPrivate = (p) => PRIVATE.some((prefix) => p === prefix || p.startsWith(`${prefix}/`));

  return {
    stats,

    /**
     * Preload set for dist/404.html.
     *
     * That one document answers EVERY unknown URL, and the client router does
     * not necessarily resolve such a URL to the same component the server
     * rendered: "/blog/kein-artikel" matches the dynamic <Route path="/blog/:slug">
     * and mounts BlogPostPage, which then renders NotFoundPage itself. The final
     * DOM agrees, but only once BlogPostPage's chunk has loaded — until then its
     * Suspense boundary is dehydrated and hydration fails.
     *
     * So the 404 document preloads the catch-all page plus every PUBLIC DYNAMIC
     * route's page. There is exactly one of those today (/blog/:slug); deriving
     * it from the route table rather than hard-coding it means a future dynamic
     * route is covered automatically.
     */
    fallbackPreload(catchAllPath) {
      const sets = [this.resolve(catchAllPath)];
      for (const route of routes) {
        if (!route.pattern.includes(':') || isPrivate(route.pattern)) continue;
        sets.push(this.resolve(route.pattern));
      }
      const present = sets.filter(Boolean);
      if (!present.length) return null;
      return {
        chunk: present[0].chunk,
        preload: [...new Set(present.flatMap((s) => s.preload))],
      };
    },
    resolve(routePath) {
      const match =
        routes.find((r) => r.pattern === routePath) || routes.find((r) => r.re.test(routePath));
      if (!match) return null;

      const importPath = lazyImports.get(match.component);
      if (!importPath) {
        stats.staticRoutes++;
        return null; // statically imported component: already in the entry chunk
      }

      const key = toManifestKey(importPath, client);
      if (!key) {
        throw new Error(
          `Route ${routePath} maps to ${match.component} (${importPath}) but has no entry in the Vite client manifest.`
        );
      }

      const files = [];
      for (const dep of collect(key)) {
        const file = client[dep]?.file;
        // The entry chunk is already loaded via the page's own <script>.
        if (file && !client[dep]?.isEntry) files.push(`/${file}`);
      }
      const unique = [...new Set(files)];
      stats.lazyRoutes++;
      stats.maxChunks = Math.max(stats.maxChunks, unique.length);
      return { chunk: `/${client[key].file}`, preload: unique };
    },
  };
}
