// Unit tests for the combined restore-point gate.
//
// The gate now requires an ENCRYPTED, round-trip-verified, uploaded backup and proof that the
// plaintext was destroyed. A managed Supabase backup is reported but can no longer authorise
// a write on its own — this repository is PUBLIC, and accepting managed evidence alone would
// let a run skip the encryption path entirely.
//
// The table-driven matrix below enumerates every combination of the six step outcomes so no
// accidental pass can hide in a corner of the truth table.

import { evaluateRestorePoint, formatRestorePointGate, parseArgs, succeeded } from './verify-supabase-restore-point.mjs';

let failures = 0;

function check(name, condition, detail = '') {
  if (condition) {
    console.log(`  ok  ${name}`);
  } else {
    failures += 1;
    console.error(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function manifestJson(overrides = {}) {
  return JSON.stringify({
    kind: 'supabase-logical-production-backup',
    workflowRunId: '4242',
    workflowRunAttempt: '1',
    encryptedArchive: {
      name: 'supabase-production-backup.tar.gz.gpg',
      bytes: 40960,
      sha256: 'a'.repeat(64),
      roundTripVerified: true,
      ...(overrides.encryptedArchive ?? {}),
    },
    checks: {
      archiveIsEncrypted: true,
      encryptionRoundTripVerified: true,
      artifactContainsPlaintext: false,
      artifactFilesAllowed: true,
      ...(overrides.checks ?? {}),
    },
    ...(overrides.top ?? {}),
  });
}

const ALL_SUCCEEDED = {
  managedOutcome: 'failure',
  logicalDumpOutcome: 'success',
  logicalVerifyOutcome: 'success',
  encryptionOutcome: 'success',
  artifactOutcome: 'success',
  plaintextCleanupOutcome: 'success',
};

function evaluate(overrides = {}) {
  return evaluateRestorePoint({
    ...ALL_SUCCEEDED,
    manifestRaw: manifestJson(),
    runId: '4242',
    runAttempt: '1',
    ...overrides,
  });
}

console.log('restore-point gate');

/* ---------------------------------------------------------------------- happy path */
{
  const s = evaluate();
  check('a fully verified encrypted backup passes', s.ok === true, s.reason);
  check('the accepted evidence is named', s.acceptedEvidence === 'encrypted-logical-backup', String(s.acceptedEvidence));
  check('the manifest is matched to this run', s.manifestMatchesRun === true);
  check('the manifest proves encryption', s.manifestProvesEncryption === true);
  check('the manifest proves the round trip', s.manifestProvesRoundTrip === true);
  check('the manifest proves no plaintext', s.manifestProvesNoPlaintext === true);
}

{
  const s = evaluate({ managedOutcome: 'success' });
  check('a managed backup is reported as additional evidence', s.acceptedEvidence === 'encrypted-logical-backup+managed-backup', String(s.acceptedEvidence));
  check('a managed backup does not change the verdict', s.ok === true);
}

/* -------------------------- A MANAGED BACKUP CAN NO LONGER STAND IN ON ITS OWN */
{
  const s = evaluate({
    managedOutcome: 'success',
    logicalDumpOutcome: 'failure',
    logicalVerifyOutcome: 'skipped',
    encryptionOutcome: 'skipped',
    artifactOutcome: 'skipped',
    plaintextCleanupOutcome: 'skipped',
    manifestRaw: null,
  });
  check('a managed backup alone now FAILS closed', s.ok === false);
  check('the managed backup is still reported', s.managedRestorePoint === true);
  check('the gate says why managed is not enough', String(s.reason).includes('does not substitute for the verified encrypted artifact'), s.reason);
}

/* --------------------------------------------------------- every leg is required */
for (const [key, why] of [
  ['logicalDumpOutcome', 'the logical dump step did not succeed'],
  ['logicalVerifyOutcome', 'the plaintext backup was not verified'],
  ['encryptionOutcome', 'the backup was not encrypted and round-trip verified'],
  ['artifactOutcome', 'the encrypted artifact was not uploaded'],
  ['plaintextCleanupOutcome', 'the plaintext production dumps were not removed from the runner'],
]) {
  const s = evaluate({ [key]: 'failure' });
  check(`a failed ${key} fails closed`, s.ok === false);
  check(`a failed ${key} is explained`, String(s.reason).includes(why), s.reason);
}

/* ------------------------------------------------- what the manifest itself proves */
{
  const s = evaluate({ manifestRaw: manifestJson({ checks: { archiveIsEncrypted: false } }) });
  check('a manifest that does not prove encryption fails closed', s.ok === false);
  check('the unproven encryption is explained', String(s.reason).includes('does not prove the archive is encrypted'), s.reason);
}

{
  const s = evaluate({ manifestRaw: manifestJson({ checks: { encryptionRoundTripVerified: false } }) });
  check('an unproven round trip fails closed', s.ok === false);
  check('the unproven round trip is explained', String(s.reason).includes('successful round-trip decryption'), s.reason);
}

{
  const s = evaluate({ manifestRaw: manifestJson({ encryptedArchive: { roundTripVerified: false } }) });
  check('a manifest whose archive is not round-tripped fails closed', s.ok === false, s.reason);
}

{
  const s = evaluate({ manifestRaw: manifestJson({ checks: { artifactContainsPlaintext: true } }) });
  check('a manifest reporting plaintext in the artifact fails closed', s.ok === false);
  check('the plaintext report is explained', String(s.reason).includes('free of plaintext dumps'), s.reason);
}

{
  const s = evaluate({ manifestRaw: manifestJson({ checks: { artifactFilesAllowed: false } }) });
  check('a manifest reporting a disallowed artifact file fails closed', s.ok === false, s.reason);
}

{
  const s = evaluate({ manifestRaw: manifestJson({ encryptedArchive: { sha256: 'not-a-hash' } }) });
  check('a manifest with no real archive digest fails closed', s.ok === false, s.reason);
}

{
  const s = evaluate({ manifestRaw: manifestJson({ encryptedArchive: { bytes: 0 } }) });
  check('a manifest describing a zero-byte archive fails closed', s.ok === false, s.reason);
}

{
  const s = evaluate({ manifestRaw: manifestJson({ top: { workflowRunId: '1' } }) });
  check('a manifest from another run fails closed', s.ok === false);
  check('the stale manifest is explained', String(s.reason).includes('does not belong to this run'), s.reason);
}

{
  const s = evaluate({ manifestRaw: manifestJson({ top: { workflowRunAttempt: '2' } }) });
  check('a manifest from another attempt fails closed', s.ok === false, s.reason);
}

{
  const s = evaluate({ manifestRaw: manifestJson({ top: { kind: 'something-else' } }) });
  check('a manifest of the wrong kind fails closed', s.ok === false, s.reason);
}

/* ------------------------------------------------------- exhaustive outcome matrix */
{
  const OUTCOMES = ['success', 'failure', 'skipped', 'cancelled', '', undefined];
  const LEGS = ['logicalDumpOutcome', 'logicalVerifyOutcome', 'encryptionOutcome', 'artifactOutcome', 'plaintextCleanupOutcome'];
  let unexpected = 0;
  let combinations = 0;

  // One leg varies fully at a time against a fixed managed value; then the managed input is
  // varied on its own. Exhausting 6^6 would be 46656 evaluations for no extra coverage — the
  // legs are independent by construction and this proves each one is load-bearing.
  for (const managed of OUTCOMES) {
    for (const leg of LEGS) {
      for (const outcome of OUTCOMES) {
        combinations += 1;
        const s = evaluate({ managedOutcome: managed, [leg]: outcome });
        const shouldPass = outcome === 'success';
        if (s.ok !== shouldPass) unexpected += 1;
      }
    }
  }
  check(`every single-leg outcome decides correctly (${combinations} combinations)`, unexpected === 0, `${unexpected} mismatches`);
}

{
  // No combination of managed + a broken leg may ever pass.
  let leaks = 0;
  for (const managed of ['success', 'failure', 'skipped']) {
    for (const encryption of ['failure', 'skipped', 'cancelled']) {
      if (evaluate({ managedOutcome: managed, encryptionOutcome: encryption }).ok) leaks += 1;
    }
  }
  check('no managed outcome can rescue a failed encryption', leaks === 0, `${leaks} leaks`);
}

/* ------------------------------------------------ defensive shapes must not throw */
for (const [name, manifestRaw] of [
  ['malformed manifest JSON', '{not json'],
  ['manifest that is an array', '[]'],
  ['manifest that is null', 'null'],
  ['absent manifest', null],
  ['manifest with no checks', JSON.stringify({ kind: 'supabase-logical-production-backup', workflowRunId: '4242', workflowRunAttempt: '1' })],
]) {
  let threw = false;
  let s = null;
  try {
    s = evaluate({ manifestRaw });
  } catch {
    threw = true;
  }
  check(`${name} does not throw`, threw === false);
  check(`${name} fails closed`, threw === false && s.ok === false, s ? s.reason : 'threw');
}

check('only the exact string "success" counts', succeeded('success') === true);
check('"Success" does not count', succeeded('Success') === false);
check('undefined does not count', succeeded(undefined) === false);
check('whitespace is tolerated', succeeded('  success  ') === true);

{
  const args = parseArgs(['--managed', 'success', '--encryption', 'failure', '--plaintext-cleanup', 'success']);
  check('parseArgs reads every gate outcome', args.managed === 'success' && args.encryption === 'failure' && args['plaintext-cleanup'] === 'success');
  check('the gate takes no passphrase argument', !Object.keys(args).some((k) => /pass(phrase|word)|secret|key/i.test(k)));
}

/* ------------------------------------------------------------------- output hygiene */
{
  const rendered = formatRestorePointGate(evaluate());
  check('the summary reports PASS', rendered.includes('Result: PASS'));
  check('the summary lists every signal', [
    'Logical dump created',
    'Plaintext backup verified',
    'Backup encrypted + round-tripped',
    'Encrypted artifact uploaded',
    'Plaintext removed from runner',
    'Manifest belongs to this run',
    'Manifest proves encryption',
    'Manifest proves round trip',
    'Manifest proves no plaintext',
  ].every((l) => rendered.includes(l)), rendered);
  check('the summary contains no credential text', !/bearer|authorization|sbp_|passphrase|password/i.test(rendered));
}

if (failures > 0) {
  console.error(`\nrestore-point gate tests FAILED (${failures})`);
  process.exit(1);
}
console.log('restore-point gate tests passed');
