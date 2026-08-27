// Unit tests for the isolated-workspace reconciliation proofs.
//
// These cover the invariant that replaced "exactly one SQL file in the directory":
//   EXACTLY ONE local-only migration exists, and it is the selected target.
//
// Every way that could be false — a fetch that under- or over-produced, a target already
// applied, a protected migration reappearing, a tampered target file, a malformed version,
// two pending migrations — gets a case, because each one would let `db push` do something
// nobody authorised.

import {
  verifyFetchedHistory,
  verifyIsolatedState,
  verifyTargetSha,
  versionsFromFilenames,
} from './lib/supabase-migration-reconcile.mjs';
import { PROTECTED_VERSIONS } from './lib/supabase-migration-allowlist.mjs';

let failures = 0;

function check(name, condition, detail = '') {
  if (condition) {
    console.log(`  ok  ${name}`);
  } else {
    failures += 1;
    console.error(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

/* Fixture helpers -------------------------------------------------------------- */

const A = '20260710120000';
const B = '20260710133000';
const C = '20260711120000';
const D = '20260826120000'; // the target in most cases
const [CLUB_1, CLUB_2] = PROTECTED_VERSIONS;

const SHA_OK = 'a'.repeat(64);
const SHA_OTHER = 'b'.repeat(64);

// The CLI emits a BORDERED table (every row begins with `|`). That matters: in a row with
// no leading border, a blank Local column shifts Remote and the timestamp left by one field,
// and the parser — faithfully ported from the original awk — cannot tell the two layouts
// apart. It resolves that ambiguity in the fail-closed direction, so the risk is a spurious
// failure rather than a missed one, but fixtures must use the real bordered shape to test
// what actually happens in CI.
const HEADER = ['| Local          | Remote         | Time (UTC)          |', '|----------------|----------------|---------------------|'];
const blank = ' '.repeat(14);

/** `migration list` when the local directory is EMPTY: remote-only rows. */
const remoteOnlyList = (...versions) =>
  [...HEADER, ...versions.map((v) => `| ${blank} | ${v} | 2026-08-01 00:00:00 |`)].join('\n');

/** `migration list` after reconciliation: pairs, plus pending rows with a blank Remote. */
const reconciledList = ({ synced = [], pending = [] }) =>
  [
    ...HEADER,
    ...synced.map((v) => `| ${v} | ${v} | 2026-08-01 00:00:00 |`),
    ...pending.map((v) => `| ${v} | ${blank} | 2026-08-01 00:00:00 |`),
  ].join('\n');

const fileFor = (version, name = 'remote_schema') => `${version}_${name}.sql`;

/* ------------------------------------------------------ 1. happy path (fetched) */
console.log('fetched-history audit');

{
  // Remote A B C · fetched A B C · target D  → PASS
  const r = verifyFetchedHistory({
    remoteBeforeOutput: remoteOnlyList(A, B, C),
    fetchedFilenames: [A, B, C].map((v) => fileFor(v)),
    targetVersion: D,
  });
  check('1. remote A B C, fetched A B C, target D → PASS', r.ok === true, r.errors.join('; '));
  check('1. reports the fetched count', r.fetchedCount === 3);
}

/* ------------------------------------------------------ 2. fetch under-produced */
{
  const r = verifyFetchedHistory({
    remoteBeforeOutput: remoteOnlyList(A, B, C),
    fetchedFilenames: [A, B].map((v) => fileFor(v)),
    targetVersion: D,
  });
  check('2. remote A B C, fetched A B → FAIL', r.ok === false);
  check('2. names the version that was not created', r.errors.some((e) => e.includes(C) && e.includes('not created locally')), r.errors.join('; '));
}

/* ------------------------------------------------------ 3. fetch over-produced */
{
  const r = verifyFetchedHistory({
    remoteBeforeOutput: remoteOnlyList(A, B),
    fetchedFilenames: [A, B, C].map((v) => fileFor(v)),
    targetVersion: D,
  });
  check('3. remote A B, fetched A B C → FAIL', r.ok === false);
  check('3. names the version with no remote counterpart', r.errors.some((e) => e.includes(C) && e.includes('not in the remote history')), r.errors.join('; '));
}

/* ------------------------------------------------------ 4. target already remote */
{
  const r = verifyFetchedHistory({
    remoteBeforeOutput: remoteOnlyList(A, B, D),
    fetchedFilenames: [A, B, D].map((v) => fileFor(v)),
    targetVersion: D,
  });
  check('4. target already applied remotely → FAIL', r.ok === false);
  check('4. explains that the target is already applied', r.errors.some((e) => e.includes('already applied remotely') || e.includes('already present in the remote history')), r.errors.join('; '));
}

/* ------------------------------------------------------ 8. malformed fetched version */
{
  const r = verifyFetchedHistory({
    remoteBeforeOutput: remoteOnlyList(A, B),
    fetchedFilenames: [fileFor(A), 'not-a-migration.sql', fileFor(B)],
    targetVersion: D,
  });
  check('8. malformed fetched filename → FAIL', r.ok === false);
  check('8. names the malformed file', r.errors.some((e) => e.includes('malformed') && e.includes('not-a-migration.sql')), r.errors.join('; '));
}

{
  const r = verifyFetchedHistory({ remoteBeforeOutput: remoteOnlyList(A), fetchedFilenames: [fileFor(A)], targetVersion: 'nope' });
  check('malformed target version → FAIL', r.ok === false && r.errors[0].includes('malformed'), r.errors.join('; '));
}

/* --------------------------------------------- 5 / 9. final isolation proof PASS */
console.log('final isolation proof');

{
  // Remote A B C · fetched A B C · target D · protected absent → PASS
  const r = verifyIsolatedState({
    finalListOutput: reconciledList({ synced: [A, B, C], pending: [D] }),
    migrationFilenames: [A, B, C, D].map((v) => fileFor(v)),
    targetVersion: D,
    requiredVersions: [],
    protectedVersions: PROTECTED_VERSIONS,
  });
  check('5/9. reconciled workspace with exactly one pending target → PASS', r.ok === true, r.errors.join('; '));
  check('5/9. exactly one local-only version', JSON.stringify(r.localOnly) === JSON.stringify([D]), JSON.stringify(r.localOnly));
  check('5/9. protected versions reported absent from both sides', r.notes.filter((n) => n.includes('absent from both')).length === 2, r.notes.join('; '));
}

/* --------------------------------------------- 6. protected migration reappears */
{
  const r = verifyIsolatedState({
    finalListOutput: reconciledList({ synced: [A, B, C], pending: [D, CLUB_1] }),
    migrationFilenames: [A, B, C, D, CLUB_1].map((v) => fileFor(v)),
    targetVersion: D,
    protectedVersions: PROTECTED_VERSIONS,
  });
  check('6. protected migration local-only → FAIL', r.ok === false);
  check('6. says it would be pushed', r.errors.some((e) => e.includes(CLUB_1) && e.includes('WOULD BE PUSHED')), r.errors.join('; '));
}

{
  // Already applied remotely: its fetched copy is legitimate and must NOT fail.
  const r = verifyIsolatedState({
    finalListOutput: reconciledList({ synced: [A, CLUB_2], pending: [D] }),
    migrationFilenames: [A, CLUB_2, D].map((v) => fileFor(v)),
    targetVersion: D,
    protectedVersions: [CLUB_2],
  });
  check('6b. a protected migration already applied remotely is allowed as a fetched copy', r.ok === true, r.errors.join('; '));
}

/* --------------------------------------------- 10. two local-only migrations */
{
  const r = verifyIsolatedState({
    finalListOutput: reconciledList({ synced: [A, B], pending: [D, C] }),
    migrationFilenames: [A, B, D, C].map((v) => fileFor(v)),
    targetVersion: D,
    protectedVersions: PROTECTED_VERSIONS,
  });
  check('10. two local-only migrations → FAIL', r.ok === false);
  check('10. reports the count', r.errors.some((e) => e.includes('Expected exactly ONE local-only migration, found 2')), r.errors.join('; '));
}

{
  const r = verifyIsolatedState({
    finalListOutput: reconciledList({ synced: [A, B, C] }),
    migrationFilenames: [A, B, C].map((v) => fileFor(v)),
    targetVersion: D,
    protectedVersions: PROTECTED_VERSIONS,
  });
  check('zero local-only migrations → FAIL', r.ok === false && r.errors.some((e) => e.includes('found 0')), r.errors.join('; '));
}

{
  // The single pending migration is not the target.
  const r = verifyIsolatedState({
    finalListOutput: reconciledList({ synced: [A, B], pending: [C] }),
    migrationFilenames: [A, B, C].map((v) => fileFor(v)),
    targetVersion: D,
    protectedVersions: PROTECTED_VERSIONS,
  });
  check('wrong single pending migration → FAIL', r.ok === false && r.errors.some((e) => e.includes('not the selected target')), r.errors.join('; '));
}

{
  // Reconciliation incomplete: a remote version still has no local file.
  const r = verifyIsolatedState({
    finalListOutput: [...HEADER, `| ${A} | ${A} | x |`, `| ${blank} | ${B} | x |`, `| ${D} | ${blank} | x |`].join('\n'),
    migrationFilenames: [A, D].map((v) => fileFor(v)),
    targetVersion: D,
    protectedVersions: PROTECTED_VERSIONS,
  });
  check('remote-only version remaining → FAIL', r.ok === false && r.errors.some((e) => e.includes('still missing locally')), r.errors.join('; '));
}

{
  // Disk and CLI disagree.
  const r = verifyIsolatedState({
    finalListOutput: reconciledList({ synced: [A], pending: [D] }),
    migrationFilenames: [A, D, C].map((v) => fileFor(v)),
    targetVersion: D,
    protectedVersions: [],
  });
  check('disk/CLI disagreement → FAIL', r.ok === false && r.errors.some((e) => e.includes('exists on disk but is missing from the CLI')), r.errors.join('; '));
}

{
  // Target reported as already applied in the final list.
  const r = verifyIsolatedState({
    finalListOutput: reconciledList({ synced: [A, D] }),
    migrationFilenames: [A, D].map((v) => fileFor(v)),
    targetVersion: D,
    protectedVersions: [],
  });
  check('target not pending in the final list → FAIL', r.ok === false, r.errors.join('; '));
}

{
  // Prerequisite chain, as used for M2 and M3.
  const ok = verifyIsolatedState({
    finalListOutput: reconciledList({ synced: [A, D], pending: ['20260828120000'] }),
    migrationFilenames: [A, D, '20260828120000'].map((v) => fileFor(v)),
    targetVersion: '20260828120000',
    requiredVersions: [D],
    protectedVersions: PROTECTED_VERSIONS,
  });
  check('M2 with M1 applied → PASS', ok.ok === true, ok.errors.join('; '));

  const bad = verifyIsolatedState({
    finalListOutput: reconciledList({ synced: [A], pending: ['20260828120000'] }),
    migrationFilenames: [A, '20260828120000'].map((v) => fileFor(v)),
    targetVersion: '20260828120000',
    requiredVersions: [D],
    protectedVersions: PROTECTED_VERSIONS,
  });
  check('M2 without M1 applied → FAIL', bad.ok === false && bad.errors.some((e) => e.includes('Prerequisite 20260826120000')), bad.errors.join('; '));
}

{
  const r = verifyIsolatedState({
    finalListOutput: reconciledList({ synced: [A], pending: [D] }),
    migrationFilenames: [fileFor(A), 'garbage.sql', fileFor(D)],
    targetVersion: D,
    protectedVersions: [],
  });
  check('malformed local filename → FAIL', r.ok === false && r.errors.some((e) => e.includes('malformed')), r.errors.join('; '));
}

/* --------------------------------------------- 7. target SHA proof */
console.log('target SHA proof');

check('7. identical SHAs → PASS', verifyTargetSha({ sourceSha: SHA_OK, stagedSha: SHA_OK, restoredSha: SHA_OK }).ok === true);
{
  const r = verifyTargetSha({ sourceSha: SHA_OK, stagedSha: SHA_OK, restoredSha: SHA_OTHER });
  check('7. restored SHA differs → FAIL', r.ok === false && r.errors[0].includes('changed during reconciliation'), r.errors.join('; '));
}
{
  const r = verifyTargetSha({ sourceSha: SHA_OK, stagedSha: SHA_OTHER, restoredSha: SHA_OK });
  check('7b. staged SHA differs → FAIL', r.ok === false);
}
for (const bad of ['', undefined, null, 'not-a-sha', 'abc']) {
  const r = verifyTargetSha({ sourceSha: SHA_OK, stagedSha: SHA_OK, restoredSha: bad });
  check(`7c. non-digest restored SHA ${JSON.stringify(bad)} → FAIL`, r.ok === false && r.errors[0].includes('not a SHA-256'), r.errors.join('; '));
}

/* --------------------------------------------- filename helper */
{
  const { versions, malformed } = versionsFromFilenames([fileFor(A), '  ', 'x.sql', fileFor(B)]);
  check('versionsFromFilenames extracts versions', JSON.stringify(versions) === JSON.stringify([A, B]), JSON.stringify(versions));
  check('versionsFromFilenames flags malformed', JSON.stringify(malformed) === JSON.stringify(['x.sql']), JSON.stringify(malformed));
}

/* --------------------------------------------- real captured shape (sanitised) */
console.log('captured production shape');

{
  // The real run reported many remote-only versions and one local-only target. This is that
  // shape, sanitised to versions only, before and after reconciliation.
  const REAL_REMOTE = [
    '20260607194622', '20260607200426', '20260706121415', '20260706122833', '20260709120000',
    '20260710120000', '20260710133000', '20260711120000', '20260721120000', '20260722120000',
    '20260723120000', '20260723121000', '20260723122000', '20260723123000', '20260723124000',
    '20260723125000', '20260723126000', '20260723127000', '20260723128000', '20260724120000',
    '20260728120000', '20260728121000', '20260728122000', '20260728123000', '20260728124000',
    '20260730031350', '20260730120000', '20260730130000', '20260731120000', '20260731121000',
    '20260731122000', '20260804120000', '20260823102556', '20260824171403', '20260825064048',
  ];

  const before = remoteOnlyList(...REAL_REMOTE);
  const fetched = verifyFetchedHistory({
    remoteBeforeOutput: before,
    fetchedFilenames: REAL_REMOTE.map((v) => fileFor(v)),
    targetVersion: D,
  });
  check('captured shape: fetch reconciles all 35 remote versions', fetched.ok === true, fetched.errors.join('; '));
  check('captured shape: remote count is 35', fetched.remoteCount === 35, String(fetched.remoteCount));

  const final = verifyIsolatedState({
    finalListOutput: reconciledList({ synced: REAL_REMOTE, pending: [D] }),
    migrationFilenames: [...REAL_REMOTE, D].map((v) => fileFor(v)),
    targetVersion: D,
    requiredVersions: [],
    protectedVersions: PROTECTED_VERSIONS,
  });
  check('captured shape: exactly one pending migration (M1)', final.ok === true, final.errors.join('; '));
  check('captured shape: local-only is exactly the target', JSON.stringify(final.localOnly) === JSON.stringify([D]), JSON.stringify(final.localOnly));
  check(
    'captured shape: both club migrations absent from Local and Remote',
    final.notes.filter((n) => n.includes('absent from both')).length === 2,
    final.notes.join('; '),
  );
}

if (failures > 0) {
  console.error(`\nreconciliation tests FAILED (${failures})`);
  process.exit(1);
}
console.log('reconciliation tests passed');
