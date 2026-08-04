import type { ReactNode } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { AuthLoadingScreen } from '@/components/auth/AuthLoadingScreen';
import { EntitlementUnavailablePage } from '@/components/app/EntitlementUnavailablePage';
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
  const { solutions, portalSettings, status, error, reload } = useOrganizationSolutionsValue();

  if (isPlatformAdmin) {
    return <>{children}</>;
  }

  if (status === 'loading') {
    return <AuthLoadingScreen />;
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-6">
        {/* role="alert" + data-qa: every other customer-facing error state in the portal
            announces itself to assistive technology and is detectable by the route
            harness. This one did neither, so a failed entitlement check was silent to a
            screen reader and read as a normal page to QA. */}
        <div
          role="alert"
          data-qa="error-state"
          className="w-full max-w-md rounded-card border border-gray-200 bg-white p-7 text-center shadow-panel"
        >
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
    // Automation-only clients (and anyone without the receptionist entitlement) are denied here —
    // direct URL access is refused, not merely hidden. The denial is EXPLAINED rather than being a
    // silent redirect, which previously made a bookmarked link look broken.
    return (
      <EntitlementUnavailablePage
        title="Der Rezeptionist ist für Sie noch nicht freigeschaltet"
        description="Ihre Organisation hat aktuell keine aktive Rezeptionisten-Lösung. Sobald Cogniiq den Rezeptionisten für Sie eingerichtet hat, erscheint dieser Bereich automatisch in Ihrer Navigation."
        supportEmail={portalSettings?.support_contact ?? null}
      />
    );
  }

  return <>{children}</>;
}
