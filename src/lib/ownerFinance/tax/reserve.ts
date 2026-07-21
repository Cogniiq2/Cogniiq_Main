// Combined owner tax reserve. Integer cents. Aggregates the individual estimates; VAT is never
// treated as a normal operating expense here.

export interface ReserveInput {
  vatReserveCents: number;              // from vatPeriodSummary (>= 0)
  businessIncomeTaxReserveCents: number; // incremental income tax after §35 and prepayments
  tradeTaxRemainingCents: number;        // trade tax minus prepayments (>= 0)
  soliRemainingCents: number;            // soli minus prepayments (>= 0)
  churchTaxRemainingCents: number;       // church tax minus prepayments (>= 0)
}

export interface ReserveResult {
  totalReserveCents: number;
  breakdown: { key: string; label: string; valueCents: number }[];
}

export function combinedReserve(input: ReserveInput): ReserveResult {
  const breakdown = [
    { key: 'vat', label: 'Umsatzsteuer-Rücklage', valueCents: Math.max(0, input.vatReserveCents) },
    { key: 'income_tax', label: 'Einkommensteuer (anteilig)', valueCents: Math.max(0, input.businessIncomeTaxReserveCents) },
    { key: 'trade_tax', label: 'Gewerbesteuer', valueCents: Math.max(0, input.tradeTaxRemainingCents) },
    { key: 'soli', label: 'Solidaritätszuschlag', valueCents: Math.max(0, input.soliRemainingCents) },
    { key: 'church_tax', label: 'Kirchensteuer', valueCents: Math.max(0, input.churchTaxRemainingCents) },
  ];
  return {
    totalReserveCents: breakdown.reduce((sum, b) => sum + b.valueCents, 0),
    breakdown,
  };
}

// Safely available cash = recorded cash − reserves − upcoming committed expenses in the horizon.
// Returns null-safe result; caller must flag when no bank balance is configured.
export function safelyAvailableCash(params: {
  recordedCashCents: number | null;
  totalReserveCents: number;
  upcomingCommittedCents: number;
}): { availableCents: number | null; exact: boolean } {
  if (params.recordedCashCents == null) {
    return { availableCents: null, exact: false };
  }
  return {
    availableCents: params.recordedCashCents - params.totalReserveCents - params.upcomingCommittedCents,
    exact: true,
  };
}
