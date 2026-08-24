// ─────────────────────────────────────────────────────────────────────────────
// Every destructive operation in the admin dashboard must go through a named,
// owner-gated SECURITY DEFINER RPC — never a direct table DELETE from the
// browser and never a service-role key.
//
// These tests pin the wiring: which RPC each wrapper calls, and with which
// argument names. A rename on either side breaks here instead of failing
// silently at runtime against a database that no longer has the function.
// ─────────────────────────────────────────────────────────────────────────────
import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn(async () => ({ data: null, error: null }));
const from = vi.fn(() => { throw new Error('destructive paths must not touch tables directly'); });

vi.mock('@/lib/supabase', () => ({ supabase: { rpc, from } }));

const customersApi = await import('@/lib/ownerFinance/customersApi');
const api = await import('@/lib/ownerFinance/api');

beforeEach(() => { rpc.mockClear(); rpc.mockResolvedValue({ data: null, error: null } as never); });

describe('destructive operations call owner-gated RPCs', () => {
  it.each([
    ['deleteCustomer', () => customersApi.deleteCustomer('c1'), 'owner_delete_customer', { p_customer_id: 'c1' }],
    ['archiveCustomer', () => customersApi.archiveCustomer('c1'), 'owner_archive_customer', { p_customer_id: 'c1' }],
    ['unarchiveCustomer', () => customersApi.unarchiveCustomer('c1'), 'owner_unarchive_customer', { p_customer_id: 'c1' }],
    ['loadDeleteBlockers', () => customersApi.loadDeleteBlockers('c1'), 'owner_customer_delete_blockers', { p_customer_id: 'c1' }],
    ['deleteDraftInvoice', () => api.deleteDraftInvoice('i1'), 'delete_owner_draft_invoice', { p_invoice_id: 'i1' }],
    ['deleteDraftExpense', () => api.deleteDraftExpense('e1'), 'delete_owner_draft_expense', { p_expense_id: 'e1' }],
  ])('%s → %s', async (_label, call, fnName, args) => {
    await call();
    expect(rpc).toHaveBeenCalledWith(fnName, args);
    expect(from).not.toHaveBeenCalled();
  });

  it('cancelInvoice passes the reason and never deletes', async () => {
    await customersApi.cancelInvoice('i1', 'Doppelt erfasst');
    expect(rpc).toHaveBeenCalledWith('owner_cancel_invoice', { p_invoice_id: 'i1', p_reason: 'Doppelt erfasst' });
  });

  it('linkInvoiceCustomer targets the canonical column, not the tenant', async () => {
    await customersApi.linkInvoiceCustomer('i1', 'c1');
    expect(rpc).toHaveBeenCalledWith('owner_link_invoice_customer', { p_invoice_id: 'i1', p_owner_customer_id: 'c1' });
  });

  it('surfaces a server refusal instead of reporting success', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'kann nicht gelöscht werden' } } as never);
    const res = await customersApi.deleteCustomer('c1');
    expect(res.deleted).toBe(false);
    expect(res.error).toMatch(/kann nicht gelöscht werden/);
  });

  it('treats a missing deleted flag as failure, never as success', async () => {
    rpc.mockResolvedValue({ data: {}, error: null } as never);
    expect((await customersApi.deleteCustomer('c1')).deleted).toBe(false);
  });
});
