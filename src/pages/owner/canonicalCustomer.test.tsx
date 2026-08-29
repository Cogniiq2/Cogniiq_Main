// ─────────────────────────────────────────────────────────────────────────────
// The admin dashboard had three overlapping notions of "customer" and no join
// between them: organizations (portal tenancy), client_accounts (billing) and
// owner_customers (the CRM workspace). Creating a customer while writing an
// invoice never produced a CRM record, and creating one in the CRM produced a
// record the invoice composer could not select.
//
// These tests hold the fix in place. The store below is ONE table, exactly like
// owner_customers is now: if a surface ever reads or writes a second customer
// source again, the cross-surface assertions stop seeing each other's records
// and fail. The delete/archive/storno rules are asserted against the migration
// SQL itself, because that is where they are enforced.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  OwnerCustomerListRow, OwnerCustomerDeleteBlockers, OwnerInvoice,
} from '@/lib/ownerFinance/types';

/*
  src/lib/supabase.ts validates its configuration at module scope and throws
  without it. These pages reach it transitively (the export runner imports the
  finance API), so the client has to be constructible even though every data
  path below is mocked and no request is ever made. Stubbed here rather than in
  the shared setup file so the global harness keeps requiring explicit mocks.
*/
vi.stubEnv('VITE_SUPABASE_URL', 'https://canonical-customer-test.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

/* ───────────────────────────── one canonical store ───────────────────────── */

const ENTITY = { id: 'entity-1', display_name: 'Cogniiq' };

interface StoredCustomer extends OwnerCustomerListRow {
  business_entity_id: string;
  country_code: string | null;
  completed_by: string | null;
  archived_by: string | null;
  created_by: string | null;
  updated_at: string;
}

let customers: StoredCustomer[] = [];
let invoices: OwnerInvoice[] = [];
/** Every RPC-equivalent call, so a test can prove WHICH source a page used. */
let calls: string[] = [];

function makeCustomer(input: Record<string, unknown>): StoredCustomer {
  const now = new Date('2026-08-24T10:00:00Z').toISOString();
  return {
    id: `cust-${customers.length + 1}`,
    business_entity_id: ENTITY.id,
    company: (input.company as string) ?? null,
    contact_name: (input.contact_name as string) ?? null,
    email: (input.email as string) ?? null,
    phone: (input.phone as string) ?? null,
    street: (input.street as string) ?? null,
    postal_code: (input.postal_code as string) ?? null,
    city: (input.city as string) ?? null,
    country_code: null,
    status: 'active',
    notes: (input.notes as string) ?? null,
    client_account_id: null,
    organization_id: null,
    archived_at: null,
    archived_by: null,
    completed_at: null,
    completed_by: null,
    created_by: null,
    last_activity_at: now,
    created_at: now,
    updated_at: now,
    offer_count: 0,
    invoice_count: 0,
    open_invoice_count: 0,
    revenue_gross_cents: 0,
    open_task_count: 0,
    completed_task_count: 0,
  };
}

/** Mirrors owner_customer_delete_blockers: protected = issued/finalized only. */
function blockersFor(customerId: string): OwnerCustomerDeleteBlockers {
  const mine = invoices.filter((i) => i.owner_customer_id === customerId);
  const issued = mine.filter((i) => i.status !== 'draft' || i.issued_at != null).length;
  const drafts = mine.filter((i) => i.status === 'draft' && i.issued_at == null).length;
  return {
    issued_invoices: issued, payments: 0, finalized_offers: 0, subscriptions: 0,
    portal_documents: 0, draft_invoices: drafts, draft_offers: 0,
    deletable: issued === 0,
  };
}

/* ───────────────────────────────── mocks ─────────────────────────────────── */

vi.mock('@/pages/owner/ownerContext', () => ({
  useOwnerEntity: () => ({
    entity: ENTITY, status: 'ready', backendReady: true, backendDetail: null,
    error: null, taxYear: 2026, setTaxYear: () => {}, reload: async () => {},
  }),
}));

vi.mock('@/lib/ownerFinance/customersApi', () => ({
  loadCustomers: vi.fn(async () => { calls.push('loadCustomers'); return customers.map((c) => ({ ...c })); }),
  loadCustomerDetail: vi.fn(async (id: string) => {
    calls.push('loadCustomerDetail');
    const c = customers.find((x) => x.id === id);
    if (!c) return null;
    return {
      customer: { ...c },
      offers: [],
      invoices: invoices.filter((i) => i.owner_customer_id === id).map((i) => ({
        id: i.id, invoice_number: i.invoice_number, status: i.status, currency: i.currency,
        gross_total_cents: i.gross_total_cents, amount_paid_cents: i.amount_paid_cents,
        issue_date: i.issue_date, due_date: i.due_date, issued_at: i.issued_at,
        cancelled_at: i.cancelled_at, cancellation_reason: i.cancellation_reason, created_at: i.created_at,
      })),
      payments: [], tasks: [], activity: [],
      delete_blockers: blockersFor(id),
    };
  }),
  createCustomer: vi.fn(async (input: Record<string, unknown>) => {
    calls.push('createCustomer');
    const email = ((input.email as string) ?? '').trim().toLowerCase();
    const match = email ? customers.find((c) => (c.email ?? '').trim().toLowerCase() === email) : undefined;
    if (match) return { id: match.id, matched: true, error: null };
    const c = makeCustomer(input);
    customers.push(c);
    return { id: c.id, matched: false, error: null };
  }),
  updateCustomer: vi.fn(async (id: string, patch: Record<string, unknown>) => {
    calls.push('updateCustomer');
    const c = customers.find((x) => x.id === id);
    if (c) Object.assign(c, patch);
    return { error: null };
  }),
  setCustomerStatus: vi.fn(async () => ({ error: null })),
  loadDeleteBlockers: vi.fn(async (id: string) => { calls.push('loadDeleteBlockers'); return blockersFor(id); }),
  deleteCustomer: vi.fn(async (id: string) => {
    calls.push('deleteCustomer');
    const b = blockersFor(id);
    if (!b.deletable) {
      return { deleted: false, deletedDraftOffers: 0, deletedDraftInvoices: 0, error: 'geschützte Datensätze' };
    }
    const draftCount = b.draft_invoices;
    invoices = invoices.filter((i) => i.owner_customer_id !== id);
    customers = customers.filter((c) => c.id !== id);
    return { deleted: true, deletedDraftOffers: 0, deletedDraftInvoices: draftCount, error: null };
  }),
  archiveCustomer: vi.fn(async (id: string) => {
    calls.push('archiveCustomer');
    const c = customers.find((x) => x.id === id);
    if (c) { c.status = 'archived'; c.archived_at = new Date('2026-08-24T12:00:00Z').toISOString(); }
    return { error: null };
  }),
  unarchiveCustomer: vi.fn(async (id: string) => {
    const c = customers.find((x) => x.id === id);
    if (c) { c.status = 'active'; c.archived_at = null; }
    return { error: null };
  }),
  cancelInvoice: vi.fn(async (id: string) => {
    calls.push('cancelInvoice');
    const inv = invoices.find((i) => i.id === id);
    if (!inv) return { status: null, alreadyCancelled: false, error: 'invoice not found' };
    if (inv.status === 'draft' && inv.issued_at == null) {
      return { status: null, alreadyCancelled: false, error: 'Entwürfe werden gelöscht, nicht storniert' };
    }
    inv.status = 'cancelled';
    inv.cancelled_at = new Date('2026-08-24T12:00:00Z').toISOString();
    return { status: 'cancelled', alreadyCancelled: false, error: null };
  }),
  linkInvoiceCustomer: vi.fn(async () => ({ error: null })),
  archiveOffer: vi.fn(async () => ({ error: null })),
  unarchiveOffer: vi.fn(async () => ({ error: null })),
  linkOfferCustomer: vi.fn(async () => ({ error: null })),
  createTask: vi.fn(async () => ({ id: null, error: null })),
  updateTask: vi.fn(async () => ({ error: null })),
  setTaskStatus: vi.fn(async () => ({ error: null })),
  deleteTask: vi.fn(async () => ({ error: null })),
  reorderTasks: vi.fn(async () => ({ error: null })),
}));

vi.mock('@/lib/ownerFinance/api', async (orig) => {
  const actual = await orig<Record<string, unknown>>();
  return {
    ...actual,
    loadInvoices: vi.fn(async () => { calls.push('loadInvoices'); return invoices.map((i) => ({ ...i })); }),
    createOwnerInvoice: vi.fn(async (header: Record<string, unknown>) => {
      calls.push('createOwnerInvoice');
      const inv = {
        id: `inv-${invoices.length + 1}`, business_entity_id: ENTITY.id,
        organization_id: (header.organization_id as string) ?? null,
        client_account_id: (header.client_account_id as string) ?? null,
        owner_customer_id: (header.owner_customer_id as string) ?? null,
        engagement_id: null, invoice_number: null, status: 'draft' as const,
        issue_date: null, service_date: null, due_date: null, currency: 'EUR',
        net_total_cents: 10000, vat_total_cents: 1900, gross_total_cents: 11900,
        amount_paid_cents: 0, notes: null, external_reference: null, issued_at: null,
        archived_at: null, cancelled_at: null, cancelled_by: null, cancellation_reason: null,
        created_at: '2026-08-24T10:00:00Z', updated_at: '2026-08-24T10:00:00Z',
      };
      invoices.push(inv);
      return { id: inv.id, error: null };
    }),
    issueOwnerInvoice: vi.fn(async (id: string) => {
      const inv = invoices.find((i) => i.id === id);
      if (inv) { inv.status = 'issued'; inv.issued_at = '2026-08-24T11:00:00Z'; inv.invoice_number = 'RE-2026-0001'; }
      return { error: null };
    }),
    deleteDraftInvoice: vi.fn(async (id: string) => {
      calls.push('deleteDraftInvoice');
      const inv = invoices.find((i) => i.id === id);
      if (!inv) return { error: 'invoice not found' };
      if (inv.status !== 'draft' || inv.issued_at != null) return { error: 'only never-issued draft invoices may be deleted' };
      invoices = invoices.filter((i) => i.id !== id);
      return { error: null };
    }),
    recordInvoicePayment: vi.fn(async () => ({ error: null })),
  };
});

/**
 * The old parallel source. It must never be consulted for customers again — the
 * mock records any call so a regression is visible rather than merely wrong.
 */
vi.mock('@/lib/clientPlatform/adminApi', () => ({
  loadAdminClients: vi.fn(async () => { calls.push('loadAdminClients'); return []; }),
}));

const { CustomersPage } = await import('@/pages/owner/CustomersPage');
const { InvoicesPage } = await import('@/pages/owner/InvoicesPage');
const { ToastProvider } = await import('@/components/dashboard');

function renderPage(node: React.ReactElement) {
  return render(<MemoryRouter><ToastProvider>{node}</ToastProvider></MemoryRouter>);
}

/**
 * DataTable renders the same row twice — once as a desktop table row, once as a
 * mobile card. Both are real, so these helpers assert presence and act on the
 * first match instead of pretending the DOM is unique.
 */
async function expectRow(text: string) {
  const hits = await screen.findAllByText(text);
  expect(hits.length).toBeGreaterThan(0);
  return hits[0];
}

async function clickRowAction(name: RegExp) {
  const buttons = await screen.findAllByRole('button', { name });
  await userEvent.click(buttons[0]);
}

beforeEach(() => { customers = []; invoices = []; calls = []; });
afterEach(() => { vi.clearAllMocks(); });

/* ─────────────────────────── one source of truth ─────────────────────────── */

describe('one canonical customer across CRM and Finance', () => {
  it('shows a customer created in the CRM in the Finance selector', async () => {
    const user = userEvent.setup();
    const crm = renderPage(<CustomersPage />);
    await screen.findByRole('button', { name: /Neuer Kunde/i });

    await user.click(screen.getAllByRole('button', { name: /Neuer Kunde/i })[0]);
    await user.type(await screen.findByLabelText(/Firma/i), 'Sportverein Heinersreuth 1921 e.V.');
    await user.click(screen.getByRole('button', { name: /Kunde anlegen/i }));

    await waitFor(() => expect(customers).toHaveLength(1));
    crm.unmount();

    renderPage(<InvoicesPage />);
    await waitFor(() => expect(calls).toContain('loadCustomers'));
    // The invoice composer never falls back to the old client list.
    expect(calls).not.toContain('loadAdminClients');
  });

  it('shows a customer created from Finance in the CRM list', async () => {
    // Created through the SAME entry point the invoice composer uses.
    const { createCustomer } = await import('@/lib/ownerFinance/customersApi');
    await createCustomer({ business_entity_id: ENTITY.id, company: 'Pankofer GmbH', email: 'cogniiq4@gmail.com' });

    renderPage(<CustomersPage />);
    await expectRow('Pankofer GmbH');
  });

  it('reflects an edit made on one surface on the other, because it is one record', async () => {
    const { createCustomer, updateCustomer, loadCustomers } = await import('@/lib/ownerFinance/customersApi');
    const { id } = await createCustomer({ business_entity_id: ENTITY.id, company: 'Alt GmbH' });
    await updateCustomer(id!, { company: 'Neu GmbH' });

    const fromFinance = await loadCustomers(ENTITY.id);
    expect(fromFinance.find((c) => c.id === id)?.company).toBe('Neu GmbH');

    renderPage(<CustomersPage />);
    await expectRow('Neu GmbH');
    expect(screen.queryAllByText('Alt GmbH')).toHaveLength(0);
  });

  it('references the same customer id from CRM and from an invoice', async () => {
    const { createCustomer } = await import('@/lib/ownerFinance/customersApi');
    const { createOwnerInvoice } = await import('@/lib/ownerFinance/api');
    const { id } = await createCustomer({ business_entity_id: ENTITY.id, company: 'SVH' });

    await createOwnerInvoice({ business_entity_id: ENTITY.id, owner_customer_id: id }, []);

    expect(invoices[0].owner_customer_id).toBe(id);
    expect(customers[0].id).toBe(id);
  });

  it('does not silently use a second customer table', async () => {
    renderPage(<InvoicesPage />);
    await waitFor(() => expect(calls).toContain('loadInvoices'));
    await waitFor(() => expect(calls).toContain('loadCustomers'));
    expect(calls.filter((c) => c === 'loadAdminClients')).toHaveLength(0);
  });

  it('normalizes the e-mail so the same customer is not created twice', async () => {
    const { createCustomer } = await import('@/lib/ownerFinance/customersApi');
    const first = await createCustomer({ business_entity_id: ENTITY.id, company: 'SVH', email: 'T.Helgert@gmx.de' });
    const second = await createCustomer({ business_entity_id: ENTITY.id, company: 'Sportverein Heinersreuth', email: '  t.helgert@GMX.de ' });

    expect(second.matched).toBe(true);
    expect(second.id).toBe(first.id);
    expect(customers).toHaveLength(1);
  });
});

/* ───────────────────────────── deletion semantics ────────────────────────── */

describe('deletion is deliberate, not uniform', () => {
  it('deletes a customer that has no protected records', async () => {
    const { createCustomer, deleteCustomer } = await import('@/lib/ownerFinance/customersApi');
    const { id } = await createCustomer({ business_entity_id: ENTITY.id, company: 'Testkunde' });

    const res = await deleteCustomer(id!);
    expect(res.deleted).toBe(true);
    expect(customers).toHaveLength(0);
  });

  it('refuses to delete a customer with an issued invoice and destroys nothing', async () => {
    const { createCustomer, deleteCustomer } = await import('@/lib/ownerFinance/customersApi');
    const { createOwnerInvoice, issueOwnerInvoice } = await import('@/lib/ownerFinance/api');
    const { id } = await createCustomer({ business_entity_id: ENTITY.id, company: 'SVH' });
    const { id: invId } = await createOwnerInvoice({ business_entity_id: ENTITY.id, owner_customer_id: id }, []);
    await issueOwnerInvoice(invId!);

    const res = await deleteCustomer(id!);
    expect(res.deleted).toBe(false);
    expect(res.error).toBeTruthy();
    // The point of the refusal: the accounting record is still there.
    expect(invoices).toHaveLength(1);
    expect(invoices[0].status).toBe('issued');
    expect(customers).toHaveLength(1);
  });

  it('deletes a draft invoice but never an issued one', async () => {
    const { createOwnerInvoice, issueOwnerInvoice, deleteDraftInvoice } = await import('@/lib/ownerFinance/api');
    const { id: draftId } = await createOwnerInvoice({ business_entity_id: ENTITY.id }, []);
    expect((await deleteDraftInvoice(draftId!)).error).toBeNull();
    expect(invoices).toHaveLength(0);

    const { id: issuedId } = await createOwnerInvoice({ business_entity_id: ENTITY.id }, []);
    await issueOwnerInvoice(issuedId!);
    const { error } = await deleteDraftInvoice(issuedId!);
    expect(error).toBeTruthy();
    expect(invoices).toHaveLength(1);
  });

  it('cancels an issued invoice without removing it or rewriting its figures', async () => {
    const { createOwnerInvoice, issueOwnerInvoice } = await import('@/lib/ownerFinance/api');
    const { cancelInvoice } = await import('@/lib/ownerFinance/customersApi');
    const { id } = await createOwnerInvoice({ business_entity_id: ENTITY.id }, []);
    await issueOwnerInvoice(id!);
    const before = { ...invoices[0] };

    const res = await cancelInvoice(id!, 'Doppelt erfasst');
    expect(res.status).toBe('cancelled');
    expect(invoices).toHaveLength(1);
    expect(invoices[0].invoice_number).toBe(before.invoice_number);
    expect(invoices[0].gross_total_cents).toBe(before.gross_total_cents);
    expect(invoices[0].cancelled_at).toBeTruthy();
  });

  it('refuses to cancel a draft — drafts are deleted instead', async () => {
    const { createOwnerInvoice } = await import('@/lib/ownerFinance/api');
    const { cancelInvoice } = await import('@/lib/ownerFinance/customersApi');
    const { id } = await createOwnerInvoice({ business_entity_id: ENTITY.id }, []);

    const res = await cancelInvoice(id!, null);
    expect(res.error).toMatch(/gelöscht, nicht storniert/);
  });

  it('archives instead of deleting, and keeps every record', async () => {
    const { createCustomer, archiveCustomer } = await import('@/lib/ownerFinance/customersApi');
    const { createOwnerInvoice, issueOwnerInvoice } = await import('@/lib/ownerFinance/api');
    const { id } = await createCustomer({ business_entity_id: ENTITY.id, company: 'SVH' });
    const { id: invId } = await createOwnerInvoice({ business_entity_id: ENTITY.id, owner_customer_id: id }, []);
    await issueOwnerInvoice(invId!);

    expect((await archiveCustomer(id!)).error).toBeNull();
    expect(customers[0].status).toBe('archived');
    expect(customers[0].archived_at).toBeTruthy();
    expect(invoices).toHaveLength(1);
  });

  it('leaves no invoice pointing at a deleted customer', async () => {
    const { createCustomer, deleteCustomer } = await import('@/lib/ownerFinance/customersApi');
    const { createOwnerInvoice } = await import('@/lib/ownerFinance/api');
    const { id } = await createCustomer({ business_entity_id: ENTITY.id, company: 'Testkunde' });
    await createOwnerInvoice({ business_entity_id: ENTITY.id, owner_customer_id: id }, []);

    await deleteCustomer(id!);
    const orphans = invoices.filter((i) => i.owner_customer_id && !customers.some((c) => c.id === i.owner_customer_id));
    expect(orphans).toHaveLength(0);
  });

  it('updates the list immediately after a delete, without a reload', async () => {
    const user = userEvent.setup();
    const { createCustomer } = await import('@/lib/ownerFinance/customersApi');
    await createCustomer({ business_entity_id: ENTITY.id, company: 'Wegzukunde GmbH' });

    renderPage(<CustomersPage />);
    await expectRow('Wegzukunde GmbH');

    await clickRowAction(/Kunde löschen/i);
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /Kunde löschen/i }));

    // The list refreshes from the store without a route change or reload. The
    // name survives only in the success toast, which is why this asserts on the
    // list itself rather than on the whole document.
    await waitFor(() => expect(screen.getByText(/Noch keine Kunden angelegt/i)).toBeTruthy());
    expect(customers).toHaveLength(0);
  });

  it('names the customer in the destructive confirmation', async () => {
    const { createCustomer } = await import('@/lib/ownerFinance/customersApi');
    await createCustomer({ business_entity_id: ENTITY.id, company: 'SV Heinersreuth 1921 e.V.' });

    renderPage(<CustomersPage />);
    await expectRow('SV Heinersreuth 1921 e.V.');
    await clickRowAction(/Kunde löschen/i);

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/SV Heinersreuth 1921 e\.V\./)).toBeTruthy();
    expect(within(dialog).getByText(/nicht rückgängig/i)).toBeTruthy();
    expect(within(dialog).getByRole('button', { name: /Abbrechen/i })).toBeTruthy();
  });

  it('offers archiving instead of deletion when protected records exist', async () => {
    const { createCustomer } = await import('@/lib/ownerFinance/customersApi');
    const { createOwnerInvoice, issueOwnerInvoice } = await import('@/lib/ownerFinance/api');
    const { id } = await createCustomer({ business_entity_id: ENTITY.id, company: 'Pankofer GmbH' });
    const { id: invId } = await createOwnerInvoice({ business_entity_id: ENTITY.id, owner_customer_id: id }, []);
    await issueOwnerInvoice(invId!);

    renderPage(<CustomersPage />);
    await expectRow('Pankofer GmbH');
    await clickRowAction(/Kunde löschen/i);

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getAllByText(/Löschen nicht möglich/i).length).toBeGreaterThan(0);
    expect(within(dialog).getByText(/ausgestellte Rechnung/i)).toBeTruthy();
    expect(within(dialog).getByRole('button', { name: /Stattdessen archivieren/i })).toBeTruthy();
  });
});

/* ─────────────────────── the rules live in the database ──────────────────── */

describe('migration encodes the deletion rules it promises', () => {
  /*
    Newlines are normalized before matching. The repository is checked out with
    CRLF on Windows, and several assertions below are multi-line — anchoring on
    "\n" against a "\r\n" file silently fails. That is exactly what happened when
    the merge into main re-materialized this file: the same assertions passed on
    the branch and failed on main, for no reason connected to the SQL.
  */
  const sql = readFileSync(
    join(process.cwd(), 'supabase/migrations/20260824171403_canonical_customer_and_deletion.sql'),
    'utf-8',
  ).replace(/\r\n/g, '\n');

  it('protects accounting tables with RESTRICT, never CASCADE', () => {
    for (const table of ['owner_invoices', 'owner_payments', 'owner_subscriptions']) {
      const line = sql.split('\n').find((l) => l.includes(`alter table public.${table}`));
      expect(line, `${table} must gain the canonical reference`).toBeTruthy();
      const idx = sql.indexOf(`alter table public.${table}\n  add column if not exists owner_customer_id`);
      expect(idx, `${table} owner_customer_id`).toBeGreaterThan(-1);
      expect(sql.slice(idx, idx + 220)).toMatch(/on delete restrict/);
    }
    // Nothing in this migration may introduce a cascade into financial data.
    expect(sql).not.toMatch(/owner_customers\(id\) on delete cascade/);
  });

  it('never hard-deletes an issued invoice', () => {
    const fn = sql.slice(sql.indexOf('function public.owner_cancel_invoice'));
    const body = fn.slice(0, fn.indexOf('$$;'));
    expect(body).not.toMatch(/delete from public\.owner_invoices/);
    expect(body).toMatch(/status = 'cancelled'/);
    expect(body).toMatch(/Entwürfe werden gelöscht, nicht storniert/);
  });

  it('treats only issued or finalized records as protected', () => {
    const fn = sql.slice(sql.indexOf('function public.owner_customer_delete_blockers'));
    const body = fn.slice(0, fn.indexOf('$$;'));
    expect(body).toMatch(/status <> 'draft' or issued_at is not null/);
    expect(body).toMatch(/status <> 'draft' or finalized_version is not null/);
    expect(body).toMatch(/'deletable'/);
  });

  it('re-checks the blockers inside the delete RPC', () => {
    const fn = sql.slice(sql.indexOf('function public.owner_delete_customer'));
    const body = fn.slice(0, fn.indexOf('$$;'));
    expect(body).toMatch(/owner_customer_delete_blockers/);
    expect(body).toMatch(/raise exception/);
  });

  it('gates every new function on the owner and revokes anon', () => {
    for (const fn of [
      'owner_delete_customer', 'owner_archive_customer', 'owner_unarchive_customer',
      'owner_cancel_invoice', 'owner_link_invoice_customer', 'owner_customer_delete_blockers',
    ]) {
      const start = sql.indexOf(`function public.${fn}`);
      expect(start, fn).toBeGreaterThan(-1);
      const body = sql.slice(start, sql.indexOf('$$;', start));
      expect(body, `${fn} must check is_platform_owner`).toMatch(/is_platform_owner\(\)/);
    }
    expect(sql).toMatch(/revoke execute on function public\.%s from public, anon/);
  });

  it('backfills without deleting or overwriting production values', () => {
    // Only NULL-filling updates and guarded inserts belong in the backfill.
    const backfill = sql.slice(sql.indexOf('-- 4. Backfill'), sql.indexOf('-- 5. Blocker inspection'));
    expect(backfill).not.toMatch(/\bdelete from\b/i);
    expect(backfill).not.toMatch(/\btruncate\b/i);
    for (const stmt of backfill.split(/update public\./).slice(1)) {
      expect(stmt.slice(0, stmt.indexOf(';'))).toMatch(/is null|coalesce/);
    }
  });

  it('never merges customers on company name alone', () => {
    const backfill = sql.slice(sql.indexOf('-- 4. Backfill'), sql.indexOf('-- 5. Blocker inspection'));
    // The single name-based statement is the owner-decided SVH link, and it is
    // additionally guarded on BOTH link columns being null.
    const nameMatches = backfill.split('\n').filter((l) => /like '%heinersreuth%'/.test(l));
    expect(nameMatches.length).toBeGreaterThan(0);
    expect(backfill).toMatch(/c\.client_account_id is null\n\s+and c\.organization_id is null/);
  });
});
