import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search } from 'lucide-react';

import {
  Button, DataTable, EmptyState, ErrorState, KpiCard, PageHeader, Select,
  StatusBadge, Tabs, TableSkeleton, type Column,
} from '@/components/dashboard';
import { useOwnerEntity } from '@/pages/owner/ownerContext';
import { loadCustomers } from '@/lib/ownerFinance/customersApi';
import { formatDateDe } from '@/lib/ownerFinance/exports';
import { customerStatusLabel, customerStatusTone, customerDisplayName } from '@/lib/ownerFinance/customerLabels';
import { CustomerFormDialog } from '@/components/finance/CustomerFormDialog';
import type { OwnerCustomerListRow } from '@/lib/ownerFinance/types';

// Primary operational workspace for owner-side customer management. All customers in one overview
// with status/task filters, search, sorting and clear empty/loading/error states. Matches the
// existing owner dashboard design system. German throughout.

type SortKey = 'newest' | 'oldest' | 'activity' | 'name';

const FILTERS: { value: string; label: string; match: (c: OwnerCustomerListRow) => boolean }[] = [
  { value: 'all', label: 'Alle', match: () => true },
  { value: 'active', label: 'Aktiv', match: (c) => c.status === 'active' },
  { value: 'waiting', label: 'Wartend', match: (c) => c.status === 'waiting' },
  { value: 'completed', label: 'Abgeschlossen', match: (c) => c.status === 'completed' },
  { value: 'archived', label: 'Archiviert', match: (c) => c.status === 'archived' },
  { value: 'with_open', label: 'Mit offenen Aufgaben', match: (c) => c.open_task_count > 0 },
  { value: 'without_open', label: 'Ohne offene Aufgaben', match: (c) => c.open_task_count === 0 },
];

export function CustomersPage() {
  const { entity } = useOwnerEntity();
  const navigate = useNavigate();
  const [rows, setRows] = useState<OwnerCustomerListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('activity');
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    if (!entity) return;
    setLoading(true);
    try {
      setRows(await loadCustomers(entity.id));
      setError(null);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, [entity]);

  useEffect(() => { void load(); }, [load]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const f of FILTERS) c[f.value] = rows.filter(f.match).length;
    return c;
  }, [rows]);

  const kpis = useMemo(() => ({
    total: rows.length,
    active: rows.filter((c) => c.status === 'active').length,
    openTasks: rows.reduce((s, c) => s + c.open_task_count, 0),
  }), [rows]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = rows.filter(FILTERS.find((f) => f.value === filter)?.match ?? (() => true));
    const searched = q
      ? base.filter((c) => [c.company, c.contact_name, c.email].some((v) => (v ?? '').toLowerCase().includes(q)))
      : base;
    const sorted = [...searched];
    sorted.sort((a, b) => {
      switch (sort) {
        case 'newest': return b.created_at.localeCompare(a.created_at);
        case 'oldest': return a.created_at.localeCompare(b.created_at);
        case 'name': return customerDisplayName(a).localeCompare(customerDisplayName(b), 'de');
        case 'activity': default: return b.last_activity_at.localeCompare(a.last_activity_at);
      }
    });
    return sorted;
  }, [rows, filter, query, sort]);

  const columns: Column<OwnerCustomerListRow>[] = [
    { key: 'name', header: 'Kunde', render: (c) => (
      <div className="min-w-0">
        <div className="font-semibold text-gray-950">{customerDisplayName(c)}</div>
        {c.contact_name && c.company ? <div className="text-[12px] text-gray-500">{c.contact_name}</div> : null}
      </div>
    ) },
    { key: 'email', header: 'E-Mail', render: (c) => <span className="text-gray-600">{c.email ?? '—'}</span>, hideOnMobile: true },
    { key: 'phone', header: 'Telefon', render: (c) => <span className="text-gray-600">{c.phone ?? '—'}</span>, hideOnMobile: true },
    { key: 'offers', header: 'Angebote', align: 'right', render: (c) => <span className="tabular-nums text-gray-700">{c.offer_count}</span> },
    { key: 'open', header: 'Offene Aufgaben', align: 'right', render: (c) => <span className={`tabular-nums font-medium ${c.open_task_count > 0 ? 'text-amber-700' : 'text-gray-400'}`}>{c.open_task_count}</span> },
    { key: 'done', header: 'Erledigt', align: 'right', render: (c) => <span className="tabular-nums text-gray-500">{c.completed_task_count}</span>, hideOnMobile: true },
    { key: 'status', header: 'Status', render: (c) => <StatusBadge label={customerStatusLabel[c.status]} tone={customerStatusTone[c.status]} /> },
    { key: 'activity', header: 'Letzte Aktivität', render: (c) => <span className="text-gray-500">{formatDateDe(c.last_activity_at)}</span>, hideOnMobile: true },
    { key: 'created', header: 'Angelegt', render: (c) => <span className="text-gray-500">{formatDateDe(c.created_at)}</span>, hideOnMobile: true },
  ];

  return (
    <>
      <PageHeader
        title="Kunden & Aufgaben"
        description="Ihr zentraler Arbeitsbereich für die Kundenverwaltung: alle Kunden, zugehörige Angebote und Aufgaben an einem Ort."
        actions={<Button icon={Plus} onClick={() => setCreateOpen(true)} disabled={!entity}>Neuer Kunde</Button>}
      />

      {error ? <div className="mb-6"><ErrorState message={error} onRetry={() => void load()} /></div> : null}

      {!loading && rows.length > 0 ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <KpiCard label="Kunden gesamt" value={String(kpis.total)} />
          <KpiCard label="Aktive Kunden" value={String(kpis.active)} tone={kpis.active > 0 ? 'positive' : 'neutral'} />
          <KpiCard label="Offene Aufgaben" value={String(kpis.openTasks)} hint="über alle Kunden" />
        </div>
      ) : null}

      {!loading && rows.length > 0 ? (
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1"><Tabs value={filter} onChange={setFilter} tabs={FILTERS.map((f) => ({ value: f.value, label: f.label, count: counts[f.value] }))} /></div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <input
                value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Kunde, Firma, E-Mail …" aria-label="Kunden durchsuchen"
                className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-900 outline-none transition-colors focus:border-gray-400 sm:w-64"
              />
            </div>
            <div className="w-44">
              <Select id="sort" value={sort} onChange={(v) => setSort(v as SortKey)}
                options={[
                  { value: 'activity', label: 'Letzte Aktivität' },
                  { value: 'newest', label: 'Neueste zuerst' },
                  { value: 'oldest', label: 'Älteste zuerst' },
                  { value: 'name', label: 'Name (A–Z)' },
                ]} />
            </div>
          </div>
        </div>
      ) : null}

      {loading ? <TableSkeleton rows={6} cols={6} /> : rows.length === 0 ? (
        <EmptyState icon={Users}
          title="Noch keine Kunden"
          description="Legen Sie Ihren ersten Kunden an. Kunden aus bestehenden Angeboten wurden automatisch übernommen."
          action={<Button icon={Plus} onClick={() => setCreateOpen(true)} disabled={!entity}>Neuer Kunde</Button>} />
      ) : visible.length === 0 ? (
        <EmptyState icon={Search} title="Keine Treffer" description="Passen Sie Filter oder Suche an." />
      ) : (
        <DataTable columns={columns} rows={visible} getRowKey={(c) => c.id} minWidth={920}
          onRowClick={(c) => navigate(`/admin/finance/customers/${c.id}`)}
          mobileTitle={(c) => <div className="flex items-center gap-2"><span>{customerDisplayName(c)}</span><StatusBadge label={customerStatusLabel[c.status]} tone={customerStatusTone[c.status]} /></div>}
          mobileSubtitle={(c) => `${c.open_task_count} offen · ${c.offer_count} Angebote`} />
      )}

      {entity ? (
        <CustomerFormDialog
          open={createOpen} onClose={() => setCreateOpen(false)} entityId={entity.id}
          onSaved={(id) => navigate(`/admin/finance/customers/${id}`)} />
      ) : null}
    </>
  );
}

export default CustomersPage;
