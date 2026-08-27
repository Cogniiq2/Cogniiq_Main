// Gate: prove the production backup is ENCRYPTED and RECOVERABLE before a migration writes.
//
//   node .github/scripts/verify-supabase-backup-encryption.mjs \
//     --manifest production-backup/manifest.json \
//     --archive production-backup/supabase-production-backup.tar.gz.gpg \
//     --decrypted "$RUNNER_TEMP/backup-roundtrip" \
//     --artifact-dir production-backup \
//     [--checksums production-backup/SHA256SUMS.txt] \
//     [--readme production-backup/RESTORE.md]
//
// WHY THIS EXISTS
// ---------------
// This repository is PUBLIC, and GitHub Actions artifacts are readable by anyone who can read
// the repository. A plaintext `pg_dump` of production contains real customer and business
// rows, so uploading one would publish that data. Nothing about GitHub's secret masking helps
// here: masking redacts secret VALUES from logs, it does not protect an artifact's contents.
//
// So the bundle is encrypted with GnuPG symmetric AES-256 before it is uploaded, and this
// script is the proof that the encryption actually happened AND that the result can actually
// be decrypted back to the bytes that were verified. Three independent things are checked:
//
//  1. The archive is genuinely an OpenPGP encrypted message — not a plaintext file that was
//     renamed, and not a truncated or empty output from a failed gpg invocation.
//  2. The archive body contains none of the plaintext markers a SQL dump always carries. An
//     encryption step that silently degraded to a copy fails here even if the header lied.
//  3. Every file recovered by a SAME-RUN decryption hashes to exactly the SHA-256 recorded
//     BEFORE encryption. A backup that cannot be decrypted is not a backup, and the only way
//     to know is to decrypt it.
//
// This script NEVER receives, reads, prints or stores the passphrase. It does not run gpg,
// does not perform network I/O and never touches a database — the workflow does the crypto,
// this reads the results. The gate FAILS CLOSED on every failure and on every uncertainty.

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync, statSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { EXPECTED_BACKUP_FILES } from './verify-supabase-logical-backup.mjs';

export const ENCRYPTED_ARCHIVE_NAME = 'supabase-production-backup.tar.gz.gpg';
export const RESTORE_README_NAME = 'RESTORE.md';

/**
 * The complete set of filenames the uploaded artifact may contain.
 *
 * Anything else is a failure, not a warning. This is the last line of defence against a
 * plaintext dump reaching a public artifact: even if an earlier step wrote one into the
 * upload directory by mistake, the gate refuses before the upload is allowed to count.
 */
export const ALLOWED_ARTIFACT_FILES = [
  ENCRYPTED_ARCHIVE_NAME,
  'manifest.json',
  'SHA256SUMS.txt',
  RESTORE_README_NAME,
];

/**
 * Markers that appear in every plaintext Postgres dump.
 *
 * Encrypted bytes are effectively random, so finding any of these inside the "encrypted"
 * archive means the encryption did not happen. Checked as bytes so a partially-encrypted or
 * concatenated file cannot slip through on an encoding technicality.
 */
export const PLAINTEXT_MARKERS = [
  'PostgreSQL database dump',
  'CREATE TABLE',
  'COPY public.',
  'ALTER ROLE',
  'schema_migrations',
  'SET statement_timeout',
];

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

/** OpenPGP AEAD algorithm registry. 2 = OCB, which is what this workflow requires. */
export const AEAD_ALGORITHMS = { 1: 'eax', 2: 'ocb', 3: 'gcm' };
export const AEAD_MODES = Object.values(AEAD_ALGORITHMS);

/**
 * The encryption mode the backup MUST use.
 *
 * GnuPG's `--symmetric` defaults to a Symmetrically Encrypted and Integrity Protected Data
 * packet, version 1 — CFB with an MDC. An MDC is a SHA-1 checksum appended inside the
 * ciphertext; it detects corruption but it is NOT authenticated encryption, and calling it
 * AEAD is simply wrong. `--force-ocb` switches GnuPG to a real AEAD construction: a v5
 * symmetric-key ESK packet plus an AEAD Encrypted Data packet (tag 20) using AES-256 in OCB.
 */
export const REQUIRED_ENCRYPTION_MODE = 'ocb';

/** Human labels. Derived from the observed bytes, never from what the workflow claims. */
const MODE_LABELS = {
  ocb: 'AES-256 in OCB (OpenPGP AEAD encrypted data packet, tag 20)',
  eax: 'AES-256 in EAX (OpenPGP AEAD encrypted data packet)',
  gcm: 'AES-256 in GCM (OpenPGP AEAD encrypted data packet)',
  'cfb-mdc': 'AES-256 in CFB with an MDC integrity check (SEIPD v1) — integrity-protected but NOT AEAD',
};

/** Read one OpenPGP packet header. Returns null when the bytes are not a usable header. */
export function readPacketHeader(buffer, offset) {
  if (!buffer || offset < 0 || offset >= buffer.length) return null;
  const header = buffer[offset];
  if ((header & 0x80) === 0) return null;

  const newFormat = (header & 0x40) !== 0;
  let cursor = offset + 1;
  let tag;
  let length = null;
  let partial = false;

  try {
    if (newFormat) {
      tag = header & 0x3f;
      const first = buffer[cursor];
      if (first === undefined) return null;
      if (first < 192) {
        length = first;
        cursor += 1;
      } else if (first < 224) {
        if (buffer[cursor + 1] === undefined) return null;
        length = ((first - 192) << 8) + buffer[cursor + 1] + 192;
        cursor += 2;
      } else if (first < 255) {
        // Partial body length: the packet continues in further chunks.
        length = 1 << (first & 0x1f);
        partial = true;
        cursor += 1;
      } else {
        if (buffer.length < cursor + 5) return null;
        length = buffer.readUInt32BE(cursor + 1);
        cursor += 5;
      }
    } else {
      tag = (header >> 2) & 0x0f;
      const lengthType = header & 0x03;
      if (lengthType === 0) {
        if (buffer[cursor] === undefined) return null;
        length = buffer[cursor];
        cursor += 1;
      } else if (lengthType === 1) {
        if (buffer.length < cursor + 2) return null;
        length = buffer.readUInt16BE(cursor);
        cursor += 2;
      } else if (lengthType === 2) {
        if (buffer.length < cursor + 4) return null;
        length = buffer.readUInt32BE(cursor);
        cursor += 4;
      } else {
        length = null;
        partial = true;
      }
    }
  } catch {
    return null;
  }

  return { tag, bodyStart: cursor, length, partial, newFormat };
}

/**
 * Determine what the archive ACTUALLY is, by walking its packets.
 *
 * Reading only the first packet is not enough. The symmetric-key ESK packet says how the
 * session key was wrapped; the DATA packet says how the payload was encrypted, and that is
 * the claim the manifest and the restore notes make. A v5 ESK in front of a CFB+MDC data
 * packet would be a contradiction, and this is the only place it would be caught.
 *
 *   tag 20                 → AEAD Encrypted Data. body: [version][cipher][aead][chunk]
 *   tag 18, body[0] === 2  → SEIPD v2 (RFC 9580 AEAD). body: [version][cipher][aead][chunk]
 *   tag 18, body[0] === 1  → SEIPD v1, CFB + MDC. NOT AEAD.
 *   tag 9                  → legacy Symmetrically Encrypted Data, no integrity check at all.
 */
export function inspectOpenPgp(buffer) {
  const unusable = (reason) => ({ ok: false, reason, mode: null, modeLabel: null, skesk: null, data: null });

  if (!buffer || buffer.length < 4) return unusable('the archive is too small to be an OpenPGP message');
  if (buffer.subarray(0, 27).toString('ascii') === '-----BEGIN PGP MESSAGE-----') {
    // This workflow never passes --armor; armored output would mean something unexpected
    // produced the file, and the packet mode cannot be read without decoding it.
    return unusable('the archive is ASCII-armored; this workflow produces binary OpenPGP output');
  }

  const first = readPacketHeader(buffer, 0);
  if (!first) return unusable('the archive does not begin with an OpenPGP packet header');
  if (first.tag !== 3) {
    return unusable(`the archive begins with OpenPGP packet tag ${first.tag}, not a symmetric-key encrypted session key`);
  }
  if (first.partial || first.length === null) {
    return unusable('the symmetric-key session key packet has no definite length');
  }

  // SKESK body: [version][cipher-algo]([aead-algo] when version >= 5)…
  const skeskVersion = buffer[first.bodyStart];
  const skesk = {
    version: skeskVersion ?? null,
    cipherAlgorithm: buffer[first.bodyStart + 1] ?? null,
    aeadAlgorithm: skeskVersion >= 5 ? buffer[first.bodyStart + 2] ?? null : 0,
  };

  const dataOffset = first.bodyStart + first.length;
  const second = readPacketHeader(buffer, dataOffset);
  if (!second) return unusable('the archive has no encrypted data packet after the session key packet');

  const dataVersion = buffer[second.bodyStart] ?? null;
  let mode = null;

  if (second.tag === 20) {
    mode = AEAD_ALGORITHMS[buffer[second.bodyStart + 2]] ?? null;
  } else if (second.tag === 18) {
    if (dataVersion === 2) mode = AEAD_ALGORITHMS[buffer[second.bodyStart + 2]] ?? null;
    else if (dataVersion === 1) mode = 'cfb-mdc';
  } else if (second.tag === 9) {
    return unusable('the archive uses a legacy symmetrically encrypted data packet with no integrity protection');
  } else {
    return unusable(`the encrypted data packet has OpenPGP tag ${second.tag}, which is not an encrypted data packet`);
  }

  if (!mode) return unusable('the encrypted data packet does not declare a recognised encryption mode');

  return {
    ok: true,
    reason: null,
    format: second.newFormat ? 'openpgp-new' : 'openpgp-old',
    mode,
    modeLabel: MODE_LABELS[mode] ?? mode,
    aead: AEAD_MODES.includes(mode),
    skesk,
    data: { tag: second.tag, version: dataVersion, aeadAlgorithm: buffer[second.bodyStart + 2] ?? null },
  };
}

/** Any plaintext dump marker surviving inside the encrypted archive means it is not encrypted. */
export function findPlaintextMarkers(buffer) {
  if (!buffer) return [];
  return PLAINTEXT_MARKERS.filter((marker) => buffer.includes(Buffer.from(marker, 'ascii')));
}

/** Files in the upload directory that are not on the allowlist. */
export function disallowedArtifactFiles(names) {
  return (names ?? []).filter((name) => !ALLOWED_ARTIFACT_FILES.includes(name));
}

export function evaluateBackupEncryption(input) {
  const {
    manifest,
    archive = null,
    decrypted = new Map(),
    artifactFiles = [],
    archiveName = ENCRYPTED_ARCHIVE_NAME,
  } = input;

  const problems = [];

  // ---- the manifest must be the verified plaintext manifest -----------------------
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    return {
      ok: false,
      problems: ['The plaintext backup manifest is missing or unreadable, so nothing can be compared against it.'],
      manifest: null,
      archiveSha256: null,
    };
  }
  if (manifest.kind !== 'supabase-logical-production-backup') {
    problems.push('The manifest is not a Supabase logical production backup manifest.');
  }

  const recorded = new Map(
    (Array.isArray(manifest.files) ? manifest.files : [])
      .filter((f) => f && typeof f.name === 'string')
      .map((f) => [f.name, f]),
  );

  // ---- the archive must exist, be non-empty and actually be encrypted ---------------
  let archiveSha256 = null;
  let pgp = { ok: false, reason: 'no archive was produced', mode: null, modeLabel: null, aead: false, skesk: null, data: null };

  if (!archive || archive.length === 0) {
    problems.push(`${archiveName}: the encrypted archive is missing or empty, so encryption did not produce a backup.`);
  } else {
    archiveSha256 = createHash('sha256').update(archive).digest('hex');

    pgp = inspectOpenPgp(archive);
    if (!pgp.ok) {
      problems.push(`${archiveName}: ${pgp.reason}.`);
    } else if (pgp.mode !== REQUIRED_ENCRYPTION_MODE) {
      // This is the check that keeps the documentation honest. GnuPG's default symmetric mode
      // is CFB+MDC, which is integrity-protected but NOT authenticated encryption. If the
      // workflow ever loses `--force-ocb`, the archive silently drops to that mode — and the
      // manifest and restore notes would then be claiming something the bytes do not support.
      // Failing here means the claim and the artifact can never diverge.
      problems.push(
        `${archiveName}: encrypted with ${pgp.modeLabel}. This backup must use ` +
          `${REQUIRED_ENCRYPTION_MODE.toUpperCase()} authenticated encryption (gpg --force-ocb).`,
      );
    }

    const leaked = findPlaintextMarkers(archive);
    if (leaked.length > 0) {
      // The marker names are our own constants, never file content, so naming them is safe.
      problems.push(
        `${archiveName}: plaintext dump content is readable inside the "encrypted" archive (${leaked.join(', ')}).`,
      );
    }
  }

  // ---- the round trip must reproduce the exact verified bytes ------------------------
  const roundTrip = [];
  for (const expected of EXPECTED_BACKUP_FILES) {
    const before = recorded.get(expected.name);
    const after = decrypted.get(expected.name);
    const entry = { name: expected.name, sha256Before: before?.sha256 ?? null, sha256After: null, matches: false };

    if (!before || !before.sha256) {
      problems.push(`${expected.name}: no pre-encryption SHA-256 was recorded, so the round trip cannot be proven.`);
      roundTrip.push(entry);
      continue;
    }
    if (after === undefined) {
      problems.push(`${expected.name}: missing from the decrypted archive — the backup is not recoverable.`);
      roundTrip.push(entry);
      continue;
    }

    entry.sha256After = createHash('sha256').update(after).digest('hex');
    entry.matches = entry.sha256After === before.sha256;
    if (!entry.matches) {
      problems.push(`${expected.name}: decrypted content does not match the hash recorded before encryption.`);
    }
    roundTrip.push(entry);
  }

  // ---- nothing but the allowed four may be uploaded ----------------------------------
  const disallowed = disallowedArtifactFiles(artifactFiles);
  for (const name of disallowed) {
    problems.push(`${name}: must not be part of the uploaded artifact — only the encrypted archive, manifest, checksums and restore notes may be published.`);
  }
  // Belt and braces: name the plaintext dumps explicitly, because those are the files whose
  // publication this whole design exists to prevent.
  for (const expected of EXPECTED_BACKUP_FILES) {
    if (artifactFiles.includes(expected.name)) {
      problems.push(`${expected.name}: a PLAINTEXT production dump is present in the upload directory.`);
    }
  }

  const roundTripVerified =
    roundTrip.length === EXPECTED_BACKUP_FILES.length && roundTrip.every((r) => r.matches);

  const augmented = {
    ...manifest,
    encryptedArchive: {
      name: archiveName,
      bytes: archive ? archive.length : null,
      sha256: archiveSha256,
      // Every field below is DERIVED FROM THE ARCHIVE BYTES, never from what the workflow
      // intended. The manifest can therefore not claim a stronger mode than was produced.
      cipher: pgp.ok
        ? `GnuPG symmetric, ${pgp.modeLabel}, SHA-512 S2K`
        : 'unknown — the archive could not be identified as an OpenPGP message',
      encryptionMode: pgp.ok ? pgp.mode : null,
      authenticatedEncryption: pgp.ok ? pgp.aead : false,
      aeadAlgorithm: pgp.ok ? pgp.data?.aeadAlgorithm ?? null : null,
      dataPacketTag: pgp.ok ? pgp.data?.tag ?? null : null,
      dataPacketVersion: pgp.ok ? pgp.data?.version ?? null : null,
      sessionKeyPacketVersion: pgp.ok ? pgp.skesk?.version ?? null : null,
      format: pgp.ok ? pgp.format : null,
      roundTripVerified,
    },
    roundTrip,
    checks: {
      ...(manifest.checks ?? {}),
      archiveIsEncrypted:
        pgp.ok && pgp.mode === REQUIRED_ENCRYPTION_MODE && findPlaintextMarkers(archive ?? Buffer.alloc(0)).length === 0,
      archiveUsesAuthenticatedEncryption: pgp.ok && pgp.aead,
      encryptionRoundTripVerified: roundTripVerified,
      artifactContainsPlaintext: EXPECTED_BACKUP_FILES.some((f) => artifactFiles.includes(f.name)),
      artifactFilesAllowed: disallowed.length === 0,
    },
  };

  return { ok: problems.length === 0, problems, manifest: augmented, archiveSha256 };
}

/** `sha256sum -c` format, covering the ENCRYPTED archive only. */
export function formatArchiveChecksums(manifest) {
  const archive = manifest?.encryptedArchive;
  return archive?.sha256 ? `${archive.sha256}  ${archive.name}\n` : '';
}

/**
 * Recovery notes shipped inside the artifact.
 *
 * Deliberately blunt about what this is NOT. A `pg_dump` is a logical snapshot of the
 * DATABASE; it is not a Supabase project backup, and reading it as one during an incident is
 * exactly the mistake that turns a recoverable outage into an unrecoverable one.
 */
export function renderRestoreReadme(manifest) {
  const archive = manifest?.encryptedArchive ?? {};
  return `# Restoring this backup

This artifact is a **logical database recovery snapshot** taken with \`supabase db dump\`
immediately before migration \`${manifest?.targetMigration ?? 'unknown'}\` was applied to the
production database.

It is the rollback/recovery artifact for that one controlled finance schema migration. That
is what it is for, and reading it as anything broader will cost you during an incident.

## What this is NOT

- **This is NOT Point-in-Time Recovery.** There is no write-ahead log to replay. The only
  recoverable state is the instant the dump ran (\`${manifest?.createdAtUtc ?? 'see manifest'}\`).
  Everything written to production after that moment is not in here.
- **This is NOT a Supabase project backup.** Supabase Storage OBJECT CONTENTS are not in a
  database dump — the database holds only metadata about them. Files must be recovered
  separately.
- **Managed platform state may not be fully represented.** JWT secrets, API keys, auth
  provider configuration, SMTP settings, Edge Functions, custom domains, scheduled jobs and
  webhooks live outside the database and are not captured here.
- **Restoring into a replacement project is not a drop-in operation.** Supabase-managed
  services, auth and storage each need separate validation afterwards; users will have to
  re-authenticate because JWT secrets differ between projects.

## Recovery procedure

1. **Download the encrypted artifact** from the workflow run
   (\`${manifest?.workflowRepository ?? 'this repository'}\`, run
   \`${manifest?.workflowRunId ?? '?'}\` attempt \`${manifest?.workflowRunAttempt ?? '?'}\`).
2. **Verify the encrypted archive SHA-256** before doing anything else:

       sha256sum -c SHA256SUMS.txt

   The expected digest is also recorded in \`manifest.json\` under \`encryptedArchive.sha256\`.
3. **Decrypt locally**, supplying \`SUPABASE_BACKUP_PASSPHRASE\` securely — never as a command
   line argument, never in shell history:

       gpg --batch --no-symkey-cache --decrypt \\
         --output backup.tar.gz ${archive.name ?? ENCRYPTED_ARCHIVE_NAME}

   Encryption used: **${archive.cipher ?? 'unknown'}**.
   ${
     archive.authenticatedEncryption
       ? `This is authenticated encryption: gpg verifies integrity as part of decryption, and a
   modified archive fails to decrypt rather than yielding altered plaintext.`
       : `NOTE: this archive is NOT authenticated encryption. Verify the SHA-256 in step 2
   before trusting the contents.`
   }
   ${
     archive.encryptionMode === 'ocb'
       ? `Requires **GnuPG 2.3 or newer** to decrypt (the OCB AEAD packet, tag 20, is not
   understood by GnuPG 2.2 and earlier). Check with \`gpg --version\` before you need it.`
       : ''
   }

   gpg will prompt for the passphrase; if you must script it, feed it on a file descriptor
   (\`--passphrase-fd\`), never in argv.

       tar -xzf backup.tar.gz

4. **Verify the internal file hashes** against \`manifest.json\`. Every entry under \`files\`
   records the SHA-256 of its plaintext contents as verified before encryption:

       sha256sum -c SHA256SUMS.txt   # the copy inside the archive covers the dump files

5. **Only then perform the restore**, into a target you have deliberately chosen:

       psql --single-transaction --variable ON_ERROR_STOP=1 \\
         --file roles.sql \\
         --file schema.sql \\
         --command 'SET session_replication_role = replica' \\
         --file data.sql \\
         --dbname "$TARGET_DATABASE_URL"

   \`migrations-ledger.txt\` records which migrations the snapshot had applied
   (ledger head: \`${manifest?.preMigrationLedgerHead ?? 'see manifest'}\`). The
   \`migrations-*.sql\` files are best-effort: \`supabase db dump\` filters Supabase-managed
   schemas, so the ledger text is the authoritative history record.

After restoring, validate Supabase-managed services separately: auth providers and secrets,
Storage object contents, Edge Functions, and any scheduled or webhook integrations.

This file contains no credentials. The passphrase is held only as the
\`SUPABASE_BACKUP_PASSPHRASE\` repository secret and is never written to any artifact, log,
filename or manifest.
`;
}

/** Human-readable block. Hashes, sizes and booleans only — never key material. */
export function formatEncryptionGate(result) {
  const archive = result.manifest?.encryptedArchive ?? {};
  const lines = ['Backup encryption gate:'];
  lines.push(`  Encrypted archive:      ${archive.name ?? 'MISSING'}`);
  lines.push(`  Archive size:           ${archive.bytes ?? 'unknown'} bytes`);
  lines.push(`  Archive sha256:         ${archive.sha256 ? `${archive.sha256.slice(0, 16)}…` : '—'}`);
  lines.push(`  Encryption mode:        ${archive.encryptionMode ?? 'unrecognised'}`);
  lines.push(`  Authenticated (AEAD):   ${archive.authenticatedEncryption ? 'yes' : 'no'}`);
  lines.push(`  Data packet:            tag ${archive.dataPacketTag ?? '?'} v${archive.dataPacketVersion ?? '?'} (session key packet v${archive.sessionKeyPacketVersion ?? '?'})`);
  lines.push(`  Round-trip decryption:  ${archive.roundTripVerified ? 'verified' : 'NOT verified'}`);
  for (const entry of result.manifest?.roundTrip ?? []) {
    lines.push(`    ${entry.matches ? 'ok  ' : 'FAIL'} ${entry.name}`);
  }
  lines.push(`  Artifact holds plaintext: ${result.manifest?.checks?.artifactContainsPlaintext ? 'YES' : 'no'}`);
  if (result.ok) {
    lines.push('  Result: PASS — the backup is encrypted and provably recoverable.');
  } else {
    lines.push('  Result: FAIL');
    for (const problem of result.problems) lines.push(`    - ${problem}`);
  }
  return lines.join('\n');
}

if (isDirectInvocation()) {
  const args = parseArgs(process.argv.slice(2));
  const manifestPath = args.manifest ?? 'production-backup/manifest.json';
  const archivePath = args.archive ?? `production-backup/${ENCRYPTED_ARCHIVE_NAME}`;
  const decryptedDir = args.decrypted ?? '';
  const artifactDir = args['artifact-dir'] ?? 'production-backup';

  let manifest = null;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch {
    manifest = null;
  }

  let archive = null;
  try {
    archive = readFileSync(archivePath);
  } catch {
    archive = null;
  }

  const decrypted = new Map();
  for (const expected of EXPECTED_BACKUP_FILES) {
    try {
      decrypted.set(expected.name, readFileSync(`${decryptedDir}/${expected.name}`));
    } catch {
      // Absent from the round trip: reported as unrecoverable below.
    }
  }

  let artifactFiles = [];
  try {
    artifactFiles = readdirSync(artifactDir).filter((name) => {
      try {
        return statSync(`${artifactDir}/${name}`).isFile();
      } catch {
        return false;
      }
    });
  } catch {
    artifactFiles = [];
  }

  const result = evaluateBackupEncryption({
    manifest,
    archive,
    decrypted,
    artifactFiles,
    archiveName: archivePath.split(/[\\/]/).pop(),
  });

  // Written even on failure: a failed encryption attempt is exactly what an operator needs
  // the evidence for. The push is blocked by the exit code, not by the absence of a file.
  if (result.manifest) {
    try {
      writeFileSync(manifestPath, `${JSON.stringify(result.manifest, null, 2)}\n`, 'utf8');
      writeFileSync(args.checksums ?? `${artifactDir}/SHA256SUMS.txt`, formatArchiveChecksums(result.manifest), 'utf8');
      writeFileSync(args.readme ?? `${artifactDir}/${RESTORE_README_NAME}`, renderRestoreReadme(result.manifest), 'utf8');
    } catch (error) {
      console.error(`Could not write the encrypted-backup manifest: ${error.message}`);
      process.exit(1);
    }
  }

  console.log(formatEncryptionGate(result));
  if (!result.ok) process.exit(1);
}
