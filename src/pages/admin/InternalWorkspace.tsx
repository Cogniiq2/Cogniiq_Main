import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { PlatformAdminRoute } from '@/components/auth/PlatformAdminRoute';
import { DashboardShell, ToastProvider } from '@/components/dashboard';
import { useAuth } from '@/contexts/AuthContext';
import { getActiveModule, getSections, isSubNavActive } from '@/pages/admin/internalNavigation';

// The one internal workspace shell shared by every /admin/* module (Tasks, Oura, CRM, Finance).
// It is protected once by PlatformAdminRoute, renders a single DashboardShell with one account/logout
// control, and derives the active module + navigation from the URL. Child modules render into the
// <Outlet/> and never bring their own header or guard (finance keeps its own owner-only boundary).
export function InternalWorkspaceLayout() {
  const { pathname } = useLocation();
  const { isPlatformOwner } = useAuth();

  // The internal modules use a single premium light palette — pin it and never expose a dark/theme
  // toggle. (The legacy admin CSS variables resolve to their light values from this attribute.)
  useEffect(() => {
    document.documentElement.setAttribute('data-admin-theme', 'light');
  }, []);

  const activeModule = getActiveModule(pathname);
  const sections = getSections(pathname, { isOwner: isPlatformOwner });

  // Never render an owner-only module's sub-navigation to a non-owner, even if they typed the URL
  // (they will see the owner-only access-denied screen in the outlet). Hiding it is convenience;
  // PlatformOwnerRoute + RLS remain the boundary.
  const moduleAllowed = !activeModule.ownerOnly || isPlatformOwner;
  const subNav = moduleAllowed ? activeModule.subNav : [];

  return (
    <PlatformAdminRoute>
      <ToastProvider>
        <DashboardShell
          sections={sections}
          subNav={subNav}
          subNavLabel={activeModule.subNavLabel}
          activeSubKey={isSubNavActive}
          title={moduleAllowed ? activeModule.title : 'Cogniiq'}
        >
          {/* Inner boundary so lazy module chunks suspend the content area only — never the shell. */}
          <Suspense fallback={<ModuleFallback />}>
            <Outlet />
          </Suspense>
        </DashboardShell>
      </ToastProvider>
    </PlatformAdminRoute>
  );
}

/** Shape-matched placeholder for a lazily loaded module: page header, then content. */
function ModuleFallback() {
  return (
    <div className="animate-pulse space-y-6 motion-reduce:animate-none" aria-hidden="true">
      <div className="border-b border-hairline pb-6">
        <div className="h-6 w-56 rounded-md bg-gray-200/70" />
        <div className="mt-3 h-3.5 w-80 max-w-full rounded-md bg-gray-100" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[104px] rounded-card border border-hairline bg-white" />
        ))}
      </div>
      <div className="h-64 rounded-card border border-hairline bg-white" />
    </div>
  );
}

export default InternalWorkspaceLayout;
