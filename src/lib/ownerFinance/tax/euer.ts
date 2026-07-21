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

// Straight-line depreciation schedule (§7(1)) honoring the actual depreciation start MONTH: the
// first calendar year is reduced pro rata temporis (one twelfth per complete month before the start
// month). `immediate` writes off the full business-use cost in the start year; `manual`/`pool`
// require owner review (no auto schedule). German law may permit other methods in specific
// acquisition windows; those are intentionally not applied silently.
export interface DepreciationInput {
  acquisitionCostCents: number;
  businessUseBp: number;
  method: 'immediate' | 'straight_line' | 'pool' | 'manual';
  usefulLifeMonths: number | null;
  startYear: number;
  startMonth?: number; // 1-12; defaults to January
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
  const startMonth = Math.min(12, Math.max(1, input.startMonth ?? 1));

  if (input.method === 'immediate') {
    years.push({ year: input.startYear, depreciationCents: base, bookValueEndCents: 0 });
    return { base, years, warnings };
  }
  if (input.method !== 'straight_line' || !input.usefulLifeMonths || input.usefulLifeMonths <= 0) {
    warnings.push('Manuelle/Pool-Abschreibung oder fehlende Nutzungsdauer – bitte Wert bestätigen.');
    return { base, years, warnings };
  }

  const life = input.usefulLifeMonths;
  // Cumulative rounding keeps cents reproducible and guarantees the final accumulated total equals
  // the base exactly (and never exceeds it): dep(Y) = round(monthsElapsed·base/life) − prevCum.
  let prevCum = 0;
  for (let i = 0; i < input.years; i += 1) {
    const year = input.startYear + i;
    // Complete depreciation months by the end of this calendar year (first year = 13 − startMonth).
    const monthsElapsed = Math.min(life, Math.max(0, (year - input.startYear) * 12 + (13 - startMonth)));
    const cumEnd = Math.round((monthsElapsed * base) / life);
    const dep = cumEnd - prevCum;
    years.push({ year, depreciationCents: dep, bookValueEndCents: base - cumEnd });
    prevCum = cumEnd;
    if (cumEnd >= base) break;
  }
  return { base, years, warnings };
}
