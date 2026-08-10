import { Suspense, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { AuthLoadingScreen } from '@/components/auth/AuthLoadingScreen';
import { CustomerAppShell } from '@/components/app/CustomerAppShell';
import { EntitlementUnavailablePage } from '@/components/app/EntitlementUnavailablePage';
import { PortalAccessProvider, usePortalAccess, usePortalAccessValue } from '@/contexts/PortalAccessContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Outlet } from 'react-router-dom';

/**
 * The customer portal boundary.
 *
 * Authentication first (unchanged ProtectedRoute), then ONE portal-access bootstrap for the whole
 * /app subtree, then ONE premium shell for the whole /app subtree. Every /app route renders inside
 * this, so the access context is loaded once per authenticated session rather than once per page,
 * and the sidebar is genuinely persistent: navigating between customer routes swaps only the
 * content area, so the sidebar never remounts and its active indicator can animate between routes.
 *
 * Mounting the shell here — rather than inside each page, as it used to be — is also what makes
 * "every protected /app route renders the premium shell" a structural property of the route table
 * instead of a convention every new page has to remember.
 */
export function CustomerPortalBoundary() {
  return (
    <ProtectedRoute>
      <PortalAccessBoundaryInner />
    </ProtectedRoute>
  );
}

function PortalAccessBoundaryInner() {
  const value = usePortalAccessValue();
  return (
    <PortalAccessProvider value={value}>
      <CustomerAppShell>
        {/* Inner boundary so a lazy page chunk suspends the content area only — never the shell. */}
        <Suspense fallback={<div className="h-40 animate-pulse rounded-[20px] bg-gray-100" aria-hidden="true" />}>
          <Outlet />
        </Suspense>
      </CustomerAppShell>
    </PortalAccessProvider>
  );
}

/**
 * Route guard requiring capabilities.
 *
 * Fails closed in every non-ready state: loading renders a spinner (never the page), an error
 * renders a retry surface, an expired session redirects to login, and a missing capability renders
 * an explicit denial. Hiding the navigation entry is NOT what protects the route — and neither is
 * this component: the database refuses the same access independently.
 */
export function CapabilityRoute({
  children,
  requires,
  requiresAny,
}: {
  children: ReactNode;
  /** Every listed capability must be held. */
  requires?: readonly string[];
  /** At least one listed capability must be held. Applied in addition to `requires`. */
  requiresAny?: readonly string[];
}) {
  const { status, error, hasEveryCapability, hasSomeCapability, reload, isPlatformAdmin, organization } =
    usePortalAccess();
  const location = useLocation();

  // Cogniiq platform admins keep their existing platform-wide access; they are not customers and
  // hold no functional roles, so capability gating must not lock them out of customer surfaces.
  if (isPlatformAdmin) return <>{children}</>;

  if (status === 'loading') return <AuthLoadingScreen />;

  if (status === 'unauthenticated') {
    const redirectTo = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/app/login?redirectTo=${redirectTo}`} replace />;
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f4] px-6">
        <div
          role="alert"
          className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-7 text-center shadow-[0_18px_60px_rgba(15,23,42,0.08)]"
        >
          <h1 className="mb-2 text-lg font-semibold text-gray-950">Zugriff konnte nicht geprüft werden</h1>
          <p className="mb-5 text-sm text-gray-600">
            {error ?? 'Ihre Zugriffsrechte konnten nicht geladen werden.'}
          </p>
          <button
            type="button"
            onClick={() => void reload()}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  if (status === 'no-organization') {
    return (
      <EntitlementUnavailablePage
        title="Für Ihr Konto ist noch keine Organisation verbunden"
        description="Sobald Cogniiq Ihren Zugang eingerichtet hat, erscheint Ihr Kundenbereich hier automatisch."
        supportEmail={null}
      />
    );
  }

  const allowed =
    (requires === undefined || hasEveryCapability(requires)) &&
    (requiresAny === undefined || hasSomeCapability(requiresAny));

  if (!allowed) {
    // Explained rather than silently redirected, so a bookmarked link does not look broken.
    return (
      <EntitlementUnavailablePage
        title="Dieser Bereich ist für Sie nicht freigeschaltet"
        description="Ihre aktuelle Rolle in dieser Organisation umfasst diesen Bereich nicht. Wenden Sie sich an Cogniiq, wenn Sie hier Zugriff benötigen."
        supportEmail={organization?.portalSettings?.support_contact ?? null}
      />
    );
  }

  return <>{children}</>;
}
