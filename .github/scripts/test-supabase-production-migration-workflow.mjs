// Static checks for the Supabase production migration workflow.
//
// The workflow can write to the PRODUCTION database, so its safety structure is asserted
// here rather than trusted to review. The checks cover three things:
//
//  1. the allowlist in the YAML dropdown, the bash `case` and the canonical JS module all
//     agree exactly — a migration can never be selectable in one place and unknown in
//     another;
//  2. the isolated-workspace proof is intact, because it is what physically prevents an
//     unrelated pending migration from reaching production;
//  3. every gate still exists and still runs in the mode it belongs to.
//
// Nothing here touches a database.

import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { ALLOWED_MIGRATIONS, PROTECTED_VERSIONS, confirmationFor } from './lib/supabase-migration-allowlist.mjs';

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

function stepBlock(name) {
  const marker = `      - name: ${name}\n`;
  const start = workflowText.indexOf(marker);
  if (start === -1) fail(`Missing workflow step: ${name}`);
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

/* ------------------------------------------------------------------ YAML validity */

const workflow = yaml.load(workflowText);
assert(workflow && typeof workflow === 'object', 'Workflow YAML must parse to an object');
// `on:` is parsed by js-yaml as the boolean true (YAML 1.1), so accept either key.
const triggers = workflow.on ?? workflow[true];
assert(triggers && triggers.workflow_dispatch, 'Workflow must be workflow_dispatch only');
assert(!triggers.push && !triggers.pull_request && !triggers.schedule, 'Workflow must never run automatically');

const inputs = triggers.workflow_dispatch.inputs ?? {};
for (const required of ['source_ref', 'target_migration', 'mode', 'confirmation']) {
  assert(inputs[required], `Workflow must expose the ${required} input`);
}
assert(inputs.target_migration.type === 'choice', 'target_migration must be a choice input');
assert(inputs.mode.type === 'choice', 'mode must be a choice input');
assert(
  JSON.stringify(inputs.mode.options) === JSON.stringify(['audit-history', 'dry-run', 'apply']),
  'mode options drifted',
);
assert(inputs.source_ref.required === true, 'source_ref must remain required');
assert(inputs.source_ref.default !== 'main', 'source_ref must not be hard-coded to main');

/* ------------------------------------------------ allowlist agreement (3 copies) */

const canonicalFiles = ALLOWED_MIGRATIONS.map((m) => m.file);
assert(
  JSON.stringify(inputs.target_migration.options) === JSON.stringify(canonicalFiles),
  `target_migration options must equal the canonical allowlist.\n  yaml: ${JSON.stringify(inputs.target_migration.options)}\n  canonical: ${JSON.stringify(canonicalFiles)}`,
);

const resolveBlock = stepBlock('Resolve and validate selected migration');
for (const file of canonicalFiles) {
  assertIncludes(resolveBlock, `${file}) ;;`, `bash allowlist is missing ${file}`);
}
const caseEntries = [...resolveBlock.matchAll(/^\s{12}(\S+\.sql)\) ;;$/gm)].map((m) => m[1]);
assert(
  JSON.stringify(caseEntries) === JSON.stringify(canonicalFiles),
  `bash case allowlist must equal the canonical allowlist.\n  bash: ${JSON.stringify(caseEntries)}\n  canonical: ${JSON.stringify(canonicalFiles)}`,
);
assertIncludes(resolveBlock, 'not on the production allowlist', 'bash allowlist must reject unknown migrations');
assertIncludes(resolveBlock, "'^[0-9]{14}_[A-Za-z0-9_.-]+\\.sql$'", 'bash must re-validate the filename shape');
assertIncludes(resolveBlock, 'TARGET_MIGRATION_PATH=supabase/migrations/$SELECTED_MIGRATION', 'path must be derived, never taken as input');
assertIncludes(resolveBlock, 'target_version="${SELECTED_MIGRATION%%_*}"', 'version must be derived from the validated filename');
assertIncludes(resolveBlock, 'EXPECTED_CONFIRMATION=APPLY_MIGRATION_$target_version', 'confirmation must be derived from the version');
assertNotIncludes(workflowText, 'TARGET_MIGRATION_VERSION: ', 'version must not be a hard-coded env value any more');

/* ------------------------------------------------------------------ header + gates */

assertIncludes(workflowText, 'name: Supabase Production Migration', 'Workflow name drifted');
assertIncludes(workflowText, 'permissions:\n  contents: read', 'Workflow permissions must remain contents: read');
assertIncludes(workflowText, 'group: supabase-production-migration', 'Workflow concurrency group drifted');
assertIncludes(workflowText, 'ISOLATED_SOURCE_DIR: isolated-migration-source', 'Isolated source directory drifted');
assertStepIncludes('Checkout selected migration branch', 'path: migration-source', 'Selected migration branch must be checked out into migration-source');
assertStepIncludes('Verify expected migration exists', 'test -f "migration-source/$TARGET_MIGRATION_PATH"', 'Existence gate drifted');

/* ------------------------------------------------------------------ isolation proof */

// The invariant changed: "exactly one SQL file in the directory" was unsatisfiable, because
// db push refuses to run while the remote history holds versions with no local file. The
// directory is now emptied, repopulated from the real remote history by the READ-ONLY
// `migration fetch --linked`, and the target restored — leaving EXACTLY ONE local-only
// migration, which is what push actually acts on. These assertions pin that whole sequence.

const stageBlock = stepBlock('Stage target and empty the isolated migrations directory');
assertIncludes(stageBlock, "if: ${{ inputs.mode != 'audit-history' }}", 'Staging must run only outside audit-history mode');
assertIncludes(stageBlock, 'tar -C migration-source --exclude=.git -cf - . | tar -C "$isolated_root" -xf -', 'Staging must copy the selected source workspace');
assertIncludes(stageBlock, 'target_staging="$RUNNER_TEMP/$TARGET_MIGRATION"', 'Target must be parked OUTSIDE the migrations directory');
assertIncludes(stageBlock, 'source_sha="$(sha256sum "$source_migration"', 'Staging must hash the source migration');
assertIncludes(stageBlock, 'staged_sha="$(sha256sum "$target_staging"', 'Staging must hash the staged copy');
assertIncludes(stageBlock, 'rm -rf "$isolated_migrations"', 'Staging must empty the migrations directory completely');
assertIncludes(stageBlock, 'Isolated migrations directory is not empty', 'Staging must prove the directory is empty');
assertIncludes(stageBlock, 'Target must not be present in the migrations directory at this point.', 'Staging must prove the target is absent before the fetch');

const fetchBlock = stepBlock('Fetch remote migration history into the isolated workspace');
assertIncludes(fetchBlock, "if: ${{ inputs.mode != 'audit-history' }}", 'Fetch must run only outside audit-history mode');
assertIncludes(fetchBlock, 'supabase migration fetch --linked', 'Reconciliation must use the read-only migration fetch');
assertStepWorkingDirectory('Fetch remote migration history into the isolated workspace', 'isolated-migration-source');

const fetchedGate = stepBlock('Verify fetched history matches the remote history exactly');
assertIncludes(fetchedGate, 'verify-supabase-reconciliation.mjs fetched', 'Fetched-history audit must run');
assertIncludes(fetchedGate, '--remote-before supabase-migration-list.txt', 'Fetched-history audit must compare against the pre-fetch remote snapshot');
assertIncludes(fetchedGate, '--target-version "$TARGET_MIGRATION_VERSION"', 'Fetched-history audit must re-check the target is not already applied');

const restoreBlock = stepBlock('Restore the selected target migration');
assertIncludes(restoreBlock, 'cp "$TARGET_STAGING_PATH" "$restored"', 'Only the staged target may be restored');
assertIncludes(restoreBlock, 'restored_sha=', 'Restore must hash the restored file');
assertIncludes(restoreBlock, 'Target already exists in the reconciled workspace', 'Restore must refuse if the fetch produced the target');

const finalGate = stepBlock('Verify isolated workspace has exactly one pending migration');
assertIncludes(finalGate, 'verify-supabase-reconciliation.mjs final', 'Final isolation proof must run');
assertIncludes(finalGate, '--final-list supabase-migration-list-reconciled.txt', 'Final proof must read the post-reconciliation list');
assertIncludes(finalGate, '--source-sha "$TARGET_SOURCE_SHA"', 'Final proof must check the source SHA');
assertIncludes(finalGate, '--staged-sha "$TARGET_STAGED_SHA"', 'Final proof must check the staged SHA');
assertIncludes(finalGate, '--restored-sha "$TARGET_RESTORED_SHA"', 'Final proof must check the restored SHA');

for (const [earlier, later] of [
  ['Stage target and empty the isolated migrations directory', 'Fetch remote migration history into the isolated workspace'],
  ['Fetch remote migration history into the isolated workspace', 'Verify fetched history matches the remote history exactly'],
  ['Verify fetched history matches the remote history exactly', 'Restore the selected target migration'],
  ['Restore the selected target migration', 'List migration history after reconciliation'],
  ['List migration history after reconciliation', 'Verify isolated workspace has exactly one pending migration'],
  ['Verify isolated workspace has exactly one pending migration', 'Dry run migration push'],
]) {
  assert(
    workflowText.indexOf(`- name: ${earlier}`) < workflowText.indexOf(`- name: ${later}`),
    `${earlier} must run before ${later}`,
  );
}

/* ------------------------------------------------------------------ mode routing */

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

/* ------------------------------------------------------------------ dependency gate */

const depsBlock = stepBlock('Verify remote migration dependencies');
assertIncludes(depsBlock, "if: ${{ inputs.mode != 'audit-history' }}", 'Dependency gate must run for dry-run and apply');
assertIncludes(depsBlock, 'node .github/scripts/verify-supabase-migration-deps.mjs supabase-migration-list.txt "$TARGET_MIGRATION"', 'Dependency gate invocation drifted');
assert(
  workflowText.indexOf('- name: Verify remote migration dependencies') < workflowText.indexOf('- name: Dry run migration push'),
  'Dependency gate must run BEFORE the dry run, and therefore before any push',
);

/* ------------------------------------------------------------------ apply gates */

assertStepIncludes('Verify apply confirmation', "if: ${{ inputs.mode == 'apply' }}", 'Apply confirmation must run only in apply mode');
assertStepIncludes('Verify apply confirmation', '"$CONFIRMATION" != "$EXPECTED_CONFIRMATION"', 'Apply confirmation must compare against the derived value');
assertNotIncludes(workflowText, 'APPLY_RECEPTIONIST_PERSISTENCE', 'The receptionist-only confirmation string must be gone');
for (const generic of ['"YES"', '"APPLY"', '"CONFIRM"']) {
  assertNotIncludes(stepBlock('Verify apply confirmation'), generic, `Generic confirmation ${generic} must never be accepted`);
}

assertStepIncludes('Verify apply migration scope', "if: ${{ inputs.mode == 'apply' }}", 'Dry-run parser gate must run only in apply mode');
assertStepIncludes(
  'Verify apply migration scope',
  'node .github/scripts/verify-supabase-dry-run.mjs supabase-dry-run.txt "$TARGET_MIGRATION"',
  'Apply mode must pass the selected target to the dry-run parser gate',
);

const backupBlock = stepBlock('Verify backup / restore point exists');
assertIncludes(backupBlock, "if: ${{ inputs.mode == 'apply' }}", 'Backup gate must run only in apply mode');
assertIncludes(backupBlock, '/database/backups', 'Backup gate must call the documented read-only endpoint');
assertIncludes(backupBlock, "trap 'rm -f supabase-backups.json' EXIT", 'Backup gate must delete the raw response, including on failure');
assertIncludes(backupBlock, 'node .github/scripts/verify-supabase-backups.mjs supabase-backups.json "$http_status"', 'Backup gate must parse via the tested script');
assert(/--request\s+(POST|PUT|PATCH|DELETE)/.test(backupBlock) === false, 'Backup gate must be read-only');
assertNotIncludes(backupBlock, 'echo "$SUPABASE_ACCESS_TOKEN"', 'Backup gate must never print the access token');
assert(
  workflowText.indexOf('- name: Verify backup / restore point exists') < workflowText.indexOf('- name: Apply migration push'),
  'Backup gate must run BEFORE the push',
);

const applyBlock = stepBlock('Apply migration push');
assertIncludes(applyBlock, "if: ${{ inputs.mode == 'apply' }}", 'Final push must run only in apply mode');
assertIncludes(applyBlock, 'working-directory: isolated-migration-source', 'Final push must use the isolated workspace');
assertIncludes(applyBlock, 'run: supabase db push', 'Final push command must remain supabase db push without extra flags');

/* ------------------------------------------------------------------ post-apply */

const verifyAppliedBlock = stepBlock('Verify applied migration history');
assertIncludes(verifyAppliedBlock, "if: ${{ inputs.mode == 'apply' }}", 'Post-apply verification must run only in apply mode');
assertIncludes(verifyAppliedBlock, 'supabase migration list', 'Post-apply verification must list migration history again');
assertIncludes(verifyAppliedBlock, 'node .github/scripts/verify-supabase-ledger.mjs', 'Post-apply verification must use the tested ledger verifier');
assertIncludes(verifyAppliedBlock, 'supabase-migration-list.txt', 'Post-apply verification must pass the pre-push snapshot for comparison');
assertNotIncludes(verifyAppliedBlock, 'grep -Eq', 'Post-apply verification must not grep for the version anywhere in the output');

const advisorBlock = stepBlock('Report Supabase security advisors (read-only)');
assertIncludes(advisorBlock, '/advisors/security', 'Advisor step must call the documented endpoint');
assertIncludes(advisorBlock, 'continue-on-error: true', 'Advisor findings must be report-only and never fail the run');
assert(/--request\s+(POST|PUT|PATCH|DELETE)/.test(advisorBlock) === false, 'Advisor step must be read-only');

/* ------------------------------------------------------------------ global bans */

// Comments legitimately NAME the forbidden commands — the workflow documents WHY
// `migration repair` is refused — so only executable lines count. This mirrors how the
// finance SQL write-safety test separates commentary from code.
const executableWorkflow = workflowText
  .split('\n')
  .filter((line) => !line.trimStart().startsWith('#'))
  .join('\n');

assertNotIncludes(executableWorkflow, '--include-all', 'Workflow must not use --include-all');
assertNotIncludes(executableWorkflow, '--include-seed', 'Workflow must not use --include-seed');
assertNotIncludes(executableWorkflow, '--include-roles', 'Workflow must not use --include-roles');
assertNotIncludes(executableWorkflow, 'migration repair', 'Workflow must not run migration repair');
assertNotIncludes(executableWorkflow, 'db reset', 'Workflow must not run db reset');
assertNotIncludes(executableWorkflow, 'db pull', 'Workflow must not run db pull');
assertNotIncludes(executableWorkflow, 'migration up', 'Workflow must not run migration up');
assertNotIncludes(executableWorkflow, 'migration squash', 'Workflow must not run migration squash');

// `migration fetch` is the ONLY Supabase command the reconciliation design added. Pinning
// the whole command set means a future edit cannot quietly introduce another one — most
// importantly not `migration repair`, whose write to remote history is exactly what this
// design exists to avoid.
{
  const supabaseCommands = [
    // The second word is a subcommand, never a flag, so `--project-ref` is not captured.
    ...new Set([...executableWorkflow.matchAll(/supabase ([a-z]+(?: (?!--)[a-z-]+)?)/g)].map((m) => m[1])),
  ].sort();
  const allowed = ['db dump', 'db push', 'link', 'migration fetch', 'migration list'].sort();
  assert(
    JSON.stringify(supabaseCommands) === JSON.stringify(allowed),
    `Supabase commands drifted.\n  found:   ${JSON.stringify(supabaseCommands)}\n  allowed: ${JSON.stringify(allowed)}`,
  );
}
assertNotIncludes(workflowText, 'database/backups/restore', 'Workflow must never call a backup write endpoint');

// The protected club-operations migrations must never be selectable.
for (const version of PROTECTED_VERSIONS) {
  assert(
    !canonicalFiles.some((f) => f.startsWith(version)),
    `Protected migration ${version} must never appear on the allowlist`,
  );
  assertNotIncludes(inputs.target_migration.options.join(' '), version, `Protected migration ${version} must not be selectable`);
}

// Every allowlisted migration must have a file on disk and a derivable confirmation.
for (const migration of ALLOWED_MIGRATIONS) {
  assert(confirmationFor(migration.file) === `APPLY_MIGRATION_${migration.version}`, `Confirmation derivation drifted for ${migration.file}`);
  try {
    readFileSync(`supabase/migrations/${migration.file}`, 'utf8');
  } catch {
    fail(`Allowlisted migration ${migration.file} does not exist in supabase/migrations`);
  }
}

// Receptionist backward compatibility: the original use case must still be selectable.
assert(
  canonicalFiles.includes('20260711120000_receptionist_persistence.sql'),
  'The receptionist migration must remain supported',
);

console.log('supabase production migration workflow static checks passed');
