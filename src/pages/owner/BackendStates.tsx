import { Database, RefreshCw, TerminalSquare } from 'lucide-react';

import { Button, Card, PageHeader } from '@/components/dashboard';
import { OWNER_FINANCE_MIGRATION } from '@/lib/ownerFinance/api';
import { useOwnerEntity } from '@/pages/owner/ownerContext';

// Polished, top-level environment-readiness screen. Shown when the finance schema/RPCs are not
// installed in the target environment (e.g. a preview pointing at a Supabase project without the
// migration). No raw PostgREST cascade, no SQL leaked to ordinary UI — a single owner-only technical
// diagnostic carries the missing migration name and raw detail.
export function BackendSetupScreen() {
  const { backendDetail, reload } = useOwnerEntity();
  return (
    <>
      <PageHeader
        title="Finance-Backend nicht installiert"
        description="Das Finanz- & Steuermodul ist in dieser Umgebung noch nicht eingerichtet. Solange das Backend fehlt, können keine Finanzdaten erfasst werden."
        actions={<Button variant="secondary" icon={RefreshCw} onClick={() => void reload()}>Erneut prüfen</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-gray-500">
            <Database size={22} aria-hidden="true" />
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-gray-950">Backend-Einrichtung erforderlich</h2>
          <p className="mt-2 max-w-xl text-[13.5px] leading-6 text-gray-600">
            Diese Umgebung ist mit einem Supabase-Projekt verbunden, in dem die additive Owner-Finance-Migration
            noch nicht angewendet wurde. Das Cockpit bleibt sicher: Schreibaktionen sind deaktiviert und es werden
            keine Beispiel- oder Platzhalterwerte angezeigt.
          </p>
          <ul className="mt-5 space-y-2.5">
            {[
              'Finanz-Schreibaktionen sind deaktiviert, bis das Backend installiert ist.',
              'Es werden keine erfundenen Werte dargestellt.',
              'Die owner-only Sicherheit, RLS und Audit-Logik bleiben unverändert bestehen.',
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-[13px] text-gray-600">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300" aria-hidden="true" />
                {line}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="bg-gray-950 text-gray-100 shadow-[0_18px_60px_rgba(15,23,42,0.18)]">
          <div className="mb-3 flex items-center gap-2 text-gray-300">
            <TerminalSquare size={16} aria-hidden="true" />
            <p className="text-[11px] font-bold uppercase tracking-[0.16em]">Technische Diagnose · nur Inhaber</p>
          </div>
          <p className="text-[12.5px] leading-6 text-gray-400">Fehlende Migration:</p>
          <code className="mt-1.5 block break-all rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-[12px] text-emerald-300">
            {OWNER_FINANCE_MIGRATION}
          </code>
          {backendDetail ? (
            <>
              <p className="mt-4 text-[12.5px] leading-6 text-gray-400">Rohmeldung der Datenbank:</p>
              <code className="mt-1.5 block max-h-32 overflow-auto break-all rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-[11.5px] leading-5 text-gray-300">
                {backendDetail}
              </code>
            </>
          ) : null}
          <p className="mt-4 text-[11.5px] leading-5 text-gray-500">
            Die Migration nach allen bestehenden Migrationen anwenden. Diese Ansicht führt keine Produktions­migration
            und kein Deployment aus.
          </p>
        </Card>
      </div>
    </>
  );
}

export function BackendErrorScreen() {
  const { backendDetail, error, reload } = useOwnerEntity();
  return (
    <>
      <PageHeader
        title="Cockpit konnte nicht geladen werden"
        description="Beim Verbinden mit dem Finanz-Backend ist ein Fehler aufgetreten."
        actions={<Button variant="secondary" icon={RefreshCw} onClick={() => void reload()}>Erneut versuchen</Button>}
      />
      <Card className="border-red-100 bg-red-50/60">
        <p className="text-sm font-semibold text-red-700">Verbindungsfehler</p>
        <p className="mt-1 break-words text-[13px] leading-6 text-red-600">{error ?? backendDetail ?? 'Unbekannter Fehler.'}</p>
      </Card>
    </>
  );
}
