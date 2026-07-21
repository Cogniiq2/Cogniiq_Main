import { Routes, Route, Navigate } from 'react-router-dom';

import { PlatformAdminRoute } from '@/components/auth/PlatformAdminRoute';
import { AdminClientShell } from '@/pages/admin/clients/adminUi';
import { ClientsListPage } from '@/pages/admin/clients/ClientsListPage';
import { NewClientWizard } from '@/pages/admin/clients/NewClientWizard';
import { ClientDetailPage } from '@/pages/admin/clients/ClientDetailPage';
import { AdminSolutionsPage } from '@/pages/admin/clients/AdminSolutionsPage';
import { AdminInvitationsPage } from '@/pages/admin/clients/AdminInvitationsPage';

// Entry for the Cogniiq admin client platform. Protected by database-backed platform-admin checks.
export function AdminClientPlatform() {
  return (
    <PlatformAdminRoute>
      <AdminClientShell>
        <Routes>
          <Route path="/admin/clients" element={<ClientsListPage />} />
          <Route path="/admin/clients/new" element={<NewClientWizard />} />
          <Route path="/admin/clients/:organizationId" element={<ClientDetailPage />} />
          <Route path="/admin/solutions" element={<AdminSolutionsPage />} />
          <Route path="/admin/invitations" element={<AdminInvitationsPage />} />
          <Route path="*" element={<Navigate to="/admin/clients" replace />} />
        </Routes>
      </AdminClientShell>
    </PlatformAdminRoute>
  );
}

export default AdminClientPlatform;
