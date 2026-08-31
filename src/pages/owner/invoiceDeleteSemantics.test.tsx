import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import type { OwnerInvoice } from '@/lib/ownerFinance/types';

/**
 * What the generic "Löschen" is allowed to do to an invoice, and what it is allowed to SAY.
 *
 * The rule this pins is an accounting rule, not a wording preference: a fully paid invoice is
 * only ever removed from the workspace. It is never run through Storno from a cleanup action,
 * because the money arrived, the payment rows are facts, and turning `paid` into `cancelled`
 * behind a tidy-up would silently change what the books say. The server enforces it
 * (owner_workspace_delete_preflight_one, proven in workspace-organization-tests.sql); these
 * tests pin the half a database cannot: that the confirmation the owner reads matches it, and
 * that a settled invoice is never described as being cancelled.
 *
 * The counterpart matters just as much — an issued, unsettled invoice must STILL offer the
 * sanctioned Storno, and must still say so — so a fix for the first case cannot quietly turn
 * into "never Storno anything".
 */

vi.stubEnv('VITE_SUPABASE_URL', 'https://invoice-delete-test.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

const ENTITY = { id: 'e1', display_name: 'Cogniiq' };

const invoice = (over: Partial<OwnerInvoice>): OwnerInvoice => ({
  id: 'i1',
  business_entity_id: 'e1',
  organization_id: null,
  client_account_id: null,
  owner_customer_id: null,
  engagement_id: null,
  invoice_number: 'RE-2026-0001',
  status: 'issued',
  issue_date: '2026-03-01',
  service_date: '2026-03-01',
  due_date: '2026-03-15',
  currency: 'EUR',
  net_total_cents: 100000,
  vat_total_cents: 19000,
  gross_total_cents: 119000,
  amount_paid_cents: 0,
  notes: null,
  external_reference: null,
  issued_at: '2026-03-01T00:00:00Z',
  archived_at: null,
  cancelled_at: null,
  cancelled_by: null,
  cancellation_reason: null,
  created_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z',
  ...over,
});

const PAID = invoice({
  id: 'paid-1', invoice_number: 'RE-2026-0100', status: 'paid', amount_paid_cents: 119000,
});
const ISSUED = invoice({ id: 'issued-1', invoice_number: 'RE-2026-0101', status: 'issued' });

const INVOICES = [PAID, ISSUED];

/**
 * The RPC double mirrors the migration exactly: `paid` resolves to trash_only, an issued and
 * unsettled invoice to cancel_and_trash. The page is never allowed to decide either.
 */
const cancelInvoiceCalls: string[] = [];
const rpcImpl = async (fn: string, args: Record<string, unknown>) => {
  switch (fn) {
    case 'owner_workspace_state':
      return { data: { folders: [], items: [] }, error: null };
    case 'owner_workspace_delete_preflight':
      return {
        data: (args.p_resource_ids as string[]).map((id) => (id === PAID.id
          ? { resource_id: id, action: 'trash_only', reasons: ['fully_paid_invoice', 'invoice_number_retained'], dependencies: {} }
          : { resource_id: id, action: 'cancel_and_trash', reasons: ['issued_invoice_requires_storno', 'invoice_number_retained'], dependencies: {} })),
        error: null,
      };
    case 'owner_workspace_delete_items':
      return {
        data: (args.p_resource_ids as string[]).map((id) => {
          if (id !== PAID.id) cancelInvoiceCalls.push(id);
          return id === PAID.id
            ? { resource_id: id, action: 'trash_only', outcome: 'trashed', reasons: [], error: null }
            : { resource_id: id, action: 'cancel_and_trash', outcome: 'cancelled_and_trashed', reasons: [], error: null };
        }),
        error: null,
      };
    default:
      return { data: null, error: null };
  }
};
const rpc = vi.fn(rpcImpl);

vi.mock('@/lib/supabase', () => ({ supabase: { rpc, from: () => { throw new Error('no direct table access'); } } }));

vi.mock('@/lib/ownerFinance/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/ownerFinance/api')>('@/lib/ownerFinance/api');
  return { ...actual, loadInvoices: vi.fn(async () => INVOICES) };
});
vi.mock('@/lib/ownerFinance/customersApi', async () => {
  const actual = await vi.importActual<typeof import('@/lib/ownerFinance/customersApi')>('@/lib/ownerFinance/customersApi');
  return { ...actual, loadCustomers: vi.fn(async () => []) };
});
vi.mock('@/pages/owner/ownerContext', () => ({
  useOwnerEntity: () => ({ entity: ENTITY, status: 'ready', taxYear: 2026 }),
}));

const { ToastProvider } = await import('@/components/dashboard');
const { InvoicesPage } = await import('@/pages/owner/InvoicesPage');

// `?folder=all` rather than the bare route: the page is folder-first now, so the plain URL
// shows the folder overview. These tests are about the delete semantics of a ROW, so they
// enter the all-records view the same way the owner would.
function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/finance/invoices?folder=all']}>
      <ToastProvider>
        <InvoicesPage />
      </ToastProvider>
    </MemoryRouter>,
  );
}

// `restoreMocks: true` strips a vi.fn's implementation between tests.
beforeEach(() => {
  rpc.mockClear();
  rpc.mockImplementation(rpcImpl);
  cancelInvoiceCalls.length = 0;
});

/** Opens the row menu for one invoice and picks "Löschen". */
async function openDeleteFor(user: ReturnType<typeof userEvent.setup>, number: string) {
  // The row is rendered twice — the desktop table and the mobile card list — so the
  // first trigger is taken rather than asserting a single match.
  const [menu] = await screen.findAllByRole('button', { name: `Rechnung ${number} organisieren` });
  await user.click(menu);
  await user.click(await screen.findByRole('menuitem', { name: 'Löschen' }));
  return screen.findByRole('dialog');
}

describe('a fully paid invoice', () => {
  it('is offered as a move to the Papierkorb, and never described as a Storno', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText(/RE-2026-0100/);

    const dialog = await openDeleteFor(user, 'RE-2026-0100');

    // The title is the workspace-removal one, NOT "Rechnung entfernen?".
    expect(within(dialog).getByRole('heading')).toHaveTextContent('Aus Arbeitsbereich entfernen?');
    // The body states the truth: hidden from the list, unchanged in the books, restorable.
    expect(within(dialog).getByText(/aus der normalen Liste ausgeblendet/)).toBeInTheDocument();
    expect(within(dialog).getByText(/bleibt in Buchhaltung und Historie unverändert erhalten/)).toBeInTheDocument();
    expect(within(dialog).getByText(/aus dem Papierkorb wiederhergestellt/)).toBeInTheDocument();
    // The confirm button promises the Papierkorb, not a deletion and not a cancellation.
    expect(within(dialog).getByRole('button', { name: 'In Papierkorb verschieben' })).toBeInTheDocument();

    // The one thing this dialog must never contain.
    expect(dialog.textContent).not.toMatch(/storn/i);
    expect(dialog.textContent).not.toMatch(/endgültig/i);
  });

  it('reports a move to the Papierkorb afterwards, and never runs a cancellation', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText(/RE-2026-0100/);

    const dialog = await openDeleteFor(user, 'RE-2026-0100');
    await user.click(within(dialog).getByRole('button', { name: 'In Papierkorb verschieben' }));

    await waitFor(() => expect(screen.getByText('In Papierkorb verschoben')).toBeInTheDocument());
    // No message claims a Storno or a deletion. (The page's own subtitle legitimately
    // contains the word, so this asserts over the toast rather than the whole document.)
    expect(screen.queryByText('Rechnung storniert und entfernt')).not.toBeInTheDocument();
    expect(screen.queryByText(/endgültig gelöscht/i)).not.toBeInTheDocument();
    // And, decisively: no cancellation was performed for it at all.
    expect(cancelInvoiceCalls).toEqual([]);
  });
});

describe('an issued, unsettled invoice', () => {
  it('still offers the sanctioned Storno and still says the number is kept', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText(/RE-2026-0101/);

    const dialog = await openDeleteFor(user, 'RE-2026-0101');

    expect(within(dialog).getByRole('heading')).toHaveTextContent('Rechnung entfernen?');
    expect(within(dialog).getByText(/Rechnungsnummer und der gesetzlich erforderliche Nachweis bleiben erhalten/))
      .toBeInTheDocument();
    expect(within(dialog).getByText(/Storno-Funktion verwendet/)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Stornieren und entfernen' })).toBeInTheDocument();
  });

  it('reports the Storno truthfully once it has run', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText(/RE-2026-0101/);

    const dialog = await openDeleteFor(user, 'RE-2026-0101');
    await user.click(within(dialog).getByRole('button', { name: 'Stornieren und entfernen' }));

    await waitFor(() => expect(screen.getByText('Rechnung storniert und entfernt')).toBeInTheDocument());
    expect(cancelInvoiceCalls).toEqual([ISSUED.id]);
  });
});
