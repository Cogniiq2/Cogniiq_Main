// Maps an adapter promise onto the four UI states the dashboard renders.
//
// Keeps the request-generation guard in one place so a slow response to a superseded query can
// never overwrite a newer result — the failure mode that makes filtered tables show the wrong rows.

import { useCallback, useEffect, useRef, useState } from 'react';

import { errorMessageFor } from './adapter/ClubOperationsAdapter';

export type ResourceStatus = 'loading' | 'ready' | 'error';

export interface ResourceState<T> {
  status: ResourceStatus;
  data: T | null;
  error: string | null;
  reload: () => void;
}

export function useClubOperationsResource<T>(
  load: () => Promise<T>,
  deps: readonly unknown[],
): ResourceState<T> {
  const [status, setStatus] = useState<ResourceStatus>('loading');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestRef = useRef(0);
  const loadRef = useRef(load);
  loadRef.current = load;

  const run = useCallback(() => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    setStatus('loading');
    setError(null);

    loadRef.current().then(
      (result) => {
        if (requestRef.current !== requestId) return;
        setData(result);
        setStatus('ready');
      },
      (cause: unknown) => {
        if (requestRef.current !== requestId) return;
        setData(null);
        setError(errorMessageFor(cause));
        setStatus('error');
      },
    );
    // `load` is intentionally read through a ref: callers pass an inline closure, and depending on
    // its identity would refetch on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  return { status, data, error, reload: run };
}
