// Trade tax, §35 EStG relief, Solidaritätszuschlag, church tax, and the business-related income-tax
// reserve. All integer cents. All outputs are ESTIMATES (see notes) — never tax assessments.

import { incomeTaxTariff2026, type AssessmentMode } from './income';
import { roundCents } from './vat';
import {
  SEC35_FACTOR_BP,
  SOLI_FREIGRENZE_JOINT_CENTS,
  SOLI_FREIGRENZE_SINGLE_CENTS,
  SOLI_MARGINAL_RATE_BP,
  SOLI_RATE_BP,
  TRADE_TAX_ALLOWANCE_CENTS,
  TRADE_TAX_MEASUREMENT_BP,
} from './rules';

export interface TradeTaxInput {
  profitCents: number;         // estimated taxable commercial profit
  additionsCents?: number;     // Hinzurechnungen (manual)
  reductionsCents?: number;    // Kürzungen (manual)
  hebesatzBp: number | null;   // municipal Hebesatz in basis points (490% = 49000); null = not configured
}

export interface TradeTaxResult {
  applicable: boolean;
  gewerbeertragCents: number;
  gewerbeertragRoundedCents: number;
  afterAllowanceCents: number;
  messbetragCents: number;
  tradeTaxCents: number | null; // null when Hebesatz not configured
  warnings: string[];
  steps: { label: string; valueCents: number }[];
}

// Round a cents amount DOWN to full 100 EUR (10000 cents).
function floorTo100Eur(cents: number): number {
  if (cents <= 0) return 0;
  return Math.floor(cents / 10000) * 10000;
}

export function tradeTax(input: TradeTaxInput): TradeTaxResult {
  const additions = input.additionsCents ?? 0;
  const reductions = input.reductionsCents ?? 0;
  const gewerbeertrag = input.profitCents + additions - reductions;
  const rounded = floorTo100Eur(gewerbeertrag);
  const afterAllowance = Math.max(0, rounded - TRADE_TAX_ALLOWANCE_CENTS);
  const messbetrag = roundCents((afterAllowance * TRADE_TAX_MEASUREMENT_BP) / 10000);
  const warnings: string[] = [];
  let tradeTaxCents: number | null = null;
  if (input.hebesatzBp == null) {
    warnings.push('Gewerbesteuer-Hebesatz nicht konfiguriert – Gewerbesteuer wird nicht berechnet.');
  } else {
    tradeTaxCents = roundCents((messbetrag * input.hebesatzBp) / 10000);
  }
  return {
    applicable: input.hebesatzBp != null && afterAllowance > 0,
    gewerbeertragCents: gewerbeertrag,
    gewerbeertragRoundedCents: rounded,
    afterAllowanceCents: afterAllowance,
    messbetragCents: messbetrag,
    tradeTaxCents,
    warnings,
    steps: [
      { label: 'Gewerbeertrag', valueCents: gewerbeertrag },
      { label: 'abgerundet auf volle 100 €', valueCents: rounded },
      { label: 'abzgl. Freibetrag 24.500 €', valueCents: afterAllowance },
      { label: 'Steuermessbetrag (3,5 %)', valueCents: messbetrag },
      { label: 'Gewerbesteuer (× Hebesatz)', valueCents: tradeTaxCents ?? 0 },
    ],
  };
}

export interface Sec35Input {
  messbetragCents: number;
  actualTradeTaxCents: number;
  incomeTaxAttributableToCommercialCents: number; // Ermäßigungshöchstbetrag proxy
}

export interface Sec35Result {
  creditCents: number;
  cappedBy: 'factor' | 'actual_trade_tax' | 'income_tax_cap';
  warnings: string[];
}

// §35 relief ≈ min(4.0 × Messbetrag, actual trade tax, income-tax attributable to commercial income).
export function sec35Credit(input: Sec35Input): Sec35Result {
  const factorCap = roundCents((input.messbetragCents * SEC35_FACTOR_BP) / 10000);
  const candidates: { key: Sec35Result['cappedBy']; value: number }[] = [
    { key: 'factor', value: factorCap },
    { key: 'actual_trade_tax', value: Math.max(0, input.actualTradeTaxCents) },
    { key: 'income_tax_cap', value: Math.max(0, input.incomeTaxAttributableToCommercialCents) },
  ];
  const min = candidates.reduce((a, b) => (b.value < a.value ? b : a));
  return {
    creditCents: Math.max(0, min.value),
    cappedBy: min.key,
    warnings: ['§35-Anrechnung ist eine Schätzung; der endgültige Betrag hängt von der Einkommensteuerveranlagung ab.'],
  };
}

export interface SoliInput {
  incomeTaxBasisCents: number; // relevant income tax (assessment basis)
  mode: AssessmentMode;
}

export function solidaritySurcharge(input: SoliInput): { soliCents: number; freigrenzeCents: number } {
  const freigrenze = input.mode === 'joint' ? SOLI_FREIGRENZE_JOINT_CENTS : SOLI_FREIGRENZE_SINGLE_CENTS;
  if (input.incomeTaxBasisCents <= freigrenze) {
    return { soliCents: 0, freigrenzeCents: freigrenze };
  }
  const full = roundCents((input.incomeTaxBasisCents * SOLI_RATE_BP) / 10000);
  const phaseIn = roundCents(((input.incomeTaxBasisCents - freigrenze) * SOLI_MARGINAL_RATE_BP) / 10000);
  return { soliCents: Math.max(0, Math.min(full, phaseIn)), freigrenzeCents: freigrenze };
}

export function churchTax(incomeTaxBasisCents: number, rateBp: number, enabled: boolean): number {
  if (!enabled || rateBp <= 0) return 0;
  return roundCents((Math.max(0, incomeTaxBasisCents) * rateBp) / 10000);
}

export interface IncomeTaxReserveInput {
  cogniiqTaxableProfitCents: number;
  otherTaxableIncomeCents: number | null; // income excluding Cogniiq, after personal deductions
  mode: AssessmentMode;
  incomeTaxPrepaymentsCents: number;
  sec35CreditCents: number;
}

export interface IncomeTaxReserveResult {
  hasPersonalInputs: boolean;
  baselineTaxCents: number;
  totalTaxCents: number;
  incrementalTaxCents: number;
  afterSec35Cents: number;
  remainingReserveCents: number;
  warnings: string[];
}

// Incremental business-related income tax = tariff(other + Cogniiq) − tariff(other),
// then reduced by §35 credit and prepayments. Requires the private "other income" input.
export function incomeTaxReserve(input: IncomeTaxReserveInput): IncomeTaxReserveResult {
  const warnings: string[] = [];
  const hasInputs = input.otherTaxableIncomeCents != null;
  const other = input.otherTaxableIncomeCents ?? 0;
  const baseline = incomeTaxTariff2026(Math.floor(other / 100), input.mode) * 100;
  const total = incomeTaxTariff2026(Math.floor((other + input.cogniiqTaxableProfitCents) / 100), input.mode) * 100;
  const incremental = Math.max(0, total - baseline);
  const afterSec35 = Math.max(0, incremental - input.sec35CreditCents);
  const remaining = Math.max(0, afterSec35 - input.incomeTaxPrepaymentsCents);
  if (!hasInputs) {
    warnings.push('Kein privates Einkommen hinterlegt – Einkommensteuer-Schätzung basiert nur auf dem Cogniiq-Gewinn und ist unvollständig.');
  }
  warnings.push('Einkommensteuer ist eine Schätzung; die tatsächliche Steuer hängt von der persönlichen Veranlagung ab.');
  return {
    hasPersonalInputs: hasInputs,
    baselineTaxCents: baseline,
    totalTaxCents: total,
    incrementalTaxCents: incremental,
    afterSec35Cents: afterSec35,
    remainingReserveCents: remaining,
    warnings,
  };
}
