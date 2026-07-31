import { Navigate, useSearchParams } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { resolvePostLoginDestination, sanitizeRedirect } from '@/lib/auth/authorizedRedirect';
import { AuthLoadingScreen } from './AuthLoadingScreen';
import { AuthRecoveryScreen } from './AuthRecoveryScreen';

// Single post-login resolution point (mounted at /auth/continue). It waits until AuthContext has
// finished loading the session AND the database-backed profile, then sends the user to a validated,
// authorized destination — never navigating on stale role state. This is what prevents the flicker /
// loop where an owner is briefly bounced to /app before their role is known.
export function RoleLandingPage() {
  const { isLoading, authTimedOut, user, isPlatformAdmin, isPlatformOwner } = useAuth();
  const [params] = useSearchParams();
  const requested = params.get('redirectTo');

  // Block until the profile-backed role flags are trustworthy.
  // A bootstrap that never answered must not read as "signed out": the session
  // may well be valid. Offer retry and sign out instead of redirecting to login
  // on the strength of a request that never came back.
  if (authTimedOut) return <AuthRecoveryScreen />;

  if (isLoading) return <AuthLoadingScreen />;

  // Not (or no longer) signed in: back to the canonical login, preserving a safe redirect target.
  if (!user) {
    const safe = sanitizeRedirect(requested);
    const to = safe ? `/app/login?redirectTo=${encodeURIComponent(safe)}` : '/app/login';
    return <Navigate to={to} replace />;
  }

  const destination = resolvePostLoginDestination(requested, { isPlatformAdmin, isPlatformOwner });
  return <Navigate to={destination} replace />;
}

export default RoleLandingPage;
