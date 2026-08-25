// The three surfaces must draw the same list.
//
// "Nicht enthalten" is a list the owner types one entry per line. Before the fix the owner's
// preview and the PDF both collapsed it into one running paragraph, and the customer portal
// rendered it inside a bare <p> where HTML collapses newlines anyway. All three are pinned here:
// the two HTML surfaces by rendering them, the PDF by the PremiumSource model it and the preview
// both consume (buildPremiumSource resolves the list/prose decision once, so the printed document
// cannot disagree with the preview it was previewed from).

import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PremiumOfferWebView } from '@/components/finance/PremiumOfferWebView';
import { PremiumOfferPreview } from '@/pages/owner/PremiumOfferPreview';
import { buildPremiumSource } from '@/lib/ownerFinance/documents/premium';
import type { PublicOfferProjection, PublicOfferLine } from '@/lib/ownerFinance/offersApi';
import type { TransactionalDocument, DocumentLineItem } from '@/lib/ownerFinance/documents/documentModel';

const EXCLUSIONS = [
  'Vollständige Finanzzentrale und Finanzbuchhaltung',
  'Automatische Stripe- und PayPal-Abstimmung',
  'Bankkontenabgleich',
  'Automatische Zuordnung von Auszahlungen zu Bankbewegungen',
  'Monatliche Finanz- und Steuerberaterberichte',
  'DATEV- oder vergleichbare Buchhaltungsexporte',
  'Erweiterte Gutscheinverwaltung',
  'Automatisierte Behandlung fehlgeschlagener E-Mails',
  'Individuelle Neuentwicklungen außerhalb des beschriebenen Leistungsumfangs',
  'Steuer- oder Rechtsberatung',
];
const EXCLUSIONS_TEXT = EXCLUSIONS.join('\n');

const ASSUMPTIONS_PROSE = 'Das Angebot basiert auf der bestehenden technischen Plattform und den '
  + 'aktuell vorhandenen Buchungs-, Mitglieder- und Zahlungsprozessen des SV Heinersreuth.';

const vat19 = (net: number) => Math.round((net * 1900) / 10000);

function publicLine(description: string, net: number): PublicOfferLine {
  return {
    description, quantity_milli: 1000, unit: 'Pauschal', unit_price_cents: net,
    vat_rate_bp: 1900, vat_treatment: 'standard',
    net_cents: net, vat_cents: vat19(net), gross_cents: net + vat19(net), is_optional: false,
    pricing_type: 'one_time', billing_interval: null, minimum_term_months: null,
    billing_start_type: null, billing_start_label: null,
  };
}

function projection(over: Partial<PublicOfferProjection> = {}): PublicOfferProjection {
  return {
    offer_number: 'AN-2026-0100', title: 'Cogniiq Admin', subtitle: null, status: 'sent',
    issue_date: '2026-08-24', valid_until: '2026-09-23', currency: 'EUR',
    introduction: null, executive_summary: null, project_approach: null, next_steps: null,
    scope: null, assumptions: null, exclusions: null, payment_terms: null, delivery_terms: null,
    desired_outcomes: [], timeline: [], payment_schedule: [],
    net_total_cents: 390000, vat_total_cents: 74100, gross_total_cents: 464100,
    lines: [publicLine('Einrichtung & Inbetriebnahme', 390000)],
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
    ...over,
  };
}

function docLine(description: string, net: number): DocumentLineItem {
  return {
    description, quantityMilli: 1000, unit: 'Pauschal', unitPriceCents: net,
    vatRateBp: 1900, vatTreatment: 'standard',
    netCents: net, vatCents: vat19(net), grossCents: net + vat19(net), isOptional: false,
    pricingType: 'one_time',
  };
}

function previewDoc(over: Partial<TransactionalDocument> = {}): TransactionalDocument {
  return {
    kind: 'offer', language: 'de', documentNumber: 'AN-2026-0100', title: 'Cogniiq Admin',
    seller: { name: 'Cogniiq', addressLines: [] },
    recipient: { name: 'SV Heinersreuth', addressLines: [] },
    issueDate: '2026-08-24', validUntil: '2026-09-23', currency: 'EUR',
    lines: [docLine('Einrichtung & Inbetriebnahme', 390000)],
    netTotalCents: 390000, vatTotalCents: 74100, grossTotalCents: 464100,
    paymentSchedule: [], isDraft: true, templateVersion: 'transactional-v1',
    ...over,
  };
}

/** The bullet rows a rendered surface shows, in order. */
function renderedItems(container: HTMLElement): string[] {
  return [...container.querySelectorAll('li')].map((li) => li.textContent?.replace(/^\s*[•·]\s*/, '').trim() ?? '');
}

describe('5. preview, PDF model and portal render the same list', () => {
  it('the customer portal shows one row per exclusion', () => {
    const { container } = render(
      <PremiumOfferWebView offer={projection({ exclusions: EXCLUSIONS_TEXT })} greeting="Guten Tag" />,
    );
    expect(renderedItems(container)).toEqual(EXCLUSIONS);
  });

  it("the owner's preview shows one row per exclusion", () => {
    render(<PremiumOfferPreview doc={previewDoc({ exclusions: EXCLUSIONS_TEXT })} />);
    const heading = screen.getByText('Nicht enthalten').parentElement!;
    expect(renderedItems(heading)).toEqual(EXCLUSIONS);
  });

  it('the PDF consumes the identical resolved list from the shared source model', () => {
    const src = buildPremiumSource(previewDoc({ exclusions: EXCLUSIONS_TEXT }));
    expect(src.exclusions).toEqual({ kind: 'list', items: EXCLUSIONS });
  });

  it('all three agree entry-for-entry', () => {
    const { container: portal } = render(
      <PremiumOfferWebView offer={projection({ exclusions: EXCLUSIONS_TEXT })} greeting="Guten Tag" />,
    );
    const portalItems = renderedItems(portal);

    const { container: preview } = render(<PremiumOfferPreview doc={previewDoc({ exclusions: EXCLUSIONS_TEXT })} />);
    const previewItems = renderedItems(
      within(preview).getByText('Nicht enthalten').parentElement as HTMLElement,
    );

    const src = buildPremiumSource(previewDoc({ exclusions: EXCLUSIONS_TEXT }));
    const pdfItems = src.exclusions?.kind === 'list' ? src.exclusions.items : [];

    expect(portalItems).toEqual(previewItems);
    expect(previewItems).toEqual(pdfItems);
    expect(pdfItems).toEqual(EXCLUSIONS);
  });

  it('a hand-typed "•" does not produce a doubled bullet on any surface', () => {
    const typed = EXCLUSIONS.map((e) => `• ${e}`).join('\r\n');

    const { container: portal } = render(
      <PremiumOfferWebView offer={projection({ exclusions: typed })} greeting="Guten Tag" />,
    );
    expect(renderedItems(portal)).toEqual(EXCLUSIONS);
    for (const li of portal.querySelectorAll('li')) {
      expect(li.textContent).not.toMatch(/[•·]\s*[•·]/);
    }

    const src = buildPremiumSource(previewDoc({ exclusions: typed }));
    expect(src.exclusions).toEqual({ kind: 'list', items: EXCLUSIONS });
  });
});

describe('6. ordinary prose fields stay paragraphs on every surface', () => {
  it('a one-paragraph "Annahmen" is not turned into a bullet list in the portal', () => {
    const { container } = render(
      <PremiumOfferWebView offer={projection({ assumptions: ASSUMPTIONS_PROSE })} greeting="Guten Tag" />,
    );
    expect(container.querySelectorAll('li')).toHaveLength(0);
    expect(screen.getByText(/Das Angebot basiert auf der bestehenden technischen Plattform/)).toBeTruthy();
  });

  it('a one-paragraph "Annahmen" stays prose in the shared source model', () => {
    const src = buildPremiumSource(previewDoc({ assumptions: ASSUMPTIONS_PROSE }));
    expect(src.assumptions).toEqual({ kind: 'prose', text: ASSUMPTIONS_PROSE });
  });

  it('the prose fields around it are untouched — introduction and next steps are not listified', () => {
    const src = buildPremiumSource(previewDoc({
      introduction: 'Zeile eins\nZeile zwei',
      nextSteps: 'Schritt eins\nSchritt zwei',
    }));
    // Still plain strings on the model: only list-capable fields resolve to a TextBlock.
    expect(typeof src.introduction).toBe('string');
    expect(typeof src.nextSteps).toBe('string');
  });

  it('an offer with no assumptions or exclusions renders neither section content', () => {
    const src = buildPremiumSource(previewDoc());
    expect(src.assumptions).toBeNull();
    expect(src.exclusions).toBeNull();
  });
});
