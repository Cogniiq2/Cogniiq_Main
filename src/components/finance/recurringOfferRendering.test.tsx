// What the customer and the owner actually SEE for a recurring offer.
//
// The pricing maths is pinned in offerRecurringPricing.test.ts; these tests render the two
// HTML surfaces — the customer portal view and the owner's live preview — and assert the
// commercial hierarchy on screen: the monthly amount is a headline of its own, the position
// is never multiplied out over the term, and the first-term contract value appears only as a
// secondary note that says it is not due now.

import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PremiumOfferWebView } from '@/components/finance/PremiumOfferWebView';
import { PremiumOfferPreview } from '@/pages/owner/PremiumOfferPreview';
import type { PublicOfferProjection, PublicOfferLine } from '@/lib/ownerFinance/offersApi';
import type { TransactionalDocument, DocumentLineItem } from '@/lib/ownerFinance/documents/documentModel';

const vat19 = (net: number) => Math.round((net * 1900) / 10000);

function publicLine(over: Partial<PublicOfferLine> & { description: string; net: number }): PublicOfferLine {
  const { net, ...rest } = over;
  return {
    quantity_milli: 1000, unit: 'Pauschal', unit_price_cents: net,
    vat_rate_bp: 1900, vat_treatment: 'standard',
    net_cents: net, vat_cents: vat19(net), gross_cents: net + vat19(net), is_optional: false,
    pricing_type: 'one_time', billing_interval: null, minimum_term_months: null,
    billing_start_type: null, billing_start_label: null,
    ...rest,
  };
}

/** The Admin package: 3.900 € einmalig + 290 € / Monat, 12 Monate ab Inbetriebnahme. */
const ADMIN_LINES: PublicOfferLine[] = [
  publicLine({ description: 'Einrichtung & Inbetriebnahme', net: 390000 }),
  publicLine({
    description: 'Laufende Betreuung & Betrieb', net: 29000, unit: 'Monat',
    unit_price_cents: 29000, pricing_type: 'recurring', billing_interval: 'monthly',
    minimum_term_months: 12, billing_start_type: 'commissioning',
  }),
];

function projection(lines: PublicOfferLine[]): PublicOfferProjection {
  return {
    offer_number: 'AN-2026-0100', title: 'Cogniiq Admin', subtitle: null, status: 'sent',
    issue_date: '2026-08-24', valid_until: '2026-09-23', currency: 'EUR',
    introduction: null, executive_summary: null, project_approach: null, next_steps: null,
    scope: null, assumptions: null, exclusions: null, payment_terms: null, delivery_terms: null,
    desired_outcomes: [], timeline: [],
    payment_schedule: [
      { label: 'Bei Auftragserteilung', percentage_bp: 5000 },
      { label: 'Nach Fertigstellung und Übergabe', percentage_bp: 5000 },
    ],
    net_total_cents: 390000, vat_total_cents: 74100, gross_total_cents: 464100,
    lines,
    recipient: {
      company: 'SV Heinersreuth', contact_name: null, city: null, email: null,
      salutation: null, title: null, first_name: null, last_name: null, greeting_name: null,
    },
    accepted: false, rejected: false, expired: false, has_pdf: false, document_version: null,
    template_version: 'cogniiq-premium-offer-v2', accepted_signer_name: null, accepted_at: null,
    signed_document_available: false,
    seller: {
      legal_name: 'Cogniiq', street: null, postal_code: null, city: null,
      country_code: 'DE', email: null, website: null, vat_id: null,
    },
  };
}

function docLine(over: Partial<DocumentLineItem> & { description: string; net: number }): DocumentLineItem {
  const { net, ...rest } = over;
  return {
    quantityMilli: 1000, unit: 'Pauschal', unitPriceCents: net,
    vatRateBp: 1900, vatTreatment: 'standard',
    netCents: net, vatCents: vat19(net), grossCents: net + vat19(net), isOptional: false,
    pricingType: 'one_time',
    ...rest,
  };
}

function previewDoc(lines: DocumentLineItem[]): TransactionalDocument {
  return {
    kind: 'offer', language: 'de', documentNumber: 'AN-2026-0100', title: 'Cogniiq Admin',
    seller: { name: 'Cogniiq', addressLines: [] },
    recipient: { name: 'SV Heinersreuth', addressLines: [] },
    issueDate: '2026-08-24', validUntil: '2026-09-23', currency: 'EUR',
    lines, netTotalCents: 390000, vatTotalCents: 74100, grossTotalCents: 464100,
    paymentSchedule: [
      { label: 'Bei Auftragserteilung', percentageBp: 5000 },
      { label: 'Nach Fertigstellung und Übergabe', percentageBp: 5000 },
    ],
    isDraft: true, templateVersion: 'transactional-v1',
  };
}

const ADMIN_DOC_LINES: DocumentLineItem[] = [
  docLine({ description: 'Einrichtung & Inbetriebnahme', net: 390000 }),
  docLine({
    description: 'Laufende Betreuung & Betrieb', net: 29000, unit: 'Monat',
    pricingType: 'recurring', billingInterval: 'monthly', minimumTermMonths: 12,
    billingStartType: 'commissioning',
  }),
];

describe('customer portal view of a recurring offer', () => {
  it('shows the one-time and the monthly amount as two separate headlines', () => {
    render(<PremiumOfferWebView offer={projection(ADMIN_LINES)} greeting="Guten Tag" />);
    const investition = screen.getByRole('heading', { name: 'Ihre Investition' }).closest('section')!;

    expect(within(investition).getByText('Einmalige Investition')).toBeTruthy();
    expect(within(investition).getByText('4.641,00 €')).toBeTruthy();
    expect(within(investition).getByText('Laufende Betreuung')).toBeTruthy();
    expect(within(investition).getByText('345,10 €')).toBeTruthy();
    // Net figures for both sides stay visible — VAT is never hidden.
    expect(within(investition).getByText('3.900,00 €')).toBeTruthy();
    expect(within(investition).getByText('290,00 €')).toBeTruthy();
  });

  it('never shows a fused total for the whole minimum term as a headline', () => {
    render(<PremiumOfferWebView offer={projection(ADMIN_LINES)} greeting="Guten Tag" />);
    const investition = screen.getByRole('heading', { name: 'Ihre Investition' }).closest('section')!;
    const secondary = within(investition).getByText(/Gesamtwert während der ersten Mindestlaufzeit/);

    // 7.380 € appears exactly once, inside the small secondary paragraph, flagged as not due.
    expect(secondary.textContent).toContain('7.380,00 € netto');
    expect(secondary.textContent).toMatch(/Nicht sofort fällig/);
    expect(within(investition).queryAllByText('7.380,00 €')).toHaveLength(0);
  });

  it('renders the recurring position per month with its contract facts', () => {
    render(<PremiumOfferWebView offer={projection(ADMIN_LINES)} greeting="Guten Tag" />);
    const card = screen.getByText('Laufende Betreuung & Betrieb').closest('div.rounded-2xl')!;

    expect(card.textContent).toContain('290,00 €');
    expect(card.textContent).toContain('/ Monat');
    expect(card.textContent).toContain('Mindestlaufzeit:');
    expect(card.textContent).toContain('12 Monate');
    expect(card.textContent).toContain('Abrechnung:');
    expect(card.textContent).toContain('monatlich');
    expect(card.textContent).toContain('Beginn:');
    expect(card.textContent).toContain('ab Inbetriebnahme');
    // The old, wrong presentation must be gone.
    expect(card.textContent).not.toContain('3.480');
    expect(card.textContent).not.toContain('12 Monat ');
  });

  it('tells the customer the payment plan covers only the one-time amount', () => {
    render(<PremiumOfferWebView offer={projection(ADMIN_LINES)} greeting="Guten Tag" />);
    const plan = screen.getByRole('heading', { name: 'Zahlungsplan' }).closest('section')!;
    expect(plan.textContent).toMatch(/beziehen sich auf die einmalige Projektinvestition/);
  });

  it('leaves a purely one-time offer looking exactly as before', () => {
    const oneTimeOnly = [publicLine({ description: 'Projekt', net: 390000 })];
    render(<PremiumOfferWebView offer={projection(oneTimeOnly)} greeting="Guten Tag" />);
    const investition = screen.getByRole('heading', { name: 'Ihre Investition' }).closest('section')!;

    expect(within(investition).getByText('Gesamt (brutto)')).toBeTruthy();
    expect(within(investition).queryByText('Laufende Betreuung')).toBeNull();
    expect(within(investition).queryByText(/Gesamtwert während der ersten Mindestlaufzeit/)).toBeNull();
    expect(screen.getByRole('heading', { name: 'Zahlungsplan' }).closest('section')!.textContent)
      .not.toMatch(/beziehen sich auf die einmalige Projektinvestition/);
  });

  it('does not reinterpret a historical "12 × Monat" position', () => {
    // A finalized offer written the old way projects no pricing_type at all.
    const legacy: PublicOfferLine[] = [{
      description: 'Betreuung', quantity_milli: 12000, unit: 'Monat', unit_price_cents: 29000,
      vat_rate_bp: 1900, vat_treatment: 'standard',
      net_cents: 348000, vat_cents: 66120, gross_cents: 414120, is_optional: false,
    }];
    render(<PremiumOfferWebView offer={projection(legacy)} greeting="Guten Tag" />);
    const card = screen.getByText('Betreuung').closest('div.rounded-2xl')!;

    expect(card.textContent).toContain('3.480,00 €');
    expect(card.textContent).toContain('12 Monat');
    expect(card.textContent).not.toContain('/ Monat');
    expect(card.textContent).not.toContain('Mindestlaufzeit');
  });
});

describe('owner live preview of a recurring offer', () => {
  it('shows the same split the customer will see', () => {
    render(<PremiumOfferPreview doc={previewDoc(ADMIN_DOC_LINES)} />);
    const investition = screen.getByText('Investitionsübersicht').closest('section')!;

    expect(within(investition).getByText('Einmalige Investition')).toBeTruthy();
    expect(within(investition).getByText('Einmalige Investition (brutto)')).toBeTruthy();
    expect(within(investition).getByText('4.641,00 €')).toBeTruthy();
    expect(within(investition).getByText('Laufende Betreuung')).toBeTruthy();
    expect(within(investition).getByText('Laufende Betreuung (brutto)')).toBeTruthy();
    expect(within(investition).getByText('345,10 € / Monat')).toBeTruthy();
    expect(within(investition).getByText(/Gesamtwert während der ersten Mindestlaufzeit/).textContent)
      .toContain('7.380,00 € netto');
  });

  it('states the contract facts under the recurring position', () => {
    render(<PremiumOfferPreview doc={previewDoc(ADMIN_DOC_LINES)} />);
    const module = screen.getByText('Laufende Betreuung & Betrieb').closest('div.rounded-xl')!;

    expect(module.textContent).toContain('290,00 €');
    expect(module.textContent).toContain('/ Monat');
    expect(module.textContent).toContain('12 Monate');
    expect(module.textContent).toContain('monatlich');
    expect(module.textContent).toContain('ab Inbetriebnahme');
  });

  it('keeps the single headline for a one-time-only offer', () => {
    render(<PremiumOfferPreview doc={previewDoc([docLine({ description: 'Projekt', net: 390000 })])} />);
    const investition = screen.getByText('Investitionsübersicht').closest('section')!;

    expect(within(investition).getByText('Gesamtinvestition (brutto)')).toBeTruthy();
    expect(within(investition).queryByText('Laufende Betreuung')).toBeNull();
  });
});
