import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { clearClientHubLocalState } from '@/lib/pwa';
import { supabase } from '@/lib/supabase';

export type PlatformRole = 'customer' | 'cogniiq_admin' | 'cogniiq_owner';
export type OrganizationRole =
  | 'owner'
  | 'admin'
  | 'management'
  | 'dispatcher'
  | 'technician'
  | 'warehouse'
  | 'accounting'
  | 'member'
  | 'viewer';
export type MembershipStatus = 'invited' | 'active' | 'suspended';
export type AuthenticationAssuranceLevel = 'aal1' | 'aal2' | (string & {});

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  platform_role: PlatformRole;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string | null;
  status: 'pending' | 'active' | 'suspended' | 'cancelled';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMembership {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationRole;
  status: MembershipStatus;
  created_at: string;
  updated_at: string;
  organization: Organization | null;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  memberships: OrganizationMembership[];
  activeOrganizationId: string | null;
  setActiveOrganizationId: (organizationId: string | null) => void;
  isLoading: boolean;
  authError: string | null;
  aal: AuthenticationAssuranceLevel | null;
  nextAal: AuthenticationAssuranceLevel | null;
  isPlatformAdmin: boolean;
  isPlatformOwner: boolean;
  refreshAccount: () => Promise<void>;
  refreshMfaLevel: () => Promise<void>;
  signOut: () => Promise<void>;
}

interface RawMembershipRow extends Omit<OrganizationMembership, 'organization'> {
  organizations?: Organization | Organization[] | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function normalizeMembership(row: RawMembershipRow): OrganizationMembership {
  const organization = Array.isArray(row.organizations)
    ? row.organizations[0] ?? null
    : row.organizations ?? null;

  return {
    id: row.id,
    organization_id: row.organization_id,
    user_id: row.user_id,
    role: row.role,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    organization,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [memberships, setMemberships] = useState<OrganizationMembership[]>([]);
  const [activeOrganizationId, setActiveOrganizationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [aal, setAal] = useState<AuthenticationAssuranceLevel | null>(null);
  const [nextAal, setNextAal] = useState<AuthenticationAssuranceLevel | null>(null);

  const refreshMfaLevel = useCallback(async () => {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (error) {
      setAal('aal1');
      setNextAal(null);
      setAuthError((current) => current ?? error.message);
      return;
    }

    setAal((data.currentLevel ?? 'aal1') as AuthenticationAssuranceLevel);
    setNextAal((data.nextLevel ?? data.currentLevel ?? 'aal1') as AuthenticationAssuranceLevel);
  }, []);

  const loadAccount = useCallback(async (nextSession: Session | null) => {
    setAuthError(null);

    if (!nextSession?.user) {
      setProfile(null);
      setMemberships([]);
      setActiveOrganizationId(null);
      setAal(null);
      setNextAal(null);
      return;
    }

    const userId = nextSession.user.id;
    const [profileResult, membershipsResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(),
      supabase
        .from('organization_members')
        .select(`
          id,
          organization_id,
          user_id,
          role,
          status,
          created_at,
          updated_at,
          organizations (
            id,
            name,
            slug,
            status,
            created_by,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: true }),
      refreshMfaLevel(),
    ]);

    if (profileResult.error) {
      setProfile(null);
      setAuthError(profileResult.error.message);
    } else {
      setProfile((profileResult.data as Profile | null) ?? null);
    }

    if (membershipsResult.error) {
      setMemberships([]);
      setAuthError((current) => current ?? membershipsResult.error.message);
    } else {
      const normalized = ((membershipsResult.data ?? []) as RawMembershipRow[]).map(normalizeMembership);
      setMemberships(normalized);
      setActiveOrganizationId((current) => {
        if (current && normalized.some((item) => item.organization_id === current)) return current;
        return normalized[0]?.organization_id ?? null;
      });
    }
  }, [refreshMfaLevel]);

  const refreshAccount = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      setAuthError(error.message);
      return;
    }
    setSession(data.session);
    await loadAccount(data.session);
  }, [loadAccount]);

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;

      if (error) {
        setAuthError(error.message);
      }

      setSession(data.session);
      await loadAccount(data.session);

      if (mounted) setIsLoading(false);
    };

    void boot();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(true);
      void loadAccount(nextSession).finally(() => setIsLoading(false));
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadAccount]);

  const signOut = useCallback(async () => {
    setAuthError(null);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthError(error.message);
      return;
    }
    setSession(null);
    setProfile(null);
    setMemberships([]);
    setActiveOrganizationId(null);
    setAal(null);
    setNextAal(null);
    await clearClientHubLocalState();
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const isPlatformOwner = profile?.platform_role === 'cogniiq_owner';
    const isPlatformAdmin = profile?.platform_role === 'cogniiq_admin' || isPlatformOwner;

    return {
      session,
      user: session?.user ?? null,
      profile,
      memberships,
      activeOrganizationId,
      setActiveOrganizationId,
      isLoading,
      authError,
      aal,
      nextAal,
      isPlatformAdmin,
      isPlatformOwner,
      refreshAccount,
      refreshMfaLevel,
      signOut,
    };
  }, [aal, activeOrganizationId, authError, isLoading, memberships, nextAal, profile, refreshAccount, refreshMfaLevel, session, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
