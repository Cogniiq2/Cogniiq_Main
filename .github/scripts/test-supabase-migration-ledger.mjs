// Unit tests for the migration-history parser, the pre-apply dependency gate and the
// post-apply ledger verifier.
//
// The parser cases from the previous inline awk program are ported verbatim so replacing
// awk with a module loses no coverage.

import { parseMigrationHistory, hasSyncedTarget, remoteVersions } from './lib/supabase-migration-history.mjs';
import { verifyDependencies } from './verify-supabase-migration-deps.mjs';
import { verifyLedger } from './verify-supabase-ledger.mjs';
import { ALLOWED_MIGRATIONS, confirmationFor, versionFor, pathFor, resolveMigration } from './lib/supabase-migration-allowlist.mjs';

let failures = 0;

function check(name, condition, detail = '') {
  if (condition) {
    console.log(`  ok  ${name}`);
  } else {
    failures += 1;
    console.error(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

/* ------------------------------------------------------------------ parser (ported) */
console.log('migration history parser');

const syncCases = [
  ['no-leading-pipe local and remote both populated', 'Local | Remote | Time (UTC)\n20260711120000 | 20260711120000 | 2026-07-20', true],
  ['leading-pipe local and remote both populated', '| Local | Remote | Time |\n|---|---|---|\n| `20260711120000` | `20260711120000` | 2026-07-20 |', true],
  ['no-leading-pipe local populated and remote blank', 'Local | Remote | Time (UTC)\n20260711120000 |        | 2026-07-20', false],
  ['leading-pipe local blank, remote target', '| Local | Remote | Time |\n|---|---|---|\n|      | 20260711120000 | 2026-07-11 12:00:00 |', false],
  ['remote target only', '| Local | Remote | Time |\n|      | 20260711120000 | 2026-07-20 |', false],
  ['local and remote differ', 'Local | Remote | Time\n20260711120000 | 20260710133000 | 2026-07-20', false],
  ['malformed or missing target row', 'Local | Remote | Time\nmalformed output without the target local row', false],
];

for (const [name, output, expected] of syncCases) {
  const result = hasSyncedTarget(output, '20260711120000');
  check(name, result.ok === expected, `got ${JSON.stringify(result)}`);
}

check('header rows are not parsed as versions', parseMigrationHistory('Local | Remote | Time (UTC)').length === 0);
check(
  'a timestamp column never leaks into the remote position',
  hasSyncedTarget('| Local | Remote | Time |\n| 20260826120000 |  | 2026-08-26 12:00:00 |', '20260826120000').ok === false,
);

/* ------------------------------------------------ pre-apply dependency gate */
console.log('dependency gate');

const remoteAt = (...versions) =>
  ['Local | Remote | Time (UTC)', ...versions.map((v) => `${v} | ${v} | 2026-08-26 12:00:00`)].join('\n');

const BEFORE_FINANCE = remoteAt('20260824171403', '20260825064048');

// M1 has no prerequisites.
check('M1 applies with no prerequisites', verifyDependencies(BEFORE_FINANCE, '20260826120000_owner_historical_paid_invoice.sql').ok === true);

// M2 requires M1.
{
  const blocked = verifyDependencies(BEFORE_FINANCE, '20260828120000_owner_finance_multipay_recurring_bulk.sql');
  check('M2 is blocked without M1', blocked.ok === false);
  check('M2 names the missing prerequisite', String(blocked.error).includes('20260826120000'), blocked.error);

  const allowed = verifyDependencies(remoteAt('20260825064048', '20260826120000'), '20260828120000_owner_finance_multipay_recurring_bulk.sql');
  check('M2 is allowed once M1 is applied', allowed.ok === true, allowed.error);
}

// M3 requires M1 and M2.
{
  const none = verifyDependencies(BEFORE_FINANCE, '20260829120000_owner_finance_advance_payments.sql');
  check('M3 is blocked with neither prerequisite', none.ok === false);
  check('M3 names both missing prerequisites', String(none.error).includes('20260826120000') && String(none.error).includes('20260828120000'), none.error);

  const partial = verifyDependencies(remoteAt('20260826120000'), '20260829120000_owner_finance_advance_payments.sql');
  check('M3 is blocked with only M1', partial.ok === false);
  check('M3 names only the genuinely missing one', String(partial.error).includes('Missing from the remote history: 20260828120000'), partial.error);

  const full = verifyDependencies(remoteAt('20260826120000', '20260828120000'), '20260829120000_owner_finance_advance_payments.sql');
  check('M3 is allowed with both prerequisites', full.ok === true, full.error);
}

// Already-applied target must fail rather than be treated as success.
for (const migration of ALLOWED_MIGRATIONS) {
  const result = verifyDependencies(remoteAt(...migration.requires, migration.version), migration.file);
  check(`${migration.version} is refused when already applied`, result.ok === false && String(result.error).includes('ALREADY applied'), result.error);
}

// Receptionist still works.
check(
  'receptionist target still passes the dependency gate',
  verifyDependencies(remoteAt('20260710133000'), '20260711120000_receptionist_persistence.sql').ok === true,
);

// Non-allowlisted target refused.
check(
  'a non-allowlisted target is refused by the dependency gate',
  verifyDependencies(BEFORE_FINANCE, '20260811120000_club_operations_catalog_entry.sql').ok === false,
);

/* ------------------------------------------------ post-apply ledger verifier */
console.log('ledger verifier');

{
  const before = remoteAt('20260825064048', '20260826120000');
  const after = remoteAt('20260825064048', '20260826120000', '20260828120000');
  const ok = verifyLedger(after, '20260828120000_owner_finance_multipay_recurring_bulk.sql', before);
  check('M2 verifies when applied with M1 intact', ok.ok === true, ok.errors.join('; '));
}

{
  // A server-generated substitute timestamp: local file present, remote carries another number.
  const drifted = 'Local | Remote | Time\n20260828120000 | 20260827999999 | 2026-08-27';
  const result = verifyLedger(drifted, '20260828120000_owner_finance_multipay_recurring_bulk.sql', remoteAt('20260826120000'));
  check('a substitute remote timestamp is rejected', result.ok === false);
  check('substitute timestamp is explained', result.errors.some((e) => e.includes('Remote column was 20260827999999')), result.errors.join('; '));
}

{
  const missingPrereq = remoteAt('20260828120000');
  const result = verifyLedger(missingPrereq, '20260828120000_owner_finance_multipay_recurring_bulk.sql', remoteAt('20260826120000'));
  check('a vanished prerequisite is rejected', result.ok === false && result.errors.some((e) => e.includes('no longer present')), result.errors.join('; '));
}

{
  // A club-operations migration becoming applied during the run must be caught.
  const before = remoteAt('20260826120000');
  const after = remoteAt('20260811120000', '20260826120000', '20260828120000');
  const result = verifyLedger(after, '20260828120000_owner_finance_multipay_recurring_bulk.sql', before);
  check('a newly applied protected migration is rejected', result.ok === false);
  check(
    'the protected migration is named',
    result.errors.some((e) => e.includes('20260811120000') && e.includes('changed state')),
    result.errors.join('; '),
  );
}

{
  // Already applied BEFORE the run and still applied after: not this workflow's doing.
  const before = remoteAt('20260818120000', '20260826120000');
  const after = remoteAt('20260818120000', '20260826120000', '20260828120000');
  const result = verifyLedger(after, '20260828120000_owner_finance_multipay_recurring_bulk.sql', before);
  check('a pre-existing protected migration is not blamed on this run', result.ok === true, result.errors.join('; '));
}

{
  const after = remoteAt('20260710133000', '20260711120000');
  const result = verifyLedger(after, '20260711120000_receptionist_persistence.sql', remoteAt('20260710133000'));
  check('receptionist ledger verification still passes', result.ok === true, result.errors.join('; '));
}

check('remoteVersions ignores blank remote columns', remoteVersions('Local | Remote | Time\n20260826120000 |  | x').size === 0);

/* ------------------------------------------------ allowlist derivation */
console.log('allowlist derivation');

for (const migration of ALLOWED_MIGRATIONS) {
  check(`${migration.file} derives version ${migration.version}`, versionFor(migration.file) === migration.version);
  check(`${migration.file} derives its path`, pathFor(migration.file) === `supabase/migrations/${migration.file}`);
  check(
    `${migration.file} derives confirmation APPLY_MIGRATION_${migration.version}`,
    confirmationFor(migration.file) === `APPLY_MIGRATION_${migration.version}`,
  );
}

for (const bad of [
  '20260811120000_club_operations_catalog_entry.sql',
  '../20260826120000_owner_historical_paid_invoice.sql',
  'supabase/migrations/20260826120000_owner_historical_paid_invoice.sql',
  '20260826120000_owner_historical_paid_invoice.sql; rm -rf /',
  '20260826120000_owner_historical_paid_invoice.SQL',
  '',
  null,
  undefined,
  42,
]) {
  check(`rejects untrusted target ${JSON.stringify(bad)}`, resolveMigration(bad) === null);
  check(`derives no confirmation for ${JSON.stringify(bad)}`, confirmationFor(bad) === null);
}

check('generic confirmations are never derived', !ALLOWED_MIGRATIONS.some((m) => ['YES', 'APPLY', 'CONFIRM'].includes(confirmationFor(m.file))));

if (failures > 0) {
  console.error(`\nmigration ledger tests FAILED (${failures})`);
  process.exit(1);
}
console.log('migration ledger tests passed');
