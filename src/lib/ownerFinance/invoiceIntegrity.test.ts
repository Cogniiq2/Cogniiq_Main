// ─────────────────────────────────────────────────────────────────────────────
// INVOICE INTEGRITY (PR-0A) — the structural half of the proof.
//
// The behavioural half lives in .github/scripts/sql/invoice-integrity-tests.sql, which boots a
// real Postgres, applies the whole migration chain and EXECUTES the guard, the grants and both
// conversion paths as an unprivileged `authenticated` role. A source-level test cannot prove a
// REVOKE took effect.
//
// What this file covers is the part the SQL suite structurally cannot: that no NEW client-side
// write path against owner_invoices sneaks back into src/, and that the migration keeps the
// shape the DB tests rely on. Nothing here touches a database.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const MIGRATION = 'supabase/migrations/20260831120000_owner_invoice_integrity_guard.sql';
const sql = readFileSync(resolve(process.cwd(), MIGRATION), 'utf8');
/** Comments in the migration legitimately NAME what it forbids; only code counts. */
const executable = sql.split('\n').filter((l) => !l.trimStart().startsWith('--')).join('\n');

/** Comments legitimately NAME the forbidden call (this file's own subject); only code counts. */
function codeOf(file: string): string {
  return readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').filter((l) => !l.trimStart().startsWith('//')).join('\n');
}

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) { sourceFiles(full, acc); continue; }
    if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) acc.push(full);
  }
  return acc;
}

describe('no client-side write path to owner_invoices survives', () => {
  const files = sourceFiles(resolve(process.cwd(), 'src'));

  it.each(['update', 'insert', 'delete', 'upsert'])(
    'no production source performs a raw .%s() on owner_invoices', (verb) => {
      const offenders = files.filter((f) => {
        const code = codeOf(f);
        // The PostgREST builder is always `from('owner_invoices')` followed by the verb on the
        // same or the next chained call; matching the whole chain up to the terminator catches
        // both the one-liner and the multi-line formatting.
        return new RegExp(String.raw`from\(['"\`]owner_invoices['"\`]\)[\s\S]{0,200}?\.${verb}\(`).test(code);
      });
      expect(offenders).toEqual([]);
    });

  it('setInvoiceStatus is gone from the finance API', () => {
    const api = readFileSync(resolve(process.cwd(), 'src/lib/ownerFinance/api.ts'), 'utf8');
    expect(api).not.toMatch(/export\s+(async\s+)?function\s+setInvoiceStatus/);
    // and nothing still imports it
    for (const f of files) {
      expect(codeOf(f)).not.toMatch(/\bsetInvoiceStatus\b/);
    }
  });

  it('the supported transitions are still wired to their RPCs', () => {
    const api = readFileSync(resolve(process.cwd(), 'src/lib/ownerFinance/api.ts'), 'utf8');
    expect(api).toContain("supabase.rpc('issue_owner_invoice'");
    expect(api).toContain("supabase.rpc('record_owner_invoice_payment'");
    expect(api).toContain("supabase.rpc('delete_owner_draft_invoice'");
  });
});

describe('the guard migration keeps its load-bearing shape', () => {
  it('revokes the client UPDATE grant and re-grants nothing', () => {
    expect(executable).toMatch(/revoke update on table public\.owner_invoices from authenticated;/);
    expect(executable).not.toMatch(/grant update[\s\S]*?on table public\.owner_invoices to authenticated/);
  });

  it('covers INSERT as well as UPDATE and DELETE', () => {
    expect(executable).toMatch(
      /create trigger owner_invoices_guard before insert or update or delete on public\.owner_invoices/);
  });

  it('keeps the sanctioned server paths privileged rather than special-casing them', () => {
    expect(executable).toContain('public.is_database_admin() or public.request_is_service_role()');
  });

  it('both conversion entry points delegate to the one canonical body', () => {
    const manual = executable.slice(executable.indexOf('function public.convert_owner_offer_to_invoice_draft'));
    const manualBody = manual.slice(0, manual.indexOf('$fn$;'));
    expect(manualBody).toContain('public.owner_convert_offer_to_invoice_core(');

    const internal = executable.slice(executable.indexOf('function public.owner_convert_offer_internal'));
    const internalBody = internal.slice(0, internal.indexOf('$fn$;'));
    expect(internalBody).toContain('public.owner_convert_offer_to_invoice_core(');

    // Neither wrapper may carry its own copy of the business rules.
    for (const body of [manualBody, internalBody]) {
      expect(body).not.toContain('insert into public.owner_invoices');
      expect(body).not.toContain('insert into public.owner_invoice_lines');
    }
  });

  it('the canonical body excludes recurring lines and records provenance', () => {
    const core = executable.slice(executable.indexOf('function public.owner_convert_offer_to_invoice_core'));
    const coreBody = core.slice(0, core.indexOf('$core$;'));
    // Every read of the offer's lines that feeds an invoice line is one-time only.
    const lineReads = coreBody.match(/from public\.owner_offer_lines[\s\S]*?(?=\n)/g) ?? [];
    expect(lineReads.length).toBeGreaterThan(0);
    expect(coreBody).toContain("pricing_type = 'one_time'");
    expect(coreBody).toContain('source_offer_conversion_kind');
    expect(coreBody).toContain('source_offer_milestone_index');
    expect(coreBody).toContain('owner_customer_id');
  });

  it('is not callable by any client role', () => {
    expect(executable).toMatch(
      /revoke execute on function public\.owner_convert_offer_to_invoice_core\(uuid, int, uuid\) from public, anon, authenticated, service_role;/);
    expect(executable).not.toMatch(
      /grant execute on function public\.owner_convert_offer_to_invoice_core/);
  });

  it('rewrites no data and drops nothing', () => {
    // A guard migration that needed an UPDATE/DELETE against production rows would not be a
    // guard migration. `update public.owner_offers set converted_invoice_id` inside the
    // conversion function is a runtime write, not a migration-time one, so only top-level DML
    // counts — and there is none of either kind against the invoice tables.
    expect(executable).not.toMatch(/delete from public\./);
    expect(executable).not.toMatch(/drop table/i);
    expect(executable).not.toMatch(/truncate/i);
    expect(executable).not.toMatch(/update public\.owner_invoices set/);
    expect(executable).not.toMatch(/alter table public\.owner_invoices\s+(add|drop) column/);
  });
});
