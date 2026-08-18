// Guards on the §9.2 investigation queries.
//
// These queries exist to be *reviewed*, not run. The risk they carry is not that they are wrong — it
// is that something executes them automatically against real data. These tests pin the properties
// that make that structurally impossible, and the privacy properties that make them safe to approve.

import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const repoRoot = resolve(__dirname, '../../..');
const queriesPath = resolve(repoRoot, 'docs/club-operations/investigation-queries.sql');
const sql = readFileSync(queriesPath, 'utf8');

describe('the investigation queries cannot be executed automatically', () => {
  it('lives outside the migrations directory, which is what the tooling runs', () => {
    const migrations = readdirSync(resolve(repoRoot, 'supabase/migrations'));
    expect(migrations).not.toContain('investigation-queries.sql');
    expect(migrations.filter((name) => /investigation/i.test(name))).toEqual([]);
  });

  it('adds no migration of its own', () => {
    // A new migration would run on deploy. D2 authors none, and this asserts it rather than trusting
    // the diff review to notice.
    const migrations = readdirSync(resolve(repoRoot, 'supabase/migrations')).filter((name) =>
      name.endsWith('.sql'),
    );
    expect(migrations.every((name) => /^\d{14}_/.test(name))).toBe(true);
    // The club_operations migrations are an explicit, reviewed list rather than "whatever is
    // there": each one is a deliberate step (declare the key inert, then activate it), and a third
    // appearing without this list changing would be exactly the unnoticed migration this guards.
    expect(migrations.filter((name) => /club_operations/.test(name))).toEqual([
      '20260811120000_club_operations_catalog_entry.sql',
      '20260818120000_club_operations_activation.sql',
    ]);
  });

  it('is referenced by no build, test or deployment configuration', () => {
    for (const file of ['package.json', 'vite.config.ts', 'vitest.config.ts']) {
      expect(readFileSync(resolve(repoRoot, file), 'utf8')).not.toContain('investigation-queries');
    }
  });

  it('carries the approval marker at the top and the bottom', () => {
    const marker = 'NOT FOR PRODUCTION EXECUTION WITHOUT OWNER APPROVAL';
    expect(sql).toContain(marker);
    expect(sql.indexOf(marker)).toBeLessThan(400);
    expect(sql.lastIndexOf(marker)).toBeGreaterThan(sql.length - 400);
  });
});

describe('the queries are read-only and aggregate-only', () => {
  const statements = sql
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('--'))
    .join('\n');

  it('contains no statement that writes, alters or grants', () => {
    for (const forbidden of [
      /\binsert\s+into\b/i,
      /\bupdate\s+[a-z_."]+\s+set\b/i,
      /\bdelete\s+from\b/i,
      /\btruncate\b/i,
      /\bdrop\b/i,
      /\balter\b/i,
      /\bgrant\b/i,
      /\brevoke\b/i,
      /\bcreate\s+(table|role|policy|function|trigger|index)\b/i,
      /\bcopy\b/i,
      /\bcall\b/i,
      /\bdo\s+\$\$/i,
    ]) {
      expect(statements, `must not contain ${forbidden}`).not.toMatch(forbidden);
    }
  });

  it('selects no column capable of carrying personal data', () => {
    // Free-text and contact columns from the upstream schema. None may appear anywhere in the file,
    // not even inside a predicate, because a predicate on a name is still a name in a query log.
    for (const column of [
      'customer_name',
      'customer_email',
      'phone_number',
      'buyer_name',
      'buyer_email',
      'buyer_message',
      'redeemed_by',
      'first_name',
      'last_name',
      'membership_number',
      'actor_email',
      'ip_address',
      'user_agent',
      'cancel_token',
      'stripe_session_id',
      'stripe_payment_intent_id',
      'paypal_capture_id',
      'stripe_customer_id',
      'hosted_invoice_url',
      'invoice_pdf',
      'notes',
      'metadata',
    ]) {
      expect(sql.toLowerCase(), `must not reference ${column}`).not.toContain(column);
    }
  });

  it('returns aggregates rather than rows', () => {
    // Every top-level select projects through an aggregate or a grouping key. `select *` and a bare
    // row projection are what would turn an investigation into an extraction.
    expect(statements).not.toMatch(/select\s+\*/i);
    const selects = statements.match(/^select\b/gim) ?? [];
    expect(selects.length).toBeGreaterThanOrEqual(5);
    for (const aggregate of ['count(', 'sum(']) {
      expect(statements.toLowerCase()).toContain(aggregate);
    }
  });

  it('names no host, credential or project reference', () => {
    for (const pattern of [
      /https?:\/\//i,
      /eyJ[A-Za-z0-9_-]{10,}/,
      /service[_-]?role/i,
      /admin[_-]?secret/i,
      /password/i,
      /\bsupabase\.(co|in)\b/i,
    ]) {
      expect(sql, `must not contain ${pattern}`).not.toMatch(pattern);
    }
  });

  it('covers all five documented ambiguities', () => {
    for (const marker of ['#15', '#12', '#13', '#7', '#19']) {
      expect(sql).toContain(marker);
    }
  });
});
