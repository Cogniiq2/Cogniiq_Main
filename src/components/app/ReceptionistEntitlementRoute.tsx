import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { AuthLoadingScreen } from '@/components/auth/AuthLoadingScreen';
import { useOrganizationSolutionsValue } from '@/hooks/useOrganizationSolutions';
import type { OrganizationSolutionStatus } from '@/lib/clientPlatform/types';

// Statuses that permit access to the receptionist product surfaces.
const ALLOWED_STATUSES: OrganizationSolutionStatus[] = ['provisioning', 'active', 'paused'];

// Route guard for the legacy receptionist surfaces (/app/onboarding, /app/receptionist, etc.).
// Hiding navigation is not a security boundary: this guard requires the active organization to own
// an accessible ai_receptionist solution (or the user to be a platform admin) before rendering.
// It complements the RLS entitlement enforced in the database — both must pass.
export function ReceptionistEntitlementRoute({ children }: { children: ReactNode }) {
  const { isPlatformAdmin } = useAuth();
  const { solutions, status, error, reload } = useOrganizationSolutionsValue();

  if (isPlatformAdmin) {
    return <>{children}</>;
  }

  if (status === 'loading') {
    return <AuthLoadingScreen />;
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f4] px-6">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-7 text-center shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <h1 className="mb-2 text-lg font-semibold text-gray-950">Zugriff konnte nicht geprüft werden</h1>
          <p className="mb-5 text-sm text-gray-600">{error ?? 'Die Lösungsberechtigungen konnten nicht geladen werden.'}</p>
          <button
            type="button"
            onClick={() => void reload()}
            className="inline-flex items-center justify-center rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  const entitled = solutions.some(
    (solution) => solution.catalog_key === 'ai_receptionist' && ALLOWED_STATUSES.includes(solution.status),
  );

  if (!entitled) {
    // Automation-only clients (and anyone without the receptionist entitlement) are sent back to
    // the product-neutral overview. Direct URL access is denied, not merely hidden.
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}
