// Unit tests for the backup / restore-point gate.
//
// The gate must fail closed. Every case below that is not a genuinely verifiable restore
// source has to be rejected, because the alternative is applying a production migration
// with no proven way back.

import { readFileSync } from 'node:fs';
import { evaluateBackupGate, formatBackupGate } from './verify-supabase-backups.mjs';

const FIXTURES = '.github/scripts/fixtures/supabase-backups';
let failures = 0;

function check(name, condition, detail = '') {
  if (condition) {
    console.log(`  ok  ${name}`);
  } else {
    failures += 1;
    console.error(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function load(file) {
  return readFileSync(`${FIXTURES}/${file}`, 'utf8');
}

function evaluateFixture(file, status = 200) {
  return evaluateBackupGate(load(file), status);
}

console.log('backup gate');

// 1. completed daily backup -> PASS
{
  const s = evaluateFixture('completed-daily-backup.json');
  check('completed daily backup passes', s.ok === true, s.reason);
  check('completed daily backup reports no PITR', s.pitrEnabled === false);
  check('completed daily backup reports a completed backup', s.completedBackupAvailable === true);
  check(
    'completed daily backup names the newest restore point',
    s.latestRestorePoint === '2026-08-27T02:14:00.000Z',
    String(s.latestRestorePoint),
  );
}

// 2. PITR enabled with a usable range -> PASS
{
  const s = evaluateFixture('pitr-enabled.json');
  check('PITR with a recovery range passes', s.ok === true, s.reason);
  check('PITR is reported enabled', s.pitrEnabled === true);
  check('PITR reports no completed snapshot', s.completedBackupAvailable === false);
  check(
    'PITR names the latest recovery point',
    s.latestRestorePoint === '2026-08-27T13:05:00.000Z',
    String(s.latestRestorePoint),
  );
}

// 3. no backups at all -> FAIL
{
  const s = evaluateFixture('no-backups.json');
  check('no backups fails closed', s.ok === false);
  check('no backups explains why', String(s.reason).includes('No backups'), s.reason);
  check('no backups names no restore point', s.latestRestorePoint === null);
}

// 4. failed / pending backups only -> FAIL
{
  const s = evaluateFixture('failed-backup-only.json');
  check('failed-only backups fail closed', s.ok === false);
  check('failed-only reports no completed backup', s.completedBackupAvailable === false);
  check('failed-only explains why', String(s.reason).includes('No COMPLETED backup'), s.reason);
}

// 5. malformed JSON -> FAIL
{
  const s = evaluateFixture('malformed.json');
  check('malformed JSON fails closed', s.ok === false);
  check('malformed JSON explains why', String(s.reason).includes('not valid JSON'), s.reason);
}

// 6. unauthorized / non-200 -> FAIL
{
  const s401 = evaluateFixture('unauthorized.json', 401);
  check('HTTP 401 fails closed', s401.ok === false);
  check('HTTP 401 explains why', String(s401.reason).includes('HTTP 401'), s401.reason);

  const s403 = evaluateFixture('completed-daily-backup.json', 403);
  check('HTTP 403 fails closed even with a valid body', s403.ok === false, s403.reason);

  const s500 = evaluateFixture('completed-daily-backup.json', 500);
  check('HTTP 500 fails closed even with a valid body', s500.ok === false, s500.reason);
}

// PITR flag set but no usable range -> FAIL (the flag alone is not a restore point)
{
  const s = evaluateFixture('pitr-enabled-without-range.json');
  check('PITR enabled without a range fails closed', s.ok === false);
  check('PITR without a range explains why', String(s.reason).includes('no usable recovery range'), s.reason);
}

// Defensive shapes that must not throw and must not pass.
for (const [name, body, status] of [
  ['empty body', '', 200],
  ['null body', 'null', 200],
  ['array body', '[]', 200],
  ['missing file (empty string)', '', 200],
  ['unreadable status', '{}', 'not-a-number'],
  ['inverted PITR range', JSON.stringify({
    pitr_enabled: true,
    physical_backup_data: {
      earliest_physical_backup_date_utc: '2026-08-27T00:00:00Z',
      latest_physical_backup_date_utc: '2026-08-20T00:00:00Z',
    },
    backups: [],
  }), 200],
  ['unparseable PITR timestamps', JSON.stringify({
    pitr_enabled: true,
    physical_backup_data: { latest_physical_backup_date_utc: 'whenever' },
    backups: [],
  }), 200],
]) {
  let threw = false;
  let summary = null;
  try {
    summary = evaluateBackupGate(body, status);
  } catch {
    threw = true;
  }
  check(`${name} does not throw`, threw === false);
  check(`${name} fails closed`, threw === false && summary.ok === false, summary ? summary.reason : 'threw');
}

// A COMPLETED backup with no usable timestamp still passes; we just cannot name the point.
{
  const s = evaluateBackupGate(JSON.stringify({ pitr_enabled: false, backups: [{ status: 'completed' }] }), 200);
  check('lowercase COMPLETED status is accepted', s.ok === true, s.reason);
  check('unknown restore-point timestamp is reported as unknown', s.latestRestorePoint === null);
  check('summary renders "unknown" rather than null', formatBackupGate(s).includes('restore point: unknown'));
}

// The printed summary must never be able to leak a token, so it must contain only the
// fields we build it from.
{
  const rendered = formatBackupGate(evaluateFixture('pitr-enabled.json'));
  check('summary has the four documented lines', /PITR enabled: yes[\s\S]*Completed backup available: no[\s\S]*Latest available backup\/restore point: 2026-08-27/.test(rendered), rendered);
  check('summary contains no bearer token text', !/bearer|authorization|sbp_/i.test(rendered));
}

if (failures > 0) {
  console.error(`\nbackup gate tests FAILED (${failures})`);
  process.exit(1);
}
console.log('backup gate tests passed');
