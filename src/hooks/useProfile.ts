import { useAuth } from '@/contexts/AuthContext';

export function useProfile() {
  const { profile, isLoading, authError, refreshAccount, isPlatformAdmin, isPlatformOwner } = useAuth();
  return { profile, isLoading, authError, refreshProfile: refreshAccount, isPlatformAdmin, isPlatformOwner };
}
