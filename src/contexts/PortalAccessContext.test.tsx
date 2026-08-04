import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: {
    user: null as { id: string } | null,
    isLoading: false,
    authTimedOut: false,
    activeOrganizationId: null as string | null,
  },
  rpc: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mocks.auth,
}));

vi.mock('@/lib/supabase', () => ({
  supabase: { rpc: mocks.rpc },
}));

const { usePortalAccessValue } = await import('./PortalAccessContext');

function contextPayload(capabilities: string[], organizationId = 'org-1') {
  return {
    user_id: 'user-1',
    platform_role: 'customer',
    is_platform_admin: false,
    organizations: [
      {
        membership_id: 'mem-1',
        organization_id: organizationId,
        organization_name: 'SV Testverein',
        organization_slug: null,
        organization_status: 'active',
        organization_role: 'member',
        membership_status: 'active',
        roles: [{ id: 'role-1', role_key: 'kassenwart', label: 'Kassenwart', description: null }],
        capabilities,
        solutions: [],
        portal_settings: null,
      },
    ],
  };
}

beforeEach(() => {
  mocks.auth.user = { id: 'user-1' };
  mocks.auth.isLoading = false;
  mocks.auth.authTimedOut = false;
  mocks.auth.activeOrganizationId = 'org-1';
  mocks.rpc.mockReset();
});

describe('portal access bootstrap', () => {
  it('calls the portal-context RPC exactly once per authenticated session', async () => {
    mocks.rpc.mockResolvedValue({ data: contextPayload(['portal.overview.view']), error: null });

    const { result, rerender } = renderHook(() => usePortalAccessValue());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    // Re-renders (token refresh, state churn) must not re-fetch.
    rerender();
    rerender();

    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledWith('current_user_portal_context');
  });

  it('exposes no capabilities before the context has answered', async () => {
    let release: ((value: unknown) => void) | undefined;
    mocks.rpc.mockReturnValue(
      new Promise((resolve) => {
        release = resolve;
      })
    );

    const { result } = renderHook(() => usePortalAccessValue());

    expect(result.current.status).toBe('loading');
    expect(result.current.hasCapability('portal.overview.view')).toBe(false);
    expect(result.current.capabilities.size).toBe(0);

    await act(async () => {
      release?.({ data: contextPayload(['portal.overview.view']), error: null });
    });
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.hasCapability('portal.overview.view')).toBe(true);
  });

  it('fails closed when the RPC errors', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: 'permission denied' } });

    const { result } = renderHook(() => usePortalAccessValue());
    await waitFor(() => expect(result.current.status).toBe('error'));

    expect(result.current.error).toBe('permission denied');
    expect(result.current.hasCapability('portal.overview.view')).toBe(false);
  });

  it('reports an unauthenticated session without calling the RPC', async () => {
    mocks.auth.user = null;

    const { result } = renderHook(() => usePortalAccessValue());
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('stays loading while the auth bootstrap has not resolved', async () => {
    mocks.auth.isLoading = true;

    const { result } = renderHook(() => usePortalAccessValue());
    expect(result.current.status).toBe('loading');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('reports no-organization for a session with no active membership', async () => {
    mocks.rpc.mockResolvedValue({
      data: { user_id: 'user-1', platform_role: 'customer', is_platform_admin: false, organizations: [] },
      error: null,
    });

    const { result } = renderHook(() => usePortalAccessValue());
    await waitFor(() => expect(result.current.status).toBe('no-organization'));
  });

  it('ignores a membership that is not active, even if the payload contains one', async () => {
    const payload = contextPayload(['svh.finance.manage']);
    payload.organizations[0].membership_status = 'suspended';
    mocks.rpc.mockResolvedValue({ data: payload, error: null });

    const { result } = renderHook(() => usePortalAccessValue());
    await waitFor(() => expect(result.current.status).toBe('no-organization'));
    expect(result.current.hasCapability('svh.finance.manage')).toBe(false);
  });

  it('treats an unknown capability key as not granted', async () => {
    mocks.rpc.mockResolvedValue({
      data: contextPayload(['portal.overview.view', 'invented.capability.key']),
      error: null,
    });

    const { result } = renderHook(() => usePortalAccessValue());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    expect(result.current.hasCapability('portal.overview.view')).toBe(true);
    expect(result.current.hasCapability('invented.capability.key')).toBe(false);
  });
});

describe('role changes refresh the portal context', () => {
  it('picks up a newly granted capability on reload', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: contextPayload(['portal.overview.view']), error: null });

    const { result } = renderHook(() => usePortalAccessValue());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.hasCapability('svh.finance.manage')).toBe(false);

    // The owner assigns Kassenwart; the portal reloads its context.
    mocks.rpc.mockResolvedValueOnce({
      data: contextPayload(['portal.overview.view', 'svh.finance.manage']),
      error: null,
    });
    await act(async () => {
      await result.current.reload();
    });

    await waitFor(() => expect(result.current.hasCapability('svh.finance.manage')).toBe(true));
    expect(mocks.rpc).toHaveBeenCalledTimes(2);
  });

  it('drops a revoked capability on reload', async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: contextPayload(['portal.overview.view', 'svh.finance.manage']),
      error: null,
    });

    const { result } = renderHook(() => usePortalAccessValue());
    await waitFor(() => expect(result.current.hasCapability('svh.finance.manage')).toBe(true));

    mocks.rpc.mockResolvedValueOnce({ data: contextPayload(['portal.overview.view']), error: null });
    await act(async () => {
      await result.current.reload();
    });

    await waitFor(() => expect(result.current.hasCapability('svh.finance.manage')).toBe(false));
    expect(result.current.hasCapability('portal.overview.view')).toBe(true);
  });
});
