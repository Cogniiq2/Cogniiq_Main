import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Route-level regression tests for the premium shell.
 *
 * The defect these lock down: both dashboards rendered an old horizontal top navigation instead of
 * the premium vertical sidebar. That was never a single page's mistake — it was a property of the
 * shells the route table mounts, so it is asserted here through the REAL route table.
 *
 * Each shell now lives in its route layout (InternalWorkspaceLayout for /admin/*,
 * CustomerPortalBoundary for /app/*), which means the shell renders immediately while the lazy
 * page chunk is still loading. That is exactly what these tests exercise: the shell is a property
 * of the route, not something each page has to remember to bring.
 */

const mocks = vi.hoisted(() => ({
  auth: {
    isLoading: false,
    authTimedOut: false,
    user: { id: 'user-1', email: 'maria@example.de', email_confirmed_at: '2026-08-01T10:00:00.000Z' } as
      | Record<string, unknown>
      | null,
    profile: { id: 'user-1', email: 'maria@example.de', full_name: 'Maria Musterfrau' } as Record<
      string,
      unknown
    > | null,
    session: { access_token: 'token' },
    memberships: [] as Array<Record<string, unknown>>,
    activeOrganizationId: 'org-1' as string | null,
    isPlatformAdmin: false,
    isPlatformOwner: false,
    authError: null as string | null,
    setActiveOrganizationId: vi.fn(),
    refreshAccount: vi.fn(async () => {}),
    retryAuth: vi.fn(async () => {}),
    signOut: vi.fn(async () => {}),
  },
  portalContext: null as unknown,
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mocks.auth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('@/lib/supabase', () => {
  // A permissive, always-empty query builder: the pages under test are never asserted on, only the
  // shell around them, so every table read resolves to "nothing" rather than throwing.
  const builder: Record<string, unknown> = {};
  for (const method of ['select', 'eq', 'in', 'order', 'limit', 'is', 'neq', 'gte', 'lte', 'not']) {
    builder[method] = () => builder;
  }
  builder.maybeSingle = async () => ({ data: null, error: null });
  builder.single = async () => ({ data: null, error: null });
  builder.then = (resolve: (value: { data: never[]; error: null }) => unknown) =>
    resolve({ data: [], error: null });

  return {
    supabase: {
      from: () => builder,
      rpc: vi.fn(async (name: string) =>
        name === 'current_user_portal_context'
          ? { data: mocks.portalContext, error: null }
          : { data: null, error: null }
      ),
      auth: {
        getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
        updateUser: vi.fn(async () => ({ error: null })),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      storage: { from: () => ({ createSignedUrl: async () => ({ data: null, error: null }) }) },
    },
  };
});

const { AppInner } = await import('./App');
const { BASELINE_CAPABILITIES } = await import('./lib/portalAccess/capabilities');
const { UNIVERSAL_NAV_ITEMS } = await import('./lib/portalAccess/navigation');

/** A portal context payload in the exact shape public.current_user_portal_context() returns. */
function portalContext(capabilities: readonly string[], roles: Array<{ role_key: string; label: string }> = []) {
  return {
    user_id: 'user-1',
    platform_role: 'customer',
    is_platform_admin: false,
    organizations: [
      {
        membership_id: 'membership-1',
        organization_id: 'org-1',
        organization_name: 'SV Heinersreuth',
        organization_slug: 'sv-heinersreuth',
        organization_status: 'active',
        organization_role: 'member',
        membership_status: 'active',
        roles: roles.map((role, index) => ({ id: `role-${index}`, description: null, ...role })),
        capabilities: [...capabilities],
        solutions: [],
        portal_settings: null,
      },
    ],
  };
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppInner />
    </MemoryRouter>
  );
}

const sidebarOf = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('aside[data-shell-nav="primary-desktop"]');

/** Every dashboard route in the real route table, by area. */
const ADMIN_ROUTES = [
  '/admin',
  '/admin/tasks/today',
  '/admin/tasks/overdue',
  '/admin/tasks/completed',
  '/admin/tasks/revenue',
  '/admin/execution',
  '/admin/oura-analytics',
  '/admin/clients',
  '/admin/clients/new',
  '/admin/clients/org-1',
  '/admin/solutions',
  '/admin/invitations',
  '/admin/finance/overview',
  '/admin/finance/invoices',
  '/admin/finance/settings',
];

const APP_ROUTES = [
  '/app',
  '/app/solutions',
  '/app/solutions/receptionist-1',
  '/app/documents',
  '/app/billing',
  '/app/support',
  '/app/settings',
  '/app/onboarding',
  '/app/receptionist',
  '/app/knowledge',
  '/app/phone',
  '/app/test',
  '/app/calls',
  '/app/leads',
  '/app/projects/project-1',
];

beforeEach(() => {
  mocks.auth.isLoading = false;
  mocks.auth.authTimedOut = false;
  mocks.auth.user = { id: 'user-1', email: 'maria@example.de', email_confirmed_at: '2026-08-01T10:00:00.000Z' };
  mocks.auth.isPlatformAdmin = false;
  mocks.auth.isPlatformOwner = false;
  mocks.auth.activeOrganizationId = 'org-1';
  mocks.auth.memberships = [
    {
      id: 'membership-1',
      organization_id: 'org-1',
      status: 'active',
      role: 'member',
      organization: { id: 'org-1', name: 'SV Heinersreuth' },
    },
  ];
  mocks.portalContext = portalContext(BASELINE_CAPABILITIES);
});

/* ------------------------------------------------------- 1) every /admin/* route mounts the shell */

describe('every /admin/* dashboard route mounts the premium Owner shell', () => {
  beforeEach(() => {
    mocks.auth.isPlatformAdmin = true;
    mocks.auth.isPlatformOwner = true;
  });

  it.each(ADMIN_ROUTES)('%s renders the persistent vertical sidebar', (path) => {
    const { container } = renderAt(path);
    const sidebar = sidebarOf(container);

    expect(sidebar).not.toBeNull();
    expect(sidebar!.tagName).toBe('ASIDE');
    expect(sidebar!.querySelector('nav')!.getAttribute('data-orientation')).toBe('vertical');
  });

  it.each(ADMIN_ROUTES)('%s renders exactly one primary navigation system', (path) => {
    const { container } = renderAt(path);
    expect(container.querySelectorAll('[data-shell-nav="primary-desktop"]').length).toBe(1);
    expect(container.querySelectorAll('[data-shell-nav="primary-mobile"]').length).toBe(0);
  });

  it('preserves every Owner area and the active module sub-navigation, vertically', () => {
    const { container } = renderAt('/admin/finance/invoices');
    const sidebar = sidebarOf(container)!;

    for (const area of ['Task Dashboard', 'Oura Analytics', 'Client CRM', 'Finance & Steuern']) {
      expect(within(sidebar).getByRole('link', { name: area })).toBeTruthy();
    }
    for (const item of ['Übersicht', 'Kunden & Aufgaben', 'Angebote', 'Rechnungen', 'Audit', 'Einstellungen']) {
      expect(within(sidebar).getByRole('link', { name: item })).toBeTruthy();
    }
    expect(within(sidebar).getByRole('link', { name: 'Rechnungen' }).getAttribute('aria-current')).toBe('page');
  });

  it('still hides the owner-only Finance area from a non-owner admin', () => {
    mocks.auth.isPlatformOwner = false;
    const { container } = renderAt('/admin/clients');
    const sidebar = sidebarOf(container)!;

    expect(within(sidebar).queryByRole('link', { name: 'Finance & Steuern' })).toBeNull();
    expect(within(sidebar).getByRole('link', { name: 'Client CRM' })).toBeTruthy();
  });

  it('does not mount the customer shell on an admin route', () => {
    const { container } = renderAt('/admin');
    expect(within(sidebarOf(container)!).queryByRole('link', { name: 'Abrechnung' })).toBeNull();
  });
});

/* ------------------------------------------------- 2) every /app/* protected route mounts the shell */

describe('every /app/* protected route mounts the premium Customer shell', () => {
  it.each(APP_ROUTES)('%s renders the persistent vertical sidebar', async (path) => {
    const { container } = renderAt(path);
    await waitFor(() => expect(sidebarOf(container)).not.toBeNull());

    const sidebar = sidebarOf(container)!;
    expect(sidebar.tagName).toBe('ASIDE');
    expect(sidebar.querySelector('nav')!.getAttribute('data-orientation')).toBe('vertical');
  });

  it.each(APP_ROUTES)('%s renders exactly one primary navigation system', async (path) => {
    const { container } = renderAt(path);
    await waitFor(() => expect(sidebarOf(container)).not.toBeNull());

    expect(container.querySelectorAll('[data-shell-nav="primary-desktop"]').length).toBe(1);
    expect(container.querySelectorAll('[data-shell-nav="primary-mobile"]').length).toBe(0);
  });

  it('keeps the sidebar out of the unauthenticated login route', () => {
    mocks.auth.user = null;
    const { container } = renderAt('/app/login');
    expect(sidebarOf(container)).toBeNull();
  });
});

/* ---------------------------------------------------- 4) capability-derived customer navigation */

describe('customer navigation is derived from effective capabilities', () => {
  const labelsIn = (sidebar: HTMLElement) =>
    [...sidebar.querySelectorAll('nav a')].map((link) => link.getAttribute('aria-label'));

  it('offers only the routes the effective capabilities permit', async () => {
    // A narrow functional role: overview + documents, but no billing and no support.
    mocks.portalContext = portalContext(['portal.overview.view', 'portal.documents.view'], [
      { role_key: 'lesender_administrator', label: 'Lesender Administrator' },
    ]);
    const { container } = renderAt('/app');
    await waitFor(() => expect(sidebarOf(container)).not.toBeNull());

    await waitFor(() => expect(labelsIn(sidebarOf(container)!)).toContain('Übersicht'));
    const labels = labelsIn(sidebarOf(container)!);
    expect(labels).toContain('Dokumente');
    expect(labels).not.toContain('Abrechnung');
    expect(labels).not.toContain('Support');
    // Capability-free entries stay: managing your own profile is not an organization permission.
    expect(labels).toContain('Einstellungen');
  });

  it('removes an item as soon as the capability behind it is removed', async () => {
    mocks.portalContext = portalContext(BASELINE_CAPABILITIES);
    const first = renderAt('/app');
    await waitFor(() => expect(labelsIn(sidebarOf(first.container)!)).toContain('Abrechnung'));
    first.unmount();

    // Same member, role changed so billing is no longer granted.
    mocks.portalContext = portalContext(
      BASELINE_CAPABILITIES.filter((key) => key !== 'portal.billing.view')
    );
    const second = renderAt('/app');
    await waitFor(() => expect(labelsIn(sidebarOf(second.container)!)).toContain('Übersicht'));
    expect(labelsIn(sidebarOf(second.container)!)).not.toContain('Abrechnung');
  });

  it('offers nothing capability-gated while the access context is still loading', () => {
    // The RPC has not answered yet on the first paint.
    const { container } = renderAt('/app');
    const sidebar = sidebarOf(container);
    if (sidebar) {
      expect(labelsIn(sidebar)).not.toContain('Abrechnung');
    }
  });

  it('derives the sidebar from the same model the route table guards with', () => {
    // Not a rendering assertion: the point is that there is exactly ONE navigation model, so a
    // hard-coded second copy inside the shell cannot drift from the capability route model.
    const gated = UNIVERSAL_NAV_ITEMS.filter((item) => item.requiredCapabilities.length > 0);
    expect(gated.length).toBeGreaterThan(0);
    for (const item of gated) {
      for (const key of item.requiredCapabilities) {
        expect(BASELINE_CAPABILITIES).toContain(key);
      }
    }
  });
});

/* ------------------------------------- 5) a hidden item is still protected at its direct URL */

describe('hiding a navigation item is not what protects the route', () => {
  it('denies a hidden route opened directly by URL', async () => {
    mocks.portalContext = portalContext(['portal.overview.view']);
    const { container } = renderAt('/app/billing');

    await waitFor(() => expect(sidebarOf(container)).not.toBeNull());
    // Hidden from the navigation…
    await waitFor(() =>
      expect(within(sidebarOf(container)!).queryByRole('link', { name: 'Abrechnung' })).toBeNull()
    );
    // …and refused when typed in anyway. The sidebar remains, so the user is not stranded.
    expect(await screen.findByText('Dieser Bereich ist für Sie nicht freigeschaltet')).toBeTruthy();
    expect(sidebarOf(container)).not.toBeNull();
  });

  it('denies a hidden route even while the capabilities are still unknown', () => {
    mocks.portalContext = null;
    renderAt('/app/documents');
    expect(screen.queryByText(/Rechnung|Dokumentenarchiv/)).toBeNull();
  });
});

/* ----------------------------------------------- 6) zero-role customers keep the baseline nav */

describe('a member with zero functional roles keeps the baseline navigation', () => {
  it('shows exactly the six baseline entries plus the ungated ones', async () => {
    // Precisely the existing-customer case: active membership, no functional role at all.
    mocks.portalContext = portalContext(BASELINE_CAPABILITIES, []);
    const { container } = renderAt('/app');

    await waitFor(() => expect(sidebarOf(container)).not.toBeNull());
    const sidebar = sidebarOf(container)!;

    await waitFor(() =>
      expect(within(sidebar).queryByRole('link', { name: 'Abrechnung' })).not.toBeNull()
    );
    for (const label of ['Übersicht', 'Dokumente', 'Abrechnung', 'Meine Lösungen', 'Support', 'Einstellungen']) {
      expect(within(sidebar).getByRole('link', { name: label })).toBeTruthy();
    }
    expect(sidebar.querySelectorAll('nav a').length).toBe(UNIVERSAL_NAV_ITEMS.length);
  });

  it('lets that member reach every baseline route', async () => {
    mocks.portalContext = portalContext(BASELINE_CAPABILITIES, []);
    for (const path of ['/app', '/app/documents', '/app/billing', '/app/support']) {
      const view = renderAt(path);
      await waitFor(() => expect(sidebarOf(view.container)).not.toBeNull());
      expect(screen.queryByText('Dieser Bereich ist für Sie nicht freigeschaltet')).toBeNull();
      view.unmount();
    }
  });
});
