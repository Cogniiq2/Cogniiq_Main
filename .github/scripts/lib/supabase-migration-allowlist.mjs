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
 *  - 20260830120000 references owner_business_entities / owner_finance_requests /
 *    owner_write_audit_row / owner_claim_idempotency (20260722120000), owner_customers /
 *    owner_record_customer_activity (20260724120000) and is_platform_owner / set_updated_at
 *    (20260710120000)
 *  - 20260830121000 seeds rows into the template tables 20260830120000 creates
 * Applying them out of order would fail mid-transaction against production.
 *
 * A prerequisite does NOT have to be allowlisted itself — it only has to be applied. The
 * entries below therefore name the migrations whose objects are genuinely referenced, not
 * whichever migrations happen to be recent. Listing a version this SQL does not actually
 * depend on would make the gate assert something untrue.
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
  {
    file: '20260830120000_client_service_onboarding.sql',
    version: '20260830120000',
    requires: ['20260710120000', '20260722120000', '20260724120000'],
    description: 'Service delivery layer — customer services, engagements, templates, go-live gate',
  },
  {
    file: '20260830121000_ai_receptionist_template_v1.sql',
    version: '20260830121000',
    // Seeds the template tables the previous migration creates. These two are applied in two
    // separate runs of this workflow, because its isolation invariant is that EXACTLY ONE
    // local-only migration reaches `db push`. This entry is what makes the order mandatory
    // rather than merely intended.
    requires: ['20260710120000', '20260722120000', '20260724120000', '20260830120000'],
    description: 'AI Receptionist onboarding template v1 (content only — creates no customer)',
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
