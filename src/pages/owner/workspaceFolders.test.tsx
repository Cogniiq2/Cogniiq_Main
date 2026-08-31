import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import type { OwnerExpense } from '@/lib/ownerFinance/types';

/**
 * Folders, the Papierkorb and the delete path, exercised through a REAL owner collection page.
 *
 * The behaviour worth pinning is the behaviour a screenshot cannot show:
 *  - a folder narrows the list, and does so ON TOP of the status filter and the search rather
 *    than replacing either, in both directions
 *  - a trashed record leaves "Alle" and every folder, and appears only in the Papierkorb
 *  - deleting a FOLDER never deletes a record
 *  - "Löschen" is offered on every row, including a reviewed one — and what the confirmation
 *    promises is what the server said it will do, never the word on the menu item
 *  - bulk move is one request, and a bulk delete confirmation states the mixed outcome
 *  - the selected folder survives a reload, because it lives in the URL
 */

vi.stubEnv('VITE_SUPABASE_URL', 'https://workspace-folders-test.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

const ENTITY = { id: 'e1', display_name: 'Cogniiq' };

const expense = (over: Partial<OwnerExpense>): OwnerExpense => ({
  id: 'x1',
  business_entity_id: 'e1',
  vendor_id: null,
  organization_id: null,
  client_account_id: null,
  engagement_id: null,
  category_id: 'cat-software',
  subscription_id: null,
  supplier_invoice_number: null,
  invoice_date: '2026-03-01',
  service_date: '2026-03-01',
  due_date: null,
  currency: 'EUR',
  net_total_cents: 10000,
  vat_total_cents: 1900,
  gross_total_cents: 11900,
  input_vat_cents: 1900,
  deductible_net_cents: 10000,
  amount_paid_cents: 0,
  payment_status: 'unpaid',
  review_status: 'pending',
  review_reason: null,
  notes: null,
  archived_at: null,
  created_by: null,
  created_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z',
  ...over,
} as OwnerExpense);

const EXPENSES: OwnerExpense[] = [
  expense({ id: 'x1', supplier_invoice_number: 'SV-1', net_total_cents: 10000 }),
  expense({ id: 'x2', supplier_invoice_number: 'SV-2', review_status: 'reviewed', net_total_cents: 20000 }),
  expense({ id: 'x3', supplier_invoice_number: 'PK-3', net_total_cents: 30000 }),
  expense({ id: 'x4', supplier_invoice_number: 'PK-4', payment_status: 'paid', amount_paid_cents: 11900, review_status: 'reviewed' }),
];

/* ------------------------------------------------------------ server double */

// A small in-memory stand-in for the RPC surface. It mirrors the migration's contract —
// including that it, not the component, decides what "Löschen" means for a record.
const server = {
  folders: [] as { id: string; name: string; sort_order: number; created_at: string }[],
  items: new Map<string, { folder_id: string | null; trashed_at: string | null }>(),
  moveCalls: 0,
  deleteCalls: [] as string[][],
};

function planFor(id: string) {
  const row = EXPENSES.find((e) => e.id === id)!;
  // review_status is deliberately NOT consulted, exactly as the SQL does not consult it.
  const encumbered = row.amount_paid_cents > 0;
  return encumbered
    ? { resource_id: id, action: 'trash_only', reasons: ['partially_or_fully_paid'], dependencies: {} }
    : { resource_id: id, action: 'hard_delete', reasons: ['no_protected_dependency'], dependencies: {} };
}

const rpcImpl = async (fn: string, args: Record<string, unknown>) => {
  switch (fn) {
    case 'owner_workspace_state':
      return {
        data: {
          folders: server.folders,
          items: [...server.items.entries()].map(([resource_id, v]) => ({ resource_id, ...v })),
        },
        error: null,
      };
    case 'owner_create_workspace_folder': {
      const name = String(args.p_name).trim();
      if (server.folders.some((f) => f.name.toLowerCase() === name.toLowerCase())) {
        return { data: null, error: { message: 'folder_name_taken' } };
      }
      const folder = { id: `f${server.folders.length + 1}`, name, sort_order: server.folders.length, created_at: '2026-01-01' };
      server.folders.push(folder);
      return { data: folder, error: null };
    }
    case 'owner_rename_workspace_folder': {
      const folder = server.folders.find((f) => f.id === args.p_folder_id);
      if (folder) folder.name = String(args.p_name).trim();
      return { data: { id: args.p_folder_id }, error: null };
    }
    case 'owner_delete_workspace_folder': {
      const id = String(args.p_folder_id);
      let unassigned = 0;
      for (const [key, value] of server.items) {
        if (value.folder_id !== id) continue;
        unassigned += 1;
        if (value.trashed_at) server.items.set(key, { ...value, folder_id: null });
        else server.items.delete(key);
      }
      server.folders = server.folders.filter((f) => f.id !== id);
      return { data: { unassigned_count: unassigned }, error: null };
    }
    case 'owner_move_workspace_items': {
      server.moveCalls += 1;
      for (const id of args.p_resource_ids as string[]) {
        const previous = server.items.get(id);
        const folder = (args.p_folder_id as string | null) ?? null;
        if (!folder && !previous?.trashed_at) server.items.delete(id);
        else server.items.set(id, { folder_id: folder, trashed_at: previous?.trashed_at ?? null });
      }
      return { data: { moved: (args.p_resource_ids as string[]).length }, error: null };
    }
    case 'owner_workspace_delete_preflight':
      return { data: (args.p_resource_ids as string[]).map(planFor), error: null };
    case 'owner_workspace_delete_items': {
      const ids = args.p_resource_ids as string[];
      server.deleteCalls.push(ids);
      return {
        data: ids.map((id) => {
          const plan = planFor(id);
          if (plan.action === 'hard_delete') { server.items.delete(id); return { ...plan, outcome: 'hard_deleted', error: null }; }
          server.items.set(id, { folder_id: server.items.get(id)?.folder_id ?? null, trashed_at: '2026-03-02T00:00:00Z' });
          return { ...plan, outcome: 'trashed', error: null };
        }),
        error: null,
      };
    }
    case 'owner_workspace_restore_items': {
      for (const id of args.p_resource_ids as string[]) {
        const previous = server.items.get(id);
        if (!previous) continue;
        if (previous.folder_id) server.items.set(id, { ...previous, trashed_at: null });
        else server.items.delete(id);
      }
      return { data: { restored: (args.p_resource_ids as string[]).length }, error: null };
    }
    default:
      return { data: null, error: null };
  }
};

// `restoreMocks: true` in vitest.config.ts strips a vi.fn's implementation after every test,
// so the double is re-installed in beforeEach rather than only here.
const rpc = vi.fn(rpcImpl);

vi.mock('@/lib/supabase', () => ({ supabase: { rpc, from: () => { throw new Error('no direct table access'); } } }));

vi.mock('@/lib/ownerFinance/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/ownerFinance/api')>('@/lib/ownerFinance/api');
  return {
    ...actual,
    loadExpenses: vi.fn(async () => EXPENSES.filter((e) => !DELETED.has(e.id))),
    loadCategories: vi.fn(async () => [{ id: 'cat-software', label: 'Software', code: 'sw' }]),
    loadVendors: vi.fn(async () => []),
    markExpenseReviewed: vi.fn(async () => ({ error: null })),
  };
});

// Records the double actually removed, so "deleting a folder deletes no record" is checked
// against the loader rather than against the assertion's own bookkeeping.
const DELETED = new Set<string>();

vi.mock('@/lib/clientPlatform/adminApi', () => ({ loadAdminClients: vi.fn(async () => []) }));
vi.mock('@/pages/owner/ownerContext', () => ({
  useOwnerEntity: () => ({ entity: ENTITY, status: 'ready', taxYear: 2026 }),
}));

const { ToastProvider } = await import('@/components/dashboard');
const { ExpensesPage } = await import('@/pages/owner/ExpensesPage');

function renderPage(initialEntry = '/admin/finance/expenses') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <ToastProvider>
        <ExpensesPage />
      </ToastProvider>
    </MemoryRouter>,
  );
}

const rail = () => screen.getByRole('radiogroup', { name: 'Nach Ordner filtern' });
const chip = (name: RegExp) => within(rail()).getByRole('radio', { name });
// The page's own status filter is a SECOND radiogroup; both are scoped so a shared label
// like "Alle" can never resolve to the wrong one.
const statusChip = (name: RegExp) =>
  within(screen.getByRole('radiogroup', { name: 'Ausgaben filtern' })).getByRole('radio', { name });
const visibleRefs = () => screen.getAllByRole('row').slice(1)
  .map((row) => row.textContent ?? '').filter(Boolean);

beforeEach(() => {
  server.folders = [];
  server.items = new Map();
  server.moveCalls = 0;
  server.deleteCalls = [];
  DELETED.clear();
  rpc.mockClear();
  rpc.mockImplementation(rpcImpl);
});

async function createFolder(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByRole('button', { name: /Ordner$/i }));
  await screen.findByRole('dialog', { name: 'Neuer Ordner' });
  await user.type(screen.getByLabelText('Name'), name);
  await user.click(screen.getByRole('button', { name: 'Ordner anlegen' }));
}

describe('the folder rail', () => {
  it('opens on "Alle" with the system views present and no folders yet', async () => {
    renderPage();
    await screen.findAllByText(/SV-1/);
    expect(chip(/^Alle/)).toHaveAttribute('aria-checked', 'true');
    expect(chip(/^Ohne Ordner/)).toBeInTheDocument();
    expect(chip(/^Papierkorb/)).toBeInTheDocument();
  });

  it('creates a folder, selects it, and refuses a case-insensitive duplicate inline', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText(/SV-1/);

    await createFolder(user, 'SV Heinersreuth');
    await waitFor(() => expect(chip(/SV Heinersreuth/)).toHaveAttribute('aria-checked', 'true'));

    await user.click(screen.getByRole('button', { name: /Ordner$/i }));
    await screen.findByRole('dialog', { name: 'Neuer Ordner' });
    await user.type(screen.getByLabelText('Name'), 'sv heinersreuth');
    await user.click(screen.getByRole('button', { name: 'Ordner anlegen' }));

    // An inline field error, and the dialog stays open — not a toast that hides the field.
    expect(await screen.findByText('Ein Ordner mit diesem Namen existiert bereits.')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Neuer Ordner' })).toBeInTheDocument();
    expect(server.folders).toHaveLength(1);
  });

  it('renames a folder', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText(/SV-1/);
    await createFolder(user, 'Test');
    await waitFor(() => expect(chip(/Test/)).toBeInTheDocument());

    await user.click(await screen.findByRole('button', { name: 'Ordner Test verwalten' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Umbenennen' }));
    const field = await screen.findByLabelText('Name');
    await user.clear(field);
    await user.type(field, 'Archiv 2026');
    await user.click(screen.getByRole('button', { name: 'Speichern' }));

    await waitFor(() => expect(chip(/Archiv 2026/)).toBeInTheDocument());
  });
});

describe('moving records and filtering by folder', () => {
  it('moves one record and shows it only inside its folder', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText(/SV-1/);
    await createFolder(user, 'Pankofer');
    await waitFor(() => expect(chip(/Pankofer/)).toBeInTheDocument());
    // Creating a folder selects it, and it is empty. Back to "Alle" to pick a record.
    await user.click(chip(/^Alle/));
    await waitFor(() => expect(visibleRefs()).toHaveLength(4));

    await user.click(screen.getAllByRole('button', { name: /organisieren/ })[0]);
    await user.click(await screen.findByRole('menuitem', { name: 'In Ordner verschieben' }));
    await user.click(await screen.findByRole('button', { name: /^Pankofer$/ }));

    await waitFor(() => expect(within(chip(/Pankofer/)).getByText('1')).toBeInTheDocument());

    await user.click(chip(/Pankofer/));
    await waitFor(() => expect(visibleRefs()).toHaveLength(1));
    await user.click(chip(/^Ohne Ordner/));
    await waitFor(() => expect(visibleRefs()).toHaveLength(3));
  });

  it('bulk-moves the whole selection in ONE request', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText(/SV-1/);
    await createFolder(user, '2026');
    await waitFor(() => expect(chip(/2026/)).toBeInTheDocument());
    await user.click(chip(/^Alle/));
    await waitFor(() => expect(visibleRefs()).toHaveLength(4));

    await user.click(screen.getByRole('checkbox', { name: 'Alle sichtbaren Zeilen auswählen' }));
    expect(screen.getByText('4 ausgewählt')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'In Ordner verschieben' }));
    await user.click(await screen.findByRole('button', { name: /^2026$/ }));

    await waitFor(() => expect(server.moveCalls).toBe(1));
    expect([...server.items.values()].filter((v) => v.folder_id === 'f1')).toHaveLength(4);
  });

  it('composes with the status filter and the search in both directions', async () => {
    const user = userEvent.setup();
    // Two receipts filed in the folder; one of them is paid.
    server.folders = [{ id: 'f1', name: 'SV Heinersreuth', sort_order: 0, created_at: '2026-01-01' }];
    server.items.set('x1', { folder_id: 'f1', trashed_at: null });
    server.items.set('x4', { folder_id: 'f1', trashed_at: null });
    renderPage();
    await screen.findAllByText(/SV-1/);

    await user.click(chip(/SV Heinersreuth/));
    await waitFor(() => expect(visibleRefs()).toHaveLength(2));

    // + status: only the unpaid one is left …
    await user.click(statusChip(/^Unbezahlt/));
    await waitFor(() => expect(visibleRefs()).toHaveLength(1));
    // … and the folder is STILL the selected one.
    expect(chip(/SV Heinersreuth/)).toHaveAttribute('aria-checked', 'true');

    // + search that matches nothing in this intersection.
    await user.type(screen.getByLabelText('Ausgaben durchsuchen'), 'PK-3');
    await waitFor(() => expect(screen.getByText('Keine Treffer')).toBeInTheDocument());

    // Changing the folder does not reset the status filter or the search.
    await user.click(chip(/^Alle/));
    expect(statusChip(/^Unbezahlt/)).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByLabelText('Ausgaben durchsuchen')).toHaveValue('PK-3');
  });

  it('keeps the selected folder across a reload, because it lives in the URL', async () => {
    server.folders = [{ id: 'f1', name: 'Archiv', sort_order: 0, created_at: '2026-01-01' }];
    server.items.set('x2', { folder_id: 'f1', trashed_at: null });
    renderPage('/admin/finance/expenses?folder=f1');
    await screen.findAllByText(/SV-2/);
    await waitFor(() => expect(chip(/Archiv/)).toHaveAttribute('aria-checked', 'true'));
    expect(visibleRefs()).toHaveLength(1);
  });
});

describe('deleting a folder', () => {
  it('deletes the folder, keeps every record, and says so before it happens', async () => {
    const user = userEvent.setup();
    server.folders = [{ id: 'f1', name: 'Test', sort_order: 0, created_at: '2026-01-01' }];
    server.items.set('x1', { folder_id: 'f1', trashed_at: null });
    server.items.set('x2', { folder_id: 'f1', trashed_at: null });
    renderPage('/admin/finance/expenses?folder=f1');
    await screen.findAllByText(/SV-1/);

    await user.click(await screen.findByRole('button', { name: 'Ordner Test verwalten' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Ordner löschen' }));

    const dialog = await screen.findByRole('dialog', { name: 'Ordner löschen?' });
    expect(within(dialog).getByText(/werden nicht gelöscht/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Ordner löschen' }));

    await waitFor(() => expect(server.folders).toHaveLength(0));
    // The records are untouched and simply unfiled again.
    expect(DELETED.size).toBe(0);
    await waitFor(() => expect(visibleRefs()).toHaveLength(4));
    expect(screen.queryByRole('radio', { name: /Test/ })).not.toBeInTheDocument();
  });
});

describe('the delete path', () => {
  it('offers "Löschen" on a REVIEWED receipt and permanently deletes it', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText(/SV-2/);

    // Row 2 is review_status = 'reviewed'. Before this change it had no delete affordance at all.
    const menus = screen.getAllByRole('button', { name: /organisieren/ });
    await user.click(menus[1]);
    await user.click(await screen.findByRole('menuitem', { name: 'Löschen' }));

    const dialog = await screen.findByRole('dialog', { name: 'Endgültig löschen?' });
    expect(within(dialog).getByText(/dauerhaft entfernt/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Endgültig löschen' }));

    await waitFor(() => expect(server.deleteCalls).toEqual([['x2']]));
  });

  it('calls a move to the Papierkorb what it is, for a record that must be kept', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText(/PK-4/);

    const menus = screen.getAllByRole('button', { name: /organisieren/ });
    await user.click(menus[3]);
    await user.click(await screen.findByRole('menuitem', { name: 'Löschen' }));

    // The paid receipt resolves to trash_only, so the dialog must NOT promise a deletion.
    const dialog = await screen.findByRole('dialog', { name: 'Aus Arbeitsbereich entfernen?' });
    expect(within(dialog).getByText(/bleibt in Buchhaltung und Historie unverändert erhalten/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'In Papierkorb verschieben' }));

    await waitFor(() => expect(server.items.get('x4')?.trashed_at).toBeTruthy());
  });

  it('states the mixed outcome of a bulk delete before performing it', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText(/SV-1/);

    await user.click(screen.getByRole('checkbox', { name: 'Alle sichtbaren Zeilen auswählen' }));
    await user.click(screen.getByRole('button', { name: 'Löschen' }));

    const dialog = await screen.findByRole('dialog', { name: '4 Belege entfernen?' });
    expect(within(dialog).getByText('3 Einträge werden endgültig gelöscht')).toBeInTheDocument();
    expect(within(dialog).getByText('1 Eintrag wird in den Papierkorb verschoben')).toBeInTheDocument();
  });
});

describe('the Papierkorb', () => {
  it('hides a trashed record from "Alle" and from its folder, and restores it', async () => {
    const user = userEvent.setup();
    server.folders = [{ id: 'f1', name: 'Archiv', sort_order: 0, created_at: '2026-01-01' }];
    server.items.set('x4', { folder_id: 'f1', trashed_at: '2026-03-02T00:00:00Z' });
    renderPage();
    await screen.findAllByText(/SV-1/);

    expect(visibleRefs()).toHaveLength(3);
    // The record is filed in "Archiv" AND trashed: the folder must not show it either.
    await user.click(chip(/Archiv/));
    await waitFor(() => expect(screen.getByText('Keine Ausgaben in dieser Ansicht')).toBeInTheDocument());

    await user.click(chip(/^Papierkorb/));
    await waitFor(() => expect(visibleRefs()).toHaveLength(1));

    // A record that must be retained shows no permanent-delete button — it says why instead.
    // Rendered once in the table row and once in the mobile card — both, never neither.
    expect(await screen.findAllByText(/Nachweis-\/Buchhaltungsgründen erhalten bleiben/)).toHaveLength(2);
    expect(screen.queryByRole('button', { name: 'Endgültig löschen' })).not.toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Wiederherstellen' })[0]);
    await waitFor(() => expect(server.items.get('x4')?.trashed_at).toBeNull());
  });
});
