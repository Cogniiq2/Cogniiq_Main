import { useCallback, useEffect, useRef, useState } from 'react';

import {
  fetchCustomerDocuments,
  fetchCustomerInvoices,
  fetchCustomerMilestones,
  fetchCustomerProject,
  fetchCustomerProjects,
} from '@/lib/customerPlatform/customerApi';
import type {
  CustomerDocument,
  CustomerInvoice,
  CustomerMilestone,
  CustomerProject,
} from '@/lib/customerPlatform/types';
import { useOrganizations } from '@/hooks/useOrganizations';

export type CustomerLoadStatus = 'loading' | 'ready' | 'no-organization' | 'error';

interface BaseState {
  status: CustomerLoadStatus;
  error: string | null;
  reload: () => Promise<void>;
}

// The RPCs derive tenancy from auth.uid() themselves, so activeOrganizationId is used
// only to (a) know whether the account has an organization at all and (b) refetch when
// the user switches workspace. It is never sent to the server as an authorization input.
function useOrganizationScopedLoad<T>(
  loader: () => Promise<{ data: T; error: string | null }>,
  fallback: T,
): { data: T } & BaseState {
  const { activeOrganizationId, isLoading: orgsLoading, authError } = useOrganizations();
  const [data, setData] = useState<T>(fallback);
  const [status, setStatus] = useState<CustomerLoadStatus>('loading');
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
      setData(fallback);
      setError(authError);
      setStatus('error');
      return;
    }
    if (!activeOrganizationId) {
      setData(fallback);
      setError(null);
      setStatus('no-organization');
      return;
    }

    setStatus('loading');
    const result = await loader();
    // Ignore a response that has been superseded by a newer request (workspace switch).
    if (requestRef.current !== requestId) return;

    if (result.error) {
      setData(fallback);
      setError(result.error);
      setStatus('error');
      return;
    }
    setData(result.data);
    setError(null);
    setStatus('ready');
    // `loader` and `fallback` are intentionally excluded: callers pass inline closures,
    // and including them would refetch on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrganizationId, orgsLoading, authError]);

  useEffect(() => { void load(); }, [load]);

  return { data, status, error, reload: load };
}

export function useCustomerProjects() {
  const { data, ...rest } = useOrganizationScopedLoad<CustomerProject[]>(
    fetchCustomerProjects,
    [],
  );
  return { projects: data, ...rest };
}

export function useCustomerProject(projectId: string | undefined) {
  const load = useCallback(
    () => (projectId
      ? fetchCustomerProject(projectId)
      : Promise.resolve({ data: null, error: null })),
    [projectId],
  );
  const { data, ...rest } = useOrganizationScopedLoad<CustomerProject | null>(load, null);
  return { project: data, ...rest };
}

export function useCustomerMilestones(projectId: string | undefined) {
  const load = useCallback(
    () => (projectId
      ? fetchCustomerMilestones(projectId)
      : Promise.resolve({ data: [] as CustomerMilestone[], error: null })),
    [projectId],
  );
  const { data, ...rest } = useOrganizationScopedLoad<CustomerMilestone[]>(load, []);
  return { milestones: data, ...rest };
}

export function useCustomerDocuments(projectId: string | null = null) {
  const load = useCallback(() => fetchCustomerDocuments(projectId), [projectId]);
  const { data, ...rest } = useOrganizationScopedLoad<CustomerDocument[]>(load, []);
  return { documents: data, ...rest };
}

export function useCustomerInvoices(projectId: string | null = null) {
  const load = useCallback(() => fetchCustomerInvoices(projectId), [projectId]);
  const { data, ...rest } = useOrganizationScopedLoad<CustomerInvoice[]>(load, []);
  return { invoices: data, ...rest };
}
