import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import {
  AUTH_BOOT_TIMEOUT_MS,
  AUTH_SIGN_OUT_TIMEOUT_MS,
  withTimeout,
} from '@/lib/auth/withTimeout';

/**
 * Shown when a sign-out request never came back. The local session is cleared
 * regardless, so the user is never trapped inside a shell they asked to leave.
 */
export const AUTH_SIGN_OUT_OFFLINE_MESSAGE =
  'Sie wurden auf diesem Gerät abgemeldet. Die Verbindung zum Server war unterbrochen, daher konnte die Sitzung dort nicht zusätzlich beendet werden.';

export type PlatformRole = 'customer' | 'cogniiq_admin' | 'cogniiq_owner';
export type OrganizationRole = 'owner' | 'admin' | 'member' | 'viewer';
export type MembershipStatus = 'invited' | 'active' | 'suspended';

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
  /**
   * The authentication bootstrap did not answer within its deadline. Distinct
   * from `authError` (which means it answered, with a failure) and from
   * `isLoading` (still waiting). Route guards render a recovery screen for this
   * rather than a spinner or a redirect to login.
   */
  authTimedOut: boolean;
  isPlatformAdmin: boolean;
  isPlatformOwner: boolean;
  refreshAccount: () => Promise<void>;
  /** Re-run the bootstrap after a timeout. Safe to call repeatedly. */
  retryAuth: () => Promise<void>;
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
  const [authTimedOut, setAuthTimedOut] = useState(false);
  // Distinguishes a superseded bootstrap (an earlier attempt still in flight when
  // the user pressed "Erneut versuchen") from the current one, so a late arrival
  // can never overwrite a newer result.
  const bootGenerationRef = useRef(0);
  const mountedRef = useRef(true);
  // Tracks the user id we have already attempted an invitation claim for, so token
  // refreshes and repeated auth events do not re-run the claim (prevents loops/flicker).
  const claimedForUserRef = useRef<string | null>(null);

  const loadAccount = useCallback(async (nextSession: Session | null) => {
    setAuthError(null);

    if (!nextSession?.user) {
      setProfile(null);
      setMemberships([]);
      setActiveOrganizationId(null);
      claimedForUserRef.current = null;
      return;
    }

    const userId = nextSession.user.id;

    // Automatic membership claim: attempted once per authenticated user, before loading
    // memberships. The RPC is idempotent and enforces confirmed-email / matching-email rules
    // server-side, so a successful call that claims nothing still counts as processed. Only a
    // successful result marks the user done; a failed call leaves the flag unset so a later auth
    // event (sign-in, token refresh) can retry, without a tight loop and without blocking login.
    if (claimedForUserRef.current !== userId) {
      try {
        const { error } = await supabase.rpc('claim_my_client_invitations');
        if (!error) {
          claimedForUserRef.current = userId;
        }
      } catch {
        // Unexpected/network failure: leave the flag unset for a later retry; never block login.
      }
    }

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
  }, []);

  const refreshAccount = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      setAuthError(error.message);
      return;
    }
    setSession(data.session);
    await loadAccount(data.session);
  }, [loadAccount]);

  /**
   * The authentication bootstrap, bounded by a deadline.
   *
   * The success path is byte-for-byte what it was: getSession, adopt the
   * session, load the account, stop loading. Two things are added around it.
   *
   *  1. If it has not finished within AUTH_BOOT_TIMEOUT_MS, `authTimedOut` is
   *     raised and `isLoading` drops, so the guards can offer retry and sign
   *     out instead of spinning forever. The in-flight request is NOT abandoned.
   *  2. Whenever the work does finish — before or long after the deadline — its
   *     result is adopted and the timed-out state clears itself. A merely slow
   *     connection therefore heals without the user doing anything.
   */
  const runBoot = useCallback(async () => {
    const generation = bootGenerationRef.current + 1;
    bootGenerationRef.current = generation;

    const isCurrent = () => mountedRef.current && bootGenerationRef.current === generation;

    setAuthTimedOut(false);
    setIsLoading(true);

    // Never rejects: an unexpected failure must not take the bootstrap down with
    // an unhandled rejection, it must land in the same reporting path as any
    // other failure.
    const work = (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) return { failure: error.message };
        setSession(data.session);
        await loadAccount(data.session);
        return {};
      } catch (error) {
        return { failure: error instanceof Error ? error.message : String(error) };
      }
    })();

    // Self-heal: adopt the result whenever it arrives, including after the
    // deadline has already shown the recovery screen.
    void work.then((outcome) => {
      if (!isCurrent()) return;
      if (outcome.failure) setAuthError(outcome.failure);
      setAuthTimedOut(false);
      setIsLoading(false);
    });

    const raced = await withTimeout(work, AUTH_BOOT_TIMEOUT_MS);
    if (!isCurrent()) return;
    if (raced.timedOut) {
      setAuthTimedOut(true);
      setIsLoading(false);
    }
  }, [loadAccount]);

  const retryAuth = useCallback(async () => {
    await runBoot();
  }, [runBoot]);

  useEffect(() => {
    mountedRef.current = true;

    void runBoot();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(true);

      // Bounded for the same reason as the boot: a stalled reload on a token
      // refresh would otherwise strand isLoading at true with no way out.
      const reload = loadAccount(nextSession).catch(() => undefined);
      void reload.then(() => {
        if (mountedRef.current) {
          setAuthTimedOut(false);
          setIsLoading(false);
        }
      });
      void withTimeout(reload, AUTH_BOOT_TIMEOUT_MS).then((raced) => {
        if (raced.timedOut && mountedRef.current) {
          setAuthTimedOut(true);
          setIsLoading(false);
        }
      });
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [loadAccount, runBoot]);

  const clearLocalAccountState = useCallback(() => {
    setSession(null);
    setProfile(null);
    setMemberships([]);
    setActiveOrganizationId(null);
    setAuthTimedOut(false);
    claimedForUserRef.current = null;
  }, []);

  const signOut = useCallback(async () => {
    setAuthError(null);

    // Bounded: a sign-out that hangs is worse than no sign-out button at all,
    // because the user has already decided to leave.
    const raced = await withTimeout(supabase.auth.signOut(), AUTH_SIGN_OUT_TIMEOUT_MS);

    if (raced.timedOut) {
      // The request is stuck. Clear the local session anyway — being unable to
      // reach the server must not keep someone signed in on their own device.
      clearLocalAccountState();
      setAuthError(AUTH_SIGN_OUT_OFFLINE_MESSAGE);
      return;
    }

    // Unchanged behaviour for a server that DID answer, with or without an error.
    const error = raced.error ?? raced.value?.error;
    if (error) {
      setAuthError(error instanceof Error ? error.message : String(error));
      return;
    }

    clearLocalAccountState();
  }, [clearLocalAccountState]);

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
      authTimedOut,
      isPlatformAdmin,
      isPlatformOwner,
      refreshAccount,
      retryAuth,
      signOut,
    };
  }, [
    activeOrganizationId, authError, authTimedOut, isLoading, memberships, profile,
    refreshAccount, retryAuth, session, signOut,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
