import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// The whole route table is exercised here, so every module the tree touches at import time has to be
// stubbed: the Supabase client (which throws without VITE_* env vars) and the auth context.
const mocks = vi.hoisted(() => ({
  auth: {
    isLoading: false,
    authTimedOut: false,
    user: null as { email_confirmed_at?: string | null } | null,
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

const { AppInner } = await import('./App');
const { isPrivateSurface, PRIVATE_ROBOTS } = await import('./lib/routing/indexability');

beforeEach(() => {
  mocks.auth.isLoading = false;
  mocks.auth.user = { email_confirmed_at: '2026-08-01T10:00:00.000Z' };
});

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppInner />
    </MemoryRouter>
  );
}

describe('/auth/confirmed route', () => {
  it('is registered and renders the confirmation page, not the 404 page', async () => {
    renderAt('/auth/confirmed?flow=signup');
    expect((await screen.findAllByText('E-Mail erfolgreich bestätigt')).length).toBeGreaterThan(0);
  });

  it('renders the invite flow for ?flow=invite', async () => {
    renderAt('/auth/confirmed?flow=invite');
    expect((await screen.findAllByText('Einladung erfolgreich angenommen')).length).toBeGreaterThan(0);
  });

  it('renders outside the marketing layout — no Navigation and no Footer', async () => {
    const { container } = renderAt('/auth/confirmed?flow=signup');
    await screen.findAllByText('E-Mail erfolgreich bestätigt');

    expect(container.querySelector('nav')).toBeNull();
    expect(container.querySelector('footer')).toBeNull();
    // The marketing shell mounts <main id="main-content">; the standalone surface does not.
    expect(container.querySelector('#main-content')).toBeNull();
  });

  it('is a private surface, so the route indexability manager serves it noindex', () => {
    expect(isPrivateSurface('/auth/confirmed')).toBe(true);
    expect(PRIVATE_ROBOTS).toBe('noindex, nofollow');
  });
});

describe('marketing routes are unaffected', () => {
  it('still mounts the marketing shell for a public path', async () => {
    const { container } = renderAt('/');
    await waitFor(() => expect(container.querySelector('#main-content')).not.toBeNull());
  });
});
