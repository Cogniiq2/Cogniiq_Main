import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(async () => ({ data: null, error: null })),
    auth: {
      getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  },
}));

const { CapabilityRoute } = await import('./CapabilityRoute');
const { CapabilityGate } = await import('./CapabilityGate');
const { PortalAccessProvider } = await import('@/contexts/PortalAccessContext');
const { isKnownCapability } = await import('@/lib/portalAccess/capabilities');

type AccessStatus = 'loading' | 'ready' | 'error' | 'unauthenticated' | 'no-organization';

function accessValue({
  status,
  capabilities = [],
  isPlatformAdmin = false,
}: {
  status: AccessStatus;
  capabilities?: string[];
  isPlatformAdmin?: boolean;
}) {
  // Only a READY context exposes capabilities — the same rule the real provider applies.
  const set = new Set(status === 'ready' ? capabilities : []);
  const has = (key: string) => isKnownCapability(key) && set.has(key);
  return {
    status,
    error: status === 'error' ? 'RPC kaputt' : null,
    context: null,
    organization: null,
    organizations: [],
    capabilities: set as ReadonlySet<string>,
    isPlatformAdmin,
    hasCapability: has,
    hasEveryCapability: (keys: readonly string[]) => keys.every(has),
    hasSomeCapability: (keys: readonly string[]) => keys.some(has),
    reload: vi.fn(async () => {}),
  };
}

const SECRET = 'Vertrauliche Finanzdaten';

function renderGuarded(
  value: ReturnType<typeof accessValue>,
  requires: string[] = ['portal.billing.view']
) {
  return render(
    <MemoryRouter initialEntries={['/app/billing']}>
      <PortalAccessProvider value={value}>
        <Routes>
          <Route
            path="/app/billing"
            element={
              <CapabilityRoute requires={requires}>
                <p>{SECRET}</p>
              </CapabilityRoute>
            }
          />
          <Route path="/app/login" element={<p>Anmeldeseite</p>} />
        </Routes>
      </PortalAccessProvider>
    </MemoryRouter>
  );
}

describe('route guards fail closed', () => {
  it('renders the page when the capability is held', () => {
    renderGuarded(accessValue({ status: 'ready', capabilities: ['portal.billing.view'] }));
    expect(screen.getByText(SECRET)).toBeTruthy();
  });

  it('denies a member who lacks the capability, and explains rather than redirecting', () => {
    renderGuarded(accessValue({ status: 'ready', capabilities: ['portal.overview.view'] }));
    expect(screen.queryByText(SECRET)).toBeNull();
    expect(screen.getByText('Dieser Bereich ist für Sie nicht freigeschaltet')).toBeTruthy();
  });

  it('denies while the access context is still loading — no flash of protected content', () => {
    // The critical case: capabilities are unknown, so the page must NOT render optimistically.
    renderGuarded(accessValue({ status: 'loading', capabilities: ['portal.billing.view'] }));
    expect(screen.queryByText(SECRET)).toBeNull();
  });

  it('denies and offers a retry when the context failed to load', () => {
    renderGuarded(accessValue({ status: 'error', capabilities: ['portal.billing.view'] }));
    expect(screen.queryByText(SECRET)).toBeNull();
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Erneut versuchen' })).toBeTruthy();
  });

  it('redirects an expired session to login instead of rendering the page', () => {
    renderGuarded(accessValue({ status: 'unauthenticated' }));
    expect(screen.queryByText(SECRET)).toBeNull();
    expect(screen.getByText('Anmeldeseite')).toBeTruthy();
  });

  it('denies when the caller has no active membership', () => {
    renderGuarded(accessValue({ status: 'no-organization' }));
    expect(screen.queryByText(SECRET)).toBeNull();
  });

  it('treats an UNKNOWN capability as denied (fails closed)', () => {
    // A capability the build does not know about must never be honoured, even if the server
    // somehow returned it.
    renderGuarded(
      accessValue({ status: 'ready', capabilities: ['portal.billing.view', 'totally.made.up'] }),
      ['totally.made.up']
    );
    expect(screen.queryByText(SECRET)).toBeNull();
  });

  it('keeps existing platform-admin access to customer surfaces', () => {
    renderGuarded(accessValue({ status: 'ready', capabilities: [], isPlatformAdmin: true }));
    expect(screen.getByText(SECRET)).toBeTruthy();
  });

  it('renders an ungated route for any active member (existing customer flow)', () => {
    render(
      <MemoryRouter initialEntries={['/app/settings']}>
        <PortalAccessProvider value={accessValue({ status: 'ready', capabilities: [] })}>
          <Routes>
            <Route
              path="/app/settings"
              element={
                <CapabilityRoute>
                  <p>Einstellungen</p>
                </CapabilityRoute>
              }
            />
          </Routes>
        </PortalAccessProvider>
      </MemoryRouter>
    );
    expect(screen.getByText('Einstellungen')).toBeTruthy();
  });
});

describe('action-level capability gate', () => {
  function renderGate(value: ReturnType<typeof accessValue>) {
    return render(
      <PortalAccessProvider value={value}>
        <CapabilityGate requires={['svh.finance.manage']}>
          <button type="button">Beitrag buchen</button>
        </CapabilityGate>
      </PortalAccessProvider>
    );
  }

  it('renders the action when the capability is held', () => {
    renderGate(accessValue({ status: 'ready', capabilities: ['svh.finance.manage'] }));
    expect(screen.getByRole('button', { name: 'Beitrag buchen' })).toBeTruthy();
  });

  it('hides the action when it is not', () => {
    renderGate(accessValue({ status: 'ready', capabilities: ['svh.finance.view'] }));
    expect(screen.queryByRole('button', { name: 'Beitrag buchen' })).toBeNull();
  });

  it('hides the action while the context is loading', () => {
    renderGate(accessValue({ status: 'loading', capabilities: ['svh.finance.manage'] }));
    expect(screen.queryByRole('button', { name: 'Beitrag buchen' })).toBeNull();
  });
});
