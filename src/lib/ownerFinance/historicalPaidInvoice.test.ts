// ─────────────────────────────────────────────────────────────────────────────
// "Bereits bezahlte Rechnung erfassen" — the historical already-paid entry path.
//
// The two properties that must never regress:
//   1. It is ONE owner-gated server RPC, not a client-side sequence, so a
//      settled past transaction can never land as an issued-but-unpaid invoice.
//   2. It cannot notify the customer. Every e-mail in this system originates
//      from an owner_automation_jobs row, and every enqueue function is keyed on
//      an OFFER — this path creates neither, and touches no table directly.
//
// Normal invoice creation, issuance, payment recording and numbering are
// re-pinned here too, so the new path cannot be built by quietly changing them.
// ─────────────────────────────────────────────────────────────────────────────
import { beforeEach, describe, expect, it, vi } from 'vitest';

type RpcArgs = Record<string, unknown>;
type RpcReply = { data: unknown; error: { code?: string; message: string } | null };

// Typed so the assertions below can read positional call arguments.
const rpc = vi.fn<(fn: string, args: RpcArgs) => Promise<RpcReply>>(async () => ({ data: null, error: null }));
const update = vi.fn(() => ({ eq: vi.fn(async () => ({ data: null, error: null })) }));
const from = vi.fn<(table: string) => unknown>(() => ({ update }));
const getUser = vi.fn(async () => ({ data: { user: { id: 'owner-1' } } }));

vi.mock('@/lib/supabase', () => ({ supabase: { rpc, from, auth: { getUser } } }));

const api = await import('@/lib/ownerFinance/api');

const HEADER = {
  business_entity_id: 'entity-1',
  owner_customer_id: 'cust-1',
  issue_date: '2026-02-15',
  service_date: '2026-02-10',
  currency: 'EUR',
  external_reference: '2026-014',
};
const LINES = [
  { description: 'Beratung', quantity_milli: 1000, unit_price_cents: 100000, vat_rate_bp: 1900, vat_treatment: 'standard', sort_order: 0 },
];
const PAYMENT = { payment_date: '2026-03-03', method: 'bank_transfer', reference: 'Kontoauszug 12', note: null };

const RESULT = {
  invoice_id: 'inv-1', invoice_number: 'RE-2026-0007', status: 'paid',
  payment_id: 'pay-1', amount_paid_cents: 119000, gross_total_cents: 119000,
};

beforeEach(() => {
  rpc.mockClear(); from.mockClear(); update.mockClear();
  rpc.mockResolvedValue({ data: RESULT, error: null } as never);
});

describe('recordHistoricalPaidInvoice — atomic, server-authoritative', () => {
  it('goes through one owner-gated RPC and never writes a table directly', async () => {
    await api.recordHistoricalPaidInvoice(HEADER, LINES, PAYMENT);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc.mock.calls[0][0]).toBe('record_owner_historical_paid_invoice');
    expect(from).not.toHaveBeenCalled();
  });

  it('does NOT compose create → issue → pay on the client', async () => {
    await api.recordHistoricalPaidInvoice(HEADER, LINES, PAYMENT);
    const called = rpc.mock.calls.map((c) => c[0]);
    // A three-call sequence is exactly the failure mode this feature removes: if
    // the payment call failed, a settled invoice would become an open receivable.
    expect(called).not.toContain('create_owner_invoice');
    expect(called).not.toContain('issue_owner_invoice');
    expect(called).not.toContain('record_owner_invoice_payment');
  });

  it('passes an idempotency key, the header, the lines and the payment', async () => {
    await api.recordHistoricalPaidInvoice(HEADER, LINES, PAYMENT);
    const args = rpc.mock.calls[0][1] as Record<string, unknown>;
    expect(args.p_header).toEqual(HEADER);
    expect(args.p_lines).toEqual(LINES);
    expect(args.p_payment).toEqual(PAYMENT);
    expect(String(args.p_idempotency_key)).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it('keeps the invoice date and the payment date as two separate facts', async () => {
    await api.recordHistoricalPaidInvoice(HEADER, LINES, PAYMENT);
    const args = rpc.mock.calls[0][1] as { p_header: Record<string, string>; p_payment: Record<string, string> };
    expect(args.p_header.issue_date).toBe('2026-02-15');
    expect(args.p_payment.payment_date).toBe('2026-03-03');
    // Neither is derived from the other.
    expect(args.p_payment.payment_date).not.toBe(args.p_header.issue_date);
  });

  it('preserves the VAT treatment of every position verbatim', async () => {
    const mixed = [
      { ...LINES[0], vat_treatment: 'standard', vat_rate_bp: 1900 },
      { description: 'Fachbuch', quantity_milli: 2000, unit_price_cents: 5000, vat_rate_bp: 700, vat_treatment: 'reduced', sort_order: 1 },
      { description: 'EU-Leistung', quantity_milli: 1000, unit_price_cents: 40000, vat_rate_bp: 0, vat_treatment: 'reverse_charge', sort_order: 2 },
    ];
    await api.recordHistoricalPaidInvoice(HEADER, mixed, PAYMENT);
    const args = rpc.mock.calls[0][1] as { p_lines: typeof mixed };
    expect(args.p_lines.map((l) => l.vat_treatment)).toEqual(['standard', 'reduced', 'reverse_charge']);
    expect(args.p_lines.map((l) => l.vat_rate_bp)).toEqual([1900, 700, 0]);
  });

  it('never sends a paid amount or an invoice number from the browser', async () => {
    await api.recordHistoricalPaidInvoice(HEADER, LINES, PAYMENT);
    const args = rpc.mock.calls[0][1] as { p_header: Record<string, unknown>; p_payment: Record<string, unknown> };
    // The server settles against its own trigger-computed gross and assigns the
    // canonical number from the per-entity counter.
    expect(args.p_payment).not.toHaveProperty('amount_cents');
    expect(args.p_header).not.toHaveProperty('invoice_number');
    // The owner's original document reference is non-authoritative metadata.
    expect(args.p_header.external_reference).toBe('2026-014');
  });

  it('returns a fully settled invoice: paid, full amount, zero open balance', async () => {
    const { result, error } = await api.recordHistoricalPaidInvoice(HEADER, LINES, PAYMENT);
    expect(error).toBeNull();
    expect(result?.status).toBe('paid');
    expect(result?.amount_paid_cents).toBe(result?.gross_total_cents);
    expect((result?.gross_total_cents ?? 0) - (result?.amount_paid_cents ?? 0)).toBe(0);
    expect(result?.invoice_number).toBe('RE-2026-0007');
  });

  it('surfaces a server refusal instead of reporting success', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'payment_date must not be before issue_date' } } as never);
    const { result, error, backendMissing } = await api.recordHistoricalPaidInvoice(HEADER, LINES, PAYMENT);
    expect(result).toBeNull();
    expect(error).toMatch(/payment_date/);
    expect(backendMissing).toBe(false);
  });

  it('reports an unapplied migration as a missing backend, not a bookkeeping error', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: 'PGRST202', message: 'Could not find the function' } } as never);
    const { backendMissing } = await api.recordHistoricalPaidInvoice(HEADER, LINES, PAYMENT);
    expect(backendMissing).toBe(true);
    expect(api.OWNER_HISTORICAL_INVOICE_MIGRATION).toBe('20260826120000_owner_historical_paid_invoice.sql');
  });
});

describe('a settled historical invoice carries no payment term', () => {
  it('leaves due_date to the server rather than inventing issue_date + 14', async () => {
    // The composer omits due_date in historical mode; the RPC coalesces it to the
    // invoice date, so an already-paid entry can never look overdue.
    await api.recordHistoricalPaidInvoice({ ...HEADER, due_date: null }, LINES, PAYMENT);
    const args = rpc.mock.calls[0][1] as { p_header: Record<string, unknown> };
    expect(args.p_header.due_date).toBeNull();
  });
});

describe('historical entry cannot reach a customer', () => {
  it('invokes no offer, automation-job, notification or e-mail RPC', async () => {
    await api.recordHistoricalPaidInvoice(HEADER, LINES, PAYMENT);
    const called = rpc.mock.calls.map((c) => String(c[0]));
    expect(called).toHaveLength(1);
    for (const name of called) {
      expect(name).not.toMatch(/email|mail|notify|notification|send|automation|offer|portal|publish/i);
    }
  });

  it('sends no offer id and no recipient address to the server', async () => {
    await api.recordHistoricalPaidInvoice(HEADER, LINES, PAYMENT);
    const payload = JSON.stringify(rpc.mock.calls[0][1]);
    // Every enqueue function in the schema is keyed on an offer; without one no
    // automation job — and therefore no message — can be produced.
    expect(payload).not.toMatch(/offer_id|recipient_email|"subject"/i);
  });
});

describe('the normal invoice flows are unchanged', () => {
  it('createOwnerInvoice still calls create_owner_invoice with header + lines', async () => {
    rpc.mockResolvedValue({ data: { invoice_id: 'inv-9' }, error: null } as never);
    const { id } = await api.createOwnerInvoice({ business_entity_id: 'entity-1' }, LINES);
    expect(rpc.mock.calls[0][0]).toBe('create_owner_invoice');
    const args = rpc.mock.calls[0][1] as Record<string, unknown>;
    expect(args.p_header).toEqual({ business_entity_id: 'entity-1' });
    expect(args.p_lines).toEqual(LINES);
    expect(id).toBe('inv-9');
  });

  it('issueOwnerInvoice still calls issue_owner_invoice — server numbering intact', async () => {
    rpc.mockResolvedValue({ data: { invoice_number: 'RE-2026-0001' }, error: null } as never);
    await api.issueOwnerInvoice('inv-9');
    expect(rpc.mock.calls[0][0]).toBe('issue_owner_invoice');
    const args = rpc.mock.calls[0][1] as Record<string, unknown>;
    expect(args.p_invoice_id).toBe('inv-9');
    // No client-supplied number anywhere in the issuance call.
    expect(Object.keys(args)).not.toContain('p_invoice_number');
  });

  it('recordInvoicePayment still calls record_owner_invoice_payment with amount + date', async () => {
    rpc.mockResolvedValue({ data: { payment_id: 'pay-9' }, error: null } as never);
    await api.recordInvoicePayment('inv-9', 5000, '2026-03-03');
    expect(rpc).toHaveBeenCalledWith('record_owner_invoice_payment', expect.objectContaining({
      p_invoice_id: 'inv-9', p_amount_cents: 5000, p_payment_date: '2026-03-03',
    }));
  });
});

describe('tax snapshot persistence states its period', () => {
  it('saveTaxEstimate writes the period alongside the tax year', async () => {
    const insert = vi.fn(async () => ({ error: null }));
    from.mockReturnValue({ insert } as never);
    await api.saveTaxEstimate('entity-1', {
      tax_year: 2026, period: 'year', tax_type: 'combined_reserve', rules_version: 'de-2026-v1',
    });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ tax_year: 2026, period: 'year' }));
  });
});
