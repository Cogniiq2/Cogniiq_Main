/*
  What of an offer's ONE-TIME amount may still be invoiced.

  Warning the owner that "Rate 1 already exists" was not enough: with Rate 1 (1.950 EUR) billed,
  nothing stopped a second Rate 1, or a full 3.900 EUR conversion on top — 5.850 EUR of invoices
  against a 3.900 EUR contract. This module derives what remains billable from what has already
  been billed, so the dialog can disable rather than merely warn.

  It is the presentation half of the rule; the authoritative half lives in the database
  (unique indexes on (source_offer_id, source_offer_milestone_index) and on source_offer_id for
  full conversions, plus matching checks inside convert_owner_offer_to_invoice_draft). This
  module never has to be trusted for correctness — a stale browser tab that offers a taken rate
  gets a clean refusal from the RPC — but keeping the two in step is what makes the UI honest.

  Recurring positions never appear here at all: they are a separate billing track and are
  excluded from every conversion regardless of what is chosen.
*/

/** One prior conversion, as recorded on the invoice it produced. */
export interface OfferConversionRecord {
  source_offer_conversion_kind?: 'full' | 'milestone' | null;
  source_offer_milestone_index?: number | null;
}

export type UnavailableReason =
  /** This exact instalment already produced an invoice. */
  | 'already_invoiced'
  /** The whole one-time amount was invoiced in one go; nothing may be added to it. */
  | 'full_already_invoiced'
  /** Instalments exist, so billing the full amount again would exceed the contract. */
  | 'instalments_exist';

export interface MilestoneAvailability {
  index: number;
  available: boolean;
  reason: UnavailableReason | null;
}

export interface OfferConversionAvailability {
  milestones: MilestoneAvailability[];
  fullAvailable: boolean;
  fullReason: UnavailableReason | null;
  /** True when no part of the one-time amount can be invoiced any more. */
  nothingInvoiceable: boolean;
}

/**
 * @param milestoneCount how many milestones the offer's frozen payment_schedule holds (0 = none)
 * @param existing       prior conversions of this offer, in any invoice status — a cancelled
 *                       invoice deliberately keeps its slot (see the migration's index comment)
 */
export function offerConversionAvailability(
  milestoneCount: number,
  existing: OfferConversionRecord[],
): OfferConversionAvailability {
  const fullInvoiced = existing.some((e) => e.source_offer_conversion_kind === 'full');
  const invoicedMilestones = new Set(
    existing
      .filter((e) => e.source_offer_conversion_kind === 'milestone' && typeof e.source_offer_milestone_index === 'number')
      .map((e) => e.source_offer_milestone_index as number),
  );

  const milestones: MilestoneAvailability[] = Array.from({ length: milestoneCount }, (_, index) => {
    if (fullInvoiced) return { index, available: false, reason: 'full_already_invoiced' };
    if (invoicedMilestones.has(index)) return { index, available: false, reason: 'already_invoiced' };
    return { index, available: true, reason: null };
  });

  // The full amount is only offerable as a clean slate: any instalment already billed means
  // billing the whole amount again would over-invoice the contract.
  const fullReason: UnavailableReason | null = fullInvoiced
    ? 'full_already_invoiced'
    : invoicedMilestones.size > 0
      ? 'instalments_exist'
      : null;

  return {
    milestones,
    fullAvailable: fullReason === null,
    fullReason,
    nothingInvoiceable: fullReason !== null && !milestones.some((m) => m.available),
  };
}
