import { Bot, Cpu, Workflow } from 'lucide-react';

import { AppCard, AppEmptyState, AppSection, AppStatusBadge } from '@/components/app/CustomerAppPrimitives';
import type { SolutionLandingProps } from '@/lib/solutions/registry';
import { solutionStatusDisplay } from '@/components/app/solutions/solutionStatus';

export default function AutomationSolutionLanding({ solution }: SolutionLandingProps) {
  const status = solutionStatusDisplay(solution.status);

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.045)]">
        <div className="p-6 sm:p-8 lg:p-10">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-gray-700">
              <Cpu size={20} aria-hidden="true" />
            </span>
            <AppStatusBadge label={status.label} tone={status.tone} />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl">{solution.display_name}</h2>
          <p className="mt-3 max-w-xl text-[15px] leading-[1.7] text-gray-500">
            Ihr Automatisierungs-Workspace. Struktur ist vorbereitet; echte Workflows werden angezeigt,
            sobald sie verbunden sind. Es werden keine Aktivitäten simuliert.
          </p>
        </div>
      </div>

      <AppSection eyebrow="Workflows" title="Automatisierte Abläufe">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
          <AppCard>
            <AppEmptyState
              compact
              icon={Workflow}
              title="Noch keine Workflows"
              description="Sobald Automatisierungen eingerichtet sind, erscheinen sie hier mit ihrem Status."
            />
          </AppCard>
          <AppCard>
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Spätere Detailansicht</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {['Auslöser', 'Aktion', 'Status', 'Letzte Ausführung', 'Fehler', 'Verlauf'].map((field) => (
                <div key={field} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="flex items-center gap-2 text-[12px] font-semibold text-gray-700">
                    <Bot size={13} aria-hidden="true" /> {field}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-400">Wartet auf echte Daten</p>
                </div>
              ))}
            </div>
          </AppCard>
        </div>
      </AppSection>
    </div>
  );
}
