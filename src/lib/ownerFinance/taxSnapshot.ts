import {
  churchTax, combinedReserve, depreciationSchedule, euerResult, incomeTaxReserve, sec35Credit,
  solidaritySurcharge, tradeTax, vatPeriodSummary,
} from './tax';
import type { TaxPeriodInputs } from './api';
import type { OwnerAsset, OwnerTaxSettings } from './types';

// Pure tax-engine aggregation driven by the payment-based owner_tax_period_inputs RPC (EÜR cash
// basis + VAT Ist/Soll). Depreciation is computed from asset rows honoring the start month. Shared
// by the Taxes control center and the executive Overview so both surfaces show the SAME real values
// (never fabricated). This is a straight extraction of the previously page-local computation — the
// statutory tax logic is unchanged.
export interface TaxSnapshotInput {
  inputs: TaxPeriodInputs | null;
  assets: Pick<OwnerAsset, 'purchase_date' | 'acquisition_cost_cents' | 'business_use_bp' | 'depreciation_method' | 'useful_life_months' | 'depreciation_start_date'>[];
  settings: OwnerTaxSettings | null;
  taxYear: number;
}

export function computeTaxSnapshot(input: TaxSnapshotInput) {
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

  return {
    euer, vat, trade, sec35, income,
    soliRemainingCents: soliRemaining,
    churchRemainingCents: churchRemaining,
    tradeRemainingCents: tradeRemaining,
    reserve, warnings, confidence,
  };
}

export type TaxSnapshot = ReturnType<typeof computeTaxSnapshot>;
