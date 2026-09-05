import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

/**
 * Finanzen → Ausgaben → Schnellimport, through the REAL page.
 *
 * The behaviour worth pinning is the behaviour a unit test of the parser cannot show:
 *  - the action is reachable from the FOLDER OVERVIEW, not only from inside a list
 *  - "Prüfen" resolves suppliers against VENDORS and writes nothing
 *  - the preview names every vendor the import would create, before confirmation
 *  - cancelling writes nothing at all
 *  - only an explicit confirmation runs the import, and it is ONE RPC
 *  - a blocked row (the supplier credit) makes confirmation impossible
 */

vi.stubEnv('VITE_SUPABASE_URL', 'https://expense-import-test.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

const ENTITY = { id: 'e1', display_name: 'Cogniiq' };

const CATEGORIES = [
  { id: 'cat-ai', key: 'ai_api', label: 'KI & API-Kosten' },
  { id: 'cat-office', key: 'office', label: 'Büro' },
  { id: 'cat-cloud', key: 'cloud_hosting', label: 'Cloud & Hosting' },
  { id: 'cat-review', key: 'review_required', label: 'Prüfung erforderlich' },
];

/** Every RPC the page may reach, recorded so "wrote nothing" is checked, not assumed. */
const calls: Array<{ fn: string; args: Record<string, unknown> }> = [];

/**
 * The server's answers, per test.
 *
 * `knownVendorId` makes a pasted supplier RESOLVE instead of being previewed as a creation
 * — the duplicate probe only ever asks about rows whose vendor already exists.
 * `documentMatches` is what owner_check_expense_documents reports for those rows.
 */
const server = { knownVendorId: null as string | null, documentMatches: 0, probeFails: false };

const rpc = vi.fn(async (fn: string, args: Record<string, unknown>) => {
  calls.push({ fn, args });
  switch (fn) {
    case 'owner_workspace_state':
      return { data: { folders: [], items: [] }, error: null };
    case 'owner_resolve_import_vendors':
      // By default every pasted supplier is unknown, so each is previewed as a creation.
      return {
        data: (args.p_names as string[]).map((name) => ({
          name,
          vendor_id: server.knownVendorId,
          match_count: server.knownVendorId ? 1 : 0,
          ambiguous: false,
        })),
        error: null,
      };
    case 'owner_check_expense_documents':
      if (server.probeFails) return { data: null, error: { message: 'connection lost' } };
      return {
        data: (args.p_documents as Array<Record<string, unknown>>).map((d) => ({
          client_import_id: d.client_import_id,
          vendor_id: d.vendor_id,
          supplier_invoice_number: d.supplier_invoice_number,
          match_count: server.documentMatches,
        })),
        error: null,
      };
    case 'owner_bulk_import_expenses':
      return {
        data: {
          batch_id: 'b1', expense_count: 4, payment_count: 3,
          net_cents: 41274, vat_cents: 7841, gross_cents: 49115,
          input_vat_cents: 7841, paid_cents: 15200,
          vendors_created: ['Elm-Haustechnik'], expenses: [],
        },
        error: null,
      };
    default:
      return { data: null, error: null };
  }
});

vi.mock('@/lib/supabase', () => ({
  supabase: { rpc, from: () => { throw new Error('no direct table access'); } },
}));

vi.mock('@/lib/ownerFinance/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/ownerFinance/api')>('@/lib/ownerFinance/api');
  return {
    ...actual,
    loadExpenses: vi.fn(async () => []),
    loadCategories: vi.fn(async () => CATEGORIES),
    loadVendors: vi.fn(async () => []),
    createOwnerExpense: vi.fn(async () => { throw new Error('the import must never loop the single-expense RPC'); }),
    recordExpensePayment: vi.fn(async () => { throw new Error('the import must never loop the payment RPC'); }),
  };
});
vi.mock('@/lib/clientPlatform/adminApi', () => ({ loadAdminClients: vi.fn(async () => []) }));
vi.mock('@/pages/owner/ownerContext', () => ({
  useOwnerEntity: () => ({ entity: ENTITY, status: 'ready', taxYear: 2026 }),
}));

const { ToastProvider } = await import('@/components/dashboard');
const { ExpensesPage } = await import('@/pages/owner/ExpensesPage');
const { Q2EXP_2026_EXPENSES } = await import('@/lib/ownerFinance/fixtures/q2exp2026Expenses');
const { expenseImportTemplate } = await import('@/lib/ownerFinance/expenseBulkImport');
// Money is asserted through the SAME formatter the page renders with: Intl's de-DE currency
// output separates the amount from the € with a non-breaking space, so a hand-typed literal
// would never match.
const { formatCents } = await import('@/lib/clientPlatform/validation');

/**
 * Matcher for one rendered amount.
 *
 * Intl's de-DE currency output separates the amount from the € with a NON-BREAKING space,
 * which Testing Library's default normaliser does not collapse. Comparing the digits and
 * accepting any whitespace before the symbol keeps the assertion about the NUMBER rather
 * than about Intl's spacing character.
 */
const euro = (cents: number) => {
  const digits = formatCents(cents, 'EUR').replace(/[\s\u00a0\u202f]*€$/, '');
  return (content: string) => content.replace(/[\s\u00a0\u202f]/g, '') === `${digits}€`;
};

/** The bare route: folder-first, so the page opens on the folder overview. */
function renderPage(entry = '/admin/finance/expenses') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <ToastProvider><ExpensesPage /></ToastProvider>
    </MemoryRouter>,
  );
}

const importRpcs = () => calls.filter((c) => c.fn.startsWith('owner_bulk_import') || c.fn.startsWith('owner_resolve_'));
const writeRpcs = () => calls.filter((c) => c.fn === 'owner_bulk_import_expenses');

async function openImport(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByRole('button', { name: 'Schnellimport' });
  await user.click(screen.getByRole('button', { name: 'Schnellimport' }));
  return screen.findByRole('dialog');
}

async function paste(_user: ReturnType<typeof userEvent.setup>, dialog: HTMLElement, json: string) {
  // A real paste, expressed as one change event. userEvent.type would enter a 4 KB fixture
  // character by character, which is both slow and not what pasting does.
  const box = within(dialog).getByLabelText('Ausgaben-JSON') as HTMLTextAreaElement;
  fireEvent.change(box, { target: { value: json } });
  return box;
}

beforeEach(() => {
  calls.length = 0;
  rpc.mockClear();
  server.knownVendorId = null;
  server.documentMatches = 0;
  server.probeFails = false;
});

describe('the Schnellimport action', () => {
  it('is available on the FOLDER OVERVIEW, not only inside a list', async () => {
    renderPage();
    // The folder overview is what the bare route renders; the action lives in the page
    // header so it stays reachable from it.
    await screen.findByRole('heading', { name: 'Ausgaben' });
    expect(await screen.findByRole('button', { name: 'Schnellimport' })).toBeEnabled();
  });

  it('is available inside a folder view too', async () => {
    renderPage('/admin/finance/expenses?folder=all');
    expect(await screen.findByRole('button', { name: 'Schnellimport' })).toBeEnabled();
  });

  it('opens a dialog that names itself as the EXPENSE import', async () => {
    const user = userEvent.setup();
    renderPage();
    const dialog = await openImport(user);
    expect(within(dialog).getByText('Ausgaben-Schnellimport')).toBeInTheDocument();
    expect(within(dialog).getByText(/Lieferanten, keine Kunden/)).toBeInTheDocument();
  });
});

describe('preview', () => {
  it('shows the totals, the Vorsteuer and the vendors that would be created', async () => {
    const user = userEvent.setup();
    renderPage();
    const dialog = await openImport(user);
    await paste(user, dialog, expenseImportTemplate());
    await user.click(within(dialog).getByRole('button', { name: 'Prüfen' }));

    await within(dialog).findByText(/Ausgaben bereit/);
    expect(within(dialog).getByText('3 Ausgaben · 1 Zahlungen')).toBeInTheDocument();
    expect(within(dialog).getByText('Vorsteuer')).toBeInTheDocument();
    // Net 420,00 + 84,00 + 19,33 = 523,33. Gross 499,80 + 84,00 + 23,00 = 606,80: the §13b
    // line's self-assessed VAT is deliberately absent from the supplier gross.
    expect(within(dialog).getByText(euro(52333))).toBeInTheDocument();
    expect(within(dialog).getByText(euro(60680))).toBeInTheDocument();
    expect(within(dialog).getByText(/Neuer Lieferant wird angelegt: OpenAI Ireland Limited/)).toBeInTheDocument();
  });

  it('resolves suppliers as VENDORS and never as customers', async () => {
    const user = userEvent.setup();
    renderPage();
    const dialog = await openImport(user);
    await paste(user, dialog, expenseImportTemplate());
    await user.click(within(dialog).getByRole('button', { name: 'Prüfen' }));
    await within(dialog).findByText(/Ausgaben bereit/);

    // THE mutation guard for the reported defect: swapping this back to customer resolution
    // fails here.
    const resolves = calls.filter((c) => c.fn.startsWith('owner_resolve_'));
    expect(resolves.map((c) => c.fn)).toEqual(['owner_resolve_import_vendors']);
    expect(calls.some((c) => c.fn === 'owner_resolve_import_customers')).toBe(false);
    expect(resolves[0].args.p_names).toContain('OpenAI Ireland Limited');
  });

  it('WRITES NOTHING while previewing', async () => {
    const user = userEvent.setup();
    renderPage();
    const dialog = await openImport(user);
    await paste(user, dialog, expenseImportTemplate());
    await user.click(within(dialog).getByRole('button', { name: 'Prüfen' }));
    await within(dialog).findByText(/Ausgaben bereit/);
    expect(writeRpcs()).toEqual([]);
  });

  it('reports the errors in the real Q2/2026 payload without importing it', async () => {
    const user = userEvent.setup();
    renderPage();
    const dialog = await openImport(user);
    await paste(user, dialog, Q2EXP_2026_EXPENSES);
    await user.click(within(dialog).getByRole('button', { name: 'Prüfen' }));

    await within(dialog).findByText(/Problem\(e\) — Import nicht möglich/);
    expect(within(dialog).getByText(/Lieferantengutschrift/)).toBeInTheDocument();
    // The four errors production reported are gone.
    expect(within(dialog).queryByText(/wurde nicht gefunden/)).not.toBeInTheDocument();
    expect(within(dialog).queryByText(/issue_date/)).not.toBeInTheDocument();
    expect(within(dialog).queryByText(/übersteigen/)).not.toBeInTheDocument();
  });

  it('makes confirmation impossible while a row is blocked', async () => {
    const user = userEvent.setup();
    renderPage();
    const dialog = await openImport(user);
    await paste(user, dialog, Q2EXP_2026_EXPENSES);
    await user.click(within(dialog).getByRole('button', { name: 'Prüfen' }));
    await within(dialog).findByText(/Problem\(e\) — Import nicht möglich/);

    const confirm = within(dialog).getByRole('button', { name: 'Import nicht möglich' });
    expect(confirm).toBeDisabled();
    await user.click(confirm);
    expect(writeRpcs()).toEqual([]);
  });
});

describe('confirmation', () => {
  it('requires an explicit confirmation and then runs exactly ONE atomic RPC', async () => {
    const user = userEvent.setup();
    renderPage();
    const dialog = await openImport(user);
    await paste(user, dialog, expenseImportTemplate());
    await user.click(within(dialog).getByRole('button', { name: 'Prüfen' }));
    await within(dialog).findByText(/Ausgaben bereit/);
    expect(writeRpcs()).toEqual([]);

    await user.click(within(dialog).getByRole('button', { name: 'Import bestätigen' }));

    await waitFor(() => expect(writeRpcs()).toHaveLength(1));
    // No per-row loop: one call carries the whole batch.
    const payload = writeRpcs()[0].args.p_payload as { expenses: unknown[]; business_entity_id: string };
    expect(payload.expenses).toHaveLength(3);
    expect(payload.business_entity_id).toBe('e1');
    // No client-derived totals are sent; the server recomputes them.
    expect(JSON.stringify(payload)).not.toContain('gross_total_cents');
    expect(JSON.stringify(payload)).not.toContain('organization_id');
  });

  it('CANCELLING writes nothing', async () => {
    const user = userEvent.setup();
    renderPage();
    const dialog = await openImport(user);
    await paste(user, dialog, expenseImportTemplate());
    await user.click(within(dialog).getByRole('button', { name: 'Prüfen' }));
    await within(dialog).findByText(/Ausgaben bereit/);

    await user.click(within(dialog).getByRole('button', { name: 'Zurück' }));
    await within(dialog).findByRole('button', { name: 'Prüfen' });
    await user.click(within(dialog).getByRole('button', { name: 'Abbrechen' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(writeRpcs()).toEqual([]);
  });

  it('never reaches an email, an automation job or a per-row create', async () => {
    const user = userEvent.setup();
    renderPage();
    const dialog = await openImport(user);
    await paste(user, dialog, expenseImportTemplate());
    await user.click(within(dialog).getByRole('button', { name: 'Prüfen' }));
    await within(dialog).findByText(/Ausgaben bereit/);
    await user.click(within(dialog).getByRole('button', { name: 'Import bestätigen' }));
    await waitFor(() => expect(writeRpcs()).toHaveLength(1));

    // createOwnerExpense / recordExpensePayment are mocked to THROW; reaching either would
    // fail the test rather than quietly importing row by row.
    const names = importRpcs().map((c) => c.fn);
    expect(names).toEqual(['owner_resolve_import_vendors', 'owner_bulk_import_expenses']);
    expect(calls.some((c) => /email|automation|offer|invoice/.test(c.fn))).toBe(false);
  });

  it('offers a documented example that previews cleanly', async () => {
    const user = userEvent.setup();
    renderPage();
    const dialog = await openImport(user);
    await user.click(within(dialog).getByRole('button', { name: 'Beispiel einfügen' }));
    await user.click(within(dialog).getByRole('button', { name: 'Prüfen' }));
    await within(dialog).findByText(/Ausgaben bereit/);
    expect(within(dialog).getByRole('button', { name: 'Import bestätigen' })).toBeEnabled();
  });
});

/* ------------------------------------------ supplier-document duplicate protection */

describe('a supplier document the books already hold', () => {
  it('is asked about, refused, and makes confirmation impossible', async () => {
    // The reported defect: the same supplier invoice under a fresh client_import_id. The
    // vendor is KNOWN here (otherwise there is nothing booked to collide with) and the
    // server reports one existing expense for it.
    server.knownVendorId = 'v-openai';
    server.documentMatches = 1;

    const user = userEvent.setup();
    renderPage();
    const dialog = await openImport(user);
    await paste(user, dialog, expenseImportTemplate());
    await user.click(within(dialog).getByRole('button', { name: 'Prüfen' }));

    // Every row of the template is the same already-booked supplier, so all three block.
    expect(await within(dialog).findAllByText(/bereits erfasst/)).toHaveLength(3);
    expect(within(dialog).getByRole('button', { name: 'Import nicht möglich' })).toBeDisabled();
    // The probe ran, and the preview still wrote nothing.
    expect(calls.some((c) => c.fn === 'owner_check_expense_documents')).toBe(true);
    expect(writeRpcs()).toEqual([]);
  });

  it('is checked with the resolved vendor and the trimmed document number', async () => {
    server.knownVendorId = 'v-openai';
    server.documentMatches = 0;

    const user = userEvent.setup();
    renderPage();
    const dialog = await openImport(user);
    await paste(user, dialog, expenseImportTemplate());
    await user.click(within(dialog).getByRole('button', { name: 'Prüfen' }));
    await within(dialog).findByText(/Ausgaben bereit/);

    const probe = calls.find((c) => c.fn === 'owner_check_expense_documents');
    expect(probe).toBeDefined();
    const documents = probe!.args.p_documents as Array<Record<string, string>>;
    // Every row of the template carries a supplier invoice number, so every row is probed.
    expect(documents).toHaveLength(3);
    expect(documents.every((d) => d.vendor_id === 'v-openai')).toBe(true);
    expect(documents.map((d) => d.supplier_invoice_number))
      .toEqual(['RE-2026-4711', 'INV-9F2A1C', 'DE-INV-2026-88213']);
    // Nothing was blocked, so the import remains available.
    expect(within(dialog).getByRole('button', { name: 'Import bestätigen' })).toBeEnabled();
  });

  it('is NOT probed when the vendor does not exist yet — nothing can be booked against it', async () => {
    const user = userEvent.setup();
    renderPage();
    const dialog = await openImport(user);
    await paste(user, dialog, expenseImportTemplate());
    await user.click(within(dialog).getByRole('button', { name: 'Prüfen' }));
    await within(dialog).findByText(/Ausgaben bereit/);
    expect(calls.some((c) => c.fn === 'owner_check_expense_documents')).toBe(false);
  });

  it('treats a failed duplicate check as an ERROR, never as "no duplicates"', async () => {
    // A preview that could not check for duplicates must not read like one that found none.
    server.knownVendorId = 'v-openai';
    server.probeFails = true;

    const user = userEvent.setup();
    renderPage();
    const dialog = await openImport(user);
    await paste(user, dialog, expenseImportTemplate());
    await user.click(within(dialog).getByRole('button', { name: 'Prüfen' }));

    await within(dialog).findByText(/Dublettenprüfung fehlgeschlagen/);
    expect(within(dialog).getByRole('button', { name: 'Import nicht möglich' })).toBeDisabled();
    expect(writeRpcs()).toEqual([]);
  });
});
