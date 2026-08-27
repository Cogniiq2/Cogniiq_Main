import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, FileText, Plus, Trash2 } from 'lucide-react';

import {
  Button, Card, ConfirmDialog, DataTable, EmptyState, ErrorState, IconButton, InfoBanner, KpiCard,
  Modal, PageHeader, SlideOver, StatusBadge, Tabs, TableSkeleton, Field, Select, Textarea, SectionHeader,
  useToast, type Column,
} from '@/components/dashboard';
import { invoiceStatusTone } from '@/pages/owner/ownerUi';
import { useOwnerEntity } from '@/pages/owner/ownerContext';
import {
  createOwnerInvoice, deleteDraftInvoice, issueOwnerInvoice, loadInvoices, recordHistoricalPaidInvoice,
  recordInvoicePayment, OWNER_HISTORICAL_INVOICE_MIGRATION,
  type InvoiceLineInput,
} from '@/lib/ownerFinance/api';
import { cancelInvoice, loadCustomers } from '@/lib/ownerFinance/customersApi';
import { customerDisplayName } from '@/lib/ownerFinance/customerLabels';
import { CustomerFormDialog } from '@/components/finance/CustomerFormDialog';
import { computeInvoiceLine } from '@/lib/ownerFinance/tax';
import { PAYMENT_METHOD_OPTIONS } from '@/lib/ownerFinance/paymentMethods';
import { recordHistoricalInvoiceWithPayments, type InvoicePaymentInput, type InvoicePaymentKind } from '@/lib/ownerFinance/financeExtendedApi';
import { formatCents, parseAmountToCents } from '@/lib/clientPlatform/validation';
import type { OwnerCustomerListRow, OwnerInvoice } from '@/lib/ownerFinance/types';
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

/**
 * The invoice composer selects from the SAME table the CRM writes to. It used to
 * read loadAdminClients() (organizations + client_accounts) while the CRM page
 * read owner_customers, which is why a customer created here never appeared
 * there. There is no second list any more and nothing to synchronise.
 *
 * Archived customers are filtered out of the selector but still resolve for
 * existing invoices, so an old invoice never renders as "unknown customer".
 */
function selectableCustomers(rows: OwnerCustomerListRow[]): OwnerCustomerListRow[] {
  return rows.filter((c) => c.status !== 'archived');
}

export function InvoicesPage() {
  const { entity } = useOwnerEntity();
  const toast = useToast();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<OwnerInvoice[]>([]);
  const [customers, setCustomers] = useState<OwnerCustomerListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [composerOpen, setComposerOpen] = useState(false);
  const [historicalOpen, setHistoricalOpen] = useState(false);
  const [payFor, setPayFor] = useState<OwnerInvoice | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<OwnerInvoice | null>(null);
  const [confirmVoid, setConfirmVoid] = useState<OwnerInvoice | null>(null);
  const [includeIds, setIncludeIds] = useState(false);

  const load = useCallback(async () => {
    if (!entity) return;
    setLoading(true);
    try {
      const [inv, custs] = await Promise.all([loadInvoices(entity.id), loadCustomers(entity.id).catch(() => [])]);
      setInvoices(inv);
      setCustomers(custs);
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
    const c = customers.find((x) => x.id === inv.owner_customer_id);
    if (c) return customerDisplayName(c);
    // Pre-migration rows may still carry only the tenant link.
    return inv.organization_id ? 'Nicht zugeordnet' : '—';
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
    {
      key: 'status', header: 'Status', render: (inv) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge label={statusLabel[inv.status] ?? inv.status} tone={invoiceStatusTone[inv.status]} />
          {inv.historical_entry ? <StatusBadge label="Historisch erfasst" tone="neutral" /> : null}
        </div>
      ),
    },
    { key: 'date', header: 'Datum', render: (inv) => <span className="text-gray-500">{inv.issue_date ?? '—'}</span> },
    { key: 'net', header: 'Netto', align: 'right', render: (inv) => <span className="tabular-nums">{formatCents(inv.net_total_cents, inv.currency)}</span> },
    { key: 'gross', header: 'Brutto', align: 'right', render: (inv) => <span className="tabular-nums font-medium text-gray-900">{formatCents(inv.gross_total_cents, inv.currency)}</span> },
    // A legacy overpaid invoice must not read as a negative receivable; the excess is
    // surfaced as its own amber figure instead. Accounting values are untouched.
    { key: 'open', header: 'Offen', align: 'right', render: (inv) => (inv.amount_paid_cents > inv.gross_total_cents
      ? <span className="tabular-nums text-amber-700" title="Überzahlung aus Altbestand">{formatCents(0, inv.currency)} <span className="text-[11px]">(+{formatCents(inv.amount_paid_cents - inv.gross_total_cents, inv.currency)})</span></span>
      : <span className="tabular-nums">{formatCents(inv.gross_total_cents - inv.amount_paid_cents, inv.currency)}</span>) },
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
            <Button variant="secondary" icon={Archive} onClick={() => setHistoricalOpen(true)} disabled={!entity}>
              Bereits bezahlte Rechnung erfassen
            </Button>
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
        <>
          <InvoiceComposer
            open={composerOpen}
            entityId={entity.id}
            customers={customers}
            onClose={() => setComposerOpen(false)}
            onSaved={(msg) => { setComposerOpen(false); toast.success(msg); void load(); }}
            onError={(m) => toast.error('Rechnung konnte nicht gespeichert werden', m)}
            onCustomerCreated={async () => { await load(); }}
          />
          {/* Same composer, historical mode: identical customer/position/USt logic,
              a payment block instead of the draft/issue footer, and a server path
              that cannot notify the customer. */}
          <InvoiceComposer
            mode="historical"
            open={historicalOpen}
            entityId={entity.id}
            customers={customers}
            onClose={() => setHistoricalOpen(false)}
            onSaved={(msg) => { setHistoricalOpen(false); toast.success(msg, 'Es wurde keine E-Mail an den Kunden versendet.'); void load(); }}
            onError={(m) => toast.error('Rechnung konnte nicht erfasst werden', m)}
            onCustomerCreated={async () => { await load(); }}
          />
        </>
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
        message={
          <>
            <p>
              Der Rechnungsentwurf über{' '}
              <span className="font-semibold text-gray-950">
                {confirmDelete ? formatCents(confirmDelete.gross_total_cents, confirmDelete.currency) : ''}
              </span>{' '}
              wird dauerhaft gelöscht.
            </p>
            <p className="mt-2">
              Diese Aktion kann nicht rückgängig gemacht werden. Nur nie gestellte Entwürfe können
              gelöscht werden — gestellte Rechnungen werden storniert.
            </p>
          </>
        }
        confirmLabel="Entwurf löschen"
        onConfirm={async () => {
          if (!confirmDelete) return;
          const { error: err } = await deleteDraftInvoice(confirmDelete.id);
          setConfirmDelete(null);
          if (err) { toast.error('Löschen nicht möglich', err); return; }
          toast.success('Entwurf gelöscht');
          void load();
        }}
      />

{/*
        Storno, deliberately NOT labelled as deletion. The invoice row, its
        number, its totals and its lines are retained (§147 AO); only the status
        changes and the cancellation is recorded with actor and time.
      */}
      <ConfirmDialog
        open={!!confirmVoid}
        onClose={() => setConfirmVoid(null)}
        title="Rechnung stornieren?"
        message={
          <>
            <p>
              <span className="font-semibold text-gray-950">
                {confirmVoid?.invoice_number ?? 'Diese Rechnung'}
              </span>{' '}
              wird storniert.
            </p>
            <p className="mt-2">
              Die Rechnung wird <span className="font-semibold">nicht gelöscht</span>: Nummer, Beträge
              und Positionen bleiben unverändert erhalten. Sie verschwindet aus der aktiven Ansicht
              und trägt künftig den Status „Storniert“.
            </p>
          </>
        }
        confirmLabel="Rechnung stornieren"
        onConfirm={async () => {
          if (!confirmVoid) return;
          const { error: err } = await cancelInvoice(confirmVoid.id, null);
          setConfirmVoid(null);
          if (err) { toast.error('Storno fehlgeschlagen', err); return; }
          toast.success('Rechnung storniert', 'Die Rechnung bleibt vollständig erhalten.');
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

/** One real payment against a historical invoice. Amounts stay strings until validated. */
interface DraftPayment { id: string; date: string; amount: string; method: string; reference: string; kind: InvoicePaymentKind }

function newPayment(date: string): DraftPayment {
  return { id: Math.random().toString(36).slice(2), date, amount: '', method: 'bank_transfer', reference: '', kind: 'invoice_payment' };
}

const PAYMENT_KIND_OPTIONS: Array<{ value: InvoicePaymentKind; label: string }> = [
  { value: 'invoice_payment', label: 'Zahlung (am/nach Rechnungsdatum)' },
  { value: 'advance_payment', label: 'Anzahlung vor Rechnungsstellung' },
];

/**
 * 'normal'     — draft → optional issuance, the untouched original flow.
 * 'historical' — a real invoice that was already issued AND already paid before
 *                it reached Cogniiq. Same customer, position and USt logic; the
 *                difference is a payment block and a single atomic server call.
 */
type ComposerMode = 'normal' | 'historical';

function InvoiceComposer({ mode = 'normal', open, entityId, customers, onClose, onSaved, onError, onCustomerCreated }: {
  mode?: ComposerMode;
  open: boolean;
  entityId: string;
  customers: OwnerCustomerListRow[];
  onClose: () => void;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
  /** Inline creation writes to the canonical table; the page reloads so the new
   *  customer is selectable here and visible in the CRM without a refresh. */
  onCustomerCreated: (customerId: string) => Promise<void>;
}) {
  const historical = mode === 'historical';
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
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);
  // Historical mode only. Real invoices are often settled in instalments, so this is a
  // LIST of payments, each keeping its own date — never collapsed into one synthetic
  // payment. Payment dates stay a separate fact from issueDate in both directions.
  const [payments, setPayments] = useState<DraftPayment[]>([newPayment(today)]);
  const [externalReference, setExternalReference] = useState('');
  const [serviceTouched, setServiceTouched] = useState(false);

  /**
   * Historical mode: a past invoice's Leistungsdatum sits near its Rechnungsdatum,
   * not near today. While the owner has not edited it themselves, it follows the
   * invoice date — otherwise a backdated invoice would silently carry today's
   * service date, which under Soll-Versteuerung would land its USt in the wrong
   * period. Once edited, the entered value is never overwritten.
   */
  const setIssueDateSynced = (value: string) => {
    setIssueDate(value);
    if (historical && !serviceTouched && value) setServiceDate(value);
  };

  const reset = () => {
    setCustomerId(''); setIssueDate(today); setServiceMode('date'); setServiceDate(today);
    setServicePeriodStart(''); setServicePeriodEnd(''); setTerms('14'); setNotes('');
    setLines([newLine()]); setFieldErrors({}); setServiceTouched(false);
    setPayments([newPayment(today)]); setExternalReference('');
  };

  const dueDate = useMemo(() => {
    const days = Number(terms);
    if (!Number.isFinite(days) || !issueDate) return '';
    const d = new Date(issueDate); d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }, [issueDate, terms]);

  const customer = customers.find((c) => c.id === customerId) ?? null;

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

  /** Live sum of the payment rows, for the Bezahlt/Offen reconciliation panel. */
  const paymentsTotal = useMemo(
    () => payments.reduce((sum, pay) => sum + (toCents(pay.amount) ?? 0), 0),
    [payments],
  );

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
    if (historical) {
      if (!issueDate) errs.issueDate = 'Rechnungsdatum erforderlich';
      if (payments.length === 0) errs.form = 'Mindestens eine Zahlung ist erforderlich.';
      let sum = 0;
      payments.forEach((pay) => {
        if (!pay.date) errs['payDate-' + pay.id] = 'Datum erforderlich';
        // Date-only string compare: both are YYYY-MM-DD, so this is a calendar
        // comparison with no Date parsing and no timezone shift.
        //
        // The two kinds are disjoint: an ordinary payment cannot predate the invoice, and
        // an Anzahlung must. A date before the invoice is no longer simply wrong — it is
        // wrong for THIS kind, and the message says which of the two to change.
        else if (issueDate && pay.kind === 'invoice_payment' && pay.date < issueDate) {
          errs['payDate-' + pay.id] = 'Vor dem Rechnungsdatum — als Anzahlung erfassen';
        } else if (issueDate && pay.kind === 'advance_payment' && pay.date >= issueDate) {
          errs['payDate-' + pay.id] = 'Anzahlung muss vor dem Rechnungsdatum liegen';
        }
        const cents = toCents(pay.amount);
        if (cents == null || cents <= 0) errs['payAmount-' + pay.id] = 'Ungültiger Betrag';
        else sum += cents;
      });
      // The server rejects this too; catching it here keeps the owner from losing a
      // long form to a round trip.
      if (sum > totals.gross) errs.form = 'Die Zahlungen übersteigen den Rechnungsbetrag.';
    }
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
      owner_customer_id: customer?.id ?? null,
      organization_id: customer?.organization_id ?? null,
      client_account_id: customer?.client_account_id ?? null,
      issue_date: issueDate || null,
      service_date: serviceMode === 'date' ? serviceDate || null : null,
      service_period_start: serviceMode === 'period' ? servicePeriodStart || null : null,
      service_period_end: serviceMode === 'period' ? servicePeriodEnd || null : null,
      // A settled historical invoice has no meaningful payment term, and the
      // Zahlungsziel control is not shown for it. Sending null lets the server
      // fall back to the invoice date rather than inventing issue_date + 14.
      due_date: historical ? null : (dueDate || null),
      currency: 'EUR',
      notes: notes.trim() || null,
      // Historical entries keep the owner's ORIGINAL document reference here.
      // It is deliberately non-authoritative: the canonical RE-YYYY-NNNN number
      // is still assigned server-side and is never typed in the browser.
      ...(historical && externalReference.trim() ? { external_reference: externalReference.trim() } : {}),
    };
    return { header, lineInputs };
  };

  /**
   * Historical entry. ONE server call that creates, issues and pays in a single
   * transaction, so this can never leave an issued-but-unpaid invoice behind —
   * a settled past transaction can never become an accidental open receivable.
   * The paid amount is not sent: the server settles against its own computed
   * gross, guaranteeing status "Bezahlt" and an open balance of exactly zero.
   */
  const saveHistorical = async () => {
    if (!validate()) return;
    setBusy(true);
    const { header, lineInputs } = buildPayload();
    const paymentInputs: InvoicePaymentInput[] = payments.map((pay) => ({
      payment_date: pay.date,
      amount_cents: toCents(pay.amount) ?? 0,
      method: pay.method,
      reference: pay.reference.trim() || null,
      note: null,
      payment_kind: pay.kind,
    }));
    const paidSum = paymentInputs.reduce((a, b) => a + b.amount_cents, 0);

    // One payment settling the invoice in full keeps using the ORIGINAL RPC, whose
    // settle-or-fail guarantee is the stronger contract for that case. Instalments and
    // partial settlements go through the additive multi-payment path.
    //
    // An advance is excluded from that shortcut even when it is the only payment: the
    // original RPC predates the second payment kind and would silently record it as an
    // ordinary payment, then reject it for predating the invoice.
    const singleFullPayment = paymentInputs.length === 1
      && paidSum === totals.gross
      && paymentInputs[0].payment_kind === 'invoice_payment';
    const { result, error, backendMissing } = singleFullPayment
      ? await recordHistoricalPaidInvoice(header, lineInputs, {
          payment_date: paymentInputs[0].payment_date,
          method: paymentInputs[0].method ?? 'bank_transfer',
          reference: paymentInputs[0].reference,
          note: null,
        })
      : await recordHistoricalInvoiceWithPayments(header, lineInputs, paymentInputs);
    setBusy(false);
    if (error || !result) {
      onError(backendMissing
        ? `Der Erfassungspfad für bereits bezahlte Rechnungen ist in dieser Umgebung noch nicht installiert. Bitte die Migration ${OWNER_HISTORICAL_INVOICE_MIGRATION} anwenden.`
        : (error ?? 'Unbekannter Fehler'));
      return;
    }
    reset();
    onSaved(`Bezahlte Rechnung ${result.invoice_number ?? ''} erfasst.`.replace('  ', ' '));
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
      title={historical ? 'Bereits bezahlte Rechnung erfassen' : 'Rechnung erstellen'}
      description={
        historical
          ? 'Für bereits abgeschlossene Rechnungen und Zahlungen. Es wird keine E-Mail an den Kunden versendet.'
          : 'Serverseitige Berechnung und Nummernvergabe. Sie geben keine finale Rechnungsnummer ein.'
      }
      width="xl"
      footer={
        historical ? (
          <>
            <Button variant="secondary" onClick={onClose} disabled={busy}>Abbrechen</Button>
            <Button onClick={() => void saveHistorical()} loading={busy}>Als bezahlt erfassen</Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose} disabled={busy}>Abbrechen</Button>
            <Button variant="secondary" onClick={() => void save(false)} loading={busy}>Als Entwurf speichern</Button>
            <Button onClick={() => void save(true)} loading={busy}>Rechnung stellen</Button>
          </>
        )
      }
    >
      <div className="space-y-6">
        {/* The old wording promised an open balance of 0,00 €. That stopped being true when
            instalments arrived: a historical invoice may legitimately end up only partly
            settled, and claiming otherwise would misdescribe what the owner is about to save. */}
        {historical ? (
          <InfoBanner tone="info" title="Rückwirkende Erfassung – ohne Kundenkontakt">
            Diese Rechnung wird rein intern erfasst. Sie können eine oder mehrere bereits
            erhaltene Zahlungen eintragen; Rechnungsdatum und Zahlungsdaten bleiben getrennt
            erhalten. Je nach Summe der Zahlungen ergibt sich der Status <span className="font-semibold">Teilbezahlt</span> oder
            {' '}<span className="font-semibold">Bezahlt</span>. Es wird <span className="font-semibold">keine
            E-Mail, keine Zahlungserinnerung und keine Benachrichtigung</span> an den Kunden versendet.
          </InfoBanner>
        ) : null}
        <Card className="p-5">
          <SectionHeader title="Empfänger & Rahmendaten" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Select
                id="customer"
                label="Kunde"
                value={customerId}
                onChange={setCustomerId}
                options={[
                  { value: '', label: '— Kein Kunde —' },
                  ...selectableCustomers(customers).map((c) => ({ value: c.id, label: customerDisplayName(c) })),
                ]}
                hint="Derselbe Kundenstamm wie unter „Kunden & Aufgaben“."
              />
              <button
                type="button"
                onClick={() => setNewCustomerOpen(true)}
                className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-gray-600 underline-offset-2 hover:text-gray-900 hover:underline"
              >
                <Plus size={13} aria-hidden="true" />
                Neuen Kunden anlegen
              </button>
            </div>
            <Field id="issueDate" label="Rechnungsdatum" type="date" value={issueDate} onChange={setIssueDateSynced} error={fieldErrors.issueDate} hint={historical ? 'Datum der ursprünglichen Rechnung' : undefined} />
            <Select id="serviceMode" label="Leistung" value={serviceMode} onChange={(v) => setServiceMode(v as 'date' | 'period')} options={[{ value: 'date', label: 'Leistungsdatum' }, { value: 'period', label: 'Leistungszeitraum' }]} />
            {serviceMode === 'date' ? (
              <Field id="serviceDate" label="Leistungsdatum" type="date" value={serviceDate} onChange={(v) => { setServiceTouched(true); setServiceDate(v); }} />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Field id="spStart" label="Zeitraum von" type="date" value={servicePeriodStart} onChange={setServicePeriodStart} />
                <Field id="spEnd" label="Zeitraum bis" type="date" value={servicePeriodEnd} onChange={setServicePeriodEnd} />
              </div>
            )}
            {historical ? (
              <Field
                id="externalReference"
                label="Ursprüngliche Rechnungsnummer / Beleg (optional)"
                value={externalReference}
                onChange={setExternalReference}
                placeholder="z. B. 2026-014"
                hint="Nur als Beleghinweis. Die verbindliche Nummer vergibt der Server."
              />
            ) : (
              <>
                <Select id="terms" label="Zahlungsziel" value={terms} onChange={setTerms} options={[{ value: '0', label: 'Sofort' }, { value: '7', label: '7 Tage' }, { value: '14', label: '14 Tage' }, { value: '30', label: '30 Tage' }]} />
                <Field id="due" label="Fällig am" type="date" value={dueDate} onChange={() => {}} disabled hint="Aus Rechnungsdatum + Zahlungsziel" />
              </>
            )}
          </div>
          {customer ? (
            <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/70 p-4 text-[13px] text-gray-600">
              <p className="font-semibold text-gray-950">{customerDisplayName(customer)}</p>
              {customer.contact_name && customer.company ? <p className="mt-0.5">{customer.contact_name}</p> : null}
              {customer.email ? <p className="mt-0.5">{customer.email}</p> : null}
              {customer.street || customer.postal_code || customer.city ? (
                <p className="mt-0.5">
                  {[customer.street, [customer.postal_code, customer.city].filter(Boolean).join(' ')]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              ) : null}
            </div>
          ) : null}

          <CustomerFormDialog
            open={newCustomerOpen}
            onClose={() => setNewCustomerOpen(false)}
            entityId={entityId}
            onSaved={async (id) => {
              setNewCustomerOpen(false);
              await onCustomerCreated(id);
              setCustomerId(id);
            }}
          />
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

        {historical ? (
          <Card className="p-5">
            <SectionHeader
              title="Zahlungen"
              description="Eine Rechnung kann in mehreren Raten beglichen worden sein. Jede Zahlung behält ihr eigenes Datum — das bestimmt die steuerliche Periode und bleibt vom Rechnungsdatum unabhängig. Anzahlungen, die nachweislich vor der Schlussrechnung eingegangen sind, werden als solche erfasst; ihr echtes Eingangsdatum bleibt erhalten."
              action={<Button size="sm" variant="secondary" onClick={() => setPayments((rows) => [...rows, newPayment(issueDate || today)])}>+ Zahlung hinzufügen</Button>}
            />
            <div className="space-y-3">
              {payments.map((pay, idx) => (
                <div key={pay.id} className="rounded-xl border border-gray-100 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">
                      {pay.kind === 'advance_payment' ? 'Anzahlung' : 'Zahlung'} {idx + 1}
                    </span>
                    {payments.length > 1 ? (
                      <button type="button" onClick={() => setPayments((rows) => rows.filter((r) => r.id !== pay.id))}
                        className="text-[12px] text-gray-400 hover:text-gray-900">Entfernen</button>
                    ) : null}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {/* Explicit, never inferred from the date. A receipt that arrived before
                        the final invoice is a different accounting fact, not a typo, and only
                        the owner knows which of the two it was. */}
                    <Select id={'payKind-' + pay.id} label="Art der Zahlung" value={pay.kind} options={PAYMENT_KIND_OPTIONS}
                      onChange={(v) => setPayments((rows) => rows.map((r) => (r.id === pay.id ? { ...r, kind: v as InvoicePaymentKind } : r)))} />
                    <Field id={'payDate-' + pay.id} label="Zahlungsdatum" type="date" value={pay.date} required
                      error={fieldErrors['payDate-' + pay.id]}
                      hint={pay.kind === 'advance_payment' ? 'Muss vor dem Rechnungsdatum liegen' : undefined}
                      onChange={(v) => setPayments((rows) => rows.map((r) => (r.id === pay.id ? { ...r, date: v } : r)))} />
                    <Field id={'payAmount-' + pay.id} label="Betrag (brutto)" value={pay.amount} required inputMode="decimal" prefix="€"
                      error={fieldErrors['payAmount-' + pay.id]}
                      onChange={(v) => setPayments((rows) => rows.map((r) => (r.id === pay.id ? { ...r, amount: v } : r)))} />
                    <Select id={'payMethod-' + pay.id} label="Zahlungsart" value={pay.method} options={paymentMethods}
                      onChange={(v) => setPayments((rows) => rows.map((r) => (r.id === pay.id ? { ...r, method: v } : r)))} />
                    <Field id={'payRef-' + pay.id} label="Referenz (optional)" value={pay.reference} placeholder="z. B. Abschlag 1"
                      onChange={(v) => setPayments((rows) => rows.map((r) => (r.id === pay.id ? { ...r, reference: v } : r)))} />
                  </div>
                </div>
              ))}
            </div>
            {/* Live reconciliation so the owner sees the open balance before saving. */}
            <dl className="mt-4 space-y-1.5 rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3 text-[13px]">
              <div className="flex justify-between"><dt className="text-gray-500">Rechnungsbetrag</dt><dd className="tabular-nums text-gray-700">{formatCents(totals.gross)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Zahlungen</dt><dd className="tabular-nums text-gray-700">{formatCents(paymentsTotal)}</dd></div>
              <div className="flex justify-between border-t border-gray-200 pt-1.5">
                <dt className="font-semibold text-gray-950">Noch offen</dt>
                <dd className="tabular-nums font-semibold text-gray-950">{formatCents(Math.max(totals.gross - paymentsTotal, 0))}</dd>
              </div>
              <div className="pt-1">
                <StatusBadge
                  label={paymentsTotal >= totals.gross && totals.gross > 0 ? 'Vollständig bezahlt' : paymentsTotal > 0 ? 'Teilweise bezahlt' : 'Noch keine Zahlung'}
                  tone={paymentsTotal >= totals.gross && totals.gross > 0 ? 'success' : paymentsTotal > 0 ? 'warning' : 'neutral'} />
              </div>
            </dl>
          </Card>
        ) : null}

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
            {historical
              ? 'Auch rückwirkend erfasste Rechnungen erhalten ihre Nummer aus derselben fortlaufenden Reihe der Geschäftseinheit — concurrency-sicher und nicht manuell.'
              : 'Die finale Rechnungsnummer wird erst beim Stellen concurrency-sicher pro Geschäftseinheit vergeben — nicht manuell.'}
          </InfoBanner>
        </Card>
      </div>
    </SlideOver>
  );
}

/* ------------------------------------------------------------------ Payment */

// Single source of truth, shared with InvoiceDetailPage so the same stored token can never
// render as "Überweisung" on one screen and "bank_transfer" on the next.
const paymentMethods = PAYMENT_METHOD_OPTIONS;

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
