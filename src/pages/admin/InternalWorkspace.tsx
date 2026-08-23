import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Building2 } from 'lucide-react';

import { PlatformAdminRoute } from '@/components/auth/PlatformAdminRoute';
import { DashboardShell, ToastProvider, type CommandItem } from '@/components/dashboard';
import { useAuth } from '@/contexts/AuthContext';
import { loadAdminClients } from '@/lib/clientPlatform/adminApi';
import { getActiveModule, getAdminCommandGroups, getSections, isSubNavActive } from '@/pages/admin/internalNavigation';

// Client commands are loaded once per session on the first palette open and shared across
// navigations (the promise is module-level, so shell remounts never refetch). A stale list after
// creating a client is acceptable — the palette is a jump list, not the source of truth.
let clientCommandsPromise: Promise<CommandItem[]> | null = null;

function loadClientCommands(): Promise<CommandItem[]> {
  if (!clientCommandsPromise) {
    clientCommandsPromise = loadAdminClients()
      .then((clients) =>
        clients.map((client) => ({
          key: `client-${client.organizationId}`,
          label: client.organizationName,
          hint: client.account?.legal_name ?? 'Client öffnen',
          icon: Building2,
          to: `/admin/clients/${client.organizationId}`,
          keywords: client.account?.legal_name ? [client.account.legal_name] : undefined,
        })),
      )
      .catch(() => {
        // Do not cache a failure — the next open retries.
        clientCommandsPromise = null;
        return [];
      });
  }
  return clientCommandsPromise;
}

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

  const [clientCommands, setClientCommands] = useState<CommandItem[]>([]);
  const handleCommandOpen = useCallback(() => {
    void loadClientCommands().then(setClientCommands);
  }, []);
  const commandGroups = useMemo(
    () => [
      ...getAdminCommandGroups({ isOwner: isPlatformOwner }),
      { id: 'clients', label: 'Clients', items: clientCommands },
    ],
    [isPlatformOwner, clientCommands],
  );

  return (
    <PlatformAdminRoute>
      <ToastProvider>
        <DashboardShell
          sections={sections}
          subNav={subNav}
          subNavLabel={activeModule.subNavLabel}
          activeSubKey={isSubNavActive}
          title={moduleAllowed ? activeModule.title : 'Cogniiq'}
          commandGroups={commandGroups}
          onCommandOpen={handleCommandOpen}
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
