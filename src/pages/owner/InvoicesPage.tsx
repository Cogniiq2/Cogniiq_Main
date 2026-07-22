import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Trash2 } from 'lucide-react';

import {
  Button, Card, ConfirmDialog, DataTable, EmptyState, ErrorState, IconButton, InfoBanner, KpiCard,
  Modal, PageHeader, SlideOver, StatusBadge, Tabs, TableSkeleton, Field, Select, Textarea, SectionHeader,
  useToast, type Column,
} from '@/components/dashboard';
import { invoiceStatusTone } from '@/pages/owner/ownerUi';
import { useOwnerEntity } from '@/pages/owner/ownerContext';
import {
  createOwnerInvoice, deleteDraftInvoice, issueOwnerInvoice, loadInvoices, recordInvoicePayment, setInvoiceStatus,
  type InvoiceLineInput,
} from '@/lib/ownerFinance/api';
import { loadAdminClients } from '@/lib/clientPlatform/adminApi';
import { computeInvoiceLine } from '@/lib/ownerFinance/tax';
import { formatCents, parseAmountToCents } from '@/lib/clientPlatform/validation';
import type { OwnerInvoice } from '@/lib/ownerFinance/types';
import { ExportMenu } from '@/components/finance/ExportMenu';
import { runFinanceExport } from '@/lib/ownerFinance/financeExportRunner';
import {
  invoiceExportTable, invoiceReportModel, invoiceMetadataSheet,
} from '@/lib/ownerFinance/exports/datasets';
import type { ExportFormat, ExportMode, ExportMeta } from '@/lib/ownerFinance/exports';

const invoiceTreatments = [
  { value: 'standard', label: 'Standard 19 %' },
  { value: 'reduced', label: 'Ermäßigt 7 %' },
  { value: 'zero_rated', label: 'Nullsatz 0 %' },
  { value: 'exempt', label: 'Steuerfrei (§4 UStG)' },
  { value: 'reverse_charge', label: 'Reverse Charge' },
  { value: 'outside_scope', label: 'Nicht steuerbar' },
  { value: 'unknown', label: 'Prüfung erforderlich' },
];

const statusLabel: Record<string, string> = {
  draft: 'Entwurf', issued: 'Gestellt', partially_paid: 'Teilbezahlt', paid: 'Bezahlt',
  overdue: 'Überfällig', void: 'Storniert', cancelled: 'Storniert', credited: 'Gutgeschrieben',
};

function rateForTreatment(t: string): number {
  return t === 'reduced' ? 700 : t === 'standard' ? 1900 : 0;
}
function toCents(input: string): number | null {
  const p = parseAmountToCents(input);
  return 'error' in p ? null : p.cents;
}

interface CustomerOption { organizationId: string; clientAccountId: string | null; name: string; email: string | null; legalName: string | null }

export function InvoicesPage() {
  const { entity } = useOwnerEntity();
  const toast = useToast();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<OwnerInvoice[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [composerOpen, setComposerOpen] = useState(false);
  const [payFor, setPayFor] = useState<OwnerInvoice | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<OwnerInvoice | null>(null);
  const [confirmVoid, setConfirmVoid] = useState<OwnerInvoice | null>(null);
  const [includeIds, setIncludeIds] = useState(false);

  const load = useCallback(async () => {
    if (!entity) return;
    setLoading(true);
    try {
      const [inv, clients] = await Promise.all([loadInvoices(entity.id), loadAdminClients().catch(() => [])]);
      setInvoices(inv);
      setCustomers(clients.map((c) => ({ organizationId: c.organizationId, clientAccountId: c.account?.id ?? null, name: c.organizationName, email: c.account?.primary_email ?? null, legalName: c.account?.legal_name ?? null })));
      setError(null);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, [entity]);

  useEffect(() => { void load(); }, [load]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: invoices.length };
    for (const i of invoices) c[i.status] = (c[i.status] ?? 0) + 1;
    return c;
  }, [invoices]);

  const filtered = useMemo(
    () => invoices.filter((i) => statusFilter === 'all' || i.status === statusFilter),
    [invoices, statusFilter],
  );

  const customerName = useCallback((inv: OwnerInvoice): string => {
    const c = customers.find((x) => x.organizationId === inv.organization_id);
    return c ? (c.legalName ?? c.name) : inv.organization_id ? 'CRM-Kunde' : '—';
  }, [customers]);

  const statusFilterLabel = statusFilter === 'all' ? 'Alle Status' : (statusLabel[statusFilter] ?? statusFilter);

  const runExport = async (format: ExportFormat, mode: ExportMode) => {
    if (!entity) return;
    // 'current' respects the active status filter; 'all' exports every invoice.
    const rows = mode === 'all' ? invoices : filtered;
    const meta: ExportMeta = {
      entityName: entity.display_name,
      valueBasis: 'actual',
      filtersLabel: mode === 'all' ? 'Alle' : statusFilterLabel,
      mode,
    };
    const table = invoiceExportTable(rows, customerName) as never;
    const spec = {
      entityId: entity.id,
      exportType: 'invoices',
      baseFilename: 'Rechnungen',
      meta,
      table,
      metadataSheet: invoiceMetadataSheet(rows, meta),
      reportModel: invoiceReportModel(rows, meta, customerName),
      jsonPayload: { invoices: rows },
      snapshot: rows.map((r) => ({ id: r.id, status: r.status, gross: r.gross_total_cents, paid: r.amount_paid_cents })),
      counts: { invoices: rows.length },
      includeIds,
    };
    try {
      const { warning } = await runFinanceExport(format, mode, spec);
      if (warning) toast.error('Hinweis zum Export', warning);
      else toast.success('Export erstellt', `${format.toUpperCase()} · ${rows.length} Rechnungen`);
    } catch (e: unknown) {
      toast.error('Export fehlgeschlagen', e instanceof Error ? e.message : String(e));
    }
  };

  const issue = async (inv: OwnerInvoice) => {
    const { error: err } = await issueOwnerInvoice(inv.id);
    if (err) { toast.error('Rechnung konnte nicht gestellt werden', err); return; }
    toast.success('Rechnung gestellt', 'Die Server-Rechnungsnummer wurde vergeben.');
    void load();
  };

  const totals = useMemo(() => {
    const outstanding = invoices.filter((i) => ['issued', 'partially_paid', 'overdue'].includes(i.status)).reduce((s, i) => s + (i.gross_total_cents - i.amount_paid_cents), 0);
    const overdue = invoices.filter((i) => i.status === 'overdue').reduce((s, i) => s + (i.gross_total_cents - i.amount_paid_cents), 0);
    const drafts = invoices.filter((i) => i.status === 'draft').length;
    return { outstanding, overdue, drafts };
  }, [invoices]);

  const columns: Column<OwnerInvoice>[] = [
    { key: 'number', header: 'Nummer', render: (inv) => <span className="font-semibold text-gray-950">{inv.invoice_number ?? 'Entwurf'}</span>, hideOnMobile: true },
    { key: 'status', header: 'Status', render: (inv) => <StatusBadge label={statusLabel[inv.status] ?? inv.status} tone={invoiceStatusTone[inv.status]} /> },
    { key: 'date', header: 'Datum', render: (inv) => <span className="text-gray-500">{inv.issue_date ?? '—'}</span> },
    { key: 'net', header: 'Netto', align: 'right', render: (inv) => <span className="tabular-nums">{formatCents(inv.net_total_cents, inv.currency)}</span> },
    { key: 'gross', header: 'Brutto', align: 'right', render: (inv) => <span className="tabular-nums font-medium text-gray-900">{formatCents(inv.gross_total_cents, inv.currency)}</span> },
    { key: 'open', header: 'Offen', align: 'right', render: (inv) => <span className="tabular-nums">{formatCents(inv.gross_total_cents - inv.amount_paid_cents, inv.currency)}</span> },
    {
      key: 'actions', header: '', align: 'right', render: (inv) => (
        <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {inv.status === 'draft' ? <Button size="sm" onClick={() => void issue(inv)}>Stellen</Button> : null}
          {inv.status === 'draft' ? <IconButton icon={Trash2} label="Entwurf löschen" onClick={() => setConfirmDelete(inv)} /> : null}
          {['issued', 'partially_paid', 'overdue'].includes(inv.status) ? <Button size="sm" variant="secondary" onClick={() => setPayFor(inv)}>Zahlung</Button> : null}
          {inv.status !== 'void' && inv.status !== 'paid' && inv.status !== 'draft' ? <Button size="sm" variant="ghost" onClick={() => setConfirmVoid(inv)}>Storno</Button> : null}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Rechnungen"
        description="Rechnungen mit serverseitig berechneten Beträgen und server-autoritativer Nummernvergabe. Gebuchte Rechnungen werden storniert, nicht gelöscht."
        actions={
          <div className="flex items-center gap-2">
            <ExportMenu
              onExport={runExport}
              disabled={!entity || invoices.length === 0}
              includeIds={includeIds}
              onIncludeIdsChange={setIncludeIds}
              modes={[
                { value: 'current', label: 'Aktuelle Ansicht', count: filtered.length },
                { value: 'all', label: 'Alle Rechnungen', count: invoices.length },
              ]}
            />
            <Button icon={Plus} onClick={() => setComposerOpen(true)} disabled={!entity}>Neue Rechnung</Button>
          </div>
        }
      />

      {error ? <div className="mb-6"><ErrorState message={error} onRetry={() => void load()} /></div> : null}

      {!loading && invoices.length > 0 ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <KpiCard label="Offene Forderungen" valueCents={totals.outstanding} basis="actual" />
          <KpiCard label="Überfällig" valueCents={totals.overdue} basis="actual" tone={totals.overdue > 0 ? 'negative' : 'neutral'} />
          <KpiCard label="Entwürfe" value={String(totals.drafts)} basis="actual" hint="noch nicht gestellt" />
        </div>
      ) : null}

      <div className="mb-4">
        <Tabs
          value={statusFilter}
          onChange={setStatusFilter}
          tabs={[
            { value: 'all', label: 'Alle', count: counts.all },
            { value: 'draft', label: 'Entwurf', count: counts.draft },
            { value: 'issued', label: 'Gestellt', count: counts.issued },
            { value: 'partially_paid', label: 'Teilbezahlt', count: counts.partially_paid },
            { value: 'overdue', label: 'Überfällig', count: counts.overdue },
            { value: 'paid', label: 'Bezahlt', count: counts.paid },
          ]}
        />
      </div>

      {loading ? <TableSkeleton rows={5} cols={6} /> : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={invoices.length === 0 ? 'Noch keine Rechnungen' : 'Keine Rechnungen in diesem Status'}
          description={invoices.length === 0 ? 'Erstellen Sie Ihre erste Rechnung, um Umsatz und Forderungen zu erfassen. Es werden keine Beispieldaten angezeigt.' : 'Passen Sie den Statusfilter an, um weitere Rechnungen zu sehen.'}
          action={invoices.length === 0 ? <Button icon={Plus} onClick={() => setComposerOpen(true)} disabled={!entity}>Neue Rechnung</Button> : undefined}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          getRowKey={(inv) => inv.id}
          onRowClick={(inv) => navigate(`/admin/finance/invoices/${inv.id}`)}
          minWidth={820}
          mobileTitle={(inv) => (
            <div className="flex items-center gap-2">
              <span>{inv.invoice_number ?? 'Entwurf'}</span>
              <StatusBadge label={statusLabel[inv.status] ?? inv.status} tone={invoiceStatusTone[inv.status]} />
            </div>
          )}
          mobileSubtitle={(inv) => `${inv.issue_date ?? 'ohne Datum'}`}
        />
      )}

      {entity ? (
        <InvoiceComposer
          open={composerOpen}
          entityId={entity.id}
          customers={customers}
          onClose={() => setComposerOpen(false)}
          onSaved={(msg) => { setComposerOpen(false); toast.success(msg); void load(); }}
          onError={(m) => toast.error('Rechnung konnte nicht gespeichert werden', m)}
        />
      ) : null}

      <PaymentDialog
        invoice={payFor}
        onClose={() => setPayFor(null)}
        onDone={() => { setPayFor(null); toast.success('Zahlung erfasst'); void load(); }}
        onError={(m) => toast.error('Zahlung fehlgeschlagen', m)}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        tone="danger"
        title="Entwurf löschen?"
        message="Nur nie gestellte Entwürfe können gelöscht werden. Diese Aktion kann nicht rückgängig gemacht werden."
        confirmLabel="Löschen"
        onConfirm={async () => {
          if (!confirmDelete) return;
          const { error: err } = await deleteDraftInvoice(confirmDelete.id);
          setConfirmDelete(null);
          if (err) { toast.error('Löschen nicht möglich', err); return; }
          toast.success('Entwurf gelöscht');
          void load();
        }}
      />

      <ConfirmDialog
        open={!!confirmVoid}
        onClose={() => setConfirmVoid(null)}
        title="Rechnung stornieren?"
        message="Die Rechnung bleibt zur Historie erhalten (kein Löschen). Der Status wird auf storniert gesetzt."
        confirmLabel="Stornieren"
        onConfirm={async () => {
          if (!confirmVoid) return;
          const { error: err } = await setInvoiceStatus(confirmVoid.id, 'void');
          setConfirmVoid(null);
          if (err) { toast.error('Storno fehlgeschlagen', err); return; }
          toast.success('Rechnung storniert');
          void load();
        }}
      />
    </>
  );
}

/* ------------------------------------------------------------------ Composer */

interface DraftLine { id: string; description: string; quantity: string; unit: string; unitPrice: string; treatment: string }

function newLine(): DraftLine {
  return { id: Math.random().toString(36).slice(2), description: '', quantity: '1', unit: 'Stück', unitPrice: '', treatment: 'standard' };
}

function InvoiceComposer({ open, entityId, customers, onClose, onSaved, onError }: {
  open: boolean;
  entityId: string;
  customers: CustomerOption[];
  onClose: () => void;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [customerId, setCustomerId] = useState('');
  const [issueDate, setIssueDate] = useState(today);
  const [serviceMode, setServiceMode] = useState<'date' | 'period'>('date');
  const [serviceDate, setServiceDate] = useState(today);
  const [servicePeriodStart, setServicePeriodStart] = useState('');
  const [servicePeriodEnd, setServicePeriodEnd] = useState('');
  const [terms, setTerms] = useState('14');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([newLine()]);
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const reset = () => {
    setCustomerId(''); setIssueDate(today); setServiceMode('date'); setServiceDate(today);
    setServicePeriodStart(''); setServicePeriodEnd(''); setTerms('14'); setNotes('');
    setLines([newLine()]); setFieldErrors({});
  };

  const dueDate = useMemo(() => {
    const days = Number(terms);
    if (!Number.isFinite(days) || !issueDate) return '';
    const d = new Date(issueDate); d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }, [issueDate, terms]);

  const customer = customers.find((c) => c.organizationId === customerId) ?? null;

  const computedLines = useMemo(() => lines.map((l) => {
    const price = toCents(l.unitPrice);
    const q = Math.round((Number(l.quantity.replace(',', '.')) || 0) * 1000);
    if (price == null || q <= 0) return { line: l, calc: null };
    return { line: l, calc: computeInvoiceLine(q, price, rateForTreatment(l.treatment), l.treatment as never) };
  }), [lines]);

  const totals = useMemo(() => computedLines.reduce((acc, { calc }) => {
    if (!calc) return acc;
    return { net: acc.net + calc.netCents, vat: acc.vat + calc.vatCents, gross: acc.gross + calc.grossCents };
  }, { net: 0, vat: 0, gross: 0 }), [computedLines]);

  const updateLine = (id: string, patch: Partial<DraftLine>) => setLines((cur) => cur.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const removeLine = (id: string) => setLines((cur) => (cur.length > 1 ? cur.filter((l) => l.id !== id) : cur));

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    let anyValid = false;
    lines.forEach((l) => {
      if (!l.description.trim() && !l.unitPrice.trim()) return;
      if (!l.description.trim()) errs[`desc-${l.id}`] = 'Beschreibung erforderlich';
      const price = toCents(l.unitPrice);
      if (price == null) errs[`price-${l.id}`] = 'Ungültiger Preis';
      const q = Math.round((Number(l.quantity.replace(',', '.')) || 0) * 1000);
      if (q <= 0) errs[`qty-${l.id}`] = 'Ungültige Menge';
      if (l.description.trim() && price != null && q > 0) anyValid = true;
    });
    if (!anyValid) errs.form = 'Mindestens eine vollständige Position ist erforderlich.';
    if (serviceMode === 'period' && (!servicePeriodStart || !servicePeriodEnd)) errs.form = 'Leistungszeitraum unvollständig.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const buildPayload = (): { header: Record<string, unknown>; lineInputs: InvoiceLineInput[] } => {
    const lineInputs: InvoiceLineInput[] = computedLines
      .filter(({ calc }) => calc != null)
      .map(({ line }, idx) => ({
        description: line.description.trim(),
        quantity_milli: Math.round((Number(line.quantity.replace(',', '.')) || 0) * 1000),
        unit_price_cents: toCents(line.unitPrice) ?? 0,
        vat_rate_bp: rateForTreatment(line.treatment),
        vat_treatment: line.treatment,
        sort_order: idx,
      }));
    const header: Record<string, unknown> = {
      business_entity_id: entityId,
      organization_id: customer?.organizationId ?? null,
      client_account_id: customer?.clientAccountId ?? null,
      issue_date: issueDate || null,
      service_date: serviceMode === 'date' ? serviceDate || null : null,
      service_period_start: serviceMode === 'period' ? servicePeriodStart || null : null,
      service_period_end: serviceMode === 'period' ? servicePeriodEnd || null : null,
      due_date: dueDate || null,
      currency: 'EUR',
      notes: notes.trim() || null,
    };
    return { header, lineInputs };
  };

  const save = async (issueAfter: boolean) => {
    if (!validate()) return;
    setBusy(true);
    const { header, lineInputs } = buildPayload();
    const { id, error } = await createOwnerInvoice(header, lineInputs);
    if (error || !id) { setBusy(false); onError(error ?? 'Unbekannter Fehler'); return; }
    if (issueAfter) {
      const { error: issueErr } = await issueOwnerInvoice(id);
      setBusy(false);
      if (issueErr) { onError(`Entwurf gespeichert, Stellen fehlgeschlagen: ${issueErr}`); return; }
      reset();
      onSaved('Rechnung gestellt — Nummer serverseitig vergeben.');
      return;
    }
    setBusy(false);
    reset();
    onSaved('Entwurf gespeichert.');
  };

  return (
    <SlideOver
      open={open}
      onClose={busy ? () => {} : onClose}
      title="Rechnung erstellen"
      description="Serverseitige Berechnung und Nummernvergabe. Sie geben keine finale Rechnungsnummer ein."
      width="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>Abbrechen</Button>
          <Button variant="secondary" onClick={() => void save(false)} loading={busy}>Als Entwurf speichern</Button>
          <Button onClick={() => void save(true)} loading={busy}>Rechnung stellen</Button>
        </>
      }
    >
      <div className="space-y-6">
        <Card className="p-5">
          <SectionHeader title="Empfänger & Rahmendaten" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              id="customer"
              label="CRM-Kunde"
              value={customerId}
              onChange={setCustomerId}
              options={[{ value: '', label: '— Kein CRM-Kunde —' }, ...customers.map((c) => ({ value: c.organizationId, label: c.name }))]}
              hint="Optional. Verknüpft die Rechnung mit dem CRM-Konto."
            />
            <Field id="issueDate" label="Rechnungsdatum" type="date" value={issueDate} onChange={setIssueDate} />
            <Select id="serviceMode" label="Leistung" value={serviceMode} onChange={(v) => setServiceMode(v as 'date' | 'period')} options={[{ value: 'date', label: 'Leistungsdatum' }, { value: 'period', label: 'Leistungszeitraum' }]} />
            {serviceMode === 'date' ? (
              <Field id="serviceDate" label="Leistungsdatum" type="date" value={serviceDate} onChange={setServiceDate} />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Field id="spStart" label="Zeitraum von" type="date" value={servicePeriodStart} onChange={setServicePeriodStart} />
                <Field id="spEnd" label="Zeitraum bis" type="date" value={servicePeriodEnd} onChange={setServicePeriodEnd} />
              </div>
            )}
            <Select id="terms" label="Zahlungsziel" value={terms} onChange={setTerms} options={[{ value: '0', label: 'Sofort' }, { value: '7', label: '7 Tage' }, { value: '14', label: '14 Tage' }, { value: '30', label: '30 Tage' }]} />
            <Field id="due" label="Fällig am" type="date" value={dueDate} onChange={() => {}} disabled hint="Aus Rechnungsdatum + Zahlungsziel" />
          </div>
          {customer ? (
            <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/70 p-4 text-[13px] text-gray-600">
              <p className="font-semibold text-gray-950">{customer.legalName ?? customer.name}</p>
              {customer.email ? <p className="mt-0.5">{customer.email}</p> : null}
            </div>
          ) : null}
        </Card>

        <Card className="p-5">
          <SectionHeader title="Positionen" action={<Button size="sm" variant="secondary" icon={Plus} onClick={() => setLines((c) => [...c, newLine()])}>Position</Button>} />
          <div className="space-y-3">
            {computedLines.map(({ line, calc }, idx) => (
              <div key={line.id} className="rounded-xl border border-gray-100 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Position {idx + 1}</span>
                  {lines.length > 1 ? <IconButton icon={Trash2} label="Position entfernen" variant="ghost" onClick={() => removeLine(line.id)} /> : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-12">
                  <div className="sm:col-span-12"><Field id={`desc-${line.id}`} label="Beschreibung" value={line.description} onChange={(v) => updateLine(line.id, { description: v })} placeholder="Beratung / Entwicklung" error={fieldErrors[`desc-${line.id}`]} /></div>
                  <div className="sm:col-span-2"><Field id={`qty-${line.id}`} label="Menge" value={line.quantity} onChange={(v) => updateLine(line.id, { quantity: v })} inputMode="decimal" error={fieldErrors[`qty-${line.id}`]} /></div>
                  <div className="sm:col-span-2"><Select id={`unit-${line.id}`} label="Einheit" value={line.unit} onChange={(v) => updateLine(line.id, { unit: v })} options={[{ value: 'Stück', label: 'Stück' }, { value: 'Std.', label: 'Stunden' }, { value: 'Tag', label: 'Tage' }, { value: 'Pauschal', label: 'Pauschal' }, { value: 'Monat', label: 'Monate' }]} /></div>
                  <div className="sm:col-span-3"><Field id={`price-${line.id}`} label="Einzelpreis netto" prefix="€" value={line.unitPrice} onChange={(v) => updateLine(line.id, { unitPrice: v })} inputMode="decimal" placeholder="1000,00" error={fieldErrors[`price-${line.id}`]} /></div>
                  <div className="sm:col-span-5"><Select id={`treat-${line.id}`} label="USt-Behandlung" value={line.treatment} onChange={(v) => updateLine(line.id, { treatment: v })} options={invoiceTreatments} /></div>
                </div>
                {calc ? (
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[12px] text-gray-500">
                    <span>Netto <span className="font-semibold tabular-nums text-gray-700">{formatCents(calc.netCents)}</span></span>
                    <span>USt <span className="font-semibold tabular-nums text-gray-700">{formatCents(calc.vatCents)}</span></span>
                    <span>Brutto <span className="font-semibold tabular-nums text-gray-900">{formatCents(calc.grossCents)}</span></span>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <SectionHeader title="Notizen & Vorschau" />
          <Textarea id="notes" label="Interne Notizen (optional)" value={notes} onChange={setNotes} rows={2} />
          <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/70 p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Vorschau der Summen</p>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Zwischensumme netto</dt><dd className="tabular-nums font-medium text-gray-900">{formatCents(totals.net)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Umsatzsteuer</dt><dd className="tabular-nums font-medium text-gray-900">{formatCents(totals.vat)}</dd></div>
              <div className="flex justify-between border-t border-gray-200 pt-2"><dt className="font-semibold text-gray-950">Gesamt brutto</dt><dd className="tabular-nums text-base font-semibold text-gray-950">{formatCents(totals.gross)}</dd></div>
            </dl>
          </div>
          {fieldErrors.form ? <p className="mt-3 text-[13px] text-red-600">{fieldErrors.form}</p> : null}
          <InfoBanner tone="info" title="Server-autoritative Nummerierung">
            Die finale Rechnungsnummer wird erst beim Stellen concurrency-sicher pro Geschäftseinheit vergeben — nicht manuell.
          </InfoBanner>
        </Card>
      </div>
    </SlideOver>
  );
}

/* ------------------------------------------------------------------ Payment */

const paymentMethods = [
  { value: 'bank_transfer', label: 'Überweisung' },
  { value: 'card', label: 'Karte' },
  { value: 'cash', label: 'Bar' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'other', label: 'Sonstige' },
];

function PaymentDialog({ invoice, onClose, onDone, onError }: {
  invoice: OwnerInvoice | null;
  onClose: () => void;
  onDone: () => void;
  onError: (message: string) => void;
}) {
  const outstanding = invoice ? invoice.gross_total_cents - invoice.amount_paid_cents : 0;
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState('bank_transfer');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (invoice) { setAmount((outstanding / 100).toFixed(2).replace('.', ',')); setErr(null); setReference(''); setNote(''); setMethod('bank_transfer'); setDate(new Date().toISOString().slice(0, 10)); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice?.id]);

  const submit = async () => {
    if (!invoice) return;
    setErr(null);
    const cents = toCents(amount);
    if (cents == null || cents <= 0) { setErr('Bitte einen gültigen Betrag eingeben.'); return; }
    if (cents > outstanding) { setErr(`Betrag übersteigt den offenen Betrag (${formatCents(outstanding)}).`); return; }
    setBusy(true);
    const { error } = await recordInvoicePayment(invoice.id, cents, date, { method, reference: reference.trim() || null, note: note.trim() || null });
    setBusy(false);
    if (error) { onError(error); return; }
    onDone();
  };

  return (
    <Modal
      open={!!invoice}
      onClose={busy ? () => {} : onClose}
      title="Zahlung erfassen"
      description={invoice?.invoice_number ? `Rechnung ${invoice.invoice_number}` : undefined}
      footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Abbrechen</Button><Button onClick={() => void submit()} loading={busy}>Zahlung buchen</Button></>}
    >
      <div className="mb-4 flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3">
        <span className="text-[13px] text-gray-500">Offener Betrag</span>
        <span className="text-base font-semibold tabular-nums text-gray-950">{formatCents(outstanding)}</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="payAmount" label="Zahlungsbetrag" prefix="€" value={amount} onChange={setAmount} inputMode="decimal" required autoFocus />
        <Field id="payDate" label="Zahlungsdatum" type="date" value={date} onChange={setDate} required />
        <Select id="payMethod" label="Zahlungsart" value={method} onChange={setMethod} options={paymentMethods} />
        <Field id="payRef" label="Referenz" value={reference} onChange={setReference} placeholder="Verwendungszweck" />
        <div className="sm:col-span-2"><Textarea id="payNote" label="Notiz (optional)" value={note} onChange={setNote} rows={2} /></div>
      </div>
      {err ? <p className="mt-3 text-[13px] text-red-600">{err}</p> : null}
    </Modal>
  );
}
