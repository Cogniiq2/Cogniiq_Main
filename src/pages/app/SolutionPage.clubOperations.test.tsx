// Club Operations inside the Cogniiq customer portal — access and composition.
//
// The properties under test are the ones that make hosting another client's operational dashboard
// in a shared portal safe:
//
//   * an unauthenticated visitor is sent to the canonical login, not to the module;
//   * an authorized member of the club's organization reaches the module, inside the Cogniiq shell;
//   * a customer of a *different* organization typing the instance URL is denied;
//   * the portal's own navigation, account controls and organization context stay in place.
//
// The Supabase mock below answers `organization_solutions` queries only for the organization id the
// caller actually filtered on, which is what RLS does server-side. That is deliberate: the frontend
// guard is only trustworthy if it denies on the basis of what the server returned, and this test
// fails if it ever starts deciding from something else.

import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OrganizationSolution } from '@/lib/clientPlatform/types';

const CLUB_ORG = '11111111-1111-4111-8111-111111111111';
const OTHER_ORG = '22222222-2222-4222-8222-222222222222';
const INSTANCE_KEY = 'vereinsbetrieb-demo';

const clubSolution: OrganizationSolution = {
  id: 'sol-club',
  organization_id: CLUB_ORG,
  engagement_id: null,
  catalog_key: 'club_operations',
  instance_key: INSTANCE_KEY,
  display_name: 'Vereinsbetrieb',
  implementation_key: 'club_operations',
  status: 'active',
  nav_order: 0,
  // Demonstration data, so the module renders figures without a deployed gateway. The gateway path
  // is covered in clubOperationsBrowserTransport.test.ts.
  config: { data_source: 'demo' },
  created_at: '2026-08-01T00:00:00.000Z',
  updated_at: '2026-08-01T00:00:00.000Z',
};

const mocks = vi.hoisted(() => ({
  auth: {
    isLoading: false,
    authTimedOut: false,
    authError: null as string | null,
    user: null as { id: string; email?: string } | null,
    profile: null as unknown,
    session: null,
    memberships: [] as unknown[],
    activeOrganizationId: null as string | null,
    isPlatformAdmin: false,
    isPlatformOwner: false,
    setActiveOrganizationId: vi.fn(),
    refreshAccount: vi.fn(async () => {}),
    retryAuth: vi.fn(async () => {}),
    signOut: vi.fn(async () => {}),
  },
  /** Rows the database would return, keyed by organization. Nothing else is reachable. */
  rowsByOrganization: new Map<string, OrganizationSolution[]>(),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mocks.auth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('@/lib/supabase', () => {
  function builder(table: string) {
    let organizationId: string | null = null;

    const result = () => {
      if (table !== 'organization_solutions') return { data: null, error: null };
      // The scoped read: only what this organization is allowed to see comes back.
      return { data: mocks.rowsByOrganization.get(organizationId ?? '') ?? [], error: null };
    };

    const chain = {
      select: () => chain,
      eq: (_column: string, value: string) => {
        organizationId = value;
        return chain;
      },
      order: () => chain,
      maybeSingle: async () => ({ data: null, error: null }),
      then: (resolve: (value: unknown) => unknown) => Promise.resolve(result()).then(resolve),
    };
    return chain;
  }

  return {
    supabase: {
      from: (table: string) => builder(table),
      functions: { invoke: vi.fn(async () => ({ data: null, error: null })) },
      auth: {
        getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
    },
  };
});

const { SolutionPage } = await import('./SolutionPage');
const { ProtectedRoute } = await import('@/components/auth/ProtectedRoute');
const { sectionFromSplat } = await import('@/lib/solutions/clubOperationsSection');

function membership(organizationId: string, name: string) {
  return {
    id: `mem-${organizationId}`,
    organization_id: organizationId,
    user_id: 'user-1',
    role: 'admin',
    status: 'active',
    created_at: '2026-08-01T00:00:00.000Z',
    updated_at: '2026-08-01T00:00:00.000Z',
    organization: {
      id: organizationId,
      name,
      slug: null,
      status: 'active',
      created_by: null,
      created_at: '2026-08-01T00:00:00.000Z',
      updated_at: '2026-08-01T00:00:00.000Z',
    },
  };
}

/**
 * The route exactly as App.tsx declares it: the splat path, behind ProtectedRoute. Reproducing the
 * real composition matters — the authentication gate and the instance-ownership gate are two
 * different checks, and both have to be in the path for the guarantees below to hold.
 */
function renderInstance(path = `/app/solutions/${INSTANCE_KEY}`) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/app/solutions/:instanceKey/*"
          element={
            <ProtectedRoute>
              <SolutionPage />
            </ProtectedRoute>
          }
        />
        <Route path="/app" element={<div>Portal-Übersicht</div>} />
        <Route path="/app/login" element={<div>Login-Seite</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mocks.auth.isLoading = false;
  mocks.auth.authTimedOut = false;
  mocks.auth.authError = null;
  mocks.auth.user = { id: 'user-1', email: 'admin@example.org' };
  mocks.auth.profile = { id: 'user-1', email: 'admin@example.org', full_name: 'Test Admin', platform_role: 'customer' };
  mocks.rowsByOrganization.clear();
  // Only the club's own organization has the instance. Every other organization's scoped read
  // returns nothing, exactly as RLS would.
  mocks.rowsByOrganization.set(CLUB_ORG, [clubSolution]);
  mocks.rowsByOrganization.set(OTHER_ORG, []);
});

describe('an authorized member of the club organization', () => {
  beforeEach(() => {
    mocks.auth.memberships = [membership(CLUB_ORG, 'SV Heinersreuth')];
    mocks.auth.activeOrganizationId = CLUB_ORG;
  });

  it('reaches the Club Operations module', async () => {
    renderInstance();
    // The module's own navigation is the proof it mounted; it exists nowhere else in the portal.
    expect(await screen.findByRole('button', { name: /Zahlungsabgleich/i }, { timeout: 5000 })).toBeInTheDocument();
  });

  it('renders it inside the Cogniiq customer shell, not as a standalone application', async () => {
    renderInstance();
    await screen.findByRole('button', { name: /Zahlungsabgleich/i }, { timeout: 5000 });

    // Cogniiq chrome: the portal's own navigation landmark, its universal entries, the account
    // control and the active organization context all remain the surrounding frame.
    expect(screen.getByRole('navigation', { name: /Kundenbereich Navigation/i })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /^Übersicht$/ }).length).toBeGreaterThan(0);
    expect(screen.getAllByText('SV Heinersreuth').length).toBeGreaterThan(0);
    // The account control lives in the rail footer; its menu (holding Abmelden) opens on click.
    expect(screen.getAllByText('Test Admin').length).toBeGreaterThan(0);

    // And no second application frame smuggled in by the module.
    expect(screen.queryByTitle(/heinersreuth/i)).toBeNull();
    expect(document.querySelector('iframe')).toBeNull();
  });

  it('exposes the solution through the portal sidebar', async () => {
    renderInstance();
    await screen.findByRole('button', { name: /Zahlungsabgleich/i }, { timeout: 5000 });

    const bookings = screen.getAllByRole('link', { name: /^Buchungen$/ })[0];
    expect(bookings).toHaveAttribute('href', `/app/solutions/${INSTANCE_KEY}/bookings`);
  });

  it('labels demonstration figures as such, so they are never read as real numbers', async () => {
    renderInstance();
    await screen.findByRole('button', { name: /Zahlungsabgleich/i }, { timeout: 5000 });
    // The shell mounts a desktop rail and a mobile drawer, so page content can appear more than once.
    expect(screen.getAllByText(/Beispieldaten/i).length).toBeGreaterThan(0);
  });

  it('opens the section named by the URL', async () => {
    renderInstance(`/app/solutions/${INSTANCE_KEY}/members`);
    await waitFor(
      () => expect(screen.getByText(/Mitgliederverzeichnis/i)).toBeInTheDocument(),
      { timeout: 5000 },
    );
  });
});

describe('an unauthenticated visitor', () => {
  it('is sent to the canonical Cogniiq login, never to the module', async () => {
    mocks.auth.user = null;
    mocks.auth.memberships = [membership(CLUB_ORG, 'SV Heinersreuth')];
    mocks.auth.activeOrganizationId = CLUB_ORG;

    renderInstance();
    expect(await screen.findByText('Login-Seite')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Zahlungsabgleich/i })).toBeNull();
  });

  it('is held at the loading gate while the session is still resolving', async () => {
    mocks.auth.user = null;
    mocks.auth.isLoading = true;

    renderInstance();
    // Neither the module nor a premature redirect: an unresolved session is not a signed-out one.
    await waitFor(() => expect(screen.queryByText('Login-Seite')).toBeNull());
    expect(screen.queryByRole('button', { name: /Zahlungsabgleich/i })).toBeNull();
  });
});

describe('section resolution from the URL', () => {
  it('maps a known segment onto its section', () => {
    expect(sectionFromSplat('payments')).toBe('payments');
    expect(sectionFromSplat('monthly-reports')).toBe('monthly-reports');
  });

  it('falls back to the overview for anything it does not recognise', () => {
    // A stale bookmark or a typed URL opens the dashboard rather than a dead end. The section is a
    // view selector only — it grants nothing — so a wrong value has no security meaning.
    for (const splat of ['', undefined, '/', 'nonsense', '__proto__', 'constructor', 'toString', '../members']) {
      expect(sectionFromSplat(splat)).toBe('overview');
    }
  });

  it('reads only the first segment', () => {
    expect(sectionFromSplat('members/extra/segments')).toBe('members');
    expect(sectionFromSplat('settings/../members')).toBe('settings');
  });
});

describe('a customer of a different organization', () => {
  beforeEach(() => {
    mocks.auth.memberships = [membership(OTHER_ORG, 'Andere GmbH')];
    mocks.auth.activeOrganizationId = OTHER_ORG;
  });

  it('is denied when typing the instance URL directly', async () => {
    renderInstance();
    expect(await screen.findByText(/Kein Zugriff auf diese Lösung/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Zahlungsabgleich/i })).toBeNull();
  });

  it('is denied on a deep section URL just the same', async () => {
    renderInstance(`/app/solutions/${INSTANCE_KEY}/payments`);
    expect(await screen.findByText(/Kein Zugriff auf diese Lösung/i)).toBeInTheDocument();
  });

  it('never receives the other organization’s solution in its own sidebar', async () => {
    renderInstance();
    await screen.findByText(/Kein Zugriff auf diese Lösung/i);
    expect(screen.queryByRole('link', { name: /^Buchungen$/ })).toBeNull();
  });
});

describe('a user with no organization at all', () => {
  it('is redirected to the portal overview rather than shown the module', async () => {
    mocks.auth.memberships = [];
    mocks.auth.activeOrganizationId = null;

    renderInstance();
    expect(await screen.findByText('Portal-Übersicht')).toBeInTheDocument();
  });
});

describe('a disabled instance', () => {
  it('is denied even for a member of the owning organization', async () => {
    mocks.auth.memberships = [membership(CLUB_ORG, 'SV Heinersreuth')];
    mocks.auth.activeOrganizationId = CLUB_ORG;
    mocks.rowsByOrganization.set(CLUB_ORG, [{ ...clubSolution, status: 'disabled' }]);

    renderInstance();
    expect(await screen.findByText(/Kein Zugriff auf diese Lösung/i)).toBeInTheDocument();
  });
});
