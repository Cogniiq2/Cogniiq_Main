// Gate: refuse to apply a production migration unless an ENCRYPTED, provably recoverable
// restore point exists and no plaintext production data remains on the runner.
//
//   node .github/scripts/verify-supabase-restore-point.mjs \
//     --managed <outcome> --logical-dump <outcome> --logical-verify <outcome> \
//     --encryption <outcome> --artifact <outcome> --plaintext-cleanup <outcome> \
//     --manifest production-backup/manifest.json \
//     --run-id 123 --run-attempt 1
//
// WHAT CHANGED, AND WHY IT IS STRICTER THAN "MANAGED OR LOGICAL"
// --------------------------------------------------------------
// The first version of this gate accepted EITHER a managed Supabase backup/PITR window OR a
// same-run logical backup, because the project is on the FREE plan and has neither daily
// backups nor PITR.
//
// That disjunction is now gone, and deliberately so. This repository is PUBLIC, which makes
// the encrypted-and-verified logical backup the only artifact this workflow can actually
// prove exists and can actually prove is recoverable. A managed backup, if one ever appears,
// is recorded and reported as additional evidence — but it can no longer authorise a write on
// its own, because doing so would let the run skip the encryption and round-trip checks that
// exist to keep customer data out of a public artifact.
//
// So EVERY leg below is required:
//
//   1. the dump step succeeded,
//   2. the plaintext bundle was verified (files present, non-empty, hashed),
//   3. encryption succeeded AND a same-run decryption reproduced the verified hashes,
//   4. the ENCRYPTED artifact was uploaded — a backup nobody can retrieve is not a backup,
//   5. all plaintext production dumps were removed from the runner,
//   6. the manifest proves the archive is encrypted, holds no plaintext, and belongs to
//      THIS run.
//
// A logical dump is NOT PITR and this gate never pretends otherwise: it recovers to the
// instant the dump ran, with no write-ahead log to replay.
//
// The gate FAILS CLOSED. No network I/O, no database access, no secrets. It never sees the
// backup passphrase and there is no argument through which one could be passed.

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

function isDirectInvocation() {
  return Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
}

export function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    args[key] = next && !next.startsWith('--') ? (i += 1, next) : 'true';
  }
  return args;
}

/**
 * A GitHub step outcome counts as success only when it is exactly 'success'.
 *
 * 'failure', 'skipped', 'cancelled', an empty string from a step that never ran and any
 * unexpected value all mean the same thing here: no evidence.
 */
export function succeeded(outcome) {
  return String(outcome ?? '').trim() === 'success';
}

export function evaluateRestorePoint(input) {
  const {
    managedOutcome,
    logicalDumpOutcome,
    logicalVerifyOutcome,
    encryptionOutcome,
    artifactOutcome,
    plaintextCleanupOutcome,
    manifestRaw = null,
    runId = null,
    runAttempt = null,
  } = input;

  const summary = {
    ok: false,
    managedRestorePoint: succeeded(managedOutcome),
    logicalDumpCreated: succeeded(logicalDumpOutcome),
    logicalBackupVerified: succeeded(logicalVerifyOutcome),
    backupEncrypted: succeeded(encryptionOutcome),
    encryptedArtifactUploaded: succeeded(artifactOutcome),
    plaintextRemoved: succeeded(plaintextCleanupOutcome),
    manifestMatchesRun: false,
    manifestProvesEncryption: false,
    manifestProvesRoundTrip: false,
    manifestProvesNoPlaintext: false,
    acceptedEvidence: null,
    reason: null,
  };

  // ---- what the manifest itself proves --------------------------------------------
  let manifest = null;
  if (manifestRaw !== null) {
    try {
      const parsed = JSON.parse(String(manifestRaw));
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) manifest = parsed;
    } catch {
      manifest = null;
    }
  }

  if (manifest && manifest.kind === 'supabase-logical-production-backup') {
    // Belt and braces against a manifest left over from an earlier run in a reused
    // workspace: the recorded run id and attempt must be this run's.
    const runMatches = runId === null || String(manifest.workflowRunId ?? '') === String(runId);
    const attemptMatches =
      runAttempt === null || String(manifest.workflowRunAttempt ?? '') === String(runAttempt);
    summary.manifestMatchesRun = Boolean(runMatches && attemptMatches);

    const checks = manifest.checks ?? {};
    const archive = manifest.encryptedArchive ?? {};
    summary.manifestProvesEncryption =
      checks.archiveIsEncrypted === true &&
      typeof archive.sha256 === 'string' &&
      /^[0-9a-f]{64}$/.test(archive.sha256) &&
      typeof archive.bytes === 'number' &&
      archive.bytes > 0;
    summary.manifestProvesRoundTrip =
      checks.encryptionRoundTripVerified === true && archive.roundTripVerified === true;
    summary.manifestProvesNoPlaintext =
      checks.artifactContainsPlaintext === false && checks.artifactFilesAllowed === true;
  }

  // ---- every leg is required -------------------------------------------------------
  const required = [
    [summary.logicalDumpCreated, 'the logical dump step did not succeed'],
    [summary.logicalBackupVerified, 'the plaintext backup was not verified'],
    [summary.backupEncrypted, 'the backup was not encrypted and round-trip verified'],
    [summary.encryptedArtifactUploaded, 'the encrypted artifact was not uploaded'],
    [summary.plaintextRemoved, 'the plaintext production dumps were not removed from the runner'],
    [summary.manifestMatchesRun, 'the backup manifest does not belong to this run'],
    [summary.manifestProvesEncryption, 'the manifest does not prove the archive is encrypted'],
    [summary.manifestProvesRoundTrip, 'the manifest does not prove a successful round-trip decryption'],
    [summary.manifestProvesNoPlaintext, 'the manifest does not prove the artifact is free of plaintext dumps'],
  ];

  const missing = required.filter(([held]) => !held).map(([, why]) => why);

  if (missing.length === 0) {
    summary.ok = true;
    summary.acceptedEvidence = summary.managedRestorePoint
      ? 'encrypted-logical-backup+managed-backup'
      : 'encrypted-logical-backup';
    return summary;
  }

  // A managed backup is reported, but it can NOT stand in for the encrypted artifact: this
  // repository is public, and skipping the encryption path is exactly what must not happen.
  summary.reason =
    `The encrypted production backup is not usable: ${missing.join('; ')}.` +
    (summary.managedRestorePoint
      ? ' A managed Supabase backup was detected, but it does not substitute for the verified encrypted artifact.'
      : '');
  return summary;
}

/** Human-readable block. Booleans and labels only — never a secret. */
export function formatRestorePointGate(summary) {
  return [
    'Restore-point gate (encrypted, round-trip verified logical backup required):',
    `  Logical dump created:               ${summary.logicalDumpCreated ? 'yes' : 'no'}`,
    `  Plaintext backup verified:          ${summary.logicalBackupVerified ? 'yes' : 'no'}`,
    `  Backup encrypted + round-tripped:   ${summary.backupEncrypted ? 'yes' : 'no'}`,
    `  Encrypted artifact uploaded:        ${summary.encryptedArtifactUploaded ? 'yes' : 'no'}`,
    `  Plaintext removed from runner:      ${summary.plaintextRemoved ? 'yes' : 'no'}`,
    `  Manifest belongs to this run:       ${summary.manifestMatchesRun ? 'yes' : 'no'}`,
    `  Manifest proves encryption:         ${summary.manifestProvesEncryption ? 'yes' : 'no'}`,
    `  Manifest proves round trip:         ${summary.manifestProvesRoundTrip ? 'yes' : 'no'}`,
    `  Manifest proves no plaintext:       ${summary.manifestProvesNoPlaintext ? 'yes' : 'no'}`,
    `  Managed backup / PITR (additional): ${summary.managedRestorePoint ? 'yes' : 'no'}`,
    `  Accepted evidence:                  ${summary.acceptedEvidence ?? 'none'}`,
    `  Result: ${summary.ok ? 'PASS' : `FAIL — ${summary.reason}`}`,
  ].join('\n');
}

if (isDirectInvocation()) {
  const args = parseArgs(process.argv.slice(2));

  let manifestRaw = null;
  if (args.manifest) {
    try {
      manifestRaw = readFileSync(args.manifest, 'utf8');
    } catch {
      manifestRaw = null;
    }
  }

  const summary = evaluateRestorePoint({
    managedOutcome: args.managed,
    logicalDumpOutcome: args['logical-dump'],
    logicalVerifyOutcome: args['logical-verify'],
    encryptionOutcome: args.encryption,
    artifactOutcome: args.artifact,
    plaintextCleanupOutcome: args['plaintext-cleanup'],
    manifestRaw,
    runId: args['run-id'] ?? null,
    runAttempt: args['run-attempt'] ?? null,
  });

  console.log(formatRestorePointGate(summary));
  if (!summary.ok) process.exit(1);
}
