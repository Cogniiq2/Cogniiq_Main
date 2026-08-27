// Gate: after the push, the remote ledger must say exactly what we intended and nothing more.
//
//   node .github/scripts/verify-supabase-ledger.mjs <after.txt> <target.sql> [<before.txt>]
//
// Three checks:
//
//  1. EXACT VERSION. Local and Remote must both read the target version. A server-generated
//     substitute timestamp shows up precisely here — the local file would be present while
//     the remote column carried a different number — and that is a failure, not a success.
//
//  2. PREREQUISITES INTACT. M2 must still see M1 applied; M3 must still see M1 and M2.
//
//  3. PROTECTED VERSIONS UNCHANGED. The unrelated club-operations migrations must not have
//     become applied as a side effect. With a `before` snapshot this is a true comparison;
//     without one it asserts they are absent, which is their known state. Either way the
//     workflow never touches them — this proves it.
//
// Read-only: this parses text captured from `supabase migration list`.

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolveMigration, PROTECTED_VERSIONS } from './lib/supabase-migration-allowlist.mjs';
import { hasSyncedTarget, describeSyncFailure, remoteVersions } from './lib/supabase-migration-history.mjs';

// True only when this file IS the entry point. Comparing resolved file URLs matters:
// a suffix check would also match test-verify-supabase-ledger.mjs, making the CLI
// block run during unit tests and read a dry-run file that does not exist.
function isDirectInvocation() {
  return Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
}

export function verifyLedger(afterOutput, targetFile, beforeOutput = null) {
  const migration = resolveMigration(targetFile);
  if (!migration) {
    return { ok: false, errors: [`Target "${targetFile}" is not on the production allowlist.`], notes: [] };
  }

  const errors = [];
  const notes = [];
  const after = remoteVersions(afterOutput);

  // 1. exact version, both columns
  const sync = hasSyncedTarget(afterOutput, migration.version);
  if (!sync.ok) {
    errors.push(describeSyncFailure(afterOutput, migration.version));
  } else {
    notes.push(`Local and Remote both report ${migration.version}.`);
  }

  // 2. prerequisites still applied
  for (const required of migration.requires) {
    if (after.has(required)) {
      notes.push(`Prerequisite ${required} is still applied.`);
    } else {
      errors.push(`Prerequisite ${required} is no longer present in the remote history.`);
    }
  }

  // 3. protected versions untouched
  const before = beforeOutput === null ? null : remoteVersions(beforeOutput);
  for (const version of PROTECTED_VERSIONS) {
    const isAfter = after.has(version);
    const wasBefore = before ? before.has(version) : false;

    if (before && isAfter !== wasBefore) {
      errors.push(
        `Protected migration ${version} changed state during this run ` +
          `(before: ${wasBefore ? 'applied' : 'absent'}, after: ${isAfter ? 'applied' : 'absent'}).`,
      );
    } else if (!before && isAfter) {
      errors.push(`Protected migration ${version} is applied remotely and no before-snapshot proves it predates this run.`);
    } else {
      notes.push(`Protected migration ${version} unchanged (${isAfter ? 'applied before this run' : 'still absent'}).`);
    }
  }

  return { ok: errors.length === 0, errors, notes, version: migration.version };
}

if (isDirectInvocation()) {
  const afterPath = process.argv[2];
  const target = process.argv[3];
  const beforePath = process.argv[4];

  let before = null;
  if (beforePath) {
    try {
      before = readFileSync(beforePath, 'utf8');
    } catch {
      before = null;
    }
  }

  const result = verifyLedger(readFileSync(afterPath, 'utf8'), target, before);
  for (const note of result.notes) console.log(`  ok  ${note}`);
  for (const error of result.errors) console.error(`  FAIL ${error}`);

  if (!result.ok) {
    console.error(`Ledger verification FAILED for ${target}.`);
    process.exit(1);
  }
  console.log(`Ledger verification passed for ${result.version}.`);
}
