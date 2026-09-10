import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import type { OwnerInvoice } from '@/lib/ownerFinance/types';

/**
 * The Papierkorb's way out, and what it is allowed to demand before taking it.
 *
 * The defect this pins: `owner_workspace_delete_items` hard-deletes anything the preflight calls
 * `hard_delete` instead of trashing it, while `owner_workspace_purge_items` proceeded ONLY where
 * the preflight still said `hard_delete`. The two conditions are mutually exclusive, so no record
 * that reached the Papierkorb could ever be purged and the UI hid the button on every row. The
 * Papierkorb had no exit at all.
 *
 * What replaces it is not "delete anything, anywhere". These tests pin the guards that make an
 * irreversible action acceptable — the manifest shown up front, the typed phrase, the mandatory
 * reason — because a fix that only removed the wall would be the worse bug.
 */

vi.stubEnv('VITE_SUPABASE_URL', 'https://force-delete-test.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

const ENTITY = { id: 'e1', display_name: 'Cogniiq' };

const PAID: OwnerInvoice = {
  id: 'paid-1',
  business_entity_id: 'e1',
  organization_id: null,
  client_account_id: null,
  owner_customer_id: null,
  engagement_id: null,
  invoice_number: 'RE-2026-0100',
  status: 'paid',
  issue_date: '2026-03-01',
  service_date: '2026-03-01',
  due_date: '2026-03-15',
  currency: 'EUR',
  net_total_cents: 100000,
  vat_total_cents: 19000,
  gross_total_cents: 119000,
  amount_paid_cents: 119000,
  notes: null,
  external_reference: null,
  issued_at: '2026-03-01T00:00:00Z',
  archived_at: null,
  cancelled_at: null,
  cancelled_by: null,
  cancellation_reason: null,
  created_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z',
};

/** Every force-purge call the page made, so the test can assert on the arguments, not just the effect. */
const forceCalls: Record<string, unknown>[] = [];

/** Explicitly typed: the error-path override below returns an error object, and an inferred
 *  `error: null` would make that assignment a type error rather than a test. */
type RpcReply = Promise<{ data: unknown; error: { message: string } | null }>;

const rpcImpl = async (fn: string, args: Record<string, unknown>): RpcReply => {
  switch (fn) {
    case 'owner_workspace_state':
      // The invoice is already in the Papierkorb — the first of the two steps has happened.
      return {
        data: {
          folders: [],
          items: [{ resource_id: PAID.id, folder_id: null, trashed_at: '2026-03-02T00:00:00Z' }],
        },
        error: null,
      };

    // A fully paid invoice: the ordinary preflight says trash_only and always will. This is
    // exactly the record the old purge could never touch.
    case 'owner_workspace_delete_preflight':
      return {
        data: (args.p_resource_ids as string[]).map((id) => ({
          resource_id: id,
          action: 'trash_only',
          reasons: ['fully_paid_invoice', 'invoice_number_retained'],
          dependencies: {},
        })),
        error: null,
      };

    case 'owner_force_delete_preview':
      return {
        data: {
          resource_id: args.p_resource_id,
          found: true,
          label: PAID.invoice_number,
          summary: { label: PAID.invoice_number, status: 'paid' },
          manifest: {
            owner_invoices: 1,
            owner_invoice_lines: 3,
            owner_payments: 2,
            owner_generated_documents: 1,
          },
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
  return { ...actual, loadInvoices: vi.fn(async () => [PAID]) };
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

/** Opens the force-delete dialog from the Papierkorb row. */
async function openForceDialog(user: ReturnType<typeof userEvent.setup>) {
  // The row renders twice (desktop table + mobile cards), so the first trigger is taken.
  const buttons = await screen.findAllByRole('button', { name: 'Endgültig löschen' });
  await user.click(buttons[0]);
  return screen.findByRole('dialog');
}

beforeEach(() => {
  rpc.mockClear();
  rpc.mockImplementation(rpcImpl);
  forceCalls.length = 0;
});

describe('a retained invoice sitting in the Papierkorb', () => {
  it('offers a real, permanent delete instead of a dead end', async () => {
    renderTrash();
    await screen.findAllByText(/RE-2026-0100/);

    // The old behaviour was: no button, only "muss erhalten bleiben".
    expect((await screen.findAllByRole('button', { name: 'Endgültig löschen' })).length).toBeGreaterThan(0);
  });

  it('states exactly what will be destroyed before anything is confirmed', async () => {
    const user = userEvent.setup();
    renderTrash();
    await screen.findAllByText(/RE-2026-0100/);

    const dialog = await openForceDialog(user);

    // The manifest, in full. A destruction confirmation may never summarise away a row count.
    expect(await within(dialog).findByText('1 × Rechnung')).toBeInTheDocument();
    expect(within(dialog).getByText('3 × Rechnungsposition')).toBeInTheDocument();
    expect(within(dialog).getByText('2 × Zahlung')).toBeInTheDocument();
    expect(within(dialog).getByText('1 × Erzeugtes PDF')).toBeInTheDocument();
    // And it is honest about being irreversible rather than calling it "entfernen".
    expect(dialog.textContent).toMatch(/nicht umkehrbar/);
    expect(within(dialog).getByText(/RE-2026-0100/)).toBeInTheDocument();
  });

  it('stays disabled until BOTH the reason and the exact phrase are given', async () => {
    const user = userEvent.setup();
    renderTrash();
    await screen.findAllByText(/RE-2026-0100/);

    const dialog = await openForceDialog(user);
    await within(dialog).findByText('1 × Rechnung');
    const confirm = within(dialog).getByRole('button', { name: 'Endgültig löschen' });

    expect(confirm).toBeDisabled();

    // A reason alone is not enough.
    await user.type(within(dialog).getByLabelText(/Grund/), 'Testdatensatz');
    expect(confirm).toBeDisabled();

    // Neither is a phrase that is merely close.
    const phraseField = within(dialog).getByLabelText(/Bestätigung/);
    await user.type(phraseField, 'endgültig löschen');
    expect(confirm).toBeDisabled();

    await user.clear(phraseField);
    await user.type(phraseField, FORCE_DELETE_PHRASE);
    await waitFor(() => expect(confirm).toBeEnabled());

    // Nothing was sent while the dialog was merely open.
    expect(forceCalls).toHaveLength(0);
  });

  it('sends the reason and the phrase to the server, and reports the deletion plainly', async () => {
    const user = userEvent.setup();
    renderTrash();
    await screen.findAllByText(/RE-2026-0100/);

    const dialog = await openForceDialog(user);
    await within(dialog).findByText('1 × Rechnung');
    await user.type(within(dialog).getByLabelText(/Grund/), 'Testdatensatz');
    await user.type(within(dialog).getByLabelText(/Bestätigung/), FORCE_DELETE_PHRASE);
    await user.click(within(dialog).getByRole('button', { name: 'Endgültig löschen' }));

    await waitFor(() => expect(forceCalls).toHaveLength(1));
    expect(forceCalls[0]).toMatchObject({
      p_entity: ENTITY.id,
      p_scope: 'invoice',
      p_resource_ids: [PAID.id],
      p_reason: 'Testdatensatz',
      p_confirmation: FORCE_DELETE_PHRASE,
    });

    // The toast says what happened, without softening it into "entfernt".
    await waitFor(() => expect(screen.getByText('Endgültig gelöscht')).toBeInTheDocument());
  });
});

describe('when the server refuses', () => {
  it('says why and leaves the record where it is', async () => {
    const user = userEvent.setup();
    rpc.mockImplementation(async (fn: string, args: Record<string, unknown>) => {
      if (fn === 'owner_force_purge_items') {
        forceCalls.push(args);
        return { data: null, error: { message: 'force_delete_requires_archived' } };
      }
      return rpcImpl(fn, args);
    });

    renderTrash();
    await screen.findAllByText(/RE-2026-0100/);

    const dialog = await openForceDialog(user);
    await within(dialog).findByText('1 × Rechnung');
    await user.type(within(dialog).getByLabelText(/Grund/), 'Testdatensatz');
    await user.type(within(dialog).getByLabelText(/Bestätigung/), FORCE_DELETE_PHRASE);
    await user.click(within(dialog).getByRole('button', { name: 'Endgültig löschen' }));

    // The dialog stays open with an actionable message; no SQLSTATE reaches the owner.
    expect(await within(dialog).findByText('Der Kunde muss zuerst archiviert werden.')).toBeInTheDocument();
    expect(screen.queryByText('Endgültig gelöscht')).not.toBeInTheDocument();
  });
});
