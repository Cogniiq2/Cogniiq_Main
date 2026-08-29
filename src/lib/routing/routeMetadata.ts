// ─────────────────────────────────────────────────────────────────────────────
// Runtime access to the SAME route metadata that scripts/prerender.mjs writes
// into the <head> at build time.
//
// WHY THIS EXISTS
//
// publicRoutes.ts declares itself the authoritative description of the public
// URL surface, and for anything build-time it is: prerender, sitemap and the CI
// parity guards all read it. But nothing runtime did. Every page component ALSO
// carried its own title/description strings and handed them to PageSEO, whose
// effect writes document.title and the meta/OG/Twitter tags after hydration and
// on every client-side navigation.
//
// So each route had two independent sources for the same facts, and they had
// drifted apart on 74 of 92 routes: the crawled document said one thing, the
// hydrated document said another, and the WebPage JSON-LD said a third. Which
// version a crawler recorded depended on whether its render pass ran.
//
// Aligning the output after the fact (rewriting the schema during prerender)
// treated the symptom and left both sources in place. This module removes the
// second source instead: PageSEO resolves from here, so the prerendered head,
// the hydrated head, the JSON-LD and the OG/Twitter tags are all the same
// strings by construction rather than by assertion.
//
// DIRECTION OF TRUTH: the manifest wins, never the component. The manifest
// holds the values Google has actually indexed, including the titles and
// descriptions the 2026-08-29 experiments are measuring. Deriving the other way
// would silently reset those.
//
// Components still pass title/description. Those props remain the fallback for
// addresses that are not in the manifest — the 404 document, which answers every
// unknown URL and so has no single canonical identity, and any future route that
// renders outside PUBLIC_ROUTES. For a manifest-backed route the props are
// ignored, which is what makes drift impossible rather than merely detected.
// ─────────────────────────────────────────────────────────────────────────────
import { PUBLIC_ROUTES, SITE_ORIGIN } from './publicRoutes';

export interface ResolvedRouteMetadata {
  readonly title: string;
  readonly description: string;
  /** false => the document is served noindex AND kept out of the sitemap. */
  readonly indexable: boolean;
}

const BY_PATH: ReadonlyMap<string, ResolvedRouteMetadata> = new Map(
  PUBLIC_ROUTES.map((route) => [
    route.path,
    { title: route.title, description: route.description, indexable: route.indexable },
  ])
);

/**
 * Canonical URL -> path, or null when the URL is not an address on this site.
 * PageSEO is handed a canonical rather than a pathname, and that is the value
 * prerender also keys on, so the lookup uses the same key on both sides.
 */
export function pathFromCanonical(canonical: string): string | null {
  if (!canonical.startsWith(SITE_ORIGIN)) return null;
  const rest = canonical.slice(SITE_ORIGIN.length);
  if (rest === '' || rest === '/') return '/';
  // A trailing slash is not how this site publishes its URLs (see the pretty-file
  // rationale in scripts/prerender.mjs), but tolerate one rather than miss a match.
  return rest.endsWith('/') ? rest.slice(0, -1) : rest;
}

/** The manifest entry for a canonical URL, or undefined if it has none. */
export function routeMetadataForCanonical(canonical: string): ResolvedRouteMetadata | undefined {
  const path = pathFromCanonical(canonical);
  return path === null ? undefined : BY_PATH.get(path);
}
