import { ArrowUpRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

import { CustomerAppShell } from '@/components/app/CustomerAppShell';
import {
  AppEmptyState,
  AppErrorState,
  AppPageHeader,
  AppSkeleton,
  AppStatusBadge,
} from '@/components/app/CustomerAppPrimitives';
import { solutionStatusDisplay } from '@/components/app/solutions/solutionStatus';
import { useOrganizationSolutions } from '@/hooks/useOrganizationSolutions';
import { resolveImplementation } from '@/lib/solutions/registry';

export function SolutionsIndexPage() {
  return (
    <CustomerAppShell>
      <SolutionsIndexContent />
    </CustomerAppShell>
  );
}

function SolutionsIndexContent() {
  const { solutions, status, error, reload } = useOrganizationSolutions();

  return (
    <>
      <AppPageHeader eyebrow="Portal" title="Meine Lösungen" description="Alle Ihrer Organisation zugewiesenen Cogniiq-Lösungen." />

      {status === 'loading' ? <AppSkeleton label="Lösungen werden geladen" /> : null}
      {status === 'error' ? (
        <AppErrorState message={error ?? 'Fehler beim Laden.'} onRetry={() => void reload()} />
      ) : null}
      {status === 'no-organization' ? (
        <AppEmptyState icon={Sparkles} title="Keine Organisation verbunden" description="Lösungen werden erst nach Provisionierung sichtbar." />
      ) : null}

      {status === 'ready' ? (
        solutions.length === 0 ? (
          <AppEmptyState icon={Sparkles} title="Noch keine Lösung zugewiesen" description="Sobald Cogniiq eine Lösung zuweist, erscheint sie hier." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {solutions.map((solution) => {
              const implementation = resolveImplementation(solution.implementation_key);
              const statusDisplay = solutionStatusDisplay(solution.status);
              const Icon = implementation.icon;
              return (
                <Link
                  key={solution.id}
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
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-gray-950">
                    Öffnen
                    <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                  </span>
                </Link>
              );
            })}
          </div>
        )
      ) : null}
    </>
  );
}
