import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search, Archive, RotateCcw, Trash2 } from 'lucide-react';

import {
  Button, ConfirmDialog, DataTable, EmptyState, ErrorState, IconButton, KpiCard, PageHeader, Select,
  StatusBadge, Tabs, TableSkeleton, useToast, type Column,
} from '@/components/dashboard';
import { useOwnerEntity } from '@/pages/owner/ownerContext';
import {
  loadCustomers, loadDeleteBlockers, archiveCustomer, unarchiveCustomer, deleteCustomer,
} from '@/lib/ownerFinance/customersApi';
import { formatDateDe } from '@/lib/ownerFinance/exports';
import { customerStatusLabel, customerStatusTone, customerDisplayName } from '@/lib/ownerFinance/customerLabels';
import { CustomerFormDialog } from '@/components/finance/CustomerFormDialog';
import { formatCentsCurrencyDe } from '@/lib/ownerFinance/exports';
import type { OwnerCustomerListRow, OwnerCustomerDeleteBlockers } from '@/lib/ownerFinance/types';

// Primary operational workspace for owner-side customer management. All customers in one overview
// with status/task filters, search, sorting and clear empty/loading/error states. Matches the
// existing owner dashboard design system. German throughout.

type SortKey = 'newest' | 'oldest' | 'activity' | 'name';

/** Names only the non-zero reasons a customer cannot be deleted. */
function blockerSentence(b: OwnerCustomerDeleteBlockers): string {
  const parts: string[] = [];
  if (b.issued_invoices > 0) parts.push(`${b.issued_invoices} ausgestellte Rechnung${b.issued_invoices === 1 ? '' : 'en'}`);
  if (b.payments > 0) parts.push(`${b.payments} Zahlung${b.payments === 1 ? '' : 'en'}`);
  if (b.finalized_offers > 0) parts.push(`${b.finalized_offers} verbindliche${b.finalized_offers === 1 ? 's' : ''} Angebot${b.finalized_offers === 1 ? '' : 'e'}`);
  if (b.subscriptions > 0) parts.push(`${b.subscriptions} Abonnement${b.subscriptions === 1 ? '' : 's'}`);
  if (parts.length === 0) return 'geschützte Datensätze';
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(', ')} und ${parts[parts.length - 1]}`;
}

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
  /* Row actions. Blockers are fetched when the dialog opens so the confirmation
     can name what stands in the way instead of only refusing on submit. */
  const [pendingDelete, setPendingDelete] = useState<{ row: OwnerCustomerListRow; blockers: OwnerCustomerDeleteBlockers | null } | null>(null);
  const [pendingArchive, setPendingArchive] = useState<OwnerCustomerListRow | null>(null);
  const toast = useToast();

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

  const askDelete = useCallback(async (row: OwnerCustomerListRow) => {
    setPendingDelete({ row, blockers: null });
    try {
      setPendingDelete({ row, blockers: await loadDeleteBlockers(row.id) });
    } catch {
      // Leave blockers null: the dialog then shows the plain warning and the
      // server still refuses anything protected.
    }
  }, []);

  const runDelete = useCallback(async () => {
    if (!pendingDelete) return;
    const { row } = pendingDelete;
    const { deleted, error: err } = await deleteCustomer(row.id);
    setPendingDelete(null);
    if (err || !deleted) { toast.error('Löschen nicht möglich', err ?? 'Unbekannter Fehler'); return; }
    toast.success('Kunde gelöscht', customerDisplayName(row));
    void load();
  }, [pendingDelete, toast, load]);

  const runArchive = useCallback(async () => {
    if (!pendingArchive) return;
    const { error: err } = await archiveCustomer(pendingArchive.id);
    setPendingArchive(null);
    if (err) { toast.error('Archivieren fehlgeschlagen', err); return; }
    toast.success('Kunde archiviert', 'Rechnungen und Angebote bleiben erhalten.');
    void load();
  }, [pendingArchive, toast, load]);

  const runRestore = useCallback(async (row: OwnerCustomerListRow) => {
    const { error: err } = await unarchiveCustomer(row.id);
    if (err) { toast.error('Wiederherstellen fehlgeschlagen', err); return; }
    void load();
  }, [toast, load]);

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
    { key: 'invoices', header: 'Rechnungen', align: 'right', render: (c) => <span className="tabular-nums text-gray-700">{c.invoice_count}</span>, hideOnMobile: true },
    { key: 'revenue', header: 'Umsatz', align: 'right', render: (c) => <span className="tabular-nums text-gray-700">{formatCentsCurrencyDe(c.revenue_gross_cents, 'EUR')}</span>, hideOnMobile: true },
    { key: 'open', header: 'Offene Aufgaben', align: 'right', render: (c) => <span className={`tabular-nums font-medium ${c.open_task_count > 0 ? 'text-amber-700' : 'text-gray-400'}`}>{c.open_task_count}</span> },
    { key: 'done', header: 'Erledigt', align: 'right', render: (c) => <span className="tabular-nums text-gray-500">{c.completed_task_count}</span>, hideOnMobile: true },
    { key: 'status', header: 'Status', render: (c) => <StatusBadge label={customerStatusLabel[c.status]} tone={customerStatusTone[c.status]} /> },
    { key: 'activity', header: 'Letzte Aktivität', render: (c) => <span className="text-gray-500">{formatDateDe(c.last_activity_at)}</span>, hideOnMobile: true },
    { key: 'created', header: 'Angelegt', render: (c) => <span className="text-gray-500">{formatDateDe(c.created_at)}</span>, hideOnMobile: true },
    {
      key: 'actions', header: '', align: 'right', render: (c) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {c.status === 'archived' ? (
            <IconButton icon={RotateCcw} label="Kunde wiederherstellen" variant="ghost" onClick={() => void runRestore(c)} />
          ) : (
            <IconButton icon={Archive} label="Kunde archivieren" variant="ghost" onClick={() => setPendingArchive(c)} />
          )}
          <IconButton icon={Trash2} label="Kunde löschen" variant="ghost" onClick={() => void askDelete(c)} />
        </div>
      ),
    },
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
          title="Noch keine Kunden angelegt"
          description={
            'Dies ist der zentrale Kundenstamm: Kunden, die Sie hier anlegen, stehen sofort im '
            + 'Finanzbereich zur Auswahl, und Kunden, die Sie beim Erstellen eines Angebots oder '
            + 'einer Rechnung anlegen, erscheinen sofort hier. Es ist derselbe Datensatz. '
            + 'Portalzugang, Kundenprojekte und Dokumente verwalten Sie weiterhin unter „Kunden“.'
          }
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button icon={Plus} onClick={() => setCreateOpen(true)} disabled={!entity}>Neuer Kunde</Button>
              <Button variant="secondary" onClick={() => navigate('/admin/clients')}>Zum Portalzugang (Kunden)</Button>
            </div>
          } />
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

      <ConfirmDialog
        open={!!pendingArchive} onClose={() => setPendingArchive(null)} onConfirm={runArchive}
        title="Kunde archivieren" confirmLabel="Kunde archivieren"
        message={
          <>
            <p>
              <span className="font-semibold text-gray-950">
                {pendingArchive ? customerDisplayName(pendingArchive) : ''}
              </span>{' '}
              wird aus der aktiven Liste und aus den Auswahlfeldern im Finanzbereich ausgeblendet.
            </p>
            <p className="mt-2">Nichts wird gelöscht. Sie können den Kunden jederzeit wiederherstellen.</p>
          </>
        } />

      {/*
        Two outcomes behind one button, decided by the server's blocker counts:
        a customer without protected records is deleted, a customer with them is
        never silently archived instead — the dialog says why and offers the
        archive explicitly.
      */}
      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        tone="danger"
        title={pendingDelete?.blockers && !pendingDelete.blockers.deletable ? 'Löschen nicht möglich' : 'Kunde löschen?'}
        confirmLabel={pendingDelete?.blockers && !pendingDelete.blockers.deletable ? 'Stattdessen archivieren' : 'Kunde löschen'}
        onConfirm={async () => {
          if (pendingDelete?.blockers && !pendingDelete.blockers.deletable) {
            const row = pendingDelete.row;
            setPendingDelete(null);
            setPendingArchive(row);
            return;
          }
          await runDelete();
        }}
        message={
          pendingDelete?.blockers && !pendingDelete.blockers.deletable ? (
            <>
              <p>
                <span className="font-semibold text-gray-950">{customerDisplayName(pendingDelete.row)}</span>{' '}
                hat {blockerSentence(pendingDelete.blockers)} und kann deshalb nicht gelöscht werden.
              </p>
              <p className="mt-2">
                Diese Unterlagen sind aufbewahrungspflichtig und werden nicht mitgelöscht. Archivieren
                Sie den Kunden, um ihn aus der aktiven Ansicht zu entfernen.
              </p>
            </>
          ) : (
            <>
              <p>
                <span className="font-semibold text-gray-950">
                  {pendingDelete ? customerDisplayName(pendingDelete.row) : ''}
                </span>{' '}
                wird dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
              {pendingDelete?.blockers
                && pendingDelete.blockers.draft_invoices + pendingDelete.blockers.draft_offers > 0 ? (
                <p className="mt-2">
                  Mitgelöscht werden{' '}
                  {[
                    pendingDelete.blockers.draft_invoices > 0
                      ? `${pendingDelete.blockers.draft_invoices} Rechnungsentwurf${pendingDelete.blockers.draft_invoices === 1 ? '' : 'e'}`
                      : null,
                    pendingDelete.blockers.draft_offers > 0
                      ? `${pendingDelete.blockers.draft_offers} Angebotsentwurf${pendingDelete.blockers.draft_offers === 1 ? '' : 'e'}`
                      : null,
                  ].filter(Boolean).join(' und ')}
                  .
                </p>
              ) : null}
            </>
          )
        } />
    </>
  );
}

export default CustomersPage;
