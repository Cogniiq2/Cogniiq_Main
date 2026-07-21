import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { supabase } from '@/lib/supabase';
import { useOrganizations } from '@/hooks/useOrganizations';
import type { OrganizationPortalSettings, OrganizationSolution } from '@/lib/clientPlatform/types';

export type SolutionsLoadStatus = 'loading' | 'ready' | 'no-organization' | 'error';

interface SolutionsState {
  solutions: OrganizationSolution[];
  portalSettings: OrganizationPortalSettings | null;
  status: SolutionsLoadStatus;
  error: string | null;
  reload: () => Promise<void>;
}

const OrganizationSolutionsContext = createContext<SolutionsState | null>(null);

export function useOrganizationSolutionsValue(): SolutionsState {
  const { activeOrganizationId, isLoading: orgsLoading, authError } = useOrganizations();
  const [solutions, setSolutions] = useState<OrganizationSolution[]>([]);
  const [portalSettings, setPortalSettings] = useState<OrganizationPortalSettings | null>(null);
  const [status, setStatus] = useState<SolutionsLoadStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    if (orgsLoading) {
      setStatus('loading');
      return;
    }
    if (authError) {
      setSolutions([]);
      setPortalSettings(null);
      setError(authError);
      setStatus('error');
      return;
    }
    if (!activeOrganizationId) {
      setSolutions([]);
      setPortalSettings(null);
      setError(null);
      setStatus('no-organization');
      return;
    }

    setStatus('loading');
    setError(null);

    const [solutionsResult, portalResult] = await Promise.all([
      supabase
        .from('organization_solutions')
        .select('*')
        .eq('organization_id', activeOrganizationId)
        .order('nav_order', { ascending: true })
        .order('created_at', { ascending: true }),
      supabase
        .from('organization_portal_settings')
        .select('*')
        .eq('organization_id', activeOrganizationId)
        .maybeSingle(),
    ]);

    if (requestRef.current !== requestId) return;

    if (solutionsResult.error) {
      setSolutions([]);
      setPortalSettings(null);
      setError(solutionsResult.error.message);
      setStatus('error');
      return;
    }

    setSolutions((solutionsResult.data ?? []) as OrganizationSolution[]);
    setPortalSettings((portalResult.data as OrganizationPortalSettings | null) ?? null);
    setStatus('ready');
  }, [activeOrganizationId, authError, orgsLoading]);

  useEffect(() => {
    void load();
  }, [load]);

  return { solutions, portalSettings, status, error, reload: load };
}

export function OrganizationSolutionsProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: SolutionsState;
}) {
  return (
    <OrganizationSolutionsContext.Provider value={value}>
      {children}
    </OrganizationSolutionsContext.Provider>
  );
}

export function useOrganizationSolutions(): SolutionsState {
  const context = useContext(OrganizationSolutionsContext);
  if (!context) {
    throw new Error('useOrganizationSolutions must be used within OrganizationSolutionsProvider');
  }
  return context;
}
