import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useOrganizations } from '@/hooks/useOrganizations';
import { useServiceEntitlements } from '@/hooks/useServiceEntitlements';
import { useAuth } from '@/contexts/AuthContext';
import { getCustomerAccessState } from '@/lib/customerAccess';
import { AccessStatusPage } from './AccessStatusPage';
import { AuthLoadingScreen } from './AuthLoadingScreen';
import { MfaGate } from './MfaGate';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading, aal, refreshMfaLevel } = useAuth();
  const {
    activeMembership,
    activeOrganization,
    activeOrganizationId,
    isLoading: organizationsLoading,
  } = useOrganizations();
  const {
    entitlements,
    isLoading: entitlementsLoading,
  } = useServiceEntitlements(activeOrganizationId);
  const location = useLocation();

  if (isLoading || organizationsLoading || entitlementsLoading) return <AuthLoadingScreen />;

  if (!user) {
    const redirectTo = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/app/login?redirectTo=${redirectTo}`} replace />;
  }

  const accessState = getCustomerAccessState({
    userPresent: Boolean(user),
    activeMembership,
    activeOrganization,
    entitlements,
    aal,
  });

  if (accessState === 'mfa_required') {
    return <MfaGate onVerified={() => void refreshMfaLevel()} />;
  }

  if (accessState === 'unauthenticated') {
    const redirectTo = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/app/login?redirectTo=${redirectTo}`} replace />;
  }

  if (accessState !== 'active') {
    return <AccessStatusPage state={accessState} />;
  }

  return <>{children}</>;
}
