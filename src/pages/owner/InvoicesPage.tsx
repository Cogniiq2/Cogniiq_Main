import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileText, Plus } from 'lucide-react';

import { OwnerButton, OwnerCard, OwnerEmpty, OwnerError, OwnerField, OwnerLoading, OwnerPageHeader, OwnerPill, OwnerSelect, invoiceStatusTone } from '@/pages/owner/ownerUi';
import { useOwnerEntity } from '@/pages/owner/ownerContext';
import { createOwnerInvoice, deleteDraftInvoice, issueOwnerInvoice, loadInvoices, recordInvoicePayment, setInvoiceStatus } from '@/lib/ownerFinance/api';
import { computeInvoiceLine } from '@/lib/ownerFinance/tax';
import { formatCents, parseAmountToCents } from '@/lib/clientPlatform/validation';
import type { OwnerInvoice } from '@/lib/ownerFinance/types';

const invoiceTreatments = [
  { value: 'standard', label: 'Standard 19 %' },
  { value: 'reduced', label: 'Ermäßigt 7 %' },
  { value: 'zero_rated', label: 'Nullsatz' },
  { value: 'exempt', label: 'Steuerfrei' },
  { value: 'reverse_charge', label: 'Reverse Charge' },
  { value: 'outside_scope', label: 'Nicht steuerbar' },
  { value: 'unknown', label: 'Prüfung erforderlich' },
];

export function InvoicesPage() {
  const { entity } = useOwnerEntity();
  const [invoices, setInvoices] = useState<OwnerInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    if (!entity) return;
    setLoading(true);
    try { setInvoices(await loadInvoices(entity.id)); setError(null); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, [entity]);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(
    () => invoices.filter((i) => statusFilter === 'all' || i.status === statusFilter),
    [invoices, statusFilter],
  );

  const issue = async (inv: OwnerInvoice) => { const { error: err } = await issueOwnerInvoice(inv.id); if (err) alert(err); else void load(); };
  const voidInvoice = async (inv: OwnerInvoice) => { if (confirm('Rechnung stornieren (void)? Sie bleibt zur Historie erhalten.')) { await setInvoiceStatus(inv.id, 'void'); void load(); } };
  const removeDraft = async (inv: OwnerInvoice) => { if (confirm('Entwurf löschen?')) { const { error: err } = await deleteDraftInvoice(inv.id); if (err) alert(err); else void load(); } };
  const pay = async (inv: OwnerInvoice) => {
    const input = prompt('Zahlungsbetrag (€):', ((inv.gross_total_cents - inv.amount_paid_cents) / 100).toFixed(2));
    if (!input) return;
    const parsed = parseAmountToCents(input);
    if ('error' in parsed || parsed.cents == null || parsed.cents <= 0) { alert('Ungültiger Betrag'); return; }
    const { error: err } = await recordInvoicePayment(inv.id, parsed.cents, new Date().toISOString().slice(0, 10));
    if (err) alert(err); else void load();
  };

  return (
    <>
      <OwnerPageHeader
        title="Rechnungen"
        description="Rechnungen mit serverseitig berechneten Beträgen. Gebuchte Rechnungen werden nicht gelöscht, sondern storniert."
        actions={<OwnerButton onClick={() => setShowCreate((s) => !s)}><Plus size={15} /> Neue Rechnung</OwnerButton>}
      />

      {showCreate && entity ? <CreateInvoice entityId={entity.id} onDone={() => { setShowCreate(false); void load(); }} /> : null}
      {error ? <OwnerError message={error} /> : null}

      <OwnerCard className="mb-4 p-3">
        <OwnerSelect id="statusFilter" label="" value={statusFilter} onChange={setStatusFilter} options={[
          { value: 'all', label: 'Alle Status' }, { value: 'draft', label: 'Entwurf' }, { value: 'issued', label: 'Gestellt' },
          { value: 'partially_paid', label: 'Teilbezahlt' }, { value: 'paid', label: 'Bezahlt' }, { value: 'void', label: 'Storniert' },
        ]} />
      </OwnerCard>

      {loading ? <OwnerLoading label="Rechnungen werden geladen" /> : filtered.length === 0 ? (
        <OwnerEmpty icon={FileText} title="Noch keine Rechnungen" description="Erstellen Sie eine Rechnung, um Umsatz und Forderungen zu erfassen. Es werden keine Beispieldaten angezeigt." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/8 bg-[#111a2e]">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead><tr className="border-b border-white/8 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
              <th className="px-4 py-3">Nummer</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Datum</th>
              <th className="px-4 py-3 text-right">Netto</th><th className="px-4 py-3 text-right">Brutto</th><th className="px-4 py-3 text-right">Offen</th><th className="px-4 py-3"></th>
            </tr></thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-100">{inv.invoice_number ?? '(Entwurf)'}</td>
                  <td className="px-4 py-3"><OwnerPill label={inv.status} tone={invoiceStatusTone[inv.status]} /></td>
                  <td className="px-4 py-3 text-slate-400">{inv.issue_date ?? '—'}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-200">{formatCents(inv.net_total_cents, inv.currency)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-200">{formatCents(inv.gross_total_cents, inv.currency)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-300">{formatCents(inv.gross_total_cents - inv.amount_paid_cents, inv.currency)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {inv.status === 'draft' ? <button type="button" onClick={() => void issue(inv)} className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-[12px] font-semibold text-cyan-200">Stellen</button> : null}
                      {inv.status === 'draft' ? <button type="button" onClick={() => void removeDraft(inv)} className="rounded-lg border border-white/10 px-2.5 py-1 text-[12px] font-semibold text-slate-300">Löschen</button> : null}
                      {['issued', 'partially_paid', 'overdue'].includes(inv.status) ? <button type="button" onClick={() => void pay(inv)} className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[12px] font-semibold text-emerald-200">Zahlung</button> : null}
                      {inv.status !== 'void' && inv.status !== 'paid' && inv.status !== 'draft' ? <button type="button" onClick={() => void voidInvoice(inv)} className="rounded-lg border border-white/10 px-2.5 py-1 text-[12px] font-semibold text-slate-300">Storno</button> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function CreateInvoice({ entityId, onDone }: { entityId: string; onDone: () => void }) {
  const [number, setNumber] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [desc, setDesc] = useState('');
  const [qty, setQty] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [treatment, setTreatment] = useState('standard');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const preview = useMemo(() => {
    const price = parseAmountToCents(unitPrice);
    const q = Math.round((Number(qty.replace(',', '.')) || 0) * 1000);
    if ('error' in price || price.cents == null || q <= 0) return null;
    const rate = treatment === 'reduced' ? 700 : treatment === 'standard' ? 1900 : 0;
    return computeInvoiceLine(q, price.cents, rate, treatment as never);
  }, [qty, unitPrice, treatment]);

  const submit = async () => {
    setErr(null);
    if (!desc.trim()) { setErr('Beschreibung erforderlich.'); return; }
    const price = parseAmountToCents(unitPrice);
    if ('error' in price || price.cents == null) { setErr('Ungültiger Einzelpreis.'); return; }
    const q = Math.round((Number(qty.replace(',', '.')) || 0) * 1000);
    if (q <= 0) { setErr('Ungültige Menge.'); return; }
    setBusy(true);
    const rate = treatment === 'reduced' ? 700 : treatment === 'standard' ? 1900 : 0;
    const { error } = await createOwnerInvoice(
      { business_entity_id: entityId, invoice_number: number.trim() || null, issue_date: issueDate || null, service_date: issueDate || null, due_date: dueDate || null, currency: 'EUR' },
      [{ description: desc.trim(), quantity_milli: q, unit_price_cents: price.cents, vat_rate_bp: rate, vat_treatment: treatment }],
    );
    setBusy(false);
    if (error) { setErr(error); return; }
    onDone();
  };

  return (
    <OwnerCard className="mb-4">
      <p className="mb-4 text-sm font-semibold text-white">Neue Rechnung (Entwurf)</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <OwnerField id="num" label="Rechnungsnummer" value={number} onChange={setNumber} placeholder="RE-2026-001" />
        <OwnerField id="idate" label="Rechnungsdatum" value={issueDate} onChange={setIssueDate} type="date" />
        <OwnerField id="ddate" label="Fällig am" value={dueDate} onChange={setDueDate} type="date" />
        <OwnerField id="desc" label="Position" value={desc} onChange={setDesc} placeholder="Beratung / Entwicklung" required />
        <OwnerField id="qty" label="Menge" value={qty} onChange={setQty} />
        <OwnerField id="price" label="Einzelpreis netto (€)" value={unitPrice} onChange={setUnitPrice} placeholder="1000,00" />
        <OwnerSelect id="treat" label="USt-Behandlung" value={treatment} onChange={setTreatment} options={invoiceTreatments} />
      </div>
      {preview ? <p className="mt-3 text-[12px] text-slate-400">Vorschau: netto {formatCents(preview.netCents)} · USt {formatCents(preview.vatCents)} · brutto {formatCents(preview.grossCents)}</p> : null}
      {err ? <p className="mt-2 text-sm text-rose-400">{err}</p> : null}
      <div className="mt-4 flex gap-2">
        <OwnerButton onClick={() => void submit()} disabled={busy}>{busy ? 'Erstellen…' : 'Entwurf erstellen'}</OwnerButton>
        <OwnerButton variant="ghost" onClick={onDone}>Abbrechen</OwnerButton>
      </div>
    </OwnerCard>
  );
}
