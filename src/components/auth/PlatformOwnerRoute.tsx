import type { ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { AuthLoadingScreen } from './AuthLoadingScreen';

// Owner-only route guard. Authorization requires the database-backed platform role cogniiq_owner
// (isPlatformOwner), never cogniiq_admin, email, organization ownership or client-side state. RLS
// remains the final boundary; this only controls whether owner UI renders. The denied state never
// reveals whether any financial records exist.
export function PlatformOwnerRoute({ children }: { children: ReactNode }) {
  const { user, isLoading, isPlatformOwner, signOut } = useAuth();
  const location = useLocation();

  if (isLoading) return <AuthLoadingScreen />;

  if (!user) {
    const redirectTo = encodeURIComponent(`${location.pathname}${location.search}${location.hash}`);
    return <Navigate to={`/app/login?redirectTo=${redirectTo}`} replace />;
  }

  if (!isPlatformOwner) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f4] px-6 text-gray-950">
        <div className="w-full max-w-md rounded-[20px] border border-gray-100 bg-white p-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-600">
            <ShieldAlert size={19} />
          </div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">Restricted</p>
          <h1 className="mb-3 text-2xl font-bold tracking-tight">Kein Zugriff</h1>
          <p className="mb-6 text-sm leading-6 text-gray-500">
            Dieser Bereich ist ausschließlich dem Cogniiq-Inhaber vorbehalten.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/admin"
              className="inline-flex items-center justify-center rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
            >
              Zur Administration
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-950"
            >
              Abmelden
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
