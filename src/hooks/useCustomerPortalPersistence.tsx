import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useOrganizations } from '@/hooks/useOrganizations';
import {
  type CustomerPortalError,
  type CustomerPortalSnapshot,
  type OnboardingDraft,
  type PhoneDraft,
  type ReceptionistDraft,
  loadCustomerPortalSnapshot,
  saveOnboardingDraft,
  savePhoneDraft,
  saveReceptionistDraft,
  toCustomerPortalError,
} from '@/lib/customerPortalPersistence';

export type CustomerPortalLoadStatus = 'loading' | 'ready' | 'no-organization' | 'error';
export type CustomerPortalSaveTarget = 'onboarding' | 'receptionist' | 'phone';
export type CustomerPortalSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface SaveState {
  status: CustomerPortalSaveStatus;
  error: CustomerPortalError | null;
  savedAt: Date | null;
}

const emptySnapshot: CustomerPortalSnapshot = {
  business: null,
  onboardingSession: null,
  receptionistConfig: null,
  phoneConfig: null,
};

const idleSaveState: SaveState = {
  status: 'idle',
  error: null,
  savedAt: null,
};

const initialSaveStates: Record<CustomerPortalSaveTarget, SaveState> = {
  onboarding: idleSaveState,
  receptionist: idleSaveState,
  phone: idleSaveState,
};

export type CustomerPortalPersistenceValue = ReturnType<typeof useCustomerPortalPersistenceValue>;

const CustomerPortalPersistenceContext = createContext<CustomerPortalPersistenceValue | null>(null);

export function CustomerPortalPersistenceProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: CustomerPortalPersistenceValue;
}) {
  return (
    <CustomerPortalPersistenceContext.Provider value={value}>
      {children}
    </CustomerPortalPersistenceContext.Provider>
  );
}

export function useCustomerPortalPersistence() {
  const context = useContext(CustomerPortalPersistenceContext);
  if (!context) {
    throw new Error('useCustomerPortalPersistence must be used inside CustomerAppShell');
  }
  return context;
}

export function useCustomerPortalPersistenceValue() {
  const { isPlatformAdmin } = useAuth();
  const {
    activeMembership,
    activeOrganization,
    activeOrganizationId,
    isLoading: organizationsLoading,
    authError,
  } = useOrganizations();
  const [snapshot, setSnapshot] = useState<CustomerPortalSnapshot>(emptySnapshot);
  const [loadStatus, setLoadStatus] = useState<CustomerPortalLoadStatus>('loading');
  const [loadError, setLoadError] = useState<CustomerPortalError | null>(null);
  const [saveStates, setSaveStates] = useState<Record<CustomerPortalSaveTarget, SaveState>>(initialSaveStates);
  const loadRequestRef = useRef(0);
  const saveRequestRef = useRef<Record<CustomerPortalSaveTarget, number>>({
    onboarding: 0,
    receptionist: 0,
    phone: 0,
  });
  const activeOrganizationIdRef = useRef<string | null>(activeOrganizationId);

  useEffect(() => {
    activeOrganizationIdRef.current = activeOrganizationId;
  }, [activeOrganizationId]);

  const canEdit = useMemo(() => {
    if (isPlatformAdmin) return true;
    return activeMembership?.role === 'owner' || activeMembership?.role === 'admin';
  }, [activeMembership?.role, isPlatformAdmin]);

  const load = useCallback(async () => {
    const requestId = loadRequestRef.current + 1;
    loadRequestRef.current = requestId;

    if (organizationsLoading) {
      setLoadStatus('loading');
      return;
    }

    if (authError) {
      setSnapshot(emptySnapshot);
      setLoadError({ kind: 'authorization', message: authError });
      setLoadStatus('error');
      return;
    }

    if (!activeOrganizationId) {
      setSnapshot(emptySnapshot);
      setLoadError(null);
      setLoadStatus('no-organization');
      setSaveStates(initialSaveStates);
      return;
    }

    setLoadStatus('loading');
    setLoadError(null);

    try {
      const loadedSnapshot = await loadCustomerPortalSnapshot(activeOrganizationId);
      if (loadRequestRef.current !== requestId || activeOrganizationIdRef.current !== activeOrganizationId) return;
      setSnapshot(loadedSnapshot);
      setLoadStatus('ready');
      setSaveStates(initialSaveStates);
    } catch (error) {
      if (loadRequestRef.current !== requestId || activeOrganizationIdRef.current !== activeOrganizationId) return;
      setSnapshot(emptySnapshot);
      setLoadError(toCustomerPortalError(error));
      setLoadStatus('error');
    }
  }, [activeOrganizationId, authError, organizationsLoading]);

  useEffect(() => {
    void load();
  }, [load]);

  const setSaving = useCallback((target: CustomerPortalSaveTarget, requestId: number) => {
    setSaveStates((current) => ({
      ...current,
      [target]: { status: 'saving', error: null, savedAt: current[target].savedAt },
    }));
    saveRequestRef.current[target] = requestId;
  }, []);

  const setSaveResult = useCallback((
    target: CustomerPortalSaveTarget,
    requestId: number,
    state: SaveState
  ) => {
    if (saveRequestRef.current[target] !== requestId) return;
    setSaveStates((current) => ({
      ...current,
      [target]: state,
    }));
  }, []);

  const saveOnboarding = useCallback(async (draft: OnboardingDraft): Promise<CustomerPortalError | null> => {
    const target: CustomerPortalSaveTarget = 'onboarding';
    const requestId = saveRequestRef.current[target] + 1;
    const organizationId = activeOrganizationId;
    setSaving(target, requestId);

    if (!organizationId) {
      const error: CustomerPortalError = {
        kind: 'authorization',
        message: 'Es ist keine Organisation fuer dieses Konto verbunden.',
      };
      setSaveResult(target, requestId, { status: 'error', error, savedAt: null });
      return error;
    }

    if (!canEdit) {
      const error: CustomerPortalError = {
        kind: 'authorization',
        message: 'Nur Organisations-Admins und Owner koennen diese Daten speichern.',
      };
      setSaveResult(target, requestId, { status: 'error', error, savedAt: null });
      return error;
    }

    try {
      const result = await saveOnboardingDraft(
        organizationId,
        snapshot.business,
        snapshot.onboardingSession,
        draft
      );
      if (activeOrganizationIdRef.current !== organizationId) return null;

      setSnapshot((current) => ({
        ...current,
        business: result.business,
        onboardingSession: result.onboardingSession,
      }));
      setSaveResult(target, requestId, { status: 'saved', error: null, savedAt: new Date() });
      setLoadStatus('ready');
      return null;
    } catch (error) {
      const portalError = toCustomerPortalError(error);
      setSaveResult(target, requestId, { status: 'error', error: portalError, savedAt: null });
      return portalError;
    }
  }, [activeOrganizationId, canEdit, setSaveResult, setSaving, snapshot.business, snapshot.onboardingSession]);

  const saveReceptionist = useCallback(async (draft: ReceptionistDraft): Promise<CustomerPortalError | null> => {
    const target: CustomerPortalSaveTarget = 'receptionist';
    const requestId = saveRequestRef.current[target] + 1;
    const organizationId = activeOrganizationId;
    setSaving(target, requestId);

    if (!organizationId) {
      const error: CustomerPortalError = {
        kind: 'authorization',
        message: 'Es ist keine Organisation fuer dieses Konto verbunden.',
      };
      setSaveResult(target, requestId, { status: 'error', error, savedAt: null });
      return error;
    }

    if (!canEdit) {
      const error: CustomerPortalError = {
        kind: 'authorization',
        message: 'Nur Organisations-Admins und Owner koennen diese Daten speichern.',
      };
      setSaveResult(target, requestId, { status: 'error', error, savedAt: null });
      return error;
    }

    try {
      const receptionistConfig = await saveReceptionistDraft(
        organizationId,
        snapshot.business,
        snapshot.receptionistConfig,
        draft
      );
      if (activeOrganizationIdRef.current !== organizationId) return null;

      setSnapshot((current) => ({
        ...current,
        receptionistConfig,
      }));
      setSaveResult(target, requestId, { status: 'saved', error: null, savedAt: new Date() });
      setLoadStatus('ready');
      return null;
    } catch (error) {
      const portalError = toCustomerPortalError(error);
      setSaveResult(target, requestId, { status: 'error', error: portalError, savedAt: null });
      return portalError;
    }
  }, [activeOrganizationId, canEdit, setSaveResult, setSaving, snapshot.business, snapshot.receptionistConfig]);

  const savePhone = useCallback(async (draft: PhoneDraft): Promise<CustomerPortalError | null> => {
    const target: CustomerPortalSaveTarget = 'phone';
    const requestId = saveRequestRef.current[target] + 1;
    const organizationId = activeOrganizationId;
    setSaving(target, requestId);

    if (!organizationId) {
      const error: CustomerPortalError = {
        kind: 'authorization',
        message: 'Es ist keine Organisation fuer dieses Konto verbunden.',
      };
      setSaveResult(target, requestId, { status: 'error', error, savedAt: null });
      return error;
    }

    if (!canEdit) {
      const error: CustomerPortalError = {
        kind: 'authorization',
        message: 'Nur Organisations-Admins und Owner koennen diese Daten speichern.',
      };
      setSaveResult(target, requestId, { status: 'error', error, savedAt: null });
      return error;
    }

    try {
      const phoneConfig = await savePhoneDraft(
        organizationId,
        snapshot.business,
        snapshot.phoneConfig,
        draft
      );
      if (activeOrganizationIdRef.current !== organizationId) return null;

      setSnapshot((current) => ({
        ...current,
        phoneConfig,
      }));
      setSaveResult(target, requestId, { status: 'saved', error: null, savedAt: new Date() });
      setLoadStatus('ready');
      return null;
    } catch (error) {
      const portalError = toCustomerPortalError(error);
      setSaveResult(target, requestId, { status: 'error', error: portalError, savedAt: null });
      return portalError;
    }
  }, [activeOrganizationId, canEdit, setSaveResult, setSaving, snapshot.business, snapshot.phoneConfig]);

  return {
    activeOrganization,
    activeOrganizationId,
    canEdit,
    loadStatus,
    loadError,
    snapshot,
    saveStates,
    retry: load,
    saveOnboarding,
    saveReceptionist,
    savePhone,
  };
}
