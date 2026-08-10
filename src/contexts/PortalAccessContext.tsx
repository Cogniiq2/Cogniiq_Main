import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { isKnownCapability } from '@/lib/portalAccess/capabilities';
import { parsePortalContext } from '@/lib/portalAccess/types';
import type { PortalContext, PortalOrganizationAccess } from '@/lib/portalAccess/types';

export type PortalAccessStatus =
  /** The context has not answered yet. Guards must render a loading state, never content. */
  | 'loading'
  /** Loaded successfully; `capabilities` is authoritative for what the UI may offer. */
  | 'ready'
  /** The RPC failed. Retryable; access is denied meanwhile. */
  | 'error'
  /** No authenticated session. Guards redirect to login. */
  | 'unauthenticated'
  /** Authenticated, but no active membership in any organization. */
  | 'no-organization';

interface PortalAccessValue {
  status: PortalAccessStatus;
  error: string | null;
  context: PortalContext | null;
  /** The organization the portal is currently scoped to, mirroring AuthContext's active id. */
  organization: PortalOrganizationAccess | null;
  organizations: PortalOrganizationAccess[];
  /** Deduplicated effective capability keys for the active organization. */
  capabilities: ReadonlySet<string>;
  isPlatformAdmin: boolean;
  /**
   * True only when the active organization's effective capabilities contain `key` AND `key` is a
   * capability this build knows about. An unknown key is always false — unknown fails closed.
   */
  hasCapability: (key: string) => boolean;
  /** True when EVERY listed capability is held. An empty list means "no capability required". */
  hasEveryCapability: (keys: readonly string[]) => boolean;
  /** True when at least one listed capability is held. An empty list is false. */
  hasSomeCapability: (keys: readonly string[]) => boolean;
  reload: () => Promise<void>;
}

const PortalAccessContext = createContext<PortalAccessValue | null>(null);

const EMPTY_CAPABILITIES: ReadonlySet<string> = new Set<string>();

/**
 * Loads the single authenticated portal-access context.
 *
 * Bootstrapped ONCE per authenticated session (keyed on the user id), then re-fetched only on an
 * explicit reload — which is what the owner role-management UI triggers after changing an
 * assignment, and what the retry button triggers after a failure.
 *
 * Nothing here is a security boundary. The database re-derives the same capabilities inside
 * SECURITY DEFINER RPCs and enforces RLS on every table; this context exists so the UI does not
 * offer actions the backend would refuse.
 */
export function usePortalAccessValue(): PortalAccessValue {
  const { user, isLoading: authLoading, authTimedOut, activeOrganizationId } = useAuth();
  const [context, setContext] = useState<PortalContext | null>(null);
  const [status, setStatus] = useState<PortalAccessStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  // Guards against a superseded response overwriting a newer one.
  const requestRef = useRef(0);
  // The user id the context was bootstrapped for, so a token refresh does not refetch.
  const loadedForUserRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    const { data, error: rpcError } = await supabase.rpc('current_user_portal_context');
    if (requestRef.current !== requestId) return;

    if (rpcError) {
      // Fail closed: no context means no capabilities, and the guards deny.
      setContext(null);
      setError(rpcError.message);
      setStatus('error');
      return;
    }

    const parsed = parsePortalContext(data);
    setContext(parsed);
    setError(null);
    if (!parsed) {
      // A signed-in caller with an unreadable context is treated as an expired session.
      setStatus('unauthenticated');
      return;
    }
    setStatus(parsed.organizations.length === 0 ? 'no-organization' : 'ready');
  }, []);

  useEffect(() => {
    // The authentication bootstrap owns the loading and timeout states first; the portal context
    // must not race it, and must not report "unauthenticated" while auth is still deciding.
    if (authLoading || authTimedOut) {
      setStatus('loading');
      return;
    }
    if (!user) {
      loadedForUserRef.current = null;
      requestRef.current += 1; // abandon any in-flight response from the previous session
      setContext(null);
      setError(null);
      setStatus('unauthenticated');
      return;
    }
    if (loadedForUserRef.current === user.id) return;

    loadedForUserRef.current = user.id;
    setStatus('loading');
    void load();
  }, [authLoading, authTimedOut, load, user]);

  const reload = useCallback(async () => {
    setStatus('loading');
    await load();
  }, [load]);

  const organization = useMemo(() => {
    if (!context) return null;
    const active = context.organizations.find((org) => org.organizationId === activeOrganizationId);
    return active ?? context.organizations[0] ?? null;
  }, [activeOrganizationId, context]);

  const capabilities = useMemo<ReadonlySet<string>>(() => {
    // Capabilities apply only once the context is READY. While loading, retrying or erroring the
    // set stays empty, which is what prevents a flash of navigation the user may not be allowed.
    if (status !== 'ready' || !organization) return EMPTY_CAPABILITIES;
    return new Set(organization.capabilities);
  }, [organization, status]);

  const hasCapability = useCallback(
    (key: string) => isKnownCapability(key) && capabilities.has(key),
    [capabilities]
  );

  const hasEveryCapability = useCallback(
    (keys: readonly string[]) => keys.every((key) => hasCapability(key)),
    [hasCapability]
  );

  const hasSomeCapability = useCallback(
    (keys: readonly string[]) => keys.some((key) => hasCapability(key)),
    [hasCapability]
  );

  return useMemo(
    () => ({
      status,
      error,
      context,
      organization,
      organizations: context?.organizations ?? [],
      capabilities,
      isPlatformAdmin: context?.isPlatformAdmin ?? false,
      hasCapability,
      hasEveryCapability,
      hasSomeCapability,
      reload,
    }),
    [
      capabilities, context, error, hasCapability, hasEveryCapability, hasSomeCapability,
      organization, reload, status,
    ]
  );
}

export function PortalAccessProvider({ children, value }: { children: ReactNode; value: PortalAccessValue }) {
  return <PortalAccessContext.Provider value={value}>{children}</PortalAccessContext.Provider>;
}

export function usePortalAccess(): PortalAccessValue {
  const context = useContext(PortalAccessContext);
  if (!context) {
    throw new Error('usePortalAccess must be used within PortalAccessProvider');
  }
  return context;
}

/** Convenience hook for a single capability check inside a component. */
export function useCapability(key: string): boolean {
  return usePortalAccess().hasCapability(key);
}
