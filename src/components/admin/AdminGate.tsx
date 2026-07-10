import type { ReactNode } from 'react';

import { PlatformAdminRoute } from '@/components/auth/PlatformAdminRoute';

interface Props {
  children: ReactNode;
}

// Deprecated name kept only so existing admin pages do not need a broad refactor.
// Production admin access is enforced through Supabase Auth + profiles.platform_role.
export function AdminGate({ children }: Props) {
  return <PlatformAdminRoute>{children}</PlatformAdminRoute>;
}
