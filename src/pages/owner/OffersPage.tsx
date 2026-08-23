import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileSignature, Plus, Search, Archive, Trash2, RotateCcw } from 'lucide-react';

import {
  Button, DataTable, EmptyState, ErrorState, IconButton, KpiCard, PageHeader,
  Field, Select, StatusBadge, Tabs, TableSkeleton, useToast,
  type Column, type SortState,
} from '@/components/dashboard';
import { useOwnerEntity } from '@/pages/owner/ownerContext';
import { loadOffers, loadPendingSendOfferIds } from '@/lib/ownerFinance/offersApi';
import { unarchiveOffer } from '@/lib/ownerFinance/customersApi';
import { loadAdminClients } from '@/lib/clientPlatform/adminApi';
import { formatCents } from '@/lib/clientPlatform/validation';
import { formatDateDe } from '@/lib/ownerFinance/exports';
import { offerStatusLabel, offerStatusTone, offerDisplayState, offerDisplayStateLabel, offerDisplayStateTone } from '@/lib/ownerFinance/customerLabels';
import { OfferArchiveDialog } from '@/components/finance/OfferArchiveDialog';
import type { OwnerOffer } from '@/lib/ownerFinance/types';
import { ExportMenu } from '@/components/finance/ExportMenu';
import { runFinanceExport } from '@/lib/ownerFinance/financeExportRunner';
import { offerExportTable, offerReportModel, offerMetadataSheet } from '@/lib/ownerFinance/exports/datasets';
import type { ExportFormat, ExportMode, ExportMeta } from '@/lib/ownerFinance/exports';

// Re-exported for other owner views that render an offer status badge.
export { offerStatusTone };

interface CustomerOption { organizationId: string; name: string; legalName: string | null }

const DEFAULT_SORT = 'created.desc';

/** URL form is `<columnKey>.<dir>`; `created` sorts in the page (it has no visible column). */
function parseSort(raw: string): SortState {
  const [key, dir] = raw.split('.');
  return { key: key || 'created', dir: dir === 'asc' ? 'asc' : 'desc' };
}

export function OffersPage() {
  const { entity } = useOwnerEntity();
  const toast = useToast();
  const navigate = useNavigate();
  const [offers, setOffers] = useState<OwnerOffer[]>([]);
  const [pendingSend, setPendingSend] = useState<Set<string>>(new Set());
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includeIds, setIncludeIds] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<OwnerOffer | null>(null);

  // Every filter lives in the URL: reload, back-navigation from a detail page and shared links all
  // restore the exact view. Defaults are omitted from the URL so a pristine list has a clean path.
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') ?? 'all';
  const query = searchParams.get('q') ?? '';
  const dateFrom = searchParams.get('von') ?? '';
  const dateTo = searchParams.get('bis') ?? '';
  const minAmount = searchParams.get('min') ?? '';
  const maxAmount = searchParams.get('max') ?? '';
  const sortParam = searchParams.get('sort') ?? DEFAULT_SORT;
  const sortState = useMemo(() => parseSort(sortParam), [sortParam]);

  const setParam = useCallback(
    (key: string, value: string, defaultValue = '') => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          if (!value || value === defaultValue) next.delete(key);
          else next.set(key, value);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const load = useCallback(async () => {
    if (!entity) return;
    setLoading(true);
    try {
      const [off, pending, clients] = await Promise.all([
        loadOffers(entity.id),
        loadPendingSendOfferIds(entity.id).catch(() => new Set<string>()),
        loadAdminClients().catch(() => []),
      ]);
      setOffers(off);
      setPendingSend(pending);
      setCustomers(clients.map((c) => ({ organizationId: c.organizationId, name: c.organizationName, legalName: c.account?.legal_name ?? null })));
      setError(null);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, [entity]);

  useEffect(() => { void load(); }, [load]);

  const customerName = useCallback((o: OwnerOffer): string => {
    if (o.recipient_company?.trim()) return o.recipient_company.trim();
    const c = customers.find((x) => x.organizationId === o.organization_id);
    return c ? (c.legalName ?? c.name) : '—';
  }, [customers]);

  // A single predicate per status tab. Archived is orthogonal to status: every non-archived tab
  // hides archived offers; the "archived" tab shows only archived ones.
  const isArchived = (o: OwnerOffer) => o.archived_at != null;
  const statusMatchers: Record<string, (o: OwnerOffer) => boolean> = useMemo(() => ({
    all: (o) => !isArchived(o),
    draft: (o) => o.status === 'draft',
    finalized: (o) => o.status === 'finalized' && !pendingSend.has(o.id),
    pending_send: (o) => pendingSend.has(o.id) && o.status !== 'sent',
    sent: (o) => o.status === 'sent',
    viewed: (o) => o.status === 'viewed',
    accepted: (o) => o.status === 'accepted' || o.status === 'converted',
    expired: (o) => o.status === 'expired',
    cancelled: (o) => o.status === 'cancelled',
    archived: () => true, // handled by the archived branch below
  }), [pendingSend]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const key of Object.keys(statusMatchers)) {
      c[key] = key === 'archived'
        ? offers.filter(isArchived).length
        : offers.filter((o) => !isArchived(o) && statusMatchers[key](o)).length;
    }
    return c;
  }, [offers, statusMatchers]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const min = minAmount ? Math.round(parseFloat(minAmount.replace(',', '.')) * 100) : null;
    const max = maxAmount ? Math.round(parseFloat(maxAmount.replace(',', '.')) * 100) : null;
    let list = statusFilter === 'archived'
      ? offers.filter(isArchived)
      : offers.filter((o) => !isArchived(o) && (statusMatchers[statusFilter] ?? (() => true))(o));

    if (q) list = list.filter((o) => [o.offer_number, o.title, customerName(o), o.recipient_contact_name, o.recipient_email].some((v) => (v ?? '').toLowerCase().includes(q)));
    if (dateFrom) list = list.filter((o) => (o.issue_date ?? o.created_at.slice(0, 10)) >= dateFrom);
    if (dateTo) list = list.filter((o) => (o.issue_date ?? o.created_at.slice(0, 10)) <= dateTo);
    if (min != null) list = list.filter((o) => o.gross_total_cents >= min);
    if (max != null) list = list.filter((o) => o.gross_total_cents <= max);

    // Column sorting is the DataTable's job; only the created-at order (no visible column) is
    // resolved here so "Neueste zuerst" keeps working on desktop and mobile alike.
    if (sortState.key === 'created') {
      const sorted = [...list];
      sorted.sort((a, b) =>
        sortState.dir === 'asc' ? a.created_at.localeCompare(b.created_at) : b.created_at.localeCompare(a.created_at),
      );
      return sorted;
    }
    return list;
  }, [offers, statusFilter, statusMatchers, query, dateFrom, dateTo, minAmount, maxAmount, sortState, customerName]);

  const totals = useMemo(() => ({
    open: offers.filter((o) => !isArchived(o) && ['finalized', 'sent', 'viewed'].includes(o.status)).reduce((s, o) => s + o.gross_total_cents, 0),
    accepted: offers.filter((o) => o.status === 'accepted' || o.status === 'converted').reduce((s, o) => s + o.gross_total_cents, 0),
    drafts: offers.filter((o) => o.status === 'draft').length,
  }), [offers]);

  const unarchive = async (o: OwnerOffer) => {
    const { error: err } = await unarchiveOffer(o.id);
    if (err) { toast.error('Wiederherstellen fehlgeschlagen', 'Bitte erneut versuchen.'); return; }
    toast.success('Angebot wiederhergestellt', 'Das Angebot ist wieder aktiv.');
    void load();
  };

  const runExport = async (format: ExportFormat, mode: ExportMode) => {
    if (!entity) return;
    const rows = mode === 'all' ? offers : filtered;
    const meta: ExportMeta = { entityName: entity.display_name, valueBasis: 'actual', filtersLabel: mode === 'all' ? 'Alle' : statusFilter, mode };
    const spec = {
      entityId: entity.id, exportType: 'offers', baseFilename: 'Angebote', meta,
      table: offerExportTable(rows, customerName) as never,
      metadataSheet: offerMetadataSheet(rows, meta),
      reportModel: offerReportModel(rows, meta, customerName),
      jsonPayload: { offers: rows },
      snapshot: rows.map((r) => ({ id: r.id, status: r.status, gross: r.gross_total_cents })),
      counts: { offers: rows.length }, includeIds,
    };
    try {
      const { warning } = await runFinanceExport(format, mode, spec);
      if (warning) toast.error('Hinweis zum Export', warning);
      else toast.success('Export erstellt', `${format.toUpperCase()} · ${rows.length} Angebote`);
    } catch (e: unknown) { toast.error('Export fehlgeschlagen', e instanceof Error ? e.message : String(e)); }
  };

  const columns: Column<OwnerOffer>[] = [
    { key: 'number', header: 'Nummer', sortValue: (o) => o.offer_number, render: (o) => <span className="font-semibold text-gray-950">{o.offer_number ?? 'Entwurf'}</span> },
    { key: 'status', header: 'Status', sortValue: (o) => offerStatusLabel[o.status] ?? o.status, render: (o) => (
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusBadge label={offerStatusLabel[o.status] ?? o.status} tone={offerStatusTone[o.status]} />
        {pendingSend.has(o.id) && o.status !== 'sent' ? <StatusBadge label="Versand ausstehend" tone="info" /> : null}
        {o.archived_at ? <StatusBadge label={offerDisplayStateLabel[offerDisplayState(o)]} tone={offerDisplayStateTone.archived} /> : null}
      </div>
    ) },
    { key: 'customer', header: 'Kunde', sortValue: (o) => customerName(o), render: (o) => <span className="text-gray-600">{customerName(o)}</span> },
    { key: 'title', header: 'Titel', sortValue: (o) => o.title, render: (o) => <span className="text-gray-600">{o.title ?? '—'}</span>, hideOnMobile: true },
    { key: 'valid', header: 'Gültig bis', sortValue: (o) => o.valid_until, defaultSortDir: 'desc', render: (o) => <span className="text-gray-500">{o.valid_until ? formatDateDe(o.valid_until) : '—'}</span>, hideOnMobile: true },
    { key: 'gross', header: 'Brutto', align: 'right', sortValue: (o) => o.gross_total_cents, defaultSortDir: 'desc', render: (o) => <span className="tabular-nums font-medium text-gray-900">{formatCents(o.gross_total_cents, o.currency)}</span> },
    { key: 'actions', header: '', align: 'right', render: (o) => (
      <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
        {o.archived_at ? (
          <IconButton icon={RotateCcw} label="Wiederherstellen" variant="ghost" onClick={() => void unarchive(o)} />
        ) : (
          <IconButton icon={o.status === 'draft' ? Trash2 : Archive} label={o.status === 'draft' ? 'Löschen' : 'Archivieren'} variant="ghost" onClick={() => setArchiveTarget(o)} />
        )}
      </div>
    ) },
  ];

  const tabs = [
    { value: 'all', label: 'Alle', count: counts.all },
    { value: 'draft', label: 'Entwürfe', count: counts.draft },
    { value: 'finalized', label: 'Finalisiert', count: counts.finalized },
    { value: 'pending_send', label: 'Versand ausstehend', count: counts.pending_send },
    { value: 'sent', label: 'Versendet', count: counts.sent },
    { value: 'viewed', label: 'Angesehen', count: counts.viewed },
    { value: 'accepted', label: 'Angenommen', count: counts.accepted },
    { value: 'expired', label: 'Abgelaufen', count: counts.expired },
    { value: 'cancelled', label: 'Storniert', count: counts.cancelled },
    { value: 'archived', label: 'Archiviert', count: counts.archived },
  ];

  return (
    <>
      <PageHeader
        title="Angebote"
        description="Professionelle Angebote mit serverseitig berechneten Summen, unveränderlichen finalisierten Versionen und sicherer Online-Annahme. Angenommene Angebote werden zu Rechnungsentwürfen — Rechnungen werden nie automatisch gestellt."
        actions={
          <div className="flex items-center gap-2">
            <ExportMenu onExport={runExport} disabled={!entity || offers.length === 0} includeIds={includeIds} onIncludeIdsChange={setIncludeIds}
              modes={[{ value: 'current', label: 'Aktuelle Ansicht', count: filtered.length }, { value: 'all', label: 'Alle Angebote', count: offers.length }]} />
            <Button icon={Plus} onClick={() => navigate('/admin/finance/offers/new')} disabled={!entity}>Neues Angebot</Button>
          </div>
        }
      />

      {error ? <div className="mb-6"><ErrorState message={error} onRetry={() => void load()} /></div> : null}

      {!loading && offers.length > 0 ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <KpiCard label="Offen (versendet)" valueCents={totals.open} basis="actual" />
          <KpiCard label="Angenommen" valueCents={totals.accepted} basis="actual" tone={totals.accepted > 0 ? 'positive' : 'neutral'} />
          <KpiCard label="Entwürfe" value={String(totals.drafts)} basis="actual" hint="noch nicht finalisiert" />
        </div>
      ) : null}

      {!loading && offers.length > 0 ? (
        <div className="mb-4 space-y-3">
          <Tabs value={statusFilter} onChange={(v) => setParam('status', v, 'all')} tabs={tabs} />
          <div className="grid gap-2 rounded-2xl border border-gray-100 bg-white p-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative sm:col-span-2">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <input value={query} onChange={(e) => setParam('q', e.target.value)} placeholder="Nummer, Kunde, Titel …" aria-label="Angebote durchsuchen"
                className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-gray-400" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field id="date-from" label="Von" type="date" value={dateFrom} onChange={(v) => setParam('von', v)} />
              <Field id="date-to" label="Bis" type="date" value={dateTo} onChange={(v) => setParam('bis', v)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field id="min-amount" label="Betrag min." value={minAmount} onChange={(v) => setParam('min', v)} inputMode="decimal" prefix="€" />
              <Field id="max-amount" label="Betrag max." value={maxAmount} onChange={(v) => setParam('max', v)} inputMode="decimal" prefix="€" />
            </div>
            {/* Desktop sorts via the column headers; this select is the mobile fallback (cards have no headers). */}
            <div className="md:hidden">
              <Select id="offer-sort" label="Sortierung" value={sortParam} onChange={(v) => setParam('sort', v, DEFAULT_SORT)}
                options={[
                  { value: 'created.desc', label: 'Neueste zuerst' },
                  { value: 'created.asc', label: 'Älteste zuerst' },
                  { value: 'gross.desc', label: 'Betrag (absteigend)' },
                  { value: 'customer.asc', label: 'Kunde (A–Z)' },
                  { value: 'status.asc', label: 'Status' },
                ]} />
            </div>
          </div>
        </div>
      ) : null}

      {loading ? <TableSkeleton rows={5} cols={5} /> : filtered.length === 0 ? (
        <EmptyState icon={FileSignature}
          title={offers.length === 0 ? 'Noch keine Angebote' : 'Keine Angebote in dieser Ansicht'}
          description={offers.length === 0 ? 'Erstellen Sie Ihr erstes Angebot. Es werden keine Beispieldaten angezeigt.' : 'Passen Sie Filter oder Suche an.'}
          action={offers.length === 0 ? <Button icon={Plus} onClick={() => navigate('/admin/finance/offers/new')} disabled={!entity}>Neues Angebot</Button> : undefined} />
      ) : (
        <DataTable columns={columns} rows={filtered} getRowKey={(o) => o.id} minWidth={900}
          stickyHeader
          sort={sortState.key === 'created' ? null : sortState}
          onSortChange={(s) => setParam('sort', `${s.key}.${s.dir}`, DEFAULT_SORT)}
          onRowClick={(o) => navigate(`/admin/finance/offers/${o.id}`)}
          mobileTitle={(o) => <div className="flex items-center gap-2"><span>{o.offer_number ?? 'Entwurf'}</span><StatusBadge label={offerStatusLabel[o.status] ?? o.status} tone={offerStatusTone[o.status]} /></div>}
          mobileSubtitle={(o) => o.title ?? 'ohne Titel'} />
      )}

      <OfferArchiveDialog open={!!archiveTarget} offer={archiveTarget} onClose={() => setArchiveTarget(null)} onDone={() => void load()} />
    </>
  );
}
