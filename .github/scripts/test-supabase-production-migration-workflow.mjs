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
import { EXPECTED_BACKUP_FILES, dumpInvocation } from './verify-supabase-logical-backup.mjs';

const workflowPath = '.github/workflows/supabase-production-migration.yml';
// Normalised to LF. Every assertion below anchors on "\n"-terminated markers, so on a
// Windows checkout (where git hands out CRLF) the raw text matched nothing and the gate
// failed for a reason that had nothing to do with the workflow. The repository's other
// migration tests already normalise the same way.
const workflowText = readFileSync(workflowPath, 'utf8').replace(/\r\n/g, '\n');

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

/*
  source_ref is deliberately NOT constrained to (or away from) any particular branch.

  An earlier version asserted `default !== 'main'`, which protected nothing: the default is a
  pre-filled value in a dispatch form, and a workflow_dispatch API call can send any ref
  regardless. Treating one branch name as dangerous and every other one as safe is security
  theatre — and it blocked the legitimate long-term default while still permitting the same run
  to be started by typing `main` by hand.

  What actually has to hold is that the ref is honoured EXACTLY and that nothing downstream is
  relaxed because of what it is. Both operating modes depend on that:
    - a pre-merge run from a feature branch, and
    - a post-merge run from main
  must behave identically. The assertions below pin that, and every real gate (allowlist,
  filename validation, derived confirmation, dependency gate, isolation invariant, dry run,
  backup/encryption/restore-point) is asserted elsewhere in this file and applies to every ref.
*/
{
  const checkout = stepBlock('Checkout selected migration branch');
  assertIncludes(checkout, 'ref: ${{ inputs.source_ref }}', 'The selected ref must be checked out verbatim');
  assertIncludes(checkout, 'path: migration-source', 'The selected ref must be checked out into its own directory');

  // No step may pin a ref of its own, which would silently act on something other than the
  // operator's selection.
  const pinnedRefs = [...workflowText.matchAll(/^\s*ref: (.+)$/gm)].map((m) => m[1].trim());
  assert(
    pinnedRefs.every((ref) => ref === '${{ inputs.source_ref }}'),
    `Every checkout must use the selected ref, found: ${JSON.stringify(pinnedRefs)}`,
  );

  // The existence gate is what makes a wrong ref fail closed: the run stops before linking if
  // the selected migration is not present in the ref that was actually checked out.
  assertStepIncludes(
    'Verify expected migration exists',
    'test -f "migration-source/$TARGET_MIGRATION_PATH"',
    'The selected ref must be proven to contain the selected migration',
  );
  assert(
    workflowText.indexOf('- name: Verify expected migration exists') <
      workflowText.indexOf('- name: Link Supabase project'),
    'The existence gate must run before any Supabase connection is made',
  );

  // Nothing downstream may branch on WHICH ref was selected: every gate applies to all refs.
  assertNotIncludes(workflowText, "inputs.source_ref == 'main'", 'No gate may be conditional on the selected ref');
  assertNotIncludes(workflowText, "inputs.source_ref != 'main'", 'No gate may be conditional on the selected ref');
}

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

/* ------------------------------------------------ restore-point evidence (apply mode) */

// A FREE-plan project has neither daily backups nor PITR, so the recovery artifact is a
// same-run logical backup. And this repository is PUBLIC, so that backup must be ENCRYPTED
// before it is uploaded and the plaintext must never exist anywhere an artifact path can
// reach. These assertions pin the whole chain: dump to $RUNNER_TEMP, verify, encrypt, prove
// the encryption reverses, upload only ciphertext, destroy the plaintext, then gate.
//
// The single most important assertion in this file is that no plaintext dump filename can be
// part of the uploaded artifact. Everything else supports it.

const managedBackupStep = 'Check managed Supabase backup / PITR availability (read-only)';
const backupBlock = stepBlock(managedBackupStep);
assertIncludes(backupBlock, "if: ${{ inputs.mode == 'apply' }}", 'Managed backup check must run only in apply mode');
assertIncludes(backupBlock, 'id: managed_backup', 'Managed backup check must expose its outcome to the gate');
assertIncludes(backupBlock, 'continue-on-error: true', 'Managed backup check must not stop the run on a Free plan; the gate decides');
assertIncludes(backupBlock, '/database/backups', 'Managed backup check must call the documented read-only endpoint');
assertIncludes(backupBlock, "trap 'rm -f supabase-backups.json' EXIT", 'Managed backup check must delete the raw response, including on failure');
assertIncludes(backupBlock, 'node .github/scripts/verify-supabase-backups.mjs supabase-backups.json "$http_status"', 'Managed backup check must parse via the tested script');
assert(/--request\s+(POST|PUT|PATCH|DELETE)/.test(backupBlock) === false, 'Managed backup check must be read-only');
assertNotIncludes(backupBlock, 'echo "$SUPABASE_ACCESS_TOKEN"', 'Managed backup check must never print the access token');

const dumpBlock = stepBlock('Create Free-plan logical production backup');
assertIncludes(dumpBlock, "if: ${{ inputs.mode == 'apply' }}", 'Logical backup must be taken only in apply mode');
assertIncludes(dumpBlock, 'id: logical_backup', 'Logical backup step must expose its outcome to the gate');
assertIncludes(dumpBlock, 'working-directory: isolated-migration-source', 'Logical backup must run where the project is linked');
assertIncludes(dumpBlock, 'SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}', 'Logical backup needs the DB password in the environment');
// Plaintext dumps must land OUTSIDE $GITHUB_WORKSPACE. That is what makes it impossible for
// an artifact path, a glob or a stray `git add` to publish production data from a public repo.
assertIncludes(dumpBlock, 'backup_dir="$RUNNER_TEMP/$PLAINTEXT_BACKUP_SUBDIR"', 'Plaintext dumps must be written under $RUNNER_TEMP, never in the workspace');
assertNotIncludes(dumpBlock, 'backup_dir="$GITHUB_WORKSPACE', 'Plaintext dumps must never be written into the workspace');
assertNotIncludes(dumpBlock, `$BACKUP_DIR"\n`, 'The dump step must not write into the upload directory');
assertIncludes(dumpBlock, 'supabase db dump --linked "$@" -f "$backup_dir/$name"', 'Every dump must go through the single --linked helper');
assertIncludes(dumpBlock, 'echo "__complete__=0" >> "$status_file"', 'Logical backup must write its completion sentinel');
assertIncludes(dumpBlock, 'BACKUP_CREATED_AT_UTC=$(date -u ', 'Logical backup must stamp a UTC timestamp for the manifest');

// The password must never reach a command line, where it would land in the step log and the
// process table. `--linked` plus the environment variable is the only accepted shape.
assertNotIncludes(dumpBlock, '--db-url', 'Logical backup must never pass a connection URL containing the password');
assertNotIncludes(dumpBlock, '$SUPABASE_DB_PASSWORD', 'Logical backup must never interpolate the password into a command');
assertNotIncludes(workflowText, '${{ secrets.SUPABASE_DB_PASSWORD }}"$', 'Secrets must never be concatenated into a URL');

// The dumped bundle is derived from the gate's own table, so the YAML and the verifier can
// never disagree about which files exist or how they were produced.
for (const expected of EXPECTED_BACKUP_FILES) {
  const invocation = dumpInvocation(expected);
  if (invocation === null) {
    assertIncludes(dumpBlock, `"$backup_dir/${expected.name}"`, `${expected.name} must be placed into the bundle`);
    assertIncludes(dumpBlock, `echo "${expected.name}=0" >> "$status_file"`, `${expected.name} must record a status line`);
  } else {
    assertIncludes(dumpBlock, `${invocation}\n`, `Logical backup must dump ${expected.name} with: ${invocation}`);
  }
}
assert(
  [...dumpBlock.matchAll(/^ {10}run_dump .+$/gm)].length ===
    EXPECTED_BACKUP_FILES.filter((f) => dumpInvocation(f) !== null).length,
  'The workflow must dump exactly the files the logical backup gate expects — no more, no fewer',
);

// The migration ledger copied into the bundle must be the post-reconciliation snapshot, which
// is the state production is in at the moment the migration is about to write.
assertIncludes(dumpBlock, 'supabase-migration-list-reconciled.txt" "$backup_dir/migrations-ledger.txt"', 'The bundle must carry the pre-migration ledger');

const verifyBackupBlock = stepBlock('Verify logical backup and write manifest');
assertIncludes(verifyBackupBlock, 'id: logical_backup_verify', 'Backup verification must expose its outcome to the gate');
assertIncludes(verifyBackupBlock, 'node .github/scripts/verify-supabase-logical-backup.mjs', 'Backup verification must use the tested script');
assertIncludes(verifyBackupBlock, '--dir "$RUNNER_TEMP/$PLAINTEXT_BACKUP_SUBDIR"', 'Backup verification must read the plaintext bundle from $RUNNER_TEMP');
assertIncludes(verifyBackupBlock, '--status "$RUNNER_TEMP/$PLAINTEXT_BACKUP_SUBDIR/dump-status.txt"', 'Backup verification must check the recorded dump exit statuses');
assertIncludes(verifyBackupBlock, '--manifest "$BACKUP_DIR/manifest.json"', 'The manifest must be written to the upload directory');
assertIncludes(verifyBackupBlock, '--checksums "$RUNNER_TEMP/$PLAINTEXT_BACKUP_SUBDIR/SHA256SUMS.txt"', 'Plaintext checksums must stay beside the plaintext, never in the artifact');
assertIncludes(verifyBackupBlock, '--ledger supabase-migration-list-reconciled.txt', 'Backup verification must record the pre-migration ledger head');
assertIncludes(verifyBackupBlock, '--target-migration "$TARGET_MIGRATION"', 'Backup verification must record which migration the backup precedes');

/* ------------------------------------------------------------ encryption + round trip */

const encryptBlock = stepBlock('Encrypt the backup and prove it decrypts');
assertIncludes(encryptBlock, "if: ${{ inputs.mode == 'apply' }}", 'Encryption must run only in apply mode');
assertIncludes(encryptBlock, 'id: logical_backup_encrypt', 'Encryption must expose its outcome to the gate');
assertIncludes(encryptBlock, 'SUPABASE_BACKUP_PASSPHRASE: ${{ secrets.SUPABASE_BACKUP_PASSPHRASE }}', 'Encryption must read the dedicated backup passphrase secret');
assertIncludes(encryptBlock, 'if [ -z "${SUPABASE_BACKUP_PASSPHRASE:-}" ]; then', 'Encryption must fail closed when the passphrase secret is empty');
assertIncludes(encryptBlock, 'Refusing to produce an unencrypted production backup', 'The refusal must say why');

// Strong, AUTHENTICATED, reputable, and present on ubuntu-latest.
//
// `--force-ocb` is load-bearing, not cosmetic. Without it GnuPG's symmetric mode is CFB with
// an MDC — integrity-checked but NOT authenticated encryption — and the manifest and restore
// notes would be describing a stronger construction than the archive actually uses. The
// encryption verifier also fails on a non-OCB archive, so this is the second of two
// independent checks on the same property.
assertIncludes(encryptBlock, '--symmetric --force-ocb --cipher-algo AES256', 'The archive must use AES-256 with OCB authenticated encryption');
assertIncludes(encryptBlock, '--s2k-mode 3', 'Key derivation must use an iterated-and-salted S2K');
assertIncludes(encryptBlock, '--s2k-digest-algo SHA512', 'Key derivation must use SHA-512');

// gpg-agent must not cache the backup passphrase beyond the two commands that need it.
{
  const gpgInvocations = [...encryptBlock.matchAll(/^\s*gpg .*$/gm)].map((m) => m[0]);
  assert(gpgInvocations.length === 2, `Expected exactly two gpg invocations (encrypt + round-trip decrypt), found ${gpgInvocations.length}`);
  for (const invocation of gpgInvocations) {
    assertIncludes(invocation, '--no-symkey-cache', `Every gpg invocation must disable the symmetric key cache: ${invocation.trim()}`);
  }
}

// The workflow must never claim AEAD in prose while producing a non-AEAD archive. Any comment
// asserting authenticated encryption is only permitted alongside the flag that delivers it.
{
  const claimsAead = /\bAEAD\b|authenticated encryption/i.test(encryptBlock);
  const usesOcb = encryptBlock.includes('--force-ocb');
  assert(!claimsAead || usesOcb, 'The workflow claims authenticated encryption without using --force-ocb');
  assertNotIncludes(
    encryptBlock,
    'the SEIPD packet carries an integrity check',
    'An MDC integrity check must not be described as authenticated encryption',
  );
}

// Binary output only: the verifier reads the packet mode from the bytes, which it cannot do
// through ASCII armor.
assertNotIncludes(encryptBlock, '--armor', 'The archive must be binary OpenPGP so its packet mode can be verified');

// THE passphrase rule: never in argv, never a filename, never echoed.
assertIncludes(encryptBlock, '--passphrase-fd 0', 'The passphrase must be supplied on a file descriptor');
assertNotIncludes(encryptBlock, '--passphrase ', 'The passphrase must never be a command-line argument');
assertNotIncludes(encryptBlock, '--passphrase=', 'The passphrase must never be a command-line argument');
assertNotIncludes(encryptBlock, '--passphrase-file', 'The passphrase path must not be an argv element either');
assertNotIncludes(encryptBlock, 'echo "$SUPABASE_BACKUP_PASSPHRASE"', 'The passphrase must never be echoed');
assertIncludes(encryptBlock, 'umask 077', 'The passphrase file must be created with a restrictive umask');
assertIncludes(encryptBlock, "printf '%s' \"$SUPABASE_BACKUP_PASSPHRASE\" > \"$key_dir/passphrase\"", 'The passphrase must be written to the locked file, not passed inline');
assertIncludes(encryptBlock, 'export GNUPGHOME=', 'gpg must not use the runner home directory');
assertIncludes(encryptBlock, 'trap cleanup EXIT', 'Key material must be destroyed on every exit path, including failure');
assertIncludes(encryptBlock, 'shred -u "$key_dir/passphrase"', 'The passphrase file must be shredded, not merely unlinked');

// Round trip: decrypt with the same secret and compare against the pre-encryption hashes.
assertIncludes(encryptBlock, '--decrypt --output "$roundtrip_dir/roundtrip.tar.gz"', 'The archive must be decrypted in the same run');
assertIncludes(encryptBlock, 'tar -xzf "$roundtrip_dir/roundtrip.tar.gz" -C "$roundtrip_dir"', 'The decrypted archive must be extracted for hashing');
assertIncludes(encryptBlock, 'node .github/scripts/verify-supabase-backup-encryption.mjs', 'The round trip must be verified by the tested script');
assertIncludes(encryptBlock, '--decrypted "$roundtrip_dir"', 'The verifier must be given the decrypted copies');
assertIncludes(encryptBlock, '--artifact-dir "$GITHUB_WORKSPACE/$BACKUP_DIR"', 'The verifier must audit the upload directory contents');
assertIncludes(encryptBlock, 'rm -rf "$roundtrip_dir"', 'Decrypted verification copies must be destroyed immediately');
assertIncludes(encryptBlock, 'rm -f "$tar_archive"', 'The plaintext tarball must not outlive the encryption');

/* --------------------------------------------------------------------- artifact upload */

const uploadBackupBlock = stepBlock('Upload encrypted production backup artifact');
assertIncludes(uploadBackupBlock, 'id: logical_backup_artifact', 'Artifact upload must expose its outcome to the gate');
assertIncludes(uploadBackupBlock, 'uses: actions/upload-artifact@v4', 'The backup must be stored as a GitHub Actions artifact');
assertIncludes(uploadBackupBlock, 'name: supabase-production-backup-${{ github.run_id }}-${{ github.run_attempt }}', 'The artifact name must be run-specific');
assertIncludes(uploadBackupBlock, 'if-no-files-found: error', 'An empty artifact must not be reported as a successful upload');
{
  const retention = /retention-days: (\d+)/.exec(uploadBackupBlock);
  assert(retention, 'The backup artifact must set a retention period');
  assert(Number(retention[1]) === 14, `Backup artifact retention must be 14 days (got ${retention[1]})`);
}

// THE assertion this whole design exists for: no plaintext dump may be reachable from the
// uploaded path. The upload path is the workspace-relative artifact directory; every plaintext
// file lives under $RUNNER_TEMP, which that path cannot reach.
{
  const uploadPath = /path: (\S+)/.exec(uploadBackupBlock);
  assert(uploadPath, 'The artifact upload must declare a path');
  const declaredBackupDir = /BACKUP_DIR: (\S+)/.exec(workflowText);
  const declaredPlaintextDir = /PLAINTEXT_BACKUP_SUBDIR: (\S+)/.exec(workflowText);
  assert(declaredBackupDir && declaredPlaintextDir, 'The workflow must declare BACKUP_DIR and PLAINTEXT_BACKUP_SUBDIR');
  assert(uploadPath[1] === declaredBackupDir[1], `The artifact must upload only ${declaredBackupDir[1]} (got ${uploadPath[1]})`);
  assert(declaredBackupDir[1] !== declaredPlaintextDir[1], 'The upload directory must not be the plaintext directory');
  assertIncludes(readFileSync('.gitignore', 'utf8'), `${declaredBackupDir[1]}/`, 'The upload directory must be git-ignored');

  for (const expected of EXPECTED_BACKUP_FILES) {
    assertNotIncludes(uploadBackupBlock, expected.name, `The upload step must never name the plaintext file ${expected.name}`);
  }
  // The plaintext directory is under $RUNNER_TEMP, which is outside $GITHUB_WORKSPACE and so
  // outside anything a workspace-relative artifact path can address.
  assertIncludes(dumpBlock, '$RUNNER_TEMP/$PLAINTEXT_BACKUP_SUBDIR', 'Plaintext must live under $RUNNER_TEMP');
  assertNotIncludes(uploadBackupBlock, 'RUNNER_TEMP', 'The artifact upload must never reach into $RUNNER_TEMP');
}

/* ------------------------------------------------------------------- plaintext cleanup */

const cleanupBlock = stepBlock('Remove all plaintext production dumps');
assertIncludes(cleanupBlock, 'id: plaintext_cleanup', 'Plaintext cleanup must expose its outcome to the gate');
assertNotIncludes(cleanupBlock, 'continue-on-error', 'A failure to destroy production data must stop the run');
assertIncludes(cleanupBlock, 'rm -rf "$RUNNER_TEMP/$PLAINTEXT_BACKUP_SUBDIR"', 'Cleanup must remove the plaintext bundle');
assertIncludes(cleanupBlock, '"$RUNNER_TEMP/$ROUNDTRIP_SUBDIR"', 'Cleanup must remove the decrypted verification copies');
assertIncludes(cleanupBlock, '"$RUNNER_TEMP/$BACKUP_KEY_SUBDIR"', 'Cleanup must remove the key material directory');
assertIncludes(cleanupBlock, 'Plaintext production data still present after cleanup', 'Cleanup must PROVE the plaintext is gone, not assume it');
assertIncludes(cleanupBlock, 'Plaintext dump files found in the artifact directory', 'Cleanup must re-check the artifact directory before the write');

const safetyNetBlock = stepBlock('Remove plaintext production data (safety net)');
assertIncludes(safetyNetBlock, 'if: always()', 'A safety-net cleanup must run even when a prior step failed');
assertIncludes(safetyNetBlock, 'rm -rf "$RUNNER_TEMP/$PLAINTEXT_BACKUP_SUBDIR"', 'The safety net must remove the plaintext bundle');
assertIncludes(safetyNetBlock, 'shred -u "$RUNNER_TEMP/$BACKUP_KEY_SUBDIR/passphrase"', 'The safety net must shred any surviving key material');

/* ----------------------------------------------------------------------- the gate */

const restorePointBlock = stepBlock('Verify a restore point exists before writing');
assertIncludes(restorePointBlock, "if: ${{ inputs.mode == 'apply' }}", 'Restore-point gate must run only in apply mode');
assertNotIncludes(restorePointBlock, 'continue-on-error', 'The restore-point gate itself must be able to stop the run');
assertIncludes(restorePointBlock, 'node .github/scripts/verify-supabase-restore-point.mjs', 'Restore-point gate must use the tested script');
for (const signal of [
  '--managed "${{ steps.managed_backup.outcome }}"',
  '--logical-dump "${{ steps.logical_backup.outcome }}"',
  '--logical-verify "${{ steps.logical_backup_verify.outcome }}"',
  '--encryption "${{ steps.logical_backup_encrypt.outcome }}"',
  '--artifact "${{ steps.logical_backup_artifact.outcome }}"',
  '--plaintext-cleanup "${{ steps.plaintext_cleanup.outcome }}"',
  '--manifest "$BACKUP_DIR/manifest.json"',
  '--run-id "${{ github.run_id }}"',
  '--run-attempt "${{ github.run_attempt }}"',
]) {
  assertIncludes(restorePointBlock, signal, `Restore-point gate must be given ${signal}`);
}

// Ordering is the load-bearing part. The backup is taken after the project is linked and after
// every isolation gate; it is verified, encrypted, round-tripped and uploaded, and the
// plaintext is destroyed, all BEFORE anything can write.
for (const [earlier, later] of [
  ['Link Supabase project for isolated migration', 'Create Free-plan logical production backup'],
  ['Verify isolated workspace has exactly one pending migration', 'Create Free-plan logical production backup'],
  ['Dry run migration push', 'Create Free-plan logical production backup'],
  ['Verify apply migration scope', 'Create Free-plan logical production backup'],
  ['Create Free-plan logical production backup', 'Verify logical backup and write manifest'],
  ['Verify logical backup and write manifest', 'Encrypt the backup and prove it decrypts'],
  ['Encrypt the backup and prove it decrypts', 'Upload encrypted production backup artifact'],
  ['Upload encrypted production backup artifact', 'Remove all plaintext production dumps'],
  ['Remove all plaintext production dumps', 'Verify a restore point exists before writing'],
  ['Verify a restore point exists before writing', 'Apply migration push'],
  [managedBackupStep, 'Verify a restore point exists before writing'],
]) {
  assert(
    workflowText.indexOf(`- name: ${earlier}`) < workflowText.indexOf(`- name: ${later}`),
    `${earlier} must run before ${later}`,
  );
}

// The passphrase must be demanded BEFORE production is read. A run that dumped production and
// only then discovered it could not encrypt the result would have created the very plaintext
// this design exists to prevent.
{
  const secretsBlock = stepBlock('Verify required Supabase secrets are configured');
  assertIncludes(secretsBlock, 'SUPABASE_BACKUP_PASSPHRASE: ${{ secrets.SUPABASE_BACKUP_PASSPHRASE }}', 'The passphrase secret must be checked up front');
  assertIncludes(secretsBlock, 'if [ "$MODE" = "apply" ] && [ -z "${SUPABASE_BACKUP_PASSPHRASE:-}" ]; then', 'Apply mode must refuse to start without the passphrase');
  assert(
    workflowText.indexOf('- name: Verify required Supabase secrets are configured') <
      workflowText.indexOf('- name: Create Free-plan logical production backup'),
    'The passphrase must be verified before any production data is read',
  );
}

// No passphrase may appear anywhere in the workflow except as a secrets reference and the
// locked-file plumbing. In particular it may never be an argv element of any command.
{
  const executableLines = workflowText.split('\n').filter((line) => !line.trimStart().startsWith('#'));
  for (const line of executableLines) {
    if (!line.includes('SUPABASE_BACKUP_PASSPHRASE')) continue;
    const allowed =
      line.includes('${{ secrets.SUPABASE_BACKUP_PASSPHRASE }}') ||
      line.includes('-z "${SUPABASE_BACKUP_PASSPHRASE:-}"') ||
      line.includes("printf '%s' \"$SUPABASE_BACKUP_PASSPHRASE\" > \"$key_dir/passphrase\"") ||
      line.includes('SUPABASE_BACKUP_PASSPHRASE is not configured') ||
      line.includes('SUPABASE_BACKUP_PASSPHRASE is empty');
    assert(allowed, `The backup passphrase is used in an unapproved way: ${line.trim()}`);
  }
}

// The CLI version recorded in the manifest must be the CLI that actually ran.
{
  const declared = /SUPABASE_CLI_VERSION: (\S+)/.exec(workflowText);
  const pinned = /uses: supabase\/setup-cli@v1[\s\S]*?version: (\S+)/.exec(workflowText);
  assert(declared && pinned, 'The Supabase CLI version must be both pinned and declared');
  assert(declared[1] === pinned[1], `SUPABASE_CLI_VERSION (${declared?.[1]}) must equal the pinned CLI version (${pinned?.[1]})`);
}

// The CLI version recorded in the manifest must be the CLI that actually ran.
{
  const declared = /SUPABASE_CLI_VERSION: (\S+)/.exec(workflowText);
  const pinned = /uses: supabase\/setup-cli@v1[\s\S]*?version: (\S+)/.exec(workflowText);
  assert(declared && pinned, 'The Supabase CLI version must be both pinned and declared');
  assert(declared[1] === pinned[1], `SUPABASE_CLI_VERSION (${declared?.[1]}) must equal the pinned CLI version (${pinned?.[1]})`);
}

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
