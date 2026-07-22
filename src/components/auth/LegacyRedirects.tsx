import { Navigate, useLocation } from 'react-router-dom';

import { mapLegacyPath } from '@/lib/auth/authorizedRedirect';

// Preserve old bookmarks and links. `/owner/*` moved into the unified workspace at `/admin/finance/*`
// (and `/owner/clients` into the shared CRM); `/admin/login` folds into the one canonical login. The
// remaining route segment and any query string are preserved.
export function LegacyOwnerRedirect() {
  const { pathname, search } = useLocation();
  return <Navigate to={`${mapLegacyPath(pathname)}${search}`} replace />;
}

export function LegacyLoginRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/app/login${search}`} replace />;
}
