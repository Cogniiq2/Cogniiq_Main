import { useCallback, useEffect, useState } from 'react';

import {
  type ServiceEntitlement,
  type ServiceEntitlementRow,
  mapServiceEntitlementRow,
} from '@/lib/customerAccess';
import { supabase } from '@/lib/supabase';

export function useServiceEntitlements(organizationId: string | null) {
  const [entitlements, setEntitlements] = useState<ServiceEntitlement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!organizationId) {
      setEntitlements([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await supabase
      .from('service_entitlements')
      .select('*')
      .eq('organization_id', organizationId)
      .order('product_key', { ascending: true });

    if (result.error) {
      setEntitlements([]);
      setError(result.error.message);
    } else {
      setEntitlements(((result.data ?? []) as ServiceEntitlementRow[]).map(mapServiceEntitlementRow));
    }

    setIsLoading(false);
  }, [organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    entitlements,
    isLoading,
    error,
    refresh: load,
  };
}
