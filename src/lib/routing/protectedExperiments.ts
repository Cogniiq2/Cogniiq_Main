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
// WHAT THIS MODULE DOES AND DOES NOT READ — worth being exact about, because
// the difference is easy to misread as coverage that is not here:
//
//   - The <head> the crawler receives is written by scripts/prerender.mjs, not
//     by the React tree, so `render()` never produces it and nothing here parses
//     it. The head fields below (title, description, canonical, robots) are read
//     from the ROUTE MANIFEST. That is not a tautology only because a second
//     check binds the two: .github/scripts/test-prerender-output.mjs asserts, for
//     every route, that the prerendered canonical equals the manifest's, that
//     robots matches the manifest's indexability, and that title and description
//     are the manifest's. Manifest frozen here + manifest bound to the head there
//     = the crawled head is frozen. Edit either half and the guarantee is gone.
//
//   - The body fingerprint is scoped to <main>. The global navigation and footer
//     render on all 92 routes; including them would make every legitimate nav or
//     footer change fail all six experiments at once, and the pressure that
//     creates is to re-record the baseline — which would silently re-baseline the
//     protected body copy too. Links into the experiments from anywhere in the
//     shell are covered instead by the inbound-occurrence count below, which is
//     the check that actually matters for link topology.
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
  /** The full heading outline as "h2:Text". Text alone cannot show that a
   *  heading was demoted from h2 to h3, which changes document structure
   *  without changing a single word. */
  readonly headings: readonly string[];
  /** Visible copy: length plus a digest, so a one-word edit fails without
   *  storing the whole page in the fixture. */
  readonly textLength: number;
  readonly textDigest: string;
  /** Each JSON-LD block, key-sorted then digested. Order-independent. */
  readonly jsonLd: readonly string[];
  /** Outgoing anchors from <main>, sorted. Both target and anchor text are part
   *  of the experiment: re-wording a link changes what the crawler reads.
   *  External and absolute-URL links are included — an added outbound link is a
   *  change to the page a crawler sees just as much as an internal one. */
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

  // The page's own content. Falls back to the whole document only if the shell
  // ever stops emitting <main>, so a layout change cannot silently empty the
  // fingerprint and let every check pass against nothing.
  const main = doc.querySelector('main') ?? doc.body ?? doc.documentElement;

  const h1 = [...main.querySelectorAll('h1')].map((el) =>
    (el.textContent ?? '').replace(/\s+/g, ' ').trim()
  );

  const headings = [...main.querySelectorAll('h1, h2, h3, h4, h5, h6')].map(
    (el) => `${el.tagName.toLowerCase()}:${(el.textContent ?? '').replace(/\s+/g, ' ').trim()}`
  );

  // JSON-LD is emitted inside the component tree by PageSEO, so it is genuinely
  // in the render — but it sits outside <main>, hence the document-wide query.
  const jsonLd = [...doc.querySelectorAll('script[type="application/ld+json"]')]
    .map((el) => normalizeJsonLd(el.textContent ?? ''))
    .map(digest)
    .sort();

  const outgoingLinks = [...main.querySelectorAll('a[href]')]
    .map((a) => ({
      href: a.getAttribute('href') ?? '',
      text: (a.textContent ?? '').replace(/\s+/g, ' ').trim(),
    }))
    .filter((a) => a.href !== '')
    .sort((a, b) => (a.href + a.text < b.href + b.text ? -1 : 1));

  const text = visibleText(main.innerHTML);

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
    headings,
    textLength: text.length,
    textDigest: digest(text),
    jsonLd,
    outgoingLinks,
  };
}

/**
 * Where in the source tree each protected route is linked FROM, and how often.
 *
 * The brief freezes inbound link topology, not just the pages themselves: a new
 * contextual link pointing at an experiment changes the internal link equity
 * reaching it and contaminates the measurement.
 *
 * Deliberately a PER-FILE map rather than one total. A total is blind to the
 * case that actually happens during a redesign — a link moved from one page to
 * another nets to zero and passes, while the link graph has changed. Per file,
 * that move is two diffs.
 *
 * The count is of raw string occurrences rather than of parsed anchors: it is a
 * tripwire, and a false positive that makes someone read the diff is the correct
 * failure mode.
 */
export function countPathOccurrences(
  sources: ReadonlyMap<string, string>,
  path: string
): Record<string, number> {
  // Bounded on BOTH sides: on the right so /bayreuth/webdesign does not also
  // count /bayreuth/webdesign-kosten, and on the left so /kosten-ki-telefonassistent
  // is not matched inside /irgendwas/kosten-ki-telefonassistent.
  const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(?<![\\w/-])${escaped}(?![\\w/-])`, 'g');

  const byFile: Record<string, number> = {};
  for (const [file, content] of sources) {
    // Compiled once above; lastIndex is reset per file because /g is stateful.
    pattern.lastIndex = 0;
    const hits = content.match(pattern)?.length ?? 0;
    if (hits > 0) byFile[file] = hits;
  }
  return byFile;
}
