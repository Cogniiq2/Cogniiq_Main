import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The full route table is mounted here, so the modules the tree touches at import time are stubbed
// exactly as in src/App.routing.test.tsx.
const mocks = vi.hoisted(() => ({
  auth: {
    isLoading: false,
    authTimedOut: false,
    user: null,
    profile: null,
    session: null,
    memberships: [],
    activeOrganizationId: null,
    isPlatformAdmin: false,
    isPlatformOwner: false,
    authError: null,
    setActiveOrganizationId: vi.fn(),
    refreshAccount: vi.fn(async () => {}),
    retryAuth: vi.fn(async () => {}),
    signOut: vi.fn(async () => {}),
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mocks.auth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      updateUser: vi.fn(async () => ({ error: null })),
      getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  },
}));

const { AppInner, AppShell } = await import('@/App');

// The page asks its own API for stock on mount. These tests are about isolation
// and indexability, so the endpoint is stubbed with an empty apartment.
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ apartment: 'designaparts2', stock: {} }), { status: 200 }))
  );
  window.sessionStorage.clear();
  window.localStorage.clear();
  // The apartment is the first thing the page establishes. These tests are
  // about the catalogue behind the gate, so it is answered up front; the gate
  // itself has its own case below.
  window.sessionStorage.setItem('bolagio:private-bar:apartment:v1', APARTMENT);
});

afterEach(() => {
  vi.unstubAllGlobals();
  window.sessionStorage.clear();
});
const { isPrivateBarSurface, PRIVATE_ROBOTS, DEFAULT_ROBOTS } = await import(
  '@/lib/routing/indexability'
);
const { isKnownPublicRoute } = await import('@/lib/routing/publicRoutePaths');
const { PUBLIC_ROUTES } = await import('@/lib/routing/publicRoutes');
const { productsForApartment } = await import('@/private-bar/catalog');
const { strings } = await import('@/private-bar/strings');
const { APARTMENTS } = await import('@/private-bar/apartments');

/** These assertions are about the legacy nine-product catalogue. */
const APARTMENT = 'designaparts2';
const CATALOGUE = productsForApartment(APARTMENT);

// One route by design: this version hands payment to PayPal and never learns the
// outcome, so there is no provider return to receive and no surface that could
// imply a payment was verified.
const PRIVATE_BAR_PATHS = ['/private-bar'];

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppInner />
    </MemoryRouter>
  );
}

describe('Private Bar routes', () => {
  it('asks which apartment first, and shows no product before the answer', async () => {
    window.sessionStorage.clear();
    renderAt('/private-bar');
    expect(await screen.findByText(strings.apartment.heading)).toBeInTheDocument();

    // No catalogue flash: not one product, price or add control exists yet.
    for (const product of CATALOGUE) expect(screen.queryByText(product.name)).toBeNull();
    for (const product of productsForApartment('designaparts1')) {
      expect(screen.queryByText(product.name)).toBeNull();
    }
    expect(screen.queryByText(/€/)).toBeNull();
    expect(screen.queryByRole('button', { name: /hinzufügen/i })).toBeNull();

    // Both apartments are offered, by label — never by their internal id.
    for (const apartment of Object.values(APARTMENTS)) {
      expect(
        screen.getByRole('button', { name: strings.apartment.chooseAria(apartment.label) })
      ).toBeInTheDocument();
      expect(document.body.textContent).not.toContain(apartment.apartmentId);
    }
  });

  it('renders the catalogue, not the 404 page', async () => {
    renderAt('/private-bar');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      strings.brand.wordmark
    );
    for (const product of CATALOGUE) {
      expect(await screen.findByText(product.name)).toBeInTheDocument();
    }
  });

  it.each(PRIVATE_BAR_PATHS)('renders %s outside the Cogniiq marketing layout', async (path) => {
    const { container } = renderAt(path);
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());

    // No Cogniiq chrome of any kind.
    expect(container.querySelector('header#main-header, nav')).toBeNull();
    expect(container.querySelector('footer')).toBeNull();
    expect(screen.queryByText(/Cogniiq/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /menü|menu/i })).toBeNull();
  });

  it.each(PRIVATE_BAR_PATHS)('offers no route out of %s into Cogniiq', async (path) => {
    const { container } = renderAt(path);
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());

    const hrefs = [...container.querySelectorAll('a[href]')].map((a) => a.getAttribute('href') ?? '');
    for (const href of hrefs) {
      expect(href.startsWith('/private-bar')).toBe(true);
    }
  });

  it('marks every Private Bar path as its own surface, not a private Cogniiq surface', () => {
    for (const path of PRIVATE_BAR_PATHS) {
      expect(isPrivateBarSurface(path)).toBe(true);
    }
    expect(isPrivateBarSurface('/')).toBe(false);
    expect(isPrivateBarSurface('/private-barometer')).toBe(false);
  });

  it('is a known public path (so it is prerendered) but is served noindex', async () => {
    for (const path of PRIVATE_BAR_PATHS) {
      expect(isKnownPublicRoute(path)).toBe(true);
    }
    // The robots manager lives in AppShell (above the route table), so the shell is
    // what has to be mounted to observe the hydrated head.
    render(
      <MemoryRouter initialEntries={['/private-bar']}>
        <AppShell />
      </MemoryRouter>
    );
    await waitFor(() => {
      const robots = document.querySelector('meta[name="robots"]')?.getAttribute('content');
      expect(robots).toBe(PRIVATE_ROBOTS);
      expect(robots).not.toBe(DEFAULT_ROBOTS);
    });
  });

  it('registers no payment-return surfaces', async () => {
    for (const path of ['/private-bar/success', '/private-bar/cancel']) {
      const view = renderAt(path);
      // The catch-all answers instead: these routes do not exist.
      await waitFor(() => expect(screen.queryByText(strings.intro.heading)).toBeNull());
      view.unmount();
    }
  });

  it('renders the Guest Experience preview without claiming the service is live', async () => {
    renderAt('/private-bar');
    expect(await screen.findByText(strings.guestExperience.heading)).toBeInTheDocument();
    // "Private Bar" is also the header's product line, so the rows are read from
    // the section itself rather than from the whole document.
    const section = screen.getByRole('region', { name: strings.guestExperience.heading });
    for (const item of strings.guestExperience.items) {
      expect(within(section).getByText(item.title)).toBeInTheDocument();
      expect(within(section).getAllByText(item.status).length).toBeGreaterThan(0);
    }
  });

  it('prices every product from the catalogue and from nowhere else', async () => {
    renderAt('/private-bar');
    await screen.findByRole('heading', { level: 1 });
    for (const product of CATALOGUE) {
      expect(product.priceCents, `${product.id} has no price`).toBeGreaterThan(0);
    }
    // Every price on the page is a formatted euro amount, never a placeholder.
    expect(screen.queryByText(strings.catalogue.priceUnconfigured)).toBeNull();
    expect(screen.getAllByText(/€/).length).toBeGreaterThanOrEqual(CATALOGUE.length);
  });

  it('offers nothing while stock is unknown — availability fails closed', async () => {
    renderAt('/private-bar');
    await screen.findByRole('heading', { level: 1 });
    await waitFor(() =>
      expect(screen.getAllByText(strings.catalogue.unavailable).length).toBe(CATALOGUE.length)
    );
    expect(screen.queryByRole('button', { name: /hinzufügen/i })).toBeNull();
  });

  it('is in the route manifest as non-indexable, so it is prerendered but never in the sitemap', () => {
    for (const path of PRIVATE_BAR_PATHS) {
      const route = PUBLIC_ROUTES.find((r) => r.path === path);
      expect(route, `${path} is missing from the route manifest`).toBeDefined();
      expect(route?.indexable).toBe(false);
      expect(route?.sitemap).toBeUndefined();
    }
  });

  it('uses the same document title as the manifest writes into the prerendered head', () => {
    expect(PUBLIC_ROUTES.find((r) => r.path === '/private-bar')?.title).toBe(strings.documentTitle);
  });

  it('states no payment outcome anywhere in the served surface', async () => {
    const { container } = renderAt('/private-bar');
    await screen.findByRole('heading', { level: 1 });
    const text = container.textContent ?? '';
    for (const forbidden of [
      /zahlung (erhalten|bestätigt|eingegangen)/i,
      /erfolgreich bezahlt/i,
      /payment (confirmed|received)/i,
    ]) {
      expect(text).not.toMatch(forbidden);
    }
  });

  it('leaves the marketing shell untouched for a public Cogniiq path', async () => {
    const { container } = renderAt('/');
    await waitFor(() => expect(container.querySelector('nav')).toBeInTheDocument());
  });
});
