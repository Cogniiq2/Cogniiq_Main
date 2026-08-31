// ─────────────────────────────────────────────────────────────────────────────
// STRUCTURAL SAFETY for the new finance write paths.
//
// These assertions are about what the code CANNOT do. They read the migration
// source and enumerate its write targets, so a future edit that adds an email
// enqueue, an automation job, or a bank call breaks here.
//
// They are explicitly NOT the whole proof. Source-level tests once passed against
// an engagement function that failed on its first real call, so the behavioural
// half lives in .github/scripts/sql/finance-multipay-tests.sql, which EXECUTES
// every RPC. This file covers the blast radius; that one covers the behaviour.
//
// Nothing here touches a database.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

// Both finance migrations are checked as one body of code. The advance-payment migration
// widens what a payment may be, so it has to clear exactly the same bar: adding a second
// payment kind must not add a write target, a grant to anon, or any outbound path.
const MIGRATIONS = [
  'supabase/migrations/20260828120000_owner_finance_multipay_recurring_bulk.sql',
  'supabase/migrations/20260829120000_owner_finance_advance_payments.sql',
  // The expense importer clears exactly the same bar. It writes MORE tables than the
  // revenue path (expenses, expense lines, vendors), which is precisely why its blast
  // radius has to be enumerated here rather than assumed.
  'supabase/migrations/20260904120000_owner_expense_bulk_import.sql',
];
const sql = MIGRATIONS.map((m) => readFileSync(resolve(process.cwd(), m), 'utf8')).join('\n');

/** Comments in this file legitimately NAME the forbidden symbols; only code counts. */
const executable = sql.split('\n').filter((l) => !l.trimStart().startsWith('--')).join('\n');

describe('finance writes can never reach a customer', () => {
  it.each([
    'owner_automation_jobs',
    'owner_enqueue_automation_job',
    'owner_enqueue_offer_email',
    'owner_process_offer_acceptance',
    'send-offer-document-email',
    'process-accepted-offer',
    'record_offer_acceptance',
    'respond_offer_by_token',
  ])('never references %s', (symbol) => {
    expect(executable).not.toContain(symbol);
  });

  it.each(['pg_net', 'net.http', 'http_post', 'extensions.http', 'supabase_functions', 'resend', 'smtp'])(
    'performs no outbound call via %s', (symbol) => {
      expect(executable.toLowerCase()).not.toContain(symbol);
    });

  it.each(['bank', 'iban', 'bic', 'plaid', 'finapi', 'gocardless', 'reconcil'])(
    'contains no bank integration surface (%s)', (symbol) => {
      // 'bank_transfer' is a payment_method VALUE the owner types, not an integration.
      const withoutMethodValues = executable.toLowerCase().split('bank_transfer').join('');
      expect(withoutMethodValues).not.toContain(symbol);
    });

  it('writes ONLY canonical finance and import tables', () => {
    const allowed = new Set([
      'public.owner_invoices',
      'public.owner_invoice_lines',
      'public.owner_invoice_counters',
      'public.owner_payments',
      'public.owner_finance_requests',
      'public.owner_revenue_contracts',
      'public.owner_revenue_contract_lines',
      'public.owner_revenue_contract_postings',
      'public.owner_finance_import_batches',
      'public.owner_finance_import_records',
      // Expense import. Note what is NOT here and can never be added silently:
      // organizations, owner_customers, client_accounts, owner_invoices,
      // owner_invoice_counters. A supplier named OpenAI cannot become a Cogniiq customer.
      'public.owner_expenses',
      'public.owner_expense_lines',
      'public.owner_vendors',
    ]);
    const writes = [
      ...executable.matchAll(/\binsert\s+into\s+(public\.[a-z_]+)/gi),
      ...executable.matchAll(/\bupdate\s+(public\.[a-z_]+)\s+(?:set|c\s+set)\b/gi),
    ].map((m) => m[1].toLowerCase());

    expect(writes.length).toBeGreaterThan(5);
    const disallowed = [...new Set(writes)].filter((t) => !allowed.has(t));
    expect(disallowed).toEqual([]);
  });

  it('never writes an offer or customer-communication table', () => {
    for (const t of ['owner_offers', 'owner_offer_acceptance_events', 'owner_document_access_tokens', 'owner_finance_notifications']) {
      expect(new RegExp(`insert\\s+into\\s+public\\.${t}\\b`, 'i').test(executable)).toBe(false);
      expect(new RegExp(`update\\s+public\\.${t}\\b`, 'i').test(executable)).toBe(false);
    }
  });
});

describe('finance writes are owner-only', () => {
  const ownerRpcs = [
    'record_owner_historical_invoice_with_payments',
    'owner_add_invoice_payment',
    'owner_create_revenue_contract',
    'owner_set_revenue_contract_status',
    'owner_revenue_contract_overview',
    'owner_post_revenue_contract_month',
    'owner_bulk_import_finance',
    'owner_resolve_import_customers',
    'owner_bulk_import_expenses',
    'owner_resolve_import_vendors',
  ];

  it.each(ownerRpcs)('%s checks is_platform_owner()', (fn) => {
    const start = executable.indexOf(`function public.${fn}(`);
    expect(start).toBeGreaterThan(-1);
    const body = executable.slice(start, start + 1500);
    expect(body).toContain("if not public.is_platform_owner() then raise exception 'Owner access required'");
  });

  it('grants nothing to anon', () => {
    const grants = [...executable.matchAll(/grant execute on function [^;]+;/gi)].map((m) => m[0]);
    expect(grants.length).toBeGreaterThan(0);
    for (const g of grants) expect(g).not.toMatch(/\banon\b/);

    const tableGrants = [...executable.matchAll(/grant [^;]*on table [^;]+;/gi)].map((m) => m[0]);
    for (const g of tableGrants) expect(g).not.toMatch(/\banon\b/);
  });

  it('keeps the internal helpers unreachable from the client', () => {
    for (const helper of ['owner_build_issued_invoice', 'owner_apply_invoice_payments']) {
      expect(executable).toContain(`revoke execute on function public.${helper}`);
      const revokeLine = executable.split('\n').find((l) => l.includes(`revoke execute on function public.${helper}`));
      expect(revokeLine).toContain('anon');
      expect(revokeLine).toContain('authenticated');
    }
  });

  it('never trusts a client-supplied total, status or invoice number', () => {
    // The build helper reads only header metadata and line inputs; the derived money
    // columns are never read from the payload.
    const build = executable.slice(executable.indexOf('function public.owner_build_issued_invoice'));
    const body = build.slice(0, build.indexOf('$$;'));
    for (const forbidden of ["p_header->>'net_total_cents'", "p_header->>'gross_total_cents'",
      "p_header->>'vat_total_cents'", "p_header->>'status'", "p_header->>'invoice_number'", "p_header->>'amount_paid_cents'"]) {
      expect(body).not.toContain(forbidden);
    }
    expect(body).toContain("v_number := 'RE-' ||");   // number is server-generated
    expect(body).toContain("status = 'issued'");      // status is server-set
  });

  it('bounds the bulk payload', () => {
    expect(executable).toContain('at most 100 invoices per import');
    expect(executable).toContain('at most 100 contracts per import');
    expect(executable).toContain('at most 60 payments per invoice');
    expect(executable).toContain('at most 100 expenses per import');
  });
});

describe('THE ACCOUNTING FIREWALL: an expense import cannot reach revenue', () => {
  const expenseSql = readFileSync(
    resolve(process.cwd(), 'supabase/migrations/20260904120000_owner_expense_bulk_import.sql'), 'utf8');
  // Only the expense RPC itself, so the file's verbatim copy of owner_bulk_import_finance
  // (which legitimately writes invoices) does not mask a real leak in the expense path.
  const expenseFn = (() => {
    const start = expenseSql.indexOf('create or replace function public.owner_bulk_import_expenses(');
    expect(start).toBeGreaterThan(-1);
    const body = expenseSql.slice(start);
    return body.slice(0, body.indexOf('$$;'))
      .split('\n').filter((l) => !l.trimStart().startsWith('--')).join('\n');
  })();

  it.each([
    'owner_invoices', 'owner_invoice_lines', 'owner_invoice_counters', 'owner_customers',
    'organizations', 'client_accounts', 'owner_revenue_contracts', 'owner_offers',
    'owner_resolve_import_customers', 'issue_owner_invoice', 'owner_build_issued_invoice',
  ])('the expense import never mentions %s', (symbol) => {
    expect(expenseFn).not.toContain(symbol);
  });

  it('never touches an invoice number — only the SUPPLIER\'s own document number', () => {
    // supplier_invoice_number is an expense column: it records what the vendor called their
    // document. Cogniiq's own invoice_number counter must stay untouched, so the check has
    // to distinguish the two rather than banning the substring.
    expect(expenseFn).not.toMatch(/(?<!supplier_)\binvoice_number\b/);
    expect(expenseFn).toContain('supplier_invoice_number');
    expect(expenseFn).not.toContain('owner_invoice_counters');
  });

  it('resolves suppliers against owner_vendors — the mutation guard for the reported defect', () => {
    // Swapping vendor resolution back to customer resolution fails BOTH halves of this.
    expect(expenseFn).toContain('from public.owner_vendors');
    expect(expenseFn).not.toContain('public.organizations');
  });

  it('records expense payments as outflows linked to the expense', () => {
    expect(expenseFn).toContain("'expense', 'outflow'");
    expect(expenseFn).toContain('expense_id, created_by');
    expect(expenseFn).not.toMatch(/\binvoice_id\b/);
  });

  it('never reads a client-supplied derived total', () => {
    for (const forbidden of ["'net_total_cents'", "'vat_total_cents'", "'gross_total_cents'",
      "'input_vat_cents'", "'amount_paid_cents'", "'payment_status'", "'review_status'"]) {
      expect(expenseFn).not.toContain(`>>${forbidden}`);
    }
  });

  it('refuses a negative supplier credit rather than importing it', () => {
    expect(expenseFn).toContain('if v_net < 0 then');
    expect(expenseFn).toContain('supplier credits (negative expenses) need a separate booking type');
    expect(expenseFn).not.toContain('abs(');
  });

  it('refuses a revenue payload sent to the expense importer, and vice versa', () => {
    expect(expenseFn).toContain('this import accepts expenses only');
    expect(expenseSql).toContain('this import accepts revenue only');
  });
});

describe('the API layer calls only the owner RPCs', () => {
  const apiSrc = readFileSync(resolve(process.cwd(), 'src/lib/ownerFinance/financeExtendedApi.ts'), 'utf8');
  const code = apiSrc.split('\n').filter((l) => !l.trimStart().startsWith('//') && !l.trimStart().startsWith('*')).join('\n');

  it.each(['functions.invoke', 'owner_enqueue_offer_email', 'owner_automation_jobs', 'fetch('])(
    'never uses %s', (symbol) => { expect(code).not.toContain(symbol); });

  it('uses named RPCs, never a client-supplied function name', () => {
    const rpcCalls = [...code.matchAll(/supabase\.rpc\(\s*'([a-z_]+)'/g)].map((m) => m[1]);
    expect(rpcCalls.length).toBeGreaterThan(4);
    // Every call site names a literal RPC; a variable here would mean the client could
    // choose which server function to run.
    expect(code).not.toMatch(/supabase\.rpc\(\s*[a-zA-Z_$][\w$]*\s*,/);
    for (const fn of rpcCalls) expect(fn.startsWith('owner_') || fn.startsWith('record_owner_')).toBe(true);
  });
});

describe('recording payments never triggers communication at the wiring level', () => {
  it('the extended API surface issues exactly one RPC per write and nothing else', async () => {
    const rpc = vi.fn(async () => ({ data: {}, error: null }));
    const from = vi.fn(() => { throw new Error('finance writes must go through an RPC, never a direct table write'); });
    const invoke = vi.fn(async () => { throw new Error('no edge function may be invoked from a finance write'); });
    vi.doMock('@/lib/supabase', () => ({ supabase: { rpc, from, functions: { invoke } } }));

    const api = await import('@/lib/ownerFinance/financeExtendedApi');
    await api.recordHistoricalInvoiceWithPayments({}, [], []);
    await api.addInvoicePayment('i1', { payment_date: '2026-01-01', amount_cents: 100 });
    await api.createRevenueContract({}, []);
    await api.postRevenueContractMonth('c1', '2026-03-01');
    await api.runBulkImport({});
    await api.runExpenseBulkImport({});
    await api.resolveImportVendors('e1', ['OpenAI Ireland Limited']);

    expect(rpc.mock.calls.map((c) => (c as unknown as string[])[0])).toEqual([
      'record_owner_historical_invoice_with_payments',
      'owner_add_invoice_payment',
      'owner_create_revenue_contract',
      'owner_post_revenue_contract_month',
      'owner_bulk_import_finance',
      'owner_bulk_import_expenses',
      'owner_resolve_import_vendors',
    ]);
    expect(invoke).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
    vi.doUnmock('@/lib/supabase');
  });
});
