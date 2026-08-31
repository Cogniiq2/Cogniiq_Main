import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';

/**
 * ⌘K's create actions, proven against the real destination.
 *
 * A command that only navigates to a list is not an action — the owner still has to
 * find the button. What is asserted here is deliberately not the command's href: each
 * test mounts the actual page the command points at, at the URL the command produces,
 * and requires that page's own create UI to be on screen. If a destination stopped
 * consuming the intent, or its dialog moved, these fail.
 *
 * The three negative cases matter just as much: the plain list URL must open nothing.
 */

vi.stubEnv('VITE_SUPABASE_URL', 'https://create-intent-test.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

const ENTITY = { id: 'e1', display_name: 'Cogniiq' };

vi.mock('@/pages/owner/ownerContext', () => ({
  useOwnerEntity: () => ({ entity: ENTITY, status: 'ready', taxYear: 2026 }),
}));

vi.mock('@/lib/ownerFinance/customersApi', () => ({
  loadCustomers: vi.fn(async () => []),
  loadDeleteBlockers: vi.fn(async () => ({ deletable: true })),
  archiveCustomer: vi.fn(), unarchiveCustomer: vi.fn(), deleteCustomer: vi.fn(),
  cancelInvoice: vi.fn(), createCustomer: vi.fn(), updateCustomer: vi.fn(),
}));

vi.mock('@/lib/ownerFinance/api', () => ({
  loadInvoices: vi.fn(async () => []),
  loadExpenses: vi.fn(async () => []),
  loadCategories: vi.fn(async () => []),
  loadVendors: vi.fn(async () => []),
  createOwnerInvoice: vi.fn(), deleteDraftInvoice: vi.fn(), issueOwnerInvoice: vi.fn(),
  recordHistoricalPaidInvoice: vi.fn(), recordInvoicePayment: vi.fn(),
  createOwnerExpense: vi.fn(), deleteDraftExpense: vi.fn(), markExpenseReviewed: vi.fn(),
  recordExpensePayment: vi.fn(),
  OWNER_HISTORICAL_INVOICE_MIGRATION: 'test_migration',
}));

vi.mock('@/lib/clientPlatform/adminApi', () => ({ loadAdminClients: vi.fn(async () => []) }));

const { ToastProvider } = await import('@/components/dashboard');
const { CustomersPage } = await import('@/pages/owner/CustomersPage');
const { InvoicesPage } = await import('@/pages/owner/InvoicesPage');
const { ExpensesPage } = await import('@/pages/owner/ExpensesPage');
const { buildCommandItems } = await import('@/pages/admin/commandItems');

function renderAt(url: string, node: React.ReactNode) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <ToastProvider>{node}</ToastProvider>
    </MemoryRouter>,
  );
}

/** The href the palette would actually navigate to for a given action id. */
function commandHref(id: string): string {
  const item = buildCommandItems({ isOwner: true }).find((i) => i.id === id);
  if (!item?.to) throw new Error(`no command ${id}`);
  return item.to;
}

describe('⌘K create actions open the real create UI', () => {
  it('opens the customer form on the customers workspace', async () => {
    renderAt(commandHref('act-customer'), <CustomersPage />);
    // The page's own CustomerFormDialog, not a stand-in: its heading and its save button.
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Neuer Kunde');
    expect(await screen.findByLabelText(/Firma/)).toBeInTheDocument();
  });

  it('opens the invoice composer on the invoice workspace', async () => {
    renderAt(commandHref('act-invoice'), <InvoicesPage />);
    const dialog = await screen.findByRole('dialog');
    // The page's own InvoiceComposer, by its heading and its server-numbering note.
    expect(dialog).toHaveTextContent('Rechnung erstellen');
    expect(dialog).toHaveTextContent('Serverseitige Berechnung und Nummernvergabe');
  });

  it('opens the expense composer on the expense workspace', async () => {
    renderAt(commandHref('act-expense'), <ExpensesPage />);
    const dialog = await screen.findByRole('dialog');
    // The page's own ExpenseComposer.
    expect(dialog).toHaveTextContent('Ausgabe erfassen');
    expect(dialog).toHaveTextContent('Steuerliche Wirkung wird vor dem Speichern angezeigt');
  });
});

describe('the plain list URL opens nothing', () => {
  it.each([
    ['/admin/finance/customers', () => <CustomersPage />],
    ['/admin/finance/invoices', () => <InvoicesPage />],
    ['/admin/finance/expenses', () => <ExpensesPage />],
  ])('%s renders a list, not a dialog', async (url, node) => {
    renderAt(url, node());
    await screen.findByRole('heading', { level: 1 });
    // Give the intent effect the same chance to run it gets in the positive cases.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('the intent is consumed, not left in the URL', () => {
  it('removes ?create=1 so a refresh or Back does not reopen the dialog', async () => {
    function Url() {
      // Rendered inside the router: reports the location the page is left on.
      const location = useLocation();
      return <output data-testid="url">{`${location.pathname}${location.search}`}</output>;
    }
    renderAt(commandHref('act-customer'), <><CustomersPage /><Url /></>);
    await screen.findByRole('dialog');
    await waitFor(() => expect(screen.getByTestId('url')).toHaveTextContent('/admin/finance/customers'));
    expect(screen.getByTestId('url').textContent).not.toContain('create=1');
  });

  it('does not reopen the dialog after the owner closes it', async () => {
    const user = userEvent.setup();
    renderAt(commandHref('act-customer'), <CustomersPage />);
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /Abbrechen/ }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});

describe('the offer action keeps its own route', () => {
  it('still points at /admin/finance/offers/new and carries no intent parameter', () => {
    expect(commandHref('act-offer')).toBe('/admin/finance/offers/new');
  });
});
