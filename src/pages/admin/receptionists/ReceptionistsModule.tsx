import { Navigate, Route, Routes } from 'react-router-dom';

import { PlatformOwnerRoute } from '@/components/auth/PlatformOwnerRoute';
import { ReceptionistsListPage } from './ReceptionistsListPage';
import { ReceptionistDetailPage } from './ReceptionistDetailPage';

// AI Receptionists — the internal control center for Golden Agent instances, mounted at
// /admin/receptionists/* inside the shared internal workspace shell. Owner-only in the UI;
// RLS on the ai_receptionist_* tables and the role check in receptionist-admin are the boundary.
export function ReceptionistsModule() {
  return (
    <PlatformOwnerRoute>
      <Routes>
        <Route index element={<ReceptionistsListPage />} />
        <Route path=":receptionistId" element={<ReceptionistDetailPage />} />
        <Route path="*" element={<Navigate to="." replace />} />
      </Routes>
    </PlatformOwnerRoute>
  );
}

export default ReceptionistsModule;
