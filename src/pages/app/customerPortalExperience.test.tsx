import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Regression tests for the Customer Portal experience recovered from PR #20 and reconciled
 * with the capability architecture.
 *
 * These lock the three properties the recovery is actually FOR, all of which are invisible
 * in a screenshot and easy to lose in a later refactor:
 *
 *   1. the customer's project list is fetched ONCE per portal mount, not once per surface;
 *   2. navigating between customer routes does not remount the shell;
 *   3. the settings page never prints a raw account enum at a customer.
 *
 * They drive the REAL route table, so they fail if a page starts mounting its own shell
 * again or issues its own `list_customer_projects`.
 */

const mocks = vi.hoisted(() => ({
  auth: {
    isLoading: false,
    authTimedOut: false,
    user: { id: 'user-1', email: 'maria@example.de', email_confirmed_at: '2026-08-01T10:00:00.000Z' } as
      | Record<string, unknown>
      | null,
    profile: {
      id: 'user-1',
      email: 'maria@example.de',
      full_name: 'Maria Musterfrau',
      phone: null,
      platform_role: 'customer',
    } as Record<string, unknown> | null,
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
  rpcCalls: [] as string[],
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mocks.auth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('@/lib/supabase', () => {
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
      // Every customer read is an RPC, so recording names here is a complete record of what
      // the portal asks the database for.
      rpc: vi.fn(async (name: string) => {
        mocks.rpcCalls.push(name);
        if (name === 'current_user_portal_context') return { data: mocks.portalContext, error: null };
        return { data: [], error: null };
      }),
      auth: {
        getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
        updateUser: vi.fn(async () => ({ error: null })),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      storage: { from: () => ({ createSignedUrl: async () => ({ data: null, error: null }) }) },
      functions: { invoke: vi.fn(async () => ({ data: null, error: null })) },
    },
  };
});

const { AppInner } = await import('./../../App');
const { BASELINE_CAPABILITIES } = await import('./../../lib/portalAccess/capabilities');
const { rawCustomerAccountEnumValues } = await import('./../../lib/customerPlatform/customerLabels');

function portalContext(capabilities: readonly string[]) {
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
        roles: [],
        capabilities: [...capabilities],
        solutions: [],
        portal_settings: null,
      },
    ],
  };
}

/**
 * Renders the real route table and exposes a navigate control, so a route change goes through
 * React Router exactly as it does in the browser — the shell must survive it.
 */
function renderPortal(path: string) {
  let navigate: (to: string) => void = () => {};
  const view = render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="*"
          element={
            <NavigationProbe
              onReady={(fn) => {
                navigate = fn;
              }}
            />
          }
        />
      </Routes>
      <AppInner />
    </MemoryRouter>
  );
  return { ...view, navigate: (to: string) => navigate(to) };
}

function NavigationProbe({ onReady }: { onReady: (navigate: (to: string) => void) => void }) {
  onReady(useNavigate());
  return null;
}

const sidebarOf = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('aside[data-shell-nav="primary-desktop"]');

beforeEach(() => {
  mocks.rpcCalls = [];
  mocks.auth.isLoading = false;
  mocks.auth.user = { id: 'user-1', email: 'maria@example.de', email_confirmed_at: '2026-08-01T10:00:00.000Z' };
  mocks.auth.profile = {
    id: 'user-1',
    email: 'maria@example.de',
    full_name: 'Maria Musterfrau',
    phone: null,
    platform_role: 'customer',
  };
  mocks.auth.isPlatformAdmin = false;
  mocks.auth.activeOrganizationId = 'org-1';
  mocks.auth.memberships = [
    {
      id: 'membership-1',
      organization_id: 'org-1',
      role: 'member',
      status: 'active',
      organization: { id: 'org-1', name: 'SV Heinersreuth', slug: 'sv-heinersreuth', status: 'active' },
    },
  ];
  mocks.portalContext = portalContext(BASELINE_CAPABILITIES);
});

const countOf = (name: string) => mocks.rpcCalls.filter((entry) => entry === name).length;

/* ------------------------------------------------------- 1) one project request per portal */

describe('the customer project list is loaded once per portal mount', () => {
  it('issues list_customer_projects exactly once for the shell and the overview together', async () => {
    renderPortal('/app');
    // The overview is a lazy chunk. Its OWN requests are the proof that it has actually
    // mounted — asserting before that would pass against a page that never rendered.
    await waitFor(() => expect(countOf('list_customer_documents')).toBeGreaterThan(0));
    await waitFor(() => expect(countOf('list_customer_invoices')).toBeGreaterThan(0));

    expect(countOf('list_customer_projects')).toBe(1);
  });

  it('does not re-issue it when the customer moves to another surface that needs it', async () => {
    const { navigate } = renderPortal('/app');
    await waitFor(() => expect(countOf('list_customer_documents')).toBeGreaterThan(0));
    expect(countOf('list_customer_projects')).toBe(1);

    // `get_customer_project` is issued by the project route and by nothing else, so it is a
    // marker that the NEW page has genuinely mounted — the overview already fetches
    // documents and invoices, so waiting on those would be satisfied before navigating.
    navigate('/app/projects/project-1');
    await waitFor(() => expect(countOf('get_customer_project')).toBeGreaterThan(0));

    expect(countOf('list_customer_projects')).toBe(1);
  });
});

/* ------------------------------------------------------------------- 2) shell persistence */

describe('the shell survives customer route navigation', () => {
  it('keeps the very same sidebar node across a route change', async () => {
    const { container, navigate } = renderPortal('/app');
    await waitFor(() => expect(sidebarOf(container)).not.toBeNull());
    const before = sidebarOf(container);

    navigate('/app/projects/project-1');
    await waitFor(() => expect(countOf('get_customer_project')).toBeGreaterThan(0));

    // Identity, not equality: a remounted shell would be a different element.
    expect(sidebarOf(container)).toBe(before);
  });

  it('mounts the shell on a solution instance route too', async () => {
    const { container } = renderPortal('/app/solutions/receptionist-1');
    await waitFor(() => expect(sidebarOf(container)).not.toBeNull());
    expect(container.querySelectorAll('[data-shell-nav="primary-desktop"]').length).toBe(1);
  });
});

/* ------------------------------------------------------------------------ 3) no raw enums */

describe('the settings page never shows a customer a raw database enum', () => {
  it('humanises the platform role, the organization status and the membership state', async () => {
    const { container } = renderPortal('/app/settings');
    await waitFor(() => expect(screen.getAllByText('Ihr Profil').length).toBeGreaterThan(0));

    const text = container.textContent ?? '';
    for (const token of rawCustomerAccountEnumValues) {
      expect(text).not.toContain(token);
    }
    // and it does show the German spellings instead
    expect(text).toContain('Kundenzugang');
    expect(text).toContain('Aktiv');
    expect(text).toContain('Mitglied');
  });
});
