import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileUp, FolderInput, Plus, Receipt, Trash2 } from 'lucide-react';

import {
  Button, Card, Checkbox, DataTable, EmptyState, ErrorState, FilterChips, IconButton,
  InfoBanner, Modal, SearchInput, SectionHeader, SlideOver, StatBand, StatBandSkeleton, StatusBadge,
  TableSkeleton, Field, Select, Textarea, Toolbar, WorkspaceHeader, useToast,
  type Column, type SortDirection, type StatItem,
} from '@/components/dashboard';
import {
  MoveToFolderDialog, RowOrganizeMenu, TrashRowActions, WorkspaceBulkBar, WorkspaceDeleteDialog,
  WorkspaceFolderContextHeader, WorkspaceFolderOverview,
  emptyFolderCopy, restoreFromTrash, useTrashPlans, useWorkspaceOrganization,
} from '@/components/finance/workspaceOrganizationUi';
import {
  FOLDER_TRASH, filterByFolder, folderCounts,
} from '@/lib/ownerFinance/workspaceOrganization';
import { expenseReviewTone, paymentStatusTone } from '@/pages/owner/ownerUi';
import { useCreateIntent } from '@/pages/admin/routeIntent';
import { useOwnerEntity } from '@/pages/owner/ownerContext';
import {
  createOwnerExpense, describeSupabaseError, loadCategories, loadExpenses, loadVendors,
  markExpenseReviewed, recordExpensePayment,
  type ExpenseLineInput,
} from '@/lib/ownerFinance/api';
import { loadAdminClients } from '@/lib/clientPlatform/adminApi';
import { computeExpenseLine, eligibleInputVat } from '@/lib/ownerFinance/tax';
import {
  applyVendorResolutions, expenseImportTemplate, parseExpenseBulkImport,
  type ExpenseImportPreview,
} from '@/lib/ownerFinance/expenseBulkImport';
import {
  OWNER_EXPENSE_IMPORT_MIGRATION, resolveImportVendors, runExpenseBulkImport,
} from '@/lib/ownerFinance/financeExtendedApi';
import { formatCents, parseAmountToCents } from '@/lib/clientPlatform/validation';
import { formatDateDe } from '@/lib/ownerFinance/exports';
import type { OwnerExpense, OwnerExpenseCategory, OwnerVendor } from '@/lib/ownerFinance/types';
import { ExportMenu } from '@/components/finance/ExportMenu';
import { runFinanceExport } from '@/lib/ownerFinance/financeExportRunner';
import {
  expenseExportTable, expenseReportModel, expenseMetadataSheet,
} from '@/lib/ownerFinance/exports/datasets';
import type { ExportFormat, ExportMode, ExportMeta } from '@/lib/ownerFinance/exports';

const expenseTreatments = [
  { value: 'domestic_standard', label: 'Inland Vorsteuer 19 %' },
  { value: 'domestic_reduced', label: 'Inland Vorsteuer 7 %' },
  { value: 'no_vat', label: 'Ohne USt' },
  { value: 'exempt', label: 'Steuerfrei' },
  { value: 'reverse_charge_13b', label: 'Reverse Charge §13b' },
  { value: 'intra_community', label: 'Innergem. Erwerb' },
  { value: 'outside_scope', label: 'Nicht steuerbar' },
  { value: 'unknown', label: 'Prüfung erforderlich' },
];

const reviewLabel: Record<string, string> = { reviewed: 'Geprüft', pending: 'Offen', needs_info: 'Info nötig' };
const paymentLabel: Record<string, string> = { unpaid: 'Unbezahlt', partially_paid: 'Teilbezahlt', paid: 'Bezahlt', void: 'Storniert' };

function rateForTreatment(t: string): number {
  return t === 'domestic_reduced' ? 700 : ['domestic_standard', 'reverse_charge_13b', 'intra_community'].includes(t) ? 1900 : 0;
}
function toCents(input: string): number | null {
  const p = parseAmountToCents(input);
  return 'error' in p ? null : p.cents;
}
function bp(v: string): number { return Math.round((Number(v.replace(',', '.')) || 0) * 100); }

interface CustomerOption { organizationId: string; clientAccountId: string | null; name: string }

export function ExpensesPage() {
  const { entity } = useOwnerEntity();
  const toast = useToast();
  const [expenses, setExpenses] = useState<OwnerExpense[]>([]);
  const [categories, setCategories] = useState<OwnerExpenseCategory[]>([]);
  const [vendors, setVendors] = useState<OwnerVendor[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  // ⌘K's create action navigates here with ?create=1; this opens the dialog this page
  // already owns. Without the intent nothing opens — the plain list URL stays a list.
  useCreateIntent(() => setComposerOpen(true));
  const [payFor, setPayFor] = useState<OwnerExpense | null>(null);
  const [filter, setFilter] = useState('all');
  // Folders, Papierkorb and the delete path. Organisation only — nothing here reaches
  // the EÜR, the Vorsteuer or a payment. See lib/ownerFinance/workspaceOrganization.
  const org = useWorkspaceOrganization(entity?.id ?? null, 'expense');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [moveTargets, setMoveTargets] = useState<string[]>([]);
  const [deleteTargets, setDeleteTargets] = useState<string[]>([]);
  const [purgeTarget, setPurgeTarget] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [tableSort, setTableSort] = useState<{ key: string; direction: SortDirection } | null>(null);
  const [includeIds, setIncludeIds] = useState(false);

  const load = useCallback(async () => {
    if (!entity) return;
    setLoading(true);
    try {
      const [ex, cats, vend, clients] = await Promise.all([
        loadExpenses(entity.id), loadCategories(), loadVendors().catch(() => []), loadAdminClients().catch(() => []),
      ]);
      setExpenses(ex); setCategories(cats); setVendors(vend);
      setCustomers(clients.map((c) => ({ organizationId: c.organizationId, clientAccountId: c.account?.id ?? null, name: c.organizationName })));
      setError(null);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, [entity]);

  useEffect(() => { void load(); }, [load]);

  const counts = useMemo(() => ({
    all: expenses.length,
    review: expenses.filter((e) => e.review_status !== 'reviewed').length,
    unpaid: expenses.filter((e) => e.payment_status === 'unpaid').length,
    paid: expenses.filter((e) => e.payment_status === 'paid').length,
  }), [expenses]);

  const catLabelFor = useCallback(
    (id: string | null) => categories.find((c) => c.id === id)?.label ?? '—',
    [categories],
  );

  const filtered = useMemo(() => {
    let rows = expenses;
    if (filter === 'review') rows = rows.filter((e) => e.review_status !== 'reviewed');
    else if (filter === 'unpaid') rows = rows.filter((e) => e.payment_status === 'unpaid');
    else if (filter === 'paid') rows = rows.filter((e) => e.payment_status === 'paid');
    const q = query.trim().toLowerCase();
    // Over what the row prints: category, supplier reference and the amount.
    if (q) {
      rows = rows.filter((e) => [
        catLabelFor(e.category_id),
        e.supplier_invoice_number,
        e.notes,
        formatCents(e.net_total_cents, e.currency),
      ].some((v) => (v ?? '').toLowerCase().includes(q)));
    }
    // The folder composes with status and search rather than replacing either: this is the
    // intersection of all three, and changing the folder never resets the other two.
    return filterByFolder(rows, (e) => e.id, org.state, org.view);
  }, [expenses, filter, query, catLabelFor, org.state, org.view]);

  const folderRailCounts = useMemo(
    () => folderCounts(expenses, (e) => e.id, org.state),
    [expenses, org.state],
  );

  const inTrash = org.view === FOLDER_TRASH;

  /**
   * Folder-first: with no folder open the page shows FOLDERS, not records.
   *
   * The one exception is a workspace with nothing in it at all — no records and no folders.
   * There is nothing to organise there, so the page keeps its existing first-run empty state
   * with its create action rather than presenting three empty system tiles.
   */
  const showFolderOverview = !loading && org.isOverview
    && (expenses.length > 0 || org.state.folders.length > 0);
  const showRecords = !showFolderOverview;

  // An empty CUSTOM folder says so, rather than borrowing the page's "no match" wording.
  const folderEmpty = emptyFolderCopy(org, folderRailCounts);
  const trashPlans = useTrashPlans('expense', inTrash ? filtered.map((e) => e.id) : [], inTrash);

  // A selection only ever means what is currently on screen.
  useEffect(() => { setSelected(new Set()); }, [org.view, filter]);
  const visibleSelected = useMemo(
    () => filtered.filter((e) => selected.has(e.id)).map((e) => e.id),
    [filtered, selected],
  );

  const totals = useMemo(() => ({
    net: expenses.reduce((s, e) => s + e.net_total_cents, 0),
    inputVat: expenses.reduce((s, e) => s + e.input_vat_cents, 0),
    unpaid: expenses.filter((e) => e.payment_status !== 'paid' && e.payment_status !== 'void').reduce((s, e) => s + (e.gross_total_cents - e.amount_paid_cents), 0),
  }), [expenses]);

  const catLabel = catLabelFor;
  const vendorName = useCallback((e: OwnerExpense): string => vendors.find((v) => v.id === e.vendor_id)?.name ?? '—', [vendors]);

  const filterLabel = filter === 'all' ? 'Alle' : filter === 'review' ? 'Prüfung offen' : filter === 'unpaid' ? 'Offen' : 'Bezahlt';

  const runExport = async (format: ExportFormat, mode: ExportMode) => {
    if (!entity) return;
    const rows = mode === 'all' ? expenses : filtered;
    const meta: ExportMeta = {
      entityName: entity.display_name, valueBasis: 'actual',
      filtersLabel: mode === 'all' ? 'Alle' : filterLabel, mode,
    };
    const spec = {
      entityId: entity.id,
      exportType: 'expenses',
      baseFilename: 'Ausgaben',
      meta,
      table: expenseExportTable(rows, vendorName) as never,
      metadataSheet: expenseMetadataSheet(rows, meta),
      reportModel: expenseReportModel(rows, meta, vendorName),
      jsonPayload: { expenses: rows },
      snapshot: rows.map((r) => ({ id: r.id, status: r.payment_status, net: r.net_total_cents, gross: r.gross_total_cents })),
      counts: { expenses: rows.length },
      includeIds,
    };
    try {
      const { warning } = await runFinanceExport(format, mode, spec);
      if (warning) toast.error('Hinweis zum Export', warning);
      else toast.success('Export erstellt', `${format.toUpperCase()} · ${rows.length} Ausgaben`);
    } catch (e: unknown) {
      toast.error('Export fehlgeschlagen', e instanceof Error ? e.message : String(e));
    }
  };

  const columns: Column<OwnerExpense>[] = [
    {
      key: 'cat',
      header: 'Ausgabe',
      sortValue: (e) => catLabel(e.category_id),
      render: (e) => (
        <div className="min-w-0">
          <div className="truncate font-semibold text-[var(--cq-fg)]">{catLabel(e.category_id)}</div>
          <div className="truncate text-[12px] text-[var(--cq-fg-subtle)]">
            {[e.invoice_date ? formatDateDe(e.invoice_date) : 'ohne Datum', e.supplier_invoice_number].filter(Boolean).join(' · ')}
          </div>
        </div>
      ),
    },
    {
      key: 'net',
      header: 'Netto',
      align: 'right',
      sortValue: (e) => e.net_total_cents,
      render: (e) => <span className="whitespace-nowrap font-medium text-[var(--cq-fg)]">{formatCents(e.net_total_cents, e.currency)}</span>,
    },
    {
      key: 'vat',
      header: 'Vorsteuer',
      align: 'right',
      hideOnMobile: true,
      sortValue: (e) => e.input_vat_cents,
      render: (e) => <span className="whitespace-nowrap text-[var(--cq-fg-muted)]">{formatCents(e.input_vat_cents, e.currency)}</span>,
    },
    {
      key: 'pay',
      header: 'Zahlung',
      sortValue: (e) => e.payment_status,
      render: (e) => (
        <span className="whitespace-nowrap">
          <StatusBadge label={paymentLabel[e.payment_status] ?? e.payment_status} tone={paymentStatusTone[e.payment_status]} />
        </span>
      ),
    },
    {
      key: 'review',
      header: 'Prüfung',
      sortValue: (e) => e.review_status,
      render: (e) => (
        <span className="whitespace-nowrap">
          <StatusBadge label={reviewLabel[e.review_status] ?? e.review_status} tone={expenseReviewTone[e.review_status]} />
        </span>
      ),
    },
    {
      key: 'actions', header: '', align: 'right', sticky: true, hideOnCard: true, render: (e) => (
        <div className="flex justify-end gap-1.5" onClick={(ev) => ev.stopPropagation()}>
          {inTrash ? (
            <TrashRowActions
              plan={trashPlans[e.id]}
              onRestore={() => void restore([e.id])}
              onPurge={() => setPurgeTarget(e.id)}
            />
          ) : (
            <>
              {e.payment_status !== 'paid' && e.payment_status !== 'void' ? <Button size="sm" variant="secondary" onClick={() => setPayFor(e)}>Zahlung</Button> : null}
              {e.review_status !== 'reviewed' ? <Button size="sm" variant="ghost" onClick={() => void markReviewed(e)}>Geprüft</Button> : null}
              {/*
                "Löschen" is offered on EVERY row, and the server decides what it means. An
                unpaid receipt with no linked payment or document is genuinely deleted —
                including one that was marked "Geprüft" by mistake, which previously left the
                owner editing the database by hand. Anything with a real dependency is moved
                to the Papierkorb instead, and the confirmation says so before it happens.
              */}
              <RowOrganizeMenu
                label={`${catLabel(e.category_id)} organisieren`}
                items={[
                  { key: 'move', label: 'In Ordner verschieben', icon: FolderInput, onSelect: () => setMoveTargets([e.id]) },
                  { key: 'delete', label: 'Löschen', icon: Trash2, tone: 'danger', onSelect: () => setDeleteTargets([e.id]) },
                ]}
              />
            </>
          )}
        </div>
      ),
    },
  ];

  const stats: StatItem[] = [
    {
      key: 'net',
      label: 'Betriebsausgaben (netto)',
      value: formatCents(totals.net),
      hint: 'erfasste Belege im Geschäftsjahr',
      lead: true,
    },
    { key: 'vat', label: 'Vorsteuer erfasst', value: formatCents(totals.inputVat), hint: 'abziehbar laut USt-Behandlung' },
    {
      key: 'unpaid',
      label: 'Offen (unbezahlt)',
      value: formatCents(totals.unpaid),
      hint: counts.unpaid ? `${counts.unpaid} Belege` : 'nichts offen',
      tone: totals.unpaid > 0 ? 'attention' : 'neutral',
    },
    {
      key: 'review',
      label: 'Prüf-Queue',
      value: String(counts.review),
      hint: 'Belege oder Zuordnung fehlen',
      tone: counts.review > 0 ? 'attention' : 'neutral',
    },
  ];

  const restore = async (ids: string[]) => {
    const { error: err } = await restoreFromTrash(org, ids);
    if (err) { toast.error('Wiederherstellen fehlgeschlagen', 'Bitte erneut versuchen.'); return; }
    setSelected(new Set());
    toast.success(ids.length === 1 ? 'Wiederhergestellt' : `${ids.length} wiederhergestellt`);
  };

  const markReviewed = async (e: OwnerExpense) => {
    const { error: err } = await markExpenseReviewed(e.id);
    if (err) { toast.error('Aktualisierung fehlgeschlagen', err); return; }
    toast.success('Als geprüft markiert');
    void load();
  };

  return (
    <>
      <WorkspaceHeader
        eyebrow="Kosten"
        title="Ausgaben"
        subtitle="Betriebsausgaben mit USt-Behandlung, Vorsteuer-Abzugsfähigkeit und Betriebsanteil. Ausländische SaaS-Rechnungen werden nicht automatisch als voll abziehbar klassifiziert."
        actions={
          <>
            <ExportMenu
              onExport={runExport}
              disabled={!entity || expenses.length === 0}
              includeIds={includeIds}
              onIncludeIdsChange={setIncludeIds}
              modes={[
                { value: 'current', label: 'Aktuelle Ansicht', count: filtered.length },
                { value: 'all', label: 'Alle Ausgaben', count: expenses.length },
              ]}
            />
            {/* Page-level import action. It sits beside "Ausgabe erfassen" in the header rather
                than inside the list, so it stays reachable from the folder overview too. */}
            <Button variant="secondary" icon={FileUp} onClick={() => setImportOpen(true)} disabled={!entity}>Schnellimport</Button>
            <Button icon={Plus} onClick={() => setComposerOpen(true)} disabled={!entity}>Ausgabe erfassen</Button>
          </>
        }
        toolbar={
          !loading && !org.isOverview && expenses.length > 0 ? (
            <Toolbar
              trailing={
                <SearchInput
                  value={query}
                  onChange={setQuery}
                  label="Ausgaben durchsuchen"
                  placeholder="Kategorie, Belegnummer …"
                  className="w-full sm:w-64"
                />
              }
            >
              <FilterChips
                label="Ausgaben filtern"
                value={filter}
                onChange={setFilter}
                options={[
                  { value: 'all', label: 'Alle', count: counts.all },
                  { value: 'review', label: 'Prüf-Queue', count: counts.review },
                  { value: 'unpaid', label: 'Unbezahlt', count: counts.unpaid },
                  { value: 'paid', label: 'Bezahlt', count: counts.paid },
                ]}
              />
            </Toolbar>
          ) : undefined
        }
      />

      {error ? <div className="mb-4"><ErrorState message={error} onRetry={() => void load()} /></div> : null}

      <div className="space-y-4">
        {loading ? <StatBandSkeleton count={4} /> : expenses.length > 0 ? <StatBand items={stats} /> : null}

        {showFolderOverview ? (
          <WorkspaceFolderOverview
            org={org}
            counts={folderRailCounts}
            resourceLabel="Belege"
            resourcePlural="Belege"
          />
        ) : null}

        {showRecords && !org.isOverview && !loading ? (
          <WorkspaceFolderContextHeader
            org={org}
            counts={folderRailCounts}
            resourceLabel="Belege"
            backLabel="Ausgaben"
          />
        ) : null}

        {showRecords ? (
        <>
        <WorkspaceBulkBar
          count={visibleSelected.length}
          onMove={() => setMoveTargets(visibleSelected)}
          onDelete={() => setDeleteTargets(visibleSelected)}
          onClear={() => setSelected(new Set())}
        />

        {loading ? <TableSkeleton rows={5} cols={6} /> : filtered.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={
              folderEmpty ? folderEmpty.title
                : expenses.length === 0 ? 'Noch keine Ausgaben'
                : inTrash ? 'Papierkorb ist leer'
                : query ? 'Keine Treffer'
                : 'Keine Ausgaben in dieser Ansicht'
            }
            description={
              folderEmpty ? folderEmpty.description
                : expenses.length === 0
                ? 'Erfassen Sie Betriebsausgaben, um Vorsteuer und EÜR-Ergebnis zu berechnen.'
                : inTrash
                  ? 'Hier liegen Belege, die Sie aus dem Arbeitsbereich entfernt haben. Sie bleiben in Buchhaltung und Historie erhalten.'
                  : query
                    ? `Kein Beleg passt zu „${query}".`
                    : 'Passen Sie Filter oder Ordner an, um weitere Ausgaben zu sehen.'
            }
            action={
              expenses.length === 0
                ? <Button icon={Plus} onClick={() => setComposerOpen(true)} disabled={!entity}>Ausgabe erfassen</Button>
                : query
                  ? <Button variant="secondary" onClick={() => setQuery('')}>Suche zurücksetzen</Button>
                  : <Button variant="secondary" onClick={() => setFilter('all')}>Alle Ausgaben zeigen</Button>
            }
          />
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            getRowKey={(e) => e.id}
            minWidth={780}
            selection={{
              selectedKeys: selected,
              onToggle: (key, next) => setSelected((prev) => {
                const updated = new Set(prev);
                if (next) updated.add(key); else updated.delete(key);
                return updated;
              }),
              onToggleAll: (keys, next) => setSelected(next ? new Set(keys) : new Set()),
              rowLabel: (e) => `${catLabel(e.category_id)} auswählen`,
            }}
            sort={tableSort}
            onSortChange={setTableSort}
            mobileTitle={(e) => <span>{catLabel(e.category_id)}</span>}
            mobileSubtitle={(e) => [e.invoice_date ? formatDateDe(e.invoice_date) : 'ohne Datum', e.supplier_invoice_number].filter(Boolean).join(' · ')}
          />
        )}
        </>
        ) : null}
      </div>

      {entity ? (
        <ExpenseComposer
          open={composerOpen}
          entityId={entity.id}
          categories={categories}
          vendors={vendors}
          customers={customers}
          onClose={() => setComposerOpen(false)}
          onSaved={() => { setComposerOpen(false); toast.success('Ausgabe gespeichert'); void load(); }}
          onError={(m) => toast.error('Ausgabe konnte nicht gespeichert werden', m)}
        />
      ) : null}

      <ExpensePaymentDialog
        expense={payFor}
        onClose={() => setPayFor(null)}
        onDone={() => { setPayFor(null); toast.success('Zahlung erfasst'); void load(); }}
        onError={(m) => toast.error('Zahlung fehlgeschlagen', m)}
      />

      <MoveToFolderDialog
        open={moveTargets.length > 0}
        org={org}
        resourceIds={moveTargets}
        onClose={() => setMoveTargets([])}
        onDone={() => setSelected(new Set())}
      />

      <WorkspaceDeleteDialog
        open={deleteTargets.length > 0}
        org={org}
        resourceIds={deleteTargets}
        resourceSingular="Beleg"
        resourcePlural="Belege"
        onClose={() => setDeleteTargets([])}
        onDone={() => { setSelected(new Set()); void load(); }}
      />

      {/* The Papierkorb's permanent delete. The server re-runs the preflight and still refuses
          anything that must be retained, so this can never become a bypass. */}
      <WorkspaceDeleteDialog
        open={Boolean(purgeTarget)}
        org={org}
        mode="purge"
        resourceIds={purgeTarget ? [purgeTarget] : []}
        resourceSingular="Beleg"
        resourcePlural="Belege"
        onClose={() => setPurgeTarget(null)}
        onDone={() => { setSelected(new Set()); void load(); }}
      />

      <ExpenseImportModal
        open={importOpen}
        entityId={entity?.id ?? null}
        // Only real keys are passed: an environment whose category rows predate the `key`
        // column would otherwise hand the parser a list of undefineds and make every valid
        // category look unknown. An empty list means "defer key validation to the server",
        // which is authoritative either way.
        categoryKeys={categories.map((c) => c.key).filter((k): k is string => typeof k === 'string' && k.length > 0)}
        onClose={() => setImportOpen(false)}
        onDone={(msg) => { setImportOpen(false); toast.success('Import abgeschlossen', msg); void load(); }}
        onError={(msg) => toast.error('Import fehlgeschlagen', msg)}
      />

    </>
  );
}

/* ------------------------------------------------------------------ Composer */

interface DraftLine {
  id: string; description: string; net: string; treatment: string; eligibility: string; deductibility: string; assetCandidate: boolean;
}
function newLine(): DraftLine {
  return { id: Math.random().toString(36).slice(2), description: '', net: '', treatment: 'domestic_standard', eligibility: '100', deductibility: '100', assetCandidate: false };
}

function ExpenseComposer({ open, entityId, categories, vendors, customers, onClose, onSaved, onError }: {
  open: boolean;
  entityId: string;
  categories: OwnerExpenseCategory[];
  vendors: OwnerVendor[];
  customers: CustomerOption[];
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [vendorId, setVendorId] = useState('');
  const [supplierNumber, setSupplierNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(today);
  const [dueDate, setDueDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([newLine()]);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const reset = () => {
    setVendorId(''); setSupplierNumber(''); setInvoiceDate(today); setDueDate(''); setCategoryId('');
    setCustomerId(''); setNotes(''); setLines([newLine()]); setFormError(null);
  };

  const computed = useMemo(() => lines.map((l) => {
    const net = toCents(l.net);
    if (net == null) return { line: l, calc: null };
    const vat = computeExpenseLine(net, rateForTreatment(l.treatment), l.treatment as never);
    const eligibleVat = eligibleInputVat(vat.vatCents, bp(l.eligibility));
    const deductibleNet = Math.round((net * bp(l.deductibility)) / 10000);
    return { line: l, calc: { net, vat: vat.vatCents, gross: vat.grossCents, eligibleVat, deductibleNet } };
  }), [lines]);

  const totals = useMemo(() => computed.reduce((a, { calc }) => calc ? {
    net: a.net + calc.net, eligibleVat: a.eligibleVat + calc.eligibleVat, deductibleNet: a.deductibleNet + calc.deductibleNet, gross: a.gross + calc.gross,
  } : a, { net: 0, eligibleVat: 0, deductibleNet: 0, gross: 0 }), [computed]);

  const hasUnknown = lines.some((l) => l.treatment === 'unknown');
  const hasAsset = lines.some((l) => l.assetCandidate);
  const hasPartialPrivate = lines.some((l) => bp(l.deductibility) < 10000 && bp(l.deductibility) > 0);

  const updateLine = (id: string, patch: Partial<DraftLine>) => setLines((c) => c.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const save = async () => {
    setFormError(null);
    const valid = computed.filter(({ line, calc }) => line.description.trim() && calc != null);
    if (valid.length === 0) { setFormError('Mindestens eine vollständige Position (Beschreibung + Netto) ist erforderlich.'); return; }
    setBusy(true);
    const cat = categories.find((c) => c.id === categoryId);
    const customer = customers.find((c) => c.organizationId === customerId) ?? null;
    const header: Record<string, unknown> = {
      business_entity_id: entityId,
      vendor_id: vendorId || null,
      supplier_invoice_number: supplierNumber.trim() || null,
      invoice_date: invoiceDate || null,
      due_date: dueDate || null,
      category_id: categoryId || null,
      organization_id: customer?.organizationId ?? null,
      client_account_id: customer?.clientAccountId ?? null,
      review_status: hasUnknown ? 'needs_info' : 'pending',
      notes: notes.trim() || null,
    };
    const lineInputs: ExpenseLineInput[] = valid.map(({ line }) => ({
      description: line.description.trim(),
      net_cents: toCents(line.net) ?? 0,
      vat_rate_bp: rateForTreatment(line.treatment),
      vat_treatment: line.treatment,
      category_id: categoryId || null,
      input_vat_eligibility_bp: bp(line.eligibility),
      deductibility_bp: bp(line.deductibility),
      asset_candidate: line.assetCandidate || (cat?.asset_review_default ?? false),
    }));
    const { error } = await createOwnerExpense(header, lineInputs);
    setBusy(false);
    if (error) { onError(error); return; }
    reset();
    onSaved();
  };

  return (
    <SlideOver
      open={open}
      onClose={busy ? () => {} : onClose}
      title="Ausgabe erfassen"
      description="Steuerliche Wirkung wird vor dem Speichern angezeigt. Die Ausgabe wird zunächst als unbezahlt erfasst."
      width="xl"
      footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Abbrechen</Button><Button onClick={() => void save()} loading={busy}>Ausgabe speichern</Button></>}
    >
      <div className="space-y-6">
        <Card className="p-5">
          <SectionHeader title="Belegkopf" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select id="vendor" label="Lieferant" value={vendorId} onChange={setVendorId} options={[{ value: '', label: '— Kein Lieferant —' }, ...vendors.map((v) => ({ value: v.id, label: v.name }))]} hint={vendors.length === 0 ? 'Noch keine Lieferanten hinterlegt' : undefined} />
            <Field id="supNum" label="Rechnungsnummer (Lieferant)" value={supplierNumber} onChange={setSupplierNumber} placeholder="z. B. INV-2026-88" />
            <Field id="invDate" label="Rechnungsdatum" type="date" value={invoiceDate} onChange={setInvoiceDate} />
            <Field id="dueDate" label="Fällig am" type="date" value={dueDate} onChange={setDueDate} />
            <Select id="cat" label="Kategorie" value={categoryId} onChange={setCategoryId} options={[{ value: '', label: '— Keine Kategorie —' }, ...categories.map((c) => ({ value: c.id, label: c.label }))]} />
            <Select id="alloc" label="Projekt / Kunde (optional)" value={customerId} onChange={setCustomerId} options={[{ value: '', label: '— Keine Zuordnung —' }, ...customers.map((c) => ({ value: c.organizationId, label: c.name }))]} />
          </div>
        </Card>

        <Card className="p-5">
          <SectionHeader title="Positionen" action={<Button size="sm" variant="secondary" icon={Plus} onClick={() => setLines((c) => [...c, newLine()])}>Position</Button>} />
          <div className="space-y-3">
            {computed.map(({ line, calc }, idx) => (
              <div key={line.id} className="rounded-xl border border-gray-100 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Position {idx + 1}</span>
                  {lines.length > 1 ? <IconButton icon={Trash2} label="Position entfernen" variant="ghost" onClick={() => setLines((c) => c.filter((x) => x.id !== line.id))} /> : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-12">
                  <div className="sm:col-span-12"><Field id={`edesc-${line.id}`} label="Beschreibung" value={line.description} onChange={(v) => updateLine(line.id, { description: v })} /></div>
                  <div className="sm:col-span-3"><Field id={`enet-${line.id}`} label="Netto" prefix="€" value={line.net} onChange={(v) => updateLine(line.id, { net: v })} inputMode="decimal" placeholder="42,00" /></div>
                  <div className="sm:col-span-5"><Select id={`etreat-${line.id}`} label="USt-Behandlung" value={line.treatment} onChange={(v) => updateLine(line.id, { treatment: v })} options={expenseTreatments} /></div>
                  <div className="sm:col-span-2"><Field id={`eelig-${line.id}`} label="Vorsteuer %" value={line.eligibility} onChange={(v) => updateLine(line.id, { eligibility: v })} inputMode="decimal" /></div>
                  <div className="sm:col-span-2"><Field id={`ededuct-${line.id}`} label="Betriebl. %" value={line.deductibility} onChange={(v) => updateLine(line.id, { deductibility: v })} inputMode="decimal" /></div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <Checkbox id={`asset-${line.id}`} label="Möglicher Anlagewert (Abschreibung prüfen)" checked={line.assetCandidate} onChange={(v) => updateLine(line.id, { assetCandidate: v })} />
                  {calc ? (
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-gray-500">
                      <span>Vorsteuer <span className="font-semibold tabular-nums text-gray-700">{formatCents(calc.eligibleVat)}</span></span>
                      <span>abziehbar netto <span className="font-semibold tabular-nums text-gray-700">{formatCents(calc.deductibleNet)}</span></span>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <SectionHeader title="Steuerliche Wirkung & Notizen" />
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3"><p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">Netto gesamt</p><p className="mt-1 text-lg font-semibold tabular-nums text-gray-950">{formatCents(totals.net)}</p></div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3"><p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">Abziehbare Vorsteuer</p><p className="mt-1 text-lg font-semibold tabular-nums text-gray-950">{formatCents(totals.eligibleVat)}</p></div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3"><p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">Betriebsausgabe (netto)</p><p className="mt-1 text-lg font-semibold tabular-nums text-gray-950">{formatCents(totals.deductibleNet)}</p></div>
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            {hasUnknown ? <StatusBadge label="Prüfung erforderlich" tone="warning" /> : null}
            {hasAsset ? <StatusBadge label="Möglicher Anlagewert" tone="info" /> : null}
            {hasPartialPrivate ? <StatusBadge label="Teilweise privat" tone="warning" /> : null}
          </div>
          <Textarea id="enotes" label="Notizen (optional)" value={notes} onChange={setNotes} rows={2} />
          <InfoBanner tone="info" title="Belege">Belege können nach dem Speichern unter „Dokumente" hochgeladen und verknüpft werden.</InfoBanner>
          {formError ? <p className="mt-3 text-[13px] text-red-600">{formError}</p> : null}
        </Card>
      </div>
    </SlideOver>
  );
}

/* ------------------------------------------------------------------ Payment */

function ExpensePaymentDialog({ expense, onClose, onDone, onError }: {
  expense: OwnerExpense | null;
  onClose: () => void;
  onDone: () => void;
  onError: (message: string) => void;
}) {
  const outstanding = expense ? expense.gross_total_cents - expense.amount_paid_cents : 0;
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState('bank_transfer');
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (expense) { setAmount((outstanding / 100).toFixed(2).replace('.', ',')); setErr(null); setReference(''); setMethod('bank_transfer'); setDate(new Date().toISOString().slice(0, 10)); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expense?.id]);

  const submit = async () => {
    if (!expense) return;
    setErr(null);
    const cents = toCents(amount);
    if (cents == null || cents <= 0) { setErr('Bitte einen gültigen Betrag eingeben.'); return; }
    if (cents > outstanding) { setErr(`Betrag übersteigt den offenen Betrag (${formatCents(outstanding)}).`); return; }
    setBusy(true);
    const { error } = await recordExpensePayment(expense.id, cents, date, { method, reference: reference.trim() || null });
    setBusy(false);
    if (error) { onError(error); return; }
    onDone();
  };

  return (
    <Modal
      open={!!expense}
      onClose={busy ? () => {} : onClose}
      title="Ausgabe bezahlen"
      description={expense?.supplier_invoice_number ? `Beleg ${expense.supplier_invoice_number}` : undefined}
      footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Abbrechen</Button><Button onClick={() => void submit()} loading={busy}>Zahlung buchen</Button></>}
    >
      <div className="mb-4 flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3">
        <span className="text-[13px] text-gray-500">Offener Betrag</span>
        <span className="text-base font-semibold tabular-nums text-gray-950">{formatCents(outstanding)}</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="expPayAmount" label="Zahlungsbetrag" prefix="€" value={amount} onChange={setAmount} inputMode="decimal" required autoFocus />
        <Field id="expPayDate" label="Zahlungsdatum" type="date" value={date} onChange={setDate} required />
        <Select id="expPayMethod" label="Zahlungsart" value={method} onChange={setMethod} options={[
          { value: 'bank_transfer', label: 'Überweisung' }, { value: 'card', label: 'Karte' }, { value: 'cash', label: 'Bar' }, { value: 'direct_debit', label: 'Lastschrift' }, { value: 'other', label: 'Sonstige' },
        ]} />
        <Field id="expPayRef" label="Referenz" value={reference} onChange={setReference} placeholder="Verwendungszweck" />
      </div>
      {err ? <p className="mt-3 text-[13px] text-red-600">{err}</p> : null}
    </Modal>
  );
}

/* --------------------------------------------------------- Ausgaben-Schnellimport */

/**
 * PASTE → PARSE → VALIDATE → RESOLVE VENDORS/CATEGORIES → PREVIEW → CONFIRM → atomic import.
 *
 * There is deliberately no paste-and-write path: nothing is written until the owner has seen
 * the totals, every vendor the import would CREATE, and every problem. The field takes the
 * documented expense JSON only; pasted SQL is refused outright rather than forwarded.
 *
 * Suppliers are resolved against owner_vendors, never against customers. That distinction is
 * the whole point of this dialog — an imported OpenAI receipt must not create a Cogniiq
 * customer named OpenAI.
 */
function ExpenseImportModal({ open, entityId, categoryKeys, onClose, onDone, onError }: {
  open: boolean;
  entityId: string | null;
  categoryKeys: string[];
  onClose: () => void;
  onDone: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [raw, setRaw] = useState('');
  const [preview, setPreview] = useState<ExpenseImportPreview | null>(null);
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (open) { setRaw(''); setPreview(null); } }, [open]);

  const check = async () => {
    if (!entityId) return;
    setChecking(true);
    let p = parseExpenseBulkImport(raw, entityId, categoryKeys);
    // Vendor names are resolved server-side so the preview can state — before anything is
    // written — which suppliers are unknown (and will be created) or ambiguous (and block).
    if (p.payload && p.unresolvedVendorNames.length > 0) {
      try {
        const { resolutions, error, backendMissing } = await resolveImportVendors(entityId, p.unresolvedVendorNames);
        if (error) {
          const message = backendMissing
            ? `Der Ausgaben-Schnellimport ist in dieser Umgebung noch nicht installiert. Bitte die Migration ${OWNER_EXPENSE_IMPORT_MIGRATION} anwenden.`
            : `Lieferantenabgleich fehlgeschlagen: ${error}`;
          p = { ...p, ok: false, errors: [...p.errors, { row: '—', message }] };
        } else {
          p = applyVendorResolutions(p, resolutions);
        }
      } catch (e: unknown) {
        p = { ...p, ok: false, errors: [...p.errors, { row: '—', message: `Lieferantenabgleich fehlgeschlagen: ${describeSupabaseError(e)}` }] };
      }
    }
    setChecking(false);
    setPreview(p);
  };

  const confirm = async () => {
    if (!preview?.ok || !preview.payload) return;
    setBusy(true);
    const { result, error, backendMissing } = await runExpenseBulkImport(preview.payload);
    setBusy(false);
    if (error || !result) {
      onError(backendMissing
        ? `Der Ausgaben-Schnellimport ist in dieser Umgebung noch nicht installiert. Bitte die Migration ${OWNER_EXPENSE_IMPORT_MIGRATION} anwenden.`
        : (error ?? 'Unbekannter Fehler'));
      return;
    }
    const vendorNote = result.vendors_created?.length
      ? ` ${result.vendors_created.length} neue(r) Lieferant(en) angelegt.`
      : '';
    onDone(`${result.expense_count} Ausgaben und ${result.payment_count} Zahlungen importiert.${vendorNote}`);
  };

  const money = (c: number) => formatCents(c, 'EUR');

  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} title="Ausgaben-Schnellimport" size="lg">
      <div className="space-y-4">
        <SectionHeader
          title="Strukturierter JSON-Import"
          description="Historische Belege mit Lieferant, USt-Behandlung und Zahlungen in einem Schritt. Es wird ausschließlich das dokumentierte JSON-Format akzeptiert — kein SQL."
          action={
            <Button size="sm" variant="ghost" onClick={() => { setRaw(expenseImportTemplate()); setPreview(null); }}>
              Beispiel einfügen
            </Button>
          }
        />

        <InfoBanner tone="info" title="Lieferanten, keine Kunden">
          Belege werden gegen die Lieferantenliste abgeglichen. Es entsteht dabei kein Kunde,
          keine Rechnung und keine Rechnungsnummer.
        </InfoBanner>

        <textarea
          value={raw}
          onChange={(e) => { setRaw(e.target.value); setPreview(null); }}
          rows={10}
          spellCheck={false}
          aria-label="Ausgaben-JSON"
          placeholder='{ "schema_version": 1, "expenses": [ … ] }'
          className="w-full rounded-xl border border-gray-200 bg-white p-3 font-mono text-[12px] text-gray-900 outline-none focus:border-gray-400"
        />

        {!preview ? (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>Abbrechen</Button>
            <Button onClick={() => void check()} loading={checking} disabled={!raw.trim() || !entityId}>Prüfen</Button>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
              <p className="text-[13px] font-semibold text-gray-950">
                {preview.expenseCount} Ausgaben · {preview.paymentCount} Zahlungen
              </p>
              <dl className="mt-3 grid gap-1.5 text-[13px] sm:grid-cols-2">
                <div className="flex justify-between"><dt className="text-gray-500">Netto</dt><dd className="tabular-nums text-gray-800">{money(preview.netCents)}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">USt</dt><dd className="tabular-nums text-gray-800">{money(preview.vatCents)}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Vorsteuer</dt><dd className="tabular-nums text-gray-800">{money(preview.inputVatCents)}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Brutto</dt><dd className="tabular-nums font-semibold text-gray-950">{money(preview.grossCents)}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Bezahlt</dt><dd className="tabular-nums text-emerald-700">{money(preview.paidCents)}</dd></div>
              </dl>
              <p className="mt-3 text-[11px] text-gray-400">
                Beträge sind eine Vorschau. Netto, USt, Vorsteuer, Brutto und Zahlungsstatus
                werden beim Import serverseitig neu berechnet.
              </p>
            </div>

            {preview.vendorsToCreate.length > 0 ? (
              <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3">
                <p className="text-[13px] font-semibold text-sky-900">
                  {preview.vendorsToCreate.length} neue(r) Lieferant(en) werden angelegt
                </p>
                <ul className="mt-2 space-y-1 text-[12px] text-sky-800">
                  {preview.vendorsToCreate.map((v) => (
                    <li key={v.name}>Neuer Lieferant wird angelegt: {v.name}{v.country_code ? ` (${v.country_code})` : ''}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {preview.errors.length > 0 ? (
              <div className="rounded-xl border border-red-100 bg-red-50/70 p-3">
                <p className="text-[13px] font-semibold text-red-800">{preview.errors.length} Problem(e) — Import nicht möglich</p>
                <ul className="mt-2 space-y-1 break-words text-[12px] text-red-700">
                  {preview.errors.slice(0, 12).map((e, i) => <li key={i}><span className="font-medium">{e.row}:</span> {e.message}</li>)}
                  {preview.errors.length > 12 ? <li className="text-red-500">… und {preview.errors.length - 12} weitere</li> : null}
                </ul>
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-[13px] text-emerald-800">
                ✓ {preview.expenseCount} Ausgaben bereit
              </div>
            )}

            {preview.warnings.length > 0 ? (
              <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-3">
                <p className="text-[13px] font-semibold text-amber-800">Hinweise</p>
                <ul className="mt-2 space-y-1 break-words text-[12px] text-amber-700">
                  {preview.warnings.slice(0, 8).map((w, i) => <li key={i}><span className="font-medium">{w.row}:</span> {w.message}</li>)}
                  {preview.warnings.length > 8 ? <li className="text-amber-600">… und {preview.warnings.length - 8} weitere</li> : null}
                </ul>
              </div>
            ) : null}

            <p className="text-[12px] leading-relaxed text-gray-400">
              Der Import läuft in einer einzigen Transaktion: entweder alle Belege oder keiner.
              Neue Lieferanten entstehen dabei im selben Vorgang. Es wird nichts versendet.
            </p>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setPreview(null)} disabled={busy}>Zurück</Button>
              <Button onClick={() => void confirm()} loading={busy} disabled={!preview.ok}>
                {preview.ok ? 'Import bestätigen' : 'Import nicht möglich'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
