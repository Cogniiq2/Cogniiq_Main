// German 2026 tax engine (de-2026-v1). Pure, deterministic, independently tested. Planning
// estimates only — never a tax assessment or a filed return.

export { RULES_VERSION, rules, incomeTaxZones2026 } from './rules';
export type { RuleMeta, Verification, ResultKind } from './rules';
export { incomeTaxTariff2026, incomeTaxTariff2026Single, incomeTaxTariff2026Cents } from './income';
export type { AssessmentMode } from './income';
export {
  roundCents,
  computeInvoiceLine,
  computeExpenseLine,
  eligibleInputVat,
  vatPeriodSummary,
  invoiceTreatmentNeedsReview,
  expenseTreatmentNeedsReview,
} from './vat';
export type { InvoiceVatTreatment, ExpenseVatTreatment, VatPeriodInputs, VatPeriodResult } from './vat';
export { tradeTax, sec35Credit, solidaritySurcharge, churchTax, incomeTaxReserve } from './businessTax';
export type {
  TradeTaxInput, TradeTaxResult, Sec35Input, Sec35Result, SoliInput,
  IncomeTaxReserveInput, IncomeTaxReserveResult,
} from './businessTax';
export { euerResult, depreciationSchedule } from './euer';
export type { EuerInput, EuerResult, DepreciationInput, DepreciationYear } from './euer';
export { combinedReserve, safelyAvailableCash } from './reserve';
export type { ReserveInput, ReserveResult } from './reserve';
