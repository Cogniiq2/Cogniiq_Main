import { describe, expect, it } from 'vitest';

import {
  INDEXABLE_ROUTES,
  NOINDEX_ROUTE_ROBOTS,
  PUBLIC_ROUTES,
  SITE_ORIGIN,
  canonicalFor,
  isKnownPublicRoute,
  normalizePath,
  routeFor,
} from './publicRoutes';
import { PUBLIC_ROUTE_PATHS } from './publicRoutePaths';
import { isPrivateSurface, isDocumentSurface } from './indexability';

// The browser gets PUBLIC_ROUTE_PATHS (paths only, ~4 KiB) instead of the full
// manifest (~39 KiB of titles, descriptions and keywords it never reads). That
// is two files naming the same URL surface, so the agreement is asserted, not
// assumed: a route added to the manifest but not the path list would hydrate as
// noindex with no canonical — a real indexing regression, silently.
describe('client path list mirrors the manifest', () => {
  it('lists exactly the manifest paths, in the same order', () => {
    expect(PUBLIC_ROUTE_PATHS).toEqual(PUBLIC_ROUTES.map((r) => r.path));
  });

  it('recognises every manifest route, trailing slash or not', () => {
    for (const route of PUBLIC_ROUTES) {
      expect(isKnownPublicRoute(route.path)).toBe(true);
      expect(isKnownPublicRoute(`${route.path}/`)).toBe(true);
    }
  });

  it('rejects URLs the site does not publish', () => {
    expect(isKnownPublicRoute('/gibt-es-nicht-xyz')).toBe(false);
    expect(isKnownPublicRoute('/blog/kein-artikel')).toBe(false);
  });
});

describe('manifest invariants', () => {
  it('has no duplicate paths', () => {
    const paths = PUBLIC_ROUTES.map((r) => r.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('only contains concrete URLs — never route patterns', () => {
    for (const route of PUBLIC_ROUTES) {
      expect(route.path).not.toContain(':');
      expect(route.path).not.toContain('*');
      expect(route.path.startsWith('/')).toBe(true);
    }
  });

  it('carries sitemap metadata if and only if the route is indexable', () => {
    for (const route of PUBLIC_ROUTES) {
      expect(Boolean(route.sitemap)).toBe(route.indexable);
    }
  });

  it('never lists a private or document surface', () => {
    for (const route of PUBLIC_ROUTES) {
      expect(isPrivateSurface(route.path)).toBe(false);
      expect(isDocumentSurface(route.path)).toBe(false);
    }
  });

  it('gives every route a non-empty, unique title and description', () => {
    const titles = new Set<string>();
    const descriptions = new Set<string>();
    for (const route of PUBLIC_ROUTES) {
      expect(route.title.trim().length).toBeGreaterThan(10);
      expect(route.description.trim().length).toBeGreaterThan(30);
      titles.add(route.title);
      descriptions.add(route.description);
    }
    expect(titles.size).toBe(PUBLIC_ROUTES.length);
    expect(descriptions.size).toBe(PUBLIC_ROUTES.length);
  });
});

describe('sitemap metadata', () => {
  it('uses fixed, hand-maintained lastmod dates — never the build date', () => {
    const today = new Date().toISOString().slice(0, 10);
    const dates = INDEXABLE_ROUTES.map((r) => r.sitemap!.lastmod);
    for (const date of dates) {
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    // A manifest whose every date happens to be today would mean the value is
    // being generated rather than maintained.
    expect(dates.every((d) => d === today)).toBe(false);
  });

  it('keeps priority as a literal string so regeneration is byte-stable', () => {
    for (const route of INDEXABLE_ROUTES) {
      expect(typeof route.sitemap!.priority).toBe('string');
      expect(route.sitemap!.priority).toMatch(/^[01]\.\d{1,2}$/);
    }
  });

  it('marks exactly one route as the x-default target: the homepage', () => {
    const xDefaults = INDEXABLE_ROUTES.filter((r) => r.sitemap!.xDefault);
    expect(xDefaults.map((r) => r.path)).toEqual(['/']);
  });
});

describe('canonicalFor', () => {
  it('keeps the trailing slash only on the homepage', () => {
    expect(canonicalFor('/')).toBe(`${SITE_ORIGIN}/`);
    expect(canonicalFor('/leistungen')).toBe(`${SITE_ORIGIN}/leistungen`);
    expect(canonicalFor('/leistungen/')).toBe(`${SITE_ORIGIN}/leistungen`);
  });

  it('produces a distinct canonical for every route — none inherits the homepage', () => {
    const home = canonicalFor('/');
    const canonicals = PUBLIC_ROUTES.map((r) => canonicalFor(r.path));
    expect(new Set(canonicals).size).toBe(canonicals.length);
    expect(canonicals.filter((c) => c === home)).toHaveLength(1);
  });
});

describe('isKnownPublicRoute', () => {
  it('recognises every route in the manifest', () => {
    for (const route of PUBLIC_ROUTES) {
      expect(isKnownPublicRoute(route.path)).toBe(true);
    }
  });

  it('tolerates a trailing slash, which is not part of a route identity', () => {
    expect(isKnownPublicRoute('/leistungen/')).toBe(true);
    expect(isKnownPublicRoute('/')).toBe(true);
    expect(normalizePath('/leistungen/')).toBe('/leistungen');
    expect(normalizePath('/')).toBe('/');
    expect(normalizePath('')).toBe('/');
  });

  it('rejects unknown URLs, which Netlify answers with the 404 document', () => {
    // These must stay noindex and canonical-free after hydration too — search
    // engines execute JavaScript, so a server-only noindex is not enough.
    for (const path of ['/gibt-es-nicht', '/blog/kein-artikel', '/leistungen/extra', '/404']) {
      expect(isKnownPublicRoute(path)).toBe(false);
    }
  });

  it('rejects private surfaces, which are never public routes', () => {
    for (const path of ['/app', '/app/billing', '/admin', '/owner', '/auth/confirmed', '/d/token']) {
      expect(isKnownPublicRoute(path)).toBe(false);
    }
  });
});

describe('non-indexable public surfaces', () => {
  it('holds /anfrage-erhalten out of the index but keeps it in the manifest', () => {
    const route = routeFor('/anfrage-erhalten');
    expect(route).toBeDefined();
    expect(route!.indexable).toBe(false);
    expect(route!.sitemap).toBeUndefined();
    expect(INDEXABLE_ROUTES).not.toContain(route);
    expect(NOINDEX_ROUTE_ROBOTS).toBe('noindex, nofollow');
  });
});
