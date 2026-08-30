import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, Pause, Play } from 'lucide-react';

import {
  Button, DataTable, EmptyState, ErrorState, PageHeader, StatusBadge, TableSkeleton, useToast,
} from '@/components/dashboard';
import { solutionTone } from '@/pages/admin/clients/statusTones';
import { loadAdminClients, setSolutionStatus, type AdminClientRow } from '@/lib/clientPlatform/adminApi';

type SolutionRow = AdminClientRow['solutions'][number] & { orgName: string };

export function AdminSolutionsPage() {
  const [rows, setRows] = useState<AdminClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { toast } = useToast();

  const reload = useCallback(async () => {
    setLoading(true);
    try { setRows(await loadAdminClients()); setError(null); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const flat: SolutionRow[] = useMemo(
    () => rows.flatMap((r) => r.solutions.map((s) => ({ ...s, orgName: r.organizationName }))),
    [rows],
  );

  const toggle = async (id: string, next: 'active' | 'paused') => {
    setBusyId(id);
    const { error: err } = await setSolutionStatus(id, next);
    setBusyId(null);
    if (err) {
      toast({ tone: 'error', title: 'Status nicht geändert', description: err });
      return;
    }
    toast({ tone: 'success', title: next === 'active' ? 'Lösung aktiviert' : 'Lösung pausiert' });
    void reload();
  };

  return (
    <div>
      <PageHeader
        title="Lösungen"
        description="Alle kundensichtbaren Lösungsinstanzen über alle Organisationen."
      />

      {loading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void reload()} />
      ) : flat.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="Noch keine Lösungen provisioniert"
          description="Sobald ein Kunde eine Lösung erhält, erscheint die Instanz hier."
        />
      ) : (
        <DataTable
          rows={flat}
          getRowKey={(s) => s.id}
          minWidth={820}
          mobileTitle={(s) => (
            <span className="flex items-center gap-2">
              {s.display_name} <StatusBadge label={s.status} tone={solutionTone[s.status]} />
            </span>
          )}
          mobileSubtitle={(s) => s.orgName}
          columns={[
            {
              key: 'organization',
              header: 'Organisation',
              hideOnMobile: true,
              render: (s) => (
                <Link to={`/admin/clients/${s.organization_id}`} className="font-medium hover:underline">
                  {s.orgName}
                </Link>
              ),
            },
            {
              key: 'solution',
              header: 'Lösung',
              render: (s) => (
                <>
                  <span className="font-medium">{s.display_name}</span>
                  <span className="block text-[12px] text-[var(--cq-fg-subtle)]">
                    {s.catalog_key} · {s.implementation_key}
                  </span>
                </>
              ),
            },
            {
              key: 'instance',
              header: 'Instanz',
              render: (s) => <span className="font-mono text-[12px]">{s.instance_key}</span>,
            },
            {
              key: 'status',
              header: 'Status',
              render: (s) => <StatusBadge label={s.status} tone={solutionTone[s.status]} />,
            },
            {
              key: 'action',
              header: 'Aktion',
              align: 'right',
              render: (s) => (s.status === 'paused' ? (
                <Button
                  size="sm"
                  variant="secondary"
                  icon={Play}
                  loading={busyId === s.id}
                  onClick={() => void toggle(s.id, 'active')}
                >
                  Aktivieren
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  icon={Pause}
                  loading={busyId === s.id}
                  onClick={() => void toggle(s.id, 'paused')}
                >
                  Pausieren
                </Button>
              )),
            },
          ]}
        />
      )}
    </div>
  );
}
