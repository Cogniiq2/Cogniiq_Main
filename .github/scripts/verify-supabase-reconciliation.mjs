// CLI for the two reconciliation proofs in the isolated migration workspace.
//
//   node .github/scripts/verify-supabase-reconciliation.mjs fetched \
//     --remote-before <list.txt> --migrations-dir <dir> --target-version <14 digits>
//
//   node .github/scripts/verify-supabase-reconciliation.mjs final \
//     --final-list <list.txt> --migrations-dir <dir> --target <file.sql> \
//     --source-sha <sha> --staged-sha <sha> --restored-sha <sha>
//
// Reads captured text and a directory listing. Never contacts a database.

import { readFileSync, readdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolveMigration, PROTECTED_VERSIONS } from './lib/supabase-migration-allowlist.mjs';
import { verifyFetchedHistory, verifyIsolatedState, verifyTargetSha } from './lib/supabase-migration-reconcile.mjs';

function isDirectInvocation() {
  return Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith('--')) continue;
    args[argv[i].slice(2)] = argv[i + 1];
    i += 1;
  }
  return args;
}

function listMigrationFiles(dir) {
  // Only real files are considered; a directory inside supabase/migrations is not a
  // migration and must not be silently counted as one.
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();
}

function report(result, successLine) {
  for (const note of result.notes ?? []) console.log(`  ok   ${note}`);
  for (const error of result.errors ?? []) console.error(`  FAIL ${error}`);
  if (!result.ok) process.exit(1);
  console.log(successLine);
}

if (isDirectInvocation()) {
  const [phase, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);

  if (phase === 'fetched') {
    const result = verifyFetchedHistory({
      remoteBeforeOutput: readFileSync(args['remote-before'], 'utf8'),
      fetchedFilenames: listMigrationFiles(args['migrations-dir']),
      targetVersion: args['target-version'],
    });
    report(result, `Fetched history reconciles with the remote migration history (${result.fetchedCount ?? 0} version(s)).`);
  } else if (phase === 'final') {
    const migration = resolveMigration(args.target);
    if (!migration) {
      console.error(`Target "${args.target}" is not on the production allowlist.`);
      process.exit(1);
    }

    const sha = verifyTargetSha({
      sourceSha: args['source-sha'],
      stagedSha: args['staged-sha'],
      restoredSha: args['restored-sha'],
    });
    for (const note of sha.notes) console.log(`  ok   ${note}`);
    for (const error of sha.errors) console.error(`  FAIL ${error}`);

    const state = verifyIsolatedState({
      finalListOutput: readFileSync(args['final-list'], 'utf8'),
      migrationFilenames: listMigrationFiles(args['migrations-dir']),
      targetVersion: migration.version,
      requiredVersions: migration.requires,
      protectedVersions: PROTECTED_VERSIONS,
    });

    report(
      { ok: sha.ok && state.ok, errors: state.errors, notes: state.notes },
      `Isolated workspace proof passed: exactly one pending migration (${migration.version}).`,
    );
  } else {
    console.error('Usage: verify-supabase-reconciliation.mjs <fetched|final> [options]');
    process.exit(1);
  }
}
