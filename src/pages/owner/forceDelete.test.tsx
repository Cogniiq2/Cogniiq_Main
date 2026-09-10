import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import type { OwnerInvoice } from '@/lib/ownerFinance/types';

/**
 * The two tiers of permanent deletion, and which one the Papierkorb offers for which record.
 *
 * The defect underneath all of this: `owner_workspace_delete_items` hard-deletes any record whose
 * DELETE preflight says `hard_delete` instead of trashing it, while `owner_workspace_purge_items`
 * proceeded only where that same preflight still said `hard_delete`. Mutually exclusive — no row
 * that reached the trash could ever be purged, and the UI hid the button on every one of them.
 *
 * The fix is not "let everything be deleted". Purge ELIGIBILITY is a separate question, asked of
 * the record as it is now: did this ever become accounting-relevant? These tests pin that the two
 * answers lead to two visibly different actions, and that the heavy one stays heavy.
 */

vi.stubEnv('VITE_SUPABASE_URL', 'https://force-delete-test.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

const ENTITY = { id: 'e1', display_name: 'Cogniiq' };

const invoice = (over: Partial<OwnerInvoice>): OwnerInvoice => ({
  id: 'i1',
  business_entity_id: 'e1',
  organization_id: null,
  client_account_id: null,
  owner_customer_id: null,
  engagement_id: null,
  invoice_number: null,
  status: 'draft',
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
  issued_at: null,
  archived_at: null,
  cancelled_at: null,
  cancelled_by: null,
  cancellation_reason: null,
  created_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z',
  ...over,
});

/** Never issued, no number, no payment: category 1. The ordinary purge may destroy it. */
const DRAFT = invoice({ id: 'draft-1', status: 'draft' });
/** Issued and paid: accounting evidence. Only the emergency path may touch it. */
const PAID = invoice({
  id: 'paid-1', invoice_number: 'RE-2026-0100', status: 'paid',
  amount_paid_cents: 119000, issued_at: '2026-03-01T00:00:00Z',
});

const INVOICES = [DRAFT, PAID];

const purgeCalls: Record<string, unknown>[] = [];
const forceCalls: Record<string, unknown>[] = [];

type RpcReply = Promise<{ data: unknown; error: { message: string } | null }>;

const rpcImpl = async (fn: string, args: Record<string, unknown>): RpcReply => {
  switch (fn) {
    case 'owner_workspace_state':
      // Both invoices are already in the Papierkorb — step one has happened for each.
      return {
        data: {
          folders: [],
          items: INVOICES.map((i) => ({
            resource_id: i.id, folder_id: null, trashed_at: '2026-03-02T00:00:00Z',
          })),
        },
        error: null,
      };

    // The DELETE preflight, mirrored from the migration. Note that NEITHER answer is
    // `hard_delete` — that is precisely why the Papierkorb may not consult it.
    case 'owner_workspace_delete_preflight':
      return {
        data: (args.p_resource_ids as string[]).map((id) => ({
          resource_id: id, action: 'trash_only', reasons: [], dependencies: {},
        })),
        error: null,
      };

    case 'owner_workspace_purge_preflight':
      return {
        data: (args.p_resource_ids as string[]).map((id) => (id === DRAFT.id
          ? {
            resource_id: id, eligibility: 'purgeable', reasons: [], label: 'Entwurf',
            manifest: { owner_invoices: 1, owner_invoice_lines: 2 },
          }
          : {
            resource_id: id, eligibility: 'accounting_protected', label: PAID.invoice_number,
            reasons: ['invoice_number_allocated', 'issued', 'money_received'],
            manifest: { owner_invoices: 1, owner_payments: 2 },
          })),
        error: null,
      };

    case 'owner_workspace_purge_items':
      purgeCalls.push(args);
      return {
        data: (args.p_resource_ids as string[]).map((id) => ({
          resource_id: id, action: 'purge', outcome: 'hard_deleted', reasons: [], error: null,
        })),
        error: null,
      };

    case 'owner_force_delete_preview':
      return {
        data: {
          resource_id: args.p_resource_id, found: true, label: PAID.invoice_number,
          summary: { label: PAID.invoice_number, status: 'paid' },
          manifest: { owner_invoices: 1, owner_payments: 2, _storage_objects: 1 },
        },
        error: null,
      };

    case 'owner_force_purge_items':
      forceCalls.push(args);
      return {
        data: (args.p_resource_ids as string[]).map((id) => ({
          resource_id: id, action: 'force_delete', outcome: 'hard_deleted', reasons: [], error: null,
        })),
        error: null,
      };

    default:
      return { data: null, error: null };
  }
};

const rpc = vi.fn(rpcImpl);

vi.mock('@/lib/supabase', () => ({
  supabase: { rpc, from: () => { throw new Error('no direct table access'); } },
}));

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
const { FORCE_DELETE_PHRASE } = await import('@/lib/ownerFinance/workspaceOrganization');

function renderTrash() {
  return render(
    <MemoryRouter initialEntries={['/admin/finance/invoices?folder=trash']}>
      <ToastProvider>
        <InvoicesPage />
      </ToastProvider>
    </MemoryRouter>,
  );
}

/** Rows render twice (desktop table + mobile cards), so the first trigger is taken. */
async function clickFirst(user: ReturnType<typeof userEvent.setup>, name: string) {
  const buttons = await screen.findAllByRole('button', { name });
  await user.click(buttons[0]);
  return screen.findByRole('dialog');
}

beforeEach(() => {
  rpc.mockClear();
  rpc.mockImplementation(rpcImpl);
  purgeCalls.length = 0;
  forceCalls.length = 0;
});

describe('the Papierkorb decides from purge eligibility', () => {
  it('offers the ordinary permanent delete to a never-issued draft', async () => {
    renderTrash();
    await screen.findAllByText(/RE-2026-0100/);

    // Present for the draft. It was never gated on the DELETE preflight, which says trash_only
    // for both rows and would therefore have hidden this button on both.
    expect((await screen.findAllByRole('button', { name: 'Endgültig löschen' })).length)
      .toBeGreaterThan(0);
  });

  it('offers only the emergency path for an issued, paid invoice, and says why', async () => {
    renderTrash();
    await screen.findAllByText(/RE-2026-0100/);

    expect((await screen.findAllByRole('button', { name: 'Notfall-Löschung' })).length)
      .toBeGreaterThan(0);
    // The refusal is explained rather than asserted: the owner sees what made it evidence.
    expect((await screen.findAllByText(/Buchhaltungsrelevant/)).length).toBeGreaterThan(0);
  });
});

describe('tier 1 — the ordinary purge', () => {
  it('lists what disappears and needs no typed phrase', async () => {
    const user = userEvent.setup();
    renderTrash();
    await screen.findAllByText(/RE-2026-0100/);

    const dialog = await clickFirst(user, 'Endgültig löschen');

    expect(within(dialog).getByText('1 × Rechnung')).toBeInTheDocument();
    expect(within(dialog).getByText('2 × Rechnungsposition')).toBeInTheDocument();
    // It states WHY it is allowed to be this easy.
    expect(dialog.textContent).toMatch(/nie buchhaltungsrelevant/);
    // No ceremony: a draft delete must not train the owner to type through a phrase field.
    expect(within(dialog).queryByLabelText(/Bestätigung/)).not.toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Endgültig löschen' })).toBeEnabled();
  });

  it('calls the purge RPC, not the emergency one', async () => {
    const user = userEvent.setup();
    renderTrash();
    await screen.findAllByText(/RE-2026-0100/);

    const dialog = await clickFirst(user, 'Endgültig löschen');
    await user.click(within(dialog).getByRole('button', { name: 'Endgültig löschen' }));

    await waitFor(() => expect(purgeCalls).toHaveLength(1));
    expect(purgeCalls[0]).toMatchObject({
      p_entity: ENTITY.id, p_scope: 'invoice', p_resource_ids: [DRAFT.id],
    });
    expect(forceCalls).toHaveLength(0);
    await waitFor(() => expect(screen.getByText('Endgültig gelöscht')).toBeInTheDocument());
  });
});

describe('tier 2 — the emergency purge', () => {
  it('stays disabled until BOTH the reason and the exact phrase are given', async () => {
    const user = userEvent.setup();
    renderTrash();
    await screen.findAllByText(/RE-2026-0100/);

    const dialog = await clickFirst(user, 'Notfall-Löschung');
    await within(dialog).findByText('1 × Rechnung');
    const confirm = within(dialog).getByRole('button', { name: 'Endgültig löschen' });

    expect(confirm).toBeDisabled();

    await user.type(within(dialog).getByLabelText(/Grund/), 'Testdatensatz');
    expect(confirm).toBeDisabled();

    const phraseField = within(dialog).getByLabelText(/Bestätigung/);
    await user.type(phraseField, 'endgültig löschen');
    expect(confirm).toBeDisabled();

    await user.clear(phraseField);
    await user.type(phraseField, FORCE_DELETE_PHRASE);
    await waitFor(() => expect(confirm).toBeEnabled());

    expect(forceCalls).toHaveLength(0);
  });

  it('shows the Storage files in the manifest and sends phrase and reason', async () => {
    const user = userEvent.setup();
    renderTrash();
    await screen.findAllByText(/RE-2026-0100/);

    const dialog = await clickFirst(user, 'Notfall-Löschung');
    await within(dialog).findByText('1 × Rechnung');
    // Files are part of "what disappears" and are named as such, not left implicit.
    expect(within(dialog).getByText('1 × Datei im Dateispeicher')).toBeInTheDocument();
    expect(dialog.textContent).toMatch(/nicht umkehrbar/);

    await user.type(within(dialog).getByLabelText(/Grund/), 'Testdatensatz');
    await user.type(within(dialog).getByLabelText(/Bestätigung/), FORCE_DELETE_PHRASE);
    await user.click(within(dialog).getByRole('button', { name: 'Endgültig löschen' }));

    await waitFor(() => expect(forceCalls).toHaveLength(1));
    expect(forceCalls[0]).toMatchObject({
      p_entity: ENTITY.id, p_scope: 'invoice', p_resource_ids: [PAID.id],
      p_reason: 'Testdatensatz', p_confirmation: FORCE_DELETE_PHRASE,
    });
    expect(purgeCalls).toHaveLength(0);
  });

  it('reports a server refusal in the dialog and leaves the record alone', async () => {
    const user = userEvent.setup();
    rpc.mockImplementation(async (fn: string, args: Record<string, unknown>) => {
      if (fn === 'owner_force_purge_items') {
        forceCalls.push(args);
        return { data: null, error: { message: 'force_delete_reason_required' } };
      }
      return rpcImpl(fn, args);
    });

    renderTrash();
    await screen.findAllByText(/RE-2026-0100/);

    const dialog = await clickFirst(user, 'Notfall-Löschung');
    await within(dialog).findByText('1 × Rechnung');
    await user.type(within(dialog).getByLabelText(/Grund/), 'Testdatensatz');
    await user.type(within(dialog).getByLabelText(/Bestätigung/), FORCE_DELETE_PHRASE);
    await user.click(within(dialog).getByRole('button', { name: 'Endgültig löschen' }));

    // Actionable German, never a SQLSTATE, and the dialog stays open.
    expect(await within(dialog).findByText('Bitte geben Sie einen Grund an.')).toBeInTheDocument();
    expect(screen.queryByText('Endgültig gelöscht')).not.toBeInTheDocument();
  });
});
