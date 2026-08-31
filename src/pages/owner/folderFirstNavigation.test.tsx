import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import type { OwnerExpense, OwnerInvoice, OwnerOffer } from '@/lib/ownerFinance/types';

/**
 * Folder-first navigation on the three owner collections.
 *
 * The behaviour under test is a navigation model, not a layout: opening Rechnungen, Angebote
 * or Ausgaben must show FOLDERS, and a record list must be something the owner enters. The
 * assertion that carries the whole feature is the negative one — the default route renders no
 * record rows at all — so it is stated for every page rather than once.
 *
 * Everything downstream of entering a folder (the table, row actions, selection, delete,
 * Papierkorb mechanics) is unchanged by this feature and is covered by
 * workspaceFolders.test.tsx and invoiceDeleteSemantics.test.tsx; here it is only checked that
 * entering a folder still reaches it.
 */

vi.stubEnv('VITE_SUPABASE_URL', 'https://folder-first-test.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

const ENTITY = { id: 'e1', display_name: 'Cogniiq' };

/* ------------------------------------------------------------------ rows */

const invoice = (over: Partial<OwnerInvoice>): OwnerInvoice => ({
  id: 'i1', business_entity_id: 'e1', organization_id: null, client_account_id: null,
  owner_customer_id: null, engagement_id: null, invoice_number: 'RE-1', status: 'issued',
  issue_date: '2026-03-01', service_date: '2026-03-01', due_date: '2026-03-15', currency: 'EUR',
  net_total_cents: 100000, vat_total_cents: 19000, gross_total_cents: 119000, amount_paid_cents: 0,
  notes: null, external_reference: null, issued_at: '2026-03-01T00:00:00Z', archived_at: null,
  cancelled_at: null, cancelled_by: null, cancellation_reason: null,
  created_at: '2026-03-01T00:00:00Z', updated_at: '2026-03-01T00:00:00Z', ...over,
});

const offer = (over: Partial<OwnerOffer>): OwnerOffer => ({
  id: 'o1', business_entity_id: 'e1', organization_id: null, client_account_id: null,
  owner_customer_id: null, engagement_id: null, offer_number: 'AN-1', status: 'sent',
  title: 'Angebot', issue_date: '2026-03-01', valid_until: '2026-04-01', currency: 'EUR',
  net_total_cents: 100000, vat_total_cents: 19000, gross_total_cents: 119000,
  recurring_monthly_net_cents: 0, recurring_monthly_vat_cents: 0, recurring_monthly_gross_cents: 0,
  recipient_company: null, recipient_contact_name: null, recipient_email: null,
  finalized_version: null, converted_invoice_id: null, accepted_at: null,
  archived_at: null, archived_by: null,
  created_at: '2026-03-01T00:00:00Z', updated_at: '2026-03-01T00:00:00Z', ...over,
} as OwnerOffer);

const expense = (over: Partial<OwnerExpense>): OwnerExpense => ({
  id: 'x1', business_entity_id: 'e1', vendor_id: null, organization_id: null,
  client_account_id: null, engagement_id: null, category_id: 'cat-software', subscription_id: null,
  supplier_invoice_number: 'SV-1', invoice_date: '2026-03-01', service_date: '2026-03-01',
  due_date: null, currency: 'EUR', net_total_cents: 10000, vat_total_cents: 1900,
  gross_total_cents: 11900, input_vat_cents: 1900, deductible_net_cents: 10000,
  amount_paid_cents: 0, payment_status: 'unpaid', review_status: 'pending', review_reason: null,
  notes: null, archived_at: null, created_by: null,
  created_at: '2026-03-01T00:00:00Z', updated_at: '2026-03-01T00:00:00Z', ...over,
} as OwnerExpense);

// Same shape on every page: two records in FOLDER A, one in FOLDER B, one unfiled, one trashed.
const INVOICES = [
  invoice({ id: 'r1', invoice_number: 'RE-0001' }),
  invoice({ id: 'r2', invoice_number: 'RE-0002' }),
  invoice({ id: 'r3', invoice_number: 'RE-0003' }),
  invoice({ id: 'r4', invoice_number: 'RE-0004' }),
  invoice({ id: 'r5', invoice_number: 'RE-0005' }),
];
const OFFERS = [
  offer({ id: 'r1', offer_number: 'AN-0001' }), offer({ id: 'r2', offer_number: 'AN-0002' }),
  offer({ id: 'r3', offer_number: 'AN-0003' }), offer({ id: 'r4', offer_number: 'AN-0004' }),
  offer({ id: 'r5', offer_number: 'AN-0005' }),
];
const EXPENSES = [
  expense({ id: 'r1', supplier_invoice_number: 'BE-0001' }),
  expense({ id: 'r2', supplier_invoice_number: 'BE-0002' }),
  expense({ id: 'r3', supplier_invoice_number: 'BE-0003' }),
  expense({ id: 'r4', supplier_invoice_number: 'BE-0004' }),
  expense({ id: 'r5', supplier_invoice_number: 'BE-0005' }),
];

const FOLDERS = [
  { id: 'fa', name: 'SV Heinersreuth', sort_order: 0, created_at: '2026-01-01T00:00:00Z' },
  { id: 'fb', name: 'Pankofer', sort_order: 1, created_at: '2026-01-02T00:00:00Z' },
  { id: 'fc', name: 'Leerer Ordner', sort_order: 2, created_at: '2026-01-03T00:00:00Z' },
];
const ITEMS = [
  { resource_id: 'r1', folder_id: 'fa', trashed_at: null },
  { resource_id: 'r2', folder_id: 'fa', trashed_at: null },
  { resource_id: 'r3', folder_id: 'fb', trashed_at: null },
  // r4 has no state row at all — the ordinary "Ohne Ordner" case.
  { resource_id: 'r5', folder_id: null, trashed_at: '2026-03-02T00:00:00Z' },
];

/* --------------------------------------------------------- server double */

const server = { folders: [...FOLDERS], items: [...ITEMS] };
const rpcImpl = async (fn: string, args: Record<string, unknown>) => {
  switch (fn) {
    case 'owner_workspace_state':
      return { data: { folders: server.folders, items: server.items }, error: null };
    case 'owner_create_workspace_folder': {
      const name = String(args.p_name).trim();
      if (server.folders.some((f) => f.name.toLowerCase() === name.toLowerCase())) {
        return { data: null, error: { message: 'folder_name_taken' } };
      }
      const created = { id: `f${server.folders.length + 1}`, name, sort_order: server.folders.length, created_at: '2026-01-09T00:00:00Z' };
      server.folders = [...server.folders, created];
      return { data: created, error: null };
    }
    case 'owner_rename_workspace_folder':
      server.folders = server.folders.map((f) => (f.id === args.p_folder_id ? { ...f, name: String(args.p_name).trim() } : f));
      return { data: { id: args.p_folder_id }, error: null };
    case 'owner_delete_workspace_folder': {
      const unassigned = server.items.filter((i) => i.folder_id === args.p_folder_id).length;
      server.items = server.items.filter((i) => i.folder_id !== args.p_folder_id);
      server.folders = server.folders.filter((f) => f.id !== args.p_folder_id);
      return { data: { unassigned_count: unassigned }, error: null };
    }
    case 'owner_workspace_delete_preflight':
      return {
        data: (args.p_resource_ids as string[]).map((id) => ({
          resource_id: id, action: 'trash_only', reasons: ['has_payments'], dependencies: {},
        })),
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
  return {
    ...actual,
    loadInvoices: vi.fn(async () => INVOICES),
    loadExpenses: vi.fn(async () => EXPENSES),
    loadCategories: vi.fn(async () => [{ id: 'cat-software', label: 'Software', code: 'sw' }]),
    loadVendors: vi.fn(async () => []),
  };
});
vi.mock('@/lib/ownerFinance/offersApi', async () => {
  const actual = await vi.importActual<typeof import('@/lib/ownerFinance/offersApi')>('@/lib/ownerFinance/offersApi');
  return {
    ...actual,
    loadOffers: vi.fn(async () => OFFERS),
    loadPendingSendOfferIds: vi.fn(async () => new Set<string>()),
  };
});
vi.mock('@/lib/ownerFinance/customersApi', async () => {
  const actual = await vi.importActual<typeof import('@/lib/ownerFinance/customersApi')>('@/lib/ownerFinance/customersApi');
  return { ...actual, loadCustomers: vi.fn(async () => []) };
});
vi.mock('@/lib/clientPlatform/adminApi', () => ({ loadAdminClients: vi.fn(async () => []) }));
vi.mock('@/pages/owner/ownerContext', () => ({
  useOwnerEntity: () => ({ entity: ENTITY, status: 'ready', taxYear: 2026 }),
}));

const { ToastProvider } = await import('@/components/dashboard');
const { InvoicesPage } = await import('@/pages/owner/InvoicesPage');
const { OffersPage } = await import('@/pages/owner/OffersPage');
const { ExpensesPage } = await import('@/pages/owner/ExpensesPage');

/* ------------------------------------------------------------- harness */

const PAGES = [
  { name: 'Rechnungen', path: '/admin/finance/invoices', Page: InvoicesPage, ref: 'RE-000', heading: 'Rechnungen' },
  { name: 'Angebote', path: '/admin/finance/offers', Page: OffersPage, ref: 'AN-000', heading: 'Angebote' },
  { name: 'Ausgaben', path: '/admin/finance/expenses', Page: ExpensesPage, ref: 'BE-000', heading: 'Ausgaben' },
] as const;

function renderAt(Page: (typeof PAGES)[number]['Page'], entry: string) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <ToastProvider><Page /></ToastProvider>
    </MemoryRouter>,
  );
}

/** Rows currently rendered in the desktop table. Zero means no record list on screen. */
const rowCount = () => screen.queryAllByRole('row').length;
const tile = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name} öffnen`) });
/** The tile card around the stretched click target — where the visible count lives. */
const tileCard = (name: string) => tile(name).parentElement as HTMLElement;
const overviewReady = () => screen.findByRole('heading', { name: 'Ordner' });

beforeEach(() => {
  server.folders = [...FOLDERS];
  server.items = [...ITEMS];
  rpc.mockClear();
  rpc.mockImplementation(rpcImpl);
});

describe.each(PAGES)('$name — folder-first navigation', ({ path, Page, ref, heading }) => {
  it('opens on the folder overview: folders with counts, and NO record rows', async () => {
    renderAt(Page, path);
    await overviewReady();

    // 1 + 2 — every custom folder, with its count.
    expect(tile('SV Heinersreuth')).toBeInTheDocument();
    expect(tile('Pankofer')).toBeInTheDocument();
    expect(tileCard('SV Heinersreuth')).toHaveTextContent('2');
    expect(tileCard('Pankofer')).toHaveTextContent('1');

    // 3 + 4 — both system folders.
    expect(tile('Ohne Ordner')).toBeInTheDocument();
    expect(tile('Papierkorb')).toBeInTheDocument();

    // 5 — THE assertion this whole feature exists for. No table, no rows, no record refs.
    expect(rowCount()).toBe(0);
    expect(screen.queryByText(new RegExp(ref))).not.toBeInTheDocument();
  });

  it('does not render the record-level filters or search on the overview', async () => {
    renderAt(Page, path);
    await overviewReady();
    // The status filter and the search box belong to a list; there is no list here.
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: /Alle sichtbaren Zeilen/ })).not.toBeInTheDocument();
  });

  it('keeps the page title and its create action on the overview', async () => {
    renderAt(Page, path);
    await overviewReady();
    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Neuer Ordner' })).toBeInTheDocument();
  });

  it('opens a folder and shows ONLY its records', async () => {
    const user = userEvent.setup();
    renderAt(Page, path);
    await overviewReady();

    await user.click(tile('SV Heinersreuth'));

    // 6 + 7 — r1 and r2 are inside; r3 (other folder), r4 (unfiled) and r5 (trashed) are not.
    await waitFor(() => expect(rowCount()).toBe(3)); // header row + 2 records
    expect(screen.getAllByText(new RegExp(`${ref}1`)).length).toBeGreaterThan(0);
    expect(screen.queryByText(new RegExp(`${ref}3`))).not.toBeInTheDocument();
    expect(screen.queryByText(new RegExp(`${ref}4`))).not.toBeInTheDocument();
    expect(screen.queryByText(new RegExp(`${ref}5`))).not.toBeInTheDocument();

    // The context band says where you are, and the record controls are back.
    expect(screen.getByRole('heading', { name: 'SV Heinersreuth' })).toBeInTheDocument();
    expect(screen.getByText('2 Einträge')).toBeInTheDocument();
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });

  it('opens "Ohne Ordner" and shows only unfiled records', async () => {
    const user = userEvent.setup();
    renderAt(Page, path);
    await overviewReady();

    await user.click(tile('Ohne Ordner'));
    await waitFor(() => expect(rowCount()).toBe(2)); // header + r4
    expect(screen.getAllByText(new RegExp(`${ref}4`)).length).toBeGreaterThan(0);
    expect(screen.queryByText(new RegExp(`${ref}1`))).not.toBeInTheDocument();
  });

  it('opens the Papierkorb and shows only trashed records', async () => {
    const user = userEvent.setup();
    renderAt(Page, path);
    await overviewReady();

    await user.click(tile('Papierkorb'));
    await waitFor(() => expect(rowCount()).toBe(2)); // header + r5
    expect(screen.getAllByText(new RegExp(`${ref}5`)).length).toBeGreaterThan(0);
    // Trash row actions, unchanged by this feature.
    expect(screen.getAllByRole('button', { name: 'Wiederherstellen' }).length).toBeGreaterThan(0);
  });

  it('goes back to the folder overview', async () => {
    const user = userEvent.setup();
    renderAt(Page, path);
    await overviewReady();

    await user.click(tile('SV Heinersreuth'));
    await waitFor(() => expect(rowCount()).toBeGreaterThan(0));

    // 10 — the back control clears the parameter rather than relying on history.
    await user.click(screen.getByRole('button', { name: heading }));
    await overviewReady();
    expect(rowCount()).toBe(0);
    expect(tile('SV Heinersreuth')).toBeInTheDocument();
  });

  it('opens straight into a folder from a direct URL', async () => {
    renderAt(Page, `${path}?folder=fb`);
    // 11 — a reload inside a folder stays inside it.
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Pankofer' })).toBeInTheDocument());
    expect(rowCount()).toBe(2); // header + r3
    expect(screen.getAllByText(new RegExp(`${ref}3`)).length).toBeGreaterThan(0);
  });

  it('falls back to the overview for a folder id that no longer exists', async () => {
    renderAt(Page, `${path}?folder=does-not-exist`);
    // 12 — never a blank or broken page.
    await overviewReady();
    expect(rowCount()).toBe(0);
    expect(tile('SV Heinersreuth')).toBeInTheDocument();
  });

  it('shows an empty custom folder and opens it', async () => {
    const user = userEvent.setup();
    renderAt(Page, path);
    await overviewReady();

    // 13 — an empty folder is still a folder.
    const empty = tile('Leerer Ordner');
    expect(empty).toBeInTheDocument();
    await user.click(empty);

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Leerer Ordner' })).toBeInTheDocument());
    expect(screen.getByText('0 Einträge')).toBeInTheDocument();
    expect(rowCount()).toBe(0);
    // It says it is empty rather than borrowing the page's "no match" wording.
    expect(screen.getByText('Noch keine Einträge in diesem Ordner')).toBeInTheDocument();
  });

  it('creates a folder from the overview and stays on the overview', async () => {
    const user = userEvent.setup();
    renderAt(Page, path);
    await overviewReady();

    await user.click(screen.getByRole('button', { name: 'Neuer Ordner' }));
    await user.type(await screen.findByLabelText('Name'), '2026');
    await user.click(screen.getByRole('button', { name: 'Ordner anlegen' }));

    // 14 — the folder appears; the owner is not dumped into an empty list.
    await waitFor(() => expect(tile('2026')).toBeInTheDocument());
    expect(rowCount()).toBe(0);
    expect(screen.getByRole('heading', { name: 'Ordner' })).toBeInTheDocument();
  });

  it('renames and deletes a folder from the overview tile menu', async () => {
    const user = userEvent.setup();
    renderAt(Page, path);
    await overviewReady();

    await user.click(screen.getByRole('button', { name: 'Ordner Pankofer verwalten' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Umbenennen' }));
    const field = await screen.findByLabelText('Name');
    await user.clear(field);
    await user.type(field, 'Pankofer GmbH');
    await user.click(screen.getByRole('button', { name: 'Speichern' }));
    await waitFor(() => expect(tile('Pankofer GmbH')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Ordner Pankofer GmbH verwalten' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Ordner löschen' }));
    const dialog = await screen.findByRole('dialog', { name: 'Ordner löschen?' });
    expect(within(dialog).getByText(/werden nicht gelöscht/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Ordner löschen' }));

    await waitFor(() => expect(screen.queryByRole('button', { name: 'Pankofer GmbH öffnen' })).not.toBeInTheDocument());
    // 15 — the records survive: they are simply unfiled now, and still reachable.
    expect(tile('Ohne Ordner')).toBeInTheDocument();
  });
});

/**
 * The mutation guard §19 asks for.
 *
 * If the default route ever goes back to rendering all records, the overview disappears and
 * rows appear — so this states both halves explicitly, once, over all three pages.
 */
describe('the default route is the folder overview, not a record list', () => {
  it.each(PAGES)('$name renders folders and zero rows at its bare URL', async ({ path, Page, ref }) => {
    renderAt(Page, path);
    await screen.findByRole('heading', { name: 'Ordner' });
    expect(rowCount()).toBe(0);
    expect(screen.queryByText(new RegExp(ref))).not.toBeInTheDocument();
  });

  it.each(PAGES)('$name still has an explicit all-records view at ?folder=all', async ({ path, Page, ref }) => {
    renderAt(Page, `${path}?folder=all`);
    // Four non-trashed records; the trashed one stays out.
    await waitFor(() => expect(rowCount()).toBe(5));
    expect(screen.getAllByText(new RegExp(`${ref}1`)).length).toBeGreaterThan(0);
    expect(screen.queryByText(new RegExp(`${ref}5`))).not.toBeInTheDocument();
  });
});
