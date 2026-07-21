import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Receipt, Trash2 } from 'lucide-react';

import {
  Button, Card, Checkbox, DataTable, EmptyState, ErrorState, IconButton, InfoBanner, KpiCard, Modal,
  PageHeader, SectionHeader, SlideOver, StatusBadge, Tabs, TableSkeleton, Field, Select, Textarea,
  useToast, type Column,
} from '@/components/dashboard';
import { expenseReviewTone, paymentStatusTone } from '@/pages/owner/ownerUi';
import { useOwnerEntity } from '@/pages/owner/ownerContext';
import {
  createOwnerExpense, loadCategories, loadExpenses, loadVendors, markExpenseReviewed, recordExpensePayment,
  type ExpenseLineInput,
} from '@/lib/ownerFinance/api';
import { loadAdminClients } from '@/lib/clientPlatform/adminApi';
import { computeExpenseLine, eligibleInputVat } from '@/lib/ownerFinance/tax';
import { formatCents, parseAmountToCents } from '@/lib/clientPlatform/validation';
import type { OwnerExpense, OwnerExpenseCategory, OwnerVendor } from '@/lib/ownerFinance/types';

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
  const [payFor, setPayFor] = useState<OwnerExpense | null>(null);
  const [filter, setFilter] = useState('all');

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

  const filtered = useMemo(() => {
    if (filter === 'review') return expenses.filter((e) => e.review_status !== 'reviewed');
    if (filter === 'unpaid') return expenses.filter((e) => e.payment_status === 'unpaid');
    if (filter === 'paid') return expenses.filter((e) => e.payment_status === 'paid');
    return expenses;
  }, [expenses, filter]);

  const totals = useMemo(() => ({
    net: expenses.reduce((s, e) => s + e.net_total_cents, 0),
    inputVat: expenses.reduce((s, e) => s + e.input_vat_cents, 0),
    unpaid: expenses.filter((e) => e.payment_status !== 'paid' && e.payment_status !== 'void').reduce((s, e) => s + (e.gross_total_cents - e.amount_paid_cents), 0),
  }), [expenses]);

  const catLabel = (id: string | null) => categories.find((c) => c.id === id)?.label ?? '—';

  const columns: Column<OwnerExpense>[] = [
    { key: 'date', header: 'Datum', render: (e) => <span className="text-gray-500">{e.invoice_date ?? '—'}</span> },
    { key: 'cat', header: 'Kategorie', render: (e) => <span className="font-medium text-gray-900">{catLabel(e.category_id)}</span> },
    { key: 'net', header: 'Netto', align: 'right', render: (e) => <span className="tabular-nums">{formatCents(e.net_total_cents, e.currency)}</span> },
    { key: 'vat', header: 'Vorsteuer', align: 'right', render: (e) => <span className="tabular-nums text-gray-500">{formatCents(e.input_vat_cents, e.currency)}</span> },
    { key: 'pay', header: 'Zahlung', render: (e) => <StatusBadge label={paymentLabel[e.payment_status] ?? e.payment_status} tone={paymentStatusTone[e.payment_status]} /> },
    { key: 'review', header: 'Prüfung', render: (e) => <StatusBadge label={reviewLabel[e.review_status] ?? e.review_status} tone={expenseReviewTone[e.review_status]} /> },
    {
      key: 'actions', header: '', align: 'right', render: (e) => (
        <div className="flex justify-end gap-1.5" onClick={(ev) => ev.stopPropagation()}>
          {e.payment_status !== 'paid' && e.payment_status !== 'void' ? <Button size="sm" variant="secondary" onClick={() => setPayFor(e)}>Zahlung</Button> : null}
          {e.review_status !== 'reviewed' ? <Button size="sm" variant="ghost" onClick={() => void markReviewed(e)}>Geprüft</Button> : null}
        </div>
      ),
    },
  ];

  const markReviewed = async (e: OwnerExpense) => {
    const { error: err } = await markExpenseReviewed(e.id);
    if (err) { toast.error('Aktualisierung fehlgeschlagen', err); return; }
    toast.success('Als geprüft markiert');
    void load();
  };

  return (
    <>
      <PageHeader
        title="Ausgaben"
        description="Betriebsausgaben mit USt-Behandlung, Vorsteuer-Abzugsfähigkeit und Betriebsanteil. Ausländische SaaS-Rechnungen werden nicht automatisch als voll abziehbar klassifiziert."
        actions={<Button icon={Plus} onClick={() => setComposerOpen(true)} disabled={!entity}>Ausgabe erfassen</Button>}
      />

      {error ? <div className="mb-6"><ErrorState message={error} onRetry={() => void load()} /></div> : null}

      {!loading && expenses.length > 0 ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <KpiCard label="Betriebsausgaben (netto)" valueCents={totals.net} basis="actual" />
          <KpiCard label="Vorsteuer erfasst" valueCents={totals.inputVat} basis="actual" />
          <KpiCard label="Offen (unbezahlt)" valueCents={totals.unpaid} basis="actual" tone={totals.unpaid > 0 ? 'negative' : 'neutral'} />
        </div>
      ) : null}

      <div className="mb-4">
        <Tabs value={filter} onChange={setFilter} tabs={[
          { value: 'all', label: 'Alle', count: counts.all },
          { value: 'review', label: 'Prüf-Queue', count: counts.review },
          { value: 'unpaid', label: 'Unbezahlt', count: counts.unpaid },
          { value: 'paid', label: 'Bezahlt', count: counts.paid },
        ]} />
      </div>

      {loading ? <TableSkeleton rows={5} cols={6} /> : filtered.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={expenses.length === 0 ? 'Noch keine Ausgaben' : 'Keine Ausgaben in dieser Ansicht'}
          description={expenses.length === 0 ? 'Erfassen Sie Betriebsausgaben, um Vorsteuer und EÜR-Ergebnis zu berechnen.' : 'Passen Sie den Filter an, um weitere Ausgaben zu sehen.'}
          action={expenses.length === 0 ? <Button icon={Plus} onClick={() => setComposerOpen(true)} disabled={!entity}>Ausgabe erfassen</Button> : undefined}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          getRowKey={(e) => e.id}
          minWidth={820}
          mobileTitle={(e) => <span>{catLabel(e.category_id)}</span>}
          mobileSubtitle={(e) => `${e.invoice_date ?? 'ohne Datum'} · ${e.supplier_invoice_number ?? ''}`}
        />
      )}

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
