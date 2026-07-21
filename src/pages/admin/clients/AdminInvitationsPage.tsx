import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, XCircle } from 'lucide-react';

import { AdminCard, Pill, invitationTone } from '@/pages/admin/clients/adminUi';
import {
  loadAdminClients,
  resendInvitationViaEdge,
  revokeInvitation,
  type AdminClientRow,
} from '@/lib/clientPlatform/adminApi';

export function AdminInvitationsPage() {
  const [rows, setRows] = useState<AdminClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const reload = useCallback(async () => {
    setLoading(true);
    try { setRows(await loadAdminClients()); setError(null); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const flash = (m: string) => { setNotice(m); setTimeout(() => setNotice(null), 2500); };

  const invitations = useMemo(
    () => rows.flatMap((r) => r.invitations.map((i) => ({ ...i, orgName: r.organizationName })))
      .filter((i) => statusFilter === 'all' || i.status === statusFilter)
      .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [rows, statusFilter],
  );

  const resend = async (email: string) => {
    const { ok, error: err } = await resendInvitationViaEdge(email);
    flash(ok ? 'Einladung erneut gesendet.' : `Fehler: ${err ?? 'unbekannt'}`);
  };
  const revoke = async (id: string) => {
    const { error: err } = await revokeInvitation(id);
    flash(err ? `Fehler: ${err}` : 'Einladung widerrufen.');
    if (!err) void reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-950">Einladungen</h1>
          <p className="mt-1 text-sm text-gray-500">Status aller Client-Einladungen.</p>
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-400">
          <option value="all">Alle</option>
          <option value="pending">pending</option>
          <option value="accepted">accepted</option>
          <option value="revoked">revoked</option>
          <option value="expired">expired</option>
        </select>
      </div>
      {notice ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">{notice}</div> : null}
      {loading ? <div className="h-40 animate-pulse rounded-2xl border border-gray-100 bg-white" /> : error ? (
        <AdminCard><p className="text-sm text-red-600">Fehler: {error}</p></AdminCard>
      ) : invitations.length === 0 ? (
        <AdminCard><p className="text-sm text-gray-500">Keine Einladungen für diesen Filter.</p></AdminCard>
      ) : (
        <div className="space-y-2">
          {invitations.map((inv) => (
            <AdminCard key={inv.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">{inv.email} <Pill label={inv.status} tone={invitationTone[inv.status]} /></p>
                <p className="text-[12px] text-gray-500">
                  <Link to={`/admin/clients/${inv.organization_id}`} className="hover:underline">{inv.orgName}</Link>
                  {' · '}Rolle: {inv.organization_role}
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => void resend(inv.email)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-[13px] font-semibold text-gray-700 hover:border-gray-300"><RefreshCw size={14} /> Erneut senden</button>
                {inv.status === 'pending' ? (
                  <button type="button" onClick={() => void revoke(inv.id)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-[13px] font-semibold text-red-700 hover:bg-red-100"><XCircle size={14} /> Widerrufen</button>
                ) : null}
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
}
