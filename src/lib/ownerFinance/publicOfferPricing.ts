// Bridge from the anonymous customer-portal projection to the shared pricing model.
//
// The portal receives a curated projection (never the raw offer row), but it must show the
// customer exactly the split the owner saw in the editor, the preview and the PDF. Mapping
// the projected lines into DocumentLineItem lets the portal call the very same
// `computeOfferPricing`, which is what keeps the four surfaces from drifting apart.

import type { DocumentLineItem } from '@/lib/ownerFinance/documents/documentModel';
import type { PublicOfferLine } from '@/lib/ownerFinance/offersApi';

/**
 * Map projected offer lines onto the shared line model. Offers finalized before recurring
 * pricing existed project no pricing fields at all, so they read back as one-time and keep
 * exactly the presentation they were signed with.
 */
export function publicLinesToDocumentItems(lines: PublicOfferLine[]): DocumentLineItem[] {
  return lines.map((l) => ({
    description: l.description,
    details: l.details ?? null,
    // Presentation-only; ignored by computeOfferPricing, rendered by the premium PDF.
    deliverables: (l.deliverables ?? []).filter((d): d is string => Boolean(d && d.trim())),
    phaseLabel: l.phase_label ?? null,
    durationLabel: l.duration_label ?? null,
    quantityMilli: l.quantity_milli,
    unit: l.unit,
    unitPriceCents: l.unit_price_cents,
    vatRateBp: l.vat_rate_bp,
    vatTreatment: l.vat_treatment,
    netCents: l.net_cents,
    vatCents: l.vat_cents,
    grossCents: l.gross_cents,
    isOptional: l.is_optional,
    pricingType: l.pricing_type === 'recurring' ? 'recurring' : 'one_time',
    billingInterval: l.billing_interval ?? null,
    minimumTermMonths: l.minimum_term_months ?? null,
    billingStartType: l.billing_start_type ?? null,
    billingStartLabel: l.billing_start_label ?? null,
  }));
}

/** "12 Monate" / "1 Monat" — null when there is no minimum term. */
export function termMonthsLabel(months: number | null | undefined): string | null {
  if (typeof months !== 'number' || months <= 0) return null;
  return `${months} ${months === 1 ? 'Monat' : 'Monate'}`;
}
