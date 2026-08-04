import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

import { useCustomerProjects } from '@/hooks/useCustomerWorkspace';
import type { CustomerLoadStatus } from '@/hooks/useCustomerWorkspace';
import type { CustomerProject } from '@/lib/customerPlatform/types';

// The customer's project list, loaded ONCE per portal mount.
//
// The premium rail lists the customer's real projects, and the overview renders the
// same rows. Without this provider both would call `list_customer_projects`, which
// is the same tenant-scoped RPC twice per navigation. The provider sits in
// `CustomerAppShell`, so the shell and the page it wraps read one response.
//
// Nothing about the request changes: it is still `useCustomerProjects()`, still the
// same RPC, still scoped server-side from auth.uid(), still refetched when the
// active organization changes.

interface CustomerProjectsContextValue {
  projects: CustomerProject[];
  status: CustomerLoadStatus;
  error: string | null;
  reload: () => Promise<void>;
}

const CustomerProjectsContext = createContext<CustomerProjectsContextValue | null>(null);

export function useCustomerProjectsValue(): CustomerProjectsContextValue {
  const { projects, status, error, reload } = useCustomerProjects();
  return { projects, status, error, reload };
}

export function CustomerProjectsProvider({
  value,
  children,
}: {
  value: CustomerProjectsContextValue;
  children: ReactNode;
}) {
  return <CustomerProjectsContext.Provider value={value}>{children}</CustomerProjectsContext.Provider>;
}

/**
 * Read the shared project list.
 *
 * Deliberately throws rather than quietly falling back to its own `useCustomerProjects()`
 * call: a conditional fallback would have to run the hook unconditionally to satisfy the
 * rules of hooks, which would re-introduce exactly the duplicate request this provider
 * exists to remove. Every customer page mounts inside `CustomerAppShell`, so the
 * provider is always present on the real routes.
 */
export function useSharedCustomerProjects(): CustomerProjectsContextValue {
  const context = useContext(CustomerProjectsContext);
  if (!context) {
    throw new Error('useSharedCustomerProjects must be used inside CustomerAppShell.');
  }
  return context;
}
