// Server-side rendering contract for the build-time prerenderer.
//
// IMPORTANT: this file must never also mount a CLIENT root. react-dom and
// react-dom/server keep separate context stacks only when they run as primary
// and secondary renderers; running both against the same React context objects
// in one realm makes react-router's LocationContext leak from the server render
// into the client render ("You cannot render a <Router> inside another
// <Router>"). That is an artifact of doing both in one process — the real build
// renders in Node and the browser hydrates in a different realm entirely.
// Hydration parity is therefore verified against the real built artifact in
// src/prerender.hydration.test.tsx.
import { Suspense, lazy } from 'react';
import { describe, expect, it, vi } from 'vitest';

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

const { render, renderElement } = await import('./entry-server');
const { PUBLIC_ROUTES } = await import('./lib/routing/publicRoutes');

function visibleText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

describe('prerendered pages carry content without client JavaScript', () => {
  it('renders substantial German marketing copy for the homepage', async () => {
    const { html } = await render('/', 30_000);
    const text = visibleText(html);
    expect(text).toMatch(/Cogniiq/);
    expect(text.length).toBeGreaterThan(1000);
  }, 60_000);

  it('renders page-specific copy, not a shared shell, on a deep cluster page', async () => {
    const { html } = await render('/bayreuth/lokales-seo', 30_000);
    const text = visibleText(html);
    expect(text).toMatch(/Bayreuth/);
    expect(text.length).toBeGreaterThan(1000);
  }, 60_000);

  it('renders the 404 page content at an unrouted path', async () => {
    const { html } = await render('/404', 30_000);
    expect(html).toMatch(/Diese Seite existiert nicht/);
  }, 60_000);

  it('renders the marketing shell (nav + footer) on a public page', async () => {
    const { html } = await render('/impressum', 30_000);
    expect(html).toMatch(/<main id="main-content"/);
    expect(html).toMatch(/<footer/);
  }, 60_000);
});

describe('the manifest matches what the renderer can serve', () => {
  it('renders every distinct top-level section without error', async () => {
    // One representative per shape of route, rather than all 88 (that is the
    // build's job) — enough to catch a whole family breaking.
    const samples = ['/', '/leistungen', '/blog', '/blog/lokales-seo-unternehmen', '/anfrage-erhalten'];
    for (const path of samples) {
      expect(PUBLIC_ROUTES.some((r) => r.path === path)).toBe(true);
      const { html } = await render(path, 30_000);
      expect(visibleText(html).length).toBeGreaterThan(200);
    }
  }, 120_000);
});

describe('renderElement failure behaviour', () => {
  it('rejects on timeout instead of resolving with partial HTML', async () => {
    // A lazy import that never settles: the render can never complete, so the
    // only way out is the deadline. Proves the build cannot hang forever and
    // cannot emit a half-rendered document.
    const NeverResolves = lazy(() => new Promise<never>(() => {}));
    await expect(
      renderElement(
        <Suspense fallback={null}>
          <NeverResolves />
        </Suspense>,
        '/never',
        50
      )
    ).rejects.toThrow(/timed out after 50ms/i);
  }, 20_000);

  it('rejects when a lazy import fails rather than emitting a page with a hole', async () => {
    const Broken = lazy(() => Promise.reject(new Error('chunk load failed')));
    await expect(
      renderElement(
        <Suspense fallback={null}>
          <Broken />
        </Suspense>,
        '/broken',
        10_000
      )
    ).rejects.toThrow(/chunk load failed/);
  }, 20_000);
});
