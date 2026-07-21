// EÜR (Einnahmenüberschussrechnung) operating result. Cash principle (§11 EStG) for ordinary
// receipts/expenses, with depreciation (§7) and explicit manual adjustments handled separately.
// Pure; integer cents.

export interface EuerInput {
  paidRevenueNetCents: number;      // received business income (net of VAT)
  paidDeductibleExpenseCents: number; // paid, deductible business expenses (net, after deductibility %)
  depreciationCents: number;        // AfA for the period (not cash)
  manualAdjustmentsCents: number;   // explicit tax adjustments (+/-)
}

export interface EuerResult {
  taxableProfitCents: number;
  warnings: string[];
}

// Estimated taxable business profit = paid net revenue − paid deductible expenses − depreciation
// + manual adjustments. VAT is never treated as an operating expense here.
export function euerResult(input: EuerInput): EuerResult {
  const profit =
    input.paidRevenueNetCents -
    input.paidDeductibleExpenseCents -
    input.depreciationCents +
    input.manualAdjustmentsCents;
  return {
    taxableProfitCents: profit,
    warnings: [
      'EÜR-Ergebnis ist eine Schätzung nach Zufluss-/Abflussprinzip; regelmäßig wiederkehrende Zahlungen um den Jahreswechsel (§11 Abs.1/2 S.2) sind gesondert zu prüfen.',
    ],
  };
}

// Straight-line depreciation schedule (§7(1)) as reproducible monthly entries. `immediate` writes
// off the full business-use cost in the first period; `manual`/`pool` return a single-line summary
// and require owner review. Business-use fraction is applied to the base.
export interface DepreciationInput {
  acquisitionCostCents: number;
  businessUseBp: number;
  method: 'immediate' | 'straight_line' | 'pool' | 'manual';
  usefulLifeMonths: number | null;
  startYear: number;
  years: number; // how many calendar years of schedule to produce
}

export interface DepreciationYear {
  year: number;
  depreciationCents: number;
  bookValueEndCents: number;
}

export function depreciationSchedule(input: DepreciationInput): { base: number; years: DepreciationYear[]; warnings: string[] } {
  const base = Math.round((input.acquisitionCostCents * input.businessUseBp) / 10000);
  const warnings: string[] = ['Abschreibung ist eine Schätzung bis zur Prüfung; Nutzungsdauer laut amtlicher AfA-Tabelle.'];
  const years: DepreciationYear[] = [];

  if (input.method === 'immediate') {
    years.push({ year: input.startYear, depreciationCents: base, bookValueEndCents: 0 });
    return { base, years, warnings };
  }
  if (input.method !== 'straight_line' || !input.usefulLifeMonths || input.usefulLifeMonths <= 0) {
    warnings.push('Manuelle/Pool-Abschreibung oder fehlende Nutzungsdauer – bitte Wert bestätigen.');
    return { base, years, warnings };
  }

  const perMonth = base / input.usefulLifeMonths;
  let remaining = base;
  for (let i = 0; i < input.years; i += 1) {
    const monthsThisYear = 12;
    let dep = Math.round(perMonth * monthsThisYear);
    if (dep > remaining) dep = remaining;
    remaining -= dep;
    years.push({ year: input.startYear + i, depreciationCents: dep, bookValueEndCents: remaining });
    if (remaining <= 0) break;
  }
  return { base, years, warnings };
}
