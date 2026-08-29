// ─────────────────────────────────────────────────────────────────────────────
// owner_invoice_preflight — the structural half of the proof.
//
// The behavioural half lives in .github/scripts/sql/invoice-preflight-tests.sql, which boots a
// real Postgres and reaches every one of the seven checks with real data. That is where the
// actual proof is: the bug this fixes is an OPERATOR RESOLUTION bug, so the broken code
// compiled, deployed and passed every source-level check for months.
//
// What this file adds is the one thing the SQL suite cannot: a standing guard against the
// pattern coming back, anywhere in the migration tree. Nothing here touches a database.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const MIGRATION_DIR = resolve(process.cwd(), 'supabase/migrations');
const FIX = '20260901120000_owner_invoice_preflight_array_fix.sql';
const sql = readFileSync(join(MIGRATION_DIR, FIX), 'utf8');
/** Comments here legitimately QUOTE the broken pattern; only code counts. */
const executable = sql.split('\n').filter((l) => !l.trimStart().startsWith('--')).join('\n');

describe('the preflight fix', () => {
  it('appends with array_append on every one of the seven checks', () => {
    const appends = executable.match(/array_append\(missing, '[a-z_]+'\)/g) ?? [];
    expect(appends).toHaveLength(7);
    expect(appends.map((a) => a.replace(/^array_append\(missing, '|'\)$/g, ''))).toEqual([
      'seller_legal_name',
      'seller_address',
      'seller_tax_information',
      'invoice_number_configuration',
      'recipient_legal_name',
      'recipient_address',
      'sender_email_configuration',
    ]);
  });

  it('no longer concatenates a bare literal onto the array', () => {
    // The assignment form specifically. The migration's own COMMENT ON FUNCTION quotes the
    // broken expression on purpose, so a looser match would flag the documentation.
    expect(executable).not.toMatch(/missing\s*:=\s*missing\s*\|\|\s*'/);
  });

  it('keeps the result contract callers read', () => {
    expect(executable).toContain(
      "jsonb_build_object('ok', array_length(missing,1) is null, 'missing', to_jsonb(missing))");
  });

  it('keeps the signature, security context and grants exactly as they were', () => {
    expect(executable).toContain(
      'create or replace function public.owner_invoice_preflight(p_entity uuid, p_offer_id uuid)');
    expect(executable).toContain('security definer set search_path = public, pg_temp');
    expect(executable).toMatch(
      /revoke execute on function public\.owner_invoice_preflight\(uuid, uuid\) from public, anon;/);
    expect(executable).toMatch(
      /grant execute on function public\.owner_invoice_preflight\(uuid, uuid\) to authenticated, service_role;/);
  });

  it('changes nothing but that one function', () => {
    // A create-or-replace migration. Any DDL or DML beyond it would be out of scope.
    expect(executable).not.toMatch(/\b(alter|create) table\b/i);
    expect(executable).not.toMatch(/\bcreate (or replace )?trigger\b/i);
    expect(executable).not.toMatch(/\bcreate (unique )?index\b/i);
    expect(executable).not.toMatch(/\b(insert into|update|delete from)\b/i);
    expect(executable).not.toMatch(/\bcreate policy\b/i);
    // Exactly one function is defined.
    expect(executable.match(/create or replace function/g) ?? []).toHaveLength(1);
  });
});

describe('the malformed-array pattern cannot come back', () => {
  /**
   * `missing := missing || 'literal'` type-checks, deploys, and only fails when the branch
   * actually runs — Postgres resolves text[] || unknown to the array||array operator and then
   * parses the literal as an array. Any `<name> := <name> || '...'` where <name> is a declared
   * text[] local is the same latent bug, so the whole migration tree is swept for it.
   */
  const files = readdirSync(MIGRATION_DIR).filter((f) => f.endsWith('.sql'));

  /**
   * The one historical occurrence. 20260723125000 is APPLIED IN PRODUCTION and an applied
   * migration is never edited in place — it is fixed forward, which is exactly what
   * 20260901120000 does with a create-or-replace of the same function. The exemption is
   * pinned to that one file and that one local so a NEW occurrence anywhere, including a
   * second one in this same file, still fails.
   */
  const HISTORICAL = new Map<string, number>([
    ['20260723125000_owner_signature_proposal_experience.sql', 7],
  ]);

  it.each(files)('%s appends no bare literal to a text[] local', (file) => {
    const body = readFileSync(join(MIGRATION_DIR, file), 'utf8')
      .split('\n').filter((l) => !l.trimStart().startsWith('--')).join('\n');

    const arrayLocals = new Set<string>();
    for (const m of body.matchAll(/(\w+)\s+text\[\]\s*:=/g)) arrayLocals.add(m[1]);
    if (arrayLocals.size === 0) return;

    const offenders: string[] = [];
    for (const m of body.matchAll(/(\w+)\s*:=\s*\1\s*\|\|\s*'/g)) {
      if (arrayLocals.has(m[1])) offenders.push(m[0].trim());
    }
    // An exact count, not a blanket skip: the known-broken file may not grow a new one either.
    expect(offenders).toHaveLength(HISTORICAL.get(file) ?? 0);
  });
});
