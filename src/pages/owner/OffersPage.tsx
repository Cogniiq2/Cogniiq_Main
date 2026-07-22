import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSignature, Plus } from 'lucide-react';

import {
  Button, DataTable, EmptyState, ErrorState, KpiCard, PageHeader,
  StatusBadge, Tabs, TableSkeleton, useToast,
  type BadgeTone, type Column,
} from '@/components/dashboard';
import { useOwnerEntity } from '@/pages/owner/ownerContext';
import { loadOffers } from '@/lib/ownerFinance/offersApi';
import { loadAdminClients } from '@/lib/clientPlatform/adminApi';
import { formatCents } from '@/lib/clientPlatform/validation';
import type { OwnerOffer } from '@/lib/ownerFinance/types';
import { ExportMenu } from '@/components/finance/ExportMenu';
import { runFinanceExport } from '@/lib/ownerFinance/financeExportRunner';
import { offerExportTable, offerReportModel, offerMetadataSheet } from '@/lib/ownerFinance/exports/datasets';
import type { ExportFormat, ExportMode, ExportMeta } from '@/lib/ownerFinance/exports';

const statusLabel: Record<string, string> = {
  draft: 'Entwurf', finalized: 'Finalisiert', sent: 'Versendet', viewed: 'Angesehen',
  accepted: 'Angenommen', rejected: 'Abgelehnt', expired: 'Abgelaufen', cancelled: 'Storniert', converted: 'Umgewandelt',
};
export const offerStatusTone: Record<string, BadgeTone> = {
  draft: 'neutral', finalized: 'info', sent: 'info', viewed: 'warning',
  accepted: 'success', rejected: 'danger', expired: 'warning', cancelled: 'neutral', converted: 'success',
};

interface CustomerOption { organizationId: string; clientAccountId: string | null; name: string; email: string | null; legalName: string | null }

export function OffersPage() {
  const { entity } = useOwnerEntity();
  const toast = useToast();
  const navigate = useNavigate();
  const [offers, setOffers] = useState<OwnerOffer[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [includeIds, setIncludeIds] = useState(false);

  const load = useCallback(async () => {
    if (!entity) return;
    setLoading(true);
    try {
      const [off, clients] = await Promise.all([loadOffers(entity.id), loadAdminClients().catch(() => [])]);
      setOffers(off);
      setCustomers(clients.map((c) => ({ organizationId: c.organizationId, clientAccountId: c.account?.id ?? null, name: c.organizationName, email: c.account?.primary_email ?? null, legalName: c.account?.legal_name ?? null })));
      setError(null);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, [entity]);

  useEffect(() => { void load(); }, [load]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: offers.length };
    for (const o of offers) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [offers]);

  const filterGroups: Record<string, (o: OwnerOffer) => boolean> = {
    all: () => true,
    draft: (o) => o.status === 'draft',
    open: (o) => ['finalized', 'sent', 'viewed'].includes(o.status),
    accepted: (o) => o.status === 'accepted' || o.status === 'converted',
    rejected: (o) => o.status === 'rejected',
    expired: (o) => o.status === 'expired',
  };
  const filtered = useMemo(() => offers.filter(filterGroups[statusFilter] ?? (() => true)), [offers, statusFilter]);

  const customerName = useCallback((o: OwnerOffer): string => {
    const c = customers.find((x) => x.organizationId === o.organization_id);
    return c ? (c.legalName ?? c.name) : o.organization_id ? 'CRM-Kunde' : '—';
  }, [customers]);

  const totals = useMemo(() => ({
    open: offers.filter((o) => ['finalized', 'sent', 'viewed'].includes(o.status)).reduce((s, o) => s + o.gross_total_cents, 0),
    accepted: offers.filter((o) => o.status === 'accepted' || o.status === 'converted').reduce((s, o) => s + o.gross_total_cents, 0),
    drafts: offers.filter((o) => o.status === 'draft').length,
  }), [offers]);

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
    { key: 'number', header: 'Nummer', render: (o) => <span className="font-semibold text-gray-950">{o.offer_number ?? 'Entwurf'}</span>, hideOnMobile: true },
    { key: 'status', header: 'Status', render: (o) => <StatusBadge label={statusLabel[o.status] ?? o.status} tone={offerStatusTone[o.status]} /> },
    { key: 'customer', header: 'Kunde', render: (o) => <span className="text-gray-600">{customerName(o)}</span>, hideOnMobile: true },
    { key: 'title', header: 'Titel', render: (o) => <span className="text-gray-600">{o.title ?? '—'}</span> },
    { key: 'valid', header: 'Gültig bis', render: (o) => <span className="text-gray-500">{o.valid_until ?? '—'}</span>, hideOnMobile: true },
    { key: 'gross', header: 'Brutto', align: 'right', render: (o) => <span className="tabular-nums font-medium text-gray-900">{formatCents(o.gross_total_cents, o.currency)}</span> },
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

      <div className="mb-4">
        <Tabs value={statusFilter} onChange={setStatusFilter} tabs={[
          { value: 'all', label: 'Alle', count: counts.all },
          { value: 'draft', label: 'Entwürfe', count: counts.draft },
          { value: 'open', label: 'Offen', count: (counts.finalized ?? 0) + (counts.sent ?? 0) + (counts.viewed ?? 0) },
          { value: 'accepted', label: 'Angenommen', count: (counts.accepted ?? 0) + (counts.converted ?? 0) },
          { value: 'rejected', label: 'Abgelehnt', count: counts.rejected },
          { value: 'expired', label: 'Abgelaufen', count: counts.expired },
        ]} />
      </div>

      {loading ? <TableSkeleton rows={5} cols={5} /> : filtered.length === 0 ? (
        <EmptyState icon={FileSignature}
          title={offers.length === 0 ? 'Noch keine Angebote' : 'Keine Angebote in diesem Status'}
          description={offers.length === 0 ? 'Erstellen Sie Ihr erstes Angebot. Es werden keine Beispieldaten angezeigt.' : 'Passen Sie den Filter an.'}
          action={offers.length === 0 ? <Button icon={Plus} onClick={() => navigate('/admin/finance/offers/new')} disabled={!entity}>Neues Angebot</Button> : undefined} />
      ) : (
        <DataTable columns={columns} rows={filtered} getRowKey={(o) => o.id} minWidth={820}
          onRowClick={(o) => navigate(`/admin/finance/offers/${o.id}`)}
          mobileTitle={(o) => <div className="flex items-center gap-2"><span>{o.offer_number ?? 'Entwurf'}</span><StatusBadge label={statusLabel[o.status] ?? o.status} tone={offerStatusTone[o.status]} /></div>}
          mobileSubtitle={(o) => o.title ?? 'ohne Titel'} />
      )}

    </>
  );
}
