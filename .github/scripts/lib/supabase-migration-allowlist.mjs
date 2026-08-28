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
 *  - 20260830122000 replaces the audit triggers 20260830120000 created on four of its
 *    tables and writes into owner_audit_log (20260722120000). It must also come after
 *    20260830121000: 20260830120000 recreates those triggers pointing at the generic
 *    factory, so the fix has to be the LAST of the onboarding chain to run
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
  {
    file: '20260830122000_service_onboarding_audit_fix.sql',
    version: '20260830122000',
    // The confirmed production failure: the generic audit factory fell back to the row's own
    // id for owner_engagement_tasks / owner_engagement_fields, which carry no
    // business_entity_id, so owner_add_customer_service died on 23503 against
    // owner_audit_log_business_entity_id_fkey. This repoints the four onboarding audit
    // triggers at a dedicated function that resolves the entity through engagement_id.
    //
    // Both onboarding migrations are prerequisites: 20260830120000 creates the tables and the
    // triggers this replaces, and 20260830121000 must already be in the remote history
    // because 20260830120000 re-running after this fix would repoint those triggers back at
    // the generic factory. Applying the chain strictly in version order is the property this
    // entry enforces.
    requires: ['20260710120000', '20260722120000', '20260724120000', '20260830120000', '20260830121000'],
    description: 'Service onboarding audit fix — resolve the business entity through the engagement',
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
