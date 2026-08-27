// Unit tests for the backup encryption / round-trip gate.
//
// This repository is PUBLIC, so the single most important property asserted here is that no
// plaintext production dump can reach an uploaded artifact — and that a backup which cannot
// be decrypted is never mistaken for a backup. Every failure mode fails closed.
//
// Nothing here runs gpg, touches a database or performs network I/O; the workflow does the
// crypto and this file proves the gate reads the results correctly.

import { createHash } from 'node:crypto';
import {
  AEAD_ALGORITHMS,
  ALLOWED_ARTIFACT_FILES,
  ENCRYPTED_ARCHIVE_NAME,
  PLAINTEXT_MARKERS,
  REQUIRED_ENCRYPTION_MODE,
  RESTORE_README_NAME,
  disallowedArtifactFiles,
  evaluateBackupEncryption,
  findPlaintextMarkers,
  formatArchiveChecksums,
  formatEncryptionGate,
  inspectOpenPgp,
  parseArgs,
  readPacketHeader,
  renderRestoreReadme,
} from './verify-supabase-backup-encryption.mjs';
import { EXPECTED_BACKUP_FILES } from './verify-supabase-logical-backup.mjs';

let failures = 0;

function check(name, condition, detail = '') {
  if (condition) {
    console.log(`  ok  ${name}`);
  } else {
    failures += 1;
    console.error(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

const sha = (buf) => createHash('sha256').update(buf).digest('hex');

/** Plaintext contents, as they were when the logical-backup gate hashed them. */
const PLAINTEXT = new Map(
  EXPECTED_BACKUP_FILES.map((f) => [f.name, Buffer.from(`contents of ${f.name}\n`, 'utf8')]),
);

/**
 * Build a syntactically real OpenPGP symmetric message.
 *
 * Byte layouts are taken from what GnuPG 2.4 actually emits, confirmed with
 * `gpg --list-packets` against a live encryption:
 *
 *   --symmetric              → SKESK v4 (aead 0) + tag 18 SEIPD v1   (CFB + MDC, NOT AEAD)
 *   --symmetric --force-ocb  → SKESK v5 (aead 2) + tag 20 AEAD data  (AES-256 OCB)
 *
 * `mode` selects which of those two the fake represents, so the gate can be tested against
 * the exact shape a lost `--force-ocb` would produce.
 */
function fakeEncryptedArchive({ mode = 'ocb', size = 4096, firstByte = null, aeadAlgo = 2 } = {}) {
  const skeskBody =
    mode === 'ocb'
      ? Buffer.from([5, 9, aeadAlgo, 3, 10]) // version 5, AES-256, aead, s2k 3, SHA-512
      : Buffer.from([4, 9, 3, 10]); // version 4, AES-256, s2k 3, SHA-512
  const skesk = Buffer.concat([Buffer.from([firstByte ?? 0x8c, skeskBody.length]), skeskBody]);

  const dataHeader =
    mode === 'ocb'
      ? Buffer.from([0xd4, 0x20, 1, 9, aeadAlgo, 16]) // tag 20, v1, AES-256, aead, chunk
      : Buffer.from([0xd2, 0x20, 1]); // tag 18, SEIPD v1

  const body = Buffer.alloc(Math.max(0, size - skesk.length - dataHeader.length));
  for (let i = 0; i < body.length; i += 1) body[i] = (i * 97 + 13) % 256;
  return Buffer.concat([skesk, dataHeader, body]);
}

function baseManifest(overrides = {}) {
  return {
    kind: 'supabase-logical-production-backup',
    workflowRunId: '4242',
    workflowRunAttempt: '1',
    workflowRepository: 'Cogniiq2/Cogniiq_Main',
    createdAtUtc: '2026-08-27T10:00:00Z',
    targetMigration: '20260826120000_owner_historical_paid_invoice.sql',
    preMigrationLedgerHead: '20260825120000',
    files: EXPECTED_BACKUP_FILES.map((f) => ({ name: f.name, bytes: PLAINTEXT.get(f.name).length, sha256: sha(PLAINTEXT.get(f.name)) })),
    checks: { allFilesPresent: true },
    ...overrides,
  };
}

function evaluate(overrides = {}) {
  return evaluateBackupEncryption({
    manifest: overrides.manifest === undefined ? baseManifest() : overrides.manifest,
    archive: overrides.archive === undefined ? fakeEncryptedArchive({ mode: 'ocb' }) : overrides.archive,
    decrypted: overrides.decrypted === undefined ? new Map(PLAINTEXT) : overrides.decrypted,
    artifactFiles: overrides.artifactFiles ?? [ENCRYPTED_ARCHIVE_NAME, 'manifest.json', 'SHA256SUMS.txt', RESTORE_README_NAME],
  });
}

console.log('backup encryption gate');

/* ------------------------------------------------------------------- happy path */
{
  const r = evaluate();
  check('an encrypted, round-tripped backup passes', r.ok === true, r.problems.join(' | '));
  check('the round trip is recorded as verified', r.manifest.encryptedArchive.roundTripVerified === true);
  check('every expected file round-tripped', r.manifest.roundTrip.length === EXPECTED_BACKUP_FILES.length);
  check('every round-trip entry matches', r.manifest.roundTrip.every((e) => e.matches === true));
  check('the archive sha256 is recorded', /^[0-9a-f]{64}$/.test(r.manifest.encryptedArchive.sha256));
  check('the archive size is recorded', r.manifest.encryptedArchive.bytes === 4096);
  check('the cipher is named for the restorer', /AES-256/.test(r.manifest.encryptedArchive.cipher));
  check('checks.archiveIsEncrypted is true', r.manifest.checks.archiveIsEncrypted === true);
  check('checks.encryptionRoundTripVerified is true', r.manifest.checks.encryptionRoundTripVerified === true);
  check('checks.artifactContainsPlaintext is false', r.manifest.checks.artifactContainsPlaintext === false);
  check('checks.artifactFilesAllowed is true', r.manifest.checks.artifactFilesAllowed === true);
  check('earlier plaintext checks survive into the merged manifest', r.manifest.checks.allFilesPresent === true);
}

/* --------------------------------- PLAINTEXT MUST NEVER REACH THE ARTIFACT */
for (const expected of EXPECTED_BACKUP_FILES) {
  const r = evaluate({ artifactFiles: [ENCRYPTED_ARCHIVE_NAME, 'manifest.json', expected.name] });
  check(`a plaintext ${expected.name} in the artifact fails closed`, r.ok === false);
  check(`a plaintext ${expected.name} is named as such`, r.problems.some((p) => p.includes(`${expected.name}: a PLAINTEXT production dump`)), r.problems.join(' | '));
  check(`checks.artifactContainsPlaintext turns true for ${expected.name}`, r.manifest.checks.artifactContainsPlaintext === true);
}

{
  const r = evaluate({ artifactFiles: [ENCRYPTED_ARCHIVE_NAME, 'manifest.json', 'notes.txt'] });
  check('any unlisted artifact file fails closed', r.ok === false);
  check('the unlisted file is named', r.problems.some((p) => p.startsWith('notes.txt: must not be part')), r.problems.join(' | '));
  check('checks.artifactFilesAllowed turns false', r.manifest.checks.artifactFilesAllowed === false);
}

{
  const r = evaluate({ artifactFiles: [ENCRYPTED_ARCHIVE_NAME, 'manifest.json', 'dump-status.txt'] });
  check('the dump status file is not publishable either', r.ok === false, r.problems.join(' | '));
}

check('the artifact allowlist is exactly four files', ALLOWED_ARTIFACT_FILES.length === 4);
check('no expected dump is on the artifact allowlist', EXPECTED_BACKUP_FILES.every((f) => !ALLOWED_ARTIFACT_FILES.includes(f.name)));
check('disallowedArtifactFiles spots an intruder', disallowedArtifactFiles([ENCRYPTED_ARCHIVE_NAME, 'data.sql']).join() === 'data.sql');
check('disallowedArtifactFiles tolerates nothing', disallowedArtifactFiles(undefined).length === 0);

/* ---------------------------------------- ENCRYPTION FAILURE MUST FAIL CLOSED */
{
  const r = evaluate({ archive: null });
  check('a missing archive fails closed', r.ok === false);
  check('the missing archive is explained', r.problems.some((p) => p.includes('missing or empty')), r.problems.join(' | '));
}

{
  const r = evaluate({ archive: Buffer.alloc(0) });
  check('an empty archive fails closed', r.ok === false, r.problems.join(' | '));
  check('an empty archive records no hash', r.manifest.encryptedArchive.sha256 === null);
}

{
  // The worst case: encryption silently degraded to a plain copy of the tarball.
  const plaintextArchive = Buffer.from(`-- PostgreSQL database dump\nCREATE TABLE public.invoices (id uuid);\n${'x'.repeat(2000)}`, 'utf8');
  const r = evaluate({ archive: plaintextArchive });
  check('a plaintext file dressed as the archive fails closed', r.ok === false);
  check('the readable dump content is reported', r.problems.some((p) => p.includes('plaintext dump content is readable')), r.problems.join(' | '));
  check('checks.archiveIsEncrypted turns false', r.manifest.checks.archiveIsEncrypted === false);
}

{
  // Correct OpenPGP header, but dump content is still readable inside — partial encryption.
  const archive = fakeEncryptedArchive();
  Buffer.from('COPY public.customers (id, email) FROM stdin;', 'ascii').copy(archive, 100);
  const r = evaluate({ archive });
  check('readable dump content behind a valid header fails closed', r.ok === false);
  check('the leaked marker is named', r.problems.some((p) => p.includes('COPY public.')), r.problems.join(' | '));
}

{
  const r = evaluate({ archive: fakeEncryptedArchive({ firstByte: 0x00 }) });
  check('a non-OpenPGP archive fails closed', r.ok === false);
  check('the bad header is explained', r.problems.some((p) => p.includes('OpenPGP packet header')), r.problems.join(' | '));
}

{
  const r = evaluate({ archive: fakeEncryptedArchive({ firstByte: 0xc1 }) }); // new-format tag 1 = PKESK
  check('an OpenPGP packet of the wrong type fails closed', r.ok === false);
  check('the wrong packet tag is named', r.problems.some((p) => p.includes('packet tag 1')), r.problems.join(' | '));
}

/* ============================================================================
 * THE MODE MUST BE OCB, AND THE DOCUMENTATION MUST NOT OVERCLAIM
 *
 * `gpg --symmetric` alone produces CFB+MDC, which is integrity-protected but is NOT
 * authenticated encryption. If `--force-ocb` is ever dropped from the workflow the archive
 * silently degrades to that mode. These are the tests that make such a regression loud, and
 * that stop the manifest or the restore notes from claiming AEAD when the bytes say otherwise.
 * ========================================================================== */
{
  const r = evaluate({ archive: fakeEncryptedArchive({ mode: 'cfb-mdc' }) });
  check('a CFB+MDC archive FAILS the gate', r.ok === false);
  check('the CFB+MDC mode is named in the failure', r.problems.some((p) => p.includes('CFB with an MDC')), r.problems.join(' | '));
  check('the failure names the required flag', r.problems.some((p) => p.includes('--force-ocb')), r.problems.join(' | '));

  // The manifest must describe what was produced, not what was wanted.
  check('the manifest records the real mode', r.manifest.encryptedArchive.encryptionMode === 'cfb-mdc');
  check('the manifest does not claim authenticated encryption', r.manifest.encryptedArchive.authenticatedEncryption === false);
  check('checks.archiveUsesAuthenticatedEncryption is false', r.manifest.checks.archiveUsesAuthenticatedEncryption === false);
  check('checks.archiveIsEncrypted is false for a non-OCB archive', r.manifest.checks.archiveIsEncrypted === false);
  check('the cipher string says NOT AEAD', /NOT AEAD/.test(r.manifest.encryptedArchive.cipher), r.manifest.encryptedArchive.cipher);
  check('the cipher string does not claim OCB', !/OCB/.test(r.manifest.encryptedArchive.cipher), r.manifest.encryptedArchive.cipher);

  // The restore notes are generated from the manifest, so they must not overclaim either.
  const readme = renderRestoreReadme(r.manifest);
  check('the restore notes do not claim AEAD for a CFB+MDC archive', !/This is authenticated encryption/.test(readme));
  check('the restore notes warn that it is not authenticated', /NOT authenticated encryption/.test(readme));
  check('the restore notes omit the GnuPG 2.3 requirement when not OCB', !/GnuPG 2\.3 or newer/.test(readme));
}

{
  const r = evaluate({ archive: fakeEncryptedArchive({ mode: 'ocb' }) });
  check('an OCB archive passes', r.ok === true, r.problems.join(' | '));
  check('the manifest records mode ocb', r.manifest.encryptedArchive.encryptionMode === 'ocb');
  check('the manifest records authenticated encryption', r.manifest.encryptedArchive.authenticatedEncryption === true);
  check('the manifest records the AEAD algorithm id', r.manifest.encryptedArchive.aeadAlgorithm === 2);
  check('the manifest records data packet tag 20', r.manifest.encryptedArchive.dataPacketTag === 20);
  check('the manifest records session key packet v5', r.manifest.encryptedArchive.sessionKeyPacketVersion === 5);
  check('checks.archiveUsesAuthenticatedEncryption is true', r.manifest.checks.archiveUsesAuthenticatedEncryption === true);
  check('the cipher string names OCB', /OCB/.test(r.manifest.encryptedArchive.cipher), r.manifest.encryptedArchive.cipher);

  const readme = renderRestoreReadme(r.manifest);
  check('the restore notes claim AEAD only when it is true', /This is authenticated encryption/.test(readme));
  check('the restore notes state the GnuPG 2.3 requirement for OCB', /GnuPG 2\.3 or newer/.test(readme));
  check('the restore notes never say "not authenticated" for OCB', !/NOT authenticated encryption/.test(readme));
}

{
  // EAX and GCM are AEAD, but this backup is specified as OCB; anything else must be refused
  // rather than quietly accepted as "close enough".
  for (const [id, name] of Object.entries(AEAD_ALGORITHMS)) {
    if (name === REQUIRED_ENCRYPTION_MODE) continue;
    const r = evaluate({ archive: fakeEncryptedArchive({ mode: 'ocb', aeadAlgo: Number(id) }) });
    check(`AEAD mode ${name} is refused because OCB is required`, r.ok === false, r.problems.join(' | '));
    check(`${name} is still recorded as authenticated`, r.manifest.encryptedArchive.authenticatedEncryption === true);
  }
}

check('the required mode is OCB', REQUIRED_ENCRYPTION_MODE === 'ocb');

/* ------------------------------------------------------------ packet-level parsing */
{
  const ocb = inspectOpenPgp(fakeEncryptedArchive({ mode: 'ocb' }));
  check('OCB: the session key packet is v5', ocb.skesk.version === 5);
  check('OCB: the session key packet declares aead 2', ocb.skesk.aeadAlgorithm === 2);
  check('OCB: the DATA packet is tag 20', ocb.data.tag === 20);
  check('OCB: the mode is read from the data packet, not the ESK', ocb.mode === 'ocb');
  check('OCB: aead is true', ocb.aead === true);

  const legacy = inspectOpenPgp(fakeEncryptedArchive({ mode: 'cfb-mdc' }));
  check('CFB: the session key packet is v4', legacy.skesk.version === 4);
  check('CFB: the session key packet declares no aead', legacy.skesk.aeadAlgorithm === 0);
  check('CFB: the DATA packet is tag 18 v1', legacy.data.tag === 18 && legacy.data.version === 1);
  check('CFB: the mode is cfb-mdc', legacy.mode === 'cfb-mdc');
  check('CFB: aead is false', legacy.aead === false);
}

{
  // A v5 session key packet in front of a CFB+MDC data packet is a contradiction. Reading
  // only the first packet would call this AEAD; walking to the data packet does not.
  const contradictory = Buffer.concat([
    Buffer.from([0x8c, 5, 5, 9, 2, 3, 10]), // SKESK v5 claiming aead 2
    Buffer.from([0xd2, 0x20, 1]), // but a SEIPD v1 (CFB+MDC) data packet
    Buffer.alloc(2000, 7),
  ]);
  const inspected = inspectOpenPgp(contradictory);
  check('a v5 ESK in front of a CFB data packet reads as cfb-mdc', inspected.mode === 'cfb-mdc', String(inspected.mode));
  check('the contradictory archive is not called authenticated', inspected.aead === false);
  check('the contradictory archive fails the gate', evaluate({ archive: contradictory }).ok === false);
}

{
  // A legacy SED packet has no integrity protection at all.
  const sed = Buffer.concat([Buffer.from([0x8c, 4, 4, 9, 3, 10]), Buffer.from([0xc9, 0x20]), Buffer.alloc(2000, 3)]);
  const inspected = inspectOpenPgp(sed);
  check('a legacy SED packet is refused', inspected.ok === false);
  check('the missing integrity protection is explained', String(inspected.reason).includes('no integrity protection'), inspected.reason);
}

{
  const truncated = Buffer.from([0x8c, 5, 5, 9, 2, 3, 10]); // ESK only, no data packet
  const inspected = inspectOpenPgp(truncated);
  check('an archive with no data packet is refused', inspected.ok === false);
  check('the missing data packet is explained', String(inspected.reason).includes('no encrypted data packet'), inspected.reason);
}

check('readPacketHeader reads a 1-byte new-format length', readPacketHeader(Buffer.from([0xd4, 0x20, 1]), 0).length === 32);
check('readPacketHeader reads a 2-byte new-format length', readPacketHeader(Buffer.from([0xd4, 0xc0, 0x00, 1]), 0).length === 192);
check('readPacketHeader reads a 5-byte new-format length', readPacketHeader(Buffer.from([0xd4, 0xff, 0, 0, 0x01, 0x00, 1]), 0).length === 256);
check('readPacketHeader reads an old-format 1-byte length', readPacketHeader(Buffer.from([0x8c, 0x0d]), 0).length === 13);
check('readPacketHeader reads an old-format 2-byte length', readPacketHeader(Buffer.from([0x8d, 0x01, 0x00]), 0).length === 256);
check('readPacketHeader flags partial lengths', readPacketHeader(Buffer.from([0xd4, 0xe1, 1]), 0).partial === true);
check('readPacketHeader rejects a non-header byte', readPacketHeader(Buffer.from([0x41, 0x00]), 0) === null);
check('readPacketHeader rejects a past-the-end offset', readPacketHeader(Buffer.from([0x8c]), 9) === null);
check('readPacketHeader rejects a truncated 5-byte length', readPacketHeader(Buffer.from([0xd4, 0xff, 0, 0]), 0) === null);

/* ----------------------------------- ROUND-TRIP / HASH MISMATCH MUST FAIL CLOSED */
{
  const decrypted = new Map(PLAINTEXT);
  decrypted.set('data.sql', Buffer.from('tampered contents\n', 'utf8'));
  const r = evaluate({ decrypted });
  check('a hash mismatch after decryption fails closed', r.ok === false);
  check('the mismatching file is named', r.problems.some((p) => p.includes('data.sql: decrypted content does not match')), r.problems.join(' | '));
  check('the round trip is not marked verified', r.manifest.encryptedArchive.roundTripVerified === false);
  check('only the mismatching entry is marked failed', r.manifest.roundTrip.filter((e) => !e.matches).map((e) => e.name).join() === 'data.sql');
}

{
  const decrypted = new Map(PLAINTEXT);
  decrypted.delete('roles.sql');
  const r = evaluate({ decrypted });
  check('a file missing from the decrypted archive fails closed', r.ok === false);
  check('the unrecoverable file is named', r.problems.some((p) => p.includes('roles.sql: missing from the decrypted archive')), r.problems.join(' | '));
}

{
  const r = evaluate({ decrypted: new Map() });
  check('a failed decryption fails closed', r.ok === false);
  check('every file is reported unrecoverable', r.problems.filter((p) => p.includes('missing from the decrypted archive')).length === EXPECTED_BACKUP_FILES.length);
}

{
  const manifest = baseManifest();
  manifest.files = manifest.files.filter((f) => f.name !== 'schema.sql');
  const r = evaluate({ manifest });
  check('a missing pre-encryption hash fails closed', r.ok === false);
  check('the unhashed file is named', r.problems.some((p) => p.includes('schema.sql: no pre-encryption SHA-256')), r.problems.join(' | '));
}

/* ---------------------------------------------------- manifest shape must be right */
{
  const r = evaluate({ manifest: null });
  check('a missing manifest fails closed', r.ok === false);
  check('the missing manifest is explained', r.problems.some((p) => p.includes('missing or unreadable')), r.problems.join(' | '));
}

{
  const r = evaluate({ manifest: baseManifest({ kind: 'something-else' }) });
  check('a manifest of the wrong kind fails closed', r.ok === false, r.problems.join(' | '));
}

for (const [name, manifest] of [['array manifest', []], ['string manifest', 'nope'], ['number manifest', 7]]) {
  let threw = false;
  let r = null;
  try {
    r = evaluate({ manifest });
  } catch {
    threw = true;
  }
  check(`${name} does not throw`, threw === false);
  check(`${name} fails closed`, threw === false && r.ok === false);
}

/* ------------------------------------------------ NO PASSPHRASE, ANYWHERE, EVER */
{
  const r = evaluate();
  const serialised = JSON.stringify(r.manifest);
  for (const forbidden of ['passphrase', 'password', 'SUPABASE_BACKUP_PASSPHRASE', 'token', 'postgres://', 'postgresql://']) {
    check(`the manifest contains no "${forbidden}"`, !serialised.toLowerCase().includes(forbidden.toLowerCase()), forbidden);
  }
  check('the manifest carries no SQL content', !/CREATE TABLE|COPY public\.|INSERT INTO/.test(serialised));
  check('the rendered gate output contains no credential words', !/passphrase|password|bearer|sbp_/i.test(formatEncryptionGate(r)));
  // The module exposes no way to hand it a secret in the first place.
  check('the gate takes no passphrase argument', !Object.keys(parseArgs(['--manifest', 'm', '--archive', 'a'])).some((k) => /pass|secret|key/i.test(k)));
}

/* -------------------------------------------------------------- OpenPGP detection */
check('a gzip header is not OpenPGP', inspectOpenPgp(Buffer.from([0x1f, 0x8b, 0x08, 0x00])).ok === false);
check('an empty buffer is not OpenPGP', inspectOpenPgp(Buffer.alloc(0)).ok === false);
check('null is not OpenPGP', inspectOpenPgp(null).ok === false);
check(
  'armored output is refused because its mode cannot be read',
  inspectOpenPgp(Buffer.from('-----BEGIN PGP MESSAGE-----\n\nhQIMA', 'ascii')).ok === false,
);
check('every plaintext marker is detected', PLAINTEXT_MARKERS.every((m) => findPlaintextMarkers(Buffer.from(`xx${m}xx`, 'ascii')).includes(m)));
check('random bytes carry no markers', findPlaintextMarkers(fakeEncryptedArchive()).length === 0);
check('findPlaintextMarkers tolerates null', findPlaintextMarkers(null).length === 0);

/* ------------------------------------------------------ checksums and restore notes */
{
  const r = evaluate();
  const sums = formatArchiveChecksums(r.manifest);
  check('checksums cover exactly one file', sums.trim().split('\n').length === 1);
  check('checksums cover the ENCRYPTED archive', sums.includes(ENCRYPTED_ARCHIVE_NAME));
  check('checksums name no plaintext dump', EXPECTED_BACKUP_FILES.every((f) => !sums.includes(f.name)));
  check('checksums use the sha256sum -c format', /^[0-9a-f]{64} {2}\S+$/.test(sums.trim()));
  check('checksums are empty when there is no archive', formatArchiveChecksums(evaluate({ archive: null }).manifest) === '');
}

{
  const readme = renderRestoreReadme(evaluate().manifest);
  // The restore notes must not oversell what a database dump is.
  check('the notes deny PITR', /NOT Point-in-Time Recovery/.test(readme));
  check('the notes deny being a project backup', /NOT a Supabase project backup/.test(readme));
  check('the notes call out Storage object contents', /Storage OBJECT CONTENTS are not in a\s+database dump/.test(readme));
  check('the notes call out managed platform state', /Managed platform state may not be fully represented/.test(readme));
  check('the notes scope this to the finance migration', /rollback\/recovery artifact for that one controlled finance schema migration/.test(readme));
  check('the notes require separate validation of managed services', /Supabase-managed\s+services, auth and storage each need separate validation/.test(readme));

  // The five recovery steps, in the mandated order.
  const order = ['Download the encrypted artifact', 'Verify the encrypted archive SHA-256', 'Decrypt locally', 'Verify the internal file hashes', 'Only then perform the restore'];
  let last = -1;
  let ordered = true;
  for (const step of order) {
    const at = readme.indexOf(step);
    if (at === -1 || at < last) ordered = false;
    last = at;
  }
  check('the five recovery steps appear in the mandated order', ordered, order.filter((s) => !readme.includes(s)).join() || 'out of order');
  check('the notes name the passphrase secret without revealing one', readme.includes('SUPABASE_BACKUP_PASSPHRASE') && !/passphrase[:=]\s*\S/i.test(readme));
  check('the notes warn against passphrases in argv', /not in argv|never as a command\s*line argument/i.test(readme));
}

/* ----------------------------------------------------------------- output hygiene */
{
  const rendered = formatEncryptionGate(evaluate({ decrypted: new Map() }));
  check('a failing gate renders FAIL', rendered.includes('Result: FAIL'));
  check('a failing gate lists its problems', rendered.includes('missing from the decrypted archive'));
}

if (failures > 0) {
  console.error(`\nbackup encryption gate tests FAILED (${failures})`);
  process.exit(1);
}
console.log('backup encryption gate tests passed');
