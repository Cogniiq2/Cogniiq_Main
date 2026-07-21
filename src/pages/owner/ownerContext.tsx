import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { loadActiveEntity } from '@/lib/ownerFinance/api';
import type { OwnerBusinessEntity } from '@/lib/ownerFinance/types';

interface OwnerEntityState {
  entity: OwnerBusinessEntity | null;
  status: 'loading' | 'ready' | 'error';
  error: string | null;
  taxYear: number;
  setTaxYear: (year: number) => void;
  reload: () => Promise<void>;
}

const OwnerEntityContext = createContext<OwnerEntityState | null>(null);

export function OwnerEntityProvider({ children }: { children: ReactNode }) {
  const [entity, setEntity] = useState<OwnerBusinessEntity | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [taxYear, setTaxYear] = useState<number>(2026);

  const reload = useCallback(async () => {
    setStatus('loading');
    try {
      setEntity(await loadActiveEntity());
      setError(null);
      setStatus('ready');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus('error');
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  return (
    <OwnerEntityContext.Provider value={{ entity, status, error, taxYear, setTaxYear, reload }}>
      {children}
    </OwnerEntityContext.Provider>
  );
}

export function useOwnerEntity(): OwnerEntityState {
  const ctx = useContext(OwnerEntityContext);
  if (!ctx) throw new Error('useOwnerEntity must be used within OwnerEntityProvider');
  return ctx;
}
