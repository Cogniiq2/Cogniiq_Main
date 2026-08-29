import { describe, expect, it } from 'vitest';

import { PUBLIC_ROUTES, SITE_ORIGIN } from './publicRoutes';
import { pathFromCanonical, routeMetadataForCanonical } from './routeMetadata';

const canonicalFor = (path: string) => (path === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${path}`);

describe('routeMetadata', () => {
  // The failure this guards against is silent. If a canonical stops resolving,
  // PageSEO falls back to the component's own strings and the drift this module
  // exists to remove comes straight back, with nothing failing anywhere.
  it('resolves every route in the manifest from its canonical URL', () => {
    const unresolved = PUBLIC_ROUTES.filter((route) => !routeMetadataForCanonical(canonicalFor(route.path)));
    expect(unresolved.map((r) => r.path)).toEqual([]);
  });

  it('returns exactly the manifest title, description and indexability', () => {
    for (const route of PUBLIC_ROUTES) {
      expect(routeMetadataForCanonical(canonicalFor(route.path))).toEqual({
        title: route.title,
        description: route.description,
        indexable: route.indexable,
      });
    }
  });

  it('maps the homepage canonical to "/" with or without the trailing slash', () => {
    expect(pathFromCanonical(`${SITE_ORIGIN}/`)).toBe('/');
    expect(pathFromCanonical(SITE_ORIGIN)).toBe('/');
  });

  it('tolerates a trailing slash on a nested canonical', () => {
    expect(pathFromCanonical(`${SITE_ORIGIN}/kontakt/`)).toBe('/kontakt');
  });

  it('does not resolve URLs that are not addresses on this site', () => {
    expect(pathFromCanonical('https://example.com/kontakt')).toBeNull();
    expect(routeMetadataForCanonical('https://example.com/kontakt')).toBeUndefined();
    expect(routeMetadataForCanonical(`${SITE_ORIGIN}/keine-solche-seite`)).toBeUndefined();
  });
});
