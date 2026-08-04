import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Plus } from 'lucide-react';

import {
  DataTable,
  EmptyState,
  ErrorState,
  LinkButton,
  PageHeader,
  SearchInput,
  Select,
  TableSkeleton,
  Toolbar,
  type Column,
} from '@/components/dashboard';
import { Pill, invitationTone, lifecycleTone, solutionTone } from '@/pages/admin/clients/adminUi';
import { loadAdminClients, type AdminClientRow } from '@/lib/clientPlatform/adminApi';
import { formatCents } from '@/lib/clientPlatform/validation';
import { clientLifecycleStatuses, solutionCatalogKeys } from '@/lib/clientPlatform/types';
import {
  clientLifecycleStatusLabel,
  invitationStatusLabel,
  solutionCatalogKeyLabel,
} from '@/lib/clientPlatform/labels';

type SortKey = 'name' | 'updated' | 'monthly';

export function ClientsListPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<AdminClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [solutionFilter, setSolutionFilter] = useState('all');
  const [sort, setSort] = useState<SortKey>('name');
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadAdminClients()
      .then((data) => { if (active) { setRows(data); setError(null); } })
      .catch((e: unknown) => { if (active) setError(e instanceof Error ? e.message : String(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadToken]);

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

  const hasFilters = statusFilter !== 'all' || solutionFilter !== 'all' || search.trim().length > 0;

  const columns: Column<AdminClientRow>[] = [
    {
      key: 'company',
      header: 'Firma',
      render: (row) => (
        <div className="min-w-0">
          <Link
            to={`/admin/clients/${row.organizationId}`}
            onClick={(event) => event.stopPropagation()}
            className="font-semibold text-gray-950 hover:underline"
          >
            {row.organizationName}
          </Link>
          <div className="truncate text-[12px] text-gray-500">{row.account?.primary_email ?? '—'}</div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Kontakt',
      render: (row) => (
        <div className="min-w-0">
          <div className="truncate">{row.account?.primary_contact_name ?? '—'}</div>
          {row.account?.phone ? <div className="truncate text-[12px] text-gray-500">{row.account.phone}</div> : null}
        </div>
      ),
    },
    { key: 'industry', header: 'Branche', hideOnMobile: true, render: (row) => row.account?.industry ?? '—' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (row.account ? <Pill label={clientLifecycleStatusLabel(row.account.lifecycle_status)} tone={lifecycleTone[row.account.lifecycle_status]} /> : '—'),
    },
    {
      key: 'solutions',
      header: 'Lösungen',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.solutions.length === 0
            ? <span className="text-gray-400">—</span>
            : row.solutions.map((s) => <Pill key={s.id} label={solutionCatalogKeyLabel(s.catalog_key)} tone={solutionTone[s.status]} />)}
        </div>
      ),
    },
    {
      key: 'monthly',
      header: 'Monatswert',
      align: 'right',
      className: 'tabular-nums font-medium text-gray-900',
      render: (row) => formatCents(row.account?.estimated_monthly_value_cents, row.account?.currency),
    },
    {
      key: 'access',
      header: 'Zugang',
      render: (row) => {
        const invitation = row.invitations.find((i) => i.status === 'pending') ?? row.invitations[0];
        return invitation ? <Pill label={invitationStatusLabel(invitation.status)} tone={invitationTone[invitation.status]} /> : '—';
      },
    },
    { key: 'owner', header: 'Owner', hideOnMobile: true, render: (row) => row.account?.internal_owner ?? '—' },
  ];

  return (
    <>
      <PageHeader
        title="Kunden"
        description="Interne CRM-Übersicht aller Client-Workspaces."
        actions={
          <LinkButton to="/admin/clients/new" icon={Plus}>Neuer Kunde</LinkButton>
        }
      />

      <div className="space-y-4">
        <Toolbar>
          <SearchInput
            label="Kunden durchsuchen"
            value={search}
            onChange={setSearch}
            placeholder="Suche nach Firma, Kontakt, E-Mail, Branche"
          />
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 lg:flex lg:shrink-0 lg:items-center">
            <Select
              id="client-status-filter"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[{ value: 'all', label: 'Alle Status' }, ...clientLifecycleStatuses.map((s) => ({ value: s, label: clientLifecycleStatusLabel(s) }))]}
            />
            <Select
              id="client-solution-filter"
              value={solutionFilter}
              onChange={setSolutionFilter}
              options={[{ value: 'all', label: 'Alle Lösungen' }, ...solutionCatalogKeys.map((s) => ({ value: s, label: solutionCatalogKeyLabel(s) }))]}
            />
            <Select
              id="client-sort"
              value={sort}
              onChange={(value) => setSort(value as SortKey)}
              options={[
                { value: 'name', label: 'Name (A-Z)' },
                { value: 'updated', label: 'Zuletzt aktualisiert' },
                { value: 'monthly', label: 'Monatswert' },
              ]}
            />
          </div>
        </Toolbar>

        {loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={() => setReloadToken((token) => token + 1)} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={hasFilters ? 'Keine Kunden gefunden' : 'Noch keine Kunden'}
            description={
              hasFilters
                ? 'Passen Sie Suche und Filter an oder legen Sie einen neuen Kunden an.'
                : 'Sobald ein Client-Workspace angelegt ist, erscheint er hier mit Status, Lösungen und Zugang.'
            }
            action={
              <LinkButton to="/admin/clients/new" icon={Plus} variant="secondary">Neuer Kunde</LinkButton>
            }
          />
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            minWidth={960}
            getRowKey={(row) => row.organizationId}
            onRowClick={(row) => navigate(`/admin/clients/${row.organizationId}`)}
            mobileTitle={(row) => row.organizationName}
            mobileSubtitle={(row) => row.account?.primary_email ?? '—'}
          />
        )}
      </div>
    </>
  );
}
