import { Navigate, Route, Routes } from 'react-router-dom';

import { PlatformOwnerRoute } from '@/components/auth/PlatformOwnerRoute';
import { ToastProvider, KpiSkeletonGrid, TableSkeleton } from '@/components/dashboard';
import { OwnerShell } from '@/pages/owner/ownerUi';
import { OwnerEntityProvider, useOwnerEntity } from '@/pages/owner/ownerContext';
import { BackendErrorScreen, BackendSetupScreen } from '@/pages/owner/BackendStates';
import { OverviewPage } from '@/pages/owner/OverviewPage';
import { ClientsPage } from '@/pages/owner/ClientsPage';
import { InvoicesPage } from '@/pages/owner/InvoicesPage';
import { ExpensesPage } from '@/pages/owner/ExpensesPage';
import { TaxesPage } from '@/pages/owner/TaxesPage';
import { SettingsPage } from '@/pages/owner/SettingsPage';
import { AssetsPage, AuditPage, DocumentsPage, RevenuePage, SubscriptionsPage } from '@/pages/owner/miscPages';

// Gates the finance routes on environment readiness. A missing backend renders one polished setup
// screen; a hard error renders a single error screen with retry. Only when the backend is installed
// does the normal cockpit load.
function OwnerRoutes() {
  const { status } = useOwnerEntity();

  if (status === 'loading') {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-gray-100" />
        <KpiSkeletonGrid count={4} />
        <TableSkeleton rows={4} />
      </div>
    );
  }
  if (status === 'missing_backend') return <BackendSetupScreen />;
  if (status === 'error') return <BackendErrorScreen />;

  return (
    <Routes>
      <Route path="/owner" element={<Navigate to="/owner/overview" replace />} />
      <Route path="/owner/overview" element={<OverviewPage />} />
      <Route path="/owner/clients" element={<ClientsPage />} />
      <Route path="/owner/revenue" element={<RevenuePage />} />
      <Route path="/owner/invoices" element={<InvoicesPage />} />
      <Route path="/owner/expenses" element={<ExpensesPage />} />
      <Route path="/owner/subscriptions" element={<SubscriptionsPage />} />
      <Route path="/owner/assets" element={<AssetsPage />} />
      <Route path="/owner/taxes" element={<TaxesPage />} />
      <Route path="/owner/documents" element={<DocumentsPage />} />
      <Route path="/owner/audit" element={<AuditPage />} />
      <Route path="/owner/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/owner/overview" replace />} />
    </Routes>
  );
}

// Entry for the owner-only finance & tax cockpit. Protected by the database-backed cogniiq_owner
// role; RLS is the final boundary. Lazily loaded from App.tsx so the customer/admin bundles are
// unaffected. Rendered inside the unified light dashboard shell.
export function OwnerCockpit() {
  return (
    <PlatformOwnerRoute>
      <ToastProvider>
        <OwnerEntityProvider>
          <OwnerShell>
            <OwnerRoutes />
          </OwnerShell>
        </OwnerEntityProvider>
      </ToastProvider>
    </PlatformOwnerRoute>
  );
}

export default OwnerCockpit;
