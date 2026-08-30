import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSignature, Plus, SlidersHorizontal, Archive, Trash2, RotateCcw } from 'lucide-react';

import {
  Button, DataTable, EmptyState, ErrorState, FilterChips, IconButton, Panel, SearchInput,
  Field, Select, StatBand, StatBandSkeleton, StatusBadge, TableSkeleton, Toolbar, WorkspaceHeader,
  useToast, type Column, type SortDirection, type StatItem,
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
import { offerPipelineSortValueCents, formatOfferAmount } from '@/lib/ownerFinance/offerAmountDisplay';

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
  const [tableSort, setTableSort] = useState<{ key: string; direction: SortDirection } | null>(null);
  /* The date/amount filters are the rarely-used half of the toolbar; they stay collapsed
     until asked for so the common case (status + search) is one uncluttered rail. */
  const [advancedOpen, setAdvancedOpen] = useState(false);

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
    // Deal-size filter/sort: a recurring-only offer has gross_total_cents = 0 (that column is
    // one-time only), so filtering/sorting on it alone makes real accepted deals disappear.
    // offerPipelineSortValueCents folds the recurring amount back in as a size heuristic.
    if (min != null) list = list.filter((o) => offerPipelineSortValueCents(o) >= min);
    if (max != null) list = list.filter((o) => offerPipelineSortValueCents(o) <= max);

    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sort) {
        case 'oldest': return a.created_at.localeCompare(b.created_at);
        case 'amount': return offerPipelineSortValueCents(b) - offerPipelineSortValueCents(a);
        case 'customer': return customerName(a).localeCompare(customerName(b), 'de');
        case 'status': return a.status.localeCompare(b.status);
        case 'newest': default: return b.created_at.localeCompare(a.created_at);
      }
    });
    return sorted;
  }, [offers, statusFilter, statusMatchers, query, dateFrom, dateTo, minAmount, maxAmount, sort, customerName]);

  // One-time and recurring are kept apart even in the pipeline KPI: fusing them into one
  // number would misstate the money owed, and dropping the recurring side (as the raw
  // gross_total_cents sum would) hides real committed revenue.
  const totals = useMemo(() => {
    const open = offers.filter((o) => !isArchived(o) && ['finalized', 'sent', 'viewed'].includes(o.status));
    const accepted = offers.filter((o) => o.status === 'accepted' || o.status === 'converted');
    return {
      open: open.reduce((s, o) => s + o.gross_total_cents, 0),
      openMonthly: open.reduce((s, o) => s + o.recurring_monthly_gross_cents, 0),
      accepted: accepted.reduce((s, o) => s + o.gross_total_cents, 0),
      acceptedMonthly: accepted.reduce((s, o) => s + o.recurring_monthly_gross_cents, 0),
      drafts: offers.filter((o) => o.status === 'draft').length,
    };
  }, [offers]);

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

  /**
   * The identity cell carries number, customer and title together — an offer is
   * recognised by all three, and giving each its own column was what pushed this
   * table past its container. The commercial state (status, pending send, archived)
   * gets its own column, and the amount keeps the one-time and recurring halves apart.
   */
  const columns: Column<OwnerOffer>[] = [
    {
      key: 'offer',
      header: 'Angebot',
      sortValue: (o) => o.offer_number ?? 'zzz',
      render: (o) => (
        <div className="min-w-0">
          <div className="truncate font-semibold text-[var(--cq-fg)]">{o.offer_number ?? 'Entwurf'}</div>
          <div className="truncate text-[12px] text-[var(--cq-fg-subtle)]">
            {[customerName(o), o.title].filter((v) => v && v !== '—').join(' · ') || '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (o) => o.status,
      render: (o) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge label={offerStatusLabel[o.status] ?? o.status} tone={offerStatusTone[o.status]} />
          {pendingSend.has(o.id) && o.status !== 'sent' ? <StatusBadge label="Versand ausstehend" tone="info" /> : null}
          {o.archived_at ? <StatusBadge label={offerDisplayStateLabel[offerDisplayState(o)]} tone={offerDisplayStateTone.archived} /> : null}
        </div>
      ),
    },
    {
      key: 'valid',
      header: 'Verlauf',
      hideOnMobile: true,
      sortValue: (o) => o.valid_until ?? '',
      render: (o) => (
        <div className="whitespace-nowrap text-[12.5px] leading-4">
          <div className="text-[var(--cq-fg-muted)]">Erstellt {formatDateDe(o.created_at)}</div>
          <div className="text-[var(--cq-fg-subtle)]">
            {o.accepted_at ? `Angenommen ${formatDateDe(o.accepted_at)}`
              : o.valid_until ? `Gültig bis ${formatDateDe(o.valid_until)}`
              : 'ohne Frist'}
          </div>
        </div>
      ),
    },
    {
      key: 'gross',
      header: 'Betrag',
      align: 'right',
      sortValue: (o) => offerPipelineSortValueCents(o),
      render: (o) => (
        <span className="whitespace-nowrap font-medium text-[var(--cq-fg)]">
          {formatOfferAmount(o, o.currency, formatCents)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      sticky: true,
      hideOnCard: true,
      render: (o) => (
        <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
          {o.archived_at ? (
            <IconButton icon={RotateCcw} label={`${o.offer_number ?? 'Angebot'} wiederherstellen`} variant="ghost" onClick={() => void unarchive(o)} />
          ) : (
            <IconButton
              icon={o.status === 'draft' ? Trash2 : Archive}
              label={`${o.offer_number ?? 'Entwurf'} ${o.status === 'draft' ? 'löschen' : 'archivieren'}`}
              variant="ghost"
              onClick={() => setArchiveTarget(o)}
            />
          )}
        </div>
      ),
    },
  ];

  const stats: StatItem[] = [
    {
      key: 'open',
      label: 'Beim Kunden',
      value: formatCents(totals.open),
      hint: totals.openMonthly > 0
        ? `zzgl. ${formatCents(totals.openMonthly)}/Monat · noch kein Umsatz`
        : 'versendet oder finalisiert · noch kein Umsatz',
      lead: true,
    },
    {
      key: 'accepted',
      label: 'Angenommen',
      value: formatCents(totals.accepted),
      hint: totals.acceptedMonthly > 0 ? `zzgl. ${formatCents(totals.acceptedMonthly)}/Monat` : 'wird erst mit der Rechnung zu Umsatz',
      tone: totals.accepted > 0 ? 'positive' : 'neutral',
    },
    { key: 'drafts', label: 'Entwürfe', value: String(totals.drafts), hint: 'noch nicht finalisiert' },
    { key: 'sent', label: 'Versendet', value: String(counts.sent + counts.viewed), hint: `${counts.viewed} angesehen` },
    { key: 'expired', label: 'Abgelaufen', value: String(counts.expired), hint: 'ohne Antwort verfallen', tone: counts.expired > 0 ? 'attention' : 'neutral' },
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

  const advancedActive = Boolean(dateFrom || dateTo || minAmount || maxAmount);

  return (
    <>
      <WorkspaceHeader
        eyebrow="Einnahmen"
        title="Angebote"
        subtitle="Serverseitig berechnete Summen, unveränderliche finalisierte Versionen und sichere Online-Annahme. Ein angenommenes Angebot wird zum Rechnungsentwurf — eine Rechnung wird nie automatisch gestellt."
        actions={
          <>
            <ExportMenu onExport={runExport} disabled={!entity || offers.length === 0} includeIds={includeIds} onIncludeIdsChange={setIncludeIds}
              modes={[{ value: 'current', label: 'Aktuelle Ansicht', count: filtered.length }, { value: 'all', label: 'Alle Angebote', count: offers.length }]} />
            <Button icon={Plus} onClick={() => navigate('/admin/finance/offers/new')} disabled={!entity}>Neues Angebot</Button>
          </>
        }
        toolbar={
          !loading && offers.length > 0 ? (
            <Toolbar
              trailing={
                <>
                  <SearchInput
                    value={query}
                    onChange={setQuery}
                    label="Angebote durchsuchen"
                    placeholder="Nummer, Kunde, Titel …"
                    className="w-full sm:w-64"
                  />
                  <div className="w-full sm:w-48">
                    <Select id="offer-sort" value={sort} onChange={(v) => { setSort(v as SortKey); setTableSort(null); }}
                      options={[
                        { value: 'newest', label: 'Neueste zuerst' },
                        { value: 'oldest', label: 'Älteste zuerst' },
                        { value: 'amount', label: 'Betrag (absteigend)' },
                        { value: 'customer', label: 'Kunde (A–Z)' },
                        { value: 'status', label: 'Status' },
                      ]} />
                  </div>
                  <Button
                    variant={advancedOpen || advancedActive ? 'secondary' : 'ghost'}
                    icon={SlidersHorizontal}
                    aria-expanded={advancedOpen}
                    onClick={() => setAdvancedOpen((open) => !open)}
                  >
                    Zeitraum & Betrag{advancedActive ? ' ·' : ''}
                  </Button>
                </>
              }
            >
              <FilterChips
                label="Angebote nach Status filtern"
                value={statusFilter}
                onChange={setStatusFilter}
                options={tabs.filter((t) => t.value === 'all' || (t.count ?? 0) > 0)}
              />
            </Toolbar>
          ) : undefined
        }
      />

      {error ? <div className="mb-4"><ErrorState message={error} onRetry={() => void load()} /></div> : null}

      <div className="space-y-4">
        {loading ? <StatBandSkeleton count={5} /> : offers.length > 0 ? <StatBand items={stats} /> : null}

        {advancedOpen ? (
          <Panel
            title="Zeitraum & Betrag"
            description="Filtert die Liste zusätzlich zum Status"
            action={
              advancedActive ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setDateFrom(''); setDateTo(''); setMinAmount(''); setMaxAmount(''); }}
                >
                  Zurücksetzen
                </Button>
              ) : undefined
            }
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field id="date-from" label="Erstellt von" type="date" value={dateFrom} onChange={setDateFrom} />
              <Field id="date-to" label="Erstellt bis" type="date" value={dateTo} onChange={setDateTo} />
              <Field id="min-amount" label="Betrag min." value={minAmount} onChange={setMinAmount} inputMode="decimal" prefix="€" />
              <Field id="max-amount" label="Betrag max." value={maxAmount} onChange={setMaxAmount} inputMode="decimal" prefix="€" />
            </div>
          </Panel>
        ) : null}

        {loading ? <TableSkeleton rows={5} cols={5} /> : filtered.length === 0 ? (
          <EmptyState icon={FileSignature}
            title={offers.length === 0 ? 'Noch keine Angebote' : 'Keine Angebote in dieser Ansicht'}
            description={offers.length === 0
              ? 'Erstellen Sie Ihr erstes Angebot. Es werden keine Beispieldaten angezeigt.'
              : 'Kein Angebot passt zu dieser Kombination aus Status, Suche und Zeitraum.'}
            action={offers.length === 0
              ? <Button icon={Plus} onClick={() => navigate('/admin/finance/offers/new')} disabled={!entity}>Neues Angebot</Button>
              : (
                <Button
                  variant="secondary"
                  onClick={() => { setStatusFilter('all'); setQuery(''); setDateFrom(''); setDateTo(''); setMinAmount(''); setMaxAmount(''); }}
                >
                  Filter zurücksetzen
                </Button>
              )} />
        ) : (
          <DataTable columns={columns} rows={filtered} getRowKey={(o) => o.id} minWidth={760}
            sort={tableSort}
            onSortChange={setTableSort}
            rowHref={(o) => `/admin/finance/offers/${o.id}`}
            onRowClick={(o) => navigate(`/admin/finance/offers/${o.id}`)}
            mobileTitle={(o) => <div className="flex items-center gap-2"><span>{o.offer_number ?? 'Entwurf'}</span><StatusBadge label={offerStatusLabel[o.status] ?? o.status} tone={offerStatusTone[o.status]} /></div>}
            mobileSubtitle={(o) => [customerName(o), o.title].filter((v) => v && v !== '—').join(' · ') || 'ohne Titel'} />
        )}
      </div>

      <OfferArchiveDialog open={!!archiveTarget} offer={archiveTarget} onClose={() => setArchiveTarget(null)} onDone={() => void load()} />
    </>
  );
}
