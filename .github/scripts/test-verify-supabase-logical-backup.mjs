// Unit tests for the Free-plan logical backup gate.
//
// The gate decides whether a production migration may write, so every way a backup can be
// incomplete has to be rejected here rather than discovered during a restore. Nothing in this
// file touches a database, a network or a real dump.

import {
  EXPECTED_BACKUP_FILES,
  COMPLETION_SENTINEL,
  dumpInvocation,
  evaluateLogicalBackup,
  filenameIsSafe,
  formatChecksums,
  formatLogicalBackupGate,
  ledgerHead,
  parseArgs,
  parseDumpStatus,
  scanForSecrets,
} from './verify-supabase-logical-backup.mjs';

let failures = 0;

function check(name, condition, detail = '') {
  if (condition) {
    console.log(`  ok  ${name}`);
  } else {
    failures += 1;
    console.error(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

const LEDGER = [
  '   Local          | Remote         | Time (UTC)',
  '  ----------------|----------------|---------------------',
  '   20260711120000 | 20260711120000 | 2026-07-11 12:00:00',
  '   20260825120000 | 20260825120000 | 2026-08-25 12:00:00',
  '   20260826120000 |                | 2026-08-26 12:00:00',
].join('\n');

/** A bundle that passes everything, so each test can break exactly one thing. */
function healthyBundle(overrides = {}) {
  const bodies = {
    'roles.sql': '-- roles\nALTER ROLE anon SET statement_timeout = 0;\n',
    'schema.sql': `-- schema\n${'CREATE TABLE public.invoices (id uuid PRIMARY KEY);\n'.repeat(40)}`,
    'data.sql': '-- data\nCOPY public.invoices (id) FROM stdin;\n\\.\n',
    'migrations-schema.sql': 'CREATE SCHEMA IF NOT EXISTS supabase_migrations;\n',
    'migrations-data.sql': 'COPY supabase_migrations.schema_migrations (version) FROM stdin;\n\\.\n',
    'migrations-ledger.txt': LEDGER,
    ...(overrides.bodies ?? {}),
  };

  const files = new Map();
  for (const [name, text] of Object.entries(bodies)) {
    if (text === null) continue; // null = file missing
    const buffer = Buffer.from(text, 'utf8');
    files.set(name, { buffer, bytes: buffer.length, text });
  }

  const statusLines =
    overrides.statusRaw ??
    [...EXPECTED_BACKUP_FILES.map((f) => `${f.name}=0`), `${COMPLETION_SENTINEL}=0`].join('\n');

  return evaluateLogicalBackup({
    dir: 'production-backup',
    files,
    statusRaw: statusLines,
    ledgerRaw: overrides.ledgerRaw ?? LEDGER,
    targetMigration: '20260826120000_owner_historical_paid_invoice.sql',
    projectRef: 'abcdefghijklmnopqrst',
    runId: '4242',
    runAttempt: '1',
    repository: 'cogniiq/cogniiq',
    cliVersion: '2.116.0',
    createdAtUtc: '2026-08-27T10:00:00Z',
    secrets: overrides.secrets ?? ['sbp_super_secret_token_value', 'a-very-long-db-password'],
  });
}

console.log('logical backup gate');

/* ------------------------------------------------------------------ happy path */
{
  const r = healthyBundle();
  check('a complete bundle passes', r.ok === true, r.problems.join(' | '));
  check('no warnings on a complete bundle', r.warnings.length === 0, r.warnings.join(' | '));
  check('every expected file is in the manifest', r.manifest.files.length === EXPECTED_BACKUP_FILES.length);
  check('every manifest entry carries a sha256', r.manifest.files.every((f) => /^[0-9a-f]{64}$/.test(f.sha256)));
  check('every manifest entry carries a byte count', r.manifest.files.every((f) => f.bytes > 0));
  check('manifest records the pre-migration ledger head', r.manifest.preMigrationLedgerHead === '20260825120000', String(r.manifest.preMigrationLedgerHead));
  check('manifest records the ledger size', r.manifest.preMigrationLedgerCount === 2, String(r.manifest.preMigrationLedgerCount));
  check('manifest records the project ref', r.manifest.sourceProjectRef === 'abcdefghijklmnopqrst');
  check('manifest records the workflow run id', r.manifest.workflowRunId === '4242');
  check('manifest records the run attempt', r.manifest.workflowRunAttempt === '1');
  check('manifest records a UTC timestamp', r.manifest.createdAtUtc === '2026-08-27T10:00:00Z');
  check('manifest records the target migration version', r.manifest.targetMigrationVersion === '20260826120000');
  check('manifest states this is not PITR', /not Point-in-Time Recovery/.test(r.manifest.recoveryModel));
  check('manifest reports all files present', r.manifest.checks.allFilesPresent === true);
  check('manifest reports all files non-empty', r.manifest.checks.allFilesNonEmpty === true);
  check('manifest reports the completion sentinel', r.manifest.checks.dumpCompletionSentinel === true);
}

/* ------------------------------------------------------------- fails closed */
{
  const r = healthyBundle({ bodies: { 'schema.sql': null } });
  check('a missing file fails closed', r.ok === false);
  check('a missing file is named', r.problems.some((p) => p.startsWith('schema.sql: expected backup file is missing')), r.problems.join(' | '));
  check('a missing file is reported as absent in the manifest', r.manifest.files.find((f) => f.name === 'schema.sql').bytes === null);
  check('allFilesPresent turns false', r.manifest.checks.allFilesPresent === false);
}

{
  const r = healthyBundle({ bodies: { 'data.sql': '' } });
  check('an empty file fails closed', r.ok === false);
  check('an empty file is named', r.problems.some((p) => p.includes('data.sql') && p.includes('empty')), r.problems.join(' | '));
}

{
  const r = healthyBundle({ bodies: { 'schema.sql': 'CREATE TABLE t (id int);\n' } });
  check('a suspiciously small file fails closed', r.ok === false);
  check('the size floor is explained', r.problems.some((p) => p.includes('below the 1024-byte minimum')), r.problems.join(' | '));
}

{
  const statusRaw = [...EXPECTED_BACKUP_FILES.map((f) => `${f.name}=0`)].join('\n');
  const r = healthyBundle({ statusRaw });
  check('a missing completion sentinel fails closed', r.ok === false);
  check('the sentinel failure is explained', r.problems.some((p) => p.includes('completion sentinel')), r.problems.join(' | '));
  check('manifest reports the sentinel as absent', r.manifest.checks.dumpCompletionSentinel === false);
}

{
  const statusRaw = [
    ...EXPECTED_BACKUP_FILES.map((f) => (f.name === 'roles.sql' ? 'roles.sql=1' : `${f.name}=0`)),
    `${COMPLETION_SENTINEL}=0`,
  ].join('\n');
  const r = healthyBundle({ statusRaw });
  check('a non-zero dump exit status fails closed', r.ok === false);
  check('the failing dump is named', r.problems.some((p) => p.includes('roles.sql: dump command exited with status 1')), r.problems.join(' | '));
}

{
  const statusRaw = [
    ...EXPECTED_BACKUP_FILES.filter((f) => f.name !== 'data.sql').map((f) => `${f.name}=0`),
    `${COMPLETION_SENTINEL}=0`,
  ].join('\n');
  const r = healthyBundle({ statusRaw });
  check('an unrecorded dump status fails closed', r.ok === false);
  check('the unrecorded dump is named', r.problems.some((p) => p.includes('data.sql: no dump exit status')), r.problems.join(' | '));
}

{
  const r = healthyBundle({ ledgerRaw: 'nothing resembling a migration table' });
  check('an unreadable ledger fails closed', r.ok === false);
  check('the ledger failure is explained', r.problems.some((p) => p.includes('pre-migration ledger could not be read')), r.problems.join(' | '));
  check('no ledger head is invented', r.manifest.preMigrationLedgerHead === null);
}

/* ------------------------------------------- required vs advisory content markers */
{
  const r = healthyBundle({ bodies: { 'schema.sql': `-- schema\n${'SET statement_timeout = 0;\n'.repeat(60)}` } });
  check('a schema dump with no CREATE fails closed', r.ok === false);
  check('the required-marker failure is explained', r.problems.some((p) => p.includes('schema.sql: expected content was not found')), r.problems.join(' | '));
}

{
  const r = healthyBundle({ bodies: { 'migrations-ledger.txt': 'Local | Remote | Time (UTC)\n(no rows)\n'.padEnd(80, ' ') } });
  check('a ledger file with no version fails closed', r.ok === false, r.problems.join(' | '));
}

{
  // A project with no custom roles legitimately dumps no ROLE statement: warn, do not block.
  const r = healthyBundle({ bodies: { 'roles.sql': '-- no custom roles in this project ----\n' } });
  check('an advisory marker does not fail the gate', r.ok === true, r.problems.join(' | '));
  check('an advisory marker is warned about', r.warnings.some((w) => w.startsWith('roles.sql')), r.warnings.join(' | '));
  check('an advisory miss is recorded in the manifest', r.manifest.files.find((f) => f.name === 'roles.sql').markerFound === false);
  check('advisory warnings reach the manifest', r.manifest.warnings.length === 1);
}

{
  // The supabase_migrations dumps may be filtered by the CLI; the ledger text covers that.
  const r = healthyBundle({
    bodies: {
      'migrations-schema.sql': '-- SET statement_timeout = 0; (preamble only) ----\n',
      'migrations-data.sql': '-- SET statement_timeout = 0; (preamble only) -----\n',
    },
  });
  check('filtered supabase_migrations dumps do not fail the gate', r.ok === true, r.problems.join(' | '));
  check('filtered supabase_migrations dumps are warned about', r.warnings.length === 2, r.warnings.join(' | '));
}

{
  const r = healthyBundle({ bodies: { 'data.sql': '-- no rows in any public table ----\n' } });
  check('public data with no content marker still passes', r.ok === true, r.problems.join(' | '));
  check('data.sql is never marker-checked', r.manifest.files.find((f) => f.name === 'data.sql').markerFound === null);
}

/* ------------------------------------------------------------------- secret hygiene */
{
  const secret = 'sbp_super_secret_token_value';
  const r = healthyBundle({ bodies: { 'roles.sql': `ALTER ROLE x PASSWORD '${secret}';\n` }, secrets: [secret] });
  check('a leaked credential fails closed', r.ok === false);
  check('the file holding the credential is named', r.problems.some((p) => p.startsWith('roles.sql: contains credential material')), r.problems.join(' | '));
  check('the credential value is never printed', !r.problems.join(' ').includes(secret));
  check('the credential value never reaches the manifest', !JSON.stringify(r.manifest).includes(secret));
  check('the manifest counts findings without naming them', r.manifest.checks.secretValuesFound === 1);
  check('the rendered summary never prints the credential', !formatLogicalBackupGate(r).includes(secret));
}

{
  const r = healthyBundle({ secrets: [] });
  check('a run with no secrets to scan still passes', r.ok === true, r.problems.join(' | '));
  check('the scan count reflects that nothing was scanned', r.manifest.checks.secretValuesScanned === 0);
}

{
  // A short "secret" would match everywhere; it must be ignored rather than fail everything.
  const r = healthyBundle({ secrets: ['a', 'ROLE'] });
  check('short secret values are not scanned for', r.ok === true, r.problems.join(' | '));
  check('short secret values are not counted', r.manifest.checks.secretValuesScanned === 0);
}

check('an 8-character secret is long enough to scan', scanForSecrets([{ name: 'x', text: 'zz12345678zz' }], ['12345678']).hits.length === 1);
check('a 7-character secret is ignored', scanForSecrets([{ name: 'x', text: 'zz1234567zz' }], ['1234567']).hits.length === 0);
check('non-string secrets do not throw', scanForSecrets([{ name: 'x', text: 'y' }], [null, undefined, 42]).scanned === 0);

check('a plain filename is safe', filenameIsSafe('roles.sql', ['a-very-long-db-password']) === true);
check('a filename with a path separator is refused', filenameIsSafe('../roles.sql', []) === false);
check('a filename containing a credential is refused', filenameIsSafe('dump-a-very-long-db-password.sql', ['a-very-long-db-password']) === false);
check('no expected filename carries a separator', EXPECTED_BACKUP_FILES.every((f) => filenameIsSafe(f.name, [])));

/* --------------------------------------------------------------------- helpers */
{
  const statuses = parseDumpStatus('# comment\n\nroles.sql=0\n  schema.sql = 2 \nnot-a-line\n__complete__=0\n');
  check('status parsing ignores comments and blanks', statuses.size === 3, String(statuses.size));
  check('status parsing trims names and values', statuses.get('schema.sql') === '2');
  check('status parsing does not throw on null', parseDumpStatus(null).size === 0);
}

check('ledgerHead returns null when there is nothing to read', ledgerHead('') === null);
check('ledgerHead picks the highest remote version', ledgerHead(LEDGER).head === '20260825120000');

{
  const args = parseArgs(['--dir', 'x', '--flag', '--target-migration', 'a.sql']);
  check('parseArgs reads values', args.dir === 'x' && args['target-migration'] === 'a.sql');
  check('parseArgs treats a bare flag as true', args.flag === 'true');
}

{
  const r = healthyBundle();
  const sums = formatChecksums(r.manifest);
  const lines = sums.trim().split('\n');
  check('checksums file has one line per file', lines.length === EXPECTED_BACKUP_FILES.length);
  check('checksums use the sha256sum -c format', lines.every((l) => /^[0-9a-f]{64} {2}\S+$/.test(l)), lines[0]);
}

{
  const rendered = formatLogicalBackupGate(healthyBundle());
  check('the summary reports PASS', rendered.includes('Result: PASS'));
  check('the summary names the ledger head', rendered.includes('20260825120000'));
  check('the summary contains no bearer token text', !/bearer|authorization|sbp_/i.test(rendered));
}

/* --------------------------------------------------- defensive shapes must not throw */
for (const [name, input] of [
  ['no files at all', { dir: 'd', files: new Map(), statusRaw: '', ledgerRaw: '' }],
  ['null status and ledger', { dir: 'd', files: new Map(), statusRaw: null, ledgerRaw: null }],
  ['no secrets key', { dir: 'd', files: new Map(), statusRaw: '', ledgerRaw: LEDGER }],
]) {
  let threw = false;
  let result = null;
  try {
    result = evaluateLogicalBackup(input);
  } catch {
    threw = true;
  }
  check(`${name} does not throw`, threw === false);
  check(`${name} fails closed`, threw === false && result.ok === false);
}

/* ----------------------------------------------------- dump invocation derivation */
check('the ledger file has no dump invocation', dumpInvocation(EXPECTED_BACKUP_FILES.at(-1)) === null);
check('roles.sql derives its run_dump line', dumpInvocation(EXPECTED_BACKUP_FILES[0]) === 'run_dump roles.sql --role-only');
check('schema.sql derives a flagless run_dump line', dumpInvocation(EXPECTED_BACKUP_FILES[1]) === 'run_dump schema.sql');

// The bundle must cover exactly what the task requires: roles, schema, public data and
// migration history. A future edit that drops one of them fails here.
for (const required of ['roles.sql', 'schema.sql', 'data.sql', 'migrations-ledger.txt']) {
  check(`${required} is part of the expected bundle`, EXPECTED_BACKUP_FILES.some((f) => f.name === required));
}

if (failures > 0) {
  console.error(`\nlogical backup gate tests FAILED (${failures})`);
  process.exit(1);
}
console.log('logical backup gate tests passed');
