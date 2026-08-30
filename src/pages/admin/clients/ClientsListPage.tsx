import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Plus } from 'lucide-react';

import {
  Button, Card, DataTable, EmptyState, ErrorState, Field, PageHeader, Select, StatusBadge, TableSkeleton,
} from '@/components/dashboard';
import { invitationTone, lifecycleTone, solutionTone } from '@/pages/admin/clients/statusTones';
import { loadAdminClients, type AdminClientRow } from '@/lib/clientPlatform/adminApi';
import { formatCents } from '@/lib/clientPlatform/validation';
import { clientLifecycleStatuses, solutionCatalogKeys } from '@/lib/clientPlatform/types';

type SortKey = 'name' | 'updated' | 'monthly';

const SORT_OPTIONS = [
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'updated', label: 'Zuletzt aktualisiert' },
  { value: 'monthly', label: 'Monatswert' },
];

export function ClientsListPage() {
  const [rows, setRows] = useState<AdminClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [solutionFilter, setSolutionFilter] = useState('all');
  const [sort, setSort] = useState<SortKey>('name');
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadAdminClients()
      .then((data) => { if (active) { setRows(data); setError(null); } })
      .catch((e: unknown) => { if (active) setError(e instanceof Error ? e.message : String(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    let result = rows;
    if (statusFilter !== 'all') result = result.filter((r) => r.account?.lifecycle_status === statusFilter);
    if (solutionFilter !== 'all') result = result.filter((r) => r.solutions.some((s) => s.catalog_key === solutionFilter));
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((r) =>
        r.organizationName.toLowerCase().includes(q) ||
        (r.account?.primary_email ?? '').toLowerCase().includes(q) ||
        (r.account?.primary_contact_name ?? '').toLowerCase().includes(q) ||
        (r.account?.industry ?? '').toLowerCase().includes(q));
    }
    const sorted = [...result];
    sorted.sort((a, b) => {
      if (sort === 'monthly') return (b.account?.estimated_monthly_value_cents ?? 0) - (a.account?.estimated_monthly_value_cents ?? 0);
      if (sort === 'updated') return (b.account?.updated_at ?? '').localeCompare(a.account?.updated_at ?? '');
      return a.organizationName.localeCompare(b.organizationName);
    });
    return sorted;
  }, [rows, statusFilter, solutionFilter, search, sort]);

  const hasFilters = search.trim() !== '' || statusFilter !== 'all' || solutionFilter !== 'all';

  return (
    <div>
      <PageHeader
        title="Kunden"
        description="Interne CRM-Übersicht aller Client-Workspaces."
        actions={<Button icon={Plus} onClick={() => navigate('/admin/clients/new')}>Neuer Kunde</Button>}
      />

      <Card className="mb-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
          <Field
            id="client-search"
            label="Suche"
            value={search}
            onChange={setSearch}
            placeholder="Firma, Kontakt, E-Mail, Branche"
          />
          <Select
            id="client-status-filter"
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[{ value: 'all', label: 'Alle Status' }, ...clientLifecycleStatuses.map((s) => ({ value: s, label: s }))]}
          />
          <Select
            id="client-solution-filter"
            label="Lösung"
            value={solutionFilter}
            onChange={setSolutionFilter}
            options={[{ value: 'all', label: 'Alle Lösungen' }, ...solutionCatalogKeys.map((s) => ({ value: s, label: s }))]}
          />
          <Select
            id="client-sort"
            label="Sortierung"
            value={sort}
            onChange={(value) => setSort(value as SortKey)}
            options={SORT_OPTIONS}
          />
        </div>
      </Card>

      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={hasFilters ? 'Keine Kunden gefunden' : 'Noch keine Kunden'}
          description={hasFilters
            ? 'Passen Sie Suche und Filter an oder legen Sie einen neuen Kunden an.'
            : 'Legen Sie den ersten Client-Workspace an, um ihn hier zu sehen.'}
          action={<Button icon={Plus} onClick={() => navigate('/admin/clients/new')}>Neuer Kunde</Button>}
        />
      ) : (
        <DataTable
          rows={filtered}
          getRowKey={(row) => row.organizationId}
          minWidth={880}
          // Below md the table becomes a stack of cards. The previous markup forced a
          // 880px-wide table through a horizontal scroller on every phone, which put the
          // customer name off screen as soon as the owner scrolled to read a status.
          onRowClick={(row) => navigate(`/admin/clients/${row.organizationId}`)}
          // A LINK, not plain text. The mobile card's only other affordance is the row
          // click above, which a keyboard cannot reach — and the "Firma" column that
          // carries the desktop link is hidden at this width. Without this the client
          // detail page would be keyboard-unreachable on a phone.
          mobileTitle={(row) => (
            <Link
              to={`/admin/clients/${row.organizationId}`}
              className="hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              {row.organizationName}
            </Link>
          )}
          mobileSubtitle={(row) => row.account?.primary_email ?? '—'}
          columns={[
            {
              key: 'company',
              header: 'Firma',
              hideOnMobile: true,
              render: (row) => (
                <>
                  <Link
                    to={`/admin/clients/${row.organizationId}`}
                    className="font-medium hover:underline"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {row.organizationName}
                  </Link>
                  <span className="block text-[12px] text-[var(--cq-fg-subtle)]">{row.account?.primary_email ?? '—'}</span>
                </>
              ),
            },
            {
              key: 'contact',
              header: 'Kontakt',
              render: (row) => (
                <>
                  {row.account?.primary_contact_name ?? '—'}
                  {row.account?.phone ? (
                    <span className="block text-[12px] text-[var(--cq-fg-subtle)]">{row.account.phone}</span>
                  ) : null}
                </>
              ),
            },
            { key: 'industry', header: 'Branche', render: (row) => row.account?.industry ?? '—' },
            {
              key: 'status',
              header: 'Status',
              render: (row) => (row.account
                ? <StatusBadge label={row.account.lifecycle_status} tone={lifecycleTone[row.account.lifecycle_status]} />
                : '—'),
            },
            {
              key: 'solutions',
              header: 'Lösungen',
              render: (row) => (row.solutions.length === 0 ? '—' : (
                <div className="flex flex-wrap gap-1">
                  {row.solutions.map((s) => (
                    <StatusBadge key={s.id} label={s.catalog_key.replace(/_/g, ' ')} tone={solutionTone[s.status]} />
                  ))}
                </div>
              )),
            },
            {
              key: 'monthly',
              header: 'Monatswert',
              align: 'right',
              render: (row) => formatCents(row.account?.estimated_monthly_value_cents, row.account?.currency),
            },
            {
              key: 'access',
              header: 'Zugang',
              render: (row) => {
                const invitation = row.invitations.find((i) => i.status === 'pending') ?? row.invitations[0];
                return invitation ? <StatusBadge label={invitation.status} tone={invitationTone[invitation.status]} /> : '—';
              },
            },
            { key: 'owner', header: 'Owner', hideOnMobile: true, render: (row) => row.account?.internal_owner ?? '—' },
          ]}
        />
      )}
    </div>
  );
}
