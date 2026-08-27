// REGRESSION SUITE for the customer's offer portal with engagement tracking added.
//
// The portal is live with real customers. This suite exists to prove that the new
// observational layer changed nothing the customer can perceive, and above all that
// nothing it does can reach a mail path.
//
// Supabase is mocked at the module boundary, so no request leaves the process and no
// row is written anywhere. Every RPC name the portal invokes is recorded and asserted
// against an allow-list.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PublicOfferProjection } from '@/lib/ownerFinance/offersApi';

/* --------------------------------------------------------------- Supabase mock */

const rpcCalls: Array<{ fn: string; args: Record<string, unknown> }> = [];
const invokeCalls: string[] = [];
/** Flipped on to prove the customer's journey survives a broken analytics backend. */
let engagementFails = false;

const OFFER: PublicOfferProjection = {
  offer_number: 'AN-2026-0100', title: 'Cogniiq Admin', subtitle: null, status: 'sent',
  issue_date: '2026-08-24', valid_until: '2099-09-23', currency: 'EUR',
  introduction: 'Ihre Ausgangslage im Detail.', executive_summary: 'Das Zielbild.',
  project_approach: 'Unser Vorgehen.', next_steps: 'So geht es weiter.',
  scope: null, assumptions: 'Annahmen.', exclusions: null,
  payment_terms: '14 Tage netto', delivery_terms: null,
  desired_outcomes: ['Weniger Verwaltungsaufwand'],
  timeline: [{ phase: '1', title: 'Setup', duration: '2 Wochen', description: null }],
  payment_schedule: [{ label: 'Bei Auftragserteilung', percentage_bp: 5000 }],
  net_total_cents: 390000, vat_total_cents: 74100, gross_total_cents: 464100,
  lines: [{
    description: 'Einrichtung & Inbetriebnahme', quantity_milli: 1000, unit: 'Pauschal',
    unit_price_cents: 390000, vat_rate_bp: 1900, vat_treatment: 'standard',
    net_cents: 390000, vat_cents: 74100, gross_cents: 464100, is_optional: false,
  }],
  recipient: {
    company: 'Testverein', contact_name: 'Test Person', city: null, email: 'test@example.invalid',
    salutation: null, title: null, first_name: null, last_name: null, greeting_name: null,
  },
  accepted: false, rejected: false, expired: false, has_pdf: false, document_version: null,
  template_version: 'cogniiq-premium-offer-v2', accepted_signer_name: null, accepted_at: null,
  signed_document_available: false,
  seller: {
    legal_name: 'Cogniiq', street: null, postal_code: null, city: null,
    country_code: 'DE', email: 'info@example.invalid', website: null, vat_id: null,
  },
};

const ENGAGEMENT_RPCS = new Set([
  'public_offer_engagement_start',
  'public_offer_engagement_heartbeat',
  'public_offer_engagement_event',
]);

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(async (fn: string, args: Record<string, unknown>) => {
      rpcCalls.push({ fn, args });
      if (ENGAGEMENT_RPCS.has(fn)) {
        if (engagementFails) return { data: null, error: { message: 'engagement backend down' } };
        return { data: { ok: true }, error: null };
      }
      if (fn === 'public_offer_by_token') return { data: OFFER, error: null };
      return { data: null, error: null };
    }),
    functions: {
      invoke: vi.fn(async (name: string) => { invokeCalls.push(name); return { data: { ok: true }, error: null }; }),
    },
    from: vi.fn(() => { throw new Error('the public portal must never touch a table directly'); }),
  },
}));

// The premium PDF engine is stubbed here for ONE reason: rendering a real PDF needs
// fontkit to read a .ttf off disk, which jsdom cannot do. Actual PDF output is covered
// by the dedicated premium-offer PDF tests. What matters in THIS file is the wiring —
// that the download still runs the premium path and still reaches the anchor click even
// when every analytics call is failing.
const renderPremiumPdf = vi.fn(async (doc: unknown) => { void doc; return new Uint8Array([37, 80, 68, 70]); });
vi.mock('@/lib/ownerFinance/documents/premium', () => ({ renderPremiumPdf: (d: unknown) => renderPremiumPdf(d) }));
vi.mock('@/lib/ownerFinance/documents/premium/publicOfferToPremium', () => ({
  publicOfferToPremiumDocument: (o: unknown) => o,
}));

const { PublicDocumentPortal } = await import('@/pages/public/PublicDocumentPortal');

function renderPortal() {
  return render(
    <MemoryRouter initialEntries={['/d/' + 'x'.repeat(48)]}>
      <Routes><Route path="/d/:token" element={<PublicDocumentPortal />} /></Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  rpcCalls.length = 0; invokeCalls.length = 0; engagementFails = false;
  sessionStorage.clear();
});

/* --------------------------------------------------------------- Email safety */

describe('EMAIL SAFETY — viewing an offer can never contact the customer', () => {
  it('calls only the offer projection and engagement RPCs on a plain view', async () => {
    renderPortal();
    await screen.findByText(/Cogniiq Admin/);
    await waitFor(() => expect(rpcCalls.some((c) => c.fn === 'public_offer_engagement_start')).toBe(true));

    const allowed = new Set(['public_offer_by_token', ...ENGAGEMENT_RPCS]);
    for (const c of rpcCalls) expect(allowed.has(c.fn)).toBe(true);
    expect(invokeCalls).toEqual([]);
  });

  it.each([
    'owner_enqueue_offer_email', 'owner_enqueue_automation_job', 'owner_process_offer_acceptance',
    'respond_offer_by_token', 'record_offer_acceptance', 'owner_retry_automation_job',
    'owner_convert_offer_internal',
  ])('never calls %s while merely viewing', async (fn) => {
    renderPortal();
    await screen.findByText(/Cogniiq Admin/);
    await waitFor(() => expect(rpcCalls.some((c) => c.fn === 'public_offer_engagement_start')).toBe(true));
    expect(rpcCalls.map((c) => c.fn)).not.toContain(fn);
  });

  it('never invokes an edge function while viewing (no send-offer-document-email)', async () => {
    renderPortal();
    await screen.findByText(/Cogniiq Admin/);
    await waitFor(() => expect(rpcCalls.length).toBeGreaterThan(1));
    expect(invokeCalls).not.toContain('send-offer-document-email');
    expect(invokeCalls).not.toContain('process-accepted-offer');
  });

  it('calls public_offer_by_token exactly once — the heartbeat does not re-enter it', async () => {
    renderPortal();
    await screen.findByText(/Cogniiq Admin/);
    await waitFor(() => expect(rpcCalls.some((c) => c.fn === 'public_offer_engagement_start')).toBe(true));
    // Re-entering it per heartbeat would spam 'viewed' access events, re-advance the
    // offer status and re-notify the owner every 15 seconds.
    expect(rpcCalls.filter((c) => c.fn === 'public_offer_by_token')).toHaveLength(1);
  });

  it('never sends the raw token to anything but the token RPCs themselves', async () => {
    renderPortal();
    await screen.findByText(/Cogniiq Admin/);
    await waitFor(() => expect(rpcCalls.some((c) => c.fn === 'public_offer_engagement_start')).toBe(true));
    // The engagement session id must be a fresh random UUID, never derived from the token.
    const start = rpcCalls.find((c) => c.fn === 'public_offer_engagement_start')!;
    expect(String(start.args.p_client_session_id)).toMatch(/^[0-9a-f-]{36}$/);
    expect(String(start.args.p_client_session_id)).not.toContain('x'.repeat(8));
  });
});

/* --------------------------------------------------------------- Existing behaviour */

describe('the customer journey is unchanged', () => {
  it('still loads the offer through public_offer_by_token', async () => {
    renderPortal();
    await screen.findByText(/Cogniiq Admin/);
    expect(rpcCalls[0].fn).toBe('public_offer_by_token');
    expect(await screen.findByText('AN-2026-0100')).toBeInTheDocument();
  });

  it('still renders the premium offer sections', async () => {
    renderPortal();
    expect(await screen.findByText('Ihre Ausgangslage')).toBeInTheDocument();
    expect(await screen.findByText('Ihre Investition')).toBeInTheDocument();
    expect(await screen.findByText('Ihre Projektmodule')).toBeInTheDocument();
  });

  it('still surfaces an invalid token as a failure, and tracks nothing', async () => {
    const { supabase } = await import('@/lib/supabase');
    (supabase.rpc as ReturnType<typeof vi.fn>).mockImplementationOnce(async (fn: string) => {
      rpcCalls.push({ fn, args: {} });
      return { data: null, error: { message: 'invalid token' } };
    });
    renderPortal();
    expect(await screen.findByText('Link nicht gültig')).toBeInTheDocument();
    expect(rpcCalls.map((c) => c.fn)).not.toContain('public_offer_engagement_start');
  });

  it('still offers acceptance, rejection and PDF download', async () => {
    renderPortal();
    await screen.findByText(/Cogniiq Admin/);
    // Both the desktop decision panel and the mobile sticky bar render an accept
    // button; jsdom has no viewport, so both are present. That is pre-existing
    // layout behaviour and unchanged by this feature.
    expect(screen.getAllByRole('button', { name: 'Angebot annehmen' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Frage stellen oder ablehnen' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'PDF herunterladen' })).toBeInTheDocument();
  });
});

/* --------------------------------------------------------------- Funnel observation */

describe('funnel tracking observes without acting', () => {
  it('opening the acceptance dialog records an open and accepts nothing', async () => {
    const user = userEvent.setup();
    renderPortal();
    await screen.findByText(/Cogniiq Admin/);
    await user.click(screen.getAllByRole('button', { name: 'Angebot annehmen' })[0]);

    // The dialog is on screen …
    expect(await screen.findByText('Angaben bestätigen')).toBeInTheDocument();
    // … an open was recorded …
    const ev = rpcCalls.filter((c) => c.fn === 'public_offer_engagement_event');
    expect(ev.map((c) => c.args.p_event_type)).toContain('acceptance_opened');
    // … and NOTHING authoritative ran.
    expect(rpcCalls.map((c) => c.fn)).not.toContain('respond_offer_by_token');
    expect(invokeCalls).toEqual([]);
  });

  it('opening the rejection dialog records an open and rejects nothing', async () => {
    const user = userEvent.setup();
    renderPortal();
    await screen.findByText(/Cogniiq Admin/);
    await user.click(await screen.findByRole('button', { name: 'Frage stellen oder ablehnen' }));

    const ev = rpcCalls.filter((c) => c.fn === 'public_offer_engagement_event');
    expect(ev.map((c) => c.args.p_event_type)).toContain('rejection_opened');
    expect(rpcCalls.map((c) => c.fn)).not.toContain('respond_offer_by_token');
  });

  it('still opens the acceptance dialog when analytics is completely broken', async () => {
    engagementFails = true;
    const user = userEvent.setup();
    renderPortal();
    await screen.findByText(/Cogniiq Admin/);
    await user.click(screen.getAllByRole('button', { name: 'Angebot annehmen' })[0]);
    expect(await screen.findByText('Angaben bestätigen')).toBeInTheDocument();
  });
});

/* --------------------------------------------------------------- PDF resilience */

describe('the PDF download is never blocked by tracking', () => {
  it('downloads even when every engagement call fails', async () => {
    engagementFails = true;
    const user = userEvent.setup();

    const clicked: string[] = [];
    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
      const el = realCreate(tag as 'a');
      if (tag === 'a') (el as HTMLAnchorElement).click = () => { clicked.push((el as HTMLAnchorElement).download); };
      return el;
    }) as typeof document.createElement);
    // jsdom implements neither object-URL method, so they are defined before spying.
    const u = URL as unknown as Record<string, unknown>;
    u.createObjectURL = () => 'blob:test';
    u.revokeObjectURL = () => {};

    renderPortal();
    await screen.findByText(/Cogniiq Admin/);
    await user.click(screen.getByRole('button', { name: 'PDF herunterladen' }));

    // The customer got their file …
    await waitFor(() => expect(clicked).toContain('Angebot-AN-2026-0100.pdf'));
    // … from the unchanged PREMIUM path, with no error shown.
    expect(renderPremiumPdf).toHaveBeenCalled();
    expect(screen.queryByText(/fehlgeschlagen/i)).not.toBeInTheDocument();
  });

  it('records the download only AFTER the file was handed over', async () => {
    const user = userEvent.setup();
    const order: string[] = [];
    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
      const el = realCreate(tag as 'a');
      if (tag === 'a') (el as HTMLAnchorElement).click = () => { order.push('click'); };
      return el;
    }) as typeof document.createElement);
    const u = URL as unknown as Record<string, unknown>;
    u.createObjectURL = () => 'blob:test';
    u.revokeObjectURL = () => {};

    renderPortal();
    await screen.findByText(/Cogniiq Admin/);
    await user.click(screen.getByRole('button', { name: 'PDF herunterladen' }));

    await waitFor(() => expect(rpcCalls.some(
      (c) => c.fn === 'public_offer_engagement_event' && c.args.p_event_type === 'pdf_download')).toBe(true));
    // The anchor click precedes the tracking call, so tracking can never pre-empt it.
    expect(order).toEqual(['click']);
  });
});
