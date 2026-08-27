// Gate: verify the same-run LOGICAL production backup before a migration is allowed to write.
//
//   node .github/scripts/verify-supabase-logical-backup.mjs \
//     --dir production-backup \
//     --status production-backup/dump-status.txt \
//     --ledger supabase-migration-list-reconciled.txt \
//     --target-migration 20260826120000_owner_historical_paid_invoice.sql \
//     [--manifest production-backup/manifest.json] \
//     [--checksums production-backup/SHA256SUMS.txt]
//
// WHY THIS EXISTS
// ---------------
// The project is on the Supabase FREE plan. Free projects have no managed daily backups and
// no Point-in-Time Recovery, so GET /v1/projects/{ref}/database/backups reports nothing and
// the managed-backup gate can never pass. Supabase's own documented answer for Free projects
// is to take a logical export with `supabase db dump` and keep it off-site.
//
// A logical dump is NOT PITR. It is a single consistent-per-table snapshot taken at one
// moment, with no write-ahead log to replay, so the recovery point is "the instant the dump
// ran" and never finer. What it DOES provide is the thing the apply gate actually needs: a
// verified, checksummed, retrievable copy of roles, schema, public data and the migration
// ledger as they existed immediately before this controlled migration wrote anything.
//
// This script performs NO network I/O, never connects to a database, never sees a token, and
// never prints one. It reads files that the workflow already produced and answers one
// question: is there a complete, non-empty, checksummed backup on disk for THIS run?
//
// The gate FAILS CLOSED. Missing file, empty file, non-zero dump exit status, absent
// completion sentinel and unreadable ledger all produce the same verdict: not a backup.

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { remoteVersions } from './lib/supabase-migration-history.mjs';

/**
 * The expected backup bundle. This table is the SINGLE SOURCE OF TRUTH for what the
 * workflow must dump and what this gate must find; the workflow static test imports it and
 * asserts the YAML dumps exactly these files with exactly these commands, so the two can
 * never drift.
 *
 * `markerSeverity` is deliberately not uniform, and the asymmetry is the honest part:
 *
 *  - 'required' is used only where an absent marker can ONLY mean a broken dump. Production
 *    has tables, so a schema dump with no CREATE statement is broken. Production has applied
 *    migrations, so a ledger with no 14-digit version is broken.
 *
 *  - 'advisory' is used where an empty-looking result has a legitimate explanation. A project
 *    with no custom roles produces a roles dump containing no ROLE statement. And
 *    `supabase db dump` filters Supabase-managed schemas by default, so a
 *    `--schema supabase_migrations` dump may come back as preamble only depending on CLI
 *    internals. Failing the apply over either would block a legitimate migration on a
 *    guess, so both are recorded in the manifest and printed as warnings instead.
 *
 *    The migration history is therefore ALSO captured as `migrations-ledger.txt` — the
 *    output of the read-only `supabase migration list` — which is required and is the
 *    authoritative pre-migration record of the ledger regardless of what the SQL dump of
 *    supabase_migrations contains.
 */
export const EXPECTED_BACKUP_FILES = [
  {
    name: 'roles.sql',
    label: 'database roles',
    minBytes: 32,
    marker: /\bROLE\b/i,
    markerSeverity: 'advisory',
    markerNote: 'a project with no custom roles legitimately dumps no ROLE statement',
    dumpArgs: ['--role-only'],
  },
  {
    name: 'schema.sql',
    label: 'schema DDL (all non-managed schemas)',
    minBytes: 1024,
    marker: /CREATE /i,
    markerSeverity: 'required',
    markerNote: 'production has tables; a schema dump with no CREATE statement is broken',
    dumpArgs: [],
  },
  {
    name: 'data.sql',
    label: 'public table data',
    minBytes: 32,
    marker: null,
    markerSeverity: 'none',
    markerNote: 'no content marker: a legitimately empty table set still produces a valid dump',
    dumpArgs: ['--data-only', '--use-copy', '--schema', 'public'],
  },
  {
    name: 'migrations-schema.sql',
    label: 'supabase_migrations schema DDL',
    minBytes: 32,
    marker: /supabase_migrations/i,
    markerSeverity: 'advisory',
    markerNote: 'supabase db dump filters managed schemas; the ledger text file is authoritative',
    dumpArgs: ['--schema', 'supabase_migrations'],
  },
  {
    name: 'migrations-data.sql',
    label: 'supabase_migrations history rows',
    minBytes: 32,
    marker: /schema_migrations/i,
    markerSeverity: 'advisory',
    markerNote: 'supabase db dump filters managed schemas; the ledger text file is authoritative',
    dumpArgs: ['--data-only', '--use-copy', '--schema', 'supabase_migrations'],
  },
  {
    name: 'migrations-ledger.txt',
    label: 'pre-migration ledger (supabase migration list)',
    minBytes: 32,
    marker: /\d{14}/,
    markerSeverity: 'required',
    markerNote: 'production has applied migrations; a ledger with no version is broken',
    dumpArgs: null,
  },
];

/**
 * The exact `run_dump` invocation the workflow must contain for a dumped file.
 *
 * `dumpArgs: null` marks the one bundle member that is NOT a `db dump` product — the ledger
 * text, copied from the read-only `supabase migration list` output captured earlier in the
 * run. The workflow static test builds its expectations from these values, so the YAML and
 * this table cannot drift.
 */
export function dumpInvocation(entry) {
  return entry.dumpArgs === null ? null : ['run_dump', entry.name, ...entry.dumpArgs].join(' ');
}

/** Files the manifest describes but which are not themselves dumped. */
export const MANIFEST_FILENAME = 'manifest.json';
export const CHECKSUMS_FILENAME = 'SHA256SUMS.txt';

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
 * Parse the dump status file the workflow writes.
 *
 * Format is one `name=exitcode` line per dump plus a final `__complete__=0` sentinel. The
 * sentinel matters: the backup step runs under `set -e`, so a failed dump aborts the step
 * and the sentinel is simply never written. Its absence therefore proves an incomplete run
 * even when every line already present says 0.
 */
export function parseDumpStatus(raw) {
  const statuses = new Map();
  for (const line of String(raw ?? '').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    statuses.set(trimmed.slice(0, index).trim(), trimmed.slice(index + 1).trim());
  }
  return statuses;
}

export const COMPLETION_SENTINEL = '__complete__';

/** Highest remote version in the pre-migration ledger, or null when none is readable. */
export function ledgerHead(listOutput) {
  const versions = [...remoteVersions(listOutput)].sort();
  return versions.length > 0 ? { head: versions[versions.length - 1], count: versions.length } : null;
}

/**
 * Secret scan.
 *
 * Values arrive from the environment and are NEVER echoed, never written to the manifest and
 * never included in a failure message — only the filename is reported. Short values are
 * ignored because a two-character "secret" would match everywhere and turn the scan into
 * noise rather than a signal.
 */
export function scanForSecrets(files, secrets) {
  const meaningful = (secrets ?? []).filter((s) => typeof s === 'string' && s.length >= 8);
  const hits = [];
  for (const file of files) {
    for (const secret of meaningful) {
      if (file.text.includes(secret)) {
        hits.push(file.name);
        break;
      }
    }
  }
  return { scanned: meaningful.length, hits };
}

/** Filenames must never carry credential material or path separators. */
export function filenameIsSafe(name, secrets) {
  if (/[\\/]/.test(name)) return false;
  return !(secrets ?? []).some((s) => typeof s === 'string' && s.length >= 8 && name.includes(s));
}

export function evaluateLogicalBackup(input) {
  const {
    dir,
    files,
    statusRaw,
    ledgerRaw,
    targetMigration = null,
    projectRef = null,
    runId = null,
    runAttempt = null,
    repository = null,
    cliVersion = null,
    createdAtUtc = null,
    secrets = [],
  } = input;

  const problems = [];
  const warnings = [];
  const statuses = parseDumpStatus(statusRaw);

  // ---- dump exit statuses -------------------------------------------------------
  if (statuses.get(COMPLETION_SENTINEL) !== '0') {
    problems.push(
      'The backup step did not record its completion sentinel, so at least one dump command did not finish.',
    );
  }

  // ---- per-file existence, size, content, checksum -------------------------------
  const manifestFiles = [];
  const readable = [];

  for (const expected of EXPECTED_BACKUP_FILES) {
    const entry = {
      name: expected.name,
      label: expected.label,
      bytes: null,
      sha256: null,
      dumpExitStatus: statuses.has(expected.name) ? statuses.get(expected.name) : null,
      markerSeverity: expected.markerSeverity,
      markerFound: null,
    };

    const found = files.get(expected.name);

    if (entry.dumpExitStatus === null) {
      problems.push(`${expected.name}: no dump exit status was recorded.`);
    } else if (entry.dumpExitStatus !== '0') {
      problems.push(`${expected.name}: dump command exited with status ${entry.dumpExitStatus}.`);
    }

    if (!filenameIsSafe(expected.name, secrets)) {
      problems.push(`${expected.name}: filename is not safe to publish as an artifact.`);
    }

    if (found === undefined) {
      problems.push(`${expected.name}: expected backup file is missing (${expected.label}).`);
      manifestFiles.push(entry);
      continue;
    }

    entry.bytes = found.bytes;
    entry.sha256 = createHash('sha256').update(found.buffer).digest('hex');
    readable.push({ name: expected.name, text: found.text });

    if (found.bytes === 0) {
      problems.push(`${expected.name}: backup file is empty (${expected.label}).`);
    } else if (found.bytes < expected.minBytes) {
      problems.push(
        `${expected.name}: only ${found.bytes} bytes, below the ${expected.minBytes}-byte minimum for ${expected.label}.`,
      );
    }

    if (expected.marker) {
      entry.markerFound = expected.marker.test(found.text);
      if (!entry.markerFound && expected.markerSeverity === 'required') {
        problems.push(
          `${expected.name}: expected content was not found — ${expected.markerNote}.`,
        );
      } else if (!entry.markerFound) {
        warnings.push(
          `${expected.name}: expected content was not found (advisory — ${expected.markerNote}).`,
        );
      }
    }

    manifestFiles.push(entry);
  }

  // ---- secret scan ---------------------------------------------------------------
  const secretScan = scanForSecrets(readable, secrets);
  for (const name of secretScan.hits) {
    // The value is never named. Reporting the filename is enough to act on and is the
    // most that can be printed without becoming the leak it is checking for.
    problems.push(`${name}: contains credential material supplied to this workflow.`);
  }

  // ---- pre-migration ledger head --------------------------------------------------
  const ledger = ledgerHead(ledgerRaw);
  if (!ledger) {
    problems.push('The pre-migration ledger could not be read, so no ledger head can be recorded.');
  }

  const manifest = {
    kind: 'supabase-logical-production-backup',
    manifestVersion: 1,
    // A logical dump is not PITR; the manifest says so in the artifact itself so nobody
    // reading it later mistakes this for a point-in-time recovery source.
    recoveryModel:
      'logical snapshot taken with `supabase db dump` — restores to the instant the dump ran; no WAL replay, not Point-in-Time Recovery',
    createdAtUtc: createdAtUtc ?? new Date().toISOString(),
    sourceProjectRef: projectRef,
    workflowRepository: repository,
    workflowRunId: runId,
    workflowRunAttempt: runAttempt,
    supabaseCliVersion: cliVersion,
    targetMigration,
    targetMigrationVersion: targetMigration ? String(targetMigration).split('_')[0] : null,
    preMigrationLedgerHead: ledger ? ledger.head : null,
    preMigrationLedgerCount: ledger ? ledger.count : null,
    files: manifestFiles,
    checks: {
      dumpCompletionSentinel: statuses.get(COMPLETION_SENTINEL) === '0',
      allFilesPresent: manifestFiles.every((f) => f.bytes !== null),
      allFilesNonEmpty: manifestFiles.every((f) => typeof f.bytes === 'number' && f.bytes > 0),
      secretValuesScanned: secretScan.scanned,
      secretValuesFound: secretScan.hits.length,
    },
    warnings,
  };

  return { ok: problems.length === 0, problems, warnings, manifest, dir };
}

/** SHA256SUMS.txt in the standard `sha256sum -c` format, for offline verification. */
export function formatChecksums(manifest) {
  return `${manifest.files
    .filter((f) => f.sha256)
    .map((f) => `${f.sha256}  ${f.name}`)
    .join('\n')}\n`;
}

/** Human-readable block. Built only from booleans, sizes, hashes and filenames. */
export function formatLogicalBackupGate(result) {
  const lines = ['Logical production backup gate:'];
  for (const file of result.manifest.files) {
    const size = file.bytes === null ? 'MISSING' : `${file.bytes} bytes`;
    const hash = file.sha256 ? `${file.sha256.slice(0, 16)}…` : '—';
    lines.push(`  ${file.name.padEnd(24)} ${size.padEnd(16)} sha256 ${hash}`);
  }
  lines.push(`  Pre-migration ledger head: ${result.manifest.preMigrationLedgerHead ?? 'unknown'}`);
  lines.push(`  Credential values scanned: ${result.manifest.checks.secretValuesScanned}`);
  for (const warning of result.warnings) lines.push(`  WARNING: ${warning}`);
  if (result.ok) {
    lines.push('  Result: PASS — a verified logical backup exists for this run.');
  } else {
    lines.push('  Result: FAIL');
    for (const problem of result.problems) lines.push(`    - ${problem}`);
  }
  return lines.join('\n');
}

if (isDirectInvocation()) {
  const args = parseArgs(process.argv.slice(2));
  const dir = args.dir ?? 'production-backup';

  const files = new Map();
  for (const expected of EXPECTED_BACKUP_FILES) {
    const path = `${dir}/${expected.name}`;
    try {
      const buffer = readFileSync(path);
      files.set(expected.name, {
        buffer,
        bytes: statSync(path).size,
        text: buffer.toString('utf8'),
      });
    } catch {
      // A missing or unreadable file is a failed gate, not a crash.
    }
  }

  const readOr = (path, fallback = '') => {
    try {
      return readFileSync(path, 'utf8');
    } catch {
      return fallback;
    }
  };

  const result = evaluateLogicalBackup({
    dir,
    files,
    statusRaw: readOr(args.status ?? `${dir}/dump-status.txt`),
    ledgerRaw: readOr(args.ledger ?? ''),
    targetMigration: args['target-migration'] ?? null,
    projectRef: process.env.SUPABASE_PROJECT_ID ?? null,
    runId: process.env.GITHUB_RUN_ID ?? null,
    runAttempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
    repository: process.env.GITHUB_REPOSITORY ?? null,
    cliVersion: process.env.SUPABASE_CLI_VERSION ?? null,
    createdAtUtc: process.env.BACKUP_CREATED_AT_UTC || null,
    // Read straight from the environment and never echoed. The manifest records only how
    // many values were scanned, never any value.
    secrets: [process.env.SUPABASE_DB_PASSWORD, process.env.SUPABASE_ACCESS_TOKEN].filter(Boolean),
  });

  // The manifest is written even on failure: a failed backup attempt is exactly the thing an
  // operator needs the evidence for. The push is blocked by the exit code, not by the file.
  const manifestPath = args.manifest ?? `${dir}/${MANIFEST_FILENAME}`;
  const checksumsPath = args.checksums ?? `${dir}/${CHECKSUMS_FILENAME}`;
  try {
    writeFileSync(manifestPath, `${JSON.stringify(result.manifest, null, 2)}\n`, 'utf8');
    writeFileSync(checksumsPath, formatChecksums(result.manifest), 'utf8');
  } catch (error) {
    console.error(`Could not write the backup manifest: ${error.message}`);
    process.exit(1);
  }

  console.log(formatLogicalBackupGate(result));
  if (!result.ok) process.exit(1);
}
