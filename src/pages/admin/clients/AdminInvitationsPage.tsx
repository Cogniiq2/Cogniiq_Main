import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, RefreshCw, XCircle } from 'lucide-react';

import {
  Button, ConfirmDialog, EmptyState, ErrorState, FilterChips, ListRow, Panel, RowList,
  RowListSkeleton, StatusBadge, Toolbar, WorkspaceHeader, useToast,
} from '@/components/dashboard';
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
  isResendEmailOk,
  resendOutcomeMessage,
} from '@/lib/clientPlatform/invitationStatus';
import { invitationLabel, invitationTone } from '@/pages/admin/clients/statusTones';

/**
 * Portal invitations across every organization.
 *
 * Two things changed beyond the visual system. Feedback was a single green banner for
 * every outcome, including "the address already belongs to a user" and an e-mail
 * provider failure — those now surface as the errors they are, using the outcome the
 * edge function actually returned. And revoking, which cannot be undone from here, asks
 * first instead of firing on one click.
 */
export function AdminInvitationsPage() {
  const [rows, setRows] = useState<AdminClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [busy, setBusy] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<{ id: string; email: string } | null>(null);
  const toast = useToast();

  const reload = useCallback(async () => {
    setLoading(true);
    try { setRows(await loadAdminClients()); setError(null); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const all = useMemo(
    () => rows
      .flatMap((r) => r.invitations.map((i) => ({ ...i, orgName: r.organizationName, effective: effectiveInvitationStatus(i) })))
      .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [rows],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: all.length };
    for (const invitation of all) c[invitation.effective] = (c[invitation.effective] ?? 0) + 1;
    return c;
  }, [all]);

  const invitations = useMemo(
    () => all.filter((i) => statusFilter === 'all' || i.effective === statusFilter),
    [all, statusFilter],
  );

  const resend = async (invitationId: string, email: string, renewExpired = false) => {
    setBusy(invitationId);
    const { ok, outcome, error: err } = await resendInvitationViaEdge(invitationId, renewExpired);
    setBusy(null);
    if (!ok) {
      toast.error('Einladung konnte nicht gesendet werden', err ?? 'Unbekannter Fehler');
      return;
    }
    // `ok` only means the call succeeded. Whether an e-mail actually went out is the
    // outcome's business, and "existing_user" or "email_error" is not a success.
    const message = outcome ? resendOutcomeMessage(outcome, renewExpired) : 'Einladung gesendet.';
    if (outcome && !isResendEmailOk(outcome)) toast.toast({ tone: 'warning', title: email, description: message });
    else toast.success(renewExpired ? 'Einladung erneuert und gesendet' : 'Einladung gesendet', `${email} — ${message}`);
    void reload();
  };

  const revoke = async () => {
    if (!revokeTarget) return;
    const { id, email } = revokeTarget;
    setBusy(id);
    const { error: err } = await revokeInvitation(id);
    setBusy(null);
    setRevokeTarget(null);
    if (err) { toast.error('Widerrufen fehlgeschlagen', err); return; }
    toast.success('Einladung widerrufen', `${email} kann sich mit diesem Link nicht mehr registrieren.`);
    void reload();
  };

  return (
    <>
      <WorkspaceHeader
        eyebrow="Kundenportal"
        title="Einladungen"
        subtitle="Status aller Portal-Einladungen. Ein Widerruf entwertet den Link sofort und kann hier nicht rückgängig gemacht werden."
        toolbar={
          !loading && all.length > 0 ? (
            <Toolbar>
              <FilterChips
                label="Einladungen nach Status filtern"
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: 'all', label: 'Alle', count: counts.all },
                  ...['pending', 'accepted', 'expired', 'revoked']
                    .filter((status) => (counts[status] ?? 0) > 0)
                    .map((status) => ({ value: status, label: invitationLabel[status] ?? status, count: counts[status] })),
                ]}
              />
            </Toolbar>
          ) : undefined
        }
      />

      {error ? <div className="mb-4"><ErrorState message={error} onRetry={() => void reload()} /></div> : null}

      {loading ? (
        <Panel title="Einladungen" flush><RowListSkeleton rows={4} /></Panel>
      ) : all.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="Noch keine Einladungen"
          description="Eine Einladung entsteht, wenn Sie eine Organisation für das Kundenportal freischalten. Der Status hier zeigt, ob der Kunde den Zugang bereits angenommen hat."
        />
      ) : invitations.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="Keine Einladungen in diesem Status"
          description="Wählen Sie einen anderen Status, um weitere Einladungen zu sehen."
          action={<Button variant="secondary" onClick={() => setStatusFilter('all')}>Alle Einladungen zeigen</Button>}
        />
      ) : (
        <Panel title="Einladungen" count={invitations.length} flush>
          <RowList>
            {invitations.map((invitation) => (
              <ListRow
                key={invitation.id}
                title={invitation.email}
                meta={
                  <>
                    <Link
                      to={`/admin/clients/${invitation.organization_id}`}
                      className="underline-offset-2 hover:underline"
                    >
                      {invitation.orgName}
                    </Link>
                    {` · Rolle: ${invitation.organization_role}`}
                  </>
                }
                tone={invitation.effective === 'pending' ? 'attention' : 'neutral'}
                badge={<StatusBadge label={invitationLabel[invitation.effective] ?? invitation.effective} tone={invitationTone[invitation.effective]} />}
                trailing={
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    {canResendInvitation(invitation.effective) ? (
                      <Button size="sm" variant="secondary" icon={RefreshCw} loading={busy === invitation.id}
                        onClick={() => void resend(invitation.id, invitation.email)}>
                        Erneut senden
                      </Button>
                    ) : null}
                    {canRenewInvitation(invitation.effective) ? (
                      <Button size="sm" variant="secondary" icon={RefreshCw} loading={busy === invitation.id}
                        onClick={() => void resend(invitation.id, invitation.email, true)}>
                        Erneuern & senden
                      </Button>
                    ) : null}
                    {canResendInvitation(invitation.effective) ? (
                      <Button size="sm" variant="ghost" icon={XCircle}
                        onClick={() => setRevokeTarget({ id: invitation.id, email: invitation.email })}>
                        Widerrufen
                      </Button>
                    ) : null}
                  </div>
                }
              />
            ))}
          </RowList>
        </Panel>
      )}

      <ConfirmDialog
        open={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onConfirm={revoke}
        tone="danger"
        title="Einladung widerrufen?"
        confirmLabel="Einladung widerrufen"
        message={
          <>
            <p>
              Der Einladungslink für{' '}
              <span className="font-semibold text-[var(--cq-fg)]">{revokeTarget?.email}</span>{' '}
              wird sofort entwertet.
            </p>
            <p className="mt-2">
              Ein bereits registriertes Konto bleibt unberührt. Sie können jederzeit eine neue
              Einladung an dieselbe Adresse senden.
            </p>
          </>
        }
      />
    </>
  );
}

export default AdminInvitationsPage;
