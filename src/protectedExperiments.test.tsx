// ─────────────────────────────────────────────────────────────────────────────
// REGRESSION GUARD FOR THE SIX FROZEN SEO EXPERIMENTS.
//
// These routes are measuring live search performance. The measurement is only
// valid while the crawled page stays identical, so this test re-renders each of
// them through the real SSR entry and compares a fingerprint — head metadata,
// H1s, body copy, JSON-LD, outgoing anchors — against the committed baseline in
// src/test/fixtures/protected-experiments.baseline.json.
//
// It also counts, across the whole source tree, how many places link INTO each
// experiment. A contextual link added on any other page changes the internal
// link equity flowing in and contaminates the result, and no per-page render
// would catch that.
//
// If this test fails, the correct response is almost never to update the
// baseline. It is to take the change back off the protected route and record
// the idea in docs/seo/post-experiment-opportunities.md instead.
//
// When an experiment genuinely concludes, `npm run seo:baseline` re-records the
// fixture. That is a separate named command rather than `vitest -u` on purpose:
// see src/lib/routing/protectedExperiments.ts for why.
// ─────────────────────────────────────────────────────────────────────────────
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { afterAll, describe, expect, it, vi } from 'vitest';

// Same Supabase stub as src/entry-server.test.tsx: the marketing shell reads the
// auth session on mount, and these tests are about markup, not authentication.
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      updateUser: vi.fn(async () => ({ error: null })),
      signOut: vi.fn(async () => ({ error: null })),
    },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
    }),
  },
}));

const { render } = await import('./entry-server');
const { PUBLIC_ROUTES } = await import('./lib/routing/publicRoutes');
const { PROTECTED_EXPERIMENT_PATHS, fingerprintExperiment, countPathOccurrences } = await import(
  './lib/routing/protectedExperiments'
);

// vitest resolves import.meta.url to a Vite '/@fs/...' URL, which is not a
// filesystem path. The runner's cwd is the repo root (vitest.config.ts sits
// there), so that is the anchor for every file this suite reads.
const REPO_ROOT = process.cwd();
const FIXTURE = join(REPO_ROOT, 'src/test/fixtures/protected-experiments.baseline.json');

// Set only by `npm run seo:baseline`. In this mode the suite records what it
// renders instead of asserting against the fixture.
const RECORDING = process.env.SEO_RECORD_PROTECTED_BASELINE === '1';

interface Baseline {
  readonly fingerprints: Record<string, unknown>;
  /** protected path -> source file -> number of occurrences in that file. */
  readonly inboundOccurrences: Record<string, Record<string, number>>;
}

const EMPTY_BASELINE: Baseline = { fingerprints: {}, inboundOccurrences: {} };
const baseline: Baseline =
  !RECORDING || existsSync(FIXTURE)
    ? (JSON.parse(readFileSync(FIXTURE, 'utf8')) as Baseline)
    : EMPTY_BASELINE;

// Mutable counterpart of Baseline: the recording pass fills this in as the
// suite renders, so its fields cannot carry Baseline's `readonly`.
const recorded: {
  fingerprints: Record<string, unknown>;
  inboundOccurrences: Record<string, Record<string, number>>;
} = { fingerprints: {}, inboundOccurrences: {} };

function parseHtml(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html');
}

// The guard's own files name all six paths by definition; counting them would
// make the baseline self-referential and would not survive editing this comment.
const EXCLUDED_FROM_SCAN = new Set([
  'src/lib/routing/protectedExperiments.ts',
  'src/protectedExperiments.test.tsx',
  'src/test/fixtures/protected-experiments.baseline.json',
]);

/**
 * Every file that could carry an internal link, keyed by repo-relative path.
 *
 * Scans more than src/: public/sitemap.xml, public/_redirects, index.html and
 * the build scripts can all name a route, and a redirect added to a protected
 * route changes its topology just as much as an anchor does.
 */
const SCAN_ROOTS = ['src', 'public', 'scripts', '.github/scripts', 'functions'];

function collectSources(dir: string, out = new Map<string, string>()): Map<string, string> {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.git' || entry === 'dist' || entry === 'dist-ssr') {
      continue;
    }
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectSources(full, out);
      continue;
    }
    if (!/\.(tsx?|mts|mjs|json|html|xml|txt|_redirects|_headers)$/.test(entry) && !/^_(redirects|headers)$/.test(entry))
      continue;
    const key = relative(REPO_ROOT, full);
    if (EXCLUDED_FROM_SCAN.has(key)) continue;
    out.set(key, readFileSync(full, 'utf8'));
  }
  return out;
}

afterAll(() => {
  if (!RECORDING) return;
  mkdirSync(dirname(FIXTURE), { recursive: true });
  writeFileSync(
    FIXTURE,
    `${JSON.stringify(
      {
        _comment:
          'Recorded by `npm run seo:baseline`. Frozen fingerprints of the six live SEO ' +
          'experiments; see src/lib/routing/protectedExperiments.ts. Do not hand-edit, and do ' +
          'not regenerate to make a failing build pass — a diff here means a protected page moved.',
        ...recorded,
      },
      null,
      2
    )}\n`
  );
});

describe('the frozen SEO experiments have not drifted', () => {
  it('freezes exactly the six documented routes, all of them real', () => {
    expect([...PROTECTED_EXPERIMENT_PATHS].sort()).toEqual([
      '/bayreuth/webdesign',
      '/bayreuth/website-relaunch',
      '/ki-telefonassistent-arzt',
      '/kosten-ki-telefonassistent',
      '/muenchen/webdesign-kosten',
      '/regensburg/website-relaunch',
    ]);
    for (const path of PROTECTED_EXPERIMENT_PATHS) {
      expect(PUBLIC_ROUTES.some((r) => r.path === path), `${path} is not a public route`).toBe(true);
    }
    if (RECORDING) return;
    expect(Object.keys(baseline.fingerprints).sort()).toEqual(
      [...PROTECTED_EXPERIMENT_PATHS].sort()
    );
  });

  // One `it` per route so a failure names the page that moved rather than
  // reporting "the experiments changed".
  for (const path of PROTECTED_EXPERIMENT_PATHS) {
    it(`renders ${path} exactly as the baseline recorded it`, async () => {
      const { html } = await render(path, 30_000);
      // Round-tripped through JSON so readonly arrays compare as plain data.
      const actual = JSON.parse(JSON.stringify(fingerprintExperiment(path, html, parseHtml)));
      if (RECORDING) {
        recorded.fingerprints[path] = actual;
        return;
      }
      // Compared as one object: a single diff shows every field that moved,
      // instead of stopping at the first.
      expect(actual).toEqual(baseline.fingerprints[path]);
    }, 60_000);
  }

  it('has not changed which files link into an experiment, or how often', () => {
    const sources = new Map<string, string>();
    for (const root of SCAN_ROOTS) collectSources(join(REPO_ROOT, root), sources);
    const actual: Record<string, Record<string, number>> = {};
    for (const path of PROTECTED_EXPERIMENT_PATHS) {
      actual[path] = countPathOccurrences(sources, path);
    }
    if (RECORDING) {
      recorded.inboundOccurrences = actual;
      return;
    }
    // Adding a link to a protected route is the failure this exists for; so is
    // removing one, and so is moving one from page to page — which a bare total
    // would net to zero. Each changes internal link equity mid-experiment.
    expect(actual).toEqual(baseline.inboundOccurrences);
  });
});
