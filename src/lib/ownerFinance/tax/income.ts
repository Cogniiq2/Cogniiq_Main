// German income tax tariff §32a EStG 2026. Pure and deterministic. Works in whole euros as the
// tariff requires; monetary amounts elsewhere in the app are integer cents.

import { incomeTaxZones2026 } from './rules';

export type AssessmentMode = 'single' | 'joint';

// Tariff for a SINGLE assessment. `taxableIncomeEuros` is rounded down to whole euros.
export function incomeTaxTariff2026Single(taxableIncomeEuros: number): number {
  const x = Math.floor(Math.max(0, taxableIncomeEuros));
  for (const zone of incomeTaxZones2026) {
    if (x <= zone.upTo) {
      return Math.floor(zone.compute(x)); // tariff amount rounded down to whole euros
    }
  }
  return 0;
}

// Tariff honoring the splitting method for joint assessment: 2 × tariff(zvE / 2).
export function incomeTaxTariff2026(taxableIncomeEuros: number, mode: AssessmentMode): number {
  if (mode === 'joint') {
    return 2 * incomeTaxTariff2026Single(Math.floor(Math.max(0, taxableIncomeEuros) / 2));
  }
  return incomeTaxTariff2026Single(taxableIncomeEuros);
}

// Convenience wrappers using integer cents at the boundary.
export function incomeTaxTariff2026Cents(taxableIncomeCents: number, mode: AssessmentMode): number {
  const euros = Math.floor(Math.max(0, taxableIncomeCents) / 100);
  return incomeTaxTariff2026(euros, mode) * 100;
}
