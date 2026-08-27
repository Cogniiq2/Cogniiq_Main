// Reconciliation proofs for the isolated migration workspace.
//
// WHY THIS EXISTS
// ---------------
// The original isolation invariant was "exactly one SQL file exists in supabase/migrations".
// It is unsatisfiable: `supabase db push` refuses to run when the remote history contains
// versions with no corresponding local file ("Remote migration versions not found in local
// migrations directory"), and this production database has remote-only versions — including
// two whose SQL exists nowhere in the repository.
//
// The CLI's own suggested remedy, `migration repair --status reverted`, MUTATES the remote
// migration history. That is forbidden here, so the workspace is instead populated from the
// real remote history with the read-only `supabase migration fetch --linked`, and the
// invariant is replaced by a strictly stronger one:
//
//     EXACTLY ONE local-only migration exists, and it is the selected target.
//
// "Local-only" is what `db push` actually acts on, so this bounds the push directly rather
// than bounding the directory and hoping that implies it. Every other local file corresponds
// to a version already applied remotely, which push skips by definition.
//
// Nothing in this module performs I/O or touches a database; it takes captured text and
// filename lists and returns verdicts, so every branch is testable from fixtures.

import { MIGRATION_FILENAME_PATTERN } from './supabase-migration-allowlist.mjs';
import { parseMigrationHistory, remoteVersions, localVersions } from './supabase-migration-history.mjs';

const VERSION_PATTERN = /^\d{14}$/;

/**
 * Map migration FILENAMES to versions, rejecting anything malformed.
 *
 * The filesystem is the authoritative local set: it is unambiguous, whereas a table row
 * could in principle be a header or a border. A file whose name does not carry a clean
 * 14-digit version is a failure, never something to skip quietly — an unparsable local
 * migration is exactly the kind of thing that would make `db push` do something we did not
 * predict.
 */
export function versionsFromFilenames(filenames) {
  const versions = [];
  const malformed = [];

  for (const raw of filenames ?? []) {
    const name = String(raw ?? '').trim();
    if (!name) continue;
    if (!MIGRATION_FILENAME_PATTERN.test(name)) {
      malformed.push(name);
      continue;
    }
    versions.push(name.slice(0, 14));
  }

  return { versions, malformed };
}

const sorted = (set) => [...set].sort();

/**
 * PHASE 1 — audit what `migration fetch --linked` created.
 *
 * The set of files it produced must equal the set of versions the remote history reported
 * BEFORE the fetch, exactly. A remote version with no fetched file would leave push
 * complaining again; a fetched file with no remote version would mean the workspace gained a
 * migration from somewhere other than production history, which is the one thing this whole
 * design exists to prevent.
 *
 * The target must also still be absent from the remote history — the dependency gate already
 * proved that, and it is re-proved here because everything after this point assumes it.
 */
export function verifyFetchedHistory({ remoteBeforeOutput, fetchedFilenames, targetVersion }) {
  const errors = [];
  const notes = [];

  if (!VERSION_PATTERN.test(String(targetVersion ?? ''))) {
    return { ok: false, errors: [`Target version "${targetVersion}" is malformed.`], notes };
  }

  const remote = remoteVersions(remoteBeforeOutput);
  const { versions, malformed } = versionsFromFilenames(fetchedFilenames);
  const fetched = new Set(versions);

  for (const name of malformed) {
    errors.push(`Fetched migration filename is malformed: ${name}`);
  }

  const missingLocally = sorted(remote).filter((v) => !fetched.has(v));
  const extraLocally = sorted(fetched).filter((v) => !remote.has(v));

  for (const version of missingLocally) {
    errors.push(`Remote version ${version} was not created locally by migration fetch.`);
  }
  for (const version of extraLocally) {
    errors.push(`Local version ${version} exists after migration fetch but is not in the remote history.`);
  }

  if (fetched.has(targetVersion)) {
    errors.push(`Target ${targetVersion} was produced by migration fetch, which means it is already applied remotely.`);
  }
  if (remote.has(targetVersion)) {
    errors.push(`Target ${targetVersion} is already present in the remote history; refusing to push it again.`);
  }

  if (errors.length === 0) {
    notes.push(`Fetched ${fetched.size} historical migration(s), matching the remote history exactly.`);
    notes.push(`Target ${targetVersion} is absent from the remote history, as required.`);
  }

  return { ok: errors.length === 0, errors, notes, remoteCount: remote.size, fetchedCount: fetched.size };
}

/**
 * PHASE 2 — the new isolation proof, evaluated after the target is restored.
 *
 * Requires, from the final `migration list` plus the final directory listing:
 *   * exactly ONE local-only version, and it is the target
 *   * no remote-only versions (the reconciliation actually worked)
 *   * the target's Remote column is blank — it is genuinely pending, not already applied
 *   * every protected version absent from BOTH sides
 *   * the directory contents and the CLI's Local column agree
 */
export function verifyIsolatedState({
  finalListOutput,
  migrationFilenames,
  targetVersion,
  requiredVersions = [],
  protectedVersions = [],
}) {
  const errors = [];
  const notes = [];

  if (!VERSION_PATTERN.test(String(targetVersion ?? ''))) {
    return { ok: false, errors: [`Target version "${targetVersion}" is malformed.`], notes };
  }

  const rows = parseMigrationHistory(finalListOutput);
  const remote = remoteVersions(finalListOutput);
  const listedLocal = localVersions(finalListOutput);

  const { versions, malformed } = versionsFromFilenames(migrationFilenames);
  const onDisk = new Set(versions);
  for (const name of malformed) {
    errors.push(`Local migration filename is malformed: ${name}`);
  }

  // The directory and the CLI must describe the same workspace.
  for (const version of sorted(onDisk).filter((v) => !listedLocal.has(v))) {
    errors.push(`Migration ${version} exists on disk but is missing from the CLI Local column.`);
  }
  for (const version of sorted(listedLocal).filter((v) => !onDisk.has(v))) {
    errors.push(`Migration ${version} appears in the CLI Local column but not on disk.`);
  }

  // THE invariant: exactly one local-only version, and it is the target.
  const localOnly = sorted(onDisk).filter((v) => !remote.has(v));
  if (localOnly.length !== 1) {
    errors.push(
      `Expected exactly ONE local-only migration, found ${localOnly.length}: ${localOnly.length ? localOnly.join(', ') : 'none'}.`,
    );
  } else if (localOnly[0] !== targetVersion) {
    errors.push(`The single local-only migration is ${localOnly[0]}, not the selected target ${targetVersion}.`);
  } else {
    notes.push(`Exactly one local-only migration: ${targetVersion}.`);
  }

  // Reconciliation must have left nothing remote-only.
  const remoteOnly = sorted(remote).filter((v) => !onDisk.has(v));
  if (remoteOnly.length > 0) {
    errors.push(`Remote version(s) still missing locally after reconciliation: ${remoteOnly.join(', ')}.`);
  } else {
    notes.push(`All ${remote.size} remote version(s) have a matching local migration.`);
  }

  // The target row must show a blank Remote column.
  const targetRow = rows.find((r) => r.local === targetVersion);
  if (!targetRow) {
    errors.push(`Target ${targetVersion} does not appear in the CLI Local column.`);
  } else if (targetRow.remote) {
    errors.push(`Target ${targetVersion} already reports Remote ${targetRow.remote}; it is not pending.`);
  }

  // Prerequisites must be present remotely (and therefore locally).
  for (const required of requiredVersions) {
    if (remote.has(required)) {
      notes.push(`Prerequisite ${required} is applied remotely.`);
    } else {
      errors.push(`Prerequisite ${required} is not present in the remote history.`);
    }
  }

  // Protected migrations must be absent from BOTH sides, so push cannot even see them.
  for (const version of protectedVersions) {
    const inRemote = remote.has(version);
    const inLocal = onDisk.has(version);
    if (inLocal && !inRemote) {
      errors.push(`Protected migration ${version} is local-only and WOULD BE PUSHED. Refusing.`);
    } else if (inLocal && inRemote) {
      notes.push(`Protected migration ${version} is already applied remotely; its fetched copy will not be pushed.`);
    } else if (inRemote) {
      errors.push(`Protected migration ${version} is applied remotely but has no local file — reconciliation is incomplete.`);
    } else {
      notes.push(`Protected migration ${version} is absent from both Local and Remote.`);
    }
  }

  return { ok: errors.length === 0, errors, notes, localOnly, remoteCount: remote.size, localCount: onDisk.size };
}

/**
 * The target file must be byte-identical at all three points it is handled: on the source
 * branch, in the staging area it is parked in while the migrations directory is emptied and
 * refilled, and back in the reconciled workspace. Reconciliation moves the file twice, so
 * "the file we verified is the file we push" stops being self-evident and has to be proved.
 */
export function verifyTargetSha({ sourceSha, stagedSha, restoredSha }) {
  const values = { sourceSha, stagedSha, restoredSha };
  const errors = [];

  for (const [name, value] of Object.entries(values)) {
    if (!/^[0-9a-f]{64}$/i.test(String(value ?? ''))) {
      errors.push(`${name} is not a SHA-256 digest: ${value}`);
    }
  }
  if (errors.length === 0 && !(sourceSha === stagedSha && stagedSha === restoredSha)) {
    errors.push(
      `Target migration changed during reconciliation (source ${sourceSha}, staged ${stagedSha}, restored ${restoredSha}).`,
    );
  }

  return {
    ok: errors.length === 0,
    errors,
    notes: errors.length === 0 ? [`Target SHA-256 identical at source, staging and restore: ${sourceSha}.`] : [],
  };
}
