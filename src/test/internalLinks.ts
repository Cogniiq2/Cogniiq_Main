// Internal-link extraction shared by the two SEO tests that ask the same question from different
// sources: src/entry-server.test.tsx (renders a page on demand) and src/prerender.hydration.test.tsx
// (reads what the build actually wrote). The rules for "which hrefs are route links" live here so
// the two cannot drift apart.

import { isDocumentSurface, isPrivateSurface } from '@/lib/routing/indexability';

// Rendered above the problem-link list by both RelatedPages and IndustryPage. Matched in full,
// because other pages open a paragraph with "Häufige Probleme" as ordinary prose.
export const PROBLEM_LINKS_HEADING = 'Häufige Probleme – direkt adressiert';

function parse(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html');
}

/**
 * Every route path an <a> on the page points at.
 *
 * Only anchors count: <link rel="modulepreload"|"stylesheet"|"icon"> carries an href too, but it
 * addresses a build asset rather than a route.
 *
 * Dropped because they are internal links that are deliberately not public routes: private
 * surfaces (/app, /admin, /owner, /auth) and the tokenised document portal (/d/:token). Dropped as
 * not-internal: external schemes (https:, tel:, mailto:) and same-page fragments. Whatever is left
 * is a claim that the site publishes that URL, and must resolve against the route manifest.
 */
export function publicLinkTargets(html: string): string[] {
  const targets = new Set<string>();
  for (const anchor of parse(html).querySelectorAll('a[href]')) {
    const href = anchor.getAttribute('href') ?? '';
    if (!href.startsWith('/')) continue;
    const path = href.split(/[?#]/)[0];
    if (!path || isPrivateSurface(path) || isDocumentSurface(path)) continue;
    targets.add(path);
  }
  return [...targets];
}

/**
 * The hrefs of the "Häufige Probleme – direkt adressiert" list alone, or [] on a page without one.
 *
 * Scoped to that block deliberately. The footer and the mobile navigation link the same problem
 * pages from every page on the site, so a document-wide search reports success even when the
 * related-page list itself is broken or has disappeared.
 */
export function problemLinkTargets(html: string): string[] {
  const doc = parse(html);
  const heading = [...doc.querySelectorAll('p, span, h2, h3')].find(
    (el) => el.textContent?.trim() === PROBLEM_LINKS_HEADING
  );
  if (!heading) return [];

  // RelatedPages puts the heading in a flex row that sits beside the list; IndustryPage makes it a
  // plain sibling of it. Climbing to the nearest ancestor that owns a <ul> covers both shapes.
  let scope: Element | null = heading;
  while (scope && !scope.querySelector('ul')) scope = scope.parentElement;

  const list = scope?.querySelector('ul');
  if (!list) return [];
  return [...list.querySelectorAll('a[href]')].map((a) => a.getAttribute('href') ?? '');
}
