import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Button, EmptyState, ErrorState, LinkButton, ListRow, Panel, RowList, RowListSkeleton,
  StatusBadge, WorkspaceHeader, useToast,
} from '@/components/dashboard';
import { LayoutGrid, Pause, Play } from 'lucide-react';

import { loadAdminClients, setSolutionStatus, type AdminClientRow } from '@/lib/clientPlatform/adminApi';
import { catalogLabel, solutionLabel, solutionTone } from '@/pages/admin/clients/statusTones';

/**
 * Every provisioned solution instance across all portal tenants.
 *
 * Grouped by organization rather than listed flat, because pausing a solution is a
 * decision about a customer, not about a row. Feedback moved from a self-dismissing
 * green banner (which said "Status aktualisiert" even for a failure's sibling case) to
 * the shared toast, so a failure is announced as a failure.
 */
export function AdminSolutionsPage() {
  const [rows, setRows] = useState<AdminClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const toast = useToast();

  const reload = useCallback(async () => {
    setLoading(true);
    try { setRows(await loadAdminClients()); setError(null); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const groups = useMemo(
    () => rows
      .filter((row) => row.solutions.length > 0)
      .map((row) => ({ ...row, solutions: [...row.solutions].sort((a, b) => a.display_name.localeCompare(b.display_name, 'de')) }))
      .sort((a, b) => a.organizationName.localeCompare(b.organizationName, 'de')),
    [rows],
  );

  const total = groups.reduce((sum, group) => sum + group.solutions.length, 0);

  const toggle = async (id: string, next: 'active' | 'paused', name: string) => {
    setBusy(id);
    const { error: err } = await setSolutionStatus(id, next);
    setBusy(null);
    if (err) {
      toast.error(next === 'paused' ? 'Pausieren fehlgeschlagen' : 'Aktivieren fehlgeschlagen', err);
      return;
    }
    toast.success(
      next === 'paused' ? 'Lösung pausiert' : 'Lösung aktiviert',
      next === 'paused' ? `${name} ist für den Kunden nicht mehr sichtbar.` : `${name} ist für den Kunden wieder sichtbar.`,
    );
    void reload();
  };

  return (
    <>
      <WorkspaceHeader
        eyebrow="Kundenportal"
        title="Lösungen"
        subtitle="Alle kundensichtbaren Lösungsinstanzen über alle Organisationen. Pausieren blendet eine Lösung im Kundenportal aus; die Daten bleiben unverändert erhalten."
        meta={undefined}
      />

      {error ? <div className="mb-4"><ErrorState message={error} onRetry={() => void reload()} /></div> : null}

      {loading ? (
        <Panel title="Lösungen" flush><RowListSkeleton rows={4} /></Panel>
      ) : total === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="Noch keine Lösungen provisioniert"
          description="Sobald eine Organisation eine Lösung erhält, erscheint sie hier — mit ihrem Status und den Schlüsseln, unter denen das Kundenportal sie ausliefert."
          action={<LinkButton to="/admin/clients" variant="secondary">Zu den Portalzugängen</LinkButton>}
        />
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <Panel
              key={group.organizationId}
              title={group.organizationName}
              count={group.solutions.length}
              action={<LinkButton to={`/admin/clients/${group.organizationId}`} variant="ghost" size="sm">Organisation</LinkButton>}
              flush
            >
              <RowList>
                {group.solutions.map((solution) => (
                  <ListRow
                    key={solution.id}
                    title={solution.display_name}
                    meta={`${catalogLabel(solution.catalog_key)} · ${solution.implementation_key} · ${solution.instance_key}`}
                    badge={<StatusBadge label={solutionLabel[solution.status] ?? solution.status} tone={solutionTone[solution.status]} />}
                    trailing={
                      solution.status === 'paused' ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={Play}
                          loading={busy === solution.id}
                          onClick={() => void toggle(solution.id, 'active', solution.display_name)}
                        >
                          Aktivieren
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={Pause}
                          loading={busy === solution.id}
                          onClick={() => void toggle(solution.id, 'paused', solution.display_name)}
                        >
                          Pausieren
                        </Button>
                      )
                    }
                  />
                ))}
              </RowList>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}

export default AdminSolutionsPage;
