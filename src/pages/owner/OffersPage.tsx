import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSignature, Plus, Trash2 } from 'lucide-react';

import {
  Button, Card, DataTable, EmptyState, ErrorState, IconButton, InfoBanner, KpiCard, PageHeader,
  SectionHeader, SlideOver, StatusBadge, Tabs, TableSkeleton, Field, Select, Textarea, useToast,
  type BadgeTone, type Column,
} from '@/components/dashboard';
import { useOwnerEntity } from '@/pages/owner/ownerContext';
import { loadOffers, createOffer, type OfferLineInput } from '@/lib/ownerFinance/offersApi';
import { loadAdminClients } from '@/lib/clientPlatform/adminApi';
import { computeInvoiceLine } from '@/lib/ownerFinance/tax';
import { formatCents, parseAmountToCents } from '@/lib/clientPlatform/validation';
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

const treatments = [
  { value: 'standard', label: 'Standard 19 %' }, { value: 'reduced', label: 'Ermäßigt 7 %' },
  { value: 'zero_rated', label: 'Nullsatz 0 %' }, { value: 'exempt', label: 'Steuerfrei (§4 UStG)' },
  { value: 'reverse_charge', label: 'Reverse Charge' }, { value: 'outside_scope', label: 'Nicht steuerbar' },
];

function rateFor(t: string): number { return t === 'reduced' ? 700 : t === 'standard' ? 1900 : 0; }
function toCents(input: string): number | null { const p = parseAmountToCents(input); return 'error' in p ? null : p.cents; }

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
  const [composerOpen, setComposerOpen] = useState(false);
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
            <Button icon={Plus} onClick={() => setComposerOpen(true)} disabled={!entity}>Neues Angebot</Button>
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
          action={offers.length === 0 ? <Button icon={Plus} onClick={() => setComposerOpen(true)} disabled={!entity}>Neues Angebot</Button> : undefined} />
      ) : (
        <DataTable columns={columns} rows={filtered} getRowKey={(o) => o.id} minWidth={820}
          onRowClick={(o) => navigate(`/admin/finance/offers/${o.id}`)}
          mobileTitle={(o) => <div className="flex items-center gap-2"><span>{o.offer_number ?? 'Entwurf'}</span><StatusBadge label={statusLabel[o.status] ?? o.status} tone={offerStatusTone[o.status]} /></div>}
          mobileSubtitle={(o) => o.title ?? 'ohne Titel'} />
      )}

      {entity ? (
        <OfferComposer open={composerOpen} entityId={entity.id} customers={customers}
          onClose={() => setComposerOpen(false)}
          onSaved={(id) => { setComposerOpen(false); toast.success('Angebot als Entwurf gespeichert'); navigate(`/admin/finance/offers/${id}`); }}
          onError={(m) => toast.error('Angebot konnte nicht gespeichert werden', m)} />
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------------ Composer */

interface DraftLine { id: string; description: string; quantity: string; unit: string; unitPrice: string; treatment: string; optional: boolean }
function newLine(): DraftLine { return { id: Math.random().toString(36).slice(2), description: '', quantity: '1', unit: 'Stück', unitPrice: '', treatment: 'standard', optional: false }; }

function OfferComposer({ open, entityId, customers, onClose, onSaved, onError }: {
  open: boolean; entityId: string; customers: CustomerOption[];
  onClose: () => void; onSaved: (id: string) => void; onError: (message: string) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const validDefault = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
  const [customerId, setCustomerId] = useState('');
  const [title, setTitle] = useState('');
  const [issueDate, setIssueDate] = useState(today);
  const [validUntil, setValidUntil] = useState(validDefault);
  const [intro, setIntro] = useState('');
  const [scope, setScope] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('14 Tage netto');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([newLine()]);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const customer = customers.find((c) => c.organizationId === customerId) ?? null;

  const computed = useMemo(() => lines.map((l) => {
    const price = toCents(l.unitPrice);
    const q = Math.round((Number(l.quantity.replace(',', '.')) || 0) * 1000);
    if (price == null || q <= 0) return { line: l, calc: null };
    return { line: l, calc: computeInvoiceLine(q, price, rateFor(l.treatment), l.treatment as never) };
  }), [lines]);

  const totals = useMemo(() => computed.reduce((acc, { line, calc }) => {
    if (!calc || line.optional) return acc;
    return { net: acc.net + calc.netCents, vat: acc.vat + calc.vatCents, gross: acc.gross + calc.grossCents };
  }, { net: 0, vat: 0, gross: 0 }), [computed]);

  const updateLine = (id: string, patch: Partial<DraftLine>) => setLines((cur) => cur.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const removeLine = (id: string) => setLines((cur) => (cur.length > 1 ? cur.filter((l) => l.id !== id) : cur));

  const save = async () => {
    setFormError(null);
    if (!title.trim()) { setFormError('Titel ist erforderlich.'); return; }
    const lineInputs: OfferLineInput[] = computed.filter(({ calc }) => calc != null).map(({ line }, idx) => ({
      description: line.description.trim(), quantity_milli: Math.round((Number(line.quantity.replace(',', '.')) || 0) * 1000),
      unit: line.unit, unit_price_cents: toCents(line.unitPrice) ?? 0, vat_rate_bp: rateFor(line.treatment),
      vat_treatment: line.treatment, is_optional: line.optional, sort_order: idx,
    })).filter((l) => l.description.length > 0);
    if (lineInputs.some((l) => !l.is_optional) === false) { setFormError('Mindestens eine nicht-optionale Position ist erforderlich.'); return; }
    setBusy(true);
    const header = {
      business_entity_id: entityId, organization_id: customer?.organizationId ?? null, client_account_id: customer?.clientAccountId ?? null,
      title: title.trim(), issue_date: issueDate || null, valid_until: validUntil || null,
      introduction: intro.trim() || null, scope: scope.trim() || null, payment_terms: paymentTerms.trim() || null, internal_notes: notes.trim() || null,
    };
    const { id, error } = await createOffer(header, lineInputs);
    setBusy(false);
    if (error || !id) { onError(error ?? 'Unbekannter Fehler'); return; }
    onSaved(id);
  };

  return (
    <SlideOver open={open} onClose={busy ? () => {} : onClose} title="Angebot erstellen"
      description="Als Entwurf speichern; finalisieren und PDF/Link erzeugen Sie anschließend in der Angebotsansicht."
      width="xl"
      footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Abbrechen</Button><Button onClick={() => void save()} loading={busy}>Als Entwurf speichern</Button></>}>
      <div className="space-y-6">
        <Card className="p-5">
          <SectionHeader title="Rahmendaten" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select id="customer" label="CRM-Kunde" value={customerId} onChange={setCustomerId}
              options={[{ value: '', label: '— Kein CRM-Kunde —' }, ...customers.map((c) => ({ value: c.organizationId, label: c.name }))]} />
            <Field id="title" label="Titel" value={title} onChange={setTitle} placeholder="Website Relaunch" required />
            <Field id="issue" label="Angebotsdatum" type="date" value={issueDate} onChange={setIssueDate} />
            <Field id="valid" label="Gültig bis" type="date" value={validUntil} onChange={setValidUntil} />
          </div>
          {customer ? <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/70 p-4 text-[13px] text-gray-600"><p className="font-semibold text-gray-950">{customer.legalName ?? customer.name}</p>{customer.email ? <p className="mt-0.5">{customer.email}</p> : null}</div> : null}
        </Card>

        <Card className="p-5">
          <SectionHeader title="Inhalt" />
          <div className="space-y-4">
            <Textarea id="intro" label="Einleitung" value={intro} onChange={setIntro} rows={2} />
            <Textarea id="scope" label="Leistungsumfang" value={scope} onChange={setScope} rows={3} />
          </div>
        </Card>

        <Card className="p-5">
          <SectionHeader title="Positionen" action={<Button size="sm" variant="secondary" icon={Plus} onClick={() => setLines((c) => [...c, newLine()])}>Position</Button>} />
          <div className="space-y-3">
            {computed.map(({ line, calc }, idx) => (
              <div key={line.id} className="rounded-xl border border-gray-100 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Position {idx + 1}{line.optional ? ' · optional' : ''}</span>
                  {lines.length > 1 ? <IconButton icon={Trash2} label="Position entfernen" variant="ghost" onClick={() => removeLine(line.id)} /> : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-12">
                  <div className="sm:col-span-12"><Field id={`d-${line.id}`} label="Beschreibung" value={line.description} onChange={(v) => updateLine(line.id, { description: v })} /></div>
                  <div className="sm:col-span-2"><Field id={`q-${line.id}`} label="Menge" value={line.quantity} onChange={(v) => updateLine(line.id, { quantity: v })} inputMode="decimal" /></div>
                  <div className="sm:col-span-2"><Select id={`u-${line.id}`} label="Einheit" value={line.unit} onChange={(v) => updateLine(line.id, { unit: v })} options={[{ value: 'Stück', label: 'Stück' }, { value: 'Std.', label: 'Stunden' }, { value: 'Tag', label: 'Tage' }, { value: 'Pauschal', label: 'Pauschal' }, { value: 'Monat', label: 'Monate' }]} /></div>
                  <div className="sm:col-span-3"><Field id={`p-${line.id}`} label="Einzelpreis netto" prefix="€" value={line.unitPrice} onChange={(v) => updateLine(line.id, { unitPrice: v })} inputMode="decimal" placeholder="1000,00" /></div>
                  <div className="sm:col-span-5"><Select id={`t-${line.id}`} label="USt-Behandlung" value={line.treatment} onChange={(v) => updateLine(line.id, { treatment: v })} options={treatments} /></div>
                </div>
                <label className="mt-3 flex items-center gap-2 text-[12px] text-gray-500">
                  <input type="checkbox" checked={line.optional} onChange={(e) => updateLine(line.id, { optional: e.target.checked })} className="h-3.5 w-3.5 rounded border-gray-300" />
                  Optionale Position (nicht in Summe)
                </label>
                {calc ? <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[12px] text-gray-500"><span>Netto <span className="font-semibold tabular-nums text-gray-700">{formatCents(calc.netCents)}</span></span><span>Brutto <span className="font-semibold tabular-nums text-gray-900">{formatCents(calc.grossCents)}</span></span></div> : null}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <SectionHeader title="Bedingungen & Vorschau" />
          <Field id="pt" label="Zahlungsbedingungen" value={paymentTerms} onChange={setPaymentTerms} />
          <div className="mt-3"><Textarea id="notes" label="Interne Notizen (nicht im Dokument)" value={notes} onChange={setNotes} rows={2} /></div>
          <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/70 p-4">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Netto (ohne optionale)</dt><dd className="tabular-nums font-medium text-gray-900">{formatCents(totals.net)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Umsatzsteuer</dt><dd className="tabular-nums font-medium text-gray-900">{formatCents(totals.vat)}</dd></div>
              <div className="flex justify-between border-t border-gray-200 pt-2"><dt className="font-semibold text-gray-950">Gesamt brutto</dt><dd className="tabular-nums text-base font-semibold text-gray-950">{formatCents(totals.gross)}</dd></div>
            </dl>
          </div>
          {formError ? <p className="mt-3 text-[13px] text-red-600">{formError}</p> : null}
          <InfoBanner tone="info" title="Server-autoritative Nummerierung">Die Angebotsnummer wird erst beim Finalisieren vergeben.</InfoBanner>
        </Card>
      </div>
    </SlideOver>
  );
}
