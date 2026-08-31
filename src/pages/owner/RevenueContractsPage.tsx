// Laufende Verträge — recurring customer revenue, plus the structured bulk import.
//
// TWO IDEAS, KEPT APART ON PURPOSE
// --------------------------------
// A contract is a FORECAST: what a customer has committed to pay. It is labelled ERWARTET
// everywhere and is never added to paid revenue, EÜR or VAT. Money only becomes real when a
// month is deliberately posted, which creates an actual invoice (optionally with actual
// payments). The dashboard must never let those two numbers blur together, because one is a
// promise and the other is a tax fact.
//
// NOTHING ON THIS PAGE CONTACTS A CUSTOMER. Creating a contract, posting a month and running
// an import are internal bookkeeping writes: no email, no reminder, no automation job, no
// bank connection. "Monat verbuchen" pre-fills and waits for an explicit confirmation.

import { useCallback, useEffect, useState } from 'react';

import {
  Button, DataTable, EmptyState, ErrorState, Field, InfoBanner, Modal, SectionHeader,
  StatBand, StatBandSkeleton, StatusBadge, TableSkeleton, WorkspaceHeader, useToast,
  type Column, type StatItem,
} from '@/components/dashboard';
import { Repeat } from 'lucide-react';

import { useOwnerEntity } from '@/pages/owner/ownerContext';
import { RevenueContractFormDialog } from '@/components/finance/RevenueContractFormDialog';
import { loadCustomers } from '@/lib/ownerFinance/customersApi';
import type { OwnerCustomerListRow } from '@/lib/ownerFinance/types';
import { formatCents } from '@/lib/clientPlatform/validation';
import { formatDateDe } from '@/lib/ownerFinance/exports';
import {
  loadRevenueContractOverview, postRevenueContractMonth, runBulkImport, resolveImportCustomers,
  setRevenueContractStatus, OWNER_FINANCE_EXTENDED_MIGRATION,
  type RevenueContractOverview, type RevenueContractRow,
} from '@/lib/ownerFinance/financeExtendedApi';
import { describeSupabaseError } from '@/lib/ownerFinance/api';
import {
  applyCustomerResolutions, bulkImportTemplate, parseBulkImport, type BulkImportPreview,
} from '@/lib/ownerFinance/bulkImport';

const statusLabel: Record<string, string> = { active: 'Aktiv', paused: 'Pausiert', ended: 'Beendet' };
const statusTone: Record<string, 'success' | 'warning' | 'neutral'> = { active: 'success', paused: 'warning', ended: 'neutral' };
const frequencyLabel: Record<string, string> = { monthly: 'monatlich', quarterly: 'quartalsweise', yearly: 'jährlich' };

/** First day of the month after the last posted period — the natural next thing to book. */
function nextPeriodStart(row: RevenueContractRow): string {
  const base = row.last_posted_period_start ? new Date(row.last_posted_period_start) : new Date(row.start_date);
  if (row.last_posted_period_start) {
    const step = row.billing_frequency === 'yearly' ? 12 : row.billing_frequency === 'quarterly' ? 3 : 1;
    base.setMonth(base.getMonth() + step);
  }
  return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}-01`;
}

export function RevenueContractsPage() {
  const { entity } = useOwnerEntity();
  const toast = useToast();
  const [overview, setOverview] = useState<RevenueContractOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [postTarget, setPostTarget] = useState<RevenueContractRow | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [customers, setCustomers] = useState<OwnerCustomerListRow[]>([]);

  const load = useCallback(async () => {
    if (!entity) return;
    setLoading(true);
    try {
      const [ov, custs] = await Promise.all([
        loadRevenueContractOverview(entity.id),
        loadCustomers(entity.id).catch(() => [] as OwnerCustomerListRow[]),
      ]);
      setOverview(ov); setCustomers(custs); setError(null);
    }
    catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, [entity]);

  useEffect(() => { void load(); }, [load]);

  const contracts = overview?.contracts ?? [];

  const columns: Column<RevenueContractRow>[] = [
    { key: 'name', header: 'Vertrag', render: (c) => <span className="font-semibold text-gray-950">{c.name}</span> },
    { key: 'status', header: 'Status', render: (c) => <StatusBadge label={statusLabel[c.status] ?? c.status} tone={statusTone[c.status] ?? 'neutral'} /> },
    {
      key: 'amount', header: 'Erwartet', align: 'right', render: (c) => (
        <div className="text-right">
          <div className="tabular-nums font-medium text-gray-900">{formatCents(c.expected_net_cents, c.currency)} netto</div>
          <div className="text-[11px] text-gray-400">{formatCents(c.expected_gross_cents, c.currency)} brutto · {frequencyLabel[c.billing_frequency]}</div>
        </div>
      ),
    },
    { key: 'start', header: 'Start', hideOnMobile: true, render: (c) => <span className="text-gray-500">{formatDateDe(c.start_date)}</span> },
    { key: 'end', header: 'Ende', hideOnMobile: true, render: (c) => <span className="text-gray-500">{c.end_date ? formatDateDe(c.end_date) : '—'}</span> },
    {
      key: 'next', header: 'Nächster Zeitraum', hideOnMobile: true, render: (c) => (
        <span className="text-gray-500">
          {c.status === 'active' ? formatDateDe(nextPeriodStart(c)) : '—'}
          {c.posted_count > 0 ? <span className="ml-2 text-[11px] text-gray-400">{c.posted_count} verbucht</span> : null}
        </span>
      ),
    },
    {
      key: 'actions', header: '', align: 'right', render: (c) => (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          {c.status === 'active' ? (
            <Button size="sm" variant="secondary" onClick={() => setPostTarget(c)}>Monat verbuchen</Button>
          ) : null}
          {c.status === 'active' ? (
            <button className="text-[12px] text-gray-400 hover:text-gray-900"
              onClick={() => void changeStatus(c, 'paused')}>Pausieren</button>
          ) : c.status === 'paused' ? (
            <button className="text-[12px] text-gray-400 hover:text-gray-900"
              onClick={() => void changeStatus(c, 'active')}>Fortsetzen</button>
          ) : null}
        </div>
      ),
    },
  ];

  const changeStatus = async (c: RevenueContractRow, status: 'active' | 'paused' | 'ended') => {
    const { error: err } = await setRevenueContractStatus(c.contract_id, status);
    if (err) { toast.error('Status konnte nicht geändert werden', err); return; }
    toast.success(`Vertrag ${statusLabel[status].toLowerCase()}`);
    void load();
  };

  /** The contract forecast, labelled so it can never be mistaken for booked revenue. */
  const contractStats = (o: NonNullable<typeof overview>): StatItem[] => [
    { key: 'mrr', label: 'MRR (netto) · erwartet', value: formatCents(o.mrr_net_cents), hint: 'vertraglich vereinbart, nicht verbucht', lead: true },
    { key: 'arr', label: 'ARR (netto) · erwartet', value: formatCents(o.arr_net_cents), hint: '12 × MRR' },
    { key: 'mrrg', label: 'MRR (brutto) · erwartet', value: formatCents(o.mrr_gross_cents), hint: 'inkl. USt' },
    { key: 'count', label: 'Aktive Verträge', value: String(o.active_contract_count), hint: 'laufend' },
  ];

  return (
    <>
      <WorkspaceHeader
        eyebrow="Einnahmen"
        title="Laufende Verträge"
        subtitle="Wiederkehrende Kundenumsätze. Diese Werte sind vertraglich erwartet — sie werden erst zu tatsächlichem Umsatz, wenn Sie einen Monat verbuchen. Es wird nie automatisch etwas an Kunden versendet."
        actions={
          <>
            <Button variant="secondary" onClick={() => setImportOpen(true)} disabled={!entity}>Schnellimport</Button>
            <Button onClick={() => setCreateOpen(true)} disabled={!entity}>Vertrag anlegen</Button>
          </>
        }
      />

      {error ? <div className="mb-4"><ErrorState message={error} onRetry={() => void load()} /></div> : null}

      {/* FORECAST figures. Every label says "erwartet" or "vertraglich": without that these
          numbers look like revenue, which they are not. */}
      {loading ? (
        <div className="mb-4"><StatBandSkeleton count={4} /></div>
      ) : overview ? (
        <div className="mb-4">
          <StatBand items={contractStats(overview)} />
        </div>
      ) : null}

      <div className="mb-6">
        <InfoBanner tone="info" title="Erwartet ist nicht bezahlt">
          MRR und ARR sind Planwerte aus Ihren Verträgen. Sie fließen nicht in EÜR, Umsatzsteuer
          oder „Tatsächlich bezahlt" ein. Tatsächlicher Umsatz entsteht ausschließlich durch
          Rechnung und Zahlung.
        </InfoBanner>
      </div>

      {loading ? <TableSkeleton rows={4} cols={5} /> : contracts.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="Noch keine laufenden Verträge"
          description="Laufende Kundenverträge erscheinen hier mit MRR, ARR und dem nächsten abrechenbaren Zeitraum. Legen Sie einen Vertrag direkt an oder importieren Sie mehrere auf einmal."
          action={
            <div className="flex items-center gap-2">
              <Button onClick={() => setCreateOpen(true)}>+ Vertrag anlegen</Button>
              <Button variant="secondary" onClick={() => setImportOpen(true)}>Schnellimport</Button>
            </div>
          }
        />
      ) : (
        <DataTable columns={columns} rows={contracts} getRowKey={(c) => c.contract_id} minWidth={900}
          mobileTitle={(c) => <span>{c.name}</span>}
          mobileSubtitle={(c) => `${formatCents(c.expected_net_cents, c.currency)} netto ${frequencyLabel[c.billing_frequency]}`} />
      )}

      <PostMonthModal
        contract={postTarget}
        onClose={() => setPostTarget(null)}
        onDone={(msg) => { setPostTarget(null); toast.success(msg); void load(); }}
        onError={(m) => toast.error('Verbuchung fehlgeschlagen', m)}
      />

      <RevenueContractFormDialog
        open={createOpen}
        entityId={entity?.id ?? null}
        customers={customers}
        onClose={() => setCreateOpen(false)}
        onCreated={(msg) => { setCreateOpen(false); toast.success('Vertrag angelegt', msg); void load(); }}
        onError={(m) => toast.error('Vertrag konnte nicht angelegt werden', m)}
      />

      <BulkImportModal
        open={importOpen}
        entityId={entity?.id ?? null}
        onClose={() => setImportOpen(false)}
        onDone={(msg) => { setImportOpen(false); toast.success(msg); void load(); }}
        onError={(m) => toast.error('Import fehlgeschlagen', m)}
      />
    </>
  );
}

/* ------------------------------------------------------------------ Monat verbuchen */

/**
 * Pre-fills one billing period and waits. Nothing is written until the owner confirms, and
 * the payment is optional: if the money has not arrived yet, the month is booked as an open
 * invoice rather than being silently marked paid.
 */
function PostMonthModal({ contract, onClose, onDone, onError }: {
  contract: RevenueContractRow | null;
  onClose: () => void; onDone: (msg: string) => void; onError: (m: string) => void;
}) {
  const [periodStart, setPeriodStart] = useState('');
  const [alreadyPaid, setAlreadyPaid] = useState(false);
  const [paymentDate, setPaymentDate] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!contract) return;
    const next = nextPeriodStart(contract);
    setPeriodStart(next);
    setPaymentDate(next);
    setAlreadyPaid(false);
  }, [contract]);

  if (!contract) return null;

  const submit = async () => {
    setBusy(true);
    const { result, error } = await postRevenueContractMonth(
      contract.contract_id, periodStart,
      alreadyPaid ? [{ payment_date: paymentDate, amount_cents: contract.expected_gross_cents, method: 'bank_transfer', reference: contract.name }] : [],
    );
    setBusy(false);
    if (error || !result) { onError(error ?? 'Unbekannter Fehler'); return; }
    onDone(`${contract.name}: Rechnung ${result.invoice_number ?? ''} verbucht.`.replace('  ', ' '));
  };

  return (
    <Modal open={!!contract} onClose={onClose} title="Monat verbuchen">
      <div className="space-y-4">
        <div className="rounded-xl bg-gray-50 p-3 text-[13px]">
          <div className="flex justify-between"><span className="text-gray-500">Vertrag</span><span className="font-medium text-gray-900">{contract.name}</span></div>
          <div className="mt-1 flex justify-between"><span className="text-gray-500">Betrag</span><span className="tabular-nums font-medium text-gray-900">{formatCents(contract.expected_gross_cents, contract.currency)} brutto</span></div>
          <div className="mt-1 flex justify-between"><span className="text-gray-500">Intervall</span><span className="text-gray-700">{frequencyLabel[contract.billing_frequency]}</span></div>
        </div>

        <Field id="periodStart" label="Leistungszeitraum ab" type="date" value={periodStart} onChange={setPeriodStart} required />

        <label className="flex items-start gap-2 text-[13px] text-gray-700">
          <input type="checkbox" checked={alreadyPaid} onChange={(e) => setAlreadyPaid(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-gray-300" />
          <span>Betrag wurde bereits bezahlt — Zahlung mit erfassen</span>
        </label>
        {alreadyPaid ? <Field id="postPayDate" label="Zahlungsdatum" type="date" value={paymentDate} onChange={setPaymentDate} required /> : null}

        <p className="text-[12px] leading-relaxed text-gray-400">
          Es wird eine interne Rechnung für diesen Zeitraum erstellt. Es wird nichts an den
          Kunden versendet. Derselbe Zeitraum kann nicht zweimal verbucht werden.
        </p>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Abbrechen</Button>
          <Button onClick={() => void submit()} loading={busy} disabled={!periodStart}>Verbuchen</Button>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ Schnellimport */

/**
 * Paste → parse → validate → PREVIEW → confirm → one atomic server import.
 *
 * There is deliberately no paste-and-write path. The field takes the documented JSON schema
 * only; pasted SQL is refused outright rather than being forwarded anywhere.
 */
function BulkImportModal({ open, entityId, onClose, onDone, onError }: {
  open: boolean; entityId: string | null;
  onClose: () => void; onDone: (msg: string) => void; onError: (m: string) => void;
}) {
  const [raw, setRaw] = useState('');
  const [preview, setPreview] = useState<BulkImportPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [resolving, setResolving] = useState(false);

  useEffect(() => { if (open) { setRaw(''); setPreview(null); } }, [open]);

  const check = async () => {
    if (!entityId) return;
    setResolving(true);
    let p = parseBulkImport(raw, entityId);
    // Names are resolved server-side so the preview can show — before anything is written —
    // which customers are unknown or ambiguous.
    if (p.payload && p.unresolvedNames.length > 0) {
      // resolveImportCustomers RETURNS its failure already normalised, so there is no raw
      // PostgREST object here to stringify into "[object Object]". The try/catch remains for
      // a genuinely unexpected throw (network, aborted fetch) and normalises that too.
      try {
        const { resolutions, error, backendMissing } = await resolveImportCustomers(entityId, p.unresolvedNames);
        if (error) {
          const message = backendMissing
            ? `Der Kundenabgleich ist in dieser Umgebung noch nicht installiert. Bitte die Migration ${OWNER_FINANCE_EXTENDED_MIGRATION} anwenden.`
            : `Kundenabgleich fehlgeschlagen: ${error}`;
          p = { ...p, ok: false, errors: [...p.errors, { row: '—', message }] };
        } else {
          p = applyCustomerResolutions(p, resolutions);
        }
      } catch (e: unknown) {
        p = { ...p, ok: false, errors: [...p.errors, { row: '—', message: `Kundenabgleich fehlgeschlagen: ${describeSupabaseError(e)}` }] };
      }
    }
    setResolving(false);
    setPreview(p);
  };

  const confirm = async () => {
    if (!preview?.ok || !preview.payload) return;
    setBusy(true);
    const { result, error, backendMissing } = await runBulkImport(preview.payload);
    setBusy(false);
    if (error || !result) {
      onError(backendMissing
        ? `Der Import-Pfad ist in dieser Umgebung noch nicht installiert. Bitte die Migration ${OWNER_FINANCE_EXTENDED_MIGRATION} anwenden.`
        : (error ?? 'Unbekannter Fehler'));
      return;
    }
    onDone(`${result.invoice_count} Rechnungen, ${result.payment_count} Zahlungen und ${result.contract_count} Verträge importiert.`);
  };

  const copyTemplate = async () => {
    try { await navigator.clipboard.writeText(bulkImportTemplate()); }
    catch { /* clipboard unavailable — the template is still visible in the docs */ }
  };

  const money = (c: number) => formatCents(c, 'EUR');

  return (
    <Modal open={open} onClose={onClose} title="Schnellimport" size="lg">
      <div className="space-y-4">
        <SectionHeader
          title="Strukturierter JSON-Import"
          description="Rechnungen, Zahlungen und laufende Verträge in einem Schritt. Es wird ausschließlich das dokumentierte JSON-Format akzeptiert — kein SQL."
          action={<Button size="sm" variant="ghost" onClick={() => void copyTemplate()}>JSON-Vorlage kopieren</Button>}
        />

        <textarea
          value={raw}
          onChange={(e) => { setRaw(e.target.value); setPreview(null); }}
          rows={10}
          spellCheck={false}
          placeholder='{ "schema_version": 1, "invoices": [ … ] }'
          className="w-full rounded-xl border border-gray-200 bg-white p-3 font-mono text-[12px] text-gray-900 outline-none focus:border-gray-400"
        />

        {!preview ? (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>Abbrechen</Button>
            <Button onClick={() => void check()} loading={resolving} disabled={!raw.trim() || !entityId}>Prüfen</Button>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
              <p className="text-[13px] font-semibold text-gray-950">
                {preview.invoiceCount} Rechnungen · {preview.paymentCount} Zahlungen · {preview.contractCount} laufende Verträge
              </p>
              <dl className="mt-3 grid gap-1.5 text-[13px] sm:grid-cols-2">
                <div className="flex justify-between"><dt className="text-gray-500">Netto</dt><dd className="tabular-nums text-gray-800">{money(preview.netCents)}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">USt</dt><dd className="tabular-nums text-gray-800">{money(preview.vatCents)}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Brutto</dt><dd className="tabular-nums font-semibold text-gray-950">{money(preview.grossCents)}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Bezahlt</dt><dd className="tabular-nums text-emerald-700">{money(preview.paidCents)}</dd></div>
              </dl>
              <p className="mt-3 text-[11px] text-gray-400">
                Beträge sind eine Vorschau. Netto, USt, Brutto, Rechnungsnummer und Status werden
                beim Import serverseitig neu berechnet.
              </p>
            </div>

            {preview.errors.length > 0 ? (
              <div className="rounded-xl border border-red-100 bg-red-50/70 p-3">
                <p className="text-[13px] font-semibold text-red-800">{preview.errors.length} Problem(e) — Import nicht möglich</p>
                <ul className="mt-2 space-y-1 text-[12px] text-red-700">
                  {preview.errors.slice(0, 12).map((e, i) => <li key={i}><span className="font-medium">{e.row}:</span> {e.message}</li>)}
                  {preview.errors.length > 12 ? <li className="text-red-500">… und {preview.errors.length - 12} weitere</li> : null}
                </ul>
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-[13px] text-emerald-800">
                ✓ {preview.invoiceCount + preview.contractCount} Datensätze bereit
              </div>
            )}

            {preview.warnings.length > 0 ? (
              <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-3">
                <p className="text-[13px] font-semibold text-amber-800">Hinweise</p>
                <ul className="mt-2 space-y-1 text-[12px] text-amber-700">
                  {preview.warnings.slice(0, 8).map((w, i) => <li key={i}><span className="font-medium">{w.row}:</span> {w.message}</li>)}
                </ul>
              </div>
            ) : null}

            <p className="text-[12px] leading-relaxed text-gray-400">
              Der Import läuft in einer einzigen Transaktion: entweder alle Datensätze oder
              keiner. Es wird dabei nichts an Kunden versendet.
            </p>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setPreview(null)}>Zurück</Button>
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

export default RevenueContractsPage;
