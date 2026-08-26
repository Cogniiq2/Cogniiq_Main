// Adapter: the anonymous customer-portal projection -> the shared TransactionalDocument
// the PREMIUM offer engine consumes.
//
// ── Why this exists ─────────────────────────────────────────────────────────
// The customer's download used to be produced by renderTransactionalPdf, the GENERIC
// finance-report renderer. That model folds paymentTerms, deliveryTerms, assumptions and
// exclusions into a single `keyvalue` section, and the generic keyValue() painter in
// exports/pdf.ts draws every value as ONE right-aligned line and then decrements Y by a
// fixed 15pt. Contractual prose is long, so the text ran off the right edge and the next
// row was painted on top of it. That renderer also has no premium sections at all, so the
// subtitle, executive summary, project approach, desired outcomes, timeline, payment
// schedule and next steps the customer read in PremiumOfferWebView were simply absent,
// and its WinAnsi encoder maps "→" to "?".
//
// The premium engine already solves all of that — real pagination, variable-height rows,
// embedded fonts with correct German/euro glyphs, headings glued to their content, module
// cards, a split investment overview, recurring pricing, timeline, payment plan, and
// list-aware assumptions/exclusions. This adapter is the only thing that was missing.
//
// ── The invariant ───────────────────────────────────────────────────────────
// Every value here comes from the projection the portal already holds — the curated view
// of the IMMUTABLE finalized snapshot returned by `public_offer_by_token`. Nothing is
// re-fetched, nothing is recomputed from mutable owner-side data, and no total is derived
// here. The PDF therefore cannot disagree with what the customer saw and accepted.
//
// Mapping is explicit field by field rather than by spreading, so a field added to the
// projection cannot be silently dropped from the customer's PDF.

import type { PublicOfferProjection } from '@/lib/ownerFinance/offersApi';
import { publicLinesToDocumentItems } from '@/lib/ownerFinance/publicOfferPricing';
import {
  PREMIUM_OFFER_TEMPLATE_KEY,
  TRANSACTIONAL_TEMPLATE_VERSION,
  type PaymentMilestone,
  type TimelinePhase,
  type TransactionalDocument,
} from '../documentModel';

/** Drop empty strings so an absent field never renders as a blank labelled row. */
const clean = (value: string | null | undefined): string | null => {
  const text = (value ?? '').trim();
  return text.length ? text : null;
};

/**
 * The running footer. The premium engine falls back to "name · email"; an offer is a German
 * commercial document, so the seller's postal address and USt-IdNr belong on every page —
 * the previous PDF carried them and dropping them would be a regression. Supplied per
 * document rather than by changing the shared engine, which also renders invoices.
 */
function footerLine(seller: PublicOfferProjection['seller']): string {
  return [
    seller.legal_name,
    sellerAddressLines(seller).join(', ') || null,
    clean(seller.email),
    clean(seller.vat_id) ? `USt-IdNr. ${clean(seller.vat_id)}` : null,
  ].filter(Boolean).join(' · ');
}

/** Seller postal block: "Straße" then "PLZ Ort". Blank components are omitted, not padded. */
function sellerAddressLines(seller: PublicOfferProjection['seller']): string[] {
  return [clean(seller.street), clean([seller.postal_code, seller.city].filter(Boolean).join(' '))]
    .filter((line): line is string => line !== null);
}

/**
 * The recipient block. The projection deliberately exposes no street for the customer
 * portal, so the city is all there is to place — emitting it keeps the letter head
 * truthful without inventing an address.
 */
function recipientAddressLines(recipient: PublicOfferProjection['recipient']): string[] {
  return [clean(recipient?.city)].filter((line): line is string => line !== null);
}

/** Timeline phases, snake_case -> camelCase, dropping fully empty rows. */
function timelinePhases(offer: PublicOfferProjection): TimelinePhase[] {
  return (offer.timeline ?? [])
    .filter((p) => clean(p.phase) || clean(p.title) || clean(p.duration) || clean(p.description))
    .map((p) => ({
      phase: clean(p.phase),
      title: clean(p.title),
      duration: clean(p.duration),
      description: clean(p.description),
    }));
}

/**
 * Payment milestones. `label` is required by the model and is what the reader anchors on,
 * so an unlabelled milestone is dropped — exactly as PremiumOfferWebView filters it.
 * Percentages and amounts are passed through untouched; the premium engine resolves them
 * against the one-time net total, and no amount is recomputed here.
 */
function paymentSchedule(offer: PublicOfferProjection): PaymentMilestone[] {
  return (offer.payment_schedule ?? [])
    .filter((m) => clean(m.label))
    .map((m) => ({
      label: clean(m.label) as string,
      percentageBp: typeof m.percentage_bp === 'number' ? m.percentage_bp : null,
      amountCents: typeof m.amount_cents === 'number' ? m.amount_cents : null,
      note: clean(m.note),
    }));
}

/**
 * Build the premium document for a public offer projection.
 *
 * Pure and synchronous: same projection in, byte-identical document out. That is what lets
 * the download BEFORE acceptance and the download AFTER acceptance be the same PDF — both
 * call this with the same finalized snapshot.
 */
export function publicOfferToPremiumDocument(offer: PublicOfferProjection): TransactionalDocument {
  const seller = offer.seller;
  const recipient = offer.recipient;

  return {
    kind: 'offer',
    language: 'de',
    documentNumber: offer.offer_number,
    title: clean(offer.title) ?? 'Ihr persönliches Angebot',
    subtitle: clean(offer.subtitle),

    seller: {
      name: seller.legal_name,
      addressLines: sellerAddressLines(seller),
      email: clean(seller.email),
      website: clean(seller.website),
      vatId: clean(seller.vat_id),
    },
    recipient: {
      name: clean(recipient?.company) ?? '',
      contactName: clean(recipient?.contact_name),
      addressLines: recipientAddressLines(recipient),
      email: clean(recipient?.email),
    },

    issueDate: offer.issue_date,
    validUntil: offer.valid_until,
    serviceDate: null,
    currency: offer.currency,

    // Narrative sections — the same ones PremiumOfferWebView renders, in the same order.
    introduction: clean(offer.introduction),
    executiveSummary: clean(offer.executive_summary),
    projectApproach: clean(offer.project_approach),
    desiredOutcomes: (offer.desired_outcomes ?? []).map((o) => o?.trim()).filter((o): o is string => Boolean(o)),
    scope: clean(offer.scope),
    timeline: timelinePhases(offer),
    paymentSchedule: paymentSchedule(offer),
    nextSteps: clean(offer.next_steps),

    // Contractual prose. These four are precisely the fields the generic renderer overlapped.
    paymentTerms: clean(offer.payment_terms),
    deliveryTerms: clean(offer.delivery_terms),
    assumptions: clean(offer.assumptions),
    exclusions: clean(offer.exclusions),

    // Positions and totals are passed through verbatim from the finalized snapshot. A
    // recurring line's netCents stays PER INTERVAL — never multiplied by the term — and the
    // headline totals remain the one-time (project) figures the projection carries.
    lines: publicLinesToDocumentItems(offer.lines),
    netTotalCents: offer.net_total_cents,
    vatTotalCents: offer.vat_total_cents,
    grossTotalCents: offer.gross_total_cents,

    footer: footerLine(seller),

    isDraft: false,
    templateKey: PREMIUM_OFFER_TEMPLATE_KEY,
    templateVersion: offer.template_version ?? TRANSACTIONAL_TEMPLATE_VERSION,
  };
}
