import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pause, Play } from 'lucide-react';

import { AdminCard, Pill, solutionTone } from '@/pages/admin/clients/adminUi';
import { loadAdminClients, setSolutionStatus, type AdminClientRow } from '@/lib/clientPlatform/adminApi';

export function AdminSolutionsPage() {
  const [rows, setRows] = useState<AdminClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try { setRows(await loadAdminClients()); setError(null); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const flat = useMemo(
    () => rows.flatMap((r) => r.solutions.map((s) => ({ ...s, orgName: r.organizationName }))),
    [rows],
  );

  const toggle = async (id: string, next: 'active' | 'paused') => {
    const { error: err } = await setSolutionStatus(id, next);
    setNotice(err ? `Fehler: ${err}` : 'Status aktualisiert.');
    setTimeout(() => setNotice(null), 2500);
    if (!err) void reload();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-950">Lösungen</h1>
        <p className="mt-1 text-sm text-gray-500">Alle kundensichtbaren Lösungsinstanzen über alle Organisationen.</p>
      </div>
      {notice ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">{notice}</div> : null}
      {loading ? <div className="h-40 animate-pulse rounded-2xl border border-gray-100 bg-white" /> : error ? (
        <AdminCard><p className="text-sm text-red-600">Fehler: {error}</p></AdminCard>
      ) : flat.length === 0 ? (
        <AdminCard><p className="text-sm text-gray-500">Noch keine Lösungen provisioniert.</p></AdminCard>
      ) : (
        <div className="space-y-2">
          {flat.map((s) => (
            <AdminCard key={s.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  <Link to={`/admin/clients/${s.organization_id}`} className="hover:underline">{s.orgName}</Link>
                  {' · '}{s.display_name} <Pill label={s.status} tone={solutionTone[s.status]} />
                </p>
                <p className="text-[12px] text-gray-500">{s.catalog_key} · {s.implementation_key} · <span className="font-mono">{s.instance_key}</span></p>
              </div>
              <div className="flex gap-2">
                {s.status === 'paused' ? (
                  <button type="button" onClick={() => void toggle(s.id, 'active')} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-[13px] font-semibold text-emerald-700 hover:bg-emerald-100"><Play size={14} /> Aktivieren</button>
                ) : (
                  <button type="button" onClick={() => void toggle(s.id, 'paused')} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 text-[13px] font-semibold text-amber-700 hover:bg-amber-100"><Pause size={14} /> Pausieren</button>
                )}
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
}
