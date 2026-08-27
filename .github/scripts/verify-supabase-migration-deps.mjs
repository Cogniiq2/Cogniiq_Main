// Gate: the remote migration history must be in the right state BEFORE a push.
//
//   node .github/scripts/verify-supabase-migration-deps.mjs <migration-list.txt> <target.sql>
//
// Two things are checked, and both fail closed:
//
//  1. Every prerequisite of the selected migration is ALREADY applied remotely.
//     The Finance chain has real schema dependencies — M2 writes the `historical_entry`
//     column M1 adds, M3 replaces a function M2 creates — so an out-of-order push would
//     fail part-way through against production rather than being rejected up front.
//
//  2. The selected migration is NOT already applied remotely.
//     Re-pushing an applied version is not success; it means the operator's picture of
//     production is wrong, and continuing would report a no-op as a completed migration.
//
// Read-only: this parses text captured from `supabase migration list`.

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolveMigration } from './lib/supabase-migration-allowlist.mjs';
import { remoteVersions } from './lib/supabase-migration-history.mjs';

// True only when this file IS the entry point. Comparing resolved file URLs matters:
// a suffix check would also match test-verify-supabase-migration-deps.mjs, making the CLI
// block run during unit tests and read a dry-run file that does not exist.
function isDirectInvocation() {
  return Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
}

export function verifyDependencies(historyOutput, targetFile) {
  const migration = resolveMigration(targetFile);
  if (!migration) {
    return { ok: false, error: `Target "${targetFile}" is not on the production allowlist.` };
  }

  const remote = remoteVersions(historyOutput);

  if (remote.has(migration.version)) {
    return {
      ok: false,
      error:
        `Migration ${migration.version} is ALREADY applied in the remote history. ` +
        'Refusing to push it again — verify which environment you are targeting.',
    };
  }

  const missing = migration.requires.filter((v) => !remote.has(v));
  if (missing.length > 0) {
    return {
      ok: false,
      error:
        `Migration ${migration.version} requires ${migration.requires.join(', ')} to be applied first. ` +
        `Missing from the remote history: ${missing.join(', ')}.`,
    };
  }

  return {
    ok: true,
    version: migration.version,
    satisfied: migration.requires,
    remoteCount: remote.size,
  };
}

if (isDirectInvocation()) {
  const historyPath = process.argv[2];
  const target = process.argv[3];
  const result = verifyDependencies(readFileSync(historyPath, 'utf8'), target);

  if (!result.ok) {
    console.error(`Dependency gate FAILED: ${result.error}`);
    process.exit(1);
  }
  console.log(
    `Dependency gate passed for ${result.version}. ` +
      (result.satisfied.length
        ? `Prerequisites already applied: ${result.satisfied.join(', ')}.`
        : 'No prerequisites required.'),
  );
}
