// Gate: refuse to apply a production migration unless a real restore source is verifiable.
//
//   node .github/scripts/verify-supabase-backups.mjs <backups.json> [<http-status>]
//
// The workflow fetches GET /v1/projects/{ref}/database/backups (READ-ONLY) into a temp file
// and hands it here. This script NEVER performs network I/O, never creates a backup, never
// restores one, and never sees the access token — it only parses text. Keeping the parsing
// out of a jq/bash one-liner is what makes it testable against fixtures rather than only
// ever being proven by a real production run.
//
// The gate FAILS CLOSED. "I could not tell" and "there is no restore point" produce the same
// answer, because a migration applied without a verified way back is the one case where
// being wrong is unrecoverable.
//
// Accepted evidence (either is sufficient):
//   A. PITR is enabled AND a usable recovery range is reported
//   B. at least one backup with status COMPLETED

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// True only when this file IS the entry point. Comparing resolved file URLs matters:
// a suffix check would also match test-verify-supabase-backups.mjs, which would make the
// CLI block run during unit tests and exit on the first failing fixture.
function isDirectInvocation() {
  return Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
}

/** Accept a timestamp only if it actually parses; a malformed date is not evidence. */
function parseTimestamp(value) {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function pickRecoveryRange(physical) {
  if (!physical || typeof physical !== 'object') return null;

  // Field names differ across API revisions; accept the documented ones and fall back
  // rather than declaring a real PITR window unverifiable over a rename.
  const earliest =
    parseTimestamp(physical.earliest_physical_backup_date_utc) ??
    parseTimestamp(physical.earliest_physical_backup_date) ??
    null;
  const latest =
    parseTimestamp(physical.latest_physical_backup_date_utc) ??
    parseTimestamp(physical.latest_physical_backup_date) ??
    null;

  if (!latest) return null;
  // A range that ends before it begins is corrupt, not a restore point.
  if (earliest && earliest.getTime() > latest.getTime()) return null;
  return { earliest, latest };
}

export function evaluateBackupGate(rawBody, httpStatus = 200) {
  const status = Number(httpStatus);
  const summary = {
    ok: false,
    pitrEnabled: false,
    completedBackupAvailable: false,
    latestRestorePoint: null,
    reason: null,
  };

  if (!Number.isFinite(status) || status !== 200) {
    summary.reason = `Backup API returned HTTP ${Number.isFinite(status) ? status : 'an unreadable status'}.`;
    return summary;
  }

  let body;
  try {
    body = JSON.parse(String(rawBody ?? ''));
  } catch {
    summary.reason = 'Backup API response was not valid JSON.';
    return summary;
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    summary.reason = 'Backup API response was not a JSON object.';
    return summary;
  }

  // ---- Evidence A: point-in-time recovery -------------------------------------
  summary.pitrEnabled = body.pitr_enabled === true;
  const range = pickRecoveryRange(body.physical_backup_data);
  const pitrUsable = summary.pitrEnabled && range !== null;

  // ---- Evidence B: a completed backup -----------------------------------------
  const backups = Array.isArray(body.backups) ? body.backups : [];
  const completed = backups.filter(
    (b) => b && typeof b === 'object' && String(b.status ?? '').toUpperCase() === 'COMPLETED',
  );
  summary.completedBackupAvailable = completed.length > 0;

  const completedTimes = completed
    .map((b) => parseTimestamp(b.inserted_at) ?? parseTimestamp(b.created_at))
    .filter(Boolean)
    .sort((a, b) => b.getTime() - a.getTime());

  // Report the most recent point we can actually name, preferring the PITR window
  // because it is the finer-grained restore source.
  const newest = pitrUsable ? range.latest : completedTimes[0] ?? null;
  summary.latestRestorePoint = newest ? newest.toISOString() : null;

  if (pitrUsable || summary.completedBackupAvailable) {
    summary.ok = true;
    return summary;
  }

  if (summary.pitrEnabled && !range) {
    summary.reason = 'PITR is enabled but no usable recovery range was reported.';
  } else if (backups.length > 0) {
    summary.reason = `No COMPLETED backup found (${backups.length} backup entr${backups.length === 1 ? 'y' : 'ies'}, none completed).`;
  } else {
    summary.reason = 'No backups and no usable PITR recovery range were reported.';
  }
  return summary;
}

/** Human-readable block. Contains only booleans and a timestamp — never a secret. */
export function formatBackupGate(summary) {
  return [
    'Backup gate:',
    `  PITR enabled: ${summary.pitrEnabled ? 'yes' : 'no'}`,
    `  Completed backup available: ${summary.completedBackupAvailable ? 'yes' : 'no'}`,
    `  Latest available backup/restore point: ${summary.latestRestorePoint ?? 'unknown'}`,
    `  Result: ${summary.ok ? 'PASS' : `FAIL — ${summary.reason}`}`,
  ].join('\n');
}

if (isDirectInvocation()) {
  const path = process.argv[2];
  const httpStatus = process.argv[3] ?? '200';

  let raw = '';
  try {
    raw = readFileSync(path, 'utf8');
  } catch {
    // A missing file means the fetch step failed; that is a failed gate, not a crash.
    raw = '';
  }

  const summary = evaluateBackupGate(raw, httpStatus);
  console.log(formatBackupGate(summary));
  if (!summary.ok) process.exit(1);
}
