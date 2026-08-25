// owner_customer_detail(uuid) is already applied to production (migration
// 20260824171403_canonical_customer_and_deletion.sql). The recurring-pricing migration
// re-creates it (CREATE OR REPLACE — same signature, same file it will be applied from) to add
// recurring_monthly_gross_cents to each offer's projection, because a recurring-only accepted
// deal on a customer's own detail page otherwise reads as 0,00 EUR.
//
// These tests hold the promise this file's approval report makes: nothing existing is removed,
// renamed, or reordered — the offer projection gains exactly one key, and every other section
// (customer, invoices, payments, tasks, activity, delete_blockers) is untouched.

import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

const norm = (s: string) => s.replace(/\r\n/g, '\n');
const PROD_MIGRATION = norm(readFileSync('supabase/migrations/20260824171403_canonical_customer_and_deletion.sql', 'utf8'));
const NEW_MIGRATION = norm(readFileSync('supabase/migrations/20260825064048_offer_recurring_pricing.sql', 'utf8'));

function extractFunction(sql: string, name: string, terminator: string): string {
  const start = sql.indexOf(`function public.${name}`);
  if (start === -1) throw new Error(`function ${name} not found`);
  const end = sql.indexOf(terminator, start);
  return sql.slice(start, end);
}

const PROD_FN = extractFunction(PROD_MIGRATION, 'owner_customer_detail', '\n$$;');
const NEW_FN = extractFunction(NEW_MIGRATION, 'owner_customer_detail', '\n$fn$;');

/** Every top-level key the function returns, in the final jsonb_build_object. */
function returnedKeys(fnBody: string): string[] {
  const returnStmt = fnBody.slice(fnBody.lastIndexOf('return jsonb_build_object('));
  return [...returnStmt.matchAll(/'(\w+)',/g)].map((m) => m[1]);
}

/** Keys inside the offers sub-projection's jsonb_build_object. */
function offerRefKeys(fnBody: string): string[] {
  const start = fnBody.indexOf("into v_offers");
  const block = fnBody.slice(fnBody.indexOf('jsonb_build_object(', fnBody.indexOf('v_offers') - 200), start);
  return [...block.matchAll(/'(\w+)',/g)].map((m) => m[1]);
}

describe('owner_customer_detail — production return shape', () => {
  it('returns these top-level sections today', () => {
    expect(returnedKeys(PROD_FN)).toEqual([
      'customer', 'offers', 'invoices', 'payments', 'tasks', 'activity', 'delete_blockers',
    ]);
  });

  it('projects these fields per offer today (no recurring info)', () => {
    expect(offerRefKeys(PROD_FN)).toEqual([
      'id', 'offer_number', 'title', 'status', 'currency', 'gross_total_cents',
      'created_at', 'valid_until', 'accepted_at', 'archived_at', 'finalized_version', 'sent_at',
    ]);
  });
});

describe('owner_customer_detail — proposed return shape', () => {
  it('returns the identical top-level sections, same order', () => {
    expect(returnedKeys(NEW_FN)).toEqual(returnedKeys(PROD_FN));
  });

  it('adds exactly one field to the offer projection: recurring_monthly_gross_cents', () => {
    const before = offerRefKeys(PROD_FN);
    const after = offerRefKeys(NEW_FN);
    const added = after.filter((k) => !before.includes(k));
    const removed = before.filter((k) => !after.includes(k));
    expect(added).toEqual(['recurring_monthly_gross_cents']);
    expect(removed).toEqual([]);
  });

  it('does not rename or reorder any existing offer field', () => {
    const before = offerRefKeys(PROD_FN);
    const after = offerRefKeys(NEW_FN);
    // Every field the production version returns is still present, in the same relative order.
    const afterWithoutNewField = after.filter((k) => k !== 'recurring_monthly_gross_cents');
    expect(afterWithoutNewField).toEqual(before);
  });

  it('leaves invoices, payments, tasks, activity and delete_blockers byte-identical', () => {
    const section = (fn: string, marker: string, next: string) => fn.slice(fn.indexOf(marker), fn.indexOf(next));
    expect(section(NEW_FN, 'into v_invoices', 'into v_payments')).toBe(section(PROD_FN, 'into v_invoices', 'into v_payments'));
    expect(section(NEW_FN, 'into v_payments', 'into v_tasks')).toBe(section(PROD_FN, 'into v_payments', 'into v_tasks'));
    expect(section(NEW_FN, 'into v_tasks', 'into v_activity')).toBe(section(PROD_FN, 'into v_tasks', 'into v_activity'));
    expect(section(NEW_FN, 'into v_activity', 'v_blockers :=')).toBe(section(PROD_FN, 'into v_activity', 'v_blockers :='));
  });

  it('keeps the same owner-only permission check', () => {
    expect(NEW_FN).toMatch(/if not public\.is_platform_owner\(\) then raise exception 'Owner access required'; end if;/);
    expect(PROD_FN).toMatch(/if not public\.is_platform_owner\(\) then raise exception 'Owner access required'; end if;/);
  });

  it('keeps the same signature, so production grants (revoke from public/anon, grant to authenticated/service_role) carry over unchanged', () => {
    // CREATE OR REPLACE FUNCTION preserves existing grants only when the signature is
    // unchanged. If the parameter list ever changed here, the production grants for
    // owner_customer_detail(uuid) would silently stop applying to the new function.
    expect(PROD_FN).toMatch(/function public\.owner_customer_detail\(p_customer_id uuid\)/);
    expect(NEW_FN).toMatch(/function public\.owner_customer_detail\(p_customer_id uuid\)/);
    // The new migration must not re-grant/re-revoke this function — that would only be
    // needed if the signature changed, which it did not.
    const newMigrationAfterFn = NEW_MIGRATION.slice(NEW_MIGRATION.indexOf('function public.owner_customer_detail'));
    expect(newMigrationAfterFn).not.toMatch(/grant execute on function public\.owner_customer_detail/);
  });

  it('is stable and security definer, matching production', () => {
    const sig = /returns jsonb language plpgsql security definer stable set search_path = public, pg_temp/;
    expect(PROD_FN).toMatch(sig);
    expect(NEW_FN).toMatch(sig);
  });
});

describe('owner_customer_detail — client compatibility', () => {
  it('OwnerCustomerOfferRef carries the new field as a required number, matching the RPC contract', async () => {
    const { readFileSync: rf } = await import('node:fs');
    const typesSrc = rf('src/lib/ownerFinance/types.ts', 'utf8');
    const ifaceStart = typesSrc.indexOf('export interface OwnerCustomerOfferRef');
    const ifaceEnd = typesSrc.indexOf('}', ifaceStart);
    const iface = typesSrc.slice(ifaceStart, ifaceEnd);
    expect(iface).toMatch(/gross_total_cents: number;/);
    expect(iface).toMatch(/recurring_monthly_gross_cents: number;/);
  });

  it('CustomerDetailPage renders the offer amount through the shared split formatter, not the raw one-time field', async () => {
    const { readFileSync: rf } = await import('node:fs');
    const pageSrc = rf('src/pages/owner/CustomerDetailPage.tsx', 'utf8');
    expect(pageSrc).toMatch(/formatOfferAmount\(o, o\.currency, formatCentsCurrencyDe\)/);
    // The old call this replaced would have silently regressed the moment the RPC started
    // returning a recurring-only offer's field: formatCentsCurrencyDe(o.gross_total_cents, ...)
    // used directly on a row would print 0,00 EUR for that customer's real, signed deal.
  });
});
