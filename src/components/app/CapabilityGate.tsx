import type { ReactNode } from 'react';

import { usePortalAccess } from '@/contexts/PortalAccessContext';

/**
 * Renders `children` only when the caller holds the required capabilities.
 *
 * For individual action controls (buttons, menu entries, form sections) — the finer-grained
 * sibling of CapabilityRoute.
 *
 * IMPORTANT: this is a usability control, never a security boundary. Hiding a button does not stop
 * anyone from calling the RPC behind it; every mutating RPC in this feature re-checks authorization
 * server-side and RLS denies direct table access regardless of what the browser renders.
 */
export function CapabilityGate({
  requires,
  requiresAny,
  children,
  fallback = null,
}: {
  requires?: readonly string[];
  requiresAny?: readonly string[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { hasEveryCapability, hasSomeCapability, isPlatformAdmin } = usePortalAccess();

  const allowed =
    isPlatformAdmin ||
    ((requires === undefined || hasEveryCapability(requires)) &&
      (requiresAny === undefined || hasSomeCapability(requiresAny)));

  return <>{allowed ? children : fallback}</>;
}
