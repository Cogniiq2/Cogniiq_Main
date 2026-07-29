import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { AuthLoadingScreen } from './AuthLoadingScreen';
import { AuthRecoveryScreen } from './AuthRecoveryScreen';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading, authTimedOut } = useAuth();
  const location = useLocation();

  // A bootstrap that never answered must not read as "signed out": the session
  // may well be valid. Offer retry and sign out instead of redirecting to login
  // on the strength of a request that never came back.
  if (authTimedOut) return <AuthRecoveryScreen />;

  if (isLoading) return <AuthLoadingScreen />;

  if (!user) {
    const redirectTo = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/app/login?redirectTo=${redirectTo}`} replace />;
  }

  return <>{children}</>;
}
