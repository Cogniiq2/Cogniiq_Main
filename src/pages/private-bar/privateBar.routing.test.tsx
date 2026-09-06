import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

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
const { isPrivateBarSurface, PRIVATE_ROBOTS, DEFAULT_ROBOTS } = await import(
  '@/lib/routing/indexability'
);
const { isKnownPublicRoute } = await import('@/lib/routing/publicRoutePaths');
const { PUBLIC_ROUTES } = await import('@/lib/routing/publicRoutes');
const { PRIVATE_BAR_CATALOG } = await import('@/private-bar/catalog');
const { strings } = await import('@/private-bar/strings');

const PRIVATE_BAR_PATHS = ['/private-bar', '/private-bar/success', '/private-bar/cancel'];

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppInner />
    </MemoryRouter>
  );
}

describe('Private Bar routes', () => {
  it('renders the catalogue, not the 404 page', async () => {
    renderAt('/private-bar');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      strings.brand.wordmark
    );
    for (const product of PRIVATE_BAR_CATALOG) {
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

  it('never claims a payment on the success surface', async () => {
    renderAt('/private-bar/success');
    expect(
      await screen.findByRole('heading', { level: 1, name: strings.success.unavailableHeading })
    ).toBeInTheDocument();
    expect(screen.queryByText(strings.success.paidHeading)).toBeNull();
    expect(screen.queryByText(strings.success.paidBody)).toBeNull();
  });

  it('shows no price and no purchase control while no price is configured', async () => {
    renderAt('/private-bar');
    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByText(/€/)).toBeNull();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.getAllByText(strings.catalogue.priceUnconfigured).length).toBe(
      PRIVATE_BAR_CATALOG.length
    );
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
    const titles = {
      '/private-bar': strings.documentTitles.bar,
      '/private-bar/success': strings.documentTitles.success,
      '/private-bar/cancel': strings.documentTitles.cancel,
    } as const;
    for (const [path, title] of Object.entries(titles)) {
      expect(PUBLIC_ROUTES.find((r) => r.path === path)?.title).toBe(title);
    }
  });

  it('leaves the marketing shell untouched for a public Cogniiq path', async () => {
    const { container } = renderAt('/');
    await waitFor(() => expect(container.querySelector('nav')).toBeInTheDocument());
  });
});
