import { Navigate, Route, Routes } from 'react-router-dom';

import { PlatformOwnerRoute } from '@/components/auth/PlatformOwnerRoute';
import { OwnerShell } from '@/pages/owner/ownerUi';
import { OwnerEntityProvider } from '@/pages/owner/ownerContext';
import { OverviewPage } from '@/pages/owner/OverviewPage';
import { ClientsPage } from '@/pages/owner/ClientsPage';
import { InvoicesPage } from '@/pages/owner/InvoicesPage';
import { ExpensesPage } from '@/pages/owner/ExpensesPage';
import { TaxesPage } from '@/pages/owner/TaxesPage';
import { SettingsPage } from '@/pages/owner/SettingsPage';
import { AssetsPage, AuditPage, DocumentsPage, RevenuePage, SubscriptionsPage } from '@/pages/owner/miscPages';

// Entry for the owner-only finance & tax cockpit. Protected by the database-backed cogniiq_owner
// role; RLS is the final boundary. Lazily loaded from App.tsx so the customer/admin bundles are
// unaffected.
export function OwnerCockpit() {
  return (
    <PlatformOwnerRoute>
      <OwnerEntityProvider>
        <OwnerShell>
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
        </OwnerShell>
      </OwnerEntityProvider>
    </PlatformOwnerRoute>
  );
}

export default OwnerCockpit;
