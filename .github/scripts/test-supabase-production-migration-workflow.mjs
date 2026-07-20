import { readFileSync } from 'node:fs';

const workflowPath = '.github/workflows/supabase-production-migration.yml';
const workflowText = readFileSync(workflowPath, 'utf8');

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function assertIncludes(value, expected, message) {
  assert(String(value ?? '').includes(expected), message);
}

function assertNotIncludes(value, unexpected, message) {
  assert(!String(value ?? '').includes(unexpected), message);
}

function assertMatches(value, pattern, message) {
  assert(pattern.test(String(value ?? '')), message);
}

function stepBlock(name) {
  const marker = `      - name: ${name}\n`;
  const start = workflowText.indexOf(marker);

  if (start === -1) {
    fail(`Missing workflow step: ${name}`);
  }

  const rest = workflowText.slice(start + marker.length);
  const nextStep = rest.search(/\n      - name: /);

  return nextStep === -1 ? rest : rest.slice(0, nextStep);
}

function assertStepIncludes(name, expected, message) {
  assertIncludes(stepBlock(name), expected, message);
}

function assertStepWorkingDirectory(name, expectedDirectory) {
  assertStepIncludes(name, `working-directory: ${expectedDirectory}`, `${name} must run in ${expectedDirectory}`);
}

assertIncludes(workflowText, 'name: Supabase Production Migration', 'Workflow name drifted');
assertIncludes(workflowText, 'permissions:\n  contents: read', 'Workflow permissions must remain contents: read');
assertIncludes(workflowText, 'group: supabase-production-migration', 'Workflow concurrency group drifted');
assertIncludes(workflowText, 'TARGET_MIGRATION: 20260711120000_receptionist_persistence.sql', 'Target migration filename drifted');
assertIncludes(
  workflowText,
  'TARGET_MIGRATION_PATH: supabase/migrations/20260711120000_receptionist_persistence.sql',
  'Target migration path drifted'
);
assertIncludes(workflowText, 'TARGET_MIGRATION_VERSION: 20260711120000', 'Target migration version drifted');
assertIncludes(workflowText, 'ISOLATED_SOURCE_DIR: isolated-migration-source', 'Isolated source directory drifted');

assertStepIncludes('Checkout selected migration branch', 'path: migration-source', 'Selected migration branch must be checked out into migration-source');

const isolationBlock = stepBlock('Create isolated receptionist migration workspace');
assertIncludes(isolationBlock, "if: ${{ inputs.mode != 'audit-history' }}", 'Isolation must run only outside audit-history mode');
assertIncludes(isolationBlock, 'tar -C migration-source --exclude=.git -cf - . | tar -C "$isolated_root" -xf -', 'Isolation must copy the selected source workspace');
assertIncludes(isolationBlock, 'find "$isolated_migrations" -mindepth 1 -maxdepth 1 ! -name "$TARGET_MIGRATION" -exec rm -rf {} +', 'Isolation must remove every non-target migration directory entry');
assertIncludes(isolationBlock, 'if [ "${#remaining_entries[@]}" -ne 1 ]; then', 'Isolation must require exactly one directory entry');
assertIncludes(isolationBlock, 'if [ "${remaining_entries[0]}" != "$TARGET_MIGRATION" ]; then', 'Isolation must require the exact receptionist migration entry');
assertIncludes(isolationBlock, 'if [ "${#remaining_migrations[@]}" -ne 1 ]; then', 'Isolation must require exactly one SQL migration');
assertIncludes(isolationBlock, 'if [ "${remaining_migrations[0]}" != "$TARGET_MIGRATION" ]; then', 'Isolation must require the exact receptionist migration filename');
assertIncludes(isolationBlock, 'source_sha_before', 'Isolation must hash the source migration before copying');
assertIncludes(isolationBlock, 'source_sha_after', 'Isolation must verify the source migration was not modified');
assertIncludes(isolationBlock, 'isolated_sha_after', 'Isolation must verify the isolated migration was not modified');
assertIncludes(isolationBlock, 'Legacy migrations remain in the isolated workspace.', 'Isolation must fail if any legacy migration remains');

assertStepIncludes('Link Supabase project for audit', "if: ${{ inputs.mode == 'audit-history' }}", 'Audit link must run only in audit-history mode');
assertStepWorkingDirectory('Link Supabase project for audit', 'migration-source');
assertStepIncludes('List migration history for audit', "if: ${{ inputs.mode == 'audit-history' }}", 'Audit migration list must run only in audit-history mode');
assertStepWorkingDirectory('List migration history for audit', 'migration-source');
assertStepIncludes('Dump remote public schema for audit', "if: ${{ inputs.mode == 'audit-history' }}", 'Audit schema dump must run only in audit-history mode');
assertStepWorkingDirectory('Dump remote public schema for audit', 'migration-source');

assertStepIncludes('Link Supabase project for isolated migration', "if: ${{ inputs.mode != 'audit-history' }}", 'Dry-run/apply link must run only outside audit-history mode');
assertStepWorkingDirectory('Link Supabase project for isolated migration', 'isolated-migration-source');
assertStepIncludes('List migration history for isolated migration', "if: ${{ inputs.mode != 'audit-history' }}", 'Dry-run/apply migration list must run only outside audit-history mode');
assertStepWorkingDirectory('List migration history for isolated migration', 'isolated-migration-source');
assertStepIncludes('Dry run migration push', "if: ${{ inputs.mode != 'audit-history' }}", 'Dry run must run outside audit-history mode');
assertStepWorkingDirectory('Dry run migration push', 'isolated-migration-source');
assertStepIncludes('Dry run migration push', 'supabase db push --dry-run', 'Dry run must call supabase db push --dry-run');

assertStepIncludes('Verify apply confirmation', "if: ${{ inputs.mode == 'apply' }}", 'Apply confirmation must run only in apply mode');
assertStepIncludes('Verify apply confirmation', 'APPLY_RECEPTIONIST_PERSISTENCE', 'Apply confirmation phrase drifted');
assertStepIncludes('Verify apply migration scope', "if: ${{ inputs.mode == 'apply' }}", 'Dry-run parser gate must run only in apply mode');
assertStepIncludes(
  'Verify apply migration scope',
  'node .github/scripts/verify-supabase-dry-run.mjs supabase-dry-run.txt',
  'Apply mode must preserve the dry-run parser gate'
);

const applyBlock = stepBlock('Apply migration push');
assertIncludes(applyBlock, "if: ${{ inputs.mode == 'apply' }}", 'Final push must run only in apply mode');
assertIncludes(applyBlock, 'working-directory: isolated-migration-source', 'Final push must use the isolated workspace');
assertIncludes(applyBlock, 'run: supabase db push', 'Final push command must remain supabase db push without extra flags');

const verifyAppliedBlock = stepBlock('Verify applied migration history');
assertIncludes(verifyAppliedBlock, "if: ${{ inputs.mode == 'apply' }}", 'Post-apply verification must run only in apply mode');
assertIncludes(verifyAppliedBlock, 'working-directory: isolated-migration-source', 'Post-apply verification must use the isolated workspace');
assertIncludes(verifyAppliedBlock, 'supabase migration list', 'Post-apply verification must list migration history again');
assertIncludes(verifyAppliedBlock, `awk -F '|' -v target="$TARGET_MIGRATION_VERSION"`, 'Post-apply verification must parse Local and Remote columns with awk');
assertMatches(verifyAppliedBlock, /raw_row\s*=\s*\$0/, 'Post-apply verification must determine column layout from the raw row');
assertMatches(verifyAppliedBlock, /raw_row\s*~\s*\/\^\[\[:space:\]\]\*\\\|\//, 'Post-apply verification must detect leading-pipe table rows');
assertMatches(verifyAppliedBlock, /local_version\s*=\s*normalize\(\$2\)[\s\S]*remote_version\s*=\s*normalize\(\$3\)/, 'Leading-pipe rows must parse Local from field $2 and Remote from field $3');
assertMatches(verifyAppliedBlock, /local_version\s*=\s*normalize\(\$1\)[\s\S]*remote_version\s*=\s*normalize\(\$2\)/, 'Rows without a leading pipe must parse Local from field $1 and Remote from field $2');
assertNotIncludes(verifyAppliedBlock, 'local_version == ""', 'Post-apply verification must not shift columns merely because Local is blank');
assertMatches(verifyAppliedBlock, /remote_version\s*==\s*target/, 'Post-apply verification must require the Remote column to match the target');
assertIncludes(verifyAppliedBlock, 'found_synced', 'Post-apply verification must succeed only when Local and Remote are both present');
assertIncludes(verifyAppliedBlock, '$TARGET_MIGRATION_VERSION', 'Post-apply verification must use the target migration version env var');
assertIncludes(verifyAppliedBlock, 'Remote column was blank or missing', 'Post-apply verification must explain local-only or blank-remote failures');
assertIncludes(verifyAppliedBlock, 'Target migration was not found in the Local column', 'Post-apply verification must explain missing target-row failures');
assertNotIncludes(verifyAppliedBlock, 'grep -Eq', 'Post-apply verification must not grep for the version anywhere in the output');

assertNotIncludes(workflowText, '--include-all', 'Workflow must not use --include-all');
assertNotIncludes(workflowText, '--include-seed', 'Workflow must not use --include-seed');
assertNotIncludes(workflowText, '--include-roles', 'Workflow must not use --include-roles');
assertNotIncludes(workflowText, 'migration repair', 'Workflow must not run migration repair');
assertNotIncludes(workflowText, 'db reset', 'Workflow must not run db reset');

function normalizeMigrationVersion(value) {
  return String(value ?? '').replace(/[^0-9]/g, '');
}

function migrationHistoryHasSyncedTarget(output, target) {
  let foundLocal = false;
  let foundSynced = false;

  for (const row of output.split(/\r?\n/)) {
    const fields = row.split('|');
    let localVersion;
    let remoteVersion;

    if (/^[ \t]*\|/.test(row)) {
      localVersion = normalizeMigrationVersion(fields[1]);
      remoteVersion = normalizeMigrationVersion(fields[2]);
    } else {
      localVersion = normalizeMigrationVersion(fields[0]);
      remoteVersion = normalizeMigrationVersion(fields[1]);
    }

    if (localVersion === target) {
      foundLocal = true;

      if (remoteVersion === target) {
        foundSynced = true;
      }
    }
  }

  return { foundLocal, foundSynced, ok: foundSynced };
}

function assertMigrationHistoryParser(name, output, expectedOk) {
  const result = migrationHistoryHasSyncedTarget(output, '20260711120000');

  if (result.ok !== expectedOk) {
    fail(`${name} expected ok=${expectedOk}, received ${JSON.stringify(result)}`);
  }
}

assertMigrationHistoryParser(
  'no-leading-pipe local and remote both populated',
  `
  Local | Remote | Time (UTC)
  20260711120000 | 20260711120000 | 2026-07-20
  `,
  true
);
assertMigrationHistoryParser(
  'leading-pipe local and remote both populated',
  `
  | Local          | Remote         | Time (UTC) |
  |----------------|----------------|------------|
  | \`20260711120000\` | \`20260711120000\` | 2026-07-20 |
  `,
  true
);
assertMigrationHistoryParser(
  'no-leading-pipe local populated and remote blank',
  `
  Local | Remote | Time (UTC)
  20260711120000 |        | 2026-07-20
  `,
  false
);
assertMigrationHistoryParser(
  'leading-pipe local blank remote target time normalizes to target',
  `
  | Local          | Remote | Time (UTC) |
  |----------------|--------|------------|
  |                | 20260711120000 | 2026-07-11 12:00:00 |
  `,
  false
);
assertMigrationHistoryParser(
  'remote target only',
  `
  | Local          | Remote         | Time (UTC) |
  |----------------|----------------|------------|
  |                | 20260711120000 | 2026-07-20 |
  `,
  false
);
assertMigrationHistoryParser(
  'local and remote differ',
  `
  Local | Remote | Time (UTC)
  20260711120000 | 20260710133000 | 2026-07-20
  `,
  false
);
assertMigrationHistoryParser(
  'malformed or missing target row',
  `
  Local | Remote | Time (UTC)
  malformed output without the target local row
  `,
  false
);

console.log('supabase production migration workflow static checks passed');
