import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { classifyBackendError, loadActiveEntity, probeFinanceBackend, type FinanceBackendStatus } from '@/lib/ownerFinance/api';
import type { OwnerBusinessEntity } from '@/lib/ownerFinance/types';

type OwnerStatus = 'loading' | 'ready' | 'missing_backend' | 'error';

interface OwnerEntityState {
  entity: OwnerBusinessEntity | null;
  status: OwnerStatus;
  /** true only when the finance schema/RPCs are installed and reachable */
  backendReady: boolean;
  /** raw diagnostic string, surfaced ONLY in the owner-facing technical section */
  backendDetail: string | null;
  error: string | null;
  taxYear: number;
  setTaxYear: (year: number) => void;
  reload: () => Promise<void>;
}

const OwnerEntityContext = createContext<OwnerEntityState | null>(null);

export function OwnerEntityProvider({ children }: { children: ReactNode }) {
  const [entity, setEntity] = useState<OwnerBusinessEntity | null>(null);
  const [status, setStatus] = useState<OwnerStatus>('loading');
  const [backendDetail, setBackendDetail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [taxYear, setTaxYear] = useState<number>(2026);

  const reload = useCallback(async () => {
    setStatus('loading');
    setError(null);
    // First, cleanly determine whether the finance backend exists in this environment so the UI can
    // render a single polished setup screen instead of a cascade of raw PostgREST errors.
    const probe = await probeFinanceBackend();
    if (probe.status === 'missing') {
      setEntity(null);
      setBackendDetail(probe.detail);
      setStatus('missing_backend');
      return;
    }
    if (probe.status === 'error') {
      setEntity(null);
      setBackendDetail(probe.detail);
      setError(probe.detail);
      setStatus('error');
      return;
    }
    try {
      setEntity(await loadActiveEntity());
      setBackendDetail(null);
      setStatus('ready');
    } catch (e: unknown) {
      const classified: FinanceBackendStatus = classifyBackendError(e);
      const message = e instanceof Error ? e.message : String(e);
      setBackendDetail(message);
      if (classified === 'missing') { setEntity(null); setStatus('missing_backend'); return; }
      setError(message);
      setStatus('error');
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  return (
    <OwnerEntityContext.Provider
      value={{ entity, status, backendReady: status === 'ready', backendDetail, error, taxYear, setTaxYear, reload }}
    >
      {children}
    </OwnerEntityContext.Provider>
  );
}

export function useOwnerEntity(): OwnerEntityState {
  const ctx = useContext(OwnerEntityContext);
  if (!ctx) throw new Error('useOwnerEntity must be used within OwnerEntityProvider');
  return ctx;
}
