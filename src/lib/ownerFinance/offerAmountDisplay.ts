// Owner-facing offer "amount" display: list columns, pipeline KPIs and exports.
//
// owner_offers.{net,vat,gross}_total_cents now mean the ONE-TIME portion only (migration
// 20260824193000). Every place that showed `gross_total_cents` as "the offer's amount" was
// written when that column meant the whole offer, so a recurring-only accepted deal — a real,
// signed contract worth real money — silently reads as "0,00 €": it drops out of a min-amount
// filter, sorts as the smallest deal in the list, and disappears from the "Brutto gesamt" /
// "Angenommen" sums in the PDF/XLSX export. This module is the single place that turns the two
// separate totals back into something an owner-facing list or report can show honestly, so a
// recurring deal is never silently invisible.
//
// This is internal/admin-only. The customer-facing split presentation (offerPricing.ts,
// premiumSource.ts, PremiumOfferWebView.tsx) is untouched and unrelated to this module.

export interface OfferAmountFields {
  gross_total_cents: number;
  recurring_monthly_gross_cents?: number;
}

/** Whether the offer carries a committed recurring (monthly) amount. */
export function offerHasRecurringAmount(o: OfferAmountFields): boolean {
  return (o.recurring_monthly_gross_cents ?? 0) > 0;
}

/**
 * A single sortable/filterable number for list views. NOT a real amount owed — one-time cents
 * and a per-month rate are different units, so this is only a deal-size heuristic that keeps a
 * recurring-only offer from sorting as zero and vanishing from a min-amount filter. Never
 * render this value directly; use `formatOfferAmount` for display.
 */
export function offerPipelineSortValueCents(o: OfferAmountFields): number {
  return o.gross_total_cents + (o.recurring_monthly_gross_cents ?? 0);
}

/**
 * Render an offer's amount for a list/report cell: the one-time gross, the recurring monthly
 * gross, or both — never fused into one number. Falls back to "—" only when there is truly
 * nothing to show (a draft with no priced lines yet).
 */
export function formatOfferAmount(
  o: OfferAmountFields, currency: string, formatCents: (cents: number, currency?: string) => string,
): string {
  const oneTime = o.gross_total_cents;
  const monthly = o.recurring_monthly_gross_cents ?? 0;
  if (oneTime > 0 && monthly > 0) return `${formatCents(oneTime, currency)} + ${formatCents(monthly, currency)} / Monat`;
  if (monthly > 0) return `${formatCents(monthly, currency)} / Monat`;
  if (oneTime > 0) return formatCents(oneTime, currency);
  return '—';
}
