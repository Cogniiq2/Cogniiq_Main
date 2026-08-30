import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, RefreshCw, XCircle } from 'lucide-react';

import {
  Button, DataTable, EmptyState, ErrorState, PageHeader, Select, StatusBadge, TableSkeleton, useToast,
} from '@/components/dashboard';
import { invitationTone } from '@/pages/admin/clients/statusTones';
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

// `effective` keeps the narrow status union rather than widening to `string`: the
// canRenew/canResend predicates are typed against it, so a plain string would silently
// disable that checking exactly where an invitation's action set is decided.
type EffectiveStatus = ReturnType<typeof effectiveInvitationStatus>;
type InvitationRow = AdminClientRow['invitations'][number] & { orgName: string; effective: EffectiveStatus };

const STATUS_OPTIONS = [
  { value: 'all', label: 'Alle' },
  { value: 'pending', label: 'pending' },
  { value: 'accepted', label: 'accepted' },
  { value: 'revoked', label: 'revoked' },
  { value: 'expired', label: 'expired' },
];

export function AdminInvitationsPage() {
  const [rows, setRows] = useState<AdminClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const { toast } = useToast();

  const reload = useCallback(async () => {
    setLoading(true);
    try { setRows(await loadAdminClients()); setError(null); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const invitations: InvitationRow[] = useMemo(
    () => rows.flatMap((r) => r.invitations.map((i) => ({ ...i, orgName: r.organizationName, effective: effectiveInvitationStatus(i) })))
      .filter((i) => statusFilter === 'all' || i.effective === statusFilter)
      .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [rows, statusFilter],
  );

  const resend = async (invitationId: string, renewExpired = false) => {
    setBusyId(invitationId);
    const { ok, outcome, error: err } = await resendInvitationViaEdge(invitationId, renewExpired);
    setBusyId(null);
    if (outcome) toast({ tone: ok ? 'success' : 'warning', title: resendOutcomeMessage(outcome, renewExpired) });
    else if (ok) toast({ tone: 'success', title: 'Einladung gesendet.' });
    else toast({ tone: 'error', title: 'Einladung nicht gesendet', description: err ?? 'unbekannt' });
    if (ok) void reload();
  };

  const revoke = async (id: string) => {
    setBusyId(id);
    const { error: err } = await revokeInvitation(id);
    setBusyId(null);
    if (err) {
      toast({ tone: 'error', title: 'Einladung nicht widerrufen', description: err });
      return;
    }
    toast({ tone: 'success', title: 'Einladung widerrufen.' });
    void reload();
  };

  return (
    <div>
      <PageHeader
        title="Einladungen"
        description="Status aller Client-Einladungen."
        actions={(
          <div className="w-full sm:w-56">
            <Select
              id="invitation-status-filter"
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={STATUS_OPTIONS}
            />
          </div>
        )}
      />

      {loading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void reload()} />
      ) : invitations.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="Keine Einladungen für diesen Filter"
          description="Ändern Sie den Statusfilter, um weitere Einladungen zu sehen."
        />
      ) : (
        <DataTable
          rows={invitations}
          getRowKey={(i) => i.id}
          minWidth={860}
          mobileTitle={(i) => (
            <span className="flex items-center gap-2">
              {i.email} <StatusBadge label={i.effective} tone={invitationTone[i.effective]} />
            </span>
          )}
          mobileSubtitle={(i) => i.orgName}
          columns={[
            { key: 'email', header: 'E-Mail', render: (i) => <span className="font-medium">{i.email}</span> },
            {
              key: 'organization',
              header: 'Organisation',
              hideOnMobile: true,
              render: (i) => (
                <Link to={`/admin/clients/${i.organization_id}`} className="hover:underline">{i.orgName}</Link>
              ),
            },
            { key: 'role', header: 'Rolle', render: (i) => i.organization_role },
            {
              key: 'status',
              header: 'Status',
              render: (i) => <StatusBadge label={i.effective} tone={invitationTone[i.effective]} />,
            },
            {
              key: 'actions',
              header: 'Aktionen',
              align: 'right',
              render: (i) => (
                <div className="flex flex-wrap justify-end gap-2">
                  {canResendInvitation(i.effective) ? (
                    <Button size="sm" variant="secondary" icon={RefreshCw} loading={busyId === i.id} onClick={() => void resend(i.id)}>
                      Erneut senden
                    </Button>
                  ) : null}
                  {canRenewInvitation(i.effective) ? (
                    <Button size="sm" variant="secondary" icon={RefreshCw} loading={busyId === i.id} onClick={() => void resend(i.id, true)}>
                      Erneuern &amp; senden
                    </Button>
                  ) : null}
                  {canResendInvitation(i.effective) ? (
                    <Button size="sm" variant="danger" icon={XCircle} loading={busyId === i.id} onClick={() => void revoke(i.id)}>
                      Widerrufen
                    </Button>
                  ) : null}
                </div>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
