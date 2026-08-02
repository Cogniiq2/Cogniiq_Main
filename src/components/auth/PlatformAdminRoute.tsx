import type { ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { AuthLoadingScreen } from './AuthLoadingScreen';
import { AuthRecoveryScreen } from './AuthRecoveryScreen';

export function PlatformAdminRoute({ children }: { children: ReactNode }) {
  const { user, profile, isLoading, authTimedOut, isPlatformAdmin, signOut } = useAuth();
  const location = useLocation();

  // A bootstrap that never answered must not read as "signed out": the session
  // may well be valid. Offer retry and sign out instead of redirecting to login
  // on the strength of a request that never came back.
  if (authTimedOut) return <AuthRecoveryScreen />;

  if (isLoading) return <AuthLoadingScreen />;

  if (!user) {
    const redirectTo = encodeURIComponent(`${location.pathname}${location.search}${location.hash}`);
    return <Navigate to={`/app/login?redirectTo=${redirectTo}`} replace />;
  }

  if (!isPlatformAdmin) {
    return (
      <div data-cq-surface="auth" className="flex min-h-screen items-center justify-center bg-canvas px-6 text-gray-950">
        <div className="w-full max-w-md rounded-panel border border-hairline bg-white p-7 shadow-panel">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-control border border-amber-200 bg-amber-50 text-amber-700">
            <ShieldAlert size={19} aria-hidden="true" />
          </div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500">
            Restricted Area
          </p>
          <h1 className="mb-3 text-[24px] font-semibold leading-tight tracking-[-0.02em] text-gray-950">Admin access required</h1>
          <p className="mb-6 text-[13.5px] leading-6 text-gray-600">
            You are signed in as {profile?.email ?? user.email ?? 'a customer account'}, but this area is limited to
            Cogniiq platform administrators.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <Link
              to="/app"
              className="inline-flex min-h-11 items-center justify-center rounded-control bg-gray-950 px-4 text-[13.5px] font-semibold text-white transition-colors duration-fast ease-premium hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950/25 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            >
              Go to app
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex min-h-11 items-center justify-center rounded-control border border-gray-200 bg-white px-4 text-[13.5px] font-semibold text-gray-700 transition-colors duration-fast ease-premium hover:border-gray-300 hover:bg-gray-50 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950/25 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
