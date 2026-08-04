import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  BookOpen,
  Building2,
  CheckCircle2,
  Circle,
  FileText,
  Headphones,
  Info,
  Lock,
  LogOut,
  Mic2,
  Phone,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  TestTube2,
  UserPlus,
  Wand2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { CustomerAppShell } from '@/components/app/CustomerAppShell';
import {
  customerMembershipStatusLabel,
  customerOrganizationRoleLabel,
  customerOrganizationStatusLabel,
  customerPlatformRoleLabel,
} from '@/lib/customerPlatform/customerLabels';
import {
  AppAddButton,
  AppButton,
  AppCard,
  AppEmptyState,
  AppErrorState,
  AppField,
  AppInPreparationBadge,
  AppInlineEditor,
  AppLaunchChecklist,
  AppPageHeader,
  AppPreviewNotice,
  AppProgress,
  AppReadOnlyNotice,
  AppSaveBar,
  AppSection,
  AppSegmentedControl,
  AppSelect,
  AppStatusBadge,
  AppStepList,
  AppSkeleton,
  AppTextarea,
  appEase,
} from '@/components/app/CustomerAppPrimitives';
import {
  defaultLifecycleState,
  knowledgeSections,
  launchChecklist,
  lifecycleDisplays,
  onboardingStages,
  phoneRoles,
  researchPreviewSteps,
  testScenarios,
  type LifecycleTone,
} from '@/components/app/customerPortalModel';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomerPortalPersistence } from '@/hooks/useCustomerPortalPersistence';
import { useOrganizations } from '@/hooks/useOrganizations';
import {
  type OnboardingDraft,
  type OnboardingGoal,
  type PhoneDraft,
  type ReceptionistAllowedAction,
  type ReceptionistDraft,
  type ReceptionistProhibitedAction,
  type ReceptionistResponsibility,
  type ReceptionistTone,
  type SupportedLanguage,
  makeOnboardingDraft,
  makePhoneDraft,
  makeReceptionistDraft,
  onboardingGoalLabels,
  onboardingGoalOptions,
  receptionistAllowedActionLabels,
  receptionistAllowedActionOptions,
  receptionistProhibitedActionLabels,
  receptionistProhibitedActionOptions,
  receptionistResponsibilityLabels,
  receptionistResponsibilityOptions,
  receptionistToneLabels,
  supportedLanguages,
} from '@/lib/customerPortalPersistence';
import { cn } from '@/lib/utils';

export type CustomerSection =
  | 'onboarding'
  | 'receptionist'
  | 'knowledge'
  | 'phone'
  | 'test'
  | 'calls'
  | 'leads'
  | 'settings';

const sectionConfig: Record<CustomerSection, {
  title: string;
  eyebrow: string;
  description: string;
  icon: LucideIcon;
}> = {
  onboarding: {
    title: 'Einrichtung',
    eyebrow: 'Onboarding',
    description: 'Ein ruhiger, gefuehrter Start fuer Unternehmensdaten, Ziele und die spaetere Recherche.',
    icon: Wand2,
  },
  receptionist: {
    title: 'Rezeptionist',
    eyebrow: 'Verhalten',
    description: 'Identitaet, Sprache, Tonalitaet, Aufgaben und Grenzen des spaeteren KI-Rezeptionisten.',
    icon: Headphones,
  },
  knowledge: {
    title: 'Wissen',
    eyebrow: 'Antwortgrundlage',
    description: 'Die spaetere Review-Flaeche fuer bestaetigte Geschaeftsdaten, Quellen und manuelle Korrekturen.',
    icon: BookOpen,
  },
  phone: {
    title: 'Telefon',
    eyebrow: 'Anbindung',
    description: 'Telefonrollen, Weiterleitung, Eskalation und Aktivierungsstatus klar getrennt.',
    icon: Phone,
  },
  test: {
    title: 'Test & Start',
    eyebrow: 'Qualitaet',
    description: 'Test-Szenarien und Launch-Checkliste, ohne echte Anrufe oder Go-live auszufuehren.',
    icon: TestTube2,
  },
  calls: {
    title: 'Anrufe',
    eyebrow: 'Betrieb',
    description: 'Leere, aber vorbereitete Architektur fuer spaetere echte Anrufdaten.',
    icon: Mic2,
  },
  leads: {
    title: 'Leads',
    eyebrow: 'Kontakte',
    description: 'Leere, aber vorbereitete Architektur fuer spaetere echte Leads.',
    icon: UserPlus,
  },
  settings: {
    title: 'Einstellungen',
    eyebrow: 'Profil & Konto',
    // Proper German orthography rather than the ae/oe/ue transliteration used elsewhere
    // in this file: this is a customer-facing page in the redesign's scope.
    description: 'Ihre Profil- und Organisationsdaten sowie der Zustand Ihres Zugangs — übersichtlich an einer Stelle.',
    icon: Settings,
  },
};

export function CustomerSectionPage({ section }: { section: CustomerSection }) {
  return (
    <CustomerAppShell>
      <CustomerSectionContent section={section} />
    </CustomerAppShell>
  );
}

function CustomerSectionContent({ section }: { section: CustomerSection }) {
  const config = sectionConfig[section];
  const Icon = config.icon;
  const { snapshot, loadStatus } = useCustomerPortalPersistence();
  const lifecycle = lifecycleDisplays[getLifecycleState(snapshot.onboardingSession?.status, Boolean(snapshot.business))];
  const isPersistedSection = section === 'onboarding' || section === 'receptionist' || section === 'phone';
  // Sections that intentionally have no backing data yet. They are labelled honestly as
  // "In Vorbereitung" rather than shown as if they were broken or merely empty.
  const isInPreparation = inPreparationSections.has(section);

  return (
    <>
      <AppPageHeader
        eyebrow={config.eyebrow}
        title={config.title}
        description={config.description}
        meta={
          <div className="flex flex-wrap items-center gap-2">
            {/* The lifecycle badge describes the RECEPTIONIST onboarding, so it is
                suppressed on /app/settings — an account page that showed
                "Einrichtung noch nicht begonnen" told the customer something true about a
                different product and nothing about their profile. */}
            {section === 'settings' ? null : (
              <AppStatusBadge
                label={loadStatus === 'loading' ? 'Daten werden geladen' : lifecycle.label}
                tone={loadStatus === 'error' ? 'danger' : lifecycle.tone}
              />
            )}
            {isPersistedSection ? (
              <AppStatusBadge label="Persistenz aktiv" tone="success" icon={Icon} />
            ) : isInPreparation ? (
              <AppInPreparationBadge />
            ) : null}
          </div>
        }
      />
      {isInPreparation ? (
        <div className="mb-8">
          <AppPreviewNotice>
            Dieser Bereich ist bewusst noch nicht aktiv. Die Struktur ist bereits vorbereitet, es werden
            jedoch keine Beispiel- oder Platzhalterdaten angezeigt. Sobald die echte Datenquelle verbunden
            ist, erscheinen Ihre Inhalte hier automatisch.
          </AppPreviewNotice>
        </div>
      ) : null}
      {renderSection(section)}
    </>
  );
}

const inPreparationSections = new Set<CustomerSection>(['knowledge', 'test', 'calls', 'leads']);

function getLifecycleState(status: string | null | undefined, hasBusiness: boolean): keyof typeof lifecycleDisplays {
  switch (status) {
    case 'in_progress':
      return 'setup_in_progress';
    case 'research_queued':
    case 'research_running':
      return 'research_in_progress';
    case 'review_required':
    case 'ready_for_test':
    case 'ready_for_launch':
    case 'live':
    case 'paused':
    case 'error':
      return status;
    default:
      return hasBusiness ? 'setup_in_progress' : defaultLifecycleState;
  }
}

function renderSection(section: CustomerSection) {
  switch (section) {
    case 'onboarding':
      return <OnboardingExperience />;
    case 'receptionist':
      return <ReceptionistExperience />;
    case 'knowledge':
      return <KnowledgeExperience />;
    case 'phone':
      return <PhoneExperience />;
    case 'test':
      return <TestExperience />;
    case 'calls':
      return <OperationalExperience type="calls" />;
    case 'leads':
      return <OperationalExperience type="leads" />;
    case 'settings':
      return <SettingsExperience />;
  }
}

function OnboardingExperience() {
  const reduceMotion = useReducedMotion();
  const {
    canEdit,
    loadError,
    loadStatus,
    retry,
    saveOnboarding,
    saveStates,
    snapshot,
  } = useCustomerPortalPersistence();
  const loadedDraft = useMemo(
    () => makeOnboardingDraft(snapshot.business, snapshot.onboardingSession),
    [snapshot.business, snapshot.onboardingSession]
  );
  const loadedDraftKey = useMemo(() => JSON.stringify(loadedDraft), [loadedDraft]);
  const [draft, setDraft] = useState<OnboardingDraft>(loadedDraft);
  const [baseline, setBaseline] = useState<OnboardingDraft>(loadedDraft);
  const [stageIndex, setStageIndex] = useState(getOnboardingStageIndex(loadedDraft.currentStep));
  const activeStage = onboardingStages[stageIndex];
  const progress = Math.round(((stageIndex + 1) / onboardingStages.length) * 100);
  const saveState = saveStates.onboarding;
  const fieldErrors = saveState.error?.fieldErrors ?? {};
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(baseline), [baseline, draft]);
  const saveFeedback = getSaveFeedback(saveState, dirty, canEdit);

  useEffect(() => {
    setDraft(loadedDraft);
    setBaseline(loadedDraft);
    setStageIndex(getOnboardingStageIndex(loadedDraft.currentStep));
  }, [loadedDraftKey, loadedDraft]);

  useUnsavedChangesWarning(dirty && saveState.status !== 'saving');

  if (loadStatus === 'loading') {
    return <AppSkeleton label="Onboardingdaten werden geladen" />;
  }

  if (loadStatus === 'error' && loadError) {
    return <AppErrorState message={loadError.message} onRetry={() => void retry()} />;
  }

  if (loadStatus === 'no-organization') {
    return (
      <AppEmptyState
        icon={Building2}
        title="Keine Organisation verbunden"
        description="Onboarding-Daten koennen erst gespeichert werden, wenn dieses Konto Mitglied einer Organisation ist."
      />
    );
  }

  const updateBusinessField = (key: Exclude<keyof OnboardingDraft['business'], 'primaryLanguage'>, value: string) => {
    setDraft((current) => ({
      ...current,
      business: {
        ...current.business,
        [key]: value,
      },
    }));
  };

  const updatePreferredBehavior = (value: string) => {
    setDraft((current) => ({
      ...current,
      preferredBehavior: value,
    }));
  };

  const toggleGoal = (goal: OnboardingGoal) => {
    setDraft((current) => ({
      ...current,
      selectedGoals: toggleValue(current.selectedGoals, goal),
    }));
  };

  const goToStage = (nextIndex: number) => {
    const boundedIndex = Math.max(0, Math.min(onboardingStages.length - 1, nextIndex));
    const nextStep = getOnboardingStepFromIndex(boundedIndex);
    setStageIndex(boundedIndex);
    setDraft((current) => ({
      ...current,
      currentStep: nextStep,
    }));
  };

  const goNext = () => {
    const activeStep = getOnboardingStepFromIndex(stageIndex);
    const nextIndex = Math.min(onboardingStages.length - 1, stageIndex + 1);
    const nextStep = getOnboardingStepFromIndex(nextIndex);
    setStageIndex(nextIndex);
    setDraft((current) => ({
      ...current,
      currentStep: nextStep,
      completedSteps: addUnique(current.completedSteps, activeStep),
    }));
  };

  const handleSave = async () => {
    const error = await saveOnboarding(draft);
    if (!error) setBaseline(draft);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        <div className="overflow-hidden rounded-panel border border-hairline bg-white shadow-card">
          <div className="p-6 sm:p-8">
          {!canEdit ? (
            <AppReadOnlyNotice>
              Sie sehen diese Angaben schreibgeschützt. Nur Owner und Admins Ihrer Organisation können
              Onboarding-Daten ändern — deshalb sind die Felder unten deaktiviert.
            </AppReadOnlyNotice>
          ) : null}
          <div className="mb-6">
            <AppProgress value={progress} label={`Schritt ${stageIndex + 1} von ${onboardingStages.length}`} />
          </div>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">{activeStage.title}</p>
              <h2 className="text-2xl font-bold tracking-tight text-gray-950">{activeStage.description}</h2>
            </div>
            <AppStatusBadge label={saveFeedback.badgeLabel} tone={saveFeedback.badgeTone} />
          </div>

          {/* The only Framer Motion animation in this file. It was unconditional, so the
              onboarding step transition kept moving for a customer who had asked the
              system not to animate — the CSS-level prefers-reduced-motion block in
              index.css cannot reach a JS-driven transform. */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStage.id}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.22, ease: appEase }}
            >
          {stageIndex === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <AppField id="company-name" label="Unternehmensname" value={draft.business.name} disabled={!canEdit} error={fieldErrors.name} onChange={(event) => updateBusinessField('name', event.target.value)} placeholder="z. B. Cogniiq GmbH" />
              <AppField id="company-website" label="Website" value={draft.business.website} disabled={!canEdit} error={fieldErrors.website} onChange={(event) => updateBusinessField('website', event.target.value)} placeholder="https://..." />
              <AppField id="company-industry" label="Branche" value={draft.business.industry} disabled={!canEdit} onChange={(event) => updateBusinessField('industry', event.target.value)} placeholder="Praxis, Restaurant, Dienstleister ..." />
              <AppField id="company-address" label="Adresse" value={draft.business.address} disabled={!canEdit} onChange={(event) => updateBusinessField('address', event.target.value)} placeholder="Strasse, PLZ, Ort" />
              <AppField id="company-contact-email" label="Kontakt-E-Mail" value={draft.business.contactEmail} disabled={!canEdit} error={fieldErrors.contactEmail} onChange={(event) => updateBusinessField('contactEmail', event.target.value)} placeholder="name@unternehmen.de" />
              <AppField id="company-contact-person" label="Ansprechpartner" value={draft.business.primaryContactName} disabled={!canEdit} onChange={(event) => updateBusinessField('primaryContactName', event.target.value)} placeholder="Vorname Nachname" />
              <AppField id="company-business-number" label="Bestehende Geschaeftsnummer" value={draft.business.existingBusinessPhone} disabled={!canEdit} error={fieldErrors.existingBusinessPhone} onChange={(event) => updateBusinessField('existingBusinessPhone', event.target.value)} placeholder="+49 ..." />
            </div>
          ) : null}

          {stageIndex === 1 ? (
            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2">
                {onboardingGoalOptions.map((goal) => {
                  const active = draft.selectedGoals.includes(goal);
                  return (
                    <button
                      key={goal}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => toggleGoal(goal)}
                      className={cn(
                        'flex min-h-14 items-center gap-3 rounded-xl border px-4 text-left text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                        active ? 'border-gray-400 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      )}
                      aria-pressed={active}
                    >
                      {active ? <CheckCircle2 size={16} aria-hidden="true" /> : <Circle size={16} className="text-gray-300" aria-hidden="true" />}
                      {onboardingGoalLabels[goal]}
                    </button>
                  );
                })}
              </div>
              <AppTextarea
                id="preferred-behavior"
                label="Gewuenschtes Verhalten"
                value={draft.preferredBehavior}
                disabled={!canEdit}
                onChange={(event) => updatePreferredBehavior(event.target.value)}
                placeholder="Kurz, freundlich, formell, mit klarer Weiterleitung bei Unsicherheit ..."
              />
            </div>
          ) : null}

          {stageIndex === 2 ? (
            <div className="space-y-4">
              <AppEmptyState
                icon={Search}
                title="Research ist noch nicht gestartet"
                description="Diese Phase zeigt spaeter echte Website-Analyse und strukturierte Geschaeftsfakten. Aktuell wird kein Timer simuliert und kein Backend-Job gestartet."
              />
              <AppStepList steps={researchPreviewSteps} currentIndex={-1} />
            </div>
          ) : null}

          {stageIndex === 3 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {['Leistungen', 'Preise', 'Oeffnungszeiten', 'Team', 'FAQs', 'Richtlinien', 'Kontaktdaten', 'Buchungslinks'].map((item) => (
                <div key={item} className="rounded-xl border border-hairline bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-900">{item}</p>
                  <p className="mt-2 text-[13px] leading-relaxed text-gray-500">
                    Wird spaeter aus echten Quellen vorgeschlagen und muss bestaetigt werden.
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          {stageIndex === 4 ? (
            <div className="space-y-4">
              <AppEmptyState
                icon={Wand2}
                title="Weiter in die Detailseiten"
                description="Unternehmen und Fortschritt koennen gespeichert werden. Wissen, Test und Launch bleiben bis zu spaeteren Backend-Phasen ohne echte Funktion."
                action={
                  <>
                    <AppButton to="/app/knowledge" variant="secondary">Wissen oeffnen</AppButton>
                    <AppButton to="/app/receptionist" variant="secondary">Rezeptionist oeffnen</AppButton>
                    <AppButton to="/app/phone" variant="secondary">Telefon oeffnen</AppButton>
                  </>
                }
              />
            </div>
          ) : null}
            </motion.div>
          </AnimatePresence>

          {stageIndex === 0 && !draft.business.name ? (
            <div className="mt-5 rounded-card border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-[12.5px] font-medium leading-5 text-amber-800">
                Der Unternehmensname ist erforderlich, bevor ein Business-Datensatz gespeichert wird.
              </p>
            </div>
          ) : null}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <AppButton variant="secondary" disabled={stageIndex === 0} onClick={() => goToStage(stageIndex - 1)}>
              Zurueck
            </AppButton>
            <AppButton disabled={stageIndex === onboardingStages.length - 1} onClick={goNext}>
              Weiter
            </AppButton>
          </div>
          </div>
        </div>

        <AppSaveBar
          message={saveFeedback.message}
          actionLabel={saveFeedback.actionLabel}
          onAction={() => void handleSave()}
          disabled={!saveFeedback.canSubmit}
          loading={saveState.status === 'saving'}
          tone={saveFeedback.tone}
        />
      </div>

      <aside className="space-y-6">
        <AppCard>
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Setup Pfad</p>
          <div className="space-y-3">
            {onboardingStages.map((stage, index) => (
              <button
                key={stage.id}
                type="button"
                onClick={() => goToStage(index)}
                className={cn(
                  'w-full rounded-xl border px-4 py-3 text-left transition-colors',
                  stageIndex === index ? 'border-gray-300 bg-white shadow-sm' : 'border-hairline bg-gray-50 hover:border-gray-200'
                )}
              >
                <p className="text-sm font-semibold text-gray-900">{stage.title}</p>
                <p className="mt-1 text-[12px] leading-5 text-gray-500">{stage.description}</p>
              </button>
            ))}
          </div>
        </AppCard>
      </aside>
    </div>
  );
}

function ReceptionistExperience() {
  const {
    canEdit,
    loadError,
    loadStatus,
    retry,
    saveReceptionist,
    saveStates,
    snapshot,
  } = useCustomerPortalPersistence();
  const loadedDraft = useMemo(
    () => makeReceptionistDraft(snapshot.receptionistConfig),
    [snapshot.receptionistConfig]
  );
  const loadedDraftKey = useMemo(() => JSON.stringify(loadedDraft), [loadedDraft]);
  const [draft, setDraft] = useState<ReceptionistDraft>(loadedDraft);
  const [baseline, setBaseline] = useState<ReceptionistDraft>(loadedDraft);
  const saveState = saveStates.receptionist;
  const fieldErrors = saveState.error?.fieldErrors ?? {};
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(baseline), [baseline, draft]);
  const saveFeedback = getSaveFeedback(saveState, dirty, canEdit && Boolean(snapshot.business));

  useEffect(() => {
    setDraft(loadedDraft);
    setBaseline(loadedDraft);
  }, [loadedDraftKey, loadedDraft]);

  useUnsavedChangesWarning(dirty && saveState.status !== 'saving');

  if (loadStatus === 'loading') {
    return <AppSkeleton label="Rezeptionistenkonfiguration wird geladen" />;
  }

  if (loadStatus === 'error' && loadError) {
    return <AppErrorState message={loadError.message} onRetry={() => void retry()} />;
  }

  if (loadStatus === 'no-organization') {
    return (
      <AppEmptyState
        icon={Building2}
        title="Keine Organisation verbunden"
        description="Rezeptionistenkonfigurationen koennen erst gespeichert werden, wenn dieses Konto Mitglied einer Organisation ist."
      />
    );
  }

  const updateField = <Key extends keyof ReceptionistDraft>(key: Key, value: ReceptionistDraft[Key]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const toggleResponsibility = (value: ReceptionistResponsibility) => {
    setDraft((current) => ({
      ...current,
      responsibilities: toggleValue(current.responsibilities, value),
    }));
  };

  const toggleAllowedAction = (value: ReceptionistAllowedAction) => {
    setDraft((current) => ({
      ...current,
      allowedActions: toggleValue(current.allowedActions, value),
    }));
  };

  const toggleProhibitedAction = (value: ReceptionistProhibitedAction) => {
    setDraft((current) => ({
      ...current,
      prohibitedActions: toggleValue(current.prohibitedActions, value),
    }));
  };

  const handleSave = async () => {
    const error = await saveReceptionist(draft);
    if (!error) setBaseline(draft);
  };

  return (
    <div className="space-y-8">
      {!snapshot.business ? (
        <AppEmptyState
          compact
          icon={Building2}
          title="Unternehmensdaten zuerst speichern"
          description="Der Rezeptionist wird einem Business-Datensatz zugeordnet. Speichern Sie zuerst die Basisdaten im Onboarding."
          action={<AppButton to="/app/onboarding" variant="secondary">Zum Onboarding</AppButton>}
        />
      ) : null}
      {!canEdit && snapshot.business ? (
        <AppReadOnlyNotice>
          Sie sehen diese Einstellungen schreibgeschützt. Nur Owner und Admins Ihrer Organisation können
          das Verhalten des Rezeptionisten ändern — deshalb sind die Felder unten deaktiviert.
        </AppReadOnlyNotice>
      ) : null}

      <AppSection eyebrow="Identitaet" title="Wie der Rezeptionist spaeter auftreten soll">
        <AppCard className="rounded-panel">
          <div className="grid gap-4 md:grid-cols-2">
            <AppField id="receptionist-name" label="Rezeptionistenname" value={draft.receptionistName} disabled={!canEdit || !snapshot.business} onChange={(event) => updateField('receptionistName', event.target.value)} placeholder="Noch nicht festgelegt" />
            <AppField
              id="voice-placeholder"
              label="Stimme"
              placeholder="Noch nicht verbunden"
              disabled
              description="Die Stimmauswahl wird freigeschaltet, sobald Cogniiq Ihren Rezeptionisten mit dem Sprachsystem verbunden hat."
            />
            <AppSelect
              id="primary-language"
              label="Hauptsprache"
              value={draft.primaryLanguage}
              onChange={(value) => updateField('primaryLanguage', value as SupportedLanguage)}
              error={fieldErrors.primaryLanguage}
              disabled={!canEdit || !snapshot.business}
              options={supportedLanguages.map((language) => ({ value: language, label: language === 'de' ? 'Deutsch' : 'Englisch' }))}
            />
            <AppSelect
              id="second-language"
              label="Optionale weitere Sprache"
              value={draft.additionalLanguages[0] ?? 'none'}
              onChange={(value) => updateField('additionalLanguages', value === 'none' ? [] : [value as SupportedLanguage])}
              disabled={!canEdit || !snapshot.business}
              options={[
                { value: 'none', label: 'Keine weitere Sprache' },
                { value: 'en', label: 'Englisch' },
                { value: 'de', label: 'Deutsch' },
              ]}
            />
            <AppTextarea id="greeting" label="Begruessung" value={draft.greeting} disabled={!canEdit || !snapshot.business} onChange={(event) => updateField('greeting', event.target.value)} placeholder="Guten Tag, Sie sprechen mit ..." className="md:col-span-2" />
            <AppTextarea id="after-hours-behavior" label="After-hours Verhalten" value={draft.afterHoursInstruction} disabled={!canEdit || !snapshot.business} onChange={(event) => updateField('afterHoursInstruction', event.target.value)} placeholder="Ausserhalb der Oeffnungszeiten Nachricht aufnehmen, keine Termine bestaetigen ..." />
            <AppTextarea id="transfer-behavior" label="Transfer Verhalten" value={draft.transferInstruction} disabled={!canEdit || !snapshot.business} onChange={(event) => updateField('transferInstruction', event.target.value)} placeholder="Bei Unsicherheit oder dringenden Anliegen an die Transfernummer uebergeben ..." />
          </div>
        </AppCard>
      </AppSection>

      <AppSection eyebrow="Kommunikation" title="Tonalitaet und Aufgaben">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <AppCard className="rounded-panel">
            <AppSegmentedControl
              label="Kommunikationsstil"
              value={draft.tone}
              onChange={(value) => updateField('tone', value as ReceptionistTone)}
              disabled={!canEdit || !snapshot.business}
              options={(Object.keys(receptionistToneLabels) as ReceptionistTone[]).map((tone) => ({
                value: tone,
                label: receptionistToneLabels[tone],
                description: getToneDescription(tone),
              }))}
            />
            {fieldErrors.tone ? <p className="mt-3 text-sm text-red-600">{fieldErrors.tone}</p> : null}
          </AppCard>
          <AppCard className="rounded-panel">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Status</p>
            <AppEmptyState
              compact
              icon={Headphones}
              title="Kein echter Assistent vorhanden"
              description="Diese Konfiguration wird noch nicht an Vapi oder ein Telefoniesystem uebergeben."
            />
          </AppCard>
        </div>
      </AppSection>

      <AppSection eyebrow="Regeln" title="Verantwortung und Grenzen">
        <div className="grid gap-4 lg:grid-cols-3">
          <RuleColumn
            title="Verantwortlichkeiten"
            items={[...receptionistResponsibilityOptions]}
            labels={receptionistResponsibilityLabels}
            selectedItems={draft.responsibilities}
            disabled={!canEdit || !snapshot.business}
            onToggle={toggleResponsibility}
          />
          <RuleColumn
            title="Verhalten"
            items={[...receptionistAllowedActionOptions]}
            labels={receptionistAllowedActionLabels}
            selectedItems={draft.allowedActions}
            disabled={!canEdit || !snapshot.business}
            onToggle={toggleAllowedAction}
          />
          <RuleColumn
            title="Einschraenkungen"
            items={[...receptionistProhibitedActionOptions]}
            labels={receptionistProhibitedActionLabels}
            selectedItems={draft.prohibitedActions}
            disabled={!canEdit || !snapshot.business}
            onToggle={toggleProhibitedAction}
          />
        </div>
      </AppSection>

      <AppSaveBar
        message={saveFeedback.message}
        actionLabel={saveFeedback.actionLabel}
        onAction={() => void handleSave()}
        disabled={!saveFeedback.canSubmit}
        loading={saveState.status === 'saving'}
        tone={saveFeedback.tone}
      />
    </div>
  );
}

function KnowledgeExperience() {
  const [activeSectionId, setActiveSectionId] = useState(knowledgeSections[0]?.id ?? 'profile');
  const activeSection = knowledgeSections.find((section) => section.id === activeSectionId) ?? knowledgeSections[0];

  if (!activeSection) return null;

  return (
    <div className="space-y-8">
      <AppSection
        eyebrow="Review"
        title="Geschaeftswissen fuer sichere Antworten"
        description="Jeder Bereich ist fuer Wert, Quelle, Vertrauen, Bestaetigung und manuelle Korrektur vorbereitet. Aktuell gibt es keine recherchierten Datensaetze."
        action={
          <AppAddButton disabledReason="Eigene Einträge sind möglich, sobald die Wissensbasis mit echten Geschäftsdaten verbunden ist. Bis dahin werden hier bewusst keine Beispieldaten angezeigt.">
            Information hinzufuegen
          </AppAddButton>
        }
      >
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="rounded-panel border border-hairline bg-white p-3 shadow-card">
            <p className="px-3 pb-3 pt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Kategorien</p>
            <div className="space-y-1">
              {knowledgeSections.map((section) => {
                const active = section.id === activeSectionId;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSectionId(section.id)}
                    className={cn(
                      'relative w-full rounded-card px-3 py-3 text-left transition-colors duration-200',
                      active ? 'bg-gray-950 text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-950'
                    )}
                  >
                    <span className="block text-sm font-semibold">{section.title}</span>
                    <span className={cn('mt-1 block text-[11.5px] leading-5', active ? 'text-white/55' : 'text-gray-400')}>
                      {section.emptyLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="overflow-hidden rounded-panel border border-hairline bg-white shadow-card">
            <div className="border-b border-hairline px-6 py-6 sm:px-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Review Bereich</p>
                  <h2 className="text-2xl font-semibold tracking-tight text-gray-950">{activeSection.title}</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">{activeSection.description}</p>
                </div>
                <AppStatusBadge label="leer" tone="neutral" />
              </div>
            </div>
            <div className="space-y-5 bg-gray-50/70 p-6 sm:p-8">
              <AppInlineEditor
                label={activeSection.emptyLabel}
                value="Noch kein Wert vorhanden"
                source="Keine Quelle"
                status="Wartet auf Daten"
              />
              <div className="grid gap-3 md:grid-cols-3">
                {['Quelle', 'Bestaetigung', 'Manuelle Korrektur'].map((label) => (
                  <div key={label} className="rounded-card border border-hairline bg-white p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">{label}</p>
                    <p className="mt-2 text-[13px] leading-relaxed text-gray-500">Wird verfuegbar, sobald echte Daten existieren.</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AppSection>
      <AppSaveBar
        message="Bearbeiten, Loeschen, Freigeben und Speichern sind als UI-Muster vorbereitet, aber noch nicht mit einer Datenquelle verbunden."
        actionLabel="Speichern folgt"
      />
    </div>
  );
}

function PhoneExperience() {
  const {
    canEdit,
    loadError,
    loadStatus,
    retry,
    savePhone,
    saveStates,
    snapshot,
  } = useCustomerPortalPersistence();
  const loadedDraft = useMemo(() => makePhoneDraft(snapshot.phoneConfig), [snapshot.phoneConfig]);
  const loadedDraftKey = useMemo(() => JSON.stringify(loadedDraft), [loadedDraft]);
  const [draft, setDraft] = useState<PhoneDraft>(loadedDraft);
  const [baseline, setBaseline] = useState<PhoneDraft>(loadedDraft);
  const saveState = saveStates.phone;
  const fieldErrors = saveState.error?.fieldErrors ?? {};
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(baseline), [baseline, draft]);
  const saveFeedback = getSaveFeedback(saveState, dirty, canEdit && Boolean(snapshot.business));

  useEffect(() => {
    setDraft(loadedDraft);
    setBaseline(loadedDraft);
  }, [loadedDraftKey, loadedDraft]);

  useUnsavedChangesWarning(dirty && saveState.status !== 'saving');

  if (loadStatus === 'loading') {
    return <AppSkeleton label="Telefonkonfiguration wird geladen" />;
  }

  if (loadStatus === 'error' && loadError) {
    return <AppErrorState message={loadError.message} onRetry={() => void retry()} />;
  }

  if (loadStatus === 'no-organization') {
    return (
      <AppEmptyState
        icon={Building2}
        title="Keine Organisation verbunden"
        description="Telefonkonfigurationen koennen erst gespeichert werden, wenn dieses Konto Mitglied einer Organisation ist."
      />
    );
  }

  const updateField = <Key extends keyof PhoneDraft>(key: Key, value: PhoneDraft[Key]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    const error = await savePhone(draft);
    if (!error) setBaseline(draft);
  };

  return (
    <div className="space-y-8">
      {!snapshot.business ? (
        <AppEmptyState
          compact
          icon={Building2}
          title="Unternehmensdaten zuerst speichern"
          description="Die Telefonkonfiguration wird einem Business-Datensatz zugeordnet. Speichern Sie zuerst die Basisdaten im Onboarding."
          action={<AppButton to="/app/onboarding" variant="secondary">Zum Onboarding</AppButton>}
        />
      ) : null}
      {!canEdit && snapshot.business ? (
        <AppReadOnlyNotice>
          Sie sehen diese Einstellungen schreibgeschützt. Nur Owner und Admins Ihrer Organisation können
          die Telefonkonfiguration ändern — deshalb sind die Felder unten deaktiviert.
        </AppReadOnlyNotice>
      ) : null}

      <AppSection eyebrow="Methode" title="Nummern sauber trennen">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <AppCard>
            <AppSegmentedControl
              label="Zukuenftige Einrichtung"
              value={draft.setupMode}
              onChange={(value) => updateField('setupMode', value as PhoneDraft['setupMode'])}
              disabled={!canEdit || !snapshot.business}
              options={[
                { value: 'ai-number', label: 'Option A: Neue KI-Telefonnummer verwenden', description: 'Provisionierung ist in dieser Phase nicht aktiv.' },
                { value: 'forwarding', label: 'Option B: Bestehende Geschaeftsnummer weiterleiten', description: 'Weiterleitungshinweise, keine Portierung.' },
              ]}
            />
            {fieldErrors.setupMode ? <p className="mt-3 text-sm text-red-600">{fieldErrors.setupMode}</p> : null}
          </AppCard>
          <AppCard>
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Aktivierung</p>
            <AppEmptyState
              compact
              icon={Lock}
              title={snapshot.phoneConfig?.assignedAiNumber ? 'Systemnummer vorhanden' : 'Nicht verbunden'}
              description={snapshot.phoneConfig?.assignedAiNumber ? `Systemseitig zugewiesen: ${snapshot.phoneConfig.assignedAiNumber}` : 'Es wird keine Nummer gekauft, provisioniert oder verbunden.'}
            />
          </AppCard>
        </div>
        <div className="mt-4">
          <AppPreviewNotice>
            Kundenwerte werden gespeichert. KI-Nummer, Teststatus, Provisionierung und Live-Schaltung bleiben systemkontrolliert und koennen hier nicht gesetzt werden.
          </AppPreviewNotice>
        </div>
      </AppSection>

      <AppSection eyebrow="Telefonrollen" title="Jede Nummer hat eine klare Aufgabe">
        <AppCard>
          <div className="grid gap-4 md:grid-cols-2">
            {phoneRoles.map((role) => (
              <AppField
                key={role.id}
                id={`phone-${role.id}`}
                label={role.label}
                description={role.id === 'ai' ? 'Systemkontrolliertes Feld.' : role.description}
                placeholder={role.placeholder}
                value={getPhoneRoleValue(role.id, draft, snapshot.phoneConfig?.assignedAiNumber ?? '')}
                error={getPhoneRoleError(role.id, fieldErrors)}
                disabled={role.id === 'ai' || !canEdit || !snapshot.business}
                onChange={(event) => updatePhoneRole(role.id, event.target.value, updateField)}
              />
            ))}
          </div>
          <label className="mt-5 flex items-start gap-3 rounded-xl border border-hairline bg-gray-50 px-4 py-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900"
              checked={draft.forwardingConfirmed}
              disabled={!canEdit || !snapshot.business}
              onChange={(event) => updateField('forwardingConfirmed', event.target.checked)}
            />
            <span>
              <span className="block text-sm font-semibold text-gray-900">Weiterleitung kundenseitig bestaetigt</span>
              <span className="mt-1 block text-[12.5px] leading-5 text-gray-500">
                Diese Bestaetigung speichert nur Ihren aktuellen Stand. Sie loest keine technische Aktivierung aus.
              </span>
            </span>
          </label>
        </AppCard>
      </AppSection>

      <div className="grid gap-6 lg:grid-cols-2">
        <AppCard>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Systemstatus</p>
          <h2 className="text-xl font-bold tracking-tight text-gray-950">Teststatus: {formatPhoneTestStatus(snapshot.phoneConfig?.testStatus)}</h2>
          <p className="mt-3 text-sm leading-6 text-gray-500">
            Der Teststatus ist ein geschuetztes Systemfeld. Kundinnen und Kunden koennen keinen erfolgreichen Test oder Live-Zustand setzen.
          </p>
        </AppCard>
        <AppCard>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Warnung</p>
          <h2 className="text-xl font-bold tracking-tight text-gray-950">Transfer-loop vermeiden</h2>
          <p className="mt-3 text-sm leading-6 text-gray-500">
            Die menschliche Transfernummer darf nicht wieder auf die KI-Nummer zeigen. Diese Pruefung wird spaeter technisch erzwungen.
          </p>
        </AppCard>
      </div>

      <AppSaveBar
        message={saveFeedback.message}
        actionLabel={saveFeedback.actionLabel}
        onAction={() => void handleSave()}
        disabled={!saveFeedback.canSubmit}
        loading={saveState.status === 'saving'}
        tone={saveFeedback.tone}
      />
    </div>
  );
}

function TestExperience() {
  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <AppCard>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Testen</p>
          <h2 className="text-2xl font-bold tracking-tight text-gray-950">Testnummer noch nicht verfuegbar</h2>
          <p className="mt-3 text-sm leading-6 text-gray-500">
            Browser-Call und Telefonnummer bleiben Platzhalter, bis ein echter Rezeptionist provisioniert ist.
          </p>
          <div className="mt-6">
            <AppButton
              disabled
              icon={Phone}
              disabledReason="Testanrufe sind erst möglich, sobald Ihr Rezeptionist provisioniert und eine Telefonnummer verbunden ist. Cogniiq schaltet diesen Schritt für Sie frei."
            >
              Testanruf starten
            </AppButton>
          </div>
        </AppCard>
        <AppCard>
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Letzter Test</p>
          <AppEmptyState
            compact
            icon={TestTube2}
            title="Noch kein Testanruf"
            description="Es werden keine Transkripte, Ergebnisse oder Fehler simuliert."
          />
        </AppCard>
      </div>

      <AppSection eyebrow="Szenarien" title="Empfohlene Testfragen">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {testScenarios.map((scenario) => (
            <AppCard key={scenario.id} className="shadow-none">
              <p className="text-sm font-semibold text-gray-950">{scenario.title}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{scenario.description}</p>
            </AppCard>
          ))}
        </div>
      </AppSection>

      <AppSection eyebrow="Launch" title="Freigabe bleibt gesperrt">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <AppCard>
            <AppLaunchChecklist items={launchChecklist} />
          </AppCard>
          <AppCard>
            <AppEmptyState
              compact
              icon={Lock}
              title="Go-live nicht verfuegbar"
              description="Aktivierung wird erst nach Setup, Test, Zahlung und Backend-Provisionierung moeglich."
              action={
                <AppButton
                  disabled
                  disabledReason="Die Freigabe erfolgt durch Cogniiq, sobald Setup, Test, Abrechnung und Provisionierung abgeschlossen sind."
                >
                  Live schalten
                </AppButton>
              }
            />
          </AppCard>
        </div>
      </AppSection>
      <AppPreviewNotice>
        Test und Go-live bleiben bewusst deaktiviert, bis ein echter Assistent, Telefonie, Abrechnung und Provisionierung verbunden sind.
      </AppPreviewNotice>
    </div>
  );
}

const searchDisabledReason =
  'Suche und Filter werden aktiv, sobald echte Daten aus dem Telefoniesystem eintreffen. Es werden keine Beispieldaten angezeigt.';

function OperationalExperience({ type }: { type: 'calls' | 'leads' }) {
  const isCalls = type === 'calls';
  const title = isCalls ? 'Anrufarchitektur' : 'Leadarchitektur';
  const emptyTitle = isCalls ? 'Noch keine Anrufe' : 'Noch keine Leads';
  const emptyDescription = isCalls
    ? 'Der Verlauf bleibt leer, bis echte Anrufdaten aus dem Telefoniesystem eintreffen.'
    : 'Diese Seite zeigt erst Kontakte, wenn echte Leads durch den Rezeptionisten erfasst wurden.';
  const futureFields = isCalls
    ? ['Zeitpunkt', 'Dauer', 'Anrufer', 'Ergebnis', 'Zusammenfassung', 'Transkript', 'Tags', 'Transferstatus', 'Lead erstellt', 'Aufzeichnung']
    : ['Name', 'Telefon', 'E-Mail', 'Anliegen', 'Leistung', 'Dringlichkeit', 'Status', 'Notizen', 'Quellanruf', 'Erstellt am'];

  return (
    <div className="space-y-8">
      <AppCard>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">{title}</p>
            <h2 className="text-2xl font-bold tracking-tight text-gray-950">{emptyTitle}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">{emptyDescription}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative block">
              <span className="sr-only">Suchen</span>
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" aria-hidden="true" />
              <input
                disabled
                placeholder="Suche folgt"
                title={searchDisabledReason}
                aria-describedby="operational-search-hint"
                className="h-11 rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-400 outline-none"
              />
              <span id="operational-search-hint" className="mt-1.5 block max-w-xs text-[11.5px] leading-[1.45] text-gray-400">
                {searchDisabledReason}
              </span>
            </label>
            <AppButton variant="secondary" disabled icon={SlidersHorizontal} disabledReason={searchDisabledReason}>
              Filter
            </AppButton>
          </div>
        </div>
      </AppCard>
      <AppPreviewNotice>
        Suche, Filter und Detailfelder sind nur als Struktur vorbereitet. Es werden keine Anruf- oder Lead-Daten erfunden.
      </AppPreviewNotice>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        <AppCard>
          <AppEmptyState icon={isCalls ? Mic2 : UserPlus} title={emptyTitle} description={emptyDescription} compact />
        </AppCard>
        <AppCard>
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Spaetere Detailansicht</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {futureFields.map((field) => (
              <div key={field} className="rounded-xl border border-hairline bg-gray-50 px-4 py-3">
                <p className="text-[12px] font-semibold text-gray-700">{field}</p>
                <p className="mt-1 text-[11px] text-gray-400">Wartet auf echte Daten</p>
              </div>
            ))}
          </div>
        </AppCard>
      </div>
    </div>
  );
}

function SettingsExperience() {
  const { profile, user, signOut } = useAuth();
  const { activeOrganization, activeMembership, memberships } = useOrganizations();

  // Everything on this page is READ-ONLY, and it says so once at group level rather than
  // repeating a hint on each field. No mutation path is added here: the customer profile
  // and organization records are owner-provisioned in this release, and a form that
  // silently discards a save would be worse than an honest read-only surface.
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-8">
        <AppSection
          eyebrow="Account"
          title="Ihr Profil"
          description="Diese Angaben stammen aus Ihrem Cogniiq-Zugang."
        >
          <AppReadOnlyNotice>
            Ihre Profil- und Organisationsdaten werden von Cogniiq gepflegt. Möchten Sie einen
            Eintrag ändern, genügt eine kurze Nachricht über den Support — die Änderung wird
            dann kontrolliert übernommen.
          </AppReadOnlyNotice>
          <AppCard>
            <dl className="grid gap-4 md:grid-cols-2">
              <ReadOnlyField label="Name" value={profile?.full_name || 'Nicht hinterlegt'} />
              <ReadOnlyField label="E-Mail" value={profile?.email ?? user?.email ?? 'Nicht verfügbar'} />
              <ReadOnlyField label="Telefon" value={profile?.phone || 'Nicht hinterlegt'} />
              {/* Humanised, never the stored token: a customer must not read
                  `cogniiq_admin` or `customer` off their own settings page. */}
              <ReadOnlyField
                label="Zugangsart"
                value={profile ? customerPlatformRoleLabel(profile.platform_role) : 'Wird geladen …'}
                description="Bestimmt, welche Bereiche des Portals Ihnen angezeigt werden."
              />
            </dl>
          </AppCard>
        </AppSection>

        <AppSection
          eyebrow="Organisation"
          title="Ihr Unternehmen"
          description={
            memberships.length > 1
              ? 'Sie gehören mehreren Organisationen an. Angezeigt wird die aktuell ausgewählte — wechseln können Sie oben links in der Navigation.'
              : 'Der Workspace, für den dieses Portal geführt wird.'
          }
        >
          <AppCard>
            <dl className="grid gap-4 md:grid-cols-2">
              <ReadOnlyField
                label="Organisation"
                value={activeOrganization?.name ?? 'Keine Organisation verbunden'}
              />
              <ReadOnlyField
                label="Status"
                value={
                  activeOrganization
                    ? customerOrganizationStatusLabel(activeOrganization.status)
                    : 'Noch nicht provisioniert'
                }
              />
              <ReadOnlyField
                label="Ihre Rolle"
                value={activeMembership ? customerOrganizationRoleLabel(activeMembership.role) : '—'}
                description="Legt fest, was Sie innerhalb dieser Organisation sehen und tun können."
              />
              <ReadOnlyField
                label="Zugang"
                value={activeMembership ? customerMembershipStatusLabel(activeMembership.status) : '—'}
              />
            </dl>
          </AppCard>
        </AppSection>

        <AppSection
          eyebrow="Optionen"
          title="In Vorbereitung"
          description="Diese Bereiche sind geplant, aber noch nicht aktiv. Sie sind hier aufgeführt, damit Sie wissen, was kommt — nicht als bedienbare Schalter."
        >
          <div className="grid gap-3 md:grid-cols-2">
            <SettingsTile
              icon={Info}
              title="Benachrichtigungen"
              text="Später können Sie hier festlegen, worüber Cogniiq Sie per E-Mail informiert."
            />
            <SettingsTile
              icon={ShieldCheck}
              title="Sicherheit"
              text="Ihr Zugang ist bereits durch Anmeldung und Rechteprüfung geschützt. Zusätzliche Optionen folgen."
            />
            <SettingsTile
              icon={FileText}
              title="Datenschutz und Daten"
              text="Datenexport und Löschung werden als geprüfter Prozess umgesetzt, nicht als Schalter."
            />
            <SettingsTile
              icon={Settings}
              title="Sprache"
              text="Das Portal ist derzeit vollständig auf Deutsch geführt."
            />
          </div>
        </AppSection>
      </div>

      <aside className="space-y-5">
        <AppCard>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">Sitzung</p>
          <p className="mt-2 text-[13px] leading-6 text-gray-600">
            Sie sind auf diesem Gerät angemeldet
            {profile?.email || user?.email ? ` als ${profile?.email ?? user?.email}` : ''}.
          </p>
          <div className="mt-4">
            <AppButton variant="secondary" icon={LogOut} onClick={() => void signOut()}>
              Abmelden
            </AppButton>
          </div>
        </AppCard>
        <AppCard>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">Konto schließen</p>
          <p className="mt-2 text-[13px] leading-6 text-gray-600">
            Eine Löschung Ihres Zugangs führen wir als geprüften Prozess durch — unter anderem,
            weil Rechnungen gesetzlichen Aufbewahrungsfristen unterliegen. Schreiben Sie uns
            dazu über den Support.
          </p>
          <div className="mt-4">
            <AppButton variant="secondary" to="/app/support">
              Support kontaktieren
            </AppButton>
          </div>
        </AppCard>
      </aside>
    </div>
  );
}

type SaveStateView = ReturnType<typeof useCustomerPortalPersistence>['saveStates']['onboarding'];

function getSaveFeedback(saveState: SaveStateView, dirty: boolean, canSubmitBase: boolean): {
  message: string;
  actionLabel: string;
  canSubmit: boolean;
  tone: LifecycleTone;
  badgeLabel: string;
  badgeTone: LifecycleTone;
} {
  if (!canSubmitBase) {
    return {
      message: 'Nur Organisations-Owner und Admins koennen diese Daten speichern.',
      actionLabel: 'Speichern',
      canSubmit: false,
      tone: 'neutral',
      badgeLabel: 'nur lesen',
      badgeTone: 'neutral',
    };
  }

  if (saveState.status === 'saving') {
    return {
      message: 'Speichern laeuft. Der gespeicherte Zustand wird erst nach Supabase-Bestaetigung aktualisiert.',
      actionLabel: 'Speichern',
      canSubmit: false,
      tone: 'working',
      badgeLabel: 'speichert',
      badgeTone: 'working',
    };
  }

  if (saveState.status === 'error' && saveState.error) {
    return {
      message: saveState.error.message,
      actionLabel: 'Erneut speichern',
      canSubmit: true,
      tone: saveState.error.kind === 'authorization' ? 'danger' : 'attention',
      badgeLabel: saveState.error.kind === 'validation' ? 'Validierung' : 'Fehler',
      badgeTone: saveState.error.kind === 'validation' ? 'attention' : 'danger',
    };
  }

  if (dirty) {
    return {
      message: 'Ungespeicherte Aenderungen vorhanden. Sie werden erst nach erfolgreichem Speichern dauerhaft geladen.',
      actionLabel: 'Speichern',
      canSubmit: true,
      tone: 'attention',
      badgeLabel: 'ungespeichert',
      badgeTone: 'attention',
    };
  }

  if (saveState.status === 'saved') {
    return {
      message: saveState.savedAt ? `Gespeichert um ${saveState.savedAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}.` : 'Gespeichert.',
      actionLabel: 'Gespeichert',
      canSubmit: false,
      tone: 'success',
      badgeLabel: 'gespeichert',
      badgeTone: 'success',
    };
  }

  return {
    message: 'Geladene Werte entsprechen dem zuletzt gespeicherten Stand.',
    actionLabel: 'Speichern',
    canSubmit: false,
    tone: 'neutral',
    badgeLabel: 'geladen',
    badgeTone: 'neutral',
  };
}

function useUnsavedChangesWarning(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return undefined;

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [enabled]);
}

function getOnboardingStageIndex(stepId: OnboardingDraft['currentStep']) {
  const index = onboardingStages.findIndex((stage) => stage.id === stepId);
  return index >= 0 ? index : 0;
}

function getOnboardingStepFromIndex(index: number): OnboardingDraft['currentStep'] {
  return (onboardingStages[index]?.id ?? 'company') as OnboardingDraft['currentStep'];
}

function toggleValue<T extends string>(values: T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function addUnique<T extends string>(values: T[], value: T): T[] {
  return values.includes(value) ? values : [...values, value];
}

function getToneDescription(tone: ReceptionistTone) {
  switch (tone) {
    case 'warm':
      return 'Freundlich und nahbar.';
    case 'concise':
      return 'Direkt, ohne lange Erklaerungen.';
    case 'formal':
      return 'Sehr hoeflich und distanziert.';
    case 'professional':
    default:
      return 'Ruhig, klar und verbindlich.';
  }
}

function getPhoneRoleValue(roleId: string, draft: PhoneDraft, assignedAiNumber: string) {
  switch (roleId) {
    case 'public':
      return draft.existingPublicNumber;
    case 'ai':
      return assignedAiNumber;
    case 'transfer':
      return draft.humanTransferNumber;
    case 'urgent':
      return draft.urgentEscalationNumber;
    case 'after_hours':
      return draft.afterHoursNumber;
    case 'sms':
      return draft.smsNotificationNumber;
    default:
      return '';
  }
}

function updatePhoneRole(
  roleId: string,
  value: string,
  updateField: <Key extends keyof PhoneDraft>(key: Key, nextValue: PhoneDraft[Key]) => void
) {
  switch (roleId) {
    case 'public':
      updateField('existingPublicNumber', value);
      break;
    case 'transfer':
      updateField('humanTransferNumber', value);
      break;
    case 'urgent':
      updateField('urgentEscalationNumber', value);
      break;
    case 'after_hours':
      updateField('afterHoursNumber', value);
      break;
    case 'sms':
      updateField('smsNotificationNumber', value);
      break;
  }
}

function getPhoneRoleError(roleId: string, fieldErrors: Record<string, string>) {
  switch (roleId) {
    case 'public':
      return fieldErrors.existingPublicNumber;
    case 'transfer':
      return fieldErrors.humanTransferNumber;
    case 'urgent':
      return fieldErrors.urgentEscalationNumber;
    case 'after_hours':
      return fieldErrors.afterHoursNumber;
    case 'sms':
      return fieldErrors.smsNotificationNumber;
    default:
      return undefined;
  }
}

function formatPhoneTestStatus(status: string | null | undefined) {
  switch (status) {
    case 'queued':
      return 'wartet';
    case 'running':
      return 'laeuft';
    case 'failed':
      return 'fehlgeschlagen';
    case 'passed':
      return 'bestanden';
    case 'not_started':
    default:
      return 'nicht gestartet';
  }
}

function RuleColumn<T extends ReceptionistResponsibility | ReceptionistAllowedAction | ReceptionistProhibitedAction>({
  title,
  items,
  labels,
  selectedItems,
  disabled,
  onToggle,
}: {
  title: string;
  items: T[];
  labels: Record<T, string>;
  selectedItems: T[];
  disabled: boolean;
  onToggle: (item: T) => void;
}) {
  return (
    <div className="rounded-panel border border-hairline bg-white/75 p-6 transition-colors duration-200 hover:border-gray-200">
      <h3 className="text-sm font-semibold text-gray-950">{title}</h3>
      <ul className="mt-4 space-y-3">
        {items.map((item) => {
          const active = selectedItems.includes(item);
          return (
            <li key={item}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onToggle(item)}
                aria-pressed={active}
                className={cn(
                  'flex w-full gap-3 rounded-xl px-2 py-2 text-left text-[13px] leading-relaxed transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                  active ? 'bg-gray-50 text-gray-800' : 'text-gray-500 hover:bg-gray-50'
                )}
              >
                <CheckCircle2 size={15} className={cn('mt-0.5 flex-shrink-0', active ? 'text-emerald-500' : 'text-gray-300')} aria-hidden="true" />
                <span>{labels[item]}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description?: string;
}) {
  // <dt>/<dd> rather than two <p>s: a read-only field IS a term and its value, and a
  // screen reader should read it as one.
  return (
    <div className="rounded-control border border-hairline bg-gray-50/80 px-4 py-3">
      <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500">{label}</dt>
      <dd className="mt-1 break-words text-[13.5px] font-semibold leading-snug text-gray-900">{value}</dd>
      {description ? (
        <dd className="mt-1.5 text-[11.5px] leading-5 text-gray-500">{description}</dd>
      ) : null}
    </div>
  );
}

function SettingsTile({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <AppCard className="shadow-none">
      <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-500">
        <Icon size={16} aria-hidden="true" />
      </div>
      <p className="text-sm font-semibold text-gray-950">{title}</p>
      <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{text}</p>
    </AppCard>
  );
}
