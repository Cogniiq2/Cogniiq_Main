import type { ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { AuthLoadingScreen } from './AuthLoadingScreen';

export function PlatformAdminRoute({ children }: { children: ReactNode }) {
  const { user, profile, isLoading, isPlatformAdmin, signOut } = useAuth();
  const location = useLocation();

  if (isLoading) return <AuthLoadingScreen />;

  if (!user) {
    const redirectTo = encodeURIComponent(`${location.pathname}${location.search}${location.hash}`);
    return <Navigate to={`/admin/login?redirectTo=${redirectTo}`} replace />;
  }

  if (!isPlatformAdmin) {
    return (
      <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-7 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700">
            <ShieldAlert size={19} />
          </div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
            Restricted Area
          </p>
          <h1 className="mb-3 text-2xl font-bold tracking-tight text-gray-950">Admin access required</h1>
          <p className="mb-6 text-sm leading-6 text-gray-600">
            You are signed in as {profile?.email ?? user.email ?? 'a customer account'}, but this area is limited to
            Cogniiq platform administrators.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/app"
              className="inline-flex items-center justify-center rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
            >
              Go to app
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
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
