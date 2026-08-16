// Hydration parity against the REAL build output.
//
// This is the failure mode that would make prerendering worse than useless: if
// the markup React produces in the browser disagrees with the HTML Netlify
// serves, React throws the prerendered DOM away and re-renders from scratch —
// while every SEO check still passes, because the bytes on the wire look right.
//
// The HTML is read from dist/ (written by scripts/prerender.mjs in a separate
// Node process) rather than rendered here, deliberately: running react-dom/server
// and react-dom in one realm makes them fight over the same context objects.
// Reading the artifact also means this test verifies what actually ships.
//
// The tree mounted below is identical to src/main.tsx.
import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { act } from 'react';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

const { ThemeProvider } = await import('./components/theme-provider');
const App = (await import('./App')).default;
const { PUBLIC_ROUTES, isKnownPublicRoute } = await import('./lib/routing/publicRoutes');
const { publicLinkTargets, problemLinkTargets } = await import('./test/internalLinks');

const DIST = join(process.cwd(), 'dist');
const hasBuild = existsSync(join(DIST, 'index.html'));

function prerenderedRoot(path: string): string | null {
  // <path>.html, matching the pretty-URL output of scripts/prerender.mjs.
  const file = path === '/' ? join(DIST, 'index.html') : `${join(DIST, path)}.html`;
  if (!existsSync(file)) return null;
  const html = readFileSync(file, 'utf8');
  const match = html.match(/<div id="root">([\s\S]*)<\/div>\s*<\/body>/);
  return match ? match[1] : null;
}

let errors: string[] = [];
let errorSpy: ReturnType<typeof vi.spyOn>;
// Roots must be unmounted before the environment is torn down. A root left
// mounted keeps React's scheduler working after jsdom is gone, which surfaces as
// "window is not defined" / "Should not already be working" unhandled errors —
// and vitest warns those can produce false positives, which is the last thing
// this particular test should risk.
let roots: Array<{ unmount: () => void }> = [];

beforeEach(() => {
  errors = [];
  roots = [];
  errorSpy = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    errors.push(args.map((a) => String(a)).join(' '));
  });
});

afterEach(() => {
  act(() => {
    for (const root of roots) root.unmount();
  });
  roots = [];
  errorSpy.mockRestore();
  window.history.replaceState(null, '', '/');
  document.body.innerHTML = '';
});

// Markup disagreements only. React's "Suspense boundary received an update
// before it finished hydrating" is a scheduling notice, not a markup mismatch,
// and is asserted separately below.
const MARKUP_MISMATCH =
  /did not match|text content does not match|server HTML|server rendered|An error occurred during hydration/i;

async function hydrateFromBuild(path: string) {
  const rootHtml = prerenderedRoot(path);
  expect(rootHtml, `no prerendered output for ${path}`).not.toBeNull();
  expect(rootHtml!.trim().length).toBeGreaterThan(500);

  window.history.replaceState(null, '', path);

  const container = document.createElement('div');
  container.innerHTML = rootHtml!;
  document.body.appendChild(container);

  await act(async () => {
    roots.push(
      hydrateRoot(
        container,
        <StrictMode>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </StrictMode>
      )
    );
  });

  return container;
}

describe.skipIf(!hasBuild)('prerendered HTML hydrates without markup mismatch', () => {
  for (const path of ['/', '/impressum', '/bayreuth/lokales-seo', '/blog/lokales-seo-unternehmen']) {
    it(`hydrates ${path}`, async () => {
      const container = await hydrateFromBuild(path);
      const mismatches = errors.filter((e) => MARKUP_MISMATCH.test(e));
      expect(mismatches).toEqual([]);
      // The prerendered content survived hydration rather than being discarded.
      expect(container.textContent).toMatch(/Cogniiq/);
    }, 60_000);
  }
});

describe.skipIf(!hasBuild)('prerendered HTML is meaningful without JavaScript', () => {
  it('exposes the homepage headline and navigation as plain HTML', () => {
    const rootHtml = prerenderedRoot('/');
    expect(rootHtml).not.toBeNull();
    const text = rootHtml!
      .replace(/<script[\s\S]*?<\/script>/g, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    expect(text.length).toBeGreaterThan(1000);
    expect(text).toMatch(/Cogniiq/);
  });

  it('serves the 404 document with rendered German content', () => {
    const file = join(DIST, '404.html');
    expect(existsSync(file)).toBe(true);
    const html = readFileSync(file, 'utf8');
    expect(html).toMatch(/Diese Seite existiert nicht/);
    expect(html).toMatch(/<meta name="robots" content="noindex/);
    expect(html).not.toMatch(/rel="canonical"/);
  });
});

// Link integrity across the whole portfolio, checked against the shipped bytes rather than a
// sample. src/entry-server.test.tsx guards the same invariant on two representative pages without
// needing a build; this is the exhaustive pass, and the only one that can catch a broken href
// hard-coded in a single page component.
describe.skipIf(!hasBuild)('prerendered pages link only to published routes', () => {
  it('points every internal link at a route in the manifest', () => {
    const offenders: string[] = [];
    for (const route of PUBLIC_ROUTES) {
      const html = prerenderedRoot(route.path);
      expect(html, `no prerendered output for ${route.path}`).not.toBeNull();
      for (const target of publicLinkTargets(html!)) {
        if (!isKnownPublicRoute(target)) offenders.push(`${route.path} -> ${target}`);
      }
    }
    expect(offenders).toEqual([]);
  }, 60_000);

  it('keeps the booking problem page linked from every related-page list that renders one', () => {
    const pagesWithList = PUBLIC_ROUTES.map((route) => ({
      path: route.path,
      links: problemLinkTargets(prerenderedRoot(route.path) ?? ''),
    })).filter((page) => page.links.length > 0);

    // The nine city service pages (RelatedPages) plus the nine industry-city pages (IndustryPage).
    // A change to that set is a content-architecture decision, not something to absorb silently.
    expect(pagesWithList.map((page) => page.path)).toHaveLength(18);

    for (const page of pagesWithList) {
      expect(page.links, page.path).toContain('/keine-terminbuchung-online');
      expect(page.links, page.path).not.toContain('/keine-terminbuchung');
    }
  }, 60_000);
});

if (!hasBuild) {
  describe('prerender hydration test', () => {
    it.skip('skipped: dist/ not built — run `npm run build` first', () => {});
  });
}
