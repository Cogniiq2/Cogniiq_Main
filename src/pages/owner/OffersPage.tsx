import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSignature, Plus, Search, Archive, Trash2, RotateCcw } from 'lucide-react';

import {
  Button, DataTable, EmptyState, ErrorState, IconButton, KpiCard, PageHeader,
  Field, Select, StatusBadge, Tabs, TableSkeleton, useToast,
  type Column,
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
type SortKey = 'newest' | 'oldest' | 'amount' | 'customer' | 'status';

export function OffersPage() {
  const { entity } = useOwnerEntity();
  const toast = useToast();
  const navigate = useNavigate();
  const [offers, setOffers] = useState<OwnerOffer[]>([]);
  const [pendingSend, setPendingSend] = useState<Set<string>>(new Set());
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [includeIds, setIncludeIds] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<OwnerOffer | null>(null);

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

    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sort) {
        case 'oldest': return a.created_at.localeCompare(b.created_at);
        case 'amount': return b.gross_total_cents - a.gross_total_cents;
        case 'customer': return customerName(a).localeCompare(customerName(b), 'de');
        case 'status': return a.status.localeCompare(b.status);
        case 'newest': default: return b.created_at.localeCompare(a.created_at);
      }
    });
    return sorted;
  }, [offers, statusFilter, statusMatchers, query, dateFrom, dateTo, minAmount, maxAmount, sort, customerName]);

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
    { key: 'number', header: 'Nummer', render: (o) => <span className="font-semibold text-gray-950">{o.offer_number ?? 'Entwurf'}</span> },
    { key: 'status', header: 'Status', render: (o) => (
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusBadge label={offerStatusLabel[o.status] ?? o.status} tone={offerStatusTone[o.status]} />
        {pendingSend.has(o.id) && o.status !== 'sent' ? <StatusBadge label="Versand ausstehend" tone="info" /> : null}
        {o.archived_at ? <StatusBadge label={offerDisplayStateLabel[offerDisplayState(o)]} tone={offerDisplayStateTone.archived} /> : null}
      </div>
    ) },
    { key: 'customer', header: 'Kunde', render: (o) => <span className="text-gray-600">{customerName(o)}</span> },
    { key: 'title', header: 'Titel', render: (o) => <span className="text-gray-600">{o.title ?? '—'}</span>, hideOnMobile: true },
    { key: 'valid', header: 'Gültig bis', render: (o) => <span className="text-gray-500">{o.valid_until ? formatDateDe(o.valid_until) : '—'}</span>, hideOnMobile: true },
    { key: 'gross', header: 'Brutto', align: 'right', render: (o) => <span className="tabular-nums font-medium text-gray-900">{formatCents(o.gross_total_cents, o.currency)}</span> },
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
          <Tabs value={statusFilter} onChange={setStatusFilter} tabs={tabs} />
          <div className="grid gap-2 rounded-2xl border border-gray-100 bg-white p-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nummer, Kunde, Titel …" aria-label="Angebote durchsuchen"
                className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-gray-400" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field id="date-from" label="Von" type="date" value={dateFrom} onChange={setDateFrom} />
              <Field id="date-to" label="Bis" type="date" value={dateTo} onChange={setDateTo} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field id="min-amount" label="Betrag min." value={minAmount} onChange={setMinAmount} inputMode="decimal" prefix="€" />
              <Field id="max-amount" label="Betrag max." value={maxAmount} onChange={setMaxAmount} inputMode="decimal" prefix="€" />
            </div>
            <Select id="offer-sort" label="Sortierung" value={sort} onChange={(v) => setSort(v as SortKey)}
              options={[
                { value: 'newest', label: 'Neueste zuerst' },
                { value: 'oldest', label: 'Älteste zuerst' },
                { value: 'amount', label: 'Betrag (absteigend)' },
                { value: 'customer', label: 'Kunde (A–Z)' },
                { value: 'status', label: 'Status' },
              ]} />
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
          onRowClick={(o) => navigate(`/admin/finance/offers/${o.id}`)}
          mobileTitle={(o) => <div className="flex items-center gap-2"><span>{o.offer_number ?? 'Entwurf'}</span><StatusBadge label={offerStatusLabel[o.status] ?? o.status} tone={offerStatusTone[o.status]} /></div>}
          mobileSubtitle={(o) => o.title ?? 'ohne Titel'} />
      )}

      <OfferArchiveDialog open={!!archiveTarget} offer={archiveTarget} onClose={() => setArchiveTarget(null)} onDone={() => void load()} />
    </>
  );
}
