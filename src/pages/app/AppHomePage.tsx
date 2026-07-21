import { ArrowUpRight, Building2, CreditCard, LayoutGrid, LifeBuoy, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

import { CustomerAppShell } from '@/components/app/CustomerAppShell';
import {
  AppButton,
  AppCard,
  AppEmptyState,
  AppErrorState,
  AppPageHeader,
  AppSection,
  AppSkeleton,
  AppStatusBadge,
} from '@/components/app/CustomerAppPrimitives';
import { solutionStatusDisplay } from '@/components/app/solutions/solutionStatus';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizationSolutions } from '@/hooks/useOrganizationSolutions';
import { useOrganizations } from '@/hooks/useOrganizations';
import { resolveImplementation } from '@/lib/solutions/registry';
import type { OrganizationSolution } from '@/lib/clientPlatform/types';

export function AppHomePage() {
  return (
    <CustomerAppShell>
      <AppHomeContent />
    </CustomerAppShell>
  );
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return 'Guten Morgen';
  if (hour < 18) return 'Guten Tag';
  return 'Guten Abend';
}

function AppHomeContent() {
  const { profile, user } = useAuth();
  const { activeOrganization } = useOrganizations();
  const { solutions, portalSettings, status, error, reload } = useOrganizationSolutions();
  const name = profile?.full_name || profile?.email || user?.email || '';
  const supportContact = portalSettings?.support_contact ?? null;

  return (
    <>
      <AppPageHeader
        eyebrow="Kundenbereich"
        title={`${greeting()}${name ? `, ${name}` : ''}.`}
        description={
          activeOrganization
            ? `Ihr Cogniiq-Portal für ${activeOrganization.name}. Hier finden Sie Ihre aktiven Lösungen und nächsten Schritte.`
            : 'Ihr persönlicher Cogniiq-Bereich.'
        }
        meta={
          <div className="flex flex-wrap gap-2">
            <AppStatusBadge
              label={activeOrganization ? activeOrganization.name : 'Keine Organisation'}
              tone={activeOrganization ? 'success' : 'neutral'}
            />
            {status === 'ready' ? (
              <AppStatusBadge
                label={solutions.length ? `${solutions.length} Lösung(en)` : 'Keine Lösung'}
                tone={solutions.length ? 'success' : 'neutral'}
              />
            ) : null}
          </div>
        }
      />

      {status === 'loading' ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <AppSkeleton label="Lösungen werden geladen" />
          <AppSkeleton label="Portal wird geladen" />
        </div>
      ) : null}

      {status === 'error' ? (
        <AppErrorState message={error ?? 'Die Portaldaten konnten nicht geladen werden.'} onRetry={() => void reload()} />
      ) : null}

      {status === 'no-organization' ? (
        <AppEmptyState
          icon={Building2}
          title="Keine Organisation verbunden"
          description="Ihr Login ist aktiv, aber diesem Konto ist noch keine Organisation zugeordnet. Lösungen werden erst nach einer kontrollierten Provisionierung sichtbar."
        />
      ) : null}

      {status === 'ready' ? (
        <div className="space-y-8">
          {solutions.length === 0 ? (
            <AppEmptyState
              icon={Sparkles}
              title="Noch keine Lösung zugewiesen"
              description="Ihre Organisation ist verbunden. Sobald Cogniiq eine Lösung zuweist, erscheint sie hier mit ihrem Status und den nächsten Schritten."
            />
          ) : solutions.length === 1 ? (
            <FeaturedSolution solution={solutions[0]} />
          ) : (
            <AppSection eyebrow="Lösungen" title="Ihre aktiven Lösungen">
              <div className="grid gap-4 md:grid-cols-2">
                {solutions.map((solution) => (
                  <SolutionGridCard key={solution.id} solution={solution} />
                ))}
              </div>
            </AppSection>
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            <ShortcutCard
              icon={LayoutGrid}
              title="Meine Lösungen"
              text="Alle zugewiesenen Lösungen im Überblick."
              to="/app/solutions"
            />
            <ShortcutCard
              icon={CreditCard}
              title="Abrechnung"
              text="Konto- und Abrechnungsbereich."
              to="/app/billing"
            />
            <ShortcutCard
              icon={LifeBuoy}
              title="Support"
              text={supportContact ? `Kontakt: ${supportContact}` : 'Hilfe und Kontakt.'}
              to="/app/support"
            />
          </div>

          <AppSection eyebrow="Aktivität" title="Letzte Aktivität">
            <AppCard>
              <AppEmptyState
                compact
                icon={LayoutGrid}
                title="Noch keine Aktivität"
                description="Sobald Ihre Lösungen echte Ereignisse liefern, erscheinen sie hier. Es werden keine Aktivitäten simuliert."
              />
            </AppCard>
          </AppSection>
        </div>
      ) : null}
    </>
  );
}

function FeaturedSolution({ solution }: { solution: OrganizationSolution }) {
  const implementation = resolveImplementation(solution.implementation_key);
  const statusDisplay = solutionStatusDisplay(solution.status);
  const Icon = implementation.icon;
  const requiredAction = getRequiredAction(solution);

  return (
    <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.05)]">
      <div className="p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-gray-700">
                <Icon size={22} aria-hidden="true" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">{implementation.label}</p>
                <AppStatusBadge label={statusDisplay.label} tone={statusDisplay.tone} />
              </div>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl">{solution.display_name}</h2>
            <p className="mt-3 max-w-xl text-[15px] leading-[1.7] text-gray-500">{requiredAction.description}</p>
            <div className="mt-6">
              <AppButton to={`/app/solutions/${solution.instance_key}`} icon={ArrowUpRight}>
                {implementation.available ? 'Lösung öffnen' : 'Details ansehen'}
              </AppButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SolutionGridCard({ solution }: { solution: OrganizationSolution }) {
  const implementation = resolveImplementation(solution.implementation_key);
  const statusDisplay = solutionStatusDisplay(solution.status);
  const Icon = implementation.icon;

  return (
    <Link
      to={`/app/solutions/${solution.instance_key}`}
      className="group flex flex-col rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.035)] transition-colors hover:border-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-600">
          <Icon size={18} aria-hidden="true" />
        </span>
        <AppStatusBadge label={statusDisplay.label} tone={statusDisplay.tone} />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">{implementation.label}</p>
      <h3 className="mt-1 text-lg font-semibold text-gray-950">{solution.display_name}</h3>
      <p className="mt-2 text-[13px] leading-relaxed text-gray-500">
        {implementation.available ? 'Öffnen, um diese Lösung zu verwalten.' : 'Oberfläche noch nicht verfügbar.'}
      </p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-gray-950">
        Öffnen
        <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
      </span>
    </Link>
  );
}

function ShortcutCard({ icon: Icon, title, text, to }: { icon: typeof LayoutGrid; title: string; text: string; to: string }) {
  return (
    <Link
      to={to}
      className="group rounded-3xl border border-gray-100 bg-white p-6 shadow-none transition-colors hover:border-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
    >
      <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-500">
        <Icon size={16} aria-hidden="true" />
      </div>
      <p className="text-sm font-semibold text-gray-950">{title}</p>
      <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{text}</p>
    </Link>
  );
}

function getRequiredAction(solution: OrganizationSolution): { description: string } {
  const implementation = resolveImplementation(solution.implementation_key);
  if (!implementation.available) {
    return { description: 'Diese Lösung ist Ihrem Konto zugewiesen. Die passende Oberfläche wird in einer späteren Version freigeschaltet.' };
  }
  switch (solution.status) {
    case 'paused':
      return { description: 'Diese Lösung ist derzeit pausiert. Öffnen Sie sie, um den aktuellen Stand einzusehen.' };
    case 'provisioning':
      return { description: 'Diese Lösung wird gerade eingerichtet. Sie können bereits die vorbereiteten Bereiche ansehen.' };
    default:
      return { description: 'Ihre Lösung ist aktiv. Öffnen Sie sie, um Einrichtung und Konfiguration zu verwalten.' };
  }
}
