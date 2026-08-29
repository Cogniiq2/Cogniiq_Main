// ─────────────────────────────────────────────────────────────────────────────
// FROZEN SEO EXPERIMENTS.
//
// Six public routes are running live search experiments. Their measurement is
// only valid while the page the crawler sees stays byte-identical, so they are
// frozen: no change to title, description, canonical, robots, H1, body copy,
// JSON-LD, outgoing links or anchor text, and no change to how many places in
// the codebase link INTO them.
//
// "Do not touch these" is a rule that survives exactly as long as the person
// who wrote it remembers it. This module turns it into a fingerprint, and
// src/protectedExperiments.test.tsx re-derives that fingerprint from a real SSR
// render and compares it against the committed baseline in
// src/test/fixtures/protected-experiments.baseline.json. Drift fails the build
// with a diff naming the field that moved.
//
// Deliberately NOT a vitest snapshot: `vitest -u` rewrites snapshots wholesale
// as a side effect of an unrelated update, which is precisely the accident this
// guards against. Regenerating this baseline takes a separate, named command —
//   npm run seo:baseline
// — so it can only ever land as a deliberate, reviewable line in a diff.
//
// When an experiment concludes, remove its path here in the same commit that
// changes the page, and record the intended follow-up work in
// docs/seo/post-experiment-opportunities.md.
// ─────────────────────────────────────────────────────────────────────────────

import { canonicalFor, routeFor, DEFAULT_ROUTE_ROBOTS, NOINDEX_ROUTE_ROBOTS } from './publicRoutes';

/** The frozen routes. Every entry must also be a path in PUBLIC_ROUTES. */
export const PROTECTED_EXPERIMENT_PATHS: readonly string[] = [
  '/bayreuth/webdesign',
  '/bayreuth/website-relaunch',
  '/regensburg/website-relaunch',
  '/muenchen/webdesign-kosten',
  '/ki-telefonassistent-arzt',
  '/kosten-ki-telefonassistent',
];

const PROTECTED = new Set(PROTECTED_EXPERIMENT_PATHS);

export function isProtectedExperiment(path: string): boolean {
  return PROTECTED.has(path);
}

/** One outgoing anchor: where it points and the words it points with. */
export interface AnchorFingerprint {
  readonly href: string;
  readonly text: string;
}

export interface ExperimentFingerprint {
  readonly path: string;
  /** From the route manifest — the strings the prerenderer writes into <head>. */
  readonly title: string;
  readonly description: string;
  readonly keywords: string;
  readonly canonical: string;
  readonly robots: string;
  readonly indexable: boolean;
  /** Serialised sitemap entry, or '' when the route is not in the sitemap. */
  readonly sitemap: string;
  /** Every <h1> on the page, in document order. More or fewer is itself drift. */
  readonly h1: readonly string[];
  /** Visible copy: length plus a digest, so a one-word edit fails without
   *  storing the whole page in the fixture. */
  readonly textLength: number;
  readonly textDigest: string;
  /** Each JSON-LD block, key-sorted then digested. Order-independent. */
  readonly jsonLd: readonly string[];
  /** Outgoing internal anchors, sorted. Both target and anchor text are part of
   *  the experiment: re-wording a link changes what the crawler reads. */
  readonly outgoingLinks: readonly AnchorFingerprint[];
}

/** Stable digest. Not cryptographic — this detects edits, not attackers. */
export function digest(input: string): string {
  // FNV-1a, 64-bit via two interleaved 32-bit lanes, rendered as hex. Chosen
  // over node:crypto so this module stays usable from the browser-like jsdom
  // environment the SSR tests run in.
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ (c + i), 0x811c9dc5) >>> 0;
  }
  return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0');
}

/** Recursively key-sort so a reordered JSON-LD object is not reported as drift
 *  while a changed value still is. */
function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([k, v]) => [k, sortValue(v)])
    );
  }
  return value;
}

export function normalizeJsonLd(raw: string): string {
  // PageSEO escapes '<' as < before embedding. Undo it so the digest is
  // taken over the JSON the crawler parses, not over the escaping.
  const text = raw.split('\\u003c').join('<');
  try {
    return JSON.stringify(sortValue(JSON.parse(text)));
  } catch {
    // An unparseable block is itself worth freezing verbatim rather than hiding.
    return text.replace(/\s+/g, ' ').trim();
  }
}

/** The words a reader sees, with script/style content and markup removed. */
export function visibleText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Build the fingerprint for one protected route from its rendered HTML.
 *
 * `parseHtml` is injected rather than reaching for a global DOMParser so the
 * function works unchanged in the jsdom test environment and in any future
 * Node-side caller.
 */
export function fingerprintExperiment(
  path: string,
  html: string,
  parseHtml: (html: string) => Document
): ExperimentFingerprint {
  const route = routeFor(path);
  if (!route) throw new Error(`Protected experiment ${path} is not in PUBLIC_ROUTES`);

  const doc = parseHtml(html);

  const h1 = [...doc.querySelectorAll('h1')].map((el) =>
    (el.textContent ?? '').replace(/\s+/g, ' ').trim()
  );

  const jsonLd = [...doc.querySelectorAll('script[type="application/ld+json"]')]
    .map((el) => normalizeJsonLd(el.textContent ?? ''))
    .map(digest)
    .sort();

  const outgoingLinks = [...doc.querySelectorAll('a[href]')]
    .map((a) => ({
      href: a.getAttribute('href') ?? '',
      text: (a.textContent ?? '').replace(/\s+/g, ' ').trim(),
    }))
    .filter((a) => a.href.startsWith('/'))
    .sort((a, b) => (a.href + a.text < b.href + b.text ? -1 : 1));

  const text = visibleText(html);

  return {
    path,
    title: route.title,
    description: route.description,
    keywords: route.keywords ?? '',
    canonical: canonicalFor(path),
    robots: route.indexable ? DEFAULT_ROUTE_ROBOTS : NOINDEX_ROUTE_ROBOTS,
    indexable: route.indexable,
    sitemap: route.sitemap
      ? `${route.sitemap.lastmod}|${route.sitemap.changefreq}|${route.sitemap.priority}`
      : '',
    h1,
    textLength: text.length,
    textDigest: digest(text),
    jsonLd,
    outgoingLinks,
  };
}

/**
 * How many places in the source tree link INTO each protected route.
 *
 * The brief freezes inbound link topology, not just the pages themselves: a new
 * contextual link pointing at an experiment changes the internal PageRank
 * reaching it and contaminates the measurement. Counting occurrences of the
 * literal path string across the source is a cheap, whole-repo check that a
 * page-by-page render cannot give — a link added on any of the other 87 routes
 * still moves the count.
 *
 * The count is deliberately of raw string occurrences rather than of parsed
 * anchors: it is a tripwire, and a false positive that makes someone read the
 * diff is the correct failure mode.
 */
export function countPathOccurrences(sources: ReadonlyMap<string, string>, path: string): number {
  let total = 0;
  for (const [, content] of sources) {
    // Bounded on the right so /bayreuth/webdesign does not also count
    // /bayreuth/webdesign-kosten.
    const pattern = new RegExp(`${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w/-])`, 'g');
    total += (content.match(pattern) ?? []).length;
  }
  return total;
}
