// The canonical allowlist for the Supabase production migration workflow.
//
// This module is the SINGLE SOURCE OF TRUTH. The workflow's `choice` input and its
// server-side bash `case` allowlist duplicate this list out of necessity — GitHub Actions
// cannot read a JS module to build a dropdown — so
// .github/scripts/test-supabase-production-migration-workflow.mjs asserts that all three
// copies agree exactly. If they ever drift, that test fails rather than the workflow
// quietly accepting a migration nobody approved.
//
// Adding an entry here is a deliberate act: it authorises a file to be pushed to the
// PRODUCTION database. Nothing may be added without the same review any production change
// gets, and the file must already exist on the branch named by `source_ref`.

/** Filename shape every allowlisted migration must satisfy. No paths, no traversal. */
export const MIGRATION_FILENAME_PATTERN = /^\d{14}_[A-Za-z0-9_.-]+\.sql$/;

/**
 * Allowlisted production migrations.
 *
 * `requires` lists versions that MUST already be present in the REMOTE migration history
 * before this one may be applied. It encodes real schema dependencies, not preferences:
 *  - 20260828120000 builds invoices with the `historical_entry` column added by 20260826120000
 *  - 20260829120000 replaces `owner_apply_invoice_payments`, created by 20260828120000
 * Applying them out of order would fail mid-transaction against production.
 */
export const ALLOWED_MIGRATIONS = [
  {
    file: '20260711120000_receptionist_persistence.sql',
    version: '20260711120000',
    requires: [],
    description: 'Receptionist persistence (the original use case; unchanged)',
  },
  {
    file: '20260826120000_owner_historical_paid_invoice.sql',
    version: '20260826120000',
    requires: [],
    description: 'Finance M1 — historical already-paid invoice entry',
  },
  {
    file: '20260828120000_owner_finance_multipay_recurring_bulk.sql',
    version: '20260828120000',
    requires: ['20260826120000'],
    description: 'Finance M2 — multi-payment invoices, recurring revenue, bulk import',
  },
  {
    file: '20260829120000_owner_finance_advance_payments.sql',
    version: '20260829120000',
    requires: ['20260826120000', '20260828120000'],
    description: 'Finance M3 — pre-invoice advance payments (Anzahlungen)',
  },
];

/**
 * Versions this workflow must NEVER apply, even incidentally.
 *
 * These are unrelated club-operations migrations that are pending locally. The isolated
 * workspace already makes them physically invisible to `supabase db push`; recording them
 * here lets the post-apply check PROVE they did not become applied as a side effect.
 */
export const PROTECTED_VERSIONS = ['20260811120000', '20260818120000'];

export function migrationFiles() {
  return ALLOWED_MIGRATIONS.map((m) => m.file);
}

/**
 * Resolve an untrusted filename against the allowlist.
 *
 * Returns null for anything not on the list. A GitHub `choice` input is a UI convenience,
 * not a security boundary — a workflow_dispatch API call can send any string — so every
 * consumer resolves through here rather than trusting what arrived.
 */
export function resolveMigration(file) {
  if (typeof file !== 'string') return null;
  const trimmed = file.trim();
  if (!MIGRATION_FILENAME_PATTERN.test(trimmed)) return null;
  return ALLOWED_MIGRATIONS.find((m) => m.file === trimmed) ?? null;
}

/** Version derived ONLY from the validated filename — never accepted as separate input. */
export function versionFor(file) {
  return resolveMigration(file)?.version ?? null;
}

/** Repository-relative path. Always this shape; traversal is impossible by construction. */
export function pathFor(file) {
  const migration = resolveMigration(file);
  return migration ? `supabase/migrations/${migration.file}` : null;
}

/** The exact confirmation string apply mode demands, derived from the validated version. */
export function confirmationFor(file) {
  const version = versionFor(file);
  return version ? `APPLY_MIGRATION_${version}` : null;
}
