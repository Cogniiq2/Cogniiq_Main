import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

import { CustomerAppShell } from '@/components/app/CustomerAppShell';
import {
  appFocusRing,
  AppButton,
  AppEmptyState,
  AppErrorState,
  AppSkeleton,
  AppStatusBadge,
} from '@/components/app/CustomerAppPrimitives';
import { solutionStatusDisplay } from '@/components/app/solutions/solutionStatus';
import { useOrganizationSolutions } from '@/hooks/useOrganizationSolutions';
import { resolveImplementation } from '@/lib/solutions/registry';
import type { OrganizationSolution } from '@/lib/clientPlatform/types';
import { cn } from '@/lib/utils';

// The customer's solution catalogue.
//
// One card per solution actually assigned to the active organization. Status is always
// the humanised German label from `solutionStatusDisplay` — never the stored token — and
// the card's action is ENTITLEMENT-AWARE: a disabled solution offers no way in, and a
// solution whose module is not built yet says so instead of linking to a dead surface.
//
// There are no usage metrics here: `organization_solutions` carries status and config
// only, so any call volume or "minutes used" figure would be invented.

export function SolutionsIndexPage() {
  return (
    <CustomerAppShell>
      <SolutionsIndexContent />
    </CustomerAppShell>
  );
}

function SolutionsIndexContent() {
  const { solutions, status, error, reload } = useOrganizationSolutions();

  const ordered = [...solutions].sort((a, b) => a.nav_order - b.nav_order);

  return (
    <>
      <header className="mb-8 border-b border-hairline pb-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Portal</p>
        <h1 className="mt-2.5 text-[28px] font-semibold leading-[1.12] tracking-[-0.02em] text-gray-950 sm:text-[34px]">
          Ihre Lösungen
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-[1.65] text-gray-600">
          Alle Cogniiq-Lösungen, die für Ihre Organisation freigeschaltet sind — mit ihrem
          aktuellen Betriebszustand.
        </p>
      </header>

      {status === 'loading' ? (
        <div className="grid gap-4 md:grid-cols-2">
          <AppSkeleton label="Lösungen werden geladen" />
          <AppSkeleton label="Lösungen werden geladen" />
        </div>
      ) : null}

      {status === 'error' ? (
        <AppErrorState message={error ?? 'Die Lösungen konnten nicht geladen werden.'} onRetry={() => void reload()} />
      ) : null}

      {status === 'no-organization' ? (
        <AppEmptyState
          icon={Sparkles}
          title="Keine Organisation verbunden"
          description="Lösungen werden erst sichtbar, sobald Ihr Zugang provisioniert ist."
        />
      ) : null}

      {status === 'ready' ? (
        ordered.length === 0 ? (
          <AppEmptyState
            icon={Sparkles}
            title="Noch keine Lösung zugewiesen"
            description="Sobald Cogniiq eine Lösung für Ihre Organisation freischaltet, erscheint sie hier mit Zustand und Zugang."
            action={<AppButton to="/app/support" variant="secondary">Cogniiq kontaktieren</AppButton>}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {ordered.map((solution) => (
              <SolutionCard key={solution.id} solution={solution} />
            ))}
          </div>
        )
      ) : null}
    </>
  );
}

/**
 * What each lifecycle state MEANS for the customer, in plain German.
 *
 * The label alone ("Wird eingerichtet") tells a customer the token; this tells them the
 * consequence. Keyed by the stored value but never printing it.
 */
const lifecycleExplanation: Record<OrganizationSolution['status'], string> = {
  provisioning: 'Cogniiq richtet diese Lösung gerade ein. Einzelne Bereiche können noch fehlen.',
  active: 'Diese Lösung ist im Betrieb und für Sie freigeschaltet.',
  paused: 'Der Betrieb ist vorübergehend ausgesetzt. Ihre Daten und Einstellungen bleiben erhalten.',
  disabled: 'Diese Lösung ist derzeit nicht freigeschaltet.',
};

function SolutionCard({ solution }: { solution: OrganizationSolution }) {
  const implementation = resolveImplementation(solution.implementation_key);
  const statusDisplay = solutionStatusDisplay(solution.status);
  const Icon = implementation.icon;

  // Entitlement-aware: `disabled` is a real gate — SolutionPage refuses it too, so the
  // card must not offer an entry the route will reject.
  const reachable = solution.status !== 'disabled';
  const moduleReady = implementation.available;

  return (
    <article
      className={cn(
        'flex flex-col rounded-panel border border-hairline bg-white p-6 shadow-card',
        reachable && 'transition-[border-color,box-shadow] duration-base ease-premium hover:border-gray-200 hover:shadow-card-hover',
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <span
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-control border border-hairline',
            reachable ? 'bg-gray-50 text-gray-600' : 'bg-gray-50 text-gray-300',
          )}
        >
          <Icon size={19} aria-hidden="true" />
        </span>
        <AppStatusBadge label={statusDisplay.label} tone={statusDisplay.tone} />
      </div>

      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">{implementation.label}</p>
      <h2 className="mt-1 break-words text-[17px] font-semibold leading-snug tracking-[-0.015em] text-gray-950">
        {solution.display_name}
      </h2>
      <p className="mt-2.5 flex-1 text-[13px] leading-[1.6] text-gray-600">
        {lifecycleExplanation[solution.status]}
      </p>

      <div className="mt-5">
        {!reachable ? (
          <p className="text-[12.5px] text-gray-400">
            Sprechen Sie uns an, wenn Sie diese Lösung wieder nutzen möchten.
          </p>
        ) : !moduleReady ? (
          <p className="text-[12.5px] text-gray-400">
            Die Oberfläche zu dieser Lösung ist noch nicht verfügbar. Ihr Zugang ist davon nicht betroffen.
          </p>
        ) : (
          <Link
            to={`/app/solutions/${solution.instance_key}`}
            className={cn(
              'inline-flex min-h-11 items-center gap-2 rounded-control bg-gray-950 px-5 text-[13.5px] font-semibold text-white',
              'transition-[background-color,transform] duration-fast ease-premium hover:bg-gray-800',
              'active:scale-[0.985] motion-reduce:active:scale-100',
              appFocusRing,
            )}
          >
            Öffnen
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        )}
      </div>
    </article>
  );
}

export default SolutionsIndexPage;
