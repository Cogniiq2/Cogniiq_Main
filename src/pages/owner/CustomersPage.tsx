import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, Plus, RotateCcw, Search, Trash2, Users } from 'lucide-react';

import {
  Button, ConfirmDialog, DataTable, EmptyState, ErrorState, FilterChips, IconButton,
  SearchInput, Select, StatBand, StatBandSkeleton, StatusBadge, TableSkeleton, Toolbar,
  WorkspaceHeader, useToast, type Column, type SortDirection, type StatItem,
} from '@/components/dashboard';
import { useCreateIntent } from '@/pages/admin/routeIntent';
import { useOwnerEntity } from '@/pages/owner/ownerContext';
import {
  loadCustomers, loadDeleteBlockers, archiveCustomer, unarchiveCustomer, deleteCustomer,
} from '@/lib/ownerFinance/customersApi';
import { formatCentsCurrencyDe, formatDateDe } from '@/lib/ownerFinance/exports';
import { customerStatusLabel, customerStatusTone, customerDisplayName } from '@/lib/ownerFinance/customerLabels';
import { CustomerFormDialog } from '@/components/finance/CustomerFormDialog';
import type { OwnerCustomerListRow, OwnerCustomerDeleteBlockers } from '@/lib/ownerFinance/types';

/**
 * The customer workspace — the list the whole operating system hangs off.
 *
 * The previous version showed eleven equally-weighted columns (e-mail, phone, offers,
 * invoices, revenue, open tasks, done tasks, status, activity, created, actions) which
 * overflowed its own container and left the owner reading a spreadsheet. This one asks
 * what the list is actually for: who is this, what commercial state are they in, what
 * do they owe, and what work is open. Everything else moved into the customer's own
 * page, where there is room for it.
 *
 * The data is unchanged — the same owner_list_customers row, the same RPCs behind the
 * same archive/delete boundaries.
 */

type SortKey = 'activity' | 'name' | 'revenue' | 'work' | 'created';

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
  { value: 'all', label: 'Alle', match: (c) => c.status !== 'archived' },
  { value: 'active', label: 'Aktiv', match: (c) => c.status === 'active' },
  { value: 'waiting', label: 'Wartend', match: (c) => c.status === 'waiting' },
  { value: 'open_work', label: 'Offene Arbeit', match: (c) => c.status !== 'archived' && (c.open_task_count > 0 || c.open_invoice_count > 0) },
  { value: 'completed', label: 'Abgeschlossen', match: (c) => c.status === 'completed' },
  { value: 'archived', label: 'Archiviert', match: (c) => c.status === 'archived' },
];

/** Two-letter monogram for the row's identity chip. Never derived from an e-mail domain. */
function initials(row: OwnerCustomerListRow): string {
  const source = (row.company?.trim() || row.contact_name?.trim() || row.email?.trim() || '?');
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export function CustomersPage() {
  const { entity } = useOwnerEntity();
  const navigate = useNavigate();
  const [rows, setRows] = useState<OwnerCustomerListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('activity');
  const [tableSort, setTableSort] = useState<{ key: string; direction: SortDirection } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  // ⌘K's create action navigates here with ?create=1; this opens the dialog this page
  // already owns. Without the intent nothing opens — the plain list URL stays a list.
  useCreateIntent(() => setCreateOpen(true));
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
    toast.success('Kunde wiederhergestellt', customerDisplayName(row));
    void load();
  }, [toast, load]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const f of FILTERS) c[f.value] = rows.filter(f.match).length;
    return c;
  }, [rows]);

  const stats: StatItem[] = useMemo(() => {
    const live = rows.filter((c) => c.status !== 'archived');
    const openTasks = live.reduce((sum, c) => sum + c.open_task_count, 0);
    const openInvoices = live.reduce((sum, c) => sum + c.open_invoice_count, 0);
    const revenue = rows.reduce((sum, c) => sum + c.revenue_gross_cents, 0);
    return [
      {
        key: 'revenue',
        label: 'Fakturiert gesamt',
        value: formatCentsCurrencyDe(revenue),
        hint: 'Summe aller gestellten Rechnungen je Kunde',
        lead: true,
      },
      { key: 'active', label: 'Aktive Kunden', value: String(live.filter((c) => c.status === 'active').length), hint: `${live.length} nicht archiviert` },
      { key: 'waiting', label: 'Wartend', value: String(live.filter((c) => c.status === 'waiting').length), hint: 'warten auf Zuarbeit', tone: live.some((c) => c.status === 'waiting') ? 'attention' : 'neutral' },
      { key: 'tasks', label: 'Offene Aufgaben', value: String(openTasks), hint: 'über alle Kunden' },
      { key: 'invoices', label: 'Offene Rechnungen', value: String(openInvoices), hint: 'noch nicht vollständig bezahlt', to: '/admin/finance/invoices' },
    ];
  }, [rows]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = rows.filter(FILTERS.find((f) => f.value === filter)?.match ?? (() => true));
    const searched = q
      ? base.filter((c) => [c.company, c.contact_name, c.email, c.city, c.phone]
          .some((v) => (v ?? '').toLowerCase().includes(q)))
      : base;
    const sorted = [...searched];
    sorted.sort((a, b) => {
      switch (sort) {
        case 'created': return b.created_at.localeCompare(a.created_at);
        case 'name': return customerDisplayName(a).localeCompare(customerDisplayName(b), 'de');
        case 'revenue': return b.revenue_gross_cents - a.revenue_gross_cents;
        case 'work': return (b.open_task_count + b.open_invoice_count) - (a.open_task_count + a.open_invoice_count);
        case 'activity': default: return b.last_activity_at.localeCompare(a.last_activity_at);
      }
    });
    return sorted;
  }, [rows, filter, query, sort]);

  const columns: Column<OwnerCustomerListRow>[] = [
    {
      key: 'name',
      header: 'Kunde',
      sortValue: (c) => customerDisplayName(c),
      render: (c) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] border border-[var(--cq-border)] bg-[var(--cq-sunken)] text-[10.5px] font-semibold tracking-tight text-[var(--cq-fg-muted)]"
          >
            {initials(c)}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold text-[var(--cq-fg)]">{customerDisplayName(c)}</span>
            <span className="block truncate text-[12px] text-[var(--cq-fg-subtle)]">
              {[c.contact_name && c.company ? c.contact_name : null, c.city].filter(Boolean).join(' · ') || '—'}
            </span>
          </span>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Kontakt',
      hideOnMobile: true,
      render: (c) => (
        <div className="min-w-0">
          <div className="truncate text-[var(--cq-fg-muted)]">{c.email ?? '—'}</div>
          <div className="truncate text-[12px] text-[var(--cq-fg-subtle)] tabular-nums">
            {c.offer_count} Angebote · {c.invoice_count} Rechnungen
          </div>
        </div>
      ),
    },
    {
      key: 'revenue',
      header: 'Fakturiert',
      align: 'right',
      sortValue: (c) => c.revenue_gross_cents,
      render: (c) => (
        <span className={c.revenue_gross_cents > 0 ? 'font-medium text-[var(--cq-fg)]' : 'text-[var(--cq-fg-subtle)]'}>
          {formatCentsCurrencyDe(c.revenue_gross_cents)}
        </span>
      ),
    },
    {
      key: 'work',
      header: 'Offen',
      sortValue: (c) => c.open_task_count + c.open_invoice_count,
      render: (c) => {
        if (c.open_task_count === 0 && c.open_invoice_count === 0) {
          return <span className="whitespace-nowrap text-[12px] text-[var(--cq-fg-subtle)]">nichts offen</span>;
        }
        return (
          <div className="whitespace-nowrap text-[12.5px] leading-4">
            {c.open_task_count > 0 ? (
              <div className="font-medium text-amber-700 tabular-nums">
                {c.open_task_count} {c.open_task_count === 1 ? 'Aufgabe' : 'Aufgaben'}
              </div>
            ) : null}
            {c.open_invoice_count > 0 ? (
              <div className="text-[var(--cq-fg-muted)] tabular-nums">
                {c.open_invoice_count} {c.open_invoice_count === 1 ? 'Rechnung' : 'Rechnungen'}
              </div>
            ) : null}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      // Already carried by the mobile card's title, so it is not repeated as a field.
      hideOnCard: true,
      render: (c) => (
        <span className="whitespace-nowrap">
          <StatusBadge label={customerStatusLabel[c.status]} tone={customerStatusTone[c.status]} />
        </span>
      ),
    },
    {
      key: 'activity',
      header: 'Letzte Aktivität',
      align: 'right',
      hideOnMobile: true,
      sortValue: (c) => c.last_activity_at,
      render: (c) => <span className="whitespace-nowrap text-[var(--cq-fg-subtle)]">{formatDateDe(c.last_activity_at)}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      sticky: true,
      hideOnCard: true,
      render: (c) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {c.status === 'archived' ? (
            <IconButton icon={RotateCcw} label={`${customerDisplayName(c)} wiederherstellen`} variant="ghost" onClick={() => void runRestore(c)} />
          ) : (
            <IconButton icon={Archive} label={`${customerDisplayName(c)} archivieren`} variant="ghost" onClick={() => setPendingArchive(c)} />
          )}
          <IconButton icon={Trash2} label={`${customerDisplayName(c)} löschen`} variant="ghost" onClick={() => void askDelete(c)} />
        </div>
      ),
    },
  ];

  return (
    <>
      <WorkspaceHeader
        eyebrow="Kunden"
        title="Kundenstamm"
        subtitle="Die kaufmännische Kundenidentität, auf die Angebote, Rechnungen, Zahlungen und Aufgaben verweisen."
        actions={<Button icon={Plus} onClick={() => setCreateOpen(true)} disabled={!entity}>Neuer Kunde</Button>}
        toolbar={
          !loading && rows.length > 0 ? (
            <Toolbar
              trailing={
                <>
                  <SearchInput
                    value={query}
                    onChange={setQuery}
                    label="Kunden durchsuchen"
                    placeholder="Firma, Kontakt, Ort, E-Mail …"
                    className="w-full sm:w-72"
                  />
                  <div className="w-full sm:w-52">
                    <Select
                      id="sort"
                      value={sort}
                      onChange={(v) => { setSort(v as SortKey); setTableSort(null); }}
                      options={[
                        { value: 'activity', label: 'Letzte Aktivität' },
                        { value: 'work', label: 'Meiste offene Arbeit' },
                        { value: 'revenue', label: 'Höchster Umsatz' },
                        { value: 'name', label: 'Name (A–Z)' },
                        { value: 'created', label: 'Zuletzt angelegt' },
                      ]}
                    />
                  </div>
                </>
              }
            >
              <FilterChips
                label="Kunden filtern"
                value={filter}
                onChange={setFilter}
                options={FILTERS.map((f) => ({ value: f.value, label: f.label, count: counts[f.value] }))}
              />
            </Toolbar>
          ) : undefined
        }
      />

      {error ? <div className="mb-4"><ErrorState message={error} onRetry={() => void load()} /></div> : null}

      <div className="space-y-4">
        {loading ? <StatBandSkeleton count={5} /> : rows.length > 0 ? <StatBand items={stats} /> : null}

        {loading ? <TableSkeleton rows={6} cols={6} /> : rows.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Noch keine Kunden angelegt"
            description={
              'Dies ist der zentrale Kundenstamm: Kunden, die Sie hier anlegen, stehen sofort im '
              + 'Finanzbereich zur Auswahl, und Kunden, die Sie beim Erstellen eines Angebots oder '
              + 'einer Rechnung anlegen, erscheinen sofort hier. Es ist derselbe Datensatz. '
              + 'Portalzugang und Kundendokumente verwalten Sie unter „Portalzugänge".'
            }
            action={
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button icon={Plus} onClick={() => setCreateOpen(true)} disabled={!entity}>Neuer Kunde</Button>
                <Button variant="secondary" onClick={() => navigate('/admin/clients')}>Zu den Portalzugängen</Button>
              </div>
            }
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Keine Treffer"
            description={query
              ? `Kein Kunde passt zu „${query}" im Filter „${FILTERS.find((f) => f.value === filter)?.label}".`
              : 'In diesem Filter liegt gerade kein Kunde.'}
            action={
              <div className="flex flex-wrap items-center justify-center gap-2">
                {query ? <Button variant="secondary" onClick={() => setQuery('')}>Suche zurücksetzen</Button> : null}
                {filter !== 'all' ? <Button variant="secondary" onClick={() => setFilter('all')}>Alle Kunden zeigen</Button> : null}
              </div>
            }
          />
        ) : (
          <DataTable
            columns={columns}
            rows={visible}
            getRowKey={(c) => c.id}
            minWidth={880}
            sort={tableSort}
            onSortChange={setTableSort}
            rowHref={(c) => `/admin/finance/customers/${c.id}`}
            onRowClick={(c) => navigate(`/admin/finance/customers/${c.id}`)}
            mobileTitle={(c) => (
              <div className="flex items-center gap-2">
                <span>{customerDisplayName(c)}</span>
                <StatusBadge label={customerStatusLabel[c.status]} tone={customerStatusTone[c.status]} />
              </div>
            )}
            mobileSubtitle={(c) => [c.city, c.email].filter(Boolean).join(' · ') || '—'}
          />
        )}
      </div>

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
              <span className="font-semibold text-[var(--cq-fg)]">
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
                <span className="font-semibold text-[var(--cq-fg)]">{customerDisplayName(pendingDelete.row)}</span>{' '}
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
                <span className="font-semibold text-[var(--cq-fg)]">
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
