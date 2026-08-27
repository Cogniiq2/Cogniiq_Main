// "+ Vertrag anlegen" — the ordinary way to create a recurring customer contract.
//
// Until now a contract could only arrive through Schnellimport, which is fine for migrating
// a year of history and wrong for adding one new customer on a Tuesday.
//
// WHAT THIS DOES NOT DO
// ---------------------
// Creating a contract records an EXPECTATION and nothing else. It creates no invoice, no
// payment, no automation job and no customer contact; actual revenue only begins when the
// owner later uses "Monat verbuchen". The summary below therefore says ERWARTET, and the
// dialog says plainly that nothing is sent.
//
// The client computes the summary for the owner's eyes only. Net, VAT, gross, MRR and ARR are
// all recomputed server-side from the lines by owner_create_revenue_contract — no authoritative
// total is ever sent from the browser.

import { useMemo, useState } from 'react';

import {
  Button, Card, Field, InfoBanner, Modal, SectionHeader, Select,
} from '@/components/dashboard';
import { formatCents, parseAmountToCents } from '@/lib/clientPlatform/validation';
import { computeInvoiceLine } from '@/lib/ownerFinance/tax';
import { customerDisplayName } from '@/lib/ownerFinance/customerLabels';
import { createRevenueContract, type BillingFrequency, type RevenueContractLineInput } from '@/lib/ownerFinance/financeExtendedApi';
import type { OwnerCustomerListRow } from '@/lib/ownerFinance/types';

interface DraftLine { id: string; description: string; quantity: string; unitPrice: string; treatment: string }

const newLine = (): DraftLine => ({
  id: Math.random().toString(36).slice(2),
  description: '', quantity: '1', unitPrice: '', treatment: 'standard',
});

/** Mirrors the invoice composer's vocabulary so both forms price a line the same way. */
const treatments = [
  { value: 'standard', label: 'Standard 19 %' },
  { value: 'reduced', label: 'Ermäßigt 7 %' },
  { value: 'zero_rated', label: 'Nullsatz 0 %' },
  { value: 'exempt', label: 'Steuerfrei (§4 UStG)' },
  { value: 'reverse_charge', label: 'Reverse Charge' },
];

/** Monthly is deliberately first: it is the common case and the default. */
const frequencies: Array<{ value: BillingFrequency; label: string }> = [
  { value: 'monthly', label: 'Monatlich' },
  { value: 'quarterly', label: 'Quartalsweise' },
  { value: 'yearly', label: 'Jährlich' },
];

const rateForTreatment = (t: string): number => (t === 'reduced' ? 700 : t === 'standard' ? 1900 : 0);
const toCents = (v: string): number | null => {
  const p = parseAmountToCents(v);
  return 'error' in p ? null : p.cents;
};

/** How many months one billing period covers — used only to normalise the MRR preview. */
const monthsPerPeriod = (f: BillingFrequency): number => (f === 'yearly' ? 12 : f === 'quarterly' ? 3 : 1);

export function RevenueContractFormDialog({ open, entityId, customers, onClose, onCreated, onError }: {
  open: boolean;
  entityId: string | null;
  customers: OwnerCustomerListRow[];
  onClose: () => void;
  onCreated: (message: string) => void;
  onError: (message: string) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [customerId, setCustomerId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState('');
  const [frequency, setFrequency] = useState<BillingFrequency>('monthly');
  const [billingDay, setBillingDay] = useState('1');
  const [currency, setCurrency] = useState('EUR');
  const [lines, setLines] = useState<DraftLine[]>([newLine()]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setCustomerId(''); setName(''); setDescription(''); setReference('');
    setStartDate(today); setEndDate(''); setFrequency('monthly'); setBillingDay('1');
    setCurrency('EUR'); setLines([newLine()]); setErrors({});
  };

  // Priced with the SAME function the invoice composer uses, so a 500 € line reads
  // identically in both places. Preview only — the server recomputes on save.
  const totals = useMemo(() => lines.reduce((acc, l) => {
    const price = toCents(l.unitPrice);
    const q = Math.round((Number(l.quantity.replace(',', '.')) || 0) * 1000);
    if (price == null || q <= 0) return acc;
    const calc = computeInvoiceLine(q, price, rateForTreatment(l.treatment), l.treatment as never);
    return { net: acc.net + calc.netCents, vat: acc.vat + calc.vatCents, gross: acc.gross + calc.grossCents };
  }, { net: 0, vat: 0, gross: 0 }), [lines]);

  const months = monthsPerPeriod(frequency);
  const mrrNet = Math.round(totals.net / months);
  const arrNet = mrrNet * 12;

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!customerId) e.customer = 'Kunde erforderlich';
    if (!name.trim()) e.name = 'Vertragsname erforderlich';
    if (!startDate) e.startDate = 'Startdatum erforderlich';
    if (endDate && endDate < startDate) e.endDate = 'Ende darf nicht vor dem Start liegen';
    if (frequency === 'monthly' || frequency === 'quarterly') {
      const d = Number(billingDay);
      // The column is constrained to 1..28 so every month actually has the day.
      if (billingDay && (!Number.isInteger(d) || d < 1 || d > 28)) e.billingDay = 'Tag zwischen 1 und 28';
    }
    let anyValid = false;
    lines.forEach((l) => {
      const price = toCents(l.unitPrice);
      const q = Math.round((Number(l.quantity.replace(',', '.')) || 0) * 1000);
      if (l.unitPrice && price == null) e[`price-${l.id}`] = 'Ungültiger Preis';
      if (l.description.trim() && price != null && q > 0) anyValid = true;
    });
    if (!anyValid) e.form = 'Mindestens eine vollständige Leistungsposition ist erforderlich.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!entityId || !validate()) return;
    setBusy(true);
    const customer = customers.find((c) => c.id === customerId);
    const lineInputs: RevenueContractLineInput[] = lines
      .filter((l) => l.description.trim() && toCents(l.unitPrice) != null)
      .map((l, i) => ({
        description: l.description.trim(),
        quantity_milli: Math.round((Number(l.quantity.replace(',', '.')) || 1) * 1000),
        unit_price_cents: toCents(l.unitPrice) as number,
        vat_rate_bp: rateForTreatment(l.treatment),
        vat_treatment: l.treatment,
        sort_order: i,
      }));

    const { contractId, error } = await createRevenueContract({
      business_entity_id: entityId,
      owner_customer_id: customerId,
      organization_id: customer?.organization_id ?? null,
      name: name.trim(),
      description: description.trim() || null,
      notes: reference.trim() ? `Vertragsreferenz: ${reference.trim()}` : null,
      start_date: startDate,
      end_date: endDate || null,
      billing_frequency: frequency,
      billing_day: frequency === 'yearly' ? null : (billingDay || null),
      currency,
      status: 'active',
    }, lineInputs);

    setBusy(false);
    if (error || !contractId) { onError(error ?? 'Unbekannter Fehler'); return; }
    reset();
    onCreated(`Vertrag „${name.trim()}" angelegt. Es wurde keine Rechnung erzeugt und nichts versendet.`);
  };

  const selectable = customers.filter((c) => c.status !== 'archived');

  return (
    <Modal open={open} onClose={onClose} title="Laufenden Vertrag anlegen" size="lg">
      <div className="space-y-5">
        <InfoBanner tone="info" title="Vertrag ist eine Erwartung, keine Buchung">
          Ein Vertrag erfasst nur, was wiederkehrend vereinbart ist. Es entsteht{' '}
          <span className="font-semibold">keine Rechnung, keine Zahlung und kein tatsächlicher Umsatz</span>,
          und es wird <span className="font-semibold">nichts an den Kunden versendet</span>. Buchen Sie
          später einzelne Zeiträume über „Monat verbuchen".
        </InfoBanner>

        <Card className="p-4">
          <SectionHeader title="Vertrag" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select id="rc-customer" label="Kunde" value={customerId} onChange={setCustomerId} required
              error={errors.customer}
              options={[{ value: '', label: '— Kunde wählen —' },
                ...selectable.map((c) => ({ value: c.id, label: customerDisplayName(c) }))]} />
            <Field id="rc-name" label="Vertragsname" value={name} onChange={setName} required
              error={errors.name} placeholder="z. B. AI Receptionist Betreuung" />
            <div className="sm:col-span-2">
              <Field id="rc-desc" label="Beschreibung (optional)" value={description} onChange={setDescription} />
            </div>
            <Field id="rc-ref" label="Vertragsreferenz (optional)" value={reference} onChange={setReference}
              placeholder="z. B. Rahmenvertrag 2026-04" />
            <Select id="rc-currency" label="Währung" value={currency} onChange={setCurrency}
              options={[{ value: 'EUR', label: 'EUR' }, { value: 'CHF', label: 'CHF' }, { value: 'USD', label: 'USD' }]} />
          </div>
        </Card>

        <Card className="p-4">
          <SectionHeader title="Laufzeit & Abrechnung" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="rc-start" label="Startdatum" type="date" value={startDate} onChange={setStartDate} required error={errors.startDate} />
            <Field id="rc-end" label="Enddatum (optional)" type="date" value={endDate} onChange={setEndDate} error={errors.endDate} />
            <Select id="rc-freq" label="Abrechnungsintervall" value={frequency}
              onChange={(v) => setFrequency(v as BillingFrequency)} options={frequencies} />
            {frequency !== 'yearly' ? (
              <Field id="rc-day" label="Abrechnungstag (1–28)" value={billingDay} onChange={setBillingDay}
                inputMode="numeric" error={errors.billingDay} />
            ) : null}
          </div>
        </Card>

        <Card className="p-4">
          <SectionHeader title="Leistungspositionen"
            action={<Button size="sm" variant="secondary" onClick={() => setLines((r) => [...r, newLine()])}>+ Position hinzufügen</Button>} />
          <div className="space-y-3">
            {lines.map((l, idx) => (
              <div key={l.id} className="rounded-xl border border-gray-100 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Position {idx + 1}</span>
                  {lines.length > 1 ? (
                    <button type="button" className="text-[12px] text-gray-400 hover:text-gray-900"
                      onClick={() => setLines((r) => r.filter((x) => x.id !== l.id))}>Entfernen</button>
                  ) : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field id={`rc-desc-${l.id}`} label="Beschreibung" value={l.description}
                      onChange={(v) => setLines((r) => r.map((x) => (x.id === l.id ? { ...x, description: v } : x)))} />
                  </div>
                  <Field id={`rc-qty-${l.id}`} label="Menge" value={l.quantity} inputMode="decimal"
                    onChange={(v) => setLines((r) => r.map((x) => (x.id === l.id ? { ...x, quantity: v } : x)))} />
                  <Field id={`rc-price-${l.id}`} label="Einzelpreis (netto)" value={l.unitPrice} inputMode="decimal" prefix="€"
                    error={errors[`price-${l.id}`]}
                    onChange={(v) => setLines((r) => r.map((x) => (x.id === l.id ? { ...x, unitPrice: v } : x)))} />
                  <div className="sm:col-span-2">
                    <Select id={`rc-vat-${l.id}`} label="USt-Behandlung" value={l.treatment} options={treatments}
                      onChange={(v) => setLines((r) => r.map((x) => (x.id === l.id ? { ...x, treatment: v } : x)))} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ERWARTET, never IST. These are contractual values; they enter no tax total. */}
        <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-sky-700">Erwartet · vertraglich</p>
          <dl className="mt-2 grid gap-1.5 text-[13px] sm:grid-cols-2">
            <div className="flex justify-between"><dt className="text-sky-900/70">Pro Zeitraum netto</dt><dd className="tabular-nums text-sky-900">{formatCents(totals.net, currency)}</dd></div>
            <div className="flex justify-between"><dt className="text-sky-900/70">USt</dt><dd className="tabular-nums text-sky-900">{formatCents(totals.vat, currency)}</dd></div>
            <div className="flex justify-between"><dt className="text-sky-900/70">Pro Zeitraum brutto</dt><dd className="tabular-nums font-semibold text-sky-900">{formatCents(totals.gross, currency)}</dd></div>
            <div className="flex justify-between"><dt className="text-sky-900/70">Monatlich netto (MRR)</dt><dd className="tabular-nums font-semibold text-sky-900">{formatCents(mrrNet, currency)}</dd></div>
            <div className="flex justify-between sm:col-span-2"><dt className="text-sky-900/70">Jährlich netto (ARR)</dt><dd className="tabular-nums font-semibold text-sky-900">{formatCents(arrNet, currency)}</dd></div>
          </dl>
          <p className="mt-2 text-[11px] leading-relaxed text-sky-900/60">
            Vorschau. Netto, USt und Brutto werden beim Speichern serverseitig aus den Positionen berechnet.
          </p>
        </div>

        {errors.form ? <p className="text-[13px] text-red-600">{errors.form}</p> : null}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Abbrechen</Button>
          <Button onClick={() => void submit()} loading={busy} disabled={!entityId}>Vertrag anlegen</Button>
        </div>
      </div>
    </Modal>
  );
}
