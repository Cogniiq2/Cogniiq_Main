// "Rechnung aus Angebot erstellen" — the payment-plan-aware conversion dialog.
//
// Before this dialog existed, clicking the button silently created a draft for the whole
// one-time amount even when a 50/50 payment plan existed. These tests hold the fixed UX: rate
// options are shown with their computed amounts, a recurring-only offer is refused before any
// network call, and invoices already created from the offer are surfaced as a warning so a rate
// is not accidentally billed twice.

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { OwnerOffer } from '@/lib/ownerFinance/types';

// src/lib/supabase.ts validates its configuration at module scope and throws without it. The
// dashboard barrel (Modal/Button/StatusBadge/useToast) reaches it transitively, so the client has
// to be constructible even though every data path below is mocked and no request is ever made.
// Stubbed BEFORE the dialog is imported — a static top-level import would resolve the whole
// module graph (including the barrel) before this line ever ran.
vi.stubEnv('VITE_SUPABASE_URL', 'https://convert-offer-test.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

const { ConvertOfferToInvoiceDialog } = await import('./ConvertOfferToInvoiceDialog');
const { ToastProvider } = await import('@/components/dashboard');

function renderDialog(node: React.ReactElement) {
  return render(<ToastProvider>{node}</ToastProvider>);
}

const { convertOfferToInvoiceDraft, loadInvoicesForOffer } = vi.hoisted(() => ({
  convertOfferToInvoiceDraft: vi.fn(),
  loadInvoicesForOffer: vi.fn(),
}));

vi.mock('@/lib/ownerFinance/offersApi', () => ({ convertOfferToInvoiceDraft, loadInvoicesForOffer }));

function baseOffer(overrides: Partial<OwnerOffer> = {}): OwnerOffer {
  return {
    id: 'offer-1', business_entity_id: 'be-1', organization_id: null, client_account_id: null,
    engagement_id: null, offer_number: 'AN-2026-0100', status: 'accepted', title: 'Cogniiq Admin',
    issue_date: '2026-08-24', valid_until: '2026-09-23', currency: 'EUR', introduction: null,
    scope: null, assumptions: null, exclusions: null, payment_terms: null, delivery_terms: null,
    internal_notes: null, subtitle: null, executive_summary: null, project_approach: null,
    next_steps: null, desired_outcomes: [], timeline: [], payment_schedule: [],
    template_key: 'cogniiq-premium-offer-v2', recipient_source: 'manual', recipient_company: 'SV Heinersreuth',
    recipient_contact_name: null, recipient_department: null, recipient_street: 'Sportplatz 1',
    recipient_postal_code: '95500', recipient_city: 'Heinersreuth', recipient_country_code: 'DE',
    recipient_email: null, recipient_phone: null, recipient_vat_id: null, recipient_salutation: null,
    recipient_title: null, recipient_first_name: null, recipient_last_name: null, recipient_greeting_name: null,
    net_total_cents: 390000, vat_total_cents: 74100, gross_total_cents: 464100,
    recurring_monthly_net_cents: 29000, recurring_monthly_vat_cents: 5510, recurring_monthly_gross_cents: 34510,
    finalized_version: 1, accepted_at: '2026-08-24T10:00:00Z', rejected_at: null, rejection_reason: null,
    expired_at: null, converted_invoice_id: null, converted_at: null, owner_customer_id: null,
    archived_at: null, archived_by: null, created_at: '2026-08-24T09:00:00Z', updated_at: '2026-08-24T09:00:00Z',
    ...overrides,
  };
}

afterEach(() => { vi.clearAllMocks(); });

describe('payment-plan rate selection', () => {
  it('shows SVH Admin\'s two rates with the correct amounts', async () => {
    loadInvoicesForOffer.mockResolvedValue({ data: [], error: null });
    const offer = baseOffer({
      payment_schedule: [
        { label: 'Bei Auftragserteilung', percentage_bp: 5000 },
        { label: 'Nach Fertigstellung und Übergabe', percentage_bp: 5000 },
      ],
    });
    renderDialog(<ConvertOfferToInvoiceDialog open offer={offer} oneTimeNetCents={390000} onClose={() => {}} onDone={() => {}} />);

    await waitFor(() => expect(loadInvoicesForOffer).toHaveBeenCalledWith('offer-1'));

    const rate1 = screen.getByText(/Rate 1.*Bei Auftragserteilung/).closest('button')!;
    expect(within(rate1).getByText('1.950,00 € netto')).toBeTruthy();
    const rate2 = screen.getByText(/Rate 2.*Nach Fertigstellung/).closest('button')!;
    expect(within(rate2).getByText('1.950,00 € netto')).toBeTruthy();

    const full = screen.getByText('Gesamten Einmalbetrag').closest('button')!;
    expect(within(full).getByText('3.900,00 € netto')).toBeTruthy();
  });

  it('creates a draft for Rate 1 only, excluding the recurring amount, on confirm', async () => {
    loadInvoicesForOffer.mockResolvedValue({ data: [], error: null });
    convertOfferToInvoiceDraft.mockResolvedValue({
      invoiceId: 'inv-1', recurringLinesExcluded: 1, milestoneLabel: 'Bei Auftragserteilung (50.00 %)', isFullConversion: false, error: null,
    });
    const offer = baseOffer({ payment_schedule: [{ label: 'Bei Auftragserteilung', percentage_bp: 5000 }, { label: 'Nach Fertigstellung', percentage_bp: 5000 }] });
    const onDone = vi.fn();
    const user = userEvent.setup();
    renderDialog(<ConvertOfferToInvoiceDialog open offer={offer} oneTimeNetCents={390000} onClose={() => {}} onDone={onDone} />);
    await waitFor(() => expect(loadInvoicesForOffer).toHaveBeenCalled());

    await user.click(screen.getByText(/Rate 1.*Bei Auftragserteilung/));
    await user.click(screen.getByRole('button', { name: 'Rechnungsentwurf erstellen' }));

    await waitFor(() => expect(convertOfferToInvoiceDraft).toHaveBeenCalledWith('offer-1', 0));
    expect(onDone).toHaveBeenCalledWith('inv-1');
  });

  it('creates a draft for Rate 2 using its own index, independent of Rate 1', async () => {
    loadInvoicesForOffer.mockResolvedValue({ data: [], error: null });
    convertOfferToInvoiceDraft.mockResolvedValue({ invoiceId: 'inv-2', recurringLinesExcluded: 1, milestoneLabel: 'Rate 2', isFullConversion: false, error: null });
    const offer = baseOffer({ payment_schedule: [{ label: 'Bei Auftragserteilung', percentage_bp: 5000 }, { label: 'Nach Fertigstellung', percentage_bp: 5000 }] });
    const user = userEvent.setup();
    renderDialog(<ConvertOfferToInvoiceDialog open offer={offer} oneTimeNetCents={390000} onClose={() => {}} onDone={() => {}} />);
    await waitFor(() => expect(loadInvoicesForOffer).toHaveBeenCalled());

    await user.click(screen.getByText(/Rate 2.*Nach Fertigstellung/));
    await user.click(screen.getByRole('button', { name: 'Rechnungsentwurf erstellen' }));

    await waitFor(() => expect(convertOfferToInvoiceDraft).toHaveBeenCalledWith('offer-1', 1));
  });

  it('never sends a milestone index for the full-amount option', async () => {
    loadInvoicesForOffer.mockResolvedValue({ data: [], error: null });
    convertOfferToInvoiceDraft.mockResolvedValue({ invoiceId: 'inv-3', recurringLinesExcluded: 0, milestoneLabel: null, isFullConversion: true, error: null });
    const offer = baseOffer({ payment_schedule: [] });
    const user = userEvent.setup();
    renderDialog(<ConvertOfferToInvoiceDialog open offer={offer} oneTimeNetCents={390000} onClose={() => {}} onDone={() => {}} />);
    await waitFor(() => expect(loadInvoicesForOffer).toHaveBeenCalled());

    await user.click(screen.getByText('Gesamten Einmalbetrag'));
    await user.click(screen.getByRole('button', { name: 'Rechnungsentwurf erstellen' }));

    await waitFor(() => expect(convertOfferToInvoiceDraft).toHaveBeenCalledWith('offer-1', undefined));
  });

  it('mentions recurring positions are excluded, never lets a rate be confused with the monthly fee', async () => {
    loadInvoicesForOffer.mockResolvedValue({ data: [], error: null });
    const offer = baseOffer({ payment_schedule: [{ label: 'Bei Auftragserteilung', percentage_bp: 10000 }] });
    renderDialog(<ConvertOfferToInvoiceDialog open offer={offer} oneTimeNetCents={390000} onClose={() => {}} onDone={() => {}} />);
    await waitFor(() => expect(loadInvoicesForOffer).toHaveBeenCalled());
    expect(screen.getByText(/Wiederkehrende Positionen sind nie enthalten/)).toBeTruthy();
    expect(screen.queryByText(/290/)).toBeNull();
  });
});

describe('recurring-only offer', () => {
  it('shows the graceful stop message and makes no network call', async () => {
    const offer = baseOffer({ payment_schedule: [] });
    renderDialog(<ConvertOfferToInvoiceDialog open offer={offer} oneTimeNetCents={0} onClose={() => {}} onDone={() => {}} />);

    expect(screen.getByText(/Dieses Angebot enthält keine einmalige, aktuell abrechenbare Position/)).toBeTruthy();
    expect(screen.getByText(/Wiederkehrende Positionen werden separat abgerechnet/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Rechnungsentwurf erstellen' })).toBeNull();
    expect(convertOfferToInvoiceDraft).not.toHaveBeenCalled();
    // No existing-invoice lookup either — the dialog stops before doing anything.
    expect(loadInvoicesForOffer).not.toHaveBeenCalled();
  });
});

describe('duplicate-instalment warning', () => {
  it('lists invoices already created from this offer before the owner picks a rate', async () => {
    loadInvoicesForOffer.mockResolvedValue({
      data: [{ id: 'inv-0', invoice_number: 'RE-2026-0007', status: 'draft', currency: 'EUR', net_total_cents: 195000, gross_total_cents: 232050, created_at: '2026-08-20T10:00:00Z' }],
      error: null,
    });
    const offer = baseOffer({ payment_schedule: [{ label: 'Bei Auftragserteilung', percentage_bp: 5000 }, { label: 'Nach Fertigstellung', percentage_bp: 5000 }] });
    renderDialog(<ConvertOfferToInvoiceDialog open offer={offer} oneTimeNetCents={390000} onClose={() => {}} onDone={() => {}} />);

    await waitFor(() => expect(screen.getByText('RE-2026-0007')).toBeTruthy());
    expect(screen.getByText(/bereits erstellte Rechnungen/i)).toBeTruthy();
    expect(screen.getByText('1.950,00 €')).toBeTruthy();
  });

  it('shows nothing extra when the offer has no prior invoices', async () => {
    loadInvoicesForOffer.mockResolvedValue({ data: [], error: null });
    const offer = baseOffer({ payment_schedule: [] });
    renderDialog(<ConvertOfferToInvoiceDialog open offer={offer} oneTimeNetCents={390000} onClose={() => {}} onDone={() => {}} />);
    await waitFor(() => expect(loadInvoicesForOffer).toHaveBeenCalled());
    expect(screen.queryByText(/bereits erstellte Rechnungen/i)).toBeNull();
  });
});
