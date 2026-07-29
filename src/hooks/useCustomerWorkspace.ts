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
import { toCustomerFacingError } from '@/lib/customerPlatform/customerErrors';
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

  // `fallback` is passed as an inline literal (`[]`, `null`) by every caller, so its
  // identity changes on every render. Holding it in a ref keeps the reset value
  // current without making it a dependency — which would re-create `load` endlessly.
  const fallbackRef = useRef(fallback);
  fallbackRef.current = fallback;

  const load = useCallback(async () => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    if (orgsLoading) {
      setStatus('loading');
      return;
    }
    if (authError) {
      setData(fallbackRef.current);
      // The auth layer surfaces raw backend text; a customer must never see it.
      setError(toCustomerFacingError(authError, 'Ihre Anmeldedaten konnten nicht geprüft werden.'));
      setStatus('error');
      return;
    }
    if (!activeOrganizationId) {
      setData(fallbackRef.current);
      setError(null);
      setStatus('no-organization');
      return;
    }

    setStatus('loading');
    const result = await loader();
    // Ignore a response that has been superseded by a newer request (workspace switch,
    // or a change of the loader's own parameter such as the project id).
    if (requestRef.current !== requestId) return;

    if (result.error) {
      setData(fallbackRef.current);
      setError(result.error);
      setStatus('error');
      return;
    }
    setData(result.data);
    setError(null);
    setStatus('ready');
    // `loader` IS a dependency: it closes over the project id, so omitting it left the
    // hook serving a previous project's rows after a param-only route change (the
    // component is reused, so no remount refires the effect). Every caller already
    // wraps its loader in useCallback (or passes a module-level function), so this
    // changes identity exactly when the request it describes changes.
  }, [activeOrganizationId, orgsLoading, authError, loader]);

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
