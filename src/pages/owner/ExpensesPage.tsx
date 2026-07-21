import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Receipt } from 'lucide-react';

import { OwnerButton, OwnerCard, OwnerEmpty, OwnerError, OwnerField, OwnerLoading, OwnerPageHeader, OwnerPill, OwnerSelect } from '@/pages/owner/ownerUi';
import { useOwnerEntity } from '@/pages/owner/ownerContext';
import { createExpenseWithLine, loadCategories, loadExpenses, markExpenseReviewed } from '@/lib/ownerFinance/api';
import { computeExpenseLine } from '@/lib/ownerFinance/tax';
import { formatCents, parseAmountToCents } from '@/lib/clientPlatform/validation';
import type { OwnerExpense, OwnerExpenseCategory } from '@/lib/ownerFinance/types';

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

const reviewTone: Record<string, 'success' | 'warning' | 'neutral'> = { reviewed: 'success', pending: 'warning', needs_info: 'warning' };

export function ExpensesPage() {
  const { entity } = useOwnerEntity();
  const [expenses, setExpenses] = useState<OwnerExpense[]>([]);
  const [categories, setCategories] = useState<OwnerExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [onlyReview, setOnlyReview] = useState(false);

  const load = useCallback(async () => {
    if (!entity) return;
    setLoading(true);
    try {
      const [ex, cats] = await Promise.all([loadExpenses(entity.id), loadCategories()]);
      setExpenses(ex); setCategories(cats); setError(null);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, [entity]);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => onlyReview ? expenses.filter((e) => e.review_status !== 'reviewed') : expenses, [expenses, onlyReview]);
  const catLabel = (id: string | null) => categories.find((c) => c.id === id)?.label ?? '—';

  return (
    <>
      <OwnerPageHeader
        title="Ausgaben"
        description="Betriebsausgaben mit USt-Behandlung, Vorsteuer-Abzugsfähigkeit und Abzugsfähigkeit. Ausländische SaaS-Rechnungen werden nicht automatisch als voll abziehbar klassifiziert."
        actions={<OwnerButton onClick={() => setShowCreate((s) => !s)}><Plus size={15} /> Ausgabe erfassen</OwnerButton>}
      />
      {showCreate && entity ? <CreateExpense entityId={entity.id} categories={categories} onDone={() => { setShowCreate(false); void load(); }} /> : null}
      {error ? <OwnerError message={error} /> : null}

      <OwnerCard className="mb-4 p-3">
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={onlyReview} onChange={(e) => setOnlyReview(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-transparent" />
          Nur Prüf-Warteschlange
        </label>
      </OwnerCard>

      {loading ? <OwnerLoading label="Ausgaben werden geladen" /> : filtered.length === 0 ? (
        <OwnerEmpty icon={Receipt} title="Noch keine Ausgaben" description="Erfassen Sie Betriebsausgaben, um Vorsteuer und EÜR-Ergebnis zu berechnen." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/8 bg-[#111a2e]">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead><tr className="border-b border-white/8 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
              <th className="px-4 py-3">Datum</th><th className="px-4 py-3">Kategorie</th><th className="px-4 py-3 text-right">Netto</th>
              <th className="px-4 py-3 text-right">Vorsteuer</th><th className="px-4 py-3">Prüfung</th><th className="px-4 py-3"></th>
            </tr></thead>
            <tbody>
              {filtered.map((ex) => (
                <tr key={ex.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 text-slate-300">{ex.invoice_date ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-300">{catLabel(ex.category_id)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-200">{formatCents(ex.net_total_cents, ex.currency)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-300">{formatCents(ex.input_vat_cents, ex.currency)}</td>
                  <td className="px-4 py-3"><OwnerPill label={ex.review_status} tone={reviewTone[ex.review_status]} /></td>
                  <td className="px-4 py-3 text-right">
                    {ex.review_status !== 'reviewed' ? <button type="button" onClick={() => { if (entity) { void markExpenseReviewed(entity.id, ex.id).then(load); } }} className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[12px] font-semibold text-emerald-200">Geprüft</button> : null}
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

function CreateExpense({ entityId, categories, onDone }: { entityId: string; categories: OwnerExpenseCategory[]; onDone: () => void }) {
  const [vendor, setVendor] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [categoryId, setCategoryId] = useState('');
  const [desc, setDesc] = useState('');
  const [net, setNet] = useState('');
  const [treatment, setTreatment] = useState('domestic_standard');
  const [eligibility, setEligibility] = useState('100');
  const [deductibility, setDeductibility] = useState('100');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const preview = useMemo(() => {
    const n = parseAmountToCents(net);
    if ('error' in n || n.cents == null) return null;
    const rate = treatment === 'domestic_reduced' ? 700 : ['domestic_standard', 'reverse_charge_13b', 'intra_community'].includes(treatment) ? 1900 : 0;
    return computeExpenseLine(n.cents, rate, treatment as never);
  }, [net, treatment]);

  const submit = async () => {
    setErr(null);
    if (!desc.trim()) { setErr('Beschreibung erforderlich.'); return; }
    const n = parseAmountToCents(net);
    if ('error' in n || n.cents == null) { setErr('Ungültiger Netto-Betrag.'); return; }
    const rate = treatment === 'domestic_reduced' ? 700 : ['domestic_standard', 'reverse_charge_13b', 'intra_community'].includes(treatment) ? 1900 : 0;
    setBusy(true);
    const cat = categories.find((c) => c.id === categoryId);
    const { error } = await createExpenseWithLine(entityId, {
      supplier_invoice_number: vendor.trim() || null, invoice_date: invoiceDate || null, category_id: categoryId || null,
      review_status: treatment === 'unknown' ? 'needs_info' : 'pending',
    }, {
      description: desc.trim(), net_cents: n.cents, vat_rate_bp: rate, vat_treatment: treatment, category_id: categoryId || null,
      input_vat_eligibility_bp: Math.round((Number(eligibility) || 0) * 100), deductibility_bp: Math.round((Number(deductibility) || 0) * 100),
      asset_candidate: cat?.asset_review_default ?? false,
    });
    setBusy(false);
    if (error) { setErr(error); return; }
    onDone();
  };

  return (
    <OwnerCard className="mb-4">
      <p className="mb-4 text-sm font-semibold text-white">Ausgabe erfassen</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <OwnerField id="vendor" label="Lieferant / Beleg-Nr." value={vendor} onChange={setVendor} />
        <OwnerField id="edate" label="Rechnungsdatum" value={invoiceDate} onChange={setInvoiceDate} type="date" />
        <OwnerSelect id="cat" label="Kategorie" value={categoryId} onChange={setCategoryId} options={[{ value: '', label: '—' }, ...categories.map((c) => ({ value: c.id, label: c.label }))]} />
        <OwnerField id="edesc" label="Beschreibung" value={desc} onChange={setDesc} required />
        <OwnerField id="enet" label="Netto (€)" value={net} onChange={setNet} placeholder="42,00" />
        <OwnerSelect id="etreat" label="USt-Behandlung" value={treatment} onChange={setTreatment} options={expenseTreatments} />
        <OwnerField id="elig" label="Vorsteuer-Abzug (%)" value={eligibility} onChange={setEligibility} />
        <OwnerField id="deduct" label="Betriebl. Abzug (%)" value={deductibility} onChange={setDeductibility} />
      </div>
      {preview ? <p className="mt-3 text-[12px] text-slate-400">USt: {formatCents(preview.vatCents)} · Lieferanten-Brutto: {formatCents(preview.grossCents)}</p> : null}
      {err ? <p className="mt-2 text-sm text-rose-400">{err}</p> : null}
      <div className="mt-4 flex gap-2">
        <OwnerButton onClick={() => void submit()} disabled={busy}>{busy ? 'Speichern…' : 'Ausgabe speichern'}</OwnerButton>
        <OwnerButton variant="ghost" onClick={onDone}>Abbrechen</OwnerButton>
      </div>
    </OwnerCard>
  );
}
