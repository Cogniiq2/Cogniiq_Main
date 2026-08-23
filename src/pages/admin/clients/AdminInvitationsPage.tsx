import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, XCircle } from 'lucide-react';

import { useToast } from '@/components/dashboard';
import { AdminCard, Pill, invitationTone } from '@/pages/admin/clients/adminUi';
import {
  loadAdminClients,
  resendInvitationViaEdge,
  revokeInvitation,
  type AdminClientRow,
} from '@/lib/clientPlatform/adminApi';
import {
  canRenewInvitation,
  canResendInvitation,
  effectiveInvitationStatus,
  resendOutcomeMessage,
} from '@/lib/clientPlatform/invitationStatus';

export function AdminInvitationsPage() {
  const toast = useToast();
  const [rows, setRows] = useState<AdminClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const reload = useCallback(async () => {
    setLoading(true);
    try { setRows(await loadAdminClients()); setError(null); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const invitations = useMemo(
    () => rows.flatMap((r) => r.invitations.map((i) => ({ ...i, orgName: r.organizationName, effective: effectiveInvitationStatus(i) })))
      .filter((i) => statusFilter === 'all' || i.effective === statusFilter)
      .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [rows, statusFilter],
  );

  // Outcomes are reported through the toast system so a failure is red and stays until dismissed.
  // The previous banner rendered every message — including "E-Mail-Versand fehlgeschlagen" — in
  // success green and auto-hid it after 2.5s, so a failed customer email vanished unread.
  const resend = async (invitationId: string, renewExpired = false) => {
    const { ok, outcome, error: err } = await resendInvitationViaEdge(invitationId, renewExpired);
    if (!ok) {
      toast.error('Einladung nicht gesendet', err ?? 'Unbekannter Fehler.');
      return;
    }
    // 'email_error' returns ok:true — the invitation record is valid, only the mail failed.
    if (outcome === 'email_error') toast.error('E-Mail-Versand fehlgeschlagen', resendOutcomeMessage(outcome, renewExpired));
    else toast.success('Einladung gesendet', outcome ? resendOutcomeMessage(outcome, renewExpired) : undefined);
    void reload();
  };
  const revoke = async (id: string) => {
    const { error: err } = await revokeInvitation(id);
    if (err) { toast.error('Widerrufen fehlgeschlagen', err); return; }
    toast.success('Einladung widerrufen', 'Der Zugang über diesen Link ist nicht mehr möglich.');
    void reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-950">Einladungen</h1>
          <p className="mt-1 text-sm text-gray-500">Status aller Client-Einladungen.</p>
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Nach Status filtern" className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-400">
          <option value="all">Alle</option>
          <option value="pending">Offen</option>
          <option value="accepted">Angenommen</option>
          <option value="revoked">Widerrufen</option>
          <option value="expired">Abgelaufen</option>
        </select>
      </div>
      {loading ? <div className="h-40 animate-pulse rounded-2xl border border-gray-100 bg-white" /> : error ? (
        <AdminCard><p className="text-sm text-red-600">Fehler: {error}</p></AdminCard>
      ) : invitations.length === 0 ? (
        <AdminCard><p className="text-sm text-gray-500">Keine Einladungen für diesen Filter.</p></AdminCard>
      ) : (
        <div className="space-y-2">
          {invitations.map((inv) => (
            <AdminCard key={inv.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">{inv.email} <Pill label={inv.effective} tone={invitationTone[inv.effective]} /></p>
                <p className="text-[12px] text-gray-500">
                  <Link to={`/admin/clients/${inv.organization_id}`} className="hover:underline">{inv.orgName}</Link>
                  {' · '}Rolle: {inv.organization_role}
                </p>
              </div>
              <div className="flex gap-2">
                {canResendInvitation(inv.effective) ? (
                  <button type="button" onClick={() => void resend(inv.id)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-[13px] font-semibold text-gray-700 hover:border-gray-300"><RefreshCw size={14} /> Erneut senden</button>
                ) : null}
                {canRenewInvitation(inv.effective) ? (
                  <button type="button" onClick={() => void resend(inv.id, true)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 text-[13px] font-semibold text-amber-700 hover:bg-amber-100"><RefreshCw size={14} /> Erneuern & senden</button>
                ) : null}
                {canResendInvitation(inv.effective) ? (
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
