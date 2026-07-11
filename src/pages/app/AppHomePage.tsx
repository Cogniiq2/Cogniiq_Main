import {
  Activity,
  Building2,
  CheckCircle2,
  Clock3,
  Headphones,
  Mic2,
  Phone,
  ShieldCheck,
  Sparkles,
  UserPlus,
  UserRound,
  Wand2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { CustomerAppShell } from '@/components/app/CustomerAppShell';
import {
  AppButton,
  AppCard,
  AppEmptyState,
  AppErrorState,
  AppPageHeader,
  AppPreviewNotice,
  AppProgress,
  AppSection,
  AppSkeleton,
  AppStatusBadge,
} from '@/components/app/CustomerAppPrimitives';
import { setupJourney } from '@/components/app/customerPortalModel';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomerPortalPersistence } from '@/hooks/useCustomerPortalPersistence';
import { useOrganizations } from '@/hooks/useOrganizations';

export function AppHomePage() {
  return (
    <CustomerAppShell>
      <AppHomeContent />
    </CustomerAppShell>
  );
}

function AppHomeContent() {
  const { profile, user } = useAuth();
  const { memberships, activeOrganization } = useOrganizations();
  const { snapshot, loadStatus, loadError, retry } = useCustomerPortalPersistence();
  const accountLabel = profile?.full_name || profile?.email || user?.email || 'Konto aktiv';
  const organizationLabel = activeOrganization?.name ?? 'Noch nicht provisioniert';
  const business = snapshot.business;
  const onboarding = snapshot.onboardingSession;
  const completedSetupIds = getCompletedSetupIds(snapshot);
  const currentSetupId = getCurrentSetupId(snapshot);
  const setupProgress = Math.round((completedSetupIds.size / setupJourney.length) * 100);
  const nextAction = getNextAction(snapshot);

  return (
    <>
      <AppPageHeader
        eyebrow="Kundenbereich"
        title="Ihr KI-Rezeptionist entsteht hier Schritt fuer Schritt."
        description="Der Bereich zeigt jetzt gespeicherte Produktdaten fuer Unternehmen, Onboarding, Rezeptionist und Telefon. Nicht verbundene Systeme bleiben bewusst leer."
        action={<AppButton to={nextAction.href} icon={nextAction.icon}>{nextAction.label}</AppButton>}
        meta={
          <div className="flex flex-wrap gap-2">
            <AppStatusBadge label={getOverviewStatusLabel(loadStatus, Boolean(business))} tone={getOverviewStatusTone(loadStatus, Boolean(business))} />
            <AppStatusBadge label={memberships.length ? 'Organisation verbunden' : 'Workspace offen'} tone={memberships.length ? 'success' : 'neutral'} />
          </div>
        }
      />

      {loadStatus === 'loading' ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <AppSkeleton label="Produktdaten werden geladen" />
          <AppSkeleton label="Workspace wird geladen" />
        </div>
      ) : null}

      {loadStatus === 'error' && loadError ? (
        <AppErrorState message={loadError.message} onRetry={() => void retry()} />
      ) : null}

      {loadStatus === 'no-organization' ? (
        <AppEmptyState
          icon={Building2}
          title="Keine Organisation verbunden"
          description="Ihr Login ist aktiv, aber diesem Konto ist noch keine Organisation zugeordnet. Produktdaten werden erst nach einer kontrollierten Provisionierung sichtbar."
        />
      ) : null}

      {loadStatus === 'ready' ? (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-8">
          <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.045)]">
            <div className="bg-white p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400">Naechster sinnvoller Schritt</p>
                  <h2 className="text-2xl font-semibold leading-tight tracking-tight text-gray-950 sm:text-3xl">{nextAction.title}</h2>
                  <p className="mt-3 max-w-xl text-[15px] leading-[1.7] text-gray-500">
                    {nextAction.description}
                  </p>
                </div>
                <AppButton to={nextAction.href} variant="secondary" icon={nextAction.icon}>
                  {nextAction.label}
                </AppButton>
              </div>
            </div>
            <div className="border-t border-gray-100 bg-gray-50/70 px-5 py-6 sm:px-8 lg:px-10">
              <div className="mb-6">
                <AppProgress value={setupProgress} label="Persistenter Setup-Fortschritt" />
              </div>
              <JourneyRail completedIds={completedSetupIds} currentId={currentSetupId} />
            </div>
          </div>

          <AppSection
            eyebrow="Status"
            title="Was aktuell wirklich vorhanden ist"
            description="Keine Beispielwerte, keine simulierten Anrufe und keine erfundenen Produktdaten."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <StatusTile icon={UserRound} label="Account" value={accountLabel} detail="Echte Authentifizierung aktiv." tone="success" />
              <StatusTile
                icon={Building2}
                label="Workspace"
                value={organizationLabel}
                detail={memberships.length ? 'Organisationsmitgliedschaft gefunden.' : 'Noch keine Organisationsmitgliedschaft provisioniert.'}
                tone={memberships.length ? 'success' : 'neutral'}
              />
              <StatusTile
                icon={Sparkles}
                label="Unternehmen"
                value={business?.name ?? 'Noch nicht gespeichert'}
                detail={business ? 'Gespeicherte Unternehmensdaten gefunden.' : 'Wird erst nach gueltigem Onboarding-Save angelegt.'}
                tone={business ? 'success' : 'neutral'}
              />
              <StatusTile
                icon={Headphones}
                label="Rezeptionist"
                value={snapshot.receptionistConfig ? 'Konfiguration gespeichert' : 'Noch nicht gespeichert'}
                detail={snapshot.receptionistConfig ? 'Identitaet und Verhalten laden aus Supabase.' : 'Kein Vapi- oder Prompt-Backend ist verbunden.'}
                tone={snapshot.receptionistConfig ? 'success' : 'neutral'}
              />
              <StatusTile
                icon={Phone}
                label="Telefon"
                value={snapshot.phoneConfig ? 'Konfiguration gespeichert' : 'Noch nicht gespeichert'}
                detail={snapshot.phoneConfig ? 'Kundenwerte werden geladen; Systemnummer bleibt leer bis Provisionierung existiert.' : 'Keine Nummer wird gekauft oder aktiviert.'}
                tone={snapshot.phoneConfig ? 'success' : 'neutral'}
              />
              <StatusTile
                icon={Clock3}
                label="Onboarding"
                value={formatOnboardingStatus(onboarding?.status)}
                detail={onboarding?.currentStep ? `Aktueller Schritt: ${onboarding.currentStep}` : 'Noch keine Onboarding-Session gespeichert.'}
                tone={onboarding ? 'success' : 'neutral'}
              />
            </div>
            <div className="mt-4">
              <AppPreviewNotice>
                Diese Uebersicht nutzt gespeicherte Supabase-Daten. Nutzung, Live-Status, Research, Calls, Leads und Abrechnung werden nicht simuliert.
              </AppPreviewNotice>
            </div>
          </AppSection>

          <AppSection
            eyebrow="Spaetere Live-Ansicht"
            title="Betriebsstruktur vorbereitet"
            description="Diese Flaechen sind bewusst leer, bis echte Systeme Daten liefern."
          >
            <div className="grid gap-3 lg:grid-cols-3">
              <FutureTile icon={Activity} title="Readiness" text="Noch keine Live-Bereitschaft berechnet." />
              <FutureTile icon={Mic2} title="Letzte Anrufe" text="Noch keine echten Anrufe vorhanden." />
              <FutureTile icon={UserPlus} title="Neue Leads" text="Noch keine echten Leads vorhanden." />
            </div>
          </AppSection>
        </div>

        <aside className="space-y-6">
          <AppCard>
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Profil</p>
            <dl className="space-y-4 text-sm">
              <ProfileRow label="Name" value={profile?.full_name || 'Nicht gesetzt'} />
              <ProfileRow label="E-Mail" value={profile?.email ?? user?.email ?? 'Nicht verfuegbar'} />
              <ProfileRow label="Rolle" value={profile?.platform_role ?? 'Wird geladen'} />
            </dl>
          </AppCard>

          <AppCard>
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Organisationen</p>
            {memberships.length ? (
              <div className="space-y-3">
                {memberships.map((membership) => (
                  <div key={membership.id} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <p className="text-sm font-semibold text-gray-900">{membership.organization?.name ?? 'Unbenannte Organisation'}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {membership.role} / {membership.status}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <AppEmptyState
                compact
                icon={Building2}
                title="Keine Organisation"
                description="Eine Anmeldung allein erstellt noch keinen KI-Rezeptionisten-Workspace."
              />
            )}
          </AppCard>

          <AppCard>
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Produktzustand</p>
            <div className="space-y-3">
              <MiniStatus icon={Clock3} label="Setup" value={business ? 'Gestartet' : 'Offen'} />
              <MiniStatus icon={ShieldCheck} label="Freigabe" value="Nicht verfuegbar" />
              <MiniStatus icon={CheckCircle2} label="Go-live" value="Nicht implementiert" />
            </div>
          </AppCard>
        </aside>
      </div>
      ) : null}
    </>
  );
}

function StatusTile({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  tone: 'neutral' | 'success';
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white/70 p-5 transition-colors duration-200 hover:border-gray-200">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-500">
          <Icon size={17} aria-hidden="true" />
        </div>
        <AppStatusBadge label={tone === 'success' ? 'echt' : 'offen'} tone={tone} />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-950">{value}</p>
      <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{detail}</p>
    </div>
  );
}

function FutureTile({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white/70 p-5 transition-colors duration-200 hover:border-gray-200">
      <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-500">
        <Icon size={16} aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-gray-950">{title}</h3>
      <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{text}</p>
    </div>
  );
}

function JourneyRail({ completedIds, currentId }: { completedIds: Set<string>; currentId: string }) {
  return (
    <ol className="relative grid gap-4 lg:grid-cols-6">
      <div className="absolute left-6 right-6 top-5 hidden h-px bg-gray-200 lg:block" aria-hidden="true" />
      {setupJourney.map((step, index) => {
        const completed = completedIds.has(step.id);
        const current = step.id === currentId;

        return (
          <li key={step.id} className="relative">
            <div className="flex gap-3 lg:block">
              <span className={`relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border text-xs font-bold shadow-sm ${
                completed
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : current
                    ? 'border-gray-400 bg-white text-gray-900'
                    : 'border-gray-200 bg-white text-gray-600'
              }`}>
                {completed ? <CheckCircle2 size={15} aria-label="Gespeichert" /> : index + 1}
              </span>
              <div className="lg:mt-4">
                <p className="text-sm font-semibold leading-snug text-gray-950">{step.title}</p>
                <p className="mt-1 text-[12.5px] leading-5 text-gray-500">{completed ? 'Gespeicherte Daten vorhanden.' : step.description}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function getCompletedSetupIds(snapshot: ReturnType<typeof useCustomerPortalPersistence>['snapshot']) {
  const completed = new Set<string>();
  if (snapshot.business) completed.add('company');
  if (snapshot.receptionistConfig) completed.add('receptionist');
  if (snapshot.phoneConfig) completed.add('phone');
  return completed;
}

function getCurrentSetupId(snapshot: ReturnType<typeof useCustomerPortalPersistence>['snapshot']) {
  if (!snapshot.business) return 'company';
  if (!snapshot.receptionistConfig) return 'receptionist';
  if (!snapshot.phoneConfig) return 'phone';
  return 'facts';
}

function getNextAction(snapshot: ReturnType<typeof useCustomerPortalPersistence>['snapshot']): {
  title: string;
  description: string;
  label: string;
  href: string;
  icon: LucideIcon;
} {
  if (!snapshot.business) {
    return {
      title: 'Unternehmensdaten speichern',
      description: 'Starten Sie mit den Basisdaten. Erst nach einem gueltigen Speichern wird ein Business-Datensatz angelegt.',
      label: 'Einrichtung beginnen',
      href: '/app/onboarding',
      icon: Wand2,
    };
  }

  if (!snapshot.receptionistConfig) {
    return {
      title: 'Rezeptionist konfigurieren',
      description: 'Unternehmensdaten sind gespeichert. Als naechstes koennen Name, Sprache, Tonalitaet und Regeln dauerhaft gesichert werden.',
      label: 'Rezeptionist oeffnen',
      href: '/app/receptionist',
      icon: Headphones,
    };
  }

  if (!snapshot.phoneConfig) {
    return {
      title: 'Telefonkonfiguration speichern',
      description: 'Die Rezeptionistenkonfiguration ist vorhanden. Jetzt koennen die kundenkontrollierten Telefonnummern gespeichert werden.',
      label: 'Telefon oeffnen',
      href: '/app/phone',
      icon: Phone,
    };
  }

  return {
    title: 'Persistente Basiskonfiguration vorhanden',
    description: 'Business, Rezeptionist und Telefon sind gespeichert. Research, Wissen, Tests, Calls, Leads und Billing bleiben bis zu spaeteren Phasen leer.',
    label: 'Onboarding ansehen',
    href: '/app/onboarding',
    icon: ShieldCheck,
  };
}

function getOverviewStatusLabel(loadStatus: ReturnType<typeof useCustomerPortalPersistence>['loadStatus'], hasBusiness: boolean) {
  if (loadStatus === 'loading') return 'Daten werden geladen';
  if (loadStatus === 'error') return 'Datenfehler';
  if (loadStatus === 'no-organization') return 'Keine Organisation';
  return hasBusiness ? 'Setup gestartet' : 'Einrichtung noch nicht begonnen';
}

function getOverviewStatusTone(
  loadStatus: ReturnType<typeof useCustomerPortalPersistence>['loadStatus'],
  hasBusiness: boolean
): 'neutral' | 'working' | 'danger' | 'success' {
  if (loadStatus === 'loading') return 'working';
  if (loadStatus === 'error') return 'danger';
  if (loadStatus === 'no-organization') return 'neutral';
  return hasBusiness ? 'success' : 'neutral';
}

function formatOnboardingStatus(status: string | null | undefined) {
  switch (status) {
    case 'in_progress':
      return 'In Bearbeitung';
    case 'not_started':
      return 'Noch nicht begonnen';
    case 'research_queued':
      return 'Research wartet';
    case 'research_running':
      return 'Research laeuft';
    case 'review_required':
      return 'Pruefung erforderlich';
    case 'ready_for_test':
      return 'Bereit fuer Test';
    case 'ready_for_launch':
      return 'Bereit fuer Launch';
    case 'live':
      return 'Live';
    case 'paused':
      return 'Pausiert';
    case 'error':
      return 'Fehler';
    default:
      return 'Noch nicht gespeichert';
  }
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-gray-400">{label}</dt>
      <dd className="mt-1 break-words font-medium text-gray-900">{value}</dd>
    </div>
  );
}

function MiniStatus({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400">
        <Icon size={14} aria-hidden="true" />
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">{label}</p>
        <p className="text-sm font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
