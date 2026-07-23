import { Navigate, Route, Routes } from 'react-router-dom';

import { PlatformOwnerRoute } from '@/components/auth/PlatformOwnerRoute';
import { KpiSkeletonGrid, TableSkeleton } from '@/components/dashboard';
import { OwnerEntityProvider, useOwnerEntity } from '@/pages/owner/ownerContext';
import { BackendErrorScreen, BackendSetupScreen } from '@/pages/owner/BackendStates';
import { OverviewPage } from '@/pages/owner/OverviewPage';
import { InvoicesPage } from '@/pages/owner/InvoicesPage';
import { InvoiceDetailPage } from '@/pages/owner/InvoiceDetailPage';
import { OffersPage } from '@/pages/owner/OffersPage';
import { OfferDetailPage } from '@/pages/owner/OfferDetailPage';
import { OfferEditor } from '@/pages/owner/OfferEditor';
import { CustomersPage } from '@/pages/owner/CustomersPage';
import { CustomerDetailPage } from '@/pages/owner/CustomerDetailPage';
import { ExpensesPage } from '@/pages/owner/ExpensesPage';
import { TaxesPage } from '@/pages/owner/TaxesPage';
import { SettingsPage } from '@/pages/owner/SettingsPage';
import { AssetsPage, AuditPage, DocumentsPage, RevenuePage, SubscriptionsPage } from '@/pages/owner/miscPages';

// The Finance & Steuern module, mounted at /admin/finance/* inside the shared internal workspace
// shell. It keeps its own owner-only boundary (PlatformOwnerRoute) and backend-readiness gate; RLS is
// the final security layer. Routes are relative so the module is location-agnostic. The shell header,
// account menu and top-level navigation come from InternalWorkspaceLayout — no second application
// shell, no duplicate logout.
function FinanceRoutes() {
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
      <Route index element={<Navigate to="overview" replace />} />
      <Route path="overview" element={<OverviewPage />} />
      <Route path="customers" element={<CustomersPage />} />
      <Route path="customers/:customerId" element={<CustomerDetailPage />} />
      <Route path="offers" element={<OffersPage />} />
      <Route path="offers/new" element={<OfferEditor />} />
      <Route path="offers/:offerId/edit" element={<OfferEditor />} />
      <Route path="offers/:offerId" element={<OfferDetailPage />} />
      <Route path="invoices" element={<InvoicesPage />} />
      <Route path="invoices/:invoiceId" element={<InvoiceDetailPage />} />
      <Route path="expenses" element={<ExpensesPage />} />
      <Route path="subscriptions" element={<SubscriptionsPage />} />
      <Route path="assets" element={<AssetsPage />} />
      <Route path="taxes" element={<TaxesPage />} />
      <Route path="revenue" element={<RevenuePage />} />
      <Route path="documents" element={<DocumentsPage />} />
      <Route path="audit" element={<AuditPage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="overview" replace />} />
    </Routes>
  );
}

export function FinanceModule() {
  return (
    <PlatformOwnerRoute>
      <OwnerEntityProvider>
        <FinanceRoutes />
      </OwnerEntityProvider>
    </PlatformOwnerRoute>
  );
}

export default FinanceModule;
