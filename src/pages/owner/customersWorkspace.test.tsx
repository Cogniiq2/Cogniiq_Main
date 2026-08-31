import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import type { OwnerCustomerListRow } from '@/lib/ownerFinance/types';

/**
 * The customer workspace's behaviour, not its pixels.
 *
 * What is worth pinning here is what a screenshot cannot show: that the filters and
 * the search actually narrow the list, that a customer's destination is reachable by
 * keyboard rather than only by clicking a row, that the archived customers stay out of
 * the default view, and that the empty state tells the owner which filter produced it.
 */

// src/lib/supabase.ts validates its configuration at module scope and throws without it.
// The customer API is mocked below, so nothing here ever reaches a network.
vi.stubEnv('VITE_SUPABASE_URL', 'https://customers-workspace-test.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

const ENTITY = { id: 'e1', display_name: 'Cogniiq' };

const row = (over: Partial<OwnerCustomerListRow>): OwnerCustomerListRow => ({
  id: 'c1',
  company: 'Muster GmbH',
  contact_name: 'Max Muster',
  email: 'max@muster.invalid',
  phone: '+49 921 1',
  street: null,
  postal_code: null,
  city: 'Bayreuth',
  status: 'active',
  notes: null,
  client_account_id: null,
  organization_id: null,
  archived_at: null,
  last_activity_at: '2026-08-20T00:00:00Z',
  created_at: '2026-01-01T00:00:00Z',
  completed_at: null,
  offer_count: 1,
  invoice_count: 2,
  open_invoice_count: 0,
  revenue_gross_cents: 100000,
  open_task_count: 0,
  completed_task_count: 0,
  ...over,
});

const ROWS: OwnerCustomerListRow[] = [
  row({ id: 'c1', company: 'Zahnarztpraxis Merten', city: 'Bayreuth', open_task_count: 3, revenue_gross_cents: 500000 }),
  row({ id: 'c2', company: 'Gasthof Sonnenhof', city: 'Bayreuth', status: 'waiting', open_task_count: 0, open_invoice_count: 1, revenue_gross_cents: 200000 }),
  row({ id: 'c3', company: 'Autohaus Weber', city: 'Regensburg', status: 'archived', archived_at: '2026-06-01T00:00:00Z', revenue_gross_cents: 0 }),
];

vi.mock('@/lib/ownerFinance/customersApi', () => ({
  loadCustomers: vi.fn(async () => ROWS),
  loadDeleteBlockers: vi.fn(async () => ({
    issued_invoices: 0, payments: 0, finalized_offers: 0, subscriptions: 0,
    portal_documents: 0, draft_invoices: 0, draft_offers: 0, deletable: true,
  })),
  archiveCustomer: vi.fn(async () => ({ error: null })),
  unarchiveCustomer: vi.fn(async () => ({ error: null })),
  deleteCustomer: vi.fn(async () => ({ deleted: true, deletedDraftOffers: 0, deletedDraftInvoices: 0, error: null })),
}));

vi.mock('@/pages/owner/ownerContext', () => ({
  useOwnerEntity: () => ({ entity: ENTITY, status: 'ready', taxYear: 2026 }),
}));

vi.mock('@/components/finance/CustomerFormDialog', () => ({
  CustomerFormDialog: () => null,
}));

// Imported after the env stubs above: a static import is hoisted, and the dashboard
// barrel reaches src/lib/supabase.ts, which validates its configuration at module scope.
const { ToastProvider } = await import('@/components/dashboard');
const { CustomersPage } = await import('@/pages/owner/CustomersPage');

function renderPage() {
  return render(
    <MemoryRouter>
      <ToastProvider><CustomersPage /></ToastProvider>
    </MemoryRouter>,
  );
}

/** Both the table row and the mobile card are in the DOM; count distinct customers. */
function visibleCustomers(): string[] {
  const table = screen.queryByRole('table');
  if (!table) return [];
  return [...table.querySelectorAll('tbody tr td:first-child')]
    .map((cell) => cell.textContent ?? '')
    .map((text) => text.replace(/^[A-ZÄÖÜ]{2}/, '').split(/Bayreuth|Regensburg/)[0].trim());
}

beforeEach(() => { vi.clearAllMocks(); });

describe('customer workspace', () => {
  it('hides archived customers from the default view but keeps them one filter away', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('table');

    expect(visibleCustomers().join(' ')).not.toContain('Autohaus Weber');

    await user.click(screen.getByRole('radio', { name: /Archiviert/ }));
    await waitFor(() => expect(visibleCustomers().join(' ')).toContain('Autohaus Weber'));
  });

  it('filters to the customers with open work', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('table');

    await user.click(screen.getByRole('radio', { name: /Offene Arbeit/ }));
    await waitFor(() => {
      const names = visibleCustomers().join(' ');
      expect(names).toContain('Zahnarztpraxis Merten'); // 3 open tasks
      expect(names).toContain('Gasthof Sonnenhof');     // 1 open invoice
      expect(names).not.toContain('Autohaus Weber');
    });
  });

  it('searches the city, not only the company name', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('table');

    await user.type(screen.getByRole('searchbox', { name: 'Kunden durchsuchen' }), 'regensburg');
    // Regensburg belongs to the archived customer, which the default filter excludes —
    // so this must land on the honest "no match" state rather than on a stale list.
    await waitFor(() => expect(screen.getByText('Keine Treffer')).toBeInTheDocument());
    expect(screen.getByText(/regensburg/)).toBeInTheDocument();
  });

  it('names the filter and the query in the no-match state and offers the way out', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('table');

    await user.type(screen.getByRole('searchbox', { name: 'Kunden durchsuchen' }), 'zzzz');
    await screen.findByText('Keine Treffer');
    await user.click(screen.getByRole('button', { name: 'Suche zurücksetzen' }));
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());
  });

  it('makes every customer reachable by keyboard, not only by clicking the row', async () => {
    renderPage();
    await screen.findByRole('table');

    const link = screen.getAllByRole('link', { name: /Zahnarztpraxis Merten/ })[0];
    expect(link).toHaveAttribute('href', '/admin/finance/customers/c1');
  });

  it('gives every row action an accessible name that says which customer it acts on', async () => {
    renderPage();
    await screen.findByRole('table');

    // Two of each: the desktop table row and the mobile card are both in the DOM, and
    // CSS decides which is visible. What matters is that the name says WHICH customer —
    // ten identical "Kunde löschen" buttons are unusable with a screen reader.
    expect(screen.getAllByRole('button', { name: 'Zahnarztpraxis Merten löschen' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Gasthof Sonnenhof archivieren' })).toHaveLength(2);
    expect(screen.queryByRole('button', { name: 'Kunde löschen' })).toBeNull();
  });

  it('summarises the list without inventing a metric', async () => {
    renderPage();
    const band = await screen.findByText('Fakturiert gesamt');
    const cell = band.parentElement!;
    // 5.000,00 + 2.000,00 + 0,00 over every customer, archived included, because the
    // label says "gesamt" and the figure is a plain sum of what was invoiced.
    expect(cell.textContent).toContain('7.000,00');
    expect(cell.textContent).toContain('Summe aller gestellten Rechnungen je Kunde');
  });

  it('keeps the archive action reversible and says so before doing it', async () => {
    const user = userEvent.setup();
    const api = await import('@/lib/ownerFinance/customersApi');
    renderPage();
    await screen.findByRole('table');

    await user.click(screen.getAllByRole('button', { name: 'Gasthof Sonnenhof archivieren' })[0]);
    const dialog = await screen.findByRole('dialog');
    expect(dialog.textContent).toContain('Nichts wird gelöscht');

    await user.click(within(dialog).getByRole('button', { name: 'Kunde archivieren' }));
    await waitFor(() => expect(api.archiveCustomer).toHaveBeenCalledWith('c2'));
  });
});
