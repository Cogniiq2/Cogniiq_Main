import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { PlatformAdminRoute } from '@/components/auth/PlatformAdminRoute';
import { DashboardShell, ToastProvider } from '@/components/dashboard';
import { useAuth } from '@/contexts/AuthContext';
import { getActiveModule, getSections, getSubNav, isSubNavActive } from '@/pages/admin/internalNavigation';

// The one internal workspace shell shared by every /admin/* module (Tasks, Oura, CRM, Finance).
// It is protected once by PlatformAdminRoute, renders a single DashboardShell with one account/logout
// control, and derives the active module + navigation from the URL. Child modules render into the
// <Outlet/> and never bring their own header or guard (finance keeps its own owner-only boundary).
export function InternalWorkspaceLayout() {
  const { pathname } = useLocation();
  const { isPlatformOwner } = useAuth();

  // The internal modules use a single premium light palette — pin it and never expose a dark/theme
  // toggle. (The legacy admin CSS variables resolve to their light values from this attribute.)
  //
  // Removed again on unmount. The attribute lives on <html>, which outlives this layout in a
  // single-page session: leaving it behind meant every marketing page visited after /admin still
  // carried the admin theme scope. Only ExecutionPage and OuraAnalyticsPage read the resulting
  // `--admin-*` variables, and both render inside this layout, so nothing needs it afterwards.
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-admin-theme', 'light');
    return () => root.removeAttribute('data-admin-theme');
  }, []);

  const activeModule = getActiveModule(pathname);
  const sections = getSections(pathname, { isOwner: isPlatformOwner });

  // Never render an owner-only destination to a non-owner, even if they typed the URL (they will
  // see the owner-only access-denied screen in the outlet). Hiding it is convenience;
  // PlatformOwnerRoute + RLS remain the boundary.
  const moduleAllowed = !activeModule.ownerOnly || isPlatformOwner;
  const subNav = getSubNav(pathname, { isOwner: isPlatformOwner });

  return (
    <PlatformAdminRoute>
      <ToastProvider>
        <DashboardShell
          sections={sections}
          subNav={subNav}
          activeSubKey={isSubNavActive}
          title={moduleAllowed ? activeModule.title : 'Cogniiq'}
        >
          {/* Inner boundary so lazy module chunks suspend the content area only — never the shell. */}
          <Suspense fallback={<div className="h-40 animate-pulse rounded-[20px] bg-gray-100" aria-hidden="true" />}>
            <Outlet />
          </Suspense>
        </DashboardShell>
      </ToastProvider>
    </PlatformAdminRoute>
  );
}

export default InternalWorkspaceLayout;
