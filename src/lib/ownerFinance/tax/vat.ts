// VAT / Vorsteuer calculations. Integer cents throughout. Deductibility is NOT inferred from the
// rate (UStG §15) — callers supply eligibility explicitly.

export type InvoiceVatTreatment =
  | 'standard' | 'reduced' | 'zero_rated' | 'exempt' | 'outside_scope' | 'reverse_charge' | 'unknown';

export type ExpenseVatTreatment =
  | 'domestic_standard' | 'domestic_reduced' | 'no_vat' | 'exempt' | 'outside_scope'
  | 'reverse_charge_13b' | 'intra_community' | 'unknown';

// Treatments that require review before a period can be considered "filing ready".
const REVIEW_INVOICE_TREATMENTS: InvoiceVatTreatment[] = ['unknown'];
const REVIEW_EXPENSE_TREATMENTS: ExpenseVatTreatment[] = ['unknown'];

export function roundCents(value: number): number {
  // Half-away-from-zero to match Postgres round().
  return value < 0 ? -Math.round(-value) : Math.round(value);
}

// Invoice line: net from quantity×unit price, output VAT only for standard/reduced.
export function computeInvoiceLine(quantityMilli: number, unitPriceCents: number, rateBp: number, treatment: InvoiceVatTreatment) {
  const netCents = roundCents((quantityMilli * unitPriceCents) / 1000);
  const hasVat = treatment === 'standard' || treatment === 'reduced';
  const vatCents = hasVat ? roundCents((netCents * rateBp) / 10000) : 0;
  return { netCents, vatCents, grossCents: netCents + vatCents };
}

// Expense line: self-assessed VAT for reverse-charge/intra-community; supplier gross excludes it.
export function computeExpenseLine(netCents: number, rateBp: number, treatment: ExpenseVatTreatment) {
  const hasVat = ['domestic_standard', 'domestic_reduced', 'reverse_charge_13b', 'intra_community'].includes(treatment);
  const vatCents = hasVat ? roundCents((netCents * rateBp) / 10000) : 0;
  const supplierGross = treatment === 'domestic_standard' || treatment === 'domestic_reduced'
    ? netCents + vatCents
    : netCents;
  return { vatCents, grossCents: supplierGross };
}

export function eligibleInputVat(vatCents: number, eligibilityBp: number): number {
  return roundCents((vatCents * eligibilityBp) / 10000);
}

export interface VatPeriodInputs {
  outputVatCents: number;        // domestic output VAT on issued invoices
  reverseChargeOutputCents: number; // self-assessed §13b / intra-community liability
  eligibleInputVatCents: number; // eligible domestic input VAT
  eligibleReverseChargeInputCents: number; // eligible input VAT corresponding to reverse charge
  prepaymentsCents: number;      // VAT already prepaid for the period
  hasUnresolvedTreatments: boolean;
}

export interface VatPeriodResult {
  outputVatCents: number;
  reverseChargeOutputCents: number;
  eligibleInputVatCents: number;
  payableCents: number;          // positive = owed to tax office, negative = refund
  reserveCents: number;          // amount to set aside (never below 0)
  filingReady: boolean;
  warnings: string[];
}

// VAT reserve = output + reverse-charge liability − eligible input − prepayments.
export function vatPeriodSummary(input: VatPeriodInputs): VatPeriodResult {
  const totalInput = input.eligibleInputVatCents + input.eligibleReverseChargeInputCents;
  const payableCents =
    input.outputVatCents + input.reverseChargeOutputCents - totalInput - input.prepaymentsCents;
  const warnings: string[] = [];
  if (input.hasUnresolvedTreatments) {
    warnings.push('Nicht klassifizierte USt-Behandlungen vorhanden – nicht abgabebereit.');
  }
  return {
    outputVatCents: input.outputVatCents,
    reverseChargeOutputCents: input.reverseChargeOutputCents,
    eligibleInputVatCents: totalInput,
    payableCents,
    reserveCents: Math.max(0, payableCents),
    filingReady: !input.hasUnresolvedTreatments,
    warnings,
  };
}

export function invoiceTreatmentNeedsReview(t: InvoiceVatTreatment): boolean {
  return REVIEW_INVOICE_TREATMENTS.includes(t);
}
export function expenseTreatmentNeedsReview(t: ExpenseVatTreatment): boolean {
  return REVIEW_EXPENSE_TREATMENTS.includes(t);
}
