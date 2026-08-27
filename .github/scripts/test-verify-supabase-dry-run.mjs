// Unit tests for the parameterised dry-run gate.
//
// The gate decides whether a production push may proceed, so every way it could wrongly say
// yes is worth a case: too few migrations, too many, the wrong one, and an expected target
// that was never valid in the first place.

import { verifyDryRun } from './verify-supabase-dry-run.mjs';
import { ALLOWED_MIGRATIONS } from './lib/supabase-migration-allowlist.mjs';

let failures = 0;

function check(name, condition, detail = '') {
  if (condition) {
    console.log(`  ok  ${name}`);
  } else {
    failures += 1;
    console.error(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function expectOk(name, output, expected) {
  const result = verifyDryRun(output, expected);
  check(name, result.ok === true, result.error);
}

function expectFail(name, output, expected, errorFragment) {
  const result = verifyDryRun(output, expected);
  const matched = result.ok === false && String(result.error ?? '').includes(errorFragment);
  check(name, matched, `got ok=${result.ok} error=${result.error ?? 'none'}`);
}

/** The shape the Supabase CLI prints for a single pending migration. */
const dryRun = (...files) =>
  ['Connecting to remote database...', 'Would push these migrations:', ...files.map((f) => `  ${f}`), ''].join('\n');

console.log('dry-run verifier');

// --- the four allowlisted targets, each accepted when it is the only one proposed ---
for (const migration of ALLOWED_MIGRATIONS) {
  expectOk(`accepts the single expected migration ${migration.version}`, dryRun(migration.file), migration.file);
}

// --- the receptionist case specifically, since it must keep working unchanged ---
expectOk(
  'receptionist backward compatibility',
  dryRun('20260711120000_receptionist_persistence.sql'),
  '20260711120000_receptionist_persistence.sql',
);

// --- wrong counts ---
expectFail('rejects zero migrations', 'Connecting to remote database...\nRemote database is up to date.\n', '20260828120000_owner_finance_multipay_recurring_bulk.sql', 'Found 0');
expectFail(
  'rejects two migrations',
  dryRun('20260826120000_owner_historical_paid_invoice.sql', '20260828120000_owner_finance_multipay_recurring_bulk.sql'),
  '20260828120000_owner_finance_multipay_recurring_bulk.sql',
  'Found 2',
);
expectFail(
  'rejects an unrelated club-operations migration slipping in alongside the target',
  dryRun('20260811120000_club_operations_catalog_entry.sql', '20260826120000_owner_historical_paid_invoice.sql'),
  '20260826120000_owner_historical_paid_invoice.sql',
  'Found 2',
);

// --- wrong migration ---
expectFail(
  'rejects the wrong single migration',
  dryRun('20260811120000_club_operations_catalog_entry.sql'),
  '20260826120000_owner_historical_paid_invoice.sql',
  'but dry run proposed',
);
expectFail(
  'rejects a neighbouring finance migration',
  dryRun('20260829120000_owner_finance_advance_payments.sql'),
  '20260828120000_owner_finance_multipay_recurring_bulk.sql',
  'but dry run proposed',
);

// --- malformed / missing expected target ---
expectFail('rejects a missing expected target', dryRun('20260826120000_owner_historical_paid_invoice.sql'), undefined, 'required');
expectFail('rejects an empty expected target', dryRun('20260826120000_owner_historical_paid_invoice.sql'), '   ', 'required');
expectFail(
  'rejects a malformed expected target',
  dryRun('20260826120000_owner_historical_paid_invoice.sql'),
  'not-a-migration',
  'not a valid migration filename',
);
expectFail(
  'rejects a path-traversal expected target',
  dryRun('20260826120000_owner_historical_paid_invoice.sql'),
  '../../etc/20260826120000_evil.sql',
  'not a valid migration filename',
);
expectFail(
  'rejects a well-formed target that is not on the allowlist',
  dryRun('20260811120000_club_operations_catalog_entry.sql'),
  '20260811120000_club_operations_catalog_entry.sql',
  'not on the production allowlist',
);

// A migration named twice in the output (header + list) is still one migration.
expectOk(
  'treats a repeated filename as one migration',
  [
    'Would push these migrations:',
    '  20260826120000_owner_historical_paid_invoice.sql',
    'Applying 20260826120000_owner_historical_paid_invoice.sql',
  ].join('\n'),
  '20260826120000_owner_historical_paid_invoice.sql',
);

if (failures > 0) {
  console.error(`\ndry-run verifier tests FAILED (${failures})`);
  process.exit(1);
}
console.log('dry-run verifier tests passed');
