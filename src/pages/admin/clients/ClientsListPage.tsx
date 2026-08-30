import { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, Plus, Search } from 'lucide-react';

import {
  DataTable, EmptyState, ErrorState, FilterChips, LinkButton, SearchInput, Select, StatBand,
  StatBandSkeleton, StatusBadge, TableSkeleton, Toolbar, WorkspaceHeader,
  type Column, type SortDirection, type StatItem,
} from '@/components/dashboard';
import { loadAdminClients, type AdminClientRow } from '@/lib/clientPlatform/adminApi';
import { formatCents } from '@/lib/clientPlatform/validation';
import { clientLifecycleStatuses, solutionCatalogKeys } from '@/lib/clientPlatform/types';
import {
  catalogLabel, invitationLabel, invitationTone, lifecycleLabel, lifecycleTone, solutionTone,
} from '@/pages/admin/clients/statusTones';

/**
 * Portal tenants — organizations with a Cogniiq login, their provisioned solutions and
 * their invitation state.
 *
 * This is deliberately NOT the customer list. `owner_customers` is the commercial
 * identity that invoices and offers point at; an organization is the portal tenant a
 * customer signs in to, and the two are separate records on purpose. The page says so
 * in its subtitle rather than letting the owner discover it from behaviour.
 *
 * Migrated onto the shared dashboard system (the intent of PR #77, rebuilt on current
 * main): the hand-rolled table, four bare `<select>`s and 44px pill buttons are gone, so
 * moving here from the customer workspace no longer looks like changing application.
 */

type SortKey = 'name' | 'updated' | 'monthly';

export function ClientsListPage() {
  const [rows, setRows] = useState<AdminClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [solutionFilter, setSolutionFilter] = useState('all');
  const [sort, setSort] = useState<SortKey>('name');
  const [tableSort, setTableSort] = useState<{ key: string; direction: SortDirection } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await loadAdminClients()); setError(null); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: rows.length };
    for (const row of rows) {
      const status = row.account?.lifecycle_status;
      if (status) counts[status] = (counts[status] ?? 0) + 1;
    }
    return counts;
  }, [rows]);

  const stats: StatItem[] = useMemo(() => {
    const active = rows.filter((r) => r.account?.lifecycle_status === 'active');
    const monthly = rows.reduce((sum, r) => sum + (r.account?.estimated_monthly_value_cents ?? 0), 0);
    const solutions = rows.reduce((sum, r) => sum + r.solutions.filter((s) => s.status === 'active').length, 0);
    const pending = rows.reduce((sum, r) => sum + r.invitations.filter((i) => i.status === 'pending').length, 0);
    return [
      {
        key: 'monthly',
        label: 'Geschätzter Monatswert',
        value: formatCents(monthly),
        // The CRM field is an estimate the owner maintains by hand; it is not revenue and
        // must never be read as one.
        hint: 'manuell gepflegte Schätzung — kein Umsatz',
        lead: true,
      },
      { key: 'orgs', label: 'Organisationen', value: String(rows.length), hint: `${active.length} aktiv` },
      { key: 'solutions', label: 'Aktive Lösungen', value: String(solutions), to: '/admin/solutions' },
      { key: 'pending', label: 'Offene Einladungen', value: String(pending), tone: pending > 0 ? 'attention' : 'neutral', to: '/admin/invitations' },
    ];
  }, [rows]);

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
      return a.organizationName.localeCompare(b.organizationName, 'de');
    });
    return sorted;
  }, [rows, statusFilter, solutionFilter, search, sort]);

  const columns: Column<AdminClientRow>[] = [
    {
      key: 'organisation',
      header: 'Organisation',
      sortValue: (r) => r.organizationName,
      render: (r) => (
        <div className="min-w-0">
          <div className="truncate font-semibold text-[var(--cq-fg)]">{r.organizationName}</div>
          <div className="truncate text-[12px] text-[var(--cq-fg-subtle)]">
            {[r.account?.primary_contact_name, r.account?.primary_email].filter(Boolean).join(' · ') || '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'industry',
      header: 'Branche',
      hideOnMobile: true,
      render: (r) => <span className="text-[var(--cq-fg-muted)]">{r.account?.industry ?? '—'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (r) => r.account?.lifecycle_status ?? '',
      render: (r) => (r.account ? (
        <span className="whitespace-nowrap">
          <StatusBadge
            label={lifecycleLabel[r.account.lifecycle_status] ?? r.account.lifecycle_status}
            tone={lifecycleTone[r.account.lifecycle_status]}
          />
        </span>
      ) : <span className="text-[var(--cq-fg-subtle)]">—</span>),
    },
    {
      key: 'solutions',
      header: 'Lösungen',
      render: (r) => (
        r.solutions.length === 0
          ? <span className="text-[12px] text-[var(--cq-fg-subtle)]">keine</span>
          : (
            <div className="flex flex-wrap gap-1">
              {r.solutions.map((s) => (
                <StatusBadge key={s.id} label={catalogLabel(s.catalog_key)} tone={solutionTone[s.status]} />
              ))}
            </div>
          )
      ),
    },
    {
      key: 'monthly',
      header: 'Monatswert',
      align: 'right',
      sortValue: (r) => r.account?.estimated_monthly_value_cents ?? 0,
      render: (r) => (
        <span className="whitespace-nowrap text-[var(--cq-fg-muted)]">
          {formatCents(r.account?.estimated_monthly_value_cents, r.account?.currency)}
        </span>
      ),
    },
    {
      key: 'access',
      header: 'Zugang',
      hideOnMobile: true,
      render: (r) => {
        const invitation = r.invitations.find((i) => i.status === 'pending') ?? r.invitations[0];
        if (!invitation) return <span className="text-[12px] text-[var(--cq-fg-subtle)]">keine Einladung</span>;
        return (
          <span className="whitespace-nowrap">
            <StatusBadge label={invitationLabel[invitation.status] ?? invitation.status} tone={invitationTone[invitation.status]} />
          </span>
        );
      },
    },
  ];

  return (
    <>
      <WorkspaceHeader
        eyebrow="Kunden"
        title="Portalzugänge"
        subtitle="Organisationen mit Cogniiq-Login: provisionierte Lösungen, Einladungen und Ansprechpartner. Die kaufmännische Kundenidentität für Angebote und Rechnungen liegt im Kundenstamm."
        actions={<LinkButton to="/admin/clients/new" variant="primary" icon={Plus}>Neue Organisation</LinkButton>}
        toolbar={
          !loading && rows.length > 0 ? (
            <Toolbar
              trailing={
                <>
                  <SearchInput
                    value={search}
                    onChange={setSearch}
                    label="Portalzugänge durchsuchen"
                    placeholder="Firma, Kontakt, E-Mail, Branche …"
                    className="w-full sm:w-64"
                  />
                  <div className="w-full sm:w-48">
                    <Select
                      id="solution-filter"
                      value={solutionFilter}
                      onChange={setSolutionFilter}
                      options={[
                        { value: 'all', label: 'Alle Lösungen' },
                        ...solutionCatalogKeys.map((key) => ({ value: key, label: catalogLabel(key) })),
                      ]}
                    />
                  </div>
                  <div className="w-full sm:w-44">
                    <Select
                      id="client-sort"
                      value={sort}
                      onChange={(v) => { setSort(v as SortKey); setTableSort(null); }}
                      options={[
                        { value: 'name', label: 'Name (A–Z)' },
                        { value: 'updated', label: 'Zuletzt aktualisiert' },
                        { value: 'monthly', label: 'Monatswert' },
                      ]}
                    />
                  </div>
                </>
              }
            >
              <FilterChips
                label="Nach Lebenszyklus filtern"
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: 'all', label: 'Alle', count: statusCounts.all },
                  ...clientLifecycleStatuses
                    .filter((status) => (statusCounts[status] ?? 0) > 0)
                    .map((status) => ({ value: status, label: lifecycleLabel[status] ?? status, count: statusCounts[status] })),
                ]}
              />
            </Toolbar>
          ) : undefined
        }
      />

      {error ? <div className="mb-4"><ErrorState message={error} onRetry={() => void load()} /></div> : null}

      <div className="space-y-4">
        {loading ? <StatBandSkeleton count={4} /> : rows.length > 0 ? <StatBand items={stats} /> : null}

        {loading ? <TableSkeleton rows={5} cols={5} /> : rows.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Noch keine Portalzugänge"
            description="Eine Organisation entsteht, sobald Sie einen Kunden für das Kundenportal freischalten. Sie bekommt einen Login, sieht ihre Lösungen und ihre Dokumente."
            action={<LinkButton to="/admin/clients/new" variant="primary" icon={Plus}>Neue Organisation</LinkButton>}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Keine Treffer"
            description="Keine Organisation passt zu dieser Kombination aus Suche, Lebenszyklus und Lösung."
            action={
              <LinkButton to="/admin/clients" variant="secondary">Filter zurücksetzen</LinkButton>
            }
          />
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            getRowKey={(r) => r.organizationId}
            minWidth={880}
            sort={tableSort}
            onSortChange={setTableSort}
            rowHref={(r) => `/admin/clients/${r.organizationId}`}
            mobileTitle={(r) => (
              <div className="flex items-center gap-2">
                <span>{r.organizationName}</span>
                {r.account ? (
                  <StatusBadge
                    label={lifecycleLabel[r.account.lifecycle_status] ?? r.account.lifecycle_status}
                    tone={lifecycleTone[r.account.lifecycle_status]}
                  />
                ) : null}
              </div>
            )}
            mobileSubtitle={(r) => r.account?.primary_email ?? 'kein Kontakt hinterlegt'}
          />
        )}
      </div>
    </>
  );
}

export default ClientsListPage;
