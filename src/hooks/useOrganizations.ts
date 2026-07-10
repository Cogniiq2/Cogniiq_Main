import { useMemo } from 'react';

import { useAuth } from '@/contexts/AuthContext';

export function useOrganizations() {
  const { memberships, activeOrganizationId, setActiveOrganizationId, isLoading, authError } = useAuth();

  const organizations = useMemo(
    () => memberships
      .map((membership) => membership.organization)
      .filter((organization): organization is NonNullable<typeof organization> => Boolean(organization)),
    [memberships]
  );

  const activeMembership = memberships.find((membership) => membership.organization_id === activeOrganizationId) ?? null;
  const activeOrganization = activeMembership?.organization ?? null;

  return {
    memberships,
    organizations,
    activeMembership,
    activeOrganization,
    activeOrganizationId,
    setActiveOrganizationId,
    isLoading,
    authError,
  };
}
