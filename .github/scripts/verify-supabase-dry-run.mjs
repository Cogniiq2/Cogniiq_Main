// Gate: the dry run must propose EXACTLY ONE migration, and it must be the selected one.
//
//   node .github/scripts/verify-supabase-dry-run.mjs supabase-dry-run.txt <expected-migration>
//
// The expected filename is now REQUIRED rather than baked in, so this gate covers every
// allowlisted migration instead of only the receptionist one. It is deliberately strict in
// both directions: zero migrations means the push would be a no-op the operator did not
// expect, and two means something other than the isolated target became visible — which is
// precisely the failure that would let an unrelated pending migration reach production.
//
// This script never contacts the database. It reads text produced by an earlier step.

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { MIGRATION_FILENAME_PATTERN, resolveMigration } from './lib/supabase-migration-allowlist.mjs';

// True only when this file IS the entry point. Comparing resolved file URLs matters:
// a suffix check would also match test-verify-supabase-dry-run.mjs, making the CLI
// block run during unit tests and read a dry-run file that does not exist.
function isDirectInvocation() {
  return Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
}

export function verifyDryRun(output, expectedMigration) {
  if (typeof expectedMigration !== 'string' || !expectedMigration.trim()) {
    return { ok: false, error: 'An expected migration filename is required as the second argument.' };
  }

  const expected = expectedMigration.trim();
  if (!MIGRATION_FILENAME_PATTERN.test(expected)) {
    return {
      ok: false,
      error: `Expected migration "${expected}" is not a valid migration filename (want <14 digits>_<name>.sql).`,
    };
  }

  // Belt and braces: the workflow already resolved this through the allowlist, but a gate
  // that can be handed any well-formed filename is a gate that can be pointed anywhere.
  if (!resolveMigration(expected)) {
    return { ok: false, error: `Expected migration "${expected}" is not on the production allowlist.` };
  }

  const found = [...String(output ?? '').matchAll(/\b\d{14}_[A-Za-z0-9_.-]+\.sql\b/g)].map((m) => m[0]);
  const unique = [...new Set(found)];

  if (unique.length !== 1) {
    return {
      ok: false,
      error:
        `Apply mode requires exactly one pending migration filename in the dry-run output. Found ${unique.length}: ` +
        (unique.length ? unique.join(', ') : 'none'),
    };
  }

  if (unique[0] !== expected) {
    return { ok: false, error: `Apply mode expected ${expected}, but dry run proposed ${unique[0]}.` };
  }

  return { ok: true, migration: expected };
}

// Only run as a CLI when invoked directly, so the tests can import verifyDryRun.
if (isDirectInvocation()) {
  const dryRunPath = process.argv[2] ?? 'supabase-dry-run.txt';
  const expected = process.argv[3];
  const result = verifyDryRun(readFileSync(dryRunPath, 'utf8'), expected);

  if (!result.ok) {
    console.error(result.error);
    process.exit(1);
  }
  console.log(`Dry run contains exactly one pending migration: ${result.migration}`);
}
