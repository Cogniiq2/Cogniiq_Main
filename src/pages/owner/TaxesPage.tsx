import { useCallback, useEffect, useState } from 'react';
import { Download, FileWarning } from 'lucide-react';

import { OwnerButton, OwnerCard, OwnerError, OwnerKpi, OwnerLoading, OwnerPageHeader, OwnerPill } from '@/pages/owner/ownerUi';
import { useOwnerEntity } from '@/pages/owner/ownerContext';
import { loadTaxPeriodInputs, loadTaxSettings, saveTaxEstimate, recordExportRun, loadAssets, type TaxPeriodInputs } from '@/lib/ownerFinance/api';
import {
  RULES_VERSION, combinedReserve, churchTax, depreciationSchedule, euerResult, incomeTaxReserve,
  sec35Credit, solidaritySurcharge, tradeTax, vatPeriodSummary,
} from '@/lib/ownerFinance/tax';
import { exportCsv, exportJson } from '@/lib/ownerFinance/exports';
import { formatCents } from '@/lib/clientPlatform/validation';
import type { OwnerTaxSettings } from '@/lib/ownerFinance/types';

export function TaxesPage() {
  const { entity, taxYear } = useOwnerEntity();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ settings: OwnerTaxSettings | null; calc: ReturnType<typeof computeTax> } | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    if (!entity) return;
    setLoading(true);
    try {
      const settings = await loadTaxSettings(entity.id, taxYear);
      const timing = settings?.vat_timing ?? 'ist';
      const [inputs, assets] = await Promise.all([
        loadTaxPeriodInputs(entity.id, `${taxYear}-01-01`, `${taxYear}-12-31`, timing),
        loadAssets(entity.id),
      ]);
      setData({ settings, calc: computeTax({ inputs, assets, settings, taxYear }) });
      setError(null);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, [entity, taxYear]);

  useEffect(() => { void load(); }, [load]);

  const saveSnapshot = async () => {
    if (!entity || !data) return;
    await saveTaxEstimate(entity.id, {
      tax_year: taxYear, tax_type: 'combined_reserve', rules_version: RULES_VERSION,
      estimated_liability_cents: data.calc.reserve.totalReserveCents,
      remaining_reserve_cents: data.calc.reserve.totalReserveCents,
      confidence: data.calc.confidence, warnings: data.calc.warnings,
      breakdown: data.calc.reserve.breakdown as unknown as Record<string, unknown>,
    });
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const exportUstva = async () => {
    if (!entity || !data) return;
    const v = data.calc.vat;
    exportCsv(`UStVA-${taxYear}.csv`, { entityName: entity.display_name, periodStart: `${taxYear}-01-01`, periodEnd: `${taxYear}-12-31`, valueBasis: 'mixed' },
      ['Kennzahl', 'Bezeichnung', 'Betrag_EUR'],
      [['81', 'Umsatz 19% (USt)', (v.outputVatCents / 100).toFixed(2)], ['—', 'Reverse-Charge USt', (v.reverseChargeOutputCents / 100).toFixed(2)], ['66', 'Vorsteuer', (v.eligibleInputVatCents / 100).toFixed(2)], ['83', 'Zahllast/Erstattung', (v.payableCents / 100).toFixed(2)]]);
    await recordExportRun(entity.id, { export_type: 'ustva_preparation', period_start: `${taxYear}-01-01`, period_end: `${taxYear}-12-31`, rules_version: RULES_VERSION, warnings: data.calc.warnings });
  };
  const exportSummary = async () => {
    if (!entity || !data) return;
    exportJson(`Steuerübersicht-${taxYear}.json`, { entityName: entity.display_name, periodStart: `${taxYear}-01-01`, periodEnd: `${taxYear}-12-31`, valueBasis: 'estimated' }, data.calc as unknown as Record<string, unknown>);
    await recordExportRun(entity.id, { export_type: 'tax_summary', rules_version: RULES_VERSION, period_start: `${taxYear}-01-01`, period_end: `${taxYear}-12-31` });
  };

  if (!entity) return <OwnerLoading label="Wird geladen" />;

  return (
    <>
      <OwnerPageHeader
        title={`Steuern ${taxYear}`}
        description="Exakte Quelldaten und Schätzungen sind klar getrennt. Alle Steuerwerte sind Planungsschätzungen, keine Steuerbescheide. Berechnungsversion de-2026-v1."
        actions={<div className="flex flex-wrap gap-2">
          <OwnerButton variant="ghost" onClick={() => void exportUstva()}><Download size={14} /> UStVA-Paket</OwnerButton>
          <OwnerButton variant="ghost" onClick={() => void exportSummary()}><Download size={14} /> Steuerübersicht</OwnerButton>
          <OwnerButton onClick={() => void saveSnapshot()}>Snapshot speichern</OwnerButton>
        </div>}
      />
      {saved ? <div className="mb-4 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-2.5 text-sm text-emerald-300">Steuer-Snapshot gespeichert (unveränderlich).</div> : null}
      {error ? <OwnerError message={error} /> : null}
      {loading || !data ? <OwnerLoading label="Steuerberechnung läuft" /> : (
        <div className="space-y-6">
          {data.calc.warnings.length ? (
            <OwnerCard className="border-amber-400/20 bg-amber-400/5">
              <div className="flex items-start gap-3"><FileWarning size={18} className="mt-0.5 text-amber-300" />
                <ul className="space-y-1 text-[13px] text-amber-200">{data.calc.warnings.map((w, i) => <li key={i}>• {w}</li>)}</ul>
              </div>
            </OwnerCard>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <OwnerKpi label="EÜR-Gewinn (Schätzung)" valueCents={data.calc.euer.taxableProfitCents} basis="estimate" />
            <OwnerKpi label="USt-Zahllast" valueCents={data.calc.vat.payableCents} basis="estimate" hint={data.calc.vat.filingReady ? 'abgabebereit' : 'Prüfung offen'} />
            <OwnerKpi label="Gewerbesteuer" valueCents={data.calc.trade.tradeTaxCents} basis="estimate" hint={data.calc.trade.tradeTaxCents == null ? 'Hebesatz fehlt' : undefined} />
            <OwnerKpi label="Steuerrücklage gesamt" valueCents={data.calc.reserve.totalReserveCents} basis="estimate" />
          </div>

          <Section title="Umsatzsteuer" confidence={data.calc.vat.filingReady ? 'complete' : 'incomplete'} rows={[
            ['Umsatzsteuer (Output)', data.calc.vat.outputVatCents], ['Reverse-Charge-Umsatzsteuer', data.calc.vat.reverseChargeOutputCents],
            ['abzugsfähige Vorsteuer', -data.calc.vat.eligibleInputVatCents], ['USt-Vorauszahlungen', -(data.settings?.vat_prepayments_cents ?? 0)],
            ['Zahllast / Erstattung', data.calc.vat.payableCents],
          ]} />

          <Section title="EÜR & Einkommensteuer (anteilig)" confidence={data.calc.income.hasPersonalInputs ? 'estimate' : 'incomplete'} rows={[
            ['zu versteuernder Gewinn (EÜR)', data.calc.euer.taxableProfitCents],
            ['ESt ohne Cogniiq', data.calc.income.baselineTaxCents], ['ESt inkl. Cogniiq', data.calc.income.totalTaxCents],
            ['anteilige ESt (Cogniiq)', data.calc.income.incrementalTaxCents], ['§35-Anrechnung', -data.calc.sec35.creditCents],
            ['ESt-Vorauszahlungen', -(data.settings?.income_tax_prepayments_cents ?? 0)], ['verbleibende ESt-Rücklage', data.calc.income.remainingReserveCents],
          ]} />

          <Section title="Gewerbesteuer" confidence={data.calc.trade.tradeTaxCents == null ? 'incomplete' : 'estimate'}
            rows={data.calc.trade.steps.map((s) => [s.label, s.valueCents] as [string, number])} />

          <Section title="Solidaritätszuschlag & Kirchensteuer" confidence="estimate" rows={[
            ['Solidaritätszuschlag (anteilig)', data.calc.soliRemainingCents], ['Kirchensteuer (anteilig)', data.calc.churchRemainingCents],
          ]} />

          <OwnerCard>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Annahmen</p>
            <p className="text-[13px] leading-6 text-slate-400">
              Hebesatz {data.settings?.trade_tax_hebesatz_bp ? `${data.settings.trade_tax_hebesatz_bp / 100} %` : 'nicht konfiguriert'} ·
              Veranlagung {data.settings?.assessment_mode === 'joint' ? 'Zusammen' : 'Einzel'} ·
              Kirchensteuer {data.settings?.church_tax_enabled ? 'aktiv' : 'inaktiv'} ·
              anderes Einkommen {data.settings?.estimated_other_taxable_income_cents != null ? formatCents(data.settings.estimated_other_taxable_income_cents) : 'nicht hinterlegt'}.
              Berechnungsversion {RULES_VERSION}. Diese Werte sind Schätzungen und ersetzen keine steuerliche Beratung.
            </p>
          </OwnerCard>
        </div>
      )}
    </>
  );
}

function Section({ title, confidence, rows }: { title: string; confidence: 'complete' | 'estimate' | 'incomplete'; rows: [string, number][] }) {
  const tone = confidence === 'complete' ? 'success' : confidence === 'incomplete' ? 'warning' : 'info';
  const label = confidence === 'complete' ? 'exakt' : confidence === 'incomplete' ? 'unvollständig' : 'Schätzung';
  return (
    <OwnerCard>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-white">{title}</p>
        <OwnerPill label={label} tone={tone as 'success' | 'warning' | 'info'} />
      </div>
      <table className="w-full text-sm">
        <tbody>
          {rows.map(([label2, cents], i) => (
            <tr key={i} className="border-b border-white/5 last:border-0">
              <td className="py-2 text-slate-400">{label2}</td>
              <td className="py-2 text-right tabular-nums text-slate-100">{formatCents(cents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </OwnerCard>
  );
}

// Pure tax-engine aggregation driven by the payment-based owner_tax_period_inputs RPC (EÜR cash
// basis + VAT Ist/Soll). Depreciation is computed from asset rows (honoring the start month). Kept
// out of the render tree.
function computeTax(input: {
  inputs: TaxPeriodInputs | null;
  assets: { purchase_date: string | null; acquisition_cost_cents: number | null; business_use_bp: number; depreciation_method: 'immediate' | 'straight_line' | 'pool' | 'manual'; useful_life_months: number | null; depreciation_start_date: string | null }[];
  settings: OwnerTaxSettings | null;
  taxYear: number;
}) {
  const src = input.inputs;
  const paidRevenueNet = src?.paid_revenue_net_cents ?? 0;
  const paidDeductibleExpense = src?.paid_expense_deductible_net_cents ?? 0;

  const depreciation = input.assets.reduce((s, a) => {
    if (!a.acquisition_cost_cents) return s;
    const startDate = a.depreciation_start_date ?? a.purchase_date ?? `${input.taxYear}-01-01`;
    const startYear = Number(startDate.slice(0, 4));
    const startMonth = Number(startDate.slice(5, 7)) || 1;
    const sched = depreciationSchedule({ acquisitionCostCents: a.acquisition_cost_cents, businessUseBp: a.business_use_bp, method: a.depreciation_method, usefulLifeMonths: a.useful_life_months, startYear, startMonth, years: 30 });
    return s + (sched.years.find((y) => y.year === input.taxYear)?.depreciationCents ?? 0);
  }, 0);

  const euer = euerResult({ paidRevenueNetCents: paidRevenueNet, paidDeductibleExpenseCents: paidDeductibleExpense, depreciationCents: depreciation, manualAdjustmentsCents: input.settings?.manual_personal_adjustments_cents ?? 0 });

  const vat = vatPeriodSummary({
    outputVatCents: src?.vat_output_cents ?? 0,
    reverseChargeOutputCents: src?.vat_reverse_charge_output_cents ?? 0,
    eligibleInputVatCents: src?.vat_input_cents ?? 0,
    eligibleReverseChargeInputCents: 0,
    prepaymentsCents: input.settings?.vat_prepayments_cents ?? 0,
    hasUnresolvedTreatments: src ? !src.filing_ready : true,
  });

  const hebesatzBp = input.settings?.trade_tax_hebesatz_bp ?? null;
  const trade = tradeTax({ profitCents: euer.taxableProfitCents, hebesatzBp });
  const mode = input.settings?.assessment_mode ?? 'single';
  const other = input.settings?.estimated_other_taxable_income_cents ?? null;

  const incomePre = incomeTaxReserve({ cogniiqTaxableProfitCents: Math.max(0, euer.taxableProfitCents), otherTaxableIncomeCents: other, mode, incomeTaxPrepaymentsCents: input.settings?.income_tax_prepayments_cents ?? 0, sec35CreditCents: 0 });
  const sec35 = sec35Credit({ messbetragCents: trade.messbetragCents, actualTradeTaxCents: trade.tradeTaxCents ?? 0, incomeTaxAttributableToCommercialCents: incomePre.incrementalTaxCents });
  const income = incomeTaxReserve({ cogniiqTaxableProfitCents: Math.max(0, euer.taxableProfitCents), otherTaxableIncomeCents: other, mode, incomeTaxPrepaymentsCents: input.settings?.income_tax_prepayments_cents ?? 0, sec35CreditCents: sec35.creditCents });

  const soliTotal = solidaritySurcharge({ incomeTaxBasisCents: income.totalTaxCents, mode }).soliCents;
  const soliBase = solidaritySurcharge({ incomeTaxBasisCents: income.baselineTaxCents, mode }).soliCents;
  const soliRemaining = Math.max(0, (soliTotal - soliBase) - (input.settings?.soli_prepayments_cents ?? 0));
  const churchEnabled = input.settings?.church_tax_enabled ?? false;
  const churchRate = input.settings?.church_tax_rate_bp ?? 0;
  const churchIncremental = churchTax(income.totalTaxCents, churchRate, churchEnabled) - churchTax(income.baselineTaxCents, churchRate, churchEnabled);
  const churchRemaining = Math.max(0, churchIncremental - (input.settings?.church_tax_prepayments_cents ?? 0));
  const tradeRemaining = Math.max(0, (trade.tradeTaxCents ?? 0) - (input.settings?.trade_tax_prepayments_cents ?? 0));

  const reserve = combinedReserve({ vatReserveCents: vat.reserveCents, businessIncomeTaxReserveCents: income.remainingReserveCents, tradeTaxRemainingCents: tradeRemaining, soliRemainingCents: soliRemaining, churchTaxRemainingCents: churchRemaining });

  const filingReady = src ? src.filing_ready : false;
  const warnings = [...(src?.warnings ?? []), ...vat.warnings, ...trade.warnings, ...income.warnings, ...sec35.warnings];
  if (!input.settings?.setup_complete) warnings.unshift('Steuer-Setup ist unvollständig – die Gesamtschätzung ist vorläufig.');
  const confidence: 'complete' | 'estimate' | 'incomplete' = !input.settings?.setup_complete || !income.hasPersonalInputs || hebesatzBp == null || !filingReady ? 'incomplete' : 'estimate';

  return { euer, vat, trade, sec35, income, soliRemainingCents: soliRemaining, churchRemainingCents: churchRemaining, reserve, warnings, confidence };
}
