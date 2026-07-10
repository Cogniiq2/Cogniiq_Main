import { useAuth } from '@/contexts/AuthContext';

export function useSession() {
  const { session, user, isLoading, authError, signOut } = useAuth();
  return { session, user, isLoading, authError, signOut };
}
